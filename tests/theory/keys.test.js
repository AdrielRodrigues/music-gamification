import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  detectKey, formatChord, harmonicField, keyFromId, keyId, keyLabel, keySignature,
  majorKeyIds, minorKeyIds, parseChord, relativeKey, secondaryDominant,
} from '../../src/theory/index.js';

const field = (id, opts) => harmonicField(keyFromId(id), opts).map((d) => formatChord(d.chord, 'anglo')).join(' ');
const romans = (id, opts) => harmonicField(keyFromId(id), opts).map((d) => d.roman).join(' ');

test('campo harmônico maior', () => {
  assert.equal(field('C'), 'C Dm Em F G Am B°');
  assert.equal(field('D'), 'D Em F♯m G A Bm C♯°');
  assert.equal(field('Bb'), 'B♭ Cm Dm E♭ F Gm A°');
  assert.equal(romans('D'), 'I ii iii IV V vi vii°');
});

test('campo harmônico menor natural', () => {
  assert.equal(field('Am'), 'Am B° C Dm Em F G');
  assert.equal(field('Em'), 'Em F♯° G Am Bm C D');
  assert.equal(romans('Am'), 'i ii° III iv v VI VII');
});

test('menor com V da harmônica', () => {
  assert.equal(field('Am', { harmonicV: true }), 'Am B° C Dm E F G');
});

test('campo com tétrades: qual grau recebe cada tipo', () => {
  assert.equal(field('C', { sevenths: true }), 'Cmaj7 Dm7 Em7 Fmaj7 G7 Am7 Bm7(♭5)');
  assert.equal(romans('C', { sevenths: true }), 'Imaj7 ii7 iii7 IVmaj7 V7 vi7 viiø7');
  assert.equal(field('Am', { sevenths: true }), 'Am7 Bm7(♭5) Cmaj7 Dm7 Em7 Fmaj7 G7');
});

test('funções harmônicas no maior', () => {
  const fns = harmonicField(keyFromId('G')).map((d) => d.func).join(' ');
  assert.equal(fns, 'T SD T SD D T D');
});

test('relativas', () => {
  assert.equal(keyId(relativeKey(keyFromId('C'))), 'Am');
  assert.equal(keyId(relativeKey(keyFromId('Eb'))), 'Cm');
  assert.equal(keyId(relativeKey(keyFromId('Cm'))), 'Eb');
  assert.equal(keyId(relativeKey(keyFromId('F#'))), 'D#m');
  assert.equal(keyId(relativeKey(keyFromId('Gb'))), 'Ebm');
});

test('cada tom menor usual é relativo de um maior usual', () => {
  for (const fs of ['F#', 'Gb']) {
    const majors = new Set(majorKeyIds(fs));
    for (const m of minorKeyIds(fs)) assert.ok(majors.has(keyId(relativeKey(keyFromId(m)))), m);
  }
});

test('armadura', () => {
  assert.equal(keySignature(keyFromId('C')), 0);
  assert.equal(keySignature(keyFromId('A')), 3);
  assert.equal(keySignature(keyFromId('Eb')), -3);
  assert.equal(keySignature(keyFromId('Bm')), 2);
});

test('rótulo do tom nas duas notações', () => {
  assert.equal(keyLabel(keyFromId('Bb'), 'latin'), 'Si♭ maior');
  assert.equal(keyLabel(keyFromId('F#m'), 'anglo'), 'F♯ menor');
});

test('dominantes secundários', () => {
  assert.equal(formatChord(secondaryDominant(keyFromId('C'), 5)), 'D7'); // V/V
  assert.equal(formatChord(secondaryDominant(keyFromId('C'), 2)), 'A7'); // V/ii
  assert.equal(formatChord(secondaryDominant(keyFromId('C'), 6)), 'E7'); // V/vi
  assert.equal(formatChord(secondaryDominant(keyFromId('F'), 4)), 'F7'); // V/IV
  assert.equal(formatChord(secondaryDominant(keyFromId('Eb'), 5)), 'F7');
});

test('detecção de tom', () => {
  const top = (list) => detectKey(list.map(parseChord)).filter((c, _, all) => c.fit === all[0].fit).map((c) => keyId(c.key));
  // G, C, D, Em só cabem em Sol maior e na relativa Mi menor; maior vem primeiro.
  assert.deepEqual(top(['G', 'C', 'D', 'Em']), ['G', 'Em']);
  assert.deepEqual(top(['Am', 'Dm', 'E']), ['Am']); // V maior denuncia o menor
  assert.deepEqual(top(['Bb', 'Eb', 'F']), ['Bb', 'Gm']);
  // grafia enarmônica na entrada não atrapalha
  assert.deepEqual(top(['A#', 'D#', 'F']), ['Bb', 'Gm']);
  // tônica no começo e no fim pesa a favor
  assert.equal(keyId(detectKey(['Em', 'C', 'G', 'D', 'Em'].map(parseChord))[0].key), 'Em');
});
