#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
from datetime import datetime, timezone
from html import escape
from pathlib import Path
from textwrap import dedent
from typing import Any


ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = ROOT / "data" / "analysis"
DOCS_DIR = ROOT / "docs" / "external"
SERVICES_DIR = ROOT / "services" / "adapter-simulators" / "manifests"

TASK_ID = "seq_038"
VISUAL_MODE = "Simulator_Foundry_Board"
CAPTURED_ON = "2026-04-11"
MISSION = (
    "Create the authoritative simulator backlog and replacement strategy for every "
    "unavailable, manual, delayed, or gated external integration seam so product and "
    "platform work can proceed without flattening proof, ambiguity, degraded, or manual "
    "fallback semantics."
)

REQUIRED_INPUTS = {
    "phase0_gate_verdict": DATA_DIR / "phase0_gate_verdict.json",
    "coverage_summary": DATA_DIR / "coverage_summary.json",
    "external_dependencies": DATA_DIR / "external_dependencies.json",
    "integration_priority_matrix": DATA_DIR / "integration_priority_matrix.json",
    "provider_family_scorecards": DATA_DIR / "provider_family_scorecards.json",
    "master_risk_register": DATA_DIR / "master_risk_register.json",
    "nhs_login_capture_pack": DATA_DIR / "nhs_login_capture_pack.json",
    "im1_pairing_pack": DATA_DIR / "im1_pairing_pack.json",
    "pds_access_pack": DATA_DIR / "pds_access_pack.json",
    "mesh_execution_pack": DATA_DIR / "mesh_execution_pack.json",
    "telephony_lab_pack": DATA_DIR / "32_telephony_lab_pack.json",
    "notification_studio_pack": DATA_DIR / "33_notification_studio_pack.json",
    "evidence_processing_lab_pack": DATA_DIR / "35_evidence_processing_lab_pack.json",
    "gp_provider_decision_register": DATA_DIR / "gp_provider_decision_register.json",
    "pharmacy_referral_transport_decision_register": DATA_DIR / "pharmacy_referral_transport_decision_register.json",
    "nhs_app_live_gate_checklist": DATA_DIR / "nhs_app_live_gate_checklist.json",
}

BACKLOG_CSV_PATH = DATA_DIR / "adapter_simulator_backlog.csv"
PRIORITY_SCORES_JSON_PATH = DATA_DIR / "adapter_simulator_priority_scores.json"
CONTRACT_MANIFEST_JSON_PATH = DATA_DIR / "adapter_simulator_contract_manifest.json"
REAL_PROVIDER_GAP_MAP_JSON_PATH = DATA_DIR / "adapter_real_provider_gap_map.json"

BACKLOG_DOC_PATH = DOCS_DIR / "38_local_adapter_simulator_backlog.md"
EXECUTION_ORDER_DOC_PATH = DOCS_DIR / "38_local_adapter_simulator_execution_order.md"
DELTA_REGISTER_DOC_PATH = DOCS_DIR / "38_real_provider_delta_register.md"
FIDELITY_POLICY_DOC_PATH = DOCS_DIR / "38_simulator_fidelity_policy.md"
BACKLOG_STUDIO_HTML_PATH = DOCS_DIR / "38_simulator_backlog_studio.html"
MANIFEST_README_PATH = SERVICES_DIR / "README.md"

SOURCE_PRECEDENCE = [
    "prompt/038.md",
    "prompt/shared_operating_contract_036_to_045.md",
    "prompt/AGENT.md",
    "prompt/checklist.md",
    "blueprint/blueprint-init.md",
    "blueprint/phase-0-the-foundation-protocol.md",
    "blueprint/phase-2-the-identity-and-echoes.md",
    "blueprint/phase-4-the-booking-engine.md",
    "blueprint/phase-5-the-network-horizon.md",
    "blueprint/phase-6-the-pharmacy-loop.md",
    "blueprint/phase-7-inside-the-nhs-app.md",
    "blueprint/platform-runtime-and-release-blueprint.md",
    "blueprint/forensic-audit-findings.md",
    "docs/external/21_integration_priority_and_execution_matrix.md",
    "docs/external/23_actual_partner_account_governance.md",
    "docs/external/32_local_telephony_lab_spec.md",
    "docs/external/33_local_notification_studio_spec.md",
    "docs/external/35_local_evidence_processing_lab_spec.md",
    "docs/external/36_gp_system_pathways_mock_strategy.md",
    "docs/external/36_gp_system_pathways_actual_strategy.md",
    "docs/external/37_pharmacy_access_paths_mock_strategy.md",
    "docs/external/37_pharmacy_access_paths_actual_strategy.md",
    "docs/external/29_nhs_app_sandpit_to_aos_progression_pack.md",
    "docs/external/30_real_registration_and_hosting_strategy.md",
]

ASSUMPTIONS = [
    {
        "assumption_id": "ASSUMPTION_SIMULATORS_STAY_CONTRACT_FIRST",
        "summary": (
            "Every simulator row remains an adapter contract twin first and a UI or sandbox "
            "aid second, because the blueprint keeps supplier-specific behavior behind explicit "
            "adapter boundaries."
        ),
        "consequence": (
            "The backlog ranks proof and ambiguity preservation ahead of cosmetic realism or "
            "console mimicry."
        ),
    },
    {
        "assumption_id": "ASSUMPTION_LOCAL_AND_PREVIEW_NEED_LONG_LIVED_TWINS",
        "summary": (
            "Even when a live provider arrives later, local and preview environments still need "
            "deterministic twins for drills, replay, accessibility verification, and CI."
        ),
        "consequence": (
            "Replacement mode is a runtime posture question, not a reason to delete the "
            "simulator contract."
        ),
    },
    {
        "assumption_id": "ASSUMPTION_MANUAL_FALLBACK_SEMANTICS_MUST_SURVIVE_SIMULATION",
        "summary": (
            "Urgent return, manual review, repair, and replay-safe fallback remain first-class "
            "behaviors in the simulator manifest rather than being deferred to later runbooks."
        ),
        "consequence": (
            "The backlog explicitly refuses optimistic success paths for dispatch, identity, "
            "notifications, booking, and pharmacy observation seams."
        ),
    },
]

FIDELITY_CLASSES = [
    {
        "fidelity_class": "shape_only",
        "title": "Shape only",
        "allowed_for": "Non-baseline placeholders or scaffold chrome only.",
        "must_preserve": "Schema names and route boundaries.",
        "must_not_omit": "Nothing beyond shape and naming.",
        "default_tests": ["schema"],
        "policy_note": "Not used for any current seq_038 backlog row.",
    },
    {
        "fidelity_class": "workflow_twin",
        "title": "Workflow twin",
        "allowed_for": "Seams where orchestration matters more than exact external proofs.",
        "must_preserve": "State progression, bounded fallback, and operator-visible blockers.",
        "must_not_omit": "Deferred, paused, repair-required, or environment-split states.",
        "default_tests": ["contract", "playwright", "projection"],
        "policy_note": "Good enough for optional or deferred lanes only when proof remains elsewhere.",
    },
    {
        "fidelity_class": "proof_twin",
        "title": "Proof twin",
        "allowed_for": "Identity, pharmacy, replay, and other truth-bearing seams.",
        "must_preserve": "Named proof objects, blocking facts, and non-authoritative signals.",
        "must_not_omit": "Claim-pending, weak-match, read-only, disputed, or manual-review semantics.",
        "default_tests": ["contract", "replay", "playwright"],
        "policy_note": "Default for seams where product calmness depends on evidence, not transport success.",
    },
    {
        "fidelity_class": "fault_injection_twin",
        "title": "Fault injection twin",
        "allowed_for": "Seams where delayed, missing, contradictory, or degraded signals are core law.",
        "must_preserve": "Proof plus deterministic failure, timeout, replay, and supersession behavior.",
        "must_not_omit": "Contradictory callbacks, missing artifacts, manual repair, or quarantine.",
        "default_tests": ["contract", "fault-injection", "replay", "playwright"],
        "policy_note": "Used where happy-path-only simulators would teach the product the wrong truth.",
    },
    {
        "fidelity_class": "near-live_contract_twin",
        "title": "Near-live contract twin",
        "allowed_for": "High-friction provider seams with stable live shapes but withheld onboarding.",
        "must_preserve": "External contract shape, proof thresholds, timing windows, and gate law.",
        "must_not_omit": "Acknowledgement/expiry split, provider capability drift, or environment separation.",
        "default_tests": ["contract", "migration", "playwright", "replay"],
        "policy_note": "The simulator contract should survive live onboarding with minimal field drift.",
    },
]

SCORING_MODEL = {
    "score_id": "adapter_simulator_priority_v1",
    "factors": [
        {
            "factor_id": "baseline_criticality",
            "title": "Baseline criticality",
            "weight": 12,
            "why": "How directly the seam blocks core product motion in the current roadmap.",
        },
        {
            "factor_id": "blocker_severity",
            "title": "Blocker severity",
            "weight": 10,
            "why": "How much roadmap truth remains blocked unless the simulator exists now.",
        },
        {
            "factor_id": "implementation_lead_time",
            "title": "Implementation lead time",
            "weight": 8,
            "why": "How early the seam must start because live onboarding or cross-team dependencies are slow.",
        },
        {
            "factor_id": "proof_sensitivity",
            "title": "Proof sensitivity",
            "weight": 11,
            "why": "How much patient, operational, or safety calmness depends on exact proof semantics.",
        },
    ],
    "priority_tiers": [
        {"tier": "critical", "minimum_score": 185},
        {"tier": "high", "minimum_score": 160},
        {"tier": "medium", "minimum_score": 140},
        {"tier": "watch", "minimum_score": 0},
    ],
}

PHASES = [
    {
        "phase_id": "phase_0_blocker_removal",
        "title": "Phase 0 blocker removal",
        "summary": "Freeze the simulator seams that unblock core proof-bearing product logic immediately.",
        "entry_rule": "Needed before later provider motion or product integration can stay coherent.",
    },
    {
        "phase_id": "phase_1_provider_truth",
        "title": "Phase 1 provider truth",
        "summary": "Add provider-specific booking and pharmacy realism without pretending live onboarding is complete.",
        "entry_rule": "Starts once the blocker-removal twins already publish stable contracts and proof ladders.",
    },
    {
        "phase_id": "phase_2_channel_evidence",
        "title": "Phase 2 channel evidence",
        "summary": "Expand into delivery, resend, transcript, and quarantine seams that support recovery and continuity.",
        "entry_rule": "Requires stable proof envelopes and shared replay vocabulary from earlier phases.",
    },
    {
        "phase_id": "phase_3_deferred_optional",
        "title": "Phase 3 deferred and optional",
        "summary": "Keep deferred or optional seams visible and rehearseable without turning them into baseline blockers.",
        "entry_rule": "Only after current-baseline contract twins are already stable and testable.",
    },
]

REPLACEMENT_MODES = [
    {
        "replacement_mode": "replace_with_live_guarded",
        "title": "Replace with live (guarded)",
        "meaning": "Runtime traffic moves to the live provider later, while the simulator remains only for CI/local parity.",
    },
    {
        "replacement_mode": "hybrid_contract_twin",
        "title": "Hybrid contract twin",
        "meaning": "The simulator remains a long-lived local/preview twin while live and mock environments coexist.",
    },
    {
        "replacement_mode": "permanent_fallback",
        "title": "Permanent fallback",
        "meaning": "The simulator or local twin remains a permanent recovery or optionality path even after live onboarding.",
    },
]

SIMULATOR_SPECS = [
    {
        "simulator_id": "sim_pharmacy_dispatch_transport_twin",
        "simulator_label": "Pharmacy dispatch transport twin",
        "family": "pharmacy",
        "execution_phase": "phase_0_blocker_removal",
        "dependency_ids": ["dep_pharmacy_referral_transport"],
        "baseline_scope": "baseline_required",
        "bounded_contexts": ["pharmacy_coordination", "patient_portal", "operations_console"],
        "route_families": ["pharmacy_referral_dispatch", "patient_receipt_status", "ops_exception_queue"],
        "current_blocker_removed": (
            "Removes the block on dispatch proof, acknowledgement, expiry, redispatch, and "
            "manual-urgent handoff rehearsal before any live transport route is selected."
        ),
        "minimum_fidelity_class": "near-live_contract_twin",
        "priority_factors": {
            "baseline_criticality": 5,
            "blocker_severity": 5,
            "implementation_lead_time": 5,
            "proof_sensitivity": 5,
        },
        "upstream_rank_hint": 1,
        "authoritative_proof_semantics": [
            "PharmacyDispatchEnvelope",
            "PharmacyDispatchAcknowledgement",
            "PharmacyDispatchExpiry",
            "ExternalConfirmationGate",
        ],
        "ambiguity_behaviors": [
            "accepted_not_confirmed",
            "delivery_timeout",
            "redispatch_required",
            "manual_urgent_return_required",
        ],
        "test_types": ["contract", "fault-injection", "playwright", "replay", "migration"],
        "replacement_mode": "hybrid_contract_twin",
        "permanent_fallback": False,
        "graduation_trigger": (
            "Freeze live transport profile, named mailbox or endpoint, dispatch proof thresholds, "
            "urgent-return ownership rehearsal, and mutation-gated environment evidence."
        ),
        "actual_provider_tasks": ["seq_028", "seq_037", "seq_039", "seq_040"],
        "live_gate_source": "pharmacy_referral_transport_decision_register",
        "live_gate_ids": [
            "LIVE_GATE_PHARMACY_MVP_APPROVED",
            "LIVE_GATE_PHARMACY_CONSENT_AND_DISPATCH_MODELS_IMPLEMENTED",
            "LIVE_GATE_PHARMACY_NAMED_APPROVER_AND_ENVIRONMENT",
            "LIVE_GATE_PHARMACY_MUTATION_FLAG_ENABLED",
            "LIVE_GATE_PHARMACY_WATCH_REGISTER_CLEAR",
            "LIVE_GATE_PHARMACY_URGENT_RETURN_OWNERSHIP_REHEARSED",
            "LIVE_GATE_PHASE0_EXTERNAL_FOUNDATION",
        ],
        "required_live_evidence": [
            "Named transport route profile and provider tuple",
            "Dispatch proof and acknowledgement thresholds signed off",
            "Manual urgent-return ownership rehearsal evidence",
        ],
        "unchanged_contract_elements": [
            "Dispatch proof never equals settled referral truth on acceptance alone",
            "Acknowledgement and expiry remain separate facts",
            "Manual urgent-return remains first-class even after live transport exists",
        ],
        "provider_specific_flex": [
            "Transport channel and receipt shape",
            "Mailbox or endpoint identifiers",
            "Provider-specific retry window values",
        ],
        "migration_tests": [
            "Dispatch acceptance-versus-confirmation parity",
            "Expiry and redispatch regression",
            "Urgent-return manual fallback preservation",
        ],
        "source_refs": [
            "blueprint/phase-6-the-pharmacy-loop.md#6D. Referral pack composer, dispatch adapters, and transport contract",
            "docs/external/37_pharmacy_access_paths_mock_strategy.md",
            "docs/external/28_mesh_message_route_and_proof_matrix.md",
        ],
    },
    {
        "simulator_id": "sim_nhs_login_auth_session_twin",
        "simulator_label": "NHS login auth and session twin",
        "family": "identity",
        "execution_phase": "phase_0_blocker_removal",
        "dependency_ids": ["dep_nhs_login_rail"],
        "baseline_scope": "baseline_required",
        "bounded_contexts": ["identity_access", "patient_portal", "support_recovery"],
        "route_families": ["browser_auth", "secure_link_resume", "support_assisted_recovery"],
        "current_blocker_removed": (
            "Removes the block on auth transaction, callback replay, claim-pending, auth_read_only, "
            "and writable-session handling before partner approval and real redirect inventory arrive."
        ),
        "minimum_fidelity_class": "proof_twin",
        "priority_factors": {
            "baseline_criticality": 5,
            "blocker_severity": 5,
            "implementation_lead_time": 4,
            "proof_sensitivity": 5,
        },
        "upstream_rank_hint": 2,
        "authoritative_proof_semantics": [
            "SessionEstablishmentDecision",
            "IdentityBinding",
            "RouteIntentBinding",
            "SessionContinuityFence",
        ],
        "ambiguity_behaviors": [
            "consent_declined",
            "insufficient_assurance",
            "callback_replay",
            "subject_mismatch",
            "auth_read_only",
        ],
        "test_types": ["contract", "playwright", "replay", "security", "accessibility"],
        "replacement_mode": "hybrid_contract_twin",
        "permanent_fallback": False,
        "graduation_trigger": (
            "Approve partner access, redirect and scope inventory, environment target, and mutation-gated "
            "callback parity evidence without weakening route-intent binding."
        ),
        "actual_provider_tasks": ["seq_024", "seq_025", "seq_039", "seq_040"],
        "live_gate_source": "nhs_login_capture_pack",
        "live_gate_ids": [
            "LIVE_GATE_EXTERNAL_FOUNDATION_WITHHELD",
            "LIVE_GATE_NHS_LOGIN_PARTNER_APPROVED",
            "LIVE_GATE_REDIRECT_URI_REVIEW",
            "LIVE_GATE_ENVIRONMENT_TARGET_MISSING",
            "LIVE_GATE_MUTATION_FLAG_DISABLED",
            "LIVE_GATE_TECHNICAL_CONFORMANCE_PENDING",
        ],
        "required_live_evidence": [
            "Partner approval and current redirect inventory",
            "Technical conformance evidence",
            "Environment-specific callback and session-parity rehearsal",
        ],
        "unchanged_contract_elements": [
            "Callback success alone never equals writable authority",
            "Claim-pending and auth-read-only remain separate post-auth states",
            "Route-intent binding remains mandatory for write access",
        ],
        "provider_specific_flex": [
            "Client identifiers and signing material",
            "Environment-scoped redirect URIs",
            "Official branding or consent-page chrome outside Vecells control",
        ],
        "migration_tests": [
            "Callback replay and nonce fence parity",
            "Consent decline and subject-mismatch recovery parity",
            "Writable-versus-read-only session establishment parity",
        ],
        "source_refs": [
            "blueprint/phase-2-the-identity-and-echoes.md#2B. NHS login bridge and local session engine",
            "data/analysis/nhs_login_capture_pack.json",
            "docs/external/24_nhs_login_actual_onboarding_strategy.md",
        ],
    },
    {
        "simulator_id": "sim_booking_provider_confirmation_twin",
        "simulator_label": "Booking provider confirmation twin",
        "family": "booking",
        "execution_phase": "phase_0_blocker_removal",
        "dependency_ids": ["dep_local_booking_supplier_adapters", "dep_origin_practice_ack_rail"],
        "baseline_scope": "baseline_required",
        "bounded_contexts": ["booking_orchestration", "staff_workspace", "operations_console"],
        "route_families": ["patient_booking_commit", "staff_assisted_booking", "practice_visibility"],
        "current_blocker_removed": (
            "Removes the block on ambiguous commit, practice acknowledgement debt, and same-shell "
            "confirmation truth before any live booking supplier or practice rail is admissible."
        ),
        "minimum_fidelity_class": "near-live_contract_twin",
        "priority_factors": {
            "baseline_criticality": 5,
            "blocker_severity": 5,
            "implementation_lead_time": 4,
            "proof_sensitivity": 5,
        },
        "upstream_rank_hint": 3,
        "authoritative_proof_semantics": [
            "ProviderCapabilitySnapshot",
            "ExternalConfirmationGate",
            "BookingConfirmationTruthProjection",
            "RequestLifecycleLease",
        ],
        "ambiguity_behaviors": [
            "accepted_not_confirmed",
            "same_commit_read_after_write_drift",
            "practice_ack_overdue",
            "callback_fallback_required",
        ],
        "test_types": ["contract", "replay", "projection", "playwright", "migration"],
        "replacement_mode": "hybrid_contract_twin",
        "permanent_fallback": False,
        "graduation_trigger": (
            "Freeze provider capability evidence, bounded MVP, sponsor posture, and practice acknowledgement "
            "law for the named environment."
        ),
        "actual_provider_tasks": ["seq_026", "seq_036", "seq_039", "seq_040"],
        "live_gate_source": "gp_provider_decision_register",
        "live_gate_ids": [
            "LIVE_GATE_ARCHITECTURE_AND_DATA_FLOW_CURRENT",
            "LIVE_GATE_CREDIBLE_BOOKING_MVP",
            "LIVE_GATE_SPONSOR_AND_COMMISSIONING_POSTURE",
            "LIVE_GATE_NAMED_APPROVER_AND_ENVIRONMENT",
            "LIVE_GATE_MUTATION_FLAG_ENABLED",
            "LIVE_GATE_WATCH_REGISTER_CLEAR",
            "LIVE_GATE_PHASE0_EXTERNAL_FOUNDATION",
        ],
        "required_live_evidence": [
            "Bounded booking MVP and architecture refresh",
            "Named sponsor plus commissioning posture",
            "Practice acknowledgement route evidence",
        ],
        "unchanged_contract_elements": [
            "Acceptance never outruns confirmation truth",
            "Practice acknowledgement remains separate from patient reassurance",
            "Manual callback fallback remains explicit when proof is incomplete",
        ],
        "provider_specific_flex": [
            "Supplier capability tuple and surface naming",
            "Commit timing windows",
            "Practice-facing receipt or acknowledgement details",
        ],
        "migration_tests": [
            "Ambiguous confirmation parity",
            "Practice acknowledgement overdue regression",
            "Commit-to-projection replay parity",
        ],
        "source_refs": [
            "blueprint/phase-4-the-booking-engine.md",
            "docs/external/36_gp_system_pathways_mock_strategy.md",
            "data/analysis/gp_provider_decision_register.json",
        ],
    },
    {
        "simulator_id": "sim_telephony_ivr_twin",
        "simulator_label": "Telephony and IVR twin",
        "family": "communications",
        "execution_phase": "phase_0_blocker_removal",
        "dependency_ids": ["dep_telephony_ivr_recording_provider"],
        "baseline_scope": "baseline_required",
        "bounded_contexts": ["telephony_ingest", "patient_portal", "evidence_pipeline"],
        "route_families": ["ivr_capture", "voice_callback", "sms_continuation"],
        "current_blocker_removed": (
            "Removes the block on IVR choreography, urgent-live preemption, recording evidence readiness, "
            "and continuation grant behavior before live numbers and webhooks exist."
        ),
        "minimum_fidelity_class": "fault_injection_twin",
        "priority_factors": {
            "baseline_criticality": 5,
            "blocker_severity": 5,
            "implementation_lead_time": 4,
            "proof_sensitivity": 5,
        },
        "upstream_rank_hint": 4,
        "authoritative_proof_semantics": [
            "CallSessionRecord",
            "RecordingAvailabilityObservation",
            "EvidenceReadinessAssessment",
            "SMSContinuationGrant",
        ],
        "ambiguity_behaviors": [
            "urgent_live_preemption",
            "recording_missing",
            "webhook_replay",
            "contradictory_callback",
        ],
        "test_types": ["contract", "fault-injection", "playwright", "replay", "accessibility"],
        "replacement_mode": "hybrid_contract_twin",
        "permanent_fallback": False,
        "graduation_trigger": (
            "Approve vendor, recording posture, spend authority, webhook security pack, and named environment "
            "for the selected number profile."
        ),
        "actual_provider_tasks": ["seq_031", "seq_032", "seq_039", "seq_040"],
        "live_gate_source": "telephony_lab_pack",
        "live_gate_ids": [
            "TEL_LIVE_GATE_PHASE0_EXTERNAL_READY",
            "TEL_LIVE_GATE_VENDOR_APPROVED",
            "TEL_LIVE_GATE_WEBHOOK_SECURITY_PACK",
            "TEL_LIVE_GATE_RECORDING_REVIEW_APPROVED",
            "TEL_LIVE_GATE_PROCUREMENT_AND_SPEND_AUTHORITY",
            "TEL_LIVE_GATE_NAMED_APPROVER",
            "TEL_LIVE_GATE_MUTATION_AND_SPEND_FLAGS",
        ],
        "required_live_evidence": [
            "Vendor approval and spend authority",
            "Webhook security and replay posture",
            "Recording policy approval plus named environment",
        ],
        "unchanged_contract_elements": [
            "Webhook success never equals clinically usable evidence by itself",
            "Urgent-live preemption outranks routine continuation",
            "Recording availability stays weaker than evidence readiness",
        ],
        "provider_specific_flex": [
            "Number inventory and vendor account identifiers",
            "Webhook signatures and callback payload shape",
            "Recording retrieval mechanics",
        ],
        "migration_tests": [
            "Urgent-live preemption parity",
            "Recording-missing recovery parity",
            "Webhook replay and signature-failure parity",
        ],
        "source_refs": [
            "blueprint/phase-2-the-identity-and-echoes.md#2E. Telephony call-session ingestion, evidence readiness, and convergence",
            "docs/external/32_local_telephony_lab_spec.md",
            "data/analysis/32_telephony_lab_pack.json",
        ],
    },
    {
        "simulator_id": "sim_pharmacy_visibility_update_record_twin",
        "simulator_label": "Pharmacy visibility and Update Record twin",
        "family": "pharmacy",
        "execution_phase": "phase_0_blocker_removal",
        "dependency_ids": ["dep_pharmacy_outcome_observation"],
        "baseline_scope": "baseline_required",
        "bounded_contexts": ["pharmacy_coordination", "operations_console", "patient_portal"],
        "route_families": ["pharmacy_visibility", "gp_visibility_recovery", "patient_status_continuity"],
        "current_blocker_removed": (
            "Removes the block on weak match, delayed outcome, practice-disabled visibility, and "
            "non-auto-close reconciliation behavior before any assured live combination exists."
        ),
        "minimum_fidelity_class": "proof_twin",
        "priority_factors": {
            "baseline_criticality": 5,
            "blocker_severity": 4,
            "implementation_lead_time": 4,
            "proof_sensitivity": 5,
        },
        "upstream_rank_hint": 5,
        "authoritative_proof_semantics": [
            "PharmacyOutcomeRecord",
            "PharmacyOutcomeMatchAssessment",
            "PharmacyOutcomeReconciliationGate",
            "UpdateRecordVisibilityObservation",
        ],
        "ambiguity_behaviors": [
            "weak_match",
            "delayed_outcome",
            "duplicate_outcome",
            "practice_disabled_update_record",
        ],
        "test_types": ["contract", "replay", "projection", "playwright"],
        "replacement_mode": "hybrid_contract_twin",
        "permanent_fallback": False,
        "graduation_trigger": (
            "Name the assured Update Record combination, publish the reconciliation runtime reference, "
            "and clear the visibility watch register."
        ),
        "actual_provider_tasks": ["seq_037", "seq_039", "seq_040"],
        "live_gate_source": "pharmacy_referral_transport_decision_register",
        "live_gate_ids": [
            "LIVE_GATE_PHARMACY_MVP_APPROVED",
            "LIVE_GATE_PHARMACY_CONSENT_AND_DISPATCH_MODELS_IMPLEMENTED",
            "LIVE_GATE_PHARMACY_NAMED_APPROVER_AND_ENVIRONMENT",
            "LIVE_GATE_PHARMACY_UPDATE_RECORD_COMBINATION_NAMED",
            "LIVE_GATE_PHARMACY_WATCH_REGISTER_CLEAR",
            "LIVE_GATE_PHASE0_EXTERNAL_FOUNDATION",
        ],
        "required_live_evidence": [
            "Assured supplier/system combination for Update Record",
            "Reconciliation runtime implementation reference",
            "Watch-register closure for visibility and manual fallback gaps",
        ],
        "unchanged_contract_elements": [
            "Update Record is visibility only, never urgent transport",
            "Weak or delayed outcomes never auto-close the request lineage",
            "Practice-disabled fallback remains explicit and same-shell",
        ],
        "provider_specific_flex": [
            "Transport wrapper and acknowledgement cadence",
            "Supplier-specific visibility field mapping",
            "Assured-combination registry values",
        ],
        "migration_tests": [
            "Weak-match and duplicate-outcome parity",
            "Practice-disabled fallback parity",
            "No-auto-close reconciliation regression",
        ],
        "source_refs": [
            "blueprint/phase-6-the-pharmacy-loop.md#6F. Outcome ingest, Update Record observation, and reconciliation",
            "docs/external/37_pharmacy_access_paths_actual_strategy.md",
            "data/analysis/pharmacy_referral_transport_decision_register.json",
        ],
    },
    {
        "simulator_id": "sim_mesh_message_path_twin",
        "simulator_label": "MESH message path twin",
        "family": "communications",
        "execution_phase": "phase_0_blocker_removal",
        "dependency_ids": ["dep_cross_org_secure_messaging_mesh"],
        "baseline_scope": "baseline_required",
        "bounded_contexts": ["communications", "pharmacy_coordination", "support_recovery"],
        "route_families": ["mesh_transport", "provider_notification", "secure_message_replay"],
        "current_blocker_removed": (
            "Removes the block on replay-safe secure messaging proof, delivery observation, "
            "and escalation behavior before mailbox ownership and live onboarding complete."
        ),
        "minimum_fidelity_class": "near-live_contract_twin",
        "priority_factors": {
            "baseline_criticality": 4,
            "blocker_severity": 5,
            "implementation_lead_time": 4,
            "proof_sensitivity": 5,
        },
        "upstream_rank_hint": 6,
        "authoritative_proof_semantics": [
            "MESHMessageEnvelope",
            "TransportReceipt",
            "ReplayFence",
            "DeliveryObservation",
        ],
        "ambiguity_behaviors": [
            "ack_missing",
            "duplicate_delivery",
            "delayed_receipt",
            "partial_acceptance",
        ],
        "test_types": ["contract", "replay", "fault-injection", "playwright"],
        "replacement_mode": "hybrid_contract_twin",
        "permanent_fallback": False,
        "graduation_trigger": (
            "Freeze mailbox ownership, manager mode, named approver, minimum-necessary review, and mutation "
            "gate posture for the targeted workflow set."
        ),
        "actual_provider_tasks": ["seq_028", "seq_039", "seq_040"],
        "live_gate_source": "mesh_execution_pack",
        "live_gate_ids": [
            "MESH_LIVE_GATE_PHASE0_EXTERNAL_READY",
            "MESH_LIVE_GATE_OWNER_ODS_KNOWN",
            "MESH_LIVE_GATE_MANAGER_MODE_DECIDED",
            "MESH_LIVE_GATE_API_ONBOARDING_COMPLETE",
            "MESH_LIVE_GATE_NAMED_APPROVER_PRESENT",
            "MESH_LIVE_GATE_MUTATION_AND_SPEND_ACK",
            "MESH_LIVE_GATE_FINAL_POSTURE",
        ],
        "required_live_evidence": [
            "Named ODS owner and manager mode",
            "API onboarding completion or approved live path",
            "Minimum-necessary review plus named approver",
        ],
        "unchanged_contract_elements": [
            "Transport receipt remains supporting evidence, not business truth",
            "Replay fences stay mandatory",
            "Escalation behavior remains explicit when mailbox or secure transport degrades",
        ],
        "provider_specific_flex": [
            "Mailbox identifiers and owner ODS values",
            "Route manager mode and queue wiring",
            "Exact callback or polling strategy",
        ],
        "migration_tests": [
            "Receipt ambiguity parity",
            "Replay and duplicate delivery regression",
            "Workflow-specific escalation parity",
        ],
        "source_refs": [
            "blueprint/phase-0-the-foundation-protocol.md#1.11 PharmacyDispatchEnvelope",
            "docs/external/28_mesh_message_route_and_proof_matrix.md",
            "data/analysis/mesh_execution_pack.json",
        ],
    },
    {
        "simulator_id": "sim_booking_capacity_feed_twin",
        "simulator_label": "Booking capacity feed twin",
        "family": "booking",
        "execution_phase": "phase_1_provider_truth",
        "dependency_ids": ["dep_network_capacity_partner_feeds"],
        "baseline_scope": "baseline_required",
        "bounded_contexts": ["booking_orchestration", "hub_operations", "patient_portal"],
        "route_families": ["hub_directory", "network_capacity", "callback_offer"],
        "current_blocker_removed": (
            "Removes the block on stale capacity, no-slot fallback, callback offer, and hub-review states "
            "before any real partner feed or acknowledgement cadence is current."
        ),
        "minimum_fidelity_class": "workflow_twin",
        "priority_factors": {
            "baseline_criticality": 5,
            "blocker_severity": 4,
            "implementation_lead_time": 4,
            "proof_sensitivity": 4,
        },
        "upstream_rank_hint": 7,
        "authoritative_proof_semantics": [
            "CapacitySnapshot",
            "ReservationWindowEvidence",
            "NoSlotFallbackDecision",
            "CallbackOfferEligibility",
        ],
        "ambiguity_behaviors": [
            "stale_capacity",
            "no_slot",
            "callback_required",
            "hub_review_pending",
        ],
        "test_types": ["contract", "projection", "fault-injection", "playwright"],
        "replacement_mode": "hybrid_contract_twin",
        "permanent_fallback": False,
        "graduation_trigger": (
            "Publish partner feed provenance, freshness policy, and callback fallback evidence for the "
            "bounded booking MVP."
        ),
        "actual_provider_tasks": ["seq_036", "seq_039", "seq_040"],
        "live_gate_source": "gp_provider_decision_register",
        "live_gate_ids": [
            "LIVE_GATE_ARCHITECTURE_AND_DATA_FLOW_CURRENT",
            "LIVE_GATE_CREDIBLE_BOOKING_MVP",
            "LIVE_GATE_SPONSOR_AND_COMMISSIONING_POSTURE",
            "LIVE_GATE_WATCH_REGISTER_CLEAR",
        ],
        "required_live_evidence": [
            "Named partner feed provenance",
            "Freshness and expiry policy",
            "Callback fallback ownership evidence",
        ],
        "unchanged_contract_elements": [
            "No-slot and callback-required remain explicit states",
            "Freshness proof stays visible to operators",
            "Capacity feed updates never erase confirmation truth gates",
        ],
        "provider_specific_flex": [
            "Feed transport details",
            "Capacity refresh cadence",
            "Partner-specific no-slot reason vocabularies",
        ],
        "migration_tests": [
            "Stale-capacity regression",
            "No-slot callback fallback parity",
            "Feed freshness indicator parity",
        ],
        "source_refs": [
            "blueprint/phase-5-the-network-horizon.md",
            "docs/external/21_integration_priority_and_execution_matrix.md",
            "data/analysis/gp_provider_decision_register.json",
        ],
    },
    {
        "simulator_id": "sim_im1_principal_system_emis_twin",
        "simulator_label": "IM1 principal-system EMIS twin",
        "family": "booking",
        "execution_phase": "phase_1_provider_truth",
        "dependency_ids": ["dep_im1_pairing_programme", "dep_gp_system_supplier_paths"],
        "baseline_scope": "baseline_required",
        "bounded_contexts": ["booking_orchestration", "patient_portal"],
        "route_families": ["patient_booking_search", "patient_booking_commit", "manage_booking"],
        "current_blocker_removed": (
            "Removes the block on supplier-specific booking-search, hold, commit, and manage semantics "
            "for EMIS-shaped pathways before pairing and supplier evidence are current."
        ),
        "minimum_fidelity_class": "near-live_contract_twin",
        "priority_factors": {
            "baseline_criticality": 4,
            "blocker_severity": 4,
            "implementation_lead_time": 5,
            "proof_sensitivity": 4,
        },
        "upstream_rank_hint": 8,
        "authoritative_proof_semantics": [
            "ProviderCapabilitySnapshot",
            "SlotSearchTruth",
            "BookingCommitAttempt",
            "BookingConfirmationTruthProjection",
        ],
        "ambiguity_behaviors": [
            "supplier_capability_gap",
            "hold_expiry",
            "confirmation_pending",
            "commit_projection_mismatch",
        ],
        "test_types": ["contract", "migration", "replay", "playwright"],
        "replacement_mode": "hybrid_contract_twin",
        "permanent_fallback": False,
        "graduation_trigger": (
            "Pairing, provider roster refresh, bounded use-case approval, and named environment evidence are current "
            "for the EMIS lane."
        ),
        "actual_provider_tasks": ["seq_026", "seq_036", "seq_039", "seq_040"],
        "live_gate_source": "im1_pairing_pack",
        "live_gate_ids": [
            "LIVE_GATE_CREDIBLE_MVP_AND_BOUNDED_USE_CASE",
            "LIVE_GATE_PROVIDER_CAPABILITY_MODEL_FROZEN",
            "LIVE_GATE_NAMED_SPONSOR_AND_COMMERCIAL_OWNER",
            "LIVE_GATE_NAMED_APPROVER_PRESENT",
            "LIVE_GATE_ENVIRONMENT_TARGET_PRESENT",
            "LIVE_GATE_PROVIDER_ROSTER_REFRESH_REQUIRED",
            "LIVE_GATE_MUTATION_FLAG_ENABLED",
        ],
        "required_live_evidence": [
            "Current supplier roster and pairing approval",
            "Bounded use-case approval",
            "Named sponsor, approver, and environment",
        ],
        "unchanged_contract_elements": [
            "Supplier capability matrices remain explicit",
            "Hold expiry and commit ambiguity stay separate from calm confirmation",
            "Local waitlist and fallback law remain core-owned",
        ],
        "provider_specific_flex": [
            "Exact field map and endpoint tuples",
            "Supplier-specific manage coverage",
            "Search or hold feature flags by supplier estate",
        ],
        "migration_tests": [
            "Search/hold/commit parity",
            "Commit ambiguity regression",
            "Manage-booking coverage parity",
        ],
        "source_refs": [
            "docs/external/36_gp_system_pathways_actual_strategy.md",
            "data/analysis/im1_pairing_pack.json",
            "blueprint/phase-4-the-booking-engine.md",
        ],
    },
    {
        "simulator_id": "sim_im1_principal_system_tpp_twin",
        "simulator_label": "IM1 principal-system TPP twin",
        "family": "booking",
        "execution_phase": "phase_1_provider_truth",
        "dependency_ids": ["dep_im1_pairing_programme", "dep_gp_system_supplier_paths"],
        "baseline_scope": "baseline_required",
        "bounded_contexts": ["booking_orchestration", "patient_portal"],
        "route_families": ["patient_booking_search", "patient_booking_commit", "manage_booking"],
        "current_blocker_removed": (
            "Removes the block on supplier-specific booking-search, hold, commit, and manage semantics "
            "for TPP-shaped pathways before pairing and supplier evidence are current."
        ),
        "minimum_fidelity_class": "near-live_contract_twin",
        "priority_factors": {
            "baseline_criticality": 4,
            "blocker_severity": 4,
            "implementation_lead_time": 5,
            "proof_sensitivity": 4,
        },
        "upstream_rank_hint": 9,
        "authoritative_proof_semantics": [
            "ProviderCapabilitySnapshot",
            "SlotSearchTruth",
            "BookingCommitAttempt",
            "BookingConfirmationTruthProjection",
        ],
        "ambiguity_behaviors": [
            "supplier_capability_gap",
            "hold_expiry",
            "confirmation_pending",
            "commit_projection_mismatch",
        ],
        "test_types": ["contract", "migration", "replay", "playwright"],
        "replacement_mode": "hybrid_contract_twin",
        "permanent_fallback": False,
        "graduation_trigger": (
            "Pairing, provider roster refresh, bounded use-case approval, and named environment evidence are current "
            "for the TPP lane."
        ),
        "actual_provider_tasks": ["seq_026", "seq_036", "seq_039", "seq_040"],
        "live_gate_source": "im1_pairing_pack",
        "live_gate_ids": [
            "LIVE_GATE_CREDIBLE_MVP_AND_BOUNDED_USE_CASE",
            "LIVE_GATE_PROVIDER_CAPABILITY_MODEL_FROZEN",
            "LIVE_GATE_NAMED_SPONSOR_AND_COMMERCIAL_OWNER",
            "LIVE_GATE_NAMED_APPROVER_PRESENT",
            "LIVE_GATE_ENVIRONMENT_TARGET_PRESENT",
            "LIVE_GATE_PROVIDER_ROSTER_REFRESH_REQUIRED",
            "LIVE_GATE_MUTATION_FLAG_ENABLED",
        ],
        "required_live_evidence": [
            "Current supplier roster and pairing approval",
            "Bounded use-case approval",
            "Named sponsor, approver, and environment",
        ],
        "unchanged_contract_elements": [
            "Supplier capability matrices remain explicit",
            "Hold expiry and commit ambiguity stay separate from calm confirmation",
            "Local waitlist and fallback law remain core-owned",
        ],
        "provider_specific_flex": [
            "Exact field map and endpoint tuples",
            "Supplier-specific manage coverage",
            "Search or hold feature flags by supplier estate",
        ],
        "migration_tests": [
            "Search/hold/commit parity",
            "Commit ambiguity regression",
            "Manage-booking coverage parity",
        ],
        "source_refs": [
            "docs/external/36_gp_system_pathways_actual_strategy.md",
            "data/analysis/im1_pairing_pack.json",
            "blueprint/phase-4-the-booking-engine.md",
        ],
    },
    {
        "simulator_id": "sim_pharmacy_directory_choice_twin",
        "simulator_label": "Pharmacy directory and choice twin",
        "family": "pharmacy",
        "execution_phase": "phase_1_provider_truth",
        "dependency_ids": ["dep_pharmacy_directory_dohs"],
        "baseline_scope": "baseline_required",
        "bounded_contexts": ["pharmacy_coordination", "patient_portal"],
        "route_families": ["pharmacy_discovery", "patient_choice", "clinician_assist"],
        "current_blocker_removed": (
            "Removes the block on patient-choice tuples, capability snapshots, and directory refresh behavior "
            "before live Service Search onboarding is current."
        ),
        "minimum_fidelity_class": "proof_twin",
        "priority_factors": {
            "baseline_criticality": 4,
            "blocker_severity": 4,
            "implementation_lead_time": 4,
            "proof_sensitivity": 4,
        },
        "upstream_rank_hint": 10,
        "authoritative_proof_semantics": [
            "PharmacyDirectorySnapshot",
            "PharmacyProviderCapabilitySnapshot",
            "PharmacyChoiceProof",
            "ChoiceTupleFreshness",
        ],
        "ambiguity_behaviors": [
            "directory_tuple_drift",
            "provider_ineligible",
            "no_safe_provider",
            "choice_requires_refresh",
        ],
        "test_types": ["contract", "playwright", "accessibility", "policy"],
        "replacement_mode": "replace_with_live_guarded",
        "permanent_fallback": False,
        "graduation_trigger": (
            "Approve live directory access path, choice-policy review, and current tuple freshness evidence."
        ),
        "actual_provider_tasks": ["seq_037", "seq_039", "seq_040"],
        "live_gate_source": "pharmacy_referral_transport_decision_register",
        "live_gate_ids": [
            "LIVE_GATE_PHARMACY_MVP_APPROVED",
            "LIVE_GATE_PHARMACY_NAMED_APPROVER_AND_ENVIRONMENT",
            "LIVE_GATE_PHARMACY_WATCH_REGISTER_CLEAR",
            "LIVE_GATE_PHASE0_EXTERNAL_FOUNDATION",
        ],
        "required_live_evidence": [
            "Service Search access approval and route policy",
            "Choice tuple freshness and capability evidence",
            "Current environment-specific directory entitlement",
        ],
        "unchanged_contract_elements": [
            "Choice proof binds the exact directory tuple",
            "Directory lookup never equals dispatch or closure proof",
            "Refresh and no-safe-provider states remain first-class",
        ],
        "provider_specific_flex": [
            "Directory API version and query parameters",
            "Provider capability filter sets",
            "Source-specific freshness metadata",
        ],
        "migration_tests": [
            "Choice-tuple binding parity",
            "Directory refresh regression",
            "No-safe-provider fallback parity",
        ],
        "source_refs": [
            "docs/external/37_pharmacy_access_paths_mock_strategy.md",
            "docs/external/37_pharmacy_access_paths_actual_strategy.md",
            "blueprint/phase-6-the-pharmacy-loop.md#6C. Pharmacy discovery, provider choice, and directory abstraction",
        ],
    },
    {
        "simulator_id": "sim_email_notification_twin",
        "simulator_label": "Email notification twin",
        "family": "communications",
        "execution_phase": "phase_2_channel_evidence",
        "dependency_ids": ["dep_email_notification_provider"],
        "baseline_scope": "baseline_required",
        "bounded_contexts": ["notifications", "patient_portal", "support_recovery"],
        "route_families": ["email_confirmation", "more_info_callback", "support_repair"],
        "current_blocker_removed": (
            "Removes the block on delivery evidence, repair posture, and sender-domain separation "
            "before real project creation and verification complete."
        ),
        "minimum_fidelity_class": "workflow_twin",
        "priority_factors": {
            "baseline_criticality": 4,
            "blocker_severity": 4,
            "implementation_lead_time": 4,
            "proof_sensitivity": 4,
        },
        "upstream_rank_hint": 11,
        "authoritative_proof_semantics": [
            "DeliveryAttempt",
            "DeliveryEvidence",
            "TemplateVersionBinding",
            "RepairDecision",
        ],
        "ambiguity_behaviors": [
            "bounce",
            "dispute",
            "suppression",
            "stale_template_binding",
        ],
        "test_types": ["contract", "replay", "playwright", "accessibility"],
        "replacement_mode": "hybrid_contract_twin",
        "permanent_fallback": False,
        "graduation_trigger": (
            "Freeze sender ownership, domain verification, webhook security, and named environment for "
            "the chosen notification vendor."
        ),
        "actual_provider_tasks": ["seq_031", "seq_033", "seq_039", "seq_040"],
        "live_gate_source": "notification_studio_pack",
        "live_gate_ids": [
            "LIVE_GATE_NOTIFY_PROJECT_SCOPE",
            "LIVE_GATE_NOTIFY_SENDER_OWNERSHIP",
            "LIVE_GATE_NOTIFY_DOMAIN_VERIFICATION",
            "LIVE_GATE_NOTIFY_WEBHOOK_SECURITY",
            "LIVE_GATE_NOTIFY_APPROVER_AND_ENV",
            "LIVE_GATE_NOTIFY_MUTATION_AND_SPEND_FLAGS",
            "LIVE_GATE_NOTIFY_FINAL_POSTURE",
        ],
        "required_live_evidence": [
            "Sender ownership and verified domain",
            "Webhook security evidence",
            "Project scope and named environment approval",
        ],
        "unchanged_contract_elements": [
            "Delivery acceptance never equals patient-visible truth by itself",
            "Repair and resend remain governed product actions",
            "Template version binding stays explicit",
        ],
        "provider_specific_flex": [
            "Sender and domain configuration",
            "Webhook payload signatures",
            "Provider event vocabularies for bounce and suppression",
        ],
        "migration_tests": [
            "Bounce/dispute/suppression parity",
            "Template migration regression",
            "Repair-path replay parity",
        ],
        "source_refs": [
            "docs/external/33_local_notification_studio_spec.md",
            "data/analysis/33_notification_studio_pack.json",
            "callback-and-clinician-messaging-loop.md",
        ],
    },
    {
        "simulator_id": "sim_support_replay_resend_twin",
        "simulator_label": "Support replay and resend twin",
        "family": "communications",
        "execution_phase": "phase_2_channel_evidence",
        "dependency_ids": ["dep_email_notification_provider", "dep_sms_notification_provider"],
        "baseline_scope": "baseline_required",
        "bounded_contexts": ["support_recovery", "communications", "operations_console"],
        "route_families": ["support_workspace", "controlled_resend", "callback_repair"],
        "current_blocker_removed": (
            "Removes the block on governed resend, support replay, and repair-window behavior before "
            "provider callbacks and human-only retry policy are fully frozen."
        ),
        "minimum_fidelity_class": "proof_twin",
        "priority_factors": {
            "baseline_criticality": 4,
            "blocker_severity": 4,
            "implementation_lead_time": 3,
            "proof_sensitivity": 5,
        },
        "upstream_rank_hint": 12,
        "authoritative_proof_semantics": [
            "ReplayReviewDecision",
            "ControlledResendAuthorisation",
            "DeliveryRepairWindow",
            "AuditReplayEnvelope",
        ],
        "ambiguity_behaviors": [
            "disputed_delivery",
            "unknown_recipient",
            "duplicate_resend_request",
            "stale_support_context",
        ],
        "test_types": ["contract", "replay", "playwright", "audit"],
        "replacement_mode": "permanent_fallback",
        "permanent_fallback": True,
        "graduation_trigger": (
            "No runtime graduation. This twin stays permanent because support repair and replay drills must "
            "remain deterministic across local, preview, and incident rehearsal environments."
        ),
        "actual_provider_tasks": ["seq_033", "seq_039", "seq_040"],
        "live_gate_source": "notification_studio_pack",
        "live_gate_ids": [
            "LIVE_GATE_NOTIFY_REPAIR_POLICY",
            "LIVE_GATE_NOTIFY_LOG_EXPORT",
            "LIVE_GATE_NOTIFY_APPROVER_AND_ENV",
            "LIVE_GATE_NOTIFY_FINAL_POSTURE",
        ],
        "required_live_evidence": [
            "Repair policy approval",
            "Audit log export and replay guard evidence",
            "Human-only checkpoint policy from seq_039",
        ],
        "unchanged_contract_elements": [
            "Controlled resend always stays explicit and audited",
            "Support replay never bypasses repair windows or scope fences",
            "Disputed delivery remains a first-class blocker",
        ],
        "provider_specific_flex": [
            "Callback payload details used during replay review",
            "Provider-side event identifiers",
            "Export format used for post-incident audit pulls",
        ],
        "migration_tests": [
            "Replay fence regression",
            "Controlled resend authorization parity",
            "Support repair visibility parity",
        ],
        "source_refs": [
            "docs/external/33_local_notification_studio_spec.md",
            "blueprint/patient-account-and-communications-blueprint.md",
            "callback-and-clinician-messaging-loop.md",
        ],
    },
    {
        "simulator_id": "sim_sms_delivery_twin",
        "simulator_label": "SMS delivery twin",
        "family": "communications",
        "execution_phase": "phase_2_channel_evidence",
        "dependency_ids": ["dep_sms_notification_provider"],
        "baseline_scope": "optional_flagged",
        "bounded_contexts": ["notifications", "patient_portal", "support_recovery"],
        "route_families": ["sms_continuation", "callback_link", "support_repair"],
        "current_blocker_removed": (
            "Removes the block on continuation grant delivery, expiry, wrong-recipient handling, and "
            "disputed SMS evidence before sender registration and live spend approval."
        ),
        "minimum_fidelity_class": "workflow_twin",
        "priority_factors": {
            "baseline_criticality": 3,
            "blocker_severity": 4,
            "implementation_lead_time": 4,
            "proof_sensitivity": 4,
        },
        "upstream_rank_hint": 13,
        "authoritative_proof_semantics": [
            "SMSContinuationGrant",
            "DeliveryEvidence",
            "LinkRedemptionFence",
            "WrongRecipientRepairDecision",
        ],
        "ambiguity_behaviors": [
            "delayed_delivery",
            "expired_link",
            "wrong_recipient_suspected",
            "disputed_delivery",
        ],
        "test_types": ["contract", "replay", "playwright"],
        "replacement_mode": "hybrid_contract_twin",
        "permanent_fallback": False,
        "graduation_trigger": (
            "Freeze sender ownership, spend authority, and wrong-recipient repair policy for the selected "
            "SMS vendor."
        ),
        "actual_provider_tasks": ["seq_031", "seq_033", "seq_039", "seq_040"],
        "live_gate_source": "notification_studio_pack",
        "live_gate_ids": [
            "LIVE_GATE_NOTIFY_PROJECT_SCOPE",
            "LIVE_GATE_NOTIFY_SENDER_OWNERSHIP",
            "LIVE_GATE_NOTIFY_WEBHOOK_SECURITY",
            "LIVE_GATE_NOTIFY_APPROVER_AND_ENV",
            "LIVE_GATE_NOTIFY_MUTATION_AND_SPEND_FLAGS",
        ],
        "required_live_evidence": [
            "SMS sender ownership",
            "Wrong-recipient repair controls",
            "Spend and environment approval",
        ],
        "unchanged_contract_elements": [
            "Continuation grants remain bounded",
            "Delivery ambiguity and wrong-recipient suspicion remain explicit",
            "Redemption stays fenced by the active subject and context",
        ],
        "provider_specific_flex": [
            "Sender ID format",
            "Provider delivery callback schema",
            "Link delivery TTL values",
        ],
        "migration_tests": [
            "Grant expiry parity",
            "Wrong-recipient repair regression",
            "Delivery dispute replay parity",
        ],
        "source_refs": [
            "docs/external/33_local_notification_studio_spec.md",
            "callback-and-clinician-messaging-loop.md",
            "data/analysis/33_notification_studio_pack.json",
        ],
    },
    {
        "simulator_id": "sim_transcription_processing_twin",
        "simulator_label": "Transcription processing twin",
        "family": "evidence",
        "execution_phase": "phase_2_channel_evidence",
        "dependency_ids": ["dep_transcription_processing_provider"],
        "baseline_scope": "baseline_required",
        "bounded_contexts": ["evidence_pipeline", "telephony_ingest", "operations_console"],
        "route_families": ["voice_evidence", "artifact_processing", "staff_review"],
        "current_blocker_removed": (
            "Removes the block on queued, partial, ready, failed, and superseded transcript states "
            "before live vendor latency and quality evidence exist."
        ),
        "minimum_fidelity_class": "fault_injection_twin",
        "priority_factors": {
            "baseline_criticality": 3,
            "blocker_severity": 4,
            "implementation_lead_time": 4,
            "proof_sensitivity": 5,
        },
        "upstream_rank_hint": 14,
        "authoritative_proof_semantics": [
            "TranscriptReadinessDecision",
            "DerivedFactsPackage",
            "ManualReviewRequirement",
            "SupersessionLedgerEntry",
        ],
        "ambiguity_behaviors": [
            "partial_transcript",
            "superseded_rerun",
            "clinically_insufficient",
            "timeout_or_failure",
        ],
        "test_types": ["contract", "fault-injection", "replay", "projection"],
        "replacement_mode": "hybrid_contract_twin",
        "permanent_fallback": False,
        "graduation_trigger": (
            "Freeze region policy, retention policy, webhook security, and named environment for the "
            "selected transcript provider."
        ),
        "actual_provider_tasks": ["seq_034", "seq_035", "seq_039", "seq_040"],
        "live_gate_source": "evidence_processing_lab_pack",
        "live_gate_ids": [
            "LIVE_GATE_EVIDENCE_REGION_POLICY_EXPLICIT",
            "LIVE_GATE_EVIDENCE_RETENTION_POLICY_EXPLICIT",
            "LIVE_GATE_EVIDENCE_WEBHOOK_SECURITY_READY",
            "LIVE_GATE_EVIDENCE_NAMED_APPROVER_AND_ENV",
            "LIVE_GATE_EVIDENCE_MUTATION_FLAG",
            "LIVE_GATE_EVIDENCE_FINAL_OPERATOR_ACK",
        ],
        "required_live_evidence": [
            "Region and retention posture",
            "Webhook security evidence",
            "Named approver and final operator acknowledgement",
        ],
        "unchanged_contract_elements": [
            "Transcript output remains derivative, not source truth",
            "Manual review remains explicit when coverage is inadequate",
            "Superseded transcript runs stay visible and replayable",
        ],
        "provider_specific_flex": [
            "Latency profile and callback shape",
            "Vocabulary or confidence metadata",
            "Storage scope for raw transcript artifacts",
        ],
        "migration_tests": [
            "Queued/partial/ready parity",
            "Supersession regression",
            "Manual-review requirement parity",
        ],
        "source_refs": [
            "docs/external/35_local_evidence_processing_lab_spec.md",
            "data/analysis/35_evidence_processing_lab_pack.json",
            "blueprint/phase-2-the-identity-and-echoes.md#2F. Caller verification, voice capture, transcript stub, and SMS continuation",
        ],
    },
    {
        "simulator_id": "sim_malware_artifact_scan_twin",
        "simulator_label": "Malware and artifact scanning twin",
        "family": "evidence",
        "execution_phase": "phase_2_channel_evidence",
        "dependency_ids": ["dep_malware_scanning_provider"],
        "baseline_scope": "baseline_required",
        "bounded_contexts": ["evidence_pipeline", "patient_portal", "operations_console"],
        "route_families": ["upload_scan", "artifact_release", "support_review"],
        "current_blocker_removed": (
            "Removes the block on clean, suspicious, quarantined, unreadable, and failed scan behavior "
            "before real scanner project provisioning exists."
        ),
        "minimum_fidelity_class": "fault_injection_twin",
        "priority_factors": {
            "baseline_criticality": 3,
            "blocker_severity": 4,
            "implementation_lead_time": 4,
            "proof_sensitivity": 5,
        },
        "upstream_rank_hint": 15,
        "authoritative_proof_semantics": [
            "ScanVerdict",
            "QuarantineDecision",
            "ReleaseFromQuarantineDecision",
            "ReacquireEvidenceRequest",
        ],
        "ambiguity_behaviors": [
            "suspicious_verdict",
            "unreadable_artifact",
            "delayed_verdict",
            "false_positive_manual_review",
        ],
        "test_types": ["contract", "fault-injection", "replay", "projection"],
        "replacement_mode": "hybrid_contract_twin",
        "permanent_fallback": False,
        "graduation_trigger": (
            "Freeze quarantine policy, storage scope, webhook security, and named environment for the "
            "selected scanning provider."
        ),
        "actual_provider_tasks": ["seq_034", "seq_035", "seq_039", "seq_040"],
        "live_gate_source": "evidence_processing_lab_pack",
        "live_gate_ids": [
            "LIVE_GATE_EVIDENCE_STORAGE_SCOPE_DEFINED",
            "LIVE_GATE_EVIDENCE_QUARANTINE_POLICY_FROZEN",
            "LIVE_GATE_EVIDENCE_NAMED_APPROVER_AND_ENV",
            "LIVE_GATE_EVIDENCE_MUTATION_FLAG",
            "LIVE_GATE_EVIDENCE_FINAL_OPERATOR_ACK",
        ],
        "required_live_evidence": [
            "Storage scope and quarantine policy",
            "Webhook security and mutation gate posture",
            "Named approver and operator acknowledgement",
        ],
        "unchanged_contract_elements": [
            "Suspicious and quarantined remain separate outcomes",
            "Unreadable artifacts never silently pass",
            "Manual release from quarantine remains explicit and auditable",
        ],
        "provider_specific_flex": [
            "Verdict taxonomy and confidence annotations",
            "Event callback or polling shape",
            "Quarantine storage integration details",
        ],
        "migration_tests": [
            "Suspicious/quarantine parity",
            "Unreadable artifact regression",
            "Manual release parity",
        ],
        "source_refs": [
            "docs/external/35_local_evidence_processing_lab_spec.md",
            "data/analysis/35_evidence_processing_lab_pack.json",
            "blueprint/phase-1-the-red-flag-gate.md",
        ],
    },
    {
        "simulator_id": "sim_nhs_app_embedded_bridge_twin",
        "simulator_label": "NHS App embedded bridge twin",
        "family": "embedded",
        "execution_phase": "phase_3_deferred_optional",
        "dependency_ids": ["dep_nhs_app_embedded_channel_ecosystem"],
        "baseline_scope": "deferred_phase7",
        "bounded_contexts": ["patient_portal", "embedded_channel", "release_controls"],
        "route_families": ["nhs_app_webview", "embedded_jump_off", "site_links"],
        "current_blocker_removed": (
            "Removes the block on webview-safe hand-off, route manifest rehearsal, and site-link publication "
            "shape before sandpit, AOS, and SCAL readiness exist."
        ),
        "minimum_fidelity_class": "workflow_twin",
        "priority_factors": {
            "baseline_criticality": 2,
            "blocker_severity": 4,
            "implementation_lead_time": 5,
            "proof_sensitivity": 4,
        },
        "upstream_rank_hint": 16,
        "authoritative_proof_semantics": [
            "SiteLinkPublicationTuple",
            "EmbeddedBridgeCapabilitySnapshot",
            "AppReturnIntent",
            "ReleaseGateEvidence",
        ],
        "ambiguity_behaviors": [
            "header_suppression_mismatch",
            "bridge_unavailable",
            "consent_denied_return",
            "file_download_not_supported",
        ],
        "test_types": ["contract", "playwright", "accessibility", "release"],
        "replacement_mode": "replace_with_live_guarded",
        "permanent_fallback": False,
        "graduation_trigger": (
            "Open the approved Phase 7 scope window, name the environment, clear commissioning blockers, "
            "and publish current NHS App readiness evidence."
        ),
        "actual_provider_tasks": ["seq_029", "seq_030", "seq_040"],
        "live_gate_source": "nhs_app_live_gate_checklist",
        "live_gate_ids": [
            "LIVE_GATE_PHASE7_SCOPE_WINDOW",
            "LIVE_GATE_EXTERNAL_FOUNDATION_WITHHELD",
            "LIVE_GATE_NHS_LOGIN_READY_ENOUGH",
            "LIVE_GATE_COMMISSIONING_EXPLICIT",
            "LIVE_GATE_NAMED_APPROVER_PRESENT",
            "LIVE_GATE_ENVIRONMENT_TARGET_PRESENT",
            "LIVE_GATE_MUTATION_FLAG_ENABLED",
        ],
        "required_live_evidence": [
            "Scope-window approval and commissioning posture",
            "Current NHS login readiness for embedded use",
            "Named environment, approver, and release evidence",
        ],
        "unchanged_contract_elements": [
            "Embedded return intent remains explicit",
            "Header suppression and webview constraints remain testable",
            "Site-link publication stays environment-scoped and mutation-gated",
        ],
        "provider_specific_flex": [
            "Site-link values and package identifiers",
            "JS bridge surface details",
            "Environment-specific jump-off inventory",
        ],
        "migration_tests": [
            "Embedded return parity",
            "Webview limitation regression",
            "Site-link publication parity",
        ],
        "source_refs": [
            "docs/external/29_nhs_app_sandpit_to_aos_progression_pack.md",
            "docs/external/30_real_registration_and_hosting_strategy.md",
            "data/analysis/nhs_app_live_gate_checklist.json",
        ],
    },
    {
        "simulator_id": "sim_optional_pds_enrichment_twin",
        "simulator_label": "Optional PDS enrichment twin",
        "family": "patient_data",
        "execution_phase": "phase_3_deferred_optional",
        "dependency_ids": ["dep_pds_fhir_enrichment"],
        "baseline_scope": "optional_flagged",
        "bounded_contexts": ["identity_access", "patient_portal", "operations_console"],
        "route_families": ["identity_enrichment", "patient_claim_repair", "ops_review"],
        "current_blocker_removed": (
            "Removes the block on feature-flagged enrichment, legal-basis-off behavior, and "
            "wrong-patient-safe match confidence handling before sandbox access exists."
        ),
        "minimum_fidelity_class": "workflow_twin",
        "priority_factors": {
            "baseline_criticality": 2,
            "blocker_severity": 3,
            "implementation_lead_time": 3,
            "proof_sensitivity": 4,
        },
        "upstream_rank_hint": 17,
        "authoritative_proof_semantics": [
            "PdsEnrichmentDecision",
            "MatchConfidenceSnapshot",
            "FeatureFlagDecision",
            "WrongPatientRepairHold",
        ],
        "ambiguity_behaviors": [
            "no_match",
            "multiple_matches",
            "legal_basis_off",
            "stale_demographics",
        ],
        "test_types": ["contract", "replay", "fault-injection"],
        "replacement_mode": "permanent_fallback",
        "permanent_fallback": True,
        "graduation_trigger": (
            "No mandatory graduation. The simulator remains permanent because the seam stays optional and "
            "tenants may deliberately keep the live route disabled."
        ),
        "actual_provider_tasks": ["seq_027", "seq_040"],
        "live_gate_source": "pds_access_pack",
        "live_gate_ids": [
            "GATE_EXTERNAL_TO_FOUNDATION",
            "LIVE_GATE_PDS_LEGAL_BASIS_APPROVED",
            "PDS_LIVE_GATE_ACCESS_MODE_SELECTED",
            "PDS_LIVE_GATE_NAMED_APPROVER_PRESENT",
            "PDS_LIVE_GATE_ENVIRONMENT_TARGET_PRESENT",
            "PDS_LIVE_GATE_ALLOW_REAL_PROVIDER_MUTATION",
        ],
        "required_live_evidence": [
            "Legal basis and selected access mode",
            "Named approver and environment",
            "Wrong-patient and rollback readiness evidence",
        ],
        "unchanged_contract_elements": [
            "PDS stays optional and feature-flagged",
            "Local binding and NHS login remain the baseline identity authority",
            "Wrong-patient repair holds remain explicit even when enrichment is enabled",
        ],
        "provider_specific_flex": [
            "Access mode and network path",
            "Certificate or credential profile",
            "Demographic field mapping breadth",
        ],
        "migration_tests": [
            "Feature-flag-off parity",
            "No-match/multi-match regression",
            "Wrong-patient hold preservation",
        ],
        "source_refs": [
            "blueprint/phase-2-the-identity-and-echoes.md#2C. Patient linkage, demographic confidence, and optional PDS enrichment",
            "data/analysis/pds_access_pack.json",
            "docs/external/27_pds_access_request_plan.md",
        ],
    },
]

CSV_FIELDNAMES = [
    "simulator_id",
    "simulator_label",
    "family",
    "baseline_scope",
    "execution_phase",
    "priority_rank",
    "priority_score",
    "priority_tier",
    "canonical_dependency_name",
    "current_blocker_removed_by_simulator",
    "minimum_fidelity_class",
    "replacement_mode",
    "permanent_fallback",
    "owning_bounded_contexts",
    "authoritative_proof_semantics",
    "ambiguity_and_degraded_behaviors",
    "route_families_or_surfaces",
    "test_types_required",
    "graduation_or_replacement_trigger",
    "linked_actual_provider_tasks",
    "live_gate_source_pack",
    "blocked_live_gate_ids",
    "review_live_gate_ids",
    "source_refs",
]


def load_json(path: Path) -> Any:
    return json.loads(path.read_text())


def ensure_dir(path: Path) -> None:
    path.mkdir(parents=True, exist_ok=True)


def format_timestamp() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat()


def score_row(priority_factors: dict[str, int]) -> int:
    weights = {factor["factor_id"]: factor["weight"] for factor in SCORING_MODEL["factors"]}
    return sum(priority_factors[factor_id] * weights[factor_id] for factor_id in weights)


def priority_tier_for(score: int) -> str:
    for tier in SCORING_MODEL["priority_tiers"]:
        if score >= tier["minimum_score"]:
            return tier["tier"]
    raise ValueError(f"Unable to classify score {score}")


def live_gates_for(pack: dict[str, Any]) -> list[dict[str, Any]]:
    if "live_gates" in pack:
        return pack["live_gates"]
    if "live_gate_pack" in pack:
        return pack["live_gate_pack"]["live_gates"]
    raise KeyError("Pack does not contain live gate data")


def md_cell(value: Any) -> str:
    if isinstance(value, list):
        text = "<br>".join(str(item) for item in value)
    else:
        text = str(value)
    return text.replace("|", "\\|")


def text_list(items: list[str]) -> str:
    return "; ".join(items)


def gate_summary(gate: dict[str, Any]) -> str:
    for key in ("summary", "notes", "reason", "title", "label"):
        if key in gate and gate[key]:
            return str(gate[key])
    return gate["gate_id"]


def summarise_scope(rows: list[dict[str, Any]]) -> dict[str, int]:
    summary: dict[str, int] = {}
    for row in rows:
        summary[row["baseline_scope"]] = summary.get(row["baseline_scope"], 0) + 1
    return summary


def build_rows(inputs: dict[str, Any]) -> list[dict[str, Any]]:
    dependencies = {
        row["dependency_id"]: row for row in inputs["external_dependencies"]["dependencies"]
    }
    pack_lookup = {
        "nhs_login_capture_pack": inputs["nhs_login_capture_pack"],
        "im1_pairing_pack": inputs["im1_pairing_pack"],
        "pds_access_pack": inputs["pds_access_pack"],
        "mesh_execution_pack": inputs["mesh_execution_pack"],
        "telephony_lab_pack": inputs["telephony_lab_pack"],
        "notification_studio_pack": inputs["notification_studio_pack"],
        "evidence_processing_lab_pack": inputs["evidence_processing_lab_pack"],
        "gp_provider_decision_register": inputs["gp_provider_decision_register"],
        "pharmacy_referral_transport_decision_register": inputs["pharmacy_referral_transport_decision_register"],
        "nhs_app_live_gate_checklist": inputs["nhs_app_live_gate_checklist"],
    }
    gate_lookup: dict[str, dict[str, dict[str, Any]]] = {}
    for pack_name, pack in pack_lookup.items():
        gate_lookup[pack_name] = {row["gate_id"]: row for row in live_gates_for(pack)}

    rows: list[dict[str, Any]] = []
    for spec in SIMULATOR_SPECS:
        dependency_names = [dependencies[dep_id]["dependency_name"] for dep_id in spec["dependency_ids"]]
        gates = [gate_lookup[spec["live_gate_source"]][gate_id] for gate_id in spec["live_gate_ids"]]
        blocked_gate_ids = [row["gate_id"] for row in gates if row["status"] == "blocked"]
        review_gate_ids = [row["gate_id"] for row in gates if row["status"] == "review_required"]
        score = score_row(spec["priority_factors"])
        row = {
            **spec,
            "canonical_dependency_name": dependency_names[0] if len(dependency_names) == 1 else " / ".join(dependency_names),
            "dependency_names": dependency_names,
            "priority_score": score,
            "priority_tier": priority_tier_for(score),
            "live_gates": gates,
            "blocked_live_gate_ids": blocked_gate_ids,
            "review_live_gate_ids": review_gate_ids,
            "blocked_live_gate_count": len(blocked_gate_ids),
            "review_live_gate_count": len(review_gate_ids),
        }
        rows.append(row)

    rows.sort(
        key=lambda row: (-row["priority_score"], row["upstream_rank_hint"], row["simulator_id"])
    )
    for index, row in enumerate(rows, start=1):
        row["priority_rank"] = index
    return rows


def build_priority_scores(rows: list[dict[str, Any]]) -> dict[str, Any]:
    return {
        "task_id": TASK_ID,
        "generated_at": format_timestamp(),
        "visual_mode": VISUAL_MODE,
        "scoring_model": SCORING_MODEL,
        "rows": [
            {
                "simulator_id": row["simulator_id"],
                "simulator_label": row["simulator_label"],
                "family": row["family"],
                "execution_phase": row["execution_phase"],
                "priority_rank": row["priority_rank"],
                "priority_score": row["priority_score"],
                "priority_tier": row["priority_tier"],
                "priority_factors": row["priority_factors"],
                "upstream_rank_hint": row["upstream_rank_hint"],
                "current_blocker_removed_by_simulator": row["current_blocker_removed"],
            }
            for row in rows
        ],
        "summary": {
            "simulator_count": len(rows),
            "critical_count": sum(1 for row in rows if row["priority_tier"] == "critical"),
            "high_count": sum(1 for row in rows if row["priority_tier"] == "high"),
            "medium_count": sum(1 for row in rows if row["priority_tier"] == "medium"),
            "watch_count": sum(1 for row in rows if row["priority_tier"] == "watch"),
        },
    }


def build_gap_map(rows: list[dict[str, Any]]) -> dict[str, Any]:
    gap_rows = []
    for row in rows:
        gap_rows.append(
            {
                "simulator_id": row["simulator_id"],
                "simulator_label": row["simulator_label"],
                "replacement_mode": row["replacement_mode"],
                "permanent_fallback": row["permanent_fallback"],
                "live_gate_source": row["live_gate_source"],
                "blocked_live_gates": [
                    {
                        "gate_id": gate["gate_id"],
                        "status": gate["status"],
                        "summary": gate_summary(gate),
                    }
                    for gate in row["live_gates"]
                    if gate["status"] == "blocked"
                ],
                "review_live_gates": [
                    {
                        "gate_id": gate["gate_id"],
                        "status": gate["status"],
                        "summary": gate_summary(gate),
                    }
                    for gate in row["live_gates"]
                    if gate["status"] == "review_required"
                ],
                "required_live_evidence": row["required_live_evidence"],
                "unchanged_contract_elements": row["unchanged_contract_elements"],
                "provider_specific_flex": row["provider_specific_flex"],
                "migration_tests": row["migration_tests"],
                "actual_provider_tasks": row["actual_provider_tasks"],
            }
        )
    return {
        "task_id": TASK_ID,
        "generated_at": format_timestamp(),
        "visual_mode": VISUAL_MODE,
        "summary": {
            "simulator_count": len(rows),
            "blocked_live_gate_instances": sum(len(row["blocked_live_gate_ids"]) for row in rows),
            "review_live_gate_instances": sum(len(row["review_live_gate_ids"]) for row in rows),
            "permanent_fallback_count": sum(1 for row in rows if row["permanent_fallback"]),
            "replace_with_live_guarded_count": sum(
                1 for row in rows if row["replacement_mode"] == "replace_with_live_guarded"
            ),
            "hybrid_contract_twin_count": sum(
                1 for row in rows if row["replacement_mode"] == "hybrid_contract_twin"
            ),
        },
        "gap_rows": gap_rows,
    }


def build_manifest(rows: list[dict[str, Any]], inputs: dict[str, Any]) -> dict[str, Any]:
    phase0_verdict = inputs["phase0_gate_verdict"]["summary"]["phase0_entry_verdict"]
    priority_scores = build_priority_scores(rows)
    gap_map = build_gap_map(rows)
    used_fidelity_classes = {row["minimum_fidelity_class"] for row in rows}
    phase_rows = []
    for phase in PHASES:
        phase_rows.append(
            {
                **phase,
                "simulator_count": sum(1 for row in rows if row["execution_phase"] == phase["phase_id"]),
                "critical_count": sum(
                    1
                    for row in rows
                    if row["execution_phase"] == phase["phase_id"] and row["priority_tier"] == "critical"
                ),
                "top_simulators": [
                    row["simulator_label"]
                    for row in rows
                    if row["execution_phase"] == phase["phase_id"]
                ][:3],
            }
        )

    replacement_rows = []
    for replacement in REPLACEMENT_MODES:
        replacement_rows.append(
            {
                **replacement,
                "simulator_count": sum(
                    1 for row in rows if row["replacement_mode"] == replacement["replacement_mode"]
                ),
            }
        )

    fidelity_rows = []
    for fidelity in FIDELITY_CLASSES:
        fidelity_rows.append(
            {
                **fidelity,
                "simulator_count": sum(
                    1 for row in rows if row["minimum_fidelity_class"] == fidelity["fidelity_class"]
                ),
                "used_in_backlog": fidelity["fidelity_class"] in used_fidelity_classes,
            }
        )

    matrix = []
    used_fidelity_order = [
        row["fidelity_class"]
        for row in fidelity_rows
        if row["used_in_backlog"]
    ]
    priority_tiers = [row["tier"] for row in SCORING_MODEL["priority_tiers"]]
    for fidelity_class in used_fidelity_order:
        row_counts = {"fidelity_class": fidelity_class}
        for tier in priority_tiers:
            row_counts[tier] = sum(
                1
                for row in rows
                if row["minimum_fidelity_class"] == fidelity_class and row["priority_tier"] == tier
            )
        matrix.append(row_counts)

    return {
        "task_id": TASK_ID,
        "generated_at": format_timestamp(),
        "captured_on": CAPTURED_ON,
        "visual_mode": VISUAL_MODE,
        "mission": MISSION,
        "phase0_entry_verdict": phase0_verdict,
        "source_precedence": SOURCE_PRECEDENCE,
        "assumptions": ASSUMPTIONS,
        "scoring_model": SCORING_MODEL,
        "fidelity_classes": fidelity_rows,
        "replacement_modes": replacement_rows,
        "execution_phases": phase_rows,
        "priority_fidelity_matrix": matrix,
        "summary": {
            "simulator_count": len(rows),
            "baseline_critical_count": sum(
                1 for row in rows if row["baseline_scope"] == "baseline_required"
            ),
            "proof_twin_count": sum(
                1 for row in rows if row["minimum_fidelity_class"] == "proof_twin"
            ),
            "fault_injection_twin_count": sum(
                1 for row in rows if row["minimum_fidelity_class"] == "fault_injection_twin"
            ),
            "near_live_contract_twin_count": sum(
                1 for row in rows if row["minimum_fidelity_class"] == "near-live_contract_twin"
            ),
            "replace_with_live_guarded_count": gap_map["summary"]["replace_with_live_guarded_count"],
            "hybrid_contract_twin_count": gap_map["summary"]["hybrid_contract_twin_count"],
            "permanent_fallback_count": gap_map["summary"]["permanent_fallback_count"],
            "blocked_live_gate_instances": gap_map["summary"]["blocked_live_gate_instances"],
            "review_live_gate_instances": gap_map["summary"]["review_live_gate_instances"],
            "execution_phase_count": len(PHASES),
        },
        "upstream_inputs": {
            "integration_family_count": inputs["integration_priority_matrix"]["summary"]["integration_family_count"],
            "dependency_count": inputs["external_dependencies"]["summary"]["dependency_count"],
            "provider_family_count": inputs["provider_family_scorecards"]["summary"]["provider_family_count"],
            "coverage_gap_count": inputs["coverage_summary"]["summary"]["requirements_with_gaps_count"],
            "risk_count": inputs["master_risk_register"]["summary"]["risk_count"],
        },
        "priority_scores": priority_scores,
        "gap_map_summary": gap_map["summary"],
        "simulators": rows,
    }


def write_csv(rows: list[dict[str, Any]]) -> None:
    ensure_dir(BACKLOG_CSV_PATH.parent)
    with BACKLOG_CSV_PATH.open("w", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=CSV_FIELDNAMES)
        writer.writeheader()
        for row in rows:
            writer.writerow(
                {
                    "simulator_id": row["simulator_id"],
                    "simulator_label": row["simulator_label"],
                    "family": row["family"],
                    "baseline_scope": row["baseline_scope"],
                    "execution_phase": row["execution_phase"],
                    "priority_rank": row["priority_rank"],
                    "priority_score": row["priority_score"],
                    "priority_tier": row["priority_tier"],
                    "canonical_dependency_name": row["canonical_dependency_name"],
                    "current_blocker_removed_by_simulator": row["current_blocker_removed"],
                    "minimum_fidelity_class": row["minimum_fidelity_class"],
                    "replacement_mode": row["replacement_mode"],
                    "permanent_fallback": "yes" if row["permanent_fallback"] else "no",
                    "owning_bounded_contexts": text_list(row["bounded_contexts"]),
                    "authoritative_proof_semantics": text_list(row["authoritative_proof_semantics"]),
                    "ambiguity_and_degraded_behaviors": text_list(row["ambiguity_behaviors"]),
                    "route_families_or_surfaces": text_list(row["route_families"]),
                    "test_types_required": text_list(row["test_types"]),
                    "graduation_or_replacement_trigger": row["graduation_trigger"],
                    "linked_actual_provider_tasks": text_list(row["actual_provider_tasks"]),
                    "live_gate_source_pack": row["live_gate_source"],
                    "blocked_live_gate_ids": text_list(row["blocked_live_gate_ids"]),
                    "review_live_gate_ids": text_list(row["review_live_gate_ids"]),
                    "source_refs": text_list(row["source_refs"]),
                }
            )


def write_json(path: Path, payload: dict[str, Any]) -> None:
    ensure_dir(path.parent)
    path.write_text(json.dumps(payload, indent=2) + "\n")


def render_backlog_doc(manifest: dict[str, Any]) -> str:
    rows = manifest["simulators"]
    top_rows = rows[:8]
    return dedent(
        f"""\
        # 38 Local Adapter Simulator Backlog

        Generated: `{manifest["generated_at"]}`
        Visual mode: `{VISUAL_MODE}`
        Phase 0 posture: `{manifest["phase0_entry_verdict"]}`

        ## Summary

        - simulator rows: `{manifest["summary"]["simulator_count"]}`
        - baseline-critical rows: `{manifest["summary"]["baseline_critical_count"]}`
        - proof-twin rows: `{manifest["summary"]["proof_twin_count"]}`
        - blocked live-gate instances: `{manifest["summary"]["blocked_live_gate_instances"]}`
        - execution phases: `{manifest["summary"]["execution_phase_count"]}`

        ## Mock_now_execution

        This backlog turns "mock it for now" into one explicit simulator queue. Every row below is executable now, keeps proof and degraded-mode law intact, and points at later live-provider replacement or coexistence work.

        ### Top execution order

        | Rank | Simulator | Score | Fidelity | Blocker removed |
        | --- | --- | --- | --- | --- |
        {"".join(f'| {row["priority_rank"]} | {md_cell(row["simulator_label"])} | {row["priority_score"]} | `{row["minimum_fidelity_class"]}` | {md_cell(row["current_blocker_removed"])} |\n' for row in top_rows)}

        ### Full backlog

        | Simulator | Family | Phase | Scope | Replacement mode | Permanent fallback | Proof semantics |
        | --- | --- | --- | --- | --- | --- | --- |
        {"".join(f'| `{row["simulator_id"]}`<br>{md_cell(row["simulator_label"])} | `{row["family"]}` | `{row["execution_phase"]}` | `{row["baseline_scope"]}` | `{row["replacement_mode"]}` | {"yes" if row["permanent_fallback"] else "no"} | {md_cell(row["authoritative_proof_semantics"])} |\n' for row in rows)}

        ## Guardrails

        - no simulator row may return optimistic success when the blueprint requires ambiguity, expiry, manual review, or bounded fallback
        - route shape, proof objects, and replay fences stay in the manifest, not hidden in prose
        - rows marked `permanent_fallback` remain part of the target operating model and are not treated as temporary cleanup work
        """
    )


def render_execution_order_doc(manifest: dict[str, Any]) -> str:
    rows = manifest["simulators"]
    phase_map = {phase["phase_id"]: phase for phase in manifest["execution_phases"]}
    sections = []
    for phase in PHASES:
        phase_rows = [row for row in rows if row["execution_phase"] == phase["phase_id"]]
        sections.append(
            dedent(
                f"""\
                ### {phase_map[phase["phase_id"]]["title"]}

                - entry rule: {phase_map[phase["phase_id"]]["entry_rule"]}
                - simulator count: `{phase_map[phase["phase_id"]]["simulator_count"]}`
                - top simulators: {", ".join(phase_map[phase["phase_id"]]["top_simulators"])}

                | Rank | Simulator | Score | Tasks later | Tests now |
                | --- | --- | --- | --- | --- |
                {"".join(f'| {row["priority_rank"]} | {md_cell(row["simulator_label"])} | {row["priority_score"]} | {md_cell(row["actual_provider_tasks"])} | {md_cell(row["test_types"])} |\n' for row in phase_rows)}
                """
            )
        )

    return dedent(
        f"""\
        # 38 Local Adapter Simulator Execution Order

        ## Execution discipline

        The queue is ordered by current blocker removal, proof sensitivity, and live-onboarding lead time. Later phases still stay visible in the same manifest so work does not drift into hidden mock debt.

        {"".join(sections)}

        ## Scheduling rule

        Build the simulator contract and validator first, then the browser studio, then any provider-like seed data. Do not start a later phase by skipping the proof-bearing rows above it.
        """
    )


def render_delta_register_doc(manifest: dict[str, Any], gap_map: dict[str, Any]) -> str:
    gap_rows = gap_map["gap_rows"]
    return dedent(
        f"""\
        # 38 Real Provider Delta Register

        Generated: `{manifest["generated_at"]}`
        Current actual-provider posture: `blocked`

        ## Actual_provider_strategy_later

        Every simulator row below has one explicit live-provider delta path: replace with live under guard, stay hybrid, or remain a permanent fallback. No row is allowed to drift into undefined coexistence.

        | Simulator | Replacement mode | Required live evidence | Unchanged contract elements | Migration/coexistence tests | Blocked live gates |
        | --- | --- | --- | --- | --- | --- |
        {"".join(f'| {md_cell(row["simulator_label"])} | `{row["replacement_mode"]}` | {md_cell(row["required_live_evidence"])} | {md_cell(row["unchanged_contract_elements"])} | {md_cell(row["migration_tests"])} | {md_cell([gate["gate_id"] for gate in row["blocked_live_gates"]])} |\n' for row in gap_rows)}

        ## Replacement law

        - `replace_with_live_guarded`: runtime traffic may move to the live provider later, but only after the simulator contract stays green in CI
        - `hybrid_contract_twin`: mock and live paths coexist across local, preview, and provider-like environments
        - `permanent_fallback`: the simulator remains a legitimate long-lived fallback because optionality, repair, or replay drills still need it
        """
    )


def render_fidelity_policy_doc(manifest: dict[str, Any]) -> str:
    rows = manifest["simulators"]
    class_rows = manifest["fidelity_classes"]
    mapping_rows = [
        {
            "fidelity_class": fidelity["fidelity_class"],
            "simulators": [row["simulator_label"] for row in rows if row["minimum_fidelity_class"] == fidelity["fidelity_class"]],
        }
        for fidelity in class_rows
        if fidelity["simulator_count"] > 0
    ]
    return dedent(
        f"""\
        # 38 Simulator Fidelity Policy

        ## Policy statement

        Fidelity class is a contract promise, not a UI polish label. The backlog uses the lightest class that still preserves proof, degraded, expiry, replay, and manual-fallback truth.

        ## Class catalogue

        | Class | Allowed for | Must preserve | Must not omit | Default tests | Used now |
        | --- | --- | --- | --- | --- | --- |
        {"".join(f'| `{row["fidelity_class"]}` | {md_cell(row["allowed_for"])} | {md_cell(row["must_preserve"])} | {md_cell(row["must_not_omit"])} | {md_cell(row["default_tests"])} | {"yes" if row["used_in_backlog"] else "no"} |\n' for row in class_rows)}

        ## Backlog coverage by fidelity class

        | Class | Simulators |
        | --- | --- |
        {"".join(f'| `{row["fidelity_class"]}` | {md_cell(row["simulators"])} |\n' for row in mapping_rows)}

        ## Enforcement

        - `shape_only` is not allowed for any baseline-critical row in seq_038
        - any row carrying proof objects or closure blockers must be at least `proof_twin`
        - any row whose risk model depends on delayed, missing, contradictory, or quarantined outcomes must be `fault_injection_twin`
        - any row mapped to later provider onboarding must publish unchanged contract elements before live work starts
        """
    )


def render_manifest_readme(manifest: dict[str, Any]) -> str:
    return dedent(
        f"""\
        # Adapter Simulator Manifest Contracts

        Seq_038 publishes the canonical simulator backlog at:

        - `/Users/test/Code/V/data/analysis/adapter_simulator_contract_manifest.json`
        - `/Users/test/Code/V/data/analysis/adapter_simulator_backlog.csv`
        - `/Users/test/Code/V/data/analysis/adapter_real_provider_gap_map.json`

        ## Purpose

        This folder is the contract boundary for local adapter simulators. It exists so later tasks can reuse one manifest for:

        - generator-driven docs and internal studios
        - validator and Playwright checks
        - seed-data selection for simulator services
        - live-provider replacement planning without mock drift

        ## Non-negotiable rules

        - simulators preserve proof, ambiguity, degraded, expiry, and manual-fallback semantics
        - live onboarding never changes those semantics without updating the manifest and delta register
        - runtime success from a simulator is never treated as live external confirmation
        - optional or deferred seams still need explicit replacement or fallback posture

        ## Update flow

        1. Edit `tools/analysis/build_adapter_simulator_backlog.py`.
        2. Re-run the generator.
        3. Run `tools/analysis/validate_adapter_simulator_backlog.py`.
        4. Run `tests/playwright/adapter-simulator-backlog-studio.spec.js --run`.

        ## Current summary

        - simulator rows: `{manifest["summary"]["simulator_count"]}`
        - execution phases: `{manifest["summary"]["execution_phase_count"]}`
        - replacement modes: guarded `{manifest["summary"]["replace_with_live_guarded_count"]}`, hybrid `{manifest["summary"]["hybrid_contract_twin_count"]}`, permanent fallback `{manifest["summary"]["permanent_fallback_count"]}`
        """
    )


def render_html(manifest: dict[str, Any]) -> str:
    payload = json.dumps(manifest).replace("</", "<\\/")
    template = dedent(
        """\
        <!doctype html>
        <html lang="en">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>38 Simulator Backlog Studio</title>
          <link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='18' fill='%234F46E5'/%3E%3Cpath d='M20 18h24v8H30v8h12v8H30v10h-10V18z' fill='white'/%3E%3C/svg%3E">
          <style>
            :root {{
              --canvas: #F6F7FB;
              --rail: #EEF1F7;
              --panel: #FFFFFF;
              --inset: #F3F5FA;
              --text-strong: #111827;
              --text: #1F2937;
              --text-muted: #667085;
              --border-subtle: #E5E7EB;
              --border-default: #CBD5E1;
              --primary: #4F46E5;
              --fidelity: #0EA5A4;
              --priority: #2563EB;
              --blocked: #C24141;
              --fallback: #D97706;
              --shadow: 0 24px 60px rgba(17, 24, 39, 0.08);
              --radius-xl: 28px;
              --radius-lg: 22px;
              --radius-md: 16px;
              --rail-width: 296px;
              --inspector-width: 360px;
              --mono: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
              --sans: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
            }}
            * {{ box-sizing: border-box; }}
            html {{ color-scheme: light; }}
            body {{
              margin: 0;
              font-family: var(--sans);
              color: var(--text);
              background:
                radial-gradient(circle at top left, rgba(79, 70, 229, 0.12), transparent 24%),
                radial-gradient(circle at top right, rgba(14, 165, 164, 0.08), transparent 22%),
                linear-gradient(180deg, #fbfcfe, var(--canvas));
            }}
            body[data-reduced-motion="true"] * {{
              animation-duration: 0ms !important;
              transition-duration: 0ms !important;
              scroll-behavior: auto !important;
            }}
            .page {{
              max-width: 1440px;
              margin: 0 auto;
              padding: 14px;
            }}
            .masthead-shell {{
              position: sticky;
              top: 0;
              z-index: 40;
              padding-top: 6px;
              background: linear-gradient(180deg, rgba(246,247,251,0.98), rgba(246,247,251,0.92) 76%, rgba(246,247,251,0));
              backdrop-filter: blur(10px);
            }}
            .panel {{
              background: var(--panel);
              border: 1px solid rgba(255,255,255,0.72);
              border-radius: var(--radius-xl);
              box-shadow: var(--shadow);
              backdrop-filter: blur(12px);
            }}
            .masthead {{
              min-height: 72px;
              display: grid;
              gap: 18px;
              padding: 18px 20px;
              background: linear-gradient(160deg, rgba(255,255,255,0.98), rgba(243,245,250,0.95));
            }}
            .masthead-top {{
              display: flex;
              gap: 18px;
              justify-content: space-between;
              align-items: flex-start;
              flex-wrap: wrap;
            }}
            .brand-block {{
              display: grid;
              gap: 10px;
              max-width: 80ch;
            }}
            .brand-row {{
              display: flex;
              gap: 12px;
              align-items: center;
              flex-wrap: wrap;
            }}
            .brand-mark {{
              width: 60px;
              height: 60px;
              border-radius: 20px;
              display: inline-flex;
              align-items: center;
              justify-content: center;
              background: linear-gradient(150deg, #4F46E5, #0EA5A4);
              color: white;
              box-shadow: 0 18px 30px rgba(79, 70, 229, 0.25);
            }}
            .eyebrow {{
              display: inline-flex;
              align-items: center;
              gap: 10px;
              text-transform: uppercase;
              letter-spacing: 0.16em;
              font-size: 12px;
              color: var(--text-muted);
            }}
            h1 {{
              margin: 0;
              font-size: clamp(32px, 4vw, 48px);
              line-height: 0.96;
              letter-spacing: -0.045em;
              color: var(--text-strong);
            }}
            .subtitle {{
              margin: 0;
              font-size: 15px;
              line-height: 1.6;
              color: var(--text-muted);
            }}
            .pill-row {{
              display: flex;
              gap: 10px;
              flex-wrap: wrap;
              align-content: start;
              justify-content: flex-end;
            }}
            .pill {{
              min-height: 44px;
              display: inline-flex;
              align-items: center;
              gap: 10px;
              padding: 10px 14px;
              border-radius: 999px;
              border: 1px solid var(--border-default);
              background: rgba(255,255,255,0.94);
              color: var(--text);
              font-size: 13px;
            }}
            .pill strong {{
              color: var(--text-strong);
              font-size: 18px;
            }}
            .layout {{
              margin-top: 16px;
              display: grid;
              grid-template-columns: var(--rail-width) minmax(0, 1fr) var(--inspector-width);
              gap: 16px;
              align-items: start;
            }}
            .rail, .workspace, .inspector {{
              padding: 18px;
            }}
            .section-title {{
              margin: 0 0 10px;
              font-size: 12px;
              text-transform: uppercase;
              letter-spacing: 0.16em;
              color: var(--text-muted);
            }}
            .filter-grid {{
              display: grid;
              gap: 12px;
              margin-bottom: 16px;
            }}
            .field {{
              display: grid;
              gap: 6px;
            }}
            label {{
              font-size: 11px;
              color: var(--text-muted);
              letter-spacing: 0.1em;
              text-transform: uppercase;
            }}
            select {{
              min-height: 44px;
              border-radius: 14px;
              border: 1px solid var(--border-default);
              background: white;
              color: var(--text);
              padding: 0 12px;
              font: inherit;
            }}
            .phase-list {{
              display: grid;
              gap: 12px;
            }}
            .phase-card {{
              min-height: 96px;
              padding: 14px;
              border-radius: 18px;
              border: 1px solid var(--border-default);
              background: linear-gradient(180deg, rgba(255,255,255,0.98), rgba(243,245,250,0.94));
              display: grid;
              gap: 8px;
            }}
            .phase-card strong {{
              color: var(--text-strong);
              font-size: 15px;
            }}
            .phase-card span {{
              color: var(--text-muted);
              font-size: 12px;
              line-height: 1.45;
            }}
            .workspace {{
              display: grid;
              gap: 16px;
            }}
            .workspace-top {{
              display: grid;
              grid-template-columns: minmax(0, 1.35fr) minmax(320px, 0.65fr);
              gap: 16px;
            }}
            .card {{
              border: 1px solid var(--border-subtle);
              border-radius: var(--radius-lg);
              padding: 16px;
              background: rgba(255,255,255,0.98);
            }}
            .table-header {{
              display: flex;
              gap: 12px;
              justify-content: space-between;
              align-items: center;
              flex-wrap: wrap;
            }}
            .table-scroll {{
              overflow: auto;
            }}
            table {{
              width: 100%;
              border-collapse: collapse;
            }}
            th, td {{
              text-align: left;
              padding: 12px 8px;
              border-bottom: 1px solid var(--border-subtle);
              vertical-align: top;
              line-height: 1.45;
            }}
            th {{
              font-size: 11px;
              text-transform: uppercase;
              letter-spacing: 0.12em;
              color: var(--text-muted);
            }}
            tbody tr {{
              min-height: 52px;
              cursor: pointer;
            }}
            tbody tr:hover,
            tbody tr[data-selected="true"] {{
              background: rgba(79, 70, 229, 0.08);
            }}
            .sim-cell {{
              display: grid;
              gap: 8px;
            }}
            .chip-row {{
              display: flex;
              gap: 8px;
              flex-wrap: wrap;
            }}
            .chip {{
              display: inline-flex;
              align-items: center;
              min-height: 24px;
              padding: 4px 8px;
              border-radius: 999px;
              background: var(--inset);
              color: var(--text-muted);
              font-size: 11px;
              text-transform: uppercase;
              letter-spacing: 0.04em;
            }}
            .chip.priority {{ background: rgba(37, 99, 235, 0.12); color: var(--priority); }}
            .chip.fidelity {{ background: rgba(14, 165, 164, 0.14); color: var(--fidelity); }}
            .chip.blocked {{ background: rgba(194, 65, 65, 0.12); color: var(--blocked); }}
            .chip.fallback {{ background: rgba(217, 119, 6, 0.14); color: var(--fallback); }}
            .chip.mode {{ background: rgba(79, 70, 229, 0.12); color: var(--primary); }}
            .mono {{
              font-family: var(--mono);
              font-size: 12px;
            }}
            .muted {{
              color: var(--text-muted);
            }}
            .legend-grid {{
              display: grid;
              gap: 12px;
            }}
            .legend-card {{
              border: 1px solid var(--border-default);
              border-radius: 18px;
              padding: 14px;
              background: linear-gradient(180deg, rgba(255,255,255,0.98), rgba(243,245,250,0.94));
              display: grid;
              gap: 8px;
            }}
            .matrix-grid {{
              display: grid;
              gap: 8px;
            }}
            .matrix-row {{
              display: grid;
              grid-template-columns: 160px repeat(4, minmax(0, 1fr));
              gap: 8px;
              align-items: center;
            }}
            .matrix-cell {{
              min-height: 42px;
              border-radius: 14px;
              border: 1px solid var(--border-default);
              background: linear-gradient(180deg, rgba(255,255,255,0.98), rgba(243,245,250,0.94));
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 13px;
              color: var(--text);
            }}
            .matrix-label {{
              font-size: 12px;
              color: var(--text-muted);
              text-transform: uppercase;
              letter-spacing: 0.08em;
            }}
            .path-grid {{
              display: grid;
              grid-template-columns: repeat(3, minmax(0, 1fr));
              gap: 12px;
            }}
            .path-card {{
              min-height: 108px;
              border-radius: 18px;
              border: 1px solid var(--border-default);
              background: linear-gradient(180deg, rgba(255,255,255,0.98), rgba(243,245,250,0.94));
              padding: 14px;
              display: grid;
              gap: 8px;
            }}
            .path-card strong {{
              color: var(--text-strong);
              font-size: 16px;
            }}
            .parity-wrap {{
              display: grid;
              gap: 14px;
            }}
            .inspector-scroll {{
              position: sticky;
              top: 102px;
              max-height: calc(100vh - 124px);
              overflow: auto;
              padding-right: 4px;
              display: grid;
              gap: 14px;
            }}
            .metric-grid {{
              display: grid;
              grid-template-columns: repeat(2, minmax(0, 1fr));
              gap: 10px;
            }}
            .metric {{
              border: 1px solid var(--border-subtle);
              border-radius: 16px;
              background: rgba(255,255,255,0.98);
              padding: 12px;
            }}
            .metric span {{
              display: block;
              font-size: 11px;
              color: var(--text-muted);
              text-transform: uppercase;
              letter-spacing: 0.12em;
              margin-bottom: 6px;
            }}
            .metric strong {{
              font-size: 15px;
              color: var(--text-strong);
            }}
            .list {{
              margin: 0;
              padding-left: 18px;
              display: grid;
              gap: 8px;
            }}
            .lower-grid {{
              display: grid;
              gap: 16px;
            }}
            .execution-strip {{
              display: grid;
              grid-template-columns: repeat(4, minmax(0, 1fr));
              gap: 12px;
            }}
            .execution-card {{
              border: 1px solid var(--border-default);
              border-radius: 18px;
              padding: 14px;
              background: linear-gradient(180deg, rgba(255,255,255,0.98), rgba(243,245,250,0.94));
              display: grid;
              gap: 8px;
            }}
            .sr-only {{
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
            button:focus-visible,
            select:focus-visible,
            tr:focus-visible {{
              outline: 3px solid rgba(79, 70, 229, 0.24);
              outline-offset: 2px;
            }}
            @media (max-width: 1260px) {{
              .layout {{
                grid-template-columns: var(--rail-width) minmax(0, 1fr);
              }}
              .inspector {{
                grid-column: 1 / -1;
              }}
              .inspector-scroll {{
                position: static;
                max-height: none;
                overflow: visible;
              }}
            }}
            @media (max-width: 980px) {{
              .layout,
              .workspace-top,
              .execution-strip,
              .path-grid {{
                grid-template-columns: 1fr;
              }}
              .matrix-row {{
                grid-template-columns: 1fr;
              }}
            }}
            @media (max-width: 640px) {{
              .page {{ padding: 10px; }}
              .rail, .workspace, .inspector {{ padding: 14px; }}
              .pill-row {{ justify-content: flex-start; }}
              .metric-grid {{ grid-template-columns: 1fr; }}
              th, td {{ padding: 10px 6px; font-size: 12px; }}
            }}
          </style>
        </head>
        <body>
          <div class="page" data-testid="studio-shell">
            <div class="masthead-shell">
              <section class="masthead panel" aria-label="Simulator foundry summary">
                <div class="masthead-top">
                  <div class="brand-block">
                    <div class="brand-row">
                      <div class="brand-mark" aria-hidden="true">
                        <svg width="34" height="34" viewBox="0 0 34 34" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <rect x="2" y="2" width="30" height="30" rx="10" stroke="white" stroke-width="2"/>
                          <path d="M11 11H24V16H16V19H22V24H11V19H14V16H11V11Z" fill="white"/>
                        </svg>
                      </div>
                      <div>
                        <div class="eyebrow">Vecells <span class="mono">SIM_FOUNDRY</span></div>
                        <h1>Simulator Foundry Board</h1>
                      </div>
                    </div>
                    <p class="subtitle">
                      A contract-first backlog for unavailable, manual, delayed, or gated integration seams.
                      The board ranks what to build now, how faithful each twin must be, and how each one later
                      graduates, stays hybrid, or remains a permanent fallback.
                    </p>
                  </div>
                  <div class="pill-row">
                    <div class="pill"><strong id="sim-count"></strong><span>Simulators</span></div>
                    <div class="pill"><strong id="baseline-count"></strong><span>Baseline critical</span></div>
                    <div class="pill"><strong id="proof-count"></strong><span>Proof twins</span></div>
                    <div class="pill"><strong id="blocker-count"></strong><span>Unresolved live blockers</span></div>
                  </div>
                </div>
              </section>
            </div>

            <div class="layout">
              <aside class="panel rail" data-testid="filter-rail">
                <h2 class="section-title">Filters</h2>
                <div class="filter-grid">
                  <div class="field">
                    <label for="filter-priority">Priority tier</label>
                    <select id="filter-priority" data-testid="filter-priority">
                      <option value="all">All priorities</option>
                    </select>
                  </div>
                  <div class="field">
                    <label for="filter-fidelity">Fidelity</label>
                    <select id="filter-fidelity" data-testid="filter-fidelity">
                      <option value="all">All fidelity classes</option>
                    </select>
                  </div>
                  <div class="field">
                    <label for="filter-phase">Execution phase</label>
                    <select id="filter-phase" data-testid="filter-phase">
                      <option value="all">All phases</option>
                    </select>
                  </div>
                  <div class="field">
                    <label for="filter-family">Dependency family</label>
                    <select id="filter-family" data-testid="filter-family">
                      <option value="all">All families</option>
                    </select>
                  </div>
                </div>

                <h2 class="section-title">Execution phases</h2>
                <div class="phase-list" id="phase-list"></div>
              </aside>

              <main class="panel workspace">
                <div class="workspace-top">
                  <section class="card" data-testid="backlog-table">
                    <div class="table-header">
                      <div>
                        <h2 class="section-title">Prioritized backlog</h2>
                        <p class="muted" id="table-summary"></p>
                      </div>
                      <div class="field" style="min-width: 220px;">
                        <label for="sort-select">Sort backlog</label>
                        <select id="sort-select" data-testid="sort-select">
                          <option value="priority_desc">Priority high to low</option>
                          <option value="priority_asc">Priority low to high</option>
                          <option value="family_asc">Family A-Z</option>
                          <option value="fidelity_asc">Fidelity A-Z</option>
                          <option value="phase_asc">Phase order</option>
                        </select>
                      </div>
                    </div>
                    <div class="table-scroll">
                      <table>
                        <thead>
                          <tr>
                            <th>Rank</th>
                            <th>Simulator</th>
                            <th>Phase</th>
                            <th>Priority</th>
                            <th>Fidelity</th>
                            <th>Replacement</th>
                          </tr>
                        </thead>
                        <tbody id="backlog-body"></tbody>
                      </table>
                    </div>
                  </section>

                  <section class="card" data-testid="fidelity-legend">
                    <h2 class="section-title">Fidelity legend</h2>
                    <div class="legend-grid" id="legend-grid"></div>
                    <div class="parity-wrap">
                      <div>
                        <h3 class="section-title">Simulator to live path</h3>
                        <div class="path-grid" id="path-grid"></div>
                      </div>
                      <div>
                        <h3 class="section-title">Priority × fidelity matrix</h3>
                        <div class="matrix-grid" id="matrix-grid"></div>
                      </div>
                      <div>
                        <h3 class="section-title">Table parity</h3>
                        <table data-testid="parity-table">
                          <thead>
                            <tr>
                              <th>Fidelity</th>
                              <th>Critical</th>
                              <th>High</th>
                              <th>Medium</th>
                              <th>Watch</th>
                            </tr>
                          </thead>
                          <tbody id="parity-body"></tbody>
                        </table>
                      </div>
                    </div>
                  </section>
                </div>

                <section class="card lower-grid">
                  <div>
                    <h2 class="section-title">Execution strip</h2>
                    <div class="execution-strip" id="execution-strip" data-testid="execution-strip"></div>
                  </div>
                </section>
              </main>

              <aside class="panel inspector" data-testid="simulator-inspector">
                <div class="inspector-scroll" id="inspector-scroll"></div>
              </aside>
            </div>
          </div>

          <script>
            const manifest = __MANIFEST_PAYLOAD__;
            const state = {{
              priority: "all",
              fidelity: "all",
              phase: "all",
              family: "all",
              sort: "priority_desc",
              selectedId: manifest.simulators[0].simulator_id,
            }};

            const phaseOrder = manifest.execution_phases.map((row) => row.phase_id);
            const fidelityOrder = manifest.fidelity_classes.map((row) => row.fidelity_class);
            const priorityOrder = manifest.scoring_model.priority_tiers.map((row) => row.tier);

            const elements = {{
              simCount: document.getElementById("sim-count"),
              baselineCount: document.getElementById("baseline-count"),
              proofCount: document.getElementById("proof-count"),
              blockerCount: document.getElementById("blocker-count"),
              tableSummary: document.getElementById("table-summary"),
              backlogBody: document.getElementById("backlog-body"),
              legendGrid: document.getElementById("legend-grid"),
              pathGrid: document.getElementById("path-grid"),
              matrixGrid: document.getElementById("matrix-grid"),
              parityBody: document.getElementById("parity-body"),
              inspector: document.getElementById("inspector-scroll"),
              executionStrip: document.getElementById("execution-strip"),
              phaseList: document.getElementById("phase-list"),
              prioritySelect: document.getElementById("filter-priority"),
              fidelitySelect: document.getElementById("filter-fidelity"),
              phaseSelect: document.getElementById("filter-phase"),
              familySelect: document.getElementById("filter-family"),
              sortSelect: document.getElementById("sort-select"),
            }};

            function setReducedMotionFlag() {{
              const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
              document.body.setAttribute("data-reduced-motion", reduced ? "true" : "false");
            }}

            function populateSelect(select, values, formatter) {{
              for (const value of values) {{
                const option = document.createElement("option");
                option.value = value;
                option.textContent = formatter(value);
                select.appendChild(option);
              }}
            }}

            function titleCase(value) {{
              return value.replace(/_/g, " ").replace(/(^|\\s)\\S/g, (char) => char.toUpperCase());
            }}

            function filteredRows() {{
              return manifest.simulators
                .filter((row) => state.priority === "all" || row.priority_tier === state.priority)
                .filter((row) => state.fidelity === "all" || row.minimum_fidelity_class === state.fidelity)
                .filter((row) => state.phase === "all" || row.execution_phase === state.phase)
                .filter((row) => state.family === "all" || row.family === state.family)
                .sort((left, right) => {{
                  if (state.sort === "priority_desc") return right.priority_score - left.priority_score || left.priority_rank - right.priority_rank;
                  if (state.sort === "priority_asc") return left.priority_score - right.priority_score || left.priority_rank - right.priority_rank;
                  if (state.sort === "family_asc") return left.family.localeCompare(right.family) || left.priority_rank - right.priority_rank;
                  if (state.sort === "fidelity_asc") return fidelityOrder.indexOf(left.minimum_fidelity_class) - fidelityOrder.indexOf(right.minimum_fidelity_class) || left.priority_rank - right.priority_rank;
                  if (state.sort === "phase_asc") return phaseOrder.indexOf(left.execution_phase) - phaseOrder.indexOf(right.execution_phase) || left.priority_rank - right.priority_rank;
                  return left.priority_rank - right.priority_rank;
                }});
            }}

            function chip(label, className) {{
              return `<span class="chip ${className}">${{label}}</span>`;
            }}

            function renderBacklog() {{
              const rows = filteredRows();
              if (!rows.some((row) => row.simulator_id === state.selectedId)) {{
                state.selectedId = rows[0]?.simulator_id ?? manifest.simulators[0].simulator_id;
              }}
              elements.tableSummary.textContent = `${{rows.length}} simulator rows visible under the current filter set.`;
              elements.backlogBody.innerHTML = rows.map((row) => `
                <tr
                  data-testid="sim-row-${{row.simulator_id}}"
                  data-selected="${{row.simulator_id === state.selectedId}}"
                  tabindex="0"
                  data-simulator-id="${{row.simulator_id}}"
                >
                  <td class="mono">${{row.priority_rank}}</td>
                  <td>
                    <div class="sim-cell">
                      <strong>${{row.simulator_label}}</strong>
                      <span class="mono muted">${{row.simulator_id}}</span>
                      <div class="chip-row">
                        ${{chip(row.priority_tier, "priority")}}
                        ${{chip(row.family, "mode")}}
                        ${{row.blocked_live_gate_count ? chip(`${{row.blocked_live_gate_count}} blockers`, "blocked") : ""}}
                        ${{row.permanent_fallback ? chip("Permanent fallback", "fallback") : ""}}
                      </div>
                    </div>
                  </td>
                  <td>${{titleCase(row.execution_phase.replace("phase_", "wave_"))}}</td>
                  <td>${{row.priority_score}}</td>
                  <td><span class="mono">${{row.minimum_fidelity_class}}</span></td>
                  <td><span class="mono">${{row.replacement_mode}}</span></td>
                </tr>
              `).join("");

              for (const row of elements.backlogBody.querySelectorAll("tr")) {{
                row.addEventListener("click", () => {{
                  state.selectedId = row.dataset.simulatorId;
                  renderBacklog();
                  renderInspector();
                }});
                row.addEventListener("keydown", (event) => {{
                  const allRows = [...elements.backlogBody.querySelectorAll("tr")];
                  const index = allRows.indexOf(row);
                  if (event.key === "ArrowDown" && index < allRows.length - 1) {{
                    event.preventDefault();
                    allRows[index + 1].focus();
                    state.selectedId = allRows[index + 1].dataset.simulatorId;
                    renderBacklog();
                    renderInspector();
                  }}
                  if (event.key === "ArrowUp" && index > 0) {{
                    event.preventDefault();
                    allRows[index - 1].focus();
                    state.selectedId = allRows[index - 1].dataset.simulatorId;
                    renderBacklog();
                    renderInspector();
                  }}
                  if (event.key === "Enter" || event.key === " ") {{
                    event.preventDefault();
                    state.selectedId = row.dataset.simulatorId;
                    renderBacklog();
                    renderInspector();
                  }}
                }});
              }}
            }}

            function renderLegend() {{
              const rows = manifest.fidelity_classes.filter((row) => row.simulator_count > 0);
              elements.legendGrid.innerHTML = rows.map((row) => `
                <div class="legend-card">
                  <div class="chip-row">
                    ${chip(row.fidelity_class, "fidelity")}
                    ${chip(`${{row.simulator_count}} sims`, "mode")}
                  </div>
                  <strong>${{row.title}}</strong>
                  <div class="muted">${{row.must_preserve}}</div>
                </div>
              `).join("");
            }}

            function renderReplacementModes() {{
              elements.pathGrid.innerHTML = manifest.replacement_modes.map((row) => `
                <div class="path-card">
                  <span class="matrix-label">${{row.replacement_mode}}</span>
                  <strong>${{row.title}}</strong>
                  <div class="muted">${{row.meaning}}</div>
                  <div class="chip-row">${chip(`${{row.simulator_count}} sims`, "mode")}</div>
                </div>
              `).join("");
            }}

            function renderMatrix() {{
              const tiers = manifest.scoring_model.priority_tiers.map((row) => row.tier);
              const labels = `<div class="matrix-row"><div class="matrix-label">Fidelity</div>${{tiers.map((tier) => `<div class="matrix-label">${{tier}}</div>`).join("")}}</div>`;
              const rows = manifest.priority_fidelity_matrix.map((row) => `
                <div class="matrix-row">
                  <div class="matrix-label">${{row.fidelity_class}}</div>
                  ${{tiers.map((tier) => `<div class="matrix-cell">${{row[tier]}}</div>`).join("")}}
                </div>
              `).join("");
              elements.matrixGrid.innerHTML = labels + rows;
              elements.parityBody.innerHTML = manifest.priority_fidelity_matrix.map((row) => `
                <tr>
                  <td class="mono">${{row.fidelity_class}}</td>
                  <td>${{row.critical}}</td>
                  <td>${{row.high}}</td>
                  <td>${{row.medium}}</td>
                  <td>${{row.watch}}</td>
                </tr>
              `).join("");
            }}

            function renderExecutionStrip() {{
              elements.executionStrip.innerHTML = manifest.execution_phases.map((row) => `
                <div class="execution-card">
                  <span class="matrix-label">${{row.phase_id}}</span>
                  <strong>${{row.title}}</strong>
                  <div class="muted">${{row.summary}}</div>
                  <div class="chip-row">
                    ${chip(`${{row.simulator_count}} sims`, "mode")}
                    ${chip(`${{row.critical_count}} critical`, "priority")}
                  </div>
                </div>
              `).join("");

              elements.phaseList.innerHTML = manifest.execution_phases.map((row) => `
                <div class="phase-card">
                  <strong>${{row.title}}</strong>
                  <span>${{row.summary}}</span>
                  <div class="chip-row">
                    ${chip(`${{row.simulator_count}} sims`, "mode")}
                    ${chip(`${{row.critical_count}} critical`, "priority")}
                  </div>
                </div>
              `).join("");
            }}

            function renderInspector() {{
              const row = manifest.simulators.find((item) => item.simulator_id === state.selectedId) ?? manifest.simulators[0];
              const blockedChips = row.blocked_live_gate_ids.map((gateId) => chip(gateId, "blocked")).join("");
              const reviewChips = row.review_live_gate_ids.map((gateId) => chip(gateId, "mode")).join("");
              elements.inspector.innerHTML = `
                <section class="card">
                  <div class="chip-row">
                    ${chip(row.priority_tier, "priority")}
                    ${chip(row.minimum_fidelity_class, "fidelity")}
                    ${chip(row.replacement_mode, "mode")}
                    ${{row.permanent_fallback ? chip("Permanent fallback", "fallback") : ""}}
                  </div>
                  <h2>${{row.simulator_label}}</h2>
                  <p class="muted mono">${{row.simulator_id}}</p>
                  <p>${{row.current_blocker_removed}}</p>
                  <div class="metric-grid">
                    <div class="metric"><span>Priority score</span><strong>${{row.priority_score}}</strong></div>
                    <div class="metric"><span>Priority rank</span><strong>${{row.priority_rank}}</strong></div>
                    <div class="metric"><span>Blocked gates</span><strong>${{row.blocked_live_gate_count}}</strong></div>
                    <div class="metric"><span>Phase</span><strong>${{row.execution_phase}}</strong></div>
                  </div>
                </section>

                <section class="card">
                  <h3 class="section-title">Proof semantics</h3>
                  <ul class="list">${{row.authoritative_proof_semantics.map((item) => `<li>${{item}}</li>`).join("")}}</ul>
                </section>

                <section class="card">
                  <h3 class="section-title">Ambiguity and degraded behavior</h3>
                  <ul class="list">${{row.ambiguity_behaviors.map((item) => `<li>${{item}}</li>`).join("")}}</ul>
                </section>

                <section class="card">
                  <h3 class="section-title">Live blockers and reviews</h3>
                  <div class="chip-row">${{blockedChips || chip("No blocked gates in selected pack subset", "mode")}}</div>
                  <div class="chip-row" style="margin-top: 10px;">${{reviewChips}}</div>
                </section>

                <section class="card">
                  <h3 class="section-title">Tests now</h3>
                  <ul class="list">${{row.test_types.map((item) => `<li>${{item}}</li>`).join("")}}</ul>
                </section>

                <section class="card">
                  <h3 class="section-title">Live evidence and migration</h3>
                  <ul class="list">${{row.required_live_evidence.map((item) => `<li>${{item}}</li>`).join("")}}</ul>
                  <h3 class="section-title" style="margin-top: 16px;">Migration/coexistence tests</h3>
                  <ul class="list">${{row.migration_tests.map((item) => `<li>${{item}}</li>`).join("")}}</ul>
                </section>
              `;
            }}

            function updateHeader() {{
              elements.simCount.textContent = manifest.summary.simulator_count;
              elements.baselineCount.textContent = manifest.summary.baseline_critical_count;
              elements.proofCount.textContent = manifest.summary.proof_twin_count;
              elements.blockerCount.textContent = manifest.summary.blocked_live_gate_instances;
            }}

            function wireFilters() {{
              elements.prioritySelect.addEventListener("change", (event) => {{
                state.priority = event.target.value;
                renderBacklog();
                renderInspector();
              }});
              elements.fidelitySelect.addEventListener("change", (event) => {{
                state.fidelity = event.target.value;
                renderBacklog();
                renderInspector();
              }});
              elements.phaseSelect.addEventListener("change", (event) => {{
                state.phase = event.target.value;
                renderBacklog();
                renderInspector();
              }});
              elements.familySelect.addEventListener("change", (event) => {{
                state.family = event.target.value;
                renderBacklog();
                renderInspector();
              }});
              elements.sortSelect.addEventListener("change", (event) => {{
                state.sort = event.target.value;
                renderBacklog();
                renderInspector();
              }});
            }}

            function init() {{
              setReducedMotionFlag();
              updateHeader();
              populateSelect(elements.prioritySelect, priorityOrder, titleCase);
              populateSelect(elements.fidelitySelect, fidelityOrder.filter((value) => manifest.simulators.some((row) => row.minimum_fidelity_class === value)), (value) => value);
              populateSelect(elements.phaseSelect, phaseOrder, titleCase);
              populateSelect(elements.familySelect, [...new Set(manifest.simulators.map((row) => row.family))].sort(), titleCase);
              wireFilters();
              renderLegend();
              renderReplacementModes();
              renderMatrix();
              renderExecutionStrip();
              renderBacklog();
              renderInspector();
            }}

            init();
          </script>
        </body>
        </html>
        """
    )
    return template.replace("{{", "{").replace("}}", "}").replace(
        "__MANIFEST_PAYLOAD__", payload
    )


def write_docs(manifest: dict[str, Any], gap_map: dict[str, Any]) -> None:
    ensure_dir(DOCS_DIR)
    BACKLOG_DOC_PATH.write_text(render_backlog_doc(manifest))
    EXECUTION_ORDER_DOC_PATH.write_text(render_execution_order_doc(manifest))
    DELTA_REGISTER_DOC_PATH.write_text(render_delta_register_doc(manifest, gap_map))
    FIDELITY_POLICY_DOC_PATH.write_text(render_fidelity_policy_doc(manifest))
    BACKLOG_STUDIO_HTML_PATH.write_text(render_html(manifest))


def write_manifest_readme(manifest: dict[str, Any]) -> None:
    ensure_dir(SERVICES_DIR)
    MANIFEST_README_PATH.write_text(render_manifest_readme(manifest))


def main() -> None:
    missing = [name for name, path in REQUIRED_INPUTS.items() if not path.exists()]
    if missing:
        raise SystemExit("Missing seq_038 prerequisites: " + ", ".join(sorted(missing)))

    inputs = {name: load_json(path) for name, path in REQUIRED_INPUTS.items()}
    if inputs["coverage_summary"]["summary"]["requirements_with_gaps_count"] != 0:
        raise SystemExit("Seq_019 coverage summary drifted; requirements_with_gaps_count must stay zero")

    rows = build_rows(inputs)
    priority_scores = build_priority_scores(rows)
    gap_map = build_gap_map(rows)
    manifest = build_manifest(rows, inputs)

    write_csv(rows)
    write_json(PRIORITY_SCORES_JSON_PATH, priority_scores)
    write_json(REAL_PROVIDER_GAP_MAP_JSON_PATH, gap_map)
    write_json(CONTRACT_MANIFEST_JSON_PATH, manifest)
    write_docs(manifest, gap_map)
    write_manifest_readme(manifest)


if __name__ == "__main__":
    main()
