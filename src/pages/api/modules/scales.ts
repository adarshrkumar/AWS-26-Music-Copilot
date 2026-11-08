import { z } from 'zod';
import { getServerError, getUnauthorizedError } from '@/lib/status-responses';
import { explainScale, getScaleFeel } from '@/lib/modules/scales';

import type { APIContext } from 'astro';

const requestSchema = z.object({
    kind: z.enum(['feel', 'reason']),
    chord: z.string().min(1).max(20),
    chordFunction: z.string().min(1).max(200),
    scale: z.string().min(1).max(60),
    notes: z.array(z.string().min(1).max(6)).min(1).max(12),
});

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
