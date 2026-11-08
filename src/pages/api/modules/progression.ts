import { nanoid } from 'nanoid';
import { z } from 'zod';
import { progressionRequestSchema } from '@/db/validations';
import { getSong, setSong } from '@/lib/songs';
import { getServerError, getUnauthorizedError } from '@/lib/status-responses';
import { deleteProgression, explainChord, setProgression } from '@/lib/modules/progression';
import { analyzeChord } from '@/lib/theory/engine';

import type { APIContext } from 'astro';

export async function GET({ locals, url }: APIContext): Promise<Response> {
    if (!locals.user) return getUnauthorizedError();

    try {
        const song = await getSong(locals.user.id, z.string().min(1).parse(url.searchParams.get('song')));
        if (!song) return new Response(JSON.stringify({ error: 'Song not found' }), { status: 404, headers: { 'Content-Type': 'application/json' } });

        return new Response(JSON.stringify({ data: { songId: song.id, key: song.key, tempo: song.tempo, sampleProgressionId: song.sampleProgressionId, sections: song.sections.map(section => ({ id: section.id, name: section.name, bars: section.bars, chords: section.chords })) } }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    } catch (error) {
        if (error instanceof z.ZodError) return new Response(JSON.stringify({ error: 'Validation error', details: error.errors }), { status: 400, headers: { 'Content-Type': 'application/json' } });

        console.error('GET /api/modules/progression error:', error);
        return getServerError();
    }
}

export async function POST({ locals, request }: APIContext): Promise<Response> {
    if (!locals.user) return getUnauthorizedError();

    try {
        const body = progressionRequestSchema.parse(await request.json());

        if (body.action === 'explain') {
            const analysis = analyzeChord(body.key, body.chord);
            if (!analysis) return new Response(JSON.stringify({ error: 'Key or chord not recognized' }), { status: 400, headers: { 'Content-Type': 'application/json' } });

            return new Response(JSON.stringify({ data: { text: await explainChord(body.key, analysis.name, analysis.context.description) } }), { status: 200, headers: { 'Content-Type': 'application/json' } });
        }

        const key = `${body.draft.tonic} ${body.draft.mode}`;
        let song = body.draft.songId ? await getSong(locals.user.id, body.draft.songId) : null;

        if (body.draft.songId && !song) return new Response(JSON.stringify({ error: 'Song not found' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
        if (!song) {
            song = { userId: locals.user.id, id: nanoid(), title: 'Untitled progression', key, tempo: body.draft.tempo, sampleProgressionId: body.draft.sampleProgressionId, melodyShared: false, sections: [], suggestions: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
            await setSong(song);
        }

        for (const section of song.sections) {
            if (!body.draft.sections.some(draftSection => draftSection.id === section.id)) await deleteProgression(locals.user.id, song.id, section.id);
        }

        for (const section of body.draft.sections) {
            await setProgression(locals.user.id, song.id, key, body.draft.tempo, { ...section, notes: [] });
        }

        return new Response(JSON.stringify({ data: { songId: song.id }, message: 'Progression saved' }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    } catch (error) {
        if (error instanceof z.ZodError) return new Response(JSON.stringify({ error: 'Validation error', details: error.errors }), { status: 400, headers: { 'Content-Type': 'application/json' } });

        console.error('POST /api/modules/progression error:', error);
        return getServerError();
    }
}
