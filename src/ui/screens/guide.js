/** Guia: que tipo de treino desenvolve cada habilidade, e quando usar. */
import { add, h, topBar } from '../dom.js';
import { APPS, CONTEXTS } from '../../apps/registry.js';

const PRINCIPLES = [
  { skill: 'Recordar', how: 'Pensar na resposta antes de ver', builds: 'Memória dos fatos (escalas, campos, intervalos)' },
  { skill: 'Velocidade', how: 'Responder contra o relógio', builds: 'Acesso instantâneo, necessário para tocar ao vivo' },
  { skill: 'Construir', how: 'Montar a escala ou o acorde nota a nota', builds: 'Grafia correta e compreensão da estrutura' },
  { skill: 'Aplicar', how: 'Transpor cifras e descobrir o tom', builds: 'Independência das cifras' },
  { skill: 'Ouvir', how: 'Reconhecer graus depois de uma cadência', builds: 'Tocar de ouvido (funções, não notas soltas)' },
  { skill: 'Audiação', how: 'Cantar mentalmente e depois conferir', builds: 'Ouvir a música por dentro antes de tocar' },
  { skill: 'Mapear', how: 'Achar notas e funções no instrumento', builds: 'Levar a teoria para os dedos' },
];

export function renderGuide(root) {
  add(root,
    topBar('Qual treino desenvolve o quê'),
    h('div', { class: 'card stack' },
      h('p', {}, 'Para tocar a partir do tom, de ouvido e transpor, a teoria precisa estar disponível na hora. Cada treino ataca uma parte disso:')),
    h('div', { class: 'stack', style: { marginTop: '12px' } }, PRINCIPLES.map((p) => {
      const apps = APPS.filter((a) => a.skill === p.skill);
      return h('div', { class: 'card' },
        h('b', {}, p.skill),
        h('p', { class: 'small', style: { margin: '4px 0' } }, `${p.how} → ${p.builds}.`),
        h('div', { class: 'row wrap' }, apps.map((a) => h('a', { class: 'chip', href: `#/app/${a.id}`, style: { textDecoration: 'none', color: 'inherit', display: 'inline-flex', alignItems: 'center' } }, `${a.icon} ${a.title}`))));
    })),
    h('h2', {}, 'Rotina sugerida'),
    h('div', { class: 'card stack' }, CONTEXTS.map((c) => h('p', { class: 'small' },
      h('b', {}, `${c.label}: `),
      APPS.filter((a) => a.contexts.includes(c.id)).map((a) => a.title).join(', '),
      h('span', { class: 'muted' }, ` (${c.hint.toLowerCase()})`)))),
    h('h2', {}, 'Dicas'),
    h('div', { class: 'card stack small' },
      h('p', {}, '• Misture temas e tons ("Aleatório"): fixa melhor do que treinar um de cada vez.'),
      h('p', {}, '• Use o Tom da Semana para aprofundar: um tom até dominar, depois o próximo.'),
      h('p', {}, '• Comece no nível Básico. Subir de nível muda as perguntas, não só a velocidade.'),
      h('p', {}, '• Erros não são ruins: o que você erra volta mais vezes até fixar.')),
  );
}
