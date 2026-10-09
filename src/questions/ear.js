/**
 * Tema 6 — Treino auditivo.
 *
 * Duas famílias:
 *  - mentais (solfejo, tendência, tensão): funcionam em silêncio; o som,
 *    quando ligado, serve para CONFERIR depois de pensar/cantar;
 *  - audioOnly (grau, acorde, intervalo, repouso): a pergunta É o som.
 *
 * O áudio vem em duas partes (ver audioEvents.js): intro = contexto
 * (cadência), target = o que se quer reconhecer (pode ser repetido sozinho).
 */
import {
  FUNCTION_NAMES, harmonicField, intervalName, keyFromId, keyScale, parseInterval, semitones, TENDENCIES,
} from '../theory/index.js';
import { cadence, chordEvent, degreeMidi, noteEvent as note, rest } from './audioEvents.js';
import { pick, randInt, sample } from '../core/rng.js';
import { capitalize, defineGenerator, fmt, ord, pickKey } from './common.js';

const THEME = 'ouvido';

// ---------- mentais ----------

/** Melodia curta por graus: começa e termina na tônica, com passos pequenos. */
function melody(ctx) {
  const level = ctx.level || 1;
  const len = level === 1 ? randInt(ctx.rng, 3, 4) : level === 2 ? randInt(ctx.rng, 4, 6) : randInt(ctx.rng, 5, 7);
  const top = level === 1 ? 5 : 8;
  const steps = level === 1 ? [-1, 1, 1, 2, -2] : [-3, -2, -1, 1, 2, 3];
  const seq = [1];
  let cur = 1;
  while (seq.length < len - 1) {
    let step = pick(ctx.rng, steps);
    if (cur + step < 1 || cur + step > top) step = -step; // "rebate" nos limites
    cur += step;
    seq.push(cur);
  }
  if (cur === 1) seq[seq.length - 1] = 2; // evita terminar com 1 – 1
  seq.push(1);
  return seq;
}

export const solfege = defineGenerator({
  id: 'ouvido.solfejo', theme: THEME, level: 1, mc: false,
  params: (ctx) => ({ key: pickKey(ctx, (ctx.level || 1) >= 3 ? ['major', 'minor'] : ['major']), degrees: melody(ctx) }),
  build({ key: id, degrees }, ctx) {
    const f = fmt(ctx);
    const k = keyFromId(id);
    const scale = keyScale(k);
    return {
      prompt: `Em ${f.K(k)}, cante de cabeça os graus ${degrees.join(' – ')}.`,
      answer: degrees.map((d) => f.N(scale[(d - 1) % 7])).join(' – '),
      explanation: 'Pense em cada grau em relação à tônica, não nota a nota. Depois ouça e compare.',
      audio: { intro: [chordEvent(harmonicField(k)[0].chord, 1.2), rest(0.3)], target: degrees.map((d) => note(degreeMidi(k, d))) },
      data: { solfege: { degrees } },
    };
  },
});

export const tonicFifth = defineGenerator({
  id: 'ouvido.tonicaQuinta', theme: THEME, level: 1, mc: false,
  params: (ctx) => ({ key: pickKey(ctx) }),
  build({ key: id }, ctx) {
    const f = fmt(ctx);
    const k = keyFromId(id);
    const scale = keyScale(k);
    return {
      prompt: `Imagine a tônica de ${f.K(k)}. Cante a tônica, suba até a 5ª e volte.`,
      answer: `${f.N(scale[0])} → ${f.N(scale[4])} → ${f.N(scale[0])}`,
      explanation: 'A 5ª é a nota mais estável depois da tônica: começo de "Star Wars".',
      audio: { intro: [note(degreeMidi(k, 1), 1.0), rest(0.3)], target: [1, 5, 1].map((d) => note(degreeMidi(k, d), 0.7)) },
      data: { solfege: { degrees: [1, 5, 1] } },
    };
  },
});

export const tendency = defineGenerator({
  id: 'ouvido.tendencia', theme: THEME, level: 1, mc: true,
  params: (ctx) => ({ key: pickKey(ctx, ['major']), degree: Number(pick(ctx.rng, Object.keys(TENDENCIES))) }),
  build({ key: id, degree }, ctx) {
    const f = fmt(ctx);
    const k = keyFromId(id);
    const scale = keyScale(k);
    const t = TENDENCIES[degree];
    return {
      prompt: `Na escala maior, o ${ord(degree)} grau é instável. Para qual grau ele tende a ir?`,
      answer: `${ord(t.to)} grau`,
      explanation: `${capitalize(t.why)}. Em ${f.K(k)}: ${f.N(scale[degree - 1])} → ${f.N(scale[t.to - 1])}.`,
      choices: ['1º grau', '3º grau', '5º grau'],
      audio: { intro: cadence(k), target: [note(degreeMidi(k, degree), 0.9), note(degreeMidi(k, degree === 7 ? 8 : t.to), 1.2)] },
    };
  },
});

const FEEL = { T: 'Repouso', SD: 'Afastamento', D: 'Tensão' };
const FEEL_WHY = { T: 'soa como chegada, casa', SD: 'se afasta da tônica sem urgência', D: 'pede resolução na tônica' };

export const tension = defineGenerator({
  id: 'ouvido.tensao', theme: THEME, level: 1, mc: true,
  params: (ctx) => ({ key: pickKey(ctx), degree: pick(ctx.rng, [1, 2, 4, 5, 6, 7]) }),
  build({ key: id, degree }, ctx) {
    const f = fmt(ctx);
    const k = keyFromId(id);
    const d = harmonicField(k)[degree - 1];
    return {
      prompt: `Em ${f.K(k)}, o acorde ${f.C(d.chord)} (${d.roman}) soa como repouso, afastamento ou tensão?`,
      answer: FEEL[d.func],
      explanation: `${d.roman} tem função de ${FUNCTION_NAMES[d.func]}: ${FEEL_WHY[d.func]}.`,
      choices: Object.values(FEEL),
      audio: { intro: cadence(k), target: [chordEvent(d.chord, 1.4)] },
    };
  },
});

// ---------- só com som ----------

const DEGREES_BY_LEVEL = { 1: [1, 3, 5], 2: [1, 2, 3, 4, 5, 6, 7], 3: [1, 2, 3, 4, 5, 6, 7] };

export const hearDegree = defineGenerator({
  id: 'ouvido.grauNota', theme: THEME, level: 1, mc: true, audioOnly: true,
  params: (ctx) => ({
    key: pickKey(ctx, (ctx.level || 1) >= 3 ? ['major', 'minor'] : ['major']),
    degree: pick(ctx.rng, DEGREES_BY_LEVEL[ctx.level || 1]),
  }),
  build({ key: id, degree }, ctx) {
    const f = fmt(ctx);
    const k = keyFromId(id);
    const allowed = DEGREES_BY_LEVEL[ctx.level || 1].includes(degree) ? DEGREES_BY_LEVEL[ctx.level || 1] : DEGREES_BY_LEVEL[2];
    return {
      prompt: 'Ouça a cadência e depois a nota. Que grau é?',
      answer: ord(degree),
      explanation: `${ord(degree)} grau de ${f.K(k)} = ${f.N(keyScale(k)[degree - 1])}.`,
      choices: allowed.map(ord),
      audio: { intro: cadence(k), target: [note(degreeMidi(k, degree), 1.4)] },
    };
  },
});

const CHORD_DEGREES_BY_LEVEL = { 1: [1, 4, 5], 2: [1, 2, 4, 5, 6], 3: [1, 2, 3, 4, 5, 6] };

export const hearChord = defineGenerator({
  id: 'ouvido.grauAcorde', theme: THEME, level: 1, mc: true, audioOnly: true,
  params: (ctx) => ({ key: pickKey(ctx, ['major']), degree: pick(ctx.rng, CHORD_DEGREES_BY_LEVEL[ctx.level || 1]) }),
  build({ key: id, degree }, ctx) {
    const f = fmt(ctx);
    const k = keyFromId(id);
    const field = harmonicField(k);
    const levelList = CHORD_DEGREES_BY_LEVEL[ctx.level || 1];
    const allowed = levelList.includes(degree) ? levelList : CHORD_DEGREES_BY_LEVEL[3];
    return {
      prompt: 'Ouça a cadência e depois o acorde. Que grau é?',
      answer: field[degree - 1].roman,
      explanation: `${field[degree - 1].roman} de ${f.K(k)} = ${f.C(field[degree - 1].chord)}.`,
      choices: allowed.map((d) => field[d - 1].roman),
      audio: { intro: cadence(k), target: [chordEvent(field[degree - 1].chord, 1.4)] },
    };
  },
});

const INTERVALS_BY_LEVEL = {
  1: ['3M', '4J', '5J', '8J'],
  2: ['2M', '3m', '3M', '4J', '5J', '6M', '8J'],
  3: ['2m', '2M', '3m', '3M', '4J', '4A', '5J', '6m', '6M', '7m', '7M', '8J'],
};

/** Músicas conhecidas que começam com o intervalo (ajudam a memorizar). */
const REFERENCES = {
  '2m': 'tema de "Tubarão"',
  '2M': '"Parabéns pra você" (pa-ra → béns)',
  '3m': 'riff de "Smoke on the Water"',
  '3M': '"When the Saints Go Marching In"',
  '4J': '"Here Comes the Bride" (marcha nupcial)',
  '5J': 'tema de "Star Wars"',
  '6M': '"My Bonnie Lies Over the Ocean"',
  '7m': '"Somewhere" (West Side Story)',
  '8J': '"Somewhere Over the Rainbow"',
};

export const hearInterval = defineGenerator({
  id: 'ouvido.intervalo', theme: THEME, level: 1, mc: true, audioOnly: true,
  params: (ctx) => ({ root: randInt(ctx.rng, 55, 67), iv: pick(ctx.rng, INTERVALS_BY_LEVEL[ctx.level || 1]) }),
  build({ root, iv }, ctx) {
    const top = root + semitones(parseInterval(iv));
    const levelList = INTERVALS_BY_LEVEL[ctx.level || 1];
    const allowed = levelList.includes(iv) ? levelList : INTERVALS_BY_LEVEL[3];
    return {
      keyId: null,
      prompt: 'Que intervalo você ouviu (subindo)?',
      answer: intervalName(parseInterval(iv)),
      explanation: REFERENCES[iv] ? `Referência: ${REFERENCES[iv]}.` : `${semitones(parseInterval(iv))} semitons.`,
      choices: allowed.map((x) => intervalName(parseInterval(x))),
      audio: { intro: [], target: [note(root, 0.7), note(top, 0.9), rest(0.3), { m: [root, top], d: 1.2 }] },
    };
  },
});

export const hearResolution = defineGenerator({
  id: 'ouvido.repouso', theme: THEME, level: 1, mc: true, audioOnly: true,
  params: (ctx) => ({
    key: pickKey(ctx, ['major']),
    middle: sample(ctx.rng, [2, 4, 6], 2),
    end: pick(ctx.rng, [1, 5]),
  }),
  build({ key: id, middle, end }, ctx) {
    const f = fmt(ctx);
    const k = keyFromId(id);
    const field = harmonicField(k);
    const degrees = [1, ...middle, end];
    const answer = end === 1 ? 'Repouso (terminou no I)' : 'Suspenso (terminou no V)';
    return {
      prompt: 'A progressão terminou em repouso ou ficou suspensa?',
      answer,
      explanation: `${degrees.map((d) => field[d - 1].roman).join(' – ')} em ${f.K(k)}: ${degrees.map((d) => f.C(field[d - 1].chord)).join(' – ')}.`,
      choices: ['Repouso (terminou no I)', 'Suspenso (terminou no V)'],
      audio: { intro: [], target: degrees.map((d, i) => chordEvent(field[d - 1].chord, i === degrees.length - 1 ? 1.4 : 0.8)) },
    };
  },
});

export const EAR_GENERATORS = [solfege, tonicFifth, tendency, tension, hearDegree, hearChord, hearInterval, hearResolution];
