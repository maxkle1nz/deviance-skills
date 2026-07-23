# PATHOS Handoff Template

Use this template when creating a durable project handoff. Keep it concrete,
dated when useful, and honest. Delete sections that do not apply.

## North Star

State the durable objective in plain language.

- What the human is really building:
- Why this matters:
- Current proven capability:
- Current non-claims:

## Current State

- Date:
- Repo path:
- Branch:
- Remote/tracking branch:
- Dirty state:
- Latest completed checkpoint/release:
- Current active checkpoint/task:
- Latest important proof artifacts:
- Current generated output/build:
- Local servers or ports:
- Last commands that passed:
- Last commands that failed or were skipped:

## Human/Agent Pathos

Describe the working relationship another agent must preserve.

- Language and tone:
- Pace:
- What creates trust:
- What breaks trust:
- How to push back:
- How to celebrate:
- How to handle big visions:
- How to handle overclaim:
- User phrases or concepts that matter:
- Agent posture:

Example:

> Honor the vision by keeping the proof small and real. Think with the user, but
> do not flatter unsupported claims. Celebrate artifacts, not narrative.

## Operating Doctrine

List the method the next agent must follow.

- Core loop:
- Scoping rule:
- Delegation rule:
- Proof rule:
- Documentation rule:
- Commit/push rule:
- Search/investigation rule:
- Browser/runtime rule:
- When to ask the user:
- When to decide and move:

## Access Map

Never include secret values. Include names, locations, and recovery notes only.

### Repos And Paths

- Main repo:
- Generated outputs:
- Proofs:
- Run directories:
- Local docs:
- Skills:
- External project paths:

### Tools

- Required skills:
- MCP/connectors:
- m1nd status and reingest instructions:
- Browser tooling:
- CLI tools:
- Package managers:
- Test runners:

### Credentials

- Required environment variable names:
- Where credentials are configured:
- Who/what owns access:
- What is intentionally unavailable:

## Known Problems

- Stale index or m1nd graph:
- Model quota limits:
- Disk pressure:
- Port conflicts:
- Dirty worktree:
- Generated artifacts not committed:
- Flaky tests:
- Browser/proof gotchas:
- Path moves:
- Known false positives:
- Known false negatives:

## Proof Standard

Define what "done" means here.

- Unit/focused tests:
- Structural checks:
- Runtime/browser proof:
- Artifact/proof outputs:
- Release/checkpoint gates:
- Reputation/governance gates:
- Visual proof:
- Manual review expectations:
- Non-claims that must remain visible:

## Next Agent Prompt

Pasteable prompt for the next agent:

```text
You are continuing this project from a PATHOS handoff.

First, read:
- <handoff path>
- <method/status docs>
- <latest checkpoint/proof docs>

Then run:
- <first command>
- <second command>

Operating style:
- <tone and cadence>
- <proof discipline>
- <pushback rule>

Current goal:
- <goal>

Important constraints:
- <constraint>
- <constraint>

Do not:
- <thing not to do>
- <thing not to do>

If m1nd is stale or misses obvious project knowledge, reingest the relevant
docs/code before making structural claims.
```

## First Commands

```bash
git status -sb
```

Add project-specific commands here.

## Do Not Do

- Do not claim unproved capability.
- Do not overwrite user work.
- Do not record secret values.
- Do not move to the next checkpoint before closing proof gates, unless the user
  explicitly chooses an exploratory path.

## Open Questions

- Question:
- Decision needed:
- Risk:
