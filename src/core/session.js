/**
 * session.js — Escolhe a próxima pergunta de uma sessão e registra respostas.
 *
 * Ordem de prioridade em next():
 *  1. Reaprendizagem: item errado NESTA sessão volta 3–5 perguntas depois.
 *  2. Revisão: com certa chance, um item já visto, sorteado pelo peso da caixa.
 *  3. Item novo: um gerador sorteado cria uma pergunta inédita.
 *
 * Não acessa DOM nem localStorage: recebe o objeto `srs` (do estado salvo)
 * e o atualiza; quem chama decide quando salvar.
 */
import { getGenerator } from '../questions/index.js';
import { newEntry, review, weightOf } from './srs.js';
import { pick, randInt, weightedPick } from './rng.js';

const RECENT_SIZE = 3;

export function createSession({ generators, ctx, srs, now = () => Date.now() }) {
  if (!generators.length) throw new Error('Nenhum gerador disponível para esta combinação de tema e nível.');
  const allowed = new Set(generators.map((g) => g.id));
  const recent = [];
  const relearn = [];
  const log = [];
  let index = 0;

  /** Itens salvos que podem voltar nesta sessão (mesmos geradores e tom compatível). */
  function reviewPool() {
    return Object.entries(srs)
      .filter(([key, e]) => allowed.has(e.gen) && !recent.includes(key) && (!ctx.key || !e.keyId || e.keyId === ctx.key))
      .map(([, e]) => ({ item: e, weight: weightOf(e) }));
  }

  /** Recria uma pergunta a partir de { gen, params }; null se o formato mudou. */
  function regenerate({ gen, params }) {
    try {
      return getGenerator(gen).make(ctx, params);
    } catch {
      return null;
    }
  }

  function remember(q) {
    recent.push(q.itemKey);
    if (recent.length > RECENT_SIZE) recent.shift();
    return q;
  }

  function next() {
    index++;
    const dueIdx = relearn.findIndex((r) => r.dueAt <= index);
    if (dueIdx >= 0) {
      const q = regenerate(relearn.splice(dueIdx, 1)[0]);
      if (q) return remember(q);
    }

    const pool = reviewPool();
    // Mais revisão quando há itens fracos (caixas 1–2) esperando.
    const weak = pool.some((x) => x.item.box <= 2);
    if (pool.length && ctx.rng() < (weak ? 0.4 : 0.2)) {
      const q = regenerate(weightedPick(ctx.rng, pool));
      if (q) return remember(q);
    }

    let q;
    for (let i = 0; i < 8; i++) {
      q = pick(ctx.rng, generators).make(ctx);
      if (!recent.includes(q.itemKey)) break;
    }
    return remember(q);
  }

  /** Registra a resposta: atualiza a caixa e agenda reaprendizagem se errou. */
  function answer(q, correct) {
    const entry = review(srs[q.itemKey] ?? newEntry(q), correct, now());
    srs[q.itemKey] = entry;
    if (!correct) relearn.push({ gen: q.gen, params: q.params, dueAt: index + randInt(ctx.rng, 3, 5) });
    log.push({ q, correct });
    return entry;
  }

  return {
    next,
    answer,
    get log() { return log; },
    get count() { return log.length; },
    get correctCount() { return log.filter((x) => x.correct).length; },
  };
}
