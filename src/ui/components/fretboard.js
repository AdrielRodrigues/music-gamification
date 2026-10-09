/**
 * Braço do violão/guitarra em SVG, na orientação de tablatura:
 * 1ª corda (Mi agudo) em cima, 6ª (Mi grave) embaixo.
 *
 *   fretboard({ from, to, dots, onTap, activeStrings })
 *     dots: [{ string, fret, cls?, text? }]   cls: 'hl' | 'ok' | 'ghost'
 *     onTap(string, fret): torna as casas tocáveis
 *     activeStrings: cordas tocáveis (as outras ficam esmaecidas)
 * Devolve { el, setDots(dots) }.
 */
import { h, s } from '../dom.js';

const FW = 34; // largura de uma casa
const OPEN = 30; // coluna das cordas soltas
const TOP = 14;
const SP = 22; // distância entre cordas
const MARKERS = [3, 5, 7, 9, 15];

export function fretboard({ from = 0, to = 12, dots = [], onTap = null, activeStrings = null } = {}) {
  const first = Math.max(from, 1);
  const left = from === 0 ? OPEN : 10;
  const count = to - first + 1;
  const width = left + count * FW + 6;
  const height = TOP + 5 * SP + 26;
  const y = (string) => TOP + (string - 1) * SP;
  const x = (fret) => (fret === 0 ? OPEN / 2 : left + (fret - first + 0.5) * FW);
  const active = (string) => !activeStrings || activeStrings.includes(string);

  const wrap = h('div', { class: 'instrument' });
  let currentDots = dots;

  function render() {
    const svg = s('svg', { viewBox: `0 0 ${width} ${height}`, role: 'img', 'aria-label': 'Braço do violão' });
    svg.append(s('rect', { class: 'fb-bg', x: 0, y: 0, width, height, rx: 8 }));

    // marcações de casa (bolinhas do braço)
    const mid = TOP + 2.5 * SP;
    for (let f = first; f <= to; f++) {
      if (MARKERS.includes(f)) svg.append(s('circle', { class: 'fb-marker', cx: x(f), cy: mid, r: 6 }));
      if (f === 12) {
        svg.append(s('circle', { class: 'fb-marker', cx: x(f), cy: TOP + 1.5 * SP, r: 6 }));
        svg.append(s('circle', { class: 'fb-marker', cx: x(f), cy: TOP + 3.5 * SP, r: 6 }));
      }
      if (MARKERS.includes(f) || f === 12 || f === first) {
        svg.append(s('text', { class: 'fb-label', x: x(f), y: height - 8 }, String(f)));
      }
    }

    // trastes (o primeiro é a pestana quando o trecho começa na casa 0)
    for (let i = 0; i <= count; i++) {
      const lx = left + i * FW;
      svg.append(s('line', { class: i === 0 && from === 0 ? 'fb-nut' : 'fb-fret', x1: lx, x2: lx, y1: TOP - 4, y2: y(6) + 4 }));
    }

    // cordas (mais grossas no grave)
    for (let string = 1; string <= 6; string++) {
      svg.append(s('line', {
        class: `fb-string${active(string) ? '' : ' fb-row-off'}`,
        x1: from === 0 ? 4 : left, x2: width - 6, y1: y(string), y2: y(string),
        'stroke-width': 0.8 + string * 0.35,
      }));
    }

    // áreas de toque
    if (onTap) {
      for (let string = 1; string <= 6; string++) {
        if (!active(string)) continue;
        const frets = from === 0 ? [0] : [];
        for (let f = first; f <= to; f++) frets.push(f);
        for (const f of frets) {
          const w = f === 0 ? OPEN : FW;
          svg.append(s('rect', {
            class: 'fb-hit', x: x(f) - w / 2, y: y(string) - SP / 2, width: w, height: SP, rx: 4,
            onclick: () => onTap(string, f),
          }));
        }
      }
    }

    for (const d of currentDots) {
      svg.append(s('circle', { class: `fb-dot ${d.cls || ''}`, cx: x(d.fret), cy: y(d.string), r: 9 }));
      if (d.text) svg.append(s('text', { class: 'fb-dot-text', x: x(d.fret), y: y(d.string) }, d.text));
    }
    wrap.replaceChildren(svg);
  }

  render();
  return {
    el: wrap,
    setDots(next) {
      currentDots = next;
      render();
    },
  };
}
