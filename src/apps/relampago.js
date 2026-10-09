/** Relâmpago — 60 segundos de múltipla escolha: velocidade é o objetivo. */
import { add } from '../ui/dom.js';
import { selectGenerators } from '../questions/index.js';
import { choiceButtons } from '../ui/components/choices.js';

export default {
  id: 'relampago',
  title: 'Relâmpago',
  icon: '⚡',
  tagline: '60 s, quantas acertar?',
  skill: 'Velocidade',
  contexts: ['fila'],
  description: 'Rodadas de 60 segundos com múltipla escolha. Responda o mais rápido que conseguir.',
  why: 'Para tocar de ouvido e transpor ao vivo, a teoria precisa ser instantânea. Saber o IV de Ré em 5 segundos não basta: tem que ser em 1.',
  setup: { themes: ['notas', 'campo', 'progressoes', 'acordes', 'instrumento'], key: true },
  fixedSeconds: 60,
  replayInFeedback: false,
  generators: (c) => selectGenerators({ themes: c.themes, level: c.level, mc: true, audio: false, fixedKey: c.key !== 'random' }),

  render(q, ui) {
    add(ui.body, choiceButtons(q.choices, q.answer, (ok) => ui.done(ok, { auto: true })));
  },
};
