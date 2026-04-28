#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[2]
DOCS_DIR = ROOT / "docs" / "assurance"
DATA_DIR = ROOT / "data" / "assurance"

TASK_ID = "par_125"
REVIEWED_AT = "2026-04-14"
TIMEZONE = "Europe/London"
STANDARDS_BASELINE_ID = "ASSURANCE_GOVERNANCE_BASELINE_2026_04_14"

CADENCE_DOC_PATH = DOCS_DIR / "125_clinical_risk_review_cadence.md"
SIGNOFF_DOC_PATH = DOCS_DIR / "125_clinical_signoff_matrix.md"
TRIGGERS_DOC_PATH = DOCS_DIR / "125_change_classification_and_assurance_triggers.md"
GRAPH_DOC_PATH = DOCS_DIR / "125_release_and_safety_approval_graph.md"
RULES_DOC_PATH = DOCS_DIR / "125_independent_review_and_no_self_approval_rules.md"

RACI_PATH = DATA_DIR / "clinical_risk_review_raci.csv"
TRIGGER_MATRIX_PATH = DATA_DIR / "clinical_change_trigger_matrix.csv"
STATE_MACHINE_PATH = DATA_DIR / "clinical_signoff_workflow_state_machine.json"
GATE_REQUIREMENTS_PATH = DATA_DIR / "clinical_signoff_gate_requirements.json"
CALENDAR_PATH = DATA_DIR / "clinical_review_calendar_seed.json"

ROLE_COLUMNS = [
    "product_owner",
    "engineering_lead",
    "clinical_safety_lead",
    "independent_safety_reviewer",
    "privacy_lead",
    "security_lead",
    "release_deployment_approver",
    "service_owner_operations_approver",
]

ROLE_COLUMN_TO_ID = {
    "product_owner": "ROLE_PRODUCT_OWNER",
    "engineering_lead": "ROLE_ENGINEERING_LEAD",
    "clinical_safety_lead": "ROLE_CLINICAL_SAFETY_LEAD",
    "independent_safety_reviewer": "ROLE_INDEPENDENT_SAFETY_REVIEWER",
    "privacy_lead": "ROLE_PRIVACY_LEAD",
    "security_lead": "ROLE_SECURITY_LEAD",
    "release_deployment_approver": "ROLE_RELEASE_DEPLOYMENT_APPROVER",
    "service_owner_operations_approver": "ROLE_SERVICE_OWNER_OPERATIONS_APPROVER",
}

ROLE_LABELS = {
    "ROLE_PRODUCT_OWNER": "Product owner (provisional named approver placeholder)",
    "ROLE_ENGINEERING_LEAD": "Engineering lead (provisional named approver placeholder)",
    "ROLE_CLINICAL_SAFETY_LEAD": "Clinical safety lead / CSO delegate (provisional placeholder)",
    "ROLE_INDEPENDENT_SAFETY_REVIEWER": "Independent safety reviewer (provisional placeholder)",
    "ROLE_PRIVACY_LEAD": "Privacy lead / DPIA owner (provisional placeholder)",
    "ROLE_SECURITY_LEAD": "Security lead (provisional placeholder)",
    "ROLE_RELEASE_DEPLOYMENT_APPROVER": "Release and deployment approver (provisional placeholder)",
    "ROLE_SERVICE_OWNER_OPERATIONS_APPROVER": "Service owner / operations approver (provisional placeholder)",
}

ROLE_CATALOG = [
    {
        "role_id": "ROLE_PRODUCT_OWNER",
        "label": ROLE_LABELS["ROLE_PRODUCT_OWNER"],
        "responsibility": "Owns product intent, harm trade-offs, and whether a change should enter the safety signoff path.",
        "independence_group": "product",
        "named_actor_status": "placeholder",
        "gap_refs": [],
    },
    {
        "role_id": "ROLE_ENGINEERING_LEAD",
        "label": ROLE_LABELS["ROLE_ENGINEERING_LEAD"],
        "responsibility": "Assembles the review package, evidence delta, implementation scope, and rollback posture for the change.",
        "independence_group": "engineering",
        "named_actor_status": "placeholder",
        "gap_refs": [],
    },
    {
        "role_id": "ROLE_CLINICAL_SAFETY_LEAD",
        "label": ROLE_LABELS["ROLE_CLINICAL_SAFETY_LEAD"],
        "responsibility": "Determines the clinical safety impact band, required hazard/safety-case delta, and whether release can proceed.",
        "independence_group": "clinical_safety",
        "named_actor_status": "placeholder",
        "gap_refs": ["GAP_ROLE_CAPACITY_CLINICAL_SAFETY_LEAD_NAMED_V1"],
    },
    {
        "role_id": "ROLE_INDEPENDENT_SAFETY_REVIEWER",
        "label": ROLE_LABELS["ROLE_INDEPENDENT_SAFETY_REVIEWER"],
        "responsibility": "Provides distinct independent safety challenge for high-impact or clinically material change classes.",
        "independence_group": "independent_safety",
        "named_actor_status": "placeholder",
        "gap_refs": ["GAP_ROLE_CAPACITY_INDEPENDENT_SAFETY_REVIEWER_NAMED_V1"],
    },
    {
        "role_id": "ROLE_PRIVACY_LEAD",
        "label": ROLE_LABELS["ROLE_PRIVACY_LEAD"],
        "responsibility": "Owns DPIA/privacy review for identity, session, communications, and assistive changes that move PHI risk.",
        "independence_group": "privacy",
        "named_actor_status": "placeholder",
        "gap_refs": ["GAP_ROLE_CAPACITY_PRIVACY_AND_SECURITY_ROSTER_V1"],
    },
    {
        "role_id": "ROLE_SECURITY_LEAD",
        "label": ROLE_LABELS["ROLE_SECURITY_LEAD"],
        "responsibility": "Owns security review for auth, session, release, supplier, and high-trust route changes.",
        "independence_group": "security",
        "named_actor_status": "placeholder",
        "gap_refs": ["GAP_ROLE_CAPACITY_PRIVACY_AND_SECURITY_ROSTER_V1"],
    },
    {
        "role_id": "ROLE_RELEASE_DEPLOYMENT_APPROVER",
        "label": ROLE_LABELS["ROLE_RELEASE_DEPLOYMENT_APPROVER"],
        "responsibility": "Approves release candidate progression only when freeze, runtime, publication, and trust evidence remain current.",
        "independence_group": "release",
        "named_actor_status": "placeholder",
        "gap_refs": ["GAP_ROLE_CAPACITY_RELEASE_APPROVER_ROSTER_V1"],
    },
    {
        "role_id": "ROLE_SERVICE_OWNER_OPERATIONS_APPROVER",
        "label": ROLE_LABELS["ROLE_SERVICE_OWNER_OPERATIONS_APPROVER"],
        "responsibility": "Owns service and operational readiness impacts, especially communications, booking, pharmacy, and supplier changes.",
        "independence_group": "operations",
        "named_actor_status": "placeholder",
        "gap_refs": [],
    },
]

GAP_CATALOG = [
    {
        "gap_id": "GAP_ROLE_CAPACITY_CLINICAL_SAFETY_LEAD_NAMED_V1",
        "gap_class": "role_capacity",
        "summary": "The clinical safety lead is modeled as a bounded placeholder until the first named roster is published in-repo.",
        "closure_target": "name the clinical safety lead in the live assurance roster before external onboarding or release candidate signoff",
    },
    {
        "gap_id": "GAP_ROLE_CAPACITY_INDEPENDENT_SAFETY_REVIEWER_NAMED_V1",
        "gap_class": "role_capacity",
        "summary": "Independent safety review is mandatory for high-impact classes, but the named reviewer roster is not yet fixed in-repo.",
        "closure_target": "bind at least one independent reviewer before any live or pre-production release candidate is promoted",
    },
    {
        "gap_id": "GAP_ROLE_CAPACITY_RELEASE_APPROVER_ROSTER_V1",
        "gap_class": "role_capacity",
        "summary": "The release and deployment approver remains a placeholder role in the seed model while the MVP team shape is still provisional.",
        "closure_target": "publish the named release approver roster alongside the first governance review package and release freeze",
    },
    {
        "gap_id": "GAP_ROLE_CAPACITY_PRIVACY_AND_SECURITY_ROSTER_V1",
        "gap_class": "role_capacity",
        "summary": "Privacy and security approvals are modeled explicitly now, but the named roster is still placeholder-only.",
        "closure_target": "replace placeholder privacy and security approvers before live onboarding or PHI-bearing release progression",
    },
    {
        "gap_id": "GAP_CHANGE_CLASS_DERIVATION_PATIENT_VISIBLE_TRUST_POSTURE_V1",
        "gap_class": "change_class_derivation",
        "summary": "The blueprint encodes stale writable and calm-truth hazards through runtime and posture invariants rather than a single governance phrase, so the signoff pack derives one explicit patient-visible trust/posture class from those rules.",
        "closure_target": "keep this change class stable unless the canonical runtime/publication law changes",
    },
    {
        "gap_id": "GAP_CHANGE_CLASS_DERIVATION_PURE_TECHNICAL_BOUNDARY_V1",
        "gap_class": "change_class_derivation",
        "summary": "Purely technical change with no clinical or user-safety effect is only legal when the change remains outside patient-visible, trust, identity, supplier, communications, booking, network, and pharmacy surfaces.",
        "closure_target": "replace the conservative boundary with narrower sub-classes only if later evidence proves they remain safety-neutral",
    },
    {
        "gap_id": "PREREQUISITE_GAP_123_IM1_SCAL_READINESS_PACK_PENDING",
        "gap_class": "prerequisite_dependency",
        "summary": "The IM1 and SCAL readiness companion pack from par_123 is not yet available, so identity changes with IM1 coupling remain explicitly blocked on that evidence.",
        "closure_target": "consume the par_123 outputs once published and replace blocked IM1/SCAL evidence placeholders with real references",
    },
    {
        "gap_id": "ASSUMPTION_REVIEW_CADENCE_SPRINT_FORTNIGHTLY_V1",
        "gap_class": "cadence_assumption",
        "summary": "The seed model assumes a fortnightly sprint review cadence because the live delivery heartbeat is not yet published in a named governance roster.",
        "closure_target": "replace this with the real engineering cadence once the operating calendar is formalised",
    },
    {
        "gap_id": "ASSUMPTION_REVIEW_CADENCE_MONTHLY_STANDING_FIRST_TUESDAY_V1",
        "gap_class": "cadence_assumption",
        "summary": "The standing clinical-risk review is seeded as first Tuesday monthly at 13:00 Europe/London to create a bounded default that can later be replaced without changing the review-event IDs.",
        "closure_target": "replace the placeholder slot with the actual governance meeting time",
    },
    {
        "gap_id": "ASSUMPTION_REVIEW_CADENCE_RELEASE_CANDIDATE_SAME_DAY_V1",
        "gap_class": "cadence_assumption",
        "summary": "Release candidate signoff is modeled as same-day gated review because release freezes, trust verdicts, and review packages must remain exact for the candidate under review.",
        "closure_target": "narrow the actual SLA if later operational rehearsal demands it",
    },
    {
        "gap_id": "ASSUMPTION_REVIEW_CADENCE_POST_INCIDENT_TWO_BUSINESS_DAYS_V1",
        "gap_class": "cadence_assumption",
        "summary": "Post-incident and near-miss review is seeded to occur within two business days to keep late hazard and control drift visible during MVP operations.",
        "closure_target": "replace with the formal incident review policy once named clinical operations governance exists",
    },
]

STANDARDS_VERSION = {
    "baseline_id": STANDARDS_BASELINE_ID,
    "reviewed_at": REVIEWED_AT,
    "source_note": "This seed pack records the governance baseline as of 2026-04-14 and keeps review-event IDs, cadence assumptions, and approval refs stable for later refinement.",
    "manufacturer_standard": "DCB0129",
    "deployer_companion_standard": "DCB0160",
    "privacy_programme_anchor": "DSPT",
    "identity_onboarding_anchor": "NHS Login / IM1 / SCAL",
}

EVIDENCE_CATALOG = [
    {
        "evidence_ref": "EVID_121_DCB0129_HAZARD_REGISTER",
        "path": "data/assurance/dcb0129_hazard_register.json",
        "state": "seeded_in_repo",
        "source_task": "par_121",
    },
    {
        "evidence_ref": "EVID_121_DCB0129_SAFETY_CASE_OUTLINE",
        "path": "data/assurance/dcb0129_safety_case_outline.json",
        "state": "seeded_in_repo",
        "source_task": "par_121",
    },
    {
        "evidence_ref": "EVID_121_DCB0129_REVIEW_EVENTS",
        "path": "data/assurance/dcb0129_review_events.json",
        "state": "seeded_in_repo",
        "source_task": "par_121",
    },
    {
        "evidence_ref": "EVID_122_DSPT_CONTROL_MATRIX",
        "path": "data/assurance/dspt_control_matrix.csv",
        "state": "seeded_in_repo",
        "source_task": "par_122",
    },
    {
        "evidence_ref": "EVID_122_DSPT_EVIDENCE_CATALOG",
        "path": "data/assurance/dspt_evidence_catalog.json",
        "state": "seeded_in_repo",
        "source_task": "par_122",
    },
    {
        "evidence_ref": "EVID_124_NHS_LOGIN_SCOPE_CLAIM_MATRIX",
        "path": "data/assurance/nhs_login_scope_claim_matrix.csv",
        "state": "seeded_in_repo",
        "source_task": "par_124",
    },
    {
        "evidence_ref": "EVID_124_NHS_LOGIN_GAP_REGISTER",
        "path": "data/assurance/nhs_login_gap_register.json",
        "state": "seeded_in_repo",
        "source_task": "par_124",
    },
    {
        "evidence_ref": "EVID_123_IM1_SCAL_COMPANION",
        "path": "docs/assurance/123_im1_scal_readiness_pack.md",
        "state": "blocked_on_parallel_task",
        "source_task": "par_123",
        "gap_ref": "PREREQUISITE_GAP_123_IM1_SCAL_READINESS_PACK_PENDING",
    },
    {
        "evidence_ref": "EVID_RELEASE_APPROVAL_FREEZE",
        "path": "data/analysis/release_publication_parity_records.json",
        "state": "seeded_in_repo",
        "source_task": "par_055",
    },
    {
        "evidence_ref": "EVID_RUNTIME_PUBLICATION_BUNDLE",
        "path": "data/analysis/runtime_publication_bundle_manifest.json",
        "state": "seeded_in_repo",
        "source_task": "par_094",
    },
    {
        "evidence_ref": "EVID_RELEASE_PUBLICATION_PARITY",
        "path": "data/analysis/release_publication_parity_records.json",
        "state": "seeded_in_repo",
        "source_task": "par_055",
    },
    {
        "evidence_ref": "EVID_ASSURANCE_SLICE_TRUST_RECORD",
        "path": "blueprint/phase-9-the-assurance-ledger.md",
        "state": "algorithm_defined",
        "source_task": "phase_9_blueprint",
    },
    {
        "evidence_ref": "EVID_GOVERNANCE_REVIEW_PACKAGE",
        "path": "blueprint/phase-0-the-foundation-protocol.md",
        "state": "algorithm_defined",
        "source_task": "phase_0_blueprint",
    },
    {
        "evidence_ref": "EVID_STANDARDS_DEPENDENCY_WATCHLIST",
        "path": "blueprint/phase-0-the-foundation-protocol.md",
        "state": "algorithm_defined",
        "source_task": "phase_0_blueprint",
    },
]

PREREQUISITE_SNAPSHOT = [
    {
        "prerequisite_id": "PREREQ_121_DCB0129_PACK",
        "path": "data/assurance/dcb0129_hazard_register.json",
        "status": "available",
        "source_task": "par_121",
    },
    {
        "prerequisite_id": "PREREQ_122_DSPT_PACK",
        "path": "data/assurance/dspt_control_matrix.csv",
        "status": "available",
        "source_task": "par_122",
    },
    {
        "prerequisite_id": "PREREQ_123_IM1_SCAL_COMPANION",
        "path": "docs/assurance/123_im1_scal_readiness_pack.md",
        "status": "blocked_on_parallel_task",
        "source_task": "par_123",
        "gap_ref": "PREREQUISITE_GAP_123_IM1_SCAL_READINESS_PACK_PENDING",
    },
    {
        "prerequisite_id": "PREREQ_124_NHS_LOGIN_PACK",
        "path": "data/assurance/nhs_login_gap_register.json",
        "status": "available",
        "source_task": "par_124",
    },
]

NO_SELF_APPROVAL_RULES = [
    {
        "rule_id": "NSA_125_MATERIAL_PROPOSER_CANNOT_APPROVE",
        "summary": "For material change classes, the proposer may not occupy any approving role in the same signoff path.",
        "applies_to_change_classes": "material_only",
        "forbidden_role_ids": [
            "ROLE_CLINICAL_SAFETY_LEAD",
            "ROLE_INDEPENDENT_SAFETY_REVIEWER",
            "ROLE_PRIVACY_LEAD",
            "ROLE_SECURITY_LEAD",
            "ROLE_RELEASE_DEPLOYMENT_APPROVER",
            "ROLE_SERVICE_OWNER_OPERATIONS_APPROVER",
        ],
    },
    {
        "rule_id": "NSA_125_CLINICAL_AND_INDEPENDENT_REVIEW_MUST_BE_DISTINCT",
        "summary": "The clinical safety lead and the independent safety reviewer must be different actors on the same change.",
        "applies_to_change_classes": "independent_review_required",
        "forbidden_role_pair": ["ROLE_CLINICAL_SAFETY_LEAD", "ROLE_INDEPENDENT_SAFETY_REVIEWER"],
    },
    {
        "rule_id": "NSA_125_RELEASE_APPROVER_CANNOT_SOLE_APPROVE_OWN_CHANGE",
        "summary": "The release approver may not be the only approving actor when they also proposed or implemented the change.",
        "applies_to_change_classes": "material_only",
        "forbidden_role_pair": ["ROLE_ENGINEERING_LEAD", "ROLE_RELEASE_DEPLOYMENT_APPROVER"],
    },
    {
        "rule_id": "NSA_125_PRIVACY_OR_SECURITY_APPROVER_MUST_REMAIN_DISTINCT_FOR_IDENTITY_OR_ASSISTIVE_CHANGES",
        "summary": "Identity, session, communications, and assistive changes that trigger privacy or security review must use a distinct privacy or security approver, not the proposer.",
        "applies_to_change_classes": [
            "cc_identity_session_authorization_behavior",
            "cc_communications_reachability_behavior",
            "cc_assistive_capability_change",
        ],
        "forbidden_role_ids": ["ROLE_PRIVACY_LEAD", "ROLE_SECURITY_LEAD"],
    },
]

REVIEW_EVENTS = [
    {
        "review_event_id": "REV_125_SPRINT_HAZARD_CONTROL_UPDATE",
        "label": "Sprint-level hazard and control update review",
        "event_kind": "recurring",
        "cadence_label": "fortnightly sprint close",
        "cadence_rule": "every 2 weeks / Friday / 14:00 Europe/London",
        "next_due_at": "2026-04-24T14:00:00+01:00",
        "assumption_ref": "ASSUMPTION_REVIEW_CADENCE_SPRINT_FORTNIGHTLY_V1",
        "required_role_ids": [
            "ROLE_ENGINEERING_LEAD",
            "ROLE_CLINICAL_SAFETY_LEAD",
            "ROLE_PRODUCT_OWNER",
        ],
        "independent_reviewer_required": False,
        "no_self_approval": True,
        "notes": "This keeps DCB0129 updates in-sprint rather than at phase end.",
    },
    {
        "review_event_id": "REV_125_PREMERGE_MATERIAL_CHANGE",
        "label": "Pre-merge safety-impact review",
        "event_kind": "event_driven",
        "cadence_label": "before merge for material change",
        "cadence_rule": "must complete before merge to trunk",
        "next_due_at": "event_driven",
        "required_role_ids": [
            "ROLE_ENGINEERING_LEAD",
            "ROLE_CLINICAL_SAFETY_LEAD",
            "ROLE_PRODUCT_OWNER",
        ],
        "independent_reviewer_required": False,
        "no_self_approval": True,
        "notes": "Material changes cannot merge while hazard, delta, or review package evidence is stale.",
    },
    {
        "review_event_id": "REV_125_RELEASE_CANDIDATE_SAFETY_SIGNOFF",
        "label": "Release-candidate safety signoff",
        "event_kind": "event_driven",
        "cadence_label": "same-day candidate gate",
        "cadence_rule": "same day as release candidate freeze activation",
        "next_due_at": "event_driven",
        "assumption_ref": "ASSUMPTION_REVIEW_CADENCE_RELEASE_CANDIDATE_SAME_DAY_V1",
        "required_role_ids": [
            "ROLE_RELEASE_DEPLOYMENT_APPROVER",
            "ROLE_CLINICAL_SAFETY_LEAD",
            "ROLE_ENGINEERING_LEAD",
        ],
        "independent_reviewer_required": True,
        "no_self_approval": True,
        "notes": "Candidate signoff must remain pinned to the exact review package, release freeze, runtime publication bundle, and trust evidence.",
    },
    {
        "review_event_id": "REV_125_POST_INCIDENT_NEAR_MISS",
        "label": "Post-incident or near-miss review",
        "event_kind": "event_driven",
        "cadence_label": "within two business days of incident classification",
        "cadence_rule": "within 2 business days",
        "next_due_at": "event_driven",
        "assumption_ref": "ASSUMPTION_REVIEW_CADENCE_POST_INCIDENT_TWO_BUSINESS_DAYS_V1",
        "required_role_ids": [
            "ROLE_CLINICAL_SAFETY_LEAD",
            "ROLE_SERVICE_OWNER_OPERATIONS_APPROVER",
            "ROLE_ENGINEERING_LEAD",
        ],
        "independent_reviewer_required": True,
        "no_self_approval": True,
        "notes": "Near misses reopen the hazard delta path even if release approval had already passed.",
    },
    {
        "review_event_id": "REV_125_STANDARDS_OR_ONBOARDING_DELTA",
        "label": "Standards-version or onboarding-trigger review",
        "event_kind": "event_driven",
        "cadence_label": "within three business days of standards or onboarding delta",
        "cadence_rule": "within 3 business days of official standards or onboarding delta",
        "next_due_at": "event_driven",
        "required_role_ids": [
            "ROLE_CLINICAL_SAFETY_LEAD",
            "ROLE_PRIVACY_LEAD",
            "ROLE_SECURITY_LEAD",
            "ROLE_PRODUCT_OWNER",
        ],
        "independent_reviewer_required": False,
        "no_self_approval": True,
        "notes": "This event captures DCB0129, DSPT, NHS Login, IM1, and SCAL delta reviews without requiring an ad hoc process document.",
    },
    {
        "review_event_id": "REV_125_MONTHLY_CLINICAL_RISK_STANDING",
        "label": "Monthly standing clinical-risk review",
        "event_kind": "recurring",
        "cadence_label": "first Tuesday monthly",
        "cadence_rule": "first Tuesday / month / 13:00 Europe/London",
        "next_due_at": "2026-05-05T13:00:00+01:00",
        "assumption_ref": "ASSUMPTION_REVIEW_CADENCE_MONTHLY_STANDING_FIRST_TUESDAY_V1",
        "required_role_ids": [
            "ROLE_PRODUCT_OWNER",
            "ROLE_ENGINEERING_LEAD",
            "ROLE_CLINICAL_SAFETY_LEAD",
            "ROLE_SERVICE_OWNER_OPERATIONS_APPROVER",
        ],
        "independent_reviewer_required": False,
        "no_self_approval": True,
        "notes": "This is the standing governance forum for open hazards, review debt, and unresolved gap closures.",
    },
    {
        "review_event_id": "REV_125_URGENT_OUT_OF_BAND_BLOCKER",
        "label": "Urgent out-of-band safety review",
        "event_kind": "event_driven",
        "cadence_label": "within one business day of blocker or hazard emergence",
        "cadence_rule": "within 1 business day",
        "next_due_at": "event_driven",
        "required_role_ids": [
            "ROLE_CLINICAL_SAFETY_LEAD",
            "ROLE_ENGINEERING_LEAD",
            "ROLE_SERVICE_OWNER_OPERATIONS_APPROVER",
        ],
        "independent_reviewer_required": True,
        "no_self_approval": True,
        "notes": "Used when blockers, stale authority, or new hazards emerge outside the normal sprint or release cycle.",
    },
]

RELEASE_GATE_REQUIREMENTS = [
    {
        "gate_id": "GATE_125_RELEASE_FREEZE_CURRENT",
        "required_ref": "REF_RELEASE_APPROVAL_FREEZE",
        "summary": "ReleaseApprovalFreeze must be active and exact for the candidate scope.",
    },
    {
        "gate_id": "GATE_125_RUNTIME_PUBLICATION_BUNDLE_CURRENT",
        "required_ref": "REF_RUNTIME_PUBLICATION_BUNDLE",
        "summary": "RuntimePublicationBundle must match the candidate under review.",
    },
    {
        "gate_id": "GATE_125_RELEASE_PUBLICATION_PARITY_EXACT",
        "required_ref": "REF_RELEASE_PUBLICATION_PARITY",
        "summary": "ReleasePublicationParityRecord must still report exact parity for the candidate package.",
    },
    {
        "gate_id": "GATE_125_ASSURANCE_SLICE_TRUST_COMPLETE",
        "required_ref": "REF_ASSURANCE_SLICE_TRUST_RECORD",
        "summary": "Required AssuranceSliceTrustRecord rows must remain trusted or bounded per the change class and route family.",
    },
    {
        "gate_id": "GATE_125_GOVERNANCE_REVIEW_PACKAGE_CURRENT",
        "required_ref": "REF_GOVERNANCE_REVIEW_PACKAGE",
        "summary": "GovernanceReviewPackage must remain current for the same scope, baseline, and compiled bundle.",
    },
    {
        "gate_id": "GATE_125_STANDARDS_WATCHLIST_CURRENT",
        "required_ref": "REF_STANDARDS_DEPENDENCY_WATCHLIST",
        "summary": "StandardsDependencyWatchlist must still be current for the reviewed candidate and not superseded by external change.",
    },
    {
        "gate_id": "GATE_125_CHANNEL_FREEZE_COMPATIBLE",
        "required_ref": "REF_CHANNEL_RELEASE_FREEZE_RECORD",
        "summary": "Any affected channel family must have a compatible ChannelReleaseFreezeRecord before mutable posture is exposed.",
    },
]


def blocker(evidence_or_authority: str, summary: str, required_refs: list[str]) -> dict[str, Any]:
    return {
        "blocker_id": evidence_or_authority,
        "summary": summary,
        "required_refs": required_refs,
    }


def change_class(
    change_class_id: str,
    change_example: str,
    safety_impact_band: str,
    required_review_events: list[str],
    required_roles: list[str],
    independent_reviewer_required: bool,
    required_evidence_refs: list[str],
    required_freeze_or_trust_refs: list[str],
    required_pack_or_delta_refs: list[str],
    approval_state_sequence: list[str],
    blocked_conditions: list[dict[str, Any]],
    notes: str,
    no_self_approval: bool = True,
) -> dict[str, Any]:
    return {
        "change_class": change_class_id,
        "change_example": change_example,
        "safety_impact_band": safety_impact_band,
        "required_review_events": required_review_events,
        "required_roles": required_roles,
        "independent_reviewer_required": independent_reviewer_required,
        "no_self_approval": no_self_approval,
        "required_evidence_refs": required_evidence_refs,
        "required_freeze_or_trust_refs": required_freeze_or_trust_refs,
        "required_pack_or_delta_refs": required_pack_or_delta_refs,
        "approval_state_sequence": approval_state_sequence,
        "blocked_conditions": blocked_conditions,
        "notes": notes,
    }


CHANGE_CLASSES = [
    change_class(
        "cc_safety_rule_or_triage_logic",
        "Red-flag threshold, triage ruleset, or safety preemption logic changes.",
        "critical",
        [
            "REV_125_SPRINT_HAZARD_CONTROL_UPDATE",
            "REV_125_PREMERGE_MATERIAL_CHANGE",
            "REV_125_RELEASE_CANDIDATE_SAFETY_SIGNOFF",
            "REV_125_MONTHLY_CLINICAL_RISK_STANDING",
        ],
        [
            "ROLE_PRODUCT_OWNER",
            "ROLE_ENGINEERING_LEAD",
            "ROLE_CLINICAL_SAFETY_LEAD",
            "ROLE_INDEPENDENT_SAFETY_REVIEWER",
            "ROLE_RELEASE_DEPLOYMENT_APPROVER",
        ],
        True,
        [
            "EVID_121_DCB0129_HAZARD_REGISTER",
            "EVID_121_DCB0129_SAFETY_CASE_OUTLINE",
            "EVID_121_DCB0129_REVIEW_EVENTS",
            "EVID_RELEASE_PUBLICATION_PARITY",
        ],
        [
            "REF_RELEASE_APPROVAL_FREEZE",
            "REF_RUNTIME_PUBLICATION_BUNDLE",
            "REF_RELEASE_PUBLICATION_PARITY",
            "REF_ASSURANCE_SLICE_TRUST_RECORD",
            "REF_GOVERNANCE_REVIEW_PACKAGE",
        ],
        [
            "PACK_121_DCB0129",
            "DELTA_HAZARD_LOG_UPDATE",
            "DELTA_SAFETY_CASE_UPDATE",
            "DELTA_RULESET_CHANGE_RECORD",
        ],
        [
            "submitted",
            "evidence_delta_required",
            "advisory_review_pending",
            "clinical_safety_review_pending",
            "independent_safety_review_pending",
            "release_approval_pending",
            "approved",
        ],
        [
            blocker(
                "missing_evidence:EVID_121_DCB0129_HAZARD_REGISTER",
                "The hazard log delta is missing for a safety ruleset change.",
                ["EVID_121_DCB0129_HAZARD_REGISTER", "DELTA_HAZARD_LOG_UPDATE"],
            ),
            blocker(
                "missing_evidence:EVID_121_DCB0129_SAFETY_CASE_OUTLINE",
                "The safety case delta is missing for a clinically material ruleset change.",
                ["EVID_121_DCB0129_SAFETY_CASE_OUTLINE", "DELTA_SAFETY_CASE_UPDATE"],
            ),
            blocker(
                "stale_authority:REF_RELEASE_APPROVAL_FREEZE",
                "ReleaseApprovalFreeze is stale or absent for the reviewed candidate.",
                ["REF_RELEASE_APPROVAL_FREEZE"],
            ),
            blocker(
                "stale_authority:REF_ASSURANCE_SLICE_TRUST_RECORD",
                "AssuranceSliceTrustRecord is degraded or missing for the affected safety slice.",
                ["REF_ASSURANCE_SLICE_TRUST_RECORD"],
            ),
            blocker(
                "forbidden_self_approval:NSA_125_MATERIAL_PROPOSER_CANNOT_APPROVE",
                "The proposer is attempting to approve their own material ruleset change.",
                ["NSA_125_MATERIAL_PROPOSER_CANNOT_APPROVE"],
            ),
        ],
        "This is the highest-risk class because it can change diversion, advice, and harm-preemption behavior directly.",
    ),
    change_class(
        "cc_identity_session_authorization_behavior",
        "Identity binding, callback-to-session seam, access grant, or authorization behavior changes.",
        "high",
        [
            "REV_125_PREMERGE_MATERIAL_CHANGE",
            "REV_125_STANDARDS_OR_ONBOARDING_DELTA",
            "REV_125_RELEASE_CANDIDATE_SAFETY_SIGNOFF",
            "REV_125_POST_INCIDENT_NEAR_MISS",
        ],
        [
            "ROLE_ENGINEERING_LEAD",
            "ROLE_CLINICAL_SAFETY_LEAD",
            "ROLE_INDEPENDENT_SAFETY_REVIEWER",
            "ROLE_PRIVACY_LEAD",
            "ROLE_SECURITY_LEAD",
            "ROLE_RELEASE_DEPLOYMENT_APPROVER",
        ],
        True,
        [
            "EVID_121_DCB0129_HAZARD_REGISTER",
            "EVID_122_DSPT_CONTROL_MATRIX",
            "EVID_124_NHS_LOGIN_SCOPE_CLAIM_MATRIX",
            "EVID_124_NHS_LOGIN_GAP_REGISTER",
        ],
        [
            "REF_RELEASE_APPROVAL_FREEZE",
            "REF_RUNTIME_PUBLICATION_BUNDLE",
            "REF_RELEASE_PUBLICATION_PARITY",
            "REF_ASSURANCE_SLICE_TRUST_RECORD",
            "REF_GOVERNANCE_REVIEW_PACKAGE",
            "REF_STANDARDS_DEPENDENCY_WATCHLIST",
        ],
        [
            "PACK_121_DCB0129",
            "PACK_122_DSPT",
            "PACK_124_NHS_LOGIN",
            "PACK_123_IM1_SCAL",
            "DELTA_SCOPE_CLAIM_REVIEW",
        ],
        [
            "submitted",
            "evidence_delta_required",
            "advisory_review_pending",
            "clinical_safety_review_pending",
            "independent_safety_review_pending",
            "privacy_security_review_pending",
            "release_approval_pending",
            "approved",
        ],
        [
            blocker(
                "missing_evidence:EVID_124_NHS_LOGIN_SCOPE_CLAIM_MATRIX",
                "Identity and session changes need a current NHS Login scope/claim rationale or equivalent local identity evidence.",
                ["EVID_124_NHS_LOGIN_SCOPE_CLAIM_MATRIX", "DELTA_SCOPE_CLAIM_REVIEW"],
            ),
            blocker(
                "missing_evidence:EVID_123_IM1_SCAL_COMPANION",
                "IM1-coupled identity changes remain blocked until the IM1/SCAL companion pack exists.",
                ["EVID_123_IM1_SCAL_COMPANION", "PACK_123_IM1_SCAL"],
            ),
            blocker(
                "stale_authority:REF_STANDARDS_DEPENDENCY_WATCHLIST",
                "The standards watchlist is stale for the current identity or onboarding delta.",
                ["REF_STANDARDS_DEPENDENCY_WATCHLIST"],
            ),
            blocker(
                "forbidden_self_approval:NSA_125_PRIVACY_OR_SECURITY_APPROVER_MUST_REMAIN_DISTINCT_FOR_IDENTITY_OR_ASSISTIVE_CHANGES",
                "Privacy or security approval cannot be self-approved on an identity change.",
                ["NSA_125_PRIVACY_OR_SECURITY_APPROVER_MUST_REMAIN_DISTINCT_FOR_IDENTITY_OR_ASSISTIVE_CHANGES"],
            ),
        ],
        "Identity and authorisation behavior can mis-bind the subject or reveal stale writable posture; it therefore requires privacy, security, and independent safety challenge.",
    ),
    change_class(
        "cc_patient_visible_status_trust_writable_posture",
        "Patient-visible status copy, trust indicators, writable posture, or same-shell continuity truth changes.",
        "high",
        [
            "REV_125_PREMERGE_MATERIAL_CHANGE",
            "REV_125_RELEASE_CANDIDATE_SAFETY_SIGNOFF",
            "REV_125_MONTHLY_CLINICAL_RISK_STANDING",
        ],
        [
            "ROLE_PRODUCT_OWNER",
            "ROLE_ENGINEERING_LEAD",
            "ROLE_CLINICAL_SAFETY_LEAD",
            "ROLE_INDEPENDENT_SAFETY_REVIEWER",
            "ROLE_RELEASE_DEPLOYMENT_APPROVER",
        ],
        True,
        [
            "EVID_121_DCB0129_HAZARD_REGISTER",
            "EVID_RELEASE_PUBLICATION_PARITY",
            "EVID_RUNTIME_PUBLICATION_BUNDLE",
        ],
        [
            "REF_RELEASE_APPROVAL_FREEZE",
            "REF_RUNTIME_PUBLICATION_BUNDLE",
            "REF_RELEASE_PUBLICATION_PARITY",
            "REF_ASSURANCE_SLICE_TRUST_RECORD",
            "REF_CHANNEL_RELEASE_FREEZE_RECORD",
        ],
        [
            "PACK_121_DCB0129",
            "DELTA_STATUS_POSTURE_COPY_REVIEW",
            "DELTA_RELEASE_REVIEW_PACKAGE",
        ],
        [
            "submitted",
            "evidence_delta_required",
            "advisory_review_pending",
            "clinical_safety_review_pending",
            "independent_safety_review_pending",
            "release_approval_pending",
            "approved",
        ],
        [
            blocker(
                "missing_evidence:EVID_RELEASE_PUBLICATION_PARITY",
                "Patient-visible calm or writable posture cannot change without release parity evidence.",
                ["EVID_RELEASE_PUBLICATION_PARITY", "DELTA_RELEASE_REVIEW_PACKAGE"],
            ),
            blocker(
                "stale_authority:REF_CHANNEL_RELEASE_FREEZE_RECORD",
                "The affected channel family no longer has a compatible channel freeze posture.",
                ["REF_CHANNEL_RELEASE_FREEZE_RECORD"],
            ),
            blocker(
                "stale_authority:REF_RUNTIME_PUBLICATION_BUNDLE",
                "RuntimePublicationBundle is stale for the route family carrying the new posture.",
                ["REF_RUNTIME_PUBLICATION_BUNDLE"],
            ),
            blocker(
                "forbidden_self_approval:NSA_125_MATERIAL_PROPOSER_CANNOT_APPROVE",
                "Material trust and writable-posture changes may not self-approve.",
                ["NSA_125_MATERIAL_PROPOSER_CANNOT_APPROVE"],
            ),
        ],
        "This class is explicitly derived from the stale-writable and calm-truth invariants in the foundation protocol and forensic findings.",
    ),
    change_class(
        "cc_booking_network_pharmacy_truth_semantics",
        "Booking confirmation, network ranking, pharmacy dispatch, or outcome truth-semantics changes.",
        "high",
        [
            "REV_125_SPRINT_HAZARD_CONTROL_UPDATE",
            "REV_125_PREMERGE_MATERIAL_CHANGE",
            "REV_125_RELEASE_CANDIDATE_SAFETY_SIGNOFF",
            "REV_125_POST_INCIDENT_NEAR_MISS",
        ],
        [
            "ROLE_ENGINEERING_LEAD",
            "ROLE_CLINICAL_SAFETY_LEAD",
            "ROLE_INDEPENDENT_SAFETY_REVIEWER",
            "ROLE_SERVICE_OWNER_OPERATIONS_APPROVER",
            "ROLE_RELEASE_DEPLOYMENT_APPROVER",
        ],
        True,
        [
            "EVID_121_DCB0129_HAZARD_REGISTER",
            "EVID_122_DSPT_CONTROL_MATRIX",
            "EVID_RELEASE_PUBLICATION_PARITY",
        ],
        [
            "REF_RELEASE_APPROVAL_FREEZE",
            "REF_RUNTIME_PUBLICATION_BUNDLE",
            "REF_RELEASE_PUBLICATION_PARITY",
            "REF_ASSURANCE_SLICE_TRUST_RECORD",
        ],
        [
            "PACK_121_DCB0129",
            "PACK_122_DSPT",
            "DELTA_BOOKING_NETWORK_PHARMACY_REVIEW",
        ],
        [
            "submitted",
            "evidence_delta_required",
            "advisory_review_pending",
            "clinical_safety_review_pending",
            "independent_safety_review_pending",
            "release_approval_pending",
            "approved",
        ],
        [
            blocker(
                "missing_evidence:EVID_121_DCB0129_HAZARD_REGISTER",
                "Booking, network, and pharmacy truth changes need hazard log delta evidence.",
                ["EVID_121_DCB0129_HAZARD_REGISTER", "DELTA_BOOKING_NETWORK_PHARMACY_REVIEW"],
            ),
            blocker(
                "stale_authority:REF_ASSURANCE_SLICE_TRUST_RECORD",
                "The assurance trust slice for booking/network/pharmacy is degraded beyond the allowed lower bound.",
                ["REF_ASSURANCE_SLICE_TRUST_RECORD"],
            ),
            blocker(
                "stale_authority:REF_RELEASE_PUBLICATION_PARITY",
                "Release publication parity no longer matches the candidate carrying the truth-semantics change.",
                ["REF_RELEASE_PUBLICATION_PARITY"],
            ),
        ],
        "This class covers changes that could misstate whether actionability, dispatch, or outcome truth is actually safe to show or execute.",
    ),
    change_class(
        "cc_release_runtime_publication_manifest",
        "Release, runtime, publication, manifest, or route-binding changes that can alter safety posture.",
        "high",
        [
            "REV_125_PREMERGE_MATERIAL_CHANGE",
            "REV_125_RELEASE_CANDIDATE_SAFETY_SIGNOFF",
            "REV_125_URGENT_OUT_OF_BAND_BLOCKER",
        ],
        [
            "ROLE_ENGINEERING_LEAD",
            "ROLE_CLINICAL_SAFETY_LEAD",
            "ROLE_INDEPENDENT_SAFETY_REVIEWER",
            "ROLE_SECURITY_LEAD",
            "ROLE_RELEASE_DEPLOYMENT_APPROVER",
        ],
        True,
        [
            "EVID_RELEASE_APPROVAL_FREEZE",
            "EVID_RUNTIME_PUBLICATION_BUNDLE",
            "EVID_RELEASE_PUBLICATION_PARITY",
            "EVID_121_DCB0129_HAZARD_REGISTER",
        ],
        [
            "REF_RELEASE_APPROVAL_FREEZE",
            "REF_RUNTIME_PUBLICATION_BUNDLE",
            "REF_RELEASE_PUBLICATION_PARITY",
            "REF_ASSURANCE_SLICE_TRUST_RECORD",
            "REF_GOVERNANCE_REVIEW_PACKAGE",
            "REF_STANDARDS_DEPENDENCY_WATCHLIST",
            "REF_CHANNEL_RELEASE_FREEZE_RECORD",
        ],
        [
            "DELTA_RELEASE_REVIEW_PACKAGE",
            "DELTA_RUNTIME_PUBLICATION_REVIEW",
            "DELTA_RELEASE_FREEZE_RENEWAL",
        ],
        [
            "submitted",
            "evidence_delta_required",
            "advisory_review_pending",
            "clinical_safety_review_pending",
            "independent_safety_review_pending",
            "privacy_security_review_pending",
            "release_approval_pending",
            "approved",
        ],
        [
            blocker(
                "missing_evidence:EVID_RUNTIME_PUBLICATION_BUNDLE",
                "RuntimePublicationBundle evidence is missing for the candidate under review.",
                ["EVID_RUNTIME_PUBLICATION_BUNDLE", "DELTA_RUNTIME_PUBLICATION_REVIEW"],
            ),
            blocker(
                "stale_authority:REF_GOVERNANCE_REVIEW_PACKAGE",
                "The governance review package has drifted and can no longer support signoff.",
                ["REF_GOVERNANCE_REVIEW_PACKAGE"],
            ),
            blocker(
                "stale_authority:REF_RELEASE_APPROVAL_FREEZE",
                "The release freeze is stale or superseded for the candidate scope.",
                ["REF_RELEASE_APPROVAL_FREEZE"],
            ),
            blocker(
                "stale_authority:REF_STANDARDS_DEPENDENCY_WATCHLIST",
                "The standards watchlist is stale for the reviewed candidate bundle.",
                ["REF_STANDARDS_DEPENDENCY_WATCHLIST"],
            ),
        ],
        "This class prevents route/runtime/publication drift from silently reopening stale mutable posture after approval.",
    ),
    change_class(
        "cc_external_adapter_or_supplier_behavior",
        "External adapter, supplier, transport, or provider behavior changes that could alter safety posture.",
        "high",
        [
            "REV_125_PREMERGE_MATERIAL_CHANGE",
            "REV_125_STANDARDS_OR_ONBOARDING_DELTA",
            "REV_125_RELEASE_CANDIDATE_SAFETY_SIGNOFF",
            "REV_125_MONTHLY_CLINICAL_RISK_STANDING",
        ],
        [
            "ROLE_ENGINEERING_LEAD",
            "ROLE_CLINICAL_SAFETY_LEAD",
            "ROLE_INDEPENDENT_SAFETY_REVIEWER",
            "ROLE_SECURITY_LEAD",
            "ROLE_SERVICE_OWNER_OPERATIONS_APPROVER",
            "ROLE_RELEASE_DEPLOYMENT_APPROVER",
        ],
        True,
        [
            "EVID_121_DCB0129_HAZARD_REGISTER",
            "EVID_122_DSPT_CONTROL_MATRIX",
            "EVID_124_NHS_LOGIN_GAP_REGISTER",
        ],
        [
            "REF_RELEASE_APPROVAL_FREEZE",
            "REF_RUNTIME_PUBLICATION_BUNDLE",
            "REF_ASSURANCE_SLICE_TRUST_RECORD",
            "REF_STANDARDS_DEPENDENCY_WATCHLIST",
        ],
        [
            "PACK_121_DCB0129",
            "PACK_122_DSPT",
            "PACK_124_NHS_LOGIN",
            "PACK_123_IM1_SCAL",
            "DELTA_SUPPLIER_BEHAVIOR_REVIEW",
        ],
        [
            "submitted",
            "evidence_delta_required",
            "advisory_review_pending",
            "clinical_safety_review_pending",
            "independent_safety_review_pending",
            "privacy_security_review_pending",
            "release_approval_pending",
            "approved",
        ],
        [
            blocker(
                "missing_evidence:EVID_122_DSPT_CONTROL_MATRIX",
                "Supplier or adapter changes need current DSPT and control-boundary evidence.",
                ["EVID_122_DSPT_CONTROL_MATRIX", "PACK_122_DSPT"],
            ),
            blocker(
                "missing_evidence:EVID_123_IM1_SCAL_COMPANION",
                "Any IM1-coupled supplier change remains blocked until the IM1/SCAL pack exists.",
                ["EVID_123_IM1_SCAL_COMPANION", "PACK_123_IM1_SCAL"],
            ),
            blocker(
                "stale_authority:REF_ASSURANCE_SLICE_TRUST_RECORD",
                "Supplier-facing trust evidence is stale or degraded beyond policy.",
                ["REF_ASSURANCE_SLICE_TRUST_RECORD"],
            ),
        ],
        "Supplier and adapter changes can move both safety and external onboarding posture, so the graph keeps NHS Login and IM1/SCAL deltas explicit.",
    ),
    change_class(
        "cc_communications_reachability_behavior",
        "Communications, callback, contact-route, or reachability behavior changes.",
        "medium",
        [
            "REV_125_PREMERGE_MATERIAL_CHANGE",
            "REV_125_POST_INCIDENT_NEAR_MISS",
            "REV_125_MONTHLY_CLINICAL_RISK_STANDING",
        ],
        [
            "ROLE_PRODUCT_OWNER",
            "ROLE_ENGINEERING_LEAD",
            "ROLE_CLINICAL_SAFETY_LEAD",
            "ROLE_PRIVACY_LEAD",
            "ROLE_SERVICE_OWNER_OPERATIONS_APPROVER",
        ],
        False,
        [
            "EVID_121_DCB0129_HAZARD_REGISTER",
            "EVID_122_DSPT_CONTROL_MATRIX",
        ],
        [
            "REF_RELEASE_APPROVAL_FREEZE",
            "REF_ASSURANCE_SLICE_TRUST_RECORD",
            "REF_RUNTIME_PUBLICATION_BUNDLE",
        ],
        [
            "PACK_121_DCB0129",
            "PACK_122_DSPT",
            "DELTA_COMMUNICATIONS_REVIEW",
        ],
        [
            "submitted",
            "evidence_delta_required",
            "advisory_review_pending",
            "clinical_safety_review_pending",
            "privacy_security_review_pending",
            "release_approval_pending",
            "approved",
        ],
        [
            blocker(
                "missing_evidence:EVID_121_DCB0129_HAZARD_REGISTER",
                "Reachability behavior changes need a hazard delta or explicit non-applicability record.",
                ["EVID_121_DCB0129_HAZARD_REGISTER", "DELTA_COMMUNICATIONS_REVIEW"],
            ),
            blocker(
                "stale_authority:REF_ASSURANCE_SLICE_TRUST_RECORD",
                "Reachability trust evidence is stale for the slice carrying the new communication behavior.",
                ["REF_ASSURANCE_SLICE_TRUST_RECORD"],
            ),
        ],
        "Communications changes are not allowed to drift into a purely cosmetic class because callback failure can still become a safety problem.",
    ),
    change_class(
        "cc_assistive_capability_change",
        "Assistive capability, visible-slice, or human-approval policy changes.",
        "high",
        [
            "REV_125_PREMERGE_MATERIAL_CHANGE",
            "REV_125_RELEASE_CANDIDATE_SAFETY_SIGNOFF",
            "REV_125_STANDARDS_OR_ONBOARDING_DELTA",
        ],
        [
            "ROLE_PRODUCT_OWNER",
            "ROLE_ENGINEERING_LEAD",
            "ROLE_CLINICAL_SAFETY_LEAD",
            "ROLE_INDEPENDENT_SAFETY_REVIEWER",
            "ROLE_PRIVACY_LEAD",
            "ROLE_SECURITY_LEAD",
            "ROLE_RELEASE_DEPLOYMENT_APPROVER",
        ],
        True,
        [
            "EVID_121_DCB0129_HAZARD_REGISTER",
            "EVID_RELEASE_PUBLICATION_PARITY",
            "EVID_122_DSPT_CONTROL_MATRIX",
        ],
        [
            "REF_RELEASE_APPROVAL_FREEZE",
            "REF_RUNTIME_PUBLICATION_BUNDLE",
            "REF_RELEASE_PUBLICATION_PARITY",
            "REF_ASSURANCE_SLICE_TRUST_RECORD",
            "REF_GOVERNANCE_REVIEW_PACKAGE",
        ],
        [
            "PACK_121_DCB0129",
            "PACK_122_DSPT",
            "DELTA_ASSISTIVE_APPROVAL_GRAPH_REVIEW",
        ],
        [
            "submitted",
            "evidence_delta_required",
            "advisory_review_pending",
            "clinical_safety_review_pending",
            "independent_safety_review_pending",
            "privacy_security_review_pending",
            "release_approval_pending",
            "approved",
        ],
        [
            blocker(
                "missing_evidence:EVID_121_DCB0129_HAZARD_REGISTER",
                "Assistive changes need an explicit hazard delta because the blueprint treats independent safety signoff as non-negotiable.",
                ["EVID_121_DCB0129_HAZARD_REGISTER", "DELTA_ASSISTIVE_APPROVAL_GRAPH_REVIEW"],
            ),
            blocker(
                "forbidden_self_approval:NSA_125_CLINICAL_AND_INDEPENDENT_REVIEW_MUST_BE_DISTINCT",
                "Assistive change approval cannot collapse clinical and independent safety review into one actor.",
                ["NSA_125_CLINICAL_AND_INDEPENDENT_REVIEW_MUST_BE_DISTINCT"],
            ),
            blocker(
                "stale_authority:REF_GOVERNANCE_REVIEW_PACKAGE",
                "Assistive approval policy changes must stay bound to one exact governance review package.",
                ["REF_GOVERNANCE_REVIEW_PACKAGE"],
            ),
        ],
        "Phase 8 explicitly requires no-self-approval and independent safety signoff for assistive releases.",
    ),
    change_class(
        "cc_content_only_non_clinical",
        "Copy-only change with no clinical meaning, no trust implication, and no writable-posture effect.",
        "low",
        [
            "REV_125_PREMERGE_MATERIAL_CHANGE",
            "REV_125_MONTHLY_CLINICAL_RISK_STANDING",
        ],
        [
            "ROLE_PRODUCT_OWNER",
            "ROLE_ENGINEERING_LEAD",
        ],
        False,
        [],
        [],
        ["DELTA_NON_APPLICABILITY_RECORD"],
        [
            "submitted",
            "advisory_review_pending",
            "release_approval_pending",
            "approved",
        ],
        [
            blocker(
                "missing_evidence:DELTA_NON_APPLICABILITY_RECORD",
                "A content-only claim must still carry a non-applicability record explaining why no clinical signoff path is needed.",
                ["DELTA_NON_APPLICABILITY_RECORD"],
            ),
        ],
        "This class stays explicitly narrow so it cannot swallow trust, identity, or patient-facing status changes by accident.",
        no_self_approval=False,
    ),
    change_class(
        "cc_purely_technical_no_clinical_effect",
        "Infrastructure or refactor-only change with no patient-visible, trust, identity, supplier, or clinical effect.",
        "low",
        [
            "REV_125_PREMERGE_MATERIAL_CHANGE",
            "REV_125_MONTHLY_CLINICAL_RISK_STANDING",
        ],
        [
            "ROLE_ENGINEERING_LEAD",
            "ROLE_RELEASE_DEPLOYMENT_APPROVER",
        ],
        False,
        [],
        [
            "REF_RELEASE_APPROVAL_FREEZE",
        ],
        ["DELTA_NON_APPLICABILITY_RECORD"],
        [
            "submitted",
            "advisory_review_pending",
            "release_approval_pending",
            "approved",
        ],
        [
            blocker(
                "missing_evidence:DELTA_NON_APPLICABILITY_RECORD",
                "A purely technical classification still requires a conservative non-applicability record.",
                ["DELTA_NON_APPLICABILITY_RECORD"],
            ),
            blocker(
                "stale_authority:REF_RELEASE_APPROVAL_FREEZE",
                "Even technical changes cannot reuse a stale release freeze.",
                ["REF_RELEASE_APPROVAL_FREEZE"],
            ),
        ],
        "This is the conservative technical-only class derived under GAP_CHANGE_CLASS_DERIVATION_PURE_TECHNICAL_BOUNDARY_V1.",
        no_self_approval=False,
    ),
]

RACI_MATRIX = [
    {
        "review_event_id": "REV_125_SPRINT_HAZARD_CONTROL_UPDATE",
        "review_event_label": "Sprint-level hazard and control update review",
        "cadence": "fortnightly sprint close",
        "product_owner": "C",
        "engineering_lead": "R",
        "clinical_safety_lead": "A",
        "independent_safety_reviewer": "C",
        "privacy_lead": "I",
        "security_lead": "I",
        "release_deployment_approver": "I",
        "service_owner_operations_approver": "C",
        "independent_review_required": "conditional",
        "no_self_approval": "true",
        "notes": "Clinical safety lead owns whether the sprint delta remains advisory or becomes material.",
    },
    {
        "review_event_id": "REV_125_PREMERGE_MATERIAL_CHANGE",
        "review_event_label": "Pre-merge safety-impact review",
        "cadence": "before merge",
        "product_owner": "C",
        "engineering_lead": "R",
        "clinical_safety_lead": "A",
        "independent_safety_reviewer": "C",
        "privacy_lead": "C",
        "security_lead": "C",
        "release_deployment_approver": "I",
        "service_owner_operations_approver": "C",
        "independent_review_required": "conditional",
        "no_self_approval": "true",
        "notes": "Material changes cannot merge without the required evidence, and approvers must stay distinct from the proposer.",
    },
    {
        "review_event_id": "REV_125_RELEASE_CANDIDATE_SAFETY_SIGNOFF",
        "review_event_label": "Release-candidate safety signoff",
        "cadence": "same-day candidate gate",
        "product_owner": "C",
        "engineering_lead": "R",
        "clinical_safety_lead": "R",
        "independent_safety_reviewer": "C",
        "privacy_lead": "C",
        "security_lead": "C",
        "release_deployment_approver": "A",
        "service_owner_operations_approver": "I",
        "independent_review_required": "true",
        "no_self_approval": "true",
        "notes": "Release approval stays blocked until freeze, runtime, publication, and trust evidence remain exact for the candidate.",
    },
    {
        "review_event_id": "REV_125_POST_INCIDENT_NEAR_MISS",
        "review_event_label": "Post-incident or near-miss review",
        "cadence": "within two business days",
        "product_owner": "I",
        "engineering_lead": "R",
        "clinical_safety_lead": "A",
        "independent_safety_reviewer": "C",
        "privacy_lead": "C",
        "security_lead": "C",
        "release_deployment_approver": "I",
        "service_owner_operations_approver": "R",
        "independent_review_required": "true",
        "no_self_approval": "true",
        "notes": "Operational ownership and clinical safety share the review, but independence remains required for high-impact follow-up.",
    },
    {
        "review_event_id": "REV_125_STANDARDS_OR_ONBOARDING_DELTA",
        "review_event_label": "Standards-version or onboarding-trigger review",
        "cadence": "within three business days of delta",
        "product_owner": "C",
        "engineering_lead": "R",
        "clinical_safety_lead": "A",
        "independent_safety_reviewer": "I",
        "privacy_lead": "R",
        "security_lead": "R",
        "release_deployment_approver": "I",
        "service_owner_operations_approver": "C",
        "independent_review_required": "conditional",
        "no_self_approval": "true",
        "notes": "This review keeps standards drift and onboarding deltas machine-visible instead of ad hoc.",
    },
    {
        "review_event_id": "REV_125_MONTHLY_CLINICAL_RISK_STANDING",
        "review_event_label": "Monthly standing clinical-risk review",
        "cadence": "first Tuesday monthly",
        "product_owner": "A",
        "engineering_lead": "R",
        "clinical_safety_lead": "R",
        "independent_safety_reviewer": "C",
        "privacy_lead": "C",
        "security_lead": "C",
        "release_deployment_approver": "I",
        "service_owner_operations_approver": "R",
        "independent_review_required": "false",
        "no_self_approval": "true",
        "notes": "This standing forum owns open gaps, recurring risk review, and closure dates for unresolved blockers.",
    },
    {
        "review_event_id": "REV_125_URGENT_OUT_OF_BAND_BLOCKER",
        "review_event_label": "Urgent out-of-band safety review",
        "cadence": "within one business day",
        "product_owner": "I",
        "engineering_lead": "R",
        "clinical_safety_lead": "A",
        "independent_safety_reviewer": "C",
        "privacy_lead": "I",
        "security_lead": "C",
        "release_deployment_approver": "I",
        "service_owner_operations_approver": "R",
        "independent_review_required": "true",
        "no_self_approval": "true",
        "notes": "Used when blockers, hazards, or stale authority emerge outside normal cadence.",
    },
]

WORKFLOW_STATE_MACHINE = {
    "task_id": TASK_ID,
    "reviewed_at": REVIEWED_AT,
    "standards_version": STANDARDS_VERSION,
    "states": [
        {
            "state_id": "submitted",
            "label": "Submitted",
            "terminal": False,
            "summary": "A change package exists but has not yet been classified.",
        },
        {
            "state_id": "evidence_delta_required",
            "label": "Evidence delta required",
            "terminal": False,
            "summary": "Required hazard, safety, privacy, onboarding, or release delta evidence is still being assembled.",
        },
        {
            "state_id": "advisory_review_pending",
            "label": "Advisory review pending",
            "terminal": False,
            "summary": "The change is awaiting product and engineering advisory review and classification confirmation.",
        },
        {
            "state_id": "clinical_safety_review_pending",
            "label": "Clinical safety review pending",
            "terminal": False,
            "summary": "Clinical safety lead review is required before the change can advance.",
        },
        {
            "state_id": "independent_safety_review_pending",
            "label": "Independent safety review pending",
            "terminal": False,
            "summary": "A distinct independent safety reviewer must challenge the package.",
        },
        {
            "state_id": "privacy_security_review_pending",
            "label": "Privacy or security review pending",
            "terminal": False,
            "summary": "Privacy and/or security review is required for the change class.",
        },
        {
            "state_id": "release_approval_pending",
            "label": "Release approval pending",
            "terminal": False,
            "summary": "The release approver is validating freeze, publication, parity, and trust evidence.",
        },
        {
            "state_id": "approved",
            "label": "Approved",
            "terminal": True,
            "summary": "The required approvals and evidence gates are satisfied for this change class.",
        },
        {
            "state_id": "blocked",
            "label": "Blocked",
            "terminal": True,
            "summary": "The change is blocked by missing evidence, stale authority, or no-self-approval violations.",
        },
        {
            "state_id": "superseded",
            "label": "Superseded",
            "terminal": True,
            "summary": "The review package, freeze, or standards watchlist drifted and the current signoff attempt is no longer valid.",
        },
    ],
    "transitions": [
        {"from": "submitted", "to": "evidence_delta_required", "when": "required evidence or delta pack is missing"},
        {"from": "submitted", "to": "advisory_review_pending", "when": "change is classified and no evidence delta is missing"},
        {"from": "evidence_delta_required", "to": "advisory_review_pending", "when": "required evidence refs and delta pack refs are present"},
        {"from": "advisory_review_pending", "to": "clinical_safety_review_pending", "when": "change class requires clinical safety review"},
        {"from": "advisory_review_pending", "to": "release_approval_pending", "when": "change class is low impact and does not require safety or privacy review"},
        {"from": "clinical_safety_review_pending", "to": "independent_safety_review_pending", "when": "independent_reviewer_required = true"},
        {"from": "clinical_safety_review_pending", "to": "privacy_security_review_pending", "when": "privacy or security review is required and independent review is not"},
        {"from": "clinical_safety_review_pending", "to": "release_approval_pending", "when": "clinical safety review passes and no more review lanes are required"},
        {"from": "independent_safety_review_pending", "to": "privacy_security_review_pending", "when": "privacy or security review is also required"},
        {"from": "independent_safety_review_pending", "to": "release_approval_pending", "when": "independent review passes and no privacy/security review is required"},
        {"from": "privacy_security_review_pending", "to": "release_approval_pending", "when": "required privacy and security reviewers approve"},
        {"from": "release_approval_pending", "to": "approved", "when": "release gates, freeze refs, runtime bundle, parity, and trust refs remain current"},
        {"from": "submitted", "to": "blocked", "when": "no-self-approval or hard blocker already fails"},
        {"from": "evidence_delta_required", "to": "blocked", "when": "deadline or blocker policy forces hard stop"},
        {"from": "advisory_review_pending", "to": "blocked", "when": "missing evidence, stale authority, or forbidden self-approval is detected"},
        {"from": "clinical_safety_review_pending", "to": "blocked", "when": "required hazard, safety-case, or trust evidence is missing or stale"},
        {"from": "independent_safety_review_pending", "to": "blocked", "when": "independent review is missing or actor separation fails"},
        {"from": "privacy_security_review_pending", "to": "blocked", "when": "privacy or security gate evidence is missing or reviewer separation fails"},
        {"from": "release_approval_pending", "to": "blocked", "when": "release gate requirements are stale or incomplete"},
        {"from": "advisory_review_pending", "to": "superseded", "when": "review package, scope, or standards watchlist drifts"},
        {"from": "clinical_safety_review_pending", "to": "superseded", "when": "review package, release freeze, or candidate hash drifts"},
        {"from": "independent_safety_review_pending", "to": "superseded", "when": "release freeze or review package no longer matches the current scope"},
        {"from": "privacy_security_review_pending", "to": "superseded", "when": "review package or onboarding basis drifts"},
        {"from": "release_approval_pending", "to": "superseded", "when": "freeze, parity, watchlist, or runtime bundle drifts"},
    ],
    "approval_graph": {
        "nodes": [
            {"node_id": "n_proposal", "label": "Proposal intake", "role_ids": ["ROLE_PRODUCT_OWNER", "ROLE_ENGINEERING_LEAD"]},
            {"node_id": "n_advisory", "label": "Advisory review", "role_ids": ["ROLE_PRODUCT_OWNER", "ROLE_ENGINEERING_LEAD"]},
            {"node_id": "n_clinical", "label": "Clinical safety review", "role_ids": ["ROLE_CLINICAL_SAFETY_LEAD"]},
            {"node_id": "n_independent", "label": "Independent safety review", "role_ids": ["ROLE_INDEPENDENT_SAFETY_REVIEWER"]},
            {"node_id": "n_privacy_security", "label": "Privacy or security review", "role_ids": ["ROLE_PRIVACY_LEAD", "ROLE_SECURITY_LEAD"]},
            {"node_id": "n_release", "label": "Release and deployment approval", "role_ids": ["ROLE_RELEASE_DEPLOYMENT_APPROVER", "ROLE_SERVICE_OWNER_OPERATIONS_APPROVER"]},
            {"node_id": "n_approved", "label": "Approved", "role_ids": []},
            {"node_id": "n_blocked", "label": "Blocked", "role_ids": []},
        ],
        "edges": [
            {"from": "n_proposal", "to": "n_advisory"},
            {"from": "n_advisory", "to": "n_clinical"},
            {"from": "n_clinical", "to": "n_independent"},
            {"from": "n_clinical", "to": "n_privacy_security"},
            {"from": "n_independent", "to": "n_privacy_security"},
            {"from": "n_independent", "to": "n_release"},
            {"from": "n_privacy_security", "to": "n_release"},
            {"from": "n_release", "to": "n_approved"},
            {"from": "n_advisory", "to": "n_blocked"},
            {"from": "n_clinical", "to": "n_blocked"},
            {"from": "n_independent", "to": "n_blocked"},
            {"from": "n_privacy_security", "to": "n_blocked"},
            {"from": "n_release", "to": "n_blocked"},
        ],
    },
    "actor_separation_rules": NO_SELF_APPROVAL_RULES,
    "release_gate_requirement_ids": [gate["gate_id"] for gate in RELEASE_GATE_REQUIREMENTS],
}

CALENDAR_SEED = {
    "task_id": TASK_ID,
    "reviewed_at": REVIEWED_AT,
    "timezone": TIMEZONE,
    "recurring_reviews": [
        {
            "calendar_entry_id": "CAL_125_SPRINT_HAZARD_CONTROL_UPDATE",
            "review_event_id": "REV_125_SPRINT_HAZARD_CONTROL_UPDATE",
            "cadence_kind": "fortnightly",
            "cadence_rule": "Friday every 2 weeks at 14:00 Europe/London",
            "next_due_at": "2026-04-24T14:00:00+01:00",
            "owner_role_id": "ROLE_ENGINEERING_LEAD",
            "chair_role_id": "ROLE_CLINICAL_SAFETY_LEAD",
            "assumption_ref": "ASSUMPTION_REVIEW_CADENCE_SPRINT_FORTNIGHTLY_V1",
            "required_outputs": ["DELTA_HAZARD_LOG_UPDATE", "DELTA_SAFETY_CASE_UPDATE"],
        },
        {
            "calendar_entry_id": "CAL_125_MONTHLY_CLINICAL_RISK_STANDING",
            "review_event_id": "REV_125_MONTHLY_CLINICAL_RISK_STANDING",
            "cadence_kind": "monthly",
            "cadence_rule": "First Tuesday of every month at 13:00 Europe/London",
            "next_due_at": "2026-05-05T13:00:00+01:00",
            "owner_role_id": "ROLE_PRODUCT_OWNER",
            "chair_role_id": "ROLE_CLINICAL_SAFETY_LEAD",
            "assumption_ref": "ASSUMPTION_REVIEW_CADENCE_MONTHLY_STANDING_FIRST_TUESDAY_V1",
            "required_outputs": ["open_gap_rollup", "review_debt_rollup", "expiring_evidence_rollup"],
        },
    ],
    "event_driven_reviews": [
        {
            "calendar_entry_id": "CAL_125_PREMERGE_MATERIAL_CHANGE",
            "review_event_id": "REV_125_PREMERGE_MATERIAL_CHANGE",
            "service_level_expectation": "before merge",
            "owner_role_id": "ROLE_ENGINEERING_LEAD",
        },
        {
            "calendar_entry_id": "CAL_125_RELEASE_CANDIDATE_SAFETY_SIGNOFF",
            "review_event_id": "REV_125_RELEASE_CANDIDATE_SAFETY_SIGNOFF",
            "service_level_expectation": "same day as release freeze",
            "owner_role_id": "ROLE_RELEASE_DEPLOYMENT_APPROVER",
            "assumption_ref": "ASSUMPTION_REVIEW_CADENCE_RELEASE_CANDIDATE_SAME_DAY_V1",
        },
        {
            "calendar_entry_id": "CAL_125_POST_INCIDENT_NEAR_MISS",
            "review_event_id": "REV_125_POST_INCIDENT_NEAR_MISS",
            "service_level_expectation": "within 2 business days",
            "owner_role_id": "ROLE_SERVICE_OWNER_OPERATIONS_APPROVER",
            "assumption_ref": "ASSUMPTION_REVIEW_CADENCE_POST_INCIDENT_TWO_BUSINESS_DAYS_V1",
        },
        {
            "calendar_entry_id": "CAL_125_STANDARDS_OR_ONBOARDING_DELTA",
            "review_event_id": "REV_125_STANDARDS_OR_ONBOARDING_DELTA",
            "service_level_expectation": "within 3 business days",
            "owner_role_id": "ROLE_PRIVACY_LEAD",
        },
        {
            "calendar_entry_id": "CAL_125_URGENT_OUT_OF_BAND_BLOCKER",
            "review_event_id": "REV_125_URGENT_OUT_OF_BAND_BLOCKER",
            "service_level_expectation": "within 1 business day",
            "owner_role_id": "ROLE_CLINICAL_SAFETY_LEAD",
        },
    ],
}

RACI_COLUMNS = [
    "review_event_id",
    "review_event_label",
    "cadence",
    *ROLE_COLUMNS,
    "independent_review_required",
    "no_self_approval",
    "notes",
]

TRIGGER_MATRIX_COLUMNS = [
    "change_class",
    "change_example",
    "safety_impact_band",
    "required_review_events",
    "required_roles",
    "independent_reviewer_required",
    "no_self_approval",
    "required_evidence_refs",
    "required_freeze_or_trust_refs",
    "required_pack_or_delta_refs",
    "approval_state_sequence",
    "blocked_conditions",
    "notes",
]


def join_pipe(values: list[str]) -> str:
    return "|".join(values)


def write_text(path: Path, contents: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(contents, encoding="utf-8")


def write_json(path: Path, payload: dict[str, Any]) -> None:
    write_text(path, json.dumps(payload, indent=2) + "\n")


def write_csv(path: Path, rows: list[dict[str, Any]], fieldnames: list[str]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        for row in rows:
            writer.writerow(row)


def prerequisite_snapshot() -> list[dict[str, Any]]:
    snapshot: list[dict[str, Any]] = []
    for item in PREREQUISITE_SNAPSHOT:
        absolute_path = ROOT / item["path"]
        record = {
            **item,
            "absolute_path": str(absolute_path),
            "path_exists": absolute_path.exists(),
        }
        snapshot.append(record)
    return snapshot


def build_gate_requirements_payload() -> dict[str, Any]:
    snapshot = prerequisite_snapshot()
    return {
        "task_id": TASK_ID,
        "reviewed_at": REVIEWED_AT,
        "standards_version": STANDARDS_VERSION,
        "prerequisite_snapshot": snapshot,
        "role_catalog": ROLE_CATALOG,
        "gap_catalog": GAP_CATALOG,
        "evidence_catalog": EVIDENCE_CATALOG,
        "review_event_catalog": REVIEW_EVENTS,
        "release_candidate_gate_requirements": RELEASE_GATE_REQUIREMENTS,
        "no_self_approval_rules": NO_SELF_APPROVAL_RULES,
        "change_classes": CHANGE_CLASSES,
        "summary": {
            "role_count": len(ROLE_CATALOG),
            "review_event_count": len(REVIEW_EVENTS),
            "change_class_count": len(CHANGE_CLASSES),
            "high_or_critical_change_count": len(
                [
                    row
                    for row in CHANGE_CLASSES
                    if row["safety_impact_band"] in {"high", "critical"}
                ]
            ),
            "blocked_prerequisite_count": len(
                [row for row in snapshot if row["status"] != "available"]
            ),
        },
    }


def trigger_matrix_rows() -> list[dict[str, str]]:
    rows: list[dict[str, str]] = []
    for row in CHANGE_CLASSES:
        rows.append(
            {
                "change_class": row["change_class"],
                "change_example": row["change_example"],
                "safety_impact_band": row["safety_impact_band"],
                "required_review_events": join_pipe(row["required_review_events"]),
                "required_roles": join_pipe(row["required_roles"]),
                "independent_reviewer_required": str(row["independent_reviewer_required"]).lower(),
                "no_self_approval": str(row["no_self_approval"]).lower(),
                "required_evidence_refs": join_pipe(row["required_evidence_refs"]),
                "required_freeze_or_trust_refs": join_pipe(row["required_freeze_or_trust_refs"]),
                "required_pack_or_delta_refs": join_pipe(row["required_pack_or_delta_refs"]),
                "approval_state_sequence": join_pipe(row["approval_state_sequence"]),
                "blocked_conditions": join_pipe(
                    [condition["blocker_id"] for condition in row["blocked_conditions"]]
                ),
                "notes": row["notes"],
            }
        )
    return rows


def markdown_table(headers: list[str], rows: list[list[str]]) -> str:
    lines = [
        "| " + " | ".join(headers) + " |",
        "| " + " | ".join(["---"] * len(headers)) + " |",
    ]
    for row in rows:
        lines.append("| " + " | ".join(row) + " |")
    return "\n".join(lines)


def build_cadence_doc() -> str:
    review_rows = [
        [
            event["review_event_id"],
            event["label"],
            event["cadence_label"],
            ", ".join(ROLE_LABELS[role_id] for role_id in event["required_role_ids"]),
            event["next_due_at"],
        ]
        for event in REVIEW_EVENTS
    ]
    gap_rows = [
        [gap["gap_id"], gap["gap_class"], gap["summary"], gap["closure_target"]]
        for gap in GAP_CATALOG
        if gap["gap_class"] in {"role_capacity", "cadence_assumption", "prerequisite_dependency"}
    ]
    return f"""# 125 Clinical Risk Review Cadence

This document is the human-readable view over [`clinical_review_calendar_seed.json`](../../data/assurance/clinical_review_calendar_seed.json), [`clinical_signoff_gate_requirements.json`](../../data/assurance/clinical_signoff_gate_requirements.json), and [`clinical_risk_review_raci.csv`](../../data/assurance/clinical_risk_review_raci.csv).

## Section A — `Mock_now_execution`

- The repo uses these review event IDs, cadence defaults, and role placeholders now.
- Material changes must enter the signoff graph before merge or release progression.
- `par_123` remains an explicit prerequisite gap for IM1- or SCAL-coupled change classes; those routes stay blocked instead of silently assumed ready.

## Section B — `Actual_production_strategy_later`

- Replace the placeholder roster with named approvers without changing the review-event IDs or the no-self-approval rules.
- Keep the same graph and cadence contracts, then bind them to real governance calendars, named organisations, and live release evidence.
- Extend the same machine-readable artifacts rather than replacing them with ad hoc meeting notes.

## Review Event Calendar

{markdown_table(
    ["Event id", "Review event", "Cadence", "Required roles", "Next due / SLA"],
    review_rows,
)}

## Assumptions And Open Capacity Gaps

{markdown_table(
    ["Gap id", "Class", "Why it exists", "Closure target"],
    gap_rows,
)}
"""


def build_signoff_doc() -> str:
    rows = [
        [
            row["change_class"],
            row["safety_impact_band"],
            join_pipe(row["required_review_events"]),
            join_pipe(row["required_roles"]),
            str(row["independent_reviewer_required"]).lower(),
            str(row["no_self_approval"]).lower(),
        ]
        for row in CHANGE_CLASSES
    ]
    return f"""# 125 Clinical Signoff Matrix

This matrix summarises the machine-readable change classes in [`clinical_change_trigger_matrix.csv`](../../data/assurance/clinical_change_trigger_matrix.csv).

## Section A — `Mock_now_execution`

- Use the matrix to classify every change before merge and before release candidate signoff.
- Treat `critical` and `high` classes as material by default.
- If a change touches multiple classes, use the strictest required review path.

## Section B — `Actual_production_strategy_later`

- Keep the same class IDs and state sequence, then replace placeholder actors with named approvers.
- If later live governance needs additional approver roles, add them to the graph without relaxing the existing independent-review or no-self-approval rules.

## Change Class To Signoff Path

{markdown_table(
    ["Change class", "Impact band", "Review events", "Required roles", "Independent reviewer", "No self approval"],
    rows,
)}
"""


def build_triggers_doc() -> str:
    rows = [
        [
            row["change_class"],
            row["change_example"],
            join_pipe(row["required_pack_or_delta_refs"]),
            join_pipe(row["required_evidence_refs"]),
            join_pipe(row["required_freeze_or_trust_refs"]),
        ]
        for row in CHANGE_CLASSES
    ]
    return f"""# 125 Change Classification And Assurance Triggers

This trigger map explains which pack or delta must move when a change enters the clinical signoff workflow.

## Section A — `Mock_now_execution`

- DCB0129 deltas and release/runtime deltas are recorded as part of ordinary engineering delivery.
- DSPT, NHS Login, and IM1/SCAL deltas stay explicit instead of being collapsed into generic “security review”.
- Content-only or technical-only claims still require a conservative non-applicability record.

## Section B — `Actual_production_strategy_later`

- Replace placeholder pack refs with signed live evidence while preserving the same class IDs and delta refs.
- Keep onboarding- and standards-specific changes tied to the same event IDs so audits can prove when the delta was reviewed.

## Trigger Matrix

{markdown_table(
    ["Change class", "Example", "Required pack or delta refs", "Required evidence refs", "Required freeze or trust refs"],
    rows,
)}
"""


def build_graph_doc() -> str:
    release_gate_rows = [
        [gate["gate_id"], gate["required_ref"], gate["summary"]]
        for gate in RELEASE_GATE_REQUIREMENTS
    ]
    return f"""# 125 Release And Safety Approval Graph

The approval graph is the prose view of [`clinical_signoff_workflow_state_machine.json`](../../data/assurance/clinical_signoff_workflow_state_machine.json).

## Section A — `Mock_now_execution`

- The repo uses one explicit graph for advisory review, clinical safety review, independent safety review, privacy/security review, and release approval.
- Release candidate signoff stays blocked unless the reviewed candidate still matches the same `ReleaseApprovalFreeze`, `GovernanceReviewPackage`, `RuntimePublicationBundle`, `ReleasePublicationParityRecord`, `AssuranceSliceTrustRecord`, and `StandardsDependencyWatchlist`.

## Section B — `Actual_production_strategy_later`

- Real team names, deployer signoffs, and external onboarding evidence should extend this graph rather than replace it.
- Additional approver roles may be inserted only if the existing actor-separation and no-self-approval rules remain intact.

## Approval Graph

```mermaid
flowchart LR
  proposal["Proposal intake"] --> advisory["Advisory review"]
  advisory --> clinical["Clinical safety review"]
  clinical --> independent["Independent safety review"]
  clinical --> privacy["Privacy or security review"]
  independent --> privacy
  independent --> release["Release and deployment approval"]
  privacy --> release
  release --> approved["Approved"]
  advisory --> blocked["Blocked"]
  clinical --> blocked
  independent --> blocked
  privacy --> blocked
  release --> blocked
```

## Release Candidate Gate Requirements

{markdown_table(
    ["Gate id", "Required ref", "Why it blocks release"],
    release_gate_rows,
)}
"""


def build_rules_doc() -> str:
    rows = []
    for rule in NO_SELF_APPROVAL_RULES:
        applies_to = rule["applies_to_change_classes"]
        if isinstance(applies_to, list):
            applies_to_label = join_pipe(applies_to)
        else:
            applies_to_label = str(applies_to)
        rows.append([rule["rule_id"], applies_to_label, rule["summary"]])
    return f"""# 125 Independent Review And No Self Approval Rules

This document defines the actor-separation rules that the machine-readable signoff graph enforces.

## Section A — `Mock_now_execution`

- Material changes always require approver separation.
- High-impact change classes always require an independent safety reviewer.
- Privacy/security approval remains distinct from the proposer for identity, communications, and assistive changes.

## Section B — `Actual_production_strategy_later`

- Named rosters should replace placeholders, but the same rule IDs should continue to gate approval.
- If later live onboarding introduces new approver roles, they must be added without weakening these rule families.

## Actor Separation Rules

{markdown_table(
    ["Rule id", "Applies to", "Rule summary"],
    rows,
)}
"""


def build_outputs() -> None:
    gate_payload = build_gate_requirements_payload()
    write_text(CADENCE_DOC_PATH, build_cadence_doc())
    write_text(SIGNOFF_DOC_PATH, build_signoff_doc())
    write_text(TRIGGERS_DOC_PATH, build_triggers_doc())
    write_text(GRAPH_DOC_PATH, build_graph_doc())
    write_text(RULES_DOC_PATH, build_rules_doc())
    write_csv(RACI_PATH, RACI_MATRIX, RACI_COLUMNS)
    write_csv(TRIGGER_MATRIX_PATH, trigger_matrix_rows(), TRIGGER_MATRIX_COLUMNS)
    write_json(STATE_MACHINE_PATH, WORKFLOW_STATE_MACHINE)
    write_json(GATE_REQUIREMENTS_PATH, gate_payload)
    write_json(CALENDAR_PATH, CALENDAR_SEED)


def main() -> None:
    build_outputs()


if __name__ == "__main__":
    main()
