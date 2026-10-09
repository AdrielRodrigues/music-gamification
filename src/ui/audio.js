/**
 * audio.js — Sintetizador mínimo com Web Audio (sem arquivos de som).
 *
 * Toca listas de eventos { m: [notas MIDI], d: duração em segundos }
 * produzidas pelos geradores. Cada nota é um oscilador triangular com
 * envelope curto, passando por um filtro passa-baixa (som de "piano elétrico").
 *
 * Observação: no iPhone o som do Web Audio respeita a chave de silencioso.
 */
let ctx = null;
let master = null;

function audioContext() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

/** Saída nova a cada reprodução: parar = desconectar a anterior. */
function freshOutput(ac) {
  if (master) master.disconnect();
  master = ac.createGain();
  master.gain.value = 0.9;
  const filter = ac.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 2800;
  master.connect(filter).connect(ac.destination);
  return master;
}

const freq = (m) => 440 * 2 ** ((m - 69) / 12);

function tone(ac, out, m, start, dur, vol) {
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = 'triangle';
  osc.frequency.value = freq(m);
  gain.gain.setValueAtTime(0, start);
  gain.gain.linearRampToValueAtTime(vol, start + 0.01);
  gain.gain.exponentialRampToValueAtTime(vol * 0.5, start + 0.15);
  gain.gain.setValueAtTime(vol * 0.5, start + dur);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + dur + 0.25);
  osc.connect(gain).connect(out);
  osc.start(start);
  osc.stop(start + dur + 0.3);
}

/** Toca os eventos em sequência. Devolve uma Promise resolvida ao fim. */
export function playEvents(events) {
  const ac = audioContext();
  if (!ac || !events?.length) return Promise.resolve();
  const out = freshOutput(ac);
  let t = ac.currentTime + 0.05;
  for (const ev of events) {
    const vol = 0.32 / Math.sqrt(Math.max(1, ev.m.length));
    for (const m of ev.m) tone(ac, out, m, t, ev.d * 0.95, vol);
    t += ev.d;
  }
  const ms = (t - ac.currentTime) * 1000;
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function playNote(m, d = 0.5) {
  return playEvents([{ m: [m], d }]);
}

export function stopAudio() {
  if (master) master.disconnect();
  master = null;
}

/** Destrava o áudio no primeiro toque (exigência dos navegadores móveis). */
export function unlockAudio() {
  audioContext();
}
