<p align="center">
  <a href="../../README.md"><img src="../../assets/banners/m4nual.svg" alt="m4nual" width="100%"></a>
</p>

# m4nual

The operations book of a system.

## What it does

One source, two projections: a greppable `MANUAL.md` for agents and a generated page for humans. It captures how a system actually works — where the infra lives, the real development rules, the runbooks — behind typed anchors that must grep against the real code, so the manual can't quietly drift from the thing it describes.

## When it fires

When an agent needs the canonical answer to "how do I operate this system?". Not for living state (pathos) or agent work-rules (AGENTS.md).

## Install

```bash
cp -r claude/m4nual ~/.claude/skills/
```

---
<p align="center">
  <img src="../../assets/deviance-prism-icon.png" width="30" alt="">
  <br>
  <sub>Part of <a href="../../README.md"><b>deviance-skills</b></a> — a DEViance Intelligence pack · <i>beyond the edge</i></sub>
</p>
