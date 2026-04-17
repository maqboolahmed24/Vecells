#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
from pathlib import Path
from textwrap import dedent


ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = ROOT / "data" / "analysis"
DOCS_DIR = ROOT / "docs" / "architecture"
TESTS_DIR = ROOT / "tests" / "playwright"

TASK_ID = "par_069"
VISUAL_MODE = "Reachability_Truth_Studio"
GENERATED_AT = "2026-04-12T00:00:00+00:00"

MANIFEST_PATH = DATA_DIR / "contact_route_snapshot_manifest.json"
DEPENDENCY_MATRIX_PATH = DATA_DIR / "reachability_dependency_matrix.csv"
CASEBOOK_PATH = DATA_DIR / "reachability_assessment_casebook.json"

DESIGN_DOC_PATH = DOCS_DIR / "69_contact_route_and_reachability_design.md"
RULES_DOC_PATH = DOCS_DIR / "69_reachability_assessment_rules.md"
STUDIO_PATH = DOCS_DIR / "69_reachability_truth_studio.html"
SPEC_PATH = TESTS_DIR / "reachability-truth-studio.spec.js"

SOURCE_PRECEDENCE = [
    "prompt/069.md",
    "prompt/shared_operating_contract_066_to_075.md",
    "prompt/AGENT.md",
    "prompt/checklist.md",
    "blueprint/phase-0-the-foundation-protocol.md#1.8D ContactRouteSnapshot",
    "blueprint/phase-0-the-foundation-protocol.md#1.8E ReachabilityObservation",
    "blueprint/phase-0-the-foundation-protocol.md#1.8F ReachabilityAssessmentRecord",
    "blueprint/phase-0-the-foundation-protocol.md#1.9 ReachabilityDependency",
    "blueprint/phase-0-the-foundation-protocol.md#1.9A ContactRouteRepairJourney",
    "blueprint/phase-0-the-foundation-protocol.md#1.9B ContactRouteVerificationCheckpoint",
    "blueprint/phase-0-the-foundation-protocol.md#7. Universal safety-preemption and reachability-risk algorithm",
    "blueprint/patient-account-and-communications-blueprint.md#Recovery and identity-hold contract",
    "blueprint/callback-and-clinician-messaging-loop.md#Callback domain",
    "blueprint/phase-5-the-network-horizon.md#NetworkReminderPlan",
    "blueprint/phase-6-the-pharmacy-loop.md#This sub-phase makes the loop understandable to the patient.",
    "blueprint/forensic-audit-findings.md#Finding 66 - The event catalogue lacked reachability failure and repair events",
    "blueprint/forensic-audit-findings.md#Finding 89 - Reachability, delivery, and consent blockers remained operational facts rather than dominant patient actions",
    "packages/domains/identity_access/src/reachability-backbone.ts",
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


SNAPSHOTS = [
    {
        "contactRouteSnapshotId": "CRS_069_CALLBACK_V1",
        "subjectRef": "subject_069_callback",
        "routeRef": "contact_route_callback_sms",
        "routeVersionRef": "contact_route_callback_sms_v1",
        "routeKind": "sms",
        "normalizedAddressRef": "tel:+447700900111",
        "preferenceProfileRef": "preference_profile_callback_sms",
        "verificationCheckpointRef": None,
        "verificationState": "verified_current",
        "demographicFreshnessState": "current",
        "preferenceFreshnessState": "current",
        "sourceAuthorityClass": "patient_confirmed",
        "supersedesSnapshotRef": None,
        "snapshotVersion": 1,
        "createdAt": "2026-04-12T08:00:00Z",
        "summary": "Original callback route proved current at entry but later failed on live invalid-route evidence.",
    },
    {
        "contactRouteSnapshotId": "CRS_069_CALLBACK_V2",
        "subjectRef": "subject_069_callback",
        "routeRef": "contact_route_callback_sms",
        "routeVersionRef": "contact_route_callback_sms_v2",
        "routeKind": "sms",
        "normalizedAddressRef": "tel:+447700900112",
        "preferenceProfileRef": "preference_profile_callback_sms",
        "verificationCheckpointRef": "CK_069_CALLBACK_OTP",
        "verificationState": "unverified",
        "demographicFreshnessState": "current",
        "preferenceFreshnessState": "current",
        "sourceAuthorityClass": "patient_confirmed",
        "supersedesSnapshotRef": "CRS_069_CALLBACK_V1",
        "snapshotVersion": 2,
        "createdAt": "2026-04-12T08:24:00Z",
        "summary": "Same-shell repair captured a new callback route but kept it non-authoritative until OTP verification clears.",
    },
    {
        "contactRouteSnapshotId": "CRS_069_MESSAGE_V1",
        "subjectRef": "subject_069_message",
        "routeRef": "contact_route_message_email",
        "routeVersionRef": "contact_route_message_email_v1",
        "routeKind": "email",
        "normalizedAddressRef": "mailto:message069@example.com",
        "preferenceProfileRef": "preference_profile_message_email",
        "verificationCheckpointRef": None,
        "verificationState": "verified_current",
        "demographicFreshnessState": "current",
        "preferenceFreshnessState": "current",
        "sourceAuthorityClass": "patient_confirmed",
        "supersedesSnapshotRef": None,
        "snapshotVersion": 1,
        "createdAt": "2026-04-12T08:06:00Z",
        "summary": "Clinician messaging route stayed healthy because durable delivery evidence landed under a current snapshot.",
    },
    {
        "contactRouteSnapshotId": "CRS_069_WAITLIST_V1",
        "subjectRef": "subject_069_waitlist",
        "routeRef": "contact_route_waitlist_sms",
        "routeVersionRef": "contact_route_waitlist_sms_v1",
        "routeKind": "sms",
        "normalizedAddressRef": "tel:+447700900113",
        "preferenceProfileRef": "preference_profile_waitlist_sms",
        "verificationCheckpointRef": None,
        "verificationState": "verified_current",
        "demographicFreshnessState": "current",
        "preferenceFreshnessState": "current",
        "sourceAuthorityClass": "patient_confirmed",
        "supersedesSnapshotRef": None,
        "snapshotVersion": 1,
        "createdAt": "2026-04-12T08:10:00Z",
        "summary": "Waitlist route remains at risk because only transport acceptance exists and no durable reachability proof arrived.",
    },
    {
        "contactRouteSnapshotId": "CRS_069_PHARMACY_V1",
        "subjectRef": "subject_069_pharmacy",
        "routeRef": "contact_route_pharmacy_voice",
        "routeVersionRef": "contact_route_pharmacy_voice_v1",
        "routeKind": "voice",
        "normalizedAddressRef": "tel:+447700900114",
        "preferenceProfileRef": "preference_profile_pharmacy_voice",
        "verificationCheckpointRef": None,
        "verificationState": "verified_current",
        "demographicFreshnessState": "current",
        "preferenceFreshnessState": "current",
        "sourceAuthorityClass": "support_captured",
        "supersedesSnapshotRef": None,
        "snapshotVersion": 1,
        "createdAt": "2026-04-12T08:12:00Z",
        "summary": "Pharmacy urgent-return route failed under live no-answer and invalid-route evidence.",
    },
    {
        "contactRouteSnapshotId": "CRS_069_PHARMACY_V2",
        "subjectRef": "subject_069_pharmacy",
        "routeRef": "contact_route_pharmacy_voice",
        "routeVersionRef": "contact_route_pharmacy_voice_v2",
        "routeKind": "voice",
        "normalizedAddressRef": "tel:+447700900115",
        "preferenceProfileRef": "preference_profile_pharmacy_voice",
        "verificationCheckpointRef": "CK_069_PHARMACY_OTP",
        "verificationState": "unverified",
        "demographicFreshnessState": "current",
        "preferenceFreshnessState": "current",
        "sourceAuthorityClass": "patient_confirmed",
        "supersedesSnapshotRef": "CRS_069_PHARMACY_V1",
        "snapshotVersion": 2,
        "createdAt": "2026-04-12T08:32:00Z",
        "summary": "Pharmacy repair collected a replacement route but verification failed, so the blocker remains active.",
    },
    {
        "contactRouteSnapshotId": "CRS_069_URGENT_V1",
        "subjectRef": "subject_069_urgent",
        "routeRef": "contact_route_urgent_sms",
        "routeVersionRef": "contact_route_urgent_sms_v1",
        "routeKind": "sms",
        "normalizedAddressRef": "tel:+447700900116",
        "preferenceProfileRef": "preference_profile_urgent_sms",
        "verificationCheckpointRef": None,
        "verificationState": "verified_current",
        "demographicFreshnessState": "current",
        "preferenceFreshnessState": "current",
        "sourceAuthorityClass": "patient_confirmed",
        "supersedesSnapshotRef": None,
        "snapshotVersion": 1,
        "createdAt": "2026-04-12T08:14:00Z",
        "summary": "Urgent-return route was originally trusted but became unusable after a strong opt-out signal.",
    },
    {
        "contactRouteSnapshotId": "CRS_069_URGENT_V2",
        "subjectRef": "subject_069_urgent",
        "routeRef": "contact_route_urgent_sms",
        "routeVersionRef": "contact_route_urgent_sms_v2",
        "routeKind": "sms",
        "normalizedAddressRef": "tel:+447700900117",
        "preferenceProfileRef": "preference_profile_urgent_sms",
        "verificationCheckpointRef": "CK_069_URGENT_OTP",
        "verificationState": "unverified",
        "demographicFreshnessState": "current",
        "preferenceFreshnessState": "current",
        "sourceAuthorityClass": "patient_confirmed",
        "supersedesSnapshotRef": "CRS_069_URGENT_V1",
        "snapshotVersion": 2,
        "createdAt": "2026-04-12T08:38:00Z",
        "summary": "Urgent-return repair captured a new route candidate and fenced old reassurance behind the repair journey.",
    },
    {
        "contactRouteSnapshotId": "CRS_069_URGENT_V3",
        "subjectRef": "subject_069_urgent",
        "routeRef": "contact_route_urgent_sms",
        "routeVersionRef": "contact_route_urgent_sms_v2_verified",
        "routeKind": "sms",
        "normalizedAddressRef": "tel:+447700900117",
        "preferenceProfileRef": "preference_profile_urgent_sms",
        "verificationCheckpointRef": "CK_069_URGENT_OTP",
        "verificationState": "verified_current",
        "demographicFreshnessState": "current",
        "preferenceFreshnessState": "current",
        "sourceAuthorityClass": "patient_confirmed",
        "supersedesSnapshotRef": "CRS_069_URGENT_V2",
        "snapshotVersion": 3,
        "createdAt": "2026-04-12T08:44:00Z",
        "summary": "Verification minted the only healthy current urgent-return route and allowed same-shell rebound.",
    },
    {
        "contactRouteSnapshotId": "CRS_069_OUTCOME_V1",
        "subjectRef": "subject_069_outcome",
        "routeRef": "contact_route_outcome_email",
        "routeVersionRef": "contact_route_outcome_email_v1",
        "routeKind": "email",
        "normalizedAddressRef": "mailto:outcome069@example.com",
        "preferenceProfileRef": "preference_profile_outcome_email",
        "verificationCheckpointRef": None,
        "verificationState": "verified_current",
        "demographicFreshnessState": "current",
        "preferenceFreshnessState": "current",
        "sourceAuthorityClass": "patient_confirmed",
        "supersedesSnapshotRef": None,
        "snapshotVersion": 1,
        "createdAt": "2026-04-12T08:18:00Z",
        "summary": "Outcome confirmation route remains disputed while the patient contests whether the latest message was really reachable.",
    },
]

ASSESSMENTS = [
    {
        "reachabilityAssessmentId": "AS_069_CALLBACK_BLOCKED",
        "reachabilityDependencyRef": "DEP_069_CALLBACK",
        "governingObjectRef": "callback_case_069_primary",
        "contactRouteSnapshotRef": "CRS_069_CALLBACK_V1",
        "consideredObservationRefs": ["OBS_069_CALLBACK_INVALID_ROUTE"],
        "priorAssessmentRef": None,
        "routeAuthorityState": "current",
        "deliverabilityState": "confirmed_failed",
        "deliveryRiskState": "likely_failed",
        "assessmentState": "blocked",
        "falseNegativeGuardState": "pass",
        "dominantReasonCode": "INVALID_ROUTE_CONFIRMED",
        "resultingRepairState": "repair_required",
        "resultingReachabilityEpoch": 2,
        "assessedAt": "2026-04-12T08:22:00Z",
    },
    {
        "reachabilityAssessmentId": "AS_069_MESSAGE_CLEAR",
        "reachabilityDependencyRef": "DEP_069_MESSAGE",
        "governingObjectRef": "message_thread_069_primary",
        "contactRouteSnapshotRef": "CRS_069_MESSAGE_V1",
        "consideredObservationRefs": ["OBS_069_MESSAGE_DELIVERED"],
        "priorAssessmentRef": None,
        "routeAuthorityState": "current",
        "deliverabilityState": "confirmed_reachable",
        "deliveryRiskState": "on_track",
        "assessmentState": "clear",
        "falseNegativeGuardState": "pass",
        "dominantReasonCode": "REACHABLE_SIGNAL_CONFIRMED",
        "resultingRepairState": "none",
        "resultingReachabilityEpoch": 2,
        "assessedAt": "2026-04-12T08:26:00Z",
    },
    {
        "reachabilityAssessmentId": "AS_069_WAITLIST_RISK",
        "reachabilityDependencyRef": "DEP_069_WAITLIST",
        "governingObjectRef": "waitlist_offer_069_primary",
        "contactRouteSnapshotRef": "CRS_069_WAITLIST_V1",
        "consideredObservationRefs": ["OBS_069_WAITLIST_ACK"],
        "priorAssessmentRef": None,
        "routeAuthorityState": "current",
        "deliverabilityState": "uncertain",
        "deliveryRiskState": "at_risk",
        "assessmentState": "at_risk",
        "falseNegativeGuardState": "insufficient_observation",
        "dominantReasonCode": "TRANSPORT_ACK_WITHOUT_PROOF",
        "resultingRepairState": "repair_required",
        "resultingReachabilityEpoch": 2,
        "assessedAt": "2026-04-12T08:27:00Z",
    },
    {
        "reachabilityAssessmentId": "AS_069_PHARMACY_BLOCKED",
        "reachabilityDependencyRef": "DEP_069_PHARMACY",
        "governingObjectRef": "pharmacy_case_069_primary",
        "contactRouteSnapshotRef": "CRS_069_PHARMACY_V1",
        "consideredObservationRefs": [
            "OBS_069_PHARMACY_NO_ANSWER",
            "OBS_069_PHARMACY_INVALID_ROUTE",
        ],
        "priorAssessmentRef": None,
        "routeAuthorityState": "current",
        "deliverabilityState": "confirmed_failed",
        "deliveryRiskState": "likely_failed",
        "assessmentState": "blocked",
        "falseNegativeGuardState": "pass",
        "dominantReasonCode": "INVALID_ROUTE_CONFIRMED",
        "resultingRepairState": "repair_required",
        "resultingReachabilityEpoch": 2,
        "assessedAt": "2026-04-12T08:28:00Z",
    },
    {
        "reachabilityAssessmentId": "AS_069_PHARMACY_VERIFY_FAIL",
        "reachabilityDependencyRef": "DEP_069_PHARMACY",
        "governingObjectRef": "pharmacy_case_069_primary",
        "contactRouteSnapshotRef": "CRS_069_PHARMACY_V2",
        "consideredObservationRefs": ["OBS_069_PHARMACY_VERIFY_FAIL"],
        "priorAssessmentRef": "AS_069_PHARMACY_BLOCKED",
        "routeAuthorityState": "stale_verification",
        "deliverabilityState": "uncertain",
        "deliveryRiskState": "at_risk",
        "assessmentState": "blocked",
        "falseNegativeGuardState": "stale_input",
        "dominantReasonCode": "VERIFICATION_FAILURE_RECORDED",
        "resultingRepairState": "awaiting_verification",
        "resultingReachabilityEpoch": 3,
        "assessedAt": "2026-04-12T08:35:00Z",
    },
    {
        "reachabilityAssessmentId": "AS_069_URGENT_BLOCKED",
        "reachabilityDependencyRef": "DEP_069_URGENT",
        "governingObjectRef": "urgent_return_069_primary",
        "contactRouteSnapshotRef": "CRS_069_URGENT_V1",
        "consideredObservationRefs": ["OBS_069_URGENT_OPT_OUT"],
        "priorAssessmentRef": None,
        "routeAuthorityState": "stale_preferences",
        "deliverabilityState": "confirmed_failed",
        "deliveryRiskState": "likely_failed",
        "assessmentState": "blocked",
        "falseNegativeGuardState": "stale_input",
        "dominantReasonCode": "PREFERENCE_OPT_OUT_ACTIVE",
        "resultingRepairState": "repair_required",
        "resultingReachabilityEpoch": 2,
        "assessedAt": "2026-04-12T08:40:00Z",
    },
    {
        "reachabilityAssessmentId": "AS_069_URGENT_CLEAR",
        "reachabilityDependencyRef": "DEP_069_URGENT",
        "governingObjectRef": "urgent_return_069_primary",
        "contactRouteSnapshotRef": "CRS_069_URGENT_V3",
        "consideredObservationRefs": [
            "OBS_069_URGENT_VERIFY_SUCCESS",
            "OBS_069_URGENT_MANUAL_REACH",
        ],
        "priorAssessmentRef": "AS_069_URGENT_BLOCKED",
        "routeAuthorityState": "current",
        "deliverabilityState": "confirmed_reachable",
        "deliveryRiskState": "on_track",
        "assessmentState": "clear",
        "falseNegativeGuardState": "pass",
        "dominantReasonCode": "VERIFICATION_SUCCESS_REBOUND_READY",
        "resultingRepairState": "none",
        "resultingReachabilityEpoch": 4,
        "assessedAt": "2026-04-12T08:45:00Z",
    },
    {
        "reachabilityAssessmentId": "AS_069_OUTCOME_DISPUTED",
        "reachabilityDependencyRef": "DEP_069_OUTCOME",
        "governingObjectRef": "outcome_confirmation_069_primary",
        "contactRouteSnapshotRef": "CRS_069_OUTCOME_V1",
        "consideredObservationRefs": ["OBS_069_OUTCOME_DISPUTE"],
        "priorAssessmentRef": None,
        "routeAuthorityState": "disputed",
        "deliverabilityState": "uncertain",
        "deliveryRiskState": "disputed",
        "assessmentState": "disputed",
        "falseNegativeGuardState": "conflicting_signal",
        "dominantReasonCode": "MANUAL_DISPUTE_OPEN",
        "resultingRepairState": "repair_required",
        "resultingReachabilityEpoch": 2,
        "assessedAt": "2026-04-12T08:29:30Z",
    },
]

OBSERVATIONS = [
    {
        "reachabilityObservationId": "OBS_069_CALLBACK_INVALID_ROUTE",
        "reachabilityDependencyRef": "DEP_069_CALLBACK",
        "contactRouteSnapshotRef": "CRS_069_CALLBACK_V1",
        "observationClass": "invalid_route",
        "observationSourceRef": "telephony:dry_run",
        "observedAt": "2026-04-12T08:21:00Z",
        "recordedAt": "2026-04-12T08:21:00Z",
        "outcomePolarity": "negative",
        "authorityWeight": "strong",
        "evidenceRef": "evidence_callback_invalid_route_069",
    },
    {
        "reachabilityObservationId": "OBS_069_MESSAGE_DELIVERED",
        "reachabilityDependencyRef": "DEP_069_MESSAGE",
        "contactRouteSnapshotRef": "CRS_069_MESSAGE_V1",
        "observationClass": "delivery_receipt",
        "observationSourceRef": "email:receipt_simulator",
        "observedAt": "2026-04-12T08:25:00Z",
        "recordedAt": "2026-04-12T08:25:00Z",
        "outcomePolarity": "positive",
        "authorityWeight": "moderate",
        "evidenceRef": "evidence_message_delivered_069",
    },
    {
        "reachabilityObservationId": "OBS_069_WAITLIST_ACK",
        "reachabilityDependencyRef": "DEP_069_WAITLIST",
        "contactRouteSnapshotRef": "CRS_069_WAITLIST_V1",
        "observationClass": "transport_ack",
        "observationSourceRef": "sms:dispatch_simulator",
        "observedAt": "2026-04-12T08:26:30Z",
        "recordedAt": "2026-04-12T08:26:30Z",
        "outcomePolarity": "positive",
        "authorityWeight": "weak",
        "evidenceRef": "evidence_waitlist_ack_069",
    },
    {
        "reachabilityObservationId": "OBS_069_PHARMACY_NO_ANSWER",
        "reachabilityDependencyRef": "DEP_069_PHARMACY",
        "contactRouteSnapshotRef": "CRS_069_PHARMACY_V1",
        "observationClass": "no_answer",
        "observationSourceRef": "telephony:dry_run",
        "observedAt": "2026-04-12T08:27:30Z",
        "recordedAt": "2026-04-12T08:27:30Z",
        "outcomePolarity": "negative",
        "authorityWeight": "moderate",
        "evidenceRef": "evidence_pharmacy_no_answer_069",
    },
    {
        "reachabilityObservationId": "OBS_069_PHARMACY_INVALID_ROUTE",
        "reachabilityDependencyRef": "DEP_069_PHARMACY",
        "contactRouteSnapshotRef": "CRS_069_PHARMACY_V1",
        "observationClass": "invalid_route",
        "observationSourceRef": "telephony:dry_run",
        "observedAt": "2026-04-12T08:27:50Z",
        "recordedAt": "2026-04-12T08:27:50Z",
        "outcomePolarity": "negative",
        "authorityWeight": "strong",
        "evidenceRef": "evidence_pharmacy_invalid_route_069",
    },
    {
        "reachabilityObservationId": "OBS_069_PHARMACY_VERIFY_FAIL",
        "reachabilityDependencyRef": "DEP_069_PHARMACY",
        "contactRouteSnapshotRef": "CRS_069_PHARMACY_V2",
        "observationClass": "verification_failure",
        "observationSourceRef": "otp:simulator",
        "observedAt": "2026-04-12T08:34:30Z",
        "recordedAt": "2026-04-12T08:34:30Z",
        "outcomePolarity": "negative",
        "authorityWeight": "strong",
        "evidenceRef": "evidence_pharmacy_verify_fail_069",
    },
    {
        "reachabilityObservationId": "OBS_069_URGENT_OPT_OUT",
        "reachabilityDependencyRef": "DEP_069_URGENT",
        "contactRouteSnapshotRef": "CRS_069_URGENT_V1",
        "observationClass": "opt_out",
        "observationSourceRef": "sms:receipt_simulator",
        "observedAt": "2026-04-12T08:39:00Z",
        "recordedAt": "2026-04-12T08:39:00Z",
        "outcomePolarity": "negative",
        "authorityWeight": "strong",
        "evidenceRef": "evidence_urgent_opt_out_069",
    },
    {
        "reachabilityObservationId": "OBS_069_URGENT_VERIFY_SUCCESS",
        "reachabilityDependencyRef": "DEP_069_URGENT",
        "contactRouteSnapshotRef": "CRS_069_URGENT_V3",
        "observationClass": "verification_success",
        "observationSourceRef": "otp:simulator",
        "observedAt": "2026-04-12T08:44:30Z",
        "recordedAt": "2026-04-12T08:44:30Z",
        "outcomePolarity": "positive",
        "authorityWeight": "strong",
        "evidenceRef": "evidence_urgent_verify_success_069",
    },
    {
        "reachabilityObservationId": "OBS_069_URGENT_MANUAL_REACH",
        "reachabilityDependencyRef": "DEP_069_URGENT",
        "contactRouteSnapshotRef": "CRS_069_URGENT_V3",
        "observationClass": "manual_confirmed_reachable",
        "observationSourceRef": "support:manual_confirmation",
        "observedAt": "2026-04-12T08:44:40Z",
        "recordedAt": "2026-04-12T08:44:40Z",
        "outcomePolarity": "positive",
        "authorityWeight": "strong",
        "evidenceRef": "evidence_urgent_manual_reach_069",
    },
    {
        "reachabilityObservationId": "OBS_069_OUTCOME_DISPUTE",
        "reachabilityDependencyRef": "DEP_069_OUTCOME",
        "contactRouteSnapshotRef": "CRS_069_OUTCOME_V1",
        "observationClass": "manual_dispute",
        "observationSourceRef": "support:manual_dispute",
        "observedAt": "2026-04-12T08:29:00Z",
        "recordedAt": "2026-04-12T08:29:00Z",
        "outcomePolarity": "ambiguous",
        "authorityWeight": "strong",
        "evidenceRef": "evidence_outcome_dispute_069",
    },
]

REPAIR_JOURNEYS = [
    {
        "repairJourneyId": "RJ_069_CALLBACK",
        "reachabilityDependencyRef": "DEP_069_CALLBACK",
        "governingObjectRef": "callback_case_069_primary",
        "blockedActionScopeRefs": ["callback_status_entry", "callback_response"],
        "selectedAnchorRef": "anchor_callback_069",
        "requestReturnBundleRef": "return_bundle_callback_069",
        "resumeContinuationRef": "resume_callback_069",
        "patientRecoveryLoopRef": "patient_recovery_loop_callback_069",
        "blockedAssessmentRef": "AS_069_CALLBACK_BLOCKED",
        "currentContactRouteSnapshotRef": "CRS_069_CALLBACK_V1",
        "candidateContactRouteSnapshotRef": "CRS_069_CALLBACK_V2",
        "verificationCheckpointRef": "CK_069_CALLBACK_OTP",
        "resultingReachabilityAssessmentRef": None,
        "journeyState": "awaiting_verification",
        "issuedAt": "2026-04-12T08:23:00Z",
        "updatedAt": "2026-04-12T08:24:30Z",
        "completedAt": None,
    },
    {
        "repairJourneyId": "RJ_069_PHARMACY",
        "reachabilityDependencyRef": "DEP_069_PHARMACY",
        "governingObjectRef": "pharmacy_case_069_primary",
        "blockedActionScopeRefs": ["pharmacy_status_entry", "contact_route_repair"],
        "selectedAnchorRef": "anchor_pharmacy_069",
        "requestReturnBundleRef": "return_bundle_pharmacy_069",
        "resumeContinuationRef": "resume_pharmacy_069",
        "patientRecoveryLoopRef": "patient_recovery_loop_pharmacy_069",
        "blockedAssessmentRef": "AS_069_PHARMACY_BLOCKED",
        "currentContactRouteSnapshotRef": "CRS_069_PHARMACY_V1",
        "candidateContactRouteSnapshotRef": "CRS_069_PHARMACY_V2",
        "verificationCheckpointRef": "CK_069_PHARMACY_OTP",
        "resultingReachabilityAssessmentRef": "AS_069_PHARMACY_VERIFY_FAIL",
        "journeyState": "recovery_required",
        "issuedAt": "2026-04-12T08:30:00Z",
        "updatedAt": "2026-04-12T08:35:30Z",
        "completedAt": None,
    },
    {
        "repairJourneyId": "RJ_069_URGENT",
        "reachabilityDependencyRef": "DEP_069_URGENT",
        "governingObjectRef": "urgent_return_069_primary",
        "blockedActionScopeRefs": ["pharmacy_status_entry", "contact_route_repair"],
        "selectedAnchorRef": "anchor_urgent_069",
        "requestReturnBundleRef": "return_bundle_urgent_069",
        "resumeContinuationRef": "resume_urgent_069",
        "patientRecoveryLoopRef": "patient_recovery_loop_urgent_069",
        "blockedAssessmentRef": "AS_069_URGENT_BLOCKED",
        "currentContactRouteSnapshotRef": "CRS_069_URGENT_V1",
        "candidateContactRouteSnapshotRef": "CRS_069_URGENT_V2",
        "verificationCheckpointRef": "CK_069_URGENT_OTP",
        "resultingReachabilityAssessmentRef": "AS_069_URGENT_CLEAR",
        "journeyState": "completed",
        "issuedAt": "2026-04-12T08:41:00Z",
        "updatedAt": "2026-04-12T08:45:10Z",
        "completedAt": "2026-04-12T08:45:10Z",
    },
]

CHECKPOINTS = [
    {
        "checkpointId": "CK_069_CALLBACK_OTP",
        "repairJourneyRef": "RJ_069_CALLBACK",
        "contactRouteRef": "contact_route_callback_sms",
        "contactRouteVersionRef": "contact_route_callback_sms_v2",
        "preVerificationAssessmentRef": "AS_069_CALLBACK_BLOCKED",
        "verificationMethod": "otp",
        "verificationState": "pending",
        "resultingContactRouteSnapshotRef": None,
        "resultingReachabilityAssessmentRef": None,
        "rebindState": "pending",
        "dependentGrantRefs": ["grant_callback_status_069"],
        "dependentRouteIntentRefs": ["route_intent_callback_repair_069"],
        "evaluatedAt": "2026-04-12T08:24:30Z",
    },
    {
        "checkpointId": "CK_069_PHARMACY_OTP",
        "repairJourneyRef": "RJ_069_PHARMACY",
        "contactRouteRef": "contact_route_pharmacy_voice",
        "contactRouteVersionRef": "contact_route_pharmacy_voice_v2",
        "preVerificationAssessmentRef": "AS_069_PHARMACY_BLOCKED",
        "verificationMethod": "otp",
        "verificationState": "failed",
        "resultingContactRouteSnapshotRef": None,
        "resultingReachabilityAssessmentRef": "AS_069_PHARMACY_VERIFY_FAIL",
        "rebindState": "blocked",
        "dependentGrantRefs": ["grant_pharmacy_status_069"],
        "dependentRouteIntentRefs": ["route_intent_pharmacy_repair_069"],
        "evaluatedAt": "2026-04-12T08:35:00Z",
    },
    {
        "checkpointId": "CK_069_URGENT_OTP",
        "repairJourneyRef": "RJ_069_URGENT",
        "contactRouteRef": "contact_route_urgent_sms",
        "contactRouteVersionRef": "contact_route_urgent_sms_v2_verified",
        "preVerificationAssessmentRef": "AS_069_URGENT_BLOCKED",
        "verificationMethod": "otp",
        "verificationState": "verified",
        "resultingContactRouteSnapshotRef": "CRS_069_URGENT_V3",
        "resultingReachabilityAssessmentRef": "AS_069_URGENT_CLEAR",
        "rebindState": "rebound",
        "dependentGrantRefs": ["grant_urgent_return_069"],
        "dependentRouteIntentRefs": ["route_intent_urgent_repair_069"],
        "evaluatedAt": "2026-04-12T08:45:00Z",
    },
]

DEPENDENCIES = [
    {
        "dependencyId": "DEP_069_CALLBACK",
        "episodeId": "episode_069_callback",
        "requestId": "request_069_callback",
        "domain": "callback",
        "domainObjectRef": "callback_case_069_primary",
        "requiredRouteRef": "contact_route_callback_sms",
        "contactRouteVersionRef": "contact_route_callback_sms_v1",
        "currentContactRouteSnapshotRef": "CRS_069_CALLBACK_V1",
        "currentReachabilityAssessmentRef": "AS_069_CALLBACK_BLOCKED",
        "reachabilityEpoch": 2,
        "purpose": "callback",
        "blockedActionScopeRefs": ["callback_status_entry", "callback_response"],
        "selectedAnchorRef": "anchor_callback_069",
        "requestReturnBundleRef": "return_bundle_callback_069",
        "resumeContinuationRef": "resume_callback_069",
        "repairJourneyRef": "RJ_069_CALLBACK",
        "routeAuthorityState": "current",
        "routeHealthState": "blocked",
        "deliveryRiskState": "likely_failed",
        "repairState": "awaiting_verification",
        "deadlineAt": "2026-04-12T09:00:00Z",
        "failureEffect": "urgent_review",
        "state": "active",
        "createdAt": "2026-04-12T08:20:00Z",
        "updatedAt": "2026-04-12T08:24:30Z",
        "sourceRefs": SOURCE_PRECEDENCE[4:18],
    },
    {
        "dependencyId": "DEP_069_MESSAGE",
        "episodeId": "episode_069_message",
        "requestId": "request_069_message",
        "domain": "patient",
        "domainObjectRef": "message_thread_069_primary",
        "requiredRouteRef": "contact_route_message_email",
        "contactRouteVersionRef": "contact_route_message_email_v1",
        "currentContactRouteSnapshotRef": "CRS_069_MESSAGE_V1",
        "currentReachabilityAssessmentRef": "AS_069_MESSAGE_CLEAR",
        "reachabilityEpoch": 2,
        "purpose": "clinician_message",
        "blockedActionScopeRefs": ["message_thread_entry", "message_reply"],
        "selectedAnchorRef": "anchor_message_069",
        "requestReturnBundleRef": "return_bundle_message_069",
        "resumeContinuationRef": "resume_message_069",
        "repairJourneyRef": None,
        "routeAuthorityState": "current",
        "routeHealthState": "clear",
        "deliveryRiskState": "on_track",
        "repairState": "none",
        "deadlineAt": "2026-04-12T12:00:00Z",
        "failureEffect": "requeue",
        "state": "active",
        "createdAt": "2026-04-12T08:25:30Z",
        "updatedAt": "2026-04-12T08:26:00Z",
        "sourceRefs": SOURCE_PRECEDENCE[4:18],
    },
    {
        "dependencyId": "DEP_069_WAITLIST",
        "episodeId": "episode_069_waitlist",
        "requestId": "request_069_waitlist",
        "domain": "patient",
        "domainObjectRef": "waitlist_offer_069_primary",
        "requiredRouteRef": "contact_route_waitlist_sms",
        "contactRouteVersionRef": "contact_route_waitlist_sms_v1",
        "currentContactRouteSnapshotRef": "CRS_069_WAITLIST_V1",
        "currentReachabilityAssessmentRef": "AS_069_WAITLIST_RISK",
        "reachabilityEpoch": 2,
        "purpose": "waitlist_offer",
        "blockedActionScopeRefs": ["waitlist_offer", "contact_route_repair"],
        "selectedAnchorRef": "anchor_waitlist_069",
        "requestReturnBundleRef": "return_bundle_waitlist_069",
        "resumeContinuationRef": "resume_waitlist_069",
        "repairJourneyRef": None,
        "routeAuthorityState": "current",
        "routeHealthState": "degraded",
        "deliveryRiskState": "at_risk",
        "repairState": "repair_required",
        "deadlineAt": "2026-04-12T11:15:00Z",
        "failureEffect": "invalidate_pending_action",
        "state": "active",
        "createdAt": "2026-04-12T08:26:15Z",
        "updatedAt": "2026-04-12T08:27:00Z",
        "sourceRefs": SOURCE_PRECEDENCE[4:18],
    },
    {
        "dependencyId": "DEP_069_PHARMACY",
        "episodeId": "episode_069_pharmacy",
        "requestId": "request_069_pharmacy",
        "domain": "pharmacy",
        "domainObjectRef": "pharmacy_case_069_primary",
        "requiredRouteRef": "contact_route_pharmacy_voice",
        "contactRouteVersionRef": "contact_route_pharmacy_voice_v1",
        "currentContactRouteSnapshotRef": "CRS_069_PHARMACY_V1",
        "currentReachabilityAssessmentRef": "AS_069_PHARMACY_BLOCKED",
        "reachabilityEpoch": 2,
        "purpose": "pharmacy_contact",
        "blockedActionScopeRefs": ["pharmacy_status_entry", "contact_route_repair"],
        "selectedAnchorRef": "anchor_pharmacy_069",
        "requestReturnBundleRef": "return_bundle_pharmacy_069",
        "resumeContinuationRef": "resume_pharmacy_069",
        "repairJourneyRef": "RJ_069_PHARMACY",
        "routeAuthorityState": "current",
        "routeHealthState": "blocked",
        "deliveryRiskState": "likely_failed",
        "repairState": "repair_required",
        "deadlineAt": "2026-04-12T09:15:00Z",
        "failureEffect": "escalate",
        "state": "active",
        "createdAt": "2026-04-12T08:27:15Z",
        "updatedAt": "2026-04-12T08:35:30Z",
        "sourceRefs": SOURCE_PRECEDENCE[4:18],
    },
    {
        "dependencyId": "DEP_069_URGENT",
        "episodeId": "episode_069_urgent",
        "requestId": "request_069_urgent",
        "domain": "pharmacy",
        "domainObjectRef": "urgent_return_069_primary",
        "requiredRouteRef": "contact_route_urgent_sms",
        "contactRouteVersionRef": "contact_route_urgent_sms_v2_verified",
        "currentContactRouteSnapshotRef": "CRS_069_URGENT_V3",
        "currentReachabilityAssessmentRef": "AS_069_URGENT_CLEAR",
        "reachabilityEpoch": 4,
        "purpose": "urgent_return",
        "blockedActionScopeRefs": ["pharmacy_status_entry", "contact_route_repair"],
        "selectedAnchorRef": "anchor_urgent_069",
        "requestReturnBundleRef": "return_bundle_urgent_069",
        "resumeContinuationRef": "resume_urgent_069",
        "repairJourneyRef": None,
        "routeAuthorityState": "current",
        "routeHealthState": "clear",
        "deliveryRiskState": "on_track",
        "repairState": "none",
        "deadlineAt": "2026-04-12T08:55:00Z",
        "failureEffect": "escalate",
        "state": "active",
        "createdAt": "2026-04-12T08:39:15Z",
        "updatedAt": "2026-04-12T08:45:10Z",
        "sourceRefs": SOURCE_PRECEDENCE[4:18],
    },
    {
        "dependencyId": "DEP_069_OUTCOME",
        "episodeId": "episode_069_outcome",
        "requestId": "request_069_outcome",
        "domain": "staff",
        "domainObjectRef": "outcome_confirmation_069_primary",
        "requiredRouteRef": "contact_route_outcome_email",
        "contactRouteVersionRef": "contact_route_outcome_email_v1",
        "currentContactRouteSnapshotRef": "CRS_069_OUTCOME_V1",
        "currentReachabilityAssessmentRef": "AS_069_OUTCOME_DISPUTED",
        "reachabilityEpoch": 2,
        "purpose": "outcome_confirmation",
        "blockedActionScopeRefs": ["status_view", "contact_route_repair"],
        "selectedAnchorRef": "anchor_outcome_069",
        "requestReturnBundleRef": "return_bundle_outcome_069",
        "resumeContinuationRef": "resume_outcome_069",
        "repairJourneyRef": None,
        "routeAuthorityState": "disputed",
        "routeHealthState": "disputed",
        "deliveryRiskState": "disputed",
        "repairState": "repair_required",
        "deadlineAt": "2026-04-12T10:30:00Z",
        "failureEffect": "urgent_review",
        "state": "active",
        "createdAt": "2026-04-12T08:28:45Z",
        "updatedAt": "2026-04-12T08:29:30Z",
        "sourceRefs": SOURCE_PRECEDENCE[4:18],
    },
]

CASEBOOK = {
    "task_id": TASK_ID,
    "generated_at": GENERATED_AT,
    "summary": {
        "case_count": 4,
        "blocked_case_count": 3,
        "repaired_case_count": 1,
        "source_precedence_count": len(SOURCE_PRECEDENCE),
    },
    "cases": [
        {
            "caseId": "CASE_069_CALLBACK_INVALID_ROUTE",
            "title": "Callback route invalidated while patient promise was active",
            "currentDependencyRef": "DEP_069_CALLBACK",
            "currentAssessmentRef": "AS_069_CALLBACK_BLOCKED",
            "repairJourneyRef": "RJ_069_CALLBACK",
            "headline": "Current blocker is the dependency, not the outbound call log.",
            "sourceRefs": SOURCE_PRECEDENCE[4:18],
        },
        {
            "caseId": "CASE_069_WAITLIST_ACK_ONLY",
            "title": "Waitlist offer has transport acknowledgement but no delivery proof",
            "currentDependencyRef": "DEP_069_WAITLIST",
            "currentAssessmentRef": "AS_069_WAITLIST_RISK",
            "repairJourneyRef": None,
            "headline": "Acceptance stays at-risk until stronger evidence arrives or repair begins.",
            "sourceRefs": SOURCE_PRECEDENCE[4:18],
        },
        {
            "caseId": "CASE_069_PHARMACY_VERIFY_FAIL",
            "title": "Pharmacy repair collected a new route but verification failed",
            "currentDependencyRef": "DEP_069_PHARMACY",
            "currentAssessmentRef": "AS_069_PHARMACY_VERIFY_FAIL",
            "repairJourneyRef": "RJ_069_PHARMACY",
            "headline": "The journey stays same-shell recovery-required and does not silently reopen urgent-return flow.",
            "sourceRefs": SOURCE_PRECEDENCE[4:18],
        },
        {
            "caseId": "CASE_069_URGENT_REBOUND",
            "title": "Urgent return re-entered only after verified snapshot rebound",
            "currentDependencyRef": "DEP_069_URGENT",
            "currentAssessmentRef": "AS_069_URGENT_CLEAR",
            "repairJourneyRef": "RJ_069_URGENT",
            "headline": "Verification minted the fresh snapshot and rebound the dependency before calm posture returned.",
            "sourceRefs": SOURCE_PRECEDENCE[4:18],
        },
    ],
}

MANIFEST = {
    "task_id": TASK_ID,
    "visual_mode": VISUAL_MODE,
    "generated_at": GENERATED_AT,
    "source_precedence": SOURCE_PRECEDENCE,
    "summary": {
        "snapshot_count": len(SNAPSHOTS),
        "dependency_count": len(DEPENDENCIES),
        "assessment_count": len(ASSESSMENTS),
        "observation_count": len(OBSERVATIONS),
        "repair_journey_count": len(REPAIR_JOURNEYS),
        "verification_checkpoint_count": len(CHECKPOINTS),
        "active_dependency_count": sum(1 for dependency in DEPENDENCIES if dependency["state"] == "active"),
        "blocked_promise_count": sum(
            1
            for dependency in DEPENDENCIES
            if dependency["routeHealthState"] in {"blocked", "disputed"}
        ),
        "clear_route_count": sum(
            1 for dependency in DEPENDENCIES if dependency["routeHealthState"] == "clear"
        ),
    },
    "snapshots": SNAPSHOTS,
    "dependencies": DEPENDENCIES,
    "assessments": ASSESSMENTS,
    "observations": OBSERVATIONS,
    "repair_journeys": REPAIR_JOURNEYS,
    "verification_checkpoints": CHECKPOINTS,
    "simulation_scenarios": [
        "sms accepted",
        "sms delivered",
        "sms bounced",
        "sms expired",
        "sms opt-out",
        "voice no-answer",
        "voice invalid-route",
        "voice manual confirmed reachable",
        "voice manual confirmed unreachable",
        "email accepted",
        "email bounced",
        "email disputed",
        "email preference change",
        "otp verification success",
        "otp verification failure",
        "otp expiry",
    ],
}

DEPENDENCY_MATRIX_ROWS = []
ASSESSMENTS_BY_ID = {assessment["reachabilityAssessmentId"]: assessment for assessment in ASSESSMENTS}
SNAPSHOTS_BY_ID = {snapshot["contactRouteSnapshotId"]: snapshot for snapshot in SNAPSHOTS}
for dependency in DEPENDENCIES:
    assessment = ASSESSMENTS_BY_ID[dependency["currentReachabilityAssessmentRef"]]
    snapshot = SNAPSHOTS_BY_ID[dependency["currentContactRouteSnapshotRef"]]
    DEPENDENCY_MATRIX_ROWS.append(
        {
            "dependency_id": dependency["dependencyId"],
            "domain": dependency["domain"],
            "purpose": dependency["purpose"],
            "route_kind": snapshot["routeKind"],
            "assessment_state": assessment["assessmentState"],
            "repair_state": dependency["repairState"],
            "route_health_state": dependency["routeHealthState"],
            "current_snapshot_ref": dependency["currentContactRouteSnapshotRef"],
            "current_assessment_ref": dependency["currentReachabilityAssessmentRef"],
            "blocked_action_scopes": "|".join(dependency["blockedActionScopeRefs"]),
            "deadline_at": dependency["deadlineAt"],
            "failure_effect": dependency["failureEffect"],
            "dominant_reason_code": assessment["dominantReasonCode"],
            "same_shell_refs": "|".join(
                ref
                for ref in [
                    dependency["selectedAnchorRef"],
                    dependency["requestReturnBundleRef"] or "",
                    dependency["resumeContinuationRef"] or "",
                ]
                if ref
            ),
        }
    )


def render_design_doc() -> str:
    return dedent(
        f"""
        # 69 Contact Route And Reachability Design

        `par_069` installs one canonical contact-route and reachability authority layer for callback, messaging, booking, hub, and pharmacy flows.

        ## Core law

        - `ContactRouteSnapshot` is the frozen route version. No mutable profile row or last-known demographic copy may replace it.
        - `ReachabilityObservation` records signal only. Transport acceptance, queue success, or provider ack remain weak evidence until a later assessment says otherwise.
        - `ReachabilityAssessmentRecord` is the sole object allowed to convert snapshot plus observations into current route authority, delivery risk, and repair posture.
        - `ReachabilityDependency` upgrades contact drift into a patient or operator blocker with action-scope impact, deadline, and same-shell return context.
        - `ContactRouteRepairJourney` keeps repair inside the same shell and preserves anchor plus return context.
        - `ContactRouteVerificationCheckpoint` is the only gate allowed to reopen blocked actions after a new route snapshot is captured and a clear resulting assessment lands.

        ## Generated baseline

        - snapshots: `{MANIFEST["summary"]["snapshot_count"]}`
        - dependencies: `{MANIFEST["summary"]["dependency_count"]}`
        - assessments: `{MANIFEST["summary"]["assessment_count"]}`
        - observations: `{MANIFEST["summary"]["observation_count"]}`
        - repair journeys: `{MANIFEST["summary"]["repair_journey_count"]}`
        - checkpoints: `{MANIFEST["summary"]["verification_checkpoint_count"]}`

        ## Source trace

        {chr(10).join(f"- `{source}`" for source in SOURCE_PRECEDENCE)}
        """
    ).strip()


def render_rules_doc() -> str:
    return dedent(
        """
        # 69 Reachability Assessment Rules

        ## Fail-closed rules

        - `assessmentState = clear` is valid only when route authority is `current`, deliverability is `confirmed_reachable`, delivery risk is `on_track`, and `falseNegativeGuardState = pass`.
        - `transport_ack` alone never clears a route. The resulting posture stays `at_risk` with `dominantReasonCode = TRANSPORT_ACK_WITHOUT_PROOF`.
        - stale verification, stale demographics, stale preferences, disputed route input, or superseded snapshots fail closed to blocked or disputed posture.
        - a blocked dependency must surface same-shell repair or explicit recovery routing. Detached settings success is invalid.
        - successful repair may reopen actionability only after a fresh verified snapshot, a settled verification checkpoint, and a resulting clear assessment all point to the same rebound epoch.

        ## Reason-code ordering

        1. `SNAPSHOT_SUPERSEDED`
        2. `MANUAL_DISPUTE_OPEN`
        3. `PREFERENCE_OPT_OUT_ACTIVE`
        4. `INVALID_ROUTE_CONFIRMED`
        5. `VERIFICATION_FAILURE_RECORDED`
        6. `TRANSPORT_ACK_WITHOUT_PROOF`
        7. `VERIFICATION_SUCCESS_REBOUND_READY`
        8. `REACHABLE_SIGNAL_CONFIRMED`

        ## Simulator contract

        - SMS accepted maps to weak `transport_ack`
        - SMS delivered maps to moderate positive `delivery_receipt`
        - SMS bounced maps to strong negative `bounce`
        - SMS expired maps to negative `delivery_receipt`
        - SMS opt-out maps to strong negative `opt_out`
        - Voice no-answer maps to moderate negative `no_answer`
        - Voice invalid-route maps to strong negative `invalid_route`
        - Voice manual confirmation maps to strong `manual_confirmed_reachable | manual_confirmed_unreachable`
        - Email disputed maps to strong ambiguous `manual_dispute`
        - OTP success or failure maps to strong `verification_success | verification_failure`
        """
    ).strip()


def render_studio() -> str:
    return dedent(
        """
        <!doctype html>
        <html lang="en">
          <head>
            <meta charset="utf-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1" />
            <title>Reachability Truth Studio</title>
            <style>
              :root {
                color-scheme: light;
                --canvas: #f7f9fc;
                --panel: #ffffff;
                --rail: #eef3f8;
                --inset: #f4f7fb;
                --text-strong: #0f172a;
                --text-default: #1e293b;
                --text-muted: #667085;
                --border-subtle: #e2e8f0;
                --clear: #0f9d58;
                --risk: #c98900;
                --repair: #3559e6;
                --disputed: #7c3aed;
                --blocked: #c24141;
                --shadow: 0 20px 40px rgba(15, 23, 42, 0.06);
                --radius: 20px;
              }
              * { box-sizing: border-box; }
              body {
                margin: 0;
                font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
                background: linear-gradient(180deg, #ffffff 0%, var(--canvas) 42%, #edf3f8 100%);
                color: var(--text-default);
              }
              body[data-reduced-motion="true"] * {
                animation: none !important;
                transition: none !important;
                scroll-behavior: auto !important;
              }
              .shell {
                max-width: 1500px;
                margin: 0 auto;
                padding: 24px;
              }
              header {
                min-height: 72px;
                background: rgba(255, 255, 255, 0.92);
                border: 1px solid var(--border-subtle);
                border-radius: 28px;
                box-shadow: var(--shadow);
                padding: 18px 24px;
                display: flex;
                justify-content: space-between;
                align-items: center;
                gap: 16px;
              }
              .brand {
                display: flex;
                gap: 14px;
                align-items: center;
              }
              .brand-mark {
                width: 44px;
                height: 44px;
                border-radius: 14px;
                background: linear-gradient(135deg, #dbeafe, #ffffff);
                border: 1px solid var(--border-subtle);
                display: grid;
                place-items: center;
              }
              .brand-mark svg { width: 28px; height: 28px; }
              .metrics {
                display: grid;
                grid-template-columns: repeat(4, minmax(120px, 1fr));
                gap: 12px;
                flex: 1;
              }
              .metric {
                background: var(--inset);
                border: 1px solid var(--border-subtle);
                border-radius: 18px;
                padding: 10px 14px;
              }
              .metric .value {
                font-size: 1.35rem;
                font-weight: 700;
                color: var(--text-strong);
              }
              main {
                margin-top: 20px;
                display: grid;
                grid-template-columns: 308px minmax(0, 1fr) 404px;
                gap: 20px;
                align-items: start;
              }
              aside, section, .panel {
                background: var(--panel);
                border: 1px solid var(--border-subtle);
                border-radius: var(--radius);
                box-shadow: var(--shadow);
              }
              .rail {
                background: var(--rail);
                padding: 18px;
                display: grid;
                gap: 14px;
              }
              .rail label {
                display: grid;
                gap: 8px;
                font-size: 0.92rem;
                color: var(--text-muted);
              }
              select {
                min-height: 44px;
                border-radius: 14px;
                border: 1px solid var(--border-subtle);
                padding: 0 14px;
                background: #fff;
                color: var(--text-default);
              }
              .center {
                display: grid;
                gap: 20px;
              }
              .canvas-panel {
                padding: 20px;
              }
              .canvas-panel h2,
              .panel h2,
              aside h2 {
                margin: 0 0 10px;
                font-size: 1rem;
                color: var(--text-strong);
              }
              .constellation {
                min-height: 260px;
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
                gap: 14px;
              }
              .dependency-card,
              .snapshot-card,
              .assessment-card {
                border: 1px solid var(--border-subtle);
                border-radius: 18px;
                background: linear-gradient(180deg, #ffffff 0%, #f9fbfd 100%);
                padding: 14px;
                text-align: left;
                transition: transform 180ms ease, border-color 180ms ease, box-shadow 180ms ease;
              }
              .dependency-card:hover,
              .dependency-card:focus-visible,
              .snapshot-card:hover,
              .snapshot-card:focus-visible {
                transform: translateY(-2px);
                border-color: #cbd5e1;
                box-shadow: 0 12px 24px rgba(15, 23, 42, 0.08);
              }
              .dependency-card[data-selected="true"],
              .snapshot-card[data-selected="true"] {
                border-color: var(--repair);
                box-shadow: 0 0 0 3px rgba(53, 89, 230, 0.12);
              }
              .state-pill {
                display: inline-flex;
                align-items: center;
                gap: 8px;
                padding: 4px 10px;
                border-radius: 999px;
                font-size: 0.78rem;
                font-weight: 600;
                background: var(--inset);
                color: var(--text-muted);
              }
              .state-pill.clear { color: var(--clear); }
              .state-pill.at_risk { color: var(--risk); }
              .state-pill.blocked { color: var(--blocked); }
              .state-pill.disputed { color: var(--disputed); }
              .split {
                display: grid;
                grid-template-columns: minmax(0, 1fr) minmax(280px, 340px);
                gap: 20px;
              }
              .stack,
              .cards {
                display: grid;
                gap: 12px;
              }
              .stack .snapshot-card {
                min-height: 170px;
              }
              .inspector {
                padding: 20px;
                transition: transform 220ms ease, opacity 220ms ease;
              }
              .inspector dl {
                margin: 0;
                display: grid;
                gap: 10px;
              }
              .inspector dt {
                font-size: 0.78rem;
                color: var(--text-muted);
                text-transform: uppercase;
                letter-spacing: 0.04em;
              }
              .inspector dd {
                margin: 0;
                color: var(--text-default);
              }
              .mono {
                font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
              }
              .lower {
                display: grid;
                grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
                gap: 20px;
              }
              .ribbon {
                display: grid;
                gap: 10px;
                padding: 18px 20px;
                background: linear-gradient(90deg, rgba(53, 89, 230, 0.08), rgba(255, 255, 255, 0.96));
              }
              .ribbon strong {
                color: var(--text-strong);
              }
              table {
                width: 100%;
                border-collapse: collapse;
                font-size: 0.9rem;
              }
              th, td {
                padding: 10px 12px;
                border-bottom: 1px solid var(--border-subtle);
                text-align: left;
              }
              tbody tr[data-selected="true"] {
                background: rgba(53, 89, 230, 0.08);
              }
              .parity {
                margin: 8px 0 0;
                color: var(--text-muted);
                font-size: 0.84rem;
              }
              .matrix-table-wrap {
                margin-top: 16px;
                border-radius: 18px;
                overflow: hidden;
                border: 1px solid var(--border-subtle);
              }
              @media (max-width: 1180px) {
                main {
                  grid-template-columns: 1fr;
                }
                .split,
                .lower {
                  grid-template-columns: 1fr;
                }
                .metrics {
                  grid-template-columns: repeat(2, minmax(120px, 1fr));
                }
              }
            </style>
          </head>
          <body>
            <div class="shell">
              <header>
                <div class="brand">
                  <div class="brand-mark" aria-hidden="true">
                    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect x="6" y="8" width="36" height="32" rx="10" fill="#3559E6" opacity="0.12"/>
                      <path d="M15 33V15H24.5C28.2 15 30.5 17.1 30.5 20.3C30.5 22.7 29.2 24.2 27.1 24.8L31.8 33H27.5L23.4 25.5H18.7V33H15ZM18.7 22.5H24.2C25.9 22.5 27 21.6 27 20.2C27 18.7 25.9 17.9 24.2 17.9H18.7V22.5Z" fill="#3559E6"/>
                    </svg>
                  </div>
                  <div>
                    <div style="font-size:1.05rem;font-weight:700;color:#0f172a;">Vecells Reachability Truth Studio</div>
                    <div style="font-size:0.9rem;color:#667085;">Authoritative promise-protection board for route trust, delivery risk, and same-shell repair.</div>
                  </div>
                </div>
                <div class="metrics">
                  <div class="metric"><div>Active dependencies</div><div class="value" data-testid="metric-active-dependencies">0</div></div>
                  <div class="metric"><div>Blocked promises</div><div class="value" data-testid="metric-blocked-promises">0</div></div>
                  <div class="metric"><div>Repair journeys</div><div class="value" data-testid="metric-repair-journeys">0</div></div>
                  <div class="metric"><div>Clear routes</div><div class="value" data-testid="metric-clear-routes">0</div></div>
                </div>
              </header>
              <main>
                <aside class="rail" aria-label="Filters">
                  <h2>Filters</h2>
                  <label>Domain
                    <select id="domain-filter" data-testid="domain-filter">
                      <option value="all">All domains</option>
                    </select>
                  </label>
                  <label>Route kind
                    <select id="route-kind-filter" data-testid="route-kind-filter">
                      <option value="all">All route kinds</option>
                    </select>
                  </label>
                  <label>Assessment state
                    <select id="assessment-state-filter" data-testid="assessment-state-filter">
                      <option value="all">All assessment states</option>
                      <option value="clear">clear</option>
                      <option value="at_risk">at_risk</option>
                      <option value="blocked">blocked</option>
                      <option value="disputed">disputed</option>
                    </select>
                  </label>
                  <label>Repair state
                    <select id="repair-state-filter" data-testid="repair-state-filter">
                      <option value="all">All repair states</option>
                      <option value="none">none</option>
                      <option value="repair_required">repair_required</option>
                      <option value="awaiting_verification">awaiting_verification</option>
                    </select>
                  </label>
                </aside>
                <section class="center">
                  <section class="canvas-panel">
                    <h2>Dependency constellation</h2>
                    <div class="constellation" data-testid="constellation"></div>
                    <p class="parity" data-testid="constellation-parity"></p>
                    <div class="matrix-table-wrap">
                      <table data-testid="dependency-matrix-table">
                        <thead>
                          <tr><th>Dependency</th><th>Domain</th><th>Assessment</th><th>Repair</th></tr>
                        </thead>
                        <tbody data-testid="dependency-matrix-body"></tbody>
                      </table>
                    </div>
                  </section>
                  <section class="canvas-panel split">
                    <div>
                      <h2>Route snapshot stack</h2>
                      <div class="stack" data-testid="snapshot-stack"></div>
                      <p class="parity" data-testid="snapshot-parity"></p>
                    </div>
                    <div>
                      <h2>Assessment cards</h2>
                      <div class="cards" data-testid="assessment-cards"></div>
                    </div>
                  </section>
                  <section class="panel ribbon" data-testid="repair-ribbon" aria-live="polite"></section>
                  <section class="lower">
                    <section class="canvas-panel">
                      <h2>Observation log</h2>
                      <table data-testid="observation-table">
                        <thead>
                          <tr><th>Observation</th><th>Source</th><th>Polarity</th><th>Observed</th></tr>
                        </thead>
                        <tbody data-testid="observation-body"></tbody>
                      </table>
                    </section>
                    <section class="canvas-panel">
                      <h2>Verification checkpoints</h2>
                      <table data-testid="checkpoint-table">
                        <thead>
                          <tr><th>Checkpoint</th><th>Method</th><th>State</th><th>Rebind</th></tr>
                        </thead>
                        <tbody data-testid="checkpoint-body"></tbody>
                      </table>
                    </section>
                  </section>
                </section>
                <aside class="inspector" data-testid="inspector" aria-live="polite"></aside>
              </main>
            </div>
            <script>
              const state = {
                manifest: null,
                casebook: null,
                matrix: [],
                filters: { domain: "all", routeKind: "all", assessment: "all", repair: "all" },
                selectedDependencyId: null,
              };

              const el = {
                domainFilter: document.querySelector("[data-testid='domain-filter']"),
                routeKindFilter: document.querySelector("[data-testid='route-kind-filter']"),
                assessmentFilter: document.querySelector("[data-testid='assessment-state-filter']"),
                repairFilter: document.querySelector("[data-testid='repair-state-filter']"),
                constellation: document.querySelector("[data-testid='constellation']"),
                constellationParity: document.querySelector("[data-testid='constellation-parity']"),
                snapshotStack: document.querySelector("[data-testid='snapshot-stack']"),
                snapshotParity: document.querySelector("[data-testid='snapshot-parity']"),
                inspector: document.querySelector("[data-testid='inspector']"),
                observationBody: document.querySelector("[data-testid='observation-body']"),
                checkpointBody: document.querySelector("[data-testid='checkpoint-body']"),
                assessmentCards: document.querySelector("[data-testid='assessment-cards']"),
                matrixBody: document.querySelector("[data-testid='dependency-matrix-body']"),
                repairRibbon: document.querySelector("[data-testid='repair-ribbon']"),
                activeDependencies: document.querySelector("[data-testid='metric-active-dependencies']"),
                blockedPromises: document.querySelector("[data-testid='metric-blocked-promises']"),
                repairJourneys: document.querySelector("[data-testid='metric-repair-journeys']"),
                clearRoutes: document.querySelector("[data-testid='metric-clear-routes']"),
              };

              function csvToRows(text) {
                const lines = text.trim().split(/\\r?\\n/);
                const header = lines.shift().split(",");
                return lines.map((line) => {
                  const values = line.split(",");
                  return Object.fromEntries(header.map((key, index) => [key, values[index] ?? ""]));
                });
              }

              function maps() {
                const snapshotsById = new Map(state.manifest.snapshots.map((snapshot) => [snapshot.contactRouteSnapshotId, snapshot]));
                const assessmentsById = new Map(state.manifest.assessments.map((assessment) => [assessment.reachabilityAssessmentId, assessment]));
                const journeysById = new Map(state.manifest.repair_journeys.map((journey) => [journey.repairJourneyId, journey]));
                const checkpointsById = new Map(state.manifest.verification_checkpoints.map((checkpoint) => [checkpoint.checkpointId, checkpoint]));
                return { snapshotsById, assessmentsById, journeysById, checkpointsById };
              }

              function latestJourneyForDependency(dependencyId) {
                return state.manifest.repair_journeys
                  .filter((journey) => journey.reachabilityDependencyRef === dependencyId)
                  .sort((left, right) => left.issuedAt.localeCompare(right.issuedAt))
                  .at(-1) ?? null;
              }

              function dependencyEnvelope(dependency) {
                const { snapshotsById, assessmentsById, journeysById } = maps();
                return {
                  dependency,
                  snapshot: snapshotsById.get(dependency.currentContactRouteSnapshotRef),
                  assessment: assessmentsById.get(dependency.currentReachabilityAssessmentRef),
                  journey:
                    (dependency.repairJourneyRef
                      ? journeysById.get(dependency.repairJourneyRef)
                      : latestJourneyForDependency(dependency.dependencyId)) ?? null,
                };
              }

              function visibleDependencies() {
                return state.manifest.dependencies.filter((dependency) => {
                  const envelope = dependencyEnvelope(dependency);
                  return (
                    (state.filters.domain === "all" || dependency.domain === state.filters.domain) &&
                    (state.filters.routeKind === "all" || envelope.snapshot.routeKind === state.filters.routeKind) &&
                    (state.filters.assessment === "all" || envelope.assessment.assessmentState === state.filters.assessment) &&
                    (state.filters.repair === "all" || dependency.repairState === state.filters.repair)
                  );
                });
              }

              function ensureSelection() {
                const visible = visibleDependencies();
                if (visible.length === 0) {
                  state.selectedDependencyId = null;
                  return null;
                }
                if (!visible.some((dependency) => dependency.dependencyId === state.selectedDependencyId)) {
                  state.selectedDependencyId = visible[0].dependencyId;
                }
                return visible.find((dependency) => dependency.dependencyId === state.selectedDependencyId);
              }

              function setSelectedDependency(dependencyId) {
                state.selectedDependencyId = dependencyId;
                render();
              }

              function renderFilters() {
                const domains = [...new Set(state.manifest.dependencies.map((dependency) => dependency.domain))].sort();
                const routeKinds = [...new Set(state.manifest.snapshots.map((snapshot) => snapshot.routeKind))].sort();
                for (const [select, values] of [
                  [el.domainFilter, domains],
                  [el.routeKindFilter, routeKinds],
                ]) {
                  const existing = new Set([...select.options].map((option) => option.value));
                  for (const value of values) {
                    if (!existing.has(value)) {
                      const option = document.createElement("option");
                      option.value = value;
                      option.textContent = value;
                      select.append(option);
                    }
                  }
                }
              }

              function renderMetrics() {
                el.activeDependencies.textContent = String(state.manifest.summary.active_dependency_count);
                el.blockedPromises.textContent = String(state.manifest.summary.blocked_promise_count);
                el.repairJourneys.textContent = String(state.manifest.summary.repair_journey_count);
                el.clearRoutes.textContent = String(state.manifest.summary.clear_route_count);
              }

              function renderConstellation(selected) {
                const visible = visibleDependencies();
                el.constellation.innerHTML = "";
                for (const dependency of visible) {
                  const envelope = dependencyEnvelope(dependency);
                  const button = document.createElement("button");
                  button.className = "dependency-card";
                  button.type = "button";
                  button.dataset.testid = `dependency-card-${dependency.dependencyId}`;
                  button.setAttribute("data-testid", `dependency-card-${dependency.dependencyId}`);
                  button.setAttribute("data-selected", String(dependency.dependencyId === selected?.dependencyId));
                  button.innerHTML = `
                    <div style="display:flex;justify-content:space-between;gap:12px;align-items:start;">
                      <strong class="mono">${dependency.dependencyId}</strong>
                      <span class="state-pill ${envelope.assessment.assessmentState}">${envelope.assessment.assessmentState}</span>
                    </div>
                    <div style="margin-top:10px;font-size:0.9rem;color:#1e293b;">${dependency.domain} · ${dependency.purpose}</div>
                    <div style="margin-top:6px;font-size:0.84rem;color:#667085;">${envelope.snapshot.routeKind} · ${dependency.repairState}</div>
                    <div style="margin-top:12px;font-size:0.84rem;color:#0f172a;">${envelope.assessment.dominantReasonCode}</div>
                  `;
                  button.addEventListener("click", () => setSelectedDependency(dependency.dependencyId));
                  button.addEventListener("keydown", (event) => handleArrowNavigation(event, visible.map((entry) => entry.dependencyId)));
                  el.constellation.append(button);
                }
                el.constellationParity.textContent = `${visible.length} visible dependencies mirrored in the dependency matrix below.`;
              }

              function renderMatrix(selected) {
                const visibleIds = new Set(visibleDependencies().map((dependency) => dependency.dependencyId));
                el.matrixBody.innerHTML = "";
                for (const row of state.matrix.filter((entry) => visibleIds.has(entry.dependency_id))) {
                  const tr = document.createElement("tr");
                  tr.tabIndex = 0;
                  tr.setAttribute("data-testid", `matrix-row-${row.dependency_id}`);
                  tr.setAttribute("data-selected", String(row.dependency_id === selected?.dependencyId));
                  tr.innerHTML = `
                    <td class="mono">${row.dependency_id}</td>
                    <td>${row.domain}</td>
                    <td>${row.assessment_state}</td>
                    <td>${row.repair_state}</td>
                  `;
                  tr.addEventListener("click", () => setSelectedDependency(row.dependency_id));
                  tr.addEventListener("keydown", (event) =>
                    handleArrowNavigation(event, [...visibleIds], "matrix-row"),
                  );
                  el.matrixBody.append(tr);
                }
              }

              function routeStack(routeRef) {
                return state.manifest.snapshots
                  .filter((snapshot) => snapshot.routeRef === routeRef)
                  .sort((left, right) => left.snapshotVersion - right.snapshotVersion);
              }

              function renderSnapshotStack(selected) {
                if (!selected) {
                  el.snapshotStack.innerHTML = "";
                  el.snapshotParity.textContent = "No visible dependency is selected.";
                  return;
                }
                const stack = routeStack(selected.requiredRouteRef);
                el.snapshotStack.innerHTML = "";
                for (const snapshot of stack) {
                  const button = document.createElement("button");
                  button.className = "snapshot-card";
                  button.type = "button";
                  button.setAttribute("data-testid", `snapshot-row-${snapshot.contactRouteSnapshotId}`);
                  button.setAttribute("data-selected", String(snapshot.contactRouteSnapshotId === selected.currentContactRouteSnapshotRef));
                  button.innerHTML = `
                    <div style="display:flex;justify-content:space-between;gap:12px;align-items:start;">
                      <strong class="mono">${snapshot.contactRouteSnapshotId}</strong>
                      <span class="state-pill ${snapshot.verificationState === "verified_current" ? "clear" : snapshot.verificationState === "unverified" ? "at_risk" : "blocked"}">${snapshot.verificationState}</span>
                    </div>
                    <div style="margin-top:8px;font-size:0.84rem;color:#667085;">version ${snapshot.snapshotVersion} · ${snapshot.routeVersionRef}</div>
                    <div style="margin-top:10px;font-size:0.88rem;color:#1e293b;">${snapshot.summary}</div>
                  `;
                  el.snapshotStack.append(button);
                }
                el.snapshotParity.textContent = `${stack.length} frozen route snapshots exist for ${selected.requiredRouteRef}.`;
              }

              function renderAssessmentCards() {
                const visible = visibleDependencies();
                el.assessmentCards.innerHTML = "";
                for (const dependency of visible) {
                  const assessment = dependencyEnvelope(dependency).assessment;
                  const card = document.createElement("article");
                  card.className = "assessment-card";
                  card.innerHTML = `
                    <div style="display:flex;justify-content:space-between;gap:12px;">
                      <strong class="mono">${assessment.reachabilityAssessmentId}</strong>
                      <span class="state-pill ${assessment.assessmentState}">${assessment.assessmentState}</span>
                    </div>
                    <div style="margin-top:10px;color:#667085;font-size:0.84rem;">${assessment.routeAuthorityState} · ${assessment.deliverabilityState}</div>
                    <div style="margin-top:8px;font-size:0.9rem;">${assessment.dominantReasonCode}</div>
                  `;
                  el.assessmentCards.append(card);
                }
              }

              function renderRepairRibbon(selected) {
                if (!selected) {
                  el.repairRibbon.innerHTML = "<h2>Repair spotlight</h2><div>No visible dependency is selected.</div>";
                  return;
                }
                const { journey, assessment } = dependencyEnvelope(selected);
                if (!journey) {
                  el.repairRibbon.innerHTML = `
                    <h2>Repair spotlight</h2>
                    <strong>${selected.dependencyId} is not inside an active repair journey.</strong>
                    <div>Current posture is ${assessment.assessmentState} with ${assessment.dominantReasonCode}.</div>
                  `;
                  return;
                }
                const checkpoint = state.manifest.verification_checkpoints.find(
                  (entry) => entry.repairJourneyRef === journey.repairJourneyId,
                );
                el.repairRibbon.innerHTML = `
                  <h2>Repair spotlight</h2>
                  <strong class="mono">${journey.repairJourneyId}</strong>
                  <div>
                    Journey state is <span class="state-pill ${assessment.assessmentState}">${journey.journeyState}</span>
                    and current reason is <span class="mono">${assessment.dominantReasonCode}</span>.
                  </div>
                  <div class="mono">
                    anchor=${journey.selectedAnchorRef} · return=${journey.requestReturnBundleRef || "none"} ·
                    resume=${journey.resumeContinuationRef || "none"} · checkpoint=${checkpoint ? checkpoint.checkpointId : "none"}
                  </div>
                `;
              }

              function renderInspector(selected) {
                if (!selected) {
                  el.inspector.innerHTML = "<h2>No visible dependency</h2>";
                  return;
                }
                const { snapshot, assessment, journey } = dependencyEnvelope(selected);
                const checkpoints = state.manifest.verification_checkpoints.filter(
                  (checkpoint) => checkpoint.repairJourneyRef === journey?.repairJourneyId,
                );
                const sourceRefs = selected.sourceRefs.map((ref) => `<li class="mono">${ref}</li>`).join("");
                el.inspector.innerHTML = `
                  <h2>Selected dependency</h2>
                  <dl>
                    <div><dt>Dependency</dt><dd class="mono">${selected.dependencyId}</dd></div>
                    <div><dt>Purpose</dt><dd>${selected.domain} · ${selected.purpose}</dd></div>
                    <div><dt>Current snapshot</dt><dd class="mono">${snapshot.contactRouteSnapshotId}</dd></div>
                    <div><dt>Current assessment</dt><dd class="mono">${assessment.reachabilityAssessmentId}</dd></div>
                    <div><dt>Reason</dt><dd>${assessment.dominantReasonCode}</dd></div>
                    <div><dt>Blocked scopes</dt><dd class="mono">${selected.blockedActionScopeRefs.join(", ")}</dd></div>
                    <div><dt>Repair journey</dt><dd class="mono">${journey ? journey.repairJourneyId : "none"}</dd></div>
                    <div><dt>Checkpoint</dt><dd class="mono">${checkpoints[0] ? checkpoints[0].checkpointId : "none"}</dd></div>
                    <div><dt>Return bundle</dt><dd class="mono">${selected.requestReturnBundleRef || "none"}</dd></div>
                    <div><dt>Resume continuation</dt><dd class="mono">${selected.resumeContinuationRef || "none"}</dd></div>
                  </dl>
                  <h2 style="margin-top:18px;">Source trace</h2>
                  <ul style="padding-left:18px;margin:8px 0 0;">${sourceRefs}</ul>
                `;
              }

              function renderObservationTable(selected) {
                el.observationBody.innerHTML = "";
                if (!selected) return;
                const observations = state.manifest.observations
                  .filter((observation) => observation.reachabilityDependencyRef === selected.dependencyId)
                  .sort((left, right) => left.observedAt.localeCompare(right.observedAt));
                for (const observation of observations) {
                  const tr = document.createElement("tr");
                  tr.tabIndex = 0;
                  tr.setAttribute("data-testid", `observation-row-${observation.reachabilityObservationId}`);
                  tr.setAttribute("data-selected", "true");
                  tr.innerHTML = `
                    <td>${observation.observationClass}</td>
                    <td>${observation.observationSourceRef}</td>
                    <td>${observation.outcomePolarity} · ${observation.authorityWeight}</td>
                    <td class="mono">${observation.observedAt}</td>
                  `;
                  tr.addEventListener("keydown", (event) => handleArrowNavigation(event, observations.map((entry) => entry.reachabilityObservationId), "observation-row"));
                  el.observationBody.append(tr);
                }
              }

              function renderCheckpointTable(selected) {
                el.checkpointBody.innerHTML = "";
                if (!selected) return;
                const checkpoints = state.manifest.verification_checkpoints.filter((checkpoint) => {
                  const journey = state.manifest.repair_journeys.find((entry) => entry.repairJourneyId === checkpoint.repairJourneyRef);
                  return journey?.reachabilityDependencyRef === selected.dependencyId;
                });
                for (const checkpoint of checkpoints) {
                  const tr = document.createElement("tr");
                  tr.tabIndex = 0;
                  tr.setAttribute("data-testid", `checkpoint-row-${checkpoint.checkpointId}`);
                  tr.setAttribute("data-selected", "true");
                  tr.innerHTML = `
                    <td class="mono">${checkpoint.checkpointId}</td>
                    <td>${checkpoint.verificationMethod}</td>
                    <td>${checkpoint.verificationState}</td>
                    <td>${checkpoint.rebindState}</td>
                  `;
                  tr.addEventListener("keydown", (event) => handleArrowNavigation(event, checkpoints.map((entry) => entry.checkpointId), "checkpoint-row"));
                  el.checkpointBody.append(tr);
                }
              }

              function handleArrowNavigation(event, ids, prefix = "dependency-card") {
                if (!["ArrowDown", "ArrowUp"].includes(event.key) || ids.length === 0) {
                  return;
                }
                event.preventDefault();
                const currentId = event.currentTarget.getAttribute("data-testid").replace(`${prefix}-`, "");
                const currentIndex = ids.indexOf(currentId);
                const delta = event.key === "ArrowDown" ? 1 : -1;
                const nextId = ids[(currentIndex + delta + ids.length) % ids.length];
                if (prefix === "dependency-card" || prefix === "matrix-row") {
                  setSelectedDependency(nextId);
                  requestAnimationFrame(() =>
                    document.querySelector(`[data-testid='${prefix}-${nextId}']`)?.focus(),
                  );
                } else {
                  requestAnimationFrame(() => document.querySelector(`[data-testid='${prefix}-${nextId}']`)?.focus());
                }
              }

              function render() {
                const selected = ensureSelection();
                renderMetrics();
                renderConstellation(selected);
                renderMatrix(selected);
                renderSnapshotStack(selected);
                renderAssessmentCards();
                renderRepairRibbon(selected);
                renderInspector(selected);
                renderObservationTable(selected);
                renderCheckpointTable(selected);
              }

              async function init() {
                document.body.setAttribute(
                  "data-reduced-motion",
                  String(window.matchMedia("(prefers-reduced-motion: reduce)").matches),
                );
                const [manifest, casebook, matrixCsv] = await Promise.all([
                  fetch("../../data/analysis/contact_route_snapshot_manifest.json").then((response) => response.json()),
                  fetch("../../data/analysis/reachability_assessment_casebook.json").then((response) => response.json()),
                  fetch("../../data/analysis/reachability_dependency_matrix.csv").then((response) => response.text()),
                ]);
                state.manifest = manifest;
                state.casebook = casebook;
                state.matrix = csvToRows(matrixCsv);
                renderFilters();
                for (const [key, node] of [
                  ["domain", el.domainFilter],
                  ["routeKind", el.routeKindFilter],
                  ["assessment", el.assessmentFilter],
                  ["repair", el.repairFilter],
                ]) {
                  node.addEventListener("change", (event) => {
                    state.filters[key] = event.target.value;
                    render();
                  });
                }
                render();
              }

              init().catch((error) => {
                console.error(error);
                document.body.innerHTML = `<pre>${error.message}</pre>`;
              });
            </script>
          </body>
        </html>
        """
    ).strip()


def render_spec() -> str:
    return dedent(
        """
        import fs from "node:fs";
        import http from "node:http";
        import path from "node:path";
        import { fileURLToPath } from "node:url";

        const __filename = fileURLToPath(import.meta.url);
        const __dirname = path.dirname(__filename);
        const ROOT = path.resolve(__dirname, "..", "..");
        const HTML_PATH = path.join(ROOT, "docs", "architecture", "69_reachability_truth_studio.html");
        const MANIFEST_PATH = path.join(ROOT, "data", "analysis", "contact_route_snapshot_manifest.json");
        const CASEBOOK_PATH = path.join(ROOT, "data", "analysis", "reachability_assessment_casebook.json");
        const MATRIX_PATH = path.join(ROOT, "data", "analysis", "reachability_dependency_matrix.csv");

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
                rawUrl === "/" ? "/docs/architecture/69_reachability_truth_studio.html" : rawUrl.split("?")[0];
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
            server.listen(4370, "127.0.0.1", () => resolve(server));
          });
        }

        async function run() {
          assertCondition(fs.existsSync(HTML_PATH), `Missing studio HTML: ${HTML_PATH}`);
          const { chromium } = await importPlaywright();
          const server = await startStaticServer();
          const browser = await chromium.launch({ headless: true });
          const page = await browser.newPage({ viewport: { width: 1480, height: 1120 } });
          const url =
            process.env.REACHABILITY_STUDIO_URL ??
            "http://127.0.0.1:4370/docs/architecture/69_reachability_truth_studio.html";

          try {
            await page.goto(url, { waitUntil: "networkidle" });
            await page.locator("[data-testid='constellation']").waitFor();
            await page.locator("[data-testid='snapshot-stack']").waitFor();
            await page.locator("[data-testid='repair-ribbon']").waitFor();
            await page.locator("[data-testid='inspector']").waitFor();
            await page.locator("[data-testid='observation-table']").waitFor();
            await page.locator("[data-testid='checkpoint-table']").waitFor();

            const dependencyCards = await page.locator("button[data-testid^='dependency-card-']").count();
            assertCondition(
              dependencyCards === MANIFEST.summary.dependency_count,
              `Expected ${MANIFEST.summary.dependency_count} visible dependency cards, found ${dependencyCards}.`,
            );

            await page.locator("[data-testid='domain-filter']").selectOption("pharmacy");
            const pharmacyCards = await page.locator("button[data-testid^='dependency-card-']").count();
            assertCondition(pharmacyCards === 2, `Expected 2 pharmacy dependency cards, found ${pharmacyCards}.`);

            await page.locator("[data-testid='domain-filter']").selectOption("all");
            await page.locator("[data-testid='assessment-state-filter']").selectOption("blocked");
            const blockedCards = await page.locator("button[data-testid^='dependency-card-']").count();
            assertCondition(blockedCards === 2, `Expected 2 blocked dependency cards, found ${blockedCards}.`);

            await page.locator("[data-testid='assessment-state-filter']").selectOption("all");
            await page.locator("[data-testid='repair-state-filter']").selectOption("awaiting_verification");
            const verificationCards = await page.locator("button[data-testid^='dependency-card-']").count();
            assertCondition(verificationCards === 1, `Expected 1 awaiting-verification dependency, found ${verificationCards}.`);

            await page.locator("[data-testid='repair-state-filter']").selectOption("all");
            await page.locator("[data-testid='dependency-card-DEP_069_CALLBACK']").click();
            const inspectorText = await page.locator("[data-testid='inspector']").innerText();
            assertCondition(
              inspectorText.includes("DEP_069_CALLBACK") &&
                inspectorText.includes("INVALID_ROUTE_CONFIRMED") &&
                inspectorText.includes("CK_069_CALLBACK_OTP"),
              "Inspector lost dependency selection synchronization.",
            );
            const callbackRibbon = await page.locator("[data-testid='repair-ribbon']").innerText();
            assertCondition(
              callbackRibbon.includes("RJ_069_CALLBACK") &&
                callbackRibbon.includes("awaiting_verification"),
              "Repair spotlight ribbon drifted for callback repair.",
            );

            const observationRows = await page.locator("[data-testid^='observation-row-']").count();
            assertCondition(observationRows === 1, `Expected 1 callback observation row, found ${observationRows}.`);
            const checkpointRows = await page.locator("[data-testid^='checkpoint-row-']").count();
            assertCondition(checkpointRows === 1, `Expected 1 callback checkpoint row, found ${checkpointRows}.`);

            const parityText = await page.locator("[data-testid='constellation-parity']").textContent();
            assertCondition(parityText.includes("6 visible dependencies"), "Constellation parity text drifted.");
            const matrixRows = await page.locator("[data-testid^='matrix-row-']").count();
            assertCondition(matrixRows === MANIFEST.summary.dependency_count, "Dependency matrix parity drifted.");

            await page.locator("[data-testid='dependency-card-DEP_069_CALLBACK']").focus();
            await page.keyboard.press("ArrowDown");
            const nextSelected = await page
              .locator("[data-testid='dependency-card-DEP_069_MESSAGE']")
              .getAttribute("data-selected");
            assertCondition(nextSelected === "true", "ArrowDown did not advance dependency selection.");

            await page.locator("[data-testid='dependency-card-DEP_069_URGENT']").click();
            const snapshotRows = await page.locator("[data-testid^='snapshot-row-']").count();
            assertCondition(snapshotRows === 3, `Expected 3 urgent snapshot rows, found ${snapshotRows}.`);
            const snapshotParity = await page.locator("[data-testid='snapshot-parity']").textContent();
            assertCondition(snapshotParity.includes("3 frozen route snapshots"), "Snapshot parity drifted.");
            const urgentRibbon = await page.locator("[data-testid='repair-ribbon']").innerText();
            assertCondition(
              urgentRibbon.includes("RJ_069_URGENT") && urgentRibbon.includes("completed"),
              "Repair spotlight ribbon failed to update for the urgent rebound case.",
            );

            await page.locator("[data-testid='matrix-row-DEP_069_CALLBACK']").focus();
            await page.keyboard.press("ArrowDown");
            const matrixSelected = await page
              .locator("[data-testid='matrix-row-DEP_069_MESSAGE']")
              .getAttribute("data-selected");
            assertCondition(matrixSelected === "true", "Matrix keyboard navigation did not advance selection.");

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
            assertCondition(CASEBOOK.summary.case_count === 4, "Casebook summary drifted.");
            assertCondition(MATRIX.length === MANIFEST.summary.dependency_count, "Dependency matrix row count drifted.");
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

        export const reachabilityTruthStudioManifest = {
          task: MANIFEST.task_id,
          dependencies: MANIFEST.summary.dependency_count,
          checkpoints: MANIFEST.summary.verification_checkpoint_count,
          coverage: [
            "domain filtering",
            "state filtering",
            "selection synchronization",
            "repair spotlight ribbon",
            "diagram and table parity",
            "keyboard navigation",
            "reduced motion",
          ],
        };
        """
    ).strip()


def write_dependency_matrix() -> None:
    ensure_parent(DEPENDENCY_MATRIX_PATH)
    with DEPENDENCY_MATRIX_PATH.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=list(DEPENDENCY_MATRIX_ROWS[0].keys()))
        writer.writeheader()
        writer.writerows(DEPENDENCY_MATRIX_ROWS)


def main() -> None:
    write_json(MANIFEST_PATH, MANIFEST)
    write_dependency_matrix()
    write_json(CASEBOOK_PATH, CASEBOOK)
    write_text(DESIGN_DOC_PATH, render_design_doc())
    write_text(RULES_DOC_PATH, render_rules_doc())
    write_text(STUDIO_PATH, render_studio())
    write_text(SPEC_PATH, render_spec())
    print(
        "par_069 reachability artifacts generated: "
        f'{MANIFEST["summary"]["snapshot_count"]} snapshots, '
        f'{MANIFEST["summary"]["dependency_count"]} dependencies, '
        f'{MANIFEST["summary"]["assessment_count"]} assessments, '
        f'{MANIFEST["summary"]["observation_count"]} observations.'
    )


if __name__ == "__main__":
    main()
