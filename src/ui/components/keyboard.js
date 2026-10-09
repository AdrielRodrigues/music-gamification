/**
 * Teclado de piano em SVG.
 *
 *   keyboard({ start, octaves, marks, labels, onTap })
 *     marks:  { [midi]: 'sel' | 'ok' | 'bad' }
 *     labels: { [midi]: texto }  (nome da nota sob a tecla)
 * Devolve { el, setMarks(marks), setLabels(labels) }.
 */
import { h, s } from '../dom.js';
import { keyboardKeys } from '../../theory/index.js';

const WW = 24; // largura da tecla branca
const WH = 100;
const BW = 15;
const BH = 62;

export function keyboard({ start = 48, octaves = 2, marks = {}, labels = {}, onTap = null } = {}) {
  const keys = keyboardKeys(start, octaves);
  const whites = keys.filter((k) => !k.black);
  const width = whites.length * WW + 2;
  const wrap = h('div', { class: 'instrument' });
  let currentMarks = marks;
  let currentLabels = labels;

  function render() {
    const svg = s('svg', { viewBox: `0 0 ${width} ${WH + 2}`, role: 'img', 'aria-label': 'Teclado' });
    let wi = 0;
    const blackEls = [];
    for (const k of keys) {
      const mark = currentMarks[k.midi] ? ` ${currentMarks[k.midi]}` : '';
      const tap = onTap ? () => onTap(k.midi) : null;
      if (!k.black) {
        const x = 1 + wi * WW;
        svg.append(s('rect', { class: `kb-white${mark}`, x, y: 1, width: WW, height: WH, rx: 3, onclick: tap }));
        if (currentLabels[k.midi]) svg.append(s('text', { class: 'kb-label', x: x + WW / 2, y: WH - 8 }, currentLabels[k.midi]));
        wi++;
      } else {
        // a tecla preta fica sobre a divisa entre as duas brancas vizinhas
        const x = 1 + wi * WW - BW / 2;
        blackEls.push(s('rect', { class: `kb-black${mark}`, x, y: 1, width: BW, height: BH, rx: 2, onclick: tap }));
      }
    }
    svg.append(...blackEls); // pretas por cima das brancas
    wrap.replaceChildren(svg);
  }

  render();
  return {
    el: wrap,
    setMarks(next) { currentMarks = next; render(); },
    setLabels(next) { currentLabels = next; render(); },
  };
}
