/** Teclado — monte e reconheça tríades e inversões nas teclas. */
import { add, h } from '../ui/dom.js';
import { selectGenerators } from '../questions/index.js';
import { choiceButtons } from '../ui/components/choices.js';
import { keyboard } from '../ui/components/keyboard.js';
import { formatNote, mod, note } from '../theory/index.js';

const IDS = { montar: ['inst.teclado'], nomear: ['inst.tecladoNomeie'] };
IDS.mix = Object.values(IDS).flat();

export default {
  id: 'teclado',
  title: 'Teclado',
  icon: '🎹',
  tagline: 'Tríades e inversões',
  skill: 'Mapear',
  instrument: 'keyboard',
  contexts: ['espera'],
  description: 'Toque as teclas que formam o acorde (na inversão pedida) ou diga que acorde está marcado.',
  why: 'No teclado a estrutura do acorde é visível: ver a terça e a quinta e trocar o baixo (inversões) deixa claro o que muda no som.',
  setup: {
    key: false,
    modes: [{ value: 'mix', label: 'Tudo' }, { value: 'montar', label: 'Montar' }, { value: 'nomear', label: 'Nomear' }],
  },
  generators: (c) => selectGenerators({ ids: IDS[c.mode] ?? IDS.mix, level: c.level }),

  render(q, ui) {
    const kb = q.data.keys;
    // Rótulo nas teclas Dó para orientar.
    const cLabel = (start, octaves) => Object.fromEntries(Array.from({ length: octaves }, (_, i) => [start + 12 * i, formatNote(note(0), ui.notation)]));

    if (kb.mode === 'name') {
      const marks = Object.fromEntries(kb.midis.map((m) => [m, 'sel']));
      const board = keyboard({ start: 60, octaves: 2, marks, labels: cLabel(60, 2) });
      add(ui.body,
        board.el,
        ui.sound ? h('button', { class: 'btn small', style: { marginTop: '10px' }, onclick: () => ui.play() }, '▶ Ouvir') : null,
        choiceButtons(q.choices, q.answer, (ok) => ui.done(ok)));
      return;
    }

    // mode === 'build': selecionar teclas e conferir
    const selected = new Set();
    let locked = false;
    const marksOf = () => Object.fromEntries([...selected].map((m) => [m, 'sel']));
    const board = keyboard({
      start: 48,
      octaves: 2,
      labels: cLabel(48, 2),
      onTap(m) {
        if (locked) return;
        if (selected.has(m)) selected.delete(m);
        else {
          selected.add(m);
          ui.playNote(m);
        }
        board.setMarks(marksOf());
      },
    });

    const check = h('button', {
      class: 'btn primary block',
      style: { marginTop: '14px' },
      onclick() {
        if (!selected.size) return;
        locked = true;
        check.disabled = true;
        const sorted = [...selected].sort((a, b) => a - b);
        const pcs = new Set(sorted.map((m) => mod(m, 12)));
        const want = new Set(kb.pcs);
        const samePcs = pcs.size === want.size && [...want].every((p) => pcs.has(p)) && sorted.length === kb.pcs.length;
        const ok = samePcs && mod(sorted[0], 12) === kb.bassPc;
        board.setMarks(Object.fromEntries(sorted.map((m) => [m, want.has(mod(m, 12)) ? 'ok' : 'bad'])));
        if (ui.sound) ui.playNote(sorted[0]);
        ui.done(ok);
      },
    }, 'Conferir');

    add(ui.body,
      h('p', { class: 'small muted', style: { marginTop: '8px' } }, 'Toque as teclas (toque de novo para desmarcar). A mais grave é o baixo.'),
      board.el,
      check);
  },
};
