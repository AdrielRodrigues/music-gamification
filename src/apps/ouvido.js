/** Ouvido Funcional — cadência + nota/acorde: reconhecer o GRAU, não a nota. */
import { add, h } from '../ui/dom.js';
import { selectGenerators } from '../questions/index.js';
import { choiceButtons } from '../ui/components/choices.js';

const IDS = {
  graus: ['ouvido.grauNota'],
  acordes: ['ouvido.grauAcorde', 'ouvido.tensao'],
  intervalos: ['ouvido.intervalo'],
  repouso: ['ouvido.repouso', 'ouvido.tendencia'],
};
IDS.mix = Object.values(IDS).flat();

export default {
  id: 'ouvido',
  title: 'Ouvido Funcional',
  icon: '🎧',
  tagline: 'Ouça e diga o grau',
  skill: 'Ouvir',
  contexts: ['fone'],
  needsAudio: true,
  description: 'Uma cadência estabelece o tom; depois vem uma nota, um acorde ou um intervalo. Diga o que ouviu em relação à tônica.',
  why: 'Tocar de ouvido é reconhecer FUNÇÕES (este é o 5º grau, aquele é o IV), não notas absolutas. A cadência antes de cada pergunta treina exatamente isso.',
  setup: {
    key: true,
    modes: [
      { value: 'mix', label: 'Tudo' },
      { value: 'graus', label: 'Graus' },
      { value: 'acordes', label: 'Acordes' },
      { value: 'intervalos', label: 'Interv.' },
      { value: 'repouso', label: 'Repouso' },
    ],
  },
  generators: (c) => selectGenerators({ ids: IDS[c.mode] ?? IDS.mix, level: c.level }),

  render(q, ui) {
    const hasIntro = q.audio.intro.length > 0;
    add(ui.body,
      h('div', { class: 'row wrap', style: { marginTop: '12px' } },
        h('button', { class: 'btn small', onclick: () => ui.play() }, hasIntro ? '↻ Cadência + alvo' : '↻ Repetir'),
        hasIntro ? h('button', { class: 'btn small', onclick: () => ui.play('target') }, '↻ Só o alvo') : null),
      choiceButtons(q.choices, q.answer, (ok) => ui.done(ok)));
    ui.play();
  },
};
