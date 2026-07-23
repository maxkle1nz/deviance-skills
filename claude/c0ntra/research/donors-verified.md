# Donors verificados — skill de contraponto (anti-sycophancy em brainstorm)

Verificação real via `gh api repos/{owner}/{repo}` em 2026-07-20. Todos os campos (licença SPDX,
stars, último push) vêm da resposta da API, não de memória. Sem rate-limit durante a varredura —
100% dos candidatos foram resolvidos (achados de verdade ou confirmados 404 → substituto real).

## 1. Tabela dos VERIFICADOS-OK

Ordenada por relevância pra skill (procedimento/prompts/eval > framework pesado), não por stars.
Licenças **NÃO-permissivas** (GPL/AGPL/none/NOASSERTION/não-padrão) marcadas em **negrito** com ⚠.

| Repo | Licença | Stars | Último push | O que faz | O que doa pra skill |
|---|---|---|---|---|---|
| `0xcjl/anti-sycophancy` | MIT | 4 | 2026-04-07 | Skill de defesa anti-sycophancy em 3 camadas p/ Claude Code e OpenClaw, baseada no arXiv 2602.23971 | Doador MAIS direto — mesma categoria exata de skill que estamos construindo; estrutura de camadas e prompts prontos pra estudar/adaptar |
| `brandonsimpson/devils-advocate` | MIT | 18 | 2026-06-12 | Plugin de Claude Code que adiciona autocrítica adversarial a toda task; Claude pontua o próprio trabalho em várias dimensões antes de "shippar" | Shape quase idêntico ao que queremos: lentes fixas de crítica + scoring, no mesmo ecossistema (Claude Code plugin) |
| `github/awesome-copilot` | MIT | 36776 | 2026-07-19 | Coleção comunitária de instructions/agents/skills p/ GitHub Copilot | Não é pra clonar inteiro (é um monorepo gigante) — minerar só `agents/devils-advocate.agent.md`, um prompt de devil's-advocate pronto |
| `MLGroupJLU/Premise_Critique` | MIT | 4 | 2025-11-26 | Estudo+código sobre LLMs seguindo cegamente premissas falhas em vez de questioná-las | Doa exatamente a lente "primeiros princípios / questionar a premissa" que a skill precisa |
| `PLUM-Lab/SOCRATIC-QUESTIONING` | MIT | 13 | 2023-12-07 | Implementação do paper "The Art of Socratic Questioning: Recursive Thinking with LLMs" | Doa procedimento de geração de perguntas socráticas recursivas |
| `YusufCelebii/PARROT` | MIT | 13 | 2026-05-18 | Benchmark de robustez a persuasão/concordância (sycophancy) pra LLMs | Doa metodologia de EVAL pra testar se a skill de fato resiste a sycophancy |
| `JiseungHong/SYCON-Bench` | MIT | 33 | 2025-12-19 (EMNLP 2025 Findings) | Benchmark de comportamento sycophantic em conversas multi-turn free-form | Segundo doador de eval — cobre o caso multi-turn que PARROT não cobre |
| `myracheng/elephant` | CC0-1.0 (domínio público) | 50 | 2025-09-28 | Repo do paper ELEPHANT — benchmark de sycophancy social em LLMs | Licença mais permissiva possível; doa outro ângulo de benchmark (sycophancy "social", não só factual) |
| `madaan/self-refine` | Apache-2.0 | 812 | 2024-10-04 | LLM gera feedback sobre o próprio output, usa pra melhorar, repete iterativamente | Doa o procedimento canônico de loop crítica→refino (prompts de feedback estruturado) |
| `noahshinn/reflexion` | MIT | 3207 | 2025-01-14 (NeurIPS 2023) | Agentes de linguagem com "reforço verbal" — reflexão textual sobre falhas passadas | Doa padrão de auto-crítica reflexiva reutilizável fora do contexto de RL |
| `microsoft/ProphetNet` (subpasta `/CRITIC`) | MIT | 746 | 2024-07-25 | Monorepo MSRA NLG; a subpasta CRITIC implementa "Self-Correct with Tool-Interactive Critiquing" (Gou et al., ICLR'24) | Doa procedimento de crítica com verificação via tools — minerar só a subpasta `CRITIC/`, não o repo inteiro |
| `confident-ai/deepteam` | Apache-2.0 | 2260 | 2026-07-08 | Framework de red-teaming pra LLMs e agentes de IA (pentest de prompts) | Doa padrões de ataque adversarial e harness de avaliação — mais pesado, útil pro lado "eval" da skill |
| `UKGovernmentBEIS/inspect_ai` | MIT | 2374 | 2026-07-19 | Framework de avaliação de LLMs (UK AI Safety Institute) | Doa arquitetura de harness de eval robusta, se a skill crescer pra ter uma bateria de testes própria |
| `promptfoo/promptfoo` | MIT | 23415 | 2026-07-19 | Testa prompts/agentes/RAGs; red-teaming/pentest de vulnerabilidade de IA, configs declarativas | Doa padrão de config declarativa pra rodar avaliações de prompt — framework pesado, prioridade baixa |
| `david-lindner/ai-safety-debate` | Apache-2.0 | 3 | 2019-09-16 | Reproduz os experimentos de "AI Safety via Debate" (Irving/Christiano/Amodei, OpenAI 2018) | Doa a mecânica de debate adversarial entre dois agentes julgados por um terceiro — repo pequeno e antigo, mas é o código-fonte real do paper seminal |
| `Azure/PyRIT` | MIT | 101 | 2026-03-25 (**archived**) | Python Risk Identification Tool — framework de red-teaming de IA generativa da Microsoft | Doa taxonomia de ataques/prompts adversariais; arquivado, então só como referência de leitura |
| `google/sycophancy-intervention` | Apache-2.0 | 125 | 2023-08-16 (**archived**) | Scripts p/ gerar dados sintéticos de fine-tuning que reduzem sycophancy | Doa a metodologia de geração de contra-exemplos de sycophancy, útil pra criar fixtures de teste |
| `shuojiangcn/AutoTRIZ-Repository` | ⚠ **nenhuma (all-rights-reserved por padrão)** | 16 | 2025-04-09 | Material suplementar do paper AutoTRIZ (ideação com TRIZ + LLM) | Só como REFERÊNCIA de método (matriz de contradição TRIZ) — sem licença, não clonar/reusar código diretamente |
| `0xcjl/cjl-autoresearch-cc` | MIT | 1 | 2026-04-03 | Auto-melhora qualquer skill/prompt/artigo via mutation-testing iterativa | Meta-ferramenta tangencial — útil se quisermos auto-otimizar a skill de contraponto depois de criada |
| `langchain-ai/langgraph` | MIT | 37617 | 2026-07-19 | Framework p/ construir agentes resilientes com grafos de estado | Framework pesado — baixa prioridade; só relevante se a skill virar um agente multi-nó |
| `crewAIInc/crewAI` | MIT | 55793 | 2026-07-19 | Framework de orquestração de agentes autônomos em papéis | Framework pesado — baixa prioridade, mesmo motivo |
| `huggingface/smolagents` | Apache-2.0 | 28436 | 2026-07-14 | Biblioteca minimalista de agentes que "pensam em código" | Mais leve que os outros frameworks, mas ainda é framework — baixa prioridade |
| `camel-ai/camel` | Apache-2.0 | 17425 | 2026-07-17 | Framework multi-agente com role-playing (inclui padrões de debate) | Framework pesado; tem padrões de role-play adversarial mineráveis, mas caro de clonar inteiro |
| `microsoft/autogen` | ⚠ **CC-BY-4.0 (não é licença de código padrão)** | 59819 | 2026-04-15 | Framework de programação p/ IA agêntica da Microsoft | CC-BY-4.0 é atípica pra um repo de código (normalmente é licença de conteúdo/docs) — checar licença por arquivo antes de reusar qualquer trecho; não tratar como MIT/Apache equivalente |
| `RUCAIBox/Slow_Thinking_with_LLMs` | ⚠ **nenhuma** | 767 | 2025-08-13 | Série de relatórios técnicos sobre "slow thinking" em LLMs | Sem licença — não clonar código; só leitura de metodologia |
| `meg-tong/sycophancy-eval` | ⚠ **nenhuma** | 129 | 2023-10-25 | Datasets do paper "Towards Understanding Sycophancy in Language Models" (Anthropic) | Doador de dataset mais citado da área, mas SEM licença explícita — pedir permissão/checar termos antes de embutir os dados na skill |
| `ECNU-ICALK/SocraticMath` | ⚠ **nenhuma** | 14 | 2026-04-02 (CIKM 2024) | LLM ensinando matemática via método socrático em conversas | Sem licença — só leitura de método, não clonar |
| `Skytliang/Multi-Agents-Debate` | ⚠ **GPL-3.0** | 598 | 2025-12-16 | "MAD" — primeiro trabalho a explorar debate multi-agente com LLMs | GPL-3.0 é copyleft forte — incompatível pra embutir código numa skill de licença permissiva; só ler a ideia |
| `composable-models/llm_multiagent_debate` | ⚠ **nenhuma** | 543 | 2025-04-24 (ICML 2024) | "Improving Factuality and Reasoning through Multiagent Debate" | Sem licença — só leitura de metodologia |
| `rachmann-alexander/sixthinkingchatbots` | ⚠ **GPL-3.0** | 0 | 2025-04-15 | Protótipo de chatbot com metodologia Six Thinking Hats | GPL-3.0 — não clonar código; ideia de estrutura (6 chapéus) é livre, mas o código não |
| `jasminemoreira/Versus` | ⚠ **NOASSERTION (sem licença declarada)** | 3 | 2026-04-22 | Camada de verificação adversarial p/ assistentes de codificação IA — "IA propõe, Versus critica" (metodologia IACDM) | Conceitualmente é o mais parecido com nossa skill, mas SEM licença clara (NOASSERTION) — não reusar código sem contatar o autor |
| `Wingtail/devils-advocate` | ⚠ **nenhuma** | 2 | 2023-11-07 | Framework de inferência LLM p/ planejamento e refino via devil's advocate | Sem licença — só leitura, mesmo nome de conceito que `brandonsimpson/devils-advocate` (que tem MIT) |
| `Helephants/langgraph-layered-context` | ⚠ **nenhuma** | 0 | 2026-04-02 | Implementação de "Layered Context Methodology" com LangGraph | Sem licença, 0 stars, tangencial ao tema — baixa prioridade |
| `0xcjl/openclaw-playbook` | ⚠ **nenhuma** | 3 | 2026-04-07 | Playbook de experiência prática com OpenClaw (em chinês) | Sem licença, tangencial (não é sobre anti-sycophancy diretamente) |
| `JiaxuLou/LLM_Bias` | ⚠ **nenhuma** | 0 | 2025-10-06 | Sem descrição, 0 stars | Baixíssima confiança/atividade — não recomendo como donor |

## 2. Corrigidos

| Candidato original (do prompt) | Resultado | Repo real encontrado |
|---|---|---|
| `appsecsanta/DeepTeam` | **404 — não existe** | `confident-ai/deepteam` (Apache-2.0, 2260 stars, "DeepTeam is a framework to red team LLMs and AI agents.") — confirma a suspeita do enunciado |

Durante a busca pelo repo canônico do método CRITIC (não um candidato do usuário, mas parte do
Passo 2), duas tentativas minhas erraram antes de achar o certo: `microsoft/ProbabilisticFactCheck`
e `guyd1995/self-critique` também deram 404. O repo real é `microsoft/ProphetNet`, subpasta `/CRITIC`
(monorepo do MSRA NLC team) — registrado na tabela acima.

## 3. NOT-FOUND / alucinados

**Nenhum candidato do usuário ficou definitivamente sem correspondência real.** O único 404 do Passo
1 (`appsecsanta/DeepTeam`) foi corrigido com sucesso (ver seção 2). Todos os outros 23 candidatos do
Passo 1 e todos os do Passo 2 resolveram na primeira tentativa ou após correção. Nenhum rate-limit
foi atingido durante a varredura — cobertura de verificação é 100%.

## 4. Top 5 pra clonar primeiro

1. **`0xcjl/anti-sycophancy`** (MIT) — é literalmente a mesma categoria de artefato que estamos
   construindo (skill anti-sycophancy de 3 camadas pra Claude Code/OpenClaw); o primeiro lugar pra
   ver como alguém já estruturou esse problema em prompts/regras.
2. **`brandonsimpson/devils-advocate`** (MIT) — plugin de Claude Code com autocrítica adversarial e
   scoring multi-dimensão; shape quase idêntico ao que queremos e no mesmo host (Claude Code), então
   a integração de referência é direta.
3. **`MLGroupJLU/Premise_Critique`** (MIT) — doa exatamente a lente de "primeiros princípios /
   questionar a premissa" que o brainstorm de contraponto precisa, com base em paper+código, não só
   teoria.
4. **`PLUM-Lab/SOCRATIC-QUESTIONING`** (MIT) — cobre a categoria "question-generation socrática"
   pedida no Passo 2: procedimento recursivo de perguntas, leve e focado, sem framework por trás.
5. **`madaan/self-refine`** (Apache-2.0) — o procedimento acadêmico canônico de crítica→refino
   iterativo; junto com `noahshinn/reflexion` (MIT, também forte candidato de reserva), dá o
   esqueleto de prompts pro loop de "genuine counterpoint" sem trazer um framework pesado junto.

Honrando o pedido de priorizar **procedimento/prompts/eval reutilizáveis** sobre framework pesado:
`langgraph`, `autogen`, `crewAI`, `smolagents` e `camel` ficaram DE FORA do top 5 por design — são
os doadores mais pesados da lista (frameworks completos de orquestração multi-agente), úteis só se a
skill crescer pra virar um agente de várias etapas.
