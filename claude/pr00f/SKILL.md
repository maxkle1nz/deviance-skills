---
name: pr00f
description: "Use for NEW exploratory features (the answer isn't known yet) in any repo: the pr00f rite — Prove First, Design After. Phase P: isolated lab (worktree + own runtime + fixture), contract battery born RED before any code, spike to GREEN without touching asserts, adversarial+property harness up to a real oracle (compiler/self-hosting), independent verification. Phase D: the PRD/UML is DISTILLED from the wave artifacts with proof-addresses on every claim, confronted via the world-conditions and organism-intersection matrices, surfaces per actor (human screens/ASCII flows; agent contract-as-UX), one askgod verdict, owner ratification. Trigger when the user says pr00f, 'prove primeiro', 'spike isolado', or a feature is exploratory with a cheap objective oracle and cheap isolation. NOT for CRUD/obvious features (normal flow), not for landing to production (GOD-loop verdict rules still apply), not a substitute for compiler/tests."
---

# pr00f — Prove First, Design After

**Por que existe (provado, não presumido):** no caso-piloto (verbo `transplant` do m1nd, 2026-07-20),
o rito produziu em UM dia um verbo inédito no mercado com 1.706 testes verdes — e o harness pescou
**dois bugs reais que nenhum design teria previsto** (corrupção dest-é-referenciador, achada por
property-testing no caso 4/32; lei do visibility-bump E0603, forçada pelo oráculo self-hosting em
código real). Um PRD escrito antes teria sido um PRD errado com confiança. A inversão que mais paga
não é "código antes de PRD" — é **harness antes de código**.

## Régua de invocação (as 3 condições — faltou uma, use o fluxo normal)

1. **Exploratório de verdade:** a resposta não é conhecida (feature nova, mecânica inédita). CRUD e
   feature óbvia NÃO entram.
2. **Oráculo objetivo barato:** existe um juiz não-LLM do "funciona" (compilador, teste E2E,
   invariante verificável).
3. **Isolamento barato:** dá para errar sem custo (worktree, runtime próprio, fixture).

O GOD-loop continua soberano para LANDAR: o spike isolado não landa nada; promover à árvore real
segue exigindo verdict. O pr00f desloca o verdict para DEPOIS da prova — nunca o elimina.

## FASE P — Prove

1. **Lab isolado:** worktree próprio (`git worktree add`) + runtime/estado do sistema isolados
   (portas, registries, dirs próprios — produção intocável por contrato) + **fixture canônico**
   pequeno que encena o cenário central. Documentar o lab num README autodescritivo (operar, smoke,
   gate, limpeza total).
2. **Battery RED antes de qualquer linha:** testes de contrato que fixam o OBSERVÁVEL (disco,
   saída, estado) — na tradição "compilam agora, falham até a implementação existir". Os asserts são
   sagrados: a implementação nunca os edita; o RED deve morrer pelo motivo certo (verbo inexistente,
   não erro genérico).
3. **Spike até GREEN** — reuse-first (escrever através da infra existente, nunca duplicar
   atômico/rollback/etc.), gates da casa por commit (fmt/clippy/lint locais), **commits-checkpoint
   frequentes** (cada passo compilável — restarts de host não podem apagar progresso).
4. **Harness de stress (a alma do rito):** fixtures adversariais de mundo sujo · certificado
   **"nada além do pretendido mudou"** (estrutural, não string-diff) · round-trip quando aplicável ·
   **property-based testing** (proptest/fast-check; contra-exemplos encolhidos viram regressão
   pinada e eterna) · atomicidade sob falha injetada · e o **oráculo supremo**: exercitar em código
   REAL do próprio sistema (self-hosting) com o juiz objetivo (compilador) e restauração garantida
   (guard com Drop/trap).
5. **Verificação independente:** o orquestrador re-roda os gates com as próprias mãos, lê o diff
   real e faz um exercício modo-vivo (o sistema servindo de verdade) antes de declarar. Nunca
   confiar no relatório de quem implementou.
6. **Relatório de onda (obrigatório, é meio-PRD):** o que a infra respondeu vs o que precisou de
   fallback · decisões com rationale de 1 linha · limitações HONESTAS · números de performance ·
   lista de commits. Gate enfraquecido = reportado como enfraquecido, nunca silenciado.

## FASE D — Design After (só com o core GREEN nos gates que existem)

**O spike prova a física; o PRD faz a engenharia da casa** — montar o sistema no mundo real
(outros, tempo, acidente, consequência), do jeito do dono: o que serve ao projeto, sem
overengineering, universal.

### Metade 1 — Destilação (fiel e barata)
- **UM autor** (PRD/UML = assento Fable, regra da casa), **proibição estrutural de pesquisa nova**:
  o que não está nos artefatos das ondas vira "decisão aberta", não investigação.
- **Toda frase normativa carrega endereço de prova:** `[prova: arquivo::teste]`, `[medido: N, onda X]`
  ou `[aberto]`. PRD auditável mecanicamente.
- **UML extraído-e-curado, nunca inventado:** estrutura gerada da fonte (grafo/assinaturas reais),
  o autor só corta ruído e destaca; **statecharts** para todo subsistema com estado, cada transição
  apontando o teste que a prova.
- **Documento único, fractal com teto:** sistema (1 pág: missão, invariantes, fronteiras) →
  subsistema (1 seção: contrato + mini-UML + provas) → abaixo disso, LINK para código/teste. Seção
  querendo passar de ~1 página ganha um teste ou um link, nunca mais prosa.

### Metade 2 — Confronto (onde o não-pensado aparece)
- **Matriz de condições do mundo** (a régua Stati & Invarianti do CLAUDE.md, aplicada a verbo OU
  tela): 0/1/N/MUITOS × com/sem dado × degenerado × concorrente × offline/lento — **por ATOR e por
  dado**.
- **Matriz de interseção com o organismo:** cada subsistema existente × a feature nova — "o que
  acontece quando se tocam?" (autoridade, receipts, zonas protegidas, concorrência, superfícies,
  memórias). É esta tabela que transforma spike em órgão.
- **Verdict-caçador:** `askgod` UMA vez, com as matrizes anexas, perguntando explicitamente
  **"o que este PRD não pensou?"** — depois correções e ratificação do dono.

### Superfícies por ator (obrigatório, universal)
- **Humano:** telas/fluxos (ASCII flows quando houver terminal/CLI) + **5 stati por tela** — vazio ·
  carregando · parcial · erro · ideal (ver CLAUDE.md § Stati & Invarianti; invariantes específicos
  no AGENTS.md do repo).
- **Agente:** **a UX é o contrato** — schema, mensagens de erro como prompt-contract (o erro ensina
  o retry), receipt honesto (zeros explícitos, campos `*_unresolved` nunca silenciados) + ASCII flow
  do loop agente↔verbo↔retry. **5 stati de verbo:** vazio (alvo não existe) · carregando (preview
  pendente) · parcial (`unresolved > 0`) · erro (recusa honesta que não muda um byte) · ideal.

### Gates da fase D
- **Anti-overengineering (regra dura):** todo requisito aponta uma dor provada ou uma aresta
  nomeada; requisito órfão = cortado.
- **Destinos de aresta (nada fica pendurado):** cada aresta descoberta fecha em (a) **design**
  (contrato/decisão, sem código), (b) **battery** — volta ao lab como RED e só entra no PRD quando
  GREEN, ou (c) **fronteira honesta** declarada e numerada, com o erro que o usuário verá.
- **Anti-deriva:** ideia nova surgida durante a escrita vira battery RED, nunca prosa. O Design
  After é OBRIGATÓRIO — sem ele o rito degenera em cowboy coding com testes.
- **Honestidade colada nos números:** "N testes verdes" viaja SEMPRE com as fronteiras ("verde
  dentro de X, Y, Z; fora disso, recusa/não coberto").

### Saída
- PRD/UML no repo do projeto (entra no burst com o doc-gate normal).
- **Onde o m1nd atender:** ingerir o PRD como documento L1GHT (claims com `evidence` repo-relativo)
  — os claims viram nós do grafo e o `document_drift` vigia o envelhecimento do design.

## DRY

Esta skill APONTA e nunca copia: CLAUDE.md § Stati & Invarianti (5 stati, condições do mundo),
§ Reuse-first, § Protected Money Zone, § GOD loop (verdict para landar), § git/burst (commits
locais vs PR). Detalhe operacional do caso-piloto: `~/m1nd-lab/README.md` + memórias
`transplant-*` no brain do m1nd.
