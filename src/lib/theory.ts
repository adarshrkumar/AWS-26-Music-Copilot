import type { Chord } from '@/db/types';

export interface Pitch {
    letter: string;
    accidental: number;
    octave: number;
}

export interface ParsedChord {
    name: string;
    root: string;
    rootPitchClass: number;
    quality: string;
    pitchClasses: number[];
}

export interface Scale {
    name: string;
    pitchClasses: number[];
    diatonic: boolean;
}

export type NoteStatus = 'chord' | 'scale' | 'outside' | 'none';

export const STRING_COUNT = 6;
export const MAX_FRET = 24;

const LETTER_PITCH_CLASS: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
const LETTER_STEP: Record<string, number> = { C: 0, D: 1, E: 2, F: 3, G: 4, A: 5, B: 6 };
const ACCIDENTAL_OFFSET: Record<string, number> = { '': 0, '#': 1, '\u266F': 1, b: -1, '\u266D': -1 };
const SHARP_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const OPEN_STRING_MIDI = [64, 59, 55, 50, 45, 40];
const TREBLE_BOTTOM_LINE_STEP = 30;
const MAJOR_SCALE = [0, 2, 4, 5, 7, 9, 11];
const MODE_NAMES = ['Ionian', 'Dorian', 'Phrygian', 'Lydian', 'Mixolydian', 'Aeolian', 'Locrian'];

const CHORD_INTERVALS: Record<string, number[]> = {
    '': [0, 4, 7],
    m: [0, 3, 7],
    '7': [0, 4, 7, 10],
    maj7: [0, 4, 7, 11],
    m7: [0, 3, 7, 10],
    m7b5: [0, 3, 6, 10],
    dim: [0, 3, 6],
    dim7: [0, 3, 6, 9],
    aug: [0, 4, 8],
    sus2: [0, 2, 7],
    sus4: [0, 5, 7],
    '6': [0, 4, 7, 9],
    m6: [0, 3, 7, 9],
    '9': [0, 4, 7, 10, 14],
    maj9: [0, 4, 7, 11, 14],
    m9: [0, 3, 7, 10, 14],
    add9: [0, 4, 7, 14],
};

const QUALITY_SCALES: Record<string, { name: string; intervals: number[] }> = {
    '': { name: 'Ionian', intervals: [0, 2, 4, 5, 7, 9, 11] },
    maj7: { name: 'Ionian', intervals: [0, 2, 4, 5, 7, 9, 11] },
    '6': { name: 'Ionian', intervals: [0, 2, 4, 5, 7, 9, 11] },
    maj9: { name: 'Ionian', intervals: [0, 2, 4, 5, 7, 9, 11] },
    add9: { name: 'Ionian', intervals: [0, 2, 4, 5, 7, 9, 11] },
    m: { name: 'Dorian', intervals: [0, 2, 3, 5, 7, 9, 10] },
    m7: { name: 'Dorian', intervals: [0, 2, 3, 5, 7, 9, 10] },
    m6: { name: 'Dorian', intervals: [0, 2, 3, 5, 7, 9, 10] },
    m9: { name: 'Dorian', intervals: [0, 2, 3, 5, 7, 9, 10] },
    '7': { name: 'Mixolydian', intervals: [0, 2, 4, 5, 7, 9, 10] },
    '9': { name: 'Mixolydian', intervals: [0, 2, 4, 5, 7, 9, 10] },
    sus2: { name: 'Mixolydian', intervals: [0, 2, 4, 5, 7, 9, 10] },
    sus4: { name: 'Mixolydian', intervals: [0, 2, 4, 5, 7, 9, 10] },
    m7b5: { name: 'Locrian', intervals: [0, 1, 3, 5, 6, 8, 10] },
    dim: { name: 'Diminished (whole-half)', intervals: [0, 2, 3, 5, 6, 8, 9, 11] },
    dim7: { name: 'Diminished (whole-half)', intervals: [0, 2, 3, 5, 6, 8, 9, 11] },
    aug: { name: 'Whole tone', intervals: [0, 2, 4, 6, 8, 10] },
};

function wrap(pitchClass: number): number {
    return ((pitchClass % 12) + 12) % 12;
}

export function parsePitch(text: string): Pitch | null {
    const match = /^([A-Ga-g])([#b\u266F\u266D]?)(-?\d)$/.exec(text.trim());
    if (!match) return null;

    return { letter: match[1].toUpperCase(), accidental: ACCIDENTAL_OFFSET[match[2]], octave: Number(match[3]) };
}

export function formatPitch(pitch: Pitch): string {
    const accidental = pitch.accidental === 0 ? '' : pitch.accidental > 0 ? '#' : 'b';
    return `${pitch.letter}${accidental}${pitch.octave}`;
}

export function pitchToMidi(pitch: Pitch): number {
    return (pitch.octave + 1) * 12 + LETTER_PITCH_CLASS[pitch.letter] + pitch.accidental;
}

export function midiToPitch(midi: number): Pitch {
    const name = SHARP_NAMES[wrap(midi)];
    return { letter: name[0], accidental: name.length > 1 ? 1 : 0, octave: Math.floor(midi / 12) - 1 };
}

export function pitchClassOf(pitch: Pitch): number {
    return wrap(LETTER_PITCH_CLASS[pitch.letter] + pitch.accidental);
}

export function staffPosition(pitch: Pitch): number {
    return pitch.octave * 7 + LETTER_STEP[pitch.letter] - TREBLE_BOTTOM_LINE_STEP;
}

export function pitchFromFret(string: number, fret: number): string | null {
    if (!Number.isInteger(string) || string < 1 || string > STRING_COUNT) return null;
    if (!Number.isInteger(fret) || fret < 0 || fret > MAX_FRET) return null;

    return formatPitch(midiToPitch(OPEN_STRING_MIDI[string - 1] + fret));
}

export function fretForPitch(pitch: Pitch): { string: number; fret: number } | null {
    const midi = pitchToMidi(pitch);
    let best: { string: number; fret: number } | null = null;

    for (let index = 0; index < STRING_COUNT; index++) {
        const fret = midi - OPEN_STRING_MIDI[index];
        if (fret < 0 || fret > MAX_FRET) continue;
        if (!best || fret < best.fret) best = { string: index + 1, fret };
    }

    return best;
}

export function parseChord(name: string): ParsedChord | null {
    const match = /^([A-G])([#b]?)(.*)$/.exec(name.trim());
    if (!match) return null;

    const intervals = CHORD_INTERVALS[match[3]];
    if (!intervals) return null;

    const rootPitchClass = wrap(LETTER_PITCH_CLASS[match[1]] + ACCIDENTAL_OFFSET[match[2]]);

    return { name: name.trim(), root: match[1] + match[2], rootPitchClass, quality: match[3], pitchClasses: intervals.map(interval => wrap(rootPitchClass + interval)) };
}

export function chordAt(chords: Chord[], bar: number, beat: number): Chord | null {
    let current: Chord | null = null;

    for (const chord of chords) {
        if (chord.bar > bar || (chord.bar === bar && chord.beat > beat)) continue;
        if (!current || chord.bar > current.bar || (chord.bar === current.bar && chord.beat >= current.beat)) current = chord;
    }

    return current ?? chords[0] ?? null;
}

function keyScale(key: string): number[] | null {
    const match = /^([A-G])([#b]?)\s*(minor|min|m)?$/.exec(key.trim());
    if (!match) return null;

    const rootPitchClass = wrap(LETTER_PITCH_CLASS[match[1]] + ACCIDENTAL_OFFSET[match[2]]);
    const tonic = match[3] ? wrap(rootPitchClass + 3) : rootPitchClass;

    return MAJOR_SCALE.map(interval => wrap(tonic + interval));
}

export function isInKey(chord: ParsedChord, key: string): boolean {
    const scale = keyScale(key);
    if (!scale) return true;

    return chord.pitchClasses.every(pitchClass => scale.includes(pitchClass));
}

export function scaleFor(chord: ParsedChord, key: string): Scale {
    const inKey = keyScale(key);

    if (inKey && isInKey(chord, key)) {
        const degree = inKey.indexOf(chord.rootPitchClass);
        if (degree >= 0) return { name: `${chord.root} ${MODE_NAMES[degree]}`, pitchClasses: inKey, diatonic: true };
    }

    const fallback = QUALITY_SCALES[chord.quality];

    return { name: `${chord.root} ${fallback.name}`, pitchClasses: fallback.intervals.map(interval => wrap(chord.rootPitchClass + interval)), diatonic: false };
}

export function noteStatus(pitch: Pitch, chord: ParsedChord | null, scale: Scale | null): NoteStatus {
    if (!chord || !scale) return 'none';

    const pitchClass = pitchClassOf(pitch);
    if (chord.pitchClasses.includes(pitchClass)) return 'chord';

    return scale.pitchClasses.includes(pitchClass) ? 'scale' : 'outside';
}
