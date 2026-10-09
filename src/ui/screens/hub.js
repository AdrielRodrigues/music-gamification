/** Menu principal: resumo do dia, Tom da Semana, sugestões por situação e apps. */
import { add, h, percent } from '../dom.js';
import { CONTEXTS, orderedApps } from '../../apps/registry.js';
import { dayKey, rate, streak, totals } from '../../core/progress.js';
import { evaluateWeek } from '../../core/weekKey.js';
import { keyFromId, keyLabel } from '../../theory/index.js';

let currentContext = null; // filtro de situação escolhido (só nesta visita)

export function renderHub(root, { state }) {
  const st = state.settings;
  const today = state.days[dayKey(Date.now())]?.answered ?? 0;
  const all = totals(state);

  let banner;
  if (state.weekKey.active) {
    const ev = evaluateWeek(state);
    const done = ev.criteria.filter((c) => c.ok).length;
    banner = h('a', { class: 'banner', href: '#/tom-da-semana' },
      '🎯 Tom da Semana: ', h('b', {}, keyLabel(keyFromId(state.weekKey.key), st.notation)),
      h('div', { class: 'small muted' }, ev.mastered ? 'Dominado! Toque para avançar.' : `${done} de ${ev.criteria.length} metas cumpridas`));
  } else {
    banner = h('a', { class: 'banner', href: '#/tom-da-semana' },
      '🎯 ', h('b', {}, 'Tom da Semana'),
      h('div', { class: 'small muted' }, 'Foque um tom até dominá-lo. Toque para começar.'));
  }

  const grid = h('div', { class: 'app-grid' });
  const tabs = h('div', { class: 'context-tabs' });

  function renderGrid() {
    tabs.replaceChildren(...CONTEXTS.map((c) => h('button', {
      class: `chip${currentContext === c.id ? ' on' : ''}`,
      title: c.hint,
      onclick: () => { currentContext = currentContext === c.id ? null : c.id; renderGrid(); },
    }, c.label)));
    grid.replaceChildren(...orderedApps(st).map((a) => {
      const fits = !currentContext || a.contexts.includes(currentContext);
      return h('a', { class: `app-card${fits ? '' : ' dim'}`, href: `#/app/${a.id}` },
        h('div', { class: 'icon' }, a.icon),
        h('b', {}, a.title),
        h('span', {}, a.tagline),
        h('div', { class: 'tag' }, a.skill + (a.needsAudio ? ' · 🔊' : '')));
    }));
  }
  renderGrid();

  add(root,
    h('header', { class: 'hero' },
      h('h1', {}, '🎼 Teoria de Bolso'),
      h('p', {}, 'Teoria musical nos minutos soltos do dia.')),
    h('div', { class: 'stats-strip' },
      h('div', { class: 'stat' }, h('b', {}, `🔥 ${streak(state.days)}`), h('span', {}, 'dias seguidos')),
      h('div', { class: 'stat' }, h('b', {}, today), h('span', {}, 'respostas hoje')),
      h('div', { class: 'stat' }, h('b', {}, percent(rate(all))), h('span', {}, 'acerto geral'))),
    banner,
    h('h2', {}, 'Onde você está?'),
    tabs,
    h('h2', {}, 'Treinos'),
    grid,
    h('h2', {}, 'Mais'),
    h('nav', { class: 'nav-list' },
      h('a', { href: '#/progresso' }, '📊 Progresso', h('span', {}, '›')),
      h('a', { href: '#/guia' }, '🧭 Qual treino desenvolve o quê', h('span', {}, '›')),
      h('a', { href: '#/config' }, '⚙️ Configurações', h('span', {}, '›'))),
  );
}
