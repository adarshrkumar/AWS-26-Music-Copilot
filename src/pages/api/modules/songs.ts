import { nanoid } from 'nanoid';
import { z } from 'zod';
import type { Song } from '@/db/types';
import { deleteSong, getSong, getSongs, setSong } from '@/lib/songs';
import { getServerError } from '@/lib/status-responses';

import type { APIRoute } from 'astro';

const songBodySchema = z.object({
    id: z.string().optional(),
    title: z.string().min(1).max(120).default('Untitled'),
    key: z.string().min(1).max(16).default('C major'),
    tempo: z.number().int().min(20).max(300).default(120),
    sampleProgressionId: z.string().nullable().optional(),
    melodyShared: z.boolean().default(false),
    sections: z.array(z.object({
        id: z.string(),
        name: z.string(),
        bars: z.number().int().min(1).max(16),
        chords: z.array(z.object({ bar: z.number(), beat: z.number(), name: z.string() })),
        notes: z.array(z.object({ bar: z.number(), beat: z.number(), duration: z.number(), pitch: z.string(), string: z.number().nullable(), fret: z.number().nullable() })),
    })).default([]),
    suggestions: z.array(z.object({
        id: z.string(),
        sectionId: z.string(),
        bar: z.number(),
        kind: z.enum(['scale', 'arpeggio', 'chord', 'note', 'phrase']),
        value: z.string(),
        reason: z.string(),
        status: z.enum(['pending', 'accepted', 'rejected']),
        createdAt: z.string(),
    })).default([]),
    createdAt: z.string().optional(),
}).strict();

export async function GET({ locals, url }: Parameters<APIRoute>[0]): ReturnType<APIRoute> {
    if (!locals.user)
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } });

    const songId = url.searchParams.get('id');

    if (songId) {
        const song = await getSong(locals.user.id, songId);
        if (!song) return new Response(JSON.stringify({ error: 'Not found' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
        return new Response(JSON.stringify(song), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    const songs = await getSongs(locals.user.id);
    return new Response(JSON.stringify(songs), { status: 200, headers: { 'Content-Type': 'application/json' } });
}

export async function POST({ locals, request }: Parameters<APIRoute>[0]): ReturnType<APIRoute> {
    if (!locals.user)
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } });

    const parsed = songBodySchema.safeParse(await request.json());
    if (!parsed.success)
        return new Response(JSON.stringify({ error: 'Validation error', details: parsed.error.errors }), { status: 400, headers: { 'Content-Type': 'application/json' } });

    const body = parsed.data;
    const now = new Date().toISOString();

    const song: Song = {
        userId: locals.user.id,
        id: body.id ?? nanoid(),
        title: body.title,
        key: body.key,
        tempo: body.tempo,
        sampleProgressionId: body.sampleProgressionId ?? null,
        melodyShared: body.melodyShared,
        sections: body.sections,
        suggestions: body.suggestions,
        createdAt: body.createdAt ?? now,
        updatedAt: now,
    };

    try {
        await setSong(song);
    } catch {
        return getServerError('Could not save song');
    }

    return new Response(JSON.stringify(song), { status: 200, headers: { 'Content-Type': 'application/json' } });
}

export async function DELETE({ locals, url }: Parameters<APIRoute>[0]): ReturnType<APIRoute> {
    if (!locals.user)
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } });

    const songId = url.searchParams.get('id');
    if (!songId)
        return new Response(JSON.stringify({ error: 'id is required' }), { status: 400, headers: { 'Content-Type': 'application/json' } });

    await deleteSong(locals.user.id, songId);
    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
}
