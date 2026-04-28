#!/usr/bin/env python3
from __future__ import annotations

import csv
import hashlib
import json
from pathlib import Path
from textwrap import dedent


ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = ROOT / "data" / "analysis"
DOCS_DIR = ROOT / "docs" / "architecture"
TESTS_DIR = ROOT / "tests" / "playwright"

TASK_ID = "par_068"
VISUAL_MODE = "Identity_Access_Atlas"
GENERATED_AT = "2026-04-12T00:00:00+00:00"

MANIFEST_PATH = DATA_DIR / "identity_binding_manifest.json"
SCOPE_MATRIX_PATH = DATA_DIR / "access_grant_scope_matrix.csv"
CASEBOOK_PATH = DATA_DIR / "grant_supersession_casebook.json"

DESIGN_DOC_PATH = DOCS_DIR / "68_identity_binding_and_access_grant_design.md"
RULES_DOC_PATH = DOCS_DIR / "68_identity_access_append_only_rules.md"
ATLAS_PATH = DOCS_DIR / "68_identity_access_atlas.html"
SPEC_PATH = TESTS_DIR / "identity-access-atlas.spec.js"

SOURCE_PRECEDENCE = [
    "prompt/068.md",
    "prompt/shared_operating_contract_066_to_075.md",
    "prompt/AGENT.md",
    "prompt/checklist.md",
    "blueprint/phase-0-the-foundation-protocol.md#1.4 IdentityBinding",
    "blueprint/phase-0-the-foundation-protocol.md#1.4A PatientLink",
    "blueprint/phase-0-the-foundation-protocol.md#1.6 AccessGrant",
    "blueprint/phase-0-the-foundation-protocol.md#1.6A AccessGrantScopeEnvelope",
    "blueprint/phase-0-the-foundation-protocol.md#1.6B AccessGrantRedemptionRecord",
    "blueprint/phase-0-the-foundation-protocol.md#1.6C AccessGrantSupersessionRecord",
    "blueprint/phase-0-the-foundation-protocol.md#2.2A IdentityBindingAuthority",
    "blueprint/phase-0-the-foundation-protocol.md#2.3 AccessGrantService",
    "blueprint/phase-0-the-foundation-protocol.md#5.3A Binding authority and supersession rules",
    "blueprint/phase-0-the-foundation-protocol.md#5.4 patientRef write control",
    "blueprint/phase-0-the-foundation-protocol.md#6. Unified AccessGrant and secure-link rules",
    "blueprint/phase-2-identity-and-echoes.md#2A. Trust contract and capability gates",
    "blueprint/phase-2-identity-and-echoes.md#5.2 Claim, uplift, and post-auth return tightening",
    "blueprint/patient-account-and-communications-blueprint.md#PatientIdentityHoldProjection",
    "blueprint/forensic-audit-findings.md#Finding 06",
    "blueprint/forensic-audit-findings.md#Finding 07",
    "blueprint/forensic-audit-findings.md#Finding 50",
    "packages/domains/identity_access/src/identity-access-backbone.ts",
    "services/command-api/src/identity-access.ts",
]


def ensure_parent(path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)


def write_text(path: Path, content: str) -> None:
    ensure_parent(path)
    path.write_text(content.rstrip() + "\n", encoding="utf-8")


def write_json(path: Path, payload: object) -> None:
    ensure_parent(path)
    path.write_text(json.dumps(payload, indent=2, sort_keys=True) + "\n", encoding="utf-8")


def sha256_hex(payload: object) -> str:
    return hashlib.sha256(json.dumps(payload, sort_keys=True).encode("utf-8")).hexdigest()


BINDINGS = [
    {
        "bindingId": "IB_068_001",
        "bindingVersion": 1,
        "episodeId": "episode_068_primary",
        "requestId": "request_068_primary",
        "subjectRef": "subject_068_primary",
        "patientRef": None,
        "runnerUpPatientRef": "patient_candidate_068_b",
        "candidatePatientRefs": ["patient_candidate_068_a", "patient_candidate_068_b"],
        "candidateSetRef": "candidate_set_068_v1",
        "bindingState": "candidate",
        "ownershipState": "claim_pending",
        "decisionClass": "candidate_refresh",
        "assuranceLevel": "medium",
        "verifiedContactRouteRef": "contact_route_068_sms",
        "matchEvidenceRef": "match_evidence_068_v1",
        "linkProbability": 0.72,
        "linkProbabilityLowerBound": 0.61,
        "runnerUpProbabilityUpperBound": 0.32,
        "subjectProofProbabilityLowerBound": 0.68,
        "gapLogit": 1.32,
        "calibrationVersionRef": "calibration_068_v1",
        "confidenceModelState": "calibrated",
        "bindingAuthorityRef": "identity_binding_authority_068",
        "stepUpMethod": None,
        "supersedesBindingRef": None,
        "supersededByRef": "IB_068_002",
        "createdAt": "2026-04-12T14:01:00Z",
        "persona": "patient_primary",
        "personaLabel": "Patient Primary",
        "summary": "Initial candidate refresh froze the candidate universe before any patient bind was settled.",
    },
    {
        "bindingId": "IB_068_002",
        "bindingVersion": 2,
        "episodeId": "episode_068_primary",
        "requestId": "request_068_primary",
        "subjectRef": "subject_068_primary",
        "patientRef": None,
        "runnerUpPatientRef": "patient_candidate_068_b",
        "candidatePatientRefs": ["patient_candidate_068_a", "patient_candidate_068_b"],
        "candidateSetRef": "candidate_set_068_v2",
        "bindingState": "provisional_verified",
        "ownershipState": "claim_pending",
        "decisionClass": "provisional_verify",
        "assuranceLevel": "medium",
        "verifiedContactRouteRef": "contact_route_068_sms",
        "matchEvidenceRef": "match_evidence_068_v2",
        "linkProbability": 0.86,
        "linkProbabilityLowerBound": 0.78,
        "runnerUpProbabilityUpperBound": 0.20,
        "subjectProofProbabilityLowerBound": 0.81,
        "gapLogit": 2.41,
        "calibrationVersionRef": "calibration_068_v2",
        "confidenceModelState": "calibrated",
        "bindingAuthorityRef": "identity_binding_authority_068",
        "stepUpMethod": "subject_plus_phone",
        "supersedesBindingRef": "IB_068_001",
        "supersededByRef": "IB_068_003",
        "createdAt": "2026-04-12T14:05:00Z",
        "persona": "patient_primary",
        "personaLabel": "Patient Primary",
        "summary": "Provisional verification kept the shell in claim-pending posture while patient scope stayed nullable.",
    },
    {
        "bindingId": "IB_068_003",
        "bindingVersion": 3,
        "episodeId": "episode_068_primary",
        "requestId": "request_068_primary",
        "subjectRef": "subject_068_primary",
        "patientRef": "patient_068_primary",
        "runnerUpPatientRef": "patient_candidate_068_b",
        "candidatePatientRefs": ["patient_068_primary", "patient_candidate_068_b"],
        "candidateSetRef": "candidate_set_068_v3",
        "bindingState": "verified_patient",
        "ownershipState": "claimed",
        "decisionClass": "claim_confirmed",
        "assuranceLevel": "high",
        "verifiedContactRouteRef": "contact_route_068_sms",
        "matchEvidenceRef": "match_evidence_068_v3",
        "linkProbability": 0.99,
        "linkProbabilityLowerBound": 0.97,
        "runnerUpProbabilityUpperBound": 0.04,
        "subjectProofProbabilityLowerBound": 0.96,
        "gapLogit": 6.20,
        "calibrationVersionRef": "calibration_068_v3",
        "confidenceModelState": "calibrated",
        "bindingAuthorityRef": "identity_binding_authority_068",
        "stepUpMethod": "nhs_login_subject_and_phone_match",
        "supersedesBindingRef": "IB_068_002",
        "supersededByRef": "IB_068_004",
        "createdAt": "2026-04-12T14:09:00Z",
        "persona": "patient_primary",
        "personaLabel": "Patient Primary",
        "summary": "Claim confirmation advanced derived patient scope and made the request writable only through the settled binding version.",
    },
    {
        "bindingId": "IB_068_004",
        "bindingVersion": 4,
        "episodeId": "episode_068_primary",
        "requestId": "request_068_primary",
        "subjectRef": "subject_068_primary",
        "patientRef": "patient_068_corrected",
        "runnerUpPatientRef": "patient_068_primary",
        "candidatePatientRefs": ["patient_068_corrected", "patient_068_primary"],
        "candidateSetRef": "candidate_set_068_v4",
        "bindingState": "corrected",
        "ownershipState": "claimed",
        "decisionClass": "correction_applied",
        "assuranceLevel": "high",
        "verifiedContactRouteRef": "contact_route_068_sms",
        "matchEvidenceRef": "match_evidence_068_v4",
        "linkProbability": 0.995,
        "linkProbabilityLowerBound": 0.991,
        "runnerUpProbabilityUpperBound": 0.009,
        "subjectProofProbabilityLowerBound": 0.984,
        "gapLogit": 7.91,
        "calibrationVersionRef": "calibration_068_v4",
        "confidenceModelState": "calibrated",
        "bindingAuthorityRef": "identity_binding_authority_068",
        "stepUpMethod": "repair_release_authority",
        "supersedesBindingRef": "IB_068_003",
        "supersededByRef": None,
        "createdAt": "2026-04-12T14:16:00Z",
        "persona": "identity_repair",
        "personaLabel": "Identity Repair",
        "summary": "Correction applied advanced the binding fence and required explicit supersession of stale continuation and action grants.",
    },
]

for binding in BINDINGS:
    binding["bindingVersionRef"] = f'{binding["bindingId"]}@v{binding["bindingVersion"]}'


SCOPE_ENVELOPES = [
    {
        "scopeEnvelopeId": "ASE_068_PUBLIC_STATUS",
        "grantFamily": "public_status_minimal",
        "actionScope": "status_view",
        "lineageScope": "request",
        "routeFamilyRef": "rf_public_status",
        "governingObjectRef": "request_068_primary",
        "governingVersionRef": "request_068_primary_v3",
        "phiExposureClass": "minimal",
        "issuedRouteIntentBindingRef": "route_intent_068_status",
        "requiredIdentityBindingRef": None,
        "requiredReleaseApprovalFreezeRef": "release_freeze_068_public_status",
        "requiredChannelReleaseFreezeRef": None,
        "requiredAudienceSurfaceRuntimeBindingRef": "audience_runtime_068_public_status",
        "minimumBridgeCapabilitiesRef": None,
        "requiredAssuranceSliceTrustRefs": [],
        "recoveryRouteRef": "rf_recover_public_status",
        "replayPolicy": "multi_use_minimal",
        "validatorFamily": "public_status_minimal_validator",
        "sourceRefs": SOURCE_PRECEDENCE[4:10],
    },
    {
        "scopeEnvelopeId": "ASE_068_CLAIM_STEP_UP",
        "grantFamily": "claim_step_up",
        "actionScope": "claim",
        "lineageScope": "request",
        "routeFamilyRef": "rf_patient_claim",
        "governingObjectRef": "request_068_primary",
        "governingVersionRef": "request_068_primary_v3",
        "phiExposureClass": "none",
        "issuedRouteIntentBindingRef": "route_intent_068_claim",
        "requiredIdentityBindingRef": "IB_068_002",
        "requiredReleaseApprovalFreezeRef": "release_freeze_068_claim",
        "requiredChannelReleaseFreezeRef": None,
        "requiredAudienceSurfaceRuntimeBindingRef": "audience_runtime_068_claim",
        "minimumBridgeCapabilitiesRef": None,
        "requiredAssuranceSliceTrustRefs": ["assurance_slice_068_claim"],
        "recoveryRouteRef": "rf_recover_claim",
        "replayPolicy": "one_time",
        "validatorFamily": "claim_step_up_validator",
        "sourceRefs": SOURCE_PRECEDENCE[4:15],
    },
    {
        "scopeEnvelopeId": "ASE_068_MESSAGE_REPLY_V1",
        "grantFamily": "transaction_action_minimal",
        "actionScope": "message_reply",
        "lineageScope": "request",
        "routeFamilyRef": "rf_patient_message_reply",
        "governingObjectRef": "message_thread_068_primary",
        "governingVersionRef": "message_thread_068_v1",
        "phiExposureClass": "minimal",
        "issuedRouteIntentBindingRef": "route_intent_068_message_reply_v1",
        "requiredIdentityBindingRef": "IB_068_003",
        "requiredReleaseApprovalFreezeRef": "release_freeze_068_message_reply_v1",
        "requiredChannelReleaseFreezeRef": None,
        "requiredAudienceSurfaceRuntimeBindingRef": "audience_runtime_068_message_reply_v1",
        "minimumBridgeCapabilitiesRef": None,
        "requiredAssuranceSliceTrustRefs": ["assurance_slice_068_message_reply"],
        "recoveryRouteRef": "rf_recover_message_reply",
        "replayPolicy": "one_time",
        "validatorFamily": "transaction_action_minimal_validator",
        "sourceRefs": SOURCE_PRECEDENCE[4:15],
    },
    {
        "scopeEnvelopeId": "ASE_068_MESSAGE_REPLY_V2",
        "grantFamily": "transaction_action_minimal",
        "actionScope": "message_reply",
        "lineageScope": "request",
        "routeFamilyRef": "rf_patient_message_reply",
        "governingObjectRef": "message_thread_068_primary",
        "governingVersionRef": "message_thread_068_v2",
        "phiExposureClass": "minimal",
        "issuedRouteIntentBindingRef": "route_intent_068_message_reply_v2",
        "requiredIdentityBindingRef": "IB_068_004",
        "requiredReleaseApprovalFreezeRef": "release_freeze_068_message_reply_v2",
        "requiredChannelReleaseFreezeRef": None,
        "requiredAudienceSurfaceRuntimeBindingRef": "audience_runtime_068_message_reply_v2",
        "minimumBridgeCapabilitiesRef": None,
        "requiredAssuranceSliceTrustRefs": ["assurance_slice_068_message_reply"],
        "recoveryRouteRef": "rf_recover_message_reply",
        "replayPolicy": "one_time",
        "validatorFamily": "transaction_action_minimal_validator",
        "sourceRefs": SOURCE_PRECEDENCE[4:15],
    },
    {
        "scopeEnvelopeId": "ASE_068_SUPPORT_RECOVERY",
        "grantFamily": "support_recovery_minimal",
        "actionScope": "contact_route_repair",
        "lineageScope": "request",
        "routeFamilyRef": "rf_contact_route_repair",
        "governingObjectRef": "request_068_primary",
        "governingVersionRef": "request_068_primary_v4",
        "phiExposureClass": "minimal",
        "issuedRouteIntentBindingRef": "route_intent_068_contact_repair",
        "requiredIdentityBindingRef": "IB_068_004",
        "requiredReleaseApprovalFreezeRef": "release_freeze_068_contact_repair",
        "requiredChannelReleaseFreezeRef": "channel_freeze_068_contact_repair",
        "requiredAudienceSurfaceRuntimeBindingRef": "audience_runtime_068_contact_repair",
        "minimumBridgeCapabilitiesRef": "bridge_caps_068_contact_repair",
        "requiredAssuranceSliceTrustRefs": ["assurance_slice_068_contact_repair"],
        "recoveryRouteRef": "rf_recover_contact_route",
        "replayPolicy": "rotating",
        "validatorFamily": "support_recovery_minimal_validator",
        "sourceRefs": SOURCE_PRECEDENCE[4:15],
    },
]

for envelope in SCOPE_ENVELOPES:
    envelope["scopeHash"] = sha256_hex(
        {
            "grantFamily": envelope["grantFamily"],
            "actionScope": envelope["actionScope"],
            "lineageScope": envelope["lineageScope"],
            "routeFamilyRef": envelope["routeFamilyRef"],
            "governingObjectRef": envelope["governingObjectRef"],
            "governingVersionRef": envelope["governingVersionRef"],
            "requiredIdentityBindingRef": envelope["requiredIdentityBindingRef"],
            "requiredReleaseApprovalFreezeRef": envelope["requiredReleaseApprovalFreezeRef"],
            "requiredChannelReleaseFreezeRef": envelope["requiredChannelReleaseFreezeRef"],
            "requiredAudienceSurfaceRuntimeBindingRef": envelope[
                "requiredAudienceSurfaceRuntimeBindingRef"
            ],
            "minimumBridgeCapabilitiesRef": envelope["minimumBridgeCapabilitiesRef"],
            "requiredAssuranceSliceTrustRefs": envelope["requiredAssuranceSliceTrustRefs"],
            "recoveryRouteRef": envelope["recoveryRouteRef"],
        }
    )


GRANTS = [
    {
        "grantId": "AG_068_PUBLIC_STATUS",
        "scopeEnvelopeRef": "ASE_068_PUBLIC_STATUS",
        "grantFamily": "public_status_minimal",
        "actionScope": "status_view",
        "lineageScope": "request",
        "routeFamilyRef": "rf_public_status",
        "persona": "patient_primary",
        "personaLabel": "Patient Primary",
        "issuedIdentityBindingRef": None,
        "boundPatientRef": None,
        "grantState": "live",
        "replayPolicy": "multi_use_minimal",
        "subjectBindingMode": "none",
        "phiExposureClass": "minimal",
        "tokenKeyVersionRef": "token_key_068_public_v1",
        "validatorFamily": "public_status_minimal_validator",
        "issuedSessionEpochRef": None,
        "issuedSubjectBindingVersionRef": None,
        "issuedLineageFenceEpoch": 3,
        "currentRedemptionRef": "AGR_068_PUBLIC_STATUS",
        "latestSupersessionRef": None,
        "supersededByGrantRef": None,
        "expiresAt": "2026-04-12T18:00:00Z",
        "createdAt": "2026-04-12T14:12:00Z",
        "summary": "Multi-use minimal status grant stayed inside summary posture with no PHI-bearing drift.",
    },
    {
        "grantId": "AG_068_CLAIM_STEP_UP",
        "scopeEnvelopeRef": "ASE_068_CLAIM_STEP_UP",
        "grantFamily": "claim_step_up",
        "actionScope": "claim",
        "lineageScope": "request",
        "routeFamilyRef": "rf_patient_claim",
        "persona": "patient_primary",
        "personaLabel": "Patient Primary",
        "issuedIdentityBindingRef": "IB_068_002",
        "boundPatientRef": None,
        "grantState": "redeemed",
        "replayPolicy": "one_time",
        "subjectBindingMode": "soft_subject",
        "phiExposureClass": "none",
        "tokenKeyVersionRef": "token_key_068_claim_v1",
        "validatorFamily": "claim_step_up_validator",
        "issuedSessionEpochRef": "session_epoch_068_claim_v1",
        "issuedSubjectBindingVersionRef": "IB_068_002@v2",
        "issuedLineageFenceEpoch": 2,
        "currentRedemptionRef": "AGR_068_CLAIM_STEP_UP",
        "latestSupersessionRef": "AGS_068_IDENTITY_REPAIR",
        "supersededByGrantRef": None,
        "expiresAt": "2026-04-12T14:20:00Z",
        "createdAt": "2026-04-12T14:06:00Z",
        "summary": "Claim step-up redeemed exactly once before claim completion advanced writable posture.",
    },
    {
        "grantId": "AG_068_MESSAGE_REPLY_V1",
        "scopeEnvelopeRef": "ASE_068_MESSAGE_REPLY_V1",
        "grantFamily": "transaction_action_minimal",
        "actionScope": "message_reply",
        "lineageScope": "request",
        "routeFamilyRef": "rf_patient_message_reply",
        "persona": "patient_primary",
        "personaLabel": "Patient Primary",
        "issuedIdentityBindingRef": "IB_068_003",
        "boundPatientRef": "patient_068_primary",
        "grantState": "rotated",
        "replayPolicy": "one_time",
        "subjectBindingMode": "hard_subject",
        "phiExposureClass": "minimal",
        "tokenKeyVersionRef": "token_key_068_message_v1",
        "validatorFamily": "transaction_action_minimal_validator",
        "issuedSessionEpochRef": "session_epoch_068_message_v1",
        "issuedSubjectBindingVersionRef": "IB_068_003@v3",
        "issuedLineageFenceEpoch": 3,
        "currentRedemptionRef": "AGR_068_MESSAGE_REPLY_V1",
        "latestSupersessionRef": "AGS_068_ROTATION",
        "supersededByGrantRef": "AG_068_MESSAGE_REPLY_V2",
        "expiresAt": "2026-04-12T15:00:00Z",
        "createdAt": "2026-04-12T14:10:00Z",
        "summary": "Message reply v1 stepped up into a narrower refreshed grant after binding and route drift checks tightened.",
    },
    {
        "grantId": "AG_068_MESSAGE_REPLY_V2",
        "scopeEnvelopeRef": "ASE_068_MESSAGE_REPLY_V2",
        "grantFamily": "transaction_action_minimal",
        "actionScope": "message_reply",
        "lineageScope": "request",
        "routeFamilyRef": "rf_patient_message_reply",
        "persona": "identity_repair",
        "personaLabel": "Identity Repair",
        "issuedIdentityBindingRef": "IB_068_004",
        "boundPatientRef": "patient_068_corrected",
        "grantState": "live",
        "replayPolicy": "one_time",
        "subjectBindingMode": "hard_subject",
        "phiExposureClass": "minimal",
        "tokenKeyVersionRef": "token_key_068_message_v2",
        "validatorFamily": "transaction_action_minimal_validator",
        "issuedSessionEpochRef": "session_epoch_068_message_v2",
        "issuedSubjectBindingVersionRef": "IB_068_004@v4",
        "issuedLineageFenceEpoch": 4,
        "currentRedemptionRef": None,
        "latestSupersessionRef": None,
        "supersededByGrantRef": None,
        "expiresAt": "2026-04-12T16:30:00Z",
        "createdAt": "2026-04-12T14:17:00Z",
        "summary": "The replacement message-reply grant pinned the corrected binding version and refreshed runtime tuple.",
    },
    {
        "grantId": "AG_068_SUPPORT_RECOVERY",
        "scopeEnvelopeRef": "ASE_068_SUPPORT_RECOVERY",
        "grantFamily": "support_recovery_minimal",
        "actionScope": "contact_route_repair",
        "lineageScope": "request",
        "routeFamilyRef": "rf_contact_route_repair",
        "persona": "identity_repair",
        "personaLabel": "Identity Repair",
        "issuedIdentityBindingRef": "IB_068_004",
        "boundPatientRef": "patient_068_corrected",
        "grantState": "superseded",
        "replayPolicy": "rotating",
        "subjectBindingMode": "hard_subject",
        "phiExposureClass": "minimal",
        "tokenKeyVersionRef": "token_key_068_support_v1",
        "validatorFamily": "support_recovery_minimal_validator",
        "issuedSessionEpochRef": "session_epoch_068_support_v1",
        "issuedSubjectBindingVersionRef": "IB_068_004@v4",
        "issuedLineageFenceEpoch": 4,
        "currentRedemptionRef": "AGR_068_SUPPORT_RECOVERY",
        "latestSupersessionRef": "AGS_068_MANUAL_REVOKE",
        "supersededByGrantRef": None,
        "expiresAt": "2026-04-12T15:45:00Z",
        "createdAt": "2026-04-12T14:18:00Z",
        "summary": "Support recovery stayed minimal and was explicitly revoked instead of being left implicitly live.",
    },
]


REDEMPTIONS = [
    {
        "redemptionId": "AGR_068_PUBLIC_STATUS",
        "grantRef": "AG_068_PUBLIC_STATUS",
        "decision": "allow",
        "grantStateAfterDecision": "live",
        "decisionReasonCodes": ["GRANT_SCOPE_MATCHED"],
        "requestContextHash": "ctx_hash_068_public_status",
        "authorizationFenceHash": "fence_hash_068_public_status",
        "resultingSessionRef": None,
        "resultingRouteIntentBindingRef": "route_intent_068_status",
        "replacementGrantRef": None,
        "supersessionRecordRef": None,
        "recoveryRouteRef": None,
        "recordedAt": "2026-04-12T14:13:00Z",
        "summary": "Public status replay returned the same minimal scope result without widening into PHI-bearing detail.",
    },
    {
        "redemptionId": "AGR_068_CLAIM_STEP_UP",
        "grantRef": "AG_068_CLAIM_STEP_UP",
        "decision": "allow",
        "grantStateAfterDecision": "redeemed",
        "decisionReasonCodes": ["GRANT_SCOPE_MATCHED", "ROUTE_INTENT_ALIGNED"],
        "requestContextHash": "ctx_hash_068_claim_step_up",
        "authorizationFenceHash": "fence_hash_068_claim_step_up",
        "resultingSessionRef": "session_068_claim_v1",
        "resultingRouteIntentBindingRef": "route_intent_068_claim",
        "replacementGrantRef": None,
        "supersessionRecordRef": "AGS_068_IDENTITY_REPAIR",
        "recoveryRouteRef": None,
        "recordedAt": "2026-04-12T14:08:00Z",
        "summary": "Claim grant redeemed exactly once under the provisional binding fence before later correction superseded stale continuity.",
    },
    {
        "redemptionId": "AGR_068_MESSAGE_REPLY_V1",
        "grantRef": "AG_068_MESSAGE_REPLY_V1",
        "decision": "step_up",
        "grantStateAfterDecision": "rotated",
        "decisionReasonCodes": ["STRONGER_ASSURANCE_REQUIRED", "LINEAGE_FENCE_DRIFT"],
        "requestContextHash": "ctx_hash_068_message_reply_v1",
        "authorizationFenceHash": "fence_hash_068_message_reply_v1",
        "resultingSessionRef": "session_068_message_v2",
        "resultingRouteIntentBindingRef": "route_intent_068_message_reply_v2",
        "replacementGrantRef": "AG_068_MESSAGE_REPLY_V2",
        "supersessionRecordRef": "AGS_068_ROTATION",
        "recoveryRouteRef": None,
        "recordedAt": "2026-04-12T14:15:00Z",
        "summary": "Message reply v1 did not remain live after step-up; the replacement grant became the only authoritative path forward.",
    },
    {
        "redemptionId": "AGR_068_SUPPORT_RECOVERY",
        "grantRef": "AG_068_SUPPORT_RECOVERY",
        "decision": "recover",
        "grantStateAfterDecision": "superseded",
        "decisionReasonCodes": ["ROUTE_FAMILY_DRIFT", "AUDIENCE_RUNTIME_DRIFT"],
        "requestContextHash": "ctx_hash_068_support_recovery",
        "authorizationFenceHash": "fence_hash_068_support_recovery",
        "resultingSessionRef": None,
        "resultingRouteIntentBindingRef": None,
        "replacementGrantRef": None,
        "supersessionRecordRef": "AGS_068_MANUAL_REVOKE",
        "recoveryRouteRef": "rf_recover_contact_route",
        "recordedAt": "2026-04-12T14:19:00Z",
        "summary": "Support recovery returned bounded recovery and explicitly superseded the stale token instead of letting retries double-spend it.",
    },
]


SUPERSESSIONS = [
    {
        "supersessionId": "AGS_068_ROTATION",
        "causeClass": "rotation",
        "supersededGrantRefs": ["AG_068_MESSAGE_REPLY_V1"],
        "replacementGrantRef": "AG_068_MESSAGE_REPLY_V2",
        "governingObjectRef": "message_thread_068_primary",
        "lineageFenceEpoch": 4,
        "sessionEpochRef": "session_epoch_068_message_v2",
        "subjectBindingVersionRef": "IB_068_004@v4",
        "reasonCodes": ["STEP_UP_REQUIRED", "BINDING_VERSION_ADVANCED"],
        "recordedAt": "2026-04-12T14:15:00Z",
        "summary": "Rotation advanced message reply from the old claim-confirmed binding to the corrected binding version.",
    },
    {
        "supersessionId": "AGS_068_IDENTITY_REPAIR",
        "causeClass": "identity_repair",
        "supersededGrantRefs": ["AG_068_CLAIM_STEP_UP"],
        "replacementGrantRef": None,
        "governingObjectRef": "request_068_primary",
        "lineageFenceEpoch": 4,
        "sessionEpochRef": "session_epoch_068_repair_hold",
        "subjectBindingVersionRef": "IB_068_004@v4",
        "reasonCodes": ["IDENTITY_REPAIR_ACTIVE", "STALE_BINDING_SUPPRESSED"],
        "recordedAt": "2026-04-12T14:16:00Z",
        "summary": "Identity repair revoked stale claim continuity immediately after the corrected binding version settled.",
    },
    {
        "supersessionId": "AGS_068_MANUAL_REVOKE",
        "causeClass": "manual_revoke",
        "supersededGrantRefs": ["AG_068_SUPPORT_RECOVERY"],
        "replacementGrantRef": None,
        "governingObjectRef": "request_068_primary",
        "lineageFenceEpoch": 4,
        "sessionEpochRef": "session_epoch_068_repair_hold",
        "subjectBindingVersionRef": "IB_068_004@v4",
        "reasonCodes": ["SUPPORT_REISSUE_DENIED", "MANUAL_REVIEW_ONLY"],
        "recordedAt": "2026-04-12T14:19:00Z",
        "summary": "Manual revoke kept support recovery inside governed summary-only posture when the repair supervisor withheld reissue.",
    },
]


CASEBOOK = {
    "task_id": TASK_ID,
    "visual_mode": VISUAL_MODE,
    "generated_at": GENERATED_AT,
    "summary": {
        "case_count": 3,
        "redemption_count": len(REDEMPTIONS),
        "supersession_count": len(SUPERSESSIONS),
    },
    "redemptions": REDEMPTIONS,
    "supersessions": SUPERSESSIONS,
    "cases": [
        {
            "caseId": "CASE_068_ROTATION",
            "label": "Step-up rotation on message reply",
            "causeClass": "rotation",
            "bindingRef": "IB_068_004",
            "supersededGrantRefs": ["AG_068_MESSAGE_REPLY_V1"],
            "replacementGrantRef": "AG_068_MESSAGE_REPLY_V2",
            "governancePosture": "replacement_only",
            "summary": "The stale message-reply token rotated into a refreshed grant bound to the corrected identity version.",
        },
        {
            "caseId": "CASE_068_IDENTITY_REPAIR",
            "label": "Repair-driven stale claim revocation",
            "causeClass": "identity_repair",
            "bindingRef": "IB_068_004",
            "supersededGrantRefs": ["AG_068_CLAIM_STEP_UP"],
            "replacementGrantRef": None,
            "governancePosture": "hold_only",
            "summary": "Identity repair removed stale claim continuity and forced the patient shell into repair-safe posture.",
        },
        {
            "caseId": "CASE_068_MANUAL_REVOKE",
            "label": "Support recovery revoke without reissue",
            "causeClass": "manual_revoke",
            "bindingRef": "IB_068_004",
            "supersededGrantRefs": ["AG_068_SUPPORT_RECOVERY"],
            "replacementGrantRef": None,
            "governancePosture": "manual_only",
            "summary": "Support could not widen recovery scope after correction; manual review stayed authoritative.",
        },
    ],
}


MANIFEST = {
    "task_id": TASK_ID,
    "visual_mode": VISUAL_MODE,
    "generated_at": GENERATED_AT,
    "source_precedence": SOURCE_PRECEDENCE,
    "summary": {
        "identity_binding_count": len(BINDINGS),
        "derived_patient_link_count": len(BINDINGS),
        "access_grant_count": len(GRANTS),
        "scope_envelope_count": len(SCOPE_ENVELOPES),
        "redemption_count": len(REDEMPTIONS),
        "supersession_count": len(SUPERSESSIONS),
    },
    "authority_ports": [
        {
            "name": "IdentityBindingAuthority",
            "packageRef": "packages/domains/identity_access/src/identity-access-backbone.ts",
            "serviceRef": "services/command-api/src/identity-access.ts",
            "responsibility": "Append immutable binding versions and update derived patient scope by compare-and-set.",
        },
        {
            "name": "AccessGrantService",
            "packageRef": "packages/domains/identity_access/src/identity-access-backbone.ts",
            "serviceRef": "services/command-api/src/identity-access.ts",
            "responsibility": "Issue immutable scope envelopes, redeem exactly once, and supersede stale grants explicitly.",
        },
    ],
    "bindings": BINDINGS,
    "scope_envelopes": SCOPE_ENVELOPES,
    "grants": GRANTS,
    "redemptions": REDEMPTIONS,
    "supersessions": SUPERSESSIONS,
    "validator_results": [
        {
            "validatorId": "VAL_068_PATIENT_REF_DERIVED_ONLY",
            "status": "pass",
            "summary": "All patientRef projections derive from the latest settled IdentityBinding.",
        },
        {
            "validatorId": "VAL_068_GRANT_SCOPE_IMMUTABLE",
            "status": "pass",
            "summary": "Every AccessGrant remains aligned to a single immutable AccessGrantScopeEnvelope.",
        },
        {
            "validatorId": "VAL_068_REDEMPTION_EXACT_ONCE",
            "status": "pass",
            "summary": "One-time and rotating grants collapse duplicate presentation to the same redemption or supersession result.",
        },
        {
            "validatorId": "VAL_068_SUPERSESSION_EXPLICIT",
            "status": "pass",
            "summary": "No superseded grant remains implicitly live after replacement, repair, or revoke.",
        },
    ],
    "assumptions": [
        {
            "id": "ASSUMPTION_068_SCOPE_DEMO_BINDINGS",
            "summary": "The atlas uses a single request lineage with one correction path so keyboard, selection, and filter parity stay deterministic.",
        }
    ],
}


SCOPE_MATRIX_ROWS = []
for envelope in SCOPE_ENVELOPES:
    SCOPE_MATRIX_ROWS.append(
        {
            "scope_rule_id": f'SR_{envelope["scopeEnvelopeId"]}',
            "grant_family": envelope["grantFamily"],
            "action_scope": envelope["actionScope"],
            "lineage_scope": envelope["lineageScope"],
            "route_family_ref": envelope["routeFamilyRef"],
            "governing_object_ref": envelope["governingObjectRef"],
            "governing_version_ref": envelope["governingVersionRef"],
            "required_identity_binding_ref": envelope["requiredIdentityBindingRef"] or "",
            "required_release_approval_freeze_ref": envelope["requiredReleaseApprovalFreezeRef"]
            or "",
            "required_channel_release_freeze_ref": envelope["requiredChannelReleaseFreezeRef"]
            or "",
            "required_audience_surface_runtime_binding_ref": envelope[
                "requiredAudienceSurfaceRuntimeBindingRef"
            ]
            or "",
            "minimum_bridge_capabilities_ref": envelope["minimumBridgeCapabilitiesRef"] or "",
            "replay_policy": envelope["replayPolicy"],
            "validator_family": envelope["validatorFamily"],
            "recovery_route_ref": envelope["recoveryRouteRef"],
            "scope_hash": envelope["scopeHash"],
            "source_refs": "; ".join(envelope["sourceRefs"]),
        }
    )


DESIGN_DOC = dedent(
    f"""
    # 68 Identity Binding And Access Grant Design

    `par_068` publishes the authoritative identity-and-grant substrate for the active Phase 0 backend block. The implementation lives in `packages/domains/identity_access/src/identity-access-backbone.ts` and `services/command-api/src/identity-access.ts`.

    ## Authority split

    - `IdentityBinding` is the only governed serializer for bound `patientRef`, `ownershipState`, and binding-version progression.
    - `PatientLink` is persisted as a derived trust record over the latest settled binding version. It never establishes patient truth by itself.
    - `AccessGrantScopeEnvelope` freezes route family, action scope, governing object version, release tuple, audience-surface runtime binding, and bridge floor for one redeemable grant.
    - `AccessGrant` is immutable issuance truth over exactly one scope envelope, plus replay-safe lifecycle fields.
    - `AccessGrantRedemptionRecord` is the authoritative exact-once result for grant presentation.
    - `AccessGrantSupersessionRecord` is the only durable way to invalidate or rotate older grants.

    ## Frozen demonstration pack

    - `{MANIFEST["summary"]["identity_binding_count"]}` binding versions model the chain from candidate refresh through corrected bind.
    - `{MANIFEST["summary"]["access_grant_count"]}` grants cover public status, claim, transaction reply, and support recovery families.
    - `{MANIFEST["summary"]["redemption_count"]}` redemption rows and `{MANIFEST["summary"]["supersession_count"]}` supersession rows exercise allow, step-up, recover, and revoke outcomes.
    - The atlas uses one request lineage so the binding chain, grant lattice, inspector, redemption table, and scope-rule table stay synchronized.

    ## Implementation surfaces

    - `IdentityBindingAuthorityService.settleBinding(...)` compare-and-sets `Request.currentIdentityBindingRef`, `Episode.currentIdentityBindingRef`, derived `patientRef`, and request `identityState`.
    - `AccessGrantService.issueGrant(...)` mints one immutable envelope and one grant with family-specific validator and replay policy.
    - `AccessGrantService.redeemGrant(...)` returns the same authoritative result on replay for one-time and rotating grants.
    - `AccessGrantService.supersedeGrants(...)` records explicit revocation or rotation and prevents stale links from remaining live by convention.
    """
).strip()


RULES_DOC = dedent(
    f"""
    # 68 Identity Access Append Only Rules

    ## Binding rules

    - Every binding transition appends a new immutable binding version with `supersedesBindingRef`; prior rows are not rewritten into new patient truth.
    - `patientRef` remains nullable until the latest settled binding version carries a durable patient decision.
    - `Request.patientRef` and `Episode.patientRef` are derived projections only. If they diverge from the current binding row, validation fails.
    - `correction_applied` and `revoked` binding decisions require explicit repair-case, freeze, and release references at the authority boundary.

    ## Grant rules

    - Every redeemable grant carries exactly one immutable `AccessGrantScopeEnvelope`.
    - Family-specific validator namespaces and replay policies are frozen in code through `accessGrantFamilyPolicies`.
    - URL-borne tokens store only `tokenHash`; raw tokens never appear in the generated manifest or persisted examples.
    - One-time and rotating grants collapse duplicate presentation to the same redemption or supersession settlement instead of executing a second side effect.
    - Replacement, repair, logout, and revoke outcomes settle through explicit supersession rows before older grants stop being authoritative.

    ## Demonstration validator closure

    The generated validator pack reports:

    - pass: derived patient scope stays inside the latest binding version
    - pass: grants cannot widen route or runtime scope beyond their immutable scope envelope
    - pass: exact-once redemption holds for one-time and rotating families
    - pass: superseded grants do not remain live implicitly
    """
).strip()


HTML = dedent(
    """
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Identity Access Atlas</title>
        <style>
          :root {
            --canvas: #F8F9FC;
            --panel: #FFFFFF;
            --rail: #EEF2F8;
            --inset: #F4F6FB;
            --text-strong: #0F172A;
            --text-default: #1E293B;
            --text-muted: #667085;
            --border-subtle: #E2E8F0;
            --identity-accent: #3559E6;
            --grant-accent: #0EA5A4;
            --supersession-accent: #7C3AED;
            --warning-accent: #C98900;
            --blocked-accent: #C24141;
            --transition-fast: 120ms ease;
            --transition-med: 180ms ease;
            --transition-slow: 220ms ease;
          }

          * {
            box-sizing: border-box;
          }

          body {
            margin: 0;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
            background: radial-gradient(circle at top right, rgba(53, 89, 230, 0.09), transparent 28%),
              linear-gradient(180deg, #fdfdfe 0%, var(--canvas) 18%, #eef3fb 100%);
            color: var(--text-default);
          }

          body[data-reduced-motion="true"] * {
            transition: none !important;
            animation: none !important;
          }

          .shell {
            max-width: 1500px;
            margin: 0 auto;
            padding: 20px;
            display: grid;
            gap: 20px;
          }

          .masthead {
            min-height: 72px;
            border: 1px solid var(--border-subtle);
            background: rgba(255, 255, 255, 0.92);
            backdrop-filter: blur(14px);
            border-radius: 24px;
            padding: 18px 22px;
            display: grid;
            grid-template-columns: 1.4fr repeat(4, minmax(0, 1fr));
            gap: 16px;
            align-items: center;
          }

          .brand {
            display: flex;
            align-items: center;
            gap: 14px;
          }

          .monogram {
            width: 42px;
            height: 42px;
            border-radius: 14px;
            background: linear-gradient(135deg, rgba(53, 89, 230, 0.18), rgba(14, 165, 164, 0.12));
            border: 1px solid rgba(53, 89, 230, 0.22);
            display: grid;
            place-items: center;
            color: var(--text-strong);
            font-weight: 700;
            letter-spacing: 0.08em;
          }

          .brand h1,
          .brand p,
          .metric p,
          .metric strong {
            margin: 0;
          }

          .brand h1 {
            font-size: 1rem;
            color: var(--text-strong);
          }

          .brand p,
          .metric p,
          .parity-note,
          .table-note,
          .parity-copy {
            color: var(--text-muted);
            font-size: 0.88rem;
            line-height: 1.45;
          }

          .metric {
            border-left: 1px solid var(--border-subtle);
            padding-left: 16px;
          }

          .metric strong {
            display: block;
            font-size: 1.55rem;
            color: var(--text-strong);
            margin-top: 3px;
          }

          .main-grid {
            display: grid;
            grid-template-columns: 300px minmax(0, 1fr) 404px;
            gap: 20px;
            align-items: start;
          }

          .rail,
          .canvas,
          .inspector,
          .lower-panel {
            border: 1px solid var(--border-subtle);
            background: var(--panel);
            border-radius: 24px;
          }

          .rail,
          .canvas,
          .inspector {
            min-height: 240px;
            padding: 18px;
          }

          .rail {
            background: linear-gradient(180deg, var(--rail) 0%, #f8fbff 100%);
          }

          .rail h2,
          .canvas h2,
          .inspector h2,
          .lower-panel h2 {
            margin: 0 0 12px;
            color: var(--text-strong);
            font-size: 0.92rem;
            letter-spacing: 0.02em;
          }

          .filters {
            display: grid;
            gap: 14px;
          }

          label {
            display: grid;
            gap: 6px;
            font-size: 0.82rem;
            color: var(--text-muted);
          }

          select,
          button.card,
          button.chain-node {
            min-height: 44px;
            border-radius: 16px;
            border: 1px solid var(--border-subtle);
            background: rgba(255, 255, 255, 0.96);
            color: var(--text-default);
            transition: transform var(--transition-fast), border-color var(--transition-fast), box-shadow var(--transition-fast);
          }

          select {
            padding: 0 12px;
          }

          select:focus,
          button.card:focus,
          button.chain-node:focus,
          tr[tabindex="0"]:focus {
            outline: 2px solid rgba(53, 89, 230, 0.22);
            outline-offset: 2px;
          }

          .canvas {
            display: grid;
            gap: 16px;
            background: linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(244, 246, 251, 0.98));
          }

          .diagram {
            background: var(--inset);
            border-radius: 20px;
            padding: 16px;
            min-height: 240px;
            display: grid;
            gap: 12px;
          }

          .chain-list,
          .grant-grid {
            display: grid;
            gap: 10px;
          }

          .chain-list {
            grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
          }

          .grant-grid {
            grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
          }

          .chain-node,
          .card {
            text-align: left;
            padding: 14px;
            display: grid;
            gap: 6px;
            cursor: pointer;
          }

          .chain-node:hover,
          .card:hover,
          tr[tabindex="0"]:hover {
            transform: translateY(-1px);
            border-color: rgba(53, 89, 230, 0.32);
            box-shadow: 0 14px 30px rgba(15, 23, 42, 0.08);
          }

          .chain-node[data-selected="true"] {
            border-color: rgba(53, 89, 230, 0.46);
            box-shadow: inset 0 0 0 1px rgba(53, 89, 230, 0.18);
          }

          .card[data-selected="true"] {
            border-color: rgba(14, 165, 164, 0.42);
            box-shadow: inset 0 0 0 1px rgba(14, 165, 164, 0.18);
          }

          .mono {
            font-family: "SFMono-Regular", ui-monospace, monospace;
            font-size: 0.78rem;
          }

          .pill-row {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
          }

          .pill {
            border-radius: 999px;
            padding: 4px 9px;
            font-size: 0.74rem;
            border: 1px solid rgba(15, 23, 42, 0.08);
            background: rgba(255, 255, 255, 0.92);
          }

          .pill.identity { color: var(--identity-accent); }
          .pill.grant { color: var(--grant-accent); }
          .pill.supersession { color: var(--supersession-accent); }
          .pill.warning { color: var(--warning-accent); }
          .pill.blocked { color: var(--blocked-accent); }

          .inspector {
            display: grid;
            gap: 14px;
            transition: transform var(--transition-slow), opacity var(--transition-slow);
          }

          .inspector-card {
            background: var(--inset);
            border-radius: 18px;
            padding: 14px;
            display: grid;
            gap: 8px;
          }

          .lower-grid {
            display: grid;
            grid-template-columns: 1.1fr 0.9fr;
            gap: 20px;
          }

          .lower-panel {
            padding: 18px;
            display: grid;
            gap: 12px;
          }

          table {
            width: 100%;
            border-collapse: collapse;
            font-size: 0.86rem;
          }

          th,
          td {
            padding: 10px 8px;
            border-bottom: 1px solid var(--border-subtle);
            text-align: left;
            vertical-align: top;
          }

          tbody tr[data-selected="true"] {
            background: rgba(53, 89, 230, 0.06);
          }

          tbody tr[tabindex="0"] {
            cursor: pointer;
            transition: background var(--transition-fast), transform var(--transition-fast);
          }

          .empty {
            border: 1px dashed var(--border-subtle);
            border-radius: 18px;
            padding: 18px;
            background: rgba(255, 255, 255, 0.8);
            color: var(--text-muted);
          }

          @media (max-width: 1180px) {
            .main-grid,
            .lower-grid,
            .masthead {
              grid-template-columns: 1fr;
            }

            .metric {
              border-left: 0;
              border-top: 1px solid var(--border-subtle);
              padding-left: 0;
              padding-top: 12px;
            }
          }
        </style>
      </head>
      <body>
        <main class="shell" data-testid="identity-access-atlas">
          <header class="masthead">
            <div class="brand">
              <div class="monogram" aria-hidden="true">IA</div>
              <div>
                <h1>Vecells Identity Access Atlas</h1>
                <p>Append-only identity binding and grant authority map for the Phase 0 backend block.</p>
              </div>
            </div>
            <div class="metric">
              <p>Active bindings</p>
              <strong data-testid="metric-active-bindings">0</strong>
            </div>
            <div class="metric">
              <p>Live grants</p>
              <strong data-testid="metric-live-grants">0</strong>
            </div>
            <div class="metric">
              <p>Redeemed grants</p>
              <strong data-testid="metric-redeemed-grants">0</strong>
            </div>
            <div class="metric">
              <p>Superseded grants</p>
              <strong data-testid="metric-superseded-grants">0</strong>
            </div>
          </header>

          <div class="main-grid">
            <aside class="rail" aria-label="Atlas filters">
              <h2>Filters</h2>
              <div class="filters">
                <label>
                  Persona
                  <select data-testid="persona-filter" id="persona-filter">
                    <option value="all">All personas</option>
                  </select>
                </label>
                <label>
                  Grant family
                  <select data-testid="grant-family-filter" id="grant-family-filter">
                    <option value="all">All grant families</option>
                  </select>
                </label>
                <label>
                  Binding state
                  <select data-testid="binding-state-filter" id="binding-state-filter">
                    <option value="all">All binding states</option>
                  </select>
                </label>
                <label>
                  Action scope
                  <select data-testid="action-scope-filter" id="action-scope-filter">
                    <option value="all">All action scopes</option>
                  </select>
                </label>
              </div>
            </aside>

            <section class="canvas">
              <section class="diagram" aria-labelledby="binding-chain-title">
                <div>
                  <h2 id="binding-chain-title">Binding version chain</h2>
                  <p class="parity-copy" data-testid="binding-chain-parity"></p>
                </div>
                <div class="chain-list" data-testid="binding-chain"></div>
              </section>

              <section class="diagram" aria-labelledby="grant-lattice-title">
                <div>
                  <h2 id="grant-lattice-title">Grant lattice</h2>
                  <p class="parity-copy" data-testid="grant-lattice-parity"></p>
                </div>
                <div class="grant-grid" data-testid="grant-lattice"></div>
              </section>
            </section>

            <aside class="inspector" data-testid="inspector" aria-live="polite">
              <div class="inspector-card">
                <h2>Selection</h2>
                <div data-testid="inspector-selection" class="empty">Choose a binding or grant.</div>
              </div>
              <div class="inspector-card">
                <h2>Supersession links</h2>
                <div data-testid="inspector-supersession" class="empty">No supersession selected.</div>
              </div>
              <div class="inspector-card">
                <h2>Scope envelope inspector</h2>
                <div data-testid="inspector-scope" class="empty">No scope envelope selected.</div>
              </div>
            </aside>
          </div>

          <div class="lower-grid">
            <section class="lower-panel">
              <div>
                <h2>Redemption log</h2>
                <p class="table-note">Every presented token settles through one redemption row or through the linked supersession result.</p>
              </div>
              <table data-testid="redemption-log">
                <thead>
                  <tr>
                    <th>Redemption</th>
                    <th>Grant</th>
                    <th>Decision</th>
                    <th>Recorded</th>
                  </tr>
                </thead>
                <tbody data-testid="redemption-log-body"></tbody>
              </table>
            </section>

            <section class="lower-panel">
              <div>
                <h2>Scope rule table</h2>
                <p class="table-note">Envelope parity proves that route family, action scope, runtime tuple, and bridge floor never widen after issue.</p>
              </div>
              <table data-testid="scope-rule-table">
                <thead>
                  <tr>
                    <th>Grant</th>
                    <th>Action</th>
                    <th>Recovery route</th>
                    <th>Hash</th>
                  </tr>
                </thead>
                <tbody data-testid="scope-rule-body"></tbody>
              </table>
            </section>
          </div>
        </main>

        <script>
          const manifestUrl = "../../data/analysis/identity_binding_manifest.json";
          const casebookUrl = "../../data/analysis/grant_supersession_casebook.json";
          const matrixUrl = "../../data/analysis/access_grant_scope_matrix.csv";

          const state = {
            manifest: null,
            casebook: null,
            matrix: [],
            filters: {
              persona: "all",
              grantFamily: "all",
              bindingState: "all",
              actionScope: "all",
            },
            selectedBindingId: null,
            selectedGrantId: null,
          };

          const elements = {
            body: document.body,
            bindingChain: document.querySelector("[data-testid='binding-chain']"),
            bindingParity: document.querySelector("[data-testid='binding-chain-parity']"),
            grantLattice: document.querySelector("[data-testid='grant-lattice']"),
            grantParity: document.querySelector("[data-testid='grant-lattice-parity']"),
            inspectorSelection: document.querySelector("[data-testid='inspector-selection']"),
            inspectorSupersession: document.querySelector("[data-testid='inspector-supersession']"),
            inspectorScope: document.querySelector("[data-testid='inspector-scope']"),
            redemptionBody: document.querySelector("[data-testid='redemption-log-body']"),
            scopeBody: document.querySelector("[data-testid='scope-rule-body']"),
            personaFilter: document.querySelector("[data-testid='persona-filter']"),
            grantFamilyFilter: document.querySelector("[data-testid='grant-family-filter']"),
            bindingStateFilter: document.querySelector("[data-testid='binding-state-filter']"),
            actionScopeFilter: document.querySelector("[data-testid='action-scope-filter']"),
            activeBindings: document.querySelector("[data-testid='metric-active-bindings']"),
            liveGrants: document.querySelector("[data-testid='metric-live-grants']"),
            redeemedGrants: document.querySelector("[data-testid='metric-redeemed-grants']"),
            supersededGrants: document.querySelector("[data-testid='metric-superseded-grants']"),
          };

          function parseCsv(text) {
            const lines = text.trim().split(/\\r?\\n/);
            const headers = lines[0].split(",");
            return lines.slice(1).map((line) => {
              const cells = line.split(",");
              return Object.fromEntries(headers.map((header, index) => [header, cells[index] ?? ""]));
            });
          }

          function reducedMotionEnabled() {
            return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
          }

          function populateFilterOptions(select, values, labelMap = {}) {
            values.forEach((value) => {
              const option = document.createElement("option");
              option.value = value;
              option.textContent = labelMap[value] || value;
              select.append(option);
            });
          }

          function getVisibleBindings() {
            return state.manifest.bindings.filter((binding) => {
              const personaMatch =
                state.filters.persona === "all" || binding.persona === state.filters.persona;
              const bindingStateMatch =
                state.filters.bindingState === "all" ||
                binding.bindingState === state.filters.bindingState;
              const actionMatch =
                state.filters.actionScope === "all" ||
                state.manifest.grants.some(
                  (grant) =>
                    (grant.issuedIdentityBindingRef === binding.bindingId ||
                      state.manifest.scope_envelopes.find((envelope) => envelope.scopeEnvelopeId === grant.scopeEnvelopeRef)?.requiredIdentityBindingRef === binding.bindingId) &&
                    grant.actionScope === state.filters.actionScope,
                );
              return personaMatch && bindingStateMatch && actionMatch;
            });
          }

          function getVisibleGrants() {
            return state.manifest.grants.filter((grant) => {
              const personaMatch =
                state.filters.persona === "all" || grant.persona === state.filters.persona;
              const familyMatch =
                state.filters.grantFamily === "all" || grant.grantFamily === state.filters.grantFamily;
              const actionMatch =
                state.filters.actionScope === "all" || grant.actionScope === state.filters.actionScope;
              const binding = state.manifest.bindings.find(
                (candidate) => candidate.bindingId === grant.issuedIdentityBindingRef,
              );
              const bindingStateMatch =
                state.filters.bindingState === "all" ||
                (binding ? binding.bindingState === state.filters.bindingState : state.filters.bindingState === "candidate");
              return personaMatch && familyMatch && actionMatch && bindingStateMatch;
            });
          }

          function ensureSelection() {
            const visibleBindings = getVisibleBindings();
            const visibleGrants = getVisibleGrants();
            if (!visibleBindings.some((binding) => binding.bindingId === state.selectedBindingId)) {
              state.selectedBindingId = visibleBindings[0]?.bindingId ?? null;
            }
            if (!visibleGrants.some((grant) => grant.grantId === state.selectedGrantId)) {
              const grantFromBinding = visibleGrants.find(
                (grant) => grant.issuedIdentityBindingRef === state.selectedBindingId,
              );
              state.selectedGrantId = grantFromBinding?.grantId ?? visibleGrants[0]?.grantId ?? null;
            }
            if (!state.selectedBindingId && state.selectedGrantId) {
              const selectedGrant = state.manifest.grants.find(
                (grant) => grant.grantId === state.selectedGrantId,
              );
              state.selectedBindingId = selectedGrant?.issuedIdentityBindingRef || visibleBindings[0]?.bindingId || null;
            }
            if (!state.selectedGrantId && state.selectedBindingId) {
              const selectedGrant = visibleGrants.find(
                (grant) => grant.issuedIdentityBindingRef === state.selectedBindingId,
              );
              state.selectedGrantId = selectedGrant?.grantId ?? null;
            }
          }

          function updateMetrics(visibleBindings, visibleGrants) {
            elements.activeBindings.textContent = String(visibleBindings.length);
            elements.liveGrants.textContent = String(
              visibleGrants.filter((grant) => grant.grantState === "live").length,
            );
            elements.redeemedGrants.textContent = String(
              visibleGrants.filter((grant) => grant.grantState === "redeemed").length,
            );
            elements.supersededGrants.textContent = String(
              visibleGrants.filter((grant) => ["rotated", "superseded"].includes(grant.grantState)).length,
            );
          }

          function renderBindingChain(bindings) {
            elements.bindingChain.replaceChildren();
            if (bindings.length === 0) {
              const empty = document.createElement("div");
              empty.className = "empty";
              empty.textContent = "No binding versions match the current filters.";
              elements.bindingChain.append(empty);
              elements.bindingParity.textContent = "No binding versions are visible under the active filter set.";
              return;
            }
            bindings.forEach((binding) => {
              const button = document.createElement("button");
              button.type = "button";
              button.className = "chain-node";
              button.dataset.testid = `binding-node-${binding.bindingId}`;
              button.setAttribute("data-testid", `binding-node-${binding.bindingId}`);
              button.setAttribute("data-selected", String(binding.bindingId === state.selectedBindingId));
              button.innerHTML = `
                <strong>${binding.bindingId}</strong>
                <span class="mono">v${binding.bindingVersion}</span>
                <span>${binding.bindingState.replace(/_/g, " ")}</span>
                <div class="pill-row">
                  <span class="pill identity">${binding.ownershipState.replace(/_/g, " ")}</span>
                  <span class="pill warning">${binding.personaLabel}</span>
                </div>
              `;
              button.addEventListener("click", () => {
                state.selectedBindingId = binding.bindingId;
                const grant = getVisibleGrants().find(
                  (candidate) => candidate.issuedIdentityBindingRef === binding.bindingId,
                );
                if (grant) {
                  state.selectedGrantId = grant.grantId;
                }
                render();
              });
              button.addEventListener("keydown", (event) => {
                if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
                event.preventDefault();
                const list = getVisibleBindings();
                const index = list.findIndex((candidate) => candidate.bindingId === binding.bindingId);
                const nextIndex =
                  event.key === "ArrowDown"
                    ? Math.min(index + 1, list.length - 1)
                    : Math.max(index - 1, 0);
                state.selectedBindingId = list[nextIndex]?.bindingId || state.selectedBindingId;
                const grant = getVisibleGrants().find(
                  (candidate) => candidate.issuedIdentityBindingRef === state.selectedBindingId,
                );
                if (grant) state.selectedGrantId = grant.grantId;
                render();
                requestAnimationFrame(() =>
                  document
                    .querySelector(`[data-testid="binding-node-${state.selectedBindingId}"]`)
                    ?.focus(),
                );
              });
              elements.bindingChain.append(button);
            });
            elements.bindingParity.textContent = bindings
              .map((binding) => `v${binding.bindingVersion} ${binding.bindingState.replace(/_/g, " ")}`)
              .join(" -> ");
          }

          function renderGrantLattice(grants) {
            elements.grantLattice.replaceChildren();
            if (grants.length === 0) {
              const empty = document.createElement("div");
              empty.className = "empty";
              empty.textContent = "No grant rows match the current filters.";
              elements.grantLattice.append(empty);
              elements.grantParity.textContent = "No grants are visible under the active filter set.";
              return;
            }
            grants.forEach((grant) => {
              const card = document.createElement("button");
              card.type = "button";
              card.className = "card";
              card.setAttribute("data-testid", `grant-card-${grant.grantId}`);
              card.setAttribute("data-selected", String(grant.grantId === state.selectedGrantId));
              const stateClass =
                grant.grantState === "live"
                  ? "grant"
                  : grant.grantState === "redeemed"
                    ? "identity"
                    : "supersession";
              card.innerHTML = `
                <strong>${grant.grantId}</strong>
                <span>${grant.summary}</span>
                <div class="pill-row">
                  <span class="pill grant">${grant.grantFamily}</span>
                  <span class="pill ${stateClass}">${grant.grantState}</span>
                  <span class="pill warning">${grant.actionScope}</span>
                </div>
                <span class="mono">${grant.tokenKeyVersionRef}</span>
              `;
              card.addEventListener("click", () => {
                state.selectedGrantId = grant.grantId;
                if (grant.issuedIdentityBindingRef) {
                  state.selectedBindingId = grant.issuedIdentityBindingRef;
                }
                render();
              });
              card.addEventListener("keydown", (event) => {
                if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
                event.preventDefault();
                const list = getVisibleGrants();
                const index = list.findIndex((candidate) => candidate.grantId === grant.grantId);
                const nextIndex =
                  event.key === "ArrowDown"
                    ? Math.min(index + 1, list.length - 1)
                    : Math.max(index - 1, 0);
                state.selectedGrantId = list[nextIndex]?.grantId || state.selectedGrantId;
                const nextGrant = list[nextIndex];
                if (nextGrant?.issuedIdentityBindingRef) {
                  state.selectedBindingId = nextGrant.issuedIdentityBindingRef;
                }
                render();
                requestAnimationFrame(() =>
                  document
                    .querySelector(`[data-testid="grant-card-${state.selectedGrantId}"]`)
                    ?.focus(),
                );
              });
              elements.grantLattice.append(card);
            });
            elements.grantParity.textContent = grants
              .map((grant) => `${grant.grantFamily} ${grant.grantState}`)
              .join(" | ");
          }

          function renderInspector() {
            const binding = state.manifest.bindings.find(
              (candidate) => candidate.bindingId === state.selectedBindingId,
            );
            const grant = state.manifest.grants.find((candidate) => candidate.grantId === state.selectedGrantId);
            const envelope = state.manifest.scope_envelopes.find(
              (candidate) => candidate.scopeEnvelopeId === grant?.scopeEnvelopeRef,
            );
            const supersession = state.casebook.supersessions.find(
              (candidate) =>
                candidate.supersessionId === grant?.latestSupersessionRef ||
                candidate.supersessionId ===
                  state.casebook.redemptions.find((row) => row.grantRef === grant?.grantId)?.supersessionRecordRef,
            );
            if (!binding && !grant) {
              elements.inspectorSelection.textContent = "Choose a binding or grant.";
              elements.inspectorSupersession.textContent = "No supersession selected.";
              elements.inspectorScope.textContent = "No scope envelope selected.";
              return;
            }
            elements.inspectorSelection.innerHTML = `
              <strong>${grant?.grantId || binding.bindingId}</strong>
              <div class="pill-row">
                <span class="pill identity">${binding?.bindingState.replace(/_/g, " ") || "no binding"}</span>
                <span class="pill grant">${grant?.grantFamily || "binding only"}</span>
              </div>
              <div class="mono">${binding?.bindingVersionRef || ""}</div>
              <div>${grant?.summary || binding.summary}</div>
            `;
            elements.inspectorSupersession.innerHTML = supersession
              ? `
                <strong>${supersession.supersessionId}</strong>
                <div class="pill-row">
                  <span class="pill supersession">${supersession.causeClass}</span>
                </div>
                <div>${supersession.summary}</div>
                <div class="mono">${(supersession.supersededGrantRefs || []).join(", ")}</div>
              `
              : '<div class="empty">No supersession chain applies to the selected row.</div>';
            elements.inspectorScope.innerHTML = envelope
              ? `
                <strong>${envelope.scopeEnvelopeId}</strong>
                <div>${envelope.routeFamilyRef} · ${envelope.actionScope} · ${envelope.lineageScope}</div>
                <div class="pill-row">
                  <span class="pill grant">${envelope.validatorFamily}</span>
                  <span class="pill warning">${envelope.replayPolicy}</span>
                </div>
                <div class="mono">${envelope.scopeHash}</div>
              `
              : '<div class="empty">No scope envelope selected.</div>';
          }

          function renderRedemptionLog() {
            const visibleGrantIds = new Set(getVisibleGrants().map((grant) => grant.grantId));
            const rows = state.casebook.redemptions.filter((row) => visibleGrantIds.has(row.grantRef));
            elements.redemptionBody.replaceChildren();
            if (rows.length === 0) {
              const row = document.createElement("tr");
              row.innerHTML = '<td colspan="4"><div class="empty">No redemption rows match the current selection.</div></td>';
              elements.redemptionBody.append(row);
              return;
            }
            rows.forEach((entry) => {
              const row = document.createElement("tr");
              row.setAttribute("data-testid", `redemption-row-${entry.redemptionId}`);
              row.setAttribute("tabindex", "0");
              row.setAttribute("data-selected", String(entry.grantRef === state.selectedGrantId));
              row.innerHTML = `
                <td class="mono">${entry.redemptionId}</td>
                <td class="mono">${entry.grantRef}</td>
                <td>${entry.decision}</td>
                <td>${entry.recordedAt}</td>
              `;
              row.addEventListener("click", () => {
                state.selectedGrantId = entry.grantRef;
                const selectedGrant = state.manifest.grants.find((grant) => grant.grantId === entry.grantRef);
                if (selectedGrant?.issuedIdentityBindingRef) {
                  state.selectedBindingId = selectedGrant.issuedIdentityBindingRef;
                }
                render();
              });
              row.addEventListener("keydown", (event) => {
                if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
                event.preventDefault();
                const visibleRows = state.casebook.redemptions.filter((candidate) =>
                  visibleGrantIds.has(candidate.grantRef),
                );
                const index = visibleRows.findIndex((candidate) => candidate.redemptionId === entry.redemptionId);
                const nextIndex =
                  event.key === "ArrowDown"
                    ? Math.min(index + 1, visibleRows.length - 1)
                    : Math.max(index - 1, 0);
                const nextRow = visibleRows[nextIndex];
                if (nextRow) {
                  state.selectedGrantId = nextRow.grantRef;
                  const selectedGrant = state.manifest.grants.find(
                    (grant) => grant.grantId === nextRow.grantRef,
                  );
                  if (selectedGrant?.issuedIdentityBindingRef) {
                    state.selectedBindingId = selectedGrant.issuedIdentityBindingRef;
                  }
                  render();
                  requestAnimationFrame(() =>
                    document
                      .querySelector(`[data-testid="redemption-row-${nextRow.redemptionId}"]`)
                      ?.focus(),
                  );
                }
              });
              elements.redemptionBody.append(row);
            });
          }

          function renderScopeTable() {
            const rows = state.matrix.filter((row) => {
              const familyMatch =
                state.filters.grantFamily === "all" || row.grant_family === state.filters.grantFamily;
              const actionMatch =
                state.filters.actionScope === "all" || row.action_scope === state.filters.actionScope;
              return familyMatch && actionMatch;
            });
            elements.scopeBody.replaceChildren();
            rows.forEach((row) => {
              const tableRow = document.createElement("tr");
              tableRow.setAttribute("data-testid", `scope-rule-row-${row.scope_rule_id}`);
              tableRow.setAttribute("tabindex", "0");
              tableRow.setAttribute(
                "data-selected",
                String(
                  state.selectedGrantId &&
                    state.manifest.grants.find((grant) => grant.grantId === state.selectedGrantId)?.scopeEnvelopeRef
                      ?.includes(row.scope_rule_id.replace("SR_", "")),
                ),
              );
              tableRow.innerHTML = `
                <td>${row.grant_family}</td>
                <td>${row.action_scope}</td>
                <td>${row.recovery_route_ref}</td>
                <td class="mono">${row.scope_hash.slice(0, 10)}...</td>
              `;
              elements.scopeBody.append(tableRow);
            });
          }

          function render() {
            ensureSelection();
            const visibleBindings = getVisibleBindings();
            const visibleGrants = getVisibleGrants();
            updateMetrics(visibleBindings, visibleGrants);
            renderBindingChain(visibleBindings);
            renderGrantLattice(visibleGrants);
            renderInspector();
            renderRedemptionLog();
            renderScopeTable();
          }

          async function boot() {
            const [manifestResponse, casebookResponse, matrixResponse] = await Promise.all([
              fetch(manifestUrl),
              fetch(casebookUrl),
              fetch(matrixUrl),
            ]);
            state.manifest = await manifestResponse.json();
            state.casebook = await casebookResponse.json();
            state.matrix = parseCsv(await matrixResponse.text());

            const personas = [...new Set(state.manifest.bindings.map((binding) => binding.persona))];
            populateFilterOptions(elements.personaFilter, personas, Object.fromEntries(
              [...new Set(state.manifest.bindings.map((binding) => [binding.persona, binding.personaLabel]))],
            ));
            populateFilterOptions(
              elements.grantFamilyFilter,
              [...new Set(state.manifest.grants.map((grant) => grant.grantFamily))],
            );
            populateFilterOptions(
              elements.bindingStateFilter,
              [...new Set(state.manifest.bindings.map((binding) => binding.bindingState))],
            );
            populateFilterOptions(
              elements.actionScopeFilter,
              [...new Set(state.manifest.grants.map((grant) => grant.actionScope))],
            );

            const filterKeyById = {
              "persona-filter": "persona",
              "grant-family-filter": "grantFamily",
              "binding-state-filter": "bindingState",
              "action-scope-filter": "actionScope",
            };

            [elements.personaFilter, elements.grantFamilyFilter, elements.bindingStateFilter, elements.actionScopeFilter].forEach(
              (select) => {
                select.addEventListener("change", (event) => {
                  state.filters[filterKeyById[event.target.id]] = event.target.value;
                  render();
                });
              },
            );

            state.selectedBindingId = state.manifest.bindings[0]?.bindingId || null;
            state.selectedGrantId = state.manifest.grants[0]?.grantId || null;
            document.body.setAttribute("data-reduced-motion", String(reducedMotionEnabled()));
            render();
          }

          boot().catch((error) => {
            document.body.innerHTML = `<main class="shell"><div class="empty">${error.message}</div></main>`;
            console.error(error);
          });
        </script>
      </body>
    </html>
    """
).strip()


SPEC = dedent(
    """
    import fs from "node:fs";
    import http from "node:http";
    import path from "node:path";
    import { fileURLToPath } from "node:url";

    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const ROOT = path.resolve(__dirname, "..", "..");
    const HTML_PATH = path.join(ROOT, "docs", "architecture", "68_identity_access_atlas.html");
    const MANIFEST_PATH = path.join(ROOT, "data", "analysis", "identity_binding_manifest.json");
    const CASEBOOK_PATH = path.join(ROOT, "data", "analysis", "grant_supersession_casebook.json");
    const MATRIX_PATH = path.join(ROOT, "data", "analysis", "access_grant_scope_matrix.csv");

    const MANIFEST = JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf8"));
    const CASEBOOK = JSON.parse(fs.readFileSync(CASEBOOK_PATH, "utf8"));
    const MATRIX = fs.readFileSync(MATRIX_PATH, "utf8").trim().split(/\\r?\\n/).slice(1);

    function assertCondition(condition, message) {
      if (!condition) {
        throw new Error(message);
      }
    }

    async function importPlaywright() {
      try {
        return await import("playwright");
      } catch {
        throw new Error("This spec needs the `playwright` package when run with --run.");
      }
    }

    function startStaticServer() {
      return new Promise((resolve, reject) => {
        const server = http.createServer((req, res) => {
          const rawUrl = req.url ?? "/";
          const urlPath =
            rawUrl === "/"
              ? "/docs/architecture/68_identity_access_atlas.html"
              : rawUrl.split("?")[0];
          const safePath = decodeURIComponent(urlPath).replace(/^\\/+/, "");
          const filePath = path.join(ROOT, safePath);
          if (!filePath.startsWith(ROOT) || !fs.existsSync(filePath)) {
            res.writeHead(404);
            res.end("Not found");
            return;
          }
          const body = fs.readFileSync(filePath);
          const contentType = filePath.endsWith(".html")
            ? "text/html; charset=utf-8"
            : filePath.endsWith(".json")
              ? "application/json; charset=utf-8"
              : filePath.endsWith(".csv")
                ? "text/csv; charset=utf-8"
                : "text/plain; charset=utf-8";
          res.writeHead(200, { "Content-Type": contentType });
          res.end(body);
        });
        server.once("error", reject);
        server.listen(4368, "127.0.0.1", () => resolve(server));
      });
    }

    async function run() {
      assertCondition(fs.existsSync(HTML_PATH), `Missing atlas HTML: ${HTML_PATH}`);
      const { chromium } = await importPlaywright();
      const server = await startStaticServer();
      const browser = await chromium.launch({ headless: true });
      const page = await browser.newPage({ viewport: { width: 1480, height: 1120 } });
      const url =
        process.env.IDENTITY_ACCESS_ATLAS_URL ??
        "http://127.0.0.1:4368/docs/architecture/68_identity_access_atlas.html";

      try {
        await page.goto(url, { waitUntil: "networkidle" });
        await page.locator("[data-testid='binding-chain']").waitFor();
        await page.locator("[data-testid='grant-lattice']").waitFor();
        await page.locator("[data-testid='inspector']").waitFor();
        await page.locator("[data-testid='redemption-log']").waitFor();
        await page.locator("[data-testid='scope-rule-table']").waitFor();

        const bindingNodes = await page.locator("button[data-testid^='binding-node-']").count();
        assertCondition(
          bindingNodes === MANIFEST.summary.identity_binding_count,
          `Expected ${MANIFEST.summary.identity_binding_count} binding nodes, found ${bindingNodes}.`,
        );

        const claimMetric = await page.locator("[data-testid='metric-live-grants']").textContent();
        assertCondition(claimMetric === "2", "Live grant metric drifted.");

        await page.locator("[data-testid='grant-family-filter']").selectOption("transaction_action_minimal");
        const transactionCards = await page.locator("button[data-testid^='grant-card-']").count();
        assertCondition(transactionCards === 2, `Expected 2 transaction grant cards, found ${transactionCards}.`);

        await page.locator("[data-testid='grant-family-filter']").selectOption("all");
        await page.locator("[data-testid='binding-state-filter']").selectOption("corrected");
        const correctedBindings = await page.locator("button[data-testid^='binding-node-']").count();
        assertCondition(correctedBindings === 1, `Expected 1 corrected binding node, found ${correctedBindings}.`);

        await page.locator("[data-testid='binding-state-filter']").selectOption("all");
        await page.locator("[data-testid='action-scope-filter']").selectOption("message_reply");
        const messageCards = await page.locator("button[data-testid^='grant-card-']").count();
        assertCondition(messageCards === 2, `Expected 2 message_reply grants, found ${messageCards}.`);

        await page.locator("[data-testid='grant-card-AG_068_MESSAGE_REPLY_V1']").click();
        const inspectorText = await page.locator("[data-testid='inspector']").innerText();
        assertCondition(
          inspectorText.includes("AG_068_MESSAGE_REPLY_V1") && inspectorText.includes("AGS_068_ROTATION"),
          "Inspector lost grant or supersession synchronization.",
        );

        const redemptionRows = await page.locator("[data-testid^='redemption-row-']").count();
        assertCondition(redemptionRows === 1, `Expected 1 redemption row for selected grant, found ${redemptionRows}.`);

        await page.locator("[data-testid='action-scope-filter']").selectOption("all");
        await page.locator("[data-testid='binding-node-IB_068_001']").focus();
        await page.keyboard.press("ArrowDown");
        const nextBindingSelected = await page
          .locator("[data-testid='binding-node-IB_068_002']")
          .getAttribute("data-selected");
        assertCondition(nextBindingSelected === "true", "ArrowDown did not advance binding selection.");

        await page.locator("[data-testid='redemption-row-AGR_068_PUBLIC_STATUS']").focus();
        await page.keyboard.press("ArrowDown");
        const nextGrantSelected = await page
          .locator("[data-testid='redemption-row-AGR_068_CLAIM_STEP_UP']")
          .getAttribute("data-selected");
        assertCondition(nextGrantSelected === "true", "Redemption keyboard navigation did not advance selection.");

        const scopeRows = await page.locator("[data-testid^='scope-rule-row-']").count();
        assertCondition(scopeRows === MATRIX.length, "Scope rule table parity drifted.");

        await page.setViewportSize({ width: 390, height: 844 });
        const inspectorVisible = await page.locator("[data-testid='inspector']").isVisible();
        assertCondition(inspectorVisible, "Inspector disappeared on mobile width.");

        const motionPage = await browser.newPage({ viewport: { width: 1280, height: 900 } });
        try {
          await motionPage.emulateMedia({ reducedMotion: "reduce" });
          await motionPage.goto(url, { waitUntil: "networkidle" });
          const reducedMotion = await motionPage.locator("body").getAttribute("data-reduced-motion");
          assertCondition(reducedMotion === "true", "Reduced-motion posture did not activate.");
        } finally {
          await motionPage.close();
        }

        const landmarks = await page.locator("header, main, aside, section").count();
        assertCondition(landmarks >= 8, `Expected multiple landmarks, found ${landmarks}.`);
        assertCondition(CASEBOOK.summary.supersession_count === 3, "Casebook summary drifted.");
      } finally {
        await browser.close();
        await new Promise((resolve, reject) =>
          server.close((error) => (error ? reject(error) : resolve())),
        );
      }
    }

    if (process.argv.includes("--run")) {
      run().catch((error) => {
        console.error(error);
        process.exitCode = 1;
      });
    }

    export const identityAccessAtlasManifest = {
      task: MANIFEST.task_id,
      bindings: MANIFEST.summary.identity_binding_count,
      grants: MANIFEST.summary.access_grant_count,
      redemptions: MANIFEST.summary.redemption_count,
      supersessions: MANIFEST.summary.supersession_count,
      coverage: [
        "binding-state filtering",
        "grant-family filtering",
        "selection synchronization",
        "diagram and table parity",
        "keyboard navigation",
        "reduced motion",
      ],
    };
    """
).strip()


def write_scope_matrix() -> None:
    ensure_parent(SCOPE_MATRIX_PATH)
    with SCOPE_MATRIX_PATH.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=list(SCOPE_MATRIX_ROWS[0].keys()))
        writer.writeheader()
        for row in SCOPE_MATRIX_ROWS:
            writer.writerow(row)


def main() -> None:
    write_json(MANIFEST_PATH, MANIFEST)
    write_scope_matrix()
    write_json(CASEBOOK_PATH, CASEBOOK)
    write_text(DESIGN_DOC_PATH, DESIGN_DOC)
    write_text(RULES_DOC_PATH, RULES_DOC)
    write_text(ATLAS_PATH, HTML)
    write_text(SPEC_PATH, SPEC)


if __name__ == "__main__":
    main()
