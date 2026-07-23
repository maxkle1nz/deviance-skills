#!/usr/bin/env python3
"""Validate the3y3 evidence ledgers with structural and semantic checks.

This validator uses only the Python standard library. The bundled JSON Schema
documents the portable structure; this script additionally enforces cross-field
truth invariants that JSON Schema alone cannot express.
"""

from __future__ import annotations

import argparse
import datetime as dt
import json
from pathlib import Path
import re
import sys
from typing import Any, Iterable


SCHEMA_VERSION = "1.0"
ALLOWED_MODES = {"quick", "standard", "deep", "adversarial"}
ALLOWED_WORKING_TREE_STATE = {"CLEAN", "DIRTY", "NOT_APPLICABLE", "UNKNOWN"}
ALLOWED_OBSERVED_RISK = {
    "CRITICAL",
    "HIGH",
    "MODERATE",
    "LOW_OBSERVED",
    "INDETERMINATE",
}
ALLOWED_ASSURANCE = {"HIGH", "MEDIUM", "LOW", "INSUFFICIENT"}
ALLOWED_VERDICTS = {
    "PASS",
    "FAIL",
    "PARTIAL",
    "UNKNOWN",
    "NOT_TESTED",
    "BLOCKED",
    "NOT_APPLICABLE",
}
ALLOWED_CHECK_STATUS = {"PASS", "FAIL", "ERROR", "PARTIAL", "NOT_RUN"}
ALLOWED_SEVERITY = {"CRITICAL", "HIGH", "MEDIUM", "LOW", "INFO"}
ALLOWED_VALIDATION = {"CONFIRMED", "LIKELY", "UNCONFIRMED", "FALSE_POSITIVE"}
ALLOWED_CONFIDENCE = {"HIGH", "MEDIUM", "LOW"}
ALLOWED_REACHABILITY = {
    "REACHABLE",
    "CONDITIONALLY_REACHABLE",
    "UNREACHABLE",
    "UNKNOWN",
}
ALLOWED_EXPOSURE = {
    "INTERNET_UNAUTHENTICATED",
    "INTERNET_AUTHENTICATED",
    "PARTNER_OR_WEBHOOK",
    "INTERNAL_NETWORK",
    "LOCAL_USER",
    "CI_OR_BUILD",
    "MAINTAINER_OR_ADMIN",
    "SUPPLY_CHAIN_CONSUMER",
    "NONE_OBSERVED",
    "UNKNOWN",
}
ALLOWED_EVIDENCE_KIND = {
    "artifact",
    "history",
    "tool",
    "test",
    "runtime",
    "attestation",
    "external-intel",
}
ALLOWED_RECOMMENDATION_PRIORITY = {"now", "next", "later"}
ALLOWED_UNKNOWN_PRIORITY = {"HIGH", "MEDIUM", "LOW"}
PLACEHOLDER = re.compile(
    r"(?:<[^>]+>|\bTODO\b|\bTBD\b|REPLACE_ME|YYYY-MM-DD)", re.IGNORECASE
)
ID_PATTERNS = {
    "evidence": re.compile(r"^E-\d{3,}$"),
    "checks": re.compile(r"^C-\d{3,}$"),
    "findings": re.compile(r"^F-\d{3,}$"),
    "hypotheses": re.compile(r"^H-\d{3,}$"),
    "recommendations": re.compile(r"^R-\d{3,}$"),
}
FORBIDDEN_EVIDENCE_KEYS = {
    "secret_value",
    "raw_secret",
    "private_key",
    "access_token",
    "password_value",
}
SEVERITY_RANK = {"INFO": 0, "LOW": 1, "MEDIUM": 2, "HIGH": 3, "CRITICAL": 4}
RISK_RANK = {"LOW_OBSERVED": 1, "MODERATE": 2, "HIGH": 3, "CRITICAL": 4}


class LedgerValidator:
    def __init__(self, data: Any) -> None:
        self.data = data
        self.errors: list[str] = []
        self.warnings: list[str] = []
        self.ids: dict[str, set[str]] = {name: set() for name in ID_PATTERNS}
        self.evidence_kinds: dict[str, str] = {}

    def error(self, path: str, message: str) -> None:
        self.errors.append(f"{path}: {message}")

    def warn(self, path: str, message: str) -> None:
        self.warnings.append(f"{path}: {message}")

    def require_dict(self, value: Any, path: str) -> dict[str, Any]:
        if not isinstance(value, dict):
            self.error(path, "must be an object")
            return {}
        return value

    def only_keys(self, obj: dict[str, Any], allowed: set[str], path: str) -> None:
        unexpected = sorted(set(obj) - allowed)
        if unexpected:
            self.error(path, f"contains unsupported field(s): {', '.join(unexpected)}")

    def require_list(self, value: Any, path: str) -> list[Any]:
        if not isinstance(value, list):
            self.error(path, "must be an array")
            return []
        return value

    def require_text(
        self, obj: dict[str, Any], key: str, path: str, *, allow_empty: bool = False
    ) -> str:
        value = obj.get(key)
        key_path = f"{path}.{key}"
        if not isinstance(value, str):
            self.error(key_path, "must be a string")
            return ""
        if not allow_empty and not value.strip():
            self.error(key_path, "must not be empty")
        if PLACEHOLDER.search(value):
            self.error(key_path, "contains a placeholder")
        return value

    def require_text_list(
        self,
        obj: dict[str, Any],
        key: str,
        path: str,
        *,
        minimum: int = 0,
    ) -> list[str]:
        values = self.require_list(obj.get(key), f"{path}.{key}")
        if len(values) < minimum:
            self.error(f"{path}.{key}", f"must contain at least {minimum} item(s)")
        result: list[str] = []
        for index, value in enumerate(values):
            item_path = f"{path}.{key}[{index}]"
            if not isinstance(value, str) or not value.strip():
                self.error(item_path, "must be a non-empty string")
                continue
            if PLACEHOLDER.search(value):
                self.error(item_path, "contains a placeholder")
            result.append(value)
        return result

    def require_bool(self, obj: dict[str, Any], key: str, path: str) -> bool | None:
        value = obj.get(key)
        if not isinstance(value, bool):
            self.error(f"{path}.{key}", "must be a boolean")
            return None
        return value

    def require_timestamp(self, obj: dict[str, Any], key: str, path: str) -> str:
        value = self.require_text(obj, key, path)
        if not value:
            return value
        try:
            parsed = dt.datetime.fromisoformat(value.replace("Z", "+00:00"))
        except ValueError:
            self.error(f"{path}.{key}", "must be an ISO 8601 timestamp")
            return value
        if parsed.tzinfo is None:
            self.error(f"{path}.{key}", "must include a timezone")
        return value

    def enum(self, value: Any, allowed: set[str], path: str) -> None:
        if value not in allowed:
            self.error(path, f"must be one of {sorted(allowed)}")

    def collect_id(self, category: str, item: dict[str, Any], path: str) -> str:
        value = item.get("id")
        if not isinstance(value, str):
            self.error(f"{path}.id", "must be a string")
            return ""
        pattern = ID_PATTERNS[category]
        if not pattern.fullmatch(value):
            self.error(f"{path}.id", f"must match {pattern.pattern}")
        if value in self.ids[category]:
            self.error(f"{path}.id", "is duplicated")
        self.ids[category].add(value)
        return value

    def check_no_forbidden_keys(self, value: Any, path: str = "$") -> None:
        if isinstance(value, dict):
            for key, child in value.items():
                if str(key).lower() in FORBIDDEN_EVIDENCE_KEYS:
                    self.error(
                        f"{path}.{key}",
                        "forbidden secret-bearing field; store only redacted metadata",
                    )
                self.check_no_forbidden_keys(child, f"{path}.{key}")
        elif isinstance(value, list):
            for index, child in enumerate(value):
                self.check_no_forbidden_keys(child, f"{path}[{index}]")

    def validate(self) -> None:
        root = self.require_dict(self.data, "$")
        self.only_keys(
            root,
            {
                "schema_version",
                "assessment",
                "summary",
                "domains",
                "checks",
                "findings",
                "hypotheses",
                "evidence",
                "unknowns",
                "recommendations",
            },
            "$",
        )
        if root.get("schema_version") != SCHEMA_VERSION:
            self.error("$.schema_version", f"must equal {SCHEMA_VERSION!r}")

        assessment = self.validate_assessment(root)
        summary = self.validate_summary(root)
        evidence = self.validate_evidence(root)
        checks = self.validate_checks(root)
        domains = self.validate_domains(root)
        findings = self.validate_findings(root)
        hypotheses = self.validate_hypotheses(root)
        recommendations = self.validate_recommendations(root)
        unknowns = self.validate_unknowns(root)

        self.validate_references(root, self.ids["evidence"])
        self.validate_semantics(
            summary, domains, findings, hypotheses, unknowns, checks
        )
        self.check_no_forbidden_keys(root)

        # Retain local names to make accidental removal of validation phases obvious.
        _ = assessment, evidence, recommendations

    def validate_assessment(self, root: dict[str, Any]) -> dict[str, Any]:
        assessment = self.require_dict(root.get("assessment"), "$.assessment")
        self.only_keys(
            assessment,
            {
                "repository_root",
                "revision",
                "observation_point",
                "working_tree_state",
                "assessed_at",
                "mode",
                "target_type",
                "scope",
                "environment",
                "network_policy",
                "execution_policy",
                "assessor",
                "external_evidence",
                "exclusions",
                "limitations",
            },
            "$.assessment",
        )
        for key in (
            "repository_root",
            "revision",
            "observation_point",
            "target_type",
            "scope",
            "environment",
            "network_policy",
            "execution_policy",
            "assessor",
        ):
            self.require_text(assessment, key, "$.assessment")
        self.require_timestamp(assessment, "assessed_at", "$.assessment")
        self.enum(assessment.get("mode"), ALLOWED_MODES, "$.assessment.mode")
        self.enum(
            assessment.get("working_tree_state"),
            ALLOWED_WORKING_TREE_STATE,
            "$.assessment.working_tree_state",
        )
        self.require_text_list(assessment, "external_evidence", "$.assessment")
        self.require_text_list(assessment, "exclusions", "$.assessment")
        self.require_text_list(assessment, "limitations", "$.assessment")
        return assessment

    def validate_summary(self, root: dict[str, Any]) -> dict[str, Any]:
        summary = self.require_dict(root.get("summary"), "$.summary")
        self.only_keys(summary, {"observed_risk", "assurance", "verdict"}, "$.summary")
        self.enum(
            summary.get("observed_risk"),
            ALLOWED_OBSERVED_RISK,
            "$.summary.observed_risk",
        )
        self.enum(summary.get("assurance"), ALLOWED_ASSURANCE, "$.summary.assurance")
        self.require_text(summary, "verdict", "$.summary")
        return summary

    def validate_evidence(self, root: dict[str, Any]) -> list[Any]:
        evidence = self.require_list(root.get("evidence"), "$.evidence")
        if not evidence:
            self.error("$.evidence", "must contain at least one evidence item")
        for index, raw in enumerate(evidence):
            path = f"$.evidence[{index}]"
            item = self.require_dict(raw, path)
            self.only_keys(
                item,
                {
                    "id",
                    "kind",
                    "locator",
                    "summary",
                    "observed_at",
                    "revision",
                    "redacted",
                    "limitations",
                },
                path,
            )
            evidence_id = self.collect_id("evidence", item, path)
            kind = item.get("kind")
            self.enum(kind, ALLOWED_EVIDENCE_KIND, f"{path}.kind")
            if evidence_id and isinstance(kind, str):
                self.evidence_kinds[evidence_id] = kind
            for key in ("locator", "summary", "revision"):
                self.require_text(item, key, path)
            self.require_timestamp(item, "observed_at", path)
            redacted = self.require_bool(item, "redacted", path)
            self.require_text_list(item, "limitations", path)
            if redacted is not True and any(
                term in str(item.get("summary", "")).lower()
                for term in ("secret", "credential", "private key", "token")
            ):
                self.error(
                    f"{path}.redacted",
                    "security-sensitive evidence must be marked redacted",
                )
        return evidence

    def validate_checks(self, root: dict[str, Any]) -> list[Any]:
        checks = self.require_list(root.get("checks"), "$.checks")
        for index, raw in enumerate(checks):
            path = f"$.checks[{index}]"
            item = self.require_dict(raw, path)
            self.only_keys(
                item,
                {
                    "id",
                    "name",
                    "status",
                    "scope",
                    "evidence_refs",
                    "limitations",
                    "reason",
                    "command",
                    "tool",
                    "tool_version",
                    "working_directory",
                    "configuration",
                    "exclusions",
                    "network",
                    "exit_code",
                    "started_at",
                    "duration_seconds",
                },
                path,
            )
            self.collect_id("checks", item, path)
            self.require_text(item, "name", path)
            status = item.get("status")
            self.enum(status, ALLOWED_CHECK_STATUS, f"{path}.status")
            self.require_text(item, "scope", path)
            refs = self.require_text_list(item, "evidence_refs", path)
            self.require_text_list(item, "limitations", path)
            if status == "NOT_RUN":
                self.require_text(item, "reason", path)
                return_fields = (
                    "command",
                    "tool",
                    "tool_version",
                    "working_directory",
                    "started_at",
                )
                if any(item.get(field) not in (None, "") for field in return_fields):
                    self.warn(path, "NOT_RUN check contains execution metadata")
                continue

            if not refs:
                self.error(f"{path}.evidence_refs", "executed check requires evidence")
            for key in (
                "command",
                "tool",
                "tool_version",
                "working_directory",
                "network",
            ):
                self.require_text(item, key, path)
            self.require_timestamp(item, "started_at", path)
            self.require_text_list(item, "configuration", path)
            self.require_text_list(item, "exclusions", path)
            duration = item.get("duration_seconds")
            if (
                not isinstance(duration, (int, float))
                or isinstance(duration, bool)
                or duration < 0
            ):
                self.error(f"{path}.duration_seconds", "must be a non-negative number")
            exit_code = item.get("exit_code")
            if not isinstance(exit_code, int) or isinstance(exit_code, bool):
                self.error(f"{path}.exit_code", "must be an integer")
        return checks

    def validate_domains(self, root: dict[str, Any]) -> list[Any]:
        domains = self.require_list(root.get("domains"), "$.domains")
        if not domains:
            self.error("$.domains", "must contain at least one assessed domain")
        seen_domains: set[str] = set()
        for index, raw in enumerate(domains):
            path = f"$.domains[{index}]"
            item = self.require_dict(raw, path)
            self.only_keys(
                item,
                {
                    "id",
                    "name",
                    "applicability",
                    "critical",
                    "depth",
                    "verdict",
                    "confidence",
                    "evidence_refs",
                    "main_gap",
                },
                path,
            )
            domain_id = self.require_text(item, "id", path)
            self.require_text(item, "name", path)
            if domain_id in seen_domains:
                self.error(f"{path}.id", "is duplicated")
            seen_domains.add(domain_id)
            critical = self.require_bool(item, "critical", path)
            depth = item.get("depth")
            if (
                not isinstance(depth, int)
                or isinstance(depth, bool)
                or not 0 <= depth <= 4
            ):
                self.error(f"{path}.depth", "must be an integer from 0 to 4")
                depth = -1
            verdict = item.get("verdict")
            self.enum(verdict, ALLOWED_VERDICTS, f"{path}.verdict")
            self.enum(item.get("confidence"), ALLOWED_CONFIDENCE, f"{path}.confidence")
            self.require_text(item, "applicability", path)
            self.require_text(item, "main_gap", path, allow_empty=True)
            refs = self.require_text_list(item, "evidence_refs", path)
            if verdict in {"PASS", "FAIL", "PARTIAL"} and not refs:
                self.error(
                    f"{path}.evidence_refs", "evidenced verdict requires evidence"
                )
            if depth == 0 and verdict in {"PASS", "FAIL", "PARTIAL"}:
                self.error(
                    path, "depth 0 cannot have an evidenced PASS/FAIL/PARTIAL verdict"
                )
            if verdict == "NOT_APPLICABLE" and depth != 0:
                self.error(path, "NOT_APPLICABLE domain must have depth 0")
            if verdict == "NOT_APPLICABLE" and critical is True:
                self.error(path, "a non-applicable domain cannot be marked critical")
            evidence_kinds = {self.evidence_kinds.get(ref) for ref in refs}
            if depth >= 3:
                if not evidence_kinds.intersection({"artifact", "history"}):
                    self.error(
                        path,
                        "depth 3-4 requires artifact or history evidence for manual path/control review",
                    )
                if not evidence_kinds.intersection({"tool", "test", "runtime"}):
                    self.error(
                        path,
                        "depth 3-4 requires tool, test, or runtime corroboration",
                    )
            if depth == 4 and not evidence_kinds.intersection({"test", "runtime"}):
                self.error(path, "depth 4 requires test or runtime evidence")
        return domains

    def validate_findings(self, root: dict[str, Any]) -> list[Any]:
        findings = self.require_list(root.get("findings"), "$.findings")
        for index, raw in enumerate(findings):
            path = f"$.findings[{index}]"
            item = self.require_dict(raw, path)
            self.only_keys(
                item,
                {
                    "id",
                    "title",
                    "type",
                    "severity",
                    "severity_rationale",
                    "validation",
                    "confidence",
                    "asset",
                    "location",
                    "attacker_capability",
                    "prerequisites",
                    "exposure",
                    "reachability",
                    "attack_path",
                    "impact",
                    "evidence_refs",
                    "compensating_controls",
                    "assumptions",
                    "remediation",
                    "verification",
                    "owner_type",
                    "effort",
                    "standards",
                },
                path,
            )
            self.collect_id("findings", item, path)
            for key in (
                "title",
                "type",
                "severity_rationale",
                "asset",
                "location",
                "attacker_capability",
                "prerequisites",
                "attack_path",
                "impact",
                "remediation",
                "verification",
                "owner_type",
            ):
                self.require_text(item, key, path)
            if item.get("type") not in {"vulnerability", "control-gap"}:
                self.error(f"{path}.type", "must be vulnerability or control-gap")
            severity = item.get("severity")
            validation = item.get("validation")
            reachability = item.get("reachability")
            self.enum(severity, ALLOWED_SEVERITY, f"{path}.severity")
            self.enum(validation, ALLOWED_VALIDATION, f"{path}.validation")
            self.enum(item.get("confidence"), ALLOWED_CONFIDENCE, f"{path}.confidence")
            self.enum(reachability, ALLOWED_REACHABILITY, f"{path}.reachability")
            self.enum(item.get("exposure"), ALLOWED_EXPOSURE, f"{path}.exposure")
            refs = self.require_text_list(item, "evidence_refs", path)
            controls = self.require_text_list(item, "compensating_controls", path)
            assumptions = self.require_text_list(item, "assumptions", path)
            self.require_text_list(item, "standards", path)
            if item.get("effort") not in {"S", "M", "L"}:
                self.error(f"{path}.effort", "must be S, M, or L")
            if validation in {"CONFIRMED", "LIKELY", "FALSE_POSITIVE"} and not refs:
                self.error(
                    f"{path}.evidence_refs", "validated finding requires evidence"
                )
            if validation == "UNCONFIRMED":
                self.error(
                    f"{path}.validation", "unconfirmed items belong in hypotheses"
                )
            if validation == "LIKELY" and not assumptions:
                self.error(
                    f"{path}.assumptions",
                    "LIKELY finding must name its remaining assumption",
                )
            if severity == "CRITICAL" and validation in {"CONFIRMED", "LIKELY"}:
                if reachability in {"UNKNOWN", "UNREACHABLE"}:
                    self.error(
                        path,
                        "CRITICAL finding requires reachable or conditionally reachable effect",
                    )
                if item.get("confidence") == "LOW":
                    self.error(path, "CRITICAL finding cannot have LOW confidence")
            if not controls:
                self.warn(
                    f"{path}.compensating_controls",
                    "explicitly use ['none observed'] when no control applies",
                )
        return findings

    def validate_hypotheses(self, root: dict[str, Any]) -> list[Any]:
        hypotheses = self.require_list(root.get("hypotheses"), "$.hypotheses")
        for index, raw in enumerate(hypotheses):
            path = f"$.hypotheses[{index}]"
            item = self.require_dict(raw, path)
            self.only_keys(
                item,
                {
                    "id",
                    "title",
                    "severity_if_true",
                    "confidence",
                    "reason",
                    "decision_at_risk",
                    "next_evidence",
                    "evidence_refs",
                },
                path,
            )
            self.collect_id("hypotheses", item, path)
            for key in ("title", "reason", "decision_at_risk", "next_evidence"):
                self.require_text(item, key, path)
            self.enum(
                item.get("severity_if_true"),
                ALLOWED_SEVERITY,
                f"{path}.severity_if_true",
            )
            self.enum(item.get("confidence"), ALLOWED_CONFIDENCE, f"{path}.confidence")
            self.require_text_list(item, "evidence_refs", path, minimum=1)
        return hypotheses

    def validate_recommendations(self, root: dict[str, Any]) -> list[Any]:
        recommendations = self.require_list(
            root.get("recommendations"), "$.recommendations"
        )
        for index, raw in enumerate(recommendations):
            path = f"$.recommendations[{index}]"
            item = self.require_dict(raw, path)
            self.only_keys(
                item,
                {
                    "id",
                    "priority",
                    "addresses",
                    "action",
                    "rationale",
                    "reuse",
                    "owner_type",
                    "effort",
                    "verification",
                },
                path,
            )
            self.collect_id("recommendations", item, path)
            for key in ("action", "rationale", "reuse", "owner_type", "verification"):
                self.require_text(item, key, path)
            self.enum(
                item.get("priority"),
                ALLOWED_RECOMMENDATION_PRIORITY,
                f"{path}.priority",
            )
            self.require_text_list(item, "addresses", path, minimum=1)
            if item.get("effort") not in {"S", "M", "L"}:
                self.error(f"{path}.effort", "must be S, M, or L")
        return recommendations

    def validate_unknowns(self, root: dict[str, Any]) -> list[Any]:
        unknowns = self.require_list(root.get("unknowns"), "$.unknowns")
        for index, raw in enumerate(unknowns):
            path = f"$.unknowns[{index}]"
            item = self.require_dict(raw, path)
            self.only_keys(
                item,
                {"priority", "area", "risk_decision", "reason", "next_evidence"},
                path,
            )
            for key in ("area", "risk_decision", "reason", "next_evidence"):
                self.require_text(item, key, path)
            self.enum(
                item.get("priority"), ALLOWED_UNKNOWN_PRIORITY, f"{path}.priority"
            )
        return unknowns

    def validate_references(self, root: dict[str, Any], evidence_ids: set[str]) -> None:
        for collection in ("checks", "domains", "findings", "hypotheses"):
            for index, item in enumerate(root.get(collection, [])):
                if not isinstance(item, dict):
                    continue
                refs = item.get("evidence_refs", [])
                if not isinstance(refs, list):
                    continue
                for ref_index, ref in enumerate(refs):
                    if ref not in evidence_ids:
                        self.error(
                            f"$.{collection}[{index}].evidence_refs[{ref_index}]",
                            f"references missing evidence ID {ref!r}",
                        )

    def validate_semantics(
        self,
        summary: dict[str, Any],
        domains: list[Any],
        findings: list[Any],
        hypotheses: list[Any],
        unknowns: list[Any],
        checks: list[Any],
    ) -> None:
        relevant_findings = [
            item
            for item in findings
            if isinstance(item, dict)
            and item.get("validation") in {"CONFIRMED", "LIKELY"}
            and item.get("reachability") != "UNREACHABLE"
            and item.get("severity") in SEVERITY_RANK
        ]
        maximum_severity = max(
            (SEVERITY_RANK[item["severity"]] for item in relevant_findings),
            default=0,
        )
        observed_risk = summary.get("observed_risk")
        if (
            observed_risk == "INDETERMINATE"
            and maximum_severity >= SEVERITY_RANK["MEDIUM"]
        ):
            self.error(
                "$.summary.observed_risk",
                "known material findings require a corresponding observed-risk label",
            )
        if observed_risk == "INDETERMINATE" and summary.get("assurance") in {
            "HIGH",
            "MEDIUM",
        }:
            self.error(
                "$.summary.assurance",
                "INDETERMINATE observed risk is incompatible with HIGH or MEDIUM assurance",
            )
        if observed_risk in RISK_RANK and RISK_RANK[observed_risk] < maximum_severity:
            self.error(
                "$.summary.observed_risk",
                "understates the highest confirmed/likely reachable finding",
            )
        required_severity = {
            "MODERATE": SEVERITY_RANK["MEDIUM"],
            "HIGH": SEVERITY_RANK["HIGH"],
            "CRITICAL": SEVERITY_RANK["CRITICAL"],
        }
        if (
            observed_risk in required_severity
            and maximum_severity < required_severity[observed_risk]
        ):
            self.error(
                "$.summary.observed_risk",
                f"{observed_risk} requires a corresponding confirmed/likely reachable finding",
            )

        critical_domains = [
            item
            for item in domains
            if isinstance(item, dict) and item.get("critical") is True
        ]
        assurance = summary.get("assurance")
        if assurance in {"HIGH", "MEDIUM"} and not critical_domains:
            self.error(
                "$.summary.assurance",
                "HIGH/MEDIUM assurance requires explicitly identified critical domains",
            )
        if assurance == "HIGH":
            for index, domain in enumerate(domains):
                if not isinstance(domain, dict) or domain.get("critical") is not True:
                    continue
                if domain.get("depth", -1) < 3:
                    self.error(
                        f"$.domains[{index}].depth",
                        "critical domain must reach depth 3 for HIGH assurance",
                    )
                if domain.get("verdict") in {"UNKNOWN", "NOT_TESTED", "BLOCKED"}:
                    self.error(
                        f"$.domains[{index}].verdict",
                        "critical domain cannot remain unresolved for HIGH assurance",
                    )
            if any(
                isinstance(item, dict)
                and item.get("severity_if_true") in {"CRITICAL", "HIGH"}
                for item in hypotheses
            ):
                self.error(
                    "$.summary.assurance",
                    "HIGH assurance is incompatible with unresolved HIGH/CRITICAL hypotheses",
                )
            if any(
                isinstance(item, dict) and item.get("priority") == "HIGH"
                for item in unknowns
            ):
                self.error(
                    "$.summary.assurance",
                    "HIGH assurance is incompatible with high-priority unknowns",
                )
            if any(
                isinstance(item, dict) and item.get("status") in {"ERROR", "PARTIAL"}
                for item in checks
            ):
                self.warn(
                    "$.summary.assurance",
                    "HIGH assurance includes an ERROR/PARTIAL check; confirm it is non-critical",
                )
        if assurance == "MEDIUM":
            for index, domain in enumerate(domains):
                if (
                    isinstance(domain, dict)
                    and domain.get("critical") is True
                    and domain.get("depth", -1) < 2
                ):
                    self.error(
                        f"$.domains[{index}].depth",
                        "critical domain must reach depth 2 for MEDIUM assurance",
                    )

        for item in relevant_findings:
            if (
                item.get("severity") in {"CRITICAL", "HIGH"}
                and item.get("confidence") == "LOW"
            ):
                self.error(
                    f"$.findings[{findings.index(item)}].confidence",
                    "material confirmed/likely finding cannot have LOW confidence",
                )


def parse_args(argv: Iterable[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Validate a the3y3 evidence ledger JSON file."
    )
    parser.add_argument("ledger", help="Path to the evidence ledger JSON")
    parser.add_argument(
        "--json", action="store_true", help="Emit validation result as JSON"
    )
    parser.add_argument(
        "--version", action="version", version=f"validate_evidence.py {SCHEMA_VERSION}"
    )
    return parser.parse_args(list(argv))


def main(argv: Iterable[str] = ()) -> int:
    args = parse_args(argv)
    path = Path(args.ledger).expanduser()
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except FileNotFoundError:
        print(f"error: ledger not found: {path}", file=sys.stderr)
        return 2
    except (OSError, UnicodeError) as exc:
        print(f"error: cannot read ledger: {exc}", file=sys.stderr)
        return 2
    except json.JSONDecodeError as exc:
        print(
            f"error: invalid JSON at line {exc.lineno}, column {exc.colno}: {exc.msg}",
            file=sys.stderr,
        )
        return 2

    validator = LedgerValidator(data)
    validator.validate()
    result = {
        "valid": not validator.errors,
        "errors": validator.errors,
        "warnings": validator.warnings,
    }
    if args.json:
        json.dump(result, sys.stdout, indent=2, ensure_ascii=False)
        sys.stdout.write("\n")
    else:
        print("VALID" if result["valid"] else "INVALID")
        for error in validator.errors:
            print(f"ERROR: {error}")
        for warning in validator.warnings:
            print(f"WARNING: {warning}")
    return 0 if result["valid"] else 1


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
