export interface Note {
    name: string;
    pitch: number;
}

export type QualityId = 'major' | 'minor' | 'dominant7' | 'major7' | 'minor7' | 'diminished' | 'diminished7' | 'halfDiminished' | 'augmented' | 'sus4' | 'sus2' | 'sixth';

export interface Chord {
    name: string;
    root: Note;
    quality: QualityId;
    notes: Note[];
    guideTones: Note[];
}

export interface Key {
    name: string;
    root: Note;
    minor: boolean;
    pitches: number[];
    parallelPitches: number[];
    parallelName: string;
}

export type ChordStatus = 'diatonic' | 'borrowed' | 'outside';

export interface ChordFunction {
    numeral: string;
    status: ChordStatus;
    label: string;
}

export interface ScaleOption {
    id: string;
    kind: 'scale' | 'arpeggio';
    title: string;
    notes: Note[];
    keyFit: number;
    outsideNotes: Note[];
    description: string;
    reason: string;
}

interface Spelling {
    letter: number;
    pitch: number;
}

interface QualityRule {
    suffix: string;
    degrees: string[];
    guideDegrees: string[];
    lowerCase: boolean;
    scales: string[];
}

const LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
const MAJOR_SCALE = [0, 2, 4, 5, 7, 9, 11];

const QUALITIES: Record<QualityId, QualityRule> = {
    major: { suffix: '', degrees: ['1', '3', '5'], guideDegrees: ['3', '5'], lowerCase: false, scales: ['major', 'Lydian', 'major pentatonic'] },
    minor: { suffix: 'm', degrees: ['1', 'b3', '5'], guideDegrees: ['b3', '5'], lowerCase: true, scales: ['Dorian', 'natural minor', 'minor pentatonic', 'Phrygian'] },
    dominant7: { suffix: '7', degrees: ['1', '3', '5', 'b7'], guideDegrees: ['3', 'b7'], lowerCase: false, scales: ['Mixolydian', 'Lydian dominant', 'altered', 'blues'] },
    major7: { suffix: 'maj7', degrees: ['1', '3', '5', '7'], guideDegrees: ['3', '7'], lowerCase: false, scales: ['major', 'Lydian', 'major pentatonic'] },
    minor7: { suffix: 'm7', degrees: ['1', 'b3', '5', 'b7'], guideDegrees: ['b3', 'b7'], lowerCase: true, scales: ['Dorian', 'natural minor', 'Phrygian', 'minor pentatonic'] },
    diminished: { suffix: 'dim', degrees: ['1', 'b3', 'b5'], guideDegrees: ['b3', 'b5'], lowerCase: true, scales: ['Locrian', 'whole-half diminished'] },
    diminished7: { suffix: 'dim7', degrees: ['1', 'b3', 'b5', 'bb7'], guideDegrees: ['b3', 'bb7'], lowerCase: true, scales: ['whole-half diminished'] },
    halfDiminished: { suffix: 'm7b5', degrees: ['1', 'b3', 'b5', 'b7'], guideDegrees: ['b3', 'b7'], lowerCase: true, scales: ['Locrian', 'Locrian ♮2'] },
    augmented: { suffix: 'aug', degrees: ['1', '3', '#5'], guideDegrees: ['3', '#5'], lowerCase: false, scales: ['whole tone', 'Lydian augmented'] },
    sus4: { suffix: 'sus4', degrees: ['1', '4', '5'], guideDegrees: ['4', '5'], lowerCase: false, scales: ['Mixolydian', 'Dorian', 'minor pentatonic'] },
    sus2: { suffix: 'sus2', degrees: ['1', '2', '5'], guideDegrees: ['2', '5'], lowerCase: false, scales: ['Mixolydian', 'major pentatonic', 'Dorian'] },
    sixth: { suffix: '6', degrees: ['1', '3', '5', '6'], guideDegrees: ['3', '6'], lowerCase: false, scales: ['major', 'major pentatonic', 'Lydian'] },
};

const QUALITY_ALIASES: Record<string, QualityId> = {
    '': 'major',
    maj: 'major',
    M: 'major',
    m: 'minor',
    min: 'minor',
    '-': 'minor',
    '7': 'dominant7',
    maj7: 'major7',
    M7: 'major7',
    'Δ': 'major7',
    'Δ7': 'major7',
    m7: 'minor7',
    min7: 'minor7',
    '-7': 'minor7',
    dim: 'diminished',
    '°': 'diminished',
    dim7: 'diminished7',
    '°7': 'diminished7',
    m7b5: 'halfDiminished',
    'ø': 'halfDiminished',
    'ø7': 'halfDiminished',
    aug: 'augmented',
    '+': 'augmented',
    sus: 'sus4',
    sus4: 'sus4',
    sus2: 'sus2',
    '6': 'sixth',
};

const SCALE_SHAPES: Record<string, string[]> = {
    major: ['1', '2', '3', '4', '5', '6', '7'],
    Dorian: ['1', '2', 'b3', '4', '5', '6', 'b7'],
    Phrygian: ['1', 'b2', 'b3', '4', '5', 'b6', 'b7'],
    Lydian: ['1', '2', '3', '#4', '5', '6', '7'],
    Mixolydian: ['1', '2', '3', '4', '5', '6', 'b7'],
    'natural minor': ['1', '2', 'b3', '4', '5', 'b6', 'b7'],
    Locrian: ['1', 'b2', 'b3', '4', 'b5', 'b6', 'b7'],
    'Locrian ♮2': ['1', '2', 'b3', '4', 'b5', 'b6', 'b7'],
    'Lydian dominant': ['1', '2', '3', '#4', '5', '6', 'b7'],
    altered: ['1', 'b2', '#2', '3', 'b5', '#5', 'b7'],
    'whole-half diminished': ['1', '2', 'b3', '4', 'b5', '#5', '6', '7'],
    'whole tone': ['1', '2', '3', '#4', '#5', 'b7'],
    'Lydian augmented': ['1', '2', '3', '#4', '#5', '6', '7'],
    'major pentatonic': ['1', '2', '3', '5', '6'],
    'minor pentatonic': ['1', 'b3', '4', '5', 'b7'],
    blues: ['1', 'b3', '4', 'b5', '5', 'b7'],
};

const MAJOR_NUMERALS = ['I', '♭II', 'II', '♭III', 'III', 'IV', '♯IV', 'V', '♭VI', 'VI', '♭VII', 'VII'];
const MINOR_NUMERALS = ['I', '♭II', 'II', 'III', '♯III', 'IV', '♯IV', 'V', 'VI', '♯VI', 'VII', '♯VII'];
const NUMERAL_SUFFIXES: Record<QualityId, string> = {
    major: '',
    minor: '',
    dominant7: '7',
    major7: 'maj7',
    minor7: '7',
    diminished: '°',
    diminished7: '°7',
    halfDiminished: 'ø7',
    augmented: '+',
    sus4: 'sus4',
    sus2: 'sus2',
    sixth: '6',
};

const DIATONIC_MAJOR = { degrees: ['1', '2', '3', '4', '5', '6', '7'], suffixes: ['maj7', 'm7', 'm7', 'maj7', '7', 'm7', 'm7b5'] };
const DIATONIC_MINOR = { degrees: ['1', '2', 'b3', '4', '5', 'b6', 'b7'], suffixes: ['m7', 'm7b5', 'maj7', 'm7', 'm7', 'maj7', '7'] };

export const KEY_NAMES = {
    major: ['C', 'D♭', 'D', 'E♭', 'E', 'F', 'F♯', 'G', 'A♭', 'A', 'B♭', 'B'],
    minor: ['Cm', 'C♯m', 'Dm', 'E♭m', 'Em', 'Fm', 'F♯m', 'Gm', 'G♯m', 'Am', 'B♭m', 'Bm'],
};

function accidentalName(offset: number): string {
    if (offset === 0) return '';
    return offset > 0 ? '♯'.repeat(offset) : '♭'.repeat(-offset);
}

function wrapOffset(offset: number): number {
    return (((offset + 6) % 12) + 12) % 12 - 6;
}

function parseRoot(text: string): { spelling: Spelling; note: Note; rest: string } | null {
    const match = /^([A-G])([#♯b♭]?)(.*)$/.exec(text.trim());
    if (!match) return null;

    const letter = LETTERS.indexOf(match[1]);
    const offset = match[2] === '#' || match[2] === '♯' ? 1 : match[2] === '' ? 0 : -1;
    const pitch = (MAJOR_SCALE[letter] + offset + 12) % 12;

    return { spelling: { letter, pitch }, note: { name: `${match[1]}${accidentalName(offset)}`, pitch }, rest: match[3] };
}

function spell(root: Spelling, degree: string): Note {
    const match = /^([#b]*)(\d)$/.exec(degree);
    if (!match) throw new Error(`Invalid degree: ${degree}`);

    let offset = 0;
    for (const accidental of match[1]) offset += accidental === '#' ? 1 : -1;

    const step = Number.parseInt(match[2], 10) - 1;
    const letter = (root.letter + step) % 7;
    const pitch = (((root.pitch + MAJOR_SCALE[step] + offset) % 12) + 12) % 12;

    return { name: `${LETTERS[letter]}${accidentalName(wrapOffset(pitch - MAJOR_SCALE[letter]))}`, pitch };
}

function spellAll(root: Spelling, degrees: string[]): Note[] {
    return degrees.map(degree => spell(root, degree));
}

function notesText(notes: Note[]): string {
    return notes.map(note => note.name).join(', ');
}

function spellingOf(note: Note): Spelling {
    return { letter: LETTERS.indexOf(note.name[0]), pitch: note.pitch };
}

export function parseChord(text: string): Chord | null {
    const parsed = parseRoot(text);
    if (!parsed) return null;

    const quality = QUALITY_ALIASES[parsed.rest.trim()];
    if (!quality) return null;

    const rule = QUALITIES[quality];

    return {
        name: `${parsed.note.name}${rule.suffix}`,
        root: parsed.note,
        quality,
        notes: spellAll(parsed.spelling, rule.degrees),
        guideTones: spellAll(parsed.spelling, rule.guideDegrees),
    };
}

export function parseKey(text: string): Key | null {
    const parsed = parseRoot(text);
    if (!parsed) return null;

    const minor = parsed.rest === 'm';
    if (!minor && parsed.rest !== '') return null;

    const majorPitches = spellAll(parsed.spelling, SCALE_SHAPES.major).map(note => note.pitch);
    const minorPitches = spellAll(parsed.spelling, SCALE_SHAPES['natural minor']).map(note => note.pitch);
    const leadingTone = majorPitches[6];

    return {
        name: `${parsed.note.name} ${minor ? 'minor' : 'major'}`,
        root: parsed.note,
        minor,
        pitches: minor ? [...minorPitches, leadingTone] : majorPitches,
        parallelPitches: minor ? majorPitches : minorPitches,
        parallelName: `${parsed.note.name} ${minor ? 'major' : 'minor'}`,
    };
}

export function getDiatonicChords(key: Key): string[] {
    const table = key.minor ? DIATONIC_MINOR : DIATONIC_MAJOR;
    const spelling = spellingOf(key.root);

    return table.degrees.map((degree, index) => `${spell(spelling, degree).name}${table.suffixes[index]}`);
}

export function getChordFunction(key: Key, chord: Chord): ChordFunction {
    const interval = (chord.root.pitch - key.root.pitch + 12) % 12;
    const base = (key.minor ? MINOR_NUMERALS : MAJOR_NUMERALS)[interval];
    const rule = QUALITIES[chord.quality];
    const numeral = `${rule.lowerCase ? base.toLowerCase() : base}${NUMERAL_SUFFIXES[chord.quality]}`;
    const pitches = chord.notes.map(note => note.pitch);

    if (pitches.every(pitch => key.pitches.includes(pitch))) return { numeral, status: 'diatonic', label: `${numeral} in ${key.name}, built from the key's own notes` };
    if (pitches.every(pitch => key.parallelPitches.includes(pitch))) return { numeral, status: 'borrowed', label: `${numeral}, borrowed from ${key.parallelName}` };

    return { numeral, status: 'outside', label: `${numeral}, outside ${key.name}` };
}

export function getScaleOptions(key: Key, chord: Chord, chordFunction: ChordFunction): ScaleOption[] {
    const rootSpelling = spellingOf(chord.root);
    const chordPitches = chord.notes.map(note => note.pitch);

    const scales = QUALITIES[chord.quality].scales.map((scaleName, priority) => {
        const notes = spellAll(rootSpelling, SCALE_SHAPES[scaleName]);
        const outsideNotes = notes.filter(note => !key.pitches.includes(note.pitch));
        const held = chordPitches.filter(pitch => notes.some(note => note.pitch === pitch)).length;
        const title = `${chord.root.name} ${scaleName}`;
        const outside = outsideNotes.length === 0 ? 'every note is in the key' : `${notesText(outsideNotes)} ${outsideNotes.length === 1 ? 'is' : 'are'} outside the key and will be marked`;

        const option: ScaleOption = {
            id: `scale-${scaleName}`,
            kind: 'scale',
            title,
            notes,
            keyFit: notes.length - outsideNotes.length,
            outsideNotes,
            description: `${title} scale: ${notesText(notes)}.`,
            reason: `${title} holds ${held} of the ${chordPitches.length} notes of ${chord.name}, the ${chordFunction.label}. Over ${key.name}, ${outside}.`,
        };

        return { priority, option };
    });

    scales.sort((a, b) => b.option.outsideNotes.length === a.option.outsideNotes.length ? a.priority - b.priority : a.option.outsideNotes.length - b.option.outsideNotes.length);

    const arpeggio: ScaleOption = {
        id: 'arpeggio',
        kind: 'arpeggio',
        title: `${chord.name} arpeggio`,
        notes: chord.notes,
        keyFit: chord.notes.filter(note => key.pitches.includes(note.pitch)).length,
        outsideNotes: chord.notes.filter(note => !key.pitches.includes(note.pitch)),
        description: `${chord.name} arpeggio: ${notesText(chord.notes)}.`,
        reason: `The arpeggio plays the chord tones of ${chord.name} (${notesText(chord.notes)}), so every note states the harmony directly. Chord tones on strong beats make the chord clear.`,
    };

    return [...scales.map(scale => scale.option), arpeggio];
}

export function describeGuideTones(chord: Chord, next: Chord | null): string {
    const current = `Guide tones of ${chord.name}: ${notesText(chord.guideTones)}.`;
    if (!next) return current;

    const moves = chord.guideTones.map(tone => {
        let target = next.guideTones[0];
        let distance = 12;

        for (const candidate of next.guideTones) {
            const gap = Math.abs(candidate.pitch - tone.pitch);
            const steps = Math.min(gap, 12 - gap);

            if (steps >= distance) continue;

            distance = steps;
            target = candidate;
        }

        if (distance === 0) return `${tone.name} stays as ${target.name}`;
        return `${tone.name} moves to ${target.name} by ${distance === 1 ? 'a half step' : distance === 2 ? 'a whole step' : `${distance} half steps`}`;
    });

    return `${current} Guide tones of the next chord ${next.name}: ${notesText(next.guideTones)}. ${moves.join('; ')}.`;
}
