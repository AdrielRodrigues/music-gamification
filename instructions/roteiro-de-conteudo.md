# Mapa de estudo de teoria musical e próxima versão do Teoria de Bolso

## Contexto

A primeira versão do app (commit `c9dbe21`) cobre os 6 temas do pedido original. Este roteiro responde a duas perguntas: o que a teoria musical abrange e o que ainda falta no app. Cada conteúdo vem com o **motivo** de estudá-lo.

Este documento traz:
1. o mapa completo: o que é, por que estudar e status no app;
2. a ordem recomendada para as próximas versões, com a Fase 1 detalhada para implementar.

O objetivo do usuário é independência das cifras: tocar a partir do tom, de ouvido, transpor e entender a harmonia, em guitarra, violão e teclado.

Legenda: ✅ coberto · 🟡 parcial · ❌ ausente

## 1. Mapa de conteúdo

### Bloco 1 — Fundamentos (o alfabeto)
| Conteúdo | Por que estudar (para o seu objetivo) | App |
|---|---|---|
| Notas, ♯/♭, enarmonia | Cifra é nome de nota; sem isso nada se lê | ✅ |
| Tom/semitom, escala maior e fórmula | A régua que define os 12 tons. "Tocar a partir do tom" começa por saber as 7 notas dele | ✅ |
| Armadura e ciclo de quintas | Diz na hora quantos ♯/♭ um tom tem. Explica por que os acordes "andam em quintas" (V→I) e quais tons são vizinhos | ❌ |
| Intervalos (subindo, descendo, inversão) | Acorde é pilha de intervalos e melodia é sequência de intervalos: base do ouvido | 🟡 falta descendente e inversão |

### Bloco 2 — Harmonia do tom (o coração do objetivo)
| Conteúdo | Por que estudar | App |
|---|---|---|
| Tríades (maior, menor, dim, aum) | Os acordes básicos de qualquer cifra | ✅ |
| Campo harmônico maior e graus romanos | A maioria das músicas populares usa só esses 7 acordes: saber o campo = prever os acordes | ✅ |
| Funções (tônica, subdominante, dominante) e tensão/repouso | Explicam por que a música "pede" certo acorde; é o que permite adivinhar certo ao tirar de ouvido | ✅ |
| Tom menor (natural, harmônica, relativa) | Em menor aparece o V maior "fora do campo"; sem isso, Lá menor e Dó maior se confundem | 🟡 falta o campo da harmônica completo e a melódica |
| Tétrades (7, maj7, m7, m7(♭5)) | Bossa, MPB, gospel e jazz usam o tempo todo | ✅ |
| Inversões e baixo invertido (C/E) | Cifras com barra, linhas de baixo, passagens suaves | 🟡 só no teclado e em perguntas; no braço não |
| Cadências (V–I, IV–I, V–vi, meia-cadência) | São a "pontuação" da música: mostram onde a frase termina e preveem o final | ❌ |

### Bloco 3 — Aplicação
| Conteúdo | Por que estudar | App |
|---|---|---|
| Progressões comuns e transposição por graus | Tocar a mesma música em qualquer tom | ✅ |
| Descobrir o tom pelos acordes | Primeiro passo para tocar sem a cifra | ✅ |
| Forma (verso/refrão/ponte, blues de 12 compassos) | Saber quanto dura cada parte e quando ela volta; acompanhar sem papel | ❌ |
| Repertório (progressões de músicas conhecidas) | Transfere o treino para música de verdade | ❌ |

### Bloco 4 — Harmonia além do campo (muito usada na música brasileira)
| Conteúdo | Por que estudar | App |
|---|---|---|
| Dominantes secundários (V7/x) | O "acorde de fora" mais comum: E7 antes de Am em Dó | 🟡 só pergunta escrita, nível avançado |
| Empréstimo modal (iv, ♭VI, ♭VII no maior) | O outro "acorde de fora" típico do pop/rock (ex.: B♭ em Dó) | ❌ |
| Diminuto de passagem e SubV | Marcas do samba, choro e bossa | ❌ |
| Tensões e sufixos (sus2/4, 6, add9, 7(9), m7(11), 7(♭9)) | Cifras de MPB vêm cheias disso; sem saber, viram hieróglifos | ❌ |
| Modulação (mudança de tom) | Muitas músicas sobem meio tom no fim ou passam para a relativa | ❌ |

### Bloco 5 — Melodia e improviso
| Conteúdo | Por que estudar | App |
|---|---|---|
| Pentatônica maior/menor e escala blues | O caminho mais curto para solar e fazer frases no rock, blues e pop | ❌ |
| Modos (mixolídio, dórico…) | Sonoridades específicas: o mixolídio é a cara do baião e do forró | ❌ |
| Arpejos e notas do acorde | Solo que "conversa" com a harmonia | 🟡 só fundamental/terça/quinta |

### Ritmo (paralelo a tudo; hoje zerado)
| Conteúdo | Por que estudar | App |
|---|---|---|
| Pulsação, compasso (2/4, 3/4, 4/4, 6/8), subdivisão | Harmonia certa no ritmo errado não soa; acompanhar exige saber onde cai o tempo forte | ❌ |
| Síncope e levadas (samba, bossa, baião, xote, balada) | É o que faz o acompanhamento soar "de verdade" | ❌ |
| Leitura de partitura | Opcional para o objetivo (tocar de ouvido) | fora do escopo |

### Ouvido (paralelo)
| Conteúdo | Por que estudar | App |
|---|---|---|
| Graus na tonalidade e intervalos | Base do ouvido funcional | ✅ |
| Tensão/repouso, solfejo | Ouvir a música por dentro | ✅ |
| **Qualidade do acorde** (maior/menor/7/dim) de ouvido | Tirar música = decidir se o acorde é maior ou menor | ❌ |
| **Linha de baixo** de ouvido | O baixo é a pista mais fácil para achar o acorde | ❌ |
| **Progressões de ouvido** (I–V–vi–IV × I–vi–IV–V…) | É literalmente "tirar a harmonia de ouvido" | ❌ |
| Ditado melódico curto | Tirar melodias e solos | ❌ |

### Instrumento
| Conteúdo | Por que estudar | App |
|---|---|---|
| Notas no braço, pestanas de Mi e Lá | Achar qualquer acorde no braço | ✅ |
| CAGED completo (formas de Dó, Sol, Ré) | Tocar o mesmo acorde em 5 regiões; base de arranjo e solo | 🟡 2 de 5 |
| Escalas e intervalos no braço | Solar e achar notas sem decorar | ❌ |
| Teclado: escalas e voicings de acompanhamento | Acompanhar com as duas mãos | 🟡 só tríades e inversões |

### Transversal: ensinar, não só perguntar
| Conteúdo | Por que | App |
|---|---|---|
| **Lições curtas** (1 tela por conceito, com exemplo gerado pela teoria) | O app hoje só testa; quem não conhece o conceito não tem de onde aprender | ❌ |
| Trilha guiada, revisão diária com datas, conquistas | Saber por onde começar e manter o hábito | 🟡 só a sequência de dias e o recorde |

## 2. Ordem recomendada

1. **Fase 1 (próxima):** lições, ouvido para tirar música e leitura de cifra real. São as lacunas mais ligadas ao objetivo e encaixam nos apps atuais.
2. **Fase 2:** ritmo (app novo com percussão sintetizada; levadas brasileiras).
3. **Fase 3:** improviso e braço (pentatônica, blues, modos, CAGED completo, escalas no braço).
4. **Fase 4:** repertório e forma; trilha guiada, revisão diária com datas e conquistas.

## 3. Fase 1 — implementação

### 3a. Lições (transversal)
- `src/lessons/index.js`: uma lição por conteúdo do mapa, no formato `{ id, theme, title, why, body: [parágrafos], example(settings) }`. O `example` gera um exemplo com a teoria (ex.: campo de Dó com `harmonicField`), respeitando a notação escolhida.
- Tela `src/ui/screens/lesson.js` na rota `#/licao/:id`, mais um índice "📖 Aprender" no menu (`hub.js`), agrupado pelos blocos do mapa.
- Em `sessionSetup.js`, um link "📖 Ler a lição" para cada tema selecionado.
- Cada gerador ganha um campo opcional `lesson` (id). A explicação do feedback (`runner.js`, `feedbackBox`) passa a ter um link "Entender melhor".

### 3b. Ouvido para tirar música (`src/questions/ear.js`, app `ouvido.js`)
- `ouvido.qualidade`: acorde isolado; responder maior/menor (básico), + dim e 7 (intermediário), + maj7 e m7 (avançado).
- `ouvido.baixo`: cadência e depois 3–4 notas graves; responder os graus do baixo.
- `ouvido.progressao`: ouvir uma progressão do catálogo `PROGRESSIONS` e escolher qual é.
- Novos modos no app Ouvido: "Qualidade", "Baixo", "Progressões". Reusar `chordEvent`, `cadence` e `degreeMidi` de `src/questions/audioEvents.js`.

### 3c. Cifra real
- `src/theory/chords.js`: novos tipos em `CHORD_TYPES` (`sus2`, `sus4`, `6`, `m6`, `add9`, `7(9)`, `maj7(9)`, `m7(9)`, `m7(11)`, `7(♭9)`, `7(13)`), com leitura e escrita em `parseChord`/`formatChord`. As tensões entram como intervalos compostos (9M, 11J, 13M), que `semitones`/`transpose` já suportam.
- `src/theory/keys.js`: `borrowedChords(k)` (iv, ♭VI, ♭VII do homônimo menor) e `cadenceName(a, b, k)`.
- Novos geradores:
  - `notas.armadura`: quantos ♯/♭ tem um tom, e o inverso. Usa `keySignature`.
  - `notas.ciclo`: vizinhos no ciclo de quintas.
  - `notas.intervaloAbaixo` e `notas.inversaoIntervalo`.
  - `acordes.tensoes`: quais notas formam C7(9).
  - `acordes.sufixo`: o que muda em sus4 ou add9.
  - `prog.cadencia`: nome da cadência pelos dois acordes, mais versão de ouvido.
  - `campo.emprestimo`: qual é o ♭VII de Sol.
- Atualizar `CHORD_DISTRACTORS`/pools do Monte e do Relâmpago (incluir tétrades com tensão no nível avançado).

### Arquivos principais
`src/theory/chords.js`, `src/theory/keys.js`, `src/questions/{notes,chords,progressions,harmony,ear}.js`, `src/apps/ouvido.js`, `src/ui/screens/{lesson,hub}.js`, `src/ui/components/sessionSetup.js`, `src/ui/runner.js`, `src/main.js` (rota), `sw.js` (novos arquivos), `README.md`.

## 4. Verificação
- `npm test`:
  - novos casos de teoria (C7(9) = C E G B♭ D; Csus4 = C F G; ♭VII de Sol = Fá; V–vi = cadência de engano; Lá maior = 3♯);
  - o teste de propriedade cobre os geradores novos automaticamente;
  - o teste do `sw.js` acusa arquivo esquecido;
  - novo teste: toda lição citada por um gerador existe.
- Roteiro do Chrome headless (scratchpad `drive.mjs`): todos os apps nos 3 níveis, mais o índice e as lições; sem erros de JS e sem textos "null"/"undefined".
- Screenshots a 390 px das telas novas (lição, modos novos do Ouvido).
