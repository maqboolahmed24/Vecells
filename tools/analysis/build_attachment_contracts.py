#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[2]
DATA_CONTRACTS_DIR = ROOT / "data" / "contracts"
DATA_ANALYSIS_DIR = ROOT / "data" / "analysis"
DATA_INTEGRATION_DIR = ROOT / "data" / "integration"
DOCS_ARCHITECTURE_DIR = ROOT / "docs" / "architecture"
DOCS_SECURITY_DIR = ROOT / "docs" / "security"
DOCS_FRONTEND_DIR = ROOT / "docs" / "frontend"

PHASE1_DRAFT_SCHEMA_PATH = DATA_CONTRACTS_DIR / "139_intake_draft_view.schema.json"
PHASE1_EVENT_CATALOG_PATH = DATA_CONTRACTS_DIR / "139_intake_event_catalog.json"
REQUEST_TYPE_TAXONOMY_PATH = DATA_CONTRACTS_DIR / "140_request_type_taxonomy.json"
ARTIFACT_DOC_PATH = DOCS_ARCHITECTURE_DIR / "109_artifact_presentation_shell.md"
ADAPTER_VALIDATION_RESULTS_PATH = DATA_INTEGRATION_DIR / "adapter_validation_results.json"

ARCHITECTURE_DOC_PATH = DOCS_ARCHITECTURE_DIR / "141_attachment_acceptance_and_quarantine_contracts.md"
SECURITY_DOC_PATH = DOCS_SECURITY_DIR / "141_attachment_acceptance_policy.md"
FRONTEND_DOC_PATH = DOCS_FRONTEND_DIR / "141_attachment_upload_experience_spec.md"
LAB_HTML_PATH = DOCS_FRONTEND_DIR / "141_attachment_evidence_lab.html"
ACCEPTANCE_POLICY_PATH = DATA_CONTRACTS_DIR / "141_attachment_acceptance_policy.json"
SCAN_SCHEMA_PATH = DATA_CONTRACTS_DIR / "141_attachment_scan_and_quarantine.schema.json"
PROJECTION_MODES_PATH = DATA_CONTRACTS_DIR / "141_attachment_projection_and_artifact_modes.json"
TEST_MATRIX_PATH = DATA_ANALYSIS_DIR / "141_attachment_test_matrix.csv"
CLASSIFICATION_MATRIX_PATH = DATA_ANALYSIS_DIR / "141_attachment_classification_matrix.csv"

TASK_ID = "seq_141"
VISUAL_MODE = "Attachment_Evidence_Rail"
CAPTURED_ON = "2026-04-14"
ACCEPTANCE_POLICY_ID = "AAP_141_PHASE1_ATTACHMENT_POLICY_V1"
SCAN_SCHEMA_ID = "ASQ_141_ATTACHMENT_SCAN_AND_QUARANTINE_V1"
PROJECTION_MODES_ID = "APM_141_ATTACHMENT_PROJECTION_AND_ARTIFACT_MODES_V1"
ARTIFACT_PRESENTATION_CONTRACT_ID = "APC_141_INTAKE_ATTACHMENT_V1"
OUTBOUND_NAVIGATION_GRANT_POLICY_ID = "ONG_141_INTAKE_ATTACHMENT_HANDOFF_V1"
MAX_ACCEPT_BYTES = 15 * 1024 * 1024
MAX_INLINE_BYTES = 8 * 1024 * 1024

SOURCE_PRECEDENCE = [
    "prompt/141.md",
    "prompt/shared_operating_contract_136_to_145.md",
    "prompt/AGENT.md",
    "prompt/checklist.md",
    "blueprint/phase-1-the-red-flag-gate.md#1D. Attachment ingestion pipeline",
    "blueprint/phase-1-the-red-flag-gate.md#1E. Submit normalization and synchronous safety engine",
    "blueprint/phase-0-the-foundation-protocol.md#ArtifactPresentationContract",
    "blueprint/phase-0-the-foundation-protocol.md#ArtifactModeTruthProjection",
    "blueprint/phase-0-the-foundation-protocol.md#OutboundNavigationGrant",
    "blueprint/platform-frontend-blueprint.md#1.19A ArtifactStage",
    "blueprint/forensic-audit-findings.md#Finding 61 - The event catalogue lacked attachment-quarantine events",
    "docs/architecture/109_artifact_presentation_shell.md",
    "docs/integrations/129_adapter_simulator_validation.md",
    "docs/architecture/139_web_intake_journey_contract.md",
    "docs/api/139_phase1_submission_schema_lock.md",
    "docs/architecture/140_request_type_taxonomy.md",
    "data/contracts/139_intake_draft_view.schema.json",
    "data/contracts/139_intake_event_catalog.json",
    "data/contracts/140_request_type_taxonomy.json",
    "data/integration/adapter_validation_results.json",
]

UPSTREAM_INPUTS = [
    "data/contracts/139_intake_draft_view.schema.json",
    "data/contracts/139_intake_event_catalog.json",
    "data/contracts/140_request_type_taxonomy.json",
    "docs/architecture/109_artifact_presentation_shell.md",
    "data/integration/adapter_validation_results.json",
]

GAP_RESOLUTIONS = [
    {
        "gapId": "GAP_RESOLUTION_141_ATTACHMENT_IS_A_GOVERNED_SUBSYSTEM",
        "summary": "Attachment upload now has a frozen acceptance, quarantine, dedupe, and artifact-mode contract instead of being treated as a generic form helper.",
    },
    {
        "gapId": "GAP_RESOLUTION_141_PREVIEW_REQUIRES_CONTRACT_AND_GRANT",
        "summary": "Preview, open, download, and browser handoff are bound to ArtifactPresentationContract and OutboundNavigationGrant; raw storage URLs are forbidden.",
    },
    {
        "gapId": "GAP_RESOLUTION_141_TRANSFER_FAILURE_IS_NOT_SAFETY_SUCCESS",
        "summary": "Retryable transfer failure remains a local recovery state and never masquerades as accepted clinical evidence or silent nonclinical success.",
    },
    {
        "gapId": "GAP_RESOLUTION_141_DUPLICATE_UPLOADS_REUSE_THE_SAME_EVIDENCE",
        "summary": "Exact duplicate uploads within the same draft lineage replay to the same attachment card and durable evidence record instead of creating silent duplicates.",
    },
    {
        "gapId": "GAP_RESOLUTION_141_QUARANTINE_STAYS_VISIBLE_IN_THE_SAME_SHELL",
        "summary": "Quarantined or preview-degraded attachments remain visible with local replace or remove actions so the intake shell keeps continuity and the user sees the governing posture.",
    },
]

ASSUMPTIONS = [
    {
        "assumptionId": "ASSUMPTION_141_QUARANTINE_STORAGE_IS_PRIVATE_ONLY",
        "summary": "Quarantine object storage is private, non-browsable, and never exposed directly to the browser or embedded host.",
    },
    {
        "assumptionId": "ASSUMPTION_141_DERIVATIVE_GENERATION_IS_NON_AUTHORITATIVE",
        "summary": "Image preview derivatives improve the inline experience, but derivative success never substitutes for the authoritative source file or scan state.",
    },
]

CONFLICTS = [
    {
        "conflictId": "CONFLICT_141_PRODUCTION_SCANNERS_MAY_STRENGTHEN_BUT_NOT_RELAX",
        "summary": "Later production scanners may add stronger threat, metadata, or integrity detection, but they may not weaken the fail-closed acceptance and quarantine outcomes frozen here.",
    }
]

RISKS = [
    {
        "riskId": "RISK_141_DERIVATIVE_FAILURE_COULD_HIDE_CLINICAL_CONTEXT",
        "summary": "If derivative generation fails, clinically relevant evidence could disappear from the patient journey unless the card stays visible with explicit placeholder and replacement guidance.",
        "mitigation": "Route derivative failure to preview_unavailable_but_file_kept or fail_closed_review, preserve the card in the same shell, and keep governed open or download only when the current contract tuple permits it.",
    },
    {
        "riskId": "RISK_141_SCANNER_TIMEOUT_COULD_BE_MISTAKEN_FOR_ACCEPTANCE",
        "summary": "Scanner timeout or unreadable output could be mistaken for an ordinary upload error and allow unsafe evidence to travel onward.",
        "mitigation": "Distinctly separate retryable transfer failure from unreadable, integrity-failed, and quarantined states, and route unresolved safety meaning into fail_closed_review.",
    },
]

UPLOAD_ALGORITHM = [
    "initiate upload",
    "return signed target + attachmentPublicId",
    "direct browser upload to quarantine store",
    "scan MIME/extension/size/malware/integrity",
    "promote safe files to durable storage",
    "create Attachment record + DocumentReference",
    "update draft projection",
    "emit intake.attachment.added",
]

ACCEPTANCE_RULES = [
    {
        "ruleRef": "ATTACH_RULE_IMAGE_JPEG_PNG",
        "label": "Quiet inline image evidence",
        "allowedExtensions": [".jpg", ".jpeg", ".png"],
        "allowedMimeFamilies": ["image/jpeg", "image/png"],
        "maxBytes": MAX_ACCEPT_BYTES,
        "maxInlinePreviewBytes": MAX_INLINE_BYTES,
        "previewEligibility": "governed_preview_if_clean_and_within_inline_budget",
        "directCameraCaptureSupport": True,
        "duplicateIdempotencyPolicyRef": "DUP_141_CHECKSUM_LINEAGE_REPLAY",
    },
    {
        "ruleRef": "ATTACH_RULE_IMAGE_HEIC",
        "label": "Mobile HEIC capture with derivative fallback",
        "allowedExtensions": [".heic"],
        "allowedMimeFamilies": ["image/heic"],
        "maxBytes": MAX_ACCEPT_BYTES,
        "maxInlinePreviewBytes": MAX_INLINE_BYTES,
        "previewEligibility": "preview_derivative_required_then_governed_preview_or_placeholder",
        "directCameraCaptureSupport": True,
        "duplicateIdempotencyPolicyRef": "DUP_141_CHECKSUM_LINEAGE_REPLAY",
    },
    {
        "ruleRef": "ATTACH_RULE_PDF",
        "label": "Structured PDF evidence",
        "allowedExtensions": [".pdf"],
        "allowedMimeFamilies": ["application/pdf"],
        "maxBytes": MAX_ACCEPT_BYTES,
        "maxInlinePreviewBytes": MAX_INLINE_BYTES,
        "previewEligibility": "governed_preview_if_clean_and_within_inline_budget",
        "directCameraCaptureSupport": False,
        "duplicateIdempotencyPolicyRef": "DUP_141_CHECKSUM_LINEAGE_REPLAY",
    },
]

CLASSIFICATION_OUTCOMES = [
    {
        "outcome": "accepted_safe",
        "outcomeRef": "ATTACH_OUTCOME_ACCEPTED_SAFE",
        "terminalScanState": "clean_promoted",
        "quarantineState": "not_quarantined",
        "artifactStageMode": "governed_preview",
        "currentSafeMode": "governed_preview",
        "documentReferenceState": "created",
        "emittedEventNames": ["intake.attachment.added"],
        "safetyMeaningState": "preserved_supporting_evidence",
        "downstreamDisposition": "routine_submit_allowed",
        "patientVisiblePosture": "safe_preview_ready",
    },
    {
        "outcome": "preview_unavailable_but_file_kept",
        "outcomeRef": "ATTACH_OUTCOME_PREVIEW_UNAVAILABLE_BUT_FILE_KEPT",
        "terminalScanState": "clean_promoted_preview_deferred",
        "quarantineState": "not_quarantined",
        "artifactStageMode": "placeholder_only",
        "currentSafeMode": "placeholder_only",
        "documentReferenceState": "created",
        "emittedEventNames": ["intake.attachment.added"],
        "safetyMeaningState": "preserved_supporting_evidence",
        "downstreamDisposition": "routine_submit_allowed",
        "patientVisiblePosture": "safe_placeholder_same_shell",
    },
    {
        "outcome": "retryable_transfer_failure",
        "outcomeRef": "ATTACH_OUTCOME_RETRYABLE_TRANSFER_FAILURE",
        "terminalScanState": "transfer_retry_required",
        "quarantineState": "not_started",
        "artifactStageMode": "recovery_only",
        "currentSafeMode": "recovery_only",
        "documentReferenceState": "not_created",
        "emittedEventNames": [],
        "safetyMeaningState": "not_yet_captured",
        "downstreamDisposition": "retry_before_submit",
        "patientVisiblePosture": "local_card_recovery",
    },
    {
        "outcome": "quarantined_malware",
        "outcomeRef": "ATTACH_OUTCOME_QUARANTINED_MALWARE",
        "terminalScanState": "quarantined_malware",
        "quarantineState": "quarantined",
        "artifactStageMode": "recovery_only",
        "currentSafeMode": "recovery_only",
        "documentReferenceState": "not_created",
        "emittedEventNames": ["intake.attachment.quarantined"],
        "safetyMeaningState": "unresolved_fail_closed_review",
        "downstreamDisposition": "replace_or_remove_then_review",
        "patientVisiblePosture": "quarantine_visible_same_shell",
    },
    {
        "outcome": "quarantined_integrity_failure",
        "outcomeRef": "ATTACH_OUTCOME_QUARANTINED_INTEGRITY_FAILURE",
        "terminalScanState": "quarantined_integrity_failure",
        "quarantineState": "quarantined",
        "artifactStageMode": "recovery_only",
        "currentSafeMode": "recovery_only",
        "documentReferenceState": "not_created",
        "emittedEventNames": ["intake.attachment.quarantined"],
        "safetyMeaningState": "unresolved_fail_closed_review",
        "downstreamDisposition": "replace_or_remove_then_review",
        "patientVisiblePosture": "quarantine_visible_same_shell",
    },
    {
        "outcome": "quarantined_unsupported_type",
        "outcomeRef": "ATTACH_OUTCOME_QUARANTINED_UNSUPPORTED_TYPE",
        "terminalScanState": "quarantined_unsupported_type",
        "quarantineState": "quarantined",
        "artifactStageMode": "recovery_only",
        "currentSafeMode": "recovery_only",
        "documentReferenceState": "not_created",
        "emittedEventNames": ["intake.attachment.quarantined"],
        "safetyMeaningState": "unresolved_fail_closed_review",
        "downstreamDisposition": "replace_or_remove_then_review",
        "patientVisiblePosture": "quarantine_visible_same_shell",
    },
    {
        "outcome": "quarantined_unreadable",
        "outcomeRef": "ATTACH_OUTCOME_QUARANTINED_UNREADABLE",
        "terminalScanState": "quarantined_unreadable",
        "quarantineState": "quarantined",
        "artifactStageMode": "recovery_only",
        "currentSafeMode": "recovery_only",
        "documentReferenceState": "not_created",
        "emittedEventNames": ["intake.attachment.quarantined"],
        "safetyMeaningState": "unresolved_fail_closed_review",
        "downstreamDisposition": "replace_or_remove_then_review",
        "patientVisiblePosture": "quarantine_visible_same_shell",
    },
    {
        "outcome": "quarantined_size_exceeded",
        "outcomeRef": "ATTACH_OUTCOME_QUARANTINED_SIZE_EXCEEDED",
        "terminalScanState": "quarantined_size_exceeded",
        "quarantineState": "quarantined",
        "artifactStageMode": "recovery_only",
        "currentSafeMode": "recovery_only",
        "documentReferenceState": "not_created",
        "emittedEventNames": ["intake.attachment.quarantined"],
        "safetyMeaningState": "unresolved_fail_closed_review",
        "downstreamDisposition": "replace_or_remove_then_review",
        "patientVisiblePosture": "quarantine_visible_same_shell",
    },
]

SCAN_STATE_LADDER = [
    {
        "stateKey": "uploading_to_quarantine",
        "label": "Uploading to quarantine",
        "tone": "upload",
        "summary": "The browser is sending bytes to the private quarantine bucket. No durable evidence has been accepted yet.",
    },
    {
        "stateKey": "scan_pending",
        "label": "Scanning and checking integrity",
        "tone": "preview",
        "summary": "MIME, extension, size, malware, and integrity checks are running against the quarantined object.",
    },
    {
        "stateKey": "accepted_safe",
        "label": "Accepted and promoted",
        "tone": "safe",
        "summary": "The file is safe, promoted to durable storage, linked to the draft, and emitted as intake.attachment.added.",
    },
    {
        "stateKey": "preview_unavailable_but_file_kept",
        "label": "Kept without inline preview",
        "tone": "preview",
        "summary": "The source file is safe and durable, but inline preview stays quiet placeholder-only because the current mode tuple does not allow preview.",
    },
    {
        "stateKey": "retryable_transfer_failure",
        "label": "Retry local transfer",
        "tone": "retry",
        "summary": "The upload did not settle into quarantine. The card stays local and same-shell so retry can continue without losing the step anchor.",
    },
    {
        "stateKey": "quarantined_review",
        "label": "Quarantined and held",
        "tone": "quarantine",
        "summary": "Unsafe, unreadable, unsupported, or integrity-failed evidence stays quarantined, visible, and fail-closed to review or replacement.",
    },
]

ARTIFACT_MODES = [
    {
        "modeKey": "MODE_141_SCAN_PENDING_SUMMARY",
        "label": "Summary while scanning",
        "artifactStageMode": "structured_summary",
        "currentSafeMode": "structured_summary",
        "previewVisibility": "summary_only",
        "openAction": "forbidden",
        "downloadAction": "forbidden",
        "handoffAction": "forbidden",
        "sameShellContinuity": "Keep the current step anchor and card slot stable while upload or scan is pending.",
        "appliesToOutcomes": ["uploading_to_quarantine", "scan_pending"],
    },
    {
        "modeKey": "MODE_141_GOVERNED_PREVIEW",
        "label": "Governed preview",
        "artifactStageMode": "governed_preview",
        "currentSafeMode": "governed_preview",
        "previewVisibility": "governed_preview",
        "openAction": "grant_required",
        "downloadAction": "grant_required",
        "handoffAction": "grant_required",
        "sameShellContinuity": "Summary and return anchor remain primary while governed preview stays available.",
        "appliesToOutcomes": ["accepted_safe"],
    },
    {
        "modeKey": "MODE_141_PLACEHOLDER_ONLY",
        "label": "Quiet placeholder only",
        "artifactStageMode": "placeholder_only",
        "currentSafeMode": "placeholder_only",
        "previewVisibility": "summary_only",
        "openAction": "grant_required",
        "downloadAction": "grant_required",
        "handoffAction": "grant_required",
        "sameShellContinuity": "A quiet placeholder replaces preview without resetting the shell or step anchor.",
        "appliesToOutcomes": ["preview_unavailable_but_file_kept"],
    },
    {
        "modeKey": "MODE_141_RECOVERY_ONLY",
        "label": "Recovery only",
        "artifactStageMode": "recovery_only",
        "currentSafeMode": "recovery_only",
        "previewVisibility": "hidden",
        "openAction": "forbidden",
        "downloadAction": "forbidden",
        "handoffAction": "forbidden",
        "sameShellContinuity": "Replace, remove, and retry stay local to the card and keep the same shell continuity.",
        "appliesToOutcomes": [
            "retryable_transfer_failure",
            "quarantined_malware",
            "quarantined_integrity_failure",
            "quarantined_unsupported_type",
            "quarantined_unreadable",
            "quarantined_size_exceeded",
        ],
    },
]

CLASSIFICATION_ROWS = [
    {
        "scenarioId": "ATTACH_SCENARIO_SAFE_PDF",
        "inputSignature": "scan-safe.pdf",
        "acceptanceVerdict": "allowed",
        "classificationOutcome": "accepted_safe",
        "scanState": "clean_promoted",
        "emittedEventNames": "intake.attachment.added",
        "documentReferenceAction": "create_document_reference",
        "artifactStageMode": "governed_preview",
        "safetyMeaningState": "preserved_supporting_evidence",
        "downstreamDisposition": "routine_submit_allowed",
        "duplicateDisposition": "new_capture",
        "continuityPosture": "same_shell_safe",
        "notes": "Standard safe PDF creates durable storage, DocumentReference, and governed preview.",
    },
    {
        "scenarioId": "ATTACH_SCENARIO_HEIC_PLACEHOLDER",
        "inputSignature": "scan-no-preview.heic",
        "acceptanceVerdict": "allowed",
        "classificationOutcome": "preview_unavailable_but_file_kept",
        "scanState": "clean_promoted_preview_deferred",
        "emittedEventNames": "intake.attachment.added",
        "documentReferenceAction": "create_document_reference",
        "artifactStageMode": "placeholder_only",
        "safetyMeaningState": "preserved_supporting_evidence",
        "downstreamDisposition": "routine_submit_allowed",
        "duplicateDisposition": "new_capture",
        "continuityPosture": "same_shell_placeholder",
        "notes": "Derivative preview is unavailable, but the file is kept and remains governed by placeholder-only artifact law.",
    },
    {
        "scenarioId": "ATTACH_SCENARIO_TRANSFER_RETRY",
        "inputSignature": "retry-transfer.jpg",
        "acceptanceVerdict": "allowed",
        "classificationOutcome": "retryable_transfer_failure",
        "scanState": "transfer_retry_required",
        "emittedEventNames": "",
        "documentReferenceAction": "not_created",
        "artifactStageMode": "recovery_only",
        "safetyMeaningState": "not_yet_captured",
        "downstreamDisposition": "retry_before_submit",
        "duplicateDisposition": "not_applicable_until_quarantine_write",
        "continuityPosture": "same_shell_local_card_recovery",
        "notes": "Transport failure remains local and retryable; it is not a scanner verdict.",
    },
    {
        "scenarioId": "ATTACH_SCENARIO_MALWARE",
        "inputSignature": "malware-sample.jpg",
        "acceptanceVerdict": "allowed_pending_scan",
        "classificationOutcome": "quarantined_malware",
        "scanState": "quarantined_malware",
        "emittedEventNames": "intake.attachment.quarantined",
        "documentReferenceAction": "not_created",
        "artifactStageMode": "recovery_only",
        "safetyMeaningState": "unresolved_fail_closed_review",
        "downstreamDisposition": "replace_or_remove_then_review",
        "duplicateDisposition": "new_capture",
        "continuityPosture": "same_shell_quarantine",
        "notes": "Malware verdict stays visible and prevents the evidence from silently disappearing.",
    },
    {
        "scenarioId": "ATTACH_SCENARIO_INTEGRITY_FAILURE",
        "inputSignature": "integrity-failure.pdf",
        "acceptanceVerdict": "allowed_pending_scan",
        "classificationOutcome": "quarantined_integrity_failure",
        "scanState": "quarantined_integrity_failure",
        "emittedEventNames": "intake.attachment.quarantined",
        "documentReferenceAction": "not_created",
        "artifactStageMode": "recovery_only",
        "safetyMeaningState": "unresolved_fail_closed_review",
        "downstreamDisposition": "replace_or_remove_then_review",
        "duplicateDisposition": "new_capture",
        "continuityPosture": "same_shell_quarantine",
        "notes": "Checksum or integrity mismatch is fail-closed and not treated like an ordinary network error.",
    },
    {
        "scenarioId": "ATTACH_SCENARIO_UNSUPPORTED_TYPE",
        "inputSignature": "macro-sheet.xlsm",
        "acceptanceVerdict": "blocked_by_policy",
        "classificationOutcome": "quarantined_unsupported_type",
        "scanState": "quarantined_unsupported_type",
        "emittedEventNames": "intake.attachment.quarantined",
        "documentReferenceAction": "not_created",
        "artifactStageMode": "recovery_only",
        "safetyMeaningState": "unresolved_fail_closed_review",
        "downstreamDisposition": "replace_or_remove_then_review",
        "duplicateDisposition": "new_capture",
        "continuityPosture": "same_shell_quarantine",
        "notes": "Unsupported extensions or MIME mismatches stay explicit and bounded.",
    },
    {
        "scenarioId": "ATTACH_SCENARIO_UNREADABLE",
        "inputSignature": "scan-unreadable.pdf",
        "acceptanceVerdict": "allowed_pending_scan",
        "classificationOutcome": "quarantined_unreadable",
        "scanState": "quarantined_unreadable",
        "emittedEventNames": "intake.attachment.quarantined",
        "documentReferenceAction": "not_created",
        "artifactStageMode": "recovery_only",
        "safetyMeaningState": "unresolved_fail_closed_review",
        "downstreamDisposition": "replace_or_remove_then_review",
        "duplicateDisposition": "new_capture",
        "continuityPosture": "same_shell_quarantine",
        "notes": "Unreadable evidence preserves visible continuity and routes to fail-closed review rather than silent metadata downgrade.",
    },
    {
        "scenarioId": "ATTACH_SCENARIO_OVERSIZED",
        "inputSignature": "oversized-pack.pdf",
        "acceptanceVerdict": "blocked_by_max_size",
        "classificationOutcome": "quarantined_size_exceeded",
        "scanState": "quarantined_size_exceeded",
        "emittedEventNames": "intake.attachment.quarantined",
        "documentReferenceAction": "not_created",
        "artifactStageMode": "recovery_only",
        "safetyMeaningState": "unresolved_fail_closed_review",
        "downstreamDisposition": "replace_or_remove_then_review",
        "duplicateDisposition": "new_capture",
        "continuityPosture": "same_shell_quarantine",
        "notes": "Max-size policy is explicit and cannot collapse into accepted preview posture.",
    },
    {
        "scenarioId": "ATTACH_SCENARIO_DUPLICATE_REPLAY",
        "inputSignature": "scan-safe.pdf duplicate replay",
        "acceptanceVerdict": "allowed",
        "classificationOutcome": "accepted_safe",
        "scanState": "clean_promoted",
        "emittedEventNames": "intake.attachment.added",
        "documentReferenceAction": "reuse_existing_document_reference",
        "artifactStageMode": "governed_preview",
        "safetyMeaningState": "preserved_supporting_evidence",
        "downstreamDisposition": "routine_submit_allowed",
        "duplicateDisposition": "idempotent_replay",
        "continuityPosture": "same_shell_existing_card_focused",
        "notes": "Same checksum, size, and MIME under the same draft lineage replays to the existing card and no duplicate evidence row is created.",
    },
]

TEST_ROWS = [
    {
        "testCaseId": "T141_FILE_PICKER_SAFE_PDF",
        "surface": "browser",
        "category": "playwright",
        "scenario": "Choose a safe PDF with the file picker and settle to accepted_safe.",
        "requiredOutcome": "accepted_safe",
        "proof": "Card reaches governed preview posture, live region announces acceptance, and the current step anchor remains unchanged.",
    },
    {
        "testCaseId": "T141_DRAG_DROP_RETRYABLE",
        "surface": "browser",
        "category": "playwright",
        "scenario": "Drag and drop a file that triggers retryable_transfer_failure.",
        "requiredOutcome": "retryable_transfer_failure",
        "proof": "Retry control stays local to the card and does not reset the shell or current step anchor.",
    },
    {
        "testCaseId": "T141_RETRY_PATH_SETTLES_SAFE",
        "surface": "browser",
        "category": "playwright",
        "scenario": "Retry a transfer-failure card and settle the same card to accepted_safe.",
        "requiredOutcome": "accepted_safe",
        "proof": "The card id stays stable and the live region announces the retry result.",
    },
    {
        "testCaseId": "T141_REPLACE_TO_PREVIEW_PLACEHOLDER",
        "surface": "browser",
        "category": "playwright",
        "scenario": "Replace an accepted card with a clean HEIC that keeps the file but defers preview.",
        "requiredOutcome": "preview_unavailable_but_file_kept",
        "proof": "The card stays in place, preview remains bounded, and governed open or download actions stay grant-bound.",
    },
    {
        "testCaseId": "T141_REMOVE_CARD",
        "surface": "browser",
        "category": "playwright",
        "scenario": "Remove a local card without changing the shell route or current step anchor.",
        "requiredOutcome": "local_remove_only",
        "proof": "Card count decreases and the main intake shell remains stable.",
    },
    {
        "testCaseId": "T141_MOBILE_CAPTURE_HEIC",
        "surface": "mobile",
        "category": "playwright",
        "scenario": "Use the mobile capture affordance for a HEIC image.",
        "requiredOutcome": "accepted_safe",
        "proof": "Capture control is visible on mobile, hidden on desktop, and the card settles without route churn.",
    },
    {
        "testCaseId": "T141_QUARANTINE_MALWARE_VISIBLE",
        "surface": "browser",
        "category": "playwright",
        "scenario": "Upload a file that resolves to quarantined_malware.",
        "requiredOutcome": "quarantined_malware",
        "proof": "The card remains visible, is visually distinct from accepted_safe, and offers replace or remove only.",
    },
    {
        "testCaseId": "T141_UNREADABLE_FAIL_CLOSED",
        "surface": "browser",
        "category": "contract",
        "scenario": "Unreadable evidence must route to fail_closed_review instead of metadata-only downgrade.",
        "requiredOutcome": "quarantined_unreadable",
        "proof": "Classification matrix binds unreadable evidence to unresolved_fail_closed_review and intake.attachment.quarantined.",
    },
    {
        "testCaseId": "T141_DUPLICATE_IDEMPOTENT_REPLAY",
        "surface": "browser",
        "category": "playwright",
        "scenario": "Upload the exact same safe file twice within the same draft lineage.",
        "requiredOutcome": "idempotent_replay",
        "proof": "The existing card is focused, a duplicate notice appears, and no second evidence card or event is created.",
    },
    {
        "testCaseId": "T141_RAW_URL_FORBIDDEN",
        "surface": "contract",
        "category": "validator",
        "scenario": "Preview, open, download, and handoff flows must not expose raw object-storage URLs.",
        "requiredOutcome": "grant_bound_only",
        "proof": "Generated contracts and evidence lab expose only governed actions and no raw object URL fields.",
    },
    {
        "testCaseId": "T141_REDUCED_MOTION_EQUIVALENCE",
        "surface": "browser",
        "category": "playwright",
        "scenario": "Reduced-motion mode must keep the same meanings without timing-heavy animation.",
        "requiredOutcome": "equivalent_states",
        "proof": "The evidence lab switches to reduced-motion mode while preserving card states, ladder parity, and announcements.",
    },
    {
        "testCaseId": "T141_RESPONSIVE_RAIL_COLLAPSE",
        "surface": "browser",
        "category": "playwright",
        "scenario": "Narrow layouts collapse the evidence rail below the shell without horizontal overflow.",
        "requiredOutcome": "stacked_layout",
        "proof": "The body layout dataset switches to stacked and the page stays within the viewport width budget.",
    },
]


def now_iso() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def ensure(condition: bool, message: str) -> None:
    if not condition:
        raise SystemExit(message)


def load_json(path: Path) -> Any:
    return json.loads(path.read_text())


def write_json(path: Path, payload: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2) + "\n")


def write_text(path: Path, text: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text.rstrip() + "\n")


def write_csv(path: Path, rows: list[dict[str, Any]], headers: list[str]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=headers)
        writer.writeheader()
        writer.writerows(rows)


def markdown_table(headers: list[str], rows: list[list[str]]) -> str:
    def esc(value: str) -> str:
        return value.replace("|", "\\|")

    lines = [
        "| " + " | ".join(esc(header) for header in headers) + " |",
        "| " + " | ".join(["---"] * len(headers)) + " |",
    ]
    for row in rows:
        lines.append("| " + " | ".join(esc(cell) for cell in row) + " |")
    return "\n".join(lines)


def json_block(payload: Any) -> str:
    return "```json\n" + json.dumps(payload, indent=2) + "\n```"


def bytes_label(value: int) -> str:
    return f"{value // (1024 * 1024)} MB"


def load_prerequisites() -> dict[str, Any]:
    for path in [
        PHASE1_DRAFT_SCHEMA_PATH,
        PHASE1_EVENT_CATALOG_PATH,
        REQUEST_TYPE_TAXONOMY_PATH,
        ARTIFACT_DOC_PATH,
        ADAPTER_VALIDATION_RESULTS_PATH,
    ]:
        ensure(path.exists(), f"PREREQUISITE_GAP_141_MISSING_{path.name.upper().replace('.', '_')}")

    draft_schema = load_json(PHASE1_DRAFT_SCHEMA_PATH)
    event_catalog = load_json(PHASE1_EVENT_CATALOG_PATH)
    taxonomy = load_json(REQUEST_TYPE_TAXONOMY_PATH)
    adapter_validation = load_json(ADAPTER_VALIDATION_RESULTS_PATH)

    draft_version = draft_schema["properties"]["draftSchemaVersion"]["const"]
    event_names = {row["eventName"] for row in event_catalog["eventCatalog"]}
    ensure(
        "intake.attachment.added" in event_names,
        "PREREQUISITE_GAP_141_INTAKE_ATTACHMENT_ADDED_EVENT_MISSING",
    )
    ensure(
        "intake.attachment.quarantined" in event_names,
        "PREREQUISITE_GAP_141_INTAKE_ATTACHMENT_QUARANTINED_EVENT_MISSING",
    )

    scanner_row = next(
        (
            row
            for row in adapter_validation["rows"]
            if row["adapterId"] == "adp_malware_artifact_scanning"
        ),
        None,
    )
    ensure(
        scanner_row is not None,
        "PREREQUISITE_GAP_141_MALWARE_SCANNER_VALIDATION_ROW_MISSING",
    )

    return {
        "draftSchemaVersion": draft_version,
        "requestTypes": [row["requestType"] for row in taxonomy["requestTypes"]],
        "scannerGapRef": scanner_row["gapRefs"][0],
        "scannerValidationState": scanner_row["currentValidationState"],
    }


def build_acceptance_policy(prereq: dict[str, Any]) -> dict[str, Any]:
    return {
        "taskId": TASK_ID,
        "generatedAt": now_iso(),
        "capturedOn": CAPTURED_ON,
        "visualMode": VISUAL_MODE,
        "policyId": ACCEPTANCE_POLICY_ID,
        "draftSchemaVersion": prereq["draftSchemaVersion"],
        "requestTypes": prereq["requestTypes"],
        "sourcePrecedence": SOURCE_PRECEDENCE,
        "upstreamInputs": UPSTREAM_INPUTS,
        "quarantineFirstUploadAlgorithm": UPLOAD_ALGORITHM,
        "attachmentPublicIdPattern": "^att_[a-z0-9]{10,32}$",
        "acceptedMimeFamilies": [mime for rule in ACCEPTANCE_RULES for mime in rule["allowedMimeFamilies"]],
        "maxAcceptedBytes": MAX_ACCEPT_BYTES,
        "maxInlinePreviewBytes": MAX_INLINE_BYTES,
        "acceptanceRules": ACCEPTANCE_RULES,
        "duplicateUploadPolicy": {
            "policyRef": "DUP_141_CHECKSUM_LINEAGE_REPLAY",
            "idempotencyScope": "draftPublicId + checksumSha256 + byteSize + contentType",
            "sameLineageBehavior": "reuse_existing_attachment_public_id_and_document_reference",
            "duplicateEventBehavior": "no_second_intake.attachment.added_event",
            "userExperienceBehavior": "focus_existing_card_and_show_duplicate_notice",
            "fingerprintUnavailableBehavior": "retry_without_dedupe_until_quarantine_write_is_authoritative",
        },
        "classificationOutcomes": CLASSIFICATION_OUTCOMES,
        "eventPolicy": [
            {
                "eventName": "intake.attachment.added",
                "emittedWhen": "The file is scanned clean, promoted to durable storage, Attachment is created, and DocumentReference is linked.",
                "schemaArtifactPath": "packages/event-contracts/schemas/intake/intake.attachment.added.v1.schema.json",
            },
            {
                "eventName": "intake.attachment.quarantined",
                "emittedWhen": "The file is unsafe, unreadable, unsupported, oversized, or fails integrity checks after reaching quarantine.",
                "schemaArtifactPath": "packages/event-contracts/schemas/intake/intake.attachment.quarantined.v1.schema.json",
            },
        ],
        "artifactPresentationContract": {
            "artifactPresentationContractId": ARTIFACT_PRESENTATION_CONTRACT_ID,
            "artifactRefPattern": "att_*",
            "audienceSurface": "patient_public_intake",
            "primaryMode": "structured_summary",
            "previewVisibility": "governed_preview",
            "fullBodyMode": "forbidden",
            "summarySafetyTier": "verified_or_provisional",
            "inlinePreviewContractRef": "IPC_141_ATTACHMENT_INLINE_PREVIEW_V1",
            "downloadContractRef": "DLC_141_ATTACHMENT_DOWNLOAD_V1",
            "printContractRef": "PRC_141_ATTACHMENT_PRINT_FORBIDDEN_V1",
            "handoffContractRef": "HOC_141_ATTACHMENT_HANDOFF_V1",
            "placeholderContractRef": "PLC_141_ATTACHMENT_PLACEHOLDER_V1",
            "redactionPolicyRef": "RDP_141_ATTACHMENT_MINIMUM_NECESSARY_V1",
            "maxInlineBytes": MAX_INLINE_BYTES,
            "requiresStepUpForFullBody": False,
            "allowedFallbackModes": ["structured_summary", "placeholder_only", "recovery_only"],
            "channelSpecificNoticeRef": "CSN_141_ATTACHMENT_BROWSER_AND_EMBEDDED_V1",
            "rawStorageUrlsForbidden": True,
        },
        "outboundNavigationGrantPolicy": {
            "policyRef": OUTBOUND_NAVIGATION_GRANT_POLICY_ID,
            "grantRequiredFor": ["open_in_browser", "download", "external_handoff"],
            "destinationClasses": ["browser_overlay", "external_browser"],
            "sameShellReturnRequired": True,
            "staleGrantBehavior": "fail_closed_to_same_shell_placeholder_or_recovery",
            "rawStorageUrlsForbidden": True,
        },
        "mockNowExecution": {
            "scannerRuntimeState": prereq["scannerValidationState"],
            "scannerGapRef": prereq["scannerGapRef"],
            "summary": "Local fixtures, quarantine storage stubs, derivative stubs, and scanner stubs prove the contract now without claiming production accreditation.",
        },
        "actualProductionStrategyLater": {
            "summary": "Later production scanners and object stores must preserve the same attachmentPublicId, scan states, event names, and governed artifact-mode law.",
            "canStrengthenDetection": True,
            "mayRelaxPolicy": False,
        },
        "gapResolutions": GAP_RESOLUTIONS,
        "assumptions": ASSUMPTIONS,
        "conflicts": CONFLICTS,
        "risks": RISKS,
    }


def build_scan_schema() -> dict[str, Any]:
    outcome_enum = [row["outcome"] for row in CLASSIFICATION_OUTCOMES]
    return {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "$id": "https://vecells.local/schemas/contracts/141_attachment_scan_and_quarantine.schema.json",
        "title": "Attachment scan and quarantine record",
        "description": "Governed attachment intake record for Phase 1. The schema freezes acceptance, quarantine, dedupe, and artifact-mode posture without exposing raw storage URLs.",
        "type": "object",
        "additionalProperties": False,
        "required": [
            "attachmentPublicId",
            "draftPublicId",
            "originalFilename",
            "contentType",
            "byteSize",
            "checksumSha256",
            "checksumAlgorithm",
            "scanState",
            "classificationOutcome",
            "quarantineState",
            "quarantineObjectKey",
            "durableObjectKey",
            "thumbnailKey",
            "artifactPresentationContractRef",
            "artifactModeRef",
            "documentReferenceRef",
            "duplicateDisposition",
            "emittedEventNames",
            "safetyMeaningState",
            "linkedRequestPublicId",
        ],
        "properties": {
            "attachmentPublicId": {"type": "string", "pattern": "^att_[a-z0-9]{10,32}$"},
            "draftPublicId": {"type": "string", "pattern": "^dft_[a-z0-9]{10,32}$"},
            "linkedRequestPublicId": {
                "type": ["string", "null"],
                "pattern": "^req_[a-z0-9]{10,32}$",
            },
            "originalFilename": {"type": "string", "minLength": 1},
            "contentType": {"type": "string", "minLength": 1},
            "byteSize": {"type": "integer", "minimum": 1, "maximum": MAX_ACCEPT_BYTES},
            "checksumSha256": {"type": "string", "pattern": "^[a-f0-9]{64}$"},
            "checksumAlgorithm": {"const": "sha256"},
            "declaredExtension": {"type": "string"},
            "mimeFamily": {"type": "string"},
            "scanState": {
                "type": "string",
                "enum": [
                    "uploading_to_quarantine",
                    "scan_pending",
                    "clean_promoted",
                    "clean_promoted_preview_deferred",
                    "transfer_retry_required",
                    "quarantined_malware",
                    "quarantined_integrity_failure",
                    "quarantined_unsupported_type",
                    "quarantined_unreadable",
                    "quarantined_size_exceeded",
                ],
            },
            "classificationOutcome": {"type": "string", "enum": outcome_enum},
            "quarantineState": {
                "type": "string",
                "enum": ["not_started", "not_quarantined", "quarantined"],
            },
            "quarantineObjectKey": {"type": ["string", "null"]},
            "durableObjectKey": {"type": ["string", "null"]},
            "thumbnailKey": {"type": ["string", "null"]},
            "artifactPresentationContractRef": {"const": ARTIFACT_PRESENTATION_CONTRACT_ID},
            "artifactModeRef": {
                "type": "string",
                "enum": [row["modeKey"] for row in ARTIFACT_MODES],
            },
            "documentReferenceRef": {"type": ["string", "null"]},
            "duplicateDisposition": {
                "type": "string",
                "enum": ["new_capture", "idempotent_replay", "replacement_capture"],
            },
            "emittedEventNames": {
                "type": "array",
                "items": {
                    "type": "string",
                    "enum": ["intake.attachment.added", "intake.attachment.quarantined"],
                },
                "uniqueItems": True,
            },
            "safetyMeaningState": {
                "type": "string",
                "enum": [
                    "not_yet_captured",
                    "preserved_supporting_evidence",
                    "unresolved_fail_closed_review",
                ],
            },
        },
        "examples": [
            {
                "attachmentPublicId": "att_safe_pdf_alpha01",
                "draftPublicId": "dft_alpha_safe_pdf01",
                "linkedRequestPublicId": None,
                "originalFilename": "scan-safe.pdf",
                "contentType": "application/pdf",
                "byteSize": 248311,
                "checksumSha256": "a" * 64,
                "checksumAlgorithm": "sha256",
                "declaredExtension": ".pdf",
                "mimeFamily": "application/pdf",
                "scanState": "clean_promoted",
                "classificationOutcome": "accepted_safe",
                "quarantineState": "not_quarantined",
                "quarantineObjectKey": "quarantine/intake/att_safe_pdf_alpha01",
                "durableObjectKey": "durable/intake/att_safe_pdf_alpha01",
                "thumbnailKey": None,
                "artifactPresentationContractRef": ARTIFACT_PRESENTATION_CONTRACT_ID,
                "artifactModeRef": "MODE_141_GOVERNED_PREVIEW",
                "documentReferenceRef": "DocumentReference/doc_att_safe_pdf_alpha01",
                "duplicateDisposition": "new_capture",
                "emittedEventNames": ["intake.attachment.added"],
                "safetyMeaningState": "preserved_supporting_evidence",
            },
            {
                "attachmentPublicId": "att_heic_placeholder01",
                "draftPublicId": "dft_alpha_safe_pdf01",
                "linkedRequestPublicId": None,
                "originalFilename": "scan-no-preview.heic",
                "contentType": "image/heic",
                "byteSize": 7621001,
                "checksumSha256": "b" * 64,
                "checksumAlgorithm": "sha256",
                "declaredExtension": ".heic",
                "mimeFamily": "image/heic",
                "scanState": "clean_promoted_preview_deferred",
                "classificationOutcome": "preview_unavailable_but_file_kept",
                "quarantineState": "not_quarantined",
                "quarantineObjectKey": "quarantine/intake/att_heic_placeholder01",
                "durableObjectKey": "durable/intake/att_heic_placeholder01",
                "thumbnailKey": None,
                "artifactPresentationContractRef": ARTIFACT_PRESENTATION_CONTRACT_ID,
                "artifactModeRef": "MODE_141_PLACEHOLDER_ONLY",
                "documentReferenceRef": "DocumentReference/doc_att_heic_placeholder01",
                "duplicateDisposition": "new_capture",
                "emittedEventNames": ["intake.attachment.added"],
                "safetyMeaningState": "preserved_supporting_evidence",
            },
            {
                "attachmentPublicId": "att_quarantine_alpha01",
                "draftPublicId": "dft_alpha_safe_pdf01",
                "linkedRequestPublicId": None,
                "originalFilename": "malware-sample.jpg",
                "contentType": "image/jpeg",
                "byteSize": 140221,
                "checksumSha256": "c" * 64,
                "checksumAlgorithm": "sha256",
                "declaredExtension": ".jpg",
                "mimeFamily": "image/jpeg",
                "scanState": "quarantined_malware",
                "classificationOutcome": "quarantined_malware",
                "quarantineState": "quarantined",
                "quarantineObjectKey": "quarantine/intake/att_quarantine_alpha01",
                "durableObjectKey": None,
                "thumbnailKey": None,
                "artifactPresentationContractRef": ARTIFACT_PRESENTATION_CONTRACT_ID,
                "artifactModeRef": "MODE_141_RECOVERY_ONLY",
                "documentReferenceRef": None,
                "duplicateDisposition": "new_capture",
                "emittedEventNames": ["intake.attachment.quarantined"],
                "safetyMeaningState": "unresolved_fail_closed_review",
            },
            {
                "attachmentPublicId": "att_duplicate_alpha01",
                "draftPublicId": "dft_alpha_safe_pdf01",
                "linkedRequestPublicId": None,
                "originalFilename": "scan-safe.pdf",
                "contentType": "application/pdf",
                "byteSize": 248311,
                "checksumSha256": "a" * 64,
                "checksumAlgorithm": "sha256",
                "declaredExtension": ".pdf",
                "mimeFamily": "application/pdf",
                "scanState": "clean_promoted",
                "classificationOutcome": "accepted_safe",
                "quarantineState": "not_quarantined",
                "quarantineObjectKey": "quarantine/intake/att_safe_pdf_alpha01",
                "durableObjectKey": "durable/intake/att_safe_pdf_alpha01",
                "thumbnailKey": None,
                "artifactPresentationContractRef": ARTIFACT_PRESENTATION_CONTRACT_ID,
                "artifactModeRef": "MODE_141_GOVERNED_PREVIEW",
                "documentReferenceRef": "DocumentReference/doc_att_safe_pdf_alpha01",
                "duplicateDisposition": "idempotent_replay",
                "emittedEventNames": ["intake.attachment.added"],
                "safetyMeaningState": "preserved_supporting_evidence",
            },
        ],
    }


def build_projection_modes(policy: dict[str, Any]) -> dict[str, Any]:
    return {
        "taskId": TASK_ID,
        "generatedAt": now_iso(),
        "capturedOn": CAPTURED_ON,
        "visualMode": VISUAL_MODE,
        "projectionModesId": PROJECTION_MODES_ID,
        "artifactPresentationContract": policy["artifactPresentationContract"],
        "outboundNavigationGrantPolicy": policy["outboundNavigationGrantPolicy"],
        "scanStateLadder": SCAN_STATE_LADDER,
        "artifactModes": ARTIFACT_MODES,
        "projectionExamples": [
            {
                "projectionRef": "ATTACH_PROJECTION_SAFE_PREVIEW",
                "attachmentPublicId": "att_safe_pdf_alpha01",
                "classificationOutcome": "accepted_safe",
                "artifactModeRef": "MODE_141_GOVERNED_PREVIEW",
                "currentSafeMode": "governed_preview",
                "summaryLabel": "Safe PDF with inline governed preview",
                "allowedActions": ["replace", "remove", "open_with_grant", "download_with_grant"],
            },
            {
                "projectionRef": "ATTACH_PROJECTION_PLACEHOLDER",
                "attachmentPublicId": "att_heic_placeholder01",
                "classificationOutcome": "preview_unavailable_but_file_kept",
                "artifactModeRef": "MODE_141_PLACEHOLDER_ONLY",
                "currentSafeMode": "placeholder_only",
                "summaryLabel": "Safe image kept without inline preview",
                "allowedActions": ["replace", "remove", "open_with_grant", "download_with_grant"],
            },
            {
                "projectionRef": "ATTACH_PROJECTION_QUARANTINE",
                "attachmentPublicId": "att_quarantine_alpha01",
                "classificationOutcome": "quarantined_malware",
                "artifactModeRef": "MODE_141_RECOVERY_ONLY",
                "currentSafeMode": "recovery_only",
                "summaryLabel": "Quarantined evidence with same-shell replace guidance",
                "allowedActions": ["replace", "remove"],
            },
        ],
        "sameShellContinuityLaw": {
            "selectedAnchorRef": "patient.portal.requests.intake.supporting_files",
            "currentStepAnchor": "supporting_files",
            "localCardErrorsMayResetShell": False,
            "quarantineMustRemainVisible": True,
            "rawStorageUrlsForbidden": True,
        },
        "gapResolutions": GAP_RESOLUTIONS,
        "assumptions": ASSUMPTIONS,
        "conflicts": CONFLICTS,
        "risks": RISKS,
    }


def render_architecture_doc(policy: dict[str, Any], projection_modes: dict[str, Any]) -> str:
    acceptance_rows = [
        [
            rule["label"],
            ", ".join(rule["allowedExtensions"]),
            ", ".join(rule["allowedMimeFamilies"]),
            bytes_label(rule["maxBytes"]),
            rule["previewEligibility"],
            "yes" if rule["directCameraCaptureSupport"] else "no",
        ]
        for rule in ACCEPTANCE_RULES
    ]
    outcome_rows = [
        [
            row["outcome"],
            row["terminalScanState"],
            row["artifactStageMode"],
            ", ".join(row["emittedEventNames"]) or "none",
            row["safetyMeaningState"],
        ]
        for row in CLASSIFICATION_OUTCOMES
    ]
    algorithm_rows = [[str(index + 1), step] for index, step in enumerate(UPLOAD_ALGORITHM)]
    gap_rows = [[row["gapId"], row["summary"]] for row in GAP_RESOLUTIONS]
    assumption_rows = [[row["assumptionId"], row["summary"]] for row in ASSUMPTIONS]
    conflict_rows = [[row["conflictId"], row["summary"]] for row in CONFLICTS]
    risk_rows = [[row["riskId"], row["summary"], row["mitigation"]] for row in RISKS]

    return f"""
# 141 Attachment Acceptance And Quarantine Contracts

Generated: {policy["generatedAt"]}

## Purpose

`seq_141` freezes the Phase 1 attachment subsystem as a governed intake surface instead of a generic upload helper. Acceptance, quarantine, dedupe, preview posture, governed handoff, and same-shell continuity now resolve from one exact contract pack.

## Frozen Upload Algorithm

{markdown_table(["Step", "Action"], algorithm_rows)}

The durable rule is strict:

- safe files alone promote to durable storage, create the Attachment row, create the `DocumentReference`, update the draft projection, and emit `intake.attachment.added`
- quarantine and unsupported verdicts emit `intake.attachment.quarantined`
- retryable transfer failure is local recovery only until quarantine write becomes authoritative

## Acceptance Rules

{markdown_table(["Rule", "Extensions", "MIME", "Max size", "Preview law", "Camera"], acceptance_rows)}

The duplicate-upload rule is fixed under `DUP_141_CHECKSUM_LINEAGE_REPLAY`: the same `draftPublicId + checksumSha256 + byteSize + contentType` replays to the existing `attachmentPublicId`, reuses the same `DocumentReference`, focuses the existing card, and emits no second durable add event.

## Classification And Quarantine Outcomes

{markdown_table(["Outcome", "Terminal scan state", "Artifact stage", "Events", "Safety meaning"], outcome_rows)}

If attachment processing leaves safety meaning unresolved, the file may not quietly downgrade into `technical_metadata`. The classification pack routes that state to `unresolved_fail_closed_review`.

## Artifact Law

{json_block({
    "artifactPresentationContractId": projection_modes["artifactPresentationContract"]["artifactPresentationContractId"],
    "outboundNavigationGrantPolicyRef": projection_modes["outboundNavigationGrantPolicy"]["policyRef"],
    "allowedFallbackModes": projection_modes["artifactPresentationContract"]["allowedFallbackModes"],
    "rawStorageUrlsForbidden": projection_modes["artifactPresentationContract"]["rawStorageUrlsForbidden"],
})}

Attachment preview, open, download, and browser handoff are independent governed modes:

- preview is available only while the current `ArtifactPresentationContract` plus mode tuple keep preview lawful
- open, download, and external handoff require `OutboundNavigationGrant`
- raw object-store URLs are forbidden in every browser-facing flow
- placeholder-only and recovery-only modes stay in the same shell and preserve the current step anchor

## Gap Handling

{markdown_table(["Gap", "Resolution"], gap_rows)}

## Explicit Assumptions

{markdown_table(["Assumption", "Summary"], assumption_rows)}

## Explicit Conflict Handling

{markdown_table(["Conflict", "Summary"], conflict_rows)}

## Explicit Risks

{markdown_table(["Risk", "Summary", "Mitigation"], risk_rows)}

## Source Traceability

{chr(10).join(f"- `{ref}`" for ref in SOURCE_PRECEDENCE)}
"""


def render_security_doc(policy: dict[str, Any], prereq: dict[str, Any]) -> str:
    scanner_note = (
        f"The current mock-now path is explicit: adapter `{prereq['scannerGapRef']}` remains "
        "simulator-stubbed, so this pack freezes policy and fail-closed outcomes without pretending the local stub is production-accredited."
    )
    security_rows = [
        ["Max accepted bytes", bytes_label(MAX_ACCEPT_BYTES)],
        ["Max inline preview bytes", bytes_label(MAX_INLINE_BYTES)],
        ["Raw storage URLs", "forbidden"],
        ["Duplicate idempotency", "checksum lineage replay"],
        ["Quarantine visibility", "same-shell card remains visible"],
        ["Fail-closed unresolved meaning", "required"],
    ]
    return f"""
# 141 Attachment Acceptance Policy

Generated: {policy["generatedAt"]}

## Security Posture

The attachment pipeline is quarantine-first. The browser writes only to a signed quarantine target. Promotion to durable storage occurs only after MIME, extension, size, malware, and integrity checks settle cleanly.

{markdown_table(["Control", "Policy"], security_rows)}

## Canonical States

- `accepted_safe` is the only state that may create both the durable Attachment row and the `DocumentReference`
- `preview_unavailable_but_file_kept` preserves the file and same-shell continuity, but keeps preview bounded
- `retryable_transfer_failure` is not a scanner verdict and may not masquerade as accepted evidence
- `quarantined_malware`, `quarantined_integrity_failure`, `quarantined_unsupported_type`, `quarantined_unreadable`, and `quarantined_size_exceeded` each remain visible and fail closed

## Event Law

- `intake.attachment.added` may emit only after safe promotion and durable linking
- `intake.attachment.quarantined` must emit whenever a quarantined terminal verdict is reached
- no raw object URL or local browser acknowledgement may stand in for a durable event or grant

## Mock_now_execution

{scanner_note}

## Actual_production_strategy_later

- production scanners may add stronger threat intelligence, metadata stripping, and integrity signals
- production may not weaken the accepted or quarantined outcomes frozen here
- production stores and delivery services must keep the same `attachmentPublicId`, scan states, event names, and governed handoff law

## Explicit Control Notes

- `ASSUMPTION_141_QUARANTINE_STORAGE_IS_PRIVATE_ONLY`
- `ASSUMPTION_141_DERIVATIVE_GENERATION_IS_NON_AUTHORITATIVE`
- `CONFLICT_141_PRODUCTION_SCANNERS_MAY_STRENGTHEN_BUT_NOT_RELAX`
- `RISK_141_DERIVATIVE_FAILURE_COULD_HIDE_CLINICAL_CONTEXT`
- `RISK_141_SCANNER_TIMEOUT_COULD_BE_MISTAKEN_FOR_ACCEPTANCE`
"""


def render_frontend_doc(policy: dict[str, Any], projection_modes: dict[str, Any]) -> str:
    layout_rows = [
        ["Canvas", "#F7F8FA"],
        ["Shell", "#EEF2F6"],
        ["Panel", "#FFFFFF"],
        ["Inset", "#F3F6F9"],
        ["Text strong", "#0F1720"],
        ["Text default", "#24313D"],
        ["Text muted", "#5E6B78"],
        ["Accent upload", "#2F6FED"],
        ["Accent safe", "#117A55"],
        ["Accent retry", "#B7791F"],
        ["Accent quarantine", "#B42318"],
        ["Accent preview", "#5B61F6"],
    ]
    mode_rows = [
        [
            row["label"],
            row["artifactStageMode"],
            row["previewVisibility"],
            row["openAction"],
            row["sameShellContinuity"],
        ]
        for row in projection_modes["artifactModes"]
    ]
    return f"""
# 141 Attachment Upload Experience Spec

Generated: {policy["generatedAt"]}

## Surface Mode

`Attachment_Evidence_Rail`

## Experience Intent

The upload surface feels premium, exact, and supportive. It is part of the intake shell rather than a detached gallery or utility page. Local card errors remain local and must not reset the question flow or current step anchor.

## Layout

- overall max width: `1320px`
- centered intake shell mock frame: `760px`
- secondary evidence rail on desktop, collapsing below the shell on narrow layouts
- drop or capture zone minimum height: `168px`
- preview card grid: `2-3` cards per row on desktop, one column on mobile
- lower scan-state and artifact-mode parity region

## Visual Bootstrap

{markdown_table(["Token", "Value"], layout_rows)}

Typography fallback:

- h1 `28/34`
- h2 `20/26`
- body `16/24`
- meta `13/20`

## Interaction Rules

- desktop supports drag and drop plus file-picker flows
- mobile surfaces show camera capture affordance only where the current channel can support it
- retry, remove, and replace stay local to the card
- progress copy stays concise: upload, scan, settled, retry
- quarantine states are explicit but low-drama
- preview, open, download, and handoff remain subordinate and governed

## Artifact-Mode Mapping

{markdown_table(["Mode", "Artifact stage", "Preview visibility", "Open action", "Continuity"], mode_rows)}

## Accessibility And Motion

- one polite live region announces progress and failure without toast spam
- card states expose stable labels and data markers
- reduced-motion mode preserves the same meaning with transitions removed
- ladder and matrix visuals each ship with table parity

## Explicit Continuity Rule

`local_card_errors_may_reset_shell = false`
"""


def render_lab_html(policy: dict[str, Any], projection_modes: dict[str, Any]) -> str:
    lab_payload = {
        "taskId": TASK_ID,
        "visualMode": VISUAL_MODE,
        "maxAcceptedBytes": MAX_ACCEPT_BYTES,
        "maxInlinePreviewBytes": MAX_INLINE_BYTES,
        "acceptanceRules": ACCEPTANCE_RULES,
        "classificationRows": CLASSIFICATION_ROWS,
        "scanStateLadder": SCAN_STATE_LADDER,
        "artifactModes": ARTIFACT_MODES,
        "outboundNavigationGrantPolicy": projection_modes["outboundNavigationGrantPolicy"],
        "artifactPresentationContract": projection_modes["artifactPresentationContract"],
    }
    lab_json = json.dumps(lab_payload, indent=2)
    return f"""<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>141 Attachment Evidence Lab</title>
    <style>
      :root {{
        --canvas: #f7f8fa;
        --shell: #eef2f6;
        --panel: #ffffff;
        --inset: #f3f6f9;
        --border: #d6dee6;
        --text-strong: #0f1720;
        --text-default: #24313d;
        --text-muted: #5e6b78;
        --accent-upload: #2f6fed;
        --accent-safe: #117a55;
        --accent-retry: #b7791f;
        --accent-quarantine: #b42318;
        --accent-preview: #5b61f6;
        --shadow-soft: 0 18px 40px rgba(15, 23, 32, 0.06);
        --radius-lg: 26px;
        --radius-md: 18px;
        --radius-sm: 12px;
        --transition-fast: 120ms ease;
        --transition-card: 160ms ease;
        --transition-state: 180ms ease;
        font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }}

      * {{
        box-sizing: border-box;
      }}

      body {{
        margin: 0;
        background: linear-gradient(180deg, #fbfcfd 0%, var(--canvas) 100%);
        color: var(--text-default);
        font: 16px/24px Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }}

      body[data-motion="reduce"] *,
      body[data-motion="reduce"] *::before,
      body[data-motion="reduce"] *::after {{
        transition: none !important;
        animation: none !important;
        scroll-behavior: auto !important;
      }}

      .page {{
        max-width: 1320px;
        margin: 0 auto;
        padding: 32px 20px 56px;
        min-width: 0;
      }}

      .masthead {{
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 20px;
        margin-bottom: 22px;
      }}

      .brand {{
        display: inline-flex;
        align-items: center;
        gap: 12px;
        font-weight: 700;
        letter-spacing: 0.02em;
        color: var(--text-strong);
      }}

      .brand svg {{
        width: 24px;
        height: 24px;
      }}

      .meta-chip {{
        border: 1px solid var(--border);
        background: rgba(255, 255, 255, 0.82);
        border-radius: 999px;
        padding: 7px 12px;
        color: var(--text-muted);
        font-size: 13px;
        line-height: 20px;
        max-width: 100%;
        overflow-wrap: anywhere;
      }}

      .hero {{
        background: rgba(255, 255, 255, 0.7);
        border: 1px solid var(--border);
        border-radius: 28px;
        padding: 28px;
        box-shadow: var(--shadow-soft);
        margin-bottom: 24px;
      }}

      .hero h1 {{
        margin: 0 0 10px;
        font-size: 28px;
        line-height: 34px;
        color: var(--text-strong);
      }}

      .hero p {{
        margin: 0;
        max-width: 72ch;
        color: var(--text-default);
      }}

      .workspace {{
        display: grid;
        grid-template-columns: minmax(0, 760px) minmax(280px, 1fr);
        gap: 22px;
        align-items: start;
        min-width: 0;
      }}

      .shell {{
        background: var(--shell);
        border: 1px solid #dde5ec;
        border-radius: 30px;
        padding: 24px;
        min-width: 0;
        box-shadow: var(--shadow-soft);
      }}

      .shell-head {{
        display: flex;
        justify-content: space-between;
        gap: 12px;
        align-items: start;
        margin-bottom: 18px;
      }}

      .shell-head h2 {{
        margin: 0 0 6px;
        font-size: 20px;
        line-height: 26px;
        color: var(--text-strong);
      }}

      .shell-head p,
      .shell-copy,
      .rail-card p,
      .ladder-card p,
      .matrix-card p,
      .card-subtle,
      .note {{
        margin: 0;
        color: var(--text-muted);
      }}

      .journey-anchor {{
        display: inline-flex;
        align-items: center;
        gap: 8px;
        background: rgba(255, 255, 255, 0.84);
        border: 1px solid var(--border);
        border-radius: 999px;
        padding: 8px 12px;
        font-size: 13px;
        line-height: 20px;
        color: var(--text-default);
        max-width: 100%;
        white-space: normal;
      }}

      .question-panel,
      .drop-zone,
      .cards-panel,
      .rail-card,
      .matrix-card,
      .table-panel {{
        background: var(--panel);
        border: 1px solid var(--border);
        border-radius: var(--radius-lg);
        box-shadow: 0 10px 28px rgba(15, 23, 32, 0.03);
      }}

      .question-panel {{
        padding: 20px;
        margin-bottom: 16px;
      }}

      .question-label {{
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 7px 10px;
        border-radius: 999px;
        background: var(--inset);
        color: var(--text-muted);
        font-size: 13px;
        line-height: 20px;
        margin-bottom: 10px;
      }}

      .question-panel strong {{
        display: block;
        font-size: 20px;
        line-height: 26px;
        margin-bottom: 8px;
        color: var(--text-strong);
      }}

      .drop-zone {{
        position: relative;
        min-height: 168px;
        padding: 18px;
        margin-bottom: 16px;
        background:
          linear-gradient(180deg, rgba(47, 111, 237, 0.06) 0%, rgba(255, 255, 255, 0.96) 52%),
          var(--panel);
        border-style: dashed;
      }}

      .drop-zone[data-dragging="true"] {{
        border-color: var(--accent-upload);
        box-shadow: 0 0 0 4px rgba(47, 111, 237, 0.08);
      }}

      .drop-zone-top {{
        display: flex;
        justify-content: space-between;
        align-items: start;
        gap: 14px;
        margin-bottom: 14px;
      }}

      .drop-zone-title {{
        margin: 0 0 6px;
        font-size: 20px;
        line-height: 26px;
        color: var(--text-strong);
      }}

      .drop-actions {{
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
      }}

      button {{
        appearance: none;
        border: 0;
        border-radius: 999px;
        padding: 10px 14px;
        font: inherit;
        cursor: pointer;
        transition: transform var(--transition-fast), box-shadow var(--transition-fast), background var(--transition-fast);
        max-width: 100%;
      }}

      button:hover,
      button:focus-visible {{
        transform: translateY(-1px);
      }}

      button:focus-visible {{
        outline: 2px solid var(--accent-upload);
        outline-offset: 2px;
      }}

      .button-primary {{
        background: var(--accent-upload);
        color: #fff;
        box-shadow: 0 10px 20px rgba(47, 111, 237, 0.18);
      }}

      .button-secondary {{
        background: var(--inset);
        color: var(--text-default);
      }}

      .button-quiet {{
        background: transparent;
        color: var(--text-muted);
        border: 1px solid var(--border);
      }}

      .drop-notes {{
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 10px;
      }}

      .note-card {{
        background: rgba(243, 246, 249, 0.85);
        border-radius: var(--radius-sm);
        padding: 12px;
      }}

      .note-card strong {{
        display: block;
        color: var(--text-strong);
        font-size: 13px;
        line-height: 20px;
        margin-bottom: 4px;
      }}

      .cards-panel {{
        padding: 18px;
        min-width: 0;
      }}

      .cards-top {{
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 12px;
        margin-bottom: 14px;
      }}

      .cards-top h3,
      .rail-card h3,
      .matrix-card h3,
      .table-panel h3 {{
        margin: 0 0 4px;
        font-size: 20px;
        line-height: 26px;
        color: var(--text-strong);
      }}

      .card-grid {{
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
        gap: 14px;
      }}

      .attachment-card {{
        background: var(--panel);
        border: 1px solid var(--border);
        border-radius: 22px;
        padding: 16px;
        display: grid;
        gap: 12px;
        min-width: 0;
        transition: border-color var(--transition-card), box-shadow var(--transition-card), transform var(--transition-card);
      }}

      .attachment-card[data-state-tone="upload"] {{
        border-color: rgba(47, 111, 237, 0.25);
      }}

      .attachment-card[data-state-tone="safe"] {{
        border-color: rgba(17, 122, 85, 0.22);
      }}

      .attachment-card[data-state-tone="retry"] {{
        border-color: rgba(183, 121, 31, 0.24);
      }}

      .attachment-card[data-state-tone="quarantine"] {{
        border-color: rgba(180, 35, 24, 0.28);
      }}

      .attachment-card:hover,
      .attachment-card:focus-within {{
        box-shadow: 0 14px 30px rgba(15, 23, 32, 0.06);
      }}

      .card-head {{
        display: flex;
        justify-content: space-between;
        gap: 10px;
        align-items: start;
      }}

      .card-title {{
        min-width: 0;
      }}

      .card-title strong {{
        display: block;
        color: var(--text-strong);
        font-size: 16px;
        line-height: 22px;
        overflow-wrap: anywhere;
      }}

      .pill {{
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 6px 10px;
        border-radius: 999px;
        font-size: 12px;
        line-height: 16px;
        white-space: nowrap;
      }}

      .pill-upload {{
        background: rgba(47, 111, 237, 0.1);
        color: var(--accent-upload);
      }}

      .pill-safe {{
        background: rgba(17, 122, 85, 0.1);
        color: var(--accent-safe);
      }}

      .pill-retry {{
        background: rgba(183, 121, 31, 0.12);
        color: var(--accent-retry);
      }}

      .pill-quarantine {{
        background: rgba(180, 35, 24, 0.12);
        color: var(--accent-quarantine);
      }}

      .card-meta {{
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        font-size: 13px;
        line-height: 20px;
        color: var(--text-muted);
      }}

      .card-preview {{
        background: var(--inset);
        border-radius: var(--radius-md);
        min-height: 96px;
        padding: 14px;
        display: grid;
        align-content: start;
        gap: 8px;
      }}

      .card-preview strong {{
        color: var(--text-strong);
        font-size: 13px;
        line-height: 20px;
      }}

      .card-actions {{
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }}

      .card-actions button {{
        padding: 8px 11px;
        font-size: 13px;
        line-height: 18px;
      }}

      .duplicate-notice {{
        min-height: 20px;
        font-size: 13px;
        line-height: 20px;
        color: var(--accent-preview);
      }}

      .rail {{
        display: grid;
        gap: 16px;
        min-width: 0;
      }}

      .rail-card,
      .matrix-card,
      .table-panel {{
        padding: 18px;
        min-width: 0;
      }}

      .ladder {{
        display: grid;
        gap: 10px;
      }}

      .ladder-step {{
        display: grid;
        grid-template-columns: 28px minmax(0, 1fr);
        gap: 10px;
        align-items: start;
        padding: 10px 0;
        border-top: 1px solid rgba(216, 224, 232, 0.8);
      }}

      .ladder-step:first-child {{
        border-top: 0;
        padding-top: 0;
      }}

      .ladder-index {{
        width: 28px;
        height: 28px;
        border-radius: 999px;
        display: grid;
        place-items: center;
        font-size: 12px;
        line-height: 16px;
        background: var(--inset);
        color: var(--text-default);
      }}

      .ladder-step[data-tone="upload"] .ladder-index {{
        color: var(--accent-upload);
      }}

      .ladder-step[data-tone="safe"] .ladder-index {{
        color: var(--accent-safe);
      }}

      .ladder-step[data-tone="retry"] .ladder-index {{
        color: var(--accent-retry);
      }}

      .ladder-step[data-tone="quarantine"] .ladder-index {{
        color: var(--accent-quarantine);
      }}

      .mode-grid {{
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
        gap: 12px;
      }}

      .mode-tile {{
        border-radius: var(--radius-md);
        border: 1px solid var(--border);
        background: var(--inset);
        padding: 14px;
        overflow-wrap: anywhere;
        word-break: break-word;
      }}

      .mode-tile strong {{
        display: block;
        margin-bottom: 6px;
        color: var(--text-strong);
      }}

      .mode-tile p {{
        overflow-wrap: anywhere;
      }}

      .matrix-wrap {{
        display: grid;
        gap: 16px;
        margin-top: 24px;
        min-width: 0;
      }}

      .matrix-top {{
        display: grid;
        gap: 16px;
        grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
        min-width: 0;
      }}

      .table-panel {{
        overflow: hidden;
      }}

      .table-scroll {{
        overflow-x: auto;
        max-width: 100%;
      }}

      table {{
        width: 100%;
        border-collapse: collapse;
        table-layout: fixed;
      }}

      th,
      td {{
        padding: 11px 12px;
        text-align: left;
        vertical-align: top;
        border-top: 1px solid rgba(216, 224, 232, 0.72);
        font-size: 13px;
        line-height: 20px;
        overflow-wrap: anywhere;
      }}

      th {{
        color: var(--text-muted);
        font-weight: 600;
        background: rgba(243, 246, 249, 0.72);
      }}

      thead th {{
        border-top: 0;
      }}

      .live-region {{
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border: 0;
      }}

      [hidden] {{
        display: none !important;
      }}

      @media (max-width: 1080px) {{
        .workspace,
        .matrix-top {{
          grid-template-columns: minmax(0, 1fr);
        }}
      }}

      @media (max-width: 860px) {{
        .drop-notes {{
          grid-template-columns: minmax(0, 1fr);
        }}
      }}

      @media (max-width: 720px) {{
        .page {{
          padding: 20px 14px 44px;
        }}

        .hero,
        .shell,
        .rail-card,
        .matrix-card,
        .table-panel {{
          padding: 18px;
        }}

        .masthead,
        .shell-head,
        .drop-zone-top,
        .cards-top {{
          flex-direction: column;
          align-items: stretch;
        }}

        .drop-actions button {{
          width: 100%;
          justify-content: center;
        }}
      }}
    </style>
  </head>
  <body data-layout="rail" data-motion="standard">
    <div class="page" data-testid="attachment-evidence-lab">
      <header class="masthead">
        <div class="brand" data-testid="wordmark">
          <svg viewBox="0 0 32 32" aria-hidden="true">
            <rect x="5" y="6" width="22" height="20" rx="6" fill="none" stroke="currentColor" stroke-width="2"></rect>
            <path d="M10 12h12M10 16h8M10 20h10" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"></path>
          </svg>
          <span>Vecells</span>
        </div>
        <div class="meta-chip">Attachment_Evidence_Rail</div>
      </header>

      <section class="hero">
        <h1>Attachment acceptance, quarantine, and same-shell evidence posture</h1>
        <p>
          Phase 1 attachments are governed evidence. The browser writes to quarantine first, clean files promote to durable storage, and preview or handoff never escape the current contract tuple.
        </p>
      </section>

      <main class="workspace">
        <section class="shell" data-testid="attachment-shell-frame">
          <div class="shell-head">
            <div>
              <div class="question-label">Patient intake mission frame</div>
              <h2>Supporting files remain helpful, bounded, and quiet</h2>
              <p class="shell-copy" data-testid="journey-shell-copy">
                Add a photo, PDF, or scan if it helps the practice understand the request. Card-level issues stay here and do not restart the journey.
              </p>
            </div>
            <div class="journey-anchor" data-testid="current-step-anchor">Step 4 of 6 · Supporting files</div>
          </div>

          <section class="question-panel" data-testid="question-panel">
            <div class="question-label">Question context</div>
            <strong>Do you want to add any supporting files?</strong>
            <p>
              Optional evidence can help the practice, but the main question flow stays in front. Use the attachment rail only for relevant documents, photos, or PDFs.
            </p>
          </section>

          <section class="drop-zone" data-testid="drop-zone" data-dragging="false">
            <div class="live-region" aria-live="polite" aria-atomic="true" role="status" data-testid="upload-live-region"></div>
            <div class="drop-zone-top">
              <div>
                <h3 class="drop-zone-title">Add supporting files</h3>
                <p>PDF, JPG, PNG, or HEIC only. Safe files stay in the same shell. Unsupported or unsafe files stay visible with clear next steps.</p>
              </div>
              <div class="drop-actions">
                <button type="button" class="button-primary" data-testid="file-picker-trigger">Choose files</button>
                <button type="button" class="button-secondary" data-testid="camera-capture-trigger">Use camera</button>
              </div>
            </div>
            <div class="drop-notes">
              <div class="note-card">
                <strong>Accepted quietly</strong>
                <span class="note">Files promote only after MIME, extension, size, malware, and integrity checks settle cleanly.</span>
              </div>
              <div class="note-card">
                <strong>Preview is governed</strong>
                <span class="note">Inline preview stays bounded. Open and download remain grant-bound secondary actions.</span>
              </div>
              <div class="note-card">
                <strong>Continuity stays local</strong>
                <span class="note">Retry, replace, and remove affect only the card. They do not reset the shell or current step anchor.</span>
              </div>
            </div>
            <input type="file" hidden multiple accept=".pdf,.jpg,.jpeg,.png,.heic,application/pdf,image/jpeg,image/png,image/heic" data-testid="file-picker-input" />
            <input type="file" hidden accept=".jpg,.jpeg,.png,.heic,image/jpeg,image/png,image/heic" capture="environment" data-testid="camera-capture-input" />
            <input type="file" hidden accept=".pdf,.jpg,.jpeg,.png,.heic,application/pdf,image/jpeg,image/png,image/heic" data-testid="replace-input" />
          </section>

          <section class="cards-panel">
            <div class="cards-top">
              <div>
                <h3>Evidence cards</h3>
                <p>Preview cards show bounded state, filename, and size. They never become a dominant gallery.</p>
              </div>
              <div class="duplicate-notice" data-testid="duplicate-notice"></div>
            </div>
            <div class="card-grid" data-testid="attachment-card-grid"></div>
          </section>
        </section>

        <aside class="rail" data-testid="evidence-rail">
          <section class="rail-card">
            <h3>Scan-state ladder</h3>
            <p>The ladder keeps one visible truth for upload, scan, acceptance, placeholder-only, retry, and quarantine posture.</p>
            <div class="ladder" data-testid="scan-state-ladder"></div>
          </section>

          <section class="rail-card">
            <h3>Artifact-mode summary</h3>
            <p>Preview, open, download, and handoff do not widen past the current contract tuple.</p>
            <div class="mode-grid" data-testid="artifact-mode-visuals"></div>
          </section>
        </aside>
      </main>

      <section class="matrix-wrap">
        <div class="matrix-top">
          <section class="table-panel">
            <h3>Scan-state table parity</h3>
            <p>Visual ladder and tabular parity share the same rows.</p>
            <div class="table-scroll">
              <table data-testid="scan-state-table">
                <thead>
                  <tr>
                    <th>State</th>
                    <th>Tone</th>
                    <th>Summary</th>
                  </tr>
                </thead>
                <tbody></tbody>
              </table>
            </div>
          </section>

          <section class="table-panel">
            <h3>Artifact-mode matrix</h3>
            <p>Open, download, and handoff stay secondary and grant-bound.</p>
            <div class="table-scroll">
              <table data-testid="artifact-mode-matrix">
                <thead>
                  <tr>
                    <th>Mode</th>
                    <th>Stage</th>
                    <th>Preview</th>
                    <th>Open</th>
                    <th>Continuity</th>
                  </tr>
                </thead>
                <tbody></tbody>
              </table>
            </div>
          </section>
        </div>
      </section>
    </div>

    <script type="application/json" id="attachment-contract-payload">
{lab_json}
    </script>
    <script>
      const payload = JSON.parse(document.getElementById("attachment-contract-payload").textContent);
      const state = {{
        attachments: [],
        nextIndex: 1,
        replaceTargetId: null,
        duplicateNotice: "",
      }};

      const cardGrid = document.querySelector("[data-testid='attachment-card-grid']");
      const liveRegion = document.querySelector("[data-testid='upload-live-region']");
      const duplicateNotice = document.querySelector("[data-testid='duplicate-notice']");
      const filePickerTrigger = document.querySelector("[data-testid='file-picker-trigger']");
      const filePickerInput = document.querySelector("[data-testid='file-picker-input']");
      const cameraTrigger = document.querySelector("[data-testid='camera-capture-trigger']");
      const cameraInput = document.querySelector("[data-testid='camera-capture-input']");
      const replaceInput = document.querySelector("[data-testid='replace-input']");
      const dropZone = document.querySelector("[data-testid='drop-zone']");
      const scanStateLadder = document.querySelector("[data-testid='scan-state-ladder']");
      const scanStateTableBody = document.querySelector("[data-testid='scan-state-table'] tbody");
      const artifactModeVisuals = document.querySelector("[data-testid='artifact-mode-visuals']");
      const artifactModeMatrixBody = document.querySelector("[data-testid='artifact-mode-matrix'] tbody");

      function updateLayout() {{
        document.body.dataset.layout = window.innerWidth < 1080 ? "stacked" : "rail";
        cameraTrigger.hidden = window.innerWidth >= 720;
      }}

      function updateMotion() {{
        document.body.dataset.motion = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "reduce" : "standard";
      }}

      window.addEventListener("resize", updateLayout);
      window.matchMedia("(prefers-reduced-motion: reduce)").addEventListener("change", updateMotion);
      updateLayout();
      updateMotion();

      function bytesLabel(value) {{
        if (value >= 1024 * 1024) {{
          return `${{(value / (1024 * 1024)).toFixed(1)}} MB`;
        }}
        if (value >= 1024) {{
          return `${{Math.round(value / 1024)}} KB`;
        }}
        return `${{value}} B`;
      }}

      function pseudoChecksum(file) {{
        const seed = `${{file.name}}|${{file.size}}|${{file.type}}`;
        let hash = 0;
        for (let index = 0; index < seed.length; index += 1) {{
          hash = (hash << 5) - hash + seed.charCodeAt(index);
          hash |= 0;
        }}
        const normalized = Math.abs(hash).toString(16).padStart(8, "0");
        return `chk_${{normalized}}_${{String(file.size).padStart(6, "0")}}`;
      }}

      function fileExtension(file) {{
        const parts = file.name.toLowerCase().split(".");
        return parts.length > 1 ? `.${{parts.pop()}}` : "";
      }}

      function findRule(file) {{
        const extension = fileExtension(file);
        return payload.acceptanceRules.find((rule) =>
          rule.allowedExtensions.includes(extension) && rule.allowedMimeFamilies.includes(file.type),
        );
      }}

      function outcomeTone(outcome) {{
        if (outcome === "accepted_safe") return "safe";
        if (outcome === "preview_unavailable_but_file_kept") return "preview";
        if (outcome === "retryable_transfer_failure") return "retry";
        if (outcome.startsWith("quarantined")) return "quarantine";
        return "upload";
      }}

      function outcomePillClass(outcome, statusPhase) {{
        if (statusPhase === "uploading" || statusPhase === "scanning") return "pill pill-upload";
        if (outcome === "accepted_safe" || outcome === "preview_unavailable_but_file_kept") return "pill pill-safe";
        if (outcome === "retryable_transfer_failure") return "pill pill-retry";
        return "pill pill-quarantine";
      }}

      function outcomeLabel(record) {{
        if (record.statusPhase === "uploading") return "Uploading";
        if (record.statusPhase === "scanning") return "Scanning";
        const labels = {{
          accepted_safe: "Accepted",
          preview_unavailable_but_file_kept: "Kept without preview",
          retryable_transfer_failure: "Retry needed",
          quarantined_malware: "Quarantined",
          quarantined_integrity_failure: "Integrity hold",
          quarantined_unsupported_type: "Unsupported",
          quarantined_unreadable: "Unreadable",
          quarantined_size_exceeded: "Too large",
        }};
        return labels[record.outcome] || "Pending";
      }}

      function previewCopy(record) {{
        const mapping = {{
          accepted_safe: ["Structured summary is primary.", "Governed preview is available.", "Open and download remain grant-bound."],
          preview_unavailable_but_file_kept: ["The file is safe and durable.", "Inline preview stays placeholder-only.", "Use governed open or download only if still needed."],
          retryable_transfer_failure: ["The upload never settled into quarantine.", "Retry keeps the same card.", "No durable evidence has been accepted yet."],
          quarantined_malware: ["Unsafe content remains quarantined.", "Replace or remove this file before continuing.", "Preview and handoff stay blocked."],
          quarantined_integrity_failure: ["Checksum or integrity validation failed.", "The source file stays isolated.", "Replace or remove before submit."],
          quarantined_unsupported_type: ["This extension or MIME family is outside the Phase 1 allow-list.", "The file stays visible with a bounded hold.", "Replace or remove before submit."],
          quarantined_unreadable: ["The file could not be read safely enough.", "Safety meaning remains unresolved.", "Replace or remove before submit."],
          quarantined_size_exceeded: ["The file exceeds the accepted size limit.", "The shell keeps the same step anchor.", "Replace with a smaller file or remove it."],
        }};
        const lines = mapping[record.outcome] || ["Waiting for a durable result."];
        return lines.map((line) => `<div>${{line}}</div>`).join("");
      }}

      function summarizeAnnouncement(record) {{
        if (record.statusPhase === "uploading") return `${{record.name}} uploading to quarantine.`;
        if (record.statusPhase === "scanning") return `${{record.name}} scanning for MIME, size, malware, and integrity checks.`;
        if (record.outcome === "accepted_safe") {{
          return record.retryCount > 0
            ? `${{record.name}} accepted safely after retry.`
            : `${{record.name}} accepted safely.`;
        }}
        if (record.outcome === "preview_unavailable_but_file_kept") return `${{record.name}} kept safely without inline preview.`;
        if (record.outcome === "retryable_transfer_failure") return `${{record.name}} needs a local retry.`;
        return `${{record.name}} quarantined.`;
      }}

      function classifyFile(file, attempt = 0) {{
        const extension = fileExtension(file);
        const rule = findRule(file);
        const lowerName = file.name.toLowerCase();
        if (!rule) {{
          return "quarantined_unsupported_type";
        }}
        if (file.size > payload.maxAcceptedBytes) {{
          return "quarantined_size_exceeded";
        }}
        if (attempt === 0 && lowerName.includes("retry")) {{
          return "retryable_transfer_failure";
        }}
        if (lowerName.includes("malware")) {{
          return "quarantined_malware";
        }}
        if (lowerName.includes("integrity")) {{
          return "quarantined_integrity_failure";
        }}
        if (lowerName.includes("unreadable")) {{
          return "quarantined_unreadable";
        }}
        if (lowerName.includes("no-preview") || file.size > payload.maxInlinePreviewBytes || extension === ".heic" && lowerName.includes("placeholder")) {{
          return "preview_unavailable_but_file_kept";
        }}
        return "accepted_safe";
      }}

      function createRecord(file) {{
        const checksum = pseudoChecksum(file);
        const fingerprint = `${{checksum}}|${{file.type}}|${{file.size}}`;
        const existing = state.attachments.find((row) => row.fingerprint === fingerprint);
        if (existing) {{
          existing.duplicateCount += 1;
          state.duplicateNotice = `Duplicate upload replayed to ${{existing.name}}. The existing card remains authoritative.`;
          announce(state.duplicateNotice);
          duplicateNotice.textContent = state.duplicateNotice;
          renderCards();
          return null;
        }}
        const finalOutcome = classifyFile(file, 0);
        return {{
          id: `att-card-${{state.nextIndex += 1}}`,
          name: file.name,
          size: file.size,
          type: file.type,
          checksum,
          fingerprint,
          retryCount: 0,
          duplicateCount: 0,
          statusPhase: "uploading",
          outcome: finalOutcome,
          finalOutcome,
          grantRequired: finalOutcome === "accepted_safe" || finalOutcome === "preview_unavailable_but_file_kept",
          source: "picker",
        }};
      }}

      function announce(message) {{
        liveRegion.textContent = message;
      }}

      function settleRecord(record) {{
        window.setTimeout(() => {{
          record.statusPhase = "scanning";
          renderCards();
          announce(summarizeAnnouncement(record));
        }}, 120);
        window.setTimeout(() => {{
          record.statusPhase = "settled";
          renderCards();
          announce(summarizeAnnouncement(record));
        }}, 300);
      }}

      function enqueueFiles(files, source) {{
        Array.from(files).forEach((file) => {{
          const record = createRecord(file);
          if (!record) {{
            return;
          }}
          record.source = source;
          state.attachments.push(record);
          renderCards();
          announce(summarizeAnnouncement(record));
          settleRecord(record);
        }});
      }}

      function actionButton(testId, label, className = "button-quiet", extra = "") {{
        return `<button type="button" class="${{className}}" data-testid="${{testId}}" ${{extra}}>${{label}}</button>`;
      }}

      function renderCards() {{
        duplicateNotice.textContent = state.duplicateNotice;
        cardGrid.innerHTML = state.attachments
          .map((record) => {{
            const tone = record.statusPhase === "settled" ? outcomeTone(record.outcome) : "upload";
            const preview = previewCopy(record);
            const meta = [
              `<span>${{bytesLabel(record.size)}}</span>`,
              `<span>${{record.type || "unknown/type"}}</span>`,
              `<span>${{record.checksum}}</span>`,
            ].join("");

            const actions = [];
            if (record.statusPhase === "settled" && record.outcome === "retryable_transfer_failure") {{
              actions.push(actionButton(`retry-${{record.id}}`, "Retry", "button-secondary"));
            }}
            if (record.statusPhase === "settled" && (record.outcome === "accepted_safe" || record.outcome === "preview_unavailable_but_file_kept")) {{
              actions.push(actionButton(`replace-${{record.id}}`, "Replace", "button-secondary"));
              actions.push(actionButton(`remove-${{record.id}}`, "Remove"));
              if (record.outcome === "accepted_safe") {{
                actions.push(actionButton(`open-${{record.id}}`, "Open", "button-quiet", 'data-grant="required" data-raw-url="forbidden"'));
              }} else {{
                actions.push(actionButton(`download-${{record.id}}`, "Download", "button-quiet", 'data-grant="required" data-raw-url="forbidden"'));
              }}
            }}
            if (record.statusPhase === "settled" && record.outcome.startsWith("quarantined")) {{
              actions.push(actionButton(`replace-${{record.id}}`, "Replace", "button-secondary"));
              actions.push(actionButton(`remove-${{record.id}}`, "Remove"));
            }}
            if (record.statusPhase !== "settled") {{
              actions.push(actionButton(`pending-${{record.id}}`, "Waiting", "button-quiet", "disabled"));
            }}

            return `
              <article
                class="attachment-card"
                data-testid="attachment-card-${{record.id}}"
                data-state-tone="${{tone}}"
                data-outcome="${{record.outcome}}"
                data-status-phase="${{record.statusPhase}}"
              >
                <div class="card-head">
                  <div class="card-title">
                    <strong>${{record.name}}</strong>
                    <div class="card-subtle">Same-shell evidence card</div>
                  </div>
                  <span class="${{outcomePillClass(record.outcome, record.statusPhase)}}" data-testid="state-pill-${{record.id}}">
                    ${{outcomeLabel(record)}}
                  </span>
                </div>
                <div class="card-meta">${{meta}}</div>
                <div class="card-preview" data-testid="preview-${{record.id}}">
                  <strong>${{record.statusPhase === "settled" ? "Current posture" : "In progress"}}</strong>
                  ${{preview}}
                </div>
                <div class="card-actions">${{actions.join("")}}</div>
              </article>
            `;
          }})
          .join("");
      }}

      function renderStaticParity() {{
        scanStateLadder.innerHTML = payload.scanStateLadder
          .map((row, index) => `
            <div class="ladder-step" data-testid="scan-step-${{row.stateKey}}" data-tone="${{row.tone}}">
              <div class="ladder-index">${{index + 1}}</div>
              <div>
                <strong>${{row.label}}</strong>
                <p>${{row.summary}}</p>
              </div>
            </div>
          `)
          .join("");

        scanStateTableBody.innerHTML = payload.scanStateLadder
          .map((row) => `
            <tr>
              <td>${{row.label}}</td>
              <td>${{row.tone}}</td>
              <td>${{row.summary}}</td>
            </tr>
          `)
          .join("");

        artifactModeVisuals.innerHTML = payload.artifactModes
          .map((row) => `
            <div class="mode-tile" data-testid="artifact-mode-${{row.modeKey}}">
              <strong>${{row.label}}</strong>
              <div class="card-subtle">${{row.artifactStageMode}}</div>
              <p>${{row.sameShellContinuity}}</p>
            </div>
          `)
          .join("");

        artifactModeMatrixBody.innerHTML = payload.artifactModes
          .map((row) => `
            <tr>
              <td>${{row.label}}</td>
              <td>${{row.artifactStageMode}}</td>
              <td>${{row.previewVisibility}}</td>
              <td>${{row.openAction}}</td>
              <td>${{row.sameShellContinuity}}</td>
            </tr>
          `)
          .join("");
      }}

      filePickerTrigger.addEventListener("click", () => filePickerInput.click());
      cameraTrigger.addEventListener("click", () => cameraInput.click());
      filePickerInput.addEventListener("change", (event) => enqueueFiles(event.target.files, "picker"));
      cameraInput.addEventListener("change", (event) => enqueueFiles(event.target.files, "camera"));

      replaceInput.addEventListener("change", (event) => {{
        if (!state.replaceTargetId || !event.target.files.length) return;
        const record = state.attachments.find((row) => row.id === state.replaceTargetId);
        if (!record) return;
        const file = event.target.files[0];
        record.name = file.name;
        record.size = file.size;
        record.type = file.type;
        record.checksum = pseudoChecksum(file);
        record.fingerprint = `${{record.checksum}}|${{file.type}}|${{file.size}}`;
        record.retryCount = 0;
        record.finalOutcome = classifyFile(file, 0);
        record.outcome = record.finalOutcome;
        record.statusPhase = "uploading";
        state.replaceTargetId = null;
        renderCards();
        announce(`${{record.name}} replacing the existing card.`);
        settleRecord(record);
      }});

      dropZone.addEventListener("dragenter", (event) => {{
        event.preventDefault();
        dropZone.dataset.dragging = "true";
      }});
      dropZone.addEventListener("dragover", (event) => {{
        event.preventDefault();
        dropZone.dataset.dragging = "true";
      }});
      dropZone.addEventListener("dragleave", (event) => {{
        event.preventDefault();
        if (!dropZone.contains(event.relatedTarget)) {{
          dropZone.dataset.dragging = "false";
        }}
      }});
      dropZone.addEventListener("drop", (event) => {{
        event.preventDefault();
        dropZone.dataset.dragging = "false";
        enqueueFiles(event.dataTransfer.files, "drop");
      }});

      document.addEventListener("click", (event) => {{
        const button = event.target.closest("button");
        if (!button) return;
        const testId = button.dataset.testid || button.getAttribute("data-testid");
        if (!testId) return;
        if (testId.startsWith("retry-")) {{
          const recordId = testId.replace("retry-", "");
          const record = state.attachments.find((row) => row.id === recordId);
          if (!record) return;
          record.retryCount += 1;
          record.outcome = "accepted_safe";
          record.statusPhase = "uploading";
          state.duplicateNotice = "";
          renderCards();
          announce(`${{record.name}} retry started.`);
          settleRecord(record);
        }}
        if (testId.startsWith("remove-")) {{
          const recordId = testId.replace("remove-", "");
          state.attachments = state.attachments.filter((row) => row.id !== recordId);
          state.duplicateNotice = "";
          renderCards();
          announce("Attachment removed from the current shell.");
        }}
        if (testId.startsWith("replace-")) {{
          state.replaceTargetId = testId.replace("replace-", "");
          replaceInput.click();
        }}
        if (testId.startsWith("open-") || testId.startsWith("download-")) {{
          const recordId = testId.replace("open-", "").replace("download-", "");
          const record = state.attachments.find((row) => row.id === recordId);
          if (!record) return;
          announce(`${{record.name}} action is grant-bound and same-shell governed.`);
        }}
      }});

      renderStaticParity();
      renderCards();
    </script>
  </body>
</html>
"""


def main() -> None:
    prereq = load_prerequisites()
    acceptance_policy = build_acceptance_policy(prereq)
    scan_schema = build_scan_schema()
    projection_modes = build_projection_modes(acceptance_policy)

    write_json(ACCEPTANCE_POLICY_PATH, acceptance_policy)
    write_json(SCAN_SCHEMA_PATH, scan_schema)
    write_json(PROJECTION_MODES_PATH, projection_modes)
    write_csv(
        CLASSIFICATION_MATRIX_PATH,
        CLASSIFICATION_ROWS,
        [
            "scenarioId",
            "inputSignature",
            "acceptanceVerdict",
            "classificationOutcome",
            "scanState",
            "emittedEventNames",
            "documentReferenceAction",
            "artifactStageMode",
            "safetyMeaningState",
            "downstreamDisposition",
            "duplicateDisposition",
            "continuityPosture",
            "notes",
        ],
    )
    write_csv(
        TEST_MATRIX_PATH,
        TEST_ROWS,
        [
            "testCaseId",
            "surface",
            "category",
            "scenario",
            "requiredOutcome",
            "proof",
        ],
    )
    write_text(ARCHITECTURE_DOC_PATH, render_architecture_doc(acceptance_policy, projection_modes))
    write_text(SECURITY_DOC_PATH, render_security_doc(acceptance_policy, prereq))
    write_text(FRONTEND_DOC_PATH, render_frontend_doc(acceptance_policy, projection_modes))
    write_text(LAB_HTML_PATH, render_lab_html(acceptance_policy, projection_modes))


if __name__ == "__main__":
    main()
