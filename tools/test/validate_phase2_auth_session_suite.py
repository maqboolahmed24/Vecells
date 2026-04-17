#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
import re
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[2]
CHECKLIST = ROOT / "prompt" / "checklist.md"
PACKAGE_JSON = ROOT / "package.json"
ROOT_SCRIPT_UPDATES = ROOT / "tools" / "analysis" / "root_script_updates.py"

DOCS = [
    ROOT / "docs" / "tests" / "204_auth_session_identity_suite.md",
    ROOT / "docs" / "tests" / "204_auth_replay_and_logout_matrix.md",
    ROOT / "docs" / "tests" / "204_identity_mismatch_and_same_shell_recovery_matrix.md",
]
LAB = ROOT / "docs" / "frontend" / "204_auth_session_assurance_lab.html"
AUTH_REPLAY = ROOT / "data" / "test" / "204_auth_replay_cases.csv"
SESSION_CASES = ROOT / "data" / "test" / "204_session_rotation_and_expiry_cases.csv"
IDENTITY_CASES = ROOT / "data" / "test" / "204_identity_mismatch_cases.csv"
EVENTS = ROOT / "data" / "test" / "204_expected_events_and_settlements.json"
RESULTS = ROOT / "data" / "test" / "204_suite_results.json"
PLAYWRIGHT_SPEC = ROOT / "tests" / "playwright" / "204_auth_session_assurance_lab.spec.ts"

STATUS_VOCABULARY = ["passed", "failed", "blocked_external", "not_applicable"]
REQUIRED_COUNTERS = [
    "callback accepted",
    "callback replay blocked",
    "callback mapped to settled transaction",
    "session rotated",
    "session expired idle",
    "session expired absolute",
    "logout completed",
    "stale-tab write denied",
    "wrong-patient hold entered",
    "wrong-patient hold released",
    "PHI suppressed due to hold or mismatch",
]

REPLAY_CASES = {
    "AUTH204_VALID_CALLBACK_EXACT_ONCE",
    "AUTH204_DUPLICATE_SAME_CODE_STATE",
    "AUTH204_REPLAY_AFTER_SUCCESS",
    "AUTH204_MUTATED_STATE",
    "AUTH204_MUTATED_NONCE",
    "AUTH204_STALE_POST_AUTH_RETURN_INTENT",
    "AUTH204_EXPIRED_TRANSACTION",
    "AUTH204_CALLBACK_AFTER_LOGOUT",
    "AUTH204_DUPLICATE_BROWSER_SUBMISSION",
    "AUTH204_STALE_TAB_AFTER_SUPERSEDED_AUTH",
}

SESSION_CASES_REQUIRED = {
    "AUTH204_NEW_SIGN_IN_FRESH_SESSION",
    "AUTH204_STEP_UP_CLAIM_ROTATION",
    "AUTH204_SUBJECT_SWITCH_ROTATION",
    "AUTH204_WRONG_PATIENT_HOLD_DOWNGRADE",
    "AUTH204_IDLE_TIMEOUT",
    "AUTH204_ABSOLUTE_TIMEOUT",
    "AUTH204_COOKIE_KEY_MISMATCH",
    "AUTH204_CROSS_TAB_STALE_SESSION",
    "AUTH204_ABSOLUTE_EXPIRY_REQUEST_DETAIL",
    "AUTH204_EXPIRY_WHILE_RECOVERY_OPEN",
    "AUTH204_LOGOUT_HOME",
    "AUTH204_LOGOUT_DETAIL_ANCHOR",
    "AUTH204_LOGOUT_AFTER_SECURE_LINK_UPLIFT",
    "AUTH204_LOGOUT_BROWSER_BACK",
    "AUTH204_LOGOUT_REFRESH",
    "AUTH204_LOGOUT_STALE_CALLBACK_REPLAY",
    "AUTH204_LOGOUT_DEEP_LINK_REVISIT",
    "AUTH204_LOGOUT_PENDING_READS",
}

IDENTITY_CASES_REQUIRED = {
    "AUTH204_WRONG_SUBJECT_SECURE_LINK",
    "AUTH204_SESSION_A_LINK_B",
    "AUTH204_BINDING_SUPERSEDES_OPEN_SESSION",
    "AUTH204_REPAIR_FREEZE_DETAIL_OPEN",
    "AUTH204_RELEASE_AFTER_CURRENT_BINDING",
    "AUTH204_IDENTITY_HOLD_SUPPRESSES_PHI",
    "AUTH204_HOME_AND_DETAIL_DEGRADE_ON_HOLD",
    "AUTH204_CALLBACK_TO_REQUEST_DETAIL",
    "AUTH204_SESSION_TIMEOUT_ON_DETAIL",
    "AUTH204_LOGOUT_FROM_DETAIL",
    "AUTH204_WRONG_PATIENT_HOLD_FROM_DETAIL",
    "AUTH204_CLAIM_STEP_UP_RETURN_DETAIL",
    "AUTH204_RECOVERY_FROM_HOME_OR_DETAIL",
}

REQUIRED_TESTIDS = {
    "Auth_Session_Assurance_Lab",
    "scenario-rail",
    "transaction-canvas",
    "inspector-rail",
    "scenario-chip-strip",
    "AuthTransactionBraid",
    "SessionEpochLadder",
    "SubjectFenceMap",
    "SameShellRecoveryFrame",
    "EvidenceTable",
    "evidence-grid",
    "suite-status",
}


def fail(message: str) -> None:
    raise SystemExit(f"[204-phase2-auth-session-suite] {message}")


def read(path: Path) -> str:
    if not path.exists():
        fail(f"missing required file {path.relative_to(ROOT)}")
    return path.read_text(encoding="utf-8")


def load_json(path: Path) -> Any:
    try:
        return json.loads(read(path))
    except json.JSONDecodeError as exc:
        fail(f"invalid JSON in {path.relative_to(ROOT)}: {exc}")


def csv_rows(path: Path) -> list[dict[str, str]]:
    if not path.exists():
        fail(f"missing required file {path.relative_to(ROOT)}")
    with path.open(newline="", encoding="utf-8") as handle:
        return list(csv.DictReader(handle))


def checklist_state(task_prefix: str) -> str:
    pattern = re.compile(rf"^- \[([ Xx-])\] {re.escape(task_prefix)}", re.MULTILINE)
    match = pattern.search(read(CHECKLIST))
    if not match:
        fail(f"checklist row missing for {task_prefix}")
    return match.group(1).upper()


def validate_checklist() -> None:
    if checklist_state("seq_203") != "X":
        fail("seq_203 must be complete before seq_204")
    if checklist_state("seq_204") not in {"-", "X"}:
        fail("seq_204 must be claimed or complete")


def validate_docs() -> None:
    suite_doc = read(DOCS[0])
    for ref in [
        "https://service-manual.nhs.uk/design-system/styles/typography",
        "https://design-system.service.gov.uk/styles/type-scale/",
        "https://v10.carbondesignsystem.com/data-visualization/dashboards/",
        "https://v10.carbondesignsystem.com/patterns/status-indicator-pattern/",
    ]:
        if ref not in suite_doc:
            fail(f"suite doc missing design research reference {ref}")

    for path in DOCS:
        text = read(path).lower()
        for token in [
            "204",
            "mock-now",
            "live-provider-later",
            "playwright",
            "same-shell",
            "replay",
            "logout",
        ]:
            if token not in text:
                fail(f"{path.relative_to(ROOT)} missing token {token}")


def validate_csv(path: Path, required_cases: set[str], minimum_rows: int) -> list[dict[str, str]]:
    rows = csv_rows(path)
    if len(rows) < minimum_rows:
        fail(f"{path.relative_to(ROOT)} expected at least {minimum_rows} rows")
    case_ids = {row.get("case_id", "") for row in rows}
    missing = required_cases.difference(case_ids)
    if missing:
        fail(f"{path.relative_to(ROOT)} missing cases {sorted(missing)}")
    for row in rows:
        if row.get("status") != "passed":
            fail(f"{path.relative_to(ROOT)} case {row.get('case_id')} is not passed")
    return rows


def validate_fixtures() -> None:
    replay_rows = validate_csv(AUTH_REPLAY, REPLAY_CASES, 10)
    session_rows = validate_csv(SESSION_CASES, SESSION_CASES_REQUIRED, 18)
    identity_rows = validate_csv(IDENTITY_CASES, IDENTITY_CASES_REQUIRED, 13)
    if len(replay_rows) + len(session_rows) + len(identity_rows) < 41:
        fail("fixture matrix must cover at least 41 cases")

    replay_text = read(AUTH_REPLAY).lower()
    for token in ["mutated_state", "nonce", "logout", "superseded", "mutable_cta_suppressed"]:
        if token not in replay_text:
            fail(f"auth replay fixtures missing {token}")

    session_text = read(SESSION_CASES).lower()
    for token in ["idle_timeout", "absolute_timeout", "cookie_key_mismatch", "pending_reads"]:
        if token not in session_text:
            fail(f"session fixtures missing {token}")

    identity_text = read(IDENTITY_CASES).lower()
    for token in ["wrong_subject", "patient_a", "hold_released", "patientshell", "phi_suppressed"]:
        if token == "patientshell":
            if "PatientNavReturnContract" not in read(IDENTITY_CASES):
                fail("identity fixtures missing PatientNavReturnContract continuity")
            continue
        if token not in identity_text:
            fail(f"identity fixtures missing {token}")


def validate_events_and_results() -> None:
    events = load_json(EVENTS)
    if events.get("taskId") != "seq_204":
        fail("events file has wrong taskId")
    if events.get("schemaVersion") != "phase2-auth-session-suite-v1":
        fail("events file has wrong schema version")
    if events.get("requiredCounters") != REQUIRED_COUNTERS:
        fail("events requiredCounters must exactly match prompt vocabulary")
    expected_events = events.get("expectedEvents", [])
    if len(expected_events) != len(REQUIRED_COUNTERS):
        fail("events file must map each required counter to an event")
    for event in expected_events:
        if event.get("mustCreateSecondSession") is not False:
            fail(f"{event.get('eventName')} may not create a second session")

    results = load_json(RESULTS)
    if results.get("taskId") != "seq_204":
        fail("results file has wrong taskId")
    if results.get("overallStatus") != "passed":
        fail("overall suite status must be passed")
    if results.get("visualMode") != "Auth_Session_Assurance_Lab":
        fail("results visual mode drifted")
    if results.get("statusVocabulary") != STATUS_VOCABULARY:
        fail("results status vocabulary must distinguish passed, failed, blocked_external, not_applicable")
    if results.get("liveProviderEvidenceStatus") != "not_applicable":
        fail("live provider evidence status must be not_applicable for mock-now")
    if results.get("repositoryOwnedDefectFinding") != "absent_for_204_auth_session_boundary":
        fail("repository defect finding must record absence for 204 boundary")
    service = results.get("targetedServiceResult", {})
    if service.get("status") != "passed" or service.get("testFilesPassed") != 5 or service.get("testsPassed") != 27:
        fail("targeted service evidence must record 5 files and 27 tests passed")
    case_results = results.get("caseResults", [])
    if any(row.get("status") == "failed" for row in case_results):
        fail("case results contain active failed status")
    statuses = {row.get("status") for row in case_results}
    if not {"passed", "blocked_external", "not_applicable"}.issubset(statuses):
        fail("case results must include passed, blocked_external, and not_applicable rows")


def validate_lab() -> None:
    lab = read(LAB)
    lab_lower = lab.lower()
    for testid in REQUIRED_TESTIDS:
        if testid not in lab:
            fail(f"lab missing data-testid or region {testid}")
    for token in [
        "Auth_Session_Assurance_Lab",
        "max-width: 1540px",
        "padding: 28px",
        "min-height: 72px",
        "grid-template-columns: 296px minmax(760px, 1fr) 404px",
        "repeat(3, minmax(240px, 1fr))",
        "#f5f7fb",
        "#ffffff",
        "#eef2f7",
        "#0f172a",
        "#334155",
        "#64748b",
        "#d7dfea",
        "#3158e0",
        "#0f766e",
        "#b7791f",
        "#b42318",
        "Inter Tight",
        "JetBrains Mono",
        "28px",
        "34px",
        "18px",
        "24px",
        "12px",
        "0.08em",
        "13px",
        "19px",
        "translateY(-1px)",
        "120ms",
        "160ms",
        "prefers-reduced-motion: reduce",
        "role=\"tablist\"",
        "aria-selected",
        "data-parity",
        "blocked_external",
        "not_applicable",
        "failed: 0",
    ]:
        if token.lower() not in lab_lower:
            fail(f"lab missing required visual or accessibility token {token}")
    for state in ["state: live", "state: recovery", "state: read-only", "state: blocked"]:
        if state not in lab:
            fail(f"lab missing browser-visible state {state}")


def validate_playwright_spec() -> None:
    spec = read(PLAYWRIGHT_SPEC)
    for token in [
        "Auth_Session_Assurance_Lab",
        "204-auth-session-assurance-lab.png",
        "204-auth-session-wide.png",
        "204-auth-session-standard.png",
        "204-auth-session-tablet.png",
        "204-auth-session-mobile.png",
        "204-auth-session-reduced-motion.png",
        "204-auth-session-zoom.png",
        "reducedMotion",
        "ariaSnapshot",
        "ArrowRight",
        "focus",
        "data-parity",
        "assertNoBodyOverflow",
        "EvidenceTable",
        "blocked_external",
        "not_applicable",
    ]:
        if token not in spec:
            fail(f"Playwright spec missing token {token}")


def validate_package_chain() -> None:
    package = load_json(PACKAGE_JSON)
    scripts = package.get("scripts", {})
    expected_script = "python3 ./tools/test/validate_phase2_auth_session_suite.py"
    if scripts.get("validate:phase2-auth-session-suite") != expected_script:
        fail("package.json missing validate:phase2-auth-session-suite script")

    expected_chain = (
        "pnpm validate:contact-truth-preference-ui && "
        "pnpm validate:cross-channel-receipt-status-parity && "
        "pnpm validate:nhs-login-client-config && "
        "pnpm validate:signal-provider-manifest && "
        "pnpm validate:phase2-auth-session-suite && "
        "pnpm validate:phase2-telephony-integrity-suite && "
        "pnpm validate:phase2-parity-repair-suite && "
        "pnpm validate:phase2-enrichment-resafety-suite && "
        "pnpm validate:phase2-exit-gate && "
        "pnpm validate:audit-worm"
    )
    for script_name in ["bootstrap", "check"]:
        if expected_chain not in scripts.get(script_name, ""):
            fail(f"package.json {script_name} missing 204 validator chain")
    root_updates = read(ROOT_SCRIPT_UPDATES)
    if '"validate:phase2-auth-session-suite": "python3 ./tools/test/validate_phase2_auth_session_suite.py"' not in root_updates:
        fail("root_script_updates.py missing 204 validator script")
    if expected_chain not in root_updates:
        fail("root_script_updates.py missing 204 validator chain")


def main() -> None:
    validate_checklist()
    validate_docs()
    validate_fixtures()
    validate_events_and_results()
    validate_lab()
    validate_playwright_spec()
    validate_package_chain()
    print("204 phase2 auth session suite validation passed")


if __name__ == "__main__":
    main()
