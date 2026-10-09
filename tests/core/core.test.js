import { test } from 'node:test';
import assert from 'node:assert/strict';
import { seeded } from '../../src/core/rng.js';
import { newEntry, review, boxCounts } from '../../src/core/srs.js';
import { createSession } from '../../src/core/session.js';
import { dayKey, lastDays, rate, recordAnswer, setRecord, streak } from '../../src/core/progress.js';
import { completeWeek, evaluateWeek, nextKey, startWeek } from '../../src/core/weekKey.js';
import {
  defaultState, exportState, importState, loadState, saveState, STORAGE_KEY,
} from '../../src/core/storage.js';
import { getGenerator, selectGenerators } from '../../src/questions/index.js';

const ctxOf = (seed, extra = {}) => ({ rng: seeded(seed), level: 1, notation: 'latin', fsharp: 'F#', key: null, ...extra });

// ---------- srs ----------

test('Leitner: acerto sobe uma caixa, erro volta para a 1', () => {
  let e = newEntry({ gen: 'x', params: {}, theme: 'notas' });
  e = review(e, true, 1);
  e = review(e, true, 2);
  assert.equal(e.box, 3);
  e = review(e, false, 3);
  assert.equal(e.box, 1);
  assert.equal(e.seen, 3);
  assert.equal(e.correct, 2);
  for (let i = 0; i < 10; i++) e = review(e, true, 4);
  assert.equal(e.box, 5);
  assert.deepEqual(boxCounts({ a: e, b: newEntry({}) }), { 1: 1, 2: 0, 3: 0, 4: 0, 5: 1 });
});

// ---------- sessão ----------

test('sessão: item errado volta 3 a 5 perguntas depois', () => {
  const srs = {};
  const s = createSession({ generators: selectGenerators({ themes: ['campo'], level: 1 }), ctx: ctxOf(42), srs });
  const first = s.next();
  s.answer(first, false);
  const following = [];
  for (let i = 0; i < 6; i++) {
    const q = s.next();
    following.push(q.itemKey);
    s.answer(q, true);
  }
  const pos = following.indexOf(first.itemKey);
  assert.ok(pos >= 2 && pos <= 4, `voltou na posição ${pos}`);
  assert.equal(srs[first.itemKey].box, 2); // errou (1) e depois acertou (2)
});

test('sessão: itens errados aparecem mais que os acertados', () => {
  const gens = selectGenerators({ themes: ['notas'], level: 1, mc: true });
  const srs = {};
  // Treino inicial: erra tudo de notas.vizinho, acerta todo o resto.
  const warm = createSession({ generators: gens, ctx: ctxOf(7), srs });
  for (let i = 0; i < 150; i++) {
    const q = warm.next();
    warm.answer(q, q.gen !== 'notas.vizinho');
  }
  const weak = Object.values(srs).filter((e) => e.gen === 'notas.vizinho');
  const strong = Object.values(srs).filter((e) => e.gen !== 'notas.vizinho');
  assert.ok(weak.every((e) => e.box === 1));
  assert.ok(strong.some((e) => e.box >= 3));

  // Numa sessão nova, conta quantas revisões são de itens fracos.
  const s = createSession({ generators: gens, ctx: ctxOf(99), srs: structuredClone(srs) });
  const known = new Set(Object.keys(srs));
  let weakReviews = 0;
  let strongReviews = 0;
  for (let i = 0; i < 200; i++) {
    const q = s.next();
    if (known.has(q.itemKey)) {
      if (q.gen === 'notas.vizinho') weakReviews++;
      else strongReviews++;
    }
  }
  const weakShare = weakReviews / (weakReviews + strongReviews);
  const weakPopulation = weak.length / (weak.length + strong.length);
  assert.ok(weakShare > weakPopulation, `fracos: ${weakShare.toFixed(2)} das revisões, ${weakPopulation.toFixed(2)} dos itens`);
});

test('sessão: respeita o tom fixo e não repete a pergunta anterior', () => {
  const s = createSession({ generators: [getGenerator('campo.grauAcorde')], ctx: ctxOf(3, { key: 'Eb' }), srs: {} });
  let prev = null;
  for (let i = 0; i < 50; i++) {
    const q = s.next();
    assert.equal(q.keyId, 'Eb');
    assert.notEqual(q.itemKey, prev);
    prev = q.itemKey;
    s.answer(q, true);
  }
});

test('sessão: sem geradores dá erro claro', () => {
  assert.throws(() => createSession({ generators: [], ctx: ctxOf(1), srs: {} }), /Nenhum gerador/);
});

// ---------- progresso ----------

test('registro de respostas e taxa de acerto', () => {
  const st = defaultState();
  const q = { theme: 'campo', keyId: 'D', gen: 'campo.grauAcorde' };
  recordAnswer(st, q, true, { app: 'cartas', now: Date.UTC(2026, 9, 9, 12) });
  recordAnswer(st, q, false, { app: 'cartas', now: Date.UTC(2026, 9, 9, 12) });
  assert.deepEqual(st.stats.themeKey['campo|D'], { seen: 2, correct: 1 });
  assert.deepEqual(st.stats.genKey['campo.grauAcorde|D'], { seen: 2, correct: 1 });
  assert.equal(rate(st.stats.app.cartas), 0.5);
  assert.equal(rate(undefined), null);
});

test('sequência de dias', () => {
  const day = (y, m, d) => new Date(y, m - 1, d, 12).getTime();
  const days = {};
  for (const d of [5, 6, 7, 8]) days[dayKey(day(2026, 10, d))] = { answered: 3, correct: 2, ms: 0 };
  assert.equal(streak(days, day(2026, 10, 8)), 4);
  assert.equal(streak(days, day(2026, 10, 9)), 4); // hoje ainda não estudou: não quebra
  assert.equal(streak(days, day(2026, 10, 10)), 0); // pulou um dia
  assert.equal(lastDays(days, day(2026, 10, 8), 5).map((x) => x.answered).join(), '0,3,3,3,3');
});

test('recordes', () => {
  const st = defaultState();
  assert.equal(setRecord(st, 'relampago', 10), true);
  assert.equal(setRecord(st, 'relampago', 8), false);
  assert.equal(st.stats.records.relampago, 10);
});

// ---------- tom da semana ----------

test('tom da semana: domínio conta só respostas desde o início', () => {
  const st = defaultState();
  const ans = (theme, gen, correct) => recordAnswer(st, { theme, gen, keyId: 'D' }, correct);
  for (let i = 0; i < 40; i++) ans('campo', 'campo.grauAcorde', false); // erros antigos
  startWeek(st, 'D', 0);
  for (let i = 0; i < 30; i++) ans('campo', 'campo.grauAcorde', true);
  for (let i = 0; i < 30; i++) ans('progressoes', 'prog.realizar', true);
  for (let i = 0; i < 20; i++) ans('notas', 'notas.grauEscala', true);
  let ev = evaluateWeek(st);
  const campo = ev.criteria.find((c) => c.id === 'campo');
  assert.equal(campo.ok, true); // 30/30 desde o início, apesar dos 40 erros antes
  assert.equal(ev.mastered, false); // falta o ouvido
  for (let i = 0; i < 15; i++) ans('ouvido', 'ouvido.solfejo', i % 10 !== 0); // 13/15 ≈ 87%
  ev = evaluateWeek(st);
  assert.equal(ev.mastered, true);
  completeWeek(st, 1);
  assert.equal(st.weekKey.key, 'Bb');
  assert.equal(st.weekKey.history[0].key, 'D');
});

test('ordem dos tons aceita enarmonia', () => {
  assert.equal(nextKey('C'), 'G');
  assert.equal(nextKey('Gb'), 'C'); // G♭ = F♯, último da lista
});

// ---------- armazenamento ----------

function fakeStorage() {
  const data = {};
  return { getItem: (k) => data[k] ?? null, setItem: (k, v) => { data[k] = String(v); }, data };
}

test('salvar e carregar', () => {
  const mem = fakeStorage();
  const st = defaultState();
  st.settings.notation = 'anglo';
  st.srs.x = { box: 2 };
  assert.equal(saveState(st, mem), true);
  const back = loadState(mem);
  assert.equal(back.settings.notation, 'anglo');
  assert.equal(back.settings.sound, true); // padrão preservado
  assert.deepEqual(back.srs.x, { box: 2 });
});

test('estado corrompido ou ausente volta ao padrão', () => {
  const mem = fakeStorage();
  assert.deepEqual(loadState(mem), defaultState());
  mem.data[STORAGE_KEY] = '{não é json';
  assert.deepEqual(loadState(mem), defaultState());
  assert.deepEqual(loadState(undefined), defaultState());
  assert.equal(saveState(defaultState(), { setItem() { throw new Error('cota'); } }), false);
});

test('exportar e importar', () => {
  const st = defaultState();
  st.days['2026-10-09'] = { answered: 5, correct: 4, ms: 1000 };
  const back = importState(exportState(st));
  assert.deepEqual(back, st);
  assert.throws(() => importState(JSON.stringify({ app: 'outro' })));
  assert.throws(() => importState(JSON.stringify({ schemaVersion: 99 })));
  assert.throws(() => importState('não é json'));
});
