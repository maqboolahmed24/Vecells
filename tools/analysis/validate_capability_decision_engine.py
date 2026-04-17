#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
import re
import sys
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "tools" / "analysis"))

from root_script_updates import ROOT_SCRIPT_UPDATES


CHECKLIST = ROOT / "prompt" / "checklist.md"
SOURCE = ROOT / "services" / "command-api" / "src" / "capability-decision-engine.ts"
SERVICE_DEFINITION = ROOT / "services" / "command-api" / "src" / "service-definition.ts"
TEST = ROOT / "services" / "command-api" / "tests" / "capability-decision-engine.integration.test.js"
MIGRATION = ROOT / "services" / "command-api" / "migrations" / "095_phase2_capability_decision_engine.sql"
ARCH_DOC = ROOT / "docs" / "architecture" / "180_capability_decision_engine_design.md"
API_DOC = ROOT / "docs" / "api" / "180_route_profile_and_decision_contract.md"
SECURITY_DOC = ROOT / "docs" / "security" / "180_scope_envelope_and_route_authorization_controls.md"
DECISION_MATRIX = ROOT / "data" / "analysis" / "180_route_decision_matrix.csv"
SCOPE_CASES = ROOT / "data" / "analysis" / "180_scope_envelope_authorization_cases.json"
ROOT_PACKAGE = ROOT / "package.json"

REQUIRED_GAPS = {
    "PARALLEL_INTERFACE_GAP_PHASE2_CAPABILITY_ROUTE_PROFILE_REGISTRY_V1",
    "PARALLEL_INTERFACE_GAP_PHASE2_CAPABILITY_CENTRAL_ENGINE_V1",
    "PARALLEL_INTERFACE_GAP_PHASE2_CAPABILITY_SCOPE_ENVELOPE_DRIFT_V1",
    "PARALLEL_INTERFACE_GAP_PHASE2_CAPABILITY_CEILING_NOT_MUTATION_AUTHORITY_V1",
    "PARALLEL_INTERFACE_GAP_PHASE2_CAPABILITY_STALE_FENCE_RECOVERY_V1",
    "PARALLEL_INTERFACE_GAP_PHASE2_CAPABILITY_AUDIT_PUBLICATION_V1",
}

SOURCE_MARKERS = {
    "createCapabilityDecisionEngineApplication",
    "createCapabilityDecisionEngineService",
    "createInMemoryCapabilityDecisionEngineRepository",
    "createRouteCapabilityProfileRegistry",
    "RouteCapabilityProfile",
    "CapabilityDecisionRecord",
    "AccessGrantScopeEnvelope",
    "ScopeEnvelopeAuthorizationRecord",
    "authorizeScopeEnvelope",
    "authorizeRoute",
    "CapabilityDecisionEngine",
    "capabilityIsCeilingOnly",
    "identityBindingMutation: \"none\"",
    "CAP_180_UNKNOWN_ROUTE_PROFILE_DENIED",
    "CAP_180_DENY_BY_DEFAULT",
    "CAP_180_SCOPE_GOVERNING_VERSION_DRIFT",
    "CAP_180_SCOPE_SESSION_EPOCH_DRIFT",
    "CAP_180_SCOPE_BINDING_VERSION_DRIFT",
    "CAP_180_SCOPE_REPLAY_RETURNED",
    "CAP_180_SAME_LINEAGE_RECOVERY_AVAILABLE",
    "CAP_180_STEP_UP_PATH_AVAILABLE",
}

MIGRATION_MARKERS = {
    "route_capability_profile_registry",
    "capability_decision_records",
    "scope_envelope_authorization_records",
    "capability_policy_audit",
    "capability_decision_id TEXT PRIMARY KEY",
    "scope_envelope_authorization_id TEXT PRIMARY KEY",
    "idempotency_key TEXT NOT NULL UNIQUE",
    "capability_is_ceiling_only BOOLEAN NOT NULL",
    "created_by_authority TEXT NOT NULL CHECK (created_by_authority = 'CapabilityDecisionEngine')",
}

SERVICE_MARKERS = {
    "capability_decision_evaluate",
    "/identity/capability/evaluate",
    "CapabilityDecisionContract",
    "scope_envelope_authorize",
    "/identity/capability/scope-envelope/authorize",
    "AccessGrantScopeEnvelopeAuthorizationContract",
    "capability_route_profiles",
    "/identity/capability/route-profiles",
    "RouteCapabilityProfileRegistryContract",
}

REQUIRED_MATRIX_CASES = {
    "CAP180_ALLOW_VERIFIED_STATUS": "allow",
    "CAP180_DENY_UNKNOWN_ROUTE": "deny",
    "CAP180_STEP_UP_CLAIM": "step_up_required",
    "CAP180_RECOVER_STALE_BINDING": "recover_only",
}

REQUIRED_SCOPE_CASES = {
    "CAP180_SCOPE_AUTHORIZED",
    "CAP180_SCOPE_REPLAY_RETURNED",
    "CAP180_SCOPE_SESSION_BINDING_DRIFT",
    "CAP180_SCOPE_GOVERNING_OBJECT_DRIFT",
    "CAP180_SCOPE_EXPIRED_DENIED",
}


def fail(message: str) -> None:
    raise SystemExit(f"[capability-decision-engine] {message}")


def read(path: Path) -> str:
    if not path.exists():
        fail(f"missing required artifact: {path.relative_to(ROOT)}")
    return path.read_text(encoding="utf-8")


def load_json(path: Path) -> Any:
    try:
        return json.loads(read(path))
    except json.JSONDecodeError as error:
        fail(f"{path.relative_to(ROOT)} is invalid JSON: {error}")


def load_csv(path: Path) -> list[dict[str, str]]:
    try:
        return list(csv.DictReader(read(path).splitlines()))
    except csv.Error as error:
        fail(f"{path.relative_to(ROOT)} is invalid CSV: {error}")


def require_markers(label: str, text: str, markers: set[str]) -> None:
    missing = sorted(marker for marker in markers if marker not in text)
    if missing:
        fail(f"{label} missing markers: {', '.join(missing)}")


def checklist_state(task_prefix: str) -> str:
    pattern = re.compile(r"- \[([ Xx\-])\] ([^ ]+)")
    for line in read(CHECKLIST).splitlines():
        match = pattern.match(line.strip())
        if match and match.group(2).startswith(f"{task_prefix}_"):
            marker = match.group(1)
            return "X" if marker == "x" else marker
    fail(f"checklist row missing for {task_prefix}")


def validate_checklist() -> None:
    for task_id in [
        "seq_170",
        "seq_171",
        "seq_172",
        "seq_173",
        "seq_174",
        "par_175",
        "par_176",
        "par_177",
        "par_178",
        "par_179",
    ]:
        if checklist_state(task_id) != "X":
            fail(f"{task_id} must be complete before par_180")
    if checklist_state("par_180") not in {"-", "X"}:
        fail("par_180 must be claimed or complete")


def validate_source() -> None:
    source = read(SOURCE)
    require_markers("capability source", source, SOURCE_MARKERS | REQUIRED_GAPS)
    forbidden = {
        "localStorage",
        "sessionStorage",
        "document.cookie",
        ".patientRef =",
        "manual_only\"",
        "CapabilityDecisionMutationPermit",
        "allowUnknownRoute",
    }
    present = sorted(term for term in forbidden if term in source)
    if present:
        fail(f"source contains forbidden route trust shortcuts: {', '.join(present)}")
    if source.count("RouteCapabilityProfile") < 8:
        fail("source must define and consume the route capability profile registry")
    if source.count("scopeEnvelope") < 20:
        fail("source must implement scope-envelope authorization")
    if source.count("decisionState") < 20:
        fail("source must implement deterministic CapabilityDecision outcomes")
    require_markers("service definition", read(SERVICE_DEFINITION), SERVICE_MARKERS)


def validate_migration() -> None:
    require_markers("migration", read(MIGRATION), MIGRATION_MARKERS)


def validate_docs() -> None:
    combined = "\n".join(read(path) for path in [ARCH_DOC, API_DOC, SECURITY_DOC])
    require_markers(
        "docs",
        combined,
        {
            "CapabilityDecisionEngine",
            "RouteCapabilityProfile",
            "CapabilityDecision",
            "AccessGrantScopeEnvelope",
            "ScopeEnvelopeAuthorizationRecord",
            "unknown routes deny",
            "CapabilityDecision is a ceiling only",
            "RouteIntentBinding",
            "SessionGovernor",
            "IdentityBindingAuthority",
            "AccessGrantService",
            "CAP_180_SCOPE_GOVERNING_VERSION_DRIFT",
            "OWASP",
        }
        | REQUIRED_GAPS,
    )


def validate_matrix() -> None:
    rows = load_csv(DECISION_MATRIX)
    if not rows:
        fail("route decision matrix is empty")
    by_case = {row.get("case_id", ""): row for row in rows}
    for case_id, expected in REQUIRED_MATRIX_CASES.items():
        row = by_case.get(case_id)
        if not row:
            fail(f"route matrix missing case {case_id}")
        if row.get("expected_decision") != expected:
            fail(f"{case_id} expected_decision must be {expected}")
    decisions = {row.get("expected_decision") for row in rows}
    if decisions != {"allow", "step_up_required", "recover_only", "deny"}:
        fail("route matrix must cover allow, step_up_required, recover_only, and deny")
    gaps = {row.get("gap_closure") for row in rows}
    missing_gaps = sorted(REQUIRED_GAPS - gaps)
    if missing_gaps:
        fail(f"route matrix missing gap closures: {', '.join(missing_gaps)}")


def validate_scope_cases() -> None:
    data = load_json(SCOPE_CASES)
    cases = data.get("cases")
    if not isinstance(cases, list):
        fail("scope envelope cases must contain a cases array")
    by_case = {case.get("caseId"): case for case in cases if isinstance(case, dict)}
    missing = sorted(REQUIRED_SCOPE_CASES - set(by_case))
    if missing:
        fail(f"scope cases missing: {', '.join(missing)}")
    states = {case.get("expectedAuthorizationState") for case in by_case.values()}
    if not {"authorized", "recover_only", "deny"}.issubset(states):
        fail("scope cases must cover authorized, recover_only, and deny")
    for case in by_case.values():
        codes = case.get("expectedReasonCodes")
        if not isinstance(codes, list) or not codes:
            fail(f"{case.get('caseId')} must include expected reason codes")


def validate_tests() -> None:
    test = read(TEST)
    require_markers(
        "tests",
        test,
        {
            "allows a verified request-status route",
            "denies unknown routes by default",
            "returns step_up_required",
            "downgrades stale binding fences",
            "authorizes a matching scope envelope",
            "detects scope-envelope drift",
            "makes the route guard consume both capability and scope-envelope authority",
            "CAP_180_UNKNOWN_ROUTE_PROFILE_DENIED",
            "CAP_180_SCOPE_REPLAY_RETURNED",
            "CAP_180_SCOPE_BINDING_VERSION_DRIFT",
        },
    )


def validate_script_wiring() -> None:
    package = load_json(ROOT_PACKAGE)
    expected_script = "python3 ./tools/analysis/validate_capability_decision_engine.py"
    scripts = package.get("scripts", {})
    if scripts.get("validate:capability-decision-engine") != expected_script:
        fail("package.json missing validate:capability-decision-engine script")
    if ROOT_SCRIPT_UPDATES.get("validate:capability-decision-engine") != expected_script:
        fail("root_script_updates missing validate:capability-decision-engine script")
    required_order = [
        "pnpm validate:identity-binding-authority",
        "pnpm validate:capability-decision-engine",
        "pnpm validate:audit-worm",
    ]
    for script_name in ["bootstrap", "check"]:
        command = scripts.get(script_name, "")
        root_command = ROOT_SCRIPT_UPDATES.get(script_name, "")
        if any(token not in command for token in required_order) or not (
            command.index(required_order[0])
            < command.index(required_order[1])
            < command.index(required_order[2])
        ):
            fail(f"package.json {script_name} does not chain capability decision validator")
        if any(token not in root_command for token in required_order) or not (
            root_command.index(required_order[0])
            < root_command.index(required_order[1])
            < root_command.index(required_order[2])
        ):
            fail(f"root_script_updates {script_name} does not chain capability decision validator")


def main() -> None:
    validate_checklist()
    validate_source()
    validate_migration()
    validate_docs()
    validate_matrix()
    validate_scope_cases()
    validate_tests()
    validate_script_wiring()
    print("[capability-decision-engine] ok")


if __name__ == "__main__":
    main()
