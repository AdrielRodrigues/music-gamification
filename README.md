# music-gamification · Teoria de Bolso

Jogos curtos de teoria musical para o celular, feitos para os minutos soltos do dia: fila (5 min), sala de espera (10 min) ou descanso com fone. O objetivo é sair do "só toco com cifra" para tocar a partir do tom, de ouvido e transpor.

HTML, CSS e JavaScript puros, sem dependências e sem build. Roda inteiro no navegador, com o progresso salvo no `localStorage`, e funciona offline (PWA).

## Os treinos

| App | Tipo de treino | O que desenvolve |
|---|---|---|
| 🃏 **Cartas** | Recordar (flashcard + repetição espaçada) | Memória de escalas, campos, intervalos… (temas 1–6) |
| ⚡ **Relâmpago** | Velocidade (60 s, múltipla escolha) | Acesso instantâneo à teoria |
| 🔎 **Detetive de Tom** | Aplicar | Descobrir o tom a partir de alguns acordes |
| 🔀 **Transponha** | Aplicar | Levar uma cifra para outro tom ou para graus romanos |
| 🧱 **Monte** | Construir | Escrever escalas e acordes com a grafia certa (Si♭ × Lá♯) |
| 🎧 **Ouvido Funcional** | Ouvir (cadência + alvo) | Reconhecer graus, acordes, intervalos, tensão e repouso |
| 🎙️ **Solfejo** | Audiação | Cantar graus de cabeça e conferir com o som |
| 🎸 **Braço** | Mapear | Notas nas cordas e funções (fundamental, terça, quinta) nas pestanas |
| 🎹 **Teclado** | Mapear | Tríades e inversões nas teclas |

Também tem:
- **Tom da Semana:** foca um tom até cumprir as metas (escala, campo, progressões, ouvido) e depois sugere o próximo.
- **Progresso:** acerto por app, por tema e por tom (mapa de calor) e dias seguidos de estudo.
- **Configurações:** Dó-Ré-Mi ou C-D-E, som, instrumento principal, backup do progresso.

## Rodar localmente

```bash
npm start      # = python3 -m http.server 8000  → abra http://localhost:8000
npm test       # = node --test (Node 22+), sem dependências
```

Abrir o `index.html` direto pelo arquivo não funciona: os módulos ES precisam de um servidor http.

## Publicar no GitHub Pages

1. No GitHub: **Settings → Pages → Build and deployment → Source: GitHub Actions** (só uma vez).
2. Faça push na `main`. O workflow [.github/workflows/deploy.yml](.github/workflows/deploy.yml) roda os testes e, se passarem, publica.
3. O site fica em `https://adrielrodrigues.github.io/music-gamification/`. No celular, use "Adicionar à tela inicial" para instalar e usar offline.

### Limites do GitHub Pages

- Ele só hospeda arquivos estáticos: não há servidor nem banco de dados, e tudo roda no navegador.
- O progresso fica no aparelho, então celular e computador não sincronizam sozinhos. Para levar de um para o outro, use Exportar/Importar nas Configurações.
- O iPhone pode apagar os dados de sites que ficam sem uso por um tempo. Instalado na tela inicial, isso não acontece.

## Estrutura

```
index.html, manifest.webmanifest, sw.js   página, PWA e cache offline
css/style.css                             visual mobile-first (claro/escuro)
src/theory/      teoria musical PURA (sem DOM): notas, intervalos, escalas,
                 acordes, campos harmônicos, progressões, braço e teclado
src/questions/   geradores de perguntas a partir das regras de teoria
src/core/        repetição espaçada, sessão, progresso, Tom da Semana, storage
src/ui/          DOM, roteamento, áudio (Web Audio), componentes e telas
src/apps/        os 9 treinos; registry.js monta o menu
tests/           testes com node:test
```

**Enarmonia:** as notas guardam a letra (`{ letter, acc }`), não só a altura. Escalas e intervalos são construídos letra por letra, então Fá maior tem Si♭, a 3ª maior de Sol♯ é Si♯ e a transposição respeita a grafia do tom de destino.

**Perguntas geradas, não fixas:** cada gerador sorteia parâmetros (tom, grau, intervalo…) e calcula a resposta pela teoria. A repetição espaçada guarda só `{ gerador, parâmetros }` e recria a pergunta quando ela precisa voltar.

### Criar um treino novo

1. Crie `src/apps/meu-app.js` exportando `{ id, title, icon, tagline, skill, contexts, description, why, setup, generators(config), render(q, ui) }`. Use os existentes como modelo; `relampago.js` é o mais curto.
2. Adicione o app em `src/apps/registry.js` e o arquivo na lista `ASSETS` de `sw.js` (um teste avisa se você esquecer).
3. Se precisar de perguntas novas, crie um gerador em `src/questions/` com `defineGenerator` e coloque-o na lista do tema. O teste de propriedade em `tests/questions/` passa a cobri-lo automaticamente.
