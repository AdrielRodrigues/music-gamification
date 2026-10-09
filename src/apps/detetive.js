/** Detetive de Tom — alguns acordes: qual é o tom? */
import { add, h } from '../ui/dom.js';
import { selectGenerators } from '../questions/index.js';
import { choiceButtons } from '../ui/components/choices.js';

export default {
  id: 'detetive',
  title: 'Detetive de Tom',
  icon: '🔎',
  tagline: 'Descubra o tom pelos acordes',
  skill: 'Aplicar',
  contexts: ['espera', 'fila'],
  description: 'Veja (e ouça) alguns acordes de uma música e descubra o tom. No avançado aparecem dominantes secundários.',
  why: 'Reconhecer o tom a partir da cifra é o primeiro passo para tocar sem ela: com o tom em mente, você prevê os próximos acordes.',
  setup: { key: false },
  generators: (c) => selectGenerators({ ids: ['prog.tom', 'prog.tomSecundario'], level: c.level }),
  promptOf: () => 'Qual é o tom?',

  render(q, ui) {
    add(ui.body,
      h('div', { class: 'chord-chips' }, q.data.chords.map((c) => h('span', { class: 'chord-chip' }, c))),
      ui.sound ? h('button', { class: 'btn small', onclick: () => ui.play() }, '▶ Ouvir os acordes') : null,
      choiceButtons(q.choices, q.answer, (ok) => ui.done(ok)));
  },
};
