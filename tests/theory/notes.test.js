import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  enharmonic, formatNote, midi, noteId, parseNote, pitchClass, simpleSpellings, spell,
} from '../../src/theory/index.js';

test('lê cifra e Dó-Ré-Mi', () => {
  assert.equal(noteId(parseNote('Bb')), 'Bb');
  assert.equal(noteId(parseNote('B♭')), 'Bb');
  assert.equal(noteId(parseNote('F#')), 'F#');
  assert.equal(noteId(parseNote('Sol')), 'G');
  assert.equal(noteId(parseNote('Si♭')), 'Bb');
  assert.equal(noteId(parseNote('Fá#')), 'F#');
  assert.equal(noteId(parseNote('Do')), 'C');
  assert.throws(() => parseNote('H'));
  assert.throws(() => parseNote('Cz'));
});

test('classe de altura e enarmonia', () => {
  assert.equal(pitchClass(parseNote('C')), 0);
  assert.equal(pitchClass(parseNote('B#')), 0);
  assert.equal(pitchClass(parseNote('Cb')), 11);
  assert.ok(enharmonic(parseNote('Bb'), parseNote('A#')));
  assert.ok(!enharmonic(parseNote('Bb'), parseNote('B')));
});

test('spell escolhe o acidente para a letra dada', () => {
  assert.equal(noteId(spell(6, 10)), 'Bb'); // letra Si, altura 10
  assert.equal(noteId(spell(5, 10)), 'A#'); // letra Lá, altura 10
  assert.equal(noteId(spell(6, 0)), 'B#');
});

test('formatação nas duas notações', () => {
  const bb = parseNote('Bb');
  assert.equal(formatNote(bb, 'latin'), 'Si♭');
  assert.equal(formatNote(bb, 'anglo'), 'B♭');
  assert.equal(formatNote(bb, 'anglo', true), 'Bb');
  assert.equal(formatNote(parseNote('F##'), 'latin'), 'Fá♯♯');
});

test('grafias simples por classe de altura', () => {
  assert.deepEqual(simpleSpellings(4).map(noteId), ['E']);
  assert.deepEqual(simpleSpellings(10).map(noteId), ['A#', 'Bb']);
});

test('MIDI respeita a oitava pela letra', () => {
  assert.equal(midi(parseNote('C'), 4), 60);
  assert.equal(midi(parseNote('A'), 4), 69);
  assert.equal(midi(parseNote('Cb'), 4), 59);
  assert.equal(midi(parseNote('B#'), 3), 60);
});
