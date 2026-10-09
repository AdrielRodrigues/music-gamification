import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  between, intervalId, intervalName, noteId, parseInterval, parseNote, semitones, transpose,
} from '../../src/theory/index.js';

const up = (n, iv) => noteId(transpose(parseNote(n), iv));
const down = (n, iv) => noteId(transpose(parseNote(n), iv, -1));

test('semitons de cada intervalo', () => {
  const table = { '1J': 0, '2m': 1, '2M': 2, '3m': 3, '3M': 4, '4J': 5, '4A': 6, '5d': 6, '5J': 7, '6m': 8, '6M': 9, '7m': 10, '7M': 11, '8J': 12, '9M': 14 };
  for (const [iv, s] of Object.entries(table)) assert.equal(semitones(parseInterval(iv)), s, iv);
});

test('qualidade impossível é rejeitada', () => {
  assert.throws(() => semitones(parseInterval('5M')));
  assert.throws(() => semitones(parseInterval('3J')));
});

test('intervalos acima com grafia correta', () => {
  assert.equal(up('Bb', '3M'), 'D'); // terça maior de Si♭ = Ré
  assert.equal(up('G#', '3M'), 'B#'); // e não Dó
  assert.equal(up('B', '5J'), 'F#');
  assert.equal(up('D', '3m'), 'F');
  assert.equal(up('Eb', '5J'), 'Bb');
  assert.equal(up('F', '4J'), 'Bb'); // e não Lá♯
  assert.equal(up('F', '4A'), 'B');
  assert.equal(up('C', '7m'), 'Bb');
  assert.equal(up('E', '2m'), 'F');
  assert.equal(up('A', '6M'), 'F#');
  assert.equal(up('Db', '5d'), 'Abb');
});

test('intervalos abaixo', () => {
  assert.equal(down('C', '2M'), 'Bb'); // um tom abaixo de Dó
  assert.equal(down('C', '3m'), 'A'); // relativa menor
  assert.equal(down('Eb', '3m'), 'C');
  assert.equal(down('F', '2M'), 'Eb');
});

test('intervalo entre duas notas', () => {
  const b = (x, y) => intervalId(between(parseNote(x), parseNote(y)));
  assert.equal(b('D', 'F#'), '3M');
  assert.equal(b('D', 'F'), '3m');
  assert.equal(b('D', 'Gb'), '4d');
  assert.equal(b('F', 'B'), '4A');
  assert.equal(b('B', 'F'), '5d');
  assert.equal(b('E', 'D'), '7m');
  assert.equal(b('C', 'C'), '1J');
});

test('transpor e medir são inversos', () => {
  for (const root of ['C', 'F#', 'Bb', 'Ab', 'E']) {
    for (const iv of ['2M', '3m', '3M', '4J', '5J', '6m', '7M']) {
      assert.equal(intervalId(between(parseNote(root), transpose(parseNote(root), iv))), iv);
    }
  }
});

test('nomes em português', () => {
  assert.equal(intervalName(parseInterval('3M')), '3ª maior');
  assert.equal(intervalName(parseInterval('5J')), '5ª justa');
  assert.equal(intervalName(parseInterval('4A')), '4ª aumentada');
  assert.equal(intervalName(parseInterval('1J')), 'uníssono');
});
