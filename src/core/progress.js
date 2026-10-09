/**
 * progress.js — Estatísticas de acerto e sequência de dias.
 *
 * Contadores { seen, correct } agregados por:
 *   app, tema, tom, tema×tom ("campo|D") e gerador×tom ("prog.tom|D").
 */

export const rate = (s) => (s && s.seen ? s.correct / s.seen : null);

function bump(map, key, correct) {
  const s = (map[key] ??= { seen: 0, correct: 0 });
  s.seen++;
  if (correct) s.correct++;
}

const pad = (n) => String(n).padStart(2, '0');

/** "2026-10-09" no fuso local (o dia de quem está estudando). */
export function dayKey(ts) {
  const d = new Date(ts);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Registra uma resposta em todas as agregações e no dia de hoje. */
export function recordAnswer(state, q, correct, { app, now = Date.now(), ms = 0 } = {}) {
  const st = state.stats;
  if (app) bump(st.app, app, correct);
  bump(st.theme, q.theme, correct);
  if (q.keyId) {
    bump(st.key, q.keyId, correct);
    bump(st.themeKey, `${q.theme}|${q.keyId}`, correct);
    bump(st.genKey, `${q.gen}|${q.keyId}`, correct);
  }
  const day = (state.days[dayKey(now)] ??= { answered: 0, correct: 0, ms: 0 });
  day.answered++;
  if (correct) day.correct++;
  day.ms += ms;
}

/**
 * Dias seguidos com pelo menos uma resposta. Se hoje ainda não estudou,
 * a sequência não quebra: conta a partir de ontem.
 */
export function streak(days, now = Date.now()) {
  const d = new Date(now);
  if (!days[dayKey(d)]?.answered) d.setDate(d.getDate() - 1);
  let count = 0;
  while (days[dayKey(d)]?.answered) {
    count++;
    d.setDate(d.getDate() - 1);
  }
  return count;
}

/** Últimos `n` dias (do mais antigo para hoje), com zeros onde não houve estudo. */
export function lastDays(days, now = Date.now(), n = 14) {
  const out = [];
  const d = new Date(now);
  d.setDate(d.getDate() - (n - 1));
  for (let i = 0; i < n; i++) {
    const key = dayKey(d);
    out.push({ day: key, ...(days[key] ?? { answered: 0, correct: 0, ms: 0 }) });
    d.setDate(d.getDate() + 1);
  }
  return out;
}

/** Salva recorde se for maior; devolve true se bateu o recorde. */
export function setRecord(state, name, score) {
  const best = state.stats.records[name] ?? 0;
  if (score > best) {
    state.stats.records[name] = score;
    return true;
  }
  return false;
}

export function totals(state) {
  const all = Object.values(state.stats.theme);
  return {
    seen: all.reduce((s, x) => s + x.seen, 0),
    correct: all.reduce((s, x) => s + x.correct, 0),
  };
}
