import type { Song } from '@/db/types';

type Chord = Song['sections'][number]['chords'][number];
type Note = Song['sections'][number]['notes'][number];

const LETTERS = 'CDEFGAB';
const LETTER_SEMITONES = [0, 2, 4, 5, 7, 9, 11];
const SHARP_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const OPEN_STRINGS = [64, 59, 55, 50, 45, 40];
const MAX_FRET = 24;
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

const SCALE_INTERVALS: Record<string, number[]> = {
    Ionian: [0, 2, 4, 5, 7, 9, 11],
    Dorian: [0, 2, 3, 5, 7, 9, 10],
    Mixolydian: [0, 2, 4, 5, 7, 9, 10],
    Locrian: [0, 1, 3, 5, 6, 8, 10],
    'Diminished (whole-half)': [0, 2, 3, 5, 6, 8, 9, 11],
    'Whole tone': [0, 2, 4, 6, 8, 10],
};

const CHORD_SCALES: Record<string, string> = {
    '': 'Ionian',
    maj7: 'Ionian',
    '6': 'Ionian',
    maj9: 'Ionian',
    add9: 'Ionian',
    m: 'Dorian',
    m7: 'Dorian',
    m6: 'Dorian',
    m9: 'Dorian',
    '7': 'Mixolydian',
    '9': 'Mixolydian',
    sus2: 'Mixolydian',
    sus4: 'Mixolydian',
    m7b5: 'Locrian',
    dim: 'Diminished (whole-half)',
    dim7: 'Diminished (whole-half)',
    aug: 'Whole tone',
};

export const NOTE_STATUSES = {
    chord: { label: 'chord tone', symbol: '✓' },
    scale: { label: 'in the scale', symbol: '✓' },
    outside: { label: 'outside the scale', symbol: '!' },
    none: { label: 'no chord to check against', symbol: '' },
};

function wrap(semitone: number): number {
    return ((semitone % 12) + 12) % 12;
}

function getSemitone(letter: string, accidental: string): number {
    let semitone = LETTER_SEMITONES[LETTERS.indexOf(letter)];
    if (accidental === '#') semitone++;
    if (accidental === 'b') semitone--;
    return semitone;
}

function getPitchName(midi: number): string {
    return `${SHARP_NAMES[wrap(midi)]}${Math.floor(midi / 12) - 1}`;
}

function parsePitch(pitch: string): RegExpExecArray | null {
    return /^([A-G])([#b]?)(-?\d)$/.exec(pitch);
}

function parseChord(name: string): RegExpExecArray | null {
    const match = /^([A-G])([#b]?)(.*)$/.exec(name.trim());
    if (!match || !CHORD_INTERVALS[match[3]]) return null;
    return match;
}

function getKeyTones(key: string): number[] {
    const match = /^([A-G])([#b]?)\s*(minor|min|m)?$/.exec(key.trim());
    if (!match) return [];

    let tonic = getSemitone(match[1], match[2]);
    if (match[3]) tonic += 3;

    const tones: number[] = [];

    for (const interval of SCALE_INTERVALS.Ionian) {
        tones.push(wrap(tonic + interval));
    }

    return tones;
}

export function formatPitch(text: string): string | null {
    const match = /^([A-Ga-g])([#b♯♭]?)(-?\d)$/.exec(text.trim());
    if (!match) return null;

    let accidental = match[2];
    if (accidental === '♯') accidental = '#';
    if (accidental === '♭') accidental = 'b';

    return `${match[1].toUpperCase()}${accidental}${match[3]}`;
}

export function getMidi(pitch: string): number {
    const match = parsePitch(pitch);
    if (!match) return 0;

    return (parseInt(match[3], 10) + 1) * 12 + getSemitone(match[1], match[2]);
}

export function getStaffStep(pitch: string): number {
    const match = parsePitch(pitch);
    if (!match) return 0;

    return parseInt(match[3], 10) * 7 + LETTERS.indexOf(match[1]) - 30;
}

export function getFretPitch(string: number, fret: number): string | null {
    if (string < 1 || string > OPEN_STRINGS.length) return null;
    if (!Number.isInteger(fret) || fret < 0 || fret > MAX_FRET) return null;

    return getPitchName(OPEN_STRINGS[string - 1] + fret);
}

export function getFretPosition(pitch: string): Pick<Note, 'string' | 'fret'> {
    const midi = getMidi(pitch);
    let position: Pick<Note, 'string' | 'fret'> = { string: null, fret: null };

    for (let index = 0; index < OPEN_STRINGS.length; index++) {
        const fret = midi - OPEN_STRINGS[index];
        if (fret < 0 || fret > MAX_FRET) continue;
        if (position.fret === null || fret < position.fret) position = { string: index + 1, fret };
    }

    return position;
}

export function getChordAt(chords: Chord[], bar: number, beat: number): Chord | undefined {
    let current: Chord | undefined;

    for (const chord of chords) {
        if (chord.bar > bar) continue;
        if (chord.bar === bar && chord.beat > beat) continue;
        if (!current || chord.bar > current.bar || (chord.bar === current.bar && chord.beat >= current.beat)) current = chord;
    }

    return current ?? chords[0];
}

export function getChordTones(name: string): number[] {
    const match = parseChord(name);
    if (!match) return [];

    const tones: number[] = [];

    for (const interval of CHORD_INTERVALS[match[3]]) {
        tones.push(wrap(getSemitone(match[1], match[2]) + interval));
    }

    return tones;
}

export function getInKey(name: string, key: string): boolean {
    const keyTones = getKeyTones(key);
    if (keyTones.length === 0) return true;

    for (const tone of getChordTones(name)) {
        if (!keyTones.includes(tone)) return false;
    }

    return true;
}

export function getScaleName(name: string, key: string): string {
    const match = parseChord(name);
    if (!match) return '';

    const keyTones = getKeyTones(key);
    if (keyTones.length > 0 && getInKey(name, key)) return `${match[1]}${match[2]} ${MODE_NAMES[keyTones.indexOf(wrap(getSemitone(match[1], match[2])))]}`;

    return `${match[1]}${match[2]} ${CHORD_SCALES[match[3]]}`;
}

function getScaleTones(name: string, key: string): number[] {
    const match = parseChord(name);
    if (!match) return [];

    const keyTones = getKeyTones(key);
    if (keyTones.length > 0 && getInKey(name, key)) return keyTones;

    const tones: number[] = [];

    for (const interval of SCALE_INTERVALS[CHORD_SCALES[match[3]]]) {
        tones.push(wrap(getSemitone(match[1], match[2]) + interval));
    }

    return tones;
}

export function getNoteStatus(pitch: string, chord: Chord | undefined, key: string): keyof typeof NOTE_STATUSES {
    if (!chord) return 'none';

    const chordTones = getChordTones(chord.name);
    if (chordTones.length === 0) return 'none';

    const pitchClass = wrap(getMidi(pitch));
    if (chordTones.includes(pitchClass)) return 'chord';
    if (getScaleTones(chord.name, key).includes(pitchClass)) return 'scale';

    return 'outside';
}

const PHRASE_TITLES = {
    rising: 'Rising chord tones with stepwise passing notes',
    falling: 'Falling chord tones with stepwise passing notes',
    guide: 'Guide tones on the strong beats',
};

export function proposePhrases(key: string, chords: Pick<Chord, 'beat' | 'name'>[]) {
    const ordered = [...chords].sort((first, second) => first.beat - second.beat);
    const proposals = [];

    if (ordered.length === 0) return null;

    for (const chord of ordered) {
        if (getChordTones(chord.name).length === 0) return null;
    }

    for (const [style, title] of Object.entries(PHRASE_TITLES)) {
        const notes: Pick<Note, 'beat' | 'duration' | 'pitch'>[] = [];
        let strongCount = 0;
        let last: number | null = null;

        for (let index = 0; index < ordered.length; index++) {
            const tones = getChordTones(ordered[index].name);
            const chordNotes: number[] = [];
            const scaleNotes: number[] = [];
            const beats: number[] = [];
            const midis: number[] = [];
            let start = ordered[index].beat;

            for (let midi = 60; midi <= 83; midi++) {
                if (tones.includes(wrap(midi))) chordNotes.push(midi);
                if (getScaleTones(ordered[index].name, key).includes(wrap(midi))) scaleNotes.push(midi);
            }

            if (index === 0) start = 1;

            for (let beat = start; beat < (ordered[index + 1]?.beat ?? 5); beat++) {
                beats.push(beat);
                midis.push(0);
            }

            const rootIndex = chordNotes.findIndex(midi => wrap(midi) === tones[0]);
            let top = chordNotes.findIndex(midi => midi >= chordNotes[rootIndex] + 12);
            if (top === -1) top = chordNotes.length - 1;

            for (let position = 0; position < beats.length; position++) {
                if (position > 0 && beats[position] % 2 !== 1) continue;

                if (style === 'rising') midis[position] = chordNotes[Math.min(rootIndex + strongCount, chordNotes.length - 1)];
                if (style === 'falling') midis[position] = chordNotes[Math.max(top - strongCount, 0)];

                if (style === 'guide') {
                    for (const midi of chordNotes) {
                        if (wrap(midi) !== [tones[1], tones[tones.length > 3 ? 3 : 2]][strongCount % 2]) continue;
                        if (midis[position] === 0 || Math.abs(midi - (last ?? 67)) < Math.abs(midis[position] - (last ?? 67))) midis[position] = midi;
                    }
                }

                strongCount++;
                last = midis[position];
            }

            for (let position = 1; position < beats.length; position++) {
                if (midis[position] !== 0) continue;

                const next = midis.slice(position + 1).find(midi => midi !== 0);
                const previousIndex = scaleNotes.indexOf(midis[position - 1]);
                let goesUp = style !== 'falling';
                if (next !== undefined) goesUp = next >= midis[position - 1];

                midis[position] = scaleNotes[goesUp ? Math.min(previousIndex + 1, scaleNotes.length - 1) : Math.max(previousIndex - 1, 0)];
            }

            for (let position = 0; position < beats.length; position++) {
                notes.push({ beat: beats[position], duration: 1, pitch: getPitchName(midis[position]) });
            }
        }

        proposals.push({
            title,
            chord: ordered.map(chord => chord.name).join(' → '),
            scale: ordered.map(chord => getScaleName(chord.name, key)).join(' → '),
            chordTones: getChordTones(ordered[0].name).map(tone => SHARP_NAMES[tone]),
            keyLabel: ordered.map(chord => `${chord.name}: ${getInKey(chord.name, key) ? 'inside the key' : 'borrowed or outside the key'}`).join('; '),
            notes,
        });
    }

    return proposals;
}
