/**
 * Lista de aplicações do menu principal.
 *
 * Para criar um app novo: um arquivo em src/apps/ que exporta
 *   { id, title, icon, tagline, skill, contexts, description, why,
 *     setup, generators(config), render(question, ui) }
 * e uma linha aqui. O runner (src/ui/runner.js) cuida do resto.
 */
import cartas from './cartas.js';
import relampago from './relampago.js';
import detetive from './detetive.js';
import transponha from './transponha.js';
import monte from './monte.js';
import ouvido from './ouvido.js';
import solfejo from './solfejo.js';
import braco from './braco.js';
import teclado from './teclado.js';

export const APPS = [cartas, relampago, detetive, transponha, monte, ouvido, solfejo, braco, teclado];

export const getApp = (id) => APPS.find((a) => a.id === id);

/** Situações do dia a dia e o que cabe em cada uma. */
export const CONTEXTS = [
  { id: 'fila', label: '🚶 Fila · 5 min', hint: 'Sem som, uma mão só' },
  { id: 'espera', label: '🪑 Espera · 10 min', hint: 'Dá para pensar com calma' },
  { id: 'fone', label: '🎧 Com fone', hint: 'Treino auditivo' },
];

/** Ordena o menu: o app do instrumento que você não toca vai para o fim. */
export function orderedApps(settings) {
  if (settings.instrument === 'both') return APPS;
  const other = settings.instrument === 'guitar' ? 'keyboard' : 'guitar';
  return [...APPS.filter((a) => a.instrument !== other), ...APPS.filter((a) => a.instrument === other)];
}
