# The3y3 local-first tooling and execution policy

## Contents

1. Objective
2. Command safety classes
3. Capability-first tool ladder
4. Existing environment inventory
5. Tool admission gate
6. Capability matrix
7. Ecosystem-native checks
8. Safe execution envelope
9. Evidence capture
10. Result interpretation
11. Scanner supply-chain lessons

## 1. Objective

Use tools to reduce uncertainty, not to maximize alert count. The default assessment is read-only, local-first, network-minimal, and dependency-neutral. The repository's application dependencies must not change because of an audit.

Before any command, decide:

- what claim or hypothesis it tests;
- what data/code it will read or execute;
- what it may write;
- whether it uses network, credentials, containers, daemons, caches, or package hooks;
- how failure, unsupported files, and partial coverage will be recognized.

## 2. Command safety classes

### Class R0 — metadata only

Examples: filesystem inventory, `git status`, `git rev-parse`, `git ls-files`, `shutil.which`, reading known text files. No repository code execution, writes, or network. Allowed in all modes.

### Class R1 — static local analysis

Examples: exact searches, parser-based linters, SAST/SCA/secret/IaC scanners already installed, reading lockfiles. May create a cache/report only in an authorized output/temp area. No repository code execution or network. Allowed in standard mode after tool/config inspection.

### Class X1 — repository-native execution

Examples: tests, builds, type checks, package-manager audits that invoke project tooling. Inspect scripts and hooks first. Run only in deep mode or when the user explicitly requests it, in a secret-free bounded environment.

### Class N1 — networked read-only

Examples: advisory/KEV/EPSS lookup, registry metadata, rule/database update, remote repository-setting read. Requires authorized network and careful data minimization. Record source and snapshot time.

### Class A1 — active/adversarial

Examples: DAST, fuzzing with resource impact, exploit validation, credential tests. Requires explicit target/method authorization, isolation, stop conditions, and impact boundaries.

### Prohibited without separate authorization

- package installation or lockfile mutation;
- `curl | sh`, remote script execution, or mutable action/plugin execution;
- deploy, publish, merge, commit, push, secret rotation, account/IAM changes;
- destructive Git or filesystem cleanup;
- running repository code with ambient credentials;
- sending code/findings to unapproved external services;
- mounting the host Docker socket into scanner or target containers.

## 3. Capability-first tool ladder

Use in order:

1. **Built-in reasoning and file access:** targeted reads, exact searches, version-control facts.
2. **Repository evidence:** existing configs, previous reports, CI results, SBOM/VEX/provenance, test definitions.
3. **Existing native tools:** language/package/platform commands already present and safe in the selected mode.
4. **Existing security tools:** select by hypothesis and detected technology.
5. **Isolated admitted tool:** only for a material unresolved gap.
6. **Coverage declaration:** when the value of another tool does not justify its risk/cost, report the gap.

Do not add a library to application manifests to perform the audit. Prefer standalone, pinned, verified security binaries or controlled images when a new capability is truly required.

## 4. Existing environment inventory

The bundled `repo_probe.py` reports paths for known tools using executable discovery only; it does not run them. Verify version/help and provenance before execution.

Reject any `git`, scanner, package manager, or helper resolved inside the assessment root or from a relative/empty `PATH` entry. Resolve an absolute external executable, sanitize tool-specific environment overrides, and record the path. A repository can ship a fake binary with a trusted tool name.

Inventory by capability, not brand:

- search and revision: `rg`, `git`;
- secret history/current tree;
- SAST/data flow;
- dependency/SCA and advisory data;
- SBOM/VEX/provenance;
- IaC/container/Kubernetes/cloud configuration;
- workflow/CI policy;
- language-specific security analysis;
- runtime/DAST/fuzzing for authorized deep modes.

If a repository defines a security target, inspect the target implementation and pinned tools before running it. A target named `security` is not inherently safe.

## 5. Tool admission gate

Admit a new security tool only after recording:

```text
capability gap
decision that depends on the result
existing alternatives considered
expected information gain
tool source and owner
exact version or digest
signature/checksum/provenance verification
maintenance and compromise history
data handling and network behavior
execution isolation and privileges
output/caching/writes
license and operational cost if relevant
removal/cleanup plan
```

Prefer a one-shot, standalone, checksum-verified binary or digest-pinned rootless container over adding a project dependency. A container is not a security boundary if privileged, host-networked, broadly mounted, or given the Docker socket.

Security database freshness matters. If network is disallowed, use the installed cache and label its timestamp/staleness.

## 6. Capability matrix

These are examples, not required dependencies. Use only installed or admitted tools and inspect current official usage before running.

| Capability | Common tools/signals | Triage requirement |
|---|---|---|
| Secret discovery | Gitleaks, TruffleHog, platform scanning | Never echo value; verify tracked/history scope; rotate confirmed live secrets |
| Multi-language SAST | CodeQL, Semgrep | Record language/build mode/rules; manually validate source-to-sink and sanitizers |
| Dependency vulnerabilities | OSV-Scanner, Trivy, Grype, native package audits | Verify exact version, environment, advisory freshness, reachability, exposure, fix |
| SBOM | Syft, Trivy, native build metadata | Tie SBOM to actual artifact/build; note missing dynamic/vendored components |
| IaC/cloud | Checkov, KICS, tfsec, Trivy config, provider tools | Confirm module/default expansion and deployed-state uncertainty |
| Containers | Trivy, Grype, Dockle, Hadolint | Distinguish image package CVEs, Dockerfile controls, runtime config, reachability |
| Kubernetes | Kubescape, kube-linter, KICS/Checkov/Trivy | Account for admission policy and live cluster state if observable |
| CI workflows | CodeQL workflow queries, zizmor, OpenSSF Scorecard signals | Manually trace triggers, untrusted data, permissions, artifacts, secrets, refs |
| Shell | ShellCheck plus manual quoting/data-flow review | ShellCheck is correctness-focused; validate attacker-controlled interpolation |
| Fuzz/memory safety | libFuzzer/AFL++, sanitizers, language tooling | Deep/adversarial mode; bounded resources; representative harness and corpus |

No scanner proves complete coverage of OWASP Top 10, ASVS, or a repository.

## 7. Ecosystem-native checks

Use native commands only after confirming their flags, side effects, network behavior, and lifecycle-hook behavior for the installed version.

Potential existing capabilities include:

- JavaScript/TypeScript: package-manager audit and dependency tree; avoid install and postinstall execution.
- Python: environment/package inventory; `pip-audit` only if already installed/admitted; distinguish declared from resolved environments.
- Go: `govulncheck` if installed; module inventory and call analysis; network/cache status matters.
- Rust: `cargo audit` if installed; inspect build scripts/proc macros before broader execution.
- .NET: vulnerable/outdated package listing supported by the installed SDK; capture target frameworks and transitive scope.
- PHP: `composer audit` if supported by installed Composer; do not install/update packages.
- Ruby: Bundler inventory; `bundler-audit` only if installed/admitted.
- JVM: dependency trees and existing organization SCA; avoid introducing a build plugin solely for audit without admission.
- Containers/IaC: parse files statically first; image pulls and registry/cloud reads are networked actions.

Lockfiles and package-manager output may represent a development environment, not the released artifact. Record which manifests, workspaces, groups, platforms, and optional features were included.

## 8. Safe execution envelope

For Class X1, N1, or A1:

- use a disposable workspace/container/VM appropriate to the threat;
- remove ambient cloud, SSH, Git, package-registry, browser, signing, and agent credentials;
- use a non-privileged identity and read-only source mount when possible;
- write only to a designated temporary/output directory;
- deny network by default, then allowlist required endpoints;
- set CPU, memory, process, file, disk, time, and network limits;
- do not share host daemon sockets;
- record environment image/digest and teardown;
- stop on unexpected egress, privilege request, destructive action, or scope expansion.

Package installation and build hooks are code execution. `--dry-run` is not assumed safe without verifying implementation.

## 9. Evidence capture

For every executed check record:

```text
check ID and hypothesis/control
command with secrets redacted
working directory
executable absolute path and version
tool/rule/advisory database version and timestamp
configuration files
target scope and exclusions
environment/sandbox and network policy
started_at, duration, exit_code
stdout/stderr artifact or concise redacted summary
parse errors, unsupported files, truncation, cache status
status: PASS | FAIL | ERROR | PARTIAL | NOT_RUN
```

Do not paste large raw scanner output into the report. Preserve it as an artifact when authorized and cite stable finding/evidence IDs.

## 10. Result interpretation

- Confirm tool execution success separately from policy success.
- Deduplicate by root cause and affected boundary.
- Reproduce or manually trace critical/high alerts.
- Verify suppressions and baselines are scoped, justified, owned, and time-bounded.
- Treat absence of detected secrets as "no matches in recorded scope/rules," not proof of no secrets.
- Treat SCA results without call/configuration analysis as component exposure leads.
- Treat generated-code alerts based on the generator/source and runtime role.
- Record false-positive rationale when it informs future triage.
- A new tool may increase alert volume while decreasing decision quality; measure validated findings and uncertainty reduced.

## 11. Scanner supply-chain lessons

Security tooling runs against sensitive source and often receives CI credentials. It is part of the attack surface.

The March 2026 [Trivy GitHub Action compromise advisory](https://github.com/aquasecurity/trivy/security/advisories/GHSA-69fq-xp46-6x23) documents malicious changes across many mutable action tags. This reinforces:

- pin actions/images/binaries immutably and verify origin;
- minimize token/secrets and egress available to scanners;
- separate untrusted pull-request analysis from privileged release jobs;
- retain provenance and update controls for the scanner itself;
- do not treat "security tool" as a trusted category.

The same principle applies to plugins, package-manager audit helpers, rule packs, models, MCP servers, and agent skills.
