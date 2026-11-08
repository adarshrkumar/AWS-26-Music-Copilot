import { parseNote } from './notes.ts';
import { buildScale } from './scales.ts';
import type { Chord, Key, KeyMode } from './types.ts';

const MAJOR_FORMULA = ['1', '2', '3', '4', '5', '6', '7'];
const MINOR_FORMULA = ['1', '2', 'b3', '4', '5', 'b6', 'b7'];
const HARMONIC_MINOR_FORMULA = ['1', '2', 'b3', '4', '5', 'b6', '7'];
const ROMAN_NUMERALS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];

export function parseKey(name: string): Key | null {
    const match = /^([A-Ga-g])([#b]?)\s*(.*)$/.exec(name.trim());
    if (!match) return null;

    const tonic = match[1].toUpperCase() + match[2];
    const suffix = match[3].trim();
    const lowerSuffix = suffix.toLowerCase();

    let mode: KeyMode;
    if (suffix === 'm' || lowerSuffix === 'min' || lowerSuffix === 'minor') mode = 'minor';
    else if (suffix === '' || suffix === 'M' || lowerSuffix === 'maj' || lowerSuffix === 'major') mode = 'major';
    else return null;

    const major = buildScale(tonic, 'major', MAJOR_FORMULA);
    const minor = buildScale(tonic, 'minor', MINOR_FORMULA);

    return {
        name: `${tonic} ${mode}`,
        tonic,
        mode,
        scale: mode === 'major' ? major : minor,
        harmonicMinor: mode === 'minor' ? buildScale(tonic, 'harmonic minor', HARMONIC_MINOR_FORMULA) : null,
        parallel: mode === 'major' ? minor : major,
    };
}

export function getDegreeLabel(key: Key, rootPitchClass: number) {
    const intervals = key.scale.pitchClasses.map(pitchClass => (pitchClass - (parseNote(key.tonic)?.pitchClass ?? 0) + 12) % 12);
    const interval = (rootPitchClass - (parseNote(key.tonic)?.pitchClass ?? 0) + 12) % 12;

    const exact = intervals.indexOf(interval);
    if (exact >= 0) return { degree: exact + 1, prefix: '' };

    const preferSharp = interval === 6 || (key.mode === 'minor' && (interval === 4 || interval === 9));
    const below = intervals.indexOf((interval + 11) % 12);
    const above = intervals.indexOf((interval + 1) % 12);

    if (preferSharp && below >= 0) return { degree: below + 1, prefix: '#' };
    if (above >= 0) return { degree: above + 1, prefix: 'b' };
    return { degree: below + 1, prefix: '#' };
}

export function getChordNumeral(key: Key, chord: Chord): string {
    const rootPitchClass = parseNote(chord.root)?.pitchClass ?? 0;
    const label = getDegreeLabel(key, rootPitchClass);
    const base = ROMAN_NUMERALS[label.degree - 1];

    return `${label.prefix}${chord.hasMinorThird ? base.toLowerCase() : base}${chord.romanSuffix}`;
}

export function getTriadNumeral(key: Key, degreeIndex: number): string | null {
    const pitchClasses = key.scale.pitchClasses;
    const root = pitchClasses[degreeIndex];
    const third = (pitchClasses[(degreeIndex + 2) % 7] - root + 12) % 12;
    const fifth = (pitchClasses[(degreeIndex + 4) % 7] - root + 12) % 12;

    if (fifth !== 7) return null;
    return third === 3 ? ROMAN_NUMERALS[degreeIndex].toLowerCase() : ROMAN_NUMERALS[degreeIndex];
}
