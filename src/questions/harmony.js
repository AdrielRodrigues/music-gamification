/**
 * Tema 2 — Campo harmônico (maior e menor natural), funções e relativas.
 */
import {
  FUNCTION_NAMES, harmonicField, key, keyFromId, keyLabel, relativeKey, transpose,
} from '../theory/index.js';
import { pick, randInt } from '../core/rng.js';
import { capitalize, choicesFrom, defineGenerator, fmt, ord, pickKey } from './common.js';

const THEME = 'campo';
const FUNCTION_CHOICES = ['Tônica', 'Subdominante', 'Dominante'];

export const degreeToChord = defineGenerator({
  id: 'campo.grauAcorde', theme: THEME, level: 1, mc: true,
  params: (ctx) => ({ key: pickKey(ctx), degree: randInt(ctx.rng, 1, 7) }),
  build({ key: id, degree }, ctx) {
    const f = fmt(ctx);
    const k = keyFromId(id);
    const field = harmonicField(k);
    const d = field[degree - 1];
    return {
      prompt: `Em ${f.K(k)}, qual é o ${d.roman}?`,
      answer: f.C(d.chord),
      explanation: field.map((x) => `${x.roman} ${f.C(x.chord)}`).join(' · '),
      choices: choicesFrom(ctx.rng, f.C(d.chord), field.map((x) => f.C(x.chord))),
    };
  },
});

export const chordToDegree = defineGenerator({
  id: 'campo.acordeGrau', theme: THEME, level: 1, mc: true,
  params: (ctx) => ({ key: pickKey(ctx), degree: randInt(ctx.rng, 1, 7) }),
  build({ key: id, degree }, ctx) {
    const f = fmt(ctx);
    const k = keyFromId(id);
    const field = harmonicField(k);
    const d = field[degree - 1];
    return {
      prompt: `Em ${f.K(k)}, que grau é ${f.C(d.chord)}?`,
      answer: d.roman,
      explanation: field.map((x) => `${x.roman} ${f.C(x.chord)}`).join(' · '),
      choices: choicesFrom(ctx.rng, d.roman, field.map((x) => x.roman)),
    };
  },
});

export const wholeField = defineGenerator({
  id: 'campo.completo', theme: THEME, level: 1, mc: false,
  params: (ctx) => ({ key: pickKey(ctx), sevenths: (ctx.level || 1) >= 2 && ctx.rng() < 0.4 }),
  build({ key: id, sevenths }, ctx) {
    const f = fmt(ctx);
    const k = keyFromId(id);
    const field = harmonicField(k, { sevenths });
    return {
      prompt: `Diga o campo harmônico de ${f.K(k)}${sevenths ? ' com tétrades' : ''}.`,
      answer: f.chords(field.map((d) => d.chord)),
      explanation: field.map((d) => d.roman).join(' – '),
    };
  },
});

export const relative = defineGenerator({
  id: 'campo.relativa', theme: THEME, level: 1, mc: true,
  params: (ctx) => ({ key: pickKey(ctx) }),
  build({ key: id }, ctx) {
    const f = fmt(ctx);
    const k = keyFromId(id);
    const rel = relativeKey(k);
    // Pegadinhas: a homônima (mesma tônica, outro modo) e tons vizinhos.
    const pool = [
      key(k.tonic, rel.mode),
      key(transpose(rel.tonic, '2M'), rel.mode),
      key(transpose(rel.tonic, '2M', -1), rel.mode),
      key(transpose(rel.tonic, '5J'), rel.mode),
    ].map(f.K);
    const how = k.mode === 'major'
      ? 'A relativa menor fica no 6º grau (uma 3ª menor abaixo da tônica).'
      : 'A relativa maior fica no 3º grau (uma 3ª menor acima da tônica).';
    return {
      prompt: `Qual é a relativa ${rel.mode === 'major' ? 'maior' : 'menor'} de ${f.K(k)}?`,
      answer: f.K(rel),
      explanation: `${how} As duas usam as mesmas notas.`,
      choices: choicesFrom(ctx.rng, f.K(rel), pool),
    };
  },
});

export const chordFunction = defineGenerator({
  id: 'campo.funcao', theme: THEME, level: 2, mc: true,
  params: (ctx) => ({ key: pickKey(ctx), degree: randInt(ctx.rng, 1, 7) }),
  build({ key: id, degree }, ctx) {
    const f = fmt(ctx);
    const k = keyFromId(id);
    const field = harmonicField(k);
    const d = field[degree - 1];
    const groups = ['T', 'SD', 'D'].map((fn) => `${capitalize(FUNCTION_NAMES[fn])}: ${field.filter((x) => x.func === fn).map((x) => x.roman).join(', ')}`);
    return {
      prompt: `Em ${f.K(k)}, qual é a função de ${f.C(d.chord)} (${d.roman})?`,
      answer: capitalize(FUNCTION_NAMES[d.func]),
      explanation: groups.join(' · '),
      choices: FUNCTION_CHOICES,
    };
  },
});

export const functionGroup = defineGenerator({
  id: 'campo.grupoFuncao', theme: THEME, level: 2, mc: false,
  params: (ctx) => ({ key: pickKey(ctx), fn: pick(ctx.rng, ['T', 'SD', 'D']) }),
  build({ key: id, fn }, ctx) {
    const f = fmt(ctx);
    const k = keyFromId(id);
    const list = harmonicField(k).filter((d) => d.func === fn);
    return {
      prompt: `Em ${f.K(k)}, quais acordes têm função de ${FUNCTION_NAMES[fn]}?`,
      answer: list.map((d) => f.C(d.chord)).join(', '),
      explanation: list.map((d) => d.roman).join(', '),
    };
  },
});

const QUALITY_LABEL = { maj: 'Maior', min: 'Menor', dim: 'Diminuto' };

export const degreeQuality = defineGenerator({
  id: 'campo.qualidade', theme: THEME, level: 1, mc: true,
  params: (ctx) => ({
    mode: (ctx.level || 1) >= 2 && ctx.rng() < 0.4 ? 'minor' : 'major',
    degree: randInt(ctx.rng, 1, 7),
  }),
  build({ mode, degree }, ctx) {
    // O padrão é o mesmo em todos os tons; Dó maior / Lá menor só servem de exemplo.
    const k = keyFromId(mode === 'major' ? 'C' : 'Am');
    const field = harmonicField(k);
    const d = field[degree - 1];
    return {
      keyId: null,
      prompt: `No campo harmônico ${mode === 'major' ? 'maior' : 'menor natural'}, o acorde do ${ord(degree)} grau é maior, menor ou diminuto?`,
      answer: QUALITY_LABEL[d.chord.type],
      explanation: `Padrão: ${field.map((x) => x.roman).join(' ')} (ex.: ${keyLabel(k, ctx.notation)} = ${field.map((x) => fmt(ctx).C(x.chord)).join(' ')}).`,
      choices: Object.values(QUALITY_LABEL),
    };
  },
});

export const HARMONY_GENERATORS = [degreeToChord, chordToDegree, wholeField, relative, chordFunction, functionGroup, degreeQuality];
