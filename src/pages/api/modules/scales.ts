import { z } from 'zod';
import { songIdSchema, suggestionStatusInputSchema } from '@/db/validations';
import { getSong } from '@/lib/songs';
import { setScaleSuggestionStatus } from '@/lib/modules/scales';

import type { APIContext } from 'astro';

function json(body: object, status = 200): Response {
    return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

// PATCH /api/modules/scales - Record that the songwriter accepted, rejected or reset a suggestion on a synced song
export async function PATCH({ locals, request }: APIContext): Promise<Response> {
    if (!locals.user) return json({ error: 'Unauthorized' }, 401);

    try {
        const input = suggestionStatusInputSchema.parse(await request.json());
        const song = await getSong(locals.user.id, songIdSchema.parse(input.songId));
        if (!song) return json({ error: 'Song not found' }, 404);
        if (!song.suggestions.some(suggestion => suggestion.id === input.suggestionId)) return json({ error: 'Suggestion not found' }, 404);

        await setScaleSuggestionStatus(locals.user.id, input.songId, input.suggestionId, input.status);
        return json({ message: 'Suggestion updated' });
    } catch (error) {
        if (error instanceof z.ZodError) return json({ error: 'Validation error', details: error.errors }, 400);
        console.error('PATCH /api/modules/scales error:', error);
        return json({ error: 'Internal server error' }, 500);
    }
}
