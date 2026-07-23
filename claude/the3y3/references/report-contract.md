# The3y3 report contract

## Contents

1. Output principle
2. Required report structure
3. Finding format
4. Coverage matrix
5. Machine-readable ledger
6. Redaction and sensitive evidence
7. Writing rules
8. Compact chat variant

## 1. Output principle

Lead with the decision-relevant truth. A reader should understand observed risk, assurance, top attack paths, urgent actions, and blind spots before reading methodology.

Every report begins with:

```text
Assessment status: Point-in-time, evidence-bounded repository assessment
Observed risk: CRITICAL | HIGH | MODERATE | LOW_OBSERVED | INDETERMINATE
Assurance: HIGH | MEDIUM | LOW | INSUFFICIENT
Observation point: <revision/working tree>, <UTC time>
Mode and scope: <mode>, <components>
```

Never use `LOW_OBSERVED` as shorthand for secure.

## 2. Required report structure

Use [the report template](../assets/report-template.md) and keep this order.

### 1. Executive truth

In five to ten bullets or short paragraphs:

- what an attacker can plausibly do;
- which assets and trust boundaries matter most;
- top confirmed/likely findings;
- whether urgent containment or release blocking is warranted;
- assurance and most consequential unknowns;
- strongest existing controls worth preserving.

### 2. Scope and observation point

Include root, revision, dirty state, mode, timestamp, target type, included/excluded components, environment, network/execution policy, external evidence, limitations, and assessor/client.

### 3. Repository/system truth

Summarize deployable units, languages, manifests/locks, entry points, identities, sensitive data, external services, CI/release/deploy paths, infrastructure, and agentic surfaces. Add a compact trust-boundary/data-flow diagram only when it clarifies three or more relationships.

### 4. Top attack paths

Describe realistic chains in this form:

```text
attacker capability -> entry/source -> missing/bypassed control -> privileged sink/effect -> asset/blast radius
```

Tie each step to evidence or label the assumption.

### 5. Findings

Order by contextual priority, then confidence. Separate confirmed/likely findings from unresolved hypotheses and informational observations. Include no secret values or unnecessarily weaponized payloads.

### 6. Control and coverage truth

Show domain applicability, depth 0–4, verdict, confidence, evidence, and main gap. Report framework controls only when actually evaluated.

### 7. Supply-chain and release truth

Cover component inventory/locks, known-vulnerability triage, provenance/SBOM/VEX, build isolation, CI permissions/untrusted inputs, third-party actions/plugins, signing, distribution, updates, and unknown hosting/runtime settings.

### 8. Checks and evidence

List manual reviews, tests, scanners, commands, versions, rule/database freshness, scope, exclusions, duration/exit code, and status. Explain partial/error results.

### 9. Unknowns, not tested, and assumptions

Rank by the risk decision they could change. Name the smallest next evidence needed. Do not hide this section after generic appendices.

### 10. Prioritized roadmap

Use horizons such as `now`, `next`, and `later`. Each action needs:

- finding/control/unknown addressed;
- risk-reduction rationale;
- existing capability to reuse;
- owner type;
- effort band `S`, `M`, or `L`;
- verification condition;
- dependency/tool admission note if applicable.

### 11. Boundary statement

End exactly with:

> This is the repository's evidenced security truth for the recorded revision, scope, environment, and time—not a certification or a guarantee of absence of vulnerabilities.

## 3. Finding format

Use one heading per finding and include:

```text
ID — Title
Type: vulnerability | control-gap
Priority: severity, validation state, confidence
Affected asset/component and location
Attacker capability, prerequisites, exposure, reachability
Attack path and root cause
Impact and blast radius
Evidence IDs and concise redacted evidence
Compensating controls, assumptions, and false-positive analysis
Remediation direction using existing capabilities first
Verification condition / negative regression test
Owner type, effort band, and useful framework mappings
```

For a `LIKELY` finding, state the one remaining assumption. Keep `UNCONFIRMED` items in a separate hypothesis queue.

Do not inflate severity for missing documentation alone. Do not reduce technical severity because the issue is difficult to validate; use confidence and validation state.

## 4. Coverage matrix

Use this shape:

| Domain | Applicable | Critical to verdict | Depth 0–4 | Verdict | Confidence | Evidence | Main gap/next evidence |
|---|---|---|---:|---|---|---|---|

Depth is defined in `references/evidence-model.md`. This table is the primary security measurement. Optional totals must preserve separate counts for `PASS`, `FAIL`, `PARTIAL`, `UNKNOWN`, `NOT_TESTED`, `BLOCKED`, and `NOT_APPLICABLE`.

Do not create a universal percentage by averaging domains. If a denominator is explicit—such as 8 enumerated public endpoints with 6 traced—report that exact metric and limitation.

## 5. Machine-readable ledger

When a durable artifact is requested, create JSON from `assets/evidence-ledger.template.json`, use `assets/evidence-ledger.schema.json` as the structural contract, and validate semantic invariants with `scripts/validate_evidence.py`.

The ledger must contain:

- assessment identity and observation point;
- observed-risk and assurance labels;
- domain criticality, coverage, and verdicts;
- checks with commands/versions/scope/status;
- findings and hypotheses;
- evidence items and references;
- unknowns, limitations, and recommendations.

Evidence IDs must be unique and all references resolvable. A confirmed finding must reference evidence. The human report and ledger counts/labels must agree; this final report-to-ledger comparison remains necessary because the standalone ledger validator cannot inspect a separate Markdown report.

Use stable IDs:

- `F-###` findings;
- `H-###` hypotheses;
- `E-###` evidence;
- `C-###` checks;
- `R-###` recommendations;
- framework control IDs in their native format.

## 6. Redaction and sensitive evidence

- Replace credentials with type and at most a non-secret fingerprint approved by policy.
- Do not include private keys, session tokens, cookies, full personal records, or proprietary source dumps.
- Prefer `path:line`, function, rule, and hash over long excerpts.
- Store exploit details or sensitive logs separately with restricted access when necessary.
- Redact command arguments and environment that contain secrets.
- If a secret was printed by a tool, treat the output artifact as sensitive and do not repeat it.

## 7. Writing rules

Use:

- "No matches were detected by <tool> in <scope> with <rules/version>."
- "The control is not evidenced from repository state; remote enforcement remains unknown."
- "The finding is likely because <bounded assumption> was not observable."
- "The component is present, but runtime reachability was not established."

Avoid:

- "The repository is secure."
- "There are no vulnerabilities."
- "OWASP compliant" based on a scan.
- "Critical" copied from CVSS without context.
- "Passed" for a command that errored, timed out, or skipped files.
- vague advice such as "follow best practices" without a verified risk and validation condition.

Keep framework mappings subordinate to the technical explanation. Give credit to effective controls and identify their evidence; the report should be accurate, not performatively negative.

## 8. Compact chat variant

When no file is requested, return:

1. observed risk, assurance, scope/revision/time;
2. top confirmed/likely findings with evidence locators;
3. major strengths;
4. coverage/unknowns table;
5. prioritized next actions and verification;
6. exact boundary statement.

Do not omit unknowns merely to keep the answer short.
