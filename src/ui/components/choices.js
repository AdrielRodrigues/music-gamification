/**
 * Botões de múltipla escolha. Ao tocar um, marca certo/errado, trava todos
 * e chama onPick(correct, escolhido).
 */
import { h } from '../dom.js';

/** Escolhe o número de colunas pelo tamanho dos textos. */
function columnsFor(choices) {
  const longest = Math.max(...choices.map((c) => c.length));
  if (choices.length >= 5 && longest <= 5) return 'cols-4';
  if (choices.length === 3 && longest <= 12) return 'cols-3';
  if (choices.length % 2 === 0 && longest <= 16) return 'cols-2';
  return '';
}

export function choiceButtons(choices, answer, onPick) {
  const buttons = choices.map((c) => h('button', { type: 'button', class: 'choice', onclick: () => pick(c) }, c));
  function pick(c) {
    buttons.forEach((b, i) => {
      b.disabled = true;
      if (choices[i] === answer) b.classList.add('right');
      else if (choices[i] === c) b.classList.add('wrong');
    });
    onPick(c === answer, c);
  }
  return h('div', { class: `choices ${columnsFor(choices)}` }, buttons);
}
