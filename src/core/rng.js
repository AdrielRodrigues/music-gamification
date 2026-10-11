/**
 * rng.js — Números aleatórios com semente (mulberry32).
 * Com a mesma semente, a mesma sequência: deixa os testes determinísticos.
 * Uma "rng" é só uma função que devolve um número em [0, 1).
 */
export function seeded(seed) {
  let a = seed >>> 0;
  return function rng() {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const randInt = (rng, min, max) => min + Math.floor(rng() * (max - min + 1));
export const pick = (rng, list) => list[Math.floor(rng() * list.length)];

/** Cópia embaralhada (Fisher–Yates). */
export function shuffle(rng, list) {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** `n` itens distintos sorteados da lista. */
export const sample = (rng, list, n) => shuffle(rng, list).slice(0, n);

/**
 * Baralho: cada item sai uma vez, em ordem aleatória; ao esgotar, reembaralha.
 * Na virada não repete o último item sorteado (se houver mais de um).
 */
export function shuffleBag(rng, items) {
  let deck = [];
  let last;
  return function draw() {
    if (!deck.length) {
      deck = shuffle(rng, items);
      // O próximo a sair é o último da lista (pop).
      if (deck.length > 1 && deck[deck.length - 1] === last) [deck[0], deck[deck.length - 1]] = [deck[deck.length - 1], deck[0]];
    }
    last = deck.pop();
    return last;
  };
}
