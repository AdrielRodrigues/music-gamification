/**
 * Tema 5 — Formação de acordes: tríades, tétrades, inversões e
 * dominantes secundários.
 */
import {
  chord, chordNotes, chordTones, CHORD_TYPES, formatChord, harmonicField, keyFromId, note, noteId,
  parseNote, secondaryDominant, simpleSpellings, pitchClass,
} from '../theory/index.js';
import { pick, randInt } from '../core/rng.js';
import { choicesFrom, defineGenerator, fmt, ord, pickKey, pickRootOrTonic, retry } from './common.js';

const THEME = 'acordes';

const TRIADS_BY_LEVEL = { 1: ['maj', 'min'], 2: ['maj', 'min', 'dim'], 3: ['maj', 'min', 'dim', 'aug'] };
const SEVENTHS_BY_LEVEL = { 1: ['7', 'maj7', 'm7'], 2: ['7', 'maj7', 'm7'], 3: ['7', 'maj7', 'm7', 'm7b5', 'dim7'] };

/** Acorde sorteado cujas notas não passam de 1 acidente (exceto no avançado). */
function pickChordParams(ctx, types) {
  const maxAcc = (ctx.level || 1) >= 3 ? 2 : 1;
  return retry(
    () => ({ root: noteId(pickRootOrTonic(ctx)), type: pick(ctx.rng, types) }),
    (p) => chordTones(chord(parseNote(p.root), p.type)).every((n) => Math.abs(n.acc) <= maxAcc),
  );
}

/**
 * Distratores de "quais notas formam X": o mesmo acorde com outros tipos e
 * a resposta com uma nota trocada pela enarmônica (som certo, grafia errada).
 */
function spellingDistractors(f, root, type, types) {
  const pool = types.filter((t) => t !== type).map((t) => f.notes(chordTones(chord(root, t))));
  const tones = chordTones(chord(root, type));
  tones.forEach((n, i) => {
    if (i === 0) return;
    const alt = simpleSpellings(pitchClass(n)).find((x) => x.letter !== n.letter);
    if (alt) pool.push(f.notes(tones.map((t, j) => (j === i ? alt : t))));
  });
  return pool;
}

export const triadSpelling = defineGenerator({
  id: 'acordes.triade', theme: THEME, level: 1, mc: true,
  params: (ctx) => pickChordParams(ctx, TRIADS_BY_LEVEL[ctx.level || 1]),
  build({ root, type }, ctx) {
    const f = fmt(ctx);
    const r = parseNote(root);
    const ch = chord(r, type);
    const tones = chordTones(ch);
    const answer = f.notes(tones);
    return {
      keyId: null,
      prompt: `Quais notas formam ${f.C(ch)}?`,
      answer,
      explanation: `${CHORD_TYPES[type].name}: ${CHORD_TYPES[type].ivs.join(' + ')} (fundamental, terça, quinta).`,
      choices: choicesFrom(ctx.rng, answer, spellingDistractors(f, r, type, TRIADS_BY_LEVEL[3])),
      data: { build: { expected: tones.map(noteId), ordered: false } },
    };
  },
});

export const majorVsMinor = defineGenerator({
  id: 'acordes.maiorMenor', theme: THEME, level: 1, mc: false,
  params: (ctx) => pickChordParams(ctx, ['maj']),
  build({ root }, ctx) {
    const f = fmt(ctx);
    const r = parseNote(root);
    const maj = chordTones(chord(r, 'maj'));
    const min = chordTones(chord(r, 'min'));
    return {
      keyId: null,
      prompt: `O que muda de ${f.C(chord(r, 'maj'))} para ${f.C(chord(r, 'min'))}?`,
      answer: `A terça: ${f.N(maj[1])} → ${f.N(min[1])} (desce 1 semitom)`,
      explanation: `${f.C(chord(r, 'maj'))} = ${f.notes(maj)} · ${f.C(chord(r, 'min'))} = ${f.notes(min)}. Fundamental e quinta não mudam.`,
    };
  },
});

export const seventhSpelling = defineGenerator({
  id: 'acordes.tetrade', theme: THEME, level: 2, mc: true,
  params: (ctx) => pickChordParams(ctx, SEVENTHS_BY_LEVEL[ctx.level || 2]),
  build({ root, type }, ctx) {
    const f = fmt(ctx);
    const r = parseNote(root);
    const ch = chord(r, type);
    const tones = chordTones(ch);
    const answer = f.notes(tones);
    return {
      keyId: null,
      prompt: `Quais notas formam ${f.C(ch)}?`,
      answer,
      explanation: `${CHORD_TYPES[type].name}: ${CHORD_TYPES[type].ivs.join(' + ')}.`,
      choices: choicesFrom(ctx.rng, answer, spellingDistractors(f, r, type, SEVENTHS_BY_LEVEL[3])),
      data: { build: { expected: tones.map(noteId), ordered: false } },
    };
  },
});

const typeLabel = (t) => `${CHORD_TYPES[t].symbol || 'maior'} — ${CHORD_TYPES[t].name}`;

export const seventhByDegree = defineGenerator({
  id: 'acordes.tipoPorGrau', theme: THEME, level: 2, mc: true,
  params: (ctx) => ({ degree: randInt(ctx.rng, 1, 7) }),
  build({ degree }, ctx) {
    const field = harmonicField(keyFromId('C'), { sevenths: true });
    const d = field[degree - 1];
    return {
      keyId: null,
      prompt: `No campo maior com tétrades, que tipo de acorde fica no ${ord(degree)} grau?`,
      answer: typeLabel(d.chord.type),
      explanation: `Padrão: ${field.map((x) => x.roman).join(' ')} (ex.: ${field.map((x) => formatChord(x.chord, ctx.notation)).join(' ')}).`,
      choices: ['maj7', '7', 'm7', 'm7b5'].map(typeLabel),
    };
  },
});

export const seventhInKey = defineGenerator({
  id: 'acordes.tetradeNoTom', theme: THEME, level: 2, mc: true,
  params: (ctx) => ({ key: pickKey(ctx, ['major']), degree: randInt(ctx.rng, 1, 7) }),
  build({ key: id, degree }, ctx) {
    const f = fmt(ctx);
    const k = keyFromId(id);
    const field = harmonicField(k, { sevenths: true });
    const d = field[degree - 1];
    // Mesma fundamental com outro tipo de sétima: o erro mais comum.
    const pool = [...['7', 'maj7', 'm7', 'm7b5'].map((t) => f.C(chord(d.chord.root, t))), ...field.map((x) => f.C(x.chord))];
    return {
      prompt: `Em ${f.K(k)}, qual é a tétrade do ${ord(degree)} grau?`,
      answer: f.C(d.chord),
      explanation: field.map((x) => `${x.roman} ${f.C(x.chord)}`).join(' · '),
      choices: choicesFrom(ctx.rng, f.C(d.chord), pool),
    };
  },
});

export const inversionBass = defineGenerator({
  id: 'acordes.inversao', theme: THEME, level: 2, mc: true,
  params(ctx) {
    const p = pickChordParams(ctx, (ctx.level || 2) >= 3 ? ['maj', 'min', '7'] : ['maj', 'min']);
    return { ...p, inversion: randInt(ctx.rng, 1, p.type === '7' ? 3 : 2) };
  },
  build({ root, type, inversion }, ctx) {
    const f = fmt(ctx);
    const r = parseNote(root);
    const inverted = chord(r, type, inversion);
    const notes = chordNotes(inverted);
    const tones = chordTones(chord(r, type));
    return {
      keyId: null,
      prompt: `Qual nota fica no baixo de ${f.C(chord(r, type))} na ${inversion}ª inversão?`,
      answer: f.N(notes[0]),
      explanation: `${f.C(inverted)}: ${f.notes(notes)}. 1ª inversão = terça no baixo; 2ª = quinta; 3ª = sétima.`,
      choices: choicesFrom(ctx.rng, f.N(notes[0]), [...tones.map(f.N), f.N(note(notes[0].letter + 1, 0))]),
    };
  },
});

export const secondaryDominantQ = defineGenerator({
  id: 'acordes.domSecundario', theme: THEME, level: 3, mc: true,
  params: (ctx) => ({ key: pickKey(ctx, ['major']), target: pick(ctx.rng, [2, 3, 4, 5, 6]) }),
  build({ key: id, target }, ctx) {
    const f = fmt(ctx);
    const k = keyFromId(id);
    const field = harmonicField(k);
    const t = field[target - 1];
    const sec = secondaryDominant(k, target);
    const pool = [
      ...[2, 3, 4, 5, 6].map((x) => f.C(secondaryDominant(k, x))),
      f.C(chord(sec.root, 'm7')),
      f.C(chord(sec.root, 'maj7')),
    ];
    return {
      prompt: `Em ${f.K(k)}, qual é o dominante secundário do ${t.roman} (V7/${t.roman})?`,
      answer: f.C(sec),
      explanation: `${t.roman} = ${f.C(t.chord)}. Uma 5ª justa acima de ${f.N(t.chord.root)} está ${f.N(sec.root)}; dominante = acorde maior com 7ª menor → ${f.C(sec)}.`,
      choices: choicesFrom(ctx.rng, f.C(sec), pool),
    };
  },
});

export const CHORD_GENERATORS = [triadSpelling, majorVsMinor, seventhSpelling, seventhByDegree, seventhInKey, inversionBass, secondaryDominantQ];
