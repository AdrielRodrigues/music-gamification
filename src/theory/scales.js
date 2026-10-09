/**
 * scales.js — Escalas construídas POR LETRAS.
 *
 * O grau n usa a letra (tônica + n − 1) e o acidente necessário para chegar
 * à distância certa da tônica. Assim cada letra aparece uma única vez e a
 * grafia sai correta: Fá maior tem Si♭ (nunca Lá♯), Fá♯ maior tem Mi♯.
 */
import { pitchClass, spell } from './notes.js';

export const SCALES = {
  major: { name: 'maior', semis: [0, 2, 4, 5, 7, 9, 11] },
  minor: { name: 'menor natural', semis: [0, 2, 3, 5, 7, 8, 10] },
  harmonicMinor: { name: 'menor harmônica', semis: [0, 2, 3, 5, 7, 8, 11] },
};

/** As 7 notas da escala, começando pela tônica. */
export function buildScale(tonic, type = 'major') {
  const base = pitchClass(tonic);
  return SCALES[type].semis.map((s, i) => spell(tonic.letter + i, base + s));
}

/** Nome dos passos: 1 semitom = "st", 2 = "T", 3 = "T½" (1 tom e meio). */
const STEP_NAMES = { 1: 'st', 2: 'T', 3: 'T½' };

/**
 * Fórmula de passos da escala, incluindo o passo do 7º grau de volta à oitava.
 * Maior → ['T','T','st','T','T','T','st'].
 */
export function stepFormula(type = 'major') {
  const s = [...SCALES[type].semis, 12];
  return s.slice(1).map((v, i) => STEP_NAMES[v - s[i]]);
}

/**
 * Tendências melódicas na escala maior: graus instáveis "puxam" para graus
 * estáveis (1, 3, 5). É a base de ouvir tensão e repouso.
 */
export const TENDENCIES = {
  7: { to: 1, why: 'a sensível fica a 1 semitom da tônica' },
  4: { to: 3, why: 'o 4º grau fica a 1 semitom do 3º' },
  2: { to: 1, why: 'o 2º grau desce um tom até a tônica' },
  6: { to: 5, why: 'o 6º grau desce um tom até a dominante' },
};
