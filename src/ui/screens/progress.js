/** Progresso: sequência, últimos dias, acerto por app/tema e mapa tema × tom. */
import { add, h, percent, topBar } from '../dom.js';
import { APPS } from '../../apps/registry.js';
import { THEMES } from '../../questions/index.js';
import { lastDays, rate, streak, totals } from '../../core/progress.js';
import { boxCounts } from '../../core/srs.js';
import { keyFromId, keyLabel, majorKeyIds, minorKeyIds } from '../../theory/index.js';

function bars(rows) {
  return h('div', { class: 'bars' }, rows.map(({ label, stat }) => {
    const r = rate(stat);
    return h('div', { class: 'bar-row' },
      h('span', {}, label),
      h('div', { class: 'bar' }, h('div', { style: { width: `${(r ?? 0) * 100}%` } })),
      h('span', { class: 'pct' }, stat?.seen ? percent(r) : '—'));
  }));
}

/** Cor da célula: vermelho (0%) → verde (100%), mais forte com mais respostas. */
function heatColor(stat) {
  const r = rate(stat);
  const strength = 0.25 + 0.6 * Math.min(stat.seen, 20) / 20;
  return `hsl(${Math.round(r * 120)} 65% 45% / ${strength.toFixed(2)})`;
}

export function renderProgress(root, { state }) {
  const st = state.stats;
  const notation = state.settings.notation;
  const all = totals(state);
  const days = lastDays(state.days, Date.now(), 14);
  const maxDay = Math.max(1, ...days.map((d) => d.answered));
  const boxes = boxCounts(state.srs);

  // Tons com pelo menos uma resposta (maiores sempre aparecem).
  const keys = [...majorKeyIds(state.settings.fsharp), ...minorKeyIds(state.settings.fsharp).filter((k) => st.key[k])];
  const themeCols = THEMES.filter((t) => t.id !== 'instrumento');

  const heat = h('table', { class: 'heat' },
    h('thead', {}, h('tr', {}, h('th', {}, 'Tom'), themeCols.map((t) => h('th', {}, t.short)))),
    h('tbody', {}, keys.map((k) => h('tr', {},
      h('th', { style: { textAlign: 'left' } }, keyLabel(keyFromId(k), notation).replace(' maior', '').replace(' menor', 'm')),
      themeCols.map((t) => {
        const s = st.themeKey[`${t.id}|${k}`];
        return s?.seen
          ? h('td', { style: { background: heatColor(s) }, title: `${s.correct}/${s.seen}` }, percent(rate(s)))
          : h('td', { class: 'empty' });
      })))));

  add(root,
    topBar('Progresso'),
    h('div', { class: 'stats-strip' },
      h('div', { class: 'stat' }, h('b', {}, `🔥 ${streak(state.days)}`), h('span', {}, 'dias seguidos')),
      h('div', { class: 'stat' }, h('b', {}, all.seen), h('span', {}, 'respostas')),
      h('div', { class: 'stat' }, h('b', {}, percent(rate(all))), h('span', {}, 'acerto'))),

    h('h2', {}, 'Últimos 14 dias'),
    h('div', { class: 'card' },
      h('div', { class: 'days' }, days.map((d) => h('div', {
        class: d.answered ? '' : 'zero',
        style: { height: `${(d.answered / maxDay) * 100}%` },
        title: `${d.day}: ${d.answered} respostas`,
      })))),

    h('h2', {}, 'Por tema'),
    h('div', { class: 'card' }, bars(THEMES.map((t) => ({ label: t.short, stat: st.theme[t.id] })))),

    h('h2', {}, 'Por treino'),
    h('div', { class: 'card' }, bars(APPS.map((a) => ({ label: `${a.icon} ${a.title}`, stat: st.app[a.id] })))),

    h('h2', {}, 'Tema × tom'),
    h('p', { class: 'small muted' }, 'Onde você está forte (verde) e fraco (vermelho). Célula vazia = ainda não treinou.'),
    h('div', { class: 'card', style: { overflowX: 'auto' } }, heat),

    h('h2', {}, 'Repetição espaçada'),
    h('div', { class: 'card' },
      h('p', { class: 'small' }, `Itens em cada caixa (1 = volta sempre, 5 = já sabe): ${Object.entries(boxes).map(([b, n]) => `${b}: ${n}`).join(' · ')}`)),
  );
}
