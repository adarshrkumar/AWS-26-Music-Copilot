export type KeyMode = 'major' | 'minor';

export type ChordFamily = 'major' | 'minor' | 'dominant' | 'diminished' | 'halfDiminished' | 'augmented' | 'suspended' | 'minorMajor' | 'power';

export type ChordStatus = 'diatonic' | 'borrowed' | 'outside';

export type HarmonicFunction = 'tonic' | 'subdominant' | 'dominant' | 'chromatic';

export interface ParsedNote {
    letterIndex: number;
    accidental: number;
    pitchClass: number;
    octave: number | null;
}

export interface Scale {
    root: string;
    name: string;
    notes: string[];
    pitchClasses: number[];
    description: string;
}

export interface Key {
    name: string;
    tonic: string;
    mode: KeyMode;
    scale: Scale;
    harmonicMinor: Scale | null;
    parallel: Scale;
}

export interface QualityDefinition {
    aliases: string[];
    family: ChordFamily;
    formula: string[];
    guideDegrees: string[];
    romanSuffix: string;
}

export interface Chord {
    name: string;
    root: string;
    bass: string | null;
    quality: string;
    family: ChordFamily;
    formula: string[];
    notes: string[];
    pitchClasses: number[];
    corePitchClasses: number[];
    essentialPitchClasses: number[];
    guideDegrees: string[];
    romanSuffix: string;
    hasSeventh: boolean;
    isMinorThird: boolean;
}

export interface ScaleDefinition {
    name: string;
    formula: string[];
    families: Partial<Record<ChordFamily, number>>;
    character: string;
}

export interface ChordContext {
    status: ChordStatus;
    harmonicMinor: boolean;
    degree: number | null;
    roman: string;
    harmonicFunction: HarmonicFunction;
    secondaryTarget: string | null;
    reference: Scale;
    description: string;
    reason: string;
}

export interface ScaleSuggestion {
    kind: 'scale';
    rank: number;
    score: number;
    root: string;
    name: string;
    notes: string[];
    outsideReference: string[];
    description: string;
    reason: string;
}

export interface ArpeggioSuggestion {
    kind: 'arpeggio';
    rank: number;
    score: number;
    root: string;
    name: string;
    notes: string[];
    outsideReference: string[];
    description: string;
    reason: string;
}

export interface GuideTone {
    note: string;
    degree: string;
    role: string;
}

export interface GuideToneMove {
    from: GuideTone;
    to: GuideTone;
    semitones: number;
    motion: 'common tone' | 'half step' | 'whole step' | 'leap';
    reason: string;
}

export interface ChordAnalysis {
    valid: true;
    bar: number;
    beat: number;
    name: string;
    chord: Chord;
    context: ChordContext;
    scales: ScaleSuggestion[];
    arpeggios: ArpeggioSuggestion[];
    guideTones: GuideTone[];
    guideToneMoves: GuideToneMove[];
}

export interface InvalidChord {
    valid: false;
    bar: number;
    beat: number;
    name: string;
    message: string;
}

export interface ProgressionAnalysis {
    key: Key;
    chords: (ChordAnalysis | InvalidChord)[];
}

export interface ProgressionChord {
    bar: number;
    beat: number;
    name: string;
}

export interface SampleProgression {
    id: string;
    title: string;
    genre: string;
    key: string;
    bars: number;
    chords: ProgressionChord[];
}
