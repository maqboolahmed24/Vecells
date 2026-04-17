#!/usr/bin/env python3
from __future__ import annotations

import csv
import hashlib
import json
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = ROOT / "data" / "analysis"

RUNTIME_TOPOLOGY_PATH = DATA_DIR / "runtime_topology_manifest.json"
GATEWAY_SURFACE_MANIFEST_PATH = DATA_DIR / "gateway_surface_manifest.json"
SEED_MATRIX_PATH = DATA_DIR / "seed_dataset_matrix.csv"
MOCK_SEED_PLAN_PATH = DATA_DIR / "mock_account_seed_plan.json"
CACHE_NAMESPACE_PATH = DATA_DIR / "cache_namespace_manifest.json"
LIVE_TRANSPORT_PATH = DATA_DIR / "live_transport_topology_manifest.json"
DOMAIN_STORE_PATH = DATA_DIR / "domain_store_manifest.json"
FHIR_STORE_PATH = DATA_DIR / "fhir_store_manifest.json"
OBJECT_STORAGE_PATH = DATA_DIR / "object_storage_class_manifest.json"
EVENT_BROKER_PATH = DATA_DIR / "event_broker_topology_manifest.json"
SECRET_CLASS_PATH = DATA_DIR / "secret_class_manifest.json"
SUPPLY_CHAIN_PATH = DATA_DIR / "supply_chain_and_provenance_matrix.json"

PREVIEW_ENVIRONMENT_MANIFEST_PATH = DATA_DIR / "preview_environment_manifest.json"
PREVIEW_SEED_PACK_MANIFEST_PATH = DATA_DIR / "preview_seed_pack_manifest.json"
PREVIEW_RESET_MATRIX_PATH = DATA_DIR / "preview_reset_matrix.csv"

TASK_ID = "par_092"
VISUAL_MODE = "Preview_Environment_Control_Room"
TIMESTAMP = datetime.now(timezone.utc).replace(microsecond=0).isoformat()
CAPTURED_ON = TIMESTAMP[:10]
MISSION = (
    "Provision governed preview environments, synthetic seed packs, deterministic reset flows, "
    "and browser-visible preview posture so Phase 0 runtime and frontend tracks can rely on one "
    "stable non-production rehearsal target."
)

SOURCE_PRECEDENCE = [
    "prompt/092.md",
    "prompt/shared_operating_contract_086_to_095.md",
    "prompt/AGENT.md",
    "prompt/checklist.md",
    "blueprint/phase-0-the-foundation-protocol.md#0A. Delivery skeleton and repository architecture",
    "blueprint/platform-runtime-and-release-blueprint.md#Operational readiness contract",
    "blueprint/platform-runtime-and-release-blueprint.md#RuntimePublicationBundle",
    "blueprint/platform-frontend-blueprint.md#Shell ownership and deterministic anchors",
    "blueprint/forensic-audit-findings.md#Finding 88",
    "blueprint/forensic-audit-findings.md#Finding 102",
    "data/analysis/runtime_topology_manifest.json",
    "data/analysis/gateway_surface_manifest.json",
    "data/analysis/seed_dataset_matrix.csv",
    "data/analysis/mock_account_seed_plan.json",
    "data/analysis/cache_namespace_manifest.json",
    "data/analysis/live_transport_topology_manifest.json",
    "data/analysis/domain_store_manifest.json",
    "data/analysis/fhir_store_manifest.json",
    "data/analysis/object_storage_class_manifest.json",
    "data/analysis/event_broker_topology_manifest.json",
    "data/analysis/secret_class_manifest.json",
    "data/analysis/supply_chain_and_provenance_matrix.json",
]

SUBSTRATE_ORDER = [
    ("runtime_topology_bundle", "manifest_bundle"),
    ("domain_store", "deterministic_restore"),
    ("fhir_store", "deterministic_restore"),
    ("projection_store", "deterministic_rebuild"),
    ("event_spine", "deterministic_requeue"),
    ("cache_plane", "deterministic_reset"),
    ("object_storage", "deterministic_resync"),
    ("browser_surface_banner", "marker_reapply"),
]

SCENARIO_SPECS = [
    {
        "scenarioRef": "scn_092_patient_clean_submit",
        "seedPackRef": "psp_patient_care_suite",
        "label": "Clean patient self-service submit",
        "scenarioState": "healthy",
        "scenarioFamily": "patient_journey",
        "routeFamilyRef": "rf_intake_self_service",
        "gatewayServiceRef": "agws_patient_web",
        "referenceCaseRef": "RC_059_CLEAN_SELF_SERVICE_SUBMIT_V1",
        "startingSurfaceRef": "audsurf_patient_public_entry",
        "automationAnchorRef": "preview-anchor-patient-submit",
        "seededDomainRefs": ["intake", "identity", "communications"],
        "notes": "Baseline intake and identity-safe continuation flow for patient preview.",
        "parallelInterfaceGapRefs": [],
    },
    {
        "scenarioRef": "scn_092_patient_urgent_diversion",
        "seedPackRef": "psp_patient_care_suite",
        "label": "Urgent diversion degraded patient submit",
        "scenarioState": "degraded",
        "scenarioFamily": "patient_journey",
        "routeFamilyRef": "rf_intake_self_service",
        "gatewayServiceRef": "agws_patient_web",
        "referenceCaseRef": "RC_059_URGENT_DIVERSION_ISSUED_V1",
        "startingSurfaceRef": "audsurf_patient_public_entry",
        "automationAnchorRef": "preview-anchor-urgent-diversion",
        "seededDomainRefs": ["intake", "triage", "communications"],
        "notes": "Preview pack keeps urgent diversion visibly non-calm and non-silent.",
        "parallelInterfaceGapRefs": [],
    },
    {
        "scenarioRef": "scn_092_patient_telephony_recovery",
        "seedPackRef": "psp_patient_care_suite",
        "label": "Telephony continuation recovery handoff",
        "scenarioState": "recovery",
        "scenarioFamily": "continuation",
        "routeFamilyRef": "rf_intake_telephony_capture",
        "gatewayServiceRef": "agws_patient_web",
        "referenceCaseRef": "RC_059_TELEPHONY_CONTINUATION_BRANCH_V1",
        "startingSurfaceRef": "audsurf_patient_public_entry",
        "automationAnchorRef": "preview-anchor-telephony-continuation",
        "seededDomainRefs": ["intake", "communications", "support"],
        "notes": "Synthetic telephony continuation proves the preview reset restores non-browser ingress tuples too.",
        "parallelInterfaceGapRefs": [],
    },
    {
        "scenarioRef": "scn_092_patient_duplicate_retry",
        "seedPackRef": "psp_patient_care_suite",
        "label": "Duplicate retry collapse",
        "scenarioState": "recovery",
        "scenarioFamily": "patient_journey",
        "routeFamilyRef": "rf_patient_requests",
        "gatewayServiceRef": "agws_patient_web",
        "referenceCaseRef": "RC_059_DUPLICATE_RETRY_COLLAPSE_V1",
        "startingSurfaceRef": "audsurf_patient_authenticated_portal",
        "automationAnchorRef": "preview-anchor-duplicate-retry",
        "seededDomainRefs": ["identity", "request", "booking"],
        "notes": "Reset must return request and duplicate posture to the exact pre-collision tuple.",
        "parallelInterfaceGapRefs": [],
    },
    {
        "scenarioRef": "scn_092_patient_wrong_patient_repair",
        "seedPackRef": "psp_patient_care_suite",
        "label": "Wrong-patient identity repair hold",
        "scenarioState": "degraded",
        "scenarioFamily": "identity_repair",
        "routeFamilyRef": "rf_patient_secure_link_recovery",
        "gatewayServiceRef": "agws_patient_web",
        "referenceCaseRef": "RC_059_WRONG_PATIENT_IDENTITY_REPAIR_HOLD_V1",
        "startingSurfaceRef": "audsurf_patient_transaction_recovery",
        "automationAnchorRef": "preview-anchor-wrong-patient-repair",
        "seededDomainRefs": ["identity", "communications", "support"],
        "notes": "Preview data keeps blocked secure-link posture obvious instead of quietly calm.",
        "parallelInterfaceGapRefs": [],
    },
    {
        "scenarioRef": "scn_092_support_replay_restore",
        "seedPackRef": "psp_support_replay_suite",
        "label": "Support replay restore",
        "scenarioState": "recovery",
        "scenarioFamily": "support_recovery",
        "routeFamilyRef": "rf_support_replay_observe",
        "gatewayServiceRef": "agws_support_workspace",
        "referenceCaseRef": "RC_059_SUPPORT_REPLAY_RESTORE_V1",
        "startingSurfaceRef": "audsurf_support_workspace",
        "automationAnchorRef": "preview-anchor-support-replay",
        "seededDomainRefs": ["support", "communications", "identity"],
        "notes": "Replay-safe support tuples must return after every environment reset.",
        "parallelInterfaceGapRefs": [],
    },
    {
        "scenarioRef": "scn_092_support_fallback_review",
        "seedPackRef": "psp_support_replay_suite",
        "label": "Accepted-progress degraded fallback review",
        "scenarioState": "degraded",
        "scenarioFamily": "support_recovery",
        "routeFamilyRef": "rf_support_replay_observe",
        "gatewayServiceRef": "agws_support_workspace",
        "referenceCaseRef": "RC_059_ACCEPTED_PROGRESS_DEGRADED_FALLBACK_V1",
        "startingSurfaceRef": "audsurf_support_workspace",
        "automationAnchorRef": "preview-anchor-fallback-review",
        "seededDomainRefs": ["support", "communications", "request"],
        "notes": "Preview pack includes fallback review rather than only calm support inbox states.",
        "parallelInterfaceGapRefs": [],
    },
    {
        "scenarioRef": "scn_092_support_duplicate_collision",
        "seedPackRef": "psp_support_replay_suite",
        "label": "Support duplicate collision review",
        "scenarioState": "degraded",
        "scenarioFamily": "support_review",
        "routeFamilyRef": "rf_support_ticket_workspace",
        "gatewayServiceRef": "agws_support_workspace",
        "referenceCaseRef": "RC_059_DUPLICATE_COLLISION_REVIEW_V1",
        "startingSurfaceRef": "audsurf_support_workspace",
        "automationAnchorRef": "preview-anchor-support-duplicate",
        "seededDomainRefs": ["support", "identity", "request"],
        "notes": "Collision review remains deterministic and synthetic after reset.",
        "parallelInterfaceGapRefs": [],
    },
    {
        "scenarioRef": "scn_092_clinical_hub_booking_ambiguity",
        "seedPackRef": "psp_clinical_hub_suite",
        "label": "Hub booking ambiguity case",
        "scenarioState": "degraded",
        "scenarioFamily": "hub_triage",
        "routeFamilyRef": "rf_hub_case_management",
        "gatewayServiceRef": "agws_hub_desk",
        "referenceCaseRef": "RC_059_BOOKING_CONFIRMATION_PENDING_AMBIGUITY_V1",
        "startingSurfaceRef": "audsurf_hub_desk",
        "automationAnchorRef": "preview-anchor-hub-ambiguity",
        "seededDomainRefs": ["triage", "hub", "booking"],
        "notes": "Hub preview keeps ambiguity and deferred confirmation explicit.",
        "parallelInterfaceGapRefs": [],
    },
    {
        "scenarioRef": "scn_092_clinical_workspace_scope_stub",
        "seedPackRef": "psp_clinical_hub_suite",
        "label": "Clinical workspace scope placeholder",
        "scenarioState": "healthy",
        "scenarioFamily": "structure_only",
        "routeFamilyRef": "rf_staff_workspace",
        "gatewayServiceRef": "agws_clinical_workspace",
        "referenceCaseRef": None,
        "startingSurfaceRef": "audsurf_support_workspace",
        "automationAnchorRef": "preview-anchor-clinical-workspace",
        "seededDomainRefs": ["triage", "identity"],
        "notes": "Minimal synthetic queue tuple published until a richer workspace reference case lands.",
        "parallelInterfaceGapRefs": [
            "PARALLEL_INTERFACE_GAP_092_CLINICAL_WORKSPACE_REFERENCE_CASE_PENDING",
        ],
    },
    {
        "scenarioRef": "scn_092_clinical_workspace_child_stub",
        "seedPackRef": "psp_clinical_hub_suite",
        "label": "Clinical workspace child-route placeholder",
        "scenarioState": "healthy",
        "scenarioFamily": "structure_only",
        "routeFamilyRef": "rf_staff_workspace_child",
        "gatewayServiceRef": "agws_clinical_workspace",
        "referenceCaseRef": None,
        "startingSurfaceRef": "audsurf_support_workspace",
        "automationAnchorRef": "preview-anchor-clinical-child-route",
        "seededDomainRefs": ["triage", "support"],
        "notes": "Child-route continuity stays deterministic even while richer task-owned cases are pending.",
        "parallelInterfaceGapRefs": [
            "PARALLEL_INTERFACE_GAP_092_CLINICAL_WORKSPACE_REFERENCE_CASE_PENDING",
        ],
    },
    {
        "scenarioRef": "scn_092_pharmacy_weak_match",
        "seedPackRef": "psp_pharmacy_dispatch_suite",
        "label": "Pharmacy weak-match dispatch proof pending",
        "scenarioState": "degraded",
        "scenarioFamily": "pharmacy",
        "routeFamilyRef": "rf_pharmacy_console",
        "gatewayServiceRef": "agws_pharmacy_console",
        "referenceCaseRef": "RC_059_PHARMACY_DISPATCH_WEAK_MATCH_V1",
        "startingSurfaceRef": "audsurf_pharmacy_console",
        "automationAnchorRef": "preview-anchor-pharmacy-weak-match",
        "seededDomainRefs": ["pharmacy", "communications", "booking"],
        "notes": "Weak-match and proof-pending posture is part of the baseline preview pack, not an edge-case add-on.",
        "parallelInterfaceGapRefs": [],
    },
    {
        "scenarioRef": "scn_092_pharmacy_republish_rehearsal",
        "seedPackRef": "psp_pharmacy_dispatch_suite",
        "label": "Pharmacy preview publication rehearsal",
        "scenarioState": "recovery",
        "scenarioFamily": "pharmacy",
        "routeFamilyRef": "rf_pharmacy_console",
        "gatewayServiceRef": "agws_pharmacy_console",
        "referenceCaseRef": None,
        "startingSurfaceRef": "audsurf_pharmacy_console",
        "automationAnchorRef": "preview-anchor-pharmacy-republish",
        "seededDomainRefs": ["pharmacy", "runtime_publication"],
        "notes": "This scenario keeps reset rehearsal aligned with later runtime publication bundle work.",
        "parallelInterfaceGapRefs": [],
    },
    {
        "scenarioRef": "scn_092_ops_release_watch_stub",
        "seedPackRef": "psp_control_plane_suite",
        "label": "Operations release-watch preview stub",
        "scenarioState": "healthy",
        "scenarioFamily": "structure_only",
        "routeFamilyRef": "rf_operations_board",
        "gatewayServiceRef": "agws_ops_console",
        "referenceCaseRef": None,
        "startingSurfaceRef": "audsurf_support_workspace",
        "automationAnchorRef": "preview-anchor-ops-board",
        "seededDomainRefs": ["operations", "runtime_publication", "assurance"],
        "notes": "Control-plane preview is synthetic-only and intentionally bounded until live-wave policy work lands.",
        "parallelInterfaceGapRefs": [
            "PARALLEL_INTERFACE_GAP_092_CONTROL_PLANE_REFERENCE_CASE_PENDING",
        ],
    },
    {
        "scenarioRef": "scn_092_governance_attestation_stub",
        "seedPackRef": "psp_control_plane_suite",
        "label": "Governance attestation preview stub",
        "scenarioState": "healthy",
        "scenarioFamily": "structure_only",
        "routeFamilyRef": "rf_governance_shell",
        "gatewayServiceRef": "agws_governance_console",
        "referenceCaseRef": None,
        "startingSurfaceRef": "audsurf_support_workspace",
        "automationAnchorRef": "preview-anchor-governance-shell",
        "seededDomainRefs": ["governance", "runtime_publication", "assurance"],
        "notes": "Governance preview remains safe and screenshot-ready while release parity records are still owned by later tracks.",
        "parallelInterfaceGapRefs": [
            "PARALLEL_INTERFACE_GAP_092_CONTROL_PLANE_REFERENCE_CASE_PENDING",
        ],
    },
]

SEED_PACK_SPECS = [
    {
        "seedPackRef": "psp_patient_care_suite",
        "label": "Patient Care Journey Suite",
        "environmentRings": ["ci-preview"],
        "syntheticOnly": True,
        "notes": "Patient preview pack spans clean intake, urgent diversion, telephony continuation, duplicate retry, and identity repair.",
        "followOnDependencyRefs": [],
        "parallelInterfaceGapRefs": [],
    },
    {
        "seedPackRef": "psp_support_replay_suite",
        "label": "Support Replay Recovery Suite",
        "environmentRings": ["ci-preview"],
        "syntheticOnly": True,
        "notes": "Support preview pack proves replay restore, fallback review, and duplicate collision review survive resets.",
        "followOnDependencyRefs": [],
        "parallelInterfaceGapRefs": [],
    },
    {
        "seedPackRef": "psp_clinical_hub_suite",
        "label": "Clinical Workspace And Hub Suite",
        "environmentRings": ["ci-preview"],
        "syntheticOnly": True,
        "notes": "Clinical and hub preview pack combines one real ambiguity case with bounded workspace placeholder tuples.",
        "followOnDependencyRefs": [],
        "parallelInterfaceGapRefs": [
            "PARALLEL_INTERFACE_GAP_092_CLINICAL_WORKSPACE_REFERENCE_CASE_PENDING",
        ],
    },
    {
        "seedPackRef": "psp_pharmacy_dispatch_suite",
        "label": "Pharmacy Dispatch And Reconciliation Suite",
        "environmentRings": ["preprod"],
        "syntheticOnly": True,
        "notes": "Pharmacy preview pack binds weak-match recovery and publication rehearsal to one deterministic tuple.",
        "followOnDependencyRefs": [
            "FOLLOW_ON_DEPENDENCY_091_NONPROD_PROMOTION_ATTESTATION_PENDING",
        ],
        "parallelInterfaceGapRefs": [],
    },
    {
        "seedPackRef": "psp_control_plane_suite",
        "label": "Runtime Control Plane Suite",
        "environmentRings": ["ci-preview", "preprod"],
        "syntheticOnly": True,
        "notes": "Operations and governance previews stay structure-only, screenshot-safe, and visibly non-production.",
        "followOnDependencyRefs": [
            "FOLLOW_ON_DEPENDENCY_094_RUNTIME_PUBLICATION_BUNDLE_PENDING",
            "FOLLOW_ON_DEPENDENCY_097_WAVE_OBSERVATION_POLICY_PENDING",
        ],
        "parallelInterfaceGapRefs": [
            "PARALLEL_INTERFACE_GAP_092_CONTROL_PLANE_REFERENCE_CASE_PENDING",
        ],
    },
]

PREVIEW_ENVIRONMENT_SPECS = [
    {
        "previewEnvironmentRef": "pev_branch_patient_care",
        "displayName": "Branch preview / patient care",
        "ownerRef": "team_patient_web",
        "ownerLabel": "Patient Web",
        "environmentRing": "ci-preview",
        "previewClass": "branch",
        "seedPackRef": "psp_patient_care_suite",
        "gatewayServiceRefs": ["agws_patient_web"],
        "routeFamilyRefs": [
            "rf_intake_self_service",
            "rf_intake_telephony_capture",
            "rf_patient_requests",
            "rf_patient_secure_link_recovery",
        ],
        "state": "ready",
        "driftState": "clean",
        "expiryWindow": "stable",
        "ttlHours": 24,
        "createdAt": "2026-04-12T09:00:00+00:00",
        "expiresAt": "2026-04-13T09:00:00+00:00",
        "branchRef": "maqbool/preview-patient-care",
        "publicationBindingState": "verified_for_preview",
        "resetControllerRef": "prc_preview_reset_v1",
        "browserBannerText": "PREVIEW / SYNTHETIC ONLY / patient care branch",
        "browserBannerMarker": "vecells-preview-synthetic",
        "allowedDiagnostics": ["playwright", "masked-logs", "synthetic-screenshots"],
        "followOnDependencyRefs": [],
        "parallelInterfaceGapRefs": [],
    },
    {
        "previewEnvironmentRef": "pev_branch_support_replay",
        "displayName": "Branch preview / support replay",
        "ownerRef": "team_support_workspace",
        "ownerLabel": "Support Workspace",
        "environmentRing": "ci-preview",
        "previewClass": "branch",
        "seedPackRef": "psp_support_replay_suite",
        "gatewayServiceRefs": ["agws_support_workspace"],
        "routeFamilyRefs": ["rf_support_ticket_workspace", "rf_support_replay_observe"],
        "state": "ready",
        "driftState": "clean",
        "expiryWindow": "stable",
        "ttlHours": 24,
        "createdAt": "2026-04-12T08:45:00+00:00",
        "expiresAt": "2026-04-13T08:45:00+00:00",
        "branchRef": "maqbool/preview-support-replay",
        "publicationBindingState": "verified_for_preview",
        "resetControllerRef": "prc_preview_reset_v1",
        "browserBannerText": "PREVIEW / SYNTHETIC ONLY / support replay branch",
        "browserBannerMarker": "vecells-preview-synthetic",
        "allowedDiagnostics": ["playwright", "masked-logs", "synthetic-screenshots"],
        "followOnDependencyRefs": [],
        "parallelInterfaceGapRefs": [],
    },
    {
        "previewEnvironmentRef": "pev_branch_clinical_hub",
        "displayName": "Branch preview / clinical workspace and hub",
        "ownerRef": "team_clinical_hub",
        "ownerLabel": "Clinical Workspace",
        "environmentRing": "ci-preview",
        "previewClass": "branch",
        "seedPackRef": "psp_clinical_hub_suite",
        "gatewayServiceRefs": ["agws_clinical_workspace", "agws_hub_desk"],
        "routeFamilyRefs": ["rf_staff_workspace", "rf_staff_workspace_child", "rf_hub_case_management"],
        "state": "ready",
        "driftState": "clean",
        "expiryWindow": "stable",
        "ttlHours": 24,
        "createdAt": "2026-04-12T10:00:00+00:00",
        "expiresAt": "2026-04-13T10:00:00+00:00",
        "branchRef": "maqbool/preview-clinical-hub",
        "publicationBindingState": "verified_with_placeholder_seed",
        "resetControllerRef": "prc_preview_reset_v1",
        "browserBannerText": "PREVIEW / SYNTHETIC ONLY / clinical workspace and hub",
        "browserBannerMarker": "vecells-preview-synthetic",
        "allowedDiagnostics": ["playwright", "masked-logs", "synthetic-screenshots"],
        "followOnDependencyRefs": [],
        "parallelInterfaceGapRefs": [
            "PARALLEL_INTERFACE_GAP_092_CLINICAL_WORKSPACE_REFERENCE_CASE_PENDING",
        ],
    },
    {
        "previewEnvironmentRef": "pev_rc_pharmacy_dispatch",
        "displayName": "Release candidate / pharmacy dispatch",
        "ownerRef": "team_pharmacy_console",
        "ownerLabel": "Pharmacy Console",
        "environmentRing": "preprod",
        "previewClass": "release_candidate",
        "seedPackRef": "psp_pharmacy_dispatch_suite",
        "gatewayServiceRefs": ["agws_pharmacy_console"],
        "routeFamilyRefs": ["rf_pharmacy_console"],
        "state": "drifted",
        "driftState": "publication_drift",
        "expiryWindow": "stable",
        "ttlHours": 48,
        "createdAt": "2026-04-11T12:00:00+00:00",
        "expiresAt": "2026-04-13T12:00:00+00:00",
        "branchRef": "release/rc-pharmacy-dispatch",
        "publicationBindingState": "pending_attestation",
        "resetControllerRef": "prc_preview_reset_v1",
        "browserBannerText": "PREVIEW / SYNTHETIC ONLY / pharmacy release candidate",
        "browserBannerMarker": "vecells-preview-synthetic",
        "allowedDiagnostics": ["playwright", "masked-logs", "synthetic-screenshots"],
        "followOnDependencyRefs": [
            "FOLLOW_ON_DEPENDENCY_091_NONPROD_PROMOTION_ATTESTATION_PENDING",
        ],
        "parallelInterfaceGapRefs": [],
    },
    {
        "previewEnvironmentRef": "pev_branch_ops_control",
        "displayName": "Branch preview / operations control",
        "ownerRef": "team_ops_console",
        "ownerLabel": "Operations Console",
        "environmentRing": "ci-preview",
        "previewClass": "branch",
        "seedPackRef": "psp_control_plane_suite",
        "gatewayServiceRefs": ["agws_ops_console"],
        "routeFamilyRefs": ["rf_operations_board"],
        "state": "expiring",
        "driftState": "clean",
        "expiryWindow": "under_6h",
        "ttlHours": 8,
        "createdAt": "2026-04-12T08:00:00+00:00",
        "expiresAt": "2026-04-12T13:30:00+00:00",
        "branchRef": "maqbool/preview-ops-control",
        "publicationBindingState": "verified_with_placeholder_seed",
        "resetControllerRef": "prc_preview_reset_v1",
        "browserBannerText": "PREVIEW / SYNTHETIC ONLY / operations control branch",
        "browserBannerMarker": "vecells-preview-synthetic",
        "allowedDiagnostics": ["playwright", "masked-logs", "synthetic-screenshots"],
        "followOnDependencyRefs": [
            "FOLLOW_ON_DEPENDENCY_097_WAVE_OBSERVATION_POLICY_PENDING",
        ],
        "parallelInterfaceGapRefs": [
            "PARALLEL_INTERFACE_GAP_092_CONTROL_PLANE_REFERENCE_CASE_PENDING",
        ],
    },
    {
        "previewEnvironmentRef": "pev_rc_governance_audit",
        "displayName": "Release candidate / governance audit",
        "ownerRef": "team_governance_admin",
        "ownerLabel": "Governance Admin",
        "environmentRing": "preprod",
        "previewClass": "release_candidate",
        "seedPackRef": "psp_control_plane_suite",
        "gatewayServiceRefs": ["agws_governance_console"],
        "routeFamilyRefs": ["rf_governance_shell"],
        "state": "expired",
        "driftState": "reset_required",
        "expiryWindow": "expired",
        "ttlHours": 12,
        "createdAt": "2026-04-11T06:00:00+00:00",
        "expiresAt": "2026-04-12T06:00:00+00:00",
        "branchRef": "release/rc-governance-audit",
        "publicationBindingState": "expired_reset_required",
        "resetControllerRef": "prc_preview_reset_v1",
        "browserBannerText": "PREVIEW / SYNTHETIC ONLY / governance audit release candidate",
        "browserBannerMarker": "vecells-preview-synthetic",
        "allowedDiagnostics": ["playwright", "masked-logs", "synthetic-screenshots"],
        "followOnDependencyRefs": [
            "FOLLOW_ON_DEPENDENCY_094_RUNTIME_PUBLICATION_BUNDLE_PENDING",
        ],
        "parallelInterfaceGapRefs": [
            "PARALLEL_INTERFACE_GAP_092_CONTROL_PLANE_REFERENCE_CASE_PENDING",
        ],
    },
]

RESET_EVENT_SPECS = [
    {
        "resetEventRef": "pre_092_evt_patient_bootstrap",
        "previewEnvironmentRef": "pev_branch_patient_care",
        "eventKind": "bootstrap",
        "eventState": "completed",
        "occurredAt": "2026-04-12T09:01:00+00:00",
        "driftStateAfterEvent": "clean",
        "notes": "Patient preview bootstrapped from the canonical synthetic tuple.",
        "followOnDependencyRefs": [],
    },
    {
        "resetEventRef": "pre_092_evt_support_reset",
        "previewEnvironmentRef": "pev_branch_support_replay",
        "eventKind": "reset",
        "eventState": "completed",
        "occurredAt": "2026-04-12T10:20:00+00:00",
        "driftStateAfterEvent": "clean",
        "notes": "Support replay preview reset after a duplicate-review drill.",
        "followOnDependencyRefs": [],
    },
    {
        "resetEventRef": "pre_092_evt_clinical_bootstrap",
        "previewEnvironmentRef": "pev_branch_clinical_hub",
        "eventKind": "bootstrap",
        "eventState": "completed",
        "occurredAt": "2026-04-12T10:05:00+00:00",
        "driftStateAfterEvent": "clean",
        "notes": "Clinical workspace and hub placeholders bootstrapped with explicit gap markers.",
        "followOnDependencyRefs": [],
    },
    {
        "resetEventRef": "pre_092_evt_pharmacy_drift_detected",
        "previewEnvironmentRef": "pev_rc_pharmacy_dispatch",
        "eventKind": "drift_detected",
        "eventState": "failed",
        "occurredAt": "2026-04-12T11:45:00+00:00",
        "driftStateAfterEvent": "publication_drift",
        "notes": "Pharmacy preview drifted when non-production attestation binding lagged the RC tuple.",
        "followOnDependencyRefs": [
            "FOLLOW_ON_DEPENDENCY_091_NONPROD_PROMOTION_ATTESTATION_PENDING",
        ],
    },
    {
        "resetEventRef": "pre_092_evt_pharmacy_reset_attempt",
        "previewEnvironmentRef": "pev_rc_pharmacy_dispatch",
        "eventKind": "reset",
        "eventState": "failed",
        "occurredAt": "2026-04-12T11:58:00+00:00",
        "driftStateAfterEvent": "publication_drift",
        "notes": "Reset reapplied seed tuples but failed closed because publish-attestation stayed unresolved.",
        "followOnDependencyRefs": [
            "FOLLOW_ON_DEPENDENCY_091_NONPROD_PROMOTION_ATTESTATION_PENDING",
        ],
    },
    {
        "resetEventRef": "pre_092_evt_ops_ttl_warning",
        "previewEnvironmentRef": "pev_branch_ops_control",
        "eventKind": "ttl_warning",
        "eventState": "pending",
        "occurredAt": "2026-04-12T12:30:00+00:00",
        "driftStateAfterEvent": "clean",
        "notes": "Operations control preview entered its final TTL window and queued teardown.",
        "followOnDependencyRefs": [],
    },
    {
        "resetEventRef": "pre_092_evt_governance_teardown",
        "previewEnvironmentRef": "pev_rc_governance_audit",
        "eventKind": "teardown",
        "eventState": "completed",
        "occurredAt": "2026-04-12T06:05:00+00:00",
        "driftStateAfterEvent": "reset_required",
        "notes": "Expired governance preview tore down after TTL while preserving the last reset digest.",
        "followOnDependencyRefs": [
            "FOLLOW_ON_DEPENDENCY_094_RUNTIME_PUBLICATION_BUNDLE_PENDING",
        ],
    },
]

DRIFT_POLICIES = [
    {
        "driftPolicyRef": "pdp_runtime_tuple_hash_match",
        "label": "Runtime tuple hash must match the preview manifest",
        "severity": "high",
        "ruleSummary": "Any tuple drift across topology, gateway surface, or publication binding forces fail-closed preview posture.",
        "remediationPath": "reset_preview_environment",
    },
    {
        "driftPolicyRef": "pdp_seed_fixture_hash_match",
        "label": "Seed fixture hashes must remain deterministic",
        "severity": "high",
        "ruleSummary": "Store, cache, broker, and object-store fixtures are reset from canonical seed fixture hashes rather than mutable operator state.",
        "remediationPath": "reset_preview_environment",
    },
    {
        "driftPolicyRef": "pdp_banner_marker_presence",
        "label": "Browser preview markers must stay visible",
        "severity": "medium",
        "ruleSummary": "Preview surfaces remain screenshot-safe only while their synthetic-only banners and DOM markers remain present.",
        "remediationPath": "reapply_preview_banner",
    },
    {
        "driftPolicyRef": "pdp_ttl_expiry_enforced",
        "label": "TTL expiry forces reset or teardown",
        "severity": "medium",
        "ruleSummary": "Expired previews may not linger as mutable truth; they auto-teardown or return as reset-required.",
        "remediationPath": "teardown_or_reset_preview",
    },
]

BROWSER_ACCESS_RULES = [
    {
        "ruleRef": "pbar_synthetic_only_banner",
        "label": "Synthetic-only banner required",
        "requiredDomMarkers": [
            "data-vecells-preview",
            "data-preview-seed-pack",
            "data-preview-tuple-hash",
        ],
        "forbiddenTrustSignals": ["production", "live patient", "unwatermarked screenshot"],
        "screenshotSafe": True,
    },
    {
        "ruleRef": "pbar_masked_diagnostics_only",
        "label": "Masked diagnostics only",
        "requiredDomMarkers": ["data-preview-diagnostics=masked"],
        "forbiddenTrustSignals": ["raw audit payload", "partner callback body"],
        "screenshotSafe": True,
    },
    {
        "ruleRef": "pbar_fail_closed_on_stale_tuple",
        "label": "Stale tuple forces fail-closed banner",
        "requiredDomMarkers": ["data-preview-posture=stale-or-reset-required"],
        "forbiddenTrustSignals": ["calm ready badge without tuple verification"],
        "screenshotSafe": True,
    },
]

LOCAL_BOOTSTRAP = [
    {
        "environmentRing": "ci-preview",
        "bootstrapScriptRef": "infra/preview-environments/local/bootstrap-preview-environment.mjs",
        "resetScriptRef": "infra/preview-environments/local/reset-preview-environment.mjs",
        "driftScriptRef": "infra/preview-environments/local/detect-preview-drift.mjs",
        "teardownScriptRef": "infra/preview-environments/local/teardown-preview-environment.mjs",
        "composeManifestRef": "infra/preview-environments/local/preview-environment-emulator.compose.yaml",
        "browserPolicyRef": "infra/preview-environments/local/preview-browser-policy.json",
        "stateDirPattern": "infra/preview-environments/local/state/<previewEnvironmentRef>",
    },
    {
        "environmentRing": "preprod",
        "bootstrapScriptRef": "infra/preview-environments/local/bootstrap-preview-environment.mjs",
        "resetScriptRef": "infra/preview-environments/local/reset-preview-environment.mjs",
        "driftScriptRef": "infra/preview-environments/local/detect-preview-drift.mjs",
        "teardownScriptRef": "infra/preview-environments/local/teardown-preview-environment.mjs",
        "composeManifestRef": "infra/preview-environments/local/preview-environment-emulator.compose.yaml",
        "browserPolicyRef": "infra/preview-environments/local/preview-browser-policy.json",
        "stateDirPattern": "infra/preview-environments/local/state/<previewEnvironmentRef>",
    },
]


def load_json(path: Path) -> Any:
    if not path.exists():
        raise SystemExit(f"PREREQUISITE_GAP_092_MISSING_FILE::{path.relative_to(ROOT)}")
    return json.loads(path.read_text(encoding="utf-8"))


def load_csv(path: Path) -> list[dict[str, str]]:
    if not path.exists():
        raise SystemExit(f"PREREQUISITE_GAP_092_MISSING_FILE::{path.relative_to(ROOT)}")
    with path.open(newline="", encoding="utf-8") as handle:
        return list(csv.DictReader(handle))


def stable_hash(value: Any) -> str:
    encoded = json.dumps(value, sort_keys=True, separators=(",", ":")).encode("utf-8")
    return hashlib.sha256(encoded).hexdigest()[:16]


def preview_source_refs(route_ref: str, gateway_service_ref: str) -> list[str]:
    return [
        "prompt/092.md",
        f"data/analysis/gateway_surface_manifest.json#{gateway_service_ref}",
        f"data/analysis/seed_dataset_matrix.csv#{route_ref}",
    ]


def main() -> None:
    runtime_topology = load_json(RUNTIME_TOPOLOGY_PATH)
    gateway_manifest = load_json(GATEWAY_SURFACE_MANIFEST_PATH)
    seed_rows = load_csv(SEED_MATRIX_PATH)
    mock_seed_plan = load_json(MOCK_SEED_PLAN_PATH)
    cache_manifest = load_json(CACHE_NAMESPACE_PATH)
    live_manifest = load_json(LIVE_TRANSPORT_PATH)
    domain_store_manifest = load_json(DOMAIN_STORE_PATH)
    fhir_store_manifest = load_json(FHIR_STORE_PATH)
    object_storage_manifest = load_json(OBJECT_STORAGE_PATH)
    event_broker_manifest = load_json(EVENT_BROKER_PATH)
    secret_class_manifest = load_json(SECRET_CLASS_PATH)
    supply_chain_matrix = load_json(SUPPLY_CHAIN_PATH)

    env_manifest_by_ring = {
        row["environment_ring"]: row for row in runtime_topology["environment_manifests"]
    }
    route_publication_by_ref = {
        row["routeFamilyRef"]: row for row in gateway_manifest["route_publications"]
    }
    real_reference_case_rows: dict[str, list[dict[str, str]]] = defaultdict(list)
    for row in seed_rows:
        real_reference_case_rows[row["reference_case_id"]].append(row)

    for scenario in SCENARIO_SPECS:
        route_family_ref = scenario["routeFamilyRef"]
        if route_family_ref not in route_publication_by_ref:
            raise SystemExit(f"PREREQUISITE_GAP_092_UNKNOWN_ROUTE::{route_family_ref}")
        if scenario["referenceCaseRef"] and scenario["referenceCaseRef"] not in real_reference_case_rows:
            raise SystemExit(
                f"PREREQUISITE_GAP_092_UNKNOWN_REFERENCE_CASE::{scenario['referenceCaseRef']}"
            )

    supply_chain_stage_count = len(supply_chain_matrix.get("pipeline_stage_chain", []))
    seed_fixture_pack_count = len(mock_seed_plan.get("fixture_packs", []))

    scenarios_by_pack: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for scenario in SCENARIO_SPECS:
        scenario_row = {
            **scenario,
            "syntheticOnly": True,
            "structureOnly": scenario["referenceCaseRef"] is None,
            "sourceRefs": preview_source_refs(
                scenario["routeFamilyRef"],
                scenario["gatewayServiceRef"],
            ),
        }
        scenarios_by_pack[scenario["seedPackRef"]].append(scenario_row)

    seed_pack_rows: list[dict[str, Any]] = []
    for pack_spec in SEED_PACK_SPECS:
        pack_scenarios = scenarios_by_pack[pack_spec["seedPackRef"]]
        route_family_refs = [row["routeFamilyRef"] for row in pack_scenarios]
        gateway_service_refs = [row["gatewayServiceRef"] for row in pack_scenarios]
        seeded_domain_refs = sorted(
            {domain for row in pack_scenarios for domain in row["seededDomainRefs"]}
        )
        reference_case_refs = sorted(
            {row["referenceCaseRef"] for row in pack_scenarios if row["referenceCaseRef"]}
        )
        degraded_scenarios = [row["scenarioRef"] for row in pack_scenarios if row["scenarioState"] == "degraded"]
        recovery_scenarios = [row["scenarioRef"] for row in pack_scenarios if row["scenarioState"] == "recovery"]
        automation_anchor_refs = [row["automationAnchorRef"] for row in pack_scenarios]
        canonical_seed_tuple_hash = stable_hash(
            {
                "seedPackRef": pack_spec["seedPackRef"],
                "scenarioRefs": [row["scenarioRef"] for row in pack_scenarios],
                "referenceCaseRefs": reference_case_refs,
            }
        )
        substrate_fixtures = []
        for substrate_ref, reset_mode in SUBSTRATE_ORDER:
            substrate_payload = {
                "substrateRef": substrate_ref,
                "seedPackRef": pack_spec["seedPackRef"],
                "resetMode": reset_mode,
                "recordCount": len(pack_scenarios) * (1 if substrate_ref == "browser_surface_banner" else 2),
                "fixtureSetRef": f"{pack_spec['seedPackRef']}::{substrate_ref}",
            }
            substrate_payload["tupleHash"] = stable_hash(substrate_payload)
            substrate_fixtures.append(substrate_payload)
        seed_pack_rows.append(
            {
                "seedPackRef": pack_spec["seedPackRef"],
                "label": pack_spec["label"],
                "seedVersion": "2026.04-phase0-preview",
                "syntheticOnly": pack_spec["syntheticOnly"],
                "previewSafe": True,
                "environmentRings": pack_spec["environmentRings"],
                "routeFamilyRefs": route_family_refs,
                "gatewayServiceRefs": gateway_service_refs,
                "seededDomainRefs": seeded_domain_refs,
                "scenarioRefs": [row["scenarioRef"] for row in pack_scenarios],
                "degradedScenarioRefs": degraded_scenarios,
                "recoveryScenarioRefs": recovery_scenarios,
                "referenceCaseRefs": reference_case_refs,
                "automationAnchorRefs": automation_anchor_refs,
                "substrateFixtures": substrate_fixtures,
                "parallelInterfaceGapRefs": pack_spec["parallelInterfaceGapRefs"],
                "followOnDependencyRefs": pack_spec["followOnDependencyRefs"],
                "canonicalSeedTupleHash": canonical_seed_tuple_hash,
                "sourceRefs": [
                    "prompt/092.md",
                    "data/analysis/seed_dataset_matrix.csv",
                    "data/analysis/mock_account_seed_plan.json",
                ],
                "notes": pack_spec["notes"],
            }
        )

    seed_pack_by_ref = {row["seedPackRef"]: row for row in seed_pack_rows}

    preview_environment_rows: list[dict[str, Any]] = []
    for env_spec in PREVIEW_ENVIRONMENT_SPECS:
        ring_manifest = env_manifest_by_ring[env_spec["environmentRing"]]
        seed_pack = seed_pack_by_ref[env_spec["seedPackRef"]]
        runtime_tuple_hash = stable_hash(
            {
                "previewEnvironmentRef": env_spec["previewEnvironmentRef"],
                "topologyTupleHash": ring_manifest["topology_tuple_hash"],
                "seedTupleHash": seed_pack["canonicalSeedTupleHash"],
                "gatewayServiceRefs": env_spec["gatewayServiceRefs"],
                "routeFamilyRefs": env_spec["routeFamilyRefs"],
            }
        )
        preview_environment_rows.append(
            {
                **env_spec,
                "topologyTupleHash": ring_manifest["topology_tuple_hash"],
                "runtimeTupleHash": runtime_tuple_hash,
                "seededDomainRefs": seed_pack["seededDomainRefs"],
                "seedVersion": seed_pack["seedVersion"],
                "syntheticDataClass": "synthetic_only_governed_preview",
                "driftPolicyRefs": [
                    "pdp_runtime_tuple_hash_match",
                    "pdp_seed_fixture_hash_match",
                    "pdp_banner_marker_presence",
                    "pdp_ttl_expiry_enforced",
                ],
                "environmentTrustBoundaryRefs": ring_manifest["trust_zone_boundary_refs"],
                "previewIngressRefs": ring_manifest["ingress_refs"],
                "previewDataStoreRefs": ring_manifest["data_store_refs"],
                "previewQueueRefs": ring_manifest["queue_refs"],
                "requiredAssuranceSliceRefs": ring_manifest["required_assurance_slice_refs"],
                "sourceRefs": [
                    "prompt/092.md",
                    f"data/analysis/runtime_topology_manifest.json#{env_spec['environmentRing']}",
                    f"data/analysis/gateway_surface_manifest.json#{env_spec['previewEnvironmentRef']}",
                    f"data/analysis/preview_seed_pack_manifest.json#{env_spec['seedPackRef']}",
                ],
            }
        )

    preview_env_by_ref = {row["previewEnvironmentRef"]: row for row in preview_environment_rows}
    reset_event_rows: list[dict[str, Any]] = []
    for event in RESET_EVENT_SPECS:
        env_row = preview_env_by_ref[event["previewEnvironmentRef"]]
        reset_event_rows.append(
            {
                **event,
                "seedPackRef": env_row["seedPackRef"],
                "runtimeTupleHash": env_row["runtimeTupleHash"],
                "environmentState": env_row["state"],
            }
        )

    reset_matrix_rows: list[dict[str, str]] = []
    for env_row in preview_environment_rows:
        seed_pack = seed_pack_by_ref[env_row["seedPackRef"]]
        for substrate in seed_pack["substrateFixtures"]:
            drift_policy_ref = (
                "pdp_banner_marker_presence"
                if substrate["substrateRef"] == "browser_surface_banner"
                else "pdp_seed_fixture_hash_match"
            )
            reset_matrix_rows.append(
                {
                    "preview_environment_ref": env_row["previewEnvironmentRef"],
                    "environment_ring": env_row["environmentRing"],
                    "seed_pack_ref": env_row["seedPackRef"],
                    "substrate_ref": substrate["substrateRef"],
                    "fixture_set_ref": substrate["fixtureSetRef"],
                    "reset_mode": substrate["resetMode"],
                    "expected_tuple_hash": substrate["tupleHash"],
                    "drift_policy_ref": drift_policy_ref,
                    "browser_banner_marker": env_row["browserBannerMarker"],
                    "teardown_after_expiry": "true" if env_row["state"] == "expired" else "false",
                }
            )

    preview_environment_manifest = {
        "task_id": TASK_ID,
        "generated_at": TIMESTAMP,
        "captured_on": CAPTURED_ON,
        "visual_mode": VISUAL_MODE,
        "mission": MISSION,
        "source_precedence": SOURCE_PRECEDENCE,
        "upstream_inputs": [
            "data/analysis/runtime_topology_manifest.json",
            "data/analysis/gateway_surface_manifest.json",
            "data/analysis/seed_dataset_matrix.csv",
            "data/analysis/mock_account_seed_plan.json",
            "data/analysis/cache_namespace_manifest.json",
            "data/analysis/live_transport_topology_manifest.json",
            "data/analysis/domain_store_manifest.json",
            "data/analysis/fhir_store_manifest.json",
            "data/analysis/object_storage_class_manifest.json",
            "data/analysis/event_broker_topology_manifest.json",
            "data/analysis/secret_class_manifest.json",
            "data/analysis/supply_chain_and_provenance_matrix.json",
        ],
        "assumptions": [
            "ASSUMPTION_092_PREVIEW_RING_USES_CI_PREVIEW_AND_PREPROD_ONLY::Local rehearsal remains scriptable but the governed preview fleet binds to ci-preview and preprod tuples.",
            "ASSUMPTION_092_BROWSER_BANNER_MARKERS_ARE_ROUTED_THROUGH_STATIC_BUNDLE_INJECTION::Later frontend shells may consume the same banner payload without changing its semantics.",
        ],
        "follow_on_dependencies": [
            "FOLLOW_ON_DEPENDENCY_091_NONPROD_PROMOTION_ATTESTATION_PENDING",
            "FOLLOW_ON_DEPENDENCY_094_RUNTIME_PUBLICATION_BUNDLE_PENDING",
            "FOLLOW_ON_DEPENDENCY_097_WAVE_OBSERVATION_POLICY_PENDING",
            "FOLLOW_ON_DEPENDENCY_101_BACKUP_RESTORE_OPERATIONAL_SNAPSHOTS_PENDING",
            "FOLLOW_ON_DEPENDENCY_102_NONPROD_CANARY_AND_ROLLBACK_DEPTH_PENDING",
        ],
        "summary": {
            "preview_environment_count": len(preview_environment_rows),
            "seed_pack_count": len(seed_pack_rows),
            "scenario_count": len(SCENARIO_SPECS),
            "reset_event_count": len(reset_event_rows),
            "reset_matrix_row_count": len(reset_matrix_rows),
            "ready_environment_count": sum(1 for row in preview_environment_rows if row["state"] == "ready"),
            "drifted_environment_count": sum(1 for row in preview_environment_rows if row["state"] == "drifted"),
            "expiring_environment_count": sum(1 for row in preview_environment_rows if row["state"] == "expiring"),
            "expired_environment_count": sum(1 for row in preview_environment_rows if row["state"] == "expired"),
            "active_preview_count": sum(1 for row in preview_environment_rows if row["state"] != "expired"),
            "expiring_window_count": sum(
                1 for row in preview_environment_rows if row["expiryWindow"] == "under_6h"
            ),
            "reset_failure_count": sum(1 for row in reset_event_rows if row["eventState"] == "failed"),
            "drift_alert_count": sum(
                1 for row in preview_environment_rows if row["driftState"] != "clean"
            ),
            "seed_fixture_pack_count": seed_fixture_pack_count,
            "supply_chain_stage_count": supply_chain_stage_count,
            "cache_namespace_count": cache_manifest["summary"]["cache_namespace_count"],
            "live_channel_count": live_manifest["summary"]["live_channel_count"],
            "event_queue_group_count": event_broker_manifest["summary"]["queue_group_count"],
            "secret_class_count": secret_class_manifest["summary"]["secret_class_count"],
            "object_storage_class_count": object_storage_manifest["summary"]["storage_class_count"],
        },
        "preview_environments": preview_environment_rows,
        "reset_events": reset_event_rows,
        "drift_policies": DRIFT_POLICIES,
        "browser_access_rules": BROWSER_ACCESS_RULES,
        "local_bootstrap": LOCAL_BOOTSTRAP,
        "orchestration_bindings": [
            {
                "bindingRef": "preview_env_terraform_realization",
                "terraformMainRef": "infra/preview-environments/terraform/main.tf",
                "nonprodEnvironmentRings": ["ci-preview", "preprod"],
                "notes": "Provider-neutral preview environment descriptors remain synthetic-only and TTL-bound.",
            },
            {
                "bindingRef": "preview_env_local_rehearsal",
                "terraformMainRef": "infra/preview-environments/local/preview-environment-emulator.compose.yaml",
                "nonprodEnvironmentRings": ["ci-preview", "preprod"],
                "notes": "Local rehearsal mirrors the exact seed-pack and reset contract.",
            },
        ],
        "manifest_digest_ref": stable_hash(
            {
                "previewEnvironments": [row["previewEnvironmentRef"] for row in preview_environment_rows],
                "seedPacks": [row["seedPackRef"] for row in seed_pack_rows],
                "resetEvents": [row["resetEventRef"] for row in reset_event_rows],
            }
        ),
    }

    preview_seed_pack_manifest = {
        "task_id": TASK_ID,
        "generated_at": TIMESTAMP,
        "captured_on": CAPTURED_ON,
        "visual_mode": VISUAL_MODE,
        "mission": "Publish deterministic preview seed packs, scenario coverage, and substrate fixture hashes for reset-safe preview environments.",
        "source_precedence": SOURCE_PRECEDENCE,
        "upstream_inputs": [
            "data/analysis/seed_dataset_matrix.csv",
            "data/analysis/mock_account_seed_plan.json",
            "data/analysis/gateway_surface_manifest.json",
        ],
        "summary": {
            "seed_pack_count": len(seed_pack_rows),
            "scenario_count": len(SCENARIO_SPECS),
            "reference_case_backed_scenario_count": sum(
                1 for row in SCENARIO_SPECS if row["referenceCaseRef"]
            ),
            "structure_only_scenario_count": sum(
                1 for row in SCENARIO_SPECS if row["referenceCaseRef"] is None
            ),
            "degraded_scenario_count": sum(
                1 for row in SCENARIO_SPECS if row["scenarioState"] == "degraded"
            ),
            "recovery_scenario_count": sum(
                1 for row in SCENARIO_SPECS if row["scenarioState"] == "recovery"
            ),
            "seeded_domain_count": len(
                {
                    domain
                    for row in seed_pack_rows
                    for domain in row["seededDomainRefs"]
                }
            ),
            "route_family_count": len(
                {route for row in seed_pack_rows for route in row["routeFamilyRefs"]}
            ),
            "substrate_fixture_count": sum(
                len(row["substrateFixtures"]) for row in seed_pack_rows
            ),
        },
        "seed_packs": seed_pack_rows,
        "scenario_catalog": SCENARIO_SPECS,
        "substrate_restore_law": {
            "domain_store_manifest_ref": "data/analysis/domain_store_manifest.json",
            "fhir_store_manifest_ref": "data/analysis/fhir_store_manifest.json",
            "event_broker_topology_manifest_ref": "data/analysis/event_broker_topology_manifest.json",
            "cache_namespace_manifest_ref": "data/analysis/cache_namespace_manifest.json",
            "live_transport_topology_manifest_ref": "data/analysis/live_transport_topology_manifest.json",
            "object_storage_class_manifest_ref": "data/analysis/object_storage_class_manifest.json",
            "secret_class_manifest_ref": "data/analysis/secret_class_manifest.json",
        },
        "manifest_digest_ref": stable_hash(
            {
                "seedPacks": [row["seedPackRef"] for row in seed_pack_rows],
                "scenarios": [row["scenarioRef"] for row in SCENARIO_SPECS],
            }
        ),
    }

    PREVIEW_ENVIRONMENT_MANIFEST_PATH.write_text(
        json.dumps(preview_environment_manifest, indent=2) + "\n",
        encoding="utf-8",
    )
    PREVIEW_SEED_PACK_MANIFEST_PATH.write_text(
        json.dumps(preview_seed_pack_manifest, indent=2) + "\n",
        encoding="utf-8",
    )
    with PREVIEW_RESET_MATRIX_PATH.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=list(reset_matrix_rows[0].keys()))
        writer.writeheader()
        writer.writerows(reset_matrix_rows)

    runtime_topology["preview_environment_manifest_ref"] = "data/analysis/preview_environment_manifest.json"
    runtime_topology["preview_seed_pack_manifest_ref"] = "data/analysis/preview_seed_pack_manifest.json"
    runtime_topology["preview_reset_matrix_ref"] = "data/analysis/preview_reset_matrix.csv"
    RUNTIME_TOPOLOGY_PATH.write_text(json.dumps(runtime_topology, indent=2) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()
