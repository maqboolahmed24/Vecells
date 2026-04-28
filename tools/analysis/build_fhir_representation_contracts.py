#!/usr/bin/env python3
from __future__ import annotations

import csv
import hashlib
import json
from collections import OrderedDict
from datetime import datetime, timezone
from pathlib import Path
from textwrap import dedent
from typing import Any

from root_script_updates import ROOT_SCRIPT_UPDATES as SHARED_ROOT_SCRIPT_UPDATES


ROOT = Path(__file__).resolve().parents[2]
BLUEPRINT_DIR = ROOT / "blueprint"
DATA_DIR = ROOT / "data" / "analysis"
DOCS_DIR = ROOT / "docs" / "architecture"
TESTS_DIR = ROOT / "tests" / "playwright"
PACKAGE_DIR = ROOT / "packages" / "fhir-mapping"
CONTRACT_DIR = PACKAGE_DIR / "contracts"
CONTRACT_ARTIFACT_DIR = CONTRACT_DIR / "contracts"

REQUEST_LINEAGE_PATH = DATA_DIR / "request_lineage_transitions.json"
OBJECT_CATALOG_PATH = DATA_DIR / "object_catalog.json"
EXTERNAL_DEPENDENCY_PATH = DATA_DIR / "external_dependency_inventory.csv"
DEGRADED_DEFAULTS_PATH = DATA_DIR / "degraded_mode_defaults.json"
DOMAIN_MANIFEST_PATH = DATA_DIR / "domain_package_manifest.json"
EVENT_REGISTRY_PATH = DATA_DIR / "canonical_event_contracts.json"

CONTRACTS_PATH = DATA_DIR / "fhir_representation_contracts.json"
MAPPING_MATRIX_PATH = DATA_DIR / "fhir_mapping_matrix.csv"
EXCHANGE_POLICY_PATH = DATA_DIR / "fhir_exchange_bundle_policies.json"
IDENTIFIER_POLICY_PATH = DATA_DIR / "fhir_identifier_and_status_policies.json"

STRATEGY_DOC_PATH = DOCS_DIR / "49_fhir_representation_strategy.md"
CATALOG_DOC_PATH = DOCS_DIR / "49_fhir_representation_contract_catalog.md"
MATRIX_DOC_PATH = DOCS_DIR / "49_domain_to_fhir_mapping_matrix.md"
ATLAS_PATH = DOCS_DIR / "49_fhir_representation_atlas.html"

VALIDATOR_PATH = ROOT / "tools" / "analysis" / "validate_fhir_representation_contracts.py"
SPEC_PATH = TESTS_DIR / "fhir-representation-atlas.spec.js"

PACKAGE_SOURCE_PATH = PACKAGE_DIR / "src" / "index.ts"
PACKAGE_TEST_PATH = PACKAGE_DIR / "tests" / "public-api.test.ts"
PACKAGE_README_PATH = PACKAGE_DIR / "README.md"
CONTRACT_README_PATH = CONTRACT_DIR / "README.md"
CATALOG_PATH = CONTRACT_DIR / "catalog.json"
PACKAGE_CONTRACTS_PATH = CONTRACT_DIR / "representation-contracts.json"
PACKAGE_EXCHANGE_PATH = CONTRACT_DIR / "exchange-bundle-policies.json"
PACKAGE_POLICY_PATH = CONTRACT_DIR / "identifier-and-status-policies.json"
ROOT_PACKAGE_PATH = ROOT / "package.json"
PLAYWRIGHT_PACKAGE_PATH = TESTS_DIR / "package.json"

TIMESTAMP = datetime.now(timezone.utc).replace(microsecond=0).isoformat()
CAPTURED_ON = TIMESTAMP[:10]

LEGAL_BUNDLE_TYPES = (
    "transaction",
    "message",
    "document",
    "collection",
    "searchset",
    "history",
    "batch",
)

SOURCE_PRECEDENCE = [
    "prompt/049.md",
    "prompt/shared_operating_contract_046_to_055.md",
    "prompt/AGENT.md",
    "prompt/checklist.md",
    "blueprint/phase-0-the-foundation-protocol.md",
    "blueprint/phase-3-the-human-checkpoint.md",
    "blueprint/phase-4-the-booking-engine.md",
    "blueprint/phase-5-the-network-horizon.md",
    "blueprint/phase-6-the-pharmacy-loop.md",
    "blueprint/platform-runtime-and-release-blueprint.md",
    "blueprint/forensic-audit-findings.md",
    "data/analysis/request_lineage_transitions.json",
    "data/analysis/object_catalog.json",
    "data/analysis/external_dependency_inventory.csv",
    "data/analysis/degraded_mode_defaults.json",
    "data/analysis/domain_package_manifest.json",
    "data/analysis/canonical_event_contracts.json",
]

ROOT_SCRIPT_UPDATES = {
    "bootstrap": (
        "pnpm install && node ./tools/dev-bootstrap/index.mjs && pnpm codegen && "
        "pnpm validate:topology && pnpm validate:runtime-topology && "
        "pnpm validate:gateway-surface && pnpm validate:events && pnpm validate:fhir && pnpm validate:frontend && "
        "pnpm validate:release-parity && pnpm validate:design-publication && pnpm validate:audit-worm && pnpm validate:scaffold && pnpm validate:services && "
        "pnpm validate:domains && "
        "pnpm validate:standards"
    ),
    "check": (
        "pnpm lint && pnpm format:check && pnpm typecheck && pnpm test && "
        "pnpm validate:topology && pnpm validate:runtime-topology && "
        "pnpm validate:gateway-surface && pnpm validate:events && pnpm validate:fhir && pnpm validate:frontend && "
        "pnpm validate:release-parity && pnpm validate:design-publication && pnpm validate:audit-worm && pnpm validate:scaffold && pnpm validate:services && "
        "pnpm validate:domains && "
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
        "python3 ./tools/analysis/build_design_contract_publication.py && python3 ./tools/analysis/build_audit_and_worm_strategy.py && "
        "python3 ./tools/analysis/build_engineering_standards.py && pnpm format"
    ),
    "validate:fhir": "python3 ./tools/analysis/validate_fhir_representation_contracts.py",
    "validate:frontend": "python3 ./tools/analysis/validate_frontend_contract_manifests.py",
    "validate:release-parity": "python3 ./tools/analysis/validate_release_freeze_and_parity.py",
    "validate:design-publication": "python3 ./tools/analysis/validate_design_contract_publication.py",
    "validate:audit-worm": "python3 ./tools/analysis/validate_audit_and_worm_strategy.py",
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
        "node --check design-contract-studio.spec.js && node --check audit-ledger-explorer.spec.js"
    ),
    "lint": (
        "eslint foundation-shell-gallery.spec.js runtime-topology-atlas.spec.js "
        "gateway-surface-studio.spec.js event-registry-studio.spec.js "
        "fhir-representation-atlas.spec.js frontend-contract-studio.spec.js "
        "release-parity-cockpit.spec.js design-contract-studio.spec.js audit-ledger-explorer.spec.js"
    ),
    "test": (
        "node foundation-shell-gallery.spec.js && "
        "node runtime-topology-atlas.spec.js && "
        "node gateway-surface-studio.spec.js && "
        "node event-registry-studio.spec.js && "
        "node fhir-representation-atlas.spec.js && "
        "node frontend-contract-studio.spec.js && "
        "node release-parity-cockpit.spec.js && "
        "node design-contract-studio.spec.js && node audit-ledger-explorer.spec.js"
    ),
    "typecheck": (
        "node --check foundation-shell-gallery.spec.js && "
        "node --check runtime-topology-atlas.spec.js && "
        "node --check gateway-surface-studio.spec.js && "
        "node --check event-registry-studio.spec.js && "
        "node --check fhir-representation-atlas.spec.js && "
        "node --check frontend-contract-studio.spec.js && "
        "node --check release-parity-cockpit.spec.js && "
        "node --check design-contract-studio.spec.js && node --check audit-ledger-explorer.spec.js"
    ),
    "e2e": (
        "node foundation-shell-gallery.spec.js --run && "
        "node runtime-topology-atlas.spec.js --run && "
        "node gateway-surface-studio.spec.js --run && "
        "node event-registry-studio.spec.js --run && "
        "node fhir-representation-atlas.spec.js --run && "
        "node frontend-contract-studio.spec.js --run && "
        "node release-parity-cockpit.spec.js --run && "
        "node design-contract-studio.spec.js --run && node audit-ledger-explorer.spec.js --run"
    ),
}

ASSUMPTIONS = [
    {
        "assumptionId": "ASSUMPTION_049_AUDIT_RECORD_RESOLVES_FROM_PHASE0_AND_EVENT_REGISTRY",
        "state": "watch",
        "statement": (
            "The seq_006 object catalog does not currently carry a first-class AuditRecord row, "
            "so seq_049 resolves AuditRecord authority from Phase 0 and the seq_048 audit event contracts "
            "until seq_053 publishes the authoritative audit ledger pack."
        ),
        "source_refs": [
            "blueprint/phase-0-the-foundation-protocol.md#AuditRecord",
            "data/analysis/canonical_event_contracts.json#audit.recorded",
            "prompt/053.md",
        ],
    },
    {
        "assumptionId": "ASSUMPTION_049_EVIDENCE_SNAPSHOT_MATERIALIZATION_STAYS_IN_INTAKE_SAFETY",
        "state": "watch",
        "statement": (
            "EvidenceSnapshot ownership is still marked `unknown` in the seq_006 catalog, "
            "so seq_049 anchors representation materialization to `intake_safety` because request snapshot "
            "freeze, attachment quarantine, and representation emission already converge there."
        ),
        "source_refs": [
            "data/analysis/object_catalog.json#EvidenceSnapshot",
            "data/analysis/canonical_event_contracts.json#request.snapshot.created",
            "data/analysis/canonical_event_contracts.json#request.representation.emitted",
        ],
    },
]

PROHIBITED_LIFECYCLE_OWNERS = [
    {
        "objectType": "AccessGrant",
        "blockedReason": "Access grants are internal capability truth and may not surface as FHIR lifecycle owners.",
        "source_refs": [
            "blueprint/phase-0-the-foundation-protocol.md#On the FHIR side, the mapping layer must now be explicit and replayable",
        ],
    },
    {
        "objectType": "CapabilityDecision",
        "blockedReason": "CapabilityDecision is internal trust law and may not be flattened into FHIR status.",
        "source_refs": [
            "blueprint/phase-0-the-foundation-protocol.md#On the FHIR side, the mapping layer must now be explicit and replayable",
        ],
    },
    {
        "objectType": "Session",
        "blockedReason": "Session is local authority and never partner-visible FHIR lifecycle truth.",
        "source_refs": [
            "blueprint/phase-0-the-foundation-protocol.md#On the FHIR side, the mapping layer must now be explicit and replayable",
        ],
    },
    {
        "objectType": "RequestLifecycleLease",
        "blockedReason": "Lease ownership and takeover are control-plane facts, not FHIR statuses.",
        "source_refs": [
            "blueprint/phase-0-the-foundation-protocol.md#On the FHIR side, the mapping layer must now be explicit and replayable",
        ],
    },
    {
        "objectType": "CapacityReservation",
        "blockedReason": "Reservation truth remains internal and may not be replaced by FHIR commitment state.",
        "source_refs": [
            "blueprint/phase-0-the-foundation-protocol.md#On the FHIR side, the mapping layer must now be explicit and replayable",
        ],
    },
    {
        "objectType": "AudienceSurfaceRuntimeBinding",
        "blockedReason": "Browser/runtime parity tuples are release controls, not clinical resources.",
        "source_refs": [
            "blueprint/platform-runtime-and-release-blueprint.md#AudienceSurfaceRuntimeBinding",
        ],
    },
    {
        "objectType": "ReleasePublicationParityRecord",
        "blockedReason": "Publication parity remains release control truth and may not leak into FHIR authority.",
        "source_refs": [
            "blueprint/platform-runtime-and-release-blueprint.md#ReleasePublicationParityRecord",
        ],
    },
    {
        "objectType": "ReleaseTrustFreezeVerdict",
        "blockedReason": "Trust and freeze posture are control-plane decisions, not FHIR-owned lifecycle state.",
        "source_refs": [
            "blueprint/platform-runtime-and-release-blueprint.md#ReleaseTrustFreezeVerdict",
        ],
    },
]

IDENTIFIER_POLICIES = [
    {
        "policyId": "IDPOL_049_REQUEST_VERSION_FINGERPRINT",
        "label": "Request version fingerprint",
        "description": "Task logical ids are derived from request lineage and the aggregate version hash.",
        "stableInputs": ["requestId", "requestVersion", "representationPurpose"],
        "versionRule": "Logical id is stable per aggregate version; new version emits new versionId only.",
    },
    {
        "policyId": "IDPOL_049_SNAPSHOT_HASH_DOCUMENT",
        "label": "Snapshot hash document key",
        "description": "DocumentReference identifiers are tied to the frozen evidence snapshot hash and artifact hash set.",
        "stableInputs": ["evidenceSnapshotId", "snapshotHash", "artifactSetHash"],
        "versionRule": "New snapshot hash emits a new DocumentReference version and supersedes prior set membership.",
    },
    {
        "policyId": "IDPOL_049_TRANSPORT_CORRELATION_RECORD",
        "label": "Transport correlation key",
        "description": "Communication identifiers bind dispatch or callback correlation tokens to the governing case and attempt.",
        "stableInputs": ["governingCaseId", "transportCorrelationKey", "dispatchAttemptId"],
        "versionRule": "Duplicate transport receipts update the same logical id; semantic drift opens replay collision review.",
    },
    {
        "policyId": "IDPOL_049_EXTERNAL_COMMITMENT_CASE",
        "label": "External commitment case key",
        "description": "ServiceRequest identifiers bind one external commitment epoch to the governing booking or hub case.",
        "stableInputs": ["caseId", "commitmentEpoch", "partnerRef"],
        "versionRule": "Authoritative commitment refresh increments versionId while preserving case lineage.",
    },
    {
        "policyId": "IDPOL_049_PHARMACY_PACKAGE_FINGERPRINT",
        "label": "Pharmacy package fingerprint",
        "description": "Referral identifiers bind the frozen package hash, consent checkpoint, and selected provider tuple.",
        "stableInputs": ["pharmacyCaseId", "packageHash", "consentCheckpointId", "providerRef"],
        "versionRule": "Changing package hash, provider, or consent checkpoint forces new logical ids and plan supersession.",
    },
    {
        "policyId": "IDPOL_049_CONSENT_SCOPE_FINGERPRINT",
        "label": "Consent scope fingerprint",
        "description": "FHIR Consent identifiers bind the chosen provider, scope hash, and consent checkpoint generation.",
        "stableInputs": ["consentRecordId", "providerRef", "referralScopeHash", "selectionBindingHash"],
        "versionRule": "Withdrawal or supersession issues a new version tied to the next checkpoint state.",
    },
    {
        "policyId": "IDPOL_049_AUDIT_CHAIN_HASH",
        "label": "Audit chain hash",
        "description": "Audit companion resources derive identifiers from the immutable audit chain hash and causal join token.",
        "stableInputs": ["auditRecordId", "auditHash", "causalToken"],
        "versionRule": "Companion audit rows are append-only; they never mutate prior logical ids in place.",
    },
]

STATUS_MAPPING_POLICIES = [
    {
        "policyId": "STPOL_049_REQUEST_TASK_LIFECYCLE",
        "label": "Request task lifecycle mapping",
        "resourceType": "Task",
        "mappings": {
            "submitted": "requested",
            "triage_ready": "ready",
            "triage_active": "in-progress",
            "handoff_active": "in-progress",
            "outcome_recorded": "completed",
            "closed": "completed",
        },
    },
    {
        "policyId": "STPOL_049_EVIDENCE_DOCUMENT_REFERENCE",
        "label": "Evidence document mapping",
        "resourceType": "DocumentReference",
        "mappings": {
            "created": "current",
            "superseded": "superseded",
            "quarantined": "entered-in-error",
        },
    },
    {
        "policyId": "STPOL_049_MESSAGE_COMMUNICATION",
        "label": "Message and callback communication mapping",
        "resourceType": "Communication",
        "mappings": {
            "queued": "preparation",
            "delivery_recorded": "in-progress",
            "outcome_recorded": "completed",
            "disputed": "stopped",
        },
    },
    {
        "policyId": "STPOL_049_BOOKING_COMMITMENT",
        "label": "Booking commitment mapping",
        "resourceType": "ServiceRequest",
        "mappings": {
            "commit_started": "active",
            "confirmation_pending": "active",
            "commit_confirmed": "completed",
            "commit_ambiguous": "on-hold",
            "cancelled": "revoked",
        },
    },
    {
        "policyId": "STPOL_049_HUB_COMMITMENT",
        "label": "Hub commitment mapping",
        "resourceType": "ServiceRequest",
        "mappings": {
            "offer_created": "draft",
            "offer_accepted": "active",
            "confirmation_pending": "on-hold",
            "externally_confirmed": "completed",
            "return_required": "revoked",
        },
    },
    {
        "policyId": "STPOL_049_PHARMACY_REFERRAL",
        "label": "Pharmacy referral mapping",
        "resourceType": "ServiceRequest",
        "mappings": {
            "package_ready": "active",
            "dispatch_pending": "on-hold",
            "referred": "completed",
            "outcome_reconciliation_pending": "on-hold",
            "resolved": "completed",
            "bounce_back": "revoked",
        },
    },
    {
        "policyId": "STPOL_049_CONSENT_CHECKPOINT",
        "label": "Consent checkpoint mapping",
        "resourceType": "Consent",
        "mappings": {
            "satisfied": "active",
            "expiring": "active",
            "renewal_required": "inactive",
            "withdrawn": "inactive",
            "revoked_post_dispatch": "inactive",
        },
    },
    {
        "policyId": "STPOL_049_AUDIT_COMPANION",
        "label": "Audit companion mapping",
        "resourceType": "AuditEvent",
        "mappings": {
            "recorded": "final",
            "break_glass": "final",
            "export_generated": "final",
        },
    },
]

CARDINALITY_POLICIES = [
    {
        "policyId": "CARDPOL_049_REQUEST_ONE_TASK_MANY_DOCS",
        "label": "One task plus bounded document set",
        "description": "One Request aggregate version emits exactly one primary Task and zero or more supporting DocumentReference rows.",
    },
    {
        "policyId": "CARDPOL_049_SNAPSHOT_MANY_DOCREFS",
        "label": "Snapshot document fan-out",
        "description": "One EvidenceSnapshot may emit many DocumentReference rows but all belong to one representation set hash.",
    },
    {
        "policyId": "CARDPOL_049_SINGLE_COMMUNICATION_PER_DISPATCH",
        "label": "Single communication per dispatch or callback epoch",
        "description": "Each dispatch or callback epoch emits at most one current Communication companion at a time.",
    },
    {
        "policyId": "CARDPOL_049_SINGLE_SERVICE_REQUEST_COMMITMENT",
        "label": "Single commitment per case epoch",
        "description": "Each booking, hub, or pharmacy commitment epoch may emit one current ServiceRequest with companion resources.",
    },
    {
        "policyId": "CARDPOL_049_PHARMACY_REFERRAL_PACKAGE_SET",
        "label": "Referral package set",
        "description": "Each pharmacy package hash emits one ServiceRequest plus bounded supporting Communication, Consent, DocumentReference, Provenance, and AuditEvent rows.",
    },
    {
        "policyId": "CARDPOL_049_SINGLE_CONSENT_PER_CHECKPOINT_VERSION",
        "label": "Single consent per checkpoint version",
        "description": "Each PharmacyConsentCheckpoint version emits one current Consent row with append-only supersession.",
    },
    {
        "policyId": "CARDPOL_049_SINGLE_AUDIT_EVENT_PLUS_PROVENANCE",
        "label": "Single audit companion pair",
        "description": "Each immutable audit join emits one AuditEvent and one Provenance row only.",
    },
]

REDACTION_POLICIES = [
    {
        "policyId": "REDPOL_049_REFERENCE_ONLY_ARTIFACTS",
        "label": "Reference-only artifacts",
        "description": "Payloads carry governed artifact refs, checksums, and masked descriptors only; no binary bodies or transcript text.",
    },
    {
        "policyId": "REDPOL_049_MINIMAL_PARTNER_INTERCHANGE",
        "label": "Minimal partner interchange",
        "description": "Only partner-required structured fields and declared profile elements may cross the boundary.",
    },
    {
        "policyId": "REDPOL_049_CALLBACK_CORRELATION_MINIMAL",
        "label": "Callback correlation minimal disclosure",
        "description": "Inbound callback correlation exposes only partner correlation tokens, declared identifiers, and checkpoint posture.",
    },
    {
        "policyId": "REDPOL_049_AUDIT_COMPANION_MASKED",
        "label": "Audit companion masked detail",
        "description": "FHIR AuditEvent and Provenance carry masked operator and actor descriptors while the immutable internal audit row stays authoritative.",
    },
]

COMPANION_ARTIFACT_POLICIES = [
    {
        "policyId": "COMPPOL_049_DOCUMENT_REFERENCE_BINARY_REFS",
        "label": "DocumentReference binary refs",
        "description": "DocumentReference rows may reference Attachment object keys, checksums, and malware/quarantine posture but not inline payload bodies.",
    },
    {
        "policyId": "COMPPOL_049_PARTNER_EXCHANGE_MANIFEST",
        "label": "Partner exchange manifest",
        "description": "External bundles may carry an omission/redaction manifest that traces every excluded artifact or field to policy.",
    },
    {
        "policyId": "COMPPOL_049_CALLBACK_RECEIPT_REFS",
        "label": "Callback receipt refs",
        "description": "Callback bundles must join to receipt checkpoints and replay-collision evidence instead of local receipt booleans.",
    },
    {
        "policyId": "COMPPOL_049_DISPATCH_MANIFEST_AND_OMISSIONS",
        "label": "Dispatch manifest and omissions",
        "description": "Pharmacy referral transport may include manifest evidence describing redactions or transport-specific omissions without rewriting the frozen canonical set.",
    },
    {
        "policyId": "COMPPOL_049_AUDIT_HASH_JOIN",
        "label": "Audit hash join",
        "description": "Audit companions must keep the immutable audit hash join and provenance linkage explicit.",
    },
]

REPLAY_POLICIES = [
    {
        "policyId": "REPLAYPOL_049_AGGREGATE_VERSION_STABLE_SET",
        "label": "Stable set by aggregate version",
        "stableMembershipOnReplay": True,
        "description": "Replaying the same aggregate version rematerializes the same resource membership and identifier set.",
    },
    {
        "policyId": "REPLAYPOL_049_SNAPSHOT_HASH_STABLE_DOCS",
        "label": "Stable docs by snapshot hash",
        "stableMembershipOnReplay": True,
        "description": "EvidenceSnapshot replay reproduces the same DocumentReference collection while snapshot hash inputs are unchanged.",
    },
    {
        "policyId": "REPLAYPOL_049_TRANSPORT_CORRELATION_STABLE_CALLBACK_SET",
        "label": "Stable callback set by transport correlation",
        "stableMembershipOnReplay": True,
        "description": "Duplicate or reordered callbacks target the same representation set until semantic drift forces collision review.",
    },
    {
        "policyId": "REPLAYPOL_049_COMMITMENT_PROOF_STABLE_SERVICE_REQUEST",
        "label": "Stable commitment by proof tuple",
        "stableMembershipOnReplay": True,
        "description": "Booking and hub commitment replay reproduces the same ServiceRequest membership until the authoritative commitment tuple changes.",
    },
    {
        "policyId": "REPLAYPOL_049_PACKAGE_HASH_STABLE_REFERRAL_SET",
        "label": "Stable referral by package hash",
        "stableMembershipOnReplay": True,
        "description": "The same pharmacy package hash, consent checkpoint, and provider tuple must rematerialize the same referral set.",
    },
    {
        "policyId": "REPLAYPOL_049_AUDIT_HASH_APPEND_ONLY",
        "label": "Append-only audit replay",
        "stableMembershipOnReplay": True,
        "description": "Audit companion replay may append new exports but may not silently fork prior audit companions for the same audit hash.",
    },
]

SUPERSESSION_POLICIES = [
    {
        "policyId": "SUPPOL_049_APPEND_ONLY_BY_AGGREGATE_VERSION",
        "label": "Append-only by aggregate version",
        "description": "New aggregate versions append new representation sets and explicitly supersede prior versions without mutating history.",
    },
    {
        "policyId": "SUPPOL_049_DOCUMENT_REF_SUPERSESSION_ON_SNAPSHOT_REPLACEMENT",
        "label": "Snapshot replacement supersedes documents",
        "description": "Superseding an EvidenceSnapshot invalidates the older DocumentReference membership while preserving immutable prior rows.",
    },
    {
        "policyId": "SUPPOL_049_COMMUNICATION_SUPERSESSION_ON_SETTLEMENT_REVISION",
        "label": "Communication supersession on settlement revision",
        "description": "Communication companions supersede only when the same dispatch or callback epoch receives a stronger settlement or contradiction.",
    },
    {
        "policyId": "SUPPOL_049_COMMITMENT_SUPERSESSION_ON_AUTHORITATIVE_REFRESH",
        "label": "Commitment supersession on authoritative refresh",
        "description": "Booking and hub ServiceRequest resources supersede only on authoritative refresh or cancellation evidence.",
    },
    {
        "policyId": "SUPPOL_049_CALLBACK_SUPERSESSION_ON_GATE_ROTATION",
        "label": "Callback supersession on gate rotation",
        "description": "Callback correlation representations supersede only when a new confirmation gate or correlation epoch replaces the old one.",
    },
    {
        "policyId": "SUPPOL_049_CONSENT_INVALIDATION_ON_CHECKPOINT_DRIFT",
        "label": "Consent invalidation on checkpoint drift",
        "description": "Consent drift, withdrawal, or renewed checkpoint invalidates the prior current Consent row and requires a new representation set.",
    },
    {
        "policyId": "SUPPOL_049_AUDIT_APPEND_ONLY_COMPANION",
        "label": "Audit append-only companion",
        "description": "Audit companions never rewrite the underlying audit truth; new exports append a new companion row with the same causal join.",
    },
]

CALLBACK_CORRELATION_POLICIES = [
    {
        "policyId": "CALLPOL_049_NONE",
        "label": "No callback correlation",
        "description": "Clinical persistence-only contracts do not participate in partner callback correlation.",
    },
    {
        "policyId": "CALLPOL_049_TRANSPORT_CORRELATION_KEYS",
        "label": "Transport correlation keys",
        "description": "Message or callback companions correlate via declared transport tokens and durable receipt checkpoints only.",
    },
    {
        "policyId": "CALLPOL_049_EXTERNAL_CONFIRMATION_GATE",
        "label": "External confirmation gate correlation",
        "description": "Callback representations bind to one current ExternalConfirmationGate and may not infer final success from transport acceptance alone.",
    },
    {
        "policyId": "CALLPOL_049_DISPATCH_ATTEMPT_AND_OUTBOUND_REFERENCE_HASH",
        "label": "Dispatch attempt and outbound reference hash",
        "description": "Pharmacy callback and proof correlation bind to the active dispatch attempt, dispatch plan hash, and outbound reference set hash.",
    },
]

CONTRACT_SPECS = [
    {
        "contractId": "FRC_049_REQUEST_CLINICAL_PERSISTENCE_V1",
        "ownerContext": "foundation_control_plane",
        "aggregate": "Request",
        "purpose": "clinical_persistence",
        "triggerEvents": [
            "request.submitted",
            "request.snapshot.created",
            "request.representation.emitted",
            "request.representation.superseded",
        ],
        "requiredEvidenceRefs": ["EvidenceSnapshot", "SubmissionPromotionRecord", "RequestClosureRecord"],
        "resources": OrderedDict(
            [
                ("Task", "vecells-request-task"),
                ("DocumentReference", "vecells-request-evidence-documentreference"),
                ("Provenance", "vecells-request-provenance"),
            ]
        ),
        "identifierPolicyRef": "IDPOL_049_REQUEST_VERSION_FINGERPRINT",
        "statusMappingPolicyRef": "STPOL_049_REQUEST_TASK_LIFECYCLE",
        "cardinalityPolicyRef": "CARDPOL_049_REQUEST_ONE_TASK_MANY_DOCS",
        "redactionPolicyRef": "REDPOL_049_REFERENCE_ONLY_ARTIFACTS",
        "companionArtifactPolicyRef": "COMPPOL_049_DOCUMENT_REFERENCE_BINARY_REFS",
        "replayPolicyRef": "REPLAYPOL_049_AGGREGATE_VERSION_STABLE_SET",
        "supersessionPolicyRef": "SUPPOL_049_APPEND_ONLY_BY_AGGREGATE_VERSION",
        "callbackCorrelationPolicyRef": "CALLPOL_049_NONE",
        "bundlePolicyRefs": [],
        "phaseSourceRef": "blueprint/phase-0-the-foundation-protocol.md#On the FHIR side, the mapping layer must now be explicit and replayable",
        "rationale": "Request remains lifecycle authority; FHIR Task and supporting documents are replayable companions only.",
        "defectState": "active",
    },
    {
        "contractId": "FRC_049_REQUEST_EXTERNAL_INTERCHANGE_V1",
        "ownerContext": "foundation_control_plane",
        "aggregate": "Request",
        "purpose": "external_interchange",
        "triggerEvents": [
            "request.submitted",
            "request.evidence.capture.frozen",
            "request.representation.emitted",
        ],
        "requiredEvidenceRefs": ["EvidenceSnapshot", "ConversationCommandSettlement", "RequestClosureRecord"],
        "resources": OrderedDict(
            [
                ("Task", "vecells-request-interchange-task"),
                ("DocumentReference", "vecells-request-interchange-documentreference"),
                ("Provenance", "vecells-request-interchange-provenance"),
            ]
        ),
        "identifierPolicyRef": "IDPOL_049_REQUEST_VERSION_FINGERPRINT",
        "statusMappingPolicyRef": "STPOL_049_REQUEST_TASK_LIFECYCLE",
        "cardinalityPolicyRef": "CARDPOL_049_REQUEST_ONE_TASK_MANY_DOCS",
        "redactionPolicyRef": "REDPOL_049_MINIMAL_PARTNER_INTERCHANGE",
        "companionArtifactPolicyRef": "COMPPOL_049_PARTNER_EXCHANGE_MANIFEST",
        "replayPolicyRef": "REPLAYPOL_049_AGGREGATE_VERSION_STABLE_SET",
        "supersessionPolicyRef": "SUPPOL_049_APPEND_ONLY_BY_AGGREGATE_VERSION",
        "callbackCorrelationPolicyRef": "CALLPOL_049_NONE",
        "bundlePolicyRefs": ["FXBP_049_REQUEST_OUTBOUND_DOCUMENT"],
        "phaseSourceRef": "blueprint/phase-3-the-human-checkpoint.md#Message and callback flow / Phase 3 dispatch and callback split",
        "rationale": "Request-level interchange is allowed only as a governed package emitted from settled aggregate truth and frozen evidence.",
        "defectState": "active",
    },
    {
        "contractId": "FRC_049_EVIDENCE_SNAPSHOT_CLINICAL_PERSISTENCE_V1",
        "ownerContext": "intake_safety",
        "aggregate": "EvidenceSnapshot",
        "purpose": "clinical_persistence",
        "triggerEvents": [
            "request.snapshot.created",
            "request.snapshot.superseded",
            "intake.attachment.quarantined",
        ],
        "requiredEvidenceRefs": ["EvidenceSnapshot", "Attachment", "EvidenceAssimilationRecord"],
        "resources": OrderedDict(
            [
                ("DocumentReference", "vecells-evidence-documentreference"),
                ("Provenance", "vecells-evidence-provenance"),
            ]
        ),
        "identifierPolicyRef": "IDPOL_049_SNAPSHOT_HASH_DOCUMENT",
        "statusMappingPolicyRef": "STPOL_049_EVIDENCE_DOCUMENT_REFERENCE",
        "cardinalityPolicyRef": "CARDPOL_049_SNAPSHOT_MANY_DOCREFS",
        "redactionPolicyRef": "REDPOL_049_REFERENCE_ONLY_ARTIFACTS",
        "companionArtifactPolicyRef": "COMPPOL_049_DOCUMENT_REFERENCE_BINARY_REFS",
        "replayPolicyRef": "REPLAYPOL_049_SNAPSHOT_HASH_STABLE_DOCS",
        "supersessionPolicyRef": "SUPPOL_049_DOCUMENT_REF_SUPERSESSION_ON_SNAPSHOT_REPLACEMENT",
        "callbackCorrelationPolicyRef": "CALLPOL_049_NONE",
        "bundlePolicyRefs": [],
        "phaseSourceRef": "blueprint/phase-0-the-foundation-protocol.md#EvidenceSnapshot",
        "rationale": "Evidence snapshots materialize FHIR DocumentReference rows without transferring ownership away from the frozen snapshot chain.",
        "defectState": "watch",
    },
    {
        "contractId": "FRC_049_MESSAGE_DISPATCH_EXTERNAL_INTERCHANGE_V1",
        "ownerContext": "communications",
        "aggregate": "MessageDispatchEnvelope",
        "purpose": "external_interchange",
        "triggerEvents": [
            "communication.queued",
            "communication.delivery.evidence.recorded",
            "communication.command.settled",
        ],
        "requiredEvidenceRefs": ["MessageDispatchEnvelope", "MessageDeliveryEvidenceBundle", "ConversationCommandSettlement"],
        "resources": OrderedDict(
            [
                ("Communication", "vecells-message-communication"),
                ("Provenance", "vecells-message-provenance"),
            ]
        ),
        "identifierPolicyRef": "IDPOL_049_TRANSPORT_CORRELATION_RECORD",
        "statusMappingPolicyRef": "STPOL_049_MESSAGE_COMMUNICATION",
        "cardinalityPolicyRef": "CARDPOL_049_SINGLE_COMMUNICATION_PER_DISPATCH",
        "redactionPolicyRef": "REDPOL_049_MINIMAL_PARTNER_INTERCHANGE",
        "companionArtifactPolicyRef": "COMPPOL_049_PARTNER_EXCHANGE_MANIFEST",
        "replayPolicyRef": "REPLAYPOL_049_TRANSPORT_CORRELATION_STABLE_CALLBACK_SET",
        "supersessionPolicyRef": "SUPPOL_049_COMMUNICATION_SUPERSESSION_ON_SETTLEMENT_REVISION",
        "callbackCorrelationPolicyRef": "CALLPOL_049_TRANSPORT_CORRELATION_KEYS",
        "bundlePolicyRefs": ["FXBP_049_SECURE_MESSAGE_OUTBOUND_MESSAGE"],
        "phaseSourceRef": "blueprint/callback-and-clinician-messaging-loop.md#Clinician message domain / MessageDispatchEnvelope",
        "rationale": "Cross-organisation messaging uses a published Communication companion so callback and delivery proofs stay deterministic.",
        "defectState": "active",
    },
    {
        "contractId": "FRC_049_CALLBACK_CASE_PARTNER_CALLBACK_CORRELATION_V1",
        "ownerContext": "communications",
        "aggregate": "CallbackCase",
        "purpose": "partner_callback_correlation",
        "triggerEvents": [
            "communication.callback.outcome.recorded",
            "confirmation.gate.created",
            "confirmation.gate.confirmed",
            "confirmation.gate.disputed",
        ],
        "requiredEvidenceRefs": ["CallbackCase", "CallbackAttemptRecord", "CallbackOutcomeEvidenceBundle", "ExternalConfirmationGate"],
        "resources": OrderedDict(
            [
                ("Communication", "vecells-callback-communication"),
                ("Provenance", "vecells-callback-provenance"),
            ]
        ),
        "identifierPolicyRef": "IDPOL_049_TRANSPORT_CORRELATION_RECORD",
        "statusMappingPolicyRef": "STPOL_049_MESSAGE_COMMUNICATION",
        "cardinalityPolicyRef": "CARDPOL_049_SINGLE_COMMUNICATION_PER_DISPATCH",
        "redactionPolicyRef": "REDPOL_049_CALLBACK_CORRELATION_MINIMAL",
        "companionArtifactPolicyRef": "COMPPOL_049_CALLBACK_RECEIPT_REFS",
        "replayPolicyRef": "REPLAYPOL_049_TRANSPORT_CORRELATION_STABLE_CALLBACK_SET",
        "supersessionPolicyRef": "SUPPOL_049_CALLBACK_SUPERSESSION_ON_GATE_ROTATION",
        "callbackCorrelationPolicyRef": "CALLPOL_049_EXTERNAL_CONFIRMATION_GATE",
        "bundlePolicyRefs": ["FXBP_049_PARTNER_CALLBACK_INBOUND_COLLECTION"],
        "phaseSourceRef": "blueprint/callback-and-clinician-messaging-loop.md#Callback domain / Core object / CallbackCase",
        "rationale": "Partner callback correlation remains explicit and replay-safe instead of living inside ad hoc webhook handlers.",
        "defectState": "active",
    },
    {
        "contractId": "FRC_049_BOOKING_CASE_EXTERNAL_INTERCHANGE_V1",
        "ownerContext": "booking",
        "aggregate": "BookingCase",
        "purpose": "external_interchange",
        "triggerEvents": [
            "booking.commit.started",
            "booking.commit.confirmation_pending",
            "booking.commit.confirmed",
            "booking.commit.ambiguous",
        ],
        "requiredEvidenceRefs": ["BookingCase", "BookingProviderAdapterBinding", "ExternalConfirmationGate"],
        "resources": OrderedDict(
            [
                ("ServiceRequest", "vecells-booking-service-request"),
                ("Task", "vecells-booking-task"),
                ("Communication", "vecells-booking-communication"),
                ("Provenance", "vecells-booking-provenance"),
            ]
        ),
        "identifierPolicyRef": "IDPOL_049_EXTERNAL_COMMITMENT_CASE",
        "statusMappingPolicyRef": "STPOL_049_BOOKING_COMMITMENT",
        "cardinalityPolicyRef": "CARDPOL_049_SINGLE_SERVICE_REQUEST_COMMITMENT",
        "redactionPolicyRef": "REDPOL_049_MINIMAL_PARTNER_INTERCHANGE",
        "companionArtifactPolicyRef": "COMPPOL_049_PARTNER_EXCHANGE_MANIFEST",
        "replayPolicyRef": "REPLAYPOL_049_COMMITMENT_PROOF_STABLE_SERVICE_REQUEST",
        "supersessionPolicyRef": "SUPPOL_049_COMMITMENT_SUPERSESSION_ON_AUTHORITATIVE_REFRESH",
        "callbackCorrelationPolicyRef": "CALLPOL_049_EXTERNAL_CONFIRMATION_GATE",
        "bundlePolicyRefs": ["FXBP_049_BOOKING_PARTNER_OUTBOUND_MESSAGE"],
        "phaseSourceRef": "blueprint/phase-4-the-booking-engine.md#4E Commit path",
        "rationale": "Booking commitment becomes FHIR only when a real external service commitment exists and remains bound to confirmation truth.",
        "defectState": "active",
    },
    {
        "contractId": "FRC_049_BOOKING_CASE_PARTNER_CALLBACK_CORRELATION_V1",
        "ownerContext": "booking",
        "aggregate": "BookingCase",
        "purpose": "partner_callback_correlation",
        "triggerEvents": [
            "booking.commit.confirmation_pending",
            "booking.confirmation.truth.updated",
            "confirmation.gate.created",
            "confirmation.gate.confirmed",
            "confirmation.gate.disputed",
        ],
        "requiredEvidenceRefs": ["BookingCase", "ExternalConfirmationGate", "BookingConfirmationTruthProjection"],
        "resources": OrderedDict(
            [
                ("Communication", "vecells-booking-callback-communication"),
                ("Provenance", "vecells-booking-callback-provenance"),
            ]
        ),
        "identifierPolicyRef": "IDPOL_049_TRANSPORT_CORRELATION_RECORD",
        "statusMappingPolicyRef": "STPOL_049_MESSAGE_COMMUNICATION",
        "cardinalityPolicyRef": "CARDPOL_049_SINGLE_COMMUNICATION_PER_DISPATCH",
        "redactionPolicyRef": "REDPOL_049_CALLBACK_CORRELATION_MINIMAL",
        "companionArtifactPolicyRef": "COMPPOL_049_CALLBACK_RECEIPT_REFS",
        "replayPolicyRef": "REPLAYPOL_049_TRANSPORT_CORRELATION_STABLE_CALLBACK_SET",
        "supersessionPolicyRef": "SUPPOL_049_CALLBACK_SUPERSESSION_ON_GATE_ROTATION",
        "callbackCorrelationPolicyRef": "CALLPOL_049_EXTERNAL_CONFIRMATION_GATE",
        "bundlePolicyRefs": ["FXBP_049_PARTNER_CALLBACK_INBOUND_COLLECTION"],
        "phaseSourceRef": "blueprint/phase-4-the-booking-engine.md#4E Commit path",
        "rationale": "Async supplier callbacks correlate through one published callback companion instead of custom booking-adapter payloads.",
        "defectState": "active",
    },
    {
        "contractId": "FRC_049_HUB_CASE_EXTERNAL_INTERCHANGE_V1",
        "ownerContext": "hub_coordination",
        "aggregate": "HubCoordinationCase",
        "purpose": "external_interchange",
        "triggerEvents": [
            "hub.offer.created",
            "hub.offer.accepted",
            "hub.booking.confirmation_pending",
            "hub.booking.externally_confirmed",
        ],
        "requiredEvidenceRefs": ["HubCoordinationCase", "HubBookingEvidenceBundle", "ExternalConfirmationGate"],
        "resources": OrderedDict(
            [
                ("ServiceRequest", "vecells-hub-service-request"),
                ("Communication", "vecells-hub-communication"),
                ("DocumentReference", "vecells-hub-documentreference"),
                ("Provenance", "vecells-hub-provenance"),
            ]
        ),
        "identifierPolicyRef": "IDPOL_049_EXTERNAL_COMMITMENT_CASE",
        "statusMappingPolicyRef": "STPOL_049_HUB_COMMITMENT",
        "cardinalityPolicyRef": "CARDPOL_049_SINGLE_SERVICE_REQUEST_COMMITMENT",
        "redactionPolicyRef": "REDPOL_049_MINIMAL_PARTNER_INTERCHANGE",
        "companionArtifactPolicyRef": "COMPPOL_049_PARTNER_EXCHANGE_MANIFEST",
        "replayPolicyRef": "REPLAYPOL_049_COMMITMENT_PROOF_STABLE_SERVICE_REQUEST",
        "supersessionPolicyRef": "SUPPOL_049_COMMITMENT_SUPERSESSION_ON_AUTHORITATIVE_REFRESH",
        "callbackCorrelationPolicyRef": "CALLPOL_049_EXTERNAL_CONFIRMATION_GATE",
        "bundlePolicyRefs": ["FXBP_049_HUB_PARTNER_OUTBOUND_MESSAGE"],
        "phaseSourceRef": "blueprint/phase-5-the-network-horizon.md#Hub commit algorithm",
        "rationale": "Hub-native exchange remains partner-safe while request closure and practice visibility stay on their owning aggregates.",
        "defectState": "active",
    },
    {
        "contractId": "FRC_049_HUB_CASE_PARTNER_CALLBACK_CORRELATION_V1",
        "ownerContext": "hub_coordination",
        "aggregate": "HubCoordinationCase",
        "purpose": "partner_callback_correlation",
        "triggerEvents": [
            "hub.booking.confirmation_pending",
            "hub.booking.externally_confirmed",
            "confirmation.gate.created",
            "confirmation.gate.confirmed",
            "confirmation.gate.disputed",
        ],
        "requiredEvidenceRefs": ["HubCoordinationCase", "HubReturnToPracticeRecord", "ExternalConfirmationGate"],
        "resources": OrderedDict(
            [
                ("Communication", "vecells-hub-callback-communication"),
                ("Provenance", "vecells-hub-callback-provenance"),
            ]
        ),
        "identifierPolicyRef": "IDPOL_049_TRANSPORT_CORRELATION_RECORD",
        "statusMappingPolicyRef": "STPOL_049_MESSAGE_COMMUNICATION",
        "cardinalityPolicyRef": "CARDPOL_049_SINGLE_COMMUNICATION_PER_DISPATCH",
        "redactionPolicyRef": "REDPOL_049_CALLBACK_CORRELATION_MINIMAL",
        "companionArtifactPolicyRef": "COMPPOL_049_CALLBACK_RECEIPT_REFS",
        "replayPolicyRef": "REPLAYPOL_049_TRANSPORT_CORRELATION_STABLE_CALLBACK_SET",
        "supersessionPolicyRef": "SUPPOL_049_CALLBACK_SUPERSESSION_ON_GATE_ROTATION",
        "callbackCorrelationPolicyRef": "CALLPOL_049_EXTERNAL_CONFIRMATION_GATE",
        "bundlePolicyRefs": ["FXBP_049_PARTNER_CALLBACK_INBOUND_COLLECTION"],
        "phaseSourceRef": "blueprint/phase-5-the-network-horizon.md#Hub commit algorithm",
        "rationale": "Hub confirmation and practice-visibility callbacks correlate through one declared bundle and gate policy.",
        "defectState": "active",
    },
    {
        "contractId": "FRC_049_PHARMACY_CASE_EXTERNAL_INTERCHANGE_V1",
        "ownerContext": "pharmacy",
        "aggregate": "PharmacyCase",
        "purpose": "external_interchange",
        "triggerEvents": [
            "pharmacy.dispatch.started",
            "pharmacy.dispatch.confirmed",
            "pharmacy.outcome.received",
            "pharmacy.outcome.reconciled",
        ],
        "requiredEvidenceRefs": [
            "PharmacyCase",
            "PharmacyConsentCheckpoint",
            "DispatchProofEnvelope",
            "OutcomeEvidenceEnvelope",
        ],
        "resources": OrderedDict(
            [
                ("ServiceRequest", "vecells-pharmacy-service-request"),
                ("Communication", "vecells-pharmacy-communication"),
                ("DocumentReference", "vecells-pharmacy-documentreference"),
                ("Consent", "vecells-pharmacy-consent"),
                ("Provenance", "vecells-pharmacy-provenance"),
                ("AuditEvent", "vecells-pharmacy-audit-event"),
            ]
        ),
        "identifierPolicyRef": "IDPOL_049_PHARMACY_PACKAGE_FINGERPRINT",
        "statusMappingPolicyRef": "STPOL_049_PHARMACY_REFERRAL",
        "cardinalityPolicyRef": "CARDPOL_049_PHARMACY_REFERRAL_PACKAGE_SET",
        "redactionPolicyRef": "REDPOL_049_MINIMAL_PARTNER_INTERCHANGE",
        "companionArtifactPolicyRef": "COMPPOL_049_DISPATCH_MANIFEST_AND_OMISSIONS",
        "replayPolicyRef": "REPLAYPOL_049_PACKAGE_HASH_STABLE_REFERRAL_SET",
        "supersessionPolicyRef": "SUPPOL_049_COMMITMENT_SUPERSESSION_ON_AUTHORITATIVE_REFRESH",
        "callbackCorrelationPolicyRef": "CALLPOL_049_DISPATCH_ATTEMPT_AND_OUTBOUND_REFERENCE_HASH",
        "bundlePolicyRefs": ["FXBP_049_PHARMACY_REFERRAL_OUTBOUND_MESSAGE"],
        "phaseSourceRef": "blueprint/phase-6-the-pharmacy-loop.md#The right internal shape is a transport-neutral PharmacyReferralPackage",
        "rationale": "Pharmacy referral sets are frozen, consent-gated, package-hash bound outputs, never hidden lifecycle owners.",
        "defectState": "active",
    },
    {
        "contractId": "FRC_049_PHARMACY_CONSENT_CLINICAL_PERSISTENCE_V1",
        "ownerContext": "pharmacy",
        "aggregate": "PharmacyConsentRecord",
        "purpose": "clinical_persistence",
        "triggerEvents": [
            "pharmacy.consent.revocation.recorded",
            "pharmacy.consent.revoked",
            "pharmacy.dispatch.started",
        ],
        "requiredEvidenceRefs": ["PharmacyConsentRecord", "PharmacyConsentCheckpoint"],
        "resources": OrderedDict(
            [
                ("Consent", "vecells-pharmacy-consent"),
                ("Provenance", "vecells-pharmacy-consent-provenance"),
            ]
        ),
        "identifierPolicyRef": "IDPOL_049_CONSENT_SCOPE_FINGERPRINT",
        "statusMappingPolicyRef": "STPOL_049_CONSENT_CHECKPOINT",
        "cardinalityPolicyRef": "CARDPOL_049_SINGLE_CONSENT_PER_CHECKPOINT_VERSION",
        "redactionPolicyRef": "REDPOL_049_MINIMAL_PARTNER_INTERCHANGE",
        "companionArtifactPolicyRef": "COMPPOL_049_PARTNER_EXCHANGE_MANIFEST",
        "replayPolicyRef": "REPLAYPOL_049_PACKAGE_HASH_STABLE_REFERRAL_SET",
        "supersessionPolicyRef": "SUPPOL_049_CONSENT_INVALIDATION_ON_CHECKPOINT_DRIFT",
        "callbackCorrelationPolicyRef": "CALLPOL_049_NONE",
        "bundlePolicyRefs": [],
        "phaseSourceRef": "blueprint/phase-6-the-pharmacy-loop.md#PharmacyConsentRecord",
        "rationale": "FHIR Consent is allowed only as a representation of the governed pharmacy consent checkpoint, never the owning decision itself.",
        "defectState": "active",
    },
    {
        "contractId": "FRC_049_PHARMACY_DISPATCH_PARTNER_CALLBACK_CORRELATION_V1",
        "ownerContext": "pharmacy",
        "aggregate": "PharmacyDispatchAttempt",
        "purpose": "partner_callback_correlation",
        "triggerEvents": [
            "pharmacy.dispatch.acknowledged",
            "pharmacy.dispatch.proof_missing",
            "confirmation.gate.created",
            "confirmation.gate.confirmed",
            "confirmation.gate.disputed",
        ],
        "requiredEvidenceRefs": [
            "PharmacyDispatchAttempt",
            "DispatchProofEnvelope",
            "PharmacyCorrelationRecord",
            "ExternalConfirmationGate",
        ],
        "resources": OrderedDict(
            [
                ("Communication", "vecells-pharmacy-callback-communication"),
                ("Provenance", "vecells-pharmacy-callback-provenance"),
            ]
        ),
        "identifierPolicyRef": "IDPOL_049_TRANSPORT_CORRELATION_RECORD",
        "statusMappingPolicyRef": "STPOL_049_MESSAGE_COMMUNICATION",
        "cardinalityPolicyRef": "CARDPOL_049_SINGLE_COMMUNICATION_PER_DISPATCH",
        "redactionPolicyRef": "REDPOL_049_CALLBACK_CORRELATION_MINIMAL",
        "companionArtifactPolicyRef": "COMPPOL_049_CALLBACK_RECEIPT_REFS",
        "replayPolicyRef": "REPLAYPOL_049_TRANSPORT_CORRELATION_STABLE_CALLBACK_SET",
        "supersessionPolicyRef": "SUPPOL_049_CALLBACK_SUPERSESSION_ON_GATE_ROTATION",
        "callbackCorrelationPolicyRef": "CALLPOL_049_DISPATCH_ATTEMPT_AND_OUTBOUND_REFERENCE_HASH",
        "bundlePolicyRefs": ["FXBP_049_PARTNER_CALLBACK_INBOUND_COLLECTION"],
        "phaseSourceRef": "blueprint/phase-6-the-pharmacy-loop.md#Make dispatch idempotent, consent-gated, and acknowledgement-aware",
        "rationale": "Pharmacy callback proof and contradiction lanes are explicit bundle-driven companions, not mailbox-local booleans.",
        "defectState": "active",
    },
    {
        "contractId": "FRC_049_AUDIT_RECORD_AUDIT_COMPANION_V1",
        "ownerContext": "audit_compliance",
        "aggregate": "AuditRecord",
        "purpose": "audit_companion",
        "triggerEvents": [
            "audit.recorded",
            "audit.break_glass.used",
            "audit.export.generated",
        ],
        "requiredEvidenceRefs": ["AuditRecord", "AuditEvidenceReference"],
        "resources": OrderedDict(
            [
                ("AuditEvent", "vecells-audit-event"),
                ("Provenance", "vecells-audit-provenance"),
            ]
        ),
        "identifierPolicyRef": "IDPOL_049_AUDIT_CHAIN_HASH",
        "statusMappingPolicyRef": "STPOL_049_AUDIT_COMPANION",
        "cardinalityPolicyRef": "CARDPOL_049_SINGLE_AUDIT_EVENT_PLUS_PROVENANCE",
        "redactionPolicyRef": "REDPOL_049_AUDIT_COMPANION_MASKED",
        "companionArtifactPolicyRef": "COMPPOL_049_AUDIT_HASH_JOIN",
        "replayPolicyRef": "REPLAYPOL_049_AUDIT_HASH_APPEND_ONLY",
        "supersessionPolicyRef": "SUPPOL_049_AUDIT_APPEND_ONLY_COMPANION",
        "callbackCorrelationPolicyRef": "CALLPOL_049_NONE",
        "bundlePolicyRefs": ["FXBP_049_AUDIT_COMPANION_EXPORT_DOCUMENT"],
        "phaseSourceRef": "blueprint/phase-0-the-foundation-protocol.md#AuditRecord",
        "rationale": "FHIR AuditEvent and Provenance remain companion outputs derived from immutable internal audit joins only.",
        "defectState": "watch",
    },
]

EXCHANGE_BUNDLE_POLICIES = [
    {
        "policyId": "FXBP_049_REQUEST_OUTBOUND_DOCUMENT",
        "representationContractRefs": ["FRC_049_REQUEST_EXTERNAL_INTERCHANGE_V1"],
        "direction": "outbound",
        "legalBundleTypes": ["document"],
        "adapterProfileRefs": ["ACP_049_CLINICAL_REQUEST_INTERCHANGE"],
        "boundDependencyRefs": [],
        "correlationKeyFields": ["requestId", "representationSetId", "bundleHash"],
        "receiptCheckpointRefs": ["AdapterReceiptCheckpoint", "CommandSettlementRecord"],
        "authoritativeSuccess": "Declared partner acceptance plus durable correlation of the emitted document bundle.",
        "supersessionBehavior": "New request version or snapshot hash supersedes the older bundle and retires its writable use.",
        "invalidationBehavior": "Any missing snapshot parity, redaction drift, or route-intent mismatch invalidates the bundle.",
        "mandatoryProofRefs": ["EvidenceSnapshot", "RequestClosureRecord"],
        "exchangeStates": ["staged", "dispatched", "accepted", "replayed", "failed", "superseded"],
        "source_refs": [
            "blueprint/phase-0-the-foundation-protocol.md#FhirExchangeBundle",
            "prompt/049.md",
        ],
    },
    {
        "policyId": "FXBP_049_SECURE_MESSAGE_OUTBOUND_MESSAGE",
        "representationContractRefs": ["FRC_049_MESSAGE_DISPATCH_EXTERNAL_INTERCHANGE_V1"],
        "direction": "outbound",
        "legalBundleTypes": ["message"],
        "adapterProfileRefs": ["ACP_049_SECURE_MESSAGE_DISPATCH"],
        "boundDependencyRefs": ["dep_cross_org_secure_messaging_mesh", "dep_origin_practice_ack_rail"],
        "correlationKeyFields": ["messageDispatchEnvelopeId", "transportCorrelationKey", "bundleHash"],
        "receiptCheckpointRefs": ["AdapterReceiptCheckpoint", "MessageDeliveryEvidenceBundle"],
        "authoritativeSuccess": "Transport acceptance and delivery evidence must both settle on the same dispatch envelope and correlation key.",
        "supersessionBehavior": "Settlement upgrades supersede earlier pending companions without rewriting the dispatch envelope.",
        "invalidationBehavior": "Semantic drift or correlation reuse opens replay collision review and invalidates current confirmation.",
        "mandatoryProofRefs": ["ConversationCommandSettlement", "MessageDeliveryEvidenceBundle"],
        "exchangeStates": ["staged", "dispatched", "accepted", "replayed", "failed", "superseded"],
        "source_refs": [
            "blueprint/platform-runtime-and-release-blueprint.md#AdapterContractProfile",
            "blueprint/callback-and-clinician-messaging-loop.md#Clinician message domain / MessageDispatchEnvelope",
        ],
    },
    {
        "policyId": "FXBP_049_BOOKING_PARTNER_OUTBOUND_MESSAGE",
        "representationContractRefs": ["FRC_049_BOOKING_CASE_EXTERNAL_INTERCHANGE_V1"],
        "direction": "outbound",
        "legalBundleTypes": ["message"],
        "adapterProfileRefs": ["ACP_049_GP_BOOKING_SUPPLIER_FHIR"],
        "boundDependencyRefs": ["dep_gp_system_supplier_paths", "dep_local_booking_supplier_adapters"],
        "correlationKeyFields": ["bookingCaseId", "commitmentEpoch", "partnerRef", "bundleHash"],
        "receiptCheckpointRefs": ["AdapterReceiptCheckpoint", "ExternalConfirmationGate"],
        "authoritativeSuccess": "Only authoritative supplier proof or same-commit read-after-write evidence may settle the bundle as confirmed.",
        "supersessionBehavior": "New commitment epoch or cancellation supersedes the older bundle.",
        "invalidationBehavior": "Capability tuple drift, confirmation ambiguity, or gate dispute invalidates writable success posture.",
        "mandatoryProofRefs": ["BookingProviderAdapterBinding", "ExternalConfirmationGate"],
        "exchangeStates": ["staged", "dispatched", "accepted", "replayed", "failed", "superseded"],
        "source_refs": [
            "blueprint/phase-4-the-booking-engine.md#4E Commit path",
            "blueprint/platform-runtime-and-release-blueprint.md#AdapterContractProfile",
        ],
    },
    {
        "policyId": "FXBP_049_HUB_PARTNER_OUTBOUND_MESSAGE",
        "representationContractRefs": ["FRC_049_HUB_CASE_EXTERNAL_INTERCHANGE_V1"],
        "direction": "outbound",
        "legalBundleTypes": ["message"],
        "adapterProfileRefs": ["ACP_049_HUB_PARTNER_CAPACITY_EXCHANGE"],
        "boundDependencyRefs": ["dep_network_capacity_partner_feeds", "dep_origin_practice_ack_rail"],
        "correlationKeyFields": ["hubCoordinationCaseId", "confirmationGateId", "bundleHash"],
        "receiptCheckpointRefs": ["AdapterReceiptCheckpoint", "ExternalConfirmationGate", "PracticeAcknowledgementRecord"],
        "authoritativeSuccess": "Native partner confirmation plus required practice-visibility acknowledgement for the same generation.",
        "supersessionBehavior": "New hub selection or confirmation epoch supersedes the older partner bundle.",
        "invalidationBehavior": "Practice-visibility debt, gate dispute, or candidate supersession invalidates the bundle.",
        "mandatoryProofRefs": ["HubBookingEvidenceBundle", "ExternalConfirmationGate"],
        "exchangeStates": ["staged", "dispatched", "accepted", "replayed", "failed", "superseded"],
        "source_refs": [
            "blueprint/phase-5-the-network-horizon.md#Hub commit algorithm",
            "blueprint/platform-runtime-and-release-blueprint.md#AdapterContractProfile",
        ],
    },
    {
        "policyId": "FXBP_049_PHARMACY_REFERRAL_OUTBOUND_MESSAGE",
        "representationContractRefs": ["FRC_049_PHARMACY_CASE_EXTERNAL_INTERCHANGE_V1"],
        "direction": "outbound",
        "legalBundleTypes": ["message", "document"],
        "adapterProfileRefs": ["ACP_049_PHARMACY_REFERRAL_TRANSPORT"],
        "boundDependencyRefs": ["dep_pharmacy_referral_transport", "dep_cross_org_secure_messaging_mesh"],
        "correlationKeyFields": ["pharmacyCaseId", "dispatchAttemptId", "packageHash", "outboundReferenceSetHash"],
        "receiptCheckpointRefs": ["AdapterReceiptCheckpoint", "DispatchProofEnvelope", "ExternalConfirmationGate"],
        "authoritativeSuccess": "Dispatch proof must satisfy the active transport assurance profile for the same dispatch attempt and package hash.",
        "supersessionBehavior": "Any new package hash, provider, or dispatch plan supersedes the older bundle and correlation set.",
        "invalidationBehavior": "Consent drift, checkpoint drift, bundle hash drift, or contradictory proof invalidates the bundle immediately.",
        "mandatoryProofRefs": ["PharmacyConsentCheckpoint", "DispatchProofEnvelope", "PharmacyCorrelationRecord"],
        "exchangeStates": ["staged", "dispatched", "accepted", "replayed", "failed", "superseded"],
        "source_refs": [
            "blueprint/phase-6-the-pharmacy-loop.md#The right internal shape is a transport-neutral PharmacyReferralPackage",
            "blueprint/platform-runtime-and-release-blueprint.md#AdapterContractProfile",
        ],
    },
    {
        "policyId": "FXBP_049_PARTNER_CALLBACK_INBOUND_COLLECTION",
        "representationContractRefs": [
            "FRC_049_CALLBACK_CASE_PARTNER_CALLBACK_CORRELATION_V1",
            "FRC_049_BOOKING_CASE_PARTNER_CALLBACK_CORRELATION_V1",
            "FRC_049_HUB_CASE_PARTNER_CALLBACK_CORRELATION_V1",
            "FRC_049_PHARMACY_DISPATCH_PARTNER_CALLBACK_CORRELATION_V1",
        ],
        "direction": "inbound",
        "legalBundleTypes": ["collection", "message"],
        "adapterProfileRefs": ["ACP_049_PARTNER_CALLBACK_INGRESS"],
        "boundDependencyRefs": ["dep_gp_system_supplier_paths", "dep_pharmacy_outcome_observation"],
        "correlationKeyFields": ["partnerCorrelationKey", "dispatchAttemptId", "confirmationGateId", "bundleHash"],
        "receiptCheckpointRefs": ["AdapterReceiptCheckpoint", "ExternalConfirmationGate", "ReplayCollisionReview"],
        "authoritativeSuccess": "A callback is authoritative only when it binds to the current gate or dispatch epoch and survives ordering and collision policy.",
        "supersessionBehavior": "New confirmation or dispatch epochs supersede older callback collections explicitly.",
        "invalidationBehavior": "Unknown correlation, reordered semantic drift, or contradictory same-key evidence invalidates the callback bundle.",
        "mandatoryProofRefs": ["ExternalConfirmationGate", "ReplayCollisionReview"],
        "exchangeStates": ["staged", "accepted", "replayed", "failed", "superseded"],
        "source_refs": [
            "blueprint/platform-runtime-and-release-blueprint.md#AdapterContractProfile",
            "blueprint/forensic-audit-findings.md#Finding 40 - External outcomes were not modelled as adapter-side event producers",
        ],
    },
    {
        "policyId": "FXBP_049_AUDIT_COMPANION_EXPORT_DOCUMENT",
        "representationContractRefs": ["FRC_049_AUDIT_RECORD_AUDIT_COMPANION_V1"],
        "direction": "outbound",
        "legalBundleTypes": ["document", "collection"],
        "adapterProfileRefs": ["ACP_049_ASSURANCE_AUDIT_EXPORT"],
        "boundDependencyRefs": [],
        "correlationKeyFields": ["auditRecordId", "auditHash", "exportBatchId"],
        "receiptCheckpointRefs": ["AuditExportCheckpoint"],
        "authoritativeSuccess": "Export completion is authoritative only when the emitted bundle joins back to the same immutable audit hash chain.",
        "supersessionBehavior": "New exports append new bundles; they never supersede immutable prior audit truth.",
        "invalidationBehavior": "Digest drift or missing audit hash join invalidates the export bundle.",
        "mandatoryProofRefs": ["AuditRecord", "AuditEvidenceReference"],
        "exchangeStates": ["staged", "dispatched", "accepted", "replayed", "failed"],
        "source_refs": [
            "blueprint/phase-0-the-foundation-protocol.md#AuditRecord",
            "blueprint/platform-runtime-and-release-blueprint.md#Runtime publication completeness / FhirRepresentationContract",
        ],
    },
]


def read_json(path: Path) -> Any:
    return json.loads(path.read_text())


def read_csv(path: Path) -> list[dict[str, str]]:
    with path.open() as handle:
        return list(csv.DictReader(handle))


def write_json(path: Path, payload: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2) + "\n")


def write_text(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content.rstrip() + "\n")


def write_csv(path: Path, rows: list[dict[str, Any]], fieldnames: list[str]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        for row in rows:
            writer.writerow(row)


def stable_hash(payload: Any) -> str:
    return hashlib.sha256(json.dumps(payload, sort_keys=True, separators=(",", ":")).encode("utf-8")).hexdigest()


def source_ref_anchor(text: str) -> str:
    return text.replace(" ", "_").replace("/", "_").replace(".", "_").replace(":", "_")


def canonical_url(profile_slug: str) -> str:
    return f"https://vecells.example/fhir/StructureDefinition/{profile_slug}"


def slugify(identifier: str) -> str:
    return identifier.lower().replace(":", "-").replace("_", "-")


def load_context() -> dict[str, Any]:
    object_catalog = read_json(OBJECT_CATALOG_PATH)["objects"]
    event_payload = read_json(EVENT_REGISTRY_PATH)
    dependency_rows = read_csv(EXTERNAL_DEPENDENCY_PATH)
    request_lineage = read_json(REQUEST_LINEAGE_PATH)
    degraded_defaults = read_json(DEGRADED_DEFAULTS_PATH)
    domain_manifest = read_json(DOMAIN_MANIFEST_PATH)
    return {
        "object_catalog": object_catalog,
        "objects_by_name": {row["canonical_name"]: row for row in object_catalog},
        "event_payload": event_payload,
        "event_names": {row["eventName"] for row in event_payload["contracts"]},
        "dependency_rows": dependency_rows,
        "dependency_ids": {row["dependency_id"] for row in dependency_rows},
        "request_lineage": request_lineage,
        "degraded_defaults": degraded_defaults,
        "domain_manifest": domain_manifest,
    }


def build_contract_rows(context: dict[str, Any]) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    for spec in CONTRACT_SPECS:
        for event_name in spec["triggerEvents"]:
            if event_name not in context["event_names"]:
                raise SystemExit(f"PREREQUISITE_GAP_SEQ049_TRIGGER_EVENT_MISSING: {event_name}")
        row = {
            "fhirRepresentationContractId": spec["contractId"],
            "owningBoundedContextRef": spec["ownerContext"],
            "governingAggregateType": spec["aggregate"],
            "representationPurpose": spec["purpose"],
            "triggerMilestoneTypes": spec["triggerEvents"],
            "requiredEvidenceRefs": spec["requiredEvidenceRefs"],
            "allowedResourceTypes": list(spec["resources"].keys()),
            "requiredProfileCanonicalUrls": [canonical_url(slug) for slug in spec["resources"].values()],
            "identifierPolicyRef": spec["identifierPolicyRef"],
            "statusMappingPolicyRef": spec["statusMappingPolicyRef"],
            "cardinalityPolicyRef": spec["cardinalityPolicyRef"],
            "redactionPolicyRef": spec["redactionPolicyRef"],
            "companionArtifactPolicyRef": spec["companionArtifactPolicyRef"],
            "replayPolicyRef": spec["replayPolicyRef"],
            "supersessionPolicyRef": spec["supersessionPolicyRef"],
            "callbackCorrelationPolicyRef": spec["callbackCorrelationPolicyRef"],
            "declaredBundlePolicyRefs": spec["bundlePolicyRefs"],
            "contractVersionRef": spec["contractId"].replace("FRC_", "FRCV_"),
            "contractState": "active",
            "publishedAt": TIMESTAMP,
            "resourceProfiles": [
                {
                    "resourceType": resource_type,
                    "profileCanonicalUrl": canonical_url(profile_slug),
                }
                for resource_type, profile_slug in spec["resources"].items()
            ],
            "defectState": spec["defectState"],
            "source_refs": [
                "blueprint/phase-0-the-foundation-protocol.md#FhirRepresentationContract",
                spec["phaseSourceRef"],
                "blueprint/platform-runtime-and-release-blueprint.md#AdapterContractProfile",
            ],
            "rationale": spec["rationale"],
        }
        rows.append(row)
    rows.sort(key=lambda row: (row["governingAggregateType"], row["representationPurpose"], row["fhirRepresentationContractId"]))
    return rows


def build_representation_set_policies(contracts: list[dict[str, Any]]) -> list[dict[str, Any]]:
    policies = []
    for row in contracts:
        set_policy = {
            "fhirRepresentationSetPolicyId": row["fhirRepresentationContractId"].replace("FRC_", "FRSP_"),
            "representationContractRef": row["fhirRepresentationContractId"],
            "governingAggregateType": row["governingAggregateType"],
            "representationPurpose": row["representationPurpose"],
            "materializationTrigger": (
                f"Materialize after the declared milestone chain settles: {', '.join(row['triggerMilestoneTypes'])}."
            ),
            "resourceMembershipRule": (
                "Replay must reproduce the same ordered resource membership for the same governing aggregate version, "
                "evidence set, and policy tuple."
            ),
            "legalBundlePolicyRefs": row["declaredBundlePolicyRefs"],
            "authoritativeSuccessDefinition": (
                "The representation set becomes authoritative only when the governing aggregate version, required evidence, "
                "and policy tuple hash are all current and replay-safe."
            ),
            "supersessionBehavior": row["supersessionPolicyRef"],
            "invalidationBehavior": (
                "Invalidate the set when identifier inputs, redaction posture, or declared evidence prerequisites drift."
            ),
            "mandatoryProofRefs": row["requiredEvidenceRefs"],
            "source_refs": row["source_refs"],
        }
        policies.append(set_policy)
    return policies


def build_mapping_rows(
    contracts: list[dict[str, Any]],
) -> list[dict[str, str]]:
    rows: list[dict[str, str]] = []
    for contract in contracts:
        bundle_refs = contract["declaredBundlePolicyRefs"] or [""]
        for bundle_ref in bundle_refs:
            for profile in contract["resourceProfiles"]:
                rows.append(
                    {
                        "mappingRowId": f"MAP_{slugify(contract['fhirRepresentationContractId'])}_{profile['resourceType'].lower()}",
                        "fhirRepresentationContractId": contract["fhirRepresentationContractId"],
                        "owningBoundedContextRef": contract["owningBoundedContextRef"],
                        "governingAggregateType": contract["governingAggregateType"],
                        "representationPurpose": contract["representationPurpose"],
                        "resourceType": profile["resourceType"],
                        "profileCanonicalUrl": profile["profileCanonicalUrl"],
                        "identifierPolicyRef": contract["identifierPolicyRef"],
                        "statusMappingPolicyRef": contract["statusMappingPolicyRef"],
                        "cardinalityPolicyRef": contract["cardinalityPolicyRef"],
                        "redactionPolicyRef": contract["redactionPolicyRef"],
                        "companionArtifactPolicyRef": contract["companionArtifactPolicyRef"],
                        "replayPolicyRef": contract["replayPolicyRef"],
                        "supersessionPolicyRef": contract["supersessionPolicyRef"],
                        "callbackCorrelationPolicyRef": contract["callbackCorrelationPolicyRef"],
                        "exchangeBundlePolicyRef": bundle_ref,
                        "materializationDisposition": "allowed",
                        "defectState": contract["defectState"],
                        "rationale": contract["rationale"],
                    }
                )
    for blocked in PROHIBITED_LIFECYCLE_OWNERS:
        rows.append(
            {
                "mappingRowId": f"BLOCK_{slugify(blocked['objectType'])}",
                "fhirRepresentationContractId": "",
                "owningBoundedContextRef": "internal_control_plane",
                "governingAggregateType": blocked["objectType"],
                "representationPurpose": "prohibited",
                "resourceType": "",
                "profileCanonicalUrl": "",
                "identifierPolicyRef": "",
                "statusMappingPolicyRef": "",
                "cardinalityPolicyRef": "",
                "redactionPolicyRef": "",
                "companionArtifactPolicyRef": "",
                "replayPolicyRef": "",
                "supersessionPolicyRef": "",
                "callbackCorrelationPolicyRef": "",
                "exchangeBundlePolicyRef": "",
                "materializationDisposition": "prohibited",
                "defectState": "blocked",
                "rationale": blocked["blockedReason"],
            }
        )
    rows.sort(
        key=lambda row: (
            row["materializationDisposition"],
            row["governingAggregateType"],
            row["representationPurpose"],
            row["resourceType"],
        )
    )
    return rows


def build_contract_payload(
    contracts: list[dict[str, Any]],
    set_policies: list[dict[str, Any]],
    mapping_rows: list[dict[str, str]],
) -> dict[str, Any]:
    summary = {
        "contract_count": len(contracts),
        "active_contract_count": len([row for row in contracts if row["contractState"] == "active"]),
        "mapped_aggregate_count": len({row["governingAggregateType"] for row in contracts}),
        "representation_purpose_count": len({row["representationPurpose"] for row in contracts}),
        "representation_set_policy_count": len(set_policies),
        "mapping_row_count": len(mapping_rows),
        "watch_contract_count": len([row for row in contracts if row["defectState"] == "watch"]),
        "blocked_mapping_count": len(PROHIBITED_LIFECYCLE_OWNERS),
        "assumption_count": len(ASSUMPTIONS),
    }
    payload = OrderedDict(
        [
            ("task_id", "seq_049"),
            ("generated_at", TIMESTAMP),
            ("captured_on", CAPTURED_ON),
            ("visual_mode", "Clinical_Representation_Atlas"),
            (
                "mission",
                "Define one canonical FHIR representation strategy so domain aggregates stay authoritative while FHIR remains replayable representation, governed interchange, callback correlation, and audit companion output.",
            ),
            ("source_precedence", SOURCE_PRECEDENCE),
            (
                "upstream_inputs",
                [
                    "data/analysis/request_lineage_transitions.json",
                    "data/analysis/object_catalog.json",
                    "data/analysis/external_dependency_inventory.csv",
                    "data/analysis/degraded_mode_defaults.json",
                    "data/analysis/domain_package_manifest.json",
                    "data/analysis/canonical_event_contracts.json",
                ],
            ),
            ("summary", summary),
            ("contracts", contracts),
            ("representationSetPolicies", set_policies),
            ("assumptions", ASSUMPTIONS),
            (
                "representationDefects",
                [
                    {
                        "defectId": assumption["assumptionId"],
                        "defectState": assumption["state"],
                        "summary": assumption["statement"],
                        "source_refs": assumption["source_refs"],
                    }
                    for assumption in ASSUMPTIONS
                ],
            ),
        ]
    )
    payload["representationContractTupleHash"] = stable_hash(payload)
    return payload


def build_exchange_payload() -> dict[str, Any]:
    summary = {
        "policy_count": len(EXCHANGE_BUNDLE_POLICIES),
        "adapter_profile_count": len(
            {profile for row in EXCHANGE_BUNDLE_POLICIES for profile in row["adapterProfileRefs"]}
        ),
        "bundle_type_count": len(
            {bundle_type for row in EXCHANGE_BUNDLE_POLICIES for bundle_type in row["legalBundleTypes"]}
        ),
    }
    payload = OrderedDict(
        [
            ("task_id", "seq_049"),
            ("generated_at", TIMESTAMP),
            ("captured_on", CAPTURED_ON),
            ("summary", summary),
            ("policies", EXCHANGE_BUNDLE_POLICIES),
        ]
    )
    payload["exchangeTupleHash"] = stable_hash(payload)
    return payload


def build_policy_payload() -> dict[str, Any]:
    summary = {
        "identifier_policy_count": len(IDENTIFIER_POLICIES),
        "status_mapping_policy_count": len(STATUS_MAPPING_POLICIES),
        "cardinality_policy_count": len(CARDINALITY_POLICIES),
        "redaction_policy_count": len(REDACTION_POLICIES),
        "companion_artifact_policy_count": len(COMPANION_ARTIFACT_POLICIES),
        "replay_policy_count": len(REPLAY_POLICIES),
        "supersession_policy_count": len(SUPERSESSION_POLICIES),
        "callback_correlation_policy_count": len(CALLBACK_CORRELATION_POLICIES),
        "blocked_lifecycle_owner_count": len(PROHIBITED_LIFECYCLE_OWNERS),
        "assumption_count": len(ASSUMPTIONS),
    }
    payload = OrderedDict(
        [
            ("task_id", "seq_049"),
            ("generated_at", TIMESTAMP),
            ("captured_on", CAPTURED_ON),
            ("summary", summary),
            ("identifierPolicies", IDENTIFIER_POLICIES),
            ("statusMappingPolicies", STATUS_MAPPING_POLICIES),
            ("cardinalityPolicies", CARDINALITY_POLICIES),
            ("redactionPolicies", REDACTION_POLICIES),
            ("companionArtifactPolicies", COMPANION_ARTIFACT_POLICIES),
            ("replayPolicies", REPLAY_POLICIES),
            ("supersessionPolicies", SUPERSESSION_POLICIES),
            ("callbackCorrelationPolicies", CALLBACK_CORRELATION_POLICIES),
            ("prohibitedLifecycleOwners", PROHIBITED_LIFECYCLE_OWNERS),
            ("assumptions", ASSUMPTIONS),
        ]
    )
    payload["policyTupleHash"] = stable_hash(payload)
    return payload


def build_strategy_doc(
    contract_payload: dict[str, Any],
    exchange_payload: dict[str, Any],
    policy_payload: dict[str, Any],
) -> str:
    contracts = contract_payload["contracts"]
    lines = [
        "# 49 FHIR Representation Strategy",
        "",
        "## Mission",
        "",
        "Publish one deterministic, replay-safe FHIR representation authority so Vecells keeps domain aggregates as lifecycle truth while FHIR remains explicit representation only.",
        "",
        "## Core Law",
        "",
        "- `FhirRepresentationContract` is the only legal place to define how an aggregate version, evidence snapshot, or settlement chain becomes FHIR resources.",
        "- `FhirRepresentationSet` is the atomic replay and audit unit. The same causal inputs must rematerialize the same resource membership.",
        "- `FhirExchangeBundle` is the only adapter-boundary payload family. Adapters may not infer resource shapes from local code defaults.",
        "- `ClinicalRepresentationMapper` and declared adapter workloads are the only raw FHIR speakers.",
        "- Domain aggregates keep lifecycle, blocker, closure, continuity, and control-plane truth even when FHIR companions exist.",
        "",
        "## Contract Summary",
        "",
        f"- Active contracts: `{contract_payload['summary']['active_contract_count']}`",
        f"- Governing aggregate types: `{contract_payload['summary']['mapped_aggregate_count']}`",
        f"- Representation purposes: `{contract_payload['summary']['representation_purpose_count']}`",
        f"- Exchange bundle policies: `{exchange_payload['summary']['policy_count']}`",
        f"- Blocked lifecycle-owner mappings: `{policy_payload['summary']['blocked_lifecycle_owner_count']}`",
        "",
        "## Purpose Profiles",
        "",
        "- `clinical_persistence`: replay-safe internal clinical representation that never replaces aggregate truth.",
        "- `external_interchange`: partner or clinical interchange from frozen aggregate and evidence state only.",
        "- `partner_callback_correlation`: inbound or outbound callback companions bound to explicit correlation and checkpoint law.",
        "- `audit_companion`: FHIR `AuditEvent` and `Provenance` derived from immutable internal audit joins only.",
        "",
        "## Gap Closures",
        "",
        "- FHIR mapping is no longer implicit in application code; every allowed mapping now lives on one published contract row.",
        "- Raw FHIR resources cannot quietly become lifecycle owners because the blocked owner set is explicit and validator-backed.",
        "- Partner callback and external interchange payloads are now bound to declared `FhirExchangeBundle` policies.",
        "- Identifier and status semantics are machine-readable instead of adapter-local.",
        "- Audit companions are codified as companion output only, never replacements for internal audit truth.",
        "- Replay stability is explicit: the same aggregate version, package hash, or audit hash must rematerialize the same representation set.",
        "",
        "## Prohibited Lifecycle Owners",
        "",
    ]
    for blocked in PROHIBITED_LIFECYCLE_OWNERS:
        lines.append(f"- `{blocked['objectType']}`: {blocked['blockedReason']}")
    lines.extend(["", "## Active Contracts", ""])
    for row in contracts:
        resources = ", ".join(row["allowedResourceTypes"])
        bundles = ", ".join(row["declaredBundlePolicyRefs"]) if row["declaredBundlePolicyRefs"] else "none"
        lines.append(
            f"- `{row['fhirRepresentationContractId']}`: `{row['governingAggregateType']}` / `{row['representationPurpose']}` -> {resources}; bundles: {bundles}"
        )
    lines.extend(["", "## Assumptions", ""])
    for assumption in ASSUMPTIONS:
        lines.append(f"- `{assumption['assumptionId']}`: {assumption['statement']}")
    return "\n".join(lines)


def markdown_table(headers: list[str], rows: list[list[str]]) -> str:
    header_line = "| " + " | ".join(headers) + " |"
    separator = "| " + " | ".join(["---"] * len(headers)) + " |"
    body = ["| " + " | ".join(row) + " |" for row in rows]
    return "\n".join([header_line, separator, *body])


def build_catalog_doc(contract_payload: dict[str, Any]) -> str:
    rows = []
    for contract in contract_payload["contracts"]:
        rows.append(
            [
                f"`{contract['fhirRepresentationContractId']}`",
                f"`{contract['owningBoundedContextRef']}`",
                f"`{contract['governingAggregateType']}`",
                f"`{contract['representationPurpose']}`",
                ", ".join(f"`{value}`" for value in contract["allowedResourceTypes"]),
                ", ".join(f"`{value}`" for value in contract["declaredBundlePolicyRefs"]) or "`none`",
                f"`{contract['defectState']}`",
            ]
        )
    return "\n".join(
        [
            "# 49 FHIR Representation Contract Catalog",
            "",
            "## Contract Rows",
            "",
            markdown_table(
                [
                    "Contract",
                    "Owner",
                    "Aggregate",
                    "Purpose",
                    "Resources",
                    "Bundle policies",
                    "Defect state",
                ],
                rows,
            ),
        ]
    )


def build_matrix_doc(mapping_rows: list[dict[str, str]], exchange_payload: dict[str, Any]) -> str:
    allowed_rows = [row for row in mapping_rows if row["materializationDisposition"] == "allowed"]
    table_rows = [
        [
            f"`{row['governingAggregateType']}`",
            f"`{row['representationPurpose']}`",
            f"`{row['resourceType']}`",
            f"`{row['identifierPolicyRef']}`",
            f"`{row['statusMappingPolicyRef']}`",
            f"`{row['exchangeBundlePolicyRef'] or 'none'}`",
        ]
        for row in allowed_rows
    ]
    bundle_rows = [
        [
            f"`{row['policyId']}`",
            f"`{row['direction']}`",
            ", ".join(f"`{bundle}`" for bundle in row["legalBundleTypes"]),
            ", ".join(f"`{profile}`" for profile in row["adapterProfileRefs"]),
        ]
        for row in exchange_payload["policies"]
    ]
    return "\n".join(
        [
            "# 49 Domain To FHIR Mapping Matrix",
            "",
            "## Domain To Resource Rows",
            "",
            markdown_table(
                ["Aggregate", "Purpose", "Resource", "Identifier policy", "Status policy", "Bundle policy"],
                table_rows,
            ),
            "",
            "## Exchange Bundle Policies",
            "",
            markdown_table(["Bundle policy", "Direction", "Legal bundle types", "Adapter profiles"], bundle_rows),
        ]
    )


def build_contract_catalog(contract_payload: dict[str, Any], exchange_payload: dict[str, Any], policy_payload: dict[str, Any]) -> dict[str, Any]:
    contract_artifacts = []
    for contract in contract_payload["contracts"]:
        artifact_name = f"{slugify(contract['fhirRepresentationContractId'])}.json"
        artifact_path = CONTRACT_ARTIFACT_DIR / artifact_name
        bundle_refs = set(contract["declaredBundlePolicyRefs"])
        policy_payload_subset = {
            "identifierPolicy": next(
                row for row in policy_payload["identifierPolicies"] if row["policyId"] == contract["identifierPolicyRef"]
            ),
            "statusMappingPolicy": next(
                row for row in policy_payload["statusMappingPolicies"] if row["policyId"] == contract["statusMappingPolicyRef"]
            ),
            "cardinalityPolicy": next(
                row for row in policy_payload["cardinalityPolicies"] if row["policyId"] == contract["cardinalityPolicyRef"]
            ),
            "redactionPolicy": next(
                row for row in policy_payload["redactionPolicies"] if row["policyId"] == contract["redactionPolicyRef"]
            ),
            "companionArtifactPolicy": next(
                row
                for row in policy_payload["companionArtifactPolicies"]
                if row["policyId"] == contract["companionArtifactPolicyRef"]
            ),
            "replayPolicy": next(
                row for row in policy_payload["replayPolicies"] if row["policyId"] == contract["replayPolicyRef"]
            ),
            "supersessionPolicy": next(
                row
                for row in policy_payload["supersessionPolicies"]
                if row["policyId"] == contract["supersessionPolicyRef"]
            ),
            "callbackCorrelationPolicy": next(
                row
                for row in policy_payload["callbackCorrelationPolicies"]
                if row["policyId"] == contract["callbackCorrelationPolicyRef"]
            ),
            "exchangeBundlePolicies": [
                row for row in exchange_payload["policies"] if row["policyId"] in bundle_refs
            ],
        }
        artifact_payload = OrderedDict(
            [
                ("task_id", "seq_049"),
                ("artifact_type", "fhir_representation_contract"),
                ("generated_at", TIMESTAMP),
                ("contract", contract),
                ("resolvedPolicies", policy_payload_subset),
            ]
        )
        artifact_payload["artifactHash"] = stable_hash(artifact_payload)
        write_json(artifact_path, artifact_payload)
        contract_artifacts.append(
            {
                "contractId": contract["fhirRepresentationContractId"],
                "artifactPath": str(artifact_path.relative_to(ROOT)),
                "artifactHash": artifact_payload["artifactHash"],
            }
        )

    catalog = OrderedDict(
        [
            ("task_id", "seq_049"),
            ("generated_at", TIMESTAMP),
            (
                "artifacts",
                [
                    {
                        "artifactType": "representation_contracts",
                        "artifactPath": str(PACKAGE_CONTRACTS_PATH.relative_to(ROOT)),
                    },
                    {
                        "artifactType": "exchange_bundle_policies",
                        "artifactPath": str(PACKAGE_EXCHANGE_PATH.relative_to(ROOT)),
                    },
                    {
                        "artifactType": "identifier_and_status_policies",
                        "artifactPath": str(PACKAGE_POLICY_PATH.relative_to(ROOT)),
                    },
                    *contract_artifacts,
                ],
            ),
        ]
    )
    catalog["catalogHash"] = stable_hash(catalog)
    return catalog


def build_contract_readme(contract_payload: dict[str, Any], exchange_payload: dict[str, Any], policy_payload: dict[str, Any]) -> str:
    return "\n".join(
        [
            "# FHIR Mapping Contracts",
            "",
            "## Purpose",
            "",
            "Machine-readable contract artifacts that define how Vecells domain aggregates materialize replay-safe FHIR representations.",
            "",
            "## Coverage",
            "",
            f"- Representation contracts: `{contract_payload['summary']['active_contract_count']}`",
            f"- Exchange bundle policies: `{exchange_payload['summary']['policy_count']}`",
            f"- Identifier policies: `{policy_payload['summary']['identifier_policy_count']}`",
            f"- Blocked lifecycle owners: `{policy_payload['summary']['blocked_lifecycle_owner_count']}`",
            "",
            "## Files",
            "",
            f"- `representation-contracts.json`",
            f"- `exchange-bundle-policies.json`",
            f"- `identifier-and-status-policies.json`",
            f"- `catalog.json`",
            "- `contracts/*.json` per active representation contract",
            "",
            "## Law",
            "",
            "- Domain aggregates stay authoritative.",
            "- `FhirRepresentationSet` remains the replay atom.",
            "- `FhirExchangeBundle` is the only adapter-boundary payload family.",
            "- Raw payloads and control-plane truth never escape through ad hoc FHIR serializers.",
        ]
    )


def build_package_source(contract_payload: dict[str, Any], exchange_payload: dict[str, Any], policy_payload: dict[str, Any]) -> str:
    foundation_fhir_mappings = {
        "request_task": "Task",
        "evidence_snapshot": "DocumentReference",
        "message_dispatch": "Communication",
        "booking_commitment": "ServiceRequest",
        "hub_commitment": "ServiceRequest",
        "pharmacy_referral": "ServiceRequest",
        "pharmacy_consent": "Consent",
        "audit_companion": "AuditEvent",
    }
    contract_catalog = build_contract_catalog(contract_payload, exchange_payload, policy_payload)
    return dedent(
        f"""
        const representationContractsPayload = {json.dumps(contract_payload, indent=2)} as const;
        const exchangeBundlePoliciesPayload = {json.dumps(exchange_payload, indent=2)} as const;
        const policyPayload = {json.dumps(policy_payload, indent=2)} as const;
        const contractCatalog = {json.dumps(contract_catalog, indent=2)} as const;

        export const foundationFhirMappings = {json.dumps(foundation_fhir_mappings, indent=2)} as const;

        export interface OwnedObjectFamily {{
          canonicalName: string;
          objectKind: string;
          boundedContext: string;
          authoritativeOwner: string;
          sourceRef: string;
        }}

        export interface OwnedContractFamily {{
          contractFamilyId: string;
          label: string;
          description: string;
          versioningPosture: string;
          consumerContractIds: readonly string[];
          consumerOwnerCodes: readonly string[];
          consumerSelectors: readonly string[];
          sourceRefs: readonly string[];
          ownedObjectFamilyCount: number;
        }}

        export interface PackageContract {{
          artifactId: string;
          packageName: string;
          packageRole: string;
          ownerContextCode: string;
          ownerContextLabel: string;
          purpose: string;
          versioningPosture: string;
          allowedDependencies: readonly string[];
          forbiddenDependencies: readonly string[];
          dependencyContractRefs: readonly string[];
          objectFamilyCount: number;
          contractFamilyCount: number;
          sourceContexts: readonly string[];
        }}

        export const packageContract = {{
          artifactId: "package_fhir_mapping",
          packageName: "@vecells/fhir-mapping",
          packageRole: "shared",
          ownerContextCode: "shared_contracts",
          ownerContextLabel: "Shared Contracts",
          purpose:
            "Canonical FHIR representation contract authority for replay-safe clinical persistence, partner interchange, callback correlation, and audit companion output.",
          versioningPosture:
            "Workspace-private published contract boundary. Public exports are explicit, diffable, and versionable.",
          allowedDependencies: [
            "packages/domain-kernel",
            "packages/event-contracts",
            "packages/domains/* (representation-only entrypoints)",
          ],
          forbiddenDependencies: ["apps/*", "services/* raw-store writes"],
          dependencyContractRefs: ["CBC_041_PROJECTION_WORKER_TO_FHIR_MAPPING"],
          objectFamilyCount: 4,
          contractFamilyCount: 2,
          sourceContexts: [
            "audit_compliance",
            "booking",
            "communications",
            "foundation_control_plane",
            "hub_coordination",
            "intake_safety",
            "pharmacy",
            "runtime_release",
          ],
        }} as const satisfies PackageContract;

        export const ownedObjectFamilies = [
          {{
            canonicalName: "FhirRepresentationContract",
            objectKind: "contract",
            boundedContext: "runtime_release",
            authoritativeOwner: "Clinical representation mapper",
            sourceRef: "blueprint/phase-0-the-foundation-protocol.md#FhirRepresentationContract",
          }},
          {{
            canonicalName: "FhirRepresentationSet",
            objectKind: "record",
            boundedContext: "runtime_release",
            authoritativeOwner: "Clinical representation mapper",
            sourceRef: "blueprint/phase-0-the-foundation-protocol.md#FhirRepresentationSet",
          }},
          {{
            canonicalName: "FhirResourceRecord",
            objectKind: "record",
            boundedContext: "runtime_release",
            authoritativeOwner: "Clinical representation mapper",
            sourceRef: "blueprint/phase-0-the-foundation-protocol.md#FhirResourceRecord",
          }},
          {{
            canonicalName: "FhirExchangeBundle",
            objectKind: "bundle",
            boundedContext: "runtime_release",
            authoritativeOwner: "Clinical representation mapper",
            sourceRef: "blueprint/phase-0-the-foundation-protocol.md#FhirExchangeBundle",
          }},
        ] as const satisfies readonly OwnedObjectFamily[];

        export const ownedContractFamilies = [
          {{
            contractFamilyId: "CF_049_FHIR_REPRESENTATION_AUTHORITY",
            label: "FHIR representation authority",
            description:
              "Canonical mapping authority for turning domain aggregates into replay-safe FHIR representation sets.",
            versioningPosture:
              "Contract-first and replay-safe. Aggregate truth stays authoritative while FHIR remains representational.",
            consumerContractIds: [
              "CBC_041_PROJECTION_WORKER_TO_FHIR_MAPPING",
              "CBC_041_ADAPTER_SIMULATORS_TO_CONTRACT_AND_FIXTURE_PACKAGES",
            ],
            consumerOwnerCodes: ["platform_integration", "platform_runtime"],
            consumerSelectors: ["services/adapter-simulators", "services/projection-worker"],
            sourceRefs: [
              "blueprint/phase-0-the-foundation-protocol.md#FhirRepresentationContract",
              "prompt/049.md",
            ],
            ownedObjectFamilyCount: 4,
          }},
          {{
            contractFamilyId: "CF_049_FHIR_EXCHANGE_BUNDLE_LAW",
            label: "FHIR exchange bundle law",
            description:
              "Adapter-boundary bundle policies for outbound interchange, inbound callbacks, and audit-companion export.",
            versioningPosture:
              "Bundle types, adapter profile refs, and proof-upgrade law are explicit and diffable.",
            consumerContractIds: [
              "CBC_041_PROJECTION_WORKER_TO_FHIR_MAPPING",
              "CBC_041_ADAPTER_SIMULATORS_TO_CONTRACT_AND_FIXTURE_PACKAGES",
            ],
            consumerOwnerCodes: ["platform_integration", "platform_runtime"],
            consumerSelectors: ["services/adapter-simulators", "services/projection-worker"],
            sourceRefs: [
              "blueprint/platform-runtime-and-release-blueprint.md#AdapterContractProfile",
              "prompt/049.md",
            ],
            ownedObjectFamilyCount: 4,
          }},
        ] as const satisfies readonly OwnedContractFamily[];

        export const eventFamilies = [] as const satisfies readonly OwnedObjectFamily[];
        export const policyFamilies = ownedObjectFamilies;
        export const projectionFamilies = [] as const satisfies readonly OwnedObjectFamily[];

        export const fhirRepresentationFamilies = ownedObjectFamilies;
        export const fhirRepresentationContracts = representationContractsPayload.contracts;
        export const fhirRepresentationSetPolicies = representationContractsPayload.representationSetPolicies;
        export const fhirExchangeBundlePolicies = exchangeBundlePoliciesPayload.policies;
        export const fhirIdentifierPolicies = policyPayload.identifierPolicies;
        export const fhirStatusMappingPolicies = policyPayload.statusMappingPolicies;
        export const blockedFhirLifecycleOwners = policyPayload.prohibitedLifecycleOwners;
        export const fhirContractCatalog = contractCatalog;

        export function makeFhirMappingKey(resourceType: string, profile: string): string {{
          return `${{resourceType}}::${{profile}}`;
        }}

        export function bootstrapSharedPackage() {{
          return {{
            packageName: packageContract.packageName,
            objectFamilies: ownedObjectFamilies.length,
            contractFamilies: ownedContractFamilies.length,
            representationContracts: fhirRepresentationContracts.length,
            exchangeBundlePolicies: fhirExchangeBundlePolicies.length,
            blockedLifecycleOwners: blockedFhirLifecycleOwners.length,
          }};
        }}
        """
    ).strip() + "\n"


def build_package_test() -> str:
    return dedent(
        """
        import { describe, expect, it } from "vitest";
        import {
          blockedFhirLifecycleOwners,
          bootstrapSharedPackage,
          fhirExchangeBundlePolicies,
          fhirRepresentationContracts,
          foundationFhirMappings,
          packageContract,
        } from "../src/index.ts";
        import { foundationKernelFamilies } from "@vecells/domain-kernel";
        import { publishedEventFamilies } from "@vecells/event-contracts";

        describe("FHIR mapping public package surface", () => {
          it("publishes the seq_049 FHIR authority through documented exports", () => {
            expect(packageContract.packageName).toBe("@vecells/fhir-mapping");
            expect(bootstrapSharedPackage().representationContracts).toBe(fhirRepresentationContracts.length);
            expect(fhirRepresentationContracts.length).toBeGreaterThanOrEqual(10);
            expect(fhirExchangeBundlePolicies.length).toBeGreaterThanOrEqual(6);
            expect(blockedFhirLifecycleOwners.length).toBeGreaterThanOrEqual(8);
            expect(foundationFhirMappings.request_task).toBe("Task");
            expect(Array.isArray(foundationKernelFamilies)).toBe(true);
            expect(Array.isArray(publishedEventFamilies)).toBe(true);
          });
        });
        """
    ).strip() + "\n"


def build_package_readme(contract_payload: dict[str, Any], exchange_payload: dict[str, Any], policy_payload: dict[str, Any]) -> str:
    return "\n".join(
        [
            "# FHIR Mapping",
            "",
            "## Purpose",
            "",
            "Canonical FHIR representation authority for replay-safe clinical persistence, external interchange, partner callback correlation, and audit companion output.",
            "",
            "## Ownership",
            "",
            "- Package: `@vecells/fhir-mapping`",
            "- Artifact id: `package_fhir_mapping`",
            "- Owner lane: `Shared Contracts` (`shared_contracts`)",
            "- Canonical object families: `4`",
            "- Shared contract families: `2`",
            "- Versioning posture: `workspace-private published contract boundary with explicit public exports`",
            "",
            "## Source Refs",
            "",
            "- `blueprint/phase-0-the-foundation-protocol.md#FhirRepresentationContract`",
            "- `blueprint/phase-0-the-foundation-protocol.md#FhirRepresentationSet`",
            "- `blueprint/phase-0-the-foundation-protocol.md#FhirResourceRecord`",
            "- `blueprint/phase-0-the-foundation-protocol.md#FhirExchangeBundle`",
            "- `blueprint/platform-runtime-and-release-blueprint.md#AdapterContractProfile`",
            "- `prompt/049.md`",
            "",
            "## Consumers",
            "",
            "- Boundary contracts: `CBC_041_PROJECTION_WORKER_TO_FHIR_MAPPING`, `CBC_041_ADAPTER_SIMULATORS_TO_CONTRACT_AND_FIXTURE_PACKAGES`",
            "- Consumer selectors: `services/adapter-simulators`, `services/projection-worker`",
            "",
            "## Allowed Dependencies",
            "",
            "- `packages/domain-kernel`",
            "- `packages/event-contracts`",
            "- `packages/domains/* (representation-only entrypoints)`",
            "",
            "## Forbidden Dependencies",
            "",
            "- `apps/*`",
            "- `services/* raw-store writes`",
            "",
            "## Public API",
            "",
            "- `foundationFhirMappings`",
            "- `fhirRepresentationContracts`",
            "- `fhirRepresentationSetPolicies`",
            "- `fhirExchangeBundlePolicies`",
            "- `fhirIdentifierPolicies`",
            "- `fhirStatusMappingPolicies`",
            "- `blockedFhirLifecycleOwners`",
            "- `fhirContractCatalog`",
            "- `bootstrapSharedPackage()`",
            "",
            "## Contract Families",
            "",
            "- `FHIR representation authority`",
            "- `FHIR exchange bundle law`",
            "",
            "## Family Coverage",
            "",
            f"- Active representation contracts: `{contract_payload['summary']['active_contract_count']}`",
            f"- Exchange bundle policies: `{exchange_payload['summary']['policy_count']}`",
            f"- Identifier policies: `{policy_payload['summary']['identifier_policy_count']}`",
            f"- Blocked lifecycle owners: `{policy_payload['summary']['blocked_lifecycle_owner_count']}`",
            "",
            "## Bootstrapping Test",
            "",
            "`tests/public-api.test.ts` proves the package boots through documented public exports and that seq_049 contract counts remain aligned with the generated FHIR authority catalogs.",
        ]
    )


def build_atlas_html() -> str:
    return dedent(
        """
        <!DOCTYPE html>
        <html lang="en">
          <head>
            <meta charset="utf-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1" />
            <title>Clinical Representation Atlas</title>
            <style>
              :root {
                --canvas: #f7f9fc;
                --rail: #eef3f8;
                --panel: #ffffff;
                --inset: #f3f7fb;
                --text-strong: #0f172a;
                --text-default: #1e293b;
                --text-muted: #667085;
                --border-subtle: #e2e8f0;
                --border-default: #cbd5e1;
                --domain-accent: #3559e6;
                --representation-accent: #0ea5a4;
                --interchange-accent: #6e59d9;
                --warning-accent: #c98900;
                --blocked-accent: #c24141;
                --shadow: 0 18px 48px rgba(15, 23, 42, 0.08);
              }

              * {
                box-sizing: border-box;
              }

              body {
                margin: 0;
                font-family:
                  -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
                background: radial-gradient(circle at top right, rgba(53, 89, 230, 0.08), transparent 24%),
                  linear-gradient(180deg, rgba(255, 255, 255, 0.82), rgba(255, 255, 255, 0.92)),
                  var(--canvas);
                color: var(--text-default);
              }

              body[data-reduced-motion="true"] * {
                transition-duration: 0.01ms !important;
                animation-duration: 0.01ms !important;
                scroll-behavior: auto !important;
              }

              .app-shell {
                max-width: 1500px;
                margin: 0 auto;
                padding: 20px;
              }

              .masthead {
                position: sticky;
                top: 0;
                z-index: 10;
                display: grid;
                grid-template-columns: 1.4fr repeat(4, 1fr);
                gap: 12px;
                align-items: stretch;
                min-height: 72px;
                padding: 16px;
                margin-bottom: 16px;
                border: 1px solid var(--border-subtle);
                border-radius: 24px;
                background: rgba(255, 255, 255, 0.92);
                backdrop-filter: blur(14px);
                box-shadow: var(--shadow);
              }

              .brand {
                display: flex;
                align-items: center;
                gap: 14px;
              }

              .brand svg {
                width: 52px;
                height: 52px;
                border-radius: 16px;
                background: linear-gradient(135deg, rgba(53, 89, 230, 0.14), rgba(14, 165, 164, 0.1));
                border: 1px solid rgba(53, 89, 230, 0.18);
                padding: 8px;
              }

              .brand-title {
                display: flex;
                flex-direction: column;
                gap: 2px;
              }

              .eyebrow {
                color: var(--text-muted);
                font-size: 12px;
                letter-spacing: 0.12em;
                text-transform: uppercase;
              }

              .brand-title strong {
                color: var(--text-strong);
                font-size: 18px;
                font-weight: 650;
              }

              .metric {
                display: flex;
                flex-direction: column;
                justify-content: center;
                padding: 12px 14px;
                border-radius: 18px;
                background: var(--inset);
                border: 1px solid var(--border-subtle);
              }

              .metric label {
                color: var(--text-muted);
                font-size: 12px;
                margin-bottom: 4px;
              }

              .metric strong {
                color: var(--text-strong);
                font-size: 22px;
                line-height: 1;
              }

              .layout {
                display: grid;
                grid-template-columns: 284px minmax(0, 1fr) 392px;
                gap: 16px;
              }

              .rail,
              .canvas-panel,
              .inspector-panel,
              .subpanel {
                background: var(--panel);
                border: 1px solid var(--border-subtle);
                border-radius: 24px;
                box-shadow: var(--shadow);
              }

              .rail {
                padding: 18px;
                background: linear-gradient(180deg, rgba(238, 243, 248, 0.88), rgba(255, 255, 255, 0.94));
              }

              .rail h2,
              .canvas-panel h2,
              .inspector-panel h2,
              .subpanel h2 {
                margin: 0 0 12px;
                font-size: 14px;
                color: var(--text-strong);
              }

              .filter-stack {
                display: grid;
                gap: 10px;
              }

              .filter-stack label {
                display: grid;
                gap: 6px;
                font-size: 12px;
                color: var(--text-muted);
              }

              select {
                width: 100%;
                min-height: 44px;
                border-radius: 14px;
                border: 1px solid var(--border-default);
                background: #fff;
                color: var(--text-default);
                padding: 0 14px;
                font-size: 14px;
              }

              .aggregate-list {
                display: grid;
                gap: 8px;
                margin-top: 14px;
              }

              .aggregate-button {
                display: flex;
                justify-content: space-between;
                align-items: center;
                min-height: 44px;
                border-radius: 16px;
                border: 1px solid var(--border-subtle);
                background: rgba(255, 255, 255, 0.84);
                color: var(--text-default);
                padding: 10px 12px;
                cursor: pointer;
                transition: border-color 120ms ease, transform 120ms ease, background 120ms ease;
              }

              .aggregate-button[data-selected="true"] {
                border-color: rgba(53, 89, 230, 0.44);
                background: rgba(53, 89, 230, 0.08);
                transform: translateX(2px);
              }

              .aggregate-button span:last-child {
                font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
                color: var(--text-muted);
                font-size: 12px;
              }

              .canvas-panel,
              .inspector-panel {
                padding: 18px;
              }

              .canvas-panel {
                display: grid;
                gap: 16px;
              }

              .table-shell {
                min-height: 520px;
                border-radius: 20px;
                overflow: hidden;
                border: 1px solid var(--border-subtle);
                background: var(--inset);
              }

              table {
                width: 100%;
                border-collapse: collapse;
              }

              thead {
                background: rgba(15, 23, 42, 0.03);
              }

              th,
              td {
                padding: 12px 14px;
                text-align: left;
                vertical-align: top;
                font-size: 13px;
                border-bottom: 1px solid var(--border-subtle);
              }

              td code,
              .inspector-panel code,
              .subpanel code {
                font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
                font-size: 12px;
              }

              tbody tr {
                cursor: pointer;
                transition: background 180ms ease, transform 180ms ease;
              }

              tbody tr[data-selected="true"] {
                background: rgba(53, 89, 230, 0.08);
              }

              .canvas-grid {
                display: grid;
                grid-template-columns: 1.05fr 0.95fr;
                gap: 16px;
              }

              .subpanel {
                padding: 16px;
              }

              .braid-diagram {
                width: 100%;
                min-height: 280px;
                border-radius: 18px;
                background: linear-gradient(180deg, rgba(243, 247, 251, 0.95), #fff);
                border: 1px solid var(--border-subtle);
              }

              .inspector-panel {
                display: grid;
                gap: 14px;
                align-content: start;
                transition: transform 220ms ease;
              }

              .inspector-group {
                padding: 14px;
                border-radius: 18px;
                background: var(--inset);
                border: 1px solid var(--border-subtle);
              }

              .inspector-group ul,
              .subpanel ul {
                margin: 8px 0 0;
                padding-left: 18px;
              }

              .chip-row {
                display: flex;
                flex-wrap: wrap;
                gap: 8px;
              }

              .chip {
                min-height: 28px;
                display: inline-flex;
                align-items: center;
                gap: 6px;
                padding: 4px 10px;
                border-radius: 999px;
                border: 1px solid var(--border-subtle);
                background: #fff;
                font-size: 12px;
              }

              .chip.purpose-external_interchange {
                color: var(--interchange-accent);
                border-color: rgba(110, 89, 217, 0.22);
              }

              .chip.purpose-clinical_persistence {
                color: var(--domain-accent);
                border-color: rgba(53, 89, 230, 0.22);
              }

              .chip.purpose-partner_callback_correlation {
                color: var(--representation-accent);
                border-color: rgba(14, 165, 164, 0.22);
              }

              .chip.purpose-audit_companion {
                color: var(--warning-accent);
                border-color: rgba(201, 137, 0, 0.28);
              }

              .chip.defect-watch {
                color: var(--warning-accent);
              }

              .chip.defect-blocked {
                color: var(--blocked-accent);
                border-color: rgba(194, 65, 65, 0.24);
              }

              .bottom-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 16px;
                margin-top: 16px;
              }

              .defect-strip {
                display: grid;
                gap: 10px;
              }

              .defect-card {
                padding: 12px 14px;
                border-radius: 16px;
                border: 1px solid rgba(194, 65, 65, 0.2);
                background: rgba(194, 65, 65, 0.05);
              }

              .empty-state {
                padding: 22px;
                color: var(--text-muted);
              }

              @media (max-width: 1180px) {
                .layout {
                  grid-template-columns: 1fr;
                }

                .canvas-grid,
                .bottom-grid,
                .masthead {
                  grid-template-columns: 1fr;
                }
              }
            </style>
          </head>
          <body>
            <div class="app-shell">
              <header class="masthead" data-testid="atlas-masthead">
                <div class="brand">
                  <svg viewBox="0 0 64 64" aria-hidden="true">
                    <rect x="10" y="10" width="44" height="44" rx="14" fill="none" stroke="#3559E6" stroke-width="3" />
                    <path d="M22 20h20M22 32h14M22 44h9" stroke="#0EA5A4" stroke-width="3.5" stroke-linecap="round" />
                  </svg>
                  <div class="brand-title">
                    <span class="eyebrow">Vecells Clinical Representation Atlas</span>
                    <strong>Domain truth first. FHIR only by published contract.</strong>
                  </div>
                </div>
                <div class="metric"><label>Contracts</label><strong data-testid="metric-contracts">0</strong></div>
                <div class="metric"><label>Mapped aggregates</label><strong data-testid="metric-aggregates">0</strong></div>
                <div class="metric"><label>Bundle policies</label><strong data-testid="metric-bundles">0</strong></div>
                <div class="metric"><label>Blocked mappings</label><strong data-testid="metric-blocked">0</strong></div>
              </header>

              <main class="layout">
                <aside class="rail" data-testid="aggregate-rail">
                  <h2>Aggregate filters</h2>
                  <div class="filter-stack">
                    <label>
                      Owning context
                      <select data-testid="filter-context" id="filter-context"></select>
                    </label>
                    <label>
                      Representation purpose
                      <select data-testid="filter-purpose" id="filter-purpose"></select>
                    </label>
                    <label>
                      Resource type
                      <select data-testid="filter-resource" id="filter-resource"></select>
                    </label>
                    <label>
                      Defect state
                      <select data-testid="filter-defect" id="filter-defect"></select>
                    </label>
                  </div>
                  <div class="aggregate-list" data-testid="aggregate-button-list"></div>
                </aside>

                <section class="canvas-panel">
                  <div class="table-shell">
                    <table data-testid="mapping-table">
                      <thead>
                        <tr>
                          <th>Aggregate</th>
                          <th>Purpose</th>
                          <th>Resources</th>
                          <th>Bundle</th>
                          <th>Defect</th>
                        </tr>
                      </thead>
                      <tbody data-testid="mapping-body"></tbody>
                    </table>
                  </div>

                  <div class="canvas-grid">
                    <section class="subpanel">
                      <h2>Domain-to-resource braid</h2>
                      <svg
                        class="braid-diagram"
                        viewBox="0 0 640 280"
                        role="img"
                        aria-label="Aggregate to representation braid"
                        data-testid="braid-diagram"
                      >
                        <rect x="36" y="74" width="156" height="72" rx="22" fill="#FFFFFF" stroke="#CBD5E1" />
                        <rect x="244" y="42" width="156" height="72" rx="22" fill="#FFFFFF" stroke="#CBD5E1" />
                        <rect x="244" y="166" width="156" height="72" rx="22" fill="#FFFFFF" stroke="#CBD5E1" />
                        <rect x="452" y="74" width="156" height="72" rx="22" fill="#FFFFFF" stroke="#CBD5E1" />
                        <path d="M190 110C222 110 222 78 244 78" fill="none" stroke="#3559E6" stroke-width="4" stroke-linecap="round" />
                        <path d="M190 110C222 110 222 202 244 202" fill="none" stroke="#0EA5A4" stroke-width="4" stroke-linecap="round" />
                        <path d="M400 78C430 78 430 110 452 110" fill="none" stroke="#6E59D9" stroke-width="4" stroke-linecap="round" />
                        <path d="M400 202C430 202 430 110 452 110" fill="none" stroke="#0EA5A4" stroke-width="4" stroke-linecap="round" />
                        <text x="54" y="103" font-size="14" fill="#667085">Aggregate</text>
                        <text x="54" y="124" font-size="20" fill="#0F172A" data-testid="braid-aggregate">Request</text>
                        <text x="262" y="71" font-size="14" fill="#667085">Representation set</text>
                        <text x="262" y="92" font-size="18" fill="#0F172A" data-testid="braid-set">clinical_persistence</text>
                        <text x="262" y="114" font-size="12" fill="#667085" data-testid="braid-version">v1</text>
                        <text x="262" y="195" font-size="14" fill="#667085">Resources</text>
                        <text x="262" y="216" font-size="15" fill="#0F172A" data-testid="braid-resources">Task + 2 companions</text>
                        <text x="470" y="103" font-size="14" fill="#667085">Exchange bundle</text>
                        <text x="470" y="124" font-size="18" fill="#0F172A" data-testid="braid-bundle">none</text>
                      </svg>
                      <table data-testid="braid-parity-table">
                        <thead>
                          <tr><th>Tuple</th><th>Value</th></tr>
                        </thead>
                        <tbody id="braid-parity-body"></tbody>
                      </table>
                    </section>

                    <section class="subpanel" data-testid="policy-ledger">
                      <h2>Policy ledger</h2>
                      <div id="policy-ledger-body"></div>
                    </section>
                  </div>

                  <div class="bottom-grid">
                    <section class="subpanel">
                      <h2>Exchange bundle matrix</h2>
                      <table data-testid="bundle-matrix">
                        <thead>
                          <tr>
                            <th>Policy</th>
                            <th>Direction</th>
                            <th>Bundle types</th>
                            <th>Adapter profiles</th>
                          </tr>
                        </thead>
                        <tbody id="bundle-matrix-body"></tbody>
                      </table>
                    </section>
                    <section class="subpanel">
                      <h2>Defect strip</h2>
                      <div class="defect-strip" data-testid="defect-strip" id="defect-strip-body"></div>
                    </section>
                  </div>
                </section>

                <aside class="inspector-panel" data-testid="inspector"></aside>
              </main>
            </div>

            <script>
              const DATA_PATHS = {
                contracts: "../../data/analysis/fhir_representation_contracts.json",
                exchange: "../../data/analysis/fhir_exchange_bundle_policies.json",
                policies: "../../data/analysis/fhir_identifier_and_status_policies.json",
              };

              const state = {
                contractsPayload: null,
                exchangePayload: null,
                policyPayload: null,
                filters: {
                  aggregate: "all",
                  context: "all",
                  purpose: "all",
                  resource: "all",
                  defect: "all",
                },
                selectedContractId: null,
              };

              const lookup = {
                identifier: new Map(),
                status: new Map(),
                cardinality: new Map(),
                redaction: new Map(),
                companion: new Map(),
                replay: new Map(),
                supersession: new Map(),
                callback: new Map(),
                bundle: new Map(),
              };

              function setReducedMotionFlag() {
                const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
                document.body.dataset.reducedMotion = reducedMotion ? "true" : "false";
              }

              function buildLookups() {
                lookup.identifier = new Map(state.policyPayload.identifierPolicies.map((row) => [row.policyId, row]));
                lookup.status = new Map(state.policyPayload.statusMappingPolicies.map((row) => [row.policyId, row]));
                lookup.cardinality = new Map(state.policyPayload.cardinalityPolicies.map((row) => [row.policyId, row]));
                lookup.redaction = new Map(state.policyPayload.redactionPolicies.map((row) => [row.policyId, row]));
                lookup.companion = new Map(state.policyPayload.companionArtifactPolicies.map((row) => [row.policyId, row]));
                lookup.replay = new Map(state.policyPayload.replayPolicies.map((row) => [row.policyId, row]));
                lookup.supersession = new Map(state.policyPayload.supersessionPolicies.map((row) => [row.policyId, row]));
                lookup.callback = new Map(state.policyPayload.callbackCorrelationPolicies.map((row) => [row.policyId, row]));
                lookup.bundle = new Map(state.exchangePayload.policies.map((row) => [row.policyId, row]));
              }

              function uniqueValues(values) {
                return Array.from(new Set(values)).sort((left, right) => left.localeCompare(right));
              }

              function filteredContracts() {
                return state.contractsPayload.contracts.filter((row) => {
                  const matchesAggregate =
                    state.filters.aggregate === "all" || row.governingAggregateType === state.filters.aggregate;
                  const matchesContext =
                    state.filters.context === "all" || row.owningBoundedContextRef === state.filters.context;
                  const matchesPurpose =
                    state.filters.purpose === "all" || row.representationPurpose === state.filters.purpose;
                  const matchesResource =
                    state.filters.resource === "all" || row.allowedResourceTypes.includes(state.filters.resource);
                  const matchesDefect =
                    state.filters.defect === "all" || row.defectState === state.filters.defect;
                  return matchesAggregate && matchesContext && matchesPurpose && matchesResource && matchesDefect;
                });
              }

              function selectedContract() {
                const rows = filteredContracts();
                const selected = rows.find((row) => row.fhirRepresentationContractId === state.selectedContractId);
                return selected || rows[0] || null;
              }

              function updateMetrics() {
                document.querySelector("[data-testid='metric-contracts']").textContent =
                  String(state.contractsPayload.summary.active_contract_count);
                document.querySelector("[data-testid='metric-aggregates']").textContent =
                  String(state.contractsPayload.summary.mapped_aggregate_count);
                document.querySelector("[data-testid='metric-bundles']").textContent =
                  String(state.exchangePayload.summary.policy_count);
                document.querySelector("[data-testid='metric-blocked']").textContent =
                  String(state.policyPayload.summary.blocked_lifecycle_owner_count);
              }

              function renderFilters() {
                const contracts = state.contractsPayload.contracts;
                const options = {
                  context: uniqueValues(contracts.map((row) => row.owningBoundedContextRef)),
                  purpose: uniqueValues(contracts.map((row) => row.representationPurpose)),
                  resource: uniqueValues(contracts.flatMap((row) => row.allowedResourceTypes)),
                  defect: uniqueValues(contracts.map((row) => row.defectState)),
                };
                for (const [filterName, values] of Object.entries(options)) {
                  const select = document.getElementById(`filter-${filterName}`);
                  select.innerHTML = "";
                  const allOption = document.createElement("option");
                  allOption.value = "all";
                  allOption.textContent = "All";
                  select.appendChild(allOption);
                  values.forEach((value) => {
                    const option = document.createElement("option");
                    option.value = value;
                    option.textContent = value;
                    select.appendChild(option);
                  });
                  select.value = state.filters[filterName];
                  select.onchange = (event) => {
                    state.filters[filterName] = event.target.value;
                    rerender();
                  };
                }
              }

              function renderAggregateRail() {
                const counts = new Map();
                state.contractsPayload.contracts.forEach((row) => {
                  counts.set(row.governingAggregateType, (counts.get(row.governingAggregateType) || 0) + 1);
                });
                const container = document.querySelector("[data-testid='aggregate-button-list']");
                container.innerHTML = "";
                const allButton = document.createElement("button");
                allButton.type = "button";
                allButton.className = "aggregate-button";
                allButton.dataset.selected = state.filters.aggregate === "all" ? "true" : "false";
                allButton.textContent = "All aggregates";
                allButton.onclick = () => {
                  state.filters.aggregate = "all";
                  rerender();
                };
                container.appendChild(allButton);
                uniqueValues(Array.from(counts.keys())).forEach((aggregate) => {
                  const button = document.createElement("button");
                  button.type = "button";
                  button.className = "aggregate-button";
                  button.dataset.selected = state.filters.aggregate === aggregate ? "true" : "false";
                  button.dataset.testid = `aggregate-filter-${aggregate}`;
                  button.innerHTML = `<span>${aggregate}</span><span>${counts.get(aggregate)}</span>`;
                  button.onclick = () => {
                    state.filters.aggregate = aggregate;
                    rerender();
                  };
                  container.appendChild(button);
                });
              }

              function renderMappingTable() {
                const rows = filteredContracts();
                if (!rows.find((row) => row.fhirRepresentationContractId === state.selectedContractId)) {
                  state.selectedContractId = rows[0]?.fhirRepresentationContractId ?? null;
                }
                const body = document.querySelector("[data-testid='mapping-body']");
                body.innerHTML = "";
                if (!rows.length) {
                  const tr = document.createElement("tr");
                  const td = document.createElement("td");
                  td.colSpan = 5;
                  td.className = "empty-state";
                  td.textContent = "No contracts match the current filter tuple.";
                  tr.appendChild(td);
                  body.appendChild(tr);
                  return;
                }
                rows.forEach((row, index) => {
                  const tr = document.createElement("tr");
                  tr.tabIndex = 0;
                  tr.dataset.testid = `mapping-row-${row.fhirRepresentationContractId}`;
                  tr.dataset.selected = row.fhirRepresentationContractId === state.selectedContractId ? "true" : "false";
                  tr.dataset.rowIndex = String(index);
                  tr.innerHTML = `
                    <td><code>${row.governingAggregateType}</code><br /><span class="eyebrow">${row.owningBoundedContextRef}</span></td>
                    <td><span class="chip purpose-${row.representationPurpose}">${row.representationPurpose}</span></td>
                    <td>${row.allowedResourceTypes.map((value) => `<code>${value}</code>`).join("<br />")}</td>
                    <td>${(row.declaredBundlePolicyRefs.length ? row.declaredBundlePolicyRefs : ["none"]).map((value) => `<code>${value}</code>`).join("<br />")}</td>
                    <td><span class="chip defect-${row.defectState}">${row.defectState}</span></td>
                  `;
                  tr.onclick = () => {
                    state.selectedContractId = row.fhirRepresentationContractId;
                    rerender(false);
                  };
                  tr.onkeydown = (event) => handleRowKeydown(event, index, rows);
                  body.appendChild(tr);
                });
              }

              function handleRowKeydown(event, index, rows) {
                if (event.key !== "ArrowDown" && event.key !== "ArrowUp") {
                  return;
                }
                event.preventDefault();
                const delta = event.key === "ArrowDown" ? 1 : -1;
                const nextIndex = Math.min(Math.max(index + delta, 0), rows.length - 1);
                const next = rows[nextIndex];
                state.selectedContractId = next.fhirRepresentationContractId;
                rerender(false);
                const nextRow = document.querySelector(`[data-testid='mapping-row-${next.fhirRepresentationContractId}']`);
                nextRow?.focus();
              }

              function renderInspector() {
                const contract = selectedContract();
                const inspector = document.querySelector("[data-testid='inspector']");
                inspector.innerHTML = "";
                if (!contract) {
                  inspector.innerHTML = '<div class="empty-state">Select a contract to inspect its representation law.</div>';
                  return;
                }
                const bundlePolicies = contract.declaredBundlePolicyRefs.map((ref) => lookup.bundle.get(ref)).filter(Boolean);
                const groups = [
                  {
                    title: contract.fhirRepresentationContractId,
                    body: `
                      <div class="chip-row">
                        <span class="chip purpose-${contract.representationPurpose}">${contract.representationPurpose}</span>
                        <span class="chip defect-${contract.defectState}">${contract.defectState}</span>
                      </div>
                      <p><strong>Aggregate</strong><br /><code>${contract.governingAggregateType}</code></p>
                      <p><strong>Owning context</strong><br /><code>${contract.owningBoundedContextRef}</code></p>
                      <p><strong>Contract version</strong><br /><code>${contract.contractVersionRef}</code></p>
                      <p>${contract.rationale}</p>
                    `,
                  },
                  {
                    title: "Allowed resource types",
                    body: `<ul>${contract.resourceProfiles.map((row) => `<li><code>${row.resourceType}</code> <br /><code>${row.profileCanonicalUrl}</code></li>`).join("")}</ul>`,
                  },
                  {
                    title: "Policy bindings",
                    body: `
                      <ul>
                        <li><code>${contract.identifierPolicyRef}</code> - ${lookup.identifier.get(contract.identifierPolicyRef)?.label ?? ""}</li>
                        <li><code>${contract.statusMappingPolicyRef}</code> - ${lookup.status.get(contract.statusMappingPolicyRef)?.label ?? ""}</li>
                        <li><code>${contract.redactionPolicyRef}</code> - ${lookup.redaction.get(contract.redactionPolicyRef)?.label ?? ""}</li>
                        <li><code>${contract.replayPolicyRef}</code> - ${lookup.replay.get(contract.replayPolicyRef)?.label ?? ""}</li>
                        <li><code>${contract.supersessionPolicyRef}</code> - ${lookup.supersession.get(contract.supersessionPolicyRef)?.label ?? ""}</li>
                        <li><code>${contract.callbackCorrelationPolicyRef}</code> - ${lookup.callback.get(contract.callbackCorrelationPolicyRef)?.label ?? ""}</li>
                      </ul>
                    `,
                  },
                  {
                    title: "Trigger and evidence",
                    body: `
                      <p><strong>Trigger milestones</strong></p>
                      <ul>${contract.triggerMilestoneTypes.map((value) => `<li><code>${value}</code></li>`).join("")}</ul>
                      <p><strong>Required evidence</strong></p>
                      <ul>${contract.requiredEvidenceRefs.map((value) => `<li><code>${value}</code></li>`).join("")}</ul>
                    `,
                  },
                  {
                    title: "Bundle posture",
                    body: bundlePolicies.length
                      ? `<ul>${bundlePolicies.map((row) => `<li><code>${row.policyId}</code> - ${row.direction} / ${row.legalBundleTypes.join(", ")}</li>`).join("")}</ul>`
                      : "<p>No adapter-boundary bundle is legal for this contract.</p>",
                  },
                ];
                groups.forEach((group) => {
                  const section = document.createElement("section");
                  section.className = "inspector-group";
                  section.innerHTML = `<h2>${group.title}</h2>${group.body}`;
                  inspector.appendChild(section);
                });
              }

              function renderBraidDiagram() {
                const contract = selectedContract();
                if (!contract) {
                  return;
                }
                document.querySelector("[data-testid='braid-aggregate']").textContent = contract.governingAggregateType;
                document.querySelector("[data-testid='braid-set']").textContent = contract.representationPurpose;
                document.querySelector("[data-testid='braid-version']").textContent = contract.contractVersionRef;
                document.querySelector("[data-testid='braid-resources']").textContent = `${contract.allowedResourceTypes[0]} + ${Math.max(contract.allowedResourceTypes.length - 1, 0)} companions`;
                document.querySelector("[data-testid='braid-bundle']").textContent =
                  contract.declaredBundlePolicyRefs[0] ?? "none";

                const parityBody = document.getElementById("braid-parity-body");
                parityBody.innerHTML = "";
                [
                  ["Aggregate", contract.governingAggregateType],
                  ["Purpose", contract.representationPurpose],
                  ["Contract", contract.fhirRepresentationContractId],
                  ["Bundle", contract.declaredBundlePolicyRefs[0] ?? "none"],
                ].forEach(([label, value]) => {
                  const row = document.createElement("tr");
                  row.innerHTML = `<td>${label}</td><td><code>${value}</code></td>`;
                  parityBody.appendChild(row);
                });
              }

              function renderBundleMatrix() {
                const contract = selectedContract();
                const body = document.getElementById("bundle-matrix-body");
                body.innerHTML = "";
                if (!contract) {
                  return;
                }
                const bundlePolicies = contract.declaredBundlePolicyRefs.map((ref) => lookup.bundle.get(ref)).filter(Boolean);
                if (!bundlePolicies.length) {
                  body.innerHTML = '<tr><td colspan="4" class="empty-state">No adapter-boundary bundle policy for the selected contract.</td></tr>';
                  return;
                }
                bundlePolicies.forEach((row) => {
                  const tr = document.createElement("tr");
                  tr.dataset.testid = `bundle-row-${row.policyId}`;
                  tr.innerHTML = `
                    <td><code>${row.policyId}</code></td>
                    <td>${row.direction}</td>
                    <td>${row.legalBundleTypes.map((value) => `<code>${value}</code>`).join(", ")}</td>
                    <td>${row.adapterProfileRefs.map((value) => `<code>${value}</code>`).join("<br />")}</td>
                  `;
                  body.appendChild(tr);
                });
              }

              function renderPolicyLedger() {
                const contract = selectedContract();
                const container = document.getElementById("policy-ledger-body");
                container.innerHTML = "";
                if (!contract) {
                  return;
                }
                const cards = [
                  lookup.identifier.get(contract.identifierPolicyRef),
                  lookup.status.get(contract.statusMappingPolicyRef),
                  lookup.cardinality.get(contract.cardinalityPolicyRef),
                  lookup.redaction.get(contract.redactionPolicyRef),
                  lookup.companion.get(contract.companionArtifactPolicyRef),
                  lookup.replay.get(contract.replayPolicyRef),
                  lookup.supersession.get(contract.supersessionPolicyRef),
                  lookup.callback.get(contract.callbackCorrelationPolicyRef),
                ].filter(Boolean);
                cards.forEach((card) => {
                  const section = document.createElement("section");
                  section.className = "inspector-group";
                  section.dataset.testid = `policy-card-${card.policyId}`;
                  section.innerHTML = `<h2><code>${card.policyId}</code></h2><p>${card.description ?? card.label}</p>`;
                  container.appendChild(section);
                });
              }

              function renderDefectStrip() {
                const contract = selectedContract();
                const strip = document.getElementById("defect-strip-body");
                strip.innerHTML = "";
                state.policyPayload.prohibitedLifecycleOwners.forEach((row) => {
                  const card = document.createElement("article");
                  card.className = "defect-card";
                  card.dataset.testid = `defect-card-${row.objectType}`;
                  card.innerHTML = `<strong><code>${row.objectType}</code></strong><p>${row.blockedReason}</p>`;
                  strip.appendChild(card);
                });
                if (contract && contract.defectState === "watch") {
                  state.contractsPayload.assumptions.forEach((row) => {
                    const card = document.createElement("article");
                    card.className = "defect-card";
                    card.dataset.testid = `defect-card-${row.assumptionId}`;
                    card.innerHTML = `<strong><code>${row.assumptionId}</code></strong><p>${row.statement}</p>`;
                    strip.appendChild(card);
                  });
                }
              }

              function rerender(renderFiltersToo = true) {
                updateMetrics();
                if (renderFiltersToo) {
                  renderFilters();
                }
                renderAggregateRail();
                renderMappingTable();
                renderInspector();
                renderBraidDiagram();
                renderBundleMatrix();
                renderPolicyLedger();
                renderDefectStrip();
              }

              async function boot() {
                setReducedMotionFlag();
                const [contractsPayload, exchangePayload, policyPayload] = await Promise.all(
                  Object.values(DATA_PATHS).map((path) => fetch(path).then((response) => response.json())),
                );
                state.contractsPayload = contractsPayload;
                state.exchangePayload = exchangePayload;
                state.policyPayload = policyPayload;
                buildLookups();
                state.selectedContractId = contractsPayload.contracts[0]?.fhirRepresentationContractId ?? null;
                rerender(true);
              }

              boot().catch((error) => {
                const inspector = document.querySelector("[data-testid='inspector']");
                inspector.innerHTML = `<div class="empty-state">Failed to load atlas data: ${error.message}</div>`;
              });
            </script>
          </body>
        </html>
        """
    ).strip() + "\n"


def build_playwright_spec() -> str:
    return dedent(
        """
        import fs from "node:fs";
        import http from "node:http";
        import path from "node:path";
        import { fileURLToPath } from "node:url";

        const __filename = fileURLToPath(import.meta.url);
        const __dirname = path.dirname(__filename);
        const ROOT = path.resolve(__dirname, "..", "..");
        const HTML_PATH = path.join(ROOT, "docs", "architecture", "49_fhir_representation_atlas.html");
        const CONTRACT_PATH = path.join(ROOT, "data", "analysis", "fhir_representation_contracts.json");
        const EXCHANGE_PATH = path.join(ROOT, "data", "analysis", "fhir_exchange_bundle_policies.json");
        const POLICY_PATH = path.join(ROOT, "data", "analysis", "fhir_identifier_and_status_policies.json");

        const CONTRACT_PAYLOAD = JSON.parse(fs.readFileSync(CONTRACT_PATH, "utf8"));
        const EXCHANGE_PAYLOAD = JSON.parse(fs.readFileSync(EXCHANGE_PATH, "utf8"));
        const POLICY_PAYLOAD = JSON.parse(fs.readFileSync(POLICY_PATH, "utf8"));

        export const fhirRepresentationAtlasCoverage = [
          "aggregate filtering",
          "mapping-row selection",
          "inspector rendering",
          "bundle-policy visibility",
          "keyboard navigation",
          "responsive behavior",
          "reduced-motion handling",
        ];

        function assertCondition(condition, message) {
          if (!condition) {
            throw new Error(message);
          }
        }

        async function importPlaywright() {
          try {
            return await import("playwright");
          } catch {
            throw new Error("This spec needs the `playwright` package when run with --run.");
          }
        }

        function filteredContracts({
          aggregate = "all",
          context = "all",
          purpose = "all",
          resource = "all",
          defect = "all",
        }) {
          return CONTRACT_PAYLOAD.contracts.filter((row) => {
            return (
              (aggregate === "all" || row.governingAggregateType === aggregate) &&
              (context === "all" || row.owningBoundedContextRef === context) &&
              (purpose === "all" || row.representationPurpose === purpose) &&
              (resource === "all" || row.allowedResourceTypes.includes(resource)) &&
              (defect === "all" || row.defectState === defect)
            );
          });
        }

        function bundlePolicies(contractId) {
          const contract = CONTRACT_PAYLOAD.contracts.find(
            (row) => row.fhirRepresentationContractId === contractId,
          );
          return EXCHANGE_PAYLOAD.policies.filter((row) =>
            contract.declaredBundlePolicyRefs.includes(row.policyId),
          );
        }

        function startStaticServer() {
          return new Promise((resolve, reject) => {
            const rootDir = ROOT;
            const server = http.createServer((req, res) => {
              const rawUrl = req.url ?? "/";
              const urlPath =
                rawUrl === "/" ? "/docs/architecture/49_fhir_representation_atlas.html" : rawUrl.split("?")[0];
              const safePath = decodeURIComponent(urlPath).replace(/^\\/+/, "");
              const filePath = path.join(rootDir, safePath);
              if (!filePath.startsWith(rootDir) || !fs.existsSync(filePath)) {
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
            server.listen(4349, "127.0.0.1", () => resolve(server));
          });
        }

        async function run() {
          assertCondition(fs.existsSync(HTML_PATH), `Missing FHIR representation atlas HTML: ${HTML_PATH}`);
          const { chromium } = await importPlaywright();
          const server = await startStaticServer();
          const browser = await chromium.launch({ headless: true });
          const page = await browser.newPage({ viewport: { width: 1460, height: 1180 } });
          const url =
            process.env.FHIR_REPRESENTATION_ATLAS_URL ??
            "http://127.0.0.1:4349/docs/architecture/49_fhir_representation_atlas.html";

          try {
            await page.goto(url, { waitUntil: "networkidle" });
            await page.locator("[data-testid='mapping-table']").waitFor();
            await page.locator("[data-testid='bundle-matrix']").waitFor();
            await page.locator("[data-testid='inspector']").waitFor();

            const initialRows = await page.locator("[data-testid^='mapping-row-']").count();
            assertCondition(
              initialRows === CONTRACT_PAYLOAD.contracts.length,
              `Initial mapping-row parity drifted: expected ${CONTRACT_PAYLOAD.contracts.length}, found ${initialRows}`,
            );

            await page.locator("[data-testid='filter-purpose']").selectOption("external_interchange");
            await page.locator("[data-testid='filter-resource']").selectOption("ServiceRequest");
            await page.locator("[data-testid='filter-defect']").selectOption("active");
            const filtered = filteredContracts({
              purpose: "external_interchange",
              resource: "ServiceRequest",
              defect: "active",
            });
            const filteredRows = await page.locator("[data-testid^='mapping-row-']").count();
            assertCondition(
              filteredRows === filtered.length,
              `Purpose/resource filtering drifted: expected ${filtered.length}, found ${filteredRows}`,
            );

            const pharmacyAggregateButton = page
              .locator("[data-testid='aggregate-button-list'] .aggregate-button")
              .filter({ hasText: "PharmacyCase" })
              .first();
            await pharmacyAggregateButton.click();
            const pharmacyFiltered = filteredContracts({
              aggregate: "PharmacyCase",
              purpose: "external_interchange",
              resource: "ServiceRequest",
              defect: "active",
            });
            const pharmacyRows = await page.locator("[data-testid^='mapping-row-']").count();
            assertCondition(
              pharmacyRows === pharmacyFiltered.length,
              `Aggregate filtering drifted: expected ${pharmacyFiltered.length}, found ${pharmacyRows}`,
            );

            const targetId = "FRC_049_PHARMACY_CASE_EXTERNAL_INTERCHANGE_V1";
            await page.locator(`[data-testid='mapping-row-${targetId}'] td`).first().click();
            const inspectorText = await page.locator("[data-testid='inspector']").innerText();
            assertCondition(
              inspectorText.includes("PharmacyCase") &&
                inspectorText.includes("ServiceRequest") &&
                inspectorText.includes("DispatchProofEnvelope"),
              "Inspector lost expected pharmacy referral detail.",
            );

            const bundleRows = await page.locator("[data-testid^='bundle-row-']").count();
            assertCondition(
              bundleRows === bundlePolicies(targetId).length,
              `Bundle matrix drifted: expected ${bundlePolicies(targetId).length}, found ${bundleRows}`,
            );
            const bundleText = await page.locator("[data-testid='bundle-matrix']").innerText();
            assertCondition(
              bundleText.includes("ACP_049_PHARMACY_REFERRAL_TRANSPORT") &&
                bundleText.includes("message"),
              "Bundle matrix lost expected pharmacy transport policy detail.",
            );

            await page.locator("[data-testid='filter-purpose']").selectOption("all");
            await page.locator("[data-testid='filter-resource']").selectOption("all");
            await page
              .locator("[data-testid='aggregate-button-list'] .aggregate-button")
              .filter({ hasText: "Request" })
              .first()
              .click();
            const requestContracts = filteredContracts({ aggregate: "Request" });
            const firstRequest = requestContracts[0];
            const secondRequest = requestContracts[1];
            const firstRow = page.locator(`[data-testid='mapping-row-${firstRequest.fhirRepresentationContractId}']`);
            await firstRow.focus();
            await page.keyboard.press("ArrowDown");
            const secondSelected = await page
              .locator(`[data-testid='mapping-row-${secondRequest.fhirRepresentationContractId}']`)
              .getAttribute("data-selected");
            assertCondition(
              secondSelected === "true",
              "Arrow-down navigation no longer advances to the next mapping row.",
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
            assertCondition(
              landmarks >= 6,
              `Accessibility smoke failed: expected multiple landmarks, found ${landmarks}.`,
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

        export const fhirRepresentationAtlasManifest = {
          task: CONTRACT_PAYLOAD.task_id,
          contracts: CONTRACT_PAYLOAD.summary.active_contract_count,
          bundles: EXCHANGE_PAYLOAD.summary.policy_count,
          blocked: POLICY_PAYLOAD.summary.blocked_lifecycle_owner_count,
        };
        """
    ).strip() + "\n"


def update_root_package() -> None:
    package = read_json(ROOT_PACKAGE_PATH)
    scripts = package.setdefault("scripts", {})
    scripts.update(ROOT_SCRIPT_UPDATES)
    write_json(ROOT_PACKAGE_PATH, package)


def update_playwright_package() -> None:
    package = read_json(PLAYWRIGHT_PACKAGE_PATH)
    package["description"] = (
        "Foundation, runtime topology, gateway, event, FHIR, frontend manifest, release parity, "
        "design contract, and audit ledger browser checks."
    )
    package["scripts"] = PLAYWRIGHT_SCRIPT_UPDATES
    write_json(PLAYWRIGHT_PACKAGE_PATH, package)


def build_package_contract_artifacts(
    contract_payload: dict[str, Any],
    exchange_payload: dict[str, Any],
    policy_payload: dict[str, Any],
) -> None:
    catalog = build_contract_catalog(contract_payload, exchange_payload, policy_payload)
    write_json(PACKAGE_CONTRACTS_PATH, contract_payload)
    write_json(PACKAGE_EXCHANGE_PATH, exchange_payload)
    write_json(PACKAGE_POLICY_PATH, policy_payload)
    write_json(CATALOG_PATH, catalog)
    write_text(CONTRACT_README_PATH, build_contract_readme(contract_payload, exchange_payload, policy_payload))


def main() -> None:
    context = load_context()
    contracts = build_contract_rows(context)
    set_policies = build_representation_set_policies(contracts)
    mapping_rows = build_mapping_rows(contracts)
    contract_payload = build_contract_payload(contracts, set_policies, mapping_rows)
    exchange_payload = build_exchange_payload()
    policy_payload = build_policy_payload()

    fieldnames = [
        "mappingRowId",
        "fhirRepresentationContractId",
        "owningBoundedContextRef",
        "governingAggregateType",
        "representationPurpose",
        "resourceType",
        "profileCanonicalUrl",
        "identifierPolicyRef",
        "statusMappingPolicyRef",
        "cardinalityPolicyRef",
        "redactionPolicyRef",
        "companionArtifactPolicyRef",
        "replayPolicyRef",
        "supersessionPolicyRef",
        "callbackCorrelationPolicyRef",
        "exchangeBundlePolicyRef",
        "materializationDisposition",
        "defectState",
        "rationale",
    ]

    write_json(CONTRACTS_PATH, contract_payload)
    write_csv(MAPPING_MATRIX_PATH, mapping_rows, fieldnames)
    write_json(EXCHANGE_POLICY_PATH, exchange_payload)
    write_json(IDENTIFIER_POLICY_PATH, policy_payload)
    write_text(STRATEGY_DOC_PATH, build_strategy_doc(contract_payload, exchange_payload, policy_payload))
    write_text(CATALOG_DOC_PATH, build_catalog_doc(contract_payload))
    write_text(MATRIX_DOC_PATH, build_matrix_doc(mapping_rows, exchange_payload))
    write_text(ATLAS_PATH, build_atlas_html())
    build_package_contract_artifacts(contract_payload, exchange_payload, policy_payload)
    write_text(PACKAGE_SOURCE_PATH, build_package_source(contract_payload, exchange_payload, policy_payload))
    write_text(PACKAGE_TEST_PATH, build_package_test())
    write_text(PACKAGE_README_PATH, build_package_readme(contract_payload, exchange_payload, policy_payload))
    write_text(SPEC_PATH, build_playwright_spec())
    update_root_package()
    update_playwright_package()
    print(
        "seq_049 FHIR representation artifacts generated: "
        f"{contract_payload['summary']['active_contract_count']} contracts, "
        f"{exchange_payload['summary']['policy_count']} bundle policies, "
        f"{policy_payload['summary']['blocked_lifecycle_owner_count']} blocked lifecycle owners."
    )


if __name__ == "__main__":
    main()
