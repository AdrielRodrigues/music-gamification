/**
 * router.js — Roteamento por hash (#/app/cartas?key=D).
 * Hash funciona no GitHub Pages sem configuração de servidor.
 */
export function parseHash(hash = location.hash) {
  const raw = hash.replace(/^#\/?/, '');
  const [path, qs = ''] = raw.split('?');
  return {
    parts: path.split('/').filter(Boolean),
    query: Object.fromEntries(new URLSearchParams(qs)),
  };
}

/**
 * routes: [{ match: (parts) => params | null, render: (root, params, query) => cleanup? }]
 * A primeira rota que casar é desenhada; a anterior recebe a chamada de limpeza.
 */
export function startRouter(root, routes) {
  let cleanup = null;
  function go() {
    if (typeof cleanup === 'function') cleanup();
    cleanup = null;
    root.replaceChildren();
    window.scrollTo(0, 0);
    const { parts, query } = parseHash();
    for (const r of routes) {
      const params = r.match(parts);
      if (params) {
        cleanup = r.render(root, params, query);
        return;
      }
    }
    location.hash = '#/';
  }
  window.addEventListener('hashchange', go);
  go();
}
