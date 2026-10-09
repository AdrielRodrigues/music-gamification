/**
 * progressions.js — Progressões por graus, transposição e algarismos romanos.
 *
 * Uma progressão é descrita por GRAUS, não por acordes: assim a mesma
 * progressão existe em qualquer tom. É exatamente o pensamento que dá
 * independência das cifras.
 */
import { parseNote, pitchClass } from './notes.js';
import { between, transpose } from './intervals.js';
import { chord } from './chords.js';
import { harmonicField, key, keyScale, roman } from './keys.js';

/** Catálogo de progressões comuns (o nome é derivado dos graus). */
export const PROGRESSIONS = [
  { id: 'pop', mode: 'major', degrees: [1, 5, 6, 4], hint: 'a progressão mais comum do pop' },
  { id: 'doowop', mode: 'major', degrees: [1, 6, 4, 5], hint: 'baladas dos anos 50, muito pop' },
  { id: 'cinco-um', mode: 'major', degrees: [2, 5, 1], sevenths: true, hint: 'a cadência do jazz e da bossa nova' },
  { id: 'rock', mode: 'major', degrees: [1, 4, 5], hint: 'rock, blues, forró, sertanejo' },
  { id: 'cadencia', mode: 'major', degrees: [1, 4, 5, 1], hint: 'cadência completa: sai e volta para casa' },
  { id: 'sensivel', mode: 'major', degrees: [6, 4, 1, 5], hint: 'variação "triste" do pop' },
  { id: 'turnaround', mode: 'major', degrees: [1, 6, 2, 5], hint: 'volta clássica para o começo' },
  { id: 'menor-pop', mode: 'minor', degrees: [1, 6, 3, 7], hint: 'pop/rock em tom menor' },
  { id: 'menor-cadencia', mode: 'minor', degrees: [1, 4, 5, 1], harmonicV: true, hint: 'cadência menor com V maior' },
  { id: 'andaluza', mode: 'minor', degrees: [1, 7, 6, 5], harmonicV: true, hint: 'cadência andaluza (flamenco)' },
];

export function getProgression(id) {
  return PROGRESSIONS.find((p) => p.id === id);
}

/** Acordes da progressão no tom dado. */
export function realize(prog, k) {
  const field = harmonicField(k, { sevenths: !!prog.sevenths, harmonicV: !!prog.harmonicV });
  return prog.degrees.map((d) => field[d - 1].chord);
}

/** Algarismos romanos da progressão (independem do tom). */
export function progressionRomans(prog) {
  const k = key(parseNote(prog.mode === 'major' ? 'C' : 'A'), prog.mode);
  return toRomans(realize(prog, k), k);
}

export function progressionName(prog) {
  return progressionRomans(prog).join('–');
}

/**
 * Transpõe acordes de um tom para outro. Cada fundamental mantém a mesma
 * distância (intervalo) da tônica, o que preserva a grafia certa no tom novo.
 */
export function transposeChords(chords, fromKey, toKey) {
  return chords.map((ch) => {
    const iv = between(fromKey.tonic, ch.root);
    return chord(transpose(toKey.tonic, iv), ch.type, ch.inversion);
  });
}

/**
 * Converte acordes em algarismos romanos no tom dado.
 * Acordes de fora do campo: tenta ler como dominante secundário (V/x);
 * se não for, usa grau cromático (♭VII, ♯IV…).
 */
export function toRomans(chords, k) {
  const scale = keyScale(k);
  const triads = harmonicField(k);
  const sevenths = harmonicField(k, { sevenths: true });
  return chords.map((ch) => {
    // Diatônico: fundamental na escala e tipo igual ao da tríade ou da tétrade do grau.
    const idx = scale.findIndex((n) => pitchClass(n) === pitchClass(ch.root));
    if (idx >= 0 && [triads[idx].chord.type, sevenths[idx].chord.type].includes(ch.type)) {
      return roman(idx + 1, ch.type);
    }
    // V/x: acorde maior ou com 7ª cuja fundamental é a 5ª justa de um grau do campo.
    if (['maj', '7'].includes(ch.type)) {
      const target = triads.findIndex((d, i) => i > 0 && d.chord.type !== 'dim'
        && pitchClass(transpose(d.chord.root, '5J')) === pitchClass(ch.root));
      if (target > 0) return `V${ch.type === '7' ? '7' : ''}/${triads[target].roman}`;
    }
    // Grau cromático: compara com a letra correspondente da escala.
    const letterIdx = scale.findIndex((n) => n.letter === ch.root.letter);
    const diff = ch.root.acc - scale[letterIdx].acc;
    const prefix = diff < 0 ? '♭'.repeat(-diff) : '♯'.repeat(diff);
    return prefix + roman(letterIdx + 1, ch.type);
  });
}
