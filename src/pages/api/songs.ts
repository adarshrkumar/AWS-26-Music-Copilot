import { z } from 'zod';
import { songInputSchema } from '@/db/validations';
import { deleteSong, getSong, getSongs, setSong } from '@/lib/songs';
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

export async function GET({ locals }: APIContext): Promise<Response> {
    if (!locals.user) return getUnauthorizedError();

    try {
        return json({ data: await getSongs(locals.user.id) });
    } catch (error) {
        return failure('GET', error instanceof Error ? error : null);
    }
}

export async function PUT({ locals, request }: APIContext): Promise<Response> {
    if (!locals.user) return getUnauthorizedError();

    try {
        const input = songInputSchema.parse(await request.json());
        const existing = await getSong(locals.user.id, input.id);
        const song = { ...input, userId: locals.user.id, createdAt: existing?.createdAt ?? input.createdAt };

        await setSong(song);
        return json({ data: song, message: 'Song synced' });
    } catch (error) {
        return failure('PUT', error instanceof Error ? error : null);
    }
}

export async function DELETE({ locals, url }: APIContext): Promise<Response> {
    if (!locals.user) return getUnauthorizedError();

    try {
        await deleteSong(locals.user.id, songInputSchema.shape.id.parse(url.searchParams.get('id')));
        return json({ message: 'Synced copy removed' });
    } catch (error) {
        return failure('DELETE', error instanceof Error ? error : null);
    }
}
