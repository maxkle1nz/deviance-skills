# Fastlane Case Notes

These are field-tested lessons from real Fastlane runs. The artifact names,
commands, and tool ids are illustrative — adapt them to the artifacts native
to the current repo.

## Generated Smoke Fallback

In a generated-project runner, Spark implemented a modular runtime path
quickly, but its initial fallback proof was weak: the generator recreated the
smoke script, so deleting that file before proof did not causally force the
fallback path. The parent gate caught this and added an explicit force path,
then verified proof fields directly.

**Lesson:** for Spark tasks, always specify causal proof fields, not just
commands.

## Generated-Code Abstraction Work

In a generated-code abstraction task, Spark xhigh successfully implemented
the first generator slice with a tight ownership boundary around the
generator and its tests. The parent gate then found and hardened adjacent
contract/runtime issues: explicit target precedence, root-record export
selection, false-positive export assertions, contract fixture updates, docs,
and full proof runs.

**Lessons:**

- Give Spark narrow owned files when the parent is also changing adjacent
  validator/runtime surfaces.
- Ask for generated-output compile checks, not just unit tests.
- For generator work, require one non-legacy fixture that proves the new
  abstraction is not still riding the old domain.
- Parent must inspect generated artifacts for contract drift, README drift,
  and smoke false positives.
- After a checkpoint-level proof or category uplevel passes, run the repo's
  Artifact Sync Gate before calling the work closed.

## Medium Fastlane Runs

Spark 5.3 medium is viable for cost control when the parent provides the
same complete prompt discipline used for xhigh and limits the worker to a
compact, obvious slice. It works best for tests, docs alignment, mechanical
extraction, small adapters, and patches that follow a pattern already proven
elsewhere.

Medium should not own synthesis. Do not assign it open-ended architecture,
broad cross-module refactors, proof design, or final acceptance. If the task
sounds like "decide the right abstraction" instead of "apply this
abstraction in these files," use xhigh or keep it local.

## Frontend Runtime Runs

In a frontend theme/runtime run, Spark was useful for broad tokenization
across UI islands, but the parent gate caught two workflow issues:

- A full-history fork cannot be used together with an explicit Spark model
  override; use `fork_context: false` when forcing `gpt-5.3-codex-spark` and
  embed the needed context.
- Spark reported a browser smoke failure caused by no dev server and also
  used the wrong smoke script name. Parent verification started the server,
  ran the repo's real smoke command, caught a responsive-contract
  regression, patched it, and then accepted the result.

**Lesson:** Fastlane works best when Spark builds quickly, while the parent
owns command truth, runtime readiness, and independent acceptance.
