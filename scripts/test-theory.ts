import assert from 'node:assert/strict';

import { analyzeChord, analyzeProgression } from '../src/lib/theory/engine.ts';
import { SAMPLE_PROGRESSIONS } from '../src/lib/theory/samples.ts';
import type { ChordAnalysis } from '../src/lib/theory/types.ts';

function getSample(id: string) {
    const sample = SAMPLE_PROGRESSIONS.find(item => item.id === id);
    assert.ok(sample, `missing sample ${id}`);
    return sample;
}

function getValid(keyName: string, id: string): ChordAnalysis[] {
    const result = analyzeProgression(keyName, getSample(id).chords);
    assert.ok(result, 'key did not parse');

    return result.chords.map(entry => {
        assert.ok(entry.valid, `${entry.name} did not parse`);
        return entry;
    });
}

const jazz = getValid('C major', 'jazz-ii-v-i-vi');
assert.deepEqual(jazz.map(entry => entry.context.roman), ['ii7', 'V7', 'Imaj7', 'vi7']);
assert.deepEqual(jazz.map(entry => entry.context.harmonicFunction), ['subdominant', 'dominant', 'tonic', 'tonic']);
assert.ok(jazz.every(entry => entry.context.status === 'diatonic'));
assert.deepEqual(jazz.map(entry => entry.chord.notes), [['D', 'F', 'A', 'C'], ['G', 'B', 'D', 'F'], ['C', 'E', 'G', 'B'], ['A', 'C', 'E', 'G']]);
assert.equal(jazz[0].scales[0].name, 'Dorian');
assert.equal(jazz[1].scales[0].name, 'Mixolydian');
assert.equal(jazz[2].scales[0].name, 'Ionian');
assert.equal(jazz[3].scales[0].name, 'Aeolian');
assert.deepEqual(jazz[0].guideTones.map(tone => tone.note), ['F', 'C']);
assert.deepEqual(jazz[0].guideToneMoves.map(move => [move.from.note, move.to.note, move.motion]), [['F', 'F', 'common tone'], ['C', 'B', 'half step']]);
assert.deepEqual(jazz[1].guideToneMoves.map(move => [move.from.note, move.to.note, move.motion]), [['B', 'B', 'common tone'], ['F', 'E', 'half step']]);
assert.equal(jazz[3].guideToneMoves.length, 0);

const instrumental = getValid('A minor', 'instrumental-vi-iv-i-v');
assert.deepEqual(instrumental.map(entry => entry.context.roman), ['i', 'VI', 'III', 'VII']);
assert.ok(instrumental.every(entry => entry.context.status === 'diatonic'));
assert.equal(instrumental[0].scales[0].name, 'Aeolian');
assert.equal(instrumental[1].scales[0].name, 'Lydian');

const relativeMajor = getValid('C major', 'instrumental-vi-iv-i-v');
assert.deepEqual(relativeMajor.map(entry => entry.context.roman), ['vi', 'IV', 'I', 'V']);
assert.ok(relativeMajor.every(entry => entry.context.status === 'diatonic'));

const borrowed = getValid('C major', 'instrumental-borrowed-iv');
assert.deepEqual(borrowed.map(entry => entry.context.status), ['diatonic', 'diatonic', 'borrowed', 'diatonic']);
assert.equal(borrowed[2].context.roman, 'iv');
assert.match(borrowed[2].context.reason, /borrowed from C minor/);
assert.equal(borrowed[2].name, 'Fm');
assert.equal(borrowed[2].scales[0].name, 'Dorian');
assert.deepEqual(borrowed[2].scales[0].outsideReference, []);

const secondary = getValid('C major', 'jazz-secondary-dominant');
assert.equal(secondary[1].context.status, 'outside');
assert.equal(secondary[1].context.roman, 'V7/ii');
assert.equal(secondary[1].context.secondaryTarget, 'ii');
assert.ok(secondary[1].scales.some(scale => scale.name === 'Phrygian dominant'));

const harmonicV = analyzeChord('A minor', 'E7');
assert.ok(harmonicV);
assert.equal(harmonicV.context.status, 'diatonic');
assert.equal(harmonicV.context.harmonicMinor, true);
assert.equal(harmonicV.scales[0].name, 'Phrygian dominant');

const flatKey = analyzeChord('Bb major', 'Ebmaj7');
assert.ok(flatKey);
assert.equal(flatKey.context.roman, 'IVmaj7');
assert.deepEqual(flatKey.chord.notes, ['Eb', 'G', 'Bb', 'D']);
assert.equal(flatKey.scales[0].description, 'Eb Lydian scale: Eb, F, G, A, Bb, C, D.');

const chromatic = analyzeChord('C major', 'Db');
assert.ok(chromatic);
assert.equal(chromatic.context.status, 'outside');
assert.equal(chromatic.context.roman, 'bII');

for (const sample of SAMPLE_PROGRESSIONS) {
    const result = analyzeProgression(sample.key, sample.chords);
    assert.ok(result);

    for (const entry of result.chords) {
        assert.ok(entry.valid);
        assert.ok(entry.scales.length > 0, `${entry.name} has no scale suggestions`);
        assert.ok(entry.arpeggios.length > 0, `${entry.name} has no arpeggio suggestions`);

        for (const suggestion of [...entry.scales, ...entry.arpeggios]) {
            const sentences = suggestion.reason.split(/(?<=\.)\s+/).length;
            assert.ok(sentences >= 1 && sentences <= 3, `${suggestion.name} reason has ${sentences} sentences: ${suggestion.reason}`);
            assert.ok(!/only correct|must|wrong/i.test(suggestion.reason));
        }
    }
}

const invalid = analyzeProgression('C major', [{ bar: 1, beat: 1, name: 'Hm7' }, { bar: 2, beat: 1, name: 'C' }]);
assert.ok(invalid);
assert.equal(invalid.chords[0].valid, false);
assert.equal(invalid.chords[1].valid, true);
assert.equal(analyzeProgression('H major', []), null);

console.log('All theory engine checks passed');
