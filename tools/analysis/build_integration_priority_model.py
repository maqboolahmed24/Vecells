#!/usr/bin/env python3
from __future__ import annotations

import csv
import html
import json
import textwrap
from collections import Counter, defaultdict
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = ROOT / "data" / "analysis"
DOCS_DIR = ROOT / "docs" / "external"
PROMPT_DIR = ROOT / "prompt"

REQUIRED_INPUTS = {
    "external_dependencies": DATA_DIR / "external_dependencies.json",
    "dependency_truth_matrix": DATA_DIR / "dependency_truth_and_fallback_matrix.csv",
    "browser_automation_backlog": DATA_DIR / "future_browser_automation_backlog.csv",
    "dependency_watchlist": DATA_DIR / "dependency_watchlist.json",
    "master_risk_register": DATA_DIR / "master_risk_register.json",
    "phase0_gate_verdict": DATA_DIR / "phase0_gate_verdict.json",
    "phase0_gate_blockers": DATA_DIR / "phase0_gate_blockers.csv",
    "merge_gate_matrix": DATA_DIR / "merge_gate_matrix.csv",
    "coverage_summary": DATA_DIR / "coverage_summary.json",
    "external_touchpoint_matrix": DATA_DIR / "external_touchpoint_matrix.csv",
    "cross_phase_conformance_seed": DATA_DIR / "cross_phase_conformance_seed.json",
}

CHECKLIST_PATH = PROMPT_DIR / "checklist.md"

MATRIX_MD_PATH = DOCS_DIR / "21_integration_priority_and_execution_matrix.md"
STRATEGY_MD_PATH = DOCS_DIR / "21_mock_first_vs_actual_later_strategy.md"
RATIONALE_MD_PATH = DOCS_DIR / "21_integration_priority_rationale.md"
DIVERGENCE_MD_PATH = DOCS_DIR / "21_mock_live_divergence_register.md"
COCKPIT_HTML_PATH = DOCS_DIR / "21_external_integration_priority_cockpit.html"

MATRIX_CSV_PATH = DATA_DIR / "integration_priority_matrix.csv"
MATRIX_JSON_PATH = DATA_DIR / "integration_priority_matrix.json"
SCORES_CSV_PATH = DATA_DIR / "integration_priority_scores.csv"
LANE_JSON_PATH = DATA_DIR / "mock_live_lane_assignments.json"
DIVERGENCE_CSV_PATH = DATA_DIR / "integration_divergence_register.csv"

MISSION = (
    "Turn the validated external dependency inventory into one deterministic integration "
    "priority model that separates mock-now execution from later live-provider strategy, "
    "without weakening proof, ambiguity, degraded-mode, or control-plane law."
)

VISUAL_MODE = "Integration_Constellation_Board"

SOURCE_PRECEDENCE = [
    "prompt/021.md",
    "prompt/shared_operating_contract_021_to_025.md",
    "blueprint/phase-0-the-foundation-protocol.md",
    "blueprint/phase-2-identity-and-echoes.md",
    "blueprint/phase-4-the-booking-engine.md",
    "blueprint/phase-5-the-network-horizon.md",
    "blueprint/phase-6-the-pharmacy-loop.md",
    "blueprint/phase-7-inside-the-nhs-app.md",
    "blueprint/platform-runtime-and-release-blueprint.md",
    "blueprint/phase-cards.md",
    "blueprint/forensic-audit-findings.md",
    "blueprint/blueprint-init.md",
    "data/analysis/external_dependencies.json",
    "data/analysis/dependency_watchlist.json",
    "data/analysis/master_risk_register.json",
    "data/analysis/phase0_gate_verdict.json",
]

ALLOWED_BASELINE_ROLES = {
    "baseline_required",
    "baseline_mock_required",
    "optional_flagged",
    "deferred_channel",
    "future_optional",
    "prohibited",
}

ALLOWED_IMPACTS = {"none", "low", "medium", "high", "critical"}
ALLOWED_LINEAGE_IMPACTS = {"none", "indirect", "direct"}
ALLOWED_MOCK_FEASIBILITY = {"high", "medium", "low", "unacceptable"}
ALLOWED_LATENCY_BANDS = {"unknown", "short", "medium", "long", "contract_heavy"}
ALLOWED_GATE_BANDS = {"none", "likely", "required"}
ALLOWED_LANES = {"mock_now", "hybrid_mock_then_live", "actual_later", "deferred"}

BASELINE_ROLE_SORT = {
    "baseline_required": 0,
    "baseline_mock_required": 1,
    "optional_flagged": 2,
    "deferred_channel": 3,
    "future_optional": 4,
    "prohibited": 5,
}

LANE_SORT = {
    "mock_now": 0,
    "hybrid_mock_then_live": 1,
    "actual_later": 2,
    "deferred": 3,
}

TASK_GROUPS = [
    {
        "task_group_id": "TG_SCORECARD_AND_SECRET_POSTURE",
        "label": "Scorecards And Secret Posture",
        "task_refs": ("seq_022", "seq_023"),
        "why_now": (
            "Freeze selection criteria, secret classes, and owner law before live onboarding "
            "scripts or vendor consoles appear."
        ),
    },
    {
        "task_group_id": "TG_NHS_LOGIN_LONG_LEAD",
        "label": "NHS Login Long Lead",
        "task_refs": ("seq_024", "seq_025"),
        "why_now": (
            "NHS login is the only current-baseline identity rail that stays on the critical path "
            "for authenticated and recovery-grade patient authority."
        ),
    },
    {
        "task_group_id": "TG_NHS_AND_PARTNER_APPROVALS",
        "label": "NHS And Partner Approvals",
        "task_refs": ("seq_026", "seq_027", "seq_028", "seq_029", "seq_030"),
        "why_now": (
            "Start long-lead NHS, interoperability, and deferred-channel approvals without "
            "letting those tracks erase the mock-first execution posture."
        ),
    },
    {
        "task_group_id": "TG_COMMERCIAL_VENDOR_ONBOARDING",
        "label": "Commercial Vendor Onboarding",
        "task_refs": ("seq_031", "seq_032", "seq_033", "seq_034", "seq_035"),
        "why_now": (
            "Telephony, notifications, transcription, and scanning need scorecards and account "
            "plans, but live credentials may trail the simulator-first engineering path."
        ),
    },
    {
        "task_group_id": "TG_PROVIDER_DISCOVERY_AND_FREEZE",
        "label": "Provider Discovery And Freeze",
        "task_refs": ("seq_036", "seq_037", "seq_038", "seq_039", "seq_040"),
        "why_now": (
            "Provider-path discovery, simulator backlog, manual checkpoints, and degraded-mode "
            "defaults turn raw dependency awareness into executable delivery law."
        ),
    },
]

RANKING_WEIGHTS = {
    "mock_now_execution": {
        "patient_safety_consequence": 6,
        "canonical_truth_effect": 6,
        "patient_visible_continuity": 5,
        "operator_truth_supportability": 5,
        "mockability_quality": 5,
        "live_acquisition_latency": 3,
        "approval_burden": 3,
        "security_privacy_burden": 2,
        "coupling_risk_if_delayed": 5,
        "readiness_value_unlocked": 6,
        "proof_rigor_demand": 6,
        "live_pressure_from_mock_limit": 1,
        "baseline_role_bonus": 1,
    },
    "actual_provider_strategy_later": {
        "patient_safety_consequence": 5,
        "canonical_truth_effect": 5,
        "patient_visible_continuity": 4,
        "operator_truth_supportability": 4,
        "mockability_quality": 1,
        "live_acquisition_latency": 6,
        "approval_burden": 6,
        "security_privacy_burden": 4,
        "coupling_risk_if_delayed": 5,
        "readiness_value_unlocked": 5,
        "proof_rigor_demand": 5,
        "live_pressure_from_mock_limit": 4,
        "baseline_role_bonus": 1,
    },
}

BASELINE_ROLE_BONUS = {
    "baseline_required": 5,
    "baseline_mock_required": 4,
    "optional_flagged": 2,
    "deferred_channel": 0,
    "future_optional": 0,
    "prohibited": -2,
}

HTML_MARKERS = [
    'data-testid="priority-cockpit-shell"',
    'data-testid="priority-filter-rail"',
    'data-testid="priority-quadrant-chart"',
    'data-testid="priority-quadrant-table"',
    'data-testid="priority-lane-board"',
    'data-testid="priority-inspector"',
    'data-testid="priority-divergence-table"',
    'data-testid="priority-task-linkage-table"',
    'data-testid="priority-risk-list"',
]


@dataclass(frozen=True)
class FamilySpec:
    integration_id: str
    integration_family: str
    integration_name: str
    source_dependency_ids: tuple[str, ...]
    baseline_role: str
    authoritative_truth_class: str
    patient_safety_impact: str
    control_plane_impact: str
    lineage_or_closure_dependency: str
    channel_dependency_classes: tuple[str, ...]
    bounded_context_refs: tuple[str, ...]
    current_mock_feasibility: str
    live_onboarding_latency_band: str
    sponsor_or_assurance_gate: str
    recommended_lane: str
    why_mock_now: str
    why_actual_later: str
    minimum_mock_fidelity: str
    minimum_live_readiness_conditions: tuple[str, ...]
    later_task_refs: tuple[str, ...]
    notes: str
    source_refs: tuple[str, ...]
    mock_placeholder_only: tuple[str, ...]
    failure_injection_expectations: tuple[str, ...]
    cannot_be_authoritative: tuple[str, ...]
    patient_safety_consequence: int
    canonical_truth_effect: int
    patient_visible_continuity: int
    operator_truth_supportability: int
    mockability_quality: int
    live_acquisition_latency: int
    approval_burden: int
    security_privacy_burden: int
    coupling_risk_if_delayed: int
    readiness_value_unlocked: int
    proof_rigor_demand: int


FAMILY_SPECS = [
    FamilySpec(
        integration_id="int_identity_nhs_login_core",
        integration_family="identity_auth",
        integration_name="NHS login core identity rail",
        source_dependency_ids=("dep_nhs_login_rail",),
        baseline_role="baseline_required",
        authoritative_truth_class="identity_session_and_writable_authority",
        patient_safety_impact="high",
        control_plane_impact="critical",
        lineage_or_closure_dependency="direct",
        channel_dependency_classes=("browser_web", "secure_link_continuation", "support_recovery"),
        bounded_context_refs=("identity_access", "patient_portal", "support_recovery"),
        current_mock_feasibility="high",
        live_onboarding_latency_band="contract_heavy",
        sponsor_or_assurance_gate="required",
        recommended_lane="hybrid_mock_then_live",
        why_mock_now=(
            "Phase 2 cannot defer auth transactions, route-intent binding, subject mismatch handling, "
            "or read-only versus writable recovery states until the partner onboarding completes."
        ),
        why_actual_later=(
            "Current-baseline authenticated and recovery-grade patient authority still depends on real "
            "redirect inventory, partner approval, and live session proof before the rail is admissible."
        ),
        minimum_mock_fidelity=(
            "Simulate frozen authorize and callback scope bundles, state or nonce or PKCE fences, consent "
            "decline, insufficient assurance, subject mismatch, callback replay, auth_read_only, claim_pending, "
            "writable, and bounded recovery. Mock callback arrival must never equal writable authority."
        ),
        minimum_live_readiness_conditions=(
            "seq_022 scorecard freezes redirect, scope, and evidence rules for the rail",
            "seq_023 secret ownership and vault-ingest posture is published for client identifiers and signing material",
            "seq_024 and seq_025 capture partner access requests plus environment-specific redirect inventory",
            "GATE_EXTERNAL_TO_FOUNDATION remains blocked until live onboarding proof is current for the active environment",
        ),
        later_task_refs=("seq_022", "seq_023", "seq_024", "seq_025", "seq_039", "seq_040"),
        notes=(
            "Core identity rail. Do not let callback success, subject claims, or token exchange stand in for "
            "SessionEstablishmentDecision plus RouteIntentBinding and current IdentityBinding."
        ),
        source_refs=(
            "blueprint/phase-2-identity-and-echoes.md#2B. NHS login bridge and local session engine",
            "blueprint/blueprint-init.md#10. Identity, consent, security, and policy",
            "data/analysis/dependency_truth_and_fallback_matrix.csv#dep_nhs_login_rail",
            "data/analysis/phase0_gate_verdict.json#GATE_P0_FOUNDATION_ENTRY",
        ),
        mock_placeholder_only=("branding chrome", "non-authoritative copy polish"),
        failure_injection_expectations=(
            "duplicate callback replay",
            "expired auth transaction",
            "consent declined",
            "subject mismatch against secure-link or draft continuation",
            "auth success without writable authority",
        ),
        cannot_be_authoritative=(
            "raw callback arrival",
            "token exchange success without session establishment",
            "subject claim without current binding and route authority",
        ),
        patient_safety_consequence=4,
        canonical_truth_effect=5,
        patient_visible_continuity=5,
        operator_truth_supportability=4,
        mockability_quality=4,
        live_acquisition_latency=5,
        approval_burden=5,
        security_privacy_burden=5,
        coupling_risk_if_delayed=5,
        readiness_value_unlocked=5,
        proof_rigor_demand=5,
    ),
    FamilySpec(
        integration_id="int_identity_pds_optional_enrichment",
        integration_family="patient_data_enrichment",
        integration_name="Optional PDS enrichment seam",
        source_dependency_ids=("dep_pds_fhir_enrichment",),
        baseline_role="optional_flagged",
        authoritative_truth_class="supporting_demographic_enrichment_only",
        patient_safety_impact="medium",
        control_plane_impact="medium",
        lineage_or_closure_dependency="indirect",
        channel_dependency_classes=("browser_web", "support_recovery", "governance_review"),
        bounded_context_refs=("identity_access", "governance", "support_operations"),
        current_mock_feasibility="high",
        live_onboarding_latency_band="contract_heavy",
        sponsor_or_assurance_gate="required",
        recommended_lane="actual_later",
        why_mock_now=(
            "Only a thin no-op or fixture seam is required now so the identity model proves PDS is optional "
            "and cannot silently become the baseline truth source."
        ),
        why_actual_later=(
            "PDS access carries legal-basis, approval, and feature-flag prerequisites and remains a later "
            "enrichment strategy rather than a current-baseline blocker."
        ),
        minimum_mock_fidelity=(
            "Model enrichment absent, enrichment available, partial demographic corroboration, and enrichment "
            "rejected without letting the seam widen identity authority or hide local matching uncertainty."
        ),
        minimum_live_readiness_conditions=(
            "seq_027 produces the optional sandbox and feature-flag plan",
            "seq_040 freezes the no-PDS degraded default and no-authority-escalation law",
            "Any tenant rollout remains behind explicit legal-basis and governance approval",
        ),
        later_task_refs=("seq_022", "seq_023", "seq_027", "seq_040"),
        notes=(
            "Do not rank PDS above NHS login. The seam may enrich matching confidence later, but it does not "
            "replace append-only binding law or become a shortcut for ownership claims."
        ),
        source_refs=(
            "blueprint/phase-2-identity-and-echoes.md#2C. Patient linkage, demographic confidence, and optional PDS enrichment",
            "blueprint/blueprint-init.md#10. Identity, consent, security, and policy",
            "data/analysis/dependency_truth_and_fallback_matrix.csv#dep_pds_fhir_enrichment",
        ),
        mock_placeholder_only=("real demographics", "real organisation identifiers", "tenant rollout cohorts"),
        failure_injection_expectations=(
            "PDS unavailable",
            "partial enrichment only",
            "enrichment contradicts local match candidate",
        ),
        cannot_be_authoritative=(
            "standalone PDS record lookup",
            "PDS response without local binding review",
        ),
        patient_safety_consequence=2,
        canonical_truth_effect=1,
        patient_visible_continuity=1,
        operator_truth_supportability=2,
        mockability_quality=5,
        live_acquisition_latency=4,
        approval_burden=4,
        security_privacy_burden=4,
        coupling_risk_if_delayed=2,
        readiness_value_unlocked=1,
        proof_rigor_demand=1,
    ),
    FamilySpec(
        integration_id="int_telephony_capture_evidence_backplane",
        integration_family="telephony_evidence",
        integration_name="Telephony capture, transcript, and artifact-safety backplane",
        source_dependency_ids=(
            "dep_telephony_ivr_recording_provider",
            "dep_transcription_processing_provider",
            "dep_malware_scanning_provider",
        ),
        baseline_role="baseline_mock_required",
        authoritative_truth_class="call_session_and_evidence_readiness",
        patient_safety_impact="critical",
        control_plane_impact="high",
        lineage_or_closure_dependency="direct",
        channel_dependency_classes=("telephony_ivr", "callback_recovery", "browser_web", "support_operations"),
        bounded_context_refs=("telephony", "evidence_classification", "artifact_quarantine", "identity_access"),
        current_mock_feasibility="medium",
        live_onboarding_latency_band="long",
        sponsor_or_assurance_gate="required",
        recommended_lane="mock_now",
        why_mock_now=(
            "Telephony parity is baseline law and the product cannot wait for live carrier, recording, transcript, "
            "or scanning accounts before it proves IVR choreography, evidence readiness, and urgent fallback states."
        ),
        why_actual_later=(
            "Live numbers, recording retention, transcript handling, and scanner placement all carry contract, "
            "privacy, and safety review before they become production truth."
        ),
        minimum_mock_fidelity=(
            "Simulate call-session creation, IVR branch capture, webhook retries, recording present or missing, "
            "transcript usable versus unusable, artifact quarantine, safety-usable versus manual-review states, "
            "callback or secure-link fallback, and urgent escalation. Answered call or file stored may not imply "
            "clinically usable evidence or completed contact."
        ),
        minimum_live_readiness_conditions=(
            "seq_031, seq_032, seq_034, and seq_035 complete the vendor selection and account-setup path",
            "seq_023 publishes secret ownership for account tokens, webhooks, phone numbers, and project identifiers",
            "seq_039 freezes manual checkpoints for recording, transcript, and quarantine failure",
            "seq_040 freezes degraded defaults so telephony never settles routine truth from weak evidence",
        ),
        later_task_refs=("seq_022", "seq_023", "seq_031", "seq_032", "seq_034", "seq_035", "seq_038", "seq_039", "seq_040"),
        notes=(
            "Treat telephony capture as a proof-bearing evidence lane, not as a commodity voice API. Transcript "
            "completion alone is never enough; the readiness assessment stays authoritative."
        ),
        source_refs=(
            "blueprint/phase-2-identity-and-echoes.md#2E. Telephony edge, IVR choreography, and call-session persistence",
            "blueprint/phase-2-identity-and-echoes.md#2F. Caller verification, voice capture, transcript stub, and SMS continuation",
            "blueprint/forensic-audit-findings.md#Finding 12 - No safe fallback when ingest or safety failed",
            "data/analysis/dependency_truth_and_fallback_matrix.csv#dep_telephony_ivr_recording_provider",
        ),
        mock_placeholder_only=("carrier branding", "real caller IDs", "real audio content"),
        failure_injection_expectations=(
            "recording missing",
            "transcript unsafe or incomplete",
            "scanner timeout",
            "duplicate telephony webhook",
            "urgent escalation during capture",
        ),
        cannot_be_authoritative=(
            "call answered event",
            "file upload acknowledgement",
            "draft transcript before readiness assessment",
        ),
        patient_safety_consequence=5,
        canonical_truth_effect=4,
        patient_visible_continuity=4,
        operator_truth_supportability=5,
        mockability_quality=3,
        live_acquisition_latency=4,
        approval_burden=4,
        security_privacy_burden=5,
        coupling_risk_if_delayed=5,
        readiness_value_unlocked=5,
        proof_rigor_demand=5,
    ),
    FamilySpec(
        integration_id="int_sms_continuation_delivery",
        integration_family="notification_sms",
        integration_name="SMS continuation delivery rail",
        source_dependency_ids=("dep_sms_notification_provider",),
        baseline_role="optional_flagged",
        authoritative_truth_class="delivery_for_seeded_or_challenge_continuation",
        patient_safety_impact="medium",
        control_plane_impact="medium",
        lineage_or_closure_dependency="indirect",
        channel_dependency_classes=("sms_secure_link_continuation", "telephony_ivr", "patient_portal"),
        bounded_context_refs=("telephony", "patient_communications", "callback_messaging"),
        current_mock_feasibility="high",
        live_onboarding_latency_band="medium",
        sponsor_or_assurance_gate="likely",
        recommended_lane="actual_later",
        why_mock_now=(
            "The internal continuation contract still needs a thin simulator so seeded versus challenge flows, "
            "delivery delay, and wrong-recipient safeguards are tested without making SMS a baseline dependency."
        ),
        why_actual_later=(
            "SMS remains optional-flagged. Live sender registration and wrong-recipient governance should trail "
            "the current MVP proof and never outrank the core identity or booking truth seams."
        ),
        minimum_mock_fidelity=(
            "Simulate queued, delayed, bounced, and expired deliveries, seeded versus challenge continuation, and "
            "grant issuance without letting provider acceptance imply grant redemption or verified reachability."
        ),
        minimum_live_readiness_conditions=(
            "seq_031 and seq_033 freeze the vendor path and sender ownership model",
            "seq_039 captures wrong-recipient and reissue checkpoints",
            "seq_040 freezes the default fallback away from SMS when the route or grant is stale",
        ),
        later_task_refs=("seq_022", "seq_031", "seq_033", "seq_039", "seq_040"),
        notes=(
            "Optional flagged only. SMS delivery is external; continuation grants, route authority, and claim law "
            "remain internal and must continue to work without live SMS."
        ),
        source_refs=(
            "blueprint/phase-2-identity-and-echoes.md#2F. Caller verification, voice capture, transcript stub, and SMS continuation",
            "data/analysis/dependency_truth_and_fallback_matrix.csv#dep_sms_notification_provider",
            "data/analysis/future_browser_automation_backlog.csv#dep_sms_notification_provider_seq_033",
        ),
        mock_placeholder_only=("real sender IDs", "real recipients"),
        failure_injection_expectations=(
            "delayed send",
            "wrong recipient suspicion",
            "expired secure link",
        ),
        cannot_be_authoritative=(
            "provider accepted send",
            "message queued",
        ),
        patient_safety_consequence=3,
        canonical_truth_effect=2,
        patient_visible_continuity=4,
        operator_truth_supportability=3,
        mockability_quality=5,
        live_acquisition_latency=3,
        approval_burden=3,
        security_privacy_burden=4,
        coupling_risk_if_delayed=3,
        readiness_value_unlocked=3,
        proof_rigor_demand=2,
    ),
    FamilySpec(
        integration_id="int_email_notification_delivery",
        integration_family="notification_email",
        integration_name="Email and secure-link notification rail",
        source_dependency_ids=("dep_email_notification_provider",),
        baseline_role="baseline_mock_required",
        authoritative_truth_class="communication_delivery_evidence",
        patient_safety_impact="medium",
        control_plane_impact="high",
        lineage_or_closure_dependency="indirect",
        channel_dependency_classes=("browser_web", "outbound_notification_delivery", "support_operations"),
        bounded_context_refs=("patient_communications", "callback_messaging", "support_operations"),
        current_mock_feasibility="high",
        live_onboarding_latency_band="medium",
        sponsor_or_assurance_gate="likely",
        recommended_lane="mock_now",
        why_mock_now=(
            "Receipts, secure-link recovery, and callback or message reassurance need realistic delivery evidence and "
            "bounce semantics before a live notification vendor is onboarded."
        ),
        why_actual_later=(
            "Live sender-domain verification, webhook ownership, and delivery evidence still need later onboarding "
            "before the system can promote calm patient or staff reassurance from a real provider."
        ),
        minimum_mock_fidelity=(
            "Simulate accepted, queued, delivered, bounced, disputed, and expired delivery chains and keep those "
            "states separate from current CommunicationEnvelope truth or secure-link authority."
        ),
        minimum_live_readiness_conditions=(
            "seq_031 and seq_033 complete vendor selection and sender-domain setup",
            "seq_023 publishes secret and webhook ownership",
            "seq_039 and seq_040 freeze resend, callback, and support-repair fallbacks for disputed delivery",
        ),
        later_task_refs=("seq_022", "seq_023", "seq_031", "seq_033", "seq_038", "seq_039", "seq_040"),
        notes=(
            "Do not let notification acceptance outrank booking, hub, or pharmacy truth. Delivery evidence informs "
            "communication posture only; it does not settle operational truth on its own."
        ),
        source_refs=(
            "blueprint/callback-and-clinician-messaging-loop.md#Clinician message domain",
            "blueprint/phase-5-the-network-horizon.md#Reminder and communication publication",
            "data/analysis/dependency_truth_and_fallback_matrix.csv#dep_email_notification_provider",
        ),
        mock_placeholder_only=("real domains", "real recipient inboxes"),
        failure_injection_expectations=(
            "queued but not delivered",
            "bounce or suppression",
            "delivery disputed after patient action",
        ),
        cannot_be_authoritative=(
            "API send acceptance",
            "SMTP accepted response",
        ),
        patient_safety_consequence=3,
        canonical_truth_effect=2,
        patient_visible_continuity=4,
        operator_truth_supportability=4,
        mockability_quality=5,
        live_acquisition_latency=3,
        approval_burden=3,
        security_privacy_burden=4,
        coupling_risk_if_delayed=3,
        readiness_value_unlocked=4,
        proof_rigor_demand=2,
    ),
    FamilySpec(
        integration_id="int_im1_pairing_and_capability_prereq",
        integration_family="gp_system_pairing",
        integration_name="IM1 pairing and capability-governance prerequisite seam",
        source_dependency_ids=("dep_im1_pairing_programme",),
        baseline_role="baseline_required",
        authoritative_truth_class="supplier_access_prerequisite_and_capability_evidence",
        patient_safety_impact="medium",
        control_plane_impact="high",
        lineage_or_closure_dependency="indirect",
        channel_dependency_classes=("staff_workspace", "booking_internal", "assurance_review"),
        bounded_context_refs=("booking", "identity_access", "assurance"),
        current_mock_feasibility="medium",
        live_onboarding_latency_band="contract_heavy",
        sponsor_or_assurance_gate="required",
        recommended_lane="hybrid_mock_then_live",
        why_mock_now=(
            "The programme needs a governed capability-matrix seam and explicit blocked states now so booking and "
            "identity work stay decoupled from live supplier pairing while the long-lead onboarding runs."
        ),
        why_actual_later=(
            "IM1 and SCAL readiness are still required before live supplier capability claims are admissible for "
            "booking reach, but the corpus explicitly keeps this out of the Phase 2 identity critical path."
        ),
        minimum_mock_fidelity=(
            "Simulate unsupported, supported-test-only, linkage-required, and blocked capability rows plus pairing-pack "
            "freshness states. The mock may not claim live supplier reach or patient-facing capability proof."
        ),
        minimum_live_readiness_conditions=(
            "seq_026 completes prerequisite forms and SCAL artifact tracking",
            "seq_036 captures provider-path evidence against the frozen capability scorecards",
            "seq_039 and seq_040 freeze manual checkpoints and degraded booking defaults while supplier access is partial",
        ),
        later_task_refs=("seq_022", "seq_023", "seq_026", "seq_036", "seq_039", "seq_040"),
        notes=(
            "Long-lead baseline dependency. Keep IM1 out of the Phase 2 identity critical path even while starting "
            "the pairing programme early for later booking reach."
        ),
        source_refs=(
            "blueprint/phase-2-identity-and-echoes.md#Rule 5: keep IM1 out of the critical path for this phase",
            "blueprint/phase-4-the-booking-engine.md#4B. Provider capability matrix and adapter seam",
            "data/analysis/dependency_truth_and_fallback_matrix.csv#dep_im1_pairing_programme",
        ),
        mock_placeholder_only=("real supplier credentials", "live pairing approvals"),
        failure_injection_expectations=(
            "supported test only",
            "pairing evidence stale",
            "supplier path missing for selected capability",
        ),
        cannot_be_authoritative=(
            "supplier docs alone",
            "pairing application submitted",
        ),
        patient_safety_consequence=2,
        canonical_truth_effect=3,
        patient_visible_continuity=2,
        operator_truth_supportability=4,
        mockability_quality=3,
        live_acquisition_latency=5,
        approval_burden=5,
        security_privacy_burden=4,
        coupling_risk_if_delayed=5,
        readiness_value_unlocked=5,
        proof_rigor_demand=3,
    ),
    FamilySpec(
        integration_id="int_local_booking_provider_truth",
        integration_family="booking_provider_truth",
        integration_name="Local booking provider capability and confirmation-truth seam",
        source_dependency_ids=("dep_gp_system_supplier_paths", "dep_local_booking_supplier_adapters"),
        baseline_role="baseline_mock_required",
        authoritative_truth_class="booking_confirmation_truth_projection",
        patient_safety_impact="high",
        control_plane_impact="critical",
        lineage_or_closure_dependency="direct",
        channel_dependency_classes=("patient_portal", "staff_workspace", "booking_internal"),
        bounded_context_refs=("booking", "patient_portal", "staff_operations"),
        current_mock_feasibility="medium",
        live_onboarding_latency_band="contract_heavy",
        sponsor_or_assurance_gate="required",
        recommended_lane="mock_now",
        why_mock_now=(
            "Booking revalidation, confirmation ambiguity, waitlist fallback, and manage-freeze rules must be proven "
            "behind a simulator before any supplier path, pairing, or portal credential becomes current."
        ),
        why_actual_later=(
            "Live patient-facing booking still needs provider-path evidence, pairing readiness, and exact confirmation "
            "proof before it can move beyond simulator-backed development."
        ),
        minimum_mock_fidelity=(
            "Simulate slot search snapshots, capability resolution, held versus non-exclusive reservation truth, "
            "revalidation failure, confirmation_pending, disputed callbacks, same-commit read-after-write proof, "
            "manage freeze, waitlist fallback, and wrong-patient freeze. Queue or webhook acceptance may not imply booked truth."
        ),
        minimum_live_readiness_conditions=(
            "seq_036 publishes provider sandbox paths and booking capability evidence",
            "seq_038 builds the local adapter simulator backlog for unsupported or manual supplier paths",
            "seq_039 and seq_040 freeze manual confirmation checkpoints and degraded-mode defaults",
        ),
        later_task_refs=("seq_022", "seq_026", "seq_036", "seq_038", "seq_039", "seq_040"),
        notes=(
            "Proof-bearing family. Confirmation truth must stay distinct from acceptance, queueing, or webhook arrival."
        ),
        source_refs=(
            "blueprint/phase-4-the-booking-engine.md#4B. Provider capability matrix and adapter seam",
            "blueprint/phase-4-the-booking-engine.md#4C. Slot search, normalisation, and availability snapshots",
            "blueprint/phase-4-the-booking-engine.md#4E. Commit path, revalidation, booking record, and compensation",
            "blueprint/forensic-audit-findings.md#Finding 72 - The booking commit path did not bind ambiguous supplier truth to canonical confirmation gates strongly enough",
        ),
        mock_placeholder_only=("supplier branding", "practice-specific routing labels"),
        failure_injection_expectations=(
            "supplier accepted but not confirmed",
            "read-after-write mismatch",
            "stale provider binding",
            "slot revalidation failure",
            "waitlist fallback required",
        ),
        cannot_be_authoritative=(
            "slot shown in UI",
            "provider accepted for processing",
            "callback arrival without confirmation truth",
        ),
        patient_safety_consequence=4,
        canonical_truth_effect=5,
        patient_visible_continuity=5,
        operator_truth_supportability=5,
        mockability_quality=3,
        live_acquisition_latency=5,
        approval_burden=4,
        security_privacy_burden=4,
        coupling_risk_if_delayed=5,
        readiness_value_unlocked=5,
        proof_rigor_demand=5,
    ),
    FamilySpec(
        integration_id="int_network_capacity_and_practice_ack",
        integration_family="hub_capacity_and_ack",
        integration_name="Network capacity and practice-acknowledgement seam",
        source_dependency_ids=("dep_network_capacity_partner_feeds", "dep_origin_practice_ack_rail"),
        baseline_role="baseline_mock_required",
        authoritative_truth_class="trusted_offerable_capacity_and_practice_visibility_debt",
        patient_safety_impact="high",
        control_plane_impact="high",
        lineage_or_closure_dependency="direct",
        channel_dependency_classes=("hub_console", "operations_console", "practice_visibility"),
        bounded_context_refs=("hub_coordination", "operations", "practice_visibility"),
        current_mock_feasibility="medium",
        live_onboarding_latency_band="long",
        sponsor_or_assurance_gate="likely",
        recommended_lane="mock_now",
        why_mock_now=(
            "Hub choice, callback fallback, practice visibility debt, and acknowledgement overdue states must be "
            "available to product and platform teams before real partner feeds or practice routes exist."
        ),
        why_actual_later=(
            "Live partner feeds and practice acknowledgements still need data-sharing and trust review before they can "
            "drive patient-visible offers or closable hub outcomes."
        ),
        minimum_mock_fidelity=(
            "Simulate trusted versus stale capacity snapshots, callback fallback, return-to-practice, acknowledgement "
            "generations, overdue practice debt, and supplier drift without letting stale feeds or missing ack clear the case."
        ),
        minimum_live_readiness_conditions=(
            "seq_036 identifies real partner-path evidence relevant to hub booking",
            "seq_038 and seq_039 freeze simulator scope and manual acknowledgement checkpoints",
            "seq_040 freezes callback and return-to-practice defaults when source freshness or practice ack is degraded",
        ),
        later_task_refs=("seq_022", "seq_036", "seq_038", "seq_039", "seq_040"),
        notes=(
            "Hub flows must stay subordinate to trusted_offerable capacity and current-generation practice visibility debt."
        ),
        source_refs=(
            "blueprint/phase-5-the-network-horizon.md#5C. Enhanced Access policy engine and network capacity ingestion",
            "blueprint/phase-5-the-network-horizon.md#5F. Native hub booking commit, practice continuity, and cross-org messaging",
            "blueprint/phase-5-the-network-horizon.md#5G. No-slot handling, urgent bounce-back, callback fallback, and reopen mechanics",
            "data/analysis/dependency_truth_and_fallback_matrix.csv#dep_network_capacity_partner_feeds",
        ),
        mock_placeholder_only=("real practice names", "real site addresses"),
        failure_injection_expectations=(
            "stale feed",
            "practice acknowledgement overdue",
            "offer invalidated after patient selection",
            "return to practice reopened",
        ),
        cannot_be_authoritative=(
            "spreadsheet-style partner feed import",
            "booked hub state without current ack generation",
        ),
        patient_safety_consequence=4,
        canonical_truth_effect=4,
        patient_visible_continuity=5,
        operator_truth_supportability=5,
        mockability_quality=3,
        live_acquisition_latency=4,
        approval_burden=4,
        security_privacy_burden=3,
        coupling_risk_if_delayed=4,
        readiness_value_unlocked=4,
        proof_rigor_demand=4,
    ),
    FamilySpec(
        integration_id="int_cross_org_secure_messaging",
        integration_family="cross_org_messaging",
        integration_name="Cross-organisation secure messaging and MESH seam",
        source_dependency_ids=("dep_cross_org_secure_messaging_mesh",),
        baseline_role="baseline_mock_required",
        authoritative_truth_class="proof_bearing_transport_chain",
        patient_safety_impact="medium",
        control_plane_impact="high",
        lineage_or_closure_dependency="direct",
        channel_dependency_classes=("hub_console", "pharmacy_console", "practice_visibility"),
        bounded_context_refs=("hub_coordination", "pharmacy", "support_operations"),
        current_mock_feasibility="medium",
        live_onboarding_latency_band="contract_heavy",
        sponsor_or_assurance_gate="required",
        recommended_lane="hybrid_mock_then_live",
        why_mock_now=(
            "Hub, practice, and pharmacy message flows need replay-safe transport proof, ambiguity, and escalation "
            "behavior now even though live mailbox or certificate onboarding will lag."
        ),
        why_actual_later=(
            "Real mailboxes, certificates, minimum-necessary payload review, and cross-org approvals are later work "
            "that should start early but must not stall simulator-backed implementation."
        ),
        minimum_mock_fidelity=(
            "Simulate ordered outbox dispatch, queue acceptance, mailbox receipt, duplicate or reordered callbacks, "
            "disputed delivery, proof upgrades, and escalation routes. Transport acceptance alone may never settle hub "
            "or pharmacy truth, and the mock must preserve explicit proof versus ambiguity states for every effect chain."
        ),
        minimum_live_readiness_conditions=(
            "seq_028 completes mailbox or route access requests",
            "seq_023 publishes certificate and endpoint secret ownership",
            "seq_039 and seq_040 freeze manual checkpoints and fallback routes for disputed or weak transport proof",
        ),
        later_task_refs=("seq_022", "seq_023", "seq_028", "seq_038", "seq_039", "seq_040"),
        notes=(
            "Proof-bearing transport family. Weak mailbox or weak transport semantics must stay visibly distinct from business settlement."
        ),
        source_refs=(
            "blueprint/phase-5-the-network-horizon.md#5F. Native hub booking commit, practice continuity, and cross-org messaging",
            "blueprint/phase-6-the-pharmacy-loop.md#6D. Referral pack composer, dispatch adapters, and transport contract",
            "data/analysis/dependency_truth_and_fallback_matrix.csv#dep_cross_org_secure_messaging_mesh",
        ),
        mock_placeholder_only=("real mailbox IDs", "real certificates"),
        failure_injection_expectations=(
            "duplicate receipt",
            "reordered callback",
            "accepted for transport but not delivered",
            "mailbox offline",
        ),
        cannot_be_authoritative=(
            "queue dequeue",
            "transport accepted",
            "mailbox queued",
        ),
        patient_safety_consequence=3,
        canonical_truth_effect=4,
        patient_visible_continuity=4,
        operator_truth_supportability=4,
        mockability_quality=3,
        live_acquisition_latency=5,
        approval_burden=5,
        security_privacy_burden=5,
        coupling_risk_if_delayed=4,
        readiness_value_unlocked=4,
        proof_rigor_demand=5,
    ),
    FamilySpec(
        integration_id="int_pharmacy_directory_and_choice",
        integration_family="pharmacy_directory",
        integration_name="Pharmacy directory and patient-choice seam",
        source_dependency_ids=("dep_pharmacy_directory_dohs",),
        baseline_role="baseline_mock_required",
        authoritative_truth_class="directory_snapshot_and_choice_proof",
        patient_safety_impact="medium",
        control_plane_impact="medium",
        lineage_or_closure_dependency="indirect",
        channel_dependency_classes=("patient_portal", "pharmacy_console", "operations_console"),
        bounded_context_refs=("pharmacy", "patient_portal", "operations"),
        current_mock_feasibility="high",
        live_onboarding_latency_band="long",
        sponsor_or_assurance_gate="likely",
        recommended_lane="mock_now",
        why_mock_now=(
            "Patient choice, warned-choice explanations, opening-hours logic, and consent supersession need a "
            "stable directory simulator long before a real strategic search rail is current."
        ),
        why_actual_later=(
            "Live directory access and source-freshness proof remain later onboarding work and should not be "
            "treated as a current-baseline blocker while the choice contract is still being built."
        ),
        minimum_mock_fidelity=(
            "Simulate snapshot freshness, provider opening hours, provider withdrawal, no-safe-choice conditions, "
            "warned choices, and consent reset when the selected provider or pathway drifts."
        ),
        minimum_live_readiness_conditions=(
            "seq_037 documents real directory and update-record access paths",
            "seq_038 captures simulator backlog coverage for no-safe-choice and stale-directory states",
            "seq_040 freezes fallback wording and renewed-choice behavior when the directory tuple drifts",
        ),
        later_task_refs=("seq_022", "seq_037", "seq_038", "seq_039", "seq_040"),
        notes=(
            "Directory drift may supersede the choice tuple, but it may not silently reorder or reinterpret a frozen patient choice."
        ),
        source_refs=(
            "blueprint/blueprint-init.md#7. Pharmacy First pathway",
            "blueprint/phase-6-the-pharmacy-loop.md#6C. Pharmacy discovery, provider choice, and directory abstraction",
            "data/analysis/dependency_truth_and_fallback_matrix.csv#dep_pharmacy_directory_dohs",
        ),
        mock_placeholder_only=("real pharmacy names", "real addresses"),
        failure_injection_expectations=(
            "directory stale",
            "provider no longer open",
            "warned choice required",
        ),
        cannot_be_authoritative=(
            "legacy lookup heuristics",
            "directory row without frozen choice proof",
        ),
        patient_safety_consequence=3,
        canonical_truth_effect=2,
        patient_visible_continuity=4,
        operator_truth_supportability=3,
        mockability_quality=5,
        live_acquisition_latency=4,
        approval_burden=3,
        security_privacy_burden=2,
        coupling_risk_if_delayed=4,
        readiness_value_unlocked=4,
        proof_rigor_demand=3,
    ),
    FamilySpec(
        integration_id="int_pharmacy_dispatch_and_urgent_return",
        integration_family="pharmacy_transport",
        integration_name="Pharmacy dispatch proof and urgent-return seam",
        source_dependency_ids=("dep_pharmacy_referral_transport", "dep_pharmacy_urgent_return_professional_routes"),
        baseline_role="baseline_mock_required",
        authoritative_truth_class="dispatch_proof_and_urgent_return_acknowledgement",
        patient_safety_impact="critical",
        control_plane_impact="critical",
        lineage_or_closure_dependency="direct",
        channel_dependency_classes=("pharmacy_console", "patient_portal", "support_operations"),
        bounded_context_refs=("pharmacy", "operations", "support_operations"),
        current_mock_feasibility="low",
        live_onboarding_latency_band="contract_heavy",
        sponsor_or_assurance_gate="required",
        recommended_lane="mock_now",
        why_mock_now=(
            "The pharmacy loop cannot wait for live dispatch or monitored urgent-return routes before it proves frozen "
            "package hashes, transport ambiguity, redispatch, and urgent reopen behavior."
        ),
        why_actual_later=(
            "Real monitored routes, transport assurance, and professional escalation contacts are later onboarding work, "
            "but the simulator must already preserve their proof versus ambiguity law."
        ),
        minimum_mock_fidelity=(
            "Simulate dispatch attempts, transport accepted versus authoritative proof, proof deadlines, redispatch, "
            "weak email or weak mailbox returns, urgent return phone escalation, and reopen-for-safety. Update Record "
            "may not stand in for urgent return and mock send acceptance may not count as resolved dispatch truth."
        ),
        minimum_live_readiness_conditions=(
            "seq_037 identifies live transport and urgent-return access paths",
            "seq_038 captures the simulator backlog for proof deadlines, redispatch, and weak-route ambiguity",
            "seq_039 freezes the manual approval checkpoints for urgent return and monitored mailbox or phone recovery",
            "seq_040 freezes dispatch confirmation defaults and no-authority behavior for weak transport proof",
        ),
        later_task_refs=("seq_022", "seq_037", "seq_038", "seq_039", "seq_040"),
        notes=(
            "Low mock feasibility does not excuse low fidelity. This family is exactly where proof-bearing and simple transport semantics must not be flattened."
        ),
        source_refs=(
            "blueprint/phase-6-the-pharmacy-loop.md#6D. Referral pack composer, dispatch adapters, and transport contract",
            "blueprint/phase-6-the-pharmacy-loop.md#6G. Bounce-back, urgent return, and reopen mechanics",
            "blueprint/forensic-audit-findings.md#Patch response. Hardened E_PHARM_SEND into a proof-backed dispatch chain",
        ),
        mock_placeholder_only=("real destination identifiers", "real professional phone numbers"),
        failure_injection_expectations=(
            "transport accepted only",
            "provider acceptance missing",
            "proof deadline missed",
            "urgent return digital route unavailable",
            "redispatch after duplicate receipt",
        ),
        cannot_be_authoritative=(
            "transport accepted",
            "mailbox delivery only",
            "Update Record message for urgent return",
        ),
        patient_safety_consequence=5,
        canonical_truth_effect=5,
        patient_visible_continuity=5,
        operator_truth_supportability=5,
        mockability_quality=2,
        live_acquisition_latency=5,
        approval_burden=5,
        security_privacy_burden=4,
        coupling_risk_if_delayed=5,
        readiness_value_unlocked=5,
        proof_rigor_demand=5,
    ),
    FamilySpec(
        integration_id="int_pharmacy_outcome_reconciliation",
        integration_family="pharmacy_outcome",
        integration_name="Pharmacy outcome observation and reconciliation seam",
        source_dependency_ids=("dep_pharmacy_outcome_observation",),
        baseline_role="baseline_mock_required",
        authoritative_truth_class="outcome_observation_and_reconciliation_gate",
        patient_safety_impact="critical",
        control_plane_impact="high",
        lineage_or_closure_dependency="direct",
        channel_dependency_classes=("pharmacy_console", "staff_workspace", "operations_console"),
        bounded_context_refs=("pharmacy", "triage", "operations"),
        current_mock_feasibility="high",
        live_onboarding_latency_band="long",
        sponsor_or_assurance_gate="required",
        recommended_lane="mock_now",
        why_mock_now=(
            "Outcome replay, weak correlation, manual review, and reopened-for-safety behavior are canonical control "
            "problems and must be testable before the live assured observation path exists."
        ),
        why_actual_later=(
            "Real Update Record or equivalent inbound observation routes need assured combinations and correlation "
            "evidence later, but they do not remove the need for a replay-safe mock seam now."
        ),
        minimum_mock_fidelity=(
            "Simulate exact replay, semantic replay, collision review, unresolved match, resolved_apply, resolved_reopen, "
            "unmatched, proof-bearing correlation chains, and blocked closure. Weakly matched outcomes may not auto-close "
            "the request or stand in for authoritative proof."
        ),
        minimum_live_readiness_conditions=(
            "seq_037 identifies real outcome access paths and update-record constraints",
            "seq_038 captures simulator coverage for weak-match, duplicate, and manual-review gates",
            "seq_039 and seq_040 freeze manual-apply, reopen, and no-auto-close defaults for ambiguous outcome evidence",
        ),
        later_task_refs=("seq_022", "seq_037", "seq_038", "seq_039", "seq_040"),
        notes=(
            "Outcome ingest is replay-safe or it is not safe. This family blocks closure until the reconciliation gate settles."
        ),
        source_refs=(
            "blueprint/phase-6-the-pharmacy-loop.md#6F. Outcome ingest, Update Record observation, and reconciliation",
            "blueprint/phase-6-the-pharmacy-loop.md#6G. Bounce-back, urgent return, and reopen mechanics",
            "data/analysis/dependency_truth_and_fallback_matrix.csv#dep_pharmacy_outcome_observation",
        ),
        mock_placeholder_only=("real patient summaries", "real message identifiers"),
        failure_injection_expectations=(
            "exact replay",
            "semantic replay",
            "collision review",
            "weak match reopened for safety",
        ),
        cannot_be_authoritative=(
            "single inbound message without correlation proof",
            "weakly matched email outcome",
        ),
        patient_safety_consequence=5,
        canonical_truth_effect=4,
        patient_visible_continuity=4,
        operator_truth_supportability=5,
        mockability_quality=4,
        live_acquisition_latency=4,
        approval_burden=4,
        security_privacy_burden=4,
        coupling_risk_if_delayed=5,
        readiness_value_unlocked=5,
        proof_rigor_demand=5,
    ),
    FamilySpec(
        integration_id="int_nhs_app_embedded_channel",
        integration_family="embedded_channel",
        integration_name="NHS App embedded-channel ecosystem",
        source_dependency_ids=("dep_nhs_app_embedded_channel_ecosystem",),
        baseline_role="deferred_channel",
        authoritative_truth_class="embedded_manifest_and_bridge_eligibility",
        patient_safety_impact="low",
        control_plane_impact="medium",
        lineage_or_closure_dependency="indirect",
        channel_dependency_classes=("embedded_channel", "patient_portal", "release_control"),
        bounded_context_refs=("patient_portal", "identity_access", "release_control"),
        current_mock_feasibility="high",
        live_onboarding_latency_band="contract_heavy",
        sponsor_or_assurance_gate="required",
        recommended_lane="deferred",
        why_mock_now=(
            "Only preserve manifest, bridge-capability, and downgrade contracts in a local simulator so future "
            "embedded work cannot violate current shell or release law."
        ),
        why_actual_later=(
            "Phase 7 remains deferred channel expansion and may not become a current-baseline blocker or reorder "
            "the live-provider acquisition queue."
        ),
        minimum_mock_fidelity=(
            "Simulate embedded manifest present or missing, bridge capability denied, safe browser handoff, route-freeze "
            "fallback, and placeholder-only embedded visibility. The deferred channel may not imply current-baseline writability."
        ),
        minimum_live_readiness_conditions=(
            "seq_029 and seq_030 produce only deferred-channel placeholders and access-request strategy",
            "seq_040 freezes downgrade and safe browser-handoff defaults before any future embedded rollout",
        ),
        later_task_refs=("seq_029", "seq_030", "seq_040"),
        notes=(
            "Deferred by programme law. Inventory it, sequence it, but do not let it block current-baseline execution."
        ),
        source_refs=(
            "blueprint/phase-cards.md#Programme Baseline Update (NHS App Deferred)",
            "blueprint/phase-7-inside-the-nhs-app.md",
            "data/analysis/dependency_truth_and_fallback_matrix.csv#dep_nhs_app_embedded_channel_ecosystem",
        ),
        mock_placeholder_only=("real site-link metadata", "real embedded host contexts"),
        failure_injection_expectations=(
            "bridge unavailable",
            "manifest stale",
            "embedded route frozen",
        ),
        cannot_be_authoritative=(
            "embedded host frame present",
            "placeholder site-link registration",
        ),
        patient_safety_consequence=1,
        canonical_truth_effect=1,
        patient_visible_continuity=3,
        operator_truth_supportability=2,
        mockability_quality=4,
        live_acquisition_latency=5,
        approval_burden=5,
        security_privacy_burden=4,
        coupling_risk_if_delayed=1,
        readiness_value_unlocked=1,
        proof_rigor_demand=3,
    ),
    FamilySpec(
        integration_id="int_assistive_vendor_boundary",
        integration_family="assistive_vendor",
        integration_name="Assistive model-vendor boundary",
        source_dependency_ids=("dep_assistive_model_vendor_family",),
        baseline_role="future_optional",
        authoritative_truth_class="assistive_capability_trust_envelope",
        patient_safety_impact="low",
        control_plane_impact="low",
        lineage_or_closure_dependency="none",
        channel_dependency_classes=("assistive_control", "staff_workspace", "governance_review"),
        bounded_context_refs=("assistive", "staff_workspace", "assurance"),
        current_mock_feasibility="high",
        live_onboarding_latency_band="contract_heavy",
        sponsor_or_assurance_gate="required",
        recommended_lane="deferred",
        why_mock_now=(
            "Keep only bounded observe-only and placeholder-only seams alive so core clinical and operational "
            "delivery stays complete without any model-vendor dependency."
        ),
        why_actual_later=(
            "Future assistive onboarding depends on intended-use decisions, medical-device boundary review, "
            "supplier assurance, and rollout cohorts that remain optional to core completeness."
        ),
        minimum_mock_fidelity=(
            "Simulate observe_only, shadow_only, frozen, placeholder_only, and hidden states. Assistive output may "
            "not become authoritative action, closure, or patient reassurance in the mock."
        ),
        minimum_live_readiness_conditions=(
            "A future assistive rollout must carry explicit intended-use and assurance approval",
            "seq_040 preserves the non-authoritative default even while optional vendor strategy is documented",
        ),
        later_task_refs=("seq_040",),
        notes=(
            "Optional to core completeness. Do not let model-vendor glamour or roadmap curiosity displace current-baseline need."
        ),
        source_refs=(
            "blueprint/phase-cards.md#Programme Baseline Update (NHS App Deferred)",
            "data/analysis/external_dependencies.json#dep_assistive_model_vendor_family",
            "data/analysis/dependency_watchlist.json#dep_assistive_model_vendor_family",
        ),
        mock_placeholder_only=("real prompts", "real model vendors", "real subprocessors"),
        failure_injection_expectations=(
            "assistive trust withdrawn",
            "rollout frozen",
            "output hidden after watch-tuple drift",
        ),
        cannot_be_authoritative=(
            "model suggestion",
            "assistive draft alone",
        ),
        patient_safety_consequence=1,
        canonical_truth_effect=1,
        patient_visible_continuity=1,
        operator_truth_supportability=2,
        mockability_quality=4,
        live_acquisition_latency=4,
        approval_burden=5,
        security_privacy_burden=5,
        coupling_risk_if_delayed=2,
        readiness_value_unlocked=1,
        proof_rigor_demand=3,
    ),
    FamilySpec(
        integration_id="int_standards_and_assurance_watch",
        integration_family="assurance_source_watch",
        integration_name="NHS standards and assurance source watch",
        source_dependency_ids=("dep_nhs_assurance_and_standards_sources",),
        baseline_role="baseline_required",
        authoritative_truth_class="standards_version_map_and_watchlist",
        patient_safety_impact="medium",
        control_plane_impact="high",
        lineage_or_closure_dependency="none",
        channel_dependency_classes=("governance_review", "release_control", "assurance_review"),
        bounded_context_refs=("assurance", "release_control", "governance"),
        current_mock_feasibility="high",
        live_onboarding_latency_band="short",
        sponsor_or_assurance_gate="none",
        recommended_lane="mock_now",
        why_mock_now=(
            "The external-readiness programme needs a pinned standards watch immediately so the rest of the provider "
            "strategy does not drift onto stale guidance or undocumented approval assumptions."
        ),
        why_actual_later=(
            "There is no provider-acquisition track here; later work is watch refresh and exception handling, not "
            "a separate onboarding exercise."
        ),
        minimum_mock_fidelity=(
            "Maintain one pinned version map, freshness digest, and change-watch signal so new docs or standards changes "
            "never silently widen capability or compliance claims."
        ),
        minimum_live_readiness_conditions=(
            "seq_039 records manual review checkpoints when a watched standard changes",
            "seq_040 freezes current assumption and degraded defaults when standards drift is unresolved",
        ),
        later_task_refs=("seq_039", "seq_040"),
        notes=(
            "The family is read-mostly, but it is still a baseline requirement because stale standards can invalidate the rest of the ranking."
        ),
        source_refs=(
            "blueprint/blueprint-init.md#12. Practical engineering shape",
            "data/analysis/dependency_watchlist.json#dep_nhs_assurance_and_standards_sources",
            "data/analysis/master_risk_register.json#HZ_URGENT_DIVERSION_UNDER_OR_OVER_TRIAGE",
        ),
        mock_placeholder_only=("remote URLs",),
        failure_injection_expectations=(
            "watched standard changes",
            "onboarding guide stale",
        ),
        cannot_be_authoritative=(
            "old documentation snapshot after watch drift",
        ),
        patient_safety_consequence=2,
        canonical_truth_effect=1,
        patient_visible_continuity=1,
        operator_truth_supportability=3,
        mockability_quality=5,
        live_acquisition_latency=1,
        approval_burden=1,
        security_privacy_burden=1,
        coupling_risk_if_delayed=4,
        readiness_value_unlocked=4,
        proof_rigor_demand=2,
    ),
]


def load_json(path: Path) -> Any:
    return json.loads(path.read_text())


def load_csv(path: Path) -> list[dict[str, str]]:
    with path.open() as handle:
        return list(csv.DictReader(handle))


def json_cell(value: Any) -> str:
    return json.dumps(value, ensure_ascii=True)


def task_sort_key(task_ref: str) -> tuple[int, str]:
    try:
        return (int(task_ref.split("_")[1]), task_ref)
    except (IndexError, ValueError):
        return (9999, task_ref)


def join_list(items: list[str] | tuple[str, ...], separator: str = ", ") -> str:
    return separator.join(items)


def md_escape(value: str) -> str:
    return value.replace("|", "\\|")


def render_md_table(headers: list[str], rows: list[list[str]]) -> str:
    output = ["| " + " | ".join(headers) + " |", "| " + " | ".join(["---"] * len(headers)) + " |"]
    for row in rows:
        output.append("| " + " | ".join(md_escape(cell) for cell in row) + " |")
    return "\n".join(output)


def assert_true(condition: bool, message: str) -> None:
    if not condition:
        raise SystemExit(message)


def ensure_prerequisites() -> dict[str, Any]:
    missing = [name for name, path in REQUIRED_INPUTS.items() if not path.exists()]
    if missing:
        raise SystemExit(
            "Missing seq_021 prerequisites:\n"
            + "\n".join(f"PREREQUISITE_GAP_{name.upper()}: {REQUIRED_INPUTS[name]}" for name in sorted(missing))
        )

    external_dependencies = load_json(REQUIRED_INPUTS["external_dependencies"])
    phase0_gate_verdict = load_json(REQUIRED_INPUTS["phase0_gate_verdict"])
    coverage_summary = load_json(REQUIRED_INPUTS["coverage_summary"])

    assert_true(
        phase0_gate_verdict["gate_verdicts"][0]["verdict"] == "withheld",
        "PREREQUISITE_GAP_GATE_DRIFT: seq_020 no longer reports Phase 0 entry withheld",
    )
    assert_true(
        coverage_summary["summary"]["requirements_with_gaps_count"] == 0,
        "PREREQUISITE_GAP_TRACEABILITY_DRIFT: traceability pack no longer closes current-baseline requirement gaps",
    )

    return {
        "external_dependencies": external_dependencies,
        "truth_matrix": load_csv(REQUIRED_INPUTS["dependency_truth_matrix"]),
        "automation_backlog": load_csv(REQUIRED_INPUTS["browser_automation_backlog"]),
        "dependency_watchlist": load_json(REQUIRED_INPUTS["dependency_watchlist"]),
        "master_risk_register": load_json(REQUIRED_INPUTS["master_risk_register"]),
        "phase0_gate_verdict": phase0_gate_verdict,
        "phase0_gate_blockers": load_csv(REQUIRED_INPUTS["phase0_gate_blockers"]),
        "merge_gate_matrix": load_csv(REQUIRED_INPUTS["merge_gate_matrix"]),
        "coverage_summary": coverage_summary,
        "external_touchpoints": load_csv(REQUIRED_INPUTS["external_touchpoint_matrix"]),
        "conformance_seed": load_json(REQUIRED_INPUTS["cross_phase_conformance_seed"]),
    }


def load_checklist_titles() -> dict[str, str]:
    titles: dict[str, str] = {}
    for line in CHECKLIST_PATH.read_text().splitlines():
        stripped = line.strip()
        if not stripped.startswith("- ["):
            continue
        left, _, _ = stripped.partition(" (")
        task_token = left.split("] ", 1)[1]
        if " " in task_token:
            continue
        pieces = task_token.split("_")
        if len(pieces) < 2:
            continue
        task_ref = "_".join(pieces[:2])
        titles[task_ref] = " ".join(pieces[2:]).replace("_", " ")
    return titles


def build_indexes(prereqs: dict[str, Any]) -> dict[str, Any]:
    dependency_index = {
        row["dependency_id"]: row for row in prereqs["external_dependencies"]["dependencies"]
    }
    truth_index = {row["dependency_id"]: row for row in prereqs["truth_matrix"]}
    backlog_index: dict[str, list[dict[str, str]]] = defaultdict(list)
    for row in prereqs["automation_backlog"]:
        backlog_index[row["dependency_id"]].append(row)
    watch_index = {
        row["dependency_id"]: row for row in prereqs["dependency_watchlist"]["dependencies"]
    }
    risks_by_dependency: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for risk in prereqs["master_risk_register"]["risks"]:
        for dependency_id in risk["affected_dependency_refs"]:
            risks_by_dependency[dependency_id].append(risk)
    for dependency_id in risks_by_dependency:
        risks_by_dependency[dependency_id].sort(
            key=lambda row: (-row["risk_score"], row["risk_id"])
        )
    blockers_by_dependency: dict[str, list[dict[str, str]]] = defaultdict(list)
    for blocker in prereqs["phase0_gate_blockers"]:
        for dependency_id in json.loads(blocker["linked_dependency_refs"] or "[]"):
            blockers_by_dependency[dependency_id].append(blocker)
    merge_gate_index = {row["merge_gate_id"]: row for row in prereqs["merge_gate_matrix"]}
    touchpoints_by_dependency: dict[str, list[dict[str, str]]] = defaultdict(list)
    for touchpoint in prereqs["external_touchpoints"]:
        dependency_name = touchpoint["dependency_name"].lower()
        for dependency_id, row in dependency_index.items():
            if row["dependency_name"].lower().startswith(dependency_name.split()[0]):
                touchpoints_by_dependency[dependency_id].append(touchpoint)
    return {
        "dependency_index": dependency_index,
        "truth_index": truth_index,
        "backlog_index": backlog_index,
        "watch_index": watch_index,
        "risks_by_dependency": risks_by_dependency,
        "blockers_by_dependency": blockers_by_dependency,
        "merge_gate_index": merge_gate_index,
        "touchpoints_by_dependency": touchpoints_by_dependency,
        "checklist_titles": load_checklist_titles(),
    }


def summarize_dependencies(dependency_rows: list[dict[str, Any]]) -> str:
    names = [row["dependency_name"] for row in dependency_rows]
    return ", ".join(names)


def unique_ordered(items: list[str] | tuple[str, ...]) -> list[str]:
    seen: set[str] = set()
    ordered: list[str] = []
    for item in items:
        if not item or item in seen:
            continue
        seen.add(item)
        ordered.append(item)
    return ordered


def score_total(
    spec: FamilySpec,
    mode: str,
) -> int:
    weights = RANKING_WEIGHTS[mode]
    live_pressure_from_mock_limit = 6 - spec.mockability_quality
    total = 0
    for key, weight in weights.items():
        if key == "live_pressure_from_mock_limit":
            total += live_pressure_from_mock_limit * weight
            continue
        if key == "baseline_role_bonus":
            total += BASELINE_ROLE_BONUS[spec.baseline_role] * weight
            continue
        total += getattr(spec, key) * weight
    return total


def build_family_rows(prereqs: dict[str, Any], indexes: dict[str, Any]) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    for spec in FAMILY_SPECS:
        dependency_rows = [indexes["dependency_index"][dep_id] for dep_id in spec.source_dependency_ids]
        truth_rows = [indexes["truth_index"][dep_id] for dep_id in spec.source_dependency_ids]
        watch_rows = [
            indexes["watch_index"][dep_id]
            for dep_id in spec.source_dependency_ids
            if dep_id in indexes["watch_index"]
        ]
        risk_rows: list[dict[str, Any]] = []
        for dep_id in spec.source_dependency_ids:
            risk_rows.extend(indexes["risks_by_dependency"].get(dep_id, []))
        risk_rows = sorted(
            {row["risk_id"]: row for row in risk_rows}.values(),
            key=lambda row: (-row["risk_score"], row["risk_id"]),
        )
        backlog_rows: list[dict[str, str]] = []
        for dep_id in spec.source_dependency_ids:
            backlog_rows.extend(indexes["backlog_index"].get(dep_id, []))

        later_task_refs = unique_ordered(
            list(spec.later_task_refs)
            + [row["task_ref"] for row in backlog_rows]
        )
        later_task_refs.sort(key=task_sort_key)
        risk_refs = [row["risk_id"] for row in risk_rows[:8]]
        blocker_refs = unique_ordered(
            [
                blocker["blocker_id"]
                for dep_id in spec.source_dependency_ids
                for blocker in indexes["blockers_by_dependency"].get(dep_id, [])
            ]
        )
        source_dependency_names = [row["dependency_name"] for row in dependency_rows]
        source_refs = unique_ordered(
            list(spec.source_refs)
            + [ref for row in dependency_rows for ref in row["source_file_refs"]]
        )
        watch_lifecycle_states = unique_ordered([row["lifecycle_state"] for row in watch_rows])
        touchpoint_ids = unique_ordered([tp_id for row in dependency_rows for tp_id in row["touchpoint_ids"]])
        truth_proofs = unique_ordered([row["authoritative_success_proof"] for row in truth_rows])
        ambiguity_modes = unique_ordered(
            [mode for row in dependency_rows for mode in row["ambiguity_modes"]]
        )
        fallback_modes = unique_ordered(
            [mode for row in dependency_rows for mode in row["fallback_or_recovery_modes"]]
        )
        mock_score = score_total(spec, "mock_now_execution")
        live_score = score_total(spec, "actual_provider_strategy_later")
        mvp_necessity = round(
            (
                spec.patient_safety_consequence * 6
                + spec.canonical_truth_effect * 6
                + spec.patient_visible_continuity * 4
                + spec.operator_truth_supportability * 4
                + spec.proof_rigor_demand * 5
                + BASELINE_ROLE_BONUS[spec.baseline_role] * 4
            )
            / (6 + 6 + 4 + 4 + 5 + 4)
            * 20
        )
        live_friction = round(
            (
                spec.live_acquisition_latency * 5
                + spec.approval_burden * 5
                + spec.security_privacy_burden * 3
                + (6 - spec.mockability_quality) * 3
            )
            / (5 + 5 + 3 + 3)
            * 20
        )
        row = {
            "integration_id": spec.integration_id,
            "integration_family": spec.integration_family,
            "integration_name": spec.integration_name,
            "source_dependency_ids": list(spec.source_dependency_ids),
            "source_dependency_names": source_dependency_names,
            "baseline_role": spec.baseline_role,
            "authoritative_truth_class": spec.authoritative_truth_class,
            "patient_safety_impact": spec.patient_safety_impact,
            "control_plane_impact": spec.control_plane_impact,
            "lineage_or_closure_dependency": spec.lineage_or_closure_dependency,
            "channel_dependency_classes": list(spec.channel_dependency_classes),
            "bounded_context_refs": list(spec.bounded_context_refs),
            "current_mock_feasibility": spec.current_mock_feasibility,
            "live_onboarding_latency_band": spec.live_onboarding_latency_band,
            "sponsor_or_assurance_gate": spec.sponsor_or_assurance_gate,
            "recommended_lane": spec.recommended_lane,
            "why_mock_now": spec.why_mock_now,
            "why_actual_later": spec.why_actual_later,
            "minimum_mock_fidelity": spec.minimum_mock_fidelity,
            "minimum_live_readiness_conditions": list(spec.minimum_live_readiness_conditions),
            "later_task_refs": later_task_refs,
            "risk_refs": risk_refs,
            "notes": spec.notes,
            "source_refs": source_refs,
            "watch_lifecycle_states": watch_lifecycle_states,
            "watch_dependency_ids": [row["dependency_id"] for row in watch_rows],
            "phase0_blocker_refs": blocker_refs,
            "touchpoint_ids": touchpoint_ids,
            "truth_proof_digest": truth_proofs,
            "ambiguity_modes": ambiguity_modes,
            "fallback_modes": fallback_modes,
            "mock_placeholder_only": list(spec.mock_placeholder_only),
            "failure_injection_expectations": list(spec.failure_injection_expectations),
            "cannot_be_authoritative": list(spec.cannot_be_authoritative),
            "patient_safety_consequence": spec.patient_safety_consequence,
            "canonical_truth_effect": spec.canonical_truth_effect,
            "patient_visible_continuity": spec.patient_visible_continuity,
            "operator_truth_supportability": spec.operator_truth_supportability,
            "mockability_quality": spec.mockability_quality,
            "live_acquisition_latency": spec.live_acquisition_latency,
            "approval_burden": spec.approval_burden,
            "security_privacy_burden": spec.security_privacy_burden,
            "coupling_risk_if_delayed": spec.coupling_risk_if_delayed,
            "readiness_value_unlocked": spec.readiness_value_unlocked,
            "proof_rigor_demand": spec.proof_rigor_demand,
            "mock_now_execution_score": mock_score,
            "actual_provider_strategy_later_score": live_score,
            "quadrant_live_acquisition_friction": live_friction,
            "quadrant_mvp_control_plane_necessity": mvp_necessity,
            "summary_dependency_names": summarize_dependencies(dependency_rows),
        }
        rows.append(row)
    return rows


def apply_ranks(rows: list[dict[str, Any]]) -> None:
    for mode, score_key, rank_key in (
        ("mock_now_execution", "mock_now_execution_score", "mock_now_execution_rank"),
        ("actual_provider_strategy_later", "actual_provider_strategy_later_score", "actual_provider_strategy_later_rank"),
    ):
        ordered = sorted(
            rows,
            key=lambda row: (
                -row[score_key],
                LANE_SORT[row["recommended_lane"]],
                BASELINE_ROLE_SORT[row["baseline_role"]],
                row["integration_id"],
            ),
        )
        for rank, row in enumerate(ordered, start=1):
            row[rank_key] = rank
            row[f"{mode}_ordering_key"] = f"{rank:02d}:{row['integration_id']}"
    for row in rows:
        row["rank_delta_live_minus_mock"] = row["actual_provider_strategy_later_rank"] - row["mock_now_execution_rank"]


def divergence_class(row: dict[str, Any]) -> str:
    if row["recommended_lane"] == "deferred":
        return "deferred_or_future"
    if row["mock_now_execution_rank"] <= 5 and row["actual_provider_strategy_later_rank"] >= 8:
        return "mock_mandatory_live_can_wait"
    if row["actual_provider_strategy_later_rank"] <= 5 and row["mock_now_execution_rank"] >= 8:
        return "live_critical_later_not_current_blocker"
    if row["proof_rigor_demand"] >= 4:
        return "proof_stricter_than_public_onboarding"
    return "lane_alignment_gap"


def build_divergence_rows(rows: list[dict[str, Any]], indexes: dict[str, Any]) -> list[dict[str, Any]]:
    divergences: list[dict[str, Any]] = []
    for row in rows:
        if (
            row["recommended_lane"] == "mock_now"
            and abs(row["rank_delta_live_minus_mock"]) < 2
            and row["baseline_role"] == "baseline_required"
            and row["integration_id"] != "int_standards_and_assurance_watch"
        ):
            continue
        task_titles = [
            indexes["checklist_titles"].get(task_ref, task_ref.replace("_", " "))
            for task_ref in row["later_task_refs"]
        ]
        divergence = {
            "divergence_id": f"DIV_{row['integration_id'].upper()}",
            "integration_id": row["integration_id"],
            "integration_name": row["integration_name"],
            "divergence_class": divergence_class(row),
            "baseline_role": row["baseline_role"],
            "recommended_lane": row["recommended_lane"],
            "mock_now_execution_rank": row["mock_now_execution_rank"],
            "actual_provider_strategy_later_rank": row["actual_provider_strategy_later_rank"],
            "rank_delta_live_minus_mock": row["rank_delta_live_minus_mock"],
            "mock_now_summary": row["why_mock_now"],
            "actual_provider_summary": row["why_actual_later"],
            "proof_gap_summary": row["minimum_mock_fidelity"],
            "later_task_refs": row["later_task_refs"],
            "later_task_titles": task_titles,
            "risk_refs": row["risk_refs"],
            "notes": row["notes"],
        }
        divergences.append(divergence)
    divergences.sort(
        key=lambda row: (
            LANE_SORT.get(row["recommended_lane"], 99),
            -abs(row["rank_delta_live_minus_mock"]),
            row["mock_now_execution_rank"],
            row["integration_id"],
        )
    )
    return divergences


def build_task_links(rows: list[dict[str, Any]], checklist_titles: dict[str, str]) -> list[dict[str, Any]]:
    links: dict[str, dict[str, Any]] = {}
    group_lookup = {
        task_ref: group["label"]
        for group in TASK_GROUPS
        for task_ref in group["task_refs"]
    }
    for row in rows:
        for task_ref in row["later_task_refs"]:
            entry = links.setdefault(
                task_ref,
                {
                    "task_ref": task_ref,
                    "task_title": checklist_titles.get(task_ref, task_ref.replace("_", " ")),
                    "task_group": group_lookup.get(task_ref, "Unassigned"),
                    "integration_ids": [],
                    "integration_names": [],
                    "lanes": [],
                    "baseline_roles": [],
                },
            )
            entry["integration_ids"].append(row["integration_id"])
            entry["integration_names"].append(row["integration_name"])
            entry["lanes"].append(row["recommended_lane"])
            entry["baseline_roles"].append(row["baseline_role"])
    result = []
    for task_ref, row in links.items():
        result.append(
            {
                **row,
                "integration_ids": unique_ordered(row["integration_ids"]),
                "integration_names": unique_ordered(row["integration_names"]),
                "lanes": sorted(unique_ordered(row["lanes"]), key=lambda lane: LANE_SORT[lane]),
                "baseline_roles": sorted(
                    unique_ordered(row["baseline_roles"]),
                    key=lambda role: BASELINE_ROLE_SORT[role],
                ),
            }
        )
    result.sort(key=lambda row: task_sort_key(row["task_ref"]))
    return result


def build_task_group_summary(rows: list[dict[str, Any]], checklist_titles: dict[str, str]) -> list[dict[str, Any]]:
    task_links = build_task_links(rows, checklist_titles)
    link_index = {row["task_ref"]: row for row in task_links}
    summaries: list[dict[str, Any]] = []
    for group in TASK_GROUPS:
        impacted = []
        for task_ref in group["task_refs"]:
            if task_ref in link_index:
                impacted.extend(link_index[task_ref]["integration_ids"])
        summaries.append(
            {
                "task_group_id": group["task_group_id"],
                "label": group["label"],
                "task_refs": list(group["task_refs"]),
                "task_titles": [checklist_titles.get(ref, ref.replace("_", " ")) for ref in group["task_refs"]],
                "impacted_integration_ids": unique_ordered(impacted),
                "why_now": group["why_now"],
            }
        )
    return summaries


def build_risk_summary(rows: list[dict[str, Any]], prereqs: dict[str, Any]) -> list[dict[str, Any]]:
    risk_index = {row["risk_id"]: row for row in prereqs["master_risk_register"]["risks"]}
    impacted_integrations: dict[str, list[str]] = defaultdict(list)
    for row in rows:
        for risk_ref in row["risk_refs"]:
            impacted_integrations[risk_ref].append(row["integration_id"])
    summary: list[dict[str, Any]] = []
    for risk_id, integration_ids in impacted_integrations.items():
        risk = risk_index[risk_id]
        summary.append(
            {
                "risk_id": risk_id,
                "risk_title": risk["risk_title"],
                "risk_class": risk["risk_class"],
                "risk_score": risk["risk_score"],
                "gate_impact": risk["gate_impact"],
                "owner_role": risk["owner_role"],
                "target_due_ref": risk["target_due_ref"],
                "integration_ids": sorted(unique_ordered(integration_ids)),
                "leading_indicators": risk["leading_indicators"],
                "problem_statement": risk["problem_statement"],
            }
        )
    summary.sort(key=lambda row: (-row["risk_score"], row["risk_id"]))
    return summary


def build_summary(rows: list[dict[str, Any]], divergences: list[dict[str, Any]], prereqs: dict[str, Any]) -> dict[str, Any]:
    return {
        "integration_family_count": len(rows),
        "source_dependency_count": len(prereqs["external_dependencies"]["dependencies"]),
        "baseline_role_counts": dict(Counter(row["baseline_role"] for row in rows)),
        "lane_counts": dict(Counter(row["recommended_lane"] for row in rows)),
        "divergence_count": len(divergences),
        "top_mock_now_ids": [row["integration_id"] for row in sorted(rows, key=lambda row: row["mock_now_execution_rank"])[:5]],
        "top_live_later_ids": [
            row["integration_id"] for row in sorted(rows, key=lambda row: row["actual_provider_strategy_later_rank"])[:5]
        ],
        "phase0_entry_verdict": prereqs["phase0_gate_verdict"]["gate_verdicts"][0]["verdict"],
        "phase0_entry_reason": prereqs["phase0_gate_verdict"]["gate_verdicts"][0]["reason"],
        "external_gate_blocker_refs": [
            row["blocker_id"]
            for row in prereqs["phase0_gate_blockers"]
            if row["criterion_id"] == "CRIT_DEP_002"
        ],
    }


def build_payload(prereqs: dict[str, Any], indexes: dict[str, Any]) -> dict[str, Any]:
    rows = build_family_rows(prereqs, indexes)
    apply_ranks(rows)
    divergences = build_divergence_rows(rows, indexes)
    task_links = build_task_links(rows, indexes["checklist_titles"])
    task_groups = build_task_group_summary(rows, indexes["checklist_titles"])
    risk_summary = build_risk_summary(rows, prereqs)
    summary = build_summary(rows, divergences, prereqs)
    lane_groups: dict[str, list[str]] = defaultdict(list)
    for row in sorted(rows, key=lambda item: (LANE_SORT[item["recommended_lane"]], item["mock_now_execution_rank"])):
        lane_groups[row["recommended_lane"]].append(row["integration_id"])
    payload = {
        "model_id": "INT_PRIORITY_021",
        "generated_at": datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z"),
        "mission": MISSION,
        "visual_mode": VISUAL_MODE,
        "source_precedence": SOURCE_PRECEDENCE,
        "upstream_inputs": {key: str(path.relative_to(ROOT)) for key, path in REQUIRED_INPUTS.items()},
        "summary": summary,
        "task_groups": task_groups,
        "task_links": task_links,
        "risk_summary": risk_summary,
        "divergence_register": divergences,
        "integration_families": rows,
        "lane_groups": {lane: ids for lane, ids in sorted(lane_groups.items(), key=lambda item: LANE_SORT[item[0]])},
        "scoring_model": {
            "weights": RANKING_WEIGHTS,
            "baseline_role_bonus": BASELINE_ROLE_BONUS,
            "dimensions": [
                "patient_safety_consequence",
                "canonical_truth_effect",
                "patient_visible_continuity",
                "operator_truth_supportability",
                "mockability_quality",
                "live_acquisition_latency",
                "approval_burden",
                "security_privacy_burden",
                "coupling_risk_if_delayed",
                "readiness_value_unlocked",
                "proof_rigor_demand",
            ],
        },
        "assumptions": [
            "ASSUMPTION_021_001: baseline_role captures current execution need for seq_021-040, not the eventual production necessity of every live provider.",
            "ASSUMPTION_021_002: current MVP evidence can proceed with simulator-first delivery for booking, hub, messaging, pharmacy, and telephony so long as proof, ambiguity, and degraded fallbacks remain explicit.",
            "ASSUMPTION_021_003: standards-watch work is modelled inside the same board because stale guidance can invalidate later live-onboarding decisions even though it is not a provider onboarding path.",
        ],
    }
    return payload


def write_csv_rows(path: Path, rows: list[dict[str, Any]]) -> None:
    assert_true(rows, f"Refusing to write empty CSV: {path}")
    fieldnames = list(rows[0].keys())
    with path.open("w", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        for row in rows:
            writer.writerow(row)


def build_matrix_csv_rows(payload: dict[str, Any]) -> list[dict[str, Any]]:
    rows = []
    for row in payload["integration_families"]:
        csv_row = {
            "integration_id": row["integration_id"],
            "integration_family": row["integration_family"],
            "integration_name": row["integration_name"],
            "source_dependency_ids": json_cell(row["source_dependency_ids"]),
            "source_dependency_names": json_cell(row["source_dependency_names"]),
            "baseline_role": row["baseline_role"],
            "authoritative_truth_class": row["authoritative_truth_class"],
            "patient_safety_impact": row["patient_safety_impact"],
            "control_plane_impact": row["control_plane_impact"],
            "lineage_or_closure_dependency": row["lineage_or_closure_dependency"],
            "channel_dependency_classes": json_cell(row["channel_dependency_classes"]),
            "bounded_context_refs": json_cell(row["bounded_context_refs"]),
            "current_mock_feasibility": row["current_mock_feasibility"],
            "live_onboarding_latency_band": row["live_onboarding_latency_band"],
            "sponsor_or_assurance_gate": row["sponsor_or_assurance_gate"],
            "recommended_lane": row["recommended_lane"],
            "why_mock_now": row["why_mock_now"],
            "why_actual_later": row["why_actual_later"],
            "minimum_mock_fidelity": row["minimum_mock_fidelity"],
            "minimum_live_readiness_conditions": json_cell(row["minimum_live_readiness_conditions"]),
            "later_task_refs": json_cell(row["later_task_refs"]),
            "risk_refs": json_cell(row["risk_refs"]),
            "notes": row["notes"],
            "source_refs": json_cell(row["source_refs"]),
            "watch_lifecycle_states": json_cell(row["watch_lifecycle_states"]),
            "phase0_blocker_refs": json_cell(row["phase0_blocker_refs"]),
            "mock_placeholder_only": json_cell(row["mock_placeholder_only"]),
            "failure_injection_expectations": json_cell(row["failure_injection_expectations"]),
            "cannot_be_authoritative": json_cell(row["cannot_be_authoritative"]),
            "mock_now_execution_score": row["mock_now_execution_score"],
            "mock_now_execution_rank": row["mock_now_execution_rank"],
            "actual_provider_strategy_later_score": row["actual_provider_strategy_later_score"],
            "actual_provider_strategy_later_rank": row["actual_provider_strategy_later_rank"],
            "rank_delta_live_minus_mock": row["rank_delta_live_minus_mock"],
            "quadrant_live_acquisition_friction": row["quadrant_live_acquisition_friction"],
            "quadrant_mvp_control_plane_necessity": row["quadrant_mvp_control_plane_necessity"],
            "patient_safety_consequence": row["patient_safety_consequence"],
            "canonical_truth_effect": row["canonical_truth_effect"],
            "patient_visible_continuity": row["patient_visible_continuity"],
            "operator_truth_supportability": row["operator_truth_supportability"],
            "mockability_quality": row["mockability_quality"],
            "live_acquisition_latency": row["live_acquisition_latency"],
            "approval_burden": row["approval_burden"],
            "security_privacy_burden": row["security_privacy_burden"],
            "coupling_risk_if_delayed": row["coupling_risk_if_delayed"],
            "readiness_value_unlocked": row["readiness_value_unlocked"],
            "proof_rigor_demand": row["proof_rigor_demand"],
        }
        rows.append(csv_row)
    return rows


def build_score_csv_rows(payload: dict[str, Any]) -> list[dict[str, Any]]:
    rows = []
    for score_mode in ("mock_now_execution", "actual_provider_strategy_later"):
        score_key = f"{score_mode}_score"
        rank_key = f"{score_mode}_rank"
        for row in payload["integration_families"]:
            rows.append(
                {
                    "score_mode": score_mode,
                    "integration_id": row["integration_id"],
                    "integration_name": row["integration_name"],
                    "recommended_lane": row["recommended_lane"],
                    "baseline_role": row["baseline_role"],
                    "score_total": row[score_key],
                    "rank": row[rank_key],
                    "patient_safety_consequence": row["patient_safety_consequence"],
                    "canonical_truth_effect": row["canonical_truth_effect"],
                    "patient_visible_continuity": row["patient_visible_continuity"],
                    "operator_truth_supportability": row["operator_truth_supportability"],
                    "mockability_quality": row["mockability_quality"],
                    "live_acquisition_latency": row["live_acquisition_latency"],
                    "approval_burden": row["approval_burden"],
                    "security_privacy_burden": row["security_privacy_burden"],
                    "coupling_risk_if_delayed": row["coupling_risk_if_delayed"],
                    "readiness_value_unlocked": row["readiness_value_unlocked"],
                    "proof_rigor_demand": row["proof_rigor_demand"],
                    "live_pressure_from_mock_limit": 6 - row["mockability_quality"],
                    "baseline_role_bonus": BASELINE_ROLE_BONUS[row["baseline_role"]],
                }
            )
    return rows


def build_lane_assignment_payload(payload: dict[str, Any]) -> dict[str, Any]:
    return {
        "lane_assignment_id": "LANE_ASSIGN_021",
        "generated_at": payload["generated_at"],
        "visual_mode": VISUAL_MODE,
        "lane_groups": payload["lane_groups"],
        "integration_lanes": {
            row["integration_id"]: {
                "integration_name": row["integration_name"],
                "recommended_lane": row["recommended_lane"],
                "baseline_role": row["baseline_role"],
                "mock_now_execution_rank": row["mock_now_execution_rank"],
                "actual_provider_strategy_later_rank": row["actual_provider_strategy_later_rank"],
                "later_task_refs": row["later_task_refs"],
            }
            for row in payload["integration_families"]
        },
    }


def write_markdown_docs(payload: dict[str, Any], indexes: dict[str, Any]) -> None:
    rows = payload["integration_families"]
    mock_top = sorted(rows, key=lambda row: row["mock_now_execution_rank"])
    live_top = sorted(rows, key=lambda row: row["actual_provider_strategy_later_rank"])

    matrix_table = render_md_table(
        [
            "Integration",
            "Baseline role",
            "Lane",
            "Mock rank",
            "Live rank",
            "Source dependencies",
            "Later tasks",
        ],
        [
            [
                row["integration_name"],
                row["baseline_role"],
                row["recommended_lane"],
                str(row["mock_now_execution_rank"]),
                str(row["actual_provider_strategy_later_rank"]),
                join_list(row["source_dependency_ids"]),
                join_list(row["later_task_refs"]),
            ]
            for row in sorted(rows, key=lambda item: item["mock_now_execution_rank"])
        ],
    )

    task_group_table = render_md_table(
        ["Task group", "Tasks", "Impacted integrations", "Why now"],
        [
            [
                group["label"],
                join_list(group["task_refs"]),
                join_list(group["impacted_integration_ids"]),
                group["why_now"],
            ]
            for group in payload["task_groups"]
        ],
    )

    MATRIX_MD_PATH.write_text(
        textwrap.dedent(
            f"""\
            # 21 Integration Priority And Execution Matrix

            Current gate posture remains `{payload["summary"]["phase0_entry_verdict"]}` because seq_020 still reports the Phase 0 foundation entry gate as blocked on external readiness. This pack closes the ordering gap by separating mock-now execution from later live-provider acquisition without flattening proof or degraded-mode law.

            ## Summary

            - integration families: {payload["summary"]["integration_family_count"]}
            - source dependencies collapsed: {payload["summary"]["source_dependency_count"]}
            - lane counts: {json.dumps(payload["summary"]["lane_counts"], ensure_ascii=True)}
            - baseline-role counts: {json.dumps(payload["summary"]["baseline_role_counts"], ensure_ascii=True)}
            - divergence rows: {payload["summary"]["divergence_count"]}

            ## Top Mock-Now Execution

            {render_md_table(
                ["Rank", "Integration", "Score", "Lane", "Why now"],
                [
                    [
                        str(row["mock_now_execution_rank"]),
                        row["integration_name"],
                        str(row["mock_now_execution_score"]),
                        row["recommended_lane"],
                        row["why_mock_now"],
                    ]
                    for row in mock_top[:8]
                ],
            )}

            ## Top Actual-Provider Strategy Later

            {render_md_table(
                ["Rank", "Integration", "Score", "Lane", "Why later"],
                [
                    [
                        str(row["actual_provider_strategy_later_rank"]),
                        row["integration_name"],
                        str(row["actual_provider_strategy_later_score"]),
                        row["recommended_lane"],
                        row["why_actual_later"],
                    ]
                    for row in live_top[:8]
                ],
            )}

            ## Full Matrix

            {matrix_table}

            ## Sequencing For Tasks 022-040

            {task_group_table}

            ## Gate Linkage

            - `GATE_P0_FOUNDATION_ENTRY`: {payload["summary"]["phase0_entry_reason"]}
            - `GATE_EXTERNAL_TO_FOUNDATION`: remains the active downstream gate that seq_021-seq_040 must clear before Phase 0 entry can move from `withheld`.
            - `seq_021` consequence: later tasks no longer need to re-argue whether a family is current-baseline, mock-first, actual-later, deferred, or optional.
            """
        )
    )

    mock_sections = []
    for row in mock_top:
        mock_sections.append(
            textwrap.dedent(
                f"""\
                ### {row["mock_now_execution_rank"]}. {row["integration_name"]}

                - baseline role: `{row["baseline_role"]}`
                - recommended lane: `{row["recommended_lane"]}`
                - source dependencies: {join_list(row["source_dependency_ids"])}
                - mock must simulate faithfully: {row["minimum_mock_fidelity"]}
                - placeholder-only areas: {join_list(row["mock_placeholder_only"])}
                - failure injection expectations: {join_list(row["failure_injection_expectations"])}
                - cannot be authoritative: {join_list(row["cannot_be_authoritative"])}
                - good-enough evidence for current build: preserve proof vs ambiguity vs fallback exactly enough that later live adapters can be dropped in without changing control-plane law
                """
            )
        )

    live_sections = []
    for row in live_top:
        live_sections.append(
            textwrap.dedent(
                f"""\
                ### {row["actual_provider_strategy_later_rank"]}. {row["integration_name"]}

                - baseline role: `{row["baseline_role"]}`
                - later-task refs: {join_list(row["later_task_refs"])}
                - why live onboarding waits: {row["why_actual_later"]}
                - ready to attempt live onboarding means:
                  {chr(10).join(f"  - {condition}" for condition in row["minimum_live_readiness_conditions"])}
                """
            )
        )

    STRATEGY_MD_PATH.write_text(
        textwrap.dedent(
            f"""\
            # 21 Mock First Vs Actual Later Strategy

            ## Section A - Mock_now_execution

            Vecells needs high-quality mock services first because many real NHS and partner onboarding routes are unavailable before there is an MVP and a credible evidence pack. The current ranking therefore prioritizes simulator quality, proof fidelity, and readiness unlocked for later phases over live credential possession.

            {'\n'.join(mock_sections)}

            ## Section B - Actual_provider_strategy_later

            Live-provider ranking is intentionally different. It emphasizes contract latency, sponsor or assurance burden, and which long-lead families must start early once there is credible MVP evidence.

            {'\n'.join(live_sections)}
            """
        )
    )

    RATIONALE_MD_PATH.write_text(
        textwrap.dedent(
            f"""\
            # 21 Integration Priority Rationale

            ## Scoring Model

            Two deterministic runs are serialized from the same family pack.

            ### Mock_now_execution weights

            `{json.dumps(RANKING_WEIGHTS["mock_now_execution"], ensure_ascii=True)}`

            ### Actual_provider_strategy_later weights

            `{json.dumps(RANKING_WEIGHTS["actual_provider_strategy_later"], ensure_ascii=True)}`

            ### Baseline role bonus

            `{json.dumps(BASELINE_ROLE_BONUS, ensure_ascii=True)}`

            ## Rules Enforced

            - Deferred Phase 7 NHS App work remains deferred and is not treated as a current-baseline blocker.
            - PDS remains optional and ranks below the core NHS login rail.
            - IM1 pairing is baseline-relevant for later booking reach but explicitly stays out of the Phase 2 identity critical path.
            - Notification rails are ranked below authoritative booking, hub, and pharmacy proof-bearing families.
            - Weak transport or mailbox acceptance is never treated as sufficient business truth.
            - Mock approval requires preservation of proof, ambiguity, and degraded fallback semantics rather than a toy stub.
            - Family-based ranking prevents supplier-specific business logic from leaking into priority order.

            ## Source Precedence

            {'\n'.join(f"- `{source}`" for source in SOURCE_PRECEDENCE)}

            ## Downstream Consequences

            - `seq_022` and `seq_023` now have one family model to score and secure against.
            - `seq_024` to `seq_030` can follow the live-later queue without re-litigating current-baseline necessity.
            - `seq_031` to `seq_035` can target vendor families in a way that does not outrank authoritative booking or pharmacy truth.
            - `seq_036` to `seq_040` now inherit one explicit simulator backlog, checkpoint register, and degraded-default contract.
            """
        )
    )

    divergence_table = render_md_table(
        ["Integration", "Class", "Mock rank", "Live rank", "Reason", "Later tasks"],
        [
            [
                row["integration_name"],
                row["divergence_class"],
                str(row["mock_now_execution_rank"]),
                str(row["actual_provider_strategy_later_rank"]),
                row["mock_now_summary"],
                join_list(row["later_task_refs"]),
            ]
            for row in payload["divergence_register"]
        ],
    )
    DIVERGENCE_MD_PATH.write_text(
        textwrap.dedent(
            f"""\
            # 21 Mock Live Divergence Register

            The divergence register records where current mock urgency and later live-onboarding urgency intentionally differ.

            {divergence_table}

            ## Notes

            - `mock_mandatory_live_can_wait` means the simulator must exist now, but real onboarding can lag until later evidence exists.
            - `live_critical_later_not_current_blocker` means the family is strategically important to start early once MVP proof exists, but it is not the next engineering blocker.
            - `proof_stricter_than_public_onboarding` marks families where Vecells' mock or control-plane proof bar is stricter than vendor docs usually describe.
            - `deferred_or_future` marks NHS App and assistive families that remain inventoried without rebasing current scope.
            """
        )
    )


def build_html(payload: dict[str, Any]) -> str:
    embedded_payload = json.dumps(payload, ensure_ascii=True).replace("</", "<\\/")
    return f"""<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Vecells Integration Constellation Board</title>
    <style>
      :root {{
        color-scheme: light;
        --canvas: #F4F7FB;
        --shell: #FFFFFF;
        --inset: #EEF2F7;
        --text-strong: #0F172A;
        --text-default: #1E293B;
        --text-muted: #475569;
        --border-subtle: #E2E8F0;
        --border-default: #CBD5E1;
        --lane-mock: #335CFF;
        --lane-hybrid: #5665F2;
        --lane-actual: #7C3AED;
        --lane-deferred: #94A3B8;
        --accent-warning: #C98900;
        --accent-blocked: #C24141;
        --accent-success: #0F9D58;
        --shadow: 0 14px 40px rgba(15, 23, 42, 0.07);
        --radius-lg: 24px;
        --radius-md: 18px;
        --radius-sm: 12px;
      }}

      * {{
        box-sizing: border-box;
      }}

      body {{
        margin: 0;
        background: linear-gradient(180deg, #F4F7FB 0%, #EEF3F9 100%);
        color: var(--text-default);
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        line-height: 1.5;
      }}

      a {{
        color: inherit;
      }}

      button,
      input,
      select {{
        font: inherit;
      }}

      button {{
        cursor: pointer;
      }}

      button:focus-visible,
      input:focus-visible,
      select:focus-visible {{
        outline: 2px solid var(--lane-mock);
        outline-offset: 2px;
      }}

      .page {{
        max-width: 1440px;
        margin: 0 auto;
        padding: 24px;
      }}

      .hero {{
        background: var(--shell);
        border: 1px solid var(--border-subtle);
        border-radius: var(--radius-lg);
        box-shadow: var(--shadow);
        padding: 28px;
        display: grid;
        gap: 20px;
      }}

      .hero-top {{
        display: flex;
        justify-content: space-between;
        gap: 24px;
        align-items: flex-start;
      }}

      .hero h1 {{
        margin: 0 0 8px;
        color: var(--text-strong);
        font-size: clamp(1.8rem, 2.5vw, 2.8rem);
        line-height: 1.05;
      }}

      .hero p {{
        margin: 0;
        max-width: 78ch;
        color: var(--text-muted);
      }}

      .constellation {{
        width: 108px;
        height: 72px;
        flex: 0 0 auto;
      }}

      .meta-row,
      .summary-grid,
      .filters,
      .lane-board,
      .panel-grid,
      .risk-list {{
        display: grid;
        gap: 16px;
      }}

      .meta-row {{
        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      }}

      .meta-card,
      .summary-card,
      .panel,
      .swimlane,
      .filter-rail,
      .inspector {{
        background: var(--shell);
        border: 1px solid var(--border-subtle);
        border-radius: var(--radius-md);
      }}

      .meta-card,
      .summary-card {{
        padding: 16px 18px;
      }}

      .summary-grid {{
        grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
      }}

      .summary-card strong,
      .meta-card strong {{
        display: block;
        color: var(--text-strong);
        font-size: 1.3rem;
      }}

      .meta-card span,
      .summary-card span {{
        color: var(--text-muted);
        font-size: 0.92rem;
      }}

      .ribbon {{
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 6px 12px;
        border-radius: 999px;
        background: #E7EDF7;
        color: var(--text-strong);
        font-weight: 600;
        font-size: 0.92rem;
      }}

      .layout {{
        margin-top: 24px;
        display: grid;
        grid-template-columns: 296px minmax(0, 1fr) 360px;
        gap: 24px;
        align-items: start;
      }}

      .filter-rail,
      .inspector,
      .panel {{
        padding: 20px;
      }}

      .filter-rail {{
        position: sticky;
        top: 20px;
        display: grid;
        gap: 16px;
      }}

      .filter-rail h2,
      .panel h2,
      .inspector h2 {{
        margin: 0 0 6px;
        color: var(--text-strong);
        font-size: 1rem;
      }}

      .rail-note,
      .muted {{
        color: var(--text-muted);
        font-size: 0.92rem;
      }}

      .control {{
        display: grid;
        gap: 8px;
      }}

      .control label {{
        color: var(--text-strong);
        font-weight: 600;
        font-size: 0.92rem;
      }}

      .control input,
      .control select {{
        width: 100%;
        min-height: 44px;
        border-radius: 14px;
        border: 1px solid var(--border-default);
        background: var(--inset);
        padding: 0 14px;
        color: var(--text-default);
      }}

      .chip-row {{
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }}

      .chip {{
        min-height: 28px;
        padding: 0 12px;
        border-radius: 999px;
        border: 1px solid var(--border-default);
        background: var(--shell);
        color: var(--text-default);
      }}

      .chip[aria-pressed="true"] {{
        color: var(--text-strong);
        border-color: transparent;
        box-shadow: inset 0 0 0 1px transparent;
      }}

      .chip[data-lane="mock_now"][aria-pressed="true"] {{
        background: rgba(51, 92, 255, 0.12);
        color: var(--lane-mock);
      }}

      .chip[data-lane="hybrid_mock_then_live"][aria-pressed="true"] {{
        background: rgba(86, 101, 242, 0.12);
        color: var(--lane-hybrid);
      }}

      .chip[data-lane="actual_later"][aria-pressed="true"] {{
        background: rgba(124, 58, 237, 0.12);
        color: var(--lane-actual);
      }}

      .chip[data-lane="deferred"][aria-pressed="true"] {{
        background: rgba(148, 163, 184, 0.18);
        color: #526272;
      }}

      .main {{
        display: grid;
        gap: 24px;
      }}

      .panel {{
        box-shadow: var(--shadow);
      }}

      .panel-head {{
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 16px;
        margin-bottom: 16px;
      }}

      .panel-head p {{
        margin: 0;
      }}

      .quadrant {{
        min-height: 420px;
        border-radius: var(--radius-md);
        background: linear-gradient(180deg, #FCFDFE 0%, #F7FAFD 100%);
        border: 1px solid var(--border-subtle);
        position: relative;
        overflow: hidden;
      }}

      .quadrant-grid {{
        position: absolute;
        inset: 16px 16px 32px 32px;
        border-left: 1px solid var(--border-default);
        border-bottom: 1px solid var(--border-default);
        background:
          linear-gradient(to right, rgba(203, 213, 225, 0.45) 1px, transparent 1px) 0 0 / 25% 100%,
          linear-gradient(to top, rgba(203, 213, 225, 0.45) 1px, transparent 1px) 0 0 / 100% 25%;
      }}

      .axis-label {{
        position: absolute;
        color: var(--text-muted);
        font-size: 0.82rem;
        font-weight: 600;
        letter-spacing: 0.02em;
      }}

      .axis-x {{
        bottom: 6px;
        right: 18px;
      }}

      .axis-y {{
        left: 10px;
        top: 16px;
        writing-mode: vertical-rl;
        transform: rotate(180deg);
      }}

      .node-layer {{
        position: absolute;
        inset: 16px 16px 32px 32px;
      }}

      .node {{
        position: absolute;
        transform: translate(-50%, -50%);
        min-width: 116px;
        max-width: 188px;
        border: 1px solid transparent;
        border-radius: 16px;
        padding: 10px 12px;
        text-align: left;
        background: rgba(255, 255, 255, 0.92);
        box-shadow: 0 10px 24px rgba(15, 23, 42, 0.08);
      }}

      .node::before {{
        content: "";
        position: absolute;
        inset: -6px;
        border-radius: 20px;
        z-index: -1;
        opacity: 0.18;
      }}

      .node strong {{
        display: block;
        color: var(--text-strong);
        font-size: 0.88rem;
        line-height: 1.15;
      }}

      .node span {{
        display: block;
        font-size: 0.76rem;
        color: var(--text-muted);
        margin-top: 4px;
      }}

      .node[data-lane="mock_now"] {{
        border-color: rgba(51, 92, 255, 0.25);
      }}

      .node[data-lane="mock_now"]::before {{
        background: var(--lane-mock);
      }}

      .node[data-lane="hybrid_mock_then_live"] {{
        border-color: rgba(86, 101, 242, 0.28);
      }}

      .node[data-lane="hybrid_mock_then_live"]::before {{
        background: var(--lane-hybrid);
      }}

      .node[data-lane="actual_later"] {{
        border-color: rgba(124, 58, 237, 0.28);
      }}

      .node[data-lane="actual_later"]::before {{
        background: var(--lane-actual);
      }}

      .node[data-lane="deferred"] {{
        border-color: rgba(148, 163, 184, 0.38);
      }}

      .node[data-lane="deferred"]::before {{
        background: var(--lane-deferred);
      }}

      .node.is-selected {{
        border-color: var(--text-strong);
      }}

      .table-shell {{
        margin-top: 16px;
        border: 1px solid var(--border-subtle);
        border-radius: var(--radius-md);
        overflow: auto;
        background: var(--shell);
      }}

      table {{
        width: 100%;
        border-collapse: collapse;
      }}

      th,
      td {{
        padding: 12px 14px;
        border-bottom: 1px solid var(--border-subtle);
        text-align: left;
        vertical-align: top;
        font-size: 0.9rem;
      }}

      th {{
        color: var(--text-strong);
        background: #FAFCFE;
        position: sticky;
        top: 0;
        z-index: 1;
      }}

      tbody tr:last-child td {{
        border-bottom: 0;
      }}

      .lane-board {{
        min-height: 360px;
        grid-template-columns: repeat(4, minmax(0, 1fr));
      }}

      .swimlane {{
        padding: 16px;
        background: linear-gradient(180deg, rgba(255,255,255,0.96) 0%, rgba(250,252,254,0.98) 100%);
      }}

      .swimlane h3 {{
        margin: 0 0 6px;
        color: var(--text-strong);
        font-size: 0.98rem;
      }}

      .swimlane .lane-note {{
        margin: 0 0 12px;
        color: var(--text-muted);
        font-size: 0.86rem;
      }}

      .card-stack {{
        display: grid;
        gap: 12px;
      }}

      .integration-card {{
        width: 100%;
        text-align: left;
        border-radius: 16px;
        border: 1px solid var(--border-subtle);
        background: var(--shell);
        padding: 14px;
        min-height: 120px;
      }}

      .integration-card.is-selected {{
        border-color: var(--text-strong);
      }}

      .eyebrow {{
        display: inline-flex;
        align-items: center;
        gap: 8px;
        font-size: 0.75rem;
        color: var(--text-muted);
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }}

      .integration-card strong {{
        display: block;
        margin-top: 8px;
        color: var(--text-strong);
      }}

      .integration-card p {{
        margin: 8px 0 0;
        color: var(--text-muted);
        font-size: 0.86rem;
      }}

      .mini-chip {{
        display: inline-flex;
        align-items: center;
        min-height: 28px;
        padding: 0 10px;
        border-radius: 999px;
        background: var(--inset);
        color: var(--text-default);
        font-size: 0.78rem;
      }}

      .inspector {{
        position: sticky;
        top: 20px;
        display: grid;
        gap: 14px;
        box-shadow: var(--shadow);
      }}

      .inspector .block {{
        display: grid;
        gap: 8px;
        padding-top: 2px;
      }}

      .inspector strong {{
        color: var(--text-strong);
      }}

      .inspector ul {{
        margin: 0;
        padding-left: 18px;
      }}

      .badge-row {{
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }}

      .panel-grid {{
        grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
      }}

      .risk-list {{
        min-height: 220px;
      }}

      .risk-card {{
        padding: 14px;
        border: 1px solid var(--border-subtle);
        border-radius: 14px;
        background: #FCFDFF;
      }}

      .risk-card strong {{
        color: var(--text-strong);
      }}

      .score-dot {{
        display: inline-block;
        width: 10px;
        height: 10px;
        border-radius: 999px;
        margin-right: 8px;
      }}

      .mono {{
        font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
      }}

      .empty {{
        padding: 16px;
        border-radius: 14px;
        background: var(--inset);
        color: var(--text-muted);
      }}

      @media (max-width: 1260px) {{
        .layout {{
          grid-template-columns: 280px minmax(0, 1fr);
        }}

        .inspector {{
          grid-column: 1 / -1;
          position: static;
        }}

        .panel-grid {{
          grid-template-columns: 1fr;
        }}
      }}

      @media (max-width: 980px) {{
        .layout {{
          grid-template-columns: 1fr;
        }}

        .filter-rail {{
          position: static;
        }}

        .lane-board {{
          grid-template-columns: 1fr 1fr;
        }}
      }}

      @media (max-width: 720px) {{
        .page {{
          padding: 16px;
        }}

        .hero {{
          padding: 20px;
        }}

        .hero-top {{
          flex-direction: column;
        }}

        .lane-board {{
          grid-template-columns: 1fr;
        }}

        th,
        td {{
          padding: 10px 12px;
        }}
      }}

      @media (prefers-reduced-motion: reduce) {{
        *,
        *::before,
        *::after {{
          animation-duration: 0.01ms !important;
          animation-iteration-count: 1 !important;
          transition-duration: 0.01ms !important;
          scroll-behavior: auto !important;
        }}
      }}
    </style>
  </head>
  <body>
    <script id="payload" type="application/json">{embedded_payload}</script>
    <div class="page" data-testid="priority-cockpit-shell">
      <header class="hero">
        <div class="hero-top">
          <div>
            <div class="ribbon">Current baseline: Phases 0-6, 8, and 9; Phase 7 deferred</div>
            <h1>Vecells Integration Constellation Board</h1>
            <p>The ranking separates families that must be simulated immediately from those that should be acquired live later, while keeping proof, ambiguity, fallback, and control-plane law intact.</p>
          </div>
          <svg class="constellation" viewBox="0 0 108 72" aria-hidden="true">
            <defs>
              <linearGradient id="constellationGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#335CFF" />
                <stop offset="100%" stop-color="#7C3AED" />
              </linearGradient>
            </defs>
            <path d="M12 52L34 24L54 34L76 14L96 28" fill="none" stroke="url(#constellationGradient)" stroke-width="2" stroke-linecap="round" opacity="0.9" />
            <path d="M34 24L42 56L76 14" fill="none" stroke="#CBD5E1" stroke-width="1.5" stroke-dasharray="4 4" />
            <circle cx="12" cy="52" r="5" fill="#335CFF" />
            <circle cx="34" cy="24" r="5" fill="#5C60F1" />
            <circle cx="54" cy="34" r="4" fill="#7C3AED" />
            <circle cx="76" cy="14" r="5" fill="#335CFF" />
            <circle cx="96" cy="28" r="4" fill="#7C3AED" />
            <circle cx="42" cy="56" r="3" fill="#94A3B8" />
          </svg>
        </div>
        <div class="meta-row">
          <div class="meta-card">
            <strong id="entryVerdict">withheld</strong>
            <span>Phase 0 entry verdict carried from seq_020</span>
          </div>
          <div class="meta-card">
            <strong id="familyCount">0</strong>
            <span>integration families in the ranked model</span>
          </div>
          <div class="meta-card">
            <strong id="dependencyCount">0</strong>
            <span>source dependency rows collapsed from seq_008</span>
          </div>
          <div class="meta-card">
            <strong id="divergenceCount">0</strong>
            <span>mock-vs-live divergences recorded explicitly</span>
          </div>
        </div>
        <div class="summary-grid" id="laneSummary"></div>
      </header>

      <div class="layout">
        <aside class="filter-rail" aria-label="Filters" data-testid="priority-filter-rail">
          <div>
            <h2>Filters</h2>
            <p class="rail-note">Use the rail to compare current mock urgency against later live-provider urgency. The board is read-only by design.</p>
          </div>
          <div class="control">
            <label for="searchInput">Search</label>
            <input id="searchInput" type="search" placeholder="Search integrations, tasks, or risks" />
          </div>
          <div class="control">
            <label for="baselineFilter">Baseline role</label>
            <select id="baselineFilter">
              <option value="all">All baseline roles</option>
            </select>
          </div>
          <div class="control">
            <label for="familyFilter">Family</label>
            <select id="familyFilter">
              <option value="all">All families</option>
            </select>
          </div>
          <div class="control">
            <label>Lanes</label>
            <div class="chip-row" id="laneChips"></div>
          </div>
          <div class="control">
            <label for="sortMode">Board sort</label>
            <select id="sortMode">
              <option value="mock">Mock-now rank</option>
              <option value="live">Live-later rank</option>
            </select>
          </div>
        </aside>

        <main class="main">
          <section class="panel">
            <div class="panel-head">
              <div>
                <h2>Quadrant</h2>
                <p class="muted">X-axis: live acquisition friction. Y-axis: MVP and control-plane necessity.</p>
              </div>
              <div class="mono muted">{VISUAL_MODE}</div>
            </div>
            <div class="quadrant" data-testid="priority-quadrant-chart">
              <div class="quadrant-grid" aria-hidden="true"></div>
              <div class="axis-label axis-x">Live acquisition friction</div>
              <div class="axis-label axis-y">MVP / control-plane necessity</div>
              <div class="node-layer" id="quadrantNodes"></div>
            </div>
            <div class="table-shell" data-testid="priority-quadrant-table">
              <table>
                <thead>
                  <tr>
                    <th>Integration</th>
                    <th>Lane</th>
                    <th>Mock rank</th>
                    <th>Live rank</th>
                    <th>Friction</th>
                    <th>Necessity</th>
                  </tr>
                </thead>
                <tbody id="quadrantTableBody"></tbody>
              </table>
            </div>
          </section>

          <section class="panel">
            <div class="panel-head">
              <div>
                <h2>Swimlanes</h2>
                <p class="muted">The lane board stays read-only so the chosen lane law is reviewable rather than ad hoc editable.</p>
              </div>
            </div>
            <div class="lane-board" data-testid="priority-lane-board">
              <section class="swimlane" data-lane="mock_now">
                <h3>mock_now</h3>
                <p class="lane-note">Families that need simulator-grade execution immediately.</p>
                <div class="card-stack" id="laneMock"></div>
              </section>
              <section class="swimlane" data-lane="hybrid_mock_then_live">
                <h3>hybrid</h3>
                <p class="lane-note">Families that need both a real simulator now and early live-provider prep.</p>
                <div class="card-stack" id="laneHybrid"></div>
              </section>
              <section class="swimlane" data-lane="actual_later">
                <h3>actual_later</h3>
                <p class="lane-note">Families where strategy and gating matter more than immediate simulator depth.</p>
                <div class="card-stack" id="laneActual"></div>
              </section>
              <section class="swimlane" data-lane="deferred">
                <h3>deferred</h3>
                <p class="lane-note">Inventoried, bounded, and deliberately kept out of current-baseline blocking posture.</p>
                <div class="card-stack" id="laneDeferred"></div>
              </section>
            </div>
          </section>

          <section class="panel-grid">
            <section class="panel">
              <div class="panel-head">
                <div>
                  <h2>Divergence register</h2>
                  <p class="muted">Rows where the current mock urgency and later live urgency intentionally diverge.</p>
                </div>
              </div>
              <div class="table-shell" data-testid="priority-divergence-table">
                <table>
                  <thead>
                    <tr>
                      <th>Integration</th>
                      <th>Class</th>
                      <th>Mock rank</th>
                      <th>Live rank</th>
                      <th>Later tasks</th>
                    </tr>
                  </thead>
                  <tbody id="divergenceTableBody"></tbody>
                </table>
              </div>
            </section>

            <section class="panel">
              <div class="panel-head">
                <div>
                  <h2>Later-task linkage</h2>
                  <p class="muted">Tasks 022-040 grouped by the families they now influence.</p>
                </div>
              </div>
              <div class="table-shell" data-testid="priority-task-linkage-table">
                <table>
                  <thead>
                    <tr>
                      <th>Task</th>
                      <th>Group</th>
                      <th>Integrations</th>
                      <th>Lanes</th>
                    </tr>
                  </thead>
                  <tbody id="taskLinkTableBody"></tbody>
                </table>
              </div>
            </section>
          </section>

          <section class="panel">
            <div class="panel-head">
              <div>
                <h2>Top risks</h2>
                <p class="muted">The board surfaces the highest-risk rows linked to the currently visible integration set.</p>
              </div>
            </div>
            <div class="risk-list" data-testid="priority-risk-list" id="riskList"></div>
          </section>
        </main>

        <aside class="inspector" aria-live="polite" data-testid="priority-inspector">
          <div>
            <h2>Inspector</h2>
            <p class="muted">Select a node, table row, or lane card to inspect the rationale, proof bar, and readiness gates.</p>
          </div>
          <div id="inspectorBody" class="empty">Select an integration family.</div>
        </aside>
      </div>
    </div>

    <script>
      const payload = JSON.parse(document.getElementById("payload").textContent);
      const state = {{
        search: "",
        baselineRole: "all",
        family: "all",
        lane: "all",
        sortMode: "mock",
        selectedId: location.hash ? location.hash.slice(1) : null,
      }};

      const laneColors = {{
        mock_now: "#335CFF",
        hybrid_mock_then_live: "#5665F2",
        actual_later: "#7C3AED",
        deferred: "#94A3B8",
      }};

      const laneTargets = {{
        mock_now: document.getElementById("laneMock"),
        hybrid_mock_then_live: document.getElementById("laneHybrid"),
        actual_later: document.getElementById("laneActual"),
        deferred: document.getElementById("laneDeferred"),
      }};

      function selectRow(integrationId, pushHash = true) {{
        state.selectedId = integrationId;
        if (pushHash) {{
          history.replaceState(null, "", "#" + integrationId);
        }}
        render();
      }}

      function buildFilterOptions() {{
        const baselineFilter = document.getElementById("baselineFilter");
        const familyFilter = document.getElementById("familyFilter");
        const laneChips = document.getElementById("laneChips");

        const baselineRoles = [...new Set(payload.integration_families.map((row) => row.baseline_role))];
        baselineRoles.forEach((role) => {{
          const option = document.createElement("option");
          option.value = role;
          option.textContent = role;
          baselineFilter.appendChild(option);
        }});

        const families = [...new Set(payload.integration_families.map((row) => row.integration_family))].sort();
        families.forEach((family) => {{
          const option = document.createElement("option");
          option.value = family;
          option.textContent = family;
          familyFilter.appendChild(option);
        }});

        const lanes = [
          ["all", "All"],
          ["mock_now", "mock_now"],
          ["hybrid_mock_then_live", "hybrid"],
          ["actual_later", "actual_later"],
          ["deferred", "deferred"],
        ];
        lanes.forEach(([value, label]) => {{
          const chip = document.createElement("button");
          chip.type = "button";
          chip.className = "chip";
          chip.dataset.lane = value;
          chip.setAttribute("aria-pressed", value === "all" ? "true" : "false");
          chip.textContent = label;
          chip.addEventListener("click", () => {{
            state.lane = value;
            [...laneChips.children].forEach((child) => child.setAttribute("aria-pressed", child.dataset.lane === value ? "true" : "false"));
            render();
          }});
          laneChips.appendChild(chip);
        }});
      }}

      function filteredRows() {{
        const searchNeedle = state.search.trim().toLowerCase();
        const rows = payload.integration_families.filter((row) => {{
          if (state.baselineRole !== "all" && row.baseline_role !== state.baselineRole) {{
            return false;
          }}
          if (state.family !== "all" && row.integration_family !== state.family) {{
            return false;
          }}
          if (state.lane !== "all" && row.recommended_lane !== state.lane) {{
            return false;
          }}
          if (!searchNeedle) {{
            return true;
          }}
          const haystack = [
            row.integration_id,
            row.integration_name,
            row.integration_family,
            row.baseline_role,
            row.recommended_lane,
            row.why_mock_now,
            row.why_actual_later,
            row.minimum_mock_fidelity,
            ...row.later_task_refs,
            ...row.risk_refs,
            ...row.source_dependency_ids,
          ].join(" ").toLowerCase();
          return haystack.includes(searchNeedle);
        }});
        const key = state.sortMode === "live" ? "actual_provider_strategy_later_rank" : "mock_now_execution_rank";
        rows.sort((a, b) => a[key] - b[key] || a.integration_name.localeCompare(b.integration_name));
        return rows;
      }}

      function ensureSelection(rows) {{
        if (!rows.length) {{
          state.selectedId = null;
          return;
        }}
        if (!state.selectedId || !rows.some((row) => row.integration_id === state.selectedId)) {{
          state.selectedId = rows[0].integration_id;
          history.replaceState(null, "", "#" + state.selectedId);
        }}
      }}

      function renderSummary(rows) {{
        document.getElementById("entryVerdict").textContent = payload.summary.phase0_entry_verdict;
        document.getElementById("familyCount").textContent = String(payload.summary.integration_family_count);
        document.getElementById("dependencyCount").textContent = String(payload.summary.source_dependency_count);
        document.getElementById("divergenceCount").textContent = String(payload.summary.divergence_count);
        const laneSummary = document.getElementById("laneSummary");
        laneSummary.innerHTML = "";
        const counts = rows.reduce((acc, row) => {{
          acc[row.recommended_lane] = (acc[row.recommended_lane] || 0) + 1;
          return acc;
        }}, {{}});
        ["mock_now", "hybrid_mock_then_live", "actual_later", "deferred"].forEach((lane) => {{
          const card = document.createElement("div");
          card.className = "summary-card";
          card.innerHTML = `<strong>${{counts[lane] || 0}}</strong><span>${{lane}}</span>`;
          laneSummary.appendChild(card);
        }});
      }}

      function renderQuadrant(rows) {{
        const layer = document.getElementById("quadrantNodes");
        const tableBody = document.getElementById("quadrantTableBody");
        layer.innerHTML = "";
        tableBody.innerHTML = "";
        rows.forEach((row) => {{
          const node = document.createElement("button");
          node.type = "button";
          node.className = "node" + (row.integration_id === state.selectedId ? " is-selected" : "");
          node.dataset.integrationId = row.integration_id;
          node.dataset.lane = row.recommended_lane;
          node.style.left = `${{Math.max(6, Math.min(94, row.quadrant_live_acquisition_friction))}}%`;
          node.style.top = `${{Math.max(8, Math.min(92, 100 - row.quadrant_mvp_control_plane_necessity))}}%`;
          node.innerHTML = `<strong>${{row.integration_name}}</strong><span>#${{row.mock_now_execution_rank}} mock · #${{row.actual_provider_strategy_later_rank}} live</span>`;
          node.addEventListener("click", () => selectRow(row.integration_id));
          layer.appendChild(node);

          const tr = document.createElement("tr");
          tr.dataset.integrationId = row.integration_id;
          tr.innerHTML = `
            <td><button type="button" class="mono" style="all:unset; cursor:pointer; color:inherit;">${{row.integration_name}}</button></td>
            <td>${{row.recommended_lane}}</td>
            <td>${{row.mock_now_execution_rank}}</td>
            <td>${{row.actual_provider_strategy_later_rank}}</td>
            <td>${{row.quadrant_live_acquisition_friction}}</td>
            <td>${{row.quadrant_mvp_control_plane_necessity}}</td>
          `;
          tr.querySelector("button").addEventListener("click", () => selectRow(row.integration_id));
          tableBody.appendChild(tr);
        }});
      }}

      function renderLaneBoard(rows) {{
        Object.values(laneTargets).forEach((target) => {{
          target.innerHTML = "";
        }});
        rows.forEach((row) => {{
          const card = document.createElement("button");
          card.type = "button";
          card.className = "integration-card" + (row.integration_id === state.selectedId ? " is-selected" : "");
          card.dataset.integrationId = row.integration_id;
          card.datasetLane = row.recommended_lane;
          card.innerHTML = `
            <div class="eyebrow">
              <span class="score-dot" style="background:${{laneColors[row.recommended_lane]}}"></span>
              <span>${{row.baseline_role}}</span>
            </div>
            <strong>${{row.integration_name}}</strong>
            <p>#${{row.mock_now_execution_rank}} mock · #${{row.actual_provider_strategy_later_rank}} live</p>
            <div class="badge-row" style="margin-top:10px;">
              <span class="mini-chip">${{row.integration_family}}</span>
              <span class="mini-chip">${{row.current_mock_feasibility}} mockability</span>
            </div>
          `;
          card.addEventListener("click", () => selectRow(row.integration_id));
          laneTargets[row.recommended_lane].appendChild(card);
        }});
        Object.values(laneTargets).forEach((target) => {{
          if (!target.children.length) {{
            target.innerHTML = `<div class="empty">No integrations match the current filter state.</div>`;
          }}
        }});
      }}

      function renderInspector(rows) {{
        const inspector = document.getElementById("inspectorBody");
        const selected = rows.find((row) => row.integration_id === state.selectedId);
        if (!selected) {{
          inspector.className = "empty";
          inspector.textContent = "No integration matches the current filters.";
          return;
        }}
        inspector.className = "";
        inspector.innerHTML = `
          <div class="block">
            <strong>${{selected.integration_name}}</strong>
            <div class="badge-row">
              <span class="mini-chip mono">${{selected.integration_id}}</span>
              <span class="mini-chip">${{selected.baseline_role}}</span>
              <span class="mini-chip">${{selected.recommended_lane}}</span>
            </div>
            <div class="muted">Source dependencies: ${{
              selected.source_dependency_ids.map((id) => `<span class="mono">${{id}}</span>`).join(", ")
            }}</div>
          </div>
          <div class="block">
            <h3>Rationale</h3>
            <div class="muted">${{selected.why_mock_now}}</div>
            <div class="muted">${{selected.why_actual_later}}</div>
          </div>
          <div class="block">
            <h3>Proof / ambiguity summary</h3>
            <div class="muted">${{selected.minimum_mock_fidelity}}</div>
          </div>
          <div class="block">
            <h3>Actual readiness gates</h3>
            <ul>${{selected.minimum_live_readiness_conditions.map((item) => `<li>${{item}}</li>`).join("")}}</ul>
          </div>
          <div class="block">
            <h3>Cannot be authoritative</h3>
            <ul>${{selected.cannot_be_authoritative.map((item) => `<li>${{item}}</li>`).join("")}}</ul>
          </div>
          <div class="block">
            <h3>Top risks and tasks</h3>
            <div class="muted">Risks: ${{
              selected.risk_refs.length ? selected.risk_refs.map((risk) => `<span class="mono">${{risk}}</span>`).join(", ") : "none"
            }}</div>
            <div class="muted">Tasks: ${{
              selected.later_task_refs.map((task) => `<span class="mono">${{task}}</span>`).join(", ")
            }}</div>
          </div>
        `;
      }}

      function renderDivergence(rows) {{
        const allowedIds = new Set(rows.map((row) => row.integration_id));
        const body = document.getElementById("divergenceTableBody");
        body.innerHTML = "";
        const filtered = payload.divergence_register.filter((row) => allowedIds.has(row.integration_id));
        filtered.forEach((row) => {{
          const tr = document.createElement("tr");
          tr.innerHTML = `
            <td><button type="button" style="all:unset; cursor:pointer; color:inherit;">${{row.integration_name}}</button></td>
            <td>${{row.divergence_class}}</td>
            <td>${{row.mock_now_execution_rank}}</td>
            <td>${{row.actual_provider_strategy_later_rank}}</td>
            <td>${{row.later_task_refs.map((task) => `<span class="mono">${{task}}</span>`).join(", ")}}</td>
          `;
          tr.querySelector("button").addEventListener("click", () => selectRow(row.integration_id));
          body.appendChild(tr);
        }});
        if (!filtered.length) {{
          body.innerHTML = `<tr><td colspan="5" class="muted">No divergence rows match the current filters.</td></tr>`;
        }}
      }}

      function renderTaskLinks(rows) {{
        const allowedIds = new Set(rows.map((row) => row.integration_id));
        const body = document.getElementById("taskLinkTableBody");
        body.innerHTML = "";
        const filtered = payload.task_links.filter((row) => row.integration_ids.some((id) => allowedIds.has(id)));
        filtered.forEach((row) => {{
          const tr = document.createElement("tr");
          tr.innerHTML = `
            <td><span class="mono">${{row.task_ref}}</span><br /><span class="muted">${{row.task_title}}</span></td>
            <td>${{row.task_group}}</td>
            <td>${{row.integration_ids.map((id) => `<span class="mono">${{id}}</span>`).join(", ")}}</td>
            <td>${{row.lanes.join(", ")}}</td>
          `;
          body.appendChild(tr);
        }});
        if (!filtered.length) {{
          body.innerHTML = `<tr><td colspan="4" class="muted">No later tasks match the current filters.</td></tr>`;
        }}
      }}

      function renderRisks(rows) {{
        const allowedIds = new Set(rows.map((row) => row.integration_id));
        const target = document.getElementById("riskList");
        target.innerHTML = "";
        const filtered = payload.risk_summary
          .filter((row) => row.integration_ids.some((id) => allowedIds.has(id)))
          .slice(0, 8);
        if (!filtered.length) {{
          target.innerHTML = `<div class="empty">No risk rows match the current filters.</div>`;
          return;
        }}
        filtered.forEach((risk) => {{
          const card = document.createElement("div");
          card.className = "risk-card";
          card.innerHTML = `
            <strong><span class="mono">${{risk.risk_id}}</span> · ${{risk.risk_title}}</strong>
            <div class="muted">score ${{risk.risk_score}} · gate impact ${{risk.gate_impact}} · owner ${{risk.owner_role}}</div>
            <p class="muted">${{risk.problem_statement}}</p>
            <div class="muted">Integrations: ${{
              risk.integration_ids.map((id) => `<span class="mono">${{id}}</span>`).join(", ")
            }}</div>
          `;
          target.appendChild(card);
        }});
      }}

      function render() {{
        const rows = filteredRows();
        ensureSelection(rows);
        renderSummary(rows);
        renderQuadrant(rows);
        renderLaneBoard(rows);
        renderInspector(rows);
        renderDivergence(rows);
        renderTaskLinks(rows);
        renderRisks(rows);
      }}

      buildFilterOptions();
      document.getElementById("searchInput").addEventListener("input", (event) => {{
        state.search = event.target.value;
        render();
      }});
      document.getElementById("baselineFilter").addEventListener("change", (event) => {{
        state.baselineRole = event.target.value;
        render();
      }});
      document.getElementById("familyFilter").addEventListener("change", (event) => {{
        state.family = event.target.value;
        render();
      }});
      document.getElementById("sortMode").addEventListener("change", (event) => {{
        state.sortMode = event.target.value;
        render();
      }});
      window.addEventListener("hashchange", () => {{
        state.selectedId = location.hash ? location.hash.slice(1) : null;
        render();
      }});
      render();
    </script>
  </body>
</html>
"""


def write_outputs(payload: dict[str, Any], indexes: dict[str, Any]) -> None:
    DOCS_DIR.mkdir(parents=True, exist_ok=True)
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    MATRIX_JSON_PATH.write_text(json.dumps(payload, indent=2, ensure_ascii=True) + "\n")
    LANE_JSON_PATH.write_text(json.dumps(build_lane_assignment_payload(payload), indent=2, ensure_ascii=True) + "\n")
    write_csv_rows(MATRIX_CSV_PATH, build_matrix_csv_rows(payload))
    write_csv_rows(SCORES_CSV_PATH, build_score_csv_rows(payload))
    write_csv_rows(DIVERGENCE_CSV_PATH, payload["divergence_register"])
    write_markdown_docs(payload, indexes)
    COCKPIT_HTML_PATH.write_text(build_html(payload))


def main() -> None:
    prereqs = ensure_prerequisites()
    indexes = build_indexes(prereqs)
    payload = build_payload(prereqs, indexes)
    write_outputs(payload, indexes)


if __name__ == "__main__":
    main()
