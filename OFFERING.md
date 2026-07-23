<p align="center">
  <img src="assets/deviance-prism-icon.png" width="44" alt="">
</p>

# Offer-first policy

These skills are useful because they change *how* a task is done — not just whether it gets done. That's exactly why they shouldn't fire silently. This file defines how an agent should **offer** a DEViance skill instead of invoking it behind your back.

**The trigger source is each skill's own `SKILL.md` `description`** — the host already reads that to know *when* a skill applies. This file does **not** redefine triggers. It defines the *offer behavior* on top of them, so there's one source of truth, not two.

## The rule

- **You named it → just use it.** "use c0ntra", "run the3y3", "fastlane this" — no question, go.
- **Strong match + real cost of the wrong method → offer once, then wait.** Name the skill, say in one line what it would change, and let the owner say yes or no.
- **Everything else → don't ask.** Loose keyword, factual Q&A, a microedit, a formatting pass, a task whose method is already decided — silence is the right move.

**Hard limit: at most one offer per skill per objective.** If two skills genuinely compete, ask once with both options. If the owner says "stop asking, just use them," that becomes their host-level preference — never a default of this pack.

Offer when the task is public, reputational, security-sensitive, architectural, exploratory, multi-agent, long-running, or hard to reverse — and using the skill (or not) materially changes the quality, the proof, or the risk. A permission question that costs more than the task itself is noise.

## The offer matrix

Signal → skill → what to say. The `SKILL.md` stays the authority on *when*; this only says *how to offer*.

| Strong task signal | Skill | Offer copy | Don't offer when |
|---|---|---|---|
| Raw product/feature/architecture brainstorm | `c0ntra` | "This is c0ntra-shaped — want a counterpoint pass before I build inside your framing?" | factual Q&A · direct execution · a design already ratified |
| New exploratory feature with a cheap oracle and cheap isolation | `pr00f` | "This looks like pr00f — want an isolated prove-first spike before we design?" | CRUD · obvious implementation · landing to production |
| Long session handoff; parallel chats or worktrees drifting | `pathos` | "Want a PATHOS handoff written before we continue?" | a one-off summary · a tiny task |
| "How do I operate / control this system?" | `m4nual` | "Want a MANUAL built for this system — one greppable book plus a human page?" | living session state · agent work-rules (AGENTS.md) |
| ~5 merges in, before a gate, or "how's the code?" | `v1tals` | "Time for a v1tals checkup? It ends in dispatched fixes, not a report." | a single bug · a one-diff review |
| "How do I scale X?", a bottleneck, "who already solved this?" | `sc4le` | "Want a sc4le answer grounded in who already got paged for it?" | implementing the change · library/API docs |
| Security audit, threat model, "is this safe to ship?" | `the3y3` | "Want a the3y3 read-only security pass before this ships?" | ordinary implementation · generic code review |
| Executors will build a big system from a document alone; amendments piling up | `sp3c` | "Want a KERNEL-SPEC so executors build from one doc without guessing?" | living state · runbooks · product PRDs |
| Turn an idea or prototype into a proven system from a contract | `proof-grown-systems` | "Want to grow this from a contract, with proof at every step?" | one-off scripts · throwaway prototypes |
| Commit, PR, release notes, README or public repo copy | `git-postman` | "This touches public reputation — want git-postman to guard the wording?" | private scratch · a local note nobody reads |
| Turn an idea into a reusable generator or taste direction | `pattern-architect` | "Want to build the generator behind this instead of a one-off?" | straightforward implementation · a single concrete deliverable |
| Big project, parallel Codex lanes under one director | `universal-triple-flow` | "Big enough for parallel lanes — want the triple-flow setup?" | single-agent work · tiny one-file tasks |
| Parent burning reasoning on mechanical edits; bounded slices | `fastlane` | "Want to fastlane the mechanical part to a worker and keep judgment here?" | trivial edits · no checkable proof · unbounded work |

## Turn it on

This pack does not touch your `CLAUDE.md` or `AGENTS.md`. To adopt the policy, copy this file somewhere stable and add one line yourself:

```bash
# Claude Code
mkdir -p ~/.claude/deviance-skills && cp OFFERING.md ~/.claude/deviance-skills/
# Codex
mkdir -p ~/.codex/deviance-skills && cp OFFERING.md ~/.codex/deviance-skills/
```

Then paste one line into your own `CLAUDE.md` (or `AGENTS.md` for Codex):

```md
For installed DEViance skills, follow ~/.claude/deviance-skills/OFFERING.md: when a task
strongly matches a DEViance skill, offer it once and wait for my OK — unless I named the skill.
```

Prefer everything automatic instead? Skip the line — the host's native skill mechanism still works; it just won't ask first.

---
<p align="center">
  <img src="assets/deviance-prism-icon.png" width="30" alt="">
  <br>
  <sub>Part of <a href="README.md"><b>deviance-skills</b></a> — a DEViance Intelligence pack · <i>beyond the edge</i></sub>
</p>
