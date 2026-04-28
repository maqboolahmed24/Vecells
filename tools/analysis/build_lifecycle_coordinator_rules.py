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

ROUTE_SCOPE_PATH = DATA_DIR / "route_to_scope_requirements.csv"
EVENT_CONTRACTS_PATH = DATA_DIR / "canonical_event_contracts.json"
FRONTEND_MANIFEST_PATH = DATA_DIR / "frontend_contract_manifests.json"
RELEASE_PARITY_PATH = DATA_DIR / "release_publication_parity_rules.json"
TENANT_SCOPE_PATH = DATA_DIR / "tenant_isolation_modes.json"

INPUTS_OUTPUT_PATH = DATA_DIR / "lifecycle_coordinator_inputs.csv"
SCHEMA_OUTPUT_PATH = DATA_DIR / "request_closure_record_schema.json"
TAXONOMY_OUTPUT_PATH = DATA_DIR / "closure_blocker_taxonomy.json"
SIGNAL_OUTPUT_PATH = DATA_DIR / "milestone_signal_matrix.csv"
REOPEN_OUTPUT_PATH = DATA_DIR / "reopen_trigger_matrix.csv"

STRATEGY_DOC_PATH = DOCS_DIR / "55_lifecycle_coordinator_strategy.md"
LEDGER_DOC_PATH = DOCS_DIR / "55_closure_blocker_ledger.md"
SIGNAL_RULES_DOC_PATH = DOCS_DIR / "55_milestone_signal_and_coordinator_rules.md"
LAB_PATH = DOCS_DIR / "55_lifecycle_coordinator_lab.html"

VALIDATOR_PATH = ROOT / "tools" / "analysis" / "validate_lifecycle_coordinator_rules.py"
SPEC_PATH = TESTS_DIR / "lifecycle-coordinator-lab.spec.js"
ROOT_PACKAGE_PATH = ROOT / "package.json"
PLAYWRIGHT_PACKAGE_PATH = TESTS_DIR / "package.json"
ENGINEERING_BUILDER_PATH = ROOT / "tools" / "analysis" / "build_engineering_standards.py"

TASK_ID = "seq_055"
VISUAL_MODE = "Lifecycle_Coordinator_Lab"
TIMESTAMP = datetime.now(timezone.utc).replace(microsecond=0).isoformat()
CAPTURED_ON = TIMESTAMP[:10]
MISSION = (
    "Define the canonical LifecycleCoordinator and closure-blocker law so request closure and "
    "governed reopen are derived exactly once from milestone signals, blocker facts, "
    "confirmation gates, degraded promises, active lineage branches, reachability duties, and "
    "terminal outcome evidence."
)

SOURCE_PRECEDENCE = [
    "prompt/055.md",
    "prompt/shared_operating_contract_046_to_055.md",
    "prompt/AGENT.md",
    "prompt/checklist.md",
    "docs/architecture/05_request_lineage_model.md",
    "docs/architecture/07_state_machine_atlas.md",
    "blueprint/phase-0-the-foundation-protocol.md#1.10 RequestLifecycleLease",
    "blueprint/phase-0-the-foundation-protocol.md#1.12 RequestClosureRecord",
    "blueprint/phase-0-the-foundation-protocol.md#1.21 RouteIntentBinding",
    "blueprint/phase-0-the-foundation-protocol.md#1.22 CommandActionRecord",
    "blueprint/phase-0-the-foundation-protocol.md#1.23 CommandSettlementRecord",
    "blueprint/phase-0-the-foundation-protocol.md#2.1 LifecycleCoordinator",
    "blueprint/phase-0-the-foundation-protocol.md#9.6 Closure evaluation algorithm",
    "blueprint/phase-0-the-foundation-protocol.md#9.7 Reopen triggers",
    "blueprint/phase-3-the-human-checkpoint.md#Closure and reopen rules",
    "blueprint/phase-4-the-booking-engine.md#Booking case model and state machine",
    "blueprint/phase-5-the-network-horizon.md#5A. Network coordination contract, case model, and state machine",
    "blueprint/phase-6-the-pharmacy-loop.md#6F. Outcome ingest, reconciliation, and closure",
    "blueprint/vecells-complete-end-to-end-flow.md#PL_CLOSE",
    "blueprint/forensic-audit-findings.md#Finding 32",
    "blueprint/forensic-audit-findings.md#Finding 45",
    "blueprint/forensic-audit-findings.md#Finding 57",
    "blueprint/forensic-audit-findings.md#Finding 58",
    "blueprint/forensic-audit-findings.md#Finding 59",
    "blueprint/forensic-audit-findings.md#Finding 60",
    "blueprint/forensic-audit-findings.md#Finding 67",
    "blueprint/forensic-audit-findings.md#Finding 68",
    "blueprint/forensic-audit-findings.md#Finding 69",
    "blueprint/forensic-audit-findings.md#Finding 70",
    "blueprint/forensic-audit-findings.md#Finding 71",
    "blueprint/forensic-audit-findings.md#Finding 72",
    "blueprint/forensic-audit-findings.md#Finding 73",
    "blueprint/forensic-audit-findings.md#Finding 74",
    "blueprint/forensic-audit-findings.md#Finding 75",
    "blueprint/forensic-audit-findings.md#Finding 76",
    "blueprint/forensic-audit-findings.md#Finding 77",
    "blueprint/forensic-audit-findings.md#Finding 78",
    "blueprint/forensic-audit-findings.md#Finding 79",
    "data/analysis/canonical_event_contracts.json",
    "data/analysis/frontend_contract_manifests.json",
    "data/analysis/release_publication_parity_rules.json",
    "data/analysis/tenant_isolation_modes.json",
    "data/analysis/route_to_scope_requirements.csv",
]

ROOT_SCRIPT_UPDATES = {
    "bootstrap": (
        "pnpm install && node ./tools/dev-bootstrap/index.mjs && pnpm codegen && "
        "pnpm validate:topology && pnpm validate:runtime-topology && pnpm validate:gateway-surface && "
        "pnpm validate:events && pnpm validate:fhir && pnpm validate:frontend && "
        "pnpm validate:release-parity && pnpm validate:design-publication && pnpm validate:audit-worm && "
        "pnpm validate:tenant-scope && pnpm validate:lifecycle && pnpm validate:scaffold && "
        "pnpm validate:services && pnpm validate:domains && pnpm validate:standards"
    ),
    "check": (
        "pnpm lint && pnpm format:check && pnpm typecheck && pnpm test && "
        "pnpm validate:topology && pnpm validate:runtime-topology && pnpm validate:gateway-surface && "
        "pnpm validate:events && pnpm validate:fhir && pnpm validate:frontend && "
        "pnpm validate:release-parity && pnpm validate:design-publication && pnpm validate:audit-worm && "
        "pnpm validate:tenant-scope && pnpm validate:lifecycle && pnpm validate:scaffold && "
        "pnpm validate:services && pnpm validate:domains && pnpm validate:standards"
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
        "python3 ./tools/analysis/build_engineering_standards.py && pnpm format"
    ),
    "validate:lifecycle": "python3 ./tools/analysis/validate_lifecycle_coordinator_rules.py",
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
        "node --check lifecycle-coordinator-lab.spec.js"
    ),
    "lint": (
        "eslint foundation-shell-gallery.spec.js runtime-topology-atlas.spec.js "
        "gateway-surface-studio.spec.js event-registry-studio.spec.js "
        "fhir-representation-atlas.spec.js frontend-contract-studio.spec.js "
        "release-parity-cockpit.spec.js design-contract-studio.spec.js "
        "audit-ledger-explorer.spec.js scope-isolation-atlas.spec.js "
        "lifecycle-coordinator-lab.spec.js"
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
        "node lifecycle-coordinator-lab.spec.js"
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
        "node --check lifecycle-coordinator-lab.spec.js"
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
        "node lifecycle-coordinator-lab.spec.js --run"
    ),
}

ASSUMPTIONS = [
    {
        "assumptionId": "ASSUMPTION_055_EVENT_CATALOG_PHASE0_CLOSE_SURFACES",
        "statement": (
            "Direct self-care and admin-resolution terminal outcomes currently settle through triage "
            "and communication contracts in the event registry; seq_055 therefore binds those child "
            "signals to coordinator ingestion instead of inventing a second request-closing event family."
        ),
        "source_refs": [
            "prompt/055.md",
            "blueprint/phase-3-the-human-checkpoint.md",
            "data/analysis/canonical_event_contracts.json",
        ],
    },
    {
        "assumptionId": "ASSUMPTION_055_CLOSE_DECISION_REQUIRES_CURRENT_LINEAGE_EPOCH",
        "statement": (
            "Every close or defer verdict is bound to the current LineageFence epoch even when the "
            "blocking facts are empty, so replayed or stale child-domain milestones cannot settle a later "
            "closure decision."
        ),
        "source_refs": [
            "prompt/055.md",
            "blueprint/phase-0-the-foundation-protocol.md#1.11 LineageFence",
            "blueprint/phase-0-the-foundation-protocol.md#9.6 Closure evaluation algorithm",
        ],
    },
]

DEFECTS = [
    {
        "defectId": "GAP_055_APPOINTMENT_SUCCESS_NO_LONGER_SELF_CLOSES",
        "state": "closed_by_contract",
        "summary": (
            "Booking and appointment success now emit milestone evidence only. The coordinator alone "
            "derives request-level closure or milestone change, closing finding 32 and finding 74."
        ),
        "source_refs": [
            "prompt/055.md",
            "blueprint/forensic-audit-findings.md#Finding 32",
            "blueprint/forensic-audit-findings.md#Finding 74",
        ],
    },
    {
        "defectId": "GAP_055_CLOSURE_IS_GOVERNED_DECISION",
        "state": "closed_by_contract",
        "summary": (
            "Closure is no longer a passive terminal. Every outcome persists RequestClosureRecord(decision = close | defer) "
            "under LifecycleCoordinator control before Request.workflowState may become closed."
        ),
        "source_refs": [
            "prompt/055.md",
            "blueprint/forensic-audit-findings.md#Finding 45",
            "blueprint/phase-0-the-foundation-protocol.md#2.1 LifecycleCoordinator",
        ],
    },
    {
        "defectId": "GAP_055_PERSISTED_BLOCKER_OMISSIONS_CLOSED",
        "state": "closed_by_contract",
        "summary": (
            "Duplicate, fallback, identity-repair, PHI-grant, and reachability blockers are explicit schema "
            "fields and taxonomy rows, closing findings 57 to 60."
        ),
        "source_refs": [
            "prompt/055.md",
            "blueprint/forensic-audit-findings.md#Finding 57",
            "blueprint/forensic-audit-findings.md#Finding 60",
        ],
    },
    {
        "defectId": "GAP_055_CONFIRMATION_AND_BLOCKER_EVENTS_BOUND",
        "state": "closed_by_contract",
        "summary": (
            "The coordinator now depends on canonical confirmation-gate and request.closure_blockers.changed events "
            "instead of reconstructing closure posture from local case state, closing findings 67 and 68."
        ),
        "source_refs": [
            "prompt/055.md",
            "blueprint/forensic-audit-findings.md#Finding 67",
            "blueprint/forensic-audit-findings.md#Finding 68",
        ],
    },
    {
        "defectId": "GAP_055_CHILD_DOMAINS_SIGNAL_ONLY",
        "state": "closed_by_contract",
        "summary": (
            "Wrong-patient repair, triage, booking, hub, and pharmacy branches now emit one-way milestone or blocker "
            "signals for coordinator consumption; they do not write canonical request truth directly."
        ),
        "source_refs": [
            "prompt/055.md",
            "blueprint/forensic-audit-findings.md#Finding 69",
            "blueprint/forensic-audit-findings.md#Finding 79",
        ],
    },
    {
        "defectId": "GAP_055_WORKFLOW_STATE_REMAINS_MILESTONE_ONLY",
        "state": "closed_by_contract",
        "summary": (
            "Repair, reconciliation, degraded promises, and confirmation ambiguity remain blocker facts, not "
            "Request.workflowState values. That closes the blocker-as-workflow-state regressions."
        ),
        "source_refs": [
            "prompt/055.md",
            "blueprint/forensic-audit-findings.md#Finding 56",
            "blueprint/forensic-audit-findings.md#Finding 70",
            "blueprint/forensic-audit-findings.md#Finding 78",
        ],
    },
]

BLOCKER_CLASS_DEFINITIONS = [
    {
        "blockerClassId": "BCL_055_LEASE_CONFLICT",
        "blockerClassKey": "lease_conflict",
        "blockerLabel": "Lifecycle lease conflict",
        "group": "control",
        "sourceObjectType": "RequestLifecycleLease",
        "requestClosureRecordField": "blockingLeaseRefs[]",
        "materializedSetRef": "Request.currentClosureBlockerRefs[]",
        "eventNames": [
            "request.lease.acquired",
            "request.lease.released",
            "request.lease.broken",
            "request.lease.takeover_committed",
            "request.closure_blockers.changed",
        ],
        "evaluationCheckRefs": ["CHECK_055_01_LEASES_CLEAR", "CHECK_055_09_MATERIALIZED_SETS_EMPTY"],
        "workflowStateEncodingForbidden": True,
        "clearsVia": "lease released, remediated expiry, or takeover committed under fresh ownership epoch",
        "source_refs": [
            "blueprint/phase-0-the-foundation-protocol.md#1.10 RequestLifecycleLease",
            "blueprint/phase-0-the-foundation-protocol.md#9.6 Closure evaluation algorithm",
        ],
    },
    {
        "blockerClassId": "BCL_055_SAFETY_PREEMPTION",
        "blockerClassKey": "safety_preemption",
        "blockerLabel": "Safety preemption",
        "group": "control",
        "sourceObjectType": "SafetyPreemptionRecord",
        "requestClosureRecordField": "blockingPreemptionRefs[]",
        "materializedSetRef": "Request.currentClosureBlockerRefs[]",
        "eventNames": [
            "safety.preempted",
            "safety.decision_settled",
            "request.closure_blockers.changed",
        ],
        "evaluationCheckRefs": ["CHECK_055_02_PREEMPTION_CLEAR", "CHECK_055_09_MATERIALIZED_SETS_EMPTY"],
        "workflowStateEncodingForbidden": True,
        "clearsVia": "safety settlement or urgent diversion completion under the current lineage epoch",
        "source_refs": [
            "blueprint/phase-0-the-foundation-protocol.md#9.6 Closure evaluation algorithm",
            "blueprint/phase-3-the-human-checkpoint.md",
        ],
    },
    {
        "blockerClassId": "BCL_055_APPROVAL_CHECKPOINT",
        "blockerClassKey": "approval_checkpoint",
        "blockerLabel": "Approval or acknowledgement checkpoint",
        "group": "gate",
        "sourceObjectType": "ApprovalCheckpoint",
        "requestClosureRecordField": "blockingApprovalRefs[]",
        "materializedSetRef": "Request.currentClosureBlockerRefs[]",
        "eventNames": [
            "triage.task.settled",
            "hub.practice.notified",
            "request.closure_blockers.changed",
        ],
        "evaluationCheckRefs": ["CHECK_055_03_APPROVALS_CLEAR", "CHECK_055_14_REQUIRED_ACKS_HANDLED"],
        "workflowStateEncodingForbidden": True,
        "clearsVia": "approval settled, acknowledgement satisfied, or policy downgrade recorded by the coordinator",
        "source_refs": [
            "blueprint/phase-3-the-human-checkpoint.md#Closure and reopen rules",
            "blueprint/phase-5-the-network-horizon.md#5A. Network coordination contract, case model, and state machine",
        ],
    },
    {
        "blockerClassId": "BCL_055_OUTCOME_RECONCILIATION",
        "blockerClassKey": "outcome_reconciliation",
        "blockerLabel": "Outcome reconciliation gate",
        "group": "gate",
        "sourceObjectType": "ExternalConfirmationGate or PharmacyOutcomeReconciliationGate",
        "requestClosureRecordField": "blockingReconciliationRefs[]",
        "materializedSetRef": "Request.currentClosureBlockerRefs[]",
        "eventNames": [
            "booking.commit.reconciliation_pending",
            "booking.commit.ambiguous",
            "pharmacy.outcome.unmatched",
            "pharmacy.outcome.reconciled",
            "request.closure_blockers.changed",
        ],
        "evaluationCheckRefs": ["CHECK_055_04_OUTCOME_TRUTH_CLEAR", "CHECK_055_05_PHARMACY_RECONCILIATION_CLEAR"],
        "workflowStateEncodingForbidden": True,
        "clearsVia": "authoritative reconciliation or explicit manual resolution on the current lineage",
        "source_refs": [
            "blueprint/phase-4-the-booking-engine.md",
            "blueprint/phase-6-the-pharmacy-loop.md#6F. Outcome ingest, reconciliation, and closure",
        ],
    },
    {
        "blockerClassId": "BCL_055_CONFIRMATION_GATE",
        "blockerClassKey": "confirmation_gate",
        "blockerLabel": "External confirmation gate",
        "group": "gate",
        "sourceObjectType": "ExternalConfirmationGate",
        "requestClosureRecordField": "blockingConfirmationRefs[]",
        "materializedSetRef": "Request.currentConfirmationGateRefs[]",
        "eventNames": [
            "confirmation.gate.created",
            "confirmation.gate.confirmed",
            "confirmation.gate.disputed",
            "confirmation.gate.expired",
            "confirmation.gate.cancelled",
            "request.closure_blockers.changed",
        ],
        "evaluationCheckRefs": ["CHECK_055_03_APPROVALS_CLEAR", "CHECK_055_04_OUTCOME_TRUTH_CLEAR", "CHECK_055_15_CONSENT_AND_DEGRADED_CONFIRMATION_CLEAR"],
        "workflowStateEncodingForbidden": True,
        "clearsVia": "confirmed, cancelled, expired under policy, or downgraded to non-blocking operational follow-up",
        "source_refs": [
            "blueprint/phase-0-the-foundation-protocol.md#9.6 Closure evaluation algorithm",
            "blueprint/forensic-audit-findings.md#Finding 67",
        ],
    },
    {
        "blockerClassId": "BCL_055_LINEAGE_CASE_LINK",
        "blockerClassKey": "lineage_case_link_active",
        "blockerLabel": "Active lineage branch",
        "group": "lineage",
        "sourceObjectType": "LineageCaseLink",
        "requestClosureRecordField": "blockingLineageCaseLinkRefs[]",
        "materializedSetRef": "Request.currentClosureBlockerRefs[]",
        "eventNames": ["request.updated", "request.closure_blockers.changed"],
        "evaluationCheckRefs": ["CHECK_055_10_LINEAGE_LINKS_SETTLED", "CHECK_055_13_EPISODE_POLICY_CLEAR"],
        "workflowStateEncodingForbidden": True,
        "clearsVia": "return, completion, supersession, or compensation settlement on every active child branch",
        "source_refs": [
            "docs/architecture/05_request_lineage_model.md",
            "blueprint/phase-0-the-foundation-protocol.md#9.6 Closure evaluation algorithm",
        ],
    },
    {
        "blockerClassId": "BCL_055_DUPLICATE_REVIEW",
        "blockerClassKey": "duplicate_review",
        "blockerLabel": "Duplicate review required",
        "group": "case",
        "sourceObjectType": "DuplicateCluster",
        "requestClosureRecordField": "blockingDuplicateClusterRefs[]",
        "materializedSetRef": "Request.currentClosureBlockerRefs[]",
        "eventNames": [
            "request.duplicate.review_required",
            "request.duplicate.resolved",
            "request.closure_blockers.changed",
        ],
        "evaluationCheckRefs": ["CHECK_055_06_CASE_REPAIR_CLEAR", "CHECK_055_09_MATERIALIZED_SETS_EMPTY"],
        "workflowStateEncodingForbidden": True,
        "clearsVia": "duplicate cluster resolved or superseded under explicit review decision",
        "source_refs": [
            "blueprint/forensic-audit-findings.md#Finding 57",
            "docs/architecture/05_request_lineage_model.md",
        ],
    },
    {
        "blockerClassId": "BCL_055_FALLBACK_REVIEW",
        "blockerClassKey": "fallback_review",
        "blockerLabel": "Fallback review case open",
        "group": "case",
        "sourceObjectType": "FallbackReviewCase",
        "requestClosureRecordField": "blockingFallbackCaseRefs[]",
        "materializedSetRef": "Request.currentClosureBlockerRefs[]",
        "eventNames": [
            "exception.review_case.opened",
            "exception.review_case.recovered",
            "request.closure_blockers.changed",
        ],
        "evaluationCheckRefs": ["CHECK_055_06_CASE_REPAIR_CLEAR", "CHECK_055_09_MATERIALIZED_SETS_EMPTY"],
        "workflowStateEncodingForbidden": True,
        "clearsVia": "fallback review recovered or explicitly superseded by the coordinator",
        "source_refs": [
            "blueprint/forensic-audit-findings.md#Finding 58",
            "blueprint/phase-0-the-foundation-protocol.md#9.6 Closure evaluation algorithm",
        ],
    },
    {
        "blockerClassId": "BCL_055_IDENTITY_REPAIR",
        "blockerClassKey": "identity_repair",
        "blockerLabel": "Identity repair active",
        "group": "case",
        "sourceObjectType": "IdentityRepairCase",
        "requestClosureRecordField": "blockingIdentityRepairRefs[]",
        "materializedSetRef": "Request.currentClosureBlockerRefs[]",
        "eventNames": [
            "identity.repair_case.opened",
            "identity.repair_case.corrected",
            "identity.repair_case.closed",
            "request.closure_blockers.changed",
        ],
        "evaluationCheckRefs": ["CHECK_055_06_CASE_REPAIR_CLEAR", "CHECK_055_09_MATERIALIZED_SETS_EMPTY"],
        "workflowStateEncodingForbidden": True,
        "clearsVia": "repair freeze released, compensated, or corrected on the current lineage branch",
        "source_refs": [
            "blueprint/forensic-audit-findings.md#Finding 59",
            "blueprint/forensic-audit-findings.md#Finding 69",
        ],
    },
    {
        "blockerClassId": "BCL_055_LIVE_PHI_GRANT",
        "blockerClassKey": "live_phi_grant",
        "blockerLabel": "Live PHI-bearing grant",
        "group": "control",
        "sourceObjectType": "AccessGrant",
        "requestClosureRecordField": "blockingGrantRefs[]",
        "materializedSetRef": "Request.currentClosureBlockerRefs[]",
        "eventNames": [
            "access.grant.issued",
            "access.grant.redeemed",
            "access.grant.revoked",
            "access.grant.superseded",
            "request.closure_blockers.changed",
        ],
        "evaluationCheckRefs": ["CHECK_055_08_GRANTS_CLEAR", "CHECK_055_09_MATERIALIZED_SETS_EMPTY"],
        "workflowStateEncodingForbidden": True,
        "clearsVia": "grant revoked, expired, or superseded under current scope and route authority",
        "source_refs": [
            "blueprint/forensic-audit-findings.md#Finding 60",
            "blueprint/phase-0-the-foundation-protocol.md#9.6 Closure evaluation algorithm",
        ],
    },
    {
        "blockerClassId": "BCL_055_REACHABILITY_DEPENDENCY",
        "blockerClassKey": "reachability_dependency",
        "blockerLabel": "Reachability repair open",
        "group": "case",
        "sourceObjectType": "ReachabilityDependency",
        "requestClosureRecordField": "blockingReachabilityRefs[]",
        "materializedSetRef": "Request.currentClosureBlockerRefs[]",
        "eventNames": [
            "reachability.dependency.created",
            "reachability.dependency.failed",
            "reachability.repair.started",
            "reachability.dependency.repaired",
            "request.closure_blockers.changed",
        ],
        "evaluationCheckRefs": ["CHECK_055_07_REACHABILITY_CLEAR", "CHECK_055_09_MATERIALIZED_SETS_EMPTY"],
        "workflowStateEncodingForbidden": True,
        "clearsVia": "current promise has no broken contact-route dependency and repair settled under fresh evidence",
        "source_refs": [
            "blueprint/forensic-audit-findings.md#Finding 60",
            "blueprint/phase-6-the-pharmacy-loop.md",
        ],
    },
    {
        "blockerClassId": "BCL_055_DEGRADED_PROMISE",
        "blockerClassKey": "degraded_promise",
        "blockerLabel": "Degraded promise still current",
        "group": "promise",
        "sourceObjectType": "DegradedPromise or consent-pending dependency",
        "requestClosureRecordField": "blockingDegradedPromiseRefs[]",
        "materializedSetRef": "Request.currentClosureBlockerRefs[]",
        "eventNames": [
            "confirmation.gate.created",
            "communication.receipt.enveloped",
            "request.closure_blockers.changed",
        ],
        "evaluationCheckRefs": ["CHECK_055_14_REQUIRED_ACKS_HANDLED", "CHECK_055_15_CONSENT_AND_DEGRADED_CONFIRMATION_CLEAR"],
        "workflowStateEncodingForbidden": True,
        "clearsVia": "current promise satisfied, consent checkpoint clear, or degraded confirmation explicitly downgraded by policy",
        "source_refs": [
            "prompt/055.md",
            "blueprint/phase-0-the-foundation-protocol.md#9.6 Closure evaluation algorithm",
        ],
    },
]

EVALUATION_CHECK_DEFINITIONS = [
    {
        "checkId": "CHECK_055_01_LEASES_CLEAR",
        "order": 1,
        "title": "Leases clear",
        "question": "No active, releasing, unremediated expired, or broken RequestLifecycleLease remains.",
        "requestClosureRecordFieldRefs": ["blockingLeaseRefs[]"],
        "deferReasonCode": "LEASE_ACTIVE_OR_BROKEN",
        "source_refs": [
            "blueprint/phase-0-the-foundation-protocol.md#9.6 Closure evaluation algorithm",
        ],
    },
    {
        "checkId": "CHECK_055_02_PREEMPTION_CLEAR",
        "order": 2,
        "title": "Safety preemption clear",
        "question": "No pending SafetyPreemptionRecord remains on the lineage.",
        "requestClosureRecordFieldRefs": ["blockingPreemptionRefs[]"],
        "deferReasonCode": "SAFETY_PREEMPTION_OPEN",
        "source_refs": [
            "blueprint/phase-0-the-foundation-protocol.md#9.6 Closure evaluation algorithm",
        ],
    },
    {
        "checkId": "CHECK_055_03_APPROVALS_CLEAR",
        "order": 3,
        "title": "Approvals and confirmations clear",
        "question": "No unresolved approval or ExternalConfirmationGate remains unless policy explicitly downgrades it.",
        "requestClosureRecordFieldRefs": ["blockingApprovalRefs[]", "blockingConfirmationRefs[]"],
        "deferReasonCode": "APPROVAL_OR_CONFIRMATION_PENDING",
        "source_refs": [
            "blueprint/phase-0-the-foundation-protocol.md#9.6 Closure evaluation algorithm",
        ],
    },
    {
        "checkId": "CHECK_055_04_OUTCOME_TRUTH_CLEAR",
        "order": 4,
        "title": "Outcome truth settled",
        "question": "No disputed booking, dispatch, pharmacy outcome, or external confirmation state remains.",
        "requestClosureRecordFieldRefs": ["blockingReconciliationRefs[]", "blockingConfirmationRefs[]"],
        "deferReasonCode": "OUTCOME_TRUTH_DISPUTED",
        "source_refs": [
            "blueprint/phase-0-the-foundation-protocol.md#9.6 Closure evaluation algorithm",
            "blueprint/phase-4-the-booking-engine.md",
            "blueprint/phase-6-the-pharmacy-loop.md",
        ],
    },
    {
        "checkId": "CHECK_055_05_PHARMACY_RECONCILIATION_CLEAR",
        "order": 5,
        "title": "Pharmacy reconciliation clear",
        "question": "No PharmacyOutcomeReconciliationGate(blockingClosureState = blocks_close) remains.",
        "requestClosureRecordFieldRefs": ["blockingReconciliationRefs[]"],
        "deferReasonCode": "PHARMACY_RECONCILIATION_OPEN",
        "source_refs": [
            "blueprint/phase-0-the-foundation-protocol.md#9.6 Closure evaluation algorithm",
            "blueprint/phase-6-the-pharmacy-loop.md#6F. Outcome ingest, reconciliation, and closure",
        ],
    },
    {
        "checkId": "CHECK_055_06_CASE_REPAIR_CLEAR",
        "order": 6,
        "title": "Repair and review clear",
        "question": "No active IdentityRepairCase, DuplicateCluster(review_required), or FallbackReviewCase remains.",
        "requestClosureRecordFieldRefs": [
            "blockingDuplicateClusterRefs[]",
            "blockingFallbackCaseRefs[]",
            "blockingIdentityRepairRefs[]",
        ],
        "deferReasonCode": "REPAIR_OR_REVIEW_OPEN",
        "source_refs": [
            "blueprint/phase-0-the-foundation-protocol.md#9.6 Closure evaluation algorithm",
            "blueprint/forensic-audit-findings.md#Finding 57",
            "blueprint/forensic-audit-findings.md#Finding 59",
        ],
    },
    {
        "checkId": "CHECK_055_07_REACHABILITY_CLEAR",
        "order": 7,
        "title": "Reachability clear",
        "question": "No active reachability repair or contact-route dependency remains for any current promise.",
        "requestClosureRecordFieldRefs": ["blockingReachabilityRefs[]"],
        "deferReasonCode": "REACHABILITY_REPAIR_OPEN",
        "source_refs": [
            "blueprint/phase-0-the-foundation-protocol.md#9.6 Closure evaluation algorithm",
            "blueprint/forensic-audit-findings.md#Finding 60",
        ],
    },
    {
        "checkId": "CHECK_055_08_GRANTS_CLEAR",
        "order": 8,
        "title": "PHI grants clear",
        "question": "No active PHI-bearing public, continuation, or transactional grant remains.",
        "requestClosureRecordFieldRefs": ["blockingGrantRefs[]"],
        "deferReasonCode": "LIVE_PHI_GRANT_PRESENT",
        "source_refs": [
            "blueprint/phase-0-the-foundation-protocol.md#9.6 Closure evaluation algorithm",
            "blueprint/forensic-audit-findings.md#Finding 60",
        ],
    },
    {
        "checkId": "CHECK_055_09_MATERIALIZED_SETS_EMPTY",
        "order": 9,
        "title": "Materialized sets empty",
        "question": "Request and episode currentClosureBlockerRefs/currentConfirmationGateRefs are empty after coordinator materialization.",
        "requestClosureRecordFieldRefs": [
            "blockingLeaseRefs[]",
            "blockingPreemptionRefs[]",
            "blockingApprovalRefs[]",
            "blockingReconciliationRefs[]",
            "blockingConfirmationRefs[]",
            "blockingLineageCaseLinkRefs[]",
            "blockingDuplicateClusterRefs[]",
            "blockingFallbackCaseRefs[]",
            "blockingIdentityRepairRefs[]",
            "blockingGrantRefs[]",
            "blockingReachabilityRefs[]",
            "blockingDegradedPromiseRefs[]",
        ],
        "deferReasonCode": "MATERIALIZED_BLOCKERS_PRESENT",
        "source_refs": [
            "blueprint/forensic-audit-findings.md#Finding 71",
            "blueprint/phase-0-the-foundation-protocol.md#9.6 Closure evaluation algorithm",
        ],
    },
    {
        "checkId": "CHECK_055_10_LINEAGE_LINKS_SETTLED",
        "order": 10,
        "title": "Lineage links settled",
        "question": "No LineageCaseLink remains proposed, acknowledged, active, or returned without governed settlement.",
        "requestClosureRecordFieldRefs": ["blockingLineageCaseLinkRefs[]"],
        "deferReasonCode": "LINEAGE_BRANCH_STILL_ACTIVE",
        "source_refs": [
            "blueprint/phase-0-the-foundation-protocol.md#9.6 Closure evaluation algorithm",
            "docs/architecture/05_request_lineage_model.md",
        ],
    },
    {
        "checkId": "CHECK_055_11_COMMAND_FOLLOWING_CONSUMED",
        "order": 11,
        "title": "Command-following projections consumed",
        "question": "Required command_following projections have consumed the required causal token.",
        "requestClosureRecordFieldRefs": [],
        "deferReasonCode": "COMMAND_FOLLOWING_PROJECTION_PENDING",
        "source_refs": [
            "blueprint/phase-0-the-foundation-protocol.md#9.6 Closure evaluation algorithm",
            "data/analysis/frontend_contract_manifests.json",
            "data/analysis/release_publication_parity_rules.json",
        ],
    },
    {
        "checkId": "CHECK_055_12_TERMINAL_OUTCOME_PRESENT",
        "order": 12,
        "title": "Terminal outcome present",
        "question": "A terminal outcome exists for the request before closure is permitted.",
        "requestClosureRecordFieldRefs": [],
        "deferReasonCode": "TERMINAL_OUTCOME_MISSING",
        "source_refs": [
            "blueprint/phase-0-the-foundation-protocol.md#9.6 Closure evaluation algorithm",
            "docs/architecture/05_request_lineage_model.md",
        ],
    },
    {
        "checkId": "CHECK_055_13_EPISODE_POLICY_CLEAR",
        "order": 13,
        "title": "Episode policy clear",
        "question": "Sibling requests and branches satisfy episode-level closure policy where relevant.",
        "requestClosureRecordFieldRefs": ["blockingLineageCaseLinkRefs[]"],
        "deferReasonCode": "EPISODE_POLICY_UNSATISFIED",
        "source_refs": [
            "blueprint/phase-0-the-foundation-protocol.md#9.6 Closure evaluation algorithm",
        ],
    },
    {
        "checkId": "CHECK_055_14_REQUIRED_ACKS_HANDLED",
        "order": 14,
        "title": "Required acknowledgements handled",
        "question": "Practice acknowledgement or other required acknowledgement debt is either satisfied or explicitly downgraded by policy.",
        "requestClosureRecordFieldRefs": ["blockingApprovalRefs[]", "blockingDegradedPromiseRefs[]"],
        "deferReasonCode": "ACKNOWLEDGEMENT_REQUIRED",
        "source_refs": [
            "blueprint/phase-0-the-foundation-protocol.md#9.6 Closure evaluation algorithm",
            "blueprint/phase-5-the-network-horizon.md",
        ],
    },
    {
        "checkId": "CHECK_055_15_CONSENT_AND_DEGRADED_CONFIRMATION_CLEAR",
        "order": 15,
        "title": "Consent and degraded confirmation clear",
        "question": "No active consent-pending dependency or degraded confirmation gate remains for a current promise.",
        "requestClosureRecordFieldRefs": ["blockingConfirmationRefs[]", "blockingDegradedPromiseRefs[]"],
        "deferReasonCode": "CONSENT_OR_DEGRADED_PROMISE_OPEN",
        "source_refs": [
            "blueprint/phase-0-the-foundation-protocol.md#9.6 Closure evaluation algorithm",
            "blueprint/phase-6-the-pharmacy-loop.md",
        ],
    },
]

REOPEN_TRIGGER_DEFINITIONS = [
    {
        "reopenTriggerId": "RTP_055_URGENT",
        "reopenTriggerClass": "urgent",
        "signalVector": "u_urgent",
        "thresholdRule": "u_urgent(e) = 1",
        "reacquireOwnership": "triage_or_equivalent_immediately",
        "closureEffect": "prevent_close_and_reopen",
        "sourceEventNames": ["safety.preempted", "pharmacy.case.bounce_back"],
        "source_refs": [
            "blueprint/phase-0-the-foundation-protocol.md#9.7 Reopen triggers",
            "blueprint/phase-6-the-pharmacy-loop.md#6G. Bounce-back, urgent return, and reopen mechanics",
        ],
    },
    {
        "reopenTriggerId": "RTP_055_UNABLE_TO_COMPLETE",
        "reopenTriggerClass": "unable_to_complete",
        "signalVector": "u_unable",
        "thresholdRule": "u_unable(e) = 1",
        "reacquireOwnership": "triage_or_pharmacy_followup",
        "closureEffect": "keep_open_or_reopen",
        "sourceEventNames": ["pharmacy.case.bounce_back", "communication.callback.outcome.recorded"],
        "source_refs": [
            "blueprint/phase-0-the-foundation-protocol.md#9.7 Reopen triggers",
        ],
    },
    {
        "reopenTriggerId": "RTP_055_UNABLE_TO_CONTACT",
        "reopenTriggerClass": "unable_to_contact",
        "signalVector": "u_contact",
        "thresholdRule": "u_contact(e) >= tau_reopen",
        "reacquireOwnership": "reachability_repair_then_triage",
        "closureEffect": "prevent_close_and_open_reachability_repair",
        "sourceEventNames": ["reachability.dependency.failed", "communication.callback.outcome.recorded"],
        "source_refs": [
            "blueprint/phase-0-the-foundation-protocol.md#9.7 Reopen triggers",
            "blueprint/phase-6-the-pharmacy-loop.md",
        ],
    },
    {
        "reopenTriggerId": "RTP_055_BOUNCE_BACK",
        "reopenTriggerClass": "bounce_back",
        "signalVector": "u_bounce",
        "thresholdRule": "u_bounce(e) >= tau_reopen",
        "reacquireOwnership": "triage_reacquire_with_urgency_floor",
        "closureEffect": "reopen_same_lineage_branch",
        "sourceEventNames": ["pharmacy.case.bounce_back"],
        "source_refs": [
            "blueprint/phase-0-the-foundation-protocol.md#9.7 Reopen triggers",
            "blueprint/phase-6-the-pharmacy-loop.md#6G. Bounce-back, urgent return, and reopen mechanics",
        ],
    },
    {
        "reopenTriggerId": "RTP_055_CONSENT_REVOCATION",
        "reopenTriggerClass": "consent_revocation",
        "signalVector": "u_revocation",
        "thresholdRule": "u_revocation(e) >= tau_reopen",
        "reacquireOwnership": "triage_or_pharmacy_reassessment",
        "closureEffect": "reopen_and_revoke_current_promise",
        "sourceEventNames": ["pharmacy.consent.revoked", "pharmacy.consent.revocation.recorded"],
        "source_refs": [
            "blueprint/phase-0-the-foundation-protocol.md#9.7 Reopen triggers",
            "blueprint/phase-6-the-pharmacy-loop.md",
        ],
    },
    {
        "reopenTriggerId": "RTP_055_CONTRADICTION",
        "reopenTriggerClass": "contradiction",
        "signalVector": "u_contradiction",
        "thresholdRule": "u_contradiction(e) >= tau_reopen",
        "reacquireOwnership": "reconciliation_or_triage_reissue",
        "closureEffect": "defer_close_and_reopen_if_current_truth_changed",
        "sourceEventNames": ["booking.commit.ambiguous", "confirmation.gate.disputed"],
        "source_refs": [
            "blueprint/phase-0-the-foundation-protocol.md#9.7 Reopen triggers",
            "blueprint/phase-4-the-booking-engine.md",
        ],
    },
    {
        "reopenTriggerId": "RTP_055_CLINICAL_CHANGE",
        "reopenTriggerClass": "clinical_material_change",
        "signalVector": "delta_clinical",
        "thresholdRule": "materialChange(e,l) >= tau_reopen",
        "reacquireOwnership": "triage_reassess",
        "closureEffect": "reopen_for_re_safety",
        "sourceEventNames": ["safety.reassessed", "pharmacy.case.bounce_back"],
        "source_refs": [
            "blueprint/phase-0-the-foundation-protocol.md#9.7 Reopen triggers",
        ],
    },
    {
        "reopenTriggerId": "RTP_055_CONTACT_CHANGE",
        "reopenTriggerClass": "contact_material_change",
        "signalVector": "delta_contact",
        "thresholdRule": "materialChange(e,l) >= tau_reopen",
        "reacquireOwnership": "reachability_repair_then_triage",
        "closureEffect": "reopen_with_contact_route_repair",
        "sourceEventNames": ["reachability.assessment.settled", "reachability.dependency.failed"],
        "source_refs": [
            "blueprint/phase-0-the-foundation-protocol.md#9.7 Reopen triggers",
        ],
    },
    {
        "reopenTriggerId": "RTP_055_PROVIDER_CHANGE",
        "reopenTriggerClass": "provider_material_change",
        "signalVector": "delta_provider",
        "thresholdRule": "materialChange(e,l) >= tau_reopen",
        "reacquireOwnership": "booking_or_hub_reconciliation",
        "closureEffect": "reopen_with_confirmation_gate",
        "sourceEventNames": ["booking.commit.ambiguous", "hub.booking.confirmation_pending"],
        "source_refs": [
            "blueprint/phase-0-the-foundation-protocol.md#9.7 Reopen triggers",
            "blueprint/phase-5-the-network-horizon.md",
        ],
    },
    {
        "reopenTriggerId": "RTP_055_CONSENT_CHANGE",
        "reopenTriggerClass": "consent_material_change",
        "signalVector": "delta_consent",
        "thresholdRule": "materialChange(e,l) >= tau_reopen",
        "reacquireOwnership": "pharmacy_or_support_followup",
        "closureEffect": "reopen_and_suspend_current_promise",
        "sourceEventNames": ["pharmacy.consent.revocation.recorded"],
        "source_refs": [
            "blueprint/phase-0-the-foundation-protocol.md#9.7 Reopen triggers",
            "blueprint/phase-6-the-pharmacy-loop.md",
        ],
    },
    {
        "reopenTriggerId": "RTP_055_TIMING_CHANGE",
        "reopenTriggerClass": "timing_material_change",
        "signalVector": "delta_timing",
        "thresholdRule": "materialChange(e,l) >= tau_reopen",
        "reacquireOwnership": "booking_or_callback_followup",
        "closureEffect": "reopen_and_refresh_current_promise_timing",
        "sourceEventNames": ["booking.manage.continuity.updated", "communication.callback.outcome.recorded"],
        "source_refs": [
            "blueprint/phase-0-the-foundation-protocol.md#9.7 Reopen triggers",
        ],
    },
    {
        "reopenTriggerId": "RTP_055_IDENTITY_CHANGE",
        "reopenTriggerClass": "identity_material_change",
        "signalVector": "delta_identity",
        "thresholdRule": "materialChange(e,l) >= tau_reopen",
        "reacquireOwnership": "identity_repair_then_triage",
        "closureEffect": "reopen_and_hold_under_identity_repair",
        "sourceEventNames": ["identity.repair_signal.recorded", "identity.repair_case.opened"],
        "source_refs": [
            "blueprint/phase-0-the-foundation-protocol.md#9.7 Reopen triggers",
            "blueprint/forensic-audit-findings.md#Finding 69",
        ],
    },
]

SIGNAL_DEFINITIONS = [
    {
        "milestoneSignalId": "MSIG_055_TRIAGE_TASK_SETTLED",
        "domainContext": "triage",
        "caseFamily": "triage",
        "eventNames": ["triage.task.settled"],
        "signalName": "triage.task.settled",
        "routeFamilyRefs": ["rf_staff_workspace", "rf_staff_workspace_child"],
        "signalClass": "milestone",
        "coordinatorConsumptionMode": "derive_milestone_only",
        "candidateRequestMilestone": "triage_active",
        "blockerClassKeys": [],
        "closureEligibility": "progress_only",
        "reopenTriggerClass": "none",
        "evaluationCheckRefs": ["CHECK_055_01_LEASES_CLEAR", "CHECK_055_12_TERMINAL_OUTCOME_PRESENT"],
        "meaning": "Triage settles local review truth and lease ownership, but the coordinator keeps canonical request workflow control.",
        "source_refs": [
            "blueprint/phase-3-the-human-checkpoint.md",
            "blueprint/forensic-audit-findings.md#Finding 75",
        ],
    },
    {
        "milestoneSignalId": "MSIG_055_TRIAGE_SELFCARE_OR_ADMIN_OUTCOME_RECORDED",
        "domainContext": "triage",
        "caseFamily": "self_care_admin_resolution",
        "eventNames": ["triage.task.settled"],
        "signalName": "triage.selfcare_or_admin_resolution.outcome_recorded",
        "routeFamilyRefs": ["rf_staff_workspace", "rf_patient_requests"],
        "signalClass": "milestone",
        "coordinatorConsumptionMode": "derive_milestone_only",
        "candidateRequestMilestone": "outcome_recorded",
        "blockerClassKeys": [],
        "closureEligibility": "close_candidate",
        "reopenTriggerClass": "none",
        "evaluationCheckRefs": ["CHECK_055_11_COMMAND_FOLLOWING_CONSUMED", "CHECK_055_12_TERMINAL_OUTCOME_PRESENT"],
        "meaning": "Direct self-care or admin-resolution outcome becomes candidate terminal truth only after the coordinator rechecks blockers and lineage epoch.",
        "source_refs": [
            "prompt/055.md",
            "blueprint/phase-3-the-human-checkpoint.md",
        ],
    },
    {
        "milestoneSignalId": "MSIG_055_TRIAGE_CONTINUITY_UPDATED",
        "domainContext": "triage",
        "caseFamily": "triage",
        "eventNames": ["triage.task_completion.continuity.updated"],
        "signalName": "triage.task_completion.continuity.updated",
        "routeFamilyRefs": ["rf_staff_workspace", "rf_staff_workspace_child", "rf_patient_requests"],
        "signalClass": "continuity",
        "coordinatorConsumptionMode": "derive_milestone_only",
        "candidateRequestMilestone": "handoff_active",
        "blockerClassKeys": [],
        "closureEligibility": "progress_only",
        "reopenTriggerClass": "none",
        "evaluationCheckRefs": ["CHECK_055_11_COMMAND_FOLLOWING_CONSUMED", "CHECK_055_12_TERMINAL_OUTCOME_PRESENT"],
        "meaning": "Continuity refresh proves what downstream work remains visible, but it does not directly close or reopen the request.",
        "source_refs": [
            "blueprint/phase-3-the-human-checkpoint.md",
            "docs/architecture/05_request_lineage_model.md",
        ],
    },
    {
        "milestoneSignalId": "MSIG_055_BOOKING_CONFIRMATION_PENDING",
        "domainContext": "booking",
        "caseFamily": "booking",
        "eventNames": ["booking.commit.confirmation_pending"],
        "signalName": "booking.commit.confirmation_pending",
        "routeFamilyRefs": ["rf_staff_workspace", "rf_patient_appointments"],
        "signalClass": "gate",
        "coordinatorConsumptionMode": "materialize_blockers",
        "candidateRequestMilestone": "handoff_active",
        "blockerClassKeys": ["confirmation_gate", "degraded_promise"],
        "closureEligibility": "defer_on_blocker",
        "reopenTriggerClass": "none",
        "evaluationCheckRefs": ["CHECK_055_03_APPROVALS_CLEAR", "CHECK_055_04_OUTCOME_TRUTH_CLEAR", "CHECK_055_15_CONSENT_AND_DEGRADED_CONFIRMATION_CLEAR"],
        "meaning": "Booking can assert pending confirmation truth, but only the coordinator materializes the close blocker and defer verdict.",
        "source_refs": [
            "blueprint/phase-4-the-booking-engine.md",
            "blueprint/forensic-audit-findings.md#Finding 74",
        ],
    },
    {
        "milestoneSignalId": "MSIG_055_BOOKING_CONFIRMED",
        "domainContext": "booking",
        "caseFamily": "booking",
        "eventNames": ["booking.commit.confirmed"],
        "signalName": "booking.commit.confirmed",
        "routeFamilyRefs": ["rf_staff_workspace", "rf_patient_appointments"],
        "signalClass": "milestone",
        "coordinatorConsumptionMode": "derive_milestone_only",
        "candidateRequestMilestone": "outcome_recorded",
        "blockerClassKeys": [],
        "closureEligibility": "close_candidate",
        "reopenTriggerClass": "none",
        "evaluationCheckRefs": ["CHECK_055_11_COMMAND_FOLLOWING_CONSUMED", "CHECK_055_12_TERMINAL_OUTCOME_PRESENT"],
        "meaning": "Booking confirmation is case-local success first; the coordinator decides whether the request is now closeable.",
        "source_refs": [
            "blueprint/phase-4-the-booking-engine.md",
            "blueprint/forensic-audit-findings.md#Finding 74",
        ],
    },
    {
        "milestoneSignalId": "MSIG_055_BOOKING_AMBIGUOUS",
        "domainContext": "booking",
        "caseFamily": "booking",
        "eventNames": ["booking.commit.ambiguous"],
        "signalName": "booking.commit.ambiguous",
        "routeFamilyRefs": ["rf_staff_workspace", "rf_patient_appointments"],
        "signalClass": "gate",
        "coordinatorConsumptionMode": "materialize_blockers",
        "candidateRequestMilestone": "handoff_active",
        "blockerClassKeys": ["confirmation_gate", "outcome_reconciliation"],
        "closureEligibility": "defer_on_blocker",
        "reopenTriggerClass": "contradiction",
        "evaluationCheckRefs": ["CHECK_055_03_APPROVALS_CLEAR", "CHECK_055_04_OUTCOME_TRUTH_CLEAR", "CHECK_055_05_PHARMACY_RECONCILIATION_CLEAR"],
        "meaning": "Ambiguous supplier truth becomes an explicit confirmation and reconciliation hold instead of a pseudo-workflow state.",
        "source_refs": [
            "blueprint/phase-4-the-booking-engine.md",
            "blueprint/forensic-audit-findings.md#Finding 72",
            "blueprint/forensic-audit-findings.md#Finding 73",
        ],
    },
    {
        "milestoneSignalId": "MSIG_055_HUB_CONFIRMATION_PENDING",
        "domainContext": "hub_coordination",
        "caseFamily": "hub",
        "eventNames": ["hub.booking.confirmation_pending"],
        "signalName": "hub.booking.confirmation_pending",
        "routeFamilyRefs": ["rf_hub_case_management", "rf_hub_queue"],
        "signalClass": "gate",
        "coordinatorConsumptionMode": "materialize_blockers",
        "candidateRequestMilestone": "handoff_active",
        "blockerClassKeys": ["confirmation_gate"],
        "closureEligibility": "defer_on_blocker",
        "reopenTriggerClass": "none",
        "evaluationCheckRefs": ["CHECK_055_03_APPROVALS_CLEAR", "CHECK_055_04_OUTCOME_TRUTH_CLEAR"],
        "meaning": "Hub-native confirmation debt remains visible as a coordinator gate, not as a direct request close or patient-final success.",
        "source_refs": [
            "blueprint/phase-5-the-network-horizon.md",
            "blueprint/forensic-audit-findings.md#Finding 76",
        ],
    },
    {
        "milestoneSignalId": "MSIG_055_HUB_EXTERNALLY_CONFIRMED",
        "domainContext": "hub_coordination",
        "caseFamily": "hub",
        "eventNames": ["hub.booking.externally_confirmed"],
        "signalName": "hub.booking.externally_confirmed",
        "routeFamilyRefs": ["rf_hub_case_management", "rf_hub_queue"],
        "signalClass": "milestone",
        "coordinatorConsumptionMode": "derive_milestone_only",
        "candidateRequestMilestone": "outcome_recorded",
        "blockerClassKeys": [],
        "closureEligibility": "close_candidate",
        "reopenTriggerClass": "none",
        "evaluationCheckRefs": ["CHECK_055_11_COMMAND_FOLLOWING_CONSUMED", "CHECK_055_12_TERMINAL_OUTCOME_PRESENT", "CHECK_055_14_REQUIRED_ACKS_HANDLED"],
        "meaning": "Hub confirmation can advance the lineage toward outcome_recorded, but closure still waits for acknowledgement and blocker clearance.",
        "source_refs": [
            "blueprint/phase-5-the-network-horizon.md",
            "blueprint/forensic-audit-findings.md#Finding 76",
        ],
    },
    {
        "milestoneSignalId": "MSIG_055_HUB_PRACTICE_NOTIFIED",
        "domainContext": "hub_coordination",
        "caseFamily": "hub",
        "eventNames": ["hub.practice.notified"],
        "signalName": "hub.practice.notified",
        "routeFamilyRefs": ["rf_hub_case_management", "rf_hub_queue"],
        "signalClass": "approval",
        "coordinatorConsumptionMode": "materialize_blockers",
        "candidateRequestMilestone": "handoff_active",
        "blockerClassKeys": ["approval_checkpoint", "confirmation_gate"],
        "closureEligibility": "defer_on_blocker",
        "reopenTriggerClass": "none",
        "evaluationCheckRefs": ["CHECK_055_03_APPROVALS_CLEAR", "CHECK_055_14_REQUIRED_ACKS_HANDLED"],
        "meaning": "Practice-visibility debt is explicit coordinator material, not a silent note on the hub case.",
        "source_refs": [
            "blueprint/phase-5-the-network-horizon.md",
            "blueprint/forensic-audit-findings.md#Finding 76",
        ],
    },
    {
        "milestoneSignalId": "MSIG_055_PHARMACY_DISPATCH_CONFIRMED",
        "domainContext": "pharmacy",
        "caseFamily": "pharmacy",
        "eventNames": ["pharmacy.dispatch.confirmed"],
        "signalName": "pharmacy.dispatch.confirmed",
        "routeFamilyRefs": ["rf_pharmacy_console", "rf_patient_requests"],
        "signalClass": "promise",
        "coordinatorConsumptionMode": "materialize_blockers",
        "candidateRequestMilestone": "handoff_active",
        "blockerClassKeys": ["degraded_promise"],
        "closureEligibility": "progress_only",
        "reopenTriggerClass": "none",
        "evaluationCheckRefs": ["CHECK_055_07_REACHABILITY_CLEAR", "CHECK_055_15_CONSENT_AND_DEGRADED_CONFIRMATION_CLEAR"],
        "meaning": "Confirmed dispatch establishes a live promise but does not imply calm completion or closure.",
        "source_refs": [
            "blueprint/phase-6-the-pharmacy-loop.md",
            "blueprint/forensic-audit-findings.md#Finding 77",
        ],
    },
    {
        "milestoneSignalId": "MSIG_055_PHARMACY_OUTCOME_RECEIVED",
        "domainContext": "pharmacy",
        "caseFamily": "pharmacy",
        "eventNames": ["pharmacy.outcome.received"],
        "signalName": "pharmacy.outcome.received",
        "routeFamilyRefs": ["rf_pharmacy_console", "rf_patient_requests"],
        "signalClass": "milestone",
        "coordinatorConsumptionMode": "derive_milestone_only",
        "candidateRequestMilestone": "handoff_active",
        "blockerClassKeys": ["outcome_reconciliation"],
        "closureEligibility": "progress_only",
        "reopenTriggerClass": "none",
        "evaluationCheckRefs": ["CHECK_055_04_OUTCOME_TRUTH_CLEAR", "CHECK_055_05_PHARMACY_RECONCILIATION_CLEAR"],
        "meaning": "Pharmacy outcome evidence lands on the case first; the coordinator decides whether it is ready to affect request-level closure.",
        "source_refs": [
            "blueprint/phase-6-the-pharmacy-loop.md#6F. Outcome ingest, reconciliation, and closure",
            "blueprint/forensic-audit-findings.md#Finding 77",
        ],
    },
    {
        "milestoneSignalId": "MSIG_055_PHARMACY_CASE_RESOLVED",
        "domainContext": "pharmacy",
        "caseFamily": "pharmacy",
        "eventNames": ["pharmacy.case.resolved"],
        "signalName": "pharmacy.case.resolved",
        "routeFamilyRefs": ["rf_pharmacy_console", "rf_patient_requests"],
        "signalClass": "milestone",
        "coordinatorConsumptionMode": "derive_milestone_only",
        "candidateRequestMilestone": "outcome_recorded",
        "blockerClassKeys": [],
        "closureEligibility": "close_candidate",
        "reopenTriggerClass": "none",
        "evaluationCheckRefs": ["CHECK_055_11_COMMAND_FOLLOWING_CONSUMED", "CHECK_055_12_TERMINAL_OUTCOME_PRESENT", "CHECK_055_15_CONSENT_AND_DEGRADED_CONFIRMATION_CLEAR"],
        "meaning": "Resolved-by-pharmacy becomes candidate terminal outcome only after the coordinator confirms no grant, reachability, or reconciliation debt remains.",
        "source_refs": [
            "blueprint/phase-6-the-pharmacy-loop.md#6F. Outcome ingest, reconciliation, and closure",
            "blueprint/forensic-audit-findings.md#Finding 77",
        ],
    },
    {
        "milestoneSignalId": "MSIG_055_PHARMACY_CASE_BOUNCE_BACK",
        "domainContext": "pharmacy",
        "caseFamily": "pharmacy",
        "eventNames": ["pharmacy.case.bounce_back"],
        "signalName": "pharmacy.case.bounce_back",
        "routeFamilyRefs": ["rf_pharmacy_console", "rf_staff_workspace"],
        "signalClass": "reopen",
        "coordinatorConsumptionMode": "derive_governed_reopen",
        "candidateRequestMilestone": "triage_active",
        "blockerClassKeys": ["safety_preemption", "reachability_dependency"],
        "closureEligibility": "reopen_candidate",
        "reopenTriggerClass": "bounce_back",
        "evaluationCheckRefs": ["CHECK_055_02_PREEMPTION_CLEAR", "CHECK_055_07_REACHABILITY_CLEAR", "CHECK_055_12_TERMINAL_OUTCOME_PRESENT"],
        "meaning": "Bounce-back reopens through the coordinator under urgent or unable-to-complete rules; pharmacy does not directly rewrite request workflow.",
        "source_refs": [
            "blueprint/phase-6-the-pharmacy-loop.md#6G. Bounce-back, urgent return, and reopen mechanics",
            "blueprint/forensic-audit-findings.md#Finding 77",
        ],
    },
    {
        "milestoneSignalId": "MSIG_055_COMMUNICATION_CALLBACK_OUTCOME_RECORDED",
        "domainContext": "communication",
        "caseFamily": "callback_message",
        "eventNames": ["communication.callback.outcome.recorded"],
        "signalName": "communication.callback.outcome.recorded",
        "routeFamilyRefs": ["rf_patient_messages", "rf_support_ticket_workspace"],
        "signalClass": "continuity",
        "coordinatorConsumptionMode": "derive_milestone_only",
        "candidateRequestMilestone": "handoff_active",
        "blockerClassKeys": ["reachability_dependency"],
        "closureEligibility": "progress_only",
        "reopenTriggerClass": "unable_to_contact",
        "evaluationCheckRefs": ["CHECK_055_07_REACHABILITY_CLEAR", "CHECK_055_10_LINEAGE_LINKS_SETTLED"],
        "meaning": "Callback outcomes update continuity and reachability posture, but request truth remains coordinator-owned.",
        "source_refs": [
            "blueprint/callback-and-clinician-messaging-loop.md",
            "docs/architecture/05_request_lineage_model.md",
        ],
    },
    {
        "milestoneSignalId": "MSIG_055_COMMUNICATION_COMMAND_SETTLED",
        "domainContext": "communication",
        "caseFamily": "callback_message",
        "eventNames": ["communication.command.settled"],
        "signalName": "communication.command.settled",
        "routeFamilyRefs": ["rf_patient_messages", "rf_patient_requests"],
        "signalClass": "milestone",
        "coordinatorConsumptionMode": "derive_milestone_only",
        "candidateRequestMilestone": "outcome_recorded",
        "blockerClassKeys": [],
        "closureEligibility": "close_candidate",
        "reopenTriggerClass": "none",
        "evaluationCheckRefs": ["CHECK_055_11_COMMAND_FOLLOWING_CONSUMED", "CHECK_055_12_TERMINAL_OUTCOME_PRESENT"],
        "meaning": "Message or callback command settlement may complete local communication truth, but the coordinator still owns closure evaluation.",
        "source_refs": [
            "blueprint/callback-and-clinician-messaging-loop.md",
            "prompt/055.md",
        ],
    },
    {
        "milestoneSignalId": "MSIG_055_SUPPORT_ACTION_SETTLED",
        "domainContext": "support",
        "caseFamily": "support",
        "eventNames": ["support.action.settled"],
        "signalName": "support.action.settled",
        "routeFamilyRefs": ["rf_support_ticket_workspace"],
        "signalClass": "repair",
        "coordinatorConsumptionMode": "clear_or_refresh_blockers",
        "candidateRequestMilestone": "handoff_active",
        "blockerClassKeys": [],
        "closureEligibility": "progress_only",
        "reopenTriggerClass": "none",
        "evaluationCheckRefs": ["CHECK_055_10_LINEAGE_LINKS_SETTLED", "CHECK_055_11_COMMAND_FOLLOWING_CONSUMED"],
        "meaning": "Support may settle a repair action, but it cannot itself clear request closure or force reopen without coordinator evaluation.",
        "source_refs": [
            "blueprint/staff-operations-and-support-blueprint.md",
            "docs/architecture/05_request_lineage_model.md",
        ],
    },
    {
        "milestoneSignalId": "MSIG_055_SUPPORT_REPLAY_RESTORE_REQUIRED",
        "domainContext": "support",
        "caseFamily": "support_replay",
        "eventNames": ["support.replay.restore.required"],
        "signalName": "support.replay.restore.required",
        "routeFamilyRefs": ["rf_support_replay_observe", "rf_support_ticket_workspace"],
        "signalClass": "repair",
        "coordinatorConsumptionMode": "materialize_blockers",
        "candidateRequestMilestone": "handoff_active",
        "blockerClassKeys": ["fallback_review"],
        "closureEligibility": "defer_on_blocker",
        "reopenTriggerClass": "none",
        "evaluationCheckRefs": ["CHECK_055_06_CASE_REPAIR_CLEAR", "CHECK_055_10_LINEAGE_LINKS_SETTLED"],
        "meaning": "Replay restore demand becomes a first-class closure blocker instead of a local support note or hidden workflow flag.",
        "source_refs": [
            "blueprint/staff-operations-and-support-blueprint.md",
            "blueprint/forensic-audit-findings.md#Finding 58",
        ],
    },
    {
        "milestoneSignalId": "MSIG_055_SUPPORT_REPLAY_RESTORE_SETTLED",
        "domainContext": "support",
        "caseFamily": "support_replay",
        "eventNames": ["support.replay.restore.settled"],
        "signalName": "support.replay.restore.settled",
        "routeFamilyRefs": ["rf_support_replay_observe", "rf_support_ticket_workspace"],
        "signalClass": "repair",
        "coordinatorConsumptionMode": "clear_or_refresh_blockers",
        "candidateRequestMilestone": "handoff_active",
        "blockerClassKeys": [],
        "closureEligibility": "progress_only",
        "reopenTriggerClass": "none",
        "evaluationCheckRefs": ["CHECK_055_06_CASE_REPAIR_CLEAR", "CHECK_055_11_COMMAND_FOLLOWING_CONSUMED"],
        "meaning": "Restore settlement can clear replay debt, but closure still waits for the full coordinator checklist.",
        "source_refs": [
            "blueprint/staff-operations-and-support-blueprint.md",
            "docs/architecture/05_request_lineage_model.md",
        ],
    },
]

INPUT_DEFINITIONS = [
    {
        "lifecycleInputId": "LCI_055_REQUEST_LIFECYCLE_LEASES",
        "inputFamily": "lifecycle_lease",
        "sourceObjectType": "RequestLifecycleLease",
        "owningBoundedContextRef": "platform_runtime",
        "eventNames": [
            "request.lease.acquired",
            "request.lease.released",
            "request.lease.broken",
            "request.lease.takeover_committed",
        ],
        "routeFamilyRefs": [
            "rf_staff_workspace",
            "rf_hub_case_management",
            "rf_pharmacy_console",
            "rf_support_ticket_workspace",
        ],
        "requestClosureRecordField": "blockingLeaseRefs[]",
        "blockerClassKey": "lease_conflict",
        "evaluationStage": "pre_close_invariant",
        "materializationRule": "active, releasing, unremediated expired, and broken leases materialize close blockers",
        "failureEffect": "defer",
        "sameShellRecovery": "reacquire_or_takeover_required",
        "source_refs": [
            "blueprint/phase-0-the-foundation-protocol.md#1.10 RequestLifecycleLease",
            "blueprint/phase-0-the-foundation-protocol.md#9.6 Closure evaluation algorithm",
        ],
    },
    {
        "lifecycleInputId": "LCI_055_SAFETY_PREEMPTION_RECORDS",
        "inputFamily": "safety_preemption",
        "sourceObjectType": "SafetyPreemptionRecord",
        "owningBoundedContextRef": "intake_safety",
        "eventNames": ["safety.preempted", "safety.decision_settled"],
        "routeFamilyRefs": ["rf_staff_workspace", "rf_patient_requests", "rf_pharmacy_console"],
        "requestClosureRecordField": "blockingPreemptionRefs[]",
        "blockerClassKey": "safety_preemption",
        "evaluationStage": "pre_close_invariant",
        "materializationRule": "any pending preemption blocks closure until settled or diverted",
        "failureEffect": "defer",
        "sameShellRecovery": "urgent_or_triage_reopen",
        "source_refs": [
            "blueprint/phase-0-the-foundation-protocol.md#9.6 Closure evaluation algorithm",
            "blueprint/phase-3-the-human-checkpoint.md",
        ],
    },
    {
        "lifecycleInputId": "LCI_055_APPROVAL_AND_ACKNOWLEDGEMENT_GATES",
        "inputFamily": "approval_gate",
        "sourceObjectType": "ApprovalCheckpoint",
        "owningBoundedContextRef": "triage_workspace",
        "eventNames": ["triage.task.settled", "hub.practice.notified"],
        "routeFamilyRefs": ["rf_staff_workspace", "rf_hub_case_management"],
        "requestClosureRecordField": "blockingApprovalRefs[]",
        "blockerClassKey": "approval_checkpoint",
        "evaluationStage": "policy_gate",
        "materializationRule": "required acknowledgement and governance approvals remain first-class blocker refs",
        "failureEffect": "defer",
        "sameShellRecovery": "summary_only_until_approval",
        "source_refs": [
            "blueprint/phase-3-the-human-checkpoint.md#Closure and reopen rules",
            "blueprint/phase-5-the-network-horizon.md",
        ],
    },
    {
        "lifecycleInputId": "LCI_055_EXTERNAL_CONFIRMATION_GATES",
        "inputFamily": "confirmation_gate",
        "sourceObjectType": "ExternalConfirmationGate",
        "owningBoundedContextRef": "identity_access",
        "eventNames": [
            "confirmation.gate.created",
            "confirmation.gate.confirmed",
            "confirmation.gate.disputed",
            "confirmation.gate.expired",
        ],
        "routeFamilyRefs": ["rf_patient_appointments", "rf_hub_case_management", "rf_pharmacy_console"],
        "requestClosureRecordField": "blockingConfirmationRefs[]",
        "blockerClassKey": "confirmation_gate",
        "evaluationStage": "policy_gate",
        "materializationRule": "current confirmation truth is materialized as gate refs, never copied into workflow state",
        "failureEffect": "defer",
        "sameShellRecovery": "pending_confirmation_posture",
        "source_refs": [
            "blueprint/phase-4-the-booking-engine.md",
            "blueprint/phase-5-the-network-horizon.md",
            "blueprint/phase-6-the-pharmacy-loop.md",
        ],
    },
    {
        "lifecycleInputId": "LCI_055_RECONCILIATION_GATES",
        "inputFamily": "reconciliation_gate",
        "sourceObjectType": "BookingCase or PharmacyOutcomeReconciliationGate",
        "owningBoundedContextRef": "booking",
        "eventNames": [
            "booking.commit.ambiguous",
            "booking.commit.reconciliation_pending",
            "pharmacy.outcome.unmatched",
            "pharmacy.outcome.reconciled",
        ],
        "routeFamilyRefs": ["rf_patient_appointments", "rf_pharmacy_console"],
        "requestClosureRecordField": "blockingReconciliationRefs[]",
        "blockerClassKey": "outcome_reconciliation",
        "evaluationStage": "truth_gate",
        "materializationRule": "ambiguous supplier or pharmacy truth becomes explicit reconciliation refs",
        "failureEffect": "defer",
        "sameShellRecovery": "reconciliation_required_same_shell",
        "source_refs": [
            "blueprint/phase-4-the-booking-engine.md",
            "blueprint/phase-6-the-pharmacy-loop.md#6F. Outcome ingest, reconciliation, and closure",
        ],
    },
    {
        "lifecycleInputId": "LCI_055_LINEAGE_CASE_LINKS",
        "inputFamily": "lineage_branch",
        "sourceObjectType": "LineageCaseLink",
        "owningBoundedContextRef": "domain_kernel",
        "eventNames": ["request.updated"],
        "routeFamilyRefs": [
            "rf_staff_workspace",
            "rf_hub_case_management",
            "rf_pharmacy_console",
            "rf_patient_messages",
        ],
        "requestClosureRecordField": "blockingLineageCaseLinkRefs[]",
        "blockerClassKey": "lineage_case_link_active",
        "evaluationStage": "lineage_invariant",
        "materializationRule": "every proposed, acknowledged, active, or returned child branch stays closure-blocking until governed settlement",
        "failureEffect": "defer",
        "sameShellRecovery": "return_or_handoff_only",
        "source_refs": [
            "docs/architecture/05_request_lineage_model.md",
            "blueprint/phase-0-the-foundation-protocol.md#9.6 Closure evaluation algorithm",
        ],
    },
    {
        "lifecycleInputId": "LCI_055_DUPLICATE_CLUSTERS",
        "inputFamily": "duplicate_review",
        "sourceObjectType": "DuplicateCluster",
        "owningBoundedContextRef": "intake_safety",
        "eventNames": ["request.duplicate.review_required", "request.duplicate.resolved"],
        "routeFamilyRefs": ["rf_patient_requests", "rf_support_ticket_workspace"],
        "requestClosureRecordField": "blockingDuplicateClusterRefs[]",
        "blockerClassKey": "duplicate_review",
        "evaluationStage": "case_repair",
        "materializationRule": "review_required clusters persist as explicit duplicate blocker refs",
        "failureEffect": "defer",
        "sameShellRecovery": "review_required",
        "source_refs": [
            "blueprint/forensic-audit-findings.md#Finding 57",
            "docs/architecture/05_request_lineage_model.md",
        ],
    },
    {
        "lifecycleInputId": "LCI_055_FALLBACK_REVIEW_CASES",
        "inputFamily": "fallback_review",
        "sourceObjectType": "FallbackReviewCase",
        "owningBoundedContextRef": "support",
        "eventNames": ["exception.review_case.opened", "exception.review_case.recovered"],
        "routeFamilyRefs": ["rf_support_replay_observe", "rf_support_ticket_workspace"],
        "requestClosureRecordField": "blockingFallbackCaseRefs[]",
        "blockerClassKey": "fallback_review",
        "evaluationStage": "case_repair",
        "materializationRule": "degraded accepted progress or replay restore debt persists as dedicated fallback blocker refs",
        "failureEffect": "defer",
        "sameShellRecovery": "restore_or_review_only",
        "source_refs": [
            "blueprint/forensic-audit-findings.md#Finding 58",
            "blueprint/staff-operations-and-support-blueprint.md",
        ],
    },
    {
        "lifecycleInputId": "LCI_055_IDENTITY_REPAIR_CASES",
        "inputFamily": "identity_repair",
        "sourceObjectType": "IdentityRepairCase",
        "owningBoundedContextRef": "identity_access",
        "eventNames": [
            "identity.repair_case.opened",
            "identity.repair_case.corrected",
            "identity.repair_case.closed",
        ],
        "routeFamilyRefs": ["rf_patient_requests", "rf_staff_workspace", "rf_support_ticket_workspace"],
        "requestClosureRecordField": "blockingIdentityRepairRefs[]",
        "blockerClassKey": "identity_repair",
        "evaluationStage": "case_repair",
        "materializationRule": "wrong-patient or branch correction never rewrites workflow milestones and remains explicit repair metadata",
        "failureEffect": "defer",
        "sameShellRecovery": "identity_hold_or_compensation_pending",
        "source_refs": [
            "blueprint/forensic-audit-findings.md#Finding 59",
            "blueprint/forensic-audit-findings.md#Finding 69",
        ],
    },
    {
        "lifecycleInputId": "LCI_055_REACHABILITY_DEPENDENCIES",
        "inputFamily": "reachability_dependency",
        "sourceObjectType": "ReachabilityDependency",
        "owningBoundedContextRef": "identity_access",
        "eventNames": [
            "reachability.dependency.created",
            "reachability.dependency.failed",
            "reachability.repair.started",
            "reachability.dependency.repaired",
        ],
        "routeFamilyRefs": ["rf_patient_messages", "rf_pharmacy_console", "rf_support_ticket_workspace"],
        "requestClosureRecordField": "blockingReachabilityRefs[]",
        "blockerClassKey": "reachability_dependency",
        "evaluationStage": "promise_integrity",
        "materializationRule": "current promises with broken or disputed contact routes stay closure-blocking until repair settles",
        "failureEffect": "defer",
        "sameShellRecovery": "contact_route_repair",
        "source_refs": [
            "blueprint/forensic-audit-findings.md#Finding 60",
            "blueprint/phase-6-the-pharmacy-loop.md",
        ],
    },
    {
        "lifecycleInputId": "LCI_055_PHI_BEARING_ACCESS_GRANTS",
        "inputFamily": "grant_control",
        "sourceObjectType": "AccessGrant",
        "owningBoundedContextRef": "identity_access",
        "eventNames": [
            "access.grant.issued",
            "access.grant.redeemed",
            "access.grant.revoked",
            "access.grant.superseded",
        ],
        "routeFamilyRefs": ["rf_patient_secure_link_recovery", "rf_patient_messages", "rf_patient_requests"],
        "requestClosureRecordField": "blockingGrantRefs[]",
        "blockerClassKey": "live_phi_grant",
        "evaluationStage": "privacy_control",
        "materializationRule": "current PHI-bearing grants must be revoked, expired, or superseded before closure may settle",
        "failureEffect": "defer",
        "sameShellRecovery": "grant_rotation_or_claim_recovery",
        "source_refs": [
            "blueprint/forensic-audit-findings.md#Finding 60",
            "blueprint/phase-0-the-foundation-protocol.md#9.6 Closure evaluation algorithm",
        ],
    },
    {
        "lifecycleInputId": "LCI_055_DEGRADED_PROMISES_AND_CONSENT",
        "inputFamily": "degraded_promise",
        "sourceObjectType": "CurrentPromise or consent-pending dependency",
        "owningBoundedContextRef": "communications",
        "eventNames": [
            "confirmation.gate.created",
            "communication.receipt.enveloped",
            "pharmacy.consent.revocation.recorded",
        ],
        "routeFamilyRefs": ["rf_patient_messages", "rf_pharmacy_console", "rf_hub_case_management"],
        "requestClosureRecordField": "blockingDegradedPromiseRefs[]",
        "blockerClassKey": "degraded_promise",
        "evaluationStage": "promise_integrity",
        "materializationRule": "live degraded promises, consent-pending dependencies, and provisional receipts remain explicit blocker refs",
        "failureEffect": "defer",
        "sameShellRecovery": "calm_receipt_only",
        "source_refs": [
            "prompt/055.md",
            "blueprint/phase-0-the-foundation-protocol.md#9.6 Closure evaluation algorithm",
        ],
    },
    {
        "lifecycleInputId": "LCI_055_TERMINAL_OUTCOME_EVIDENCE",
        "inputFamily": "terminal_outcome",
        "sourceObjectType": "Outcome truth projection",
        "owningBoundedContextRef": "triage_workspace",
        "eventNames": [
            "booking.commit.confirmed",
            "hub.booking.externally_confirmed",
            "pharmacy.case.resolved",
            "communication.command.settled",
        ],
        "routeFamilyRefs": [
            "rf_patient_appointments",
            "rf_hub_case_management",
            "rf_pharmacy_console",
            "rf_patient_messages",
        ],
        "requestClosureRecordField": "",
        "blockerClassKey": "",
        "evaluationStage": "terminal_truth",
        "materializationRule": "a terminal outcome must exist before any close verdict can be recorded",
        "failureEffect": "defer",
        "sameShellRecovery": "continue_current_case",
        "source_refs": [
            "blueprint/phase-0-the-foundation-protocol.md#9.6 Closure evaluation algorithm",
            "docs/architecture/05_request_lineage_model.md",
        ],
    },
    {
        "lifecycleInputId": "LCI_055_COMMAND_FOLLOWING_PROJECTIONS",
        "inputFamily": "projection_consumption",
        "sourceObjectType": "Command-following projection",
        "owningBoundedContextRef": "projection_worker",
        "eventNames": ["request.close.evaluated", "request.workflow.changed"],
        "routeFamilyRefs": [
            "rf_patient_requests",
            "rf_patient_appointments",
            "rf_patient_messages",
            "rf_staff_workspace",
            "rf_hub_case_management",
            "rf_pharmacy_console",
        ],
        "requestClosureRecordField": "",
        "blockerClassKey": "",
        "evaluationStage": "terminal_truth",
        "materializationRule": "close remains provisional until command_following projections consume the required causal token under the active release tuple",
        "failureEffect": "defer",
        "sameShellRecovery": "projection_pending_same_shell",
        "source_refs": [
            "blueprint/phase-0-the-foundation-protocol.md#9.6 Closure evaluation algorithm",
            "data/analysis/frontend_contract_manifests.json",
            "data/analysis/release_publication_parity_rules.json",
        ],
    },
    {
        "lifecycleInputId": "LCI_055_EPISODE_SIBLING_CLOSURE_POLICY",
        "inputFamily": "episode_policy",
        "sourceObjectType": "Episode closure policy",
        "owningBoundedContextRef": "domain_kernel",
        "eventNames": ["request.close.evaluated", "request.reopened"],
        "routeFamilyRefs": ["rf_patient_requests", "rf_staff_workspace"],
        "requestClosureRecordField": "",
        "blockerClassKey": "",
        "evaluationStage": "episode_policy",
        "materializationRule": "episode-level closure may proceed only when sibling requests and branches satisfy the same governed policy",
        "failureEffect": "defer",
        "sameShellRecovery": "sibling_branch_visibility_only",
        "source_refs": [
            "blueprint/phase-0-the-foundation-protocol.md#9.6 Closure evaluation algorithm",
        ],
    },
    {
        "lifecycleInputId": "LCI_055_REQUIRED_ACKS_AND_CONSENT_DEPENDENCIES",
        "inputFamily": "acknowledgement_or_consent",
        "sourceObjectType": "PracticeAcknowledgementRecord or consent checkpoint",
        "owningBoundedContextRef": "hub_coordination",
        "eventNames": ["hub.practice.notified", "pharmacy.consent.revocation.recorded"],
        "routeFamilyRefs": ["rf_hub_case_management", "rf_pharmacy_console"],
        "requestClosureRecordField": "blockingApprovalRefs[];blockingDegradedPromiseRefs[]",
        "blockerClassKey": "approval_checkpoint;degraded_promise",
        "evaluationStage": "policy_gate",
        "materializationRule": "required acknowledgements and consent-pending dependencies remain explicit close blockers until policy says otherwise",
        "failureEffect": "defer",
        "sameShellRecovery": "acknowledgement_or_consent_pending",
        "source_refs": [
            "blueprint/phase-0-the-foundation-protocol.md#9.6 Closure evaluation algorithm",
            "blueprint/phase-5-the-network-horizon.md",
            "blueprint/phase-6-the-pharmacy-loop.md",
        ],
    },
]

VERDICT_SCENARIOS = [
    {
        "scenarioId": "VSC_055_ROUTINE_CLOSE_V1",
        "label": "Routine close",
        "selectedSignalId": "MSIG_055_BOOKING_CONFIRMED",
        "matchingBlockerClassKeys": [],
        "matchingReopenTriggerClass": "none",
        "inputVector": {
            "hasActiveLeases": False,
            "hasOpenPreemption": False,
            "hasOpenApprovalOrConfirmation": False,
            "hasOpenReconciliation": False,
            "hasOpenRepair": False,
            "hasOpenReachability": False,
            "hasLiveGrant": False,
            "hasDegradedPromise": False,
            "materializedSetsEmpty": True,
            "terminalOutcomePresent": True,
            "commandFollowingConsumed": True,
            "episodePolicySatisfied": True,
            "requiredLineageEpoch": 41,
        },
        "expectedDecision": "close",
        "closedByMode": "routine_terminal_outcome",
        "reopenIntent": "none",
        "explanation": "Close is legal only because the current lineage epoch, empty blocker sets, command-following projections, and terminal outcome all agree.",
    },
    {
        "scenarioId": "VSC_055_ACTIVE_LEASE_DEFER_V1",
        "label": "Defer for active lease",
        "selectedSignalId": "MSIG_055_TRIAGE_TASK_SETTLED",
        "matchingBlockerClassKeys": ["lease_conflict"],
        "matchingReopenTriggerClass": "none",
        "inputVector": {
            "hasActiveLeases": True,
            "hasOpenPreemption": False,
            "hasOpenApprovalOrConfirmation": False,
            "hasOpenReconciliation": False,
            "hasOpenRepair": False,
            "hasOpenReachability": False,
            "hasLiveGrant": False,
            "hasDegradedPromise": False,
            "materializedSetsEmpty": False,
            "terminalOutcomePresent": True,
            "commandFollowingConsumed": True,
            "episodePolicySatisfied": True,
            "requiredLineageEpoch": 41,
        },
        "expectedDecision": "defer",
        "closedByMode": "not_closed",
        "reopenIntent": "none",
        "explanation": "Any active or broken lease forces a defer verdict and preserves same-shell reacquire posture.",
    },
    {
        "scenarioId": "VSC_055_CONFIRMATION_DISPUTE_DEFER_V1",
        "label": "Defer for confirmation dispute",
        "selectedSignalId": "MSIG_055_BOOKING_AMBIGUOUS",
        "matchingBlockerClassKeys": ["confirmation_gate", "outcome_reconciliation"],
        "matchingReopenTriggerClass": "contradiction",
        "inputVector": {
            "hasActiveLeases": False,
            "hasOpenPreemption": False,
            "hasOpenApprovalOrConfirmation": True,
            "hasOpenReconciliation": True,
            "hasOpenRepair": False,
            "hasOpenReachability": False,
            "hasLiveGrant": False,
            "hasDegradedPromise": True,
            "materializedSetsEmpty": False,
            "terminalOutcomePresent": True,
            "commandFollowingConsumed": False,
            "episodePolicySatisfied": True,
            "requiredLineageEpoch": 41,
        },
        "expectedDecision": "defer",
        "closedByMode": "not_closed",
        "reopenIntent": "triage_or_reconciliation_review",
        "explanation": "Ambiguous provider truth keeps the request open through explicit confirmation and reconciliation gates.",
    },
    {
        "scenarioId": "VSC_055_IDENTITY_REPAIR_DEFER_V1",
        "label": "Defer for identity repair",
        "selectedSignalId": "MSIG_055_COMMUNICATION_CALLBACK_OUTCOME_RECORDED",
        "matchingBlockerClassKeys": ["identity_repair"],
        "matchingReopenTriggerClass": "identity_material_change",
        "inputVector": {
            "hasActiveLeases": False,
            "hasOpenPreemption": False,
            "hasOpenApprovalOrConfirmation": False,
            "hasOpenReconciliation": False,
            "hasOpenRepair": True,
            "hasOpenReachability": False,
            "hasLiveGrant": False,
            "hasDegradedPromise": False,
            "materializedSetsEmpty": False,
            "terminalOutcomePresent": True,
            "commandFollowingConsumed": True,
            "episodePolicySatisfied": True,
            "requiredLineageEpoch": 41,
        },
        "expectedDecision": "defer",
        "closedByMode": "not_closed",
        "reopenIntent": "identity_repair_then_triage",
        "explanation": "Identity repair freezes calm closure without overloading Request.workflowState.",
    },
    {
        "scenarioId": "VSC_055_REACHABILITY_AND_GRANT_DEFER_V1",
        "label": "Defer for reachability and grant debt",
        "selectedSignalId": "MSIG_055_COMMUNICATION_CALLBACK_OUTCOME_RECORDED",
        "matchingBlockerClassKeys": ["reachability_dependency", "live_phi_grant"],
        "matchingReopenTriggerClass": "unable_to_contact",
        "inputVector": {
            "hasActiveLeases": False,
            "hasOpenPreemption": False,
            "hasOpenApprovalOrConfirmation": False,
            "hasOpenReconciliation": False,
            "hasOpenRepair": False,
            "hasOpenReachability": True,
            "hasLiveGrant": True,
            "hasDegradedPromise": False,
            "materializedSetsEmpty": False,
            "terminalOutcomePresent": True,
            "commandFollowingConsumed": True,
            "episodePolicySatisfied": True,
            "requiredLineageEpoch": 41,
        },
        "expectedDecision": "defer",
        "closedByMode": "not_closed",
        "reopenIntent": "contact_route_repair",
        "explanation": "Closure stays blocked while a current promise still depends on broken reachability or a live PHI-bearing grant.",
    },
    {
        "scenarioId": "VSC_055_URGENT_BOUNCE_BACK_REOPEN_V1",
        "label": "Governed reopen for urgent bounce-back",
        "selectedSignalId": "MSIG_055_PHARMACY_CASE_BOUNCE_BACK",
        "matchingBlockerClassKeys": ["safety_preemption", "reachability_dependency"],
        "matchingReopenTriggerClass": "bounce_back",
        "inputVector": {
            "hasActiveLeases": False,
            "hasOpenPreemption": True,
            "hasOpenApprovalOrConfirmation": False,
            "hasOpenReconciliation": False,
            "hasOpenRepair": False,
            "hasOpenReachability": True,
            "hasLiveGrant": False,
            "hasDegradedPromise": False,
            "materializedSetsEmpty": False,
            "terminalOutcomePresent": False,
            "commandFollowingConsumed": True,
            "episodePolicySatisfied": True,
            "requiredLineageEpoch": 42,
        },
        "expectedDecision": "defer",
        "closedByMode": "not_closed",
        "reopenIntent": "urgent_triage_reopen",
        "explanation": "Urgent bounce-back reacquires triage ownership and prevents closure under the new lineage epoch.",
    },
]


def read_json(path: Path) -> Any:
    return json.loads(path.read_text())


def write_json(path: Path, payload: Any) -> None:
    path.write_text(json.dumps(payload, indent=2) + "\n")


def write_text(path: Path, content: str) -> None:
    path.write_text(content)


def write_csv(path: Path, fieldnames: list[str], rows: list[dict[str, Any]]) -> None:
    with path.open("w", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        for row in rows:
            writer.writerow(row)


def read_csv(path: Path) -> list[dict[str, str]]:
    with path.open() as handle:
        return list(csv.DictReader(handle))


def require(condition: bool, message: str) -> None:
    if not condition:
        raise SystemExit(message)


def split_semicolon(value: str) -> list[str]:
    if not value:
        return []
    return [item.strip() for item in value.split(";") if item.strip()]


def ordered_unique(values: list[str]) -> list[str]:
    seen: set[str] = set()
    result: list[str] = []
    for value in values:
        if value and value not in seen:
            seen.add(value)
            result.append(value)
    return result


def stable_hash(payload: Any) -> str:
    return hashlib.sha256(
        json.dumps(payload, sort_keys=True, separators=(",", ":")).encode("utf-8")
    ).hexdigest()


def short_hash(payload: Any) -> str:
    return stable_hash(payload)[:16]


def join_refs(values: list[str]) -> str:
    return "; ".join(values)


def load_context() -> dict[str, Any]:
    prerequisite_paths = [
        ROUTE_SCOPE_PATH,
        EVENT_CONTRACTS_PATH,
        FRONTEND_MANIFEST_PATH,
        RELEASE_PARITY_PATH,
        TENANT_SCOPE_PATH,
        ROOT / "docs" / "architecture" / "05_request_lineage_model.md",
        ROOT / "docs" / "architecture" / "07_state_machine_atlas.md",
    ]
    for path in prerequisite_paths:
        require(path.exists(), f"PREREQUISITE_GAP_055_MISSING::{path}")

    route_rows = read_csv(ROUTE_SCOPE_PATH)
    event_payload = read_json(EVENT_CONTRACTS_PATH)
    frontend_payload = read_json(FRONTEND_MANIFEST_PATH)
    release_payload = read_json(RELEASE_PARITY_PATH)
    tenant_payload = read_json(TENANT_SCOPE_PATH)

    require(event_payload.get("task_id") == "seq_048", "PREREQUISITE_GAP_055_EVENT_CONTRACTS_STALE")
    require(frontend_payload.get("task_id") == "seq_050", "PREREQUISITE_GAP_055_FRONTEND_MANIFESTS_STALE")
    require(release_payload.get("task_id") == "seq_051", "PREREQUISITE_GAP_055_RELEASE_RULES_STALE")
    require(tenant_payload.get("task_id") == "seq_054", "PREREQUISITE_GAP_055_TENANT_SCOPE_STALE")

    route_rows_by_family: dict[str, list[dict[str, str]]] = {}
    for row in route_rows:
        route_rows_by_family.setdefault(row["route_family_id"], []).append(row)

    event_lookup = {row["eventName"]: row for row in event_payload["contracts"]}
    tuple_lookup = {row["actingScopeTupleId"]: row for row in tenant_payload["actingScopeTuples"]}
    release_rows = release_payload.get("releaseCandidates", [])

    require(route_rows, "PREREQUISITE_GAP_055_ROUTE_SCOPE_ROWS_EMPTY")
    require(event_lookup, "PREREQUISITE_GAP_055_EVENT_LOOKUP_EMPTY")
    require(tuple_lookup, "PREREQUISITE_GAP_055_SCOPE_TUPLES_EMPTY")
    require(release_rows, "PREREQUISITE_GAP_055_RELEASE_ROWS_EMPTY")

    return {
        "route_rows": route_rows,
        "route_rows_by_family": route_rows_by_family,
        "event_lookup": event_lookup,
        "frontend_payload": frontend_payload,
        "release_payload": release_payload,
        "tenant_payload": tenant_payload,
        "tuple_lookup": tuple_lookup,
        "release_rows": release_rows,
    }


def route_context(route_family_refs: list[str], route_rows_by_family: dict[str, list[dict[str, str]]]) -> dict[str, list[str]]:
    rows: list[dict[str, str]] = []
    for route_family_ref in route_family_refs:
        rows.extend(route_rows_by_family.get(route_family_ref, []))
    return {
        "routeScopeRequirementRefs": ordered_unique(
            [row["route_scope_requirement_id"] for row in rows]
        ),
        "actingScopeTupleRefs": ordered_unique(
            [row["sample_acting_scope_tuple_ref"] for row in rows if row["sample_acting_scope_tuple_ref"]]
        ),
        "audienceSurfaceRefs": ordered_unique(
            sum((split_semicolon(row["audience_surface_refs"]) for row in rows), [])
        ),
        "runtimeBindingRefs": ordered_unique(
            sum((split_semicolon(row["required_runtime_binding_refs"]) for row in rows), [])
        ),
        "trustRefs": ordered_unique(
            sum((split_semicolon(row["required_trust_refs"]) for row in rows), [])
        ),
        "purposeRefs": ordered_unique([row["purpose_of_use_ref"] for row in rows if row["purpose_of_use_ref"]]),
    }


def resolve_event_ids(event_names: list[str], event_lookup: dict[str, dict[str, Any]]) -> list[str]:
    resolved: list[str] = []
    for name in event_names:
        row = event_lookup.get(name)
        require(row is not None, f"PREREQUISITE_GAP_055_EVENT_MISSING::{name}")
        resolved.append(row["canonicalEventContractId"])
    return resolved


def build_blocker_taxonomy(context: dict[str, Any]) -> dict[str, Any]:
    event_lookup = context["event_lookup"]
    blocker_rows: list[dict[str, Any]] = []
    for definition in BLOCKER_CLASS_DEFINITIONS:
        row = {
            **definition,
            "eventContractRefs": resolve_event_ids(definition["eventNames"], event_lookup),
        }
        blocker_rows.append(row)

    evaluation_checks = list(EVALUATION_CHECK_DEFINITIONS)
    reopen_rows = []
    for definition in REOPEN_TRIGGER_DEFINITIONS:
        row = {
            **definition,
            "sourceEventContractRefs": resolve_event_ids(definition["sourceEventNames"], event_lookup),
        }
        reopen_rows.append(row)

    coordinator_event_names = [
        "request.closure_blockers.changed",
        "request.close.evaluated",
        "request.closed",
        "request.reopened",
    ]
    coordinator_event_contracts = [
        {
            "eventName": event_name,
            "eventContractRef": context["event_lookup"][event_name]["canonicalEventContractId"],
            "schemaVersionRef": context["event_lookup"][event_name]["schemaVersionRef"],
        }
        for event_name in coordinator_event_names
    ]

    verdict_rows = []
    for definition in VERDICT_SCENARIOS:
        input_hash = short_hash(definition["inputVector"])
        verdict_rows.append(
            {
                **definition,
                "scenarioInputHash": input_hash,
            }
        )

    taxonomy = {
        "task_id": TASK_ID,
        "visual_mode": VISUAL_MODE,
        "captured_on": CAPTURED_ON,
        "generated_at": TIMESTAMP,
        "mission": MISSION,
        "source_precedence": SOURCE_PRECEDENCE,
        "summary": {
            "coordinator_input_count": len(INPUT_DEFINITIONS),
            "blocker_category_count": len(blocker_rows),
            "milestone_signal_count": len(SIGNAL_DEFINITIONS),
            "evaluation_check_count": len(evaluation_checks),
            "verdict_scenario_count": len(verdict_rows),
            "reopen_trigger_count": len(reopen_rows),
        },
        "coordinatorEventContracts": coordinator_event_contracts,
        "blockerClasses": blocker_rows,
        "evaluationChecks": evaluation_checks,
        "reopenTriggerMatrix": reopen_rows,
        "verdictScenarios": verdict_rows,
        "assumptions": ASSUMPTIONS,
        "defects": DEFECTS,
        "upstream_inputs": {
            "route_scope_requirements": str(ROUTE_SCOPE_PATH.relative_to(ROOT)),
            "canonical_event_contracts": str(EVENT_CONTRACTS_PATH.relative_to(ROOT)),
            "frontend_contract_manifests": str(FRONTEND_MANIFEST_PATH.relative_to(ROOT)),
            "release_publication_parity_rules": str(RELEASE_PARITY_PATH.relative_to(ROOT)),
            "tenant_scope_model": str(TENANT_SCOPE_PATH.relative_to(ROOT)),
        },
    }
    return taxonomy


def build_signal_rows(context: dict[str, Any]) -> list[dict[str, Any]]:
    route_rows_by_family = context["route_rows_by_family"]
    event_lookup = context["event_lookup"]
    rows: list[dict[str, Any]] = []
    for definition in SIGNAL_DEFINITIONS:
        route_refs = definition["routeFamilyRefs"]
        route_details = route_context(route_refs, route_rows_by_family)
        event_contract_refs = resolve_event_ids(definition["eventNames"], event_lookup)
        row = {
            "milestone_signal_id": definition["milestoneSignalId"],
            "domain_context": definition["domainContext"],
            "case_family": definition["caseFamily"],
            "signal_name": definition["signalName"],
            "signal_class": definition["signalClass"],
            "event_contract_refs": join_refs(event_contract_refs),
            "route_family_refs": join_refs(route_refs),
            "route_scope_requirement_refs": join_refs(route_details["routeScopeRequirementRefs"]),
            "audience_surface_refs": join_refs(route_details["audienceSurfaceRefs"]),
            "acting_scope_tuple_refs": join_refs(route_details["actingScopeTupleRefs"]),
            "runtime_binding_refs": join_refs(route_details["runtimeBindingRefs"]),
            "trust_refs": join_refs(route_details["trustRefs"]),
            "purpose_refs": join_refs(route_details["purposeRefs"]),
            "coordinator_consumption_mode": definition["coordinatorConsumptionMode"],
            "candidate_request_milestone": definition["candidateRequestMilestone"],
            "blocker_class_keys": ";".join(definition["blockerClassKeys"]),
            "closure_eligibility": definition["closureEligibility"],
            "reopen_trigger_class": definition["reopenTriggerClass"],
            "evaluation_check_refs": ";".join(definition["evaluationCheckRefs"]),
            "may_write_request_workflow_directly": "no",
            "may_write_request_closed_directly": "no",
            "coordinator_close_event_ref": event_lookup["request.close.evaluated"]["canonicalEventContractId"],
            "coordinator_closed_event_ref": event_lookup["request.closed"]["canonicalEventContractId"],
            "coordinator_reopened_event_ref": event_lookup["request.reopened"]["canonicalEventContractId"],
            "required_lineage_epoch": "yes",
            "meaning": definition["meaning"],
            "source_refs": join_refs(definition["source_refs"]),
        }
        rows.append(row)

    return sorted(rows, key=lambda row: (row["domain_context"], row["milestone_signal_id"]))


def build_input_rows(context: dict[str, Any]) -> list[dict[str, Any]]:
    route_rows_by_family = context["route_rows_by_family"]
    event_lookup = context["event_lookup"]
    release_rows = context["release_rows"]
    release_freeze_refs = ordered_unique(
        [row["releaseApprovalFreezeRef"] for row in release_rows]
    )

    rows: list[dict[str, Any]] = []
    for definition in INPUT_DEFINITIONS:
        route_refs = definition["routeFamilyRefs"]
        route_details = route_context(route_refs, route_rows_by_family)
        event_contract_refs = resolve_event_ids(definition["eventNames"], event_lookup)
        row = {
            "lifecycle_input_id": definition["lifecycleInputId"],
            "input_family": definition["inputFamily"],
            "source_object_type": definition["sourceObjectType"],
            "owning_bounded_context_ref": definition["owningBoundedContextRef"],
            "event_contract_refs": join_refs(event_contract_refs),
            "route_family_refs": join_refs(route_refs),
            "route_scope_requirement_refs": join_refs(route_details["routeScopeRequirementRefs"]),
            "audience_surface_refs": join_refs(route_details["audienceSurfaceRefs"]),
            "acting_scope_tuple_refs": join_refs(route_details["actingScopeTupleRefs"]),
            "runtime_binding_refs": join_refs(route_details["runtimeBindingRefs"]),
            "trust_refs": join_refs(route_details["trustRefs"]),
            "release_approval_freeze_refs": join_refs(release_freeze_refs),
            "request_closure_record_field": definition["requestClosureRecordField"],
            "blocker_class_key": definition["blockerClassKey"],
            "evaluation_stage": definition["evaluationStage"],
            "materialization_rule": definition["materializationRule"],
            "failure_effect": definition["failureEffect"],
            "same_shell_recovery": definition["sameShellRecovery"],
            "required_lineage_epoch": "yes",
            "source_refs": join_refs(definition["source_refs"]),
        }
        rows.append(row)

    return sorted(rows, key=lambda row: row["lifecycle_input_id"])


def build_reopen_rows(context: dict[str, Any]) -> list[dict[str, Any]]:
    event_lookup = context["event_lookup"]
    rows: list[dict[str, Any]] = []
    for definition in REOPEN_TRIGGER_DEFINITIONS:
        row = {
            "reopen_trigger_id": definition["reopenTriggerId"],
            "reopen_trigger_class": definition["reopenTriggerClass"],
            "signal_vector": definition["signalVector"],
            "threshold_rule": definition["thresholdRule"],
            "reacquire_ownership": definition["reacquireOwnership"],
            "closure_effect": definition["closureEffect"],
            "source_event_contract_refs": join_refs(resolve_event_ids(definition["sourceEventNames"], event_lookup)),
            "source_refs": join_refs(definition["source_refs"]),
        }
        rows.append(row)
    return rows


def build_schema(taxonomy: dict[str, Any]) -> dict[str, Any]:
    defer_reason_codes = [row["deferReasonCode"] for row in taxonomy["evaluationChecks"]]
    schema = {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "title": "Vecells request closure record schema",
        "description": (
            "Persisted close or defer verdict minted by LifecycleCoordinator under the current lineage epoch."
        ),
        "task_id": TASK_ID,
        "visual_mode": VISUAL_MODE,
        "captured_on": CAPTURED_ON,
        "generated_at": TIMESTAMP,
        "source_precedence": SOURCE_PRECEDENCE,
        "type": "object",
        "additionalProperties": False,
        "required": [
            "closureRecordId",
            "episodeId",
            "requestId",
            "requestLineageRef",
            "evaluatedAt",
            "requiredLineageEpoch",
            "blockingLeaseRefs",
            "blockingPreemptionRefs",
            "blockingApprovalRefs",
            "blockingReconciliationRefs",
            "blockingConfirmationRefs",
            "blockingLineageCaseLinkRefs",
            "blockingDuplicateClusterRefs",
            "blockingFallbackCaseRefs",
            "blockingIdentityRepairRefs",
            "blockingGrantRefs",
            "blockingReachabilityRefs",
            "blockingDegradedPromiseRefs",
            "decision",
            "closedByMode",
            "deferReasonCodes",
            "currentClosureBlockerRefs",
            "currentConfirmationGateRefs",
            "terminalOutcomeRef",
            "requiredCommandFollowingProjectionRefs",
            "consumedCausalTokenRef",
            "materializedBlockerSetHash",
        ],
        "properties": {
            "closureRecordId": {"type": "string"},
            "episodeId": {"type": "string"},
            "requestId": {"type": "string"},
            "requestLineageRef": {"type": "string"},
            "evaluatedAt": {"type": "string", "format": "date-time"},
            "requiredLineageEpoch": {"type": "integer", "minimum": 0},
            "blockingLeaseRefs": {"$ref": "#/$defs/refArray"},
            "blockingPreemptionRefs": {"$ref": "#/$defs/refArray"},
            "blockingApprovalRefs": {"$ref": "#/$defs/refArray"},
            "blockingReconciliationRefs": {"$ref": "#/$defs/refArray"},
            "blockingConfirmationRefs": {"$ref": "#/$defs/refArray"},
            "blockingLineageCaseLinkRefs": {"$ref": "#/$defs/refArray"},
            "blockingDuplicateClusterRefs": {"$ref": "#/$defs/refArray"},
            "blockingFallbackCaseRefs": {"$ref": "#/$defs/refArray"},
            "blockingIdentityRepairRefs": {"$ref": "#/$defs/refArray"},
            "blockingGrantRefs": {"$ref": "#/$defs/refArray"},
            "blockingReachabilityRefs": {"$ref": "#/$defs/refArray"},
            "blockingDegradedPromiseRefs": {"$ref": "#/$defs/refArray"},
            "decision": {"type": "string", "enum": ["close", "defer"]},
            "closedByMode": {
                "type": "string",
                "enum": [
                    "routine_terminal_outcome",
                    "governed_return_close",
                    "coordinator_episode_close",
                    "manually_authorized_exception_close",
                    "not_closed",
                ],
            },
            "deferReasonCodes": {
                "type": "array",
                "items": {"type": "string", "enum": defer_reason_codes},
                "uniqueItems": True,
            },
            "currentClosureBlockerRefs": {"$ref": "#/$defs/refArray"},
            "currentConfirmationGateRefs": {"$ref": "#/$defs/refArray"},
            "terminalOutcomeRef": {"type": "string"},
            "requiredCommandFollowingProjectionRefs": {"$ref": "#/$defs/refArray"},
            "consumedCausalTokenRef": {"type": "string"},
            "materializedBlockerSetHash": {"type": "string", "pattern": "^[a-f0-9]{16,64}$"},
        },
        "$defs": {
            "refArray": {
                "type": "array",
                "items": {"type": "string"},
                "uniqueItems": True,
            }
        },
        "examples": [
            {
                "closureRecordId": "RCR_055_EXAMPLE_CLOSE_V1",
                "episodeId": "episode://alpha/1",
                "requestId": "request://alpha/1",
                "requestLineageRef": "lineage://alpha/1",
                "evaluatedAt": TIMESTAMP,
                "requiredLineageEpoch": 41,
                "blockingLeaseRefs": [],
                "blockingPreemptionRefs": [],
                "blockingApprovalRefs": [],
                "blockingReconciliationRefs": [],
                "blockingConfirmationRefs": [],
                "blockingLineageCaseLinkRefs": [],
                "blockingDuplicateClusterRefs": [],
                "blockingFallbackCaseRefs": [],
                "blockingIdentityRepairRefs": [],
                "blockingGrantRefs": [],
                "blockingReachabilityRefs": [],
                "blockingDegradedPromiseRefs": [],
                "decision": "close",
                "closedByMode": "routine_terminal_outcome",
                "deferReasonCodes": [],
                "currentClosureBlockerRefs": [],
                "currentConfirmationGateRefs": [],
                "terminalOutcomeRef": "outcome://booking/confirmed/1",
                "requiredCommandFollowingProjectionRefs": ["projection://request/1"],
                "consumedCausalTokenRef": "causal://request/1/close/41",
                "materializedBlockerSetHash": short_hash({"decision": "close", "epoch": 41}),
            },
            {
                "closureRecordId": "RCR_055_EXAMPLE_DEFER_V1",
                "episodeId": "episode://alpha/1",
                "requestId": "request://alpha/1",
                "requestLineageRef": "lineage://alpha/1",
                "evaluatedAt": TIMESTAMP,
                "requiredLineageEpoch": 42,
                "blockingLeaseRefs": [],
                "blockingPreemptionRefs": ["spr://urgent/1"],
                "blockingApprovalRefs": [],
                "blockingReconciliationRefs": [],
                "blockingConfirmationRefs": [],
                "blockingLineageCaseLinkRefs": [],
                "blockingDuplicateClusterRefs": [],
                "blockingFallbackCaseRefs": [],
                "blockingIdentityRepairRefs": [],
                "blockingGrantRefs": [],
                "blockingReachabilityRefs": ["reach://repair/1"],
                "blockingDegradedPromiseRefs": [],
                "decision": "defer",
                "closedByMode": "not_closed",
                "deferReasonCodes": ["SAFETY_PREEMPTION_OPEN", "REACHABILITY_REPAIR_OPEN"],
                "currentClosureBlockerRefs": ["spr://urgent/1", "reach://repair/1"],
                "currentConfirmationGateRefs": [],
                "terminalOutcomeRef": "outcome://pharmacy/bounce_back/1",
                "requiredCommandFollowingProjectionRefs": ["projection://request/1"],
                "consumedCausalTokenRef": "causal://request/1/defer/42",
                "materializedBlockerSetHash": short_hash({"decision": "defer", "epoch": 42}),
            },
        ],
    }
    return schema


def markdown_table(headers: list[str], rows: list[list[str]]) -> str:
    lines = [
        "| " + " | ".join(headers) + " |",
        "| " + " | ".join(["---"] * len(headers)) + " |",
    ]
    for row in rows:
        lines.append("| " + " | ".join(row) + " |")
    return "\n".join(lines)


def build_strategy_doc(
    taxonomy: dict[str, Any],
    input_rows: list[dict[str, Any]],
    signal_rows: list[dict[str, Any]],
) -> str:
    responsibility_rows = [
        [
            "Sole closure authority",
            "Only LifecycleCoordinator persists RequestClosureRecord and may set Request.workflowState = closed.",
        ],
        [
            "Deterministic partition",
            "Closure and reopen run as an episodeId-partitioned deterministic state machine with current lineage epoch validation.",
        ],
        [
            "Blocker materialization",
            "The coordinator alone materializes currentConfirmationGateRefs[] and currentClosureBlockerRefs[] from child-domain evidence.",
        ],
        [
            "One-way signal ingestion",
            "Triage, booking, hub, pharmacy, communications, and support emit signals only; none may write canonical request closure directly.",
        ],
        [
            "Governed reopen",
            "Reopen reacquires the governing lease under a fresh lineage epoch and persists defer before request.reopened.",
        ],
    ]

    close_check_rows = [
        [
            row["checkId"],
            str(row["order"]),
            row["title"],
            row["deferReasonCode"],
        ]
        for row in taxonomy["evaluationChecks"]
    ]

    signal_summary = [
        [
            row["milestone_signal_id"],
            row["domain_context"],
            row["candidate_request_milestone"],
            row["closure_eligibility"],
        ]
        for row in signal_rows
    ]

    return (
        dedent(
            f"""
            # 55 Lifecycle Coordinator Strategy

            ## Summary

            - Coordinator inputs: {taxonomy["summary"]["coordinator_input_count"]}
            - Blocker categories: {taxonomy["summary"]["blocker_category_count"]}
            - Milestone signals: {taxonomy["summary"]["milestone_signal_count"]}
            - Reopen trigger classes: {taxonomy["summary"]["reopen_trigger_count"]}
            - Verdict scenarios: {taxonomy["summary"]["verdict_scenario_count"]}

            `LifecycleCoordinator` is the sole cross-domain authority for canonical request closure and governed reopen. Child domains emit milestone, blocker, and settlement evidence only. Closure is legal only after the current lineage epoch, the materialized blocker sets, the command-following projections, and the terminal outcome all agree.

            ## Responsibilities

            {markdown_table(["Responsibility", "Rule"], responsibility_rows)}

            ## Coordinator Inputs

            {markdown_table(
                ["Input", "Object", "Closure Field", "Failure Effect"],
                [
                    [
                        row["lifecycle_input_id"],
                        row["source_object_type"],
                        row["request_closure_record_field"] or "derived check",
                        row["failure_effect"],
                    ]
                    for row in input_rows
                ],
            )}

            ## Closure Evaluation Order

            {markdown_table(["Check", "Order", "Title", "Defer Code"], close_check_rows)}

            ## One-Way Signal Law

            All milestone rows below are child-domain inputs to the coordinator. None may write `Request.workflowState = closed`; all close or defer outcomes are emitted through `request.close.evaluated`, `request.closed`, or `request.reopened`.

            {markdown_table(["Signal", "Domain", "Candidate Milestone", "Eligibility"], signal_summary)}

            ## Gap Closures

            - Appointment or booking success no longer closes requests directly.
            - Closure is now a persisted coordinator decision, not a passive terminal.
            - Duplicate, fallback, identity-repair, PHI-grant, and reachability blockers are first-class persisted refs.
            - Confirmation-gate and closure-blocker changes consume the canonical event families from seq_048.
            - Child domains can no longer hide blocker meaning inside convenience workflow-state values.
            """
        ).strip()
        + "\n"
    )


def build_blocker_doc(taxonomy: dict[str, Any]) -> str:
    blocker_rows = [
        [
            row["blockerClassId"],
            row["blockerLabel"],
            row["requestClosureRecordField"],
            ", ".join(row["eventContractRefs"][:2]) + ("…" if len(row["eventContractRefs"]) > 2 else ""),
        ]
        for row in taxonomy["blockerClasses"]
    ]

    scenario_rows = [
        [
            row["scenarioId"],
            row["label"],
            row["expectedDecision"],
            row["closedByMode"],
        ]
        for row in taxonomy["verdictScenarios"]
    ]

    return (
        dedent(
            f"""
            # 55 Closure Blocker Ledger

            ## Summary

            The blocker taxonomy is orthogonal to workflow milestones. Every row below materializes into one explicit `RequestClosureRecord` field, and every blocker class is forbidden from becoming a `Request.workflowState` value.

            {markdown_table(["Blocker", "Label", "Persisted Field", "Event Contracts"], blocker_rows)}

            ## Verdict Scenarios

            {markdown_table(["Scenario", "Label", "Decision", "Closed By Mode"], scenario_rows)}

            ## Persisted Close Record Rules

            - `requiredLineageEpoch` is mandatory for both close and defer.
            - `currentClosureBlockerRefs[]` and `currentConfirmationGateRefs[]` must be empty before a close verdict is legal.
            - `deferReasonCodes[]` cannot stand in for blocker refs; it supplements them.
            - `closedByMode = not_closed` is mandatory whenever `decision = defer`.
            """
        ).strip()
        + "\n"
    )


def build_signal_rules_doc(
    signal_rows: list[dict[str, Any]],
    reopen_rows: list[dict[str, Any]],
) -> str:
    signal_table = markdown_table(
        ["Signal", "Domain", "Blockers", "Coordinator Consumption", "Reopen"],
        [
            [
                row["milestone_signal_id"],
                row["domain_context"],
                row["blocker_class_keys"] or "none",
                row["coordinator_consumption_mode"],
                row["reopen_trigger_class"],
            ]
            for row in signal_rows
        ],
    )

    reopen_table = markdown_table(
        ["Trigger", "Vector", "Threshold", "Ownership Reacquire"],
        [
            [
                row["reopen_trigger_id"],
                row["signal_vector"],
                row["threshold_rule"],
                row["reacquire_ownership"],
            ]
            for row in reopen_rows
        ],
    )

    return (
        dedent(
            f"""
            # 55 Milestone Signal And Coordinator Rules

            ## Signal Producers Versus Canonical State Owner

            The rule is one-way:

            - child domains emit milestone, gate, repair, or reopen signals
            - `LifecycleCoordinator` consumes those signals under the current lineage epoch
            - only the coordinator may emit canonical close, defer, or reopen verdicts

            ## Milestone Signal Matrix

            {signal_table}

            ## Reopen Trigger Matrix

            {reopen_table}

            ## Non-Negotiable Rules

            - No downstream domain may write `Request.workflowState = closed`.
            - No blocker class may be encoded as workflow state.
            - `request.close.evaluated` is the canonical defer-or-close checkpoint.
            - `request.reopened` is legal only after a persisted defer verdict under the new lineage epoch.
            """
        ).strip()
        + "\n"
    )


def build_lab_html() -> str:
    return (
        dedent(
            """
            <!doctype html>
            <html lang="en">
              <head>
                <meta charset="utf-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <title>Vecells Lifecycle Coordinator Lab</title>
                <style>
                  :root {
                    color-scheme: light;
                    --canvas: #F7F8FC;
                    --rail: #EEF2F8;
                    --panel: #FFFFFF;
                    --inset: #F4F6FB;
                    --text-strong: #0F172A;
                    --text: #1E293B;
                    --muted: #667085;
                    --border-subtle: #E2E8F0;
                    --border: #CBD5E1;
                    --primary: #3559E6;
                    --milestone: #0EA5A4;
                    --blocker: #6E59D9;
                    --warning: #C98900;
                    --blocked: #C24141;
                    --shadow: 0 22px 40px rgba(15, 23, 42, 0.07);
                    font-family: ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
                  }
                  * { box-sizing: border-box; }
                  body {
                    margin: 0;
                    background:
                      radial-gradient(circle at 12% 0%, rgba(53, 89, 230, 0.06), transparent 26%),
                      radial-gradient(circle at 88% 12%, rgba(110, 89, 217, 0.06), transparent 26%),
                      linear-gradient(180deg, #FAFBFE, var(--canvas));
                    color: var(--text);
                  }
                  .app { max-width: 1500px; margin: 0 auto; padding: 18px; }
                  .masthead {
                    position: sticky;
                    top: 0;
                    z-index: 10;
                    min-height: 72px;
                    display: flex;
                    align-items: center;
                    gap: 18px;
                    padding: 12px 16px;
                    border: 1px solid var(--border-subtle);
                    border-radius: 28px;
                    background: rgba(255,255,255,0.94);
                    backdrop-filter: blur(12px);
                    box-shadow: var(--shadow);
                  }
                  .brand { display: flex; align-items: center; gap: 12px; min-width: 252px; }
                  .mark {
                    width: 42px;
                    height: 42px;
                    border-radius: 14px;
                    border: 1px solid rgba(15, 23, 42, 0.08);
                    background: linear-gradient(180deg, rgba(255,255,255,0.96), rgba(244,246,251,0.96));
                    display: grid;
                    place-items: center;
                    color: var(--blocker);
                  }
                  .brand strong { display: block; font-size: 16px; color: var(--text-strong); }
                  .brand small,
                  .metric span,
                  .label,
                  .eyebrow {
                    display: block;
                    font-size: 11px;
                    letter-spacing: 0.08em;
                    text-transform: uppercase;
                    color: var(--muted);
                  }
                  .metrics { display: grid; grid-template-columns: repeat(4, minmax(132px, 1fr)); gap: 12px; flex: 1; }
                  .metric {
                    padding: 12px 14px;
                    border-radius: 18px;
                    border: 1px solid var(--border-subtle);
                    background: rgba(255,255,255,0.84);
                  }
                  .metric strong { display: block; font-size: 22px; color: var(--text-strong); }
                  .layout {
                    display: grid;
                    grid-template-columns: 300px minmax(0, 1fr) 396px;
                    gap: 18px;
                    margin-top: 18px;
                    align-items: start;
                  }
                  .rail, .center, .inspector {
                    border-radius: 28px;
                    border: 1px solid var(--border-subtle);
                    background: var(--panel);
                    box-shadow: var(--shadow);
                  }
                  .rail {
                    padding: 18px;
                    background: linear-gradient(180deg, rgba(255,255,255,0.97), var(--rail));
                  }
                  .filters { display: grid; gap: 12px; }
                  label { display: grid; gap: 6px; font-size: 13px; color: var(--text-strong); }
                  select {
                    height: 44px;
                    border-radius: 14px;
                    border: 1px solid var(--border);
                    background: var(--panel);
                    color: var(--text);
                    padding: 0 12px;
                  }
                  .rail-copy {
                    margin-top: 16px;
                    padding: 14px;
                    border-radius: 18px;
                    border: 1px solid var(--border-subtle);
                    background: rgba(255,255,255,0.88);
                  }
                  .center {
                    padding: 18px;
                    display: grid;
                    gap: 18px;
                    min-height: 600px;
                  }
                  .panel {
                    padding: 18px;
                    border-radius: 24px;
                    border: 1px solid var(--border-subtle);
                    background: linear-gradient(180deg, rgba(255,255,255,0.97), rgba(244,246,251,0.94));
                  }
                  .constellation-grid {
                    display: grid;
                    grid-template-columns: minmax(0, 1fr) minmax(280px, 0.44fr);
                    gap: 16px;
                    align-items: center;
                  }
                  .constellation {
                    padding: 12px;
                    border-radius: 20px;
                    border: 1px solid var(--border-subtle);
                    background: rgba(255,255,255,0.92);
                  }
                  .constellation svg { width: 100%; height: 220px; }
                  .node { fill: rgba(255,255,255,0.98); stroke: rgba(53,89,230,0.24); stroke-width: 1.4; }
                  .node.milestone { stroke: rgba(14,165,164,0.42); }
                  .node.blocker { stroke: rgba(110,89,217,0.42); }
                  .node.warning { stroke: rgba(201,137,0,0.42); }
                  .edge { stroke: rgba(148,163,184,0.92); stroke-width: 1.6; }
                  .svg-label { fill: var(--text-strong); font-size: 11px; font-weight: 600; }
                  .svg-sub { fill: var(--muted); font-size: 10px; }
                  .signal-list {
                    display: grid;
                    gap: 10px;
                    max-height: 220px;
                    overflow: auto;
                  }
                  .signal-card {
                    padding: 12px 14px;
                    border-radius: 18px;
                    border: 1px solid var(--border-subtle);
                    background: rgba(255,255,255,0.92);
                    cursor: pointer;
                    transition: transform 180ms ease, border-color 120ms ease, box-shadow 180ms ease;
                  }
                  .signal-card:hover,
                  .signal-card:focus-visible,
                  .signal-card[data-selected="true"] {
                    transform: translateY(-1px);
                    border-color: rgba(53,89,230,0.28);
                    box-shadow: 0 14px 28px rgba(53,89,230,0.08);
                    outline: none;
                  }
                  .chip-row { display: flex; flex-wrap: wrap; gap: 8px; }
                  .chip {
                    display: inline-flex;
                    align-items: center;
                    min-height: 26px;
                    padding: 0 10px;
                    border-radius: 999px;
                    border: 1px solid rgba(15,23,42,0.08);
                    background: rgba(15,23,42,0.04);
                    color: var(--text);
                    font-size: 12px;
                  }
                  .chip.milestone { background: rgba(14,165,164,0.14); color: var(--milestone); }
                  .chip.blocker { background: rgba(110,89,217,0.14); color: var(--blocker); }
                  .chip.warning { background: rgba(201,137,0,0.14); color: var(--warning); }
                  .chip.blocked { background: rgba(194,65,65,0.14); color: var(--blocked); }
                  .verdict-grid {
                    display: grid;
                    grid-template-columns: repeat(2, minmax(0, 1fr));
                    gap: 14px;
                  }
                  .verdict-card {
                    min-height: 148px;
                    display: grid;
                    gap: 10px;
                    padding: 16px;
                    border-radius: 22px;
                    border: 1px solid var(--border-subtle);
                    background: rgba(255,255,255,0.94);
                  }
                  table { width: 100%; border-collapse: collapse; }
                  th, td {
                    text-align: left;
                    padding: 12px 10px;
                    border-bottom: 1px solid var(--border-subtle);
                    vertical-align: top;
                    font-size: 13px;
                    min-height: 40px;
                  }
                  th {
                    font-size: 11px;
                    letter-spacing: 0.06em;
                    text-transform: uppercase;
                    color: var(--muted);
                  }
                  .interactive-row {
                    cursor: pointer;
                    transition: background 120ms ease, box-shadow 180ms ease;
                  }
                  .interactive-row:hover,
                  .interactive-row:focus-visible,
                  .interactive-row[data-selected="true"] {
                    background: rgba(53,89,230,0.06);
                    outline: none;
                  }
                  .lower {
                    display: grid;
                    grid-template-columns: repeat(2, minmax(0, 1fr));
                    gap: 18px;
                  }
                  .inspector {
                    position: sticky;
                    top: 90px;
                    padding: 18px;
                    display: grid;
                    gap: 18px;
                  }
                  .inspector-section {
                    display: grid;
                    gap: 10px;
                    padding-bottom: 16px;
                    border-bottom: 1px solid var(--border-subtle);
                  }
                  .inspector-section:last-child { border-bottom: 0; padding-bottom: 0; }
                  .definition-grid {
                    display: grid;
                    grid-template-columns: repeat(2, minmax(0, 1fr));
                    gap: 10px 12px;
                  }
                  .definition-grid div {
                    padding: 10px 12px;
                    border-radius: 14px;
                    border: 1px solid var(--border-subtle);
                    background: rgba(255,255,255,0.9);
                  }
                  .mono {
                    font-family: ui-monospace, "SFMono-Regular", "SF Mono", Consolas, monospace;
                    font-size: 12px;
                  }
                  .defect-strip { display: grid; gap: 10px; }
                  .defect-card {
                    padding: 14px;
                    border-radius: 18px;
                    border: 1px solid rgba(194,65,65,0.2);
                    background: rgba(194,65,65,0.06);
                  }
                  @media (max-width: 1240px) {
                    .layout {
                      grid-template-columns: 1fr;
                    }
                    .inspector {
                      position: static;
                    }
                  }
                  @media (max-width: 900px) {
                    .metrics,
                    .lower,
                    .verdict-grid,
                    .constellation-grid,
                    .definition-grid {
                      grid-template-columns: 1fr;
                    }
                  }
                  @media (prefers-reduced-motion: reduce) {
                    *, *::before, *::after {
                      animation-duration: 0.01ms !important;
                      animation-iteration-count: 1 !important;
                      transition-duration: 0.01ms !important;
                      scroll-behavior: auto !important;
                    }
                  }
                </style>
              </head>
              <body>
                <div class="app">
                  <header class="masthead" data-testid="masthead">
                    <div class="brand" aria-label="Vecells Lifecycle Coordinator">
                      <div class="mark" aria-hidden="true">
                        <svg viewBox="0 0 48 48" width="24" height="24" fill="none">
                          <path d="M10 10h8v20h14v8H10V10Z" stroke="currentColor" stroke-width="2.2" />
                          <path d="M24 10h14v8H24" stroke="currentColor" stroke-width="2.2" />
                        </svg>
                      </div>
                      <div>
                        <small>Vecells</small>
                        <strong>Lifecycle Coordinator Lab</strong>
                      </div>
                    </div>
                    <div class="metrics" id="metrics"></div>
                  </header>
                  <main class="layout">
                    <aside class="rail">
                      <div class="filters">
                        <label><span class="label">Domain</span><select id="filter-domain" data-testid="filter-domain"></select></label>
                        <label><span class="label">Blocker class</span><select id="filter-blocker-class" data-testid="filter-blocker-class"></select></label>
                        <label><span class="label">Closure eligibility</span><select id="filter-closure-eligibility" data-testid="filter-closure-eligibility"></select></label>
                        <label><span class="label">Reopen trigger</span><select id="filter-reopen-trigger-class" data-testid="filter-reopen-trigger-class"></select></label>
                      </div>
                      <div class="rail-copy">
                        <div class="eyebrow">Control law</div>
                        <p style="margin:8px 0 0;">
                          Milestone signals stay one-way. Blockers remain explicit facts. Close and reopen bind one current lineage epoch.
                        </p>
                      </div>
                    </aside>
                    <section class="center">
                      <section class="panel" data-testid="constellation-canvas">
                        <div class="eyebrow">Milestone-to-blocker constellation</div>
                        <div class="constellation-grid">
                          <div class="constellation" id="constellation"></div>
                          <div class="signal-list" id="signal-cards"></div>
                        </div>
                      </section>
                      <section class="panel" data-testid="verdict-panel">
                        <div class="eyebrow">Closure verdict explanation</div>
                        <div class="verdict-grid" id="verdict-panel"></div>
                      </section>
                      <div class="lower">
                        <section class="panel">
                          <div class="eyebrow">Milestone signal matrix</div>
                          <table>
                            <thead>
                              <tr><th>Signal</th><th>Domain</th><th>Milestone</th><th>Eligibility</th></tr>
                            </thead>
                            <tbody id="signal-matrix"></tbody>
                          </table>
                        </section>
                        <section class="panel">
                          <div class="eyebrow">Closure blocker taxonomy</div>
                          <table>
                            <thead>
                              <tr><th>Blocker</th><th>Field</th><th>Group</th></tr>
                            </thead>
                            <tbody id="blocker-matrix"></tbody>
                          </table>
                        </section>
                        <section class="panel">
                          <div class="eyebrow">Reopen trigger matrix</div>
                          <table>
                            <thead>
                              <tr><th>Trigger</th><th>Threshold</th><th>Reacquire</th></tr>
                            </thead>
                            <tbody id="reopen-matrix"></tbody>
                          </table>
                        </section>
                        <section class="panel" data-testid="defect-strip">
                          <div class="eyebrow">Defect strip</div>
                          <div class="defect-strip" id="defect-strip"></div>
                        </section>
                      </div>
                    </section>
                    <aside class="inspector" data-testid="inspector" id="inspector"></aside>
                  </main>
                </div>
                <script type="module">
                  const DATA_PATHS = {
                    inputs: "../../data/analysis/lifecycle_coordinator_inputs.csv",
                    schema: "../../data/analysis/request_closure_record_schema.json",
                    taxonomy: "../../data/analysis/closure_blocker_taxonomy.json",
                    signals: "../../data/analysis/milestone_signal_matrix.csv",
                    reopen: "../../data/analysis/reopen_trigger_matrix.csv",
                  };

                  const state = {
                    filters: {
                      domain: "all",
                      blockerClass: "all",
                      closureEligibility: "all",
                      reopenTriggerClass: "all",
                    },
                    selection: { kind: "signal", id: "" },
                    payload: null,
                  };

                  function parseCsv(text) {
                    const rows = [];
                    let row = [];
                    let cell = "";
                    let inQuotes = false;
                    for (let index = 0; index < text.length; index += 1) {
                      const char = text[index];
                      const next = text[index + 1];
                      if (char === '"' && inQuotes && next === '"') {
                        cell += '"';
                        index += 1;
                        continue;
                      }
                      if (char === '"') {
                        inQuotes = !inQuotes;
                        continue;
                      }
                      if (char === "," && !inQuotes) {
                        row.push(cell);
                        cell = "";
                        continue;
                      }
                      if ((char === "\\n" || char === "\\r") && !inQuotes) {
                        if (char === "\\r" && next === "\\n") {
                          index += 1;
                        }
                        row.push(cell);
                        if (row.some((value) => value.length > 0)) {
                          rows.push(row);
                        }
                        row = [];
                        cell = "";
                        continue;
                      }
                      cell += char;
                    }
                    if (cell.length || row.length) {
                      row.push(cell);
                      rows.push(row);
                    }
                    const [headers, ...body] = rows;
                    return body.map((values) =>
                      Object.fromEntries(headers.map((header, idx) => [header, values[idx] ?? ""])),
                    );
                  }

                  function splitList(value) {
                    return String(value || "")
                      .split(";")
                      .map((entry) => entry.trim())
                      .filter(Boolean);
                  }

                  function toTestId(value) {
                    return String(value)
                      .toLowerCase()
                      .replace(/[^a-z0-9]+/g, "-")
                      .replace(/^-|-$/g, "");
                  }

                  function optionMarkup(value, label) {
                    return `<option value="${value}">${label}</option>`;
                  }

                  function visibleSignals() {
                    const { signals } = state.payload;
                    return signals.filter((row) => {
                      if (state.filters.domain !== "all" && row.domain_context !== state.filters.domain) {
                        return false;
                      }
                      if (
                        state.filters.blockerClass !== "all" &&
                        !splitList(row.blocker_class_keys).includes(state.filters.blockerClass)
                      ) {
                        return false;
                      }
                      if (
                        state.filters.closureEligibility !== "all" &&
                        row.closure_eligibility !== state.filters.closureEligibility
                      ) {
                        return false;
                      }
                      if (
                        state.filters.reopenTriggerClass !== "all" &&
                        row.reopen_trigger_class !== state.filters.reopenTriggerClass
                      ) {
                        return false;
                      }
                      return true;
                    });
                  }

                  function selectedSignal() {
                    const signals = visibleSignals();
                    if (!signals.length) {
                      return null;
                    }
                    if (state.selection.kind !== "signal") {
                      return signals[0];
                    }
                    return (
                      signals.find((row) => row.milestone_signal_id === state.selection.id) || signals[0]
                    );
                  }

                  function selectedBlocker() {
                    const blockers = state.payload.taxonomy.blockerClasses;
                    if (state.selection.kind !== "blocker") {
                      return null;
                    }
                    return blockers.find((row) => row.blockerClassKey === state.selection.id) || null;
                  }

                  function signalScenario(signal) {
                    const scenarios = state.payload.taxonomy.verdictScenarios;
                    if (!signal) {
                      return scenarios[0];
                    }
                    return (
                      scenarios.find((row) => row.selectedSignalId === signal.milestone_signal_id) ||
                      scenarios.find(
                        (row) =>
                          row.matchingReopenTriggerClass === signal.reopen_trigger_class &&
                          row.matchingReopenTriggerClass !== "none",
                      ) ||
                      scenarios.find((row) =>
                        splitList(signal.blocker_class_keys).some((entry) => row.matchingBlockerClassKeys.includes(entry)),
                      ) ||
                      scenarios[0]
                    );
                  }

                  function renderMetrics() {
                    const summary = state.payload.taxonomy.summary;
                    const metrics = [
                      ["Coordinator inputs", summary.coordinator_input_count],
                      ["Blocker categories", summary.blocker_category_count],
                      ["Defer vs close", summary.verdict_scenario_count],
                      ["Reopen triggers", summary.reopen_trigger_count],
                    ];
                    document.getElementById("metrics").innerHTML = metrics
                      .map(
                        ([label, value]) => `
                          <div class="metric">
                            <span>${label}</span>
                            <strong>${value}</strong>
                          </div>
                        `,
                      )
                      .join("");
                  }

                  function renderFilters() {
                    const signals = state.payload.signals;
                    const blockers = state.payload.taxonomy.blockerClasses;
                    const domains = ["all", ...new Set(signals.map((row) => row.domain_context))];
                    const closureStates = ["all", ...new Set(signals.map((row) => row.closure_eligibility))];
                    const reopenStates = [
                      "all",
                      ...new Set(signals.map((row) => row.reopen_trigger_class).filter((value) => value !== "none")),
                    ];

                    document.getElementById("filter-domain").innerHTML = domains
                      .map((value) => optionMarkup(value, value === "all" ? "All domains" : value))
                      .join("");
                    document.getElementById("filter-blocker-class").innerHTML = [
                      optionMarkup("all", "All blocker classes"),
                      ...blockers.map((row) => optionMarkup(row.blockerClassKey, row.blockerLabel)),
                    ].join("");
                    document.getElementById("filter-closure-eligibility").innerHTML = closureStates
                      .map((value) =>
                        optionMarkup(value, value === "all" ? "All eligibility states" : value),
                      )
                      .join("");
                    document.getElementById("filter-reopen-trigger-class").innerHTML = reopenStates
                      .map((value) =>
                        optionMarkup(value, value === "all" ? "All reopen trigger classes" : value),
                      )
                      .join("");

                    Object.entries({
                      "filter-domain": "domain",
                      "filter-blocker-class": "blockerClass",
                      "filter-closure-eligibility": "closureEligibility",
                      "filter-reopen-trigger-class": "reopenTriggerClass",
                    }).forEach(([elementId, key]) => {
                      const element = document.getElementById(elementId);
                      element.value = state.filters[key];
                      element.onchange = (event) => {
                        state.filters[key] = event.target.value;
                        render();
                      };
                    });
                  }

                  function renderSignalCards(signals) {
                    const selected = selectedSignal();
                    document.getElementById("signal-cards").innerHTML = signals
                      .map(
                        (row) => `
                          <article
                            class="signal-card"
                            tabindex="0"
                            data-testid="signal-card-${toTestId(row.milestone_signal_id)}"
                            data-signal-id="${row.milestone_signal_id}"
                            data-selected="${selected && selected.milestone_signal_id === row.milestone_signal_id}"
                          >
                            <div class="eyebrow">${row.domain_context}</div>
                            <strong>${row.signal_name}</strong>
                            <div class="chip-row">
                              <span class="chip milestone">${row.candidate_request_milestone}</span>
                              <span class="chip ${row.closure_eligibility === "defer_on_blocker" ? "blocked" : row.closure_eligibility === "reopen_candidate" ? "warning" : "milestone"}">${row.closure_eligibility}</span>
                            </div>
                          </article>
                        `,
                      )
                      .join("");

                    document.querySelectorAll("[data-signal-id]").forEach((element) => {
                      element.addEventListener("click", () => {
                        state.selection = { kind: "signal", id: element.dataset.signalId };
                        render();
                      });
                      element.addEventListener("keydown", (event) => {
                        const currentSignals = visibleSignals();
                        const index = currentSignals.findIndex(
                          (row) => row.milestone_signal_id === element.dataset.signalId,
                        );
                        if (event.key === "ArrowDown" && currentSignals[index + 1]) {
                          state.selection = {
                            kind: "signal",
                            id: currentSignals[index + 1].milestone_signal_id,
                          };
                          render();
                          event.preventDefault();
                        }
                        if (event.key === "ArrowUp" && currentSignals[index - 1]) {
                          state.selection = {
                            kind: "signal",
                            id: currentSignals[index - 1].milestone_signal_id,
                          };
                          render();
                          event.preventDefault();
                        }
                      });
                    });
                  }

                  function renderConstellation(signal) {
                    const blockerKeys = splitList(signal?.blocker_class_keys);
                    const blockers = state.payload.taxonomy.blockerClasses.filter((row) =>
                      blockerKeys.includes(row.blockerClassKey),
                    );
                    const scenario = signalScenario(signal);
                    document.getElementById("constellation").innerHTML = `
                      <svg viewBox="0 0 760 220" role="img" aria-label="Lifecycle coordinator constellation">
                        <path class="edge" d="M124 110 H300" />
                        <path class="edge" d="M428 110 H604" />
                        <rect class="node milestone" x="32" y="66" width="184" height="88" rx="18"></rect>
                        <rect class="node" x="300" y="66" width="128" height="88" rx="18"></rect>
                        <rect class="node blocker" x="472" y="34" width="184" height="64" rx="18"></rect>
                        <rect class="node warning" x="472" y="122" width="184" height="64" rx="18"></rect>
                        <text class="svg-label" x="48" y="96">${signal?.domain_context || "filtered"}</text>
                        <text class="svg-sub" x="48" y="116">${signal?.signal_name || "No visible signal"}</text>
                        <text class="svg-label" x="318" y="96">LifecycleCoordinator</text>
                        <text class="svg-sub" x="318" y="116">epoch-bound materialization</text>
                        <text class="svg-label" x="488" y="64">${blockers[0]?.blockerLabel || "No blocker classes"}</text>
                        <text class="svg-sub" x="488" y="84">${blockers.length ? blockers.map((row) => row.blockerClassKey).join(", ") : "closeable candidate"}</text>
                        <text class="svg-label" x="488" y="152">${scenario.expectedDecision}</text>
                        <text class="svg-sub" x="488" y="172">${scenario.closedByMode}</text>
                      </svg>
                    `;
                  }

                  function renderVerdict(signal) {
                    const scenario = signalScenario(signal);
                    const blockerKeys = splitList(signal?.blocker_class_keys);
                    document.getElementById("verdict-panel").innerHTML = `
                      <article class="verdict-card">
                        <div class="eyebrow">Selected scenario</div>
                        <strong>${scenario.label}</strong>
                        <div class="chip-row">
                          <span class="chip ${scenario.expectedDecision === "close" ? "milestone" : "blocked"}">${scenario.expectedDecision}</span>
                          <span class="chip blocker">${scenario.closedByMode}</span>
                          <span class="chip warning mono">${scenario.scenarioInputHash}</span>
                        </div>
                        <p style="margin:0;">${scenario.explanation}</p>
                      </article>
                      <article class="verdict-card">
                        <div class="eyebrow">Selection parity</div>
                        <strong>${signal?.signal_name || "No signal selected"}</strong>
                        <div class="chip-row">
                          ${(blockerKeys.length ? blockerKeys : ["no_blockers"])
                            .map((value) => `<span class="chip blocker">${value}</span>`)
                            .join("")}
                        </div>
                        <p style="margin:0;">The same input tuple must reproduce the same defer-or-close verdict under the current lineage epoch.</p>
                      </article>
                    `;
                  }

                  function renderSignalMatrix(signals) {
                    const selected = selectedSignal();
                    document.getElementById("signal-matrix").innerHTML = signals
                      .map(
                        (row) => `
                          <tr
                            class="interactive-row"
                            tabindex="0"
                            data-testid="signal-row-${toTestId(row.milestone_signal_id)}"
                            data-signal-id="${row.milestone_signal_id}"
                            data-selected="${selected && selected.milestone_signal_id === row.milestone_signal_id}"
                          >
                            <td><strong>${row.signal_name}</strong><div class="mono">${row.milestone_signal_id}</div></td>
                            <td>${row.domain_context}</td>
                            <td>${row.candidate_request_milestone}</td>
                            <td>${row.closure_eligibility}</td>
                          </tr>
                        `,
                      )
                      .join("");

                    document.querySelectorAll("#signal-matrix [data-signal-id]").forEach((element) => {
                      element.addEventListener("click", () => {
                        state.selection = { kind: "signal", id: element.dataset.signalId };
                        render();
                      });
                      element.addEventListener("keydown", (event) => {
                        const currentSignals = visibleSignals();
                        const index = currentSignals.findIndex(
                          (row) => row.milestone_signal_id === element.dataset.signalId,
                        );
                        if (event.key === "ArrowDown" && currentSignals[index + 1]) {
                          state.selection = {
                            kind: "signal",
                            id: currentSignals[index + 1].milestone_signal_id,
                          };
                          render();
                          event.preventDefault();
                        }
                        if (event.key === "ArrowUp" && currentSignals[index - 1]) {
                          state.selection = {
                            kind: "signal",
                            id: currentSignals[index - 1].milestone_signal_id,
                          };
                          render();
                          event.preventDefault();
                        }
                      });
                    });
                  }

                  function renderBlockerMatrix(signal) {
                    const selectedBlockerKey = state.selection.kind === "blocker" ? state.selection.id : "";
                    const linkedKeys = new Set(splitList(signal?.blocker_class_keys));
                    document.getElementById("blocker-matrix").innerHTML = state.payload.taxonomy.blockerClasses
                      .map((row) => {
                        const linked = linkedKeys.has(row.blockerClassKey);
                        const selected = selectedBlockerKey === row.blockerClassKey;
                        return `
                          <tr
                            class="interactive-row"
                            tabindex="0"
                            data-testid="blocker-row-${toTestId(row.blockerClassKey)}"
                            data-blocker-key="${row.blockerClassKey}"
                            data-linked="${linked}"
                            data-selected="${selected}"
                          >
                            <td><strong>${row.blockerLabel}</strong><div class="mono">${row.blockerClassKey}</div></td>
                            <td class="mono">${row.requestClosureRecordField}</td>
                            <td>${row.group}</td>
                          </tr>
                        `;
                      })
                      .join("");
                    document.querySelectorAll("[data-blocker-key]").forEach((element) => {
                      element.addEventListener("click", () => {
                        state.selection = { kind: "blocker", id: element.dataset.blockerKey };
                        render();
                      });
                    });
                  }

                  function renderReopenMatrix(signal) {
                    const selectedClass =
                      state.selection.kind === "signal" ? signal?.reopen_trigger_class : "";
                    document.getElementById("reopen-matrix").innerHTML = state.payload.reopen
                      .map((row) => `
                        <tr
                          data-testid="reopen-row-${toTestId(row.reopen_trigger_class)}"
                          data-linked="${selectedClass && row.reopen_trigger_class === selectedClass}"
                        >
                          <td><strong>${row.reopen_trigger_class}</strong></td>
                          <td>${row.threshold_rule}</td>
                          <td>${row.reacquire_ownership}</td>
                        </tr>
                      `)
                      .join("");
                  }

                  function renderInspector(signal) {
                    const schema = state.payload.schema;
                    const blocker =
                      state.selection.kind === "blocker"
                        ? state.payload.taxonomy.blockerClasses.find((row) => row.blockerClassKey === state.selection.id)
                        : null;
                    const closureFields = Object.keys(schema.properties).filter((key) =>
                      key.startsWith("blocking") || key.endsWith("Epoch") || key.endsWith("Ref"),
                    );
                    const detailTitle = blocker ? blocker.blockerLabel : signal?.signal_name;
                    const detailBody = blocker
                      ? blocker.clearsVia
                      : signal?.meaning;
                    const refs = blocker
                      ? blocker.eventContractRefs
                      : splitList(signal?.event_contract_refs);
                    const scopeRefs = blocker
                      ? []
                      : splitList(signal?.acting_scope_tuple_refs);
                    const checks = blocker
                      ? blocker.evaluationCheckRefs
                      : splitList(signal?.evaluation_check_refs);
                    document.getElementById("inspector").innerHTML = `
                      <section class="inspector-section">
                        <div class="eyebrow">${blocker ? "Selected blocker" : "Selected signal"}</div>
                        <strong>${detailTitle || "No selection"}</strong>
                        <p style="margin:0;">${detailBody || "No visible records match the current filters."}</p>
                        <div class="chip-row">
                          ${(refs.length ? refs : ["no_event_contract"])
                            .map((value) => `<span class="chip blocker mono">${value}</span>`)
                            .join("")}
                        </div>
                      </section>
                      <section class="inspector-section">
                        <div class="eyebrow">Closure record fields</div>
                        <div class="definition-grid">
                          ${closureFields
                            .slice(0, 10)
                            .map(
                              (field) => `
                                <div>
                                  <span class="label">${field}</span>
                                  <strong class="mono">${field}</strong>
                                </div>
                              `,
                            )
                            .join("")}
                        </div>
                      </section>
                      <section class="inspector-section">
                        <div class="eyebrow">Consumed epoch and fence</div>
                        <div class="chip-row">
                          <span class="chip warning mono">requiredLineageEpoch</span>
                          <span class="chip warning mono">LineageFence.currentEpoch</span>
                          <span class="chip warning mono">command_following</span>
                        </div>
                        ${scopeRefs.length
                          ? `<div class="chip-row">${scopeRefs
                              .map((value) => `<span class="chip milestone mono">${value}</span>`)
                              .join("")}</div>`
                          : ""}
                      </section>
                      <section class="inspector-section">
                        <div class="eyebrow">Evaluation checks</div>
                        <div class="chip-row">
                          ${checks.map((value) => `<span class="chip mono">${value}</span>`).join("")}
                        </div>
                      </section>
                    `;
                  }

                  function renderDefects() {
                    document.getElementById("defect-strip").innerHTML = state.payload.taxonomy.defects
                      .map(
                        (row) => `
                          <article class="defect-card" data-testid="defect-${toTestId(row.defectId)}">
                            <strong>${row.defectId}</strong>
                            <p style="margin:8px 0 0;">${row.summary}</p>
                          </article>
                        `,
                      )
                      .join("");
                  }

                  function render() {
                    const signals = visibleSignals();
                    if (!signals.length) {
                      state.selection = { kind: "signal", id: "" };
                    } else if (
                      state.selection.kind === "signal" &&
                      !signals.some((row) => row.milestone_signal_id === state.selection.id)
                    ) {
                      state.selection = { kind: "signal", id: signals[0].milestone_signal_id };
                    }
                    const signal = selectedSignal();
                    renderMetrics();
                    renderFilters();
                    renderSignalCards(signals);
                    renderConstellation(signal);
                    renderVerdict(signal);
                    renderSignalMatrix(signals);
                    renderBlockerMatrix(signal);
                    renderReopenMatrix(signal);
                    renderInspector(signal);
                    renderDefects();
                  }

                  async function load() {
                    const [inputsText, schema, taxonomy, signalsText, reopenText] = await Promise.all([
                      fetch(DATA_PATHS.inputs).then((response) => response.text()),
                      fetch(DATA_PATHS.schema).then((response) => response.json()),
                      fetch(DATA_PATHS.taxonomy).then((response) => response.json()),
                      fetch(DATA_PATHS.signals).then((response) => response.text()),
                      fetch(DATA_PATHS.reopen).then((response) => response.text()),
                    ]);

                    state.payload = {
                      inputs: parseCsv(inputsText),
                      schema,
                      taxonomy,
                      signals: parseCsv(signalsText),
                      reopen: parseCsv(reopenText),
                    };
                    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
                      document.body.dataset.reducedMotion = "true";
                    }
                    if (state.payload.signals.length) {
                      state.selection = {
                        kind: "signal",
                        id: state.payload.signals[0].milestone_signal_id,
                      };
                    }
                    render();
                  }

                  load().catch((error) => {
                    document.body.innerHTML = `<pre>${error.stack}</pre>`;
                    throw error;
                  });
                </script>
              </body>
            </html>
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
            const HTML_PATH = path.join(ROOT, "docs", "architecture", "55_lifecycle_coordinator_lab.html");
            const TAXONOMY_PATH = path.join(ROOT, "data", "analysis", "closure_blocker_taxonomy.json");
            const SIGNAL_PATH = path.join(ROOT, "data", "analysis", "milestone_signal_matrix.csv");
            const REOPEN_PATH = path.join(ROOT, "data", "analysis", "reopen_trigger_matrix.csv");

            const TAXONOMY = JSON.parse(fs.readFileSync(TAXONOMY_PATH, "utf8"));

            export const lifecycleCoordinatorCoverage = [
              "blocker filtering",
              "signal selection",
              "matrix and inspector parity",
              "verdict-panel rendering",
              "keyboard navigation",
              "responsive behavior",
              "reduced motion",
              "accessibility smoke checks",
            ];

            function assertCondition(condition, message) {
              if (!condition) {
                throw new Error(message);
              }
            }

            function parseCsv(text) {
              const rows = [];
              let row = [];
              let cell = "";
              let inQuotes = false;
              for (let index = 0; index < text.length; index += 1) {
                const char = text[index];
                const next = text[index + 1];
                if (char === '"' && inQuotes && next === '"') {
                  cell += '"';
                  index += 1;
                  continue;
                }
                if (char === '"') {
                  inQuotes = !inQuotes;
                  continue;
                }
                if (char === "," && !inQuotes) {
                  row.push(cell);
                  cell = "";
                  continue;
                }
                if ((char === "\\n" || char === "\\r") && !inQuotes) {
                  if (char === "\\r" && next === "\\n") {
                    index += 1;
                  }
                  row.push(cell);
                  if (row.some((value) => value.length > 0)) {
                    rows.push(row);
                  }
                  row = [];
                  cell = "";
                  continue;
                }
                cell += char;
              }
              if (cell.length || row.length) {
                row.push(cell);
                rows.push(row);
              }
              const [headers, ...body] = rows;
              return body.map((values) =>
                Object.fromEntries(headers.map((header, idx) => [header, values[idx] ?? ""])),
              );
            }

            function toTestId(value) {
              return String(value)
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, "-")
                .replace(/^-|-$/g, "");
            }

            async function importPlaywright() {
              try {
                return await import("playwright");
              } catch (error) {
                if (!process.argv.includes("--run")) {
                  return null;
                }
                throw error;
              }
            }

            function serve(rootDir) {
              const server = http.createServer((request, response) => {
                const requestUrl = new URL(request.url || "/", "http://127.0.0.1");
                let pathname = decodeURIComponent(requestUrl.pathname);
                if (pathname === "/") {
                  pathname = "/docs/architecture/55_lifecycle_coordinator_lab.html";
                }
                const filePath = path.join(rootDir, pathname);
                if (!filePath.startsWith(rootDir)) {
                  response.writeHead(403);
                  response.end("forbidden");
                  return;
                }
                fs.readFile(filePath, (error, buffer) => {
                  if (error) {
                    response.writeHead(404);
                    response.end("not found");
                    return;
                  }
                  const extension = path.extname(filePath);
                  const type =
                    extension === ".html"
                      ? "text/html"
                      : extension === ".json"
                        ? "application/json"
                        : extension === ".csv"
                          ? "text/csv"
                          : "text/plain";
                  response.writeHead(200, { "Content-Type": type });
                  response.end(buffer);
                });
              });
              return new Promise((resolve, reject) => {
                server.listen(0, "127.0.0.1", () => {
                  const address = server.address();
                  if (!address || typeof address === "string") {
                    reject(new Error("Unable to bind local server."));
                    return;
                  }
                  resolve({
                    server,
                    url: `http://127.0.0.1:${address.port}/docs/architecture/55_lifecycle_coordinator_lab.html`,
                  });
                });
              });
            }

            export async function run() {
              assertCondition(fs.existsSync(HTML_PATH), "Lifecycle coordinator lab HTML is missing.");
              const signalRows = parseCsv(fs.readFileSync(SIGNAL_PATH, "utf8"));
              const reopenRows = parseCsv(fs.readFileSync(REOPEN_PATH, "utf8"));
              assertCondition(
                signalRows.length === TAXONOMY.summary.milestone_signal_count,
                "Signal row count drifted from taxonomy summary.",
              );
              assertCondition(
                reopenRows.length === TAXONOMY.summary.reopen_trigger_count,
                "Reopen row count drifted from taxonomy summary.",
              );

              const playwright = await importPlaywright();
              if (!playwright) {
                return;
              }

              const { server, url } = await serve(ROOT);
              const browser = await playwright.chromium.launch({ headless: true });

              try {
                const context = await browser.newContext({ viewport: { width: 1440, height: 1100 } });
                const page = await context.newPage();
                await page.goto(url, { waitUntil: "networkidle" });

                await page.locator("[data-testid='filter-domain']").waitFor();
                await page.locator("[data-testid='constellation-canvas']").waitFor();
                await page.locator("[data-testid='verdict-panel']").waitFor();
                await page.locator("[data-testid='inspector']").waitFor();
                await page.locator("[data-testid='defect-strip']").waitFor();

                const initialSignals = await page.locator("[data-testid^='signal-row-']").count();
                assertCondition(
                  initialSignals === TAXONOMY.summary.milestone_signal_count,
                  `Expected ${TAXONOMY.summary.milestone_signal_count} signal rows, found ${initialSignals}.`,
                );

                await page.locator("[data-testid='filter-blocker-class']").selectOption("confirmation_gate");
                const confirmationSignals = await page.locator("[data-testid^='signal-row-']").count();
                assertCondition(
                  confirmationSignals === 4,
                  `Confirmation-gate filter expected 4 rows, found ${confirmationSignals}.`,
                );

                await page.locator("[data-testid='filter-blocker-class']").selectOption("all");
                await page.locator("[data-testid='filter-domain']").selectOption("pharmacy");
                const pharmacySignals = await page.locator("[data-testid^='signal-row-']").count();
                assertCondition(
                  pharmacySignals === 4,
                  `Pharmacy domain filter expected 4 rows, found ${pharmacySignals}.`,
                );

                const bounceBackId = "MSIG_055_PHARMACY_CASE_BOUNCE_BACK";
                await page
                  .locator(`[data-testid='signal-row-${toTestId(bounceBackId)}']`)
                  .click({ force: true });
                const inspectorText = await page.locator("[data-testid='inspector']").innerText();
                assertCondition(
                  inspectorText.includes("pharmacy.case.bounce_back") &&
                    inspectorText.includes("LineageFence.currentEpoch"),
                  "Inspector lost bounce-back parity or epoch requirements.",
                );

                const linkedBlocker = await page
                  .locator("[data-testid='blocker-row-reachability-dependency']")
                  .getAttribute("data-linked");
                assertCondition(
                  linkedBlocker === "true",
                  "Reachability blocker row did not link to the selected pharmacy bounce-back signal.",
                );

                const linkedReopen = await page
                  .locator("[data-testid='reopen-row-bounce-back']")
                  .getAttribute("data-linked");
                assertCondition(
                  linkedReopen === "true",
                  "Bounce-back reopen row did not link to the selected signal.",
                );

                await page.locator("[data-testid='filter-domain']").selectOption("all");
                await page.locator("[data-testid='filter-closure-eligibility']").selectOption("close_candidate");
                const closeCandidates = await page.locator("[data-testid^='signal-row-']").count();
                assertCondition(
                  closeCandidates === 5,
                  `Close-candidate filter expected 5 rows, found ${closeCandidates}.`,
                );

                await page.locator("[data-testid='filter-closure-eligibility']").selectOption("all");
                await page.locator("[data-testid='filter-domain']").selectOption("booking");
                const visibleRows = page.locator("[data-testid^='signal-row-']");
                await visibleRows.nth(0).focus();
                await page.keyboard.press("ArrowDown");
                const secondSelected = await visibleRows.nth(1).getAttribute("data-selected");
                assertCondition(
                  secondSelected === "true",
                  "ArrowDown did not advance booking signal selection.",
                );

                const verdictText = await page.locator("[data-testid='verdict-panel']").innerText();
                assertCondition(
                  verdictText.includes("LifecycleCoordinator") || verdictText.includes("close") || verdictText.includes("defer"),
                  "Verdict panel failed to render lifecycle verdict text.",
                );

                await page.setViewportSize({ width: 390, height: 844 });
                const inspectorVisible = await page.locator("[data-testid='inspector']").isVisible();
                assertCondition(inspectorVisible, "Inspector disappeared at mobile width.");

                const reducedContext = await browser.newContext({
                  viewport: { width: 1280, height: 900 },
                  reducedMotion: "reduce",
                });
                const reducedPage = await reducedContext.newPage();
                try {
                  await reducedPage.goto(url, { waitUntil: "networkidle" });
                  const reducedMotion = await reducedPage.evaluate(() => document.body.dataset.reducedMotion);
                  assertCondition(reducedMotion === "true", "Reduced-motion posture did not activate.");
                } finally {
                  await reducedContext.close();
                }

                const landmarks = await page.locator("header, main, aside, section").count();
                assertCondition(
                  landmarks >= 8,
                  `Accessibility smoke failed: expected landmarks, found ${landmarks}.`,
                );
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

            export const lifecycleCoordinatorLabManifest = {
              task: TAXONOMY.task_id,
              inputs: TAXONOMY.summary.coordinator_input_count,
              blockers: TAXONOMY.summary.blocker_category_count,
              signals: TAXONOMY.summary.milestone_signal_count,
              reopenTriggers: TAXONOMY.summary.reopen_trigger_count,
            };
            """
        ).strip()
        + "\n"
    )


def update_root_package() -> None:
    package = read_json(ROOT_PACKAGE_PATH)
    package.setdefault("scripts", {}).update(ROOT_SCRIPT_UPDATES)
    write_json(ROOT_PACKAGE_PATH, package)


def update_playwright_package() -> None:
    package = read_json(PLAYWRIGHT_PACKAGE_PATH)
    package["description"] = (
        "Foundation, runtime topology, gateway, event, FHIR, frontend manifest, release parity, "
        "design contract, audit ledger, scope/isolation, and lifecycle coordinator browser checks."
    )
    package["scripts"] = PLAYWRIGHT_SCRIPT_UPDATES
    write_json(PLAYWRIGHT_PACKAGE_PATH, package)


def patch_engineering_builder() -> None:
    text = ENGINEERING_BUILDER_PATH.read_text()
    old_codegen = (
        "python3 ./tools/analysis/build_audit_and_worm_strategy.py && "
        "python3 ./tools/analysis/build_tenant_scope_model.py && "
        "python3 ./tools/analysis/build_engineering_standards.py && pnpm format"
    )
    new_codegen = (
        "python3 ./tools/analysis/build_audit_and_worm_strategy.py && "
        "python3 ./tools/analysis/build_tenant_scope_model.py && "
        "python3 ./tools/analysis/build_lifecycle_coordinator_rules.py && "
        "python3 ./tools/analysis/build_engineering_standards.py && pnpm format"
    )
    text = text.replace(old_codegen, new_codegen)
    text = text.replace(
        "pnpm validate:audit-worm && pnpm validate:tenant-scope && pnpm validate:scaffold",
        "pnpm validate:audit-worm && pnpm validate:tenant-scope && pnpm validate:lifecycle && pnpm validate:scaffold",
    )
    text = text.replace(
        '"validate:tenant-scope": "python3 ./tools/analysis/validate_tenant_scope_model.py",\n'
        '    "validate:standards": "python3 ./tools/analysis/validate_engineering_standards.py",',
        '"validate:tenant-scope": "python3 ./tools/analysis/validate_tenant_scope_model.py",\n'
        '    "validate:lifecycle": "python3 ./tools/analysis/validate_lifecycle_coordinator_rules.py",\n'
        '    "validate:standards": "python3 ./tools/analysis/validate_engineering_standards.py",',
    )
    ENGINEERING_BUILDER_PATH.write_text(text)


def main() -> None:
    context = load_context()

    taxonomy = build_blocker_taxonomy(context)
    signal_rows = build_signal_rows(context)
    input_rows = build_input_rows(context)
    reopen_rows = build_reopen_rows(context)
    schema = build_schema(taxonomy)

    write_csv(
        INPUTS_OUTPUT_PATH,
        [
            "lifecycle_input_id",
            "input_family",
            "source_object_type",
            "owning_bounded_context_ref",
            "event_contract_refs",
            "route_family_refs",
            "route_scope_requirement_refs",
            "audience_surface_refs",
            "acting_scope_tuple_refs",
            "runtime_binding_refs",
            "trust_refs",
            "release_approval_freeze_refs",
            "request_closure_record_field",
            "blocker_class_key",
            "evaluation_stage",
            "materialization_rule",
            "failure_effect",
            "same_shell_recovery",
            "required_lineage_epoch",
            "source_refs",
        ],
        input_rows,
    )
    write_json(SCHEMA_OUTPUT_PATH, schema)
    write_json(TAXONOMY_OUTPUT_PATH, taxonomy)
    write_csv(
        SIGNAL_OUTPUT_PATH,
        [
            "milestone_signal_id",
            "domain_context",
            "case_family",
            "signal_name",
            "signal_class",
            "event_contract_refs",
            "route_family_refs",
            "route_scope_requirement_refs",
            "audience_surface_refs",
            "acting_scope_tuple_refs",
            "runtime_binding_refs",
            "trust_refs",
            "purpose_refs",
            "coordinator_consumption_mode",
            "candidate_request_milestone",
            "blocker_class_keys",
            "closure_eligibility",
            "reopen_trigger_class",
            "evaluation_check_refs",
            "may_write_request_workflow_directly",
            "may_write_request_closed_directly",
            "coordinator_close_event_ref",
            "coordinator_closed_event_ref",
            "coordinator_reopened_event_ref",
            "required_lineage_epoch",
            "meaning",
            "source_refs",
        ],
        signal_rows,
    )
    write_csv(
        REOPEN_OUTPUT_PATH,
        [
            "reopen_trigger_id",
            "reopen_trigger_class",
            "signal_vector",
            "threshold_rule",
            "reacquire_ownership",
            "closure_effect",
            "source_event_contract_refs",
            "source_refs",
        ],
        reopen_rows,
    )

    write_text(STRATEGY_DOC_PATH, build_strategy_doc(taxonomy, input_rows, signal_rows))
    write_text(LEDGER_DOC_PATH, build_blocker_doc(taxonomy))
    write_text(SIGNAL_RULES_DOC_PATH, build_signal_rules_doc(signal_rows, reopen_rows))
    write_text(LAB_PATH, build_lab_html())
    write_text(SPEC_PATH, build_spec())

    update_root_package()
    update_playwright_package()
    patch_engineering_builder()

    print(
        "seq_055 lifecycle coordinator artifacts generated: "
        f"{len(input_rows)} inputs, {len(taxonomy['blockerClasses'])} blocker classes, "
        f"{len(signal_rows)} milestone signals, {len(reopen_rows)} reopen triggers."
    )


if __name__ == "__main__":
    main()
