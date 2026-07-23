# The3y3 agentic AI, MCP, and coding-agent security

## Contents

1. Applicability
2. Core security property
3. Repository census
4. Trust and data-flow model
5. Risk domains and verification
6. Agentic CI/workflow injection
7. MCP servers and clients
8. Skills, rules, prompts, and memory
9. Multiagent systems
10. Hard gates
11. Evidence and testing
12. Research basis

## 1. Applicability

Use this reference when the repository contains or configures:

- LLM/model API calls or local models;
- agents, tool/function calling, planners, executors, or autonomous loops;
- MCP servers/clients, plugins, browser/computer tools, or connectors;
- RAG, memory, vector stores, prompt templates, guardrails, or evaluators;
- coding agents in CI, issue/PR automation, review bots, release assistants;
- Agent Skills, Claude skills/agents/hooks, Antigravity rules/workflows, Codex instructions, or similar artifacts;
- model-generated code, shell, SQL, templates, policies, or workflow outputs that are executed or trusted.

## 2. Core security property

Reasoning may be broad; effects must be bounded by deterministic controls.

Untrusted content must not, by changing only its text, gain authority to:

- read more data;
- obtain more credentials;
- call more powerful tools;
- change external state;
- weaken policy or logging;
- cause privileged code to execute;
- persist trusted memory/instructions;
- exfiltrate data.

Prompt instructions, model self-critique, tool annotations, and output filters are defense-in-depth, not authorization boundaries. Enforce identity, scope, capability, input/output validation, egress, and approval outside the model.

## 3. Repository census

Locate and classify:

- model providers, endpoints, model IDs, fallback models, sampling settings, and data-retention options;
- system/developer prompts, templates, examples, rules, skills, agents, hooks, and workflow wrappers;
- tools/functions, MCP manifests, servers, transports, schemas, annotations, and credentials;
- memory/RAG sources, ingestion, trust labels, tenancy, retention, deletion, and retrieval filters;
- agent loops, retry/termination/budget rules, background tasks, schedulers, and queues;
- human approvals and policy enforcement points;
- generated outputs reaching shell, code, SQL, browser, filesystem, email/chat, CI, deployment, or external APIs;
- observability, trace redaction, incident controls, and kill switches.

Record client/harness behavior as an external dependency when not visible in the repository.

## 4. Trust and data-flow model

Assign trust labels to each input:

- platform/user-authorized instructions;
- repository instructions and configuration;
- model/provider responses;
- issues, PRs, comments, commits, branch names, artifacts, and logs;
- websites, email, chat, documents, code, tool/MCP output, and RAG content;
- memory created by previous users/agents;
- subagent messages and generated plans.

Trace each source through prompts/models to tools and downstream interpreters. For every tool/effect, identify the real principal, credentials, resource scope, side effects, egress, and approval policy.

The model should not be treated as the authenticated principal. The runtime must bind tool authorization to an identity and exact resource/action.

## 5. Risk domains and verification

### Goal and instruction manipulation

Check whether untrusted content can override task goals, policy, scope, or approvals. Verify structural separation and trust labels, but do not assume delimiters make injection safe. Confirm effects remain capability-bounded when the model follows malicious content.

### Tool misuse and privilege expansion

Check tool schemas, parameter validation, resource scoping, least privilege, approval binding, time limits, rate limits, idempotency, rollback, and audit logs. Read-only and destructive variants should be separate capabilities. Wildcard filesystem, database, cloud, email, browser, or shell tools are high-risk.

### Insecure output handling

Trace model-generated strings into shell, `eval`, SQL, templates, HTML/Markdown, URLs, filesystem paths, policies, CI expressions, and code. Require grammar-aware validation/escaping or structured APIs. Treat generated code as untrusted code requiring review/test/sandbox.

### Data disclosure and exfiltration

Map which prompts/tools/providers see source, credentials, personal data, proprietary data, memory, and other tenants. Check minimization, redaction, provider retention/training settings, regional constraints, egress allowlists, response channels, and covert exfiltration through tool arguments/URLs/logs.

### Identity and authorization

Verify user/tenant identity is preserved across agent, tool, MCP, queue, and callback boundaries. Check confused-deputy and cross-tenant retrieval/tool access. The agent must not reuse a more privileged service credential to satisfy a lower-privilege request without policy evaluation.

### Memory and RAG poisoning

Check ingestion authority, provenance, trust labels, tenant isolation, retrieval filtering, freshness, deletion, conflict resolution, and promotion of model output into durable memory. Low-trust content must not become high-trust instruction by persistence.

### Excessive autonomy and cascading failure

Check budgets, recursion, retries, fan-out, timeouts, stop conditions, cancellation, human checkpoints, transactionality, compensation/rollback, rate limits, and kill switches. Bound financial, compute, communication, and external-state impact.

### Model and artifact supply chain

Check model/dataset/prompt/skill/plugin/MCP/tool provenance, pinning, signatures/digests, update paths, licenses, deserialization, cache integrity, and compromise blast radius.

## 6. Agentic CI/workflow injection

Repository automation is especially dangerous because attacker-controlled issue/PR/comment/branch/artifact content may be placed in prompts and the agent may have repository tokens, secrets, or shell access.

Trace two patterns:

1. **Prompt-to-agent:** untrusted event fields enter an agent prompt while the agent has sensitive tools/credentials.
2. **Prompt-to-script:** agent/model output later enters shell, workflow expressions, code, policy, or another privileged interpreter.

Verify:

- event triggers and attacker eligibility;
- checkout of untrusted code and artifact provenance;
- token permissions, secrets, environment protections, and runner isolation;
- prompt construction and trust labeling;
- tools available to the agent;
- validation of model-derived outputs before scripts/actions;
- third-party action/model/skill pinning;
- approval before writes, releases, deploys, or secret access;
- audit logs and containment.

Do not run an agentic workflow merely to inspect it. Static data-flow review comes first.

The 2026 [Agentic Workflow Injection study](https://arxiv.org/abs/2605.07135) reported 496 confirmed exploitable cases among 13,392 analyzed agentic workflows under its threat model, supporting dedicated prompt-to-agent and prompt-to-script review.

## 7. MCP servers and clients

For MCP, review both protocol implementation and application policy.

### Server

- authenticate and authorize every resource/tool action;
- validate token issuer, audience, scopes, roles, expiry, and resource binding;
- avoid token passthrough/confused deputy behavior;
- validate all tool inputs and sanitize/structure outputs;
- rate-limit and bound execution;
- isolate sessions and prevent session hijacking/fixation;
- constrain filesystem, network, subprocess, database, and cloud access;
- protect credentials and logs;
- expose truthful schemas and least-powerful tools.

### Client/host

- treat tool descriptions and annotations as untrusted unless the server itself is trusted;
- show exact sensitive tool inputs/effects for approval;
- bind approval to action, arguments, resource, identity, and time;
- validate tool results before placing them in model context or downstream interpreters;
- enforce timeouts, output/size limits, logging, and cancellation;
- isolate servers and restrict egress;
- handle dynamic tool-list changes and server-initiated events safely.

### OAuth and transport

Review protected-resource metadata, redirect/origin validation, PKCE where applicable, token storage, resource indicators/audience, TLS, local transport permissions, and DNS/rebinding risks.

The [MCP tools specification](https://modelcontextprotocol.io/specification/2025-11-25/server/tools) explicitly requires clients to treat tool annotations as untrusted unless from trusted servers and recommends confirmation, input visibility, result validation, timeouts, and logging. Use the current [MCP security guidance](https://modelcontextprotocol.io/docs/tutorials/security/security_best_practices) for implementation details.

## 8. Skills, rules, prompts, and memory

Agent instructions inside a repository are executable influence over the agent. Check:

- whether project-level skills/rules are loaded only after a repository trust decision;
- deterministic precedence and collision warnings across project/user/admin scopes;
- provenance and review of skill scripts/assets;
- path traversal, symlink escape, absolute-path, and remote-download behavior;
- commands embedded in Markdown, shell interpolation, hooks, and auto-run features;
- allowed/preapproved tool metadata versus actual harness enforcement;
- whether a skill can expand its own authority or modify trusted global instructions;
- update/signing/distribution and rollback;
- context/memory persistence of untrusted instructions.

The open Agent Skills guide notes that project-level skills may be untrusted and recommends a trust gate. `allowed-tools` support is experimental and cannot be treated as a universal permission boundary.

## 9. Multiagent systems

For each subagent, record identity, task, input data, tools, credentials, network, filesystem scope, output consumer, time/budget, and authority. Verify:

- delegation does not implicitly inherit all coordinator privilege;
- subagent output is untrusted until validated;
- one agent cannot approve its own high-risk effect through another role label;
- shared memory/workspaces prevent cross-task and cross-tenant leakage;
- concurrency cannot race approvals, state, or destructive actions;
- coordinator deduplicates findings and retains a complete audit trail;
- cancellation and budget limits propagate.

Use independent agents to corroborate analysis, not to manufacture consensus.

## 10. Hard gates

Escalate prominently when:

- attacker-controlled content can reach a privileged agent/tool with secrets or write access;
- model output reaches shell/code/SQL/policy/deployment without deterministic validation;
- agent/tool identity or tenant context is lost across a boundary;
- a broad credential is shared with untrusted code, model context, MCP server, or third-party tool;
- arbitrary tool discovery/installation or remote instruction loading occurs without trust/provenance controls;
- durable memory promotes untrusted content into authoritative instruction;
- autonomous loops lack meaningful resource/effect limits for costly or destructive tools;
- repository-level agent instructions can override trusted policy or exfiltrate context.

## 11. Evidence and testing

Prefer tests that assume prompt injection succeeds and verify it still cannot produce unauthorized effects. Useful evidence:

- capability/identity matrix;
- prompt/tool data-flow trace;
- policy decision and denial logs;
- negative authorization and cross-tenant tests;
- sandbox/egress configuration;
- output grammar validation tests;
- memory poisoning/isolation tests;
- bounded adversarial prompt suites;
- workflow taint analysis;
- cancellation/budget/rollback tests.

Record model/provider/version/settings and nondeterminism. A small prompt suite cannot prove injection resistance. Measure unauthorized effect rate, sensitive-data exposure, tool-policy violations, false approvals, completion utility, cost, and recovery—not only whether the model said the right words.

## 12. Research basis

- [OWASP Top 10 for Agentic Applications 2026](https://genai.owasp.org/resource/owasp-top-10-for-agentic-applications-for-2026/)
- [MCP Specification 2025-11-25](https://modelcontextprotocol.io/specification/2025-11-25)
- [MCP Security Best Practices](https://modelcontextprotocol.io/docs/tutorials/security/security_best_practices)
- [Agent Skills client trust considerations](https://agentskills.io/client-implementation/adding-skills-support)
- [Demystifying and Detecting Agentic Workflow Injection Vulnerabilities in GitHub Actions](https://arxiv.org/abs/2605.07135)
- [SecureAgentBench](https://arxiv.org/abs/2509.22097)
- [CaMeL: Defeating Prompt Injections by Design](https://arxiv.org/abs/2503.18813)
