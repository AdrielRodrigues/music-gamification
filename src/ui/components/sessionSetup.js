/**
 * Tela de configuração da sessão, comum a todos os apps:
 * tema(s), tom (ou aleatório), nível, duração e modo (quando o app tiver).
 *
 * Prioridade dos valores iniciais: link (query) > Tom da Semana ativo >
 * última configuração usada no app > padrões das Configurações.
 */
import { chipToggles, h, segmented, topBar } from '../dom.js';
import { keyFromId, keyLabel, majorKeyIds, minorKeyIds } from '../../theory/index.js';
import { LEVELS, THEMES } from '../../questions/index.js';

export function initialConfig(app, state, query) {
  const last = state.lastSetup[app.id] ?? {};
  const st = state.settings;
  const themes = app.setup.themes ?? [];
  // Apps sem escolha de tom (ex.: Detetive, em que o tom é a resposta) sempre sorteiam.
  let key = 'random';
  if (app.setup.key) {
    key = query.key ?? (state.weekKey.active ? state.weekKey.key : last.key ?? 'random');
  }
  const queryThemes = query.themes?.split(',').filter((t) => themes.includes(t));
  return {
    themes: queryThemes?.length ? queryThemes : (last.themes?.filter((t) => themes.includes(t)) ?? themes),
    key,
    level: Number(query.level ?? last.level ?? st.level),
    minutes: Number(last.minutes ?? st.sessionMinutes),
    mode: last.mode ?? app.setup.modes?.[0]?.value ?? null,
  };
}

function keySelect(state, value, onChange) {
  const notation = state.settings.notation;
  const opt = (id) => h('option', { value: id, selected: id === value }, keyLabel(keyFromId(id), notation));
  const sel = h('select', { onchange: (e) => onChange(e.target.value), 'aria-label': 'Tom' },
    h('option', { value: 'random', selected: value === 'random' }, 'Aleatório (misturar tons)'),
    h('optgroup', { label: 'Maiores' }, majorKeyIds(state.settings.fsharp).map(opt)),
    h('optgroup', { label: 'Menores' }, minorKeyIds(state.settings.fsharp).map(opt)));
  return sel;
}

export function sessionSetup({ app, state, query, onStart, onEnableSound }) {
  const config = initialConfig(app, state, query);
  const st = state.settings;
  const field = (label, control, hint) => h('div', { class: 'field' }, h('div', { class: 'label' }, label), control, hint ? h('div', { class: 'hint' }, hint) : null);

  const soundWarning = app.needsAudio && !st.sound
    ? h('div', { class: 'card', style: { marginTop: '14px' } },
      h('p', {}, '🔇 Este jogo precisa de som e ele está desligado.'),
      h('button', { class: 'btn primary block', onclick: onEnableSound }, 'Ligar o som'))
    : null;

  return h('div', {},
    topBar(`${app.icon} ${app.title}`),
    h('div', { class: 'card stack' },
      h('p', {}, app.description),
      h('p', { class: 'small muted' }, h('b', {}, `Treina: ${app.skill}. `), app.why)),
    soundWarning,
    app.setup.modes ? field('Modo', segmented(app.setup.modes, config.mode, (v) => { config.mode = v; })) : null,
    app.setup.themes?.length > 1
      ? field('Temas', chipToggles(THEMES.filter((t) => app.setup.themes.includes(t.id)).map((t) => ({ value: t.id, label: t.name })), config.themes, (v) => { config.themes = v; }), 'Misturar temas fixa melhor do que treinar um de cada vez.')
      : null,
    app.setup.key ? field('Tom', keySelect(state, config.key, (v) => { config.key = v; }), state.weekKey.active ? `Tom da Semana ativo: ${keyLabel(keyFromId(state.weekKey.key), st.notation)}.` : null) : null,
    field('Nível', segmented(LEVELS.map((l) => ({ value: l.id, label: l.name })), config.level, (v) => { config.level = v; })),
    app.fixedSeconds
      ? h('p', { class: 'muted small', style: { marginTop: '18px' } }, `Rodada de ${app.fixedSeconds} segundos. Bata seu recorde!`)
      : field('Duração', segmented([{ value: 5, label: '5 min · fila' }, { value: 10, label: '10 min · espera' }], config.minutes, (v) => { config.minutes = v; })),
    h('button', {
      class: 'btn primary block',
      style: { marginTop: '24px' },
      disabled: app.needsAudio && !st.sound,
      onclick: () => onStart({ ...config }),
    }, 'Começar'),
  );
}
