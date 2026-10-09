/** Solfejo — veja os graus, cante de cabeça, depois ouça e confira. */
import { add, h } from '../ui/dom.js';
import { selectGenerators } from '../questions/index.js';

export default {
  id: 'solfejo',
  title: 'Solfejo',
  icon: '🎙️',
  tagline: 'Cante os graus de cabeça',
  skill: 'Audiação',
  contexts: ['fone', 'fila'],
  description: 'Aparece uma sequência de graus (ex.: 1 – 3 – 5 – 3 – 1). Cante mentalmente a partir da tônica e depois ouça para conferir.',
  why: 'Ouvir a música "por dentro" antes de tocar (audiação) é o que permite tirar uma melodia de ouvido. Funciona em silêncio; o som só confere.',
  setup: { key: true },
  generators: (c) => selectGenerators({ ids: ['ouvido.solfejo', 'ouvido.tonicaQuinta'], level: c.level }),

  render(q, ui) {
    const reveal = h('button', { class: 'btn primary block', style: { marginTop: '16px' }, onclick: show }, 'Já cantei: conferir');
    add(ui.body,
      h('div', { class: 'big-degrees' }, q.data.solfege.degrees.join(' ')),
      ui.sound
        ? h('button', { class: 'btn block', onclick: () => ui.play('intro') }, '▶ Ouvir a tônica (referência)')
        : h('p', { class: 'muted small center' }, 'Sem som: imagine a tônica antes de começar.'),
      reveal);

    function show() {
      reveal.remove();
      add(ui.body,
        h('div', { class: 'answer-box' },
          h('div', { class: 'answer' }, q.answer),
          h('div', { class: 'explanation' }, q.explanation),
          ui.sound ? h('button', { class: 'btn small', style: { marginTop: '10px' }, onclick: () => ui.play() }, '▶ Ouvir de novo') : null),
        h('div', { class: 'btn-row', style: { marginTop: '14px' } },
          h('button', { class: 'btn bad', onclick: () => ui.done(false, { feedback: false }) }, '✗ Desafinei'),
          h('button', { class: 'btn ok', onclick: () => ui.done(true, { feedback: false }) }, '✓ Acertei')));
      if (ui.sound) ui.play();
    }
  },
};
