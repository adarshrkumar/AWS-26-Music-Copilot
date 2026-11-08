import { parseChord } from './chords.ts';
import { classifyChord } from './harmony.ts';
import { parseKey } from './keys.ts';
import { getGuideToneMoves, getGuideTones, suggestArpeggios, suggestScales } from './suggestions.ts';
import type { Chord, ChordAnalysis, InvalidChord, Key, ProgressionAnalysis, ProgressionChord } from './types.ts';

function analyzeParsedChord(key: Key, chord: Chord, next: Chord | null, bar: number, beat: number): ChordAnalysis {
    const context = classifyChord(key, chord);

    return {
        valid: true,
        bar,
        beat,
        name: chord.name,
        chord,
        context,
        scales: suggestScales(chord, context),
        arpeggios: suggestArpeggios(chord, context),
        guideTones: getGuideTones(chord),
        guideToneMoves: next ? getGuideToneMoves(chord, next) : [],
    };
}

export function analyzeChord(keyName: string, chordName: string, nextChordName: string | null = null): ChordAnalysis | null {
    const key = parseKey(keyName);
    const chord = parseChord(chordName);
    if (!key || !chord) return null;

    return analyzeParsedChord(key, chord, nextChordName ? parseChord(nextChordName) : null, 1, 1);
}

export function analyzeProgression(keyName: string, chords: ProgressionChord[], loop = false): ProgressionAnalysis | null {
    const key = parseKey(keyName);
    if (!key) return null;

    const ordered = [...chords].sort((a, b) => a.bar - b.bar || a.beat - b.beat);
    const parsed = ordered.map(entry => parseChord(entry.name));
    const entries: (ChordAnalysis | InvalidChord)[] = [];

    for (let index = 0; index < ordered.length; index++) {
        const chord = parsed[index];
        const { bar, beat, name } = ordered[index];

        if (!chord) {
            entries.push({ valid: false, bar, beat, name, message: `"${name}" is not a chord Music Copilot recognizes. It is kept as written.` });
            continue;
        }

        let next: Chord | null = null;
        for (let offset = 1; offset < ordered.length; offset++) {
            const candidate = parsed[(index + offset) % ordered.length];
            if (!loop && index + offset >= ordered.length) break;
            if (candidate) {
                next = candidate;
                break;
            }
        }

        entries.push(analyzeParsedChord(key, chord, next, bar, beat));
    }

    return { key, chords: entries };
}
