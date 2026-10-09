import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  BARRE_SHAPES, chordTones, chord, fretMidi, fretPc, keyboardKeys, noteId, openNote, parseNote,
  pitchClass, positionsOf, shapeAt, shapeRootFret, simpleSpellings,
} from '../../src/theory/index.js';

test('cordas soltas E A D G B E', () => {
  assert.deepEqual([6, 5, 4, 3, 2, 1].map((s) => noteId(openNote(s))), ['E', 'A', 'D', 'G', 'B', 'E']);
  assert.equal(fretMidi(6, 0), 40);
  assert.equal(fretMidi(1, 0), 64);
});

test('nota de uma casa', () => {
  assert.equal(noteId(simpleSpellings(fretPc(6, 5))[0]), 'A'); // 6ª corda casa 5 = Lá
  assert.equal(noteId(simpleSpellings(fretPc(5, 3))[0]), 'C');
  assert.equal(noteId(simpleSpellings(fretPc(3, 4))[0]), 'B');
  assert.equal(fretPc(2, 1), 0);
  assert.equal(fretPc(4, 12), fretPc(4, 0));
});

test('afinação: casa 5 = próxima corda solta (exceto 3ª corda, casa 4)', () => {
  assert.equal(fretMidi(6, 5), fretMidi(5, 0));
  assert.equal(fretMidi(5, 5), fretMidi(4, 0));
  assert.equal(fretMidi(4, 5), fretMidi(3, 0));
  assert.equal(fretMidi(3, 4), fretMidi(2, 0));
  assert.equal(fretMidi(2, 5), fretMidi(1, 0));
});

test('posições de uma nota', () => {
  const a = positionsOf(9, { maxFret: 12 });
  assert.ok(a.some((p) => p.string === 6 && p.fret === 5));
  assert.ok(a.some((p) => p.string === 5 && p.fret === 0));
  assert.ok(a.every((p) => fretPc(p.string, p.fret) === 9));
});

test('formas de pestana: cada ponto tem a nota da função indicada', () => {
  for (const [id, shape] of Object.entries(BARRE_SHAPES)) {
    for (const rootName of ['G', 'Bb', 'C#', 'F']) {
      const root = parseNote(rootName);
      const tones = chordTones(chord(root, shape.type)).map(pitchClass);
      const roleIdx = { R: 0, 3: 1, 5: 2 };
      const r = shapeRootFret(id, pitchClass(root));
      for (const dot of shapeAt(id, r)) {
        assert.equal(fretPc(dot.string, dot.fret), tones[roleIdx[dot.role]], `${id} ${rootName} corda ${dot.string}`);
      }
    }
  }
});

test('teclado', () => {
  const keys = keyboardKeys(60, 2);
  assert.equal(keys.length, 24);
  assert.equal(keys.filter((k) => k.black).length, 10);
  assert.equal(keys[1].black, true);
});
