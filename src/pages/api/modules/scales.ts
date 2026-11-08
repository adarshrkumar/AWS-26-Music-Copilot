import { z } from 'zod';
import { songInputSchema } from '@/db/validations';
import { getSong } from '@/lib/songs';
import { getServerError, getUnauthorizedError } from '@/lib/status-responses';
import { explainScale, getScaleFeel, setScaleSuggestionStatus } from '@/lib/modules/scales';

import type { APIContext } from 'astro';

const requestSchema = z.object({
    kind: z.enum(['feel', 'reason']),
    chord: z.string().min(1).max(20),
    chordFunction: z.string().min(1).max(200),
    scale: z.string().min(1).max(60),
    notes: z.array(z.string().min(1).max(6)).min(1).max(12),
});

const statusSchema = z.object({
    songId: songInputSchema.shape.id,
    suggestionId: songInputSchema.shape.suggestions.element.shape.id,
    status: songInputSchema.shape.suggestions.element.shape.status,
});

export async function PATCH({ locals, request }: APIContext): Promise<Response> {
    if (!locals.user) return getUnauthorizedError();

    try {
        const input = statusSchema.parse(await request.json());

        if (!(await getSong(locals.user.id, input.songId))?.suggestions.some(suggestion => suggestion.id === input.suggestionId)) {
            return new Response(
                JSON.stringify({
                    error: 'Suggestion not found',
                }),
                {
                    status: 404,
                    headers: {
                        'Content-Type': 'application/json',
                    },
                }
            );
        }

        await setScaleSuggestionStatus(locals.user.id, input.songId, input.suggestionId, input.status);

        return new Response(
            JSON.stringify({
                message: 'Suggestion updated',
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

        console.error('PATCH /api/modules/scales error:', error);
        return getServerError();
    }
}

export async function POST({ request, locals }: APIContext): Promise<Response> {
    if (!locals.session) return getUnauthorizedError();

    const parsed = requestSchema.safeParse(await request.json());
    if (!parsed.success) return new Response('Invalid request', { status: 400 });

    try {
        if (parsed.data.kind === 'feel') return new Response((await getScaleFeel(parsed.data.scale, parsed.data.notes)).trim(), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });

        return new Response((await explainScale(parsed.data.chord, parsed.data.chordFunction, parsed.data.scale, parsed.data.notes)).trim(), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
    } catch (error) {
        console.error('POST /api/modules/scales error:', error);
        return getServerError();
    }
}
