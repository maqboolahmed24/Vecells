#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]


PATHS = {
    "red_flag_cases": ROOT / "data/test/165_red_flag_decision_cases.csv",
    "upload_cases": ROOT / "data/test/165_malicious_upload_cases.csv",
    "chains": ROOT / "data/test/165_expected_settlement_and_event_chains.json",
    "results": ROOT / "data/test/165_suite_results.json",
    "suite_doc": ROOT / "docs/tests/165_red_flag_and_malicious_upload_suite.md",
    "rule_doc": ROOT / "docs/tests/165_red_flag_rule_coverage_matrix.md",
    "upload_doc": ROOT / "docs/tests/165_upload_quarantine_and_failure_matrix.md",
    "lab": ROOT / "docs/tests/165_red_flag_and_upload_lab.html",
    "safety_test": ROOT / "packages/domains/intake_safety/tests/165_red_flag_decision_cases.test.ts",
    "upload_test": ROOT / "services/command-api/tests/165_red_flag_and_upload_suite.integration.test.js",
    "playwright_spec": ROOT / "tests/playwright/165_red_flag_and_upload_lab.spec.js",
    "rule_pack": ROOT / "data/contracts/150_safety_rule_pack_registry.json",
    "attachment_policy": ROOT / "data/contracts/141_attachment_acceptance_policy.json",
    "root_package": ROOT / "package.json",
    "playwright_package": ROOT / "tests/playwright/package.json",
    "root_script_updates": ROOT / "tools/analysis/root_script_updates.py",
}


def fail(message: str) -> None:
    raise SystemExit(message)


def require(condition: bool, message: str) -> None:
    if not condition:
        fail(message)


def read_text(path: Path) -> str:
    require(path.exists(), f"MISSING_REQUIRED_FILE:{path}")
    return path.read_text(encoding="utf-8")


def load_json(path: Path):
    return json.loads(read_text(path))


def load_csv(path: Path) -> list[dict[str, str]]:
    require(path.exists(), f"MISSING_REQUIRED_FILE:{path}")
    with path.open("r", encoding="utf-8", newline="") as handle:
        return list(csv.DictReader(handle))


def split_refs(value: str) -> list[str]:
    return [item for item in value.split("|") if item]


def main() -> None:
    for path in PATHS.values():
        require(path.exists(), f"MISSING_REQUIRED_FILE:{path}")

    red_flag_rows = load_csv(PATHS["red_flag_cases"])
    upload_rows = load_csv(PATHS["upload_cases"])
    chains = load_json(PATHS["chains"])
    results = load_json(PATHS["results"])
    rule_pack = load_json(PATHS["rule_pack"])
    attachment_policy = load_json(PATHS["attachment_policy"])
    lab = read_text(PATHS["lab"])
    suite_doc = read_text(PATHS["suite_doc"])
    rule_doc = read_text(PATHS["rule_doc"])
    upload_doc = read_text(PATHS["upload_doc"])
    safety_test = read_text(PATHS["safety_test"])
    upload_test = read_text(PATHS["upload_test"])
    playwright_spec = read_text(PATHS["playwright_spec"])
    root_package = load_json(PATHS["root_package"])
    playwright_package = load_json(PATHS["playwright_package"])
    root_script_updates = read_text(PATHS["root_script_updates"])

    require(red_flag_rows, "RED_FLAG_CASE_MATRIX_EMPTY")
    require(upload_rows, "UPLOAD_CASE_MATRIX_EMPTY")
    require(
        chains["rulePackVersionRef"] == "RFRP_142_PHASE1_SYNCHRONOUS_SAFETY_V1@1.0.0",
        "SETTLEMENT_CHAIN_RULE_PACK_DRIFT",
    )
    require(
        chains["attachmentPolicyId"] == "AAP_141_PHASE1_ATTACHMENT_POLICY_V1",
        "SETTLEMENT_CHAIN_ATTACHMENT_POLICY_DRIFT",
    )

    packs = rule_pack.get("packs")
    require(isinstance(packs, list) and len(packs) == 1, "RULE_PACK_REGISTRY_EXPECTS_ONE_PACK")
    current_rules = packs[0].get("rules")
    require(isinstance(current_rules, list), "RULE_PACK_RULES_MISSING")
    current_rule_ids = {row["ruleId"] for row in current_rules}
    row_level_rule_ids = {
        row["source_rule_id"]
        for row in red_flag_rows
        if row["case_family"] == "row_level_rule_coverage"
    }
    require(current_rule_ids == row_level_rule_ids, "RED_FLAG_ROW_LEVEL_RULE_COVERAGE_DRIFT")

    legal_decisions = {
        "urgent_required",
        "residual_review",
        "fallback_manual_review",
        "clear_routine",
    }
    legal_requested = {
        "urgent_diversion_required",
        "residual_risk_flagged",
        "screen_clear",
    }
    for row in red_flag_rows:
        require(row["expected_decision_outcome"] in legal_decisions, f"ILLEGAL_DECISION:{row['case_id']}")
        require(row["expected_requested_safety_state"] in legal_requested, f"ILLEGAL_REQUESTED_STATE:{row['case_id']}")
        require(row["automated_assertion_ref"], f"RULE_ROW_MISSING_ASSERTION:{row['case_id']}")
        require(row["browser_case_id"] in lab, f"RULE_ROW_BROWSER_PROOF_MISSING:{row['case_id']}")
        for field in [
            "expected_hard_stop_rule_refs",
            "expected_urgent_contributor_rule_refs",
            "expected_residual_contributor_rule_refs",
            "expected_reachability_contributor_rule_refs",
        ]:
            for rule_id in split_refs(row[field]):
                require(rule_id in current_rule_ids, f"RULE_ROW_REFERENCES_UNKNOWN_RULE:{row['case_id']}:{rule_id}")

    required_case_families = {
        "row_level_rule_coverage",
        "boundary_value",
        "dependency_group_capping",
        "degraded_evidence",
        "urgent_settlement_separation",
    }
    require(
        required_case_families.issubset({row["case_family"] for row in red_flag_rows}),
        "RED_FLAG_CASE_FAMILY_COVERAGE_INCOMPLETE",
    )

    require(
        attachment_policy["policyId"] == "AAP_141_PHASE1_ATTACHMENT_POLICY_V1",
        "ATTACHMENT_POLICY_ID_DRIFT",
    )
    policy_rule_refs = {row["ruleRef"] for row in attachment_policy["acceptanceRules"]}
    required_upload_families = {
        "safe_baseline",
        "safe_degraded_preview",
        "quarantine",
        "unresolved_retry",
        "policy_rejection",
        "duplicate",
        "mixed_batch",
    }
    require(
        required_upload_families.issubset({row["case_family"] for row in upload_rows}),
        "UPLOAD_CASE_FAMILY_COVERAGE_INCOMPLETE",
    )
    for row in upload_rows:
        if row["policy_rule_ref"]:
            require(row["policy_rule_ref"] in policy_rule_refs, f"UPLOAD_ROW_UNKNOWN_POLICY_RULE:{row['case_id']}")
        require(row["expected_trusted_before_pipeline"] == "false", f"UPLOAD_TRUSTED_BEFORE_PIPELINE:{row['case_id']}")
        require(row["automated_assertion_ref"], f"UPLOAD_ROW_MISSING_ASSERTION:{row['case_id']}")
        require(row["browser_case_id"] in lab, f"UPLOAD_ROW_BROWSER_PROOF_MISSING:{row['case_id']}")
        if row["expected_fallback_review_open"] == "true":
            require(
                row["expected_submit_disposition"] != "routine_submit_allowed",
                f"FALLBACK_UPLOAD_ROW_ROUTINE:{row['case_id']}",
            )
            require(
                row["expected_patient_continuity_posture"] not in {"safe_preview_ready", "safe_placeholder_same_shell"},
                f"FALLBACK_UPLOAD_ROW_CALM_COPY:{row['case_id']}",
            )
        if row["expected_grant_allowed"] == "false":
            require(row["expected_download_policy"] == "forbidden", f"UPLOAD_FORBIDDEN_GRANT_DRIFT:{row['case_id']}")

    settlement_states = {row["settlementState"] for row in chains["urgentSettlementChains"]}
    require(
        settlement_states == {"pending", "issued", "failed", "superseded"},
        "URGENT_SETTLEMENT_STATE_COVERAGE_DRIFT",
    )
    issued = next(row for row in chains["urgentSettlementChains"] if row["settlementState"] == "issued")
    pending = next(row for row in chains["urgentSettlementChains"] if row["settlementState"] == "pending")
    require(issued["urgentDivertedVisible"] is True, "URGENT_ISSUED_NOT_VISIBLE")
    require(pending["urgentDivertedVisible"] is False, "URGENT_PENDING_COLLAPSED_TO_ISSUED")

    for marker in [
        "Safety_Gate_Lab",
        'id="safety_vector_mark"',
        'data-testid="decision-ladder"',
        'data-testid="evidence-ribbon"',
        'data-testid="urgent-settlement-ladder"',
        'data-testid="decision-ladder-table"',
        'data-testid="evidence-ribbon-table"',
        'data-testid="urgent-settlement-table"',
        'data-testid="event-chain-table"',
        'data-testid="settlement-parity-table"',
        'data-testid="upload-quarantine-table"',
        "prefers-reduced-motion",
        "patient.portal.requests",
    ]:
        require(marker in lab, f"LAB_MARKER_MISSING:{marker}")

    for marker in [
        "Every frozen rule row has an automated assertion",
        "Upload corpus",
        "Urgent required is not urgent issued",
        "Mixed batch is not falsely calm",
    ]:
        require(marker in suite_doc, f"SUITE_DOC_MARKER_MISSING:{marker}")
    for rule_id in current_rule_ids:
        require(rule_id in rule_doc, f"RULE_DOC_MISSING_RULE:{rule_id}")
    for row in upload_rows:
        require(row["case_id"] in upload_doc, f"UPLOAD_DOC_MISSING_CASE:{row['case_id']}")

    require(
        "residualContributorRuleRefs.length > 0" in read_text(ROOT / "packages/domains/intake_safety/src/synchronous-safety-engine.ts"),
        "RESIDUAL_CONTRIBUTOR_FAILS_TO_HOLD_REVIEW",
    )
    for marker in [
        "findLatestUrgentDiversionSettlementForRequest",
        "createUrgentDiversionSettlementService",
        "phase1SynchronousSafetyRulePackRegistry",
    ]:
        require(marker in safety_test, f"SAFETY_TEST_MARKER_MISSING:{marker}")
    for marker in [
        "createIntakeAttachmentApplication",
        "beforePipeline.contract.previewPolicy",
        "replace_or_remove_then_review",
        "UP165_MIXED_BATCH_UNSAFE",
    ]:
        require(marker in upload_test, f"UPLOAD_TEST_MARKER_MISSING:{marker}")
    for marker in [
        "decision-table case rendering and row synchronization",
        "urgent-required versus urgent-issued surface differences",
        "failed-safe upload continuity rendering",
        "reduced-motion equivalence",
        "diagram and table parity",
    ]:
        require(marker in playwright_spec, f"PLAYWRIGHT_SPEC_MARKER_MISSING:{marker}")

    expected_counts = results["fixtureCounts"]
    require(expected_counts["redFlagDecisionCases"] == len(red_flag_rows), "RESULTS_RED_FLAG_COUNT_DRIFT")
    require(expected_counts["uploadCases"] == len(upload_rows), "RESULTS_UPLOAD_COUNT_DRIFT")
    require(expected_counts["ruleRowsCovered"] == len(current_rule_ids), "RESULTS_RULE_COUNT_DRIFT")
    require(
        results["mockNowExecution"]["safeDeterministicFixturesOnly"] is True,
        "RESULTS_MUST_DECLARE_SAFE_DETERMINISTIC_FIXTURES",
    )

    root_scripts = root_package["scripts"]
    require(
        root_scripts.get("validate:red-flag-upload-suite")
        == "python3 ./tools/test/validate_red_flag_and_upload_suite.py",
        "ROOT_VALIDATE_SCRIPT_MISSING",
    )
    for script_name in ["bootstrap", "check"]:
        require(
            "pnpm validate:red-flag-upload-suite" in root_scripts.get(script_name, ""),
            f"ROOT_{script_name.upper()}_MISSING_165_VALIDATOR",
        )
    require(
        '"validate:red-flag-upload-suite": "python3 ./tools/test/validate_red_flag_and_upload_suite.py"'
        in root_script_updates,
        "ROOT_SCRIPT_UPDATES_VALIDATE_ENTRY_MISSING",
    )
    require(
        "pnpm validate:red-flag-upload-suite" in root_script_updates,
        "ROOT_SCRIPT_UPDATES_CHAIN_MISSING_165_VALIDATOR",
    )

    playwright_scripts = playwright_package["scripts"]
    for script_name in ["build", "lint", "test", "typecheck"]:
        require(
            "165_red_flag_and_upload_lab.spec.js" in playwright_scripts.get(script_name, ""),
            f"PLAYWRIGHT_{script_name.upper()}_MISSING_165_SPEC",
        )
    require(
        "165_red_flag_and_upload_lab.spec.js --run" in playwright_scripts.get("e2e", ""),
        "PLAYWRIGHT_E2E_MISSING_165_SPEC_RUN",
    )

    print("validate_red_flag_and_upload_suite: ok")


if __name__ == "__main__":
    main()
