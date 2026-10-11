/**
 * Todo treino precisa ter perguntas em todos os modos e níveis
 * (senão a sessão abre com "Nenhum gerador disponível").
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { APPS } from '../src/apps/registry.js';

test('todo app tem perguntas em cada modo e nível', () => {
  const empty = [];
  for (const app of APPS) {
    for (const mode of app.setup.modes?.map((m) => m.value) ?? [null]) {
      for (const level of [1, 2, 3]) {
        for (const key of ['random', 'C', 'Am']) {
          const config = { mode, level, key, themes: app.setup.themes };
          if (!app.generators(config).length) empty.push(`${app.id} / ${mode ?? '-'} / nível ${level} / tom ${key}`);
        }
      }
    }
  }
  assert.deepEqual(empty, []);
});
