/**
 * Tema 1 — Notas e intervalos.
 */
import {
  between, intervalName, keyFromId, keyScale, note, noteId, parseInterval, parseNote,
  pitchClass, SCALES, semitones, simpleSpellings, stepFormula, transpose,
} from '../theory/index.js';
import { pick, randInt } from '../core/rng.js';
import { choicesFrom, defineGenerator, fmt, ord, pickKey, pickRootOrTonic, retry } from './common.js';

const THEME = 'notas';

/** Intervalos treinados por nível. */
export const INTERVALS_BY_LEVEL = {
  1: ['3M', '3m', '5J'],
  2: ['3M', '3m', '5J', '2M', '4J', '6M', '7m', '7M'],
  3: ['3M', '3m', '5J', '2M', '4J', '6M', '7m', '7M', '2m', '6m', '4A', '5d'],
};

/** "Fá♯ / Sol♭" — nomes possíveis de uma altura sem contexto de tom. */
const pcLabel = (f, pc) => simpleSpellings(pc).map(f.N).join(' / ');

export const scaleDegree = defineGenerator({
  id: 'notas.grauEscala', theme: THEME, level: 1, mc: true,
  params: (ctx) => ({ key: pickKey(ctx), degree: randInt(ctx.rng, 2, 7) }),
  build({ key, degree }, ctx) {
    const f = fmt(ctx);
    const k = keyFromId(key);
    const scale = keyScale(k);
    const ans = scale[degree - 1];
    // Distratores: outras notas da escala e a própria letra com outro acidente.
    const pool = [...scale.map(f.N), f.N(note(ans.letter, ans.acc + 1)), f.N(note(ans.letter, ans.acc - 1))];
    return {
      prompt: `Qual é o ${ord(degree)} grau da escala de ${f.K(k)}?`,
      answer: f.N(ans),
      explanation: f.notes(scale),
      choices: choicesFrom(ctx.rng, f.N(ans), pool),
    };
  },
});

export const fullScale = defineGenerator({
  id: 'notas.escala', theme: THEME, level: 1, mc: false,
  params: (ctx) => ({ key: pickKey(ctx) }),
  build({ key }, ctx) {
    const f = fmt(ctx);
    const k = keyFromId(key);
    const scale = keyScale(k);
    return {
      prompt: `Diga as notas da escala de ${f.K(k)}.`,
      answer: f.notes(scale),
      explanation: `Fórmula: ${stepFormula(k.mode === 'major' ? 'major' : 'minor').join(' – ')}. Cada letra aparece uma vez.`,
      data: { build: { expected: scale.map(noteId), ordered: true } },
    };
  },
});

export const neighbor = defineGenerator({
  id: 'notas.vizinho', theme: THEME, level: 1, mc: true,
  params: (ctx) => ({
    root: noteId(pickRootOrTonic(ctx)),
    size: pick(ctx.rng, ['st', 'T']),
    dir: pick(ctx.rng, ['up', 'down']),
  }),
  build({ root, size, dir }, ctx) {
    const f = fmt(ctx);
    const r = parseNote(root);
    const step = (size === 'T' ? 2 : 1) * (dir === 'up' ? 1 : -1);
    const pc = pitchClass(r) + step;
    const pool = [-3, -2, -1, 1, 2, 3].map((d) => pcLabel(f, pc + d)).filter((x) => x !== pcLabel(f, pitchClass(r)));
    const natural = ['E', 'F', 'B', 'C'].includes(root) && size === 'st';
    return {
      prompt: `Qual nota está um ${size === 'T' ? 'tom' : 'semitom'} ${dir === 'up' ? 'acima' : 'abaixo'} de ${f.N(r)}?`,
      answer: pcLabel(f, pc),
      explanation: `${size === 'T' ? '1 tom = 2 semitons' : '1 semitom = a tecla/casa vizinha'}.`
        + (natural ? ' Entre Mi–Fá e Si–Dó não há tecla preta: já é semitom.' : ''),
      choices: choicesFrom(ctx.rng, pcLabel(f, pc), pool),
    };
  },
});

/** Mesma letra de destino com qualidades vizinhas + grafia enarmônica: as pegadinhas certas. */
function intervalDistractors(f, root, iv, answer) {
  const same = iv.number;
  const quals = ['d', 'm', 'M', 'A', 'J'];
  const pool = [];
  for (const q of quals) {
    try {
      const n = transpose(root, { number: same, quality: q });
      if (Math.abs(n.acc) <= 2) pool.push(f.N(n));
    } catch { /* qualidade impossível para esse número */ }
  }
  for (const n of simpleSpellings(pitchClass(answer))) pool.push(f.N(n));
  return pool;
}

export const intervalAbove = defineGenerator({
  id: 'notas.intervaloAcima', theme: THEME, level: 1, mc: true,
  params: (ctx) => retry(
    () => ({ root: noteId(pickRootOrTonic(ctx)), iv: pick(ctx.rng, INTERVALS_BY_LEVEL[ctx.level || 1]) }),
    (p) => Math.abs(transpose(parseNote(p.root), p.iv).acc) <= ((ctx.level || 1) >= 3 ? 2 : 1),
  ),
  build({ root, iv }, ctx) {
    const f = fmt(ctx);
    const r = parseNote(root);
    const i = parseInterval(iv);
    const ans = transpose(r, i);
    const letters = Array.from({ length: i.number }, (_, k) => f.N(note(r.letter + k, 0)));
    return {
      prompt: `Qual é a ${intervalName(i)} acima de ${f.N(r)}?`,
      answer: f.N(ans),
      explanation: `${semitones(i)} semitons; ${i.number} letras (${letters.join('-')}), então a resposta é algum "${letters[letters.length - 1]}".`,
      choices: choicesFrom(ctx.rng, f.N(ans), intervalDistractors(f, r, i, ans)),
    };
  },
});

export const whichInterval = defineGenerator({
  id: 'notas.qualIntervalo', theme: THEME, level: 2, mc: true,
  params: (ctx) => retry(
    () => ({ root: noteId(pickRootOrTonic(ctx)), iv: pick(ctx.rng, INTERVALS_BY_LEVEL[ctx.level || 2]) }),
    (p) => Math.abs(transpose(parseNote(p.root), p.iv).acc) <= 1,
  ),
  build({ root, iv }, ctx) {
    const f = fmt(ctx);
    const r = parseNote(root);
    const i = parseInterval(iv);
    const top = transpose(r, i);
    const answer = intervalName(between(r, top));
    return {
      prompt: `De ${f.N(r)} subindo até ${f.N(top)}: que intervalo é?`,
      answer,
      explanation: `Conte as letras (${i.number}) para o número e os semitons (${semitones(i)}) para a qualidade.`,
      choices: choicesFrom(ctx.rng, answer, INTERVALS_BY_LEVEL[3].map((x) => intervalName(parseInterval(x)))),
    };
  },
});

const STEP_LABEL = { T: 'Tom', st: 'Semitom', 'T½': 'Tom e meio' };

export const scaleFormula = defineGenerator({
  id: 'notas.formula', theme: THEME, level: 1, mc: true,
  params: (ctx) => ({
    mode: (ctx.level || 1) >= 2 && ctx.rng() < 0.4 ? 'minor' : 'major',
    pos: randInt(ctx.rng, 1, 7),
  }),
  build({ mode, pos }) {
    const steps = stepFormula(mode);
    const to = pos === 7 ? 'a oitava' : `o ${ord(pos + 1)}`;
    return {
      keyId: null,
      prompt: `Na escala ${SCALES[mode].name}, do ${ord(pos)} grau para ${to}: tom ou semitom?`,
      answer: STEP_LABEL[steps[pos - 1]],
      explanation: `Fórmula da escala ${SCALES[mode].name}: ${steps.join(' – ')}`,
      choices: ['Tom', 'Semitom'],
    };
  },
});

export const NOTE_GENERATORS = [scaleDegree, fullScale, neighbor, intervalAbove, whichInterval, scaleFormula];
