/** Cartas — flashcards: pensa, revela, se avalia. */
import { add, h } from '../ui/dom.js';
import { selectGenerators, THEMES } from '../questions/index.js';

export default {
  id: 'cartas',
  title: 'Cartas',
  icon: '🃏',
  tagline: 'Pense, revele, avalie-se',
  skill: 'Recordar',
  contexts: ['fila', 'espera'],
  description: 'Flashcards de todos os temas. Pense na resposta, toque para revelar e diga se acertou.',
  why: 'Tirar a resposta da memória antes de vê-la fixa muito mais do que reler. O que você erra volta com mais frequência (repetição espaçada).',
  setup: { themes: THEMES.map((t) => t.id), key: true },
  generators: (c) => selectGenerators({ themes: c.themes, level: c.level, audio: false, fixedKey: c.key !== 'random' }),

  render(q, ui) {
    const reveal = h('button', { class: 'btn primary block', style: { marginTop: '24px' }, onclick: show }, 'Mostrar resposta');
    add(ui.body, h('p', { class: 'muted small', style: { marginTop: '12px' } }, 'Responda de cabeça (ou em voz baixa) antes de revelar.'), reveal);

    function show() {
      reveal.remove();
      const canPlay = q.audio && ui.sound;
      add(ui.body,
        h('div', { class: 'answer-box' },
          h('div', { class: 'answer' }, q.answer),
          q.explanation ? h('div', { class: 'explanation' }, q.explanation) : null,
          canPlay ? h('button', { class: 'btn small', style: { marginTop: '10px' }, onclick: () => ui.play() }, '▶ Ouvir') : null),
        h('div', { class: 'btn-row', style: { marginTop: '14px' } },
          h('button', { class: 'btn bad', onclick: () => ui.done(false, { feedback: false }) }, '✗ Errei'),
          h('button', { class: 'btn ok', onclick: () => ui.done(true, { feedback: false }) }, '✓ Acertei')));
      // No treino auditivo, ouvir logo depois de pensar é a conferência.
      if (canPlay && q.theme === 'ouvido') ui.play();
    }
  },
};
