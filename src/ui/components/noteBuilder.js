/**
 * Construtor de notas com grafia: toque a letra (Dó, Ré…) e depois ♭ ou ♯
 * para alterar a ÚLTIMA nota. Obriga a pensar na letra certa (Si♭, não Lá♯).
 *
 *   noteBuilder({ notation, max, onAdd })  →  { el, value(), clear() }
 */
import { h } from '../dom.js';
import { formatNote, LETTERS, note } from '../../theory/index.js';

export function noteBuilder({ notation, max = 7, onAdd = null }) {
  const notes = [];
  const slots = h('div', { class: 'slots', 'aria-live': 'polite' });

  function renderSlots() {
    slots.replaceChildren(
      ...notes.map((n) => h('div', { class: 'slot filled' }, formatNote(n, notation))),
      ...(notes.length < max ? [h('div', { class: 'slot' }, '?')] : []),
    );
  }

  function add(letter) {
    if (notes.length >= max) return;
    const n = note(letter, 0);
    notes.push(n);
    renderSlots();
    onAdd?.(n);
  }

  function alter(delta) {
    const last = notes[notes.length - 1];
    if (!last) return;
    last.acc = delta === 0 ? 0 : Math.max(-2, Math.min(2, last.acc + delta));
    renderSlots();
    onAdd?.(last);
  }

  const letters = h('div', { class: 'letters' },
    LETTERS.map((_, i) => h('button', { type: 'button', onclick: () => add(i) }, formatNote(note(i), notation))));

  const accRow = h('div', { class: 'acc-row' },
    h('button', { type: 'button', class: 'btn small', onclick: () => alter(-1) }, '♭'),
    h('button', { type: 'button', class: 'btn small', onclick: () => alter(0) }, '♮'),
    h('button', { type: 'button', class: 'btn small', onclick: () => alter(1) }, '♯'));

  const actions = h('div', { class: 'row', style: { marginTop: '8px' } },
    h('button', { type: 'button', class: 'btn small grow', onclick: () => { notes.pop(); renderSlots(); } }, '⌫ Apagar'),
    h('button', { type: 'button', class: 'btn small grow', onclick: () => { notes.length = 0; renderSlots(); } }, 'Limpar'));

  renderSlots();
  return {
    el: h('div', {}, slots, letters, accRow, actions),
    value: () => notes.map((n) => ({ ...n })),
    clear() { notes.length = 0; renderSlots(); },
  };
}
