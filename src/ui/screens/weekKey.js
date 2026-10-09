/** Tom da Semana: escolher o tom em foco, acompanhar metas e avançar. */
import { add, h, percent, topBar } from '../dom.js';
import { completeWeek, daysSince, evaluateWeek, nextKey, startWeek, stopWeek } from '../../core/weekKey.js';
import { formatChord, harmonicField, keyFromId, keyLabel, keyScale, formatNote, majorKeyIds, WEEK_ORDER } from '../../theory/index.js';

export function renderWeekKey(root, ctx) {
  const { state, save } = ctx;
  const notation = state.settings.notation;
  const label = (id) => keyLabel(keyFromId(id), notation);
  const rerender = () => { root.replaceChildren(); renderWeekKey(root, ctx); };
  const wk = state.weekKey;

  if (!wk.active) {
    const last = wk.history[wk.history.length - 1];
    const suggestion = last ? nextKey(last.key) : WEEK_ORDER[0];
    let chosen = suggestion;
    const ids = majorKeyIds(state.settings.fsharp);
    const select = h('select', { onchange: (e) => { chosen = e.target.value; } },
      ids.map((id) => h('option', { value: id, selected: id === suggestion }, label(id))));
    add(root,
      topBar('Tom da Semana'),
      h('div', { class: 'card stack' },
        h('p', {}, 'Escolha um tom e foque nele até dominar: a escala, o campo harmônico, as progressões e o som dele no ouvido. Os treinos passam a usar esse tom por padrão.'),
        h('p', { class: 'small muted' }, `Ordem sugerida (do mais simples ao mais difícil): ${WEEK_ORDER.map(label).join(', ')}.`),
        select,
        h('button', { class: 'btn primary block', onclick: () => { startWeek(state, chosen); save(); rerender(); } }, 'Começar')),
      wk.history.length
        ? h('div', { class: 'card', style: { marginTop: '14px' } }, h('b', {}, 'Tons dominados: '), wk.history.map((x) => label(x.key)).join(', '))
        : null,
    );
    return;
  }

  const k = keyFromId(wk.key);
  const ev = evaluateWeek(state);
  const days = daysSince(wk.startedAt);
  const field = harmonicField(k);
  const link = (href, text) => h('a', { class: 'btn block', href }, text);

  add(root,
    topBar('Tom da Semana'),
    h('div', { class: 'card center' },
      h('div', { class: 'prompt' }, `🎯 ${label(wk.key)}`),
      h('p', { class: 'small muted' }, days === 0 ? 'Começou hoje' : `Há ${days} dia(s) em foco`),
      h('p', { class: 'small' }, `Escala: ${keyScale(k).map((n) => formatNote(n, notation)).join(' ')}`),
      h('p', { class: 'small' }, `Campo: ${field.map((d) => `${d.roman} ${formatChord(d.chord, notation)}`).join(' · ')}`)),

    h('h2', {}, 'Metas'),
    h('div', { class: 'card criteria' }, ev.criteria.map((c) => h('div', { class: 'criterion' },
      h('div', { class: 'row' }, h('span', {}, c.label), c.ok ? h('span', { class: 'ok' }, '✓') : h('span', { class: 'small muted' }, `${percent(c.rate)} · ${c.seen}/${c.minSeen}`)),
      h('div', { class: 'bar' }, h('div', { style: { width: `${Math.min(1, c.seen / c.minSeen) * (c.rate ?? 0) / c.min * 100}%` } })),
      h('div', { class: 'small muted' }, `Meta: ${Math.round(c.min * 100)}% em pelo menos ${c.minSeen} respostas`)))),

    ev.mastered
      ? h('div', { class: 'card', style: { marginTop: '14px' } },
        h('p', {}, `🏆 Você dominou ${label(wk.key)}!`),
        h('button', { class: 'btn primary block', onclick: () => { completeWeek(state); save(); rerender(); } }, `Avançar para ${label(nextKey(wk.key))}`))
      : days >= 7
        ? h('p', { class: 'small muted', style: { marginTop: '10px' } }, 'Já passou uma semana: tudo bem continuar até bater as metas.')
        : null,

    h('h2', {}, 'Treinar este tom'),
    h('div', { class: 'stack' },
      link(`#/app/cartas?key=${encodeURIComponent(wk.key)}&themes=notas,campo,progressoes`, '🃏 Cartas: escala, campo e progressões'),
      link(`#/app/transponha?key=${encodeURIComponent(wk.key)}`, `🔀 Transpor para ${label(wk.key)}`),
      link(`#/app/solfejo?key=${encodeURIComponent(wk.key)}`, '🎙️ Solfejo no tom'),
      link(`#/app/ouvido?key=${encodeURIComponent(wk.key)}`, '🎧 Ouvido no tom')),

    h('button', {
      class: 'btn block',
      style: { marginTop: '20px' },
      onclick: () => { if (confirm('Parar o foco neste tom?')) { stopWeek(state); save(); rerender(); } },
    }, 'Parar o Tom da Semana'),
  );
}
