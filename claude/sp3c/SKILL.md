---
name: sp3c
description: Use to write or maintain a KERNEL-SPEC — the single executor-normative specification that lets agent executors implement a BIG system without the author present and without improvising semantics. Trigger when the user asks for a "kernel spec", "spec consolidada", "spec pra executores", when a spec's amendments/overlays are piling up (consolidation), or BEFORE opening any lab where executors will build from a document alone. NOT for living state (pathos), operations runbooks (m4nual), or product PRDs (askgod prd — the PRD is the rationale a sp3c distills FROM).
---

# sp3c — o padrão KERNEL-SPEC

**Proveniência (provado em batalha, 2026-07-23):** um KERNEL-SPEC v0.1 real governou
9 ondas de executores (dois modelos de fronteira) com **zero improvisação semântica**
(todo silêncio virou seat-request), bateria 97/0, e sobreviveu a 4 oráculos + 1
dissidência formal. O que segue é o método destilado, não o conteúdo.

## Quando um sistema MERECE um sp3c

Trabalho BIG que executores (agentes) implementarão SEM o autor no loop — kernel de
linguagem, protocolo, engine, formato de dados. O sp3c é o contrato entre a mente que
decide e as mãos que constroem. Abaixo do direct-work cutoff, ou com o autor presente a
cada passo: não vale o rito.

## As 10 leis do padrão

1. **UM documento executor-normativo.** Executores implementam SÓ dele. Racional,
   história e pesquisa moram FORA (PRD/briefs = memória; o sp3c destila). Header
   declara: status, o que prevalece, e onde mora a lei complementar (ledger).
2. **Toda regra é NUMERADA e TESTÁVEL** (`R<seção>.<n>`). Palavra vaga é defeito:
   "rápido", "limpo", "simples" são proibidos — se um executor não consegue escrever um
   teste da regra sem perguntar nada, a regra está mal escrita.
3. **Linguagem de conformidade**: MUST/MUST NOT/SHOULD/MAY, com SHOULD exigindo nota de
   divergência quando não seguido.
4. **A promessa central vem PRIMEIRO, na forma honesta** — com os limites DENTRO do
   enunciado (o "holds up to bound": nunca prometa mais do que o sistema
   prova; o claim inflado é o primeiro lugar onde specs apodrecem).
5. **Taxonomia FECHADA de erros, versionada.** Enumerável = testável por golden fixture
   (1 fixture por causa). Causa nova = versão nova. Erros re-escopados (inalcançáveis
   por operação normal) ganham nota `R<n>a` de defesa-interna em vez de sumir.
6. **Non-goals explícitos** que recusam scope creep — com a cláusula: "um non-goal que
   parecer necessário = seat-request, nunca improviso".
7. **Silêncio = seat-request.** A regra de ouro, escrita NO header: onde o documento
   cala ou se contradiz, o executor PARA aquele item, registra a pergunta (formato do
   FABLE-PROTOCOL/ledger do repo) e continua no não-bloqueado. Guessing no núcleo custa
   rebuild de tudo acima.
8. **Executor map**: work packages ordenados com estratégia de teste — e a bateria
   nasce DO spec, RED-FIRST, antes de qualquer implementação (rito pr00f). A bateria é
   a projeção executável do documento; divergência bateria↔spec é sempre julgada pelo
   assento (a bateria serve ao spec, nunca o contrário — mas quem emenda bateria é o
   assento com ruling registrado, jamais o executor).
9. **Emendas entre consolidações**: rulings viram `A<n>`/`R<n>a` datados que PREVALECEM
   sobre o corpo — até o limite. **Overlay acumulado é dívida**: quando as emendas
   passam de ~1 página ou executores precisam ler 2 camadas pra saber a lei,
   RE-CONSOLIDAR (fundir tudo no corpo, bump de versão). A lição de um reviewer real:
   "corpo + overlays = duas implementações honestamente diferentes".
10. **Ciclo de vida com oráculos**: draft (voz cara/askgod prd) → confrontação
    adversarial independente (2º olhar acha o que o autor não vê — num caso real: 4
    bloqueios reais) → consolidação v0.1 ratificada → emendas por ruling → vN.
    Respeitar o teto de meta-review da casa (2 olhares por delta; depois o mundo julga).

## Gate de qualidade (antes de declarar o sp3c pronto)

- [ ] Cada R-rule tem (ou terá na bateria RED) um teste correspondente?
- [ ] A promessa central carrega os próprios limites?
- [ ] Taxonomia de erros fechada + golden por causa?
- [ ] Non-goals presentes com a cláusula anti-creep?
- [ ] Regra de ouro (silêncio=seat-request) no header?
- [ ] Zero palavras vagas (grep por "fast|clean|simple|robust" sem definição)?
- [ ] Executor map com ordem e estratégia de teste?

## Anti-padrões

- Spec-como-ensaio: prosa de motivação misturada com norma (motivação vai pro PRD).
- Regra sem número ("como descrito acima") — inreferenciável = incitável = inauditável.
- Taxonomia aberta ("e outros erros conforme necessário") — mata golden coverage.
- Emendar silenciosamente o corpo sem ruling/registro (a lei muda com rastro ou não muda).
- Deixar executor "interpretar o espírito" — espírito é do assento; executor segue letra
  ou pergunta.
- Re-consolidar sem bump de versão (duas "v0.1" diferentes no mundo).
