/** Configurações: notação, som, instrumento, padrões e backup do progresso. */
import { add, h, segmented, topBar } from '../dom.js';
import { playEvents } from '../audio.js';
import { defaultState, exportState, importState } from '../../core/storage.js';
import { LEVELS } from '../../questions/index.js';

function toast(text) {
  const el = h('div', { class: 'toast', role: 'status' }, text);
  document.body.append(el);
  setTimeout(() => el.remove(), 2500);
}

export function renderSettings(root, { state, save, replaceState }) {
  const st = state.settings;
  const set = (k) => (v) => { st[k] = v; save(); };
  const field = (label, control, hint) => h('div', { class: 'field' }, h('div', { class: 'label' }, label), control, hint ? h('div', { class: 'hint' }, hint) : null);

  function download() {
    const blob = new Blob([exportState(state)], { type: 'application/json' });
    const a = h('a', { href: URL.createObjectURL(blob), download: `teoria-de-bolso-${new Date().toISOString().slice(0, 10)}.json` });
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }

  const fileInput = h('input', {
    type: 'file',
    accept: 'application/json,.json',
    style: { display: 'none' },
    async onchange(e) {
      const file = e.target.files[0];
      if (!file) return;
      try {
        replaceState(importState(await file.text()));
        toast('Progresso importado!');
        location.hash = '#/';
      } catch (err) {
        toast(err.message || 'Arquivo inválido.');
      }
    },
  });

  add(root,
    topBar('Configurações'),
    field('Nomes das notas', segmented([{ value: 'latin', label: 'Dó Ré Mi' }, { value: 'anglo', label: 'C D E' }], st.notation, set('notation')), 'As cifras de acordes seguem a mesma escolha (ex.: Rém ou Dm).'),
    field('Som', segmented([{ value: true, label: 'Ligado' }, { value: false, label: 'Desligado' }], st.sound, set('sound')),
      'No iPhone, a chave de silencioso também corta o som do app.'),
    h('button', { class: 'btn small', style: { marginTop: '8px' }, onclick: () => playEvents([{ m: [48, 60, 64, 67], d: 1 }]) }, '▶ Testar som'),
    field('Instrumento principal', segmented([{ value: 'guitar', label: 'Violão' }, { value: 'keyboard', label: 'Teclado' }, { value: 'both', label: 'Ambos' }], st.instrument, set('instrument')), 'Muda a ordem dos treinos no menu.'),
    field('Duração padrão', segmented([{ value: 5, label: '5 min' }, { value: 10, label: '10 min' }], st.sessionMinutes, set('sessionMinutes'))),
    field('Nível padrão', segmented(LEVELS.map((l) => ({ value: l.id, label: l.name })), st.level, set('level'))),
    field('Tom com 6 acidentes', segmented([{ value: 'F#', label: 'F♯ / D♯m' }, { value: 'Gb', label: 'G♭ / E♭m' }], st.fsharp, set('fsharp')), 'Os dois são usados na prática; escolha o que você mais vê.'),

    h('h2', {}, 'Seu progresso'),
    h('div', { class: 'card stack' },
      h('p', { class: 'small muted' }, 'O progresso fica salvo só neste navegador. Para levar a outro aparelho (ou ter um backup), exporte e importe o arquivo.'),
      h('div', { class: 'btn-row' },
        h('button', { class: 'btn', onclick: download }, '⬇ Exportar'),
        h('button', { class: 'btn', onclick: () => fileInput.click() }, '⬆ Importar')),
      fileInput,
      h('button', {
        class: 'btn bad block',
        onclick() {
          if (!confirm('Apagar todo o progresso? As configurações são mantidas.')) return;
          const fresh = defaultState();
          fresh.settings = { ...st };
          replaceState(fresh);
          toast('Progresso apagado.');
          location.hash = '#/'; // as telas abertas apontam para o estado antigo
        },
      }, 'Apagar progresso')),

    h('h2', {}, 'Instalar no celular'),
    h('div', { class: 'card' },
      h('p', { class: 'small' }, 'Abra o menu do navegador e escolha "Adicionar à tela inicial" (ou "Instalar app"). Instalado, ele funciona offline e o iPhone não apaga seus dados.')),
  );
}
