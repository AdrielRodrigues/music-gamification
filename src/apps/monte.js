/** Monte — escreva escalas e acordes nota a nota, com a grafia certa. */
import { add, h } from '../ui/dom.js';
import { selectGenerators } from '../questions/index.js';
import { noteBuilder } from '../ui/components/noteBuilder.js';
import { noteId, parseNote, pitchClass } from '../theory/index.js';

const IDS = {
  escala: ['notas.escala'],
  acordes: ['acordes.triade', 'acordes.tetrade'],
  mix: ['notas.escala', 'acordes.triade', 'acordes.tetrade'],
};

export default {
  id: 'monte',
  title: 'Monte',
  icon: '🧱',
  tagline: 'Escreva escalas e acordes',
  skill: 'Construir',
  contexts: ['espera'],
  description: 'Monte a escala ou o acorde tocando as notas. Toque a letra e depois ♭ ou ♯ para alterar.',
  why: 'Produzir a resposta (em vez de reconhecê-la numa lista) obriga a entender a estrutura. E escolher a letra certa ensina enarmonia: em Fá maior é Si♭, nunca Lá♯.',
  setup: {
    key: true,
    modes: [{ value: 'mix', label: 'Tudo' }, { value: 'escala', label: 'Escalas' }, { value: 'acordes', label: 'Acordes' }],
  },
  generators: (c) => selectGenerators({ ids: IDS[c.mode] ?? IDS.mix, level: c.level }),

  render(q, ui) {
    const { expected, ordered } = q.data.build;
    const exp = expected.map(parseNote);
    const builder = noteBuilder({ notation: ui.notation, max: exp.length, onAdd: (n) => ui.playNote(60 + pitchClass(n)) });
    const msg = h('p', { class: 'small muted', style: { marginTop: '8px' } },
      ordered ? `${exp.length} notas, em ordem a partir da tônica.` : `${exp.length} notas, em qualquer ordem.`);

    const check = h('button', {
      class: 'btn primary block',
      style: { marginTop: '14px' },
      onclick() {
        const got = builder.value();
        if (got.length !== exp.length) {
          msg.textContent = `Faltam ${exp.length - got.length} nota(s).`;
          return;
        }
        const norm = (list) => (ordered ? list : [...list].sort());
        const same = (a, b) => norm(a).join() === norm(b).join();
        const correct = same(got.map(noteId), expected);
        // Som certo com grafia errada é o erro mais instrutivo: vale explicar.
        if (!correct && same(got.map((n) => String(pitchClass(n))), exp.map((n) => String(pitchClass(n))))) {
          msg.textContent = 'O som está certo, mas a grafia não: cada letra deve aparecer uma única vez (Dó-Ré-Mi… sem pular nem repetir).';
        }
        check.disabled = true;
        ui.done(correct);
      },
    }, 'Conferir');

    add(ui.body, builder.el, msg, check);
  },
};
