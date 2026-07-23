# Proven Class Gates

Use this reference when repeated proofs suggest that a system has grown beyond
one successful instance. The goal is to turn evidence into a bounded class
claim without drifting into narrative.

## Core Principle

Do not only prove a thing. Learn what class of things was proven.

A proven class is a named set of systems, artifacts, workflows, documents, or
operations that share the same invariant structure and have passed enough
causal proof to justify a bounded claim.

## Claim Ladder

Use this ladder to calibrate language:

| Level | Evidence | Allowed language |
| --- | --- | --- |
| Hypothesis | intent, plan, mock, prompt, or design | "we expect", "candidate", "planned" |
| Instance proved | one causal proof | "this instance works" |
| Signal | two meaningfully different proofs | "early signal", "repeatable initial class" |
| Pattern | three or more proofs with low rework | "pattern", "class candidate" |
| Proven class | named class, coverage matrix, limits, artifacts | "proven class v0" |
| Expandable category | proven class plus adjacent boundaries | "category can expand through these contracts" |

Never use "universal", "any", "all", "production-ready", or equivalent broad
claims unless the coverage matrix and proofs actually support them.

## Proven Class Gate

Run this gate after the second meaningful proof and again after every major
coverage expansion.

Questions:

- What invariant did the proofs share?
- What varied: domain, profile, runtime, interface, input shape, side effect,
  data model, user surface, or scale?
- What did not vary?
- What proof artifact shows each instance actually ran?
- How much system rework did each proof require?
- What class name is boring, bounded, and falsifiable?
- What would be outside the class today?

Required output:

- class name;
- short public claim;
- evidence set;
- coverage matrix;
- honest non-claims;
- next coverage dimension to test.

## Coverage Matrix

Build the matrix around dimensions that matter to the current system. Common
dimensions:

- input contract shape;
- runtime/profile/execution environment;
- central entity lifecycle;
- graph shape: tree, DAG, cyclic graph, dense many-to-many;
- behavior: state machine, rules, scheduling, retries, compensation;
- data access: CRUD, filters, joins, aggregation, migration;
- surfaces: CLI, API, UI, MCP/tool, batch, browser, document, media;
- side effects: local filesystem, command adapter, HTTP, email, payment, LLM,
  webhook, queue, job;
- evidence: unit, integration, runtime smoke, visual proof, transcript,
  scorecard, release gate;
- governance: checkpoint, changelog, artifact index, reputation gate.

Do not count two examples as structurally different just because their
vocabulary changed. They must vary at least one meaningful dimension.

## Rework Metric

Track rework per proof:

- `none`: only contract, docs, artifacts, or generated output changed.
- `small`: localized hardening, no new boundary.
- `medium`: shared validator, generator, runtime, or agent surface changed.
- `large`: new boundary, profile, adapter class, or root contract was needed.

Interpretation:

- `none` after prior hardening means no additional rework, not proof that the
  earlier hardening was unnecessary.
- repeated `small` in the same area suggests a boundary should be extracted;
- repeated `none` across varied dimensions suggests a class is stabilizing;
- one `large` proof can reveal the next universal abstraction.

## Gap Ledger

For every meaningful checkpoint, record two sibling sections:

- What was proven.
- The gap discovered and corrected.

If no gap was discovered, say so explicitly and list residual risks. Absence of
a new gap is evidence, but not certainty.

Do not bury the gap as a sub-bullet. A corrected gap is often the most valuable
part of the research.

## Leaf Vs Boundary Decision

Use a leaf when the system needs pressure from a real example and the current
contracts may already support it.

Use a boundary when a leaf fails because a general capability is absent or when
the same hardening repeats across leaves.

Decision table:

| Observation | Next move |
| --- | --- |
| No realistic proof yet | build a leaf |
| One leaf passed | build a second structurally varied leaf |
| Two leaves passed | name a provisional class and coverage gaps |
| Three leaves passed with low rework | treat as class candidate/pattern |
| Leaf failed on a repeated invariant | extract a boundary |
| Leaf needs one-off custom code | reject or move variability into contract |

## Public Claim Template

Use this shape for public or checkpoint language:

```text
Proven class: <bounded class name>

Claim:
<what the system can generate/build/operate today, with profile/surface/scale>

Evidence:
- <proof 1>
- <proof 2>

Covered dimensions:
- <dimension>: <coverage>

Not covered:
- <honest limit>

Next coverage test:
<the next structural variation that would increase confidence most>
```

## Anti-Patterns

Avoid:

- treating "domain different" as enough when structure is identical;
- using a passing proof to skip naming what was actually proven;
- opening a new boundary before a leaf demonstrates demand;
- refusing a boundary after repeated leaves show the same gap;
- claiming a category while hiding untested dimensions;
- measuring progress only by feature count instead of class coverage.
