#!/usr/bin/env python3
from __future__ import annotations

import csv
import html
import json
import textwrap
from collections import Counter, defaultdict
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = ROOT / "data" / "analysis"
DOCS_DIR = ROOT / "docs" / "architecture"

REQUIREMENT_REGISTRY_PATH = DATA_DIR / "requirement_registry.jsonl"
SUMMARY_CONFLICTS_PATH = DATA_DIR / "summary_conflicts.json"
SCOPE_MATRIX_PATH = DATA_DIR / "product_scope_matrix.json"
PERSONA_CATALOG_PATH = DATA_DIR / "persona_catalog.json"
ROUTE_FAMILY_PATH = DATA_DIR / "route_family_inventory.csv"
REQUEST_LINEAGE_PATH = DATA_DIR / "request_lineage_transitions.json"
OBJECT_CATALOG_PATH = DATA_DIR / "object_catalog.json"

STATE_MACHINES_JSON_PATH = DATA_DIR / "state_machines.json"
TRANSITION_TABLE_CSV_PATH = DATA_DIR / "state_transition_table.csv"
INVARIANTS_JSON_PATH = DATA_DIR / "cross_phase_invariants.json"
GUARD_MATRIX_CSV_PATH = DATA_DIR / "guard_and_proof_matrix.csv"
ILLEGAL_TRANSITIONS_JSON_PATH = DATA_DIR / "illegal_transitions.json"

ATLAS_DOC_PATH = DOCS_DIR / "07_state_machine_atlas.md"
INVARIANTS_DOC_PATH = DOCS_DIR / "07_cross_phase_invariants.md"
TRANSITIONS_DOC_PATH = DOCS_DIR / "07_transition_tables.md"
GUARDS_DOC_PATH = DOCS_DIR / "07_guard_and_proof_matrix.md"
ILLEGAL_DOC_PATH = DOCS_DIR / "07_illegal_transition_and_conflict_report.md"
ATLAS_HTML_PATH = DOCS_DIR / "07_state_machine_atlas.html"
RELATIONSHIPS_MMD_PATH = DOCS_DIR / "07_state_machine_relationships.mmd"

SOURCE_PRECEDENCE = [
    "phase-0-the-foundation-protocol.md",
    "phase-1-the-red-flag-gate.md",
    "phase-2-identity-and-echoes.md",
    "phase-3-the-human-checkpoint.md",
    "phase-4-the-booking-engine.md",
    "phase-5-the-network-horizon.md",
    "phase-6-the-pharmacy-loop.md",
    "callback-and-clinician-messaging-loop.md",
    "self-care-content-and-admin-resolution-blueprint.md",
    "phase-8-the-assistive-layer.md",
    "phase-9-the-assurance-ledger.md",
    "platform-runtime-and-release-blueprint.md",
    "patient-account-and-communications-blueprint.md",
    "staff-operations-and-support-blueprint.md",
    "forensic-audit-findings.md",
]

ATLAS_MARKERS = [
    'data-testid="atlas-shell"',
    'data-testid="atlas-nav"',
    'data-testid="view-toggle"',
    'data-testid="hero-summary"',
    'data-testid="filter-search"',
    'data-testid="filter-phase"',
    'data-testid="filter-context"',
    'data-testid="filter-axis"',
    'data-testid="filter-coordinator"',
    'data-testid="diagram-panel"',
    'data-testid="timeline-stripe"',
    'data-testid="transition-table"',
    'data-testid="illegal-table"',
    'data-testid="detail-panel"',
    'data-testid="invariant-lattice"',
    'data-testid="machine-parity-table"',
]

MANDATORY_MACHINE_NAMES = {
    "SubmissionEnvelope.state",
    "Request.workflowState",
    "Request.safetyState",
    "Request.identityState",
    "Episode.state",
    "IdentityBinding.bindingState",
    "Session.sessionState",
    "Session.routeAuthorityState",
    "AccessGrant.grantState",
    "DuplicateCluster.reviewStatus",
    "TelephonyEvidenceReadinessAssessment.usabilityState",
    "TelephonyContinuationEligibility.eligibilityState",
    "FallbackReviewCase.patientVisibleState",
    "RequestLifecycleLease.state",
    "RequestClosureRecord.decision",
    "CapacityReservation.state",
    "ExternalConfirmationGate.state",
    "RouteIntentBinding.bindingState",
    "CommandSettlementRecord.authoritativeOutcomeState",
    "AudienceSurfaceRuntimeBinding.bindingState",
    "TriageTask.status",
    "DecisionEpoch.epochState",
    "MoreInfoReplyWindowCheckpoint.replyWindowState",
    "CallbackCase.state",
    "ClinicianMessageThread.state",
    "BookingCase.status",
    "WaitlistFallbackObligation.transferState",
    "HubCoordinationCase.status",
    "HubOfferToConfirmationTruthProjection.confirmationTruthState",
    "PharmacyCase.status",
    "PharmacyConsentCheckpoint.checkpointState",
    "PharmacyDispatchAttempt.status",
    "AdminResolutionCase.state",
    "AssistiveCapabilityTrustEnvelope.trustState",
    "AssistiveCapabilityRolloutVerdict.rolloutRung",
    "DispositionEligibilityAssessment.eligibilityState",
    "LegalHoldRecord.holdState",
    "ResilienceSurfaceRuntimeBinding.bindingState",
    "RecoveryControlPosture.postureState",
    "CrossPhaseConformanceScorecard.scorecardState",
}

MANDATORY_INVARIANT_IDS = {
    "INV_REQ_WORKFLOW_MILESTONES_ONLY",
    "INV_BLOCKERS_ORTHOGONAL",
    "INV_PATIENTREF_DERIVES_FROM_BINDING",
    "INV_COORDINATOR_OWNS_CANONICAL_MILESTONES",
    "INV_CHILD_DOMAINS_EMIT_SIGNALS_ONLY",
    "INV_NO_BUSINESS_SUCCESS_FROM_TRANSPORT",
    "INV_MUTATION_REQUIRES_CURRENT_ROUTE_TUPLE",
    "INV_CLOSURE_REQUIRES_EMPTY_BLOCKERS",
    "INV_SAME_REQUEST_CONTINUATION_REUSES_LINEAGE",
    "INV_WRONG_PATIENT_IS_REPAIR_PATH",
    "INV_EVIDENCE_ASSIMILATION_AND_RESAFETY",
    "INV_CONFIRMATION_AMBIGUITY_STAYS_EXPLICIT",
    "INV_PROJECTION_FRESHNESS_GATES_ACTIONABILITY",
    "INV_URGENT_REQUIRED_NOT_DIVERTED",
    "INV_MORE_INFO_TTL_AND_SUPERSESSION",
    "INV_CALLBACK_AND_MESSAGE_EVIDENCE_BOUND",
    "INV_WAITLIST_AND_HUB_TRANSFER_EXPLICIT",
    "INV_PHARMACY_CONSENT_DISPATCH_RECONCILIATION",
    "INV_ASSISTIVE_FREEZE_IN_PLACE",
    "INV_RETENTION_AND_RESILIENCE_GATE_EXPORTS",
    "INV_CONTINUITY_PROOF_REQUIRED_FOR_SIGNOFF",
}


@dataclass(frozen=True)
class StateNode:
    value: str
    label: str
    lane: int
    order: int
    description: str = ""
    classification: str = "normal"


@dataclass(frozen=True)
class TransitionSpec:
    transition_id: str
    from_state: str
    to_state: str
    trigger: str
    guards: tuple[str, ...]
    authoritative_proofs: tuple[str, ...]
    related_objects: tuple[str, ...]
    degraded_posture: str
    closure_blocker_interactions: tuple[str, ...]
    coordinator_owned: bool
    source_refs: tuple[str, ...]
    notes: str = ""


@dataclass(frozen=True)
class IllegalTransitionSpec:
    issue_id: str
    machine_id: str
    from_state: str
    to_state: str
    issue_type: str
    dangerous_interpretation: str
    canonical_correction: str
    related_invariant_ids: tuple[str, ...]
    source_refs: tuple[str, ...]
    forensic_refs: tuple[str, ...]
    notes: str = ""


@dataclass(frozen=True)
class MachineSpec:
    machine_id: str
    canonical_name: str
    owning_object_name: str
    state_axis_type: str
    machine_family: str
    phase_tags: tuple[str, ...]
    source_file: str
    source_heading_or_block: str
    supporting_source_refs: tuple[str, ...]
    whether_transition_is_coordinator_owned: bool
    states: tuple[StateNode, ...]
    initial_state: str
    terminal_states: tuple[str, ...]
    supersession_states: tuple[str, ...]
    legal_transitions: tuple[TransitionSpec, ...]
    illegal_transitions: tuple[IllegalTransitionSpec, ...]
    related_machine_ids: tuple[str, ...]
    notes: str


@dataclass(frozen=True)
class InvariantSpec:
    invariant_id: str
    canonical_wording: str
    scope: str
    affected_machine_ids: tuple[str, ...]
    affected_objects: tuple[str, ...]
    related_guards: tuple[str, ...]
    related_proofs: tuple[str, ...]
    violating_transition_refs: tuple[str, ...]
    source_refs: tuple[str, ...]
    test_hint: str
    phase_scope: tuple[str, ...]
    notes: str = ""


def load_json(path: Path) -> Any:
    return json.loads(path.read_text())


def load_csv(path: Path) -> list[dict[str, str]]:
    with path.open() as handle:
        return list(csv.DictReader(handle))


def count_jsonl(path: Path) -> int:
    return sum(1 for line in path.read_text().splitlines() if line.strip())


def ensure_parent(path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)


def write_text(path: Path, content: str) -> None:
    ensure_parent(path)
    path.write_text(content.rstrip() + "\n")


def write_json(path: Path, payload: Any) -> None:
    ensure_parent(path)
    path.write_text(json.dumps(payload, indent=2) + "\n")


def flatten(value: Any) -> str:
    if isinstance(value, bool):
        return "yes" if value else "no"
    if isinstance(value, list):
        return "; ".join(str(item) for item in value)
    return str(value)


def write_csv(path: Path, fieldnames: list[str], rows: list[dict[str, Any]]) -> None:
    ensure_parent(path)
    with path.open("w", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        for row in rows:
            writer.writerow({field: flatten(row.get(field, "")) for field in fieldnames})


def md_cell(value: Any) -> str:
    if isinstance(value, list):
        return "<br>".join(str(item) for item in value)
    if isinstance(value, bool):
        return "yes" if value else "no"
    return str(value)


def render_table(headers: list[str], rows: list[list[Any]]) -> str:
    head = "| " + " | ".join(headers) + " |"
    rule = "| " + " | ".join(["---"] * len(headers)) + " |"
    body = ["| " + " | ".join(md_cell(cell) for cell in row) + " |" for row in rows]
    return "\n".join([head, rule, *body])


def token(value: str) -> str:
    cleaned = []
    for char in value:
        if char.isalnum():
            cleaned.append(char.upper())
        else:
            cleaned.append("_")
    compact = "".join(cleaned)
    while "__" in compact:
        compact = compact.replace("__", "_")
    return compact.strip("_")


def s(value: str, *, lane: int, order: int, description: str = "", classification: str = "normal") -> StateNode:
    return StateNode(
        value=value,
        label=value.replace("_", " "),
        lane=lane,
        order=order,
        description=description,
        classification=classification,
    )


def tr(
    machine_id: str,
    from_state: str,
    to_state: str,
    *,
    trigger: str,
    guards: list[str],
    proofs: list[str],
    related_objects: list[str] | None = None,
    degraded_posture: str = "",
    blockers: list[str] | None = None,
    coordinator_owned: bool = False,
    source_refs: list[str] | None = None,
    notes: str = "",
) -> TransitionSpec:
    related_objects = related_objects or []
    blockers = blockers or []
    source_refs = source_refs or []
    return TransitionSpec(
        transition_id=f"{machine_id}__{token(from_state)}__{token(to_state)}",
        from_state=from_state,
        to_state=to_state,
        trigger=trigger,
        guards=tuple(guards),
        authoritative_proofs=tuple(proofs),
        related_objects=tuple(related_objects),
        degraded_posture=degraded_posture,
        closure_blocker_interactions=tuple(blockers),
        coordinator_owned=coordinator_owned,
        source_refs=tuple(source_refs),
        notes=notes,
    )


def illegal(
    machine_id: str,
    from_state: str,
    to_state: str,
    *,
    issue_type: str,
    dangerous: str,
    correction: str,
    invariants: list[str],
    source_refs: list[str],
    forensic_refs: list[str],
    notes: str = "",
) -> IllegalTransitionSpec:
    return IllegalTransitionSpec(
        issue_id=f"ISSUE_{machine_id}_{token(from_state)}_{token(to_state)}",
        machine_id=machine_id,
        from_state=from_state,
        to_state=to_state,
        issue_type=issue_type,
        dangerous_interpretation=dangerous,
        canonical_correction=correction,
        related_invariant_ids=tuple(invariants),
        source_refs=tuple(source_refs),
        forensic_refs=tuple(forensic_refs),
        notes=notes,
    )


def ensure_prerequisites() -> dict[str, int]:
    required = {
        "requirement_registry": REQUIREMENT_REGISTRY_PATH,
        "summary_conflicts": SUMMARY_CONFLICTS_PATH,
        "scope_matrix": SCOPE_MATRIX_PATH,
        "persona_catalog": PERSONA_CATALOG_PATH,
        "route_family_inventory": ROUTE_FAMILY_PATH,
        "request_lineage_model": REQUEST_LINEAGE_PATH,
        "object_catalog": OBJECT_CATALOG_PATH,
    }
    missing = [name for name, path in required.items() if not path.exists()]
    if missing:
        gap_rows = [
            {
                "issue_id": f"PREREQUISITE_GAP_{token(name)}",
                "missing_path": str(required[name]),
            }
            for name in missing
        ]
        raise SystemExit(json.dumps({"prerequisite_gaps": gap_rows}, indent=2))
    return {
        "requirement_registry_rows": count_jsonl(REQUIREMENT_REGISTRY_PATH),
        "summary_conflict_rows": len(load_json(SUMMARY_CONFLICTS_PATH)["rows"]),
        "scope_matrix_rows": len(load_json(SCOPE_MATRIX_PATH)["rows"]),
        "persona_rows": len(load_json(PERSONA_CATALOG_PATH)["personas"]),
        "route_family_rows": len(load_csv(ROUTE_FAMILY_PATH)),
        "lineage_stage_rows": len(load_json(REQUEST_LINEAGE_PATH)["lineage_stages"]),
        "object_rows": len(load_json(OBJECT_CATALOG_PATH)["objects"]),
    }


def object_lookup() -> dict[str, dict[str, Any]]:
    catalog = load_json(OBJECT_CATALOG_PATH)
    return {row["canonical_name"]: row for row in catalog["objects"]}


def lineage_axes() -> dict[str, list[str]]:
    payload = load_json(REQUEST_LINEAGE_PATH)
    return {row["governing_object"]: row["allowed_values"] for row in payload["state_axes"]}


def serialize_state(state: StateNode) -> dict[str, Any]:
    return asdict(state)


def serialize_transition(transition: TransitionSpec) -> dict[str, Any]:
    payload = asdict(transition)
    payload["guards"] = list(transition.guards)
    payload["authoritative_proofs"] = list(transition.authoritative_proofs)
    payload["related_objects"] = list(transition.related_objects)
    payload["closure_blocker_interactions"] = list(transition.closure_blocker_interactions)
    payload["source_refs"] = list(transition.source_refs)
    return payload


def serialize_illegal_transition(issue: IllegalTransitionSpec) -> dict[str, Any]:
    payload = asdict(issue)
    payload["related_invariant_ids"] = list(issue.related_invariant_ids)
    payload["source_refs"] = list(issue.source_refs)
    payload["forensic_refs"] = list(issue.forensic_refs)
    return payload


def serialize_machine(machine: MachineSpec, lookup: dict[str, dict[str, Any]]) -> dict[str, Any]:
    object_row = lookup[machine.owning_object_name]
    transitions = [serialize_transition(row) for row in machine.legal_transitions]
    illegal_rows = [serialize_illegal_transition(row) for row in machine.illegal_transitions]
    guards = sorted({guard for row in machine.legal_transitions for guard in row.guards})
    proofs = sorted({proof for row in machine.legal_transitions for proof in row.authoritative_proofs})
    related_objects = sorted({name for row in machine.legal_transitions for name in row.related_objects})
    blockers = sorted({blocker for row in machine.legal_transitions for blocker in row.closure_blocker_interactions})
    degraded_states = sorted(
        {
            state.value
            for state in machine.states
            if state.classification in {"degraded", "recovery", "supersession"}
        }
        | {row.degraded_posture for row in machine.legal_transitions if row.degraded_posture}
    )
    return {
        "machine_id": machine.machine_id,
        "canonical_name": machine.canonical_name,
        "owning_object_id": object_row["object_id"],
        "owning_object_name": machine.owning_object_name,
        "state_axis_type": machine.state_axis_type,
        "machine_family": machine.machine_family,
        "bounded_context": object_row["bounded_context"],
        "phase_tags": list(machine.phase_tags),
        "source_file": machine.source_file,
        "source_heading_or_block": machine.source_heading_or_block,
        "supporting_source_refs": list(machine.supporting_source_refs),
        "states": [serialize_state(state) for state in machine.states],
        "initial_state": machine.initial_state,
        "terminal_states": list(machine.terminal_states),
        "supersession_states": list(machine.supersession_states),
        "legal_transitions": transitions,
        "illegal_transitions": illegal_rows,
        "transition_triggers": [row["trigger"] for row in transitions],
        "required_guards": guards,
        "required_authoritative_proofs": proofs,
        "required_related_objects": related_objects,
        "degraded_or_recovery_states": degraded_states,
        "closure_blocker_interactions": blockers,
        "whether_transition_is_coordinator_owned": machine.whether_transition_is_coordinator_owned,
        "related_machine_ids": list(machine.related_machine_ids),
        "notes": machine.notes,
    }


def build_machine_specs() -> list[MachineSpec]:
    axes = lineage_axes()
    assert axes["SubmissionEnvelope.state"] == [
        "draft",
        "evidence_pending",
        "ready_to_promote",
        "promoted",
        "abandoned",
        "expired",
    ]
    assert axes["Request.workflowState"] == [
        "submitted",
        "intake_normalized",
        "triage_ready",
        "triage_active",
        "handoff_active",
        "outcome_recorded",
        "closed",
    ]
    assert axes["Request.safetyState"] == [
        "not_screened",
        "screen_clear",
        "residual_risk_flagged",
        "urgent_diversion_required",
        "urgent_diverted",
    ]
    assert axes["Request.identityState"] == [
        "anonymous",
        "partial_match",
        "matched",
        "claimed",
    ]

    phase0_refs = [
        "phase-0-the-foundation-protocol.md",
        "forensic-audit-findings.md",
    ]
    machines: list[MachineSpec] = [
        MachineSpec(
            machine_id="SM_SUBMISSION_ENVELOPE_STATE",
            canonical_name="SubmissionEnvelope.state",
            owning_object_name="SubmissionEnvelope",
            state_axis_type="lifecycle",
            machine_family="canonical_shared_control",
            phase_tags=("phase_0_foundation",),
            source_file="phase-0-the-foundation-protocol.md",
            source_heading_or_block="#### 1.1 SubmissionEnvelope",
            supporting_source_refs=(
                "blueprint-init.md#3 The canonical request model",
                "forensic-audit-findings.md#Finding 09 - Upload and audio quarantine rules were absent",
            ),
            whether_transition_is_coordinator_owned=False,
            states=(
                s("draft", lane=0, order=0, description="Pre-submit capture exists only on the envelope."),
                s("evidence_pending", lane=0, order=1, description="Evidence exists but is not yet promotable."),
                s("ready_to_promote", lane=0, order=2, description="Promotion checks passed."),
                s("promoted", lane=0, order=3, description="Governed promotion minted the Request.", classification="terminal"),
                s("abandoned", lane=1, order=1, description="Capture was intentionally abandoned.", classification="terminal"),
                s("expired", lane=1, order=2, description="Continuation window expired.", classification="terminal"),
            ),
            initial_state="draft",
            terminal_states=("promoted", "abandoned", "expired"),
            supersession_states=(),
            legal_transitions=(
                tr(
                    "SM_SUBMISSION_ENVELOPE_STATE",
                    "draft",
                    "evidence_pending",
                    trigger="Capture bundle or attachments persist on the pre-submit lineage.",
                    guards=["SubmissionIngressRecord exists", "Envelope remains the only pre-submit container"],
                    proofs=["SubmissionIngressRecord", "EvidenceCaptureBundle"],
                    related_objects=["SubmissionIngressRecord", "EvidenceCaptureBundle"],
                    source_refs=[
                        "phase-0-the-foundation-protocol.md#1.1 SubmissionEnvelope",
                        "forensic-audit-findings.md#Finding 09 - Upload and audio quarantine rules were absent",
                    ],
                ),
                tr(
                    "SM_SUBMISSION_ENVELOPE_STATE",
                    "evidence_pending",
                    "ready_to_promote",
                    trigger="Readiness checks complete for promotion-safe submission.",
                    guards=["Evidence readiness is promotable", "No fallback review is open on the same envelope"],
                    proofs=["SubmissionPromotionReadinessCheck", "EvidenceClassificationDecision"],
                    related_objects=["TelephonyEvidenceReadinessAssessment", "FallbackReviewCase"],
                    degraded_posture="submitted_degraded",
                    blockers=["Fallback review stays closure-blocking until recovered"],
                    source_refs=phase0_refs,
                ),
                tr(
                    "SM_SUBMISSION_ENVELOPE_STATE",
                    "ready_to_promote",
                    "promoted",
                    trigger="Governed submit promotes the envelope into one Request.",
                    guards=["Promotion command targets the current envelope version", "No quarantine or safety blocker remains"],
                    proofs=["SubmissionPromotionRecord", "CommandSettlementRecord(authoritativeOutcomeState = settled)"],
                    related_objects=["CommandSettlementRecord", "SubmissionPromotionRecord", "Request"],
                    source_refs=[
                        "phase-0-the-foundation-protocol.md#4 Canonical ingest and request promotion",
                        "phase-0-the-foundation-protocol.md#1.1 SubmissionEnvelope",
                    ],
                ),
                tr(
                    "SM_SUBMISSION_ENVELOPE_STATE",
                    "draft",
                    "abandoned",
                    trigger="User or support abandons pre-submit capture.",
                    guards=["No governed submit has been accepted"],
                    proofs=["SubmissionAbandonmentRecord"],
                    related_objects=["SubmissionEnvelope"],
                    source_refs=phase0_refs,
                ),
                tr(
                    "SM_SUBMISSION_ENVELOPE_STATE",
                    "evidence_pending",
                    "expired",
                    trigger="Continuation or draft TTL expires before promotion.",
                    guards=["Continuation grant and draft window are no longer valid"],
                    proofs=["AccessGrantSupersessionRecord", "DraftExpiryRecord"],
                    related_objects=["AccessGrant"],
                    degraded_posture="draft_recoverable",
                    source_refs=phase0_refs,
                ),
            ),
            illegal_transitions=(
                illegal(
                    "SM_SUBMISSION_ENVELOPE_STATE",
                    "draft",
                    "promoted",
                    issue_type="missing_readiness_and_governed_submit",
                    dangerous="A runtime could mint a Request from incomplete or quarantined draft data.",
                    correction="Promote only from ready_to_promote after explicit readiness proof and settled promotion.",
                    invariants=["INV_NO_BUSINESS_SUCCESS_FROM_TRANSPORT", "INV_EVIDENCE_ASSIMILATION_AND_RESAFETY"],
                    source_refs=[
                        "phase-0-the-foundation-protocol.md#1.1 SubmissionEnvelope",
                        "phase-0-the-foundation-protocol.md#4 Canonical ingest and request promotion",
                    ],
                    forensic_refs=("forensic-audit-findings.md#Finding 09",),
                ),
            ),
            related_machine_ids=("SM_REQUEST_WORKFLOW_STATE", "SM_FALLBACK_REVIEW_CASE"),
            notes="Draft is illegal on Request. All pre-submit continuity remains on SubmissionEnvelope until governed promotion succeeds.",
        ),
        MachineSpec(
            machine_id="SM_REQUEST_WORKFLOW_STATE",
            canonical_name="Request.workflowState",
            owning_object_name="Request",
            state_axis_type="workflow",
            machine_family="canonical_shared_control",
            phase_tags=("phase_0_foundation", "phase_3_human_checkpoint", "phase_4_booking_engine", "phase_5_network_horizon", "phase_6_pharmacy_loop"),
            source_file="phase-0-the-foundation-protocol.md",
            source_heading_or_block="#### 1.3 Request",
            supporting_source_refs=(
                "forensic-audit-findings.md#Finding 48 - Canonical state contract diverged between the kernel summary and the concrete Request schema",
                "forensic-audit-findings.md#Finding 54 - Request.workflowState incorrectly mixed workflow milestones with reconciliation states",
                "forensic-audit-findings.md#Finding 74 - Phase 4 let booking-domain logic write canonical request state directly on success",
                "forensic-audit-findings.md#Finding 75 - Phase 3 let triage-domain logic write canonical request state directly",
                "forensic-audit-findings.md#Finding 76 - Phase 5 let hub-domain logic write canonical request state directly on booked and return paths",
                "forensic-audit-findings.md#Finding 77 - Phase 6 let pharmacy-domain logic write canonical request state directly on resolve and reopen paths",
            ),
            whether_transition_is_coordinator_owned=True,
            states=(
                s("submitted", lane=0, order=0),
                s("intake_normalized", lane=0, order=1),
                s("triage_ready", lane=0, order=2),
                s("triage_active", lane=0, order=3),
                s("handoff_active", lane=0, order=4),
                s("outcome_recorded", lane=0, order=5),
                s("closed", lane=0, order=6, classification="terminal"),
            ),
            initial_state="submitted",
            terminal_states=("closed",),
            supersession_states=(),
            legal_transitions=(
                tr(
                    "SM_REQUEST_WORKFLOW_STATE",
                    "submitted",
                    "intake_normalized",
                    trigger="Promotion survives normalization and canonical ingest settlement.",
                    guards=["Submission promotion is settled", "Current evidence snapshot is persisted"],
                    proofs=["SubmissionPromotionRecord", "NormalizedSubmission", "CommandSettlementRecord(authoritativeOutcomeState = settled)"],
                    related_objects=["SubmissionEnvelope", "CommandSettlementRecord"],
                    coordinator_owned=True,
                    source_refs=phase0_refs,
                ),
                tr(
                    "SM_REQUEST_WORKFLOW_STATE",
                    "intake_normalized",
                    "triage_ready",
                    trigger="Safety and identity axes settle enough for review queue admission.",
                    guards=["SafetyState is not urgent_diversion_required", "Queue entry contract is computed"],
                    proofs=["SafetyDecisionRecord", "QueueAdmissionRecord"],
                    related_objects=["TriageTask", "SafetyDecisionRecord"],
                    coordinator_owned=True,
                    source_refs=phase0_refs,
                ),
                tr(
                    "SM_REQUEST_WORKFLOW_STATE",
                    "triage_ready",
                    "triage_active",
                    trigger="Active review or more-info/approval work is acknowledged on the lineage.",
                    guards=["A triage-side lease is active", "Current DecisionEpoch or review context is live"],
                    proofs=["RequestLifecycleLease", "TriageLeaseSignal"],
                    related_objects=["TriageTask", "RequestLifecycleLease", "DecisionEpoch"],
                    coordinator_owned=True,
                    blockers=["Duplicate review, more-info, approval, and identity repair remain orthogonal blockers"],
                    source_refs=[
                        "phase-0-the-foundation-protocol.md#Canonical request model",
                        "phase-3-the-human-checkpoint.md#3A Triage contract and workspace state model",
                    ],
                ),
                tr(
                    "SM_REQUEST_WORKFLOW_STATE",
                    "triage_active",
                    "handoff_active",
                    trigger="A downstream child case is durably acknowledged on the same RequestLineage.",
                    guards=["Current DecisionEpoch is unsuperseded", "LineageCaseLink(caseFamily) is acknowledged"],
                    proofs=["LineageCaseLink", "BookingOutcomeMilestone | HubCoordinationMilestone | PharmacyOutcomeMilestone"],
                    related_objects=["LineageCaseLink", "BookingCase", "HubCoordinationCase", "PharmacyCase"],
                    coordinator_owned=True,
                    blockers=["External confirmation gates and downstream blockers stay on the lineage"],
                    source_refs=[
                        "phase-0-the-foundation-protocol.md#1.1B RequestLineage",
                        "phase-3-the-human-checkpoint.md#3G Direct resolution, downstream handoff seeds, and reopen mechanics",
                    ],
                ),
                tr(
                    "SM_REQUEST_WORKFLOW_STATE",
                    "triage_active",
                    "outcome_recorded",
                    trigger="Direct advice, direct completion, or direct endpoint outcome settles.",
                    guards=["Endpoint settlement is authoritative", "No urgent preemption is pending"],
                    proofs=["EndpointDecisionSettlement(authoritativeOutcomeState = settled)", "DirectOutcomeMilestone"],
                    related_objects=["EndpointDecisionSettlement", "CommandSettlementRecord"],
                    coordinator_owned=True,
                    blockers=["Residual blockers remain orthogonal to this milestone"],
                    source_refs=[
                        "phase-3-the-human-checkpoint.md#3G Direct resolution, downstream handoff seeds, and reopen mechanics",
                        "phase-0-the-foundation-protocol.md#Canonical request model",
                    ],
                ),
                tr(
                    "SM_REQUEST_WORKFLOW_STATE",
                    "handoff_active",
                    "outcome_recorded",
                    trigger="Child-domain outcome milestone settles after local truth is reconciled.",
                    guards=["Downstream case-local truth is authoritative", "Any confirmation gate needed for the branch is satisfied or downgraded under policy"],
                    proofs=["BookingOutcomeMilestone | HubCoordinationMilestone | PharmacyOutcomeMilestone", "ExternalConfirmationGate or branch-local closure truth"],
                    related_objects=["BookingCase", "HubCoordinationCase", "PharmacyCase", "ExternalConfirmationGate"],
                    coordinator_owned=True,
                    blockers=["Ambiguous booking, hub, or pharmacy truth keeps closure blocked until cleared"],
                    source_refs=[
                        "phase-4-the-booking-engine.md#4A Booking contract, case model, and state machine",
                        "phase-5-the-network-horizon.md#5A Network coordination contract, case model, and state machine",
                        "phase-6-the-pharmacy-loop.md#6A Pharmacy contract, case model, and state machine",
                    ],
                ),
                tr(
                    "SM_REQUEST_WORKFLOW_STATE",
                    "outcome_recorded",
                    "closed",
                    trigger="LifecycleCoordinator evaluates a zero-blocker closure on the current lineage epoch.",
                    guards=["Coordinator-materialized blocker sets are empty", "No active lease, repair, duplicate, fallback, confirmation, reachability, or grant blocker remains"],
                    proofs=["RequestClosureRecord(decision = close)", "Request.closure_blockers.changed -> empty set"],
                    related_objects=["RequestClosureRecord", "DuplicateCluster", "FallbackReviewCase", "ExternalConfirmationGate"],
                    degraded_posture="defer",
                    blockers=["Closure remains deferred while any blocker ref remains non-empty"],
                    coordinator_owned=True,
                    source_refs=[
                        "phase-0-the-foundation-protocol.md#1.12 RequestClosureRecord",
                        "forensic-audit-findings.md#Finding 71 - Closure evaluation did not explicitly assert empty coordinator-materialized blocker sets",
                    ],
                ),
            ),
            illegal_transitions=(
                illegal(
                    "SM_REQUEST_WORKFLOW_STATE",
                    "triage_active",
                    "confirmation_pending",
                    issue_type="overloaded_canonical_state",
                    dangerous="Booking or pharmacy ambiguity could be copied into Request.workflowState and mask the milestone-only contract.",
                    correction="Keep confirmation ambiguity on ExternalConfirmationGate or case-local state; canonical workflow stays milestone-only.",
                    invariants=["INV_REQ_WORKFLOW_MILESTONES_ONLY", "INV_CONFIRMATION_AMBIGUITY_STAYS_EXPLICIT"],
                    source_refs=[
                        "phase-0-the-foundation-protocol.md#1.3 Request",
                        "forensic-audit-findings.md#Finding 54 - Request.workflowState incorrectly mixed workflow milestones with reconciliation states",
                    ],
                    forensic_refs=("forensic-audit-findings.md#Finding 54", "forensic-audit-findings.md#Finding 73", "forensic-audit-findings.md#Finding 78"),
                ),
                illegal(
                    "SM_REQUEST_WORKFLOW_STATE",
                    "triage_active",
                    "closed",
                    issue_type="closure_without_coordinator_and_blocker_evaluation",
                    dangerous="A child domain or UI could close the Request while blockers are still open.",
                    correction="Only LifecycleCoordinator may derive closed after a persisted RequestClosureRecord with an empty blocker set.",
                    invariants=["INV_COORDINATOR_OWNS_CANONICAL_MILESTONES", "INV_CLOSURE_REQUIRES_EMPTY_BLOCKERS"],
                    source_refs=[
                        "phase-0-the-foundation-protocol.md#1.12 RequestClosureRecord",
                        "phase-3-the-human-checkpoint.md#3A Triage contract and workspace state model",
                    ],
                    forensic_refs=("forensic-audit-findings.md#Finding 56", "forensic-audit-findings.md#Finding 71"),
                ),
            ),
            related_machine_ids=(
                "SM_REQUEST_CLOSURE_DECISION",
                "SM_TRIAGE_TASK_STATUS",
                "SM_BOOKING_CASE_STATUS",
                "SM_HUB_COORDINATION_CASE_STATUS",
                "SM_PHARMACY_CASE_STATUS",
            ),
            notes="Request.workflowState contains milestones only. Blockers, confirmation ambiguity, repair posture, and case-local review stay on orthogonal objects.",
        ),
        MachineSpec(
            machine_id="SM_REQUEST_SAFETY_STATE",
            canonical_name="Request.safetyState",
            owning_object_name="Request",
            state_axis_type="safety",
            machine_family="canonical_shared_control",
            phase_tags=("phase_0_foundation", "phase_1_red_flag_gate", "phase_3_human_checkpoint", "phase_6_pharmacy_loop"),
            source_file="phase-0-the-foundation-protocol.md",
            source_heading_or_block="#### 1.3 Request",
            supporting_source_refs=(
                "phase-1-the-red-flag-gate.md",
                "forensic-audit-findings.md#Finding 10 - Safety model was only binary urgent or not urgent",
                "forensic-audit-findings.md#Finding 11 - Urgent diversion required and completed were collapsed",
                "forensic-audit-findings.md#Finding 13 - Materially new evidence bypassed canonical re-safety",
            ),
            whether_transition_is_coordinator_owned=False,
            states=(
                s("not_screened", lane=0, order=0),
                s("screen_clear", lane=0, order=1),
                s("residual_risk_flagged", lane=0, order=2),
                s("urgent_diversion_required", lane=1, order=2, classification="degraded"),
                s("urgent_diverted", lane=1, order=3, classification="terminal"),
            ),
            initial_state="not_screened",
            terminal_states=("urgent_diverted",),
            supersession_states=(),
            legal_transitions=(
                tr(
                    "SM_REQUEST_SAFETY_STATE",
                    "not_screened",
                    "screen_clear",
                    trigger="Initial or resumed safety run clears urgent and residual risk.",
                    guards=["Composite evidence snapshot is settled", "No active safety preemption remains"],
                    proofs=["SafetyDecisionRecord(requestedSafetyState = screen_clear)"],
                    related_objects=["SafetyDecisionRecord", "EvidenceSnapshot"],
                    source_refs=phase0_refs,
                ),
                tr(
                    "SM_REQUEST_SAFETY_STATE",
                    "not_screened",
                    "residual_risk_flagged",
                    trigger="Safety run detects residual but not urgent risk.",
                    guards=["Canonical safety rules run against the current snapshot"],
                    proofs=["SafetyDecisionRecord(requestedSafetyState = residual_risk_flagged)"],
                    related_objects=["SafetyDecisionRecord"],
                    source_refs=phase0_refs,
                ),
                tr(
                    "SM_REQUEST_SAFETY_STATE",
                    "not_screened",
                    "urgent_diversion_required",
                    trigger="Initial safety run requires urgent diversion.",
                    guards=["Urgent path is materially required and not yet durably issued"],
                    proofs=["SafetyDecisionRecord(requestedSafetyState = urgent_diversion_required)"],
                    related_objects=["UrgentDiversionSettlement", "SafetyDecisionRecord"],
                    degraded_posture="urgent_required",
                    blockers=["Closure blocks until urgent issuance is durably settled"],
                    source_refs=[
                        "phase-1-the-red-flag-gate.md",
                        "forensic-audit-findings.md#Finding 11 - Urgent diversion required and completed were collapsed",
                    ],
                ),
                tr(
                    "SM_REQUEST_SAFETY_STATE",
                    "residual_risk_flagged",
                    "urgent_diversion_required",
                    trigger="Materially new evidence escalates the case into urgent handling.",
                    guards=["Evidence assimilation and re-safety completed on the latest snapshot"],
                    proofs=["EvidenceAssimilationRecord", "SafetyDecisionRecord(requestedSafetyState = urgent_diversion_required)"],
                    related_objects=["EvidenceAssimilationRecord", "MaterialDeltaAssessment", "SafetyPreemptionRecord"],
                    degraded_posture="urgent_required",
                    source_refs=[
                        "phase-3-the-human-checkpoint.md#3D More-info loop, patient response threading, and re-safety",
                        "forensic-audit-findings.md#Finding 13 - Materially new evidence bypassed canonical re-safety",
                    ],
                ),
                tr(
                    "SM_REQUEST_SAFETY_STATE",
                    "screen_clear",
                    "residual_risk_flagged",
                    trigger="Material evidence arrives and re-safety no longer clears completely.",
                    guards=["MaterialDeltaAssessment requires re-safety"],
                    proofs=["EvidenceAssimilationRecord", "SafetyDecisionRecord(requestedSafetyState = residual_risk_flagged)"],
                    related_objects=["EvidenceAssimilationRecord", "MaterialDeltaAssessment"],
                    source_refs=[
                        "phase-3-the-human-checkpoint.md#3D More-info loop, patient response threading, and re-safety",
                    ],
                ),
                tr(
                    "SM_REQUEST_SAFETY_STATE",
                    "screen_clear",
                    "urgent_diversion_required",
                    trigger="Later evidence or callback outcome proves urgent routing is now required.",
                    guards=["SafetyOrchestrator preempts routine flow on the current snapshot"],
                    proofs=["SafetyPreemptionRecord", "SafetyDecisionRecord(requestedSafetyState = urgent_diversion_required)"],
                    related_objects=["SafetyPreemptionRecord", "SafetyDecisionRecord"],
                    degraded_posture="urgent_required",
                    source_refs=phase0_refs,
                ),
                tr(
                    "SM_REQUEST_SAFETY_STATE",
                    "urgent_diversion_required",
                    "urgent_diverted",
                    trigger="Urgent advice, escalation, or contact issuance is durably settled.",
                    guards=["Urgent issuance is no longer merely required", "Authoritative diversion proof binds to the same lineage"],
                    proofs=["UrgentDiversionSettlement"],
                    related_objects=["UrgentDiversionSettlement"],
                    source_refs=[
                        "phase-1-the-red-flag-gate.md",
                        "forensic-audit-findings.md#Finding 11 - Urgent diversion required and completed were collapsed",
                    ],
                ),
            ),
            illegal_transitions=(
                illegal(
                    "SM_REQUEST_SAFETY_STATE",
                    "urgent_diversion_required",
                    "screen_clear",
                    issue_type="urgent_without_diversion_settlement",
                    dangerous="An implementation could treat urgent requirement as if the urgent advice was already issued and let the case drift back to routine safety.",
                    correction="Keep urgent_diversion_required durable until UrgentDiversionSettlement proves issuance; only new evidence may change safety after that.",
                    invariants=["INV_URGENT_REQUIRED_NOT_DIVERTED"],
                    source_refs=[
                        "phase-0-the-foundation-protocol.md#1.3 Request",
                        "phase-1-the-red-flag-gate.md",
                    ],
                    forensic_refs=("forensic-audit-findings.md#Finding 11",),
                ),
            ),
            related_machine_ids=("SM_MORE_INFO_REPLY_WINDOW", "SM_CALLBACK_CASE_STATE", "SM_PHARMACY_CASE_STATUS"),
            notes="urgent_diversion_required and urgent_diverted are separate durable states. Material new evidence must route through evidence assimilation and re-safety.",
        ),
        MachineSpec(
            machine_id="SM_REQUEST_IDENTITY_STATE",
            canonical_name="Request.identityState",
            owning_object_name="Request",
            state_axis_type="identity",
            machine_family="canonical_shared_control",
            phase_tags=("phase_0_foundation", "phase_2_identity_and_echoes"),
            source_file="phase-0-the-foundation-protocol.md",
            source_heading_or_block="#### 1.3 Request",
            supporting_source_refs=(
                "forensic-audit-findings.md#Finding 50 - The concrete Request schema dropped identity-binding references and treated patientRef as unconditional",
                "forensic-audit-findings.md#Finding 69 - Wrong-patient correction rewrote canonical workflow state instead of attaching repair metadata",
            ),
            whether_transition_is_coordinator_owned=False,
            states=(
                s("anonymous", lane=0, order=0),
                s("partial_match", lane=0, order=1),
                s("matched", lane=0, order=2),
                s("claimed", lane=0, order=3, classification="terminal"),
            ),
            initial_state="anonymous",
            terminal_states=("claimed",),
            supersession_states=(),
            legal_transitions=(
                tr(
                    "SM_REQUEST_IDENTITY_STATE",
                    "anonymous",
                    "partial_match",
                    trigger="IdentityBinding finds candidate matches but not yet durable patient binding.",
                    guards=["IdentityBinding.bindingState is candidate or provisional_verified"],
                    proofs=["IdentityBinding", "CapabilityDecision"],
                    related_objects=["IdentityBinding"],
                    source_refs=phase0_refs,
                ),
                tr(
                    "SM_REQUEST_IDENTITY_STATE",
                    "partial_match",
                    "matched",
                    trigger="IdentityBinding verifies a patient but claim or writable authority is not yet complete.",
                    guards=["IdentityBinding.bindingState is verified_patient", "patientRef remains derived, not hand-written"],
                    proofs=["IdentityBinding(bindingState = verified_patient)"],
                    related_objects=["IdentityBinding"],
                    source_refs=[
                        "phase-0-the-foundation-protocol.md#1.4 IdentityBinding",
                        "forensic-audit-findings.md#Finding 50 - The concrete Request schema dropped identity-binding references and treated patientRef as unconditional",
                    ],
                ),
                tr(
                    "SM_REQUEST_IDENTITY_STATE",
                    "matched",
                    "claimed",
                    trigger="Claim or continuation redemption settles writable patient identity on the current lineage.",
                    guards=["Current Session and RouteIntentBinding are live", "No identity repair is active"],
                    proofs=["SessionEstablishmentDecision", "RouteIntentBinding", "IdentityBindingAuthority settlement"],
                    related_objects=["Session", "RouteIntentBinding", "IdentityBinding"],
                    source_refs=[
                        "phase-0-the-foundation-protocol.md#5.4 Claim, secure-link, and embedded access algorithm",
                        "phase-2-identity-and-echoes.md",
                    ],
                ),
            ),
            illegal_transitions=(
                illegal(
                    "SM_REQUEST_IDENTITY_STATE",
                    "anonymous",
                    "claimed",
                    issue_type="direct_patientref_write",
                    dangerous="Auth or support flows could stamp patientRef directly and bypass IdentityBinding governance.",
                    correction="patientRef remains nullable until IdentityBinding settles; claim requires verified binding plus current session and route tuple.",
                    invariants=["INV_PATIENTREF_DERIVES_FROM_BINDING", "INV_WRONG_PATIENT_IS_REPAIR_PATH"],
                    source_refs=[
                        "phase-0-the-foundation-protocol.md#1.4 IdentityBinding",
                        "phase-0-the-foundation-protocol.md#1.3 Request",
                    ],
                    forensic_refs=("forensic-audit-findings.md#Finding 50", "forensic-audit-findings.md#Finding 69"),
                ),
            ),
            related_machine_ids=("SM_IDENTITY_BINDING_STATE", "SM_EPISODE_STATE"),
            notes="Request.patientRef is nullable and derived from the latest verified IdentityBinding. Wrong-patient correction is handled by repair metadata, not by inventing new identity workflow states.",
        ),
        MachineSpec(
            machine_id="SM_EPISODE_STATE",
            canonical_name="Episode.state",
            owning_object_name="Episode",
            state_axis_type="lifecycle",
            machine_family="canonical_shared_control",
            phase_tags=("phase_0_foundation",),
            source_file="phase-0-the-foundation-protocol.md",
            source_heading_or_block="#### 1.2 Episode",
            supporting_source_refs=(
                "forensic-audit-findings.md#Finding 53 - Episode.state incorrectly mixed lifecycle with identity repair hold semantics",
            ),
            whether_transition_is_coordinator_owned=True,
            states=(
                s("open", lane=0, order=0),
                s("resolved", lane=0, order=1),
                s("archived", lane=0, order=2, classification="terminal"),
            ),
            initial_state="open",
            terminal_states=("archived",),
            supersession_states=(),
            legal_transitions=(
                tr(
                    "SM_EPISODE_STATE",
                    "open",
                    "resolved",
                    trigger="All related requests and branches satisfy closure policy.",
                    guards=["Every related RequestClosureRecord is close", "Episode-level blocker refs are empty"],
                    proofs=["EpisodeResolutionSettlement", "RequestClosureRecord(decision = close)"],
                    related_objects=["RequestClosureRecord", "Episode"],
                    blockers=["Identity repair, duplicate review, fallback review, and confirmation gates remain orthogonal blockers"],
                    coordinator_owned=True,
                    source_refs=[
                        "phase-0-the-foundation-protocol.md#1.2 Episode",
                        "phase-0-the-foundation-protocol.md#Closure evaluation",
                    ],
                ),
                tr(
                    "SM_EPISODE_STATE",
                    "resolved",
                    "archived",
                    trigger="Retention and lifecycle policy archives the already resolved episode.",
                    guards=["Resolution is durable", "Archive posture is legal for the episode scope"],
                    proofs=["EpisodeArchiveRecord", "DispositionEligibilityAssessment(eligibilityState = archive_only | delete_allowed)"],
                    related_objects=["DispositionEligibilityAssessment"],
                    coordinator_owned=True,
                    source_refs=[
                        "phase-0-the-foundation-protocol.md#1.2 Episode",
                        "phase-9-the-assurance-ledger.md#Records lifecycle, retention, legal hold, and deletion engine",
                    ],
                ),
            ),
            illegal_transitions=(
                illegal(
                    "SM_EPISODE_STATE",
                    "open",
                    "identity_hold",
                    issue_type="repair_state_overload",
                    dangerous="Identity repair would be flattened into the episode lifecycle and make a temporary privacy freeze look like a lifecycle stage.",
                    correction="Keep identity repair on IdentityRepairCase and Episode blocker refs; Episode.state remains open/resolved/archived.",
                    invariants=["INV_BLOCKERS_ORTHOGONAL", "INV_WRONG_PATIENT_IS_REPAIR_PATH"],
                    source_refs=[
                        "phase-0-the-foundation-protocol.md#1.2 Episode",
                        "phase-0-the-foundation-protocol.md#1.5 IdentityRepairCase",
                    ],
                    forensic_refs=("forensic-audit-findings.md#Finding 53", "forensic-audit-findings.md#Finding 69"),
                ),
            ),
            related_machine_ids=("SM_REQUEST_WORKFLOW_STATE", "SM_REQUEST_CLOSURE_DECISION", "SM_LEGAL_HOLD_STATE"),
            notes="Episode lifecycle stays minimal. Repair, duplicate, fallback, and confirmation burdens remain orthogonal to Episode.state.",
        ),
        MachineSpec(
            machine_id="SM_TELEPHONY_EVIDENCE_READINESS",
            canonical_name="TelephonyEvidenceReadinessAssessment.usabilityState",
            owning_object_name="TelephonyEvidenceReadinessAssessment",
            state_axis_type="gate",
            machine_family="canonical_shared_control",
            phase_tags=("phase_0_foundation", "phase_2_identity_and_echoes"),
            source_file="phase-0-the-foundation-protocol.md",
            source_heading_or_block="#### 1.3D TelephonyEvidenceReadinessAssessment",
            supporting_source_refs=(
                "forensic-audit-findings.md#Finding 08 - Telephony evidence-readiness gate was missing",
                "forensic-audit-findings.md#Finding 12 - No safe fallback when ingest or safety failed",
            ),
            whether_transition_is_coordinator_owned=False,
            states=(
                s("awaiting_recording", lane=0, order=0),
                s("awaiting_transcript", lane=0, order=1),
                s("awaiting_structured_capture", lane=0, order=2),
                s("urgent_live_only", lane=1, order=1, classification="degraded"),
                s("safety_usable", lane=0, order=3, classification="terminal"),
                s("manual_review_only", lane=1, order=2, classification="degraded"),
                s("unusable_terminal", lane=1, order=3, classification="terminal"),
            ),
            initial_state="awaiting_recording",
            terminal_states=("safety_usable", "unusable_terminal"),
            supersession_states=(),
            legal_transitions=(
                tr(
                    "SM_TELEPHONY_EVIDENCE_READINESS",
                    "awaiting_recording",
                    "awaiting_transcript",
                    trigger="Recording lands but transcript is still required.",
                    guards=["Recording availability is durable"],
                    proofs=["CallRecordingReceipt", "TelephonyEvidenceReadinessAssessment"],
                    related_objects=["CallSession"],
                    source_refs=[
                        "phase-0-the-foundation-protocol.md#1.3D TelephonyEvidenceReadinessAssessment",
                        "forensic-audit-findings.md#Finding 08 - Telephony evidence-readiness gate was missing",
                    ],
                ),
                tr(
                    "SM_TELEPHONY_EVIDENCE_READINESS",
                    "awaiting_transcript",
                    "awaiting_structured_capture",
                    trigger="Transcript lands but required keypad or structured capture is incomplete.",
                    guards=["Transcript sufficiency is settled", "Required structured capture remains incomplete"],
                    proofs=["TranscriptReadinessRecord", "StructuredCaptureAssessment"],
                    related_objects=["CallSession"],
                    source_refs=phase0_refs,
                ),
                tr(
                    "SM_TELEPHONY_EVIDENCE_READINESS",
                    "awaiting_recording",
                    "urgent_live_only",
                    trigger="Urgent live branch is the only safe path before routine evidence is promotable.",
                    guards=["Urgent-live assessment requires conservative diversion"],
                    proofs=["UrgentLiveAssessment"],
                    related_objects=["UrgentLiveAssessment"],
                    degraded_posture="urgent_live_only",
                    source_refs=[
                        "phase-0-the-foundation-protocol.md#1.3D TelephonyEvidenceReadinessAssessment",
                        "forensic-audit-findings.md#Finding 08 - Telephony evidence-readiness gate was missing",
                    ],
                ),
                tr(
                    "SM_TELEPHONY_EVIDENCE_READINESS",
                    "awaiting_structured_capture",
                    "safety_usable",
                    trigger="Recording, transcript, and structured capture together clear routine safety use.",
                    guards=["PromotionReadiness is ready_to_seed or ready_to_promote"],
                    proofs=["TelephonyEvidenceReadinessAssessment(usabilityState = safety_usable)"],
                    related_objects=["TelephonyContinuationEligibility", "SubmissionEnvelope"],
                    source_refs=phase0_refs,
                ),
                tr(
                    "SM_TELEPHONY_EVIDENCE_READINESS",
                    "urgent_live_only",
                    "manual_review_only",
                    trigger="Urgent live path ends without enough routine evidence for ordinary promotion.",
                    guards=["Routine evidence still fails safety-usable threshold"],
                    proofs=["TelephonyManualReviewDisposition(reviewState = open)"],
                    related_objects=["TelephonyManualReviewDisposition"],
                    degraded_posture="manual_review_only",
                    source_refs=[
                        "phase-0-the-foundation-protocol.md#1.3F TelephonyManualReviewDisposition",
                    ],
                ),
                tr(
                    "SM_TELEPHONY_EVIDENCE_READINESS",
                    "manual_review_only",
                    "safety_usable",
                    trigger="Manual review or transcription settles promotable evidence.",
                    guards=["Manual review disposition is settled"],
                    proofs=["TelephonyManualReviewDisposition(reviewState = settled)", "TelephonyEvidenceReadinessAssessment(usabilityState = safety_usable)"],
                    related_objects=["TelephonyManualReviewDisposition"],
                    source_refs=phase0_refs,
                ),
                tr(
                    "SM_TELEPHONY_EVIDENCE_READINESS",
                    "manual_review_only",
                    "unusable_terminal",
                    trigger="Manual review concludes the capture cannot safely become routine intake.",
                    guards=["No recoverable continuation remains"],
                    proofs=["TelephonyManualReviewDisposition(reviewMode = abandon)"],
                    related_objects=["TelephonyManualReviewDisposition"],
                    degraded_posture="under_manual_review",
                    source_refs=phase0_refs,
                ),
            ),
            illegal_transitions=(
                illegal(
                    "SM_TELEPHONY_EVIDENCE_READINESS",
                    "awaiting_recording",
                    "safety_usable",
                    issue_type="premature_readiness",
                    dangerous="Telephony flow could promote partially captured evidence into routine safety.",
                    correction="Only a settled readiness assessment may declare safety_usable after the required recording/transcript/structured capture conditions are satisfied.",
                    invariants=["INV_EVIDENCE_ASSIMILATION_AND_RESAFETY"],
                    source_refs=[
                        "phase-0-the-foundation-protocol.md#1.3D TelephonyEvidenceReadinessAssessment",
                    ],
                    forensic_refs=("forensic-audit-findings.md#Finding 08",),
                ),
            ),
            related_machine_ids=("SM_TELEPHONY_CONTINUATION_ELIGIBILITY", "SM_SUBMISSION_ENVELOPE_STATE"),
            notes="Telephony evidence readiness is the only authority that may mark phone evidence urgent-live-only, safety-usable, manual-review-only, or terminally unusable.",
        ),
        MachineSpec(
            machine_id="SM_TELEPHONY_CONTINUATION_ELIGIBILITY",
            canonical_name="TelephonyContinuationEligibility.eligibilityState",
            owning_object_name="TelephonyContinuationEligibility",
            state_axis_type="gate",
            machine_family="canonical_shared_control",
            phase_tags=("phase_0_foundation", "phase_2_identity_and_echoes"),
            source_file="phase-0-the-foundation-protocol.md",
            source_heading_or_block="#### 1.3E TelephonyContinuationEligibility",
            supporting_source_refs=(
                "forensic-audit-findings.md#Finding 08 - Telephony evidence-readiness gate was missing",
            ),
            whether_transition_is_coordinator_owned=False,
            states=(
                s("not_eligible", lane=0, order=0),
                s("eligible_seeded", lane=0, order=1),
                s("eligible_challenge", lane=0, order=2),
                s("manual_only", lane=1, order=2, classification="degraded"),
            ),
            initial_state="not_eligible",
            terminal_states=("eligible_seeded", "eligible_challenge", "manual_only"),
            supersession_states=(),
            legal_transitions=(
                tr(
                    "SM_TELEPHONY_CONTINUATION_ELIGIBILITY",
                    "not_eligible",
                    "eligible_seeded",
                    trigger="Readiness and identity confidence allow seeded continuation.",
                    guards=["Evidence readiness is safety_usable or ready_to_seed", "Lineage scope is proven"],
                    proofs=["TelephonyContinuationEligibility(eligibilityState = eligible_seeded)", "AccessGrant(grantFamily = continuation_seeded_verified)"],
                    related_objects=["TelephonyEvidenceReadinessAssessment", "AccessGrant"],
                    source_refs=phase0_refs,
                ),
                tr(
                    "SM_TELEPHONY_CONTINUATION_ELIGIBILITY",
                    "not_eligible",
                    "eligible_challenge",
                    trigger="Continuation is allowed only after a challenge rather than seeded verification.",
                    guards=["Identity or destination confidence is insufficient for seeded continuation"],
                    proofs=["TelephonyContinuationEligibility(eligibilityState = eligible_challenge)", "AccessGrant(grantFamily = continuation_challenge)"],
                    related_objects=["AccessGrant"],
                    source_refs=phase0_refs,
                ),
                tr(
                    "SM_TELEPHONY_CONTINUATION_ELIGIBILITY",
                    "not_eligible",
                    "manual_only",
                    trigger="Continuation cannot be safely granted on the current evidence.",
                    guards=["GrantFamilyRecommendation = manual_only"],
                    proofs=["TelephonyContinuationEligibility(eligibilityState = manual_only)"],
                    related_objects=["TelephonyEvidenceReadinessAssessment"],
                    degraded_posture="manual_only",
                    source_refs=phase0_refs,
                ),
            ),
            illegal_transitions=(
                illegal(
                    "SM_TELEPHONY_CONTINUATION_ELIGIBILITY",
                    "manual_only",
                    "eligible_seeded",
                    issue_type="manual_override_widening_scope",
                    dangerous="A telephony operator could bypass the continuity proof boundary and issue a seeded continuation anyway.",
                    correction="Continuation eligibility may narrow or force manual handling, but it may not bypass AccessGrantService or widen continuity scope outside the proven lineage.",
                    invariants=["INV_MUTATION_REQUIRES_CURRENT_ROUTE_TUPLE"],
                    source_refs=[
                        "phase-0-the-foundation-protocol.md#1.3E TelephonyContinuationEligibility",
                    ],
                    forensic_refs=("forensic-audit-findings.md#Finding 08",),
                ),
            ),
            related_machine_ids=("SM_TELEPHONY_EVIDENCE_READINESS", "SM_ACCESS_GRANT_LIFECYCLE"),
            notes="Seeded continuation, challenge continuation, and manual-only disposition remain distinct and are derived from the settled readiness assessment.",
        ),
        MachineSpec(
            machine_id="SM_IDENTITY_BINDING_STATE",
            canonical_name="IdentityBinding.bindingState",
            owning_object_name="IdentityBinding",
            state_axis_type="identity",
            machine_family="canonical_shared_control",
            phase_tags=("phase_0_foundation", "phase_2_identity_and_echoes"),
            source_file="phase-0-the-foundation-protocol.md",
            source_heading_or_block="#### 1.4 IdentityBinding",
            supporting_source_refs=(),
            whether_transition_is_coordinator_owned=False,
            states=(
                s("candidate", lane=0, order=0),
                s("provisional_verified", lane=0, order=1),
                s("ambiguous", lane=1, order=1, classification="degraded"),
                s("verified_patient", lane=0, order=2),
                s("correction_pending", lane=1, order=2, classification="degraded"),
                s("corrected", lane=0, order=3),
                s("revoked", lane=1, order=3, classification="terminal"),
            ),
            initial_state="candidate",
            terminal_states=("revoked",),
            supersession_states=(),
            legal_transitions=(
                tr(
                    "SM_IDENTITY_BINDING_STATE",
                    "candidate",
                    "provisional_verified",
                    trigger="Evidence is strong enough for controlled progress but not yet durable external consequence.",
                    guards=["Link probability lower bounds meet provisional policy"],
                    proofs=["IdentityBinding(bindingState = provisional_verified)"],
                    related_objects=["IdentityBinding"],
                    source_refs=phase0_refs,
                ),
                tr(
                    "SM_IDENTITY_BINDING_STATE",
                    "candidate",
                    "ambiguous",
                    trigger="Competing identity candidates remain unresolved.",
                    guards=["Runner-up probability stays within ambiguity policy"],
                    proofs=["IdentityBinding(bindingState = ambiguous)"],
                    related_objects=["IdentityRepairCase"],
                    degraded_posture="identity_hold",
                    source_refs=phase0_refs,
                ),
                tr(
                    "SM_IDENTITY_BINDING_STATE",
                    "provisional_verified",
                    "verified_patient",
                    trigger="Binding is durably verified to one patient.",
                    guards=["Subject proof and match evidence satisfy verified threshold"],
                    proofs=["IdentityBinding(bindingState = verified_patient)"],
                    related_objects=["IdentityBinding"],
                    source_refs=phase0_refs,
                ),
                tr(
                    "SM_IDENTITY_BINDING_STATE",
                    "verified_patient",
                    "correction_pending",
                    trigger="Wrong-patient correction or identity challenge freezes the active binding.",
                    guards=["IdentityRepairCase is opened"],
                    proofs=["IdentityRepairCase", "IdentityRepairFreezeRecord"],
                    related_objects=["IdentityRepairCase"],
                    degraded_posture="identity_hold",
                    blockers=["Identity repair blocks closure and writable calmness"],
                    source_refs=[
                        "phase-0-the-foundation-protocol.md#1.5 IdentityRepairCase",
                        "forensic-audit-findings.md#Finding 69 - Wrong-patient correction rewrote canonical workflow state instead of attaching repair metadata",
                    ],
                ),
                tr(
                    "SM_IDENTITY_BINDING_STATE",
                    "correction_pending",
                    "corrected",
                    trigger="IdentityBindingAuthority settles corrected binding under release settlement.",
                    guards=["Identity repair release settlement is current"],
                    proofs=["IdentityRepairReleaseSettlement", "IdentityBinding(bindingState = corrected)"],
                    related_objects=["IdentityRepairReleaseSettlement"],
                    source_refs=[
                        "phase-0-the-foundation-protocol.md#1.5C IdentityRepairReleaseSettlement",
                    ],
                ),
                tr(
                    "SM_IDENTITY_BINDING_STATE",
                    "corrected",
                    "revoked",
                    trigger="The corrected binding is later superseded or revoked.",
                    guards=["A newer settled binding exists or revocation policy applies"],
                    proofs=["IdentityBinding(bindingState = revoked)"],
                    related_objects=["IdentityBinding"],
                    source_refs=phase0_refs,
                ),
            ),
            illegal_transitions=(
                illegal(
                    "SM_IDENTITY_BINDING_STATE",
                    "verified_patient",
                    "revoked",
                    issue_type="correction_without_repair_branch",
                    dangerous="A system could revoke patient binding without opening repair and freeze the lineage invisibly.",
                    correction="Wrong-patient correction must pass through correction_pending and repair/branch disposition objects before release or revocation settles.",
                    invariants=["INV_WRONG_PATIENT_IS_REPAIR_PATH", "INV_PATIENTREF_DERIVES_FROM_BINDING"],
                    source_refs=[
                        "phase-0-the-foundation-protocol.md#1.5 IdentityRepairCase",
                    ],
                    forensic_refs=("forensic-audit-findings.md#Finding 69",),
                ),
            ),
            related_machine_ids=("SM_REQUEST_IDENTITY_STATE", "SM_ACCESS_GRANT_LIFECYCLE"),
            notes="IdentityBinding is the only authority for patient binding changes. Request and Episode derive patientRef from the latest settled binding.",
        ),
        MachineSpec(
            machine_id="SM_SESSION_STATE",
            canonical_name="Session.sessionState",
            owning_object_name="Session",
            state_axis_type="identity",
            machine_family="canonical_shared_control",
            phase_tags=("phase_0_foundation", "phase_2_identity_and_echoes"),
            source_file="phase-0-the-foundation-protocol.md",
            source_heading_or_block="#### 1.4C Session",
            supporting_source_refs=(),
            whether_transition_is_coordinator_owned=False,
            states=(
                s("establishing", lane=0, order=0),
                s("active", lane=0, order=1),
                s("step_up_required", lane=1, order=1, classification="degraded"),
                s("restricted", lane=1, order=2, classification="degraded"),
                s("recovery_only", lane=1, order=3, classification="degraded"),
                s("revoked", lane=0, order=2, classification="terminal"),
                s("expired_idle", lane=0, order=3, classification="terminal"),
                s("expired_absolute", lane=0, order=4, classification="terminal"),
                s("terminated", lane=0, order=5, classification="terminal"),
            ),
            initial_state="establishing",
            terminal_states=("revoked", "expired_idle", "expired_absolute", "terminated"),
            supersession_states=(),
            legal_transitions=(
                tr(
                    "SM_SESSION_STATE",
                    "establishing",
                    "active",
                    trigger="Session establishment settles on the current grant, binding, and tuple.",
                    guards=["SessionEstablishmentDecision is current", "Identity binding and grant context still match"],
                    proofs=["SessionEstablishmentDecision", "Session(sessionState = active)"],
                    related_objects=["SessionEstablishmentDecision", "AccessGrant", "RouteIntentBinding"],
                    source_refs=phase0_refs,
                ),
                tr(
                    "SM_SESSION_STATE",
                    "active",
                    "step_up_required",
                    trigger="Policy, risk, or scope change requires additional assurance before continuing.",
                    guards=["Higher assurance is required for the target action"],
                    proofs=["CapabilityDecision", "Session(sessionState = step_up_required)"],
                    related_objects=["CapabilityDecision"],
                    degraded_posture="claim_pending",
                    source_refs=phase0_refs,
                ),
                tr(
                    "SM_SESSION_STATE",
                    "step_up_required",
                    "active",
                    trigger="Step-up succeeds under the current session epoch and binding version.",
                    guards=["Same session fence and route tuple remain current"],
                    proofs=["SessionEstablishmentDecision", "Session(sessionState = active)"],
                    related_objects=["SessionEstablishmentDecision", "RouteIntentBinding"],
                    source_refs=phase0_refs,
                ),
                tr(
                    "SM_SESSION_STATE",
                    "active",
                    "restricted",
                    trigger="Policy or release posture narrows the session to restricted interaction.",
                    guards=["Writable authority is no longer legal on the live tuple"],
                    proofs=["ReleaseRecoveryDisposition", "Session(sessionState = restricted)"],
                    related_objects=["AudienceSurfaceRuntimeBinding", "ReleaseRecoveryDisposition"],
                    degraded_posture="read_only",
                    source_refs=phase0_refs,
                ),
                tr(
                    "SM_SESSION_STATE",
                    "restricted",
                    "recovery_only",
                    trigger="Session continuity drifts beyond read-only restrictions and requires recovery.",
                    guards=["Tuple or subject drift invalidates the bound route posture"],
                    proofs=["RouteIntentBinding(bindingState = recovery_only)", "Session(sessionState = recovery_only)"],
                    related_objects=["RouteIntentBinding", "AudienceSurfaceRuntimeBinding"],
                    degraded_posture="recovery_only",
                    source_refs=phase0_refs,
                ),
                tr(
                    "SM_SESSION_STATE",
                    "active",
                    "revoked",
                    trigger="Logout, repair, or supersession revokes the session.",
                    guards=["Revocation is authoritative on the current session epoch"],
                    proofs=["SessionTerminationSettlement"],
                    related_objects=["SessionTerminationSettlement", "AccessGrantSupersessionRecord"],
                    source_refs=phase0_refs,
                ),
                tr(
                    "SM_SESSION_STATE",
                    "active",
                    "expired_idle",
                    trigger="Idle timeout elapses.",
                    guards=["Idle expiry threshold has passed"],
                    proofs=["SessionTerminationSettlement"],
                    related_objects=["SessionTerminationSettlement"],
                    source_refs=phase0_refs,
                ),
                tr(
                    "SM_SESSION_STATE",
                    "active",
                    "expired_absolute",
                    trigger="Absolute session lifetime elapses.",
                    guards=["Absolute expiry threshold has passed"],
                    proofs=["SessionTerminationSettlement"],
                    related_objects=["SessionTerminationSettlement"],
                    source_refs=phase0_refs,
                ),
                tr(
                    "SM_SESSION_STATE",
                    "active",
                    "terminated",
                    trigger="The session ends for an explicit terminal reason.",
                    guards=["Termination settlement is authoritative"],
                    proofs=["SessionTerminationSettlement"],
                    related_objects=["SessionTerminationSettlement"],
                    source_refs=phase0_refs,
                ),
            ),
            illegal_transitions=(
                illegal(
                    "SM_SESSION_STATE",
                    "establishing",
                    "restricted",
                    issue_type="skipping_establishment_settlement",
                    dangerous="Routes could act as if a restricted session exists without ever establishing current identity and tuple authority.",
                    correction="All post-auth posture must settle through SessionEstablishmentDecision before restrictions or writable actionability are exposed.",
                    invariants=["INV_MUTATION_REQUIRES_CURRENT_ROUTE_TUPLE"],
                    source_refs=[
                        "phase-0-the-foundation-protocol.md#1.4C Session",
                    ],
                    forensic_refs=("forensic-audit-findings.md#Finding 91",),
                ),
            ),
            related_machine_ids=("SM_SESSION_ROUTE_AUTHORITY", "SM_ROUTE_INTENT_BINDING", "SM_AUDIENCE_SURFACE_RUNTIME_BINDING"),
            notes="Session.sessionState captures assurance and expiry posture, but writable actionability still depends on RouteIntentBinding, publication, and continuity proof.",
        ),
        MachineSpec(
            machine_id="SM_SESSION_ROUTE_AUTHORITY",
            canonical_name="Session.routeAuthorityState",
            owning_object_name="Session",
            state_axis_type="gate",
            machine_family="canonical_shared_control",
            phase_tags=("phase_0_foundation", "phase_2_identity_and_echoes"),
            source_file="phase-0-the-foundation-protocol.md",
            source_heading_or_block="#### 1.4C Session",
            supporting_source_refs=(),
            whether_transition_is_coordinator_owned=False,
            states=(
                s("none", lane=0, order=0),
                s("auth_read_only", lane=0, order=1),
                s("claim_pending", lane=0, order=2),
                s("writable", lane=0, order=3, classification="terminal"),
            ),
            initial_state="none",
            terminal_states=("writable",),
            supersession_states=(),
            legal_transitions=(
                tr(
                    "SM_SESSION_ROUTE_AUTHORITY",
                    "none",
                    "auth_read_only",
                    trigger="Auth succeeds but writable claim has not been settled.",
                    guards=["Session is active on the current subject scope"],
                    proofs=["Session(sessionState = active)", "CapabilityDecision(decisionState = allow)"],
                    related_objects=["Session", "CapabilityDecision"],
                    source_refs=phase0_refs,
                ),
                tr(
                    "SM_SESSION_ROUTE_AUTHORITY",
                    "auth_read_only",
                    "claim_pending",
                    trigger="Claim path or secure continuation is underway.",
                    guards=["Current grant family permits claim-pending progression"],
                    proofs=["AccessGrantRedemptionRecord", "SessionEstablishmentDecision(writableAuthorityState = claim_pending)"],
                    related_objects=["AccessGrant", "SessionEstablishmentDecision"],
                    source_refs=phase0_refs,
                ),
                tr(
                    "SM_SESSION_ROUTE_AUTHORITY",
                    "claim_pending",
                    "writable",
                    trigger="Current capability, route intent, and publication tuple all permit mutation.",
                    guards=["Session.sessionState = active", "RouteIntentBinding is live", "AudienceSurfaceRuntimeBinding is publishable_live"],
                    proofs=["RouteIntentBinding(bindingState = live)", "AudienceSurfaceRuntimeBinding(bindingState = publishable_live)", "CapabilityDecision(decisionState = allow)"],
                    related_objects=["RouteIntentBinding", "AudienceSurfaceRuntimeBinding", "CapabilityDecision"],
                    source_refs=phase0_refs,
                ),
            ),
            illegal_transitions=(
                illegal(
                    "SM_SESSION_ROUTE_AUTHORITY",
                    "auth_read_only",
                    "writable",
                    issue_type="claim_without_live_tuple",
                    dangerous="Authentication success could be mistaken for writable patient or operator authority.",
                    correction="Writable route authority requires current capability decision, session, live RouteIntentBinding, and publishable runtime binding.",
                    invariants=["INV_MUTATION_REQUIRES_CURRENT_ROUTE_TUPLE"],
                    source_refs=[
                        "phase-0-the-foundation-protocol.md#1.4C Session",
                        "phase-0-the-foundation-protocol.md#5.4 Claim, secure-link, and embedded access algorithm",
                    ],
                    forensic_refs=("forensic-audit-findings.md#Finding 91",),
                ),
            ),
            related_machine_ids=("SM_SESSION_STATE", "SM_ROUTE_INTENT_BINDING", "SM_AUDIENCE_SURFACE_RUNTIME_BINDING"),
            notes="Auth callback, secure-link uplift, and continuation redemption do not themselves imply writable authority. The current route and publication tuple still govern writable actionability.",
        ),
        MachineSpec(
            machine_id="SM_ACCESS_GRANT_LIFECYCLE",
            canonical_name="AccessGrant.grantState",
            owning_object_name="AccessGrant",
            state_axis_type="lifecycle",
            machine_family="canonical_shared_control",
            phase_tags=("phase_0_foundation", "phase_2_identity_and_echoes"),
            source_file="phase-0-the-foundation-protocol.md",
            source_heading_or_block="#### 1.6 AccessGrant",
            supporting_source_refs=(
                "forensic-audit-findings.md#Finding 60 - RequestClosureRecord omitted PHI-grant and reachability blockers",
            ),
            whether_transition_is_coordinator_owned=False,
            states=(
                s("live", lane=0, order=0),
                s("redeeming", lane=0, order=1),
                s("redeemed", lane=0, order=2, classification="terminal"),
                s("rotated", lane=1, order=1, classification="supersession"),
                s("superseded", lane=1, order=2, classification="terminal"),
                s("revoked", lane=1, order=3, classification="terminal"),
                s("expired", lane=1, order=4, classification="terminal"),
            ),
            initial_state="live",
            terminal_states=("redeemed", "superseded", "revoked", "expired"),
            supersession_states=("rotated", "superseded"),
            legal_transitions=(
                tr(
                    "SM_ACCESS_GRANT_LIFECYCLE",
                    "live",
                    "redeeming",
                    trigger="A one-time or rotating grant is presented and redemption begins.",
                    guards=["Grant validator, lineage scope, and runtime tuple all still match"],
                    proofs=["AccessGrantRedemptionRecord"],
                    related_objects=["AccessGrantScopeEnvelope", "RouteIntentBinding"],
                    source_refs=phase0_refs,
                ),
                tr(
                    "SM_ACCESS_GRANT_LIFECYCLE",
                    "redeeming",
                    "redeemed",
                    trigger="Redemption settles exactly once and downstream session or continuation creation succeeds.",
                    guards=["No replay collision exists", "Redemption count and scope are still valid"],
                    proofs=["AccessGrantRedemptionRecord", "CommandSettlementRecord(authoritativeOutcomeState = settled)"],
                    related_objects=["CommandSettlementRecord"],
                    source_refs=phase0_refs,
                ),
                tr(
                    "SM_ACCESS_GRANT_LIFECYCLE",
                    "live",
                    "rotated",
                    trigger="Grant rotation or reissue begins under the same governed family.",
                    guards=["Fresh grant issuance is required on a newer tuple"],
                    proofs=["AccessGrantSupersessionRecord"],
                    related_objects=["AccessGrantScopeEnvelope"],
                    source_refs=phase0_refs,
                ),
                tr(
                    "SM_ACCESS_GRANT_LIFECYCLE",
                    "rotated",
                    "superseded",
                    trigger="Replacement grant is current and the prior grant is now historical only.",
                    guards=["Supersession is exact-once and authoritative"],
                    proofs=["AccessGrantSupersessionRecord"],
                    related_objects=["AccessGrant"],
                    source_refs=phase0_refs,
                ),
                tr(
                    "SM_ACCESS_GRANT_LIFECYCLE",
                    "live",
                    "revoked",
                    trigger="Grant is explicitly revoked for repair, logout, policy, or abuse reasons.",
                    guards=["Revocation binds to the current grant family and tuple"],
                    proofs=["AccessGrantSupersessionRecord", "GrantRevocationRecord"],
                    related_objects=["AccessGrant"],
                    source_refs=phase0_refs,
                ),
                tr(
                    "SM_ACCESS_GRANT_LIFECYCLE",
                    "live",
                    "expired",
                    trigger="Grant expires before legal redemption.",
                    guards=["Expiry time has passed"],
                    proofs=["AccessGrantExpiryRecord"],
                    related_objects=["AccessGrant"],
                    source_refs=phase0_refs,
                ),
            ),
            illegal_transitions=(
                illegal(
                    "SM_ACCESS_GRANT_LIFECYCLE",
                    "live",
                    "redeemed",
                    issue_type="redemption_without_exact_once_record",
                    dangerous="A continuation or callback URL could be treated as valid without exact-once redemption settlement.",
                    correction="Any first successful presentation must settle through AccessGrantRedemptionRecord before session creation or route re-entry continues.",
                    invariants=["INV_MUTATION_REQUIRES_CURRENT_ROUTE_TUPLE"],
                    source_refs=[
                        "phase-0-the-foundation-protocol.md#1.6 AccessGrant",
                    ],
                    forensic_refs=("forensic-audit-findings.md#Finding 60",),
                ),
            ),
            related_machine_ids=("SM_ROUTE_INTENT_BINDING", "SM_SESSION_ROUTE_AUTHORITY", "SM_REQUEST_CLOSURE_DECISION"),
            notes="manual_only is not a grant family. Grants remain immutable issuance contracts and closure stays blocked while PHI-bearing grant drift remains unresolved.",
        ),
        MachineSpec(
            machine_id="SM_DUPLICATE_CLUSTER_STATUS",
            canonical_name="DuplicateCluster.reviewStatus",
            owning_object_name="DuplicateCluster",
            state_axis_type="case_local",
            machine_family="canonical_shared_control",
            phase_tags=("phase_0_foundation", "phase_1_red_flag_gate", "phase_3_human_checkpoint"),
            source_file="phase-0-the-foundation-protocol.md",
            source_heading_or_block="#### 1.7 DuplicateCluster",
            supporting_source_refs=(
                "forensic-audit-findings.md#Finding 57 - RequestClosureRecord omitted duplicate-cluster blockers",
                "forensic-audit-findings.md#Finding 65 - The event catalogue lacked duplicate-review lifecycle events",
            ),
            whether_transition_is_coordinator_owned=False,
            states=(
                s("open", lane=0, order=0),
                s("in_review", lane=0, order=1),
                s("resolved_confirmed", lane=0, order=2, classification="terminal"),
                s("resolved_separate", lane=1, order=2, classification="terminal"),
                s("resolved_related", lane=2, order=2, classification="terminal"),
                s("resolved_retry", lane=3, order=2, classification="terminal"),
                s("superseded", lane=4, order=2, classification="terminal"),
            ),
            initial_state="open",
            terminal_states=("resolved_confirmed", "resolved_separate", "resolved_related", "resolved_retry", "superseded"),
            supersession_states=("superseded",),
            legal_transitions=(
                tr(
                    "SM_DUPLICATE_CLUSTER_STATUS",
                    "open",
                    "in_review",
                    trigger="Review-required duplicate ambiguity is assigned explicit triage review work.",
                    guards=["relationType = review_required or same_episode_candidate"],
                    proofs=["DuplicateCluster", "request.duplicate.review_required event"],
                    related_objects=["DuplicateResolutionDecision"],
                    blockers=["Duplicate review blocks closure while unresolved"],
                    source_refs=[
                        "phase-0-the-foundation-protocol.md#1.7 DuplicateCluster",
                        "forensic-audit-findings.md#Finding 65 - The event catalogue lacked duplicate-review lifecycle events",
                    ],
                ),
                tr(
                    "SM_DUPLICATE_CLUSTER_STATUS",
                    "in_review",
                    "resolved_confirmed",
                    trigger="Review confirms same-episode or attach behavior under explicit continuity witness.",
                    guards=["DecisionClass is exact_retry_collapse or same_episode_link", "Winning pair evidence and continuity witness are current"],
                    proofs=["DuplicateResolutionDecision(decisionState = applied)"],
                    related_objects=["DuplicateResolutionDecision", "DuplicatePairEvidence"],
                    source_refs=phase0_refs,
                ),
                tr(
                    "SM_DUPLICATE_CLUSTER_STATUS",
                    "in_review",
                    "resolved_separate",
                    trigger="Review confirms the incoming item must remain a separate request.",
                    guards=["DecisionClass = separate_request"],
                    proofs=["DuplicateResolutionDecision(decisionState = applied)"],
                    related_objects=["DuplicateResolutionDecision"],
                    source_refs=phase0_refs,
                ),
                tr(
                    "SM_DUPLICATE_CLUSTER_STATUS",
                    "in_review",
                    "resolved_related",
                    trigger="Review confirms related-episode linkage without same-request attachment.",
                    guards=["DecisionClass = related_episode_link"],
                    proofs=["DuplicateResolutionDecision(decisionState = applied)"],
                    related_objects=["DuplicateResolutionDecision"],
                    source_refs=phase0_refs,
                ),
                tr(
                    "SM_DUPLICATE_CLUSTER_STATUS",
                    "in_review",
                    "resolved_retry",
                    trigger="Review confirms exact retry collapse.",
                    guards=["DecisionClass = exact_retry_collapse"],
                    proofs=["DuplicateResolutionDecision(decisionState = applied)"],
                    related_objects=["DuplicateResolutionDecision"],
                    source_refs=phase0_refs,
                ),
                tr(
                    "SM_DUPLICATE_CLUSTER_STATUS",
                    "open",
                    "superseded",
                    trigger="A newer cluster or resolution supersedes the current review container.",
                    guards=["Superseding cluster or decision exists"],
                    proofs=["DuplicateResolutionDecision(decisionState = superseded)"],
                    related_objects=["DuplicateResolutionDecision"],
                    source_refs=phase0_refs,
                ),
            ),
            illegal_transitions=(
                illegal(
                    "SM_DUPLICATE_CLUSTER_STATUS",
                    "open",
                    "resolved_confirmed",
                    issue_type="attach_without_review_or_witness",
                    dangerous="same_episode_candidate could silently collapse or attach work without explicit review or continuity witness.",
                    correction="Only DuplicateResolutionDecision with a valid decision class and witness may settle attach, retry, or related linkage.",
                    invariants=["INV_SAME_REQUEST_CONTINUATION_REUSES_LINEAGE", "INV_CLOSURE_REQUIRES_EMPTY_BLOCKERS"],
                    source_refs=[
                        "phase-0-the-foundation-protocol.md#1.7 DuplicateCluster",
                    ],
                    forensic_refs=("forensic-audit-findings.md#Finding 57", "forensic-audit-findings.md#Finding 65"),
                ),
            ),
            related_machine_ids=("SM_REQUEST_CLOSURE_DECISION", "SM_TRIAGE_TASK_STATUS"),
            notes="DuplicateCluster is the review container, not the settlement itself. same_episode_candidate never authorizes auto-attach by itself.",
        ),
        MachineSpec(
            machine_id="SM_FALLBACK_REVIEW_CASE",
            canonical_name="FallbackReviewCase.patientVisibleState",
            owning_object_name="FallbackReviewCase",
            state_axis_type="case_local",
            machine_family="canonical_shared_control",
            phase_tags=("phase_0_foundation",),
            source_file="phase-0-the-foundation-protocol.md",
            source_heading_or_block="#### 1.20 FallbackReviewCase",
            supporting_source_refs=(
                "forensic-audit-findings.md#Finding 58 - RequestClosureRecord omitted fallback-review blockers",
            ),
            whether_transition_is_coordinator_owned=False,
            states=(
                s("draft_recoverable", lane=0, order=0),
                s("submitted_degraded", lane=0, order=1, classification="degraded"),
                s("under_manual_review", lane=0, order=2, classification="degraded"),
                s("recovered", lane=0, order=3),
                s("closed", lane=0, order=4, classification="terminal"),
            ),
            initial_state="draft_recoverable",
            terminal_states=("closed",),
            supersession_states=(),
            legal_transitions=(
                tr(
                    "SM_FALLBACK_REVIEW_CASE",
                    "draft_recoverable",
                    "submitted_degraded",
                    trigger="Accepted user progress cannot complete automatically and degrades into governed review.",
                    guards=["Automated ingest, safety, or dependency path failed after progress was accepted"],
                    proofs=["FallbackReviewCase", "patient.receipt.degraded event"],
                    related_objects=["FallbackReviewCase"],
                    blockers=["Fallback review remains closure-blocking while open"],
                    source_refs=[
                        "phase-0-the-foundation-protocol.md#1.20 FallbackReviewCase",
                        "forensic-audit-findings.md#Finding 62 - The event catalogue lacked degraded receipt events",
                    ],
                ),
                tr(
                    "SM_FALLBACK_REVIEW_CASE",
                    "submitted_degraded",
                    "under_manual_review",
                    trigger="Manual owner picks up degraded accepted progress.",
                    guards=["Fallback queue ownership exists"],
                    proofs=["exception.review_case.opened event", "RequestLifecycleLease"],
                    related_objects=["RequestLifecycleLease"],
                    source_refs=phase0_refs,
                ),
                tr(
                    "SM_FALLBACK_REVIEW_CASE",
                    "under_manual_review",
                    "recovered",
                    trigger="Manual review repairs the degraded path without losing lineage.",
                    guards=["Recovery path is settled on the same lineage"],
                    proofs=["exception.review_case.recovered event"],
                    related_objects=["CommandSettlementRecord"],
                    source_refs=phase0_refs,
                ),
                tr(
                    "SM_FALLBACK_REVIEW_CASE",
                    "recovered",
                    "closed",
                    trigger="Recovered case is acknowledged and no longer blocks closure.",
                    guards=["Recovery is durable and any downstream blocker has been cleared or superseded"],
                    proofs=["FallbackReviewClosureRecord"],
                    related_objects=["RequestClosureRecord"],
                    source_refs=phase0_refs,
                ),
            ),
            illegal_transitions=(
                illegal(
                    "SM_FALLBACK_REVIEW_CASE",
                    "submitted_degraded",
                    "closed",
                    issue_type="degraded_progress_lost",
                    dangerous="Accepted but degraded progress could be silently dropped or marked closed without review.",
                    correction="Fallback review must remain explicit and closure-blocking until recovered, superseded by governed manual action, or explicitly closed under policy.",
                    invariants=["INV_CLOSURE_REQUIRES_EMPTY_BLOCKERS"],
                    source_refs=[
                        "phase-0-the-foundation-protocol.md#1.20 FallbackReviewCase",
                    ],
                    forensic_refs=("forensic-audit-findings.md#Finding 58", "forensic-audit-findings.md#Finding 62"),
                ),
            ),
            related_machine_ids=("SM_REQUEST_CLOSURE_DECISION", "SM_SUBMISSION_ENVELOPE_STATE"),
            notes="Fallback review preserves accepted progress on the same lineage and stays closure-blocking until recovered or explicitly resolved.",
        ),
        MachineSpec(
            machine_id="SM_REQUEST_LIFECYCLE_LEASE",
            canonical_name="RequestLifecycleLease.state",
            owning_object_name="RequestLifecycleLease",
            state_axis_type="lease",
            machine_family="canonical_shared_control",
            phase_tags=("phase_0_foundation", "phase_3_human_checkpoint", "callback_and_messaging", "phase_4_booking_engine", "phase_5_network_horizon", "phase_6_pharmacy_loop"),
            source_file="phase-0-the-foundation-protocol.md",
            source_heading_or_block="#### 1.10 RequestLifecycleLease",
            supporting_source_refs=(
                "forensic-audit-findings.md#Finding 15 - Task claim and lease semantics were absent",
            ),
            whether_transition_is_coordinator_owned=False,
            states=(
                s("active", lane=0, order=0),
                s("releasing", lane=0, order=1),
                s("released", lane=0, order=2, classification="terminal"),
                s("expired", lane=1, order=1, classification="degraded"),
                s("broken", lane=1, order=2, classification="degraded"),
            ),
            initial_state="active",
            terminal_states=("released",),
            supersession_states=(),
            legal_transitions=(
                tr(
                    "SM_REQUEST_LIFECYCLE_LEASE",
                    "active",
                    "releasing",
                    trigger="Current owner intentionally releases the lease.",
                    guards=["Compare-and-set on current ownershipEpoch and fencingToken succeeds"],
                    proofs=["RequestLifecycleLease", "LeaseReleaseRecord"],
                    related_objects=["StaleOwnershipRecoveryRecord"],
                    blockers=["Any active, releasing, expired, or broken lease blocks closure"],
                    source_refs=phase0_refs,
                ),
                tr(
                    "SM_REQUEST_LIFECYCLE_LEASE",
                    "releasing",
                    "released",
                    trigger="Release is durably committed or replaced by a newer lease.",
                    guards=["Replacement lease or release settlement is current"],
                    proofs=["LeaseTakeoverRecord | LeaseReleaseRecord"],
                    related_objects=["LeaseTakeoverRecord"],
                    source_refs=phase0_refs,
                ),
                tr(
                    "SM_REQUEST_LIFECYCLE_LEASE",
                    "active",
                    "expired",
                    trigger="Heartbeat misses the TTL.",
                    guards=["No supervised release or takeover has yet settled"],
                    proofs=["StaleOwnershipRecoveryRecord(recoveryReason = heartbeat_missed)"],
                    related_objects=["StaleOwnershipRecoveryRecord"],
                    degraded_posture="stale_owner_recovery",
                    blockers=["Expired lease remains closure-blocking until recovered"],
                    source_refs=phase0_refs,
                ),
                tr(
                    "SM_REQUEST_LIFECYCLE_LEASE",
                    "active",
                    "broken",
                    trigger="A stale write or supervised takeover breaks the lease.",
                    guards=["Write fence mismatch or takeover authorization exists"],
                    proofs=["StaleOwnershipRecoveryRecord", "LeaseTakeoverRecord"],
                    related_objects=["StaleOwnershipRecoveryRecord", "LeaseTakeoverRecord"],
                    degraded_posture="stale_owner_recovery",
                    blockers=["Broken lease remains closure-blocking until resolved"],
                    source_refs=phase0_refs,
                ),
            ),
            illegal_transitions=(
                illegal(
                    "SM_REQUEST_LIFECYCLE_LEASE",
                    "expired",
                    "active",
                    issue_type="stale_reacquire_without_new_fence",
                    dangerous="A stale owner could silently resume mutation after expiry.",
                    correction="Lease expiry must open stale-owner recovery and only a new compare-and-set acquire or supervised takeover may mint fresh ownershipEpoch and fencingToken.",
                    invariants=["INV_MUTATION_REQUIRES_CURRENT_ROUTE_TUPLE", "INV_CLOSURE_REQUIRES_EMPTY_BLOCKERS"],
                    source_refs=[
                        "phase-0-the-foundation-protocol.md#1.10 RequestLifecycleLease",
                        "phase-0-the-foundation-protocol.md#1.10A StaleOwnershipRecoveryRecord and LeaseTakeoverRecord",
                    ],
                    forensic_refs=("forensic-audit-findings.md#Finding 15",),
                ),
            ),
            related_machine_ids=("SM_REQUEST_CLOSURE_DECISION", "SM_TRIAGE_TASK_STATUS", "SM_CALLBACK_CASE_STATE", "SM_BOOKING_CASE_STATUS", "SM_PHARMACY_CASE_STATUS"),
            notes="Every active workflow object acquires its own lease. Stale-owner recovery is a first-class workflow artifact and must remain visible in the same shell.",
        ),
        MachineSpec(
            machine_id="SM_REQUEST_CLOSURE_DECISION",
            canonical_name="RequestClosureRecord.decision",
            owning_object_name="RequestClosureRecord",
            state_axis_type="gate",
            machine_family="canonical_shared_control",
            phase_tags=("phase_0_foundation",),
            source_file="phase-0-the-foundation-protocol.md",
            source_heading_or_block="#### 1.12 RequestClosureRecord",
            supporting_source_refs=(
                "forensic-audit-findings.md#Finding 56 - The blueprint lacked an explicit rule that blockers must remain orthogonal to workflow milestones",
                "forensic-audit-findings.md#Finding 57 - RequestClosureRecord omitted duplicate-cluster blockers",
                "forensic-audit-findings.md#Finding 58 - RequestClosureRecord omitted fallback-review blockers",
                "forensic-audit-findings.md#Finding 59 - RequestClosureRecord omitted identity-repair blockers",
                "forensic-audit-findings.md#Finding 60 - RequestClosureRecord omitted PHI-grant and reachability blockers",
            ),
            whether_transition_is_coordinator_owned=True,
            states=(
                s("defer", lane=0, order=0, classification="degraded"),
                s("close", lane=0, order=1, classification="terminal"),
            ),
            initial_state="defer",
            terminal_states=("close",),
            supersession_states=(),
            legal_transitions=(
                tr(
                    "SM_REQUEST_CLOSURE_DECISION",
                    "defer",
                    "close",
                    trigger="A later coordinator evaluation finds the blocker set empty on the required lineage epoch.",
                    guards=[
                        "blockingLeaseRefs, blockingDuplicateClusterRefs, blockingFallbackCaseRefs, blockingIdentityRepairRefs, blockingGrantRefs, blockingReachabilityRefs, blockingConfirmationRefs, and blockingReconciliationRefs are all empty",
                        "requiredLineageEpoch matches the current LineageFence",
                    ],
                    proofs=["RequestClosureRecord(decision = close)", "request.closure_blockers.changed -> empty"],
                    related_objects=[
                        "DuplicateCluster",
                        "FallbackReviewCase",
                        "IdentityBinding",
                        "AccessGrant",
                        "ExternalConfirmationGate",
                    ],
                    coordinator_owned=True,
                    source_refs=[
                        "phase-0-the-foundation-protocol.md#1.12 RequestClosureRecord",
                        "forensic-audit-findings.md#Finding 71 - Closure evaluation did not explicitly assert empty coordinator-materialized blocker sets",
                    ],
                ),
            ),
            illegal_transitions=(
                illegal(
                    "SM_REQUEST_CLOSURE_DECISION",
                    "close",
                    "close",
                    issue_type="closure_without_fresh_blocker_evaluation",
                    dangerous="A cached close decision could be reused after blockers, lineage epoch, or confirmation ambiguity drift.",
                    correction="Each close decision must be recomputed against the current requiredLineageEpoch and blocker refs rather than replaying stale calmness.",
                    invariants=["INV_CLOSURE_REQUIRES_EMPTY_BLOCKERS"],
                    source_refs=[
                        "phase-0-the-foundation-protocol.md#1.12 RequestClosureRecord",
                    ],
                    forensic_refs=("forensic-audit-findings.md#Finding 71",),
                    notes="The same row captures stale close replay risk rather than a literal state transition.",
                ),
            ),
            related_machine_ids=(
                "SM_REQUEST_WORKFLOW_STATE",
                "SM_DUPLICATE_CLUSTER_STATUS",
                "SM_FALLBACK_REVIEW_CASE",
                "SM_REQUEST_LIFECYCLE_LEASE",
                "SM_EXTERNAL_CONFIRMATION_GATE",
            ),
            notes="Close is legal only after a persisted RequestClosureRecord on the current lineage epoch and an empty coordinator-materialized blocker set.",
        ),
        MachineSpec(
            machine_id="SM_CAPACITY_RESERVATION_STATE",
            canonical_name="CapacityReservation.state",
            owning_object_name="CapacityReservation",
            state_axis_type="settlement",
            machine_family="canonical_shared_control",
            phase_tags=("phase_0_foundation", "phase_4_booking_engine", "phase_5_network_horizon"),
            source_file="phase-0-the-foundation-protocol.md",
            source_heading_or_block="#### 1.14 CapacityReservation",
            supporting_source_refs=(
                "forensic-audit-findings.md#Finding 27 - Booking ignored supplier capability and actor mode",
            ),
            whether_transition_is_coordinator_owned=False,
            states=(
                s("none", lane=0, order=0),
                s("soft_selected", lane=0, order=1),
                s("held", lane=0, order=2),
                s("pending_confirmation", lane=0, order=3),
                s("confirmed", lane=0, order=4, classification="terminal"),
                s("released", lane=1, order=2, classification="terminal"),
                s("expired", lane=1, order=3, classification="terminal"),
                s("disputed", lane=1, order=4, classification="degraded"),
            ),
            initial_state="none",
            terminal_states=("confirmed", "released", "expired"),
            supersession_states=(),
            legal_transitions=(
                tr(
                    "SM_CAPACITY_RESERVATION_STATE",
                    "none",
                    "soft_selected",
                    trigger="A candidate is selected but no real exclusivity exists yet.",
                    guards=["Selection context exists on the current candidate set"],
                    proofs=["OfferSession | AlternativeOfferSession"],
                    related_objects=["ReservationTruthProjection"],
                    source_refs=phase0_refs,
                ),
                tr(
                    "SM_CAPACITY_RESERVATION_STATE",
                    "soft_selected",
                    "held",
                    trigger="A true exclusive hold is acquired.",
                    guards=["CapacityIdentity is strong enough for exclusivity", "commitMode = exclusive_hold"],
                    proofs=["CapacityReservation(state = held)"],
                    related_objects=["ReservationTruthProjection"],
                    source_refs=phase0_refs,
                ),
                tr(
                    "SM_CAPACITY_RESERVATION_STATE",
                    "soft_selected",
                    "pending_confirmation",
                    trigger="The system is confirming a nonexclusive or weakly-held selection.",
                    guards=["Visible claim remains truthful and not exclusive"],
                    proofs=["ReservationTruthProjection(truthState = pending_confirmation)"],
                    related_objects=["ReservationTruthProjection", "CommandSettlementRecord"],
                    source_refs=phase0_refs,
                ),
                tr(
                    "SM_CAPACITY_RESERVATION_STATE",
                    "held",
                    "pending_confirmation",
                    trigger="Commit begins and waits for authoritative booking confirmation.",
                    guards=["Current reservation version remains live"],
                    proofs=["BookingTransaction", "ReservationTruthProjection(truthState = pending_confirmation)"],
                    related_objects=["BookingTransaction", "ReservationTruthProjection"],
                    source_refs=phase0_refs,
                ),
                tr(
                    "SM_CAPACITY_RESERVATION_STATE",
                    "pending_confirmation",
                    "confirmed",
                    trigger="Authoritative confirmation lands for the same reservation lineage.",
                    guards=["External confirmation gate or strong proof is satisfied"],
                    proofs=["BookingConfirmationTruthProjection(confirmationTruthState = confirmed)"],
                    related_objects=["ExternalConfirmationGate", "BookingConfirmationTruthProjection"],
                    source_refs=phase0_refs,
                ),
                tr(
                    "SM_CAPACITY_RESERVATION_STATE",
                    "held",
                    "released",
                    trigger="The hold is intentionally released.",
                    guards=["Supersession or cancellation reason is current"],
                    proofs=["CapacityReservation(releasedAt != null)"],
                    related_objects=["ReservationTruthProjection"],
                    source_refs=phase0_refs,
                ),
                tr(
                    "SM_CAPACITY_RESERVATION_STATE",
                    "held",
                    "expired",
                    trigger="A real hold TTL expires.",
                    guards=["expiresAt has passed"],
                    proofs=["CapacityReservation(state = expired)"],
                    related_objects=["ReservationTruthProjection"],
                    source_refs=phase0_refs,
                ),
                tr(
                    "SM_CAPACITY_RESERVATION_STATE",
                    "pending_confirmation",
                    "disputed",
                    trigger="Confirmation evidence becomes contradictory or stale on the same reservation version.",
                    guards=["Reservation truth-basis check fails or competing evidence exists"],
                    proofs=["ReservationTruthProjection(truthState = disputed)", "ExternalConfirmationGate(state = disputed)"],
                    related_objects=["ReservationTruthProjection", "ExternalConfirmationGate"],
                    source_refs=phase0_refs,
                ),
            ),
            illegal_transitions=(
                illegal(
                    "SM_CAPACITY_RESERVATION_STATE",
                    "soft_selected",
                    "confirmed",
                    issue_type="fake_exclusivity_or_booking_truth",
                    dangerous="UI or booking logic could jump from selection to booked reassurance without a real hold or authoritative confirmation.",
                    correction="Selection and reservation truth stay explicit: soft_selected is never exclusivity or final booking truth.",
                    invariants=["INV_NO_BUSINESS_SUCCESS_FROM_TRANSPORT", "INV_CONFIRMATION_AMBIGUITY_STAYS_EXPLICIT"],
                    source_refs=[
                        "phase-0-the-foundation-protocol.md#1.14 CapacityReservation",
                        "phase-0-the-foundation-protocol.md#1.14A ReservationTruthProjection",
                    ],
                    forensic_refs=("forensic-audit-findings.md#Finding 27",),
                ),
            ),
            related_machine_ids=("SM_EXTERNAL_CONFIRMATION_GATE", "SM_BOOKING_CASE_STATUS", "SM_HUB_COORDINATION_CASE_STATUS"),
            notes="soft_selected is not exclusivity. Any visible hold language must resolve through ReservationTruthProjection and a real held reservation.",
        ),
        MachineSpec(
            machine_id="SM_EXTERNAL_CONFIRMATION_GATE",
            canonical_name="ExternalConfirmationGate.state",
            owning_object_name="ExternalConfirmationGate",
            state_axis_type="gate",
            machine_family="canonical_shared_control",
            phase_tags=("phase_0_foundation", "phase_4_booking_engine", "phase_5_network_horizon", "phase_6_pharmacy_loop"),
            source_file="phase-0-the-foundation-protocol.md",
            source_heading_or_block="#### 1.15 ExternalConfirmationGate",
            supporting_source_refs=(
                "forensic-audit-findings.md#Finding 67 - The event catalogue lacked external confirmation-gate lifecycle events",
                "forensic-audit-findings.md#Finding 72 - The booking commit path did not bind ambiguous supplier truth to canonical confirmation gates strongly enough",
            ),
            whether_transition_is_coordinator_owned=False,
            states=(
                s("pending", lane=0, order=0),
                s("confirmed", lane=0, order=1, classification="terminal"),
                s("expired", lane=1, order=1, classification="terminal"),
                s("disputed", lane=1, order=2, classification="degraded"),
                s("cancelled", lane=1, order=3, classification="terminal"),
            ),
            initial_state="pending",
            terminal_states=("confirmed", "expired", "cancelled"),
            supersession_states=(),
            legal_transitions=(
                tr(
                    "SM_EXTERNAL_CONFIRMATION_GATE",
                    "pending",
                    "confirmed",
                    trigger="Required hard matches pass and corroboration reaches the confirmation threshold.",
                    guards=["Every required hard match passes", "Weak/manual paths have corroboration from at least two source families"],
                    proofs=["confirmation.gate.confirmed event", "GateEvidenceBundle"],
                    related_objects=["BookingTransaction", "HubCommitAttempt", "PharmacyDispatchAttempt"],
                    source_refs=phase0_refs,
                ),
                tr(
                    "SM_EXTERNAL_CONFIRMATION_GATE",
                    "pending",
                    "expired",
                    trigger="The confirmation deadline passes without sufficient corroboration.",
                    guards=["confirmationDeadlineAt is reached before confirmation threshold"],
                    proofs=["confirmation.gate.expired event"],
                    related_objects=["BookingCase", "HubCoordinationCase", "PharmacyCase"],
                    degraded_posture="reconciliation_required",
                    blockers=["Gate remains a closure blocker until reviewed or superseded"],
                    source_refs=phase0_refs,
                ),
                tr(
                    "SM_EXTERNAL_CONFIRMATION_GATE",
                    "pending",
                    "disputed",
                    trigger="Contradictory evidence or competing gates prevent safe confirmation.",
                    guards=["Hard-match failure, contradictory evidence, or competing-gate ambiguity exists"],
                    proofs=["confirmation.gate.disputed event", "NegativeEvidenceBundle"],
                    related_objects=["BookingCase", "HubCoordinationCase", "PharmacyDispatchAttempt"],
                    degraded_posture="review_required",
                    blockers=["Gate remains a closure blocker until resolved or downgraded under policy"],
                    source_refs=phase0_refs,
                ),
                tr(
                    "SM_EXTERNAL_CONFIRMATION_GATE",
                    "pending",
                    "cancelled",
                    trigger="The owning branch is cancelled or superseded before confirmation completes.",
                    guards=["Owning branch has a newer authoritative attempt or termination reason"],
                    proofs=["confirmation.gate.cancelled event"],
                    related_objects=["BookingTransaction", "HubCommitAttempt", "PharmacyDispatchAttempt"],
                    source_refs=phase0_refs,
                ),
            ),
            illegal_transitions=(
                illegal(
                    "SM_EXTERNAL_CONFIRMATION_GATE",
                    "pending",
                    "confirmed",
                    issue_type="transport_acceptance_as_business_truth",
                    dangerous="Transport or provider acceptance alone could be mistaken for confirmed booking or dispatch truth.",
                    correction="Business success requires gate confirmation with required hard matches and sufficient corroboration, not transport acceptance alone.",
                    invariants=["INV_NO_BUSINESS_SUCCESS_FROM_TRANSPORT", "INV_CONFIRMATION_AMBIGUITY_STAYS_EXPLICIT"],
                    source_refs=[
                        "phase-0-the-foundation-protocol.md#1.15 ExternalConfirmationGate",
                        "phase-0-the-foundation-protocol.md#Pharmacy dispatch truth",
                    ],
                    forensic_refs=("forensic-audit-findings.md#Finding 67", "forensic-audit-findings.md#Finding 72"),
                ),
            ),
            related_machine_ids=("SM_BOOKING_CASE_STATUS", "SM_HUB_CONFIRMATION_TRUTH", "SM_PHARMACY_DISPATCH_STATUS", "SM_REQUEST_CLOSURE_DECISION"),
            notes="Weak, asynchronous, or manual external handoffs are gated explicitly. Confirmation ambiguity must not collapse into generic success or generic failure.",
        ),
        MachineSpec(
            machine_id="SM_ROUTE_INTENT_BINDING",
            canonical_name="RouteIntentBinding.bindingState",
            owning_object_name="RouteIntentBinding",
            state_axis_type="gate",
            machine_family="canonical_shared_control",
            phase_tags=("phase_0_foundation", "all_live_routes"),
            source_file="phase-0-the-foundation-protocol.md",
            source_heading_or_block="#### 1.21 RouteIntentBinding",
            supporting_source_refs=(
                "forensic-audit-findings.md#Finding 91 - The audit still treated route, settlement, release, and trust controls as phase-local conventions",
            ),
            whether_transition_is_coordinator_owned=False,
            states=(
                s("live", lane=0, order=0),
                s("stale", lane=0, order=1, classification="degraded"),
                s("superseded", lane=0, order=2, classification="terminal"),
                s("recovery_only", lane=1, order=2, classification="degraded"),
            ),
            initial_state="live",
            terminal_states=("superseded",),
            supersession_states=("superseded",),
            legal_transitions=(
                tr(
                    "SM_ROUTE_INTENT_BINDING",
                    "live",
                    "stale",
                    trigger="Session, subject binding, manifest, or release tuple drifts from the bound target tuple.",
                    guards=["Current authoritative tuple no longer matches routeIntentTupleHash"],
                    proofs=["RouteIntentDriftAssessment", "ReleaseRecoveryDisposition"],
                    related_objects=["Session", "AudienceSurfaceRuntimeBinding"],
                    degraded_posture="same-shell stale_recoverable",
                    source_refs=phase0_refs,
                ),
                tr(
                    "SM_ROUTE_INTENT_BINDING",
                    "stale",
                    "recovery_only",
                    trigger="A stale route can no longer safely remain writable or read-only under the old tuple.",
                    guards=["Fresh explicit disambiguation or reissue is still pending"],
                    proofs=["RouteIntentBinding(bindingState = recovery_only)"],
                    related_objects=["CommandSettlementRecord"],
                    degraded_posture="recovery_only",
                    source_refs=phase0_refs,
                ),
                tr(
                    "SM_ROUTE_INTENT_BINDING",
                    "live",
                    "superseded",
                    trigger="A new route intent replaces the prior tuple.",
                    guards=["Replacement route intent is authoritative"],
                    proofs=["RouteIntentSupersessionRecord"],
                    related_objects=["CommandActionRecord"],
                    source_refs=phase0_refs,
                ),
            ),
            illegal_transitions=(
                illegal(
                    "SM_ROUTE_INTENT_BINDING",
                    "stale",
                    "live",
                    issue_type="mutate_on_old_tuple",
                    dangerous="A route could regain writable posture just because the UI still has a CTA, even though its tuple is stale.",
                    correction="Any tuple drift requires fresh explicit disambiguation and a reissued RouteIntentBinding before writable posture resumes.",
                    invariants=["INV_MUTATION_REQUIRES_CURRENT_ROUTE_TUPLE"],
                    source_refs=[
                        "phase-0-the-foundation-protocol.md#1.21 RouteIntentBinding",
                        "phase-0-the-foundation-protocol.md#25A Any writable command must prove one exact target tuple",
                    ],
                    forensic_refs=("forensic-audit-findings.md#Finding 91",),
                ),
            ),
            related_machine_ids=("SM_COMMAND_SETTLEMENT", "SM_AUDIENCE_SURFACE_RUNTIME_BINDING", "SM_SESSION_ROUTE_AUTHORITY"),
            notes="Every writable patient, staff, support, hub, pharmacy, operations, or embedded route binds one exact target tuple. Hidden sibling-context reach-through is forbidden.",
        ),
        MachineSpec(
            machine_id="SM_COMMAND_SETTLEMENT",
            canonical_name="CommandSettlementRecord.authoritativeOutcomeState",
            owning_object_name="CommandSettlementRecord",
            state_axis_type="settlement",
            machine_family="canonical_shared_control",
            phase_tags=("phase_0_foundation", "all_live_routes"),
            source_file="phase-0-the-foundation-protocol.md",
            source_heading_or_block="#### 1.23 CommandSettlementRecord",
            supporting_source_refs=(
                "forensic-audit-findings.md#Finding 101 - Same-shell confirmation still understated settlement, return, and continuation posture",
            ),
            whether_transition_is_coordinator_owned=False,
            states=(
                s("pending", lane=0, order=0),
                s("projection_pending", lane=0, order=1),
                s("awaiting_external", lane=0, order=2),
                s("review_required", lane=1, order=1, classification="degraded"),
                s("stale_recoverable", lane=1, order=2, classification="degraded"),
                s("recovery_required", lane=1, order=3, classification="degraded"),
                s("reconciliation_required", lane=1, order=4, classification="degraded"),
                s("settled", lane=0, order=3, classification="terminal"),
                s("failed", lane=2, order=2, classification="terminal"),
                s("expired", lane=2, order=3, classification="terminal"),
                s("superseded", lane=2, order=4, classification="terminal"),
            ),
            initial_state="pending",
            terminal_states=("settled", "failed", "expired", "superseded"),
            supersession_states=("superseded",),
            legal_transitions=(
                tr(
                    "SM_COMMAND_SETTLEMENT",
                    "pending",
                    "projection_pending",
                    trigger="Command applied but downstream projection visibility has not yet caught up.",
                    guards=["Action record is immutable and current"],
                    proofs=["CommandSettlementRecord(result = projection_pending)"],
                    related_objects=["CommandActionRecord"],
                    source_refs=phase0_refs,
                ),
                tr(
                    "SM_COMMAND_SETTLEMENT",
                    "pending",
                    "awaiting_external",
                    trigger="External evidence or acceptance is required before settlement can calm down.",
                    guards=["The same action chain is still live"],
                    proofs=["CommandSettlementRecord(result = awaiting_external)"],
                    related_objects=["ExternalConfirmationGate"],
                    source_refs=phase0_refs,
                ),
                tr(
                    "SM_COMMAND_SETTLEMENT",
                    "pending",
                    "review_required",
                    trigger="Authoritative review is required before safe completion.",
                    guards=["Review reason is authoritative"],
                    proofs=["CommandSettlementRecord(result = review_required)"],
                    related_objects=["ApprovalCheckpoint", "DuplicateCluster"],
                    source_refs=phase0_refs,
                ),
                tr(
                    "SM_COMMAND_SETTLEMENT",
                    "pending",
                    "stale_recoverable",
                    trigger="The bound tuple or context has drifted but same-shell recovery is still legal.",
                    guards=["sameShellRecoveryRef exists"],
                    proofs=["CommandSettlementRecord(result = stale_recoverable)"],
                    related_objects=["RouteIntentBinding", "ReleaseRecoveryDisposition"],
                    degraded_posture="same-shell recovery",
                    source_refs=phase0_refs,
                ),
                tr(
                    "SM_COMMAND_SETTLEMENT",
                    "awaiting_external",
                    "reconciliation_required",
                    trigger="External evidence is contradictory or insufficient for calm final truth.",
                    guards=["Current external evidence cannot settle the same action chain"],
                    proofs=["CommandSettlementRecord(result = reconciliation_required)"],
                    related_objects=["ExternalConfirmationGate"],
                    degraded_posture="reconciliation review",
                    source_refs=phase0_refs,
                ),
                tr(
                    "SM_COMMAND_SETTLEMENT",
                    "projection_pending",
                    "settled",
                    trigger="Projection visibility and authoritative proof converge on the same action chain.",
                    guards=["authoritativeProofClass is sufficient", "Any required command-following projection is current"],
                    proofs=["CommandSettlementRecord(authoritativeOutcomeState = settled)"],
                    related_objects=["TransitionEnvelope"],
                    source_refs=phase0_refs,
                ),
                tr(
                    "SM_COMMAND_SETTLEMENT",
                    "awaiting_external",
                    "settled",
                    trigger="External proof settles the same action chain authoritatively.",
                    guards=["authoritativeProofClass is external_confirmation | review_disposition | recovery_disposition"],
                    proofs=["CommandSettlementRecord(authoritativeOutcomeState = settled)"],
                    related_objects=["ExternalConfirmationGate", "TransitionEnvelope"],
                    source_refs=phase0_refs,
                ),
                tr(
                    "SM_COMMAND_SETTLEMENT",
                    "review_required",
                    "recovery_required",
                    trigger="Review outcome proves the route can only continue through bounded recovery.",
                    guards=["sameShellRecoveryRef is authoritative"],
                    proofs=["CommandSettlementRecord(authoritativeOutcomeState = recovery_required)"],
                    related_objects=["ReleaseRecoveryDisposition"],
                    source_refs=phase0_refs,
                ),
                tr(
                    "SM_COMMAND_SETTLEMENT",
                    "reconciliation_required",
                    "settled",
                    trigger="Reconciliation resolves the same action chain under the current tuple.",
                    guards=["Supersession has not moved the action onto a new chain"],
                    proofs=["CommandSettlementRecord(authoritativeOutcomeState = settled)"],
                    related_objects=["ExternalConfirmationGate"],
                    source_refs=phase0_refs,
                ),
                tr(
                    "SM_COMMAND_SETTLEMENT",
                    "pending",
                    "failed",
                    trigger="Authoritative failure settles on the same action chain.",
                    guards=["Failure is authoritative, not just local acknowledgement"],
                    proofs=["CommandSettlementRecord(authoritativeOutcomeState = failed)"],
                    related_objects=["CommandActionRecord"],
                    source_refs=phase0_refs,
                ),
                tr(
                    "SM_COMMAND_SETTLEMENT",
                    "pending",
                    "expired",
                    trigger="The command-following freshness deadline expires without safe settlement.",
                    guards=["staleAfterAt passes"],
                    proofs=["CommandSettlementRecord(authoritativeOutcomeState = expired)"],
                    related_objects=["TransitionEnvelope"],
                    source_refs=phase0_refs,
                ),
                tr(
                    "SM_COMMAND_SETTLEMENT",
                    "settled",
                    "superseded",
                    trigger="A later settlement revision or superseding action replaces the prior calm state.",
                    guards=["supersedesSettlementRef exists"],
                    proofs=["CommandSettlementRecord(authoritativeOutcomeState = superseded)"],
                    related_objects=["CommandActionRecord"],
                    source_refs=phase0_refs,
                ),
            ),
            illegal_transitions=(
                illegal(
                    "SM_COMMAND_SETTLEMENT",
                    "pending",
                    "settled",
                    issue_type="transport_or_local_ack_as_calm_success",
                    dangerous="UI could collapse local acknowledgement or processing acceptance into final reassurance.",
                    correction="Calm success requires authoritativeOutcomeState = settled plus the required proof class and any command-following projection truth.",
                    invariants=["INV_NO_BUSINESS_SUCCESS_FROM_TRANSPORT", "INV_CALLBACK_AND_MESSAGE_EVIDENCE_BOUND"],
                    source_refs=[
                        "phase-0-the-foundation-protocol.md#1.23 CommandSettlementRecord",
                    ],
                    forensic_refs=("forensic-audit-findings.md#Finding 101",),
                ),
            ),
            related_machine_ids=("SM_ROUTE_INTENT_BINDING", "SM_AUDIENCE_SURFACE_RUNTIME_BINDING", "SM_CROSS_PHASE_SCORECARD"),
            notes="authoritativeOutcomeState is the only settlement dimension allowed to drive calm success, terminal status, closed posture, or next-step reassurance.",
        ),
        MachineSpec(
            machine_id="SM_AUDIENCE_SURFACE_RUNTIME_BINDING",
            canonical_name="AudienceSurfaceRuntimeBinding.bindingState",
            owning_object_name="AudienceSurfaceRuntimeBinding",
            state_axis_type="publication",
            machine_family="canonical_shared_control",
            phase_tags=("phase_0_foundation", "cross_phase_runtime"),
            source_file="phase-0-the-foundation-protocol.md",
            source_heading_or_block="#### 1.38A AudienceSurfaceRuntimeBinding",
            supporting_source_refs=(
                "forensic-audit-findings.md#Finding 91 - The audit still treated route, settlement, release, and trust controls as phase-local conventions",
                "forensic-audit-findings.md#Finding 97 - The audit still let patient-home actionability float above authoritative settlement",
            ),
            whether_transition_is_coordinator_owned=False,
            states=(
                s("publishable_live", lane=0, order=0),
                s("recovery_only", lane=1, order=1, classification="degraded"),
                s("read_only", lane=1, order=2, classification="degraded"),
                s("blocked", lane=1, order=3, classification="terminal"),
            ),
            initial_state="publishable_live",
            terminal_states=("blocked",),
            supersession_states=(),
            legal_transitions=(
                tr(
                    "SM_AUDIENCE_SURFACE_RUNTIME_BINDING",
                    "publishable_live",
                    "read_only",
                    trigger="The current route remains visible but no longer safely writable.",
                    guards=["Publication tuple is no longer exact for writable posture"],
                    proofs=["AudienceSurfaceRuntimeBinding(bindingState = read_only)", "ReleaseRecoveryDisposition"],
                    related_objects=["ReleaseRecoveryDisposition", "DesignContractPublicationBundle"],
                    degraded_posture="same-shell read_only",
                    source_refs=phase0_refs,
                ),
                tr(
                    "SM_AUDIENCE_SURFACE_RUNTIME_BINDING",
                    "publishable_live",
                    "recovery_only",
                    trigger="Publication, parity, or continuity drift requires same-shell recovery.",
                    guards=["surfaceTupleHash no longer matches current runtime truth"],
                    proofs=["AudienceSurfaceRuntimeBinding(bindingState = recovery_only)", "ReleaseRecoveryDisposition"],
                    related_objects=["ReleaseRecoveryDisposition", "ExperienceContinuityControlEvidence"],
                    degraded_posture="same-shell recovery",
                    source_refs=phase0_refs,
                ),
                tr(
                    "SM_AUDIENCE_SURFACE_RUNTIME_BINDING",
                    "publishable_live",
                    "blocked",
                    trigger="Trust, publication, or freeze posture blocks even read-only safe operation.",
                    guards=["surfaceAuthorityState is blocked or required trust is not legal"],
                    proofs=["ReleaseTrustFreezeVerdict", "AudienceSurfaceRuntimeBinding(bindingState = blocked)"],
                    related_objects=["ReleaseTrustFreezeVerdict"],
                    degraded_posture="blocked",
                    source_refs=phase0_refs,
                ),
                tr(
                    "SM_AUDIENCE_SURFACE_RUNTIME_BINDING",
                    "read_only",
                    "publishable_live",
                    trigger="Exact publication parity and trust posture are restored.",
                    guards=["coverageState = exact", "designContractState = exact", "surface authority returns to live"],
                    proofs=["AudienceSurfaceRuntimeBinding(bindingState = publishable_live)", "ReleasePublicationParityRecord"],
                    related_objects=["ReleasePublicationParityRecord"],
                    source_refs=phase0_refs,
                ),
                tr(
                    "SM_AUDIENCE_SURFACE_RUNTIME_BINDING",
                    "recovery_only",
                    "publishable_live",
                    trigger="Recovery path revalidates the route tuple and publication parity.",
                    guards=["Required continuity evidence and publication tuple are current again"],
                    proofs=["AudienceSurfaceRuntimeBinding(bindingState = publishable_live)", "ExperienceContinuityControlEvidence"],
                    related_objects=["ExperienceContinuityControlEvidence", "ReleasePublicationParityRecord"],
                    source_refs=phase0_refs,
                ),
            ),
            illegal_transitions=(
                illegal(
                    "SM_AUDIENCE_SURFACE_RUNTIME_BINDING",
                    "recovery_only",
                    "publishable_live",
                    issue_type="cta_reopened_from_cached_contract",
                    dangerous="A client cache or stale route contract could reopen mutating affordances after tuple drift.",
                    correction="Writable or calm posture may return only after a fresh runtime binding proves exact publication parity and current continuity proof.",
                    invariants=["INV_MUTATION_REQUIRES_CURRENT_ROUTE_TUPLE", "INV_PROJECTION_FRESHNESS_GATES_ACTIONABILITY"],
                    source_refs=[
                        "phase-0-the-foundation-protocol.md#1.38A AudienceSurfaceRuntimeBinding",
                    ],
                    forensic_refs=("forensic-audit-findings.md#Finding 91", "forensic-audit-findings.md#Finding 97"),
                ),
            ),
            related_machine_ids=("SM_ROUTE_INTENT_BINDING", "SM_COMMAND_SETTLEMENT", "SM_ASSISTIVE_TRUST_ENVELOPE", "SM_RESILIENCE_SURFACE_BINDING"),
            notes="AudienceSurfaceRuntimeBinding is the single runtime tuple consumed by shells, gateways, operations, governance, and support to decide whether a surface may appear writable, calmly trustworthy, recovery-only, or blocked.",
        ),
        MachineSpec(
            machine_id="SM_TRIAGE_TASK_STATUS",
            canonical_name="TriageTask.status",
            owning_object_name="TriageTask",
            state_axis_type="case_local",
            machine_family="triage_human_checkpoint",
            phase_tags=("phase_3_human_checkpoint",),
            source_file="phase-3-the-human-checkpoint.md",
            source_heading_or_block="## 3A. Triage contract and workspace state model",
            supporting_source_refs=(
                "forensic-audit-findings.md#Finding 75 - Phase 3 let triage-domain logic write canonical request state directly",
            ),
            whether_transition_is_coordinator_owned=False,
            states=(
                s("queued", lane=0, order=0),
                s("claimed", lane=0, order=1),
                s("in_review", lane=0, order=2),
                s("awaiting_patient_info", lane=1, order=2, classification="degraded"),
                s("review_resumed", lane=1, order=3),
                s("endpoint_selected", lane=0, order=3),
                s("escalated", lane=2, order=3, classification="degraded"),
                s("resolved_without_appointment", lane=0, order=4),
                s("handoff_pending", lane=1, order=4),
                s("reopened", lane=2, order=4),
                s("closed", lane=0, order=5, classification="terminal"),
            ),
            initial_state="queued",
            terminal_states=("closed",),
            supersession_states=(),
            legal_transitions=(
                tr(
                    "SM_TRIAGE_TASK_STATUS",
                    "queued",
                    "claimed",
                    trigger="Reviewer acquires the current triage lease.",
                    guards=["RequestLifecycleLease is current", "Workspace trust and publication posture remain writable"],
                    proofs=["RequestLifecycleLease", "ReviewActionLease"],
                    related_objects=["RequestLifecycleLease", "AudienceSurfaceRuntimeBinding"],
                    source_refs=[
                        "phase-3-the-human-checkpoint.md#3A Triage contract and workspace state model",
                        "forensic-audit-findings.md#Finding 15 - Task claim and lease semantics were absent",
                    ],
                ),
                tr(
                    "SM_TRIAGE_TASK_STATUS",
                    "claimed",
                    "in_review",
                    trigger="The reviewer starts active review on the current review version.",
                    guards=["reviewVersion and route intent still match"],
                    proofs=["ReviewSession", "ReviewActionLease"],
                    related_objects=["ReviewSession", "DecisionEpoch"],
                    source_refs=[
                        "phase-3-the-human-checkpoint.md#3A Triage contract and workspace state model",
                    ],
                ),
                tr(
                    "SM_TRIAGE_TASK_STATUS",
                    "in_review",
                    "awaiting_patient_info",
                    trigger="Structured more-info request is issued.",
                    guards=["Exactly one current MoreInfoReplyWindowCheckpoint is live"],
                    proofs=["MoreInfoCycle", "MoreInfoReplyWindowCheckpoint"],
                    related_objects=["MoreInfoReplyWindowCheckpoint", "RequestLifecycleLease"],
                    blockers=["Open more-info window blocks request closure"],
                    source_refs=[
                        "phase-3-the-human-checkpoint.md#3D More-info loop, patient response threading, and re-safety",
                    ],
                ),
                tr(
                    "SM_TRIAGE_TASK_STATUS",
                    "awaiting_patient_info",
                    "review_resumed",
                    trigger="An accepted reply is assimilated and re-safety clears the case back to triage review.",
                    guards=["MoreInfoResponseDisposition is accepted", "Re-safety no longer requires urgent diversion"],
                    proofs=["EvidenceAssimilationRecord", "SafetyDecisionRecord", "triage.task.resumed event"],
                    related_objects=["MoreInfoReplyWindowCheckpoint", "SafetyDecisionRecord"],
                    source_refs=[
                        "phase-3-the-human-checkpoint.md#3D More-info loop, patient response threading, and re-safety",
                    ],
                ),
                tr(
                    "SM_TRIAGE_TASK_STATUS",
                    "review_resumed",
                    "queued",
                    trigger="Queue engine re-admits the resumed task under deterministic ranking.",
                    guards=["Updated ranking explanation is persisted"],
                    proofs=["QueueRankingRecord", "triage.task.resumed event"],
                    related_objects=["RequestLifecycleLease"],
                    source_refs=[
                        "phase-3-the-human-checkpoint.md#3D More-info loop, patient response threading, and re-safety",
                    ],
                ),
                tr(
                    "SM_TRIAGE_TASK_STATUS",
                    "in_review",
                    "endpoint_selected",
                    trigger="Endpoint decision is chosen on the current live DecisionEpoch.",
                    guards=["Current DecisionEpoch is live and unsuperseded"],
                    proofs=["EndpointDecisionSettlement", "DecisionEpoch(epochState = live)"],
                    related_objects=["DecisionEpoch", "EndpointDecisionSettlement"],
                    source_refs=[
                        "phase-3-the-human-checkpoint.md#3E Endpoint decision engine and resolution model",
                    ],
                ),
                tr(
                    "SM_TRIAGE_TASK_STATUS",
                    "endpoint_selected",
                    "resolved_without_appointment",
                    trigger="Direct outcome path settles on the same DecisionEpoch.",
                    guards=["EndpointDecisionSettlement is settled", "Any required approval checkpoint is approved"],
                    proofs=["EndpointDecisionSettlement", "ApprovalCheckpoint"],
                    related_objects=["ApprovalCheckpoint", "CommandSettlementRecord"],
                    source_refs=[
                        "phase-3-the-human-checkpoint.md#3G Direct resolution, downstream handoff seeds, and reopen mechanics",
                    ],
                ),
                tr(
                    "SM_TRIAGE_TASK_STATUS",
                    "endpoint_selected",
                    "handoff_pending",
                    trigger="Booking or pharmacy handoff seed is durably created from the current DecisionEpoch.",
                    guards=["LineageCaseLink(caseFamily) is proposed on the current lineage", "Downstream seed references the unsuperseded DecisionEpoch"],
                    proofs=["BookingIntent | PharmacyIntent", "LineageCaseLink"],
                    related_objects=["DecisionEpoch", "LineageCaseLink"],
                    source_refs=[
                        "phase-3-the-human-checkpoint.md#3G Direct resolution, downstream handoff seeds, and reopen mechanics",
                    ],
                ),
                tr(
                    "SM_TRIAGE_TASK_STATUS",
                    "endpoint_selected",
                    "escalated",
                    trigger="Urgent escalation path opens for high-risk review.",
                    guards=["Urgent escalation or SafetyDecisionRecord requires it"],
                    proofs=["DutyEscalationRecord", "SafetyDecisionRecord"],
                    related_objects=["DecisionEpoch", "Request.safetyState"],
                    source_refs=[
                        "phase-3-the-human-checkpoint.md#3F Human approval checkpoint and urgent escalation path",
                    ],
                ),
                tr(
                    "SM_TRIAGE_TASK_STATUS",
                    "escalated",
                    "resolved_without_appointment",
                    trigger="Urgent path settles a direct outcome.",
                    guards=["DecisionEpoch is still current"],
                    proofs=["DutyEscalationRecord", "EndpointDecisionSettlement"],
                    related_objects=["DecisionEpoch"],
                    source_refs=[
                        "phase-3-the-human-checkpoint.md#3F Human approval checkpoint and urgent escalation path",
                    ],
                ),
                tr(
                    "SM_TRIAGE_TASK_STATUS",
                    "escalated",
                    "handoff_pending",
                    trigger="Urgent path requires downstream ownership.",
                    guards=["Downstream intent still matches the live DecisionEpoch"],
                    proofs=["BookingIntent | PharmacyIntent", "LineageCaseLink"],
                    related_objects=["DecisionEpoch", "LineageCaseLink"],
                    source_refs=[
                        "phase-3-the-human-checkpoint.md#3F Human approval checkpoint and urgent escalation path",
                    ],
                ),
                tr(
                    "SM_TRIAGE_TASK_STATUS",
                    "escalated",
                    "reopened",
                    trigger="Urgent path returns the case for further practice review.",
                    guards=["TriageReopenRecord is current"],
                    proofs=["TriageReopenRecord"],
                    related_objects=["DecisionEpoch"],
                    source_refs=[
                        "phase-3-the-human-checkpoint.md#3F Human approval checkpoint and urgent escalation path",
                    ],
                ),
                tr(
                    "SM_TRIAGE_TASK_STATUS",
                    "resolved_without_appointment",
                    "closed",
                    trigger="All direct-resolution artifacts are durably queued or created.",
                    guards=["TaskCompletionSettlementEnvelope is settled"],
                    proofs=["TaskCompletionSettlementEnvelope", "CommandSettlementRecord(authoritativeOutcomeState = settled)"],
                    related_objects=["CommandSettlementRecord"],
                    source_refs=[
                        "phase-3-the-human-checkpoint.md#3G Direct resolution, downstream handoff seeds, and reopen mechanics",
                    ],
                ),
                tr(
                    "SM_TRIAGE_TASK_STATUS",
                    "handoff_pending",
                    "closed",
                    trigger="Downstream ownership acknowledges the handoff and the triage branch has no further open work.",
                    guards=["LineageCaseLink is acknowledged", "No triage-side blocker remains"],
                    proofs=["LineageCaseLink", "TaskCompletionSettlementEnvelope"],
                    related_objects=["LineageCaseLink"],
                    source_refs=[
                        "phase-3-the-human-checkpoint.md#3G Direct resolution, downstream handoff seeds, and reopen mechanics",
                    ],
                ),
                tr(
                    "SM_TRIAGE_TASK_STATUS",
                    "reopened",
                    "queued",
                    trigger="Reopened work re-enters the deterministic queue with raised urgency carry.",
                    guards=["Fresh triage-side lease is acquired"],
                    proofs=["TriageReopenRecord", "QueueRankingRecord"],
                    related_objects=["RequestLifecycleLease"],
                    source_refs=[
                        "phase-3-the-human-checkpoint.md#3G Direct resolution, downstream handoff seeds, and reopen mechanics",
                    ],
                ),
            ),
            illegal_transitions=(
                illegal(
                    "SM_TRIAGE_TASK_STATUS",
                    "endpoint_selected",
                    "closed",
                    issue_type="triage_closes_request_locally",
                    dangerous="Triage could collapse straight to closed after local endpoint choice or local acknowledgement.",
                    correction="Triage closes only after authoritative endpoint settlement and task completion settlement; canonical request closure remains coordinator-owned.",
                    invariants=["INV_CHILD_DOMAINS_EMIT_SIGNALS_ONLY", "INV_COORDINATOR_OWNS_CANONICAL_MILESTONES"],
                    source_refs=[
                        "phase-3-the-human-checkpoint.md#3G Direct resolution, downstream handoff seeds, and reopen mechanics",
                    ],
                    forensic_refs=("forensic-audit-findings.md#Finding 75",),
                ),
            ),
            related_machine_ids=("SM_REQUEST_WORKFLOW_STATE", "SM_DECISION_EPOCH", "SM_MORE_INFO_REPLY_WINDOW", "SM_APPROVAL_CHECKPOINT"),
            notes="TriageTask owns review-local truth only. It emits signals and downstream seeds; it does not own canonical Request.workflowState or closure truth.",
        ),
        MachineSpec(
            machine_id="SM_DECISION_EPOCH",
            canonical_name="DecisionEpoch.epochState",
            owning_object_name="DecisionEpoch",
            state_axis_type="gate",
            machine_family="triage_human_checkpoint",
            phase_tags=("phase_3_human_checkpoint",),
            source_file="phase-3-the-human-checkpoint.md",
            source_heading_or_block="## 3A. Triage contract and workspace state model",
            supporting_source_refs=(),
            whether_transition_is_coordinator_owned=False,
            states=(
                s("live", lane=0, order=0),
                s("blocked", lane=1, order=1, classification="degraded"),
                s("superseded", lane=0, order=1, classification="terminal"),
            ),
            initial_state="live",
            terminal_states=("superseded",),
            supersession_states=("superseded",),
            legal_transitions=(
                tr(
                    "SM_DECISION_EPOCH",
                    "live",
                    "blocked",
                    trigger="The epoch remains current but actionability is temporarily blocked by approval or trust posture.",
                    guards=["Current HumanApprovalGateAssessment or AssistiveCapabilityTrustEnvelope blocks consequence-bearing submit"],
                    proofs=["EndpointDecisionSettlement(result = blocked_approval_gate)"],
                    related_objects=["ApprovalCheckpoint", "AssistiveCapabilityTrustEnvelope"],
                    source_refs=[
                        "phase-3-the-human-checkpoint.md#3E Endpoint decision engine and resolution model",
                    ],
                ),
                tr(
                    "SM_DECISION_EPOCH",
                    "live",
                    "superseded",
                    trigger="Evidence, safety, duplicate, policy, trust, publication, or ownership drift requires a replacement epoch.",
                    guards=["DecisionSupersessionRecord reasonClass is authoritative"],
                    proofs=["DecisionSupersessionRecord"],
                    related_objects=["DecisionSupersessionRecord", "ApprovalCheckpoint"],
                    source_refs=[
                        "phase-3-the-human-checkpoint.md#3E Endpoint decision engine and resolution model",
                    ],
                ),
            ),
            illegal_transitions=(
                illegal(
                    "SM_DECISION_EPOCH",
                    "superseded",
                    "live",
                    issue_type="stale_preview_reused_after_supersession",
                    dangerous="A superseded preview or approval could still launch new downstream work.",
                    correction="Replacement epochs must be explicit; stale epochs remain provenance only and cannot authorize preview, approval, submit, or downstream seeds.",
                    invariants=["INV_CHILD_DOMAINS_EMIT_SIGNALS_ONLY", "INV_MORE_INFO_TTL_AND_SUPERSESSION"],
                    source_refs=[
                        "phase-3-the-human-checkpoint.md#3E Endpoint decision engine and resolution model",
                    ],
                    forensic_refs=("forensic-audit-findings.md#Finding 75",),
                ),
            ),
            related_machine_ids=("SM_TRIAGE_TASK_STATUS", "SM_APPROVAL_CHECKPOINT", "SM_BOOKING_CASE_STATUS", "SM_PHARMACY_CASE_STATUS", "SM_ADMIN_RESOLUTION_CASE"),
            notes="DecisionEpoch is the only writable fence for endpoint choice, preview, approval, and downstream launch. Stale epochs preserve provenance only.",
        ),
        MachineSpec(
            machine_id="SM_APPROVAL_CHECKPOINT",
            canonical_name="ApprovalCheckpoint.state",
            owning_object_name="ApprovalCheckpoint",
            state_axis_type="gate",
            machine_family="triage_human_checkpoint",
            phase_tags=("phase_3_human_checkpoint",),
            source_file="phase-3-the-human-checkpoint.md",
            source_heading_or_block="## 3F. Human approval checkpoint and urgent escalation path",
            supporting_source_refs=(),
            whether_transition_is_coordinator_owned=False,
            states=(
                s("not_required", lane=0, order=0),
                s("required", lane=0, order=1),
                s("pending", lane=0, order=2),
                s("approved", lane=0, order=3, classification="terminal"),
                s("rejected", lane=1, order=3, classification="terminal"),
                s("superseded", lane=2, order=3, classification="terminal"),
            ),
            initial_state="not_required",
            terminal_states=("approved", "rejected", "superseded"),
            supersession_states=("superseded",),
            legal_transitions=(
                tr(
                    "SM_APPROVAL_CHECKPOINT",
                    "not_required",
                    "required",
                    trigger="The current consequence requires explicit human approval.",
                    guards=["Policy bundle marks the decision as irreversible or approval-burdened"],
                    proofs=["ApprovalRequirementAssessment"],
                    related_objects=["DecisionEpoch"],
                    source_refs=[
                        "phase-3-the-human-checkpoint.md#3F Human approval checkpoint and urgent escalation path",
                    ],
                ),
                tr(
                    "SM_APPROVAL_CHECKPOINT",
                    "required",
                    "pending",
                    trigger="Approval request is formally issued for the current DecisionEpoch.",
                    guards=["DecisionEpoch is live and current"],
                    proofs=["ApprovalCheckpoint(state = pending)"],
                    related_objects=["DecisionEpoch"],
                    source_refs=[
                        "phase-3-the-human-checkpoint.md#3F Human approval checkpoint and urgent escalation path",
                    ],
                ),
                tr(
                    "SM_APPROVAL_CHECKPOINT",
                    "pending",
                    "approved",
                    trigger="Approver settles the current checkpoint positively.",
                    guards=["Checkpoint still matches the live DecisionEpoch"],
                    proofs=["ApprovalDecisionRecord(result = approved)"],
                    related_objects=["DecisionEpoch"],
                    source_refs=[
                        "phase-3-the-human-checkpoint.md#3F Human approval checkpoint and urgent escalation path",
                    ],
                ),
                tr(
                    "SM_APPROVAL_CHECKPOINT",
                    "pending",
                    "rejected",
                    trigger="Approver rejects the current consequence path.",
                    guards=["Checkpoint still matches the live DecisionEpoch"],
                    proofs=["ApprovalDecisionRecord(result = rejected)"],
                    related_objects=["DecisionEpoch"],
                    source_refs=[
                        "phase-3-the-human-checkpoint.md#3F Human approval checkpoint and urgent escalation path",
                    ],
                ),
                tr(
                    "SM_APPROVAL_CHECKPOINT",
                    "pending",
                    "superseded",
                    trigger="Any material change invalidates the prior approval basis.",
                    guards=["DecisionSupersessionRecord exists for the bound epoch"],
                    proofs=["DecisionSupersessionRecord"],
                    related_objects=["DecisionEpoch"],
                    source_refs=[
                        "phase-3-the-human-checkpoint.md#3F Human approval checkpoint and urgent escalation path",
                    ],
                ),
            ),
            illegal_transitions=(
                illegal(
                    "SM_APPROVAL_CHECKPOINT",
                    "approved",
                    "approved",
                    issue_type="approval_reused_after_material_change",
                    dangerous="An old approval could still authorize changed notes, endpoint, evidence, duplicate resolution, or publication posture.",
                    correction="Material change supersedes the checkpoint and requires fresh approval on the replacement epoch.",
                    invariants=["INV_CHILD_DOMAINS_EMIT_SIGNALS_ONLY"],
                    source_refs=[
                        "phase-3-the-human-checkpoint.md#3F Human approval checkpoint and urgent escalation path",
                    ],
                    forensic_refs=("forensic-audit-findings.md#Finding 75",),
                    notes="This row captures stale approval reuse rather than a literal state transition.",
                ),
            ),
            related_machine_ids=("SM_DECISION_EPOCH", "SM_TRIAGE_TASK_STATUS"),
            notes="ApprovalCheckpoint is bound to one DecisionEpoch, not generic task context. Any material change invalidates prior approval.",
        ),
        MachineSpec(
            machine_id="SM_MORE_INFO_REPLY_WINDOW",
            canonical_name="MoreInfoReplyWindowCheckpoint.replyWindowState",
            owning_object_name="MoreInfoReplyWindowCheckpoint",
            state_axis_type="case_local",
            machine_family="triage_human_checkpoint",
            phase_tags=("phase_3_human_checkpoint",),
            source_file="phase-3-the-human-checkpoint.md",
            source_heading_or_block="## 3D. More-info loop, patient response threading, and re-safety",
            supporting_source_refs=(
                "forensic-audit-findings.md#Finding 18 - More-info loop had no TTL, expiry, or escalation rule",
            ),
            whether_transition_is_coordinator_owned=False,
            states=(
                s("open", lane=0, order=0),
                s("reminder_due", lane=0, order=1),
                s("late_review", lane=0, order=2, classification="degraded"),
                s("expired", lane=1, order=2, classification="terminal"),
                s("superseded", lane=1, order=1, classification="terminal"),
                s("settled", lane=0, order=3, classification="terminal"),
            ),
            initial_state="open",
            terminal_states=("expired", "superseded", "settled"),
            supersession_states=("superseded",),
            legal_transitions=(
                tr(
                    "SM_MORE_INFO_REPLY_WINDOW",
                    "open",
                    "reminder_due",
                    trigger="The due-state crosses into reminder cadence under the same checkpoint revision.",
                    guards=["Current checkpoint remains the sole active window on the lineage"],
                    proofs=["MoreInfoReplyWindowCheckpoint", "MoreInfoReminderSchedule"],
                    related_objects=["MoreInfoCycle", "MoreInfoReminderSchedule"],
                    blockers=["Open or reminder_due checkpoints block closure"],
                    source_refs=[
                        "phase-3-the-human-checkpoint.md#3D More-info loop, patient response threading, and re-safety",
                    ],
                ),
                tr(
                    "SM_MORE_INFO_REPLY_WINDOW",
                    "reminder_due",
                    "late_review",
                    trigger="The formal reply window closes but late-review grace remains open.",
                    guards=["Current checkpoint revision is still live"],
                    proofs=["MoreInfoReplyWindowCheckpoint(replyWindowState = late_review)"],
                    related_objects=["MoreInfoCycle"],
                    blockers=["late_review remains a closure blocker"],
                    source_refs=[
                        "phase-3-the-human-checkpoint.md#3D More-info loop, patient response threading, and re-safety",
                    ],
                ),
                tr(
                    "SM_MORE_INFO_REPLY_WINDOW",
                    "open",
                    "settled",
                    trigger="Accepted in-window reply is assimilated and the cycle settles.",
                    guards=["MoreInfoResponseDisposition = accepted_in_window", "Evidence assimilation and safety settlement are complete"],
                    proofs=["MoreInfoResponseDisposition", "EvidenceAssimilationRecord", "SafetyDecisionRecord"],
                    related_objects=["EvidenceAssimilationRecord", "MoreInfoResponseDisposition"],
                    source_refs=[
                        "phase-3-the-human-checkpoint.md#3D More-info loop, patient response threading, and re-safety",
                    ],
                ),
                tr(
                    "SM_MORE_INFO_REPLY_WINDOW",
                    "late_review",
                    "settled",
                    trigger="Accepted late review is explicitly assimilated and settled.",
                    guards=["MoreInfoResponseDisposition = accepted_late_review", "Request closure has not yet settled"],
                    proofs=["MoreInfoResponseDisposition", "EvidenceAssimilationRecord", "SafetyDecisionRecord"],
                    related_objects=["EvidenceAssimilationRecord"],
                    source_refs=[
                        "phase-3-the-human-checkpoint.md#3D More-info loop, patient response threading, and re-safety",
                    ],
                ),
                tr(
                    "SM_MORE_INFO_REPLY_WINDOW",
                    "late_review",
                    "expired",
                    trigger="Late-review grace elapses without accepted reply assimilation.",
                    guards=["Checkpoint remains current and unassimilated"],
                    proofs=["MoreInfoReplyWindowCheckpoint(replyWindowState = expired)"],
                    related_objects=["MoreInfoCycle"],
                    source_refs=[
                        "phase-3-the-human-checkpoint.md#3D More-info loop, patient response threading, and re-safety",
                    ],
                ),
                tr(
                    "SM_MORE_INFO_REPLY_WINDOW",
                    "open",
                    "superseded",
                    trigger="A replacement cycle explicitly supersedes the prior one.",
                    guards=["A newer MoreInfoCycle is current on the lineage"],
                    proofs=["MoreInfoReplyWindowCheckpoint(replyWindowState = superseded)", "GrantRevocationRecord"],
                    related_objects=["MoreInfoCycle", "AccessGrant"],
                    source_refs=[
                        "phase-3-the-human-checkpoint.md#3D More-info loop, patient response threading, and re-safety",
                    ],
                ),
                tr(
                    "SM_MORE_INFO_REPLY_WINDOW",
                    "reminder_due",
                    "superseded",
                    trigger="The outstanding loop is replaced by a newer cycle before the patient responds.",
                    guards=["Replacement cycle is explicitly governed"],
                    proofs=["MoreInfoReplyWindowCheckpoint(replyWindowState = superseded)", "GrantRevocationRecord"],
                    related_objects=["MoreInfoCycle", "AccessGrant"],
                    source_refs=[
                        "phase-3-the-human-checkpoint.md#3D More-info loop, patient response threading, and re-safety",
                    ],
                ),
            ),
            illegal_transitions=(
                illegal(
                    "SM_MORE_INFO_REPLY_WINDOW",
                    "expired",
                    "settled",
                    issue_type="late_reply_reopens_expired_cycle",
                    dangerous="An expired or superseded reply could silently mint new evidence and reopen routine queue flow.",
                    correction="expired_rejected and superseded_duplicate replies remain explainable through MoreInfoResponseDisposition but may not implicitly reopen a closed or superseded cycle.",
                    invariants=["INV_MORE_INFO_TTL_AND_SUPERSESSION", "INV_EVIDENCE_ASSIMILATION_AND_RESAFETY"],
                    source_refs=[
                        "phase-3-the-human-checkpoint.md#3D More-info loop, patient response threading, and re-safety",
                    ],
                    forensic_refs=("forensic-audit-findings.md#Finding 18",),
                ),
            ),
            related_machine_ids=("SM_TRIAGE_TASK_STATUS", "SM_REQUEST_SAFETY_STATE", "SM_REQUEST_CLOSURE_DECISION"),
            notes="Exactly one MoreInfoReplyWindowCheckpoint may govern patient actionability on a lineage at a time. TTL, reminders, late review, supersession, and reply acceptance all compare-and-set the same checkpoint state.",
        ),
        MachineSpec(
            machine_id="SM_CALLBACK_CASE_STATE",
            canonical_name="CallbackCase.state",
            owning_object_name="CallbackCase",
            state_axis_type="case_local",
            machine_family="callback_and_messaging",
            phase_tags=("callback_and_messaging", "phase_3_human_checkpoint", "phase_5_network_horizon"),
            source_file="callback-and-clinician-messaging-loop.md",
            source_heading_or_block="## Callback domain",
            supporting_source_refs=(
                "forensic-audit-findings.md#Finding 24 - Callback handling had contradictory loop-and-close semantics",
                "forensic-audit-findings.md#Finding 25 - Delivery receipts, bounce handling, and controlled resend were missing",
            ),
            whether_transition_is_coordinator_owned=False,
            states=(
                s("created", lane=0, order=0),
                s("queued", lane=0, order=1),
                s("scheduled", lane=0, order=2),
                s("ready_for_attempt", lane=0, order=3),
                s("attempt_in_progress", lane=0, order=4),
                s("awaiting_outcome_evidence", lane=0, order=5),
                s("answered", lane=1, order=5),
                s("no_answer", lane=2, order=5),
                s("voicemail_left", lane=3, order=5),
                s("contact_route_repair_pending", lane=4, order=5, classification="degraded"),
                s("awaiting_retry", lane=2, order=6, classification="degraded"),
                s("escalation_review", lane=3, order=6, classification="degraded"),
                s("completed", lane=1, order=7),
                s("cancelled", lane=4, order=7, classification="terminal"),
                s("expired", lane=5, order=7, classification="terminal"),
                s("closed", lane=1, order=8, classification="terminal"),
                s("reopened", lane=0, order=8),
            ),
            initial_state="created",
            terminal_states=("cancelled", "expired", "closed"),
            supersession_states=(),
            legal_transitions=(
                tr(
                    "SM_CALLBACK_CASE_STATE",
                    "created",
                    "queued",
                    trigger="Callback case enters the governed callback queue.",
                    guards=["LineageCaseLink(caseFamily = callback) exists"],
                    proofs=["CallbackCase", "LineageCaseLink"],
                    related_objects=["CallbackIntentLease"],
                    source_refs=[
                        "callback-and-clinician-messaging-loop.md#Callback domain",
                    ],
                ),
                tr(
                    "SM_CALLBACK_CASE_STATE",
                    "queued",
                    "scheduled",
                    trigger="CallbackIntentLease schedules the callback promise window.",
                    guards=["Current RequestLifecycleLease and CallbackIntentLease fencing still match"],
                    proofs=["CallbackIntentLease", "CallbackExpectationEnvelope"],
                    related_objects=["CallbackIntentLease", "CallbackExpectationEnvelope"],
                    source_refs=[
                        "callback-and-clinician-messaging-loop.md#Callback domain",
                    ],
                ),
                tr(
                    "SM_CALLBACK_CASE_STATE",
                    "scheduled",
                    "ready_for_attempt",
                    trigger="The current callback window opens and the case is armed for attempt.",
                    guards=["Expectation window is current", "Route and contact posture remain valid"],
                    proofs=["CallbackIntentLease(leaseMode = ready_for_attempt)", "CallbackExpectationEnvelope"],
                    related_objects=["CallbackIntentLease", "RouteIntentBinding"],
                    source_refs=[
                        "callback-and-clinician-messaging-loop.md#Callback domain",
                    ],
                ),
                tr(
                    "SM_CALLBACK_CASE_STATE",
                    "ready_for_attempt",
                    "attempt_in_progress",
                    trigger="A callback attempt is initiated.",
                    guards=["Exact attempt fence has not already been used"],
                    proofs=["CallbackAttemptRecord(settlementState = initiated)", "CommandActionRecord"],
                    related_objects=["CallbackAttemptRecord", "CommandActionRecord"],
                    source_refs=[
                        "callback-and-clinician-messaging-loop.md#Callback domain",
                    ],
                ),
                tr(
                    "SM_CALLBACK_CASE_STATE",
                    "attempt_in_progress",
                    "awaiting_outcome_evidence",
                    trigger="The provider or staff attempt has started but outcome evidence is not yet settled.",
                    guards=["Attempt fence is still current"],
                    proofs=["CallbackAttemptRecord(settlementState = outcome_pending)"],
                    related_objects=["CallbackAttemptRecord"],
                    source_refs=[
                        "callback-and-clinician-messaging-loop.md#Callback domain",
                    ],
                ),
                tr(
                    "SM_CALLBACK_CASE_STATE",
                    "awaiting_outcome_evidence",
                    "answered",
                    trigger="Answered outcome evidence lands on the current attempt fence.",
                    guards=["Outcome bundle is durably stored"],
                    proofs=["CallbackOutcomeEvidenceBundle(outcome = answered)"],
                    related_objects=["CallbackOutcomeEvidenceBundle"],
                    source_refs=[
                        "callback-and-clinician-messaging-loop.md#Callback domain",
                    ],
                ),
                tr(
                    "SM_CALLBACK_CASE_STATE",
                    "awaiting_outcome_evidence",
                    "no_answer",
                    trigger="No-answer evidence settles on the current attempt fence.",
                    guards=["Outcome bundle is durably stored"],
                    proofs=["CallbackOutcomeEvidenceBundle(outcome = no_answer)"],
                    related_objects=["CallbackOutcomeEvidenceBundle"],
                    source_refs=[
                        "callback-and-clinician-messaging-loop.md#Callback domain",
                    ],
                ),
                tr(
                    "SM_CALLBACK_CASE_STATE",
                    "awaiting_outcome_evidence",
                    "voicemail_left",
                    trigger="Voicemail evidence settles on the current attempt fence.",
                    guards=["Outcome bundle is durably stored"],
                    proofs=["CallbackOutcomeEvidenceBundle(outcome = voicemail_left)"],
                    related_objects=["CallbackOutcomeEvidenceBundle"],
                    source_refs=[
                        "callback-and-clinician-messaging-loop.md#Callback domain",
                    ],
                ),
                tr(
                    "SM_CALLBACK_CASE_STATE",
                    "awaiting_outcome_evidence",
                    "contact_route_repair_pending",
                    trigger="Delivery failure or invalid route prevents callback progress.",
                    guards=["Active callback dependency is unresolved"],
                    proofs=["CallbackOutcomeEvidenceBundle(outcome = route_invalid | provider_failure)", "ReachabilityDependency"],
                    related_objects=["ReachabilityDependency", "CallbackExpectationEnvelope"],
                    degraded_posture="route_repair_required",
                    blockers=["Reachability repair blocks closure and callback completion"],
                    source_refs=[
                        "callback-and-clinician-messaging-loop.md#Callback domain",
                    ],
                ),
                tr(
                    "SM_CALLBACK_CASE_STATE",
                    "no_answer",
                    "awaiting_retry",
                    trigger="Resolution gate chooses retry rather than closure.",
                    guards=["Retry policy still allows another attempt"],
                    proofs=["CallbackResolutionGate(decision = retry)"],
                    related_objects=["CallbackResolutionGate"],
                    source_refs=[
                        "callback-and-clinician-messaging-loop.md#Callback domain",
                    ],
                ),
                tr(
                    "SM_CALLBACK_CASE_STATE",
                    "voicemail_left",
                    "escalation_review",
                    trigger="The current voicemail outcome requires clinician or ops escalation rather than quiet completion.",
                    guards=["Pathway policy requires escalation"],
                    proofs=["CallbackResolutionGate(decision = escalate)"],
                    related_objects=["CallbackResolutionGate"],
                    source_refs=[
                        "callback-and-clinician-messaging-loop.md#Callback domain",
                    ],
                ),
                tr(
                    "SM_CALLBACK_CASE_STATE",
                    "answered",
                    "completed",
                    trigger="Resolution gate marks the callback complete on the evidence-bound attempt.",
                    guards=["No safety preemption or reachability blocker remains unresolved"],
                    proofs=["CallbackResolutionGate(decision = complete)"],
                    related_objects=["CallbackResolutionGate", "SafetyPreemptionRecord"],
                    source_refs=[
                        "callback-and-clinician-messaging-loop.md#Callback domain",
                    ],
                ),
                tr(
                    "SM_CALLBACK_CASE_STATE",
                    "completed",
                    "closed",
                    trigger="Callback case closes after completion is durably settled.",
                    guards=["Completion decision is authoritative"],
                    proofs=["CallbackResolutionGate(decision = complete)", "CallbackCaseClosureRecord"],
                    related_objects=["CallbackResolutionGate"],
                    source_refs=[
                        "callback-and-clinician-messaging-loop.md#Callback domain",
                    ],
                ),
                tr(
                    "SM_CALLBACK_CASE_STATE",
                    "closed",
                    "reopened",
                    trigger="A new callback obligation or supervised reopen explicitly reopens the case.",
                    guards=["Reopen policy and lineage scope permit a fresh callback cycle"],
                    proofs=["CallbackReopenRecord"],
                    related_objects=["RequestLineage"],
                    source_refs=[
                        "callback-and-clinician-messaging-loop.md#Callback domain",
                    ],
                ),
                tr(
                    "SM_CALLBACK_CASE_STATE",
                    "reopened",
                    "queued",
                    trigger="Reopened callback work returns to the queue.",
                    guards=["New or refreshed CallbackIntentLease exists"],
                    proofs=["CallbackIntentLease"],
                    related_objects=["CallbackIntentLease"],
                    source_refs=[
                        "callback-and-clinician-messaging-loop.md#Callback domain",
                    ],
                ),
            ),
            illegal_transitions=(
                illegal(
                    "SM_CALLBACK_CASE_STATE",
                    "attempt_in_progress",
                    "completed",
                    issue_type="completion_without_outcome_evidence_and_resolution_gate",
                    dangerous="The case could look complete after a dial action or local note without proving the callback outcome.",
                    correction="Callback completion requires CallbackOutcomeEvidenceBundle plus CallbackResolutionGate(decision = complete).",
                    invariants=["INV_CALLBACK_AND_MESSAGE_EVIDENCE_BOUND", "INV_NO_BUSINESS_SUCCESS_FROM_TRANSPORT"],
                    source_refs=[
                        "callback-and-clinician-messaging-loop.md#Callback domain",
                    ],
                    forensic_refs=("forensic-audit-findings.md#Finding 24", "forensic-audit-findings.md#Finding 25"),
                ),
            ),
            related_machine_ids=("SM_REQUEST_LIFECYCLE_LEASE", "SM_REQUEST_CLOSURE_DECISION", "SM_HUB_COORDINATION_CASE_STATUS"),
            notes="Callback scheduling, attempts, expectation promises, evidence, retry, and completion remain explicit. The request itself still closes only through LifecycleCoordinator.",
        ),
        MachineSpec(
            machine_id="SM_CLINICIAN_MESSAGE_THREAD",
            canonical_name="ClinicianMessageThread.state",
            owning_object_name="ClinicianMessageThread",
            state_axis_type="case_local",
            machine_family="callback_and_messaging",
            phase_tags=("callback_and_messaging", "phase_3_human_checkpoint"),
            source_file="callback-and-clinician-messaging-loop.md",
            source_heading_or_block="## Clinician message domain",
            supporting_source_refs=(
                "forensic-audit-findings.md#Finding 23 - Clinician messaging had contradictory loop-and-close semantics",
                "forensic-audit-findings.md#Finding 25 - Delivery receipts, bounce handling, and controlled resend were missing",
            ),
            whether_transition_is_coordinator_owned=False,
            states=(
                s("drafted", lane=0, order=0),
                s("approved", lane=0, order=1),
                s("sent", lane=0, order=2),
                s("delivered", lane=0, order=3),
                s("patient_replied", lane=1, order=3),
                s("awaiting_clinician_review", lane=1, order=4),
                s("delivery_failed", lane=2, order=3, classification="degraded"),
                s("contact_route_repair_pending", lane=2, order=4, classification="degraded"),
                s("closed", lane=0, order=4, classification="terminal"),
                s("reopened", lane=1, order=5),
            ),
            initial_state="drafted",
            terminal_states=("closed",),
            supersession_states=(),
            legal_transitions=(
                tr(
                    "SM_CLINICIAN_MESSAGE_THREAD",
                    "drafted",
                    "approved",
                    trigger="Approval-required content is approved for dispatch on the current thread version.",
                    guards=["Current thread version and policy tuple match the draft"],
                    proofs=["ApprovalDecisionRecord", "MessageDispatchEnvelope(transportState = approved)"],
                    related_objects=["MessageDispatchEnvelope", "ReviewActionLease"],
                    source_refs=[
                        "callback-and-clinician-messaging-loop.md#Clinician message domain",
                    ],
                ),
                tr(
                    "SM_CLINICIAN_MESSAGE_THREAD",
                    "approved",
                    "sent",
                    trigger="Dispatch envelope leaves the draft phase and dispatch begins.",
                    guards=["Dispatch fence and thread version are current"],
                    proofs=["MessageDispatchEnvelope(transportState = dispatching | provider_accepted)"],
                    related_objects=["MessageDispatchEnvelope", "CommandActionRecord"],
                    source_refs=[
                        "callback-and-clinician-messaging-loop.md#Clinician message domain",
                    ],
                ),
                tr(
                    "SM_CLINICIAN_MESSAGE_THREAD",
                    "sent",
                    "delivered",
                    trigger="Current delivery evidence bundle proves delivered posture for the thread.",
                    guards=["Delivery evidence bundle is accepted through AdapterReceiptCheckpoint"],
                    proofs=["MessageDeliveryEvidenceBundle(deliveryState = delivered)"],
                    related_objects=["MessageDispatchEnvelope", "MessageDeliveryEvidenceBundle"],
                    source_refs=[
                        "callback-and-clinician-messaging-loop.md#Clinician message domain",
                    ],
                ),
                tr(
                    "SM_CLINICIAN_MESSAGE_THREAD",
                    "delivered",
                    "patient_replied",
                    trigger="Patient reply lands on the current thread and remains under the same lineage.",
                    guards=["Reply scope and thread version are current"],
                    proofs=["PatientReplyRecord", "ThreadExpectationEnvelope(patientVisibleState = awaiting_review)"],
                    related_objects=["ThreadExpectationEnvelope"],
                    source_refs=[
                        "callback-and-clinician-messaging-loop.md#Clinician message domain",
                    ],
                ),
                tr(
                    "SM_CLINICIAN_MESSAGE_THREAD",
                    "patient_replied",
                    "awaiting_clinician_review",
                    trigger="Reply is classified and routed back for clinician review.",
                    guards=["Material or contact-safety reply classification is settled"],
                    proofs=["EvidenceAssimilationRecord", "ThreadResolutionGate(decision = review_pending)"],
                    related_objects=["ThreadResolutionGate", "SafetyPreemptionRecord"],
                    source_refs=[
                        "callback-and-clinician-messaging-loop.md#Clinician message domain",
                    ],
                ),
                tr(
                    "SM_CLINICIAN_MESSAGE_THREAD",
                    "awaiting_clinician_review",
                    "closed",
                    trigger="Resolution gate closes the current message thread.",
                    guards=["No reply review, delivery dispute, reachability repair, or safety preemption remains open"],
                    proofs=["ThreadResolutionGate(decision = close)"],
                    related_objects=["ThreadResolutionGate"],
                    source_refs=[
                        "callback-and-clinician-messaging-loop.md#Clinician message domain",
                    ],
                ),
                tr(
                    "SM_CLINICIAN_MESSAGE_THREAD",
                    "sent",
                    "delivery_failed",
                    trigger="Delivery evidence bundle shows failure or expiry.",
                    guards=["Current dispatch fence remains current"],
                    proofs=["MessageDeliveryEvidenceBundle(deliveryState = failed | expired)"],
                    related_objects=["MessageDeliveryEvidenceBundle"],
                    source_refs=[
                        "callback-and-clinician-messaging-loop.md#Clinician message domain",
                    ],
                ),
                tr(
                    "SM_CLINICIAN_MESSAGE_THREAD",
                    "delivery_failed",
                    "contact_route_repair_pending",
                    trigger="Repair journey opens for the failed delivery dependency.",
                    guards=["Reachability dependency is active"],
                    proofs=["ThreadResolutionGate(decision = repair_route)", "ReachabilityDependency"],
                    related_objects=["ThreadResolutionGate", "ReachabilityDependency"],
                    degraded_posture="delivery_repair_required",
                    source_refs=[
                        "callback-and-clinician-messaging-loop.md#Clinician message domain",
                    ],
                ),
                tr(
                    "SM_CLINICIAN_MESSAGE_THREAD",
                    "contact_route_repair_pending",
                    "approved",
                    trigger="Controlled resend or channel change is authorized on the current thread.",
                    guards=["Current repair route and thread version still match"],
                    proofs=["ThreadResolutionGate(decision = repair_route)", "MessageDispatchEnvelope(repairIntent = controlled_resend | channel_change)"],
                    related_objects=["ThreadResolutionGate", "MessageDispatchEnvelope"],
                    source_refs=[
                        "callback-and-clinician-messaging-loop.md#Clinician message domain",
                    ],
                ),
                tr(
                    "SM_CLINICIAN_MESSAGE_THREAD",
                    "closed",
                    "reopened",
                    trigger="Resolution gate reopens the thread for further review or callback escalation.",
                    guards=["Current thread context still matches the investigative question"],
                    proofs=["ThreadResolutionGate(decision = reopen | escalate_to_callback)"],
                    related_objects=["ThreadResolutionGate", "CallbackCase"],
                    source_refs=[
                        "callback-and-clinician-messaging-loop.md#Clinician message domain",
                    ],
                ),
                tr(
                    "SM_CLINICIAN_MESSAGE_THREAD",
                    "reopened",
                    "awaiting_clinician_review",
                    trigger="Reopened thread returns to active clinician review posture.",
                    guards=["Review context and publication tuple are current"],
                    proofs=["ThreadResolutionGate(decision = reopen)", "ThreadExpectationEnvelope(patientVisibleState = awaiting_review)"],
                    related_objects=["ThreadResolutionGate"],
                    source_refs=[
                        "callback-and-clinician-messaging-loop.md#Clinician message domain",
                    ],
                ),
            ),
            illegal_transitions=(
                illegal(
                    "SM_CLINICIAN_MESSAGE_THREAD",
                    "sent",
                    "closed",
                    issue_type="thread_closed_on_send_or_transport",
                    dangerous="The thread could close on transport acceptance, local send acknowledgement, or optimistic timeline copy.",
                    correction="Delivery, dispute, reply review, repair routing, and closure are all gated by evidence bundles and ThreadResolutionGate.",
                    invariants=["INV_CALLBACK_AND_MESSAGE_EVIDENCE_BOUND", "INV_NO_BUSINESS_SUCCESS_FROM_TRANSPORT"],
                    source_refs=[
                        "callback-and-clinician-messaging-loop.md#Clinician message domain",
                    ],
                    forensic_refs=("forensic-audit-findings.md#Finding 23", "forensic-audit-findings.md#Finding 25"),
                ),
            ),
            related_machine_ids=("SM_CALLBACK_CASE_STATE", "SM_COMMAND_SETTLEMENT", "SM_REQUEST_CLOSURE_DECISION"),
            notes="ClinicianMessageThread is evidence-bound. Delivery, reply, repair, reopen, and closure remain explicit and cannot collapse onto transport success or toast-level acknowledgement.",
        ),
        MachineSpec(
            machine_id="SM_BOOKING_CASE_STATUS",
            canonical_name="BookingCase.status",
            owning_object_name="BookingCase",
            state_axis_type="case_local",
            machine_family="booking",
            phase_tags=("phase_4_booking_engine",),
            source_file="phase-4-the-booking-engine.md",
            source_heading_or_block="## 4A. Booking contract, case model, and state machine",
            supporting_source_refs=(
                "forensic-audit-findings.md#Finding 73 - Phase 4 used the generic term reconciliation_required for booking-case ambiguity",
                "forensic-audit-findings.md#Finding 74 - Phase 4 let booking-domain logic write canonical request state directly on success",
            ),
            whether_transition_is_coordinator_owned=False,
            states=(
                s("handoff_received", lane=0, order=0),
                s("capability_checked", lane=0, order=1),
                s("searching_local", lane=0, order=2),
                s("offers_ready", lane=0, order=3),
                s("selecting", lane=0, order=4),
                s("revalidating", lane=0, order=5),
                s("commit_pending", lane=0, order=6),
                s("booked", lane=0, order=7),
                s("confirmation_pending", lane=1, order=7, classification="degraded"),
                s("supplier_reconciliation_pending", lane=2, order=7, classification="degraded"),
                s("waitlisted", lane=3, order=5, classification="degraded"),
                s("fallback_to_hub", lane=3, order=6, classification="degraded"),
                s("callback_fallback", lane=4, order=6, classification="degraded"),
                s("booking_failed", lane=5, order=6, classification="terminal"),
                s("managed", lane=0, order=8),
                s("closed", lane=0, order=9, classification="terminal"),
            ),
            initial_state="handoff_received",
            terminal_states=("booking_failed", "closed"),
            supersession_states=(),
            legal_transitions=(
                tr(
                    "SM_BOOKING_CASE_STATUS",
                    "handoff_received",
                    "capability_checked",
                    trigger="Booking capability resolution runs on the current DecisionEpoch and route tuple.",
                    guards=["LineageCaseLink(caseFamily = booking) is current", "DecisionEpoch is unsuperseded"],
                    proofs=["BookingCapabilityResolution", "LineageCaseLink"],
                    related_objects=["DecisionEpoch", "BookingCapabilityResolution"],
                    source_refs=[
                        "phase-4-the-booking-engine.md#4A Booking contract, case model, and state machine",
                    ],
                ),
                tr(
                    "SM_BOOKING_CASE_STATUS",
                    "capability_checked",
                    "searching_local",
                    trigger="Current capability state allows local search for the active audience.",
                    guards=["capabilityState = live_self_service | live_staff_assist", "capabilityTupleHash still matches route and publication posture"],
                    proofs=["BookingCapabilityResolution", "BookingCapabilityProjection"],
                    related_objects=["BookingCapabilityResolution", "BookingCapabilityProjection"],
                    source_refs=[
                        "phase-4-the-booking-engine.md#4A Booking contract, case model, and state machine",
                    ],
                ),
                tr(
                    "SM_BOOKING_CASE_STATUS",
                    "searching_local",
                    "offers_ready",
                    trigger="Slot snapshot and offer session are current and patient-visible.",
                    guards=["Snapshot is current", "Offer session truth is current"],
                    proofs=["SlotSetSnapshot", "OfferSession"],
                    related_objects=["SlotSetSnapshot", "OfferSession"],
                    source_refs=[
                        "phase-4-the-booking-engine.md#4C Slot search, normalisation, and availability snapshots",
                        "phase-4-the-booking-engine.md#4D Slot scoring, offer orchestration, and selection experience",
                    ],
                ),
                tr(
                    "SM_BOOKING_CASE_STATUS",
                    "offers_ready",
                    "selecting",
                    trigger="A slot is actively selected on the current snapshot and offer session.",
                    guards=["Selection token and snapshot version still match"],
                    proofs=["OfferSession(selectionState = selected)", "ReservationTruthProjection"],
                    related_objects=["OfferSession", "ReservationTruthProjection"],
                    source_refs=[
                        "phase-4-the-booking-engine.md#4D Slot scoring, offer orchestration, and selection experience",
                    ],
                ),
                tr(
                    "SM_BOOKING_CASE_STATUS",
                    "selecting",
                    "revalidating",
                    trigger="Chosen slot is rechecked against current supplier state and original policy.",
                    guards=["Selected slot, sourceVersion, and SearchPolicy still match"],
                    proofs=["BookingTransaction(revalidationState = current)"],
                    related_objects=["BookingTransaction", "SearchPolicy"],
                    source_refs=[
                        "phase-4-the-booking-engine.md#4E Commit path, revalidation, booking record, and compensation",
                    ],
                ),
                tr(
                    "SM_BOOKING_CASE_STATUS",
                    "revalidating",
                    "commit_pending",
                    trigger="Commit begins on the fenced BookingTransaction.",
                    guards=["Current BookingCase request ownership fence still matches", "Reservation version still matches"],
                    proofs=["BookingTransaction(commitState = pending)", "CommandActionRecord"],
                    related_objects=["BookingTransaction", "RequestLifecycleLease"],
                    source_refs=[
                        "phase-4-the-booking-engine.md#4E Commit path, revalidation, booking record, and compensation",
                    ],
                ),
                tr(
                    "SM_BOOKING_CASE_STATUS",
                    "commit_pending",
                    "booked",
                    trigger="Authoritative booking truth is settled strongly enough for local case booked posture.",
                    guards=["Durable provider reference or same-commit read-after-write proof exists"],
                    proofs=["BookingConfirmationTruthProjection(confirmationTruthState = confirmed)"],
                    related_objects=["BookingConfirmationTruthProjection", "ExternalConfirmationGate"],
                    source_refs=[
                        "phase-4-the-booking-engine.md#4E Commit path, revalidation, booking record, and compensation",
                    ],
                ),
                tr(
                    "SM_BOOKING_CASE_STATUS",
                    "commit_pending",
                    "confirmation_pending",
                    trigger="Case-local commit needs explicit confirmation before calm booking truth.",
                    guards=["Current booking attempt is awaiting authoritative confirmation"],
                    proofs=["BookingConfirmationTruthProjection(confirmationTruthState = confirmation_pending)", "ExternalConfirmationGate"],
                    related_objects=["BookingConfirmationTruthProjection", "ExternalConfirmationGate"],
                    blockers=["Confirmation ambiguity blocks calmness and closure"],
                    source_refs=[
                        "phase-4-the-booking-engine.md#4A Booking contract, case model, and state machine",
                    ],
                ),
                tr(
                    "SM_BOOKING_CASE_STATUS",
                    "commit_pending",
                    "supplier_reconciliation_pending",
                    trigger="Supplier truth is ambiguous or disputed and needs explicit booking review.",
                    guards=["ExternalConfirmationGate exists for the current transaction chain"],
                    proofs=["BookingConfirmationTruthProjection(confirmationTruthState = reconciliation_required)", "ExternalConfirmationGate(state = pending | disputed)"],
                    related_objects=["BookingConfirmationTruthProjection", "ExternalConfirmationGate"],
                    blockers=["Supplier reconciliation remains case-local and closure-blocking"],
                    source_refs=[
                        "phase-4-the-booking-engine.md#4A Booking contract, case model, and state machine",
                        "forensic-audit-findings.md#Finding 73 - Phase 4 used the generic term reconciliation_required for booking-case ambiguity",
                    ],
                ),
                tr(
                    "SM_BOOKING_CASE_STATUS",
                    "commit_pending",
                    "waitlisted",
                    trigger="No immediate safe booking exists but local waitlist continuation is still safe.",
                    guards=["WaitlistDeadlineEvaluation.offerabilityState = waitlist_safe | at_risk", "WaitlistFallbackObligation.requiredFallbackRoute = stay_local_waitlist"],
                    proofs=["WaitlistEntry", "WaitlistDeadlineEvaluation", "WaitlistFallbackObligation"],
                    related_objects=["WaitlistEntry", "WaitlistFallbackObligation"],
                    source_refs=[
                        "phase-4-the-booking-engine.md#4G Smart Waitlist and local auto-fill",
                    ],
                ),
                tr(
                    "SM_BOOKING_CASE_STATUS",
                    "waitlisted",
                    "callback_fallback",
                    trigger="Waitlist fallback requires callback rather than continued local waiting.",
                    guards=["requiredFallbackRoute = callback", "Current CallbackCase and CallbackExpectationEnvelope exist for the same fallback fence"],
                    proofs=["WaitlistFallbackObligation", "CallbackCase", "CallbackExpectationEnvelope"],
                    related_objects=["WaitlistFallbackObligation", "CallbackCase"],
                    blockers=["Fallback obligation remains open until transfer settles"],
                    source_refs=[
                        "phase-4-the-booking-engine.md#4G Smart Waitlist and local auto-fill",
                    ],
                ),
                tr(
                    "SM_BOOKING_CASE_STATUS",
                    "waitlisted",
                    "fallback_to_hub",
                    trigger="Waitlist fallback requires hub transfer.",
                    guards=["requiredFallbackRoute = hub", "Linked HubCoordinationCase exists on the same lineage"],
                    proofs=["WaitlistFallbackObligation", "HubCoordinationCase"],
                    related_objects=["WaitlistFallbackObligation", "HubCoordinationCase"],
                    blockers=["Fallback obligation remains open until hub transfer settles"],
                    source_refs=[
                        "phase-4-the-booking-engine.md#4G Smart Waitlist and local auto-fill",
                    ],
                ),
                tr(
                    "SM_BOOKING_CASE_STATUS",
                    "commit_pending",
                    "booking_failed",
                    trigger="Local booking attempt ends without a legal continuation path.",
                    guards=["No active waitlist, callback, or hub continuation remains"],
                    proofs=["BookingFailureSettlement"],
                    related_objects=["BookingException"],
                    source_refs=[
                        "phase-4-the-booking-engine.md#4A Booking contract, case model, and state machine",
                    ],
                ),
                tr(
                    "SM_BOOKING_CASE_STATUS",
                    "booked",
                    "managed",
                    trigger="Managed cancel, reschedule, reminder, and detail-update lifecycle is now the active booking posture.",
                    guards=["AppointmentRecord exists and latest confirmation truth is current"],
                    proofs=["AppointmentRecord", "BookingConfirmationTruthProjection"],
                    related_objects=["AppointmentRecord", "BookingConfirmationTruthProjection"],
                    source_refs=[
                        "phase-4-the-booking-engine.md#4F Appointment management: cancel, reschedule, reminders, and detail updates",
                    ],
                ),
                tr(
                    "SM_BOOKING_CASE_STATUS",
                    "managed",
                    "closed",
                    trigger="Managed booking branch has no remaining operational debt on the lineage.",
                    guards=["No active waitlist fallback, confirmation gate, or manage blocker remains"],
                    proofs=["BookingClosureSettlement", "RequestClosureRecord or branch-local closure truth"],
                    related_objects=["RequestClosureRecord", "ExternalConfirmationGate"],
                    source_refs=[
                        "phase-4-the-booking-engine.md#4F Appointment management: cancel, reschedule, reminders, and detail updates",
                    ],
                ),
            ),
            illegal_transitions=(
                illegal(
                    "SM_BOOKING_CASE_STATUS",
                    "commit_pending",
                    "booked",
                    issue_type="booked_from_transport_or_weak_supplier_acceptance",
                    dangerous="Provider acceptance or local success toast could imply booked truth before authoritative confirmation.",
                    correction="Only strong booking truth may enter booked. Otherwise remain confirmation_pending or supplier_reconciliation_pending with an ExternalConfirmationGate.",
                    invariants=["INV_NO_BUSINESS_SUCCESS_FROM_TRANSPORT", "INV_CONFIRMATION_AMBIGUITY_STAYS_EXPLICIT"],
                    source_refs=[
                        "phase-4-the-booking-engine.md#4A Booking contract, case model, and state machine",
                    ],
                    forensic_refs=("forensic-audit-findings.md#Finding 72", "forensic-audit-findings.md#Finding 73"),
                ),
                illegal(
                    "SM_BOOKING_CASE_STATUS",
                    "booked",
                    "handoff_active",
                    issue_type="child_domain_writes_canonical_request_state",
                    dangerous="Booking-domain code could write canonical Request.workflowState directly when booked or reconciled.",
                    correction="Booking emits branch-local truth and milestone evidence only; LifecycleCoordinator alone derives request-level milestone change.",
                    invariants=["INV_CHILD_DOMAINS_EMIT_SIGNALS_ONLY", "INV_COORDINATOR_OWNS_CANONICAL_MILESTONES"],
                    source_refs=[
                        "phase-4-the-booking-engine.md#4A Booking contract, case model, and state machine",
                        "phase-0-the-foundation-protocol.md#Canonical request model",
                    ],
                    forensic_refs=("forensic-audit-findings.md#Finding 74",),
                ),
            ),
            related_machine_ids=("SM_EXTERNAL_CONFIRMATION_GATE", "SM_WAITLIST_FALLBACK_TRANSFER", "SM_HUB_COORDINATION_CASE_STATUS", "SM_REQUEST_WORKFLOW_STATE"),
            notes="BookingCase owns local booking truth only. supplier_reconciliation_pending is intentionally case-local and must never be copied into Request.workflowState.",
        ),
        MachineSpec(
            machine_id="SM_WAITLIST_FALLBACK_TRANSFER",
            canonical_name="WaitlistFallbackObligation.transferState",
            owning_object_name="WaitlistFallbackObligation",
            state_axis_type="gate",
            machine_family="booking",
            phase_tags=("phase_4_booking_engine", "phase_5_network_horizon"),
            source_file="phase-4-the-booking-engine.md",
            source_heading_or_block="## 4G. Smart Waitlist and local auto-fill",
            supporting_source_refs=(),
            whether_transition_is_coordinator_owned=False,
            states=(
                s("monitoring", lane=0, order=0),
                s("armed", lane=0, order=1),
                s("transfer_pending", lane=0, order=2, classification="degraded"),
                s("transferred", lane=0, order=3),
                s("satisfied", lane=0, order=4, classification="terminal"),
                s("cancelled", lane=1, order=3, classification="terminal"),
            ),
            initial_state="monitoring",
            terminal_states=("satisfied", "cancelled"),
            supersession_states=(),
            legal_transitions=(
                tr(
                    "SM_WAITLIST_FALLBACK_TRANSFER",
                    "monitoring",
                    "armed",
                    trigger="Deadline evaluation says local waitlist is no longer comfortably safe.",
                    guards=["offerabilityState = fallback_required | overdue"],
                    proofs=["WaitlistDeadlineEvaluation", "WaitlistFallbackObligation"],
                    related_objects=["WaitlistDeadlineEvaluation"],
                    blockers=["Fallback obligation remains open until callback or hub transfer settles"],
                    source_refs=[
                        "phase-4-the-booking-engine.md#4G Smart Waitlist and local auto-fill",
                    ],
                ),
                tr(
                    "SM_WAITLIST_FALLBACK_TRANSFER",
                    "armed",
                    "transfer_pending",
                    trigger="Callback or hub transfer has been chosen but linkage is not yet durable.",
                    guards=["requiredFallbackRoute is callback or hub"],
                    proofs=["WaitlistFallbackObligation(transferState = transfer_pending)"],
                    related_objects=["CallbackCase", "HubCoordinationCase"],
                    source_refs=[
                        "phase-4-the-booking-engine.md#4G Smart Waitlist and local auto-fill",
                    ],
                ),
                tr(
                    "SM_WAITLIST_FALLBACK_TRANSFER",
                    "transfer_pending",
                    "transferred",
                    trigger="Callback or hub branch is durably linked to the same booking lineage.",
                    guards=["CallbackCase or HubCoordinationCase exists on the same lineage fence"],
                    proofs=["CallbackCase | HubCoordinationCase", "LineageCaseLink"],
                    related_objects=["CallbackCase", "HubCoordinationCase", "LineageCaseLink"],
                    source_refs=[
                        "phase-4-the-booking-engine.md#4G Smart Waitlist and local auto-fill",
                        "phase-5-the-network-horizon.md#5G No-slot handling, urgent bounce-back, callback fallback, and reopen mechanics",
                    ],
                ),
                tr(
                    "SM_WAITLIST_FALLBACK_TRANSFER",
                    "transferred",
                    "satisfied",
                    trigger="Transferred branch becomes the authoritative continuation path.",
                    guards=["Current waitlist continuation truth no longer claims safe local waiting"],
                    proofs=["WaitlistContinuationTruthProjection(patientVisibleState = callback_expected | hub_review_pending)"],
                    related_objects=["WaitlistContinuationTruthProjection"],
                    source_refs=[
                        "phase-4-the-booking-engine.md#4G Smart Waitlist and local auto-fill",
                    ],
                ),
                tr(
                    "SM_WAITLIST_FALLBACK_TRANSFER",
                    "monitoring",
                    "cancelled",
                    trigger="Local booking succeeds before fallback obligation activates.",
                    guards=["Current BookingConfirmationTruthProjection is confirmed"],
                    proofs=["BookingConfirmationTruthProjection(confirmationTruthState = confirmed)"],
                    related_objects=["BookingConfirmationTruthProjection"],
                    source_refs=[
                        "phase-4-the-booking-engine.md#4G Smart Waitlist and local auto-fill",
                    ],
                ),
            ),
            illegal_transitions=(
                illegal(
                    "SM_WAITLIST_FALLBACK_TRANSFER",
                    "armed",
                    "satisfied",
                    issue_type="fallback_obligation_cleared_without_durable_transfer",
                    dangerous="A local waitlist could claim the callback or hub debt is gone before the new branch is actually linked and patient-visible.",
                    correction="Fallback obligation remains explicit through transfer_pending and transferred until the new continuation path is durably linked.",
                    invariants=["INV_WAITLIST_AND_HUB_TRANSFER_EXPLICIT"],
                    source_refs=[
                        "phase-4-the-booking-engine.md#4G Smart Waitlist and local auto-fill",
                        "phase-5-the-network-horizon.md#5G No-slot handling, urgent bounce-back, callback fallback, and reopen mechanics",
                    ],
                    forensic_refs=("forensic-audit-findings.md#Finding 76",),
                ),
            ),
            related_machine_ids=("SM_BOOKING_CASE_STATUS", "SM_HUB_COORDINATION_CASE_STATUS", "SM_CALLBACK_CASE_STATE"),
            notes="Waitlist fallback debt is durable. Deadlines, fallback route, and transfer completion remain explicit rather than collapsing into generic booking failure or generic callback copy.",
        ),
        MachineSpec(
            machine_id="SM_HUB_COORDINATION_CASE_STATUS",
            canonical_name="HubCoordinationCase.status",
            owning_object_name="HubCoordinationCase",
            state_axis_type="case_local",
            machine_family="hub_coordination",
            phase_tags=("phase_5_network_horizon",),
            source_file="phase-5-the-network-horizon.md",
            source_heading_or_block="## 5A. Network coordination contract, case model, and state machine",
            supporting_source_refs=(
                "forensic-audit-findings.md#Finding 76 - Phase 5 let hub-domain logic write canonical request state directly on booked and return paths",
            ),
            whether_transition_is_coordinator_owned=False,
            states=(
                s("hub_requested", lane=0, order=0),
                s("intake_validated", lane=0, order=1),
                s("queued", lane=0, order=2),
                s("claimed", lane=0, order=3),
                s("candidate_searching", lane=0, order=4),
                s("candidates_ready", lane=0, order=5),
                s("coordinator_selecting", lane=0, order=6),
                s("alternatives_offered", lane=1, order=6, classification="degraded"),
                s("patient_choice_pending", lane=1, order=7, classification="degraded"),
                s("callback_transfer_pending", lane=2, order=7, classification="degraded"),
                s("callback_offered", lane=2, order=8, classification="degraded"),
                s("escalated_back", lane=3, order=8, classification="degraded"),
                s("candidate_revalidating", lane=0, order=7),
                s("native_booking_pending", lane=0, order=8),
                s("confirmation_pending", lane=0, order=9, classification="degraded"),
                s("booked_pending_practice_ack", lane=0, order=10, classification="degraded"),
                s("booked", lane=0, order=11),
                s("closed", lane=0, order=12, classification="terminal"),
            ),
            initial_state="hub_requested",
            terminal_states=("closed",),
            supersession_states=(),
            legal_transitions=(
                tr(
                    "SM_HUB_COORDINATION_CASE_STATUS",
                    "hub_requested",
                    "intake_validated",
                    trigger="Network request validates onto one explicit hub lineage branch.",
                    guards=["Hub child LineageCaseLink is current for the same RequestLineage"],
                    proofs=["NetworkBookingRequest", "LineageCaseLink"],
                    related_objects=["NetworkBookingRequest", "LineageCaseLink"],
                    source_refs=[
                        "phase-5-the-network-horizon.md#5A Network coordination contract, case model, and state machine",
                    ],
                ),
                tr(
                    "SM_HUB_COORDINATION_CASE_STATUS",
                    "intake_validated",
                    "queued",
                    trigger="Hub case enters the coordination queue.",
                    guards=["Policy evaluation exists"],
                    proofs=["NetworkCoordinationPolicyEvaluation"],
                    related_objects=["NetworkCoordinationPolicyEvaluation"],
                    source_refs=[
                        "phase-5-the-network-horizon.md#5A Network coordination contract, case model, and state machine",
                    ],
                ),
                tr(
                    "SM_HUB_COORDINATION_CASE_STATUS",
                    "queued",
                    "claimed",
                    trigger="Ownership lease is acquired for live hub coordination.",
                    guards=["ownershipFenceToken and ownershipEpoch are current"],
                    proofs=["HubOwnershipTransition(transitionState = accepted)", "RequestLifecycleLease"],
                    related_objects=["HubOwnershipTransition", "RequestLifecycleLease"],
                    blockers=["Active ownership transitions and open-case blockers block closure"],
                    source_refs=[
                        "phase-5-the-network-horizon.md#5A Network coordination contract, case model, and state machine",
                    ],
                ),
                tr(
                    "SM_HUB_COORDINATION_CASE_STATUS",
                    "claimed",
                    "candidate_searching",
                    trigger="Network capacity snapshot generation begins.",
                    guards=["Policy tuple remains current"],
                    proofs=["NetworkCandidateSnapshot"],
                    related_objects=["NetworkCandidateSnapshot"],
                    source_refs=[
                        "phase-5-the-network-horizon.md#5C Enhanced Access policy engine and network capacity ingestion",
                    ],
                ),
                tr(
                    "SM_HUB_COORDINATION_CASE_STATUS",
                    "candidate_searching",
                    "candidates_ready",
                    trigger="Candidate snapshot and decision plan are computed.",
                    guards=["Snapshot is trustworthy enough for diagnostic or offerable use"],
                    proofs=["NetworkCandidateSnapshot", "CrossSiteDecisionPlan"],
                    related_objects=["NetworkCandidateSnapshot", "CrossSiteDecisionPlan"],
                    source_refs=[
                        "phase-5-the-network-horizon.md#5D Coordination queue, candidate ranking, and SLA engine",
                    ],
                ),
                tr(
                    "SM_HUB_COORDINATION_CASE_STATUS",
                    "candidates_ready",
                    "coordinator_selecting",
                    trigger="Coordinator begins selection on the current ranked frontier.",
                    guards=["Decision plan is current and policy tuple still matches"],
                    proofs=["CrossSiteDecisionPlan"],
                    related_objects=["CrossSiteDecisionPlan"],
                    source_refs=[
                        "phase-5-the-network-horizon.md#5E Alternative offers, patient choice, and network-facing UX",
                    ],
                ),
                tr(
                    "SM_HUB_COORDINATION_CASE_STATUS",
                    "coordinator_selecting",
                    "alternatives_offered",
                    trigger="A real AlternativeOfferSession is generated for patient-visible choice.",
                    guards=["AlternativeOfferSession is current and policy-valid"],
                    proofs=["AlternativeOfferSession", "AlternativeOfferOptimisationPlan"],
                    related_objects=["AlternativeOfferSession", "AlternativeOfferOptimisationPlan"],
                    source_refs=[
                        "phase-5-the-network-horizon.md#5E Alternative offers, patient choice, and network-facing UX",
                    ],
                ),
                tr(
                    "SM_HUB_COORDINATION_CASE_STATUS",
                    "alternatives_offered",
                    "patient_choice_pending",
                    trigger="Live offer set is delivered and the case waits for patient response.",
                    guards=["Offer session remains current and visible"],
                    proofs=["HubOfferToConfirmationTruthProjection(offerState = patient_choice_pending)"],
                    related_objects=["HubOfferToConfirmationTruthProjection"],
                    source_refs=[
                        "phase-5-the-network-horizon.md#5E Alternative offers, patient choice, and network-facing UX",
                    ],
                ),
                tr(
                    "SM_HUB_COORDINATION_CASE_STATUS",
                    "coordinator_selecting",
                    "candidate_revalidating",
                    trigger="A selected candidate is rechecked against live capacity and policy before native booking.",
                    guards=["Selected candidate source version and policy tuple are current"],
                    proofs=["HubCommitAttempt", "HubOfferToConfirmationTruthProjection(confirmationTruthState = candidate_revalidating)"],
                    related_objects=["HubCommitAttempt", "HubOfferToConfirmationTruthProjection"],
                    source_refs=[
                        "phase-5-the-network-horizon.md#5F Native hub booking commit, practice continuity, and cross-org messaging",
                    ],
                ),
                tr(
                    "SM_HUB_COORDINATION_CASE_STATUS",
                    "candidate_revalidating",
                    "native_booking_pending",
                    trigger="Native booking commit is underway.",
                    guards=["Selected candidate remains current under the active snapshot"],
                    proofs=["HubCommitAttempt", "HubOfferToConfirmationTruthProjection(confirmationTruthState = native_booking_pending)"],
                    related_objects=["HubCommitAttempt", "HubOfferToConfirmationTruthProjection"],
                    source_refs=[
                        "phase-5-the-network-horizon.md#5F Native hub booking commit, practice continuity, and cross-org messaging",
                    ],
                ),
                tr(
                    "SM_HUB_COORDINATION_CASE_STATUS",
                    "native_booking_pending",
                    "confirmation_pending",
                    trigger="Native booking commit still awaits authoritative confirmation.",
                    guards=["Current truth tuple still references the active attempt"],
                    proofs=["HubOfferToConfirmationTruthProjection(confirmationTruthState = confirmation_pending)"],
                    related_objects=["HubOfferToConfirmationTruthProjection", "ExternalConfirmationGate"],
                    blockers=["Confirmation ambiguity and practice visibility remain open"],
                    source_refs=[
                        "phase-5-the-network-horizon.md#5F Native hub booking commit, practice continuity, and cross-org messaging",
                    ],
                ),
                tr(
                    "SM_HUB_COORDINATION_CASE_STATUS",
                    "confirmation_pending",
                    "booked_pending_practice_ack",
                    trigger="Hub-native confirmation settles but the origin practice still owes acknowledgement.",
                    guards=["Current truth projection confirms booking and practice ack generation is current"],
                    proofs=["HubOfferToConfirmationTruthProjection(confirmationTruthState = confirmed_pending_practice_ack)", "PracticeAcknowledgementRecord(ackState = pending)"],
                    related_objects=["HubOfferToConfirmationTruthProjection", "PracticeAcknowledgementRecord"],
                    blockers=["Practice acknowledgement remains an open case blocker"],
                    source_refs=[
                        "phase-5-the-network-horizon.md#5F Native hub booking commit, practice continuity, and cross-org messaging",
                    ],
                ),
                tr(
                    "SM_HUB_COORDINATION_CASE_STATUS",
                    "booked_pending_practice_ack",
                    "booked",
                    trigger="Current practice acknowledgement debt is resolved or policy-exempt for the current generation.",
                    guards=["PracticeAcknowledgementRecord ackState = acknowledged | not_required"],
                    proofs=["PracticeAcknowledgementRecord", "HubOfferToConfirmationTruthProjection(practiceVisibilityState = acknowledged | exception_granted)"],
                    related_objects=["PracticeAcknowledgementRecord", "HubOfferToConfirmationTruthProjection"],
                    source_refs=[
                        "phase-5-the-network-horizon.md#5H Patient communications, network reminders, manage flows, and practice visibility",
                    ],
                ),
                tr(
                    "SM_HUB_COORDINATION_CASE_STATUS",
                    "coordinator_selecting",
                    "callback_transfer_pending",
                    trigger="Callback fallback is selected but not yet durably linked.",
                    guards=["Fallback type is callback_request or callback_transfer"],
                    proofs=["HubFallbackRecord(state = proposed)", "CallbackFallbackRecord"],
                    related_objects=["HubFallbackRecord", "CallbackCase"],
                    blockers=["Fallback linkage remains a closure blocker"],
                    source_refs=[
                        "phase-5-the-network-horizon.md#5G No-slot handling, urgent bounce-back, callback fallback, and reopen mechanics",
                    ],
                ),
                tr(
                    "SM_HUB_COORDINATION_CASE_STATUS",
                    "callback_transfer_pending",
                    "callback_offered",
                    trigger="Current CallbackCase and CallbackExpectationEnvelope are durably linked and patient-visible.",
                    guards=["CallbackExpectationEnvelope exists for the current fallback fence"],
                    proofs=["HubFallbackRecord(state = transferred)", "CallbackExpectationEnvelope"],
                    related_objects=["HubFallbackRecord", "CallbackExpectationEnvelope", "CallbackCase"],
                    source_refs=[
                        "phase-5-the-network-horizon.md#5G No-slot handling, urgent bounce-back, callback fallback, and reopen mechanics",
                    ],
                ),
                tr(
                    "SM_HUB_COORDINATION_CASE_STATUS",
                    "coordinator_selecting",
                    "escalated_back",
                    trigger="Case is durably returned to practice rather than staying in hub coordination.",
                    guards=["HubReturnToPracticeRecord exists"],
                    proofs=["HubReturnToPracticeRecord", "HubFallbackRecord"],
                    related_objects=["HubFallbackRecord"],
                    source_refs=[
                        "phase-5-the-network-horizon.md#5G No-slot handling, urgent bounce-back, callback fallback, and reopen mechanics",
                    ],
                ),
                tr(
                    "SM_HUB_COORDINATION_CASE_STATUS",
                    "booked",
                    "closed",
                    trigger="OpenCaseBlockers on the hub case are empty and closure is legal.",
                    guards=["Practice visibility, fallback linkage, supplier drift, and ownership blockers are all cleared"],
                    proofs=["HubCaseClosureRecord", "RequestClosureRecord(decision = close)"],
                    related_objects=["RequestClosureRecord", "HubOfferToConfirmationTruthProjection"],
                    source_refs=[
                        "phase-5-the-network-horizon.md#5A Network coordination contract, case model, and state machine",
                    ],
                ),
            ),
            illegal_transitions=(
                illegal(
                    "SM_HUB_COORDINATION_CASE_STATUS",
                    "confirmation_pending",
                    "booked",
                    issue_type="hub_books_without_practice_visibility_clearance",
                    dangerous="The case could look fully booked while practice acknowledgement debt or fallback linkage is still unresolved.",
                    correction="Keep booked_pending_practice_ack explicit and do not close the hub branch until acknowledgement or policy exception is current for the latest generation.",
                    invariants=["INV_CONFIRMATION_AMBIGUITY_STAYS_EXPLICIT", "INV_WAITLIST_AND_HUB_TRANSFER_EXPLICIT"],
                    source_refs=[
                        "phase-5-the-network-horizon.md#5F Native hub booking commit, practice continuity, and cross-org messaging",
                        "phase-5-the-network-horizon.md#5H Patient communications, network reminders, manage flows, and practice visibility",
                    ],
                    forensic_refs=("forensic-audit-findings.md#Finding 76",),
                ),
                illegal(
                    "SM_HUB_COORDINATION_CASE_STATUS",
                    "booked",
                    "handoff_active",
                    issue_type="hub_writes_request_milestone_directly",
                    dangerous="Hub code could overwrite canonical request workflow or closure meaning directly from hub-local truth.",
                    correction="Hub emits case-local truth and milestone evidence only; LifecycleCoordinator derives request-level milestone and closure semantics.",
                    invariants=["INV_CHILD_DOMAINS_EMIT_SIGNALS_ONLY", "INV_COORDINATOR_OWNS_CANONICAL_MILESTONES"],
                    source_refs=[
                        "phase-5-the-network-horizon.md#5A Network coordination contract, case model, and state machine",
                        "phase-0-the-foundation-protocol.md#Canonical request model",
                    ],
                    forensic_refs=("forensic-audit-findings.md#Finding 76",),
                ),
            ),
            related_machine_ids=("SM_HUB_CONFIRMATION_TRUTH", "SM_WAITLIST_FALLBACK_TRANSFER", "SM_CALLBACK_CASE_STATE", "SM_REQUEST_WORKFLOW_STATE"),
            notes="HubCoordinationCase is an operational workflow state, not the patient-facing truth contract. Practice visibility and closeability derive from the current truth projection, not raw status labels.",
        ),
        MachineSpec(
            machine_id="SM_HUB_CONFIRMATION_TRUTH",
            canonical_name="HubOfferToConfirmationTruthProjection.confirmationTruthState",
            owning_object_name="HubOfferToConfirmationTruthProjection",
            state_axis_type="continuity",
            machine_family="hub_coordination",
            phase_tags=("phase_5_network_horizon",),
            source_file="phase-5-the-network-horizon.md",
            source_heading_or_block="## 5F. Native hub booking commit, practice continuity, and cross-org messaging",
            supporting_source_refs=(),
            whether_transition_is_coordinator_owned=False,
            states=(
                s("no_commit", lane=0, order=0),
                s("candidate_revalidating", lane=0, order=1),
                s("native_booking_pending", lane=0, order=2),
                s("confirmation_pending", lane=0, order=3, classification="degraded"),
                s("confirmed_pending_practice_ack", lane=0, order=4, classification="degraded"),
                s("confirmed", lane=0, order=5, classification="terminal"),
                s("disputed", lane=1, order=4, classification="degraded"),
                s("expired", lane=1, order=5, classification="terminal"),
                s("superseded", lane=1, order=6, classification="terminal"),
            ),
            initial_state="no_commit",
            terminal_states=("confirmed", "expired", "superseded"),
            supersession_states=("superseded",),
            legal_transitions=(
                tr(
                    "SM_HUB_CONFIRMATION_TRUTH",
                    "no_commit",
                    "candidate_revalidating",
                    trigger="A selected hub candidate enters revalidation.",
                    guards=["Selected candidate source version and offer set hash remain current"],
                    proofs=["HubCommitAttempt", "HubOfferToConfirmationTruthProjection"],
                    related_objects=["HubCommitAttempt"],
                    source_refs=[
                        "phase-5-the-network-horizon.md#5F Native hub booking commit, practice continuity, and cross-org messaging",
                    ],
                ),
                tr(
                    "SM_HUB_CONFIRMATION_TRUTH",
                    "candidate_revalidating",
                    "native_booking_pending",
                    trigger="Native booking is dispatched on the current candidate tuple.",
                    guards=["Current offer session and selected candidate still match"],
                    proofs=["HubCommitAttempt", "HubBookingEvidenceBundle"],
                    related_objects=["HubCommitAttempt", "HubBookingEvidenceBundle"],
                    source_refs=[
                        "phase-5-the-network-horizon.md#5F Native hub booking commit, practice continuity, and cross-org messaging",
                    ],
                ),
                tr(
                    "SM_HUB_CONFIRMATION_TRUTH",
                    "native_booking_pending",
                    "confirmation_pending",
                    trigger="Commit started but authoritative confirmation is not yet complete.",
                    guards=["Truth tuple remains current"],
                    proofs=["HubOfferToConfirmationTruthProjection(confirmationTruthState = confirmation_pending)"],
                    related_objects=["ExternalConfirmationGate"],
                    source_refs=[
                        "phase-5-the-network-horizon.md#5F Native hub booking commit, practice continuity, and cross-org messaging",
                    ],
                ),
                tr(
                    "SM_HUB_CONFIRMATION_TRUTH",
                    "confirmation_pending",
                    "confirmed_pending_practice_ack",
                    trigger="Booking confirmation is authoritative enough, but origin-practice visibility debt remains.",
                    guards=["Current ackGeneration is unresolved"],
                    proofs=["HubAppointmentRecord", "PracticeAcknowledgementRecord(ackState = pending)"],
                    related_objects=["HubAppointmentRecord", "PracticeAcknowledgementRecord"],
                    source_refs=[
                        "phase-5-the-network-horizon.md#5F Native hub booking commit, practice continuity, and cross-org messaging",
                        "phase-5-the-network-horizon.md#5H Patient communications, network reminders, manage flows, and practice visibility",
                    ],
                ),
                tr(
                    "SM_HUB_CONFIRMATION_TRUTH",
                    "confirmed_pending_practice_ack",
                    "confirmed",
                    trigger="Practice acknowledgement debt clears on the current generation.",
                    guards=["ackState = acknowledged | not_required"],
                    proofs=["PracticeAcknowledgementRecord", "HubOfferToConfirmationTruthProjection(practiceVisibilityState = acknowledged | exception_granted)"],
                    related_objects=["PracticeAcknowledgementRecord"],
                    source_refs=[
                        "phase-5-the-network-horizon.md#5H Patient communications, network reminders, manage flows, and practice visibility",
                    ],
                ),
                tr(
                    "SM_HUB_CONFIRMATION_TRUTH",
                    "confirmation_pending",
                    "disputed",
                    trigger="Competing evidence or supplier drift makes confirmation ambiguous.",
                    guards=["Current truth tuple no longer proves one calm booking chain"],
                    proofs=["HubOfferToConfirmationTruthProjection(confirmationTruthState = disputed)"],
                    related_objects=["HubCommitAttempt", "PracticeAcknowledgementRecord"],
                    source_refs=[
                        "phase-5-the-network-horizon.md#5F Native hub booking commit, practice continuity, and cross-org messaging",
                    ],
                ),
                tr(
                    "SM_HUB_CONFIRMATION_TRUTH",
                    "disputed",
                    "superseded",
                    trigger="A later authoritative tuple replaces the disputed projection.",
                    guards=["Newer truth tuple is current"],
                    proofs=["HubOfferToConfirmationTruthProjection(confirmationTruthState = superseded)"],
                    related_objects=["HubAppointmentRecord"],
                    source_refs=[
                        "phase-5-the-network-horizon.md#5F Native hub booking commit, practice continuity, and cross-org messaging",
                    ],
                ),
            ),
            illegal_transitions=(
                illegal(
                    "SM_HUB_CONFIRMATION_TRUTH",
                    "native_booking_pending",
                    "confirmed",
                    issue_type="skipping_confirmation_and_ack_debt",
                    dangerous="A hub-native booking could jump straight to confirmed calmness without explicit confirmation and practice visibility stages.",
                    correction="Use confirmation_pending and confirmed_pending_practice_ack explicitly, then clear only on current-generation acknowledgement or policy exception.",
                    invariants=["INV_CONFIRMATION_AMBIGUITY_STAYS_EXPLICIT"],
                    source_refs=[
                        "phase-5-the-network-horizon.md#5F Native hub booking commit, practice continuity, and cross-org messaging",
                    ],
                    forensic_refs=("forensic-audit-findings.md#Finding 76",),
                ),
            ),
            related_machine_ids=("SM_HUB_COORDINATION_CASE_STATUS", "SM_EXTERNAL_CONFIRMATION_GATE", "SM_REQUEST_CLOSURE_DECISION"),
            notes="HubOfferToConfirmationTruthProjection is the monotone bridge from hub offer or commit into booked and practice-visible truth. Older projections remain auditable history only.",
        ),
        MachineSpec(
            machine_id="SM_PHARMACY_CASE_STATUS",
            canonical_name="PharmacyCase.status",
            owning_object_name="PharmacyCase",
            state_axis_type="case_local",
            machine_family="pharmacy",
            phase_tags=("phase_6_pharmacy_loop",),
            source_file="phase-6-the-pharmacy-loop.md",
            source_heading_or_block="## 6A. Pharmacy contract, case model, and state machine",
            supporting_source_refs=(
                "forensic-audit-findings.md#Finding 77 - Phase 6 let pharmacy-domain logic write canonical request state directly on resolve and reopen paths",
                "forensic-audit-findings.md#Finding 78 - Phase 6 used the generic term reconciliation_required for pharmacy outcome ambiguity",
                "forensic-audit-findings.md#Finding 79 - Phase 6 weak-source matching did not clearly stop at a case-local review state",
            ),
            whether_transition_is_coordinator_owned=False,
            states=(
                s("candidate_received", lane=0, order=0),
                s("rules_evaluating", lane=0, order=1),
                s("ineligible_returned", lane=1, order=2, classification="terminal"),
                s("eligible_choice_pending", lane=0, order=2),
                s("provider_selected", lane=0, order=3),
                s("consent_pending", lane=1, order=3, classification="degraded"),
                s("package_ready", lane=0, order=4),
                s("dispatch_pending", lane=0, order=5),
                s("referred", lane=0, order=6),
                s("consultation_outcome_pending", lane=0, order=7),
                s("resolved_by_pharmacy", lane=0, order=8),
                s("unresolved_returned", lane=1, order=8),
                s("urgent_bounce_back", lane=2, order=8, classification="degraded"),
                s("no_contact_return_pending", lane=3, order=8, classification="degraded"),
                s("outcome_reconciliation_pending", lane=4, order=8, classification="degraded"),
                s("closed", lane=0, order=9, classification="terminal"),
            ),
            initial_state="candidate_received",
            terminal_states=("ineligible_returned", "closed"),
            supersession_states=(),
            legal_transitions=(
                tr(
                    "SM_PHARMACY_CASE_STATUS",
                    "candidate_received",
                    "rules_evaluating",
                    trigger="Service type and pathway eligibility are computed for the new pharmacy branch.",
                    guards=["Pharmacy child LineageCaseLink is current", "DecisionEpoch is unsuperseded"],
                    proofs=["ServiceTypeDecision", "PathwayEligibilityEvaluation"],
                    related_objects=["ServiceTypeDecision", "PathwayEligibilityEvaluation"],
                    source_refs=[
                        "phase-6-the-pharmacy-loop.md#6A Pharmacy contract, case model, and state machine",
                    ],
                ),
                tr(
                    "SM_PHARMACY_CASE_STATUS",
                    "rules_evaluating",
                    "ineligible_returned",
                    trigger="Pathway rules reject safe pharmacy progression and return the work.",
                    guards=["Eligibility evaluation recommends return"],
                    proofs=["PathwayEligibilityEvaluation(recommendedLane = return)"],
                    related_objects=["PathwayEligibilityEvaluation"],
                    source_refs=[
                        "phase-6-the-pharmacy-loop.md#6B Eligibility engine, pathway rules, and versioned policy packs",
                    ],
                ),
                tr(
                    "SM_PHARMACY_CASE_STATUS",
                    "rules_evaluating",
                    "eligible_choice_pending",
                    trigger="Pathway rules allow provider choice and referral progression.",
                    guards=["Eligibility evaluation recommends pharmacy lane"],
                    proofs=["PathwayEligibilityEvaluation(recommendedLane = pharmacy)"],
                    related_objects=["PharmacyChoiceSession"],
                    source_refs=[
                        "phase-6-the-pharmacy-loop.md#6B Eligibility engine, pathway rules, and versioned policy packs",
                    ],
                ),
                tr(
                    "SM_PHARMACY_CASE_STATUS",
                    "eligible_choice_pending",
                    "provider_selected",
                    trigger="A provider is durably selected from the current choice session.",
                    guards=["Choice session and ranking tuple remain current"],
                    proofs=["PharmacyChoiceSession", "PharmacyChoiceOverrideAcknowledgement when required"],
                    related_objects=["PharmacyChoiceSession", "PharmacyChoiceProof"],
                    source_refs=[
                        "phase-6-the-pharmacy-loop.md#6C Pharmacy discovery, provider choice, and directory abstraction",
                    ],
                ),
                tr(
                    "SM_PHARMACY_CASE_STATUS",
                    "provider_selected",
                    "consent_pending",
                    trigger="Selection exists but valid referral consent is missing, expired, or withdrawn.",
                    guards=["Current PharmacyConsentCheckpoint is not satisfied"],
                    proofs=["PharmacyConsentCheckpoint(checkpointState = expiring | renewal_required | withdrawn | revoked_post_dispatch | withdrawal_reconciliation | recovery_required)"],
                    related_objects=["PharmacyConsentCheckpoint"],
                    blockers=["Consent checkpoint blocks dispatch and calm pharmacy reassurance"],
                    source_refs=[
                        "phase-6-the-pharmacy-loop.md#6A Pharmacy contract, case model, and state machine",
                    ],
                ),
                tr(
                    "SM_PHARMACY_CASE_STATUS",
                    "provider_selected",
                    "package_ready",
                    trigger="Valid consent exists and the canonical referral package is frozen.",
                    guards=["Current PharmacyConsentCheckpoint.checkpointState = satisfied"],
                    proofs=["PharmacyConsentCheckpoint(checkpointState = satisfied)", "PharmacyReferralPackage(packageState = frozen)"],
                    related_objects=["PharmacyConsentCheckpoint", "PharmacyReferralPackage"],
                    source_refs=[
                        "phase-6-the-pharmacy-loop.md#6D Referral pack composer, dispatch adapters, and transport contract",
                    ],
                ),
                tr(
                    "SM_PHARMACY_CASE_STATUS",
                    "package_ready",
                    "consent_pending",
                    trigger="Provider, scope, or consent drift invalidates the prior package.",
                    guards=["Consent checkpoint no longer remains satisfied"],
                    proofs=["PharmacyConsentCheckpoint", "PharmacyConsentRevocationRecord"],
                    related_objects=["PharmacyConsentCheckpoint", "PharmacyConsentRevocationRecord"],
                    source_refs=[
                        "phase-6-the-pharmacy-loop.md#6D Referral pack composer, dispatch adapters, and transport contract",
                    ],
                ),
                tr(
                    "SM_PHARMACY_CASE_STATUS",
                    "package_ready",
                    "dispatch_pending",
                    trigger="Dispatch attempt begins on the frozen package and provider tuple.",
                    guards=["Current consent checkpoint remains satisfied", "Current route intent and request ownership fences still match"],
                    proofs=["PharmacyDispatchAttempt(status = created)", "CommandActionRecord"],
                    related_objects=["PharmacyDispatchAttempt", "PharmacyConsentCheckpoint", "RequestLifecycleLease"],
                    source_refs=[
                        "phase-6-the-pharmacy-loop.md#6D Referral pack composer, dispatch adapters, and transport contract",
                    ],
                ),
                tr(
                    "SM_PHARMACY_CASE_STATUS",
                    "dispatch_pending",
                    "referred",
                    trigger="Dispatch proof is sufficient for referral handoff under the transport assurance profile.",
                    guards=["Relevant confirmation gate is created or refreshed"],
                    proofs=["PharmacyDispatchAttempt(status = proof_satisfied)", "ExternalConfirmationGate"],
                    related_objects=["PharmacyDispatchAttempt", "ExternalConfirmationGate"],
                    source_refs=[
                        "phase-6-the-pharmacy-loop.md#6D Referral pack composer, dispatch adapters, and transport contract",
                    ],
                ),
                tr(
                    "SM_PHARMACY_CASE_STATUS",
                    "referred",
                    "consultation_outcome_pending",
                    trigger="Referral is durably dispatched and the case awaits pharmacy outcome.",
                    guards=["Current dispatch tuple remains matched to the package and provider"],
                    proofs=["PharmacyDispatchAttempt(status = proof_satisfied)", "PharmacyContinuityEvidenceProjection"],
                    related_objects=["PharmacyDispatchAttempt", "PharmacyContinuityEvidenceProjection"],
                    source_refs=[
                        "phase-6-the-pharmacy-loop.md#6E Patient instructions, referral status, and pharmacy-facing UX logic",
                    ],
                ),
                tr(
                    "SM_PHARMACY_CASE_STATUS",
                    "consultation_outcome_pending",
                    "resolved_by_pharmacy",
                    trigger="Pharmacy outcome is strong enough to settle the branch locally.",
                    guards=["Outcome source correlation is strong and no reconciliation gate remains open"],
                    proofs=["PharmacyOutcomeRecord", "PharmacyOutcomeMilestone"],
                    related_objects=["PharmacyOutcomeRecord", "CommandSettlementRecord"],
                    source_refs=[
                        "phase-6-the-pharmacy-loop.md#6F Outcome ingest, Update Record observation, and reconciliation",
                    ],
                ),
                tr(
                    "SM_PHARMACY_CASE_STATUS",
                    "consultation_outcome_pending",
                    "unresolved_returned",
                    trigger="Outcome proves unresolved return to practice rather than pharmacy resolution.",
                    guards=["Return evidence is strong enough"],
                    proofs=["PharmacyOutcomeRecord", "PharmacyReopenSignal"],
                    related_objects=["PharmacyOutcomeRecord"],
                    source_refs=[
                        "phase-6-the-pharmacy-loop.md#6G Bounce-back, urgent return, and reopen mechanics",
                    ],
                ),
                tr(
                    "SM_PHARMACY_CASE_STATUS",
                    "consultation_outcome_pending",
                    "urgent_bounce_back",
                    trigger="Urgent return or bounce-back is required.",
                    guards=["Urgency carry floor and bounce-back record are current"],
                    proofs=["PharmacyBounceBackRecord"],
                    related_objects=["PharmacyBounceBackRecord"],
                    blockers=["Urgent bounce-back remains an explicit continuation path"],
                    source_refs=[
                        "phase-6-the-pharmacy-loop.md#6G Bounce-back, urgent return, and reopen mechanics",
                    ],
                ),
                tr(
                    "SM_PHARMACY_CASE_STATUS",
                    "consultation_outcome_pending",
                    "no_contact_return_pending",
                    trigger="No-contact return is required rather than quiet closure.",
                    guards=["Reachability plan or outcome evidence proves no contact return"],
                    proofs=["PharmacyReachabilityPlan", "PharmacyOutcomeRecord"],
                    related_objects=["PharmacyReachabilityPlan", "PharmacyOutcomeRecord"],
                    blockers=["No-contact return must remain explicit and cannot auto-close"],
                    source_refs=[
                        "phase-6-the-pharmacy-loop.md#6G Bounce-back, urgent return, and reopen mechanics",
                    ],
                ),
                tr(
                    "SM_PHARMACY_CASE_STATUS",
                    "consultation_outcome_pending",
                    "outcome_reconciliation_pending",
                    trigger="Weak or ambiguous outcome truth requires case-local reconciliation review.",
                    guards=["Current outcome source is weakly correlated or contradictory"],
                    proofs=["PharmacyOutcomeReconciliationGate", "PharmacyOutcomeRecord"],
                    related_objects=["PharmacyOutcomeReconciliationGate", "PharmacyOutcomeRecord"],
                    blockers=["Outcome reconciliation remains open until resolved"],
                    source_refs=[
                        "phase-6-the-pharmacy-loop.md#6F Outcome ingest, Update Record observation, and reconciliation",
                    ],
                ),
                tr(
                    "SM_PHARMACY_CASE_STATUS",
                    "outcome_reconciliation_pending",
                    "resolved_by_pharmacy",
                    trigger="Reconciliation resolves in favor of pharmacy completion.",
                    guards=["Current reconciliation gate is settled"],
                    proofs=["PharmacyOutcomeReconciliationGate", "PharmacyOutcomeRecord"],
                    related_objects=["PharmacyOutcomeReconciliationGate"],
                    source_refs=[
                        "phase-6-the-pharmacy-loop.md#6F Outcome ingest, Update Record observation, and reconciliation",
                    ],
                ),
                tr(
                    "SM_PHARMACY_CASE_STATUS",
                    "outcome_reconciliation_pending",
                    "unresolved_returned",
                    trigger="Reconciliation resolves to unresolved return-to-practice.",
                    guards=["Current reconciliation gate is settled"],
                    proofs=["PharmacyOutcomeReconciliationGate", "PharmacyOutcomeRecord"],
                    related_objects=["PharmacyOutcomeReconciliationGate"],
                    source_refs=[
                        "phase-6-the-pharmacy-loop.md#6G Bounce-back, urgent return, and reopen mechanics",
                    ],
                ),
                tr(
                    "SM_PHARMACY_CASE_STATUS",
                    "outcome_reconciliation_pending",
                    "urgent_bounce_back",
                    trigger="Reconciliation concludes urgent bounce-back is required.",
                    guards=["Current reconciliation gate is settled"],
                    proofs=["PharmacyOutcomeReconciliationGate", "PharmacyBounceBackRecord"],
                    related_objects=["PharmacyOutcomeReconciliationGate", "PharmacyBounceBackRecord"],
                    source_refs=[
                        "phase-6-the-pharmacy-loop.md#6G Bounce-back, urgent return, and reopen mechanics",
                    ],
                ),
                tr(
                    "SM_PHARMACY_CASE_STATUS",
                    "outcome_reconciliation_pending",
                    "no_contact_return_pending",
                    trigger="Reconciliation concludes no-contact return remains the live branch.",
                    guards=["Current reconciliation gate is settled"],
                    proofs=["PharmacyOutcomeReconciliationGate", "PharmacyReachabilityPlan"],
                    related_objects=["PharmacyOutcomeReconciliationGate", "PharmacyReachabilityPlan"],
                    source_refs=[
                        "phase-6-the-pharmacy-loop.md#6G Bounce-back, urgent return, and reopen mechanics",
                    ],
                ),
                tr(
                    "SM_PHARMACY_CASE_STATUS",
                    "resolved_by_pharmacy",
                    "closed",
                    trigger="Resolved pharmacy branch has no remaining blocker, consent, dispatch, or outcome debt.",
                    guards=["Current closure blocker refs are empty"],
                    proofs=["PharmacyClosureSettlement", "RequestClosureRecord(decision = close)"],
                    related_objects=["RequestClosureRecord"],
                    source_refs=[
                        "phase-6-the-pharmacy-loop.md#6H Practice visibility, operations queue, and pharmacy exception handling",
                    ],
                ),
            ),
            illegal_transitions=(
                illegal(
                    "SM_PHARMACY_CASE_STATUS",
                    "dispatch_pending",
                    "consultation_outcome_pending",
                    issue_type="dispatch_truth_without_confirmation_proof",
                    dangerous="Transport or provider acceptance could be mistaken for authoritative dispatch truth.",
                    correction="Only proof-satisfied dispatch on the current tuple may move the case into consultation_outcome_pending; weak modes stay behind ExternalConfirmationGate and reconciliation review when needed.",
                    invariants=["INV_NO_BUSINESS_SUCCESS_FROM_TRANSPORT", "INV_PHARMACY_CONSENT_DISPATCH_RECONCILIATION"],
                    source_refs=[
                        "phase-6-the-pharmacy-loop.md#6D Referral pack composer, dispatch adapters, and transport contract",
                    ],
                    forensic_refs=("forensic-audit-findings.md#Finding 78",),
                ),
                illegal(
                    "SM_PHARMACY_CASE_STATUS",
                    "outcome_reconciliation_pending",
                    "outcome_recorded",
                    issue_type="case_local_ambiguity_written_to_request",
                    dangerous="Weak pharmacy outcome truth could directly advance canonical request workflow.",
                    correction="outcome_reconciliation_pending stays case-local. LifecycleCoordinator derives request milestones only from settled outcome evidence and blocker evaluation.",
                    invariants=["INV_CHILD_DOMAINS_EMIT_SIGNALS_ONLY", "INV_CONFIRMATION_AMBIGUITY_STAYS_EXPLICIT"],
                    source_refs=[
                        "phase-6-the-pharmacy-loop.md#6F Outcome ingest, Update Record observation, and reconciliation",
                        "phase-0-the-foundation-protocol.md#Canonical request model",
                    ],
                    forensic_refs=("forensic-audit-findings.md#Finding 77", "forensic-audit-findings.md#Finding 78", "forensic-audit-findings.md#Finding 79"),
                ),
            ),
            related_machine_ids=("SM_PHARMACY_CONSENT_CHECKPOINT", "SM_PHARMACY_DISPATCH_STATUS", "SM_EXTERNAL_CONFIRMATION_GATE", "SM_REQUEST_WORKFLOW_STATE"),
            notes="PharmacyCase keeps consent, dispatch, weak-match review, urgent return, bounce-back, and no-contact return explicit. outcome_reconciliation_pending is case-local only.",
        ),
        MachineSpec(
            machine_id="SM_PHARMACY_CONSENT_CHECKPOINT",
            canonical_name="PharmacyConsentCheckpoint.checkpointState",
            owning_object_name="PharmacyConsentCheckpoint",
            state_axis_type="gate",
            machine_family="pharmacy",
            phase_tags=("phase_6_pharmacy_loop",),
            source_file="phase-6-the-pharmacy-loop.md",
            source_heading_or_block="## 6A. Pharmacy contract, case model, and state machine",
            supporting_source_refs=(),
            whether_transition_is_coordinator_owned=False,
            states=(
                s("satisfied", lane=0, order=0),
                s("expiring", lane=0, order=1, classification="degraded"),
                s("renewal_required", lane=0, order=2, classification="degraded"),
                s("withdrawn", lane=1, order=2, classification="terminal"),
                s("revoked_post_dispatch", lane=1, order=3, classification="degraded"),
                s("withdrawal_reconciliation", lane=1, order=4, classification="degraded"),
                s("recovery_required", lane=2, order=3, classification="degraded"),
            ),
            initial_state="satisfied",
            terminal_states=("withdrawn",),
            supersession_states=(),
            legal_transitions=(
                tr(
                    "SM_PHARMACY_CONSENT_CHECKPOINT",
                    "satisfied",
                    "expiring",
                    trigger="Consent approaches expiry under the same provider and package scope.",
                    guards=["Consent record is still current but nearing expiry"],
                    proofs=["PharmacyConsentCheckpoint(checkpointState = expiring)"],
                    related_objects=["PharmacyConsentRecord"],
                    source_refs=[
                        "phase-6-the-pharmacy-loop.md#6A Pharmacy contract, case model, and state machine",
                    ],
                ),
                tr(
                    "SM_PHARMACY_CONSENT_CHECKPOINT",
                    "expiring",
                    "renewal_required",
                    trigger="Consent can no longer authorize dispatch or continuation.",
                    guards=["Current consent expires or drifts out of scope"],
                    proofs=["PharmacyConsentCheckpoint(checkpointState = renewal_required)"],
                    related_objects=["PharmacyConsentRecord"],
                    source_refs=[
                        "phase-6-the-pharmacy-loop.md#6A Pharmacy contract, case model, and state machine",
                    ],
                ),
                tr(
                    "SM_PHARMACY_CONSENT_CHECKPOINT",
                    "satisfied",
                    "withdrawn",
                    trigger="Consent is withdrawn before dispatch.",
                    guards=["Withdrawal is authoritative and pre-dispatch"],
                    proofs=["PharmacyConsentRevocationRecord(revocationKind = pre_dispatch)"],
                    related_objects=["PharmacyConsentRevocationRecord"],
                    source_refs=[
                        "phase-6-the-pharmacy-loop.md#6A Pharmacy contract, case model, and state machine",
                    ],
                ),
                tr(
                    "SM_PHARMACY_CONSENT_CHECKPOINT",
                    "satisfied",
                    "revoked_post_dispatch",
                    trigger="Consent is revoked after dispatch already occurred.",
                    guards=["Revocation kind is post_dispatch"],
                    proofs=["PharmacyConsentRevocationRecord(revocationKind = post_dispatch)"],
                    related_objects=["PharmacyConsentRevocationRecord", "PharmacyDispatchAttempt"],
                    source_refs=[
                        "phase-6-the-pharmacy-loop.md#6A Pharmacy contract, case model, and state machine",
                    ],
                ),
                tr(
                    "SM_PHARMACY_CONSENT_CHECKPOINT",
                    "revoked_post_dispatch",
                    "withdrawal_reconciliation",
                    trigger="Withdrawal must be reconciled downstream after dispatch already left the platform.",
                    guards=["Downstream withdrawal state is not_required | requested | confirmed | disputed"],
                    proofs=["PharmacyConsentRevocationRecord", "PharmacyConsentCheckpoint(checkpointState = withdrawal_reconciliation)"],
                    related_objects=["PharmacyConsentRevocationRecord"],
                    source_refs=[
                        "phase-6-the-pharmacy-loop.md#6A Pharmacy contract, case model, and state machine",
                    ],
                ),
                tr(
                    "SM_PHARMACY_CONSENT_CHECKPOINT",
                    "withdrawal_reconciliation",
                    "recovery_required",
                    trigger="Withdrawal cannot be fully reconciled and needs governed recovery.",
                    guards=["Current downstream acknowledgement remains disputed or impossible_after_handoff"],
                    proofs=["PharmacyConsentRevocationRecord", "ReleaseRecoveryDisposition"],
                    related_objects=["ReleaseRecoveryDisposition"],
                    source_refs=[
                        "phase-6-the-pharmacy-loop.md#6A Pharmacy contract, case model, and state machine",
                    ],
                ),
            ),
            illegal_transitions=(
                illegal(
                    "SM_PHARMACY_CONSENT_CHECKPOINT",
                    "renewal_required",
                    "satisfied",
                    issue_type="stale_consent_reused_without_new_scope",
                    dangerous="A stale or expired consent could silently remain good enough for dispatch.",
                    correction="Any renewed consent must produce a fresh consent record, checkpoint, and package fingerprint on the current provider/pathway scope.",
                    invariants=["INV_PHARMACY_CONSENT_DISPATCH_RECONCILIATION"],
                    source_refs=[
                        "phase-6-the-pharmacy-loop.md#6A Pharmacy contract, case model, and state machine",
                    ],
                    forensic_refs=("forensic-audit-findings.md#Finding 78",),
                ),
            ),
            related_machine_ids=("SM_PHARMACY_CASE_STATUS", "SM_PHARMACY_DISPATCH_STATUS"),
            notes="Consent is an explicit gate. provider_selected does not imply dispatch legality until the current checkpoint is satisfied.",
        ),
        MachineSpec(
            machine_id="SM_PHARMACY_DISPATCH_STATUS",
            canonical_name="PharmacyDispatchAttempt.status",
            owning_object_name="PharmacyDispatchAttempt",
            state_axis_type="settlement",
            machine_family="pharmacy",
            phase_tags=("phase_6_pharmacy_loop",),
            source_file="phase-6-the-pharmacy-loop.md",
            source_heading_or_block="## 6D. Referral pack composer, dispatch adapters, and transport contract",
            supporting_source_refs=(),
            whether_transition_is_coordinator_owned=False,
            states=(
                s("created", lane=0, order=0),
                s("adapter_dispatched", lane=0, order=1),
                s("transport_accepted", lane=0, order=2),
                s("provider_accepted", lane=0, order=3),
                s("proof_pending", lane=0, order=4, classification="degraded"),
                s("proof_satisfied", lane=0, order=5),
                s("reconciliation_required", lane=1, order=5, classification="degraded"),
                s("superseded", lane=2, order=5, classification="terminal"),
                s("failed", lane=2, order=4, classification="terminal"),
                s("expired", lane=2, order=3, classification="terminal"),
            ),
            initial_state="created",
            terminal_states=("superseded", "failed", "expired"),
            supersession_states=("superseded",),
            legal_transitions=(
                tr(
                    "SM_PHARMACY_DISPATCH_STATUS",
                    "created",
                    "adapter_dispatched",
                    trigger="Adapter dispatch begins on the frozen plan and package tuple.",
                    guards=["dispatchPlanHash and packageHash still match", "Current RouteIntentBinding and RequestLifecycleLease fences are current"],
                    proofs=["AdapterDispatchAttempt", "CommandActionRecord"],
                    related_objects=["PharmacyDispatchPlan", "RouteIntentBinding", "RequestLifecycleLease"],
                    source_refs=[
                        "phase-6-the-pharmacy-loop.md#6D Referral pack composer, dispatch adapters, and transport contract",
                    ],
                ),
                tr(
                    "SM_PHARMACY_DISPATCH_STATUS",
                    "adapter_dispatched",
                    "transport_accepted",
                    trigger="Transport layer accepts the dispatch.",
                    guards=["Adapter receipt is accepted on the current attempt fence"],
                    proofs=["AdapterReceiptCheckpoint(transportAcceptanceState = accepted)"],
                    related_objects=["AdapterReceiptCheckpoint"],
                    source_refs=[
                        "phase-6-the-pharmacy-loop.md#6D Referral pack composer, dispatch adapters, and transport contract",
                    ],
                ),
                tr(
                    "SM_PHARMACY_DISPATCH_STATUS",
                    "transport_accepted",
                    "provider_accepted",
                    trigger="Provider-side acceptance is observed.",
                    guards=["Provider acceptance binds to the same package, provider, and outbound reference set"],
                    proofs=["AdapterReceiptCheckpoint(providerAcceptanceState = accepted)"],
                    related_objects=["AdapterReceiptCheckpoint"],
                    source_refs=[
                        "phase-6-the-pharmacy-loop.md#6D Referral pack composer, dispatch adapters, and transport contract",
                    ],
                ),
                tr(
                    "SM_PHARMACY_DISPATCH_STATUS",
                    "provider_accepted",
                    "proof_pending",
                    trigger="Provider accepted the request but authoritative dispatch proof is still pending.",
                    guards=["Active transport assurance profile still requires more proof"],
                    proofs=["PharmacyDispatchAttempt(status = proof_pending)", "ExternalConfirmationGate"],
                    related_objects=["ExternalConfirmationGate"],
                    source_refs=[
                        "phase-0-the-foundation-protocol.md#Pharmacy dispatch truth",
                        "phase-6-the-pharmacy-loop.md#6D Referral pack composer, dispatch adapters, and transport contract",
                    ],
                ),
                tr(
                    "SM_PHARMACY_DISPATCH_STATUS",
                    "proof_pending",
                    "proof_satisfied",
                    trigger="Authoritative dispatch proof lands for the same tuple.",
                    guards=["Relevant confirmation gate is satisfied enough for the transport class"],
                    proofs=["PharmacyDispatchAttempt(authoritativeProofRef != null)", "ExternalConfirmationGate(state = confirmed)"],
                    related_objects=["ExternalConfirmationGate"],
                    source_refs=[
                        "phase-0-the-foundation-protocol.md#Pharmacy dispatch truth",
                    ],
                ),
                tr(
                    "SM_PHARMACY_DISPATCH_STATUS",
                    "proof_pending",
                    "reconciliation_required",
                    trigger="Proof remains weak, conflicting, or tuple-drifted and needs review.",
                    guards=["Current tuple cannot settle proof on this attempt"],
                    proofs=["ExternalConfirmationGate(state = pending | disputed)", "PharmacyDispatchAttempt(status = reconciliation_required)"],
                    related_objects=["ExternalConfirmationGate"],
                    source_refs=[
                        "phase-0-the-foundation-protocol.md#Pharmacy dispatch truth",
                    ],
                ),
                tr(
                    "SM_PHARMACY_DISPATCH_STATUS",
                    "proof_pending",
                    "failed",
                    trigger="Authoritative failure lands on the current attempt chain.",
                    guards=["Failure binds to the same dispatch tuple"],
                    proofs=["AdapterReceiptCheckpoint(transportAcceptanceState = rejected | timed_out)", "CommandSettlementRecord(authoritativeOutcomeState = failed)"],
                    related_objects=["CommandSettlementRecord"],
                    source_refs=[
                        "phase-6-the-pharmacy-loop.md#6D Referral pack composer, dispatch adapters, and transport contract",
                    ],
                ),
                tr(
                    "SM_PHARMACY_DISPATCH_STATUS",
                    "proof_pending",
                    "expired",
                    trigger="Proof deadline elapses without authoritative settlement.",
                    guards=["proofDeadlineAt passes"],
                    proofs=["PharmacyDispatchAttempt(status = expired)"],
                    related_objects=["ExternalConfirmationGate"],
                    source_refs=[
                        "phase-6-the-pharmacy-loop.md#6D Referral pack composer, dispatch adapters, and transport contract",
                    ],
                ),
                tr(
                    "SM_PHARMACY_DISPATCH_STATUS",
                    "reconciliation_required",
                    "superseded",
                    trigger="A fresh dispatch attempt supersedes the ambiguous one.",
                    guards=["New attempt is current on the same package family or replacement package"],
                    proofs=["PharmacyDispatchAttempt(supersededByAttemptRef != null)"],
                    related_objects=["PharmacyDispatchAttempt"],
                    source_refs=[
                        "phase-6-the-pharmacy-loop.md#6D Referral pack composer, dispatch adapters, and transport contract",
                    ],
                ),
            ),
            illegal_transitions=(
                illegal(
                    "SM_PHARMACY_DISPATCH_STATUS",
                    "transport_accepted",
                    "proof_satisfied",
                    issue_type="transport_acceptance_as_dispatch_truth",
                    dangerous="Transport or provider acceptance alone could be treated as authoritative dispatch proof.",
                    correction="Dispatch truth remains explicit: acceptance may widen pending guidance but proof_satisfied needs the configured confirmation gate and tuple-bound proof.",
                    invariants=["INV_NO_BUSINESS_SUCCESS_FROM_TRANSPORT", "INV_PHARMACY_CONSENT_DISPATCH_RECONCILIATION"],
                    source_refs=[
                        "phase-0-the-foundation-protocol.md#Pharmacy dispatch truth",
                    ],
                    forensic_refs=("forensic-audit-findings.md#Finding 78",),
                ),
            ),
            related_machine_ids=("SM_EXTERNAL_CONFIRMATION_GATE", "SM_PHARMACY_CASE_STATUS", "SM_COMMAND_SETTLEMENT"),
            notes="Dispatch attempts preserve exact tuple-bound proof. Weak or manual transport remains explicit degraded posture and cannot manufacture calm dispatch truth.",
        ),
        MachineSpec(
            machine_id="SM_ADMIN_RESOLUTION_CASE",
            canonical_name="AdminResolutionCase.state",
            owning_object_name="AdminResolutionCase",
            state_axis_type="case_local",
            machine_family="admin_resolution",
            phase_tags=("self_care_admin_resolution",),
            source_file="self-care-content-and-admin-resolution-blueprint.md",
            source_heading_or_block="## Admin-resolution domain",
            supporting_source_refs=(),
            whether_transition_is_coordinator_owned=False,
            states=(
                s("queued", lane=0, order=0),
                s("in_progress", lane=0, order=1),
                s("awaiting_internal_action", lane=1, order=2, classification="degraded"),
                s("awaiting_external_dependency", lane=2, order=2, classification="degraded"),
                s("awaiting_practice_action", lane=3, order=2, classification="degraded"),
                s("patient_notified", lane=0, order=2),
                s("completed", lane=0, order=3),
                s("closed", lane=0, order=4, classification="terminal"),
                s("reopened", lane=1, order=4),
            ),
            initial_state="queued",
            terminal_states=("closed",),
            supersession_states=(),
            legal_transitions=(
                tr(
                    "SM_ADMIN_RESOLUTION_CASE",
                    "queued",
                    "in_progress",
                    trigger="Admin-resolution work is claimed on the current boundary tuple.",
                    guards=["clinicalMeaningState = bounded_admin_only", "DecisionEpoch remains current"],
                    proofs=["AdminResolutionActionRecord(actionType = claim)", "ReviewActionLease"],
                    related_objects=["AdminResolutionExperienceProjection", "DecisionEpoch"],
                    source_refs=[
                        "self-care-content-and-admin-resolution-blueprint.md#Admin-resolution domain",
                    ],
                ),
                tr(
                    "SM_ADMIN_RESOLUTION_CASE",
                    "in_progress",
                    "awaiting_internal_action",
                    trigger="Subtype profile declares internal follow-up as the dominant blocker.",
                    guards=["waitingState = awaiting_internal_action"],
                    proofs=["AdminResolutionSettlement(result = queued | waiting_dependency)"],
                    related_objects=["AdminResolutionSubtypeProfile", "AdminResolutionSettlement"],
                    source_refs=[
                        "self-care-content-and-admin-resolution-blueprint.md#Admin-resolution domain",
                    ],
                ),
                tr(
                    "SM_ADMIN_RESOLUTION_CASE",
                    "in_progress",
                    "awaiting_external_dependency",
                    trigger="Subtype profile declares external dependency as the dominant blocker.",
                    guards=["waitingState = awaiting_external_dependency"],
                    proofs=["AdminResolutionSettlement(result = waiting_dependency)"],
                    related_objects=["AdminResolutionSubtypeProfile", "AdminResolutionSettlement"],
                    source_refs=[
                        "self-care-content-and-admin-resolution-blueprint.md#Admin-resolution domain",
                    ],
                ),
                tr(
                    "SM_ADMIN_RESOLUTION_CASE",
                    "in_progress",
                    "awaiting_practice_action",
                    trigger="Subtype profile declares practice action as the dominant blocker.",
                    guards=["waitingState = awaiting_practice_action"],
                    proofs=["AdminResolutionSettlement(result = waiting_dependency)"],
                    related_objects=["AdminResolutionSubtypeProfile", "AdminResolutionSettlement"],
                    source_refs=[
                        "self-care-content-and-admin-resolution-blueprint.md#Admin-resolution domain",
                    ],
                ),
                tr(
                    "SM_ADMIN_RESOLUTION_CASE",
                    "in_progress",
                    "patient_notified",
                    trigger="Patient-facing notification is authoritatively settled under the current boundary tuple.",
                    guards=["Visibility, release, and artifact posture remain current"],
                    proofs=["AdminResolutionSettlement(result = patient_notified)", "AdminResolutionExperienceProjection"],
                    related_objects=["AdminResolutionExperienceProjection", "AdminResolutionCompletionArtifact"],
                    source_refs=[
                        "self-care-content-and-admin-resolution-blueprint.md#Admin-resolution domain",
                    ],
                ),
                tr(
                    "SM_ADMIN_RESOLUTION_CASE",
                    "patient_notified",
                    "completed",
                    trigger="Typed completion artifact is recorded for the current subtype and expectation text.",
                    guards=["Completion artifact exists and matches subtype policy"],
                    proofs=["AdminResolutionSettlement(result = completed)", "AdminResolutionCompletionArtifact(artifactState = recorded | delivered)"],
                    related_objects=["AdminResolutionCompletionArtifact", "AdminResolutionSettlement"],
                    source_refs=[
                        "self-care-content-and-admin-resolution-blueprint.md#Admin-resolution domain",
                    ],
                ),
                tr(
                    "SM_ADMIN_RESOLUTION_CASE",
                    "completed",
                    "closed",
                    trigger="Admin-resolution branch has no remaining dependency or reopen debt.",
                    guards=["boundaryReopenState = stable", "No dependency set blocker remains"],
                    proofs=["AdminResolutionExperienceProjection(boundaryReopenState = stable)", "AdminResolutionClosureRecord"],
                    related_objects=["AdminResolutionExperienceProjection", "AdminResolutionCompletionArtifact"],
                    source_refs=[
                        "self-care-content-and-admin-resolution-blueprint.md#Admin-resolution domain",
                    ],
                ),
                tr(
                    "SM_ADMIN_RESOLUTION_CASE",
                    "closed",
                    "reopened",
                    trigger="New symptom, safety preemption, invalidated advice, or dependency reopen requires bounded admin work to stop.",
                    guards=["SelfCareBoundaryDecision reopens or clinician review is required"],
                    proofs=["AdminResolutionSettlement(result = reopened_for_review)", "SelfCareBoundaryDecision"],
                    related_objects=["SelfCareBoundaryDecision"],
                    source_refs=[
                        "self-care-content-and-admin-resolution-blueprint.md#Admin-resolution domain",
                    ],
                ),
                tr(
                    "SM_ADMIN_RESOLUTION_CASE",
                    "reopened",
                    "in_progress",
                    trigger="Reopened boundary review returns the case to active admin work or reclassification.",
                    guards=["Current boundary tuple remains bounded_admin_only and writable"],
                    proofs=["AdminResolutionSettlement(result = reopened_for_review)", "AdminResolutionExperienceProjection"],
                    related_objects=["AdminResolutionExperienceProjection"],
                    source_refs=[
                        "self-care-content-and-admin-resolution-blueprint.md#Admin-resolution domain",
                    ],
                ),
            ),
            illegal_transitions=(
                illegal(
                    "SM_ADMIN_RESOLUTION_CASE",
                    "in_progress",
                    "completed",
                    issue_type="completion_without_typed_artifact",
                    dangerous="Internal admin work could appear complete without a typed completion artifact or patient-visible expectation text.",
                    correction="completed requires AdminResolutionSettlement(result = completed) and a matching AdminResolutionCompletionArtifact.",
                    invariants=["INV_PROJECTION_FRESHNESS_GATES_ACTIONABILITY"],
                    source_refs=[
                        "self-care-content-and-admin-resolution-blueprint.md#Admin-resolution domain",
                    ],
                    forensic_refs=("forensic-audit-findings.md#Finding 102",),
                ),
            ),
            related_machine_ids=("SM_DECISION_EPOCH", "SM_AUDIENCE_SURFACE_RUNTIME_BINDING"),
            notes="Admin-resolution remains bounded admin-only work. New clinical meaning, new symptoms, or invalidated advice reopen boundary review rather than widening this machine into clinical workflow.",
        ),
        MachineSpec(
            machine_id="SM_ASSISTIVE_TRUST_ENVELOPE",
            canonical_name="AssistiveCapabilityTrustEnvelope.trustState",
            owning_object_name="AssistiveCapabilityTrustEnvelope",
            state_axis_type="trust",
            machine_family="assistive",
            phase_tags=("phase_8_assistive_layer",),
            source_file="phase-8-the-assistive-layer.md",
            source_heading_or_block="## 8A. Assistive capability contract, intended-use boundaries, and policy envelope",
            supporting_source_refs=(
                "forensic-audit-findings.md#Finding 94 - The audit still treated assistive output as a generic sidecar instead of a trust-bound same-shell capability",
            ),
            whether_transition_is_coordinator_owned=False,
            states=(
                s("shadow_only", lane=0, order=0, classification="degraded"),
                s("trusted", lane=0, order=1),
                s("degraded", lane=1, order=1, classification="degraded"),
                s("quarantined", lane=2, order=1, classification="degraded"),
                s("frozen", lane=3, order=1, classification="degraded"),
            ),
            initial_state="shadow_only",
            terminal_states=(),
            supersession_states=(),
            legal_transitions=(
                tr(
                    "SM_ASSISTIVE_TRUST_ENVELOPE",
                    "shadow_only",
                    "trusted",
                    trigger="The current watch tuple, rollout verdict, trust projection, and publication posture authorize visible same-shell assistive posture.",
                    guards=["AssistiveCapabilityRolloutVerdict permits visible posture", "Current watch tuple and publication tuple are exact"],
                    proofs=["AssistiveCapabilityTrustEnvelope(trustState = trusted)", "AssistiveCapabilityRolloutVerdict", "AssistiveCapabilityTrustProjection"],
                    related_objects=["AssistiveCapabilityRolloutVerdict", "AssistiveCapabilityTrustProjection"],
                    source_refs=[
                        "phase-8-the-assistive-layer.md#8A Assistive capability contract, intended-use boundaries, and policy envelope",
                        "phase-8-the-assistive-layer.md#8G Monitoring, drift, fairness, and live safety controls",
                    ],
                ),
                tr(
                    "SM_ASSISTIVE_TRUST_ENVELOPE",
                    "trusted",
                    "degraded",
                    trigger="Trust score or continuity posture drops but provenance can still remain visible in the same shell.",
                    guards=["Current envelope still permits observe-only posture"],
                    proofs=["AssistiveCapabilityTrustEnvelope(trustState = degraded)", "AssistiveFreezeFrame"],
                    related_objects=["AssistiveFreezeFrame", "ReleaseRecoveryDisposition"],
                    degraded_posture="observe_only",
                    source_refs=[
                        "phase-8-the-assistive-layer.md#8A Assistive capability contract, intended-use boundaries, and policy envelope",
                    ],
                ),
                tr(
                    "SM_ASSISTIVE_TRUST_ENVELOPE",
                    "trusted",
                    "quarantined",
                    trigger="Trust or policy requires provenance-only or placeholder posture.",
                    guards=["Quarantine reason or policy drift is current"],
                    proofs=["AssistiveCapabilityTrustEnvelope(trustState = quarantined)", "AssistiveFreezeFrame"],
                    related_objects=["AssistiveFreezeFrame"],
                    degraded_posture="provenance_only",
                    source_refs=[
                        "phase-8-the-assistive-layer.md#8A Assistive capability contract, intended-use boundaries, and policy envelope",
                    ],
                ),
                tr(
                    "SM_ASSISTIVE_TRUST_ENVELOPE",
                    "trusted",
                    "frozen",
                    trigger="Evidence, publication, trust, selected-anchor, session, kill-switch, or release-freeze posture drifts.",
                    guards=["Freeze reason is current on the live watch tuple"],
                    proofs=["AssistiveFreezeFrame", "AssistiveCapabilityTrustEnvelope(trustState = frozen)"],
                    related_objects=["AssistiveFreezeFrame", "AssistiveKillSwitchState"],
                    degraded_posture="freeze-in-place",
                    source_refs=[
                        "phase-8-the-assistive-layer.md#8A Assistive capability contract, intended-use boundaries, and policy envelope",
                        "phase-8-the-assistive-layer.md#8G Monitoring, drift, fairness, and live safety controls",
                    ],
                ),
                tr(
                    "SM_ASSISTIVE_TRUST_ENVELOPE",
                    "degraded",
                    "trusted",
                    trigger="Watch-tuple trust, continuity, and publication posture recover for the same artifact and route tuple.",
                    guards=["Current watch tuple and rollout verdict are again exact and visible"],
                    proofs=["AssistiveCapabilityTrustEnvelope(trustState = trusted)", "AssistiveCapabilityRolloutVerdict"],
                    related_objects=["AssistiveCapabilityRolloutVerdict"],
                    source_refs=[
                        "phase-8-the-assistive-layer.md#8G Monitoring, drift, fairness, and live safety controls",
                    ],
                ),
                tr(
                    "SM_ASSISTIVE_TRUST_ENVELOPE",
                    "frozen",
                    "trusted",
                    trigger="A fresh rerun or policy recovery restores trusted same-shell posture.",
                    guards=["New artifact and current watch tuple are both live-authoritative"],
                    proofs=["AssistiveRunSettlement(settlementState = renderable)", "AssistiveCapabilityTrustEnvelope(trustState = trusted)"],
                    related_objects=["AssistiveRunSettlement"],
                    source_refs=[
                        "phase-8-the-assistive-layer.md#8F Human-in-the-loop workspace integration, override capture, and feedback loop",
                    ],
                ),
            ),
            illegal_transitions=(
                illegal(
                    "SM_ASSISTIVE_TRUST_ENVELOPE",
                    "degraded",
                    "trusted",
                    issue_type="trust_recovered_without_new_tuple_or_rerun",
                    dangerous="Stale assistive artifacts could regain interactive posture just because the UI refreshed.",
                    correction="When trust, publication, selected-anchor ownership, or continuity drift, freeze in place and require fresh current watch-tuple proof or rerun before trusted posture returns.",
                    invariants=["INV_ASSISTIVE_FREEZE_IN_PLACE", "INV_PROJECTION_FRESHNESS_GATES_ACTIONABILITY"],
                    source_refs=[
                        "phase-8-the-assistive-layer.md#8A Assistive capability contract, intended-use boundaries, and policy envelope",
                    ],
                    forensic_refs=("forensic-audit-findings.md#Finding 94",),
                ),
            ),
            related_machine_ids=("SM_ASSISTIVE_ROLLOUT_VERDICT", "SM_AUDIENCE_SURFACE_RUNTIME_BINDING"),
            notes="AssistiveCapabilityTrustEnvelope is the sole authority for live assistive renderability, confidence posture, visible actionability, and completion-adjacent posture. Freeze-in-place suppresses accept, insert, regenerate, export, and browser-handoff controls immediately.",
        ),
        MachineSpec(
            machine_id="SM_ASSISTIVE_ROLLOUT_VERDICT",
            canonical_name="AssistiveCapabilityRolloutVerdict.rolloutRung",
            owning_object_name="AssistiveCapabilityRolloutVerdict",
            state_axis_type="publication",
            machine_family="assistive",
            phase_tags=("phase_8_assistive_layer",),
            source_file="phase-8-the-assistive-layer.md",
            source_heading_or_block="## 8G. Monitoring, drift, fairness, and live safety controls",
            supporting_source_refs=(),
            whether_transition_is_coordinator_owned=False,
            states=(
                s("shadow_only", lane=0, order=0),
                s("visible_summary", lane=0, order=1),
                s("visible_insert", lane=0, order=2),
                s("visible_commit", lane=0, order=3),
                s("frozen", lane=1, order=2, classification="degraded"),
                s("withdrawn", lane=1, order=3, classification="terminal"),
            ),
            initial_state="shadow_only",
            terminal_states=("withdrawn",),
            supersession_states=(),
            legal_transitions=(
                tr(
                    "SM_ASSISTIVE_ROLLOUT_VERDICT",
                    "shadow_only",
                    "visible_summary",
                    trigger="Visible-summary evidence and slice policy are complete for the current cohort.",
                    guards=["sliceMembershipState = in_slice", "visibleEvidenceState = complete", "publicationState = published"],
                    proofs=["AssistiveCapabilityRolloutVerdict(verdictState = current)", "AssistiveRolloutSliceContract"],
                    related_objects=["AssistiveRolloutSliceContract", "AssistiveCapabilityWatchTuple"],
                    source_refs=[
                        "phase-8-the-assistive-layer.md#8G Monitoring, drift, fairness, and live safety controls",
                    ],
                ),
                tr(
                    "SM_ASSISTIVE_ROLLOUT_VERDICT",
                    "visible_summary",
                    "visible_insert",
                    trigger="Insert evidence and policy are complete for the current cohort slice.",
                    guards=["insertEvidenceState = complete", "publicationState = published"],
                    proofs=["AssistiveCapabilityRolloutVerdict(verdictState = current)"],
                    related_objects=["AssistiveCapabilityWatchTuple", "AssistiveRolloutSliceContract"],
                    source_refs=[
                        "phase-8-the-assistive-layer.md#8G Monitoring, drift, fairness, and live safety controls",
                    ],
                ),
                tr(
                    "SM_ASSISTIVE_ROLLOUT_VERDICT",
                    "visible_insert",
                    "visible_commit",
                    trigger="Governed-commit ceiling is approved for the current slice.",
                    guards=["commitEvidenceState = complete", "approval posture remains legal on the watch tuple"],
                    proofs=["AssistiveCapabilityRolloutVerdict(verdictState = current)", "AssistiveReleaseCandidate"],
                    related_objects=["AssistiveReleaseCandidate", "AssistiveCapabilityWatchTuple"],
                    source_refs=[
                        "phase-8-the-assistive-layer.md#8I Pilot rollout, controlled slices, and formal exit gate",
                    ],
                ),
                tr(
                    "SM_ASSISTIVE_ROLLOUT_VERDICT",
                    "visible_summary",
                    "frozen",
                    trigger="Threshold breach, trust degradation, policy drift, publication staleness, or incident spike freezes the slice.",
                    guards=["AssistiveReleaseFreezeRecord is opened for the current slice"],
                    proofs=["AssistiveReleaseFreezeRecord(freezeState = frozen | shadow_only)"],
                    related_objects=["AssistiveReleaseFreezeRecord"],
                    degraded_posture="shadow_only | observe_only | read_only_provenance | placeholder_only",
                    source_refs=[
                        "phase-8-the-assistive-layer.md#8I Pilot rollout, controlled slices, and formal exit gate",
                    ],
                ),
                tr(
                    "SM_ASSISTIVE_ROLLOUT_VERDICT",
                    "visible_insert",
                    "frozen",
                    trigger="The current slice freezes after visible insert posture was live.",
                    guards=["AssistiveReleaseFreezeRecord is current"],
                    proofs=["AssistiveReleaseFreezeRecord"],
                    related_objects=["AssistiveReleaseFreezeRecord"],
                    degraded_posture="shadow_only | observe_only | read_only_provenance | placeholder_only",
                    source_refs=[
                        "phase-8-the-assistive-layer.md#8I Pilot rollout, controlled slices, and formal exit gate",
                    ],
                ),
                tr(
                    "SM_ASSISTIVE_ROLLOUT_VERDICT",
                    "frozen",
                    "withdrawn",
                    trigger="The slice is no longer legal or supported for visible rollout.",
                    guards=["withdrawal or rollback recommendation is authoritative"],
                    proofs=["AssistiveCapabilityRolloutVerdict(rolloutRung = withdrawn)", "AssistiveReleaseFreezeRecord(freezeState = released | shadow_only)"],
                    related_objects=["AssistiveReleaseFreezeRecord"],
                    source_refs=[
                        "phase-8-the-assistive-layer.md#8I Pilot rollout, controlled slices, and formal exit gate",
                    ],
                ),
            ),
            illegal_transitions=(
                illegal(
                    "SM_ASSISTIVE_ROLLOUT_VERDICT",
                    "shadow_only",
                    "visible_insert",
                    issue_type="skipping_rollout_ladder_rungs",
                    dangerous="Feature flags or local overrides could widen visible capability without satisfying the governed rollout ladder.",
                    correction="AssistiveRolloutLadderPolicy is the only authority for widening posture from shadow to visible summary, insert, or governed commit.",
                    invariants=["INV_ASSISTIVE_FREEZE_IN_PLACE"],
                    source_refs=[
                        "phase-8-the-assistive-layer.md#8A Assistive capability contract, intended-use boundaries, and policy envelope",
                        "phase-8-the-assistive-layer.md#8I Pilot rollout, controlled slices, and formal exit gate",
                    ],
                    forensic_refs=("forensic-audit-findings.md#Finding 94",),
                ),
            ),
            related_machine_ids=("SM_ASSISTIVE_TRUST_ENVELOPE", "SM_AUDIENCE_SURFACE_RUNTIME_BINDING"),
            notes="Assistive rollout posture is monotone and slice-bound. Local feature flags, route-local threshold overrides, and browser-local toggles may narrow posture but never widen it.",
        ),
        MachineSpec(
            machine_id="SM_DISPOSITION_ELIGIBILITY",
            canonical_name="DispositionEligibilityAssessment.eligibilityState",
            owning_object_name="DispositionEligibilityAssessment",
            state_axis_type="gate",
            machine_family="assurance_governance",
            phase_tags=("phase_9_assurance_ledger",),
            source_file="phase-9-the-assurance-ledger.md",
            source_heading_or_block="## 9D. Records lifecycle, retention, legal hold, and deletion engine",
            supporting_source_refs=(),
            whether_transition_is_coordinator_owned=False,
            states=(
                s("blocked", lane=0, order=0, classification="degraded"),
                s("archive_only", lane=0, order=1),
                s("delete_allowed", lane=0, order=2, classification="terminal"),
            ),
            initial_state="blocked",
            terminal_states=("delete_allowed",),
            supersession_states=(),
            legal_transitions=(
                tr(
                    "SM_DISPOSITION_ELIGIBILITY",
                    "blocked",
                    "archive_only",
                    trigger="Preservation constraints still prohibit deletion but archive posture becomes legal.",
                    guards=["No active freeze or hold blocks archive-only posture", "Graph still requires preserving the artifact or its derivation"],
                    proofs=["DispositionEligibilityAssessment(eligibilityState = archive_only)"],
                    related_objects=["RetentionLifecycleBinding", "LegalHoldRecord", "AssuranceGraphCompletenessVerdict"],
                    source_refs=[
                        "phase-9-the-assurance-ledger.md#Records lifecycle, retention, legal hold, and deletion engine",
                    ],
                ),
                tr(
                    "SM_DISPOSITION_ELIGIBILITY",
                    "archive_only",
                    "delete_allowed",
                    trigger="Current assessment proves delete is safe under the same freeze, hold, dependency, and graph posture.",
                    guards=["No active freeze or legal hold remains", "No replay-critical dependency blocks deletion"],
                    proofs=["DispositionEligibilityAssessment(eligibilityState = delete_allowed)", "RetentionDecision"],
                    related_objects=["LegalHoldRecord", "RetentionLifecycleBinding", "AssuranceGraphCompletenessVerdict"],
                    source_refs=[
                        "phase-9-the-assurance-ledger.md#Records lifecycle, retention, legal hold, and deletion engine",
                    ],
                ),
            ),
            illegal_transitions=(
                illegal(
                    "SM_DISPOSITION_ELIGIBILITY",
                    "blocked",
                    "delete_allowed",
                    issue_type="delete_under_hold_or_graph_dependency",
                    dangerous="Retention could delete replay-critical or legally preserved artifacts while the evidence graph still depends on them.",
                    correction="DispositionEligibilityAssessment is the only delete gate and must converge freeze, legal-hold, dependency, and graph posture before deletion becomes legal.",
                    invariants=["INV_RETENTION_AND_RESILIENCE_GATE_EXPORTS"],
                    source_refs=[
                        "phase-9-the-assurance-ledger.md#Records lifecycle, retention, legal hold, and deletion engine",
                    ],
                    forensic_refs=("forensic-audit-findings.md#Finding 103",),
                ),
            ),
            related_machine_ids=("SM_LEGAL_HOLD_STATE", "SM_CROSS_PHASE_SCORECARD"),
            notes="Delete posture is a gate, not a storage-side convenience. Replay-critical, WORM, hash-chained, or graph-dependent artifacts fail closed out of delete-ready posture.",
        ),
        MachineSpec(
            machine_id="SM_LEGAL_HOLD_STATE",
            canonical_name="LegalHoldRecord.holdState",
            owning_object_name="LegalHoldRecord",
            state_axis_type="gate",
            machine_family="assurance_governance",
            phase_tags=("phase_9_assurance_ledger",),
            source_file="phase-9-the-assurance-ledger.md",
            source_heading_or_block="## 9D. Records lifecycle, retention, legal hold, and deletion engine",
            supporting_source_refs=(),
            whether_transition_is_coordinator_owned=False,
            states=(
                s("pending_review", lane=0, order=0),
                s("active", lane=0, order=1),
                s("released", lane=0, order=2, classification="terminal"),
                s("superseded", lane=1, order=2, classification="terminal"),
            ),
            initial_state="pending_review",
            terminal_states=("released", "superseded"),
            supersession_states=("superseded",),
            legal_transitions=(
                tr(
                    "SM_LEGAL_HOLD_STATE",
                    "pending_review",
                    "active",
                    trigger="Hold scope is confirmed and preservation becomes mandatory.",
                    guards=["scopeHash and originType are authoritative"],
                    proofs=["LegalHoldRecord(holdState = active)"],
                    related_objects=["LegalHoldScopeManifest"],
                    blockers=["Active legal holds block delete posture"],
                    source_refs=[
                        "phase-9-the-assurance-ledger.md#Records lifecycle, retention, legal hold, and deletion engine",
                    ],
                ),
                tr(
                    "SM_LEGAL_HOLD_STATE",
                    "active",
                    "released",
                    trigger="The hold is explicitly released and superseding disposition assessment is recomputed.",
                    guards=["Release reason and review are authoritative"],
                    proofs=["LegalHoldRecord(holdState = released)", "DispositionEligibilityAssessment"],
                    related_objects=["DispositionEligibilityAssessment"],
                    source_refs=[
                        "phase-9-the-assurance-ledger.md#Records lifecycle, retention, legal hold, and deletion engine",
                    ],
                ),
                tr(
                    "SM_LEGAL_HOLD_STATE",
                    "active",
                    "superseded",
                    trigger="A wider or newer hold scope supersedes the prior record.",
                    guards=["supersedesHoldRef exists"],
                    proofs=["LegalHoldRecord(holdState = superseded)"],
                    related_objects=["LegalHoldScopeManifest"],
                    source_refs=[
                        "phase-9-the-assurance-ledger.md#Records lifecycle, retention, legal hold, and deletion engine",
                    ],
                ),
            ),
            illegal_transitions=(
                illegal(
                    "SM_LEGAL_HOLD_STATE",
                    "active",
                    "released",
                    issue_type="hold_release_as_delete_authority",
                    dangerous="Operators could treat hold release alone as permission to archive or delete.",
                    correction="Hold release requires a fresh superseding DispositionEligibilityAssessment before any queued archive or delete job may proceed.",
                    invariants=["INV_RETENTION_AND_RESILIENCE_GATE_EXPORTS"],
                    source_refs=[
                        "phase-9-the-assurance-ledger.md#Records lifecycle, retention, legal hold, and deletion engine",
                    ],
                    forensic_refs=("forensic-audit-findings.md#Finding 103",),
                ),
            ),
            related_machine_ids=("SM_DISPOSITION_ELIGIBILITY", "SM_CROSS_PHASE_SCORECARD"),
            notes="LegalHoldRecord and RetentionFreezeRecord converge onto one preservation-first control plane. Release of a hold is not itself delete authority.",
        ),
        MachineSpec(
            machine_id="SM_RESILIENCE_SURFACE_BINDING",
            canonical_name="ResilienceSurfaceRuntimeBinding.bindingState",
            owning_object_name="ResilienceSurfaceRuntimeBinding",
            state_axis_type="publication",
            machine_family="assurance_governance",
            phase_tags=("phase_9_assurance_ledger",),
            source_file="phase-9-the-assurance-ledger.md",
            source_heading_or_block="## 9F. Resilience architecture, restore orchestration, and chaos programme",
            supporting_source_refs=(),
            whether_transition_is_coordinator_owned=False,
            states=(
                s("live", lane=0, order=0),
                s("diagnostic_only", lane=0, order=1, classification="degraded"),
                s("recovery_only", lane=0, order=2, classification="degraded"),
                s("blocked", lane=0, order=3, classification="terminal"),
            ),
            initial_state="live",
            terminal_states=("blocked",),
            supersession_states=(),
            legal_transitions=(
                tr(
                    "SM_RESILIENCE_SURFACE_BINDING",
                    "live",
                    "diagnostic_only",
                    trigger="Trust or publication posture narrows the resilience board to diagnostic evidence only.",
                    guards=["ReleaseTrustFreezeVerdict.surfaceAuthorityState = diagnostic_only or evidence pack admissibility is stale"],
                    proofs=["ResilienceSurfaceRuntimeBinding(bindingState = diagnostic_only)", "RecoveryControlPosture(postureState = diagnostic_only)"],
                    related_objects=["RecoveryControlPosture", "RecoveryEvidencePack"],
                    source_refs=[
                        "phase-9-the-assurance-ledger.md#9F Resilience architecture, restore orchestration, and chaos programme",
                    ],
                ),
                tr(
                    "SM_RESILIENCE_SURFACE_BINDING",
                    "diagnostic_only",
                    "recovery_only",
                    trigger="Active freeze or tuple drift allows only bounded recovery posture.",
                    guards=["bindingTupleHash no longer matches current resilience tuple"],
                    proofs=["ResilienceSurfaceRuntimeBinding(bindingState = recovery_only)", "ReleaseRecoveryDisposition"],
                    related_objects=["RecoveryControlPosture", "ReleaseRecoveryDisposition"],
                    source_refs=[
                        "phase-9-the-assurance-ledger.md#9F Resilience architecture, restore orchestration, and chaos programme",
                    ],
                ),
                tr(
                    "SM_RESILIENCE_SURFACE_BINDING",
                    "diagnostic_only",
                    "live",
                    trigger="Evidence pack admissibility, publication, and trust posture are restored on the same tuple.",
                    guards=["latestRecoveryEvidencePackRef.packState = current", "bindingTupleHash matches current OperationalReadinessSnapshot.resilienceTupleHash"],
                    proofs=["ResilienceSurfaceRuntimeBinding(bindingState = live)", "RecoveryControlPosture(postureState = live_control)"],
                    related_objects=["RecoveryControlPosture", "RecoveryEvidencePack"],
                    source_refs=[
                        "phase-9-the-assurance-ledger.md#9F Resilience architecture, restore orchestration, and chaos programme",
                    ],
                ),
                tr(
                    "SM_RESILIENCE_SURFACE_BINDING",
                    "recovery_only",
                    "blocked",
                    trigger="Current resilience scope can no longer legally expose even bounded recovery controls.",
                    guards=["release or trust posture blocks the active surface entirely"],
                    proofs=["ResilienceSurfaceRuntimeBinding(bindingState = blocked)", "ReleaseRecoveryDisposition"],
                    related_objects=["ReleaseRecoveryDisposition"],
                    source_refs=[
                        "phase-9-the-assurance-ledger.md#9F Resilience architecture, restore orchestration, and chaos programme",
                    ],
                ),
            ),
            illegal_transitions=(
                illegal(
                    "SM_RESILIENCE_SURFACE_BINDING",
                    "diagnostic_only",
                    "live",
                    issue_type="resilience_controls_rearmed_on_stale_tuple",
                    dangerous="Restore, failover, or chaos controls could rearm while recovery evidence or publication tuple is stale.",
                    correction="bindingState = live is legal only when the linked ReleaseTrustFreezeVerdict is live, latest recovery evidence pack is current, and the binding tuple matches the current resilience tuple.",
                    invariants=["INV_RETENTION_AND_RESILIENCE_GATE_EXPORTS", "INV_PROJECTION_FRESHNESS_GATES_ACTIONABILITY"],
                    source_refs=[
                        "phase-9-the-assurance-ledger.md#9F Resilience architecture, restore orchestration, and chaos programme",
                    ],
                    forensic_refs=("forensic-audit-findings.md#Finding 103",),
                ),
            ),
            related_machine_ids=("SM_RECOVERY_CONTROL_POSTURE", "SM_AUDIENCE_SURFACE_RUNTIME_BINDING"),
            notes="Resilience board controls are live-authoritative only on the current resilience tuple. Stale evidence stays explorable but may not re-arm restore or failover actionability.",
        ),
        MachineSpec(
            machine_id="SM_RECOVERY_CONTROL_POSTURE",
            canonical_name="RecoveryControlPosture.postureState",
            owning_object_name="RecoveryControlPosture",
            state_axis_type="trust",
            machine_family="assurance_governance",
            phase_tags=("phase_9_assurance_ledger",),
            source_file="phase-9-the-assurance-ledger.md",
            source_heading_or_block="## 9F. Resilience architecture, restore orchestration, and chaos programme",
            supporting_source_refs=(),
            whether_transition_is_coordinator_owned=False,
            states=(
                s("live_control", lane=0, order=0),
                s("diagnostic_only", lane=0, order=1, classification="degraded"),
                s("governed_recovery", lane=0, order=2, classification="degraded"),
                s("blocked", lane=0, order=3, classification="terminal"),
            ),
            initial_state="live_control",
            terminal_states=("blocked",),
            supersession_states=(),
            legal_transitions=(
                tr(
                    "SM_RECOVERY_CONTROL_POSTURE",
                    "live_control",
                    "diagnostic_only",
                    trigger="Publication, trust, or exercise freshness no longer supports live control.",
                    guards=["restore/failover/chaos freshness is stale or expired but diagnostic evidence remains safe"],
                    proofs=["RecoveryControlPosture(postureState = diagnostic_only)"],
                    related_objects=["RecoveryEvidencePack", "OperationalReadinessSnapshot"],
                    source_refs=[
                        "phase-9-the-assurance-ledger.md#9F Resilience architecture, restore orchestration, and chaos programme",
                    ],
                ),
                tr(
                    "SM_RECOVERY_CONTROL_POSTURE",
                    "diagnostic_only",
                    "governed_recovery",
                    trigger="Current posture narrows to bounded recovery operations only.",
                    guards=["Some but not all recovery actions remain safe under the current tuple"],
                    proofs=["RecoveryControlPosture(postureState = governed_recovery)", "ReleaseRecoveryDisposition"],
                    related_objects=["ReleaseRecoveryDisposition"],
                    source_refs=[
                        "phase-9-the-assurance-ledger.md#9F Resilience architecture, restore orchestration, and chaos programme",
                    ],
                ),
                tr(
                    "SM_RECOVERY_CONTROL_POSTURE",
                    "diagnostic_only",
                    "live_control",
                    trigger="Current evidence pack, publication, and readiness tuple again support live resilience controls.",
                    guards=["evidencePackAdmissibilityState = exact", "binding tuple remains current"],
                    proofs=["RecoveryControlPosture(postureState = live_control)", "RecoveryEvidencePack(packState = current)"],
                    related_objects=["RecoveryEvidencePack"],
                    source_refs=[
                        "phase-9-the-assurance-ledger.md#9F Resilience architecture, restore orchestration, and chaos programme",
                    ],
                ),
                tr(
                    "SM_RECOVERY_CONTROL_POSTURE",
                    "governed_recovery",
                    "blocked",
                    trigger="No legal operator control remains under the current tuple.",
                    guards=["blockerRefs still prevent all allowedActionRefs"],
                    proofs=["RecoveryControlPosture(postureState = blocked)"],
                    related_objects=["ReleaseTrustFreezeVerdict"],
                    source_refs=[
                        "phase-9-the-assurance-ledger.md#9F Resilience architecture, restore orchestration, and chaos programme",
                    ],
                ),
            ),
            illegal_transitions=(
                illegal(
                    "SM_RECOVERY_CONTROL_POSTURE",
                    "diagnostic_only",
                    "live_control",
                    issue_type="operator_control_from_historical_pack",
                    dangerous="A historical recovery pack could re-enable restore or failover controls after tuple drift.",
                    correction="RecoveryEvidencePack is admissible only while packState = current and its resilienceTupleHash still matches live runtime truth.",
                    invariants=["INV_RETENTION_AND_RESILIENCE_GATE_EXPORTS"],
                    source_refs=[
                        "phase-9-the-assurance-ledger.md#9F Resilience architecture, restore orchestration, and chaos programme",
                    ],
                    forensic_refs=("forensic-audit-findings.md#Finding 103",),
                ),
            ),
            related_machine_ids=("SM_RESILIENCE_SURFACE_BINDING", "SM_CROSS_PHASE_SCORECARD"),
            notes="RecoveryControlPosture derives executable resilience controls from the current publication tuple, trust posture, runbook/readiness evidence, and recovery-pack admissibility. Historical drills remain visible but never live-authoritative after tuple drift.",
        ),
        MachineSpec(
            machine_id="SM_CROSS_PHASE_SCORECARD",
            canonical_name="CrossPhaseConformanceScorecard.scorecardState",
            owning_object_name="CrossPhaseConformanceScorecard",
            state_axis_type="other",
            machine_family="assurance_governance",
            phase_tags=("phase_9_assurance_ledger", "cross_phase"),
            source_file="phase-9-the-assurance-ledger.md",
            source_heading_or_block="## 9I. Full-program exercises, BAU transfer, and formal exit gate",
            supporting_source_refs=(
                "forensic-audit-findings.md#Finding 103 - Governance compliance review still omitted continuity-evidence bundles",
            ),
            whether_transition_is_coordinator_owned=False,
            states=(
                s("blocked", lane=0, order=0, classification="degraded"),
                s("stale", lane=0, order=1, classification="degraded"),
                s("exact", lane=0, order=2, classification="terminal"),
            ),
            initial_state="blocked",
            terminal_states=("exact",),
            supersession_states=(),
            legal_transitions=(
                tr(
                    "SM_CROSS_PHASE_SCORECARD",
                    "blocked",
                    "stale",
                    trigger="Required rows exist but some planning, verification, runtime, or continuity proof is still stale or partial.",
                    guards=["PhaseConformanceRow rows exist for the claimed scope"],
                    proofs=["PhaseConformanceRow(rowState = stale | exact)", "CrossPhaseConformanceScorecard(scorecardState = stale)"],
                    related_objects=["PhaseConformanceRow"],
                    source_refs=[
                        "phase-9-the-assurance-ledger.md#9I Full-program exercises, BAU transfer, and formal exit gate",
                    ],
                ),
                tr(
                    "SM_CROSS_PHASE_SCORECARD",
                    "stale",
                    "exact",
                    trigger="Every required row is exact and the scorecard hash still matches the current planning, verification, runtime, continuity, and end-state proof tuples.",
                    guards=["summaryAlignmentState, contractAdoptionState, verificationCoverageState, operationalProofState, and endStateProofState are all exact"],
                    proofs=["CrossPhaseConformanceScorecard(scorecardState = exact)", "GovernanceContinuityEvidenceBundle"],
                    related_objects=["PhaseConformanceRow", "GovernanceContinuityEvidenceBundle", "ExperienceContinuityControlEvidence"],
                    source_refs=[
                        "phase-9-the-assurance-ledger.md#9I Full-program exercises, BAU transfer, and formal exit gate",
                        "forensic-audit-findings.md#Finding 103 - Governance compliance review still omitted continuity-evidence bundles",
                    ],
                ),
                tr(
                    "SM_CROSS_PHASE_SCORECARD",
                    "exact",
                    "stale",
                    trigger="Any planning summary, runtime publication tuple, continuity proof set, or end-state proof drifts out of exact alignment.",
                    guards=["One or more required rows fall to stale"],
                    proofs=["PhaseConformanceRow(rowState = stale)", "CrossPhaseConformanceScorecard(scorecardState = stale)"],
                    related_objects=["PhaseConformanceRow", "GovernanceContinuityEvidenceBundle"],
                    source_refs=[
                        "phase-9-the-assurance-ledger.md#9I Full-program exercises, BAU transfer, and formal exit gate",
                    ],
                ),
                tr(
                    "SM_CROSS_PHASE_SCORECARD",
                    "stale",
                    "blocked",
                    trigger="A required proof, verification scenario, runtime publication tuple, or continuity bundle is missing or contradictory.",
                    guards=["Any required rowState falls to blocked"],
                    proofs=["PhaseConformanceRow(rowState = blocked)", "CrossPhaseConformanceScorecard(scorecardState = blocked)"],
                    related_objects=["PhaseConformanceRow", "RuntimePublicationBundle", "GovernanceContinuityEvidenceBundle"],
                    source_refs=[
                        "phase-9-the-assurance-ledger.md#9I Full-program exercises, BAU transfer, and formal exit gate",
                    ],
                ),
            ),
            illegal_transitions=(
                illegal(
                    "SM_CROSS_PHASE_SCORECARD",
                    "blocked",
                    "exact",
                    issue_type="bau_signoff_without_continuity_and_runtime_proof",
                    dangerous="Narrative confidence or dashboard green could imply programme completion without exact continuity, runtime, and end-state proof.",
                    correction="CrossPhaseConformanceScorecard becomes exact only when every required row is exact and the scorecard hash still matches current planning, verification, runtime publication, continuity evidence, and end-state proof.",
                    invariants=["INV_CONTINUITY_PROOF_REQUIRED_FOR_SIGNOFF"],
                    source_refs=[
                        "phase-9-the-assurance-ledger.md#9I Full-program exercises, BAU transfer, and formal exit gate",
                    ],
                    forensic_refs=("forensic-audit-findings.md#Finding 103",),
                ),
            ),
            related_machine_ids=("SM_RECOVERY_CONTROL_POSTURE", "SM_DISPOSITION_ELIGIBILITY", "SM_AUDIENCE_SURFACE_RUNTIME_BINDING"),
            notes="CrossPhaseConformanceScorecard is the final programme-truth artifact. BAU sign-off, governance review, ops diagnosis, and runtime verification do not each get to declare completion independently once this scorecard exists.",
        ),
    ]
    return machines


def build_invariants() -> list[InvariantSpec]:
    return [
        InvariantSpec(
            invariant_id="INV_REQ_WORKFLOW_MILESTONES_ONLY",
            canonical_wording="Request.workflowState contains milestones only; review, repair, confirmation, and reconciliation stay off the canonical workflow axis.",
            scope="Canonical request lifecycle",
            affected_machine_ids=("SM_REQUEST_WORKFLOW_STATE", "SM_BOOKING_CASE_STATUS", "SM_HUB_COORDINATION_CASE_STATUS", "SM_PHARMACY_CASE_STATUS", "SM_COMMAND_SETTLEMENT"),
            affected_objects=("Request", "BookingCase", "HubCoordinationCase", "PharmacyCase", "CommandSettlementRecord"),
            related_guards=("LifecycleCoordinator is the only milestone derivation authority",),
            related_proofs=("RequestClosureRecord", "BookingOutcomeMilestone | HubCoordinationMilestone | PharmacyOutcomeMilestone"),
            violating_transition_refs=("ISSUE_SM_REQUEST_WORKFLOW_STATE_TRIAGE_ACTIVE_CONFIRMATION_PENDING",),
            source_refs=(
                "phase-0-the-foundation-protocol.md#1.3 Request",
                "forensic-audit-findings.md#Finding 48 - Canonical state contract diverged between the kernel summary and the concrete Request schema",
                "forensic-audit-findings.md#Finding 54 - Request.workflowState incorrectly mixed workflow milestones with reconciliation states",
            ),
            test_hint="Reject any attempt to write booking, pharmacy, repair, or confirmation labels into Request.workflowState.",
            phase_scope=("phase_0_foundation", "phase_3_human_checkpoint", "phase_4_booking_engine", "phase_5_network_horizon", "phase_6_pharmacy_loop"),
        ),
        InvariantSpec(
            invariant_id="INV_BLOCKERS_ORTHOGONAL",
            canonical_wording="Blockers remain orthogonal to workflow milestones and episode lifecycle.",
            scope="Cross-domain blocker handling",
            affected_machine_ids=("SM_REQUEST_WORKFLOW_STATE", "SM_EPISODE_STATE", "SM_REQUEST_CLOSURE_DECISION", "SM_DUPLICATE_CLUSTER_STATUS", "SM_FALLBACK_REVIEW_CASE", "SM_EXTERNAL_CONFIRMATION_GATE"),
            affected_objects=("Request", "Episode", "RequestClosureRecord", "DuplicateCluster", "FallbackReviewCase", "ExternalConfirmationGate"),
            related_guards=("Episode and Request blocker refs must remain empty before closure",),
            related_proofs=("RequestClosureRecord", "request.closure_blockers.changed"),
            violating_transition_refs=("ISSUE_SM_EPISODE_STATE_OPEN_IDENTITY_HOLD", "ISSUE_SM_REQUEST_WORKFLOW_STATE_TRIAGE_ACTIVE_CLOSED"),
            source_refs=(
                "phase-0-the-foundation-protocol.md#1.2 Episode",
                "phase-0-the-foundation-protocol.md#1.12 RequestClosureRecord",
                "forensic-audit-findings.md#Finding 56 - The blueprint lacked an explicit rule that blockers must remain orthogonal to workflow milestones",
            ),
            test_hint="Assert that duplicate review, fallback review, identity repair, and confirmation ambiguity never appear as Request.workflowState or Episode.state values.",
            phase_scope=("phase_0_foundation",),
        ),
        InvariantSpec(
            invariant_id="INV_PATIENTREF_DERIVES_FROM_BINDING",
            canonical_wording="patientRef is nullable until verified and is derived only from the latest settled IdentityBinding.",
            scope="Identity and claim posture",
            affected_machine_ids=("SM_REQUEST_IDENTITY_STATE", "SM_IDENTITY_BINDING_STATE", "SM_EPISODE_STATE"),
            affected_objects=("Request", "IdentityBinding", "Episode"),
            related_guards=("No auth, telephony, support, or import path writes patientRef directly",),
            related_proofs=("IdentityBinding(bindingState = verified_patient | corrected)", "IdentityRepairReleaseSettlement"),
            violating_transition_refs=("ISSUE_SM_REQUEST_IDENTITY_STATE_ANONYMOUS_CLAIMED",),
            source_refs=(
                "phase-0-the-foundation-protocol.md#1.2 Episode",
                "phase-0-the-foundation-protocol.md#1.3 Request",
                "phase-0-the-foundation-protocol.md#1.4 IdentityBinding",
                "forensic-audit-findings.md#Finding 50 - The concrete Request schema dropped identity-binding references and treated patientRef as unconditional",
            ),
            test_hint="Force patientRef to stay null while IdentityBinding remains candidate, provisional_verified, or ambiguous.",
            phase_scope=("phase_0_foundation", "phase_2_identity_and_echoes"),
        ),
        InvariantSpec(
            invariant_id="INV_COORDINATOR_OWNS_CANONICAL_MILESTONES",
            canonical_wording="Only LifecycleCoordinator derives canonical request milestone and closure changes.",
            scope="Cross-domain write ownership",
            affected_machine_ids=("SM_REQUEST_WORKFLOW_STATE", "SM_REQUEST_CLOSURE_DECISION", "SM_BOOKING_CASE_STATUS", "SM_HUB_COORDINATION_CASE_STATUS", "SM_PHARMACY_CASE_STATUS", "SM_TRIAGE_TASK_STATUS"),
            affected_objects=("Request", "RequestClosureRecord", "BookingCase", "HubCoordinationCase", "PharmacyCase", "TriageTask"),
            related_guards=("Child domains emit milestone evidence only",),
            related_proofs=("BookingOutcomeMilestone | HubCoordinationMilestone | PharmacyOutcomeMilestone", "RequestClosureRecord"),
            violating_transition_refs=("ISSUE_SM_BOOKING_CASE_STATUS_BOOKED_HANDOFF_ACTIVE", "ISSUE_SM_HUB_COORDINATION_CASE_STATUS_BOOKED_HANDOFF_ACTIVE", "ISSUE_SM_TRIAGE_TASK_STATUS_ENDPOINT_SELECTED_CLOSED"),
            source_refs=(
                "phase-0-the-foundation-protocol.md#Canonical request model",
                "forensic-audit-findings.md#Finding 74 - Phase 4 let booking-domain logic write canonical request state directly on success",
                "forensic-audit-findings.md#Finding 75 - Phase 3 let triage-domain logic write canonical request state directly",
                "forensic-audit-findings.md#Finding 76 - Phase 5 let hub-domain logic write canonical request state directly on booked and return paths",
                "forensic-audit-findings.md#Finding 77 - Phase 6 let pharmacy-domain logic write canonical request state directly on resolve and reopen paths",
            ),
            test_hint="Prohibit direct writes from triage, booking, hub, pharmacy, callback, message, or admin-resolution services into Request.workflowState and RequestClosureRecord.",
            phase_scope=("phase_0_foundation", "phase_3_human_checkpoint", "phase_4_booking_engine", "phase_5_network_horizon", "phase_6_pharmacy_loop"),
        ),
        InvariantSpec(
            invariant_id="INV_CHILD_DOMAINS_EMIT_SIGNALS_ONLY",
            canonical_wording="Child domains may not directly write canonical Request.workflowState, Episode.state, or closure truth; they emit case-local truth plus milestone or blocker evidence.",
            scope="Domain boundaries",
            affected_machine_ids=("SM_BOOKING_CASE_STATUS", "SM_HUB_COORDINATION_CASE_STATUS", "SM_PHARMACY_CASE_STATUS", "SM_TRIAGE_TASK_STATUS", "SM_ADMIN_RESOLUTION_CASE"),
            affected_objects=("BookingCase", "HubCoordinationCase", "PharmacyCase", "TriageTask", "AdminResolutionCase"),
            related_guards=("LineageCaseLink and DecisionEpoch remain the cross-domain join",),
            related_proofs=("Milestone signals", "LineageCaseLink", "CommandSettlementRecord"),
            violating_transition_refs=("ISSUE_SM_BOOKING_CASE_STATUS_BOOKED_HANDOFF_ACTIVE", "ISSUE_SM_HUB_COORDINATION_CASE_STATUS_BOOKED_HANDOFF_ACTIVE", "ISSUE_SM_PHARMACY_CASE_STATUS_OUTCOME_RECONCILIATION_PENDING_OUTCOME_RECORDED"),
            source_refs=(
                "phase-0-the-foundation-protocol.md#1.1B RequestLineage",
                "phase-0-the-foundation-protocol.md#Canonical request model",
                "forensic-audit-findings.md#Finding 74",
                "forensic-audit-findings.md#Finding 75",
                "forensic-audit-findings.md#Finding 76",
                "forensic-audit-findings.md#Finding 77",
            ),
            test_hint="Integration tests should allow branch-local state changes while asserting canonical workflow only changes after coordinator consumption.",
            phase_scope=("phase_3_human_checkpoint", "phase_4_booking_engine", "phase_5_network_horizon", "phase_6_pharmacy_loop", "self_care_admin_resolution"),
        ),
        InvariantSpec(
            invariant_id="INV_NO_BUSINESS_SUCCESS_FROM_TRANSPORT",
            canonical_wording="No business success state may be inferred from transport acceptance, local acknowledgement, or provider acceptance alone.",
            scope="Settlement truth",
            affected_machine_ids=("SM_COMMAND_SETTLEMENT", "SM_EXTERNAL_CONFIRMATION_GATE", "SM_BOOKING_CASE_STATUS", "SM_PHARMACY_DISPATCH_STATUS", "SM_CALLBACK_CASE_STATE", "SM_CLINICIAN_MESSAGE_THREAD"),
            affected_objects=("CommandSettlementRecord", "ExternalConfirmationGate", "BookingCase", "PharmacyDispatchAttempt", "CallbackCase", "ClinicianMessageThread"),
            related_guards=("Strong or policy-approved proof class remains mandatory before calm success",),
            related_proofs=("CommandSettlementRecord(authoritativeOutcomeState = settled)", "ExternalConfirmationGate(state = confirmed)", "CallbackOutcomeEvidenceBundle", "MessageDeliveryEvidenceBundle"),
            violating_transition_refs=("ISSUE_SM_COMMAND_SETTLEMENT_PENDING_SETTLED", "ISSUE_SM_EXTERNAL_CONFIRMATION_GATE_PENDING_CONFIRMED", "ISSUE_SM_PHARMACY_DISPATCH_STATUS_TRANSPORT_ACCEPTED_PROOF_SATISFIED"),
            source_refs=(
                "phase-0-the-foundation-protocol.md#1.23 CommandSettlementRecord",
                "phase-0-the-foundation-protocol.md#1.15 ExternalConfirmationGate",
                "phase-0-the-foundation-protocol.md#Pharmacy dispatch truth",
            ),
            test_hint="Simulate accepted-for-processing, provider-accepted, or transport-accepted states and assert the UI stays pending or review-aware until authoritative proof lands.",
            phase_scope=("phase_0_foundation", "phase_4_booking_engine", "phase_6_pharmacy_loop", "callback_and_messaging"),
        ),
        InvariantSpec(
            invariant_id="INV_MUTATION_REQUIRES_CURRENT_ROUTE_TUPLE",
            canonical_wording="No post-submit mutation may remain writable after route-intent, session, binding, release, publication, or trust fences drift.",
            scope="Writability and drift recovery",
            affected_machine_ids=("SM_ROUTE_INTENT_BINDING", "SM_AUDIENCE_SURFACE_RUNTIME_BINDING", "SM_SESSION_ROUTE_AUTHORITY", "SM_COMMAND_SETTLEMENT", "SM_ASSISTIVE_TRUST_ENVELOPE", "SM_RESILIENCE_SURFACE_BINDING"),
            affected_objects=("RouteIntentBinding", "AudienceSurfaceRuntimeBinding", "Session", "CommandSettlementRecord", "AssistiveCapabilityTrustEnvelope", "ResilienceSurfaceRuntimeBinding"),
            related_guards=("surfaceTupleHash and routeIntentTupleHash must both remain current",),
            related_proofs=("RouteIntentBinding(bindingState = live)", "AudienceSurfaceRuntimeBinding(bindingState = publishable_live)", "ReleasePublicationParityRecord"),
            violating_transition_refs=("ISSUE_SM_ROUTE_INTENT_BINDING_STALE_LIVE", "ISSUE_SM_AUDIENCE_SURFACE_RUNTIME_BINDING_RECOVERY_ONLY_PUBLISHABLE_LIVE"),
            source_refs=(
                "phase-0-the-foundation-protocol.md#1.21 RouteIntentBinding",
                "phase-0-the-foundation-protocol.md#1.38A AudienceSurfaceRuntimeBinding",
                "forensic-audit-findings.md#Finding 91 - The audit still treated route, settlement, release, and trust controls as phase-local conventions",
            ),
            test_hint="Whenever the route tuple, publication tuple, or trust slice drifts, assert same-shell recovery or read-only posture rather than hidden mutation affordances.",
            phase_scope=("phase_0_foundation", "phase_8_assistive_layer", "phase_9_assurance_ledger"),
        ),
        InvariantSpec(
            invariant_id="INV_CLOSURE_REQUIRES_EMPTY_BLOCKERS",
            canonical_wording="No closure may occur while coordinator-materialized blocker sets remain non-empty.",
            scope="Closure and calmness",
            affected_machine_ids=("SM_REQUEST_CLOSURE_DECISION", "SM_REQUEST_WORKFLOW_STATE", "SM_DUPLICATE_CLUSTER_STATUS", "SM_FALLBACK_REVIEW_CASE", "SM_REQUEST_LIFECYCLE_LEASE", "SM_EXTERNAL_CONFIRMATION_GATE"),
            affected_objects=("RequestClosureRecord", "Request", "DuplicateCluster", "FallbackReviewCase", "RequestLifecycleLease", "ExternalConfirmationGate"),
            related_guards=("Every blocking* ref set in RequestClosureRecord must be empty",),
            related_proofs=("RequestClosureRecord(decision = close)", "request.closure_blockers.changed -> empty"),
            violating_transition_refs=("ISSUE_SM_REQUEST_WORKFLOW_STATE_TRIAGE_ACTIVE_CLOSED", "ISSUE_SM_FALLBACK_REVIEW_CASE_SUBMITTED_DEGRADED_CLOSED", "ISSUE_SM_DUPLICATE_CLUSTER_STATUS_OPEN_RESOLVED_CONFIRMED"),
            source_refs=(
                "phase-0-the-foundation-protocol.md#1.12 RequestClosureRecord",
                "forensic-audit-findings.md#Finding 57 - RequestClosureRecord omitted duplicate-cluster blockers",
                "forensic-audit-findings.md#Finding 58 - RequestClosureRecord omitted fallback-review blockers",
                "forensic-audit-findings.md#Finding 59 - RequestClosureRecord omitted identity-repair blockers",
                "forensic-audit-findings.md#Finding 60 - RequestClosureRecord omitted PHI-grant and reachability blockers",
            ),
            test_hint="Assert close is impossible while any blocker ref list remains populated, including duplicate review, fallback review, identity repair, grants, reachability, and confirmation gates.",
            phase_scope=("phase_0_foundation",),
        ),
        InvariantSpec(
            invariant_id="INV_SAME_REQUEST_CONTINUATION_REUSES_LINEAGE",
            canonical_wording="Same-request continuation reuses the existing RequestLineage; same-episode or related-episode branching is explicit.",
            scope="Lineage continuity",
            affected_machine_ids=("SM_DUPLICATE_CLUSTER_STATUS", "SM_TRIAGE_TASK_STATUS", "SM_BOOKING_CASE_STATUS", "SM_CALLBACK_CASE_STATE"),
            affected_objects=("RequestLineage", "DuplicateCluster", "TriageTask", "BookingCase", "CallbackCase"),
            related_guards=("same_request_attach requires an explicit continuity witness",),
            related_proofs=("DuplicateResolutionDecision", "LineageCaseLink"),
            violating_transition_refs=("ISSUE_SM_DUPLICATE_CLUSTER_STATUS_OPEN_RESOLVED_CONFIRMED",),
            source_refs=(
                "phase-0-the-foundation-protocol.md#1.1B RequestLineage",
                "phase-0-the-foundation-protocol.md#1.7B DuplicateResolutionDecision",
                "forensic-audit-findings.md#Finding 19 - Reopen and bounce-back flows lost same-request continuity",
            ),
            test_hint="Retry, same-request attach, same-episode link, and related-episode branch must remain distinguishable from each other in persisted lineage history.",
            phase_scope=("phase_0_foundation", "phase_3_human_checkpoint", "phase_4_booking_engine", "callback_and_messaging"),
        ),
        InvariantSpec(
            invariant_id="INV_WRONG_PATIENT_IS_REPAIR_PATH",
            canonical_wording="Wrong-patient correction is a repair/hold path, not a workflow milestone or episode lifecycle value.",
            scope="Identity repair",
            affected_machine_ids=("SM_REQUEST_IDENTITY_STATE", "SM_IDENTITY_BINDING_STATE", "SM_EPISODE_STATE"),
            affected_objects=("Request", "IdentityBinding", "Episode"),
            related_guards=("IdentityRepairCase and downstream branch disposition remain mandatory before release",),
            related_proofs=("IdentityRepairCase", "IdentityRepairReleaseSettlement"),
            violating_transition_refs=("ISSUE_SM_EPISODE_STATE_OPEN_IDENTITY_HOLD", "ISSUE_SM_IDENTITY_BINDING_STATE_VERIFIED_PATIENT_REVOKED"),
            source_refs=(
                "phase-0-the-foundation-protocol.md#1.5 IdentityRepairCase",
                "phase-0-the-foundation-protocol.md#1.5B IdentityRepairBranchDisposition",
                "forensic-audit-findings.md#Finding 69 - Wrong-patient correction rewrote canonical workflow state instead of attaching repair metadata",
            ),
            test_hint="Repair opens explicit branch dispositions and freezes communication, visibility, and downstream work until authoritative release.",
            phase_scope=("phase_0_foundation", "phase_2_identity_and_echoes"),
        ),
        InvariantSpec(
            invariant_id="INV_EVIDENCE_ASSIMILATION_AND_RESAFETY",
            canonical_wording="Evidence assimilation and re-safety are explicit whenever material new evidence arrives.",
            scope="Material delta handling",
            affected_machine_ids=("SM_REQUEST_SAFETY_STATE", "SM_MORE_INFO_REPLY_WINDOW", "SM_CALLBACK_CASE_STATE", "SM_CLINICIAN_MESSAGE_THREAD"),
            affected_objects=("Request", "MoreInfoReplyWindowCheckpoint", "CallbackCase", "ClinicianMessageThread"),
            related_guards=("MaterialDeltaAssessment and SafetyPreemptionRecord gate routine continuation",),
            related_proofs=("EvidenceAssimilationRecord", "MaterialDeltaAssessment", "SafetyDecisionRecord"),
            violating_transition_refs=("ISSUE_SM_REQUEST_SAFETY_STATE_URGENT_DIVERSION_REQUIRED_SCREEN_CLEAR", "ISSUE_SM_MORE_INFO_REPLY_WINDOW_EXPIRED_SETTLED"),
            source_refs=(
                "phase-3-the-human-checkpoint.md#3D More-info loop, patient response threading, and re-safety",
                "callback-and-clinician-messaging-loop.md#Purpose",
                "forensic-audit-findings.md#Finding 13 - Materially new evidence bypassed canonical re-safety",
            ),
            test_hint="Patient replies, callback outcomes, and message replies must create new immutable evidence plus re-safety before routine work resumes.",
            phase_scope=("phase_3_human_checkpoint", "callback_and_messaging"),
        ),
        InvariantSpec(
            invariant_id="INV_CONFIRMATION_AMBIGUITY_STAYS_EXPLICIT",
            canonical_wording="Confirmation ambiguity remains explicit through gate and case-local objects; it does not collapse into generic success or generic error.",
            scope="External truth ambiguity",
            affected_machine_ids=("SM_EXTERNAL_CONFIRMATION_GATE", "SM_BOOKING_CASE_STATUS", "SM_HUB_CONFIRMATION_TRUTH", "SM_PHARMACY_DISPATCH_STATUS"),
            affected_objects=("ExternalConfirmationGate", "BookingCase", "HubOfferToConfirmationTruthProjection", "PharmacyDispatchAttempt"),
            related_guards=("Competing-gate ambiguity and hard-match failure keep review posture explicit",),
            related_proofs=("ExternalConfirmationGate", "BookingConfirmationTruthProjection", "HubOfferToConfirmationTruthProjection"),
            violating_transition_refs=("ISSUE_SM_BOOKING_CASE_STATUS_COMMIT_PENDING_BOOKED", "ISSUE_SM_HUB_CONFIRMATION_TRUTH_NATIVE_BOOKING_PENDING_CONFIRMED", "ISSUE_SM_EXTERNAL_CONFIRMATION_GATE_PENDING_CONFIRMED"),
            source_refs=(
                "phase-0-the-foundation-protocol.md#1.15 ExternalConfirmationGate",
                "phase-4-the-booking-engine.md#4A Booking contract, case model, and state machine",
                "phase-5-the-network-horizon.md#5F Native hub booking commit, practice continuity, and cross-org messaging",
                "phase-6-the-pharmacy-loop.md#6D Referral pack composer, dispatch adapters, and transport contract",
            ),
            test_hint="Booking, hub, and pharmacy calmness stays blocked until the current gate or projection is genuinely resolved on the active tuple.",
            phase_scope=("phase_0_foundation", "phase_4_booking_engine", "phase_5_network_horizon", "phase_6_pharmacy_loop"),
        ),
        InvariantSpec(
            invariant_id="INV_PROJECTION_FRESHNESS_GATES_ACTIONABILITY",
            canonical_wording="Projection freshness, visibility, publication, and continuity evidence are part of actionability, not decoration.",
            scope="User-visible runtime posture",
            affected_machine_ids=("SM_AUDIENCE_SURFACE_RUNTIME_BINDING", "SM_COMMAND_SETTLEMENT", "SM_ASSISTIVE_TRUST_ENVELOPE", "SM_RESILIENCE_SURFACE_BINDING", "SM_CROSS_PHASE_SCORECARD"),
            affected_objects=("AudienceSurfaceRuntimeBinding", "CommandSettlementRecord", "AssistiveCapabilityTrustEnvelope", "ResilienceSurfaceRuntimeBinding", "CrossPhaseConformanceScorecard"),
            related_guards=("Live controls require current parity, continuity evidence, and runtime tuple alignment",),
            related_proofs=("AudienceSurfaceRuntimeBinding", "ExperienceContinuityControlEvidence", "GovernanceContinuityEvidenceBundle"),
            violating_transition_refs=("ISSUE_SM_AUDIENCE_SURFACE_RUNTIME_BINDING_RECOVERY_ONLY_PUBLISHABLE_LIVE", "ISSUE_SM_RESILIENCE_SURFACE_BINDING_DIAGNOSTIC_ONLY_LIVE"),
            source_refs=(
                "phase-0-the-foundation-protocol.md#1.38A AudienceSurfaceRuntimeBinding",
                "forensic-audit-findings.md#Finding 102 - Operations diagnosis still lacked first-class continuity evidence",
                "forensic-audit-findings.md#Finding 103 - Governance compliance review still omitted continuity-evidence bundles",
            ),
            test_hint="Any stale publication, continuity, or trust tuple must degrade controls in place rather than leaving calm or writable posture live.",
            phase_scope=("phase_0_foundation", "phase_8_assistive_layer", "phase_9_assurance_ledger"),
        ),
        InvariantSpec(
            invariant_id="INV_URGENT_REQUIRED_NOT_DIVERTED",
            canonical_wording="urgent_diversion_required and urgent_diverted are distinct durable safety states.",
            scope="Urgent safety issuance",
            affected_machine_ids=("SM_REQUEST_SAFETY_STATE",),
            affected_objects=("Request", "UrgentDiversionSettlement"),
            related_guards=("Urgent issuance proof remains mandatory",),
            related_proofs=("UrgentDiversionSettlement",),
            violating_transition_refs=("ISSUE_SM_REQUEST_SAFETY_STATE_URGENT_DIVERSION_REQUIRED_SCREEN_CLEAR",),
            source_refs=(
                "phase-0-the-foundation-protocol.md#1.3 Request",
                "forensic-audit-findings.md#Finding 11 - Urgent diversion required and completed were collapsed",
            ),
            test_hint="An urgent-required case cannot return to routine screen_clear or calm UI copy until UrgentDiversionSettlement is recorded.",
            phase_scope=("phase_0_foundation", "phase_1_red_flag_gate"),
        ),
        InvariantSpec(
            invariant_id="INV_MORE_INFO_TTL_AND_SUPERSESSION",
            canonical_wording="More-info TTL, reminder cadence, supersession, late reply, and re-entry are explicit and fence-scoped.",
            scope="Patient reply loop",
            affected_machine_ids=("SM_MORE_INFO_REPLY_WINDOW", "SM_TRIAGE_TASK_STATUS", "SM_DECISION_EPOCH"),
            affected_objects=("MoreInfoReplyWindowCheckpoint", "TriageTask", "DecisionEpoch"),
            related_guards=("Exactly one checkpoint governs patient actionability at a time",),
            related_proofs=("MoreInfoReplyWindowCheckpoint", "MoreInfoResponseDisposition"),
            violating_transition_refs=("ISSUE_SM_MORE_INFO_REPLY_WINDOW_EXPIRED_SETTLED", "ISSUE_SM_DECISION_EPOCH_SUPERSEDED_LIVE"),
            source_refs=(
                "phase-3-the-human-checkpoint.md#3D More-info loop, patient response threading, and re-safety",
                "forensic-audit-findings.md#Finding 18 - More-info loop had no TTL, expiry, or escalation rule",
            ),
            test_hint="Late replies remain deliberate review posture; superseded or expired loops never silently reopen routine flow.",
            phase_scope=("phase_3_human_checkpoint",),
        ),
        InvariantSpec(
            invariant_id="INV_CALLBACK_AND_MESSAGE_EVIDENCE_BOUND",
            canonical_wording="Callback and clinician messaging require evidence-bound attempt or delivery truth plus a resolution gate before completion or closure.",
            scope="Communications endpoints",
            affected_machine_ids=("SM_CALLBACK_CASE_STATE", "SM_CLINICIAN_MESSAGE_THREAD", "SM_COMMAND_SETTLEMENT"),
            affected_objects=("CallbackCase", "ClinicianMessageThread", "CommandSettlementRecord"),
            related_guards=("Outcome bundles and resolution gates remain mandatory",),
            related_proofs=("CallbackOutcomeEvidenceBundle", "CallbackResolutionGate", "MessageDeliveryEvidenceBundle", "ThreadResolutionGate"),
            violating_transition_refs=("ISSUE_SM_CALLBACK_CASE_STATE_ATTEMPT_IN_PROGRESS_COMPLETED", "ISSUE_SM_CLINICIAN_MESSAGE_THREAD_SENT_CLOSED"),
            source_refs=(
                "callback-and-clinician-messaging-loop.md#Callback domain",
                "callback-and-clinician-messaging-loop.md#Clinician message domain",
                "forensic-audit-findings.md#Finding 23 - Clinician messaging had contradictory loop-and-close semantics",
                "forensic-audit-findings.md#Finding 24 - Callback handling had contradictory loop-and-close semantics",
            ),
            test_hint="Dial actions, send actions, delivery receipts, and local toasts may widen pending guidance but never settle completion or closure without the governing evidence bundle and resolution gate.",
            phase_scope=("callback_and_messaging",),
        ),
        InvariantSpec(
            invariant_id="INV_WAITLIST_AND_HUB_TRANSFER_EXPLICIT",
            canonical_wording="Waitlist deadlines, callback fallback, hub transfer, and hub callback linkage remain explicit through durable fallback obligations and truth projections.",
            scope="Booking and hub continuation debt",
            affected_machine_ids=("SM_WAITLIST_FALLBACK_TRANSFER", "SM_BOOKING_CASE_STATUS", "SM_HUB_COORDINATION_CASE_STATUS"),
            affected_objects=("WaitlistFallbackObligation", "BookingCase", "HubCoordinationCase"),
            related_guards=("Fallback route and transfer linkage must both be current",),
            related_proofs=("WaitlistFallbackObligation", "CallbackCase", "HubCoordinationCase", "HubFallbackRecord"),
            violating_transition_refs=("ISSUE_SM_WAITLIST_FALLBACK_TRANSFER_ARMED_SATISFIED", "ISSUE_SM_HUB_COORDINATION_CASE_STATUS_CONFIRMATION_PENDING_BOOKED"),
            source_refs=(
                "phase-4-the-booking-engine.md#4G Smart Waitlist and local auto-fill",
                "phase-5-the-network-horizon.md#5G No-slot handling, urgent bounce-back, callback fallback, and reopen mechanics",
            ),
            test_hint="Do not let local waitlist, hub callback fallback, or return-to-practice debt disappear until the new branch is durably linked and visible on the same lineage.",
            phase_scope=("phase_4_booking_engine", "phase_5_network_horizon"),
        ),
        InvariantSpec(
            invariant_id="INV_PHARMACY_CONSENT_DISPATCH_RECONCILIATION",
            canonical_wording="Pharmacy consent, dispatch proof, weak-match review, urgent return, and bounce-back remain explicit and case-local until authoritative settlement.",
            scope="Pharmacy loop",
            affected_machine_ids=("SM_PHARMACY_CASE_STATUS", "SM_PHARMACY_CONSENT_CHECKPOINT", "SM_PHARMACY_DISPATCH_STATUS"),
            affected_objects=("PharmacyCase", "PharmacyConsentCheckpoint", "PharmacyDispatchAttempt"),
            related_guards=("Current consent checkpoint and dispatch tuple remain current",),
            related_proofs=("PharmacyConsentCheckpoint", "PharmacyDispatchAttempt", "PharmacyOutcomeReconciliationGate", "PharmacyBounceBackRecord"),
            violating_transition_refs=("ISSUE_SM_PHARMACY_DISPATCH_STATUS_TRANSPORT_ACCEPTED_PROOF_SATISFIED", "ISSUE_SM_PHARMACY_CASE_STATUS_OUTCOME_RECONCILIATION_PENDING_OUTCOME_RECORDED"),
            source_refs=(
                "phase-6-the-pharmacy-loop.md#6A Pharmacy contract, case model, and state machine",
                "phase-6-the-pharmacy-loop.md#6D Referral pack composer, dispatch adapters, and transport contract",
                "phase-6-the-pharmacy-loop.md#6F Outcome ingest, Update Record observation, and reconciliation",
                "phase-6-the-pharmacy-loop.md#6G Bounce-back, urgent return, and reopen mechanics",
            ),
            test_hint="Dispatch, weak outcome matching, bounce-back, and no-contact return all remain explicit. None may collapse into generic request success or closure.",
            phase_scope=("phase_6_pharmacy_loop",),
        ),
        InvariantSpec(
            invariant_id="INV_ASSISTIVE_FREEZE_IN_PLACE",
            canonical_wording="Assistive freeze, quarantine, downgrade, and rollout ceiling are explicit and remain in the same shell when live posture drifts.",
            scope="Assistive capability visibility",
            affected_machine_ids=("SM_ASSISTIVE_TRUST_ENVELOPE", "SM_ASSISTIVE_ROLLOUT_VERDICT", "SM_AUDIENCE_SURFACE_RUNTIME_BINDING"),
            affected_objects=("AssistiveCapabilityTrustEnvelope", "AssistiveCapabilityRolloutVerdict", "AudienceSurfaceRuntimeBinding"),
            related_guards=("Current watch tuple, rollout verdict, trust envelope, and runtime tuple must all agree before visible assistive controls stay live",),
            related_proofs=("AssistiveFreezeFrame", "AssistiveCapabilityRolloutVerdict", "AssistiveCapabilityTrustEnvelope"),
            violating_transition_refs=("ISSUE_SM_ASSISTIVE_TRUST_ENVELOPE_DEGRADED_TRUSTED", "ISSUE_SM_ASSISTIVE_ROLLOUT_VERDICT_SHADOW_ONLY_VISIBLE_INSERT"),
            source_refs=(
                "phase-8-the-assistive-layer.md#8A Assistive capability contract, intended-use boundaries, and policy envelope",
                "phase-8-the-assistive-layer.md#8G Monitoring, drift, fairness, and live safety controls",
                "forensic-audit-findings.md#Finding 94 - The audit still treated assistive output as a generic sidecar instead of a trust-bound same-shell capability",
            ),
            test_hint="When trust, publication, selected-anchor, or continuity drifts, keep provenance visible where allowed but freeze accept/insert/export/close-task affordances immediately in the same shell.",
            phase_scope=("phase_8_assistive_layer",),
        ),
        InvariantSpec(
            invariant_id="INV_RETENTION_AND_RESILIENCE_GATE_EXPORTS",
            canonical_wording="Retention, legal hold, recovery evidence admissibility, and resilience binding posture gate archive, delete, export, and live operator controls.",
            scope="Phase 9 export and control posture",
            affected_machine_ids=("SM_DISPOSITION_ELIGIBILITY", "SM_LEGAL_HOLD_STATE", "SM_RESILIENCE_SURFACE_BINDING", "SM_RECOVERY_CONTROL_POSTURE"),
            affected_objects=("DispositionEligibilityAssessment", "LegalHoldRecord", "ResilienceSurfaceRuntimeBinding", "RecoveryControlPosture"),
            related_guards=("Current graph completeness, hold scope, and resilience tuple remain mandatory",),
            related_proofs=("DispositionEligibilityAssessment", "LegalHoldRecord", "RecoveryEvidencePack", "ResilienceSurfaceRuntimeBinding"),
            violating_transition_refs=("ISSUE_SM_DISPOSITION_ELIGIBILITY_BLOCKED_DELETE_ALLOWED", "ISSUE_SM_RESILIENCE_SURFACE_BINDING_DIAGNOSTIC_ONLY_LIVE", "ISSUE_SM_RECOVERY_CONTROL_POSTURE_DIAGNOSTIC_ONLY_LIVE_CONTROL"),
            source_refs=(
                "phase-9-the-assurance-ledger.md#Records lifecycle, retention, legal hold, and deletion engine",
                "phase-9-the-assurance-ledger.md#9F Resilience architecture, restore orchestration, and chaos programme",
            ),
            test_hint="Delete, export, restore, failover, and chaos controls must all fail closed when holds, graph dependencies, stale evidence packs, or tuple drift remain unresolved.",
            phase_scope=("phase_9_assurance_ledger",),
        ),
        InvariantSpec(
            invariant_id="INV_CONTINUITY_PROOF_REQUIRED_FOR_SIGNOFF",
            canonical_wording="Continuity evidence is promotion-critical and BAU sign-off cannot become exact without fresh continuity bundles in the same scorecard tuple.",
            scope="Cross-phase programme truth",
            affected_machine_ids=("SM_CROSS_PHASE_SCORECARD", "SM_AUDIENCE_SURFACE_RUNTIME_BINDING", "SM_RECOVERY_CONTROL_POSTURE"),
            affected_objects=("CrossPhaseConformanceScorecard", "GovernanceContinuityEvidenceBundle", "ExperienceContinuityControlEvidence"),
            related_guards=("Current planning summary, runtime publication tuple, verification tuple, and continuity proof set must all still hash together",),
            related_proofs=("CrossPhaseConformanceScorecard", "GovernanceContinuityEvidenceBundle", "ExperienceContinuityControlEvidence"),
            violating_transition_refs=("ISSUE_SM_CROSS_PHASE_SCORECARD_BLOCKED_EXACT",),
            source_refs=(
                "phase-9-the-assurance-ledger.md#9I Full-program exercises, BAU transfer, and formal exit gate",
                "forensic-audit-findings.md#Finding 103 - Governance compliance review still omitted continuity-evidence bundles",
                "forensic-audit-findings.md#Finding 104 - The admin control plane still treated continuity proof as optional release commentary",
                "forensic-audit-findings.md#Finding 105 - The audited top-level flow still had no explicit continuity-evidence spine",
            ),
            test_hint="Block BAUReadinessPack signoff and release stabilization whenever continuity evidence for affected shells is stale, missing, or not exact on the current scorecard hash.",
            phase_scope=("phase_9_assurance_ledger", "cross_phase"),
        ),
    ]


def build_state_term_conflicts(machines: list[dict[str, Any]]) -> list[dict[str, Any]]:
    usage: dict[str, list[str]] = defaultdict(list)
    for machine in machines:
        for state in machine["states"]:
            usage[state["value"]].append(machine["machine_id"])
    conflicts = []
    for state_value, machine_ids in sorted(usage.items()):
        unique = sorted(set(machine_ids))
        if len(unique) < 2:
            continue
        conflicts.append(
            {
                "issue_id": f"CONFLICT_STATE_TERM_{token(state_value)}",
                "issue_type": "state_term_reuse",
                "state_value": state_value,
                "machine_ids": unique,
                "dangerous_interpretation": f"The token `{state_value}` appears in multiple machines and can be misread as one shared status axis.",
                "canonical_correction": "Always qualify duplicated state terms by owning machine and object; never mirror the label across machines without tuple and proof context.",
            }
        )
    return conflicts


def build_transition_rows(machines: list[dict[str, Any]]) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    for machine in machines:
        for transition in machine["legal_transitions"]:
            rows.append(
                {
                    "transition_id": transition["transition_id"],
                    "machine_id": machine["machine_id"],
                    "canonical_name": machine["canonical_name"],
                    "machine_family": machine["machine_family"],
                    "phase_tags": machine["phase_tags"],
                    "state_axis_type": machine["state_axis_type"],
                    "from_state": transition["from_state"],
                    "to_state": transition["to_state"],
                    "trigger": transition["trigger"],
                    "coordinator_owned": transition["coordinator_owned"],
                    "guards": transition["guards"],
                    "authoritative_proofs": transition["authoritative_proofs"],
                    "related_objects": transition["related_objects"],
                    "degraded_posture": transition["degraded_posture"],
                    "closure_blocker_interactions": transition["closure_blocker_interactions"],
                    "source_refs": transition["source_refs"],
                    "notes": transition["notes"],
                }
            )
    return rows


def build_guard_rows(transition_rows: list[dict[str, Any]]) -> list[dict[str, Any]]:
    rows = []
    for row in transition_rows:
        rows.append(
            {
                "transition_id": row["transition_id"],
                "machine_id": row["machine_id"],
                "canonical_name": row["canonical_name"],
                "from_state": row["from_state"],
                "to_state": row["to_state"],
                "trigger": row["trigger"],
                "guards": row["guards"],
                "authoritative_proofs": row["authoritative_proofs"],
                "degraded_posture_if_missing": row["degraded_posture"] or "blocked / recovery_only",
                "closure_blocker_interactions": row["closure_blocker_interactions"],
                "related_objects": row["related_objects"],
                "source_refs": row["source_refs"],
            }
        )
    return rows


def build_illegal_payload(machines: list[dict[str, Any]]) -> dict[str, Any]:
    illegal_rows = []
    for machine in machines:
        illegal_rows.extend(machine["illegal_transitions"])
    state_conflicts = build_state_term_conflicts(machines)
    return {
        "register_id": "vecells_illegal_transitions_v1",
        "summary": {
            "illegal_transition_count": len(illegal_rows),
            "state_term_conflict_count": len(state_conflicts),
            "total_conflict_count": len(illegal_rows) + len(state_conflicts),
        },
        "illegal_transition_rows": illegal_rows,
        "state_term_conflicts": state_conflicts,
    }


def build_relationship_edges(machines: list[dict[str, Any]], invariants: list[dict[str, Any]]) -> list[tuple[str, str]]:
    edges: set[tuple[str, str]] = set()
    for machine in machines:
        for target in machine["related_machine_ids"]:
            edges.add((machine["machine_id"], target))
    for invariant in invariants:
        for machine_id in invariant["affected_machine_ids"]:
            edges.add((invariant["invariant_id"], machine_id))
    return sorted(edges)


def build_mermaid(machines: list[dict[str, Any]], invariants: list[dict[str, Any]]) -> str:
    family_groups: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for machine in machines:
        family_groups[machine["machine_family"]].append(machine)
    lines = ["graph LR"]
    for family, rows in sorted(family_groups.items()):
        lines.append(f'  subgraph {token(family)}["{family.replace("_", " ").title()}"]')
        for row in rows:
            lines.append(f'    {row["machine_id"]}["{row["canonical_name"]}"]')
        lines.append("  end")
    lines.append('  subgraph INVARIANTS["Phase-0 and Cross-Phase Invariants"]')
    for invariant in invariants:
        lines.append(f'    {invariant["invariant_id"]}["{invariant["invariant_id"]}"]')
    lines.append("  end")
    for source, target in build_relationship_edges(machines, invariants):
        lines.append(f"  {source} --> {target}")
    return "\n".join(lines) + "\n"


def build_machine_payload(machines: list[dict[str, Any]], upstream: dict[str, int], illegal_payload: dict[str, Any], invariants: list[dict[str, Any]]) -> dict[str, Any]:
    state_count = sum(len(machine["states"]) for machine in machines)
    guard_count = len({guard for machine in machines for guard in machine["required_guards"]})
    proof_count = len({proof for machine in machines for proof in machine["required_authoritative_proofs"]})
    return {
        "atlas_id": "vecells_state_machine_atlas_v1",
        "mission": "Formalize canonical and phase-local state machines so later implementation does not infer control semantics from prose.",
        "source_precedence": SOURCE_PRECEDENCE,
        "upstream_inputs": upstream,
        "summary": {
            "machine_count": len(machines),
            "state_count": state_count,
            "transition_count": sum(len(machine["legal_transitions"]) for machine in machines),
            "guard_count": guard_count,
            "proof_count": proof_count,
            "invariant_count": len(invariants),
            "conflict_count": illegal_payload["summary"]["total_conflict_count"],
        },
        "machines": machines,
    }


def serialize_invariants(invariants: list[InvariantSpec]) -> list[dict[str, Any]]:
    rows = []
    for invariant in invariants:
        payload = asdict(invariant)
        payload["affected_machine_ids"] = list(invariant.affected_machine_ids)
        payload["affected_objects"] = list(invariant.affected_objects)
        payload["related_guards"] = list(invariant.related_guards)
        payload["related_proofs"] = list(invariant.related_proofs)
        payload["violating_transition_refs"] = list(invariant.violating_transition_refs)
        payload["source_refs"] = list(invariant.source_refs)
        payload["phase_scope"] = list(invariant.phase_scope)
        rows.append(payload)
    return rows


def build_invariant_payload(invariants: list[dict[str, Any]]) -> dict[str, Any]:
    return {
        "library_id": "vecells_cross_phase_invariants_v1",
        "summary": {
            "invariant_count": len(invariants),
            "phase_scope_count": len({phase for row in invariants for phase in row["phase_scope"]}),
        },
        "invariants": invariants,
    }


def render_state_machine_doc(machine_payload: dict[str, Any]) -> str:
    machines = machine_payload["machines"]
    summary = machine_payload["summary"]
    header = textwrap.dedent(
        f"""
        # 07 State Machine Atlas

        This atlas freezes Vecells state ownership before implementation.

        Summary:

        - Machines: {summary["machine_count"]}
        - States: {summary["state_count"]}
        - Transitions: {summary["transition_count"]}
        - Guards: {summary["guard_count"]}
        - Proof classes: {summary["proof_count"]}
        - Invariants: {summary["invariant_count"]}
        - Conflicts: {summary["conflict_count"]}

        ## Machine Inventory
        """
    ).strip()
    rows = [
        [
            row["machine_id"],
            row["canonical_name"],
            row["machine_family"],
            row["state_axis_type"],
            len(row["states"]),
            row["initial_state"],
            row["terminal_states"],
            row["whether_transition_is_coordinator_owned"],
        ]
        for row in machines
    ]
    return header + "\n\n" + render_table(
        ["Machine ID", "Canonical Name", "Family", "Axis", "States", "Initial", "Terminal", "Coordinator Owned"],
        rows,
    )


def render_invariants_doc(invariant_payload: dict[str, Any]) -> str:
    rows = [
        [
            row["invariant_id"],
            row["scope"],
            row["canonical_wording"],
            row["affected_machine_ids"],
            row["violating_transition_refs"],
        ]
        for row in invariant_payload["invariants"]
    ]
    return "# 07 Cross-Phase Invariants\n\n" + render_table(
        ["Invariant ID", "Scope", "Canonical Wording", "Affected Machines", "Violating Refs"],
        rows,
    )


def render_transitions_doc(transition_rows: list[dict[str, Any]]) -> str:
    rows = [
        [
            row["transition_id"],
            row["canonical_name"],
            row["from_state"],
            row["to_state"],
            row["trigger"],
            row["coordinator_owned"],
        ]
        for row in transition_rows
    ]
    return "# 07 Transition Tables\n\n" + render_table(
        ["Transition ID", "Machine", "From", "To", "Trigger", "Coordinator Owned"],
        rows,
    )


def render_guards_doc(guard_rows: list[dict[str, Any]]) -> str:
    rows = [
        [
            row["transition_id"],
            row["canonical_name"],
            row["guards"],
            row["authoritative_proofs"],
            row["degraded_posture_if_missing"],
        ]
        for row in guard_rows
    ]
    return "# 07 Guard And Proof Matrix\n\n" + render_table(
        ["Transition ID", "Machine", "Guards", "Authoritative Proofs", "Degraded Posture If Missing"],
        rows,
    )


def render_illegal_doc(illegal_payload: dict[str, Any]) -> str:
    illegal_rows = illegal_payload["illegal_transition_rows"]
    conflict_rows = illegal_payload["state_term_conflicts"]
    sections = [
        "# 07 Illegal Transition And Conflict Report",
        "",
        "## High-Signal Illegal Transitions",
        "",
        render_table(
            ["Issue ID", "Machine", "From", "To", "Type", "Canonical Correction"],
            [
                [
                    row["issue_id"],
                    row["machine_id"],
                    row["from_state"],
                    row["to_state"],
                    row["issue_type"],
                    row["canonical_correction"],
                ]
                for row in illegal_rows
            ],
        ),
        "",
        "## Reused State Terms",
        "",
        render_table(
            ["Conflict ID", "State Value", "Machines", "Canonical Correction"],
            [
                [
                    row["issue_id"],
                    row["state_value"],
                    row["machine_ids"],
                    row["canonical_correction"],
                ]
                for row in conflict_rows
            ],
        ),
    ]
    return "\n".join(sections)


def build_html(machine_payload: dict[str, Any], invariant_payload: dict[str, Any], illegal_payload: dict[str, Any], transition_rows: list[dict[str, Any]]) -> str:
    atlas = {
        "machine_payload": machine_payload,
        "invariant_payload": invariant_payload,
        "illegal_payload": illegal_payload,
        "transition_rows": transition_rows,
    }
    atlas_json = json.dumps(atlas).replace("</", "<\\/")
    return textwrap.dedent(
        f"""\
        <!doctype html>
        <html lang="en">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>Vecells State Observatory</title>
          <link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='14' fill='%23335CFF'/%3E%3Cpath d='M17 18h10l6 18 6-18h10L37 46h-10z' fill='white'/%3E%3C/svg%3E">
          <style>
            :root {{
              color-scheme: light;
              --bg: #F5F7FA;
              --surface: #FFFFFF;
              --ink: #121826;
              --muted: #475467;
              --border: #D0D5DD;
              --cobalt: #335CFF;
              --teal: #0F8B8D;
              --success: #0F9D58;
              --warning: #C98900;
              --danger: #C24141;
              --lavender: #6E59D9;
              --neutral: #98A2B3;
              --shadow: 0 8px 24px rgba(18,24,38,0.06);
              --focus: 2px solid #335CFF;
            }}
            * {{ box-sizing: border-box; }}
            body {{
              margin: 0;
              font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
              background: radial-gradient(circle at top left, rgba(51,92,255,0.12), transparent 28%), var(--bg);
              color: var(--ink);
            }}
            a {{ color: inherit; }}
            button, input, select {{
              font: inherit;
            }}
            button:focus-visible, input:focus-visible, select:focus-visible, [tabindex]:focus-visible {{
              outline: var(--focus);
              outline-offset: 2px;
            }}
            .shell {{
              min-height: 100vh;
              display: grid;
              grid-template-columns: 280px 1fr 340px;
              gap: 24px;
              max-width: 1440px;
              margin: 0 auto;
              padding: 24px 32px 40px;
            }}
            .card {{
              background: var(--surface);
              border: 1px solid var(--border);
              border-radius: 16px;
              box-shadow: var(--shadow);
            }}
            .nav {{
              padding: 24px;
              position: sticky;
              top: 24px;
              height: calc(100vh - 48px);
              overflow: auto;
            }}
            .monogram {{
              width: 44px;
              height: 44px;
              border-radius: 14px;
              display: grid;
              place-items: center;
              background: linear-gradient(135deg, rgba(51,92,255,0.12), rgba(15,139,141,0.14));
              margin-bottom: 16px;
            }}
            .monogram svg {{
              width: 22px;
              height: 22px;
            }}
            .nav h1 {{
              margin: 0;
              font-size: 28px;
              line-height: 34px;
              font-weight: 600;
            }}
            .nav p {{
              color: var(--muted);
              margin: 8px 0 20px;
              font-size: 14px;
              line-height: 22px;
            }}
            .section-title {{
              font-size: 12px;
              line-height: 18px;
              text-transform: uppercase;
              letter-spacing: 0.08em;
              color: var(--muted);
              margin: 20px 0 12px;
            }}
            .family-list, .machine-list, .invariant-list {{
              display: grid;
              gap: 8px;
            }}
            .family-chip, .machine-button, .invariant-button, .pill, .tab {{
              border-radius: 999px;
              border: 1px solid var(--border);
              background: #fff;
              color: var(--ink);
              padding: 8px 12px;
              text-align: left;
              cursor: pointer;
              transition: transform 140ms ease, box-shadow 140ms ease, border-color 140ms ease;
            }}
            .machine-button, .invariant-button {{
              border-radius: 14px;
              padding: 12px 14px;
            }}
            .family-chip:hover, .machine-button:hover, .invariant-button:hover, .tab:hover {{
              transform: translateY(-1px);
              box-shadow: var(--shadow);
            }}
            .active-chip {{
              border-color: var(--cobalt);
              background: rgba(51,92,255,0.08);
            }}
            main {{
              display: grid;
              gap: 20px;
              align-content: start;
            }}
            .hero {{
              padding: 18px 20px;
            }}
            .hero-head {{
              display: flex;
              justify-content: space-between;
              align-items: center;
              gap: 12px;
              flex-wrap: wrap;
            }}
            .tabs {{
              display: inline-flex;
              gap: 8px;
            }}
            .tab.active-chip {{
              color: var(--cobalt);
            }}
            .hero-grid {{
              margin-top: 18px;
              display: grid;
              grid-template-columns: repeat(6, minmax(0, 1fr));
              gap: 12px;
            }}
            .metric {{
              border: 1px solid var(--border);
              border-radius: 14px;
              padding: 14px;
              background: linear-gradient(180deg, rgba(255,255,255,1), rgba(245,247,250,0.9));
            }}
            .metric .value {{
              font-size: 24px;
              line-height: 30px;
              font-weight: 600;
            }}
            .metric .label {{
              color: var(--muted);
              font-size: 13px;
              line-height: 20px;
            }}
            .filters {{
              padding: 20px;
              display: grid;
              grid-template-columns: 2fr repeat(4, 1fr);
              gap: 12px;
            }}
            .filters label {{
              display: grid;
              gap: 6px;
              font-size: 13px;
              color: var(--muted);
            }}
            .filters input, .filters select {{
              min-width: 0;
              border: 1px solid var(--border);
              border-radius: 12px;
              padding: 10px 12px;
              background: #fff;
              color: var(--ink);
            }}
            .diagram-card, .table-card {{
              padding: 20px;
            }}
            .diagram-head {{
              display: flex;
              justify-content: space-between;
              align-items: center;
              gap: 12px;
              margin-bottom: 14px;
              flex-wrap: wrap;
            }}
            .diagram-subtle {{
              color: var(--muted);
              font-size: 13px;
              line-height: 20px;
            }}
            .diagram-wrap {{
              border: 1px solid var(--border);
              border-radius: 16px;
              padding: 16px;
              background: linear-gradient(180deg, rgba(51,92,255,0.03), rgba(255,255,255,1));
              min-height: 360px;
              transition: opacity 160ms ease, transform 160ms ease;
            }}
            .diagram-wrap.switching {{
              opacity: 0.6;
              transform: translateY(4px);
            }}
            svg {{
              width: 100%;
              height: auto;
              display: block;
            }}
            .timeline {{
              margin-top: 16px;
              display: flex;
              flex-wrap: wrap;
              gap: 8px;
            }}
            .timeline .pill {{
              cursor: default;
            }}
            .pill.terminal {{
              border-color: rgba(15,157,88,0.32);
              background: rgba(15,157,88,0.08);
            }}
            .pill.degraded {{
              border-color: rgba(201,137,0,0.32);
              background: rgba(201,137,0,0.08);
            }}
            .pill.supersession {{
              border-color: rgba(110,89,217,0.32);
              background: rgba(110,89,217,0.08);
            }}
            .lower-grid {{
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 20px;
            }}
            table {{
              width: 100%;
              border-collapse: collapse;
            }}
            th, td {{
              text-align: left;
              vertical-align: top;
              border-bottom: 1px solid var(--border);
              padding: 10px 8px;
              font-size: 13px;
              line-height: 20px;
            }}
            th {{
              color: var(--muted);
              font-weight: 600;
            }}
            tbody tr:hover {{
              background: rgba(51,92,255,0.03);
            }}
            tbody button {{
              border: 0;
              background: none;
              padding: 0;
              color: inherit;
              text-align: left;
              cursor: pointer;
            }}
            aside {{
              display: grid;
              gap: 20px;
              align-content: start;
            }}
            .detail-card {{
              padding: 20px;
              position: sticky;
              top: 24px;
            }}
            .detail-block {{
              margin-top: 16px;
              border-top: 1px solid var(--border);
              padding-top: 16px;
            }}
            .detail-block h3 {{
              margin: 0 0 8px;
              font-size: 16px;
              line-height: 24px;
            }}
            .detail-block p, .detail-block li {{
              margin: 0;
              color: var(--muted);
              font-size: 14px;
              line-height: 22px;
            }}
            .detail-block ul {{
              margin: 8px 0 0;
              padding-left: 18px;
            }}
            .detail-key {{
              font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
              font-size: 12px;
              line-height: 18px;
            }}
            .empty, .blocked {{
              display: grid;
              place-items: center;
              min-height: 220px;
              color: var(--muted);
              text-align: center;
              border: 1px dashed var(--border);
              border-radius: 16px;
            }}
            .sr-only {{
              position: absolute;
              width: 1px;
              height: 1px;
              padding: 0;
              margin: -1px;
              overflow: hidden;
              clip: rect(0, 0, 0, 0);
              border: 0;
            }}
            @media (max-width: 1200px) {{
              .shell {{
                grid-template-columns: 260px 1fr;
              }}
              aside {{
                grid-column: 1 / -1;
              }}
              .detail-card {{
                position: static;
              }}
            }}
            @media (max-width: 920px) {{
              .shell {{
                grid-template-columns: 1fr;
                padding: 16px 20px 32px;
              }}
              .nav {{
                position: static;
                height: auto;
              }}
              .hero-grid {{
                grid-template-columns: repeat(3, minmax(0, 1fr));
              }}
              .filters {{
                grid-template-columns: 1fr 1fr;
              }}
              .lower-grid {{
                grid-template-columns: 1fr;
              }}
            }}
            @media (max-width: 640px) {{
              .shell {{
                padding: 16px;
                gap: 16px;
              }}
              .hero-grid {{
                grid-template-columns: repeat(2, minmax(0, 1fr));
              }}
              .filters {{
                grid-template-columns: 1fr;
              }}
              .diagram-wrap {{
                min-height: 280px;
              }}
            }}
          </style>
        </head>
        <body>
          <div class="shell" data-testid="atlas-shell">
            <nav class="nav card" aria-label="State observatory navigation" data-testid="atlas-nav">
              <div class="monogram" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="#335CFF" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="5" cy="5" r="2.2"></circle>
                  <circle cx="12" cy="18" r="2.2"></circle>
                  <circle cx="19" cy="5" r="2.2"></circle>
                  <path d="M6.8 6.7 12 15.8 17.2 6.7"></path>
                </svg>
              </div>
              <h1>State Observatory</h1>
              <p>Authoritative machine atlas, guard lattice, and cross-phase invariant index for Vecells.</p>
              <div class="section-title">Families</div>
              <div id="family-list" class="family-list"></div>
              <div class="section-title">Machines</div>
              <div id="machine-list" class="machine-list"></div>
              <div class="section-title">Invariant Groups</div>
              <div id="invariant-list" class="invariant-list"></div>
            </nav>

            <main>
              <section class="hero card" data-testid="hero-summary">
                <div class="hero-head">
                  <div>
                    <div class="section-title" style="margin:0 0 8px">Vecells Control Atlas</div>
                    <div id="hero-title" style="font-size:20px;line-height:28px;font-weight:600">Canonical and phase-local machines</div>
                  </div>
                  <div class="tabs" data-testid="view-toggle" role="tablist" aria-label="View switcher">
                    <button class="tab active-chip" id="tab-machine" role="tab" aria-selected="true">Machine View</button>
                    <button class="tab" id="tab-invariant" role="tab" aria-selected="false">Invariant View</button>
                  </div>
                </div>
                <div class="hero-grid" id="hero-metrics"></div>
              </section>

              <section class="filters card">
                <label>
                  Search
                  <input id="filter-search" data-testid="filter-search" type="search" placeholder="Search machine, state, or invariant">
                </label>
                <label>
                  Phase
                  <select id="filter-phase" data-testid="filter-phase"></select>
                </label>
                <label>
                  Bounded Context
                  <select id="filter-context" data-testid="filter-context"></select>
                </label>
                <label>
                  Axis Type
                  <select id="filter-axis" data-testid="filter-axis"></select>
                </label>
                <label>
                  Coordinator-Owned
                  <select id="filter-coordinator" data-testid="filter-coordinator"></select>
                </label>
              </section>

              <section class="diagram-card card">
                <div class="diagram-head">
                  <div>
                    <div id="diagram-title" style="font-size:16px;line-height:24px;font-weight:600">Selected machine</div>
                    <div id="diagram-subtitle" class="diagram-subtle">State diagram and exact table parity remain linked.</div>
                  </div>
                  <div id="diagram-tagline" class="diagram-subtle">Same-shell recovery preserved</div>
                </div>
                <div id="diagram-panel" class="diagram-wrap" data-testid="diagram-panel"></div>
                <div id="timeline-stripe" class="timeline" data-testid="timeline-stripe"></div>
              </section>

              <div class="lower-grid">
                <section class="table-card card">
                  <div class="diagram-head">
                    <div style="font-size:16px;line-height:24px;font-weight:600">Transition Parity</div>
                    <div class="diagram-subtle">Click a row for guard and proof detail.</div>
                  </div>
                  <div style="overflow:auto">
                    <table data-testid="transition-table">
                      <thead>
                        <tr>
                          <th>Transition</th>
                          <th>Trigger</th>
                          <th>Guards</th>
                          <th>Proofs</th>
                        </tr>
                      </thead>
                      <tbody id="transition-body"></tbody>
                    </table>
                  </div>
                </section>
                <section class="table-card card">
                  <div class="diagram-head">
                    <div style="font-size:16px;line-height:24px;font-weight:600">Illegal Transition And Conflict Parity</div>
                    <div class="diagram-subtle">High-risk overloads and illegal transitions remain explicit.</div>
                  </div>
                  <div style="overflow:auto">
                    <table data-testid="illegal-table">
                      <thead>
                        <tr>
                          <th>Issue</th>
                          <th>Type</th>
                          <th>Correction</th>
                        </tr>
                      </thead>
                      <tbody id="illegal-body"></tbody>
                    </table>
                  </div>
                </section>
              </div>

              <section class="table-card card" data-testid="machine-parity-table">
                <div class="diagram-head">
                  <div style="font-size:16px;line-height:24px;font-weight:600">Machine Parity Table</div>
                  <div class="diagram-subtle">Every machine keeps a table equivalent to its diagram.</div>
                </div>
                <div style="overflow:auto">
                  <table>
                    <thead>
                      <tr>
                        <th>Machine</th>
                        <th>Axis</th>
                        <th>States</th>
                        <th>Initial</th>
                        <th>Terminal</th>
                      </tr>
                    </thead>
                    <tbody id="machine-parity-body"></tbody>
                  </table>
                </div>
              </section>
            </main>

            <aside>
              <section class="detail-card card" data-testid="detail-panel">
                <div class="section-title" style="margin-top:0">Selection Detail</div>
                <div id="detail-head" style="font-size:20px;line-height:28px;font-weight:600">Waiting for selection</div>
                <div id="detail-sub" class="diagram-subtle" style="margin-top:6px">Choose a machine, invariant, or transition.</div>
                <div id="detail-blocks"></div>
              </section>
              <section class="table-card card">
                <div class="diagram-head">
                  <div style="font-size:16px;line-height:24px;font-weight:600">Invariant Lattice</div>
                  <div class="diagram-subtle">Phase-0 constraints applied to phase-local machines.</div>
                </div>
                <div id="invariant-lattice" class="diagram-wrap" data-testid="invariant-lattice"></div>
              </section>
            </aside>
          </div>

          <div class="sr-only" aria-live="polite" id="announcer"></div>
          <script id="atlas-data" type="application/json">{atlas_json}</script>
          <script>
            const atlas = JSON.parse(document.getElementById('atlas-data').textContent);
            const machines = atlas.machine_payload.machines;
            const invariants = atlas.invariant_payload.invariants;
            const illegalRows = atlas.illegal_payload.illegal_transition_rows;
            const stateConflicts = atlas.illegal_payload.state_term_conflicts;

            const state = {{
              view: 'machine',
              family: 'all',
              search: '',
              phase: 'all',
              context: 'all',
              axis: 'all',
              coordinator: 'all',
              selectedMachineId: machines[0]?.machine_id || null,
              selectedInvariantId: invariants[0]?.invariant_id || null,
              selectedTransitionId: null,
            }};

            const familyList = document.getElementById('family-list');
            const machineList = document.getElementById('machine-list');
            const invariantList = document.getElementById('invariant-list');
            const heroMetrics = document.getElementById('hero-metrics');
            const heroTitle = document.getElementById('hero-title');
            const diagramPanel = document.getElementById('diagram-panel');
            const timelineStripe = document.getElementById('timeline-stripe');
            const transitionBody = document.getElementById('transition-body');
            const illegalBody = document.getElementById('illegal-body');
            const machineParityBody = document.getElementById('machine-parity-body');
            const detailHead = document.getElementById('detail-head');
            const detailSub = document.getElementById('detail-sub');
            const detailBlocks = document.getElementById('detail-blocks');
            const invariantLattice = document.getElementById('invariant-lattice');
            const diagramTitle = document.getElementById('diagram-title');
            const diagramSubtitle = document.getElementById('diagram-subtitle');
            const diagramTagline = document.getElementById('diagram-tagline');
            const announcer = document.getElementById('announcer');

            const phaseOptions = ['all', ...new Set(machines.flatMap((machine) => machine.phase_tags))];
            const contextOptions = ['all', ...new Set(machines.map((machine) => machine.bounded_context))];
            const axisOptions = ['all', ...new Set(machines.map((machine) => machine.state_axis_type))];
            const familyOptions = ['all', ...new Set(machines.map((machine) => machine.machine_family))];

            function fillSelect(id, values) {{
              const select = document.getElementById(id);
              select.innerHTML = '';
              values.forEach((value) => {{
                const option = document.createElement('option');
                option.value = value;
                option.textContent = value === 'all' ? 'All' : value;
                select.appendChild(option);
              }});
            }}

            fillSelect('filter-phase', phaseOptions);
            fillSelect('filter-context', contextOptions);
            fillSelect('filter-axis', axisOptions);
            fillSelect('filter-coordinator', ['all', 'coordinator_only', 'delegated_only']);

            function announce(text) {{
              announcer.textContent = text;
            }}

            function currentMachine() {{
              return machines.find((machine) => machine.machine_id === state.selectedMachineId) || filteredMachines()[0] || null;
            }}

            function currentInvariant() {{
              return invariants.find((item) => item.invariant_id === state.selectedInvariantId) || invariants[0] || null;
            }}

            function filteredMachines() {{
              const search = state.search.trim().toLowerCase();
              return machines.filter((machine) => {{
                if (state.family !== 'all' && machine.machine_family !== state.family) return false;
                if (state.phase !== 'all' && !machine.phase_tags.includes(state.phase)) return false;
                if (state.context !== 'all' && machine.bounded_context !== state.context) return false;
                if (state.axis !== 'all' && machine.state_axis_type !== state.axis) return false;
                if (state.coordinator === 'coordinator_only' && !machine.whether_transition_is_coordinator_owned) return false;
                if (state.coordinator === 'delegated_only' && machine.whether_transition_is_coordinator_owned) return false;
                if (!search) return true;
                const haystack = [
                  machine.canonical_name,
                  machine.machine_id,
                  machine.bounded_context,
                  ...machine.states.map((row) => row.value),
                ].join(' ').toLowerCase();
                return haystack.includes(search);
              }});
            }}

            function filteredInvariants() {{
              const machineIds = new Set(filteredMachines().map((machine) => machine.machine_id));
              const search = state.search.trim().toLowerCase();
              return invariants.filter((invariant) => {{
                const matchesMachine = invariant.affected_machine_ids.some((machineId) => machineIds.has(machineId));
                const matchesSearch = !search || [
                  invariant.invariant_id,
                  invariant.canonical_wording,
                  ...invariant.affected_machine_ids,
                ].join(' ').toLowerCase().includes(search);
                return matchesMachine && matchesSearch;
              }});
            }}

            function renderNav() {{
              familyList.innerHTML = '';
              familyOptions.forEach((family) => {{
                const button = document.createElement('button');
                button.className = 'family-chip' + (state.family === family ? ' active-chip' : '');
                button.textContent = family === 'all' ? 'All families' : family.replaceAll('_', ' ');
                button.onclick = () => {{
                  state.family = family;
                  render();
                  announce('Family filter changed');
                }};
                familyList.appendChild(button);
              }});

              const visibleMachines = filteredMachines();
              if (!visibleMachines.find((machine) => machine.machine_id === state.selectedMachineId)) {{
                state.selectedMachineId = visibleMachines[0]?.machine_id || null;
              }}
              machineList.innerHTML = '';
              visibleMachines.forEach((machine) => {{
                const button = document.createElement('button');
                button.className = 'machine-button' + (state.selectedMachineId === machine.machine_id ? ' active-chip' : '');
                button.innerHTML = `<strong>${{machine.canonical_name}}</strong><div class="diagram-subtle">${{machine.state_axis_type}} | ${{machine.machine_family.replaceAll('_', ' ')}}</div>`;
                button.onclick = () => {{
                  state.selectedMachineId = machine.machine_id;
                  location.hash = machine.machine_id;
                  render();
                }};
                machineList.appendChild(button);
              }});

              const visibleInvariants = filteredInvariants();
              if (!visibleInvariants.find((item) => item.invariant_id === state.selectedInvariantId)) {{
                state.selectedInvariantId = visibleInvariants[0]?.invariant_id || null;
              }}
              invariantList.innerHTML = '';
              visibleInvariants.forEach((invariant) => {{
                const button = document.createElement('button');
                button.className = 'invariant-button' + (state.selectedInvariantId === invariant.invariant_id ? ' active-chip' : '');
                button.innerHTML = `<strong>${{invariant.invariant_id}}</strong><div class="diagram-subtle">${{invariant.scope}}</div>`;
                button.onclick = () => {{
                  state.selectedInvariantId = invariant.invariant_id;
                  location.hash = invariant.invariant_id;
                  render();
                }};
                invariantList.appendChild(button);
              }});
            }}

            function renderHero() {{
              const visibleMachines = filteredMachines();
              const visibleInvariants = filteredInvariants();
              const visibleTransitions = visibleMachines.flatMap((machine) => machine.legal_transitions);
              const guardCount = new Set(visibleTransitions.flatMap((row) => row.guards)).size;
              const proofCount = new Set(visibleTransitions.flatMap((row) => row.authoritative_proofs)).size;
              const metrics = [
                ['Machines', visibleMachines.length],
                ['States', visibleMachines.reduce((sum, machine) => sum + machine.states.length, 0)],
                ['Guards', guardCount],
                ['Proofs', proofCount],
                ['Invariants', visibleInvariants.length],
                ['Conflicts', atlas.illegal_payload.summary.total_conflict_count],
              ];
              heroMetrics.innerHTML = '';
              metrics.forEach(([label, value]) => {{
                const card = document.createElement('div');
                card.className = 'metric';
                card.innerHTML = `<div class="value">${{value}}</div><div class="label">${{label}}</div>`;
                heroMetrics.appendChild(card);
              }});
              heroTitle.textContent = state.view === 'machine'
                ? 'Canonical and phase-local machine view'
                : 'Invariant lattice and constraint view';
            }}

            function nodeColor(classification) {{
              if (classification === 'terminal') return '#E7F6EC';
              if (classification === 'degraded') return '#FFF3D6';
              if (classification === 'supersession') return '#EEE8FF';
              return '#FFFFFF';
            }}

            function renderMachineDiagram(machine) {{
              if (!machine) {{
                diagramPanel.innerHTML = '<div class="empty">No machine matches the current filter set.</div>';
                timelineStripe.innerHTML = '';
                return;
              }}
              diagramPanel.classList.add('switching');
              setTimeout(() => diagramPanel.classList.remove('switching'), 120);
              const maxOrder = Math.max(...machine.states.map((row) => row.order));
              const maxLane = Math.max(...machine.states.map((row) => row.lane));
              const width = (maxOrder + 1) * 170 + 120;
              const height = (maxLane + 1) * 120 + 80;
              const positions = {{}};
              machine.states.forEach((stateNode) => {{
                positions[stateNode.value] = {{
                  x: 80 + stateNode.order * 170,
                  y: 50 + stateNode.lane * 120,
                }};
              }});
              let svg = `<svg viewBox="0 0 ${{width}} ${{height}}" aria-label="${{machine.canonical_name}} state diagram">`;
              machine.legal_transitions.forEach((transition) => {{
                const from = positions[transition.from_state];
                const to = positions[transition.to_state];
                if (!from || !to) return;
                const selected = state.selectedTransitionId === transition.transition_id;
                svg += `<line x1="${{from.x + 66}}" y1="${{from.y + 22}}" x2="${{to.x}}" y2="${{to.y + 22}}" stroke="${{selected ? '#335CFF' : '#98A2B3'}}" stroke-width="${{selected ? 3 : 2}}" marker-end="url(#arrow)"></line>`;
              }});
              svg += `<defs><marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="#98A2B3"></path></marker></defs>`;
              machine.states.forEach((stateNode) => {{
                const pos = positions[stateNode.value];
                svg += `<rect x="${{pos.x}}" y="${{pos.y}}" width="132" height="44" rx="14" fill="${{nodeColor(stateNode.classification)}}" stroke="#D0D5DD"></rect>`;
                svg += `<text x="${{pos.x + 12}}" y="${{pos.y + 27}}" font-size="12" fill="#121826">${{stateNode.value}}</text>`;
              }});
              svg += `</svg>`;
              diagramPanel.innerHTML = svg;
              timelineStripe.innerHTML = '';
              machine.states.slice().sort((a, b) => a.order - b.order || a.lane - b.lane).forEach((stateNode) => {{
                const pill = document.createElement('span');
                pill.className = 'pill ' + (stateNode.classification || '');
                pill.textContent = stateNode.value;
                timelineStripe.appendChild(pill);
              }});
              diagramTitle.textContent = machine.canonical_name;
              diagramSubtitle.textContent = `${{machine.source_file}} · ${{machine.source_heading_or_block}}`;
              diagramTagline.textContent = machine.notes;
            }}

            function renderInvariantLattice() {{
              const rows = filteredInvariants();
              if (!rows.length) {{
                invariantLattice.innerHTML = '<div class="empty">No invariants match the current filter set.</div>';
                return;
              }}
              const machineIds = filteredMachines().map((machine) => machine.machine_id);
              const relevantMachines = filteredMachines().slice(0, 10);
              const width = 1080;
              const rowHeight = 70;
              const height = Math.max(rows.length, relevantMachines.length) * rowHeight + 80;
              let svg = `<svg viewBox="0 0 ${{width}} ${{height}}" aria-label="Invariant lattice">`;
              svg += `<defs><marker id="latArrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="#98A2B3"></path></marker></defs>`;
              const leftPositions = {{}};
              rows.forEach((item, index) => {{
                const y = 40 + index * rowHeight;
                leftPositions[item.invariant_id] = y;
                svg += `<rect x="20" y="${{y}}" width="280" height="44" rx="14" fill="#FFFFFF" stroke="#D0D5DD"></rect>`;
                svg += `<text x="34" y="${{y + 27}}" font-size="12" fill="#121826">${{item.invariant_id}}</text>`;
              }});
              const rightPositions = {{}};
              relevantMachines.forEach((item, index) => {{
                const y = 40 + index * rowHeight;
                rightPositions[item.machine_id] = y;
                svg += `<rect x="780" y="${{y}}" width="280" height="44" rx="14" fill="#FFFFFF" stroke="#D0D5DD"></rect>`;
                svg += `<text x="794" y="${{y + 27}}" font-size="12" fill="#121826">${{item.canonical_name}}</text>`;
              }});
              rows.forEach((item) => {{
                item.affected_machine_ids
                  .filter((machineId) => machineIds.includes(machineId) && rightPositions[machineId] !== undefined)
                  .forEach((machineId) => {{
                    svg += `<line x1="300" y1="${{leftPositions[item.invariant_id] + 22}}" x2="780" y2="${{rightPositions[machineId] + 22}}" stroke="#98A2B3" stroke-width="1.5" marker-end="url(#latArrow)"></line>`;
                  }});
              }});
              svg += `</svg>`;
              invariantLattice.innerHTML = svg;
            }}

            function renderTransitionTable(machine) {{
              transitionBody.innerHTML = '';
              if (!machine) return;
              machine.legal_transitions.forEach((transition) => {{
                const tr = document.createElement('tr');
                const button = document.createElement('button');
                button.textContent = `${{transition.from_state}} → ${{transition.to_state}}`;
                button.onclick = () => {{
                  state.selectedTransitionId = transition.transition_id;
                  renderDetail(machine, transition, currentInvariant());
                }};
                const cells = [
                  button,
                  transition.trigger,
                  transition.guards.join('; '),
                  transition.authoritative_proofs.join('; '),
                ];
                cells.forEach((cell, index) => {{
                  const td = document.createElement('td');
                  if (index === 0) {{
                    td.appendChild(cell);
                  }} else {{
                    td.textContent = cell;
                  }}
                  tr.appendChild(td);
                }});
                transitionBody.appendChild(tr);
              }});
            }}

            function renderIllegalTable(machine) {{
              illegalBody.innerHTML = '';
              const rows = [];
              if (machine) rows.push(...machine.illegal_transitions);
              rows.push(...stateConflicts.filter((row) => !machine || row.machine_ids.includes(machine.machine_id)).slice(0, 8));
              rows.forEach((issue) => {{
                const tr = document.createElement('tr');
                const idCell = document.createElement('td');
                idCell.innerHTML = `<div class="detail-key">${{issue.issue_id}}</div>`;
                const typeCell = document.createElement('td');
                typeCell.textContent = issue.issue_type;
                const correctionCell = document.createElement('td');
                correctionCell.textContent = issue.canonical_correction;
                tr.appendChild(idCell);
                tr.appendChild(typeCell);
                tr.appendChild(correctionCell);
                illegalBody.appendChild(tr);
              }});
            }}

            function renderMachineParity() {{
              machineParityBody.innerHTML = '';
              filteredMachines().forEach((machine) => {{
                const tr = document.createElement('tr');
                [machine.canonical_name, machine.state_axis_type, machine.states.map((row) => row.value).join(', '), machine.initial_state, machine.terminal_states.join(', ')].forEach((value) => {{
                  const td = document.createElement('td');
                  td.textContent = value;
                  tr.appendChild(td);
                }});
                machineParityBody.appendChild(tr);
              }});
            }}

            function renderDetail(machine, transition, invariant) {{
              if (!machine) {{
                detailHead.textContent = 'No machine selected';
                detailSub.textContent = 'Adjust filters or select a machine.';
                detailBlocks.innerHTML = '';
                return;
              }}
              detailHead.textContent = machine.canonical_name;
              detailSub.textContent = machine.machine_id;
              const relatedInvariants = invariants.filter((item) => item.affected_machine_ids.includes(machine.machine_id));
              let html = '';
              const blocks = [
                ['Owning Object', [machine.owning_object_name, machine.owning_object_id].join(' · ')],
                ['Primary Source', `${{machine.source_file}} · ${{machine.source_heading_or_block}}`],
                ['Terminal States', machine.terminal_states.join(', ') || 'None'],
                ['Notes', machine.notes],
              ];
              blocks.forEach(([title, value]) => {{
                html += `<div class="detail-block"><h3>${{title}}</h3><p>${{value}}</p></div>`;
              }});
              if (transition) {{
                html += `<div class="detail-block"><h3>Selected Transition</h3><p><strong>${{transition.from_state}} → ${{transition.to_state}}</strong><br>${{transition.trigger}}</p><ul>${{transition.guards.map((item) => `<li>${{item}}</li>`).join('')}}${{transition.authoritative_proofs.map((item) => `<li>${{item}}</li>`).join('')}}</ul></div>`;
              }}
              if (relatedInvariants.length) {{
                html += `<div class="detail-block"><h3>Related Invariants</h3><ul>${{relatedInvariants.slice(0, 8).map((item) => `<li><span class="detail-key">${{item.invariant_id}}</span> — ${{item.canonical_wording}}</li>`).join('')}}</ul></div>`;
              }}
              if (invariant) {{
                html += `<div class="detail-block"><h3>Selected Invariant</h3><p><span class="detail-key">${{invariant.invariant_id}}</span><br>${{invariant.canonical_wording}}</p></div>`;
              }}
              detailBlocks.innerHTML = html;
            }}

            function renderView() {{
              const machine = currentMachine();
              const invariant = currentInvariant();
              if (state.view === 'machine') {{
                renderMachineDiagram(machine);
                renderTransitionTable(machine);
                renderIllegalTable(machine);
                renderDetail(machine, machine?.legal_transitions.find((row) => row.transition_id === state.selectedTransitionId) || null, invariant);
              }} else {{
                renderMachineDiagram(machine);
                renderTransitionTable(machine);
                renderIllegalTable(machine);
                renderDetail(machine, machine?.legal_transitions.find((row) => row.transition_id === state.selectedTransitionId) || null, invariant);
              }}
              renderInvariantLattice();
            }}

            function render() {{
              renderNav();
              renderHero();
              renderMachineParity();
              renderView();
              document.getElementById('tab-machine').classList.toggle('active-chip', state.view === 'machine');
              document.getElementById('tab-invariant').classList.toggle('active-chip', state.view === 'invariant');
              document.getElementById('tab-machine').setAttribute('aria-selected', String(state.view === 'machine'));
              document.getElementById('tab-invariant').setAttribute('aria-selected', String(state.view === 'invariant'));
            }}

            document.getElementById('filter-search').addEventListener('input', (event) => {{
              state.search = event.target.value;
              render();
            }});
            document.getElementById('filter-phase').addEventListener('change', (event) => {{
              state.phase = event.target.value;
              render();
            }});
            document.getElementById('filter-context').addEventListener('change', (event) => {{
              state.context = event.target.value;
              render();
            }});
            document.getElementById('filter-axis').addEventListener('change', (event) => {{
              state.axis = event.target.value;
              render();
            }});
            document.getElementById('filter-coordinator').addEventListener('change', (event) => {{
              state.coordinator = event.target.value;
              render();
            }});
            document.getElementById('tab-machine').addEventListener('click', () => {{
              state.view = 'machine';
              render();
              announce('Machine view loaded');
            }});
            document.getElementById('tab-invariant').addEventListener('click', () => {{
              state.view = 'invariant';
              render();
              announce('Invariant view loaded');
            }});

            function applyHash() {{
              const hash = location.hash.replace('#', '');
              if (!hash) return;
              if (machines.some((machine) => machine.machine_id === hash)) {{
                state.selectedMachineId = hash;
                state.view = 'machine';
              }}
              if (invariants.some((item) => item.invariant_id === hash)) {{
                state.selectedInvariantId = hash;
                state.view = 'invariant';
              }}
            }}

            window.addEventListener('hashchange', () => {{
              applyHash();
              render();
            }});

            applyHash();
            render();
          </script>
        </body>
        </html>
        """
    )


def build_bundle() -> dict[str, Any]:
    upstream = ensure_prerequisites()
    lookup = object_lookup()
    specs = build_machine_specs()
    machines = [serialize_machine(machine, lookup) for machine in specs]
    invariants = serialize_invariants(build_invariants())
    illegal_payload = build_illegal_payload(machines)
    transition_rows = build_transition_rows(machines)
    guard_rows = build_guard_rows(transition_rows)
    machine_payload = build_machine_payload(machines, upstream, illegal_payload, invariants)
    invariant_payload = build_invariant_payload(invariants)
    return {
        "machine_payload": machine_payload,
        "transition_rows": transition_rows,
        "guard_rows": guard_rows,
        "illegal_payload": illegal_payload,
        "invariant_payload": invariant_payload,
        "mermaid": build_mermaid(machines, invariants),
        "atlas_html": build_html(machine_payload, invariant_payload, illegal_payload, transition_rows),
    }


def write_bundle(bundle: dict[str, Any]) -> None:
    write_json(STATE_MACHINES_JSON_PATH, bundle["machine_payload"])
    write_json(INVARIANTS_JSON_PATH, bundle["invariant_payload"])
    write_json(ILLEGAL_TRANSITIONS_JSON_PATH, bundle["illegal_payload"])
    write_csv(
        TRANSITION_TABLE_CSV_PATH,
        [
            "transition_id",
            "machine_id",
            "canonical_name",
            "machine_family",
            "phase_tags",
            "state_axis_type",
            "from_state",
            "to_state",
            "trigger",
            "coordinator_owned",
            "guards",
            "authoritative_proofs",
            "related_objects",
            "degraded_posture",
            "closure_blocker_interactions",
            "source_refs",
            "notes",
        ],
        bundle["transition_rows"],
    )
    write_csv(
        GUARD_MATRIX_CSV_PATH,
        [
            "transition_id",
            "machine_id",
            "canonical_name",
            "from_state",
            "to_state",
            "trigger",
            "guards",
            "authoritative_proofs",
            "degraded_posture_if_missing",
            "closure_blocker_interactions",
            "related_objects",
            "source_refs",
        ],
        bundle["guard_rows"],
    )
    write_text(RELATIONSHIPS_MMD_PATH, bundle["mermaid"])
    write_text(ATLAS_DOC_PATH, render_state_machine_doc(bundle["machine_payload"]))
    write_text(INVARIANTS_DOC_PATH, render_invariants_doc(bundle["invariant_payload"]))
    write_text(TRANSITIONS_DOC_PATH, render_transitions_doc(bundle["transition_rows"]))
    write_text(GUARDS_DOC_PATH, render_guards_doc(bundle["guard_rows"]))
    write_text(ILLEGAL_DOC_PATH, render_illegal_doc(bundle["illegal_payload"]))
    write_text(ATLAS_HTML_PATH, bundle["atlas_html"])


def main() -> None:
    bundle = build_bundle()
    write_bundle(bundle)
    print(
        json.dumps(
            {
                "status": "ok",
                "atlas_id": bundle["machine_payload"]["atlas_id"],
                "machine_count": bundle["machine_payload"]["summary"]["machine_count"],
                "transition_count": bundle["machine_payload"]["summary"]["transition_count"],
                "invariant_count": bundle["machine_payload"]["summary"]["invariant_count"],
                "conflict_count": bundle["machine_payload"]["summary"]["conflict_count"],
            },
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
