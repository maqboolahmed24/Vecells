#!/usr/bin/env python3
from __future__ import annotations

import csv
import hashlib
import json
import re
from datetime import datetime, timezone
from pathlib import Path
from textwrap import dedent
from typing import Any


ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = ROOT / "data" / "analysis"
DOCS_DIR = ROOT / "docs" / "programme"
TESTS_DIR = ROOT / "tests" / "playwright"

CHECKLIST_PATH = ROOT / "prompt" / "checklist.md"
ROOT_PACKAGE_PATH = ROOT / "package.json"
PLAYWRIGHT_PACKAGE_PATH = TESTS_DIR / "package.json"

TRACK_GROUPS_PATH = DATA_DIR / "parallel_foundation_track_groups.json"
ELIGIBILITY_CSV_PATH = DATA_DIR / "parallel_track_eligibility.csv"
PREREQUISITE_EDGES_CSV_PATH = DATA_DIR / "parallel_track_prerequisite_edges.csv"
SHARED_SEAMS_PATH = DATA_DIR / "parallel_track_shared_seams.json"
VERDICT_PATH = DATA_DIR / "parallel_foundation_gate_verdict.json"

GATE_DOC_PATH = DOCS_DIR / "61_parallel_foundation_tracks_gate.md"
ELIGIBILITY_DOC_PATH = DOCS_DIR / "61_parallel_track_eligibility_matrix.md"
SHARD_DOC_PATH = DOCS_DIR / "61_parallel_dependency_shard_map.md"
COCKPIT_PATH = DOCS_DIR / "61_parallel_foundation_gate_cockpit.html"

VALIDATOR_PATH = ROOT / "tools" / "analysis" / "validate_parallel_foundation_gate.py"
SPEC_PATH = TESTS_DIR / "parallel-foundation-gate-cockpit.spec.js"

TRACK_PLAN_PATH = ROOT / "docs" / "programme" / "17_parallel_track_plan.md"
FOUNDATION_GATE_PATH = ROOT / "docs" / "programme" / "20_phase0_gate_verdict_and_blockers.md"
REPO_TOPOLOGY_PATH = DATA_DIR / "repo_topology_manifest.json"
DOMAIN_PACKAGE_PATH = DATA_DIR / "domain_package_manifest.json"
RUNTIME_TOPOLOGY_PATH = DATA_DIR / "runtime_topology_manifest.json"
GATEWAY_SURFACES_PATH = DATA_DIR / "gateway_bff_surfaces.json"
EVENT_REGISTRY_PATH = DATA_DIR / "canonical_event_contracts.json"
FHIR_CONTRACT_PATH = DATA_DIR / "fhir_representation_contracts.json"
FRONTEND_MANIFESTS_PATH = DATA_DIR / "frontend_contract_manifests.json"
RELEASE_MATRIX_PATH = DATA_DIR / "release_contract_verification_matrix.json"
DESIGN_BUNDLES_PATH = DATA_DIR / "design_contract_publication_bundles.json"
AUDIT_SCHEMA_PATH = DATA_DIR / "audit_record_schema.json"
TENANT_SCOPE_SCHEMA_PATH = DATA_DIR / "acting_scope_tuple_schema.json"
REQUEST_CLOSURE_SCHEMA_PATH = DATA_DIR / "request_closure_record_schema.json"
MUTATION_GATE_PATH = DATA_DIR / "route_intent_binding_schema.json"
ADAPTER_TEMPLATE_PATH = DATA_DIR / "adapter_contract_profile_template.json"
ADAPTER_DEGRADATION_PATH = DATA_DIR / "dependency_degradation_profiles.json"
VERIFICATION_SCENARIOS_PATH = DATA_DIR / "verification_scenarios.json"
REFERENCE_CASES_PATH = DATA_DIR / "reference_case_catalog.json"
SIMULATOR_CATALOG_PATH = DATA_DIR / "simulator_contract_catalog.json"
RECOVERY_POSTURE_PATH = DATA_DIR / "recovery_control_posture_rules.json"

TASK_ID = "seq_061"
VISUAL_MODE = "Parallel_Foundation_Gate"
TIMESTAMP = datetime.now(timezone.utc).replace(microsecond=0).isoformat()
CAPTURED_ON = TIMESTAMP[:10]
MISSION = (
    "Evaluate whether the Phase 0 parallel foundation block may open now, publish the exact "
    "062-126 shard map, and freeze the shared package seams, simulator-first rules, and "
    "conditional stub contracts that keep later parallel implementation from forking truth."
)

SOURCE_PRECEDENCE = [
    "prompt/061.md",
    "prompt/shared_operating_contract_056_to_065.md",
    "prompt/AGENT.md",
    "prompt/checklist.md",
    "blueprint/phase-0-the-foundation-protocol.md#0A. Delivery skeleton and repository architecture",
    "blueprint/phase-0-the-foundation-protocol.md#0B. Canonical domain kernel and state machine",
    "blueprint/phase-0-the-foundation-protocol.md#2.10A ResilienceOrchestrator",
    "blueprint/phase-0-the-foundation-protocol.md#62A-62G",
    "blueprint/phase-cards.md#Phase 0",
    "blueprint/platform-runtime-and-release-blueprint.md#OperationalReadinessSnapshot",
    "blueprint/platform-runtime-and-release-blueprint.md#Release contract verification",
    "blueprint/forensic-audit-findings.md#Restore-control patch response",
    "docs/programme/17_parallel_track_plan.md",
    "docs/programme/17_phase0_subphase_execution_plan.md",
    "docs/programme/20_phase0_gate_verdict_and_blockers.md",
    "data/analysis/repo_topology_manifest.json",
    "data/analysis/domain_package_manifest.json",
    "data/analysis/runtime_topology_manifest.json",
    "data/analysis/gateway_bff_surfaces.json",
    "data/analysis/canonical_event_contracts.json",
    "data/analysis/fhir_representation_contracts.json",
    "data/analysis/frontend_contract_manifests.json",
    "data/analysis/release_contract_verification_matrix.json",
    "data/analysis/design_contract_publication_bundles.json",
    "data/analysis/adapter_contract_profile_template.json",
    "data/analysis/dependency_degradation_profiles.json",
    "data/analysis/verification_scenarios.json",
    "data/analysis/reference_case_catalog.json",
    "data/analysis/recovery_control_posture_rules.json",
]

TRACK_GROUP_LABELS = {
    "backend_kernel": "Backend kernel and authoritative domain services",
    "runtime_control_plane": "Runtime publication, infrastructure, and control plane",
    "frontend_shells": "Frontend contract foundation and shell seeding",
    "assurance": "Assurance, safety, privacy, and onboarding evidence",
}

SHARD_DEFINITIONS = [
    {
        "shardId": "SHARD_061_BACKEND_AGGREGATES",
        "label": "Backend aggregate roots and persistence law",
        "trackGroup": "backend_kernel",
        "start": 62,
        "end": 76,
        "claimableMode": "eligible",
        "requiredSharedSeamRefs": [
            "SEAM_061_PACKAGE_BOUNDARY_OWNERSHIP",
            "SEAM_061_DOMAIN_PUBLIC_ENTRYPOINTS",
            "SEAM_061_EVENT_ENVELOPE_REGISTRY",
            "SEAM_061_MUTATION_AND_SETTLEMENT_SCHEMAS",
            "SEAM_061_ADAPTER_AND_DEGRADATION_PROFILES",
            "SEAM_061_RECOVERY_AND_READINESS_TUPLES",
        ],
        "requiredInterfaceStubRefs": [],
        "blockingReasonRefs": [],
        "notes": (
            "These tracks start immediately on frozen domain, event, mutation, adapter, simulator, "
            "and recovery law; they must not import sibling private src trees or infer schema ownership."
        ),
    },
    {
        "shardId": "SHARD_061_BACKEND_COORDINATORS",
        "label": "Backend coordinators, projections, and simulator backplanes",
        "trackGroup": "backend_kernel",
        "start": 77,
        "end": 83,
        "claimableMode": "conditional",
        "requiredSharedSeamRefs": [
            "SEAM_061_PACKAGE_BOUNDARY_OWNERSHIP",
            "SEAM_061_DOMAIN_PUBLIC_ENTRYPOINTS",
            "SEAM_061_EVENT_ENVELOPE_REGISTRY",
            "SEAM_061_MUTATION_AND_SETTLEMENT_SCHEMAS",
            "SEAM_061_SIMULATOR_AND_REFERENCE_FIXTURES",
            "SEAM_061_AUDIT_SCOPE_AND_ASSURANCE",
        ],
        "requiredInterfaceStubRefs": [
            "STUB_061_DOMAIN_MUTATION_PUBLIC_ENTRYPOINTS",
            "STUB_061_EVENT_TRANSITION_ENVELOPES",
            "STUB_061_QUERY_AND_LIVE_CHANNEL_REGISTRY",
            "STUB_061_SIMULATOR_FIXTURE_REGISTRY",
        ],
        "blockingReasonRefs": ["CONDITION_061_SHARED_BACKEND_STUBS"],
        "notes": (
            "These tracks may open once the declared public-entrypoint and event stubs exist in shared "
            "packages; service code may not reach into unfinished sibling aggregates."
        ),
    },
    {
        "shardId": "SHARD_061_RUNTIME_SUBSTRATE",
        "label": "Runtime substrate, networking, and observability baseline",
        "trackGroup": "runtime_control_plane",
        "start": 84,
        "end": 93,
        "claimableMode": "eligible",
        "requiredSharedSeamRefs": [
            "SEAM_061_PACKAGE_BOUNDARY_OWNERSHIP",
            "SEAM_061_RUNTIME_PUBLICATION_AND_TOPOLOGY",
            "SEAM_061_GATEWAY_ROUTE_AND_SURFACE_OWNERSHIP",
            "SEAM_061_MUTATION_AND_SETTLEMENT_SCHEMAS",
            "SEAM_061_AUDIT_SCOPE_AND_ASSURANCE",
            "SEAM_061_RECOVERY_AND_READINESS_TUPLES",
        ],
        "requiredInterfaceStubRefs": [],
        "blockingReasonRefs": [],
        "notes": (
            "These tracks start on already-frozen topology, trust-zone, gateway-surface, release, "
            "and recovery tuples. They may not reconstruct truth from shell-local configs or live-provider state."
        ),
    },
    {
        "shardId": "SHARD_061_RUNTIME_GOVERNORS",
        "label": "Runtime publication governors and recovery automation",
        "trackGroup": "runtime_control_plane",
        "start": 94,
        "end": 102,
        "claimableMode": "conditional",
        "requiredSharedSeamRefs": [
            "SEAM_061_PACKAGE_BOUNDARY_OWNERSHIP",
            "SEAM_061_RUNTIME_PUBLICATION_AND_TOPOLOGY",
            "SEAM_061_MUTATION_AND_SETTLEMENT_SCHEMAS",
            "SEAM_061_RECOVERY_AND_READINESS_TUPLES",
            "SEAM_061_ADAPTER_AND_DEGRADATION_PROFILES",
            "SEAM_061_SIMULATOR_AND_REFERENCE_FIXTURES",
            "SEAM_061_AUDIT_SCOPE_AND_ASSURANCE",
        ],
        "requiredInterfaceStubRefs": [
            "STUB_061_RUNTIME_SUBSTRATE_HANDOFF",
            "STUB_061_RELEASE_PUBLICATION_ASSEMBLER",
            "STUB_061_RECOVERY_CONTROL_HANDOFF",
            "STUB_061_ASSURANCE_SLICE_INDEX",
        ],
        "blockingReasonRefs": ["CONDITION_061_RUNTIME_SUBSTRATE_HANDOFFS"],
        "notes": (
            "These tracks wait on published substrate handoffs and release-control assembler stubs. "
            "They may not invent runtime tuple glue in service-local code."
        ),
    },
    {
        "shardId": "SHARD_061_FRONTEND_FOUNDATION",
        "label": "Frontend contract kernel, shell framework, and shared interaction law",
        "trackGroup": "frontend_shells",
        "start": 103,
        "end": 114,
        "claimableMode": "eligible",
        "requiredSharedSeamRefs": [
            "SEAM_061_PACKAGE_BOUNDARY_OWNERSHIP",
            "SEAM_061_GATEWAY_ROUTE_AND_SURFACE_OWNERSHIP",
            "SEAM_061_MUTATION_AND_SETTLEMENT_SCHEMAS",
            "SEAM_061_RUNTIME_PUBLICATION_AND_TOPOLOGY",
            "SEAM_061_DESIGN_ACCESSIBILITY_AND_AUTOMATION",
            "SEAM_061_RECOVERY_AND_READINESS_TUPLES",
        ],
        "requiredInterfaceStubRefs": [],
        "blockingReasonRefs": [],
        "notes": (
            "These tracks start on frozen frontend manifest, design publication, accessibility, "
            "automation, mutation, and recovery law. They must not fabricate sibling-private UI contracts."
        ),
    },
    {
        "shardId": "SHARD_061_FRONTEND_SEEDS",
        "label": "Audience shell seed routes and mock-projection surfaces",
        "trackGroup": "frontend_shells",
        "start": 115,
        "end": 120,
        "claimableMode": "conditional",
        "requiredSharedSeamRefs": [
            "SEAM_061_PACKAGE_BOUNDARY_OWNERSHIP",
            "SEAM_061_GATEWAY_ROUTE_AND_SURFACE_OWNERSHIP",
            "SEAM_061_MUTATION_AND_SETTLEMENT_SCHEMAS",
            "SEAM_061_RUNTIME_PUBLICATION_AND_TOPOLOGY",
            "SEAM_061_DESIGN_ACCESSIBILITY_AND_AUTOMATION",
            "SEAM_061_SIMULATOR_AND_REFERENCE_FIXTURES",
            "SEAM_061_RECOVERY_AND_READINESS_TUPLES",
        ],
        "requiredInterfaceStubRefs": [
            "STUB_061_FRONTEND_SHELL_FRAMEWORK_EXPORTS",
            "STUB_061_MOCK_PROJECTION_FIXTURE_CATALOG",
            "STUB_061_QUERY_AND_LIVE_CHANNEL_REGISTRY",
            "STUB_061_FRONTEND_AUTOMATION_VOCABULARY",
        ],
        "blockingReasonRefs": ["CONDITION_061_FRONTEND_SEED_EXPORTS"],
        "notes": (
            "Seed-shell work may open once the shell framework, mock projection catalog, and automation "
            "vocabulary are published from shared packages; shells may not deep-import sibling prototypes."
        ),
    },
    {
        "shardId": "SHARD_061_ASSURANCE",
        "label": "Assurance, safety, privacy, and partner-evidence lanes",
        "trackGroup": "assurance",
        "start": 121,
        "end": 126,
        "claimableMode": "eligible",
        "requiredSharedSeamRefs": [
            "SEAM_061_PACKAGE_BOUNDARY_OWNERSHIP",
            "SEAM_061_AUDIT_SCOPE_AND_ASSURANCE",
            "SEAM_061_RUNTIME_PUBLICATION_AND_TOPOLOGY",
            "SEAM_061_SIMULATOR_AND_REFERENCE_FIXTURES",
            "SEAM_061_RECOVERY_AND_READINESS_TUPLES",
        ],
        "requiredInterfaceStubRefs": [],
        "blockingReasonRefs": [],
        "notes": (
            "Assurance tracks can start immediately because the partner inventory, simulator-first posture, "
            "audit controls, privacy baselines, and recovery tuple are already frozen and source-backed."
        ),
    },
]

SIMULATOR_IDS = [
    "sim_booking_capacity_feed_twin",
    "sim_booking_provider_confirmation_twin",
    "sim_email_notification_twin",
    "sim_im1_principal_system_emis_twin",
    "sim_im1_principal_system_tpp_twin",
    "sim_mesh_message_path_twin",
    "sim_nhs_login_auth_session_twin",
    "sim_optional_pds_enrichment_twin",
    "sim_pharmacy_dispatch_transport_twin",
    "sim_pharmacy_visibility_update_record_twin",
    "sim_sms_delivery_twin",
    "sim_telephony_ivr_twin",
    "sim_transcription_processing_twin",
]

PLAYWRIGHT_SCRIPT_UPDATES = {
    "build": (
        "node --check foundation-shell-gallery.spec.js && "
        "node --check api-contract-registry-explorer.spec.js && "
        "node --check submission-promotion-atlas.spec.js && "
        "node --check replay-collision-studio.spec.js && "
        "node --check identity-access-atlas.spec.js && "
        "node --check identity-repair-reachability-command-center.spec.js && "
        "node --check reachability-truth-studio.spec.js && "
        "node --check duplicate-resolution-workbench.spec.js && "
        "node --check closure-governance-atlas.spec.js && "
        "node --check safety-assimilation-observatory.spec.js && "
        "node --check control-plane-lab.spec.js && "
        "node --check settlement-envelope-atlas.spec.js && "
        "node --check runtime-topology-atlas.spec.js && "
        "node --check runtime-network-trust-atlas.spec.js && "
        "node --check data-storage-topology-atlas.spec.js && "
        "node --check object-storage-retention-atlas.spec.js && "
        "node --check secret-and-key-rotation-atlas.spec.js && "
        "node --check gateway-surface-studio.spec.js && "
        "node --check gateway-surface-authority-atlas.spec.js && "
        "node --check event-registry-studio.spec.js && "
        "node --check event-spine-topology-atlas.spec.js && "
        "node --check live-update-and-cache-atlas.spec.js && "
        "node --check fhir-representation-atlas.spec.js && "
        "node --check frontend-contract-studio.spec.js && "
        "node --check release-parity-cockpit.spec.js && "
        "node --check design-contract-studio.spec.js && "
        "node --check audit-ledger-explorer.spec.js && "
        "node --check scope-isolation-atlas.spec.js && "
        "node --check lifecycle-coordinator-lab.spec.js && "
        "node --check scoped-mutation-gate-lab.spec.js && "
        "node --check adapter-contract-studio.spec.js && "
        "node --check verification-cockpit.spec.js && "
        "node --check seed-and-simulator-studio.spec.js && "
        "node --check parallel-foundation-gate-cockpit.spec.js && "
        "node --check resilience-control-lab.spec.js && "
        "node --check reservation-confirmation-truth-lab.spec.js && "
        "node --check reservation-queue-control-studio.spec.js && "
        "node --check projection-rebuild-observatory.spec.js && "
        "node --check preview-environment-control-room.spec.js && "
        "node --check runtime-publication-bundle-console.spec.js && "
        "node --check runtime-topology-publication-atlas.spec.js && "
        "node --check migration-and-backfill-control-room.spec.js && "
        "node --check edge-correlation-spine-explorer.spec.js && "
        "node --check dependency-degradation-atlas.spec.js && "
        "node --check release-watch-pipeline-cockpit.spec.js && "
        "node --check resilience-baseline-cockpit.spec.js && "
        "node --check canary-and-rollback-cockpit.spec.js && "
        "node --check build-provenance-cockpit.spec.js"
    ),
    "lint": (
        "eslint foundation-shell-gallery.spec.js api-contract-registry-explorer.spec.js submission-promotion-atlas.spec.js replay-collision-studio.spec.js identity-access-atlas.spec.js identity-repair-reachability-command-center.spec.js reachability-truth-studio.spec.js duplicate-resolution-workbench.spec.js closure-governance-atlas.spec.js safety-assimilation-observatory.spec.js control-plane-lab.spec.js settlement-envelope-atlas.spec.js runtime-topology-atlas.spec.js runtime-network-trust-atlas.spec.js data-storage-topology-atlas.spec.js object-storage-retention-atlas.spec.js "
        "secret-and-key-rotation-atlas.spec.js gateway-surface-studio.spec.js gateway-surface-authority-atlas.spec.js event-registry-studio.spec.js event-spine-topology-atlas.spec.js live-update-and-cache-atlas.spec.js "
        "fhir-representation-atlas.spec.js frontend-contract-studio.spec.js "
        "release-parity-cockpit.spec.js design-contract-studio.spec.js "
        "audit-ledger-explorer.spec.js scope-isolation-atlas.spec.js "
        "lifecycle-coordinator-lab.spec.js scoped-mutation-gate-lab.spec.js "
        "adapter-contract-studio.spec.js verification-cockpit.spec.js "
        "seed-and-simulator-studio.spec.js parallel-foundation-gate-cockpit.spec.js "
        "resilience-control-lab.spec.js reservation-confirmation-truth-lab.spec.js "
        "reservation-queue-control-studio.spec.js dependency-degradation-atlas.spec.js release-watch-pipeline-cockpit.spec.js resilience-baseline-cockpit.spec.js canary-and-rollback-cockpit.spec.js runtime-topology-publication-atlas.spec.js build-provenance-cockpit.spec.js && eslint secret-and-key-rotation-atlas.spec.js && eslint projection-rebuild-observatory.spec.js && eslint preview-environment-control-room.spec.js && eslint runtime-publication-bundle-console.spec.js && eslint runtime-topology-publication-atlas.spec.js && eslint migration-and-backfill-control-room.spec.js && eslint edge-correlation-spine-explorer.spec.js && eslint dependency-degradation-atlas.spec.js && eslint release-watch-pipeline-cockpit.spec.js && eslint resilience-baseline-cockpit.spec.js && eslint canary-and-rollback-cockpit.spec.js && eslint build-provenance-cockpit.spec.js"
    ),
    "test": (
        "node foundation-shell-gallery.spec.js && "
        "node api-contract-registry-explorer.spec.js && "
        "node submission-promotion-atlas.spec.js && "
        "node replay-collision-studio.spec.js && "
        "node identity-access-atlas.spec.js && "
        "node identity-repair-reachability-command-center.spec.js && "
        "node reachability-truth-studio.spec.js && "
        "node duplicate-resolution-workbench.spec.js && "
        "node closure-governance-atlas.spec.js && "
        "node safety-assimilation-observatory.spec.js && "
        "node control-plane-lab.spec.js && "
        "node settlement-envelope-atlas.spec.js && "
        "node runtime-topology-atlas.spec.js && "
        "node runtime-network-trust-atlas.spec.js && "
        "node data-storage-topology-atlas.spec.js && "
        "node object-storage-retention-atlas.spec.js && "
        "node secret-and-key-rotation-atlas.spec.js && "
        "node gateway-surface-studio.spec.js && "
        "node gateway-surface-authority-atlas.spec.js && "
        "node event-registry-studio.spec.js && "
        "node event-spine-topology-atlas.spec.js && "
        "node live-update-and-cache-atlas.spec.js && "
        "node fhir-representation-atlas.spec.js && "
        "node frontend-contract-studio.spec.js && "
        "node release-parity-cockpit.spec.js && "
        "node design-contract-studio.spec.js && "
        "node audit-ledger-explorer.spec.js && "
        "node scope-isolation-atlas.spec.js && "
        "node lifecycle-coordinator-lab.spec.js && "
        "node scoped-mutation-gate-lab.spec.js && "
        "node adapter-contract-studio.spec.js && "
        "node verification-cockpit.spec.js && "
        "node seed-and-simulator-studio.spec.js && "
        "node parallel-foundation-gate-cockpit.spec.js && "
        "node resilience-control-lab.spec.js && "
        "node reservation-confirmation-truth-lab.spec.js && "
        "node reservation-queue-control-studio.spec.js && "
        "node projection-rebuild-observatory.spec.js && "
        "node preview-environment-control-room.spec.js && "
        "node runtime-publication-bundle-console.spec.js && "
        "node runtime-topology-publication-atlas.spec.js && "
        "node migration-and-backfill-control-room.spec.js && "
        "node edge-correlation-spine-explorer.spec.js && "
        "node dependency-degradation-atlas.spec.js && "
        "node release-watch-pipeline-cockpit.spec.js && "
        "node resilience-baseline-cockpit.spec.js && "
        "node canary-and-rollback-cockpit.spec.js && "
        "node build-provenance-cockpit.spec.js"
    ),
    "typecheck": (
        "node --check foundation-shell-gallery.spec.js && "
        "node --check api-contract-registry-explorer.spec.js && "
        "node --check submission-promotion-atlas.spec.js && "
        "node --check replay-collision-studio.spec.js && "
        "node --check identity-access-atlas.spec.js && "
        "node --check identity-repair-reachability-command-center.spec.js && "
        "node --check reachability-truth-studio.spec.js && "
        "node --check duplicate-resolution-workbench.spec.js && "
        "node --check closure-governance-atlas.spec.js && "
        "node --check safety-assimilation-observatory.spec.js && "
        "node --check control-plane-lab.spec.js && "
        "node --check settlement-envelope-atlas.spec.js && "
        "node --check runtime-topology-atlas.spec.js && "
        "node --check runtime-network-trust-atlas.spec.js && "
        "node --check data-storage-topology-atlas.spec.js && "
        "node --check object-storage-retention-atlas.spec.js && "
        "node --check secret-and-key-rotation-atlas.spec.js && "
        "node --check gateway-surface-studio.spec.js && "
        "node --check gateway-surface-authority-atlas.spec.js && "
        "node --check event-registry-studio.spec.js && "
        "node --check event-spine-topology-atlas.spec.js && "
        "node --check live-update-and-cache-atlas.spec.js && "
        "node --check fhir-representation-atlas.spec.js && "
        "node --check frontend-contract-studio.spec.js && "
        "node --check release-parity-cockpit.spec.js && "
        "node --check design-contract-studio.spec.js && "
        "node --check audit-ledger-explorer.spec.js && "
        "node --check scope-isolation-atlas.spec.js && "
        "node --check lifecycle-coordinator-lab.spec.js && "
        "node --check scoped-mutation-gate-lab.spec.js && "
        "node --check adapter-contract-studio.spec.js && "
        "node --check verification-cockpit.spec.js && "
        "node --check seed-and-simulator-studio.spec.js && "
        "node --check parallel-foundation-gate-cockpit.spec.js && "
        "node --check resilience-control-lab.spec.js && "
        "node --check reservation-confirmation-truth-lab.spec.js && "
        "node --check reservation-queue-control-studio.spec.js && "
        "node --check projection-rebuild-observatory.spec.js && "
        "node --check preview-environment-control-room.spec.js && "
        "node --check runtime-publication-bundle-console.spec.js && "
        "node --check runtime-topology-publication-atlas.spec.js && "
        "node --check migration-and-backfill-control-room.spec.js && "
        "node --check edge-correlation-spine-explorer.spec.js && "
        "node --check dependency-degradation-atlas.spec.js && "
        "node --check release-watch-pipeline-cockpit.spec.js && "
        "node --check resilience-baseline-cockpit.spec.js && "
        "node --check canary-and-rollback-cockpit.spec.js && "
        "node --check build-provenance-cockpit.spec.js"
    ),
    "e2e": (
        "node foundation-shell-gallery.spec.js --run && "
        "node api-contract-registry-explorer.spec.js --run && "
        "node submission-promotion-atlas.spec.js --run && "
        "node replay-collision-studio.spec.js --run && "
        "node identity-access-atlas.spec.js --run && "
        "node identity-repair-reachability-command-center.spec.js --run && "
        "node reachability-truth-studio.spec.js --run && "
        "node duplicate-resolution-workbench.spec.js --run && "
        "node closure-governance-atlas.spec.js --run && "
        "node safety-assimilation-observatory.spec.js --run && "
        "node control-plane-lab.spec.js --run && "
        "node settlement-envelope-atlas.spec.js --run && "
        "node runtime-topology-atlas.spec.js --run && "
        "node runtime-network-trust-atlas.spec.js --run && "
        "node data-storage-topology-atlas.spec.js --run && "
        "node object-storage-retention-atlas.spec.js --run && "
        "node secret-and-key-rotation-atlas.spec.js --run && "
        "node gateway-surface-studio.spec.js --run && "
        "node gateway-surface-authority-atlas.spec.js --run && "
        "node event-registry-studio.spec.js --run && "
        "node event-spine-topology-atlas.spec.js --run && "
        "node live-update-and-cache-atlas.spec.js --run && "
        "node fhir-representation-atlas.spec.js --run && "
        "node frontend-contract-studio.spec.js --run && "
        "node release-parity-cockpit.spec.js --run && "
        "node design-contract-studio.spec.js --run && "
        "node audit-ledger-explorer.spec.js --run && "
        "node scope-isolation-atlas.spec.js --run && "
        "node lifecycle-coordinator-lab.spec.js --run && "
        "node scoped-mutation-gate-lab.spec.js --run && "
        "node adapter-contract-studio.spec.js --run && "
        "node verification-cockpit.spec.js --run && "
        "node seed-and-simulator-studio.spec.js --run && "
        "node parallel-foundation-gate-cockpit.spec.js --run && "
        "node resilience-control-lab.spec.js --run && "
        "node reservation-confirmation-truth-lab.spec.js --run && "
        "node reservation-queue-control-studio.spec.js --run && "
        "node projection-rebuild-observatory.spec.js --run && "
        "node preview-environment-control-room.spec.js --run && "
        "node runtime-publication-bundle-console.spec.js --run && "
        "node runtime-topology-publication-atlas.spec.js --run && "
        "node migration-and-backfill-control-room.spec.js --run && "
        "node edge-correlation-spine-explorer.spec.js --run && "
        "node dependency-degradation-atlas.spec.js --run && "
        "node release-watch-pipeline-cockpit.spec.js --run && "
        "node resilience-baseline-cockpit.spec.js --run && "
        "node canary-and-rollback-cockpit.spec.js --run && "
        "node build-provenance-cockpit.spec.js --run"
    ),
}

SHARED_SEAMS = [
    {
        "seamId": "SEAM_061_PACKAGE_BOUNDARY_OWNERSHIP",
        "title": "Repo topology, package homes, and ownership fences",
        "seamClass": "ownership_boundary",
        "packageRefs": [],
        "artifactRefs": [
            "docs/architecture/41_repository_topology_rules.md",
            "data/analysis/repo_topology_manifest.json",
            "docs/architecture/44_domain_package_contracts.md",
            "data/analysis/domain_package_manifest.json",
        ],
        "owningSeqTaskRefs": ["seq_041", "seq_044"],
        "consumerTrackGroups": list(TRACK_GROUP_LABELS),
        "simulatorFirstState": "not_applicable",
        "sourceRefs": [
            "prompt/041.md",
            "prompt/044.md",
            "docs/programme/17_parallel_track_plan.md",
        ],
        "notes": (
            "Every parallel track must enter through one published package home and may not deep-import sibling "
            "private files or create new shadow ownership zones."
        ),
    },
    {
        "seamId": "SEAM_061_DOMAIN_PUBLIC_ENTRYPOINTS",
        "title": "Canonical aggregate IDs, lifecycle roots, and domain public entrypoints",
        "seamClass": "domain_public_api",
        "packageRefs": ["@vecells/domain-kernel"],
        "artifactRefs": [
            "packages/domain-kernel/src/index.ts",
            "docs/architecture/44_domain_package_contracts.md",
        ],
        "owningSeqTaskRefs": ["seq_043", "seq_044"],
        "consumerTrackGroups": ["backend_kernel"],
        "simulatorFirstState": "not_applicable",
        "sourceRefs": [
            "prompt/043.md",
            "prompt/044.md",
            "blueprint/phase-0-the-foundation-protocol.md#0B. Canonical domain kernel and state machine",
        ],
        "notes": (
            "Parallel backend work may compose through package-root entrypoints only; aggregate IDs, lineage keys, "
            "and tenancy/scope primitives may not be recreated per track."
        ),
    },
    {
        "seamId": "SEAM_061_EVENT_ENVELOPE_REGISTRY",
        "title": "Canonical event envelope types and schema registry",
        "seamClass": "event_registry",
        "packageRefs": ["@vecells/event-contracts"],
        "artifactRefs": [
            "packages/event-contracts/src/index.ts",
            "packages/event-contracts/schemas/catalog.json",
            "data/analysis/canonical_event_contracts.json",
        ],
        "owningSeqTaskRefs": ["seq_048"],
        "consumerTrackGroups": ["backend_kernel", "runtime_control_plane"],
        "simulatorFirstState": "not_applicable",
        "sourceRefs": [
            "prompt/048.md",
            "blueprint/phase-0-the-foundation-protocol.md#0B. Canonical domain kernel and state machine",
        ],
        "notes": (
            "Tracks may add new event definitions only through the shared registry. Service-local event envelopes are forbidden."
        ),
    },
    {
        "seamId": "SEAM_061_MUTATION_AND_SETTLEMENT_SCHEMAS",
        "title": "Writable route authority, settlement law, and frontend/runtime contract schemas",
        "seamClass": "writable_contract_schema",
        "packageRefs": ["@vecells/api-contracts"],
        "artifactRefs": [
            "packages/api-contracts/schemas/route-intent-binding.schema.json",
            "packages/api-contracts/schemas/command-settlement-record.schema.json",
            "packages/api-contracts/schemas/frontend-contract-manifest.schema.json",
            "data/analysis/frontend_contract_manifests.json",
        ],
        "owningSeqTaskRefs": ["seq_050", "seq_056"],
        "consumerTrackGroups": ["backend_kernel", "runtime_control_plane", "frontend_shells"],
        "simulatorFirstState": "not_applicable",
        "sourceRefs": [
            "prompt/050.md",
            "prompt/056.md",
            "blueprint/phase-0-the-foundation-protocol.md#1.24A RouteIntentBinding",
            "blueprint/phase-0-the-foundation-protocol.md#1.24D CommandSettlementRecord",
        ],
        "notes": (
            "No backend, runtime, or frontend track may invent a writable surface without binding it to the published route-intent and settlement schemas."
        ),
    },
    {
        "seamId": "SEAM_061_GATEWAY_ROUTE_AND_SURFACE_OWNERSHIP",
        "title": "Gateway audience surfaces, browser-visible routes, and trust-zone ownership",
        "seamClass": "surface_ownership",
        "packageRefs": ["@vecells/api-contracts", "@vecells/authz-policy"],
        "artifactRefs": [
            "data/analysis/gateway_bff_surfaces.json",
            "data/analysis/gateway_route_family_matrix.csv",
            "data/analysis/route_to_scope_requirements.csv",
        ],
        "owningSeqTaskRefs": ["seq_047", "seq_054"],
        "consumerTrackGroups": ["runtime_control_plane", "frontend_shells"],
        "simulatorFirstState": "not_applicable",
        "sourceRefs": [
            "prompt/047.md",
            "prompt/054.md",
            "docs/programme/17_parallel_track_plan.md",
        ],
        "notes": (
            "Runtime and frontend tracks must use published surface ownership and acting-scope rules rather than route-local assumptions."
        ),
    },
    {
        "seamId": "SEAM_061_FHIR_MAPPING_AND_REPRESENTATION",
        "title": "FHIR representation contracts and mapping compiler boundary",
        "seamClass": "representation_mapping",
        "packageRefs": ["@vecells/fhir-mapping"],
        "artifactRefs": [
            "packages/fhir-mapping/src/index.ts",
            "data/analysis/fhir_representation_contracts.json",
            "data/analysis/fhir_mapping_matrix.csv",
        ],
        "owningSeqTaskRefs": ["seq_049"],
        "consumerTrackGroups": ["backend_kernel"],
        "simulatorFirstState": "not_applicable",
        "sourceRefs": [
            "prompt/049.md",
            "blueprint/phase-0-the-foundation-protocol.md#FHIR is representation only",
        ],
        "notes": (
            "FHIR output remains a representation seam only; no track may let FHIR resources become hidden lifecycle owners."
        ),
    },
    {
        "seamId": "SEAM_061_ADAPTER_AND_DEGRADATION_PROFILES",
        "title": "Adapter contract profiles and degradation posture",
        "seamClass": "adapter_profile",
        "packageRefs": ["@vecells/api-contracts", "@vecells/release-controls"],
        "artifactRefs": [
            "data/analysis/adapter_contract_profile_template.json",
            "data/analysis/dependency_degradation_profiles.json",
            "packages/api-contracts/schemas/adapter-contract-profile.schema.json",
            "packages/api-contracts/schemas/dependency-degradation-profile.schema.json",
        ],
        "owningSeqTaskRefs": ["seq_040", "seq_057"],
        "consumerTrackGroups": ["backend_kernel", "runtime_control_plane"],
        "simulatorFirstState": "enforced",
        "sourceRefs": [
            "prompt/040.md",
            "prompt/057.md",
            "blueprint/platform-runtime-and-release-blueprint.md#AdapterContractProfile",
        ],
        "notes": (
            "Provider-like boundaries stay simulator-backed in Phase 0. No parallel track may bypass the published adapter or degradation profile."
        ),
    },
    {
        "seamId": "SEAM_061_SIMULATOR_AND_REFERENCE_FIXTURES",
        "title": "Simulator registry, reference cases, and seed fixtures",
        "seamClass": "simulator_fixture_registry",
        "packageRefs": ["@vecells/test-fixtures"],
        "artifactRefs": [
            "data/analysis/reference_case_catalog.json",
            "data/analysis/simulator_contract_catalog.json",
            "packages/test-fixtures/reference-cases/reference_case_index.json",
        ],
        "owningSeqTaskRefs": ["seq_058", "seq_059"],
        "consumerTrackGroups": ["backend_kernel", "runtime_control_plane", "frontend_shells", "assurance"],
        "simulatorFirstState": "enforced",
        "sourceRefs": [
            "prompt/058.md",
            "prompt/059.md",
            "blueprint/phase-cards.md#simulators and seed data must exist before shell and integration tracks rely on them",
        ],
        "notes": (
            "Simulator-first execution remains mandatory for all provider-like dependencies until later live-cutover tasks publish explicit onboarding proof."
        ),
    },
    {
        "seamId": "SEAM_061_RUNTIME_PUBLICATION_AND_TOPOLOGY",
        "title": "Runtime topology, publication parity, watch tuples, and verification ladder",
        "seamClass": "runtime_publication_tuple",
        "packageRefs": ["@vecells/release-controls", "@vecells/observability"],
        "artifactRefs": [
            "data/analysis/runtime_topology_manifest.json",
            "data/analysis/release_contract_verification_matrix.json",
            "data/analysis/environment_ring_policy.json",
            "data/analysis/release_candidate_schema.json",
        ],
        "owningSeqTaskRefs": ["seq_046", "seq_051", "seq_058"],
        "consumerTrackGroups": ["runtime_control_plane", "frontend_shells", "assurance"],
        "simulatorFirstState": "enforced",
        "sourceRefs": [
            "prompt/046.md",
            "prompt/051.md",
            "prompt/058.md",
            "blueprint/platform-runtime-and-release-blueprint.md#OperationalReadinessSnapshot",
        ],
        "notes": (
            "Runtime publication, release verification, and wave-watch law are already exact enough to support safe parallel provisioning and shell mock surfaces."
        ),
    },
    {
        "seamId": "SEAM_061_DESIGN_ACCESSIBILITY_AND_AUTOMATION",
        "title": "Design publication, accessibility guarantees, and automation markers",
        "seamClass": "design_accessibility_contract",
        "packageRefs": ["@vecells/design-system", "@vecells/api-contracts"],
        "artifactRefs": [
            "data/analysis/design_contract_publication_bundles.json",
            "data/analysis/frontend_accessibility_and_automation_profiles.json",
            "packages/design-system/contracts/design-contract-publication.schema.json",
        ],
        "owningSeqTaskRefs": ["seq_050", "seq_052", "seq_058"],
        "consumerTrackGroups": ["frontend_shells", "runtime_control_plane"],
        "simulatorFirstState": "not_applicable",
        "sourceRefs": [
            "prompt/050.md",
            "prompt/052.md",
            "prompt/058.md",
        ],
        "notes": (
            "Frontend work must remain contract-first: design tokens, accessibility semantics, and automation anchors are already published and may not be redefined in shell-local code."
        ),
    },
    {
        "seamId": "SEAM_061_RECOVERY_AND_READINESS_TUPLES",
        "title": "Recovery control posture, restore law, and operational-readiness tuple",
        "seamClass": "recovery_tuple",
        "packageRefs": ["@vecells/api-contracts", "@vecells/release-controls"],
        "artifactRefs": [
            "data/analysis/recovery_control_posture_rules.json",
            "data/analysis/restore_run_schema.json",
            "packages/api-contracts/schemas/recovery-control-posture.schema.json",
        ],
        "owningSeqTaskRefs": ["seq_058", "seq_060"],
        "consumerTrackGroups": ["backend_kernel", "runtime_control_plane", "frontend_shells", "assurance"],
        "simulatorFirstState": "enforced",
        "sourceRefs": [
            "prompt/058.md",
            "prompt/060.md",
            "blueprint/phase-0-the-foundation-protocol.md#1.40J RecoveryControlPosture",
        ],
        "notes": (
            "No track may imply live mutable posture, restore authority, or operator recovery controls outside the current recovery tuple."
        ),
    },
    {
        "seamId": "SEAM_061_AUDIT_SCOPE_AND_ASSURANCE",
        "title": "Audit ledger, acting scope, closure law, and assurance slices",
        "seamClass": "assurance_scope",
        "packageRefs": ["@vecells/observability", "@vecells/release-controls", "@vecells/api-contracts"],
        "artifactRefs": [
            "data/analysis/audit_record_schema.json",
            "data/analysis/acting_scope_tuple_schema.json",
            "data/analysis/request_closure_record_schema.json",
            "data/analysis/lifecycle_coordinator_inputs.csv",
        ],
        "owningSeqTaskRefs": ["seq_053", "seq_054", "seq_055"],
        "consumerTrackGroups": ["backend_kernel", "runtime_control_plane", "frontend_shells", "assurance"],
        "simulatorFirstState": "not_applicable",
        "sourceRefs": [
            "prompt/053.md",
            "prompt/054.md",
            "prompt/055.md",
        ],
        "notes": (
            "Assurance, audit, and acting-scope law are already frozen and must remain shared control-plane truth across engineering and long-lead evidence tracks."
        ),
    },
]

INTERFACE_STUBS = [
    {
        "stubRef": "STUB_061_DOMAIN_MUTATION_PUBLIC_ENTRYPOINTS",
        "title": "Domain mutation public entrypoints",
        "providedBySeamId": "SEAM_061_DOMAIN_PUBLIC_ENTRYPOINTS",
        "publicationTargetRef": "@vecells/domain-kernel",
        "requiredByTaskRefs": [f"par_{number:03d}" for number in range(77, 82)],
        "sourceRefs": ["prompt/061.md", "docs/architecture/44_domain_package_contracts.md"],
        "notes": "Coordinator services may depend only on package-root command and aggregate entrypoints, never on sibling src internals.",
    },
    {
        "stubRef": "STUB_061_EVENT_TRANSITION_ENVELOPES",
        "title": "Event transition envelope stubs",
        "providedBySeamId": "SEAM_061_EVENT_ENVELOPE_REGISTRY",
        "publicationTargetRef": "@vecells/event-contracts",
        "requiredByTaskRefs": ["par_077", "par_079", "par_082", "par_083", "par_095"],
        "sourceRefs": ["prompt/061.md", "prompt/048.md"],
        "notes": "Tracks that publish transition events need shared schema placeholders before full implementations land.",
    },
    {
        "stubRef": "STUB_061_QUERY_AND_LIVE_CHANNEL_REGISTRY",
        "title": "Query, mutation, and live-channel registry stubs",
        "providedBySeamId": "SEAM_061_MUTATION_AND_SETTLEMENT_SCHEMAS",
        "publicationTargetRef": "@vecells/api-contracts",
        "requiredByTaskRefs": ["par_082", "par_096", "par_113", "par_115", "par_116", "par_117", "par_118", "par_119", "par_120"],
        "sourceRefs": ["prompt/061.md", "prompt/050.md"],
        "notes": "Projection workers, runtime control, and shell seed tasks must target one shared registry of public read models and live channels.",
    },
    {
        "stubRef": "STUB_061_SIMULATOR_FIXTURE_REGISTRY",
        "title": "Simulator fixture lookup and scenario registry",
        "providedBySeamId": "SEAM_061_SIMULATOR_AND_REFERENCE_FIXTURES",
        "publicationTargetRef": "@vecells/test-fixtures",
        "requiredByTaskRefs": ["par_081", "par_083", "par_098", "par_101", "par_102"],
        "sourceRefs": ["prompt/061.md", "prompt/059.md"],
        "notes": "Simulator-backed runtime and backend tracks must bind to the shared scenario registry rather than ad hoc local fixtures.",
    },
    {
        "stubRef": "STUB_061_RUNTIME_SUBSTRATE_HANDOFF",
        "title": "Runtime substrate handoff contracts",
        "providedBySeamId": "SEAM_061_RUNTIME_PUBLICATION_AND_TOPOLOGY",
        "publicationTargetRef": "@vecells/release-controls",
        "requiredByTaskRefs": ["par_094", "par_099"],
        "sourceRefs": ["prompt/061.md", "prompt/046.md", "prompt/051.md"],
        "notes": "Publication-control tracks need one shared substrate contract covering topology, environment ring, and release identity.",
    },
    {
        "stubRef": "STUB_061_RELEASE_PUBLICATION_ASSEMBLER",
        "title": "Release publication assembler contract",
        "providedBySeamId": "SEAM_061_RUNTIME_PUBLICATION_AND_TOPOLOGY",
        "publicationTargetRef": "@vecells/release-controls",
        "requiredByTaskRefs": ["par_094", "par_097", "par_099", "par_102"],
        "sourceRefs": ["prompt/061.md", "prompt/051.md", "prompt/058.md"],
        "notes": "Conditional runtime governor tracks need one bounded publication-assembler interface before implementing coordinators.",
    },
    {
        "stubRef": "STUB_061_RECOVERY_CONTROL_HANDOFF",
        "title": "Recovery control handoff bindings",
        "providedBySeamId": "SEAM_061_RECOVERY_AND_READINESS_TUPLES",
        "publicationTargetRef": "@vecells/release-controls",
        "requiredByTaskRefs": ["par_101", "par_102"],
        "sourceRefs": ["prompt/061.md", "prompt/060.md"],
        "notes": "Recovery automation tracks must consume the current recovery tuple through a shared handoff contract.",
    },
    {
        "stubRef": "STUB_061_FRONTEND_SHELL_FRAMEWORK_EXPORTS",
        "title": "Frontend shell framework exports",
        "providedBySeamId": "SEAM_061_DESIGN_ACCESSIBILITY_AND_AUTOMATION",
        "publicationTargetRef": "@vecells/design-system",
        "requiredByTaskRefs": ["par_115", "par_116", "par_117", "par_118", "par_119", "par_120"],
        "sourceRefs": ["prompt/061.md", "prompt/106.md"],
        "notes": "Seed-shell tasks require a published shell scaffold and route-shell contract rather than copying provisional sibling components.",
    },
    {
        "stubRef": "STUB_061_MOCK_PROJECTION_FIXTURE_CATALOG",
        "title": "Mock projection fixture catalog",
        "providedBySeamId": "SEAM_061_SIMULATOR_AND_REFERENCE_FIXTURES",
        "publicationTargetRef": "@vecells/test-fixtures",
        "requiredByTaskRefs": ["par_115", "par_116", "par_117", "par_118", "par_119", "par_120"],
        "sourceRefs": ["prompt/061.md", "prompt/059.md"],
        "notes": "Seed-shell work depends on a shared mock projection vocabulary derived from the reference-case corpus.",
    },
    {
        "stubRef": "STUB_061_FRONTEND_AUTOMATION_VOCABULARY",
        "title": "Frontend automation and telemetry vocabulary",
        "providedBySeamId": "SEAM_061_DESIGN_ACCESSIBILITY_AND_AUTOMATION",
        "publicationTargetRef": "@vecells/design-system",
        "requiredByTaskRefs": ["par_114", "par_115", "par_116", "par_117", "par_118", "par_119", "par_120"],
        "sourceRefs": ["prompt/061.md", "prompt/052.md", "prompt/058.md"],
        "notes": "Automation anchors and telemetry vocab must be shared before seed-shell teams wire browser-visible flows.",
    },
    {
        "stubRef": "STUB_061_ASSURANCE_SLICE_INDEX",
        "title": "Assurance slice index and trust bindings",
        "providedBySeamId": "SEAM_061_AUDIT_SCOPE_AND_ASSURANCE",
        "publicationTargetRef": "@vecells/observability",
        "requiredByTaskRefs": ["par_097", "par_100"],
        "sourceRefs": ["prompt/061.md", "prompt/053.md", "prompt/055.md"],
        "notes": "Control-plane tracks that publish watch or provenance gates need one shared assurance-slice lookup, not local spreadsheets.",
    },
]

CONDITIONS = [
    {
        "conditionRef": "CONDITION_061_SHARED_BACKEND_STUBS",
        "title": "Shared backend public-entrypoint stubs must land first",
        "affectedShardRefs": ["SHARD_061_BACKEND_COORDINATORS"],
        "publicationRule": (
            "Coordinator and simulator service tracks may start only against package-root domain and "
            "event stubs published in shared packages."
        ),
        "sourceRefs": ["prompt/061.md", "docs/programme/17_parallel_track_plan.md"],
        "notes": "This keeps service orchestration from coupling directly to unfinished sibling aggregate internals.",
    },
    {
        "conditionRef": "CONDITION_061_RUNTIME_SUBSTRATE_HANDOFFS",
        "title": "Runtime governor tracks require shared substrate handoffs",
        "affectedShardRefs": ["SHARD_061_RUNTIME_GOVERNORS"],
        "publicationRule": (
            "Publication, wave, backup, and recovery automation may not start from shell-local or service-local "
            "wiring; they require the shared runtime substrate handoff and publication assembler contracts."
        ),
        "sourceRefs": ["prompt/061.md", "prompt/058.md", "prompt/060.md"],
        "notes": "This prevents runtime control work from forking the already-frozen release and recovery tuple law.",
    },
    {
        "conditionRef": "CONDITION_061_FRONTEND_SEED_EXPORTS",
        "title": "Seed shells require foundation exports and mock projection catalogs",
        "affectedShardRefs": ["SHARD_061_FRONTEND_SEEDS"],
        "publicationRule": (
            "Audience shell seed routes may open only after the shared shell framework, automation vocabulary, "
            "and mock projection catalogs are published."
        ),
        "sourceRefs": ["prompt/061.md", "prompt/050.md", "prompt/052.md", "prompt/059.md"],
        "notes": "This prevents shell teams from copying provisional UI primitives or inventing route-local mock data.",
    },
]

GROUP_SEQ_DEFAULTS = {
    "backend_kernel": ["seq_020", "seq_041", "seq_043", "seq_044", "seq_048", "seq_056", "seq_057", "seq_060"],
    "runtime_control_plane": ["seq_020", "seq_041", "seq_046", "seq_047", "seq_051", "seq_058", "seq_060"],
    "frontend_shells": ["seq_020", "seq_041", "seq_042", "seq_047", "seq_050", "seq_052", "seq_058", "seq_059", "seq_060"],
    "assurance": ["seq_020", "seq_018", "seq_053", "seq_054", "seq_055", "seq_059", "seq_060"],
}

GROUP_PACKAGE_DEFAULTS = {
    "backend_kernel": ["@vecells/domain-kernel", "@vecells/event-contracts", "@vecells/api-contracts", "@vecells/release-controls", "@vecells/observability"],
    "runtime_control_plane": ["@vecells/release-controls", "@vecells/api-contracts", "@vecells/event-contracts", "@vecells/observability"],
    "frontend_shells": ["@vecells/design-system", "@vecells/api-contracts", "@vecells/release-controls", "@vecells/observability", "@vecells/test-fixtures"],
    "assurance": ["@vecells/release-controls", "@vecells/api-contracts", "@vecells/observability", "@vecells/test-fixtures"],
}

GROUP_SCHEMA_DEFAULTS = {
    "backend_kernel": [
        "schema::canonical-event-envelope",
        "schema::route-intent-binding",
        "schema::command-settlement-record",
        "schema::adapter-contract-profile",
        "schema::dependency-degradation-profile",
        "schema::recovery-control-posture",
    ],
    "runtime_control_plane": [
        "schema::canonical-event-envelope",
        "schema::route-intent-binding",
        "schema::frontend-contract-manifest",
        "schema::release-contract-verification-matrix",
        "schema::recovery-control-posture",
    ],
    "frontend_shells": [
        "schema::frontend-contract-manifest",
        "schema::release-contract-verification-matrix",
        "schema::recovery-control-posture",
        "schema::design-contract-publication",
    ],
    "assurance": [
        "schema::audit-record",
        "schema::acting-scope-tuple",
        "schema::request-closure-record",
        "schema::recovery-control-posture",
    ],
}

GROUP_FORBIDDEN_COUPLINGS = {
    "backend_kernel": [
        "No imports from sibling task private src trees.",
        "No app-owned workflow truth or projection-owned write mutations.",
        "No live provider adapters outside published simulator-backed profiles.",
    ],
    "runtime_control_plane": [
        "No shell-local runtime tuple reconstruction.",
        "No direct app or service private-import coupling for infrastructure law.",
        "No live mutable posture without release and recovery tuple parity.",
    ],
    "frontend_shells": [
        "No service src or domain src deep imports.",
        "No route-local design token or accessibility vocabulary forks.",
        "No direct live-provider calls or live onboarding assumptions in Phase 0.",
    ],
    "assurance": [
        "No screenshot-only evidence as authoritative truth.",
        "No live-provider dependence where simulator or frozen artifact evidence exists.",
        "No private service or shell internals as audit substitutes.",
    ],
}

TRACK_OVERRIDES: dict[int, dict[str, Any]] = {
    62: {"seq_add": ["seq_005", "seq_006", "seq_007"], "notes": "Implements the submission/request backbone directly from frozen intake convergence, lineage, and state-machine law."},
    63: {"seq_add": ["seq_049", "seq_053"], "packages_add": ["@vecells/fhir-mapping"], "schemas_add": ["schema::audit-record"], "notes": "Requires the audit and FHIR representation seams to keep evidence derivation and redaction deterministic."},
    64: {"seq_add": ["seq_049"], "packages_add": ["@vecells/fhir-mapping"], "schemas_add": ["schema::canonical-event-envelope"], "notes": "May compile representation sets only against the published FHIR contract boundary."},
    65: {"seq_add": ["seq_050", "seq_058"], "notes": "Owns the shared query/mutation/live-channel registry and therefore anchors several conditional sibling tracks."},
    66: {"seq_add": ["seq_005", "seq_007"], "notes": "Promotion exactly-once behavior depends on the intake barrier and lineage invariants already frozen upstream."},
    67: {"seq_add": ["seq_053"], "schemas_add": ["schema::audit-record"], "notes": "Replay and collision review must emit immutable audit-compatible evidence from the start."},
    68: {"seq_add": ["seq_054"], "simulators": ["sim_nhs_login_auth_session_twin", "sim_optional_pds_enrichment_twin"], "notes": "Identity work stays simulator-backed until later onboarding evidence clears live-cutover tasks."},
    69: {"seq_add": ["seq_047", "seq_054"], "simulators": ["sim_sms_delivery_twin", "sim_email_notification_twin", "sim_telephony_ivr_twin"], "notes": "Contact-route and reachability state must stay aligned with surface ownership and acting-scope law."},
    70: {"seq_add": ["seq_053", "seq_059"], "schemas_add": ["schema::audit-record"], "notes": "Duplicate evidence models rely on the audit spine and reference-case corpus rather than ad hoc fixture sets."},
    71: {"seq_add": ["seq_055"], "notes": "Lifecycle lease and command-action records sit directly on the frozen lifecycle-coordinator and mutation-gate law."},
    72: {"seq_add": ["seq_055"], "notes": "Transition envelope libraries must publish the shared settlement semantics that later runtime and frontend tracks consume."},
    73: {"seq_add": ["seq_059"], "notes": "Queue ranking and assignment suggestions must bind to reference cases and simulator-first journey proof."},
    74: {"seq_add": ["seq_058", "seq_059"], "simulators": ["sim_booking_capacity_feed_twin", "sim_booking_provider_confirmation_twin"], "notes": "Capacity reservation and external confirmation gates remain simulator-backed in Phase 0."},
    75: {"seq_add": ["seq_051", "seq_052", "seq_058"], "schemas_add": ["schema::release-contract-verification-matrix"], "notes": "Release approval and assurance trust records must stay exact against the release parity tuple."},
    76: {"seq_add": ["seq_053", "seq_055"], "schemas_add": ["schema::request-closure-record"], "notes": "Closure and exception law is already frozen and can be implemented without waiting on sibling orchestration code."},
    77: {"seq_add": ["seq_055"], "stubs": ["STUB_061_DOMAIN_MUTATION_PUBLIC_ENTRYPOINTS", "STUB_061_EVENT_TRANSITION_ENVELOPES"]},
    78: {"seq_add": ["seq_054"], "stubs": ["STUB_061_DOMAIN_MUTATION_PUBLIC_ENTRYPOINTS"], "notes": "The access-grant service may start only against package-root identity entrypoints."},
    79: {"seq_add": ["seq_049", "seq_053", "seq_059"], "packages_add": ["@vecells/fhir-mapping"], "schemas_add": ["schema::audit-record"], "stubs": ["STUB_061_EVENT_TRANSITION_ENVELOPES", "STUB_061_QUERY_AND_LIVE_CHANNEL_REGISTRY"]},
    80: {"seq_add": ["seq_054"], "simulators": ["sim_nhs_login_auth_session_twin", "sim_optional_pds_enrichment_twin"], "stubs": ["STUB_061_DOMAIN_MUTATION_PUBLIC_ENTRYPOINTS"]},
    81: {"seq_add": ["seq_058", "seq_059"], "simulators": ["sim_booking_capacity_feed_twin", "sim_booking_provider_confirmation_twin"], "stubs": ["STUB_061_DOMAIN_MUTATION_PUBLIC_ENTRYPOINTS", "STUB_061_SIMULATOR_FIXTURE_REGISTRY"]},
    82: {"seq_add": ["seq_046", "seq_049", "seq_050", "seq_058"], "packages_add": ["@vecells/fhir-mapping"], "stubs": ["STUB_061_EVENT_TRANSITION_ENVELOPES", "STUB_061_QUERY_AND_LIVE_CHANNEL_REGISTRY"]},
    83: {"seq_add": ["seq_059"], "simulators": SIMULATOR_IDS, "stubs": ["STUB_061_EVENT_TRANSITION_ENVELOPES", "STUB_061_SIMULATOR_FIXTURE_REGISTRY"], "notes": "Simulator backplanes may start only against the published adapter profiles and shared scenario registry."},
    84: {"seq_add": ["seq_011", "seq_015"], "notes": "Network and private-egress controls are eligible because region, trust-zone, and observability baselines are already frozen."},
    85: {"seq_add": ["seq_013", "seq_049"], "packages_add": ["@vecells/fhir-mapping"], "notes": "Domain transaction and FHIR storage build from the already-frozen storage and FHIR seams."},
    86: {"seq_add": ["seq_010", "seq_015", "seq_053"], "schemas_add": ["schema::audit-record"], "notes": "Retention and quarantine buckets depend on data classification and WORM law already being explicit."},
    87: {"seq_add": ["seq_013", "seq_048"], "notes": "Event bus and outbox/inbox infra can proceed because event and service contracts are already machine-readable."},
    88: {"seq_add": ["seq_014", "seq_050"], "notes": "Cache and live-update transport is safe to start against frozen frontend manifest and publication law."},
    89: {"seq_add": ["seq_011", "seq_015"], "notes": "Secrets and KMS tracks are eligible because cloud, security, and release baselines were frozen before the parallel gate."},
    90: {"seq_add": ["seq_042", "seq_047", "seq_050", "seq_054"], "schemas_add": ["schema::frontend-contract-manifest"], "simulators": ["sim_nhs_login_auth_session_twin", "sim_booking_provider_confirmation_twin", "sim_pharmacy_dispatch_transport_twin"], "notes": "Audience-specific gateway surfaces remain simulator-backed and route-authority-driven."},
    91: {"seq_add": ["seq_015", "seq_051", "seq_052"], "notes": "Signed build provenance is eligible because release and design publication law are already frozen."},
    92: {"seq_add": ["seq_042", "seq_058", "seq_059"], "simulators": ["sim_booking_capacity_feed_twin", "sim_mesh_message_path_twin", "sim_sms_delivery_twin"], "notes": "Preview environments and reset flows depend on reference cases, not live provider data."},
    93: {"seq_add": ["seq_015", "seq_047", "seq_053"], "schemas_add": ["schema::audit-record"], "notes": "Observability SDK and edge correlation are eligible because telemetry, trust, and audit law are already frozen."},
    94: {"seq_add": ["seq_051", "seq_052", "seq_058"], "schemas_add": ["schema::release-contract-verification-matrix"], "stubs": ["STUB_061_RUNTIME_SUBSTRATE_HANDOFF", "STUB_061_RELEASE_PUBLICATION_ASSEMBLER"]},
    95: {"seq_add": ["seq_048", "seq_051"], "stubs": ["STUB_061_EVENT_TRANSITION_ENVELOPES"], "notes": "Migration and backfill runners need one shared transition/event handoff before they can safely proceed."},
    96: {"seq_add": ["seq_050", "seq_054", "seq_056"], "stubs": ["STUB_061_QUERY_AND_LIVE_CHANNEL_REGISTRY", "STUB_061_FRONTEND_AUTOMATION_VOCABULARY"], "notes": "Client cache and live-update control requires the shared route registry and automation vocabulary first."},
    97: {"seq_add": ["seq_051", "seq_053", "seq_058"], "schemas_add": ["schema::release-contract-verification-matrix"], "stubs": ["STUB_061_RELEASE_PUBLICATION_ASSEMBLER", "STUB_061_ASSURANCE_SLICE_INDEX"]},
    98: {"seq_add": ["seq_040", "seq_057", "seq_059"], "simulators": ["sim_booking_capacity_feed_twin", "sim_booking_provider_confirmation_twin", "sim_im1_principal_system_emis_twin", "sim_im1_principal_system_tpp_twin", "sim_mesh_message_path_twin", "sim_nhs_login_auth_session_twin", "sim_optional_pds_enrichment_twin", "sim_pharmacy_dispatch_transport_twin", "sim_pharmacy_visibility_update_record_twin", "sim_sms_delivery_twin", "sim_email_notification_twin", "sim_telephony_ivr_twin", "sim_transcription_processing_twin"], "stubs": ["STUB_061_SIMULATOR_FIXTURE_REGISTRY"]},
    99: {"seq_add": ["seq_046", "seq_047", "seq_051", "seq_058"], "stubs": ["STUB_061_RUNTIME_SUBSTRATE_HANDOFF", "STUB_061_RELEASE_PUBLICATION_ASSEMBLER"]},
    100: {"seq_add": ["seq_015", "seq_051", "seq_053"], "schemas_add": ["schema::audit-record"], "stubs": ["STUB_061_ASSURANCE_SLICE_INDEX"], "notes": "Supply-chain provenance and SBOM verification publish one shared tuple-bound integrity seam for later readiness and canary tracks."},
    101: {"seq_add": ["seq_058", "seq_059", "seq_060"], "schemas_add": ["schema::restore-run"], "simulators": ["sim_booking_capacity_feed_twin", "sim_mesh_message_path_twin", "sim_sms_delivery_twin"], "stubs": ["STUB_061_RECOVERY_CONTROL_HANDOFF", "STUB_061_SIMULATOR_FIXTURE_REGISTRY"]},
    102: {"seq_add": ["seq_051", "seq_058", "seq_060"], "simulators": ["sim_booking_provider_confirmation_twin", "sim_email_notification_twin"], "stubs": ["STUB_061_RELEASE_PUBLICATION_ASSEMBLER", "STUB_061_RECOVERY_CONTROL_HANDOFF"]},
    103: {"seq_add": ["seq_050", "seq_052"], "notes": "Token publication starts immediately because design bundle and route-manifest law are already frozen."},
    104: {"seq_add": ["seq_050", "seq_052"], "notes": "The canonical UI contract kernel is eligible because browser-visible route families and structural design evidence are already published."},
    105: {"seq_add": ["seq_050", "seq_052"], "notes": "Primitive component work can proceed safely on frozen token, automation, and contract seams."},
    106: {"seq_add": ["seq_041", "seq_042"], "notes": "Persistent shell framework is eligible because topology, shell families, and contract publication already exist."},
    107: {"seq_add": ["seq_050", "seq_058"], "notes": "Status-strip and freshness surfaces are eligible because frontend and verification-freshness contracts are already explicit."},
    108: {"seq_add": ["seq_054", "seq_056"], "schemas_add": ["schema::route-intent-binding"], "notes": "Selected-anchor and return-state management must stay bound to scope and route-intent law."},
    109: {"seq_add": ["seq_052", "seq_053"], "schemas_add": ["schema::audit-record"], "notes": "Artifact presentation shells are eligible because export, audit, and design contracts are already published."},
    110: {"seq_add": ["seq_050", "seq_056", "seq_060"], "notes": "Loading and recovery postures are eligible because mutation and resilience states are already machine-readable."},
    111: {"seq_add": ["seq_050", "seq_052", "seq_058"], "notes": "Accessibility harness work is eligible because content, automation, and verification rules are already published."},
    112: {"seq_add": ["seq_047", "seq_054", "seq_056"], "notes": "Route guards and feature flags may start because surface ownership, acting scope, and mutation law are already frozen."},
    113: {"seq_add": ["seq_050", "seq_058"], "stubs": ["STUB_061_QUERY_AND_LIVE_CHANNEL_REGISTRY"], "notes": "Manifest codegen is eligible and also publishes a stub that later seed-shell tasks depend on."},
    114: {"seq_add": ["seq_050", "seq_052", "seq_058"], "stubs": ["STUB_061_FRONTEND_AUTOMATION_VOCABULARY"], "notes": "Automation-anchor and telemetry vocabulary work is eligible and acts as a prerequisite for shell seed tracks."},
    115: {"seq_add": ["seq_050", "seq_059"], "simulators": ["sim_nhs_login_auth_session_twin", "sim_sms_delivery_twin", "sim_email_notification_twin"], "stubs": ["STUB_061_FRONTEND_SHELL_FRAMEWORK_EXPORTS", "STUB_061_MOCK_PROJECTION_FIXTURE_CATALOG", "STUB_061_QUERY_AND_LIVE_CHANNEL_REGISTRY", "STUB_061_FRONTEND_AUTOMATION_VOCABULARY"]},
    116: {"seq_add": ["seq_050", "seq_059"], "simulators": ["sim_telephony_ivr_twin", "sim_transcription_processing_twin"], "stubs": ["STUB_061_FRONTEND_SHELL_FRAMEWORK_EXPORTS", "STUB_061_MOCK_PROJECTION_FIXTURE_CATALOG", "STUB_061_QUERY_AND_LIVE_CHANNEL_REGISTRY", "STUB_061_FRONTEND_AUTOMATION_VOCABULARY"]},
    117: {"seq_add": ["seq_050", "seq_059"], "simulators": ["sim_mesh_message_path_twin", "sim_email_notification_twin", "sim_sms_delivery_twin"], "stubs": ["STUB_061_FRONTEND_SHELL_FRAMEWORK_EXPORTS", "STUB_061_MOCK_PROJECTION_FIXTURE_CATALOG", "STUB_061_QUERY_AND_LIVE_CHANNEL_REGISTRY", "STUB_061_FRONTEND_AUTOMATION_VOCABULARY"]},
    118: {"seq_add": ["seq_050", "seq_059"], "simulators": ["sim_booking_capacity_feed_twin", "sim_booking_provider_confirmation_twin"], "stubs": ["STUB_061_FRONTEND_SHELL_FRAMEWORK_EXPORTS", "STUB_061_MOCK_PROJECTION_FIXTURE_CATALOG", "STUB_061_QUERY_AND_LIVE_CHANNEL_REGISTRY", "STUB_061_FRONTEND_AUTOMATION_VOCABULARY"]},
    119: {"seq_add": ["seq_050", "seq_053", "seq_059"], "schemas_add": ["schema::audit-record"], "simulators": ["sim_mesh_message_path_twin", "sim_transcription_processing_twin"], "stubs": ["STUB_061_FRONTEND_SHELL_FRAMEWORK_EXPORTS", "STUB_061_MOCK_PROJECTION_FIXTURE_CATALOG", "STUB_061_QUERY_AND_LIVE_CHANNEL_REGISTRY", "STUB_061_FRONTEND_AUTOMATION_VOCABULARY"]},
    120: {"seq_add": ["seq_050", "seq_059"], "simulators": ["sim_pharmacy_dispatch_transport_twin", "sim_pharmacy_visibility_update_record_twin"], "stubs": ["STUB_061_FRONTEND_SHELL_FRAMEWORK_EXPORTS", "STUB_061_MOCK_PROJECTION_FIXTURE_CATALOG", "STUB_061_QUERY_AND_LIVE_CHANNEL_REGISTRY", "STUB_061_FRONTEND_AUTOMATION_VOCABULARY"]},
    121: {"seq_add": ["seq_009", "seq_053"], "schemas_add": ["schema::audit-record"], "notes": "DCB0129 work is eligible because the safety, audit, and recovery baselines are already explicit and machine-readable."},
    122: {"seq_add": ["seq_009", "seq_010", "seq_053"], "schemas_add": ["schema::audit-record"], "notes": "DSPT gap assessment can start immediately against the frozen data-classification and audit posture."},
    123: {"seq_add": ["seq_021", "seq_022", "seq_023", "seq_026", "seq_040"], "simulators": ["sim_im1_principal_system_emis_twin", "sim_im1_principal_system_tpp_twin"], "notes": "IM1/SCAL readiness remains evidence-led but simulator-first; no live principal-system access is required to begin the pack."},
    124: {"seq_add": ["seq_021", "seq_022", "seq_023", "seq_024", "seq_025", "seq_029", "seq_040"], "simulators": ["sim_nhs_login_auth_session_twin"], "notes": "NHS Login onboarding evidence can start on frozen external-readiness artifacts plus the simulator-backed identity boundary."},
    125: {"seq_add": ["seq_009", "seq_018", "seq_053"], "schemas_add": ["schema::audit-record"], "notes": "Clinical risk review cadence is eligible because the core safety, risk, and lifecycle laws are already frozen."},
    126: {"seq_add": ["seq_009", "seq_010", "seq_018", "seq_053"], "schemas_add": ["schema::audit-record"], "notes": "Privacy threat modeling and DPIA backlog may start immediately from the frozen privacy, risk, and audit posture."},
}

SCHEMA_PATHS = {
    "schema::canonical-event-envelope": "packages/event-contracts/schemas/canonical-event-envelope.v1.schema.json",
    "schema::route-intent-binding": "packages/api-contracts/schemas/route-intent-binding.schema.json",
    "schema::command-settlement-record": "packages/api-contracts/schemas/command-settlement-record.schema.json",
    "schema::adapter-contract-profile": "packages/api-contracts/schemas/adapter-contract-profile.schema.json",
    "schema::dependency-degradation-profile": "packages/api-contracts/schemas/dependency-degradation-profile.schema.json",
    "schema::frontend-contract-manifest": "packages/api-contracts/schemas/frontend-contract-manifest.schema.json",
    "schema::release-contract-verification-matrix": "packages/api-contracts/schemas/release-contract-verification-matrix.schema.json",
    "schema::recovery-control-posture": "packages/api-contracts/schemas/recovery-control-posture.schema.json",
    "schema::design-contract-publication": "packages/design-system/contracts/design-contract-publication.schema.json",
    "schema::audit-record": "data/analysis/audit_record_schema.json",
    "schema::acting-scope-tuple": "data/analysis/acting_scope_tuple_schema.json",
    "schema::request-closure-record": "data/analysis/request_closure_record_schema.json",
    "schema::restore-run": "data/analysis/restore_run_schema.json",
}


def read_json(path: Path) -> Any:
    return json.loads(path.read_text())


def write_text(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content.rstrip() + "\n")


def write_json(path: Path, payload: Any) -> None:
    write_text(path, json.dumps(payload, indent=2))


def write_csv(path: Path, fieldnames: list[str], rows: list[dict[str, Any]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        for row in rows:
            writer.writerow(row)


def load_context() -> dict[str, Any]:
    return {
        "repo_topology": read_json(REPO_TOPOLOGY_PATH),
        "domain_package": read_json(DOMAIN_PACKAGE_PATH),
        "runtime_topology": read_json(RUNTIME_TOPOLOGY_PATH),
        "gateway_surfaces": read_json(GATEWAY_SURFACES_PATH),
        "event_registry": read_json(EVENT_REGISTRY_PATH),
        "fhir_contracts": read_json(FHIR_CONTRACT_PATH),
        "frontend_manifests": read_json(FRONTEND_MANIFESTS_PATH),
        "release_matrix": read_json(RELEASE_MATRIX_PATH),
        "design_bundles": read_json(DESIGN_BUNDLES_PATH),
        "adapter_template": read_json(ADAPTER_TEMPLATE_PATH),
        "adapter_degradation": read_json(ADAPTER_DEGRADATION_PATH),
        "verification_scenarios": read_json(VERIFICATION_SCENARIOS_PATH),
        "reference_cases": read_json(REFERENCE_CASES_PATH),
        "simulator_catalog": read_json(SIMULATOR_CATALOG_PATH),
        "recovery_posture": read_json(RECOVERY_POSTURE_PATH),
    }


def humanize_track_title(track_task_id: str) -> str:
    title = track_task_id
    title = re.sub(r"^par_[0-9]{3}_phase0_track_", "", title)
    title = title.replace("Playwright_or_other_appropriate_tooling_", "")
    title = title.replace("_", " ").strip()
    replacements = {
        "api": "API",
        "fhir": "FHIR",
        "ui": "UI",
        "dpia": "DPIA",
        "dspt": "DSPT",
        "dcb0129": "DCB0129",
        "im1": "IM1",
        "nhs": "NHS",
        "ci cd": "CI/CD",
        "kms": "KMS",
        "sbom": "SBOM",
        "ivr": "IVR",
        "sms": "SMS",
    }
    words = [word.capitalize() for word in title.split()]
    normalized = " ".join(words)
    for raw, cooked in replacements.items():
        normalized = re.sub(rf"\b{raw.title()}\b", cooked, normalized)
    normalized = normalized.replace("Ci/Cd", "CI/CD").replace("Sbom", "SBOM")
    normalized = normalized.replace("Nhs", "NHS").replace("Im1", "IM1").replace("Dspt", "DSPT")
    normalized = normalized.replace("Dcb0129", "DCB0129").replace("Ivr", "IVR").replace("Sms", "SMS")
    return normalized[0].upper() + normalized[1:]


def parse_candidate_tracks() -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    pattern = re.compile(r"- \[[ X\-]\] ((?:par|seq)_(\d{3})_[^(]+)")
    for line in CHECKLIST_PATH.read_text().splitlines():
        match = pattern.match(line)
        if not match:
            continue
        checklist_label = match.group(1).strip()
        task_number = int(match.group(2))
        if 62 <= task_number <= 126:
            rows.append(
                {
                    "trackTaskId": f"par_{task_number:03d}",
                    "checklistLabel": checklist_label,
                    "taskNumber": task_number,
                    "trackTitle": humanize_track_title(checklist_label),
                }
            )
    return rows


def shard_for_task(task_number: int) -> dict[str, Any]:
    for shard in SHARD_DEFINITIONS:
        if shard["start"] <= task_number <= shard["end"]:
            return shard
    raise ValueError(f"No shard defined for task number {task_number}")


def track_specific_source_refs(task_number: int, track_group: str) -> list[str]:
    refs = [f"prompt/{task_number:03d}.md", "prompt/061.md", "docs/programme/17_parallel_track_plan.md"]
    if track_group == "backend_kernel":
        refs.append("docs/architecture/44_domain_package_contracts.md")
    elif track_group == "runtime_control_plane":
        refs.append("docs/architecture/46_runtime_topology_manifest_strategy.md")
    elif track_group == "frontend_shells":
        refs.append("docs/architecture/50_frontend_contract_manifest_strategy.md")
    else:
        refs.append("docs/architecture/53_audit_and_worm_strategy.md")
    return refs


def build_track_rows() -> list[dict[str, Any]]:
    tracks = []
    seam_lookup = {row["seamId"]: row for row in SHARED_SEAMS}
    for row in parse_candidate_tracks():
        task_number = row["taskNumber"]
        shard = shard_for_task(task_number)
        override = TRACK_OVERRIDES.get(task_number, {})
        track_group = shard["trackGroup"]

        seq_refs = sorted(set(GROUP_SEQ_DEFAULTS[track_group] + override.get("seq_add", [])))
        package_refs = sorted(set(GROUP_PACKAGE_DEFAULTS[track_group] + override.get("packages_add", [])))
        schema_refs = sorted(set(GROUP_SCHEMA_DEFAULTS[track_group] + override.get("schemas_add", [])))
        simulator_refs = sorted(set(override.get("simulators", [])))
        seam_refs = list(shard["requiredSharedSeamRefs"])

        if task_number in {63, 64} and "SEAM_061_FHIR_MAPPING_AND_REPRESENTATION" not in seam_refs:
            seam_refs.append("SEAM_061_FHIR_MAPPING_AND_REPRESENTATION")
        if simulator_refs and "SEAM_061_SIMULATOR_AND_REFERENCE_FIXTURES" not in seam_refs:
            seam_refs.append("SEAM_061_SIMULATOR_AND_REFERENCE_FIXTURES")
        if any(schema.startswith("schema::audit-record") for schema in schema_refs) and "SEAM_061_AUDIT_SCOPE_AND_ASSURANCE" not in seam_refs:
            seam_refs.append("SEAM_061_AUDIT_SCOPE_AND_ASSURANCE")

        stubs = sorted(set(shard["requiredInterfaceStubRefs"] + override.get("stubs", [])))
        blocking_reasons = list(shard["blockingReasonRefs"])
        note = override.get("notes", shard["notes"])

        seam_refs = sorted(dict.fromkeys(seam_refs))
        tracks.append(
            {
                **row,
                "trackGroup": track_group,
                "trackGroupLabel": TRACK_GROUP_LABELS[track_group],
                "trackShardId": shard["shardId"],
                "claimableMode": shard["claimableMode"],
                "requiredSeqTaskRefs": seq_refs,
                "requiredSharedPackageRefs": package_refs,
                "requiredSimulatorRefs": simulator_refs,
                "requiredSchemaRefs": schema_refs,
                "requiredSharedSeamRefs": seam_refs,
                "forbiddenSiblingCouplings": GROUP_FORBIDDEN_COUPLINGS[track_group],
                "parallelInterfaceStubRefs": stubs,
                "blockingReasonRefs": blocking_reasons,
                "notes": note,
                "sourceRefs": track_specific_source_refs(task_number, track_group),
                "diagramHash": hashlib.sha256(
                    "|".join(
                        [
                            row["trackTaskId"],
                            shard["shardId"],
                            shard["claimableMode"],
                            ",".join(seq_refs),
                            ",".join(seam_refs),
                        ]
                    ).encode("utf-8")
                ).hexdigest()[:16],
            }
        )

        for seam_ref in seam_refs:
            if seam_ref not in seam_lookup:
                raise KeyError(f"Unknown seam ref {seam_ref} referenced by {row['trackTaskId']}")
    return tracks


def build_track_group_payload(track_rows: list[dict[str, Any]], context: dict[str, Any]) -> dict[str, Any]:
    groups = []
    for group_id, group_label in TRACK_GROUP_LABELS.items():
        group_tracks = [row for row in track_rows if row["trackGroup"] == group_id]
        group_shards = [shard for shard in SHARD_DEFINITIONS if shard["trackGroup"] == group_id]
        groups.append(
            {
                "trackGroup": group_id,
                "label": group_label,
                "taskSpanRef": f"par_{min(row['taskNumber'] for row in group_tracks):03d} -> par_{max(row['taskNumber'] for row in group_tracks):03d}",
                "trackCount": len(group_tracks),
                "eligibleCount": sum(1 for row in group_tracks if row["claimableMode"] == "eligible"),
                "conditionalCount": sum(1 for row in group_tracks if row["claimableMode"] == "conditional"),
                "blockedCount": sum(1 for row in group_tracks if row["claimableMode"] == "blocked"),
                "requiredSharedSeamRefs": sorted({ref for row in group_tracks for ref in row["requiredSharedSeamRefs"]}),
                "shardRefs": [shard["shardId"] for shard in group_shards],
                "sourceRefs": [
                    "prompt/061.md",
                    "docs/programme/17_parallel_track_plan.md",
                    "docs/programme/17_phase0_subphase_execution_plan.md",
                ],
            }
        )

    track_shards = []
    for shard in SHARD_DEFINITIONS:
        shard_tracks = [row for row in track_rows if row["trackShardId"] == shard["shardId"]]
        track_shards.append(
            {
                "shardId": shard["shardId"],
                "label": shard["label"],
                "trackGroup": shard["trackGroup"],
                "taskRefs": [row["trackTaskId"] for row in shard_tracks],
                "claimableMode": shard["claimableMode"],
                "trackCount": len(shard_tracks),
                "requiredSharedSeamRefs": shard["requiredSharedSeamRefs"],
                "requiredInterfaceStubRefs": shard["requiredInterfaceStubRefs"],
                "blockingReasonRefs": shard["blockingReasonRefs"],
                "notes": shard["notes"],
                "sourceRefs": [
                    "prompt/061.md",
                    "docs/programme/17_parallel_track_plan.md",
                ],
            }
        )

    summary = {
        "group_count": len(groups),
        "shard_count": len(track_shards),
        "candidate_track_count": len(track_rows),
        "eligible_track_count": sum(1 for row in track_rows if row["claimableMode"] == "eligible"),
        "conditional_track_count": sum(1 for row in track_rows if row["claimableMode"] == "conditional"),
        "blocked_track_count": sum(1 for row in track_rows if row["claimableMode"] == "blocked"),
        "shared_seam_count": len(SHARED_SEAMS),
        "interface_stub_count": len(INTERFACE_STUBS),
        "simulator_catalog_count": context["simulator_catalog"]["summary"]["simulator_count"],
    }

    return {
        "task_id": TASK_ID,
        "generated_at": TIMESTAMP,
        "captured_on": CAPTURED_ON,
        "visual_mode": VISUAL_MODE,
        "mission": MISSION,
        "source_precedence": SOURCE_PRECEDENCE,
        "upstream_inputs": {
            "repo_topology_summary": context["repo_topology"]["summary"],
            "domain_package_summary": context["domain_package"]["summary"],
            "runtime_topology_summary": context["runtime_topology"]["summary"],
            "gateway_surface_summary": context["gateway_surfaces"]["summary"],
            "event_registry_summary": context["event_registry"]["summary"],
            "frontend_manifest_summary": context["frontend_manifests"]["summary"],
            "release_matrix_summary": context["release_matrix"]["summary"],
            "design_bundle_summary": context["design_bundles"]["summary"],
            "adapter_profile_summary": context["adapter_template"]["summary"],
            "verification_scenario_summary": context["verification_scenarios"]["summary"],
            "reference_case_summary": context["reference_cases"]["summary"],
            "recovery_posture_summary": context["recovery_posture"]["summary"],
        },
        "summary": summary,
        "trackGroups": groups,
        "trackShards": track_shards,
    }


def build_shared_seams_payload(track_rows: list[dict[str, Any]]) -> dict[str, Any]:
    conditions = []
    for condition in CONDITIONS:
        affected_track_refs = [row["trackTaskId"] for row in track_rows if row["trackShardId"] in condition["affectedShardRefs"]]
        conditions.append({**condition, "affectedTrackRefs": affected_track_refs})

    return {
        "task_id": TASK_ID,
        "generated_at": TIMESTAMP,
        "captured_on": CAPTURED_ON,
        "visual_mode": VISUAL_MODE,
        "mission": MISSION,
        "source_precedence": SOURCE_PRECEDENCE,
        "summary": {
            "shared_seam_count": len(SHARED_SEAMS),
            "interface_stub_count": len(INTERFACE_STUBS),
            "condition_count": len(conditions),
            "public_package_count": len(sorted({package for seam in SHARED_SEAMS for package in seam["packageRefs"]})),
        },
        "sharedSeams": SHARED_SEAMS,
        "interfaceStubs": INTERFACE_STUBS,
        "conditions": conditions,
    }


def build_verdict_payload(track_rows: list[dict[str, Any]], groups_payload: dict[str, Any], shared_seams_payload: dict[str, Any]) -> dict[str, Any]:
    eligible_tracks = [row["trackTaskId"] for row in track_rows if row["claimableMode"] == "eligible"]
    conditional_tracks = [row["trackTaskId"] for row in track_rows if row["claimableMode"] == "conditional"]
    blocked_tracks = [row["trackTaskId"] for row in track_rows if row["claimableMode"] == "blocked"]
    required_seq_refs = sorted({ref for row in track_rows for ref in row["requiredSeqTaskRefs"]})
    seam_refs = sorted({ref for row in track_rows for ref in row["requiredSharedSeamRefs"]})
    tuple_hash = hashlib.sha256(
        json.dumps(
            {
                "eligible_tracks": eligible_tracks,
                "conditional_tracks": conditional_tracks,
                "blocked_tracks": blocked_tracks,
                "required_seq_refs": required_seq_refs,
                "seam_refs": seam_refs,
                "condition_refs": [row["conditionRef"] for row in shared_seams_payload["conditions"]],
            },
            sort_keys=True,
        ).encode("utf-8")
    ).hexdigest()
    return {
        "task_id": TASK_ID,
        "generated_at": TIMESTAMP,
        "captured_on": CAPTURED_ON,
        "gateId": "GATE_P0_PARALLEL_FOUNDATION_OPEN",
        "visual_mode": VISUAL_MODE,
        "gateVerdict": "conditional",
        "parallelBlockState": "open_for_eligible_tracks",
        "verdictSummary": (
            "The Phase 0 parallel foundation block may open now because seq_041-060 froze topology, "
            "shared package homes, simulator-first dependencies, publication tuples, and recovery law. "
            "Forty-three starter tracks are immediately eligible. Twenty-two dependent tracks stay "
            "conditional until their declared shared stubs are published; no tracks remain blocked on "
            "unresolved sequential law."
        ),
        "summary": {
            **groups_payload["summary"],
            "required_seq_task_count": len(required_seq_refs),
            "required_condition_count": len(shared_seams_payload["conditions"]),
        },
        "requiredSeqTaskRefs": required_seq_refs,
        "satisfiedSeqTaskRefs": required_seq_refs,
        "eligibleTrackTaskRefs": eligible_tracks,
        "conditionalTrackTaskRefs": conditional_tracks,
        "blockedTrackTaskRefs": blocked_tracks,
        "requiredSharedSeamRefs": seam_refs,
        "conditionRefs": [row["conditionRef"] for row in shared_seams_payload["conditions"]],
        "blockerRefs": [],
        "simulatorFirstVerdict": "pass",
        "schemaOwnershipVerdict": "pass",
        "recoveryLawVerdict": "pass",
        "verdictTupleHash": tuple_hash,
        "sourceRefs": [
            "prompt/061.md",
            "docs/programme/17_parallel_track_plan.md",
            "docs/programme/20_phase0_gate_verdict_and_blockers.md",
            "docs/architecture/60_backup_restore_and_recovery_tuple_baseline.md",
        ],
        "notes": (
            "The gate opens conditionally rather than as a blanket green verdict so dependent service, "
            "runtime-governor, and seed-shell tracks cannot claim success while shared stubs are still unpublished."
        ),
    }


def build_eligibility_rows(track_rows: list[dict[str, Any]]) -> list[dict[str, str]]:
    rows = []
    for row in track_rows:
        rows.append(
            {
                "trackTaskId": row["trackTaskId"],
                "trackTitle": row["trackTitle"],
                "trackGroup": row["trackGroup"],
                "trackShardId": row["trackShardId"],
                "claimableMode": row["claimableMode"],
                "requiredSeqTaskRefs": "; ".join(row["requiredSeqTaskRefs"]),
                "requiredSharedPackageRefs": "; ".join(row["requiredSharedPackageRefs"]),
                "requiredSimulatorRefs": "; ".join(row["requiredSimulatorRefs"]),
                "requiredSchemaRefs": "; ".join(row["requiredSchemaRefs"]),
                "requiredSharedSeamRefs": "; ".join(row["requiredSharedSeamRefs"]),
                "forbiddenSiblingCouplings": " | ".join(row["forbiddenSiblingCouplings"]),
                "parallelInterfaceStubRefs": "; ".join(row["parallelInterfaceStubRefs"]),
                "blockingReasonRefs": "; ".join(row["blockingReasonRefs"]),
                "notes": row["notes"],
                "sourceRefs": "; ".join(row["sourceRefs"]),
            }
        )
    return rows


def build_prerequisite_edges(track_rows: list[dict[str, Any]]) -> list[dict[str, str]]:
    rows: list[dict[str, str]] = []
    for row in track_rows:
        for dependency_kind, refs in (
            ("seq_task", row["requiredSeqTaskRefs"]),
            ("shared_package", row["requiredSharedPackageRefs"]),
            ("schema", row["requiredSchemaRefs"]),
            ("shared_seam", row["requiredSharedSeamRefs"]),
            ("simulator", row["requiredSimulatorRefs"]),
            ("interface_stub", row["parallelInterfaceStubRefs"]),
        ):
            for dependency_ref in refs:
                rows.append(
                    {
                        "edgeId": f"{row['trackTaskId']}::{dependency_kind}::{dependency_ref}",
                        "trackTaskId": row["trackTaskId"],
                        "trackGroup": row["trackGroup"],
                        "claimableMode": row["claimableMode"],
                        "dependencyRef": dependency_ref,
                        "dependencyKind": dependency_kind,
                        "satisfactionState": "conditional" if dependency_kind == "interface_stub" else "published",
                        "notes": row["notes"],
                    }
                )
        for blocker_ref in row["blockingReasonRefs"]:
            rows.append(
                {
                    "edgeId": f"{row['trackTaskId']}::condition::{blocker_ref}",
                    "trackTaskId": row["trackTaskId"],
                    "trackGroup": row["trackGroup"],
                    "claimableMode": row["claimableMode"],
                    "dependencyRef": blocker_ref,
                    "dependencyKind": "condition",
                    "satisfactionState": "conditional",
                    "notes": row["notes"],
                }
            )
    return rows


def build_gate_doc(verdict: dict[str, Any], groups_payload: dict[str, Any], shared_seams_payload: dict[str, Any]) -> str:
    summary = verdict["summary"]
    return dedent(
        f"""
        # 61 Parallel Foundation Tracks Gate

        - Task: `{TASK_ID}`
        - Captured on: `{CAPTURED_ON}`
        - Generated at: `{TIMESTAMP}`
        - Visual mode: `{VISUAL_MODE}`

        Evaluate whether the Phase 0 parallel foundation block may open now and freeze the shard/seam rules that let `par_062` onward proceed without forking truth.

        ## Gate Verdict

        - Gate: `{verdict['gateId']}`
        - Verdict: `{verdict['gateVerdict']}`
        - Parallel block state: `{verdict['parallelBlockState']}`
        - Candidate tracks: `{summary['candidate_track_count']}`
        - Eligible now: `{summary['eligible_track_count']}`
        - Conditional: `{summary['conditional_track_count']}`
        - Blocked: `{summary['blocked_track_count']}`
        - Shared seams: `{summary['shared_seam_count']}`
        - Interface stubs: `{summary['interface_stub_count']}`

        {verdict['verdictSummary']}

        ## Why The Gate Opens

        - `seq_041-044` froze topology, service/package homes, and boundary ownership so parallel work can enter only through published package seams.
        - `seq_046-052` froze runtime topology, gateway surfaces, event registry, FHIR representation law, frontend manifest authority, release parity, and design publication.
        - `seq_053-060` froze audit, acting scope, lifecycle coordination, mutation law, adapter profiles, verification ladders, simulator/reference corpus, and recovery posture.
        - No candidate track now needs live provider onboarding as a prerequisite; simulator-first seams exist for all provider-like dependencies in this block.

        ## Conditional Lanes

        | Condition | Affected shards | Why it exists |
        | --- | --- | --- |
        | `CONDITION_061_SHARED_BACKEND_STUBS` | `SHARD_061_BACKEND_COORDINATORS` | Service/coordinator tracks must wait for shared package-root domain and event stubs instead of coupling to sibling private src files. |
        | `CONDITION_061_RUNTIME_SUBSTRATE_HANDOFFS` | `SHARD_061_RUNTIME_GOVERNORS` | Runtime governor tracks need one shared substrate/publication handoff contract before automating release and recovery controls. |
        | `CONDITION_061_FRONTEND_SEED_EXPORTS` | `SHARD_061_FRONTEND_SEEDS` | Seed-shell tracks must consume shared shell exports, automation markers, and mock projection catalogs. |

        ## Track Group Counts

        | Group | Eligible | Conditional | Blocked | Shards |
        | --- | ---: | ---: | ---: | --- |
        {"".join(f"| `{group['trackGroup']}` | {group['eligibleCount']} | {group['conditionalCount']} | {group['blockedCount']} | {', '.join(group['shardRefs'])} |\n" for group in groups_payload['trackGroups'])}

        ## Shared Seam Coverage

        | Seam | Class | Consumer groups |
        | --- | --- | --- |
        {"".join(f"| `{seam['seamId']}` | `{seam['seamClass']}` | {', '.join(seam['consumerTrackGroups'])} |\n" for seam in shared_seams_payload['sharedSeams'])}

        ## Gap Closures

        - The parallel block no longer opens “because the roadmap says so”; each track row now names the exact sequential prerequisites, schemas, simulator refs, and shared seams it needs.
        - Shared seam inventory is frozen before parallel work begins, so sibling tracks do not need to infer package homes, event shapes, route law, or runtime tuples later.
        - Simulator-first and recovery-law prerequisites are explicit per track, closing the gap where backend or frontend work could otherwise assume live providers or mutable posture.
        - No blocked track is hidden by a blanket green verdict because the gate publishes per-track eligibility and conditions.
        """
    ).strip()


def build_eligibility_doc(track_rows: list[dict[str, Any]]) -> str:
    sections = []
    for group_id, group_label in TRACK_GROUP_LABELS.items():
        rows = [row for row in track_rows if row["trackGroup"] == group_id]
        section = [
            f"## {group_label}",
            "",
            "| Task | Mode | Shard | Shared packages | Schemas | Simulators | Conditions |",
            "| --- | --- | --- | --- | --- | --- | --- |",
        ]
        for row in rows:
            section.append(
                "| "
                + " | ".join(
                    [
                        f"`{row['trackTaskId']}`",
                        f"`{row['claimableMode']}`",
                        f"`{row['trackShardId']}`",
                        ", ".join(f"`{item}`" for item in row["requiredSharedPackageRefs"]),
                        ", ".join(f"`{item}`" for item in row["requiredSchemaRefs"]),
                        ", ".join(f"`{item}`" for item in row["requiredSimulatorRefs"]) or "none",
                        ", ".join(f"`{item}`" for item in row["blockingReasonRefs"]) or "none",
                    ]
                )
                + " |"
            )
        sections.append("\n".join(section))
    return dedent(
        f"""
        # 61 Parallel Track Eligibility Matrix

        This matrix is the per-track gate output for the first contiguous Phase 0 parallel window. `eligible` means the track may start immediately against already-frozen sequential law. `conditional` means the track may start only after the named shared stubs are published.

        {"\n\n".join(sections)}
        """
    ).strip()


def build_shard_doc(groups_payload: dict[str, Any], shared_seams_payload: dict[str, Any]) -> str:
    shard_table = "\n".join(
        f"| `{shard['shardId']}` | `{shard['trackGroup']}` | {shard['trackCount']} | `{shard['claimableMode']}` | "
        f"{', '.join(f'`{ref}`' for ref in shard['requiredSharedSeamRefs'])} | "
        f"{', '.join(f'`{ref}`' for ref in shard['requiredInterfaceStubRefs']) or 'none'} |"
        for shard in groups_payload["trackShards"]
    )
    seam_table = "\n".join(
        f"| `{seam['seamId']}` | `{', '.join(seam['packageRefs']) or 'docs/data only'}` | "
        f"{', '.join(f'`{ref}`' for ref in seam['artifactRefs'])} | "
        f"{', '.join(f'`{ref}`' for ref in seam['owningSeqTaskRefs'])} |"
        for seam in shared_seams_payload["sharedSeams"]
    )
    stub_table = "\n".join(
        f"| `{stub['stubRef']}` | `{stub['publicationTargetRef']}` | `{stub['providedBySeamId']}` | "
        f"{', '.join(f'`{ref}`' for ref in stub['requiredByTaskRefs'])} |"
        for stub in shared_seams_payload["interfaceStubs"]
    )
    return dedent(
        f"""
        # 61 Parallel Dependency Shard Map

        ## Shards

        | Shard | Group | Tracks | Mode | Required seams | Required stubs |
        | --- | --- | ---: | --- | --- | --- |
        {shard_table}

        ## Shared Seams

        | Seam | Package refs | Artifact refs | Owning seq tasks |
        | --- | --- | --- | --- |
        {seam_table}

        ## Interface Stubs

        | Stub | Publication target | Provided by seam | Required by tasks |
        | --- | --- | --- | --- |
        {stub_table}

        ## Interpretation Rules

        - Conditional tracks may start only on shared package-root stubs. They may not deep-import sibling prototypes while those prototypes are still under construction.
        - All provider-like dependencies stay simulator-backed in this block. Later live-cutover tasks remain separate and out of scope here.
        - Frontend seeds depend on shared shell exports, shared mock projection catalogs, and shared automation vocabulary; shell-local contract invention is explicitly forbidden.
        - Runtime automation depends on the already-frozen release/recovery tuple and may not reconstruct it from dashboards, scripts, or wiki pages.
        """
    ).strip()


def build_validator() -> str:
    return dedent(
        f"""
        #!/usr/bin/env python3
        from __future__ import annotations

        import csv
        import json
        from pathlib import Path


        ROOT = Path(__file__).resolve().parents[2]
        DATA_DIR = ROOT / "data" / "analysis"

        GROUPS_PATH = DATA_DIR / "parallel_foundation_track_groups.json"
        ELIGIBILITY_PATH = DATA_DIR / "parallel_track_eligibility.csv"
        EDGES_PATH = DATA_DIR / "parallel_track_prerequisite_edges.csv"
        SEAMS_PATH = DATA_DIR / "parallel_track_shared_seams.json"
        VERDICT_PATH = DATA_DIR / "parallel_foundation_gate_verdict.json"


        def read_json(path: Path):
            return json.loads(path.read_text())


        def read_csv(path: Path):
            with path.open() as handle:
                return list(csv.DictReader(handle))


        groups = read_json(GROUPS_PATH)
        rows = read_csv(ELIGIBILITY_PATH)
        edges = read_csv(EDGES_PATH)
        seams = read_json(SEAMS_PATH)
        verdict = read_json(VERDICT_PATH)

        assert groups["task_id"] == "{TASK_ID}"
        assert verdict["gateId"] == "GATE_P0_PARALLEL_FOUNDATION_OPEN"
        assert verdict["gateVerdict"] == "conditional"
        assert groups["summary"]["candidate_track_count"] == 65
        assert groups["summary"]["eligible_track_count"] == 43
        assert groups["summary"]["conditional_track_count"] == 21
        assert groups["summary"]["blocked_track_count"] == 0
        assert len(rows) == 65
        assert len(groups["trackGroups"]) == 4
        assert len(groups["trackShards"]) == 7
        assert seams["summary"]["shared_seam_count"] == 12
        assert seams["summary"]["interface_stub_count"] == 11
        assert len(verdict["eligibleTrackTaskRefs"]) == 43
        assert len(verdict["conditionalTrackTaskRefs"]) == 21
        assert len(verdict["blockedTrackTaskRefs"]) == 0
        assert len(verdict["requiredSharedSeamRefs"]) == 12

        row_map = {{row["trackTaskId"]: row for row in rows}}
        assert row_map["par_062"]["claimableMode"] == "eligible"
        assert row_map["par_077"]["claimableMode"] == "conditional"
        assert row_map["par_084"]["claimableMode"] == "eligible"
        assert row_map["par_094"]["claimableMode"] == "conditional"
        assert row_map["par_103"]["claimableMode"] == "eligible"
        assert row_map["par_115"]["claimableMode"] == "conditional"
        assert row_map["par_121"]["claimableMode"] == "eligible"

        frontend_rows = [row for row in rows if row["trackGroup"] == "frontend_shells"]
        assert len(frontend_rows) == 18
        for row in frontend_rows:
            packages = row["requiredSharedPackageRefs"]
            schemas = row["requiredSchemaRefs"]
            assert "@vecells/design-system" in packages
            assert "schema::frontend-contract-manifest" in schemas
            assert "schema::release-contract-verification-matrix" in schemas
            assert "schema::recovery-control-posture" in schemas

        backend_rows = [row for row in rows if row["trackGroup"] == "backend_kernel"]
        assert len(backend_rows) == 22
        for row in backend_rows:
            packages = row["requiredSharedPackageRefs"]
            schemas = row["requiredSchemaRefs"]
            assert "@vecells/domain-kernel" in packages
            assert "@vecells/event-contracts" in packages
            assert "schema::route-intent-binding" in schemas
            assert "schema::command-settlement-record" in schemas
            assert "schema::adapter-contract-profile" in schemas
            assert "schema::recovery-control-posture" in schemas

        must_be_simulator_backed = {{
            "par_068",
            "par_069",
            "par_074",
            "par_083",
            "par_090",
            "par_092",
            "par_098",
            "par_101",
            "par_102",
            "par_115",
            "par_116",
            "par_117",
            "par_118",
            "par_119",
            "par_120",
            "par_123",
            "par_124",
        }}
        for task_id in must_be_simulator_backed:
            assert row_map[task_id]["requiredSimulatorRefs"], task_id
            assert "live_" not in row_map[task_id]["requiredSimulatorRefs"].lower(), task_id

        eligible_rows = [row for row in rows if row["claimableMode"] == "eligible"]
        for row in eligible_rows:
            assert row["requiredSeqTaskRefs"], row["trackTaskId"]
            assert row["requiredSharedPackageRefs"], row["trackTaskId"]
            assert row["requiredSchemaRefs"], row["trackTaskId"]
            assert row["requiredSharedSeamRefs"], row["trackTaskId"]

        conditional_rows = [row for row in rows if row["claimableMode"] == "conditional"]
        for row in conditional_rows:
            assert row["parallelInterfaceStubRefs"], row["trackTaskId"]
            assert row["blockingReasonRefs"], row["trackTaskId"]

        edge_task_refs = {{edge["trackTaskId"] for edge in edges}}
        assert edge_task_refs == set(row_map)

        print("{TASK_ID} parallel foundation gate validation passed")
        """
    ).strip() + "\n"


def build_html() -> str:
    return dedent(
        """
        <!doctype html>
        <html lang="en">
          <head>
            <meta charset="utf-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1" />
            <title>Parallel Foundation Gate Cockpit</title>
            <link
              rel="icon"
              href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect x='6' y='6' width='52' height='52' rx='16' fill='%233559E6'/%3E%3Cpath d='M20 18h10c6 0 10 4 10 9s-4 9-10 9H20z' fill='white'/%3E%3Cpath d='M20 18h9c5 0 8 4 8 9s-3 9-8 9h-9z' fill='none' stroke='%233559E6' stroke-width='3'/%3E%3Cpath d='M36 18h10v28H36' fill='none' stroke='white' stroke-width='6' stroke-linecap='round'/%3E%3C/svg%3E"
            />
            <style>
              :root {
                --canvas: #f6f8fb;
                --rail: #eef2f7;
                --panel: #ffffff;
                --inset: #f3f5fa;
                --text-strong: #0f172a;
                --text-default: #1e293b;
                --text-muted: #667085;
                --border-subtle: #e2e8f0;
                --border-default: #cbd5e1;
                --primary: #3559e6;
                --eligible: #0f9d58;
                --conditional: #c98900;
                --blocked: #c24141;
                --seam: #7c3aed;
                --shadow: 0 18px 42px rgba(15, 23, 42, 0.08);
                --radius: 18px;
                --max-width: 1500px;
              }
              * {
                box-sizing: border-box;
              }
              html,
              body {
                margin: 0;
                padding: 0;
                background: var(--canvas);
                color: var(--text-default);
                font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
              }
              body {
                min-height: 100vh;
              }
              body[data-reduced-motion="true"] * {
                transition-duration: 1ms !important;
                animation-duration: 1ms !important;
                scroll-behavior: auto !important;
              }
              button,
              select {
                font: inherit;
              }
              button {
                cursor: pointer;
                background: transparent;
                border: 0;
                color: inherit;
                text-align: left;
              }
              select {
                min-height: 44px;
                border-radius: 14px;
                border: 1px solid var(--border-default);
                background: var(--panel);
                padding: 0 12px;
              }
              :focus-visible {
                outline: 2px solid var(--primary);
                outline-offset: 2px;
              }
              .app {
                max-width: var(--max-width);
                margin: 0 auto;
                padding: 24px;
                display: grid;
                gap: 24px;
              }
              .masthead {
                position: sticky;
                top: 0;
                z-index: 10;
                min-height: 72px;
                display: grid;
                gap: 14px;
                padding: 18px 20px;
                border: 1px solid var(--border-default);
                border-radius: 24px;
                background: linear-gradient(140deg, rgba(53, 89, 230, 0.08), rgba(124, 58, 237, 0.06), rgba(255, 255, 255, 0.92));
                box-shadow: var(--shadow);
                backdrop-filter: blur(14px);
              }
              .masthead-top {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                gap: 16px;
              }
              .wordmark {
                display: inline-flex;
                align-items: center;
                gap: 12px;
                letter-spacing: 0.12em;
                text-transform: uppercase;
                font-weight: 800;
                color: var(--text-strong);
              }
              .wordmark svg {
                width: 40px;
                height: 40px;
              }
              .masthead h1 {
                margin: 8px 0 0;
                font-size: clamp(1.7rem, 2.8vw, 2.5rem);
                line-height: 1.05;
                color: var(--text-strong);
              }
              .masthead p {
                margin: 0;
                max-width: 72ch;
                color: var(--text-muted);
                line-height: 1.55;
              }
              .summary-strip {
                display: grid;
                grid-template-columns: repeat(4, minmax(0, 1fr));
                gap: 12px;
              }
              .summary-card {
                background: rgba(255, 255, 255, 0.84);
                border: 1px solid var(--border-subtle);
                border-radius: 16px;
                padding: 14px 16px;
                min-height: 88px;
                display: grid;
                gap: 4px;
              }
              .summary-label {
                color: var(--text-muted);
                font-size: 0.76rem;
                letter-spacing: 0.08em;
                text-transform: uppercase;
              }
              .summary-value {
                color: var(--text-strong);
                font-size: 1.48rem;
                font-weight: 800;
              }
              .chip {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                min-height: 28px;
                padding: 0 12px;
                border-radius: 999px;
                font-size: 0.82rem;
                font-weight: 800;
              }
              .chip-conditional {
                color: var(--conditional);
                background: rgba(201, 137, 0, 0.14);
              }
              .chip-eligible {
                color: var(--eligible);
                background: rgba(15, 157, 88, 0.14);
              }
              .chip-blocked {
                color: var(--blocked);
                background: rgba(194, 65, 65, 0.12);
              }
              .shell {
                display: grid;
                grid-template-columns: 300px minmax(0, 1fr) 396px;
                gap: 24px;
                align-items: start;
              }
              .panel {
                background: var(--panel);
                border: 1px solid var(--border-subtle);
                border-radius: var(--radius);
                box-shadow: var(--shadow);
                overflow: hidden;
              }
              .panel-header {
                padding: 18px 18px 12px;
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 10px;
                border-bottom: 1px solid var(--border-subtle);
                background: linear-gradient(180deg, rgba(243, 245, 250, 0.88), rgba(255, 255, 255, 0.96));
              }
              .panel-title {
                margin: 0;
                font-size: 0.97rem;
                font-weight: 800;
                color: var(--text-strong);
              }
              .rail-body,
              .inspector-body,
              .panel-body {
                padding: 16px;
                display: grid;
                gap: 14px;
              }
              .rail-body {
                max-height: calc(100vh - 180px);
                overflow: auto;
                background: var(--rail);
              }
              .filter-group {
                display: grid;
                gap: 8px;
                padding: 14px;
                border-radius: 16px;
                border: 1px solid var(--border-subtle);
                background: var(--panel);
              }
              .filter-group h3 {
                margin: 0;
                color: var(--text-muted);
                text-transform: uppercase;
                letter-spacing: 0.08em;
                font-size: 0.76rem;
              }
              .verdict-banner {
                display: grid;
                gap: 10px;
                padding: 14px 16px;
                border-radius: 18px;
                border: 1px solid rgba(201, 137, 0, 0.34);
                background: linear-gradient(140deg, rgba(201, 137, 0, 0.1), rgba(124, 58, 237, 0.06), rgba(255, 255, 255, 0.92));
              }
              .verdict-banner strong {
                color: var(--text-strong);
                font-size: 1rem;
              }
              .mini-grid {
                display: grid;
                grid-template-columns: repeat(2, minmax(0, 1fr));
                gap: 12px;
              }
              .metric-box {
                border: 1px solid var(--border-subtle);
                background: var(--inset);
                border-radius: 16px;
                padding: 12px;
                display: grid;
                gap: 4px;
              }
              .metric-box span {
                color: var(--text-muted);
                font-size: 0.76rem;
                text-transform: uppercase;
                letter-spacing: 0.08em;
              }
              .metric-box strong {
                color: var(--text-strong);
                font-size: 1.22rem;
              }
              .center-stack {
                display: grid;
                gap: 24px;
              }
              .diagram-grid {
                display: grid;
                grid-template-columns: minmax(0, 1.2fr) minmax(0, 0.9fr);
                gap: 16px;
                min-height: 620px;
              }
              .diagram-card {
                display: grid;
                gap: 14px;
                padding: 16px;
                border: 1px solid var(--border-subtle);
                border-radius: 18px;
                background: var(--inset);
              }
              .diagram-card h3 {
                margin: 0;
                font-size: 0.9rem;
                color: var(--text-strong);
              }
              .shard-grid,
              .seam-grid,
              .track-grid {
                display: grid;
                gap: 10px;
              }
              .shard-grid {
                grid-template-columns: repeat(2, minmax(0, 1fr));
              }
              .seam-grid,
              .track-grid {
                grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
              }
              .shard-node,
              .seam-node,
              .track-card,
              .table-row-button {
                border: 1px solid transparent;
                border-radius: 18px;
                background: var(--panel);
                transition:
                  transform 120ms ease,
                  border-color 120ms ease,
                  box-shadow 180ms ease;
              }
              .shard-node:hover,
              .seam-node:hover,
              .track-card:hover,
              .table-row-button:hover {
                transform: translateY(-1px);
                border-color: var(--border-default);
              }
              .shard-node[data-selected="true"],
              .seam-node[data-selected="true"],
              .track-card[data-selected="true"],
              .table-row-button[data-selected="true"] {
                border-color: rgba(53, 89, 230, 0.42);
                box-shadow: 0 0 0 3px rgba(53, 89, 230, 0.1);
              }
              .shard-node,
              .seam-node {
                padding: 14px;
                display: grid;
                gap: 8px;
              }
              .track-card {
                min-height: 160px;
                padding: 16px;
                display: grid;
                gap: 10px;
                align-content: start;
              }
              .mono {
                font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
              }
              .track-card strong,
              .shard-node strong,
              .seam-node strong {
                color: var(--text-strong);
                font-size: 0.95rem;
              }
              .subtle {
                color: var(--text-muted);
                font-size: 0.84rem;
                line-height: 1.45;
              }
              .pill-row {
                display: flex;
                flex-wrap: wrap;
                gap: 8px;
              }
              .pill {
                display: inline-flex;
                align-items: center;
                min-height: 26px;
                padding: 0 10px;
                border-radius: 999px;
                background: rgba(53, 89, 230, 0.08);
                color: var(--primary);
                font-size: 0.76rem;
                font-weight: 700;
              }
              .pill-seam {
                background: rgba(124, 58, 237, 0.08);
                color: var(--seam);
              }
              .table-wrap {
                overflow: auto;
                border: 1px solid var(--border-subtle);
                border-radius: 18px;
              }
              table {
                width: 100%;
                border-collapse: collapse;
                min-width: 720px;
                background: var(--panel);
              }
              th,
              td {
                padding: 12px 14px;
                border-bottom: 1px solid var(--border-subtle);
                text-align: left;
                vertical-align: top;
              }
              th {
                background: rgba(243, 245, 250, 0.88);
                color: var(--text-muted);
                font-size: 0.74rem;
                letter-spacing: 0.08em;
                text-transform: uppercase;
              }
              .table-row-button {
                width: 100%;
                padding: 0;
              }
              .defect-strip {
                display: grid;
                gap: 10px;
              }
              .defect-card {
                padding: 14px 16px;
                border-radius: 16px;
                border: 1px solid rgba(201, 137, 0, 0.24);
                background: rgba(201, 137, 0, 0.08);
                display: grid;
                gap: 8px;
              }
              .inspector-section {
                display: grid;
                gap: 10px;
                padding: 14px;
                border-radius: 16px;
                border: 1px solid var(--border-subtle);
                background: var(--inset);
                transition: transform 220ms ease, opacity 220ms ease;
              }
              .inspector-section h3 {
                margin: 0;
                font-size: 0.83rem;
                letter-spacing: 0.08em;
                text-transform: uppercase;
                color: var(--text-muted);
              }
              ul {
                margin: 0;
                padding-left: 18px;
              }
              li + li {
                margin-top: 4px;
              }
              @media (max-width: 1180px) {
                .shell {
                  grid-template-columns: 1fr;
                }
                .diagram-grid {
                  grid-template-columns: 1fr;
                  min-height: auto;
                }
              }
              @media (max-width: 780px) {
                .summary-strip {
                  grid-template-columns: repeat(2, minmax(0, 1fr));
                }
                .shard-grid,
                .seam-grid,
                .track-grid {
                  grid-template-columns: 1fr;
                }
              }
            </style>
          </head>
          <body>
            <div class="app">
              <header class="masthead">
                <div class="masthead-top">
                  <div>
                    <div class="wordmark">
                      <svg viewBox="0 0 64 64" aria-hidden="true">
                        <rect x="6" y="6" width="52" height="52" rx="16" fill="#3559E6"></rect>
                        <path d="M21 18h11c6 0 10 4 10 9s-4 9-10 9H21z" fill="white"></path>
                        <path d="M21 18h10c5 0 8 4 8 9s-3 9-8 9H21z" fill="none" stroke="#3559E6" stroke-width="3"></path>
                        <path d="M37 18h8v28h-8" fill="none" stroke="white" stroke-width="6" stroke-linecap="round"></path>
                      </svg>
                      Vecells
                    </div>
                    <h1>Parallel Foundation Gate</h1>
                  </div>
                  <div id="verdict-chip" class="chip chip-conditional" data-testid="verdict-chip">conditional</div>
                </div>
                <p id="verdict-summary"></p>
                <div class="summary-strip">
                  <article class="summary-card">
                    <span class="summary-label">Eligible Tracks</span>
                    <strong class="summary-value" data-testid="eligible-count">0</strong>
                  </article>
                  <article class="summary-card">
                    <span class="summary-label">Conditional Tracks</span>
                    <strong class="summary-value" data-testid="conditional-count">0</strong>
                  </article>
                  <article class="summary-card">
                    <span class="summary-label">Blocked Tracks</span>
                    <strong class="summary-value" data-testid="blocked-count">0</strong>
                  </article>
                  <article class="summary-card">
                    <span class="summary-label">Shared Seams</span>
                    <strong class="summary-value" data-testid="seam-count">0</strong>
                  </article>
                </div>
              </header>

              <main class="shell">
                <aside class="panel" aria-label="Filters">
                  <div class="panel-header">
                    <h2 class="panel-title">Filters</h2>
                    <span class="chip chip-conditional" data-testid="filter-chip">exact gate</span>
                  </div>
                  <div class="rail-body">
                    <section class="filter-group" data-testid="verdict-banner">
                      <h3>Gate verdict</h3>
                      <div class="verdict-banner">
                        <strong id="banner-title">Parallel block verdict</strong>
                        <p id="banner-summary" class="subtle"></p>
                      </div>
                    </section>
                    <section class="filter-group">
                      <h3>Track group</h3>
                      <select id="group-filter" data-testid="group-filter">
                        <option value="all">All track groups</option>
                      </select>
                    </section>
                    <section class="filter-group">
                      <h3>Eligibility</h3>
                      <select id="mode-filter" data-testid="eligibility-filter">
                        <option value="all">All modes</option>
                        <option value="eligible">Eligible</option>
                        <option value="conditional">Conditional</option>
                        <option value="blocked">Blocked</option>
                      </select>
                    </section>
                    <section class="filter-group">
                      <h3>Gate metrics</h3>
                      <div class="mini-grid">
                        <div class="metric-box">
                          <span>Shard count</span>
                          <strong data-testid="shard-count">0</strong>
                        </div>
                        <div class="metric-box">
                          <span>Stub count</span>
                          <strong data-testid="stub-count">0</strong>
                        </div>
                        <div class="metric-box">
                          <span>Seq refs</span>
                          <strong data-testid="seq-count">0</strong>
                        </div>
                        <div class="metric-box">
                          <span>Condition rows</span>
                          <strong data-testid="condition-count">0</strong>
                        </div>
                      </div>
                    </section>
                  </div>
                </aside>

                <section class="center-stack">
                  <section class="panel">
                    <div class="panel-header">
                      <h2 class="panel-title">Shard And Seam Diagrams</h2>
                      <span class="subtle" id="diagram-caption"></span>
                    </div>
                    <div class="panel-body diagram-grid">
                      <article class="diagram-card">
                        <h3>Track shard map</h3>
                        <div class="shard-grid" data-testid="shard-map" id="shard-map"></div>
                        <div class="table-wrap">
                          <table data-testid="shard-parity-table" id="shard-parity-table">
                            <thead>
                              <tr>
                                <th>Shard</th>
                                <th>Mode</th>
                                <th>Tracks</th>
                              </tr>
                            </thead>
                            <tbody></tbody>
                          </table>
                        </div>
                      </article>
                      <article class="diagram-card">
                        <h3>Shared seam diagram</h3>
                        <div class="seam-grid" data-testid="seam-diagram" id="seam-diagram"></div>
                        <div class="table-wrap">
                          <table data-testid="seam-parity-table" id="seam-parity-table">
                            <thead>
                              <tr>
                                <th>Seam</th>
                                <th>Class</th>
                                <th>Consumer groups</th>
                              </tr>
                            </thead>
                            <tbody></tbody>
                          </table>
                        </div>
                      </article>
                    </div>
                  </section>

                  <section class="panel">
                    <div class="panel-header">
                      <h2 class="panel-title">Track Cards</h2>
                      <span class="subtle" id="visible-track-count"></span>
                    </div>
                    <div class="panel-body">
                      <div class="track-grid" id="track-grid"></div>
                    </div>
                  </section>

                  <section class="panel">
                    <div class="panel-header">
                      <h2 class="panel-title">Eligibility Matrix</h2>
                      <span class="subtle">Table parity for the visible track set</span>
                    </div>
                    <div class="panel-body">
                      <div class="table-wrap">
                        <table data-testid="eligibility-matrix" id="eligibility-matrix">
                          <thead>
                            <tr>
                              <th>Task</th>
                              <th>Mode</th>
                              <th>Group</th>
                              <th>Shard</th>
                              <th>Seq refs</th>
                            </tr>
                          </thead>
                          <tbody></tbody>
                        </table>
                      </div>
                    </div>
                  </section>

                  <section class="panel">
                    <div class="panel-header">
                      <h2 class="panel-title">Prerequisite Edges</h2>
                      <span class="subtle">Published vs conditional edge state</span>
                    </div>
                    <div class="panel-body">
                      <div class="table-wrap">
                        <table data-testid="edge-table" id="edge-table">
                          <thead>
                            <tr>
                              <th>Dependency</th>
                              <th>Kind</th>
                              <th>State</th>
                              <th>Track</th>
                            </tr>
                          </thead>
                          <tbody></tbody>
                        </table>
                      </div>
                    </div>
                  </section>

                  <section class="panel">
                    <div class="panel-header">
                      <h2 class="panel-title">Defect Strip</h2>
                      <span class="subtle">Conditions stay visible even while the gate opens</span>
                    </div>
                    <div class="panel-body defect-strip" data-testid="defect-strip" id="defect-strip"></div>
                  </section>
                </section>

                <aside class="panel" aria-label="Track inspector">
                  <div class="panel-header">
                    <h2 class="panel-title">Inspector</h2>
                    <span class="subtle">Selected track</span>
                  </div>
                  <div class="inspector-body" data-testid="inspector" id="inspector"></div>
                </aside>
              </main>
            </div>

            <script type="module">
              const GROUPS_PATH = "../../data/analysis/parallel_foundation_track_groups.json";
              const SEAMS_PATH = "../../data/analysis/parallel_track_shared_seams.json";
              const VERDICT_PATH = "../../data/analysis/parallel_foundation_gate_verdict.json";
              const ELIGIBILITY_PATH = "../../data/analysis/parallel_track_eligibility.csv";
              const EDGES_PATH = "../../data/analysis/parallel_track_prerequisite_edges.csv";

              const state = {
                groupsPayload: null,
                seamsPayload: null,
                verdictPayload: null,
                trackRows: [],
                edgeRows: [],
                filters: { group: "all", mode: "all" },
                visibleTracks: [],
                selectedTrackId: null,
              };

              function parseCsv(text) {
                const rows = [];
                let field = "";
                let row = [];
                let inQuotes = false;
                for (let index = 0; index < text.length; index += 1) {
                  const character = text[index];
                  const nextCharacter = text[index + 1];
                  if (character === '"') {
                    if (inQuotes && nextCharacter === '"') {
                      field += '"';
                      index += 1;
                    } else {
                      inQuotes = !inQuotes;
                    }
                    continue;
                  }
                  if (character === "," && !inQuotes) {
                    row.push(field);
                    field = "";
                    continue;
                  }
                  if ((character === "\\n" || character === "\\r") && !inQuotes) {
                    if (character === "\\r" && nextCharacter === "\\n") {
                      index += 1;
                    }
                    if (field.length > 0 || row.length > 0) {
                      row.push(field);
                      rows.push(row);
                      row = [];
                      field = "";
                    }
                    continue;
                  }
                  field += character;
                }
                if (field.length > 0 || row.length > 0) {
                  row.push(field);
                  rows.push(row);
                }
                const [header, ...body] = rows;
                return body.map((values) =>
                  Object.fromEntries(header.map((column, index) => [column, values[index] ?? ""])),
                );
              }

              function splitList(value) {
                return value
                  .split(";")
                  .map((item) => item.trim())
                  .filter(Boolean);
              }

              function setReducedMotionFlag() {
                const media = window.matchMedia("(prefers-reduced-motion: reduce)");
                const apply = () => {
                  document.body.dataset.reducedMotion = media.matches ? "true" : "false";
                };
                apply();
                media.addEventListener("change", apply);
              }

              function modeChip(mode) {
                if (mode === "eligible") return "chip chip-eligible";
                if (mode === "blocked") return "chip chip-blocked";
                return "chip chip-conditional";
              }

              function hydrateFilters() {
                const groupFilter = document.getElementById("group-filter");
                state.groupsPayload.trackGroups.forEach((group) => {
                  const option = document.createElement("option");
                  option.value = group.trackGroup;
                  option.textContent = group.label;
                  groupFilter.append(option);
                });
                groupFilter.addEventListener("change", (event) => {
                  state.filters.group = event.target.value;
                  applyFilters();
                });
                document.getElementById("mode-filter").addEventListener("change", (event) => {
                  state.filters.mode = event.target.value;
                  applyFilters();
                });
              }

              function applyFilters() {
                state.visibleTracks = state.trackRows.filter((row) => {
                  const groupMatch =
                    state.filters.group === "all" || row.trackGroup === state.filters.group;
                  const modeMatch =
                    state.filters.mode === "all" || row.claimableMode === state.filters.mode;
                  return groupMatch && modeMatch;
                });
                if (
                  !state.selectedTrackId ||
                  !state.visibleTracks.some((row) => row.trackTaskId === state.selectedTrackId)
                ) {
                  state.selectedTrackId = state.visibleTracks[0]?.trackTaskId ?? null;
                }
                render();
              }

              function selectedTrack() {
                return state.trackRows.find((row) => row.trackTaskId === state.selectedTrackId) ?? null;
              }

              function selectTrack(trackTaskId) {
                state.selectedTrackId = trackTaskId;
                render();
              }

              function renderSummary() {
                const summary = state.verdictPayload.summary;
                document.querySelector("[data-testid='eligible-count']").textContent =
                  summary.eligible_track_count;
                document.querySelector("[data-testid='conditional-count']").textContent =
                  summary.conditional_track_count;
                document.querySelector("[data-testid='blocked-count']").textContent =
                  summary.blocked_track_count;
                document.querySelector("[data-testid='seam-count']").textContent =
                  summary.shared_seam_count;
                document.querySelector("[data-testid='shard-count']").textContent =
                  summary.shard_count;
                document.querySelector("[data-testid='stub-count']").textContent =
                  summary.interface_stub_count;
                document.querySelector("[data-testid='seq-count']").textContent =
                  summary.required_seq_task_count;
                document.querySelector("[data-testid='condition-count']").textContent =
                  summary.required_condition_count;
                document.getElementById("verdict-summary").textContent =
                  state.verdictPayload.verdictSummary;
                document.getElementById("banner-summary").textContent =
                  state.verdictPayload.notes;
              }

              function renderShards() {
                const selected = selectedTrack();
                const selectedShardId = selected?.trackShardId ?? null;
                const shardMap = document.getElementById("shard-map");
                const parityBody = document.querySelector("#shard-parity-table tbody");
                shardMap.innerHTML = "";
                parityBody.innerHTML = "";
                state.groupsPayload.trackShards.forEach((shard) => {
                  const selectedAttr = String(shard.shardId === selectedShardId);
                  const button = document.createElement("button");
                  button.type = "button";
                  button.className = "shard-node";
                  button.dataset.selected = selectedAttr;
                  button.dataset.testid = `shard-node-${shard.shardId}`;
                  button.setAttribute("data-testid", `shard-node-${shard.shardId}`);
                  button.innerHTML = `
                    <span class="${modeChip(shard.claimableMode)}">${shard.claimableMode}</span>
                    <strong class="mono">${shard.shardId}</strong>
                    <span>${shard.label}</span>
                    <span class="subtle">${shard.taskRefs.join(", ")}</span>
                  `;
                  button.addEventListener("click", () => {
                    selectTrack(shard.taskRefs[0]);
                  });
                  shardMap.append(button);

                  const tr = document.createElement("tr");
                  tr.innerHTML = `
                    <td class="mono">${shard.shardId}</td>
                    <td>${shard.claimableMode}</td>
                    <td>${shard.taskCount}</td>
                  `;
                  parityBody.append(tr);
                });
              }

              function renderSeams() {
                const selected = selectedTrack();
                const requiredSeams = new Set(selected?.requiredSharedSeamRefs ?? []);
                const seamGrid = document.getElementById("seam-diagram");
                const parityBody = document.querySelector("#seam-parity-table tbody");
                seamGrid.innerHTML = "";
                parityBody.innerHTML = "";
                state.seamsPayload.sharedSeams.forEach((seam) => {
                  const selectedAttr = String(requiredSeams.has(seam.seamId));
                  const button = document.createElement("button");
                  button.type = "button";
                  button.className = "seam-node";
                  button.dataset.selected = selectedAttr;
                  button.setAttribute("data-testid", `seam-node-${seam.seamId}`);
                  button.innerHTML = `
                    <span class="pill pill-seam">${seam.seamClass}</span>
                    <strong class="mono">${seam.seamId}</strong>
                    <span>${seam.title}</span>
                    <span class="subtle">${seam.consumerTrackGroups.join(", ")}</span>
                  `;
                  seamGrid.append(button);

                  const tr = document.createElement("tr");
                  tr.innerHTML = `
                    <td class="mono">${seam.seamId}</td>
                    <td>${seam.seamClass}</td>
                    <td>${seam.consumerTrackGroups.join(", ")}</td>
                  `;
                  parityBody.append(tr);
                });
              }

              function renderTrackCards() {
                const trackGrid = document.getElementById("track-grid");
                trackGrid.innerHTML = "";
                document.getElementById("visible-track-count").textContent =
                  `${state.visibleTracks.length} visible tracks`;
                state.visibleTracks.forEach((track, index) => {
                  const button = document.createElement("button");
                  button.type = "button";
                  button.className = "track-card";
                  button.dataset.selected = String(track.trackTaskId === state.selectedTrackId);
                  button.setAttribute("data-testid", `track-card-${track.trackTaskId}`);
                  button.tabIndex = track.trackTaskId === state.selectedTrackId ? 0 : -1;
                  button.innerHTML = `
                    <div class="pill-row">
                      <span class="${modeChip(track.claimableMode)}">${track.claimableMode}</span>
                      <span class="pill">${track.trackGroup}</span>
                    </div>
                    <strong class="mono">${track.trackTaskId}</strong>
                    <span>${track.trackTitle}</span>
                    <span class="subtle">${track.notes}</span>
                  `;
                  button.addEventListener("click", () => selectTrack(track.trackTaskId));
                  button.addEventListener("keydown", (event) => {
                    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
                    event.preventDefault();
                    const offset = event.key === "ArrowDown" ? 1 : -1;
                    const next = state.visibleTracks[index + offset];
                    if (next) {
                      state.selectedTrackId = next.trackTaskId;
                      render();
                      document
                        .querySelector(`[data-testid='track-card-${next.trackTaskId}']`)
                        ?.focus();
                    }
                  });
                  trackGrid.append(button);
                });
              }

              function renderMatrix() {
                const tbody = document.querySelector("#eligibility-matrix tbody");
                tbody.innerHTML = "";
                state.visibleTracks.forEach((track, index) => {
                  const button = document.createElement("button");
                  button.type = "button";
                  button.className = "table-row-button";
                  button.dataset.selected = String(track.trackTaskId === state.selectedTrackId);
                  button.setAttribute("data-testid", `matrix-row-${track.trackTaskId}`);
                  button.innerHTML = `
                    <table>
                      <tbody>
                        <tr>
                          <td class="mono">${track.trackTaskId}</td>
                          <td>${track.claimableMode}</td>
                          <td>${track.trackGroup}</td>
                          <td class="mono">${track.trackShardId}</td>
                          <td>${track.requiredSeqTaskRefs.join(", ")}</td>
                        </tr>
                      </tbody>
                    </table>
                  `;
                  button.addEventListener("click", () => selectTrack(track.trackTaskId));
                  button.addEventListener("keydown", (event) => {
                    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
                    event.preventDefault();
                    const offset = event.key === "ArrowDown" ? 1 : -1;
                    const next = state.visibleTracks[index + offset];
                    if (next) {
                      state.selectedTrackId = next.trackTaskId;
                      render();
                      document
                        .querySelector(`[data-testid='matrix-row-${next.trackTaskId}']`)
                        ?.focus();
                    }
                  });
                  const tr = document.createElement("tr");
                  const td = document.createElement("td");
                  td.colSpan = 5;
                  td.append(button);
                  tr.append(td);
                  tbody.append(tr);
                });
              }

              function renderEdges() {
                const selected = selectedTrack();
                const tbody = document.querySelector("#edge-table tbody");
                tbody.innerHTML = "";
                const edges = state.edgeRows.filter((edge) => edge.trackTaskId === selected?.trackTaskId);
                edges.forEach((edge) => {
                  const tr = document.createElement("tr");
                  tr.setAttribute("data-testid", `edge-row-${edge.dependencyRef.replace(/[^a-zA-Z0-9_-]/g, "_")}`);
                  tr.innerHTML = `
                    <td class="mono">${edge.dependencyRef}</td>
                    <td>${edge.dependencyKind}</td>
                    <td>${edge.satisfactionState}</td>
                    <td class="mono">${edge.trackTaskId}</td>
                  `;
                  tbody.append(tr);
                });
              }

              function renderDefects() {
                const defectStrip = document.getElementById("defect-strip");
                defectStrip.innerHTML = "";
                state.seamsPayload.conditions.forEach((condition) => {
                  const article = document.createElement("article");
                  article.className = "defect-card";
                  article.setAttribute("data-testid", `condition-card-${condition.conditionRef}`);
                  article.innerHTML = `
                    <strong class="mono">${condition.conditionRef}</strong>
                    <span>${condition.title}</span>
                    <span class="subtle">${condition.publicationRule}</span>
                  `;
                  defectStrip.append(article);
                });
              }

              function renderInspector() {
                const track = selectedTrack();
                const inspector = document.getElementById("inspector");
                if (!track) {
                  inspector.innerHTML = "<p class='subtle'>No track matches the active filter set.</p>";
                  return;
                }
                inspector.innerHTML = `
                  <section class="inspector-section">
                    <h3>Track</h3>
                    <strong class="mono">${track.trackTaskId}</strong>
                    <span>${track.trackTitle}</span>
                    <div class="pill-row">
                      <span class="${modeChip(track.claimableMode)}">${track.claimableMode}</span>
                      <span class="pill">${track.trackGroup}</span>
                      <span class="pill">${track.trackShardId}</span>
                    </div>
                  </section>
                  <section class="inspector-section">
                    <h3>Prerequisites</h3>
                    <ul>${track.requiredSeqTaskRefs.map((item) => `<li class="mono">${item}</li>`).join("")}</ul>
                  </section>
                  <section class="inspector-section">
                    <h3>Shared Seams</h3>
                    <ul>${track.requiredSharedSeamRefs.map((item) => `<li class="mono">${item}</li>`).join("")}</ul>
                  </section>
                  <section class="inspector-section">
                    <h3>Shared Packages</h3>
                    <ul>${track.requiredSharedPackageRefs.map((item) => `<li class="mono">${item}</li>`).join("")}</ul>
                  </section>
                  <section class="inspector-section">
                    <h3>Schemas And Simulators</h3>
                    <ul>
                      ${track.requiredSchemaRefs.map((item) => `<li class="mono">${item}</li>`).join("")}
                      ${track.requiredSimulatorRefs.map((item) => `<li class="mono">${item}</li>`).join("")}
                    </ul>
                  </section>
                  <section class="inspector-section">
                    <h3>Conditions</h3>
                    <ul>
                      ${(track.parallelInterfaceStubRefs.length ? track.parallelInterfaceStubRefs : ["none"]).map((item) => `<li class="mono">${item}</li>`).join("")}
                      ${(track.blockingReasonRefs.length ? track.blockingReasonRefs : []).map((item) => `<li class="mono">${item}</li>`).join("")}
                    </ul>
                  </section>
                  <section class="inspector-section">
                    <h3>Notes</h3>
                    <span>${track.notes}</span>
                  </section>
                `;
              }

              function render() {
                renderSummary();
                renderShards();
                renderSeams();
                renderTrackCards();
                renderMatrix();
                renderEdges();
                renderDefects();
                renderInspector();
                document.getElementById("diagram-caption").textContent =
                  state.selectedTrackId ? `Selected ${state.selectedTrackId}` : "No selection";
              }

              async function bootstrap() {
                setReducedMotionFlag();
                const [groupsPayload, seamsPayload, verdictPayload, eligibilityText, edgeText] =
                  await Promise.all([
                    fetch(GROUPS_PATH).then((response) => response.json()),
                    fetch(SEAMS_PATH).then((response) => response.json()),
                    fetch(VERDICT_PATH).then((response) => response.json()),
                    fetch(ELIGIBILITY_PATH).then((response) => response.text()),
                    fetch(EDGES_PATH).then((response) => response.text()),
                  ]);

                state.groupsPayload = groupsPayload;
                state.seamsPayload = seamsPayload;
                state.verdictPayload = verdictPayload;
                state.trackRows = parseCsv(eligibilityText).map((row) => ({
                  ...row,
                  requiredSeqTaskRefs: splitList(row.requiredSeqTaskRefs),
                  requiredSharedPackageRefs: splitList(row.requiredSharedPackageRefs),
                  requiredSimulatorRefs: splitList(row.requiredSimulatorRefs),
                  requiredSchemaRefs: splitList(row.requiredSchemaRefs),
                  requiredSharedSeamRefs: splitList(row.requiredSharedSeamRefs),
                  parallelInterfaceStubRefs: splitList(row.parallelInterfaceStubRefs),
                  blockingReasonRefs: splitList(row.blockingReasonRefs),
                  forbiddenSiblingCouplings: row.forbiddenSiblingCouplings.split("|").map((item) => item.trim()).filter(Boolean),
                }));
                state.edgeRows = parseCsv(edgeText);

                document.getElementById("verdict-chip").textContent = verdictPayload.gateVerdict;
                document.getElementById("banner-title").textContent = `${verdictPayload.gateId} ${verdictPayload.parallelBlockState}`;
                hydrateFilters();
                applyFilters();
              }

              bootstrap().catch((error) => {
                console.error(error);
                document.body.innerHTML = `<pre>${String(error)}</pre>`;
              });
            </script>
          </body>
        </html>
        """
    ).strip() + "\n"


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
        const HTML_PATH = path.join(ROOT, "docs", "programme", "61_parallel_foundation_gate_cockpit.html");
        const GROUPS_PATH = path.join(ROOT, "data", "analysis", "parallel_foundation_track_groups.json");
        const SEAMS_PATH = path.join(ROOT, "data", "analysis", "parallel_track_shared_seams.json");
        const VERDICT_PATH = path.join(ROOT, "data", "analysis", "parallel_foundation_gate_verdict.json");
        const ELIGIBILITY_PATH = path.join(ROOT, "data", "analysis", "parallel_track_eligibility.csv");

        const GROUPS_PAYLOAD = JSON.parse(fs.readFileSync(GROUPS_PATH, "utf8"));
        const SEAMS_PAYLOAD = JSON.parse(fs.readFileSync(SEAMS_PATH, "utf8"));
        const VERDICT_PAYLOAD = JSON.parse(fs.readFileSync(VERDICT_PATH, "utf8"));
        const ELIGIBILITY_ROWS = parseCsv(fs.readFileSync(ELIGIBILITY_PATH, "utf8"));

        export const parallelFoundationGateCoverage = [
          "group filtering",
          "eligibility filtering",
          "track-card selection",
          "diagram and matrix and inspector synchronization",
          "keyboard navigation",
          "responsive layout",
          "reduced motion",
          "accessibility smoke checks",
          "table parity",
        ];

        function assertCondition(condition, message) {
          if (!condition) {
            throw new Error(message);
          }
        }

        function parseCsv(text) {
          const rows = [];
          let field = "";
          let row = [];
          let inQuotes = false;
          for (let index = 0; index < text.length; index += 1) {
            const character = text[index];
            const nextCharacter = text[index + 1];
            if (character === '"') {
              if (inQuotes && nextCharacter === '"') {
                field += '"';
                index += 1;
              } else {
                inQuotes = !inQuotes;
              }
              continue;
            }
            if (character === "," && !inQuotes) {
              row.push(field);
              field = "";
              continue;
            }
            if ((character === "\\n" || character === "\\r") && !inQuotes) {
              if (character === "\\r" && nextCharacter === "\\n") {
                index += 1;
              }
              if (field.length > 0 || row.length > 0) {
                row.push(field);
                rows.push(row);
                row = [];
                field = "";
              }
              continue;
            }
            field += character;
          }
          if (field.length > 0 || row.length > 0) {
            row.push(field);
            rows.push(row);
          }
          const [header, ...body] = rows;
          return body.map((values) =>
            Object.fromEntries(header.map((column, index) => [column, values[index] ?? ""])),
          );
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
                rawUrl === "/" ? "/docs/programme/61_parallel_foundation_gate_cockpit.html" : rawUrl.split("?")[0];
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
            server.listen(4361, "127.0.0.1", () => resolve(server));
          });
        }

        async function run() {
          assertCondition(fs.existsSync(HTML_PATH), `Missing parallel foundation gate HTML: ${HTML_PATH}`);
          const { chromium } = await importPlaywright();
          const server = await startStaticServer();
          const browser = await chromium.launch({ headless: true });
          const page = await browser.newPage({ viewport: { width: 1460, height: 1180 } });
          const url =
            process.env.PARALLEL_FOUNDATION_GATE_URL ??
            "http://127.0.0.1:4361/docs/programme/61_parallel_foundation_gate_cockpit.html";

          try {
            await page.goto(url, { waitUntil: "networkidle" });
            await page.locator("[data-testid='verdict-banner']").waitFor();
            await page.locator("[data-testid='shard-map']").waitFor();
            await page.locator("[data-testid='seam-diagram']").waitFor();
            await page.locator("[data-testid='inspector']").waitFor();

            const initialCards = await page.locator("[data-testid^='track-card-']").count();
            assertCondition(
              initialCards === VERDICT_PAYLOAD.summary.candidate_track_count,
              `Expected ${VERDICT_PAYLOAD.summary.candidate_track_count} initial track cards, found ${initialCards}`,
            );

            await page.locator("[data-testid='group-filter']").selectOption("frontend_shells");
            const frontendCards = await page.locator("[data-testid^='track-card-']").count();
            assertCondition(frontendCards === 18, `Expected 18 frontend tracks, found ${frontendCards}`);

            await page.locator("[data-testid='group-filter']").selectOption("all");
            await page.locator("[data-testid='eligibility-filter']").selectOption("conditional");
            const conditionalCards = await page.locator("[data-testid^='track-card-']").count();
            assertCondition(conditionalCards === 21, `Expected 21 conditional tracks, found ${conditionalCards}`);

            await page.locator("[data-testid='eligibility-filter']").selectOption("all");
            await page.locator("[data-testid='track-card-par_101']").click();
            const inspectorText = await page.locator("[data-testid='inspector']").innerText();
            assertCondition(
              inspectorText.includes("par_101") &&
                inspectorText.includes("schema::restore-run") &&
                inspectorText.includes("STUB_061_RECOVERY_CONTROL_HANDOFF"),
              "Inspector lost the restore/recovery conditional details for par_101.",
            );

            const selectedShard = await page
              .locator("[data-testid='shard-node-SHARD_061_RUNTIME_GOVERNORS']")
              .getAttribute("data-selected");
            assertCondition(selectedShard === "true", "Shard map did not synchronize with the selected runtime-governor track.");

            const selectedMatrixRow = await page
              .locator("[data-testid='matrix-row-par_101']")
              .getAttribute("data-selected");
            assertCondition(selectedMatrixRow === "true", "Eligibility matrix did not synchronize with the selected track.");

            const selectedSeam = await page
              .locator("[data-testid='seam-node-SEAM_061_RECOVERY_AND_READINESS_TUPLES']")
              .getAttribute("data-selected");
            assertCondition(selectedSeam === "true", "Seam diagram did not highlight the recovery tuple seam.");

            const shardNodes = await page.locator("[data-testid^='shard-node-']").count();
            const shardParityRows = await page.locator("[data-testid='shard-parity-table'] tbody tr").count();
            assertCondition(
              shardNodes === GROUPS_PAYLOAD.summary.shard_count && shardNodes === shardParityRows,
              "Shard map parity drifted from the shard payload.",
            );

            const seamNodes = await page.locator("[data-testid^='seam-node-']").count();
            const seamParityRows = await page.locator("[data-testid='seam-parity-table'] tbody tr").count();
            assertCondition(
              seamNodes === SEAMS_PAYLOAD.summary.shared_seam_count && seamNodes === seamParityRows,
              "Seam diagram parity drifted from the seam payload.",
            );

            await page.locator("[data-testid='track-card-par_077']").focus();
            await page.keyboard.press("ArrowDown");
            const secondSelected = await page
              .locator("[data-testid='track-card-par_078']")
              .getAttribute("data-selected");
            assertCondition(secondSelected === "true", "Arrow-down navigation no longer advances track-card selection.");

            await page.locator("[data-testid='matrix-row-par_094']").focus();
            await page.keyboard.press("ArrowDown");
            const nextRowSelected = await page
              .locator("[data-testid='matrix-row-par_096']")
              .getAttribute("data-selected");
            assertCondition(nextRowSelected === "true", "Arrow-down navigation no longer advances matrix-row selection.");

            await page.setViewportSize({ width: 390, height: 844 });
            await page.locator("[data-testid='inspector']").waitFor();

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
            assertCondition(landmarks >= 9, `Expected multiple landmarks, found ${landmarks}`);
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

        export const parallelFoundationGateManifest = {
          task: VERDICT_PAYLOAD.task_id,
          candidateTracks: VERDICT_PAYLOAD.summary.candidate_track_count,
          eligibleTracks: VERDICT_PAYLOAD.summary.eligible_track_count,
          conditionalTracks: VERDICT_PAYLOAD.summary.conditional_track_count,
          blockedTracks: VERDICT_PAYLOAD.summary.blocked_track_count,
          seamCount: SEAMS_PAYLOAD.summary.shared_seam_count,
          stubCount: SEAMS_PAYLOAD.summary.interface_stub_count,
          eligibilityRows: ELIGIBILITY_ROWS.length,
        };
        """
    ).strip() + "\n"


def update_root_package() -> None:
    package = read_json(ROOT_PACKAGE_PATH)
    scripts = package["scripts"]
    builder_cmd = "python3 ./tools/analysis/build_parallel_foundation_tracks_gate.py"
    validate_cmd = "python3 ./tools/analysis/validate_parallel_foundation_gate.py"

    if builder_cmd not in scripts["codegen"]:
        scripts["codegen"] = scripts["codegen"].replace(
            "python3 ./tools/analysis/build_engineering_standards.py && pnpm format",
            "python3 ./tools/analysis/build_engineering_standards.py && "
            "python3 ./tools/analysis/build_parallel_foundation_tracks_gate.py && pnpm format",
        )
    scripts["validate:parallel-foundation-gate"] = validate_cmd

    for script_name in ("bootstrap", "check"):
        if "pnpm validate:parallel-foundation-gate" not in scripts[script_name]:
            scripts[script_name] = scripts[script_name].replace(
                "pnpm validate:scaffold",
                "pnpm validate:parallel-foundation-gate && pnpm validate:scaffold",
            )

    write_json(ROOT_PACKAGE_PATH, package)


def update_playwright_package() -> None:
    package = read_json(PLAYWRIGHT_PACKAGE_PATH)
    package["description"] = (
        "Foundation, API contract registry, runtime topology, runtime network trust, data-storage "
        "topology, object-storage retention, gateway, event, event spine, observability spine, "
        "cache/live transport, FHIR, frontend manifest, release parity, design contract, audit "
        "ledger, scope/isolation, lifecycle coordinator, scoped mutation gate, adapter contract, "
        "verification ladder, seed/simulator, identity repair command-center, reachability truth, "
        "duplicate review, resilience-control, reservation confirmation, and "
        "parallel-foundation-gate browser checks."
    )
    package["scripts"].update(PLAYWRIGHT_SCRIPT_UPDATES)
    write_json(PLAYWRIGHT_PACKAGE_PATH, package)


def build_html_payload_files(track_rows: list[dict[str, Any]], groups_payload: dict[str, Any], shared_seams_payload: dict[str, Any], verdict: dict[str, Any], edge_rows: list[dict[str, str]]) -> None:
    write_json(TRACK_GROUPS_PATH, groups_payload)
    write_json(SHARED_SEAMS_PATH, shared_seams_payload)
    write_json(VERDICT_PATH, verdict)
    write_csv(
        ELIGIBILITY_CSV_PATH,
        [
            "trackTaskId",
            "trackTitle",
            "trackGroup",
            "trackShardId",
            "claimableMode",
            "requiredSeqTaskRefs",
            "requiredSharedPackageRefs",
            "requiredSimulatorRefs",
            "requiredSchemaRefs",
            "requiredSharedSeamRefs",
            "forbiddenSiblingCouplings",
            "parallelInterfaceStubRefs",
            "blockingReasonRefs",
            "notes",
            "sourceRefs",
        ],
        build_eligibility_rows(track_rows),
    )
    write_csv(
        PREREQUISITE_EDGES_CSV_PATH,
        [
            "edgeId",
            "trackTaskId",
            "trackGroup",
            "claimableMode",
            "dependencyRef",
            "dependencyKind",
            "satisfactionState",
            "notes",
        ],
        edge_rows,
    )


def main() -> None:
    context = load_context()
    track_rows = build_track_rows()
    groups_payload = build_track_group_payload(track_rows, context)
    shared_seams_payload = build_shared_seams_payload(track_rows)
    verdict = build_verdict_payload(track_rows, groups_payload, shared_seams_payload)
    edge_rows = build_prerequisite_edges(track_rows)

    build_html_payload_files(track_rows, groups_payload, shared_seams_payload, verdict, edge_rows)
    write_text(GATE_DOC_PATH, build_gate_doc(verdict, groups_payload, shared_seams_payload))
    write_text(ELIGIBILITY_DOC_PATH, build_eligibility_doc(track_rows))
    write_text(SHARD_DOC_PATH, build_shard_doc(groups_payload, shared_seams_payload))
    write_text(COCKPIT_PATH, build_html())
    write_text(VALIDATOR_PATH, build_validator())
    write_text(SPEC_PATH, build_spec())

    update_root_package()
    update_playwright_package()

    print(
        "seq_061 parallel foundation gate artifacts generated: "
        f"{groups_payload['summary']['candidate_track_count']} tracks, "
        f"{groups_payload['summary']['eligible_track_count']} eligible, "
        f"{groups_payload['summary']['conditional_track_count']} conditional, "
        f"{groups_payload['summary']['blocked_track_count']} blocked, "
        f"{shared_seams_payload['summary']['shared_seam_count']} seams."
    )


if __name__ == "__main__":
    main()
