/**
 * Tema 4 — Braço (violão/guitarra) e teclado.
 */
import {
  BARRE_SHAPES, chord, chordMidis, chordNotes, chordTones, fretPc, GUITAR_STRINGS, note, noteId,
  openNote, parseNote, pitchClass, shapeAt, shapeRootFret, simpleSpellings, mod,
} from '../theory/index.js';
import { pick, randInt } from '../core/rng.js';
import { choicesFrom, defineGenerator, fmt, pickRootOrTonic, retry, semis } from './common.js';

const THEME = 'instrumento';
const ROLE_NAMES = { R: 'Fundamental', 3: 'Terça', 5: 'Quinta' };
const ROLE_INDEX = { R: 0, 3: 1, 5: 2 };

const pcLabel = (f, pc) => simpleSpellings(pc).map(f.N).join(' / ');

export const openString = defineGenerator({
  id: 'inst.cordaSolta', theme: THEME, level: 1, mc: true,
  params: (ctx) => ({ string: pick(ctx.rng, GUITAR_STRINGS) }),
  build({ string }, ctx) {
    const f = fmt(ctx);
    const answer = f.N(openNote(string));
    return {
      prompt: `Qual é a nota da ${string}ª corda solta (violão/guitarra)?`,
      answer,
      explanation: `Da 6ª (grave) à 1ª (aguda): ${f.notes(GUITAR_STRINGS.map(openNote))}.`,
      choices: choicesFrom(ctx.rng, answer, ['E', 'A', 'D', 'G', 'B', 'C', 'F'].map((n) => f.N(parseNote(n)))),
      data: { fret: { mode: 'name', string, fret: 0, pc: pitchClass(openNote(string)) } },
    };
  },
});

export const fretNote = defineGenerator({
  id: 'inst.casa', theme: THEME, level: 1, mc: true,
  params: (ctx) => ({ string: pick(ctx.rng, GUITAR_STRINGS), fret: randInt(ctx.rng, 1, (ctx.level || 1) >= 2 ? 12 : 5) }),
  build({ string, fret }, ctx) {
    const f = fmt(ctx);
    const pc = fretPc(string, fret);
    const answer = pcLabel(f, pc);
    return {
      prompt: `Que nota está na ${string}ª corda, casa ${fret}?`,
      answer,
      explanation: `Corda solta ${f.N(openNote(string))} + ${semis(fret)}. Atalho: casa 5 = próxima corda solta; casa 12 = a própria corda solta.`,
      choices: choicesFrom(ctx.rng, answer, [-2, -1, 1, 2, 5, 7].map((d) => pcLabel(f, pc + d))),
      data: { fret: { mode: 'name', string, fret, pc } },
    };
  },
});

export const findFret = defineGenerator({
  id: 'inst.ondeNota', theme: THEME, level: 2, mc: true,
  params: (ctx) => ({ string: pick(ctx.rng, GUITAR_STRINGS), pc: randInt(ctx.rng, 0, 11) }),
  build({ string, pc }, ctx) {
    const f = fmt(ctx);
    const fret = mod(pc - pitchClass(openNote(string)), 12);
    const label = (x) => (x === 0 ? 'Casa 0 (solta) ou 12' : `Casa ${x}`);
    return {
      prompt: `Na ${string}ª corda (${f.N(openNote(string))}), em que casa está ${pcLabel(f, pc)}?`,
      answer: label(fret),
      explanation: `${f.N(openNote(string))} + ${semis(fret)} = ${pcLabel(f, pc)}.`,
      choices: choicesFrom(ctx.rng, label(fret), [-2, -1, 1, 2, 3].map((d) => label(mod(fret + d, 12)))),
      data: { fret: { mode: 'find', string, pc } },
    };
  },
});

export const toneRole = defineGenerator({
  id: 'inst.funcao', theme: THEME, level: 1, mc: true,
  params(ctx) {
    return retry(
      () => ({ root: noteId(pickRootOrTonic(ctx)), type: pick(ctx.rng, ['maj', 'min']), role: pick(ctx.rng, [1, 2]) }),
      (p) => chordTones(chord(parseNote(p.root), p.type)).every((n) => Math.abs(n.acc) <= 1),
    );
  },
  build({ root, type, role }, ctx) {
    const f = fmt(ctx);
    const ch = chord(parseNote(root), type);
    const tones = chordTones(ch);
    const ans = tones[role];
    return {
      keyId: null,
      prompt: `Qual é a ${role === 1 ? 'terça' : 'quinta'} de ${f.C(ch)}?`,
      answer: f.N(ans),
      explanation: `${f.C(ch)} = ${f.notes(tones)} (fundamental – terça – quinta).`,
      choices: choicesFrom(ctx.rng, f.N(ans), [...tones.map(f.N), f.N(note(ans.letter, ans.acc + 1)), f.N(note(ans.letter, ans.acc - 1))]),
    };
  },
});

export const shapeRole = defineGenerator({
  id: 'inst.shape', theme: THEME, level: 2, mc: true,
  params(ctx) {
    const shape = pick(ctx.rng, Object.keys(BARRE_SHAPES));
    const root = noteId(pickRootOrTonic(ctx));
    return { shape, root, dot: randInt(ctx.rng, 0, BARRE_SHAPES[shape].dots.length - 1) };
  },
  build({ shape, root, dot }, ctx) {
    const f = fmt(ctx);
    const s = BARRE_SHAPES[shape];
    const ch = chord(parseNote(root), s.type);
    let rootFret = shapeRootFret(shape, pitchClass(ch.root));
    if (rootFret === 0) rootFret = 12; // evita "pestana na casa 0"
    const dots = shapeAt(shape, rootFret);
    const d = dots[dot];
    const n = chordTones(ch)[ROLE_INDEX[d.role]];
    return {
      keyId: null,
      prompt: `${f.C(ch)} na ${s.name} (pestana na casa ${rootFret}): a nota da ${d.string}ª corda, casa ${d.fret}, é fundamental, terça ou quinta?`,
      answer: ROLE_NAMES[d.role],
      explanation: `É ${f.N(n)}. ${f.C(ch)} = ${f.notes(chordTones(ch))}.`,
      choices: Object.values(ROLE_NAMES),
      data: { fret: { mode: 'role', dots, highlight: dot } },
    };
  },
});

/** Acorde para o teclado, com inversão a partir do nível 2. */
function keyboardChordParams(ctx) {
  const level = ctx.level || 1;
  return retry(
    () => ({
      root: noteId(pickRootOrTonic(ctx)),
      type: pick(ctx.rng, level >= 2 ? ['maj', 'min', 'dim'] : ['maj', 'min']),
      inversion: level >= 2 ? randInt(ctx.rng, 0, 2) : 0,
    }),
    (p) => chordTones(chord(parseNote(p.root), p.type)).every((n) => Math.abs(n.acc) <= 1),
  );
}

export const keyboardBuild = defineGenerator({
  id: 'inst.teclado', theme: THEME, level: 1, mc: true,
  params: keyboardChordParams,
  build({ root, type, inversion }, ctx) {
    const f = fmt(ctx);
    const ch = chord(parseNote(root), type, inversion);
    const notes = chordNotes(ch);
    const answer = f.notes(notes);
    const pool = [0, 1, 2].filter((i) => i !== inversion).map((i) => f.notes(chordNotes(chord(ch.root, type, i))))
      .concat(['maj', 'min', 'dim'].filter((t) => t !== type).map((t) => f.notes(chordNotes(chord(ch.root, t, inversion)))));
    return {
      keyId: null,
      prompt: `No teclado, quais notas formam ${f.C(ch)}${inversion ? ' (do grave para o agudo)' : ''}?`,
      answer,
      explanation: inversion ? `${inversion}ª inversão: ${inversion === 1 ? 'a terça' : 'a quinta'} vai para o baixo.` : 'Estado fundamental: fundamental no baixo.',
      choices: choicesFrom(ctx.rng, answer, pool),
      data: { keys: { mode: 'build', pcs: notes.map(pitchClass), bassPc: pitchClass(notes[0]) } },
    };
  },
});

export const keyboardName = defineGenerator({
  id: 'inst.tecladoNomeie', theme: THEME, level: 2, mc: true,
  params: keyboardChordParams,
  build({ root, type, inversion }, ctx) {
    const f = fmt(ctx);
    const ch = chord(parseNote(root), type, inversion);
    const notes = chordNotes(ch);
    const answer = f.C(ch);
    // Distratores: outras inversões e acordes com fundamental em outra nota do conjunto.
    const pool = [0, 1, 2].filter((i) => i !== inversion).map((i) => f.C(chord(ch.root, type, i)))
      .concat(notes.flatMap((n) => ['maj', 'min'].map((t) => f.C(chord(n, t)))));
    return {
      keyId: null,
      prompt: `Que acorde formam ${f.notes(notes)} (do grave para o agudo)?`,
      answer,
      explanation: `Empilhe em terças para achar a fundamental: ${f.notes(chordTones(ch))}. A nota do baixo indica a inversão.`,
      choices: choicesFrom(ctx.rng, answer, pool),
      data: { keys: { mode: 'name', midis: chordMidis(ch, 60) } },
      audio: { intro: [], target: [{ m: chordMidis(ch, 60), d: 1.4 }] },
    };
  },
});

export const INSTRUMENT_GENERATORS = [openString, fretNote, findFret, toneRole, shapeRole, keyboardBuild, keyboardName];
