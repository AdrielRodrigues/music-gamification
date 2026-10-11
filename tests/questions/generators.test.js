/**
 * Testes de propriedade: cada gerador, com centenas de sementes, precisa
 * produzir perguntas válidas, alternativas sem duplicatas que contêm a
 * resposta, e respostas coerentes com a teoria.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GENERATORS, getGenerator, selectGenerators } from '../../src/questions/index.js';
import { seeded } from '../../src/core/rng.js';
import { createSession } from '../../src/core/session.js';
import { APPS } from '../../src/apps/registry.js';
import {
  between, detectKey, fretPc, harmonicField, intervalId, keyFromId, keyScale, majorKeyIds, minorKeyIds, MINOR_TENDENCIES,
  parseChord, parseNote, pitchClass, relativeKey, spellKey, toRomans,
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

// ---------- tom fixo maior e menor ----------

test('Cartas e Relâmpago: com tom fixo, toda pergunta com tom sai nesse tom', () => {
  for (const id of ['cartas', 'relampago']) {
    const app = APPS.find((a) => a.id === id);
    for (const key of [...minorKeyIds(), 'C', 'Bb', 'F#']) {
      for (const level of [1, 2, 3]) {
        const ctx = { rng: seeded(level), level, notation: 'latin', fsharp: 'F#', key };
        const s = createSession({ generators: app.generators({ themes: app.setup.themes, level, key }), ctx });
        for (let i = 0; i < 300; i++) {
          const q = s.next();
          if (q.keyId) assert.equal(q.keyId, key, `${id} N${level}: ${q.gen} → ${q.prompt}`);
        }
      }
    }
  }
});

test('tendência em tom menor: usa a tabela do menor, sem o 2º grau', () => {
  for (const key of minorKeyIds()) {
    for (let seed = 1; seed <= 40; seed++) {
      const q = getGenerator('ouvido.tendencia').make({ rng: seeded(seed), level: 1, notation: 'latin', fsharp: 'F#', key });
      const t = MINOR_TENDENCIES[q.params.degree];
      assert.ok(t, `grau ${q.params.degree} em ${key}`);
      assert.equal(q.answer, `${t.to}º grau`);
      assert.match(q.prompt, /escala menor/);
    }
  }
  // Sensível de Lá menor = Sol♯.
  const q = getGenerator('ouvido.tendencia').make({ rng: seeded(1), notation: 'anglo', fsharp: 'F#', key: 'Am' }, { key: 'Am', degree: 7 });
  assert.match(q.explanation, /G♯ → A/);
});

test('tétrades do campo menor: V7 da menor harmônica', () => {
  const ctx = { rng: seeded(1), level: 2, notation: 'anglo', fsharp: 'F#', key: 'Am' };
  const answers = [1, 2, 3, 4, 5, 6, 7].map((degree) => getGenerator('acordes.tetradeNoTom').make(ctx, { key: 'Am', degree }).answer);
  assert.deepEqual(answers, ['Am7', 'Bm7(♭5)', 'Cmaj7', 'Dm7', 'E7', 'Fmaj7', 'G7']);
});

test('dominante secundário só entra com tom fixo maior (ou sem tom fixo)', () => {
  const has = (key) => selectGenerators({ key }).some((g) => g.id === 'acordes.domSecundario');
  assert.equal(has('Am'), false);
  assert.equal(has('C'), true);
  assert.equal(has('random'), true);
  assert.equal(has(undefined), true);
});

// ---------- enarmonia F♯/G♭ e explicações ----------

test('grafia do tom de 6 acidentes conforme a preferência', () => {
  assert.equal(spellKey('F#', 'Gb'), 'Gb');
  assert.equal(spellKey('Gb', 'F#'), 'F#');
  assert.equal(spellKey('D#m', 'Gb'), 'Ebm');
  assert.equal(spellKey('Ebm'), 'D#m');
  assert.equal(spellKey('Db', 'Gb'), 'Db');
});

test('transposição nunca vai para o mesmo tom escrito de outro jeito', () => {
  const cases = [
    { key: 'F#', fsharp: 'Gb' }, { key: 'Gb', fsharp: 'F#' },
    { key: 'D#m', fsharp: 'Gb' }, { key: 'Ebm', fsharp: 'F#' },
  ];
  for (const { key, fsharp } of cases) {
    for (let seed = 1; seed <= 200; seed++) {
      const q = getGenerator('prog.transpor').make({ rng: seeded(seed), level: 3, notation: 'anglo', fsharp, key });
      const from = keyFromId(q.params.from);
      const to = keyFromId(q.params.key);
      assert.notEqual(pitchClass(from.tonic), pitchClass(to.tonic), q.prompt);
    }
  }
});

test('vizinho: a dica "não há tecla preta" só aparece quando o semitom atravessa Mi–Fá ou Si–Dó', () => {
  const tip = /não há tecla preta/;
  const ctx = { rng: seeded(1), level: 1, notation: 'latin', fsharp: 'F#', key: null };
  for (const root of ['C', 'D', 'E', 'F', 'G', 'A', 'B']) {
    for (const dir of ['up', 'down']) {
      for (const size of ['st', 'T']) {
        const q = getGenerator('notas.vizinho').make(ctx, { root, size, dir });
        const expected = size === 'st' && (dir === 'up' ? ['E', 'B'] : ['F', 'C']).includes(root);
        assert.equal(tip.test(q.explanation), expected, `${root} ${size} ${dir}: ${q.explanation}`);
        // Quando a dica aparece, a resposta é uma nota natural (tecla branca).
        if (expected) assert.doesNotMatch(q.answer, /[♯♭]/);
      }
    }
  }
});

test('tensão em tom menor: o V é maior (da harmônica), como na cadência', () => {
  for (const key of minorKeyIds()) {
    const ctx = { rng: seeded(1), level: 1, notation: 'anglo', fsharp: 'F#', key };
    const q = getGenerator('ouvido.tensao').make(ctx, { key, degree: 5 });
    const k = keyFromId(key);
    const v = harmonicField(k, { harmonicV: true })[4].chord;
    assert.equal(v.type, 'maj', key);
    assert.match(q.prompt, /\(V\)/, q.prompt);
    assert.equal(q.answer, 'Tensão');
    // O acorde tocado é o mesmo V da cadência de introdução.
    assert.deepEqual(q.audio.target[0].m, q.audio.intro[2].m, key);
  }
  const am = getGenerator('ouvido.tensao').make({ rng: seeded(1), notation: 'anglo', fsharp: 'F#', key: 'Am' }, { key: 'Am', degree: 5 });
  assert.match(am.prompt, /acorde E \(V\)/);
});
