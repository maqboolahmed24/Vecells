#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]


def read_json(path: Path):
    return json.loads(path.read_text())


def ensure(condition: bool, message: str) -> None:
    if not condition:
        raise SystemExit(message)


def main() -> None:
    contract_path = ROOT / "data" / "contracts" / "146_attachment_public_contract.json"
    reasons_path = ROOT / "data" / "analysis" / "146_attachment_reason_codes.json"
    matrix_path = ROOT / "data" / "analysis" / "146_attachment_state_matrix.csv"
    design_doc_path = ROOT / "docs" / "architecture" / "146_attachment_upload_and_quarantine_design.md"
    artifact_doc_path = ROOT / "docs" / "architecture" / "146_attachment_artifact_presentation_contract.md"
    migration_path = ROOT / "services" / "command-api" / "migrations" / "083_phase1_attachment_pipeline.sql"
    runtime_path = ROOT / "packages" / "domains" / "intake_request" / "src" / "attachment-pipeline.ts"
    app_path = ROOT / "services" / "command-api" / "src" / "intake-attachment.ts"

    for path in [
        contract_path,
        reasons_path,
        matrix_path,
        design_doc_path,
        artifact_doc_path,
        migration_path,
        runtime_path,
        app_path,
    ]:
        ensure(path.exists(), f"Missing required par_146 artifact: {path}")

    contract = read_json(contract_path)
    ensure(contract["taskId"] == "par_146", "Attachment public contract must declare taskId par_146.")
    ensure(
        contract["artifactPresentation"]["rawStorageUrlsForbidden"] is True,
        "Attachment public contract must forbid raw storage URLs.",
    )
    schema_names = {row["name"] for row in contract["publicSchemas"]}
    ensure(
        schema_names == {
            "AttachmentUploadSession",
            "AttachmentScanSettlement",
            "AttachmentDocumentReferenceLink",
        },
        "Attachment public contract must publish the three required public schemas.",
    )
    lifecycle_states = contract["lifecycleStates"]
    for required_state in [
        "upload_pending",
        "uploaded_unverified",
        "scanning",
        "promoted",
        "quarantined",
        "scan_failed_retryable",
        "removed",
        "replaced",
    ]:
        ensure(
            required_state in lifecycle_states,
            f"Attachment public contract is missing lifecycle state {required_state}.",
        )

    reasons = read_json(reasons_path)["reasonCodes"]
    reason_codes = {row["reasonCode"] for row in reasons}
    for required_reason in [
        "ATTACH_REASON_MALWARE_DETECTED",
        "ATTACH_REASON_INTEGRITY_FAILURE",
        "ATTACH_REASON_SCAN_TIMEOUT",
        "ATTACH_REASON_PREVIEW_GENERATION_FAILED",
        "ATTACH_REASON_REPLACED_SUPERSEDED",
    ]:
        ensure(
            required_reason in reason_codes,
            f"Attachment reason-code catalog is missing {required_reason}.",
        )

    with matrix_path.open("r", newline="") as handle:
        rows = list(csv.DictReader(handle))
    ensure(rows, "Attachment state matrix must contain rows.")
    promoted_rows = [row for row in rows if row["lifecycle_state"] == "promoted"]
    ensure(promoted_rows, "Attachment state matrix must contain promoted rows.")
    ensure(
        any(row["classification_outcome"] == "accepted_safe" for row in promoted_rows),
        "Attachment state matrix must cover accepted_safe promoted posture.",
    )
    ensure(
        any(row["classification_outcome"] == "quarantined_malware" for row in rows),
        "Attachment state matrix must cover quarantined_malware posture.",
    )

    design_doc = design_doc_path.read_text()
    artifact_doc = artifact_doc_path.read_text()
    ensure(
        "DocumentReference" in design_doc and "quarantine" in design_doc.lower(),
        "Attachment design doc must describe quarantine and DocumentReference linkage.",
    )
    ensure(
        "raw storage urls" in artifact_doc.lower() or "raw storage url" in artifact_doc.lower(),
        "Artifact presentation doc must state that raw storage URLs are forbidden.",
    )

    migration_text = migration_path.read_text()
    for required_table in [
        "phase1_attachment_records",
        "phase1_attachment_upload_sessions",
        "phase1_attachment_scan_attempts",
        "phase1_attachment_document_reference_links",
        "phase1_attachment_read_grants",
    ]:
        ensure(
            required_table in migration_text,
            f"Attachment migration must create {required_table}.",
        )

    runtime_text = runtime_path.read_text()
    for required_symbol in [
        "createPhase1AttachmentPipelineService",
        "createArtifactPresentation",
        "buildSubmissionAttachmentStates",
        "AttachmentDocumentReferenceLink",
    ]:
        ensure(
            required_symbol in runtime_text,
            f"Attachment runtime is missing required symbol {required_symbol}.",
        )

    app_text = app_path.read_text()
    ensure(
        "createSubmissionEnvelopeValidationApplication" in app_text
        and "attachmentStateResolver" in app_text,
        "Command API attachment seam must wire the live validation resolver.",
    )

    print("validate_attachment_pipeline: ok")


if __name__ == "__main__":
    main()
