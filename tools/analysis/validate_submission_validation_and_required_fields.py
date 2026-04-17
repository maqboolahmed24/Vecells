#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "tools" / "analysis"))

from root_script_updates import ROOT_SCRIPT_UPDATES


DATA_ANALYSIS_DIR = ROOT / "data" / "analysis"
DATA_CONTRACTS_DIR = ROOT / "data" / "contracts"
DOCS_ARCHITECTURE_DIR = ROOT / "docs" / "architecture"
DOMAIN_PACKAGE_DIR = ROOT / "packages" / "domains" / "intake_request"
DOMAIN_SRC_DIR = DOMAIN_PACKAGE_DIR / "src"
DOMAIN_TESTS_DIR = DOMAIN_PACKAGE_DIR / "tests"
COMMAND_API_SRC_DIR = ROOT / "services" / "command-api" / "src"
COMMAND_API_TESTS_DIR = ROOT / "services" / "command-api" / "tests"

PACKAGE_JSON_PATH = ROOT / "package.json"
ROOT_SCRIPT_UPDATES_PATH = ROOT / "tools" / "analysis" / "root_script_updates.py"
TSCONFIG_BASE_PATH = ROOT / "tsconfig.base.json"

DOMAIN_INDEX_PATH = DOMAIN_SRC_DIR / "index.ts"
BUNDLE_PATH = DOMAIN_SRC_DIR / "intake-experience-bundle.ts"
VALIDATION_PATH = DOMAIN_SRC_DIR / "submission-envelope-validation.ts"
DOMAIN_TEST_PATH = DOMAIN_TESTS_DIR / "submission-envelope-validation.test.ts"
DOMAIN_PUBLIC_API_TEST_PATH = DOMAIN_TESTS_DIR / "public-api.test.ts"
COMMAND_API_PATH = COMMAND_API_SRC_DIR / "submission-envelope-validation.ts"
COMMAND_API_TEST_PATH = COMMAND_API_TESTS_DIR / "submission-envelope-validation.integration.test.js"

QUESTION_DEFINITIONS_PATH = DATA_CONTRACTS_DIR / "140_question_definitions.json"
ERROR_CONTRACT_PATH = DATA_CONTRACTS_DIR / "145_validation_error_contract.json"
VERDICT_SCHEMA_PATH = DATA_CONTRACTS_DIR / "145_submission_envelope_validation_verdict.schema.json"
MEANING_MAP_SCHEMA_PATH = DATA_CONTRACTS_DIR / "145_required_field_meaning_map.schema.json"
REQUIRED_FIELD_MATRIX_PATH = DATA_ANALYSIS_DIR / "145_required_field_matrix.csv"
READINESS_CASES_PATH = DATA_ANALYSIS_DIR / "145_submit_readiness_cases.json"
DESIGN_DOC_PATH = DOCS_ARCHITECTURE_DIR / "145_submission_envelope_validation_design.md"
MATRIX_DOC_PATH = DOCS_ARCHITECTURE_DIR / "145_required_field_and_submit_readiness_matrix.md"


def ensure(condition: bool, message: str) -> None:
    if not condition:
        raise SystemExit(message)


def read_json(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def read_csv_rows(path: Path) -> list[dict[str, str]]:
    with path.open(encoding="utf-8", newline="") as handle:
        return list(csv.DictReader(handle))


def main() -> None:
    required_paths = [
        PACKAGE_JSON_PATH,
        ROOT_SCRIPT_UPDATES_PATH,
        TSCONFIG_BASE_PATH,
        DOMAIN_INDEX_PATH,
        BUNDLE_PATH,
        VALIDATION_PATH,
        DOMAIN_TEST_PATH,
        DOMAIN_PUBLIC_API_TEST_PATH,
        COMMAND_API_PATH,
        COMMAND_API_TEST_PATH,
        QUESTION_DEFINITIONS_PATH,
        ERROR_CONTRACT_PATH,
        VERDICT_SCHEMA_PATH,
        MEANING_MAP_SCHEMA_PATH,
        REQUIRED_FIELD_MATRIX_PATH,
        READINESS_CASES_PATH,
        DESIGN_DOC_PATH,
        MATRIX_DOC_PATH,
    ]
    for path in required_paths:
        ensure(path.exists(), f"Missing par_145 artifact: {path}")

    package_json = read_json(PACKAGE_JSON_PATH)
    tsconfig_base = read_json(TSCONFIG_BASE_PATH)
    question_definitions = read_json(QUESTION_DEFINITIONS_PATH)
    error_contract = read_json(ERROR_CONTRACT_PATH)
    verdict_schema = read_json(VERDICT_SCHEMA_PATH)
    meaning_map_schema = read_json(MEANING_MAP_SCHEMA_PATH)
    matrix_rows = read_csv_rows(REQUIRED_FIELD_MATRIX_PATH)
    readiness_cases = read_json(READINESS_CASES_PATH)

    validation_text = VALIDATION_PATH.read_text(encoding="utf-8")
    domain_index_text = DOMAIN_INDEX_PATH.read_text(encoding="utf-8")
    domain_test_text = DOMAIN_TEST_PATH.read_text(encoding="utf-8")
    command_api_text = COMMAND_API_PATH.read_text(encoding="utf-8")
    command_api_test_text = COMMAND_API_TEST_PATH.read_text(encoding="utf-8")
    docs_text = DESIGN_DOC_PATH.read_text(encoding="utf-8") + "\n" + MATRIX_DOC_PATH.read_text(
        encoding="utf-8"
    )

    ensure(
        tsconfig_base["compilerOptions"]["paths"].get("@vecells/domain-intake-request")
        == ["packages/domains/intake_request/src/index.ts"],
        "tsconfig.base.json is missing the @vecells/domain-intake-request path alias.",
    )
    ensure(
        package_json["scripts"].get("validate:submission-envelope-validation")
        == "python3 ./tools/analysis/validate_submission_validation_and_required_fields.py",
        "package.json is missing validate:submission-envelope-validation.",
    )
    ensure(
        ROOT_SCRIPT_UPDATES["validate:submission-envelope-validation"]
        == "python3 ./tools/analysis/validate_submission_validation_and_required_fields.py",
        "root_script_updates.py is missing validate:submission-envelope-validation.",
    )
    ensure(
        "pnpm validate:submission-envelope-validation" in ROOT_SCRIPT_UPDATES["bootstrap"]
        and "pnpm validate:submission-envelope-validation" in ROOT_SCRIPT_UPDATES["check"],
        "Root script update strings do not include validate:submission-envelope-validation.",
    )

    for token in [
        'export * from "./intake-experience-bundle";',
        'export * from "./submission-envelope-validation";',
    ]:
        ensure(token in domain_index_text, f"Domain package index lost required export {token}.")

    for token in [
        "SubmissionEnvelopeValidationVerdict",
        "RequiredFieldMeaningMap",
        "buildRequiredFieldMeaningRowsForMatrix",
        "createSubmissionEnvelopeValidationService",
        "QUESTION_KEY_UNKNOWN",
        "FIELD_REQUIRED",
        "FIELD_SUPERSEDED_HIDDEN_ANSWER",
        "ATTACHMENT_STATE_UNRESOLVED",
        "URGENT_DECISION_PENDING",
        "PARALLEL_INTERFACE_GAP_145_ATTACHMENT_SCAN_PIPELINE_PENDING",
        "PARALLEL_INTERFACE_GAP_145_SYNCHRONOUS_SAFETY_ENGINE_PENDING",
        "GAP_RESOLVED_CONTACT_AUTHORITY_PHASE1_SELF_SERVICE_MINIMUM_V1",
    ]:
        ensure(token in validation_text, f"Validation seam lost required token {token}.")

    for token in [
        "createSubmissionEnvelopeValidationApplication",
        "submissionEnvelopeValidationProjectionHookRefs",
        "submissionEnvelopeValidationPublicEventPolicy",
        "DraftContinuityEvidenceProjectionDocument",
    ]:
        ensure(token in command_api_text, f"Command API seam lost required token {token}.")

    for token in [
        "shape_valid",
        "submit_ready",
        "FIELD_SUPERSEDED_HIDDEN_ANSWER",
        "ATTACHMENT_STATE_UNRESOLVED",
    ]:
        ensure(token in domain_test_text, f"Domain tests no longer cover {token}.")

    for token in [
        "evaluateDraftValidation",
        "evaluateSubmitReadiness",
        "submit_ready",
        "FIELD_SUPERSEDED_HIDDEN_ANSWER",
    ]:
        ensure(
            token in command_api_test_text,
            f"Command API integration tests no longer cover {token}.",
        )

    ensure(
        error_contract["contractId"] == "PHASE1_SUBMISSION_VALIDATION_ERROR_CONTRACT_V1",
        "Validation error contract ID drifted.",
    )
    ensure(
        error_contract["seamRef"] == "SEAM_143_VALIDATION_AND_REQUIRED_FIELD_DISCIPLINE",
        "Validation error contract seam ref drifted.",
    )
    ensure(
        error_contract["publicEventPolicy"]["newPublicEvents"] == [],
        "par_145 should not publish new public event names.",
    )
    error_codes = {entry["code"] for entry in error_contract["codes"]}
    for code in [
        "QUESTION_KEY_UNKNOWN",
        "FIELD_REQUIRED",
        "FIELD_SUPERSEDED_HIDDEN_ANSWER",
        "ATTACHMENT_STATE_UNRESOLVED",
        "ATTACHMENT_SUBMIT_BLOCKED",
        "CONTACT_AUTHORITY_BLOCKED",
        "BUNDLE_COMPATIBILITY_REVIEW_REQUIRED",
        "URGENT_DECISION_PENDING",
    ]:
        ensure(code in error_codes, f"Validation error contract is missing code {code}.")

    ensure(
        verdict_schema["title"] == "SubmissionEnvelopeValidationVerdict",
        "Verdict schema title drifted.",
    )
    ensure(
        verdict_schema["properties"]["verdictSchemaVersion"]["const"]
        == "SUBMISSION_ENVELOPE_VALIDATION_VERDICT_V1",
        "Verdict schema version drifted.",
    )
    ensure(
        {"shape_valid", "shape_invalid", "submit_ready", "submit_blocked", "submit_review_required"}
        == set(verdict_schema["properties"]["verdictState"]["enum"]),
        "Verdict schema lost a verdict state.",
    )
    ensure(
        verdict_schema["properties"]["requiredFieldMeaningMap"]["$ref"]
        == "145_required_field_meaning_map.schema.json",
        "Verdict schema no longer points at the required-field meaning-map contract.",
    )

    ensure(
        meaning_map_schema["title"] == "RequiredFieldMeaningMap",
        "RequiredFieldMeaningMap schema title drifted.",
    )
    ensure(
        meaning_map_schema["properties"]["mapSchemaVersion"]["const"]
        == "REQUIRED_FIELD_MEANING_MAP_V1",
        "RequiredFieldMeaningMap schema version drifted.",
    )
    ensure(
        {"visible", "hidden"}
        == set(
            meaning_map_schema["$defs"]["requiredFieldMeaningRow"]["properties"]["visibilityState"][
                "enum"
            ]
        ),
        "RequiredFieldMeaningMap schema lost visibility grammar.",
    )

    question_rows = question_definitions["questionDefinitions"]
    ensure(
        len(matrix_rows) == len(question_rows),
        "145_required_field_matrix.csv row count does not match the frozen question set.",
    )
    rows_by_key = {row["questionKey"]: row for row in matrix_rows}
    for definition in question_rows:
        row = rows_by_key.get(definition["questionKey"])
        ensure(row is not None, f"Required-field matrix is missing {definition['questionKey']}.")
        ensure(
            row["requestType"] == definition["requestType"],
            f"Required-field matrix requestType drifted for {definition['questionKey']}.",
        )
        ensure(
            row["requiredWhen"] == definition["requiredWhen"],
            f"Required-field matrix requiredWhen drifted for {definition['questionKey']}.",
        )
        ensure(
            row["visibilityPredicate"] == definition["visibilityPredicate"],
            f"Required-field matrix visibilityPredicate drifted for {definition['questionKey']}.",
        )
        ensure(
            row["normalizationTarget"] == definition["normalizationTarget"],
            f"Required-field matrix normalizationTarget drifted for {definition['questionKey']}.",
        )
        ensure(
            row["summaryRenderer"] == definition["summaryRenderer"],
            f"Required-field matrix summaryRenderer drifted for {definition['questionKey']}.",
        )
        ensure(
            row["safetyRelevance"] == definition["safetyRelevance"],
            f"Required-field matrix safetyRelevance drifted for {definition['questionKey']}.",
        )

    ensure(
        readiness_cases["contractRef"] == "SUBMISSION_ENVELOPE_VALIDATION_VERDICT_V1",
        "Submit-readiness cases drifted from the verdict contract.",
    )
    case_ids = {case["caseId"] for case in readiness_cases["cases"]}
    for case_id in [
        "PAR145_DRAFT_SAVE_INCREMENTAL_PROGRESS",
        "PAR145_BROWSER_SUBMIT_READY",
        "PAR145_URGENT_PENDING_BLOCKED",
        "PAR145_ATTACHMENT_STATE_UNKNOWN",
        "PAR145_ATTACHMENT_REVIEW_REQUIRED",
        "PAR145_EMBEDDED_CONTACT_AUTHORITY_REBIND",
        "PAR145_SUPERSEDED_BRANCH_EXCLUDED",
    ]:
        ensure(case_id in case_ids, f"Submit-readiness cases are missing {case_id}.")

    for token in [
        "SEAM_143_VALIDATION_AND_REQUIRED_FIELD_DISCIPLINE",
        "SubmissionEnvelope",
        "Phase1IntakeExperienceBundle",
        "RequiredFieldMeaningMap",
        "SubmissionEnvelopeValidationVerdict",
        "Mock_now_execution",
        "Actual_production_strategy_later",
        "DraftContinuityEvidenceProjectionDocument",
        "GAP_RESOLVED_CONTACT_AUTHORITY_PHASE1_SELF_SERVICE_MINIMUM_V1",
        "PARALLEL_INTERFACE_GAP_145_ATTACHMENT_SCAN_PIPELINE_PENDING",
        "PARALLEL_INTERFACE_GAP_145_SYNCHRONOUS_SAFETY_ENGINE_PENDING",
    ]:
        ensure(token in docs_text, f"par_145 docs lost required token {token}.")


if __name__ == "__main__":
    main()
