# Fastlane Delegation Template

Use this template when spawning a Fastlane worker for implementation.

## Prompt

```text
We are in <absolute repo path>.

The user wants a fast delegated implementation workflow. You are the implementation worker; the parent agent will review, harden, and independently verify.

Task: <clear feature/checkpoint/bug title>.

You are not alone in the codebase. Do not revert unrelated changes. Work with the existing dirty state. Do not modify files outside your ownership unless a verification failure truly requires it; if you must, explain why.

Spawn contract:
- You are intentionally running as `<worker-model>` with `<reasoning-effort>`.
- If Spark is unavailable, this may be a fallback sidecar model selected by the
  Fastlane Model Fallback Rule.
- This prompt is self-contained because full-history fork is not used when the parent must force this model.
- If critical context appears missing, inspect the repo and state the assumption rather than inventing background.
- Medium lane note, if applicable: this is a bounded implementation slice. Do not make architecture or proof-policy decisions; surface uncertainty to the parent.

Baseline from parent:
- Branch / worktree state: `<git status -sb summary>`
- Already dirty before delegation: `<files that were already modified/untracked>`
- Relevant existing proof: `<known passing/failing commands or screenshots>`

Owned files:
- <path 1>
- <path 2>
- <path 3>

Forbidden or sensitive files:
- <path/pattern not to touch>
- Do not edit generated artifacts unless explicitly assigned.

Current state:
- <what exists now>
- <known passing command/proof>
- <known limitations>

Implementation goal:
1. <specific behavior>
2. <specific behavior>
3. <compatibility requirement>

Proof contract:
1. Legacy path must still pass:
   - command: `<command>`
   - expected proof/log field: `<field=value>`
2. New path must be causally forced and pass:
   - command: `<command>`
   - expected proof/log field: `<field=value>`
3. If existing flow can mask the new path, add a force flag or deterministic setup that makes the new path unavoidable.

Runtime preflight:
- Exact repo script names: `<copy from package.json / Makefile / docs>`
- Required service/port: `<for example npm run dev -> http://127.0.0.1:7777>`
- You may / may not start background services: `<policy>`
- Browser/proof artifacts should be written to: `<artifact dir>`

Anti-false-positive rules:
- Do not claim runtime success from unit tests only.
- Do not claim a path was tested unless the proof artifact shows that path.
- Do not update docs/checkpoint as successful until proof confirms it.
- Do not guess script names. If a command is unavailable, classify it as `command-error`, not as a code failure.
- If runtime proof fails because the server/port/env is missing, classify it as `environment-blocker`.
- Do not claim files that were already dirty before you started as newly created by your patch.
- If proof is not possible, mark it as a limitation, not success.
- If this run reveals a reusable Fastlane workflow improvement, mention it as a suggestion to the parent; do not edit the skill yourself.

Verification to run before final response:
- `<unit/lint command>`
- `<legacy integration command>`
- `<new-path integration command>`
- `<governance command if applicable>`

Final handoff must include:
- What changed
- Files changed by you, separated from files that were already dirty before you started
- Commands run and results
- Proof artifact paths
- Exact proof fields or log lines that confirm behavior
- Limitations or concerns
- Any command classified as `code-failure`, `environment-blocker`, or `command-error`
- Whether repo-specific docs, changelog, release notes, checkpoints, scorecards, snapshots, or public artifacts need parent-side updates after proof acceptance
- Suggested Fastlane skill improvement, if a universal repeated pattern appeared
```

## Parent Review Script

After the worker returns, the parent should:

1. Read changed files or focused diffs.
2. Compare against the baseline dirty state.
3. Check whether the worker's proof could be a false positive.
4. Confirm command names against repo scripts.
5. Start required runtime services if needed.
6. Re-run the worker's commands independently.
7. Inspect proof artifacts directly.
8. Add hardening if needed.
9. Update repo-specific docs or evidence artifacts only after proof is real.
10. For major checkpoints or category uplevels, run the repo's Artifact Sync Gate before final response.
11. If repeated Fastlane use reveals a universal workflow improvement, propose a skill update after acceptance.

## Acceptance Examples

Good:

```text
Proof A: proofs/app-20260428T105202Z.json
runtime_smoke.source=generated
runtime_smoke.fallback_generated=false

Proof B: proofs/app-20260428T105208Z.json
runtime_smoke.source=generated-fallback
runtime_smoke.fallback_generated=true
```

Weak:

```text
I removed smoke.sh and prove passed.
```

Why weak: the generator may recreate `smoke.sh` before runtime, so the fallback path may never run.
