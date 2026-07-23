---
name: universal-triple-flow
description: Use when operating any software project with a director Codex thread and two or more Codex CLI lanes in tmux. Creates or reconnects project-specific lanes, assigns clear ownership, prevents duplicate workers, coordinates through a shared channel file, and keeps one director responsible for architecture, integration, verification, and final delivery.
metadata:
  short-description: Multi-lane Codex project orchestration
---

# Universal Triple Flow

Universal Triple Flow is a general operating pattern for managing complex work with one director and two or more Codex lanes.

## Shape

- **Director thread**: the current Codex App thread. It owns architecture, scope, sequencing, integration, proof, and communication with the human.
- **Lane threads**: Codex CLI workers in tmux. Each lane has one repo/root, one role, and one write scope.
- **Channel file**: a repo-local markdown file where lanes exchange checkpointed handoffs and explicit questions.

The director can use two lanes or more. “Triple” means director + at least two operating lanes.

## When To Use

Use this for:

- two related repos that must stay aligned;
- frontend/backend split work;
- source-truth/compiler/consumer systems;
- design/implementation/proof lanes;
- long-running projects where another window should reconnect the exact operating structure.

Do not use this for tiny one-file tasks.

## Setup Protocol

1. Define the lane matrix before launching workers:

| Lane | Root | Ownership | Allowed Writes | Proof |
| --- | --- | --- | --- | --- |
| director | current thread | architecture/integration | usually none or final edits | final verification |
| lane-a | project root | bounded role | named files/modules | role-specific checks |
| lane-b | project root | bounded role | named files/modules | role-specific checks |

2. Pick a stable tmux session name:

```bash
PROJECT_SLUG="my-project"
TMUX_SESSION="${PROJECT_SLUG}-flow"
tmux has-session -t "$TMUX_SESSION" 2>/dev/null || tmux new-session -d -s "$TMUX_SESSION" -n director
```

3. Create one window per lane, not one terminal per thought:

```bash
tmux new-window -t "$TMUX_SESSION" -n lane-a -c /absolute/path/to/root-a
tmux new-window -t "$TMUX_SESSION" -n lane-b -c /absolute/path/to/root-b
```

4. Start Codex lanes with fork when they should inherit the current director context:

```bash
codex fork "$CODEX_THREAD_ID" --no-alt-screen -C /absolute/path/to/root-a -m gpt-5.5 -c model_reasoning_effort="xhigh" -s danger-full-access -a never
```

Use resume only when continuing a canonical lane history:

```bash
codex resume SESSION_ID --no-alt-screen -C /absolute/path/to/root -m gpt-5.5 -c model_reasoning_effort="xhigh" -s danger-full-access -a never
```

5. Write or identify the channel file:

```text
/absolute/path/to/project/docs/triple-flow-channel.md
```

The channel must include: lane name, timestamp, scope, artifact paths, checks run, open questions, and non-claims.

## Operating Loop

1. Director reads repo state and channel.
2. Director sends bounded prompts to lanes.
3. Lanes work only in assigned scope.
4. Lanes report files touched, proof, residual risks, and handoff questions.
5. Director reviews changes, runs integration checks, and resolves conflicts.
6. Director writes final outcome or next checkpoint.

## Lane Prompt Template

```text
You are the {lane-name} lane in Universal Triple Flow.

Director goal:
{goal}

Your ownership:
- Root: {absolute-root}
- Write scope: {files/modules}
- Do not edit outside this scope without asking.

Truth/contracts to read first:
- {paths}

Task:
{bounded task}

Proof:
- Run {checks}
- Report files touched, proof output, residual risks, and non-claims.

Coordination:
- Use {channel-file} for handoff-worthy messages.
- Do not broaden scope.
```

## tmux Commands

Inspect:

```bash
tmux ls || true
tmux list-windows -t "$TMUX_SESSION" -F '#{window_index}:#{window_name} active=#{window_active} panes=#{window_panes}' || true
tmux list-panes -a -F '#{session_name}:#{window_index}.#{pane_index} #{window_name} #{pane_current_path} #{pane_current_command}' || true
```

Send:

```bash
tmux send-keys -t "$TMUX_SESSION:lane-a.0" 'prompt or command' C-m
```

Capture:

```bash
tmux capture-pane -pt "$TMUX_SESSION:lane-a" -S -100
```

Close finished lane:

```bash
tmux send-keys -t "$TMUX_SESSION:lane-a.0" '/quit' C-m
```

## Guardrails

- One director, many lanes; never many directors.
- Prefer fewer lanes with sharper ownership.
- Fork for inherited context; resume for canonical continuation.
- Do not duplicate active sessions when a lane is already alive.
- Repositories and artifacts are private-by-default unless the human explicitly
  approves a scoped public release for that exact project/output.
- Never let a lane claim readiness without proof.
- Never hide uncertainty: report blocked, unknown, missing owner, and missing contract fields explicitly.
- Keep public UI/product copy free of internals unless the project explicitly defines an internal operator surface.
