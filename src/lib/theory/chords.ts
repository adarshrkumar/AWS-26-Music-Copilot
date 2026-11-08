import { getUniquePitchClasses, parseNote, spellFormula } from './notes.ts';
import type { Chord, QualityDefinition } from './types.ts';

const QUALITIES: QualityDefinition[] = [
    { aliases: ['', 'maj', 'M'], family: 'major', formula: ['1', '3', '5'], guideDegrees: ['3', '5'], romanSuffix: '' },
    { aliases: ['m', 'min', '-'], family: 'minor', formula: ['1', 'b3', '5'], guideDegrees: ['b3', '5'], romanSuffix: '' },
    { aliases: ['dim', '°', 'o'], family: 'diminished', formula: ['1', 'b3', 'b5'], guideDegrees: ['b3', 'b5'], romanSuffix: '°' },
    { aliases: ['aug', '+'], family: 'augmented', formula: ['1', '3', '#5'], guideDegrees: ['3', '#5'], romanSuffix: '+' },
    { aliases: ['sus2'], family: 'suspended', formula: ['1', '2', '5'], guideDegrees: ['2', '5'], romanSuffix: 'sus2' },
    { aliases: ['sus4', 'sus'], family: 'suspended', formula: ['1', '4', '5'], guideDegrees: ['4', '5'], romanSuffix: 'sus4' },
    { aliases: ['5'], family: 'power', formula: ['1', '5'], guideDegrees: ['5'], romanSuffix: '5' },
    { aliases: ['6'], family: 'major', formula: ['1', '3', '5', '6'], guideDegrees: ['3', '6'], romanSuffix: '6' },
    { aliases: ['m6', 'min6', '-6'], family: 'minor', formula: ['1', 'b3', '5', '6'], guideDegrees: ['b3', '6'], romanSuffix: '6' },
    { aliases: ['add9'], family: 'major', formula: ['1', '3', '5', '9'], guideDegrees: ['3', '5'], romanSuffix: 'add9' },
    { aliases: ['7', 'dom7'], family: 'dominant', formula: ['1', '3', '5', 'b7'], guideDegrees: ['3', 'b7'], romanSuffix: '7' },
    { aliases: ['maj7', 'M7', 'Δ', 'Δ7'], family: 'major', formula: ['1', '3', '5', '7'], guideDegrees: ['3', '7'], romanSuffix: 'maj7' },
    { aliases: ['m7', 'min7', '-7'], family: 'minor', formula: ['1', 'b3', '5', 'b7'], guideDegrees: ['b3', 'b7'], romanSuffix: '7' },
    { aliases: ['m7b5', 'min7b5', '-7b5', 'ø', 'ø7'], family: 'halfDiminished', formula: ['1', 'b3', 'b5', 'b7'], guideDegrees: ['b3', 'b7'], romanSuffix: 'ø7' },
    { aliases: ['dim7', '°7', 'o7'], family: 'diminished', formula: ['1', 'b3', 'b5', 'bb7'], guideDegrees: ['b3', 'bb7'], romanSuffix: '°7' },
    { aliases: ['mMaj7', 'mM7', 'minMaj7', 'm(maj7)', '-maj7'], family: 'minorMajor', formula: ['1', 'b3', '5', '7'], guideDegrees: ['b3', '7'], romanSuffix: 'maj7' },
    { aliases: ['9', 'dom9'], family: 'dominant', formula: ['1', '3', '5', 'b7', '9'], guideDegrees: ['3', 'b7'], romanSuffix: '9' },
    { aliases: ['m9', 'min9', '-9'], family: 'minor', formula: ['1', 'b3', '5', 'b7', '9'], guideDegrees: ['b3', 'b7'], romanSuffix: '9' },
    { aliases: ['maj9', 'M9'], family: 'major', formula: ['1', '3', '5', '7', '9'], guideDegrees: ['3', '7'], romanSuffix: 'maj9' },
    { aliases: ['7sus4', '7sus'], family: 'suspended', formula: ['1', '4', '5', 'b7'], guideDegrees: ['4', 'b7'], romanSuffix: '7sus4' },
    { aliases: ['7b9'], family: 'dominant', formula: ['1', '3', '5', 'b7', 'b9'], guideDegrees: ['3', 'b7'], romanSuffix: '7b9' },
    { aliases: ['7#9'], family: 'dominant', formula: ['1', '3', '5', 'b7', '#9'], guideDegrees: ['3', 'b7'], romanSuffix: '7#9' },
    { aliases: ['7#5', 'aug7', '+7'], family: 'augmented', formula: ['1', '3', '#5', 'b7'], guideDegrees: ['3', 'b7'], romanSuffix: '+7' },
];

const ROLE_NAMES: Record<string, string> = {
    '2': 'second',
    '3': 'third',
    '4': 'fourth',
    '5': 'fifth',
    '6': 'sixth',
    '7': 'seventh',
    '9': 'ninth',
};

export function getDegreeRole(degree: string): string {
    return ROLE_NAMES[degree.replace(/^[#b]+/, '')] ?? 'tone';
}

function getDegreeNumber(degree: string): number {
    return Number(degree.replace(/^[#b]+/, ''));
}

export function parseChord(name: string): Chord | null {
    const cleaned = name.replace(/\s+/g, '');
    const match = /^([A-G])([#b]?)(.*?)(?:\/([A-G][#b]?))?$/.exec(cleaned);
    if (!match) return null;

    const root = match[1] + match[2];
    const bass = match[4] ?? null;
    const definition = QUALITIES.find(quality => quality.aliases.includes(match[3]));
    if (!definition || !parseNote(root) || (bass !== null && !parseNote(bass))) return null;

    const notes = spellFormula(root, definition.formula);
    const coreFormula = definition.formula.filter(degree => getDegreeNumber(degree) < 9);
    const hasSeventh = definition.formula.some(degree => getDegreeNumber(degree) === 7);
    const essentialFormula = hasSeventh ? definition.formula.filter(degree => degree !== '5') : definition.formula;

    return {
        name: cleaned,
        root,
        bass,
        quality: match[3],
        family: definition.family,
        formula: definition.formula,
        notes,
        pitchClasses: getUniquePitchClasses(notes),
        corePitchClasses: getUniquePitchClasses(spellFormula(root, coreFormula)),
        essentialPitchClasses: getUniquePitchClasses(spellFormula(root, essentialFormula)),
        guideDegrees: definition.guideDegrees,
        romanSuffix: definition.romanSuffix,
        hasSeventh,
        hasMinorThird: definition.formula.includes('b3'),
    };
}
