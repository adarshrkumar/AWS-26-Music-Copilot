import { z } from 'zod';
import { getServerError } from '@/lib/status-responses';
import { analyzeChord } from '@/lib/theory/engine';

import type { APIRoute } from 'astro';

const autofillSchema = z.object({
    key: z.string().min(1).max(16),
    chord: z.string().min(1).max(32),
    bar: z.number().int().min(1).max(16),
});

export async function POST({ request }: Parameters<APIRoute>[0]): ReturnType<APIRoute> {
    const parsed = autofillSchema.safeParse(await request.json());

    if (!parsed.success)
        return new Response(JSON.stringify({ error: 'Validation error', details: parsed.error.errors }), { status: 400, headers: { 'Content-Type': 'application/json' } });

    const analysis = analyzeChord(parsed.data.key, parsed.data.chord);
    if (!analysis) return getServerError('Could not analyze chord');

    const top = analysis.scales[0];
    const tones = analysis.chord.notes.filter((_note, index) => index < 3);

    const phrase = {
        bar: parsed.data.bar,
        chord: parsed.data.chord,
        notes: [
            { beat: 1, pitch: tones[0] ?? analysis.chord.root, duration: 1, isChordTone: true },
            { beat: 2, pitch: top?.notes[1] ?? tones[0] ?? analysis.chord.root, duration: 1, isChordTone: false },
            { beat: 3, pitch: tones[1] ?? tones[0] ?? analysis.chord.root, duration: 1, isChordTone: true },
            { beat: 4, pitch: tones[2] ?? tones[0] ?? analysis.chord.root, duration: 1, isChordTone: true },
        ],
        reason: `Beats 1 and 3 (strong beats) use chord tones of ${parsed.data.chord}. Beat 4 uses the fifth. The passing note on beat 2 comes from the ${top?.name ?? 'scale'}.`,
        topScale: top ? { name: top.name, notes: top.notes } : null,
    };

    return new Response(JSON.stringify({ analysis, phrase }), { status: 200, headers: { 'Content-Type': 'application/json' } });
}
