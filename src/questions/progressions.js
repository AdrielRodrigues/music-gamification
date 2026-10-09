/**
 * Tema 3 — Progressões, transposição, graus romanos e descobrir o tom.
 */
import {
  detectKey, getProgression, harmonicField, keyFromId, majorKeyIds, minorKeyIds, pitchClass,
  PROGRESSIONS, progressionName, realize, relativeKey, secondaryDominant, toRomans, transpose,
  transposeChords,
} from '../theory/index.js';
import { pick, randInt, sample, shuffle } from '../core/rng.js';
import { choicesFrom, defineGenerator, fmt, pickKey, pickOtherKey, retry } from './common.js';
import { chordEvent } from './audioEvents.js';

const THEME = 'progressoes';

/** Nível de cada progressão do catálogo. */
const PROG_LEVEL = {
  pop: 1, doowop: 1, rock: 1, cadencia: 1,
  sensivel: 2, turnaround: 2, 'cinco-um': 2, 'menor-pop': 2, 'menor-cadencia': 2,
  andaluza: 3,
};

/** Sorteia progressão + tom compatível (respeita o tom fixo da sessão). */
function pickProgKey(ctx) {
  let progs = PROGRESSIONS.filter((p) => PROG_LEVEL[p.id] <= (ctx.level || 1));
  if (ctx.key) {
    const same = progs.filter((p) => p.mode === keyFromId(ctx.key).mode);
    if (same.length) progs = same;
  }
  const prog = pick(ctx.rng, progs);
  return { prog: prog.id, key: pickKey(ctx, [prog.mode]) };
}

/** Campo usado pela progressão (com tétrades / V maior, se ela pedir). */
const fieldFor = (prog, k) => harmonicField(k, { sevenths: !!prog.sevenths, harmonicV: !!prog.harmonicV });

/** Tons vizinhos (5ª acima/abaixo, 2ª acima/abaixo) com grafia usual. */
function nearKeys(ctx, id) {
  const k = keyFromId(id);
  const ids = k.mode === 'major' ? majorKeyIds(ctx.fsharp) : minorKeyIds(ctx.fsharp);
  return ['5J', '4J', '2M', '7m']
    .map((iv) => pitchClass(transpose(k.tonic, iv)))
    .map((pc) => ids.find((x) => pitchClass(keyFromId(x).tonic) === pc));
}

export const realizeProgression = defineGenerator({
  id: 'prog.realizar', theme: THEME, level: 1, mc: true,
  params: pickProgKey,
  build({ prog: pid, key: id }, ctx) {
    const f = fmt(ctx);
    const prog = getProgression(pid);
    const k = keyFromId(id);
    const answer = f.chords(realize(prog, k));
    return {
      prompt: `${progressionName(prog)} em ${f.K(k)}: quais acordes?`,
      answer,
      explanation: `${prog.hint}. Campo de ${f.K(k)}: ${fieldFor(prog, k).map((d) => `${d.roman} ${f.C(d.chord)}`).join(' · ')}`,
      choices: choicesFrom(ctx.rng, answer, nearKeys(ctx, id).map((x) => f.chords(realize(prog, keyFromId(x))))),
    };
  },
});

export const chordsToRomans = defineGenerator({
  id: 'prog.graus', theme: THEME, level: 1, mc: true,
  params: pickProgKey,
  build({ prog: pid, key: id }, ctx) {
    const f = fmt(ctx);
    const prog = getProgression(pid);
    const k = keyFromId(id);
    const chords = realize(prog, k);
    const romans = toRomans(chords, k);
    const answer = romans.join('–');
    // Distratores: outras progressões do mesmo modo e permutações da resposta.
    const pool = [
      ...PROGRESSIONS.filter((p) => p.mode === prog.mode && p.id !== pid).map(progressionName),
      ...[1, 2, 3].map(() => shuffle(ctx.rng, romans).join('–')),
    ];
    return {
      prompt: `Em ${f.K(k)}: ${f.chords(chords)}. Quais são os graus?`,
      answer,
      explanation: `Campo de ${f.K(k)}: ${fieldFor(prog, k).map((d) => `${d.roman} ${f.C(d.chord)}`).join(' · ')}`,
      choices: choicesFrom(ctx.rng, answer, pool),
      data: {
        sequence: {
          given: chords.map(f.C),
          answer: romans,
          options: fieldFor(prog, k).map((d) => d.roman),
        },
      },
    };
  },
});

export const transposeProgression = defineGenerator({
  id: 'prog.transpor', theme: THEME, level: 1, mc: true,
  params(ctx) {
    const { prog, key } = pickProgKey(ctx);
    // Com tom fixo (ex.: Tom da Semana), transpõe PARA ele: é o tom que se quer fixar.
    return ctx.key ? { prog, from: pickOtherKey(ctx, key), key } : { prog, from: key, key: pickOtherKey(ctx, key) };
  },
  build({ prog: pid, from, key: to }, ctx) {
    const f = fmt(ctx);
    const prog = getProgression(pid);
    const kFrom = keyFromId(from);
    const kTo = keyFromId(to);
    const source = realize(prog, kFrom);
    const target = transposeChords(source, kFrom, kTo);
    const answer = f.chords(target);
    return {
      prompt: `Transponha de ${f.K(kFrom)} para ${f.K(kTo)}: ${f.chords(source)}`,
      answer,
      explanation: `Pense em graus: ${progressionName(prog)}. Em ${f.K(kTo)}, os mesmos graus dão ${answer}.`,
      choices: choicesFrom(ctx.rng, answer, nearKeys(ctx, to).filter((x) => x !== from).map((x) => f.chords(realize(prog, keyFromId(x))))),
      data: {
        sequence: {
          given: source.map(f.C),
          answer: target.map(f.C),
          options: fieldFor(prog, kTo).map((d) => f.C(d.chord)),
        },
      },
    };
  },
});

/** Assinatura de um tom independente da grafia (F♯ maior = G♭ maior). */
const keySig = (k) => `${pitchClass(k.tonic)}${k.mode}`;

/** Assinaturas dos tons em que TODOS os acordes cabem, ordenadas. */
function fittingKeys(chords) {
  return detectKey(chords).filter((c) => c.fit === chords.length).map((c) => keySig(c.key)).sort();
}

/**
 * Sorteia graus que identificam o tom sem ambiguidade (fora a relativa):
 * maior → I, IV e V presentes; menor → i, iv e V maior (da harmônica).
 */
function detectionDegrees(ctx, mode) {
  const extra = randInt(ctx.rng, 0, (ctx.level || 1) >= 2 ? 2 : 1);
  const optional = mode === 'major' ? [2, 3, 6] : [3, 6, 7];
  return shuffle(ctx.rng, [1, 4, 5, ...sample(ctx.rng, optional, extra)]);
}

function detectionChords(id, degrees) {
  const k = keyFromId(id);
  const field = harmonicField(k, { harmonicV: k.mode === 'minor' });
  return degrees.map((d) => field[d - 1].chord);
}

export const findKey = defineGenerator({
  id: 'prog.tom', theme: THEME, level: 1, mc: true, randomKeyOnly: true,
  params(ctx) {
    const key = pickKey(ctx, (ctx.level || 1) >= 2 ? ['major', 'minor'] : ['major']);
    const k = keyFromId(key);
    const expected = (k.mode === 'major' ? [k, relativeKey(k)] : [k]).map(keySig).sort();
    return retry(
      () => ({ key, degrees: detectionDegrees(ctx, k.mode) }),
      (p) => fittingKeys(detectionChords(key, p.degrees)).join() === expected.join(),
    );
  },
  build({ key: id, degrees }, ctx) {
    const f = fmt(ctx);
    const k = keyFromId(id);
    const rel = relativeKey(k);
    const chords = detectionChords(id, degrees);
    const field = harmonicField(k, { harmonicV: k.mode === 'minor' });
    const near = nearKeys(ctx, id).slice(0, 3).map((x) => f.K(keyFromId(x)));
    // No maior, a relativa não entra nas alternativas (seria resposta certa também).
    const pool = k.mode === 'major' ? near : [f.K(rel), ...near];
    const explanation = k.mode === 'major'
      ? `I, IV e V de ${f.K(k)}: ${f.C(field[0].chord)}, ${f.C(field[3].chord)}, ${f.C(field[4].chord)}. A relativa ${f.K(rel)} usa os mesmos acordes; quem decide é o acorde que soa como repouso.`
      : `${f.C(field[4].chord)} é o V maior (da menor harmônica) e denuncia ${f.K(k)}. Sem ele, seria a relativa ${f.K(rel)}.`;
    return {
      prompt: `Qual é o tom de ${chords.map(f.C).join(', ')}?`,
      answer: f.K(k),
      explanation,
      choices: choicesFrom(ctx.rng, f.K(k), pool),
      data: { chords: chords.map(f.C) },
      audio: { intro: [], target: chords.map((c) => chordEvent(c, 0.9)) },
    };
  },
});

export const findKeySecondary = defineGenerator({
  id: 'prog.tomSecundario', theme: THEME, level: 3, mc: true, randomKeyOnly: true,
  params(ctx) {
    const key = pickKey(ctx, ['major']);
    return retry(
      () => {
        const target = pick(ctx.rng, [2, 5, 6]);
        const others = sample(ctx.rng, [4, 5, 6, 2].filter((d) => d !== target), 2);
        return { key, target, degrees: [1, ...others, target] };
      },
      (p) => {
        const chords = secondaryChords(p.key, p.degrees, p.target);
        const ranked = detectKey(chords);
        const best = ranked[0].fit;
        const k = keyFromId(key);
        const ok = new Set([keySig(k), keySig(relativeKey(k))]);
        return ranked.filter((c) => c.fit === best).every((c) => ok.has(keySig(c.key)));
      },
    );
  },
  build({ key: id, target, degrees }, ctx) {
    const f = fmt(ctx);
    const k = keyFromId(id);
    const field = harmonicField(k);
    const chords = secondaryChords(id, degrees, target);
    const sec = secondaryDominant(k, target);
    return {
      prompt: `Qual é o tom de ${chords.map(f.C).join(', ')}?`,
      answer: f.K(k),
      explanation: `${f.C(sec)} não pertence a ${f.K(k)}: é o V7/${field[target - 1].roman} (dominante secundário), que prepara ${f.C(field[target - 1].chord)}.`,
      choices: choicesFrom(ctx.rng, f.K(k), nearKeys(ctx, id).map((x) => f.K(keyFromId(x)))),
      data: { chords: chords.map(f.C) },
      audio: { intro: [], target: chords.map((c) => chordEvent(c, 0.9)) },
    };
  },
});

/** Acordes dos graus, com o V7/alvo inserido logo antes do alvo. */
function secondaryChords(id, degrees, target) {
  const k = keyFromId(id);
  const field = harmonicField(k);
  const out = [];
  for (const d of degrees) {
    if (d === target) out.push(secondaryDominant(k, target));
    out.push(field[d - 1].chord);
  }
  return out;
}

export const PROGRESSION_GENERATORS = [realizeProgression, chordsToRomans, transposeProgression, findKey, findKeySecondary];
