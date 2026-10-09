/**
 * srs.js — Repetição espaçada simples (sistema de Leitner, 5 caixas).
 *
 *  - Acertou: o item sobe uma caixa (aparece menos).
 *  - Errou: volta para a caixa 1 (aparece muito).
 *  - O sorteio de revisão usa peso por caixa: caixa 1 pesa 16× a caixa 5.
 *
 * Cada entrada guarda { gen, params } para recriar a pergunta depois.
 */
export const MAX_BOX = 5;
export const BOX_WEIGHTS = { 1: 8, 2: 4, 3: 2, 4: 1, 5: 0.5 };

export function newEntry(q) {
  return { box: 1, seen: 0, correct: 0, lastSeen: 0, gen: q.gen, params: q.params, theme: q.theme, keyId: q.keyId ?? null };
}

/** Nova entrada depois de uma resposta (não altera a original). */
export function review(entry, correct, now = Date.now()) {
  return {
    ...entry,
    box: correct ? Math.min(MAX_BOX, entry.box + 1) : 1,
    seen: entry.seen + 1,
    correct: entry.correct + (correct ? 1 : 0),
    lastSeen: now,
  };
}

export const weightOf = (entry) => BOX_WEIGHTS[entry.box] ?? 1;

/** Quantos itens estão em cada caixa (para a tela de progresso). */
export function boxCounts(srs) {
  const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const e of Object.values(srs)) counts[e.box] = (counts[e.box] || 0) + 1;
  return counts;
}
