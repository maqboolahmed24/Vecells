#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
import re
from datetime import datetime, timezone
from pathlib import Path
from textwrap import dedent
from typing import Any


ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = ROOT / "data" / "analysis"
DOCS_DIR = ROOT / "docs" / "external"

TASK_ID = "seq_040"
VISUAL_MODE = "Contract_Cockpit"
CAPTURED_ON = "2026-04-11"
GENERATED_AT = datetime.now(timezone.utc).isoformat(timespec="seconds")
MISSION = (
    "Freeze the authoritative external-integration assumption ledger and degraded-mode "
    "default pack so Vecells can execute mock-now simulator work and later live-provider "
    "work without silent truth drift."
)

REQUIRED_INPUTS = {
    "external_dependencies": DATA_DIR / "external_dependencies.json",
    "simulator_manifest": DATA_DIR / "adapter_simulator_contract_manifest.json",
    "provider_gap_map": DATA_DIR / "adapter_real_provider_gap_map.json",
    "live_gate_rules": DATA_DIR / "live_mutation_gate_rules.json",
}

ASSUMPTION_LEDGER_CSV_PATH = DATA_DIR / "integration_assumption_ledger.csv"
DEGRADED_DEFAULTS_JSON_PATH = DATA_DIR / "degraded_mode_defaults.json"
PROVIDER_CONTRACT_DEFAULTS_YAML_PATH = DATA_DIR / "provider_contract_defaults.yaml"
CONFLICT_REGISTER_JSON_PATH = DATA_DIR / "integration_contract_conflict_register.json"

ASSUMPTIONS_DOC_PATH = DOCS_DIR / "40_integration_contract_assumptions.md"
DEGRADED_DOC_PATH = DOCS_DIR / "40_degraded_mode_defaults.md"
MOCK_VS_ACTUAL_DOC_PATH = DOCS_DIR / "40_mock_vs_actual_contract_delta.md"
CONFLICT_DOC_PATH = DOCS_DIR / "40_integration_contract_conflict_register.md"
COCKPIT_HTML_PATH = DOCS_DIR / "40_integration_contract_cockpit.html"

SOURCE_PRECEDENCE = [
    "prompt/040.md",
    "prompt/shared_operating_contract_036_to_045.md",
    "prompt/AGENT.md",
    "prompt/checklist.md",
    "blueprint/blueprint-init.md",
    "blueprint/phase-0-the-foundation-protocol.md",
    "blueprint/platform-runtime-and-release-blueprint.md",
    "blueprint/platform-frontend-blueprint.md",
    "blueprint/ux-quiet-clarity-redesign.md",
    "blueprint/forensic-audit-findings.md",
    "data/analysis/external_dependencies.json",
    "data/analysis/adapter_simulator_contract_manifest.json",
    "data/analysis/adapter_real_provider_gap_map.json",
    "data/analysis/live_mutation_gate_rules.json",
    "docs/external/24_nhs_login_actual_onboarding_strategy.md",
    "docs/external/25_nhs_login_environment_profile_pack.md",
    "docs/external/27_pds_access_request_strategy.md",
    "docs/external/28_mesh_message_route_and_proof_matrix.md",
    "docs/external/29_nhs_app_sandpit_to_aos_progression_pack.md",
    "docs/external/30_real_registration_and_hosting_strategy.md",
    "docs/external/32_local_telephony_lab_spec.md",
    "docs/external/33_local_notification_studio_spec.md",
    "docs/external/35_local_evidence_processing_lab_spec.md",
    "docs/external/36_gp_system_pathways_actual_strategy.md",
    "docs/external/37_pharmacy_access_paths_actual_strategy.md",
    "docs/external/38_local_adapter_simulator_backlog.md",
    "docs/external/39_manual_approval_checkpoint_register.md",
]

GLOBAL_ASSUMPTIONS = [
    {
        "assumption_id": "ASSUMPTION_PROOF_AND_DEGRADATION_ARE_SEPARATE_FACTS",
        "summary": (
            "Authoritative proof, insufficient evidence, ambiguity, degraded continuity, "
            "and manual fallback remain distinct states and cannot be collapsed into generic "
            "success or generic failure."
        ),
    },
    {
        "assumption_id": "ASSUMPTION_SIMULATOR_AND_LIVE_SHARE_ONE_CONTRACT",
        "summary": (
            "Simulator rows and future live-provider rows share one contract ledger; live "
            "onboarding may only override adapter-facing details through explicit conflict registration."
        ),
    },
    {
        "assumption_id": "ASSUMPTION_AUDIENCE_POSTURE_MUST_MATCH_TRUTH",
        "summary": (
            "Patient, staff, and support surfaces may differ in calmness and detail, but none "
            "may imply finality when the governing dependency row remains ambiguous, degraded, or blocked."
        ),
    },
]

FAMILY_META = {
    "identity_access": {
        "label": "Identity & access",
        "accent": "primary",
        "description": "Authentication and governed enrichment defaults that decide whether writable authority may exist at all.",
    },
    "communications": {
        "label": "Communications",
        "accent": "proof",
        "description": "Patient and staff delivery rails where send acceptance is weaker than delivery truth.",
    },
    "evidence_processing": {
        "label": "Evidence processing",
        "accent": "degraded",
        "description": "Transcript and artifact scanning seams where readiness, quarantine, and replay remain explicit.",
    },
    "gp_booking": {
        "label": "GP booking",
        "accent": "primary",
        "description": "IM1, supplier, and capacity assumptions that gate booking confirmation truth.",
    },
    "messaging_transport": {
        "label": "Messaging transport",
        "accent": "ambiguity",
        "description": "Cross-organisation messaging and acknowledgement rails where transport evidence never settles business truth alone.",
    },
    "pharmacy": {
        "label": "Pharmacy",
        "accent": "degraded",
        "description": "Choice, dispatch, outcome, and urgent-return defaults with explicit continuity-safe fallback.",
    },
    "embedded_channels": {
        "label": "Embedded channels",
        "accent": "ambiguity",
        "description": "Deferred embedded-channel assumptions kept explicit without widening current scope.",
    },
    "assurance_watch": {
        "label": "Assurance watch",
        "accent": "blocked",
        "description": "Watchlist and optional-vendor dependencies that must fail closed to observe-only, shadow-only, or release-blocking posture.",
    },
}

SCOPE_LABELS = {
    "baseline_required": "Baseline required",
    "optional_flagged": "Optional flagged",
    "deferred_phase7": "Deferred phase 7",
    "future_optional": "Future optional",
}

BLOCKER_META = {
    "watch_only": {"label": "Watch only", "rank": 1},
    "operational_blocker": {"label": "Operational blocker", "rank": 2},
    "hard_blocker": {"label": "Hard blocker", "rank": 3},
}

FALLBACK_LADDER = [
    {
        "stage": "Proof",
        "meaning": "Current authoritative proof objects are present and the dependency can support truthful calmness.",
        "ui_posture": "Only this rung may support final calm completion.",
    },
    {
        "stage": "Ambiguity",
        "meaning": "Signals exist but do not satisfy the authoritative proof contract, or they contradict the current tuple.",
        "ui_posture": "Pending, review, or held posture stays explicit.",
    },
    {
        "stage": "Degraded",
        "meaning": "The system can continue in a bounded downgraded mode without pretending the external truth has settled.",
        "ui_posture": "Read-only, degraded, or continuity-safe posture remains explicit.",
    },
    {
        "stage": "Manual Fallback",
        "meaning": "A named human-owned path, assisted action, or operational handoff becomes the governing route.",
        "ui_posture": "Manual assistance and evidence capture become visible, not hidden in notes.",
    },
]

DEPENDENCY_DEFAULTS = {
    "dep_nhs_login_rail": {
        "family": "identity_access",
        "live_profiles": ["nhs_login"],
        "source_docs": [
            "docs/external/24_nhs_login_actual_onboarding_strategy.md",
            "docs/external/25_nhs_login_environment_profile_pack.md",
        ],
        "ambiguity_class": "auth_authority_pending",
        "default_contract_axis": "writable_authority",
        "conflict_class": "identity_authority_override",
        "degraded_mode_default": "Freeze the route in claim-pending or auth-read-only posture until writable authority is re-proven for the same subject and route intent.",
        "manual_fallback_default": "Route to support-assisted recovery or a secure-link continuation path without widening identity truth.",
        "patient_visible_posture_default": "Show sign-in succeeded but access is still being confirmed; do not imply full portal ownership yet.",
        "staff_visible_posture_default": "Display the current binding state, route-intent fence, and any claim-pending blocker before staff attempt recovery.",
        "support_visible_posture_default": "Surface the redirect review, partner approval state, and subject-lineage mismatch cues needed for assisted recovery.",
    },
    "dep_pds_fhir_enrichment": {
        "family": "identity_access",
        "live_profiles": ["pds"],
        "source_docs": ["docs/external/27_pds_access_request_strategy.md"],
        "ambiguity_class": "governed_enrichment_withheld",
        "default_contract_axis": "optional_enrichment",
        "conflict_class": "identity_enrichment_override",
        "degraded_mode_default": "Keep enrichment fully off and rely on local matching only; do not widen patient identity confidence from incomplete or legally unapproved PDS signals.",
        "manual_fallback_default": "Support-assisted correction or governed local review without changing the baseline identity contract.",
        "patient_visible_posture_default": "Continue with the baseline identity journey and avoid mentioning unseen PDS enrichment.",
        "staff_visible_posture_default": "Mark enrichment withheld, feature-flagged, or review-required and preserve local matching evidence separately.",
        "support_visible_posture_default": "Expose legal-basis, access-mode, and wrong-patient rollback readiness requirements before enabling enrichment.",
    },
    "dep_telephony_ivr_recording_provider": {
        "family": "communications",
        "live_profiles": ["telephony"],
        "source_docs": ["docs/external/32_local_telephony_lab_spec.md"],
        "ambiguity_class": "contact_evidence_incomplete",
        "default_contract_axis": "evidence_readiness",
        "conflict_class": "contact_proof_override",
        "degraded_mode_default": "Hold the request in callback, audio-review, or urgent-live-only posture when recording availability is weaker than evidence readiness.",
        "manual_fallback_default": "Escalate to governed manual callback or urgent live diversion with explicit operator ownership.",
        "patient_visible_posture_default": "Acknowledge that contact is in progress or needs follow-up; do not imply clinically usable evidence exists yet.",
        "staff_visible_posture_default": "Show callback lineage, recording availability, and urgent preemption state separately from contact success.",
        "support_visible_posture_default": "Expose vendor, number, spend, and webhook readiness blockers before any live telephony mutation continues.",
    },
    "dep_transcription_processing_provider": {
        "family": "evidence_processing",
        "live_profiles": ["evidence"],
        "source_docs": ["docs/external/35_local_evidence_processing_lab_spec.md"],
        "ambiguity_class": "readiness_not_safety_usable",
        "default_contract_axis": "transcript_readiness",
        "conflict_class": "derived_evidence_override",
        "degraded_mode_default": "Keep transcript output in degraded, manual-review, or continuation-challenge posture until readiness is explicitly safety-usable.",
        "manual_fallback_default": "Route to manual transcription or audio review and keep superseded transcript runs visible for comparison.",
        "patient_visible_posture_default": "No patient-facing completion state may depend on transcript availability alone.",
        "staff_visible_posture_default": "Flag transcript coverage, supersession, and review requirements before any derived facts are treated as dependable.",
        "support_visible_posture_default": "Expose region, retention, callback security, and operator-acknowledgement requirements for live provider rollout.",
    },
    "dep_sms_notification_provider": {
        "family": "communications",
        "live_profiles": ["notification"],
        "source_docs": ["docs/external/33_local_notification_studio_spec.md"],
        "ambiguity_class": "delivery_or_recipient_disputed",
        "default_contract_axis": "seeded_continuation_delivery",
        "conflict_class": "notification_delivery_override",
        "degraded_mode_default": "Withdraw seeded continuation trust and fall back to challenge-based continuation or another governed contact route when recipient or delivery truth is disputed.",
        "manual_fallback_default": "Support reissue or bounded callback under the same grant lineage rather than silent re-send.",
        "patient_visible_posture_default": "Explain that the link or message may need to be reissued; do not imply the message safely reached the intended recipient.",
        "staff_visible_posture_default": "Keep wrong-recipient suspicion, delivery ambiguity, and redemption fences explicit before reissuing.",
        "support_visible_posture_default": "Show sender ownership, spend control, and repair-policy blockers required for live SMS widening.",
    },
    "dep_email_notification_provider": {
        "family": "communications",
        "live_profiles": ["notification"],
        "source_docs": ["docs/external/33_local_notification_studio_spec.md"],
        "ambiguity_class": "delivery_or_thread_unresolved",
        "default_contract_axis": "delivery_truth",
        "conflict_class": "notification_delivery_override",
        "degraded_mode_default": "Preserve a read-only, pending-delivery, or repair-needed posture until current delivery evidence or a governed fallback settles the route.",
        "manual_fallback_default": "Use controlled resend, callback escalation, or support repair under the same authoritative communication chain.",
        "patient_visible_posture_default": "Show that the message was prepared but delivery is still being confirmed or repaired.",
        "staff_visible_posture_default": "Expose bounce, suppression, expiry, and resend windows before marking the communication settled.",
        "support_visible_posture_default": "Show verified sender/domain state, webhook security, and project-scope approvals for the current provider.",
    },
    "dep_malware_scanning_provider": {
        "family": "evidence_processing",
        "live_profiles": ["evidence"],
        "source_docs": ["docs/external/35_local_evidence_processing_lab_spec.md"],
        "ambiguity_class": "quarantine_or_scan_conflict",
        "default_contract_axis": "quarantine_verdict",
        "conflict_class": "artifact_verdict_override",
        "degraded_mode_default": "Fail closed into quarantined, unreadable, or reacquire-required posture until the current artifact verdict is explicit.",
        "manual_fallback_default": "Manual review, re-upload, or release-from-quarantine under named operator approval only.",
        "patient_visible_posture_default": "No patient-facing progress claim may rely on an unverified artifact becoming usable.",
        "staff_visible_posture_default": "Display quarantine, timeout, and conflicting verdict states distinctly from ordinary processing delays.",
        "support_visible_posture_default": "Expose storage-scope, quarantine-policy, and mutation-gate blockers before widening live scanning.",
    },
    "dep_im1_pairing_programme": {
        "family": "gp_booking",
        "live_profiles": ["im1"],
        "source_docs": ["docs/external/36_gp_system_pathways_actual_strategy.md"],
        "ambiguity_class": "programme_gate_not_cleared",
        "default_contract_axis": "programme_gate",
        "conflict_class": "programme_gate_override",
        "degraded_mode_default": "Keep the path simulator-only, supported-test-only, or assisted-only until the exact supplier and environment clear the IM1 stage pack.",
        "manual_fallback_default": "Hub fallback or human-assisted booking handling where policy allows, with no false live-availability claim.",
        "patient_visible_posture_default": "Do not promise direct supplier booking while programme prerequisites remain incomplete.",
        "staff_visible_posture_default": "Expose the current supplier, stage, and supported-test status before surfacing live-path availability.",
        "support_visible_posture_default": "Show sponsor, commercial owner, and approver gaps that still block live supplier movement.",
    },
    "dep_gp_system_supplier_paths": {
        "family": "gp_booking",
        "live_profiles": ["gp", "im1"],
        "source_docs": ["docs/external/36_gp_system_pathways_actual_strategy.md"],
        "ambiguity_class": "supplier_capability_not_bound",
        "default_contract_axis": "supplier_capability",
        "conflict_class": "supplier_binding_override",
        "degraded_mode_default": "Keep supplier paths in simulator, assisted-only, or reconciliation-required posture until the current supplier binding and supported action tuple are published.",
        "manual_fallback_default": "Fallback to hub handling, waitlist, callback, or manual practice liaison depending on the current policy tuple.",
        "patient_visible_posture_default": "Explain availability depends on the current supplier path and may require assisted booking or fallback.",
        "staff_visible_posture_default": "Show supplier binding freshness, manage-capability gaps, and action-scope drift before staff commit or alter a booking.",
        "support_visible_posture_default": "Expose architecture, roster, and scorecard evidence for the selected supplier family and environment.",
    },
    "dep_local_booking_supplier_adapters": {
        "family": "gp_booking",
        "live_profiles": ["gp", "im1"],
        "source_docs": ["docs/external/36_gp_system_pathways_actual_strategy.md"],
        "ambiguity_class": "confirmation_pending_or_disputed",
        "default_contract_axis": "confirmation_truth",
        "conflict_class": "booking_confirmation_override",
        "degraded_mode_default": "Hold the booking in confirmation-pending, supplier-reconciliation-pending, waitlist, or callback fallback posture until durable confirmation proof exists.",
        "manual_fallback_default": "Use waitlist, callback, or manual reconciliation without projecting a booked state.",
        "patient_visible_posture_default": "Show that the request is being confirmed and avoid final appointment reassurance until confirmation truth settles.",
        "staff_visible_posture_default": "Separate slot rendering, async supplier acceptance, and durable booking proof in the operator view.",
        "support_visible_posture_default": "Surface supplier scorecard, fallback, and practice-ack implications before any live booking path widens.",
    },
    "dep_network_capacity_partner_feeds": {
        "family": "gp_booking",
        "live_profiles": ["gp"],
        "source_docs": ["docs/external/36_gp_system_pathways_actual_strategy.md"],
        "ambiguity_class": "freshness_or_trust_admission_unclear",
        "default_contract_axis": "capacity_admission",
        "conflict_class": "capacity_freshness_override",
        "degraded_mode_default": "Treat the feed as diagnostic-only, callback-only, or quarantined when freshness or trust admission no longer holds.",
        "manual_fallback_default": "Callback fallback or operational escalation with explicit provenance instead of stale direct offers.",
        "patient_visible_posture_default": "Tell patients availability is being checked or may require callback rather than presenting stale offers as safe choices.",
        "staff_visible_posture_default": "Keep source freshness, trust admission, and expiry visible before offers are surfaced or closure is attempted.",
        "support_visible_posture_default": "Expose partner provenance, freshness policy, and fallback-ownership evidence for live feeds.",
    },
    "dep_cross_org_secure_messaging_mesh": {
        "family": "messaging_transport",
        "live_profiles": ["mesh"],
        "source_docs": ["docs/external/28_mesh_message_route_and_proof_matrix.md"],
        "ambiguity_class": "transport_delivery_unproven",
        "default_contract_axis": "transport_receipt",
        "conflict_class": "transport_vs_truth_override",
        "degraded_mode_default": "Keep the route in pending-delivery, monitored-mailbox, or escalation posture when transport receipt is weaker than current delivery evidence.",
        "manual_fallback_default": "Use monitored mailbox review or telephone escalation where policy allows, under the same idempotent effect chain.",
        "patient_visible_posture_default": "Do not present a downstream organisation handoff as complete while transport truth remains pending.",
        "staff_visible_posture_default": "Show replay fence, delivery observation, and escalation state distinctly from message send acceptance.",
        "support_visible_posture_default": "Surface owner ODS, manager mode, and minimum-necessary review gates before widening live transport.",
    },
    "dep_origin_practice_ack_rail": {
        "family": "messaging_transport",
        "live_profiles": ["gp", "mesh"],
        "source_docs": [
            "docs/external/28_mesh_message_route_and_proof_matrix.md",
            "docs/external/36_gp_system_pathways_actual_strategy.md",
        ],
        "ambiguity_class": "ack_generation_unsettled",
        "default_contract_axis": "ack_generation",
        "conflict_class": "acknowledgement_generation_override",
        "degraded_mode_default": "Keep practice visibility in overdue-ack, recovery-required, or exception-pending posture until the current truth tuple is acknowledged or explicitly excepted.",
        "manual_fallback_default": "Operational escalation and duty-task follow-up on the same truth tuple rather than silent debt clearance.",
        "patient_visible_posture_default": "Do not let patient reassurance outrun unresolved practice acknowledgement duty.",
        "staff_visible_posture_default": "Show ack generation, overdue timers, and exception policy separately from raw transport delivery.",
        "support_visible_posture_default": "Expose which changes require renewed acknowledgement and the escalation path for stale or missing ack proof.",
    },
    "dep_pharmacy_directory_dohs": {
        "family": "pharmacy",
        "live_profiles": ["pharmacy"],
        "source_docs": ["docs/external/37_pharmacy_access_paths_actual_strategy.md"],
        "ambiguity_class": "directory_snapshot_or_choice_drift",
        "default_contract_axis": "choice_tuple",
        "conflict_class": "pharmacy_choice_override",
        "degraded_mode_default": "Regenerate the directory, warn about drift, or constrain to clinician-guided choice when the current snapshot is stale or materially changed.",
        "manual_fallback_default": "Clinician-guided provider choice or renewed consent before dispatch if no safe current directory tuple remains.",
        "patient_visible_posture_default": "Show that pharmacy options are being refreshed or need reconfirmation rather than treating stale choice as settled.",
        "staff_visible_posture_default": "Expose snapshot age, capability drift, and choice-tuple changes before dispatch continues.",
        "support_visible_posture_default": "Show directory access-path and choice-compliance blockers before live discovery widens.",
    },
    "dep_pharmacy_referral_transport": {
        "family": "pharmacy",
        "live_profiles": ["pharmacy"],
        "source_docs": ["docs/external/37_pharmacy_access_paths_actual_strategy.md"],
        "ambiguity_class": "dispatch_proof_pending_or_contradicted",
        "default_contract_axis": "dispatch_proof",
        "conflict_class": "pharmacy_dispatch_override",
        "degraded_mode_default": "Hold the referral in proof-pending, contradiction-review, or controlled-redispatch posture until current dispatch proof and acknowledgement thresholds are satisfied.",
        "manual_fallback_default": "Manual-assisted dispatch with attestation and second-person review where the route policy requires it.",
        "patient_visible_posture_default": "Tell the patient the referral is being delivered or checked; do not claim completed dispatch from transport acceptance alone.",
        "staff_visible_posture_default": "Keep dispatch proof, acknowledgement, expiry, and contradiction scores distinct in the operational view.",
        "support_visible_posture_default": "Expose transport-path selection, route tuple, and attestation rules before widening live dispatch.",
    },
    "dep_pharmacy_outcome_observation": {
        "family": "pharmacy",
        "live_profiles": ["pharmacy"],
        "source_docs": ["docs/external/37_pharmacy_access_paths_actual_strategy.md"],
        "ambiguity_class": "outcome_match_or_replay_unresolved",
        "default_contract_axis": "outcome_reconciliation",
        "conflict_class": "pharmacy_outcome_override",
        "degraded_mode_default": "Keep the case in outcome-reconciliation-pending or safety-review posture until the outcome matches the active case and replay concerns are cleared.",
        "manual_fallback_default": "Manual structured capture or clarification with no auto-close on weak, duplicate, or delayed outcome evidence.",
        "patient_visible_posture_default": "Avoid implying the pharmacy pathway is complete while outcome truth is still being reconciled.",
        "staff_visible_posture_default": "Show match quality, replay suspicion, and reopen requirements before closing or routing the case onward.",
        "support_visible_posture_default": "Expose assured source-combination and reconciliation-policy blockers before enabling live auto-apply behavior.",
    },
    "dep_pharmacy_urgent_return_professional_routes": {
        "family": "pharmacy",
        "live_profiles": ["pharmacy"],
        "source_docs": ["docs/external/37_pharmacy_access_paths_actual_strategy.md"],
        "ambiguity_class": "urgent_return_unacknowledged",
        "default_contract_axis": "urgent_return_ack",
        "conflict_class": "urgent_return_route_override",
        "manual_live_evidence": [
            "Named monitored mailbox or professional-call route bound to the active practice ownership model",
            "Urgent-return rehearsal proving acknowledgements are actually observed and escalated",
            "Current environment and route tuple showing which human-owned path is live",
        ],
        "manual_non_negotiables": [
            "Urgent return remains a human-operated safety net and cannot collapse into ordinary Update Record semantics",
            "Acknowledgement on the current route is required before the case can look settled",
            "Phone escalation remains explicit when the monitored digital path is unavailable",
        ],
        "manual_provider_flex": [
            "Monitored mailbox or professional-number identifiers",
            "Practice-level rota and escalation ownership details",
            "Route acknowledgement wording and local handoff cadence",
        ],
        "degraded_mode_default": "Treat the route as unavailable or unsafe until urgent-return ownership and current acknowledgement are explicit.",
        "manual_fallback_default": "Immediate supervisor or duty escalation by phone when the monitored digital route is unavailable or unacknowledged.",
        "patient_visible_posture_default": "Acknowledge that urgent clinical follow-up is being escalated; do not imply a mailbox alone settled the return.",
        "staff_visible_posture_default": "Keep route ownership, acknowledgement, and rehearseability visible before relying on the safety-net route.",
        "support_visible_posture_default": "Expose monitored address or number ownership, rehearsal evidence, and escalation expectations for urgent return.",
    },
    "dep_nhs_app_embedded_channel_ecosystem": {
        "family": "embedded_channels",
        "live_profiles": ["nhs_app", "nhs_login"],
        "source_docs": [
            "docs/external/29_nhs_app_sandpit_to_aos_progression_pack.md",
            "docs/external/30_real_registration_and_hosting_strategy.md",
        ],
        "ambiguity_class": "embedded_manifest_or_bridge_drift",
        "default_contract_axis": "embedded_eligibility",
        "conflict_class": "embedded_channel_override",
        "degraded_mode_default": "Drop to safe browser handoff, read-only embed, or placeholder-only posture when manifest, bridge, or embedded continuity evidence drifts.",
        "manual_fallback_default": "Use governed release review and manual site-link confirmation before widening embedded routes.",
        "patient_visible_posture_default": "Explain that the service may continue in the browser if the embedded route is not currently eligible.",
        "staff_visible_posture_default": "Expose manifest stage, embedded eligibility, and bridge-capability mismatches without masking them as generic channel errors.",
        "support_visible_posture_default": "Show commissioning, accessibility, demo-environment, and NHS login readiness blockers for the current embedded stage.",
    },
    "dep_assistive_model_vendor_family": {
        "family": "assurance_watch",
        "live_profiles": [],
        "source_docs": [
            "blueprint/platform-runtime-and-release-blueprint.md",
            "blueprint/forensic-audit-findings.md",
        ],
        "ambiguity_class": "trust_envelope_shadow_only",
        "default_contract_axis": "trust_envelope",
        "conflict_class": "assistive_rollout_override",
        "default_freshness_days": 21,
        "manual_live_evidence": [
            "Current supplier assurance pack for the exact route family and cohort",
            "Rollback rehearsal and kill-switch proof tied to the proposed rollout tuple",
            "Named approver, live cohort definition, and trust-envelope freshness",
        ],
        "manual_non_negotiables": [
            "Assistive vendors remain optional and may not become a baseline correctness dependency",
            "Shadow-only, observe-only, hidden, or frozen states remain first-class outcomes",
            "Human provenance and rollback paths stay explicit even when a vendor is healthy",
        ],
        "manual_provider_flex": [
            "Vendor scoring and inference metadata shape",
            "Subprocessor inventory and region posture",
            "Drafting or summarisation surface details that remain behind adapter boundaries",
        ],
        "manual_live_gate_required": [
            "Named approver and live cohort definition",
            "Fresh supplier assurance and subprocessor review",
            "Rollback rehearsal and kill-switch proof before widening beyond shadow or observe-only",
        ],
        "manual_actual_provider_tasks": ["seq_040"],
        "degraded_mode_default": "Force assistive capability back to shadow-only, observe-only, provenance-only, or hidden posture whenever the trust envelope is degraded, stale, or quarantined.",
        "manual_fallback_default": "Continue the core workflow with no model dependency and preserve provenance-only evidence for later review.",
        "patient_visible_posture_default": "No patient-facing promise may depend on assistive vendor output being available or trusted.",
        "staff_visible_posture_default": "Show assistive capability as optional, shadowed, or frozen and keep human-authored truth separate from model suggestions.",
        "support_visible_posture_default": "Expose assurance drift, rollout rung, and kill-switch state before any live cohort widens.",
    },
    "dep_nhs_assurance_and_standards_sources": {
        "family": "assurance_watch",
        "live_profiles": [],
        "source_docs": [
            "blueprint/platform-runtime-and-release-blueprint.md",
            "blueprint/forensic-audit-findings.md",
        ],
        "ambiguity_class": "standards_baseline_stale_or_moved",
        "default_contract_axis": "standards_watchlist",
        "conflict_class": "standards_source_override",
        "default_freshness_days": 7,
        "manual_live_evidence": [
            "Current standards version map for the release or onboarding pack under review",
            "Governance acknowledgement that refreshed standards baselines were rechecked",
            "Evidence-pack refresh proving release assumptions still match the current watchlist",
        ],
        "manual_non_negotiables": [
            "Release and onboarding assumptions must stay bound to the current standards watchlist",
            "Stale or moved standards sources block widening until reviewed explicitly",
            "Standards exceptions remain explicit and time-bounded rather than implied",
        ],
        "manual_provider_flex": [
            "Source-link locations and naming changes",
            "Supplier-assurance attachment formats",
            "Review cadence for refreshed or retired guidance sources",
        ],
        "manual_live_gate_required": [
            "Governance sign-off on refreshed standards baselines",
            "Current watchlist evidence attached to the release or onboarding candidate",
            "Explicit exception registration if any dependency assumption diverges from the current source set",
        ],
        "manual_actual_provider_tasks": ["seq_040"],
        "degraded_mode_default": "Freeze the affected onboarding, release, or provider assumption pack until the current standards baseline is rechecked and mapped.",
        "manual_fallback_default": "Open an explicit standards exception or evidence-gap register entry rather than silently proceeding.",
        "patient_visible_posture_default": "No direct patient copy change; affected release or provider widening stays withheld until standards truth is current.",
        "staff_visible_posture_default": "Show which assurance or release assumptions are blocked by stale source-of-law evidence.",
        "support_visible_posture_default": "Expose missing baseline refreshes, suspended supplier assurance, and explicit exception requirements for remediation.",
    },
}


def assert_true(condition: bool, message: str) -> None:
    if not condition:
        raise SystemExit(message)


def repo_rel(path: Path) -> str:
    return path.relative_to(ROOT).as_posix()


def load_json(path: Path) -> Any:
    return json.loads(path.read_text())


def write_text(path: Path, text: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text.rstrip() + "\n")


def write_json(path: Path, payload: Any) -> None:
    write_text(path, json.dumps(payload, indent=2, ensure_ascii=False))


def dedupe(values: list[Any]) -> list[Any]:
    seen: list[Any] = []
    for value in values:
        if value not in seen:
            seen.append(value)
    return seen


def flatten_unique(chunks: list[list[str]]) -> list[str]:
    items: list[str] = []
    for chunk in chunks:
        items.extend(chunk)
    return dedupe([item for item in items if item])


def titleize(value: str) -> str:
    return value.replace("_", " ").replace("-", " ").title()


def md_cell(value: Any) -> str:
    if isinstance(value, list):
        return "<br>".join(md_cell(item) for item in value)
    text = str(value)
    return text.replace("|", "&#124;").replace("\n", "<br>")


def build_markdown_table(headers: list[str], rows: list[list[Any]]) -> str:
    lines = [
        "| " + " | ".join(headers) + " |",
        "| " + " | ".join(["---"] * len(headers)) + " |",
    ]
    for row in rows:
        lines.append("| " + " | ".join(md_cell(cell) for cell in row) + " |")
    return "\n".join(lines)


def derive_blocker_impact(scope: str, affects_patient_visible_truth: bool) -> str:
    if scope == "baseline_required" and affects_patient_visible_truth:
        return "hard_blocker"
    if scope == "baseline_required":
        return "operational_blocker"
    return "watch_only"


def derive_closure_blocker(
    blocker_impact: str,
    dependency_name: str,
    affects_patient_visible_truth: bool,
) -> str:
    if blocker_impact == "hard_blocker":
        return (
            f"{dependency_name} is closure-blocking: no calm patient close, booking confirmation, "
            "dispatch settlement, or route completion may proceed while proof remains ambiguous, degraded, or manual-only."
        )
    if blocker_impact == "operational_blocker":
        return (
            f"{dependency_name} blocks onboarding, release, or downstream operator truth; patient-visible calmness may continue "
            "only when no new external truth is implied."
        )
    if affects_patient_visible_truth:
        return (
            f"{dependency_name} stays feature-flagged or deferred; if enabled later, ambiguity still blocks truthful close and "
            "must not be flattened into optional success."
        )
    return (
        f"{dependency_name} remains a watch-only or optional contract row; baseline flow continues, but release or rollout widening "
        "must stop if its evidence drifts."
    )


def parse_contract_objects(text: str) -> list[str]:
    tokens = re.findall(r"\b[A-Z][A-Za-z0-9]+(?:[A-Z][A-Za-z0-9]+)+\b", text)
    return dedupe(tokens)


def humanize_env_keys(keys: list[str]) -> list[str]:
    return [key.lower().replace("_", " ") for key in keys]


def format_list(values: list[str], separator: str = " | ") -> str:
    return separator.join(values)


def yaml_scalar(value: Any) -> str:
    if isinstance(value, bool):
        return "true" if value else "false"
    if value is None:
        return "null"
    if isinstance(value, (int, float)):
        return str(value)
    return json.dumps(str(value), ensure_ascii=False)


def dump_yaml(value: Any, indent: int = 0) -> list[str]:
    prefix = "  " * indent
    if isinstance(value, dict):
        if not value:
            return [prefix + "{}"]
        lines: list[str] = []
        for key, item in value.items():
            if isinstance(item, (dict, list)):
                if isinstance(item, list) and not item:
                    lines.append(f"{prefix}{key}: []")
                elif isinstance(item, dict) and not item:
                    lines.append(f"{prefix}{key}: {{}}")
                else:
                    lines.append(f"{prefix}{key}:")
                    lines.extend(dump_yaml(item, indent + 1))
            else:
                lines.append(f"{prefix}{key}: {yaml_scalar(item)}")
        return lines
    if isinstance(value, list):
        if not value:
            return [prefix + "[]"]
        lines = []
        for item in value:
            if isinstance(item, (dict, list)):
                if isinstance(item, list) and not item:
                    lines.append(f"{prefix}- []")
                elif isinstance(item, dict) and not item:
                    lines.append(f"{prefix}- {{}}")
                else:
                    lines.append(f"{prefix}-")
                    lines.extend(dump_yaml(item, indent + 1))
            else:
                lines.append(f"{prefix}- {yaml_scalar(item)}")
        return lines
    return [prefix + yaml_scalar(value)]


def ensure_inputs() -> None:
    missing = [str(path) for path in REQUIRED_INPUTS.values() if not path.exists()]
    assert_true(not missing, "Missing seq_040 inputs:\n" + "\n".join(missing))


def build_dependency_rows() -> tuple[list[dict[str, Any]], list[dict[str, Any]], dict[str, Any]]:
    dependency_payload = load_json(REQUIRED_INPUTS["external_dependencies"])
    simulator_payload = load_json(REQUIRED_INPUTS["simulator_manifest"])
    gap_payload = load_json(REQUIRED_INPUTS["provider_gap_map"])
    live_gate_payload = load_json(REQUIRED_INPUTS["live_gate_rules"])

    dependencies = dependency_payload["dependencies"]
    simulators = simulator_payload["simulators"]
    gap_rows = gap_payload["gap_rows"]
    profiles = live_gate_payload["provider_profiles"]

    simulator_by_dependency: dict[str, list[dict[str, Any]]] = {}
    for simulator in simulators:
        for dependency_id in simulator["dependency_ids"]:
            simulator_by_dependency.setdefault(dependency_id, []).append(simulator)

    gap_by_simulator = {row["simulator_id"]: row for row in gap_rows}
    profile_by_key = {profile["source_pack_key"]: profile for profile in profiles}

    rows: list[dict[str, Any]] = []
    conflicts: list[dict[str, Any]] = []

    core_source_refs = [
        "prompt/040.md",
        "prompt/shared_operating_contract_036_to_045.md",
        repo_rel(REQUIRED_INPUTS["external_dependencies"]),
        repo_rel(REQUIRED_INPUTS["simulator_manifest"]),
        repo_rel(REQUIRED_INPUTS["provider_gap_map"]),
        repo_rel(REQUIRED_INPUTS["live_gate_rules"]),
    ]

    for dependency in dependencies:
        dependency_id = dependency["dependency_id"]
        meta = DEPENDENCY_DEFAULTS[dependency_id]
        family_key = meta["family"]
        family = FAMILY_META[family_key]
        simulator_rows = simulator_by_dependency.get(dependency_id, [])
        gap_rows_for_dependency = [
            gap_by_simulator[simulator["simulator_id"]]
            for simulator in simulator_rows
            if simulator["simulator_id"] in gap_by_simulator
        ]
        live_profiles = [profile_by_key[key] for key in meta["live_profiles"] if key in profile_by_key]

        proof_objects = dedupe(
            parse_contract_objects(dependency["authoritative_success_proof"])
            + flatten_unique([simulator["authoritative_proof_semantics"] for simulator in simulator_rows])
        )
        live_upgrade_evidence = flatten_unique(
            [row["required_live_evidence"] for row in gap_rows_for_dependency]
            + [profile["evidence_bundle_examples"] for profile in live_profiles]
        )
        if not live_upgrade_evidence:
            live_upgrade_evidence = meta.get("manual_live_evidence", [])

        non_negotiable_assumptions = flatten_unique(
            [row["unchanged_contract_elements"] for row in gap_rows_for_dependency]
        )
        if not non_negotiable_assumptions:
            non_negotiable_assumptions = meta.get("manual_non_negotiables", [])

        provider_variability_envelope = flatten_unique(
            [row["provider_specific_flex"] for row in gap_rows_for_dependency]
        )
        if not provider_variability_envelope:
            provider_variability_envelope = meta.get("manual_provider_flex", [])

        actual_provider_tasks = flatten_unique(
            [row["actual_provider_tasks"] for row in gap_rows_for_dependency]
        )
        if not actual_provider_tasks:
            actual_provider_tasks = meta.get("manual_actual_provider_tasks", ["seq_040"])

        required_env = flatten_unique([profile["required_env"] for profile in live_profiles])
        blocked_gate_ids = flatten_unique([profile["blocked_gate_ids"] for profile in live_profiles])
        review_gate_ids = flatten_unique([profile["review_gate_ids"] for profile in live_profiles])
        pass_gate_ids = flatten_unique([profile["pass_gate_ids"] for profile in live_profiles])
        freshness_window_days = (
            min(profile["max_evidence_age_days"] for profile in live_profiles)
            if live_profiles
            else meta.get("default_freshness_days", 21)
        )

        live_gate_or_approval_required = (
            [
                "Required env: " + format_list(humanize_env_keys(required_env), separator=", "),
                "Blocked gates: " + format_list(blocked_gate_ids, separator=", "),
                "Review gates: " + format_list(review_gate_ids, separator=", "),
            ]
            if live_profiles
            else meta.get("manual_live_gate_required", [])
        )

        simulator_counterparts = (
            [
                f"{simulator['simulator_label']} ({simulator['minimum_fidelity_class']}, {simulator['replacement_mode']})"
                for simulator in simulator_rows
            ]
            if simulator_rows
            else ["No current simulator counterpart; explicit watch-only contract pack only"]
        )
        blocker_impact = derive_blocker_impact(
            dependency["baseline_scope"],
            dependency["affects_patient_visible_truth"],
        )
        blocker_label = BLOCKER_META[blocker_impact]["label"]

        source_refs = dedupe(core_source_refs + meta["source_docs"])
        insufficient_evidence_patterns = dedupe(dependency["non_authoritative_signals"])
        ambiguity_modes = dedupe(dependency["ambiguity_modes"])
        fallback_or_recovery_modes = dedupe(dependency["fallback_or_recovery_modes"])
        manual_checkpoints = dedupe(dependency["manual_checkpoints"])

        explicit_override_rule = (
            "Provider-specific differences may only alter adapter-facing details such as "
            + format_list(provider_variability_envelope, separator=", ")
            + "; any change to proof thresholds, ambiguity boundaries, degraded posture, manual fallback, "
            "or audience posture requires a conflict-register entry before rollout."
        )

        row = {
            "dependency_id": dependency_id,
            "dependency_name": dependency["dependency_name"],
            "dependency_family": family_key,
            "dependency_family_label": family["label"],
            "dependency_class": dependency["dependency_class"],
            "baseline_scope": dependency["baseline_scope"],
            "baseline_scope_label": SCOPE_LABELS[dependency["baseline_scope"]],
            "canonical_purpose": dependency["business_purpose"],
            "authoritative_success_proof": dependency["authoritative_success_proof"],
            "authoritative_proof_objects": proof_objects,
            "insufficient_evidence_patterns": insufficient_evidence_patterns,
            "ambiguity_class": meta["ambiguity_class"],
            "ambiguity_label": titleize(meta["ambiguity_class"]),
            "ambiguity_modes": ambiguity_modes,
            "degraded_mode_default": meta["degraded_mode_default"],
            "manual_fallback_default": meta["manual_fallback_default"],
            "patient_visible_posture_default": meta["patient_visible_posture_default"],
            "staff_visible_posture_default": meta["staff_visible_posture_default"],
            "support_visible_posture_default": meta["support_visible_posture_default"],
            "closure_blocker_implications": derive_closure_blocker(
                blocker_impact,
                dependency["dependency_name"],
                dependency["affects_patient_visible_truth"],
            ),
            "simulator_counterparts": simulator_counterparts,
            "source_references": source_refs,
            "blocker_impact": blocker_impact,
            "blocker_label": blocker_label,
            "blocker_rank": BLOCKER_META[blocker_impact]["rank"],
            "freshness_window_days": freshness_window_days,
            "live_profile_keys": [profile["source_pack_key"] for profile in live_profiles],
            "required_gate_inputs": required_env,
            "blocked_gate_ids": blocked_gate_ids,
            "review_gate_ids": review_gate_ids,
            "pass_gate_ids": pass_gate_ids,
            "live_upgrade_evidence": live_upgrade_evidence,
            "non_negotiable_assumptions": non_negotiable_assumptions,
            "provider_variability_envelope": provider_variability_envelope,
            "live_gate_or_approval_required": live_gate_or_approval_required,
            "explicit_override_required": True,
            "default_contract_axis": meta["default_contract_axis"],
            "conflict_class": meta["conflict_class"],
            "explicit_override_rule": explicit_override_rule,
            "actual_provider_tasks": actual_provider_tasks,
            "manual_checkpoints": manual_checkpoints,
            "non_authoritative_signals": dependency["non_authoritative_signals"],
            "fallback_or_recovery_modes": fallback_or_recovery_modes,
            "notes": dependency["notes"],
            "simulator_bound": bool(simulator_rows),
            "affects_patient_visible_truth": dependency["affects_patient_visible_truth"],
        }
        rows.append(row)

        conflicts.append(
            {
                "conflict_id": f"conflict_{dependency_id.removeprefix('dep_')}",
                "dependency_id": dependency_id,
                "dependency_name": dependency["dependency_name"],
                "dependency_family": family_key,
                "dependency_family_label": family["label"],
                "status": "open" if dependency["baseline_scope"] == "baseline_required" else "watch",
                "conflict_class": meta["conflict_class"],
                "default_contract_axis": meta["default_contract_axis"],
                "provider_pressure_summary": (
                    format_list(provider_variability_envelope, separator="; ")
                    if provider_variability_envelope
                    else "No live-provider flex admitted yet; watch-only default remains frozen."
                ),
                "explicit_override_rule": explicit_override_rule,
                "live_gate_refs": dedupe(blocked_gate_ids + review_gate_ids) or live_gate_or_approval_required,
                "source_refs": source_refs,
                "simulator_counterparts": simulator_counterparts,
            }
        )

    summary = {
        "dependency_count": len(rows),
        "family_count": len({row["dependency_family"] for row in rows}),
        "ambiguous_default_count": sum(1 for row in rows if row["ambiguity_class"]),
        "degraded_default_count": sum(1 for row in rows if row["degraded_mode_default"]),
        "simulator_bound_count": sum(1 for row in rows if row["simulator_bound"]),
        "watch_contract_only_count": sum(1 for row in rows if not row["simulator_bound"]),
        "hard_blocker_count": sum(1 for row in rows if row["blocker_impact"] == "hard_blocker"),
        "operational_blocker_count": sum(1 for row in rows if row["blocker_impact"] == "operational_blocker"),
        "watch_only_count": sum(1 for row in rows if row["blocker_impact"] == "watch_only"),
        "conflict_count": len(conflicts),
        "unresolved_conflict_count": sum(1 for row in conflicts if row["status"] == "open"),
        "watch_conflict_count": sum(1 for row in conflicts if row["status"] == "watch"),
    }
    return rows, conflicts, summary


def build_csv_rows(rows: list[dict[str, Any]]) -> list[dict[str, str]]:
    output: list[dict[str, str]] = []
    for row in rows:
        output.append(
            {
                "dependency_id": row["dependency_id"],
                "dependency_name": row["dependency_name"],
                "dependency_family": row["dependency_family"],
                "baseline_scope": row["baseline_scope"],
                "blocker_impact": row["blocker_impact"],
                "freshness_window_days": str(row["freshness_window_days"]),
                "canonical_purpose": row["canonical_purpose"],
                "authoritative_success_proof": row["authoritative_success_proof"],
                "authoritative_proof_objects": format_list(row["authoritative_proof_objects"]),
                "insufficient_evidence_patterns": format_list(row["insufficient_evidence_patterns"]),
                "ambiguity_class": row["ambiguity_class"],
                "ambiguity_modes": format_list(row["ambiguity_modes"]),
                "degraded_mode_default": row["degraded_mode_default"],
                "manual_fallback_default": row["manual_fallback_default"],
                "patient_visible_posture_default": row["patient_visible_posture_default"],
                "staff_visible_posture_default": row["staff_visible_posture_default"],
                "support_visible_posture_default": row["support_visible_posture_default"],
                "closure_blocker_implications": row["closure_blocker_implications"],
                "simulator_counterparts": format_list(row["simulator_counterparts"]),
                "live_upgrade_evidence": format_list(row["live_upgrade_evidence"]),
                "non_negotiable_assumptions": format_list(row["non_negotiable_assumptions"]),
                "provider_variability_envelope": format_list(row["provider_variability_envelope"]),
                "live_gate_or_approval_required": format_list(row["live_gate_or_approval_required"]),
                "explicit_override_rule": row["explicit_override_rule"],
                "source_references": format_list(row["source_references"]),
            }
        )
    return output


def write_csv(path: Path, rows: list[dict[str, str]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=list(rows[0].keys()))
        writer.writeheader()
        writer.writerows(rows)


def build_degraded_defaults_payload(rows: list[dict[str, Any]], summary: dict[str, Any]) -> dict[str, Any]:
    return {
        "task_id": TASK_ID,
        "generated_at": GENERATED_AT,
        "captured_on": CAPTURED_ON,
        "visual_mode": VISUAL_MODE,
        "mission": MISSION,
        "source_precedence": SOURCE_PRECEDENCE,
        "assumptions": GLOBAL_ASSUMPTIONS,
        "fallback_ladder": FALLBACK_LADDER,
        "family_meta": FAMILY_META,
        "summary": summary,
        "dependencies": rows,
    }


def build_provider_contract_defaults_yaml_payload(rows: list[dict[str, Any]], summary: dict[str, Any]) -> dict[str, Any]:
    provider_rows = []
    for row in rows:
        provider_rows.append(
            {
                "dependency_id": row["dependency_id"],
                "dependency_family": row["dependency_family"],
                "live_profile_keys": row["live_profile_keys"],
                "freshness_window_days": row["freshness_window_days"],
                "non_negotiable_assumptions": row["non_negotiable_assumptions"],
                "provider_variability_envelope": row["provider_variability_envelope"],
                "required_gate_inputs": row["required_gate_inputs"],
                "blocked_gate_ids": row["blocked_gate_ids"],
                "review_gate_ids": row["review_gate_ids"],
                "pass_gate_ids": row["pass_gate_ids"],
                "live_upgrade_evidence": row["live_upgrade_evidence"],
                "explicit_override_required": row["explicit_override_required"],
                "explicit_override_rule": row["explicit_override_rule"],
                "actual_provider_tasks": row["actual_provider_tasks"],
            }
        )
    return {
        "task_id": TASK_ID,
        "generated_at": GENERATED_AT,
        "visual_mode": VISUAL_MODE,
        "summary": {
            "dependency_count": summary["dependency_count"],
            "unresolved_conflict_count": summary["unresolved_conflict_count"],
            "watch_contract_only_count": summary["watch_contract_only_count"],
        },
        "live_override_rules": [
            "Provider-specific changes are adapter-only until a conflict row explicitly allows them.",
            "Proof thresholds, ambiguity classes, degraded defaults, audience posture, and closure rules stay frozen by default.",
            "No live-provider pack may bypass named approver, fresh evidence, and explicit live-mutation intent.",
        ],
        "provider_defaults": provider_rows,
    }


def build_conflict_register_payload(conflicts: list[dict[str, Any]], summary: dict[str, Any]) -> dict[str, Any]:
    return {
        "task_id": TASK_ID,
        "generated_at": GENERATED_AT,
        "captured_on": CAPTURED_ON,
        "visual_mode": VISUAL_MODE,
        "summary": {
            "conflict_count": summary["conflict_count"],
            "unresolved_conflict_count": summary["unresolved_conflict_count"],
            "watch_conflict_count": summary["watch_conflict_count"],
        },
        "conflicts": conflicts,
    }


def render_assumptions_doc(rows: list[dict[str, Any]], summary: dict[str, Any]) -> str:
    mock_rows = [
        [
            f"`{row['dependency_id']}`<br>{row['dependency_name']}",
            row["dependency_family_label"],
            format_list(row["authoritative_proof_objects"], separator="<br>"),
            row["ambiguity_label"],
            row["degraded_mode_default"],
            row["manual_fallback_default"],
            row["blocker_label"],
        ]
        for row in rows
    ]
    actual_rows = [
        [
            f"`{row['dependency_id']}`",
            format_list(row["live_upgrade_evidence"], separator="<br>"),
            format_list(row["non_negotiable_assumptions"], separator="<br>"),
            format_list(row["provider_variability_envelope"], separator="<br>"),
            format_list(row["live_gate_or_approval_required"], separator="<br>"),
        ]
        for row in rows
    ]
    return dedent(
        f"""
        # 40 Integration Contract Assumptions

        - Task: `{TASK_ID}`
        - Visual mode: `{VISUAL_MODE}`
        - Captured on: `{CAPTURED_ON}`
        - Mission: {MISSION}

        ## Summary

        - Dependency rows: `{summary['dependency_count']}`
        - Ambiguous defaults named: `{summary['ambiguous_default_count']}`
        - Degraded defaults named: `{summary['degraded_default_count']}`
        - Unresolved conflict rows: `{summary['unresolved_conflict_count']}`

        ## Mock_now_execution

        The now-executable ledger closes the "integration behavior is obvious" gap. Each dependency row below names the proof contract, the ambiguity class, the degraded default, and the manual fallback that current simulators and current product surfaces must obey.

        {build_markdown_table(
            ["Dependency", "Family", "Proof Objects", "Ambiguity", "Degraded Default", "Manual Fallback", "Blocker"],
            mock_rows,
        )}

        ## Actual_provider_strategy_later

        The same dependency rows govern live-provider movement later. Provider onboarding may widen only when the evidence, non-negotiables, and live gates below are satisfied or explicitly overridden through the conflict register.

        {build_markdown_table(
            ["Dependency", "Live Evidence Needed", "Non-Negotiables", "Provider Flex Behind Adapter", "Live Gate / Approval"],
            actual_rows,
        )}

        Live-provider rules:

        - No provider-specific default may silently alter proof thresholds, degraded posture, or closure rules.
        - Fresh evidence remains mandatory even when a supplier says a path is already "ready".
        - Audience posture stays contract-bound: patient, staff, and support copy must match the active proof rung.
        """
    ).strip()


def render_degraded_doc(rows: list[dict[str, Any]], summary: dict[str, Any]) -> str:
    mock_rows = [
        [
            f"`{row['dependency_id']}`",
            f"{row['freshness_window_days']}d",
            row["patient_visible_posture_default"],
            row["staff_visible_posture_default"],
            row["support_visible_posture_default"],
            row["degraded_mode_default"],
        ]
        for row in rows
    ]
    ladder_rows = [[stage["stage"], stage["meaning"], stage["ui_posture"]] for stage in FALLBACK_LADDER]
    return dedent(
        f"""
        # 40 Degraded Mode Defaults

        - Task: `{TASK_ID}`
        - Visual mode: `{VISUAL_MODE}`
        - Degraded defaults named: `{summary['degraded_default_count']}`
        - Watch-only contract rows: `{summary['watch_contract_only_count']}`

        ## Mock_now_execution

        Degraded mode is a first-class runtime outcome, not a generic error bucket. Every dependency row names the audience posture that applies while proof is missing, contradictory, stale, or intentionally withheld.

        {build_markdown_table(
            ["Dependency", "Freshness", "Patient Posture", "Staff Posture", "Support Posture", "Degraded Default"],
            mock_rows,
        )}

        ## Actual_provider_strategy_later

        Later live-provider packs must keep the same ladder semantics. A live route may change adapter details, but it may not collapse the difference between proof, ambiguity, degraded continuity, and manual fallback.

        {build_markdown_table(
            ["Fallback Ladder Stage", "Runtime Meaning", "UI Posture"],
            ladder_rows,
        )}

        Later-provider guardrails:

        - Provider-specific delivery receipts, webhook payloads, and mailbox identifiers stay behind adapter boundaries.
        - If a provider cannot sustain the current degraded default, the conflict register must record the override before rollout.
        - Optional and deferred rows still need truthful degraded posture so later scope widening does not invent new semantics.
        """
    ).strip()


def render_mock_vs_actual_doc(rows: list[dict[str, Any]]) -> str:
    mock_rows = [
        [
            f"`{row['dependency_id']}`",
            format_list(row["simulator_counterparts"], separator="<br>"),
            row["degraded_mode_default"],
            format_list(row["provider_variability_envelope"], separator="<br>"),
        ]
        for row in rows
    ]
    actual_rows = [
        [
            f"`{row['dependency_id']}`",
            format_list(row["live_upgrade_evidence"], separator="<br>"),
            format_list(row["non_negotiable_assumptions"], separator="<br>"),
            row["explicit_override_rule"],
        ]
        for row in rows
    ]
    return dedent(
        f"""
        # 40 Mock Vs Actual Contract Delta

        - Task: `{TASK_ID}`
        - Visual mode: `{VISUAL_MODE}`

        ## Mock_now_execution

        The mock-now lane is not a temporary prose note. It is the executable contract that current simulators, current projections, and current UX states must implement right now.

        {build_markdown_table(
            ["Dependency", "Simulator Counterpart", "Mock Default", "Actual Provider Variability"],
            mock_rows,
        )}

        ## Actual_provider_strategy_later

        The actual-provider lane upgrades evidence and adapter wiring, not the business truth contract. Any future provider delta must stay within the envelope below or be recorded as an explicit conflict.

        {build_markdown_table(
            ["Dependency", "Upgrade Evidence", "Non-Negotiables", "Explicit Override Rule"],
            actual_rows,
        )}

        Delta rules:

        - Live providers may upgrade evidence quality and reduce ambiguity, but they may not redefine what counts as proof.
        - Manual fallback remains available even after a provider goes live if the contract row says continuity still requires it.
        - Simulator retirement is never implied by live onboarding; replacement mode stays explicit per dependency row.
        """
    ).strip()


def render_conflict_doc(conflicts: list[dict[str, Any]], summary: dict[str, Any]) -> str:
    conflict_rows = [
        [
            f"`{row['conflict_id']}`",
            f"`{row['dependency_id']}`<br>{row['dependency_name']}",
            row["default_contract_axis"],
            row["status"],
            row["provider_pressure_summary"],
            row["explicit_override_rule"],
        ]
        for row in conflicts
    ]
    return dedent(
        f"""
        # 40 Integration Contract Conflict Register

        - Task: `{TASK_ID}`
        - Visual mode: `{VISUAL_MODE}`
        - Conflict rows: `{summary['conflict_count']}`
        - Unresolved conflict rows: `{summary['unresolved_conflict_count']}`

        ## Mock_now_execution

        This register closes the "provider-specific differences leak into business truth" gap. Every future live-provider difference must either fit inside the frozen adapter envelope or appear here first.

        {build_markdown_table(
            ["Conflict", "Dependency", "Contract Axis", "Status", "Provider Pressure", "Override Rule"],
            conflict_rows,
        )}

        ## Actual_provider_strategy_later

        Later provider packs must keep this register current before rollout or release widening.

        Conflict rules:

        - `open` rows block silent mutation of baseline-required assumptions.
        - `watch` rows keep optional, deferred, and future dependencies truthful even before they go live.
        - A provider contract is incomplete if it lacks either current supporting evidence or a conflict row explaining the deviation.
        """
    ).strip()


def render_html(rows: list[dict[str, Any]], conflicts: list[dict[str, Any]], summary: dict[str, Any]) -> str:
    family_cards = [
        {
            "family_key": family_key,
            "label": family["label"],
            "description": family["description"],
            "count": sum(1 for row in rows if row["dependency_family"] == family_key),
        }
        for family_key, family in FAMILY_META.items()
    ]
    html_payload = {
        "summary": summary,
        "rows": rows,
        "conflicts": conflicts,
        "familyCards": family_cards,
        "fallbackLadder": FALLBACK_LADDER,
    }
    data_json = json.dumps(html_payload, ensure_ascii=False)
    return dedent(
        f"""
        <!doctype html>
        <html lang="en">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>40 Integration Contract Cockpit</title>
          <link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 96 96'%3E%3Crect width='96' height='96' rx='24' fill='%232563EB'/%3E%3Cpath d='M26 28h20c11 0 18 6 18 16 0 9-7 16-18 16H38v10H26V28zm12 10v12h8c5 0 8-2 8-6 0-4-3-6-8-6h-8z' fill='white'/%3E%3Cpath d='M66 28h8v40h-8z' fill='white'/%3E%3C/svg%3E">
          <style>
            :root {{
              --canvas: #F6F8FA;
              --rail: #EEF2F6;
              --panel: #FFFFFF;
              --inset: #F3F6F9;
              --text-strong: #0F172A;
              --text: #1E293B;
              --text-muted: #667085;
              --border-subtle: #E2E8F0;
              --border-default: #CBD5E1;
              --primary: #2563EB;
              --proof: #0EA5A4;
              --ambiguity: #7C3AED;
              --degraded: #C98900;
              --blocked: #C24141;
              --shadow: 0 28px 64px rgba(15, 23, 42, 0.08);
              --radius-xl: 26px;
              --radius-lg: 20px;
              --radius-md: 14px;
              --max-width: 1440px;
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
                radial-gradient(circle at top left, rgba(14, 165, 164, 0.08), transparent 28%),
                radial-gradient(circle at top right, rgba(37, 99, 235, 0.10), transparent 30%),
                linear-gradient(180deg, #FBFCFE 0%, var(--canvas) 100%);
            }}
            body[data-reduced-motion="true"] * {{
              animation-duration: 0ms !important;
              transition-duration: 0ms !important;
              scroll-behavior: auto !important;
            }}
            .page {{
              max-width: var(--max-width);
              margin: 0 auto;
              padding: 14px;
            }}
            .shell {{
              display: grid;
              gap: 16px;
            }}
            .panel {{
              background: rgba(255,255,255,0.98);
              border: 1px solid var(--border-subtle);
              border-radius: var(--radius-xl);
              box-shadow: var(--shadow);
            }}
            .masthead-shell {{
              position: sticky;
              top: 0;
              z-index: 40;
              padding-top: 6px;
              backdrop-filter: blur(12px);
              background: linear-gradient(180deg, rgba(246,248,250,0.96), rgba(246,248,250,0.88) 80%, rgba(246,248,250,0));
            }}
            .masthead {{
              min-height: 72px;
              display: grid;
              gap: 14px;
              padding: 16px 18px;
            }}
            .masthead-top {{
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              gap: 18px;
              flex-wrap: wrap;
            }}
            .brand {{
              display: flex;
              gap: 14px;
              align-items: center;
              max-width: 84ch;
            }}
            .brand svg {{
              width: 82px;
              height: 82px;
              flex: none;
            }}
            .brand-copy {{
              display: grid;
              gap: 8px;
            }}
            .eyebrow {{
              font-size: 12px;
              letter-spacing: 0.16em;
              text-transform: uppercase;
              color: var(--text-muted);
            }}
            h1 {{
              margin: 0;
              font-size: clamp(32px, 4vw, 48px);
              line-height: 0.96;
              letter-spacing: -0.04em;
              color: var(--text-strong);
            }}
            .subtitle {{
              margin: 0;
              font-size: 15px;
              line-height: 1.56;
              color: var(--text-muted);
            }}
            .metric-row {{
              display: grid;
              grid-template-columns: repeat(4, minmax(0, 1fr));
              gap: 12px;
            }}
            .metric {{
              min-height: 44px;
              padding: 12px 14px;
              border-radius: 999px;
              background: rgba(243, 246, 249, 0.9);
              border: 1px solid var(--border-default);
              display: flex;
              justify-content: space-between;
              align-items: center;
              gap: 12px;
              font-size: 13px;
            }}
            .metric strong {{
              font-size: 20px;
              color: var(--text-strong);
            }}
            .layout {{
              display: grid;
              grid-template-columns: var(--rail-width) minmax(0, 1fr) var(--inspector-width);
              gap: 16px;
              align-items: start;
            }}
            .rail,
            .workspace,
            .inspector {{
              padding: 18px;
            }}
            .workspace {{
              display: grid;
              gap: 16px;
            }}
            .section-label {{
              margin: 0 0 10px;
              font-size: 12px;
              letter-spacing: 0.16em;
              text-transform: uppercase;
              color: var(--text-muted);
            }}
            .field-grid {{
              display: grid;
              gap: 12px;
              margin-bottom: 18px;
            }}
            .field {{
              display: grid;
              gap: 6px;
            }}
            label {{
              font-size: 11px;
              letter-spacing: 0.10em;
              text-transform: uppercase;
              color: var(--text-muted);
            }}
            select,
            button.sort-button {{
              min-height: 44px;
              border-radius: 14px;
              border: 1px solid var(--border-default);
              background: white;
              color: var(--text);
              padding: 0 12px;
              font: inherit;
            }}
            button.sort-button {{
              cursor: pointer;
              transition: background-color 120ms ease, border-color 120ms ease, transform 120ms ease;
            }}
            button.sort-button:hover {{
              background: var(--inset);
            }}
            .family-list,
            .scope-list {{
              display: grid;
              gap: 10px;
            }}
            .family-card,
            .scope-card {{
              padding: 14px;
              border-radius: 18px;
              border: 1px solid var(--border-default);
              background: linear-gradient(180deg, rgba(255,255,255,0.98), rgba(243,246,249,0.96));
              display: grid;
              gap: 8px;
            }}
            .family-card strong,
            .scope-card strong {{
              color: var(--text-strong);
              font-size: 15px;
            }}
            .family-card span,
            .scope-card span {{
              color: var(--text-muted);
              font-size: 12px;
              line-height: 1.45;
            }}
            .card {{
              border: 1px solid var(--border-subtle);
              border-radius: var(--radius-lg);
              padding: 16px;
              background: rgba(255,255,255,0.98);
            }}
            .register-header,
            .cards-header,
            .lower-header {{
              display: flex;
              justify-content: space-between;
              align-items: center;
              gap: 12px;
              flex-wrap: wrap;
              margin-bottom: 12px;
            }}
            .sort-row {{
              display: flex;
              gap: 10px;
              flex-wrap: wrap;
            }}
            .register-grid,
            .parity-grid {{
              overflow: auto;
              border: 1px solid var(--border-subtle);
              border-radius: 18px;
            }}
            table {{
              width: 100%;
              border-collapse: collapse;
            }}
            th,
            td {{
              text-align: left;
              padding: 12px 8px;
              border-bottom: 1px solid var(--border-subtle);
              vertical-align: top;
              line-height: 1.45;
            }}
            th {{
              font-size: 11px;
              letter-spacing: 0.12em;
              text-transform: uppercase;
              color: var(--text-muted);
              background: rgba(243,246,249,0.82);
              position: sticky;
              top: 0;
              z-index: 1;
            }}
            tbody tr {{
              min-height: 52px;
              cursor: pointer;
              transition: background-color 180ms ease, transform 120ms ease;
            }}
            tbody tr:hover,
            tbody tr[data-selected="true"] {{
              background: rgba(37, 99, 235, 0.06);
            }}
            tbody tr:focus-visible,
            button:focus-visible,
            select:focus-visible {{
              outline: 2px solid var(--primary);
              outline-offset: 2px;
            }}
            .dependency-title {{
              display: grid;
              gap: 6px;
            }}
            .mono {{
              font-family: var(--mono);
              font-size: 12px;
            }}
            .muted {{
              color: var(--text-muted);
            }}
            .chip-row {{
              display: flex;
              flex-wrap: wrap;
              gap: 6px;
            }}
            .chip {{
              display: inline-flex;
              align-items: center;
              min-height: 24px;
              padding: 0 10px;
              border-radius: 999px;
              font-size: 11px;
              letter-spacing: 0.04em;
              text-transform: uppercase;
              border: 1px solid transparent;
            }}
            .chip-proof {{
              color: var(--proof);
              background: rgba(14, 165, 164, 0.12);
              border-color: rgba(14, 165, 164, 0.22);
            }}
            .chip-ambiguity {{
              color: var(--ambiguity);
              background: rgba(124, 58, 237, 0.10);
              border-color: rgba(124, 58, 237, 0.20);
            }}
            .chip-degraded {{
              color: var(--degraded);
              background: rgba(201, 137, 0, 0.12);
              border-color: rgba(201, 137, 0, 0.22);
            }}
            .chip-manual {{
              color: var(--blocked);
              background: rgba(194, 65, 65, 0.10);
              border-color: rgba(194, 65, 65, 0.18);
            }}
            .chip-override {{
              color: var(--primary);
              background: rgba(37, 99, 235, 0.10);
              border-color: rgba(37, 99, 235, 0.20);
            }}
            .cards-grid {{
              display: grid;
              grid-template-columns: repeat(2, minmax(0, 1fr));
              gap: 16px;
            }}
            .proof-card,
            .ambiguity-card {{
              min-height: 108px;
              display: grid;
              gap: 12px;
            }}
            .contract-block {{
              padding: 14px;
              border-radius: 18px;
              border: 1px solid var(--border-default);
              background: linear-gradient(180deg, rgba(255,255,255,0.98), rgba(243,246,249,0.94));
            }}
            .contract-block strong {{
              display: block;
              margin-bottom: 8px;
              color: var(--text-strong);
            }}
            .contract-block ul,
            .inspector ul {{
              margin: 0;
              padding-left: 18px;
            }}
            .contract-block li,
            .inspector li {{
              margin-bottom: 6px;
              line-height: 1.5;
            }}
            .ladder {{
              display: grid;
              grid-template-columns: repeat(4, minmax(0, 1fr));
              gap: 12px;
            }}
            .ladder-step {{
              min-height: 108px;
              padding: 14px;
              border-radius: 18px;
              border: 1px solid var(--border-default);
              background: linear-gradient(180deg, rgba(255,255,255,0.98), rgba(243,246,249,0.94));
              position: relative;
            }}
            .ladder-step::after {{
              content: "→";
              position: absolute;
              right: -10px;
              top: 50%;
              transform: translateY(-50%);
              color: var(--text-muted);
              font-size: 24px;
            }}
            .ladder-step:last-child::after {{
              display: none;
            }}
            .inspector {{
              display: grid;
              gap: 14px;
              transition: transform 240ms ease, opacity 240ms ease;
            }}
            .inspector h2 {{
              margin: 0;
              font-size: 26px;
              line-height: 1.04;
              letter-spacing: -0.03em;
              color: var(--text-strong);
            }}
            .inspector-grid {{
              display: grid;
              gap: 14px;
            }}
            .inspector-section {{
              padding: 14px;
              border-radius: 18px;
              background: var(--inset);
              border: 1px solid var(--border-subtle);
            }}
            .inspector-section h3 {{
              margin: 0 0 10px;
              font-size: 12px;
              letter-spacing: 0.14em;
              text-transform: uppercase;
              color: var(--text-muted);
            }}
            .lower-grid {{
              display: grid;
              grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
              gap: 16px;
            }}
            .conflict-strip {{
              display: flex;
              gap: 12px;
              overflow: auto;
              padding-bottom: 6px;
            }}
            .conflict-card {{
              min-width: 260px;
              padding: 14px;
              border-radius: 18px;
              border: 1px solid var(--border-default);
              background: linear-gradient(180deg, rgba(255,255,255,0.98), rgba(243,246,249,0.96));
              display: grid;
              gap: 8px;
            }}
            .conflict-card[data-selected="true"] {{
              border-color: rgba(37, 99, 235, 0.46);
              box-shadow: inset 0 0 0 1px rgba(37, 99, 235, 0.18);
            }}
            .status-open {{
              color: var(--blocked);
            }}
            .status-watch {{
              color: var(--degraded);
            }}
            @media (max-width: 1280px) {{
              .layout {{
                grid-template-columns: minmax(0, 1fr) minmax(320px, 360px);
              }}
              .rail {{
                grid-column: 1 / -1;
              }}
            }}
            @media (max-width: 960px) {{
              .layout,
              .cards-grid,
              .lower-grid,
              .ladder {{
                grid-template-columns: 1fr;
              }}
              .metric-row {{
                grid-template-columns: repeat(2, minmax(0, 1fr));
              }}
            }}
            @media (max-width: 640px) {{
              .page {{
                padding: 10px;
              }}
              .metric-row {{
                grid-template-columns: 1fr;
              }}
              .brand {{
                align-items: flex-start;
              }}
              .brand svg {{
                width: 72px;
                height: 72px;
              }}
            }}
          </style>
        </head>
        <body>
          <div class="page">
            <div class="shell" data-testid="cockpit-shell">
              <div class="masthead-shell">
                <header class="panel masthead">
                  <div class="masthead-top">
                    <div class="brand">
                      <svg viewBox="0 0 96 96" aria-hidden="true">
                        <rect x="8" y="8" width="80" height="80" rx="22" fill="#2563EB"></rect>
                        <path d="M26 32c0-8 6-14 14-14h16v10H42c-4 0-6 2-6 6s2 6 6 6h10c8 0 14 6 14 14s-6 14-14 14H26V58h24c4 0 6-2 6-6s-2-6-6-6H40c-8 0-14-6-14-14z" fill="white"></path>
                        <path d="M64 18h10v50H64z" fill="white"></path>
                        <path d="M58 18h24v10H58z" fill="white"></path>
                      </svg>
                      <div class="brand-copy">
                        <div class="eyebrow">Vecells · CONTRACTS</div>
                        <h1>Integration Contract Cockpit</h1>
                        <p class="subtitle">A calm internal contract room where proof, ambiguity, degraded continuity, and manual fallback stay structurally distinct for every external dependency.</p>
                      </div>
                    </div>
                    <div class="muted">Visual mode: <span class="mono">{VISUAL_MODE}</span></div>
                  </div>
                  <div class="metric-row">
                    <div class="metric"><span>Dependencies</span><strong id="metric-dependency-count">{summary['dependency_count']}</strong></div>
                    <div class="metric"><span>Ambiguous defaults</span><strong id="metric-ambiguous-count">{summary['ambiguous_default_count']}</strong></div>
                    <div class="metric"><span>Degraded defaults</span><strong id="metric-degraded-count">{summary['degraded_default_count']}</strong></div>
                    <div class="metric"><span>Unresolved conflicts</span><strong id="metric-conflict-count">{summary['unresolved_conflict_count']}</strong></div>
                  </div>
                </header>
              </div>

              <div class="layout">
                <aside class="panel rail" data-testid="rail">
                  <div class="field-grid">
                    <div class="field">
                      <label for="filter-family">Dependency family</label>
                      <select id="filter-family" data-testid="filter-family"></select>
                    </div>
                    <div class="field">
                      <label for="filter-ambiguity">Ambiguity class</label>
                      <select id="filter-ambiguity" data-testid="filter-ambiguity"></select>
                    </div>
                    <div class="field">
                      <label for="filter-blocker">Blocker impact</label>
                      <select id="filter-blocker" data-testid="filter-blocker"></select>
                    </div>
                    <div class="field">
                      <label for="filter-scope">Status</label>
                      <select id="filter-scope" data-testid="filter-scope"></select>
                    </div>
                  </div>
                  <h2 class="section-label">Dependency families</h2>
                  <div class="family-list" id="family-cards"></div>
                  <h2 class="section-label" style="margin-top: 18px;">Status filters</h2>
                  <div class="scope-list" id="scope-cards"></div>
                </aside>

                <main class="workspace">
                  <section class="panel card" data-testid="ledger-table">
                    <div class="register-header">
                      <div>
                        <div class="section-label">Assumption ledger</div>
                        <div class="muted">Proof objects, freshness, blocker posture, and visible chips all come from one shared row model.</div>
                      </div>
                      <div class="sort-row">
                        <button class="sort-button" type="button" id="sort-freshness" data-testid="sort-freshness">Sort freshness</button>
                        <button class="sort-button" type="button" id="sort-blocker" data-testid="sort-blocker">Sort blocker</button>
                      </div>
                    </div>
                    <div class="register-grid">
                      <table>
                        <thead>
                          <tr>
                            <th>Dependency</th>
                            <th>Family</th>
                            <th>Proof Objects</th>
                            <th>Freshness</th>
                            <th>Blocker</th>
                            <th>Chips</th>
                          </tr>
                        </thead>
                        <tbody id="ledger-body"></tbody>
                      </table>
                    </div>
                  </section>

                  <section class="cards-grid">
                    <article class="panel card proof-card" data-testid="proof-card"></article>
                    <article class="panel card ambiguity-card" data-testid="ambiguity-card"></article>
                  </section>

                  <section class="panel card">
                    <div class="cards-header">
                      <div>
                        <div class="section-label">Fallback ladder</div>
                        <div class="muted">Proof -> Ambiguity -> Degraded -> Manual Fallback</div>
                      </div>
                    </div>
                    <div class="ladder" id="fallback-ladder"></div>
                  </section>

                  <section class="lower-grid">
                    <article class="panel card">
                      <div class="lower-header">
                        <div>
                          <div class="section-label">Table parity</div>
                          <div class="muted">Diagram parity stays textual so runtime, support, and assurance read the same fallback law.</div>
                        </div>
                      </div>
                      <div class="parity-grid">
                        <table data-testid="parity-table">
                          <thead>
                            <tr>
                              <th>Stage</th>
                              <th>Runtime meaning</th>
                              <th>UI posture</th>
                            </tr>
                          </thead>
                          <tbody id="parity-body"></tbody>
                        </table>
                      </div>
                    </article>

                    <article class="panel card">
                      <div class="lower-header">
                        <div>
                          <div class="section-label">Conflict register strip</div>
                          <div class="muted">Open rows are the only legal place for live-provider overrides to change adapter-facing details.</div>
                        </div>
                      </div>
                      <div class="conflict-strip" data-testid="conflict-strip" id="conflict-strip"></div>
                    </article>
                  </section>
                </main>

                <aside class="panel inspector" data-testid="inspector" id="inspector"></aside>
              </div>
            </div>
          </div>

          <script>
            const DATA = {data_json};
            const BLOCKER_LABELS = {{
              watch_only: "Watch only",
              operational_blocker: "Operational blocker",
              hard_blocker: "Hard blocker",
            }};
            const SCOPE_LABELS = {{
              baseline_required: "Baseline required",
              optional_flagged: "Optional flagged",
              deferred_phase7: "Deferred phase 7",
              future_optional: "Future optional",
            }};
            const state = {{
              family: "all",
              ambiguity: "all",
              blocker: "all",
              scope: "all",
              sortField: null,
              sortDirection: "asc",
              selectedId: DATA.rows[0]?.dependency_id ?? null,
            }};

            if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {{
              document.body.dataset.reducedMotion = "true";
            }}

            function uniq(values) {{
              return [...new Set(values)];
            }}

            function optionMarkup(value, label) {{
              return `<option value="${{value}}">${{label}}</option>`;
            }}

            function renderFilterOptions() {{
              const familyFilter = document.getElementById("filter-family");
              const ambiguityFilter = document.getElementById("filter-ambiguity");
              const blockerFilter = document.getElementById("filter-blocker");
              const scopeFilter = document.getElementById("filter-scope");

              const families = DATA.familyCards.map((card) => [card.family_key, card.label]);
              const ambiguities = uniq(DATA.rows.map((row) => row.ambiguity_class)).map((value) => [value, value.replaceAll("_", " ")]);
              const blockers = uniq(DATA.rows.map((row) => row.blocker_impact)).map((value) => [value, BLOCKER_LABELS[value] ?? value]);
              const scopes = uniq(DATA.rows.map((row) => row.baseline_scope)).map((value) => [value, SCOPE_LABELS[value] ?? value]);

              familyFilter.innerHTML = optionMarkup("all", "All families") + families.map(([value, label]) => optionMarkup(value, label)).join("");
              ambiguityFilter.innerHTML = optionMarkup("all", "All ambiguity classes") + ambiguities.map(([value, label]) => optionMarkup(value, label)).join("");
              blockerFilter.innerHTML = optionMarkup("all", "All blocker impacts") + blockers.map(([value, label]) => optionMarkup(value, label)).join("");
              scopeFilter.innerHTML = optionMarkup("all", "All statuses") + scopes.map(([value, label]) => optionMarkup(value, label)).join("");

              familyFilter.value = state.family;
              ambiguityFilter.value = state.ambiguity;
              blockerFilter.value = state.blocker;
              scopeFilter.value = state.scope;
            }}

            function renderFamilyCards() {{
              const host = document.getElementById("family-cards");
              host.innerHTML = DATA.familyCards.map((card) => `
                <article class="family-card">
                  <strong>${{card.label}} · <span class="mono">${{card.count}}</span></strong>
                  <span>${{card.description}}</span>
                </article>
              `).join("");
            }}

            function renderScopeCards() {{
              const counts = DATA.rows.reduce((acc, row) => {{
                acc[row.baseline_scope] = (acc[row.baseline_scope] ?? 0) + 1;
                return acc;
              }}, {{}});
              const host = document.getElementById("scope-cards");
              host.innerHTML = Object.entries(counts).map(([scope, count]) => `
                <article class="scope-card">
                  <strong>${{SCOPE_LABELS[scope] ?? scope}} · <span class="mono">${{count}}</span></strong>
                  <span>${{scope === "baseline_required" ? "Current baseline rows where proof, degraded posture, and closure implications are active now." : "Deferred, optional, or future rows that still need a frozen contract before widening."}}</span>
                </article>
              `).join("");
            }}

            function filteredRows() {{
              let rows = [...DATA.rows];
              if (state.family !== "all") {{
                rows = rows.filter((row) => row.dependency_family === state.family);
              }}
              if (state.ambiguity !== "all") {{
                rows = rows.filter((row) => row.ambiguity_class === state.ambiguity);
              }}
              if (state.blocker !== "all") {{
                rows = rows.filter((row) => row.blocker_impact === state.blocker);
              }}
              if (state.scope !== "all") {{
                rows = rows.filter((row) => row.baseline_scope === state.scope);
              }}
              if (state.sortField === "freshness") {{
                rows.sort((left, right) => {{
                  const delta = left.freshness_window_days - right.freshness_window_days;
                  if (delta !== 0) return state.sortDirection === "asc" ? delta : -delta;
                  return left.dependency_id.localeCompare(right.dependency_id);
                }});
              }}
              if (state.sortField === "blocker") {{
                rows.sort((left, right) => {{
                  const delta = left.blocker_rank - right.blocker_rank;
                  if (delta !== 0) return state.sortDirection === "asc" ? delta : -delta;
                  return left.dependency_id.localeCompare(right.dependency_id);
                }});
              }}
              return rows;
            }}

            function chipMarkup(row, kind, label, className) {{
              return `<span class="chip ${{className}}" data-testid="chip-${{row.dependency_id}}-${{kind}}">${{label}}</span>`;
            }}

            function ensureSelected(rows) {{
              if (!rows.some((row) => row.dependency_id === state.selectedId)) {{
                state.selectedId = rows[0]?.dependency_id ?? null;
              }}
            }}

            function selectByOffset(rows, currentId, offset) {{
              const index = rows.findIndex((row) => row.dependency_id === currentId);
              if (index === -1) return;
              const nextIndex = Math.min(Math.max(index + offset, 0), rows.length - 1);
              state.selectedId = rows[nextIndex].dependency_id;
              render();
              const target = document.querySelector(`[data-testid="ledger-row-${{state.selectedId}}"]`);
              target?.focus();
            }}

            function renderLedger(rows) {{
              const body = document.getElementById("ledger-body");
              body.innerHTML = rows.map((row) => `
                <tr
                  tabindex="0"
                  data-testid="ledger-row-${{row.dependency_id}}"
                  data-dependency-id="${{row.dependency_id}}"
                  data-selected="${{row.dependency_id === state.selectedId ? "true" : "false"}}"
                  data-blocker-rank="${{row.blocker_rank}}"
                  data-freshness-days="${{row.freshness_window_days}}"
                >
                  <td>
                    <div class="dependency-title">
                      <strong>${{row.dependency_name}}</strong>
                      <span class="mono muted">${{row.dependency_id}}</span>
                    </div>
                  </td>
                  <td>${{row.dependency_family_label}}</td>
                  <td>${{row.authoritative_proof_objects.join("<br>")}}</td>
                  <td><span class="mono">${{row.freshness_window_days}}d</span></td>
                  <td>${{row.blocker_label}}</td>
                  <td>
                    <div class="chip-row">
                      ${{chipMarkup(row, "proof", "proof", "chip-proof")}}
                      ${{chipMarkup(row, "ambiguity", "ambiguity", "chip-ambiguity")}}
                      ${{chipMarkup(row, "degraded", "degraded", "chip-degraded")}}
                      ${{chipMarkup(row, "manual", "manual", "chip-manual")}}
                      ${{chipMarkup(row, "override", "override", "chip-override")}}
                    </div>
                  </td>
                </tr>
              `).join("");

              [...body.querySelectorAll("tr")].forEach((rowEl) => {{
                rowEl.addEventListener("click", () => {{
                  state.selectedId = rowEl.dataset.dependencyId;
                  render();
                }});
                rowEl.addEventListener("focus", () => {{
                  state.selectedId = rowEl.dataset.dependencyId;
                  renderInspector();
                  renderCards();
                  renderConflictStrip(filteredRows());
                }});
                rowEl.addEventListener("keydown", (event) => {{
                  const visibleRows = filteredRows();
                  if (event.key === "ArrowDown") {{
                    event.preventDefault();
                    selectByOffset(visibleRows, rowEl.dataset.dependencyId, 1);
                  }}
                  if (event.key === "ArrowUp") {{
                    event.preventDefault();
                    selectByOffset(visibleRows, rowEl.dataset.dependencyId, -1);
                  }}
                  if (event.key === "Home") {{
                    event.preventDefault();
                    state.selectedId = visibleRows[0]?.dependency_id ?? null;
                    render();
                    document.querySelector(`[data-testid="ledger-row-${{state.selectedId}}"]`)?.focus();
                  }}
                  if (event.key === "End") {{
                    event.preventDefault();
                    state.selectedId = visibleRows.at(-1)?.dependency_id ?? null;
                    render();
                    document.querySelector(`[data-testid="ledger-row-${{state.selectedId}}"]`)?.focus();
                  }}
                }});
              }});
            }}

            function selectedRow() {{
              return DATA.rows.find((row) => row.dependency_id === state.selectedId) ?? DATA.rows[0];
            }}

            function renderCards() {{
              const row = selectedRow();
              const proofCard = document.querySelector("[data-testid='proof-card']");
              const ambiguityCard = document.querySelector("[data-testid='ambiguity-card']");

              proofCard.innerHTML = `
                <div class="cards-header">
                  <div>
                    <div class="section-label">Proof contract</div>
                    <div class="muted">${{row.dependency_name}}</div>
                  </div>
                </div>
                <div class="contract-block">
                  <strong>Authoritative success proof</strong>
                  <p>${{row.authoritative_success_proof}}</p>
                </div>
                <div class="contract-block">
                  <strong>Proof objects</strong>
                  <ul>${{row.authoritative_proof_objects.map((item) => `<li class="mono">${{item}}</li>`).join("")}}</ul>
                </div>
              `;

              ambiguityCard.innerHTML = `
                <div class="cards-header">
                  <div>
                    <div class="section-label">Ambiguity envelope</div>
                    <div class="muted">${{row.ambiguity_label}}</div>
                  </div>
                </div>
                <div class="contract-block">
                  <strong>Insufficient evidence patterns</strong>
                  <ul>${{row.insufficient_evidence_patterns.map((item) => `<li>${{item}}</li>`).join("")}}</ul>
                </div>
                <div class="contract-block">
                  <strong>Degraded default</strong>
                  <p>${{row.degraded_mode_default}}</p>
                </div>
              `;
            }}

            function renderFallbackLadder() {{
              const host = document.getElementById("fallback-ladder");
              host.innerHTML = DATA.fallbackLadder.map((step) => `
                <article class="ladder-step">
                  <div class="section-label">${{step.stage}}</div>
                  <strong>${{step.meaning}}</strong>
                  <div class="muted" style="margin-top: 8px;">${{step.ui_posture}}</div>
                </article>
              `).join("");
            }}

            function renderParityTable() {{
              const body = document.getElementById("parity-body");
              body.innerHTML = DATA.fallbackLadder.map((step) => `
                <tr>
                  <td>${{step.stage}}</td>
                  <td>${{step.meaning}}</td>
                  <td>${{step.ui_posture}}</td>
                </tr>
              `).join("");
            }}

            function renderInspector() {{
              const row = selectedRow();
              const inspector = document.getElementById("inspector");
              inspector.innerHTML = `
                <div>
                  <div class="section-label">Selected dependency</div>
                  <h2>${{row.dependency_name}}</h2>
                  <div class="chip-row" style="margin-top: 10px;">
                    <span class="chip chip-proof">${{row.dependency_family_label}}</span>
                    <span class="chip chip-ambiguity">${{row.ambiguity_label}}</span>
                    <span class="chip chip-degraded">${{row.blocker_label}}</span>
                  </div>
                </div>
                <div class="inspector-grid">
                  <section class="inspector-section">
                    <h3>Purpose</h3>
                    <p>${{row.canonical_purpose}}</p>
                  </section>
                  <section class="inspector-section">
                    <h3>Degraded and manual defaults</h3>
                    <ul>
                      <li>${{row.degraded_mode_default}}</li>
                      <li>${{row.manual_fallback_default}}</li>
                    </ul>
                  </section>
                  <section class="inspector-section">
                    <h3>Audience posture</h3>
                    <ul>
                      <li><strong>Patient:</strong> ${{row.patient_visible_posture_default}}</li>
                      <li><strong>Staff:</strong> ${{row.staff_visible_posture_default}}</li>
                      <li><strong>Support:</strong> ${{row.support_visible_posture_default}}</li>
                    </ul>
                  </section>
                  <section class="inspector-section">
                    <h3>Live-provider gates</h3>
                    <ul>${{row.live_gate_or_approval_required.map((item) => `<li>${{item}}</li>`).join("")}}</ul>
                  </section>
                  <section class="inspector-section">
                    <h3>Override notes</h3>
                    <p>${{row.explicit_override_rule}}</p>
                  </section>
                  <section class="inspector-section">
                    <h3>Closure blocker implications</h3>
                    <p>${{row.closure_blocker_implications}}</p>
                  </section>
                </div>
              `;
            }}

            function renderConflictStrip(rows) {{
              const selected = selectedRow();
              const host = document.getElementById("conflict-strip");
              const visibleIds = new Set(rows.map((row) => row.dependency_id));
              host.innerHTML = DATA.conflicts
                .filter((conflict) => visibleIds.has(conflict.dependency_id))
                .map((conflict) => `
                  <article class="conflict-card" data-selected="${{conflict.dependency_id === selected.dependency_id ? "true" : "false"}}">
                    <div class="section-label">${{conflict.conflict_id}}</div>
                    <strong>${{conflict.dependency_name}}</strong>
                    <div class="muted">${{conflict.default_contract_axis}}</div>
                    <div class="status-${{conflict.status}}">${{conflict.status}}</div>
                    <div>${{conflict.provider_pressure_summary}}</div>
                  </article>
                `)
                .join("");
            }}

            function render() {{
              const rows = filteredRows();
              ensureSelected(rows);
              renderLedger(rows);
              renderCards();
              renderInspector();
              renderConflictStrip(rows);
            }}

            document.getElementById("filter-family").addEventListener("change", (event) => {{
              state.family = event.target.value;
              render();
            }});
            document.getElementById("filter-ambiguity").addEventListener("change", (event) => {{
              state.ambiguity = event.target.value;
              render();
            }});
            document.getElementById("filter-blocker").addEventListener("change", (event) => {{
              state.blocker = event.target.value;
              render();
            }});
            document.getElementById("filter-scope").addEventListener("change", (event) => {{
              state.scope = event.target.value;
              render();
            }});
            document.getElementById("sort-freshness").addEventListener("click", () => {{
              state.sortDirection = state.sortField === "freshness" && state.sortDirection === "asc" ? "desc" : "asc";
              state.sortField = "freshness";
              render();
            }});
            document.getElementById("sort-blocker").addEventListener("click", () => {{
              state.sortDirection = state.sortField === "blocker" && state.sortDirection === "asc" ? "desc" : "asc";
              state.sortField = "blocker";
              render();
            }});

            renderFilterOptions();
            renderFamilyCards();
            renderScopeCards();
            renderFallbackLadder();
            renderParityTable();
            render();
          </script>
        </body>
        </html>
        """
    ).strip()


def main() -> None:
    ensure_inputs()
    rows, conflicts, summary = build_dependency_rows()

    csv_rows = build_csv_rows(rows)
    degraded_payload = build_degraded_defaults_payload(rows, summary)
    provider_yaml_payload = build_provider_contract_defaults_yaml_payload(rows, summary)
    conflict_payload = build_conflict_register_payload(conflicts, summary)

    write_csv(ASSUMPTION_LEDGER_CSV_PATH, csv_rows)
    write_json(DEGRADED_DEFAULTS_JSON_PATH, degraded_payload)
    write_text(PROVIDER_CONTRACT_DEFAULTS_YAML_PATH, "\n".join(dump_yaml(provider_yaml_payload)))
    write_json(CONFLICT_REGISTER_JSON_PATH, conflict_payload)

    write_text(ASSUMPTIONS_DOC_PATH, render_assumptions_doc(rows, summary))
    write_text(DEGRADED_DOC_PATH, render_degraded_doc(rows, summary))
    write_text(MOCK_VS_ACTUAL_DOC_PATH, render_mock_vs_actual_doc(rows))
    write_text(CONFLICT_DOC_PATH, render_conflict_doc(conflicts, summary))
    write_text(COCKPIT_HTML_PATH, render_html(rows, conflicts, summary))

    print(f"{TASK_ID} build complete")
    print(f"dependencies={summary['dependency_count']}")
    print(f"unresolved_conflicts={summary['unresolved_conflict_count']}")


if __name__ == "__main__":
    main()
