/**
 * runner.js — Conduz uma sessão de qualquer app:
 *   configuração → perguntas (com cronômetro) → resumo.
 *
 * Cada app só precisa saber desenhar UMA pergunta (app.render) e avisar
 * se o usuário acertou (ui.done). Cronômetro, repetição espaçada,
 * estatísticas, feedback e resumo ficam aqui.
 */
import { add, h, topBar } from './dom.js';
import { playEvents, playNote, stopAudio, unlockAudio } from './audio.js';
import { sessionSetup } from './components/sessionSetup.js';
import { createSession } from '../core/session.js';
import { recordAnswer, setRecord, streak } from '../core/progress.js';
import { LEVELS, themeName } from '../questions/index.js';

const fmtTime = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

export function runApp(root, app, { state, save }, query = {}) {
  let timer = null;
  let finished = false;
  const settings = state.settings;

  function cleanup() {
    finished = true; // impede avanços automáticos pendentes depois de sair
    clearInterval(timer);
    stopAudio();
  }

  function showSetup() {
    cleanup();
    root.replaceChildren(sessionSetup({
      app,
      state,
      query,
      onStart: start,
      onEnableSound: () => { settings.sound = true; save(); showSetup(); },
    }));
  }

  function start(config) {
    unlockAudio(); // o toque em "Começar" libera o áudio no celular
    state.lastSetup[app.id] = config;
    save();
    finished = false;

    const ctx = {
      rng: Math.random,
      notation: settings.notation,
      fsharp: settings.fsharp,
      key: config.key && config.key !== 'random' ? config.key : null,
      level: config.level,
    };
    let session;
    try {
      session = createSession({ generators: app.generators(config), ctx, srs: state.srs });
    } catch (err) {
      root.replaceChildren(topBar(app.title), h('div', { class: 'card' }, h('p', {}, err.message), h('a', { class: 'btn', href: '#/' }, 'Voltar')));
      return;
    }

    const total = app.fixedSeconds ?? config.minutes * 60;
    let remaining = total;
    let timeUp = false;
    const timerEl = h('span', { class: 'timer' }, fmtTime(remaining));
    const scoreEl = h('span', {}, '0/0');
    const bar = h('div', { style: { width: '100%' } });
    const body = h('div', {});
    root.replaceChildren(
      topBar(app.title, { right: h('div', { class: 'topbar-right' }, timerEl, ' · ', scoreEl) }),
      h('div', { class: 'progress-bar' }, bar),
      body,
    );

    const updateScore = () => { scoreEl.textContent = `${session.correctCount}/${session.count}`; };

    timer = setInterval(() => {
      remaining = Math.max(0, remaining - 1);
      timerEl.textContent = fmtTime(remaining);
      timerEl.classList.toggle('low', remaining <= 10);
      bar.style.width = `${(remaining / total) * 100}%`;
      if (remaining === 0) {
        timeUp = true;
        clearInterval(timer);
        // Rodadas cronometradas acabam na hora; sessões longas terminam a pergunta atual.
        if (app.fixedSeconds) finish(session, config);
      }
    }, 1000);

    function next() {
      if (finished) return;
      if (timeUp) return finish(session, config);
      stopAudio();
      const q = session.next();
      const t0 = Date.now();
      let answered = false;

      const ui = {
        body,
        notation: settings.notation,
        sound: settings.sound,
        /** Toca o áudio da pergunta: 'all' (contexto + alvo), 'intro' ou 'target'. */
        play(part = 'all') {
          if (!q.audio) return Promise.resolve();
          const events = part === 'all' ? [...q.audio.intro, ...q.audio.target] : q.audio[part];
          return playEvents(events);
        },
        playNote: (m) => settings.sound && playNote(m),
        /** O app avisa o resultado. feedback=false pula a caixa de resposta. */
        done(correct, { feedback = true, auto = false } = {}) {
          if (answered || finished) return;
          answered = true;
          session.answer(q, correct);
          recordAnswer(state, q, correct, { app: app.id, ms: Date.now() - t0 });
          save();
          updateScore();
          if (!feedback) return next();
          add(body, feedbackBox(q, correct, ui, app));
          if (auto) setTimeout(next, correct ? 450 : 1500);
          else add(body, h('button', { class: 'btn primary block', style: { marginTop: '14px' }, onclick: next }, timeUp ? 'Ver resultado' : 'Próxima →'));
        },
      };

      const level = LEVELS.find((l) => l.id === q.level)?.name;
      body.replaceChildren(
        h('div', { class: 'prompt-meta' }, `${themeName(q.theme)} · ${level}`),
        h('div', { class: 'prompt' }, app.promptOf ? app.promptOf(q) : q.prompt),
      );
      app.render(q, ui);
    }

    next();
  }

  function feedbackBox(q, correct, ui, app) {
    const canPlay = q.audio && ui.sound && app.replayInFeedback !== false;
    return h('div', { class: `feedback ${correct ? 'right' : 'wrong'}` },
      h('div', { class: 'title' }, correct ? '✓ Certo!' : `✗ Resposta: ${q.answer}`),
      correct && app.showAnswerOnRight ? h('div', {}, q.answer) : null,
      q.explanation ? h('div', { class: 'explanation' }, q.explanation) : null,
      canPlay ? h('button', { class: 'btn small', style: { marginTop: '10px' }, onclick: () => ui.play() }, '▶ Ouvir') : null);
  }

  function finish(session, config) {
    if (finished) return;
    cleanup();
    const n = session.count;
    const right = session.correctCount;
    const record = app.fixedSeconds ? setRecord(state, `${app.id}:${config.level}`, right) : false;
    save();
    const best = state.stats.records[`${app.id}:${config.level}`];

    // Erros únicos, para revisar com calma.
    const seen = new Set();
    const mistakes = session.log.filter((x) => !x.correct && !seen.has(x.q.itemKey) && seen.add(x.q.itemKey));

    root.replaceChildren();
    add(root,
      topBar('Resultado'),
      h('div', { class: 'card' },
        h('div', { class: 'summary-score' }, `${right}/${n}`),
        h('p', { class: 'center muted' }, n ? `${Math.round((right / n) * 100)}% de acerto` : 'Nenhuma resposta'),
        app.fixedSeconds ? h('p', { class: 'center' }, record ? '🏆 Novo recorde!' : `Recorde: ${best ?? 0}`) : null,
        h('p', { class: 'center small muted' }, `🔥 ${streak(state.days)} dia(s) seguidos`)),
      mistakes.length
        ? [h('h2', {}, 'Para revisar'), h('div', { class: 'mistakes' }, mistakes.map((x) => h('div', { class: 'mistake' }, h('b', {}, x.q.prompt), x.q.answer)))]
        : null,
      h('div', { class: 'btn-row', style: { marginTop: '20px' } },
        h('button', { class: 'btn primary', onclick: () => start(config) }, 'De novo'),
        h('button', { class: 'btn', onclick: showSetup }, 'Ajustes')),
      h('a', { class: 'btn block', href: '#/', style: { marginTop: '10px' } }, 'Menu'),
    );
  }

  showSetup();
  return cleanup;
}
