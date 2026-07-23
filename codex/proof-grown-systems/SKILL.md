---
name: proof-grown-systems
description: >-
  Use when Codex needs to turn an idea, product, repo, research thread,
  feature, or prototype into a reusable system through the SAMBA Method: SSOT
  or contract first, generated or implemented build, runtime proof, artifact
  evidence, checkpoint closure, and stepwise expansion. Trigger for requests to
  replicate the method from zero, define a universal build/research process,
  harden a prototype into a proof-grown system, design SSOTs/contracts, scale a
  generator/framework, name a proven class from repeated proofs, or avoid
  false-positive "it works" claims. NOT for one-off scripts, throwaway prototypes, or work whose behavior does not need to be proven.
---

# Proof-Grown Systems

## Purpose

Use this skill to build or evolve systems by making the method itself executable. The public name is **Proof-Grown Systems**; the operating doctrine is the **SAMBA Method**.

The method treats research, construction, validation, and documentation as one loop: define a contract, build from it, prove behavior, record the checkpoint, then expand only through new contracts.

The newer lesson is equally important: do not only prove a thing. Learn what
class of things was proven, and name that class without overclaiming.

## Core Rule

**No structure without a contract. No success without proof. No checkpoint before artifacts.**

**No universal claim without a proven class.**

**No consumer claim without a generated truth surface.**

When using this skill, Codex acts as a researcher-builder:

- convert fuzzy intent into a small explicit source of truth;
- build the smallest useful system surface from that truth;
- validate with structural, build, and runtime evidence;
- inspect proof artifacts before claiming success;
- record what the system can now do and what remains outside the boundary;
- classify whether the result proves an instance, a signal, a pattern, or a
  class;
- update any downstream truth surface that consumers, agents, UIs, docs, or
  operators rely on;
- expand by adding new contract surfaces, not by piling hardcoded behavior onto the trunk.

## Start Here

Choose the smallest reference that matches the task:

- Starting a method or repo from zero: read `references/bootstrap-from-zero.md`.
- Designing or extending structural contracts: read `references/contract-map.md`.
- Closing a proof, release, checkpoint, or public claim: read `references/proof-and-checkpoint-gates.md`.
- Naming a class after repeated proofs, planning stress-test leaves, or
  deciding leaf vs boundary: read `references/proven-class-gates.md`.
- After a large integrated proof opens too many next edges at once: use the
  **Reverse Stabilizer** protocol before opening the next construction wave.
- After a system has enough proven surfaces that new leaves no longer change
  the trunk much: enter **Closure Mode** before adding more expansion.
- When another product, UI, agent, or docs system will consume the result:
  create or update a **Consumer Truth Matrix** instead of letting the consumer
  infer capability from scattered files.

If the current repo already has conventions for tests, proofs, docs, changelogs, checkpoints, scorecards, or generated artifacts, use those names. If it has none, do not invent a heavy ritual unless the user asks for a research/build framework.

## Universal Loop

Run this loop for every meaningful step:

1. **North Star** - State the durable goal in one sentence. Separate the universal structure from domain-specific leaves.
2. **Contract** - Define the SSOT, schema, manifest, interface, adapter, operation, profile, or fixture that will drive the work.
3. **Validation** - Add a checker that rejects incomplete, invalid, or drifted contracts before generation or runtime.
4. **Build** - Generate or implement the smallest build that consumes the contract.
5. **Runtime** - Run the build in the most realistic local path available.
6. **Proof** - Write or inspect an artifact that proves the new path executed.
7. **Hardening** - Patch path safety, compatibility, error handling, false-positive gaps, and contract drift guards.
8. **Checkpoint** - Update public docs and method notes only after proof exists.
9. **Class Learning** - Ask whether the proof changes only one instance or
   defines a repeatable class. Name the class only when evidence supports it.
10. **Expansion** - Add the next capability as a leaf, coverage variation, or
   new contract boundary based on the proof outcome.

## Mode Selection

Before launching the next wave, name the current mode. This prevents the method
from staying in exploration after it has enough evidence to close a cycle.

- **Exploration Mode**: the shape is unclear. Use small contracts and cheap
  proofs to discover the first invariant.
- **Construction Mode**: the boundary is known. Implement the next contract,
  validator, build/runtime path, proof, and agent surface.
- **Reverse Materialization Mode**: minimum cuts pass but no longer reveal the
  next boundary. Build a maximum coherent instance from proven surfaces.
- **Reverse Stabilizer Mode**: a proof opened too many plausible edges. Produce
  a machine-checkable matrix before more construction.
- **Closure Mode**: the system has enough proven surfaces that the next
  highest-value work is to close truth, docs, consumer registries, release
  gates, and product-facing boundaries before adding more leaves.
- **Closure-to-Invoker Mode**: structural packages, manifests, plans, or
  blueprints now exist, but behavior has not been invoked yet. Define the
  controlled invocation boundary before any runtime, side-effect, production, or
  complete-product claim.

Default to Construction Mode only when the mode is obvious. If the user asks
"what now?", "what do we have?", "how much is left?", "can this become a
product?", or "should we keep expanding?", run Mode Selection first.

When the mode is Closure-to-Invoker, keep the next cut narrow. The system has
already opened enough surface area; the highest-leverage step is usually a
bounded invoker contract, replay, dry-run, or permission model that explains
how a proven package may act without allowing arbitrary execution.

## Parallel Development

Proof-grown systems can grow in more than one timeline. Use parallel
development when a capability needs sustained work but should not compete with
the main sequence of checkpoints.

The **PRESENT LANE** is the active mainline of development. It owns the next
canonical checkpoint numbers and reflects the current production direction of
the system.

A **parallel lane** is a checkpoint fork anchored to a proven parent checkpoint.
It grows as a numbered sub-tree, such as `115.1`, `115.2`, `115.3`, instead of
claiming the next mainline checkpoint. This keeps ownership clear while the main
system continues moving.

Use a parallel lane when:

- the work has its own cadence, owner, artifacts, or proof loop;
- it must observe and react to mainline changes without blocking them;
- it touches shared docs, governance, adapters, or support systems that should
  not race with feature work;
- it may later be promoted back into the PRESENT LANE after enough evidence.

Every parallel lane must record:

- the parent checkpoint or commit it forked from;
- the current PRESENT LANE commit or checkpoint it observed;
- its lane id, owner, scope, and non-scope;
- the contracts and proofs it owns;
- the shared files it may request to touch;
- the remerge criteria for returning to the PRESENT LANE.

Parallel lane artifacts should be named from the parent checkpoint and lane
step, not from the next canonical checkpoint. For example:

```text
proofs/<lane>/115.1-runner.json
proofs/<lane>/115.1-map.light.md
docs/lanes/<lane>/115.1-runner.md
```

Do not let a parallel lane overclaim mainline success. It can report observations,
plans, and proven lane-local behavior, but it only changes PRESENT LANE claims
after a remerge checkpoint or explicit handoff.

Before remerge, run the usual gates plus a lane-specific reconciliation:

- compare lane assumptions with the current PRESENT LANE state;
- re-run proofs against the current mainline, not only the fork point;
- list conflicts, stale artifacts, and docs drift;
- update public claims only after the revalidated proof passes;
- record what was promoted, what stayed lane-local, and what was abandoned.

## Structural Tree

Use this tree to keep growth healthy:

- **Roots**: schemas, validators, path safety, naming rules, fixtures, deterministic checks.
- **Trunk**: coordinator, generator, runtime runner, proof writer, agent-facing tool surface.
- **Branches**: profiles, design packs, runtime bundles, operations, adapters, SDKs, MCP/tools.
- **Leaves**: domain data, visual taste, copy, workflows, providers, brand, customer-specific variants.

Protect roots and trunk from custom one-off behavior. Let leaves vary freely through branch contracts.

## Contract Surfaces

Prefer explicit contract surfaces over implicit code paths:

- SSOT for product/domain intent;
- profile packs for build/runtime category;
- runtime bundles for dependency and execution capability;
- design packs/modules for UI composition;
- operations for user and agent actions;
- adapters for external side effects;
- proof artifacts for claims;
- checkpoint documents for historical state.

When a new behavior appears repeatedly, promote it into one of these surfaces instead of duplicating implementation.

## Consumer Truth Matrix

When another system will read, visualize, orchestrate, sell, document, or
operate the proof-grown system, do not let that consumer scrape meaning from
chat, scattered docs, source files, or generated outputs.

Create a generated truth surface such as a registry, capability matrix,
contract rule matrix, manifest, or L1GHT-style summary when:

- a UI or product layer needs to display what the system can do;
- agents need to choose operations without reading the whole repo;
- docs need to stay current across checkpoints;
- a marketplace, template library, module picker, or visual builder needs
  status, dependencies, configuration fields, and non-claims;
- a parallel lane needs to track what the mainline has actually proven.

The consumer truth surface should include:

- stable ids and public labels;
- internal kind, layer, status, requires/unlocks, and dependencies;
- contract schemas, validators, proof requirements, and evidence artifacts;
- allowed claims and public non-claims;
- operator-only fields separated from public fields;
- source paths, generated artifacts, and agent operations when applicable;
- freshness markers tied to the latest proven checkpoint or release.

Validation must reject duplicate ids, missing dependencies, stale checkpoint or
release anchors, missing proof refs, forbidden public/internal leakage, and
planned/experimental rows that read like proven capability.

The consumer does not become the source of truth just because it is visual,
useful, or user-facing. It is a reader, editor, or cache of the generated truth
until a separate proof promotes it.

## Proof Discipline

Tests are necessary but not always sufficient. Match the proof to the claim:

- A schema claim needs a validation artifact or failing invalid fixture.
- A build claim needs compile/check output.
- A runtime claim needs a smoke, transcript, browser result, API response, or proof JSON.
- An agent-surface claim needs CLI, tool, MCP, or protocol-level exercise.
- A generated-code claim needs evidence that the generated path, not a stale fallback, ran.

Never document a success before proof exists. If proof is partial, say exactly what was proven and what remains unproven.

## Layered Gate Cascade

Long proof-grown runs should fail early on cheap drift before spending time on
large suites or release gates. Use a layered gate cascade when a checkpoint,
release, or major proof touches many surfaces:

1. **Micro gate** - Validate the new contract or fixture directly.
2. **Focused gate** - Run focused tests for the changed checker, generator,
   runtime path, CLI/tool/MCP wiring, or consumer matrix.
3. **Truth gate** - Rebuild/check registries, matrices, docs maps, L1GHT
   summaries, or other consumer truth surfaces that depend on the proof.
4. **Reputation gate** - Scan for local paths, secrets, public/internal leakage,
   whitespace issues, and artifact portability before expensive closure.
5. **Full close gate** - Run the repo's full checkpoint, test, artifact, and
   release gates only after the cheaper gates are green.

Do not treat the cascade as a weaker standard. It is the same standard ordered
so that cheap, high-signal failures appear before expensive validation.

## Artifact Economy

Proof artifacts should be inspectable without becoming noisy. Generate separate
artifacts only when they prove distinct causal surfaces, such as CLI, agent
tool, protocol, browser, or runtime paths. If several surfaces produce identical
structural output, prefer one canonical generated output plus lightweight
surface-specific proof wrappers or transcripts.

Record why duplicated generated outputs are kept when they are intentional.
Large artifact volume is acceptable only when it improves future inspection,
replay, or false-positive detection.

## Claim Ladder

Use this ladder to keep claims proportional to evidence:

- **Hypothesis**: intent or plan, no proof yet.
- **Instance proved**: one build/path/domain passed with causal artifacts.
- **Signal**: two meaningfully different instances passed.
- **Pattern**: three or more instances passed with low repeated rework.
- **Proven class**: a named class with coverage matrix, limits, and artifacts.
- **Expandable category**: a proven class plus reusable contracts for adjacent
  shapes, profiles, or side effects.

Never collapse these levels. "Two examples passed" is signal, not universal
coverage.

## Proven Class Gate

After repeated proofs, stop and name the exact class that was proven. A good
class name is bounded, boring, and falsifiable.

Record:

- the evidence set;
- the common invariant across proofs;
- what varied;
- the structural shapes covered and not covered;
- the rework level for each proof;
- the public claim and the honest non-claim.

If the class cannot be named without vague words like "anything", "all", or
"universal", the evidence is not mature enough for a class claim.

## Leaf Vs Boundary

Before adding structure, decide whether the next step should be a leaf or a
boundary.

Use a leaf when:

- the system needs pressure from a realistic instance;
- the current contracts might already support the next domain;
- the risk is overbuilding structure before demand is proven.

Use a boundary when:

- a leaf failed because a general capability was absent;
- several leaves repeat the same hardening;
- a variable concern should become a contract surface;
- an invariant belongs in roots or trunk.

The best next step is the smallest structural move that unlocks a class, not a
single custom feature.

## Reverse Materialization

Reverse materialization is a tested method step. Use it when a domain has
crossed a horizontal/vertical threshold: enough contract surfaces, runtime
paths, agent surfaces, and proofs exist that the next useful test is no longer
the minimum viable cut.

When these conditions are true, reverse materialization is not optional:

- minimum cuts are passing but no longer reveal the next boundary;
- several proven surfaces now need to operate together;
- the next phase depends on seeing whether the whole domain can carry a large
  coherent instance;
- the risk has shifted from "can this part work?" to "does the system hold
  together under integrated pressure?"

This is a **maximum coherent cut**:

- start from the currently proven surfaces, not from imagined future ones;
- define one large representative SSOT, manifest, fixture, or contract that
  crosses as many proven surfaces as possible;
- require every included surface to produce causal evidence;
- keep the same validation, runtime, artifact, checkpoint, and non-claim gates
  as a minimum cut;
- treat failures as boundary discovery, not as permission to loosen proof;
- update the method only after the max-cut proof shows a reusable lesson.

Run it as a repeatable procedure:

1. **Threshold declaration** - State why minimum cuts are no longer enough and
   what integrated domain is being tested.
2. **Surface inventory** - List only the surfaces already proven, including
   structural contracts, runtime paths, agent surfaces, adapters, and artifact
   gates.
3. **Max-cut contract** - Create one representative contract with required
   surfaces, minimum counts or coverage targets, proof expectations, and
   explicit non-claims.
4. **Materialization** - Build or generate the largest coherent instance that
   still stays inside those proven surfaces.
5. **Evidence aggregation** - Exercise every included surface and aggregate
   their causal artifacts into one proof.
6. **Boundary readout** - Treat every failure as information: either harden a
   false-positive gap, add a missing boundary, or reduce the claim.
7. **Method update** - Promote the lesson into the method only when the proof
   shows a reusable rule, not just a one-off fix.

Reverse materialization does not prove universality by size. It proves whether
the existing structure can carry a large coherent instance without hidden
shortcuts. Classify it as a domain max-cut instance until repeated max-cuts
show a stable class.

Do not use reverse materialization when the domain is still missing basic
contracts, validators, runtime proof, or agent-facing evidence. In that case,
continue with minimum cuts until the threshold exists.

## Reverse Stabilizer

Reverse stabilizer is the tested post-expansion stabilization step. Use it
after a large successful proof, reverse materialization, integration push, or
domain uplevel causes the number of possible next edges to grow faster than the
system can safely build.

When these conditions are true, reverse stabilizer should run before the next
construction wave:

- the previous proof opened many plausible branches at once;
- several agents, modules, runtimes, or contracts can now interact, but their
  ownership and boundaries are not yet stable;
- building the obvious next feature would hardcode decisions that should become
  contracts;
- the risk has shifted from "can the domain expand?" to "can the domain stay
  coherent while expanding?"

This is an **edge stabilization cut**. Its output should be a machine-checkable
matrix, manifest, SSOT, or equivalent contract. A planning note is useful
context, but it is not enough.

What works:

- anchor the matrix to the latest proven checkpoint, proof, release, or
  baseline instead of imagined future capability;
- inventory only surfaces that already have evidence, then record future
  surfaces as non-claims or next candidates;
- split the expanded domain into a small number of pillars with explicit
  dependencies, not a flat backlog;
- classify every row as root, trunk, branch, or leaf before implementation;
- assign each row a contract surface, validator expectation, proof shape,
  likely files or ownership, false-positive guards, and non-claims;
- model worker lanes with disjoint write scopes and mark parent-owned
  integration explicitly;
- expose the matrix through the same agent surfaces the system already uses
  when agent operation is part of the claim;
- prove the matrix itself with validation, artifact evidence, docs drift checks
  where available, and checkpoint/release gates before building from it.

What does not work:

- calling a strategy document a stabilizer when no validator can reject drift;
- mixing proven surfaces with wishlist surfaces without labeling the boundary;
- opening parallel implementation lanes before dependency edges and write
  scopes are explicit;
- using the stabilizer to smuggle runtime, production, security, or universal
  claims that the previous proof did not establish;
- running it too early, before the domain has enough proven surfaces to create
  real edge pressure.

Run it as a repeatable protocol:

1. **Edge Pressure Declaration** - State what proof or integration event opened
   too many plausible next edges, and why another minimum cut would now be
   under-informative.
2. **Evidence Boundary** - List only the surfaces, runtimes, adapters, agent
   operations, docs gates, and proofs that are already current and proven.
3. **Pillar Extraction** - Group the expanded domain into bounded pillars.
   Each pillar must have a purpose, owner or likely lane, dependencies, and
   honest non-scope.
4. **Matrix Contract** - Encode the pillars, current surfaces, dependencies,
   build lanes, write scopes, validation rules, proof expectations,
   false-positive guards, and non-claims in a structured contract.
5. **Validation Gate** - Add or run checks for duplicate ids, unknown surfaces,
   dependency cycles, lane overlap, missing proof expectations, missing
   non-claims, and forbidden positive claims.
6. **Agent Surface Gate** - If agents will act on the result, expose the matrix
   through the same CLI, tool, MCP, API, or protocol surfaces the system uses
   for other proven actions.
7. **Stabilizer Proof** - Produce an artifact that summarizes counts, ids,
   lanes, dependency graph, bindings, warnings, errors, and false-positive
   guards. Success requires the matrix proof, not only tests.
8. **Construction Sequence** - Convert the matrix into ordered implementation
   waves. Safe parallel lanes may start only after the parent has accepted the
   matrix and identified parent-owned integration points.
9. **Boundary Readout** - Record what the stabilizer unlocked, what it did not
   claim, which lanes are next, and whether the result is still an instance,
   signal, pattern, or class candidate.

Reverse stabilizer does not replace reverse materialization. Reverse
materialization proves a maximum coherent instance. Reverse stabilizer turns the
expanded graph around that instance into buildable order.

Reverse stabilizer does not prove a new runtime or product behavior by itself.
It proves that the next construction graph is coherent, bounded, and ready to
be worked by humans or agents without losing proof discipline.

## Closure Mode

Closure mode is the tested "organize the house" step. Use it when the system
has grown enough that more expansion would create less value than making the
existing capability robust, consumable, and honest.

Enter closure mode when:

- many checkpoints have accumulated and a new agent would need chat memory to
  understand what exists;
- the same docs, registries, matrices, or handoff files must be updated after
  every checkpoint;
- a product or external consumer is about to depend on the research system;
- users ask for practical value, pricing, launch readiness, or "what can it do
  now?";
- the next leaf would be easy, but would not change the class boundary.

Closure mode outputs are not just cleanup notes. Prefer machine-checkable or
operator-useful artifacts:

- current-state docs and stale-claim checks;
- generated registries or matrices for consumers;
- release or reputation preflight;
- artifact governance and generated-output policy;
- handoff/pathos with a journey ledger, not only the latest commit;
- a bounded next-cycle plan with explicit stop conditions.

Run it as a repeatable protocol:

1. **Current Truth Sweep** - Confirm head, latest proof, dirty state,
   generated artifacts, docs drift, and current consumer surfaces by command.
2. **Capability Inventory** - Summarize what is proven, signal, pattern,
   experimental, planned, and blocked.
3. **Claim Pruning** - Remove or rewrite public claims that exceed artifacts,
   especially product, production, security, compliance, universal, or
   consumer-facing claims.
4. **Consumer Refresh** - Rebuild/check registries, matrices, L1GHT summaries,
   docs maps, or equivalent truth surfaces.
5. **Early Reputation Gate** - Run portable-path, secret, public/internal
   leakage, and whitespace checks before the full close so small publication
   blockers are caught early.
6. **Full Close Gate** - Run the repo's release/checkpoint/publication gates
   before committing or asking users to trust the state.
7. **Next Cycle Declaration** - Name the next boundary, leaf, stabilizer, or
   product cut, and say what would stop the next expansion.

Closure mode does not mean development stops. It converts accumulated proof into
a state another human, agent, customer, UI, or investor can understand without
private chat context.

## Rework Metric

Classify each proof by how much core/system rework it required:

- `none`: only contract, docs, artifacts, or generated output changed.
- `small`: localized hardening, no new boundary.
- `medium`: shared validator, generator, runtime, or agent surface changed.
- `large`: new boundary, profile, adapter class, or root contract was needed.

Low repeated rework is evidence that a class is stabilizing. Large rework is
input for a new boundary, not a failure of the method.

## Anti-False-Positive Rules

Do not accept:

- "tests passed" when the claim is runtime behavior;
- "generated" when the artifact came from a stale previous build;
- "works" when no causal proof field or observable marker changed;
- "agent-ready" when only human CLI text was tested;
- "consumer-ready" when the UI, docs, registry, API, or visual layer still reads
  stale, hardcoded, or inferred truth;
- "universal" when the implementation embeds a private path, repo name, personal identity, or one domain-specific branch;
- public-facing copy that exposes checkpoints, gates, proof mechanics, runtime
  internals, implementation plans, or operator-only fields as product value;
- docs, changelog, or checkpoint claims that outrun verified artifacts.

Ask:

- What contract is the source of truth?
- What code path consumes it?
- What artifact proves the new path ran?
- What could still be masking a false positive?
- What is intentionally outside this checkpoint?
- What class, if any, did this proof actually support?
- Which structural dimensions are still untested?
- Which downstream truth surface must be refreshed before another system can
  consume this safely?

## Agent Workflow

Before edits, inspect the repo enough to learn its conventions. Use fast workers or sidecars only when the task is bounded and the parent agent can independently verify the result. If using a delegation skill such as TempoFastlane, this skill supplies the method and proof criteria while the delegation skill controls worker orchestration.

When delegation is active, the parent must conserve attention and context as a
proof resource. A delegated worker may legitimately take time. After dispatching
a bounded task with clear ownership, proof criteria, and non-claims, do not
duplicate the worker's work, edit overlapping surfaces, or keep polling in long
token-expensive loops. Use short status checks only at decision points, free or
close completed worker slots promptly, and otherwise trust the delegation until
the worker returns, fails, or the user asks for status. If a worker fails because
of quota, runtime, or availability, close that lane cleanly and relaunch the same
bounded task on an allowed fallback model without broadening the scope.

The parent agent remains responsible for:

- architecture and boundaries;
- contract completeness;
- integration and wiring;
- hardening;
- proof inspection;
- documentation accuracy;
- final acceptance.

## Continuity Ledger

Long proof-grown runs need a continuity artifact that preserves the arc, not
only the latest result. Create or update one when a session spans many
checkpoints, many agents, a product/research split, or a major handoff.

The ledger should capture:

- north star and current mode;
- latest proven checkpoint, head, dirty state, and release/proof gates;
- the journey arc by domain or pillar;
- methods learned during the run;
- current capabilities and explicit non-claims;
- downstream consumers and their freshness state;
- first commands for the next agent;
- "do not redo" warnings for recently closed work.

This is not a substitute for proofs. It is an anti-drift index over proofs so
the next agent can resume without flattening months of system growth into the
last commit message.

## Output Contract

When reporting progress or completion, include:

- the new or changed contract surface;
- the build/runtime path exercised;
- the proof artifact or observable result;
- the capability unlocked;
- the current limit;
- whether the result is hypothesis, instance, signal, pattern, or proven class;
- which truth surface or consumer registry was refreshed, or why none exists;
- the next highest-leverage structural step.

For small tasks, keep this concise. For checkpoints, be explicit enough that a future agent can resume from the artifacts without relying on chat memory.

## Living Method

This skill is a living method. Propose an update when repeated work reveals a universal lesson about contracts, proof, checkpointing, generation, adapters, agent surfaces, proven classes, coverage matrices, rework classification, or false-positive prevention.

Do not add repo-specific rituals, private paths, personal data, or one-off project details to this skill. Those belong in the active repo's docs, not in the universal method.
