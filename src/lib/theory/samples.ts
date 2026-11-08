import type { SampleProgression } from './types.ts';

export const SAMPLE_PROGRESSIONS: SampleProgression[] = [
    {
        id: 'jazz-ii-v-i-vi',
        title: 'Jazz turnaround',
        genre: 'Jazz',
        key: 'C major',
        bars: 4,
        chords: [
            { bar: 1, beat: 1, name: 'Dm7' },
            { bar: 2, beat: 1, name: 'G7' },
            { bar: 3, beat: 1, name: 'Cmaj7' },
            { bar: 4, beat: 1, name: 'Am7' },
        ],
    },
    {
        id: 'instrumental-vi-iv-i-v',
        title: 'Instrumental loop',
        genre: 'Instrumental',
        key: 'A minor',
        bars: 4,
        chords: [
            { bar: 1, beat: 1, name: 'Am' },
            { bar: 2, beat: 1, name: 'F' },
            { bar: 3, beat: 1, name: 'C' },
            { bar: 4, beat: 1, name: 'G' },
        ],
    },
    {
        id: 'instrumental-borrowed-iv',
        title: 'Instrumental with a borrowed chord',
        genre: 'Instrumental',
        key: 'C major',
        bars: 4,
        chords: [
            { bar: 1, beat: 1, name: 'C' },
            { bar: 2, beat: 1, name: 'Am' },
            { bar: 3, beat: 1, name: 'Fm' },
            { bar: 4, beat: 1, name: 'G' },
        ],
    },
    {
        id: 'jazz-secondary-dominant',
        title: 'Jazz with a secondary dominant',
        genre: 'Jazz',
        key: 'C major',
        bars: 4,
        chords: [
            { bar: 1, beat: 1, name: 'Cmaj7' },
            { bar: 2, beat: 1, name: 'A7' },
            { bar: 3, beat: 1, name: 'Dm7' },
            { bar: 4, beat: 1, name: 'G7' },
        ],
    },
];
