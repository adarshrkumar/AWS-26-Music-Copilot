import { nanoid } from 'nanoid';
import { z } from 'zod';
import type { Song } from '@/db/types';
import { getSong } from '@/lib/songs';
import { getUnauthorizedError } from '@/lib/status-responses';
import { proposePhrases } from '@/lib/theory';
import { addPhraseSuggestion, explainPhrase, getPhraseSuggestions, setPhraseSuggestionStatus } from '@/lib/modules/autofill';
import { setNotes } from '@/lib/modules/editor';

import type { APIRoute } from 'astro';

type Section = Song['sections'][number];
type Note = Section['notes'][number];

const pitchSchema = z.string().regex(/^[A-G][#b]?[0-9]$/);

const phraseValueSchema = z.object({
    scale: z.string(),
    chord: z.string(),
    notes: z.array(z.object({ beat: z.number(), duration: z.number(), pitch: pitchSchema })),
});

const querySchema = z.object({
    songId: z.string().min(1),
    sectionId: z.string().min(1),
    bar: z.coerce.number().int().min(1),
});

const proposeSchema = z.object({
    songId: z.string().min(1),
    sectionId: z.string().min(1),
    bar: z.number().int().min(1),
});

const statusSchema = z.object({
    songId: z.string().min(1),
    suggestionId: z.string().min(1),
    status: z.enum(['accepted', 'rejected']),
    pitches: z.array(pitchSchema).optional(),
});

function json(body: object, status = 200): Response {
    return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

function chordsForBar(section: Section, bar: number): { beat: number; name: string }[] {
    const inBar = section.chords.filter(chord => chord.bar === bar).map(chord => ({ beat: chord.beat, name: chord.name }));
    if (inBar.length) return inBar;

    let carried: { bar: number; beat: number; name: string } | null = null;

    for (const chord of section.chords) {
        if (chord.bar >= bar) continue;
        if (!carried || chord.bar > carried.bar || (chord.bar === carried.bar && chord.beat > carried.beat)) carried = chord;
    }

    return carried ? [{ beat: 1, name: carried.name }] : [];
}

function fallbackReason(chord: string, scale: string, chordTones: string[]): string {
    return `Chord tones (${chordTones.join(', ')}) land on the strong beats so the phrase outlines ${chord}, and the notes between them come from the ${scale} scale.`;
}

function errorResponse(error: Error): Response {
    if (error instanceof z.ZodError) return json({ error: 'Validation error', details: error.errors }, 400);
    console.error('Autofill API error:', error);
    return json({ error: 'Internal server error' }, 500);
}

export const GET: APIRoute = async ({ locals, url }) => {
    if (!locals.user) return getUnauthorizedError();

    const parsed = querySchema.safeParse(Object.fromEntries(url.searchParams));
    if (!parsed.success) return errorResponse(parsed.error);

    return json({ suggestions: await getPhraseSuggestions(locals.user.id, parsed.data.songId, parsed.data.sectionId, parsed.data.bar) });
};

export const POST: APIRoute = async ({ locals, request }) => {
    if (!locals.user) return getUnauthorizedError();

    const parsed = proposeSchema.safeParse(await request.json());
    if (!parsed.success) return errorResponse(parsed.error);

    const { songId, sectionId, bar } = parsed.data;
    const song = await getSong(locals.user.id, songId);
    const section = song?.sections.find(candidate => candidate.id === sectionId);
    if (!song || !section) return json({ error: 'Song or section not found' }, 404);
    if (bar > section.bars) return json({ error: `This section has ${section.bars} bars.` }, 400);

    const chords = chordsForBar(section, bar);
    if (!chords.length) return json({ error: 'Add a chord at or before this bar first.' }, 422);

    const proposals = proposePhrases(song.key, chords);
    if (!proposals) return json({ error: 'A chord in this bar is not recognized by the theory engine.' }, 422);

    const created: Song['suggestions'] = [];

    for (const proposal of proposals) {
        const phrase = proposal.notes.map(note => note.pitch).join(' ');
        let reason = fallbackReason(proposal.chord, proposal.scale, proposal.chordTones);

        try {
            reason = await explainPhrase(proposal.chord, proposal.scale, phrase, proposal.chordTones);
        } catch (error) {
            console.error('Autofill explanation failed, using the rule-based reason:', error);
        }

        const suggestion: Song['suggestions'][number] = {
            id: nanoid(),
            sectionId,
            bar,
            kind: 'phrase',
            value: JSON.stringify({ scale: proposal.scale, chord: proposal.chord, notes: proposal.notes }),
            reason: `${reason} (${proposal.keyLabel})`,
            status: 'pending',
            createdAt: new Date().toISOString(),
        };

        await addPhraseSuggestion(locals.user.id, songId, suggestion);
        created.push(suggestion);
    }

    return json({ suggestions: created }, 201);
};

export const PUT: APIRoute = async ({ locals, request }) => {
    if (!locals.user) return getUnauthorizedError();

    const parsed = statusSchema.safeParse(await request.json());
    if (!parsed.success) return errorResponse(parsed.error);

    const { songId, suggestionId, status, pitches } = parsed.data;
    const song = await getSong(locals.user.id, songId);
    const suggestion = song?.suggestions.find(candidate => candidate.id === suggestionId && candidate.kind === 'phrase');
    if (!song || !suggestion) return json({ error: 'Suggestion not found' }, 404);

    let skipped = 0;

    if (status === 'accepted') {
        const section = song.sections.find(candidate => candidate.id === suggestion.sectionId);
        if (!section) return json({ error: 'Section not found' }, 404);

        const phrase = phraseValueSchema.safeParse(JSON.parse(suggestion.value));
        if (!phrase.success) return errorResponse(phrase.error);
        if (pitches && pitches.length !== phrase.data.notes.length) return json({ error: `Enter ${phrase.data.notes.length} pitches, one for each note.` }, 400);

        const notes: Note[] = [...section.notes];

        phrase.data.notes.forEach((note, index) => {
            const occupied = notes.some(existing => existing.bar === suggestion.bar && existing.beat === note.beat);

            if (occupied) skipped += 1;
            else notes.push({ bar: suggestion.bar, beat: note.beat, duration: note.duration, pitch: pitches?.[index] ?? note.pitch, string: null, fret: null });
        });

        await setNotes(locals.user.id, songId, suggestion.sectionId, notes);
    }

    await setPhraseSuggestionStatus(locals.user.id, songId, suggestionId, status);
    return json({ status, skipped });
};
