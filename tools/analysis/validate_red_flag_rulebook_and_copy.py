#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
DATA_CONTRACTS_DIR = ROOT / "data" / "contracts"
DATA_ANALYSIS_DIR = ROOT / "data" / "analysis"
DATA_TEST_DIR = ROOT / "data" / "test"
DOCS_CLINICAL_SAFETY_DIR = ROOT / "docs" / "clinical-safety"
DOCS_CONTENT_DIR = ROOT / "docs" / "content"
DOCS_FRONTEND_DIR = ROOT / "docs" / "frontend"
TOOLS_ANALYSIS_DIR = ROOT / "tools" / "analysis"
TESTS_PLAYWRIGHT_DIR = ROOT / "tests" / "playwright"

BUILD_SCRIPT_PATH = TOOLS_ANALYSIS_DIR / "build_red_flag_rulebook_and_copy.py"
VALIDATOR_PATH = TOOLS_ANALYSIS_DIR / "validate_red_flag_rulebook_and_copy.py"
RULEBOOK_DOC_PATH = DOCS_CLINICAL_SAFETY_DIR / "142_red_flag_rulebook.md"
DECISION_TABLES_DOC_PATH = DOCS_CLINICAL_SAFETY_DIR / "142_red_flag_decision_tables.md"
COPY_DECK_DOC_PATH = DOCS_CONTENT_DIR / "142_urgent_diversion_and_receipt_copy_deck.md"
ATLAS_HTML_PATH = DOCS_FRONTEND_DIR / "142_urgent_pathway_atlas.html"
RULE_PACK_SCHEMA_PATH = DATA_CONTRACTS_DIR / "142_red_flag_rule_pack.schema.json"
DECISION_TABLES_YAML_PATH = DATA_CONTRACTS_DIR / "142_red_flag_decision_tables.yaml"
OUTCOME_COPY_CONTRACT_PATH = DATA_CONTRACTS_DIR / "142_outcome_copy_contract.json"
CHALLENGE_CASES_PATH = DATA_TEST_DIR / "142_rule_challenge_cases.jsonl"
RULE_COVERAGE_MATRIX_PATH = DATA_ANALYSIS_DIR / "142_rule_coverage_matrix.csv"
PACKAGE_JSON_PATH = ROOT / "package.json"
ROOT_SCRIPT_UPDATES_PATH = TOOLS_ANALYSIS_DIR / "root_script_updates.py"
PLAYWRIGHT_PACKAGE_JSON_PATH = TESTS_PLAYWRIGHT_DIR / "package.json"
PLAYWRIGHT_SPEC_PATH = TESTS_PLAYWRIGHT_DIR / "142_urgent_pathway_and_safe_receipt.spec.js"

REQUIRED_RULE_FIELDS = {
    "ruleId",
    "ruleVersion",
    "humanReadableName",
    "clinicalRationale",
    "owningApprover",
    "effectiveDate",
    "testFixtureSet",
    "severityClass",
    "dependencyGroupRef",
    "logLikelihoodWeight",
    "criticalFeatureRefs",
    "missingnessMode",
    "contradictionMode",
    "calibrationStratumRef",
    "validityWindowRef",
}
REQUIRED_HTML_MARKERS = [
    'data-testid="urgent-pathway-atlas"',
    'data-testid="scenario-bar"',
    'data-testid="urgent-shell-frame"',
    'data-testid="outcome-card"',
    'data-testid="decision-ladder"',
    'data-testid="decision-ladder-table"',
    'data-testid="rule-family-visuals"',
    'data-testid="rule-family-table"',
    'data-testid="copy-comparison-table"',
    'data-testid="rule-coverage-table"',
    'data-testid="copy-inspector"',
    'data-testid="urgent-live-region"',
]
REQUIRED_CASE_IDS = {
    "C142_URGENT_CHEST_PAIN",
    "C142_THRESHOLD_URGENT_OVER",
    "C142_THRESHOLD_URGENT_UNDER",
    "C142_DEGRADED_ATTACHMENT_FAIL_CLOSED",
    "C142_CONTRADICTION_DOES_NOT_CLEAR_HARD_STOP",
    "C142_CRITICAL_MISSINGNESS_REVIEW_HOLD",
    "C142_URGENT_ISSUED_AFTER_SETTLEMENT",
    "C142_ENGINE_TIMEOUT_FAILED_SAFE",
}
FORBIDDEN_VALIDATION_TONE = {
    "fix the highlighted fields",
    "please correct the errors above",
    "validation error",
    "check the form and try again",
}


def ensure(condition: bool, message: str) -> None:
    if not condition:
        raise SystemExit(message)


def read_json(path: Path):
    return json.loads(path.read_text())


def read_jsonl(path: Path) -> list[dict]:
    return [json.loads(line) for line in path.read_text().splitlines() if line.strip()]


def read_csv_rows(path: Path) -> list[dict[str, str]]:
    with path.open(newline="") as handle:
        return list(csv.DictReader(handle))


def load_decision_tables() -> dict:
    # The .yaml payload is emitted as canonical JSON text for YAML 1.2 compatibility.
    return json.loads(DECISION_TABLES_YAML_PATH.read_text())


def main() -> None:
    for path in [
        BUILD_SCRIPT_PATH,
        VALIDATOR_PATH,
        RULEBOOK_DOC_PATH,
        DECISION_TABLES_DOC_PATH,
        COPY_DECK_DOC_PATH,
        ATLAS_HTML_PATH,
        RULE_PACK_SCHEMA_PATH,
        DECISION_TABLES_YAML_PATH,
        OUTCOME_COPY_CONTRACT_PATH,
        CHALLENGE_CASES_PATH,
        RULE_COVERAGE_MATRIX_PATH,
        PACKAGE_JSON_PATH,
        ROOT_SCRIPT_UPDATES_PATH,
        PLAYWRIGHT_PACKAGE_JSON_PATH,
        PLAYWRIGHT_SPEC_PATH,
    ]:
        ensure(path.exists(), f"Missing required seq_142 artifact: {path}")

    decision_tables = load_decision_tables()
    rule_pack_schema = read_json(RULE_PACK_SCHEMA_PATH)
    copy_contract = read_json(OUTCOME_COPY_CONTRACT_PATH)
    challenge_cases = read_jsonl(CHALLENGE_CASES_PATH)
    coverage_rows = read_csv_rows(RULE_COVERAGE_MATRIX_PATH)
    package_json = read_json(PACKAGE_JSON_PATH)
    playwright_package_json = read_json(PLAYWRIGHT_PACKAGE_JSON_PATH)
    root_script_updates = ROOT_SCRIPT_UPDATES_PATH.read_text()
    docs_text = "\n".join(
        path.read_text()
        for path in [RULEBOOK_DOC_PATH, DECISION_TABLES_DOC_PATH, COPY_DECK_DOC_PATH]
    )
    atlas_html = ATLAS_HTML_PATH.read_text()
    spec_text = PLAYWRIGHT_SPEC_PATH.read_text()

    ensure(decision_tables["taskId"] == "seq_142", "Rule pack taskId drifted.")
    ensure(decision_tables["visualMode"] == "Urgent_Pathway_Frame", "Urgent atlas visual mode drifted.")
    ensure(
        decision_tables["decisionBoundary"]["hardStopDominance"] is True,
        "Hard-stop dominance is no longer explicit.",
    )
    ensure(
        decision_tables["stateMachine"]["urgentIssuanceLaw"]["transitionRequirement"] == "settlementState = issued",
        "Urgent issued state no longer requires settlement issuance.",
    )
    ensure(
        decision_tables["stateMachine"]["failedSafeLaw"]["routineFlowMayContinue"] is False,
        "Failed-safe law incorrectly allows routine flow to continue.",
    )

    all_rules = (
        decision_tables["hardStopRules"]
        + decision_tables["urgentContributorRules"]
        + decision_tables["residualContributorRules"]
        + decision_tables["reachabilityContributorRules"]
    )
    ensure(len(all_rules) >= 10, "Rule pack coverage is too small for seq_142.")
    rule_ids = set()
    for rule in all_rules:
        ensure(REQUIRED_RULE_FIELDS.issubset(rule), f"Rule metadata is incomplete for {rule.get('ruleId')}.")
        rule_ids.add(rule["ruleId"])
        if rule["severityClass"] == "hard_stop":
            ensure(rule.get("dominatesSoftScore") is True, f"Hard-stop rule {rule['ruleId']} no longer declares dominance.")
        ensure(
            isinstance(rule["criticalFeatureRefs"], list) and rule["criticalFeatureRefs"],
            f"Rule {rule['ruleId']} lost critical feature refs.",
        )
        ensure(rule["challengeCaseRefs"], f"Rule {rule['ruleId']} is no longer covered by challenge cases.")

    schema_rule = rule_pack_schema["$defs"]["rule"]
    ensure(set(schema_rule["required"]) == REQUIRED_RULE_FIELDS, "Rule pack schema required fields drifted.")

    case_map = {case["challengeCaseId"]: case for case in challenge_cases}
    ensure(REQUIRED_CASE_IDS.issubset(case_map), "Challenge case corpus is missing mandatory seq_142 cases.")

    threshold_cases = [case for case in challenge_cases if "threshold_boundary" in case["challengeTags"]]
    ensure(len(threshold_cases) >= 2, "Threshold boundary coverage is incomplete.")
    ensure(
        any(case["expectedSubmitResult"] == "failed_safe" for case in challenge_cases if "degraded_attachment" in case["challengeTags"]),
        "Degraded attachment coverage no longer fails safe.",
    )
    contradiction_case = case_map["C142_CONTRADICTION_DOES_NOT_CLEAR_HARD_STOP"]
    ensure(
        contradiction_case["expectedRequestedSafetyState"] == "urgent_diversion_required"
        and contradiction_case["expectedHardStopHits"],
        "Contradictory low-assurance evidence now clears a hard stop.",
    )
    missingness_case = case_map["C142_CRITICAL_MISSINGNESS_REVIEW_HOLD"]
    ensure(
        missingness_case["expectedRequestedSafetyState"] == "residual_risk_flagged",
        "Critical missingness no longer holds the case at review.",
    )

    ensure(copy_contract["taskId"] == "seq_142", "Copy contract taskId drifted.")
    family_map = {family["outcomeFamily"]: family for family in copy_contract["copyFamilies"]}
    ensure(
        {"safe_receipt", "urgent_diversion", "failed_safe"} == set(family_map),
        "Copy families drifted from safe, urgent, and failed-safe.",
    )
    urgent_variants = {variant["variantRef"]: variant for variant in family_map["urgent_diversion"]["variants"]}
    ensure(
        urgent_variants["COPYVAR_142_URGENT_ISSUED_V1"]["requiresUrgentSettlementIssued"] is True,
        "Urgent issued copy variant no longer requires settlement issuance.",
    )
    ensure(
        urgent_variants["COPYVAR_142_URGENT_REQUIRED_V1"]["requiresUrgentSettlementIssued"] is False,
        "Urgent required copy variant now incorrectly requires settlement issuance.",
    )
    urgent_text = " ".join(
        [
            urgent_variants["COPYVAR_142_URGENT_REQUIRED_V1"]["title"],
            urgent_variants["COPYVAR_142_URGENT_REQUIRED_V1"]["summary"],
            *urgent_variants["COPYVAR_142_URGENT_REQUIRED_V1"]["supportingBullets"],
        ]
    ).lower()
    ensure(
        not any(fragment in urgent_text for fragment in FORBIDDEN_VALIDATION_TONE),
        "Urgent diversion copy reads like form validation.",
    )

    safe_variants = family_map["safe_receipt"]["variants"]
    failed_variant = family_map["failed_safe"]["variants"][0]
    ensure(
        all(variant["title"] != failed_variant["title"] for variant in safe_variants)
        and all(variant["summary"] != failed_variant["summary"] for variant in safe_variants),
        "Safe receipt and failed-safe copy became semantically interchangeable.",
    )
    ensure(
        all(variant["primaryAction"]["actionId"] != failed_variant["primaryAction"]["actionId"] for variant in safe_variants),
        "Safe receipt and failed-safe recovery now share the same dominant action.",
    )

    coverage_rule_ids = {row["ruleId"] for row in coverage_rows}
    ensure(rule_ids == coverage_rule_ids, "Coverage matrix drifted from authored rule IDs.")
    ensure(all(row["coverageStatus"] == "covered" for row in coverage_rows), "Rule coverage matrix is incomplete.")

    for token in [
        "SafetyPreemptionRecord",
        "SafetyDecisionRecord",
        "UrgentDiversionSettlement",
        "urgent_diversion_required",
        "urgent_diverted",
        "ArtifactPresentationContract",
        "OutboundNavigationGrant",
        "processing_failed",
        "theta_U",
        "theta_R",
    ]:
        ensure(token in docs_text, f"Docs lost required token {token}.")

    for marker in REQUIRED_HTML_MARKERS:
        ensure(marker in atlas_html, f"Urgent pathway atlas is missing marker {marker}.")
    for fragment in [
        "width: min(100%, 1280px);",
        "grid-template-columns: minmax(0, 760px) minmax(280px, 1fr);",
        "body[data-layout=\"stack\"] .shell-layout",
        "data-testid=\"decision-ladder-table\"",
        "data-testid=\"rule-family-table\"",
    ]:
        ensure(fragment in atlas_html, f"Urgent pathway atlas lost required layout fragment {fragment}.")

    scripts = package_json["scripts"]
    ensure(
        scripts.get("validate:red-flag-rulebook-copy") == "python3 ./tools/analysis/validate_red_flag_rulebook_and_copy.py",
        "Root package lost validate:red-flag-rulebook-copy.",
    )
    ensure(
        "python3 ./tools/analysis/build_red_flag_rulebook_and_copy.py" in scripts["codegen"],
        "Root package codegen is missing build_red_flag_rulebook_and_copy.py.",
    )
    ensure(
        "pnpm validate:red-flag-rulebook-copy" in scripts["bootstrap"]
        and "pnpm validate:red-flag-rulebook-copy" in scripts["check"],
        "Root package bootstrap/check lost validate:red-flag-rulebook-copy.",
    )
    ensure(
        '"validate:red-flag-rulebook-copy": "python3 ./tools/analysis/validate_red_flag_rulebook_and_copy.py"'
        in root_script_updates,
        "root_script_updates.py is missing validate:red-flag-rulebook-copy.",
    )
    ensure(
        "build_red_flag_rulebook_and_copy.py" in root_script_updates,
        "root_script_updates.py is missing the seq_142 builder.",
    )

    for script_name in ["build", "lint", "test", "typecheck", "e2e"]:
        ensure(
            "142_urgent_pathway_and_safe_receipt.spec.js" in playwright_package_json["scripts"][script_name],
            f"tests/playwright package is missing the seq_142 spec in {script_name}.",
        )

    for snippet in [
        "urgent-diversion same-shell transition",
        "safe-receipt outcome",
        "failed-safe recovery outcome",
        "keyboard focus placement",
        "responsive layout",
        "reduced-motion equivalence",
        "diagram and table parity",
    ]:
        ensure(snippet in spec_text, f"Playwright spec lost required coverage snippet: {snippet}")


if __name__ == "__main__":
    main()
