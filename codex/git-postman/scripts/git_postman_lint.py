#!/usr/bin/env python3
"""Lightweight public-voice linting for Git messages."""

from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path


FAIL_PATTERNS = [
    (r"\bwip\b", "Avoid WIP in public history."),
    (r"\b(misc|stuff|things)\b", "Name the real scope or outcome."),
    (r"\b(clean\s*up|cleanup)\b", "Say what became safer, clearer, or removed."),
    (r"\bmake (it|things|stuff)\b", "Name the actual capability or behavior."),
    (r"\b(make|made) .*\b(more human|sharper|nicer|better)\b", "Avoid editor/process language."),
    (r"\bcopy pass\b", "Avoid internal copy-editing language."),
    (r"\bai slop\b", "Avoid reputation-damaging AI slang in public history."),
    (r"\bfix (stuff|things|bug|bugs)\b", "Name the concrete failure being fixed."),
]

WARN_PATTERNS = [
    (r"\bnot .+ but .+", "Prefer affirmative product language over 'not X but Y'."),
    (r"\bfinally\b", "Avoid implying the project was previously unreliable."),
    (r"\bperfect\b", "Avoid absolute claims without proof."),
    (r"\bproduction[- ]ready\b", "Use only when release evidence supports it."),
    (r"\bbattle[- ]tested\b", "Use only with concrete proof."),
    (r"\bgenerated copy\b", "Avoid exposing internal generation process unless relevant."),
]

INTENT_VERBS = {
    "add",
    "align",
    "clarify",
    "codify",
    "document",
    "enforce",
    "expose",
    "fix",
    "frame",
    "harden",
    "hydrate",
    "invite",
    "preserve",
    "present",
    "protect",
    "reconcile",
    "remove",
    "route",
    "ship",
    "stabilize",
    "validate",
    "version",
}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Lint public Git messages for GIT POSTMAN voice.")
    parser.add_argument("--message", help="Commit/PR/release message text to lint.")
    parser.add_argument("--message-file", help="Path to a file containing the message to lint.")
    return parser.parse_args()


def load_message(args: argparse.Namespace) -> str:
    if args.message_file:
        return Path(args.message_file).read_text(encoding="utf-8")
    if args.message:
        return args.message
    if not sys.stdin.isatty():
        return sys.stdin.read()
    raise SystemExit("Provide --message, --message-file, or stdin.")


def normalize_subject(subject: str) -> str:
    if ":" in subject:
        return subject.split(":", 1)[1].strip()
    return subject.strip()


def main() -> int:
    args = parse_args()
    message = load_message(args).strip()
    lines = [line.rstrip() for line in message.splitlines()]
    subject = lines[0].strip() if lines else ""
    body = "\n".join(lines[1:]).strip()
    full_lower = message.lower()
    subject_words = normalize_subject(subject).lower().split()

    failures: list[str] = []
    warnings: list[str] = []

    if not subject:
        failures.append("Missing subject line.")
    elif len(subject) > 72:
        warnings.append("Subject is longer than 72 characters; tighten it if possible.")

    if subject.endswith("."):
        warnings.append("Subject should not end with a period.")

    if subject_words and subject_words[0] not in INTENT_VERBS and not re.match(r"^[a-z]+(\([^)]+\))?!?:", subject):
        warnings.append("Subject may not read as clear maintainer intent; use an action verb or repo scope.")

    for pattern, note in FAIL_PATTERNS:
        if re.search(pattern, full_lower):
            failures.append(note)

    for pattern, note in WARN_PATTERNS:
        if re.search(pattern, full_lower):
            warnings.append(note)

    if len(lines) > 1 and lines[1].strip():
        warnings.append("Separate subject and body with a blank line.")

    if body and not re.search(r"\b(why|because|so that|constraint|rejected|tested|not-tested|directive)\b", body.lower()):
        warnings.append("Body exists but may not explain rationale, constraints, or verification.")

    if failures:
        print("GIT POSTMAN: FAIL")
        for item in failures:
            print(f"- {item}")
        if warnings:
            print("\nWarnings:")
            for item in warnings:
                print(f"- {item}")
        return 1

    print("GIT POSTMAN: PASS")
    if warnings:
        print("Warnings:")
        for item in warnings:
            print(f"- {item}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
