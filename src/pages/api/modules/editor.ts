import { z } from 'zod';
import { explainNoteSchema, saveNotesSchema, sectionQuerySchema } from '@/db/validations';
import { getSong } from '@/lib/songs';
import { explainNote, getNotes, setNotes } from '@/lib/modules/editor';

import type { APIRoute } from 'astro';

function json(body: object, status = 200): Response {
    return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

function fail(error: Error, method: string): Response {
    if (error instanceof z.ZodError) return json({ error: 'Validation error', details: error.errors }, 400);

    console.error(`${method} /api/modules/editor error:`, error);
    return json({ error: 'Internal server error' }, 500);
}

export const GET: APIRoute = async ({ locals, url }) => {
    if (!locals.user) return json({ error: 'Unauthorized' }, 401);

    try {
        const { songId, sectionId } = sectionQuerySchema.parse({ songId: url.searchParams.get('songId'), sectionId: url.searchParams.get('sectionId') });
        const song = await getSong(locals.user.id, songId);
        if (!song?.sections.some(section => section.id === sectionId)) return json({ error: 'Section not found' }, 404);

        return json({ data: await getNotes(locals.user.id, songId, sectionId) });
    } catch (error) {
        return fail(error instanceof Error ? error : new Error('Unknown error'), 'GET');
    }
};

export const PUT: APIRoute = async ({ locals, request }) => {
    if (!locals.user) return json({ error: 'Unauthorized' }, 401);

    try {
        const { songId, sectionId, notes } = saveNotesSchema.parse(await request.json());
        const song = await getSong(locals.user.id, songId);
        const section = song?.sections.find(candidate => candidate.id === sectionId);
        if (!section) return json({ error: 'Section not found' }, 404);
        if (notes.some(note => note.bar > section.bars)) return json({ error: `This section has ${section.bars} bars` }, 400);

        await setNotes(locals.user.id, songId, sectionId, notes);

        return json({ data: notes, message: 'Notes saved' });
    } catch (error) {
        return fail(error instanceof Error ? error : new Error('Unknown error'), 'PUT');
    }
};

export const POST: APIRoute = async ({ locals, request }) => {
    if (!locals.user) return json({ error: 'Unauthorized' }, 401);

    try {
        const { chord, scale, pitch, inScale } = explainNoteSchema.parse(await request.json());

        return json({ data: await explainNote(chord, scale, pitch, inScale) });
    } catch (error) {
        return fail(error instanceof Error ? error : new Error('Unknown error'), 'POST');
    }
};
