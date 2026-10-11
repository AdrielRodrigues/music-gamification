/**
 * Catálogo de temas e geradores de perguntas.
 */
import { NOTE_GENERATORS } from './notes.js';
import { HARMONY_GENERATORS } from './harmony.js';
import { PROGRESSION_GENERATORS } from './progressions.js';
import { INSTRUMENT_GENERATORS } from './instruments.js';
import { CHORD_GENERATORS } from './chords.js';
import { EAR_GENERATORS } from './ear.js';
import { keyFromId } from '../theory/index.js';

/** Os 6 temas, do básico ao avançado. */
export const THEMES = [
  { id: 'notas', name: 'Notas e intervalos', short: 'Notas' },
  { id: 'campo', name: 'Campo harmônico', short: 'Campo' },
  { id: 'progressoes', name: 'Progressões e transposição', short: 'Progressões' },
  { id: 'instrumento', name: 'Braço e teclado', short: 'Instrum.' },
  { id: 'acordes', name: 'Formação de acordes', short: 'Acordes' },
  { id: 'ouvido', name: 'Treino auditivo', short: 'Ouvido' },
];

export const themeName = (id) => THEMES.find((t) => t.id === id)?.name ?? id;

export const GENERATORS = [
  ...NOTE_GENERATORS,
  ...HARMONY_GENERATORS,
  ...PROGRESSION_GENERATORS,
  ...INSTRUMENT_GENERATORS,
  ...CHORD_GENERATORS,
  ...EAR_GENERATORS,
];

export const getGenerator = (id) => GENERATORS.find((g) => g.id === id);

export const LEVELS = [
  { id: 1, name: 'Básico' },
  { id: 2, name: 'Intermediário' },
  { id: 3, name: 'Avançado' },
];

/**
 * Filtra geradores. Todos os critérios são opcionais.
 *   ids:       lista explícita de ids
 *   themes:    só desses temas
 *   level:     só geradores com nível ≤ level
 *   mc:        true = só múltipla escolha
 *   audio:     false = exclui os que só funcionam com som; 'only' = só eles
 *   key:       tom fixo da sessão (id; 'random'/null = sem tom fixo). Com tom fixo, exclui
 *              "descobrir o tom" (a resposta seria sempre a mesma) e os geradores cujo
 *              `modes` não inclui o modo do tom (ex.: dominante secundário só em maior)
 */
export function selectGenerators({ ids, themes, level = 3, mc, audio, key } = {}) {
  const fixedMode = key && key !== 'random' ? keyFromId(key).mode : null;
  return GENERATORS.filter((g) => {
    if (ids && !ids.includes(g.id)) return false;
    if (themes && !themes.includes(g.theme)) return false;
    if (g.level > level) return false;
    if (mc && !g.mc) return false;
    if (audio === false && g.audioOnly) return false;
    if (audio === 'only' && !g.audioOnly) return false;
    if (fixedMode && g.randomKeyOnly) return false;
    if (fixedMode && g.modes && !g.modes.includes(fixedMode)) return false;
    return true;
  });
}
