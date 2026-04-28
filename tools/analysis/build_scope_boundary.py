#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
from collections import Counter
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = ROOT / "data" / "analysis"
DOCS_DIR = ROOT / "docs" / "architecture"

JSON_PATH = DATA_DIR / "product_scope_matrix.json"
CSV_PATH = DATA_DIR / "product_scope_matrix.csv"
SCOPE_DOC_PATH = DOCS_DIR / "03_product_scope_boundary.md"
NON_GOALS_DOC_PATH = DOCS_DIR / "03_non_goals_and_explicit_exclusions.md"
BASELINE_DOC_PATH = DOCS_DIR / "03_current_delivery_baseline.md"
DEFERRED_DOC_PATH = DOCS_DIR / "03_deferred_and_conditional_scope.md"
DECISION_LOG_DOC_PATH = DOCS_DIR / "03_scope_decision_log.md"

ALLOWED_CLASSIFICATIONS = [
    "core_now",
    "core_enabling_control_plane",
    "deferred_channel_expansion",
    "future_optional",
    "explicitly_out_of_scope",
    "prohibited_architecture_pattern",
]

ALLOWED_DEPENDENCY_STATUSES = [
    "required_baseline",
    "optional",
    "feature_flagged",
    "deferred",
    "replaceable_by_simulator",
]

REQUIRED_SCOPE_CATEGORIES = [
    "intake and safety",
    "identity and access",
    "patient portal/account/communications",
    "clinical workspace",
    "support workspace",
    "operations console",
    "governance/admin shell",
    "local booking",
    "network/hub coordination",
    "pharmacy referral loop",
    "assistive layer",
    "assurance ledger",
    "runtime/release control plane",
    "external integrations/adapters",
    "analytics and continuity evidence",
]

PHASE_ORDER = [
    "cross_phase",
    "phase_0",
    "phase_1",
    "phase_2",
    "phase_3",
    "phase_4",
    "phase_5",
    "phase_6",
    "phase_7",
    "phase_8",
    "phase_9",
]

PHASE_LABELS_FALLBACK = {
    "cross_phase": "Cross-phase",
    "phase_0": "The Foundation Protocol",
    "phase_1": "The Red Flag Gate",
    "phase_2": "Identity and Echoes",
    "phase_3": "The Human Checkpoint",
    "phase_4": "The Booking Engine",
    "phase_5": "The Network Horizon",
    "phase_6": "The Pharmacy Loop",
    "phase_7": "Inside the NHS App",
    "phase_8": "The Assistive Layer",
    "phase_9": "The Assurance Ledger",
}

CLASSIFICATION_ORDER = {
    name: index for index, name in enumerate(ALLOWED_CLASSIFICATIONS)
}

PRODUCT_MISSION = (
    "Vecells is a demand orchestration system for primary care. It accepts web, "
    "NHS App jump-off, and phone-origin demand into one governed request pipeline, "
    "routes each lineage through the correct endpoint, and keeps patient, staff, "
    "operations, governance, and assurance surfaces on one control plane instead of "
    "reducing the product to booking, ad hoc messaging, or post-hoc reporting."
)

CURRENT_BASELINE_STATEMENT = (
    "The current delivery baseline is Phases 0 to 6, Phase 8, and Phase 9, with "
    "Phase 7 retained as a deferred NHS App embedded-channel expansion."
)

BASELINE_PHASES = [
    "phase_0",
    "phase_1",
    "phase_2",
    "phase_3",
    "phase_4",
    "phase_5",
    "phase_6",
    "phase_8",
    "phase_9",
]

DEFERRED_PHASES = ["phase_7"]


def dep(name: str, status: str, reason: str) -> dict[str, str]:
    return {"name": name, "status": status, "reason": reason}


def row(
    capability_id: str,
    scope_category: str,
    capability_name: str,
    classification: str,
    phases: list[str],
    visibility: list[str],
    baseline_required: bool,
    why_it_exists: str,
    scope_statement: str,
    acceptance_implication: str,
    dependencies: list[dict[str, str]],
    source_refs: list[str],
    related_decision_ids: list[str],
    notes: str = "",
) -> dict[str, Any]:
    return {
        "capability_id": capability_id,
        "scope_category": scope_category,
        "capability_name": capability_name,
        "classification": classification,
        "phases": phases,
        "visibility": visibility,
        "baseline_required": baseline_required,
        "why_it_exists": why_it_exists,
        "scope_statement": scope_statement,
        "acceptance_implication": acceptance_implication,
        "dependencies": dependencies,
        "source_refs": source_refs,
        "related_decision_ids": related_decision_ids,
        "notes": notes,
    }


def decision(
    decision_id: str,
    source_statement: str,
    normalized_interpretation: str,
    reason: str,
    source_refs: list[str],
    affected_capability_ids: list[str],
    upstream_refs: list[str] | None = None,
    assumption: str = "",
    risk: str = "",
) -> dict[str, Any]:
    return {
        "decision_id": decision_id,
        "source_statement": source_statement,
        "normalized_interpretation": normalized_interpretation,
        "reason": reason,
        "source_refs": source_refs,
        "upstream_refs": upstream_refs or [],
        "assumption": assumption,
        "risk": risk,
        "affected_capability_ids": affected_capability_ids,
    }


ROWS = [
    row(
        "cap_unified_intake_and_safety_pipeline",
        "intake and safety",
        "Unified intake convergence and safety-gated request promotion",
        "core_now",
        ["phase_0", "phase_1", "phase_2", "phase_3"],
        ["patient", "staff"],
        True,
        "The product mission depends on one governed intake lineage rather than channel-specific request creation.",
        "Web, NHS App jump-off, phone, secure-link continuation, and support-assisted capture must converge into one SubmissionEnvelope and request-promotion boundary before routine workflow continues.",
        "Reject any design that creates a second request pipeline, a phone-only request store, or a channel-specific safety model.",
        [
            dep("NHS login rail", "required_baseline", "Patient-authenticated entry depends on the shared NHS login rail."),
            dep("Telephony capture and IVR adapter", "required_baseline", "Phone-origin demand must join the same intake lineage."),
            dep("SMS continuation links", "feature_flagged", "Continuation improves recovery and parity but can be cohort-gated."),
        ],
        [
            "blueprint-init.md#1. Product definition",
            "blueprint-init.md#2. Core product surfaces",
            "blueprint-init.md#3. The canonical request model",
            "phase-0-the-foundation-protocol.md#4. Canonical ingest and request promotion",
        ],
        ["DECISION_SCOPE_002", "DECISION_SCOPE_003"],
    ),
    row(
        "cap_fallback_review_and_artifact_quarantine",
        "intake and safety",
        "Fallback review, degraded receipt, and artifact quarantine",
        "core_now",
        ["phase_0", "phase_1", "phase_9"],
        ["patient", "staff", "ops"],
        True,
        "Accepted progress must never disappear when ingest, safety, or evidence processing degrades.",
        "Unsafe, unreadable, malicious, or unsupported evidence must remain quarantined and route through FallbackReviewCase with same-lineage degraded recovery.",
        "Reject any implementation that auto-discards bad evidence, drops accepted submissions silently, or swaps same-shell recovery for a generic error page.",
        [
            dep("Binary artifact store", "required_baseline", "Quarantined artifacts and replay-safe evidence need object storage."),
            dep("Manual review queue", "required_baseline", "Fallback work must land in a governed human queue."),
        ],
        [
            "phase-0-the-foundation-protocol.md#3. Non-negotiable invariants",
            "phase-0-the-foundation-protocol.md#4.3A Artifact quarantine and fallback review",
            "vecells-complete-end-to-end-flow.md#Baseline invariants",
            "forensic-audit-findings.md#Finding 12 - No safe fallback when ingest or safety failed",
        ],
        ["DECISION_SCOPE_011"],
    ),
    row(
        "cap_identity_binding_and_session_authority",
        "identity and access",
        "Identity binding, patient claim, and session authority",
        "core_now",
        ["phase_0", "phase_2"],
        ["patient", "staff", "governance"],
        True,
        "The canonical request model allows anonymous, partial, and matched-but-unclaimed states, so identity cannot be simplified away.",
        "Patient binding, claim, and writable resume must derive from governed IdentityBinding plus session-establishment decisions instead of ambient login success.",
        "Reject any proposal that overwrites patientRef directly, reuses a stale session for claim, or treats authenticated context as proof of writable ownership.",
        [
            dep("NHS login rail", "required_baseline", "Authenticated patient entry uses NHS login."),
            dep("Secure-link continuation flow", "required_baseline", "Grant-scoped recovery and resume are baseline patient actions."),
            dep("Telephony identity capture", "required_baseline", "Phone-origin demand must support governed identity evidence."),
        ],
        [
            "blueprint-init.md#10. Identity, consent, security, and policy",
            "phase-0-the-foundation-protocol.md#3. Non-negotiable invariants",
            "patient-account-and-communications-blueprint.md#Patient audience coverage contract",
            "forensic-audit-findings.md#Finding 50 - The concrete Request schema dropped identity-binding references and treated patientRef as unconditional",
        ],
        ["DECISION_SCOPE_007", "DECISION_SCOPE_013"],
    ),
    row(
        "cap_authorization_consent_and_break_glass_governance",
        "identity and access",
        "Authorization, consent, purpose-of-use, and break-glass governance",
        "core_enabling_control_plane",
        ["phase_0", "phase_2", "phase_9"],
        ["staff", "governance"],
        True,
        "Vecells must separate identity proof, clinical authorization, consent scope, and exceptional access to keep cross-organisation work lawful and replayable.",
        "RBAC, ABAC, consent scope grants, purpose-of-use tokens, and break-glass review remain baseline control-plane scope for patient, staff, support, hub, and governance surfaces.",
        "Reject any architecture that hides authorization in session state, infers consent from prior contact, or omits reason-coded break-glass review from live operations.",
        [
            dep("Organisation-controlled SSO", "required_baseline", "Staff authentication is a baseline governance dependency."),
            dep("Compiled policy bundles", "required_baseline", "Scope, visibility, and exceptional access are policy-driven."),
            dep("Immutable audit ledger", "required_baseline", "Break-glass and consent decisions must be queryable and reviewable."),
        ],
        [
            "blueprint-init.md#10. Identity, consent, security, and policy",
            "phase-0-the-foundation-protocol.md#3. Non-negotiable invariants",
            "governance-admin-console-frontend-blueprint.md#Governance operating law",
        ],
        ["DECISION_SCOPE_006", "DECISION_SCOPE_007"],
    ),
    row(
        "cap_patient_portal_account_and_communications_shell",
        "patient portal/account/communications",
        "Signed-in patient shell for status, communications, and managed actions",
        "core_now",
        ["phase_0", "phase_1", "phase_2", "phase_4"],
        ["patient"],
        True,
        "The patient surface is one continuing access experience rather than a set of detached flows.",
        "Patient portal, request detail, communications, and managed actions must stay inside one governed patient shell with route intent, settlement, visibility, and continuity controls.",
        "Reject designs that split status, messaging, booking manage, or records into detached mini-products with separate truth semantics or shell continuity.",
        [
            dep("Messaging adapters", "required_baseline", "Patient communications are baseline rather than adjunct."),
            dep("Secure-link continuation", "required_baseline", "Recovery and grant-scoped actions are part of the same shell model."),
            dep("Release and runtime publication tuple", "required_baseline", "Writable patient posture depends on published route contracts."),
        ],
        [
            "blueprint-init.md#2. Core product surfaces",
            "patient-portal-experience-architecture-blueprint.md#Purpose",
            "patient-account-and-communications-blueprint.md#Purpose",
            "phase-0-the-foundation-protocol.md#6.6 Scoped mutation gate",
        ],
        ["DECISION_SCOPE_003", "DECISION_SCOPE_006"],
    ),
    row(
        "cap_patient_records_manage_and_same_shell_continuity",
        "patient portal/account/communications",
        "Patient records, booking manage, and continuity-bound recovery",
        "core_now",
        ["phase_0", "phase_4", "phase_9"],
        ["patient"],
        True,
        "Record follow-up, more-info reply, thread settlement, and booking manage remain part of the same patient lineage promise.",
        "Patient records, appointment manage, record-origin follow-up, and recovery flows must stay same-shell, parity-honest, and evidence-backed before richer actions or bytes appear.",
        "Reject any feature that makes booking manage or record follow-up appear calmer than the current continuity evidence, artifact parity, or release posture allows.",
        [
            dep("Artifact presentation and handoff controls", "required_baseline", "Patient-visible documents and artifacts are summary-first and return-safe."),
            dep("Continuity evidence producers", "required_baseline", "Writable or calm posture depends on continuity proof."),
        ],
        [
            "patient-account-and-communications-blueprint.md#PatientExperienceContinuityEvidenceProjection",
            "patient-account-and-communications-blueprint.md#PatientDegradedModeProjection",
            "phase-0-the-foundation-protocol.md#3. Non-negotiable invariants",
            "phase-cards.md#Summary-layer corrections required to keep the programme cards aligned with the continuity-evidence control loop",
        ],
        ["DECISION_SCOPE_006", "DECISION_SCOPE_010"],
    ),
    row(
        "cap_nhs_app_embedded_channel",
        "patient portal/account/communications",
        "Trusted NHS App embedded web channel",
        "deferred_channel_expansion",
        ["phase_7"],
        ["patient"],
        False,
        "The embedded channel is inventoried and designed, but it is not part of the current completion line.",
        "The NHS App embedded experience remains a deferred channel expansion that reuses the web product under manifest-pinned, bridge-negotiated, channel-freeze-aware controls.",
        "Baseline completion does not require embedded NHS App rollout, but any future embedded launch must adopt the phase-7 control plane instead of inventing a parallel patient product.",
        [
            dep("NHS App route manifest", "deferred", "Embedded entry must pin approved manifest routes."),
            dep("Trusted bridge capability negotiation", "deferred", "Embedded navigation and document behavior require bridge floors."),
            dep("Environment-specific release guardrails", "deferred", "Embedded cohorts need their own freeze and downgrade posture."),
        ],
        [
            "blueprint-init.md#14. Programme Baseline With NHS App Deferred",
            "phase-cards.md#Programme Baseline Update (NHS App Deferred)",
            "phase-cards.md#Card 8: Phase 7 - Inside the NHS App (Deferred channel expansion)",
            "forensic-audit-findings.md#Finding 90 - The audit still omitted the hardened NHS App embedded-channel control plane",
        ],
        ["DECISION_SCOPE_001"],
        notes="Deferred baseline scope. Inventory now, deliver later.",
    ),
    row(
        "cap_clinical_workspace_review_and_endpoint_selection",
        "clinical workspace",
        "Clinical Workspace review, safety preemption, and endpoint selection",
        "core_now",
        ["phase_0", "phase_3"],
        ["staff"],
        True,
        "The human checkpoint is a core operating model, not an optional review screen.",
        "Clinicians and designated reviewers must work inside one lease-fenced workspace that preserves review context, supports bounded assistive sidecars, and routes endpoint decisions through governed human approval.",
        "Reject any flow that skips the human checkpoint for irreversible actions, loses review context on reopen, or treats downstream seeds as direct request closure.",
        [
            dep("Organisation SSO", "required_baseline", "Staff access is baseline."),
            dep("Workspace lease and settlement contracts", "required_baseline", "Calm completion depends on fenced ownership and authoritative settlement."),
        ],
        [
            "blueprint-init.md#5. Clinical workspace and operational workflow",
            "phase-cards.md#Card 4: Phase 3 - The Human Checkpoint",
            "staff-operations-and-support-blueprint.md#Clinical Workspace specialization",
            "platform-frontend-blueprint.md#Clinical Workspace specialization",
        ],
        ["DECISION_SCOPE_008", "DECISION_SCOPE_009"],
    ),
    row(
        "cap_support_workspace_replay_and_repair",
        "support workspace",
        "Ticket-centric support replay, resend, repair, and bounded mutation",
        "core_now",
        ["phase_0", "phase_3", "phase_9"],
        ["staff", "ops"],
        True,
        "Support is a first-class operational surface, not a hidden back-office fallback.",
        "Support must operate through a ticket-centric workspace with bounded replay, restore settlement, reason-coded repair, and minimum-necessary visibility instead of direct unrestricted production access.",
        "Reject any support design that bypasses acting-context fences, reopens live mutation after replay without restore settlement, or treats support as a detached CRM portal.",
        [
            dep("Messaging adapters", "required_baseline", "Support repair and resend depend on governed comms rails."),
            dep("Telephony adapters", "required_baseline", "Support continuity and callback recovery depend on telephony evidence."),
            dep("Support continuity evidence", "required_baseline", "Replay restore must be provable before actions re-arm."),
        ],
        [
            "staff-operations-and-support-blueprint.md#Purpose",
            "staff-operations-and-support-blueprint.md#Support shell anatomy, layout, and signal contract",
            "staff-operations-and-support-blueprint.md#Support route contract",
            "forensic-audit-findings.md#Finding 26 - Support actions were not bounded by acting context",
        ],
        ["DECISION_SCOPE_006", "DECISION_SCOPE_011"],
    ),
    row(
        "cap_operations_console_control_room",
        "operations console",
        "Operations control-room boards, drill-down, and intervention posture",
        "core_enabling_control_plane",
        ["phase_0", "phase_9"],
        ["ops"],
        True,
        "Macro service health, guardrails, and recovery posture are part of the product operating surface.",
        "Operations Console must remain a live control-room shell for queue health, dependency posture, continuity diagnosis, resilience readiness, and bounded interventions rather than a passive BI dashboard.",
        "Reject any implementation that pushes live operations diagnosis out of scope, flattens trust and recovery posture into green dashboards, or breaks same-shell drill-down continuity.",
        [
            dep("Operational analytics projections", "required_baseline", "Boards depend on event-driven read models."),
            dep("Assurance slice trust evaluations", "required_baseline", "Operational cells cannot overstate degraded or quarantined truth."),
            dep("Recovery evidence packs", "required_baseline", "Resilience readiness is baseline control-plane scope."),
        ],
        [
            "blueprint-init.md#5. Clinical workspace and operational workflow",
            "staff-operations-and-support-blueprint.md#Operations console model",
            "operations-console-frontend-blueprint.md#Purpose",
            "forensic-audit-findings.md#Finding 96 - The audit still under-specified operations-console trust and guardrail posture",
        ],
        ["DECISION_SCOPE_006", "DECISION_SCOPE_011"],
    ),
    row(
        "cap_governance_and_admin_shell",
        "governance/admin shell",
        "Governance, policy, release, access, and compliance shell",
        "core_enabling_control_plane",
        ["phase_0", "phase_9"],
        ["governance"],
        True,
        "Governed mutation, release oversight, and compliance evidence need their own high-control shell.",
        "Governance and admin routes must remain a distinct shell for policy, access, communications governance, release gating, and compliance evidence rather than an operations subpanel or raw CRUD backend.",
        "Reject any architecture that collapses governance approval into frontline operations UI or bypasses the same runtime tuples enforced by production.",
        [
            dep("Compiled policy bundles", "required_baseline", "Governance work is defined through policy compilation."),
            dep("Release watch tuples and guardrail snapshots", "required_baseline", "Approval and watch posture must match runtime truth."),
            dep("Assurance evidence bundles", "required_baseline", "Compliance review requires explicit evidence packaging."),
        ],
        [
            "governance-admin-console-frontend-blueprint.md#Purpose",
            "governance-admin-console-frontend-blueprint.md#Governance operating law",
            "staff-operations-and-support-blueprint.md#Operations route contract",
        ],
        ["DECISION_SCOPE_006", "DECISION_SCOPE_011"],
    ),
    row(
        "cap_local_booking_orchestrator",
        "local booking",
        "Local Booking Orchestrator behind supplier capability and adapter contracts",
        "core_now",
        ["phase_0", "phase_4"],
        ["patient", "staff"],
        True,
        "Booking is only one endpoint, but it remains a core baseline outcome when clinically or operationally required.",
        "Local booking must run through one BookingProviderAdapterBinding and capability matrix so supplier search, hold, commit, and manage differences stay behind adapters rather than inside core workflow logic.",
        "Reject any design that hard-codes supplier semantics into request workflow, patient copy, or queue logic.",
        [
            dep("IM1 and local GP integration rails", "required_baseline", "Local automation is baseline booking scope."),
            dep("Supplier capability matrix", "required_baseline", "Capability and manage support vary by supplier and pairing."),
            dep("Provider simulators", "replaceable_by_simulator", "Development and contract validation may rely on simulators before live pairing."),
        ],
        [
            "blueprint-init.md#6. Booking and access continuity",
            "phase-cards.md#Card 5: Phase 4 - The Booking Engine",
            "phase-0-the-foundation-protocol.md#25E. BookingProviderAdapterBinding",
            "platform-runtime-and-release-blueprint.md#AdapterContractProfile",
        ],
        ["DECISION_SCOPE_004", "DECISION_SCOPE_012"],
    ),
    row(
        "cap_truthful_booking_manage_waitlist_and_confirmation",
        "local booking",
        "Truthful booking confirmation, waitlist, and appointment manage posture",
        "core_now",
        ["phase_0", "phase_4", "phase_9"],
        ["patient", "staff", "ops"],
        True,
        "Reservation truth, confirmation gates, and manage continuity are required to prevent false reassurance.",
        "Offer, hold, waitlist, confirmation, and manage flows must derive from ReservationAuthority, CapacityReservation, ExternalConfirmationGate, BookingContinuityEvidenceProjection, and authoritative settlement rather than countdowns or local success toasts.",
        "Reject any experience that implies exclusivity without a held reservation or claims booked calmness while supplier confirmation remains ambiguous, disputed, stale, or expired.",
        [
            dep("Supplier confirmation evidence", "required_baseline", "Booked truth requires authoritative confirmation or read-after-write proof."),
            dep("Messaging reminders and notifications", "optional", "Notifications improve downstream continuity but do not replace truth semantics."),
            dep("Waitlist continuation policies", "required_baseline", "Local waitlist is a governed continuation, not a best-effort side lane."),
        ],
        [
            "blueprint-init.md#6. Booking and access continuity",
            "phase-4-the-booking-engine.md#Booking surface-control priorities",
            "phase-0-the-foundation-protocol.md#3. Non-negotiable invariants",
            "forensic-audit-findings.md#Finding 30 - Offer and hold semantics could imply false exclusivity",
            "forensic-audit-findings.md#Finding 72 - The booking commit path did not bind ambiguous supplier truth to canonical confirmation gates strongly enough",
        ],
        ["DECISION_SCOPE_004", "DECISION_SCOPE_010"],
    ),
    row(
        "cap_network_coordination_desk",
        "network/hub coordination",
        "Network coordination desk for cross-site, hub, and callback fallback booking work",
        "core_now",
        ["phase_0", "phase_5"],
        ["patient", "staff"],
        True,
        "Enhanced Access and cross-site workflows need a coordination desk rather than pretending every booking is local and synchronous.",
        "Hub coordination must remain its own case-managed workflow for ranked offers, patient choice, practice visibility debt, callback fallback, and cross-site confirmation ambiguity.",
        "Reject any design that compresses hub work into a generic local booking confirmation step or lets stale hub evidence imply practice-ready calmness.",
        [
            dep("Hub or cross-site scheduling adapters", "required_baseline", "Network coordination requires external scheduling visibility."),
            dep("Practice visibility and acknowledgement channels", "required_baseline", "Hub cases stay open until origin-practice obligations settle."),
            dep("Callback fallback rail", "required_baseline", "Unsafe or unhelpful local continuation must rotate into callback or hub fallback."),
        ],
        [
            "blueprint-init.md#6. Booking and access continuity",
            "phase-cards.md#Card 6: Phase 5 - The Network Horizon",
            "forensic-audit-findings.md#Finding 34 - Hub coordination was oversimplified into book or not-book",
        ],
        ["DECISION_SCOPE_004", "DECISION_SCOPE_009"],
    ),
    row(
        "cap_pharmacy_referral_dispatch_and_outcome_loop",
        "pharmacy referral loop",
        "Pharmacy First eligibility, referral dispatch, bounce-back, and outcome reconciliation loop",
        "core_now",
        ["phase_0", "phase_6"],
        ["patient", "staff"],
        True,
        "Pharmacy First is one of the named endpoint families in the product mission and baseline phases.",
        "Vecells must handle eligibility, choice, consent, dispatch, bounce-back, and outcome reconciliation as a structured referral loop without pretending that transport acknowledgement equals resolved clinical outcome.",
        "Reject any flow that hides consent, bounce-back, provider choice proof, or outcome reconciliation behind a fire-and-forget referral send.",
        [
            dep("Directory of Healthcare Services or service search rail", "required_baseline", "Provider discovery is part of the referral loop."),
            dep("Referral transport rail", "required_baseline", "Dispatch requires an approved transport path."),
            dep("Outcome ingestion channel", "required_baseline", "Closure and calmness depend on returned pharmacy outcome evidence."),
        ],
        [
            "blueprint-init.md#7. Pharmacy First pathway",
            "phase-cards.md#Card 7: Phase 6 - The Pharmacy Loop",
            "phase-0-the-foundation-protocol.md#Pharmacy dispatch proof and outcome reconciliation",
            "forensic-audit-findings.md#Finding 38 - Resolved pharmacy outcomes were collapsed into self-care",
        ],
        ["DECISION_SCOPE_005", "DECISION_SCOPE_010"],
    ),
    row(
        "cap_bounded_assistive_workspace_sidecar",
        "assistive layer",
        "Bounded assistive sidecar inside the human-led workspace",
        "core_now",
        ["phase_0", "phase_3", "phase_8"],
        ["staff"],
        True,
        "The baseline includes Phase 8, but the assistive layer is optional, bounded, and subordinate to human review.",
        "Assistive summarisation, drafting, and suggestions may appear only as bounded same-shell sidecars that preserve human approval, route ownership, publication parity, and freeze disposition.",
        "Reject any review path that makes assistive output a mandatory linear gate, allows stale insert actions to remain live, or treats model presence as workflow truth.",
        [
            dep("Assistive rollout slice contracts", "required_baseline", "Visible assistive posture must bind a governed rollout contract."),
            dep("Human approval and feedback chain", "required_baseline", "Final human artifact remains authoritative."),
            dep("Model vendor integration", "feature_flagged", "Visible capabilities may be cohort-gated by vendor and route."),
        ],
        [
            "phase-cards.md#Card 9: Phase 8 - The Assistive Layer",
            "phase-8-the-assistive-layer.md#System after Phase 8",
            "vecells-complete-end-to-end-flow.md#Baseline invariants",
            "forensic-audit-findings.md#Finding 17 - AI assistance was modeled as a mandatory linear stage",
        ],
        ["DECISION_SCOPE_008", "DECISION_SCOPE_012"],
    ),
    row(
        "cap_assurance_ledger_and_evidence_graph",
        "assurance ledger",
        "Assurance ledger, evidence graph, retention, audit, and recovery admissibility",
        "core_enabling_control_plane",
        ["phase_0", "phase_9"],
        ["ops", "governance"],
        True,
        "Phase 9 makes the product operationally provable and is part of the current completion line.",
        "Assurance, retention, deletion, pack generation, replay, and recovery evidence must run through one admissible evidence graph and WORM-backed audit spine rather than retrospective spreadsheets or detached exports.",
        "Reject any launch plan that treats assurance packs, retention, archive, deletion, or recovery evidence as offline paperwork detached from system truth.",
        [
            dep("WORM audit ledger", "required_baseline", "Immutable audit is part of the platform spine."),
            dep("Standards evidence mapping", "required_baseline", "DTAC, DSPT, DCB0129, and DCB0160 evidence must remain machine-linked."),
            dep("Recovery rehearsal evidence", "required_baseline", "Operational proof requires repeated restore and failover evidence."),
        ],
        [
            "phase-cards.md#Card 10: Phase 9 - The Assurance Ledger",
            "phase-9-the-assurance-ledger.md#9A. Assurance ledger, evidence graph, and operational state contracts",
            "phase-9-the-assurance-ledger.md#9F. Resilience readiness, restore, failover, and recovery evidence",
            "forensic-audit-findings.md#Finding 113 - Assurance evidence could still exist without one authoritative graph proving admissibility",
        ],
        ["DECISION_SCOPE_006", "DECISION_SCOPE_011"],
    ),
    row(
        "cap_runtime_release_and_publication_control_plane",
        "runtime/release control plane",
        "Runtime topology, route publication, release freeze, and publication parity control plane",
        "core_enabling_control_plane",
        ["phase_0", "phase_9"],
        ["patient", "staff", "ops", "governance"],
        True,
        "Writable posture, embedded safety, and rollout recovery all depend on one published runtime tuple.",
        "Runtime topology, gateway/BFF boundaries, ReleaseApprovalFreeze, ChannelReleaseFreezeRecord, AudienceSurfaceRuntimeBinding, and recovery dispositions remain baseline scope rather than deferred DevOps hardening.",
        "Reject any surface that infers writable state from route availability, feature flags, or local cache instead of the current runtime and release tuple.",
        [
            dep("UK-hosted cloud runtime", "required_baseline", "Runtime topology and trust-zone strategy are baseline architecture."),
            dep("Route publication and manifest pipeline", "required_baseline", "Audience surfaces must publish live route contracts."),
            dep("Canary, freeze, and rollback control plane", "required_baseline", "Promotion and recovery posture are baseline requirements."),
        ],
        [
            "blueprint-init.md#12. Practical engineering shape",
            "platform-runtime-and-release-blueprint.md#Runtime rules",
            "phase-0-the-foundation-protocol.md#6.6 Scoped mutation gate",
            "phase-cards.md#Extended Summary-Layer Alignment",
        ],
        ["DECISION_SCOPE_006", "DECISION_SCOPE_011"],
    ),
    row(
        "cap_external_adapter_seams_and_baseline_rails",
        "external integrations/adapters",
        "Baseline external rails isolated behind adapter seams",
        "core_now",
        ["phase_0", "phase_4", "phase_5", "phase_6", "phase_9"],
        ["staff", "ops"],
        True,
        "The product depends on identity, booking, messaging, telephony, referral, and directory rails, but those rails must stay outside the core domain model.",
        "External dependencies must publish adapter contracts, capability matrices, replay rules, and simulator paths so Vecells can preserve one core model while suppliers vary.",
        "Reject any architecture that allows browser or core workflow code to call suppliers directly or that couples a supplier payload to canonical request meaning.",
        [
            dep("NHS login rail", "required_baseline", "Patient authentication remains a baseline rail."),
            dep("IM1 and GP-system adapters", "required_baseline", "Local booking and related GP-side workflows depend on them."),
            dep("Messaging and telephony adapters", "required_baseline", "Communications and phone parity are baseline."),
            dep("Service discovery and referral transport rails", "required_baseline", "Pharmacy discovery and dispatch are baseline."),
            dep("Contract simulators", "replaceable_by_simulator", "Simulator-backed validation is allowed before live supplier connectivity."),
        ],
        [
            "blueprint-init.md#12. Practical engineering shape",
            "vecells-complete-end-to-end-flow.md#Integration rails",
            "platform-runtime-and-release-blueprint.md#AdapterContractProfile",
            "phase-0-the-foundation-protocol.md#6.6A Adapter outbox, inbox, and callback replay rule",
        ],
        ["DECISION_SCOPE_004", "DECISION_SCOPE_011", "DECISION_SCOPE_012"],
    ),
    row(
        "cap_operational_analytics_and_continuity_evidence",
        "analytics and continuity evidence",
        "Operational analytics, continuity proof, and cross-phase conformance evidence",
        "core_enabling_control_plane",
        ["phase_0", "phase_9"],
        ["ops", "governance"],
        True,
        "Analytics is an operational subsystem and continuity proof is a release, ops, and governance dependency.",
        "Analytics, continuity-evidence producers, conformance scorecards, and live diagnostic slices remain baseline scope and may not be treated as retrospective BI or optional observability polish.",
        "Reject any proposal that postpones continuity proof, phase conformance, or operational analytics until after the core patient and staff features ship.",
        [
            dep("Event bus plus outbox publication", "required_baseline", "Operational analytics and continuity proof depend on a governed event spine."),
            dep("Assurance slice trust evaluation", "required_baseline", "Operational and governance consumers need explicit trust states."),
            dep("Cross-phase conformance scorecard", "required_baseline", "Programme completion depends on machine-auditable alignment."),
        ],
        [
            "blueprint-init.md#11. Analytics and assurance",
            "phase-cards.md#Cross-Phase Conformance Scorecard",
            "phase-9-the-assurance-ledger.md#CrossPhaseConformanceScorecard",
            "vecells-complete-end-to-end-flow.md#Baseline invariants",
        ],
        ["DECISION_SCOPE_001", "DECISION_SCOPE_006"],
    ),
    row(
        "ng_appointments_first_product_shape",
        "intake and safety",
        "Thin appointments-first front end",
        "explicitly_out_of_scope",
        ["cross_phase"],
        ["patient", "staff"],
        False,
        "The mission is demand orchestration with multiple endpoints, not a booking-only facade.",
        "Vecells is not a thin appointment-booking front end and must not be scoped as a booking-only patient access product.",
        "Reject any roadmap item that defines success mainly as appointment slot search and booking while omitting non-booking endpoints, safety gating, or request lineage.",
        [],
        [
            "blueprint-init.md#1. Product definition",
            "blueprint-init.md#4. The end-to-end patient journey",
        ],
        ["DECISION_SCOPE_002"],
    ),
    row(
        "ng_separate_phone_back_office_workflow",
        "intake and safety",
        "Separate phone-only operational workflow",
        "prohibited_architecture_pattern",
        ["cross_phase", "phase_0", "phase_1"],
        ["patient", "staff"],
        False,
        "Telephony parity is a governing product boundary rather than an implementation convenience.",
        "Phone and IVR requests may not fork into a separate back-office workflow outside the canonical intake lineage, safety model, and request shell.",
        "Reject any phone feature that stores requests outside SubmissionEnvelope, bypasses the same safety gate, or yields different receipt and status semantics.",
        [
            dep("Telephony adapter", "required_baseline", "The prohibition exists because telephony is baseline scope."),
        ],
        [
            "blueprint-init.md#2. Core product surfaces",
            "phase-0-the-foundation-protocol.md#4. Canonical ingest and request promotion",
        ],
        ["DECISION_SCOPE_003"],
    ),
    row(
        "ng_native_nhs_app_current_baseline",
        "patient portal/account/communications",
        "Native NHS App product in the current completion line",
        "explicitly_out_of_scope",
        ["cross_phase", "phase_7"],
        ["patient"],
        False,
        "The baseline explicitly defers the embedded channel expansion.",
        "The current delivery baseline does not include a native or embedded NHS App channel rollout as a hard gate.",
        "Reject any baseline completion criterion that requires Phase 7 delivery or that treats embedded NHS App support as a prerequisite for launch.",
        [],
        [
            "blueprint-init.md#14. Programme Baseline With NHS App Deferred",
            "phase-cards.md#Programme Baseline Update (NHS App Deferred)",
        ],
        ["DECISION_SCOPE_001"],
    ),
    row(
        "ng_auth_implies_claim_or_consent",
        "identity and access",
        "Authentication standing in for claim, authorization, or consent",
        "prohibited_architecture_pattern",
        ["cross_phase", "phase_0", "phase_2"],
        ["patient", "staff", "governance"],
        False,
        "The corpus distinguishes login, claim, authorization, consent, and break-glass as separate governed decisions.",
        "NHS login success, secure-link redemption, or staff sign-in may not directly imply request claim, writable resume, clinical authorization, or consent scope.",
        "Reject any user story or API flow that uses successful authentication as the sole gate for PHI-bearing mutation or cross-provider consent.",
        [
            dep("NHS login rail", "required_baseline", "The prohibition applies to a baseline dependency."),
        ],
        [
            "blueprint-init.md#10. Identity, consent, security, and policy",
            "phase-0-the-foundation-protocol.md#3. Non-negotiable invariants",
            "forensic-audit-findings.md#Finding 50 - The concrete Request schema dropped identity-binding references and treated patientRef as unconditional",
        ],
        ["DECISION_SCOPE_007"],
    ),
    row(
        "ng_auto_merge_duplicates_without_review",
        "intake and safety",
        "Auto-merge duplicate requests without governed review",
        "prohibited_architecture_pattern",
        ["cross_phase", "phase_0", "phase_3"],
        ["patient", "staff"],
        False,
        "Duplicate handling is conservative clustering and review work, not silent merge logic.",
        "Vecells may not auto-merge same-episode or near-duplicate requests without governed duplicate review, attach evidence, and continuity witness proof.",
        "Reject any proposal that collapses near-duplicates into a single request without explicit duplicate resolution and replay-safe audit.",
        [],
        [
            "blueprint-init.md#Clinical workspace and operational workflow",
            "phase-0-the-foundation-protocol.md#3. Non-negotiable invariants",
            "forensic-audit-findings.md#Finding 05 - No conservative duplicate and same-episode control",
        ],
        ["DECISION_SCOPE_011"],
    ),
    row(
        "ng_direct_request_state_writes_from_child_domains",
        "runtime/release control plane",
        "Direct request workflow-state or closure writes from child domains",
        "prohibited_architecture_pattern",
        ["cross_phase", "phase_0", "phase_4", "phase_5", "phase_6"],
        ["patient", "staff", "ops", "governance"],
        False,
        "LifecycleCoordinator ownership is one of the hardened cross-phase invariants from the prior reconciliation work.",
        "Booking, hub, pharmacy, triage, and other child domains may emit milestones, blockers, and evidence, but they may not write canonical Request.workflowState or closure directly.",
        "Reject any domain design or event handler that maps local success, ambiguity, or reopen semantics straight into request-level workflowState or closure.",
        [],
        [
            "blueprint-init.md#3. The canonical request model",
            "phase-0-the-foundation-protocol.md#3. Non-negotiable invariants",
            "forensic-audit-findings.md#Finding 74 - Phase 4 let booking-domain logic write canonical request state directly on success",
            "forensic-audit-findings.md#Finding 76 - Phase 5 let hub-domain logic write canonical request state directly",
            "forensic-audit-findings.md#Finding 77 - Phase 6 let pharmacy-domain logic write canonical request state directly on resolve and reopen paths",
        ],
        ["DECISION_SCOPE_009"],
    ),
    row(
        "ng_supplier_logic_in_core_domain",
        "external integrations/adapters",
        "Supplier-specific booking or business logic baked into the core model",
        "prohibited_architecture_pattern",
        ["cross_phase", "phase_0", "phase_4", "phase_5", "phase_6"],
        ["patient", "staff", "ops"],
        False,
        "Supplier variability is real, but the core model must remain Vecells-first and adapter-bound.",
        "Supplier-specific search, reservation, booking, directory, dispatch, or transport logic may not be hard-coded into canonical request, queue, or patient-surface semantics.",
        "Reject any change that adds vendor names, one-off transport branches, or supplier payload truth directly to core workflow decisions or patient copy.",
        [],
        [
            "blueprint-init.md#1. Product definition",
            "blueprint-init.md#6. Booking and access continuity",
            "platform-runtime-and-release-blueprint.md#AdapterContractProfile",
            "phase-0-the-foundation-protocol.md#25E. BookingProviderAdapterBinding",
        ],
        ["DECISION_SCOPE_004", "DECISION_SCOPE_012"],
    ),
    row(
        "ng_false_reservation_truth_from_countdown",
        "local booking",
        "Countdown or pending UI implying exclusive booking truth",
        "prohibited_architecture_pattern",
        ["cross_phase", "phase_0", "phase_4"],
        ["patient", "staff"],
        False,
        "Reservation truth is a hard non-goal guardrail called out by the audit and booking flow.",
        "Countdown timers, pending UI, or offer expiry copy may not imply exclusivity unless ReservationAuthority and CapacityReservation prove a held reservation.",
        "Reject any booking or waitlist UI that suggests the slot is held when the current reservation state is only soft-selected, pending, or absent.",
        [],
        [
            "phase-0-the-foundation-protocol.md#3. Non-negotiable invariants",
            "forensic-audit-findings.md#Finding 30 - Offer and hold semantics could imply false exclusivity",
            "vecells-complete-end-to-end-flow.md#Booking flow",
        ],
        ["DECISION_SCOPE_010"],
    ),
    row(
        "ng_optimistic_booked_reassurance",
        "local booking",
        "Booked-state reassurance from ambiguous supplier confirmation",
        "prohibited_architecture_pattern",
        ["cross_phase", "phase_0", "phase_4", "phase_5"],
        ["patient", "staff"],
        False,
        "Booking calmness must remain subordinate to external confirmation truth and practice visibility debt.",
        "Vecells may not imply booked calmness when supplier or hub confirmation remains ambiguous, stale, expired, disputed, or otherwise unresolved by the canonical truth projection.",
        "Reject any final patient or staff reassurance that appears before ExternalConfirmationGate clears and the governing truth projection still matches the active tuple.",
        [],
        [
            "phase-0-the-foundation-protocol.md#3. Non-negotiable invariants",
            "forensic-audit-findings.md#Finding 31 - Ambiguous supplier responses could still look like success",
            "forensic-audit-findings.md#Finding 34 - Hub coordination was oversimplified into book or not-book",
        ],
        ["DECISION_SCOPE_010"],
    ),
    row(
        "ng_direct_gp_record_mutation_for_pharmacy",
        "pharmacy referral loop",
        "Direct GP record mutation by Vecells inside Pharmacy First flow",
        "explicitly_out_of_scope",
        ["cross_phase", "phase_6"],
        ["patient", "staff"],
        False,
        "The pharmacy boundary is referral, dispatch, and outcome reconciliation, not pretending to be the pharmacy or GP clinical record.",
        "Vecells does not directly mutate GP records as part of Pharmacy First; it composes referral packages, dispatches them through approved rails, and reconciles outcomes back into governed workflow.",
        "Reject any pharmacy plan that uses Vecells as the hidden write model for direct GP record updates rather than a referral and reconciliation platform.",
        [],
        [
            "blueprint-init.md#7. Pharmacy First pathway",
            "phase-cards.md#Card 7: Phase 6 - The Pharmacy Loop",
        ],
        ["DECISION_SCOPE_005"],
    ),
    row(
        "ng_mandatory_ai_or_autonomous_decisioning",
        "assistive layer",
        "Mandatory AI gate or autonomous clinical/operational decision-maker",
        "explicitly_out_of_scope",
        ["cross_phase", "phase_3", "phase_8"],
        ["staff"],
        False,
        "Assistive capability is intentionally bounded and may not become the primary decision owner.",
        "AI assistance may not be mandatory for request progression or clinical decisioning, and no assistive output may commit authoritative workflow change without governed human approval.",
        "Reject any requirement that blocks ordinary care-path completion on model availability or that authorizes autonomous clinical or operational settlement.",
        [],
        [
            "vecells-complete-end-to-end-flow.md#Baseline invariants",
            "phase-8-the-assistive-layer.md#System after Phase 8",
            "forensic-audit-findings.md#Finding 17 - AI assistance was modeled as a mandatory linear stage",
        ],
        ["DECISION_SCOPE_008"],
    ),
    row(
        "ng_control_plane_as_post_hoc_add_on",
        "analytics and continuity evidence",
        "Treating analytics, assurance, recovery, support, or governance as post-hoc add-ons",
        "prohibited_architecture_pattern",
        ["cross_phase", "phase_0", "phase_9"],
        ["staff", "ops", "governance"],
        False,
        "The corpus explicitly promotes analytics, assurance, recovery, support, and governance into baseline delivery scope.",
        "Analytics, assurance, continuity proof, recovery rehearsal, support, and governance must remain product baseline scope and may not be deferred to a post-launch hardening project.",
        "Reject roadmap slicing that declares the core product complete without the control-plane work needed to operate, prove, and recover it.",
        [],
        [
            "blueprint-init.md#11. Analytics and assurance",
            "phase-cards.md#Programme Baseline Update (NHS App Deferred)",
            "phase-9-the-assurance-ledger.md#Rule 1: evidence comes from the system, not from retrospective narrative",
        ],
        ["DECISION_SCOPE_006"],
    ),
    row(
        "cap_optional_pds_enrichment",
        "identity and access",
        "Optional PDS enrichment layered onto governed identity binding",
        "future_optional",
        ["phase_2", "cross_phase"],
        ["patient", "staff"],
        False,
        "The baseline identity model is already defined without requiring another external demographic enrichment source.",
        "Any future PDS enrichment must remain optional and additive to IdentityBinding rather than becoming the sole authority for patientRef, claim, or writable resume.",
        "A later PDS project belongs in conditional scope and must still preserve verified IdentityBinding as the canonical local authority.",
        [
            dep("Personal Demographics Service adapter", "optional", "Potential enrichment rail rather than baseline requirement."),
            dep("PDS sandbox or simulator", "replaceable_by_simulator", "Contract testing can proceed without live dependency access."),
        ],
        [
            "phase-0-the-foundation-protocol.md#3. Non-negotiable invariants",
            "blueprint-init.md#10. Identity, consent, security, and policy",
        ],
        ["DECISION_SCOPE_013"],
        notes="Conditional future enrichment. Must not replace local governed identity authority.",
    ),
    row(
        "cap_model_vendor_assistive_rollout",
        "assistive layer",
        "Model-vendor-backed assistive rollout cohorts beyond the baseline floor",
        "future_optional",
        ["phase_8", "cross_phase"],
        ["staff", "governance"],
        False,
        "Phase 8 establishes the bounded assistive capability, but broad vendor- and cohort-specific rollout remains conditional on trust, safety, and route fit.",
        "Specific model-vendor-backed assistive cohorts may expand later only through rollout slice contracts, trust envelopes, freeze controls, and independent safety review.",
        "A request to widen assistive visibility across tenants, routes, or cohorts belongs in conditional rollout scope, not in the baseline core definition.",
        [
            dep("Model vendor contract", "feature_flagged", "Visible cohorts remain vendor- and route-specific."),
            dep("Assistive rollout ladder", "required_baseline", "Conditional expansion still depends on the governed rollout mechanism."),
            dep("Kill switch and freeze controls", "required_baseline", "Conditional widening must fail closed."),
        ],
        [
            "phase-8-the-assistive-layer.md#Pilot rollout, controlled slices, and formal exit gate",
            "phase-8-the-assistive-layer.md#System after Phase 8",
        ],
        ["DECISION_SCOPE_008", "DECISION_SCOPE_012"],
        notes="Conditional cohort expansion. Baseline requires the control plane, not universal visible rollout.",
    ),
    row(
        "cap_supplier_specific_capability_expansion",
        "external integrations/adapters",
        "Supplier-specific capability expansion hidden behind adapter seams",
        "future_optional",
        ["phase_4", "phase_5", "phase_6", "cross_phase"],
        ["patient", "staff", "ops"],
        False,
        "Baseline delivery requires common adapter-bound capability, while richer supplier-specific features remain conditional.",
        "Supplier-specific extras such as richer manage support, additional hold semantics, or provider-specific workflow conveniences belong only behind adapter capability contracts and may expand later without redefining the core model.",
        "A request for one supplier-only feature belongs in conditional scope unless the same behavior is normalized into the published adapter contract and does not leak supplier truth into the core domain.",
        [
            dep("Supplier capability matrix updates", "optional", "Expansion depends on newly declared capability support."),
            dep("Supplier sandbox or simulator", "replaceable_by_simulator", "Contract-level validation may precede production pairing."),
        ],
        [
            "blueprint-init.md#6. Booking and access continuity",
            "platform-runtime-and-release-blueprint.md#AdapterContractProfile",
            "phase-0-the-foundation-protocol.md#25E. BookingProviderAdapterBinding",
        ],
        ["DECISION_SCOPE_004", "DECISION_SCOPE_012"],
        notes="Conditional adapter-layer expansion only. Core request semantics stay vendor-agnostic.",
    ),
    row(
        "ng_direct_browser_to_adapter_or_internal_service_access",
        "runtime/release control plane",
        "Direct browser access to adapters or undeclared internal services",
        "prohibited_architecture_pattern",
        ["cross_phase", "phase_0", "phase_9"],
        ["patient", "staff", "ops", "governance"],
        False,
        "The browser boundary is a published gateway/BFF contract, not a convenience integration surface.",
        "Browsers may talk only to the governed gateway or BFF boundary; they may not call GP, telephony, messaging, pharmacy, MESH, workflow, or raw data services directly.",
        "Reject any frontend design or release shortcut that bypasses GatewayBffSurface, AudienceSurfaceRouteContract, or published runtime topology boundaries.",
        [],
        [
            "platform-frontend-blueprint.md#Frontend/backend integration boundary contract",
            "platform-runtime-and-release-blueprint.md#Runtime rules",
            "phase-0-the-foundation-protocol.md#2.9 Runtime publication plane",
        ],
        ["DECISION_SCOPE_011"],
    ),
]


DECISIONS = [
    decision(
        "DECISION_SCOPE_001",
        "Programme baseline text states that the current completion line is Phases 0 to 6, Phase 8, and Phase 9, with Phase 7 deferred.",
        "Treat Phase 7 as a designed but deferred channel expansion. Current delivery baseline excludes embedded NHS App rollout while still inventorying it.",
        "This closes the deferred-channel ambiguity and keeps milestone ownership aligned with the prior reconciliation pack.",
        [
            "blueprint-init.md#14. Programme Baseline With NHS App Deferred",
            "phase-cards.md#Programme Baseline Update (NHS App Deferred)",
        ],
        [
            "cap_nhs_app_embedded_channel",
            "ng_native_nhs_app_current_baseline",
            "cap_operational_analytics_and_continuity_evidence",
        ],
        upstream_refs=[
            "docs/analysis/02_summary_reconciliation_decisions.md#SCOPE_DEFERRED_NHS_APP",
            "docs/analysis/02_cross_phase_conformance_seed.md",
        ],
        assumption="ASSUMPTION_SCOPE_001: Deferring embedded NHS App rollout does not invalidate the web, phone, and support baseline as long as the phase-7 contracts remain designed and inventoried.",
        risk="RISK_SCOPE_001: Delayed embedded rollout increases later integration and assurance work, so phase-7 contracts must remain visible in planning even while deferred.",
    ),
    decision(
        "DECISION_SCOPE_002",
        "Blueprint orientation defines Vecells as demand orchestration for primary care and says appointment is only one endpoint.",
        "Define the product boundary around governed request lineages and endpoint routing, not around appointment search and booking alone.",
        "This closes the scattered mission gap and creates a baseline that later engineering can test against.",
        [
            "blueprint-init.md#1. Product definition",
            "blueprint-init.md#4. The end-to-end patient journey",
        ],
        [
            "cap_unified_intake_and_safety_pipeline",
            "ng_appointments_first_product_shape",
        ],
    ),
    decision(
        "DECISION_SCOPE_003",
        "Web, NHS App jump-off, and phone are described as one access experience with one pipeline and telephony parity.",
        "Treat all ingress modes as variants of one intake lineage and forbid a phone-only back-office path.",
        "This resolves the channel-vs-product boundary gap and makes parity enforceable.",
        [
            "blueprint-init.md#2. Core product surfaces",
            "phase-0-the-foundation-protocol.md#4. Canonical ingest and request promotion",
        ],
        [
            "cap_unified_intake_and_safety_pipeline",
            "cap_patient_portal_account_and_communications_shell",
            "ng_separate_phone_back_office_workflow",
        ],
    ),
    decision(
        "DECISION_SCOPE_004",
        "Booking is split into local orchestration and network coordination, while supplier behavior stays behind adapter bindings.",
        "Keep booking in scope as two coordinated capabilities and classify supplier-specific capability expansion as conditional behind adapter seams.",
        "This closes the booking-boundary ambiguity and prevents vendor lock-in from leaking into the core model.",
        [
            "blueprint-init.md#6. Booking and access continuity",
            "phase-0-the-foundation-protocol.md#25E. BookingProviderAdapterBinding",
        ],
        [
            "cap_local_booking_orchestrator",
            "cap_truthful_booking_manage_waitlist_and_confirmation",
            "cap_network_coordination_desk",
            "cap_supplier_specific_capability_expansion",
            "ng_supplier_logic_in_core_domain",
        ],
        assumption="ASSUMPTION_SCOPE_004: A common adapter contract can cover the current local-booking and network-booking baseline without exposing every supplier-specific convenience feature on day one.",
        risk="RISK_SCOPE_004: If a baseline deployment depends on a supplier-only capability that is not normalized into the adapter contract, launch scope will drift or fragment.",
    ),
    decision(
        "DECISION_SCOPE_005",
        "Pharmacy First is defined as a structured referral and closure loop rather than a direct GP record mutation path.",
        "Keep eligibility, choice, consent, dispatch, bounce-back, and outcome reconciliation in scope, and reject direct GP record mutation as part of the Vecells product boundary.",
        "This closes the pharmacy boundary ambiguity and preserves the intended operational role of the platform.",
        [
            "blueprint-init.md#7. Pharmacy First pathway",
            "phase-cards.md#Card 7: Phase 6 - The Pharmacy Loop",
        ],
        [
            "cap_pharmacy_referral_dispatch_and_outcome_loop",
            "ng_direct_gp_record_mutation_for_pharmacy",
        ],
    ),
    decision(
        "DECISION_SCOPE_006",
        "Support, operations, governance, runtime/release, analytics, assurance, and continuity proof are treated as foundational controls across the corpus.",
        "Classify control-plane shells and evidence systems as baseline scope, not as post-launch hardening or BI backlog.",
        "This resolves the feature-vs-control-plane ambiguity and keeps baseline completion aligned with Phase 9 and runtime publication law.",
        [
            "blueprint-init.md#11. Analytics and assurance",
            "blueprint-init.md#12. Practical engineering shape",
            "phase-9-the-assurance-ledger.md#Rule 1: evidence comes from the system, not from retrospective narrative",
        ],
        [
            "cap_authorization_consent_and_break_glass_governance",
            "cap_support_workspace_replay_and_repair",
            "cap_operations_console_control_room",
            "cap_governance_and_admin_shell",
            "cap_assurance_ledger_and_evidence_graph",
            "cap_runtime_release_and_publication_control_plane",
            "cap_operational_analytics_and_continuity_evidence",
            "ng_control_plane_as_post_hoc_add_on",
        ],
        upstream_refs=[
            "docs/analysis/02_summary_reconciliation_decisions.md",
            "docs/analysis/02_cross_phase_conformance_seed.md",
        ],
    ),
    decision(
        "DECISION_SCOPE_007",
        "Identity binding, authorization, and consent are distinct contracts; login success is not enough to claim or mutate.",
        "Keep identity proof, claim, writable authority, consent scope, and break-glass posture separate in the scope boundary.",
        "This closes the identity and claim ambiguity and preserves the canonical patientRef and auth model normalized in the prior task.",
        [
            "blueprint-init.md#10. Identity, consent, security, and policy",
            "phase-0-the-foundation-protocol.md#3. Non-negotiable invariants",
        ],
        [
            "cap_identity_binding_and_session_authority",
            "cap_authorization_consent_and_break_glass_governance",
            "ng_auth_implies_claim_or_consent",
            "cap_optional_pds_enrichment",
        ],
        upstream_refs=[
            "docs/analysis/02_summary_reconciliation_decisions.md#STATE_IDENTITY_AXIS_PATIENTREF",
            "docs/analysis/02_canonical_term_glossary.md",
        ],
    ),
    decision(
        "DECISION_SCOPE_008",
        "Assistive behavior is optional, bounded, and subordinate to human approval; model rollout is cohort-governed.",
        "Keep a bounded assistive sidecar in baseline scope because Phase 8 is in the completion line, but treat broad vendor-backed rollout as conditional rather than universal.",
        "This closes the AI posture ambiguity without pushing Phase 8 out of the baseline.",
        [
            "vecells-complete-end-to-end-flow.md#Baseline invariants",
            "phase-8-the-assistive-layer.md#Pilot rollout, controlled slices, and formal exit gate",
        ],
        [
            "cap_bounded_assistive_workspace_sidecar",
            "cap_model_vendor_assistive_rollout",
            "ng_mandatory_ai_or_autonomous_decisioning",
        ],
        assumption="ASSUMPTION_SCOPE_008: Baseline completeness for Phase 8 means the bounded control plane and at least a narrow governed rollout path exist, not that every tenant or route has visible assistive chrome.",
        risk="RISK_SCOPE_008: Teams may wrongly read Phase 8 as universal AI rollout unless the cohort and freeze contracts stay explicit in planning and release review.",
    ),
    decision(
        "DECISION_SCOPE_009",
        "LifecycleCoordinator owns cross-domain milestone derivation and request closure, while child domains emit facts and gates.",
        "Make child-domain direct writes to Request.workflowState or closure a hard rejection criterion and keep downstream domains case-local first.",
        "This resolves state-ownership drift and prevents phase-local workflows from redefining canonical request meaning.",
        [
            "blueprint-init.md#3. The canonical request model",
            "phase-0-the-foundation-protocol.md#3. Non-negotiable invariants",
        ],
        [
            "cap_clinical_workspace_review_and_endpoint_selection",
            "cap_network_coordination_desk",
            "ng_direct_request_state_writes_from_child_domains",
        ],
        upstream_refs=[
            "docs/analysis/02_summary_reconciliation_decisions.md#OWNERSHIP_LIFECYCLE_COORDINATOR",
        ],
    ),
    decision(
        "DECISION_SCOPE_010",
        "Reservation truth, external confirmation, and outcome reconciliation are separate from calm user-facing success states.",
        "Make truthful waitlist, booking, hub, pharmacy, and manage semantics part of scope, and reject countdown-based or transport-only reassurance.",
        "This closes the false-reassurance boundary for booking and pharmacy journeys.",
        [
            "phase-0-the-foundation-protocol.md#3. Non-negotiable invariants",
            "blueprint-init.md#6. Booking and access continuity",
            "blueprint-init.md#7. Pharmacy First pathway",
        ],
        [
            "cap_truthful_booking_manage_waitlist_and_confirmation",
            "cap_pharmacy_referral_dispatch_and_outcome_loop",
            "ng_false_reservation_truth_from_countdown",
            "ng_optimistic_booked_reassurance",
        ],
        upstream_refs=[
            "docs/analysis/02_summary_reconciliation_decisions.md#TRUTH_EXTERNAL_CONFIRMATION_GATE",
        ],
    ),
    decision(
        "DECISION_SCOPE_011",
        "Bounded contexts, gateway/BFF boundaries, outbox reliability, quarantine, append-only audit, and recovery posture are named as mandatory architecture, not implementation detail.",
        "Keep modular bounded contexts, append-only audit, object-store quarantine, event bus plus outbox, gateway boundaries, and recovery-safe runtime publication inside the scope boundary.",
        "This converts broad architecture prose into enforceable platform scope and blocks drift toward an unstructured monolith, coupled microservice sprawl, or direct browser-to-service access.",
        [
            "blueprint-init.md#12. Practical engineering shape",
            "platform-frontend-blueprint.md#Frontend/backend integration boundary contract",
            "platform-runtime-and-release-blueprint.md#Runtime rules",
            "phase-0-the-foundation-protocol.md#4.3A Artifact quarantine and fallback review",
        ],
        [
            "cap_fallback_review_and_artifact_quarantine",
            "cap_support_workspace_replay_and_repair",
            "cap_operations_console_control_room",
            "cap_governance_and_admin_shell",
            "cap_assurance_ledger_and_evidence_graph",
            "cap_runtime_release_and_publication_control_plane",
            "cap_external_adapter_seams_and_baseline_rails",
            "ng_auto_merge_duplicates_without_review",
            "ng_direct_browser_to_adapter_or_internal_service_access",
        ],
    ),
    decision(
        "DECISION_SCOPE_012",
        "Supplier and model-vendor variability must resolve through adapter contracts or rollout contracts, not through core-domain branching.",
        "Treat supplier-specific capability expansion and model-vendor rollout as conditional scope behind published seams, while keeping the seam infrastructure itself in baseline scope.",
        "This preserves a stable baseline while allowing future expansion without reopening product identity.",
        [
            "phase-8-the-assistive-layer.md#Pilot rollout, controlled slices, and formal exit gate",
            "platform-runtime-and-release-blueprint.md#AdapterContractProfile",
            "phase-0-the-foundation-protocol.md#25E. BookingProviderAdapterBinding",
        ],
        [
            "cap_local_booking_orchestrator",
            "cap_bounded_assistive_workspace_sidecar",
            "cap_external_adapter_seams_and_baseline_rails",
            "cap_model_vendor_assistive_rollout",
            "cap_supplier_specific_capability_expansion",
            "ng_supplier_logic_in_core_domain",
        ],
        upstream_refs=[
            "docs/analysis/02_summary_reconciliation_decisions.md",
        ],
        assumption="ASSUMPTION_SCOPE_012: The current baseline can normalize the common denominator of supplier and model capabilities while leaving richer options cohort-gated or adapter-specific.",
        risk="RISK_SCOPE_012: If conditional capability expansion leaks into core workflow language, teams will mistake a supplier-specific edge for baseline product law.",
    ),
    decision(
        "DECISION_SCOPE_013",
        "The canonical request and identity model works with nullable patientRef derived from verified IdentityBinding, so extra demographic enrichment is not required for baseline scope.",
        "Classify PDS enrichment as future optional and keep IdentityBinding as the canonical baseline authority.",
        "This prevents a new external dependency from being smuggled into the baseline identity boundary without corpus support.",
        [
            "phase-0-the-foundation-protocol.md#3. Non-negotiable invariants",
            "blueprint-init.md#10. Identity, consent, security, and policy",
        ],
        [
            "cap_identity_binding_and_session_authority",
            "cap_optional_pds_enrichment",
        ],
        upstream_refs=[
            "docs/analysis/02_summary_reconciliation_decisions.md#STATE_IDENTITY_AXIS_PATIENTREF",
        ],
        assumption="ASSUMPTION_SCOPE_013: Baseline delivery can achieve safe identity matching and claim without live PDS enrichment because the corpus already defines verified IdentityBinding and repair flows.",
        risk="RISK_SCOPE_013: Demographic quality issues may raise later demand for PDS enrichment, so this remains inventoried as conditional future scope rather than ignored.",
    ),
]


def load_upstream_metadata() -> dict[str, Any]:
    registry_path = DATA_DIR / "requirement_registry.jsonl"
    summary_conflicts_path = DATA_DIR / "summary_conflicts.json"
    conformance_seed_path = DATA_DIR / "cross_phase_conformance_seed.json"

    requirement_registry_rows = 0
    if registry_path.exists():
        requirement_registry_rows = len(registry_path.read_text().splitlines())

    summary_conflict_count = 0
    if summary_conflicts_path.exists():
        summary_conflict_count = len(json.loads(summary_conflicts_path.read_text())["rows"])

    phase_titles = dict(PHASE_LABELS_FALLBACK)
    conformance_seed_rows = 0
    if conformance_seed_path.exists():
        seed_payload = json.loads(conformance_seed_path.read_text())
        conformance_seed_rows = len(seed_payload["rows"])
        for item in seed_payload["rows"]:
            phase_titles[item["phase_id"]] = item["phase_title"]

    return {
        "requirement_registry_rows": requirement_registry_rows,
        "summary_conflict_count": summary_conflict_count,
        "conformance_seed_rows": conformance_seed_rows,
        "phase_titles": phase_titles,
    }


def prepare_rows(phase_titles: dict[str, str]) -> list[dict[str, Any]]:
    prepared: list[dict[str, Any]] = []
    for item in ROWS:
        record = dict(item)
        record["phase_titles"] = [phase_titles[phase_id] for phase_id in item["phases"]]
        record["visibility_summary"] = ", ".join(item["visibility"]) if item["visibility"] else "none"
        if item["dependencies"]:
            record["dependency_summary"] = "; ".join(
                f"{dep_item['name']} ({dep_item['status']})" for dep_item in item["dependencies"]
            )
        else:
            record["dependency_summary"] = "No external dependency because the capability is intentionally excluded or prohibited."
        record["source_summary"] = "; ".join(item["source_refs"])
        prepared.append(record)
    return prepared


def md_cell(value: Any) -> str:
    text = str(value)
    return text.replace("|", "\\|").replace("\n", "<br>")


def render_table(headers: list[str], rows: list[list[Any]]) -> str:
    header_line = "| " + " | ".join(headers) + " |"
    separator_line = "| " + " | ".join(["---"] * len(headers)) + " |"
    body_lines = [
        "| " + " | ".join(md_cell(value) for value in row_values) + " |"
        for row_values in rows
    ]
    return "\n".join([header_line, separator_line, *body_lines])


def classification_summary(rows: list[dict[str, Any]]) -> list[list[str]]:
    counts = Counter(item["classification"] for item in rows)
    return [
        [classification, counts.get(classification, 0)]
        for classification in ALLOWED_CLASSIFICATIONS
    ]


def render_product_scope_boundary(
    rows: list[dict[str, Any]], metadata: dict[str, Any]
) -> str:
    lines: list[str] = [
        "# Product Scope Boundary",
        "",
        "## Mission",
        "",
        PRODUCT_MISSION,
        "",
        "## Baseline Line",
        "",
        f"- {CURRENT_BASELINE_STATEMENT}",
        f"- Upstream requirement registry rows consumed: {metadata['requirement_registry_rows']}",
        f"- Upstream summary conflicts consumed: {metadata['summary_conflict_count']}",
        f"- Upstream conformance seed rows consumed: {metadata['conformance_seed_rows']}",
        "",
        "## Boundary Rules",
        "",
        "- One request lineage across web, NHS App jump-off, phone, secure-link continuation, and support-assisted capture.",
        "- Appointment is one endpoint, not the product definition.",
        "- Runtime, assurance, governance, analytics, continuity evidence, and recovery are baseline product scope.",
        "- Supplier and model-vendor variability stays behind adapter or rollout seams.",
        "- Child domains emit facts and gates; LifecycleCoordinator owns request milestone and closure meaning.",
        "",
        "## Classification Summary",
        "",
        render_table(["Classification", "Row count"], classification_summary(rows)),
        "",
        "## Capability Matrix",
        "",
        render_table(
            [
                "ID",
                "Category",
                "Capability",
                "Class",
                "Phases",
                "Visible to",
                "Baseline required",
                "Scope statement",
            ],
            [
                [
                    item["capability_id"],
                    item["scope_category"],
                    item["capability_name"],
                    item["classification"],
                    ", ".join(item["phase_titles"]),
                    item["visibility_summary"],
                    "yes" if item["baseline_required"] else "no",
                    item["scope_statement"],
                ]
                for item in rows
            ],
        ),
        "",
    ]
    return "\n".join(lines)


def render_non_goals(rows: list[dict[str, Any]]) -> str:
    excluded = [
        item
        for item in rows
        if item["classification"] in {"explicitly_out_of_scope", "prohibited_architecture_pattern"}
    ]
    lines: list[str] = [
        "# Non-Goals And Explicit Exclusions",
        "",
        "Every row below is a rejection rule, not an aspiration.",
        "",
        render_table(
            ["ID", "Class", "Exclusion", "Rejection test", "Source refs"],
            [
                [
                    item["capability_id"],
                    item["classification"],
                    item["scope_statement"],
                    item["acceptance_implication"],
                    item["source_summary"],
                ]
                for item in excluded
            ],
        ),
        "",
    ]
    return "\n".join(lines)


def render_current_delivery_baseline(
    rows: list[dict[str, Any]], metadata: dict[str, Any]
) -> str:
    baseline_rows = [item for item in rows if item["baseline_required"]]
    lines: list[str] = [
        "# Current Delivery Baseline",
        "",
        CURRENT_BASELINE_STATEMENT,
        "",
        "## Included phases",
        "",
        "- Phase 0: The Foundation Protocol",
        "- Phase 1: The Red Flag Gate",
        "- Phase 2: Identity and Echoes",
        "- Phase 3: The Human Checkpoint",
        "- Phase 4: The Booking Engine",
        "- Phase 5: The Network Horizon",
        "- Phase 6: The Pharmacy Loop",
        "- Phase 8: The Assistive Layer",
        "- Phase 9: The Assurance Ledger",
        "",
        "## Baseline capabilities",
        "",
        render_table(
            [
                "ID",
                "Capability",
                "Class",
                "Owning phases",
                "Dependency summary",
            ],
            [
                [
                    item["capability_id"],
                    item["capability_name"],
                    item["classification"],
                    ", ".join(item["phase_titles"]),
                    item["dependency_summary"],
                ]
                for item in baseline_rows
            ],
        ),
        "",
        "## Baseline interpretation",
        "",
        f"- The baseline keeps {sum(1 for item in baseline_rows if item['classification'] == 'core_now')} direct capability rows in scope now.",
        f"- The baseline keeps {sum(1 for item in baseline_rows if item['classification'] == 'core_enabling_control_plane')} control-plane rows in scope now.",
        f"- Deferred or conditional rows are still inventoried, but they do not block the current completion line.",
        f"- Upstream summary conflict pack size: {metadata['summary_conflict_count']} rows.",
        "",
    ]
    return "\n".join(lines)


def render_deferred_and_conditional_scope(rows: list[dict[str, Any]]) -> str:
    deferred_rows = [
        item
        for item in rows
        if item["classification"] in {"deferred_channel_expansion", "future_optional"}
    ]
    lines: list[str] = [
        "# Deferred And Conditional Scope",
        "",
        "These items are designed and inventoried now, but they do not all belong in the current completion line.",
        "",
        render_table(
            [
                "ID",
                "Capability",
                "Class",
                "Condition",
                "Dependency summary",
            ],
            [
                [
                    item["capability_id"],
                    item["capability_name"],
                    item["classification"],
                    item["notes"] or item["scope_statement"],
                    item["dependency_summary"],
                ]
                for item in deferred_rows
            ],
        ),
        "",
        "## Required conditional items",
        "",
        "- `cap_nhs_app_embedded_channel`: deferred channel expansion under phase-7 contracts.",
        "- `cap_optional_pds_enrichment`: optional demographic enrichment only.",
        "- `cap_model_vendor_assistive_rollout`: cohort-gated model-vendor rollout beyond the baseline floor.",
        "- `cap_supplier_specific_capability_expansion`: supplier-specific capability growth behind adapter seams only.",
        "",
    ]
    return "\n".join(lines)


def render_scope_decision_log(
    decisions: list[dict[str, Any]], metadata: dict[str, Any]
) -> str:
    lines: list[str] = [
        "# Scope Decision Log",
        "",
        "## Upstream inputs consumed",
        "",
        f"- `requirement_registry.jsonl`: {metadata['requirement_registry_rows']} rows",
        f"- `summary_conflicts.json`: {metadata['summary_conflict_count']} discrepancy rows",
        f"- `cross_phase_conformance_seed.json`: {metadata['conformance_seed_rows']} seeded rows",
        "",
    ]

    for item in decisions:
        lines.extend(
            [
                f"## {item['decision_id']}",
                "",
                f"- Source statement: {item['source_statement']}",
                f"- Normalized interpretation: {item['normalized_interpretation']}",
                f"- Reason: {item['reason']}",
                f"- Source refs: {'; '.join(item['source_refs'])}",
                f"- Upstream refs: {'; '.join(item['upstream_refs']) if item['upstream_refs'] else 'none'}",
                f"- Affected capability ids: {', '.join(item['affected_capability_ids'])}",
                f"- Assumption: {item['assumption'] or 'none'}",
                f"- Risk: {item['risk'] or 'none'}",
                "",
            ]
        )

    return "\n".join(lines)


def write_json_artifact(
    rows: list[dict[str, Any]], decisions: list[dict[str, Any]], metadata: dict[str, Any]
) -> None:
    payload = {
        "matrix_id": "product_scope_matrix_v1",
        "mission": PRODUCT_MISSION,
        "current_delivery_baseline_statement": CURRENT_BASELINE_STATEMENT,
        "baseline_phases": BASELINE_PHASES,
        "deferred_phases": DEFERRED_PHASES,
        "classification_summary": {
            classification: sum(1 for item in rows if item["classification"] == classification)
            for classification in ALLOWED_CLASSIFICATIONS
        },
        "upstream_inputs": {
            "requirement_registry_rows": metadata["requirement_registry_rows"],
            "summary_conflict_count": metadata["summary_conflict_count"],
            "conformance_seed_rows": metadata["conformance_seed_rows"],
        },
        "rows": rows,
        "decision_log": decisions,
    }
    JSON_PATH.write_text(json.dumps(payload, indent=2) + "\n")


def write_csv_artifact(rows: list[dict[str, Any]]) -> None:
    fieldnames = [
        "capability_id",
        "scope_category",
        "capability_name",
        "classification",
        "baseline_required",
        "phase_ids",
        "phase_titles",
        "visibility",
        "why_it_exists",
        "scope_statement",
        "acceptance_implication",
        "dependency_summary",
        "dependencies_json",
        "source_refs",
        "related_decision_ids",
        "notes",
    ]

    with CSV_PATH.open("w", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        for item in rows:
            writer.writerow(
                {
                    "capability_id": item["capability_id"],
                    "scope_category": item["scope_category"],
                    "capability_name": item["capability_name"],
                    "classification": item["classification"],
                    "baseline_required": "yes" if item["baseline_required"] else "no",
                    "phase_ids": "; ".join(item["phases"]),
                    "phase_titles": "; ".join(item["phase_titles"]),
                    "visibility": "; ".join(item["visibility"]),
                    "why_it_exists": item["why_it_exists"],
                    "scope_statement": item["scope_statement"],
                    "acceptance_implication": item["acceptance_implication"],
                    "dependency_summary": item["dependency_summary"],
                    "dependencies_json": json.dumps(item["dependencies"], sort_keys=True),
                    "source_refs": "; ".join(item["source_refs"]),
                    "related_decision_ids": "; ".join(item["related_decision_ids"]),
                    "notes": item["notes"],
                }
            )


def main() -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    DOCS_DIR.mkdir(parents=True, exist_ok=True)

    metadata = load_upstream_metadata()
    rows = prepare_rows(metadata["phase_titles"])
    decisions = DECISIONS

    write_json_artifact(rows, decisions, metadata)
    write_csv_artifact(rows)

    SCOPE_DOC_PATH.write_text(render_product_scope_boundary(rows, metadata) + "\n")
    NON_GOALS_DOC_PATH.write_text(render_non_goals(rows) + "\n")
    BASELINE_DOC_PATH.write_text(render_current_delivery_baseline(rows, metadata) + "\n")
    DEFERRED_DOC_PATH.write_text(render_deferred_and_conditional_scope(rows) + "\n")
    DECISION_LOG_DOC_PATH.write_text(render_scope_decision_log(decisions, metadata) + "\n")

    counts = Counter(item["classification"] for item in rows)
    print(
        json.dumps(
            {
                "matrix_id": "product_scope_matrix_v1",
                "row_count": len(rows),
                "decision_count": len(decisions),
                "classification_summary": counts,
                "baseline_required_rows": sum(1 for item in rows if item["baseline_required"]),
            },
            indent=2,
            sort_keys=True,
        )
    )


if __name__ == "__main__":
    main()
