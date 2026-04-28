#!/usr/bin/env python3
from __future__ import annotations

import csv
import hashlib
import json
from datetime import datetime, timezone
from pathlib import Path
from textwrap import dedent
from typing import Any

from root_script_updates import ROOT_SCRIPT_UPDATES as SHARED_ROOT_SCRIPT_UPDATES


ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = ROOT / "data" / "analysis"
DOCS_DIR = ROOT / "docs" / "architecture"
TESTS_DIR = ROOT / "tests" / "playwright"
FIXTURE_CASE_DIR = ROOT / "packages" / "test-fixtures" / "reference-cases"

REFERENCE_CASE_PATH = DATA_DIR / "reference_case_catalog.json"
SEED_MATRIX_PATH = DATA_DIR / "seed_dataset_matrix.csv"
SIMULATOR_CATALOG_PATH = DATA_DIR / "simulator_contract_catalog.json"
FAULT_MATRIX_PATH = DATA_DIR / "simulator_fault_injection_matrix.csv"
CONTINUITY_MATRIX_PATH = DATA_DIR / "reference_case_to_continuity_control_matrix.csv"

STRATEGY_DOC_PATH = DOCS_DIR / "59_seed_data_and_simulator_strategy.md"
CORPUS_DOC_PATH = DOCS_DIR / "59_reference_case_corpus.md"
CUTOVER_DOC_PATH = DOCS_DIR / "59_mock_now_vs_actual_provider_cutover.md"
STUDIO_PATH = DOCS_DIR / "59_seed_and_simulator_studio.html"

FIXTURE_README_PATH = FIXTURE_CASE_DIR / "README.md"
FIXTURE_INDEX_PATH = FIXTURE_CASE_DIR / "reference_case_index.json"

VALIDATOR_PATH = ROOT / "tools" / "analysis" / "validate_seed_and_simulator_strategy.py"
SPEC_PATH = TESTS_DIR / "seed-and-simulator-studio.spec.js"

ADAPTER_PROFILE_PATH = DATA_DIR / "adapter_contract_profile_template.json"
SIMULATOR_BACKLOG_PATH = DATA_DIR / "adapter_simulator_contract_manifest.json"
VERIFICATION_SCENARIO_PATH = DATA_DIR / "verification_scenarios.json"
VERIFICATION_MATRIX_PATH = DATA_DIR / "release_contract_verification_matrix.json"
BLOCKER_TAXONOMY_PATH = DATA_DIR / "closure_blocker_taxonomy.json"
FRONTEND_ROUTE_MATRIX_PATH = DATA_DIR / "frontend_route_to_query_command_channel_cache_matrix.csv"
EVENT_MATRIX_PATH = DATA_DIR / "canonical_event_family_matrix.csv"

ROOT_PACKAGE_PATH = ROOT / "package.json"
PLAYWRIGHT_PACKAGE_PATH = TESTS_DIR / "package.json"
VERIFICATION_BUILDER_PATH = ROOT / "tools" / "analysis" / "build_verification_ladder_and_environment_ring_policy.py"
ENGINEERING_BUILDER_PATH = ROOT / "tools" / "analysis" / "build_engineering_standards.py"

TASK_ID = "seq_059"
VISUAL_MODE = "Seed_And_Simulator_Studio"
TIMESTAMP = datetime.now(timezone.utc).replace(microsecond=0).isoformat()
CAPTURED_ON = TIMESTAMP[:10]
MISSION = (
    "Define the canonical Phase 0 seed-data, reference-case, and simulator strategy so preview "
    "environments, integration flows, early shells, backend tests, and release verification run "
    "end to end on deterministic simulators without waiting for live NHS or provider onboarding."
)

SOURCE_PRECEDENCE = [
    "prompt/059.md",
    "prompt/shared_operating_contract_056_to_065.md",
    "prompt/AGENT.md",
    "prompt/checklist.md",
    "blueprint/phase-cards.md#Card 1: Phase 0 - The Foundation Protocol",
    "blueprint/phase-0-the-foundation-protocol.md#0A Foundation kernel, control plane, and hard invariants",
    "blueprint/phase-0-the-foundation-protocol.md#6.5 Support and replay algorithm",
    "blueprint/phase-0-the-foundation-protocol.md#6.6 Adapter outbox, inbox, and callback replay rule",
    "blueprint/platform-runtime-and-release-blueprint.md#Verification ladder contract",
    "blueprint/platform-runtime-and-release-blueprint.md#ContinuityContractCoverageRecord",
    "blueprint/platform-runtime-and-release-blueprint.md#SyntheticRecoveryCoverageRecord",
    "blueprint/platform-frontend-blueprint.md#Typed patient transaction route contract",
    "blueprint/ux-quiet-clarity-redesign.md#Control priorities",
    "blueprint/forensic-audit-findings.md#Finding 57",
    "blueprint/forensic-audit-findings.md#Finding 58",
    "blueprint/forensic-audit-findings.md#Finding 71",
    "blueprint/forensic-audit-findings.md#Finding 72",
    "blueprint/forensic-audit-findings.md#Finding 95",
    "data/analysis/adapter_simulator_contract_manifest.json",
    "data/analysis/adapter_contract_profile_template.json",
    "data/analysis/dependency_degradation_profiles.json",
    "data/analysis/frontend_route_to_query_command_channel_cache_matrix.csv",
    "data/analysis/release_contract_verification_matrix.json",
    "data/analysis/verification_scenarios.json",
    "data/analysis/closure_blocker_taxonomy.json",
    "data/analysis/canonical_event_family_matrix.csv",
]

ROOT_SCRIPT_UPDATES = {
    "bootstrap": (
        "pnpm install && node ./tools/dev-bootstrap/index.mjs && pnpm codegen && "
        "pnpm validate:topology && pnpm validate:runtime-topology && pnpm validate:gateway-surface && "
        "pnpm validate:events && pnpm validate:fhir && pnpm validate:frontend && "
        "pnpm validate:release-parity && pnpm validate:design-publication && pnpm validate:audit-worm && "
        "pnpm validate:tenant-scope && pnpm validate:lifecycle && pnpm validate:mutation-gate && "
        "pnpm validate:adapter-contracts && pnpm validate:verification-ladder && "
        "pnpm validate:seed-simulators && pnpm validate:scaffold && pnpm validate:services && "
        "pnpm validate:domains && pnpm validate:standards"
    ),
    "check": (
        "pnpm lint && pnpm format:check && pnpm typecheck && pnpm test && "
        "pnpm validate:topology && pnpm validate:runtime-topology && pnpm validate:gateway-surface && "
        "pnpm validate:events && pnpm validate:fhir && pnpm validate:frontend && "
        "pnpm validate:release-parity && pnpm validate:design-publication && pnpm validate:audit-worm && "
        "pnpm validate:tenant-scope && pnpm validate:lifecycle && pnpm validate:mutation-gate && "
        "pnpm validate:adapter-contracts && pnpm validate:verification-ladder && "
        "pnpm validate:seed-simulators && pnpm validate:scaffold && pnpm validate:services && "
        "pnpm validate:domains && pnpm validate:standards"
    ),
    "codegen": (
        "python3 ./tools/analysis/build_monorepo_scaffold.py && "
        "python3 ./tools/analysis/build_runtime_service_scaffold.py && "
        "python3 ./tools/analysis/build_domain_package_scaffold.py && "
        "python3 ./tools/analysis/build_runtime_topology_manifest.py && "
        "python3 ./tools/analysis/build_gateway_surface_map.py && "
        "python3 ./tools/analysis/build_event_registry.py && "
        "python3 ./tools/analysis/build_fhir_representation_contracts.py && "
        "python3 ./tools/analysis/build_frontend_contract_manifests.py && "
        "python3 ./tools/analysis/build_release_freeze_and_parity.py && "
        "python3 ./tools/analysis/build_design_contract_publication.py && "
        "python3 ./tools/analysis/build_audit_and_worm_strategy.py && "
        "python3 ./tools/analysis/build_tenant_scope_model.py && "
        "python3 ./tools/analysis/build_lifecycle_coordinator_rules.py && "
        "python3 ./tools/analysis/build_scoped_mutation_gate_rules.py && "
        "python3 ./tools/analysis/build_adapter_contract_profiles.py && "
        "python3 ./tools/analysis/build_verification_ladder_and_environment_ring_policy.py && "
        "python3 ./tools/analysis/build_seed_data_and_simulator_strategy.py && "
        "python3 ./tools/analysis/build_engineering_standards.py && pnpm format"
    ),
    "validate:seed-simulators": "python3 ./tools/analysis/validate_seed_and_simulator_strategy.py",
}
ROOT_SCRIPT_UPDATES = SHARED_ROOT_SCRIPT_UPDATES

PLAYWRIGHT_SCRIPT_UPDATES = {
    "build": (
        "node --check foundation-shell-gallery.spec.js && "
        "node --check runtime-topology-atlas.spec.js && "
        "node --check gateway-surface-studio.spec.js && "
        "node --check event-registry-studio.spec.js && "
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
        "node --check seed-and-simulator-studio.spec.js"
    ),
    "lint": (
        "eslint foundation-shell-gallery.spec.js runtime-topology-atlas.spec.js "
        "gateway-surface-studio.spec.js event-registry-studio.spec.js "
        "fhir-representation-atlas.spec.js frontend-contract-studio.spec.js "
        "release-parity-cockpit.spec.js design-contract-studio.spec.js "
        "audit-ledger-explorer.spec.js scope-isolation-atlas.spec.js "
        "lifecycle-coordinator-lab.spec.js scoped-mutation-gate-lab.spec.js "
        "adapter-contract-studio.spec.js verification-cockpit.spec.js "
        "seed-and-simulator-studio.spec.js"
    ),
    "test": (
        "node foundation-shell-gallery.spec.js && "
        "node runtime-topology-atlas.spec.js && "
        "node gateway-surface-studio.spec.js && "
        "node event-registry-studio.spec.js && "
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
        "node seed-and-simulator-studio.spec.js"
    ),
    "typecheck": (
        "node --check foundation-shell-gallery.spec.js && "
        "node --check runtime-topology-atlas.spec.js && "
        "node --check gateway-surface-studio.spec.js && "
        "node --check event-registry-studio.spec.js && "
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
        "node --check seed-and-simulator-studio.spec.js"
    ),
    "e2e": (
        "node foundation-shell-gallery.spec.js --run && "
        "node runtime-topology-atlas.spec.js --run && "
        "node gateway-surface-studio.spec.js --run && "
        "node event-registry-studio.spec.js --run && "
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
        "node seed-and-simulator-studio.spec.js --run"
    ),
}

RING_BY_RELEASE_USE = {
    "preview": "ci-preview",
    "integration": "integration",
    "preprod": "preprod",
    "wave_probe": "production",
}

SHARED_SEED_ROWS = [
    {
        "seed_object_id": "SEED_059_TENANT_SCOPE_PRIMARY_V1",
        "object_type": "TenantScope",
        "reference_case_id": "shared",
        "tenant_scope_ref": "tenant://vecells/phase0-primary",
        "organisation_scope_ref": "org://vecells/platform",
        "route_family_ref": "shared",
        "starting_surface_ref": "shared",
        "seed_state": "active",
        "simulator_refs": "",
        "continuity_control_refs": "",
        "release_verification_use": "shared",
        "phi_safe_class": "synthetic_structure_only",
        "requires_live_credentials": "no",
        "canonical_truth_refs": "tenant.scope; acting.scope",
        "notes": "Primary Phase 0 tenant scope reused across all reference cases.",
    },
    {
        "seed_object_id": "SEED_059_ORG_MERIDIAN_FAMILY_PRACTICE_V1",
        "object_type": "OrganisationScope",
        "reference_case_id": "shared",
        "tenant_scope_ref": "tenant://vecells/phase0-primary",
        "organisation_scope_ref": "org://meridian-family-practice",
        "route_family_ref": "shared",
        "starting_surface_ref": "shared",
        "seed_state": "active",
        "simulator_refs": "",
        "continuity_control_refs": "",
        "release_verification_use": "shared",
        "phi_safe_class": "synthetic_structure_only",
        "requires_live_credentials": "no",
        "canonical_truth_refs": "practice.scope; provider.context",
        "notes": "Primary practice scope for patient, booking, and pharmacy reference cases.",
    },
    {
        "seed_object_id": "SEED_059_ORG_NORTH_RIVER_HUB_V1",
        "object_type": "OrganisationScope",
        "reference_case_id": "shared",
        "tenant_scope_ref": "tenant://vecells/phase0-primary",
        "organisation_scope_ref": "org://north-river-hub",
        "route_family_ref": "shared",
        "starting_surface_ref": "shared",
        "seed_state": "active",
        "simulator_refs": "",
        "continuity_control_refs": "",
        "release_verification_use": "shared",
        "phi_safe_class": "synthetic_structure_only",
        "requires_live_credentials": "no",
        "canonical_truth_refs": "hub.scope; acting.scope",
        "notes": "Hub-desk scope reused by booking ambiguity and fallback-review drills.",
    },
    {
        "seed_object_id": "SEED_059_ORG_RIVERSTONE_PHARMACY_V1",
        "object_type": "OrganisationScope",
        "reference_case_id": "shared",
        "tenant_scope_ref": "tenant://vecells/phase0-primary",
        "organisation_scope_ref": "org://riverstone-pharmacy",
        "route_family_ref": "shared",
        "starting_surface_ref": "shared",
        "seed_state": "active",
        "simulator_refs": "",
        "continuity_control_refs": "",
        "release_verification_use": "shared",
        "phi_safe_class": "synthetic_structure_only",
        "requires_live_credentials": "no",
        "canonical_truth_refs": "pharmacy.scope; servicing.scope",
        "notes": "Pharmacy servicing scope reused by dispatch and weak-match settlement drills.",
    },
    {
        "seed_object_id": "SEED_059_ORG_VECELLS_SUPPORT_V1",
        "object_type": "OrganisationScope",
        "reference_case_id": "shared",
        "tenant_scope_ref": "tenant://vecells/phase0-primary",
        "organisation_scope_ref": "org://vecells-support",
        "route_family_ref": "shared",
        "starting_surface_ref": "shared",
        "seed_state": "active",
        "simulator_refs": "",
        "continuity_control_refs": "",
        "release_verification_use": "shared",
        "phi_safe_class": "synthetic_structure_only",
        "requires_live_credentials": "no",
        "canonical_truth_refs": "support.scope; replay.scope",
        "notes": "Support workspace scope reused by duplicate review and replay-restore cases.",
    },
    {
        "seed_object_id": "SEED_059_RUNTIME_BINDING_PREVIEW_V1",
        "object_type": "AudienceSurfaceRuntimeBinding",
        "reference_case_id": "shared",
        "tenant_scope_ref": "tenant://vecells/phase0-primary",
        "organisation_scope_ref": "org://vecells/platform",
        "route_family_ref": "shared",
        "starting_surface_ref": "shared",
        "seed_state": "exact",
        "simulator_refs": "",
        "continuity_control_refs": "",
        "release_verification_use": "preview",
        "phi_safe_class": "no_phi",
        "requires_live_credentials": "no",
        "canonical_truth_refs": "VS_058_CI_PREVIEW_V1",
        "notes": "Preview ring runtime tuple for seed-only shell truth.",
    },
    {
        "seed_object_id": "SEED_059_RUNTIME_BINDING_INTEGRATION_V1",
        "object_type": "AudienceSurfaceRuntimeBinding",
        "reference_case_id": "shared",
        "tenant_scope_ref": "tenant://vecells/phase0-primary",
        "organisation_scope_ref": "org://vecells/platform",
        "route_family_ref": "shared",
        "starting_surface_ref": "shared",
        "seed_state": "exact",
        "simulator_refs": "",
        "continuity_control_refs": "",
        "release_verification_use": "integration",
        "phi_safe_class": "no_phi",
        "requires_live_credentials": "no",
        "canonical_truth_refs": "VS_058_INTEGRATION_V1",
        "notes": "Integration ring runtime tuple for simulator-backed flows.",
    },
    {
        "seed_object_id": "SEED_059_RUNTIME_BINDING_PREPROD_V1",
        "object_type": "AudienceSurfaceRuntimeBinding",
        "reference_case_id": "shared",
        "tenant_scope_ref": "tenant://vecells/phase0-primary",
        "organisation_scope_ref": "org://vecells/platform",
        "route_family_ref": "shared",
        "starting_surface_ref": "shared",
        "seed_state": "exact",
        "simulator_refs": "",
        "continuity_control_refs": "",
        "release_verification_use": "preprod",
        "phi_safe_class": "no_phi",
        "requires_live_credentials": "no",
        "canonical_truth_refs": "VS_058_PREPROD_V1",
        "notes": "Preprod ring runtime tuple for continuity and recovery rehearsal.",
    },
    {
        "seed_object_id": "SEED_059_RUNTIME_BINDING_WAVE_PROBE_V1",
        "object_type": "AudienceSurfaceRuntimeBinding",
        "reference_case_id": "shared",
        "tenant_scope_ref": "tenant://vecells/phase0-primary",
        "organisation_scope_ref": "org://vecells/platform",
        "route_family_ref": "shared",
        "starting_surface_ref": "shared",
        "seed_state": "exact",
        "simulator_refs": "",
        "continuity_control_refs": "",
        "release_verification_use": "wave_probe",
        "phi_safe_class": "no_phi",
        "requires_live_credentials": "no",
        "canonical_truth_refs": "VS_058_PRODUCTION_V1",
        "notes": "Wave-probe runtime tuple for canary and rollback proof with seed-only dependencies.",
    },
]

BASE_CASE_OBJECT_KINDS = [
    "patient_identity_seed",
    "submission_envelope",
    "request",
    "request_lineage",
    "route_intent_binding",
    "acting_scope_tuple",
    "command_settlement_record",
    "patient_receipt",
    "release_binding_row",
]

RECOVERY_OBJECT_KINDS = {
    "recovery_continuation_token",
    "patient_action_recovery_envelope",
    "telephony_continuation_context",
    "support_replay_restore_settlement",
}

OBJECT_KIND_META = {
    "patient_identity_seed": {
        "object_type": "SyntheticPatientIdentityState",
        "truth_refs": "IdentityBinding; ReachabilityAssessmentRecord",
        "default_state": "ready",
        "note": "Synthetic patient identity state with PHI-safe names and deterministic identifiers.",
    },
    "submission_envelope": {
        "object_type": "SubmissionEnvelope",
        "truth_refs": "SubmissionEnvelope; SubmissionIngressRecord",
        "default_state": "captured",
        "note": "Envelope fixture preserves pre-promotion evidence and continuation state.",
    },
    "request": {
        "object_type": "Request",
        "truth_refs": "Request; RequestClosureRecord",
        "default_state": "active",
        "note": "Canonical request truth remains domain-owned even when transport is simulated.",
    },
    "request_lineage": {
        "object_type": "RequestLineage",
        "truth_refs": "RequestLineage; LineageCaseLink",
        "default_state": "active",
        "note": "Lineage rows preserve child-case links and replay-safe causality.",
    },
    "route_intent_binding": {
        "object_type": "RouteIntentBinding",
        "truth_refs": "RouteIntentBinding; ScopedMutationGate",
        "default_state": "bound",
        "note": "Route-intent tuple keeps writable posture bound to publication and subject fences.",
    },
    "acting_scope_tuple": {
        "object_type": "ActingScopeTuple",
        "truth_refs": "ActingScopeTuple; AudienceSurfaceRuntimeBinding",
        "default_state": "aligned",
        "note": "Acting scope stays deterministic and tenant-safe in every seeded route.",
    },
    "command_settlement_record": {
        "object_type": "CommandSettlementRecord",
        "truth_refs": "CommandSettlementRecord; CommandActionRecord",
        "default_state": "pending_or_settled",
        "note": "Command settlement rows prove same-shell write posture without transport-local shortcuts.",
    },
    "patient_receipt": {
        "object_type": "PatientReceiptEnvelope",
        "truth_refs": "PatientReceiptEnvelope; PatientShellConsistencyProjection",
        "default_state": "issued_or_degraded",
        "note": "Receipt rows keep preview shells truthful about calm, degraded, or blocked posture.",
    },
    "release_binding_row": {
        "object_type": "VerificationScenarioBinding",
        "truth_refs": "VerificationScenario; ReleaseContractVerificationMatrix",
        "default_state": "exact",
        "note": "Release and runtime tuple binding keeps seed simulation reusable across rings.",
    },
    "communication_envelope": {
        "object_type": "CommunicationEnvelope",
        "truth_refs": "CommunicationEnvelope; ConversationCommandSettlement",
        "default_state": "prepared",
        "note": "Communication fixtures carry delivery proof separately from send acceptance.",
    },
    "duplicate_cluster": {
        "object_type": "DuplicateCluster",
        "truth_refs": "DuplicateCluster; DuplicateResolutionDecision",
        "default_state": "review_or_collapsed",
        "note": "Duplicate clustering stays first-class rather than flattened into idempotency folklore.",
    },
    "fallback_review_case": {
        "object_type": "FallbackReviewCase",
        "truth_refs": "FallbackReviewCase; SupportReplayRestoreSettlement",
        "default_state": "open",
        "note": "Fallback review keeps degraded accepted progress explicit until governed recovery settles.",
    },
    "identity_binding": {
        "object_type": "IdentityBinding",
        "truth_refs": "IdentityBinding; SessionEstablishmentDecision",
        "default_state": "aligned_or_frozen",
        "note": "Identity binding version is frozen so secure-link repair never guesses ownership.",
    },
    "identity_repair_case": {
        "object_type": "IdentityRepairCase",
        "truth_refs": "IdentityRepairCase; IdentityRepairReleaseSettlement",
        "default_state": "active",
        "note": "Wrong-patient and identity-repair cases remain explicit blocker truth.",
    },
    "access_grant": {
        "object_type": "AccessGrant",
        "truth_refs": "AccessGrant; TelephonyContinuationEligibility",
        "default_state": "issued_or_challenge_only",
        "note": "Grant fixtures separate seeded continuation from challenge continuation.",
    },
    "recovery_continuation_token": {
        "object_type": "RecoveryContinuationToken",
        "truth_refs": "RecoveryContinuationToken; PatientActionRecoveryEnvelope",
        "default_state": "active",
        "note": "Recovery tokens bind same-shell return instead of detached restart flows.",
    },
    "patient_action_recovery_envelope": {
        "object_type": "PatientActionRecoveryEnvelope",
        "truth_refs": "PatientActionRecoveryEnvelope; PatientRequestReturnBundle",
        "default_state": "active",
        "note": "Patient recovery envelope keeps shell continuity truthful through blockers and repairs.",
    },
    "telephony_call_session": {
        "object_type": "CallSessionRecord",
        "truth_refs": "CallSessionRecord; EvidenceReadinessAssessment",
        "default_state": "captured",
        "note": "Telephony capture fixtures preserve urgent-live, evidence-readiness, and transcript posture separately.",
    },
    "telephony_continuation_eligibility": {
        "object_type": "TelephonyContinuationEligibility",
        "truth_refs": "TelephonyContinuationEligibility; ReachabilityAssessmentRecord",
        "default_state": "seeded_or_challenge",
        "note": "Continuation eligibility follows current evidence readiness and handset control law only.",
    },
    "telephony_continuation_context": {
        "object_type": "TelephonyContinuationContext",
        "truth_refs": "TelephonyContinuationContext; AccessGrant",
        "default_state": "active",
        "note": "Continuation context binds seeded and challenge branches without transcript guesswork.",
    },
    "transcript_stub": {
        "object_type": "TranscriptArtifact",
        "truth_refs": "EvidenceSnapshotBundle; MaterialDeltaAssessment",
        "default_state": "placeholder_or_missing",
        "note": "Transcript fixtures are synthetic and may remain missing while telephony truth stays explicit.",
    },
    "booking_case": {
        "object_type": "BookingCase",
        "truth_refs": "BookingCase; BookingConfirmationTruthProjection",
        "default_state": "confirmation_pending",
        "note": "Booking fixtures preserve ambiguity and confirmation debt rather than optimistic booking calmness.",
    },
    "capacity_snapshot": {
        "object_type": "CapacitySnapshot",
        "truth_refs": "CapacitySnapshot; WaitlistContinuationTruthProjection",
        "default_state": "stale_or_current",
        "note": "Capacity fixtures keep waitlist and hub fallback safety visible in seed mode.",
    },
    "external_confirmation_gate": {
        "object_type": "ExternalConfirmationGate",
        "truth_refs": "ExternalConfirmationGate; ConfirmationGate",
        "default_state": "pending",
        "note": "External confirmation gates remain distinct from transport acknowledgement.",
    },
    "hub_case": {
        "object_type": "HubCase",
        "truth_refs": "HubCase; HubContinuityEvidenceProjection",
        "default_state": "queued_or_active",
        "note": "Hub case fixtures keep hub booking-manage truth bound to the same request lineage.",
    },
    "pharmacy_case": {
        "object_type": "PharmacyCase",
        "truth_refs": "PharmacyCase; PharmacyContinuityEvidenceProjection",
        "default_state": "dispatch_or_reconciliation_pending",
        "note": "Pharmacy fixtures preserve dispatch, weak-match, and outcome reconciliation truth.",
    },
    "pharmacy_dispatch_attempt": {
        "object_type": "PharmacyDispatchAttempt",
        "truth_refs": "PharmacyDispatchAttempt; ExternalConfirmationGate",
        "default_state": "proof_pending",
        "note": "Dispatch attempt fixtures keep proof-missing and redispatch semantics explicit.",
    },
    "outcome_reconciliation_gate": {
        "object_type": "PharmacyOutcomeReconciliationGate",
        "truth_refs": "PharmacyOutcomeReconciliationGate; PharmacyOutcomeMatchAssessment",
        "default_state": "weak_match",
        "note": "Outcome reconciliation fixtures keep weak-match and delayed outcome truth separate from closure.",
    },
    "support_ticket": {
        "object_type": "SupportTicket",
        "truth_refs": "SupportLineageBinding; SupportContinuityEvidenceProjection",
        "default_state": "observe_or_restore",
        "note": "Support fixtures keep replay and resend work governed by lineage and scope fences.",
    },
    "support_replay_restore_settlement": {
        "object_type": "SupportReplayRestoreSettlement",
        "truth_refs": "SupportReplayRestoreSettlement; InvestigationTimelineReconstruction",
        "default_state": "required_or_settled",
        "note": "Replay restore settlements keep support actionability subordinate to the live tuple.",
    },
    "reachability_assessment": {
        "object_type": "ReachabilityAssessmentRecord",
        "truth_refs": "ReachabilityAssessmentRecord; ContactRouteSnapshot",
        "default_state": "current_or_repair_required",
        "note": "Reachability rows keep message and continuation repair explicit.",
    },
    "lifecycle_lease": {
        "object_type": "RequestLifecycleLease",
        "truth_refs": "RequestLifecycleLease; RequestClosureRecord",
        "default_state": "held",
        "note": "Lifecycle lease rows keep closure coordinator-owned even in seed drills.",
    },
}

FAULT_EFFECTS = {
    "timeout": "Transport timeout stays advisory only and the case remains pending, degraded, or review-bound until authoritative settlement or manual fallback occurs.",
    "replay": "Replay is deduplicated under the published adapter and mutation law; no duplicate side effect may mint calmer shell truth.",
    "duplicate": "Duplicate signals stay explicit as DuplicateCluster or duplicate delivery truth rather than being silently absorbed.",
    "stale_callback": "Stale callbacks fail closed behind lineage, subject, or publication fences and reopen same-shell recovery instead of mutating current truth.",
    "disputed_receipt": "Disputed receipts remain weaker than settled delivery, confirmation, or outcome proof and keep the case in repair or review posture.",
    "ordering_inversion": "Ordering inversion preserves callback and receipt sequencing law rather than promoting the last arrival as current truth.",
    "partial_outage": "Partial outage constrains publication and continuity posture while leaving the canonical request and blocker semantics intact.",
}

STANDARD_FAULTS_BY_SIMULATOR = {
    "sim_nhs_login_auth_session_twin": ["replay", "stale_callback", "ordering_inversion", "partial_outage"],
    "sim_optional_pds_enrichment_twin": ["timeout", "duplicate", "partial_outage"],
    "sim_telephony_ivr_twin": ["timeout", "replay", "stale_callback", "ordering_inversion", "partial_outage"],
    "sim_transcription_processing_twin": ["timeout", "duplicate", "partial_outage"],
    "sim_sms_delivery_twin": ["timeout", "replay", "duplicate", "disputed_receipt"],
    "sim_email_notification_twin": ["timeout", "replay", "duplicate", "disputed_receipt"],
    "sim_im1_principal_system_emis_twin": ["timeout", "replay", "ordering_inversion", "partial_outage"],
    "sim_im1_principal_system_tpp_twin": ["timeout", "replay", "ordering_inversion", "partial_outage"],
    "sim_booking_provider_confirmation_twin": ["timeout", "duplicate", "stale_callback", "ordering_inversion"],
    "sim_booking_capacity_feed_twin": ["timeout", "ordering_inversion", "partial_outage"],
    "sim_mesh_message_path_twin": ["timeout", "replay", "duplicate", "disputed_receipt", "ordering_inversion", "partial_outage"],
    "sim_pharmacy_dispatch_transport_twin": ["timeout", "replay", "disputed_receipt", "ordering_inversion", "partial_outage"],
    "sim_pharmacy_visibility_update_record_twin": ["duplicate", "stale_callback", "ordering_inversion", "partial_outage"],
}

SECRET_CLASSES_BY_DEPENDENCY = {
    "dep_nhs_login_rail": ["oauth_client_id", "private_key_jwt", "redirect_uri_registry", "session_signing_key"],
    "dep_pds_fhir_enrichment": ["smartcard_or_certificate", "fhir_client_secret", "role_binding"],
    "dep_telephony_ivr_recording_provider": ["account_token", "webhook_secret", "number_namespace", "recording_scope_key"],
    "dep_transcription_processing_provider": ["processor_api_key", "artifact_pull_secret"],
    "dep_sms_notification_provider": ["sms_api_key", "sender_identifier", "delivery_webhook_secret"],
    "dep_email_notification_provider": ["email_api_key", "sender_domain", "delivery_webhook_secret"],
    "dep_im1_pairing_programme": ["pairing_token", "supplier_subscription_key", "ods_binding"],
    "dep_gp_system_supplier_paths": ["supplier_subscription_key", "endpoint_secret", "environment_target"],
    "dep_local_booking_supplier_adapters": ["supplier_subscription_key", "endpoint_secret", "practice_binding"],
    "dep_origin_practice_ack_rail": ["practice_endpoint_secret", "receipt_signature_key"],
    "dep_network_capacity_partner_feeds": ["feed_api_key", "polling_secret", "partner_endpoint_allowlist"],
    "dep_cross_org_secure_messaging_mesh": ["mailbox_identifier", "shared_secret", "tls_client_cert"],
    "dep_pharmacy_referral_transport": ["transport_endpoint_secret", "mailbox_or_route_key", "ack_signature_key"],
    "dep_pharmacy_urgent_return_professional_routes": ["urgent_route_secret", "professional_contact_registry"],
    "dep_pharmacy_outcome_observation": ["update_record_secret", "practice_visibility_key", "reconciliation_secret"],
}

CONTINUITY_GOALS = {
    "patient_nav": "Keep home, request, and appointment shells on the same current request truth without detached success placeholders.",
    "more_info_reply": "Prove same-thread reply posture remains governed by current question, reachability, and settlement evidence.",
    "conversation_settlement": "Keep conversation previews and same-shell action posture subordinate to authoritative conversation settlement.",
    "intake_resume": "Prove autosave, continuation, and telephony resume posture without pretending a stale draft is writable.",
    "booking_manage": "Keep patient booking and waitlist posture subordinate to reservation and confirmation truth.",
    "hub_booking_manage": "Keep hub-managed booking truth on the same lineage and confirmation gates as patient-facing posture.",
    "support_replay_restore": "Prove support replay and resend actions only rearm after restore settlement attests the live tuple.",
    "workspace_task_completion": "Keep staff task completion subordinate to current queue, lease, and projection truth.",
    "pharmacy_console_settlement": "Keep pharmacy release and reconciliation posture bound to dispatch and outcome settlement proof.",
}

DEFECTS = [
    {
        "defectId": "RESOLVED_059_PHASE0_EXTERNAL_FOUNDATION_WAIT",
        "state": "resolved",
        "severity": "critical",
        "statement": "Phase 0 no longer waits on live onboarding because simulator-first seams are the legal default for the seed corpus.",
    },
    {
        "defectId": "RESOLVED_059_HAPPY_PATH_ONLY_SEED_DATA",
        "state": "resolved",
        "severity": "critical",
        "statement": "The seed corpus now includes duplicate, blocker, confirmation, identity-repair, degraded, and recovery truth instead of polished happy-path placeholders.",
    },
    {
        "defectId": "RESOLVED_059_PREVIEW_CONTINUITY_TRUTH_DRIFT",
        "state": "resolved",
        "severity": "high",
        "statement": "Every reference case now binds to continuity-control families and ring-specific verification tuples so preview shells cannot claim calmness without governing truth.",
    },
    {
        "defectId": "RESOLVED_059_SIMULATOR_PROVIDER_SEMANTIC_DRIFT",
        "state": "resolved",
        "severity": "high",
        "statement": "Each simulator now publishes mock-now and actual-provider-later sections with bounded deltas and rollback-to-simulator law.",
    },
    {
        "defectId": "RESOLVED_059_TELEPHONY_CONTINUATION_GUESSWORK",
        "state": "resolved",
        "severity": "high",
        "statement": "Telephony seeded continuation is now tied to explicit continuation-eligibility and reachability seed tuples rather than transcript heuristics.",
    },
    {
        "defectId": "RESOLVED_059_RELEASE_PROOF_SIMULATION_SPLIT",
        "state": "resolved",
        "severity": "high",
        "statement": "Reference cases now map directly into preview, integration, preprod, and wave-probe verification instead of living in a separate demo-only world.",
    },
]

ASSUMPTIONS = [
    {
        "assumptionId": "ASSUMPTION_059_PREVIEW_MAPS_TO_CI_PREVIEW_RING",
        "summary": "The prompt-level releaseVerificationUse value `preview` resolves to the published `ci-preview` verification ring from seq_058.",
    },
    {
        "assumptionId": "ASSUMPTION_059_SUPPORT_REPLAY_USES_EXISTING_NOTIFICATION_AND_TELEPHONY_TWINS",
        "summary": "Support replay and same-shell restore consume the existing notification and telephony simulator twins rather than introducing an extra provider-shaped Phase 0 boundary.",
    },
]

CASE_BLUEPRINTS = [
    {
        "referenceCaseId": "RC_059_CLEAN_SELF_SERVICE_SUBMIT_V1",
        "caseCode": "clean_self_service_submit",
        "title": "Clean self-service submit",
        "persona": "patient_self_service",
        "channelProfile": "browser_public",
        "routeFamily": "rf_intake_self_service",
        "startingSurface": "audsurf_patient_public_entry",
        "releaseVerificationUse": "preview",
        "postureClass": "happy",
        "sharedSeedRefs": [
            "SEED_059_TENANT_SCOPE_PRIMARY_V1",
            "SEED_059_ORG_MERIDIAN_FAMILY_PRACTICE_V1",
            "SEED_059_RUNTIME_BINDING_PREVIEW_V1",
        ],
        "requiredSimulatorRefs": ["sim_email_notification_twin"],
        "requiredContinuityControlRefs": ["patient_nav"],
        "expectedStateAxisTransitions": [
            "submission:draft->submitted",
            "promotion:pending->settled",
            "workflow:created->triage_pending",
            "same_shell:pending->settled",
        ],
        "settlementEvents": ["intake.promotion.settled", "patient.receipt.issued"],
        "blockerKeys": [],
        "extraSeedKinds": ["communication_envelope", "lifecycle_lease"],
        "faultModes": ["timeout", "disputed_receipt"],
        "patientState": "verified_self_service",
        "notes": "Preview baseline proving a truthful receipt and same-shell return without any live provider tuple.",
    },
    {
        "referenceCaseId": "RC_059_DUPLICATE_RETRY_COLLAPSE_V1",
        "caseCode": "duplicate_retry_return_prior_accepted",
        "title": "Duplicate retry returns prior accepted result",
        "persona": "patient_authenticated",
        "channelProfile": "authenticated_portal",
        "routeFamily": "rf_patient_requests",
        "startingSurface": "audsurf_patient_authenticated_portal",
        "releaseVerificationUse": "preview",
        "postureClass": "happy",
        "sharedSeedRefs": [
            "SEED_059_TENANT_SCOPE_PRIMARY_V1",
            "SEED_059_ORG_MERIDIAN_FAMILY_PRACTICE_V1",
            "SEED_059_RUNTIME_BINDING_PREVIEW_V1",
        ],
        "requiredSimulatorRefs": ["sim_email_notification_twin"],
        "requiredContinuityControlRefs": ["patient_nav"],
        "expectedStateAxisTransitions": [
            "duplicate:scored->retry_collapsed",
            "lineage:active->attached_prior_request",
            "same_shell:pending->settled",
        ],
        "settlementEvents": [
            "request.duplicate.retry_collapsed",
            "request.duplicate.resolved",
            "patient.receipt.issued",
        ],
        "blockerKeys": [],
        "extraSeedKinds": ["duplicate_cluster", "recovery_continuation_token"],
        "faultModes": ["duplicate", "replay"],
        "patientState": "verified_authenticated",
        "notes": "Duplicate replay proves prior accepted result reuse without reminting request truth or pretending a fresh success path occurred.",
    },
    {
        "referenceCaseId": "RC_059_DUPLICATE_COLLISION_REVIEW_V1",
        "caseCode": "duplicate_collision_open_review",
        "title": "Duplicate collision opens review",
        "persona": "support_operator",
        "channelProfile": "support_workspace",
        "routeFamily": "rf_support_ticket_workspace",
        "startingSurface": "audsurf_support_workspace",
        "releaseVerificationUse": "integration",
        "postureClass": "recovery",
        "sharedSeedRefs": [
            "SEED_059_TENANT_SCOPE_PRIMARY_V1",
            "SEED_059_ORG_VECELLS_SUPPORT_V1",
            "SEED_059_RUNTIME_BINDING_INTEGRATION_V1",
        ],
        "requiredSimulatorRefs": ["sim_email_notification_twin", "sim_sms_delivery_twin"],
        "requiredContinuityControlRefs": ["workspace_task_completion"],
        "expectedStateAxisTransitions": [
            "duplicate:paired->review_required",
            "closure:blockers_empty->duplicate_review_open",
            "operator_posture:observe_only->review_required",
        ],
        "settlementEvents": [
            "request.duplicate.pair_scored",
            "request.duplicate.review_required",
            "request.closure_blockers.changed",
        ],
        "blockerKeys": ["duplicate_review"],
        "extraSeedKinds": ["duplicate_cluster", "support_ticket", "lifecycle_lease", "patient_action_recovery_envelope"],
        "faultModes": ["duplicate", "replay"],
        "patientState": "duplicate_collision_review",
        "notes": "Integration duplicate collision keeps review truth explicit for support and blocks silent collapse into an accepted replay.",
    },
    {
        "referenceCaseId": "RC_059_ACCEPTED_PROGRESS_DEGRADED_FALLBACK_V1",
        "caseCode": "fallback_review_after_accepted_progress_degrades",
        "title": "Accepted progress degrades into fallback review",
        "persona": "support_operator",
        "channelProfile": "support_workspace",
        "routeFamily": "rf_support_replay_observe",
        "startingSurface": "audsurf_support_workspace",
        "releaseVerificationUse": "wave_probe",
        "postureClass": "degraded",
        "sharedSeedRefs": [
            "SEED_059_TENANT_SCOPE_PRIMARY_V1",
            "SEED_059_ORG_VECELLS_SUPPORT_V1",
            "SEED_059_RUNTIME_BINDING_WAVE_PROBE_V1",
        ],
        "requiredSimulatorRefs": ["sim_email_notification_twin", "sim_mesh_message_path_twin"],
        "requiredContinuityControlRefs": ["support_replay_restore", "conversation_settlement", "more_info_reply"],
        "expectedStateAxisTransitions": [
            "progress:accepted->degraded",
            "fallback:none->review_required",
            "same_shell:settled->recovery_required",
        ],
        "settlementEvents": [
            "exception.review_case.opened",
            "support.replay.restore.required",
            "communication.command.settled",
        ],
        "blockerKeys": ["fallback_review", "degraded_promise"],
        "extraSeedKinds": [
            "fallback_review_case",
            "support_ticket",
            "support_replay_restore_settlement",
            "communication_envelope",
            "patient_action_recovery_envelope",
            "reachability_assessment",
            "lifecycle_lease",
        ],
        "faultModes": ["stale_callback", "disputed_receipt", "partial_outage"],
        "patientState": "accepted_progress_degraded",
        "notes": "Wave-probe case proving degraded accepted progress re-enters governed fallback review without losing same-shell provenance.",
    },
    {
        "referenceCaseId": "RC_059_WRONG_PATIENT_IDENTITY_REPAIR_HOLD_V1",
        "caseCode": "wrong_patient_identity_repair_hold",
        "title": "Wrong-patient freeze and identity repair hold",
        "persona": "patient_authenticated",
        "channelProfile": "authenticated_portal",
        "routeFamily": "rf_patient_secure_link_recovery",
        "startingSurface": "audsurf_patient_transaction_recovery",
        "releaseVerificationUse": "preview",
        "postureClass": "blocked",
        "sharedSeedRefs": [
            "SEED_059_TENANT_SCOPE_PRIMARY_V1",
            "SEED_059_ORG_MERIDIAN_FAMILY_PRACTICE_V1",
            "SEED_059_RUNTIME_BINDING_PREVIEW_V1",
        ],
        "requiredSimulatorRefs": ["sim_nhs_login_auth_session_twin", "sim_optional_pds_enrichment_twin"],
        "requiredContinuityControlRefs": ["patient_nav"],
        "expectedStateAxisTransitions": [
            "subject_binding:aligned->mismatch_detected",
            "identity:session_bound->repair_hold",
            "same_shell:read_only->recovery_required",
        ],
        "settlementEvents": [
            "identity.repair_signal.recorded",
            "identity.repair_case.opened",
            "identity.repair_case.freeze_committed",
        ],
        "blockerKeys": ["identity_repair"],
        "extraSeedKinds": [
            "identity_binding",
            "identity_repair_case",
            "access_grant",
            "recovery_continuation_token",
            "patient_action_recovery_envelope",
        ],
        "faultModes": ["stale_callback", "replay"],
        "patientState": "identity_repair_hold",
        "notes": "Preview repair case proving wrong-patient holds remain explicit and recover through the same secure-link shell.",
    },
    {
        "referenceCaseId": "RC_059_URGENT_DIVERSION_ISSUED_V1",
        "caseCode": "urgent_diversion_required_then_issued",
        "title": "Urgent diversion required then issued",
        "persona": "patient_self_service",
        "channelProfile": "browser_public",
        "routeFamily": "rf_intake_self_service",
        "startingSurface": "audsurf_patient_public_entry",
        "releaseVerificationUse": "preprod",
        "postureClass": "blocked",
        "sharedSeedRefs": [
            "SEED_059_TENANT_SCOPE_PRIMARY_V1",
            "SEED_059_ORG_MERIDIAN_FAMILY_PRACTICE_V1",
            "SEED_059_RUNTIME_BINDING_PREPROD_V1",
        ],
        "requiredSimulatorRefs": ["sim_telephony_ivr_twin", "sim_email_notification_twin"],
        "requiredContinuityControlRefs": ["intake_resume"],
        "expectedStateAxisTransitions": [
            "safety:routine->urgent_required",
            "diversion:pending->issued",
            "same_shell:writable->urgent_guidance_only",
        ],
        "settlementEvents": [
            "safety.urgent_diversion.required",
            "safety.urgent_diversion.issued",
        ],
        "blockerKeys": ["safety_preemption"],
        "extraSeedKinds": [
            "telephony_call_session",
            "patient_action_recovery_envelope",
            "lifecycle_lease",
        ],
        "faultModes": ["partial_outage", "timeout"],
        "patientState": "urgent_diversion",
        "notes": "Preprod urgent-diversion case proving seeded flows can escalate into live-human posture without false reassurance or detached restarts.",
    },
    {
        "referenceCaseId": "RC_059_TELEPHONY_URGENT_LIVE_ONLY_V1",
        "caseCode": "telephony_urgent_live_only_capture",
        "title": "Telephony urgent-live-only capture",
        "persona": "caller_telephony",
        "channelProfile": "telephony_ivr",
        "routeFamily": "rf_intake_telephony_capture",
        "startingSurface": "audsurf_patient_public_entry",
        "releaseVerificationUse": "preprod",
        "postureClass": "degraded",
        "sharedSeedRefs": [
            "SEED_059_TENANT_SCOPE_PRIMARY_V1",
            "SEED_059_ORG_MERIDIAN_FAMILY_PRACTICE_V1",
            "SEED_059_RUNTIME_BINDING_PREPROD_V1",
        ],
        "requiredSimulatorRefs": ["sim_telephony_ivr_twin", "sim_transcription_processing_twin"],
        "requiredContinuityControlRefs": ["intake_resume"],
        "expectedStateAxisTransitions": [
            "telephony:capture_started->urgent_live_only",
            "evidence:recording_pending->readiness_pending",
            "same_shell:continuation_possible->live_only_guidance",
        ],
        "settlementEvents": [
            "telephony.urgent_live.assessed",
            "telephony.continuation.eligibility.settled",
        ],
        "blockerKeys": ["safety_preemption"],
        "extraSeedKinds": [
            "telephony_call_session",
            "telephony_continuation_eligibility",
            "transcript_stub",
            "patient_action_recovery_envelope",
        ],
        "faultModes": ["timeout", "stale_callback", "ordering_inversion"],
        "patientState": "telephony_urgent_live_only",
        "notes": "Preprod telephony case proving urgent-live-only posture survives missing recording and non-authoritative transcript state.",
    },
    {
        "referenceCaseId": "RC_059_TELEPHONY_CONTINUATION_BRANCH_V1",
        "caseCode": "telephony_seeded_vs_challenge_continuation",
        "title": "Telephony seeded continuation versus challenge continuation",
        "persona": "caller_telephony",
        "channelProfile": "telephony_ivr",
        "routeFamily": "rf_intake_telephony_capture",
        "startingSurface": "audsurf_patient_public_entry",
        "releaseVerificationUse": "preprod",
        "postureClass": "recovery",
        "sharedSeedRefs": [
            "SEED_059_TENANT_SCOPE_PRIMARY_V1",
            "SEED_059_ORG_MERIDIAN_FAMILY_PRACTICE_V1",
            "SEED_059_RUNTIME_BINDING_PREPROD_V1",
        ],
        "requiredSimulatorRefs": ["sim_telephony_ivr_twin", "sim_sms_delivery_twin"],
        "requiredContinuityControlRefs": ["intake_resume", "patient_nav"],
        "expectedStateAxisTransitions": [
            "continuation_eligibility:seeded->challenge_only",
            "grant:none->issued_or_withheld",
            "same_shell:call_active->resume_or_repair",
        ],
        "settlementEvents": [
            "telephony.continuation.eligibility.settled",
            "telephony.continuation.context.resolved",
            "access.grant.issued",
        ],
        "blockerKeys": ["live_phi_grant", "reachability_dependency"],
        "extraSeedKinds": [
            "telephony_call_session",
            "telephony_continuation_eligibility",
            "telephony_continuation_context",
            "access_grant",
            "recovery_continuation_token",
            "reachability_assessment",
        ],
        "faultModes": ["replay", "duplicate", "stale_callback"],
        "patientState": "telephony_continuation_branching",
        "notes": "Preprod continuation case enforcing exact seeded-versus-challenge law from evidence readiness and contact-route truth only.",
    },
    {
        "referenceCaseId": "RC_059_BOOKING_CONFIRMATION_PENDING_AMBIGUITY_V1",
        "caseCode": "booking_confirmation_pending_ambiguity",
        "title": "Booking confirmation-pending and ambiguity",
        "persona": "hub_operator",
        "channelProfile": "hub_workspace",
        "routeFamily": "rf_hub_case_management",
        "startingSurface": "audsurf_hub_desk",
        "releaseVerificationUse": "preprod",
        "postureClass": "blocked",
        "sharedSeedRefs": [
            "SEED_059_TENANT_SCOPE_PRIMARY_V1",
            "SEED_059_ORG_MERIDIAN_FAMILY_PRACTICE_V1",
            "SEED_059_ORG_NORTH_RIVER_HUB_V1",
            "SEED_059_RUNTIME_BINDING_PREPROD_V1",
        ],
        "requiredSimulatorRefs": [
            "sim_im1_principal_system_emis_twin",
            "sim_im1_principal_system_tpp_twin",
            "sim_booking_provider_confirmation_twin",
            "sim_booking_capacity_feed_twin",
        ],
        "requiredContinuityControlRefs": ["booking_manage", "hub_booking_manage"],
        "expectedStateAxisTransitions": [
            "booking:commit_started->confirmation_pending",
            "confirmation_gate:none->pending",
            "hub_shell:writable->review_required",
        ],
        "settlementEvents": [
            "booking.commit.started",
            "booking.commit.confirmation_pending",
            "booking.commit.ambiguous",
            "confirmation.gate.created",
        ],
        "blockerKeys": ["confirmation_gate"],
        "extraSeedKinds": [
            "booking_case",
            "capacity_snapshot",
            "external_confirmation_gate",
            "hub_case",
            "lifecycle_lease",
        ],
        "faultModes": ["timeout", "ordering_inversion", "stale_callback"],
        "patientState": "booking_confirmation_pending",
        "notes": "Preprod hub-managed booking case proving confirmation debt and ambiguity remain explicit across patient and hub semantics.",
    },
    {
        "referenceCaseId": "RC_059_PHARMACY_DISPATCH_WEAK_MATCH_V1",
        "caseCode": "pharmacy_dispatch_proof_pending_weak_match",
        "title": "Pharmacy dispatch proof pending and weak-match outcome",
        "persona": "pharmacy_operator",
        "channelProfile": "pharmacy_console",
        "routeFamily": "rf_pharmacy_console",
        "startingSurface": "audsurf_pharmacy_console",
        "releaseVerificationUse": "integration",
        "postureClass": "degraded",
        "sharedSeedRefs": [
            "SEED_059_TENANT_SCOPE_PRIMARY_V1",
            "SEED_059_ORG_MERIDIAN_FAMILY_PRACTICE_V1",
            "SEED_059_ORG_RIVERSTONE_PHARMACY_V1",
            "SEED_059_RUNTIME_BINDING_INTEGRATION_V1",
        ],
        "requiredSimulatorRefs": [
            "sim_pharmacy_dispatch_transport_twin",
            "sim_pharmacy_visibility_update_record_twin",
            "sim_mesh_message_path_twin",
        ],
        "requiredContinuityControlRefs": ["pharmacy_console_settlement"],
        "expectedStateAxisTransitions": [
            "dispatch:started->proof_pending",
            "outcome:received->weak_match",
            "pharmacy_shell:settled->reconciliation_required",
        ],
        "settlementEvents": [
            "pharmacy.dispatch.started",
            "pharmacy.dispatch.proof_missing",
            "pharmacy.outcome.unmatched",
            "pharmacy.outcome.reconciled",
        ],
        "blockerKeys": ["confirmation_gate", "outcome_reconciliation"],
        "extraSeedKinds": [
            "pharmacy_case",
            "pharmacy_dispatch_attempt",
            "outcome_reconciliation_gate",
            "communication_envelope",
            "lifecycle_lease",
        ],
        "faultModes": ["disputed_receipt", "duplicate", "partial_outage", "stale_callback"],
        "patientState": "pharmacy_weak_match",
        "notes": "Integration pharmacy case proving dispatch and weak-match outcome truth stay explicit and closure remains coordinator-owned.",
    },
    {
        "referenceCaseId": "RC_059_SUPPORT_REPLAY_RESTORE_V1",
        "caseCode": "support_replay_restore_same_shell_recovery",
        "title": "Support replay restore and same-shell recovery",
        "persona": "support_operator",
        "channelProfile": "support_workspace",
        "routeFamily": "rf_support_replay_observe",
        "startingSurface": "audsurf_support_workspace",
        "releaseVerificationUse": "preprod",
        "postureClass": "recovery",
        "sharedSeedRefs": [
            "SEED_059_TENANT_SCOPE_PRIMARY_V1",
            "SEED_059_ORG_VECELLS_SUPPORT_V1",
            "SEED_059_RUNTIME_BINDING_PREPROD_V1",
        ],
        "requiredSimulatorRefs": [
            "sim_email_notification_twin",
            "sim_sms_delivery_twin",
            "sim_telephony_ivr_twin",
        ],
        "requiredContinuityControlRefs": [
            "support_replay_restore",
            "conversation_settlement",
            "more_info_reply",
            "workspace_task_completion",
        ],
        "expectedStateAxisTransitions": [
            "support:observe_only->restore_required",
            "restore:settlement_missing->settled",
            "same_shell:recovery_required->restored",
        ],
        "settlementEvents": [
            "support.replay.restore.required",
            "support.replay.restore.settled",
            "reachability.assessment.settled",
            "communication.command.settled",
        ],
        "blockerKeys": ["reachability_dependency"],
        "extraSeedKinds": [
            "support_ticket",
            "support_replay_restore_settlement",
            "communication_envelope",
            "recovery_continuation_token",
            "patient_action_recovery_envelope",
            "reachability_assessment",
            "lifecycle_lease",
        ],
        "faultModes": ["replay", "disputed_receipt", "ordering_inversion", "partial_outage"],
        "patientState": "support_restore_required",
        "notes": "Preprod replay case proving support restore can reopen same-shell work only after restore settlement and reachability proof align.",
    },
]


def read_json(path: Path) -> Any:
    return json.loads(path.read_text())


def read_csv(path: Path) -> list[dict[str, str]]:
    with path.open() as handle:
        return list(csv.DictReader(handle))


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
        writer.writerows(rows)


def sha16(*parts: Any) -> str:
    digest = hashlib.sha256()
    for part in parts:
        digest.update(str(part).encode("utf-8"))
        digest.update(b"\x1f")
    return digest.hexdigest()[:16]


def slug(value: str) -> str:
    return "".join(ch if ch.isalnum() else "_" for ch in value).strip("_").lower()


def token(value: str) -> str:
    return value.upper().replace("-", "_")


def split_semicolon(value: str) -> list[str]:
    return [item.strip() for item in value.split(";") if item.strip()]


def merge_unique(items: list[str]) -> list[str]:
    return sorted({item for item in items if item})


def case_seed_id(case_code: str, kind: str) -> str:
    return f"SEED_059_{token(case_code)}_{token(kind)}_V1"


def build_context() -> dict[str, Any]:
    adapter_pack = read_json(ADAPTER_PROFILE_PATH)
    simulator_pack = read_json(SIMULATOR_BACKLOG_PATH)
    verification_pack = read_json(VERIFICATION_SCENARIO_PATH)
    matrix_pack = read_json(VERIFICATION_MATRIX_PATH)
    blocker_pack = read_json(BLOCKER_TAXONOMY_PATH)
    route_rows = read_csv(FRONTEND_ROUTE_MATRIX_PATH)
    event_rows = read_csv(EVENT_MATRIX_PATH)

    simulators = simulator_pack["simulators"]
    simulator_by_id = {row["simulator_id"]: row for row in simulators}

    adapter_profiles = adapter_pack["adapterContractProfiles"]
    adapters_by_simulator: dict[str, list[dict[str, Any]]] = {}
    for profile in adapter_profiles:
        adapters_by_simulator.setdefault(profile["simulatorContractRef"], []).append(profile)

    route_by_family = {row["route_family_id"]: row for row in route_rows}
    event_by_name = {row["event_name"]: row for row in event_rows}
    blocker_by_key = {row["blockerClassKey"]: row for row in blocker_pack["blockerClasses"]}

    ring_by_matrix_ref = {
        row["releaseContractVerificationMatrixRef"]: row["ringCode"]
        for row in verification_pack["verificationScenarios"]
    }
    continuity_by_ring_and_control = {
        (ring_by_matrix_ref[row["releaseContractVerificationMatrixRef"]], row["continuityControlCode"]): row
        for row in matrix_pack["continuityContractCoverageRecords"]
    }

    scenario_by_ring = {
        row["ringCode"]: row for row in verification_pack["verificationScenarios"]
    }
    control_catalog = {
        row["code"]: row for row in verification_pack["continuityControlCatalog"]
    }

    return {
        "simulator_by_id": simulator_by_id,
        "adapters_by_simulator": adapters_by_simulator,
        "route_by_family": route_by_family,
        "event_by_name": event_by_name,
        "blocker_by_key": blocker_by_key,
        "continuity_by_ring_and_control": continuity_by_ring_and_control,
        "scenario_by_ring": scenario_by_ring,
        "control_catalog": control_catalog,
    }


def expected_settlement_refs(context: dict[str, Any], event_names: list[str]) -> list[str]:
    refs = []
    for event_name in event_names:
        event_row = context["event_by_name"][event_name]
        refs.append(event_row["schema_version_ref"])
    return refs


def continuity_record_refs(
    context: dict[str, Any], release_use: str, controls: list[str]
) -> list[str]:
    ring = RING_BY_RELEASE_USE[release_use]
    refs = []
    for control in controls:
        record = context["continuity_by_ring_and_control"][(ring, control)]
        refs.append(record["continuityContractCoverageRecordId"])
    return refs


def case_release_binding_ref(context: dict[str, Any], release_use: str) -> str:
    ring = RING_BY_RELEASE_USE[release_use]
    return context["scenario_by_ring"][ring]["verificationScenarioId"]


def route_row_for(context: dict[str, Any], route_family: str) -> dict[str, str]:
    return context["route_by_family"][route_family]


def build_seed_rows_for_case(
    context: dict[str, Any], case_row: dict[str, Any], blueprint: dict[str, Any]
) -> list[dict[str, str]]:
    route_row = route_row_for(context, blueprint["routeFamily"])
    rows: list[dict[str, str]] = []
    all_case_kinds = BASE_CASE_OBJECT_KINDS + blueprint["extraSeedKinds"]
    simulator_refs = "; ".join(blueprint["requiredSimulatorRefs"])
    continuity_refs = "; ".join(blueprint["requiredContinuityControlRefs"])
    release_binding_ref = case_release_binding_ref(context, blueprint["releaseVerificationUse"])

    for kind in all_case_kinds:
        meta = OBJECT_KIND_META[kind]
        seed_state = meta["default_state"]
        if kind == "release_binding_row":
            seed_state = blueprint["releaseVerificationUse"]
        elif kind == "patient_identity_seed":
            seed_state = blueprint["patientState"]
        elif kind == "command_settlement_record":
            seed_state = "review_required" if blueprint["postureClass"] in {"blocked", "recovery"} else "settled_or_pending"
        elif kind == "patient_receipt":
            seed_state = blueprint["postureClass"]

        rows.append(
            {
                "seed_object_id": case_seed_id(blueprint["caseCode"], kind),
                "object_type": meta["object_type"],
                "reference_case_id": blueprint["referenceCaseId"],
                "tenant_scope_ref": "tenant://vecells/phase0-primary",
                "organisation_scope_ref": "; ".join(blueprint["sharedSeedRefs"][1:-1]) or "org://vecells/platform",
                "route_family_ref": blueprint["routeFamily"],
                "starting_surface_ref": blueprint["startingSurface"],
                "seed_state": seed_state,
                "simulator_refs": simulator_refs,
                "continuity_control_refs": continuity_refs,
                "release_verification_use": blueprint["releaseVerificationUse"],
                "phi_safe_class": "synthetic_phi_safe",
                "requires_live_credentials": "no",
                "canonical_truth_refs": release_binding_ref if kind == "release_binding_row" else meta["truth_refs"],
                "notes": meta["note"],
            }
        )

    return rows


def build_reference_cases(context: dict[str, Any]) -> tuple[list[dict[str, Any]], list[dict[str, str]], list[dict[str, str]]]:
    reference_cases: list[dict[str, Any]] = []
    seed_rows: list[dict[str, str]] = list(SHARED_SEED_ROWS)
    continuity_rows: list[dict[str, str]] = []

    for blueprint in CASE_BLUEPRINTS:
        route_row = route_row_for(context, blueprint["routeFamily"])
        continuity_record_ids = continuity_record_refs(
            context, blueprint["releaseVerificationUse"], blueprint["requiredContinuityControlRefs"]
        )
        seed_rows_for_case = build_seed_rows_for_case(context, {}, blueprint)
        seed_rows.extend(seed_rows_for_case)

        required_seed_objects = blueprint["sharedSeedRefs"] + [
            row["seed_object_id"] for row in seed_rows_for_case
        ]
        recovery_envelope_refs = [
            case_seed_id(blueprint["caseCode"], kind)
            for kind in blueprint["extraSeedKinds"]
            if kind in RECOVERY_OBJECT_KINDS
        ]
        closure_blockers = [
            context["blocker_by_key"][key]["blockerClassId"] for key in blueprint["blockerKeys"]
        ]
        settlement_refs = expected_settlement_refs(context, blueprint["settlementEvents"])
        release_binding_ref = case_release_binding_ref(context, blueprint["releaseVerificationUse"])

        case_row = {
            "referenceCaseId": blueprint["referenceCaseId"],
            "caseCode": blueprint["caseCode"],
            "title": blueprint["title"],
            "persona": blueprint["persona"],
            "channelProfile": blueprint["channelProfile"],
            "routeFamily": blueprint["routeFamily"],
            "startingSurface": blueprint["startingSurface"],
            "requiredSeedObjects": required_seed_objects,
            "requiredSimulatorRefs": blueprint["requiredSimulatorRefs"],
            "requiredContinuityControlRefs": blueprint["requiredContinuityControlRefs"],
            "continuityCoverageRecordRefs": continuity_record_ids,
            "expectedStateAxisTransitions": blueprint["expectedStateAxisTransitions"],
            "expectedSettlementRefs": settlement_refs,
            "expectedClosureBlockerRefs": closure_blockers,
            "expectedRecoveryEnvelopeRefs": recovery_envelope_refs,
            "releaseVerificationUse": blueprint["releaseVerificationUse"],
            "releaseVerificationScenarioRef": release_binding_ref,
            "surfaceManifestRef": route_row["frontend_contract_manifest_id"],
            "gatewaySurfaceRefs": split_semicolon(route_row["gateway_surface_refs"]),
            "projectionQueryContractRefs": split_semicolon(route_row["projection_query_contract_refs"]),
            "mutationCommandContractRefs": split_semicolon(route_row["mutation_command_contract_refs"]),
            "liveUpdateChannelContractRefs": split_semicolon(route_row["live_update_channel_contract_refs"]),
            "commandSettlementSchemaRef": route_row["command_settlement_schema_ref"],
            "transitionEnvelopeSchemaRef": route_row["transition_envelope_schema_ref"],
            "browserPostureState": route_row["browser_posture_state"],
            "driftState": route_row["drift_state"],
            "postureClass": blueprint["postureClass"],
            "notes": blueprint["notes"],
            "caseDigestRef": f"rcase::{sha16(blueprint['referenceCaseId'], settlement_refs, required_seed_objects)}",
            "source_refs": [
                "prompt/059.md",
                route_row["frontend_contract_manifest_id"],
                release_binding_ref,
            ],
        }
        reference_cases.append(case_row)

        for control, continuity_ref in zip(
            blueprint["requiredContinuityControlRefs"], continuity_record_ids, strict=True
        ):
            continuity_rows.append(
                {
                    "reference_case_id": blueprint["referenceCaseId"],
                    "case_code": blueprint["caseCode"],
                    "release_verification_use": blueprint["releaseVerificationUse"],
                    "continuity_control_code": control,
                    "continuity_coverage_record_ref": continuity_ref,
                    "route_family_ref": blueprint["routeFamily"],
                    "surface_manifest_ref": route_row["frontend_contract_manifest_id"],
                    "runtime_binding_ref": release_binding_ref,
                    "verification_scenario_ref": release_binding_ref,
                    "validation_goal": CONTINUITY_GOALS[control],
                    "posture_class": blueprint["postureClass"],
                }
            )

    seed_rows.sort(key=lambda row: (row["reference_case_id"], row["seed_object_id"]))
    continuity_rows.sort(
        key=lambda row: (row["reference_case_id"], row["continuity_control_code"])
    )
    return reference_cases, seed_rows, continuity_rows


def supported_simulator_ids(reference_cases: list[dict[str, Any]]) -> list[str]:
    return sorted(
        {
            simulator_id
            for case_row in reference_cases
            for simulator_id in case_row["requiredSimulatorRefs"]
        }
    )


def merge_adapter_profiles(profiles: list[dict[str, Any]]) -> dict[str, Any]:
    primary = profiles[0]
    dependency_codes = [row["dependencyCode"] for row in profiles]
    titles = [row["title"] for row in profiles]
    live_gate_sources = merge_unique(
        [row["actualProviderStrategyLater"].get("liveGateSource", "") for row in profiles]
    )
    blocked_gates = merge_unique(
        gate
        for row in profiles
        for gate in row["actualProviderStrategyLater"].get("blockedLiveGateIds", [])
    )
    review_gates = merge_unique(
        gate
        for row in profiles
        for gate in row["actualProviderStrategyLater"].get("reviewLiveGateIds", [])
    )
    proof_obligations = merge_unique(
        proof
        for row in profiles
        for proof in row["actualProviderStrategyLater"].get("operationalEvidenceRequired", [])
    )
    bounded_deltas = merge_unique(
        delta
        for row in profiles
        for delta in row["actualProviderStrategyLater"].get("contractDifferencesMustRemainBounded", [])
    )
    onboarding = merge_unique(
        item
        for row in profiles
        for item in row["actualProviderStrategyLater"].get("onboardingPrerequisites", [])
    )
    fault_modes = merge_unique(
        mode
        for row in profiles
        for mode in row["mockNowExecution"].get("faultInjectionCases", [])
    )
    seeded_fixtures = merge_unique(
        fixture
        for row in profiles
        for fixture in row["mockNowExecution"].get("seededFixtures", [])
    )
    observability = merge_unique(
        hook
        for row in profiles
        for hook in row["mockNowExecution"].get("observabilityHooks", [])
    )
    rollback = merge_unique(
        row["actualProviderStrategyLater"].get("rollbackToSimulatorSafeMode", "")
        for row in profiles
    )
    return {
        "primary": primary,
        "dependencyCodes": dependency_codes,
        "titles": titles,
        "liveGateSources": live_gate_sources,
        "blockedLiveGateIds": blocked_gates,
        "reviewLiveGateIds": review_gates,
        "proofObligations": proof_obligations,
        "boundedDeltas": bounded_deltas,
        "onboarding": onboarding,
        "faultModes": fault_modes,
        "seededFixtures": seeded_fixtures,
        "observability": observability,
        "rollbackRules": rollback,
    }


def seeded_entity_refs_for_simulator(
    simulator_id: str, reference_cases: list[dict[str, Any]], seed_rows: list[dict[str, str]]
) -> list[str]:
    case_ids = {
        row["referenceCaseId"] for row in reference_cases if simulator_id in row["requiredSimulatorRefs"]
    }
    interesting_types = {
        "SyntheticPatientIdentityState",
        "CommunicationEnvelope",
        "AccessGrant",
        "CallSessionRecord",
        "TelephonyContinuationContext",
        "TranscriptArtifact",
        "PharmacyCase",
        "BookingCase",
    }
    return [
        row["seed_object_id"]
        for row in seed_rows
        if row["reference_case_id"] in case_ids and row["object_type"] in interesting_types
    ]


def build_simulator_catalog(
    context: dict[str, Any], reference_cases: list[dict[str, Any]], seed_rows: list[dict[str, str]]
) -> list[dict[str, Any]]:
    simulators: list[dict[str, Any]] = []
    for simulator_id in supported_simulator_ids(reference_cases):
        simulator_backlog = context["simulator_by_id"][simulator_id]
        profiles = merge_adapter_profiles(context["adapters_by_simulator"][simulator_id])
        primary_profile = profiles["primary"]
        primary_dependency = primary_profile["dependencyCode"]
        supported_reference_case_ids = [
            row["referenceCaseId"] for row in reference_cases if simulator_id in row["requiredSimulatorRefs"]
        ]
        supported_fault_modes = STANDARD_FAULTS_BY_SIMULATOR[simulator_id]
        seeded_entities = seeded_entity_refs_for_simulator(simulator_id, reference_cases, seed_rows)
        rollback_back_to_simulator = (
            profiles["rollbackRules"][0] if profiles["rollbackRules"] else "Return immediately to the deterministic simulator tuple."
        )
        secret_classes = SECRET_CLASSES_BY_DEPENDENCY.get(primary_dependency, ["environment_target", "callback_secret"])
        simulators.append(
            {
                "simulatorId": simulator_id,
                "title": primary_profile["title"],
                "dependencyCode": primary_dependency,
                "additionalDependencyCodes": profiles["dependencyCodes"][1:],
                "dependencyFamily": primary_profile["dependencyFamily"],
                "simulatorType": simulator_backlog["minimum_fidelity_class"],
                "currentExecutionPosture": primary_profile["currentExecutionPosture"],
                "replacementMode": simulator_backlog["replacement_mode"],
                "supportedReferenceCaseIds": supported_reference_case_ids,
                "supportedFaultModes": supported_fault_modes,
                "contractDigestRef": f"sim-contract::{sha16(simulator_id, primary_dependency, supported_reference_case_ids, supported_fault_modes)}",
                "mock_now_execution": {
                    "mode": "Mock_now_execution",
                    "request_response_contract": primary_profile["mockNowExecution"]["requestResponseSchema"],
                    "callbacks": primary_profile["mockNowExecution"]["callbackWebhookPatterns"],
                    "replay_policy": primary_profile["mockNowExecution"]["orderingAndReplayBehavior"],
                    "ordering_policy": primary_profile["receiptOrderingPolicyRef"],
                    "fault_injection": supported_fault_modes,
                    "seeded_identities_or_messages": seeded_entities,
                    "seeded_fixtures": profiles["seededFixtures"],
                    "observability_hooks": profiles["observability"],
                    "side_effect_posture": "No live credentials or live external side effects are permitted in Phase 0.",
                },
                "actual_provider_strategy_later": {
                    "mode": "Actual_provider_strategy_later",
                    "onboarding_prerequisites": profiles["onboarding"],
                    "secret_classes": secret_classes,
                    "proof_obligations": profiles["proofObligations"],
                    "cutover_checklist": merge_unique(
                        profiles["blockedLiveGateIds"] + profiles["reviewLiveGateIds"] + [simulator_backlog["graduation_trigger"]]
                    ),
                    "rollback_back_to_simulator_strategy": rollback_back_to_simulator,
                    "semantic_preservation_rules": merge_unique(
                        profiles["boundedDeltas"] + simulator_backlog["unchanged_contract_elements"]
                    ),
                    "bounded_provider_deltas": simulator_backlog["provider_specific_flex"],
                    "live_gate_source": profiles["liveGateSources"][0] if profiles["liveGateSources"] else simulator_backlog["live_gate_source"],
                    "blocked_live_gate_ids": profiles["blockedLiveGateIds"],
                    "review_live_gate_ids": profiles["reviewLiveGateIds"],
                },
                "source_refs": merge_unique(
                    primary_profile.get("sourceRefs", [])
                    + simulator_backlog.get("source_refs", [])
                ),
            }
        )
    return simulators


def build_fault_matrix(
    reference_cases: list[dict[str, Any]], simulator_catalog: list[dict[str, Any]]
) -> list[dict[str, str]]:
    simulator_by_id = {row["simulatorId"]: row for row in simulator_catalog}
    rows: list[dict[str, str]] = []
    for case_row in reference_cases:
        case_blueprint = next(
            row for row in CASE_BLUEPRINTS if row["referenceCaseId"] == case_row["referenceCaseId"]
        )
        for simulator_id in case_row["requiredSimulatorRefs"]:
            simulator_row = simulator_by_id[simulator_id]
            for fault_mode in case_blueprint["faultModes"]:
                if fault_mode not in simulator_row["supportedFaultModes"]:
                    continue
                rows.append(
                    {
                        "fault_injection_id": f"FIM_059_{token(case_row['caseCode'])}_{token(simulator_id)}_{token(fault_mode)}",
                        "simulator_id": simulator_id,
                        "dependency_code": simulator_row["dependencyCode"],
                        "fault_mode": fault_mode,
                        "reference_case_id": case_row["referenceCaseId"],
                        "expected_effect": FAULT_EFFECTS[fault_mode],
                        "expected_settlement_refs": "; ".join(case_row["expectedSettlementRefs"]),
                        "expected_closure_blocker_refs": "; ".join(case_row["expectedClosureBlockerRefs"]),
                        "expected_recovery_envelope_refs": "; ".join(case_row["expectedRecoveryEnvelopeRefs"]),
                        "ordering_posture": "strict_replay_and_ordering",
                        "release_verification_use": case_row["releaseVerificationUse"],
                        "notes": "Fault injection remains first-class and never widens beyond the canonical request and settlement semantics.",
                    }
                )
    rows.sort(key=lambda row: row["fault_injection_id"])
    return rows


def build_reference_case_pack(
    context: dict[str, Any],
    reference_cases: list[dict[str, Any]],
    simulator_catalog: list[dict[str, Any]],
    continuity_rows: list[dict[str, str]],
    fault_rows: list[dict[str, str]],
) -> dict[str, Any]:
    posture_counts: dict[str, int] = {}
    release_use_counts: dict[str, int] = {}
    for row in reference_cases:
        posture_counts[row["postureClass"]] = posture_counts.get(row["postureClass"], 0) + 1
        release_use_counts[row["releaseVerificationUse"]] = (
            release_use_counts.get(row["releaseVerificationUse"], 0) + 1
        )

    return {
        "task_id": TASK_ID,
        "generated_at": TIMESTAMP,
        "captured_on": CAPTURED_ON,
        "visual_mode": VISUAL_MODE,
        "mission": MISSION,
        "source_precedence": SOURCE_PRECEDENCE,
        "summary": {
            "reference_case_count": len(reference_cases),
            "simulator_count": len(simulator_catalog),
            "degraded_case_count": posture_counts.get("degraded", 0),
            "blocked_case_count": posture_counts.get("blocked", 0),
            "recovery_case_count": posture_counts.get("recovery", 0),
            "continuity_control_count": len({row["continuity_control_code"] for row in continuity_rows}),
            "fault_injection_row_count": len(fault_rows),
            "preview_case_count": release_use_counts.get("preview", 0),
            "integration_case_count": release_use_counts.get("integration", 0),
            "preprod_case_count": release_use_counts.get("preprod", 0),
            "wave_probe_case_count": release_use_counts.get("wave_probe", 0),
        },
        "continuityControlCatalog": list(context["control_catalog"].values()),
        "assumptions": ASSUMPTIONS,
        "defects": DEFECTS,
        "referenceCases": reference_cases,
    }


def build_simulator_pack(simulator_catalog: list[dict[str, Any]], fault_rows: list[dict[str, str]]) -> dict[str, Any]:
    return {
        "task_id": TASK_ID,
        "generated_at": TIMESTAMP,
        "captured_on": CAPTURED_ON,
        "visual_mode": VISUAL_MODE,
        "mission": MISSION,
        "source_precedence": SOURCE_PRECEDENCE,
        "summary": {
            "simulator_count": len(simulator_catalog),
            "dependency_family_count": len({row["dependencyFamily"] for row in simulator_catalog}),
            "supported_reference_case_count": len(
                {
                    case_id
                    for row in simulator_catalog
                    for case_id in row["supportedReferenceCaseIds"]
                }
            ),
            "fault_mode_count": len({row["fault_mode"] for row in fault_rows}),
            "cutover_pending_count": sum(
                1
                for row in simulator_catalog
                if row["currentExecutionPosture"] == "simulator_backed"
            ),
        },
        "assumptions": ASSUMPTIONS,
        "defects": DEFECTS,
        "simulators": simulator_catalog,
    }


def build_fixture_index(reference_cases: list[dict[str, Any]]) -> dict[str, Any]:
    items = []
    by_case_code = {}
    for row in reference_cases:
        item = {
            "referenceCaseId": row["referenceCaseId"],
            "caseCode": row["caseCode"],
            "fixtureHandle": f"reference_case::{row['caseCode']}",
            "releaseVerificationUse": row["releaseVerificationUse"],
            "tenantScopeRef": "tenant://vecells/phase0-primary",
            "requiredSeedObjects": row["requiredSeedObjects"],
            "requiredSimulatorRefs": row["requiredSimulatorRefs"],
            "continuityControlRefs": row["requiredContinuityControlRefs"],
            "caseDigestRef": row["caseDigestRef"],
        }
        items.append(item)
        by_case_code[row["caseCode"]] = item
    return {
        "task_id": TASK_ID,
        "generated_at": TIMESTAMP,
        "captured_on": CAPTURED_ON,
        "summary": {
            "reference_case_count": len(items),
            "fixture_handle_count": len(items),
        },
        "items": items,
        "byCaseCode": by_case_code,
    }


def build_strategy_doc(
    case_pack: dict[str, Any], simulator_pack: dict[str, Any], seed_rows: list[dict[str, str]]
) -> str:
    posture_rows = []
    for posture in ["happy", "degraded", "blocked", "recovery"]:
        posture_rows.append(
            f"| {posture} | {sum(1 for row in case_pack['referenceCases'] if row['postureClass'] == posture)} |"
        )
    return dedent(
        f"""
        # 59 Seed Data And Simulator Strategy

        Seq `059` freezes one simulator-first seed corpus for Phase 0 so preview shells, integration rehearsals, backend tests, and release verification all reuse the same deterministic request truth instead of waiting on live onboarding.

        ## Summary

        - Generated at: `{case_pack["generated_at"]}`
        - Reference cases: `{case_pack["summary"]["reference_case_count"]}`
        - Simulators: `{simulator_pack["summary"]["simulator_count"]}`
        - Seed rows: `{len(seed_rows)}`
        - Fault-injection rows: `{case_pack["summary"]["fault_injection_row_count"]}`
        - Continuity-control families covered: `{case_pack["summary"]["continuity_control_count"]}`

        ## Posture Mix

        | Posture | Cases |
        | --- | ---: |
        {"\n".join(posture_rows)}

        ## Governing Law

        1. Phase 0 provider-shaped dependencies are simulator-first by default.
        2. Reference cases reuse canonical request, lineage, blocker, settlement, and recovery semantics from the blueprint corpus.
        3. Seed data includes unhappy-path truth, not only visual placeholder success.
        4. Preview shells may not imply calm or writable posture unless the seeded tuples and settlements justify it.
        5. Every simulator publishes explicit mock-now and actual-provider-later sections with rollback-to-simulator law.

        ## Gap Closures

        {chr(10).join(f"- `{row['defectId']}`: {row['statement']}" for row in DEFECTS)}

        ## Source Order

        {chr(10).join(f"- `{row}`" for row in SOURCE_PRECEDENCE)}
        """
    ).strip()


def build_corpus_doc(reference_cases: list[dict[str, Any]]) -> str:
    rows = []
    for row in reference_cases:
        rows.append(
            "| {case_code} | {persona} | {channel} | {route} | {release_use} | {posture} | {simulators} | {controls} |".format(
                case_code=row["caseCode"],
                persona=row["persona"],
                channel=row["channelProfile"],
                route=row["routeFamily"],
                release_use=row["releaseVerificationUse"],
                posture=row["postureClass"],
                simulators=len(row["requiredSimulatorRefs"]),
                controls=", ".join(row["requiredContinuityControlRefs"]),
            )
        )
    return dedent(
        f"""
        # 59 Reference Case Corpus

        The Phase 0 reference corpus is the single seeded scenario set used by preview, integration, preprod, and wave-probe verification.

        | Case code | Persona | Channel | Route family | Primary release use | Posture | Simulators | Continuity controls |
        | --- | --- | --- | --- | --- | --- | ---: | --- |
        {"\n".join(rows)}

        ## Reuse Rules

        - The same case IDs and seed object IDs must be reused across preview, integration, preprod, and wave probes.
        - A case may change ring-specific continuity proof or publication tuple, but it may not change canonical aggregate or blocker semantics.
        - Duplicate, blocker, degraded, and recovery scenarios stay first-class and are not optional add-ons.
        """
    ).strip()


def build_cutover_doc(simulator_catalog: list[dict[str, Any]]) -> str:
    rows = []
    for row in simulator_catalog:
        rows.append(
            "| {sim_id} | {dep} | {sim_type} | {cases} | {blocked} | {rollback} |".format(
                sim_id=row["simulatorId"],
                dep=row["dependencyCode"],
                sim_type=row["simulatorType"],
                cases=len(row["supportedReferenceCaseIds"]),
                blocked=len(row["actual_provider_strategy_later"]["blocked_live_gate_ids"]),
                rollback=row["actual_provider_strategy_later"]["rollback_back_to_simulator_strategy"],
            )
        )
    return dedent(
        f"""
        # 59 Mock Now Vs Actual Provider Cutover

        Every simulator-backed dependency now carries one bounded cutover strategy so live onboarding can happen later without rewriting domain truth.

        | Simulator | Primary dependency | Twin type | Supported cases | Blocked live gates | Rollback-to-simulator law |
        | --- | --- | --- | ---: | ---: | --- |
        {"\n".join(rows)}

        ## Cutover Rules

        - Provider onboarding prerequisites and secret classes are explicit before cutover is legal.
        - Mock-now and actual-provider-later must preserve the same aggregate, blocker, settlement, and recovery semantics.
        - Rollback back to the simulator is first-class and immediate when the live tuple drifts or evidence expires.
        """
    ).strip()


def build_fixture_readme(reference_cases: list[dict[str, Any]]) -> str:
    handles = "\n".join(f"- `reference_case::{row['caseCode']}`" for row in reference_cases)
    return dedent(
        f"""
        # Reference Cases

        This directory indexes the canonical Phase 0 reference cases that drive preview environments, integration flows, simulator rehearsals, and release verification.

        ## Rules

        - Fixtures are deterministic and PHI-safe.
        - Case IDs and seed object IDs are stable.
        - No fixture depends on live provider credentials or live external side effects.
        - Simulators remain the legal default until later live onboarding freezes the same domain semantics.

        ## Fixture Handles

        {handles}

        ## Source

        Generated by `tools/analysis/build_seed_data_and_simulator_strategy.py`.
        """
    ).strip()


def build_studio_html() -> str:
    html = dedent(
        """
        <!doctype html>
        <html lang="en">
          <head>
            <meta charset="utf-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1" />
            <title>Seed And Simulator Studio</title>
            <style>
              :root {
                color-scheme: light;
                --canvas: #F7F8FC;
                --rail: #EEF2F8;
                --panel: #FFFFFF;
                --inset: #F4F6FB;
                --text-strong: #0F172A;
                --text-default: #1E293B;
                --text-muted: #667085;
                --border-subtle: #E2E8F0;
                --border-default: #CBD5E1;
                --primary: #3559E6;
                --scenario: #0EA5A4;
                --simulator: #7C3AED;
                --recovery: #0F9D58;
                --warning: #C98900;
                --blocked: #C24141;
                --shadow: 0 18px 36px rgba(15, 23, 42, 0.08);
                --transition-fast: 120ms ease;
                --transition-filter: 180ms ease;
                --transition-panel: 220ms ease;
              }

              * {
                box-sizing: border-box;
              }

              body {
                margin: 0;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
                background:
                  radial-gradient(circle at top left, rgba(53, 89, 230, 0.08), transparent 28%),
                  radial-gradient(circle at top right, rgba(14, 165, 164, 0.06), transparent 24%),
                  var(--canvas);
                color: var(--text-default);
              }

              body[data-reduced-motion="true"] *,
              body[data-reduced-motion="true"] *::before,
              body[data-reduced-motion="true"] *::after {
                animation-duration: 0.001ms !important;
                animation-iteration-count: 1 !important;
                transition-duration: 0.001ms !important;
                scroll-behavior: auto !important;
              }

              a {
                color: inherit;
              }

              .shell {
                max-width: 1500px;
                margin: 0 auto;
                padding: 0 20px 28px;
              }

              header {
                position: sticky;
                top: 0;
                z-index: 20;
                display: flex;
                justify-content: space-between;
                align-items: center;
                min-height: 72px;
                padding: 16px 0;
                backdrop-filter: blur(18px);
                background: rgba(247, 248, 252, 0.92);
                border-bottom: 1px solid rgba(203, 213, 225, 0.7);
              }

              .brand {
                display: flex;
                align-items: center;
                gap: 14px;
              }

              .brand-mark {
                display: grid;
                place-items: center;
                width: 40px;
                height: 40px;
                border-radius: 14px;
                background: linear-gradient(160deg, rgba(53, 89, 230, 0.12), rgba(124, 58, 237, 0.16));
                color: var(--primary);
                font-weight: 700;
                border: 1px solid rgba(53, 89, 230, 0.18);
              }

              .brand-copy h1 {
                margin: 0;
                font-size: 15px;
                letter-spacing: 0.12em;
                text-transform: uppercase;
              }

              .brand-copy p {
                margin: 2px 0 0;
                color: var(--text-muted);
                font-size: 12px;
              }

              .masthead-metrics {
                display: grid;
                grid-template-columns: repeat(4, minmax(110px, 1fr));
                gap: 10px;
              }

              .metric {
                background: rgba(255, 255, 255, 0.82);
                border: 1px solid rgba(203, 213, 225, 0.7);
                border-radius: 16px;
                padding: 10px 12px;
                box-shadow: 0 10px 18px rgba(15, 23, 42, 0.04);
              }

              .metric-label {
                display: block;
                color: var(--text-muted);
                font-size: 11px;
                text-transform: uppercase;
                letter-spacing: 0.08em;
              }

              .metric-value {
                display: block;
                margin-top: 4px;
                color: var(--text-strong);
                font-size: 20px;
                font-weight: 700;
              }

              .layout {
                display: grid;
                grid-template-columns: 300px minmax(0, 1fr) 396px;
                gap: 18px;
                align-items: start;
                margin-top: 22px;
              }

              aside,
              main {
                min-width: 0;
              }

              .panel {
                background: var(--panel);
                border: 1px solid var(--border-default);
                border-radius: 24px;
                box-shadow: var(--shadow);
              }

              .rail {
                padding: 18px;
                background: linear-gradient(180deg, rgba(255, 255, 255, 0.82), rgba(238, 242, 248, 0.88));
              }

              .filter-group + .filter-group {
                margin-top: 16px;
              }

              .filter-group label,
              .section-heading {
                display: block;
                margin-bottom: 8px;
                color: var(--text-muted);
                font-size: 12px;
                font-weight: 600;
                letter-spacing: 0.08em;
                text-transform: uppercase;
              }

              select,
              button,
              .table-row {
                transition: background var(--transition-fast), border-color var(--transition-fast), transform var(--transition-fast);
              }

              select {
                width: 100%;
                min-height: 44px;
                padding: 0 12px;
                border-radius: 14px;
                border: 1px solid var(--border-default);
                background: var(--panel);
                color: var(--text-default);
                font: inherit;
              }

              .filter-note {
                margin-top: 18px;
                padding: 14px;
                border-radius: 18px;
                background: var(--inset);
                border: 1px solid var(--border-subtle);
                color: var(--text-muted);
                font-size: 12px;
                line-height: 1.5;
              }

              .canvas {
                display: grid;
                gap: 18px;
              }

              .diagram-grid {
                display: grid;
                grid-template-columns: repeat(2, minmax(0, 1fr));
                gap: 18px;
                min-height: 620px;
              }

              .diagram-panel {
                padding: 20px;
                display: grid;
                gap: 18px;
                align-content: start;
              }

              .diagram-surface {
                padding: 18px;
                border-radius: 20px;
                background: var(--inset);
                border: 1px solid var(--border-subtle);
                min-height: 260px;
              }

              .flow-track {
                display: grid;
                gap: 12px;
              }

              .flow-node {
                position: relative;
                padding: 14px 16px;
                border-radius: 16px;
                border: 1px solid rgba(53, 89, 230, 0.18);
                background: rgba(53, 89, 230, 0.06);
                color: var(--text-strong);
              }

              .flow-node::after {
                content: "→";
                position: absolute;
                right: 14px;
                top: 50%;
                transform: translateY(-50%);
                color: var(--primary);
                font-weight: 700;
              }

              .flow-node:last-child::after {
                content: "";
              }

              .diagram-table {
                width: 100%;
                border-collapse: collapse;
              }

              .diagram-table th,
              .diagram-table td,
              .data-table th,
              .data-table td {
                text-align: left;
                padding: 10px 12px;
                border-bottom: 1px solid var(--border-subtle);
                vertical-align: top;
                font-size: 12px;
              }

              .diagram-table th,
              .data-table th {
                color: var(--text-muted);
                text-transform: uppercase;
                letter-spacing: 0.06em;
                font-size: 11px;
              }

              .sim-diagram {
                display: grid;
                gap: 12px;
              }

              .sim-node {
                display: grid;
                gap: 6px;
                padding: 14px;
                border-radius: 16px;
                background: rgba(124, 58, 237, 0.07);
                border: 1px solid rgba(124, 58, 237, 0.18);
              }

              .sim-node-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                gap: 8px;
              }

              .badge-row {
                display: flex;
                flex-wrap: wrap;
                gap: 8px;
              }

              .badge {
                display: inline-flex;
                align-items: center;
                gap: 6px;
                padding: 4px 10px;
                border-radius: 999px;
                font-size: 11px;
                font-weight: 600;
                border: 1px solid transparent;
                white-space: nowrap;
              }

              .badge.happy {
                color: var(--recovery);
                background: rgba(15, 157, 88, 0.08);
                border-color: rgba(15, 157, 88, 0.18);
              }

              .badge.degraded {
                color: var(--warning);
                background: rgba(201, 137, 0, 0.12);
                border-color: rgba(201, 137, 0, 0.2);
              }

              .badge.blocked {
                color: var(--blocked);
                background: rgba(194, 65, 65, 0.1);
                border-color: rgba(194, 65, 65, 0.18);
              }

              .badge.recovery {
                color: var(--simulator);
                background: rgba(124, 58, 237, 0.09);
                border-color: rgba(124, 58, 237, 0.18);
              }

              .badge.outline {
                color: var(--text-default);
                border-color: var(--border-default);
                background: var(--panel);
              }

              .case-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
                gap: 14px;
                padding: 18px;
              }

              .case-card {
                min-height: 170px;
                display: grid;
                gap: 12px;
                padding: 18px;
                border-radius: 20px;
                border: 1px solid var(--border-default);
                background: linear-gradient(180deg, rgba(255, 255, 255, 0.92), rgba(244, 246, 251, 0.96));
                cursor: pointer;
              }

              .case-card:hover,
              .case-card:focus-visible,
              .table-row:hover,
              .table-row:focus-visible {
                border-color: rgba(53, 89, 230, 0.34);
                transform: translateY(-1px);
                outline: none;
              }

              .case-card[data-selected="true"],
              .table-row[data-selected="true"] {
                border-color: var(--primary);
                box-shadow: 0 14px 26px rgba(53, 89, 230, 0.16);
              }

              .case-title {
                margin: 0;
                color: var(--text-strong);
                font-size: 16px;
              }

              .case-meta {
                display: flex;
                justify-content: space-between;
                gap: 10px;
                color: var(--text-muted);
                font-size: 12px;
              }

              code,
              .mono {
                font-family: "SFMono-Regular", SFMono-Regular, ui-monospace, Menlo, Consolas, monospace;
              }

              .inspector {
                position: sticky;
                top: 94px;
                padding: 18px;
                display: grid;
                gap: 16px;
              }

              .inspector-card {
                padding: 16px;
                border-radius: 20px;
                background: var(--inset);
                border: 1px solid var(--border-subtle);
              }

              .inspector-title {
                margin: 0 0 8px;
                color: var(--text-strong);
                font-size: 16px;
              }

              .inspector-list {
                margin: 0;
                padding: 0;
                list-style: none;
                display: grid;
                gap: 8px;
                font-size: 13px;
              }

              .inspector-list strong {
                color: var(--text-strong);
              }

              .comparison-grid {
                display: grid;
                gap: 10px;
              }

              .comparison-row {
                display: grid;
                grid-template-columns: 80px 1fr;
                gap: 10px;
                padding: 12px;
                border-radius: 14px;
                border: 1px solid var(--border-subtle);
                background: var(--panel);
              }

              .data-grid {
                display: grid;
                gap: 18px;
              }

              .data-panel {
                padding: 18px;
              }

              .data-table {
                width: 100%;
                border-collapse: collapse;
              }

              .table-row {
                cursor: pointer;
              }

              .defect-strip {
                display: grid;
                gap: 10px;
              }

              .defect-chip {
                padding: 12px 14px;
                border-radius: 16px;
                border: 1px solid var(--border-subtle);
                background: var(--inset);
              }

              @media (max-width: 1180px) {
                .layout {
                  grid-template-columns: 1fr;
                }

                .inspector {
                  position: static;
                }

                .diagram-grid {
                  grid-template-columns: 1fr;
                }
              }
            </style>
          </head>
          <body data-surface-mode="Seed_And_Simulator_Studio">
            <div class="shell">
              <header aria-label="Studio masthead">
                <div class="brand">
                  <div class="brand-mark" aria-hidden="true">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <path d="M7.2 6.2h9.6M7.2 12h9.6M7.2 17.8h9.6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                      <path d="M9 4.8c-2 0-3.5 1-3.5 2.6S7 10 9 10h6c2 0 3.5 1 3.5 2.6S17 15.2 15 15.2H9c-2 0-3.5 1-3.5 2.6S7 20.4 9 20.4" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
                    </svg>
                  </div>
                  <div class="brand-copy">
                    <h1>Vecells</h1>
                    <p>Seed And Simulator Studio</p>
                  </div>
                </div>
                <div class="masthead-metrics" data-testid="masthead-metrics"></div>
              </header>

              <div class="layout">
                <aside class="panel rail" aria-label="Filters">
                  <div class="filter-group">
                    <label for="persona-filter">Persona</label>
                    <select id="persona-filter" data-testid="persona-filter"></select>
                  </div>
                  <div class="filter-group">
                    <label for="channel-filter">Channel</label>
                    <select id="channel-filter" data-testid="channel-filter"></select>
                  </div>
                  <div class="filter-group">
                    <label for="continuity-filter">Continuity Control</label>
                    <select id="continuity-filter" data-testid="continuity-filter"></select>
                  </div>
                  <div class="filter-group">
                    <label for="simulator-filter">Simulator</label>
                    <select id="simulator-filter" data-testid="simulator-filter"></select>
                  </div>
                  <div class="filter-group">
                    <label for="posture-filter">Posture Class</label>
                    <select id="posture-filter" data-testid="posture-filter"></select>
                  </div>
                  <div class="filter-note" data-testid="filter-note">
                    Curated Phase 0 gallery. Filters change the visible case corpus, simulator perimeter, and seed truth tables together.
                  </div>
                </aside>

                <main class="canvas">
                  <section class="diagram-grid">
                    <section class="panel diagram-panel">
                      <div>
                        <span class="section-heading">Case Flow Map</span>
                        <div class="diagram-surface" data-testid="case-flow-map"></div>
                      </div>
                      <table class="diagram-table" data-testid="case-flow-parity-table">
                        <thead>
                          <tr><th>Axis transition</th><th>Meaning</th></tr>
                        </thead>
                        <tbody></tbody>
                      </table>
                    </section>

                    <section class="panel diagram-panel">
                      <div>
                        <span class="section-heading">Simulator Boundary Diagram</span>
                        <div class="diagram-surface" data-testid="simulator-boundary-diagram"></div>
                      </div>
                      <table class="diagram-table" data-testid="simulator-parity-table">
                        <thead>
                          <tr><th>Simulator</th><th>Dependency</th><th>Type</th></tr>
                        </thead>
                        <tbody></tbody>
                      </table>
                    </section>
                  </section>

                  <section class="panel">
                    <div class="case-grid" data-testid="case-grid"></div>
                  </section>

                  <section class="data-grid">
                    <section class="panel data-panel">
                      <div class="section-heading">Seed Dataset Matrix</div>
                      <table class="data-table" data-testid="seed-matrix-table">
                        <thead>
                          <tr>
                            <th>Seed object</th>
                            <th>Type</th>
                            <th>State</th>
                            <th>Truth refs</th>
                          </tr>
                        </thead>
                        <tbody></tbody>
                      </table>
                    </section>

                    <section class="panel data-panel">
                      <div class="section-heading">Fault Injection Matrix</div>
                      <table class="data-table" data-testid="fault-matrix-table">
                        <thead>
                          <tr>
                            <th>Simulator</th>
                            <th>Fault mode</th>
                            <th>Expected effect</th>
                          </tr>
                        </thead>
                        <tbody></tbody>
                      </table>
                    </section>

                    <section class="panel data-panel">
                      <div class="section-heading">Continuity Control Matrix</div>
                      <table class="data-table" data-testid="continuity-matrix-table">
                        <thead>
                          <tr>
                            <th>Control</th>
                            <th>Coverage ref</th>
                            <th>Goal</th>
                          </tr>
                        </thead>
                        <tbody></tbody>
                      </table>
                    </section>

                    <section class="panel data-panel">
                      <div class="section-heading">Defect Strip</div>
                      <div class="defect-strip" data-testid="defect-strip"></div>
                    </section>
                  </section>
                </main>

                <aside class="panel inspector" data-testid="inspector" aria-label="Inspector"></aside>
              </div>
            </div>

            <script type="module">
              const PATHS = {
                referenceCase: "__REFERENCE_CASE_PATH__",
                simulatorCatalog: "__SIMULATOR_CATALOG_PATH__",
                seedMatrix: "__SEED_MATRIX_PATH__",
                faultMatrix: "__FAULT_MATRIX_PATH__",
                continuityMatrix: "__CONTINUITY_MATRIX_PATH__",
              };

              const state = {
                persona: "all",
                channel: "all",
                continuity: "all",
                simulator: "all",
                posture: "all",
                selectedCaseId: null,
                selectedSeedRowId: null,
                selectedFaultRowId: null,
                selectedContinuityRowId: null,
              };

              const elements = {
                masthead: document.querySelector("[data-testid='masthead-metrics']"),
                personaFilter: document.querySelector("[data-testid='persona-filter']"),
                channelFilter: document.querySelector("[data-testid='channel-filter']"),
                continuityFilter: document.querySelector("[data-testid='continuity-filter']"),
                simulatorFilter: document.querySelector("[data-testid='simulator-filter']"),
                postureFilter: document.querySelector("[data-testid='posture-filter']"),
                caseGrid: document.querySelector("[data-testid='case-grid']"),
                caseFlowMap: document.querySelector("[data-testid='case-flow-map']"),
                caseFlowParity: document.querySelector("[data-testid='case-flow-parity-table'] tbody"),
                simulatorDiagram: document.querySelector("[data-testid='simulator-boundary-diagram']"),
                simulatorParity: document.querySelector("[data-testid='simulator-parity-table'] tbody"),
                seedTable: document.querySelector("[data-testid='seed-matrix-table'] tbody"),
                faultTable: document.querySelector("[data-testid='fault-matrix-table'] tbody"),
                continuityTable: document.querySelector("[data-testid='continuity-matrix-table'] tbody"),
                defectStrip: document.querySelector("[data-testid='defect-strip']"),
                inspector: document.querySelector("[data-testid='inspector']"),
              };

              const postureClasses = ["happy", "degraded", "blocked", "recovery"];

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

              function uniqueSorted(values) {
                return [...new Set(values.filter(Boolean))].sort((left, right) => left.localeCompare(right));
              }

              function optionMarkup(value, label) {
                return `<option value="${value}">${label}</option>`;
              }

              function postureBadge(value, label = value) {
                return `<span class="badge ${value}">${label.replaceAll("_", " ")}</span>`;
              }

              function outlineBadge(label) {
                return `<span class="badge outline">${label}</span>`;
              }

              function splitList(value) {
                return value ? value.split("; ").filter(Boolean) : [];
              }

              function populateFilters(data) {
                const personaOptions = ["all", ...uniqueSorted(data.referenceCases.map((item) => item.persona))];
                const channelOptions = ["all", ...uniqueSorted(data.referenceCases.map((item) => item.channelProfile))];
                const continuityOptions = [
                  "all",
                  ...uniqueSorted(
                    data.referenceCases.flatMap((item) => item.requiredContinuityControlRefs),
                  ),
                ];
                const simulatorOptions = [
                  "all",
                  ...uniqueSorted(data.referenceCases.flatMap((item) => item.requiredSimulatorRefs)),
                ];
                const postureOptions = ["all", ...postureClasses];

                elements.personaFilter.innerHTML = personaOptions
                  .map((value) => optionMarkup(value, value === "all" ? "All personas" : value))
                  .join("");
                elements.channelFilter.innerHTML = channelOptions
                  .map((value) => optionMarkup(value, value === "all" ? "All channels" : value))
                  .join("");
                elements.continuityFilter.innerHTML = continuityOptions
                  .map((value) => optionMarkup(value, value === "all" ? "All continuity controls" : value))
                  .join("");
                elements.simulatorFilter.innerHTML = simulatorOptions
                  .map((value) => optionMarkup(value, value === "all" ? "All simulators" : value))
                  .join("");
                elements.postureFilter.innerHTML = postureOptions
                  .map((value) => optionMarkup(value, value === "all" ? "All posture classes" : value))
                  .join("");
              }

              function filteredCases(data) {
                return data.referenceCases.filter((item) => {
                  if (state.persona !== "all" && item.persona !== state.persona) return false;
                  if (state.channel !== "all" && item.channelProfile !== state.channel) return false;
                  if (
                    state.continuity !== "all" &&
                    !item.requiredContinuityControlRefs.includes(state.continuity)
                  ) {
                    return false;
                  }
                  if (
                    state.simulator !== "all" &&
                    !item.requiredSimulatorRefs.includes(state.simulator)
                  ) {
                    return false;
                  }
                  if (state.posture !== "all" && item.postureClass !== state.posture) return false;
                  return true;
                });
              }

              function ensureSelection(cases) {
                if (!cases.length) {
                  state.selectedCaseId = null;
                  return null;
                }
                const selected = cases.find((item) => item.referenceCaseId === state.selectedCaseId);
                if (selected) {
                  return selected;
                }
                state.selectedCaseId = cases[0].referenceCaseId;
                return cases[0];
              }

              function simulatorLookup(simulators) {
                return Object.fromEntries(simulators.map((item) => [item.simulatorId, item]));
              }

              function renderMasthead(cases) {
                const simulatorCount = uniqueSorted(
                  cases.flatMap((item) => item.requiredSimulatorRefs),
                ).length;
                const continuityCount = uniqueSorted(
                  cases.flatMap((item) => item.requiredContinuityControlRefs),
                ).length;
                const degradedCount = cases.filter((item) => item.postureClass === "degraded").length;
                const metrics = [
                  ["Reference cases", String(cases.length)],
                  ["Simulators", String(simulatorCount)],
                  ["Degraded cases", String(degradedCount)],
                  ["Continuity controls", String(continuityCount)],
                ];
                elements.masthead.innerHTML = metrics
                  .map(
                    ([label, value]) => `
                      <div class="metric">
                        <span class="metric-label">${label}</span>
                        <span class="metric-value">${value}</span>
                      </div>
                    `,
                  )
                  .join("");
              }

              function renderCaseCards(cases) {
                elements.caseGrid.innerHTML = cases
                  .map(
                    (item) => `
                      <button
                        type="button"
                        class="case-card"
                        data-testid="case-card-${item.referenceCaseId}"
                        data-case-id="${item.referenceCaseId}"
                        data-selected="${String(item.referenceCaseId === state.selectedCaseId)}"
                      >
                        <div class="case-meta">
                          <span class="mono">${item.caseCode}</span>
                          ${postureBadge(item.postureClass)}
                        </div>
                        <h2 class="case-title">${item.title}</h2>
                        <div class="case-meta">
                          <span>${item.persona}</span>
                          <span>${item.releaseVerificationUse}</span>
                        </div>
                        <div class="badge-row">
                          ${item.requiredContinuityControlRefs.map((value) => outlineBadge(value)).join("")}
                        </div>
                        <div class="case-meta">
                          <span>${item.requiredSimulatorRefs.length} simulators</span>
                          <span>${item.routeFamily}</span>
                        </div>
                      </button>
                    `,
                  )
                  .join("");

                elements.caseGrid.querySelectorAll("[data-case-id]").forEach((button) => {
                  button.addEventListener("click", () => {
                    state.selectedCaseId = button.getAttribute("data-case-id");
                    renderAll(window.__studioData);
                  });
                  button.addEventListener("keydown", (event) => {
                    if (!["ArrowDown", "ArrowUp"].includes(event.key)) return;
                    event.preventDefault();
                    const visible = [...elements.caseGrid.querySelectorAll("[data-case-id]")];
                    const index = visible.indexOf(button);
                    const nextIndex =
                      event.key === "ArrowDown"
                        ? Math.min(index + 1, visible.length - 1)
                        : Math.max(index - 1, 0);
                    const target = visible[nextIndex];
                    if (!target) return;
                    state.selectedCaseId = target.getAttribute("data-case-id");
                    renderAll(window.__studioData);
                    requestAnimationFrame(() => target.focus());
                  });
                });
              }

              function renderCaseFlow(selectedCase) {
                elements.caseFlowMap.innerHTML = `
                  <div class="flow-track">
                    ${selectedCase.expectedStateAxisTransitions
                      .map(
                        (value, index) => `
                          <div class="flow-node" data-testid="flow-node-${index}">
                            <div class="mono">${value}</div>
                          </div>
                        `,
                      )
                      .join("")}
                  </div>
                `;
                elements.caseFlowParity.innerHTML = selectedCase.expectedStateAxisTransitions
                  .map(
                    (value) => `
                      <tr>
                        <td class="mono">${value}</td>
                        <td>Case flow remains tied to the current aggregate and recovery tuple.</td>
                      </tr>
                    `,
                  )
                  .join("");
              }

              function renderSimulatorDiagram(selectedCase, simulators) {
                const selectedSimulators = selectedCase.requiredSimulatorRefs.map((id) => simulators[id]);
                elements.simulatorDiagram.innerHTML = `
                  <div class="sim-diagram">
                    ${selectedSimulators
                      .map(
                        (item) => `
                          <div class="sim-node" data-testid="sim-node-${item.simulatorId}">
                            <div class="sim-node-header">
                              <strong class="mono">${item.simulatorId}</strong>
                              ${outlineBadge(item.simulatorType)}
                            </div>
                            <div>${item.dependencyCode}</div>
                            <div class="badge-row">
                              ${outlineBadge("Mock now")}
                              ${outlineBadge("Actual later")}
                            </div>
                          </div>
                        `,
                      )
                      .join("")}
                  </div>
                `;
                elements.simulatorParity.innerHTML = selectedSimulators
                  .map(
                    (item) => `
                      <tr>
                        <td class="mono">${item.simulatorId}</td>
                        <td class="mono">${item.dependencyCode}</td>
                        <td>${item.simulatorType}</td>
                      </tr>
                    `,
                  )
                  .join("");
              }

              function renderInspector(selectedCase, simulators) {
                const selectedSimulators = selectedCase.requiredSimulatorRefs.map((id) => simulators[id]);
                elements.inspector.innerHTML = `
                  <section class="inspector-card">
                    <span class="section-heading">Selected Reference Case</span>
                    <h2 class="inspector-title">${selectedCase.title}</h2>
                    <ul class="inspector-list">
                      <li><strong>Case</strong> <span class="mono">${selectedCase.caseCode}</span></li>
                      <li><strong>Route</strong> <span class="mono">${selectedCase.routeFamily}</span></li>
                      <li><strong>Release use</strong> ${selectedCase.releaseVerificationUse}</li>
                      <li><strong>Verification scenario</strong> <span class="mono">${selectedCase.releaseVerificationScenarioRef}</span></li>
                      <li><strong>Manifest</strong> <span class="mono">${selectedCase.surfaceManifestRef}</span></li>
                    </ul>
                  </section>
                  <section class="inspector-card">
                    <span class="section-heading">Seed Objects</span>
                    <div>${selectedCase.requiredSeedObjects.length} seeded objects are pinned to this case.</div>
                    <div class="badge-row" style="margin-top:10px;">
                      ${selectedCase.requiredContinuityControlRefs.map((value) => outlineBadge(value)).join("")}
                    </div>
                  </section>
                  <section class="inspector-card">
                    <span class="section-heading">Simulator Bindings</span>
                    <ul class="inspector-list">
                      ${selectedSimulators
                        .map(
                          (item) => `
                            <li>
                              <strong class="mono">${item.simulatorId}</strong>
                              <span class="mono">${item.dependencyCode}</span>
                            </li>
                          `,
                        )
                        .join("")}
                    </ul>
                  </section>
                  <section class="inspector-card">
                    <span class="section-heading">Mock Now Vs Actual Later</span>
                    <div class="comparison-grid" data-testid="mock-live-comparison">
                      ${selectedSimulators
                        .map(
                          (item) => `
                            <div class="comparison-row">
                              <div class="mono">${item.dependencyCode}</div>
                              <div>
                                <div><strong>Mock now:</strong> ${item.mock_now_execution.side_effect_posture}</div>
                                <div><strong>Actual later:</strong> ${item.actual_provider_strategy_later.semantic_preservation_rules[0] ?? "Semantics stay identical."}</div>
                                <div><strong>Rollback:</strong> ${item.actual_provider_strategy_later.rollback_back_to_simulator_strategy}</div>
                              </div>
                            </div>
                          `,
                        )
                        .join("")}
                    </div>
                  </section>
                `;
              }

              function attachRowNavigation(container, stateKey, testIdPrefix) {
                const rows = [...container.querySelectorAll("[data-row-id]")];
                rows.forEach((row, index) => {
                  row.addEventListener("click", () => {
                    state[stateKey] = row.getAttribute("data-row-id");
                    renderAll(window.__studioData);
                  });
                  row.addEventListener("keydown", (event) => {
                    if (!["ArrowDown", "ArrowUp"].includes(event.key)) return;
                    event.preventDefault();
                    const nextIndex =
                      event.key === "ArrowDown"
                        ? Math.min(index + 1, rows.length - 1)
                        : Math.max(index - 1, 0);
                    const target = rows[nextIndex];
                    if (!target) return;
                    state[stateKey] = target.getAttribute("data-row-id");
                    renderAll(window.__studioData);
                    requestAnimationFrame(() => target.focus());
                  });
                });
              }

              function renderDataTableRows(rows, container, selectedId, idField, columns, testIdPrefix) {
                container.innerHTML = rows
                  .map(
                    (row) => `
                      <tr
                        class="table-row"
                        data-testid="${testIdPrefix}-${row[idField]}"
                        data-row-id="${row[idField]}"
                        data-selected="${String(row[idField] === selectedId)}"
                        tabindex="0"
                      >
                        ${columns.map((column) => `<td>${row[column]}</td>`).join("")}
                      </tr>
                    `,
                  )
                  .join("");
                attachRowNavigation(container, selectedId === state.selectedSeedRowId ? "selectedSeedRowId" : selectedId === state.selectedFaultRowId ? "selectedFaultRowId" : "selectedContinuityRowId", testIdPrefix);
              }

              function renderSeedTable(selectedCase, seedRows) {
                const rows = seedRows.filter((row) => row.reference_case_id === selectedCase.referenceCaseId);
                if (!state.selectedSeedRowId || !rows.find((row) => row.seed_object_id === state.selectedSeedRowId)) {
                  state.selectedSeedRowId = rows[0]?.seed_object_id ?? null;
                }
                elements.seedTable.innerHTML = rows
                  .map(
                    (row) => `
                      <tr
                        class="table-row"
                        data-testid="seed-row-${row.seed_object_id}"
                        data-row-id="${row.seed_object_id}"
                        data-selected="${String(row.seed_object_id === state.selectedSeedRowId)}"
                        tabindex="0"
                      >
                        <td class="mono">${row.seed_object_id}</td>
                        <td>${row.object_type}</td>
                        <td>${row.seed_state}</td>
                        <td>${row.canonical_truth_refs}</td>
                      </tr>
                    `,
                  )
                  .join("");
                attachRowNavigation(elements.seedTable, "selectedSeedRowId", "seed-row");
              }

              function renderFaultTable(selectedCase, faultRows) {
                const rows = faultRows.filter((row) => row.reference_case_id === selectedCase.referenceCaseId);
                if (!state.selectedFaultRowId || !rows.find((row) => row.fault_injection_id === state.selectedFaultRowId)) {
                  state.selectedFaultRowId = rows[0]?.fault_injection_id ?? null;
                }
                elements.faultTable.innerHTML = rows
                  .map(
                    (row) => `
                      <tr
                        class="table-row"
                        data-testid="fault-row-${row.fault_injection_id}"
                        data-row-id="${row.fault_injection_id}"
                        data-selected="${String(row.fault_injection_id === state.selectedFaultRowId)}"
                        tabindex="0"
                      >
                        <td class="mono">${row.simulator_id}</td>
                        <td>${row.fault_mode}</td>
                        <td>${row.expected_effect}</td>
                      </tr>
                    `,
                  )
                  .join("");
                attachRowNavigation(elements.faultTable, "selectedFaultRowId", "fault-row");
              }

              function renderContinuityTable(selectedCase, continuityRows) {
                const rows = continuityRows.filter((row) => row.reference_case_id === selectedCase.referenceCaseId);
                if (
                  !state.selectedContinuityRowId ||
                  !rows.find((row) => row.continuity_coverage_record_ref === state.selectedContinuityRowId)
                ) {
                  state.selectedContinuityRowId = rows[0]?.continuity_coverage_record_ref ?? null;
                }
                elements.continuityTable.innerHTML = rows
                  .map(
                    (row) => `
                      <tr
                        class="table-row"
                        data-testid="continuity-row-${row.continuity_coverage_record_ref}"
                        data-row-id="${row.continuity_coverage_record_ref}"
                        data-selected="${String(
                          row.continuity_coverage_record_ref === state.selectedContinuityRowId,
                        )}"
                        tabindex="0"
                      >
                        <td>${row.continuity_control_code}</td>
                        <td class="mono">${row.continuity_coverage_record_ref}</td>
                        <td>${row.validation_goal}</td>
                      </tr>
                    `,
                  )
                  .join("");
                attachRowNavigation(elements.continuityTable, "selectedContinuityRowId", "continuity-row");
              }

              function renderDefects(selectedCase) {
                const caseSpecific = [
                  `${selectedCase.caseCode} binds ${selectedCase.requiredSimulatorRefs.length} simulators to ${selectedCase.requiredContinuityControlRefs.length} continuity controls.`,
                  `Release use ${selectedCase.releaseVerificationUse} is pinned to ${selectedCase.releaseVerificationScenarioRef}.`,
                ];
                elements.defectStrip.innerHTML = [
                  ...window.__studioData.casePack.defects.map(
                    (item) => `<div class="defect-chip"><strong>${item.defectId}</strong><div>${item.statement}</div></div>`,
                  ),
                  ...caseSpecific.map((value) => `<div class="defect-chip">${value}</div>`),
                ].join("");
              }

              function renderAll(data) {
                const cases = filteredCases(data.casePack);
                const selectedCase = ensureSelection(cases);
                renderMasthead(cases);
                renderCaseCards(cases);
                if (!selectedCase) {
                  elements.caseFlowMap.innerHTML = "<p>No cases match the current filters.</p>";
                  elements.simulatorDiagram.innerHTML = "<p>No simulators in scope.</p>";
                  elements.inspector.innerHTML = "<p>No case selected.</p>";
                  elements.seedTable.innerHTML = "";
                  elements.faultTable.innerHTML = "";
                  elements.continuityTable.innerHTML = "";
                  elements.defectStrip.innerHTML = "";
                  return;
                }

                const simulators = simulatorLookup(data.simulatorPack.simulators);
                renderCaseFlow(selectedCase);
                renderSimulatorDiagram(selectedCase, simulators);
                renderInspector(selectedCase, simulators);
                renderSeedTable(selectedCase, data.seedRows);
                renderFaultTable(selectedCase, data.faultRows);
                renderContinuityTable(selectedCase, data.continuityRows);
                renderDefects(selectedCase);
              }

              async function loadData() {
                const [casePack, simulatorPack, seedCsv, faultCsv, continuityCsv] = await Promise.all([
                  fetch(PATHS.referenceCase).then((response) => response.json()),
                  fetch(PATHS.simulatorCatalog).then((response) => response.json()),
                  fetch(PATHS.seedMatrix).then((response) => response.text()),
                  fetch(PATHS.faultMatrix).then((response) => response.text()),
                  fetch(PATHS.continuityMatrix).then((response) => response.text()),
                ]);
                return {
                  casePack,
                  simulatorPack,
                  seedRows: parseCsv(seedCsv),
                  faultRows: parseCsv(faultCsv),
                  continuityRows: parseCsv(continuityCsv),
                };
              }

              async function main() {
                document.body.dataset.reducedMotion = String(
                  window.matchMedia("(prefers-reduced-motion: reduce)").matches,
                );
                const data = await loadData();
                window.__studioData = data;
                populateFilters(data.casePack);
                [
                  ["personaFilter", "persona"],
                  ["channelFilter", "channel"],
                  ["continuityFilter", "continuity"],
                  ["simulatorFilter", "simulator"],
                  ["postureFilter", "posture"],
                ].forEach(([elementKey, stateKey]) => {
                  elements[elementKey].addEventListener("change", (event) => {
                    state[stateKey] = event.target.value;
                    renderAll(data);
                  });
                });
                renderAll(data);
              }

              main().catch((error) => {
                console.error(error);
                document.body.innerHTML = `<pre>${error.stack}</pre>`;
              });
            </script>
          </body>
        </html>
        """
    ).strip()
    return (
        html.replace("__REFERENCE_CASE_PATH__", "../../data/analysis/reference_case_catalog.json")
        .replace("__SIMULATOR_CATALOG_PATH__", "../../data/analysis/simulator_contract_catalog.json")
        .replace("__SEED_MATRIX_PATH__", "../../data/analysis/seed_dataset_matrix.csv")
        .replace("__FAULT_MATRIX_PATH__", "../../data/analysis/simulator_fault_injection_matrix.csv")
        .replace(
            "__CONTINUITY_MATRIX_PATH__",
            "../../data/analysis/reference_case_to_continuity_control_matrix.csv",
        )
    )


def build_validator() -> str:
    return dedent(
        """
        #!/usr/bin/env python3
        from __future__ import annotations

        import csv
        import json
        from pathlib import Path


        ROOT = Path(__file__).resolve().parents[2]
        DATA_DIR = ROOT / "data" / "analysis"

        REFERENCE_CASE_PATH = DATA_DIR / "reference_case_catalog.json"
        SEED_MATRIX_PATH = DATA_DIR / "seed_dataset_matrix.csv"
        SIMULATOR_CATALOG_PATH = DATA_DIR / "simulator_contract_catalog.json"
        FAULT_MATRIX_PATH = DATA_DIR / "simulator_fault_injection_matrix.csv"
        CONTINUITY_MATRIX_PATH = DATA_DIR / "reference_case_to_continuity_control_matrix.csv"

        REQUIRED_CASE_CODES = {
            "clean_self_service_submit",
            "duplicate_retry_return_prior_accepted",
            "duplicate_collision_open_review",
            "fallback_review_after_accepted_progress_degrades",
            "wrong_patient_identity_repair_hold",
            "urgent_diversion_required_then_issued",
            "telephony_urgent_live_only_capture",
            "telephony_seeded_vs_challenge_continuation",
            "booking_confirmation_pending_ambiguity",
            "pharmacy_dispatch_proof_pending_weak_match",
            "support_replay_restore_same_shell_recovery",
        }
        REQUIRED_SIMULATORS = {
            "sim_nhs_login_auth_session_twin",
            "sim_im1_principal_system_emis_twin",
            "sim_im1_principal_system_tpp_twin",
            "sim_mesh_message_path_twin",
            "sim_telephony_ivr_twin",
            "sim_email_notification_twin",
            "sim_sms_delivery_twin",
        }
        REQUIRED_FAULTS = {
            "timeout",
            "replay",
            "duplicate",
            "stale_callback",
            "disputed_receipt",
            "ordering_inversion",
            "partial_outage",
        }
        REQUIRED_CONTROLS = {
            "patient_nav",
            "more_info_reply",
            "conversation_settlement",
            "intake_resume",
            "booking_manage",
            "hub_booking_manage",
            "support_replay_restore",
            "workspace_task_completion",
            "pharmacy_console_settlement",
        }


        def read_json(path: Path):
            return json.loads(path.read_text())


        def read_csv(path: Path):
            with path.open() as handle:
                return list(csv.DictReader(handle))


        def require(condition: bool, message: str) -> None:
            if not condition:
                raise SystemExit(message)


        def main() -> None:
            case_pack = read_json(REFERENCE_CASE_PATH)
            simulator_pack = read_json(SIMULATOR_CATALOG_PATH)
            seed_rows = read_csv(SEED_MATRIX_PATH)
            fault_rows = read_csv(FAULT_MATRIX_PATH)
            continuity_rows = read_csv(CONTINUITY_MATRIX_PATH)

            reference_cases = case_pack["referenceCases"]
            simulators = simulator_pack["simulators"]

            require(case_pack["summary"]["reference_case_count"] == 11, "Reference case count drifted.")
            require(
                {row["caseCode"] for row in reference_cases} == REQUIRED_CASE_CODES,
                "Required Phase 0 reference cases drifted.",
            )
            require(
                REQUIRED_SIMULATORS.issubset({row["simulatorId"] for row in simulators}),
                "Simulator coverage drifted below the required Phase 0 boundaries.",
            )
            require(
                REQUIRED_FAULTS.issubset({row["fault_mode"] for row in fault_rows}),
                "Fault injection coverage lost a mandatory fault mode.",
            )
            require(
                REQUIRED_CONTROLS.issubset({row["continuity_control_code"] for row in continuity_rows}),
                "Continuity-control matrix no longer covers the required families.",
            )
            require(
                {row["releaseVerificationUse"] for row in reference_cases}
                == {"preview", "integration", "preprod", "wave_probe"},
                "Release verification reuse no longer covers every required ring-facing mode.",
            )

            seed_ids = {row["seed_object_id"] for row in seed_rows}
            simulator_ids = {row["simulatorId"] for row in simulators}
            continuity_refs = {row["continuity_coverage_record_ref"] for row in continuity_rows}

            for row in reference_cases:
                require(row["requiredSeedObjects"], f"{row['referenceCaseId']} lost seed objects.")
                require(row["requiredSimulatorRefs"], f"{row['referenceCaseId']} lost simulator refs.")
                require(
                    row["requiredContinuityControlRefs"],
                    f"{row['referenceCaseId']} lost continuity control refs.",
                )
                for seed_ref in row["requiredSeedObjects"]:
                    require(seed_ref in seed_ids, f"{row['referenceCaseId']} references unknown seed row {seed_ref}.")
                for simulator_ref in row["requiredSimulatorRefs"]:
                    require(
                        simulator_ref in simulator_ids,
                        f"{row['referenceCaseId']} references unknown simulator {simulator_ref}.",
                    )
                for continuity_ref in row["continuityCoverageRecordRefs"]:
                    require(
                        continuity_ref in continuity_refs,
                        f"{row['referenceCaseId']} references unknown continuity coverage {continuity_ref}.",
                    )

            live_credential_rows = [
                row for row in seed_rows if row["requires_live_credentials"].strip().lower() != "no"
            ]
            require(
                not live_credential_rows,
                "Seed matrix drifted into live credential or live side-effect dependence.",
            )

            for simulator in simulators:
                require(
                    simulator["mock_now_execution"]["fault_injection"],
                    f"{simulator['simulatorId']} lost fault injection coverage.",
                )
                require(
                    simulator["actual_provider_strategy_later"]["secret_classes"],
                    f"{simulator['simulatorId']} lost secret class documentation.",
                )
                require(
                    simulator["actual_provider_strategy_later"]["semantic_preservation_rules"],
                    f"{simulator['simulatorId']} lost semantic preservation rules.",
                )

            for control in REQUIRED_CONTROLS:
                require(
                    any(row["continuity_control_code"] == control for row in continuity_rows),
                    f"Continuity control {control} lost case coverage.",
                )

            print("seq_059 seed and simulator strategy validation passed")


        if __name__ == "__main__":
            main()
        """
    ).strip()


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
        const HTML_PATH = path.join(ROOT, "docs", "architecture", "59_seed_and_simulator_studio.html");
        const CASE_PATH = path.join(ROOT, "data", "analysis", "reference_case_catalog.json");
        const SIMULATOR_PATH = path.join(ROOT, "data", "analysis", "simulator_contract_catalog.json");
        const FAULT_PATH = path.join(ROOT, "data", "analysis", "simulator_fault_injection_matrix.csv");

        const CASE_PAYLOAD = JSON.parse(fs.readFileSync(CASE_PATH, "utf8"));
        const SIMULATOR_PAYLOAD = JSON.parse(fs.readFileSync(SIMULATOR_PATH, "utf8"));

        export const seedAndSimulatorCoverage = [
          "persona filtering",
          "channel filtering",
          "simulator filtering",
          "case-card selection",
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
                rawUrl === "/" ? "/docs/architecture/59_seed_and_simulator_studio.html" : rawUrl.split("?")[0];
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
            server.listen(4359, "127.0.0.1", () => resolve(server));
          });
        }

        async function run() {
          assertCondition(fs.existsSync(HTML_PATH), `Missing studio HTML: ${HTML_PATH}`);
          const faultRows = parseCsv(fs.readFileSync(FAULT_PATH, "utf8"));
          const { chromium } = await importPlaywright();
          const server = await startStaticServer();
          const browser = await chromium.launch({ headless: true });
          const page = await browser.newPage({ viewport: { width: 1460, height: 1180 } });
          const url =
            process.env.SEED_AND_SIMULATOR_STUDIO_URL ??
            "http://127.0.0.1:4359/docs/architecture/59_seed_and_simulator_studio.html";

          try {
            await page.goto(url, { waitUntil: "networkidle" });
            await page.locator("[data-testid='case-flow-map']").waitFor();
            await page.locator("[data-testid='simulator-boundary-diagram']").waitFor();
            await page.locator("[data-testid='inspector']").waitFor();

            const initialCards = await page.locator("[data-testid^='case-card-']").count();
            assertCondition(
              initialCards === CASE_PAYLOAD.referenceCases.length,
              `Reference case count drifted: expected ${CASE_PAYLOAD.referenceCases.length}, found ${initialCards}`,
            );

            await page.locator("[data-testid='persona-filter']").selectOption("support_operator");
            const supportCards = await page.locator("[data-testid^='case-card-']").count();
            assertCondition(supportCards === 3, `Expected 3 support_operator cases, found ${supportCards}`);

            await page.locator("[data-testid='persona-filter']").selectOption("all");
            await page.locator("[data-testid='channel-filter']").selectOption("telephony_ivr");
            const telephonyCards = await page.locator("[data-testid^='case-card-']").count();
            assertCondition(telephonyCards === 2, `Expected 2 telephony_ivr cases, found ${telephonyCards}`);

            await page.locator("[data-testid='channel-filter']").selectOption("all");
            await page
              .locator("[data-testid='simulator-filter']")
              .selectOption("sim_pharmacy_dispatch_transport_twin");
            const pharmacyCards = await page.locator("[data-testid^='case-card-']").count();
            assertCondition(pharmacyCards === 1, `Expected 1 pharmacy dispatch case, found ${pharmacyCards}`);

            const selectedCase = CASE_PAYLOAD.referenceCases.find(
              (item) => item.referenceCaseId === "RC_059_PHARMACY_DISPATCH_WEAK_MATCH_V1",
            );
            assertCondition(Boolean(selectedCase), "Expected pharmacy dispatch reference case to exist.");
            await page
              .locator("[data-testid='case-card-RC_059_PHARMACY_DISPATCH_WEAK_MATCH_V1']")
              .click();
            const inspectorText = await page.locator("[data-testid='inspector']").innerText();
            assertCondition(
              inspectorText.includes("pharmacy_dispatch_proof_pending_weak_match") &&
                inspectorText.includes("sim_pharmacy_dispatch_transport_twin"),
              "Inspector lost the selected pharmacy dispatch case details.",
            );

            const simNodes = await page.locator("[data-testid^='sim-node-']").count();
            assertCondition(
              simNodes === selectedCase.requiredSimulatorRefs.length,
              `Simulator diagram drifted: expected ${selectedCase.requiredSimulatorRefs.length}, found ${simNodes}`,
            );
            const simParityRows = await page.locator("[data-testid='simulator-parity-table'] tbody tr").count();
            assertCondition(
              simParityRows === selectedCase.requiredSimulatorRefs.length,
              "Simulator diagram and parity table drifted.",
            );

            const flowNodes = await page.locator("[data-testid^='flow-node-']").count();
            const flowParityRows = await page.locator("[data-testid='case-flow-parity-table'] tbody tr").count();
            assertCondition(flowNodes === flowParityRows, "Case flow map and parity table drifted.");

            const expectedFaultRows = faultRows.filter(
              (row) => row.reference_case_id === "RC_059_PHARMACY_DISPATCH_WEAK_MATCH_V1",
            );
            const visibleFaultRows = await page.locator("[data-testid^='fault-row-']").count();
            assertCondition(
              visibleFaultRows === expectedFaultRows.length,
              `Expected ${expectedFaultRows.length} fault rows, found ${visibleFaultRows}`,
            );

            await page.locator("[data-testid='simulator-filter']").selectOption("all");
            await page.locator("[data-testid='case-card-RC_059_CLEAN_SELF_SERVICE_SUBMIT_V1']").focus();
            await page.keyboard.press("ArrowDown");
            const nextSelected = await page
              .locator("[data-testid='case-card-RC_059_DUPLICATE_RETRY_COLLAPSE_V1']")
              .getAttribute("data-selected");
            assertCondition(nextSelected === "true", "Arrow-down navigation no longer advances case selection.");

            await page.locator("[data-testid^='fault-row-']").first().focus();
            await page.keyboard.press("ArrowDown");
            const secondFaultSelected = await page
              .locator("[data-testid^='fault-row-']")
              .nth(1)
              .getAttribute("data-selected");
            assertCondition(secondFaultSelected === "true", "Table-row arrow navigation no longer advances selection.");

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
            assertCondition(landmarks >= 8, `Expected multiple landmarks, found ${landmarks}`);
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

        export const seedAndSimulatorManifest = {
          task: CASE_PAYLOAD.task_id,
          referenceCases: CASE_PAYLOAD.summary.reference_case_count,
          simulators: SIMULATOR_PAYLOAD.summary.simulator_count,
        };
        """
    ).strip()


def update_root_package() -> None:
    package = read_json(ROOT_PACKAGE_PATH)
    package.setdefault("scripts", {}).update(ROOT_SCRIPT_UPDATES)
    write_json(ROOT_PACKAGE_PATH, package)


def update_playwright_package() -> None:
    package = read_json(PLAYWRIGHT_PACKAGE_PATH)
    package["description"] = (
        "Foundation, runtime topology, gateway, event, FHIR, frontend manifest, release parity, "
        "design contract, audit ledger, scope/isolation, lifecycle coordinator, scoped mutation gate, "
        "adapter contract, verification ladder, and seed/simulator browser checks."
    )
    package["scripts"] = PLAYWRIGHT_SCRIPT_UPDATES
    write_json(PLAYWRIGHT_PACKAGE_PATH, package)


def patch_verification_builder() -> None:
    text = VERIFICATION_BUILDER_PATH.read_text()
    text = text.replace(
        "pnpm validate:verification-ladder && pnpm validate:seed-simulators && pnpm validate:seed-simulators && pnpm validate:scaffold",
        "pnpm validate:verification-ladder && pnpm validate:seed-simulators && pnpm validate:scaffold",
    )
    if "pnpm validate:seed-simulators" not in text:
        text = text.replace(
            "pnpm validate:verification-ladder && pnpm validate:scaffold",
            "pnpm validate:verification-ladder && pnpm validate:seed-simulators && pnpm validate:scaffold",
        )
        text = text.replace(
            "pnpm validate:adapter-contracts && pnpm validate:verification-ladder && ",
            "pnpm validate:adapter-contracts && pnpm validate:verification-ladder && pnpm validate:seed-simulators && ",
        )
    if "build_seed_data_and_simulator_strategy.py" not in text:
        text = text.replace(
            "python3 ./tools/analysis/build_verification_ladder_and_environment_ring_policy.py && "
            "python3 ./tools/analysis/build_engineering_standards.py && pnpm format",
            "python3 ./tools/analysis/build_verification_ladder_and_environment_ring_policy.py && "
            "python3 ./tools/analysis/build_seed_data_and_simulator_strategy.py && "
            "python3 ./tools/analysis/build_engineering_standards.py && pnpm format",
        )
    if '"validate:seed-simulators"' not in text:
        text = text.replace(
            '"validate:verification-ladder": "python3 ./tools/analysis/validate_verification_ladder.py",',
            '"validate:verification-ladder": "python3 ./tools/analysis/validate_verification_ladder.py",\n'
            '    "validate:seed-simulators": "python3 ./tools/analysis/validate_seed_and_simulator_strategy.py",',
        )
    if "seed-and-simulator-studio.spec.js" not in text:
        text = text.replace(
            "node verification-cockpit.spec.js --run",
            "node verification-cockpit.spec.js --run && node seed-and-simulator-studio.spec.js --run",
        )
        text = text.replace(
            "node verification-cockpit.spec.js",
            "node verification-cockpit.spec.js && node seed-and-simulator-studio.spec.js",
        )
        text = text.replace(
            "node --check verification-cockpit.spec.js",
            "node --check verification-cockpit.spec.js && node --check seed-and-simulator-studio.spec.js",
        )
        text = text.replace(
            "adapter-contract-studio.spec.js verification-cockpit.spec.js",
            "adapter-contract-studio.spec.js verification-cockpit.spec.js seed-and-simulator-studio.spec.js",
        )
    if "verification ladder, and seed/simulator browser checks." not in text:
        text = text.replace(
            "adapter contract, and verification ladder browser checks.",
            "adapter contract, verification ladder, and seed/simulator browser checks.",
        )
    write_text(VERIFICATION_BUILDER_PATH, text)


def patch_engineering_builder() -> None:
    text = ENGINEERING_BUILDER_PATH.read_text()
    if "pnpm validate:seed-simulators" not in text:
        text = text.replace(
            "pnpm validate:verification-ladder && pnpm validate:scaffold",
            "pnpm validate:verification-ladder && pnpm validate:seed-simulators && pnpm validate:scaffold",
        )
    if "build_seed_data_and_simulator_strategy.py" not in text:
        text = text.replace(
            "python3 ./tools/analysis/build_verification_ladder_and_environment_ring_policy.py && python3 ./tools/analysis/build_engineering_standards.py && pnpm format",
            "python3 ./tools/analysis/build_verification_ladder_and_environment_ring_policy.py && python3 ./tools/analysis/build_seed_data_and_simulator_strategy.py && python3 ./tools/analysis/build_engineering_standards.py && pnpm format",
        )
    if '"validate:seed-simulators"' not in text:
        text = text.replace(
            '"validate:verification-ladder": "python3 ./tools/analysis/validate_verification_ladder.py",\n'
            '    "validate:standards": "python3 ./tools/analysis/validate_engineering_standards.py",',
            '"validate:verification-ladder": "python3 ./tools/analysis/validate_verification_ladder.py",\n'
            '    "validate:seed-simulators": "python3 ./tools/analysis/validate_seed_and_simulator_strategy.py",\n'
            '    "validate:standards": "python3 ./tools/analysis/validate_engineering_standards.py",',
        )
    write_text(ENGINEERING_BUILDER_PATH, text)


def main() -> None:
    context = build_context()
    reference_cases, seed_rows, continuity_rows = build_reference_cases(context)
    simulator_catalog = build_simulator_catalog(context, reference_cases, seed_rows)
    fault_rows = build_fault_matrix(reference_cases, simulator_catalog)

    case_pack = build_reference_case_pack(
        context,
        reference_cases,
        simulator_catalog,
        continuity_rows,
        fault_rows,
    )
    simulator_pack = build_simulator_pack(simulator_catalog, fault_rows)
    fixture_index = build_fixture_index(reference_cases)

    write_json(REFERENCE_CASE_PATH, case_pack)
    write_csv(
        SEED_MATRIX_PATH,
        [
            "seed_object_id",
            "object_type",
            "reference_case_id",
            "tenant_scope_ref",
            "organisation_scope_ref",
            "route_family_ref",
            "starting_surface_ref",
            "seed_state",
            "simulator_refs",
            "continuity_control_refs",
            "release_verification_use",
            "phi_safe_class",
            "requires_live_credentials",
            "canonical_truth_refs",
            "notes",
        ],
        seed_rows,
    )
    write_json(SIMULATOR_CATALOG_PATH, simulator_pack)
    write_csv(
        FAULT_MATRIX_PATH,
        [
            "fault_injection_id",
            "simulator_id",
            "dependency_code",
            "fault_mode",
            "reference_case_id",
            "expected_effect",
            "expected_settlement_refs",
            "expected_closure_blocker_refs",
            "expected_recovery_envelope_refs",
            "ordering_posture",
            "release_verification_use",
            "notes",
        ],
        fault_rows,
    )
    write_csv(
        CONTINUITY_MATRIX_PATH,
        [
            "reference_case_id",
            "case_code",
            "release_verification_use",
            "continuity_control_code",
            "continuity_coverage_record_ref",
            "route_family_ref",
            "surface_manifest_ref",
            "runtime_binding_ref",
            "verification_scenario_ref",
            "validation_goal",
            "posture_class",
        ],
        continuity_rows,
    )
    write_text(STRATEGY_DOC_PATH, build_strategy_doc(case_pack, simulator_pack, seed_rows))
    write_text(CORPUS_DOC_PATH, build_corpus_doc(reference_cases))
    write_text(CUTOVER_DOC_PATH, build_cutover_doc(simulator_catalog))
    write_text(STUDIO_PATH, build_studio_html())
    write_text(FIXTURE_README_PATH, build_fixture_readme(reference_cases))
    write_json(FIXTURE_INDEX_PATH, fixture_index)
    write_text(VALIDATOR_PATH, build_validator())
    write_text(SPEC_PATH, build_spec())
    update_root_package()
    update_playwright_package()
    patch_verification_builder()
    patch_engineering_builder()

    print(
        "seq_059 seed and simulator artifacts generated: "
        f"{len(reference_cases)} reference cases, "
        f"{len(simulator_catalog)} simulators, "
        f"{len(seed_rows)} seed rows, "
        f"{len(fault_rows)} fault rows"
    )


if __name__ == "__main__":
    main()
