/**
 * Garante que todo arquivo do app está na lista de cache offline do
 * service worker (senão ele quebra sem internet).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;

function filesUnder(dir) {
  return readdirSync(join(ROOT, dir)).flatMap((name) => {
    const full = join(ROOT, dir, name);
    return statSync(full).isDirectory() ? filesUnder(relative(ROOT, full)) : [relative(ROOT, full)];
  });
}

test('sw.js lista todos os arquivos do app', () => {
  const sw = readFileSync(join(ROOT, 'sw.js'), 'utf8');
  const listed = new Set([...sw.matchAll(/'([^']+\.(?:js|css|html|png|svg|webmanifest))'/g)].map((m) => m[1]));
  const needed = [...filesUnder('src'), ...filesUnder('css'), ...filesUnder('icons'), 'index.html', 'manifest.webmanifest'];
  const missing = needed.filter((f) => !listed.has(f));
  assert.deepEqual(missing, [], `faltam no ASSETS do sw.js: ${missing.join(', ')}`);
  for (const f of listed) assert.ok(needed.includes(f), `sw.js lista arquivo inexistente: ${f}`);
});
