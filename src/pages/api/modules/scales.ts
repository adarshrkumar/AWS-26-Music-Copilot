import { z } from 'zod';
import { explainScale, getScaleFeel } from '@/lib/modules/scales';

import type { APIRoute } from 'astro';

const requestSchema = z.object({
    kind: z.enum(['feel', 'reason']),
    chord: z.string().min(1).max(20),
    chordFunction: z.string().min(1).max(200),
    scale: z.string().min(1).max(60),
    notes: z.array(z.string().min(1).max(6)).min(1).max(12),
});

export const POST: APIRoute = async ({ request, locals }) => {
    if (!locals.session) return new Response('Unauthorized', { status: 401 });

    const parsed = requestSchema.safeParse(await request.json());
    if (!parsed.success) return new Response('Invalid request', { status: 400 });

    const { kind, chord, chordFunction, scale, notes } = parsed.data;

    try {
        const text = kind === 'feel' ? await getScaleFeel(scale, notes) : await explainScale(chord, chordFunction, scale, notes);
        return new Response(text.trim(), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
    } catch (error) {
        console.error('Scales API error:', error);
        return new Response('Could not generate text', { status: 500 });
    }
};
