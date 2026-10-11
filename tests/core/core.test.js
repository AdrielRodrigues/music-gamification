import { test } from 'node:test';
import assert from 'node:assert/strict';
import { seeded, shuffleBag } from '../../src/core/rng.js';
import { createSession } from '../../src/core/session.js';
import { dayKey, lastDays, rate, recordAnswer, setRecord, streak } from '../../src/core/progress.js';
import { completeWeek, evaluateWeek, nextKey, startWeek } from '../../src/core/weekKey.js';
import {
  defaultState, exportState, importState, loadState, saveState, STORAGE_KEY,
} from '../../src/core/storage.js';
import { getGenerator, selectGenerators } from '../../src/questions/index.js';

const ctxOf = (seed, extra = {}) => ({ rng: seeded(seed), level: 1, notation: 'latin', fsharp: 'F#', key: null, ...extra });

// ---------- baralho ----------

test('baralho: cada item sai uma vez por rodada e nunca duas vezes seguidas', () => {
  const items = ['a', 'b', 'c', 'd', 'e'];
  const draw = shuffleBag(seeded(5), items);
  const seq = Array.from({ length: items.length * 40 }, draw);
  for (let r = 0; r < 40; r++) {
    assert.deepEqual([...seq.slice(r * items.length, (r + 1) * items.length)].sort(), items);
  }
  for (let i = 1; i < seq.length; i++) assert.notEqual(seq[i], seq[i - 1], `repetiu na posição ${i}`);
  assert.equal(shuffleBag(seeded(1), ['só'])(), 'só');
});

// ---------- sessão ----------

/** Conta quantas vezes cada valor aparece. */
const countBy = (list, f) => list.reduce((m, x) => ({ ...m, [f(x)]: (m[f(x)] ?? 0) + 1 }), {});
const spread = (counts) => Math.max(...Object.values(counts)) - Math.min(...Object.values(counts));

test('sessão: temas com quantidades diferentes de tipos recebem a mesma fatia', () => {
  const gens = selectGenerators({ themes: ['notas', 'campo'], level: 1 });
  const s = createSession({ generators: gens, ctx: ctxOf(42) });
  const qs = Array.from({ length: 200 }, () => s.next());
  const byTheme = countBy(qs, (q) => q.theme);
  assert.ok(spread(byTheme) <= 1, JSON.stringify(byTheme));
  // Dentro de cada tema, todos os tipos aparecem e quase na mesma quantidade.
  for (const theme of ['notas', 'campo']) {
    const byGen = countBy(qs.filter((q) => q.theme === theme), (q) => q.gen);
    assert.equal(Object.keys(byGen).length, gens.filter((g) => g.theme === theme).length, theme);
    assert.ok(spread(byGen) <= 1, `${theme}: ${JSON.stringify(byGen)}`);
  }
});

test('sessão: acertar ou errar não muda a ordem', () => {
  const gens = selectGenerators({ themes: ['campo'], level: 1 });
  const run = (correct) => {
    const s = createSession({ generators: gens, ctx: ctxOf(9) });
    return Array.from({ length: 40 }, () => {
      const q = s.next();
      s.answer(q, correct);
      return q.itemKey;
    });
  };
  assert.deepEqual(run(true), run(false));
});

test('sessão: não repete pergunta quando há combinações de sobra', () => {
  // campo.grauAcorde no básico: 10 tons × 7 graus = 70 perguntas possíveis.
  for (let seed = 1; seed <= 20; seed++) {
    const s = createSession({ generators: [getGenerator('campo.grauAcorde')], ctx: ctxOf(seed) });
    const keys = Array.from({ length: 30 }, () => s.next().itemKey);
    assert.equal(new Set(keys).size, 30, `semente ${seed}`);
  }
});

test('sessão: respeita o tom fixo e segue funcionando quando as combinações acabam', () => {
  // Em Mi♭ há só 7 perguntas (uma por grau): depois delas, repete.
  const s = createSession({ generators: [getGenerator('campo.grauAcorde')], ctx: ctxOf(3, { key: 'Eb' }) });
  const qs = Array.from({ length: 30 }, () => s.next());
  assert.ok(qs.every((q) => q.keyId === 'Eb'));
  assert.equal(new Set(qs.map((q) => q.itemKey)).size, 7);
});

test('sessão: placar e registro', () => {
  const s = createSession({ generators: selectGenerators({ themes: ['notas'], level: 1 }), ctx: ctxOf(1) });
  s.answer(s.next(), true);
  s.answer(s.next(), false);
  assert.equal(s.count, 2);
  assert.equal(s.correctCount, 1);
  assert.deepEqual(s.log.map((x) => x.correct), [true, false]);
});

test('sessão: sem geradores dá erro claro', () => {
  assert.throws(() => createSession({ generators: [], ctx: ctxOf(1) }), /Nenhum gerador/);
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

test('Tom da Semana usa a grafia preferida para F♯/G♭', () => {
  assert.equal(nextKey('Db'), 'F#');
  assert.equal(nextKey('Db', 'Gb'), 'Gb');
  const st = defaultState();
  st.settings.fsharp = 'Gb';
  startWeek(st, 'Db', 0);
  completeWeek(st, 1);
  assert.equal(st.weekKey.key, 'Gb');
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
  assert.equal(saveState(st, mem), true);
  const back = loadState(mem);
  assert.equal(back.settings.notation, 'anglo');
  assert.equal(back.settings.sound, true); // padrão preservado
});

test('progresso antigo com repetição espaçada (srs) carrega sem ela', () => {
  const mem = fakeStorage();
  mem.data[STORAGE_KEY] = JSON.stringify({ ...defaultState(), srs: { 'campo.grauAcorde|{}': { box: 3 } } });
  const back = loadState(mem);
  assert.equal('srs' in back, false);
  assert.equal('srs' in importState(JSON.stringify({ srs: {} })), false);
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
