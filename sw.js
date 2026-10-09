/**
 * sw.js — Service worker: deixa o app funcionando offline (filas sem sinal).
 *
 * Estratégia "stale-while-revalidate": responde na hora com o que está em
 * cache e, em paralelo, busca a versão nova para a próxima abertura.
 *
 * Ao adicionar um arquivo ao app, inclua-o em ASSETS (um teste confere isso)
 * e aumente VERSION para forçar a atualização do cache.
 */
const VERSION = 'v1';
const CACHE = `teoria-de-bolso-${VERSION}`;

const ASSETS = [
  './',
  'index.html',
  'manifest.webmanifest',
  'css/style.css',
  'icons/icon.svg',
  'icons/icon-180.png',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'src/main.js',
  'src/apps/braco.js',
  'src/apps/cartas.js',
  'src/apps/detetive.js',
  'src/apps/monte.js',
  'src/apps/ouvido.js',
  'src/apps/registry.js',
  'src/apps/relampago.js',
  'src/apps/solfejo.js',
  'src/apps/teclado.js',
  'src/apps/transponha.js',
  'src/core/progress.js',
  'src/core/rng.js',
  'src/core/session.js',
  'src/core/srs.js',
  'src/core/storage.js',
  'src/core/weekKey.js',
  'src/questions/audioEvents.js',
  'src/questions/chords.js',
  'src/questions/common.js',
  'src/questions/ear.js',
  'src/questions/harmony.js',
  'src/questions/index.js',
  'src/questions/instruments.js',
  'src/questions/notes.js',
  'src/questions/progressions.js',
  'src/theory/chords.js',
  'src/theory/index.js',
  'src/theory/instruments.js',
  'src/theory/intervals.js',
  'src/theory/keys.js',
  'src/theory/notes.js',
  'src/theory/progressions.js',
  'src/theory/scales.js',
  'src/ui/audio.js',
  'src/ui/components/choices.js',
  'src/ui/components/fretboard.js',
  'src/ui/components/keyboard.js',
  'src/ui/components/noteBuilder.js',
  'src/ui/components/sessionSetup.js',
  'src/ui/dom.js',
  'src/ui/router.js',
  'src/ui/runner.js',
  'src/ui/screens/guide.js',
  'src/ui/screens/hub.js',
  'src/ui/screens/progress.js',
  'src/ui/screens/settings.js',
  'src/ui/screens/weekKey.js',
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET' || !event.request.url.startsWith(self.location.origin)) return;
  event.respondWith(
    caches.open(CACHE).then(async (cache) => {
      const cached = await cache.match(event.request, { ignoreSearch: true });
      const fresh = fetch(event.request)
        .then((res) => {
          if (res.ok) cache.put(event.request, res.clone());
          return res;
        })
        .catch(() => cached);
      return cached || fresh;
    }),
  );
});
