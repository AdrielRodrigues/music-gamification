/**
 * session.js — Escolhe a próxima pergunta de uma sessão e registra respostas.
 *
 * Sorteio equilibrado, em dois baralhos:
 *  1. Tema: os temas da sessão se revezam (cada um sai uma vez antes de repetir),
 *     então misturar temas dá a mesma fatia a cada um, tenha ele 4 ou 8 tipos.
 *  2. Tipo: dentro do tema, cada gerador sai uma vez antes de repetir.
 * O gerador sorteia os parâmetros; se a pergunta já saiu nesta sessão, tenta
 * de novo com o mesmo gerador (para não desequilibrar os baralhos).
 *
 * Acertar ou errar não muda a ordem. Não acessa DOM nem localStorage.
 */
import { shuffleBag } from './rng.js';

const MAX_TRIES = 20;

export function createSession({ generators, ctx }) {
  if (!generators.length) throw new Error('Nenhum gerador disponível para esta combinação de tema e nível.');

  const byTheme = new Map();
  for (const g of generators) byTheme.set(g.theme, [...(byTheme.get(g.theme) ?? []), g]);
  const nextTheme = shuffleBag(ctx.rng, [...byTheme.keys()]);
  const nextGen = new Map([...byTheme].map(([theme, gens]) => [theme, shuffleBag(ctx.rng, gens)]));

  const asked = new Set();
  const log = [];

  function next() {
    const gen = nextGen.get(nextTheme())();
    let q;
    // Poucas combinações possíveis (ex.: tom fixo): aceita repetir depois de MAX_TRIES.
    for (let i = 0; i < MAX_TRIES; i++) {
      q = gen.make(ctx);
      if (!asked.has(q.itemKey)) break;
    }
    asked.add(q.itemKey);
    return q;
  }

  function answer(q, correct) {
    log.push({ q, correct });
  }

  return {
    next,
    answer,
    get log() { return log; },
    get count() { return log.length; },
    get correctCount() { return log.filter((x) => x.correct).length; },
  };
}
