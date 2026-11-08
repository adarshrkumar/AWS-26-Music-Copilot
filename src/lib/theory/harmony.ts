import { getChordNumeral, getDegreeLabel, getTriadNumeral } from './keys.ts';
import { getInterval, parseNote } from './notes.ts';
import type { Chord, ChordContext, HarmonicFunction, Key, Scale } from './types.ts';

const DIATONIC_FUNCTIONS: Record<number, HarmonicFunction> = {
    1: 'tonic',
    2: 'subdominant',
    3: 'tonic',
    4: 'subdominant',
    5: 'dominant',
    6: 'tonic',
    7: 'dominant',
};

const BORROWED_FUNCTIONS: Record<number, HarmonicFunction> = {
    1: 'tonic',
    2: 'subdominant',
    3: 'tonic',
    4: 'subdominant',
    5: 'dominant',
    6: 'subdominant',
    7: 'dominant',
};

const FUNCTION_TEXT: Record<HarmonicFunction, string> = {
    tonic: 'Tonic chords feel like rest or home.',
    subdominant: 'Subdominant chords move away from home and often lead toward the dominant.',
    dominant: 'Dominant chords build tension that usually resolves to the tonic.',
    chromatic: 'Chromatic chords add color without a fixed place in the key.',
};

function capitalize(text: string): string {
    return text.charAt(0).toUpperCase() + text.slice(1);
}

function fitsScale(chord: Chord, scale: Scale): boolean {
    return chord.corePitchClasses.every(pitchClass => scale.pitchClasses.includes(pitchClass));
}

export function classifyChord(key: Key, chord: Chord): ChordContext {
    const rootPitchClass = parseNote(chord.root)?.pitchClass ?? 0;
    const roman = getChordNumeral(key, chord);
    const label = getDegreeLabel(key, rootPitchClass);

    if (fitsScale(chord, key.scale)) {
        const harmonicFunction = DIATONIC_FUNCTIONS[label.degree];
        return {
            status: 'diatonic',
            harmonicMinor: false,
            degree: label.degree,
            roman,
            harmonicFunction,
            secondaryTarget: null,
            reference: key.scale,
            description: `${capitalize(harmonicFunction)} (${roman}) in ${key.name}`,
            reason: `${chord.name} is ${roman} in ${key.name}. ${FUNCTION_TEXT[harmonicFunction]}`,
        };
    }

    const rootInterval = getInterval(parseNote(key.tonic)?.pitchClass ?? 0, rootPitchClass);
    if (key.harmonicMinor && (rootInterval === -5 || rootInterval === -1) && fitsScale(chord, key.harmonicMinor)) {
        const harmonicFunction = DIATONIC_FUNCTIONS[label.degree];
        return {
            status: 'diatonic',
            harmonicMinor: true,
            degree: label.degree,
            roman,
            harmonicFunction,
            secondaryTarget: null,
            reference: key.harmonicMinor,
            description: `${capitalize(harmonicFunction)} (${roman}) in ${key.name}, using the raised seventh of harmonic minor`,
            reason: `${chord.name} is ${roman} in ${key.name}, and it uses the raised seventh of the harmonic minor scale. ${FUNCTION_TEXT[harmonicFunction]}`,
        };
    }

    const parallelName = `${key.parallel.root} ${key.parallel.name}`;

    if (fitsScale(chord, key.parallel)) {
        const harmonicFunction = BORROWED_FUNCTIONS[label.degree];
        const color = key.mode === 'major' ? 'a darker' : 'a brighter';
        return {
            status: 'borrowed',
            harmonicMinor: false,
            degree: label.degree,
            roman,
            harmonicFunction,
            secondaryTarget: null,
            reference: key.parallel,
            description: `Borrowed ${harmonicFunction} (${roman}) from ${parallelName}`,
            reason: `${chord.name} (${roman}) is borrowed from ${parallelName}, so it sits outside ${key.name}. It is kept as written and adds ${color} color.`,
        };
    }

    let secondaryTarget: string | null = null;

    if (chord.family === 'dominant' || chord.formula.join(' ') === '1 3 5') {
        const intervals = key.scale.pitchClasses.map(pitchClass => (pitchClass - (parseNote(key.tonic)?.pitchClass ?? 0) + 12) % 12);

        for (let index = 1; index < intervals.length; index++) {
            if ((intervals[index] + 7 - (rootPitchClass - (parseNote(key.tonic)?.pitchClass ?? 0)) + 24) % 12 !== 0) continue;

            secondaryTarget = getTriadNumeral(key, index);
            if (secondaryTarget) break;
        }
    }

    if (secondaryTarget) {
        const secondaryRoman = `V${chord.romanSuffix}/${secondaryTarget}`;
        return {
            status: 'outside',
            harmonicMinor: false,
            degree: null,
            roman: secondaryRoman,
            harmonicFunction: 'dominant',
            secondaryTarget,
            reference: key.scale,
            description: `Secondary dominant of ${secondaryTarget} (${secondaryRoman}), outside ${key.name}`,
            reason: `${chord.name} acts as the dominant of ${secondaryTarget}, so it sits outside ${key.name}. It is kept as written and pulls toward the ${secondaryTarget} chord.`,
        };
    }

    return {
        status: 'outside',
        harmonicMinor: false,
        degree: null,
        roman,
        harmonicFunction: 'chromatic',
        secondaryTarget: null,
        reference: key.scale,
        description: `Outside ${key.name} (${roman})`,
        reason: `${chord.name} (${roman}) is outside ${key.name} and is not borrowed from ${parallelName}. It is kept as written and works as a chromatic color.`,
    };
}
