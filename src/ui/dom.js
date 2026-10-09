/**
 * dom.js — Mini-helper para criar elementos sem framework.
 *
 *   h('button', { class: 'btn', onclick: fn }, 'Texto')
 *
 * Atributos "on*" viram event listeners; false/null/undefined são ignorados;
 * filhos podem ser strings, números, elementos ou arrays (aninhados).
 */
export function h(tag, attrs = {}, ...children) {
  const el = document.createElement(tag);
  setAttrs(el, attrs);
  append(el, children);
  return el;
}

const SVG_NS = 'http://www.w3.org/2000/svg';

/** Igual a h(), mas para elementos SVG. */
export function s(tag, attrs = {}, ...children) {
  const el = document.createElementNS(SVG_NS, tag);
  setAttrs(el, attrs);
  append(el, children);
  return el;
}

function setAttrs(el, attrs) {
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v == null || v === false) continue;
    if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v);
    else if (k === 'class') el.setAttribute('class', v);
    else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
    else el.setAttribute(k, v === true ? '' : v);
  }
}

function append(el, children) {
  for (const c of children.flat(Infinity)) {
    if (c == null || c === false) continue;
    el.append(c instanceof Node ? c : String(c));
  }
}

/**
 * Acrescenta filhos a um elemento existente com as mesmas regras de h():
 * ignora null/false e achata arrays (o append nativo escreveria "null").
 */
export function add(el, ...children) {
  append(el, children);
  return el;
}

export function clear(el) {
  while (el.firstChild) el.removeChild(el.firstChild);
  return el;
}

/** Botões de escolha única (ex.: 5 / 10 min). */
export function segmented(options, value, onChange) {
  const wrap = h('div', { class: 'segmented', role: 'radiogroup' });
  const render = () => {
    clear(wrap);
    for (const o of options) {
      wrap.append(h('button', {
        type: 'button',
        role: 'radio',
        'aria-checked': String(o.value === value),
        class: o.value === value ? 'on' : '',
        onclick: () => { value = o.value; render(); onChange(o.value); },
      }, o.label));
    }
  };
  render();
  return wrap;
}

/** Chips de múltipla escolha; mantém pelo menos um marcado. */
export function chipToggles(options, values, onChange) {
  const set = new Set(values);
  const wrap = h('div', { class: 'chips' });
  const render = () => {
    clear(wrap);
    for (const o of options) {
      wrap.append(h('button', {
        type: 'button',
        'aria-pressed': String(set.has(o.value)),
        class: `chip${set.has(o.value) ? ' on' : ''}`,
        onclick: () => {
          if (set.has(o.value) && set.size > 1) set.delete(o.value);
          else set.add(o.value);
          render();
          onChange([...set]);
        },
      }, o.label));
    }
  };
  render();
  return wrap;
}

/** Barra superior com voltar, título e um elemento opcional à direita. */
export function topBar(title, { back = '#/', right = null } = {}) {
  return h('header', { class: 'topbar' },
    back ? h('a', { class: 'back', href: back, 'aria-label': 'Voltar' }, '←') : h('span'),
    h('h1', {}, title),
    right ?? h('span'));
}

export const percent = (r) => (r == null ? '—' : `${Math.round(r * 100)}%`);
