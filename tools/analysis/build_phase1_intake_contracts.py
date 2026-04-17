#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[2]
DATA_ANALYSIS_DIR = ROOT / "data" / "analysis"
DATA_CONTRACTS_DIR = ROOT / "data" / "contracts"
DOCS_ARCHITECTURE_DIR = ROOT / "docs" / "architecture"
DOCS_FRONTEND_DIR = ROOT / "docs" / "frontend"
DOCS_API_DIR = ROOT / "docs" / "api"

FRONTEND_MANIFESTS_PATH = DATA_ANALYSIS_DIR / "frontend_contract_manifests.json"
SURFACE_VERDICTS_PATH = DATA_ANALYSIS_DIR / "surface_authority_verdicts.json"
PERSISTENT_SHELL_CONTRACTS_PATH = DATA_ANALYSIS_DIR / "persistent_shell_contracts.json"
AUDIENCE_BINDINGS_PATH = DATA_ANALYSIS_DIR / "audience_surface_runtime_bindings.json"

JOURNEY_CONTRACT_DOC_PATH = DOCS_ARCHITECTURE_DIR / "139_web_intake_journey_contract.md"
EXPERIENCE_SPEC_DOC_PATH = DOCS_FRONTEND_DIR / "139_patient_intake_experience_spec.md"
API_CONTRACT_DOC_PATH = DOCS_API_DIR / "139_phase1_public_intake_api_contracts.md"
SCHEMA_LOCK_DOC_PATH = DOCS_API_DIR / "139_phase1_submission_schema_lock.md"
EVENT_CATALOG_DOC_PATH = DOCS_ARCHITECTURE_DIR / "139_intake_event_catalog.md"
ATLAS_HTML_PATH = DOCS_FRONTEND_DIR / "139_intake_journey_atlas.html"

DRAFT_SCHEMA_PATH = DATA_CONTRACTS_DIR / "139_intake_draft_view.schema.json"
SURFACE_BINDING_SCHEMA_PATH = DATA_CONTRACTS_DIR / "139_intake_surface_runtime_binding.schema.json"
SUBMIT_SETTLEMENT_SCHEMA_PATH = DATA_CONTRACTS_DIR / "139_intake_submit_settlement.schema.json"
OUTCOME_ARTIFACT_SCHEMA_PATH = DATA_CONTRACTS_DIR / "139_intake_outcome_presentation_artifact.schema.json"
EVENT_CATALOG_JSON_PATH = DATA_CONTRACTS_DIR / "139_intake_event_catalog.json"
JOURNEY_MATRIX_PATH = DATA_ANALYSIS_DIR / "139_journey_step_matrix.csv"

TASK_ID = "seq_139"
VISUAL_MODE = "Patient_Intake_Mission_Frame"
CAPTURED_ON = "2026-04-14"
INTAKE_CONVERGENCE_CONTRACT_REF = "ICC_PHASE1_SELF_SERVICE_FORM_V1"
PATIENT_SHELL_CONSISTENCY_PROJECTION_REF = "PSCP_139_PATIENT_INTAKE_MISSION_FRAME_V1"
PATIENT_EMBEDDED_BROWSER_REF = "PESP_139_BROWSER_CONTEXT_V1"
PATIENT_EMBEDDED_PENDING_REF = "PESP_139_EMBEDDED_SESSION_PENDING_V1"
PATIENT_SHELL_CONTINUITY_KEY = "patient.portal.requests"
SURFACE_CHANNEL_PROFILE = "browser"
DRAFT_SCHEMA_VERSION = "INTAKE_DRAFT_VIEW_V1"
OUTBOUND_NAV_POLICY_REF = "ONGP_139_PATIENT_INTAKE_OUTCOME_V1"

SOURCE_PRECEDENCE = [
    "prompt/139.md",
    "prompt/shared_operating_contract_136_to_145.md",
    "prompt/AGENT.md",
    "prompt/checklist.md",
    "blueprint/phase-1-the-red-flag-gate.md#1A. Journey contract and intake schema lock",
    "blueprint/phase-1-the-red-flag-gate.md#1B. Draft lifecycle and autosave engine",
    "blueprint/phase-1-the-red-flag-gate.md#1E. Submit normalization and synchronous safety engine",
    "blueprint/phase-1-the-red-flag-gate.md#1F. Triage handoff, receipt, ETA, and minimal status tracking",
    "blueprint/phase-cards.md#card-2-phase-1-the-red-flag-gate",
    "blueprint/phase-0-the-foundation-protocol.md#SubmissionEnvelope",
    "blueprint/phase-0-the-foundation-protocol.md#SubmissionPromotionRecord",
    "blueprint/phase-0-the-foundation-protocol.md#ArtifactPresentationContract",
    "blueprint/phase-0-the-foundation-protocol.md#OutboundNavigationGrant",
    "blueprint/platform-frontend-blueprint.md#Shell and route-family ownership rules",
    "blueprint/patient-portal-experience-architecture-blueprint.md#Patient audience coverage contract",
    "blueprint/canonical-ui-contract-kernel.md#Canonical contracts",
    "blueprint/design-token-foundation.md#Machine-readable export contract",
    "blueprint/ux-quiet-clarity-redesign.md#Control priorities",
    "blueprint/accessibility-and-content-system-contract.md#Canonical accessibility and content objects",
    "blueprint/forensic-audit-findings.md#Finding 118",
    "blueprint/forensic-audit-findings.md#Finding 119",
    "blueprint/forensic-audit-findings.md#Finding 120",
    "data/analysis/frontend_contract_manifests.json",
    "data/analysis/surface_authority_verdicts.json",
    "data/analysis/persistent_shell_contracts.json",
    "data/analysis/audience_surface_runtime_bindings.json",
]

UPSTREAM_INPUTS = [
    "data/analysis/frontend_contract_manifests.json",
    "data/analysis/surface_authority_verdicts.json",
    "data/analysis/persistent_shell_contracts.json",
    "data/analysis/audience_surface_runtime_bindings.json",
]

REQUEST_TYPE_ENUM = ["Symptoms", "Meds", "Admin", "Results"]
STEP_KEY_ORDER = [
    "landing",
    "request_type",
    "details",
    "supporting_files",
    "contact_preferences",
    "review_submit",
    "resume_recovery",
    "urgent_outcome",
    "receipt_outcome",
    "request_status",
]
SUBMIT_RESULTS = [
    "urgent_diversion",
    "triage_ready",
    "stale_recoverable",
    "denied_scope",
    "failed_safe",
]
ARTIFACT_STATES = [
    "summary_only",
    "inline_renderable",
    "external_handoff_ready",
    "recovery_only",
]

GAP_RESOLUTIONS = [
    {
        "gapId": "GAP_RESOLVED_139_PUBLIC_PATH_FREEZE",
        "summary": "The public journey now has one exact Phase 1 path set with stable route patterns, outcome paths, and recovery paths instead of narrative-only intent.",
    },
    {
        "gapId": "GAP_RESOLVED_139_SINGLE_PRE_SUBMIT_MODEL",
        "summary": "Browser, embedded, and future authenticated uplift all resolve through one IntakeConvergenceContract and one IntakeDraftView schema.",
    },
    {
        "gapId": "GAP_RESOLVED_139_SUBMIT_SUCCESS_REQUIRES_SETTLEMENT_CHAIN",
        "summary": "Receipt and status visibility now require IntakeSubmitSettlement plus the SubmissionPromotionRecord chain rather than local browser success inference.",
    },
    {
        "gapId": "GAP_RESOLVED_139_ARTIFACT_AND_HANDOFF_GOVERNANCE",
        "summary": "Receipt, urgent guidance, and status surfaces are bound to ArtifactPresentationContract and OutboundNavigationGrant instead of raw URLs or detached pages.",
    },
    {
        "gapId": "GAP_RESOLVED_139_SAME_SHELL_RECOVERY",
        "summary": "Urgent diversion, stale recovery, and failed-safe outcomes remain in one same-shell lineage instead of collapsing to generic expired-link or error pages.",
    },
]

BOUNDED_GAPS = [
    {
        "gapId": "GAP_139_QUESTIONNAIRE_DETAIL_PENDING_SEQ_140",
        "summary": "Question semantics, per-type field rules, and questionnaire decision tables are deferred to seq_140 without changing this route or schema spine.",
    },
    {
        "gapId": "GAP_139_ATTACHMENT_RULEBOOK_PENDING_SEQ_141",
        "summary": "Attachment media acceptance, classification, and quarantine policy detail is frozen only at the event and API seam here; seq_141 hardens the rulebook.",
    },
    {
        "gapId": "GAP_139_URGENT_COPY_AND_RULEBOOK_PENDING_SEQ_142",
        "summary": "Urgent-diversion wording and the rules-first red-flag metadata pack remain bounded follow-on work in seq_142.",
    },
    {
        "gapId": "GAP_139_EMBEDDED_RUNTIME_PUBLICATION_PENDING",
        "summary": "Embedded posture is modeled as a future-compatible blocked seam so later NHS App work cannot fork the data model or promotion boundary.",
    },
    {
        "gapId": "GAP_139_AUTHENTICATED_UPLIFT_ROUTE_PUBLICATION_PENDING",
        "summary": "Authenticated track-my-request uplift stays reserved for later route publication work and may narrow chrome only, not semantics.",
    },
]

FORBIDDEN_DUPLICATES = [
    {
        "eventName": "intake.submitted",
        "reason": "request.submitted is the only canonical submit event for the durable envelope-to-request promotion boundary.",
    }
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


def extract_phase0_context() -> dict[str, Any]:
    manifests = load_json(FRONTEND_MANIFESTS_PATH)
    manifest_rows = manifests.get("frontendContractManifests", [])
    intake_manifest = next(
        (
            row
            for row in manifest_rows
            if row.get("frontendContractManifestId") == "FCM_050_PATIENT_PUBLIC_ENTRY_V1"
        ),
        None,
    )
    ensure(
        intake_manifest is not None,
        "PREREQUISITE_GAP_139_PATIENT_PUBLIC_ENTRY_MANIFEST_MISSING",
    )

    surface_verdicts = load_json(SURFACE_VERDICTS_PATH)
    verdict_rows = surface_verdicts.get("rows", [])
    intake_web = next(
        (row for row in verdict_rows if row.get("inventorySurfaceRef") == "surf_patient_intake_web"),
        None,
    )
    intake_phone = next(
        (row for row in verdict_rows if row.get("inventorySurfaceRef") == "surf_patient_intake_phone"),
        None,
    )
    ensure(
        intake_web is not None and intake_phone is not None,
        "PREREQUISITE_GAP_139_PATIENT_INTAKE_SURFACE_TRUTH_MISSING",
    )

    shell_contracts = load_json(PERSISTENT_SHELL_CONTRACTS_PATH)
    patient_shell = next(
        (row for row in shell_contracts.get("shells", []) if row.get("shellSlug") == "patient-web"),
        None,
    )
    ensure(patient_shell is not None, "PREREQUISITE_GAP_139_PATIENT_SHELL_CONTRACT_MISSING")
    intake_claim = next(
        (
            claim
            for claim in patient_shell.get("routeClaims", [])
            if claim.get("routeFamilyRef") == "rf_intake_self_service"
        ),
        None,
    )
    ensure(intake_claim is not None, "PREREQUISITE_GAP_139_INTAKE_ROUTE_CLAIM_MISSING")

    audience_bindings = load_json(AUDIENCE_BINDINGS_PATH)
    local_runtime_ref = audience_bindings.get("localRuntimePublicationBundleRef")
    local_release_parity_ref = audience_bindings.get("localReleasePublicationParityRef")
    ensure(
        local_runtime_ref and local_release_parity_ref,
        "PREREQUISITE_GAP_139_LOCAL_RUNTIME_PUBLICATION_REFS_MISSING",
    )

    return {
        "intake_manifest": intake_manifest,
        "intake_web_verdict": intake_web,
        "intake_phone_verdict": intake_phone,
        "patient_shell": patient_shell,
        "intake_claim": intake_claim,
        "local_runtime_ref": local_runtime_ref,
        "local_release_parity_ref": local_release_parity_ref,
    }


def build_journey_rows(context: dict[str, Any]) -> list[dict[str, str]]:
    base_route_family = "rf_intake_self_service"
    quiet_status_saved = "Saved posture derives from DraftSaveSettlement plus DraftContinuityEvidenceProjection only."
    quiet_status_review = "Quiet strip stays singular; no toast and banner duplication."
    recovery_posture = (
        "Same-shell recovery only while DraftContinuityEvidenceProjection.validationState covers the same "
        "draft lineage, selected anchor, and release tuple."
    )

    return [
        {
            "step_key": "landing",
            "step_title": "Landing and service explanation",
            "route_pattern": "/intake/start",
            "purpose": "Establish scope, service boundaries, and the emergency escape route before draft creation.",
            "inputs_collected": "none",
            "output_projection_fields": "serviceScopeSummary; emergencyEscapePolicy; intakeConvergenceContractRef",
            "route_family": base_route_family,
            "recovery_posture": "No authoritative saved state yet; same shell may show draft-not-started posture only.",
            "next_transitions": "request_type",
            "selected_anchor_key": "request-start",
            "primary_cta": "Start your request",
            "quiet_status_state": "draft_not_started",
            "surface_route_contract_ref": "ISRC_139_INTAKE_LANDING_V1",
            "schema_binding": "IntakeDraftView",
            "same_shell_key": PATIENT_SHELL_CONTINUITY_KEY,
        },
        {
            "step_key": "request_type",
            "step_title": "Request type",
            "route_pattern": "/intake/drafts/:draftPublicId/request-type",
            "purpose": "Choose one canonical intake type and lock the questionnaire branch without forking the draft model.",
            "inputs_collected": "requestType",
            "output_projection_fields": "draftPublicId; requestType; uiJourneyState.currentStepKey",
            "route_family": base_route_family,
            "recovery_posture": recovery_posture,
            "next_transitions": "details; resume_recovery",
            "selected_anchor_key": "request-start",
            "primary_cta": "Continue",
            "quiet_status_state": quiet_status_saved,
            "surface_route_contract_ref": "ISRC_139_INTAKE_REQUEST_TYPE_V1",
            "schema_binding": "IntakeDraftView",
            "same_shell_key": PATIENT_SHELL_CONTINUITY_KEY,
        },
        {
            "step_key": "details",
            "step_title": "Details",
            "route_pattern": "/intake/drafts/:draftPublicId/details",
            "purpose": "Capture the bounded narrative and the structured answers for the chosen request type.",
            "inputs_collected": "structuredAnswers; freeTextNarrative",
            "output_projection_fields": "structuredAnswers; freeTextNarrative; uiJourneyState.completedStepKeys",
            "route_family": base_route_family,
            "recovery_posture": recovery_posture,
            "next_transitions": "supporting_files; review_submit; resume_recovery",
            "selected_anchor_key": "request-proof",
            "primary_cta": "Save and continue",
            "quiet_status_state": quiet_status_saved,
            "surface_route_contract_ref": "ISRC_139_INTAKE_DETAILS_V1",
            "schema_binding": "IntakeDraftView",
            "same_shell_key": PATIENT_SHELL_CONTINUITY_KEY,
        },
        {
            "step_key": "supporting_files",
            "step_title": "Supporting files",
            "route_pattern": "/intake/drafts/:draftPublicId/supporting-files",
            "purpose": "Collect optional supporting evidence through governed attachment initiation rather than raw uploads.",
            "inputs_collected": "attachmentRefs",
            "output_projection_fields": "attachmentRefs; channelCapabilityCeiling.canUploadFiles",
            "route_family": base_route_family,
            "recovery_posture": recovery_posture,
            "next_transitions": "contact_preferences; review_submit; resume_recovery",
            "selected_anchor_key": "request-proof",
            "primary_cta": "Continue",
            "quiet_status_state": quiet_status_review,
            "surface_route_contract_ref": "ISRC_139_INTAKE_SUPPORTING_FILES_V1",
            "schema_binding": "IntakeDraftView",
            "same_shell_key": PATIENT_SHELL_CONTINUITY_KEY,
        },
        {
            "step_key": "contact_preferences",
            "step_title": "Contact preferences",
            "route_pattern": "/intake/drafts/:draftPublicId/contact-preferences",
            "purpose": "Capture the bounded communication preference set used for receipt and follow-up contact.",
            "inputs_collected": "contactPreferences",
            "output_projection_fields": "contactPreferences; channelCapabilityCeiling; uiJourneyState.currentPathname",
            "route_family": base_route_family,
            "recovery_posture": recovery_posture,
            "next_transitions": "review_submit; resume_recovery",
            "selected_anchor_key": "request-return",
            "primary_cta": "Review your request",
            "quiet_status_state": quiet_status_saved,
            "surface_route_contract_ref": "ISRC_139_INTAKE_CONTACT_PREFERENCES_V1",
            "schema_binding": "IntakeDraftView",
            "same_shell_key": PATIENT_SHELL_CONTINUITY_KEY,
        },
        {
            "step_key": "review_submit",
            "step_title": "Review and submit",
            "route_pattern": "/intake/drafts/:draftPublicId/review",
            "purpose": "Freeze the current draft summary, show the emergency reminder again, and route submit through the settlement chain.",
            "inputs_collected": "submitIntent; final patient confirmation",
            "output_projection_fields": "draftVersion; requestType; contactPreferences; transitionEnvelopeRef",
            "route_family": base_route_family,
            "recovery_posture": "Same-shell review state only. Success is authoritative only after IntakeSubmitSettlement plus SubmissionPromotionRecord.",
            "next_transitions": "urgent_outcome; receipt_outcome; resume_recovery",
            "selected_anchor_key": "request-return",
            "primary_cta": "Submit request",
            "quiet_status_state": "submitting_authoritative",
            "surface_route_contract_ref": "ISRC_139_INTAKE_REVIEW_SUBMIT_V1",
            "schema_binding": "IntakeSubmitSettlement",
            "same_shell_key": PATIENT_SHELL_CONTINUITY_KEY,
        },
        {
            "step_key": "resume_recovery",
            "step_title": "Resume recovery",
            "route_pattern": "/intake/drafts/:draftPublicId/recovery?resumeToken=:resumeToken",
            "purpose": "Recover a stale, superseded, or newly rebound draft in the same shell without opening a second draft lane.",
            "inputs_collected": "resumeToken; governed rebind acknowledgement",
            "output_projection_fields": "resumeToken; uiJourneyState.sameShellRecoveryState; draftVersion",
            "route_family": base_route_family,
            "recovery_posture": "Bounded same-shell recovery only. Generic expired-link and detached error pages are forbidden steady-state behavior.",
            "next_transitions": "request_type; details; supporting_files; contact_preferences; review_submit",
            "selected_anchor_key": "request-return",
            "primary_cta": "Resume safely",
            "quiet_status_state": "resume_safely",
            "surface_route_contract_ref": "ISRC_139_INTAKE_RESUME_RECOVERY_V1",
            "schema_binding": "IntakeDraftView",
            "same_shell_key": PATIENT_SHELL_CONTINUITY_KEY,
        },
        {
            "step_key": "urgent_outcome",
            "step_title": "Urgent advice outcome",
            "route_pattern": "/intake/requests/:requestPublicId/urgent-guidance",
            "purpose": "Render the urgent pathway change in place for the same lineage once urgent diversion is durably required or completed.",
            "inputs_collected": "none",
            "output_projection_fields": "requestPublicId; presentationArtifactRef; result=urgent_diversion",
            "route_family": base_route_family,
            "recovery_posture": "Same-shell urgent outcome. If publication or release drifts, degrade through ReleaseRecoveryDisposition instead of implying routine success.",
            "next_transitions": "request_status",
            "selected_anchor_key": "request-return",
            "primary_cta": "Get urgent help now",
            "quiet_status_state": "outcome_authoritative",
            "surface_route_contract_ref": "ISRC_139_INTAKE_URGENT_OUTCOME_V1",
            "schema_binding": "IntakeOutcomePresentationArtifact",
            "same_shell_key": PATIENT_SHELL_CONTINUITY_KEY,
        },
        {
            "step_key": "receipt_outcome",
            "step_title": "Receipt outcome",
            "route_pattern": "/intake/requests/:requestPublicId/receipt",
            "purpose": "Morph the review surface into the calm receipt for the same request lineage after triage-ready promotion settles.",
            "inputs_collected": "none",
            "output_projection_fields": "requestPublicId; presentationArtifactRef; result=triage_ready",
            "route_family": base_route_family,
            "recovery_posture": "Same-shell receipt. Stale publication truth downgrades in place instead of showing a detached success page.",
            "next_transitions": "request_status",
            "selected_anchor_key": "request-return",
            "primary_cta": "Track request status",
            "quiet_status_state": "receipt_authoritative",
            "surface_route_contract_ref": "ISRC_139_INTAKE_RECEIPT_OUTCOME_V1",
            "schema_binding": "IntakeOutcomePresentationArtifact",
            "same_shell_key": PATIENT_SHELL_CONTINUITY_KEY,
        },
        {
            "step_key": "request_status",
            "step_title": "Track my request",
            "route_pattern": "/intake/requests/:requestPublicId/status",
            "purpose": "Show the minimal top-level patient state and next-step message without exposing internal queue detail.",
            "inputs_collected": "none",
            "output_projection_fields": "requestPublicId; artifactState; visibilityTier; summarySafetyTier",
            "route_family": base_route_family,
            "recovery_posture": "Status remains under the same shell and same request anchor; recovery-only posture must preserve this route rather than replace it.",
            "next_transitions": "receipt_outcome",
            "selected_anchor_key": "request-return",
            "primary_cta": "Refresh status",
            "quiet_status_state": "status_authoritative",
            "surface_route_contract_ref": "ISRC_139_INTAKE_REQUEST_STATUS_V1",
            "schema_binding": "IntakeOutcomePresentationArtifact",
            "same_shell_key": PATIENT_SHELL_CONTINUITY_KEY,
        },
    ]


def build_surface_binding_examples(context: dict[str, Any], journey_rows: list[dict[str, str]]) -> list[dict[str, Any]]:
    manifest = context["intake_manifest"]
    return [
        {
            "intakeSurfaceRuntimeBindingId": "ISRB_139_PUBLIC_ENTRY_V1",
            "routeFamilyRef": "rf_intake_self_service",
            "audienceSurfaceRuntimeBindingRef": manifest["audienceSurfaceRuntimeBindingRef"],
            "surfaceRouteContractRef": "ISRC_139_INTAKE_LANDING_V1",
            "surfacePublicationRef": manifest["surfacePublicationRef"],
            "runtimePublicationBundleRef": context["local_runtime_ref"],
            "releasePublicationParityRef": context["local_release_parity_ref"],
            "patientShellConsistencyProjectionRef": PATIENT_SHELL_CONSISTENCY_PROJECTION_REF,
            "patientEmbeddedSessionProjectionRef": PATIENT_EMBEDDED_BROWSER_REF,
            "routeFreezeDispositionRef": manifest["routeFreezeDispositionRef"],
            "releaseRecoveryDispositionRef": manifest["releaseRecoveryDispositionRef"],
            "bindingState": "recovery_only",
            "validatedAt": now_iso(),
        },
        {
            "intakeSurfaceRuntimeBindingId": "ISRB_139_RESUME_RECOVERY_V1",
            "routeFamilyRef": "rf_intake_self_service",
            "audienceSurfaceRuntimeBindingRef": manifest["audienceSurfaceRuntimeBindingRef"],
            "surfaceRouteContractRef": "ISRC_139_INTAKE_RESUME_RECOVERY_V1",
            "surfacePublicationRef": manifest["surfacePublicationRef"],
            "runtimePublicationBundleRef": context["local_runtime_ref"],
            "releasePublicationParityRef": context["local_release_parity_ref"],
            "patientShellConsistencyProjectionRef": PATIENT_SHELL_CONSISTENCY_PROJECTION_REF,
            "patientEmbeddedSessionProjectionRef": PATIENT_EMBEDDED_BROWSER_REF,
            "routeFreezeDispositionRef": manifest["routeFreezeDispositionRef"],
            "releaseRecoveryDispositionRef": "RRD_PATIENT_INTAKE_RECOVERY",
            "bindingState": "recovery_only",
            "validatedAt": now_iso(),
        },
        {
            "intakeSurfaceRuntimeBindingId": "ISRB_139_URGENT_OUTCOME_V1",
            "routeFamilyRef": "rf_intake_self_service",
            "audienceSurfaceRuntimeBindingRef": manifest["audienceSurfaceRuntimeBindingRef"],
            "surfaceRouteContractRef": "ISRC_139_INTAKE_URGENT_OUTCOME_V1",
            "surfacePublicationRef": manifest["surfacePublicationRef"],
            "runtimePublicationBundleRef": context["local_runtime_ref"],
            "releasePublicationParityRef": context["local_release_parity_ref"],
            "patientShellConsistencyProjectionRef": PATIENT_SHELL_CONSISTENCY_PROJECTION_REF,
            "patientEmbeddedSessionProjectionRef": PATIENT_EMBEDDED_BROWSER_REF,
            "routeFreezeDispositionRef": manifest["routeFreezeDispositionRef"],
            "releaseRecoveryDispositionRef": "RRD_PATIENT_INTAKE_RECOVERY",
            "bindingState": "recovery_only",
            "validatedAt": now_iso(),
        },
        {
            "intakeSurfaceRuntimeBindingId": "ISRB_139_RECEIPT_OUTCOME_V1",
            "routeFamilyRef": "rf_intake_self_service",
            "audienceSurfaceRuntimeBindingRef": manifest["audienceSurfaceRuntimeBindingRef"],
            "surfaceRouteContractRef": "ISRC_139_INTAKE_RECEIPT_OUTCOME_V1",
            "surfacePublicationRef": manifest["surfacePublicationRef"],
            "runtimePublicationBundleRef": context["local_runtime_ref"],
            "releasePublicationParityRef": context["local_release_parity_ref"],
            "patientShellConsistencyProjectionRef": PATIENT_SHELL_CONSISTENCY_PROJECTION_REF,
            "patientEmbeddedSessionProjectionRef": PATIENT_EMBEDDED_BROWSER_REF,
            "routeFreezeDispositionRef": manifest["routeFreezeDispositionRef"],
            "releaseRecoveryDispositionRef": "RRD_PATIENT_INTAKE_RECOVERY",
            "bindingState": "recovery_only",
            "validatedAt": now_iso(),
        },
        {
            "intakeSurfaceRuntimeBindingId": "ISRB_139_REQUEST_STATUS_V1",
            "routeFamilyRef": "rf_intake_self_service",
            "audienceSurfaceRuntimeBindingRef": manifest["audienceSurfaceRuntimeBindingRef"],
            "surfaceRouteContractRef": "ISRC_139_INTAKE_REQUEST_STATUS_V1",
            "surfacePublicationRef": manifest["surfacePublicationRef"],
            "runtimePublicationBundleRef": context["local_runtime_ref"],
            "releasePublicationParityRef": context["local_release_parity_ref"],
            "patientShellConsistencyProjectionRef": PATIENT_SHELL_CONSISTENCY_PROJECTION_REF,
            "patientEmbeddedSessionProjectionRef": PATIENT_EMBEDDED_BROWSER_REF,
            "routeFreezeDispositionRef": manifest["routeFreezeDispositionRef"],
            "releaseRecoveryDispositionRef": "RRD_PATIENT_INTAKE_RECOVERY",
            "bindingState": "recovery_only",
            "validatedAt": now_iso(),
        },
        {
            "intakeSurfaceRuntimeBindingId": "ISRB_139_EMBEDDED_SEAM_V1",
            "routeFamilyRef": "rf_patient_embedded_channel",
            "audienceSurfaceRuntimeBindingRef": "gap::patient_embedded_public_entry",
            "surfaceRouteContractRef": "ISRC_139_EMBEDDED_PUBLIC_ENTRY_V1",
            "surfacePublicationRef": "gap::patient_embedded_public_entry",
            "runtimePublicationBundleRef": context["local_runtime_ref"],
            "releasePublicationParityRef": context["local_release_parity_ref"],
            "patientShellConsistencyProjectionRef": PATIENT_SHELL_CONSISTENCY_PROJECTION_REF,
            "patientEmbeddedSessionProjectionRef": PATIENT_EMBEDDED_PENDING_REF,
            "routeFreezeDispositionRef": "RFD_139_EMBEDDED_CHROME_PENDING",
            "releaseRecoveryDispositionRef": "RRD_139_EMBEDDED_CHROME_RECOVERY",
            "bindingState": "blocked",
            "validatedAt": now_iso(),
        },
    ]


def build_draft_example(context: dict[str, Any]) -> dict[str, Any]:
    return {
        "draftPublicId": "dft_7k49m2v8pq41",
        "ingressChannel": "self_service_form",
        "surfaceChannelProfile": SURFACE_CHANNEL_PROFILE,
        "intakeConvergenceContractRef": INTAKE_CONVERGENCE_CONTRACT_REF,
        "identityContext": {
            "bindingState": "anonymous",
            "subjectRefPresence": "none",
            "claimResumeState": "not_required",
            "actorBindingState": "anonymous",
        },
        "requestType": "Symptoms",
        "structuredAnswers": {
            "symptom_start_day_count": 2,
            "has_fever": True,
            "pain_location": "throat",
        },
        "freeTextNarrative": "I have had a sore throat and fever for two days and wanted advice.",
        "attachmentRefs": ["att_upload_img_01"],
        "contactPreferences": {
            "preferredChannel": "sms",
            "contactWindow": "weekday_daytime",
            "voicemailAllowed": True,
        },
        "channelCapabilityCeiling": {
            "canUploadFiles": True,
            "canRenderTrackStatus": True,
            "canRenderEmbedded": False,
            "mutatingResumeState": "allowed",
        },
        "draftVersion": 3,
        "lastSavedAt": "2026-04-14T10:15:00Z",
        "resumeToken": "rtk_TyM4QjBvYXQxX3Jlc3VtZQ",
        "uiJourneyState": {
            "currentStepKey": "details",
            "completedStepKeys": ["request_type"],
            "currentPathname": "/intake/drafts/dft_7k49m2v8pq41/details",
            "quietStatusState": "saved_authoritative",
            "sameShellRecoveryState": "stable",
            "shellContinuityKey": PATIENT_SHELL_CONTINUITY_KEY,
            "selectedAnchorKey": "request-proof",
        },
        "draftSchemaVersion": DRAFT_SCHEMA_VERSION,
    }


def build_settlement_examples(context: dict[str, Any], manifest: dict[str, Any]) -> list[dict[str, Any]]:
    base = {
        "draftPublicId": "dft_7k49m2v8pq41",
        "routeIntentBindingRef": "RIB_139_PATIENT_INTAKE_REVIEW_V1",
        "commandActionRecordRef": "CAR_139_PATIENT_INTAKE_SUBMIT_V1",
        "commandSettlementRecordRef": "CSR_139_PATIENT_INTAKE_SUBMIT_V1",
        "transitionEnvelopeRef": "TE_139_PATIENT_INTAKE_REVIEW_TO_OUTCOME_V1",
        "audienceSurfaceRuntimeBindingRef": manifest["audienceSurfaceRuntimeBindingRef"],
        "surfacePublicationRef": manifest["surfacePublicationRef"],
        "runtimePublicationBundleRef": context["local_runtime_ref"],
        "releasePublicationParityRef": context["local_release_parity_ref"],
        "releaseRecoveryDispositionRef": "RRD_PATIENT_INTAKE_RECOVERY",
        "uiTransitionSettlementRecordRef": "UTSR_139_PATIENT_INTAKE_REVIEW_V1",
        "uiTelemetryDisclosureFenceRef": "UTDF_139_PATIENT_INTAKE_SUMMARY_V1",
    }
    return [
        {
            **base,
            "intakeSubmitSettlementId": "ISS_139_TRIAGE_READY_V1",
            "requestPublicId": "req_91x2p4n6mk5",
            "submissionPromotionRecordRef": "SPR_139_REQ_91X2P4N6MK5_V1",
            "patientJourneyLineageRef": "PJL_139_REQ_91X2P4N6MK5_V1",
            "idempotencyRecordRef": "IR_139_SUBMIT_REPLAY_A_V1",
            "presentationArtifactRef": "IOPA_139_RECEIPT_REQ_91X2P4N6MK5_V1",
            "result": "triage_ready",
            "recordedAt": "2026-04-14T10:20:20Z",
        },
        {
            **base,
            "intakeSubmitSettlementId": "ISS_139_URGENT_DIVERSION_V1",
            "requestPublicId": "req_29g7v8x0sy1",
            "submissionPromotionRecordRef": "SPR_139_REQ_29G7V8X0SY1_V1",
            "patientJourneyLineageRef": "PJL_139_REQ_29G7V8X0SY1_V1",
            "idempotencyRecordRef": "IR_139_SUBMIT_REPLAY_B_V1",
            "presentationArtifactRef": "IOPA_139_URGENT_REQ_29G7V8X0SY1_V1",
            "result": "urgent_diversion",
            "recordedAt": "2026-04-14T10:20:40Z",
        },
        {
            **base,
            "intakeSubmitSettlementId": "ISS_139_STALE_RECOVERABLE_V1",
            "requestPublicId": "req_83d5c1l9fn2",
            "submissionPromotionRecordRef": "SPR_139_REQ_83D5C1L9FN2_V1",
            "patientJourneyLineageRef": "PJL_139_REQ_83D5C1L9FN2_V1",
            "idempotencyRecordRef": "IR_139_SUBMIT_REPLAY_C_V1",
            "presentationArtifactRef": "IOPA_139_RECOVERY_REQ_83D5C1L9FN2_V1",
            "result": "stale_recoverable",
            "recordedAt": "2026-04-14T10:21:00Z",
        },
        {
            **base,
            "intakeSubmitSettlementId": "ISS_139_DENIED_SCOPE_V1",
            "requestPublicId": None,
            "submissionPromotionRecordRef": None,
            "patientJourneyLineageRef": None,
            "idempotencyRecordRef": "IR_139_SUBMIT_REPLAY_D_V1",
            "presentationArtifactRef": "IOPA_139_DENIED_SCOPE_V1",
            "result": "denied_scope",
            "recordedAt": "2026-04-14T10:21:15Z",
        },
        {
            **base,
            "intakeSubmitSettlementId": "ISS_139_FAILED_SAFE_V1",
            "requestPublicId": None,
            "submissionPromotionRecordRef": None,
            "patientJourneyLineageRef": None,
            "idempotencyRecordRef": "IR_139_SUBMIT_REPLAY_E_V1",
            "presentationArtifactRef": "IOPA_139_FAILED_SAFE_V1",
            "result": "failed_safe",
            "recordedAt": "2026-04-14T10:21:32Z",
        },
    ]


def build_outcome_examples(context: dict[str, Any], manifest: dict[str, Any]) -> list[dict[str, Any]]:
    base = {
        "artifactPresentationContractRef": "APC_139_PATIENT_INTAKE_SUMMARY_V1",
        "outboundNavigationGrantPolicyRef": OUTBOUND_NAV_POLICY_REF,
        "audienceSurfaceRuntimeBindingRef": manifest["audienceSurfaceRuntimeBindingRef"],
        "surfacePublicationRef": manifest["surfacePublicationRef"],
        "runtimePublicationBundleRef": context["local_runtime_ref"],
        "releasePublicationParityRef": context["local_release_parity_ref"],
        "createdAt": "2026-04-14T10:21:50Z",
    }
    return [
        {
            **base,
            "intakeOutcomePresentationArtifactId": "IOPA_139_RECEIPT_REQ_91X2P4N6MK5_V1",
            "requestPublicId": "req_91x2p4n6mk5",
            "surfaceRouteContractRef": "ISRC_139_INTAKE_RECEIPT_OUTCOME_V1",
            "visibilityTier": "public_safe_summary",
            "summarySafetyTier": "routine_clear",
            "placeholderContractRef": "PHC_139_RECEIPT_STATUS_SUMMARY_V1",
            "artifactState": "inline_renderable",
        },
        {
            **base,
            "intakeOutcomePresentationArtifactId": "IOPA_139_URGENT_REQ_29G7V8X0SY1_V1",
            "requestPublicId": "req_29g7v8x0sy1",
            "surfaceRouteContractRef": "ISRC_139_INTAKE_URGENT_OUTCOME_V1",
            "visibilityTier": "public_safe_summary",
            "summarySafetyTier": "urgent_diversion_required",
            "placeholderContractRef": "PHC_139_URGENT_GUIDANCE_SUMMARY_V1",
            "artifactState": "external_handoff_ready",
        },
        {
            **base,
            "intakeOutcomePresentationArtifactId": "IOPA_139_RECOVERY_REQ_83D5C1L9FN2_V1",
            "requestPublicId": "req_83d5c1l9fn2",
            "surfaceRouteContractRef": "ISRC_139_INTAKE_REQUEST_STATUS_V1",
            "visibilityTier": "public_recovery_summary",
            "summarySafetyTier": "routine_recovery",
            "placeholderContractRef": "PHC_139_STALE_RECOVERY_SUMMARY_V1",
            "artifactState": "recovery_only",
        },
        {
            **base,
            "intakeOutcomePresentationArtifactId": "IOPA_139_FAILED_SAFE_V1",
            "requestPublicId": None,
            "surfaceRouteContractRef": "ISRC_139_INTAKE_REVIEW_SUBMIT_V1",
            "visibilityTier": "public_safe_summary",
            "summarySafetyTier": "processing_failed",
            "placeholderContractRef": "PHC_139_FAILED_SAFE_SUMMARY_V1",
            "artifactState": "summary_only",
        },
    ]


def build_event_catalog() -> dict[str, Any]:
    events = [
        {
            "canonicalEventContractId": "CEC_REQUEST_SUBMITTED",
            "eventName": "request.submitted",
            "phaseStatus": "active_phase1",
            "namespaceRef": "CEN_REQUEST",
            "schemaVersionRef": "CESV_REQUEST_SUBMITTED_V1",
            "schemaArtifactPath": "packages/event-contracts/schemas/request/request.submitted.v1.schema.json",
            "sourceModel": "SubmissionEnvelope",
            "emittedWhen": "The durable envelope-to-request promotion boundary commits one SubmissionPromotionRecord and Request.workflowState = submitted.",
            "patientVisibleMeaning": "Submit is authoritative only after this event and the matching IntakeSubmitSettlement chain settle.",
            "forbiddenAliases": ["intake.submitted"],
            "sourceRefs": [
                "blueprint/phase-1-the-red-flag-gate.md#1A. Journey contract and intake schema lock",
                "blueprint/phase-1-the-red-flag-gate.md#1E. Submit normalization and synchronous safety engine",
            ],
        },
        {
            "canonicalEventContractId": "CEC_INTAKE_DRAFT_CREATED",
            "eventName": "intake.draft.created",
            "phaseStatus": "active_phase1",
            "namespaceRef": "CEN_INTAKE",
            "schemaVersionRef": "CESV_INTAKE_DRAFT_CREATED_V1",
            "schemaArtifactPath": "packages/event-contracts/schemas/intake/intake.draft.created.v1.schema.json",
            "sourceModel": "SubmissionEnvelope",
            "emittedWhen": "The canonical draft lineage is opened for self-service intake.",
            "patientVisibleMeaning": "A resume token and a draft public ID now exist for the same envelope lineage.",
            "forbiddenAliases": [],
            "sourceRefs": [
                "blueprint/phase-1-the-red-flag-gate.md#1A. Journey contract and intake schema lock",
                "blueprint/phase-1-the-red-flag-gate.md#1B. Draft lifecycle and autosave engine",
            ],
        },
        {
            "canonicalEventContractId": "CEC_INTAKE_DRAFT_UPDATED",
            "eventName": "intake.draft.updated",
            "phaseStatus": "active_phase1",
            "namespaceRef": "CEN_INTAKE",
            "schemaVersionRef": "CESV_INTAKE_DRAFT_UPDATED_V1",
            "schemaArtifactPath": "packages/event-contracts/schemas/intake/intake.draft.updated.v1.schema.json",
            "sourceModel": "SubmissionEnvelope",
            "emittedWhen": "An immutable DraftMutationRecord and corresponding draft projection update settle.",
            "patientVisibleMeaning": "Quiet saved posture may change only when continuity evidence still covers the same shell lineage.",
            "forbiddenAliases": [],
            "sourceRefs": [
                "blueprint/phase-1-the-red-flag-gate.md#1B. Draft lifecycle and autosave engine",
            ],
        },
        {
            "canonicalEventContractId": "CEC_INTAKE_ATTACHMENT_ADDED",
            "eventName": "intake.attachment.added",
            "phaseStatus": "active_phase1",
            "namespaceRef": "CEN_INTAKE",
            "schemaVersionRef": "CESV_INTAKE_ATTACHMENT_ADDED_V1",
            "schemaArtifactPath": "packages/event-contracts/schemas/intake/intake.attachment.added.v1.schema.json",
            "sourceModel": "SubmissionEnvelope",
            "emittedWhen": "A governed attachment placeholder or initiated upload is bound to the same draft lineage.",
            "patientVisibleMeaning": "Supporting files are part of the same draft summary and replay boundary.",
            "forbiddenAliases": [],
            "sourceRefs": [
                "blueprint/phase-1-the-red-flag-gate.md#1A. Journey contract and intake schema lock",
            ],
        },
        {
            "canonicalEventContractId": "CEC_INTAKE_ATTACHMENT_QUARANTINED",
            "eventName": "intake.attachment.quarantined",
            "phaseStatus": "reserved_follow_on",
            "namespaceRef": "CEN_INTAKE",
            "schemaVersionRef": "CESV_INTAKE_ATTACHMENT_QUARANTINED_V1",
            "schemaArtifactPath": "packages/event-contracts/schemas/intake/intake.attachment.quarantined.v1.schema.json",
            "sourceModel": "SubmissionEnvelope",
            "emittedWhen": "Attachment acceptance or quarantine law forces a bounded non-live attachment path on the same lineage.",
            "patientVisibleMeaning": "Seq_141 must harden this rule without renaming the event.",
            "forbiddenAliases": [],
            "sourceRefs": [
                "blueprint/forensic-audit-findings.md#attachment quarantine events",
                "prompt/141.md",
            ],
        },
        {
            "canonicalEventContractId": "CEC_INTAKE_NORMALIZED",
            "eventName": "intake.normalized",
            "phaseStatus": "active_phase1",
            "namespaceRef": "CEN_INTAKE",
            "schemaVersionRef": "CESV_INTAKE_NORMALIZED_V1",
            "schemaArtifactPath": "packages/event-contracts/schemas/intake/intake.normalized.v1.schema.json",
            "sourceModel": "Request",
            "emittedWhen": "The frozen submission snapshot yields one canonical NormalizedSubmission after durable submitted state exists.",
            "patientVisibleMeaning": "Routine queue entry and ETA proof happen after this normalization boundary, not before.",
            "forbiddenAliases": [],
            "sourceRefs": [
                "blueprint/phase-1-the-red-flag-gate.md#1E. Submit normalization and synchronous safety engine",
            ],
        },
        {
            "canonicalEventContractId": "CEC_SAFETY_SCREENED",
            "eventName": "safety.screened",
            "phaseStatus": "active_phase1",
            "namespaceRef": "CEN_SAFETY",
            "schemaVersionRef": "CESV_SAFETY_SCREENED_V1",
            "schemaArtifactPath": "packages/event-contracts/schemas/safety/safety.screened.v1.schema.json",
            "sourceModel": "Request",
            "emittedWhen": "The synchronous safety engine evaluates the canonical submission snapshot.",
            "patientVisibleMeaning": "Urgent, routine, and failed-safe outcomes all trace to one rules-first safety record set.",
            "forbiddenAliases": [],
            "sourceRefs": [
                "blueprint/phase-1-the-red-flag-gate.md#1E. Submit normalization and synchronous safety engine",
            ],
        },
        {
            "canonicalEventContractId": "CEC_SAFETY_URGENT_DIVERSION_REQUIRED",
            "eventName": "safety.urgent_diversion.required",
            "phaseStatus": "active_phase1",
            "namespaceRef": "CEN_SAFETY",
            "schemaVersionRef": "CESV_SAFETY_URGENT_DIVERSION_REQUIRED_V1",
            "schemaArtifactPath": "packages/event-contracts/schemas/safety/safety.urgent_diversion.required.v1.schema.json",
            "sourceModel": "Request",
            "emittedWhen": "The safety engine crosses the durable urgent-required boundary before the urgent guidance settlement completes.",
            "patientVisibleMeaning": "Urgent required and urgent diverted remain separate states; the UI may not collapse them.",
            "forbiddenAliases": [],
            "sourceRefs": [
                "blueprint/forensic-audit-findings.md#Finding 118",
                "blueprint/phase-1-the-red-flag-gate.md#1E. Submit normalization and synchronous safety engine",
            ],
        },
        {
            "canonicalEventContractId": "CEC_SAFETY_URGENT_DIVERSION_COMPLETED",
            "eventName": "safety.urgent_diversion.completed",
            "phaseStatus": "active_phase1",
            "namespaceRef": "CEN_SAFETY",
            "schemaVersionRef": "CESV_SAFETY_URGENT_DIVERSION_COMPLETED_V1",
            "schemaArtifactPath": "packages/event-contracts/schemas/safety/safety.urgent_diversion.completed.v1.schema.json",
            "sourceModel": "Request",
            "emittedWhen": "One UrgentDiversionSettlement is durably issued for the same request lineage.",
            "patientVisibleMeaning": "The urgent pathway is now settled and may present governed external handoff if policy requires it.",
            "forbiddenAliases": [],
            "sourceRefs": [
                "blueprint/forensic-audit-findings.md#Finding 118",
                "blueprint/phase-1-the-red-flag-gate.md#1E. Submit normalization and synchronous safety engine",
            ],
        },
        {
            "canonicalEventContractId": "CEC_TRIAGE_TASK_CREATED",
            "eventName": "triage.task.created",
            "phaseStatus": "active_phase1",
            "namespaceRef": "CEN_TRIAGE",
            "schemaVersionRef": "CESV_TRIAGE_TASK_CREATED_V1",
            "schemaArtifactPath": "packages/event-contracts/schemas/triage/triage.task.created.v1.schema.json",
            "sourceModel": "Request",
            "emittedWhen": "A non-urgent request becomes triage_ready with one authoritative task.",
            "patientVisibleMeaning": "Receipt and ETA may render only after this downstream operational handoff exists.",
            "forbiddenAliases": [],
            "sourceRefs": [
                "blueprint/phase-1-the-red-flag-gate.md#1F. Triage handoff, receipt, ETA, and minimal status tracking",
            ],
        },
        {
            "canonicalEventContractId": "CEC_PATIENT_RECEIPT_ISSUED",
            "eventName": "patient.receipt.issued",
            "phaseStatus": "active_phase1",
            "namespaceRef": "CEN_PATIENT",
            "schemaVersionRef": "CESV_PATIENT_RECEIPT_ISSUED_V1",
            "schemaArtifactPath": "packages/event-contracts/schemas/patient/patient.receipt.issued.v1.schema.json",
            "sourceModel": "Request",
            "emittedWhen": "The patient-facing receipt projection settles under the active IntakeSurfaceRuntimeBinding.",
            "patientVisibleMeaning": "Receipt, status, and later authenticated views stay semantically equivalent for the same request.",
            "forbiddenAliases": [],
            "sourceRefs": [
                "blueprint/phase-1-the-red-flag-gate.md#1F. Triage handoff, receipt, ETA, and minimal status tracking",
            ],
        },
        {
            "canonicalEventContractId": "CEC_COMMUNICATION_QUEUED",
            "eventName": "communication.queued",
            "phaseStatus": "active_phase1",
            "namespaceRef": "CEN_COMMUNICATION",
            "schemaVersionRef": "CESV_COMMUNICATION_QUEUED_V1",
            "schemaArtifactPath": "packages/event-contracts/schemas/communication/communication.queued.v1.schema.json",
            "sourceModel": "Request",
            "emittedWhen": "Receipt or follow-up communication is queued after the request is durably operational.",
            "patientVisibleMeaning": "Communication is a downstream effect of authoritative receipt, not a substitute for it.",
            "forbiddenAliases": [],
            "sourceRefs": [
                "blueprint/phase-1-the-red-flag-gate.md#1F. Triage handoff, receipt, ETA, and minimal status tracking",
            ],
        },
    ]
    return {
        "task_id": TASK_ID,
        "generated_at": now_iso(),
        "captured_on": CAPTURED_ON,
        "visual_mode": VISUAL_MODE,
        "mission": "Freeze the exact Phase 1 intake event set so browser, embedded, questionnaire, attachment, and urgent-diversion follow-on work cannot fork event meaning.",
        "source_precedence": SOURCE_PRECEDENCE,
        "canonicalSubmitEvent": "request.submitted",
        "forbiddenSemanticDuplicates": FORBIDDEN_DUPLICATES,
        "summary": {
            "active_event_count": 11,
            "reserved_follow_on_event_count": 1,
            "forbidden_duplicate_name_count": len(FORBIDDEN_DUPLICATES),
        },
        "gap_resolutions": GAP_RESOLUTIONS,
        "bounded_gaps": BOUNDED_GAPS,
        "eventCatalog": events,
    }


def build_draft_schema(example: dict[str, Any]) -> dict[str, Any]:
    return {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "$id": "https://vecells.local/contracts/phase1/intake-draft-view.schema.json",
        "title": "IntakeDraftView",
        "description": "The canonical pre-submit patient intake payload for Phase 1. Browser and embedded surfaces may narrow capability but may not fork field meaning.",
        "type": "object",
        "additionalProperties": False,
        "required": [
            "draftPublicId",
            "ingressChannel",
            "surfaceChannelProfile",
            "intakeConvergenceContractRef",
            "identityContext",
            "requestType",
            "structuredAnswers",
            "freeTextNarrative",
            "attachmentRefs",
            "contactPreferences",
            "channelCapabilityCeiling",
            "draftVersion",
            "lastSavedAt",
            "resumeToken",
            "uiJourneyState",
            "draftSchemaVersion",
        ],
        "properties": {
            "draftPublicId": {"type": "string", "pattern": "^dft_[a-z0-9]{10,32}$"},
            "ingressChannel": {"type": "string", "const": "self_service_form"},
            "surfaceChannelProfile": {"type": "string", "enum": ["browser", "embedded"]},
            "intakeConvergenceContractRef": {"type": "string"},
            "identityContext": {
                "type": "object",
                "additionalProperties": False,
                "required": [
                    "bindingState",
                    "subjectRefPresence",
                    "claimResumeState",
                    "actorBindingState",
                ],
                "properties": {
                    "bindingState": {
                        "type": "string",
                        "enum": ["anonymous", "partial", "verified", "uplift_pending", "identity_repair_required"],
                    },
                    "subjectRefPresence": {"type": "string", "enum": ["none", "masked", "bound"]},
                    "claimResumeState": {
                        "type": "string",
                        "enum": ["not_required", "pending", "granted", "blocked"],
                    },
                    "actorBindingState": {
                        "type": "string",
                        "enum": ["anonymous", "partial", "verified", "uplift_pending", "identity_repair_required"],
                    },
                },
            },
            "requestType": {"type": "string", "enum": REQUEST_TYPE_ENUM},
            "structuredAnswers": {"type": "object"},
            "freeTextNarrative": {"type": "string", "maxLength": 4000},
            "attachmentRefs": {"type": "array", "items": {"type": "string"}},
            "contactPreferences": {
                "type": "object",
                "additionalProperties": False,
                "required": ["preferredChannel", "contactWindow", "voicemailAllowed"],
                "properties": {
                    "preferredChannel": {"type": "string", "enum": ["sms", "phone", "email"]},
                    "contactWindow": {
                        "type": "string",
                        "enum": ["weekday_daytime", "weekday_evening", "anytime"],
                    },
                    "voicemailAllowed": {"type": "boolean"},
                },
            },
            "channelCapabilityCeiling": {
                "type": "object",
                "additionalProperties": False,
                "required": [
                    "canUploadFiles",
                    "canRenderTrackStatus",
                    "canRenderEmbedded",
                    "mutatingResumeState",
                ],
                "properties": {
                    "canUploadFiles": {"type": "boolean"},
                    "canRenderTrackStatus": {"type": "boolean"},
                    "canRenderEmbedded": {"type": "boolean"},
                    "mutatingResumeState": {
                        "type": "string",
                        "enum": ["allowed", "rebind_required", "blocked"],
                    },
                },
            },
            "draftVersion": {"type": "integer", "minimum": 1},
            "lastSavedAt": {"type": "string", "format": "date-time"},
            "resumeToken": {"type": "string", "pattern": "^rtk_[A-Za-z0-9_-]{12,128}$"},
            "uiJourneyState": {
                "type": "object",
                "additionalProperties": False,
                "required": [
                    "currentStepKey",
                    "completedStepKeys",
                    "currentPathname",
                    "quietStatusState",
                    "sameShellRecoveryState",
                    "shellContinuityKey",
                    "selectedAnchorKey",
                ],
                "properties": {
                    "currentStepKey": {"type": "string", "enum": STEP_KEY_ORDER},
                    "completedStepKeys": {"type": "array", "items": {"type": "string", "enum": STEP_KEY_ORDER}},
                    "currentPathname": {"type": "string"},
                    "quietStatusState": {
                        "type": "string",
                        "enum": [
                            "draft_not_started",
                            "saving_local",
                            "saved_authoritative",
                            "resume_safely",
                            "submitting_authoritative",
                            "outcome_authoritative",
                            "status_authoritative",
                        ],
                    },
                    "sameShellRecoveryState": {
                        "type": "string",
                        "enum": ["stable", "recovery_only", "blocked"],
                    },
                    "shellContinuityKey": {"type": "string"},
                    "selectedAnchorKey": {"type": "string"},
                },
            },
            "draftSchemaVersion": {"type": "string", "const": DRAFT_SCHEMA_VERSION},
        },
        "examples": [example],
    }


def build_surface_binding_schema(examples: list[dict[str, Any]]) -> dict[str, Any]:
    return {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "$id": "https://vecells.local/contracts/phase1/intake-surface-runtime-binding.schema.json",
        "title": "IntakeSurfaceRuntimeBinding",
        "description": "Patient-route adapter over the authoritative runtime and publication tuple for public intake, receipt, status, and embedded future seams.",
        "type": "object",
        "additionalProperties": False,
        "required": [
            "intakeSurfaceRuntimeBindingId",
            "routeFamilyRef",
            "audienceSurfaceRuntimeBindingRef",
            "surfaceRouteContractRef",
            "surfacePublicationRef",
            "runtimePublicationBundleRef",
            "releasePublicationParityRef",
            "patientShellConsistencyProjectionRef",
            "patientEmbeddedSessionProjectionRef",
            "routeFreezeDispositionRef",
            "releaseRecoveryDispositionRef",
            "bindingState",
            "validatedAt",
        ],
        "properties": {
            "intakeSurfaceRuntimeBindingId": {"type": "string"},
            "routeFamilyRef": {
                "type": "string",
                "enum": ["rf_intake_self_service", "rf_patient_embedded_channel"],
            },
            "audienceSurfaceRuntimeBindingRef": {"type": "string"},
            "surfaceRouteContractRef": {"type": "string"},
            "surfacePublicationRef": {"type": "string"},
            "runtimePublicationBundleRef": {"type": "string"},
            "releasePublicationParityRef": {"type": "string"},
            "patientShellConsistencyProjectionRef": {"type": "string"},
            "patientEmbeddedSessionProjectionRef": {"type": "string"},
            "routeFreezeDispositionRef": {"type": "string"},
            "releaseRecoveryDispositionRef": {"type": "string"},
            "bindingState": {"type": "string", "enum": ["live", "recovery_only", "blocked"]},
            "validatedAt": {"type": "string", "format": "date-time"},
        },
        "examples": examples,
    }


def build_submit_settlement_schema(examples: list[dict[str, Any]]) -> dict[str, Any]:
    return {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "$id": "https://vecells.local/contracts/phase1/intake-submit-settlement.schema.json",
        "title": "IntakeSubmitSettlement",
        "description": "Authoritative public submit outcome. It binds the route transition to the command settlement, promotion, and presentation chain.",
        "type": "object",
        "additionalProperties": False,
        "required": [
            "intakeSubmitSettlementId",
            "draftPublicId",
            "requestPublicId",
            "submissionPromotionRecordRef",
            "patientJourneyLineageRef",
            "idempotencyRecordRef",
            "routeIntentBindingRef",
            "commandActionRecordRef",
            "commandSettlementRecordRef",
            "transitionEnvelopeRef",
            "audienceSurfaceRuntimeBindingRef",
            "surfacePublicationRef",
            "runtimePublicationBundleRef",
            "releasePublicationParityRef",
            "releaseRecoveryDispositionRef",
            "uiTransitionSettlementRecordRef",
            "uiTelemetryDisclosureFenceRef",
            "presentationArtifactRef",
            "result",
            "recordedAt",
        ],
        "properties": {
            "intakeSubmitSettlementId": {"type": "string"},
            "draftPublicId": {"type": "string", "pattern": "^dft_[a-z0-9]{10,32}$"},
            "requestPublicId": {
                "oneOf": [
                    {"type": "string", "pattern": "^req_[a-z0-9]{10,32}$"},
                    {"type": "null"},
                ]
            },
            "submissionPromotionRecordRef": {"type": ["string", "null"]},
            "patientJourneyLineageRef": {"type": ["string", "null"]},
            "idempotencyRecordRef": {"type": "string"},
            "routeIntentBindingRef": {"type": "string"},
            "commandActionRecordRef": {"type": "string"},
            "commandSettlementRecordRef": {"type": "string"},
            "transitionEnvelopeRef": {"type": "string"},
            "audienceSurfaceRuntimeBindingRef": {"type": "string"},
            "surfacePublicationRef": {"type": "string"},
            "runtimePublicationBundleRef": {"type": "string"},
            "releasePublicationParityRef": {"type": "string"},
            "releaseRecoveryDispositionRef": {"type": "string"},
            "uiTransitionSettlementRecordRef": {"type": "string"},
            "uiTelemetryDisclosureFenceRef": {"type": "string"},
            "presentationArtifactRef": {"type": "string"},
            "result": {"type": "string", "enum": SUBMIT_RESULTS},
            "recordedAt": {"type": "string", "format": "date-time"},
        },
        "examples": examples,
    }


def build_outcome_artifact_schema(examples: list[dict[str, Any]]) -> dict[str, Any]:
    return {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "$id": "https://vecells.local/contracts/phase1/intake-outcome-presentation-artifact.schema.json",
        "title": "IntakeOutcomePresentationArtifact",
        "description": "Patient-facing outcome summary artifact used by urgent guidance, receipt, and minimal track-my-request surfaces.",
        "type": "object",
        "additionalProperties": False,
        "required": [
            "intakeOutcomePresentationArtifactId",
            "requestPublicId",
            "artifactPresentationContractRef",
            "outboundNavigationGrantPolicyRef",
            "audienceSurfaceRuntimeBindingRef",
            "surfaceRouteContractRef",
            "surfacePublicationRef",
            "runtimePublicationBundleRef",
            "releasePublicationParityRef",
            "visibilityTier",
            "summarySafetyTier",
            "placeholderContractRef",
            "artifactState",
            "createdAt",
        ],
        "properties": {
            "intakeOutcomePresentationArtifactId": {"type": "string"},
            "requestPublicId": {
                "oneOf": [
                    {"type": "string", "pattern": "^req_[a-z0-9]{10,32}$"},
                    {"type": "null"},
                ]
            },
            "artifactPresentationContractRef": {"type": "string"},
            "outboundNavigationGrantPolicyRef": {"type": "string"},
            "audienceSurfaceRuntimeBindingRef": {"type": "string"},
            "surfaceRouteContractRef": {"type": "string"},
            "surfacePublicationRef": {"type": "string"},
            "runtimePublicationBundleRef": {"type": "string"},
            "releasePublicationParityRef": {"type": "string"},
            "visibilityTier": {
                "type": "string",
                "enum": [
                    "public_safe_summary",
                    "public_recovery_summary",
                    "grant_scoped_summary",
                    "authenticated_summary",
                ],
            },
            "summarySafetyTier": {
                "type": "string",
                "enum": [
                    "routine_clear",
                    "routine_recovery",
                    "urgent_diversion_required",
                    "residual_risk_flagged",
                    "processing_failed",
                ],
            },
            "placeholderContractRef": {"type": "string"},
            "artifactState": {"type": "string", "enum": ARTIFACT_STATES},
            "createdAt": {"type": "string", "format": "date-time"},
        },
        "examples": examples,
    }


def build_schema_summary(
    draft_schema: dict[str, Any],
    surface_binding_schema: dict[str, Any],
    submit_settlement_schema: dict[str, Any],
    outcome_artifact_schema: dict[str, Any],
) -> list[dict[str, Any]]:
    return [
        {
            "schemaName": "IntakeDraftView",
            "artifactPath": "data/contracts/139_intake_draft_view.schema.json",
            "requiredFieldCount": len(draft_schema["required"]),
            "idPattern": "^dft_[a-z0-9]{10,32}$",
            "purpose": "Pre-submit draft lineage rendered through one IntakeConvergenceContract.",
        },
        {
            "schemaName": "IntakeSurfaceRuntimeBinding",
            "artifactPath": "data/contracts/139_intake_surface_runtime_binding.schema.json",
            "requiredFieldCount": len(surface_binding_schema["required"]),
            "idPattern": "ISRB_139_*",
            "purpose": "Adapter from patient routes into published runtime, parity, freeze, and recovery truth.",
        },
        {
            "schemaName": "IntakeSubmitSettlement",
            "artifactPath": "data/contracts/139_intake_submit_settlement.schema.json",
            "requiredFieldCount": len(submit_settlement_schema["required"]),
            "idPattern": "ISS_139_*",
            "purpose": "Authoritative submit outcome chain; local browser success never substitutes for this record.",
        },
        {
            "schemaName": "IntakeOutcomePresentationArtifact",
            "artifactPath": "data/contracts/139_intake_outcome_presentation_artifact.schema.json",
            "requiredFieldCount": len(outcome_artifact_schema["required"]),
            "idPattern": "IOPA_139_*",
            "purpose": "Summary-first urgent guidance, receipt, and status artifact contract.",
        },
    ]


def build_api_contract_doc(
    context: dict[str, Any],
    journey_rows: list[dict[str, str]],
    draft_example: dict[str, Any],
    settlement_examples: list[dict[str, Any]],
    outcome_examples: list[dict[str, Any]],
) -> str:
    endpoint_rows = [
        [
            "POST /v1/intake/drafts",
            "Create one SubmissionEnvelope-backed draft and return IntakeDraftView.",
            "requestType? (optional preselection), surfaceChannelProfile, routeEntryRef",
            "IntakeDraftView",
            "No internal IDs; returns draftPublicId and resumeToken only.",
        ],
        [
            "GET /v1/intake/drafts/{draftPublicId}",
            "Load the authoritative draft view for the same public draft lineage.",
            "draftPublicId, resumeToken",
            "IntakeDraftView",
            "Must fail closed if a mismatched internal aggregate ID is ever supplied.",
        ],
        [
            "PATCH /v1/intake/drafts/{draftPublicId}",
            "Apply immutable draft mutations and return the updated IntakeDraftView.",
            "draftVersion, clientCommandId, idempotencyKey, step delta, answer delta",
            "IntakeDraftView",
            "Draft remains on SubmissionEnvelope; no Request promotion on PATCH.",
        ],
        [
            "POST /v1/intake/drafts/{draftPublicId}/attachments:initiate",
            "Start a governed attachment placeholder or upload grant for the same draft.",
            "draftVersion, filename, declaredMediaType, byteLength",
            "attachment initiation payload",
            "Attachment acceptance stays on the same draft lineage and never leaks raw object-store URLs.",
        ],
        [
            "POST /v1/intake/drafts/{draftPublicId}/submit",
            "Freeze the snapshot, run normalization and safety, and return one authoritative submit settlement.",
            "draftVersion, idempotencyKey, review acknowledgement",
            "IntakeSubmitSettlement",
            "request.submitted is the canonical submit event. No intake.submitted duplicate is allowed.",
        ],
        [
            "GET /v1/intake/requests/{requestPublicId}/receipt",
            "Render the calm receipt outcome for a promoted request.",
            "requestPublicId",
            "IntakeOutcomePresentationArtifact",
            "ArtifactPresentationContract and OutboundNavigationGrant remain mandatory for any handoff or preview.",
        ],
        [
            "GET /v1/intake/requests/{requestPublicId}/status",
            "Render the minimal track-my-request summary for the same request lineage.",
            "requestPublicId",
            "IntakeOutcomePresentationArtifact",
            "Status stays coarse and same-shell; it must not expose internal queue detail.",
        ],
    ]

    attachment_initiation = {
        "attachmentSessionId": "ias_139_supporting_file_01",
        "attachmentPublicId": "att_upload_img_01",
        "artifactPresentationContractRef": "APC_139_INTAKE_ATTACHMENT_UPLOAD_V1",
        "uploadGrantPolicyRef": "UGP_139_INTAKE_ATTACHMENT_UPLOAD_V1",
        "attachmentPlaceholderContractRef": "PHC_139_ATTACHMENT_PLACEHOLDER_V1",
        "acceptedMediaProfileRefs": ["media.image_photo", "media.document_pdf"],
        "maxUploadBytes": 15728640,
        "draftVersion": 3,
    }

    return f"""# 139 Phase 1 Public Intake API Contracts

## Mission
Freeze the exact public HTTP surface for Phase 1 intake so later backend and frontend work cannot fork route meaning, public IDs, or outcome contracts.

## Mock Now Execution
Mock_now_execution is simulator-backed web/browser self-service only. It covers anonymous start, draft resume token, refresh/resume, same-shell urgent diversion, same-shell receipt, and minimal request status.

## Actual Production Strategy Later
Actual_production_strategy_later preserves these same endpoint semantics, IntakeConvergenceContract, IntakeDraftView, IntakeSurfaceRuntimeBinding, IntakeSubmitSettlement, and IntakeOutcomePresentationArtifact semantics for authenticated uplift and NHS App embedded delivery later.

## Endpoint Freeze
{markdown_table(
        ["Endpoint", "Purpose", "Primary request contract", "Response contract", "Contract law"],
        endpoint_rows,
    )}

## Public ID Separation
- `draftPublicId` is the only public identifier for mutable pre-submit work.
- `requestPublicId` is the only public identifier for post-promotion receipt or status work.
- `SubmissionEnvelope`, aggregate IDs, and internal request IDs are never exposed in routes or payloads.
- `SubmissionEnvelope` remains the canonical pre-submit authority. Promotion into `Request` happens exactly once through `SubmissionPromotionRecord`.

## Attachment Initiation Payload
{json_block(attachment_initiation)}

## Response Reference Examples

### IntakeDraftView
{json_block(draft_example)}

### IntakeSubmitSettlement
{json_block(settlement_examples[0])}

### IntakeOutcomePresentationArtifact
{json_block(outcome_examples[0])}

## Route and Runtime Bindings
- The public route family remains `rf_intake_self_service`.
- The active browser tuple binds `AudienceSurfaceRuntimeBinding = {context["intake_manifest"]["audienceSurfaceRuntimeBindingRef"]}`, `RouteFreezeDisposition = {context["intake_manifest"]["routeFreezeDispositionRef"]}`, and `ReleaseRecoveryDisposition = {context["intake_manifest"]["releaseRecoveryDispositionRef"]}`.
- Current browser truth is intentionally `recovery_only`, not publishable-live. Exact route meaning is frozen now even though calm live publication is still withheld by current design and accessibility posture.

## Non-Negotiable Rules
- `request.submitted` is the canonical submit event; `intake.submitted` is forbidden.
- `SubmissionEnvelope` remains the only legal mutable pre-submit model.
- Receipt and status must not infer success from local form state. They require authoritative `IntakeSubmitSettlement`.
- `ArtifactPresentationContract` and `OutboundNavigationGrant` are mandatory for urgent guidance, receipt, status, attachment preview, print, or external handoff.
"""


def build_schema_lock_doc(
    draft_schema: dict[str, Any],
    surface_binding_schema: dict[str, Any],
    submit_settlement_schema: dict[str, Any],
    outcome_artifact_schema: dict[str, Any],
    schema_summary: list[dict[str, Any]],
) -> str:
    schema_rows = [
        [
            row["schemaName"],
            row["artifactPath"],
            str(row["requiredFieldCount"]),
            row["purpose"],
        ]
        for row in schema_summary
    ]
    return f"""# 139 Phase 1 Submission Schema Lock

## Schema Freeze
{markdown_table(["Schema", "Artifact", "Required fields", "Role"], schema_rows)}

## Locked Principles
- `SubmissionEnvelope` is the only mutable pre-submit authority. This schema set does not permit a second browser-only draft model.
- `IntakeDraftView` freezes public draft semantics for browser and embedded surfaces through one `IntakeConvergenceContract`.
- `IntakeSurfaceRuntimeBinding` freezes the route-to-runtime-to-recovery tuple so receipt and status remain fail-closed and same-shell.
- `IntakeSubmitSettlement` is the single authoritative success, urgent, stale, denied-scope, or failed-safe submit contract.
- `IntakeOutcomePresentationArtifact` is the same artifact shell for urgent guidance, receipt, and track-my-request. No fifth public schema is introduced for status.

## Draft Schema Version
- `draftSchemaVersion = {DRAFT_SCHEMA_VERSION}`
- Request types are frozen exactly as `{", ".join(REQUEST_TYPE_ENUM)}`
- Public IDs are route-safe and separate by type: `dft_*` for drafts and `req_*` for requests.

## SubmissionEnvelope Boundary
The schema lock closes the gap where submit success could otherwise be inferred from local browser state. A patient-visible success surface may render only after:
1. the immutable submission snapshot is frozen,
2. one `SubmissionPromotionRecord` exists when promotion succeeds,
3. one authoritative `IntakeSubmitSettlement` is recorded, and
4. the route still resolves under the current `AudienceSurfaceRuntimeBinding`, `RouteFreezeDisposition`, and `ReleaseRecoveryDisposition`.

## Artifact and Navigation Law
- `ArtifactPresentationContract` is required for every post-submit or urgent artifact surface.
- `OutboundNavigationGrant` is required for any browser exit, embedded downgrade, urgent handoff, document preview, or print/download path.
- Raw object URLs and detached success pages are forbidden.
"""


def build_event_catalog_doc(event_catalog: dict[str, Any]) -> str:
    rows = [
        [
            event["eventName"],
            event["phaseStatus"],
            event["sourceModel"],
            event["schemaVersionRef"],
            ", ".join(event["forbiddenAliases"]) or "none",
            event["patientVisibleMeaning"],
        ]
        for event in event_catalog["eventCatalog"]
    ]
    return f"""# 139 Intake Event Catalog

## Event Freeze
{markdown_table(
        ["Event", "Phase status", "Source model", "Schema version ref", "Forbidden aliases", "Patient-visible meaning"],
        rows,
    )}

## Canonical Rules
- `request.submitted` is the only canonical submit event.
- `intake.submitted` is explicitly forbidden as a parallel semantic alias for the same promotion boundary.
- Draft events emit from `SubmissionEnvelope` and its projections, not from a second draft persistence model.
- `intake.attachment.quarantined` is reserved now so seq_141 can harden quarantine policy without renaming the event spine.
- `safety.urgent_diversion.required` and `safety.urgent_diversion.completed` remain separate durable states.

## Gap Resolutions
{markdown_table(
        ["Gap resolution", "Summary"],
        [[gap["gapId"], gap["summary"]] for gap in event_catalog["gap_resolutions"]],
    )}

## Bounded Gaps
{markdown_table(
        ["Bounded gap", "Summary"],
        [[gap["gapId"], gap["summary"]] for gap in event_catalog["bounded_gaps"]],
    )}
"""


def build_journey_contract_doc(
    context: dict[str, Any],
    journey_rows: list[dict[str, str]],
    surface_binding_examples: list[dict[str, Any]],
    event_catalog: dict[str, Any],
) -> str:
    page_stack_rows = [
        [
            row["step_key"],
            row["route_pattern"],
            row["route_family"],
            row["purpose"],
            row["next_transitions"],
        ]
        for row in journey_rows
    ]
    binding_rows = [
        [
            binding["intakeSurfaceRuntimeBindingId"],
            binding["surfaceRouteContractRef"],
            binding["routeFamilyRef"],
            binding["bindingState"],
            binding["releaseRecoveryDispositionRef"],
        ]
        for binding in surface_binding_examples
    ]
    resolution_rows = [[gap["gapId"], gap["summary"]] for gap in GAP_RESOLUTIONS]
    bounded_rows = [[gap["gapId"], gap["summary"]] for gap in BOUNDED_GAPS]
    return f"""# 139 Web Intake Journey Contract

## Mission
Freeze the exact Phase 1 patient intake journey, route contracts, runtime/outcome bindings, and shell continuity law before implementation tracks add questionnaire detail, attachments, or red-flag rules.

## Mock Now Execution
Mock_now_execution is the public web/browser self-service contract. It is simulator-backed, uses the current public-entry runtime tuple, and stays honest about today’s current `recovery_only` publication truth for patient intake.

## Actual Production Strategy Later
Actual_production_strategy_later may narrow chrome, identity uplift, or embedded capability, but it must preserve the same `IntakeConvergenceContract`, `IntakeDraftView`, `IntakeSurfaceRuntimeBinding`, `IntakeSubmitSettlement`, and `IntakeOutcomePresentationArtifact` semantics.

## Frozen Page Stack
{markdown_table(
        ["Step key", "Route pattern", "Route family", "Purpose", "Next transitions"],
        page_stack_rows,
    )}

## Same-Shell Law
- Every route in this journey uses the same patient mission frame and the same shell continuity key: `{PATIENT_SHELL_CONTINUITY_KEY}`.
- Urgent diversion, receipt, status, stale recovery, and failed-safe submission remain same-shell outcomes for the same lineage where recovery is still allowed.
- `AudienceSurfaceRuntimeBinding`, `PatientShellConsistencyProjection`, `RouteFreezeDisposition`, `ReleaseRecoveryDisposition`, `ArtifactPresentationContract`, and `OutboundNavigationGrant` all remain first-class contract members instead of implementation detail.
- Generic expired-link, generic validation-error, or detached success pages are not legal steady-state behavior for recoverable intake lineages.

## Frozen Route-to-Runtime Bindings
{markdown_table(
        ["Binding ref", "Route contract ref", "Route family", "Binding state", "Recovery law"],
        binding_rows,
    )}

## Route and Outcome Decisions
- Exact public path freeze:
  `/intake/start`, `/intake/drafts/:draftPublicId/request-type`, `/intake/drafts/:draftPublicId/details`, `/intake/drafts/:draftPublicId/supporting-files`, `/intake/drafts/:draftPublicId/contact-preferences`, `/intake/drafts/:draftPublicId/review`, `/intake/drafts/:draftPublicId/recovery?resumeToken=:resumeToken`, `/intake/requests/:requestPublicId/urgent-guidance`, `/intake/requests/:requestPublicId/receipt`, `/intake/requests/:requestPublicId/status`
- One dominant route family carries the public browser journey now: `rf_intake_self_service`.
- Embedded posture is modeled explicitly as a blocked seam and may not silently fork the pre-submit model later.
- Minimal status is a first-class route contract, not a generic extension of receipt.

## Promotion and Recovery Law
- `SubmissionEnvelope` is the only mutable pre-submit model.
- `SubmissionPromotionRecord` is the only legal envelope-to-request boundary.
- `IntakeSubmitSettlement` is mandatory for authoritative urgent, routine, stale-recoverable, denied-scope, and failed-safe submit outcomes.
- `ArtifactPresentationContract` and `OutboundNavigationGrant` govern every receipt, urgent guidance, status, preview, print, and exit path.

## Gap Resolutions
{markdown_table(["Decision", "Summary"], resolution_rows)}

## Bounded Gaps
{markdown_table(["Gap", "Summary"], bounded_rows)}

## Event Grammar Lock
The journey binds the following exact event grammar now: {", ".join(event["eventName"] for event in event_catalog["eventCatalog"])}.
"""


def build_experience_spec_doc(journey_rows: list[dict[str, str]]) -> str:
    journey_rows_table = [
        [
            row["step_title"],
            row["primary_cta"],
            row["selected_anchor_key"],
            row["quiet_status_state"],
        ]
        for row in journey_rows
    ]
    return f"""# 139 Patient Intake Experience Spec

## Surface Mode
`{VISUAL_MODE}`

## Experience Thesis
This is one calm same-shell mission frame, not a generic wizard. The patient should always know:
- what question is being asked now,
- what has been saved authoritatively,
- how to leave for urgent help,
- and how the next safe action relates to the same request lineage.

## Mock Now Execution
Mock_now_execution uses simulator-backed runtime/publication tuples and browser-only self-service. The surface still behaves like a premium healthcare intake shell rather than a placeholder form.

## Actual Production Strategy Later
Actual_production_strategy_later may narrow host chrome for embedded or authenticated contexts, but it must keep the same mission-frame hierarchy, same-shell continuity law, and same public contract set.

## Visual Direction
- restrained Vecells wordmark in the header
- one small inline `intake_path` SVG near the title
- outer canvas max width `1280px`
- centered mission-frame content column `720px`
- recap column `280px`, collapsing into a peek drawer in `mission_stack`
- header band `72px`
- emergency escape strip immediately below the header
- sticky footer action bar `72px` on compact/mobile

## Interaction Law
- one dominant question or decision per step
- one dominant CTA per step
- helper copy lives in one bounded helper region and replaces itself rather than stacking
- quiet status strip is singular; no banner plus toast duplication
- urgent diversion morphs the active step in place and keeps the same shell frame
- validation is local to the field group and never resets scroll or anchor
- `mission_stack` is the same shell folded for narrow screens, not a separate mobile IA

## Motion
- `140ms` step morphs and recap-chip updates
- `180ms` status-strip settle transitions
- `220ms` recap drawer reveal
- reduced-motion mode removes sliding page replacement while preserving parity

## Step Controls
{markdown_table(["Step", "Primary CTA", "Selected anchor", "Quiet status state"], journey_rows_table)}

## Quiet-clarity Rules
- The emergency strip is always visible, but quiet.
- Recap content appears as compact chips or a slim peek card, never as a dashboard.
- The receipt outcome and urgent outcome inherit the same shell continuity key and status strip placement.
- The status page stays intentionally minimal: one timeline, one current state, one next-step message.

## Accessibility and Content
- Primary type resolves through canonical design tokens with fallback `Inter, system-ui, sans-serif`.
- Landmarks are fixed: one `header`, one `nav`, one `main`, one `aside`.
- Keyboard traversal must cover the full step rail, recap drawer, and outcome views.
- Reduced-motion parity is mandatory.
- Copy stays plain, bounded, and non-clinical where possible.
"""


def build_atlas_html(
    journey_rows: list[dict[str, str]],
    schema_summary: list[dict[str, Any]],
    surface_binding_examples: list[dict[str, Any]],
    event_catalog: dict[str, Any],
) -> str:
    initial_step = journey_rows[0]
    steps_json = json.dumps(journey_rows, indent=2)
    schemas_json = json.dumps(schema_summary, indent=2)
    bindings_json = json.dumps(surface_binding_examples, indent=2)
    event_json = json.dumps(event_catalog, indent=2)

    return f"""<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>139 Intake Journey Atlas</title>
    <style>
      :root {{
        --sys-canvas: #F7F8FA;
        --sys-shell: #EEF2F6;
        --sys-card: #FFFFFF;
        --sys-inset: #F3F6F9;
        --sys-text-strong: #0F1720;
        --sys-text-default: #24313D;
        --sys-text-muted: #5E6B78;
        --sys-border: #D7E0E8;
        --sys-progress: #2F6FED;
        --sys-continuity: #5B61F6;
        --sys-safe: #117A55;
        --sys-warning: #B7791F;
        --sys-urgent: #B42318;
        --shadow-soft: 0 18px 38px rgba(30, 55, 90, 0.08);
      }}

      * {{
        box-sizing: border-box;
      }}

      html {{
        background: var(--sys-canvas);
        color: var(--sys-text-default);
        font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }}

      body {{
        margin: 0;
        background:
          radial-gradient(circle at top left, rgba(91, 97, 246, 0.12), transparent 34%),
          linear-gradient(180deg, rgba(238, 242, 246, 0.88), rgba(247, 248, 250, 1));
      }}

      body.reduced-motion *,
      body.reduced-motion *::before,
      body.reduced-motion *::after {{
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
        scroll-behavior: auto !important;
      }}

      [hidden] {{
        display: none !important;
      }}

      .page {{
        max-width: 1280px;
        margin: 0 auto;
        padding: 0 24px 120px;
      }}

      .header-band {{
        min-height: 72px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
        padding: 18px 0 14px;
      }}

      .brand {{
        display: flex;
        align-items: center;
        gap: 14px;
      }}

      .wordmark {{
        font-size: 15px;
        line-height: 20px;
        font-weight: 700;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: var(--sys-text-strong);
      }}

      .header-copy h1 {{
        margin: 0;
        font-size: 30px;
        line-height: 36px;
        color: var(--sys-text-strong);
      }}

      .header-copy p {{
        margin: 4px 0 0;
        font-size: 13px;
        line-height: 20px;
        color: var(--sys-text-muted);
        max-width: 60ch;
      }}

      .header-chip {{
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 9px 12px;
        border-radius: 999px;
        background: rgba(47, 111, 237, 0.1);
        color: var(--sys-progress);
        font-size: 13px;
        line-height: 20px;
        font-weight: 600;
      }}

      .header-chip strong {{
        color: var(--sys-text-strong);
      }}

      .emergency-strip {{
        display: flex;
        justify-content: space-between;
        gap: 20px;
        padding: 14px 18px;
        border-radius: 18px;
        background: rgba(180, 35, 24, 0.07);
        border: 1px solid rgba(180, 35, 24, 0.14);
        color: var(--sys-urgent);
        margin-bottom: 18px;
      }}

      .emergency-strip h2,
      .emergency-strip p {{
        margin: 0;
      }}

      .emergency-strip h2 {{
        font-size: 16px;
        line-height: 24px;
      }}

      .emergency-strip p {{
        font-size: 13px;
        line-height: 20px;
        max-width: 54ch;
      }}

      .emergency-actions {{
        display: flex;
        align-items: center;
        gap: 10px;
        flex-wrap: wrap;
      }}

      .emergency-link,
      .subtle-link {{
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-height: 40px;
        padding: 0 14px;
        border-radius: 12px;
        text-decoration: none;
        font-size: 15px;
        line-height: 20px;
        font-weight: 600;
      }}

      .emergency-link {{
        background: var(--sys-urgent);
        color: white;
      }}

      .subtle-link {{
        border: 1px solid rgba(180, 35, 24, 0.22);
        color: var(--sys-urgent);
      }}

      .mission-shell {{
        display: grid;
        grid-template-columns: minmax(0, 220px) minmax(0, 720px) minmax(0, 280px);
        gap: 20px;
        align-items: start;
      }}

      .mission-shell > * {{
        min-width: 0;
      }}

      .card {{
        background: var(--sys-card);
        border: 1px solid var(--sys-border);
        border-radius: 24px;
        box-shadow: var(--shadow-soft);
      }}

      .rail,
      .recap-column {{
        position: sticky;
        top: 18px;
        padding: 18px;
      }}

      .rail h2,
      .main-frame h2,
      .recap-column h2,
      .tables h2 {{
        margin: 0 0 12px;
        font-size: 22px;
        line-height: 28px;
        color: var(--sys-text-strong);
      }}

      .rail p,
      .main-frame p,
      .recap-column p,
      .tables p {{
        margin: 0;
        color: var(--sys-text-muted);
        font-size: 13px;
        line-height: 20px;
      }}

      .step-list {{
        display: grid;
        gap: 10px;
        margin-top: 18px;
      }}

      .step-button {{
        border: 1px solid var(--sys-border);
        background: var(--sys-inset);
        border-radius: 18px;
        padding: 14px 15px;
        text-align: left;
        cursor: pointer;
        color: inherit;
        transition:
          border-color 140ms ease,
          transform 140ms ease,
          background 140ms ease,
          box-shadow 140ms ease;
      }}

      .step-button:hover,
      .step-button:focus-visible {{
        outline: none;
        border-color: rgba(47, 111, 237, 0.4);
        box-shadow: 0 0 0 3px rgba(47, 111, 237, 0.12);
      }}

      .step-button[data-selected="true"] {{
        background: linear-gradient(180deg, rgba(47, 111, 237, 0.12), rgba(91, 97, 246, 0.08));
        border-color: rgba(47, 111, 237, 0.36);
        transform: translateY(-1px);
      }}

      .step-button strong {{
        display: block;
        font-size: 15px;
        line-height: 20px;
        color: var(--sys-text-strong);
      }}

      .step-button span {{
        display: block;
        margin-top: 4px;
        font-size: 13px;
        line-height: 20px;
        color: var(--sys-text-muted);
      }}

      .main-frame {{
        padding: 24px;
        background: rgba(238, 242, 246, 0.74);
      }}

      .quiet-status-strip {{
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        padding: 12px 14px;
        border-radius: 16px;
        background: white;
        border: 1px solid rgba(91, 97, 246, 0.16);
        margin-bottom: 18px;
      }}

      .quiet-status-strip strong {{
        color: var(--sys-text-strong);
      }}

      .frame-panel {{
        background: var(--sys-card);
        border-radius: 24px;
        border: 1px solid var(--sys-border);
        padding: 24px;
      }}

      .detail-eyebrow {{
        display: inline-flex;
        align-items: center;
        gap: 8px;
        font-size: 13px;
        line-height: 20px;
        color: var(--sys-continuity);
        font-weight: 600;
        margin-bottom: 10px;
      }}

      .detail-title {{
        margin: 0;
        font-size: 30px;
        line-height: 36px;
        color: var(--sys-text-strong);
      }}

      .detail-summary {{
        margin-top: 10px;
        font-size: 16px;
        line-height: 24px;
      }}

      .detail-grid {{
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 12px;
        margin-top: 18px;
      }}

      .detail-card {{
        padding: 14px;
        border-radius: 18px;
        background: var(--sys-inset);
        border: 1px solid rgba(36, 49, 61, 0.08);
      }}

      .detail-card strong {{
        display: block;
        margin-bottom: 5px;
        font-size: 13px;
        line-height: 20px;
        color: var(--sys-text-muted);
      }}

      .detail-card span {{
        display: block;
        font-size: 15px;
        line-height: 22px;
        color: var(--sys-text-strong);
        word-break: break-word;
      }}

      .journey-spine {{
        margin-top: 22px;
        display: grid;
        gap: 10px;
      }}

      .spine-node {{
        display: grid;
        grid-template-columns: 34px minmax(0, 1fr);
        gap: 12px;
        align-items: center;
        padding: 12px 14px;
        border-radius: 18px;
        background: white;
        border: 1px solid rgba(36, 49, 61, 0.08);
      }}

      .spine-node[data-active="true"] {{
        border-color: rgba(47, 111, 237, 0.32);
        box-shadow: 0 0 0 3px rgba(47, 111, 237, 0.1);
      }}

      .spine-index {{
        width: 34px;
        height: 34px;
        border-radius: 50%;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        background: rgba(47, 111, 237, 0.12);
        color: var(--sys-progress);
        font-weight: 700;
      }}

      .spine-node strong {{
        display: block;
        color: var(--sys-text-strong);
        font-size: 15px;
        line-height: 20px;
      }}

      .spine-node span {{
        display: block;
        margin-top: 4px;
        color: var(--sys-text-muted);
        font-size: 13px;
        line-height: 20px;
      }}

      .recap-column {{
        display: grid;
        gap: 14px;
      }}

      .chip-list {{
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-top: 14px;
      }}

      .recap-chip {{
        display: inline-flex;
        align-items: center;
        min-height: 34px;
        padding: 0 12px;
        border-radius: 999px;
        background: var(--sys-inset);
        border: 1px solid rgba(36, 49, 61, 0.08);
        font-size: 13px;
        line-height: 20px;
        color: var(--sys-text-default);
      }}

      .recap-chip[data-active="true"] {{
        border-color: rgba(91, 97, 246, 0.3);
        background: rgba(91, 97, 246, 0.08);
        color: var(--sys-continuity);
      }}

      .peek-drawer-button {{
        display: none;
        width: 100%;
        min-height: 48px;
        border-radius: 16px;
        border: 1px solid rgba(47, 111, 237, 0.18);
        background: white;
        color: var(--sys-text-strong);
        font-size: 15px;
        line-height: 20px;
        font-weight: 600;
      }}

      .tables {{
        margin-top: 24px;
        display: grid;
        gap: 18px;
      }}

      .table-card {{
        padding: 18px;
      }}

      table {{
        width: 100%;
        border-collapse: collapse;
        margin-top: 14px;
        font-size: 13px;
        line-height: 20px;
      }}

      th,
      td {{
        padding: 11px 8px;
        border-bottom: 1px solid rgba(36, 49, 61, 0.08);
        text-align: left;
        vertical-align: top;
        word-break: break-word;
      }}

      th {{
        color: var(--sys-text-strong);
        font-weight: 700;
      }}

      .footer-bar {{
        display: none;
      }}

      @media (max-width: 1120px) {{
        body[data-layout="mission_stack"] .mission-shell {{
          grid-template-columns: minmax(0, 1fr);
        }}

        body[data-layout="mission_stack"] .rail {{
          position: static;
          order: 1;
        }}

        body[data-layout="mission_stack"] .main-frame {{
          order: 2;
        }}

        body[data-layout="mission_stack"] .recap-column {{
          position: fixed;
          right: 16px;
          left: 16px;
          bottom: 96px;
          top: auto;
          z-index: 12;
          display: none;
        }}

        body[data-layout="mission_stack"] .recap-column[data-open="true"] {{
          display: grid;
        }}

        body[data-layout="mission_stack"] .peek-drawer-button {{
          display: inline-flex;
          align-items: center;
          justify-content: center;
          margin-top: 16px;
        }}

        body[data-layout="mission_stack"] .footer-bar {{
          position: fixed;
          left: 16px;
          right: 16px;
          bottom: 16px;
          z-index: 16;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          min-height: 72px;
          padding: 12px 14px;
          border-radius: 20px;
          background: rgba(255, 255, 255, 0.96);
          backdrop-filter: blur(14px);
          border: 1px solid rgba(36, 49, 61, 0.08);
          box-shadow: var(--shadow-soft);
        }}
      }}

      @media (max-width: 760px) {{
        .page {{
          padding-left: 16px;
          padding-right: 16px;
        }}

        .header-band,
        .emergency-strip,
        .detail-grid {{
          grid-template-columns: minmax(0, 1fr);
        }}

        .header-band,
        .emergency-strip {{
          display: grid;
        }}

        .detail-grid {{
          display: grid;
        }}

        .frame-panel,
        .main-frame,
        .rail,
        .recap-column,
        .table-card {{
          padding: 18px;
        }}
      }}
    </style>
  </head>
  <body data-layout="focus_frame">
    <div class="page" data-testid="patient-intake-mission-frame">
      <header class="header-band" data-testid="journey-header">
        <div class="brand">
          <span class="wordmark">Vecells</span>
          <svg aria-hidden="true" width="78" height="18" viewBox="0 0 78 18" fill="none">
            <path d="M1 9C13 2 19 2 27 9C35 16 43 16 52 9C59 4 66 4 77 9" stroke="#5B61F6" stroke-width="2" stroke-linecap="round"/>
            <circle cx="27" cy="9" r="2.25" fill="#2F6FED"/>
            <circle cx="52" cy="9" r="2.25" fill="#117A55"/>
          </svg>
          <div class="header-copy">
            <h1>Phase 1 intake mission frame</h1>
            <p>One premium same-shell intake contract for public browser start, recovery, urgent guidance, receipt, and minimal request status.</p>
          </div>
        </div>
        <div class="header-chip" data-testid="atlas-chip">
          <span>Current truth</span>
          <strong>recovery_only</strong>
        </div>
      </header>

      <section class="emergency-strip" data-testid="emergency-strip" aria-label="Urgent help">
        <div>
          <h2>Need urgent help now?</h2>
          <p>The urgent route is always visible and stays governed. It is never hidden inside helper copy or form validation.</p>
        </div>
        <div class="emergency-actions">
          <a class="emergency-link" href="#urgent-guidance">Get urgent advice</a>
          <a class="subtle-link" href="#details">Review how this route works</a>
        </div>
      </section>

      <button class="peek-drawer-button" type="button" data-testid="peek-drawer-button">Open recap</button>

      <div class="mission-shell" data-testid="mission-frame">
        <nav class="rail card" data-testid="step-rail" aria-label="Journey steps">
          <h2>Frozen steps</h2>
          <p>The step rail is authoritative for route and shell meaning. Every step stays inside one mission frame.</p>
          <div class="step-list" id="step-list"></div>
        </nav>

        <main class="main-frame card">
          <div class="quiet-status-strip" data-testid="quiet-status-strip">
            <div>
              <strong id="quiet-status-title">Draft not started</strong>
              <p id="quiet-status-copy">Authoritative saved posture appears only after DraftSaveSettlement and continuity evidence.</p>
            </div>
            <div class="header-chip"><span>Shell</span><strong id="detail-shell-key">{PATIENT_SHELL_CONTINUITY_KEY}</strong></div>
          </div>

          <section class="frame-panel" data-testid="detail-panel">
            <span class="detail-eyebrow" id="detail-route-family">rf_intake_self_service</span>
            <h2 class="detail-title" id="detail-step-title">{initial_step["step_title"]}</h2>
            <p class="detail-summary" id="detail-step-purpose">{initial_step["purpose"]}</p>

            <div class="detail-grid">
              <div class="detail-card">
                <strong>Route pattern</strong>
                <span id="detail-route-pattern">{initial_step["route_pattern"]}</span>
              </div>
              <div class="detail-card">
                <strong>Primary CTA</strong>
                <span id="detail-primary-cta">{initial_step["primary_cta"]}</span>
              </div>
              <div class="detail-card">
                <strong>Projection fields</strong>
                <span id="detail-output-fields">{initial_step["output_projection_fields"]}</span>
              </div>
              <div class="detail-card">
                <strong>Outcome mode</strong>
                <span id="detail-outcome-mode">pre_submit</span>
              </div>
              <div class="detail-card">
                <strong>Next transitions</strong>
                <span id="detail-next-transitions">{initial_step["next_transitions"]}</span>
              </div>
              <div class="detail-card">
                <strong>Recovery posture</strong>
                <span id="detail-recovery-posture">{initial_step["recovery_posture"]}</span>
              </div>
            </div>

            <div class="journey-spine" data-testid="journey-spine" id="journey-spine"></div>
          </section>

          <section class="tables">
            <article class="table-card card">
              <h2>Step-to-schema matrix</h2>
              <p>Every visible step maps to one frozen schema role and one surface route contract.</p>
              <table data-testid="journey-table">
                <thead>
                  <tr>
                    <th>Step</th>
                    <th>Route</th>
                    <th>Schema</th>
                    <th>Next</th>
                  </tr>
                </thead>
                <tbody id="journey-table-body"></tbody>
              </table>
            </article>

            <article class="table-card card">
              <h2>Schema lock</h2>
              <p>The public schema set is fixed now. No second draft model appears later.</p>
              <table data-testid="schema-table">
                <thead>
                  <tr>
                    <th>Schema</th>
                    <th>Fields</th>
                    <th>Artifact</th>
                  </tr>
                </thead>
                <tbody id="schema-table-body"></tbody>
              </table>
            </article>

            <article class="table-card card">
              <h2>Runtime and recovery bindings</h2>
              <p>Route contract, runtime publication, parity, and same-shell recovery stay explicit.</p>
              <table data-testid="binding-table">
                <thead>
                  <tr>
                    <th>Binding</th>
                    <th>Route contract</th>
                    <th>State</th>
                    <th>Recovery law</th>
                  </tr>
                </thead>
                <tbody id="binding-table-body"></tbody>
              </table>
            </article>

            <article class="table-card card">
              <h2>Event lock</h2>
              <p>request.submitted stays canonical and intake.submitted stays forbidden.</p>
              <table data-testid="event-table">
                <thead>
                  <tr>
                    <th>Event</th>
                    <th>Status</th>
                    <th>Model</th>
                    <th>Schema</th>
                  </tr>
                </thead>
                <tbody id="event-table-body"></tbody>
              </table>
            </article>
          </section>
        </main>

        <aside class="recap-column card" data-testid="recap-column" data-open="false">
          <div>
            <h2>Recap</h2>
            <p>Compact chips keep continuity, not dashboard noise. The same shell key and selected anchor survive step morphs and outcomes.</p>
            <div class="chip-list" id="recap-chip-list"></div>
          </div>
          <div class="detail-card">
            <strong>Current continuity key</strong>
            <span>{PATIENT_SHELL_CONTINUITY_KEY}</span>
          </div>
          <div class="detail-card">
            <strong>Current route truth</strong>
            <span>Simulator-backed, same-shell, recovery_only publication posture</span>
          </div>
          <div class="detail-card">
            <strong>Bounded future seams</strong>
            <span>embedded chrome pending; authenticated uplift later; questionnaire detail seq_140</span>
          </div>
        </aside>
      </div>

      <div class="footer-bar" data-testid="sticky-footer">
        <div>
          <strong id="footer-primary">Start your request</strong>
          <p id="footer-secondary">One dominant action per step, one quiet secondary action only.</p>
        </div>
        <div class="header-chip"><span>Layout</span><strong id="footer-layout">focus_frame</strong></div>
      </div>
    </div>

    <script type="application/json" id="journey-steps-json">
{steps_json}
    </script>
    <script type="application/json" id="schema-summary-json">
{schemas_json}
    </script>
    <script type="application/json" id="binding-examples-json">
{bindings_json}
    </script>
    <script type="application/json" id="event-catalog-json">
{event_json}
    </script>

    <script>
      const steps = JSON.parse(document.getElementById("journey-steps-json").textContent);
      const schemaSummary = JSON.parse(document.getElementById("schema-summary-json").textContent);
      const bindingExamples = JSON.parse(document.getElementById("binding-examples-json").textContent);
      const eventCatalog = JSON.parse(document.getElementById("event-catalog-json").textContent);

      const state = {{
        selectedIndex: 0,
        recapOpen: false,
      }};

      const elements = {{
        stepList: document.getElementById("step-list"),
        journeySpine: document.getElementById("journey-spine"),
        journeyTableBody: document.getElementById("journey-table-body"),
        schemaTableBody: document.getElementById("schema-table-body"),
        bindingTableBody: document.getElementById("binding-table-body"),
        eventTableBody: document.getElementById("event-table-body"),
        recapChipList: document.getElementById("recap-chip-list"),
        detailStepTitle: document.getElementById("detail-step-title"),
        detailStepPurpose: document.getElementById("detail-step-purpose"),
        detailRoutePattern: document.getElementById("detail-route-pattern"),
        detailPrimaryCta: document.getElementById("detail-primary-cta"),
        detailOutputFields: document.getElementById("detail-output-fields"),
        detailNextTransitions: document.getElementById("detail-next-transitions"),
        detailRecoveryPosture: document.getElementById("detail-recovery-posture"),
        detailRouteFamily: document.getElementById("detail-route-family"),
        detailShellKey: document.getElementById("detail-shell-key"),
        detailOutcomeMode: document.getElementById("detail-outcome-mode"),
        quietStatusTitle: document.getElementById("quiet-status-title"),
        quietStatusCopy: document.getElementById("quiet-status-copy"),
        peekDrawerButton: document.querySelector("[data-testid='peek-drawer-button']"),
        recapColumn: document.querySelector("[data-testid='recap-column']"),
        footerPrimary: document.getElementById("footer-primary"),
        footerSecondary: document.getElementById("footer-secondary"),
        footerLayout: document.getElementById("footer-layout"),
      }};

      const stepButtons = [];

      function applyLayout() {{
        const missionStack = window.innerWidth <= 1120;
        document.body.dataset.layout = missionStack ? "mission_stack" : "focus_frame";
        elements.footerLayout.textContent = document.body.dataset.layout;
        if (!missionStack) {{
          state.recapOpen = false;
          elements.recapColumn.dataset.open = "false";
        }}
      }}

      function outcomeModeFor(step) {{
        if (step.step_key === "urgent_outcome") {{
          return "urgent_diversion";
        }}
        if (step.step_key === "receipt_outcome") {{
          return "receipt";
        }}
        if (step.step_key === "request_status") {{
          return "status";
        }}
        return "pre_submit";
      }}

      function renderRail() {{
        steps.forEach((step, index) => {{
          const button = document.createElement("button");
          button.type = "button";
          button.className = "step-button";
          button.dataset.testid = `step-button-${{step.step_key}}`;
          button.setAttribute("data-testid", `step-button-${{step.step_key}}`);
          button.setAttribute("aria-selected", index === state.selectedIndex ? "true" : "false");
          button.dataset.selected = index === state.selectedIndex ? "true" : "false";
          button.tabIndex = index === state.selectedIndex ? 0 : -1;
          button.innerHTML = `<strong>${{step.step_title}}</strong><span>${{step.primary_cta}}</span>`;
          button.addEventListener("click", () => selectStep(index));
          button.addEventListener("keydown", onStepKeydown);
          elements.stepList.appendChild(button);
          stepButtons.push(button);
        }});
      }}

      function renderSpine() {{
        steps.forEach((step, index) => {{
          const node = document.createElement("div");
          node.className = "spine-node";
          node.setAttribute("data-testid", `journey-spine-node-${{step.step_key}}`);
          node.dataset.active = index === state.selectedIndex ? "true" : "false";
          node.innerHTML = `
            <span class="spine-index">${{index + 1}}</span>
            <div>
              <strong>${{step.step_title}}</strong>
              <span>${{step.route_pattern}}</span>
            </div>
          `;
          elements.journeySpine.appendChild(node);
        }});
      }}

      function renderJourneyTable() {{
        steps.forEach((step) => {{
          const row = document.createElement("tr");
          row.innerHTML = `
            <td>${{step.step_title}}</td>
            <td>${{step.route_pattern}}</td>
            <td>${{step.schema_binding}}</td>
            <td>${{step.next_transitions}}</td>
          `;
          elements.journeyTableBody.appendChild(row);
        }});
      }}

      function renderSchemaTable() {{
        schemaSummary.forEach((schema) => {{
          const row = document.createElement("tr");
          row.innerHTML = `
            <td>${{schema.schemaName}}</td>
            <td>${{schema.requiredFieldCount}}</td>
            <td>${{schema.artifactPath}}</td>
          `;
          elements.schemaTableBody.appendChild(row);
        }});
      }}

      function renderBindingTable() {{
        bindingExamples.forEach((binding) => {{
          const row = document.createElement("tr");
          row.innerHTML = `
            <td>${{binding.intakeSurfaceRuntimeBindingId}}</td>
            <td>${{binding.surfaceRouteContractRef}}</td>
            <td>${{binding.bindingState}}</td>
            <td>${{binding.releaseRecoveryDispositionRef}}</td>
          `;
          elements.bindingTableBody.appendChild(row);
        }});
      }}

      function renderEventTable() {{
        eventCatalog.eventCatalog.forEach((event) => {{
          const row = document.createElement("tr");
          row.innerHTML = `
            <td>${{event.eventName}}</td>
            <td>${{event.phaseStatus}}</td>
            <td>${{event.sourceModel}}</td>
            <td>${{event.schemaVersionRef}}</td>
          `;
          elements.eventTableBody.appendChild(row);
        }});
      }}

      function renderRecapChips() {{
        steps.forEach((step, index) => {{
          const chip = document.createElement("button");
          chip.type = "button";
          chip.className = "recap-chip";
          chip.setAttribute("data-testid", `recap-chip-${{step.step_key}}`);
          chip.dataset.active = index === state.selectedIndex ? "true" : "false";
          chip.textContent = step.step_title;
          chip.addEventListener("click", () => selectStep(index));
          elements.recapChipList.appendChild(chip);
        }});
      }}

      function updateSelection() {{
        const step = steps[state.selectedIndex];
        elements.detailStepTitle.textContent = step.step_title;
        elements.detailStepPurpose.textContent = step.purpose;
        elements.detailRoutePattern.textContent = step.route_pattern;
        elements.detailPrimaryCta.textContent = step.primary_cta;
        elements.detailOutputFields.textContent = step.output_projection_fields;
        elements.detailNextTransitions.textContent = step.next_transitions;
        elements.detailRecoveryPosture.textContent = step.recovery_posture;
        elements.detailRouteFamily.textContent = step.route_family;
        elements.detailShellKey.textContent = step.same_shell_key;
        elements.detailOutcomeMode.textContent = outcomeModeFor(step);
        elements.quietStatusTitle.textContent = step.quiet_status_state.replaceAll("_", " ");
        elements.quietStatusCopy.textContent = step.recovery_posture;
        elements.footerPrimary.textContent = step.primary_cta;
        elements.footerSecondary.textContent = step.step_title;

        stepButtons.forEach((button, index) => {{
          const selected = index === state.selectedIndex;
          button.dataset.selected = selected ? "true" : "false";
          button.setAttribute("aria-selected", selected ? "true" : "false");
          button.tabIndex = selected ? 0 : -1;
        }});

        document.querySelectorAll("[data-testid^='journey-spine-node-']").forEach((node, index) => {{
          node.dataset.active = index === state.selectedIndex ? "true" : "false";
        }});

        document.querySelectorAll("[data-testid^='recap-chip-']").forEach((chip, index) => {{
          chip.dataset.active = index === state.selectedIndex ? "true" : "false";
        }});
      }}

      function selectStep(index, focus = false) {{
        state.selectedIndex = Math.max(0, Math.min(index, steps.length - 1));
        updateSelection();
        if (focus) {{
          stepButtons[state.selectedIndex].focus();
        }}
      }}

      function onStepKeydown(event) {{
        const focusedIndex = stepButtons.indexOf(event.currentTarget);
        const currentIndex = focusedIndex >= 0 ? focusedIndex : state.selectedIndex;
        if (event.key === "ArrowDown" || event.key === "ArrowRight") {{
          event.preventDefault();
          selectStep(currentIndex + 1, true);
          return;
        }}
        if (event.key === "ArrowUp" || event.key === "ArrowLeft") {{
          event.preventDefault();
          selectStep(currentIndex - 1, true);
          return;
        }}
        if (event.key === "Home") {{
          event.preventDefault();
          selectStep(0, true);
          return;
        }}
        if (event.key === "End") {{
          event.preventDefault();
          selectStep(steps.length - 1, true);
        }}
      }}

      function toggleRecap() {{
        state.recapOpen = !state.recapOpen;
        elements.recapColumn.dataset.open = state.recapOpen ? "true" : "false";
      }}

      function init() {{
        renderRail();
        renderSpine();
        renderJourneyTable();
        renderSchemaTable();
        renderBindingTable();
        renderEventTable();
        renderRecapChips();
        updateSelection();
        applyLayout();

        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {{
          document.body.classList.add("reduced-motion");
        }}

        elements.peekDrawerButton.addEventListener("click", toggleRecap);
        window.addEventListener("resize", applyLayout);
      }}

      init();
    </script>
  </body>
</html>
"""


def main() -> None:
    generated_at = now_iso()
    context = extract_phase0_context()
    journey_rows = build_journey_rows(context)
    surface_binding_examples = build_surface_binding_examples(context, journey_rows)
    draft_example = build_draft_example(context)
    draft_schema = build_draft_schema(draft_example)
    surface_binding_schema = build_surface_binding_schema(surface_binding_examples)
    settlement_examples = build_settlement_examples(context, context["intake_manifest"])
    submit_settlement_schema = build_submit_settlement_schema(settlement_examples)
    outcome_examples = build_outcome_examples(context, context["intake_manifest"])
    outcome_artifact_schema = build_outcome_artifact_schema(outcome_examples)
    schema_summary = build_schema_summary(
        draft_schema,
        surface_binding_schema,
        submit_settlement_schema,
        outcome_artifact_schema,
    )
    event_catalog = build_event_catalog()

    event_catalog["generated_at"] = generated_at

    write_json(DRAFT_SCHEMA_PATH, draft_schema)
    write_json(SURFACE_BINDING_SCHEMA_PATH, surface_binding_schema)
    write_json(SUBMIT_SETTLEMENT_SCHEMA_PATH, submit_settlement_schema)
    write_json(OUTCOME_ARTIFACT_SCHEMA_PATH, outcome_artifact_schema)
    write_json(EVENT_CATALOG_JSON_PATH, event_catalog)
    write_csv(
        JOURNEY_MATRIX_PATH,
        journey_rows,
        [
            "step_key",
            "step_title",
            "route_pattern",
            "purpose",
            "inputs_collected",
            "output_projection_fields",
            "route_family",
            "recovery_posture",
            "next_transitions",
            "selected_anchor_key",
            "primary_cta",
            "quiet_status_state",
            "surface_route_contract_ref",
            "schema_binding",
            "same_shell_key",
        ],
    )

    write_text(
        API_CONTRACT_DOC_PATH,
        build_api_contract_doc(context, journey_rows, draft_example, settlement_examples, outcome_examples),
    )
    write_text(
        SCHEMA_LOCK_DOC_PATH,
        build_schema_lock_doc(
            draft_schema,
            surface_binding_schema,
            submit_settlement_schema,
            outcome_artifact_schema,
            schema_summary,
        ),
    )
    write_text(EVENT_CATALOG_DOC_PATH, build_event_catalog_doc(event_catalog))
    write_text(
        JOURNEY_CONTRACT_DOC_PATH,
        build_journey_contract_doc(context, journey_rows, surface_binding_examples, event_catalog),
    )
    write_text(EXPERIENCE_SPEC_DOC_PATH, build_experience_spec_doc(journey_rows))
    write_text(
        ATLAS_HTML_PATH,
        build_atlas_html(
            journey_rows,
            schema_summary,
            surface_binding_examples,
            event_catalog,
        ),
    )

    print("seq_139 Phase 1 intake contracts generated.")


if __name__ == "__main__":
    main()
