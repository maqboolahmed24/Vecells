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
    ROOT / "docs" / "tests" / "207_pds_feature_flag_and_duplicate_followup_resafety_suite.md",
    ROOT / "docs" / "tests" / "207_pds_enrichment_boundary_matrix.md",
    ROOT / "docs" / "tests" / "207_duplicate_followup_and_resafety_matrix.md",
]
LAB = ROOT / "docs" / "frontend" / "207_enrichment_resafety_lab.html"
PDS_CASES = ROOT / "data" / "test" / "207_pds_mode_cases.csv"
FOLLOWUP_CASES = ROOT / "data" / "test" / "207_followup_duplicate_cases.csv"
CHAINS = ROOT / "data" / "test" / "207_expected_enrichment_and_resafety_chains.json"
RESULTS = ROOT / "data" / "test" / "207_suite_results.json"
PLAYWRIGHT_SPEC = ROOT / "tests" / "playwright" / "207_enrichment_resafety_lab.spec.ts"
PDS_SERVICE_TEST = ROOT / "services" / "command-api" / "tests" / "pds-enrichment.integration.test.js"
FOLLOWUP_SERVICE_TEST = (
    ROOT / "services" / "command-api" / "tests" / "phone-followup-resafety.integration.test.js"
)

STATUS_VOCABULARY = ["passed", "failed", "blocked_external", "not_applicable"]
REQUIRED_COUNTERS = [
    "PDS feature flag off stays local-only",
    "PDS successful enrichment preserves provenance",
    "PDS no match or ambiguity falls back local-only",
    "PDS degraded upstream cannot mutate binding",
    "PDS active request uses captured gate",
    "PDS disabled after prior enrichment ignores cache",
    "PDS guard absence blocks provider call",
    "PDS contact conflicts preserve local preferences",
    "duplicate exact replay collapses",
    "duplicate attachment does not re-trigger safety",
    "material late evidence triggers re-safety",
    "closed or identity-held late evidence blocks calm projection",
]

PDS_REQUIRED = {
    "PDS207_FLAG_OFF_LOCAL_ONLY",
    "PDS207_ON_SUCCESS_ENRICHED",
    "PDS207_ON_NO_MATCH",
    "PDS207_ON_AMBIGUOUS_MATCH",
    "PDS207_DEGRADED_UPSTREAM",
    "PDS207_FLAG_TOGGLED_DURING_ACTIVE_REQUEST",
    "PDS207_FLAG_OFF_AFTER_PRIOR_ENRICHMENT",
    "PDS207_LEGAL_BASIS_OR_ENV_GUARD_ABSENT",
    "PDS207_CONFLICTING_CONTACT_DETAILS",
    "PDS207_LATE_ENRICHMENT_AFTER_PREF_CHANGE",
}

FOLLOWUP_REQUIRED = {
    "FUP207_EXACT_REPLAY_PHONE",
    "FUP207_SAME_AUDIO_PROVIDER_RETRY",
    "FUP207_SAME_FACTS_RESTATED",
    "FUP207_MATERIAL_SYMPTOMS",
    "FUP207_MATERIAL_RISK_FACTORS",
    "FUP207_ADMIN_METADATA_ONLY",
    "FUP207_DUPLICATE_ATTACHMENT",
    "FUP207_LATE_EVIDENCE_RESAFETY",
    "FUP207_LATE_EVIDENCE_CLOSED_REQUEST",
    "FUP207_IDENTITY_HOLD_ACTIVE",
}

REQUIRED_TESTIDS = {
    "Enrichment_Resafety_Lab",
    "suite-status",
    "FeatureGateHeatband",
    "ContactTruthProvenanceStrip",
    "DuplicateClassLadder",
    "ResafetyTriggerChain",
    "EvidenceMatrices",
}


def fail(message: str) -> None:
    raise SystemExit(f"[207-phase2-enrichment-resafety-suite] {message}")


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
    if checklist_state("seq_206") != "X":
        fail("seq_206 must be complete before seq_207")
    if checklist_state("seq_207") not in {"-", "X"}:
        fail("seq_207 must be claimed or complete")


def validate_docs() -> None:
    suite_doc = read(DOCS[0])
    for ref in [
        "https://carbondesignsystem.com/data-visualization/dashboards/",
        "https://carbondesignsystem.com/patterns/status-indicator-pattern/",
        "https://design-system.service.gov.uk/components/summary-list/",
        "https://design-system.service.gov.uk/components/tabs/",
        "https://service-manual.nhs.uk/design-system/styles/typography",
        "https://playwright.dev/docs/screenshots",
        "https://playwright.dev/docs/aria-snapshots",
        "https://playwright.dev/docs/emulation#reduced-motion",
        "https://www.w3.org/TR/WCAG22/#focus-appearance",
        "https://digital.nhs.uk/developer/api-catalogue/personal-demographics-service-fhir",
    ]:
        if ref not in suite_doc:
            fail(f"suite doc missing research reference {ref}")

    for path in DOCS:
        text = read(path).lower()
        for token in [
            "207",
            "pds",
            "duplicate",
            "re-safety",
            "provenance",
            "mock-now",
            "playwright",
            "not_applicable",
            "passed",
        ]:
            if token not in text:
                fail(f"{path.relative_to(ROOT)} missing token {token}")


def validate_pds_cases() -> None:
    rows = csv_rows(PDS_CASES)
    if len(rows) != 10:
        fail("PDS fixture matrix must cover exactly 10 required cases")
    case_ids = {row.get("case_id", "") for row in rows}
    missing = PDS_REQUIRED.difference(case_ids)
    if missing:
        fail(f"PDS fixture missing cases {sorted(missing)}")
    for row in rows:
        case_id = row.get("case_id")
        if row.get("status") != "passed":
            fail(f"PDS case {case_id} is not passed")
        for column in [
            "feature_flag_state",
            "provider_attempted",
            "adapter_result",
            "canonical_progression",
            "fields_updated",
            "fields_ignored_or_quarantined",
            "provenance_state",
            "mutable_action_posture",
            "patient_visible_status",
        ]:
            if not row.get(column):
                fail(f"PDS case {case_id} missing {column}")
        if "binding" not in row.get("mutable_action_posture", ""):
            fail(f"PDS case {case_id} does not assert binding mutation posture")
    text = read(PDS_CASES).lower()
    for token in [
        "feature_flag",
        "not_called",
        "matched",
        "not_found",
        "parse_error",
        "timeout",
        "on_to_off",
        "prior_pds_cache_ignored",
        "legal_basis",
        "contact_claims_quarantined",
        "preference_kept",
    ]:
        if token not in text:
            fail(f"PDS fixtures missing {token}")


def validate_followup_cases() -> None:
    rows = csv_rows(FOLLOWUP_CASES)
    if len(rows) != 10:
        fail("follow-up fixture matrix must cover exactly 10 required cases")
    case_ids = {row.get("case_id", "") for row in rows}
    missing = FOLLOWUP_REQUIRED.difference(case_ids)
    if missing:
        fail(f"follow-up fixture missing cases {sorted(missing)}")
    for row in rows:
        case_id = row.get("case_id")
        if row.get("status") != "passed":
            fail(f"follow-up case {case_id} is not passed")
        for column in [
            "duplicate_class",
            "evidence_pattern",
            "re_safety_decision",
            "lineage_decision",
            "patient_visible_status",
            "audit_provenance_truth",
        ]:
            if not row.get(column):
                fail(f"follow-up case {case_id} missing {column}")
    text = read(FOLLOWUP_CASES).lower()
    for token in [
        "exact_replay",
        "exact_retry_collapse",
        "semantic_replay",
        "same_request_attach",
        "duplicate_attachment",
        "review_required",
        "re_safety_required",
        "urgent_re_safety_required",
        "no_re_safety",
        "no_stale_calm_status",
        "subject_fence_false",
    ]:
        if token not in text:
            fail(f"follow-up fixtures missing {token}")


def validate_chains_and_results() -> None:
    chains = load_json(CHAINS)
    if chains.get("taskId") != "seq_207":
        fail("chains file has wrong taskId")
    if chains.get("schemaVersion") != "phase2-enrichment-resafety-suite-v1":
        fail("chains file has wrong schema version")
    if chains.get("visualMode") != "Enrichment_Resafety_Lab":
        fail("chains visual mode drifted")
    if chains.get("statusVocabulary") != STATUS_VOCABULARY:
        fail("chains status vocabulary drifted")
    if chains.get("requiredCounters") != REQUIRED_COUNTERS:
        fail("chains requiredCounters must exactly match prompt vocabulary")
    expected_events = chains.get("expectedEvents", [])
    if len(expected_events) != len(REQUIRED_COUNTERS):
        fail("chains file must map each required counter to one expected event")
    for event in expected_events:
        if event.get("mustExposePhi") is not False:
            fail(f"{event.get('eventName')} may not expose PHI")
        if event.get("mustDuplicateWork") is not False:
            fail(f"{event.get('eventName')} may not duplicate work")
    for step in chains.get("pdsChain", []):
        if step.get("mustMutateBinding") is True:
            fail(f"PDS step {step.get('step')} allows binding mutation")
    for step in chains.get("followupChain", []):
        if step.get("mustCreateSecondReceipt") is True:
            fail(f"follow-up step {step.get('step')} allows duplicate receipt")
        if step.get("mustExposeStaleCalmStatus") is True:
            fail(f"follow-up step {step.get('step')} allows stale calm status")

    results = load_json(RESULTS)
    if results.get("taskId") != "seq_207":
        fail("results file has wrong taskId")
    if results.get("overallStatus") != "passed":
        fail("overall suite status must be passed")
    if results.get("visualMode") != "Enrichment_Resafety_Lab":
        fail("results visual mode drifted")
    if results.get("statusVocabulary") != STATUS_VOCABULARY:
        fail("results status vocabulary must distinguish passed, failed, blocked_external, not_applicable")
    if results.get("liveProviderEvidenceStatus") != "not_applicable":
        fail("live provider evidence status must be not_applicable for mock-now")
    if results.get("repositoryOwnedDefectFinding") != "absent_for_207_enrichment_resafety_boundary":
        fail("repository defect finding must record absence for 207 boundary")
    service = results.get("targetedServiceResult", {})
    if service.get("status") != "passed" or service.get("testFilesPassed") != 2 or service.get("testsPassed") != 13:
        fail("targeted service evidence must record 2 files and 13 tests passed")
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
        "Enrichment_Resafety_Lab",
        "max-width: 1540px",
        "min-height: 72px",
        "repeat(12, minmax(0, 1fr))",
        "grid-column: span 6",
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
        "140ms",
        "prefers-reduced-motion: reduce",
        "aria-pressed",
        "PDS207_FLAG_OFF_LOCAL_ONLY",
        "PDS207_ON_SUCCESS_ENRICHED",
        "PDS207_DEGRADED_UPSTREAM",
        "FUP207_EXACT_REPLAY_PHONE",
        "FUP207_LATE_EVIDENCE_RESAFETY",
        "data class separation",
        "failed: 0",
        "blocked_external",
        "not_applicable",
    ]:
        if token.lower() not in lab_lower:
            fail(f"lab missing required visual or accessibility token {token}")


def validate_playwright_spec() -> None:
    spec = read(PLAYWRIGHT_SPEC)
    for token in [
        "Enrichment_Resafety_Lab",
        "207-pds-off.png",
        "207-pds-success.png",
        "207-pds-degraded.png",
        "207-exact-duplicate.png",
        "207-material-resafety.png",
        "207-mobile.png",
        "207-tablet.png",
        "207-reduced-motion.png",
        "207-zoom.png",
        "reducedMotion",
        "ariaSnapshot",
        "assertNoOverflow",
        "ContactTruthProvenanceStrip",
        "DuplicateClassLadder",
        "EvidenceMatrices",
        "keyboard",
        "focus",
        "blocked_external",
        "not_applicable",
    ]:
        if token not in spec:
            fail(f"Playwright spec missing token {token}")


def validate_service_tests() -> None:
    pds = read(PDS_SERVICE_TEST)
    followup = read(FOLLOWUP_SERVICE_TEST)
    for token in [
        "keeps disabled mode local-only",
        "normalizes successful PDS FHIR responses",
        "fails local-only on timeout",
        "stale cache",
        "queued refreshes",
    ]:
        if token not in pds:
            fail(f"PDS service test missing {token}")
    for token in [
        "collapses exact replay",
        "semantic replay",
        "duplicate attachment",
        "continuity witness",
        "opens re-safety",
        "never exposes stale calm status",
    ]:
        if token not in followup:
            fail(f"follow-up service test missing {token}")


def validate_package_chain() -> None:
    package = load_json(PACKAGE_JSON)
    scripts = package.get("scripts", {})
    expected_script = "python3 ./tools/test/validate_phase2_enrichment_and_resafety_suite.py"
    if scripts.get("validate:phase2-enrichment-resafety-suite") != expected_script:
        fail("package.json missing validate:phase2-enrichment-resafety-suite script")

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
            fail(f"package.json {script_name} missing 207 validator chain")
    root_updates = read(ROOT_SCRIPT_UPDATES)
    if '"validate:phase2-enrichment-resafety-suite": "python3 ./tools/test/validate_phase2_enrichment_and_resafety_suite.py"' not in root_updates:
        fail("root_script_updates.py missing 207 validator script")
    if expected_chain not in root_updates:
        fail("root_script_updates.py missing 207 validator chain")


def main() -> None:
    validate_checklist()
    validate_docs()
    validate_pds_cases()
    validate_followup_cases()
    validate_chains_and_results()
    validate_lab()
    validate_playwright_spec()
    validate_service_tests()
    validate_package_chain()
    print("207 phase2 enrichment and re-safety suite validation passed")


if __name__ == "__main__":
    main()
