import { nanoid } from 'nanoid';
import { z } from 'zod';
import { getItem } from '@/db/helpers';
import { songTable } from '@/db/schemas';
import type { Song } from '@/db/types';
import { getServerError, getUnauthorizedError } from '@/lib/status-responses';
import { proposePhrases } from '@/lib/theory';
import { addPhraseSuggestion, explainPhrase, getPhraseSuggestions, setPhraseSuggestionStatus } from '@/lib/modules/autofill';
import { setNotes } from '@/lib/modules/editor';

import type { APIContext } from 'astro';

const pitchSchema = z.string().regex(/^[A-G][#b]?[0-9]$/);

export const GET = async ({ locals, url }: APIContext): Promise<Response> => {
    if (!locals.user) return getUnauthorizedError();

    const parsed = z.object({ songId: z.string().min(1), sectionId: z.string().min(1), bar: z.string().transform(value => parseInt(value, 10)).pipe(z.number().int().min(1)) }).safeParse(Object.fromEntries(url.searchParams));
    if (!parsed.success) return new Response(JSON.stringify({ error: 'Validation error', details: parsed.error.errors }), { status: 400, headers: { 'Content-Type': 'application/json' } });

    return new Response(JSON.stringify({ suggestions: await getPhraseSuggestions(locals.user.id, parsed.data.songId, parsed.data.sectionId, parsed.data.bar) }), { status: 200, headers: { 'Content-Type': 'application/json' } });
};

export const POST = async ({ locals, request }: APIContext): Promise<Response> => {
    if (!locals.user) return getUnauthorizedError();

    const parsed = z.object({ songId: z.string().min(1), sectionId: z.string().min(1), bar: z.number().int().min(1) }).safeParse(await request.json());
    if (!parsed.success) return new Response(JSON.stringify({ error: 'Validation error', details: parsed.error.errors }), { status: 400, headers: { 'Content-Type': 'application/json' } });

    const { songId, sectionId, bar } = parsed.data;
    const song: Song | null = await getItem(songTable, { userId: locals.user.id, id: songId });
    const section = song?.sections.find(candidate => candidate.id === sectionId);
    if (!song || !section) return new Response(JSON.stringify({ error: 'Song or section not found' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
    if (bar > section.bars) return new Response(JSON.stringify({ error: `This section has ${section.bars} bars.` }), { status: 400, headers: { 'Content-Type': 'application/json' } });

    const chords = section.chords.some(chord => chord.bar === bar)
        ? section.chords.filter(chord => chord.bar === bar).map(chord => ({ beat: chord.beat, name: chord.name }))
        : section.chords.filter(chord => chord.bar < bar).sort((a, b) => b.bar - a.bar || b.beat - a.beat).slice(0, 1).map(chord => ({ beat: 1, name: chord.name }));
    if (!chords.length) return new Response(JSON.stringify({ error: 'Add a chord at or before this bar first.' }), { status: 422, headers: { 'Content-Type': 'application/json' } });

    const proposals = proposePhrases(song.key, chords);
    if (!proposals) return new Response(JSON.stringify({ error: 'A chord in this bar is not recognized by the theory engine.' }), { status: 422, headers: { 'Content-Type': 'application/json' } });

    const created: Song['suggestions'] = [];

    for (const proposal of proposals) {
        let reason = `Chord tones (${proposal.chordTones.join(', ')}) land on the strong beats so the phrase outlines ${proposal.chord}, and the notes between them come from the ${proposal.scale} scale.`;

        try {
            reason = await explainPhrase(proposal.chord, proposal.scale, proposal.notes.map(note => note.pitch).join(' '), proposal.chordTones);
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

    return new Response(JSON.stringify({ suggestions: created }), { status: 201, headers: { 'Content-Type': 'application/json' } });
};

export const PUT = async ({ locals, request }: APIContext): Promise<Response> => {
    if (!locals.user) return getUnauthorizedError();

    const parsed = z.object({ songId: z.string().min(1), suggestionId: z.string().min(1), status: z.enum(['accepted', 'rejected']), pitches: z.array(pitchSchema).optional() }).safeParse(await request.json());
    if (!parsed.success) return new Response(JSON.stringify({ error: 'Validation error', details: parsed.error.errors }), { status: 400, headers: { 'Content-Type': 'application/json' } });

    const { songId, suggestionId, status, pitches } = parsed.data;
    const song: Song | null = await getItem(songTable, { userId: locals.user.id, id: songId });
    const suggestion = song?.suggestions.find(candidate => candidate.id === suggestionId && candidate.kind === 'phrase');
    if (!song || !suggestion) return new Response(JSON.stringify({ error: 'Suggestion not found' }), { status: 404, headers: { 'Content-Type': 'application/json' } });

    let skipped = 0;

    if (status === 'accepted') {
        const section = song.sections.find(candidate => candidate.id === suggestion.sectionId);
        if (!section) return new Response(JSON.stringify({ error: 'Section not found' }), { status: 404, headers: { 'Content-Type': 'application/json' } });

        const phrase = z.object({ scale: z.string(), chord: z.string(), notes: z.array(z.object({ beat: z.number(), duration: z.number(), pitch: pitchSchema })) }).safeParse(JSON.parse(suggestion.value));
        if (!phrase.success) {
            console.error('PUT /api/modules/autofill stored phrase is invalid:', phrase.error);
            return getServerError();
        }
        if (pitches && pitches.length !== phrase.data.notes.length) return new Response(JSON.stringify({ error: `Enter ${phrase.data.notes.length} pitches, one for each note.` }), { status: 400, headers: { 'Content-Type': 'application/json' } });

        const notes: Song['sections'][number]['notes'] = [...section.notes];

        phrase.data.notes.forEach((note, index) => {
            if (notes.some(existing => existing.bar === suggestion.bar && existing.beat === note.beat)) skipped += 1;
            else notes.push({ bar: suggestion.bar, beat: note.beat, duration: note.duration, pitch: pitches?.[index] ?? note.pitch, string: null, fret: null });
        });

        await setNotes(locals.user.id, songId, suggestion.sectionId, notes);
    }

    await setPhraseSuggestionStatus(locals.user.id, songId, suggestionId, status);
    return new Response(JSON.stringify({ status, skipped }), { status: 200, headers: { 'Content-Type': 'application/json' } });
};
