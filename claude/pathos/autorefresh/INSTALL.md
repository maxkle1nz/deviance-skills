# PATHOS auto-refresh — instalar num repo

Padrão portátil que mantém as seções **auto-geradas** do `PATHOS.md` em dia a cada push na `main`:
um **changelog** (via [git-cliff](https://git-cliff.org), a partir dos Conventional Commits) e um
**overview** simples do repo. O conteúdo curado à mão nunca é tocado — só o que está entre as âncoras.

Um mecanismo genérico de autorefresh de PATHOS, sem proofs ou domínios de nenhum projeto.

## Passos

1. **Copie os 3 arquivos** para o repo alvo:
   ```sh
   mkdir -p .github/scripts
   cp pathos-autorefresh.yml  .github/workflows/pathos-autorefresh.yml
   cp pathos-autorefresh.mjs  .github/scripts/pathos-autorefresh.mjs
   cp cliff.toml              cliff.toml   # na raiz do repo
   ```

2. **Garanta as âncoras no `PATHOS.md`.** O script procura o arquivo nesta ordem:
   `docs/internal/PATHOS.md` → `docs/PATHOS.md` → `PATHOS.md` (raiz).
   Cole este bloco onde quiser que o changelog apareça (o overview é **opcional** — só inclua
   o par `auto-overview` se quiser essa seção):

   ```markdown
   <!-- BEGIN:auto-changelog -->
   <!-- END:auto-changelog -->

   <!-- BEGIN:auto-overview -->
   <!-- END:auto-overview -->
   ```

   - O script só escreve **entre** as âncoras. Se um par faltar, aquela seção é **pulada** (não é inventada).
   - Tudo fora das âncoras é curado à mão e nunca é sobrescrito.

3. **Use Conventional Commits** (`feat:`, `fix:`, `docs:`, `refactor:`, `perf:`, `test:`,
   `build:/ci:/chore:`, `revert:`). É o que o git-cliff agrupa no changelog. Commits fora do
   padrão são ignorados (`filter_unconventional = true`).

4. **Nenhum secret necessário.** A Action usa o `GITHUB_TOKEN` default com `permissions: contents: write`.
   Os commits de volta são feitos como o **bot da Action** (`github-actions[bot]`) com `[skip ci]` — edite o `git config` no workflow para usar outra identidade
   (não dispara a Action de novo).

5. (Opcional) **Teste local** antes de confiar no CI — exige `git-cliff` instalado
   (`brew install git-cliff` ou `cargo install git-cliff`):
   ```sh
   node .github/scripts/pathos-autorefresh.mjs
   git diff -- '**/PATHOS.md'
   ```

## Como funciona

- No `push` da `main` (com `paths-ignore` no próprio `PATHOS.md` p/ não criar loop), a Action:
  instala git-cliff → roda `node .github/scripts/pathos-autorefresh.mjs` → se o `PATHOS.md` mudou,
  commita de volta como o bot da Action com `[skip ci]` e dá push.
- `auto-changelog`: `git-cliff --unreleased` (desde a última tag `vX.Y.Z`; sem tags = histórico todo),
  agrupado por tipo de commit conforme o `cliff.toml`.
- `auto-overview`: nome do repo, branch, data do último commit e contagem de commits desde a última tag.
- O script é **idempotente** (não reescreve se nada mudou) e **zero-dep** (só Node builtin + `git`/`git-cliff`).

## Limitações (honestas)

- **Conventional Commits são a fonte.** Sem eles, o changelog fica vazio (`_(no conventional commits yet)_`).
- **git-cliff é dependência da Action.** No CI ele é instalado automaticamente; localmente é opcional —
  se faltar, o script pula só o changelog (o overview continua funcionando).
- **Só atualiza conteúdo entre âncoras.** Não cria nem move âncoras; cabe a você posicioná-las no PATHOS.
- **Um PATHOS por repo.** O script atualiza o primeiro arquivo encontrado na ordem de busca acima.
- **Caminho do script fixo** no workflow (`.github/scripts/pathos-autorefresh.mjs`) — ajuste o `run:`
  se você guardar o script em outro lugar.
- **Branch protection / required status checks — CONFIRMADO na prática (m1nd, 2026-07-03):** se a
  `main` exigir status checks, o push direto da Action é REJEITADO (`GH006`) — o `GITHUB_TOKEN` não
  tem bypass. O workflow lida com isso em duas camadas, já embutidas: (a) **fail-soft** — o run não
  fica vermelho; ele emite warning + step summary explicando o destravamento; (b) **secret opcional
  `PATHOS_REFRESH_TOKEN`** (fine-grained PAT de admin, Contents: read/write) — se existir, o checkout
  usa esse token e o push-back passa a aterrissar (admins ignoram required checks quando
  `enforce_admins` está off). A alternativa é liberar bypass p/ `github-actions` na proteção.
- **Não publica/serve nada** (sem Astro/site). É só o núcleo git-cliff → PATHOS.
