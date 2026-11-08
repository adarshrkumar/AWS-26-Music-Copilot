import { z } from 'zod';
import { deleteItem, getItem, queryItems, setItem } from '@/db/helpers';
import { songTable } from '@/db/schemas';
import type { Song } from '@/db/types';
import { songInputSchema } from '@/db/validations';
import { getServerError, getUnauthorizedError } from '@/lib/status-responses';

import type { APIContext } from 'astro';

function json(body: object, status = 200): Response {
    return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

function failure(method: string, error: Error | null): Response {
    if (error instanceof z.ZodError) return json({ error: 'Validation error', details: error.errors }, 400);
    console.error(`${method} /api/songs error:`, error);
    return getServerError();
}

export const GET = async ({ locals }: APIContext): Promise<Response> => {
    if (!locals.user) return getUnauthorizedError();

    try {
        return json({ data: await queryItems(songTable, { KeyConditionExpression: 'userId = :userId', ExpressionAttributeValues: { ':userId': locals.user.id } }) });
    } catch (error) {
        return failure('GET', error instanceof Error ? error : null);
    }
};

export const PUT = async ({ locals, request }: APIContext): Promise<Response> => {
    if (!locals.user) return getUnauthorizedError();

    try {
        const input = songInputSchema.parse(await request.json());
        const existing: Song | null = await getItem(songTable, { userId: locals.user.id, id: input.id });
        const song = { ...input, userId: locals.user.id, createdAt: existing?.createdAt ?? input.createdAt };

        await setItem(songTable, song);
        return json({ data: song, message: 'Song synced' });
    } catch (error) {
        return failure('PUT', error instanceof Error ? error : null);
    }
};

export const DELETE = async ({ locals, url }: APIContext): Promise<Response> => {
    if (!locals.user) return getUnauthorizedError();

    try {
        await deleteItem(songTable, { userId: locals.user.id, id: songInputSchema.shape.id.parse(url.searchParams.get('id')) });
        return json({ message: 'Synced copy removed' });
    } catch (error) {
        return failure('DELETE', error instanceof Error ? error : null);
    }
};
