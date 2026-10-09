/**
 * storage.js — Estado persistido no localStorage (uma chave, JSON).
 *
 * O `storage` é recebido por parâmetro (padrão: localStorage do navegador)
 * para que os testes possam usar um objeto falso.
 */
export const STORAGE_KEY = 'teoria-de-bolso:v1';
export const SCHEMA_VERSION = 1;
const APP_ID = 'teoria-de-bolso';

export const DEFAULT_SETTINGS = {
  notation: 'latin', // 'latin' (Dó-Ré-Mi) | 'anglo' (C-D-E)
  sound: true,
  instrument: 'both', // 'guitar' | 'keyboard' | 'both'
  sessionMinutes: 5,
  fsharp: 'F#', // grafia do tom de 6 acidentes: 'F#' | 'Gb'
  level: 1,
};

export function defaultState() {
  return {
    schemaVersion: SCHEMA_VERSION,
    settings: { ...DEFAULT_SETTINGS },
    srs: {},
    stats: { app: {}, theme: {}, key: {}, themeKey: {}, genKey: {}, records: {} },
    days: {},
    weekKey: { active: false, key: null, startedAt: null, baseline: null, history: [] },
    lastSetup: {}, // última configuração usada em cada app
  };
}

/**
 * Migrações entre versões do formato: MIGRATIONS[n] converte da versão n
 * para n + 1. Vazio por enquanto; fica aqui para o futuro.
 */
const MIGRATIONS = {};

/** Valida, migra e completa com padrões um estado vindo de fora. */
export function normalize(raw) {
  if (!raw || typeof raw !== 'object') throw new Error('Arquivo de progresso inválido.');
  let s = raw;
  let v = s.schemaVersion ?? 1;
  if (v > SCHEMA_VERSION) throw new Error('Este progresso foi salvo por uma versão mais nova do app.');
  while (v < SCHEMA_VERSION) s = MIGRATIONS[v++](s);
  const d = defaultState();
  return {
    schemaVersion: SCHEMA_VERSION,
    settings: { ...d.settings, ...s.settings },
    srs: { ...s.srs },
    stats: { ...d.stats, ...s.stats },
    days: { ...s.days },
    weekKey: { ...d.weekKey, ...s.weekKey },
    lastSetup: { ...s.lastSetup },
  };
}

export function loadState(storage = globalThis.localStorage) {
  try {
    const text = storage?.getItem(STORAGE_KEY);
    return text ? normalize(JSON.parse(text)) : defaultState();
  } catch {
    return defaultState();
  }
}

/** Salva; devolve false se o navegador recusar (modo privado, cota cheia…). */
export function saveState(state, storage = globalThis.localStorage) {
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}

export function exportState(state, now = Date.now()) {
  return JSON.stringify({ app: APP_ID, exportedAt: new Date(now).toISOString(), ...state });
}

export function importState(text) {
  const raw = JSON.parse(text);
  if (raw.app && raw.app !== APP_ID) throw new Error('Este arquivo não é um progresso do Teoria de Bolso.');
  const { app, exportedAt, ...rest } = raw;
  return normalize(rest);
}
