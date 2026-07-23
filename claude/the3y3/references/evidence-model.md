# The3y3 evidence and measurement model

## Contents

1. Core rule
2. Claim types
3. Verdicts
4. Evidence classes and locators
5. Confidence
6. Finding validation and severity
7. Reachability and exposure
8. Coverage depth
9. Assessment-level truth
10. Finding schema
11. Control claim schema
12. Quality checks and anti-patterns

## 1. Core rule

Every material sentence in the assessment must be one of:

- a directly supported observation;
- a bounded inference with confidence and assumptions;
- an explicit unknown or untested area;
- a recommendation linked to a verified risk or coverage gap.

Do not write persuasive certainty. Write auditable truth.

## 2. Claim types

Use these types to prevent unlike statements from being blended:

| Type | Meaning | Example |
|---|---|---|
| `observation` | Neutral fact about the assessed state | A lockfile exists at a recorded revision |
| `vulnerability` | A weakness with a plausible attack path and security effect | User-controlled path escapes the intended root |
| `control` | A preventive, detective, corrective, or governance mechanism | CI job has explicit read-only token permissions |
| `control-gap` | Applicable control is absent, partial, or unenforced | Release action uses a mutable third-party tag |
| `hypothesis` | Material possibility not yet validated | Deserializer may accept attacker-controlled types |
| `coverage` | Statement about what was or was not examined | Authentication code received manual data-flow review |
| `recommendation` | Proposed risk/uncertainty reduction | Centralize object-level authorization in existing policy layer |

A process gap is not automatically a code vulnerability. A scanner alert is not automatically either.

## 3. Verdicts

Use one of these verdicts for control and coverage claims:

| Verdict | Required meaning |
|---|---|
| `PASS` | Direct evidence demonstrates the claim within the recorded scope and observation point |
| `FAIL` | Direct evidence demonstrates an applicable control or property is absent or broken |
| `PARTIAL` | Some required elements are evidenced and material elements are missing or unverified |
| `UNKNOWN` | Evidence is unavailable, contradictory, remote, or insufficient to decide |
| `NOT_TESTED` | The check was applicable but intentionally or practically not performed |
| `BLOCKED` | The check was attempted but a named constraint prevented valid evidence |
| `NOT_APPLICABLE` | The requirement does not apply, with a reason tied to the system model |

Never convert `UNKNOWN`, `NOT_TESTED`, `BLOCKED`, or `NOT_APPLICABLE` into `PASS` for aggregation.

For security tools, use:

| Check status | Meaning |
|---|---|
| `PASS` | Tool completed successfully and found no policy violation in its exact recorded scope |
| `FAIL` | Tool completed and found a policy violation or confirmed issue |
| `ERROR` | Tool crashed, could not parse, lacked data, or returned an invalid result |
| `NOT_RUN` | Tool/check was not run |
| `PARTIAL` | Tool completed with truncation, exclusions, unsupported areas, or incomplete data |

A tool `PASS` does not become a repository `PASS` without stating the tool's coverage and limitations.

## 4. Evidence classes and locators

### Evidence classes

| Class | Examples | Typical strength |
|---|---|---|
| `artifact` | Source/config path and lines, manifest, lockfile, workflow, signed provenance | Strong for what the artifact says; not necessarily enforcement |
| `history` | Commit, blame, tag, historical secret scan, change record | Strong for recorded repository history |
| `tool` | Versioned SAST/SCA/secret/IaC/workflow result | Depends on rules, parse success, freshness, and scope |
| `test` | Negative test, safe reproduction, property/fuzz result | Strong for observed behavior in the test environment |
| `runtime` | Authorized service response, policy/control-plane state, telemetry | Strong for the sampled environment and time |
| `attestation` | Maintainer/operator statement or document not independently observed | Useful context; weaker than technical evidence |
| `external-intel` | Vendor advisory, CISA KEV, EPSS, package registry, official release data | Strong only for the fact the source supports; may be time-sensitive |

### Required locator fields

An evidence item should include:

- stable ID such as `E-001`;
- class;
- repository revision or external snapshot time;
- path and line/function/rule where applicable;
- command, tool executable/version, configuration/database version, working directory, scope, exclusions, exit code, and timestamp where applicable;
- concise redacted summary;
- whether content was sampled, truncated, stale, or inferred;
- cryptographic digest or artifact path for durable machine output when useful.

Evidence summaries must not contain credentials, private keys, personal data, access tokens, or proprietary source beyond the minimum locator/excerpt needed.

## 5. Confidence

Confidence describes correctness of the claim, not impact:

| Confidence | Test |
|---|---|
| `HIGH` | Direct evidence and contextual validation agree; material alternatives were checked |
| `MEDIUM` | Strong evidence exists but one important assumption, environment fact, or path remains unverified |
| `LOW` | A plausible signal exists but reachability, configuration, or effect is materially uncertain |

Critical/high findings should normally be `HIGH` or `MEDIUM`. Keep a `LOW`-confidence critical possibility in unresolved hypotheses unless the uncertainty itself requires urgent containment.

## 6. Finding validation and severity

### Validation state

| State | Meaning |
|---|---|
| `CONFIRMED` | Evidence establishes the weakness, reachable or applicable context, and security effect |
| `LIKELY` | Evidence establishes most of the path; one bounded assumption remains |
| `UNCONFIRMED` | Signal requires material validation; report as a hypothesis, not a normal finding |
| `FALSE_POSITIVE` | Evidence shows the signal does not represent the alleged weakness in scope |

### Contextual severity

| Severity | Repository-level interpretation |
|---|---|
| `CRITICAL` | Evidenced reachable or strongly conditional low-friction compromise of critical assets, release/update channel, broad tenants/systems, or live high-privilege credentials; immediate containment may be required |
| `HIGH` | Major confidentiality, integrity, availability, authorization, or supply-chain impact with realistic prerequisites |
| `MEDIUM` | Material but bounded impact, stronger prerequisites, limited reach, or meaningful defense-in-depth failure |
| `LOW` | Limited impact or difficult exploitation; worthwhile hardening or localized control weakness |
| `INFO` | Security-relevant observation with no demonstrated adverse effect |

Severity is not confidence. Do not lower severity merely because confidence is low; change validation state and confidence instead.

A hard gate and a severity label answer different questions. A likely `HIGH` CI path can justify blocking a release. Do not promote it to `CRITICAL` merely because it blocks. If an unobserved external action, harness, deployment, credential, or setting could nullify the entire path, report `HIGH`/`LIKELY` or a `CRITICAL`-if-true hypothesis until the dependency is evidenced.

CVSS Base describes vulnerability severity, not complete organizational risk. If used, record the vector and add environment-specific exposure, reachability, asset value, threat evidence, and compensating controls.

For known vulnerabilities:

1. confirmed active exploitation or CISA KEV status takes precedence;
2. EPSS estimates exploitation probability and is not a risk score;
3. verify exact component/version and affected configuration;
4. determine runtime/build/dev scope and reachability;
5. account for exposure, asset impact, and compensating controls;
6. record advisory and intelligence snapshot time.

Sources: [FIRST CVSS v4.0 User Guide](https://www.first.org/cvss/v4-0/user-guide), [FIRST EPSS User Guide](https://www.first.org/epss/user-guide), and [CISA KEV](https://www.cisa.gov/known-exploited-vulnerabilities-catalog).

## 7. Reachability and exposure

### Reachability

- `REACHABLE`: observed call/data/control path enables the vulnerable behavior.
- `CONDITIONALLY_REACHABLE`: path exists under a named feature, configuration, platform, or privilege.
- `UNREACHABLE`: evidence shows the affected path/component is not used in scope.
- `UNKNOWN`: insufficient call/configuration/runtime evidence.

### Exposure

- `INTERNET_UNAUTHENTICATED`
- `INTERNET_AUTHENTICATED`
- `PARTNER_OR_WEBHOOK`
- `INTERNAL_NETWORK`
- `LOCAL_USER`
- `CI_OR_BUILD`
- `MAINTAINER_OR_ADMIN`
- `SUPPLY_CHAIN_CONSUMER`
- `NONE_OBSERVED`
- `UNKNOWN`

Record the attacker's minimum capability separately. An internal service may still be high risk when any compromised workload can reach it.

## 8. Coverage depth

Measure each applicable domain on a 0–4 depth scale. This is coverage, not a security score.

| Depth | Evidence threshold |
|---:|---|
| `0` | Not assessed |
| `1` | Inventoried; relevant files/surfaces identified |
| `2` | Artifacts/configuration manually inspected and threats/control intent reviewed |
| `3` | Targeted manual path analysis plus appropriate automated or negative checks |
| `4` | Behavior or enforcement validated in an authorized representative environment, with material findings independently corroborated |

Report depth for these domains when applicable:

- architecture and threat model;
- authentication and sessions;
- authorization and tenant isolation;
- input handling and injection;
- data protection and cryptography;
- secrets and credentials;
- dependencies and component risk;
- CI/CD and build/release integrity;
- infrastructure, containers, and deployment;
- logging, detection, recovery, and incident response;
- repository governance and vulnerability management;
- agentic AI, MCP, tools, memory, and prompt boundaries;
- availability, abuse resistance, and business logic;
- platform-specific domains such as mobile, embedded, or desktop.

For each domain record applicability, whether it is critical to the assessment verdict, depth, verdict, evidence IDs, exclusions, and next evidence needed.

Optional aggregate metrics may include:

- applicable domains by depth;
- applicable control claims with `PASS`, `FAIL`, `PARTIAL`, and `UNKNOWN`;
- confirmed findings by severity and reachability;
- unresolved critical/high hypotheses;
- high-risk unknowns;
- percentage of critical entry points manually traced, only when the denominator is explicitly enumerated;
- scanner parse/scope coverage, only as reported by the tool;
- new versus pre-existing risk for a diff assessment.

Do not average severity, process maturity, tool coverage, and unknowns into a single number.

## 9. Assessment-level truth

Report two independent labels.

### Observed risk

- `CRITICAL`: a critical finding with reachable or strongly conditional effect supports urgent containment or stop-ship.
- `HIGH`: one or more realistic major compromise paths are evidenced.
- `MODERATE`: material bounded risks exist without an evidenced critical/high path.
- `LOW_OBSERVED`: no material path was evidenced in covered areas; this is not "secure."
- `INDETERMINATE`: coverage or evidence is insufficient to characterize observed risk responsibly.

### Assurance

- `HIGH`: critical domains have depth 3–4, material findings are corroborated, and few high-risk unknowns remain.
- `MEDIUM`: critical domains mostly have depth 2–3, with bounded unknowns.
- `LOW`: important domains are depth 0–1 or evidence depends heavily on inference/tool alerts.
- `INSUFFICIENT`: observation point or evidence integrity is inadequate.

Example: `Observed risk: HIGH; Assurance: MEDIUM`. This is more honest than `Security score: 62/100`.

## 10. Finding schema

Every reportable finding needs:

```text
ID and title
Type: vulnerability | control-gap
Severity and rationale
Validation state and confidence
Affected asset/component
Location(s) and revision
Attacker capability and prerequisites
Exposure and reachability
Attack path: source -> transformations/controls -> effect
Impact and blast radius
Evidence IDs
Compensating controls and assumptions
Remediation direction using existing capabilities first
Verification condition / negative test
Owner type and effort band
Standards mappings (CWE/ASVS/OSPS/SLSA/etc.) when useful
```

Avoid a full exploit payload in general reports. Include only the minimal safe reproduction needed to verify and fix, and segregate sensitive proof material.

## 11. Control claim schema

Every control claim needs:

```text
Control ID and requirement
Applicability reason
Verdict
Evidence IDs
Scope and enforcement point
Confidence
Gap or limitation
Next evidence needed
```

Examples:

- A repository `CODEOWNERS` file is artifact evidence of intended ownership, not proof that reviews are required.
- A workflow-level `permissions: contents: read` is evidence for that workflow; organization defaults and reusable callees may remain unknown.
- A signed release manifest is evidence of integrity metadata; consumer verification and signing-key protection require separate evidence.

## 12. Quality checks and anti-patterns

Reject or revise the report if it contains:

- "the repository is secure" or "no vulnerabilities" without a bounded scope statement;
- a pass based only on missing alerts;
- a critical/high finding copied from a scanner without contextual validation;
- a dependency CVE without component/version/configuration/reachability evidence;
- hidden `UNKNOWN` or `NOT_TESTED` areas;
- a numeric score with no defined denominator and evidence rules;
- evidence without revision, path/scope, or timestamp;
- commands without versions and exit status;
- secret values, personal data, or excessive source excerpts;
- remediation that adds a dependency without evaluating existing capabilities;
- recommendations with no verification condition;
- remote-control claims inferred only from local repository files;
- duplicate findings that share one root cause;
- framework compliance or certification claims beyond the assessment evidence.
