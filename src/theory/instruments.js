/**
 * instruments.js — Mapeamento da teoria no braço (violão/guitarra) e no teclado.
 *
 * Tudo aqui trabalha com classes de altura (pc) e números MIDI: no instrumento
 * a grafia não existe (a mesma casa é Lá♯ ou Si♭), quem decide é o contexto.
 */
import { midi, mod, parseNote, pitchClass } from './notes.js';

/** Afinação padrão, da 6ª corda (mais grave) para a 1ª: E A D G B E. */
export const GUITAR_TUNING = [
  { string: 6, note: 'E', octave: 2 },
  { string: 5, note: 'A', octave: 2 },
  { string: 4, note: 'D', octave: 3 },
  { string: 3, note: 'G', octave: 3 },
  { string: 2, note: 'B', octave: 3 },
  { string: 1, note: 'E', octave: 4 },
];

export const GUITAR_STRINGS = GUITAR_TUNING.map((s) => s.string);

export function openNote(string) {
  return parseNote(GUITAR_TUNING.find((s) => s.string === string).note);
}

/** MIDI da casa `fret` na corda `string` (casa 0 = corda solta). */
export function fretMidi(string, fret) {
  const s = GUITAR_TUNING.find((t) => t.string === string);
  return midi(parseNote(s.note), s.octave) + fret;
}

export function fretPc(string, fret) {
  return mod(pitchClass(openNote(string)) + fret, 12);
}

/** Todas as posições de uma classe de altura até `maxFret`. */
export function positionsOf(pc, { maxFret = 12, strings = GUITAR_STRINGS } = {}) {
  const out = [];
  for (const string of strings) {
    for (let fret = 0; fret <= maxFret; fret++) {
      if (fretPc(string, fret) === mod(pc, 12)) out.push({ string, fret });
    }
  }
  return out;
}

/**
 * Formas de pestana móveis (CAGED): "forma de Mi" (fundamental na 6ª corda)
 * e "forma de Lá" (fundamental na 5ª). Cada ponto: [corda, casa relativa, função].
 * Função: 'R' fundamental, '3' terça, '5' quinta.
 */
export const BARRE_SHAPES = {
  'E-maj': { name: 'forma de Mi', type: 'maj', rootString: 6, dots: [[6, 0, 'R'], [5, 2, '5'], [4, 2, 'R'], [3, 1, '3'], [2, 0, '5'], [1, 0, 'R']] },
  'E-min': { name: 'forma de Mi', type: 'min', rootString: 6, dots: [[6, 0, 'R'], [5, 2, '5'], [4, 2, 'R'], [3, 0, '3'], [2, 0, '5'], [1, 0, 'R']] },
  'A-maj': { name: 'forma de Lá', type: 'maj', rootString: 5, dots: [[5, 0, 'R'], [4, 2, '5'], [3, 2, 'R'], [2, 2, '3'], [1, 0, '5']] },
  'A-min': { name: 'forma de Lá', type: 'min', rootString: 5, dots: [[5, 0, 'R'], [4, 2, '5'], [3, 2, 'R'], [2, 1, '3'], [1, 0, '5']] },
};

/** Posições absolutas de uma forma com a fundamental na casa `rootFret`. */
export function shapeAt(shapeId, rootFret) {
  return BARRE_SHAPES[shapeId].dots.map(([string, offset, role]) => ({ string, fret: rootFret + offset, role }));
}

/** Casa da fundamental para um acorde com fundamental `pc` numa forma (0–11). */
export function shapeRootFret(shapeId, pc) {
  return mod(pc - pitchClass(openNote(BARRE_SHAPES[shapeId].rootString)), 12);
}

// ---------- teclado ----------

const BLACK_PCS = new Set([1, 3, 6, 8, 10]);

/** Teclas de um trecho do teclado: [{ midi, pc, black }]. */
export function keyboardKeys(startMidi = 60, octaves = 2) {
  const keys = [];
  for (let m = startMidi; m < startMidi + 12 * octaves; m++) {
    keys.push({ midi: m, pc: mod(m, 12), black: BLACK_PCS.has(mod(m, 12)) });
  }
  return keys;
}
