import { z } from 'zod';
import { getItem } from '@/db/helpers';
import { songTable } from '@/db/schemas';
import type { Song } from '@/db/types';
import { saveNotesSchema, sectionQuerySchema } from '@/db/validations';
import { getServerError, getUnauthorizedError } from '@/lib/status-responses';
import { explainNote, setNotes } from '@/lib/modules/editor';

import type { APIContext } from 'astro';

const explainNoteSchema = z.object({
    chord: z.string().min(1).max(32),
    scale: z.string().min(1).max(64),
    pitch: z.string().regex(/^[A-G][#b]?-?\d$/),
    inScale: z.boolean(),
});

export const GET = async ({ locals, url }: APIContext): Promise<Response> => {
    if (!locals.user) return getUnauthorizedError();

    try {
        const { songId, sectionId } = sectionQuerySchema.parse({ songId: url.searchParams.get('songId'), sectionId: url.searchParams.get('sectionId') });
        const section: Song['sections'][number] | undefined = (await getItem(songTable, { userId: locals.user.id, id: songId }))?.sections.find((candidate: Song['sections'][number]) => candidate.id === sectionId);

        if (!section) {
            return new Response(
                JSON.stringify({
                    error: 'Section not found',
                }),
                {
                    status: 404,
                    headers: {
                        'Content-Type': 'application/json',
                    },
                }
            );
        }

        return new Response(
            JSON.stringify({
                data: section.notes,
            }),
            {
                status: 200,
                headers: {
                    'Content-Type': 'application/json',
                },
            }
        );
    } catch (error) {
        if (error instanceof z.ZodError) {
            return new Response(
                JSON.stringify({
                    error: 'Validation error',
                    details: error.errors,
                }),
                {
                    status: 400,
                    headers: {
                        'Content-Type': 'application/json',
                    },
                }
            );
        }

        console.error('GET /api/modules/editor error:', error);
        return getServerError();
    }
};

export const PUT = async ({ locals, request }: APIContext): Promise<Response> => {
    if (!locals.user) return getUnauthorizedError();

    try {
        const { songId, sectionId, notes } = saveNotesSchema.parse(await request.json());
        const section: Song['sections'][number] | undefined = (await getItem(songTable, { userId: locals.user.id, id: songId }))?.sections.find((candidate: Song['sections'][number]) => candidate.id === sectionId);

        if (!section) {
            return new Response(
                JSON.stringify({
                    error: 'Section not found',
                }),
                {
                    status: 404,
                    headers: {
                        'Content-Type': 'application/json',
                    },
                }
            );
        }

        if (notes.some(note => note.bar > section.bars)) {
            return new Response(
                JSON.stringify({
                    error: `This section has ${section.bars} bars`,
                }),
                {
                    status: 400,
                    headers: {
                        'Content-Type': 'application/json',
                    },
                }
            );
        }

        await setNotes(locals.user.id, songId, sectionId, notes);

        return new Response(
            JSON.stringify({
                data: notes,
                message: 'Notes saved',
            }),
            {
                status: 200,
                headers: {
                    'Content-Type': 'application/json',
                },
            }
        );
    } catch (error) {
        if (error instanceof z.ZodError) {
            return new Response(
                JSON.stringify({
                    error: 'Validation error',
                    details: error.errors,
                }),
                {
                    status: 400,
                    headers: {
                        'Content-Type': 'application/json',
                    },
                }
            );
        }

        console.error('PUT /api/modules/editor error:', error);
        return getServerError();
    }
};

export const POST = async ({ locals, request }: APIContext): Promise<Response> => {
    if (!locals.user) return getUnauthorizedError();

    try {
        const { chord, scale, pitch, inScale } = explainNoteSchema.parse(await request.json());

        return new Response(
            JSON.stringify({
                data: await explainNote(chord, scale, pitch, inScale),
            }),
            {
                status: 200,
                headers: {
                    'Content-Type': 'application/json',
                },
            }
        );
    } catch (error) {
        if (error instanceof z.ZodError) {
            return new Response(
                JSON.stringify({
                    error: 'Validation error',
                    details: error.errors,
                }),
                {
                    status: 400,
                    headers: {
                        'Content-Type': 'application/json',
                    },
                }
            );
        }

        console.error('POST /api/modules/editor error:', error);
        return getServerError();
    }
};
