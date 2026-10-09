/**
 * main.js — Ponto de entrada: carrega o estado, liga as rotas e o modo offline.
 */
import { loadState, saveState } from './core/storage.js';
import { startRouter } from './ui/router.js';
import { runApp } from './ui/runner.js';
import { getApp } from './apps/registry.js';
import { renderHub } from './ui/screens/hub.js';
import { renderProgress } from './ui/screens/progress.js';
import { renderSettings } from './ui/screens/settings.js';
import { renderWeekKey } from './ui/screens/weekKey.js';
import { renderGuide } from './ui/screens/guide.js';

const ctx = {
  state: loadState(),
  save() {
    if (!saveState(ctx.state)) console.warn('Não foi possível salvar o progresso (armazenamento cheio ou bloqueado).');
  },
  /** Troca o estado inteiro (importar backup, apagar progresso). */
  replaceState(next) {
    ctx.state = next;
    ctx.save();
  },
};

// Os objetos das telas leem ctx.state na hora de desenhar, então sempre veem o estado atual.
const screen = (fn) => (root, params, query) => fn(root, { ...ctx, state: ctx.state }, params, query);

startRouter(document.getElementById('app'), [
  { match: (p) => (p.length === 0 ? {} : null), render: screen(renderHub) },
  {
    match: (p) => (p[0] === 'app' && getApp(p[1]) ? { app: getApp(p[1]) } : null),
    render: (root, { app }, query) => runApp(root, app, { state: ctx.state, save: ctx.save }, query),
  },
  { match: (p) => (p[0] === 'progresso' ? {} : null), render: screen(renderProgress) },
  { match: (p) => (p[0] === 'config' ? {} : null), render: screen(renderSettings) },
  { match: (p) => (p[0] === 'tom-da-semana' ? {} : null), render: screen(renderWeekKey) },
  { match: (p) => (p[0] === 'guia' ? {} : null), render: screen(renderGuide) },
]);

// Pede ao navegador para não apagar os dados (importante no iPhone).
navigator.storage?.persist?.();

// Modo offline (PWA). Só funciona servido por http(s), não abrindo o arquivo direto.
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  navigator.serviceWorker.register('./sw.js').catch(() => {});
}
