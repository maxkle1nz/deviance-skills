---
name: v1tals
description: Checkup periódico de saúde de um repo — caça de dívida técnica COM conserto, e2e real no browser, gosto de design contra régua alta, ergonomia (5 stati), animações e performance; termina em fixes despachados, nunca em relatório de gaveta. Dispara a cada ~5 merges na main, antes de um gate, ou quando o dono pede um checkup. Não para um bug pontual, não para review de um único diff, e não substitui testes unitários.
---

# v1tals — os sinais vitais de um repo

Ritual de auditoria periódica de saúde de repo. Vale para
QUALQUER repo com produto. Nasceu de um audit de UI real (nota 5,5/10,
causas-raiz provadas no browser, fixes virando lotes 19/20 no mesmo dia) — essa é a barra.

## Quando disparar
1. **O STANDARD: a cada 5 MERGES na main desde o último boletim** — o
   gatilho primário, mecânico: hook `post-merge` conta merges desde o último commit em
   `docs/vitals/` e grita + toca `.vitals-due` (git-ignorado) ao chegar em 5. Instalar o
   hook na primeira sessão de trabalho de cada repo (como pathos/uiproof). O orquestrador
   que vê `.vitals-due` (ou o grito do hook) roda o ritual ANTES de empilhar mais merges.
2. **Antes de qualquer gate** (kill-test, release, demo pra terceiros) → v1tals COMPLETO,
   independente do contador.
3. **Cadência fria (backstop)**: scheduled task quinzenal por repo ativo — SÓ roda se o
   último boletim tiver >7 dias (senão pula: o standard 5-merges já cobriu).
4. O dono pede ("como está o código?", "faz um checkup") → completo.

## Os 7 eixos (cada um vira nota + evidência + fix)
0. **Era-coerência dos docs canônicos** (a regra: "precisamos SEMPRE manter
   isso atualizado") — o PRD/UML/design-docs refletem o CÓDIGO atual? Varre o delta dos
   merges desde o último boletim: substrato novo sem RF = buraco; RF descrevendo "planejado"
   o que já foi construído = stale; diagrama desenhando arquitetura morta = stale. O gap
   vira emenda NO MESMO ciclo (a escrita de PRD/UML é assento Fable quando disponível).
1. **Dívida técnica por camada** — boletim A–F por camada real (módulos de domínio,
   orquestração, frontend, testes). Monólitos nomeados com linha-contagem. REGRA: dívida
   pequena (≤2 arquivos, ~≤20 linhas) conserta INLINE no próprio checkup; dívida grande
   vira lote despachado com spec (refactor sem mudança de comportamento + suite como rede).
2. **E2E real no browser** — não confiar em suite verde: DIRIGIR o produto (preview/uiproof
   + um passe adversarial manual nos fluxos NOVOS desde o último checkup). Bugs achados =
   causa-raiz provada (log/console/rede), não sintoma.
3. **Gosto de design contra régua ALTA** — a pergunta-régua: "compara com software de alto
   nível de design?" Régua nomeada, não vibes: Linear/Things/Arc-class de polimento. Olhar
   de pattern-architect: tipografia, ritmo, paleta, coerência com a identidade do repo
   (estética do dono: calma/pastel/humana, anti-cyberpunk — nunca HUD-neon).
4. **Inteligência ergonômica** — os 5 stati por tela (vazio·carregando·parcial·erro·ideal),
   condições do mundo (0/1/N/MUITOS · offline/lento · dados degenerados), invariantes de
   produto (contador=lista, fluxo fechado em 1 toque, estado dado 1× nunca re-pedido),
   facilidade de uso real (o CTA primário está visível? o novato entende o que acontece?).
5. **Animações & microinterações** — servem ao entendimento (transição que explica) ou são
   ruído? prefers-reduced-motion respeitado? momentos-chave têm feedback (toast/estado)?
6. **Performance** — latência dos fluxos críticos medida (número, não impressão), peso de
   carga, orçamentos declarados e comparados com o checkup anterior.

## O produto do checkup (obrigatório)
- **Boletim** com os 6 eixos: nota + 1-3 evidências cada + TREND vs checkup anterior
  (guardar em `docs/vitals/YYYY-MM-DD.md` do repo; a comparação é o valor).
- **Plano de fixes JÁ DESPACHADO**: inline feitos + lotes criados (worktree por agente
  mutante, specs com file:line). O checkup NÃO está completo com achados órfãos.
- Bloco no PATHOS do repo se o estado real mudou.

## Composições
- Frontend → uiproof (execução determinística; LLM só autoria/heal).
- Repo com dinheiro → Protected Money Zone segue valendo dentro dos fixes.
- Achado de arquitetura caro/irreversível → askGOD verdict antes do fix grande.
- Delegação → modelo por régua do CLAUDE.md (fixes = opus; sínteses = sonnet).
