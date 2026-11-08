import { getUniquePitchClasses, spellFormula } from './notes.ts';
import type { Scale, ScaleDefinition } from './types.ts';

export const SCALE_DEFINITIONS: ScaleDefinition[] = [
    { name: 'Ionian', formula: ['1', '2', '3', '4', '5', '6', '7'], families: { major: 0.9, power: 0.6, suspended: 0.4 }, character: 'Its plain major sound is stable and resolved.' },
    { name: 'Lydian', formula: ['1', '2', '3', '#4', '5', '6', '7'], families: { major: 0.75 }, character: 'The raised fourth gives the chord a bright, floating sound.' },
    { name: 'Mixolydian', formula: ['1', '2', '3', '4', '5', '6', 'b7'], families: { dominant: 1, major: 0.5, suspended: 0.8, power: 0.6 }, character: 'The flat seventh keeps the major sound but adds a relaxed, bluesy pull.' },
    { name: 'Major pentatonic', formula: ['1', '2', '3', '5', '6'], families: { major: 0.6, suspended: 0.5, power: 0.5 }, character: 'With only five notes it is open and easy to sing, and it avoids the fourth that can clash with the chord.' },
    { name: 'Dominant pentatonic', formula: ['1', '2', '3', '5', 'b7'], families: { dominant: 0.6 }, character: 'Five notes outline the dominant sound without the fourth and sixth.' },
    { name: 'Dorian', formula: ['1', '2', 'b3', '4', '5', '6', 'b7'], families: { minor: 0.95, suspended: 0.6, power: 0.6 }, character: 'The natural sixth makes a minor chord sound lighter and more open.' },
    { name: 'Aeolian', formula: ['1', '2', 'b3', '4', '5', 'b6', 'b7'], families: { minor: 0.8, power: 0.5 }, character: 'The flat sixth gives it a darker, more somber minor sound.' },
    { name: 'Phrygian', formula: ['1', 'b2', 'b3', '4', '5', 'b6', 'b7'], families: { minor: 0.45, suspended: 0.3 }, character: 'The flat second adds a tense, dark color.' },
    { name: 'Minor pentatonic', formula: ['1', 'b3', '4', '5', 'b7'], families: { minor: 0.7, suspended: 0.6, power: 0.5 }, character: 'Five notes give a direct, familiar minor sound with no half steps.' },
    { name: 'Blues', formula: ['1', 'b3', '4', 'b5', '5', 'b7'], families: { minor: 0.55, power: 0.4 }, character: 'The added flat fifth is a blue note that brings a gritty, bluesy edge.' },
    { name: 'Harmonic minor', formula: ['1', '2', 'b3', '4', '5', 'b6', '7'], families: { minor: 0.4, minorMajor: 0.8 }, character: 'The gap between the flat sixth and the natural seventh gives it a dramatic, classical sound.' },
    { name: 'Melodic minor', formula: ['1', '2', 'b3', '4', '5', '6', '7'], families: { minorMajor: 1, minor: 0.4 }, character: 'It keeps the minor third but raises the sixth and seventh, so it sounds smooth and slightly bright.' },
    { name: 'Lydian dominant', formula: ['1', '2', '3', '#4', '5', '6', 'b7'], families: { dominant: 0.75 }, character: 'The raised fourth brightens the dominant sound.' },
    { name: 'Mixolydian b6', formula: ['1', '2', '3', '4', '5', 'b6', 'b7'], families: { dominant: 0.5 }, character: 'The flat sixth adds a darker, more yearning color to the dominant sound.' },
    { name: 'Phrygian dominant', formula: ['1', 'b2', '3', '4', '5', 'b6', 'b7'], families: { dominant: 0.55 }, character: 'The flat second beside the major third gives it a tense, exotic sound.' },
    { name: 'Altered', formula: ['1', 'b2', '#2', '3', '#4', '#5', 'b7'], families: { dominant: 0.6 }, character: 'Every upper note is altered, so it adds strong tension that wants to resolve.' },
    { name: 'Half-whole diminished', formula: ['1', 'b2', '#2', '3', '#4', '5', '6', 'b7'], families: { dominant: 0.55 }, character: 'Alternating half and whole steps give an unsettled, tense dominant sound.' },
    { name: 'Whole tone', formula: ['1', '2', '3', '#4', '#5', 'b7'], families: { dominant: 0.5, augmented: 0.9 }, character: 'Every step is a whole step, so it sounds dreamy and has no clear resting point.' },
    { name: 'Lydian augmented', formula: ['1', '2', '3', '#4', '#5', '6', '7'], families: { augmented: 0.7 }, character: 'The raised fifth and fourth give an airy, bright sound.' },
    { name: 'Locrian', formula: ['1', 'b2', 'b3', '4', 'b5', 'b6', 'b7'], families: { halfDiminished: 0.85 }, character: 'The flat second and flat fifth make it unstable and dark.' },
    { name: 'Locrian natural 2', formula: ['1', '2', 'b3', '4', 'b5', 'b6', 'b7'], families: { halfDiminished: 0.95 }, character: 'The natural second softens the Locrian sound while keeping the flat fifth.' },
    { name: 'Whole-half diminished', formula: ['1', '2', 'b3', '4', 'b5', 'b6', 'bb7', '7'], families: { diminished: 1 }, character: 'Alternating whole and half steps give a symmetrical, tense sound that fits diminished chords.' },
];

export function buildScale(root: string, name: string, formula: string[]): Scale {
    const notes = spellFormula(root, formula);
    return {
        root,
        name,
        notes,
        pitchClasses: getUniquePitchClasses(notes),
        description: `${root} ${name} scale: ${notes.join(', ')}.`,
    };
}

export function buildDefinedScale(root: string, name: string): Scale | null {
    for (const definition of SCALE_DEFINITIONS) {
        if (definition.name === name) return buildScale(root, definition.name, definition.formula);
    }

    return null;
}

export function getNoteInScale(note: string, scale: Scale): boolean {
    return getUniquePitchClasses([note]).some(pitchClass => scale.pitchClasses.includes(pitchClass));
}
