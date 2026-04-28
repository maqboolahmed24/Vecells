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
SOURCE = ROOT / "services" / "command-api" / "src" / "session-governor.ts"
SERVICE_DEFINITION = ROOT / "services" / "command-api" / "src" / "service-definition.ts"
TEST = ROOT / "services" / "command-api" / "tests" / "session-governor.integration.test.js"
MIGRATION = ROOT / "services" / "command-api" / "migrations" / "091_phase2_session_governor.sql"
ARCH_DOC = ROOT / "docs" / "architecture" / "176_session_governor_design.md"
SECURITY_DOC = ROOT / "docs" / "security" / "176_cookie_rotation_timeout_and_logout_controls.md"
MATRIX = ROOT / "data" / "analysis" / "176_session_rotation_matrix.csv"
CASES = ROOT / "data" / "analysis" / "176_timeout_reauth_and_logout_cases.json"
ROOT_PACKAGE = ROOT / "package.json"

REQUIRED_GAPS = {
    "PARALLEL_INTERFACE_GAP_PHASE2_SESSION_ESTABLISHMENT_DECISION_V1",
    "PARALLEL_INTERFACE_GAP_PHASE2_SESSION_COOKIE_CSRF_ROTATION_V1",
    "PARALLEL_INTERFACE_GAP_PHASE2_SESSION_TIMEOUT_SETTLEMENT_V1",
    "PARALLEL_INTERFACE_GAP_PHASE2_SESSION_AUTH_BRIDGE_PORT_V1",
    "PARALLEL_INTERFACE_GAP_PHASE2_SESSION_PROJECTION_POSTURE_V1",
}

SOURCE_MARKERS = {
    "createSessionGovernorApplication",
    "createSessionGovernorService",
    "createInMemorySessionGovernorRepository",
    "SessionEstablishmentDecision",
    "SessionTerminationSettlement",
    "SessionProjectionMaterialization",
    "LocalSession",
    "settleSessionEstablishment",
    "guardRequest",
    "terminateSession",
    "__Host-vecells.sid",
    "HttpOnly",
    "Secure",
    "SameSite=Lax",
    "SESSION_IDLE_TIMEOUT_SECONDS = 30 * 60",
    "SESSION_ABSOLUTE_TIMEOUT_SECONDS = 12 * 60 * 60",
    "AUTH_171_AUTH_SUCCESS_NOT_SESSION",
    "AUTH_171_COOKIE_MISSING_NOT_AUTHORITY",
    "AUTH_171_SUBJECT_SWITCH_TEARDOWN",
}

MIGRATION_TABLES = {
    "local_sessions",
    "session_establishment_decisions",
    "session_termination_settlements",
    "session_projection_materializations",
}

REQUIRED_MATRIX_CASES = {
    "SESSION176_CREATE_FRESH",
    "SESSION176_REUSE_EXISTING",
    "SESSION176_ROTATE_BINDING_CHANGE",
    "SESSION176_AUTH_BRIDGE_PENDING",
    "SESSION176_SUBJECT_SWITCH",
    "SESSION176_IDLE_TIMEOUT",
    "SESSION176_ABSOLUTE_TIMEOUT",
    "SESSION176_LOGOUT",
    "SESSION176_CSRF_DOWNGRADE",
    "SESSION176_MISSING_COOKIE",
}

REQUIRED_CASEBOOK_CASES = {
    "SESSION176_CREATE_FRESH_APPROVED",
    "SESSION176_AUTH_SUCCESS_NOT_SESSION",
    "SESSION176_ROTATE_ON_BINDING_VERSION",
    "SESSION176_SUBJECT_SWITCH_TEARDOWN",
    "SESSION176_IDLE_TIMEOUT_SETTLEMENT",
    "SESSION176_ABSOLUTE_TIMEOUT_REAUTH",
    "SESSION176_LOGOUT_EXACT_ONCE",
    "SESSION176_CSRF_DOWNGRADE",
    "SESSION176_MISSING_COOKIE_NOT_AUTHORITY",
}


def fail(message: str) -> None:
    raise SystemExit(f"[session-governor] {message}")


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


def checklist_state(task_prefix: str) -> str:
    pattern = re.compile(r"- \[([ Xx\-])\] ([^ ]+)")
    for line in read(CHECKLIST).splitlines():
        match = pattern.match(line.strip())
        if match and match.group(2).startswith(f"{task_prefix}_"):
            marker = match.group(1)
            return "X" if marker == "x" else marker
    fail(f"checklist row missing for {task_prefix}")


def require_markers(label: str, text: str, markers: set[str]) -> None:
    missing = sorted(marker for marker in markers if marker not in text)
    if missing:
        fail(f"{label} missing markers: {', '.join(missing)}")


def validate_checklist() -> None:
    for task_id in ["seq_170", "seq_171", "seq_172", "seq_173", "seq_174", "par_175"]:
        if checklist_state(task_id) != "X":
            fail(f"{task_id} must be complete before par_176")
    if checklist_state("par_176") not in {"-", "X"}:
        fail("par_176 must be claimed or complete")


def validate_source() -> None:
    source = read(SOURCE)
    require_markers("session governor source", source, SOURCE_MARKERS | REQUIRED_GAPS)
    forbidden = {
        "console.log(",
        "localStorage",
        "sessionStorage",
        "document.cookie",
        "Request.patientRef",
        "Episode.patientRef",
        ".patientRef =",
    }
    present = sorted(term for term in forbidden if term in source)
    if present:
        fail(f"source contains forbidden session shortcuts: {', '.join(present)}")
    if source.count("digestSecret(\"session-cookie\"") < 2:
        fail("session cookie values must be stored and resolved by digest")
    if source.count("digestSecret(\"session-csrf\"") < 2:
        fail("CSRF values must be stored and resolved by digest")
    service_definition = read(SERVICE_DEFINITION)
    require_markers(
        "service definition",
        service_definition,
        {
            "session_governor_current",
            "/identity/session/current",
            "SessionGovernorProjectionContract",
            "session_governor_logout",
            "/identity/session/logout",
            "SessionTerminationSettlementContract",
        },
    )


def validate_migration() -> None:
    migration = read(MIGRATION)
    require_markers("migration", migration, MIGRATION_TABLES)
    require_markers(
        "migration",
        migration,
        {
            "cookie_digest TEXT NOT NULL UNIQUE",
            "csrf_secret_digest TEXT NOT NULL",
            "idle_expires_at TEXT NOT NULL",
            "absolute_expires_at TEXT NOT NULL",
            "idempotency_key TEXT NOT NULL UNIQUE",
            "idx_local_sessions_epoch_version",
        },
    )


def validate_docs() -> None:
    combined = "\n".join(read(path) for path in [ARCH_DOC, SECURITY_DOC])
    require_markers(
        "docs",
        combined,
        {
            "SessionGovernor",
            "SessionEstablishmentDecision",
            "SessionTerminationSettlement",
            "SessionProjectionMaterialization",
            "30 minutes",
            "12 hours",
            "__Host-vecells.sid",
            "HttpOnly",
            "Secure",
            "SameSite=Lax",
            "OWASP",
            "NHS login",
            "missing cookies are not",
        }
        | REQUIRED_GAPS,
    )


def validate_matrix() -> None:
    rows = load_csv(MATRIX)
    case_ids = {row.get("case_id") for row in rows}
    if not REQUIRED_MATRIX_CASES.issubset(case_ids):
        missing = sorted(REQUIRED_MATRIX_CASES - case_ids)
        fail(f"rotation matrix missing cases: {', '.join(missing)}")
    decisions = {row.get("decision") for row in rows}
    for decision in ["create_fresh", "rotate_existing", "reuse_existing", "bounded_recovery"]:
        if decision not in decisions:
            fail(f"rotation matrix missing decision {decision}")
    for row in rows:
        if row.get("cookie_rotation_action") == "rotate_secure_http_only" and row.get("csrf_rotation_action") != "rotate":
            fail(f"{row.get('case_id')} rotates cookie without CSRF")


def validate_cases() -> None:
    payload = load_json(CASES)
    if payload.get("taskId") != "par_176":
        fail("casebook taskId must be par_176")
    timeout = payload.get("timeoutPolicy", {})
    if timeout.get("idleTimeoutSeconds") != 1800:
        fail("idle timeout must be 1800 seconds")
    if timeout.get("absoluteTimeoutSeconds") != 43200:
        fail("absolute timeout must be 43200 seconds")
    gaps = {entry.get("gapId") for entry in payload.get("parallelInterfaceGaps", [])}
    if not REQUIRED_GAPS.issubset(gaps):
        missing = sorted(REQUIRED_GAPS - gaps)
        fail(f"casebook missing gaps: {', '.join(missing)}")
    case_ids = {case.get("caseId") for case in payload.get("cases", [])}
    if not REQUIRED_CASEBOOK_CASES.issubset(case_ids):
        missing = sorted(REQUIRED_CASEBOOK_CASES - case_ids)
        fail(f"casebook missing cases: {', '.join(missing)}")
    logout = next(case for case in payload["cases"] if case.get("caseId") == "SESSION176_LOGOUT_EXACT_ONCE")
    if logout.get("exactOnce") is not True:
        fail("logout case must assert exactOnce")


def validate_tests() -> None:
    test = read(TEST)
    require_markers(
        "tests",
        test,
        {
            "creates a fresh server-side session",
            "bounded recovery",
            "rotates on binding",
            "subject-switch teardown",
            "idle timeout",
            "absolute timeout",
            "CSRF downgrade",
            "HttpOnly",
            "SameSite=Lax",
        },
    )


def validate_root_script_wiring() -> None:
    package = load_json(ROOT_PACKAGE)
    scripts = package.get("scripts", {})
    expected = "python3 ./tools/analysis/validate_session_governor.py"
    if scripts.get("validate:session-governor") != expected:
        fail("package.json missing validate:session-governor script")
    expected_chain = "pnpm validate:domain-transition-schema && pnpm validate:auth-bridge-service && pnpm validate:session-governor"
    for script_name in ["bootstrap", "check"]:
        if expected_chain not in scripts.get(script_name, ""):
            fail(f"package.json {script_name} is not wired after auth bridge")
        if expected_chain not in ROOT_SCRIPT_UPDATES.get(script_name, ""):
            fail(f"root_script_updates {script_name} is not wired after auth bridge")
    if ROOT_SCRIPT_UPDATES.get("validate:session-governor") != expected:
        fail("root_script_updates missing validate:session-governor")


def main() -> None:
    validate_checklist()
    validate_source()
    validate_migration()
    validate_docs()
    validate_matrix()
    validate_cases()
    validate_tests()
    validate_root_script_wiring()
    print("[session-governor] ok")


if __name__ == "__main__":
    main()
