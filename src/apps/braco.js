/** Braço — notas e formas de acorde no violão/guitarra. */
import { add, h } from '../ui/dom.js';
import { selectGenerators } from '../questions/index.js';
import { choiceButtons } from '../ui/components/choices.js';
import { fretboard } from '../ui/components/fretboard.js';
import { fretMidi, fretPc } from '../theory/index.js';

const IDS = {
  nome: ['inst.cordaSolta', 'inst.casa'],
  achar: ['inst.ondeNota'],
  shape: ['inst.shape'],
};
IDS.mix = Object.values(IDS).flat();

const ROLE_TEXT = { R: 'F', 3: '3', 5: '5' };

export default {
  id: 'braco',
  title: 'Braço',
  icon: '🎸',
  tagline: 'Notas e shapes no violão',
  skill: 'Mapear',
  instrument: 'guitar',
  contexts: ['espera'],
  description: 'Nomeie a nota de uma casa, encontre uma nota numa corda e reconheça fundamental, terça e quinta nas pestanas.',
  why: 'Ligar a teoria ao lugar onde os dedos vão: saber onde está a terça do acorde é o que permite fazer arranjos e solos sem decorar formas.',
  setup: {
    key: false,
    modes: [{ value: 'mix', label: 'Tudo' }, { value: 'nome', label: 'Nomear' }, { value: 'achar', label: 'Achar' }, { value: 'shape', label: 'Shapes' }],
  },
  generators: (c) => selectGenerators({ ids: IDS[c.mode] ?? IDS.mix, level: c.level }),

  render(q, ui) {
    const fb = q.data.fret;

    if (fb.mode === 'name') {
      const board = fretboard({ from: 0, to: 12, dots: [{ string: fb.string, fret: fb.fret, cls: 'hl' }] });
      add(ui.body, board.el, choiceButtons(q.choices, q.answer, (ok) => {
        ui.playNote(fretMidi(fb.string, fb.fret));
        ui.done(ok);
      }));
      return;
    }

    if (fb.mode === 'find') {
      let answered = false;
      const board = fretboard({
        from: 0,
        to: 12,
        activeStrings: [fb.string],
        onTap(string, fret) {
          if (answered) return;
          answered = true;
          ui.playNote(fretMidi(string, fret));
          const ok = fretPc(string, fret) === fb.pc;
          // Mostra o toque e todas as posições certas na corda.
          const right = [];
          for (let f = 0; f <= 12; f++) if (fretPc(fb.string, f) === fb.pc) right.push({ string: fb.string, fret: f, cls: 'ok' });
          board.setDots(ok ? right : [...right, { string, fret, cls: 'hl' }]);
          ui.done(ok);
        },
      });
      add(ui.body, h('p', { class: 'small muted', style: { marginTop: '8px' } }, `Toque na ${fb.string}ª corda.`), board.el);
      return;
    }

    // mode === 'role': forma de pestana com um ponto destacado
    const frets = fb.dots.map((d) => d.fret);
    const from = Math.max(0, Math.min(...frets) - 1);
    const to = Math.max(...frets) + 1;
    const board = fretboard({
      from,
      to,
      dots: fb.dots.map((d, i) => ({ ...d, cls: i === fb.highlight ? 'hl' : 'ghost' })),
    });
    add(ui.body, board.el, choiceButtons(q.choices, q.answer, (ok) => {
      // Depois da resposta, rotula todos os pontos (F = fundamental).
      board.setDots(fb.dots.map((d, i) => ({ ...d, cls: i === fb.highlight ? 'hl' : '', text: ROLE_TEXT[d.role] })));
      ui.done(ok);
    }));
  },
};
