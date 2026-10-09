/**
 * intervals.js — Intervalos com grafia correta.
 *
 * Um intervalo é { number, quality }:
 *   number:  1 = uníssono, 2 = segunda, 3 = terça … 8 = oitava
 *   quality: 'J' justa, 'M' maior, 'm' menor, 'A' aumentada, 'd' diminuta
 *
 * Regra de ouro: o NÚMERO decide a letra (3ª de Si♭ é sempre alguma "Ré"),
 * a QUALIDADE decide o acidente (3ª maior = 4 semitons → Ré natural).
 */
import { mod, note, pitchClass, NATURAL_PC } from './notes.js';

/** Semitons das qualidades "de referência" (maior ou justa) de 1 a 7. */
const BASE_SEMIS = [0, 2, 4, 5, 7, 9, 11];
/** Índices (0 = uníssono) que pertencem à família das justas: 1, 4, 5. */
const PERFECT = new Set([0, 3, 4]);

const PERFECT_OFFSET = { d: -1, J: 0, A: 1 };
const MAJOR_OFFSET = { d: -2, m: -1, M: 0, A: 1 };

export const QUALITY_NAMES = { J: 'justa', M: 'maior', m: 'menor', A: 'aumentada', d: 'diminuta' };

export function interval(number, quality) {
  return { number, quality };
}

/** Lê '3M', '5J', '4A', '7m', '5d' (aceita 'P' como sinônimo de 'J'). */
export function parseInterval(str) {
  const m = str.match(/^(\d+)([JPMmAd])$/);
  if (!m) throw new Error(`Intervalo inválido: "${str}"`);
  const quality = m[2] === 'P' ? 'J' : m[2];
  return interval(Number(m[1]), quality);
}

export function intervalId(iv) {
  return `${iv.number}${iv.quality}`;
}

/** Quantidade de semitons do intervalo. */
export function semitones(iv) {
  const simple = (iv.number - 1) % 7;
  const octaves = Math.floor((iv.number - 1) / 7);
  const table = PERFECT.has(simple) ? PERFECT_OFFSET : MAJOR_OFFSET;
  const offset = table[iv.quality];
  if (offset === undefined) throw new Error(`Qualidade impossível: ${intervalId(iv)}`);
  return BASE_SEMIS[simple] + 12 * octaves + offset;
}

/**
 * Transpõe uma nota por um intervalo. dir = +1 (acima) ou -1 (abaixo).
 * Ex.: transpose(Si♭, 3M) → Ré; transpose(Sol♯, 3M) → Si♯ (não Dó!).
 */
export function transpose(n, iv, dir = 1) {
  const s = typeof iv === 'string' ? parseInterval(iv) : iv;
  const letter = mod(n.letter + dir * (s.number - 1), 7);
  const target = pitchClass(n) + dir * semitones(s);
  let acc = mod(target - NATURAL_PC[letter], 12);
  if (acc > 6) acc -= 12;
  return note(letter, acc);
}

/**
 * Intervalo simples ascendente de `a` até `b` (dentro de uma oitava).
 * Ex.: between(Ré, Fá♯) → 3M; between(Ré, Sol♭) → 4d.
 */
export function between(a, b) {
  const number = mod(b.letter - a.letter, 7) + 1;
  const semis = mod(pitchClass(b) - pitchClass(a), 12);
  let diff = semis - BASE_SEMIS[number - 1];
  if (diff > 6) diff -= 12;
  if (diff < -6) diff += 12;
  const table = PERFECT.has(number - 1) ? PERFECT_OFFSET : MAJOR_OFFSET;
  const quality = Object.keys(table).find((q) => table[q] === diff);
  if (!quality) throw new Error('Intervalo fora do vocabulário (duplamente aumentado/diminuto)');
  return interval(number, quality);
}

/** "3ª maior", "5ª justa", "8ª justa"; uníssono tem nome próprio. */
export function intervalName(iv) {
  if (iv.number === 1 && iv.quality === 'J') return 'uníssono';
  return `${iv.number}ª ${QUALITY_NAMES[iv.quality]}`;
}
