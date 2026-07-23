# The3y3 repository security truth

> Assessment status: Point-in-time, evidence-bounded repository assessment  
> Observed risk: `<CRITICAL | HIGH | MODERATE | LOW_OBSERVED | INDETERMINATE>`  
> Assurance: `<HIGH | MEDIUM | LOW | INSUFFICIENT>`  
> Observation point: `<revision or working-tree identity>`, `<UTC timestamp>`  
> Mode and scope: `<quick | standard | deep | adversarial>`, `<components>`

## 1. Executive truth

`<What an attacker can plausibly do, what is protected well, the top material risks, whether containment or a release gate is needed, and the most consequential unknowns.>`

### Decision table

| Decision | Verdict | Evidence/rationale |
|---|---|---|
| Urgent containment required | `<yes/no/unknown>` | `<finding/evidence IDs>` |
| Release/deploy should be blocked | `<yes/no/unknown>` | `<finding/evidence IDs>` |
| Critical assets plausibly exposed | `<yes/no/unknown>` | `<finding/evidence IDs>` |
| Evidence sufficient for current decision | `<yes/no>` | `<coverage and unknowns>` |

### Strongest existing controls

- `<Control that is directly evidenced and should be preserved>`

## 2. Scope and observation point

| Field | Value |
|---|---|
| Repository root | `<path>` |
| Revision / working tree | `<SHA plus dirty/untracked state>` |
| Assessed at | `<UTC>` |
| Mode | `<mode>` |
| In scope | `<components, files, artifacts, environments>` |
| Out of scope | `<explicit exclusions>` |
| Execution/network policy | `<what was allowed>` |
| External evidence | `<hosting/runtime/control-plane sources or none>` |
| Limitations | `<material limits>` |
| Assessor/client | `<agent/client/version if available>` |

## 3. Repository and system truth

### System shape

`<Deployable units, languages, manifests/lockfiles, build/release/deploy path, infrastructure, external integrations, and agentic surfaces.>`

### Assets and trust boundaries

| Asset or boundary | Why it matters | Observed control | Evidence | Gap/unknown |
|---|---|---|---|---|
| `<asset>` | `<impact>` | `<control>` | `<E-###>` | `<gap>` |

### Entry points and sensitive sinks

| Entry/source | Attacker/control | Sensitive sink/effect | Review status |
|---|---|---|---|
| `<source>` | `<who controls it>` | `<effect>` | `<traced/not tested>` |

## 4. Top attack paths

1. `<attacker capability> -> <entry/source> -> <missing/bypassed control> -> <sink/effect> -> <asset/blast radius>` (`<finding/evidence IDs>`)

## 5. Findings

### F-001 — `<title>`

| Field | Value |
|---|---|
| Type | `<vulnerability | control-gap>` |
| Priority | `<severity>`, `<CONFIRMED | LIKELY>`, confidence `<HIGH | MEDIUM | LOW>` |
| Affected asset/location | `<component and path:line/function>` |
| Attacker/preconditions | `<minimum capability and assumptions>` |
| Exposure/reachability | `<exposure>`, `<reachability>` |
| Evidence | `<E-###, E-###>` |
| Useful mappings | `<CWE/ASVS/OSPS/SLSA/etc., only if useful>` |

**Attack path and root cause.** `<source -> transformations/controls -> effect>`

**Impact and blast radius.** `<concrete confidentiality/integrity/availability/authorization/supply-chain effect>`

**Compensating controls and uncertainty.** `<what interrupts or may change the path>`

**Remediation direction.** `<reuse existing capability first; do not prescribe unnecessary dependencies>`

**Verification condition.** `<negative regression test or control evidence that closes the finding>`

**Owner/effort.** `<owner type>`, `<S | M | L>`

## 6. Unresolved hypotheses

| ID | Severity if true | Confidence | Hypothesis | Evidence | Decision at risk | Why unresolved | Smallest next evidence |
|---|---|---|---|---|---|---|---|
| H-001 | `<severity>` | `<confidence>` | `<possibility>` | `<E-###>` | `<decision>` | `<constraint>` | `<evidence>` |

## 7. Control and coverage truth

| Domain | Applicable | Critical to verdict | Depth 0–4 | Verdict | Confidence | Evidence | Main gap/next evidence |
|---|---|---|---:|---|---|---|---|
| Architecture and threat model | `<reason/N/A>` | `<yes/no>` | `<0-4>` | `<verdict>` | `<confidence>` | `<E-###>` | `<gap>` |
| Authentication and sessions | `<reason/N/A>` | `<yes/no>` | `<0-4>` | `<verdict>` | `<confidence>` | `<E-###>` | `<gap>` |
| Authorization and tenant isolation | `<reason/N/A>` | `<yes/no>` | `<0-4>` | `<verdict>` | `<confidence>` | `<E-###>` | `<gap>` |
| Input handling and injection | `<reason/N/A>` | `<yes/no>` | `<0-4>` | `<verdict>` | `<confidence>` | `<E-###>` | `<gap>` |
| Business logic, state, concurrency, and abuse | `<reason/N/A>` | `<yes/no>` | `<0-4>` | `<verdict>` | `<confidence>` | `<E-###>` | `<gap>` |
| Data protection and cryptography | `<reason/N/A>` | `<yes/no>` | `<0-4>` | `<verdict>` | `<confidence>` | `<E-###>` | `<gap>` |
| Secrets and credentials | `<reason/N/A>` | `<yes/no>` | `<0-4>` | `<verdict>` | `<confidence>` | `<E-###>` | `<gap>` |
| Dependencies and components | `<reason/N/A>` | `<yes/no>` | `<0-4>` | `<verdict>` | `<confidence>` | `<E-###>` | `<gap>` |
| CI/CD and release integrity | `<reason/N/A>` | `<yes/no>` | `<0-4>` | `<verdict>` | `<confidence>` | `<E-###>` | `<gap>` |
| Infrastructure and deployment | `<reason/N/A>` | `<yes/no>` | `<0-4>` | `<verdict>` | `<confidence>` | `<E-###>` | `<gap>` |
| Detection, recovery, vulnerability management | `<reason/N/A>` | `<yes/no>` | `<0-4>` | `<verdict>` | `<confidence>` | `<E-###>` | `<gap>` |
| Repository governance | `<reason/N/A>` | `<yes/no>` | `<0-4>` | `<verdict>` | `<confidence>` | `<E-###>` | `<gap>` |
| Testing and security assurance | `<reason/N/A>` | `<yes/no>` | `<0-4>` | `<verdict>` | `<confidence>` | `<E-###>` | `<gap>` |
| Agentic AI/MCP | `<reason/N/A>` | `<yes/no>` | `<0-4>` | `<verdict>` | `<confidence>` | `<E-###>` | `<gap>` |

Add a row for every other applicable catalog or platform-specific domain; this fixed list is a starting point, not permission to omit material coverage.

## 8. Supply-chain and release truth

`<Inventory/locks, vulnerable-component reachability, lifecycle hooks, SBOM/VEX, provenance, CI permissions and untrusted inputs, third-party actions/plugins, signing/distribution/update, and remote settings that remain unknown.>`

## 9. Checks and evidence

| Check | Tool/version | Command/scope | Status | Exit/duration | Evidence/limitations |
|---|---|---|---|---|---|
| C-001 | `<tool/version>` | `<redacted command and scope>` | `<PASS/FAIL/ERROR/PARTIAL/NOT_RUN>` | `<exit/time>` | `<E-### and limitation>` |

## 10. Unknowns, not tested, and assumptions

| Priority | Area | Risk decision affected | Reason | Smallest next evidence |
|---|---|---|---|---|
| `<high/medium/low>` | `<area>` | `<decision>` | `<why unknown>` | `<next evidence>` |

## 11. Prioritized roadmap

| Horizon | ID | Action | Risk/uncertainty reduced | Existing capability to reuse | Owner | Effort | Verification |
|---|---|---|---|---|---|---|---|
| Now | R-001 | `<action>` | `<F/H/control>` | `<existing capability>` | `<owner type>` | `<S/M/L>` | `<condition>` |

## 12. Boundary statement

> This is the repository's evidenced security truth for the recorded revision, scope, environment, and time—not a certification or a guarantee of absence of vulnerabilities.
