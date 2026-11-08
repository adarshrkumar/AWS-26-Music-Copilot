import { z } from 'zod';
import { getServerError } from '@/lib/status-responses';
import { analyzeChord } from '@/lib/theory/engine';

import type { APIRoute } from 'astro';

const scalesSchema = z.object({
    key: z.string().min(1).max(16),
    chord: z.string().min(1).max(32),
    nextChord: z.string().min(1).max(32).optional(),
});

export async function POST({ request }: Parameters<APIRoute>[0]): ReturnType<APIRoute> {
    const parsed = scalesSchema.safeParse(await request.json());

    if (!parsed.success)
        return new Response(JSON.stringify({ error: 'Validation error', details: parsed.error.errors }), { status: 400, headers: { 'Content-Type': 'application/json' } });

    const analysis = analyzeChord(parsed.data.key, parsed.data.chord, parsed.data.nextChord ?? null);
    if (!analysis) return getServerError('Could not analyze chord');

    return new Response(JSON.stringify(analysis), { status: 200, headers: { 'Content-Type': 'application/json' } });
}
