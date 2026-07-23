#!/usr/bin/env python3
"""Read-only, network-free repository census for the3y3.

The probe inventories repository surfaces and emits review signals as JSON. It
does not execute repository code, install packages, follow repository symlinks,
or print file contents/secret values. Signals are leads, never findings.
"""

from __future__ import annotations

import argparse
import collections
import datetime as dt
import json
import os
from pathlib import Path
import re
import shutil
import stat
import subprocess
import sys
from typing import Any, Iterable


SCHEMA_VERSION = "1.0"
DEFAULT_MAX_FILES = 200_000
MAX_SURFACE_PATHS = 500
MAX_SIGNALS = 2_000
MAX_ERRORS = 100
MAX_CONFIG_BYTES = 2 * 1024 * 1024

IGNORED_DIR_NAMES = {
    ".git",
    ".hg",
    ".svn",
    ".cache",
    ".gradle",
    ".mypy_cache",
    ".next",
    ".nox",
    ".nuxt",
    ".npm",
    ".pnpm-store",
    ".pytest_cache",
    ".terraform",
    ".tox",
    ".venv",
    ".yarn",
    "DerivedData",
    "Pods",
    "__pycache__",
    "build",
    "coverage",
    "dist",
    "node_modules",
    "target",
    "vendor",
    "venv",
}

MANIFEST_NAMES = {
    "package.json",
    "pyproject.toml",
    "setup.py",
    "setup.cfg",
    "requirements.txt",
    "pipfile",
    "poetry.toml",
    "cargo.toml",
    "go.mod",
    "go.work",
    "composer.json",
    "gemfile",
    "gemspec",
    "pom.xml",
    "build.gradle",
    "build.gradle.kts",
    "settings.gradle",
    "settings.gradle.kts",
    "gradle.properties",
    "packages.config",
    "paket.dependencies",
    "mix.exs",
    "rebar.config",
    "pubspec.yaml",
    "package.swift",
    "project.yml",
    "conanfile.txt",
    "conanfile.py",
    "vcpkg.json",
    "cmakelists.txt",
    "makefile",
    "justfile",
    "taskfile.yml",
    "taskfile.yaml",
}

LOCKFILE_NAMES = {
    "package-lock.json",
    "npm-shrinkwrap.json",
    "yarn.lock",
    "pnpm-lock.yaml",
    "bun.lock",
    "bun.lockb",
    "pipfile.lock",
    "poetry.lock",
    "uv.lock",
    "cargo.lock",
    "go.sum",
    "composer.lock",
    "gemfile.lock",
    "mix.lock",
    "pubspec.lock",
    "package.resolved",
    "packages.lock.json",
    "paket.lock",
    "gradle.lockfile",
}

CI_EXACT_PATHS = {
    ".gitlab-ci.yml",
    ".gitlab-ci.yaml",
    ".circleci/config.yml",
    ".circleci/config.yaml",
    "azure-pipelines.yml",
    "azure-pipelines.yaml",
    "bitbucket-pipelines.yml",
    "bitbucket-pipelines.yaml",
    "jenkinsfile",
    ".drone.yml",
    ".woodpecker.yml",
}

SECURITY_NAMES = {
    "security.md",
    "codeowners",
    "dependabot.yml",
    "dependabot.yaml",
    "renovate.json",
    "renovate.json5",
    ".semgrep.yml",
    ".semgrep.yaml",
    "codeql-config.yml",
    "codeql-config.yaml",
}

CONTAINER_NAMES = {
    "dockerfile",
    "containerfile",
    "docker-compose.yml",
    "docker-compose.yaml",
    "compose.yml",
    "compose.yaml",
}

AGENTIC_NAMES = {
    "agents.md",
    "claude.md",
    "gemini.md",
    ".mcp.json",
    "mcp.json",
    "copilot-instructions.md",
    "openai.yaml",
}

AGENTIC_DIRS = {
    ".agent",
    ".agents",
    ".claude",
    ".codex",
    ".cursor",
    ".gemini",
    ".windsurf",
}

LANGUAGE_BY_SUFFIX = {
    ".c": "C",
    ".cc": "C++",
    ".cpp": "C++",
    ".cxx": "C++",
    ".h": "C/C++ headers",
    ".hpp": "C++",
    ".cs": "C#",
    ".dart": "Dart",
    ".ex": "Elixir",
    ".exs": "Elixir",
    ".go": "Go",
    ".java": "Java",
    ".js": "JavaScript",
    ".jsx": "JavaScript",
    ".kt": "Kotlin",
    ".kts": "Kotlin",
    ".lua": "Lua",
    ".m": "Objective-C",
    ".mm": "Objective-C++",
    ".php": "PHP",
    ".pl": "Perl",
    ".py": "Python",
    ".rb": "Ruby",
    ".rs": "Rust",
    ".scala": "Scala",
    ".sh": "Shell",
    ".sol": "Solidity",
    ".swift": "Swift",
    ".ts": "TypeScript",
    ".tsx": "TypeScript",
    ".vue": "Vue",
    ".zig": "Zig",
}

KNOWN_TOOLS = {
    "revision_search": ["git", "rg"],
    "secret_scanning": ["gitleaks", "trufflehog"],
    "sast": ["codeql", "semgrep"],
    "sca_sbom": ["osv-scanner", "trivy", "grype", "syft"],
    "iac_container": [
        "checkov",
        "kics",
        "tfsec",
        "kubescape",
        "kube-linter",
        "hadolint",
    ],
    "workflow": ["zizmor", "scorecard"],
    "language_security": [
        "bandit",
        "brakeman",
        "cargo-audit",
        "govulncheck",
        "pip-audit",
        "shellcheck",
    ],
    "package_platform": [
        "npm",
        "pnpm",
        "yarn",
        "bun",
        "python3",
        "pip3",
        "go",
        "cargo",
        "dotnet",
        "composer",
        "bundle",
        "mvn",
        "gradle",
        "docker",
        "podman",
        "terraform",
        "kubectl",
    ],
}

SECRET_EXAMPLE_SUFFIXES = (
    ".example",
    ".sample",
    ".template",
    ".dist",
    ".example.local",
)

PRIVATE_KEY_NAMES = {
    "id_rsa",
    "id_dsa",
    "id_ecdsa",
    "id_ed25519",
    "server.key",
    "private.key",
}

PRIVATE_KEY_SUFFIXES = {".key", ".p12", ".pfx", ".jks", ".keystore", ".pem"}

GITHUB_UNTRUSTED_CONTEXT = re.compile(
    r"\$\{\{\s*github\.(?:event|head_ref|ref|ref_name)\b", re.IGNORECASE
)
GITHUB_USES = re.compile(r"\buses\s*:\s*([^\s#]+)", re.IGNORECASE)
FULL_COMMIT = re.compile(r"^[0-9a-f]{40}(?:[0-9a-f]{24})?$", re.IGNORECASE)


def utc_now() -> str:
    return (
        dt.datetime.now(dt.timezone.utc)
        .replace(microsecond=0)
        .isoformat()
        .replace("+00:00", "Z")
    )


def nearest_repository_marker(root: Path) -> Path | None:
    """Find the nearest filesystem ancestor that declares a Git working tree."""
    for candidate in (root, *root.parents):
        try:
            if (candidate / ".git").exists():
                return candidate
        except OSError:
            continue
    return None


def resolve_external_executable(name: str, root: Path) -> tuple[str | None, list[str]]:
    """Resolve a PATH executable while rejecting relative/repository-local candidates."""
    rejected: list[str] = []
    repository_boundary = nearest_repository_marker(root) or root
    for raw_directory in os.environ.get("PATH", os.defpath).split(os.pathsep):
        if not raw_directory:
            continue
        directory = Path(raw_directory).expanduser()
        if not directory.is_absolute():
            continue
        try:
            resolved_directory = directory.resolve(strict=True)
        except (OSError, RuntimeError):
            continue
        candidate = shutil.which(name, path=str(resolved_directory))
        if not candidate:
            continue
        try:
            resolved_candidate = Path(candidate).resolve(strict=True)
        except (OSError, RuntimeError):
            continue
        if is_within(repository_boundary, resolved_candidate):
            rejected.append(str(resolved_candidate))
            continue
        return str(resolved_candidate), rejected
    return None, rejected


def run_git(
    root: Path, executable: str, args: list[str], *, binary: bool = False
) -> bytes | str | None:
    """Run a read-only git query without shell interpolation."""
    environment = os.environ.copy()
    for key in list(environment):
        if key.startswith("GIT_") or key.startswith("GIT_TRACE"):
            environment.pop(key, None)
        if key in {
            "LD_PRELOAD",
            "LD_LIBRARY_PATH",
            "DYLD_INSERT_LIBRARIES",
            "DYLD_LIBRARY_PATH",
            "DYLD_FRAMEWORK_PATH",
        }:
            environment.pop(key, None)
    environment.update(
        {
            "GIT_CONFIG_GLOBAL": os.devnull,
            "GIT_CONFIG_NOSYSTEM": "1",
            "GIT_CONFIG_SYSTEM": os.devnull,
            "GIT_OPTIONAL_LOCKS": "0",
            "GIT_PAGER": "",
            "GIT_TERMINAL_PROMPT": "0",
            "PAGER": "",
        }
    )
    try:
        proc = subprocess.run(
            [
                executable,
                "-c",
                "core.fsmonitor=false",
                "-c",
                f"core.hooksPath={os.devnull}",
                "-C",
                str(root),
                *args,
            ],
            stdin=subprocess.DEVNULL,
            stdout=subprocess.PIPE,
            stderr=subprocess.DEVNULL,
            env=environment,
            check=False,
            timeout=20,
        )
    except (FileNotFoundError, OSError, subprocess.TimeoutExpired):
        return None
    if proc.returncode != 0:
        return None
    return (
        proc.stdout if binary else proc.stdout.decode("utf-8", errors="replace").strip()
    )


def git_facts(root: Path) -> tuple[dict[str, Any], set[str]]:
    executable, rejected_candidates = resolve_external_executable("git", root)
    marker_boundary = nearest_repository_marker(root)
    facts: dict[str, Any] = {
        "is_repository": False,
        "revision": None,
        "branch": None,
        "dirty": None,
        "status_counts": {},
        "tracked_file_count": None,
        "submodules_declared": (root / ".gitmodules").is_file(),
        "git_executable": executable,
        "rejected_git_candidates": rejected_candidates,
        "top_level": None,
        "root_is_top_level": None,
        "binding_error": None,
        "filesystem_repository_boundary": str(marker_boundary)
        if marker_boundary
        else None,
    }
    tracked: set[str] = set()
    if executable is None:
        return facts, tracked

    inside = run_git(root, executable, ["rev-parse", "--is-inside-work-tree"])
    is_repo = inside == "true"
    if not is_repo:
        return facts, tracked

    raw_top_level = run_git(root, executable, ["rev-parse", "--show-toplevel"])
    if not isinstance(raw_top_level, str):
        facts["binding_error"] = "unable to resolve repository top level"
        return facts, tracked
    try:
        top_level = Path(raw_top_level).resolve(strict=True)
    except (OSError, RuntimeError):
        facts["binding_error"] = "repository top level is not resolvable"
        return facts, tracked
    if not is_within(top_level, root):
        facts["binding_error"] = "git repository does not contain the assessment root"
        return facts, tracked

    facts["is_repository"] = True
    facts["top_level"] = str(top_level)
    facts["root_is_top_level"] = root == top_level
    facts["revision"] = run_git(root, executable, ["rev-parse", "--verify", "HEAD"])
    facts["branch"] = run_git(
        root, executable, ["symbolic-ref", "--quiet", "--short", "HEAD"]
    )
    raw_status = run_git(
        root,
        executable,
        ["status", "--porcelain=v1", "-z", "--untracked-files=normal", "--", "."],
        binary=True,
    )
    counts: collections.Counter[str] = collections.Counter()
    if isinstance(raw_status, bytes):
        entries = [item for item in raw_status.split(b"\0") if item]
        index = 0
        while index < len(entries):
            entry = entries[index]
            if len(entry) >= 3:
                code = entry[:2].decode("ascii", errors="replace")
                counts[code] += 1
                if "R" in code or "C" in code:
                    index += 1
            index += 1
        facts["dirty"] = bool(entries)
        facts["status_counts"] = dict(sorted(counts.items()))

    raw_tracked = run_git(root, executable, ["ls-files", "-z", "--", "."], binary=True)
    if isinstance(raw_tracked, bytes):
        for item in raw_tracked.split(b"\0"):
            if item:
                tracked.add(
                    item.decode("utf-8", errors="surrogateescape").replace(os.sep, "/")
                )
        facts["tracked_file_count"] = len(tracked)
    return facts, tracked


def relative_posix(root: Path, path: Path) -> str:
    try:
        return path.relative_to(root).as_posix()
    except ValueError:
        return path.name


def is_within(root: Path, candidate: Path) -> bool:
    try:
        return os.path.commonpath([str(root), str(candidate)]) == str(root)
    except ValueError:
        return False


def add_bounded(
    target: list[str], value: str, truncated: set[str], category: str
) -> None:
    if value in target:
        return
    if len(target) < MAX_SURFACE_PATHS:
        target.append(value)
    else:
        truncated.add(category)


def classify_surface(
    rel: str, surfaces: dict[str, list[str]], truncated: set[str]
) -> None:
    lower = rel.lower()
    path = Path(rel)
    name = path.name.lower()
    parts = {part.lower() for part in path.parts}

    if (
        name in MANIFEST_NAMES
        or name.endswith(".csproj")
        or name.endswith(".fsproj")
        or name.endswith(".vbproj")
    ):
        add_bounded(surfaces["manifests"], rel, truncated, "manifests")
    if name in LOCKFILE_NAMES:
        add_bounded(surfaces["lockfiles"], rel, truncated, "lockfiles")

    is_github_workflow = lower.startswith(
        ".github/workflows/"
    ) and path.suffix.lower() in {".yml", ".yaml"}
    if is_github_workflow or lower in CI_EXACT_PATHS:
        add_bounded(surfaces["ci_cd"], rel, truncated, "ci_cd")

    if (
        name in CONTAINER_NAMES
        or name.startswith("dockerfile.")
        or name.startswith("containerfile.")
    ):
        add_bounded(surfaces["containers"], rel, truncated, "containers")

    if path.suffix.lower() == ".tf" or name in {
        "terragrunt.hcl",
        "pulumi.yaml",
        "pulumi.yml",
    }:
        add_bounded(
            surfaces["infrastructure_as_code"], rel, truncated, "infrastructure_as_code"
        )
    if (
        "k8s" in parts
        or "kubernetes" in parts
        or "helm" in parts
        or name
        in {
            "chart.yaml",
            "values.yaml",
            "serverless.yml",
            "serverless.yaml",
            "app.yaml",
        }
    ):
        add_bounded(surfaces["deployment"], rel, truncated, "deployment")

    if (
        name in SECURITY_NAMES
        or "security" in parts
        or "sbom" in lower
        or "provenance" in lower
        or "vex" in lower
    ):
        add_bounded(surfaces["security"], rel, truncated, "security")
    if (
        "test" in parts
        or "tests" in parts
        or "spec" in parts
        or name.startswith("test_")
        or name.endswith("_test.go")
    ):
        add_bounded(surfaces["tests"], rel, truncated, "tests")
    if (
        name in {"readme.md", "architecture.md", "threat-model.md", "threat_model.md"}
        or "docs" in parts
    ):
        add_bounded(surfaces["documentation"], rel, truncated, "documentation")

    if (
        name in AGENTIC_NAMES
        or parts.intersection(AGENTIC_DIRS)
        or "copilot-instructions" in lower
    ):
        add_bounded(surfaces["agentic"], rel, truncated, "agentic")
    if "mcp" in name or "mcp" in parts:
        add_bounded(surfaces["mcp"], rel, truncated, "mcp")


def secret_path_kind(name: str) -> str | None:
    lower = name.lower()
    if lower == ".env" or (
        lower.startswith(".env.") and not lower.endswith(SECRET_EXAMPLE_SUFFIXES)
    ):
        return "environment-secret-file"
    if lower in PRIVATE_KEY_NAMES:
        return "private-key-like-file"
    if Path(lower).suffix in PRIVATE_KEY_SUFFIXES:
        return "key-material-like-file"
    return None


def inspect_github_workflow(path: Path, rel: str, add_signal: Any) -> None:
    try:
        if path.stat().st_size > MAX_CONFIG_BYTES:
            add_signal(
                "workflow-too-large-to-inspect",
                "review",
                rel,
                None,
                "Static workflow inspection skipped due to size",
            )
            return
        text = path.read_text(encoding="utf-8", errors="replace")
    except OSError:
        return

    for lineno, line in enumerate(text.splitlines(), start=1):
        stripped = line.strip()
        lowered = stripped.lower()
        if re.search(r"\bpull_request_target\s*:", lowered):
            add_signal(
                "privileged-pull-request-trigger",
                "high",
                rel,
                lineno,
                "Review untrusted checkout, token, artifact, and secret boundaries",
            )
        if re.search(r"\bworkflow_run\s*:", lowered):
            add_signal(
                "workflow-run-privilege-boundary",
                "high",
                rel,
                lineno,
                "Review artifacts and code crossing from the triggering workflow",
            )
        if re.search(r"\bpermissions\s*:\s*write-all\b", lowered):
            add_signal(
                "workflow-write-all-permission",
                "high",
                rel,
                lineno,
                "Broad workflow token permission",
            )
        if re.search(
            r"\b(?:contents|packages|actions|checks|pull-requests|issues|deployments|id-token)\s*:\s*write\b",
            lowered,
        ):
            add_signal(
                "workflow-write-permission",
                "review",
                rel,
                lineno,
                "Confirm least privilege at workflow and job scope",
            )
        if re.search(r"\bsecrets\s*:\s*inherit\b", lowered):
            add_signal(
                "reusable-workflow-inherits-secrets",
                "high",
                rel,
                lineno,
                "Confirm callee trust and minimum secret set",
            )
        if re.search(r"\bpersist-credentials\s*:\s*true\b", lowered):
            add_signal(
                "checkout-persists-credentials",
                "review",
                rel,
                lineno,
                "Confirm untrusted code cannot access the repository token",
            )
        if GITHUB_UNTRUSTED_CONTEXT.search(line):
            add_signal(
                "workflow-expression-uses-event-context",
                "review",
                rel,
                lineno,
                "Trace context into shell, scripts, prompts, and privileged actions",
            )

        match = GITHUB_USES.search(line)
        if not match:
            continue
        reference = match.group(1).strip("\"'")
        if reference.startswith("./"):
            continue
        if reference.startswith("docker://"):
            if "@sha256:" not in reference:
                add_signal(
                    "mutable-container-action-reference",
                    "high",
                    rel,
                    lineno,
                    "Pin container actions by digest",
                )
            continue
        if "@" not in reference:
            add_signal(
                "action-reference-without-version",
                "high",
                rel,
                lineno,
                "Third-party action reference lacks an immutable revision",
            )
            continue
        _, revision = reference.rsplit("@", 1)
        if not FULL_COMMIT.fullmatch(revision):
            add_signal(
                "mutable-action-reference",
                "review",
                rel,
                lineno,
                "A full commit SHA is the immutable GitHub Actions reference",
            )


def probe(root: Path, max_files: int) -> dict[str, Any]:
    git, tracked = git_facts(root)
    surfaces: dict[str, list[str]] = {
        "manifests": [],
        "lockfiles": [],
        "ci_cd": [],
        "containers": [],
        "infrastructure_as_code": [],
        "deployment": [],
        "security": [],
        "tests": [],
        "documentation": [],
        "agentic": [],
        "mcp": [],
    }
    surface_truncated: set[str] = set()
    ignored_dirs: list[str] = []
    errors: list[dict[str, str]] = []
    signals: list[dict[str, Any]] = []
    signal_keys: set[tuple[Any, ...]] = set()
    file_count = 0
    byte_count = 0
    truncated = False
    extensions: collections.Counter[str] = collections.Counter()
    languages: collections.Counter[str] = collections.Counter()

    def add_error(path: str, reason: str) -> None:
        if len(errors) < MAX_ERRORS:
            errors.append({"path": path, "reason": reason})

    def add_signal(
        signal_id: str, priority: str, path: str, line: int | None, note: str
    ) -> None:
        key = (signal_id, path, line)
        if key in signal_keys or len(signals) >= MAX_SIGNALS:
            return
        signal_keys.add(key)
        item: dict[str, Any] = {
            "id": signal_id,
            "priority_hint": priority,
            "path": path,
            "note": note,
        }
        if line is not None:
            item["line"] = line
        if tracked:
            item["tracked"] = path in tracked
        signals.append(item)

    for current, dirnames, filenames in os.walk(root, topdown=True, followlinks=False):
        current_path = Path(current)
        kept_dirs: list[str] = []
        for dirname in sorted(dirnames):
            candidate = current_path / dirname
            rel = relative_posix(root, candidate)
            if candidate.is_symlink():
                try:
                    resolved = candidate.resolve(strict=False)
                    if not is_within(root, resolved):
                        add_signal(
                            "symlink-directory-escapes-root",
                            "high",
                            rel,
                            None,
                            "Directory symlink resolves outside the assessment root",
                        )
                except OSError:
                    add_error(rel, "unable to resolve directory symlink")
                continue
            if dirname in IGNORED_DIR_NAMES:
                if len(ignored_dirs) < MAX_SURFACE_PATHS:
                    ignored_dirs.append(rel)
                continue
            kept_dirs.append(dirname)
        dirnames[:] = kept_dirs

        for filename in sorted(filenames):
            if file_count >= max_files:
                truncated = True
                dirnames[:] = []
                break
            path = current_path / filename
            rel = relative_posix(root, path)
            file_count += 1
            try:
                info = path.lstat()
            except OSError as exc:
                add_error(rel, f"lstat failed: {exc.__class__.__name__}")
                continue

            if stat.S_ISLNK(info.st_mode):
                try:
                    resolved = path.resolve(strict=False)
                    if not is_within(root, resolved):
                        add_signal(
                            "symlink-file-escapes-root",
                            "high",
                            rel,
                            None,
                            "File symlink resolves outside the assessment root",
                        )
                except OSError:
                    add_error(rel, "unable to resolve file symlink")
                continue

            if not stat.S_ISREG(info.st_mode):
                continue

            byte_count += info.st_size
            suffix = path.suffix.lower() or "[no-extension]"
            extensions[suffix] += 1
            language = LANGUAGE_BY_SUFFIX.get(path.suffix.lower())
            if language:
                languages[language] += 1

            classify_surface(rel, surfaces, surface_truncated)

            if info.st_mode & stat.S_IWOTH:
                add_signal(
                    "world-writable-file",
                    "high",
                    rel,
                    None,
                    "File is writable by other users",
                )

            key_kind = secret_path_kind(path.name)
            if key_kind:
                add_signal(
                    key_kind,
                    "high" if key_kind != "key-material-like-file" else "review",
                    rel,
                    None,
                    "Review purpose without exposing content",
                )
                try:
                    if info.st_size <= 10 * 1024 * 1024:
                        with path.open("rb") as handle:
                            prefix = handle.read(16 * 1024)
                        if b"-----BEGIN " in prefix and b"PRIVATE KEY-----" in prefix:
                            add_signal(
                                "private-key-header-detected",
                                "high",
                                rel,
                                None,
                                "Private-key marker detected; do not print content and assess exposure/rotation",
                            )
                except OSError:
                    add_error(rel, "unable to inspect key-material marker")

            lower = rel.lower()
            if lower.startswith(".github/workflows/") and path.suffix.lower() in {
                ".yml",
                ".yaml",
            }:
                inspect_github_workflow(path, rel, add_signal)

    for values in surfaces.values():
        values.sort()
    signals.sort(key=lambda item: (item["path"], item.get("line", 0), item["id"]))

    tool_inventory: dict[str, dict[str, str | None]] = {}
    rejected_tool_candidates: dict[str, list[str]] = {}
    for capability, tools in KNOWN_TOOLS.items():
        tool_inventory[capability] = {}
        for tool in tools:
            executable, rejected = resolve_external_executable(tool, root)
            tool_inventory[capability][tool] = executable
            if rejected:
                rejected_tool_candidates[tool] = rejected

    return {
        "schema_version": SCHEMA_VERSION,
        "probe": {
            "generated_at": utc_now(),
            "mode": "read-only-network-free",
            "root": str(root),
            "max_files": max_files,
            "limitations": [
                "Signals are review leads, not confirmed findings.",
                "Ignored dependency/build/cache directories were not traversed.",
                "No repository code, package manager, scanner, or network request was executed.",
                "Remote repository settings and deployed/runtime state were not observed.",
                "File contents were not emitted; only selected workflow/key-marker patterns were inspected.",
                "Repository-local or relative PATH executables were rejected; Git repository-selection and trace environment variables were cleared.",
            ],
        },
        "repository": git,
        "inventory": {
            "files_seen": file_count,
            "bytes_seen": byte_count,
            "truncated_at_file_limit": truncated,
            "ignored_directories": sorted(ignored_dirs),
            "top_extensions": dict(extensions.most_common(30)),
            "languages_by_file_count": dict(languages.most_common()),
            "errors": errors,
            "errors_truncated": len(errors) >= MAX_ERRORS,
        },
        "surfaces": surfaces,
        "surface_lists_truncated": sorted(surface_truncated),
        "signals": signals,
        "signals_truncated": len(signals) >= MAX_SIGNALS,
        "tool_inventory": tool_inventory,
        "rejected_tool_candidates": rejected_tool_candidates,
    }


def parse_args(argv: Iterable[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Emit a read-only, network-free repository census as JSON."
    )
    parser.add_argument(
        "--root",
        default=".",
        help="Repository or directory to inspect (default: current directory)",
    )
    parser.add_argument(
        "--max-files",
        type=int,
        default=DEFAULT_MAX_FILES,
        help=f"Maximum files to inventory (default: {DEFAULT_MAX_FILES})",
    )
    parser.add_argument("--pretty", action="store_true", help="Pretty-print JSON")
    parser.add_argument(
        "--version", action="version", version=f"repo_probe.py {SCHEMA_VERSION}"
    )
    return parser.parse_args(list(argv))


def main(argv: Iterable[str] = ()) -> int:
    args = parse_args(argv)
    if args.max_files < 1:
        print("error: --max-files must be positive", file=sys.stderr)
        return 2
    candidate = Path(args.root).expanduser()
    try:
        root = candidate.resolve(strict=True)
    except (OSError, RuntimeError) as exc:
        print(f"error: cannot resolve root: {exc}", file=sys.stderr)
        return 2
    if not root.is_dir():
        print("error: --root must be a directory", file=sys.stderr)
        return 2

    result = probe(root, args.max_files)
    json.dump(
        result,
        sys.stdout,
        indent=2 if args.pretty else None,
        sort_keys=True,
        ensure_ascii=False,
    )
    sys.stdout.write("\n")
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
