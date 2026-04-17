#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "tools" / "analysis"))

from root_script_updates import ROOT_SCRIPT_UPDATES


def ensure(condition: bool, message: str) -> None:
    if not condition:
        raise SystemExit(message)


def read_json(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def read_csv_rows(path: Path) -> list[dict[str, str]]:
    with path.open(encoding="utf-8", newline="") as handle:
        return list(csv.DictReader(handle))


def main() -> None:
    package_json_path = ROOT / "package.json"
    root_script_updates_path = ROOT / "tools" / "analysis" / "root_script_updates.py"
    domain_index_path = ROOT / "packages" / "domains" / "intake_request" / "src" / "index.ts"
    domain_runtime_path = (
        ROOT / "packages" / "domains" / "intake_request" / "src" / "normalized-submission.ts"
    )
    validation_path = (
        ROOT / "packages" / "domains" / "intake_request" / "src" / "submission-envelope-validation.ts"
    )
    promotion_path = (
        ROOT
        / "packages"
        / "domains"
        / "intake_request"
        / "src"
        / "submission-promotion-transaction.ts"
    )
    domain_test_path = (
        ROOT / "packages" / "domains" / "intake_request" / "tests" / "normalized-submission.test.ts"
    )
    domain_public_api_test_path = (
        ROOT / "packages" / "domains" / "intake_request" / "tests" / "public-api.test.ts"
    )
    command_api_path = ROOT / "services" / "command-api" / "src" / "normalized-submission.ts"
    intake_submit_path = ROOT / "services" / "command-api" / "src" / "intake-submit.ts"
    command_api_test_path = (
        ROOT / "services" / "command-api" / "tests" / "normalized-submission.integration.test.js"
    )
    contract_path = ROOT / "data" / "contracts" / "149_normalized_submission_contract.json"
    matrix_path = ROOT / "data" / "analysis" / "149_request_type_normalization_matrix.csv"
    reasons_path = ROOT / "data" / "analysis" / "149_normalization_reason_codes.json"
    design_doc_path = ROOT / "docs" / "architecture" / "149_normalized_submission_design.md"
    mapping_doc_path = ROOT / "docs" / "architecture" / "149_request_type_mapping_rules.md"
    question_defs_path = ROOT / "data" / "contracts" / "140_question_definitions.json"

    required_paths = [
        package_json_path,
        root_script_updates_path,
        domain_index_path,
        domain_runtime_path,
        validation_path,
        promotion_path,
        domain_test_path,
        domain_public_api_test_path,
        command_api_path,
        intake_submit_path,
        command_api_test_path,
        contract_path,
        matrix_path,
        reasons_path,
        design_doc_path,
        mapping_doc_path,
        question_defs_path,
    ]
    for path in required_paths:
        ensure(path.exists(), f"Missing par_149 artifact: {path}")

    package_json = read_json(package_json_path)
    contract = read_json(contract_path)
    matrix_rows = read_csv_rows(matrix_path)
    reason_catalog = read_json(reasons_path)
    question_defs = read_json(question_defs_path)

    domain_runtime_text = domain_runtime_path.read_text(encoding="utf-8")
    validation_text = validation_path.read_text(encoding="utf-8")
    promotion_text = promotion_path.read_text(encoding="utf-8")
    domain_index_text = domain_index_path.read_text(encoding="utf-8")
    domain_test_text = domain_test_path.read_text(encoding="utf-8")
    public_api_test_text = domain_public_api_test_path.read_text(encoding="utf-8")
    command_api_text = command_api_path.read_text(encoding="utf-8")
    intake_submit_text = intake_submit_path.read_text(encoding="utf-8")
    command_api_test_text = command_api_test_path.read_text(encoding="utf-8")
    docs_text = design_doc_path.read_text(encoding="utf-8") + "\n" + mapping_doc_path.read_text(
        encoding="utf-8"
    )

    ensure(
        package_json["scripts"].get("validate:free-text-normalization")
        == "python3 ./tools/analysis/validate_free_text_normalization.py",
        "package.json is missing validate:free-text-normalization.",
    )
    ensure(
        ROOT_SCRIPT_UPDATES["validate:free-text-normalization"]
        == "python3 ./tools/analysis/validate_free_text_normalization.py",
        "root_script_updates.py is missing validate:free-text-normalization.",
    )
    ensure(
        "pnpm validate:free-text-normalization" in ROOT_SCRIPT_UPDATES["bootstrap"]
        and "pnpm validate:free-text-normalization" in ROOT_SCRIPT_UPDATES["check"],
        "Root script update strings do not include validate:free-text-normalization.",
    )

    ensure(
        'export * from "./normalized-submission";' in domain_index_text,
        "Domain package index must export normalized-submission.",
    )
    for token in [
        "createNormalizedSubmissionService",
        "NormalizedSubmissionDocument",
        "buildNormalizedSubmissionDedupeFingerprint",
        "GAP_RESOLVED_NORMALIZED_CONTRACT_PHASE1_V1",
        "NARRATIVE_SOURCE_FREE_TEXT",
        "REQUEST_TYPE_MAPPING_RESULTS_V1",
    ]:
        ensure(token in domain_runtime_text, f"normalized-submission.ts is missing {token}.")

    ensure(
        "createNormalizedSubmissionService" in validation_text
        and "normalizedSubmissionCandidate" in validation_text,
        "submission-envelope-validation.ts must use the shared normalization service.",
    )
    ensure(
        "identityContext" in promotion_text
        and "contactAuthorityPolicyRef" in promotion_text,
        "SubmissionSnapshotFreeze must capture the normalization authority inputs.",
    )
    for token in [
        "createNormalizedSubmissionApplication",
        "normalizeAndPersist",
    ]:
        ensure(token in command_api_text, f"normalized-submission command seam is missing {token}.")

    for token in [
        "createNormalizedSubmissionService",
        "normalizedSubmission",
        "emitIntakeNormalized",
        "PHASE1_NORMALIZED_SUBMISSION_V1",
    ]:
        ensure(token in intake_submit_text, f"intake-submit.ts is missing {token}.")

    for token in [
        "creates one deterministic canonical normalized submission",
        "keeps dedupe fingerprints stable",
        "request_field",
        "severityClueCodes",
    ]:
        ensure(token in domain_test_text, f"normalized-submission tests lost {token}.")

    ensure(
        "NormalizedSubmissionDocument.create" in public_api_test_text
        and "createNormalizedSubmissionStore" in public_api_test_text,
        "Public API test must assert normalized-submission exports.",
    )
    for token in [
        "createNormalizedSubmissionApplication",
        "normalizeAndPersist",
        "queryTypeCode",
    ]:
        ensure(token in command_api_test_text, f"Command API normalized-submission test lost {token}.")

    ensure(contract["taskId"] == "par_149", "NormalizedSubmission contract must declare taskId par_149.")
    ensure(
        contract["contractId"] == "PHASE1_NORMALIZED_SUBMISSION_V1",
        "NormalizedSubmission contract ID drifted.",
    )
    ensure(
        contract["properties"]["normalizationVersionRef"]["const"] == "PHASE1_NORMALIZED_SUBMISSION_V1",
        "Normalization version drifted in the machine-readable contract.",
    )
    ensure(
        contract["properties"]["questionDefinitionContractRef"]["const"] == "QDC_140_PHASE1_V1",
        "Question-definition contract drifted in the machine-readable contract.",
    )

    required_reason_codes = {
        "GAP_RESOLVED_NORMALIZED_CONTRACT_PHASE1_V1",
        "GAP_RESOLVED_FREE_TEXT_RULES_PHASE1_V1",
        "GAP_RESOLVED_DEDUPE_FINGERPRINT_PHASE1_V1",
        "NARRATIVE_SOURCE_FREE_TEXT",
        "NARRATIVE_SOURCE_REQUEST_FIELD",
        "REQUEST_TYPE_MAPPING_SYMPTOMS_V1",
        "REQUEST_TYPE_MAPPING_MEDS_V1",
        "REQUEST_TYPE_MAPPING_ADMIN_V1",
        "REQUEST_TYPE_MAPPING_RESULTS_V1",
    }
    catalog_codes = {entry["reasonCode"] for entry in reason_catalog["reasonCodes"]}
    ensure(
        required_reason_codes.issubset(catalog_codes),
        "Reason-code catalog is missing one or more required par_149 codes.",
    )

    ensure(matrix_rows, "149_request_type_normalization_matrix.csv must contain rows.")
    ensure(
        len(matrix_rows) == len(question_defs["questionDefinitions"]),
        "Normalization matrix row count must match the pinned question-definition count.",
    )
    matrix_keys = {(row["request_type"], row["question_key"]) for row in matrix_rows}
    expected_keys = {
        (row["requestType"], row["questionKey"]) for row in question_defs["questionDefinitions"]
    }
    ensure(matrix_keys == expected_keys, "Normalization matrix drifted from seq_140 question definitions.")

    for token in [
        "NormalizedSubmission",
        "EvidenceSnapshot",
        "freeTextNarrative",
        "dedupe",
        "normalizationTarget",
        "summaryRenderer",
    ]:
        ensure(token in docs_text, f"par_149 docs are missing {token}.")

    print("validate_free_text_normalization: ok")


if __name__ == "__main__":
    main()
