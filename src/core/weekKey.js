/**
 * weekKey.js — Modo "um tom por semana".
 *
 * Um tom fica em foco até ser dominado. O domínio é medido só com as
 * respostas dadas DESDE o início do foco (guarda-se uma "foto" dos
 * contadores no começo e compara-se com os atuais).
 */
import { keyFromId, pitchClass, WEEK_ORDER } from '../theory/index.js';
import { rate } from './progress.js';

/**
 * Critérios de domínio do tom (respostas com o tom em foco):
 * escala e campo harmônico de cor, progressões/transposição para o tom
 * e ouvido (solfejo, tensão/repouso) no tom.
 */
export const CRITERIA = [
  { id: 'escala', label: 'Escala e intervalos', source: 'themeKey', name: 'notas', min: 0.9, minSeen: 20 },
  { id: 'campo', label: 'Campo harmônico', source: 'themeKey', name: 'campo', min: 0.9, minSeen: 30 },
  { id: 'progressoes', label: 'Progressões e transposição', source: 'themeKey', name: 'progressoes', min: 0.85, minSeen: 30 },
  { id: 'ouvido', label: 'Ouvido no tom', source: 'themeKey', name: 'ouvido', min: 0.8, minSeen: 15 },
];

const statOf = (stats, c, key) => stats[c.source][`${c.name}|${key}`] ?? { seen: 0, correct: 0 };

function snapshot(stats, key) {
  return Object.fromEntries(CRITERIA.map((c) => [c.id, { ...statOf(stats, c, key) }]));
}

export function startWeek(state, key, now = Date.now()) {
  state.weekKey = {
    ...state.weekKey,
    active: true,
    key,
    startedAt: now,
    baseline: snapshot(state.stats, key),
  };
}

export function stopWeek(state) {
  state.weekKey = { ...state.weekKey, active: false };
}

/** Progresso de cada critério desde o início do foco. */
export function evaluateWeek(state) {
  const { key, baseline } = state.weekKey;
  const criteria = CRITERIA.map((c) => {
    const now = statOf(state.stats, c, key);
    const base = baseline?.[c.id] ?? { seen: 0, correct: 0 };
    const s = { seen: now.seen - base.seen, correct: now.correct - base.correct };
    const r = rate(s);
    return { ...c, ...s, rate: r, ok: s.seen >= c.minSeen && r >= c.min };
  });
  return { criteria, mastered: criteria.every((c) => c.ok) };
}

/** Próximo tom da ordem sugerida (aceita grafia enarmônica: G♭ = F♯). */
export function nextKey(key) {
  const pc = pitchClass(keyFromId(key).tonic);
  const idx = WEEK_ORDER.findIndex((id) => pitchClass(keyFromId(id).tonic) === pc);
  return WEEK_ORDER[(idx + 1) % WEEK_ORDER.length];
}

/** Marca o tom atual como dominado e já começa o próximo. */
export function completeWeek(state, now = Date.now()) {
  const { key, startedAt, history = [] } = state.weekKey;
  state.weekKey.history = [...history, { key, startedAt, masteredAt: now }];
  startWeek(state, nextKey(key), now);
}

export const daysSince = (ts, now = Date.now()) => Math.floor((now - ts) / 86400000);
