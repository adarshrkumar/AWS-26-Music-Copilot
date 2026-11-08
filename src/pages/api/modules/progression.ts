import { z } from 'zod';
import { getServerError } from '@/lib/status-responses';
import { analyzeProgression } from '@/lib/theory/engine';

import type { APIRoute } from 'astro';

const progressionSchema = z.object({
    key: z.string().min(1).max(16),
    chords: z.array(z.object({ bar: z.number().int().min(1), beat: z.number().min(1), name: z.string().min(1).max(32) })).min(1).max(16),
});

export async function POST({ request }: Parameters<APIRoute>[0]): ReturnType<APIRoute> {
    const parsed = progressionSchema.safeParse(await request.json());

    if (!parsed.success)
        return new Response(JSON.stringify({ error: 'Validation error', details: parsed.error.errors }), { status: 400, headers: { 'Content-Type': 'application/json' } });

    const analysis = analyzeProgression(parsed.data.key, parsed.data.chords);
    if (!analysis) return getServerError('Could not analyze progression');

    return new Response(JSON.stringify(analysis), { status: 200, headers: { 'Content-Type': 'application/json' } });
}
