#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
DATA_CONTRACTS_DIR = ROOT / "data" / "contracts"
DATA_ANALYSIS_DIR = ROOT / "data" / "analysis"
DOCS_ARCHITECTURE_DIR = ROOT / "docs" / "architecture"
DOCS_API_DIR = ROOT / "docs" / "api"
DOCS_CONTENT_DIR = ROOT / "docs" / "content"
DOCS_FRONTEND_DIR = ROOT / "docs" / "frontend"
TOOLS_ANALYSIS_DIR = ROOT / "tools" / "analysis"
TESTS_PLAYWRIGHT_DIR = ROOT / "tests" / "playwright"

TAXONOMY_PATH = DATA_CONTRACTS_DIR / "140_request_type_taxonomy.json"
BUNDLE_SCHEMA_PATH = DATA_CONTRACTS_DIR / "140_intake_experience_bundle.schema.json"
QUESTION_DEFINITIONS_PATH = DATA_CONTRACTS_DIR / "140_question_definitions.json"
DECISION_TABLES_PATH = DATA_CONTRACTS_DIR / "140_questionnaire_decision_tables.yaml"
VISIBILITY_MATRIX_PATH = DATA_ANALYSIS_DIR / "140_question_visibility_matrix.csv"
BUNDLE_MATRIX_PATH = DATA_ANALYSIS_DIR / "140_bundle_compatibility_matrix.csv"
TAXONOMY_DOC_PATH = DOCS_ARCHITECTURE_DIR / "140_request_type_taxonomy.md"
QUESTION_CONTRACT_DOC_PATH = DOCS_API_DIR / "140_question_definition_contract.md"
DECISION_TABLE_DOC_PATH = DOCS_CONTENT_DIR / "140_questionnaire_decision_tables.md"
ATLAS_HTML_PATH = DOCS_FRONTEND_DIR / "140_request_type_questionnaire_atlas.html"
PACKAGE_JSON_PATH = ROOT / "package.json"
ROOT_SCRIPT_UPDATES_PATH = TOOLS_ANALYSIS_DIR / "root_script_updates.py"
PLAYWRIGHT_PACKAGE_JSON_PATH = TESTS_PLAYWRIGHT_DIR / "package.json"
PLAYWRIGHT_SPEC_PATH = TESTS_PLAYWRIGHT_DIR / "140_request_type_questionnaire_atlas.spec.js"

REQUIRED_REQUEST_TYPES = ["Symptoms", "Meds", "Admin", "Results"]
REQUIRED_BUNDLE_FIELDS = {
    "bundleRef",
    "bundleVersion",
    "draftSchemaVersion",
    "questionSetVersion",
    "contentPackVersion",
    "embeddedManifestVersionRef",
    "releaseApprovalFreezeRef",
    "minimumBridgeCapabilitiesRef",
    "effectiveAt",
    "expiresAt",
    "compatibilityMode",
    "embeddedChromePolicy",
}
ALLOWED_COMPATIBILITY_MODES = {"resume_compatible", "review_migration_required", "blocked"}
ALLOWED_SAFETY_RELEVANCE = {"none", "triage_relevant", "safety_relevant"}
REQUIRED_ATLAS_MARKERS = [
    'data-testid="request-type-atlas"',
    'data-testid="hero-band"',
    'data-testid="request-type-card-Symptoms"',
    'data-testid="request-type-card-Meds"',
    'data-testid="request-type-card-Admin"',
    'data-testid="request-type-card-Results"',
    'data-testid="narrative-column"',
    'data-testid="conditional-demo"',
    'data-testid="active-payload"',
    'data-testid="superseded-audit"',
    'data-testid="review-confirmation-note"',
    'data-testid="branching-canvas"',
    'data-testid="constellation-diagram"',
    'data-testid="tree-canvas"',
    'data-testid="tree-parity-table"',
    'data-testid="bundle-notes"',
    'data-testid="table-tabs"',
    'data-testid="decision-table"',
    'data-testid="visibility-matrix"',
    'data-testid="bundle-matrix"',
]


def ensure(condition: bool, message: str) -> None:
    if not condition:
        raise SystemExit(message)


def read_json(path: Path) -> dict:
    return json.loads(path.read_text())


def read_csv_rows(path: Path) -> list[dict[str, str]]:
    with path.open(newline="") as handle:
        return list(csv.DictReader(handle))


def main() -> None:
    required_paths = [
        TAXONOMY_PATH,
        BUNDLE_SCHEMA_PATH,
        QUESTION_DEFINITIONS_PATH,
        DECISION_TABLES_PATH,
        VISIBILITY_MATRIX_PATH,
        BUNDLE_MATRIX_PATH,
        TAXONOMY_DOC_PATH,
        QUESTION_CONTRACT_DOC_PATH,
        DECISION_TABLE_DOC_PATH,
        ATLAS_HTML_PATH,
        PACKAGE_JSON_PATH,
        ROOT_SCRIPT_UPDATES_PATH,
        PLAYWRIGHT_PACKAGE_JSON_PATH,
        PLAYWRIGHT_SPEC_PATH,
    ]
    for path in required_paths:
        ensure(path.exists(), f"Missing required seq_140 artifact: {path}")

    taxonomy = read_json(TAXONOMY_PATH)
    bundle_schema = read_json(BUNDLE_SCHEMA_PATH)
    question_contract = read_json(QUESTION_DEFINITIONS_PATH)
    decision_tables = json.loads(DECISION_TABLES_PATH.read_text())
    visibility_rows = read_csv_rows(VISIBILITY_MATRIX_PATH)
    bundle_rows = read_csv_rows(BUNDLE_MATRIX_PATH)
    package_json = read_json(PACKAGE_JSON_PATH)
    playwright_package_json = read_json(PLAYWRIGHT_PACKAGE_JSON_PATH)
    root_script_updates_text = ROOT_SCRIPT_UPDATES_PATH.read_text()
    atlas_html = ATLAS_HTML_PATH.read_text()
    docs_text = "\n".join(
        path.read_text()
        for path in [TAXONOMY_DOC_PATH, QUESTION_CONTRACT_DOC_PATH, DECISION_TABLE_DOC_PATH]
    )

    ensure(taxonomy["taskId"] == "seq_140", "Taxonomy taskId drifted.")
    ensure(taxonomy["visualMode"] == "Request_Type_Atlas", "Atlas visual mode drifted.")
    request_types = [row["requestType"] for row in taxonomy["requestTypes"]]
    ensure(request_types == REQUIRED_REQUEST_TYPES, "Canonical request type order drifted.")
    ensure(
        taxonomy["requestTypeChangePolicy"]["confirmationRequired"] is True,
        "Request-type change confirmation is no longer mandatory.",
    )
    ensure(
        taxonomy["requestTypeChangePolicy"]["forbiddenBehavior"] == "silent_semantic_remap",
        "Request-type change policy no longer blocks silent remap.",
    )

    ensure(
        REQUIRED_BUNDLE_FIELDS.issubset(set(bundle_schema["required"])),
        "IntakeExperienceBundle missing required fields.",
    )
    ensure(
        set(bundle_schema["properties"]["compatibilityMode"]["enum"]) == ALLOWED_COMPATIBILITY_MODES,
        "Bundle compatibility mode enum drifted.",
    )
    ensure(
        bundle_schema["properties"]["embeddedChromePolicy"]["enum"] == ["standard", "nhs_embedded_minimal"],
        "Embedded chrome policy enum drifted.",
    )
    ensure(
        bundle_schema["properties"]["draftSchemaVersion"]["const"] == "INTAKE_DRAFT_VIEW_V1",
        "Bundle draft schema version drifted.",
    )

    question_definitions = question_contract["questionDefinitions"]
    summary_renderers = {row["summaryRenderer"] for row in question_contract["summaryRenderers"]}
    supersession_policies = {
        row["supersessionPolicy"]: row for row in question_contract["supersessionPolicies"]
    }
    help_content_refs = {row["helpContentRef"] for row in question_contract["helpContent"]}
    unknown_policy_refs = {row["policyRef"] for row in question_contract["unknownHandlingPolicies"]}

    ensure(len(question_definitions) == len(visibility_rows), "Visibility matrix row count drifted.")
    ensure(len(question_definitions) >= 20, "Question definition coverage is too small for the frozen Phase 1 quartet.")

    for question in question_definitions:
        for field_name in question_contract["fieldContract"]:
            ensure(question.get(field_name), f"Question definition {question.get('questionKey')} is missing {field_name}.")
        ensure(
            question["requestType"] in REQUIRED_REQUEST_TYPES,
            f"Question {question['questionKey']} points at an unknown request type.",
        )
        ensure(
            question["safetyRelevance"] in ALLOWED_SAFETY_RELEVANCE,
            f"Question {question['questionKey']} has an invalid safety relevance.",
        )
        ensure(
            question["summaryRenderer"] in summary_renderers,
            f"Question {question['questionKey']} points at an unknown summary renderer.",
        )
        ensure(
            question["supersessionPolicy"] in supersession_policies,
            f"Question {question['questionKey']} points at an unknown supersession policy.",
        )
        ensure(
            question["helpContentRef"] in help_content_refs,
            f"Question {question['questionKey']} points at unknown help content.",
        )
        if "unknownHandlingPolicyRef" in question:
            ensure(
                question["unknownHandlingPolicyRef"] in unknown_policy_refs,
                f"Question {question['questionKey']} points at an unknown unknown-handling policy.",
            )
        if "&&" in question["visibilityPredicate"]:
            ensure(
                question["supersessionPolicy"] != "SUP_140_ALWAYS_ACTIVE_V1",
                f"Conditional question {question['questionKey']} is missing branch supersession.",
            )
        if question["safetyRelevance"] == "safety_relevant" and question["supersessionPolicy"] != "SUP_140_ALWAYS_ACTIVE_V1":
            ensure(
                supersession_policies[question["supersessionPolicy"]]["forceReviewConfirmationWhenSafetyRelevant"]
                is True,
                f"Safety-relevant conditional question {question['questionKey']} no longer forces review confirmation.",
            )

    ensure(
        any(question["questionKey"] == "meds.nameKnown" for question in question_definitions),
        "Meds name-known branch is missing.",
    )
    ensure(
        any(question["questionKey"] == "results.dateKnown" for question in question_definitions),
        "Results date-known branch is missing.",
    )
    ensure(
        any(question.get("unknownHandlingPolicyRef") == "UNK_140_MEDS_NAME_BOUNDED_V1" for question in question_definitions),
        "Meds unknown-handling policy is missing from the question set.",
    )
    ensure(
        any(question.get("unknownHandlingPolicyRef") == "UNK_140_RESULTS_DATE_BOUNDED_V1" for question in question_definitions),
        "Results unknown-handling policy is missing from the question set.",
    )

    visibility_by_key = {row["questionKey"]: row for row in visibility_rows}
    for question in question_definitions:
        row = visibility_by_key.get(question["questionKey"])
        ensure(row is not None, f"Visibility matrix is missing {question['questionKey']}.")
        ensure(
            row["normalizationTarget"] == question["normalizationTarget"],
            f"Visibility matrix normalization target drifted for {question['questionKey']}.",
        )
        ensure(
            row["summaryRenderer"] == question["summaryRenderer"],
            f"Visibility matrix summary renderer drifted for {question['questionKey']}.",
        )
        ensure(
            row["safetyRelevance"] == question["safetyRelevance"],
            f"Visibility matrix safety relevance drifted for {question['questionKey']}.",
        )

    bundle_modes = {row["compatibilityMode"] for row in bundle_rows}
    ensure(bundle_modes == ALLOWED_COMPATIBILITY_MODES, "Bundle compatibility matrix no longer covers every compatibility mode.")
    for row in bundle_rows:
        ensure(row["compatibilityMode"] in ALLOWED_COMPATIBILITY_MODES, f"Invalid bundle compatibility mode in {row['scenarioId']}.")
        ensure(row["migrationAction"], f"Bundle scenario {row['scenarioId']} is missing migration action.")

    ensure(
        len(decision_tables["bundleCompatibilityRules"]) == len(bundle_rows),
        "Decision-table bundle rules drifted from the published matrix.",
    )
    ensure(
        len(decision_tables["visibilityRules"]) >= 6,
        "Decision tables lost the conditional visibility rules.",
    )
    ensure(
        decision_tables["requestTypeChangePolicy"]["confirmationRequired"] is True,
        "Decision tables no longer require request-type change confirmation.",
    )
    lifecycle = " ".join(decision_tables["conditionalSupersessionLifecycle"])
    ensure("active summary" in lifecycle and "active payload" in lifecycle, "Supersession lifecycle no longer excludes hidden answers from active surfaces.")

    ensure("confirm-and-supersede" in docs_text, "Docs no longer describe confirm-and-supersede request-type change handling.")
    ensure("resume_compatible" in docs_text, "Docs no longer describe resume_compatible bundle handling.")
    ensure("review_migration_required" in docs_text, "Docs no longer describe review_migration_required bundle handling.")
    ensure("blocked" in docs_text, "Docs no longer describe blocked bundle handling.")
    ensure("unknown" in docs_text.lower(), "Docs no longer describe bounded unknown handling.")

    for marker in REQUIRED_ATLAS_MARKERS:
        ensure(marker in atlas_html, f"Atlas is missing marker {marker}.")
    ensure('id="atlas-data"' in atlas_html, "Atlas is missing embedded atlas data.")
    ensure('id="visibility-matrix-data"' in atlas_html, "Atlas is missing embedded visibility data.")
    ensure('id="bundle-matrix-data"' in atlas_html, "Atlas is missing embedded bundle data.")
    ensure("mission_stack" in atlas_html, "Atlas no longer supports mission_stack layout.")
    ensure("reduced-motion" in atlas_html, "Atlas no longer supports reduced motion.")

    package_scripts = package_json["scripts"]
    ensure(
        package_scripts.get("validate:request-type-taxonomy")
        == "python3 ./tools/analysis/validate_request_type_taxonomy_and_tables.py",
        "Root package script validate:request-type-taxonomy drifted.",
    )
    ensure(
        "build_request_type_taxonomy_and_tables.py" in package_scripts.get("codegen", ""),
        "Root codegen no longer builds seq_140.",
    )
    ensure(
        "validate:request-type-taxonomy" in package_scripts.get("bootstrap", "")
        and "validate:request-type-taxonomy" in package_scripts.get("check", ""),
        "Root scripts no longer include seq_140 validation.",
    )

    ensure(
        "build_request_type_taxonomy_and_tables.py" in root_script_updates_text,
        "root_script_updates.py no longer tracks the seq_140 builder.",
    )
    ensure(
        "validate_request_type_taxonomy_and_tables.py" in root_script_updates_text,
        "root_script_updates.py no longer tracks the seq_140 validator.",
    )
    playwright_scripts = playwright_package_json["scripts"]
    for script_name in ["build", "lint", "test", "typecheck", "e2e"]:
        ensure(
            "140_request_type_questionnaire_atlas.spec.js" in playwright_scripts[script_name],
            f"Playwright package {script_name} is missing the seq_140 spec.",
        )


if __name__ == "__main__":
    main()
