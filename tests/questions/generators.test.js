/**
 * Testes de propriedade: cada gerador, com centenas de sementes, precisa
 * produzir perguntas válidas, alternativas sem duplicatas que contêm a
 * resposta, e respostas coerentes com a teoria.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GENERATORS, getGenerator, selectGenerators } from '../../src/questions/index.js';
import { seeded } from '../../src/core/rng.js';
import {
  between, detectKey, fretPc, intervalId, keyFromId, keyScale, majorKeyIds, parseChord,
  parseNote, pitchClass, relativeKey, toRomans,
} from '../../src/theory/index.js';

const SEEDS = 300;
const KEYS = [null, 'C', 'D', 'Bb', 'F#', 'Am', 'Ebm'];

function* cases(gen) {
  for (let seed = 1; seed <= SEEDS; seed++) {
    const rng = seeded(seed);
    const level = Math.max(gen.level, 1 + (seed % 3));
    const ctx = {
      rng,
      level,
      notation: seed % 2 ? 'latin' : 'anglo',
      fsharp: seed % 5 ? 'F#' : 'Gb',
      key: KEYS[seed % KEYS.length],
    };
    yield { ctx, q: gen.make(ctx), seed };
  }
}

for (const gen of GENERATORS) {
  test(`gerador ${gen.id}: perguntas válidas`, () => {
    for (const { ctx, q, seed } of cases(gen)) {
      const where = `${gen.id} seed=${seed}`;
      assert.equal(typeof q.prompt, 'string', where);
      assert.ok(q.prompt.length > 0, where);
      assert.ok(typeof q.answer === 'string' && q.answer.length > 0, where);
      assert.ok(!/undefined|NaN|null/.test(q.prompt + q.answer + (q.explanation || '')), `${where}: ${q.prompt} → ${q.answer}`);
      assert.equal(q.theme, gen.theme);
      assert.ok(q.itemKey.startsWith(gen.id), where);
      if (gen.mc) {
        assert.ok(Array.isArray(q.choices) && q.choices.length >= 2, where);
        assert.ok(q.choices.includes(q.answer), `${where}: ${q.answer} ∉ ${q.choices}`);
        assert.equal(new Set(q.choices).size, q.choices.length, `${where}: duplicadas ${q.choices}`);
      }
      // Recriar com os mesmos parâmetros dá a mesma pergunta (é o que a repetição espaçada faz).
      const again = gen.make({ ...ctx, rng: seeded(seed + 1000) }, q.params);
      assert.equal(again.prompt, q.prompt, where);
      assert.equal(again.answer, q.answer, where);
      assert.equal(again.itemKey, q.itemKey, where);
      // Parâmetros precisam sobreviver ao JSON (são salvos no localStorage).
      assert.deepEqual(JSON.parse(JSON.stringify(q.params)), q.params, where);
      if (q.audio) {
        for (const ev of [...q.audio.intro, ...q.audio.target]) {
          assert.ok(ev.d > 0, where);
          for (const m of ev.m) assert.ok(Number.isInteger(m) && m >= 28 && m <= 96, `${where}: midi ${m}`);
        }
      }
    }
  });
}

test('intervalo acima: a resposta forma exatamente o intervalo pedido', () => {
  for (const { q } of cases(getGenerator('notas.intervaloAcima'))) {
    const ans = parseNote(q.answer);
    assert.equal(intervalId(between(parseNote(q.params.root), ans)), q.params.iv, q.prompt);
  }
});

test('grau da escala: resposta pertence à escala com a grafia do tom', () => {
  for (const { q } of cases(getGenerator('notas.grauEscala'))) {
    const scale = keyScale(keyFromId(q.params.key));
    const ans = parseNote(q.answer);
    assert.deepEqual(scale[q.params.degree - 1], ans, q.prompt);
  }
});

test('campo: o acorde respondido está no campo do tom', () => {
  for (const { q } of cases(getGenerator('campo.grauAcorde'))) {
    const ch = parseChord(q.answer);
    const scale = keyScale(keyFromId(q.params.key));
    assert.ok(scale.some((n) => n.letter === ch.root.letter && n.acc === ch.root.acc), q.prompt);
  }
});

test('transposição preserva os graus', () => {
  for (const { q } of cases(getGenerator('prog.transpor'))) {
    const from = keyFromId(q.params.from);
    const to = keyFromId(q.params.key);
    const given = q.data.sequence.given.map(parseChord);
    const answer = q.data.sequence.answer.map(parseChord);
    assert.deepEqual(toRomans(answer, to), toRomans(given, from), q.prompt);
    // a resposta só usa acordes oferecidos como opção
    for (const c of q.data.sequence.answer) assert.ok(q.data.sequence.options.includes(c), q.prompt);
  }
});

test('descobrir o tom: só o tom da resposta (e sua relativa, no maior) contém todos os acordes', () => {
  for (const { q } of cases(getGenerator('prog.tom'))) {
    const chords = q.prompt.replace(/^Qual é o tom de /, '').replace(/\?$/, '').split(', ').map(parseChord);
    const k = keyFromId(q.params.key);
    // compara pela altura da tônica: F♯ maior e G♭ maior são o mesmo tom
    const sig = (x) => `${pitchClass(x.tonic)}${x.mode}`;
    const fits = detectKey(chords).filter((c) => c.fit === chords.length).map((c) => sig(c.key)).sort();
    const expected = (k.mode === 'major' ? [k, relativeKey(k)] : [k]).map(sig).sort();
    assert.deepEqual(fits, expected, q.prompt);
  }
});

test('braço: a resposta da casa tem a altura certa', () => {
  for (const { q } of cases(getGenerator('inst.casa'))) {
    const first = parseNote(q.answer.split(' / ')[0]);
    assert.equal(pitchClass(first), fretPc(q.params.string, q.params.fret), q.prompt);
  }
});

test('seleção de geradores', () => {
  assert.ok(selectGenerators({ themes: ['campo'] }).every((g) => g.theme === 'campo'));
  assert.ok(selectGenerators({ level: 1 }).every((g) => g.level === 1));
  assert.ok(selectGenerators({ audio: false }).every((g) => !g.audioOnly));
  assert.ok(selectGenerators({ audio: 'only' }).length >= 4);
  assert.ok(selectGenerators({ mc: true }).every((g) => g.mc));
  // há geradores de nível básico em todos os temas
  for (const t of ['notas', 'campo', 'progressoes', 'instrumento', 'acordes', 'ouvido']) {
    assert.ok(selectGenerators({ themes: [t], level: 1, audio: false }).length > 0, t);
  }
});

test('tom fixo da sessão é respeitado', () => {
  for (const id of majorKeyIds()) {
    const q = getGenerator('campo.grauAcorde').make({ rng: seeded(1), level: 1, notation: 'anglo', fsharp: 'F#', key: id });
    assert.equal(q.keyId, id);
  }
});
