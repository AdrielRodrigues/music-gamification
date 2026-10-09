/**
 * common.js — Peças compartilhadas pelos geradores de perguntas.
 *
 * Um GERADOR é uma regra que cria perguntas a partir da teoria:
 *   {
 *     id, theme, level, mc,          // mc = tem alternativas (múltipla escolha)
 *     audioOnly?,                     // só faz sentido com som (Ouvido)
 *     params(ctx) → params,           // sorteia os parâmetros (tom, grau…)
 *     build(params, ctx) → { prompt, answer, explanation, choices?, data?, audio? }
 *   }
 * Os parâmetros determinam a pergunta por completo. Por isso a repetição
 * espaçada guarda só { gen, params } e consegue recriar o item depois.
 *
 * ctx = { rng, notation: 'latin'|'anglo', fsharp: 'F#'|'Gb', key: id|null, level: 1..3 }
 */
import {
  formatChord, formatNote, keyFromId, keyId, keyLabel, keySignature, majorKeyIds, minorKeyIds,
  parseNote, relativeKey,
} from '../theory/index.js';
import { pick, sample, shuffle } from '../core/rng.js';

export function defineGenerator(spec) {
  return {
    ...spec,
    make(ctx, params) {
      const p = params ?? spec.params(ctx);
      const q = spec.build(p, ctx);
      return {
        ...q,
        gen: spec.id,
        theme: spec.theme,
        level: spec.level,
        params: p,
        itemKey: `${spec.id}|${JSON.stringify(p)}`,
        keyId: q.keyId !== undefined ? q.keyId : (typeof p.key === 'string' ? p.key : null),
      };
    },
  };
}

/** Atalhos de formatação na notação escolhida. */
export function fmt(ctx) {
  const N = (n) => formatNote(n, ctx.notation);
  const C = (c) => formatChord(c, ctx.notation);
  const K = (k) => keyLabel(k, ctx.notation);
  return { N, C, K, notes: (list, sep = ' – ') => list.map(N).join(sep), chords: (list, sep = ' – ') => list.map(C).join(sep) };
}

/** Máximo de acidentes na armadura por nível (1 = básico). */
const MAX_ACCIDENTALS = { 1: 2, 2: 4, 3: 7 };

/**
 * Escolhe o tom da pergunta. Se a sessão tem tom fixo, usa ele (ou a relativa,
 * se o gerador só aceita o outro modo). Senão sorteia, limitado pelo nível.
 */
export function pickKey(ctx, modes = ['major', 'minor']) {
  if (ctx.key) {
    const k = keyFromId(ctx.key);
    return modes.includes(k.mode) ? ctx.key : keyId(relativeKey(k));
  }
  const mode = modes.length > 1 ? (ctx.rng() < 0.7 ? 'major' : 'minor') : modes[0];
  const ids = (mode === 'major' ? majorKeyIds(ctx.fsharp) : minorKeyIds(ctx.fsharp))
    .filter((id) => Math.abs(keySignature(keyFromId(id))) <= MAX_ACCIDENTALS[ctx.level || 1]);
  return pick(ctx.rng, ids);
}

/** Outro tom do mesmo modo, diferente de `id` (para transposição). */
export function pickOtherKey(ctx, id) {
  const k = keyFromId(id);
  const ids = (k.mode === 'major' ? majorKeyIds(ctx.fsharp) : minorKeyIds(ctx.fsharp))
    .filter((x) => x !== id && Math.abs(keySignature(keyFromId(x))) <= MAX_ACCIDENTALS[ctx.level || 1]);
  return pick(ctx.rng, ids);
}

/** Notas usadas como ponto de partida, por nível. */
const ROOTS = {
  1: ['C', 'D', 'E', 'F', 'G', 'A', 'B'],
  2: ['C', 'D', 'E', 'F', 'G', 'A', 'B', 'Bb', 'Eb', 'Ab', 'Db', 'F#', 'C#'],
  3: ['C', 'D', 'E', 'F', 'G', 'A', 'B', 'Bb', 'Eb', 'Ab', 'Db', 'Gb', 'F#', 'C#', 'G#', 'D#', 'A#'],
};
export const pickRoot = (ctx) => pick(ctx.rng, ROOTS[ctx.level || 1]);

/** Tônica do tom da sessão (se houver) ou nota sorteada. */
export function pickRootOrTonic(ctx) {
  return ctx.key && ctx.rng() < 0.7 ? keyFromId(ctx.key).tonic : parseNote(pickRoot(ctx));
}

/**
 * Monta alternativas: a resposta + (n − 1) distratores distintos do pool,
 * embaralhados. Pool menor que o necessário gera menos alternativas.
 */
export function choicesFrom(rng, answer, pool, n = 4) {
  const others = [...new Set(pool)].filter((x) => x !== answer);
  return shuffle(rng, [answer, ...sample(rng, others, n - 1)]);
}

export const ord = (n) => `${n}º`;
export const semis = (n) => `${n} ${n === 1 ? 'semitom' : 'semitons'}`;
export const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);

/** Repete `make` até `ok` aceitar o resultado (para descartar casos ruins). */
export function retry(make, ok, tries = 30) {
  let v;
  for (let i = 0; i < tries; i++) {
    v = make();
    if (ok(v)) return v;
  }
  return v;
}
