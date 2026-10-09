/** Transponha — leve uma progressão para outro tom ou para graus romanos. */
import { add, h } from '../ui/dom.js';
import { selectGenerators } from '../questions/index.js';

const IDS = {
  transpor: ['prog.transpor'],
  graus: ['prog.graus'],
  mix: ['prog.transpor', 'prog.graus'],
};

export default {
  id: 'transponha',
  title: 'Transponha',
  icon: '🔀',
  tagline: 'Cifra → outro tom / graus',
  skill: 'Aplicar',
  contexts: ['espera'],
  description: 'Uma progressão em cifra: escreva-a em outro tom ou em graus romanos, acorde por acorde.',
  why: 'É a independência das cifras na prática: quem pensa em graus (I–V–vi–IV) toca a mesma música em qualquer tom.',
  setup: {
    key: true,
    modes: [{ value: 'mix', label: 'Tudo' }, { value: 'transpor', label: 'Outro tom' }, { value: 'graus', label: 'Graus' }],
  },
  generators: (c) => selectGenerators({ ids: IDS[c.mode] ?? IDS.mix, level: c.level }),

  render(q, ui) {
    const { answer, options } = q.data.sequence;
    const filled = [];
    let locked = false;

    const slots = h('div', { class: 'slots' });
    const renderSlots = (marks = []) => slots.replaceChildren(
      ...answer.map((_, i) => h('div', { class: `slot${filled[i] ? ' filled' : ''}${marks[i] ? ` ${marks[i]}` : ''}` }, filled[i] ?? '?')));

    const buttons = options.map((o) => h('button', {
      type: 'button',
      class: 'choice',
      onclick() {
        if (locked || filled.length >= answer.length) return;
        filled.push(o);
        renderSlots();
        if (filled.length === answer.length) check();
      },
    }, o));

    function check() {
      locked = true;
      buttons.forEach((b) => { b.disabled = true; });
      undo.disabled = true;
      renderSlots(filled.map((x, i) => (x === answer[i] ? 'right' : 'wrong')));
      ui.done(filled.every((x, i) => x === answer[i]));
    }

    const undo = h('button', { class: 'btn small', style: { marginTop: '10px' }, onclick: () => { if (!locked) { filled.pop(); renderSlots(); } } }, '⌫ Apagar');

    renderSlots();
    add(ui.body,
      h('p', { class: 'small muted', style: { marginTop: '8px' } }, 'Toque os acordes na ordem:'),
      slots,
      h('div', { class: 'choices cols-4' }, buttons),
      undo);
  },
};
