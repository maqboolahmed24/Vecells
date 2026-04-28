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
PACKAGE_DIR = ROOT / "packages" / "api-contracts"
PACKAGE_SCHEMA_DIR = PACKAGE_DIR / "schemas"
PACKAGE_SOURCE_PATH = PACKAGE_DIR / "src" / "index.ts"
PACKAGE_TEST_PATH = PACKAGE_DIR / "tests" / "public-api.test.ts"
PACKAGE_PACKAGE_JSON_PATH = PACKAGE_DIR / "package.json"

ESSENTIAL_FUNCTION_MAP_PATH = DATA_DIR / "essential_function_map.json"
RECOVERY_TIERS_PATH = DATA_DIR / "recovery_tiers.json"
BACKUP_SCOPE_MATRIX_PATH = DATA_DIR / "backup_scope_matrix.csv"
RESTORE_RUN_SCHEMA_PATH = DATA_DIR / "restore_run_schema.json"
RECOVERY_POSTURE_RULES_PATH = DATA_DIR / "recovery_control_posture_rules.json"
RECOVERY_EVIDENCE_CATALOG_PATH = DATA_DIR / "recovery_evidence_artifact_catalog.csv"

BASELINE_DOC_PATH = DOCS_DIR / "60_backup_restore_and_recovery_tuple_baseline.md"
TIER_POLICY_DOC_PATH = DOCS_DIR / "60_recovery_tier_and_essential_function_policy.md"
CONTROL_MATRIX_DOC_PATH = DOCS_DIR / "60_restore_and_recovery_control_matrix.md"
LAB_PATH = DOCS_DIR / "60_resilience_control_lab.html"

PACKAGE_SCHEMA_PATH = PACKAGE_SCHEMA_DIR / "recovery-control-posture.schema.json"
VALIDATOR_PATH = ROOT / "tools" / "analysis" / "validate_recovery_tuple_baseline.py"
SPEC_PATH = TESTS_DIR / "resilience-control-lab.spec.js"

RUNTIME_TOPOLOGY_PATH = DATA_DIR / "runtime_topology_manifest.json"
VERIFICATION_SCENARIOS_PATH = DATA_DIR / "verification_scenarios.json"
RELEASE_MATRIX_PATH = DATA_DIR / "release_contract_verification_matrix.json"
REFERENCE_CASE_PATH = DATA_DIR / "reference_case_catalog.json"
SYNTHETIC_RECOVERY_MATRIX_PATH = DATA_DIR / "synthetic_recovery_coverage_matrix.csv"
FRONTEND_MANIFEST_PATH = DATA_DIR / "frontend_contract_manifests.json"
SIMULATOR_CATALOG_PATH = DATA_DIR / "simulator_contract_catalog.json"

ROOT_PACKAGE_PATH = ROOT / "package.json"
PLAYWRIGHT_PACKAGE_PATH = TESTS_DIR / "package.json"
ENGINEERING_BUILDER_PATH = ROOT / "tools" / "analysis" / "build_engineering_standards.py"

PACKAGE_EXPORTS_START = "// seq_060_recovery_tuple_baseline_exports:start"
PACKAGE_EXPORTS_END = "// seq_060_recovery_tuple_baseline_exports:end"

TASK_ID = "seq_060"
VISUAL_MODE = "Resilience_Control_Lab"
TIMESTAMP = datetime.now(timezone.utc).replace(microsecond=0).isoformat()
CAPTURED_ON = TIMESTAMP[:10]
MISSION = (
    "Define the Phase 0 resilience baseline for backup, restore, operational readiness, and "
    "governed recovery control so restore, failover, chaos, and recovery-pack actions are "
    "authorized by one tuple-bound RecoveryControlPosture instead of by dashboard fragments, "
    "runbook folklore, or backup existence alone."
)

SOURCE_PRECEDENCE = [
    "prompt/060.md",
    "prompt/shared_operating_contract_056_to_065.md",
    "prompt/AGENT.md",
    "prompt/checklist.md",
    "blueprint/phase-0-the-foundation-protocol.md#1.40A EssentialFunctionMap",
    "blueprint/phase-0-the-foundation-protocol.md#1.40B RecoveryTier",
    "blueprint/phase-0-the-foundation-protocol.md#1.40C BackupSetManifest",
    "blueprint/phase-0-the-foundation-protocol.md#1.40D RestoreRun",
    "blueprint/phase-0-the-foundation-protocol.md#1.40J RecoveryControlPosture",
    "blueprint/phase-0-the-foundation-protocol.md#1.40K ResilienceActionRecord",
    "blueprint/phase-0-the-foundation-protocol.md#1.40L ResilienceActionSettlement",
    "blueprint/phase-0-the-foundation-protocol.md#1.40M RecoveryEvidenceArtifact",
    "blueprint/phase-0-the-foundation-protocol.md#2.10A ResilienceOrchestrator",
    "blueprint/phase-0-the-foundation-protocol.md#62A-62G",
    "blueprint/platform-runtime-and-release-blueprint.md#Operational readiness contract",
    "blueprint/platform-runtime-and-release-blueprint.md#OperationalReadinessSnapshot",
    "blueprint/platform-runtime-and-release-blueprint.md#RunbookBindingRecord",
    "blueprint/platform-runtime-and-release-blueprint.md#SyntheticRecoveryCoverageRecord",
    "blueprint/phase-cards.md#Phase 9",
    "blueprint/forensic-audit-findings.md#Finding 112",
    "docs/architecture/15_operational_readiness_and_resilience_tooling.md",
    "data/analysis/runtime_topology_manifest.json",
    "data/analysis/verification_scenarios.json",
    "data/analysis/release_contract_verification_matrix.json",
    "data/analysis/reference_case_catalog.json",
    "data/analysis/synthetic_recovery_coverage_matrix.csv",
]

ROOT_SCRIPT_UPDATES = {
    "bootstrap": (
        "pnpm install && node ./tools/dev-bootstrap/index.mjs && pnpm codegen && "
        "pnpm validate:topology && pnpm validate:runtime-topology && pnpm validate:gateway-surface && "
        "pnpm validate:events && pnpm validate:fhir && pnpm validate:frontend && "
        "pnpm validate:release-parity && pnpm validate:design-publication && pnpm validate:audit-worm && "
        "pnpm validate:tenant-scope && pnpm validate:lifecycle && pnpm validate:mutation-gate && "
        "pnpm validate:adapter-contracts && pnpm validate:verification-ladder && "
        "pnpm validate:seed-simulators && pnpm validate:recovery-baseline && "
        "pnpm validate:scaffold && pnpm validate:services && pnpm validate:domains && "
        "pnpm validate:standards"
    ),
    "check": (
        "pnpm lint && pnpm format:check && pnpm typecheck && pnpm test && "
        "pnpm validate:topology && pnpm validate:runtime-topology && pnpm validate:gateway-surface && "
        "pnpm validate:events && pnpm validate:fhir && pnpm validate:frontend && "
        "pnpm validate:release-parity && pnpm validate:design-publication && pnpm validate:audit-worm && "
        "pnpm validate:tenant-scope && pnpm validate:lifecycle && pnpm validate:mutation-gate && "
        "pnpm validate:adapter-contracts && pnpm validate:verification-ladder && "
        "pnpm validate:seed-simulators && pnpm validate:recovery-baseline && "
        "pnpm validate:scaffold && pnpm validate:services && pnpm validate:domains && "
        "pnpm validate:standards"
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
        "python3 ./tools/analysis/build_backup_restore_and_recovery_tuple_baseline.py && "
        "python3 ./tools/analysis/build_engineering_standards.py && pnpm format"
    ),
    "validate:recovery-baseline": "python3 ./tools/analysis/validate_recovery_tuple_baseline.py",
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
        "node --check seed-and-simulator-studio.spec.js && "
        "node --check resilience-control-lab.spec.js"
    ),
    "lint": (
        "eslint foundation-shell-gallery.spec.js runtime-topology-atlas.spec.js "
        "gateway-surface-studio.spec.js event-registry-studio.spec.js "
        "fhir-representation-atlas.spec.js frontend-contract-studio.spec.js "
        "release-parity-cockpit.spec.js design-contract-studio.spec.js "
        "audit-ledger-explorer.spec.js scope-isolation-atlas.spec.js "
        "lifecycle-coordinator-lab.spec.js scoped-mutation-gate-lab.spec.js "
        "adapter-contract-studio.spec.js verification-cockpit.spec.js "
        "seed-and-simulator-studio.spec.js resilience-control-lab.spec.js"
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
        "node seed-and-simulator-studio.spec.js && "
        "node resilience-control-lab.spec.js"
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
        "node --check seed-and-simulator-studio.spec.js && "
        "node --check resilience-control-lab.spec.js"
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
        "node seed-and-simulator-studio.spec.js --run && "
        "node resilience-control-lab.spec.js --run"
    ),
}

ASSUMPTIONS = [
    {
        "assumptionId": "ASSUMPTION_060_READINESS_REFRESH_EXPANDS_FUNCTION_SET",
        "summary": (
            "Seq_058 operational readiness snapshots currently publish four umbrella essential "
            "function refs. Seq_060 freezes the nine-function recovery map now and marks scopes "
            "outside that earlier umbrella coverage as rehearsal_due or recovery_only until the next "
            "readiness refresh republishes the broader map."
        ),
        "sourceRefs": [
            "data/analysis/environment_ring_policy.json",
            "docs/architecture/15_operational_readiness_and_resilience_tooling.md",
            "prompt/060.md",
        ],
    },
    {
        "assumptionId": "ASSUMPTION_060_PREPROD_SYNTHETIC_PROOF_DRIVES_PRODUCTION_JOURNEY_AUTHORITY",
        "summary": (
            "Preprod synthetic recovery coverage remains the freshest governed journey proof available "
            "before later runtime rehearsal tasks materialize dedicated seq_101 restore jobs."
        ),
        "sourceRefs": [
            "data/analysis/synthetic_recovery_coverage_matrix.csv",
            "prompt/060.md",
            "blueprint/platform-runtime-and-release-blueprint.md#SyntheticRecoveryCoverageRecord",
        ],
    },
]

FUNCTION_BLUEPRINTS = [
    {
        "functionCode": "ef_patient_entry_recovery",
        "functionLabel": "Patient entry, intake, and secure-link recovery",
        "functionGroup": "patient",
        "audienceScopeRefs": ["audsurf_patient_public_entry", "audsurf_patient_transaction_recovery"],
        "businessOwnerRef": "owner://vecells/patient-experience",
        "shellSurfaceRefs": ["app_patient_web"],
        "routeFamilyRefs": [
            "rf_intake_self_service",
            "rf_intake_telephony_capture",
            "rf_patient_secure_link_recovery",
        ],
        "continuityControlRefs": ["patient_nav", "intake_resume"],
        "supportingSystemRefs": [
            "app_patient_web",
            "service_api_gateway",
            "service_command_api",
            "service_projection_worker",
            "service_adapter_simulators",
        ],
        "supportingDataRefs": [
            "SubmissionEnvelope",
            "Request",
            "RequestLineage",
            "IdentityBinding",
            "AccessGrant",
            "RouteIntentBinding",
        ],
        "dependencyOrderRefs": [
            "RDO_060_IDENTITY_BEFORE_ENTRY_PROJECTION_V1",
            "RDO_060_ROUTE_INTENT_BEFORE_PUBLIC_REOPEN_V1",
        ],
        "degradedModeRefs": [
            "DMD_060_PATIENT_ENTRY_READ_ONLY_V1",
            "DMD_060_SECURE_LINK_RECOVERY_ONLY_V1",
        ],
        "currentRunbookBindingRefs": ["RBR_060_PATIENT_ENTRY_V1"],
        "currentOperationalReadinessSnapshotRef": "ORS_058_PRODUCTION_V1",
        "functionState": "mapped",
        "snapshotCoverageState": "direct",
        "recoveryTierId": "RT_060_PATIENT_ENTRY_V1",
        "tierCode": "tier_1",
        "rto": "PT30M",
        "rpo": "PT5M",
        "maxDiagnosticOnlyWindow": "PT15M",
        "degradedModeDefinitionRef": "DMD_060_PATIENT_ENTRY_READ_ONLY_V1",
        "restorePriority": 1,
        "requiredJourneyProofKeys": [
            ("preprod", "intake_resume"),
            ("production", "patient_navigation"),
        ],
        "requiredReferenceCaseIds": [
            "RC_059_CLEAN_SELF_SERVICE_SUBMIT_V1",
            "RC_059_TELEPHONY_CONTINUATION_BRANCH_V1",
        ],
        "requiredBackupScopeRefs": [
            "BSM_060_IDENTITY_ENTRY_STATE_V1",
            "BSM_060_WORM_AUDIT_EVIDENCE_V1",
        ],
        "scopeRef": "scope_patient_entry_recovery",
        "releaseTrustFreezeVerdictRef": "RTFV_PRODUCTION_LIVE_V1",
        "restoreValidationFreshnessState": "fresh",
        "dependencyCoverageState": "complete",
        "journeyRecoveryCoverageState": "exact",
        "backupManifestState": "current",
        "postureState": "live_control",
        "allowedActionRefs": ["restore_prepare", "restore_start", "restore_validate"],
        "blockerRefs": [],
        "releaseRecoveryDispositionRef": "RRD_060_PATIENT_ENTRY_SAFE_CONTINUE_V1",
        "evidenceFreshnessState": "fresh",
        "currentBackupSetManifestRefs": [
            "BSM_060_IDENTITY_ENTRY_STATE_V1",
            "BSM_060_WORM_AUDIT_EVIDENCE_V1",
        ],
        "notes": (
            "Public intake and secure-link recovery are allowed live restore controls because the "
            "production tuple still has fresh auth-bridge, telephony, and access-grant rehearsal proof."
        ),
        "sourceRefs": [
            "docs/architecture/15_operational_readiness_and_resilience_tooling.md",
            "data/analysis/reference_case_catalog.json",
            "data/analysis/synthetic_recovery_coverage_matrix.csv",
            "blueprint/phase-0-the-foundation-protocol.md#1.40A EssentialFunctionMap",
        ],
    },
    {
        "functionCode": "ef_patient_self_service_continuity",
        "functionLabel": "Patient home, requests, messages, appointments, and record continuity",
        "functionGroup": "patient",
        "audienceScopeRefs": ["audsurf_patient_authenticated_portal"],
        "businessOwnerRef": "owner://vecells/patient-experience",
        "shellSurfaceRefs": ["app_patient_web"],
        "routeFamilyRefs": [
            "rf_patient_home",
            "rf_patient_requests",
            "rf_patient_appointments",
            "rf_patient_health_record",
            "rf_patient_messages",
        ],
        "continuityControlRefs": ["patient_nav", "record_continuation", "conversation_settlement"],
        "supportingSystemRefs": [
            "app_patient_web",
            "service_api_gateway",
            "service_projection_worker",
            "service_notification_worker",
            "service_adapter_simulators",
        ],
        "supportingDataRefs": [
            "Request",
            "RequestLineage",
            "AudienceSurfaceRuntimeBinding",
            "FrontendContractManifest",
            "ProjectionContractVersionSet",
            "PatientDegradedModeProjection",
        ],
        "dependencyOrderRefs": [
            "RDO_060_PROJECTION_BEFORE_PATIENT_CALMNESS_V1",
            "RDO_060_NOTIFICATION_EVIDENCE_BEFORE_MESSAGE_REOPEN_V1",
        ],
        "degradedModeRefs": [
            "DMD_060_PATIENT_HOME_READ_ONLY_V1",
            "DMD_060_PATIENT_RECORD_SUMMARY_ONLY_V1",
        ],
        "currentRunbookBindingRefs": ["RBR_060_PATIENT_CONTINUITY_V1"],
        "currentOperationalReadinessSnapshotRef": "ORS_058_PRODUCTION_V1",
        "functionState": "mapped",
        "snapshotCoverageState": "direct",
        "recoveryTierId": "RT_060_PATIENT_SELF_SERVICE_V1",
        "tierCode": "tier_1",
        "rto": "PT30M",
        "rpo": "PT5M",
        "maxDiagnosticOnlyWindow": "PT20M",
        "degradedModeDefinitionRef": "DMD_060_PATIENT_HOME_READ_ONLY_V1",
        "restorePriority": 1,
        "requiredJourneyProofKeys": [
            ("preprod", "patient_navigation"),
            ("preprod", "record_continuation"),
            ("preprod", "conversation_settlement"),
        ],
        "requiredReferenceCaseIds": [
            "RC_059_DUPLICATE_RETRY_COLLAPSE_V1",
            "RC_059_SUPPORT_REPLAY_RESTORE_V1",
        ],
        "requiredBackupScopeRefs": [
            "BSM_060_PATIENT_CONTINUITY_READ_MODELS_V1",
            "BSM_060_WORM_AUDIT_EVIDENCE_V1",
        ],
        "scopeRef": "scope_patient_self_service_continuity",
        "releaseTrustFreezeVerdictRef": "RTFV_PRODUCTION_LIVE_V1",
        "restoreValidationFreshnessState": "fresh",
        "dependencyCoverageState": "complete",
        "journeyRecoveryCoverageState": "partial",
        "backupManifestState": "current",
        "postureState": "governed_recovery",
        "allowedActionRefs": ["restore_prepare", "restore_validate"],
        "blockerRefs": ["BLOCKER_060_EMBEDDED_PARITY_STILL_RECOVERY_ONLY"],
        "releaseRecoveryDispositionRef": "RRD_060_PATIENT_PORTAL_RECOVERY_ONLY_V1",
        "evidenceFreshnessState": "fresh",
        "currentBackupSetManifestRefs": [
            "BSM_060_PATIENT_CONTINUITY_READ_MODELS_V1",
            "BSM_060_WORM_AUDIT_EVIDENCE_V1",
        ],
        "notes": (
            "Patient self-service keeps current immutable backups and fresh restore proof, but embedded and "
            "record-continuation recovery are still bounded to governed recovery until exact journey coverage "
            "is republished on the same tuple."
        ),
        "sourceRefs": [
            "docs/architecture/15_operational_readiness_and_resilience_tooling.md",
            "data/analysis/frontend_contract_manifests.json",
            "data/analysis/synthetic_recovery_coverage_matrix.csv",
            "blueprint/platform-runtime-and-release-blueprint.md#Operational readiness contract",
        ],
    },
    {
        "functionCode": "ef_workspace_settlement",
        "functionLabel": "Workspace triage, clinician decision, and settlement",
        "functionGroup": "staff",
        "audienceScopeRefs": ["audsurf_clinical_workspace", "audsurf_support_workspace"],
        "businessOwnerRef": "owner://vecells/triage-workspace",
        "shellSurfaceRefs": ["app_clinical_workspace", "app_support_workspace"],
        "routeFamilyRefs": ["rf_staff_workspace", "rf_staff_workspace_child", "rf_support_ticket_workspace"],
        "continuityControlRefs": ["workspace_task_completion"],
        "supportingSystemRefs": [
            "app_clinical_workspace",
            "app_support_workspace",
            "service_api_gateway",
            "service_command_api",
            "service_projection_worker",
            "service_adapter_simulators",
        ],
        "supportingDataRefs": [
            "Task",
            "QueueRankSnapshot",
            "WorkspaceTrustEnvelope",
            "CommandSettlementRecord",
            "RequestLifecycleLease",
        ],
        "dependencyOrderRefs": [
            "RDO_060_COMMAND_BEFORE_WORKSPACE_QUEUE_REOPEN_V1",
            "RDO_060_LEASE_FENCE_BEFORE_SETTLEMENT_REPLAY_V1",
        ],
        "degradedModeRefs": [
            "DMD_060_WORKSPACE_READ_ONLY_V1",
            "DMD_060_WORKSPACE_DIAGNOSTIC_DRILL_V1",
        ],
        "currentRunbookBindingRefs": ["RBR_060_WORKSPACE_SETTLEMENT_V1"],
        "currentOperationalReadinessSnapshotRef": "ORS_058_PRODUCTION_V1",
        "functionState": "rehearsal_due",
        "snapshotCoverageState": "direct",
        "recoveryTierId": "RT_060_WORKSPACE_SETTLEMENT_V1",
        "tierCode": "tier_1",
        "rto": "PT45M",
        "rpo": "PT10M",
        "maxDiagnosticOnlyWindow": "PT20M",
        "degradedModeDefinitionRef": "DMD_060_WORKSPACE_DIAGNOSTIC_DRILL_V1",
        "restorePriority": 2,
        "requiredJourneyProofKeys": [("preprod", "workspace_task_completion")],
        "requiredReferenceCaseIds": [
            "RC_059_DUPLICATE_COLLISION_REVIEW_V1",
            "RC_059_SUPPORT_REPLAY_RESTORE_V1",
        ],
        "requiredBackupScopeRefs": [
            "BSM_060_WORKSPACE_SETTLEMENT_STATE_V1",
            "BSM_060_WORM_AUDIT_EVIDENCE_V1",
        ],
        "scopeRef": "scope_workspace_settlement",
        "releaseTrustFreezeVerdictRef": "RTFV_PRODUCTION_LIVE_V1",
        "restoreValidationFreshnessState": "stale",
        "dependencyCoverageState": "complete",
        "journeyRecoveryCoverageState": "exact",
        "backupManifestState": "stale",
        "postureState": "diagnostic_only",
        "allowedActionRefs": ["restore_prepare"],
        "blockerRefs": ["DRIFT_060_WORKSPACE_REHEARSAL_STALE", "BLOCKER_060_STALE_WORKSPACE_BACKUP_MANIFEST"],
        "releaseRecoveryDispositionRef": "RRD_060_WORKSPACE_DIAGNOSTIC_ONLY_V1",
        "evidenceFreshnessState": "stale",
        "currentBackupSetManifestRefs": ["BSM_060_WORKSPACE_SETTLEMENT_STATE_V1"],
        "notes": (
            "Workspace settlement remains visible and diagnosable, but live restore control is blocked until "
            "the stale rehearsal evidence and stale queue-settlement backup manifest are superseded on the current tuple."
        ),
        "sourceRefs": [
            "docs/architecture/15_operational_readiness_and_resilience_tooling.md",
            "data/analysis/synthetic_recovery_coverage_matrix.csv",
            "data/analysis/reference_case_catalog.json",
            "blueprint/phase-0-the-foundation-protocol.md#62C-62E",
        ],
    },
    {
        "functionCode": "ef_booking_capacity_commit",
        "functionLabel": "Booking confirmation, waitlist, and capacity commit",
        "functionGroup": "booking",
        "audienceScopeRefs": ["audsurf_hub_desk", "audsurf_patient_authenticated_portal"],
        "businessOwnerRef": "owner://vecells/booking",
        "shellSurfaceRefs": ["app_hub_desk", "app_patient_web"],
        "routeFamilyRefs": ["rf_hub_case_management", "rf_patient_appointments"],
        "continuityControlRefs": ["booking_manage"],
        "supportingSystemRefs": [
            "app_hub_desk",
            "app_patient_web",
            "service_api_gateway",
            "service_command_api",
            "service_projection_worker",
            "service_adapter_simulators",
        ],
        "supportingDataRefs": [
            "BookingCase",
            "CapacityReservation",
            "ExternalConfirmationGate",
            "BookingContinuityEvidenceProjection",
            "RequestLineage",
        ],
        "dependencyOrderRefs": [
            "RDO_060_CAPACITY_HOLD_BEFORE_CONFIRMATION_V1",
            "RDO_060_BOOKING_CASE_BEFORE_PATIENT_APPOINTMENT_REOPEN_V1",
        ],
        "degradedModeRefs": [
            "DMD_060_BOOKING_CONFIRMATION_PLACEHOLDER_V1",
            "DMD_060_BOOKING_WAITLIST_RECOVERY_V1",
        ],
        "currentRunbookBindingRefs": ["RBR_060_BOOKING_COMMIT_V1"],
        "currentOperationalReadinessSnapshotRef": "ORS_058_PRODUCTION_V1",
        "functionState": "mapped",
        "snapshotCoverageState": "provisional_expansion",
        "recoveryTierId": "RT_060_BOOKING_CAPACITY_V1",
        "tierCode": "tier_2",
        "rto": "PT60M",
        "rpo": "PT15M",
        "maxDiagnosticOnlyWindow": "PT25M",
        "degradedModeDefinitionRef": "DMD_060_BOOKING_CONFIRMATION_PLACEHOLDER_V1",
        "restorePriority": 3,
        "requiredJourneyProofKeys": [("preprod", "booking_manage")],
        "requiredReferenceCaseIds": ["RC_059_BOOKING_CONFIRMATION_PENDING_AMBIGUITY_V1"],
        "requiredBackupScopeRefs": [
            "BSM_060_BOOKING_CAPACITY_STATE_V1",
            "BSM_060_WORM_AUDIT_EVIDENCE_V1",
        ],
        "scopeRef": "scope_booking_capacity_commit",
        "releaseTrustFreezeVerdictRef": "RTFV_PRODUCTION_LIVE_V1",
        "restoreValidationFreshnessState": "fresh",
        "dependencyCoverageState": "complete",
        "journeyRecoveryCoverageState": "exact",
        "backupManifestState": "current",
        "postureState": "live_control",
        "allowedActionRefs": ["restore_prepare", "restore_start", "restore_validate"],
        "blockerRefs": [],
        "releaseRecoveryDispositionRef": "RRD_060_BOOKING_GUIDED_RECOVERY_V1",
        "evidenceFreshnessState": "fresh",
        "currentBackupSetManifestRefs": [
            "BSM_060_BOOKING_CAPACITY_STATE_V1",
            "BSM_060_WORM_AUDIT_EVIDENCE_V1",
        ],
        "notes": (
            "Booking capacity and confirmation stay live-control because the exact capacity-hold and "
            "confirmation-pending recovery proofs remain current and the provider-backed backup scope is immutable."
        ),
        "sourceRefs": [
            "docs/architecture/15_operational_readiness_and_resilience_tooling.md",
            "data/analysis/reference_case_catalog.json",
            "data/analysis/synthetic_recovery_coverage_matrix.csv",
            "blueprint/platform-runtime-and-release-blueprint.md#Operational readiness contract",
        ],
    },
    {
        "functionCode": "ef_hub_coordination",
        "functionLabel": "Network hub queue, acknowledgement, and cross-organisation coordination",
        "functionGroup": "hub",
        "audienceScopeRefs": ["audsurf_hub_desk"],
        "businessOwnerRef": "owner://vecells/hub-coordination",
        "shellSurfaceRefs": ["app_hub_desk"],
        "routeFamilyRefs": ["rf_hub_queue", "rf_hub_case_management"],
        "continuityControlRefs": ["hub_booking_manage"],
        "supportingSystemRefs": [
            "app_hub_desk",
            "service_api_gateway",
            "service_command_api",
            "service_projection_worker",
            "service_adapter_simulators",
        ],
        "supportingDataRefs": [
            "HubCoordinationCase",
            "HubSupplierMirrorState",
            "HubOfferToConfirmationTruthProjection",
            "ExternalConfirmationGate",
            "QueueRankSnapshot",
        ],
        "dependencyOrderRefs": [
            "RDO_060_HUB_COORDINATION_CASE_BEFORE_SUPPLIER_ACK_V1",
            "RDO_060_HUB_QUEUE_BEFORE_CONFIRMATION_RESUME_V1",
        ],
        "degradedModeRefs": [
            "DMD_060_HUB_DIAGNOSTIC_QUEUE_V1",
            "DMD_060_HUB_MANUAL_COORDINATION_RECOVERY_V1",
        ],
        "currentRunbookBindingRefs": ["RBR_060_HUB_COORDINATION_V1"],
        "currentOperationalReadinessSnapshotRef": "ORS_058_PRODUCTION_V1",
        "functionState": "rehearsal_due",
        "snapshotCoverageState": "provisional_expansion",
        "recoveryTierId": "RT_060_HUB_COORDINATION_V1",
        "tierCode": "tier_2",
        "rto": "PT60M",
        "rpo": "PT15M",
        "maxDiagnosticOnlyWindow": "PT30M",
        "degradedModeDefinitionRef": "DMD_060_HUB_DIAGNOSTIC_QUEUE_V1",
        "restorePriority": 4,
        "requiredJourneyProofKeys": [("preprod", "hub_booking_manage")],
        "requiredReferenceCaseIds": ["RC_059_BOOKING_CONFIRMATION_PENDING_AMBIGUITY_V1"],
        "requiredBackupScopeRefs": [
            "BSM_060_HUB_COORDINATION_STATE_V1",
            "BSM_060_WORM_AUDIT_EVIDENCE_V1",
        ],
        "scopeRef": "scope_hub_coordination",
        "releaseTrustFreezeVerdictRef": "RTFV_PRODUCTION_LIVE_V1",
        "restoreValidationFreshnessState": "fresh",
        "dependencyCoverageState": "partial",
        "journeyRecoveryCoverageState": "exact",
        "backupManifestState": "current",
        "postureState": "diagnostic_only",
        "allowedActionRefs": ["restore_prepare", "restore_validate"],
        "blockerRefs": ["RISK_060_PARTNER_CONFIRMATION_DEPENDENCY_PARTIAL"],
        "releaseRecoveryDispositionRef": "RRD_060_HUB_DIAGNOSTIC_ONLY_V1",
        "evidenceFreshnessState": "stale",
        "currentBackupSetManifestRefs": [
            "BSM_060_HUB_COORDINATION_STATE_V1",
            "BSM_060_WORM_AUDIT_EVIDENCE_V1",
        ],
        "notes": (
            "Hub coordination remains diagnostic-only because immutable backups exist but partner-confirmation "
            "dependency coverage is still partial for the current tuple and cannot authorize live failover controls."
        ),
        "sourceRefs": [
            "docs/architecture/15_operational_readiness_and_resilience_tooling.md",
            "data/analysis/synthetic_recovery_coverage_matrix.csv",
            "data/analysis/reference_case_catalog.json",
            "blueprint/phase-0-the-foundation-protocol.md#1.40J RecoveryControlPosture",
        ],
    },
    {
        "functionCode": "ef_pharmacy_referral_reconciliation",
        "functionLabel": "Pharmacy referral dispatch, consent, and outcome reconciliation",
        "functionGroup": "pharmacy",
        "audienceScopeRefs": ["audsurf_pharmacy_console"],
        "businessOwnerRef": "owner://vecells/pharmacy",
        "shellSurfaceRefs": ["app_pharmacy_console"],
        "routeFamilyRefs": ["rf_pharmacy_console"],
        "continuityControlRefs": ["pharmacy_console_settlement"],
        "supportingSystemRefs": [
            "app_pharmacy_console",
            "service_api_gateway",
            "service_command_api",
            "service_projection_worker",
            "service_notification_worker",
            "service_adapter_simulators",
        ],
        "supportingDataRefs": [
            "PharmacyCase",
            "PharmacyDispatchAttempt",
            "PharmacyOutcomeReconciliationGate",
            "PharmacyOutcomeTruthProjection",
            "RouteIntentBinding",
        ],
        "dependencyOrderRefs": [
            "RDO_060_PHARMACY_DISPATCH_BEFORE_OUTCOME_RECONCILIATION_V1",
            "RDO_060_CONSENT_LINEAGE_BEFORE_DISPATCH_REOPEN_V1",
        ],
        "degradedModeRefs": [
            "DMD_060_PHARMACY_DISPATCH_RECOVERY_V1",
            "DMD_060_PHARMACY_MANUAL_RECONCILIATION_V1",
        ],
        "currentRunbookBindingRefs": ["RBR_060_PHARMACY_RECONCILIATION_V1"],
        "currentOperationalReadinessSnapshotRef": "ORS_058_PRODUCTION_V1",
        "functionState": "rehearsal_due",
        "snapshotCoverageState": "direct",
        "recoveryTierId": "RT_060_PHARMACY_RECONCILIATION_V1",
        "tierCode": "tier_2",
        "rto": "PT60M",
        "rpo": "PT20M",
        "maxDiagnosticOnlyWindow": "PT30M",
        "degradedModeDefinitionRef": "DMD_060_PHARMACY_MANUAL_RECONCILIATION_V1",
        "restorePriority": 5,
        "requiredJourneyProofKeys": [("preprod", "pharmacy_settlement")],
        "requiredReferenceCaseIds": ["RC_059_PHARMACY_DISPATCH_WEAK_MATCH_V1"],
        "requiredBackupScopeRefs": [
            "BSM_060_PHARMACY_REFERRAL_STATE_V1",
            "BSM_060_WORM_AUDIT_EVIDENCE_V1",
        ],
        "scopeRef": "scope_pharmacy_referral_recovery",
        "releaseTrustFreezeVerdictRef": "RTFV_PRODUCTION_LIVE_V1",
        "restoreValidationFreshnessState": "fresh",
        "dependencyCoverageState": "complete",
        "journeyRecoveryCoverageState": "partial",
        "backupManifestState": "current",
        "postureState": "governed_recovery",
        "allowedActionRefs": ["restore_prepare", "restore_validate"],
        "blockerRefs": ["BLOCKER_060_PHARMACY_WEAK_MATCH_REQUIRES_RECONCILIATION"],
        "releaseRecoveryDispositionRef": "RRD_060_PHARMACY_MANUAL_RECONCILIATION_V1",
        "evidenceFreshnessState": "fresh",
        "currentBackupSetManifestRefs": [
            "BSM_060_PHARMACY_REFERRAL_STATE_V1",
            "BSM_060_WORM_AUDIT_EVIDENCE_V1",
        ],
        "notes": (
            "Pharmacy recovery keeps current immutable dispatch and outcome backups, but live control is narrowed "
            "to governed recovery because weak-match outcome truth still requires named reconciliation."
        ),
        "sourceRefs": [
            "docs/architecture/15_operational_readiness_and_resilience_tooling.md",
            "data/analysis/reference_case_catalog.json",
            "data/analysis/synthetic_recovery_coverage_matrix.csv",
            "blueprint/phase-cards.md#Phase 9",
        ],
    },
    {
        "functionCode": "ef_communication_reachability",
        "functionLabel": "Patient communication, callback, and reachability repair",
        "functionGroup": "communication",
        "audienceScopeRefs": ["audsurf_patient_authenticated_portal", "audsurf_support_workspace"],
        "businessOwnerRef": "owner://vecells/communications",
        "shellSurfaceRefs": ["app_patient_web", "app_support_workspace"],
        "routeFamilyRefs": ["rf_patient_messages", "rf_support_replay_observe"],
        "continuityControlRefs": ["more_info_reply", "conversation_settlement", "support_replay_restore"],
        "supportingSystemRefs": [
            "app_patient_web",
            "app_support_workspace",
            "service_api_gateway",
            "service_command_api",
            "service_notification_worker",
            "service_adapter_simulators",
        ],
        "supportingDataRefs": [
            "CommunicationEnvelope",
            "CallbackOutcomeEvidenceBundle",
            "ContactRouteSnapshot",
            "ReachabilityAssessmentRecord",
            "SupportReplayRestoreSettlement",
        ],
        "dependencyOrderRefs": [
            "RDO_060_DELIVERY_EVIDENCE_BEFORE_MESSAGE_SETTLEMENT_V1",
            "RDO_060_REACHABILITY_CLEARANCE_BEFORE_CALLBACK_REOPEN_V1",
        ],
        "degradedModeRefs": [
            "DMD_060_COMMUNICATION_RETRY_REPAIR_V1",
            "DMD_060_CALLBACK_DIAGNOSTIC_ONLY_V1",
        ],
        "currentRunbookBindingRefs": ["RBR_060_COMMUNICATION_REACHABILITY_V1"],
        "currentOperationalReadinessSnapshotRef": "ORS_058_PRODUCTION_V1",
        "functionState": "mapped",
        "snapshotCoverageState": "provisional_expansion",
        "recoveryTierId": "RT_060_COMMUNICATION_REACHABILITY_V1",
        "tierCode": "tier_1",
        "rto": "PT30M",
        "rpo": "PT10M",
        "maxDiagnosticOnlyWindow": "PT20M",
        "degradedModeDefinitionRef": "DMD_060_COMMUNICATION_RETRY_REPAIR_V1",
        "restorePriority": 2,
        "requiredJourneyProofKeys": [
            ("preprod", "more_info_reply"),
            ("preprod", "support_replay_restore"),
        ],
        "requiredReferenceCaseIds": [
            "RC_059_ACCEPTED_PROGRESS_DEGRADED_FALLBACK_V1",
            "RC_059_SUPPORT_REPLAY_RESTORE_V1",
        ],
        "requiredBackupScopeRefs": [
            "BSM_060_COMMUNICATION_DELIVERY_STATE_V1",
            "BSM_060_WORM_AUDIT_EVIDENCE_V1",
        ],
        "scopeRef": "scope_communication_reachability",
        "releaseTrustFreezeVerdictRef": "RTFV_PRODUCTION_LIVE_V1",
        "restoreValidationFreshnessState": "fresh",
        "dependencyCoverageState": "complete",
        "journeyRecoveryCoverageState": "exact",
        "backupManifestState": "current",
        "postureState": "live_control",
        "allowedActionRefs": ["restore_prepare", "restore_start", "restore_validate"],
        "blockerRefs": [],
        "releaseRecoveryDispositionRef": "RRD_060_COMMUNICATION_RETRY_REPAIR_V1",
        "evidenceFreshnessState": "fresh",
        "currentBackupSetManifestRefs": [
            "BSM_060_COMMUNICATION_DELIVERY_STATE_V1",
            "BSM_060_WORM_AUDIT_EVIDENCE_V1",
        ],
        "notes": (
            "Reachability repair and callback recovery remain live-control because the same tuple still has "
            "fresh replay, delivery, and support-restore evidence with immutable transport backups."
        ),
        "sourceRefs": [
            "docs/architecture/15_operational_readiness_and_resilience_tooling.md",
            "data/analysis/reference_case_catalog.json",
            "data/analysis/synthetic_recovery_coverage_matrix.csv",
            "blueprint/forensic-audit-findings.md#Finding 100",
        ],
    },
    {
        "functionCode": "ef_release_governance",
        "functionLabel": "Release governance, tuple parity, and live wave control",
        "functionGroup": "governance",
        "audienceScopeRefs": ["audsurf_governance_admin", "audsurf_operations_console"],
        "businessOwnerRef": "owner://vecells/release-control",
        "shellSurfaceRefs": ["app_governance_console", "app_ops_console"],
        "routeFamilyRefs": ["rf_governance_shell", "rf_operations_board"],
        "continuityControlRefs": ["patient_nav", "workspace_task_completion"],
        "supportingSystemRefs": [
            "app_governance_console",
            "app_ops_console",
            "service_api_gateway",
            "service_projection_worker",
            "service_notification_worker",
        ],
        "supportingDataRefs": [
            "ReleaseWatchTuple",
            "ReleasePublicationParityRecord",
            "ReleaseTrustFreezeVerdict",
            "WaveGuardrailSnapshot",
            "GovernedControlHandoffBinding",
        ],
        "dependencyOrderRefs": [
            "RDO_060_PUBLICATION_PARITY_BEFORE_WAVE_REOPEN_V1",
            "RDO_060_WATCH_TUPLE_BEFORE_GOVERNANCE_HANDOFF_V1",
        ],
        "degradedModeRefs": [
            "DMD_060_RELEASE_CONTROL_BLOCKED_V1",
            "DMD_060_GOVERNANCE_DIAGNOSTIC_REVIEW_V1",
        ],
        "currentRunbookBindingRefs": ["RBR_060_RELEASE_GOVERNANCE_V1"],
        "currentOperationalReadinessSnapshotRef": "ORS_058_PRODUCTION_V1",
        "functionState": "recovery_only",
        "snapshotCoverageState": "provisional_expansion",
        "recoveryTierId": "RT_060_RELEASE_GOVERNANCE_V1",
        "tierCode": "tier_0",
        "rto": "PT15M",
        "rpo": "PT0M",
        "maxDiagnosticOnlyWindow": "PT10M",
        "degradedModeDefinitionRef": "DMD_060_RELEASE_CONTROL_BLOCKED_V1",
        "restorePriority": 0,
        "requiredJourneyProofKeys": [
            ("production", "patient_navigation"),
            ("production", "workspace_task_completion"),
        ],
        "requiredReferenceCaseIds": ["RC_059_SUPPORT_REPLAY_RESTORE_V1"],
        "requiredBackupScopeRefs": [
            "BSM_060_RELEASE_GOVERNANCE_TUPLE_V1",
            "BSM_060_WORM_AUDIT_EVIDENCE_V1",
        ],
        "scopeRef": "scope_release_governance",
        "releaseTrustFreezeVerdictRef": "RTFV_PRODUCTION_ROLLBACK_V1",
        "restoreValidationFreshnessState": "fresh",
        "dependencyCoverageState": "complete",
        "journeyRecoveryCoverageState": "exact",
        "backupManifestState": "current",
        "postureState": "blocked",
        "allowedActionRefs": ["pause", "rollback"],
        "blockerRefs": ["BLOCKER_060_RELEASE_TRUST_NOT_LIVE", "BLOCKER_060_PARITY_REQUIRES_FRESH_APPROVAL"],
        "releaseRecoveryDispositionRef": "RRD_060_RELEASE_CONTROL_BLOCKED_V1",
        "evidenceFreshnessState": "missing",
        "currentBackupSetManifestRefs": [
            "BSM_060_RELEASE_GOVERNANCE_TUPLE_V1",
            "BSM_060_WORM_AUDIT_EVIDENCE_V1",
        ],
        "notes": (
            "Governance keeps immutable tuple and audit backups, but live recovery control is blocked because the "
            "current release trust verdict is not live. Only pause and rollback authority remain legal."
        ),
        "sourceRefs": [
            "docs/architecture/15_operational_readiness_and_resilience_tooling.md",
            "data/analysis/release_contract_verification_matrix.json",
            "data/analysis/verification_scenarios.json",
            "blueprint/forensic-audit-findings.md#Finding 95",
        ],
    },
    {
        "functionCode": "ef_platform_recovery_control",
        "functionLabel": "Operational readiness, restore authority, and recovery activation",
        "functionGroup": "resilience",
        "audienceScopeRefs": ["audsurf_operations_console", "audsurf_governance_admin"],
        "businessOwnerRef": "owner://vecells/platform-runtime",
        "shellSurfaceRefs": ["app_ops_console", "app_governance_console"],
        "routeFamilyRefs": ["rf_operations_drilldown", "rf_governance_shell"],
        "continuityControlRefs": ["support_replay_restore", "patient_nav"],
        "supportingSystemRefs": [
            "app_ops_console",
            "app_governance_console",
            "service_api_gateway",
            "service_command_api",
            "service_projection_worker",
            "service_notification_worker",
            "service_adapter_simulators",
        ],
        "supportingDataRefs": [
            "OperationalReadinessSnapshot",
            "RunbookBindingRecord",
            "BackupSetManifest",
            "RestoreRun",
            "RecoveryControlPosture",
            "RecoveryEvidenceArtifact",
            "ResilienceActionSettlement",
        ],
        "dependencyOrderRefs": [
            "RDO_060_BACKUP_COMPATIBILITY_BEFORE_RESTORE_ACTION_V1",
            "RDO_060_EVIDENCE_ARTIFACT_BEFORE_RECOVERY_PACK_EXPORT_V1",
        ],
        "degradedModeRefs": [
            "DMD_060_PLATFORM_RECOVERY_BLOCKED_V1",
            "DMD_060_PLATFORM_DIAGNOSTIC_ONLY_V1",
        ],
        "currentRunbookBindingRefs": ["RBR_060_PLATFORM_RECOVERY_CONTROL_V1"],
        "currentOperationalReadinessSnapshotRef": "ORS_058_PRODUCTION_V1",
        "functionState": "recovery_only",
        "snapshotCoverageState": "provisional_expansion",
        "recoveryTierId": "RT_060_PLATFORM_RECOVERY_CONTROL_V1",
        "tierCode": "tier_0",
        "rto": "PT15M",
        "rpo": "PT0M",
        "maxDiagnosticOnlyWindow": "PT5M",
        "degradedModeDefinitionRef": "DMD_060_PLATFORM_RECOVERY_BLOCKED_V1",
        "restorePriority": 0,
        "requiredJourneyProofKeys": [
            ("production", "support_replay_restore"),
            ("production", "patient_navigation"),
        ],
        "requiredReferenceCaseIds": ["RC_059_SUPPORT_REPLAY_RESTORE_V1"],
        "requiredBackupScopeRefs": [
            "BSM_060_PLATFORM_RECOVERY_EVIDENCE_V1",
            "BSM_060_WORM_AUDIT_EVIDENCE_V1",
        ],
        "scopeRef": "scope_platform_recovery_control",
        "releaseTrustFreezeVerdictRef": "RTFV_PRODUCTION_LIVE_V1",
        "restoreValidationFreshnessState": "expired",
        "dependencyCoverageState": "blocked",
        "journeyRecoveryCoverageState": "missing",
        "backupManifestState": "stale",
        "postureState": "blocked",
        "allowedActionRefs": ["diagnose"],
        "blockerRefs": [
            "BLOCKER_060_PLATFORM_RECOVERY_TUPLE_DRIFT",
            "BLOCKER_060_PLATFORM_RECOVERY_EVIDENCE_STALE",
            "BLOCKER_060_PLATFORM_RECOVERY_JOURNEY_PROOF_MISSING",
        ],
        "releaseRecoveryDispositionRef": "RRD_060_PLATFORM_RECOVERY_BLOCKED_V1",
        "evidenceFreshnessState": "expired",
        "currentBackupSetManifestRefs": ["BSM_060_PLATFORM_RECOVERY_EVIDENCE_V1"],
        "notes": (
            "Platform recovery control is fail-closed. The current tuple has stale platform-recovery backup "
            "compatibility and expired restore validation, so only diagnostic evidence remains safe."
        ),
        "sourceRefs": [
            "docs/architecture/15_operational_readiness_and_resilience_tooling.md",
            "blueprint/forensic-audit-findings.md#Finding 112",
            "blueprint/phase-0-the-foundation-protocol.md#62A-62G",
            "data/analysis/verification_scenarios.json",
        ],
    },
]

BACKUP_MANIFEST_BLUEPRINTS = [
    {
        "backupSetManifestId": "BSM_060_IDENTITY_ENTRY_STATE_V1",
        "datasetScopeRef": "dataset://identity-entry-state",
        "datasetLabel": "Identity, access-grant, and intake-state plane",
        "essentialFunctionRefs": ["ef_patient_entry_recovery"],
        "immutabilityState": "immutable",
        "runtimePublicationBundleRef": "RPB_PRODUCTION_V1",
        "manifestState": "current",
        "containsPhi": "yes",
        "compatibilityScope": "identity-and-entry tuple",
        "restorePriority": 1,
        "sourceRefs": [
            "blueprint/phase-0-the-foundation-protocol.md#1.40C BackupSetManifest",
            "data/analysis/runtime_topology_manifest.json",
        ],
    },
    {
        "backupSetManifestId": "BSM_060_PATIENT_CONTINUITY_READ_MODELS_V1",
        "datasetScopeRef": "dataset://patient-continuity-read-models",
        "datasetLabel": "Patient continuity projections and route-calmness state",
        "essentialFunctionRefs": ["ef_patient_self_service_continuity"],
        "immutabilityState": "immutable",
        "runtimePublicationBundleRef": "RPB_PRODUCTION_V1",
        "manifestState": "current",
        "containsPhi": "yes",
        "compatibilityScope": "patient continuity tuple",
        "restorePriority": 1,
        "sourceRefs": [
            "blueprint/platform-runtime-and-release-blueprint.md#Operational readiness contract",
            "data/analysis/frontend_contract_manifests.json",
        ],
    },
    {
        "backupSetManifestId": "BSM_060_WORKSPACE_SETTLEMENT_STATE_V1",
        "datasetScopeRef": "dataset://workspace-settlement-and-queue",
        "datasetLabel": "Workspace queue, lease, and settlement state",
        "essentialFunctionRefs": ["ef_workspace_settlement"],
        "immutabilityState": "immutable",
        "runtimePublicationBundleRef": "RPB_PRODUCTION_V1",
        "manifestState": "stale",
        "containsPhi": "yes",
        "compatibilityScope": "workspace recovery tuple",
        "restorePriority": 2,
        "sourceRefs": [
            "blueprint/phase-0-the-foundation-protocol.md#1.40C BackupSetManifest",
            "data/analysis/verification_scenarios.json",
        ],
    },
    {
        "backupSetManifestId": "BSM_060_BOOKING_CAPACITY_STATE_V1",
        "datasetScopeRef": "dataset://booking-capacity-and-confirmation",
        "datasetLabel": "Booking capacity holds, confirmation, and waitlist state",
        "essentialFunctionRefs": ["ef_booking_capacity_commit"],
        "immutabilityState": "immutable",
        "runtimePublicationBundleRef": "RPB_PRODUCTION_V1",
        "manifestState": "current",
        "containsPhi": "yes",
        "compatibilityScope": "booking and patient appointment tuple",
        "restorePriority": 3,
        "sourceRefs": [
            "blueprint/phase-0-the-foundation-protocol.md#1.40C BackupSetManifest",
            "data/analysis/reference_case_catalog.json",
        ],
    },
    {
        "backupSetManifestId": "BSM_060_HUB_COORDINATION_STATE_V1",
        "datasetScopeRef": "dataset://hub-queue-and-supplier-mirror",
        "datasetLabel": "Hub queue, supplier mirror, and cross-site coordination state",
        "essentialFunctionRefs": ["ef_hub_coordination"],
        "immutabilityState": "immutable",
        "runtimePublicationBundleRef": "RPB_PRODUCTION_V1",
        "manifestState": "current",
        "containsPhi": "yes",
        "compatibilityScope": "hub coordination tuple",
        "restorePriority": 4,
        "sourceRefs": [
            "blueprint/phase-0-the-foundation-protocol.md#1.40C BackupSetManifest",
            "data/analysis/reference_case_catalog.json",
        ],
    },
    {
        "backupSetManifestId": "BSM_060_PHARMACY_REFERRAL_STATE_V1",
        "datasetScopeRef": "dataset://pharmacy-dispatch-and-outcome",
        "datasetLabel": "Pharmacy dispatch, consent, and outcome reconciliation state",
        "essentialFunctionRefs": ["ef_pharmacy_referral_reconciliation"],
        "immutabilityState": "immutable",
        "runtimePublicationBundleRef": "RPB_PRODUCTION_V1",
        "manifestState": "current",
        "containsPhi": "yes",
        "compatibilityScope": "pharmacy referral tuple",
        "restorePriority": 5,
        "sourceRefs": [
            "blueprint/phase-0-the-foundation-protocol.md#1.40C BackupSetManifest",
            "data/analysis/reference_case_catalog.json",
        ],
    },
    {
        "backupSetManifestId": "BSM_060_COMMUNICATION_DELIVERY_STATE_V1",
        "datasetScopeRef": "dataset://communications-and-reachability",
        "datasetLabel": "Communication, callback, and reachability repair state",
        "essentialFunctionRefs": ["ef_communication_reachability"],
        "immutabilityState": "immutable",
        "runtimePublicationBundleRef": "RPB_PRODUCTION_V1",
        "manifestState": "current",
        "containsPhi": "yes",
        "compatibilityScope": "communication recovery tuple",
        "restorePriority": 2,
        "sourceRefs": [
            "blueprint/phase-0-the-foundation-protocol.md#1.40C BackupSetManifest",
            "data/analysis/reference_case_catalog.json",
        ],
    },
    {
        "backupSetManifestId": "BSM_060_RELEASE_GOVERNANCE_TUPLE_V1",
        "datasetScopeRef": "dataset://release-governance-and-watch-tuple",
        "datasetLabel": "Release watch tuple, parity, and governance handoff state",
        "essentialFunctionRefs": ["ef_release_governance"],
        "immutabilityState": "immutable",
        "runtimePublicationBundleRef": "RPB_PRODUCTION_V1",
        "manifestState": "current",
        "containsPhi": "no",
        "compatibilityScope": "release watch tuple",
        "restorePriority": 0,
        "sourceRefs": [
            "blueprint/platform-runtime-and-release-blueprint.md#Operational readiness contract",
            "data/analysis/release_contract_verification_matrix.json",
        ],
    },
    {
        "backupSetManifestId": "BSM_060_PLATFORM_RECOVERY_EVIDENCE_V1",
        "datasetScopeRef": "dataset://platform-recovery-evidence-and-runbooks",
        "datasetLabel": "Runbook bindings, restore reports, and resilience action evidence",
        "essentialFunctionRefs": ["ef_platform_recovery_control"],
        "immutabilityState": "immutable",
        "runtimePublicationBundleRef": "RPB_PRODUCTION_V1",
        "manifestState": "stale",
        "containsPhi": "mixed",
        "compatibilityScope": "platform resilience tuple",
        "restorePriority": 0,
        "sourceRefs": [
            "blueprint/platform-runtime-and-release-blueprint.md#RunbookBindingRecord",
            "blueprint/forensic-audit-findings.md#Finding 112",
        ],
    },
    {
        "backupSetManifestId": "BSM_060_WORM_AUDIT_EVIDENCE_V1",
        "datasetScopeRef": "dataset://worm-audit-and-recovery-evidence",
        "datasetLabel": "WORM audit, recovery evidence, and settlement history",
        "essentialFunctionRefs": [
            "ef_patient_entry_recovery",
            "ef_patient_self_service_continuity",
            "ef_workspace_settlement",
            "ef_booking_capacity_commit",
            "ef_hub_coordination",
            "ef_pharmacy_referral_reconciliation",
            "ef_communication_reachability",
            "ef_release_governance",
            "ef_platform_recovery_control",
        ],
        "immutabilityState": "immutable",
        "runtimePublicationBundleRef": "RPB_PRODUCTION_V1",
        "manifestState": "current",
        "containsPhi": "mixed",
        "compatibilityScope": "audit and recovery evidence tuple",
        "restorePriority": 0,
        "sourceRefs": [
            "blueprint/phase-0-the-foundation-protocol.md#1.40M RecoveryEvidenceArtifact",
            "data/analysis/audit_record_schema.json",
        ],
    },
]

POSTURE_STATE_RULES = [
    {
        "postureState": "live_control",
        "legalWhen": (
            "Publication and trust remain live, required runbooks are published, restore validation is fresh, "
            "dependency coverage is complete, journey recovery coverage is exact, and required backup manifests are current."
        ),
        "allowedActionRefs": ["restore_prepare", "restore_start", "restore_validate"],
        "sourceRefs": [
            "blueprint/phase-0-the-foundation-protocol.md#1.40J RecoveryControlPosture",
            "blueprint/phase-0-the-foundation-protocol.md#62C",
        ],
    },
    {
        "postureState": "diagnostic_only",
        "legalWhen": (
            "Diagnostics, evidence inspection, and bounded tuple comparison remain safe, but stale rehearsal or partial dependency proof "
            "blocks live restore, failover, or chaos authority."
        ),
        "allowedActionRefs": ["restore_prepare", "diagnose"],
        "sourceRefs": [
            "blueprint/phase-0-the-foundation-protocol.md#1.40J RecoveryControlPosture",
            "blueprint/phase-0-the-foundation-protocol.md#62A-62D",
        ],
    },
    {
        "postureState": "governed_recovery",
        "legalWhen": (
            "Immutable backup scope and fresh restore validation exist, but journey coverage or bounded recovery disposition still narrows legal actions "
            "to governed recovery only."
        ),
        "allowedActionRefs": ["restore_prepare", "restore_validate"],
        "sourceRefs": [
            "blueprint/phase-0-the-foundation-protocol.md#1.40J RecoveryControlPosture",
            "blueprint/platform-runtime-and-release-blueprint.md#Operational readiness contract",
        ],
    },
    {
        "postureState": "blocked",
        "legalWhen": (
            "Required trust, readiness, journey proof, or backup compatibility is missing, stale, expired, or tuple-drifted. "
            "Only governed observation or halt posture remains legal."
        ),
        "allowedActionRefs": ["diagnose", "pause", "rollback"],
        "sourceRefs": [
            "blueprint/phase-0-the-foundation-protocol.md#1.40J RecoveryControlPosture",
            "blueprint/phase-0-the-foundation-protocol.md#62C-62F",
        ],
    },
]


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
        writer.writerows(rows)


def csv_join(values: list[str]) -> str:
    return "; ".join(values)


def digest_ref(prefix: str, *parts: str) -> str:
    digest = hashlib.sha256("::".join(parts).encode("utf-8")).hexdigest()[:16]
    return f"{prefix}::{digest}"


def upsert_marked_block(text: str, start_marker: str, end_marker: str, block: str) -> str:
    block = block.strip()
    if start_marker in text and end_marker in text:
        prefix, remainder = text.split(start_marker, 1)
        _, suffix = remainder.split(end_marker, 1)
        return prefix.rstrip() + "\n\n" + block + "\n" + suffix.lstrip("\n")
    return text.rstrip() + "\n\n" + block + "\n"


def markdown_table(headers: list[str], rows: list[list[str]]) -> str:
    header_line = "| " + " | ".join(headers) + " |"
    divider = "| " + " | ".join(["---"] * len(headers)) + " |"
    body = ["| " + " | ".join(row) + " |" for row in rows]
    return "\n".join([header_line, divider, *body])


def load_context() -> dict[str, Any]:
    runtime = read_json(RUNTIME_TOPOLOGY_PATH)
    scenarios = read_json(VERIFICATION_SCENARIOS_PATH)
    matrix_pack = read_json(RELEASE_MATRIX_PATH)
    case_pack = read_json(REFERENCE_CASE_PATH)
    frontend_pack = read_json(FRONTEND_MANIFEST_PATH)
    simulator_pack = read_json(SIMULATOR_CATALOG_PATH)
    synthetic_rows = list(csv.DictReader(SYNTHETIC_RECOVERY_MATRIX_PATH.open()))

    service_bindings = {row["artifact_id"]: row for row in runtime["service_runtime_bindings"]}
    scenario_by_ring = {row["ringCode"]: row for row in scenarios["verificationScenarios"]}
    matrix_by_release = {
        row["releaseRef"]: row for row in matrix_pack["releaseContractVerificationMatrices"]
    }
    reference_cases = {row["referenceCaseId"]: row for row in case_pack["referenceCases"]}
    manifests_by_audience = {
        row["audienceSurface"]: row for row in frontend_pack["frontendContractManifests"]
    }
    simulators = {row["simulatorId"]: row for row in simulator_pack["simulators"]}

    synthetic_by_key: dict[tuple[str, str], dict[str, str]] = {}
    for row in synthetic_rows:
        synthetic_by_key[(row["ring_code"], row["journey_code"])] = row

    return {
        "runtime": runtime,
        "scenarios": scenarios,
        "matrix_pack": matrix_pack,
        "case_pack": case_pack,
        "frontend_pack": frontend_pack,
        "simulator_pack": simulator_pack,
        "synthetic_rows": synthetic_rows,
        "service_bindings": service_bindings,
        "scenario_by_ring": scenario_by_ring,
        "matrix_by_release": matrix_by_release,
        "reference_cases": reference_cases,
        "manifests_by_audience": manifests_by_audience,
        "simulators": simulators,
        "synthetic_by_key": synthetic_by_key,
    }


def build_backup_rows() -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    for blueprint in BACKUP_MANIFEST_BLUEPRINTS:
        tuple_hash = digest_ref(
            "backup-tuple",
            blueprint["backupSetManifestId"],
            blueprint["datasetScopeRef"],
            blueprint["runtimePublicationBundleRef"],
            "|".join(blueprint["essentialFunctionRefs"]),
        )
        rows.append(
            {
                "backup_set_manifest_id": blueprint["backupSetManifestId"],
                "dataset_scope_ref": blueprint["datasetScopeRef"],
                "dataset_label": blueprint["datasetLabel"],
                "essential_function_refs": csv_join(blueprint["essentialFunctionRefs"]),
                "snapshot_time": TIMESTAMP,
                "immutability_state": blueprint["immutabilityState"],
                "checksum_bundle_ref": digest_ref("checksum-bundle", blueprint["backupSetManifestId"], "sha256"),
                "restore_compatibility_digest_ref": digest_ref(
                    "restore-compatibility", blueprint["backupSetManifestId"], blueprint["compatibilityScope"]
                ),
                "runtime_publication_bundle_ref": blueprint["runtimePublicationBundleRef"],
                "manifest_tuple_hash": tuple_hash,
                "manifest_state": blueprint["manifestState"],
                "verified_at": TIMESTAMP,
                "restore_priority": str(blueprint["restorePriority"]),
                "contains_phi": blueprint["containsPhi"],
                "compatibility_scope": blueprint["compatibilityScope"],
                "source_refs": csv_join(blueprint["sourceRefs"]),
            }
        )
    return rows


def build_recovery_data(context: dict[str, Any]) -> dict[str, Any]:
    backup_rows = build_backup_rows()
    backup_by_id = {row["backup_set_manifest_id"]: row for row in backup_rows}

    essential_function_rows: list[dict[str, Any]] = []
    tier_rows: list[dict[str, Any]] = []
    posture_rows: list[dict[str, Any]] = []
    evidence_rows: list[dict[str, Any]] = []
    defects: list[dict[str, Any]] = []

    for blueprint in FUNCTION_BLUEPRINTS:
        required_journey_proof_refs = []
        for ring_code, journey_code in blueprint["requiredJourneyProofKeys"]:
            synthetic_row = context["synthetic_by_key"].get((ring_code, journey_code))
            if synthetic_row:
                required_journey_proof_refs.append(synthetic_row["synthetic_recovery_coverage_record_id"])
        required_journey_proof_refs.extend(blueprint["requiredReferenceCaseIds"])

        function_row = {
            "essentialFunctionMapId": f"EFM_060_{blueprint['functionCode'].upper()}_V1",
            "functionCode": blueprint["functionCode"],
            "functionLabel": blueprint["functionLabel"],
            "functionGroup": blueprint["functionGroup"],
            "audienceScopeRefs": blueprint["audienceScopeRefs"],
            "businessOwnerRef": blueprint["businessOwnerRef"],
            "recoveryTierRef": blueprint["recoveryTierId"],
            "supportingSystemRefs": blueprint["supportingSystemRefs"],
            "supportingDataRefs": blueprint["supportingDataRefs"],
            "dependencyOrderRefs": blueprint["dependencyOrderRefs"],
            "degradedModeRefs": blueprint["degradedModeRefs"],
            "currentRunbookBindingRefs": blueprint["currentRunbookBindingRefs"],
            "currentOperationalReadinessSnapshotRef": blueprint["currentOperationalReadinessSnapshotRef"],
            "routeFamilyRefs": blueprint["routeFamilyRefs"],
            "shellSurfaceRefs": blueprint["shellSurfaceRefs"],
            "continuityControlRefs": blueprint["continuityControlRefs"],
            "functionState": blueprint["functionState"],
            "snapshotCoverageState": blueprint["snapshotCoverageState"],
            "updatedAt": TIMESTAMP,
            "sourceRefs": blueprint["sourceRefs"],
            "notes": blueprint["notes"],
        }
        essential_function_rows.append(function_row)

        tier_row = {
            "recoveryTierId": blueprint["recoveryTierId"],
            "functionCode": blueprint["functionCode"],
            "functionLabel": blueprint["functionLabel"],
            "tierCode": blueprint["tierCode"],
            "rto": blueprint["rto"],
            "rpo": blueprint["rpo"],
            "maxDiagnosticOnlyWindow": blueprint["maxDiagnosticOnlyWindow"],
            "degradedModeDefinitionRef": blueprint["degradedModeDefinitionRef"],
            "restorePriority": blueprint["restorePriority"],
            "requiredJourneyProofRefs": required_journey_proof_refs,
            "requiredBackupScopeRefs": blueprint["requiredBackupScopeRefs"],
            "tierState": "active",
            "updatedAt": TIMESTAMP,
            "sourceRefs": blueprint["sourceRefs"],
        }
        tier_rows.append(tier_row)

        latest_restore_run_ref = f"RESTORE_060_{blueprint['functionCode'].upper()}_V1"
        latest_settlement_ref = f"RAS_060_{blueprint['functionCode'].upper()}_V1"
        evidence_refs = [
            f"REA_060_{blueprint['functionCode'].upper()}_PRIMARY_V1",
            f"REA_060_{blueprint['functionCode'].upper()}_SUPPORT_V1",
        ]
        posture_row = {
            "recoveryControlPostureId": f"RCP_060_{blueprint['functionCode'].upper()}_V1",
            "scopeRef": blueprint["scopeRef"],
            "functionCode": blueprint["functionCode"],
            "functionLabel": blueprint["functionLabel"],
            "functionGroup": blueprint["functionGroup"],
            "recoveryTierRef": blueprint["recoveryTierId"],
            "tierCode": blueprint["tierCode"],
            "operationalReadinessSnapshotRef": blueprint["currentOperationalReadinessSnapshotRef"],
            "releaseTrustFreezeVerdictRef": blueprint["releaseTrustFreezeVerdictRef"],
            "requiredRunbookBindingRefs": blueprint["currentRunbookBindingRefs"],
            "restoreValidationFreshnessState": blueprint["restoreValidationFreshnessState"],
            "dependencyCoverageState": blueprint["dependencyCoverageState"],
            "journeyRecoveryCoverageState": blueprint["journeyRecoveryCoverageState"],
            "backupManifestState": blueprint["backupManifestState"],
            "postureState": blueprint["postureState"],
            "allowedActionRefs": blueprint["allowedActionRefs"],
            "blockerRefs": blueprint["blockerRefs"],
            "releaseRecoveryDispositionRef": blueprint["releaseRecoveryDispositionRef"],
            "lastComputedAt": TIMESTAMP,
            "evidenceFreshnessState": blueprint["evidenceFreshnessState"],
            "currentBackupSetManifestRefs": blueprint["currentBackupSetManifestRefs"],
            "requiredJourneyProofRefs": required_journey_proof_refs,
            "latestRestoreRunRef": latest_restore_run_ref,
            "latestResilienceActionSettlementRef": latest_settlement_ref,
            "latestRecoveryEvidenceArtifactRefs": evidence_refs,
            "sourceRefs": blueprint["sourceRefs"],
            "notes": blueprint["notes"],
        }
        posture_rows.append(posture_row)

        primary_artifact_type = "restore_report"
        support_artifact_type = {
            "live_control": "journey_recovery_proof",
            "diagnostic_only": "dependency_restore_explainer",
            "governed_recovery": "recovery_pack_export",
            "blocked": "runbook_bundle",
        }[blueprint["postureState"]]
        primary_state = {
            "live_control": "governed_preview",
            "diagnostic_only": "summary_only",
            "governed_recovery": "recovery_only",
            "blocked": "summary_only",
        }[blueprint["postureState"]]
        support_state = {
            "live_control": "governed_preview",
            "diagnostic_only": "summary_only",
            "governed_recovery": "recovery_only",
            "blocked": "recovery_only",
        }[blueprint["postureState"]]

        evidence_rows.extend(
            [
                {
                    "recovery_evidence_artifact_id": evidence_refs[0],
                    "artifact_type": primary_artifact_type,
                    "scope_ref": blueprint["scopeRef"],
                    "function_code": blueprint["functionCode"],
                    "operational_readiness_snapshot_ref": blueprint["currentOperationalReadinessSnapshotRef"],
                    "runbook_binding_refs": csv_join(blueprint["currentRunbookBindingRefs"]),
                    "producing_run_ref": latest_restore_run_ref,
                    "summary_ref": f"SUMMARY_060_{blueprint['functionCode'].upper()}_PRIMARY_V1",
                    "artifact_presentation_contract_ref": "APC_060_RECOVERY_SECURE_PRESENTATION_V1",
                    "artifact_surface_context_ref": "ASC_060_RESILIENCE_CONTROL_LAB_V1",
                    "artifact_mode_truth_projection_ref": "AMTP_060_RECOVERY_ARTIFACT_TRUTH_V1",
                    "artifact_transfer_settlement_ref": latest_settlement_ref,
                    "masking_policy_ref": "MASK_060_RECOVERY_ARTIFACT_MINIMUM_NECESSARY_V1",
                    "outbound_navigation_grant_ref": "ONG_060_RECOVERY_ARTIFACT_EXPORT_V1",
                    "artifact_state": primary_state,
                    "freshness_state": blueprint["evidenceFreshnessState"],
                    "phi_posture": "governed_masked",
                    "source_refs": csv_join(blueprint["sourceRefs"]),
                },
                {
                    "recovery_evidence_artifact_id": evidence_refs[1],
                    "artifact_type": support_artifact_type,
                    "scope_ref": blueprint["scopeRef"],
                    "function_code": blueprint["functionCode"],
                    "operational_readiness_snapshot_ref": blueprint["currentOperationalReadinessSnapshotRef"],
                    "runbook_binding_refs": csv_join(blueprint["currentRunbookBindingRefs"]),
                    "producing_run_ref": latest_restore_run_ref,
                    "summary_ref": f"SUMMARY_060_{blueprint['functionCode'].upper()}_SUPPORT_V1",
                    "artifact_presentation_contract_ref": "APC_060_RECOVERY_SECURE_PRESENTATION_V1",
                    "artifact_surface_context_ref": "ASC_060_RESILIENCE_CONTROL_LAB_V1",
                    "artifact_mode_truth_projection_ref": "AMTP_060_RECOVERY_ARTIFACT_TRUTH_V1",
                    "artifact_transfer_settlement_ref": latest_settlement_ref,
                    "masking_policy_ref": "MASK_060_RECOVERY_ARTIFACT_MINIMUM_NECESSARY_V1",
                    "outbound_navigation_grant_ref": "ONG_060_RECOVERY_ARTIFACT_EXPORT_V1",
                    "artifact_state": support_state,
                    "freshness_state": blueprint["evidenceFreshnessState"],
                    "phi_posture": "governed_masked",
                    "source_refs": csv_join(blueprint["sourceRefs"]),
                },
            ]
        )

        for blocker_ref in blueprint["blockerRefs"]:
            defects.append(
                {
                    "defectId": blocker_ref,
                    "scopeRef": blueprint["scopeRef"],
                    "functionCode": blueprint["functionCode"],
                    "severity": (
                        "blocked"
                        if blueprint["postureState"] == "blocked"
                        else "constrained" if blueprint["postureState"] == "governed_recovery" else "diagnostic"
                    ),
                    "summary": blueprint["notes"],
                    "sourceRefs": blueprint["sourceRefs"],
                }
            )

    essential_payload = {
        "task_id": TASK_ID,
        "generated_at": TIMESTAMP,
        "captured_on": CAPTURED_ON,
        "visual_mode": VISUAL_MODE,
        "mission": MISSION,
        "source_precedence": SOURCE_PRECEDENCE,
        "summary": {
            "essential_function_count": len(essential_function_rows),
            "mapped_count": sum(1 for row in essential_function_rows if row["functionState"] == "mapped"),
            "rehearsal_due_count": sum(
                1 for row in essential_function_rows if row["functionState"] == "rehearsal_due"
            ),
            "recovery_only_count": sum(
                1 for row in essential_function_rows if row["functionState"] == "recovery_only"
            ),
        },
        "assumptions": ASSUMPTIONS,
        "essentialFunctionMap": essential_function_rows,
    }

    tier_payload = {
        "task_id": TASK_ID,
        "generated_at": TIMESTAMP,
        "captured_on": CAPTURED_ON,
        "visual_mode": VISUAL_MODE,
        "mission": MISSION,
        "source_precedence": SOURCE_PRECEDENCE,
        "summary": {
            "tier_count": len(tier_rows),
            "priority_0_count": sum(1 for row in tier_rows if row["restorePriority"] == 0),
            "priority_1_count": sum(1 for row in tier_rows if row["restorePriority"] == 1),
            "priority_2_count": sum(1 for row in tier_rows if row["restorePriority"] == 2),
            "priority_3_plus_count": sum(1 for row in tier_rows if row["restorePriority"] >= 3),
        },
        "assumptions": ASSUMPTIONS,
        "recoveryTiers": tier_rows,
    }

    posture_payload = {
        "task_id": TASK_ID,
        "generated_at": TIMESTAMP,
        "captured_on": CAPTURED_ON,
        "visual_mode": VISUAL_MODE,
        "mission": MISSION,
        "source_precedence": SOURCE_PRECEDENCE,
        "summary": {
            "posture_scope_count": len(posture_rows),
            "live_control_scope_count": sum(1 for row in posture_rows if row["postureState"] == "live_control"),
            "diagnostic_only_scope_count": sum(
                1 for row in posture_rows if row["postureState"] == "diagnostic_only"
            ),
            "governed_recovery_scope_count": sum(
                1 for row in posture_rows if row["postureState"] == "governed_recovery"
            ),
            "blocked_scope_count": sum(1 for row in posture_rows if row["postureState"] == "blocked"),
            "evidence_artifact_count": len(evidence_rows),
            "backup_manifest_count": len(backup_rows),
            "current_manifest_count": sum(1 for row in backup_rows if row["manifest_state"] == "current"),
        },
        "postureStateLaw": POSTURE_STATE_RULES,
        "assumptions": ASSUMPTIONS,
        "defects": defects,
        "postureRules": posture_rows,
    }

    return {
        "essential_payload": essential_payload,
        "tier_payload": tier_payload,
        "backup_rows": backup_rows,
        "posture_payload": posture_payload,
        "evidence_rows": evidence_rows,
    }


def build_restore_run_schema() -> dict[str, Any]:
    return {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "$id": "https://vecells.local/schemas/restore_run.schema.json",
        "title": "RestoreRun",
        "type": "object",
        "additionalProperties": False,
        "required": [
            "restoreRunId",
            "essentialFunctionRefs",
            "targetEnvironmentRef",
            "backupSetManifestRefs",
            "operationalReadinessSnapshotRef",
            "runbookBindingRefs",
            "restoreTupleHash",
            "dependencyValidationState",
            "journeyValidationState",
            "resultState",
            "evidenceArtifactRefs",
            "resilienceActionSettlementRef",
            "initiatedAt",
        ],
        "properties": {
            "restoreRunId": {"type": "string"},
            "essentialFunctionRefs": {"type": "array", "items": {"type": "string"}, "minItems": 1},
            "targetEnvironmentRef": {"type": "string"},
            "backupSetManifestRefs": {"type": "array", "items": {"type": "string"}, "minItems": 1},
            "operationalReadinessSnapshotRef": {"type": "string"},
            "runbookBindingRefs": {"type": "array", "items": {"type": "string"}, "minItems": 1},
            "restoreTupleHash": {"type": "string"},
            "dependencyValidationState": {
                "type": "string",
                "enum": ["pending", "complete", "blocked"],
            },
            "journeyValidationState": {
                "type": "string",
                "enum": ["pending", "complete", "blocked"],
            },
            "resultState": {
                "type": "string",
                "enum": [
                    "running",
                    "data_restored",
                    "journey_validation_pending",
                    "succeeded",
                    "failed",
                    "superseded",
                ],
            },
            "evidenceArtifactRefs": {"type": "array", "items": {"type": "string"}, "minItems": 1},
            "resilienceActionSettlementRef": {"type": "string"},
            "initiatedAt": {"type": "string", "format": "date-time"},
            "completedAt": {"type": "string", "format": "date-time"},
        },
        "definitions": {
            "ResilienceActionRecord": {
                "type": "object",
                "required": [
                    "resilienceActionRecordId",
                    "routeIntentBindingRef",
                    "actionType",
                    "scopeRef",
                    "operationalReadinessSnapshotRef",
                    "recoveryControlPostureRef",
                    "commandActionRecordRef",
                ],
                "properties": {
                    "resilienceActionRecordId": {"type": "string"},
                    "routeIntentBindingRef": {"type": "string"},
                    "actionType": {
                        "type": "string",
                        "enum": [
                            "restore_prepare",
                            "restore_start",
                            "restore_validate",
                            "failover_activate",
                            "failover_validate",
                            "failover_stand_down",
                            "chaos_schedule",
                            "chaos_start",
                            "chaos_abort",
                            "recovery_pack_attest",
                        ],
                    },
                    "scopeRef": {"type": "string"},
                    "operationalReadinessSnapshotRef": {"type": "string"},
                    "recoveryControlPostureRef": {"type": "string"},
                    "commandActionRecordRef": {"type": "string"},
                },
            },
            "ResilienceActionSettlement": {
                "type": "object",
                "required": [
                    "resilienceActionSettlementId",
                    "resilienceActionRecordRef",
                    "commandSettlementRef",
                    "transitionEnvelopeRef",
                    "authoritativeRunRefs",
                    "recoveryEvidenceArtifactRefs",
                    "result",
                    "recordedPostureRef",
                    "releaseRecoveryDispositionRef",
                    "settledAt",
                ],
                "properties": {
                    "resilienceActionSettlementId": {"type": "string"},
                    "resilienceActionRecordRef": {"type": "string"},
                    "commandSettlementRef": {"type": "string"},
                    "transitionEnvelopeRef": {"type": "string"},
                    "authoritativeRunRefs": {
                        "type": "array",
                        "items": {"type": "string"},
                        "minItems": 1,
                    },
                    "recoveryEvidenceArtifactRefs": {
                        "type": "array",
                        "items": {"type": "string"},
                        "minItems": 1,
                    },
                    "result": {
                        "type": "string",
                        "enum": [
                            "accepted_pending_evidence",
                            "applied",
                            "blocked_publication",
                            "blocked_trust",
                            "blocked_readiness",
                            "frozen",
                            "stale_scope",
                            "failed",
                            "superseded",
                        ],
                    },
                    "recordedPostureRef": {"type": "string"},
                    "releaseRecoveryDispositionRef": {"type": "string"},
                    "settledAt": {"type": "string", "format": "date-time"},
                },
            },
        },
    }


def build_recovery_control_posture_schema() -> dict[str, Any]:
    return {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "$id": "https://vecells.local/schemas/recovery-control-posture.schema.json",
        "title": "RecoveryControlPosture",
        "type": "object",
        "additionalProperties": False,
        "required": [
            "recoveryControlPostureId",
            "scopeRef",
            "operationalReadinessSnapshotRef",
            "releaseTrustFreezeVerdictRef",
            "requiredRunbookBindingRefs",
            "restoreValidationFreshnessState",
            "dependencyCoverageState",
            "journeyRecoveryCoverageState",
            "backupManifestState",
            "postureState",
            "allowedActionRefs",
            "blockerRefs",
            "releaseRecoveryDispositionRef",
            "lastComputedAt",
        ],
        "properties": {
            "recoveryControlPostureId": {"type": "string"},
            "scopeRef": {"type": "string"},
            "functionCode": {"type": "string"},
            "functionLabel": {"type": "string"},
            "recoveryTierRef": {"type": "string"},
            "operationalReadinessSnapshotRef": {"type": "string"},
            "releaseTrustFreezeVerdictRef": {"type": "string"},
            "requiredRunbookBindingRefs": {
                "type": "array",
                "items": {"type": "string"},
                "minItems": 1,
            },
            "restoreValidationFreshnessState": {
                "type": "string",
                "enum": ["fresh", "stale", "expired", "missing"],
            },
            "dependencyCoverageState": {
                "type": "string",
                "enum": ["complete", "partial", "blocked"],
            },
            "journeyRecoveryCoverageState": {
                "type": "string",
                "enum": ["exact", "partial", "missing"],
            },
            "backupManifestState": {
                "type": "string",
                "enum": ["current", "stale", "missing"],
            },
            "postureState": {
                "type": "string",
                "enum": ["live_control", "diagnostic_only", "governed_recovery", "blocked"],
            },
            "allowedActionRefs": {
                "type": "array",
                "items": {"type": "string"},
                "minItems": 1,
            },
            "blockerRefs": {"type": "array", "items": {"type": "string"}},
            "releaseRecoveryDispositionRef": {"type": "string"},
            "lastComputedAt": {"type": "string", "format": "date-time"},
        },
    }


def build_baseline_doc(
    essential_payload: dict[str, Any],
    tier_payload: dict[str, Any],
    backup_rows: list[dict[str, Any]],
    posture_payload: dict[str, Any],
) -> str:
    summary = posture_payload["summary"]
    function_table = markdown_table(
        ["Function", "Group", "Tier", "State", "Posture", "Current ORS"],
        [
            [
                row["functionLabel"],
                row["functionGroup"],
                next(tier["tierCode"] for tier in tier_payload["recoveryTiers"] if tier["functionCode"] == row["functionCode"]),
                row["functionState"],
                next(
                    rule["postureState"]
                    for rule in posture_payload["postureRules"]
                    if rule["functionCode"] == row["functionCode"]
                ),
                row["currentOperationalReadinessSnapshotRef"],
            ]
            for row in essential_payload["essentialFunctionMap"]
        ],
    )
    tuple_members = "\n".join(
        [
            "- `OperationalReadinessSnapshot` binds the current release, watch tuple, runbooks, and resilience evidence.",
            "- `RunbookBindingRecord` proves rehearsed guidance for the same release tuple rather than leaving authority on wiki links.",
            "- `BackupSetManifest` proves immutable, checksum-complete, compatibility-scoped backup coverage.",
            "- `RestoreRun` stays tuple-bound and requires dependency plus journey validation, not data rehydration alone.",
            "- `RecoveryControlPosture` is the only runtime verdict for restore, failover, and chaos authority.",
            "- `ResilienceActionRecord` and `ResilienceActionSettlement` keep recovery controls inside governed mutation law.",
            "- `RecoveryEvidenceArtifact` writes recovery proof back into governed presentation and assurance law.",
        ]
    )
    assumptions = "\n".join(
        f"- `{item['assumptionId']}`: {item['summary']}" for item in essential_payload["assumptions"]
    )
    return dedent(
        f"""
        # 60 Backup Restore And Recovery Tuple Baseline

        Seq `060` freezes the Phase 0 recovery tuple so backup, restore, failover, chaos, and recovery-pack controls all consume one published authority model.

        ## Baseline Summary

        - Essential functions: `{essential_payload["summary"]["essential_function_count"]}`
        - Recovery tiers: `{tier_payload["summary"]["tier_count"]}`
        - Backup manifests: `{len(backup_rows)}`
        - Recovery posture scopes: `{summary["posture_scope_count"]}`
        - Live-control scopes: `{summary["live_control_scope_count"]}`
        - Blocked scopes: `{summary["blocked_scope_count"]}`
        - Recovery evidence artifacts: `{summary["evidence_artifact_count"]}`

        ## Recovery Tuple Members

        {tuple_members}

        ## Essential Function Coverage

        {function_table}

        ## Mandatory Closures

        - Backup existence alone no longer implies recovery readiness; immutable manifests, checksum coverage, and compatibility digests are mandatory.
        - Dashboards and runbooks no longer reconstruct authority; `RecoveryControlPosture` is the single runtime verdict.
        - Recovery evidence is now tuple-bound and presentation-governed instead of detached operational folklore.
        - Essential functions are business recovery units rather than infra-only assets.
        - Restore, failover, and chaos controls now settle through the same governed mutation chain as any other high-impact operation.

        ## Assumptions

        {assumptions}
        """
    ).strip()


def build_tier_policy_doc(essential_payload: dict[str, Any], tier_payload: dict[str, Any]) -> str:
    tier_rows = markdown_table(
        ["Function", "Tier", "RTO", "RPO", "Max Diagnostic", "Restore Priority", "Journey Proof"],
        [
            [
                next(
                    row["functionLabel"]
                    for row in essential_payload["essentialFunctionMap"]
                    if row["functionCode"] == tier["functionCode"]
                ),
                tier["tierCode"],
                tier["rto"],
                tier["rpo"],
                tier["maxDiagnosticOnlyWindow"],
                str(tier["restorePriority"]),
                ", ".join(tier["requiredJourneyProofRefs"][:2]),
            ]
            for tier in tier_payload["recoveryTiers"]
        ],
    )
    return dedent(
        f"""
        # 60 Recovery Tier And Essential Function Policy

        The recovery tier policy binds business recovery units to explicit restore ceilings, degraded-mode definitions, backup scope, and required journey proof.

        ## Tier Matrix

        {tier_rows}

        ## Policy Notes

        - `tier_0` scopes are control-plane recovery units. They fail closed fastest and never inherit authority from a historic clean rehearsal.
        - `tier_1` scopes cover patient entry, portal continuity, workspace settlement, and communication repair where calm or writable posture must degrade quickly.
        - `tier_2` scopes cover booking, hub, and pharmacy loops where manual reconciliation remains legal but still tuple-bound.
        - Every row references both reference-case proof from seq_059 and synthetic recovery proof from seq_058 so journey readiness and recovery posture stay joined.
        """
    ).strip()


def build_control_matrix_doc(
    backup_rows: list[dict[str, Any]],
    posture_payload: dict[str, Any],
    evidence_rows: list[dict[str, Any]],
) -> str:
    posture_rows = markdown_table(
        ["Scope", "Posture", "Restore Freshness", "Dependency", "Journey", "Backup", "Allowed"],
        [
            [
                row["scopeRef"],
                row["postureState"],
                row["restoreValidationFreshnessState"],
                row["dependencyCoverageState"],
                row["journeyRecoveryCoverageState"],
                row["backupManifestState"],
                ", ".join(row["allowedActionRefs"]),
            ]
            for row in posture_payload["postureRules"]
        ],
    )
    backup_table = markdown_table(
        ["Manifest", "Dataset Scope", "Functions", "State", "Immutability", "Compatibility"],
        [
            [
                row["backup_set_manifest_id"],
                row["dataset_scope_ref"],
                row["essential_function_refs"],
                row["manifest_state"],
                row["immutability_state"],
                row["restore_compatibility_digest_ref"],
            ]
            for row in backup_rows
        ],
    )
    evidence_table = markdown_table(
        ["Artifact", "Type", "Scope", "State", "Freshness"],
        [
            [
                row["recovery_evidence_artifact_id"],
                row["artifact_type"],
                row["scope_ref"],
                row["artifact_state"],
                row["freshness_state"],
            ]
            for row in evidence_rows
        ],
    )
    return dedent(
        f"""
        # 60 Restore And Recovery Control Matrix

        This matrix joins backup scope, recovery posture, and evidence artifacts so restore, failover, and chaos authority cannot drift apart.

        ## Recovery Control Posture Matrix

        {posture_rows}

        ## Backup Scope Matrix

        {backup_table}

        ## Recovery Evidence Catalog

        {evidence_table}

        ## Governing Rules

        - `live_control` requires fresh tuple alignment across readiness, runbooks, backup manifests, journey proof, and trust verdict.
        - `diagnostic_only` preserves evidence visibility but never leaves live recovery controls armed.
        - `governed_recovery` keeps bounded recovery actions legal while ordinary live controls stay withdrawn.
        - `blocked` is fail-closed and still requires governed evidence capture rather than silent dashboard optimism.
        """
    ).strip()


def build_lab_html() -> str:
    return dedent(
        """
        <!DOCTYPE html>
        <html lang="en">
          <head>
            <meta charset="utf-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1" />
            <title>Vecells Resilience Control Lab</title>
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
                --resilience: #0EA5A4;
                --recovery: #0F9D58;
                --diagnostic: #7C3AED;
                --warning: #C98900;
                --blocked: #C24141;
                --shadow: 0 20px 50px rgba(15, 23, 42, 0.08);
                --radius-lg: 24px;
                --radius-md: 18px;
                --radius-sm: 12px;
                --transition-fast: 120ms ease;
                --transition-medium: 180ms ease;
                --transition-slow: 220ms ease;
                font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
              }

              * {
                box-sizing: border-box;
              }

              body {
                margin: 0;
                background: radial-gradient(circle at top right, rgba(53, 89, 230, 0.08), transparent 28%),
                  linear-gradient(180deg, #fbfcff 0%, var(--canvas) 28%, #eef3fb 100%);
                color: var(--text-default);
                min-height: 100vh;
              }

              body[data-reduced-motion="true"] * {
                animation-duration: 1ms !important;
                animation-iteration-count: 1 !important;
                transition-duration: 1ms !important;
                scroll-behavior: auto !important;
              }

              .app-shell {
                max-width: 1500px;
                margin: 0 auto;
                padding: 18px 18px 40px;
              }

              .masthead {
                position: sticky;
                top: 0;
                z-index: 10;
                min-height: 72px;
                display: grid;
                grid-template-columns: 1.4fr repeat(4, minmax(0, 1fr));
                gap: 14px;
                align-items: stretch;
                padding: 14px 0 18px;
                backdrop-filter: blur(18px);
                background: linear-gradient(180deg, rgba(247, 248, 252, 0.92), rgba(247, 248, 252, 0.76));
              }

              .brand-card,
              .metric-card,
              .panel,
              .rail,
              .inspector {
                background: var(--panel);
                border: 1px solid var(--border-subtle);
                border-radius: var(--radius-lg);
                box-shadow: var(--shadow);
              }

              .brand-card {
                padding: 16px 18px;
                display: flex;
                align-items: center;
                gap: 14px;
              }

              .monogram {
                width: 44px;
                height: 44px;
                border-radius: 14px;
                background: linear-gradient(135deg, rgba(53, 89, 230, 0.12), rgba(14, 165, 164, 0.16));
                display: grid;
                place-items: center;
                color: var(--primary);
              }

              .metric-card {
                padding: 14px 16px;
                display: flex;
                flex-direction: column;
                justify-content: center;
                gap: 4px;
              }

              .metric-label {
                font-size: 0.78rem;
                color: var(--text-muted);
                text-transform: uppercase;
                letter-spacing: 0.08em;
              }

              .metric-value {
                font-size: 1.4rem;
                font-weight: 700;
                color: var(--text-strong);
              }

              .layout {
                display: grid;
                grid-template-columns: 300px minmax(0, 1fr) 396px;
                gap: 16px;
                align-items: start;
              }

              .rail,
              .inspector,
              .panel {
                padding: 18px;
              }

              .rail {
                position: sticky;
                top: 96px;
                background: linear-gradient(180deg, var(--rail), #ffffff);
              }

              .filter-stack {
                display: grid;
                gap: 14px;
              }

              .filter-field label {
                display: block;
                font-size: 0.8rem;
                font-weight: 700;
                color: var(--text-muted);
                margin-bottom: 6px;
                letter-spacing: 0.02em;
              }

              .filter-field select {
                width: 100%;
                min-height: 44px;
                border-radius: 14px;
                border: 1px solid var(--border-default);
                background: #fff;
                color: var(--text-default);
                padding: 10px 12px;
                font: inherit;
              }

              .panel-grid {
                display: grid;
                gap: 16px;
              }

              .diagram-grid {
                display: grid;
                grid-template-columns: 1.2fr 0.9fr;
                gap: 16px;
                min-height: 620px;
              }

              .panel h2,
              .inspector h2,
              .rail h2 {
                margin: 0 0 6px;
                font-size: 1rem;
                color: var(--text-strong);
              }

              .panel-subtitle {
                margin: 0 0 14px;
                color: var(--text-muted);
                font-size: 0.88rem;
              }

              .function-map {
                display: grid;
                gap: 10px;
              }

              .function-node,
              .posture-card,
              .backup-row-button,
              .rule-row-button {
                border: 1px solid var(--border-subtle);
                background: var(--inset);
                border-radius: var(--radius-md);
                transition:
                  transform var(--transition-medium),
                  border-color var(--transition-fast),
                  background var(--transition-medium),
                  box-shadow var(--transition-medium);
              }

              .function-node {
                padding: 14px 16px;
                display: grid;
                gap: 8px;
                cursor: pointer;
              }

              .function-node[data-selected="true"],
              .posture-card[data-selected="true"],
              .backup-row-button[data-selected="true"],
              .rule-row-button[data-selected="true"] {
                border-color: var(--primary);
                background: rgba(53, 89, 230, 0.08);
                box-shadow: 0 16px 34px rgba(53, 89, 230, 0.12);
                transform: translateY(-1px);
              }

              .function-node:focus-visible,
              .posture-card:focus-visible,
              .backup-row-button:focus-visible,
              .rule-row-button:focus-visible {
                outline: 2px solid var(--primary);
                outline-offset: 2px;
              }

              .tag-row,
              .chip-row {
                display: flex;
                flex-wrap: wrap;
                gap: 8px;
              }

              .tag,
              .chip {
                display: inline-flex;
                align-items: center;
                gap: 6px;
                border-radius: 999px;
                padding: 6px 10px;
                font-size: 0.78rem;
                font-weight: 700;
                background: rgba(148, 163, 184, 0.14);
                color: var(--text-default);
              }

              .chip-live_control {
                background: rgba(15, 157, 88, 0.12);
                color: var(--recovery);
              }

              .chip-diagnostic_only {
                background: rgba(124, 58, 237, 0.12);
                color: var(--diagnostic);
              }

              .chip-governed_recovery {
                background: rgba(14, 165, 164, 0.12);
                color: var(--resilience);
              }

              .chip-blocked {
                background: rgba(194, 65, 65, 0.12);
                color: var(--blocked);
              }

              .chip-fresh {
                background: rgba(15, 157, 88, 0.12);
                color: var(--recovery);
              }

              .chip-stale {
                background: rgba(201, 137, 0, 0.14);
                color: var(--warning);
              }

              .chip-expired,
              .chip-missing {
                background: rgba(194, 65, 65, 0.14);
                color: var(--blocked);
              }

              .posture-grid {
                display: grid;
                grid-template-columns: repeat(4, minmax(0, 1fr));
                gap: 12px;
              }

              .posture-card-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
                gap: 14px;
              }

              .posture-card {
                min-height: 170px;
                padding: 16px;
                display: grid;
                gap: 10px;
                cursor: pointer;
              }

              .mono {
                font-family: "SFMono-Regular", ui-monospace, Menlo, Monaco, Consolas, monospace;
              }

              .inspector {
                position: sticky;
                top: 96px;
                display: grid;
                gap: 16px;
                transition: transform var(--transition-slow);
              }

              .inspector-block {
                border: 1px solid var(--border-subtle);
                border-radius: var(--radius-md);
                padding: 14px;
                background: linear-gradient(180deg, #ffffff, var(--inset));
              }

              .inspector-list,
              .evidence-rail {
                display: grid;
                gap: 10px;
              }

              .evidence-entry {
                border: 1px solid var(--border-subtle);
                border-radius: 14px;
                background: var(--inset);
                padding: 12px;
              }

              .lower-region {
                display: grid;
                grid-template-columns: 1.1fr 1fr;
                gap: 16px;
              }

              .table-panel {
                overflow: hidden;
              }

              table {
                width: 100%;
                border-collapse: collapse;
                font-size: 0.9rem;
              }

              th,
              td {
                border-bottom: 1px solid var(--border-subtle);
                padding: 10px 8px;
                text-align: left;
                vertical-align: top;
              }

              th {
                font-size: 0.78rem;
                color: var(--text-muted);
                text-transform: uppercase;
                letter-spacing: 0.05em;
              }

              .table-button {
                width: 100%;
                text-align: left;
                border: 0;
                background: transparent;
                padding: 0;
                color: inherit;
                font: inherit;
              }

              .defect-strip {
                display: grid;
                gap: 10px;
              }

              .defect {
                border-radius: 14px;
                border: 1px solid rgba(194, 65, 65, 0.22);
                background: rgba(194, 65, 65, 0.08);
                padding: 12px 14px;
              }

              .muted {
                color: var(--text-muted);
              }

              @media (max-width: 1180px) {
                .layout {
                  grid-template-columns: 1fr;
                }

                .rail,
                .inspector {
                  position: static;
                }

                .diagram-grid,
                .lower-region {
                  grid-template-columns: 1fr;
                }

                .posture-grid {
                  grid-template-columns: repeat(2, minmax(0, 1fr));
                }
              }

              @media (max-width: 760px) {
                .masthead {
                  grid-template-columns: 1fr 1fr;
                }

                .brand-card {
                  grid-column: 1 / -1;
                }

                .posture-grid {
                  grid-template-columns: 1fr;
                }
              }
            </style>
          </head>
          <body>
            <div class="app-shell">
              <header class="masthead">
                <section class="brand-card" aria-label="Vecells resilience control brand">
                  <div class="monogram" aria-hidden="true">
                    <svg viewBox="0 0 48 48" width="24" height="24" fill="none">
                      <rect x="8" y="8" width="32" height="32" rx="10" stroke="currentColor" stroke-width="2.4"></rect>
                      <path d="M17 31V17h8.5c4.2 0 6.5 2.1 6.5 5.7 0 3.7-2.4 5.8-6.5 5.8H21v2.5" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"></path>
                    </svg>
                  </div>
                  <div>
                    <div class="metric-label">Vecells</div>
                    <div class="metric-value">Resilience Control Lab</div>
                    <div class="muted">One tuple-bound restore, failover, and recovery-control instrument.</div>
                  </div>
                </section>
                <section class="metric-card">
                  <div class="metric-label">Essential Functions</div>
                  <div class="metric-value" data-testid="metric-function-count">0</div>
                </section>
                <section class="metric-card">
                  <div class="metric-label">Current Manifests</div>
                  <div class="metric-value" data-testid="metric-manifest-count">0</div>
                </section>
                <section class="metric-card">
                  <div class="metric-label">Live-Control Scopes</div>
                  <div class="metric-value" data-testid="metric-live-count">0</div>
                </section>
                <section class="metric-card">
                  <div class="metric-label">Blocked Scopes</div>
                  <div class="metric-value" data-testid="metric-blocked-count">0</div>
                </section>
              </header>

              <div class="layout">
                <aside class="rail" aria-label="Resilience filters">
                  <h2>Filters</h2>
                  <p class="panel-subtitle">Function, tier, posture, and evidence freshness all filter the same tuple set.</p>
                  <div class="filter-stack">
                    <div class="filter-field">
                      <label for="function-filter">Function group</label>
                      <select id="function-filter" data-testid="function-filter"></select>
                    </div>
                    <div class="filter-field">
                      <label for="tier-filter">Recovery tier</label>
                      <select id="tier-filter" data-testid="tier-filter"></select>
                    </div>
                    <div class="filter-field">
                      <label for="posture-filter">Posture state</label>
                      <select id="posture-filter" data-testid="posture-filter"></select>
                    </div>
                    <div class="filter-field">
                      <label for="freshness-filter">Evidence freshness</label>
                      <select id="freshness-filter" data-testid="freshness-filter"></select>
                    </div>
                  </div>
                </aside>

                <main class="panel-grid">
                  <div class="diagram-grid">
                    <section class="panel" data-testid="function-map">
                      <h2>Essential Function Map</h2>
                      <p class="panel-subtitle">Business recovery units anchored to shell and route terms.</p>
                      <div class="function-map" id="function-map-grid"></div>
                    </section>

                    <section class="panel" data-testid="posture-panel">
                      <h2>Recovery Posture Panel</h2>
                      <p class="panel-subtitle">Live control, diagnostic-only, governed recovery, and blocked remain explicit.</p>
                      <div class="posture-grid" id="posture-chip-grid"></div>
                    </section>
                  </div>

                  <section class="panel">
                    <h2>Curated Scope Cards</h2>
                    <p class="panel-subtitle">Selecting a card synchronizes the function map, backup matrix, rule row, and inspector.</p>
                    <div class="posture-card-grid" id="posture-grid"></div>
                  </section>

                  <div class="lower-region">
                    <section class="panel table-panel">
                      <h2>Function Map Parity</h2>
                      <p class="panel-subtitle">Every function node has a table row with the same tier, state, and snapshot binding.</p>
                      <table data-testid="function-map-parity-table">
                        <thead>
                          <tr>
                            <th>Function</th>
                            <th>Tier</th>
                            <th>State</th>
                            <th>Posture</th>
                          </tr>
                        </thead>
                        <tbody id="function-map-parity-body"></tbody>
                      </table>
                    </section>

                    <section class="panel table-panel">
                      <h2>Posture Parity</h2>
                      <p class="panel-subtitle">The posture panel stays backed by a readable table rather than color alone.</p>
                      <table data-testid="posture-parity-table">
                        <thead>
                          <tr>
                            <th>Posture</th>
                            <th>Count</th>
                            <th>Meaning</th>
                          </tr>
                        </thead>
                        <tbody id="posture-parity-body"></tbody>
                      </table>
                    </section>
                  </div>

                  <div class="lower-region">
                    <section class="panel table-panel">
                      <h2>Backup Scope Matrix</h2>
                      <p class="panel-subtitle">Immutable manifests and compatibility digests stay visible beside their governing scopes.</p>
                      <table data-testid="backup-scope-table">
                        <thead>
                          <tr>
                            <th>Manifest</th>
                            <th>Dataset</th>
                            <th>Functions</th>
                            <th>State</th>
                          </tr>
                        </thead>
                        <tbody id="backup-matrix-body"></tbody>
                      </table>
                    </section>

                    <section class="panel table-panel">
                      <h2>Recovery Posture Rules</h2>
                      <p class="panel-subtitle">Each row is the single runtime verdict for one recovery scope.</p>
                      <table data-testid="posture-rule-table">
                        <thead>
                          <tr>
                            <th>Scope</th>
                            <th>Posture</th>
                            <th>Freshness</th>
                            <th>Blockers</th>
                          </tr>
                        </thead>
                        <tbody id="posture-rule-body"></tbody>
                      </table>
                    </section>
                  </div>

                  <section class="panel" data-testid="defect-strip">
                    <h2>Defect Strip</h2>
                    <p class="panel-subtitle">Fail-closed blockers and drift remain explicit even when the lab looks composed.</p>
                    <div class="defect-strip" id="defect-strip-body"></div>
                  </section>
                </main>

                <aside class="inspector" data-testid="inspector" aria-live="polite">
                  <section class="inspector-block">
                    <h2>Selected Function</h2>
                    <div id="inspector-summary"></div>
                  </section>
                  <section class="inspector-block">
                    <h2>Tuple Details</h2>
                    <div class="inspector-list" id="tuple-details"></div>
                  </section>
                  <section class="inspector-block">
                    <h2>Backup Manifest State</h2>
                    <div class="inspector-list" id="manifest-details"></div>
                  </section>
                  <section class="inspector-block">
                    <h2>Latest Recovery Evidence</h2>
                    <div class="evidence-rail" data-testid="evidence-rail" id="evidence-rail"></div>
                  </section>
                </aside>
              </div>
            </div>

            <script>
              const PATHS = {
                essential: "../../data/analysis/essential_function_map.json",
                tiers: "../../data/analysis/recovery_tiers.json",
                backup: "../../data/analysis/backup_scope_matrix.csv",
                posture: "../../data/analysis/recovery_control_posture_rules.json",
                evidence: "../../data/analysis/recovery_evidence_artifact_catalog.csv",
              };

              const state = {
                essential: null,
                tiers: null,
                posture: null,
                backupRows: [],
                evidenceRows: [],
                functionsByCode: {},
                tiersById: {},
                filters: {
                  function: "all",
                  tier: "all",
                  posture: "all",
                  freshness: "all",
                },
                selectedScopeRef: null,
                selectedBackupManifestId: null,
              };

              function escapeHtml(value) {
                return String(value)
                  .replace(/&/g, "&amp;")
                  .replace(/</g, "&lt;")
                  .replace(/>/g, "&gt;")
                  .replace(/"/g, "&quot;");
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

              function splitList(value) {
                return value ? value.split("; ").filter(Boolean) : [];
              }

              function chipClass(value) {
                return `chip chip-${value}`;
              }

              function cardTitle(row) {
                const fn = state.functionsByCode[row.functionCode];
                return fn ? fn.functionLabel : row.functionCode;
              }

              function getTier(row) {
                return state.tiersById[row.recoveryTierRef] || {};
              }

              function getFunction(row) {
                return state.functionsByCode[row.functionCode] || {};
              }

              function getVisibleRows() {
                return state.posture.postureRules.filter((row) => {
                  const fn = getFunction(row);
                  const tier = getTier(row);
                  if (state.filters.function !== "all" && fn.functionGroup !== state.filters.function) {
                    return false;
                  }
                  if (state.filters.tier !== "all" && tier.tierCode !== state.filters.tier) {
                    return false;
                  }
                  if (state.filters.posture !== "all" && row.postureState !== state.filters.posture) {
                    return false;
                  }
                  if (
                    state.filters.freshness !== "all" &&
                    row.evidenceFreshnessState !== state.filters.freshness
                  ) {
                    return false;
                  }
                  return true;
                });
              }

              function ensureSelection(visibleRows) {
                if (!visibleRows.length) {
                  state.selectedScopeRef = null;
                  return;
                }
                if (!visibleRows.some((row) => row.scopeRef === state.selectedScopeRef)) {
                  state.selectedScopeRef = visibleRows[0].scopeRef;
                }
                const selected = visibleRows.find((row) => row.scopeRef === state.selectedScopeRef);
                if (selected && !selected.currentBackupSetManifestRefs.includes(state.selectedBackupManifestId)) {
                  state.selectedBackupManifestId = selected.currentBackupSetManifestRefs[0] ?? null;
                }
              }

              function selectScope(scopeRef) {
                state.selectedScopeRef = scopeRef;
                render();
              }

              function selectBackup(manifestId) {
                state.selectedBackupManifestId = manifestId;
                render();
              }

              function populateFilters() {
                const functionOptions = [
                  ["all", "All functions"],
                  ...Array.from(
                    new Set(state.essential.essentialFunctionMap.map((row) => row.functionGroup)),
                  ).map((group) => [group, group.replace(/_/g, " ")]),
                ];
                const tierOptions = [
                  ["all", "All tiers"],
                  ...Array.from(new Set(state.tiers.recoveryTiers.map((row) => row.tierCode))).map((tier) => [
                    tier,
                    tier.replace(/_/g, " ").toUpperCase(),
                  ]),
                ];
                const postureOptions = [
                  ["all", "All postures"],
                  ["live_control", "Live control"],
                  ["diagnostic_only", "Diagnostic only"],
                  ["governed_recovery", "Governed recovery"],
                  ["blocked", "Blocked"],
                ];
                const freshnessOptions = [
                  ["all", "All evidence freshness"],
                  ["fresh", "Fresh"],
                  ["stale", "Stale"],
                  ["expired", "Expired"],
                  ["missing", "Missing"],
                ];

                const fields = [
                  ["function-filter", functionOptions, "function"],
                  ["tier-filter", tierOptions, "tier"],
                  ["posture-filter", postureOptions, "posture"],
                  ["freshness-filter", freshnessOptions, "freshness"],
                ];

                for (const [id, options, key] of fields) {
                  const select = document.getElementById(id);
                  select.innerHTML = options
                    .map(([value, label]) => `<option value="${escapeHtml(value)}">${escapeHtml(label)}</option>`)
                    .join("");
                  select.value = state.filters[key];
                  select.addEventListener("change", (event) => {
                    state.filters[key] = event.target.value;
                    render();
                  });
                }
              }

              function renderMasthead() {
                const summary = state.posture.summary;
                document.querySelector("[data-testid='metric-function-count']").textContent =
                  state.essential.summary.essential_function_count;
                document.querySelector("[data-testid='metric-manifest-count']").textContent =
                  summary.current_manifest_count;
                document.querySelector("[data-testid='metric-live-count']").textContent =
                  summary.live_control_scope_count;
                document.querySelector("[data-testid='metric-blocked-count']").textContent =
                  summary.blocked_scope_count;
              }

              function renderFunctionMap(visibleRows) {
                const mapGrid = document.getElementById("function-map-grid");
                mapGrid.innerHTML = visibleRows
                  .map((row) => {
                    const fn = getFunction(row);
                    const tier = getTier(row);
                    const selected = row.scopeRef === state.selectedScopeRef;
                    return `
                      <button
                        type="button"
                        class="function-node"
                        data-testid="function-node-${escapeHtml(row.functionCode)}"
                        data-selected="${selected ? "true" : "false"}"
                        data-scope-ref="${escapeHtml(row.scopeRef)}"
                      >
                        <div style="display:flex;justify-content:space-between;gap:10px;align-items:start;">
                          <div>
                            <strong>${escapeHtml(fn.functionLabel || row.functionCode)}</strong>
                            <div class="muted">${escapeHtml(fn.functionGroup || "unknown")} · ${escapeHtml(tier.tierCode || "")}</div>
                          </div>
                          <span class="${chipClass(row.postureState)}">${escapeHtml(row.postureState)}</span>
                        </div>
                        <div class="tag-row">
                          ${(fn.routeFamilyRefs || [])
                            .slice(0, 3)
                            .map((value) => `<span class="tag mono">${escapeHtml(value)}</span>`)
                            .join("")}
                        </div>
                        <div class="muted">${escapeHtml(fn.notes || row.notes || "")}</div>
                      </button>
                    `;
                  })
                  .join("");

                for (const element of mapGrid.querySelectorAll("[data-scope-ref]")) {
                  element.addEventListener("click", () => selectScope(element.dataset.scopeRef));
                }

                document.getElementById("function-map-parity-body").innerHTML = visibleRows
                  .map((row) => {
                    const fn = getFunction(row);
                    const tier = getTier(row);
                    return `
                      <tr>
                        <td>${escapeHtml(fn.functionLabel || row.functionCode)}</td>
                        <td class="mono">${escapeHtml(tier.tierCode || "")}</td>
                        <td>${escapeHtml(fn.functionState || "")}</td>
                        <td>${escapeHtml(row.postureState)}</td>
                      </tr>
                    `;
                  })
                  .join("");
              }

              function renderPosturePanel(visibleRows) {
                const counts = {
                  live_control: 0,
                  diagnostic_only: 0,
                  governed_recovery: 0,
                  blocked: 0,
                };
                for (const row of visibleRows) {
                  counts[row.postureState] += 1;
                }

                document.getElementById("posture-chip-grid").innerHTML = Object.entries(counts)
                  .map(
                    ([stateValue, count]) => `
                      <div class="function-node" data-testid="posture-chip-${escapeHtml(stateValue)}">
                        <div style="display:flex;justify-content:space-between;gap:12px;align-items:center;">
                          <strong>${escapeHtml(stateValue.replace(/_/g, " "))}</strong>
                          <span class="${chipClass(stateValue)}">${escapeHtml(String(count))}</span>
                        </div>
                        <div class="muted">${
                          stateValue === "live_control"
                            ? "Tuple fully aligned for live restore authority."
                            : stateValue === "diagnostic_only"
                              ? "Evidence view remains live, controls stay narrowed."
                              : stateValue === "governed_recovery"
                                ? "Only bounded recovery actions remain legal."
                                : "Fail-closed. Only halt or governed observation remains."
                        }</div>
                      </div>
                    `,
                  )
                  .join("");

                document.getElementById("posture-parity-body").innerHTML = state.posture.postureStateLaw
                  .map(
                    (row) => `
                      <tr>
                        <td>${escapeHtml(row.postureState)}</td>
                        <td>${escapeHtml(String(counts[row.postureState] || 0))}</td>
                        <td>${escapeHtml(row.legalWhen)}</td>
                      </tr>
                    `,
                  )
                  .join("");
              }

              function renderCards(visibleRows) {
                const grid = document.getElementById("posture-grid");
                grid.innerHTML = visibleRows
                  .map((row) => {
                    const tier = getTier(row);
                    const selected = row.scopeRef === state.selectedScopeRef;
                    return `
                      <button
                        type="button"
                        class="posture-card"
                        data-testid="posture-card-${escapeHtml(row.scopeRef)}"
                        data-selected="${selected ? "true" : "false"}"
                        data-scope-ref="${escapeHtml(row.scopeRef)}"
                      >
                        <div style="display:flex;justify-content:space-between;gap:12px;align-items:start;">
                          <div>
                            <strong>${escapeHtml(cardTitle(row))}</strong>
                            <div class="muted mono">${escapeHtml(row.scopeRef)}</div>
                          </div>
                          <span class="${chipClass(row.postureState)}">${escapeHtml(row.postureState)}</span>
                        </div>
                        <div class="chip-row">
                          <span class="chip">${escapeHtml(tier.tierCode || "")}</span>
                          <span class="${chipClass(row.evidenceFreshnessState)}">${escapeHtml(
                            row.evidenceFreshnessState,
                          )}</span>
                        </div>
                        <div class="muted">${escapeHtml(row.notes || "")}</div>
                        <div class="mono">Allowed: ${escapeHtml(row.allowedActionRefs.join(", "))}</div>
                      </button>
                    `;
                  })
                  .join("");

                for (const element of grid.querySelectorAll("[data-scope-ref]")) {
                  element.addEventListener("click", () => selectScope(element.dataset.scopeRef));
                }
              }

              function renderInspector(selectedRow) {
                const fn = selectedRow ? getFunction(selectedRow) : null;
                const tier = selectedRow ? getTier(selectedRow) : null;
                const backupRows = selectedRow
                  ? state.backupRows.filter((row) =>
                      selectedRow.currentBackupSetManifestRefs.includes(row.backup_set_manifest_id),
                    )
                  : [];
                const evidenceRows = selectedRow
                  ? state.evidenceRows.filter((row) => row.scope_ref === selectedRow.scopeRef)
                  : [];

                document.getElementById("inspector-summary").innerHTML = !selectedRow
                  ? "<div class='muted'>No scope matches the current filters.</div>"
                  : `
                      <strong>${escapeHtml(fn.functionLabel || selectedRow.scopeRef)}</strong>
                      <div class="chip-row" style="margin-top:10px;">
                        <span class="${chipClass(selectedRow.postureState)}">${escapeHtml(selectedRow.postureState)}</span>
                        <span class="chip">${escapeHtml(tier.tierCode || "")}</span>
                        <span class="${chipClass(selectedRow.evidenceFreshnessState)}">${escapeHtml(
                          selectedRow.evidenceFreshnessState,
                        )}</span>
                      </div>
                      <div class="muted" style="margin-top:12px;">${escapeHtml(selectedRow.notes || "")}</div>
                    `;

                document.getElementById("tuple-details").innerHTML = !selectedRow
                  ? ""
                  : [
                      ["Operational readiness", selectedRow.operationalReadinessSnapshotRef],
                      ["Trust verdict", selectedRow.releaseTrustFreezeVerdictRef],
                      ["Runbooks", selectedRow.requiredRunbookBindingRefs.join(", ")],
                      ["Journey proof", selectedRow.requiredJourneyProofRefs.slice(0, 3).join(", ")],
                      ["Allowed", selectedRow.allowedActionRefs.join(", ")],
                    ]
                      .map(
                        ([label, value]) => `
                          <div>
                            <div class="metric-label">${escapeHtml(label)}</div>
                            <div class="mono">${escapeHtml(value)}</div>
                          </div>
                        `,
                      )
                      .join("");

                document.getElementById("manifest-details").innerHTML = !backupRows.length
                  ? "<div class='muted'>No backup manifests are currently bound to the selected scope.</div>"
                  : backupRows
                      .map(
                        (row) => `
                          <div>
                            <div class="metric-label">${escapeHtml(row.dataset_label)}</div>
                            <div class="mono">${escapeHtml(row.backup_set_manifest_id)}</div>
                            <div class="muted">${escapeHtml(
                              `${row.manifest_state} · ${row.immutability_state} · ${row.compatibility_scope}`,
                            )}</div>
                          </div>
                        `,
                      )
                      .join("");

                document.getElementById("evidence-rail").innerHTML = !evidenceRows.length
                  ? "<div class='muted'>No evidence artifacts for the selected scope.</div>"
                  : evidenceRows
                      .map(
                        (row) => `
                          <article class="evidence-entry" data-testid="evidence-row-${escapeHtml(
                            row.recovery_evidence_artifact_id,
                          )}">
                            <div style="display:flex;justify-content:space-between;gap:10px;align-items:start;">
                              <strong>${escapeHtml(row.artifact_type)}</strong>
                              <span class="${chipClass(row.freshness_state)}">${escapeHtml(row.freshness_state)}</span>
                            </div>
                            <div class="mono" style="margin-top:8px;">${escapeHtml(
                              row.recovery_evidence_artifact_id,
                            )}</div>
                            <div class="muted" style="margin-top:8px;">${escapeHtml(row.artifact_state)}</div>
                          </article>
                        `,
                      )
                      .join("");
              }

              function renderBackupMatrix(selectedRow) {
                document.getElementById("backup-matrix-body").innerHTML = state.backupRows
                  .map((row) => {
                    const selected =
                      selectedRow &&
                      (row.backup_set_manifest_id === state.selectedBackupManifestId ||
                        selectedRow.currentBackupSetManifestRefs.includes(row.backup_set_manifest_id));
                    return `
                      <tr>
                        <td colspan="4" style="padding:0;">
                          <button
                            type="button"
                            class="backup-row-button table-button"
                            data-testid="backup-row-${escapeHtml(row.backup_set_manifest_id)}"
                            data-selected="${selected ? "true" : "false"}"
                            data-manifest-id="${escapeHtml(row.backup_set_manifest_id)}"
                            style="padding:12px 14px;display:grid;grid-template-columns:1.2fr 1.4fr 1.1fr 0.6fr;gap:12px;"
                          >
                            <span class="mono">${escapeHtml(row.backup_set_manifest_id)}</span>
                            <span>${escapeHtml(row.dataset_label)}</span>
                            <span>${escapeHtml(row.essential_function_refs)}</span>
                            <span>${escapeHtml(row.manifest_state)}</span>
                          </button>
                        </td>
                      </tr>
                    `;
                  })
                  .join("");

                for (const button of document.querySelectorAll("[data-manifest-id]")) {
                  button.addEventListener("click", () => selectBackup(button.dataset.manifestId));
                }
              }

              function renderRuleTable(visibleRows) {
                document.getElementById("posture-rule-body").innerHTML = visibleRows
                  .map((row) => {
                    const selected = row.scopeRef === state.selectedScopeRef;
                    return `
                      <tr>
                        <td colspan="4" style="padding:0;">
                          <button
                            type="button"
                            class="rule-row-button table-button"
                            data-testid="rule-row-${escapeHtml(row.scopeRef)}"
                            data-selected="${selected ? "true" : "false"}"
                            data-scope-ref="${escapeHtml(row.scopeRef)}"
                            style="padding:12px 14px;display:grid;grid-template-columns:1.1fr 0.8fr 0.7fr 1.4fr;gap:12px;"
                          >
                            <span>${escapeHtml(cardTitle(row))}</span>
                            <span>${escapeHtml(row.postureState)}</span>
                            <span>${escapeHtml(row.restoreValidationFreshnessState)}</span>
                            <span>${escapeHtml(row.blockerRefs.join(", ") || "none")}</span>
                          </button>
                        </td>
                      </tr>
                    `;
                  })
                  .join("");

                for (const button of document.querySelectorAll("[data-testid^='rule-row-']")) {
                  button.addEventListener("click", () => selectScope(button.dataset.scopeRef));
                }
              }

              function renderDefects() {
                document.getElementById("defect-strip-body").innerHTML = state.posture.defects
                  .map(
                    (defect) => `
                      <article class="defect">
                        <strong class="mono">${escapeHtml(defect.defectId)}</strong>
                        <div style="margin-top:6px;">${escapeHtml(defect.summary)}</div>
                        <div class="muted" style="margin-top:8px;">${escapeHtml(
                          `${defect.scopeRef} · ${defect.severity}`,
                        )}</div>
                      </article>
                    `,
                  )
                  .join("");
              }

              function handleCardKeyNavigation(event, visibleRows) {
                const cards = Array.from(document.querySelectorAll("[data-testid^='posture-card-']"));
                const activeIndex = cards.findIndex((element) => element === document.activeElement);
                if (activeIndex === -1) {
                  return;
                }
                const delta = event.key === "ArrowDown" || event.key === "ArrowRight" ? 1 : -1;
                if (!["ArrowDown", "ArrowRight", "ArrowUp", "ArrowLeft"].includes(event.key)) {
                  return;
                }
                event.preventDefault();
                const nextIndex = Math.max(0, Math.min(cards.length - 1, activeIndex + delta));
                const nextCard = cards[nextIndex];
                nextCard.focus();
                const nextScope = visibleRows[nextIndex]?.scopeRef;
                if (nextScope) {
                  state.selectedScopeRef = nextScope;
                  render();
                }
              }

              function handleBackupKeyNavigation(event) {
                const rows = Array.from(document.querySelectorAll("[data-testid^='backup-row-']"));
                const activeIndex = rows.findIndex((element) => element === document.activeElement);
                if (activeIndex === -1) {
                  return;
                }
                if (!["ArrowDown", "ArrowUp"].includes(event.key)) {
                  return;
                }
                event.preventDefault();
                const delta = event.key === "ArrowDown" ? 1 : -1;
                const nextIndex = Math.max(0, Math.min(rows.length - 1, activeIndex + delta));
                const nextRow = rows[nextIndex];
                nextRow.focus();
                state.selectedBackupManifestId = nextRow.dataset.manifestId;
                render();
              }

              function render() {
                const visibleRows = getVisibleRows();
                ensureSelection(visibleRows);
                const selectedRow = visibleRows.find((row) => row.scopeRef === state.selectedScopeRef) || null;

                renderMasthead();
                renderFunctionMap(visibleRows);
                renderPosturePanel(visibleRows);
                renderCards(visibleRows);
                renderInspector(selectedRow);
                renderBackupMatrix(selectedRow);
                renderRuleTable(visibleRows);
                renderDefects();

                const cardGrid = document.getElementById("posture-grid");
                cardGrid.onkeydown = (event) => handleCardKeyNavigation(event, visibleRows);
                document.getElementById("backup-matrix-body").onkeydown = handleBackupKeyNavigation;
              }

              async function loadData() {
                const [essential, tiers, backupText, posture, evidenceText] = await Promise.all([
                  fetch(PATHS.essential).then((response) => response.json()),
                  fetch(PATHS.tiers).then((response) => response.json()),
                  fetch(PATHS.backup).then((response) => response.text()),
                  fetch(PATHS.posture).then((response) => response.json()),
                  fetch(PATHS.evidence).then((response) => response.text()),
                ]);
                state.essential = essential;
                state.tiers = tiers;
                state.posture = posture;
                state.backupRows = parseCsv(backupText);
                state.evidenceRows = parseCsv(evidenceText);
                state.functionsByCode = Object.fromEntries(
                  essential.essentialFunctionMap.map((row) => [row.functionCode, row]),
                );
                state.tiersById = Object.fromEntries(
                  tiers.recoveryTiers.map((row) => [row.recoveryTierId, row]),
                );
                document.body.setAttribute(
                  "data-reduced-motion",
                  window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "true" : "false",
                );
                populateFilters();
                render();
              }

              loadData().catch((error) => {
                document.body.innerHTML = `<pre>${escapeHtml(error.stack || String(error))}</pre>`;
              });
            </script>
          </body>
        </html>
        """
    ).strip()


def build_package_source_block(posture_payload: dict[str, Any]) -> str:
    summary = posture_payload["summary"]
    return dedent(
        f"""
        {PACKAGE_EXPORTS_START}
        export const recoveryTupleBaselineCatalog = {{
          taskId: "{TASK_ID}",
          visualMode: "{VISUAL_MODE}",
          essentialFunctionCount: {summary["posture_scope_count"]},
          liveControlScopeCount: {summary["live_control_scope_count"]},
          blockedScopeCount: {summary["blocked_scope_count"]},
          backupManifestCount: {summary["backup_manifest_count"]},
          recoveryEvidenceArtifactCount: {summary["evidence_artifact_count"]},
          schemaArtifactPaths: ["packages/api-contracts/schemas/recovery-control-posture.schema.json"],
        }} as const;

        export const recoveryTupleBaselineSchemas = [
          {{
            schemaId: "RecoveryControlPosture",
            artifactPath: "packages/api-contracts/schemas/recovery-control-posture.schema.json",
            generatedByTask: "{TASK_ID}",
          }},
        ] as const;
        {PACKAGE_EXPORTS_END}
        """
    ).strip()


def build_package_public_api_test() -> str:
    return (
        dedent(
            """
            import fs from "node:fs";
            import path from "node:path";
            import { fileURLToPath } from "node:url";
            import { describe, expect, it } from "vitest";
            import {
              apiContractRegistryCatalog,
              apiContractRegistrySchemas,
              adapterContractProfileCatalog,
              adapterContractProfileSchemas,
              bootstrapSharedPackage,
              frontendContractManifestCatalog,
              frontendContractManifestSchemas,
              ownedContractFamilies,
              ownedObjectFamilies,
              packageContract,
              recoveryTupleBaselineCatalog,
              recoveryTupleBaselineSchemas,
              releaseVerificationLadderCatalog,
              releaseVerificationLadderSchemas,
              scopedMutationGateCatalog,
              scopedMutationGateSchemas,
            } from "../src/index.ts";
            import { foundationKernelFamilies } from "@vecells/domain-kernel";
            import { publishedEventFamilies } from "@vecells/event-contracts";

            const __filename = fileURLToPath(import.meta.url);
            const __dirname = path.dirname(__filename);
            const ROOT = path.resolve(__dirname, "..", "..", "..");

            describe("public package surface", () => {
              it("boots through documented public contracts", () => {
                expect(packageContract.packageName).toBe("@vecells/api-contracts");
                expect(bootstrapSharedPackage().contractFamilies).toBe(ownedContractFamilies.length);
                expect(Array.isArray(ownedObjectFamilies)).toBe(true);
                expect(Array.isArray(ownedContractFamilies)).toBe(true);
                expect(Array.isArray(foundationKernelFamilies)).toBe(true);
                expect(Array.isArray(publishedEventFamilies)).toBe(true);
              });

              it("publishes the seq_050 frontend manifest schema surface", () => {
                expect(frontendContractManifestCatalog.taskId).toBe("seq_050");
                expect(frontendContractManifestCatalog.manifestCount).toBe(9);
                expect(frontendContractManifestSchemas).toHaveLength(1);

                const schemaPath = path.join(ROOT, frontendContractManifestSchemas[0].artifactPath);
                expect(fs.existsSync(schemaPath)).toBe(true);
              });

              it("publishes the par_065 api contract registry schema surface", () => {
                expect(apiContractRegistryCatalog.taskId).toBe("par_065");
                expect(apiContractRegistryCatalog.routeFamilyBundleCount).toBe(19);
                expect(apiContractRegistryCatalog.clientCachePolicyCount).toBe(21);
                expect(apiContractRegistrySchemas).toHaveLength(4);

                for (const schema of apiContractRegistrySchemas) {
                  const schemaPath = path.join(ROOT, schema.artifactPath);
                  expect(fs.existsSync(schemaPath)).toBe(true);
                }
              });

              it("publishes the seq_056 scoped mutation schema surface", () => {
                expect(scopedMutationGateCatalog.taskId).toBe("seq_056");
                expect(scopedMutationGateCatalog.routeIntentRowCount).toBe(16);
                expect(scopedMutationGateSchemas).toHaveLength(2);

                for (const schema of scopedMutationGateSchemas) {
                  const schemaPath = path.join(ROOT, schema.artifactPath);
                  expect(fs.existsSync(schemaPath)).toBe(true);
                }
              });

              it("publishes the seq_057 adapter contract schema surface", () => {
                expect(adapterContractProfileCatalog.taskId).toBe("seq_057");
                expect(adapterContractProfileCatalog.adapterProfileCount).toBe(20);
                expect(adapterContractProfileCatalog.degradationProfileCount).toBe(20);
                expect(adapterContractProfileSchemas).toHaveLength(2);

                for (const schema of adapterContractProfileSchemas) {
                  const schemaPath = path.join(ROOT, schema.artifactPath);
                  expect(fs.existsSync(schemaPath)).toBe(true);
                }
              });

              it("publishes the seq_058 verification ladder schema surface", () => {
                expect(releaseVerificationLadderCatalog.taskId).toBe("seq_058");
                expect(releaseVerificationLadderCatalog.verificationScenarioCount).toBe(5);
                expect(releaseVerificationLadderCatalog.syntheticRecoveryCoverageCount).toBeGreaterThan(0);
                expect(releaseVerificationLadderSchemas).toHaveLength(1);

                const schemaPath = path.join(ROOT, releaseVerificationLadderSchemas[0].artifactPath);
                expect(fs.existsSync(schemaPath)).toBe(true);
              });

              it("publishes the seq_060 recovery posture schema surface", () => {
                expect(recoveryTupleBaselineCatalog.taskId).toBe("seq_060");
                expect(recoveryTupleBaselineCatalog.essentialFunctionCount).toBe(9);
                expect(recoveryTupleBaselineCatalog.backupManifestCount).toBeGreaterThan(0);
                expect(recoveryTupleBaselineSchemas).toHaveLength(1);

                const schemaPath = path.join(ROOT, recoveryTupleBaselineSchemas[0].artifactPath);
                expect(fs.existsSync(schemaPath)).toBe(true);
              });
            });
            """
        ).strip()
        + "\n"
    )


def update_api_contract_package(posture_payload: dict[str, Any]) -> None:
    source = PACKAGE_SOURCE_PATH.read_text()
    source = upsert_marked_block(
        source,
        PACKAGE_EXPORTS_START,
        PACKAGE_EXPORTS_END,
        build_package_source_block(posture_payload),
    )
    write_text(PACKAGE_SOURCE_PATH, source)
    write_text(PACKAGE_TEST_PATH, build_package_public_api_test())

    package = read_json(PACKAGE_PACKAGE_JSON_PATH)
    exports = package.setdefault("exports", {})
    exports["./schemas/recovery-control-posture.schema.json"] = "./schemas/recovery-control-posture.schema.json"
    write_json(PACKAGE_PACKAGE_JSON_PATH, package)


def update_root_package() -> None:
    package = read_json(ROOT_PACKAGE_PATH)
    package.setdefault("scripts", {}).update(ROOT_SCRIPT_UPDATES)
    write_json(ROOT_PACKAGE_PATH, package)


def update_playwright_package() -> None:
    package = read_json(PLAYWRIGHT_PACKAGE_PATH)
    package["description"] = (
        "Foundation, runtime topology, gateway, event, FHIR, frontend manifest, release parity, "
        "design contract, audit ledger, scope/isolation, lifecycle coordinator, scoped mutation gate, "
        "adapter contract, verification ladder, seed/simulator, and resilience-control browser checks."
    )
    package["scripts"] = PLAYWRIGHT_SCRIPT_UPDATES
    write_json(PLAYWRIGHT_PACKAGE_PATH, package)


def patch_engineering_builder() -> None:
    text = ENGINEERING_BUILDER_PATH.read_text()
    text = text.replace(
        "pnpm validate:seed-simulators && pnpm validate:scaffold",
        "pnpm validate:seed-simulators && pnpm validate:recovery-baseline && pnpm validate:scaffold",
    )
    if "build_backup_restore_and_recovery_tuple_baseline.py" not in text:
        text = text.replace(
            "python3 ./tools/analysis/build_seed_data_and_simulator_strategy.py && python3 ./tools/analysis/build_engineering_standards.py && pnpm format",
            "python3 ./tools/analysis/build_seed_data_and_simulator_strategy.py && "
            "python3 ./tools/analysis/build_backup_restore_and_recovery_tuple_baseline.py && "
            "python3 ./tools/analysis/build_engineering_standards.py && pnpm format",
        )
    if '"validate:recovery-baseline"' not in text:
        text = text.replace(
            '"validate:seed-simulators": "python3 ./tools/analysis/validate_seed_and_simulator_strategy.py",\n'
            '    "validate:standards": "python3 ./tools/analysis/validate_engineering_standards.py",',
            '"validate:seed-simulators": "python3 ./tools/analysis/validate_seed_and_simulator_strategy.py",\n'
            '    "validate:recovery-baseline": "python3 ./tools/analysis/validate_recovery_tuple_baseline.py",\n'
            '    "validate:standards": "python3 ./tools/analysis/validate_engineering_standards.py",',
        )
    write_text(ENGINEERING_BUILDER_PATH, text)


def build_validator() -> str:
    return (
        dedent(
            """
            #!/usr/bin/env python3
            from __future__ import annotations

            import csv
            import json
            from pathlib import Path


            ROOT = Path(__file__).resolve().parents[2]
            DATA_DIR = ROOT / "data" / "analysis"
            PACKAGE_SCHEMA_DIR = ROOT / "packages" / "api-contracts" / "schemas"

            ESSENTIAL_PATH = DATA_DIR / "essential_function_map.json"
            TIERS_PATH = DATA_DIR / "recovery_tiers.json"
            BACKUP_PATH = DATA_DIR / "backup_scope_matrix.csv"
            POSTURE_PATH = DATA_DIR / "recovery_control_posture_rules.json"
            EVIDENCE_PATH = DATA_DIR / "recovery_evidence_artifact_catalog.csv"
            RESTORE_SCHEMA_PATH = DATA_DIR / "restore_run_schema.json"
            PACKAGE_SCHEMA_PATH = PACKAGE_SCHEMA_DIR / "recovery-control-posture.schema.json"

            EXPECTED_FUNCTIONS = 9
            EXPECTED_POSTURE_COUNTS = {
                "live_control": 3,
                "diagnostic_only": 2,
                "governed_recovery": 2,
                "blocked": 2,
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
                essential = read_json(ESSENTIAL_PATH)
                tiers = read_json(TIERS_PATH)
                backup_rows = read_csv(BACKUP_PATH)
                posture = read_json(POSTURE_PATH)
                evidence_rows = read_csv(EVIDENCE_PATH)
                restore_schema = read_json(RESTORE_SCHEMA_PATH)
                package_schema = read_json(PACKAGE_SCHEMA_PATH)

                essential_rows = essential["essentialFunctionMap"]
                tier_rows = tiers["recoveryTiers"]
                posture_rows = posture["postureRules"]

                require(len(essential_rows) == EXPECTED_FUNCTIONS, "Essential function count drifted.")
                require(len(tier_rows) == EXPECTED_FUNCTIONS, "Recovery tier count drifted.")
                require(len(posture_rows) == EXPECTED_FUNCTIONS, "Recovery posture scope count drifted.")
                require(len(evidence_rows) == EXPECTED_FUNCTIONS * 2, "Recovery evidence artifact count drifted.")

                function_codes = [row["functionCode"] for row in essential_rows]
                require(len(set(function_codes)) == EXPECTED_FUNCTIONS, "Function codes are no longer unique.")
                tier_function_codes = [row["functionCode"] for row in tier_rows]
                require(set(tier_function_codes) == set(function_codes), "Tier rows drifted from the function map.")
                posture_function_codes = [row["functionCode"] for row in posture_rows]
                require(
                    set(posture_function_codes) == set(function_codes),
                    "Recovery posture rows drifted from the function map.",
                )

                backup_ids = {row["backup_set_manifest_id"] for row in backup_rows}
                require(len(backup_ids) == len(backup_rows), "Backup manifest ids are no longer unique.")
                require(
                    all(row["immutability_state"] == "immutable" for row in backup_rows),
                    "Backup manifest immutability drifted from the resilience baseline.",
                )
                require(
                    any(row["manifest_state"] == "stale" for row in backup_rows),
                    "The matrix no longer proves that stale manifests stay visible but non-authoritative.",
                )

                posture_counts = {key: 0 for key in EXPECTED_POSTURE_COUNTS}
                for row in posture_rows:
                    posture_counts[row["postureState"]] += 1
                    require(row["requiredRunbookBindingRefs"], f"{row['scopeRef']} lost runbook refs.")
                    require(row["allowedActionRefs"], f"{row['scopeRef']} lost allowed actions.")
                    require(
                        set(row["currentBackupSetManifestRefs"]).issubset(backup_ids),
                        f"{row['scopeRef']} references an unknown backup manifest.",
                    )
                    require(
                        all(ref in backup_ids for ref in row["currentBackupSetManifestRefs"]),
                        f"{row['scopeRef']} drifted from the backup matrix.",
                    )
                    if row["postureState"] == "live_control":
                        require(
                            row["restoreValidationFreshnessState"] == "fresh"
                            and row["dependencyCoverageState"] == "complete"
                            and row["journeyRecoveryCoverageState"] == "exact"
                            and row["backupManifestState"] == "current"
                            and not row["blockerRefs"],
                            f"{row['scopeRef']} is marked live_control without a fully aligned tuple.",
                        )
                    else:
                        require(
                            row["blockerRefs"] or row["backupManifestState"] != "current" or row["journeyRecoveryCoverageState"] != "exact",
                            f"{row['scopeRef']} lost its fail-closed explanation for non-live posture.",
                        )

                require(posture_counts == EXPECTED_POSTURE_COUNTS, "Recovery posture distribution drifted.")

                tier_rows_by_function = {row["functionCode"]: row for row in tier_rows}
                for function_row in essential_rows:
                    tier_row = tier_rows_by_function[function_row["functionCode"]]
                    require(
                        set(tier_row["requiredBackupScopeRefs"]).issubset(backup_ids),
                        f"{function_row['functionCode']} tier references unknown backup scopes.",
                    )
                    require(
                        tier_row["requiredJourneyProofRefs"],
                        f"{function_row['functionCode']} tier lost journey proof refs.",
                    )

                evidence_scope_refs = {row["scope_ref"] for row in evidence_rows}
                require(
                    evidence_scope_refs == {row["scopeRef"] for row in posture_rows},
                    "Recovery evidence artifacts no longer cover every posture scope.",
                )

                require(restore_schema["title"] == "RestoreRun", "RestoreRun schema title drifted.")
                require(
                    "restoreRunId" in restore_schema["required"]
                    and "resilienceActionSettlementRef" in restore_schema["required"],
                    "RestoreRun schema lost authoritative settlement requirements.",
                )
                require(
                    package_schema["title"] == "RecoveryControlPosture",
                    "Package schema title drifted from RecoveryControlPosture.",
                )
                require(
                    "postureState" in package_schema["required"]
                    and "releaseRecoveryDispositionRef" in package_schema["required"],
                    "Recovery control package schema lost critical posture fields.",
                )

                print("seq_060 recovery tuple baseline validation passed")


            if __name__ == "__main__":
                main()
            """
        ).strip()
        + "\n"
    )


def build_spec() -> str:
    return (
        dedent(
            """
            import fs from "node:fs";
            import http from "node:http";
            import path from "node:path";
            import { fileURLToPath } from "node:url";

            const __filename = fileURLToPath(import.meta.url);
            const __dirname = path.dirname(__filename);
            const ROOT = path.resolve(__dirname, "..", "..");
            const HTML_PATH = path.join(ROOT, "docs", "architecture", "60_resilience_control_lab.html");
            const ESSENTIAL_PATH = path.join(ROOT, "data", "analysis", "essential_function_map.json");
            const POSTURE_PATH = path.join(ROOT, "data", "analysis", "recovery_control_posture_rules.json");
            const BACKUP_PATH = path.join(ROOT, "data", "analysis", "backup_scope_matrix.csv");

            const ESSENTIAL_PAYLOAD = JSON.parse(fs.readFileSync(ESSENTIAL_PATH, "utf8"));
            const POSTURE_PAYLOAD = JSON.parse(fs.readFileSync(POSTURE_PATH, "utf8"));
            const BACKUP_ROWS = parseCsv(fs.readFileSync(BACKUP_PATH, "utf8"));

            export const resilienceControlCoverage = [
              "function filtering",
              "posture filtering",
              "tier filtering",
              "evidence freshness filtering",
              "card selection",
              "map and matrix and inspector synchronization",
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
                    rawUrl === "/" ? "/docs/architecture/60_resilience_control_lab.html" : rawUrl.split("?")[0];
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
                server.listen(4360, "127.0.0.1", () => resolve(server));
              });
            }

            async function run() {
              assertCondition(fs.existsSync(HTML_PATH), `Missing resilience lab HTML: ${HTML_PATH}`);
              const { chromium } = await importPlaywright();
              const server = await startStaticServer();
              const browser = await chromium.launch({ headless: true });
              const page = await browser.newPage({ viewport: { width: 1460, height: 1180 } });
              const url =
                process.env.RESILIENCE_CONTROL_LAB_URL ??
                "http://127.0.0.1:4360/docs/architecture/60_resilience_control_lab.html";

              try {
                await page.goto(url, { waitUntil: "networkidle" });
                await page.locator("[data-testid='function-map']").waitFor();
                await page.locator("[data-testid='posture-panel']").waitFor();
                await page.locator("[data-testid='inspector']").waitFor();
                await page.locator("[data-testid='evidence-rail']").waitFor();

                const initialCards = await page.locator("[data-testid^='posture-card-']").count();
                assertCondition(
                  initialCards === POSTURE_PAYLOAD.postureRules.length,
                  `Posture card count drifted: expected ${POSTURE_PAYLOAD.postureRules.length}, found ${initialCards}`,
                );

                await page.locator("[data-testid='function-filter']").selectOption("patient");
                const patientCards = await page.locator("[data-testid^='posture-card-']").count();
                assertCondition(patientCards === 2, `Expected 2 patient scopes, found ${patientCards}`);

                await page.locator("[data-testid='function-filter']").selectOption("all");
                await page.locator("[data-testid='posture-filter']").selectOption("blocked");
                const blockedCards = await page.locator("[data-testid^='posture-card-']").count();
                assertCondition(blockedCards === 2, `Expected 2 blocked scopes, found ${blockedCards}`);

                await page.locator("[data-testid='posture-filter']").selectOption("all");
                await page.locator("[data-testid='tier-filter']").selectOption("tier_0");
                const tierZeroCards = await page.locator("[data-testid^='posture-card-']").count();
                assertCondition(tierZeroCards === 2, `Expected 2 tier_0 scopes, found ${tierZeroCards}`);

                await page.locator("[data-testid='tier-filter']").selectOption("all");
                await page.locator("[data-testid='freshness-filter']").selectOption("stale");
                const staleCards = await page.locator("[data-testid^='posture-card-']").count();
                assertCondition(staleCards === 2, `Expected 2 stale-evidence scopes, found ${staleCards}`);

                await page.locator("[data-testid='freshness-filter']").selectOption("all");
                await page.locator("[data-testid='posture-card-scope_pharmacy_referral_recovery']").click();
                const inspectorText = await page.locator("[data-testid='inspector']").innerText();
                assertCondition(
                  inspectorText.includes("governed_recovery") &&
                    inspectorText.includes("BSM_060_PHARMACY_REFERRAL_STATE_V1"),
                  "Inspector lost the governed pharmacy recovery tuple details.",
                );

                const selectedNode = await page
                  .locator("[data-testid='function-node-ef_pharmacy_referral_reconciliation']")
                  .getAttribute("data-selected");
                assertCondition(selectedNode === "true", "Function map did not synchronize with the selected card.");

                const selectedRule = await page
                  .locator("[data-testid='rule-row-scope_pharmacy_referral_recovery']")
                  .getAttribute("data-selected");
                assertCondition(selectedRule === "true", "Rule table did not synchronize with the selected card.");

                const selectedBackup = await page
                  .locator("[data-testid='backup-row-BSM_060_PHARMACY_REFERRAL_STATE_V1']")
                  .getAttribute("data-selected");
                assertCondition(selectedBackup === "true", "Backup matrix did not synchronize with the selected card.");

                const visibleCards = await page.locator("[data-testid^='posture-card-']").count();
                const visibleNodes = await page.locator("[data-testid^='function-node-']").count();
                const parityRows = await page
                  .locator("[data-testid='function-map-parity-table'] tbody tr")
                  .count();
                assertCondition(
                  visibleCards === visibleNodes && visibleCards === parityRows,
                  "Function map or parity table drifted from the visible scope set.",
                );

                const postureChips = await page.locator("[data-testid^='posture-chip-']").count();
                const postureParityRows = await page
                  .locator("[data-testid='posture-parity-table'] tbody tr")
                  .count();
                assertCondition(
                  postureChips === 4 && postureParityRows === 4,
                  "Posture panel or parity table drifted from the four posture states.",
                );

                const evidenceRows = await page.locator("[data-testid^='evidence-row-']").count();
                assertCondition(evidenceRows === 2, `Expected 2 evidence rows for the selected scope, found ${evidenceRows}`);

                await page.locator("[data-testid='posture-card-scope_patient_entry_recovery']").focus();
                await page.keyboard.press("ArrowDown");
                const secondSelected = await page
                  .locator("[data-testid='posture-card-scope_patient_self_service_continuity']")
                  .getAttribute("data-selected");
                assertCondition(secondSelected === "true", "Arrow-down navigation no longer advances card selection.");

                await page.locator("[data-testid='backup-row-BSM_060_IDENTITY_ENTRY_STATE_V1']").focus();
                await page.keyboard.press("ArrowDown");
                const secondBackupSelected = await page
                  .locator("[data-testid='backup-row-BSM_060_PATIENT_CONTINUITY_READ_MODELS_V1']")
                  .getAttribute("data-selected");
                assertCondition(
                  secondBackupSelected === "true",
                  "Backup-row arrow navigation no longer advances selection.",
                );

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

            export const resilienceControlManifest = {
              task: ESSENTIAL_PAYLOAD.task_id,
              essentialFunctions: ESSENTIAL_PAYLOAD.summary.essential_function_count,
              liveControlScopes: POSTURE_PAYLOAD.summary.live_control_scope_count,
              blockedScopes: POSTURE_PAYLOAD.summary.blocked_scope_count,
              backupManifests: BACKUP_ROWS.length,
            };
            """
        ).strip()
        + "\n"
    )


def main() -> None:
    context = load_context()
    pack = build_recovery_data(context)

    essential_payload = pack["essential_payload"]
    tier_payload = pack["tier_payload"]
    backup_rows = pack["backup_rows"]
    posture_payload = pack["posture_payload"]
    evidence_rows = pack["evidence_rows"]

    write_json(ESSENTIAL_FUNCTION_MAP_PATH, essential_payload)
    write_json(RECOVERY_TIERS_PATH, tier_payload)
    write_csv(
        BACKUP_SCOPE_MATRIX_PATH,
        [
            "backup_set_manifest_id",
            "dataset_scope_ref",
            "dataset_label",
            "essential_function_refs",
            "snapshot_time",
            "immutability_state",
            "checksum_bundle_ref",
            "restore_compatibility_digest_ref",
            "runtime_publication_bundle_ref",
            "manifest_tuple_hash",
            "manifest_state",
            "verified_at",
            "restore_priority",
            "contains_phi",
            "compatibility_scope",
            "source_refs",
        ],
        backup_rows,
    )
    write_json(RESTORE_RUN_SCHEMA_PATH, build_restore_run_schema())
    write_json(RECOVERY_POSTURE_RULES_PATH, posture_payload)
    write_csv(
        RECOVERY_EVIDENCE_CATALOG_PATH,
        [
            "recovery_evidence_artifact_id",
            "artifact_type",
            "scope_ref",
            "function_code",
            "operational_readiness_snapshot_ref",
            "runbook_binding_refs",
            "producing_run_ref",
            "summary_ref",
            "artifact_presentation_contract_ref",
            "artifact_surface_context_ref",
            "artifact_mode_truth_projection_ref",
            "artifact_transfer_settlement_ref",
            "masking_policy_ref",
            "outbound_navigation_grant_ref",
            "artifact_state",
            "freshness_state",
            "phi_posture",
            "source_refs",
        ],
        evidence_rows,
    )
    write_json(PACKAGE_SCHEMA_PATH, build_recovery_control_posture_schema())

    write_text(
        BASELINE_DOC_PATH,
        build_baseline_doc(essential_payload, tier_payload, backup_rows, posture_payload),
    )
    write_text(
        TIER_POLICY_DOC_PATH,
        build_tier_policy_doc(essential_payload, tier_payload),
    )
    write_text(
        CONTROL_MATRIX_DOC_PATH,
        build_control_matrix_doc(backup_rows, posture_payload, evidence_rows),
    )
    write_text(LAB_PATH, build_lab_html())
    write_text(VALIDATOR_PATH, build_validator())
    write_text(SPEC_PATH, build_spec())

    update_api_contract_package(posture_payload)
    update_root_package()
    update_playwright_package()
    patch_engineering_builder()

    print(
        "seq_060 recovery tuple baseline artifacts generated: "
        f"{essential_payload['summary']['essential_function_count']} essential functions, "
        f"{tier_payload['summary']['tier_count']} recovery tiers, "
        f"{len(backup_rows)} backup manifests, "
        f"{posture_payload['summary']['posture_scope_count']} recovery posture scopes, "
        f"{len(evidence_rows)} recovery evidence artifacts."
    )


if __name__ == "__main__":
    main()
