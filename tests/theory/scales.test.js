import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildScale, majorKeyIds, noteId, parseNote, stepFormula } from '../../src/theory/index.js';

const scale = (tonic, type) => buildScale(parseNote(tonic), type).map(noteId).join(' ');

test('escala maior nos 12 tons, com grafia correta', () => {
  const expected = {
    C: 'C D E F G A B',
    G: 'G A B C D E F#',
    D: 'D E F# G A B C#',
    A: 'A B C# D E F# G#',
    E: 'E F# G# A B C# D#',
    B: 'B C# D# E F# G# A#',
    'F#': 'F# G# A# B C# D# E#',
    Gb: 'Gb Ab Bb Cb Db Eb F',
    Db: 'Db Eb F Gb Ab Bb C',
    Ab: 'Ab Bb C Db Eb F G',
    Eb: 'Eb F G Ab Bb C D',
    Bb: 'Bb C D Eb F G A',
    F: 'F G A Bb C D E',
  };
  for (const [tonic, notes] of Object.entries(expected)) assert.equal(scale(tonic), notes, tonic);
});

test('cada escala maior usual usa as 7 letras uma vez só e nunca mistura ♯ e ♭', () => {
  for (const id of [...majorKeyIds('F#'), 'Gb']) {
    const notes = buildScale(parseNote(id));
    assert.equal(new Set(notes.map((n) => n.letter)).size, 7, id);
    const accs = notes.map((n) => n.acc).filter((a) => a !== 0);
    assert.ok(accs.every((a) => a > 0) || accs.every((a) => a < 0), id);
  }
});

test('menor natural e harmônica', () => {
  assert.equal(scale('A', 'minor'), 'A B C D E F G');
  assert.equal(scale('C', 'minor'), 'C D Eb F G Ab Bb');
  assert.equal(scale('A', 'harmonicMinor'), 'A B C D E F G#');
  assert.equal(scale('D#', 'minor'), 'D# E# F# G# A# B C#');
});

test('fórmula da escala maior: T-T-st-T-T-T-st', () => {
  assert.deepEqual(stepFormula('major'), ['T', 'T', 'st', 'T', 'T', 'T', 'st']);
  assert.deepEqual(stepFormula('minor'), ['T', 'st', 'T', 'T', 'st', 'T', 'T']);
  assert.deepEqual(stepFormula('harmonicMinor'), ['T', 'st', 'T', 'T', 'st', 'T½', 'st']);
});
