import { ROLE_NAMES } from './chords.ts';
import { getInterval, parseNote, spellDegree } from './notes.ts';
import { SCALE_DEFINITIONS, buildScale } from './scales.ts';
import type { Chord, ChordContext, GuideTone, GuideToneMove, Scale, Suggestion } from './types.ts';

const MAX_SCALE_SUGGESTIONS = 5;

function describeScaleReason(chord: Chord, scale: Scale, reference: Scale, outside: string[], character: string): string {
    const essential = chord.notes.filter(note => chord.essentialPitchClasses.includes(parseNote(note)?.pitchClass ?? -1));
    const referenceName = `${reference.root} ${reference.name}`;

    let relation: string;
    if (outside.length > 0) relation = `adds ${outside.join(', ')} from outside ${referenceName}`;
    else if (scale.pitchClasses.length === reference.pitchClasses.length && scale.pitchClasses.every(pitchClass => reference.pitchClasses.includes(pitchClass))) relation = scale.root === reference.root ? `matches ${referenceName}` : `is a mode of ${referenceName}`;
    else relation = `uses only notes of ${referenceName}`;

    return `${scale.root} ${scale.name} holds the main tones of ${chord.name} (${essential.join(', ')}) and ${relation}. ${character}`;
}

export function suggestScales(chord: Chord, context: ChordContext): Suggestion[] {
    const candidates: Suggestion[] = [];

    for (const definition of SCALE_DEFINITIONS) {
        const priority = definition.families[chord.family];
        if (priority === undefined) continue;

        const scale = buildScale(chord.root, definition.name, definition.formula);
        if (!chord.essentialPitchClasses.every(pitchClass => scale.pitchClasses.includes(pitchClass))) continue;

        const outside = scale.notes.filter(note => !context.reference.pitchClasses.includes(parseNote(note)?.pitchClass ?? -1));
        const score = Math.round((0.45 * ((scale.notes.length - outside.length) / scale.notes.length) + 0.4 * priority + (scale.pitchClasses.length === context.reference.pitchClasses.length && scale.pitchClasses.every(pitchClass => context.reference.pitchClasses.includes(pitchClass)) ? 0.15 : 0)) * 100) / 100;

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

function createArpeggio(name: string, notes: string[], priority: number, reference: Scale, detail: string): Suggestion {
    const outside = notes.filter(note => !reference.pitchClasses.includes(parseNote(note)?.pitchClass ?? -1));

    return {
        kind: 'arpeggio',
        rank: 0,
        score: Math.round((0.5 * ((notes.length - outside.length) / notes.length) + 0.5 * priority) * 100) / 100,
        root: notes[0],
        name,
        notes,
        outsideReference: outside,
        description: `${name}: ${notes.join(', ')}.`,
        reason: describeArpeggioReason(notes, reference, outside, detail),
    };
}

function getUpperStructure(chord: Chord) {
    if (!chord.hasSeventh) return null;
    if (chord.family === 'minor') return { suffix: 'maj7', formula: ['1', '3', '5', '7'] };
    if (chord.family === 'dominant') return { suffix: 'm7b5', formula: ['1', 'b3', 'b5', 'b7'] };
    if (chord.family === 'major') return { suffix: 'm7', formula: ['1', 'b3', '5', 'b7'] };
    return null;
}

export function suggestArpeggios(chord: Chord, context: ChordContext): Suggestion[] {
    const reference = context.reference;
    const candidates: Suggestion[] = [];

    const chordNotes = chord.notes.filter(note => chord.corePitchClasses.includes(parseNote(note)?.pitchClass ?? -1));
    candidates.push(createArpeggio(`${chord.name} arpeggio`, chordNotes, 1, reference, `These are the chord tones of ${chord.name}, so every note lands directly on the harmony.`));

    const referenceIndex = reference.pitchClasses.indexOf(parseNote(chord.root)?.pitchClass ?? -1);
    const isPlainTriad = chord.formula.length === 3 && (chord.family === 'major' || chord.family === 'minor' || chord.family === 'diminished');
    if (isPlainTriad && referenceIndex >= 0 && reference.notes.length === 7) {
        const seventh = reference.notes[(referenceIndex + 6) % 7];
        candidates.push(createArpeggio(`${chord.name} arpeggio with the seventh`, [...chord.notes, seventh], 0.8, reference, `${seventh} is the seventh that ${reference.root} ${reference.name} places above ${chord.root}, which adds a richer color while staying with the key.`));
    }

    const upperDetail = `They are the third, fifth, seventh and ninth of ${chord.name}, which adds color while staying on the chord.`;
    const upperStructure = getUpperStructure(chord);
    if (upperStructure) {
        const notes = upperStructure.formula.map(degree => spellDegree(chord.notes[1], degree));
        candidates.push(createArpeggio(`${chord.notes[1]}${upperStructure.suffix} arpeggio over ${chord.name}`, notes, 0.7, reference, upperDetail));
    }

    candidates.sort((a, b) => b.score - a.score);
    return candidates.map((candidate, index) => ({ ...candidate, rank: index + 1 }));
}

function describeMove(from: GuideTone, to: GuideTone, fromChord: Chord, toChord: Chord, semitones: number): string {
    const start = `${from.note}, the ${from.role} of ${fromChord.name}`;
    const end = `${to.note}, the ${to.role} of ${toChord.name}`;
    if (Math.abs(semitones) === 0) return `${start}, holds as ${end}.`;
    if (Math.abs(semitones) === 1) return `${start}, ${semitones < 0 ? 'falls' : 'rises'} a half step to ${end}.`;
    if (Math.abs(semitones) === 2) return `${start}, ${semitones < 0 ? 'falls' : 'rises'} a whole step to ${end}.`;
    return `${start}, ${semitones < 0 ? 'falls' : 'rises'} ${Math.abs(semitones).toString()} semitones to ${end}.`;
}

export function getGuideToneMoves(from: Chord, to: Chord): GuideToneMove[] {
    const moves: GuideToneMove[] = [];

    for (const start of from.guideDegrees.map(degree => ({ note: spellDegree(from.root, degree), degree, role: ROLE_NAMES[degree.replace(/^[#b]+/, '')] ?? 'tone' }))) {
        let best: GuideTone | null = null;
        let bestSemitones = 0;

        for (const end of to.guideDegrees.map(degree => ({ note: spellDegree(to.root, degree), degree, role: ROLE_NAMES[degree.replace(/^[#b]+/, '')] ?? 'tone' }))) {
            const semitones = getInterval(parseNote(start.note)?.pitchClass ?? 0, parseNote(end.note)?.pitchClass ?? 0);
            if (best === null || Math.abs(semitones) < Math.abs(bestSemitones)) {
                best = end;
                bestSemitones = semitones;
            }
        }

        if (best === null) continue;

        let motion: GuideToneMove['motion'] = 'leap';

        switch (Math.abs(bestSemitones)) {
            case 0:
                motion = 'common tone';
                break;
            case 1:
                motion = 'half step';
                break;
            case 2:
                motion = 'whole step';
                break;
        }

        moves.push({ from: start, to: best, semitones: bestSemitones, motion, reason: describeMove(start, best, from, to, bestSemitones) });
    }

    return moves;
}
