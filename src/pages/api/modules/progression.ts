import { z } from 'zod';
import { progressionRequestSchema } from '@/db/validations';
import { createSong, getSong } from '@/lib/songs';
import { deleteProgression, explainChord, setProgression } from '@/lib/modules/progression';
import { analyzeChord } from '@/lib/theory/engine';

import type { APIContext } from 'astro';

function json(body: object, status = 200): Response {
    return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

export async function GET({ locals, url }: APIContext): Promise<Response> {
    if (!locals.user) return json({ error: 'Sign in to load a saved progression.' }, 401);

    const songId = url.searchParams.get('song');
    if (!songId) return json({ error: 'A song id is required.' }, 400);

    try {
        const song = await getSong(locals.user.id, songId);
        if (!song) return json({ error: 'Song not found.' }, 404);

        return json({ data: { songId: song.id, key: song.key, tempo: song.tempo, sampleProgressionId: song.sampleProgressionId, sections: song.sections.map(section => ({ id: section.id, name: section.name, bars: section.bars, chords: section.chords })) } });
    } catch (error) {
        console.error('GET /api/modules/progression error:', error);
        return json({ error: 'Internal server error' }, 500);
    }
}

export async function POST({ locals, request }: APIContext): Promise<Response> {
    if (!locals.user) return json({ error: 'Sign in to use this feature.' }, 401);

    try {
        const body = progressionRequestSchema.parse(await request.json());

        if (body.action === 'explain') {
            const analysis = analyzeChord(body.key, body.chord);
            if (!analysis) return json({ error: 'Key or chord not recognized.' }, 400);

            return json({ data: { text: await explainChord(body.key, analysis.name, analysis.context.description) } });
        }

        const { draft } = body;
        const userId = locals.user.id;
        const key = `${draft.tonic} ${draft.mode}`;

        let song = draft.songId ? await getSong(userId, draft.songId) : null;
        if (draft.songId && !song) return json({ error: 'Song not found.' }, 404);
        if (!song) song = await createSong(userId, 'Untitled progression', key, draft.tempo, draft.sampleProgressionId);

        const draftIds = draft.sections.map(section => section.id);
        for (const section of song.sections) {
            if (!draftIds.includes(section.id)) await deleteProgression(userId, song.id, section.id);
        }

        for (const section of draft.sections) {
            await setProgression(userId, song.id, key, draft.tempo, { id: section.id, name: section.name, bars: section.bars, chords: section.chords, notes: [] });
        }

        return json({ data: { songId: song.id }, message: 'Progression saved' });
    } catch (error) {
        if (error instanceof z.ZodError) return json({ error: 'Validation error', details: error.errors }, 400);

        console.error('POST /api/modules/progression error:', error);
        return json({ error: 'Internal server error' }, 500);
    }
}
