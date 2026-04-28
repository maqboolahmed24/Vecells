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
    ROOT / "docs" / "tests" / "206_wrong_patient_repair_and_web_phone_parity_suite.md",
    ROOT / "docs" / "tests" / "206_wrong_patient_freeze_and_release_matrix.md",
    ROOT / "docs" / "tests" / "206_web_vs_phone_normalization_and_status_parity_matrix.md",
]
LAB = ROOT / "docs" / "frontend" / "206_parity_repair_lab.html"
WRONG_PATIENT_CASES = ROOT / "data" / "test" / "206_wrong_patient_cases.csv"
PARITY_CASES = ROOT / "data" / "test" / "206_web_phone_parity_cases.csv"
CHAINS = ROOT / "data" / "test" / "206_expected_identity_hold_and_release_chains.json"
RESULTS = ROOT / "data" / "test" / "206_suite_results.json"
PLAYWRIGHT_SPEC = ROOT / "tests" / "playwright" / "206_parity_repair_lab.spec.ts"

STATUS_VOCABULARY = ["passed", "failed", "blocked_external", "not_applicable"]
REQUIRED_COUNTERS = [
    "wrong-patient hold entered",
    "PHI suppressed immediately",
    "mutable actions suppressed",
    "stale cache PHI replay blocked",
    "branch compensation pending blocks release",
    "stale resulting binding blocks release",
    "resulting binding current releases hold",
    "web phone canonical tuple aligned",
    "duplicate exact collapsed",
    "duplicate semantic attached or reviewed",
    "material new evidence triggers re-safety",
    "same-shell recovery preserved",
]

WRONG_PATIENT_REQUIRED = {
    "WPR206_SUBJECT_CONFLICT_BEFORE_DETAIL",
    "WPR206_SUBJECT_CONFLICT_AFTER_DETAIL_VISIBLE",
    "WPR206_BINDING_SUPERSESSION_DETAIL_OPEN",
    "WPR206_SECURE_LINK_UPLIFT_HOLD",
    "WPR206_SIGNED_IN_PORTAL_HOLD",
    "WPR206_PHONE_ORIGIN_CONVERGENCE_HOLD",
    "WPR206_BRANCH_COMPENSATION_PENDING",
    "WPR206_RELEASE_SETTLEMENT_BINDING_STALE",
    "WPR206_RESULTING_BINDING_CURRENT_RELEASE",
    "WPR206_STALE_CACHE_REPLAY_PHI_BLOCKED",
}

PARITY_REQUIRED = {
    "PAR206_SAME_SYMPTOMS": {"web", "phone"},
    "PAR206_URGENT_FACTS_ORDER": {"web", "phone"},
    "PAR206_ATTACHMENT_ONLY_ONE_CHANNEL": {"web", "phone"},
    "PAR206_MISSING_OPTIONAL_DETAIL": {"web", "phone"},
    "PAR206_LATER_PHONE_FOLLOWUP": {"web", "phone"},
    "PAR206_EXACT_DUPLICATE": {"web", "phone"},
    "PAR206_SEMANTIC_DUPLICATE": {"web", "phone"},
    "PAR206_MATERIAL_NEW_EVIDENCE": {"web", "phone"},
    "PAR206_AUTH_RETURN_DETAIL": {"web", "phone"},
    "PAR206_SIGNED_IN_AFTER_PHONE_START": {"phone"},
    "PAR206_SECURE_LINK_AFTER_WEB_START": {"web"},
    "PAR206_IDENTITY_HOLD_BOTH_CHANNELS": {"web", "phone"},
    "PAR206_RECOVERY_SELECTED_ANCHOR": {"web", "phone"},
    "PAR206_STALE_READ_ONLY": {"web", "phone"},
}

REQUIRED_TESTIDS = {
    "Parity_Repair_Lab",
    "suite-status",
    "mobile-comparison-switcher",
    "web-origin-lane",
    "phone-origin-lane",
    "ParityBraid",
    "WrongPatientFreezeReleaseChain",
    "StatusSemanticsMirror",
    "SuppressionInspector",
    "MatrixPair",
    "parity-matrix",
    "freeze-matrix",
}


def fail(message: str) -> None:
    raise SystemExit(f"[206-phase2-parity-repair-suite] {message}")


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
    if checklist_state("seq_205") != "X":
        fail("seq_205 must be complete before seq_206")
    if checklist_state("seq_206") not in {"-", "X"}:
        fail("seq_206 must be claimed or complete")


def validate_docs() -> None:
    suite_doc = read(DOCS[0])
    for ref in [
        "https://v10.carbondesignsystem.com/data-visualization/dashboards/",
        "https://v10.carbondesignsystem.com/patterns/status-indicator-pattern/",
        "https://design-system.service.gov.uk/components/summary-list/",
        "https://design-system.service.gov.uk/components/tabs/",
        "https://service-manual.nhs.uk/design-system/styles/typography",
        "https://playwright.dev/docs/screenshots",
        "https://playwright.dev/docs/aria-snapshots",
        "https://playwright.dev/docs/emulation#reduced-motion",
        "https://www.w3.org/TR/WCAG22/#focus-appearance",
    ]:
        if ref not in suite_doc:
            fail(f"suite doc missing research reference {ref}")

    for path in DOCS:
        text = read(path).lower()
        for token in [
            "206",
            "mock-now",
            "live-provider-later",
            "playwright",
            "wrong-patient",
            "semantic parity",
            "same-shell",
            "release",
            "phi",
        ]:
            if token not in text:
                fail(f"{path.relative_to(ROOT)} missing token {token}")


def validate_wrong_patient_cases() -> None:
    rows = csv_rows(WRONG_PATIENT_CASES)
    if len(rows) < 10:
        fail("wrong-patient fixture matrix must cover at least 10 cases")
    case_ids = {row.get("case_id", "") for row in rows}
    missing = WRONG_PATIENT_REQUIRED.difference(case_ids)
    if missing:
        fail(f"wrong-patient fixture missing cases {sorted(missing)}")
    for row in rows:
        if row.get("status") != "passed":
            fail(f"wrong-patient case {row.get('case_id')} is not passed")
        if "phi" not in row.get("suppressed_actions", "").lower():
            fail(f"wrong-patient case {row.get('case_id')} does not suppress PHI-related actions")
    text = read(WRONG_PATIENT_CASES).lower()
    for token in [
        "identity_hold_active",
        "summary_only",
        "compensation_pending",
        "release_blocked",
        "binding_v9_current",
        "stale_client_cache",
        "selected_anchor",
    ]:
        if token not in text:
            fail(f"wrong-patient fixtures missing {token}")


def validate_parity_cases() -> None:
    rows = csv_rows(PARITY_CASES)
    if len(rows) < 26:
        fail("web/phone parity matrix must cover at least 26 channel rows")
    pair_origins: dict[str, set[str]] = {}
    pair_keys: dict[str, set[str]] = {}
    for row in rows:
        if row.get("status") != "passed":
            fail(f"parity case {row.get('case_id')} is not passed")
        pair_id = row.get("pair_id", "")
        origin = row.get("channel_origin", "")
        pair_origins.setdefault(pair_id, set()).add(origin)
        pair_keys.setdefault(pair_id, set()).add(row.get("semantic_parity_key", ""))
        for column in [
            "normalized_canonical_request_tuple",
            "duplicate_result",
            "safety_outcome",
            "status_family",
            "request_detail_header_semantics",
            "receipt_semantics",
            "recovery_or_hold_posture",
        ]:
            if not row.get(column):
                fail(f"parity case {row.get('case_id')} missing {column}")
    for pair_id, expected_origins in PARITY_REQUIRED.items():
        if not expected_origins.issubset(pair_origins.get(pair_id, set())):
            fail(f"parity pair {pair_id} missing origins {sorted(expected_origins)}")
        if len(pair_keys.get(pair_id, set())) != 1:
            fail(f"parity pair {pair_id} has semantic parity key drift")
    text = read(PARITY_CASES).lower()
    for token in [
        "exact_retry_collapse",
        "same_request_attach",
        "re_safety_required",
        "identity_hold",
        "selected_anchor_preserved",
        "read_only",
        "not_applicable",
    ]:
        if token not in text:
            fail(f"parity fixtures missing {token}")


def validate_chains_and_results() -> None:
    chains = load_json(CHAINS)
    if chains.get("taskId") != "seq_206":
        fail("chains file has wrong taskId")
    if chains.get("schemaVersion") != "phase2-parity-repair-suite-v1":
        fail("chains file has wrong schema version")
    if chains.get("visualMode") != "Parity_Repair_Lab":
        fail("chains visual mode drifted")
    if chains.get("requiredCounters") != REQUIRED_COUNTERS:
        fail("chains requiredCounters must exactly match prompt vocabulary")
    for step in chains.get("releaseChain", []):
        if step.get("mustAllowOptimisticRelease") is True:
            fail(f"{step.get('step')} allows optimistic release")
    expected_events = chains.get("expectedEvents", [])
    if len(expected_events) != len(REQUIRED_COUNTERS):
        fail("chains file must map each required counter to one expected event")
    for event in expected_events:
        if event.get("mustExposePhi") is not False:
            fail(f"{event.get('eventName')} may not expose PHI")
        if event.get("mustDuplicateWork") is not False:
            fail(f"{event.get('eventName')} may not duplicate work")

    results = load_json(RESULTS)
    if results.get("taskId") != "seq_206":
        fail("results file has wrong taskId")
    if results.get("overallStatus") != "passed":
        fail("overall suite status must be passed")
    if results.get("visualMode") != "Parity_Repair_Lab":
        fail("results visual mode drifted")
    if results.get("statusVocabulary") != STATUS_VOCABULARY:
        fail("results status vocabulary must distinguish passed, failed, blocked_external, not_applicable")
    if results.get("liveProviderEvidenceStatus") != "not_applicable":
        fail("live provider evidence status must be not_applicable for mock-now")
    if results.get("repositoryOwnedDefectFinding") != "absent_for_206_parity_and_repair_boundary":
        fail("repository defect finding must record absence for 206 boundary")
    service = results.get("targetedServiceResult", {})
    if service.get("status") != "passed" or service.get("testFilesPassed") != 4 or service.get("testsPassed") != 22:
        fail("targeted service evidence must record 4 files and 22 tests passed")
    statuses = {row.get("status") for row in results.get("caseResults", [])}
    if not {"passed", "blocked_external", "not_applicable"}.issubset(statuses):
        fail("case results must include passed, blocked_external, and not_applicable rows")


def validate_lab() -> None:
    lab = read(LAB)
    lab_lower = lab.lower()
    for testid in REQUIRED_TESTIDS:
        if testid not in lab:
            fail(f"lab missing data-testid or region {testid}")
    for token in [
        "Parity_Repair_Lab",
        "max-width: 1560px",
        "min-height: 72px",
        "repeat(12, minmax(0, 1fr))",
        "grid-column: span 5",
        "grid-column: span 2",
        "#f6f8fc",
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
        "28px",
        "34px",
        "13px",
        "18px",
        "12px",
        "0.08em",
        "19px",
        "JetBrains Mono",
        "translateY(-1px)",
        "140ms",
        "160ms",
        "prefers-reduced-motion: reduce",
        "aria-pressed",
        "data-parity",
        "failed: 0",
        "blocked_external",
        "not_applicable",
        "active-hold",
        "released",
        "PAR206_MATERIAL_NEW_EVIDENCE",
        "WPR206_RELEASE_SETTLEMENT_BINDING_STALE",
    ]:
        if token.lower() not in lab_lower:
            fail(f"lab missing required visual or accessibility token {token}")


def validate_playwright_spec() -> None:
    spec = read(PLAYWRIGHT_SPEC)
    for token in [
        "Parity_Repair_Lab",
        "206-parity-repair-lab.png",
        "206-parity-aligned.png",
        "206-parity-duplicate.png",
        "206-parity-resafety.png",
        "206-parity-active-hold.png",
        "206-parity-released.png",
        "206-parity-mobile-web.png",
        "206-parity-mobile-phone.png",
        "206-parity-reduced-motion.png",
        "206-parity-zoom.png",
        "reducedMotion",
        "ariaSnapshot",
        "assertNoOverflow",
        "mobile-comparison-switcher",
        "ParityBraid",
        "MatrixPair",
        "keyboard",
        "focus",
        "blocked_external",
        "not_applicable",
    ]:
        if token not in spec:
            fail(f"Playwright spec missing token {token}")


def validate_package_chain() -> None:
    package = load_json(PACKAGE_JSON)
    scripts = package.get("scripts", {})
    expected_script = "python3 ./tools/test/validate_phase2_parity_and_repair_suite.py"
    if scripts.get("validate:phase2-parity-repair-suite") != expected_script:
        fail("package.json missing validate:phase2-parity-repair-suite script")

    expected_chain = (
        "pnpm validate:phase2-auth-session-suite && "
        "pnpm validate:phase2-telephony-integrity-suite && "
        "pnpm validate:phase2-parity-repair-suite && "
        "pnpm validate:phase2-enrichment-resafety-suite && "
        "pnpm validate:phase2-exit-gate && "
        "pnpm validate:audit-worm"
    )
    for script_name in ["bootstrap", "check"]:
        if expected_chain not in scripts.get(script_name, ""):
            fail(f"package.json {script_name} missing 206 validator chain")
    root_updates = read(ROOT_SCRIPT_UPDATES)
    if '"validate:phase2-parity-repair-suite": "python3 ./tools/test/validate_phase2_parity_and_repair_suite.py"' not in root_updates:
        fail("root_script_updates.py missing 206 validator script")
    if expected_chain not in root_updates:
        fail("root_script_updates.py missing 206 validator chain")


def main() -> None:
    validate_checklist()
    validate_docs()
    validate_wrong_patient_cases()
    validate_parity_cases()
    validate_chains_and_results()
    validate_lab()
    validate_playwright_spec()
    validate_package_chain()
    print("206 phase2 parity and repair suite validation passed")


if __name__ == "__main__":
    main()
