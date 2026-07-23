<p align="center">
  <a href="../../README.md"><img src="../../assets/banners/universal-triple-flow.svg" alt="universal-triple-flow" width="100%"></a>
</p>

# universal-triple-flow

One director, parallel Codex lanes, no duplicated work.

## What it does

An orchestration pattern for running a project with a director thread plus two or more Codex CLI lanes in tmux. It creates or reconnects project-specific lanes, assigns clear ownership with disjoint write scopes, prevents duplicate workers through a shared channel file, and keeps one director responsible for architecture, integration, and final delivery.

## When it fires

When a project is big enough to warrant parallel lanes under one director. Not for single-agent work.

## Install

```bash
cp -r codex/universal-triple-flow ~/.codex/skills/
```

---
<p align="center">
  <img src="../../assets/deviance-prism-icon.png" width="30" alt="">
  <br>
  <sub>Part of <a href="../../README.md"><b>deviance-skills</b></a> — a DEViance Intelligence pack · <i>beyond the edge</i></sub>
</p>
