export interface ParsedChord {
    name: string;
    root: number;
    quality: ChordQuality;
    rootName: string;
    tones: number[];
    toneLabels: string[];
    scaleName: string;
    scale: number[];
}

export interface PhraseNote {
    beat: number;
    duration: number;
    pitch: string;
}

export interface PhraseProposal {
    title: string;
    chord: string;
    scale: string;
    chordTones: string[];
    keyLabel: string;
    notes: PhraseNote[];
}

type ChordQuality = 'major' | 'minor' | 'dominant7' | 'major7' | 'minor7' | 'halfDiminished' | 'diminished' | 'sus4';
type PhraseStyle = 'rising' | 'falling' | 'guide';

const SHARP_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const FLAT_NAMES = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
const NATURAL_PITCH_CLASSES: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
const MAJOR_SCALE = [0, 2, 4, 5, 7, 9, 11];
const LOWEST_NOTE = 60;
const HIGHEST_NOTE = 83;
const BEATS_PER_BAR = 4;
const PHRASE_STYLES: PhraseStyle[] = ['rising', 'falling', 'guide'];

const QUALITIES: Record<string, { quality: ChordQuality; tones: number[]; labels: string[]; scaleName: string; scale: number[] }> = {
    '': { quality: 'major', tones: [0, 4, 7], labels: ['root', '3rd', '5th'], scaleName: 'major', scale: [0, 2, 4, 5, 7, 9, 11] },
    maj: { quality: 'major', tones: [0, 4, 7], labels: ['root', '3rd', '5th'], scaleName: 'major', scale: [0, 2, 4, 5, 7, 9, 11] },
    m: { quality: 'minor', tones: [0, 3, 7], labels: ['root', '3rd', '5th'], scaleName: 'dorian', scale: [0, 2, 3, 5, 7, 9, 10] },
    min: { quality: 'minor', tones: [0, 3, 7], labels: ['root', '3rd', '5th'], scaleName: 'dorian', scale: [0, 2, 3, 5, 7, 9, 10] },
    '7': { quality: 'dominant7', tones: [0, 4, 7, 10], labels: ['root', '3rd', '5th', '7th'], scaleName: 'mixolydian', scale: [0, 2, 4, 5, 7, 9, 10] },
    maj7: { quality: 'major7', tones: [0, 4, 7, 11], labels: ['root', '3rd', '5th', '7th'], scaleName: 'major', scale: [0, 2, 4, 5, 7, 9, 11] },
    m7: { quality: 'minor7', tones: [0, 3, 7, 10], labels: ['root', '3rd', '5th', '7th'], scaleName: 'dorian', scale: [0, 2, 3, 5, 7, 9, 10] },
    min7: { quality: 'minor7', tones: [0, 3, 7, 10], labels: ['root', '3rd', '5th', '7th'], scaleName: 'dorian', scale: [0, 2, 3, 5, 7, 9, 10] },
    m7b5: { quality: 'halfDiminished', tones: [0, 3, 6, 10], labels: ['root', '3rd', '5th', '7th'], scaleName: 'locrian', scale: [0, 1, 3, 5, 6, 8, 10] },
    dim: { quality: 'diminished', tones: [0, 3, 6], labels: ['root', '3rd', '5th'], scaleName: 'whole-half diminished', scale: [0, 2, 3, 5, 6, 8, 9, 11] },
    sus4: { quality: 'sus4', tones: [0, 5, 7], labels: ['root', '4th', '5th'], scaleName: 'mixolydian', scale: [0, 2, 4, 5, 7, 9, 10] },
};

function wrap(value: number): number {
    return ((value % 12) + 12) % 12;
}

function parseRoot(text: string): number | null {
    const letter = NATURAL_PITCH_CLASSES[text.charAt(0).toUpperCase()];
    if (letter === undefined) return null;
    if (text.charAt(1) === '#') return wrap(letter + 1);
    if (text.charAt(1) === 'b') return wrap(letter - 1);
    return letter;
}

function noteName(midi: number, useFlats: boolean): string {
    const names = useFlats ? FLAT_NAMES : SHARP_NAMES;
    return `${names[wrap(midi)]}${Math.floor(midi / 12) - 1}`;
}

function pitchClassName(pitchClass: number, useFlats: boolean): string {
    return (useFlats ? FLAT_NAMES : SHARP_NAMES)[wrap(pitchClass)];
}

export function parseChord(name: string): ParsedChord | null {
    const match = /^([A-Ga-g][#b]?)(.*)$/.exec(name.trim());
    if (!match) return null;

    const root = parseRoot(match[1]);
    const definition = QUALITIES[match[2]];
    if (root === null || !definition) return null;

    const rootName = match[1].charAt(0).toUpperCase() + match[1].slice(1);

    return {
        name: name.trim(),
        root,
        quality: definition.quality,
        rootName,
        tones: definition.tones.map(interval => wrap(root + interval)),
        toneLabels: definition.labels,
        scaleName: `${rootName} ${definition.scaleName}`,
        scale: definition.scale.map(interval => wrap(root + interval)),
    };
}

function keyMajorScale(key: string): number[] | null {
    const match = /^([A-Ga-g][#b]?)(m|min|minor)?$/.exec(key.trim());
    if (!match) return null;

    const tonic = parseRoot(match[1]);
    if (tonic === null) return null;

    const majorTonic = match[2] ? wrap(tonic + 3) : tonic;
    return MAJOR_SCALE.map(interval => wrap(majorTonic + interval));
}

export function describeKeyPosition(key: string, chord: ParsedChord): string {
    const scale = keyMajorScale(key);
    if (!scale) return 'key not set';

    return scale.includes(chord.root) ? 'inside the key' : 'borrowed or outside the key';
}

const MODE_NAMES = ['major', 'dorian', 'phrygian', 'lydian', 'mixolydian', 'natural minor', 'locrian'];

function fitToKey(key: string, chord: ParsedChord): ParsedChord {
    const scale = keyMajorScale(key);
    if (!scale) return chord;

    const degree = scale.indexOf(chord.root);
    if (degree === -1 || !chord.tones.every(tone => scale.includes(tone))) return chord;

    return { ...chord, scale, scaleName: `${chord.rootName} ${MODE_NAMES[degree]}` };
}

function nearestIndex(candidates: number[], target: number): number {
    let best = 0;

    for (let index = 1; index < candidates.length; index++) {
        if (Math.abs(candidates[index] - target) < Math.abs(candidates[best] - target)) best = index;
    }

    return best;
}

function notesInRange(pitchClasses: number[]): number[] {
    const notes: number[] = [];

    for (let midi = LOWEST_NOTE; midi <= HIGHEST_NOTE; midi++) {
        if (pitchClasses.includes(wrap(midi))) notes.push(midi);
    }

    return notes;
}

function pickStrongNote(style: PhraseStyle, chord: ParsedChord, chordNotes: number[], index: number, previous: number | null): number {
    if (style === 'guide') {
        const guidePitchClasses = chord.tones.length > 3 ? [chord.tones[1], chord.tones[3]] : [chord.tones[1], chord.tones[2]];
        const target = guidePitchClasses[index % guidePitchClasses.length];
        const candidates = chordNotes.filter(midi => wrap(midi) === target);
        return candidates[nearestIndex(candidates, previous ?? 67)];
    }

    const rootIndex = chordNotes.findIndex(midi => wrap(midi) === chord.root);
    if (style === 'rising') return chordNotes[Math.min(rootIndex + index, chordNotes.length - 1)];

    const top = chordNotes.findIndex(midi => midi >= chordNotes[rootIndex] + 12);
    return chordNotes[Math.max(top - index, 0)];
}

function pickWeakNote(style: PhraseStyle, scaleNotes: number[], previous: number, next: number | null): number {
    const previousIndex = scaleNotes.indexOf(previous);
    const goesUp = next === null ? style !== 'falling' : next >= previous;
    const index = goesUp ? Math.min(previousIndex + 1, scaleNotes.length - 1) : Math.max(previousIndex - 1, 0);
    return scaleNotes[index];
}

function buildPhrase(style: PhraseStyle, chord: ParsedChord, startBeat: number, endBeat: number, state: { strongCount: number; last: number | null }): { beat: number; midi: number }[] {
    const scaleNotes = notesInRange(chord.scale);
    const chordNotes = notesInRange(chord.tones);
    const beats: { beat: number; midi: number; strong: boolean }[] = [];

    for (let beat = startBeat; beat < endBeat; beat++) {
        const strong = beat === startBeat || beat % 2 === 1;
        beats.push({ beat, midi: 0, strong });
    }

    for (const entry of beats) {
        if (!entry.strong) continue;
        entry.midi = pickStrongNote(style, chord, chordNotes, state.strongCount, state.last);
        state.strongCount += 1;
        state.last = entry.midi;
    }

    for (let index = 0; index < beats.length; index++) {
        if (beats[index].strong) continue;
        const previous = index === 0 ? state.last ?? chordNotes[0] : beats[index - 1].midi;
        const next = beats.slice(index + 1).find(entry => entry.strong)?.midi ?? null;
        beats[index].midi = pickWeakNote(style, scaleNotes, previous, next);
    }

    return beats.map(entry => ({ beat: entry.beat, midi: entry.midi }));
}

const STYLE_TITLES: Record<PhraseStyle, string> = {
    rising: 'Rising chord tones with stepwise passing notes',
    falling: 'Falling chord tones with stepwise passing notes',
    guide: 'Guide tones on the strong beats',
};

export function proposePhrases(key: string, chords: { beat: number; name: string }[]): PhraseProposal[] | null {
    const segments: { chord: ParsedChord; start: number; end: number }[] = [];
    const ordered = [...chords].sort((first, second) => first.beat - second.beat);

    for (let index = 0; index < ordered.length; index++) {
        const parsed = parseChord(ordered[index].name);
        if (!parsed) return null;
        segments.push({ chord: fitToKey(key, parsed), start: ordered[index].beat, end: ordered[index + 1]?.beat ?? BEATS_PER_BAR + 1 });
    }

    if (!segments.length) return null;
    if (segments[0].start > 1) segments[0].start = 1;

    return PHRASE_STYLES.map(style => {
        const state: { strongCount: number; last: number | null } = { strongCount: 0, last: null };
        const notes: PhraseNote[] = [];

        for (const segment of segments) {
            const useFlats = segment.chord.rootName.includes('b') || segment.chord.rootName === 'F';
            for (const entry of buildPhrase(style, segment.chord, segment.start, segment.end, state)) {
                notes.push({ beat: entry.beat, duration: 1, pitch: noteName(entry.midi, useFlats) });
            }
        }

        const first = segments[0].chord;
        const useFlats = first.rootName.includes('b') || first.rootName === 'F';

        return {
            title: STYLE_TITLES[style],
            chord: segments.map(segment => segment.chord.name).join(' → '),
            scale: segments.map(segment => segment.chord.scaleName).join(' → '),
            chordTones: first.tones.map(tone => pitchClassName(tone, useFlats)),
            keyLabel: segments.map(segment => `${segment.chord.name}: ${describeKeyPosition(key, segment.chord)}`).join('; '),
            notes,
        };
    });
}
