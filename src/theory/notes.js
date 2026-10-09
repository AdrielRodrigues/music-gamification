/**
 * notes.js — Notas musicais com grafia preservada.
 *
 * Uma nota é { letter, acc }:
 *   letter: 0..6  → C D E F G A B  (Dó Ré Mi Fá Sol Lá Si)
 *   acc:   -2..2  → ♭♭ ♭ ♮ ♯ ♯♯
 *
 * Guardar a LETRA (e não só a altura) é o que permite distinguir Si♭ de Lá♯:
 * as duas soam igual (mesma classe de altura), mas são escritas diferente
 * conforme o tom.
 */

export const LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
export const LATIN = ['Dó', 'Ré', 'Mi', 'Fá', 'Sol', 'Lá', 'Si'];

/** Classe de altura (0–11, Dó = 0) de cada letra natural. */
export const NATURAL_PC = [0, 2, 4, 5, 7, 9, 11];

const ACC_SYMBOL = { '-2': '♭♭', '-1': '♭', 0: '', 1: '♯', 2: '♯♯' };
const ACC_ASCII = { '-2': 'bb', '-1': 'b', 0: '', 1: '#', 2: '##' };

/** Módulo sempre positivo (o % do JS devolve negativo para números negativos). */
export const mod = (n, m) => ((n % m) + m) % m;

export function note(letter, acc = 0) {
  return { letter: mod(letter, 7), acc };
}

/** Classe de altura: 0 = Dó, 1 = Dó♯/Ré♭, … 11 = Si. */
export function pitchClass(n) {
  return mod(NATURAL_PC[n.letter] + n.acc, 12);
}

/**
 * Grafa a classe de altura `pc` usando obrigatoriamente a letra `letter`.
 * Ex.: spell(Si, 10) → Si♭; spell(Lá, 10) → Lá♯.
 * É a peça central da enarmonia: quem decide a letra é a regra teórica
 * (grau da escala, número do intervalo), e o acidente sai daqui.
 */
export function spell(letter, pc) {
  letter = mod(letter, 7);
  let acc = mod(pc - NATURAL_PC[letter], 12);
  if (acc > 6) acc -= 12;
  return note(letter, acc);
}

// ---------- leitura ----------

const LATIN_RE = /^(Dó|Do|Ré|Re|Mi|Fá|Fa|Sol|Lá|La|Si)/;
const LATIN_INDEX = { Dó: 0, Do: 0, Ré: 1, Re: 1, Mi: 2, Fá: 3, Fa: 3, Sol: 4, Lá: 5, La: 5, Si: 6 };

/**
 * Lê o nome de uma nota no começo de `str` e devolve { note, rest }.
 * Aceita cifra (C, Bb, F#, B♭) e Dó-Ré-Mi (Sol, Si♭, Fá#).
 */
export function readNotePrefix(str) {
  const s = str.trim();
  let letter;
  let i;
  const m = s.match(LATIN_RE);
  if (m) {
    letter = LATIN_INDEX[m[1]];
    i = m[1].length;
  } else {
    letter = LETTERS.indexOf(s[0]);
    i = 1;
  }
  if (letter < 0) throw new Error(`Nota inválida: "${str}"`);
  let acc = 0;
  // Consome acidentes: # ♯ b ♭ (cada um vale 1 semitom).
  while (i < s.length) {
    const ch = s[i];
    if (ch === '#' || ch === '♯') acc++;
    else if (ch === 'b' || ch === '♭') acc--;
    else break;
    i++;
  }
  return { note: note(letter, acc), rest: s.slice(i) };
}

/** Lê uma nota completa ("Bb", "Fá#"…). Lança erro se sobrar texto. */
export function parseNote(str) {
  const { note: n, rest } = readNotePrefix(str);
  if (rest !== '') throw new Error(`Nota inválida: "${str}"`);
  return n;
}

// ---------- escrita ----------

/**
 * Nome da nota para exibir.
 * notation: 'latin' → "Si♭"; 'anglo' → "B♭". ascii=true usa # e b.
 */
export function formatNote(n, notation = 'anglo', ascii = false) {
  const name = notation === 'latin' ? LATIN[n.letter] : LETTERS[n.letter];
  return name + (ascii ? ACC_ASCII[n.acc] : ACC_SYMBOL[n.acc]);
}

/** Identificador estável em ASCII ("Bb", "F#") — usado em chaves e ids. */
export function noteId(n) {
  return LETTERS[n.letter] + ACC_ASCII[n.acc];
}

export const sameNote = (a, b) => a.letter === b.letter && a.acc === b.acc;
export const enharmonic = (a, b) => pitchClass(a) === pitchClass(b);

/**
 * Grafias "simples" de uma classe de altura, sem contexto de tom:
 * tecla branca → só a natural; tecla preta → [sustenido, bemol].
 * Usada quando não existe tom que decida (ex.: "um semitom acima de Mi").
 */
export function simpleSpellings(pc) {
  pc = mod(pc, 12);
  const nat = NATURAL_PC.indexOf(pc);
  if (nat >= 0) return [note(nat, 0)];
  return [
    note(NATURAL_PC.indexOf(mod(pc - 1, 12)), 1),
    note(NATURAL_PC.indexOf(mod(pc + 1, 12)), -1),
  ];
}

/** Número MIDI (Dó central = C4 = 60). Si♯3 = 60 e Dó♭4 = 59, como deve ser. */
export function midi(n, octave) {
  return 12 * (octave + 1) + NATURAL_PC[n.letter] + n.acc;
}
