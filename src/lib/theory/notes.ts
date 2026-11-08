import type { ParsedNote } from './types.ts';

const LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
const LETTER_PITCH_CLASSES = [0, 2, 4, 5, 7, 9, 11];

export function parseNote(name: string): ParsedNote | null {
    const match = /^([A-Ga-g])(#{1,2}|b{1,2})?(-?\d+)?$/.exec(name.trim());
    if (!match) return null;

    const letterIndex = LETTERS.indexOf(match[1].toUpperCase());
    const accidentalText = match[2] ?? '';
    const accidental = accidentalText.startsWith('#') ? accidentalText.length : -accidentalText.length;
    const pitchClass = (((LETTER_PITCH_CLASSES[letterIndex] + accidental) % 12) + 12) % 12;
    const octave = match[3] === undefined ? null : Number(match[3]);

    return { letterIndex, accidental, pitchClass, octave };
}

export function getPitchClass(name: string): number | null {
    return parseNote(name)?.pitchClass ?? null;
}

export function spellDegree(root: string, degree: string): string {
    const parsedRoot = parseNote(root);
    const match = /^([#b]*)(\d+)$/.exec(degree);
    if (!parsedRoot || !match) throw new Error(`Cannot spell degree "${degree}" above "${root}".`);

    const shift = match[1].startsWith('#') ? match[1].length : -match[1].length;
    const number = Number(match[2]);
    const offset = number - 1;
    const semitones = LETTER_PITCH_CLASSES[offset % 7] + 12 * Math.floor(offset / 7) + shift;

    const letterIndex = (parsedRoot.letterIndex + offset) % 7;
    const target = (parsedRoot.pitchClass + semitones) % 12;
    const accidental = ((((target - LETTER_PITCH_CLASSES[letterIndex]) % 12) + 18) % 12) - 6;

    if (accidental === 0) return LETTERS[letterIndex];
    return LETTERS[letterIndex] + (accidental > 0 ? '#'.repeat(accidental) : 'b'.repeat(-accidental));
}

export function spellFormula(root: string, formula: string[]): string[] {
    return formula.map(degree => spellDegree(root, degree));
}

export function getUniquePitchClasses(notes: string[]): number[] {
    const result: number[] = [];

    for (const note of notes) {
        const pitchClass = getPitchClass(note);
        if (pitchClass !== null && !result.includes(pitchClass)) result.push(pitchClass);
    }

    return result;
}

export function getInterval(from: number, to: number): number {
    return ((((to - from) % 12) + 18) % 12) - 6;
}
