<p align="center">
  <a href="../../README.md"><img src="../../assets/banners/pathos.svg" alt="pathos" width="100%"></a>
</p>

# pathos

Hand a session to the next one, intact.

## What it does

A long human+agent session builds up state, access paths, a proof standard, known problems, and a working cadence — all of which die when the chat ends. pathos turns that into a file the next chat, agent, or model reads first, so the work continues instead of being re-derived from zero. It ships a backup-first cleanup mode and a `pathos` CLI.

## When it fires

When you're handing off, coordinating parallel sessions, or fighting drift between worktrees. Not for an operations runbook — that's m4nual.

## Install

```bash
cp -r claude/pathos ~/.claude/skills/
```

`node ~/.claude/skills/pathos/bin/pathos.mjs handoff --write docs/PATHOS.md`
creates a new handoff scaffold. It refuses an existing destination; refresh an
existing handoff by reading and editing it, preserving its decisions and history.

Run the CLI's no-clobber tests from this repository:
`node --test claude/pathos/test/handoff.test.mjs`.

---
<p align="center">
  <img src="../../assets/deviance-prism-icon.png" width="30" alt="">
  <br>
  <sub>Part of <a href="../../README.md"><b>deviance-skills</b></a> — a DEViance Intelligence pack · <i>beyond the edge</i></sub>
</p>
