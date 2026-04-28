#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
from collections import defaultdict
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = ROOT / "data" / "analysis"
DOCS_DIR = ROOT / "docs" / "architecture"

PERSONA_JSON_PATH = DATA_DIR / "persona_catalog.json"
CHANNEL_JSON_PATH = DATA_DIR / "channel_inventory.json"
SURFACE_CSV_PATH = DATA_DIR / "audience_surface_inventory.csv"
ROUTE_FAMILY_CSV_PATH = DATA_DIR / "route_family_inventory.csv"
SHELL_MAP_JSON_PATH = DATA_DIR / "shell_ownership_map.json"

PERSONA_DOC_PATH = DOCS_DIR / "04_persona_catalog.md"
CHANNEL_DOC_PATH = DOCS_DIR / "04_channel_inventory.md"
AUDIENCE_TIER_DOC_PATH = DOCS_DIR / "04_audience_tier_model.md"
SURFACE_DOC_PATH = DOCS_DIR / "04_audience_surface_inventory.md"
OWNERSHIP_DOC_PATH = DOCS_DIR / "04_shell_and_route_family_ownership.md"
CONFLICT_DOC_PATH = DOCS_DIR / "04_surface_conflict_and_gap_report.md"
MERMAID_DOC_PATH = DOCS_DIR / "04_shell_ownership_map.mmd"

REQUIREMENT_REGISTRY_PATH = DATA_DIR / "requirement_registry.jsonl"
SUMMARY_CONFLICT_PATH = DATA_DIR / "summary_conflicts.json"
SCOPE_MATRIX_PATH = DATA_DIR / "product_scope_matrix.json"

SCOPE_POSTURES = ["baseline", "deferred", "conditional", "bounded_secondary"]
CHANNEL_PROFILES = ["browser", "embedded", "constrained_browser"]
SHELL_TYPES = [
    "patient",
    "staff",
    "hub",
    "pharmacy",
    "support",
    "operations",
    "governance",
    "assistive",
]


def join_list(values: list[str]) -> str:
    return "; ".join(values)


def md_join(values: list[str]) -> str:
    return "<br>".join(escape_md(value) for value in values)


def escape_md(value: str) -> str:
    return value.replace("|", "\\|")


def write_json(path: Path, payload: dict[str, Any]) -> None:
    path.write_text(json.dumps(payload, indent=2) + "\n")


def write_csv(path: Path, rows: list[dict[str, Any]], fieldnames: list[str]) -> None:
    with path.open("w", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        for row in rows:
            writer.writerow({key: row.get(key, "") for key in fieldnames})


def load_json(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text())


def load_jsonl_count(path: Path) -> int:
    return sum(1 for line in path.read_text().splitlines() if line.strip())


def persona(
    persona_id: str,
    persona_name: str,
    sub_persona: str,
    audience_tier: str,
    base_audience_tier: str,
    purpose_of_use: str,
    primary_shell_types: list[str],
    primary_channel_ids: list[str],
    identity_posture: str,
    visibility_policy_posture: str,
    primary_jobs_to_be_done: list[str],
    allowed_mutations: list[str],
    continuity_expectations: list[str],
    degraded_recovery_states: list[str],
    external_dependency_touchpoints: list[str],
    scope_posture: str,
    governing_objects: list[str],
    owning_blueprints: list[str],
    source_refs: list[str],
    notes: str = "",
) -> dict[str, Any]:
    return {
        "persona_id": persona_id,
        "persona": persona_name,
        "sub_persona": sub_persona,
        "audience_tier": audience_tier,
        "base_audience_tier": base_audience_tier,
        "purpose_of_use": purpose_of_use,
        "primary_shell_types": primary_shell_types,
        "primary_channel_ids": primary_channel_ids,
        "identity_posture": identity_posture,
        "visibility_policy_posture": visibility_policy_posture,
        "primary_jobs_to_be_done": primary_jobs_to_be_done,
        "allowed_mutations": allowed_mutations,
        "continuity_expectations": continuity_expectations,
        "degraded_recovery_states": degraded_recovery_states,
        "external_dependency_touchpoints": external_dependency_touchpoints,
        "scope_posture": scope_posture,
        "governing_objects": governing_objects,
        "owning_blueprints": owning_blueprints,
        "source_refs": source_refs,
        "notes": notes,
    }


def channel(
    channel_id: str,
    channel_name: str,
    channel_class: str,
    mapped_channel_profiles: list[str],
    ingress_modes: list[str],
    shell_applicability: list[str],
    identity_constraints: list[str],
    visibility_constraints: list[str],
    continuity_implications: list[str],
    external_dependency_touchpoints: list[str],
    scope_posture: str,
    source_refs: list[str],
    notes: str = "",
) -> dict[str, Any]:
    return {
        "channel_id": channel_id,
        "channel_name": channel_name,
        "channel_class": channel_class,
        "mapped_channel_profiles": mapped_channel_profiles,
        "ingress_modes": ingress_modes,
        "shell_applicability": shell_applicability,
        "identity_constraints": identity_constraints,
        "visibility_constraints": visibility_constraints,
        "continuity_implications": continuity_implications,
        "external_dependency_touchpoints": external_dependency_touchpoints,
        "scope_posture": scope_posture,
        "source_refs": source_refs,
        "notes": notes,
    }


def route_family(
    route_family_id: str,
    route_family_name: str,
    shell_type: str,
    ownership_mode: str,
    primary_surface_name: str,
    owning_blueprints: list[str],
    governing_objects: list[str],
    control_plane_rules: list[str],
    identity_posture: str,
    visibility_policy_posture: str,
    allowed_mutations: list[str],
    continuity_expectations: list[str],
    degraded_recovery_states: list[str],
    external_dependency_touchpoints: list[str],
    scope_posture: str,
    source_refs: list[str],
    notes: str = "",
    explicit_route_contract: bool = True,
) -> dict[str, Any]:
    return {
        "route_family_id": route_family_id,
        "route_family": route_family_name,
        "shell_type": shell_type,
        "ownership_mode": ownership_mode,
        "primary_surface_name": primary_surface_name,
        "owning_blueprints": owning_blueprints,
        "governing_objects": governing_objects,
        "control_plane_rules": control_plane_rules,
        "identity_posture": identity_posture,
        "visibility_policy_posture": visibility_policy_posture,
        "allowed_mutations": allowed_mutations,
        "continuity_expectations": continuity_expectations,
        "degraded_recovery_states": degraded_recovery_states,
        "external_dependency_touchpoints": external_dependency_touchpoints,
        "scope_posture": scope_posture,
        "source_refs": source_refs,
        "notes": notes,
        "explicit_route_contract": explicit_route_contract,
    }


def surface(
    surface_id: str,
    persona_id: str,
    route_family_id: str,
    shell_type: str,
    channel_profile: str,
    ingress_channel_id: str,
    surface_name: str,
    primary_jobs_to_be_done: list[str],
    allowed_mutations: list[str],
    continuity_expectations: list[str],
    degraded_recovery_states: list[str],
    external_dependency_touchpoints: list[str],
    identity_posture: str,
    visibility_policy_posture: str,
    governing_objects: list[str],
    control_plane_rules: list[str],
    owning_blueprints: list[str],
    scope_posture: str,
    source_refs: list[str],
    shell_ownership_mode: str = "primary_owner",
    notes: str = "",
) -> dict[str, Any]:
    return {
        "surface_id": surface_id,
        "persona_id": persona_id,
        "route_family_id": route_family_id,
        "shell_type": shell_type,
        "channel_profile": channel_profile,
        "ingress_channel_id": ingress_channel_id,
        "surface_name": surface_name,
        "primary_jobs_to_be_done": primary_jobs_to_be_done,
        "allowed_mutations": allowed_mutations,
        "continuity_expectations": continuity_expectations,
        "degraded_recovery_states": degraded_recovery_states,
        "external_dependency_touchpoints": external_dependency_touchpoints,
        "identity_posture": identity_posture,
        "visibility_policy_posture": visibility_policy_posture,
        "governing_objects": governing_objects,
        "control_plane_rules": control_plane_rules,
        "owning_blueprints": owning_blueprints,
        "scope_posture": scope_posture,
        "source_refs": source_refs,
        "shell_ownership_mode": shell_ownership_mode,
        "notes": notes,
    }


def conflict(
    conflict_id: str,
    classification: str,
    subject: str,
    resolution: str,
    impact: str,
    source_refs: list[str],
    status: str = "resolved",
) -> dict[str, Any]:
    return {
        "conflict_id": conflict_id,
        "classification": classification,
        "subject": subject,
        "resolution": resolution,
        "impact": impact,
        "source_refs": source_refs,
        "status": status,
    }


AXIS_DEFINITIONS = [
    {
        "axis": "persona",
        "definition": "The human actor or bounded operator mode whose job to be done drives the surface.",
        "why_it_matters": "Prevents patient, clinician, support, hub, pharmacy, operations, governance, and assistive users from collapsing into one generic actor.",
        "canonical_source": "blueprint-init.md#2. Core product surfaces",
    },
    {
        "axis": "audience_tier",
        "definition": "The published visibility and mutation ceiling resolved through AudienceVisibilityCoverage and MinimumNecessaryContract.",
        "why_it_matters": "Separates who the actor is from what data and actions the current surface is lawfully allowed to expose.",
        "canonical_source": "phase-0-the-foundation-protocol.md#12.1 Mandatory audience tiers",
    },
    {
        "axis": "shell_type",
        "definition": "The owning persistent shell family that preserves continuity for the active entity and route family.",
        "why_it_matters": "Stops route prefixes, local layouts, or feature labels from impersonating a different shell family.",
        "canonical_source": "phase-0-the-foundation-protocol.md#1.1 PersistentShell",
    },
    {
        "axis": "channel_profile",
        "definition": "The posture adaptation of the owning shell: browser, embedded, or constrained_browser.",
        "why_it_matters": "Lets embedded or constrained delivery narrow chrome and capability without redefining shell ownership.",
        "canonical_source": "phase-0-the-foundation-protocol.md#1.1 PersistentShell",
    },
    {
        "axis": "ingress_channel",
        "definition": "The channel by which the actor enters or resumes the lineage: web, embedded, telephony, secure-link, or support-assisted capture.",
        "why_it_matters": "Preserves telephony parity and same-lineage continuation without creating a second back-office workflow.",
        "canonical_source": "blueprint-init.md#2. Core product surfaces",
    },
    {
        "axis": "route_family",
        "definition": "The routed surface family that claims shell residency and owns the dominant action and continuity rules.",
        "why_it_matters": "Makes route ownership explicit so /workspace, /ops, /hub, and patient portal sections cannot belong to two shells at once.",
        "canonical_source": "platform-frontend-blueprint.md#Shell and route-family ownership rules",
    },
]

BASE_AUDIENCE_TIERS = [
    {
        "tier": "patient_public",
        "definition": "Public-safe patient status, secure-link entry before proof, and governed recovery only.",
        "source_ref": "phase-0-the-foundation-protocol.md#12.1 Mandatory audience tiers",
    },
    {
        "tier": "patient_authenticated",
        "definition": "Signed-in patient routes with richer request, booking, message, record, pharmacy, and document visibility after live checks pass.",
        "source_ref": "phase-0-the-foundation-protocol.md#12.1 Mandatory audience tiers",
    },
    {
        "tier": "origin_practice",
        "definition": "Practice-owned operational and clinically necessary detail for the current organisation only.",
        "source_ref": "phase-0-the-foundation-protocol.md#12.1 Mandatory audience tiers",
    },
    {
        "tier": "hub_desk",
        "definition": "Coordination-safe cross-site visibility for ranked offers, travel constraints, and practice-ack debt, without full clinical narrative.",
        "source_ref": "phase-0-the-foundation-protocol.md#12.1 Mandatory audience tiers",
    },
    {
        "tier": "servicing_site",
        "definition": "Service-delivery detail required to fulfil the booked or referred service for the site in scope.",
        "source_ref": "phase-0-the-foundation-protocol.md#12.1 Mandatory audience tiers",
    },
    {
        "tier": "support",
        "definition": "Masked summary, chronology, and consequence-preview detail, with stronger gates for identity or access-affecting work.",
        "source_ref": "phase-0-the-foundation-protocol.md#12.1 Mandatory audience tiers",
    },
]

DERIVED_AUDIENCE_TIERS = [
    {
        "tier": "patient_grant_scoped",
        "coverage_basis": "patient_public + PatientAudienceCoverageProjection(purposeOfUse = secure_link_recovery)",
        "reason": "The corpus distinguishes grant-scoped recovery posture without minting a separate Phase 0 base tier.",
    },
    {
        "tier": "patient_embedded_authenticated",
        "coverage_basis": "patient_authenticated + PatientAudienceCoverageProjection(purposeOfUse = embedded_authenticated)",
        "reason": "Embedded patient use is a channel-constrained authenticated posture, not a second shell family.",
    },
    {
        "tier": "origin_practice_clinical",
        "coverage_basis": "origin_practice + StaffAudienceCoverageProjection(purposeOfUse = operational_execution)",
        "reason": "Separates clinician/designated reviewer work from generic practice ops while preserving the same base visibility tier.",
    },
    {
        "tier": "origin_practice_operations",
        "coverage_basis": "origin_practice + StaffAudienceCoverageProjection(purposeOfUse = operational_execution)",
        "reason": "Keeps practice-operational actors distinct from clinical reviewers inside the shared workspace shell.",
    },
    {
        "tier": "operations_control",
        "coverage_basis": "purpose-of-use-specific control-plane rows for operations surfaces",
        "reason": "Operations is a control-room specialization that must not borrow ordinary practice, hub, or support payloads.",
    },
    {
        "tier": "governance_review",
        "coverage_basis": "StaffAudienceCoverageProjection(purposeOfUse = governance_review) plus GovernanceScopeToken",
        "reason": "Governance/admin/config/comms/access work is a distinct control surface, not an operations subpanel.",
    },
    {
        "tier": "assistive_adjunct",
        "coverage_basis": "AssistiveSurfaceBinding bound to the owning shell and current audience coverage",
        "reason": "Assistive use is an adjunct posture inside the owning task unless the corpus explicitly calls for standalone evaluation or replay tooling.",
    },
]

ASSUMPTIONS = [
    {
        "assumption_id": "ASSUMPTION_AUDIENCE_004_001",
        "statement": "Grant-scoped patient recovery is modeled as a derived audience tier over Phase 0 patient_public coverage because the corpus distinguishes secure-link recovery by purpose of use rather than by adding a third mandatory patient base tier.",
    },
    {
        "assumption_id": "ASSUMPTION_CHANNEL_004_002",
        "statement": "Telephony/IVR and secure-link continuation are mapped to constrained_browser shell posture where a current shell is preserved, because Phase 0 canonicalizes browser, embedded, and constrained_browser as the only shell channel profiles.",
    },
    {
        "assumption_id": "ASSUMPTION_ROUTE_004_003",
        "statement": "Pre-submit intake and standalone assistive-control route families are inventory labels derived from the corpus until later tasks publish concrete URL contracts.",
    },
]

RISKS = [
    {
        "risk_id": "RISK_ROUTE_004_001",
        "statement": "Seq_005 must harden explicit intake and secure-link route contracts so later API and projection work does not drift between derived labels and implementation endpoints.",
    },
    {
        "risk_id": "RISK_CONTROL_004_002",
        "statement": "Operations, governance, assurance, and break-glass audience rows are clearly required by Phase 0 but are not yet centralized in one dedicated machine-readable coverage registry.",
    },
    {
        "risk_id": "RISK_ASSISTIVE_004_003",
        "statement": "Standalone assistive evaluation, replay, monitoring, and release-control tooling is named by function in the corpus, so any later concrete routes must preserve the bounded-secondary rule encoded here.",
    },
]

PERSONAS = [
    persona(
        "patient_anonymous_intake",
        "Patient",
        "Anonymous intake starter",
        "patient_public",
        "patient_public",
        "public_status",
        ["patient"],
        ["browser_web"],
        "Anonymous or partially identified patient before claim or sign-in uplift.",
        "Public-safe summary, placeholder, and governed recovery only until richer proof exists.",
        [
            "Describe the issue and submit it into the governed intake pipeline.",
            "Upload optional evidence and contact preferences without leaving the intake lineage.",
        ],
        [
            "Create or update SubmissionEnvelope content.",
            "Submit the intake for governed promotion.",
        ],
        [
            "Stay on one intake lineage even if the channel later changes to secure link, telephony, or support-assisted capture.",
        ],
        [
            "Fallback review, artifact quarantine, safe receipt, or later claim recovery inside the same lineage.",
        ],
        [
            "Optional NHS login uplift",
            "Binary artifact store",
        ],
        "baseline",
        [
            "SubmissionEnvelope",
            "IntakeConvergenceContract",
            "SubmissionIngressRecord",
            "SubmissionPromotionRecord",
        ],
        [
            "blueprint-init.md",
            "phase-0-the-foundation-protocol.md",
        ],
        [
            "blueprint-init.md#2. Core product surfaces",
            "phase-0-the-foundation-protocol.md#12.1 Mandatory audience tiers",
        ],
        "This persona covers public self-service form entry, not post-submit patient portal actions.",
    ),
    persona(
        "patient_authenticated_portal",
        "Patient",
        "Authenticated portal user",
        "patient_authenticated",
        "patient_authenticated",
        "authenticated_self_service",
        ["patient"],
        ["browser_web"],
        "Authenticated self-service session with live binding, release, and visibility checks.",
        "Signed-in patient detail, threads, records, documents, and manage actions under VisibilityProjectionPolicy.",
        [
            "Track requests, appointments, communications, and records inside one signed-in shell.",
            "Perform route-bound post-submit actions only when current capability and settlement truth allows it.",
        ],
        [
            "Reply to messages or more-info prompts.",
            "Manage appointments and route-bound follow-up actions.",
            "Open governed artifacts and documents.",
        ],
        [
            "Keep the same patient shell across Home, Requests, Appointments, Health record, and Messages.",
        ],
        [
            "Read-only, placeholder, bounded recovery, or safe-browser handoff without losing the current shell anchor.",
        ],
        [
            "NHS login",
            "Notification delivery rails",
            "Booking and messaging adapters",
        ],
        "baseline",
        [
            "PatientPortalEntryProjection",
            "PatientShellConsistencyProjection",
            "RouteIntentBinding",
            "CommandActionRecord",
            "CommandSettlementRecord",
        ],
        [
            "patient-account-and-communications-blueprint.md",
            "patient-portal-experience-architecture-blueprint.md",
        ],
        [
            "patient-account-and-communications-blueprint.md#Patient audience coverage contract",
            "patient-portal-experience-architecture-blueprint.md#Portal entry and shell topology",
        ],
    ),
    persona(
        "patient_grant_scoped_recovery",
        "Patient",
        "Grant-scoped patient resuming a specific lineage",
        "patient_grant_scoped",
        "patient_public",
        "secure_link_recovery",
        ["patient"],
        ["sms_secure_link_continuation", "constrained_browser"],
        "Minimal access grant or verified continuation before full authenticated uplift.",
        "Summary-only or suppressed-recovery-only visibility until grant redemption and route checks pass.",
        [
            "Resume one specific request, message, callback, or booking/manage path without broadening the shell to a full authenticated portal.",
            "Step up into richer self-service only when current grant, route, and publication truth still match.",
        ],
        [
            "Redeem a grant-scoped secure link.",
            "Trigger claim, re-auth, contact repair, or bounded route resumption.",
        ],
        [
            "Preserve the same request or child-route anchor across secure-link redemption, step-up, and recovery.",
        ],
        [
            "Expired link recovery, placeholder-only posture, safe-browser handoff, or identity hold.",
        ],
        [
            "SMS secure links",
            "NHS login for step-up",
        ],
        "baseline",
        [
            "AccessGrantRedemptionRecord",
            "PatientSecureLinkSessionProjection",
            "PatientActionRecoveryProjection",
            "PatientDegradedModeProjection",
        ],
        [
            "patient-account-and-communications-blueprint.md",
            "phase-0-the-foundation-protocol.md",
        ],
        [
            "patient-account-and-communications-blueprint.md#Patient audience coverage contract",
            "phase-0-the-foundation-protocol.md#5.4 Claim, secure-link, and embedded access algorithm",
        ],
        "This is deliberately separated from the authenticated portal persona because the corpus gives secure-link recovery its own purpose-of-use law.",
    ),
    persona(
        "phone_ivr_caller",
        "Patient",
        "Phone or IVR caller",
        "patient_public",
        "patient_public",
        "public_status",
        ["patient"],
        ["telephony_ivr"],
        "Phone-origin demand with governed patient identification or partial identity capture.",
        "The same public-safe intake and downstream status model as digital entry, without a parallel back-office workflow.",
        [
            "Start or continue intake through telephony/IVR with parity to digital intake.",
            "Receive optional SMS continuation without changing the underlying request lineage.",
        ],
        [
            "Append SubmissionIngressRecord rows through telephony capture.",
            "Trigger secure-link continuation when needed.",
        ],
        [
            "Preserve one SubmissionEnvelope and later same-shell continuity across phone, SMS continuation, and digital recovery.",
        ],
        [
            "Telephony outage, delivery dispute, or governed fallback review without spawning a separate support-only workflow.",
        ],
        [
            "Telephony/IVR adapter",
            "Optional SMS secure links",
        ],
        "baseline",
        [
            "SubmissionEnvelope",
            "SubmissionIngressRecord",
            "IntakeConvergenceContract",
            "SubmissionPromotionRecord",
        ],
        [
            "blueprint-init.md",
            "phase-0-the-foundation-protocol.md",
        ],
        [
            "blueprint-init.md#2. Core product surfaces",
            "phase-0-the-foundation-protocol.md#0.2 Continuity key and shell law",
        ],
    ),
    persona(
        "patient_embedded_nhs_app",
        "Patient",
        "Embedded NHS App patient user",
        "patient_embedded_authenticated",
        "patient_authenticated",
        "embedded_authenticated",
        ["patient"],
        ["embedded_webview"],
        "Authenticated patient session running under embedded manifest, release, and bridge-capability checks.",
        "The same patient shell under tighter bridge and publication controls, not a second app.",
        [
            "Use the patient portal through a trusted embedded channel without losing same-shell continuity.",
            "Perform embedded-safe versions of ordinary patient actions when release and bridge posture permit.",
        ],
        [
            "The same route-bound patient mutations as the browser portal, but only after embedded validation passes.",
        ],
        [
            "Preserve the same patient shell while channel profile, chrome, and delivery options narrow.",
        ],
        [
            "Read-only, placeholder, safe-browser handoff, or channel-freeze recovery without shell replacement.",
        ],
        [
            "NHS App embedded webview",
            "ReleaseApprovalFreeze",
            "ChannelReleaseFreezeRecord",
        ],
        "deferred",
        [
            "PatientEmbeddedSessionProjection",
            "PatientEmbeddedNavEligibility",
            "ChannelReleaseFreezeRecord",
            "ReleaseApprovalFreeze",
        ],
        [
            "patient-account-and-communications-blueprint.md",
            "phase-7-inside-the-nhs-app.md",
        ],
        [
            "patient-account-and-communications-blueprint.md#Patient audience coverage contract",
            "patient-portal-experience-architecture-blueprint.md#Control priorities",
        ],
        "Deferred baseline expansion only; this inventory tracks it without reclassifying it as current scope.",
    ),
    persona(
        "clinician_designated_reviewer",
        "Staff",
        "Clinician or designated reviewer in Clinical Workspace",
        "origin_practice_clinical",
        "origin_practice",
        "operational_execution",
        ["staff"],
        ["browser_web"],
        "Authenticated staff actor operating with current acting scope, review lease, and queue/task continuity.",
        "Practice-owned clinical detail and decision context only for the current organisation and scope.",
        [
            "Scan the queue, open the right task, and reach a safe decision quickly.",
            "Use bounded assistive and evidence surfaces without losing task continuity.",
        ],
        [
            "Claim and review tasks.",
            "Request more information, commit decisions, or route downstream work under lease and settlement control.",
        ],
        [
            "Same request lineage, same shell; queue switches and child review states preserve the active task anchor.",
        ],
        [
            "Observe-only, reassigned, stale-recoverable, or recovery-required posture that preserves the last safe task summary.",
        ],
        [
            "CIS2 or staff auth rail",
            "NHS login downstream only through patient-facing child work",
        ],
        "baseline",
        [
            "WorkspaceTrustEnvelope",
            "ReviewActionLease",
            "WorkspaceFocusProtectionLease",
            "DecisionCommitEnvelope",
        ],
        [
            "staff-workspace-interface-architecture.md",
            "staff-operations-and-support-blueprint.md",
        ],
        [
            "staff-workspace-interface-architecture.md#Route family",
            "staff-operations-and-support-blueprint.md#Staff audience coverage contract",
        ],
    ),
    persona(
        "practice_operational_staff",
        "Staff",
        "Practice operational staff",
        "origin_practice_operations",
        "origin_practice",
        "operational_execution",
        ["staff"],
        ["browser_web"],
        "Authenticated staff actor with practice-scoped operational visibility and bounded mutation authority.",
        "Practice-owned operational detail without hub, support, or cross-organisation payload broadening after assembly.",
        [
            "Work queue items, admin resolution, and operational follow-up in the same workspace shell.",
            "Escalate, hand off, or resume tasks without leaving the queue/task continuity frame.",
        ],
        [
            "Claim tasks, send more-info, complete admin-resolution work, and move items to downstream flows when allowed.",
        ],
        [
            "Keep queue filters, selected anchors, and last safe posture while switching between operational tasks.",
        ],
        [
            "Observe-only, blocked, or recovery-required task posture when scope, trust, or publication drifts.",
        ],
        [
            "Staff auth rail",
            "Operational messaging and booking adapters",
        ],
        "baseline",
        [
            "StaffAudienceCoverageProjection",
            "WorkspaceNavigationLedger",
            "ReviewActionLease",
            "CommandSettlementRecord",
        ],
        [
            "staff-workspace-interface-architecture.md",
            "staff-operations-and-support-blueprint.md",
        ],
        [
            "staff-workspace-interface-architecture.md#Route family",
            "staff-operations-and-support-blueprint.md#Staff audience coverage contract",
        ],
    ),
    persona(
        "hub_coordinator",
        "Staff",
        "Hub coordinator",
        "hub_desk",
        "hub_desk",
        "coordination",
        ["hub"],
        ["browser_web"],
        "Cross-organisation hub desk actor operating under acting context, ownership lease, and coordination policy evaluation.",
        "Coordination-safe summary, ranked offers, practice-ack debt, and callback or return posture without full narrative by default.",
        [
            "Coordinate cross-site booking or callback fallback from one hub shell.",
            "Keep origin-practice continuity visible while alternatives, callback, or return-to-practice work progresses.",
        ],
        [
            "Claim hub cases, refresh candidates, offer alternatives, commit native booking, or return to practice.",
        ],
        [
            "Preserve the selected case anchor and same hub shell across queue, case detail, alternatives, exceptions, and audit child work.",
        ],
        [
            "Confirmation-pending, practice-ack debt, callback-transfer pending, stale-owner recovery, or identity-repair hold without detaching from the active case.",
        ],
        [
            "Cross-site booking adapters",
            "Policy packs",
            "Callback linkage",
            "Practice visibility delivery",
        ],
        "baseline",
        [
            "HubCoordinationCase",
            "AlternativeOfferSession",
            "HubOfferToConfirmationTruthProjection",
            "PracticeAcknowledgementRecord",
        ],
        [
            "phase-5-the-network-horizon.md",
            "phase-0-the-foundation-protocol.md",
        ],
        [
            "phase-5-the-network-horizon.md#Frontend work",
            "phase-0-the-foundation-protocol.md#12.1 Mandatory audience tiers",
        ],
    ),
    persona(
        "pharmacy_servicing_assurance_user",
        "Staff",
        "Pharmacy servicing or assurance user",
        "servicing_site",
        "servicing_site",
        "servicing_delivery",
        ["pharmacy"],
        ["browser_web"],
        "Servicing-site actor working a pharmacy case inside the dedicated pharmacy mission frame.",
        "Only the detail needed to deliver, validate, hand off, or assure the booked or referred service for that pharmacy case.",
        [
            "Validate, fulfil, hand off, and assure Pharmacy First work without falling back to generic workspace layout.",
            "Keep settlement and continuity truth attached to the same pharmacy case shell.",
        ],
        [
            "Validate, inventory-check, resolve, hand off, or assurance-review within the active pharmacy case.",
        ],
        [
            "Deep links, refresh, browser history, and reconcile recovery reopen the current pharmacy shell and selected anchor.",
        ],
        [
            "Read-only or recovery posture when runtime binding, settlement chain, or continuity evidence drifts.",
        ],
        [
            "Pharmacy dispatch and outcome adapters",
            "Medicine-level data sources",
        ],
        "baseline",
        [
            "PharmacyConsoleContinuityEvidenceProjection",
            "RouteIntentBinding",
            "CommandSettlementRecord",
            "ProjectionContractVersionSet",
        ],
        [
            "pharmacy-console-frontend-architecture.md",
            "phase-6-the-pharmacy-loop.md",
        ],
        [
            "pharmacy-console-frontend-architecture.md#Mission frame",
            "pharmacy-console-frontend-architecture.md#The recommended route family is",
        ],
    ),
    persona(
        "support_desk_agent",
        "Staff",
        "Support desk agent",
        "support",
        "support",
        "support_recovery",
        ["support"],
        ["browser_web", "support_assisted_capture"],
        "Masked-support actor with explicit disclosure ceilings, action leases, and replay or observe gates.",
        "Masked chronology and consequence preview by default, with stronger gates for identity correction, secure-link reissue, and replay.",
        [
            "Operate a ticket-centric repair workspace across resend, restore, identity, reachability, and handoff work.",
            "Assist capture into the same request lineage without turning support into a parallel workflow system.",
        ],
        [
            "Controlled resend, link reissue, attachment recovery, identity correction, and support-assisted capture under lease.",
        ],
        [
            "Stay on one support shell while moving between ticket, conversation, history, knowledge, action, observe, and replay child routes.",
        ],
        [
            "Read-only fallback, replay restore, pending-external hold, or stale reacquire while preserving the current ticket anchor and mask scope.",
        ],
        [
            "Notification delivery rails",
            "Telephony adapters",
            "Secure-link issuance",
        ],
        "baseline",
        [
            "SupportTicket",
            "SupportLineageBinding",
            "SupportActionLease",
            "SupportActionSettlement",
        ],
        [
            "staff-operations-and-support-blueprint.md",
            "phase-0-the-foundation-protocol.md",
        ],
        [
            "staff-operations-and-support-blueprint.md#Support route contract",
            "phase-0-the-foundation-protocol.md#6.5 Support and replay algorithm",
        ],
    ),
    persona(
        "operations_control_room_operator",
        "Staff",
        "Operations lead or control-room operator",
        "operations_control",
        "support",
        "operational_control",
        ["operations"],
        ["browser_web"],
        "Control-room actor working inside a board-scoped shell with selection leases, delta gates, and intervention fences.",
        "Cross-surface, PHI-adjacent operational visibility bound to purpose-of-use-specific coverage rows, not ordinary staff payloads.",
        [
            "Detect bottlenecks and decide where bounded intervention has the highest safe leverage.",
            "Drill into anomalies without losing board state, selection, or return context.",
        ],
        [
            "Issue operations interventions, freeze or compare board state, and hand off to governance when required.",
        ],
        [
            "Reuse the same operations shell while filters, selected anomaly, horizon, and drill path stay within the board continuity frame.",
        ],
        [
            "Read-only diagnostic, partial restore, stale selection freeze, or governance handoff posture without discarding the last stable board.",
        ],
        [
            "Queue health and dependency telemetry",
            "Release and governance handoff evidence",
        ],
        "baseline",
        [
            "OpsBoardStateSnapshot",
            "OpsSelectionLease",
            "OpsDeltaGate",
            "OpsActionEligibilityFence",
        ],
        [
            "operations-console-frontend-blueprint.md",
            "platform-frontend-blueprint.md",
        ],
        [
            "operations-console-frontend-blueprint.md#Canonical route family",
            "platform-frontend-blueprint.md#Operations Console specialization",
        ],
    ),
    persona(
        "governance_admin_lead",
        "Staff",
        "Governance, admin, config, comms, or access lead",
        "governance_review",
        "support",
        "governance_review",
        ["governance"],
        ["browser_web"],
        "Governance actor operating with scope token, baseline snapshot, freeze disposition, and approval package continuity.",
        "Purpose-of-use-specific governance visibility that must not be reconstructed from ordinary ops or staff shells.",
        [
            "Review, approve, promote, rollback, configure, and audit governance work inside a dedicated shell.",
            "Pivot to read-only evidence without losing the current governed object, draft, or watch context.",
        ],
        [
            "Approve, promote, rollback, manage access, update config, govern communications, and review records holds within the current review package.",
        ],
        [
            "Keep one governance continuity frame across diff, impact, simulation, approval, promotion watch, and evidence pivots.",
        ],
        [
            "Freeze disposition, read-only pivot, or blocked guardrail posture while preserving scope and review anchor.",
        ],
        [
            "Release watch tuples",
            "Governance evidence packs",
            "Access and config publications",
        ],
        "baseline",
        [
            "GovernanceContinuityFrame",
            "GovernanceScopeToken",
            "ChangeBaselineSnapshot",
            "GovernanceReviewPackage",
        ],
        [
            "governance-admin-console-frontend-blueprint.md",
            "platform-frontend-blueprint.md",
        ],
        [
            "governance-admin-console-frontend-blueprint.md#Shell and route topology",
            "governance-admin-console-frontend-blueprint.md#Primary governance personas",
        ],
    ),
    persona(
        "assistive_feature_consumer",
        "Staff",
        "Assistive feature consumer",
        "assistive_adjunct",
        "origin_practice",
        "assistive_companion",
        ["staff", "support", "operations"],
        ["browser_web"],
        "Bounded adjunct posture attached to the owning shell, active review context, and current publication tuple.",
        "Assistive output inherits the owning shell visibility ceiling and may not widen scope on its own.",
        [
            "Inspect, accept, reject, or ignore assistive suggestions without displacing primary human-led work.",
            "Use provenance, freshness, and rollout posture to decide whether the assistive output is usable.",
        ],
        [
            "Visible summary, bounded insert, observe-only review, or feedback capture under the active assistive grant.",
        ],
        [
            "Remain inside the owning task or ticket shell unless the corpus explicitly calls for standalone evaluation or replay tooling.",
        ],
        [
            "Shadow-only, quarantined, regenerate-required, or blocked posture when rollout, runtime, or trust drifts.",
        ],
        [
            "Assistive model registry",
            "Runtime publication bundle",
            "Evaluation and replay tooling",
        ],
        "bounded_secondary",
        [
            "AssistiveInvocationGrant",
            "AssistiveSurfaceBinding",
            "AssistiveCapabilityTrustEnvelope",
        ],
        [
            "phase-8-the-assistive-layer.md",
            "staff-workspace-interface-architecture.md",
        ],
        [
            "phase-8-the-assistive-layer.md#Control priorities",
            "staff-workspace-interface-architecture.md#Assistive companion presentation profile",
        ],
        "The corpus allows a standalone assistive shell only for evaluation, replay, monitoring, or release-control work; live care and support use stays bounded to the owning shell.",
    ),
]

CHANNELS = [
    channel(
        "browser_web",
        "Browser web",
        "interactive_primary",
        ["browser"],
        ["direct_sign_in", "nhs_app_jump_off", "browser_return"],
        ["patient", "staff", "hub", "pharmacy", "support", "operations", "governance"],
        [
            "Uses ordinary browser shell posture with route-level identity and publication checks.",
        ],
        [
            "Visibility and mutation still depend on audience coverage, release, and continuity evidence.",
        ],
        [
            "This is the baseline shell posture for most surfaces.",
        ],
        [
            "NHS login",
            "Staff auth rail",
        ],
        "baseline",
        [
            "phase-0-the-foundation-protocol.md#1.1 PersistentShell",
            "blueprint-init.md#2. Core product surfaces",
        ],
    ),
    channel(
        "embedded_webview",
        "Embedded webview / NHS App-style embedded channel",
        "interactive_embedded",
        ["embedded"],
        ["nhs_app_embedded"],
        ["patient"],
        [
            "Requires PatientEmbeddedSessionProjection, ReleaseApprovalFreeze, ChannelReleaseFreezeRecord, and bridge-capability checks.",
        ],
        [
            "Must preserve patient shell continuity while narrowing chrome and writable posture.",
        ],
        [
            "Channel posture changes without changing shell ownership.",
        ],
        [
            "Embedded host bridge",
            "Release and channel freezes",
        ],
        "deferred",
        [
            "phase-0-the-foundation-protocol.md#5.4 Claim, secure-link, and embedded access algorithm",
            "patient-portal-experience-architecture-blueprint.md#Control priorities",
        ],
        "Tracked in inventory, but kept out of the current baseline per task 003 scope.",
    ),
    channel(
        "constrained_browser",
        "Constrained browser posture",
        "interactive_constrained",
        ["constrained_browser"],
        ["browser_handoff", "limited_host"],
        ["patient", "staff"],
        [
            "Used when the shell retains continuity with reduced chrome, limited host affordances, or guarded browser handoff posture.",
        ],
        [
            "Artifacts, print, and export may need summary-only or recovery-only posture.",
        ],
        [
            "The shell stays the same shell; only the channel profile changes.",
        ],
        [
            "Host capability checks",
            "OutboundNavigationGrant for handoff",
        ],
        "baseline",
        [
            "phase-0-the-foundation-protocol.md#1.1 PersistentShell",
            "platform-frontend-blueprint.md#EmbeddedStripContract",
        ],
        "This is the canonical shell profile used for secure-link recovery and other limited-host continuity surfaces.",
    ),
    channel(
        "telephony_ivr",
        "Telephony / IVR",
        "interactive_ingress",
        ["constrained_browser"],
        ["telephony_ivr"],
        ["patient"],
        [
            "Phone-origin demand must converge into the same SubmissionEnvelope lineage rather than a separate back-office path.",
        ],
        [
            "Only public-safe capture, status, and recovery semantics apply until richer proof exists.",
        ],
        [
            "Telephony is an ingress channel, not a shell family.",
        ],
        [
            "Telephony or IVR adapter",
            "Optional SMS follow-up",
        ],
        "baseline",
        [
            "blueprint-init.md#2. Core product surfaces",
            "phase-0-the-foundation-protocol.md#0.2 Continuity key and shell law",
        ],
        "Mapped to constrained_browser shell posture only when the same patient shell must later preserve continuity on a limited host.",
    ),
    channel(
        "sms_secure_link_continuation",
        "SMS continuation / secure-link continuation",
        "interactive_continuation",
        ["constrained_browser"],
        ["secure_link", "verified_continuation"],
        ["patient"],
        [
            "Requires minimal grant or verified continuation before broader patient detail becomes available.",
        ],
        [
            "Summary-only, suppressed-recovery-only, or step-up-required visibility until the current route checks pass.",
        ],
        [
            "Preserves one specific lineage anchor rather than opening a generic portal shell from scratch.",
        ],
        [
            "SMS delivery",
            "AccessGrant issuance and redemption",
        ],
        "baseline",
        [
            "patient-account-and-communications-blueprint.md#Patient audience coverage contract",
            "phase-0-the-foundation-protocol.md#5.4 Claim, secure-link, and embedded access algorithm",
        ],
    ),
    channel(
        "support_assisted_capture",
        "Support-assisted capture",
        "interactive_assisted",
        ["browser"],
        ["support_assisted_capture"],
        ["support", "patient"],
        [
            "Support capture uses support-shell masked scope while appending to the same patient intake lineage.",
        ],
        [
            "Support cannot widen subject detail beyond the current disclosure ceiling while assisting capture.",
        ],
        [
            "This is still one governed intake lineage, not a separate support-only request system.",
        ],
        [
            "Support ticket workspace",
            "Secure-link issuance",
        ],
        "baseline",
        [
            "blueprint-init.md#2. Core product surfaces",
            "staff-operations-and-support-blueprint.md#Support route contract",
        ],
    ),
    channel(
        "outbound_notification_delivery",
        "External delivery channels for notifications and reminders",
        "delivery_only",
        [],
        ["sms", "email", "secure_message"],
        ["patient", "support", "hub"],
        [
            "Delivery receipts do not by themselves prove patient-visible success or closure.",
        ],
        [
            "Preview and status must remain bounded by AudienceVisibilityCoverage and delivery evidence.",
        ],
        [
            "Continuity-sensitive calmness must still come from authoritative settlement and evidence, not transport acceptance alone.",
        ],
        [
            "SMS providers",
            "Email or secure-message providers",
        ],
        "baseline",
        [
            "callback-and-clinician-messaging-loop.md",
            "phase-0-the-foundation-protocol.md#12.3 Patient-visible state contract",
        ],
    ),
    channel(
        "outbound_callback_delivery",
        "External delivery channels for callback and telephony outcomes",
        "delivery_only",
        [],
        ["callback_telephony", "provider_webhook"],
        ["patient", "support", "hub"],
        [
            "Telephony provider receipts and callback outcomes must reuse the canonical effect ledger.",
        ],
        [
            "No callback surface may infer final truth from transport acceptance or a local dial action alone.",
        ],
        [
            "Delivery evidence affects continuity and repair posture but does not redefine shell ownership.",
        ],
        [
            "Telephony provider",
            "Webhook receipts",
        ],
        "baseline",
        [
            "callback-and-clinician-messaging-loop.md",
            "phase-0-the-foundation-protocol.md#5.5 Unified care conversation algorithm",
        ],
    ),
]

ROUTE_FAMILIES = [
    route_family(
        "rf_intake_self_service",
        "Intake / self-service form (derived)",
        "patient",
        "shell_root",
        "Patient intake entry",
        [
            "blueprint-init.md",
            "phase-0-the-foundation-protocol.md",
        ],
        [
            "SubmissionEnvelope",
            "IntakeConvergenceContract",
            "SubmissionIngressRecord",
            "SubmissionPromotionRecord",
        ],
        [
            "AudienceVisibilityCoverage(patient_public)",
            "VisibilityProjectionPolicy",
            "FallbackReviewCase",
            "Artifact quarantine rules",
        ],
        "Anonymous or partially identified patient until claim or sign-in uplift occurs.",
        "Public-safe summary and governed recovery only before authenticated or grant-scoped expansion.",
        [
            "Capture and update SubmissionEnvelope content.",
            "Submit for governed promotion.",
        ],
        [
            "The same envelope lineage survives channel switches and later same-shell recovery.",
        ],
        [
            "Fallback review, artifact quarantine, or degraded receipt without shell replacement.",
        ],
        [
            "Binary artifact store",
            "Optional NHS login uplift",
        ],
        "baseline",
        [
            "blueprint-init.md#2. Core product surfaces",
            "phase-0-the-foundation-protocol.md#12.1 Mandatory audience tiers",
        ],
        "The corpus names the intake lineage and controls, but not a final URL contract, so this route family label is derived for inventory purposes.",
        explicit_route_contract=False,
    ),
    route_family(
        "rf_intake_telephony_capture",
        "Intake / telephony capture (derived)",
        "patient",
        "same_shell_peer",
        "Telephony / IVR intake capture",
        [
            "blueprint-init.md",
            "phase-0-the-foundation-protocol.md",
        ],
        [
            "SubmissionEnvelope",
            "SubmissionIngressRecord",
            "IntakeConvergenceContract",
            "SubmissionPromotionRecord",
        ],
        [
            "Telephony parity rule",
            "AudienceVisibilityCoverage(patient_public)",
            "VisibilityProjectionPolicy",
        ],
        "Patient identification or partial identity capture over phone or IVR.",
        "Public-safe capture and downstream status only until richer proof exists.",
        [
            "Append telephony ingress records.",
            "Trigger secure-link continuation when needed.",
        ],
        [
            "One intake lineage across phone, SMS continuation, and later digital recovery.",
        ],
        [
            "Telephony outage, retry, or governed fallback review without a separate support workflow.",
        ],
        [
            "Telephony adapter",
            "Optional SMS follow-up",
        ],
        "baseline",
        [
            "blueprint-init.md#2. Core product surfaces",
            "phase-0-the-foundation-protocol.md#0.2 Continuity key and shell law",
        ],
        "Derived label; the canonical rule is ingress parity, not a named route prefix.",
        explicit_route_contract=False,
    ),
    route_family(
        "rf_patient_secure_link_recovery",
        "Secure-link recovery and claim resume (derived)",
        "patient",
        "same_shell_child",
        "Secure-link recovery and claim resume",
        [
            "patient-account-and-communications-blueprint.md",
            "phase-0-the-foundation-protocol.md",
        ],
        [
            "AccessGrantRedemptionRecord",
            "PatientSecureLinkSessionProjection",
            "PatientActionRecoveryProjection",
            "PatientDegradedModeProjection",
            "RouteIntentBinding",
        ],
        [
            "AudienceVisibilityCoverage(patient_public / secure_link_recovery)",
            "VisibilityProjectionPolicy",
            "RouteFreezeDisposition",
            "ReleaseRecoveryDisposition",
        ],
        "Grant-scoped patient continuation before or alongside authenticated uplift.",
        "Summary-only or suppressed-recovery-only posture until route intent, grant, and publication checks pass.",
        [
            "Redeem minimal grant, claim, re-auth, and resume the specific lineage action.",
        ],
        [
            "Preserve the same request or child-route anchor through secure-link redemption and step-up.",
        ],
        [
            "Expired-link recovery, identity hold, or safe-browser handoff without losing the active anchor.",
        ],
        [
            "SMS secure-link delivery",
            "NHS login step-up",
        ],
        "baseline",
        [
            "patient-account-and-communications-blueprint.md#Patient audience coverage contract",
            "phase-0-the-foundation-protocol.md#5.4 Claim, secure-link, and embedded access algorithm",
        ],
        "Derived label used until later endpoint mapping publishes concrete URLs.",
        explicit_route_contract=False,
    ),
    route_family(
        "rf_patient_home",
        "Home",
        "patient",
        "shell_root",
        "Patient home and spotlight",
        [
            "patient-portal-experience-architecture-blueprint.md",
            "patient-account-and-communications-blueprint.md",
        ],
        [
            "PatientPortalEntryProjection",
            "PatientHomeProjection",
            "PatientSpotlightDecisionProjection",
            "PatientPortalNavigationLedger",
            "PatientExperienceContinuityEvidenceProjection",
        ],
        [
            "PatientDegradedModeProjection",
            "PatientAttentionCuePolicy",
            "PatientTrustCueContract",
            "VisibilityProjectionPolicy",
        ],
        "Signed-in patient self-service context.",
        "Authenticated patient summary, spotlight, and section-level entry posture only after current visibility and continuity checks pass.",
        [
            "No direct consequence-bearing mutation; launches the next safe child action in the current shell.",
        ],
        [
            "Home spotlight, nav return, and selected anchor must stay stable through refresh and adjacent child work.",
        ],
        [
            "Read-only, placeholder, bounded recovery, or identity-hold posture inside the same shell.",
        ],
        [
            "NHS login",
            "Notification delivery rails",
        ],
        "baseline",
        [
            "patient-portal-experience-architecture-blueprint.md#Portal entry and shell topology",
            "patient-account-and-communications-blueprint.md#Patient home contract",
        ],
    ),
    route_family(
        "rf_patient_requests",
        "Requests",
        "patient",
        "same_shell_peer",
        "Request list and detail",
        [
            "patient-account-and-communications-blueprint.md",
            "patient-portal-experience-architecture-blueprint.md",
        ],
        [
            "PatientRequestsIndexProjection",
            "PatientRequestLineageProjection",
            "PatientRequestDetailProjection",
            "PatientExperienceContinuityEvidenceProjection",
            "RouteIntentBinding",
            "CommandActionRecord",
            "CommandSettlementRecord",
        ],
        [
            "VisibilityProjectionPolicy",
            "PatientStatusPresentationContract",
            "PatientNavReturnContract",
        ],
        "Authenticated or grant-scoped patient request work depending on the route and proof posture.",
        "Request summary, child-lineage chips, and downstream placeholders remain visibility-governed and continuity-bound.",
        [
            "Route-bound request follow-up such as more-info reply, recovery, and child-work entry.",
        ],
        [
            "Request list rows, detail, and child anchors must stay on the same request shell when continuity is unchanged.",
        ],
        [
            "Recovery-required, placeholder-only, or stale-row downgrade instead of detached request pages.",
        ],
        [
            "Messaging, callback, booking, hub, and pharmacy child projections",
        ],
        "baseline",
        [
            "patient-account-and-communications-blueprint.md#Requests browsing contract",
            "patient-account-and-communications-blueprint.md#Request detail contract",
        ],
    ),
    route_family(
        "rf_patient_appointments",
        "Appointments",
        "patient",
        "same_shell_peer",
        "Appointments and manage",
        [
            "patient-account-and-communications-blueprint.md",
            "phase-4-the-booking-engine.md",
        ],
        [
            "PatientAppointmentWorkspaceProjection",
            "PatientAppointmentManageProjection",
            "PatientManageCapabilitiesProjection",
            "ExternalConfirmationGate",
            "PatientExperienceContinuityEvidenceProjection",
            "RouteIntentBinding",
            "CommandActionRecord",
            "CommandSettlementRecord",
        ],
        [
            "VisibilityProjectionPolicy",
            "BookingContinuityEvidenceProjection",
            "ReservationAuthority",
        ],
        "Authenticated or grant-scoped patient manage posture under current booking truth.",
        "Patient may see confirmed, pending-confirmation, waitlist, callback fallback, or recovery posture without false reassurance.",
        [
            "Manage appointment, accept waitlist or hub alternative, respond to callback fallback, and continue booking-safe actions.",
        ],
        [
            "Booking and manage work remains inside the same request shell and preserves the selected option anchor.",
        ],
        [
            "Pending confirmation, waitlist fallback, read-only, or bounded recovery instead of detached success pages.",
        ],
        [
            "Booking provider adapters",
            "External confirmation gates",
        ],
        "baseline",
        [
            "phase-0-the-foundation-protocol.md#5.6 Booking, waitlist, hub, and pharmacy continuity algorithm",
            "patient-account-and-communications-blueprint.md#Core projections",
        ],
    ),
    route_family(
        "rf_patient_health_record",
        "Health record",
        "patient",
        "same_shell_peer",
        "Patient health record and documents",
        [
            "patient-account-and-communications-blueprint.md",
            "patient-portal-experience-architecture-blueprint.md",
        ],
        [
            "PatientRecordOverviewProjection",
            "PatientResultInsightProjection",
            "PatientDocumentLibraryProjection",
            "RecordArtifactParityWitness",
            "ArtifactPresentationContract",
            "OutboundNavigationGrant",
        ],
        [
            "VisibilityProjectionPolicy",
            "VisualizationParityProjection",
            "ArtifactFallbackDisposition",
        ],
        "Authenticated patient record access under current visibility and artifact parity rules.",
        "Patient-safe titles, summaries, trends, and artifact modes remain bound to current parity and visibility posture.",
        [
            "No direct clinical mutation; only governed artifact viewing or handoff requests where allowed.",
        ],
        [
            "Record routes stay in the same signed-in shell with stable return paths to active requests, appointments, or messages.",
        ],
        [
            "Table-only, summary-only, placeholder-only, or artifact recovery posture in place.",
        ],
        [
            "Record/document delivery rails",
            "Artifact handoff channels",
        ],
        "baseline",
        [
            "phase-0-the-foundation-protocol.md#5.5A Patient record and results visualization algorithm",
            "patient-portal-experience-architecture-blueprint.md#Primary navigation model",
        ],
    ),
    route_family(
        "rf_patient_messages",
        "Messages",
        "patient",
        "same_shell_peer",
        "Messages and callback thread",
        [
            "patient-account-and-communications-blueprint.md",
            "callback-and-clinician-messaging-loop.md",
        ],
        [
            "ConversationThreadProjection",
            "PatientCommunicationVisibilityProjection",
            "PatientConversationCluster",
            "PatientCallbackStatusProjection",
            "RouteIntentBinding",
            "CommandActionRecord",
            "CommandSettlementRecord",
        ],
        [
            "VisibilityProjectionPolicy",
            "PatientExperienceContinuityEvidenceProjection",
            "ReachabilityAssessmentRecord",
        ],
        "Authenticated or grant-scoped patient communication posture under current preview and reachability rules.",
        "Thread previews, reply posture, callback expectations, and delivery repair remain coverage-bound and evidence-backed.",
        [
            "Reply, acknowledge, or act on callback and communication work inside the current shell.",
        ],
        [
            "Conversation history, callback state, and reply composer must remain inside the same patient shell.",
        ],
        [
            "Read-only, placeholder, delivery-dispute, or recovery-required thread posture without detached message pages.",
        ],
        [
            "Messaging and telephony delivery rails",
            "Reachability adapters",
        ],
        "baseline",
        [
            "phase-0-the-foundation-protocol.md#5.5 Unified care conversation algorithm",
            "callback-and-clinician-messaging-loop.md",
        ],
    ),
    route_family(
        "rf_patient_embedded_channel",
        "Patient embedded channel parity",
        "patient",
        "same_shell_peer",
        "Embedded patient shell reuse",
        [
            "patient-portal-experience-architecture-blueprint.md",
            "phase-0-the-foundation-protocol.md",
        ],
        [
            "PatientEmbeddedSessionProjection",
            "PatientEmbeddedNavEligibility",
            "ReleaseApprovalFreeze",
            "ChannelReleaseFreezeRecord",
            "RouteFreezeDisposition",
        ],
        [
            "AudienceSurfaceRuntimeBinding",
            "VisibilityProjectionPolicy",
            "ReleaseRecoveryDisposition",
        ],
        "Authenticated patient in a trusted embedded host context.",
        "The same patient shell, narrowed by embedded manifest, bridge, and release posture.",
        [
            "The same route-bound patient actions as browser mode, but only while embedded validation remains exact.",
        ],
        [
            "Keep shell identity while the channel profile changes to embedded_strip or bounded recovery.",
        ],
        [
            "Safe-browser handoff, read-only, placeholder, or blocked posture inside the same shell.",
        ],
        [
            "Embedded host bridge",
            "Release and channel freezes",
        ],
        "deferred",
        [
            "patient-portal-experience-architecture-blueprint.md#Control priorities",
            "phase-0-the-foundation-protocol.md#5.4 Claim, secure-link, and embedded access algorithm",
        ],
    ),
    route_family(
        "rf_staff_workspace",
        "/workspace, /workspace/queue/:queueKey, /workspace/task/:taskId",
        "staff",
        "shell_root",
        "Clinical Workspace queue and task canvas",
        [
            "staff-workspace-interface-architecture.md",
            "staff-operations-and-support-blueprint.md",
        ],
        [
            "WorkspaceNavigationLedger",
            "StaffAudienceCoverageProjection",
            "StaffWorkspaceConsistencyProjection",
            "WorkspaceTrustEnvelope",
            "ReviewActionLease",
            "WorkspaceSelectedAnchorPolicy",
        ],
        [
            "AudienceSurfaceRuntimeBinding",
            "VisibilityProjectionPolicy",
            "RouteIntentBinding",
            "CommandActionRecord",
            "CommandSettlementRecord",
        ],
        "Practice-scoped clinical or operational review posture inside the staff shell.",
        "Practice-only detail and decision context without hub, support, or governance payload leakage.",
        [
            "Claim, review, issue direct outcomes, and launch child actions within current role scope.",
        ],
        [
            "Same request lineage, same staff shell; queue, task, and selected anchor remain stable across switches and refresh.",
        ],
        [
            "Observe-only, reassigned, or recovery-required task posture that preserves the last safe task summary.",
        ],
        [
            "Staff auth rail",
            "Downstream booking, callback, pharmacy, and admin-resolution services",
        ],
        "baseline",
        [
            "staff-workspace-interface-architecture.md#Route family",
            "staff-workspace-interface-architecture.md#Workspace shell-family ownership is explicit",
        ],
    ),
    route_family(
        "rf_staff_workspace_child",
        "/workspace/task/:taskId/more-info, /workspace/task/:taskId/decision, /workspace/approvals, /workspace/escalations, /workspace/changed, /workspace/search",
        "staff",
        "same_shell_child",
        "Clinical Workspace child review states",
        [
            "staff-workspace-interface-architecture.md",
            "phase-0-the-foundation-protocol.md",
        ],
        [
            "MoreInfoStatusDigest",
            "DecisionCommitEnvelope",
            "WorkspaceFocusProtectionLease",
            "ProtectedCompositionState",
            "TaskCompletionSettlementEnvelope",
            "RouteIntentBinding",
            "CommandActionRecord",
            "CommandSettlementRecord",
        ],
        [
            "WorkspaceRouteAdjacency",
            "WorkspaceStatusPresentationContract",
            "VisibilityProjectionPolicy",
        ],
        "Role-scoped child review posture inside the current task shell.",
        "The same task shell with protected composition, settlement, and delta-review rules.",
        [
            "Request more information, compose, confirm, escalate, approve, or search within the active workspace continuity frame.",
        ],
        [
            "Soft child states of the same shell; autosave and settlement never invent a second task shell.",
        ],
        [
            "Protected composition freeze, stale review demotion, or bounded recovery in place.",
        ],
        [
            "Messaging delivery rails",
            "Audit and approval chains",
        ],
        "baseline",
        [
            "staff-workspace-interface-architecture.md#Route family",
            "staff-workspace-interface-architecture.md#Additional route rules",
        ],
    ),
    route_family(
        "rf_hub_queue",
        "/hub/queue",
        "hub",
        "shell_root",
        "Hub queue",
        [
            "phase-5-the-network-horizon.md",
        ],
        [
            "HubCoordinationCase",
            "NetworkBookingRequest",
            "NetworkCoordinationPolicyEvaluation",
            "HubOwnershipTransition",
        ],
        [
            "AudienceVisibilityCoverage(hub_desk)",
            "VisibilityProjectionPolicy",
            "ShellFamilyOwnershipContract(shellType = hub)",
        ],
        "Hub coordination actor with active ownership and cross-organisation acting context.",
        "Coordination-safe summary, candidate freshness, and practice-ack debt only.",
        [
            "Claim, release, transfer, and resume hub cases from the coordination queue.",
        ],
        [
            "Preserve hub queue context and selected case anchor inside the same hub shell.",
        ],
        [
            "Stale-owner recovery, policy-blocked, or degraded-candidate posture in place.",
        ],
        [
            "Cross-site booking adapters",
            "Policy packs",
        ],
        "baseline",
        [
            "phase-5-the-network-horizon.md#Frontend work",
            "phase-5-the-network-horizon.md#5A. Network coordination contract, case model, and state machine",
        ],
    ),
    route_family(
        "rf_hub_case_management",
        "/hub/case/:hubCoordinationCaseId, /hub/alternatives/:offerSessionId, /hub/exceptions, /hub/audit/:hubCoordinationCaseId",
        "hub",
        "same_shell_child",
        "Hub case, alternatives, exception, and audit work",
        [
            "phase-5-the-network-horizon.md",
            "phase-0-the-foundation-protocol.md",
        ],
        [
            "HubCoordinationCase",
            "AlternativeOfferSession",
            "AlternativeOfferOptimisationPlan",
            "HubOfferToConfirmationTruthProjection",
            "PracticeAcknowledgementRecord",
            "HubFallbackRecord",
        ],
        [
            "RouteFamilyOwnershipClaim",
            "VisibilityProjectionPolicy",
            "Continuity evidence for hub booking manage",
        ],
        "Hub coordination case posture with active offer, callback, return, or confirmation truth.",
        "Hub case detail is the shell root; alternatives, exception handling, and audit stay inside the same hub shell while the case is active.",
        [
            "Offer alternatives, commit native booking, trigger callback fallback, or return to practice.",
        ],
        [
            "Keep the active hub case anchor and same shell through alternatives, confirmation, callback transfer, and audit proof review.",
        ],
        [
            "Confirmation pending, callback transfer pending, booked_pending_practice_ack, disputed truth, or identity-repair hold without detaching from the case.",
        ],
        [
            "Cross-site booking adapters",
            "Practice acknowledgement delivery",
            "Callback linkage",
        ],
        "baseline",
        [
            "phase-5-the-network-horizon.md#Frontend work",
            "phase-5-the-network-horizon.md#Hub shell-family ownership is explicit",
        ],
    ),
    route_family(
        "rf_pharmacy_console",
        "/workspace/pharmacy, /workspace/pharmacy/:pharmacyCaseId, /validate, /inventory, /resolve, /handoff, /assurance",
        "pharmacy",
        "shell_root",
        "Pharmacy Console",
        [
            "pharmacy-console-frontend-architecture.md",
            "phase-6-the-pharmacy-loop.md",
        ],
        [
            "PharmacyConsoleContinuityEvidenceProjection",
            "RouteIntentBinding",
            "CommandActionRecord",
            "CommandSettlementRecord",
            "ProjectionContractVersionSet",
        ],
        [
            "ShellFamilyOwnershipContract(shellType = pharmacy)",
            "VisibilityProjectionPolicy",
            "ClientCachePolicy",
        ],
        "Servicing-site delivery posture inside the dedicated pharmacy mission frame.",
        "Case workbench, compare, inventory, handoff, and assurance remain one pharmacy shell even when the URL sits under /workspace.",
        [
            "Validate, inventory check, resolve, hand off, and assurance review inside the active pharmacy case.",
        ],
        [
            "Deep links, refresh, and browser history reopen the current pharmacy shell and selected case anchor.",
        ],
        [
            "Read-only, reconcile-required, or blocked settlement posture while keeping the last safe case context visible.",
        ],
        [
            "Pharmacy dispatch transport",
            "Outcome ingestion",
        ],
        "baseline",
        [
            "pharmacy-console-frontend-architecture.md#Mission frame",
            "pharmacy-console-frontend-architecture.md#The recommended route family is",
        ],
    ),
    route_family(
        "rf_support_ticket_workspace",
        "/ops/support, /ops/support/inbox/:viewKey, /ops/support/tickets/:supportTicketId, /conversation, /history, /knowledge, /actions/:actionKey, /handoff/:supportOwnershipTransferId",
        "support",
        "shell_root",
        "Support ticket workspace",
        [
            "staff-operations-and-support-blueprint.md",
            "phase-0-the-foundation-protocol.md",
        ],
        [
            "SupportTicket",
            "SupportLineageBinding",
            "SupportActionLease",
            "SupportMutationAttempt",
            "SupportActionSettlement",
            "SupportActionWorkbenchProjection",
        ],
        [
            "SupportSurfaceRuntimeBinding",
            "VisibilityProjectionPolicy",
            "ArtifactPresentationContract",
            "OutboundNavigationGrant",
        ],
        "Masked support posture with explicit disclosure ceiling and action lease.",
        "Support chronology, knowledge, handoff, and action surfaces remain one support shell and one ticket anchor.",
        [
            "Controlled resend, reissue, recovery, identity correction, and handoff work under the current support action lease.",
        ],
        [
            "Ticket, conversation, history, knowledge, and action child routes preserve the same support shell and ticket anchor.",
        ],
        [
            "Read-only fallback, pending external, or recovery-required ticket posture without context-destroying page swaps.",
        ],
        [
            "Notification delivery rails",
            "Secure-link issuance",
            "Telephony delivery",
        ],
        "baseline",
        [
            "staff-operations-and-support-blueprint.md#Support route contract",
            "phase-0-the-foundation-protocol.md#6.5 Support and replay algorithm",
        ],
    ),
    route_family(
        "rf_support_replay_observe",
        "/ops/support/replay/:supportReplaySessionId and /ops/support/tickets/:supportTicketId/observe/:supportObserveSessionId",
        "support",
        "same_shell_child",
        "Support replay and observe",
        [
            "staff-operations-and-support-blueprint.md",
            "phase-0-the-foundation-protocol.md",
        ],
        [
            "SupportReplayCheckpoint",
            "SupportReplayRestoreSettlement",
            "SupportObserveSession",
            "SupportReadOnlyFallbackProjection",
            "SupportContinuityEvidenceProjection",
        ],
        [
            "Mask scope validation",
            "Replay release decision",
            "VisibilityProjectionPolicy",
        ],
        "Support replay or observe posture under a frozen checkpoint and current mask scope.",
        "Replay and observe are bounded child routes of the same support shell, not detached forensic tools.",
        [
            "Observe only, release replay, inspect history, or pivot to escalation under current checkpoints and leases.",
        ],
        [
            "Replay exit and observe return must restore the same ticket anchor before live controls can re-arm.",
        ],
        [
            "Read-only fallback, stale reacquire, or awaiting-external hold with the same ticket anchor preserved.",
        ],
        [
            "Support replay tooling",
            "Audit evidence",
        ],
        "baseline",
        [
            "staff-operations-and-support-blueprint.md#Support route contract",
            "phase-0-the-foundation-protocol.md#6.5 Support and replay algorithm",
        ],
    ),
    route_family(
        "rf_operations_board",
        "/ops/overview, /ops/queues, /ops/capacity, /ops/dependencies, /ops/audit, /ops/assurance, /ops/incidents, /ops/resilience",
        "operations",
        "shell_root",
        "Operations board",
        [
            "operations-console-frontend-blueprint.md",
            "platform-frontend-blueprint.md",
        ],
        [
            "OpsBoardStateSnapshot",
            "OpsSelectionLease",
            "OpsDeltaGate",
            "OpsBoardPosture",
            "OpsReturnToken",
            "OpsContinuityEvidenceSlice",
        ],
        [
            "RouteFamilyOwnershipClaim",
            "AudienceSurfaceRuntimeBinding",
            "WorkspaceTrustEnvelope(workspaceFamily = ops_intervention)",
        ],
        "Purpose-of-use-specific operations control posture.",
        "A live control-room shell for anomaly detection, dependency posture, assurance pivots, and bounded intervention readiness.",
        [
            "No direct governance mutation; may prepare or issue bounded operational interventions within the current fence.",
        ],
        [
            "Keep the same operations shell while filters, horizon, selected anomaly, and board tuple stay valid.",
        ],
        [
            "Read-only diagnostic, partial restore, stale selection freeze, or fallback lens restore inside the same shell.",
        ],
        [
            "Telemetry and queue health feeds",
            "Release watch and assurance evidence",
        ],
        "baseline",
        [
            "operations-console-frontend-blueprint.md#Canonical route family",
            "platform-frontend-blueprint.md#Operations Console specialization",
        ],
    ),
    route_family(
        "rf_operations_drilldown",
        "/ops/:opsLens/investigations/:opsRouteIntentId, /interventions/:opsRouteIntentId, /compare/:opsRouteIntentId, /health/:opsRouteIntentId",
        "operations",
        "same_shell_child",
        "Operations investigation and intervention drill-down",
        [
            "operations-console-frontend-blueprint.md",
        ],
        [
            "OpsRouteIntent",
            "OpsActionEligibilityFence",
            "OpsGovernanceHandoff",
            "OpsRestoreReport",
            "WorkspaceTrustEnvelope(workspaceFamily = ops_intervention)",
        ],
        [
            "RouteFamilyOwnershipClaim",
            "AudienceSurfaceRuntimeBinding",
            "OpsDeltaGate",
        ],
        "Operations drill-down posture on the current board scope and selected anomaly.",
        "Investigation, compare, health, and intervention views stay within the same operations shell unless a true governance handoff occurs.",
        [
            "Inspect or issue operational interventions, freeze board state, or hand off to governance.",
        ],
        [
            "Return to the same board snapshot and selection lease after drill-down or governance handoff.",
        ],
        [
            "Read-only diagnostic, blocked guardrail, or fallback restore while the last stable board stays visible.",
        ],
        [
            "Governance handoff",
            "Assurance and audit pivots",
        ],
        "baseline",
        [
            "operations-console-frontend-blueprint.md#Canonical route family",
            "operations-console-frontend-blueprint.md#Restore reporting and board-frame discipline",
        ],
    ),
    route_family(
        "rf_governance_shell",
        "/ops/governance/*, /ops/access/*, /ops/config/*, /ops/comms/*, /ops/release/*",
        "governance",
        "shell_root",
        "Governance and Admin shell",
        [
            "governance-admin-console-frontend-blueprint.md",
            "platform-frontend-blueprint.md",
        ],
        [
            "GovernanceContinuityFrame",
            "GovernanceScopeToken",
            "ChangeBaselineSnapshot",
            "GovernanceReturnIntentToken",
            "GovernanceFreezeDisposition",
            "GovernanceReviewPackage",
            "ApprovalStepper",
        ],
        [
            "RouteFamilyOwnershipClaim",
            "AudienceSurfaceRuntimeBinding",
            "ReleaseWatchTuple",
        ],
        "Governance review posture with exact scope, baseline, package, and watch tuple alignment.",
        "Governance, access, config, comms, and release work stay in one dedicated shell rather than an operations subpanel.",
        [
            "Approve, promote, rollback, govern access, manage config, and review compliance work inside the current package.",
        ],
        [
            "Keep the same governance continuity frame and return intent across diff, simulation, approval, promotion watch, and evidence pivots.",
        ],
        [
            "Freeze disposition, blocked guardrail, or read-only evidence pivot while preserving the current governed object and scope token.",
        ],
        [
            "Release watch tuples",
            "Approval evidence",
            "Config and comms publications",
        ],
        "baseline",
        [
            "governance-admin-console-frontend-blueprint.md#Shell and route topology",
            "platform-frontend-blueprint.md#Governance/Admin specialization",
        ],
    ),
    route_family(
        "rf_assistive_control_shell",
        "Assistive evaluation, replay, monitoring, and release-control surfaces (derived)",
        "assistive",
        "shell_root",
        "Standalone assistive control shell",
        [
            "phase-8-the-assistive-layer.md",
            "phase-0-the-foundation-protocol.md",
        ],
        [
            "AssistiveInvocationGrant",
            "AssistiveSurfaceBinding",
            "AssistiveCapabilityTrustEnvelope",
            "AudienceSurfaceRouteContract",
            "RuntimePublicationBundle",
        ],
        [
            "VisibilityProjectionPolicy",
            "AudienceSurfaceRuntimeBinding",
            "UITelemetryDisclosureFence",
            "RouteFreezeDisposition",
        ],
        "Standalone assistive tooling posture only for evaluation, replay, monitoring, or release-control work.",
        "This shell is allowed by Phase 0 for non-live-care assistive control work only; live care, support, and operational assistive use remains bounded inside the owning shell.",
        [
            "Replay, evaluation, monitoring, or release-control work under the current assistive grant and rollout verdict.",
        ],
        [
            "Standalone assistive shell only where the corpus explicitly calls for it; otherwise the user returns to the owning shell.",
        ],
        [
            "Shadow-only, blocked, quarantined, or regenerate-required posture under publication or rollout drift.",
        ],
        [
            "Model registry",
            "Evaluation corpus",
            "Rollout control plane",
        ],
        "conditional",
        [
            "phase-8-the-assistive-layer.md#Control priorities",
            "phase-0-the-foundation-protocol.md#1.1 PersistentShell",
        ],
        "The corpus names the work classes but not concrete routes, so this route family label is intentionally derived.",
        explicit_route_contract=False,
    ),
]

SURFACES = [
    surface(
        "surf_patient_intake_web",
        "patient_anonymous_intake",
        "rf_intake_self_service",
        "patient",
        "browser",
        "browser_web",
        "Patient intake entry",
        [
            "Start intake, capture evidence, and submit safely into the governed request pipeline.",
        ],
        [
            "Create or update SubmissionEnvelope fields and submit for promotion.",
        ],
        [
            "Keep the same intake lineage across web, later sign-in, and later recovery.",
        ],
        [
            "Fallback review, artifact quarantine, or safe receipt in place.",
        ],
        [
            "Optional NHS login uplift",
            "Binary artifact store",
        ],
        "Anonymous or partially identified patient.",
        "Public-safe summary and placeholder posture only.",
        [
            "SubmissionEnvelope",
            "IntakeConvergenceContract",
            "SubmissionPromotionRecord",
        ],
        [
            "AudienceVisibilityCoverage(patient_public)",
            "VisibilityProjectionPolicy",
        ],
        [
            "blueprint-init.md",
            "phase-0-the-foundation-protocol.md",
        ],
        "baseline",
        [
            "blueprint-init.md#2. Core product surfaces",
            "phase-0-the-foundation-protocol.md#12.1 Mandatory audience tiers",
        ],
        notes="Derived route label pending later endpoint hardening.",
    ),
    surface(
        "surf_patient_intake_phone",
        "phone_ivr_caller",
        "rf_intake_telephony_capture",
        "patient",
        "constrained_browser",
        "telephony_ivr",
        "Telephony / IVR intake capture",
        [
            "Start or continue the same governed intake lineage through phone or IVR.",
        ],
        [
            "Append telephony ingress records and trigger secure-link continuation when needed.",
        ],
        [
            "Preserve the same intake lineage across phone, SMS continuation, and later digital recovery.",
        ],
        [
            "Telephony outage or fallback review without creating a separate support-only queue.",
        ],
        [
            "Telephony adapter",
            "Optional SMS follow-up",
        ],
        "Phone-origin patient identification or partial identity capture.",
        "Public-safe summary only until richer proof exists.",
        [
            "SubmissionEnvelope",
            "SubmissionIngressRecord",
            "IntakeConvergenceContract",
            "SubmissionPromotionRecord",
        ],
        [
            "Telephony parity rule",
            "AudienceVisibilityCoverage(patient_public)",
            "SubmissionPromotionRecord",
        ],
        [
            "blueprint-init.md",
            "phase-0-the-foundation-protocol.md",
        ],
        "baseline",
        [
            "blueprint-init.md#2. Core product surfaces",
            "phase-0-the-foundation-protocol.md#0.2 Continuity key and shell law",
        ],
        notes="Channel profile is mapped to constrained_browser posture by assumption because Phase 0 exposes no fourth shell channel profile.",
    ),
    surface(
        "surf_patient_secure_link_recovery",
        "patient_grant_scoped_recovery",
        "rf_patient_secure_link_recovery",
        "patient",
        "constrained_browser",
        "sms_secure_link_continuation",
        "Secure-link recovery and claim resume",
        [
            "Resume or recover a specific lineage action through a minimal secure-link grant.",
        ],
        [
            "Redeem secure link, claim or re-auth, and continue a route-bound action.",
        ],
        [
            "Keep the same request or child-route anchor through redemption and step-up.",
        ],
        [
            "Expired link, identity hold, placeholder-only, or safe-browser handoff posture.",
        ],
        [
            "SMS secure-link delivery",
            "NHS login step-up",
        ],
        "Minimal grant or verified continuation before full authenticated uplift.",
        "Summary-only or suppressed-recovery-only visibility until route checks pass.",
        [
            "AccessGrantRedemptionRecord",
            "PatientSecureLinkSessionProjection",
            "PatientActionRecoveryProjection",
        ],
        [
            "RouteFreezeDisposition",
            "ReleaseRecoveryDisposition",
            "VisibilityProjectionPolicy",
        ],
        [
            "patient-account-and-communications-blueprint.md",
            "phase-0-the-foundation-protocol.md",
        ],
        "baseline",
        [
            "patient-account-and-communications-blueprint.md#Patient audience coverage contract",
            "phase-0-the-foundation-protocol.md#5.4 Claim, secure-link, and embedded access algorithm",
        ],
        notes="This row closes the patient public vs grant-scoped confusion without inventing a second patient shell.",
    ),
    surface(
        "surf_patient_home",
        "patient_authenticated_portal",
        "rf_patient_home",
        "patient",
        "browser",
        "browser_web",
        "Patient home and spotlight",
        [
            "Orient the patient, surface the dominant next safe action, and preserve a stable portal shell.",
        ],
        [
            "No direct mutation; launch the next safe child action from the current shell.",
        ],
        [
            "Preserve spotlight, nav return, and selected anchor through refresh and child work.",
        ],
        [
            "Read-only, placeholder, or bounded recovery posture in the same shell.",
        ],
        [
            "NHS login",
            "Notification delivery rails",
        ],
        "Signed-in patient self-service posture.",
        "Authenticated summary and orientation only after current visibility and continuity checks pass.",
        [
            "PatientPortalEntryProjection",
            "PatientHomeProjection",
            "PatientSpotlightDecisionProjection",
        ],
        [
            "PatientDegradedModeProjection",
            "PatientTrustCueContract",
        ],
        [
            "patient-portal-experience-architecture-blueprint.md",
            "patient-account-and-communications-blueprint.md",
        ],
        "baseline",
        [
            "patient-portal-experience-architecture-blueprint.md#Portal entry and shell topology",
            "patient-account-and-communications-blueprint.md#Patient home contract",
        ],
    ),
    surface(
        "surf_patient_requests",
        "patient_authenticated_portal",
        "rf_patient_requests",
        "patient",
        "browser",
        "browser_web",
        "Request list and detail",
        [
            "Browse requests, inspect lineage strips, and act on request-bound follow-up work.",
        ],
        [
            "Route-bound follow-up such as more-info reply, recovery, or child-work entry.",
        ],
        [
            "Stay in the same patient shell while moving between request list, detail, and child routes.",
        ],
        [
            "Placeholder-only, stale-row, or recovery-required posture without detached request pages.",
        ],
        [
            "Messaging, callback, booking, hub, and pharmacy child projections",
        ],
        "Authenticated patient request posture.",
        "Request rows, detail, and child placeholders are visibility-governed and continuity-bound.",
        [
            "PatientRequestsIndexProjection",
            "PatientRequestLineageProjection",
            "PatientRequestDetailProjection",
            "RouteIntentBinding",
            "CommandSettlementRecord",
        ],
        [
            "VisibilityProjectionPolicy",
            "PatientNavReturnContract",
        ],
        [
            "patient-account-and-communications-blueprint.md",
        ],
        "baseline",
        [
            "patient-account-and-communications-blueprint.md#Requests browsing contract",
            "patient-account-and-communications-blueprint.md#Request detail contract",
        ],
    ),
    surface(
        "surf_patient_appointments",
        "patient_authenticated_portal",
        "rf_patient_appointments",
        "patient",
        "browser",
        "browser_web",
        "Appointments and manage",
        [
            "Inspect appointment truth, manage it honestly, and continue waitlist or hub-managed work without leaving the shell.",
        ],
        [
            "Manage appointment, accept waitlist or hub alternative, or continue booking-safe actions under route intent.",
        ],
        [
            "Keep the same request shell and selected option anchor across booking, waitlist, and manage child states.",
        ],
        [
            "Pending confirmation, waitlist fallback, read-only, or bounded recovery posture instead of false booked reassurance.",
        ],
        [
            "Booking provider adapters",
            "External confirmation gate",
        ],
        "Authenticated patient manage posture.",
        "Booking manage posture is subordinate to authoritative reservation and settlement truth.",
        [
            "PatientAppointmentManageProjection",
            "PatientManageCapabilitiesProjection",
            "ExternalConfirmationGate",
            "RouteIntentBinding",
            "CommandSettlementRecord",
        ],
        [
            "BookingContinuityEvidenceProjection",
            "ReservationAuthority",
        ],
        [
            "patient-account-and-communications-blueprint.md",
            "phase-0-the-foundation-protocol.md",
        ],
        "baseline",
        [
            "phase-0-the-foundation-protocol.md#5.6 Booking, waitlist, hub, and pharmacy continuity algorithm",
            "patient-account-and-communications-blueprint.md#Core projections",
        ],
    ),
    surface(
        "surf_patient_health_record",
        "patient_authenticated_portal",
        "rf_patient_health_record",
        "patient",
        "browser",
        "browser_web",
        "Patient health record and documents",
        [
            "Read results, documents, and record updates without losing portal continuity.",
        ],
        [
            "No direct clinical mutation; only governed artifact and handoff actions where allowed.",
        ],
        [
            "Preserve return paths to active requests, messages, or appointments while staying in the same patient shell.",
        ],
        [
            "Table-only, summary-only, placeholder-only, or artifact recovery posture in place.",
        ],
        [
            "Artifact delivery rails",
            "Outbound navigation grants",
        ],
        "Authenticated patient record posture.",
        "Artifact parity and visibility posture must stay aligned before detail or bytes render.",
        [
            "PatientRecordOverviewProjection",
            "PatientDocumentLibraryProjection",
            "RecordArtifactParityWitness",
            "ArtifactPresentationContract",
        ],
        [
            "VisualizationParityProjection",
            "ArtifactFallbackDisposition",
        ],
        [
            "phase-0-the-foundation-protocol.md",
            "patient-account-and-communications-blueprint.md",
        ],
        "baseline",
        [
            "phase-0-the-foundation-protocol.md#5.5A Patient record and results visualization algorithm",
            "patient-account-and-communications-blueprint.md#Core projections",
        ],
    ),
    surface(
        "surf_patient_messages",
        "patient_authenticated_portal",
        "rf_patient_messages",
        "patient",
        "browser",
        "browser_web",
        "Messages and callback thread",
        [
            "Read and reply to messages, callback prompts, and patient-visible communication work inside the same shell.",
        ],
        [
            "Reply, acknowledge, or act on callback and communication work under route intent and settlement truth.",
        ],
        [
            "Keep the same patient shell, thread anchor, and current required action while the conversation settles.",
        ],
        [
            "Delivery dispute, read-only, placeholder, or recovery-required thread posture without detached mini-flows.",
        ],
        [
            "Messaging providers",
            "Telephony provider",
        ],
        "Authenticated patient communication posture.",
        "Preview, reply, and callback posture stay subordinate to visibility policy, reachability truth, and settlement evidence.",
        [
            "ConversationThreadProjection",
            "PatientCommunicationVisibilityProjection",
            "RouteIntentBinding",
            "CommandSettlementRecord",
        ],
        [
            "ReachabilityAssessmentRecord",
            "PatientExperienceContinuityEvidenceProjection",
        ],
        [
            "callback-and-clinician-messaging-loop.md",
            "patient-account-and-communications-blueprint.md",
        ],
        "baseline",
        [
            "phase-0-the-foundation-protocol.md#5.5 Unified care conversation algorithm",
            "callback-and-clinician-messaging-loop.md",
        ],
    ),
    surface(
        "surf_patient_embedded_shell",
        "patient_embedded_nhs_app",
        "rf_patient_embedded_channel",
        "patient",
        "embedded",
        "embedded_webview",
        "Embedded patient shell reuse",
        [
            "Use the same patient portal sections under embedded host constraints and release controls.",
        ],
        [
            "The same route-bound patient actions as browser mode, but only when embedded validation remains current.",
        ],
        [
            "Preserve shell identity while chrome, bridge capability, and artifact behavior narrow.",
        ],
        [
            "Safe-browser handoff, read-only, placeholder, or blocked posture inside the same shell.",
        ],
        [
            "Embedded host bridge",
            "Release and channel freezes",
        ],
        "Authenticated patient in a trusted embedded host context.",
        "Embedded posture narrows capability without changing shell ownership.",
        [
            "PatientEmbeddedSessionProjection",
            "PatientEmbeddedNavEligibility",
            "ChannelReleaseFreezeRecord",
        ],
        [
            "ReleaseApprovalFreeze",
            "RouteFreezeDisposition",
            "AudienceSurfaceRuntimeBinding",
        ],
        [
            "patient-portal-experience-architecture-blueprint.md",
            "phase-0-the-foundation-protocol.md",
        ],
        "deferred",
        [
            "patient-portal-experience-architecture-blueprint.md#Control priorities",
            "phase-0-the-foundation-protocol.md#5.4 Claim, secure-link, and embedded access algorithm",
        ],
        notes="Deferred baseline expansion only.",
    ),
    surface(
        "surf_clinician_workspace",
        "clinician_designated_reviewer",
        "rf_staff_workspace",
        "staff",
        "browser",
        "browser_web",
        "Clinical Workspace queue and task canvas",
        [
            "Scan the queue, open the right task, and move to a safe human decision quickly.",
        ],
        [
            "Claim, review, and route work under the current review lease and trust envelope.",
        ],
        [
            "Stay in the same workspace shell while queue, task, and selected anchor remain continuity-compatible.",
        ],
        [
            "Observe-only, reassigned, or recovery-required posture with the last safe task summary preserved.",
        ],
        [
            "Staff auth rail",
            "Downstream booking, callback, and pharmacy services",
        ],
        "Practice-scoped clinician review posture.",
        "Clinical review detail is bounded by origin-practice coverage and current review trust.",
        [
            "WorkspaceTrustEnvelope",
            "ReviewActionLease",
            "StaffWorkspaceConsistencyProjection",
        ],
        [
            "VisibilityProjectionPolicy",
            "AudienceSurfaceRuntimeBinding",
        ],
        [
            "staff-workspace-interface-architecture.md",
            "staff-operations-and-support-blueprint.md",
        ],
        "baseline",
        [
            "staff-workspace-interface-architecture.md#Route family",
            "staff-operations-and-support-blueprint.md#Clinical Workspace specialization",
        ],
    ),
    surface(
        "surf_clinician_workspace_child",
        "clinician_designated_reviewer",
        "rf_staff_workspace_child",
        "staff",
        "browser",
        "browser_web",
        "Clinical Workspace child review states",
        [
            "Work more-info, decision, approval, escalation, and changed-since-seen child states without losing task continuity.",
        ],
        [
            "Compose, confirm, or escalate under protected composition and settlement gates.",
        ],
        [
            "Stay on the same task shell while child review surfaces open as same-shell child or bounded side stages.",
        ],
        [
            "Protected composition freeze, stale review demotion, or bounded recovery in place.",
        ],
        [
            "Messaging delivery rails",
            "Approval chains",
        ],
        "Child clinical review posture inside the active task shell.",
        "No child route may replace the workspace shell or outrun lease and settlement truth.",
        [
            "MoreInfoStatusDigest",
            "DecisionCommitEnvelope",
            "WorkspaceFocusProtectionLease",
            "CommandSettlementRecord",
        ],
        [
            "WorkspaceRouteAdjacency",
            "WorkspaceStatusPresentationContract",
        ],
        [
            "staff-workspace-interface-architecture.md",
        ],
        "baseline",
        [
            "staff-workspace-interface-architecture.md#Route family",
            "staff-workspace-interface-architecture.md#Additional route rules",
        ],
    ),
    surface(
        "surf_practice_ops_workspace",
        "practice_operational_staff",
        "rf_staff_workspace",
        "staff",
        "browser",
        "browser_web",
        "Practice operations workspace",
        [
            "Work operational and admin-resolution tasks in the same workspace shell as queue and task context changes.",
        ],
        [
            "Claim, review, send more-info, and complete bounded operational actions under the current lease.",
        ],
        [
            "Keep queue filters and selected task anchors stable across operational task switches.",
        ],
        [
            "Blocked, observe-only, or recovery-required posture in place.",
        ],
        [
            "Staff auth rail",
            "Operational messaging and booking services",
        ],
        "Practice-scoped operational posture.",
        "Operational staff inherits origin-practice coverage but not clinician-wide narrative or governance payloads.",
        [
            "StaffAudienceCoverageProjection",
            "WorkspaceNavigationLedger",
            "ReviewActionLease",
        ],
        [
            "VisibilityProjectionPolicy",
            "AudienceSurfaceRuntimeBinding",
        ],
        [
            "staff-workspace-interface-architecture.md",
            "staff-operations-and-support-blueprint.md",
        ],
        "baseline",
        [
            "staff-workspace-interface-architecture.md#Route family",
            "staff-operations-and-support-blueprint.md#Staff audience coverage contract",
        ],
    ),
    surface(
        "surf_hub_queue",
        "hub_coordinator",
        "rf_hub_queue",
        "hub",
        "browser",
        "browser_web",
        "Hub queue",
        [
            "Claim and prioritize cross-site coordination work from one hub queue.",
        ],
        [
            "Claim, release, or transfer hub cases under lease and acting-context rules.",
        ],
        [
            "Preserve queue context and selected case anchor inside the same hub shell.",
        ],
        [
            "Stale-owner recovery, policy-blocked, or degraded candidate posture in place.",
        ],
        [
            "Cross-site booking adapters",
            "Policy packs",
        ],
        "Hub desk coordination posture.",
        "Only coordination-safe summary and acknowledgement debt should appear at queue level.",
        [
            "HubCoordinationCase",
            "NetworkCoordinationPolicyEvaluation",
            "HubOwnershipTransition",
        ],
        [
            "VisibilityProjectionPolicy",
            "AudienceVisibilityCoverage(hub_desk)",
        ],
        [
            "phase-5-the-network-horizon.md",
        ],
        "baseline",
        [
            "phase-5-the-network-horizon.md#Frontend work",
        ],
    ),
    surface(
        "surf_hub_case_management",
        "hub_coordinator",
        "rf_hub_case_management",
        "hub",
        "browser",
        "browser_web",
        "Hub case, alternatives, exception, and audit work",
        [
            "Coordinate alternatives, callback fallback, return-to-practice, and confirmation truth on one active hub case.",
        ],
        [
            "Offer alternatives, commit native booking, initiate callback fallback, or return to practice.",
        ],
        [
            "Preserve the same hub case shell and selected case anchor through alternatives, audit, and fallback child work.",
        ],
        [
            "Confirmation pending, booked_pending_practice_ack, callback transfer pending, disputed truth, or identity-repair hold without leaving the active case.",
        ],
        [
            "Cross-site booking adapters",
            "Practice acknowledgement delivery",
            "Callback linkage",
        ],
        "Hub case management posture.",
        "Hub case detail is the shell root even when child work references booking, callback, or audit evidence.",
        [
            "HubCoordinationCase",
            "AlternativeOfferSession",
            "HubOfferToConfirmationTruthProjection",
            "PracticeAcknowledgementRecord",
            "HubFallbackRecord",
        ],
        [
            "RouteFamilyOwnershipClaim",
            "Continuity evidence for hub booking manage",
        ],
        [
            "phase-5-the-network-horizon.md",
        ],
        "baseline",
        [
            "phase-5-the-network-horizon.md#Frontend work",
            "phase-5-the-network-horizon.md#Hub shell-family ownership is explicit",
        ],
    ),
    surface(
        "surf_pharmacy_console",
        "pharmacy_servicing_assurance_user",
        "rf_pharmacy_console",
        "pharmacy",
        "browser",
        "browser_web",
        "Pharmacy Console case workbench",
        [
            "Validate, fulfil, hand off, and assure pharmacy work in a dedicated pharmacy mission frame.",
        ],
        [
            "Validate, inventory-check, resolve, hand off, and assurance-review within the active case.",
        ],
        [
            "Preserve the active pharmacy case anchor across case, compare, inventory, handoff, and assurance routes.",
        ],
        [
            "Read-only, reconcile-required, or blocked settlement posture in place.",
        ],
        [
            "Pharmacy dispatch transport",
            "Outcome ingestion",
        ],
        "Servicing-site delivery posture inside the pharmacy shell.",
        "The pharmacy console owns the mission frame even when the path begins under /workspace.",
        [
            "PharmacyConsoleContinuityEvidenceProjection",
            "RouteIntentBinding",
            "CommandSettlementRecord",
        ],
        [
            "ShellFamilyOwnershipContract(shellType = pharmacy)",
            "VisibilityProjectionPolicy",
        ],
        [
            "pharmacy-console-frontend-architecture.md",
            "phase-6-the-pharmacy-loop.md",
        ],
        "baseline",
        [
            "pharmacy-console-frontend-architecture.md#Mission frame",
            "pharmacy-console-frontend-architecture.md#The recommended route family is",
        ],
    ),
    surface(
        "surf_support_ticket_workspace",
        "support_desk_agent",
        "rf_support_ticket_workspace",
        "support",
        "browser",
        "browser_web",
        "Support ticket workspace",
        [
            "Operate a ticket-centric repair workspace with chronology, subject 360, handoff, and bounded recovery actions.",
        ],
        [
            "Controlled resend, reissue, attachment recovery, identity correction, and handoff work under the current support action lease.",
        ],
        [
            "Stay in one support shell while moving between ticket, conversation, history, knowledge, and action child routes.",
        ],
        [
            "Read-only fallback, pending-external hold, or recovery-required posture without context-destroying page swaps.",
        ],
        [
            "Notification delivery rails",
            "Secure-link issuance",
            "Telephony delivery",
        ],
        "Masked support posture with explicit disclosure ceiling and action lease.",
        "Support cannot widen into unrestricted production access or an ad hoc replay system.",
        [
            "SupportTicket",
            "SupportLineageBinding",
            "SupportActionLease",
            "SupportActionSettlement",
        ],
        [
            "SupportSurfaceRuntimeBinding",
            "VisibilityProjectionPolicy",
            "ArtifactPresentationContract",
        ],
        [
            "staff-operations-and-support-blueprint.md",
        ],
        "baseline",
        [
            "staff-operations-and-support-blueprint.md#Support route contract",
        ],
    ),
    surface(
        "surf_support_replay_observe",
        "support_desk_agent",
        "rf_support_replay_observe",
        "support",
        "browser",
        "browser_web",
        "Support replay and observe",
        [
            "Inspect replay or observe-only evidence without losing the current ticket shell or mask scope.",
        ],
        [
            "Observe-only review and replay release decisions; no live repair mutation until restore revalidates.",
        ],
        [
            "Replay and observe are bounded child routes of the same support shell and same ticket anchor.",
        ],
        [
            "Read-only fallback, stale reacquire, or awaiting-external hold while preserving the ticket anchor.",
        ],
        [
            "Support replay tooling",
            "Audit evidence",
        ],
        "Support replay posture under a frozen checkpoint.",
        "Replay does not become a detached forensic product and may not re-arm live mutation controls until same-shell restore settles.",
        [
            "SupportReplayCheckpoint",
            "SupportReplayRestoreSettlement",
            "SupportObserveSession",
        ],
        [
            "Mask scope validation",
            "Replay release decision",
            "SupportContinuityEvidenceProjection",
        ],
        [
            "staff-operations-and-support-blueprint.md",
            "phase-0-the-foundation-protocol.md",
        ],
        "baseline",
        [
            "staff-operations-and-support-blueprint.md#Support route contract",
            "phase-0-the-foundation-protocol.md#6.5 Support and replay algorithm",
        ],
    ),
    surface(
        "surf_support_assisted_capture",
        "support_desk_agent",
        "rf_support_ticket_workspace",
        "support",
        "browser",
        "support_assisted_capture",
        "Support-assisted capture and recovery",
        [
            "Assist intake or recovery capture into the same governed patient lineage from inside the support workspace.",
        ],
        [
            "Append support-assisted ingress, reissue minimal access, or repair contact-route state under the active support ticket and disclosure ceiling.",
        ],
        [
            "The patient lineage stays intact; support capture does not mint a second workflow system.",
        ],
        [
            "Read-only fallback or explicit reacquire path if the current support ticket, scope, or route intent is stale.",
        ],
        [
            "Secure-link issuance",
            "Notification delivery rails",
        ],
        "Support posture with masked subject scope while assisting intake or recovery.",
        "This closes the scattered-support gap by giving assisted capture its own explicit surface entry.",
        [
            "SupportTicket",
            "SupportLineageBinding",
            "SubmissionIngressRecord",
            "SecureLinkReissueRecord",
        ],
        [
            "VisibilityProjectionPolicy",
            "SupportActionLease",
            "RouteIntentBinding",
        ],
        [
            "blueprint-init.md",
            "staff-operations-and-support-blueprint.md",
        ],
        "baseline",
        [
            "blueprint-init.md#2. Core product surfaces",
            "staff-operations-and-support-blueprint.md#Support route contract",
        ],
        notes="Inventory row added to make support-assisted capture explicit rather than implied.",
    ),
    surface(
        "surf_operations_board",
        "operations_control_room_operator",
        "rf_operations_board",
        "operations",
        "browser",
        "browser_web",
        "Operations board",
        [
            "Scan service health, choose the dominant anomaly, and preserve board context while deciding where to intervene.",
        ],
        [
            "No governance mutation here; only bounded operational actions within the current action fence.",
        ],
        [
            "Keep the same shell while filters, horizon, selected anomaly, and board tuple remain valid.",
        ],
        [
            "Read-only diagnostic, partial restore, stale selection freeze, or fallback lens restore without losing the last stable board.",
        ],
        [
            "Telemetry and queue health feeds",
            "Assurance evidence",
            "Release watch tuples",
        ],
        "Operations control-room posture.",
        "Board context must stay denser than ordinary staff shells but still obey one dominant anomaly and one dominant intervention surface.",
        [
            "OpsBoardStateSnapshot",
            "OpsSelectionLease",
            "OpsDeltaGate",
            "OpsBoardPosture",
        ],
        [
            "AudienceSurfaceRuntimeBinding",
            "WorkspaceTrustEnvelope(workspaceFamily = ops_intervention)",
        ],
        [
            "operations-console-frontend-blueprint.md",
        ],
        "baseline",
        [
            "operations-console-frontend-blueprint.md#Canonical route family",
            "operations-console-frontend-blueprint.md#Calm board posture and briefing artifacts",
        ],
    ),
    surface(
        "surf_operations_drilldown",
        "operations_control_room_operator",
        "rf_operations_drilldown",
        "operations",
        "browser",
        "browser_web",
        "Operations investigation and intervention drill-down",
        [
            "Inspect or issue bounded interventions, compare scenarios, and preserve board return context.",
        ],
        [
            "Issue interventions only while the current fence is live, or hand off to governance with an exact return token.",
        ],
        [
            "Return to the same board snapshot and selected anomaly after drill-down or governance handoff.",
        ],
        [
            "Blocked guardrail, read-only diagnostic, or fallback restore while keeping the last stable board visible.",
        ],
        [
            "Governance handoff",
            "Audit and assurance pivots",
        ],
        "Operations drill-down posture on the current board scope.",
        "Investigation, intervention, compare, and health drill-down remain same-shell children until a real governance handoff occurs.",
        [
            "OpsRouteIntent",
            "OpsActionEligibilityFence",
            "OpsGovernanceHandoff",
            "OpsRestoreReport",
        ],
        [
            "OpsDeltaGate",
            "AudienceSurfaceRuntimeBinding",
        ],
        [
            "operations-console-frontend-blueprint.md",
        ],
        "baseline",
        [
            "operations-console-frontend-blueprint.md#Canonical route family",
            "operations-console-frontend-blueprint.md#Restore reporting and board-frame discipline",
        ],
    ),
    surface(
        "surf_governance_shell",
        "governance_admin_lead",
        "rf_governance_shell",
        "governance",
        "browser",
        "browser_web",
        "Governance and Admin shell",
        [
            "Review, approve, promote, rollback, and govern access or configuration work inside one governance shell.",
        ],
        [
            "Approve, promote, rollback, govern access, update config, and manage communications under the current review package.",
        ],
        [
            "Keep one governance continuity frame across diff, impact, simulation, approval, promotion watch, and evidence pivots.",
        ],
        [
            "Freeze disposition, blocked guardrail, or read-only evidence pivot with the same governed object and scope token preserved.",
        ],
        [
            "Release watch tuples",
            "Approval evidence",
            "Config and comms publications",
        ],
        "Governance review posture.",
        "This is a distinct control surface, not an operations subpanel or raw CRUD console.",
        [
            "GovernanceContinuityFrame",
            "GovernanceScopeToken",
            "ChangeBaselineSnapshot",
            "GovernanceReviewPackage",
            "ApprovalStepper",
        ],
        [
            "AudienceSurfaceRuntimeBinding",
            "GovernanceFreezeDisposition",
            "ReleaseWatchTuple",
        ],
        [
            "governance-admin-console-frontend-blueprint.md",
            "platform-frontend-blueprint.md",
        ],
        "baseline",
        [
            "governance-admin-console-frontend-blueprint.md#Shell and route topology",
            "governance-admin-console-frontend-blueprint.md#Primary governance personas",
        ],
    ),
    surface(
        "surf_assistive_sidecar",
        "assistive_feature_consumer",
        "rf_staff_workspace_child",
        "staff",
        "browser",
        "browser_web",
        "Assistive companion sidecar inside the owning task",
        [
            "Inspect or use assistive suggestions without displacing the primary review or support task.",
        ],
        [
            "Visible summary, bounded insert, observe-only review, or feedback capture under the current assistive grant.",
        ],
        [
            "Remain inside the owning shell and selected anchor unless the corpus explicitly calls for standalone evaluation or replay tooling.",
        ],
        [
            "Shadow-only, quarantined, regenerate-required, or blocked posture while keeping the human-led task in place.",
        ],
        [
            "Model registry",
            "Runtime publication bundle",
            "Feedback capture",
        ],
        "Adjunct operator mode bound to the current owning shell.",
        "Assistive output inherits the owning shell visibility ceiling and trust envelope.",
        [
            "AssistiveInvocationGrant",
            "AssistiveSurfaceBinding",
            "AssistiveCapabilityTrustEnvelope",
            "WorkspaceTrustEnvelope",
        ],
        [
            "VisibilityProjectionPolicy",
            "AudienceSurfaceRuntimeBinding",
            "UITelemetryDisclosureFence",
        ],
        [
            "phase-8-the-assistive-layer.md",
            "staff-workspace-interface-architecture.md",
        ],
        "bounded_secondary",
        [
            "phase-8-the-assistive-layer.md#Control priorities",
            "staff-workspace-interface-architecture.md#Assistive companion presentation profile",
        ],
        notes="This row keeps assistive use explicit while preserving the bounded-sidecar rule.",
    ),
]

CONFLICTS = [
    conflict(
        "CONFLICT_004_001",
        "resolved_conflict",
        "/workspace/pharmacy/* looks like workspace routing but belongs to the pharmacy shell.",
        "ShellFamilyOwnershipContract(shellType = pharmacy) and RouteFamilyOwnershipClaim override the /workspace prefix.",
        "Prevents pharmacy validation, inventory, handoff, and assurance work from silently falling back to generic staff queue detail.",
        [
            "pharmacy-console-frontend-architecture.md#Mission frame",
            "platform-frontend-blueprint.md#Pharmacy Console specialization",
        ],
    ),
    conflict(
        "CONFLICT_004_002",
        "resolved_conflict",
        "/ops/support/* looks like operations routing but belongs to the support shell.",
        "Support gets its own ticket-centric shell with explicit replay, observe, and repair routes.",
        "Closes the scattered-support gap and stops support work from masquerading as control-room drill-down.",
        [
            "staff-operations-and-support-blueprint.md#Support route contract",
            "phase-0-the-foundation-protocol.md#6.5 Support and replay algorithm",
        ],
    ),
    conflict(
        "CONFLICT_004_003",
        "resolved_conflict",
        "/ops/governance/*, /ops/access/*, /ops/config/*, /ops/comms/*, and /ops/release/* sit under /ops but belong to the governance shell.",
        "Governance/admin is modeled as a distinct control surface, not an operations subpanel.",
        "Prevents policy, access, release, and communications work from inheriting operations board semantics.",
        [
            "governance-admin-console-frontend-blueprint.md#Shell and route topology",
            "platform-frontend-blueprint.md#Governance/Admin specialization",
        ],
    ),
    conflict(
        "CONFLICT_004_004",
        "resolved_conflict",
        "/ops/audit, /ops/assurance, /ops/incidents, and /ops/resilience are operations-owned routes that governance may open as read-only pivots.",
        "Operations retains ownership; governance gets bounded read-only pivots through return tokens rather than silent shell transfer.",
        "Stops audit and assurance pivots from taking ownership of an in-progress governance review package.",
        [
            "governance-admin-console-frontend-blueprint.md#Shell and route topology",
            "operations-console-frontend-blueprint.md#Canonical route family",
        ],
    ),
    conflict(
        "CONFLICT_004_005",
        "resolved_conflict",
        "Embedded NHS App posture can be mistaken for a separate shell or product.",
        "Embedded mode is a channel profile and deferred channel expansion over the patient shell, not a separate shell family.",
        "Keeps embedded delivery in inventory without reclassifying it as current baseline scope or a native app workflow.",
        [
            "patient-portal-experience-architecture-blueprint.md#Control priorities",
            "phase-0-the-foundation-protocol.md#1.1 PersistentShell",
        ],
    ),
    conflict(
        "CONFLICT_004_006",
        "resolved_conflict",
        "Telephony/IVR, secure-link continuation, and support-assisted capture can be mistaken for shell families.",
        "They are ingress channels into the same governed lineage, not standalone back-office shells.",
        "Preserves one SubmissionEnvelope/request lineage across channel transitions.",
        [
            "blueprint-init.md#2. Core product surfaces",
            "phase-0-the-foundation-protocol.md#0.2 Continuity key and shell law",
        ],
    ),
    conflict(
        "CONFLICT_004_007",
        "resolved_conflict",
        "Patient public, authenticated, and grant-scoped recovery were previously conflated into one patient actor.",
        "This inventory keeps patient_public, patient_authenticated, and patient_grant_scoped distinct, with secure-link recovery modeled as a derived audience posture.",
        "Avoids over-revealing data and over-authorizing patient actions during secure-link recovery.",
        [
            "patient-account-and-communications-blueprint.md#Patient audience coverage contract",
            "phase-0-the-foundation-protocol.md#12.1 Mandatory audience tiers",
        ],
    ),
    conflict(
        "CONFLICT_004_008",
        "resolved_conflict",
        "The word staff was overloaded across clinician, practice ops, hub, pharmacy, support, operations, and governance roles.",
        "This inventory splits those roles into explicit personas, tiers, and shell owners.",
        "Later auth, testing, and UI work can now target the correct persona and surface combination without rediscovering role boundaries.",
        [
            "blueprint-init.md#2. Core product surfaces",
            "staff-operations-and-support-blueprint.md#Staff audience coverage contract",
        ],
    ),
    conflict(
        "GAP_004_001",
        "bounded_gap",
        "The corpus names intake continuity rules but does not yet publish final browser route contracts for intake or secure-link entry.",
        "Derived route-family labels are used here and must be hardened by later endpoint mapping work.",
        "Later API and frontend route tasks must preserve the same ownership and continuity semantics when URLs are finalized.",
        [
            "blueprint-init.md#2. Core product surfaces",
            "phase-0-the-foundation-protocol.md#5.4 Claim, secure-link, and embedded access algorithm",
        ],
        status="open",
    ),
    conflict(
        "GAP_004_002",
        "bounded_gap",
        "Phase 0 allows standalone assistive evaluation, replay, monitoring, and release-control work but does not publish a concrete route family for it.",
        "A conditional assistive-control route family is recorded here as a derived inventory label only.",
        "Any later concrete routes must preserve the bounded-secondary rule for live care and support use.",
        [
            "phase-0-the-foundation-protocol.md#1.1 PersistentShell",
            "phase-8-the-assistive-layer.md#Control priorities",
        ],
        status="open",
    ),
]


def load_upstream_inputs() -> tuple[dict[str, Any], dict[str, Any], dict[str, Any]]:
    summary = load_json(SUMMARY_CONFLICT_PATH)
    scope = load_json(SCOPE_MATRIX_PATH)
    return (
        {
            "requirement_registry_rows": load_jsonl_count(REQUIREMENT_REGISTRY_PATH),
            "summary_conflicts": len(summary["rows"]),
            "product_scope_rows": len(scope["rows"]),
        },
        {row["concept_id"]: row for row in summary["rows"]},
        {row["capability_id"]: row for row in scope["rows"]},
    )


def build_surface_rows(
    personas_by_id: dict[str, dict[str, Any]],
    channels_by_id: dict[str, dict[str, Any]],
    routes_by_id: dict[str, dict[str, Any]],
) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    for item in SURFACES:
        persona_def = personas_by_id[item["persona_id"]]
        channel_def = channels_by_id[item["ingress_channel_id"]]
        route_def = routes_by_id[item["route_family_id"]]
        rows.append(
            {
                "surface_id": item["surface_id"],
                "persona_id": item["persona_id"],
                "persona": persona_def["persona"],
                "sub_persona": persona_def["sub_persona"],
                "audience_tier": persona_def["audience_tier"],
                "base_audience_tier": persona_def["base_audience_tier"],
                "purpose_of_use": persona_def["purpose_of_use"],
                "shell_type": item["shell_type"],
                "shell_ownership_mode": item["shell_ownership_mode"],
                "channel_profile": item["channel_profile"],
                "ingress_channel": channel_def["channel_name"],
                "ingress_channel_id": item["ingress_channel_id"],
                "route_family_id": item["route_family_id"],
                "route_family": route_def["route_family"],
                "surface_name": item["surface_name"],
                "owning_blueprints": join_list(item["owning_blueprints"]),
                "governing_objects": join_list(item["governing_objects"]),
                "control_plane_rules": join_list(item["control_plane_rules"]),
                "identity_posture": item["identity_posture"],
                "visibility_policy_posture": item["visibility_policy_posture"],
                "primary_jobs_to_be_done": join_list(item["primary_jobs_to_be_done"]),
                "allowed_mutations": join_list(item["allowed_mutations"]),
                "continuity_expectations": join_list(item["continuity_expectations"]),
                "degraded_recovery_states": join_list(item["degraded_recovery_states"]),
                "external_dependency_touchpoints": join_list(item["external_dependency_touchpoints"]),
                "scope_posture": item["scope_posture"],
                "notes": item["notes"],
                "source_refs": join_list(item["source_refs"]),
            }
        )
    return rows


def build_route_family_rows(
    personas_by_id: dict[str, dict[str, Any]],
    channels_by_id: dict[str, dict[str, Any]],
) -> list[dict[str, Any]]:
    grouped_surfaces: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for item in SURFACES:
        grouped_surfaces[item["route_family_id"]].append(item)

    rows: list[dict[str, Any]] = []
    for route_def in ROUTE_FAMILIES:
        group = grouped_surfaces.get(route_def["route_family_id"], [])
        audience_tiers = sorted({personas_by_id[item["persona_id"]]["audience_tier"] for item in group})
        persona_labels = sorted(
            {
                f"{personas_by_id[item['persona_id']]['persona']} - {personas_by_id[item['persona_id']]['sub_persona']}"
                for item in group
            }
        )
        channel_profiles = sorted({item["channel_profile"] for item in group})
        ingress_channels = sorted({channels_by_id[item["ingress_channel_id"]]["channel_name"] for item in group})
        if route_def["route_family_id"] == "rf_assistive_control_shell":
            audience_tiers = ["assistive_adjunct"]
            persona_labels = ["Staff - Assistive feature consumer"]
            channel_profiles = ["browser"]
            ingress_channels = ["Browser web"]

        rows.append(
            {
                "route_family_id": route_def["route_family_id"],
                "route_family": route_def["route_family"],
                "shell_type": route_def["shell_type"],
                "ownership_mode": route_def["ownership_mode"],
                "primary_surface_name": route_def["primary_surface_name"],
                "audience_tiers": join_list(audience_tiers),
                "primary_personas": join_list(persona_labels),
                "channel_profiles": join_list(channel_profiles),
                "ingress_channels": join_list(ingress_channels),
                "owning_blueprints": join_list(route_def["owning_blueprints"]),
                "governing_objects": join_list(route_def["governing_objects"]),
                "control_plane_rules": join_list(route_def["control_plane_rules"]),
                "identity_posture": route_def["identity_posture"],
                "visibility_policy_posture": route_def["visibility_policy_posture"],
                "allowed_mutations": join_list(route_def["allowed_mutations"]),
                "continuity_expectations": join_list(route_def["continuity_expectations"]),
                "degraded_recovery_states": join_list(route_def["degraded_recovery_states"]),
                "external_dependency_touchpoints": join_list(route_def["external_dependency_touchpoints"]),
                "scope_posture": route_def["scope_posture"],
                "explicit_route_contract": "yes" if route_def["explicit_route_contract"] else "derived",
                "notes": route_def["notes"],
                "source_refs": join_list(route_def["source_refs"]),
            }
        )
    return rows


def build_shell_map(summary_conflicts: dict[str, dict[str, Any]]) -> dict[str, Any]:
    route_ids_by_shell: dict[str, list[str]] = defaultdict(list)
    for route in ROUTE_FAMILIES:
        route_ids_by_shell[route["shell_type"]].append(route["route_family_id"])

    shell_notes = {
        "patient": {
            "continuity_contract": "PersistentShell(shellType = patient) plus PatientPortalNavigationLedger and PatientShellConsistencyProjection",
            "bounded_secondary_surfaces": [
                "Secure-link recovery",
                "Embedded channel parity",
            ],
            "cross_shell_pivots": [],
        },
        "staff": {
            "continuity_contract": "PersistentShell(shellType = staff) plus WorkspaceNavigationLedger and WorkspaceTrustEnvelope",
            "bounded_secondary_surfaces": [
                "Assistive companion sidecar",
                "Approvals and escalations as same-shell peers or side stages",
            ],
            "cross_shell_pivots": [
                "Downstream child domains contribute data and actions but do not take shell ownership from the workspace.",
            ],
        },
        "hub": {
            "continuity_contract": "PersistentShell(shellType = hub) plus HubCoordinationCase and selected case anchor",
            "bounded_secondary_surfaces": [
                "Alternatives, exceptions, and audit remain same-shell child work",
            ],
            "cross_shell_pivots": [
                "Booking, callback, and practice-ack domains contribute truth without taking shell ownership.",
            ],
        },
        "pharmacy": {
            "continuity_contract": "PersistentShell(shellType = pharmacy) plus PharmacyConsoleContinuityEvidenceProjection",
            "bounded_secondary_surfaces": [
                "Compare, inventory, handoff, and assurance child routes",
            ],
            "cross_shell_pivots": [
                "The /workspace prefix does not change shell ownership.",
            ],
        },
        "support": {
            "continuity_contract": "PersistentShell(shellType = support) plus SupportLineageBinding and SupportContinuityEvidenceProjection",
            "bounded_secondary_surfaces": [
                "Replay and observe child routes",
                "Support-assisted capture inside the ticket shell",
            ],
            "cross_shell_pivots": [
                "Support replay, identity, and access repair remain support-shell work rather than operations or governance drill-down.",
            ],
        },
        "operations": {
            "continuity_contract": "OperationsConsoleShell plus OpsBoardStateSnapshot, OpsSelectionLease, and OpsReturnToken",
            "bounded_secondary_surfaces": [
                "Investigation, compare, health, and intervention drill-down",
            ],
            "cross_shell_pivots": [
                "Governance handoff is explicit and reversible through OpsGovernanceHandoff and OpsReturnToken.",
                "/ops/audit, /ops/assurance, /ops/incidents, and /ops/resilience remain operations-owned even when governance opens read-only pivots.",
            ],
        },
        "governance": {
            "continuity_contract": "GovernanceContinuityFrame plus GovernanceScopeToken, ChangeBaselineSnapshot, and GovernanceReturnIntentToken",
            "bounded_secondary_surfaces": [
                "Read-only evidence pivots into operations audit, assurance, incidents, and resilience",
            ],
            "cross_shell_pivots": [
                "Read-only pivots may not take ownership of an in-progress governance route family.",
            ],
        },
        "assistive": {
            "continuity_contract": "Assistive shell is legal only for standalone evaluation, replay, monitoring, or release-control work",
            "bounded_secondary_surfaces": [
                "Live care and support use remains a bounded companion inside the owning shell",
            ],
            "cross_shell_pivots": [
                "Standalone assistive shell remains conditional until later work publishes concrete routes.",
            ],
        },
    }

    canonical_resolutions = []
    for concept_id in [
        "UI_SHELL_FAMILY_OWNERSHIP",
        "UI_CHANNEL_PROFILE_CONSTRAINTS",
        "OWNERSHIP_VISIBILITY_POLICY",
        "ASSURANCE_CONTINUITY_EVIDENCE",
    ]:
        row = summary_conflicts[concept_id]
        canonical_resolutions.append(
            {
                "concept_id": concept_id,
                "preferred_term": row["preferred_term"],
                "normalized_wording": row["canonical_winner"]["normalized_wording"],
            }
        )

    return {
        "map_id": "shell_ownership_map_v1",
        "canonical_resolutions": canonical_resolutions,
        "shells": [
            {
                "shell_type": shell_type,
                "continuity_contract": shell_notes[shell_type]["continuity_contract"],
                "route_family_ids": route_ids_by_shell[shell_type],
                "bounded_secondary_surfaces": shell_notes[shell_type]["bounded_secondary_surfaces"],
                "cross_shell_pivots": shell_notes[shell_type]["cross_shell_pivots"],
                "source_refs": [
                    "phase-0-the-foundation-protocol.md#1.1 PersistentShell",
                    "platform-frontend-blueprint.md#Shell and route-family ownership rules",
                ],
            }
            for shell_type in SHELL_TYPES
        ],
        "route_family_claims": [
            {
                "route_family_id": route["route_family_id"],
                "route_family": route["route_family"],
                "shell_type": route["shell_type"],
                "ownership_mode": route["ownership_mode"],
                "scope_posture": route["scope_posture"],
                "explicit_route_contract": route["explicit_route_contract"],
                "notes": route["notes"],
                "source_refs": route["source_refs"],
            }
            for route in ROUTE_FAMILIES
        ],
        "route_prefix_conflicts": CONFLICTS,
        "assumptions": ASSUMPTIONS,
        "risks": RISKS,
    }


def make_table(headers: list[str], rows: list[list[str]]) -> str:
    lines = [
        "| " + " | ".join(headers) + " |",
        "| " + " | ".join(["---"] * len(headers)) + " |",
    ]
    for row in rows:
        lines.append("| " + " | ".join(row) + " |")
    return "\n".join(lines)


def write_persona_doc(persona_payload: dict[str, Any], upstream_inputs: dict[str, Any]) -> None:
    rows = []
    for item in persona_payload["personas"]:
        rows.append(
            [
                escape_md(item["persona"]),
                escape_md(item["sub_persona"]),
                escape_md(item["audience_tier"]),
                md_join(item["primary_shell_types"]),
                md_join(item["primary_channel_ids"]),
                escape_md(item["scope_posture"]),
                escape_md(join_list(item["primary_jobs_to_be_done"])),
            ]
        )
    table = make_table(
        ["Persona", "Sub-persona", "Audience tier", "Shells", "Channels", "Posture", "Primary jobs"],
        rows,
    )
    PERSONA_DOC_PATH.write_text(
        "\n".join(
            [
                "# Persona Catalog",
                "",
                "## Summary",
                "",
                f"- Personas inventoried: {len(persona_payload['personas'])}",
                f"- Upstream requirement rows consumed: {upstream_inputs['requirement_registry_rows']}",
                f"- Upstream summary conflicts consumed: {upstream_inputs['summary_conflicts']}",
                "",
                "## Why This Exists",
                "",
                "This catalog separates persona, audience tier, shell, channel, and route ownership so later auth, frontend, and endpoint work can rely on one actor model instead of rediscovering it from prose.",
                "",
                "## Persona Matrix",
                "",
                table,
                "",
                "## High-signal Notes",
                "",
                "- Grant-scoped patient recovery is explicit and does not collapse into the ordinary signed-in portal persona.",
                "- Staff is deliberately split into clinician, practice ops, hub, pharmacy, support, operations, governance, and assistive-adjunct modes.",
                "- Assistive is tracked as a bounded adjunct for live care and support work; standalone assistive shell work stays conditional.",
                "",
                "## Assumptions",
                "",
                *[f"- {item['assumption_id']}: {item['statement']}" for item in ASSUMPTIONS],
            ]
        )
        + "\n"
    )


def write_channel_doc(channel_payload: dict[str, Any]) -> None:
    rows = []
    for item in channel_payload["channels"]:
        rows.append(
            [
                escape_md(item["channel_name"]),
                escape_md(item["channel_class"]),
                md_join(item["mapped_channel_profiles"] or ["n/a"]),
                md_join(item["shell_applicability"]),
                escape_md(item["scope_posture"]),
                escape_md(join_list(item["continuity_implications"])),
            ]
        )
    table = make_table(
        ["Channel", "Class", "Shell profile mapping", "Shell applicability", "Posture", "Continuity notes"],
        rows,
    )
    CHANNEL_DOC_PATH.write_text(
        "\n".join(
            [
                "# Channel Inventory",
                "",
                "## Summary",
                "",
                f"- Channels inventoried: {len(channel_payload['channels'])}",
                "- Browser, embedded, and constrained_browser remain shell postures; telephony, secure-link continuation, and support-assisted capture remain ingress channels.",
                "",
                "## Channel Matrix",
                "",
                table,
                "",
                "## Inventory Rules",
                "",
                "- Embedded delivery narrows shell posture but does not change shell ownership.",
                "- Telephony parity is explicit: phone/IVR is an ingress channel into the same intake lineage, not a separate back-office shell.",
                "- External delivery rails stay in inventory because delivery evidence affects continuity, visibility, and repair posture even when they are not interactive shell entries.",
            ]
        )
        + "\n"
    )


def write_audience_tier_doc() -> None:
    axis_rows = make_table(
        ["Axis", "Definition", "Why it matters", "Canonical source"],
        [
            [
                escape_md(item["axis"]),
                escape_md(item["definition"]),
                escape_md(item["why_it_matters"]),
                escape_md(item["canonical_source"]),
            ]
            for item in AXIS_DEFINITIONS
        ],
    )
    base_rows = make_table(
        ["Base tier", "Definition", "Source"],
        [
            [escape_md(item["tier"]), escape_md(item["definition"]), escape_md(item["source_ref"])]
            for item in BASE_AUDIENCE_TIERS
        ],
    )
    derived_rows = make_table(
        ["Derived surface tier", "Coverage basis", "Reason"],
        [
            [escape_md(item["tier"]), escape_md(item["coverage_basis"]), escape_md(item["reason"])]
            for item in DERIVED_AUDIENCE_TIERS
        ],
    )
    AUDIENCE_TIER_DOC_PATH.write_text(
        "\n".join(
            [
                "# Audience Tier Model",
                "",
                "## Axis Definitions",
                "",
                axis_rows,
                "",
                "## Phase 0 Base Audience Tiers",
                "",
                base_rows,
                "",
                "## Derived Surface Tiers Used By This Inventory",
                "",
                derived_rows,
                "",
                "## Resolution Notes",
                "",
                "- Grant-scoped patient recovery is a derived audience-surface tier over patient_public plus secure_link_recovery purpose of use; it is not a new shell family.",
                "- Operations and governance are treated as purpose-of-use-specific control-plane tiers so they do not consume ordinary practice or support payloads in richer shells.",
                "- Assistive_adjunct is not a visibility tier that widens data by itself; it inherits the owning shell's current audience coverage and trust envelope.",
            ]
        )
        + "\n"
    )


def write_surface_doc(surface_rows: list[dict[str, Any]]) -> None:
    rows = []
    for item in surface_rows:
        rows.append(
            [
                escape_md(f"{item['persona']} - {item['sub_persona']}"),
                escape_md(item["surface_name"]),
                escape_md(item["audience_tier"]),
                escape_md(item["shell_type"]),
                escape_md(item["channel_profile"]),
                escape_md(item["ingress_channel"]),
                escape_md(item["route_family"]),
                escape_md(item["scope_posture"]),
                escape_md(item["allowed_mutations"]),
            ]
        )
    table = make_table(
        [
            "Persona",
            "Surface",
            "Audience tier",
            "Shell",
            "Channel profile",
            "Ingress channel",
            "Route family",
            "Posture",
            "Allowed mutations",
        ],
        rows,
    )
    SURFACE_DOC_PATH.write_text(
        "\n".join(
            [
                "# Audience Surface Inventory",
                "",
                "## Summary",
                "",
                f"- Persona-surface rows: {len(surface_rows)}",
                f"- Route families represented: {len(ROUTE_FAMILIES)}",
                f"- Shell families represented: {len(SHELL_TYPES)}",
                "",
                "## Surface Matrix",
                "",
                table,
                "",
                "## Control Rules",
                "",
                "- Every row names one primary shell owner and one route family so shell residency cannot be inferred from URL prefix alone.",
                "- Every interactive row declares a channel profile and ingress channel separately so embedded, telephony, secure-link, and support-assisted capture stay orthogonal to shell ownership.",
                "- Every mutating row cites governing objects and control-plane rules so visible actionability remains subordinate to route intent, settlement truth, continuity evidence, and visibility policy.",
            ]
        )
        + "\n"
    )


def write_ownership_doc(route_rows: list[dict[str, Any]], shell_map: dict[str, Any]) -> None:
    shell_rows = []
    for shell in shell_map["shells"]:
        route_names = [
            next(route["route_family"] for route in route_rows if route["route_family_id"] == route_id)
            for route_id in shell["route_family_ids"]
        ]
        shell_rows.append(
            [
                escape_md(shell["shell_type"]),
                md_join(route_names),
                md_join(shell["bounded_secondary_surfaces"]),
                md_join(shell["cross_shell_pivots"]),
            ]
        )
    shell_table = make_table(
        ["Shell type", "Primary route families", "Bounded secondary surfaces", "Cross-shell pivots"],
        shell_rows,
    )

    route_table = make_table(
        ["Route family", "Shell", "Ownership mode", "Route contract", "Posture"],
        [
            [
                escape_md(route["route_family"]),
                escape_md(route["shell_type"]),
                escape_md(route["ownership_mode"]),
                escape_md(route["explicit_route_contract"]),
                escape_md(route["scope_posture"]),
            ]
            for route in route_rows
        ],
    )

    OWNERSHIP_DOC_PATH.write_text(
        "\n".join(
            [
                "# Shell And Route Family Ownership",
                "",
                "## Shell Ownership Matrix",
                "",
                shell_table,
                "",
                "## Route Family Claims",
                "",
                route_table,
                "",
                "## Canonical Reconciliation Inputs",
                "",
                *[
                    f"- {item['concept_id']}: {item['normalized_wording']}"
                    for item in shell_map["canonical_resolutions"]
                ],
            ]
        )
        + "\n"
    )


def write_conflict_doc() -> None:
    conflict_table = make_table(
        ["ID", "Class", "Subject", "Resolution", "Status"],
        [
            [
                escape_md(item["conflict_id"]),
                escape_md(item["classification"]),
                escape_md(item["subject"]),
                escape_md(item["resolution"]),
                escape_md(item["status"]),
            ]
            for item in CONFLICTS
        ],
    )
    CONFLICT_DOC_PATH.write_text(
        "\n".join(
            [
                "# Surface Conflict And Gap Report",
                "",
                "## Conflicts And Gaps",
                "",
                conflict_table,
                "",
                "## Assumptions",
                "",
                *[f"- {item['assumption_id']}: {item['statement']}" for item in ASSUMPTIONS],
                "",
                "## Risks",
                "",
                *[f"- {item['risk_id']}: {item['statement']}" for item in RISKS],
            ]
        )
        + "\n"
    )


def write_mermaid(shell_map: dict[str, Any]) -> None:
    lines = [
        "graph LR",
        '  patient["Patient shell"]',
        '  staff["Staff shell"]',
        '  hub["Hub shell"]',
        '  pharmacy["Pharmacy shell"]',
        '  support["Support shell"]',
        '  operations["Operations shell"]',
        '  governance["Governance shell"]',
        '  assistive["Assistive shell"]',
        '  patient_home["Home / Requests / Appointments / Health record / Messages"]',
        '  patient_entry["Intake / secure-link recovery (derived)"]',
        '  patient_embedded["Embedded patient channel (deferred)"]',
        '  workspace["/workspace and child review states"]',
        '  hub_routes["/hub/queue and case routes"]',
        '  pharmacy_routes["/workspace/pharmacy/*"]',
        '  support_routes["/ops/support/*"]',
        '  operations_routes["/ops/overview ... /resilience"]',
        '  operations_child["/ops/:opsLens/(investigations|interventions|compare|health)"]',
        '  governance_routes["/ops/governance/* /ops/access/* /ops/config/* /ops/comms/* /ops/release/*"]',
        '  assistive_routes["Assistive evaluation / replay / monitoring / release-control (derived)"]',
        '  patient --> patient_home',
        '  patient --> patient_entry',
        '  patient -. "channel expansion" .-> patient_embedded',
        '  staff --> workspace',
        '  hub --> hub_routes',
        '  pharmacy --> pharmacy_routes',
        '  support --> support_routes',
        '  operations --> operations_routes',
        '  operations --> operations_child',
        '  governance --> governance_routes',
        '  assistive --> assistive_routes',
        '  workspace -. "bounded assistive sidecar" .-> assistive',
        '  governance -. "read-only pivots" .-> operations_routes',
        '  operations -. "governance handoff" .-> governance_routes',
        '  support -. "support-assisted capture stays same lineage" .-> patient_entry',
    ]
    MERMAID_DOC_PATH.write_text("\n".join(lines) + "\n")


def build_persona_payload(upstream_inputs: dict[str, Any]) -> dict[str, Any]:
    return {
        "catalog_id": "persona_catalog_v1",
        "axes": AXIS_DEFINITIONS,
        "base_audience_tiers": BASE_AUDIENCE_TIERS,
        "derived_audience_tiers": DERIVED_AUDIENCE_TIERS,
        "upstream_inputs": upstream_inputs,
        "assumptions": ASSUMPTIONS,
        "risks": RISKS,
        "personas": PERSONAS,
    }


def build_channel_payload(upstream_inputs: dict[str, Any]) -> dict[str, Any]:
    return {
        "inventory_id": "channel_inventory_v1",
        "channel_profiles": CHANNEL_PROFILES,
        "upstream_inputs": upstream_inputs,
        "channels": CHANNELS,
    }


def ensure_directories() -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    DOCS_DIR.mkdir(parents=True, exist_ok=True)


def main() -> None:
    ensure_directories()
    upstream_inputs, summary_conflicts, _scope_rows = load_upstream_inputs()
    personas_by_id = {item["persona_id"]: item for item in PERSONAS}
    channels_by_id = {item["channel_id"]: item for item in CHANNELS}
    routes_by_id = {item["route_family_id"]: item for item in ROUTE_FAMILIES}

    persona_payload = build_persona_payload(upstream_inputs)
    channel_payload = build_channel_payload(upstream_inputs)
    surface_rows = build_surface_rows(personas_by_id, channels_by_id, routes_by_id)
    route_rows = build_route_family_rows(personas_by_id, channels_by_id)
    shell_map = build_shell_map(summary_conflicts)

    write_json(PERSONA_JSON_PATH, persona_payload)
    write_json(CHANNEL_JSON_PATH, channel_payload)
    write_json(SHELL_MAP_JSON_PATH, shell_map)

    write_csv(
        SURFACE_CSV_PATH,
        surface_rows,
        [
            "surface_id",
            "persona_id",
            "persona",
            "sub_persona",
            "audience_tier",
            "base_audience_tier",
            "purpose_of_use",
            "shell_type",
            "shell_ownership_mode",
            "channel_profile",
            "ingress_channel",
            "ingress_channel_id",
            "route_family_id",
            "route_family",
            "surface_name",
            "owning_blueprints",
            "governing_objects",
            "control_plane_rules",
            "identity_posture",
            "visibility_policy_posture",
            "primary_jobs_to_be_done",
            "allowed_mutations",
            "continuity_expectations",
            "degraded_recovery_states",
            "external_dependency_touchpoints",
            "scope_posture",
            "notes",
            "source_refs",
        ],
    )

    write_csv(
        ROUTE_FAMILY_CSV_PATH,
        route_rows,
        [
            "route_family_id",
            "route_family",
            "shell_type",
            "ownership_mode",
            "primary_surface_name",
            "audience_tiers",
            "primary_personas",
            "channel_profiles",
            "ingress_channels",
            "owning_blueprints",
            "governing_objects",
            "control_plane_rules",
            "identity_posture",
            "visibility_policy_posture",
            "allowed_mutations",
            "continuity_expectations",
            "degraded_recovery_states",
            "external_dependency_touchpoints",
            "scope_posture",
            "explicit_route_contract",
            "notes",
            "source_refs",
        ],
    )

    write_persona_doc(persona_payload, upstream_inputs)
    write_channel_doc(channel_payload)
    write_audience_tier_doc()
    write_surface_doc(surface_rows)
    write_ownership_doc(route_rows, shell_map)
    write_conflict_doc()
    write_mermaid(shell_map)


if __name__ == "__main__":
    main()
