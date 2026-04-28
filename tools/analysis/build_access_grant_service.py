#!/usr/bin/env python3
from __future__ import annotations

import csv
import hashlib
import json
from pathlib import Path
from textwrap import dedent

from root_script_updates import ROOT_SCRIPT_UPDATES


ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = ROOT / "data" / "analysis"
DOCS_DIR = ROOT / "docs" / "architecture"
TESTS_DIR = ROOT / "tests" / "playwright"

ROOT_PACKAGE_PATH = ROOT / "package.json"
PLAYWRIGHT_PACKAGE_PATH = TESTS_DIR / "package.json"

MATRIX_PATH = DATA_DIR / "access_grant_family_matrix.csv"
CASEBOOK_PATH = DATA_DIR / "access_grant_casebook.json"
MANIFEST_PATH = DATA_DIR / "access_grant_runtime_tuple_manifest.json"
DESIGN_DOC_PATH = DOCS_DIR / "78_access_grant_service_design.md"
RULES_DOC_PATH = DOCS_DIR / "78_access_grant_family_and_redemption_rules.md"
LAB_PATH = DOCS_DIR / "78_access_grant_journey_lab.html"
SPEC_PATH = TESTS_DIR / "access-grant-journey-lab.spec.js"

TASK_ID = "par_078"
VISUAL_MODE = "Access_Grant_Journey_Lab"
CAPTURED_ON = "2026-04-12"
GENERATED_AT = "2026-04-12T00:00:00+00:00"

SOURCE_PRECEDENCE = [
    "prompt/078.md",
    "prompt/shared_operating_contract_076_to_085.md",
    "prompt/AGENT.md",
    "prompt/checklist.md",
    "blueprint/phase-0-the-foundation-protocol.md#1.4C Session",
    "blueprint/phase-0-the-foundation-protocol.md#1.4D AuthTransaction",
    "blueprint/phase-0-the-foundation-protocol.md#1.4E AuthScopeBundle",
    "blueprint/phase-0-the-foundation-protocol.md#1.4F PostAuthReturnIntent",
    "blueprint/phase-0-the-foundation-protocol.md#1.6 AccessGrant",
    "blueprint/phase-0-the-foundation-protocol.md#1.6A AccessGrantScopeEnvelope",
    "blueprint/phase-0-the-foundation-protocol.md#1.6B AccessGrantRedemptionRecord",
    "blueprint/phase-0-the-foundation-protocol.md#1.6C AccessGrantSupersessionRecord",
    "blueprint/phase-0-the-foundation-protocol.md#2.3 AccessGrantService",
    "blueprint/phase-0-the-foundation-protocol.md#2.3A AuthBridge",
    "blueprint/phase-0-the-foundation-protocol.md#2.3B SessionGovernor",
    "blueprint/phase-0-the-foundation-protocol.md#6. Unified AccessGrant and secure-link rules",
    "blueprint/phase-1-the-red-flag-gate.md",
    "blueprint/phase-2-identity-and-echoes.md",
    "blueprint/patient-account-and-communications-blueprint.md",
    "blueprint/callback-and-clinician-messaging-loop.md",
    "blueprint/forensic-audit-findings.md#Finding 06",
    "blueprint/forensic-audit-findings.md#Finding 07",
    "blueprint/forensic-audit-findings.md#Finding 50",
    "blueprint/forensic-audit-findings.md#Finding 89",
    "blueprint/forensic-audit-findings.md#Finding 97",
    "blueprint/forensic-audit-findings.md#Finding 98",
    "blueprint/forensic-audit-findings.md#Finding 99",
    "blueprint/forensic-audit-findings.md#Finding 100",
    "blueprint/forensic-audit-findings.md#Finding 101",
    "packages/domains/identity_access/src/identity-access-backbone.ts",
    "services/command-api/src/access-grant.ts",
]

FAMILY_REGISTRY = [
    {
        "grantFamily": "draft_resume_minimal",
        "validatorFamily": "draft_resume_minimal_validator",
        "replayPolicy": "one_time",
        "defaultMaxRedemptions": 1,
        "maxPhiExposureClass": "minimal",
        "routeCeiling": "rf_intake_self_service | rf_patient_secure_link_recovery",
        "sessionCeiling": "fresh_or_rotated",
        "subjectBindingRule": "none",
        "notes": "Envelope-bound minimal resume grants settle before any session upgrade proceeds.",
    },
    {
        "grantFamily": "public_status_minimal",
        "validatorFamily": "public_status_minimal_validator",
        "replayPolicy": "multi_use_minimal",
        "defaultMaxRedemptions": 3,
        "maxPhiExposureClass": "minimal",
        "routeCeiling": "status-only public or semi-public posture",
        "sessionCeiling": "no_upgrade",
        "subjectBindingRule": "none",
        "notes": "Minimal status visibility may replay deterministically without widening capability or identity scope.",
    },
    {
        "grantFamily": "claim_step_up",
        "validatorFamily": "claim_step_up_validator",
        "replayPolicy": "one_time",
        "defaultMaxRedemptions": 1,
        "maxPhiExposureClass": "none",
        "routeCeiling": "rf_patient_secure_link_recovery",
        "sessionCeiling": "fresh_or_rotated",
        "subjectBindingRule": "soft_subject",
        "notes": "Claim step-up opens governed auth or proof collection but still withholds PHI and write scope.",
    },
    {
        "grantFamily": "continuation_seeded_verified",
        "validatorFamily": "continuation_seeded_verified_validator",
        "replayPolicy": "one_time",
        "defaultMaxRedemptions": 1,
        "maxPhiExposureClass": "scoped",
        "routeCeiling": "rf_patient_secure_link_recovery",
        "sessionCeiling": "fresh_or_rotated",
        "subjectBindingRule": "hard_subject",
        "notes": "Seeded verified continuation binds one current lineage, one route tuple, and one governed session posture.",
    },
    {
        "grantFamily": "continuation_challenge",
        "validatorFamily": "continuation_challenge_validator",
        "replayPolicy": "one_time",
        "defaultMaxRedemptions": 1,
        "maxPhiExposureClass": "none",
        "routeCeiling": "rf_patient_secure_link_recovery",
        "sessionCeiling": "fresh_or_rotated",
        "subjectBindingRule": "soft_subject",
        "notes": "Challenge flows may route into contact repair or proof continuation without exposing scoped request truth.",
    },
    {
        "grantFamily": "transaction_action_minimal",
        "validatorFamily": "transaction_action_minimal_validator",
        "replayPolicy": "one_time",
        "defaultMaxRedemptions": 1,
        "maxPhiExposureClass": "minimal",
        "routeCeiling": "one transaction route family at a time",
        "sessionCeiling": "bound_session",
        "subjectBindingRule": "hard_subject",
        "notes": "Callback, message, booking, waitlist, alternative-choice, and pharmacy actions all resolve through one exact-once transaction family.",
    },
    {
        "grantFamily": "support_recovery_minimal",
        "validatorFamily": "support_recovery_minimal_validator",
        "replayPolicy": "rotating",
        "defaultMaxRedemptions": 1,
        "maxPhiExposureClass": "minimal",
        "routeCeiling": "current recovery route or explicitly reissued transaction route",
        "sessionCeiling": "fresh_or_rotated",
        "subjectBindingRule": "hard_subject",
        "notes": "Support reissue may recreate only the immediately prior safe minimal scope and must supersede older links.",
    },
]

FAMILY_LOOKUP = {item["grantFamily"]: item for item in FAMILY_REGISTRY}

USE_CASE_ROWS = [
    {
        "useCase": "draft_resume",
        "grantFamily": "draft_resume_minimal",
        "defaultActionScope": "envelope_resume",
        "routeFamilyRef": "rf_intake_self_service",
        "lineageScope": "envelope",
        "subjectBindingMode": "none",
        "sessionRequirement": "fresh_or_rotated",
        "issuanceOutcome": "issued",
        "defaultExpiryMinutes": 45,
        "transportClass": "opaque_signed_link",
        "supersessionTriggers": [
            "draft_promoted",
            "logout",
            "manual_revoke",
            "route_drift",
        ],
        "rationale": "Draft resume remains minimal and envelope-bound until promotion or stronger proof settles.",
    },
    {
        "useCase": "request_claim",
        "grantFamily": "claim_step_up",
        "defaultActionScope": "claim",
        "routeFamilyRef": "rf_patient_secure_link_recovery",
        "lineageScope": "request",
        "subjectBindingMode": "soft_subject",
        "sessionRequirement": "fresh_or_rotated",
        "issuanceOutcome": "issued",
        "defaultExpiryMinutes": 20,
        "transportClass": "opaque_signed_link",
        "supersessionTriggers": [
            "claim_completed",
            "logout",
            "identity_repair",
            "route_drift",
        ],
        "rationale": "Claim grants guide auth uplift or proof capture but do not themselves confer patient capability.",
    },
    {
        "useCase": "secure_continuation",
        "grantFamily": "continuation_seeded_verified",
        "defaultActionScope": "secure_resume",
        "routeFamilyRef": "rf_patient_secure_link_recovery",
        "lineageScope": "request",
        "subjectBindingMode": "hard_subject",
        "sessionRequirement": "fresh_or_rotated",
        "issuanceOutcome": "issued",
        "defaultExpiryMinutes": 30,
        "transportClass": "opaque_signed_link",
        "supersessionTriggers": [
            "rotation",
            "logout",
            "identity_repair",
            "route_drift",
        ],
        "rationale": "Verified continuation binds one current lineage, route intent, and subject proof snapshot.",
    },
    {
        "useCase": "callback_reply",
        "grantFamily": "transaction_action_minimal",
        "defaultActionScope": "callback_response",
        "routeFamilyRef": "rf_patient_messages",
        "lineageScope": "request",
        "subjectBindingMode": "hard_subject",
        "sessionRequirement": "bound_session",
        "issuanceOutcome": "issued",
        "defaultExpiryMinutes": 30,
        "transportClass": "opaque_signed_link",
        "supersessionTriggers": [
            "rotation",
            "identity_repair",
            "route_drift",
            "logout",
        ],
        "rationale": "Callback reply stays single-purpose and cannot silently authorize adjacent communication actions.",
    },
    {
        "useCase": "message_reply",
        "grantFamily": "transaction_action_minimal",
        "defaultActionScope": "message_reply",
        "routeFamilyRef": "rf_patient_messages",
        "lineageScope": "request",
        "subjectBindingMode": "hard_subject",
        "sessionRequirement": "bound_session",
        "issuanceOutcome": "issued",
        "defaultExpiryMinutes": 30,
        "transportClass": "opaque_signed_link",
        "supersessionTriggers": [
            "rotation",
            "identity_repair",
            "route_drift",
            "logout",
        ],
        "rationale": "Message reply stays on the current thread tuple and reuses the canonical communication family.",
    },
    {
        "useCase": "booking_manage",
        "grantFamily": "transaction_action_minimal",
        "defaultActionScope": "appointment_manage_entry",
        "routeFamilyRef": "rf_patient_appointments",
        "lineageScope": "request",
        "subjectBindingMode": "hard_subject",
        "sessionRequirement": "bound_session",
        "issuanceOutcome": "issued",
        "defaultExpiryMinutes": 30,
        "transportClass": "opaque_signed_link",
        "supersessionTriggers": [
            "rotation",
            "identity_repair",
            "route_drift",
            "logout",
        ],
        "rationale": "Booking-manage grants stay bound to the current booking tuple and one writable patient shell.",
    },
    {
        "useCase": "waitlist_action",
        "grantFamily": "transaction_action_minimal",
        "defaultActionScope": "waitlist_offer",
        "routeFamilyRef": "rf_patient_appointments",
        "lineageScope": "request",
        "subjectBindingMode": "hard_subject",
        "sessionRequirement": "bound_session",
        "issuanceOutcome": "issued",
        "defaultExpiryMinutes": 20,
        "transportClass": "opaque_signed_link",
        "supersessionTriggers": [
            "rotation",
            "route_drift",
            "logout",
            "manual_revoke",
        ],
        "rationale": "Waitlist actions are tightly time-bound and must replay as settlement, not as a second side effect.",
    },
    {
        "useCase": "network_alternative_choice",
        "grantFamily": "transaction_action_minimal",
        "defaultActionScope": "alternative_offer",
        "routeFamilyRef": "rf_patient_appointments",
        "lineageScope": "request",
        "subjectBindingMode": "hard_subject",
        "sessionRequirement": "bound_session",
        "issuanceOutcome": "issued",
        "defaultExpiryMinutes": 20,
        "transportClass": "opaque_signed_link",
        "supersessionTriggers": [
            "rotation",
            "route_drift",
            "logout",
            "manual_revoke",
        ],
        "rationale": "Alternative-choice grants narrow to one current ranked offer chain and fail closed on tuple drift.",
    },
    {
        "useCase": "pharmacy_choice",
        "grantFamily": "transaction_action_minimal",
        "defaultActionScope": "pharmacy_status_entry",
        "routeFamilyRef": "rf_patient_requests",
        "lineageScope": "request",
        "subjectBindingMode": "hard_subject",
        "sessionRequirement": "bound_session",
        "issuanceOutcome": "issued",
        "defaultExpiryMinutes": 30,
        "transportClass": "opaque_signed_link",
        "supersessionTriggers": [
            "rotation",
            "identity_repair",
            "route_drift",
            "logout",
        ],
        "rationale": "Pharmacy choice stays on the current request-linked pharmacy tuple and cannot widen into hub or booking flows.",
    },
    {
        "useCase": "support_reissue",
        "grantFamily": "support_recovery_minimal",
        "defaultActionScope": "secure_resume",
        "routeFamilyRef": "rf_patient_secure_link_recovery",
        "lineageScope": "request",
        "subjectBindingMode": "hard_subject",
        "sessionRequirement": "fresh_or_rotated",
        "issuanceOutcome": "issued",
        "defaultExpiryMinutes": 30,
        "transportClass": "opaque_signed_link",
        "supersessionTriggers": [
            "secure_link_reissue",
            "identity_repair",
            "route_drift",
            "logout",
        ],
        "rationale": "Support reissue recreates only the immediately prior safe minimal scope and supersedes every older link.",
    },
    {
        "useCase": "recover_only",
        "grantFamily": None,
        "defaultActionScope": None,
        "routeFamilyRef": "rf_patient_secure_link_recovery",
        "lineageScope": "request",
        "subjectBindingMode": "none",
        "sessionRequirement": "none",
        "issuanceOutcome": "recover_only",
        "defaultExpiryMinutes": 0,
        "transportClass": "no_token",
        "supersessionTriggers": [],
        "rationale": "Recover-only is an explicit no-grant disposition for stale, legacy, or drifted continuity.",
    },
]

SCENARIO_BLUEPRINTS = [
    {
        "scenarioId": "draft_resume_issue_and_redeem",
        "title": "Draft resume settles once, then lets SessionGovernor rotate into a fresh resume session.",
        "useCase": "draft_resume",
        "grantFamily": "draft_resume_minimal",
        "routeFamilyRef": "rf_intake_self_service",
        "actionScope": "envelope_resume",
        "subjectBindingState": "none",
        "sessionRequirement": "fresh_or_rotated",
        "outcome": "issued_and_redeemed",
        "redemptionState": "redeemed",
        "grantState": "redeemed",
        "transportClass": "opaque_signed_link",
        "routeIntentState": "live",
        "sessionPostureBefore": "anonymous",
        "sessionPostureAfter": "fresh_rotated_resume_session",
        "supersessionChain": [],
        "transitionSteps": [
            "Issue envelope-bound grant",
            "Settle exact-once redemption",
            "SessionGovernor rotates into a new bounded session",
            "Resume the original draft route",
        ],
        "notes": "Anonymous posture is never upgraded in place; settlement happens before continuation.",
    },
    {
        "scenarioId": "public_status_multi_use_replay",
        "title": "Minimal public-status access replays deterministically without widening identity or action scope.",
        "useCase": "public_status_watch",
        "grantFamily": "public_status_minimal",
        "routeFamilyRef": "rf_patient_requests",
        "actionScope": "status_view",
        "subjectBindingState": "none",
        "sessionRequirement": "none",
        "outcome": "issued_and_redeemed",
        "redemptionState": "replay_returned",
        "grantState": "live",
        "transportClass": "opaque_signed_link",
        "routeIntentState": "live",
        "sessionPostureBefore": "anonymous",
        "sessionPostureAfter": "anonymous",
        "supersessionChain": [],
        "transitionSteps": [
            "Issue minimal public-status grant",
            "Return existing settlement on exact replay",
            "Keep session anonymous",
            "Preserve status-only route ceiling",
        ],
        "notes": "Multi-use replay is allowed only because the family never widens capability or subject scope.",
    },
    {
        "scenarioId": "request_claim_auth_uplift",
        "title": "Claim redemption opens AuthBridge and freezes a post-auth return intent instead of granting permission from auth alone.",
        "useCase": "request_claim",
        "grantFamily": "claim_step_up",
        "routeFamilyRef": "rf_patient_secure_link_recovery",
        "actionScope": "claim",
        "subjectBindingState": "soft_subject",
        "sessionRequirement": "fresh_or_rotated",
        "outcome": "step_up",
        "redemptionState": "auth_bridge_opened",
        "grantState": "redeemed",
        "transportClass": "opaque_signed_link",
        "routeIntentState": "live",
        "sessionPostureBefore": "anonymous",
        "sessionPostureAfter": "auth_bridge_transaction_pending",
        "supersessionChain": [],
        "transitionSteps": [
            "Issue claim step-up grant",
            "Settle redemption against route tuple and soft subject proof",
            "Freeze AuthScopeBundle and PostAuthReturnIntent",
            "Return only through the bounded auth bridge",
        ],
        "notes": "Authentication success alone never widens the route or action ceiling; the service keeps grant truth authoritative.",
    },
    {
        "scenarioId": "secure_continuation_verified_resume",
        "title": "Verified continuation resumes one current request tuple after exact-once settlement.",
        "useCase": "secure_continuation",
        "grantFamily": "continuation_seeded_verified",
        "routeFamilyRef": "rf_patient_secure_link_recovery",
        "actionScope": "secure_resume",
        "subjectBindingState": "hard_subject",
        "sessionRequirement": "fresh_or_rotated",
        "outcome": "issued_and_redeemed",
        "redemptionState": "redeemed",
        "grantState": "redeemed",
        "transportClass": "opaque_signed_link",
        "routeIntentState": "live",
        "sessionPostureBefore": "rotated_subject_session",
        "sessionPostureAfter": "rotated_subject_session",
        "supersessionChain": [],
        "transitionSteps": [
            "Issue hard-subject continuation grant",
            "Validate route intent, lineage fence, and tuple digest",
            "Settle one redemption record",
            "Re-enter the exact current continuation route",
        ],
        "notes": "The current tuple hash and subject binding version gate every continuation redemption.",
    },
    {
        "scenarioId": "continuation_challenge_contact_repair",
        "title": "Challenge-mode continuation routes into contact repair without exposing scoped request truth.",
        "useCase": "challenge_repair",
        "grantFamily": "continuation_challenge",
        "routeFamilyRef": "rf_patient_secure_link_recovery",
        "actionScope": "contact_route_repair",
        "subjectBindingState": "soft_subject",
        "sessionRequirement": "fresh_or_rotated",
        "outcome": "issued_and_redeemed",
        "redemptionState": "redeemed",
        "grantState": "redeemed",
        "transportClass": "opaque_signed_link",
        "routeIntentState": "live",
        "sessionPostureBefore": "anonymous",
        "sessionPostureAfter": "fresh_repair_session",
        "supersessionChain": [],
        "transitionSteps": [
            "Issue continuation challenge grant",
            "Validate degraded but bounded proof posture",
            "Settle redemption into repair-only capability",
            "Send the user to contact-route repair",
        ],
        "notes": "Challenge flows remain no-PHI and repair-only until stronger proof closes the gap.",
    },
    {
        "scenarioId": "callback_reply_single_use",
        "title": "Callback reply re-enters one communication action path and stops there.",
        "useCase": "callback_reply",
        "grantFamily": "transaction_action_minimal",
        "routeFamilyRef": "rf_patient_messages",
        "actionScope": "callback_response",
        "subjectBindingState": "hard_subject",
        "sessionRequirement": "bound_session",
        "outcome": "issued_and_redeemed",
        "redemptionState": "redeemed",
        "grantState": "redeemed",
        "transportClass": "opaque_signed_link",
        "routeIntentState": "live",
        "sessionPostureBefore": "bound_subject_session",
        "sessionPostureAfter": "bound_subject_session",
        "supersessionChain": [],
        "transitionSteps": [
            "Issue callback-response grant",
            "Confirm bound session and exact route tuple",
            "Settle redemption",
            "Enter callback response only",
        ],
        "notes": "Callback grants never widen into generic message or booking capabilities.",
    },
    {
        "scenarioId": "message_reply_reissued",
        "title": "Support replaces a stale message-reply link and supersedes the older token immediately.",
        "useCase": "message_reply",
        "grantFamily": "transaction_action_minimal",
        "routeFamilyRef": "rf_patient_messages",
        "actionScope": "message_reply",
        "subjectBindingState": "hard_subject",
        "sessionRequirement": "bound_session",
        "outcome": "reissued",
        "redemptionState": "replaced",
        "grantState": "superseded",
        "transportClass": "opaque_signed_link",
        "routeIntentState": "live",
        "sessionPostureBefore": "bound_subject_session",
        "sessionPostureAfter": "bound_subject_session",
        "supersessionChain": [
            {
                "supersessionId": "AGS_078_MESSAGE_REPLY_ROTATE",
                "causeClass": "secure_link_reissue",
                "recordedAt": "2026-04-12T17:16:00Z",
                "replacementGrantRef": "AG_078_MESSAGE_REPLY_V2",
                "notes": "The old reply link is no longer valid once support reissues a fresh token.",
            }
        ],
        "transitionSteps": [
            "Issue message-reply grant",
            "Detect stale delivery or user repair need",
            "Replace through AccessGrantService",
            "Carry only the fresh replacement token forward",
        ],
        "notes": "Feature code never mints ad hoc replacements; the canonical service owns the supersession chain.",
    },
    {
        "scenarioId": "booking_manage_rotated",
        "title": "Booking-manage rotation supersedes the old appointment token on tuple change.",
        "useCase": "booking_manage",
        "grantFamily": "transaction_action_minimal",
        "routeFamilyRef": "rf_patient_appointments",
        "actionScope": "appointment_manage_entry",
        "subjectBindingState": "hard_subject",
        "sessionRequirement": "bound_session",
        "outcome": "rotated",
        "redemptionState": "replaced",
        "grantState": "rotated",
        "transportClass": "opaque_signed_link",
        "routeIntentState": "live",
        "sessionPostureBefore": "bound_subject_session",
        "sessionPostureAfter": "bound_subject_session",
        "supersessionChain": [
            {
                "supersessionId": "AGS_078_BOOKING_ROTATION",
                "causeClass": "rotation",
                "recordedAt": "2026-04-12T17:21:00Z",
                "replacementGrantRef": "AG_078_BOOKING_MANAGE_V2",
                "notes": "Appointment tuple drift or provider-side confirmation rotates the link before the old token can act.",
            }
        ],
        "transitionSteps": [
            "Issue booking-manage grant",
            "Observe tuple change",
            "Rotate through canonical supersession logic",
            "Expose only the latest manage-entry token",
        ],
        "notes": "Rotation closes the old-link-live gap for booking updates and confirmations.",
    },
    {
        "scenarioId": "waitlist_offer_replay_safe",
        "title": "Waitlist offer replay returns the current settlement instead of creating a second side effect.",
        "useCase": "waitlist_action",
        "grantFamily": "transaction_action_minimal",
        "routeFamilyRef": "rf_patient_appointments",
        "actionScope": "waitlist_offer",
        "subjectBindingState": "hard_subject",
        "sessionRequirement": "bound_session",
        "outcome": "issued_and_redeemed",
        "redemptionState": "replay_returned",
        "grantState": "redeemed",
        "transportClass": "opaque_signed_link",
        "routeIntentState": "live",
        "sessionPostureBefore": "bound_subject_session",
        "sessionPostureAfter": "bound_subject_session",
        "supersessionChain": [],
        "transitionSteps": [
            "Issue waitlist-offer grant",
            "Settle the first redemption exactly once",
            "Return the existing settlement on replay",
            "Never create a second offer side effect",
        ],
        "notes": "Replay-safety is preserved at the grant service boundary rather than in feature-local handlers.",
    },
    {
        "scenarioId": "network_alternative_choice_route_drift",
        "title": "Alternative-choice redemption fails closed when the governing route tuple drifts.",
        "useCase": "network_alternative_choice",
        "grantFamily": "transaction_action_minimal",
        "routeFamilyRef": "rf_patient_appointments",
        "actionScope": "alternative_offer",
        "subjectBindingState": "hard_subject",
        "sessionRequirement": "bound_session",
        "outcome": "recover_only",
        "redemptionState": "blocked_drift",
        "grantState": "superseded",
        "transportClass": "opaque_signed_link",
        "routeIntentState": "drifted",
        "sessionPostureBefore": "bound_subject_session",
        "sessionPostureAfter": "recover_only",
        "supersessionChain": [
            {
                "supersessionId": "AGS_078_ALT_ROUTE_DRIFT",
                "causeClass": "route_drift",
                "recordedAt": "2026-04-12T17:29:00Z",
                "replacementGrantRef": None,
                "notes": "The old alternative-choice token is invalid once the governing tuple no longer matches the route contract.",
            }
        ],
        "transitionSteps": [
            "Issue alternative-choice grant",
            "Observe tuple drift against the route-intent binding",
            "Block redemption and record recover-only posture",
            "Send the user to governed recovery instead of acting on stale state",
        ],
        "notes": "Route intent and runtime tuple law are enforced before any action can settle.",
    },
    {
        "scenarioId": "pharmacy_choice_wrong_patient_revoked",
        "title": "Wrong-patient repair revokes the current pharmacy-choice link and preserves the audit chain.",
        "useCase": "pharmacy_choice",
        "grantFamily": "transaction_action_minimal",
        "routeFamilyRef": "rf_patient_requests",
        "actionScope": "pharmacy_status_entry",
        "subjectBindingState": "mismatch",
        "sessionRequirement": "bound_session",
        "outcome": "revoked",
        "redemptionState": "revoked",
        "grantState": "revoked",
        "transportClass": "opaque_signed_link",
        "routeIntentState": "live",
        "sessionPostureBefore": "mismatched_subject_session",
        "sessionPostureAfter": "repair_required",
        "supersessionChain": [
            {
                "supersessionId": "AGS_078_PHARMACY_REPAIR",
                "causeClass": "identity_repair",
                "recordedAt": "2026-04-12T17:34:00Z",
                "replacementGrantRef": None,
                "notes": "Repair-driven revocation keeps the wrong-patient path closed until a fresh safe grant is issued.",
            }
        ],
        "transitionSteps": [
            "Issue pharmacy-choice grant",
            "Detect subject mismatch",
            "Revoke and supersede through repair-driven authority",
            "Require recovery or manual reissue",
        ],
        "notes": "Wrong-patient repair revokes the link instead of attempting an in-place session upgrade.",
    },
    {
        "scenarioId": "support_reissue_recovery",
        "title": "Support reissue recreates only the immediately prior minimal safe scope and marks the old token stale.",
        "useCase": "support_reissue",
        "grantFamily": "support_recovery_minimal",
        "routeFamilyRef": "rf_patient_secure_link_recovery",
        "actionScope": "secure_resume",
        "subjectBindingState": "hard_subject",
        "sessionRequirement": "fresh_or_rotated",
        "outcome": "reissued",
        "redemptionState": "replaced",
        "grantState": "live",
        "transportClass": "opaque_signed_link",
        "routeIntentState": "live",
        "sessionPostureBefore": "support_agent_verified",
        "sessionPostureAfter": "fresh_rotated_resume_session",
        "supersessionChain": [
            {
                "supersessionId": "AGS_078_SUPPORT_REISSUE",
                "causeClass": "secure_link_reissue",
                "recordedAt": "2026-04-12T17:39:00Z",
                "replacementGrantRef": "AG_078_SUPPORT_REISSUE_V2",
                "notes": "Support recovery creates one fresh bounded link and invalidates every older token in the chain.",
            }
        ],
        "transitionSteps": [
            "Issue recovery-family reissue",
            "Supersede the prior stale token",
            "Deliver one fresh minimal recovery grant",
            "Resume only the last safe bounded scope",
        ],
        "notes": "Support reissue cannot widen from minimal recovery into a broader patient capability surface.",
    },
    {
        "scenarioId": "recover_only_no_grant",
        "title": "Legacy or ambiguous continuity produces recover-only and no redeemable token at all.",
        "useCase": "recover_only",
        "grantFamily": None,
        "routeFamilyRef": "rf_patient_secure_link_recovery",
        "actionScope": None,
        "subjectBindingState": "none",
        "sessionRequirement": "none",
        "outcome": "recover_only",
        "redemptionState": "recover_only",
        "grantState": "no_grant",
        "transportClass": "no_token",
        "routeIntentState": "recover_only",
        "sessionPostureBefore": "anonymous",
        "sessionPostureAfter": "recover_only",
        "supersessionChain": [],
        "transitionSteps": [
            "Recognize stale or legacy continuity",
            "Refuse to mint a grant",
            "Publish recover-only disposition",
            "Route to governed recovery",
        ],
        "notes": "Recover-only is explicit and does not pretend there is still a safe live link.",
    },
    {
        "scenarioId": "manual_only_support_gate",
        "title": "Unsafe support requests degrade to manual-only rather than rendering a misleading live action link.",
        "useCase": "support_reissue",
        "grantFamily": None,
        "routeFamilyRef": "rf_patient_secure_link_recovery",
        "actionScope": None,
        "subjectBindingState": "hard_subject",
        "sessionRequirement": "fresh_or_rotated",
        "outcome": "manual_only",
        "redemptionState": "manual_only",
        "grantState": "no_grant",
        "transportClass": "no_token",
        "routeIntentState": "manual_only",
        "sessionPostureBefore": "support_agent_verified",
        "sessionPostureAfter": "manual_only",
        "supersessionChain": [],
        "transitionSteps": [
            "Evaluate unsafe support reissue request",
            "Refuse to issue a redeemable grant",
            "Publish manual-only outcome",
            "Escalate through governed human handling",
        ],
        "notes": "Manual-only is a first-class outcome, not a disguised broken-link failure.",
    },
]


def ensure_parent(path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)


def write_text(path: Path, content: str) -> None:
    ensure_parent(path)
    path.write_text(content.rstrip() + "\n", encoding="utf-8")


def write_json(path: Path, payload: object) -> None:
    ensure_parent(path)
    path.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")


def write_csv(path: Path, rows: list[dict[str, object]], fieldnames: list[str]) -> None:
    ensure_parent(path)
    with path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        for row in rows:
            writer.writerow(row)


def read_json(path: Path) -> dict[str, object]:
    return json.loads(path.read_text(encoding="utf-8"))


def sha256_hex(payload: object) -> str:
    return hashlib.sha256(json.dumps(payload, sort_keys=True).encode("utf-8")).hexdigest()


def append_script_step(script: str, step: str) -> str:
    return script if step in script else script + " && " + step


def build_matrix_rows() -> list[dict[str, object]]:
    rows: list[dict[str, object]] = []
    for item in USE_CASE_ROWS:
        family = FAMILY_LOOKUP.get(item["grantFamily"]) if item["grantFamily"] else None
        rows.append(
            {
                "use_case": item["useCase"],
                "grant_family": item["grantFamily"] or "",
                "validator_family": family["validatorFamily"] if family else "",
                "replay_policy": family["replayPolicy"] if family else "none",
                "route_family_ref": item["routeFamilyRef"],
                "default_action_scope": item["defaultActionScope"] or "",
                "lineage_scope": item["lineageScope"],
                "subject_binding_mode": item["subjectBindingMode"],
                "session_requirement": item["sessionRequirement"],
                "issuance_outcome": item["issuanceOutcome"],
                "default_expiry_minutes": item["defaultExpiryMinutes"],
                "transport_class": item["transportClass"],
                "supersession_triggers": "|".join(item["supersessionTriggers"]),
                "rationale": item["rationale"],
            }
        )
    return rows


def build_cases() -> list[dict[str, object]]:
    cases: list[dict[str, object]] = []
    for index, blueprint in enumerate(SCENARIO_BLUEPRINTS, start=1):
        family = FAMILY_LOOKUP.get(blueprint["grantFamily"]) if blueprint["grantFamily"] else None
        tuple_hash = sha256_hex(
            {
                "scenarioId": blueprint["scenarioId"],
                "grantFamily": blueprint["grantFamily"],
                "routeFamilyRef": blueprint["routeFamilyRef"],
                "actionScope": blueprint["actionScope"],
                "subjectBindingState": blueprint["subjectBindingState"],
                "routeIntentState": blueprint["routeIntentState"],
                "outcome": blueprint["outcome"],
            }
        )
        token_digest = (
            "none"
            if blueprint["transportClass"] == "no_token"
            else sha256_hex(
                {
                    "scenarioId": blueprint["scenarioId"],
                    "keyVersionRef": "token_key_local_v1",
                    "grantFamily": blueprint["grantFamily"],
                }
            )
        )
        scenario_label = blueprint["scenarioId"].upper()
        grant_id = None
        scope_envelope_id = None
        redemption_id = None
        if blueprint["grantFamily"]:
            grant_id = f"AG_078_{scenario_label}"
            scope_envelope_id = f"AGE_078_{scenario_label}"
        if blueprint["redemptionState"] not in {"recover_only", "manual_only"}:
            redemption_id = f"AGR_078_{scenario_label}"
        events: list[dict[str, object]] = []
        if grant_id:
            events.append(
                {
                    "eventId": f"{blueprint['scenarioId']}_issue",
                    "eventKind": "issue",
                    "status": "settled",
                    "recordedAt": f"2026-04-12T17:{index:02d}:00Z",
                    "detail": f"{blueprint['grantFamily']} issued under {blueprint['routeFamilyRef']}.",
                }
            )
        if redemption_id:
            events.append(
                {
                    "eventId": f"{blueprint['scenarioId']}_redeem",
                    "eventKind": "redeem",
                    "status": blueprint["redemptionState"],
                    "recordedAt": f"2026-04-12T17:{(index + 1):02d}:00Z",
                    "detail": f"Settlement posture {blueprint['redemptionState']} with session after-state {blueprint['sessionPostureAfter']}.",
                }
            )
        for position, item in enumerate(blueprint["supersessionChain"], start=1):
            events.append(
                {
                    "eventId": f"{blueprint['scenarioId']}_supersede_{position}",
                    "eventKind": "supersede",
                    "status": item["causeClass"],
                    "recordedAt": item["recordedAt"],
                    "detail": item["notes"],
                }
            )
        if blueprint["grantState"] == "no_grant":
            events.append(
                {
                    "eventId": f"{blueprint['scenarioId']}_outcome",
                    "eventKind": "outcome",
                    "status": blueprint["outcome"],
                    "recordedAt": f"2026-04-12T17:{(index + 2):02d}:00Z",
                    "detail": blueprint["notes"],
                }
            )
        cases.append(
            {
                "scenarioId": blueprint["scenarioId"],
                "title": blueprint["title"],
                "useCase": blueprint["useCase"],
                "grantFamily": blueprint["grantFamily"],
                "routeFamilyRef": blueprint["routeFamilyRef"],
                "actionScope": blueprint["actionScope"],
                "subjectBindingState": blueprint["subjectBindingState"],
                "sessionRequirement": blueprint["sessionRequirement"],
                "outcome": blueprint["outcome"],
                "redemptionState": blueprint["redemptionState"],
                "grantState": blueprint["grantState"],
                "transportClass": blueprint["transportClass"],
                "keyVersionRef": "token_key_local_v1"
                if blueprint["transportClass"] != "no_token"
                else None,
                "grantId": grant_id,
                "scopeEnvelopeId": scope_envelope_id,
                "redemptionId": redemption_id,
                "tokenDigest": token_digest,
                "tupleHash": tuple_hash,
                "routeIntentBindingRef": f"route_intent_078_{blueprint['scenarioId']}",
                "routeIntentState": blueprint["routeIntentState"],
                "sessionPostureBefore": blueprint["sessionPostureBefore"],
                "sessionPostureAfter": blueprint["sessionPostureAfter"],
                "validatorFamily": family["validatorFamily"] if family else None,
                "replayPolicy": family["replayPolicy"] if family else "none",
                "transitionSteps": blueprint["transitionSteps"],
                "supersessionChain": blueprint["supersessionChain"],
                "events": events,
                "notes": blueprint["notes"],
            }
        )
    return cases


def build_runtime_tuples(cases: list[dict[str, object]]) -> list[dict[str, object]]:
    tuples: list[dict[str, object]] = []
    for case in cases:
        tuples.append(
            {
                "tupleId": f"runtime_tuple_078_{case['scenarioId']}",
                "scenarioId": case["scenarioId"],
                "useCase": case["useCase"],
                "grantFamily": case["grantFamily"],
                "routeFamilyRef": case["routeFamilyRef"],
                "actionScope": case["actionScope"],
                "sessionRequirement": case["sessionRequirement"],
                "subjectBindingState": case["subjectBindingState"],
                "routeIntentBindingRef": case["routeIntentBindingRef"],
                "routeIntentState": case["routeIntentState"],
                "tupleHash": case["tupleHash"],
                "transportClass": case["transportClass"],
                "tokenKeyVersionRef": case["keyVersionRef"],
                "settlementMode": case["redemptionState"],
                "outcome": case["outcome"],
                "notes": case["notes"],
            }
        )
    return tuples


def build_casebook(cases: list[dict[str, object]]) -> dict[str, object]:
    live_grant_count = sum(1 for case in cases if case["grantState"] == "live")
    redeemed_settlement_count = sum(
        1 for case in cases if case["redemptionState"] in {"redeemed", "replay_returned", "auth_bridge_opened"}
    )
    supersession_count = sum(1 for case in cases if case["supersessionChain"])
    replay_block_count = sum(
        1
        for case in cases
        if case["redemptionState"] in {"replay_returned", "blocked_drift", "revoked"}
    )
    non_grant_outcome_count = sum(1 for case in cases if case["grantState"] == "no_grant")
    return {
        "task_id": TASK_ID,
        "generated_at": GENERATED_AT,
        "captured_on": CAPTURED_ON,
        "visual_mode": VISUAL_MODE,
        "summary": {
            "scenario_count": len(cases),
            "live_grant_count": live_grant_count,
            "redeemed_settlement_count": redeemed_settlement_count,
            "supersession_case_count": supersession_count,
            "replay_block_count": replay_block_count,
            "non_grant_outcome_count": non_grant_outcome_count,
            "auth_bridge_case_count": sum(
                1 for case in cases if case["redemptionState"] == "auth_bridge_opened"
            ),
        },
        "cases": cases,
    }


def build_manifest(runtime_tuples: list[dict[str, object]], cases: list[dict[str, object]]) -> dict[str, object]:
    return {
        "task_id": TASK_ID,
        "generated_at": GENERATED_AT,
        "captured_on": CAPTURED_ON,
        "visual_mode": VISUAL_MODE,
        "mission": "Freeze one authoritative access-grant authority across draft resume, claim, continuation, transaction action, support recovery, replay, supersession, and post-auth uplift flows so later channels stop inventing token semantics independently.",
        "source_precedence": SOURCE_PRECEDENCE,
        "summary": {
            "grant_family_count": len(FAMILY_REGISTRY),
            "use_case_count": len(USE_CASE_ROWS),
            "runtime_tuple_count": len(runtime_tuples),
            "scenario_count": len(cases),
            "bounded_port_count": 2,
            "parallel_gap_count": 2,
            "authoritative_operation_count": 8,
        },
        "bounded_ports": [
            {
                "portName": "SessionGovernor",
                "implementation": "LocalSessionGovernor",
                "responsibility": "Reject in-place anonymous or mismatched-session upgrades and decide when a fresh or rotated session is required.",
            },
            {
                "portName": "AuthBridge",
                "implementation": "LocalAuthBridge",
                "responsibility": "Freeze auth scope bundles, post-auth return intents, and auth transactions without minting grant truth outside AccessGrantService.",
            },
        ],
        "parallel_interface_gaps": [
            "PARALLEL_INTERFACE_GAP_AUTH_BRIDGE_CALLBACK_PROVIDER",
            "PARALLEL_INTERFACE_GAP_SESSION_COOKIE_RUNTIME",
        ],
        "authoritative_operations": [
            "issueGrant",
            "issueGrantForUseCase",
            "redeemGrant",
            "openAuthBridgeFlow",
            "rotateGrant",
            "replaceGrant",
            "revokeGrant",
            "supersedeGrants",
        ],
        "token_materialization": {
            "strategy": "hashed_and_signed_opaque_tokens",
            "activeKeyVersionRef": "token_key_local_v1",
            "retiredKeyVersionRefs": ["token_key_legacy_v0"],
            "materializer": "OpaqueAccessGrantTokenMaterializer",
        },
        "grant_families": FAMILY_REGISTRY,
        "use_cases": USE_CASE_ROWS,
        "runtime_tuples": runtime_tuples,
        "implementation_refs": [
            "packages/domains/identity_access/src/identity-access-backbone.ts",
            "services/command-api/src/access-grant.ts",
            "packages/domains/identity_access/tests/identity-access-backbone.test.ts",
            "services/command-api/tests/access-grant.integration.test.js",
        ],
    }


def build_design_doc(manifest: dict[str, object], casebook: dict[str, object]) -> str:
    summary = manifest["summary"]
    case_summary = casebook["summary"]
    return dedent(
        f"""
        # 78 Access Grant Service Design

        `par_078` freezes one canonical `AccessGrantService` around the append-only grant, scope-envelope,
        redemption, and supersession models already implemented in
        `packages/domains/identity_access/src/identity-access-backbone.ts` and exercised through
        `services/command-api/src/access-grant.ts`.

        ## Frozen Scope

        - Grant families: {summary["grant_family_count"]}
        - Use-case registry rows: {summary["use_case_count"]}
        - Runtime tuples: {summary["runtime_tuple_count"]}
        - Casebook scenarios: {summary["scenario_count"]}
        - Bounded ports: {summary["bounded_port_count"]}
        - Parallel interface gaps: {summary["parallel_gap_count"]}

        ## Canonical Service Responsibilities

        - Issue one immutable `AccessGrantScopeEnvelope` for every redeemable grant.
        - Materialize opaque signed tokens through `OpaqueAccessGrantTokenMaterializer` with key-version support.
        - Settle one exact-once `AccessGrantRedemptionRecord` before any session creation, callback re-entry, or replacement issuance occurs.
        - Delegate bounded session posture decisions to `SessionGovernor`, never to channel-local code.
        - Delegate auth uplift and post-auth return freezing to `AuthBridge`, never to grant consumers.
        - Return the current settlement on exact replay instead of producing a second side effect.
        - Supersede older grants on promotion, rotation, logout, wrong-patient repair, reissue, and route-drift invalidation.
        - Publish explicit `recover_only` and `manual_only` outcomes instead of minting misleading links.

        ## Bounded Runtime Law

        The service binds every grant to a route family, governing object, governing version, action scope,
        subject-binding rule, lineage fence epoch, token key version, and route-intent posture. That closes the
        previously observed gaps where authentication success was treated as permission, channel-specific links
        invented their own replay rules, or stale links survived after tuple drift and repair.

        ## Scenario Baseline

        - Live grants after scenario execution: {case_summary["live_grant_count"]}
        - Redeemed settlements: {case_summary["redeemed_settlement_count"]}
        - Supersession-bearing cases: {case_summary["supersession_case_count"]}
        - Replay-block or replay-return incidents: {case_summary["replay_block_count"]}
        - Explicit non-grant outcomes: {case_summary["non_grant_outcome_count"]}
        - Auth-bridge cases: {case_summary["auth_bridge_case_count"]}

        ## Remaining Parallel Gaps

        - `PARALLEL_INTERFACE_GAP_AUTH_BRIDGE_CALLBACK_PROVIDER`
        - `PARALLEL_INTERFACE_GAP_SESSION_COOKIE_RUNTIME`

        Both gaps are intentionally bounded. Live providers may later change proof collection, callback delivery,
        or cookie/runtime wiring, but they must still call the same grant authority and may not bypass scope
        envelope validation, route-intent checks, exact-once redemption settlement, or supersession chains.
        """
    ).strip()


def build_rules_doc(matrix_rows: list[dict[str, object]]) -> str:
    row_lines = "\n".join(
        f"- `{row['use_case']}` -> `{row['grant_family'] or 'no_grant'}` / `{row['default_action_scope'] or 'no_action'}` / `{row['route_family_ref']}` / `{row['issuance_outcome']}`"
        for row in matrix_rows
    )
    return dedent(
        f"""
        # 78 Access Grant Family And Redemption Rules

        This document freezes the grant-family registry and the redemption law that `AccessGrantService`
        enforces before any patient-facing continuation or action path may proceed.

        ## Use-Case Matrix

        {row_lines}

        ## Non-Negotiable Redemption Rules

        - `AccessGrantService` is the only authority allowed to issue, redeem, replace, rotate, revoke, or supersede patient-facing grants.
        - Every redeemable grant carries one immutable `AccessGrantScopeEnvelope`.
        - Redemption never widens route family, embedded capability, or PHI exposure beyond the frozen envelope.
        - Exact replay returns the current settlement and never creates a second side effect.
        - Anonymous or mismatched sessions are never upgraded in place; `SessionGovernor` decides whether a fresh or rotated posture is required.
        - Auth success is not permission; `AuthBridge` is bounded to proof and return-intent orchestration, while the grant service keeps route and scope authority.
        - Route-intent drift, lineage-fence drift, wrong-patient repair, logout, and support-driven reissue all close older links through authoritative supersession chains.
        - `recover_only` and `manual_only` are first-class outcomes and may not render a redeemable token.

        ## Token And Replay Law

        - Storage remains hashed; raw opaque tokens exist only at first materialization.
        - Key-version support is explicit through `token_key_local_v1` with room for later rotation.
        - Replay-safe families either return the prior settlement or reject drifted / stale tuples with a recover-only posture.
        - Audit joins remain intact across issue, redeem, replace, revoke, and supersede paths.
        """
    ).strip()


def build_studio_html(manifest: dict[str, object], casebook: dict[str, object], matrix_rows: list[dict[str, object]]) -> str:
    template = dedent(
        """
        <!doctype html>
        <html lang="en">
          <head>
            <meta charset="utf-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1" />
            <title>Access Grant Journey Lab</title>
            <style>
              :root {
                --canvas: #F7F9FC;
                --panel: #FFFFFF;
                --rail: #EEF2F7;
                --inset: #F4F7FB;
                --text-strong: #0F172A;
                --text-default: #1E293B;
                --text-muted: #64748B;
                --border: #E2E8F0;
                --issue: #2563EB;
                --redeem: #0EA5A4;
                --supersede: #7C3AED;
                --warning: #D97706;
                --blocked: #C24141;
                --control-height: 44px;
                --radius-lg: 22px;
                --radius-md: 16px;
                --radius-sm: 12px;
                --shadow: 0 20px 40px rgba(15, 23, 42, 0.08);
              }

              * {
                box-sizing: border-box;
              }

              body {
                margin: 0;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
                background:
                  radial-gradient(circle at top left, rgba(37, 99, 235, 0.1), transparent 32%),
                  radial-gradient(circle at top right, rgba(124, 58, 237, 0.08), transparent 28%),
                  var(--canvas);
                color: var(--text-default);
              }

              body[data-reduced-motion="true"] *,
              body[data-reduced-motion="true"] *::before,
              body[data-reduced-motion="true"] *::after {
                animation: none !important;
                transition: none !important;
                scroll-behavior: auto !important;
              }

              .shell {
                max-width: 1540px;
                margin: 0 auto;
                padding: 24px;
              }

              .masthead {
                position: sticky;
                top: 0;
                z-index: 20;
                display: grid;
                grid-template-columns: minmax(0, 1.2fr) repeat(4, minmax(120px, 1fr));
                gap: 12px;
                min-height: 72px;
                padding: 16px 20px;
                margin-bottom: 18px;
                border: 1px solid rgba(226, 232, 240, 0.92);
                border-radius: 24px;
                background: rgba(255, 255, 255, 0.92);
                backdrop-filter: blur(18px);
                box-shadow: var(--shadow);
              }

              .brand {
                display: flex;
                align-items: center;
                gap: 14px;
              }

              .brand-mark {
                width: 48px;
                height: 48px;
                border-radius: 16px;
                background: linear-gradient(135deg, rgba(37, 99, 235, 0.16), rgba(124, 58, 237, 0.14));
                display: grid;
                place-items: center;
                border: 1px solid rgba(37, 99, 235, 0.18);
              }

              .brand-copy strong {
                display: block;
                font-size: 1rem;
                color: var(--text-strong);
              }

              .brand-copy span {
                display: block;
                font-size: 0.82rem;
                color: var(--text-muted);
              }

              .metric {
                border: 1px solid var(--border);
                border-radius: 18px;
                padding: 12px 14px;
                background: var(--panel);
                display: flex;
                flex-direction: column;
                justify-content: center;
              }

              .metric-label {
                font-size: 0.72rem;
                text-transform: uppercase;
                letter-spacing: 0.08em;
                color: var(--text-muted);
              }

              .metric-value {
                font-size: 1.45rem;
                font-weight: 700;
                color: var(--text-strong);
              }

              .layout {
                display: grid;
                grid-template-columns: 316px minmax(0, 1fr) 408px;
                gap: 18px;
                align-items: start;
              }

              .panel {
                background: var(--panel);
                border: 1px solid var(--border);
                border-radius: var(--radius-lg);
                box-shadow: var(--shadow);
              }

              .panel-header {
                display: flex;
                justify-content: space-between;
                align-items: baseline;
                gap: 12px;
                padding: 18px 20px 8px;
              }

              .panel-header h2,
              .panel-header h3 {
                margin: 0;
                font-size: 1rem;
                color: var(--text-strong);
              }

              .panel-header p {
                margin: 0;
                font-size: 0.82rem;
                color: var(--text-muted);
              }

              .left-rail {
                position: sticky;
                top: 88px;
                background: var(--rail);
                padding: 18px;
                border-radius: var(--radius-lg);
                border: 1px solid var(--border);
              }

              .filter-group {
                margin-bottom: 16px;
              }

              .filter-group label {
                display: block;
                margin-bottom: 8px;
                font-size: 0.76rem;
                letter-spacing: 0.04em;
                text-transform: uppercase;
                color: var(--text-muted);
              }

              .filter-group select {
                width: 100%;
                height: var(--control-height);
                border-radius: 14px;
                border: 1px solid var(--border);
                background: var(--panel);
                color: var(--text-default);
                padding: 0 14px;
                font: inherit;
                transition: border-color 120ms ease, box-shadow 120ms ease, transform 120ms ease;
              }

              .filter-group select:focus-visible,
              .issuance-row:focus-visible,
              .family-chip:focus-visible,
              .inspector-section:focus-visible {
                outline: none;
                border-color: rgba(37, 99, 235, 0.45);
                box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.14);
              }

              .rail-parity {
                padding: 14px;
                border-radius: 16px;
                background: rgba(255, 255, 255, 0.86);
                color: var(--text-muted);
                font-size: 0.84rem;
              }

              .central-stack {
                display: grid;
                gap: 18px;
              }

              .diagram-grid {
                display: grid;
                grid-template-columns: repeat(3, minmax(0, 1fr));
                gap: 18px;
                min-height: 280px;
              }

              .diagram-card {
                padding: 18px;
                background: linear-gradient(180deg, rgba(244, 247, 251, 0.9), rgba(255, 255, 255, 0.96));
              }

              .diagram-card .parity {
                margin-top: 12px;
                font-size: 0.82rem;
                color: var(--text-muted);
              }

              .family-ladder {
                display: grid;
                gap: 10px;
              }

              .family-chip {
                display: flex;
                justify-content: space-between;
                align-items: center;
                gap: 10px;
                width: 100%;
                min-height: 56px;
                border-radius: 16px;
                border: 1px solid var(--border);
                background: var(--panel);
                color: inherit;
                padding: 0 14px;
                text-align: left;
                cursor: pointer;
                transition: transform 120ms ease, box-shadow 120ms ease, border-color 120ms ease;
              }

              .family-chip[data-selected="true"] {
                border-color: rgba(37, 99, 235, 0.42);
                box-shadow: 0 14px 28px rgba(37, 99, 235, 0.14);
                transform: translateY(-1px);
              }

              .family-chip strong,
              .transition-step strong,
              .ribbon-chip strong {
                color: var(--text-strong);
              }

              .transition-map {
                display: grid;
                gap: 10px;
              }

              .transition-step {
                display: flex;
                align-items: center;
                gap: 12px;
                padding: 12px 14px;
                border: 1px solid var(--border);
                border-radius: 16px;
                background: var(--panel);
              }

              .transition-index {
                width: 30px;
                height: 30px;
                border-radius: 999px;
                display: grid;
                place-items: center;
                font-size: 0.82rem;
                font-weight: 700;
                color: var(--panel);
                background: var(--redeem);
              }

              .supersession-ribbon {
                display: flex;
                flex-wrap: wrap;
                gap: 10px;
                align-content: flex-start;
              }

              .ribbon-chip {
                min-width: 140px;
                padding: 12px 14px;
                border-radius: 16px;
                border: 1px solid rgba(124, 58, 237, 0.18);
                background: linear-gradient(135deg, rgba(124, 58, 237, 0.12), rgba(255, 255, 255, 0.98));
              }

              .ribbon-chip[data-empty="true"] {
                border-style: dashed;
                border-color: var(--border);
                background: rgba(255, 255, 255, 0.7);
              }

              .data-region {
                display: grid;
                grid-template-columns: minmax(0, 1.3fr) minmax(0, 1fr);
                gap: 18px;
              }

              table {
                width: 100%;
                border-collapse: collapse;
              }

              th,
              td {
                padding: 12px 14px;
                border-bottom: 1px solid var(--border);
                text-align: left;
                vertical-align: top;
                font-size: 0.92rem;
              }

              th {
                font-size: 0.72rem;
                text-transform: uppercase;
                letter-spacing: 0.08em;
                color: var(--text-muted);
              }

              .issuance-row {
                cursor: pointer;
                transition: background-color 180ms ease, transform 180ms ease;
              }

              .issuance-row[data-selected="true"],
              .redemption-row[data-selected="true"] {
                background: rgba(37, 99, 235, 0.08);
              }

              .redemption-row {
                transition: background-color 180ms ease;
              }

              .mono {
                font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
                font-size: 0.83rem;
                word-break: break-all;
              }

              .badge {
                display: inline-flex;
                align-items: center;
                gap: 6px;
                border-radius: 999px;
                padding: 4px 10px;
                font-size: 0.76rem;
                font-weight: 600;
              }

              .badge.issue {
                background: rgba(37, 99, 235, 0.12);
                color: var(--issue);
              }

              .badge.redeem {
                background: rgba(14, 165, 164, 0.12);
                color: var(--redeem);
              }

              .badge.supersede {
                background: rgba(124, 58, 237, 0.12);
                color: var(--supersede);
              }

              .badge.warning {
                background: rgba(217, 119, 6, 0.12);
                color: var(--warning);
              }

              .badge.blocked {
                background: rgba(194, 65, 65, 0.12);
                color: var(--blocked);
              }

              .inspector {
                position: sticky;
                top: 88px;
                padding: 18px;
              }

              .inspector-stack {
                display: grid;
                gap: 14px;
              }

              .inspector-section {
                padding: 14px;
                border-radius: 18px;
                border: 1px solid var(--border);
                background: var(--inset);
              }

              .inspector-section h3 {
                margin: 0 0 8px;
                font-size: 0.88rem;
                color: var(--text-strong);
              }

              .inspector-grid {
                display: grid;
                gap: 8px;
              }

              .inspector-line {
                display: flex;
                justify-content: space-between;
                gap: 12px;
                font-size: 0.84rem;
              }

              .muted {
                color: var(--text-muted);
              }

              @media (max-width: 1280px) {
                .masthead {
                  grid-template-columns: repeat(2, minmax(0, 1fr));
                }

                .layout {
                  grid-template-columns: 280px minmax(0, 1fr);
                }

                .inspector {
                  position: static;
                  grid-column: 1 / -1;
                }
              }

              @media (max-width: 980px) {
                .layout,
                .diagram-grid,
                .data-region {
                  grid-template-columns: 1fr;
                }

                .left-rail {
                  position: static;
                }

                .masthead {
                  grid-template-columns: 1fr;
                }
              }
            </style>
          </head>
          <body data-visual-mode="Access_Grant_Journey_Lab">
            <div class="shell">
              <header class="masthead" aria-label="Access grant overview">
                <div class="brand">
                  <div class="brand-mark" aria-hidden="true">
                    <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
                      <rect x="1" y="1" width="24" height="24" rx="8" fill="rgba(37,99,235,0.14)" stroke="rgba(37,99,235,0.24)" />
                      <path d="M8 18L11.8 8H14.1L18 18H15.7L14.9 15.7H11L10.2 18H8ZM11.8 13.6H14.1L13 10.3L11.8 13.6Z" fill="#2563EB" />
                      <path d="M18.2 8.4H20.2V18H18.2V8.4Z" fill="#7C3AED" />
                    </svg>
                  </div>
                  <div class="brand-copy">
                    <strong>Vecells Access Grant Journey Lab</strong>
                    <span>Access_Grant_Journey_Lab · premium internal verification studio for deterministic grant, redemption, and supersession law.</span>
                  </div>
                </div>
                <div class="metric">
                  <span class="metric-label">Active Grants</span>
                  <span class="metric-value" data-testid="metric-active-grants"></span>
                </div>
                <div class="metric">
                  <span class="metric-label">Redeemed Grants</span>
                  <span class="metric-value" data-testid="metric-redeemed-grants"></span>
                </div>
                <div class="metric">
                  <span class="metric-label">Superseded Grants</span>
                  <span class="metric-value" data-testid="metric-superseded-grants"></span>
                </div>
                <div class="metric">
                  <span class="metric-label">Replay Incidents</span>
                  <span class="metric-value" data-testid="metric-replay-incidents"></span>
                </div>
              </header>

              <main class="layout">
                <aside class="left-rail" aria-label="Grant filters">
                  <div class="filter-group">
                    <label for="family-filter">Grant Family</label>
                    <select id="family-filter" data-testid="family-filter"></select>
                  </div>
                  <div class="filter-group">
                    <label for="redemption-state-filter">Redemption State</label>
                    <select id="redemption-state-filter" data-testid="redemption-state-filter"></select>
                  </div>
                  <div class="filter-group">
                    <label for="subject-binding-filter">Subject Binding</label>
                    <select id="subject-binding-filter" data-testid="subject-binding-filter"></select>
                  </div>
                  <div class="filter-group">
                    <label for="route-family-filter">Route Family</label>
                    <select id="route-family-filter" data-testid="route-family-filter"></select>
                  </div>
                  <div class="rail-parity" data-testid="filter-parity"></div>
                </aside>

                <div class="central-stack">
                  <section class="diagram-grid">
                    <section class="panel diagram-card" aria-labelledby="family-ladder-title">
                      <div class="panel-header">
                        <div>
                          <h2 id="family-ladder-title">Grant-Family Ladder</h2>
                          <p>Registry parity against the selected case and current visible filter set.</p>
                        </div>
                      </div>
                      <div class="family-ladder" data-testid="family-ladder"></div>
                      <div class="parity" data-testid="family-ladder-parity"></div>
                    </section>

                    <section class="panel diagram-card" aria-labelledby="transition-map-title">
                      <div class="panel-header">
                        <div>
                          <h2 id="transition-map-title">Redemption-To-Session Map</h2>
                          <p>Every visible case resolves through deterministic settlement before session or route re-entry.</p>
                        </div>
                      </div>
                      <div class="transition-map" data-testid="transition-map"></div>
                      <div class="parity" data-testid="transition-map-parity"></div>
                    </section>

                    <section class="panel diagram-card" aria-labelledby="supersession-ribbon-title">
                      <div class="panel-header">
                        <div>
                          <h2 id="supersession-ribbon-title">Supersession Ribbon</h2>
                          <p>Promotion, reissue, repair, logout, and route-drift chains remain explicit and append-only.</p>
                        </div>
                      </div>
                      <div class="supersession-ribbon" data-testid="supersession-ribbon"></div>
                      <div class="parity" data-testid="supersession-ribbon-parity"></div>
                    </section>
                  </section>

                  <section class="data-region">
                    <section class="panel" aria-labelledby="issuance-table-title">
                      <div class="panel-header">
                        <div>
                          <h3 id="issuance-table-title">Issuance Table</h3>
                          <p>One authoritative row per scenario, including non-grant outcomes.</p>
                        </div>
                      </div>
                      <div class="parity" style="padding: 0 20px 8px;" data-testid="issuance-table-parity"></div>
                      <div style="padding: 0 12px 16px;">
                        <table data-testid="issuance-table">
                          <thead>
                            <tr>
                              <th>Scenario</th>
                              <th>Family</th>
                              <th>Route</th>
                              <th>Outcome</th>
                            </tr>
                          </thead>
                          <tbody data-testid="issuance-table-body"></tbody>
                        </table>
                      </div>
                    </section>

                    <section class="panel" aria-labelledby="redemption-table-title">
                      <div class="panel-header">
                        <div>
                          <h3 id="redemption-table-title">Redemption / Supersession Table</h3>
                          <p>Selected-case settlement, replay, and supersession records.</p>
                        </div>
                      </div>
                      <div class="parity" style="padding: 0 20px 8px;" data-testid="redemption-table-parity"></div>
                      <div style="padding: 0 12px 16px;">
                        <table data-testid="redemption-table">
                          <thead>
                            <tr>
                              <th>Event</th>
                              <th>Status</th>
                              <th>Recorded</th>
                              <th>Detail</th>
                            </tr>
                          </thead>
                          <tbody data-testid="redemption-table-body"></tbody>
                        </table>
                      </div>
                    </section>
                  </section>
                </div>

                <aside class="panel inspector" data-testid="inspector" aria-label="Selected grant inspector"></aside>
              </main>
            </div>

            <script>
              const MANIFEST = __MANIFEST__;
              const CASEBOOK = __CASEBOOK__;
              const MATRIX = __MATRIX__;

              const state = {
                familyFilter: "all",
                redemptionFilter: "all",
                subjectFilter: "all",
                routeFilter: "all",
                selectedScenarioId: CASEBOOK.cases[0]?.scenarioId ?? null,
              };

              const elements = {
                familyFilter: document.querySelector("[data-testid='family-filter']"),
                redemptionFilter: document.querySelector("[data-testid='redemption-state-filter']"),
                subjectFilter: document.querySelector("[data-testid='subject-binding-filter']"),
                routeFilter: document.querySelector("[data-testid='route-family-filter']"),
                filterParity: document.querySelector("[data-testid='filter-parity']"),
                familyLadder: document.querySelector("[data-testid='family-ladder']"),
                familyLadderParity: document.querySelector("[data-testid='family-ladder-parity']"),
                transitionMap: document.querySelector("[data-testid='transition-map']"),
                transitionMapParity: document.querySelector("[data-testid='transition-map-parity']"),
                supersessionRibbon: document.querySelector("[data-testid='supersession-ribbon']"),
                supersessionRibbonParity: document.querySelector("[data-testid='supersession-ribbon-parity']"),
                issuanceBody: document.querySelector("[data-testid='issuance-table-body']"),
                issuanceParity: document.querySelector("[data-testid='issuance-table-parity']"),
                redemptionBody: document.querySelector("[data-testid='redemption-table-body']"),
                redemptionParity: document.querySelector("[data-testid='redemption-table-parity']"),
                inspector: document.querySelector("[data-testid='inspector']"),
                activeMetric: document.querySelector("[data-testid='metric-active-grants']"),
                redeemedMetric: document.querySelector("[data-testid='metric-redeemed-grants']"),
                supersededMetric: document.querySelector("[data-testid='metric-superseded-grants']"),
                replayMetric: document.querySelector("[data-testid='metric-replay-incidents']"),
              };

              function uniqueOptions(values) {
                return ["all", ...Array.from(new Set(values.filter(Boolean))).sort()];
              }

              function formatLabel(value) {
                if (!value || value === "all") {
                  return "All";
                }
                return value.replaceAll("_", " ");
              }

              function buildSelect(select, values, selectedValue) {
                select.innerHTML = values
                  .map((value) => `<option value="${value}">${formatLabel(value)}</option>`)
                  .join("");
                select.value = selectedValue;
              }

              function visibleCases() {
                return CASEBOOK.cases.filter((entry) => {
                  if (state.familyFilter !== "all" && (entry.grantFamily ?? "no_grant") !== state.familyFilter) {
                    return false;
                  }
                  if (state.redemptionFilter !== "all" && entry.redemptionState !== state.redemptionFilter) {
                    return false;
                  }
                  if (state.subjectFilter !== "all" && entry.subjectBindingState !== state.subjectFilter) {
                    return false;
                  }
                  if (state.routeFilter !== "all" && entry.routeFamilyRef !== state.routeFilter) {
                    return false;
                  }
                  return true;
                });
              }

              function selectedCase(entries) {
                const matched = entries.find((entry) => entry.scenarioId === state.selectedScenarioId);
                if (matched) {
                  return matched;
                }
                const fallback = entries[0] ?? CASEBOOK.cases[0] ?? null;
                state.selectedScenarioId = fallback?.scenarioId ?? null;
                return fallback;
              }

              function badgeClass(status) {
                if (["redeemed", "auth_bridge_opened", "replay_returned"].includes(status)) {
                  return "redeem";
                }
                if (["replaced", "rotated", "secure_link_reissue", "rotation"].includes(status)) {
                  return "supersede";
                }
                if (["blocked_drift", "revoked", "manual_only"].includes(status)) {
                  return "blocked";
                }
                if (["recover_only", "warning"].includes(status)) {
                  return "warning";
                }
                return "issue";
              }

              function renderMetrics() {
                elements.activeMetric.textContent = String(CASEBOOK.summary.live_grant_count);
                elements.redeemedMetric.textContent = String(CASEBOOK.summary.redeemed_settlement_count);
                elements.supersededMetric.textContent = String(CASEBOOK.summary.supersession_case_count);
                elements.replayMetric.textContent = String(CASEBOOK.summary.replay_block_count);
              }

              function renderFilters(entries) {
                buildSelect(
                  elements.familyFilter,
                  uniqueOptions(CASEBOOK.cases.map((entry) => entry.grantFamily ?? "no_grant")),
                  state.familyFilter,
                );
                buildSelect(
                  elements.redemptionFilter,
                  uniqueOptions(CASEBOOK.cases.map((entry) => entry.redemptionState)),
                  state.redemptionFilter,
                );
                buildSelect(
                  elements.subjectFilter,
                  uniqueOptions(CASEBOOK.cases.map((entry) => entry.subjectBindingState)),
                  state.subjectFilter,
                );
                buildSelect(
                  elements.routeFilter,
                  uniqueOptions(CASEBOOK.cases.map((entry) => entry.routeFamilyRef)),
                  state.routeFilter,
                );
                elements.filterParity.textContent = `${entries.length} visible scenarios across ${MANIFEST.summary.grant_family_count} frozen grant families and ${MANIFEST.summary.runtime_tuple_count} runtime tuples.`;
              }

              function renderFamilyLadder(entries, currentCase) {
                const counts = new Map();
                entries.forEach((entry) => {
                  const key = entry.grantFamily ?? "no_grant";
                  counts.set(key, (counts.get(key) ?? 0) + 1);
                });
                elements.familyLadder.innerHTML = MANIFEST.grant_families
                  .map((family) => {
                    const isSelected = currentCase?.grantFamily === family.grantFamily;
                    return `
                      <button
                        type="button"
                        class="family-chip"
                        data-testid="family-ladder-node-${family.grantFamily}"
                        data-family="${family.grantFamily}"
                        data-selected="${String(isSelected)}"
                      >
                        <span>
                          <strong>${family.grantFamily}</strong><br />
                          <span class="muted">${family.replayPolicy} / ${family.sessionCeiling}</span>
                        </span>
                        <span class="badge ${badgeClass(isSelected ? "redeemed" : "issue")}">${counts.get(family.grantFamily) ?? 0}</span>
                      </button>
                    `;
                  })
                  .join("");
                elements.familyLadderParity.textContent = `${entries.length} visible scenarios currently map to ${Array.from(counts.keys()).length} families.`;
                elements.familyLadder.querySelectorAll("button[data-family]").forEach((button) => {
                  button.addEventListener("click", () => {
                    state.familyFilter = button.dataset.family ?? "all";
                    render();
                  });
                });
              }

              function renderTransitionMap(currentCase) {
                elements.transitionMap.dataset.selectedCase = currentCase?.scenarioId ?? "";
                elements.transitionMap.innerHTML = (currentCase?.transitionSteps ?? [])
                  .map(
                    (step, index) => `
                      <div class="transition-step" data-testid="transition-step-${index + 1}">
                        <div class="transition-index">${index + 1}</div>
                        <div><strong>${step}</strong><br /><span class="muted">${currentCase?.scenarioId ?? ""}</span></div>
                      </div>
                    `,
                  )
                  .join("");
                elements.transitionMapParity.textContent = currentCase
                  ? `${currentCase.transitionSteps.length} transition steps frozen for ${currentCase.scenarioId}.`
                  : "No case selected.";
              }

              function renderSupersessionRibbon(currentCase) {
                elements.supersessionRibbon.dataset.selectedCase = currentCase?.scenarioId ?? "";
                const chain = currentCase?.supersessionChain ?? [];
                elements.supersessionRibbon.innerHTML = chain.length
                  ? chain
                      .map(
                        (entry) => `
                          <div class="ribbon-chip" data-testid="supersession-chip-${entry.supersessionId}">
                            <strong>${entry.causeClass}</strong><br />
                            <span class="muted">${entry.recordedAt}</span><br />
                            <span>${entry.replacementGrantRef ?? "no replacement grant"}</span>
                          </div>
                        `,
                      )
                      .join("")
                  : `
                      <div class="ribbon-chip" data-empty="true" data-testid="supersession-chip-empty">
                        <strong>No supersession chain</strong><br />
                        <span class="muted">This case currently resolves without replacement or revocation.</span>
                      </div>
                    `;
                elements.supersessionRibbonParity.textContent = `${chain.length} supersession records visible for the selected case.`;
              }

              function moveSelection(entries, currentId, direction) {
                const currentIndex = entries.findIndex((entry) => entry.scenarioId === currentId);
                if (currentIndex === -1) {
                  return;
                }
                const nextIndex = Math.min(entries.length - 1, Math.max(0, currentIndex + direction));
                const next = entries[nextIndex];
                if (!next) {
                  return;
                }
                state.selectedScenarioId = next.scenarioId;
                render();
                const nextRow = document.querySelector(`[data-testid="issuance-row-${next.scenarioId}"]`);
                nextRow?.focus();
              }

              function renderIssuanceTable(entries, currentCase) {
                elements.issuanceBody.innerHTML = entries
                  .map(
                    (entry) => `
                      <tr
                        tabindex="0"
                        class="issuance-row"
                        data-testid="issuance-row-${entry.scenarioId}"
                        data-selected="${String(entry.scenarioId === currentCase?.scenarioId)}"
                      >
                        <td><strong>${entry.title}</strong><br /><span class="muted">${entry.scenarioId}</span></td>
                        <td>${entry.grantFamily ?? "no_grant"}</td>
                        <td>${entry.routeFamilyRef}</td>
                        <td><span class="badge ${badgeClass(entry.redemptionState)}">${entry.outcome}</span></td>
                      </tr>
                    `,
                  )
                  .join("");
                elements.issuanceParity.textContent = `${entries.length} visible issuance rows from ${CASEBOOK.summary.scenario_count} total scenarios.`;
                elements.issuanceBody.querySelectorAll(".issuance-row").forEach((row) => {
                  row.addEventListener("click", () => {
                    state.selectedScenarioId = row.dataset.testid.replace("issuance-row-", "");
                    render();
                  });
                  row.addEventListener("keydown", (event) => {
                    const id = row.dataset.testid.replace("issuance-row-", "");
                    if (event.key === "ArrowDown") {
                      event.preventDefault();
                      moveSelection(entries, id, 1);
                    }
                    if (event.key === "ArrowUp") {
                      event.preventDefault();
                      moveSelection(entries, id, -1);
                    }
                  });
                });
              }

              function renderRedemptionTable(currentCase) {
                const events = currentCase?.events ?? [];
                elements.redemptionBody.innerHTML = events
                  .map(
                    (event, index) => `
                      <tr
                        tabindex="0"
                        class="redemption-row"
                        data-testid="redemption-row-${event.eventId}"
                        data-selected="${String(index === 0)}"
                      >
                        <td>${event.eventKind}</td>
                        <td><span class="badge ${badgeClass(event.status)}">${event.status}</span></td>
                        <td class="mono">${event.recordedAt}</td>
                        <td>${event.detail}</td>
                      </tr>
                    `,
                  )
                  .join("");
                elements.redemptionParity.textContent = `${events.length} settlement rows visible for ${currentCase?.scenarioId ?? "no selection"}.`;
              }

              function renderInspector(currentCase) {
                if (!currentCase) {
                  elements.inspector.innerHTML = "<div class='inspector-stack'><div class='inspector-section'><h3>No selection</h3></div></div>";
                  return;
                }
                elements.inspector.innerHTML = `
                  <div class="inspector-stack">
                    <section class="inspector-section" tabindex="0">
                      <h3>Selected Grant</h3>
                      <div class="inspector-grid">
                        <div class="inspector-line"><span class="muted">Scenario</span><span>${currentCase.scenarioId}</span></div>
                        <div class="inspector-line"><span class="muted">Grant ID</span><span class="mono">${currentCase.grantId ?? "no_grant"}</span></div>
                        <div class="inspector-line"><span class="muted">Family</span><span>${currentCase.grantFamily ?? "no_grant"}</span></div>
                        <div class="inspector-line"><span class="muted">Outcome</span><span>${currentCase.outcome}</span></div>
                        <div class="inspector-line"><span class="muted">Route</span><span>${currentCase.routeFamilyRef}</span></div>
                      </div>
                    </section>
                    <section class="inspector-section" tabindex="0">
                      <h3>Scope Envelope</h3>
                      <div class="inspector-grid">
                        <div class="inspector-line"><span class="muted">Envelope</span><span class="mono">${currentCase.scopeEnvelopeId ?? "none"}</span></div>
                        <div class="inspector-line"><span class="muted">Action Scope</span><span>${currentCase.actionScope ?? "none"}</span></div>
                        <div class="inspector-line"><span class="muted">Tuple Hash</span><span class="mono">${currentCase.tupleHash}</span></div>
                        <div class="inspector-line"><span class="muted">Route Intent</span><span>${currentCase.routeIntentState}</span></div>
                        <div class="inspector-line"><span class="muted">Key Version</span><span class="mono">${currentCase.keyVersionRef ?? "none"}</span></div>
                      </div>
                    </section>
                    <section class="inspector-section" tabindex="0">
                      <h3>Last Redemption</h3>
                      <div class="inspector-grid">
                        <div class="inspector-line"><span class="muted">Redemption</span><span class="mono">${currentCase.redemptionId ?? "none"}</span></div>
                        <div class="inspector-line"><span class="muted">Settlement</span><span>${currentCase.redemptionState}</span></div>
                        <div class="inspector-line"><span class="muted">Session Before</span><span>${currentCase.sessionPostureBefore}</span></div>
                        <div class="inspector-line"><span class="muted">Session After</span><span>${currentCase.sessionPostureAfter}</span></div>
                        <div class="inspector-line"><span class="muted">Token Digest</span><span class="mono">${currentCase.tokenDigest}</span></div>
                      </div>
                    </section>
                    <section class="inspector-section" tabindex="0">
                      <h3>Supersession Chain</h3>
                      <div class="inspector-grid">
                        <div class="muted">${currentCase.supersessionChain.length ? `${currentCase.supersessionChain.length} records` : "No supersession records"}</div>
                        <div>${currentCase.notes}</div>
                      </div>
                    </section>
                  </div>
                `;
              }

              function render() {
                const entries = visibleCases();
                renderMetrics();
                renderFilters(entries);
                const currentCase = selectedCase(entries);
                renderFamilyLadder(entries, currentCase);
                renderTransitionMap(currentCase);
                renderSupersessionRibbon(currentCase);
                renderIssuanceTable(entries, currentCase);
                renderRedemptionTable(currentCase);
                renderInspector(currentCase);
              }

              function boot() {
                document.body.dataset.reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "true" : "false";
                elements.familyFilter.addEventListener("change", (event) => {
                  state.familyFilter = event.target.value;
                  render();
                });
                elements.redemptionFilter.addEventListener("change", (event) => {
                  state.redemptionFilter = event.target.value;
                  render();
                });
                elements.subjectFilter.addEventListener("change", (event) => {
                  state.subjectFilter = event.target.value;
                  render();
                });
                elements.routeFilter.addEventListener("change", (event) => {
                  state.routeFilter = event.target.value;
                  render();
                });
                render();
              }

              boot();
            </script>
          </body>
        </html>
        """
    ).strip()
    return (
        template.replace("__MANIFEST__", json.dumps(manifest))
        .replace("__CASEBOOK__", json.dumps(casebook))
        .replace("__MATRIX__", json.dumps(matrix_rows))
    )


def build_spec() -> str:
    return dedent(
        """
        import fs from "node:fs";
        import http from "node:http";
        import path from "node:path";
        import { fileURLToPath } from "node:url";

        const __filename = fileURLToPath(import.meta.url);
        const __dirname = path.dirname(__filename);
        const ROOT = path.resolve(__dirname, "..", "..");
        const HTML_PATH = path.join(ROOT, "docs", "architecture", "78_access_grant_journey_lab.html");
        const CASEBOOK_PATH = path.join(ROOT, "data", "analysis", "access_grant_casebook.json");
        const MANIFEST_PATH = path.join(
          ROOT,
          "data",
          "analysis",
          "access_grant_runtime_tuple_manifest.json",
        );
        const MATRIX_PATH = path.join(ROOT, "data", "analysis", "access_grant_family_matrix.csv");

        const CASEBOOK = JSON.parse(fs.readFileSync(CASEBOOK_PATH, "utf8"));
        const MANIFEST = JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf8"));
        const MATRIX_ROWS = fs.readFileSync(MATRIX_PATH, "utf8").trim().split(/\\r?\\n/).slice(1);

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
                rawUrl === "/" ? "/docs/architecture/78_access_grant_journey_lab.html" : rawUrl.split("?")[0];
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
            server.listen(4378, "127.0.0.1", () => resolve(server));
          });
        }

        async function run() {
          assertCondition(fs.existsSync(HTML_PATH), `Missing journey lab HTML: ${HTML_PATH}`);
          const { chromium } = await importPlaywright();
          const server = await startStaticServer();
          const browser = await chromium.launch({ headless: true });
          const page = await browser.newPage({ viewport: { width: 1480, height: 1120 } });
          const url =
            process.env.ACCESS_GRANT_JOURNEY_LAB_URL ??
            "http://127.0.0.1:4378/docs/architecture/78_access_grant_journey_lab.html";

          try {
            await page.goto(url, { waitUntil: "networkidle" });
            await page.locator("[data-testid='family-filter']").waitFor();
            await page.locator("[data-testid='redemption-state-filter']").waitFor();
            await page.locator("[data-testid='subject-binding-filter']").waitFor();
            await page.locator("[data-testid='route-family-filter']").waitFor();
            await page.locator("[data-testid='family-ladder']").waitFor();
            await page.locator("[data-testid='transition-map']").waitFor();
            await page.locator("[data-testid='supersession-ribbon']").waitFor();
            await page.locator("[data-testid='issuance-table']").waitFor();
            await page.locator("[data-testid='redemption-table']").waitFor();
            await page.locator("[data-testid='inspector']").waitFor();

            const allIssuanceRows = await page.locator("tr[data-testid^='issuance-row-']").count();
            assertCondition(
              allIssuanceRows === CASEBOOK.summary.scenario_count,
              `Expected ${CASEBOOK.summary.scenario_count} issuance rows, found ${allIssuanceRows}.`,
            );

            await page.locator("[data-testid='family-filter']").selectOption("transaction_action_minimal");
            const transactionRows = await page.locator("tr[data-testid^='issuance-row-']").count();
            assertCondition(transactionRows === 6, `Expected 6 transaction rows, found ${transactionRows}.`);

            await page.locator("[data-testid='family-filter']").selectOption("all");
            await page.locator("[data-testid='redemption-state-filter']").selectOption("replaced");
            const replacedRows = await page.locator("tr[data-testid^='issuance-row-']").count();
            assertCondition(replacedRows === 3, `Expected 3 replaced rows, found ${replacedRows}.`);

            await page.locator("[data-testid='redemption-state-filter']").selectOption("all");
            await page.locator("[data-testid='subject-binding-filter']").selectOption("hard_subject");
            const hardSubjectRows = await page.locator("tr[data-testid^='issuance-row-']").count();
            assertCondition(hardSubjectRows === 8, `Expected 8 hard-subject rows, found ${hardSubjectRows}.`);

            await page.locator("[data-testid='subject-binding-filter']").selectOption("all");
            await page.locator("[data-testid='route-family-filter']").selectOption("rf_patient_secure_link_recovery");
            const recoveryRouteRows = await page.locator("tr[data-testid^='issuance-row-']").count();
            assertCondition(recoveryRouteRows === 6, `Expected 6 secure-recovery rows, found ${recoveryRouteRows}.`);

            await page.locator("[data-testid='route-family-filter']").selectOption("all");
            await page
              .locator("[data-testid='issuance-row-support_reissue_recovery']")
              .evaluate((node) => node.click());
            const inspectorText = await page.locator("[data-testid='inspector']").innerText();
            assertCondition(
              inspectorText.includes("support_reissue_recovery") &&
                inspectorText.includes("AG_078_SUPPORT_REISSUE_RECOVERY"),
              "Inspector lost selection synchronization for the support reissue case.",
            );
            const ladderSelected = await page
              .locator("[data-testid='family-ladder-node-support_recovery_minimal']")
              .getAttribute("data-selected");
            assertCondition(
              ladderSelected === "true",
              "Family ladder did not synchronize to the selected support-recovery case.",
            );
            const transitionSelected = await page
              .locator("[data-testid='transition-map']")
              .getAttribute("data-selected-case");
            assertCondition(
              transitionSelected === "support_reissue_recovery",
              "Transition map did not synchronize to the selected case.",
            );
            const ribbonSelected = await page
              .locator("[data-testid='supersession-ribbon']")
              .getAttribute("data-selected-case");
            assertCondition(
              ribbonSelected === "support_reissue_recovery",
              "Supersession ribbon did not synchronize to the selected case.",
            );
            const supersessionChipCount = await page
              .locator("[data-testid^='supersession-chip-']")
              .count();
            assertCondition(supersessionChipCount === 1, "Expected one supersession chip for support reissue.");

            const issuanceParity = await page
              .locator("[data-testid='issuance-table-parity']")
              .textContent();
            assertCondition(
              issuanceParity.includes(`${CASEBOOK.summary.scenario_count} total scenarios`),
              "Issuance parity text drifted.",
            );
            const redemptionRows = await page.locator("tr[data-testid^='redemption-row-']").count();
            assertCondition(redemptionRows >= 2, "Expected multiple settlement rows for the selected case.");

            await page.locator("[data-testid='family-filter']").focus();
            await page.keyboard.press("Tab");
            const focusedTestId = await page.evaluate(() => document.activeElement?.dataset?.testid ?? "");
            assertCondition(
              focusedTestId === "redemption-state-filter",
              `Expected focus to advance to redemption-state-filter, found ${focusedTestId}.`,
            );

            await page.locator("[data-testid='route-family-filter']").selectOption("rf_patient_secure_link_recovery");
            await page.locator("[data-testid='issuance-row-request_claim_auth_uplift']").focus();
            await page.keyboard.press("ArrowDown");
            const nextSelected = await page
              .locator("[data-testid='issuance-row-secure_continuation_verified_resume']")
              .getAttribute("data-selected");
            assertCondition(
              nextSelected === "true",
              "ArrowDown did not advance the visible issuance selection.",
            );
            await page.locator("[data-testid='route-family-filter']").selectOption("all");

            assertCondition(MATRIX_ROWS.length === 11, "Matrix row count drifted from the frozen use-case registry.");

            await page.setViewportSize({ width: 1024, height: 900 });
            const tabletInspector = await page.locator("[data-testid='inspector']").isVisible();
            assertCondition(tabletInspector, "Inspector disappeared at tablet width.");

            const motionPage = await browser.newPage({ viewport: { width: 1280, height: 900 } });
            try {
              await motionPage.emulateMedia({ reducedMotion: "reduce" });
              await motionPage.goto(url, { waitUntil: "networkidle" });
              const reducedMotion = await motionPage.locator("body").getAttribute("data-reduced-motion");
              assertCondition(reducedMotion === "true", "Reduced-motion posture did not activate.");
            } finally {
              await motionPage.close();
            }

            await page.setViewportSize({ width: 390, height: 844 });
            const mobileInspector = await page.locator("[data-testid='inspector']").isVisible();
            assertCondition(mobileInspector, "Inspector disappeared on mobile width.");

            const landmarks = await page.locator("header, main, aside, section").count();
            assertCondition(landmarks >= 8, `Expected multiple landmarks, found ${landmarks}.`);
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

        export const accessGrantJourneyLabManifest = {
          task: MANIFEST.task_id,
          scenarios: CASEBOOK.summary.scenario_count,
          runtimeTuples: MANIFEST.summary.runtime_tuple_count,
          coverage: [
            "issuance, redemption, and supersession filters",
            "selection synchronization",
            "keyboard navigation and focus order",
            "reduced motion",
            "responsive layout",
            "accessibility smoke checks",
          ],
        };
        """
    ).strip()


def patch_root_package() -> None:
    package = read_json(ROOT_PACKAGE_PATH)
    package.setdefault("scripts", {}).update(ROOT_SCRIPT_UPDATES)
    write_json(ROOT_PACKAGE_PATH, package)


def patch_playwright_package() -> None:
    package = read_json(PLAYWRIGHT_PACKAGE_PATH)
    scripts = package.setdefault("scripts", {})
    scripts["build"] = append_script_step(
        scripts["build"], "node --check access-grant-journey-lab.spec.js"
    )
    if "eslint access-grant-journey-lab.spec.js" not in scripts["lint"]:
        scripts["lint"] = scripts["lint"] + " && eslint access-grant-journey-lab.spec.js"
    scripts["test"] = append_script_step(scripts["test"], "node access-grant-journey-lab.spec.js")
    scripts["typecheck"] = append_script_step(
        scripts["typecheck"], "node --check access-grant-journey-lab.spec.js"
    )
    scripts["e2e"] = append_script_step(
        scripts["e2e"], "node access-grant-journey-lab.spec.js --run"
    )
    description = package.get("description", "")
    if "access-grant journey" not in description:
        package["description"] = (
            description.rstrip(".") + ", access-grant journey lab browser checks."
        ).strip(", ")
    write_json(PLAYWRIGHT_PACKAGE_PATH, package)


def main() -> None:
    matrix_rows = build_matrix_rows()
    cases = build_cases()
    casebook = build_casebook(cases)
    runtime_tuples = build_runtime_tuples(cases)
    manifest = build_manifest(runtime_tuples, cases)

    write_csv(
        MATRIX_PATH,
        matrix_rows,
        [
            "use_case",
            "grant_family",
            "validator_family",
            "replay_policy",
            "route_family_ref",
            "default_action_scope",
            "lineage_scope",
            "subject_binding_mode",
            "session_requirement",
            "issuance_outcome",
            "default_expiry_minutes",
            "transport_class",
            "supersession_triggers",
            "rationale",
        ],
    )
    write_json(CASEBOOK_PATH, casebook)
    write_json(MANIFEST_PATH, manifest)
    write_text(DESIGN_DOC_PATH, build_design_doc(manifest, casebook))
    write_text(RULES_DOC_PATH, build_rules_doc(matrix_rows))
    write_text(LAB_PATH, build_studio_html(manifest, casebook, matrix_rows))
    write_text(SPEC_PATH, build_spec())

    patch_root_package()
    patch_playwright_package()


if __name__ == "__main__":
    main()
