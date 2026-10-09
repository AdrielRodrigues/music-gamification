/**
 * keys.js — Tons, campo harmônico, funções, relativas e detecção de tom.
 *
 * Um tom é { tonic: Nota, mode: 'major' | 'minor' }.
 * O id textual de um tom é a cifra da tônica + "m" se for menor: "D", "Bbm".
 */
import { formatNote, mod, noteId, parseNote, pitchClass } from './notes.js';
import { transpose } from './intervals.js';
import { buildScale } from './scales.js';
import { chord, chordTones, triadQuality, typeFromSemitones } from './chords.js';

// ---------- os 24 tons com grafia convencional ----------

const MAJOR_IDS = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];
const MINOR_IDS = ['Am', 'Bbm', 'Bm', 'Cm', 'C#m', 'Dm', 'D#m', 'Em', 'Fm', 'F#m', 'Gm', 'G#m'];

/**
 * Tons maiores usuais. A única escolha de grafia é F♯ (6 sustenidos) ou
 * G♭ (6 bemóis) — os dois são comuns; fica a cargo das configurações.
 */
export function majorKeyIds(fsharp = 'F#') {
  return MAJOR_IDS.map((id) => (id === 'F#' && fsharp === 'Gb' ? 'Gb' : id));
}

/** Tons menores usuais (D♯m é relativa de F♯; E♭m de G♭). */
export function minorKeyIds(fsharp = 'F#') {
  return MINOR_IDS.map((id) => (id === 'D#m' && fsharp === 'Gb' ? 'Ebm' : id));
}

export function key(tonic, mode = 'major') {
  return { tonic, mode };
}

export function keyFromId(id) {
  const minor = id.endsWith('m');
  return key(parseNote(minor ? id.slice(0, -1) : id), minor ? 'minor' : 'major');
}

export function keyId(k) {
  return noteId(k.tonic) + (k.mode === 'minor' ? 'm' : '');
}

/** "Ré maior", "Si menor" (ou "D maior", "Bm"… na cifra: "B menor"). */
export function keyLabel(k, notation = 'latin') {
  return `${formatNote(k.tonic, notation)} ${k.mode === 'major' ? 'maior' : 'menor'}`;
}

export function keyScale(k) {
  return buildScale(k.tonic, k.mode === 'major' ? 'major' : 'minor');
}

/** Número de acidentes na armadura (positivo = sustenidos, negativo = bemóis). */
export function keySignature(k) {
  return keyScale(k).reduce((sum, n) => sum + n.acc, 0);
}

// ---------- campo harmônico ----------

const NUMERALS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];
const LOWER_TYPES = new Set(['min', 'dim', 'm7', 'm7b5', 'dim7', 'mMaj7']);
const ROMAN_SUFFIX = { maj: '', min: '', dim: '°', aug: '+', 7: '7', maj7: 'maj7', m7: '7', m7b5: 'ø7', dim7: '°7', mMaj7: '(maj7)' };

/** Algarismo romano do grau, com maiúscula/minúscula conforme o acorde. */
export function roman(degree, type) {
  const base = NUMERALS[degree - 1];
  return (LOWER_TYPES.has(type) ? base.toLowerCase() : base) + ROMAN_SUFFIX[type];
}

export const FUNCTION_NAMES = { T: 'tônica', SD: 'subdominante', D: 'dominante' };

/**
 * Função harmônica de cada grau.
 * Maior: T = I, iii, vi · SD = ii, IV · D = V, vii°.
 * Menor natural: T = i, III · SD = ii°, iv, VI · D = v, VII.
 */
const FUNCTIONS = {
  major: ['T', 'SD', 'T', 'SD', 'D', 'T', 'D'],
  minor: ['T', 'SD', 'T', 'SD', 'D', 'SD', 'D'],
};

/** Empilha terças sobre o grau `i` (0-based) de uma escala de 7 notas. */
function stackThirds(scale, i, size) {
  const tones = [];
  for (let k = 0; k < size; k++) tones.push(scale[(i + 2 * k) % 7]);
  const root = tones[0];
  const semis = tones.map((n) => mod(pitchClass(n) - pitchClass(root), 12));
  return chord(root, typeFromSemitones(semis));
}

/**
 * Campo harmônico do tom: 7 graus com acorde, algarismo romano e função.
 * opts.sevenths: tétrades em vez de tríades.
 * opts.harmonicV: em menor, usa o V maior da menor harmônica (cadência forte).
 */
export function harmonicField(k, { sevenths = false, harmonicV = false } = {}) {
  const size = sevenths ? 4 : 3;
  const scale = keyScale(k);
  const harm = k.mode === 'minor' && harmonicV ? buildScale(k.tonic, 'harmonicMinor') : null;
  return scale.map((_, i) => {
    const ch = stackThirds(harm && i === 4 ? harm : scale, i, size);
    const fn = harm && i === 4 ? 'D' : FUNCTIONS[k.mode][i];
    return { degree: i + 1, chord: ch, roman: roman(i + 1, ch.type), func: fn };
  });
}

/** Relativa: maior → menor no 6º grau (3ª menor abaixo); menor → maior no 3º grau. */
export function relativeKey(k) {
  return k.mode === 'major'
    ? key(transpose(k.tonic, '3m', -1), 'minor')
    : key(transpose(k.tonic, '3m', 1), 'major');
}

/**
 * Ordem sugerida para o "Tom da Semana": alterna sustenidos e bemóis,
 * do mais simples (0 acidentes) ao mais difícil (6).
 */
export const WEEK_ORDER = ['C', 'G', 'F', 'D', 'Bb', 'A', 'Eb', 'E', 'Ab', 'B', 'Db', 'F#'];

/**
 * Dominante secundário: o V7 de um grau do campo (V/ii, V/V…).
 * A fundamental fica uma 5ª justa acima da fundamental do grau-alvo.
 */
export function secondaryDominant(k, targetDegree) {
  const target = harmonicField(k)[targetDegree - 1].chord;
  return chord(transpose(target.root, '5J'), '7');
}

// ---------- detecção de tom ----------

/**
 * Descobre o tom de uma lista de acordes. Para cada um dos 24 tons conta
 * quantos acordes pertencem ao campo (comparando altura + qualidade da tríade,
 * então a grafia de entrada não importa). Em menor também aceita o V maior.
 *
 * Desempate: o acorde de tônica presente, no começo ou no fim, pesa a favor.
 * Devolve todos os tons, do mais provável ao menos provável:
 *   [{ key, fit, score }]
 */
export function detectKey(chords, { fsharp = 'F#' } = {}) {
  const candidates = [...majorKeyIds(fsharp), ...minorKeyIds(fsharp)].map(keyFromId);
  const sig = (ch) => `${pitchClass(ch.root)}:${triadQuality(ch.type)}`;
  const input = chords.map(sig);

  const ranked = candidates.map((k) => {
    const field = harmonicField(k);
    const allowed = new Set(field.map((d) => sig(d.chord)));
    if (k.mode === 'minor') allowed.add(sig(harmonicField(k, { harmonicV: true })[4].chord));
    const tonic = sig(field[0].chord);
    const fit = input.filter((s) => allowed.has(s)).length;
    let score = 0;
    if (input.includes(tonic)) score += 2;
    if (input[0] === tonic) score += 1;
    if (input[input.length - 1] === tonic) score += 1;
    return { key: k, fit, score };
  });

  // sort é estável: em empate total, maior vem antes de menor (ordem dos candidatos).
  return ranked.sort((a, b) => b.fit - a.fit || b.score - a.score);
}

/** Notas de cada acorde do campo (atalho útil para explicações). */
export function fieldNotes(k, opts) {
  return harmonicField(k, opts).map((d) => chordTones(d.chord));
}
