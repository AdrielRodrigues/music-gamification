import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  formatChord, getProgression, keyFromId, parseChord, PROGRESSIONS, progressionName, realize,
  toRomans, transposeChords,
} from '../../src/theory/index.js';

const fmt = (chords) => chords.map((c) => formatChord(c)).join(' ');

test('nomes derivados dos graus', () => {
  assert.equal(progressionName(getProgression('pop')), 'I–V–vi–IV');
  assert.equal(progressionName(getProgression('cinco-um')), 'ii7–V7–Imaj7');
  assert.equal(progressionName(getProgression('menor-pop')), 'i–VI–III–VII');
  assert.equal(progressionName(getProgression('andaluza')), 'i–VII–VI–V');
});

test('progressões em vários tons', () => {
  assert.equal(fmt(realize(getProgression('pop'), keyFromId('C'))), 'C G Am F');
  assert.equal(fmt(realize(getProgression('pop'), keyFromId('E'))), 'E B C♯m A');
  assert.equal(fmt(realize(getProgression('doowop'), keyFromId('Bb'))), 'B♭ Gm E♭ F');
  assert.equal(fmt(realize(getProgression('cinco-um'), keyFromId('F'))), 'Gm7 C7 Fmaj7');
  assert.equal(fmt(realize(getProgression('rock'), keyFromId('A'))), 'A D E');
  assert.equal(fmt(realize(getProgression('menor-cadencia'), keyFromId('Am'))), 'Am Dm E Am');
});

test('transposição', () => {
  const pop = realize(getProgression('pop'), keyFromId('C'));
  assert.equal(fmt(transposeChords(pop, keyFromId('C'), keyFromId('G'))), 'G D Em C');
  assert.equal(fmt(transposeChords(pop, keyFromId('C'), keyFromId('Eb'))), 'E♭ B♭ Cm A♭');
  assert.equal(fmt(transposeChords(pop, keyFromId('C'), keyFromId('F#'))), 'F♯ C♯ D♯m B');
  // grafia depende do tom de destino: Gb usa bemóis
  assert.equal(fmt(transposeChords(pop, keyFromId('C'), keyFromId('Gb'))), 'G♭ D♭ E♭m C♭');
});

test('transpor ida e volta devolve o original em todos os tons', () => {
  const from = keyFromId('D');
  for (const p of PROGRESSIONS.filter((x) => x.mode === 'major')) {
    const original = realize(p, from);
    for (const id of ['Eb', 'B', 'F', 'Ab']) {
      const there = transposeChords(original, from, keyFromId(id));
      assert.equal(fmt(there), fmt(realize(p, keyFromId(id))));
      assert.equal(fmt(transposeChords(there, keyFromId(id), from)), fmt(original));
    }
  }
});

test('cifra → graus romanos', () => {
  const r = (list, k) => toRomans(list.map(parseChord), keyFromId(k)).join(' ');
  assert.equal(r(['G', 'C', 'D', 'Em'], 'G'), 'I IV V vi');
  assert.equal(r(['Dm7', 'G7', 'Cmaj7'], 'C'), 'ii7 V7 Imaj7');
  assert.equal(r(['Am', 'Dm', 'E', 'Am'], 'Am'), 'i iv V i');
  // fora do campo
  assert.equal(r(['C', 'D7', 'G'], 'C'), 'I V7/V V');
  assert.equal(r(['C', 'A7', 'Dm'], 'C'), 'I V7/ii ii');
  assert.equal(r(['C', 'C7', 'F'], 'C'), 'I V7/IV IV');
  assert.equal(r(['C', 'Bb', 'F'], 'C'), 'I ♭VII IV');
});
