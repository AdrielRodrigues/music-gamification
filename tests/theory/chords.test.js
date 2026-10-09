import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  chord, chordLongName, chordMidis, chordNotes, formatChord, identifyChord, noteId, parseChord, parseNote,
} from '../../src/theory/index.js';

const notes = (cifra) => chordNotes(parseChord(cifra)).map(noteId).join(' ');

test('tríades', () => {
  assert.equal(notes('C'), 'C E G');
  assert.equal(notes('Cm'), 'C Eb G');
  assert.equal(notes('F#m'), 'F# A C#');
  assert.equal(notes('Bb'), 'Bb D F');
  assert.equal(notes('B°'), 'B D F');
  assert.equal(notes('C#°'), 'C# E G');
  assert.equal(notes('Ab+'), 'Ab C E');
});

test('tétrades', () => {
  assert.equal(notes('Bbmaj7'), 'Bb D F A');
  assert.equal(notes('Cm7'), 'C Eb G Bb');
  assert.equal(notes('G7'), 'G B D F');
  assert.equal(notes('Bm7(b5)'), 'B D F A');
  assert.equal(notes('B°7'), 'B D F Ab');
  assert.equal(notes('E7M'), 'E G# B D#'); // escrita brasileira 7M
});

test('inversões', () => {
  assert.equal(chordNotes(chord(parseNote('C'), 'maj', 1)).map(noteId).join(' '), 'E G C');
  assert.equal(chordNotes(chord(parseNote('C'), 'maj', 2)).map(noteId).join(' '), 'G C E');
  assert.equal(chordNotes(chord(parseNote('G'), '7', 3)).map(noteId).join(' '), 'F G B D');
  assert.equal(formatChord(chord(parseNote('C'), 'maj', 1)), 'C/E');
  assert.equal(parseChord('D/F#').inversion, 1);
  assert.throws(() => parseChord('C/F'));
});

test('cifra ida e volta', () => {
  for (const c of ['C', 'Dm', 'F♯m', 'B♭maj7', 'G7', 'Bm7(♭5)', 'E♭°', 'C/E', 'A♭+']) {
    assert.equal(formatChord(parseChord(c)), c);
  }
  assert.equal(formatChord(parseChord('Rém'), 'latin'), 'Rém');
  assert.equal(formatChord(parseChord('Sib7'), 'anglo'), 'B♭7');
});

test('nome por extenso', () => {
  assert.equal(chordLongName(parseChord('Dm')), 'Ré menor');
  assert.equal(chordLongName(parseChord('Bbmaj7')), 'Si♭ com sétima maior');
});

test('identifica acorde pelas notas (baixo primeiro)', () => {
  const id = (s) => formatChord(identifyChord(s.split(' ').map(parseNote)));
  assert.equal(id('C E G'), 'C');
  assert.equal(id('E G C'), 'C/E');
  assert.equal(id('A C E'), 'Am');
  assert.equal(id('F A C E'), 'Fmaj7');
  assert.equal(id('B D F'), 'B°');
  assert.equal(identifyChord(['C', 'D', 'E'].map(parseNote)), null);
});

test('voicing fechado para tocar', () => {
  assert.deepEqual(chordMidis(parseChord('C'), 60), [60, 64, 67]);
  assert.deepEqual(chordMidis(parseChord('C/E'), 60), [64, 67, 72]);
  assert.deepEqual(chordMidis(parseChord('G'), 55), [55, 59, 62]);
});
