# The3y3 control catalog and framework router

## Contents

1. How to use this catalog
2. Framework selection
3. Core repository domains
4. Technology-specific extensions
5. Hard-gate conditions
6. Mapping and conformance rules
7. Authoritative sources

## 1. How to use this catalog

This is a router, not a checklist to apply blindly. First reconstruct the repository and threat model, then select applicable domains and verification requirements. Record why each domain is applicable or not applicable.

Use the newest verified framework version only when current external lookup is authorized and recorded. Otherwise use the bundled snapshot below and label it with assessment date. Never claim certification or complete conformance from repository-only evidence.

For each selected control:

1. state the requirement in testable language;
2. identify the enforcement point;
3. collect direct evidence;
4. assign `PASS`, `FAIL`, `PARTIAL`, `UNKNOWN`, `NOT_TESTED`, `BLOCKED`, or `NOT_APPLICABLE`;
5. record confidence and remaining evidence needed.

## 2. Framework selection

| Need | Primary anchor | Use when |
|---|---|---|
| Secure development lifecycle | NIST SSDF 1.1 | Any software-producing repository; structure findings across preparation, protection, production, and response |
| Open-source/project posture | OpenSSF OSPS Baseline 2026.02.19 | Repository governance, access control, build/release, documentation, quality, assessment, and vulnerability management |
| Web/API/application controls | OWASP ASVS 5.0.0 | Web apps, services, APIs, identity/data/business logic, and technical control verification |
| Manual secure review | OWASP Secure Code Review Cheat Sheet | Source/data-flow/business-logic review for any application |
| Component/supply-chain controls | OWASP SCVS and OpenSSF guidance | Inventory, SBOM, package management, component analysis, build environment, pedigree/provenance |
| Source and build integrity | SLSA 1.2 | Produced artifacts, source controls, provenance, isolated/hosted build systems, verification |
| Mobile | OWASP MASVS/MASTG current verified version | Android/iOS/mobile clients and backends where device-side controls matter |
| Agentic AI | OWASP Agentic Top 10 2026 and MCP specification | LLM agents, tools, MCP, memory, agentic CI, skills/rules, or autonomous workflows |
| Vulnerability prioritization | CISA KEV, FIRST EPSS, FIRST CVSS v4 | Known component vulnerabilities; never as a substitute for reachability and asset context |
| Platform hardening | Applicable CIS benchmark or official platform security guidance | Containers, orchestration, cloud, operating systems, databases, and identity platforms |

The OWASP Top 10 is awareness material, not a complete verification standard. Prefer ASVS requirements for testable web/application controls.

## 3. Core repository domains

### D1. Scope, architecture, and threat model

**Triggers:** Always.

Verify:

- deployable units, actors, assets, entry points, data flows, trust boundaries, external interfaces, and privileges are identifiable;
- documentation matches observed implementation and configuration;
- critical abuse cases and attack surfaces are represented;
- material changes receive a threat-model delta;
- security assumptions and external dependencies are explicit.

Evidence: architecture/source entry points, deployment config, schemas, routes, diagrams, threat models, tests, runtime/control-plane observations.

Anchors: NIST SSDF PW.1/PW.2; OSPS-SA; OWASP threat modeling and ASVS architecture requirements.

### D2. Identity, authentication, sessions, and authorization

**Triggers:** Any user/service identity, role, tenant, token, session, API key, admin function, or object ownership.

Verify:

- identity is authenticated with correct issuer, audience, lifetime, replay, and revocation controls;
- credentials are stored and compared safely;
- authorization is server-side, deny-by-default, object/action/tenant aware, and applied on every path;
- account recovery, impersonation, role changes, and administrative operations do not bypass controls;
- service identities and CI permissions use least privilege;
- failures do not fall open.

Evidence: middleware, policy code, endpoint guards, token validation, session configuration, negative authorization tests, IAM/IaC.

Anchors: OWASP ASVS authentication/session/access-control chapters; OSPS-AC; CWE authorization/authentication classes.

### D3. Input, interpreters, parsers, and output

**Triggers:** External input, uploads, archives, templates, queries, command execution, URL fetches, serialization, dynamic loading, model-generated output.

Verify:

- validation occurs at the trust boundary against an allowlisted grammar and size;
- output is encoded for its destination grammar;
- queries/commands use parameterization or structured APIs;
- paths are normalized and constrained after decoding/symlink resolution;
- archives, file types, parsers, deserializers, redirects, SSRF, and dynamic code loading are bounded;
- model/tool output is validated before any interpreter or privileged sink.

Evidence: source-to-sink trace, parser config, safe APIs, negative tests, SAST data flow, sandbox boundaries.

Anchors: OWASP ASVS encoding/sanitization/validation; Secure Code Review; relevant CWE.

### D4. Business logic, state, concurrency, and abuse resistance

**Triggers:** Multi-step workflows, money/value, quotas, inventory, approvals, irreversible actions, asynchronous processing, shared resources.

Verify:

- state transitions and ownership are checked server-side;
- replay, race, double-spend, confused-deputy, and TOCTOU paths are controlled;
- idempotency and transaction boundaries preserve invariants;
- rate limits, quotas, backpressure, timeouts, and cost controls resist abuse;
- approval separation cannot be self-satisfied or bypassed.

Evidence: state models, transactional code, tests, queue semantics, database constraints, rate-limit config.

Anchors: OWASP ASVS business logic and secure design; NIST SSDF design review.

### D5. Sensitive data, privacy, cryptography, and secrets

**Triggers:** Personal/regulated data, credentials, keys, tokens, signatures, encrypted storage/transport, sensitive logs/telemetry.

Verify:

- data classification, minimization, retention, deletion, export, backup, and log handling are represented;
- encryption boundaries and key ownership/rotation are clear;
- established primitives and libraries are used correctly, with secure randomness, nonce/IV and signature verification;
- secrets are not committed, logged, built into images, exposed to untrusted CI, or passed to broad agent context;
- confirmed exposed credentials are revoked/rotated and historical/consumer impact is assessed.

Evidence: data models/flows, key/secret references, history scan, logging code, crypto configuration, runtime secret manager/IAM evidence.

Anchors: OWASP ASVS cryptography/data protection; OSPS-BR-07; NIST SSDF PS/PW.

### D6. Dependencies and component risk

**Triggers:** Any third-party source, package, binary, container base, plugin, action, model, dataset, vendored component, or submodule.

Verify:

- direct/transitive inventory and exact versions are known for relevant builds;
- manifests and lockfiles agree, integrity data is present where supported, and sources/registries are controlled;
- install/lifecycle scripts and plugins do not gain unnecessary privilege;
- vulnerable components are prioritized by affected version, configuration, reachability, exposure, threat evidence, and impact;
- malicious-package, abandonment, namespace/confusion, maintainer, and provenance risks are considered;
- SBOM/VEX accurately represent released artifacts when applicable;
- adding a dependency passes a capability/value/provenance/maintenance/cost gate.

Evidence: manifests, lockfiles, dependency trees, registry metadata, advisories, call paths, SBOM/VEX, provenance, build logs.

Anchors: OWASP SCVS V1–V6; OSPS-QA/VM/BR; NIST SSDF PS.3/PW.4; SLSA.

### D7. Source control and repository governance

**Triggers:** Always for a maintained repository.

Verify:

- sensitive repository access requires strong identity/MFA outside the repository where observable;
- collaborator permissions default to least privilege;
- primary branch deletion/direct changes are protected;
- required checks and non-author review exist for risk-appropriate changes;
- ownership, contribution, support, security contacts, private reporting, disclosure, and remediation policy are documented;
- generated executables and unreviewable binaries are controlled;
- local repository artifacts are not misrepresented as proof of remote enforcement.

Evidence: repository files plus authorized hosting API/settings, policies, branch rules, audit logs.

Anchors: OSPS-AC/GV/DO/QA/VM; NIST SSDF PO/PS/RV.

### D8. CI/CD, build, release, and update integrity

**Triggers:** Any automation that tests, builds, publishes, deploys, signs, updates, or uses secrets.

Verify:

- untrusted metadata is not interpolated unsafely into scripts;
- untrusted code cannot access privileged credentials, caches, artifacts, runners, or writable tokens;
- job/workflow permissions are explicit and least privilege;
- third-party actions/plugins/images are immutable or strongly controlled and verified;
- artifact handoff cannot cross privilege boundaries without validation;
- build workers are isolated and provenance is authentic/non-forgeable at the claimed SLSA level;
- releases have unique identity, integrity/authenticity evidence, authorization, changelog/security content, and rollback;
- consumers can verify artifacts and updates.

Evidence: workflow files, runner model, permissions, action refs, environment protections, provenance/signatures, release artifacts, authorized platform settings.

Anchors: OSPS-BR/AC/QA; SLSA 1.2 Source and Build tracks; NIST SSDF PO.5/PS.2/PS.3.

### D9. Infrastructure, container, cloud, and deployment

**Triggers:** Docker/container files, orchestration, Terraform/Pulumi/CloudFormation, Helm, cloud IAM, deployment manifests, serverless config.

Verify:

- public exposure is intentional and authenticated where required;
- IAM is least privilege and avoids broad wildcards/pass-role/escalation paths;
- network, tenant, namespace, process, and host boundaries are enforced;
- images/bases are pinned, minimal, scanned with contextual triage, and run non-root with restricted capabilities where feasible;
- secrets are referenced, not embedded; state/backends are protected;
- encryption, logging, backups, destructive permissions, policy-as-code, and drift controls are adequate;
- deploy identities and rollbacks are controlled.

Evidence: IaC, manifests, policies, image metadata, authorized cloud/runtime state. Repository-only configuration does not prove deployed state.

Anchors: applicable CIS benchmark, official platform guidance, NIST SSDF, OSPS build/release controls.

### D10. Logging, detection, response, recovery, and vulnerability management

**Triggers:** Any production or distributed system; security-support obligations.

Verify:

- material authentication, authorization, administrative, data, release, and agent/tool events are logged without sensitive payloads;
- log integrity, retention, correlation, alerting, and incident access are planned;
- timeouts, circuit breakers, health checks, backups, restore, rollback, and disaster recovery match criticality;
- vulnerability intake, triage, disclosure, remediation thresholds, exceptions, and supported versions are defined;
- controls are tested or clearly marked as intended only.

Evidence: logging code/config, alert rules, runbooks, tests, restore evidence, vulnerability policy, authorized telemetry.

Anchors: NIST SSDF RV; OSPS-VM/DO; OWASP ASVS logging/error handling.

### D11. Testing and security assurance

**Triggers:** Always for code repositories.

Verify:

- automated tests cover critical invariants and negative security cases;
- security review and automated checks run at suitable lifecycle points;
- failures block relevant promotion paths or require recorded risk acceptance;
- tool scope, parser/rule/database coverage, false positives, and exceptions are governed;
- fixes receive regression tests and verification;
- assessment evidence is reproducible and bounded.

Evidence: tests, CI gates, scan config/results, exception records, regression cases.

Anchors: NIST SSDF PW.7/PW.8/RV; OSPS-QA/SA/VM; OWASP DevSecOps Verification Standard.

### D12. Agentic AI, MCP, and autonomous workflows

**Triggers:** Agent/model APIs, MCP servers/clients, tools, skills, rules, memory, RAG, agentic CI, generated commands/code, multiagent coordination.

Use `references/agentic-security.md`. Treat prompt resistance as a weak control; enforce identity, authorization, data-flow, tool, and egress boundaries outside the model.

Anchors: OWASP Agentic Top 10 2026; MCP specification/security guidance; NIST AI RMF where governance/system risk is in scope.

## 4. Technology-specific extensions

After selecting core domains, add only applicable verification guidance:

- **Web/API:** OWASP ASVS 5.0.0 and WSTG for authorized runtime testing.
- **Mobile:** OWASP MASVS/MASTG; distinguish device/client controls from backend controls.
- **Kubernetes/cloud/OS/database:** current applicable CIS benchmark and official provider hardening guidance.
- **Embedded/firmware:** update authenticity, rollback protection, debug interfaces, memory safety, hardware roots, physical access, and SBOM; use relevant platform standards.
- **Memory-unsafe native code:** memory-safety tooling, compiler hardening, unsafe boundary review, fuzzing/sanitizers in deep mode.
- **Cryptographic/security libraries:** API misuse resistance, constant-time/side-channel concerns, test vectors, key lifecycle, independent review, and compatibility risks.
- **Browser extensions/desktop:** privilege manifests, origin/IPC boundaries, update channel, code signing, native messaging, local secret/storage safety.
- **ML systems:** model/data provenance, unsafe deserialization, training/inference data handling, artifact integrity, resource abuse, output-to-action boundaries.

Record standard name/version and why it applies.

## 5. Hard-gate conditions

Escalate prominently and consider stop-ship/urgent containment when evidenced:

- a live high-value secret or signing/deployment credential is exposed;
- unauthenticated or low-privilege RCE, auth bypass, cross-tenant access, or critical data compromise is realistically reachable;
- untrusted pull-request/event content reaches privileged CI/agent execution with secrets or write permissions;
- the release/update channel or provenance/signing boundary can be subverted;
- a reachable internet-facing CISA KEV has no effective mitigation;
- destructive production/IAM/cloud privilege escalation is plausible;
- security checks are bypassed or fabricated in a promotion path;
- an assessment action itself would risk uncontrolled execution, data exfiltration, or destructive impact.

Do not call every missing maturity control a hard gate.

A hard gate is a decision boundary, not a severity shortcut. Keep severity, validation, confidence, reachability, and block/contain decisions separate.

## 6. Mapping and conformance rules

- Map a finding to the smallest useful set of controls; avoid framework-name decoration.
- Framework relations are informative unless the exact requirement and evidence were assessed.
- A mapping from OSPS to SSDF does not automatically satisfy both.
- Repository-only evidence cannot prove MFA, branch rules, environment protection, runtime IAM, alert delivery, key custody, or production deployment state.
- State assessment date and version for time-varying catalogs.
- Say "assessed against selected controls" rather than "certified" or "compliant" unless an authorized certification process actually occurred.

## 7. Authoritative sources

- [NIST SP 800-218 SSDF 1.1](https://csrc.nist.gov/pubs/sp/800/218/final)
- [OpenSSF OSPS Baseline 2026.02.19](https://baseline.openssf.org/versions/2026-02-19)
- [OWASP ASVS](https://owasp.org/www-project-application-security-verification-standard/)
- [OWASP Secure Code Review Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Secure_Code_Review_Cheat_Sheet.html)
- [OWASP SCVS](https://scvs.owasp.org/)
- [OWASP MASVS](https://mas.owasp.org/MASVS/)
- [SLSA 1.2](https://slsa.dev/spec/v1.2/)
- [OWASP Top 10 for Agentic Applications 2026](https://genai.owasp.org/resource/owasp-top-10-for-agentic-applications-for-2026/)
- [MCP specification](https://modelcontextprotocol.io/specification/2025-11-25)
- [CISA Known Exploited Vulnerabilities Catalog](https://www.cisa.gov/known-exploited-vulnerabilities-catalog)
- [FIRST EPSS](https://www.first.org/epss/user-guide)
- [FIRST CVSS v4.0](https://www.first.org/cvss/v4-0/)
