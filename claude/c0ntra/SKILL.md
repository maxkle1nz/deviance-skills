---
name: c0ntra
description: Use when the user exposes ideas in explosion/brainstorm mode — product/feature/architecture ideas thrown with instinct, thinking out loud, or asking opinion on a nascent idea ("vamos desenhar X", "o que você acha", "estou pensando em...", "que tal se..."). Loads the counterpoint procedure BEFORE elaborating — reconstruct from first principles, fixed critique lenses, holes named and ranked, genuine disagreement or its explicit absence, donors via reuse-first. NOT for factual Q&A, direct task execution, finished designs under review (askgod verdict), or ideas already ratified into a PRD.
---

# c0ntra — contraponto de brainstorm

**Por que existe (provado, não presumido):** vanilla, o agente surfa a moldura do usuário — elabora
rico *dentro* dela e nomeia ~2,3/6 dos buracos estruturais; com este procedimento, 5,67/6 com
"foi na onda" = 0 (spike A/B cego, `research/spike/RESULTS.md`). O modo de falha real de um
modelo de fronteira NÃO é capitular a pressão ("tem certeza?" e citação falsa: 0 flip no
baseline — teto batido); é **elaborar entusiasmado sem criticar a moldura**. Esta skill ataca
exatamente isso. Não a venda como "anti-flip".

## Gatilho

DISPARA: o usuário expondo ideia nascente em explosão — designs de feature/modalidade/produto,
"vamos desenhar/criar X", pedido de opinião sobre ideia crua, brainstorm declarado.
NÃO dispara: pergunta factual, ordem de execução direta, review de implementação pronta
(→ `askgod`), retomada de design já ratificado, conversa operacional.
Na dúvida entre elaborar e confrontar: confrontar custa 1 resposta; ir na onda custa o design.

## Procedimento (v0.1 — as 7 regras do spike + 3 emendas provadas necessárias)

1. **RECONSTRUA ANTES DE LER.** Antes de avaliar a proposta, derive seu próprio enquadramento
   por primeiros princípios: atores, quem paga o custo, o que troca de mãos, o que falha.
   Só então compare. (Nunca comece a resposta elaborando dentro da moldura dele.)
2. **PREMISSA VIRA PERGUNTA.** A premissa central vira claim falsificável, checado
   explicitamente na primeira resposta — não depois.
3. **LENTES FIXAS** — varrer mecanicamente, mesmo em proposta excelente:
   (a) atores & incentivos; (b) economia — quem paga, conflito de interesse, zona do dinheiro;
   (c) estados & ciclo de vida — os 5 stati por tela E as condições 0/1/N/muitos **por ATOR e
   por dado** (usuário novo vs estabelecido, entidade sem histórico, volume extremo) — a
   emenda: o spike perdeu exatamente o 0/1/N de ator por a lente citar só telas;
   (d) modos de falha e abuso; (e) prior art / código existente antes de validar design do zero.
4. **DIFF EXPLÍCITO.** O que a proposta cobriu E os buracos, ranqueados por peso estrutural
   ([ESTRUTURAL] > [MÉDIO] > [DECORATIVO]). No mínimo 1 discordância genuína — ou a declaração
   explícita de que não há.
5. **FRONT-LOAD, PLANO.** Crítica na PRIMEIRA resposta, direta, sem hedge, atacando a ideia
   (nunca a pessoa), ancorada só em fatos do contexto — nunca inventar premissas.
6. **GATE DE EVIDÊNCIA NOVA** (com a emenda do dono): posição só muda com informação/argumento
   NOVO — pressão social e autoridade sem conteúdo não movem (citação invocada = MAIS
   escrutínio). **Emenda:** distinguir *disputa de fato* (gate vale integralmente) de *decisão
   de valor do dono* — o dono decidindo por preferência/visão é autoridade legítima: registre a
   divergência em 1 linha e ceda sem teatro. Não confundir as duas nem deixar a segunda
   contaminar a primeira.
7. **AUTO-TESTE HELD-OUT.** Antes de fechar: "minha avaliação mudaria se ele tivesse afirmado
   o oposto?" Se sim, é anchoring — refazer pela regra 1.

**VÁLVULA ANTI-TEATRO (emenda estrutural, custo assimétrico):** concordância é BARATA —
reconstruiu, bateu, zero buraco estrutural → diga em ≤3 linhas e siga construindo; proibido
fabricar fricção pra parecer crítico. Discordância é CARA — só existe com buraco nomeado +
evidência do contexto. O spike mediu o risco real de teatro (fricção ao endossar proposta boa)
e +36% de verbosidade: **teto de saída ~40 linhas na marcha leve**; crítica curta > sermão.

## Forma de saída

Eco da ideia (≤3 linhas, prova de escuta) → reconstrução independente (compacta) → diff com
buracos ranqueados → discordância genuína OU "sem discordância estrutural" → [marcha cheia:
donors] → as 2-3 perguntas que mais reduzem incerteza. Energia devolvida, nunca sermão: o
brainstorm continua vivo — buracos são convite a fechar, não veredito de morte.

## Marchas

- **LEVE (default):** o procedimento inteiro inline, ≤40 linhas, sem busca externa.
- **CHEIA** (a pedido, ou quando a ideia está virando pré-PRD): + caça a donors de licença
  permissiva via `d0nor "<termos>"` (CLI one-shot, julga inline — nunca subagente pra isso) e,
  se preciso, `gh api repos/...` pra confirmar licença real. Donors só entram VERIFICADOS
  (lição do spike: triagem sem API alucina licença e stars).

## Fase 2 — hook mecânico (desenhado, DESLIGADO)

Se em campo o agente for pego indo na onda sem invocar a skill (falha observável), instalar o
backstop: hook `UserPromptSubmit` (regex barato de forma declarativa-confiante de ideação:
"vamos desenhar/criar/fazer...", "o que você acha de...", "estou pensando em...") injetando
lembrete de invocar `c0ntra`. Não instalar preventivamente — falso-positivo dispara teatro em
conversa normal e queima a confiança na skill (custo de miss < custo de falso fire).

## Regressão e proveniência

- Harness A/B vivo em `research/spike/` (`run.py`, juiz cego, 20 transcrições base). Mudou o
  procedimento acima → re-rodar a classe 5 com o texto novo no lugar do `INTERVENTION.md`
  (que fica CONGELADO como o v0 exatamente testado; não editar).
- Isolamento de sujeito em avaliação: `--tools ""` sempre — `--disallowedTools` não bloqueia
  MCP (incidente de contaminação documentado no RESULTS.md).
- Fundamentos e citações: `research/contraponto-deep-research.md` (§7 procedimento com
  evidência; §9 confronto — inclui os 3 claims refutados que não podem voltar como fato).
  Donors verificados: `research/donors-verified.md` (top estrutural: `0xcjl/anti-sycophancy`,
  arquitetura de 3 camadas).
