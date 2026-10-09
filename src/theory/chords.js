/**
 * chords.js — Acordes: formação, cifra, inversões e identificação.
 *
 * Um acorde é { root, type, inversion }:
 *   root:      Nota (com grafia)
 *   type:      chave de CHORD_TYPES ('maj', 'min', '7', 'maj7'…)
 *   inversion: 0 = estado fundamental, 1 = 1ª inversão (terça no baixo)…
 */
import { formatNote, midi, mod, pitchClass, readNotePrefix, sameNote } from './notes.js';
import { parseInterval, semitones, transpose } from './intervals.js';

export const CHORD_TYPES = {
  maj: { ivs: ['1J', '3M', '5J'], symbol: '', name: 'maior' },
  min: { ivs: ['1J', '3m', '5J'], symbol: 'm', name: 'menor' },
  dim: { ivs: ['1J', '3m', '5d'], symbol: '°', name: 'diminuto' },
  aug: { ivs: ['1J', '3M', '5A'], symbol: '+', name: 'aumentado' },
  7: { ivs: ['1J', '3M', '5J', '7m'], symbol: '7', name: 'com sétima (dominante)' },
  maj7: { ivs: ['1J', '3M', '5J', '7M'], symbol: 'maj7', name: 'com sétima maior' },
  m7: { ivs: ['1J', '3m', '5J', '7m'], symbol: 'm7', name: 'menor com sétima' },
  m7b5: { ivs: ['1J', '3m', '5d', '7m'], symbol: 'm7(♭5)', name: 'meio-diminuto' },
  dim7: { ivs: ['1J', '3m', '5d', '7d'], symbol: '°7', name: 'diminuto com sétima' },
  mMaj7: { ivs: ['1J', '3m', '5J', '7M'], symbol: 'm(maj7)', name: 'menor com sétima maior' },
};

/** Semitons de cada nota do tipo, a partir da fundamental. Ex.: maj → [0,4,7]. */
export function typeSemitones(type) {
  return CHORD_TYPES[type].ivs.map((s) => semitones(parseInterval(s)));
}

/** Tipo de acorde a partir dos semitons acima da fundamental (ou undefined). */
export function typeFromSemitones(semis) {
  const key = semis.join(',');
  return Object.keys(CHORD_TYPES).find((t) => typeSemitones(t).join(',') === key);
}

/** Tétrade → tríade de mesma qualidade (usado para comparar acordes). */
export function triadQuality(type) {
  return { maj: 'maj', 7: 'maj', maj7: 'maj', min: 'min', m7: 'min', mMaj7: 'min', dim: 'dim', m7b5: 'dim', dim7: 'dim', aug: 'aug' }[type];
}

export function chord(root, type = 'maj', inversion = 0) {
  return { root, type, inversion };
}

/** Notas do acorde em estado fundamental: fundamental, terça, quinta (, sétima). */
export function chordTones(ch) {
  return CHORD_TYPES[ch.type].ivs.map((iv) => transpose(ch.root, iv));
}

/** Notas na ordem em que soam, do baixo para cima, respeitando a inversão. */
export function chordNotes(ch) {
  const tones = chordTones(ch);
  const k = ch.inversion || 0;
  return [...tones.slice(k), ...tones.slice(0, k)];
}

/** Nomes das funções das notas dentro do acorde. */
export const TONE_ROLES = ['fundamental', 'terça', 'quinta', 'sétima'];

/** Cifra: "B♭maj7", "F♯m", "C/E" (inversão vira baixo invertido). */
export function formatChord(ch, notation = 'anglo') {
  const base = formatNote(ch.root, notation) + CHORD_TYPES[ch.type].symbol;
  if (!ch.inversion) return base;
  return `${base}/${formatNote(chordNotes(ch)[0], notation)}`;
}

/** Nome por extenso: "Ré menor", "Si♭ com sétima maior". */
export function chordLongName(ch, notation = 'latin') {
  return `${formatNote(ch.root, notation)} ${CHORD_TYPES[ch.type].name}`;
}

/** Sufixos de cifra aceitos na leitura (inclui a escrita brasileira "7M"). */
const SUFFIXES = {
  '': 'maj', M: 'maj',
  m: 'min', '-': 'min',
  dim: 'dim', '°': 'dim', o: 'dim',
  aug: 'aug', '+': 'aug',
  7: '7',
  maj7: 'maj7', '7M': 'maj7', M7: 'maj7', 'Δ': 'maj7', 'Δ7': 'maj7',
  m7: 'm7', '-7': 'm7',
  m7b5: 'm7b5', 'm7(b5)': 'm7b5', 'm7(♭5)': 'm7b5', 'ø': 'm7b5', 'ø7': 'm7b5',
  dim7: 'dim7', '°7': 'dim7', o7: 'dim7',
  'm(maj7)': 'mMaj7', m7M: 'mMaj7', mMaj7: 'mMaj7',
};

/** Lê uma cifra: "Bbmaj7", "F#m7(b5)", "C/E", "Rém", "Sol7M". */
export function parseChord(str) {
  const [main, bass] = str.trim().split('/');
  const { note: root, rest } = readNotePrefix(main);
  const type = SUFFIXES[rest];
  if (!type) throw new Error(`Cifra inválida: "${str}"`);
  let inversion = 0;
  if (bass) {
    const { note: b } = readNotePrefix(bass);
    inversion = chordTones(chord(root, type)).findIndex((n) => sameNote(n, b));
    if (inversion < 0) throw new Error(`Baixo fora do acorde: "${str}"`);
  }
  return chord(root, type, inversion);
}

/**
 * Identifica um acorde a partir das notas (a primeira é o baixo).
 * Testa cada nota como possível fundamental. Devolve null se não reconhecer.
 */
export function identifyChord(notes) {
  const pcs = notes.map(pitchClass);
  for (const root of notes) {
    const r = pitchClass(root);
    const rel = [...new Set(pcs.map((p) => mod(p - r, 12)))].sort((a, b) => a - b);
    const type = typeFromSemitones(rel);
    if (type) {
      const ch = chord(root, type);
      const inversion = chordTones(ch).findIndex((n) => pitchClass(n) === pcs[0]);
      return chord(root, type, inversion);
    }
  }
  return null;
}

/**
 * Notas MIDI em posição fechada, para tocar: o baixo é a primeira nota a
 * partir de `low`, e cada nota seguinte fica logo acima da anterior.
 */
export function chordMidis(ch, low = 55) {
  const out = [];
  for (const n of chordNotes(ch)) {
    let m = midi(n, -1);
    while (m < (out.length ? out[out.length - 1] + 1 : low)) m += 12;
    out.push(m);
  }
  return out;
}
