/**
 * audioEvents.js — Descreve sons a partir da teoria, sem tocar nada.
 *
 * Um evento é { m: [notas MIDI], d: duração em segundos }; { m: [] } é pausa.
 * Quem toca é src/ui/audio.js. Manter isto puro permite testar os geradores.
 */
import { chordMidis, harmonicField, midi, mod, pitchClass, SCALES } from '../theory/index.js';

/** MIDI da tônica entre Dó4 (60) e Si4 (71). */
export function tonicMidi(k) {
  return 60 + mod(pitchClass(k.tonic), 12);
}

/** MIDI de um grau (1–8; 8 = oitava) acima da tônica. */
export function degreeMidi(k, degree) {
  const semis = SCALES[k.mode === 'major' ? 'major' : 'minor'].semis;
  return tonicMidi(k) + semis[(degree - 1) % 7] + 12 * Math.floor((degree - 1) / 7);
}

/** Acorde com baixo na oitava 2–3 e vozes fechadas por volta do Dó central. */
export function chordEvent(ch, d = 0.8) {
  const bass = 36 + mod(midi(ch.root, -1), 12);
  return { m: [bass, ...chordMidis(ch, 55)], d };
}

export const noteEvent = (m, d = 0.6) => ({ m: [m], d });
export const rest = (d = 0.3) => ({ m: [], d });

/** Cadência I–IV–V–I (i–iv–V–i no menor): estabelece o tom no ouvido. */
export function cadence(k) {
  const field = harmonicField(k, { harmonicV: true });
  return [...[1, 4, 5].map((d) => chordEvent(field[d - 1].chord, 0.6)), chordEvent(field[0].chord, 1.0), rest(0.4)];
}
