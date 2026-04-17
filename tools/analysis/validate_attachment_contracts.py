#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
DATA_CONTRACTS_DIR = ROOT / "data" / "contracts"
DATA_ANALYSIS_DIR = ROOT / "data" / "analysis"
DOCS_ARCHITECTURE_DIR = ROOT / "docs" / "architecture"
DOCS_SECURITY_DIR = ROOT / "docs" / "security"
DOCS_FRONTEND_DIR = ROOT / "docs" / "frontend"
TOOLS_ANALYSIS_DIR = ROOT / "tools" / "analysis"
TESTS_PLAYWRIGHT_DIR = ROOT / "tests" / "playwright"

ACCEPTANCE_POLICY_PATH = DATA_CONTRACTS_DIR / "141_attachment_acceptance_policy.json"
SCAN_SCHEMA_PATH = DATA_CONTRACTS_DIR / "141_attachment_scan_and_quarantine.schema.json"
PROJECTION_MODES_PATH = DATA_CONTRACTS_DIR / "141_attachment_projection_and_artifact_modes.json"
TEST_MATRIX_PATH = DATA_ANALYSIS_DIR / "141_attachment_test_matrix.csv"
CLASSIFICATION_MATRIX_PATH = DATA_ANALYSIS_DIR / "141_attachment_classification_matrix.csv"
ARCHITECTURE_DOC_PATH = DOCS_ARCHITECTURE_DIR / "141_attachment_acceptance_and_quarantine_contracts.md"
SECURITY_DOC_PATH = DOCS_SECURITY_DIR / "141_attachment_acceptance_policy.md"
FRONTEND_DOC_PATH = DOCS_FRONTEND_DIR / "141_attachment_upload_experience_spec.md"
LAB_HTML_PATH = DOCS_FRONTEND_DIR / "141_attachment_evidence_lab.html"
PACKAGE_JSON_PATH = ROOT / "package.json"
ROOT_SCRIPT_UPDATES_PATH = TOOLS_ANALYSIS_DIR / "root_script_updates.py"
PLAYWRIGHT_PACKAGE_JSON_PATH = TESTS_PLAYWRIGHT_DIR / "package.json"
PLAYWRIGHT_SPEC_PATH = TESTS_PLAYWRIGHT_DIR / "141_attachment_upload_and_quarantine.spec.js"
BUILD_SCRIPT_PATH = TOOLS_ANALYSIS_DIR / "build_attachment_contracts.py"

REQUIRED_OUTCOMES = {
    "accepted_safe",
    "quarantined_malware",
    "quarantined_integrity_failure",
    "quarantined_unsupported_type",
    "quarantined_unreadable",
    "retryable_transfer_failure",
    "preview_unavailable_but_file_kept",
}
REQUIRED_ACCEPTANCE_FIELDS = {
    "originalFilename",
    "contentType",
    "byteSize",
    "checksumSha256",
    "scanState",
    "quarantineObjectKey",
    "durableObjectKey",
    "thumbnailKey",
    "draftPublicId",
    "linkedRequestPublicId",
    "documentReferenceRef",
}
REQUIRED_HTML_MARKERS = [
    'data-testid="attachment-evidence-lab"',
    'data-testid="attachment-shell-frame"',
    'data-testid="current-step-anchor"',
    'data-testid="drop-zone"',
    'data-testid="file-picker-trigger"',
    'data-testid="camera-capture-trigger"',
    'data-testid="attachment-card-grid"',
    'data-testid="upload-live-region"',
    'data-testid="scan-state-ladder"',
    'data-testid="scan-state-table"',
    'data-testid="artifact-mode-visuals"',
    'data-testid="artifact-mode-matrix"',
    'data-testid="duplicate-notice"',
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
        BUILD_SCRIPT_PATH,
        ACCEPTANCE_POLICY_PATH,
        SCAN_SCHEMA_PATH,
        PROJECTION_MODES_PATH,
        TEST_MATRIX_PATH,
        CLASSIFICATION_MATRIX_PATH,
        ARCHITECTURE_DOC_PATH,
        SECURITY_DOC_PATH,
        FRONTEND_DOC_PATH,
        LAB_HTML_PATH,
        PACKAGE_JSON_PATH,
        ROOT_SCRIPT_UPDATES_PATH,
        PLAYWRIGHT_PACKAGE_JSON_PATH,
        PLAYWRIGHT_SPEC_PATH,
    ]
    for path in required_paths:
        ensure(path.exists(), f"Missing required seq_141 artifact: {path}")

    acceptance_policy = read_json(ACCEPTANCE_POLICY_PATH)
    scan_schema = read_json(SCAN_SCHEMA_PATH)
    projection_modes = read_json(PROJECTION_MODES_PATH)
    test_rows = read_csv_rows(TEST_MATRIX_PATH)
    classification_rows = read_csv_rows(CLASSIFICATION_MATRIX_PATH)
    package_json = read_json(PACKAGE_JSON_PATH)
    playwright_package_json = read_json(PLAYWRIGHT_PACKAGE_JSON_PATH)
    root_script_updates = ROOT_SCRIPT_UPDATES_PATH.read_text()
    docs_text = "\n".join(
        path.read_text()
        for path in [ARCHITECTURE_DOC_PATH, SECURITY_DOC_PATH, FRONTEND_DOC_PATH]
    )
    lab_html = LAB_HTML_PATH.read_text()
    spec_text = PLAYWRIGHT_SPEC_PATH.read_text()

    ensure(acceptance_policy["taskId"] == "seq_141", "Attachment policy taskId drifted.")
    ensure(acceptance_policy["visualMode"] == "Attachment_Evidence_Rail", "Attachment visual mode drifted.")
    ensure(
        acceptance_policy["quarantineFirstUploadAlgorithm"]
        == [
            "initiate upload",
            "return signed target + attachmentPublicId",
            "direct browser upload to quarantine store",
            "scan MIME/extension/size/malware/integrity",
            "promote safe files to durable storage",
            "create Attachment record + DocumentReference",
            "update draft projection",
            "emit intake.attachment.added",
        ],
        "The frozen quarantine-first upload algorithm drifted.",
    )

    outcomes = {row["outcome"] for row in acceptance_policy["classificationOutcomes"]}
    ensure(REQUIRED_OUTCOMES.issubset(outcomes), "Attachment classification outcomes are incomplete.")

    duplicate_policy = acceptance_policy["duplicateUploadPolicy"]
    ensure(
        duplicate_policy["sameLineageBehavior"] == "reuse_existing_attachment_public_id_and_document_reference",
        "Duplicate upload idempotency is no longer frozen to lineage replay.",
    )
    ensure(
        duplicate_policy["duplicateEventBehavior"] == "no_second_intake.attachment.added_event",
        "Duplicate upload event law drifted.",
    )

    artifact_contract = acceptance_policy["artifactPresentationContract"]
    ensure(artifact_contract["rawStorageUrlsForbidden"] is True, "Artifact contract no longer forbids raw storage URLs.")
    ensure(
        acceptance_policy["outboundNavigationGrantPolicy"]["rawStorageUrlsForbidden"] is True,
        "Outbound navigation grant policy no longer forbids raw storage URLs.",
    )

    ensure(
        REQUIRED_ACCEPTANCE_FIELDS.issubset(set(scan_schema["properties"])),
        "Scan and quarantine schema lost one or more mandatory contract fields.",
    )
    ensure(
        set(scan_schema["required"]).issuperset(REQUIRED_ACCEPTANCE_FIELDS),
        "Scan and quarantine schema no longer requires the Phase 1 attachment fields.",
    )
    ensure(
        scan_schema["properties"]["documentReferenceRef"]["type"] == ["string", "null"],
        "DocumentReference linkage can no longer represent safe and quarantined rows.",
    )

    projection_outcomes = {
        outcome
        for row in projection_modes["artifactModes"]
        for outcome in row["appliesToOutcomes"]
    }
    ensure(
        {"accepted_safe", "preview_unavailable_but_file_kept", "retryable_transfer_failure"}.issubset(projection_outcomes),
        "Projection and artifact modes lost one or more key attachment postures.",
    )
    ensure(
        projection_modes["sameShellContinuityLaw"]["localCardErrorsMayResetShell"] is False,
        "Local card errors are incorrectly allowed to reset shell continuity.",
    )
    ensure(
        projection_modes["sameShellContinuityLaw"]["rawStorageUrlsForbidden"] is True,
        "Projection continuity law no longer forbids raw storage URLs.",
    )

    classification_outcomes = {row["classificationOutcome"] for row in classification_rows}
    ensure(REQUIRED_OUTCOMES.issubset(classification_outcomes), "Classification matrix drifted from required outcomes.")
    unreadable_row = next(
        row for row in classification_rows if row["classificationOutcome"] == "quarantined_unreadable"
    )
    ensure(
        unreadable_row["safetyMeaningState"] == "unresolved_fail_closed_review",
        "Unreadable attachments no longer fail closed to review.",
    )
    ensure(
        any(row["duplicateDisposition"] == "idempotent_replay" for row in classification_rows),
        "Classification matrix no longer proves duplicate upload idempotency.",
    )

    test_case_ids = {row["testCaseId"] for row in test_rows}
    for required_case in [
        "T141_FILE_PICKER_SAFE_PDF",
        "T141_DRAG_DROP_RETRYABLE",
        "T141_MOBILE_CAPTURE_HEIC",
        "T141_DUPLICATE_IDEMPOTENT_REPLAY",
        "T141_RAW_URL_FORBIDDEN",
        "T141_REDUCED_MOTION_EQUIVALENCE",
    ]:
        ensure(required_case in test_case_ids, f"Attachment test matrix is missing {required_case}.")

    for token in [
        "ArtifactPresentationContract",
        "OutboundNavigationGrant",
        "intake.attachment.quarantined",
        "fail_closed_review",
        "GAP_RESOLUTION_141_ATTACHMENT_IS_A_GOVERNED_SUBSYSTEM",
        "ASSUMPTION_141_QUARANTINE_STORAGE_IS_PRIVATE_ONLY",
        "CONFLICT_141_PRODUCTION_SCANNERS_MAY_STRENGTHEN_BUT_NOT_RELAX",
        "RISK_141_DERIVATIVE_FAILURE_COULD_HIDE_CLINICAL_CONTEXT",
    ]:
        ensure(token in docs_text, f"Docs lost required token {token}.")

    for marker in REQUIRED_HTML_MARKERS:
        ensure(marker in lab_html, f"Attachment evidence lab is missing marker {marker}.")
    for fragment in [
        "max-width: 1320px",
        "grid-template-columns: minmax(0, 760px) minmax(280px, 1fr);",
        "min-height: 168px",
        'capture="environment"',
    ]:
        ensure(fragment in lab_html, f"Attachment evidence lab lost required layout fragment {fragment}.")
    ensure(
        "http://s3" not in lab_html
        and "https://s3" not in lab_html
        and "blob:" not in lab_html
        and "rawObjectUrl" not in lab_html,
        "Attachment evidence lab appears to expose a raw object URL.",
    )

    ensure(
        package_json["scripts"].get("validate:attachment-contracts")
        == "python3 ./tools/analysis/validate_attachment_contracts.py",
        "Root package lost validate:attachment-contracts.",
    )
    ensure(
        "python3 ./tools/analysis/build_attachment_contracts.py" in package_json["scripts"]["codegen"],
        "Root package codegen is missing build_attachment_contracts.py.",
    )
    ensure(
        "pnpm validate:attachment-contracts" in package_json["scripts"]["bootstrap"]
        and "pnpm validate:attachment-contracts" in package_json["scripts"]["check"],
        "Root package bootstrap/check lost validate:attachment-contracts.",
    )

    ensure(
        '"validate:attachment-contracts": "python3 ./tools/analysis/validate_attachment_contracts.py"'
        in root_script_updates,
        "root_script_updates lost validate:attachment-contracts.",
    )
    ensure(
        "python3 ./tools/analysis/build_attachment_contracts.py" in root_script_updates,
        "root_script_updates codegen lost build_attachment_contracts.py.",
    )
    ensure(
        "pnpm validate:attachment-contracts" in root_script_updates,
        "root_script_updates bootstrap/check lost validate:attachment-contracts.",
    )

    for script_name in ["build", "lint", "test", "typecheck", "e2e"]:
        ensure(
            "141_attachment_upload_and_quarantine.spec.js"
            in playwright_package_json["scripts"][script_name],
            f"Playwright package lost seq_141 spec from {script_name}.",
        )

    for coverage_token in [
        "drag/drop and file-picker upload flows",
        "mobile capture affordance behavior",
        "retry/remove/replace interactions",
        "accessibility announcements for progress and failure",
        "reduced-motion equivalence",
    ]:
        ensure(coverage_token in spec_text, f"Playwright spec lost coverage note {coverage_token}.")

    print("seq_141 attachment contracts validation passed")


if __name__ == "__main__":
    main()
