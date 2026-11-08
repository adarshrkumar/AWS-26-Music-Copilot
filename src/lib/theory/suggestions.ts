import { getDegreeRole } from './chords.ts';
import { getInterval, getPitchClass, spellDegree, spellFormula } from './notes.ts';
import { SCALE_DEFINITIONS, buildScale } from './scales.ts';
import type { ArpeggioSuggestion, Chord, ChordContext, GuideTone, GuideToneMove, Scale, ScaleSuggestion } from './types.ts';

const MAX_SCALE_SUGGESTIONS = 5;

function round(value: number): number {
    return Math.round(value * 100) / 100;
}

function getOutsideNotes(notes: string[], reference: Scale): string[] {
    return notes.filter(note => !reference.pitchClasses.includes(getPitchClass(note) ?? -1));
}

function getFit(notes: string[], reference: Scale): number {
    return (notes.length - getOutsideNotes(notes, reference).length) / notes.length;
}

function isSameSet(scale: Scale, reference: Scale): boolean {
    return scale.pitchClasses.length === reference.pitchClasses.length && scale.pitchClasses.every(pitchClass => reference.pitchClasses.includes(pitchClass));
}

function describeScaleReason(chord: Chord, scale: Scale, reference: Scale, outside: string[], character: string): string {
    const essential = chord.notes.filter(note => chord.essentialPitchClasses.includes(getPitchClass(note) ?? -1));
    const referenceName = `${reference.root} ${reference.name}`;

    let relation: string;
    if (outside.length > 0) relation = `adds ${outside.join(', ')} from outside ${referenceName}`;
    else if (isSameSet(scale, reference)) relation = scale.root === reference.root ? `matches ${referenceName}` : `is a mode of ${referenceName}`;
    else relation = `uses only notes of ${referenceName}`;

    return `${scale.root} ${scale.name} holds the main tones of ${chord.name} (${essential.join(', ')}) and ${relation}. ${character}`;
}

export function suggestScales(chord: Chord, context: ChordContext): ScaleSuggestion[] {
    const candidates: ScaleSuggestion[] = [];

    for (const definition of SCALE_DEFINITIONS) {
        const priority = definition.families[chord.family];
        if (priority === undefined) continue;

        const scale = buildScale(chord.root, definition.name, definition.formula);
        if (!chord.essentialPitchClasses.every(pitchClass => scale.pitchClasses.includes(pitchClass))) continue;

        const outside = getOutsideNotes(scale.notes, context.reference);
        const score = round(0.45 * getFit(scale.notes, context.reference) + 0.4 * priority + (isSameSet(scale, context.reference) ? 0.15 : 0));

        candidates.push({
            kind: 'scale',
            rank: 0,
            score,
            root: scale.root,
            name: scale.name,
            notes: scale.notes,
            outsideReference: outside,
            description: scale.description,
            reason: describeScaleReason(chord, scale, context.reference, outside, definition.character),
        });
    }

    candidates.sort((a, b) => b.score - a.score);
    return candidates.slice(0, MAX_SCALE_SUGGESTIONS).map((candidate, index) => ({ ...candidate, rank: index + 1 }));
}

function describeArpeggioReason(notes: string[], reference: Scale, outside: string[], detail: string): string {
    const marked = outside.length > 0 ? ` ${outside.join(', ')} ${outside.length === 1 ? 'is' : 'are'} outside ${reference.root} ${reference.name} and marked as such.` : '';
    return `The arpeggio spells ${notes.join(', ')}. ${detail}${marked}`;
}

function createArpeggio(name: string, notes: string[], priority: number, reference: Scale, detail: string): ArpeggioSuggestion {
    const outside = getOutsideNotes(notes, reference);

    return {
        kind: 'arpeggio',
        rank: 0,
        score: round(0.5 * getFit(notes, reference) + 0.5 * priority),
        root: notes[0],
        name,
        notes,
        outsideReference: outside,
        description: `${name}: ${notes.join(', ')}.`,
        reason: describeArpeggioReason(notes, reference, outside, detail),
    };
}

function getUpperStructure(chord: Chord): { suffix: string; formula: string[] } | null {
    if (!chord.hasSeventh) return null;
    if (chord.family === 'minor') return { suffix: 'maj7', formula: ['1', '3', '5', '7'] };
    if (chord.family === 'dominant') return { suffix: 'm7b5', formula: ['1', 'b3', 'b5', 'b7'] };
    if (chord.family === 'major') return { suffix: 'm7', formula: ['1', 'b3', '5', 'b7'] };
    return null;
}

export function suggestArpeggios(chord: Chord, context: ChordContext): ArpeggioSuggestion[] {
    const reference = context.reference;
    const candidates: ArpeggioSuggestion[] = [];

    const chordNotes = chord.notes.filter(note => chord.corePitchClasses.includes(getPitchClass(note) ?? -1));
    candidates.push(createArpeggio(`${chord.name} arpeggio`, chordNotes, 1, reference, `These are the chord tones of ${chord.name}, so every note lands directly on the harmony.`));

    const referenceIndex = reference.pitchClasses.indexOf(getPitchClass(chord.root) ?? -1);
    const isPlainTriad = chord.formula.length === 3 && (chord.family === 'major' || chord.family === 'minor' || chord.family === 'diminished');
    if (isPlainTriad && referenceIndex >= 0 && reference.notes.length === 7) {
        const seventh = reference.notes[(referenceIndex + 6) % 7];
        candidates.push(createArpeggio(`${chord.name} arpeggio with the seventh`, [...chord.notes, seventh], 0.8, reference, `${seventh} is the seventh that ${reference.root} ${reference.name} places above ${chord.root}, which adds a richer color while staying with the key.`));
    }

    const upperDetail = `They are the third, fifth, seventh and ninth of ${chord.name}, which adds color while staying on the chord.`;
    const thirdNote = chord.notes[1];
    const upperStructure = getUpperStructure(chord);
    if (upperStructure) {
        const notes = spellFormula(thirdNote, upperStructure.formula);
        candidates.push(createArpeggio(`${thirdNote}${upperStructure.suffix} arpeggio over ${chord.name}`, notes, 0.7, reference, upperDetail));
    }

    candidates.sort((a, b) => b.score - a.score);
    return candidates.map((candidate, index) => ({ ...candidate, rank: index + 1 }));
}

export function getGuideTones(chord: Chord): GuideTone[] {
    return chord.guideDegrees.map(degree => ({ note: spellDegree(chord.root, degree), degree, role: getDegreeRole(degree) }));
}

function describeMove(from: GuideTone, to: GuideTone, fromChord: Chord, toChord: Chord, semitones: number): string {
    const start = `${from.note}, the ${from.role} of ${fromChord.name}`;
    const end = `${to.note}, the ${to.role} of ${toChord.name}`;
    const size = Math.abs(semitones);

    if (size === 0) return `${start}, holds as ${end}.`;
    if (size === 1) return `${start}, ${semitones < 0 ? 'falls' : 'rises'} a half step to ${end}.`;
    if (size === 2) return `${start}, ${semitones < 0 ? 'falls' : 'rises'} a whole step to ${end}.`;
    return `${start}, ${semitones < 0 ? 'falls' : 'rises'} ${size.toString()} semitones to ${end}.`;
}

export function getGuideToneMoves(from: Chord, to: Chord): GuideToneMove[] {
    const fromTones = getGuideTones(from);
    const toTones = getGuideTones(to);
    const moves: GuideToneMove[] = [];

    for (const start of fromTones) {
        let best: GuideTone | null = null;
        let bestSemitones = 0;

        for (const end of toTones) {
            const semitones = getInterval(getPitchClass(start.note) ?? 0, getPitchClass(end.note) ?? 0);
            if (best === null || Math.abs(semitones) < Math.abs(bestSemitones)) {
                best = end;
                bestSemitones = semitones;
            }
        }

        if (best === null) continue;

        const size = Math.abs(bestSemitones);
        let motion: GuideToneMove['motion'] = 'leap';
        if (size === 0) motion = 'common tone';
        else if (size === 1) motion = 'half step';
        else if (size === 2) motion = 'whole step';

        moves.push({ from: start, to: best, semitones: bestSemitones, motion, reason: describeMove(start, best, from, to, bestSemitones) });
    }

    return moves;
}
