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
DATA_DIR = ROOT / "data" / "analysis"
DOCS_DIR = ROOT / "docs" / "architecture"
TESTS_DIR = ROOT / "tests" / "playwright"
PACKAGE_DIR = ROOT / "packages" / "api-contracts"
PACKAGE_SCHEMA_DIR = PACKAGE_DIR / "schemas"
PACKAGE_SOURCE_PATH = PACKAGE_DIR / "src" / "index.ts"
PACKAGE_TEST_PATH = PACKAGE_DIR / "tests" / "public-api.test.ts"
PACKAGE_PACKAGE_JSON_PATH = PACKAGE_DIR / "package.json"

ROUTE_FAMILY_PATH = DATA_DIR / "route_family_inventory.csv"
ROUTE_SCOPE_PATH = DATA_DIR / "route_to_scope_requirements.csv"
GATEWAY_MATRIX_PATH = DATA_DIR / "gateway_route_family_matrix.csv"
FRONTEND_MANIFEST_PATH = DATA_DIR / "frontend_contract_manifests.json"
RELEASE_PARITY_PATH = DATA_DIR / "release_publication_parity_rules.json"
TENANT_SCOPE_PATH = DATA_DIR / "tenant_isolation_modes.json"
EVENT_REGISTRY_PATH = DATA_DIR / "canonical_event_contracts.json"
LIFECYCLE_TAXONOMY_PATH = DATA_DIR / "closure_blocker_taxonomy.json"

ROUTE_INTENT_SCHEMA_PATH = DATA_DIR / "route_intent_binding_schema.json"
DECISION_TABLE_PATH = DATA_DIR / "scoped_mutation_gate_decision_table.csv"
ACTION_SCOPE_MATRIX_PATH = DATA_DIR / "action_scope_to_governing_object_matrix.csv"
SETTLEMENT_MATRIX_PATH = DATA_DIR / "command_settlement_result_matrix.csv"
RECOVERY_MATRIX_PATH = DATA_DIR / "mutation_recovery_and_freeze_matrix.csv"

STRATEGY_DOC_PATH = DOCS_DIR / "56_scoped_mutation_gate_strategy.md"
ROUTE_INTENT_DOC_PATH = DOCS_DIR / "56_route_intent_binding_contract.md"
SETTLEMENT_DOC_PATH = DOCS_DIR / "56_command_settlement_and_same_shell_recovery_rules.md"
ACTION_SCOPE_DOC_PATH = DOCS_DIR / "56_action_scope_and_governing_object_matrix.md"
ROUTE_AUTHORITY_DOC_PATH = DOCS_DIR / "56_route_authority_and_runtime_tuple_matrix.md"
LAB_PATH = DOCS_DIR / "56_scoped_mutation_gate_lab.html"

PACKAGE_ROUTE_INTENT_SCHEMA_PATH = PACKAGE_SCHEMA_DIR / "route-intent-binding.schema.json"
PACKAGE_SETTLEMENT_SCHEMA_PATH = PACKAGE_SCHEMA_DIR / "command-settlement-record.schema.json"

VALIDATOR_PATH = ROOT / "tools" / "analysis" / "validate_scoped_mutation_gate.py"
SPEC_PATH = TESTS_DIR / "scoped-mutation-gate-lab.spec.js"
ROOT_PACKAGE_PATH = ROOT / "package.json"
PLAYWRIGHT_PACKAGE_PATH = TESTS_DIR / "package.json"
ENGINEERING_BUILDER_PATH = ROOT / "tools" / "analysis" / "build_engineering_standards.py"

PACKAGE_EXPORTS_START = "// seq_056_scoped_mutation_gate_exports:start"
PACKAGE_EXPORTS_END = "// seq_056_scoped_mutation_gate_exports:end"

TASK_ID = "seq_056"
VISUAL_MODE = "Mutation_Intent_Lab"
TIMESTAMP = datetime.now(timezone.utc).replace(microsecond=0).isoformat()
CAPTURED_ON = TIMESTAMP[:10]
MISSION = (
    "Define the canonical post-submit mutation law so every writable Vecells route resolves one "
    "exact route-intent tuple, validates one current acting scope and runtime publication tuple, "
    "writes immutable command ledgers, and degrades through governed same-shell recovery instead "
    "of controller-local optimism."
)

SOURCE_PRECEDENCE = [
    "prompt/056.md",
    "prompt/shared_operating_contract_056_to_065.md",
    "prompt/AGENT.md",
    "prompt/checklist.md",
    "blueprint/phase-0-the-foundation-protocol.md#1.21 RouteIntentBinding",
    "blueprint/phase-0-the-foundation-protocol.md#1.22 CommandActionRecord",
    "blueprint/phase-0-the-foundation-protocol.md#1.23 CommandSettlementRecord",
    "blueprint/phase-0-the-foundation-protocol.md#2.8 ScopedMutationGate",
    "blueprint/phase-0-the-foundation-protocol.md#6.6 Scoped mutation gate",
    "blueprint/phase-0-the-foundation-protocol.md#Non-negotiable invariants",
    "blueprint/phase-2-identity-and-echoes.md#Continuation authority and claim law",
    "blueprint/platform-runtime-and-release-blueprint.md#AudienceSurfaceRuntimeBinding",
    "blueprint/platform-runtime-and-release-blueprint.md#ReleaseRecoveryDisposition",
    "blueprint/platform-runtime-and-release-blueprint.md#MutationCommandContract",
    "blueprint/platform-frontend-blueprint.md#Typed patient transaction route contract",
    "blueprint/platform-frontend-blueprint.md#WritableEligibilityFence",
    "blueprint/patient-account-and-communications-blueprint.md#Patient action settlement contract",
    "blueprint/callback-and-clinician-messaging-loop.md#Mutation and settlement law",
    "blueprint/staff-operations-and-support-blueprint.md#Support mutation contract",
    "blueprint/forensic-audit-findings.md#Finding 91",
    "blueprint/forensic-audit-findings.md#Finding 95",
    "docs/architecture/04_persona_channel_inventory.md",
    "docs/architecture/05_request_lineage_model.md",
    "docs/architecture/07_state_machine_atlas.md",
    "data/analysis/runtime_topology_manifest.json",
    "data/analysis/gateway_bff_surfaces.json",
    "data/analysis/frontend_contract_manifests.json",
    "data/analysis/release_publication_parity_rules.json",
    "data/analysis/tenant_isolation_modes.json",
    "data/analysis/closure_blocker_taxonomy.json",
]

ROOT_SCRIPT_UPDATES = {
    "bootstrap": (
        "pnpm install && node ./tools/dev-bootstrap/index.mjs && pnpm codegen && "
        "pnpm validate:topology && pnpm validate:runtime-topology && pnpm validate:gateway-surface && "
        "pnpm validate:events && pnpm validate:fhir && pnpm validate:frontend && "
        "pnpm validate:release-parity && pnpm validate:design-publication && pnpm validate:audit-worm && "
        "pnpm validate:tenant-scope && pnpm validate:lifecycle && pnpm validate:mutation-gate && "
        "pnpm validate:scaffold && pnpm validate:services && pnpm validate:domains && pnpm validate:standards"
    ),
    "check": (
        "pnpm lint && pnpm format:check && pnpm typecheck && pnpm test && "
        "pnpm validate:topology && pnpm validate:runtime-topology && pnpm validate:gateway-surface && "
        "pnpm validate:events && pnpm validate:fhir && pnpm validate:frontend && "
        "pnpm validate:release-parity && pnpm validate:design-publication && pnpm validate:audit-worm && "
        "pnpm validate:tenant-scope && pnpm validate:lifecycle && pnpm validate:mutation-gate && "
        "pnpm validate:scaffold && pnpm validate:services && pnpm validate:domains && pnpm validate:standards"
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
        "python3 ./tools/analysis/build_engineering_standards.py && pnpm format"
    ),
    "validate:mutation-gate": "python3 ./tools/analysis/validate_scoped_mutation_gate.py",
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
        "node --check scoped-mutation-gate-lab.spec.js"
    ),
    "lint": (
        "eslint foundation-shell-gallery.spec.js runtime-topology-atlas.spec.js "
        "gateway-surface-studio.spec.js event-registry-studio.spec.js "
        "fhir-representation-atlas.spec.js frontend-contract-studio.spec.js "
        "release-parity-cockpit.spec.js design-contract-studio.spec.js "
        "audit-ledger-explorer.spec.js scope-isolation-atlas.spec.js "
        "lifecycle-coordinator-lab.spec.js scoped-mutation-gate-lab.spec.js"
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
        "node scoped-mutation-gate-lab.spec.js"
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
        "node --check scoped-mutation-gate-lab.spec.js"
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
        "node scoped-mutation-gate-lab.spec.js --run"
    ),
}

PATIENT_ACTING_SCOPE_REQUIREMENT_REF = "ASTR_056_PATIENT_SUBJECT_BOUND_V1"
PATIENT_ACTING_SCOPE_REQUIREMENT_LABEL = "patient_subject_bound_session"
RELEASE_APPROVAL_FREEZE_REF = "RAF_PROD_V1"
CHANNEL_FREEZE_VALIDATION = "channel_freeze_state_monitoring_or_released"
PARITY_VALIDATION = "release_publication_parity_exact"
LINEAGE_EPOCH_VALIDATION = "LineageFence.currentEpoch"
AUTHORITATIVE_RECONSTRUCTION_FORBIDDEN = (
    "url_params;cached_projection_fragment;detached_cta_state;browser_history_state"
)
AMBIGUOUS_TARGET_DISPOSITION = "same_shell_disambiguation_or_reissue"
DECISION_TABLE_COLUMNS = [
    "routeIntentId",
    "audienceSurface",
    "shellType",
    "routeFamily",
    "actionScope",
    "governingObjectType",
    "governingObjectRef",
    "canonicalObjectDescriptorRef",
    "governingBoundedContextRef",
    "governingObjectVersionRef",
    "lineageScope",
    "requiredContextBoundaryRefs",
    "parentAnchorRef",
    "subjectRef",
    "grantFamily",
    "sessionEpochRef",
    "subjectBindingVersionRef",
    "actingScopeTupleRequirementRef",
    "audienceSurfaceRuntimeBindingRef",
    "releaseApprovalFreezeRef",
    "channelReleaseFreezeState",
    "requiredAssuranceSliceTrustRefs",
    "routeContractDigestRef",
    "routeIntentTupleHash",
    "bindingState",
    "staleDisposition",
    "recoveryEnvelopeFamily",
    "publishedMutationCommandContractRef",
    "publishedRouteIntentBindingRequirementRef",
    "publishedRuntimeBindingState",
    "currentPublishedBrowserPosture",
    "requiredGrantFamily",
    "requiredActingContext",
    "requiredActingScopeTuple",
    "requiredLineageFenceEpoch",
    "requiredSafetyEpochValidation",
    "requiredReachabilityValidation",
    "requiredRuntimePublicationBinding",
    "requiredReleaseFreezeValidation",
    "requiredChannelFreezeValidation",
    "requiredParityValidation",
    "allowedCommandSettlementResults",
    "declinedScopeDisposition",
    "staleRecoverableDisposition",
    "sameShellRecoveryEnvelopeRef",
    "mustWriteCommandActionRecord",
    "mustWriteCommandSettlementRecord",
    "authorityReconstructionForbiddenFrom",
    "ambiguousTargetDisposition",
    "partialTupleDisposition",
    "source_refs",
    "rationale",
]

ACTION_SCOPE_ROWS = [
    {
        "route_intent_id": "RIB_056_PATIENT_CLAIM_CURRENT_V1",
        "route_family_ref": "rf_patient_secure_link_recovery",
        "action_scope": "claim",
        "governing_object_type": "Request",
        "governing_object_ref": "request://current-claim-target",
        "canonical_object_descriptor_ref": "COD_056_REQUEST_V1",
        "governing_bounded_context_ref": "identity_access",
        "governing_object_version_ref": "requestVersion://claim/current",
        "lineage_scope": "request_lineage",
        "parent_anchor_ref": "anchor://request-claim/current",
        "subject_ref": "subject://patient/current",
        "grant_family": "transaction_action_minimal",
        "session_epoch_ref": "sessionEpoch://grant-scoped/current",
        "subject_binding_version_ref": "subjectBindingVersion://claim/current",
        "acting_scope_tuple_requirement_ref": PATIENT_ACTING_SCOPE_REQUIREMENT_REF,
        "required_acting_context": "patient_claim_recovery_session",
        "required_acting_scope_tuple": "not_required_patient_subject_session",
        "binding_state": "live",
        "stale_disposition": "same_shell_claim_rebind",
        "recovery_envelope_family": "RecoveryEnvelope::claim-rebind",
        "required_assurance_slice_trust_refs": ["asr_runtime_topology_tuple", "RTFV_PROD_PATIENT_RECOVERY_V1"],
        "required_safety_epoch_validation": "current_request_safety_epoch",
        "required_reachability_validation": "not_required",
        "allowed_command_settlement_results": [
            "pending",
            "applied",
            "stale_recoverable",
            "denied_scope",
            "expired",
        ],
        "declined_scope_disposition": "same_shell_scope_denied",
        "stale_recoverable_disposition": "same_shell_claim_reissue",
        "same_shell_recovery_envelope_ref": "RecoveryEnvelope::claim-rebind",
        "partial_tuple_disposition": "reissue_only",
        "source_refs": [
            "prompt/056.md",
            "blueprint/phase-0-the-foundation-protocol.md#1.21 RouteIntentBinding",
            "blueprint/phase-2-identity-and-echoes.md#Continuation authority and claim law",
            "blueprint/patient-account-and-communications-blueprint.md#Patient action recovery contract",
        ],
        "rationale": "Claim and continuation routes must bind the current request target tuple before they can widen from claim-pending or recovery posture into writable detail.",
    },
    {
        "route_intent_id": "RIB_056_PATIENT_CLAIM_LEGACY_PARTIAL_V1",
        "route_family_ref": "rf_patient_secure_link_recovery",
        "action_scope": "claim",
        "governing_object_type": "Request",
        "governing_object_ref": "request://current-claim-target",
        "canonical_object_descriptor_ref": "COD_056_REQUEST_V1",
        "governing_bounded_context_ref": "identity_access",
        "governing_object_version_ref": "requestVersion://claim/current",
        "lineage_scope": "request_lineage",
        "parent_anchor_ref": "anchor://request-claim/current",
        "subject_ref": "subject://patient/current",
        "grant_family": "transaction_action_minimal",
        "session_epoch_ref": "sessionEpoch://grant-scoped/current",
        "subject_binding_version_ref": "subjectBindingVersion://claim/current",
        "acting_scope_tuple_requirement_ref": PATIENT_ACTING_SCOPE_REQUIREMENT_REF,
        "required_acting_context": "patient_claim_recovery_session",
        "required_acting_scope_tuple": "not_required_patient_subject_session",
        "binding_state": "recovery_only",
        "stale_disposition": "same_shell_reissue_live_claim_binding",
        "recovery_envelope_family": "RecoveryEnvelope::claim-reissue",
        "required_assurance_slice_trust_refs": ["asr_runtime_topology_tuple", "RTFV_PROD_PATIENT_RECOVERY_V1"],
        "required_safety_epoch_validation": "current_request_safety_epoch",
        "required_reachability_validation": "not_required",
        "allowed_command_settlement_results": ["stale_recoverable", "denied_scope", "expired"],
        "declined_scope_disposition": "same_shell_scope_denied",
        "stale_recoverable_disposition": "same_shell_claim_reissue",
        "same_shell_recovery_envelope_ref": "RecoveryEnvelope::claim-reissue",
        "partial_tuple_disposition": "recovery_only",
        "source_refs": [
            "prompt/056.md",
            "blueprint/phase-0-the-foundation-protocol.md#1.21 RouteIntentBinding",
            "blueprint/phase-2-identity-and-echoes.md#Continuation authority and claim law",
        ],
        "rationale": "Legacy or partial claim bindings stay same-shell visible but may not expose writable claim completion until a fresh full tuple is reissued.",
    },
    {
        "route_intent_id": "RIB_056_PATIENT_MORE_INFO_REPLY_V1",
        "route_family_ref": "rf_patient_secure_link_recovery",
        "action_scope": "respond_more_info",
        "governing_object_type": "MoreInfoCycle",
        "governing_object_ref": "moreInfoCycle://current",
        "canonical_object_descriptor_ref": "COD_056_MORE_INFO_CYCLE_V1",
        "governing_bounded_context_ref": "communication",
        "governing_object_version_ref": "moreInfoCycleVersion://current",
        "lineage_scope": "request_lineage",
        "parent_anchor_ref": "anchor://more-info-cycle/current",
        "subject_ref": "subject://patient/current",
        "grant_family": "transaction_action_minimal",
        "session_epoch_ref": "sessionEpoch://grant-scoped/current",
        "subject_binding_version_ref": "subjectBindingVersion://patient/current",
        "acting_scope_tuple_requirement_ref": PATIENT_ACTING_SCOPE_REQUIREMENT_REF,
        "required_acting_context": "patient_secure_link_recovery_session",
        "required_acting_scope_tuple": "not_required_patient_subject_session",
        "binding_state": "live",
        "stale_disposition": "same_shell_reply_window_rebind",
        "recovery_envelope_family": "RecoveryEnvelope::more-info-rebind",
        "required_assurance_slice_trust_refs": ["asr_runtime_topology_tuple", "RTFV_PROD_PATIENT_RECOVERY_V1"],
        "required_safety_epoch_validation": "current_request_safety_epoch",
        "required_reachability_validation": "current_more_info_reachability_or_contact_repair_clear",
        "allowed_command_settlement_results": [
            "applied",
            "review_required",
            "stale_recoverable",
            "blocked_policy",
            "expired",
        ],
        "declined_scope_disposition": "same_shell_reply_window_denied",
        "stale_recoverable_disposition": "same_shell_reply_window_rebind",
        "same_shell_recovery_envelope_ref": "RecoveryEnvelope::more-info-rebind",
        "partial_tuple_disposition": "recovery_only_when_checkpoint_or_tuple_drifted",
        "source_refs": [
            "prompt/056.md",
            "blueprint/phase-0-the-foundation-protocol.md#6.5A More-info reply-window and late-response contract",
            "blueprint/patient-account-and-communications-blueprint.md#Patient contact repair projection",
        ],
        "rationale": "More-info replies stay bound to the current cycle, reply window checkpoint, reachability epoch, and request lineage instead of relying on link TTL or copied email text.",
    },
    {
        "route_intent_id": "RIB_056_PATIENT_MESSAGE_REPLY_V1",
        "route_family_ref": "rf_patient_messages",
        "action_scope": "reply_message",
        "governing_object_type": "ClinicianMessageThread",
        "governing_object_ref": "messageThread://current",
        "canonical_object_descriptor_ref": "COD_056_MESSAGE_THREAD_V1",
        "governing_bounded_context_ref": "communication",
        "governing_object_version_ref": "messageThreadVersion://current",
        "lineage_scope": "conversation_lineage",
        "parent_anchor_ref": "anchor://message-thread/current",
        "subject_ref": "subject://patient/current",
        "grant_family": "patient_session_claimed",
        "session_epoch_ref": "sessionEpoch://patient/current",
        "subject_binding_version_ref": "subjectBindingVersion://patient/current",
        "acting_scope_tuple_requirement_ref": PATIENT_ACTING_SCOPE_REQUIREMENT_REF,
        "required_acting_context": "patient_authenticated_session",
        "required_acting_scope_tuple": "not_required_patient_subject_session",
        "binding_state": "live",
        "stale_disposition": "same_shell_conversation_refresh",
        "recovery_envelope_family": "RecoveryEnvelope::conversation-rebind",
        "required_assurance_slice_trust_refs": ["asr_runtime_topology_tuple", "RTFV_PROD_PATIENT_LIVE_V1"],
        "required_safety_epoch_validation": "current_request_safety_epoch",
        "required_reachability_validation": "current_message_reply_route_clear",
        "allowed_command_settlement_results": [
            "pending",
            "awaiting_external",
            "applied",
            "review_required",
            "stale_recoverable",
            "blocked_policy",
        ],
        "declined_scope_disposition": "same_shell_scope_denied",
        "stale_recoverable_disposition": "same_shell_conversation_refresh",
        "same_shell_recovery_envelope_ref": "RecoveryEnvelope::conversation-rebind",
        "partial_tuple_disposition": "recovery_only_when_thread_or_anchor_drifted",
        "source_refs": [
            "prompt/056.md",
            "blueprint/callback-and-clinician-messaging-loop.md#Mutation and settlement law",
            "blueprint/patient-account-and-communications-blueprint.md#Patient action settlement contract",
        ],
        "rationale": "Message reply flows must preserve the current thread tuple, reachability authority, and settlement chain instead of inferring actionability from visible composer state alone.",
    },
    {
        "route_intent_id": "RIB_056_PATIENT_MESSAGE_REPLY_SUPERSEDED_V1",
        "route_family_ref": "rf_patient_messages",
        "action_scope": "reply_message",
        "governing_object_type": "ClinicianMessageThread",
        "governing_object_ref": "messageThread://superseded",
        "canonical_object_descriptor_ref": "COD_056_MESSAGE_THREAD_V1",
        "governing_bounded_context_ref": "communication",
        "governing_object_version_ref": "messageThreadVersion://superseded",
        "lineage_scope": "conversation_lineage",
        "parent_anchor_ref": "anchor://message-thread/current",
        "subject_ref": "subject://patient/current",
        "grant_family": "patient_session_claimed",
        "session_epoch_ref": "sessionEpoch://patient/current",
        "subject_binding_version_ref": "subjectBindingVersion://patient/current",
        "acting_scope_tuple_requirement_ref": PATIENT_ACTING_SCOPE_REQUIREMENT_REF,
        "required_acting_context": "patient_authenticated_session",
        "required_acting_scope_tuple": "not_required_patient_subject_session",
        "binding_state": "superseded",
        "stale_disposition": "same_shell_resume_latest_thread",
        "recovery_envelope_family": "RecoveryEnvelope::conversation-superseded",
        "required_assurance_slice_trust_refs": ["asr_runtime_topology_tuple", "RTFV_PROD_PATIENT_LIVE_V1"],
        "required_safety_epoch_validation": "current_request_safety_epoch",
        "required_reachability_validation": "current_message_reply_route_clear",
        "allowed_command_settlement_results": ["stale_recoverable", "denied_scope", "expired"],
        "declined_scope_disposition": "same_shell_scope_denied",
        "stale_recoverable_disposition": "same_shell_resume_latest_thread",
        "same_shell_recovery_envelope_ref": "RecoveryEnvelope::conversation-superseded",
        "partial_tuple_disposition": "recovery_only_when_superseded",
        "source_refs": [
            "prompt/056.md",
            "blueprint/callback-and-clinician-messaging-loop.md#Mutation and settlement law",
            "blueprint/platform-frontend-blueprint.md#SelectedAnchorPolicy",
        ],
        "rationale": "Superseded thread bindings must fail closed into same-shell resume or disambiguation instead of letting an old composer send on a stale thread tuple.",
    },
    {
        "route_intent_id": "RIB_056_PATIENT_CALLBACK_RESPONSE_V1",
        "route_family_ref": "rf_patient_messages",
        "action_scope": "respond_callback",
        "governing_object_type": "CallbackCase",
        "governing_object_ref": "callbackCase://current",
        "canonical_object_descriptor_ref": "COD_056_CALLBACK_CASE_V1",
        "governing_bounded_context_ref": "communication",
        "governing_object_version_ref": "callbackCaseVersion://current",
        "lineage_scope": "conversation_lineage",
        "parent_anchor_ref": "anchor://callback-cluster/current",
        "subject_ref": "subject://patient/current",
        "grant_family": "patient_session_claimed",
        "session_epoch_ref": "sessionEpoch://patient/current",
        "subject_binding_version_ref": "subjectBindingVersion://patient/current",
        "acting_scope_tuple_requirement_ref": PATIENT_ACTING_SCOPE_REQUIREMENT_REF,
        "required_acting_context": "patient_authenticated_session",
        "required_acting_scope_tuple": "not_required_patient_subject_session",
        "binding_state": "live",
        "stale_disposition": "same_shell_callback_refresh",
        "recovery_envelope_family": "RecoveryEnvelope::callback-rebind",
        "required_assurance_slice_trust_refs": ["asr_runtime_topology_tuple", "RTFV_PROD_PATIENT_LIVE_V1"],
        "required_safety_epoch_validation": "current_request_safety_epoch",
        "required_reachability_validation": "current_callback_route_clear",
        "allowed_command_settlement_results": [
            "pending",
            "awaiting_external",
            "applied",
            "reconciliation_required",
            "stale_recoverable",
            "blocked_policy",
        ],
        "declined_scope_disposition": "same_shell_scope_denied",
        "stale_recoverable_disposition": "same_shell_callback_refresh",
        "same_shell_recovery_envelope_ref": "RecoveryEnvelope::callback-rebind",
        "partial_tuple_disposition": "recovery_only_when_callback_anchor_drifted",
        "source_refs": [
            "prompt/056.md",
            "blueprint/callback-and-clinician-messaging-loop.md#Mutation and settlement law",
            "blueprint/patient-account-and-communications-blueprint.md#Patient action recovery contract",
        ],
        "rationale": "Callback response paths depend on the current callback case, reachability truth, and settlement chain rather than on list-row state or recent delivery observations.",
    },
    {
        "route_intent_id": "RIB_056_PATIENT_MANAGE_BOOKING_V1",
        "route_family_ref": "rf_patient_appointments",
        "action_scope": "manage_booking",
        "governing_object_type": "BookingCase",
        "governing_object_ref": "bookingCase://current",
        "canonical_object_descriptor_ref": "COD_056_BOOKING_CASE_V1",
        "governing_bounded_context_ref": "booking",
        "governing_object_version_ref": "bookingCaseVersion://current",
        "lineage_scope": "request_lineage",
        "parent_anchor_ref": "anchor://appointment/current",
        "subject_ref": "subject://patient/current",
        "grant_family": "patient_session_claimed",
        "session_epoch_ref": "sessionEpoch://patient/current",
        "subject_binding_version_ref": "subjectBindingVersion://patient/current",
        "acting_scope_tuple_requirement_ref": PATIENT_ACTING_SCOPE_REQUIREMENT_REF,
        "required_acting_context": "patient_authenticated_session",
        "required_acting_scope_tuple": "not_required_patient_subject_session",
        "binding_state": "live",
        "stale_disposition": "same_shell_booking_refresh",
        "recovery_envelope_family": "RecoveryEnvelope::booking-manage",
        "required_assurance_slice_trust_refs": ["asr_runtime_topology_tuple", "RTFV_PROD_PATIENT_LIVE_V1"],
        "required_safety_epoch_validation": "current_request_safety_epoch",
        "required_reachability_validation": "not_required",
        "allowed_command_settlement_results": [
            "pending",
            "awaiting_external",
            "applied",
            "review_required",
            "reconciliation_required",
            "stale_recoverable",
            "blocked_policy",
        ],
        "declined_scope_disposition": "same_shell_scope_denied",
        "stale_recoverable_disposition": "same_shell_booking_refresh",
        "same_shell_recovery_envelope_ref": "RecoveryEnvelope::booking-manage",
        "partial_tuple_disposition": "recovery_only_when_slot_or_booking_tuple_drifted",
        "source_refs": [
            "prompt/056.md",
            "blueprint/phase-4-the-booking-engine.md#Booking continuity evidence projection",
            "blueprint/patient-account-and-communications-blueprint.md#Patient action settlement contract",
        ],
        "rationale": "Booking manage actions must bind the current booking case and governing version so stale appointment rows cannot mutate a superseded booking target.",
    },
    {
        "route_intent_id": "RIB_056_PATIENT_WAITLIST_ACCEPT_V1",
        "route_family_ref": "rf_patient_appointments",
        "action_scope": "accept_waitlist_offer",
        "governing_object_type": "WaitlistOffer",
        "governing_object_ref": "waitlistOffer://current",
        "canonical_object_descriptor_ref": "COD_056_WAITLIST_OFFER_V1",
        "governing_bounded_context_ref": "booking",
        "governing_object_version_ref": "waitlistOfferVersion://current",
        "lineage_scope": "request_lineage",
        "parent_anchor_ref": "anchor://waitlist-offer/current",
        "subject_ref": "subject://patient/current",
        "grant_family": "patient_session_claimed",
        "session_epoch_ref": "sessionEpoch://patient/current",
        "subject_binding_version_ref": "subjectBindingVersion://patient/current",
        "acting_scope_tuple_requirement_ref": PATIENT_ACTING_SCOPE_REQUIREMENT_REF,
        "required_acting_context": "patient_authenticated_session",
        "required_acting_scope_tuple": "not_required_patient_subject_session",
        "binding_state": "live",
        "stale_disposition": "same_shell_waitlist_refresh",
        "recovery_envelope_family": "RecoveryEnvelope::waitlist-accept",
        "required_assurance_slice_trust_refs": ["asr_runtime_topology_tuple", "RTFV_PROD_PATIENT_LIVE_V1"],
        "required_safety_epoch_validation": "current_request_safety_epoch",
        "required_reachability_validation": "current_waitlist_offer_route_clear",
        "allowed_command_settlement_results": [
            "pending",
            "applied",
            "review_required",
            "stale_recoverable",
            "blocked_policy",
            "expired",
        ],
        "declined_scope_disposition": "same_shell_scope_denied",
        "stale_recoverable_disposition": "same_shell_waitlist_refresh",
        "same_shell_recovery_envelope_ref": "RecoveryEnvelope::waitlist-accept",
        "partial_tuple_disposition": "recovery_only_when_offer_window_or_anchor_drifted",
        "source_refs": [
            "prompt/056.md",
            "blueprint/platform-frontend-blueprint.md#Route continuity evidence contract",
            "blueprint/patient-account-and-communications-blueprint.md#Patient action settlement contract",
        ],
        "rationale": "Waitlist acceptance must validate the active offer window, reachability duty, and current parent anchor before the patient can settle the offer in place.",
    },
    {
        "route_intent_id": "RIB_056_PATIENT_NETWORK_ALTERNATIVE_STALE_V1",
        "route_family_ref": "rf_patient_appointments",
        "action_scope": "accept_network_alternative",
        "governing_object_type": "AlternativeOfferSession",
        "governing_object_ref": "alternativeOfferSession://ambiguous",
        "canonical_object_descriptor_ref": "COD_056_ALTERNATIVE_OFFER_V1",
        "governing_bounded_context_ref": "hub_coordination",
        "governing_object_version_ref": "alternativeOfferVersion://current",
        "lineage_scope": "request_lineage",
        "parent_anchor_ref": "anchor://network-alternative/current",
        "subject_ref": "subject://patient/current",
        "grant_family": "patient_session_claimed",
        "session_epoch_ref": "sessionEpoch://patient/current",
        "subject_binding_version_ref": "subjectBindingVersion://patient/current",
        "acting_scope_tuple_requirement_ref": PATIENT_ACTING_SCOPE_REQUIREMENT_REF,
        "required_acting_context": "patient_authenticated_session",
        "required_acting_scope_tuple": "not_required_patient_subject_session",
        "binding_state": "stale",
        "stale_disposition": "same_shell_disambiguate_alternative_offer",
        "recovery_envelope_family": "RecoveryEnvelope::alternative-offer-disambiguation",
        "required_assurance_slice_trust_refs": ["asr_runtime_topology_tuple", "RTFV_PROD_PATIENT_LIVE_V1"],
        "required_safety_epoch_validation": "current_request_safety_epoch",
        "required_reachability_validation": "current_alternative_offer_route_clear",
        "allowed_command_settlement_results": ["review_required", "stale_recoverable", "denied_scope"],
        "declined_scope_disposition": "same_shell_scope_denied",
        "stale_recoverable_disposition": "same_shell_disambiguate_alternative_offer",
        "same_shell_recovery_envelope_ref": "RecoveryEnvelope::alternative-offer-disambiguation",
        "partial_tuple_disposition": "recovery_only_when_offer_session_ambiguous",
        "source_refs": [
            "prompt/056.md",
            "blueprint/phase-5-the-network-horizon.md#Alternative-offer truth",
            "blueprint/patient-account-and-communications-blueprint.md#Patient action recovery contract",
        ],
        "rationale": "Alternative-offer acceptance must fail closed when the authoritative target is ambiguous or the hub-owned offer session no longer matches the bound patient tuple.",
    },
    {
        "route_intent_id": "RIB_056_PATIENT_PHARMACY_CHOICE_V1",
        "route_family_ref": "rf_patient_requests",
        "action_scope": "pharmacy_choice",
        "governing_object_type": "PharmacyCase",
        "governing_object_ref": "pharmacyCase://current",
        "canonical_object_descriptor_ref": "COD_056_PHARMACY_CASE_V1",
        "governing_bounded_context_ref": "pharmacy",
        "governing_object_version_ref": "pharmacyCaseVersion://current",
        "lineage_scope": "request_lineage",
        "parent_anchor_ref": "anchor://pharmacy-choice/current",
        "subject_ref": "subject://patient/current",
        "grant_family": "patient_session_claimed",
        "session_epoch_ref": "sessionEpoch://patient/current",
        "subject_binding_version_ref": "subjectBindingVersion://patient/current",
        "acting_scope_tuple_requirement_ref": PATIENT_ACTING_SCOPE_REQUIREMENT_REF,
        "required_acting_context": "patient_authenticated_session",
        "required_acting_scope_tuple": "not_required_patient_subject_session",
        "binding_state": "live",
        "stale_disposition": "same_shell_pharmacy_choice_refresh",
        "recovery_envelope_family": "RecoveryEnvelope::pharmacy-choice",
        "required_assurance_slice_trust_refs": ["asr_runtime_topology_tuple", "RTFV_PROD_PATIENT_LIVE_V1"],
        "required_safety_epoch_validation": "current_request_safety_epoch",
        "required_reachability_validation": "not_required",
        "allowed_command_settlement_results": [
            "pending",
            "applied",
            "reconciliation_required",
            "stale_recoverable",
            "blocked_policy",
        ],
        "declined_scope_disposition": "same_shell_scope_denied",
        "stale_recoverable_disposition": "same_shell_pharmacy_choice_refresh",
        "same_shell_recovery_envelope_ref": "RecoveryEnvelope::pharmacy-choice",
        "partial_tuple_disposition": "recovery_only_when_pharmacy_tuple_drifted",
        "source_refs": [
            "prompt/056.md",
            "blueprint/phase-6-the-pharmacy-loop.md#Dispatch proof and outcome ingest",
            "blueprint/patient-account-and-communications-blueprint.md#Patient action settlement contract",
        ],
        "rationale": "Patient pharmacy choice remains request-bound and must validate the current pharmacy case tuple before a new choice can settle.",
    },
    {
        "route_intent_id": "RIB_056_PATIENT_PHARMACY_CONSENT_RECOVERY_V1",
        "route_family_ref": "rf_patient_requests",
        "action_scope": "pharmacy_consent",
        "governing_object_type": "PharmacyCase",
        "governing_object_ref": "pharmacyCase://consent-hold",
        "canonical_object_descriptor_ref": "COD_056_PHARMACY_CASE_V1",
        "governing_bounded_context_ref": "pharmacy",
        "governing_object_version_ref": "pharmacyCaseVersion://current",
        "lineage_scope": "request_lineage",
        "parent_anchor_ref": "anchor://pharmacy-consent/current",
        "subject_ref": "subject://patient/current",
        "grant_family": "patient_session_claimed",
        "session_epoch_ref": "sessionEpoch://patient/current",
        "subject_binding_version_ref": "subjectBindingVersion://patient/current",
        "acting_scope_tuple_requirement_ref": PATIENT_ACTING_SCOPE_REQUIREMENT_REF,
        "required_acting_context": "patient_authenticated_session",
        "required_acting_scope_tuple": "not_required_patient_subject_session",
        "binding_state": "recovery_only",
        "stale_disposition": "same_shell_restore_consent_checkpoint",
        "recovery_envelope_family": "RecoveryEnvelope::pharmacy-consent",
        "required_assurance_slice_trust_refs": ["asr_runtime_topology_tuple", "RTFV_PROD_PATIENT_LIVE_V1"],
        "required_safety_epoch_validation": "current_request_safety_epoch",
        "required_reachability_validation": "not_required",
        "allowed_command_settlement_results": ["stale_recoverable", "blocked_policy", "expired"],
        "declined_scope_disposition": "same_shell_scope_denied",
        "stale_recoverable_disposition": "same_shell_restore_consent_checkpoint",
        "same_shell_recovery_envelope_ref": "RecoveryEnvelope::pharmacy-consent",
        "partial_tuple_disposition": "recovery_only",
        "source_refs": [
            "prompt/056.md",
            "blueprint/patient-account-and-communications-blueprint.md#Patient consent checkpoint projection",
            "blueprint/phase-6-the-pharmacy-loop.md#Consent and outcome rules",
        ],
        "rationale": "Consent-gated pharmacy actions must preserve the blocked context in place and may only resume after the current consent checkpoint is rebound on the same pharmacy case tuple.",
    },
    {
        "route_intent_id": "RIB_056_SUPPORT_REPAIR_ACTION_V1",
        "route_family_ref": "rf_support_ticket_workspace",
        "action_scope": "support_repair_action",
        "governing_object_type": "SupportMutationAttempt",
        "governing_object_ref": "supportMutationAttempt://current",
        "canonical_object_descriptor_ref": "COD_056_SUPPORT_MUTATION_ATTEMPT_V1",
        "governing_bounded_context_ref": "support",
        "governing_object_version_ref": "supportMutationAttemptVersion://current",
        "lineage_scope": "support_ticket_lineage",
        "parent_anchor_ref": "anchor://support-ticket/current",
        "subject_ref": "subject://patient/current",
        "grant_family": "governed_support_mutation",
        "session_epoch_ref": "sessionEpoch://support/current",
        "subject_binding_version_ref": "subjectBindingVersion://support/current",
        "acting_scope_tuple_requirement_ref": "ASTR_056_SUPPORT_WORKSPACE_V1",
        "required_acting_context": "support_recovery_workspace",
        "required_acting_scope_tuple": "AST_054_SUPPORT_WORKSPACE_V1",
        "binding_state": "live",
        "stale_disposition": "same_shell_support_repair_refresh",
        "recovery_envelope_family": "RecoveryEnvelope::support-ticket-repair",
        "required_assurance_slice_trust_refs": ["asr_runtime_topology_tuple", "RTFV_PROD_SUPPORT_LIVE_V1"],
        "required_safety_epoch_validation": "current_request_safety_epoch",
        "required_reachability_validation": "current_support_delivery_route_clear",
        "allowed_command_settlement_results": [
            "pending",
            "awaiting_external",
            "applied",
            "review_required",
            "reconciliation_required",
            "stale_recoverable",
            "blocked_policy",
        ],
        "declined_scope_disposition": "same_shell_scope_denied_or_manual_handoff",
        "stale_recoverable_disposition": "same_shell_support_repair_refresh",
        "same_shell_recovery_envelope_ref": "RecoveryEnvelope::support-ticket-repair",
        "partial_tuple_disposition": "recovery_only_when_support_lineage_binding_drifted",
        "source_refs": [
            "prompt/056.md",
            "blueprint/staff-operations-and-support-blueprint.md#Support mutation contract",
            "blueprint/callback-and-clinician-messaging-loop.md#Mutation and settlement law",
        ],
        "rationale": "Support resend, reissue, channel repair, and attachment recovery must reuse the current support-lineage binding and authoritative settlement instead of sending a second side effect from a stale ticket view.",
    },
    {
        "route_intent_id": "RIB_056_OPS_RESILIENCE_ACTION_V1",
        "route_family_ref": "rf_operations_drilldown",
        "action_scope": "ops_resilience_action",
        "governing_object_type": "ReleaseWatchTuple",
        "governing_object_ref": "releaseWatchTuple://current",
        "canonical_object_descriptor_ref": "COD_056_RELEASE_WATCH_TUPLE_V1",
        "governing_bounded_context_ref": "release_control",
        "governing_object_version_ref": "watchTupleHash://current",
        "lineage_scope": "release_watch_lineage",
        "parent_anchor_ref": "anchor://ops-lens/current",
        "subject_ref": "subject://platform/runtime/current",
        "grant_family": "platform_control_mutation",
        "session_epoch_ref": "sessionEpoch://ops/current",
        "subject_binding_version_ref": "subjectBindingVersion://ops/current",
        "acting_scope_tuple_requirement_ref": "ASTR_056_OPERATIONS_WATCH_V1",
        "required_acting_context": "operations_watch_console",
        "required_acting_scope_tuple": "AST_054_OPERATIONS_WATCH_V1",
        "binding_state": "live",
        "stale_disposition": "same_shell_runtime_watch_refresh",
        "recovery_envelope_family": "RecoveryEnvelope::ops-runtime-refresh",
        "required_assurance_slice_trust_refs": ["RWT_PROD_V1", "WGS_PROD_V1", "RTFV_PROD_OPERATIONS_DIAGNOSTIC_V1"],
        "required_safety_epoch_validation": "not_applicable_platform_control",
        "required_reachability_validation": "not_required",
        "allowed_command_settlement_results": [
            "pending",
            "applied",
            "review_required",
            "stale_recoverable",
            "blocked_policy",
        ],
        "declined_scope_disposition": "same_shell_diagnostic_only",
        "stale_recoverable_disposition": "same_shell_runtime_watch_refresh",
        "same_shell_recovery_envelope_ref": "RecoveryEnvelope::ops-runtime-refresh",
        "partial_tuple_disposition": "recovery_only_when_watch_tuple_or_guardrail_drifted",
        "source_refs": [
            "prompt/056.md",
            "blueprint/platform-runtime-and-release-blueprint.md#ReleaseWatchTuple",
            "blueprint/platform-runtime-and-release-blueprint.md#ReleaseRecoveryDisposition",
        ],
        "rationale": "Operations interventions must remain bound to the exact watch tuple, parity verdict, and freeze posture so a stale drilldown cannot issue live resilience control from detached diagnostics.",
    },
    {
        "route_intent_id": "RIB_056_HUB_MANAGE_BOOKING_V1",
        "route_family_ref": "rf_hub_case_management",
        "action_scope": "hub_manage_booking",
        "governing_object_type": "HubCoordinationCase",
        "governing_object_ref": "hubCoordinationCase://current",
        "canonical_object_descriptor_ref": "COD_056_HUB_CASE_V1",
        "governing_bounded_context_ref": "hub_coordination",
        "governing_object_version_ref": "hubCoordinationCaseVersion://current",
        "lineage_scope": "request_lineage",
        "parent_anchor_ref": "anchor://hub-case/current",
        "subject_ref": "subject://patient/current",
        "grant_family": "staff_scoped_coordination",
        "session_epoch_ref": "sessionEpoch://hub/current",
        "subject_binding_version_ref": "subjectBindingVersion://hub/current",
        "acting_scope_tuple_requirement_ref": "ASTR_056_HUB_COORDINATION_V1",
        "required_acting_context": "hub_cross_org_coordination",
        "required_acting_scope_tuple": "AST_054_HUB_COORDINATION_V1",
        "binding_state": "live",
        "stale_disposition": "same_shell_hub_case_refresh",
        "recovery_envelope_family": "RecoveryEnvelope::hub-case-rebind",
        "required_assurance_slice_trust_refs": ["asr_runtime_topology_tuple", "RTFV_PROD_HUB_LIVE_V1", "scope://hub/cross_org_visibility"],
        "required_safety_epoch_validation": "current_request_safety_epoch",
        "required_reachability_validation": "current_alternative_offer_route_clear",
        "allowed_command_settlement_results": [
            "pending",
            "awaiting_external",
            "applied",
            "review_required",
            "reconciliation_required",
            "stale_recoverable",
        ],
        "declined_scope_disposition": "same_shell_scope_denied",
        "stale_recoverable_disposition": "same_shell_hub_case_refresh",
        "same_shell_recovery_envelope_ref": "RecoveryEnvelope::hub-case-rebind",
        "partial_tuple_disposition": "recovery_only_when_cross_org_tuple_drifted",
        "source_refs": [
            "prompt/056.md",
            "blueprint/phase-5-the-network-horizon.md#Network coordination contract",
            "blueprint/staff-operations-and-support-blueprint.md#Staff audience coverage projection",
        ],
        "rationale": "Hub coordination mutations require the current cross-organisation acting scope tuple and exact hub case tuple before bookings or alternatives may settle.",
    },
    {
        "route_intent_id": "RIB_056_STAFF_CLAIM_TASK_V1",
        "route_family_ref": "rf_staff_workspace_child",
        "action_scope": "staff_claim_task",
        "governing_object_type": "TriageTask",
        "governing_object_ref": "triageTask://current",
        "canonical_object_descriptor_ref": "COD_056_TRIAGE_TASK_V1",
        "governing_bounded_context_ref": "triage_workspace",
        "governing_object_version_ref": "triageTaskVersion://current",
        "lineage_scope": "request_lineage",
        "parent_anchor_ref": "anchor://workspace-task/current",
        "subject_ref": "subject://patient/current",
        "grant_family": "staff_scoped_coordination",
        "session_epoch_ref": "sessionEpoch://clinical-workspace/current",
        "subject_binding_version_ref": "subjectBindingVersion://clinical-workspace/current",
        "acting_scope_tuple_requirement_ref": "ASTR_056_CLINICAL_WORKSPACE_V1",
        "required_acting_context": "clinical_workspace_review",
        "required_acting_scope_tuple": "AST_054_CLINICAL_WORKSPACE_V1",
        "binding_state": "live",
        "stale_disposition": "same_shell_task_rebind",
        "recovery_envelope_family": "RecoveryEnvelope::workspace-task-rebind",
        "required_assurance_slice_trust_refs": ["asr_runtime_topology_tuple", "RTFV_PROD_WORKSPACE_LIVE_V1"],
        "required_safety_epoch_validation": "current_request_safety_epoch",
        "required_reachability_validation": "not_required",
        "allowed_command_settlement_results": [
            "pending",
            "applied",
            "review_required",
            "stale_recoverable",
            "blocked_policy",
        ],
        "declined_scope_disposition": "same_shell_scope_denied",
        "stale_recoverable_disposition": "same_shell_task_rebind",
        "same_shell_recovery_envelope_ref": "RecoveryEnvelope::workspace-task-rebind",
        "partial_tuple_disposition": "recovery_only_when_workspace_task_tuple_drifted",
        "source_refs": [
            "prompt/056.md",
            "blueprint/phase-3-the-human-checkpoint.md#Triage contract and workspace state model",
            "blueprint/platform-frontend-blueprint.md#ContinuityTransitionCheckpoint",
        ],
        "rationale": "Workspace task claim must stay bound to the current task tuple, lineage fence, and clinical acting scope instead of allowing stale queue rows to acquire work.",
    },
    {
        "route_intent_id": "RIB_056_PHARMACY_CONSOLE_SETTLEMENT_V1",
        "route_family_ref": "rf_pharmacy_console",
        "action_scope": "pharmacy_console_settlement",
        "governing_object_type": "PharmacyCase",
        "governing_object_ref": "pharmacyCase://current",
        "canonical_object_descriptor_ref": "COD_056_PHARMACY_CASE_V1",
        "governing_bounded_context_ref": "pharmacy",
        "governing_object_version_ref": "pharmacyCaseVersion://current",
        "lineage_scope": "request_lineage",
        "parent_anchor_ref": "anchor://pharmacy-case/current",
        "subject_ref": "subject://patient/current",
        "grant_family": "pharmacy_scoped_delivery",
        "session_epoch_ref": "sessionEpoch://pharmacy/current",
        "subject_binding_version_ref": "subjectBindingVersion://pharmacy/current",
        "acting_scope_tuple_requirement_ref": "ASTR_056_PHARMACY_SERVICING_V1",
        "required_acting_context": "pharmacy_servicing_console",
        "required_acting_scope_tuple": "AST_054_PHARMACY_SERVICING_V1",
        "binding_state": "live",
        "stale_disposition": "same_shell_pharmacy_case_refresh",
        "recovery_envelope_family": "RecoveryEnvelope::pharmacy-console-settlement",
        "required_assurance_slice_trust_refs": ["asr_runtime_topology_tuple", "RTFV_PROD_PHARMACY_LIVE_V1"],
        "required_safety_epoch_validation": "current_request_safety_epoch",
        "required_reachability_validation": "current_pharmacy_contact_route_clear",
        "allowed_command_settlement_results": [
            "pending",
            "awaiting_external",
            "applied",
            "reconciliation_required",
            "stale_recoverable",
            "blocked_policy",
        ],
        "declined_scope_disposition": "same_shell_scope_denied",
        "stale_recoverable_disposition": "same_shell_pharmacy_case_refresh",
        "same_shell_recovery_envelope_ref": "RecoveryEnvelope::pharmacy-console-settlement",
        "partial_tuple_disposition": "recovery_only_when_pharmacy_case_tuple_drifted",
        "source_refs": [
            "prompt/056.md",
            "blueprint/phase-6-the-pharmacy-loop.md#Dispatch proof and outcome ingest",
            "blueprint/pharmacy-console-frontend-architecture.md#Settlement and recovery surfaces",
        ],
        "rationale": "Pharmacy console settlement must remain tied to the current pharmacy case version and the reachability or outcome reconciliation tuple before it can advance calm servicing posture.",
    },
]

SETTLEMENT_RESULT_ROWS = [
    OrderedDict(
        [
            ("settlementResultId", "CSR_056_PENDING_PROCESSING_V1"),
            ("result", "pending"),
            ("processingAcceptanceState", "accepted_for_processing"),
            ("externalObservationState", "unobserved"),
            ("authoritativeOutcomeState", "pending"),
            ("authoritativeProofClass", "not_yet_authoritative"),
            ("settlementLadderStage", "processing_accepted"),
            ("coarseResultClass", "pending"),
            ("sameShellCalmReturnEligible", "no"),
            ("sameShellRecoveryAllowed", "yes"),
            ("sameShellRecoveryEnvelopeRef", "RecoveryEnvelope::pending-in-place"),
            ("releaseRecoveryDispositionRef", "RRD_PATIENT_REQUEST_RECOVERY_ONLY"),
            ("routeFreezeDispositionRef", "RFD_056_PENDING_IN_PLACE_V1"),
            ("source_refs", "blueprint/phase-0-the-foundation-protocol.md#1.23 CommandSettlementRecord; prompt/056.md"),
            ("rationale", "Processing acceptance may widen pending guidance but may not drive calm success."),
        ]
    ),
    OrderedDict(
        [
            ("settlementResultId", "CSR_056_AWAITING_EXTERNAL_V1"),
            ("result", "awaiting_external"),
            ("processingAcceptanceState", "awaiting_external_confirmation"),
            ("externalObservationState", "external_effect_observed"),
            ("authoritativeOutcomeState", "awaiting_external"),
            ("authoritativeProofClass", "external_confirmation"),
            ("settlementLadderStage", "external_observation"),
            ("coarseResultClass", "pending"),
            ("sameShellCalmReturnEligible", "no"),
            ("sameShellRecoveryAllowed", "yes"),
            ("sameShellRecoveryEnvelopeRef", "RecoveryEnvelope::await-external"),
            ("releaseRecoveryDispositionRef", "RRD_PATIENT_REQUEST_RECOVERY_ONLY"),
            ("routeFreezeDispositionRef", "RFD_056_AWAITING_EXTERNAL_V1"),
            ("source_refs", "blueprint/phase-0-the-foundation-protocol.md#1.23 CommandSettlementRecord; prompt/056.md"),
            ("rationale", "Provider or worker acknowledgement is observational only until the authoritative outcome settles."),
        ]
    ),
    OrderedDict(
        [
            ("settlementResultId", "CSR_056_APPLIED_NOT_SETTLED_V1"),
            ("result", "applied"),
            ("processingAcceptanceState", "externally_accepted"),
            ("externalObservationState", "projection_visible"),
            ("authoritativeOutcomeState", "projection_pending"),
            ("authoritativeProofClass", "projection_visible"),
            ("settlementLadderStage", "projection_visible"),
            ("coarseResultClass", "progress_visible"),
            ("sameShellCalmReturnEligible", "no"),
            ("sameShellRecoveryAllowed", "yes"),
            ("sameShellRecoveryEnvelopeRef", "RecoveryEnvelope::command-following-projection"),
            ("releaseRecoveryDispositionRef", "RRD_PATIENT_REQUEST_RECOVERY_ONLY"),
            ("routeFreezeDispositionRef", "RFD_056_PROJECTION_PENDING_V1"),
            ("source_refs", "blueprint/phase-0-the-foundation-protocol.md#1.23 CommandSettlementRecord; prompt/056.md"),
            ("rationale", "A projection or local receipt can show progress but cannot authorize calm reassurance until the authoritative outcome is settled."),
        ]
    ),
    OrderedDict(
        [
            ("settlementResultId", "CSR_056_APPLIED_SETTLED_V1"),
            ("result", "applied"),
            ("processingAcceptanceState", "externally_accepted"),
            ("externalObservationState", "projection_visible"),
            ("authoritativeOutcomeState", "settled"),
            ("authoritativeProofClass", "projection_visible"),
            ("settlementLadderStage", "authoritative_settlement"),
            ("coarseResultClass", "settled"),
            ("sameShellCalmReturnEligible", "yes"),
            ("sameShellRecoveryAllowed", "no"),
            ("sameShellRecoveryEnvelopeRef", ""),
            ("releaseRecoveryDispositionRef", "none"),
            ("routeFreezeDispositionRef", "none"),
            ("source_refs", "blueprint/phase-0-the-foundation-protocol.md#1.23 CommandSettlementRecord; prompt/056.md"),
            ("rationale", "Calm success is legal only when the authoritative outcome state is settled under the same governing action chain."),
        ]
    ),
    OrderedDict(
        [
            ("settlementResultId", "CSR_056_REVIEW_REQUIRED_V1"),
            ("result", "review_required"),
            ("processingAcceptanceState", "accepted_for_processing"),
            ("externalObservationState", "review_disposition_observed"),
            ("authoritativeOutcomeState", "review_required"),
            ("authoritativeProofClass", "review_disposition"),
            ("settlementLadderStage", "review_hold"),
            ("coarseResultClass", "recoverable_review"),
            ("sameShellCalmReturnEligible", "no"),
            ("sameShellRecoveryAllowed", "yes"),
            ("sameShellRecoveryEnvelopeRef", "RecoveryEnvelope::review-hold"),
            ("releaseRecoveryDispositionRef", "RRD_SUPPORT_WORKSPACE_READ_ONLY"),
            ("routeFreezeDispositionRef", "RFD_056_REVIEW_HOLD_V1"),
            ("source_refs", "blueprint/phase-0-the-foundation-protocol.md#1.23 CommandSettlementRecord; prompt/056.md"),
            ("rationale", "Review-required outcomes keep the same shell and preserve the dominant summary while mutation remains frozen."),
        ]
    ),
    OrderedDict(
        [
            ("settlementResultId", "CSR_056_RECONCILIATION_REQUIRED_V1"),
            ("result", "reconciliation_required"),
            ("processingAcceptanceState", "externally_accepted"),
            ("externalObservationState", "disputed"),
            ("authoritativeOutcomeState", "reconciliation_required"),
            ("authoritativeProofClass", "review_disposition"),
            ("settlementLadderStage", "reconciliation_hold"),
            ("coarseResultClass", "recoverable_reconciliation"),
            ("sameShellCalmReturnEligible", "no"),
            ("sameShellRecoveryAllowed", "yes"),
            ("sameShellRecoveryEnvelopeRef", "RecoveryEnvelope::reconciliation-hold"),
            ("releaseRecoveryDispositionRef", "RRD_PHARMACY_DISPATCH_RECOVERY"),
            ("routeFreezeDispositionRef", "RFD_056_RECONCILIATION_HOLD_V1"),
            ("source_refs", "blueprint/phase-0-the-foundation-protocol.md#1.23 CommandSettlementRecord; prompt/056.md"),
            ("rationale", "Disputed or ambiguous external evidence must route through same-shell reconciliation instead of false final assurance."),
        ]
    ),
    OrderedDict(
        [
            ("settlementResultId", "CSR_056_STALE_RECOVERABLE_V1"),
            ("result", "stale_recoverable"),
            ("processingAcceptanceState", "not_started"),
            ("externalObservationState", "recovery_observed"),
            ("authoritativeOutcomeState", "stale_recoverable"),
            ("authoritativeProofClass", "recovery_disposition"),
            ("settlementLadderStage", "stale_recovery"),
            ("coarseResultClass", "recoverable_stale"),
            ("sameShellCalmReturnEligible", "no"),
            ("sameShellRecoveryAllowed", "yes"),
            ("sameShellRecoveryEnvelopeRef", "RecoveryEnvelope::tuple-rebind"),
            ("releaseRecoveryDispositionRef", "RRD_PATIENT_REQUEST_RECOVERY_ONLY"),
            ("routeFreezeDispositionRef", "RFD_056_STALE_RECOVERABLE_V1"),
            ("source_refs", "blueprint/phase-0-the-foundation-protocol.md#1.23 CommandSettlementRecord; prompt/056.md"),
            ("rationale", "Tuple drift, session drift, or stale governing-object versions reopen same-shell recovery rather than generic failure."),
        ]
    ),
    OrderedDict(
        [
            ("settlementResultId", "CSR_056_BLOCKED_POLICY_V1"),
            ("result", "blocked_policy"),
            ("processingAcceptanceState", "not_started"),
            ("externalObservationState", "recovery_observed"),
            ("authoritativeOutcomeState", "recovery_required"),
            ("authoritativeProofClass", "recovery_disposition"),
            ("settlementLadderStage", "policy_block"),
            ("coarseResultClass", "blocked"),
            ("sameShellCalmReturnEligible", "no"),
            ("sameShellRecoveryAllowed", "yes"),
            ("sameShellRecoveryEnvelopeRef", "RecoveryEnvelope::policy-hold"),
            ("releaseRecoveryDispositionRef", "RRD_OPERATIONS_BOARD_FROZEN"),
            ("routeFreezeDispositionRef", "RFD_056_POLICY_BLOCK_V1"),
            ("source_refs", "blueprint/phase-0-the-foundation-protocol.md#1.23 CommandSettlementRecord; prompt/056.md"),
            ("rationale", "Release freeze, safety preemption, or channel freeze blocks mutation and must degrade through the declared same-shell recovery path."),
        ]
    ),
    OrderedDict(
        [
            ("settlementResultId", "CSR_056_DENIED_SCOPE_V1"),
            ("result", "denied_scope"),
            ("processingAcceptanceState", "not_started"),
            ("externalObservationState", "recovery_observed"),
            ("authoritativeOutcomeState", "recovery_required"),
            ("authoritativeProofClass", "recovery_disposition"),
            ("settlementLadderStage", "scope_denial"),
            ("coarseResultClass", "blocked"),
            ("sameShellCalmReturnEligible", "no"),
            ("sameShellRecoveryAllowed", "yes"),
            ("sameShellRecoveryEnvelopeRef", "RecoveryEnvelope::scope-switch"),
            ("releaseRecoveryDispositionRef", "RRD_GOVERNANCE_HANDOFF_ONLY"),
            ("routeFreezeDispositionRef", "RFD_056_SCOPE_DENIAL_V1"),
            ("source_refs", "blueprint/phase-0-the-foundation-protocol.md#1.23 CommandSettlementRecord; prompt/056.md"),
            ("rationale", "Denied-scope outcomes preserve the current context and route the actor into reissue, switch, or handoff recovery in the same shell."),
        ]
    ),
    OrderedDict(
        [
            ("settlementResultId", "CSR_056_EXPIRED_V1"),
            ("result", "expired"),
            ("processingAcceptanceState", "timed_out"),
            ("externalObservationState", "expired"),
            ("authoritativeOutcomeState", "expired"),
            ("authoritativeProofClass", "recovery_disposition"),
            ("settlementLadderStage", "expiry"),
            ("coarseResultClass", "blocked"),
            ("sameShellCalmReturnEligible", "no"),
            ("sameShellRecoveryAllowed", "yes"),
            ("sameShellRecoveryEnvelopeRef", "RecoveryEnvelope::reissue-or-step-up"),
            ("releaseRecoveryDispositionRef", "RRD_SECURE_LINK_RECOVERY_ONLY"),
            ("routeFreezeDispositionRef", "RFD_056_EXPIRED_V1"),
            ("source_refs", "blueprint/phase-0-the-foundation-protocol.md#1.23 CommandSettlementRecord; prompt/056.md"),
            ("rationale", "Expired grants, reply windows, or command-following fences must preserve the last safe summary and reopen governed reissue or step-up in place."),
        ]
    ),
]

RECOVERY_ROWS = [
    OrderedDict(
        [
            ("recoveryCaseId", "RCV_056_STALE_TUPLE_REBIND_V1"),
            ("resultClass", "stale_recoverable"),
            ("dominantReason", "route intent, governing object, or fence epoch drifted"),
            ("sameShellRecoveryEnvelopeRef", "RecoveryEnvelope::tuple-rebind"),
            ("releaseRecoveryDispositionRef", "RRD_PATIENT_REQUEST_RECOVERY_ONLY"),
            ("routeFreezeDispositionRef", "RFD_056_STALE_RECOVERABLE_V1"),
            ("preserveAnchorState", "yes"),
            ("dominantSummaryTier", "last_safe_summary"),
            ("nextActionLabel", "Refresh current action"),
            ("source_refs", "blueprint/patient-account-and-communications-blueprint.md#Patient action recovery contract; prompt/056.md"),
            ("rationale", "Tuple drift keeps the current shell and last safe summary visible while the route intent is revalidated."),
        ]
    ),
    OrderedDict(
        [
            ("recoveryCaseId", "RCV_056_POLICY_HOLD_V1"),
            ("resultClass", "blocked_policy"),
            ("dominantReason", "release freeze, channel freeze, safety preemption, or policy ceiling blocked mutation"),
            ("sameShellRecoveryEnvelopeRef", "RecoveryEnvelope::policy-hold"),
            ("releaseRecoveryDispositionRef", "RRD_OPERATIONS_BOARD_FROZEN"),
            ("routeFreezeDispositionRef", "RFD_056_POLICY_BLOCK_V1"),
            ("preserveAnchorState", "yes"),
            ("dominantSummaryTier", "blocked_context"),
            ("nextActionLabel", "View governing policy hold"),
            ("source_refs", "blueprint/platform-runtime-and-release-blueprint.md#ReleaseRecoveryDisposition; prompt/056.md"),
            ("rationale", "Policy blocks must degrade through the declared recovery disposition rather than a generic error state."),
        ]
    ),
    OrderedDict(
        [
            ("recoveryCaseId", "RCV_056_SCOPE_SWITCH_V1"),
            ("resultClass", "denied_scope"),
            ("dominantReason", "acting scope, grant family, or tuple hash no longer matches"),
            ("sameShellRecoveryEnvelopeRef", "RecoveryEnvelope::scope-switch"),
            ("releaseRecoveryDispositionRef", "RRD_GOVERNANCE_HANDOFF_ONLY"),
            ("routeFreezeDispositionRef", "RFD_056_SCOPE_DENIAL_V1"),
            ("preserveAnchorState", "yes"),
            ("dominantSummaryTier", "scope_gap_summary"),
            ("nextActionLabel", "Reissue authority"),
            ("source_refs", "blueprint/phase-0-the-foundation-protocol.md#6.6 Scoped mutation gate; prompt/056.md"),
            ("rationale", "Scope denial keeps the governed context visible while route authority is reissued or handed off."),
        ]
    ),
    OrderedDict(
        [
            ("recoveryCaseId", "RCV_056_REISSUE_OR_STEP_UP_V1"),
            ("resultClass", "expired"),
            ("dominantReason", "grant, session, or reply window expired"),
            ("sameShellRecoveryEnvelopeRef", "RecoveryEnvelope::reissue-or-step-up"),
            ("releaseRecoveryDispositionRef", "RRD_SECURE_LINK_RECOVERY_ONLY"),
            ("routeFreezeDispositionRef", "RFD_056_EXPIRED_V1"),
            ("preserveAnchorState", "yes"),
            ("dominantSummaryTier", "checkpoint_summary"),
            ("nextActionLabel", "Reissue access"),
            ("source_refs", "blueprint/phase-2-identity-and-echoes.md#Continuation authority and claim law; prompt/056.md"),
            ("rationale", "Expiry must reopen governed reissue, step-up, or continuation recovery inside the same shell."),
        ]
    ),
    OrderedDict(
        [
            ("recoveryCaseId", "RCV_056_REVIEW_HOLD_V1"),
            ("resultClass", "review_required"),
            ("dominantReason", "manual review or review-disposition hold is active"),
            ("sameShellRecoveryEnvelopeRef", "RecoveryEnvelope::review-hold"),
            ("releaseRecoveryDispositionRef", "RRD_SUPPORT_WORKSPACE_READ_ONLY"),
            ("routeFreezeDispositionRef", "RFD_056_REVIEW_HOLD_V1"),
            ("preserveAnchorState", "yes"),
            ("dominantSummaryTier", "review_summary"),
            ("nextActionLabel", "View review disposition"),
            ("source_refs", "blueprint/callback-and-clinician-messaging-loop.md#Mutation and settlement law; prompt/056.md"),
            ("rationale", "Review-required outcomes stay attached to the current anchor and governing object until the review settles."),
        ]
    ),
    OrderedDict(
        [
            ("recoveryCaseId", "RCV_056_RECONCILIATION_HOLD_V1"),
            ("resultClass", "reconciliation_required"),
            ("dominantReason", "external confirmation or outcome evidence is disputed"),
            ("sameShellRecoveryEnvelopeRef", "RecoveryEnvelope::reconciliation-hold"),
            ("releaseRecoveryDispositionRef", "RRD_PHARMACY_DISPATCH_RECOVERY"),
            ("routeFreezeDispositionRef", "RFD_056_RECONCILIATION_HOLD_V1"),
            ("preserveAnchorState", "yes"),
            ("dominantSummaryTier", "reconciliation_summary"),
            ("nextActionLabel", "Resolve disputed evidence"),
            ("source_refs", "blueprint/phase-6-the-pharmacy-loop.md#Outcome ingest, reconciliation, and closure; prompt/056.md"),
            ("rationale", "Reconciliation holds preserve the same shell and current object while disputed evidence is reconciled."),
        ]
    ),
    OrderedDict(
        [
            ("recoveryCaseId", "RCV_056_PUBLICATION_REFRESH_V1"),
            ("resultClass", "publication_stale"),
            ("dominantReason", "runtime publication, parity, or provenance drifted"),
            ("sameShellRecoveryEnvelopeRef", "RecoveryEnvelope::runtime-watch-refresh"),
            ("releaseRecoveryDispositionRef", "RRD_PATIENT_INTAKE_RECOVERY"),
            ("routeFreezeDispositionRef", "RFD_056_PUBLICATION_STALE_V1"),
            ("preserveAnchorState", "yes"),
            ("dominantSummaryTier", "runtime_tuple_summary"),
            ("nextActionLabel", "Refresh published runtime tuple"),
            ("source_refs", "blueprint/platform-runtime-and-release-blueprint.md#AudienceSurfaceRuntimeBinding; prompt/056.md"),
            ("rationale", "Runtime publication drift must freeze live mutation in place and route through the current release recovery disposition."),
        ]
    ),
    OrderedDict(
        [
            ("recoveryCaseId", "RCV_056_CONTACT_REPAIR_V1"),
            ("resultClass", "contact_repair_required"),
            ("dominantReason", "reachability assessment or contact repair journey blocks the dependent action"),
            ("sameShellRecoveryEnvelopeRef", "RecoveryEnvelope::contact-route-repair"),
            ("releaseRecoveryDispositionRef", "RRD_SUPPORT_CAPTURE_RECOVERY"),
            ("routeFreezeDispositionRef", "RFD_056_CONTACT_REPAIR_V1"),
            ("preserveAnchorState", "yes"),
            ("dominantSummaryTier", "blocked_action_summary"),
            ("nextActionLabel", "Repair contact route"),
            ("source_refs", "blueprint/phase-0-the-foundation-protocol.md#6.5B Contact-route repair continuity rule; prompt/056.md"),
            ("rationale", "Reachability-dependent actions must preserve the blocked action context and reopen through the current contact repair journey."),
        ]
    ),
]

ASSUMPTIONS = [
    {
        "assumptionId": "ASSUMPTION_056_PATIENT_SUBJECT_BOUND_REQUIREMENT",
        "statement": (
            "Patient-originated routes use one declared subject-bound acting-scope requirement instead of seq_054 staff acting-scope tuples. "
            "The mutable authority tuple still includes subject binding version and session epoch."
        ),
        "source_refs": [
            "prompt/056.md",
            "blueprint/phase-0-the-foundation-protocol.md#1.21 RouteIntentBinding",
            "blueprint/phase-2-identity-and-echoes.md#Continuation authority and claim law",
        ],
    },
    {
        "assumptionId": "ASSUMPTION_056_DECISION_ROWS_INCLUDE_LIVE_AND_DEGRADED_VARIANTS",
        "statement": (
            "The decision table publishes both live and degraded route-intent variants for the same action scope so binding-state filters can prove downgrade law without inventing a second sidecar matrix."
        ),
        "source_refs": [
            "prompt/056.md",
            "blueprint/phase-0-the-foundation-protocol.md#1.21 RouteIntentBinding",
            "blueprint/phase-0-the-foundation-protocol.md#6.6 Scoped mutation gate",
        ],
    },
]

DEFECTS = [
    {
        "defectId": "GAP_056_ROUTE_AUTHORITY_IS_MACHINE_READABLE",
        "state": "closed_by_contract",
        "summary": "Writable authority now resolves through a validator-backed route-intent tuple instead of local UI logic.",
        "source_refs": ["prompt/056.md", "blueprint/forensic-audit-findings.md#Finding 91"],
    },
    {
        "defectId": "GAP_056_LOGIN_SUCCESS_IS_NOT_WRITABILITY",
        "state": "closed_by_contract",
        "summary": "Capability or login success alone no longer implies mutation authority; route intent, runtime binding, and settlement law are all mandatory.",
        "source_refs": ["prompt/056.md", "blueprint/phase-2-identity-and-echoes.md#Continuation authority and claim law"],
    },
    {
        "defectId": "GAP_056_TRANSPORT_SUCCESS_IS_NOT_BUSINESS_SUCCESS",
        "state": "closed_by_contract",
        "summary": "Settlement rows now separate processing acceptance, external observation, and authoritative outcome state.",
        "source_refs": ["prompt/056.md", "blueprint/phase-0-the-foundation-protocol.md#1.23 CommandSettlementRecord"],
    },
    {
        "defectId": "GAP_056_PARENT_ANCHOR_AND_OBJECT_VERSION_ARE_MANDATORY",
        "state": "closed_by_contract",
        "summary": "Every route-intent row carries parent anchor, canonical descriptor, and governing-object version fields before mutation is legal.",
        "source_refs": ["prompt/056.md", "blueprint/phase-0-the-foundation-protocol.md#1.21 RouteIntentBinding"],
    },
    {
        "defectId": "GAP_056_CONTEXT_BOUNDARIES_ARE_EXPLICIT",
        "state": "closed_by_contract",
        "summary": "Cross-context actionability now requires published context-boundary refs instead of launch-source inference.",
        "source_refs": ["prompt/056.md", "blueprint/platform-frontend-blueprint.md#Typed patient transaction route contract"],
    },
    {
        "defectId": "GAP_056_SAFETY_AND_REACHABILITY_DRIFT_FREEZE_CTA",
        "state": "closed_by_contract",
        "summary": "Safety epoch, reachability posture, and subject or session drift now execute before dispatch and downgrade stale CTAs in place.",
        "source_refs": ["prompt/056.md", "blueprint/phase-0-the-foundation-protocol.md#6.6 Scoped mutation gate"],
    },
    {
        "defectId": "GAP_056_RECOVERY_STAYS_IN_SAME_SHELL",
        "state": "closed_by_contract",
        "summary": "Recoverable denials, freeze blocks, stale tuples, and expiries now bind one same-shell recovery envelope rather than detached error pages.",
        "source_refs": ["prompt/056.md", "blueprint/patient-account-and-communications-blueprint.md#Patient action recovery contract"],
    },
]

ROUTE_INTENT_FIELD_NOTES = [
    ("routeIntentId", "Stable identifier for the bound route-intent tuple.", "yes", "Unique row identity."),
    ("audienceSurface", "Published audience surface consuming the writable route.", "yes", "Mismatch downgrades runtime authority."),
    ("shellType", "Owning shell family for the route.", "yes", "Same-shell recovery must stay in this shell family."),
    ("routeFamily", "Canonical route family being armed for mutation.", "yes", "Route-local aliases are descriptive only."),
    ("actionScope", "Typed mutation scope resolved before dispatch.", "yes", "Commands route only through this scope."),
    ("governingObjectType", "Authoritative lifecycle owner object kind.", "yes", "Ambiguity fails closed."),
    ("governingObjectRef", "Exact current governing object ref.", "yes", "URL or cache may not retarget it."),
    ("canonicalObjectDescriptorRef", "Canonical descriptor for the authoritative target.", "yes", "Missing descriptor forces recovery_only."),
    ("governingBoundedContextRef", "Owning bounded context for mutation truth.", "yes", "Contributor surfaces cannot substitute a new owner."),
    ("governingObjectVersionRef", "Current authoritative version or fence.", "yes", "Drift opens stale recovery."),
    ("lineageScope", "Lineage axis the mutation is bound to.", "yes", "Cross-lineage replay is forbidden."),
    ("requiredContextBoundaryRefs[]", "Explicit cross-context seams needed for the route.", "yes", "Launch source cannot infer authority."),
    ("parentAnchorRef", "Selected anchor or dominant object summary preserved in recovery.", "yes", "Missing anchor forces recovery_only."),
    ("subjectRef", "Subject or platform principal bound by the tuple.", "yes", "Wrong subject opens denial or repair."),
    ("grantFamily", "Grant or role family legal for the action.", "yes", "Capability alone is insufficient."),
    ("sessionEpochRef", "Current session epoch proving freshness.", "yes", "Session drift freezes mutation."),
    ("subjectBindingVersionRef", "Current subject-binding version.", "yes", "Binding supersession downgrades the route."),
    ("actingScopeTupleRequirementRef", "Named acting-scope requirement or tuple reference.", "yes", "Cross-org staff work must validate the tuple."),
    ("audienceSurfaceRuntimeBindingRef", "Current published runtime binding required for actionability.", "yes", "Runtime publication may not be inferred elsewhere."),
    ("releaseApprovalFreezeRef", "Pinned release approval freeze required for write posture.", "yes", "Drift blocks writable posture."),
    ("channelReleaseFreezeState", "Current channel freeze state carried into the tuple.", "yes", "Freeze and kill-switch posture remain explicit."),
    ("requiredAssuranceSliceTrustRefs[]", "Trust or watch tuple refs that must still validate.", "yes", "Trust drift degrades in place."),
    ("routeContractDigestRef", "Digest proving the exact published route contract.", "yes", "Missing digest forces recovery_only."),
    ("routeIntentTupleHash", "Immutable hash over the exact target tuple members.", "derived", "All writable reconstruction must use this hash."),
    ("bindingState", "Current route-intent state: live, stale, superseded, or recovery_only.", "no", "State drives filter and downgrade behavior."),
    ("staleDisposition", "Governed stale-handling posture for tuple drift.", "no", "Must return same-shell recovery."),
    ("recoveryEnvelopeFamily", "Named same-shell recovery envelope family.", "no", "Detached error pages are forbidden."),
]


def read_json(path: Path) -> Any:
    return json.loads(path.read_text())


def write_json(path: Path, payload: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2) + "\n")


def read_csv(path: Path) -> list[dict[str, str]]:
    with path.open() as handle:
        return list(csv.DictReader(handle))


def write_csv(path: Path, fieldnames: list[str], rows: list[dict[str, Any]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        for row in rows:
            normalized: dict[str, Any] = {}
            for key in fieldnames:
                value = row.get(key, "")
                if isinstance(value, list):
                    normalized[key] = "; ".join(str(item) for item in value)
                else:
                    normalized[key] = value
            writer.writerow(normalized)


def write_text(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content)


def short_hash(payload: Any) -> str:
    return hashlib.sha256(
        json.dumps(payload, sort_keys=True, separators=(",", ":")).encode("utf-8")
    ).hexdigest()[:16]


def split_refs(value: str | None) -> list[str]:
    if not value:
        return []
    return [item.strip() for item in value.split(";") if item.strip()]


def markdown_table(headers: list[str], rows: list[list[str]]) -> str:
    lines = [
        "| " + " | ".join(headers) + " |",
        "| " + " | ".join(["---"] * len(headers)) + " |",
    ]
    for row in rows:
        lines.append("| " + " | ".join(row) + " |")
    return "\n".join(lines)


def ensure_prerequisites() -> None:
    required = {
        ROUTE_FAMILY_PATH: None,
        ROUTE_SCOPE_PATH: None,
        GATEWAY_MATRIX_PATH: None,
        FRONTEND_MANIFEST_PATH: "seq_050",
        RELEASE_PARITY_PATH: "seq_051",
        TENANT_SCOPE_PATH: "seq_054",
        LIFECYCLE_TAXONOMY_PATH: "seq_055",
    }
    for path, task_id in required.items():
        if not path.exists():
            raise SystemExit(f"PREREQUISITE_GAP_056_MISSING::{path}")
        if task_id is not None:
            payload = read_json(path)
            actual = payload.get("task_id") or payload.get("taskId")
            if actual != task_id:
                raise SystemExit(
                    f"PREREQUISITE_GAP_056_STALE::{path.name} expected {task_id}, found {actual!r}"
                )


def load_context() -> dict[str, Any]:
    ensure_prerequisites()
    route_inventory = {row["route_family_id"]: row for row in read_csv(ROUTE_FAMILY_PATH)}
    route_scope_rows = {row["route_family_id"]: row for row in read_csv(ROUTE_SCOPE_PATH)}
    gateway_rows = {row["route_family_id"]: row for row in read_csv(GATEWAY_MATRIX_PATH)}
    frontend_payload = read_json(FRONTEND_MANIFEST_PATH)
    parity_payload = read_json(RELEASE_PARITY_PATH)
    tenant_payload = read_json(TENANT_SCOPE_PATH)
    lifecycle_payload = read_json(LIFECYCLE_TAXONOMY_PATH)
    event_payload = read_json(EVENT_REGISTRY_PATH)

    manifest_by_route: dict[str, dict[str, Any]] = {}
    runtime_binding_by_audience: dict[str, dict[str, Any]] = {
        row["audienceSurface"]: row
        for row in frontend_payload["audienceSurfaceRuntimeBindings"]
    }
    mutation_contract_by_route: dict[str, dict[str, Any]] = {
        row["routeFamilyRef"]: row for row in frontend_payload["mutationCommandContracts"]
    }
    for manifest in frontend_payload["frontendContractManifests"]:
        for route_family in manifest["routeFamilyRefs"]:
            manifest_by_route[route_family] = manifest

    binding_outcome_by_surface: dict[str, dict[str, Any]] = {}
    for row in parity_payload["surfaceBindingOutcomes"]:
        binding_outcome_by_surface.setdefault(row["audienceSurface"], row)

    acting_scope_tuples = {
        row["actingScopeTupleId"]: row for row in tenant_payload["actingScopeTuples"]
    }
    event_lookup = {row["eventName"]: row for row in event_payload["contracts"]}

    return {
        "route_inventory": route_inventory,
        "route_scope_rows": route_scope_rows,
        "gateway_rows": gateway_rows,
        "frontend_payload": frontend_payload,
        "manifest_by_route": manifest_by_route,
        "runtime_binding_by_audience": runtime_binding_by_audience,
        "mutation_contract_by_route": mutation_contract_by_route,
        "binding_outcome_by_surface": binding_outcome_by_surface,
        "tenant_payload": tenant_payload,
        "acting_scope_tuples": acting_scope_tuples,
        "lifecycle_payload": lifecycle_payload,
        "event_lookup": event_lookup,
    }


def published_runtime_state(context: dict[str, Any], audience_surface: str) -> str:
    runtime_binding = context["runtime_binding_by_audience"][audience_surface]
    return runtime_binding["bindingState"]


def current_browser_posture(context: dict[str, Any], audience_surface: str) -> str:
    for manifest in context["frontend_payload"]["frontendContractManifests"]:
        if manifest["audienceSurface"] == audience_surface:
            return manifest["browserPostureState"]
    raise KeyError(audience_surface)


def route_hash_fields(row: dict[str, Any]) -> dict[str, Any]:
    return {
        "audienceSurface": row["audienceSurface"],
        "shellType": row["shellType"],
        "routeFamily": row["routeFamily"],
        "actionScope": row["actionScope"],
        "governingObjectType": row["governingObjectType"],
        "governingObjectRef": row["governingObjectRef"],
        "canonicalObjectDescriptorRef": row["canonicalObjectDescriptorRef"],
        "governingBoundedContextRef": row["governingBoundedContextRef"],
        "governingObjectVersionRef": row["governingObjectVersionRef"],
        "lineageScope": row["lineageScope"],
        "requiredContextBoundaryRefs": row["requiredContextBoundaryRefs"],
        "parentAnchorRef": row["parentAnchorRef"],
        "subjectRef": row["subjectRef"],
        "grantFamily": row["grantFamily"],
        "sessionEpochRef": row["sessionEpochRef"],
        "subjectBindingVersionRef": row["subjectBindingVersionRef"],
        "actingScopeTupleRequirementRef": row["actingScopeTupleRequirementRef"],
        "audienceSurfaceRuntimeBindingRef": row["audienceSurfaceRuntimeBindingRef"],
        "releaseApprovalFreezeRef": row["releaseApprovalFreezeRef"],
        "channelReleaseFreezeState": row["channelReleaseFreezeState"],
        "routeContractDigestRef": row["routeContractDigestRef"],
    }


def build_decision_rows(context: dict[str, Any]) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    for config in ACTION_SCOPE_ROWS:
        route_family = config["route_family_ref"]
        route_meta = context["route_inventory"][route_family]
        route_scope = context["route_scope_rows"][route_family]
        gateway_row = context["gateway_rows"][route_family]
        manifest = context["manifest_by_route"][route_family]
        mutation_contract = context["mutation_contract_by_route"][route_family]
        audience_surface = manifest["audienceSurface"]
        route_contract_digest = short_hash(
            {
                "routeFamily": route_family,
                "audienceSurface": audience_surface,
                "commandContract": mutation_contract["mutationCommandContractId"],
                "surfaceTuple": manifest["surfaceAuthorityTupleHash"],
            }
        )
        required_context_boundary_refs = split_refs(
            gateway_row["required_context_boundary_refs"]
        )
        trust_refs = list(
            dict.fromkeys(
                split_refs(route_scope.get("required_trust_refs"))
                + config["required_assurance_slice_trust_refs"]
            )
        )

        row = OrderedDict(
            [
                ("routeIntentId", config["route_intent_id"]),
                ("audienceSurface", audience_surface),
                ("shellType", route_meta["shell_type"]),
                ("routeFamily", route_family),
                ("actionScope", config["action_scope"]),
                ("governingObjectType", config["governing_object_type"]),
                ("governingObjectRef", config["governing_object_ref"]),
                ("canonicalObjectDescriptorRef", config["canonical_object_descriptor_ref"]),
                ("governingBoundedContextRef", config["governing_bounded_context_ref"]),
                ("governingObjectVersionRef", config["governing_object_version_ref"]),
                ("lineageScope", config["lineage_scope"]),
                ("requiredContextBoundaryRefs", required_context_boundary_refs),
                ("parentAnchorRef", config["parent_anchor_ref"]),
                ("subjectRef", config["subject_ref"]),
                ("grantFamily", config["grant_family"]),
                ("sessionEpochRef", config["session_epoch_ref"]),
                ("subjectBindingVersionRef", config["subject_binding_version_ref"]),
                (
                    "actingScopeTupleRequirementRef",
                    config["acting_scope_tuple_requirement_ref"],
                ),
                (
                    "audienceSurfaceRuntimeBindingRef",
                    mutation_contract["requiredAudienceSurfaceRuntimeBindingRef"],
                ),
                ("releaseApprovalFreezeRef", RELEASE_APPROVAL_FREEZE_REF),
                ("channelReleaseFreezeState", "monitoring"),
                ("requiredAssuranceSliceTrustRefs", trust_refs),
                ("routeContractDigestRef", route_contract_digest),
                ("bindingState", config["binding_state"]),
                ("staleDisposition", config["stale_disposition"]),
                ("recoveryEnvelopeFamily", config["recovery_envelope_family"]),
                (
                    "publishedMutationCommandContractRef",
                    mutation_contract["mutationCommandContractId"],
                ),
                (
                    "publishedRouteIntentBindingRequirementRef",
                    mutation_contract["requiredRouteIntentBindingRef"],
                ),
                (
                    "publishedRuntimeBindingState",
                    published_runtime_state(context, audience_surface),
                ),
                (
                    "currentPublishedBrowserPosture",
                    current_browser_posture(context, audience_surface),
                ),
                ("requiredGrantFamily", config["grant_family"]),
                ("requiredActingContext", config["required_acting_context"]),
                ("requiredActingScopeTuple", config["required_acting_scope_tuple"]),
                ("requiredLineageFenceEpoch", LINEAGE_EPOCH_VALIDATION),
                (
                    "requiredSafetyEpochValidation",
                    config["required_safety_epoch_validation"],
                ),
                (
                    "requiredReachabilityValidation",
                    config["required_reachability_validation"],
                ),
                (
                    "requiredRuntimePublicationBinding",
                    mutation_contract["requiredAudienceSurfaceRuntimeBindingRef"],
                ),
                (
                    "requiredReleaseFreezeValidation",
                    f"current_release_approval_freeze::{RELEASE_APPROVAL_FREEZE_REF}",
                ),
                ("requiredChannelFreezeValidation", CHANNEL_FREEZE_VALIDATION),
                ("requiredParityValidation", PARITY_VALIDATION),
                (
                    "allowedCommandSettlementResults",
                    config["allowed_command_settlement_results"],
                ),
                (
                    "declinedScopeDisposition",
                    config["declined_scope_disposition"],
                ),
                (
                    "staleRecoverableDisposition",
                    config["stale_recoverable_disposition"],
                ),
                (
                    "sameShellRecoveryEnvelopeRef",
                    config["same_shell_recovery_envelope_ref"],
                ),
                ("mustWriteCommandActionRecord", "yes"),
                ("mustWriteCommandSettlementRecord", "yes"),
                (
                    "authorityReconstructionForbiddenFrom",
                    AUTHORITATIVE_RECONSTRUCTION_FORBIDDEN,
                ),
                (
                    "ambiguousTargetDisposition",
                    AMBIGUOUS_TARGET_DISPOSITION,
                ),
                (
                    "partialTupleDisposition",
                    config["partial_tuple_disposition"],
                ),
                (
                    "source_refs",
                    config["source_refs"]
                    + [
                        f"data/analysis/frontend_contract_manifests.json#{mutation_contract['mutationCommandContractId']}",
                        f"data/analysis/route_to_scope_requirements.csv#{route_scope['route_scope_requirement_id']}",
                        f"data/analysis/gateway_route_family_matrix.csv#{route_family}",
                    ],
                ),
                ("rationale", config["rationale"]),
            ]
        )
        row["routeIntentTupleHash"] = short_hash(route_hash_fields(row))
        rows.append(row)
    return rows


def build_action_scope_matrix(decision_rows: list[dict[str, Any]]) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    seen: set[str] = set()
    for row in decision_rows:
        action_scope = row["actionScope"]
        if action_scope in seen:
            continue
        seen.add(action_scope)
        rows.append(
            OrderedDict(
                [
                    ("actionScope", action_scope),
                    ("audienceSurface", row["audienceSurface"]),
                    ("routeFamily", row["routeFamily"]),
                    ("governingObjectType", row["governingObjectType"]),
                    ("governingObjectRef", row["governingObjectRef"]),
                    ("canonicalObjectDescriptorRef", row["canonicalObjectDescriptorRef"]),
                    ("governingBoundedContextRef", row["governingBoundedContextRef"]),
                    ("parentAnchorRef", row["parentAnchorRef"]),
                    ("requiredContextBoundaryRefs", row["requiredContextBoundaryRefs"]),
                    ("requiredActingContext", row["requiredActingContext"]),
                    ("requiredActingScopeTuple", row["requiredActingScopeTuple"]),
                    ("requiredGrantFamily", row["requiredGrantFamily"]),
                    ("requiredRuntimeBindingRef", row["audienceSurfaceRuntimeBindingRef"]),
                    ("primaryRecoveryEnvelopeRef", row["sameShellRecoveryEnvelopeRef"]),
                    ("source_refs", row["source_refs"]),
                    ("rationale", row["rationale"]),
                ]
            )
        )
    return rows


def build_route_intent_schema(decision_rows: list[dict[str, Any]]) -> dict[str, Any]:
    example_live = decision_rows[0]
    example_recovery = next(row for row in decision_rows if row["bindingState"] == "recovery_only")
    required_fields = [
        "routeIntentId",
        "audienceSurface",
        "shellType",
        "routeFamily",
        "actionScope",
        "governingObjectType",
        "governingObjectRef",
        "canonicalObjectDescriptorRef",
        "governingBoundedContextRef",
        "governingObjectVersionRef",
        "lineageScope",
        "requiredContextBoundaryRefs",
        "parentAnchorRef",
        "subjectRef",
        "grantFamily",
        "sessionEpochRef",
        "subjectBindingVersionRef",
        "actingScopeTupleRequirementRef",
        "audienceSurfaceRuntimeBindingRef",
        "releaseApprovalFreezeRef",
        "channelReleaseFreezeState",
        "requiredAssuranceSliceTrustRefs",
        "routeContractDigestRef",
        "routeIntentTupleHash",
        "bindingState",
        "staleDisposition",
        "recoveryEnvelopeFamily",
        "sourceRefs",
        "rationale",
    ]
    return {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "task_id": TASK_ID,
        "title": "RouteIntentBinding",
        "description": "Canonical route-intent tuple proving exact writable authority for one governed mutation surface.",
        "type": "object",
        "required": required_fields,
        "properties": {
            "routeIntentId": {"type": "string"},
            "audienceSurface": {"type": "string"},
            "shellType": {"type": "string"},
            "routeFamily": {"type": "string"},
            "actionScope": {"type": "string"},
            "governingObjectType": {"type": "string"},
            "governingObjectRef": {"type": "string"},
            "canonicalObjectDescriptorRef": {"type": "string"},
            "governingBoundedContextRef": {"type": "string"},
            "governingObjectVersionRef": {"type": "string"},
            "lineageScope": {"type": "string"},
            "requiredContextBoundaryRefs": {
                "type": "array",
                "items": {"type": "string"},
                "uniqueItems": True,
            },
            "parentAnchorRef": {"type": "string"},
            "subjectRef": {"type": "string"},
            "grantFamily": {"type": "string"},
            "sessionEpochRef": {"type": "string"},
            "subjectBindingVersionRef": {"type": "string"},
            "actingScopeTupleRequirementRef": {"type": "string"},
            "audienceSurfaceRuntimeBindingRef": {"type": "string"},
            "releaseApprovalFreezeRef": {"type": "string"},
            "channelReleaseFreezeState": {
                "type": "string",
                "enum": [
                    "monitoring",
                    "frozen",
                    "kill_switch_active",
                    "rollback_recommended",
                    "released",
                ],
            },
            "requiredAssuranceSliceTrustRefs": {
                "type": "array",
                "items": {"type": "string"},
                "uniqueItems": True,
            },
            "routeContractDigestRef": {"type": "string", "pattern": "^[a-f0-9]{16,64}$"},
            "routeIntentTupleHash": {"type": "string", "pattern": "^[a-f0-9]{16,64}$"},
            "bindingState": {
                "type": "string",
                "enum": ["live", "stale", "superseded", "recovery_only"],
            },
            "staleDisposition": {"type": "string"},
            "recoveryEnvelopeFamily": {"type": "string"},
            "sourceRefs": {
                "type": "array",
                "items": {"type": "string"},
                "minItems": 1,
                "uniqueItems": True,
            },
            "rationale": {"type": "string"},
        },
        "examples": [
            {
                key: value
                for key, value in example_live.items()
                if key not in {
                    "publishedMutationCommandContractRef",
                    "publishedRouteIntentBindingRequirementRef",
                    "publishedRuntimeBindingState",
                    "currentPublishedBrowserPosture",
                    "requiredGrantFamily",
                    "requiredActingContext",
                    "requiredActingScopeTuple",
                    "requiredLineageFenceEpoch",
                    "requiredSafetyEpochValidation",
                    "requiredReachabilityValidation",
                    "requiredRuntimePublicationBinding",
                    "requiredReleaseFreezeValidation",
                    "requiredChannelFreezeValidation",
                    "requiredParityValidation",
                    "allowedCommandSettlementResults",
                    "declinedScopeDisposition",
                    "staleRecoverableDisposition",
                    "sameShellRecoveryEnvelopeRef",
                    "mustWriteCommandActionRecord",
                    "mustWriteCommandSettlementRecord",
                    "authorityReconstructionForbiddenFrom",
                    "ambiguousTargetDisposition",
                    "partialTupleDisposition",
                }
            }
            | {
                "requiredContextBoundaryRefs": example_live["requiredContextBoundaryRefs"],
                "requiredAssuranceSliceTrustRefs": example_live["requiredAssuranceSliceTrustRefs"],
                "sourceRefs": example_live["source_refs"],
            },
            {
                key: value
                for key, value in example_recovery.items()
                if key not in {
                    "publishedMutationCommandContractRef",
                    "publishedRouteIntentBindingRequirementRef",
                    "publishedRuntimeBindingState",
                    "currentPublishedBrowserPosture",
                    "requiredGrantFamily",
                    "requiredActingContext",
                    "requiredActingScopeTuple",
                    "requiredLineageFenceEpoch",
                    "requiredSafetyEpochValidation",
                    "requiredReachabilityValidation",
                    "requiredRuntimePublicationBinding",
                    "requiredReleaseFreezeValidation",
                    "requiredChannelFreezeValidation",
                    "requiredParityValidation",
                    "allowedCommandSettlementResults",
                    "declinedScopeDisposition",
                    "staleRecoverableDisposition",
                    "sameShellRecoveryEnvelopeRef",
                    "mustWriteCommandActionRecord",
                    "mustWriteCommandSettlementRecord",
                    "authorityReconstructionForbiddenFrom",
                    "ambiguousTargetDisposition",
                    "partialTupleDisposition",
                }
            }
            | {
                "requiredContextBoundaryRefs": example_recovery["requiredContextBoundaryRefs"],
                "requiredAssuranceSliceTrustRefs": example_recovery["requiredAssuranceSliceTrustRefs"],
                "sourceRefs": example_recovery["source_refs"],
            },
        ],
    }


def build_command_settlement_schema() -> dict[str, Any]:
    return {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "task_id": TASK_ID,
        "title": "CommandSettlementRecord",
        "description": "Authoritative settlement ledger for one immutable command action chain.",
        "type": "object",
        "required": [
            "settlementId",
            "actionRecordRef",
            "replayDecisionClass",
            "result",
            "processingAcceptanceState",
            "externalObservationState",
            "authoritativeOutcomeState",
            "authoritativeProofClass",
            "settlementRevision",
            "blockingRefs",
            "recordedAt",
        ],
        "properties": {
            "settlementId": {"type": "string"},
            "actionRecordRef": {"type": "string"},
            "replayDecisionClass": {
                "type": "string",
                "enum": ["exact_replay", "semantic_replay", "distinct", "collision_review"],
            },
            "result": {
                "type": "string",
                "enum": [
                    "pending",
                    "applied",
                    "projection_pending",
                    "awaiting_external",
                    "stale_recoverable",
                    "blocked_policy",
                    "denied_scope",
                    "review_required",
                    "reconciliation_required",
                    "failed",
                    "expired",
                ],
            },
            "processingAcceptanceState": {
                "type": "string",
                "enum": [
                    "not_started",
                    "accepted_for_processing",
                    "awaiting_external_confirmation",
                    "externally_accepted",
                    "externally_rejected",
                    "timed_out",
                ],
            },
            "externalObservationState": {
                "type": "string",
                "enum": [
                    "unobserved",
                    "projection_visible",
                    "external_effect_observed",
                    "review_disposition_observed",
                    "recovery_observed",
                    "disputed",
                    "failed",
                    "expired",
                ],
            },
            "authoritativeOutcomeState": {
                "type": "string",
                "enum": [
                    "pending",
                    "projection_pending",
                    "awaiting_external",
                    "review_required",
                    "stale_recoverable",
                    "recovery_required",
                    "reconciliation_required",
                    "settled",
                    "failed",
                    "expired",
                    "superseded",
                ],
            },
            "authoritativeProofClass": {
                "type": "string",
                "enum": [
                    "not_yet_authoritative",
                    "projection_visible",
                    "external_confirmation",
                    "review_disposition",
                    "recovery_disposition",
                ],
            },
            "settlementRevision": {"type": "integer", "minimum": 1},
            "supersedesSettlementRef": {"type": ["string", "null"]},
            "externalEffectRefs": {
                "type": "array",
                "items": {"type": "string"},
                "uniqueItems": True,
            },
            "sameShellRecoveryRef": {"type": ["string", "null"]},
            "projectionVersionRef": {"type": ["string", "null"]},
            "uiTransitionSettlementRef": {"type": ["string", "null"]},
            "projectionVisibilityRef": {"type": ["string", "null"]},
            "auditRecordRef": {"type": ["string", "null"]},
            "blockingRefs": {
                "type": "array",
                "items": {"type": "string"},
                "uniqueItems": True,
            },
            "quietEligibleAt": {"type": ["string", "null"], "format": "date-time"},
            "staleAfterAt": {"type": ["string", "null"], "format": "date-time"},
            "recordedAt": {"type": "string", "format": "date-time"},
        },
        "examples": [
            {
                "settlementId": "CSR_056_EXAMPLE_SETTLED_V1",
                "actionRecordRef": "CAR_056_EXAMPLE_BOOKING_V1",
                "replayDecisionClass": "distinct",
                "result": "applied",
                "processingAcceptanceState": "externally_accepted",
                "externalObservationState": "projection_visible",
                "authoritativeOutcomeState": "settled",
                "authoritativeProofClass": "projection_visible",
                "settlementRevision": 2,
                "supersedesSettlementRef": None,
                "externalEffectRefs": ["bookingTxn://current"],
                "sameShellRecoveryRef": None,
                "projectionVersionRef": "projectionVersion://booking/current",
                "uiTransitionSettlementRef": "uiTransition://booking/current",
                "projectionVisibilityRef": "projectionVisible://booking/current",
                "auditRecordRef": "audit://booking/current",
                "blockingRefs": [],
                "quietEligibleAt": TIMESTAMP,
                "staleAfterAt": None,
                "recordedAt": TIMESTAMP,
            },
            {
                "settlementId": "CSR_056_EXAMPLE_STALE_V1",
                "actionRecordRef": "CAR_056_EXAMPLE_STALE_V1",
                "replayDecisionClass": "distinct",
                "result": "stale_recoverable",
                "processingAcceptanceState": "not_started",
                "externalObservationState": "recovery_observed",
                "authoritativeOutcomeState": "stale_recoverable",
                "authoritativeProofClass": "recovery_disposition",
                "settlementRevision": 1,
                "supersedesSettlementRef": None,
                "externalEffectRefs": [],
                "sameShellRecoveryRef": "RecoveryEnvelope::tuple-rebind",
                "projectionVersionRef": None,
                "uiTransitionSettlementRef": "uiTransition://stale/current",
                "projectionVisibilityRef": "projectionVisible://stale/current",
                "auditRecordRef": "audit://stale/current",
                "blockingRefs": ["routeIntentTupleHash::drifted"],
                "quietEligibleAt": None,
                "staleAfterAt": TIMESTAMP,
                "recordedAt": TIMESTAMP,
            },
        ],
    }


def build_strategy_doc(
    decision_rows: list[dict[str, Any]],
    action_scope_rows: list[dict[str, Any]],
) -> str:
    algorithm_rows = [
        ["1", "Resolve audience surface and route family", "Never infer writable authority from URL shape or cached shell state."],
        ["2", "Resolve acting context and acting-scope tuple", "Patient routes use subject-bound requirements; staff routes require the current seq_054 tuple."],
        ["3", "Resolve current route intent and runtime binding", "Both the route-intent tuple and published runtime binding must agree before writable state loads."],
        ["4", "Validate release, channel, trust, parity, provenance, and recovery posture", "Drift degrades to same-shell recovery, read-only, or blocked."],
        ["5", "Validate grant family, session epoch, subject binding, and fence epoch", "Capability or login success alone is never enough."],
        ["6", "Resolve exactly one governing object and version", "Ambiguous or superseded targets fail closed into disambiguation or reissue."],
        ["7", "Validate safety epoch and urgent or preemption posture", "Safety drift downgrades before dispatch."],
        ["8", "Validate reachability dependencies where applicable", "Message, callback, waitlist, alternative, pharmacy, and repair actions require current reachability authority."],
        ["9", "Write immutable CommandActionRecord", "Every post-submit mutation persists the exact route-intent tuple and governing target."],
        ["10", "Advance one authoritative CommandSettlementRecord", "Transport or HTTP success does not authorize calm success."],
    ]
    gap_rows = [
        ["Route authority is local UI concern", "Closed", "Decision-table rows publish the full tuple and the validator recomputes tuple hashes."],
        ["Capability or login success implies writability", "Closed", "Every row requires grant family, session epoch, subject binding version, runtime binding, and release freeze."],
        ["Transport success stands in for business settlement", "Closed", "Settlement rows separate processing acceptance, observation, and authoritative outcome."],
        ["Parent anchor and governing version are optional", "Closed", "Both are mandatory tuple members and hash inputs."],
        ["Cross-context action can infer authority from launch source", "Closed", "requiredContextBoundaryRefs[] is mandatory on every route row."],
        ["Safety or reachability drift leaves stale CTA live", "Closed", "Decision rows execute safety and reachability validation before dispatch."],
        ["Recovery is a detached error page", "Closed", "Every recoverable or denied result maps to one same-shell recovery envelope."],
    ]
    summary = {
        "routeIntentRows": len(decision_rows),
        "actionScopeCount": len(action_scope_rows),
        "routeFamilyCount": len({row["routeFamily"] for row in decision_rows}),
        "bindingStateCount": len({row["bindingState"] for row in decision_rows}),
        "sameShellRecoveryFamilies": len({row["sameShellRecoveryEnvelopeRef"] for row in decision_rows}),
    }
    return (
        dedent(
            f"""
            # 56 Scoped Mutation Gate Strategy

            ## Summary

            - Route-intent rows: {summary["routeIntentRows"]}
            - Action scopes: {summary["actionScopeCount"]}
            - Route families covered: {summary["routeFamilyCount"]}
            - Binding states modeled: {summary["bindingStateCount"]}
            - Same-shell recovery envelopes: {summary["sameShellRecoveryFamilies"]}

            `ScopedMutationGate` is the sole gateway for post-submit mutation. Every writable route resolves one exact `RouteIntentBinding`, validates one current runtime publication tuple, writes one immutable `CommandActionRecord`, and advances one authoritative `CommandSettlementRecord`. Calm success is legal only when `authoritativeOutcomeState = settled`.

            ## Gate Evaluation Order

            {markdown_table(["Step", "Operation", "Fail-closed effect"], algorithm_rows)}

            ## Gap Closures

            {markdown_table(["Gap", "State", "Control"], gap_rows)}

            ## Assumptions

            {markdown_table(
                ["Assumption", "Statement"],
                [[row["assumptionId"], row["statement"]] for row in ASSUMPTIONS],
            )}
            """
        ).strip()
        + "\n"
    )


def build_route_intent_doc(schema: dict[str, Any], decision_rows: list[dict[str, Any]]) -> str:
    field_rows = [
        [field, description, hash_member, drift_effect]
        for field, description, hash_member, drift_effect in ROUTE_INTENT_FIELD_NOTES
    ]
    state_rows = [
        ["live", "All tuple members, runtime binding, release posture, and acting scope validate together.", "Writable controls may render."],
        ["stale", "A current route exists, but a governing version, fence, or parity dependency drifted.", "Return same-shell stale recovery."],
        ["superseded", "A newer governing tuple or anchor displaced the current route intent.", "Resume or disambiguate in the same shell."],
        ["recovery_only", "Legacy, partial, expired, or policy-blocked tuples may preserve summary only.", "Writable posture is suppressed until reissued."],
    ]
    hash_members = [
        "audienceSurface",
        "shellType",
        "routeFamily",
        "actionScope",
        "governingObjectType",
        "governingObjectRef",
        "canonicalObjectDescriptorRef",
        "governingBoundedContextRef",
        "governingObjectVersionRef",
        "lineageScope",
        "requiredContextBoundaryRefs[]",
        "parentAnchorRef",
        "subjectRef",
        "grantFamily",
        "sessionEpochRef",
        "subjectBindingVersionRef",
        "actingScopeTupleRequirementRef",
        "audienceSurfaceRuntimeBindingRef",
        "releaseApprovalFreezeRef",
        "channelReleaseFreezeState",
        "routeContractDigestRef",
    ]
    sample_rows = [
        [
            row["routeIntentId"],
            row["routeFamily"],
            row["actionScope"],
            row["bindingState"],
            row["routeIntentTupleHash"],
        ]
        for row in decision_rows[:8]
    ]
    return (
        dedent(
            f"""
            # 56 Route Intent Binding Contract

            ## Field Law

            {markdown_table(["Field", "Why It Exists", "Hash Member", "Drift Effect"], field_rows)}

            ## Tuple Hash Members

            The immutable `routeIntentTupleHash` is computed over:

            - {", ".join(hash_members[:7])}
            - {", ".join(hash_members[7:14])}
            - {", ".join(hash_members[14:])}

            Writable authority may be reconstructed only from that full tuple. URL params, detached projection fragments, list-row snapshots, local selected-card state, or browser cache are descriptive only.

            ## Binding State Semantics

            {markdown_table(["State", "Meaning", "Visible Posture"], state_rows)}

            ## Drift Classes

            - Session drift: freeze mutation and reissue the current route intent.
            - Subject-binding drift: preserve the same shell but deny or repair authority in place.
            - Governing-object version drift: reopen through stale recovery or disambiguation.
            - Runtime publication or parity drift: degrade through the declared release recovery or route freeze disposition.
            - Acting-scope drift: deny cross-organisation or support mutation until the current seq_054 tuple is revalidated.
            - Legacy or partial tuple: force `bindingState = recovery_only`.

            ## Sample Tuple Matrix

            {markdown_table(["Route intent", "Route family", "Action scope", "Binding state", "Tuple hash"], sample_rows)}

            ## Validator Hooks

            - The validator recomputes `routeIntentTupleHash` from the exact tuple members.
            - Every row must carry `parentAnchorRef`, `canonicalObjectDescriptorRef`, `governingObjectVersionRef`, `routeContractDigestRef`, and `requiredContextBoundaryRefs[]`.
            - Every row must forbid authority reconstruction from URL params, cached projection fragments, and detached CTA state.
            """
        ).strip()
        + "\n"
    )


def build_settlement_doc(
    settlement_rows: list[dict[str, Any]],
    recovery_rows: list[dict[str, Any]],
) -> str:
    ladder_rows = [
        [
            row["settlementResultId"],
            row["result"],
            row["processingAcceptanceState"],
            row["externalObservationState"],
            row["authoritativeOutcomeState"],
            row["sameShellCalmReturnEligible"],
        ]
        for row in settlement_rows
    ]
    recovery_table_rows = [
        [
            row["resultClass"],
            row["sameShellRecoveryEnvelopeRef"],
            row["nextActionLabel"],
            row["preserveAnchorState"],
        ]
        for row in recovery_rows
    ]
    return (
        dedent(
            f"""
            # 56 Command Settlement And Same-Shell Recovery Rules

            `CommandSettlementRecord.authoritativeOutcomeState` is the only settlement dimension allowed to drive calm success, terminal reassurance, or shell collapse. Processing acceptance and external observation may widen guidance, but they may not stand in for business settlement.

            ## Settlement Ladder

            {markdown_table(
                [
                    "Settlement row",
                    "Result",
                    "Processing acceptance",
                    "External observation",
                    "Authoritative outcome",
                    "Calm return eligible",
                ],
                ladder_rows,
            )}

            ## Recovery Mapping

            {markdown_table(
                ["Result class", "Recovery envelope", "Next action", "Preserve anchor"],
                recovery_table_rows,
            )}

            ## Non-Negotiable Settlement Rules

            - Transport or HTTP success is never authoritative business success.
            - `applied` may still remain `projection_pending`; calm return still stays blocked.
            - `review_required`, `reconciliation_required`, `stale_recoverable`, `blocked_policy`, `denied_scope`, and `expired` must each return one same-shell recovery envelope.
            - Every mutation persists both an action record and a settlement record even when dispatch never starts.
            """
        ).strip()
        + "\n"
    )


def build_action_scope_doc(action_scope_rows: list[dict[str, Any]]) -> str:
    rows = [
        [
            row["actionScope"],
            row["routeFamily"],
            row["governingObjectType"],
            row["requiredActingScopeTuple"],
            row["primaryRecoveryEnvelopeRef"],
        ]
        for row in action_scope_rows
    ]
    return (
        dedent(
            f"""
            # 56 Action Scope And Governing Object Matrix

            {markdown_table(
                ["Action scope", "Route family", "Governing object", "Required acting scope", "Same-shell recovery"],
                rows,
            )}

            ## Interpretation

            - `claim`, `respond_more_info`, `reply_message`, `respond_callback`, `manage_booking`, `accept_waitlist_offer`, `accept_network_alternative`, `pharmacy_choice`, `pharmacy_consent`, `support_repair_action`, and `ops_resilience_action` all resolve one exact governing object.
            - Additional rows for `hub_manage_booking`, `staff_claim_task`, and `pharmacy_console_settlement` preserve the same route-intent law in staff, hub, and servicing-site shells.
            - Every row names the governing bounded context instead of letting the launching shell or contributor context invent authority locally.
            """
        ).strip()
        + "\n"
    )


def build_route_authority_doc(decision_rows: list[dict[str, Any]]) -> str:
    rows = [
        [
            row["routeIntentId"],
            row["audienceSurface"],
            row["routeFamily"],
            row["actionScope"],
            row["bindingState"],
            row["audienceSurfaceRuntimeBindingRef"],
            row["publishedRuntimeBindingState"],
            row["currentPublishedBrowserPosture"],
            row["releaseApprovalFreezeRef"],
        ]
        for row in decision_rows
    ]
    return (
        dedent(
            f"""
            # 56 Route Authority And Runtime Tuple Matrix

            {markdown_table(
                [
                    "Route intent",
                    "Audience surface",
                    "Route family",
                    "Action scope",
                    "Binding state",
                    "Runtime binding ref",
                    "Published binding state",
                    "Current browser posture",
                    "Release freeze ref",
                ],
                rows,
            )}

            ## Read Of The Matrix

            - `bindingState` describes the canonical route-intent tuple, while `published binding state` and `current browser posture` come from the published seq_050 and seq_051 runtime contract pack.
            - This makes it explicit that the current Phase 0 browser posture is still mostly `read_only | recovery_only`, even though the mutation law for future live posture is now fully published and validator-backed.
            - Any route lacking the exact tuple members, exact runtime binding, exact parity, or current freeze posture must stay same-shell but lose calm writable posture.
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
                <title>Vecells Mutation Intent Lab</title>
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
                    --route: #0EA5A4;
                    --settlement: #6E59D9;
                    --warning: #C98900;
                    --blocked: #C24141;
                    --shadow: 0 22px 40px rgba(15, 23, 42, 0.07);
                    font-family: ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
                  }
                  * { box-sizing: border-box; }
                  body {
                    margin: 0;
                    background:
                      radial-gradient(circle at 14% 0%, rgba(53, 89, 230, 0.07), transparent 26%),
                      radial-gradient(circle at 82% 12%, rgba(14, 165, 164, 0.08), transparent 24%),
                      linear-gradient(180deg, #FAFBFE, var(--canvas));
                    color: var(--text);
                  }
                  body[data-reduced-motion="true"] * {
                    transition-duration: 0.01ms !important;
                    animation-duration: 0.01ms !important;
                  }
                  .app { max-width: 1500px; margin: 0 auto; padding: 18px; }
                  .masthead {
                    position: sticky;
                    top: 0;
                    z-index: 20;
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
                  .brand { display: flex; align-items: center; gap: 12px; min-width: 260px; }
                  .mark {
                    width: 42px;
                    height: 42px;
                    border-radius: 14px;
                    border: 1px solid rgba(15, 23, 42, 0.08);
                    background: linear-gradient(180deg, rgba(255,255,255,0.96), rgba(244,246,251,0.96));
                    display: grid;
                    place-items: center;
                    color: var(--primary);
                  }
                  .brand strong { display: block; font-size: 16px; color: var(--text-strong); }
                  .brand small,
                  .metric span,
                  .eyebrow,
                  .label {
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
                    grid-template-columns: 296px minmax(0, 1fr) 396px;
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
                    min-height: 620px;
                  }
                  .panel {
                    padding: 18px;
                    border-radius: 24px;
                    border: 1px solid var(--border-subtle);
                    background: linear-gradient(180deg, rgba(255,255,255,0.97), rgba(244,246,251,0.94));
                  }
                  .braid-grid, .ladder-grid {
                    display: grid;
                    grid-template-columns: minmax(0, 1fr) minmax(280px, 0.42fr);
                    gap: 16px;
                    align-items: stretch;
                  }
                  .braid, .ladder-side {
                    border-radius: 20px;
                    border: 1px solid var(--border-subtle);
                    background: rgba(255,255,255,0.92);
                    padding: 12px;
                  }
                  .braid svg { width: 100%; height: 220px; display: block; }
                  .node { fill: rgba(255,255,255,0.98); stroke-width: 1.5; }
                  .node.route { stroke: rgba(14,165,164,0.46); }
                  .node.scope { stroke: rgba(53,89,230,0.32); }
                  .node.runtime { stroke: rgba(110,89,217,0.36); }
                  .node.settlement { stroke: rgba(110,89,217,0.5); }
                  .node.blocked { stroke: rgba(194,65,65,0.4); }
                  .edge { stroke: rgba(148,163,184,0.88); stroke-width: 1.7; }
                  .svg-label { fill: var(--text-strong); font-size: 11px; font-weight: 600; }
                  .svg-sub { fill: var(--muted); font-size: 10px; }
                  .chip-row, .tuple-list { display: flex; flex-wrap: wrap; gap: 8px; }
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
                  .chip.route { background: rgba(14,165,164,0.14); color: var(--route); }
                  .chip.settlement { background: rgba(110,89,217,0.14); color: var(--settlement); }
                  .chip.warning { background: rgba(201,137,0,0.14); color: var(--warning); }
                  .chip.blocked { background: rgba(194,65,65,0.14); color: var(--blocked); }
                  .decision-list {
                    display: grid;
                    gap: 10px;
                    max-height: 320px;
                    overflow: auto;
                  }
                  .decision-card {
                    padding: 12px 14px;
                    border-radius: 18px;
                    border: 1px solid var(--border-subtle);
                    background: rgba(255,255,255,0.92);
                    cursor: pointer;
                    transition: transform 160ms ease, border-color 120ms ease, box-shadow 160ms ease;
                  }
                  .decision-card:hover,
                  .decision-card:focus-visible,
                  .decision-card[data-selected="true"] {
                    transform: translateY(-1px);
                    border-color: rgba(53,89,230,0.28);
                    box-shadow: 0 14px 28px rgba(53,89,230,0.08);
                    outline: none;
                  }
                  .decision-card strong {
                    display: block;
                    color: var(--text-strong);
                    margin-bottom: 6px;
                  }
                  .lower {
                    display: grid;
                    grid-template-columns: 1.1fr 1fr;
                    gap: 18px;
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
                    transition: background 120ms ease;
                  }
                  .interactive-row:hover,
                  .interactive-row:focus-visible,
                  .interactive-row[data-linked="true"] {
                    background: rgba(53,89,230,0.06);
                    outline: none;
                  }
                  .mono {
                    font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
                    font-size: 12px;
                  }
                  .inspector {
                    position: sticky;
                    top: 94px;
                    padding: 18px;
                    display: grid;
                    gap: 14px;
                  }
                  .inspector-section {
                    padding: 14px;
                    border-radius: 18px;
                    border: 1px solid var(--border-subtle);
                    background: rgba(255,255,255,0.92);
                    display: grid;
                    gap: 8px;
                  }
                  .inspector h2 {
                    margin: 0;
                    font-size: 20px;
                    color: var(--text-strong);
                  }
                  .defect-strip { display: grid; gap: 10px; }
                  .defect-card {
                    padding: 14px;
                    border-radius: 18px;
                    border: 1px solid rgba(194,65,65,0.18);
                    background: rgba(194,65,65,0.06);
                  }
                  @media (max-width: 1280px) {
                    .layout { grid-template-columns: 1fr; }
                    .inspector { position: static; }
                  }
                  @media (max-width: 960px) {
                    .metrics, .lower, .braid-grid, .ladder-grid { grid-template-columns: 1fr; }
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
                    <div class="brand" aria-label="Vecells Mutation Intent Lab">
                      <div class="mark" aria-hidden="true">
                        <svg viewBox="0 0 48 48" width="24" height="24" fill="none">
                          <path d="M10 38V10h8l6 12 6-12h8v28h-8V22l-6 12-6-12v16h-8Z" stroke="currentColor" stroke-width="2.1" />
                        </svg>
                      </div>
                      <div>
                        <small>Vecells</small>
                        <strong>Mutation Intent Lab</strong>
                      </div>
                    </div>
                    <div class="metrics" id="metrics"></div>
                  </header>
                  <main class="layout">
                    <aside class="rail">
                      <div class="filters">
                        <label><span class="label">Audience</span><select id="filter-audience" data-testid="filter-audience"></select></label>
                        <label><span class="label">Route family</span><select id="filter-route-family" data-testid="filter-route-family"></select></label>
                        <label><span class="label">Action scope</span><select id="filter-action-scope" data-testid="filter-action-scope"></select></label>
                        <label><span class="label">Binding state</span><select id="filter-binding-state" data-testid="filter-binding-state"></select></label>
                      </div>
                      <div class="rail-copy">
                        <div class="eyebrow">Authority law</div>
                        <p style="margin:8px 0 0;">
                          Route intent + acting scope + runtime binding must converge before settlement. Same-shell recovery is the fail-closed fallback when that tuple drifts.
                        </p>
                      </div>
                    </aside>
                    <section class="center">
                      <section class="panel" data-testid="authority-braid">
                        <div class="eyebrow">Authority braid</div>
                        <div class="braid-grid">
                          <div class="braid" id="braid-diagram"></div>
                          <div class="braid" id="braid-list"></div>
                        </div>
                      </section>
                      <section class="panel" data-testid="settlement-ladder">
                        <div class="eyebrow">Settlement ladder</div>
                        <div class="ladder-grid">
                          <div class="decision-list" id="decision-list"></div>
                          <div class="ladder-side">
                            <table>
                              <thead>
                                <tr><th>Result</th><th>Authoritative outcome</th><th>Calm</th></tr>
                              </thead>
                              <tbody id="settlement-body"></tbody>
                            </table>
                          </div>
                        </div>
                      </section>
                      <div class="lower">
                        <section class="panel">
                          <div class="eyebrow">Action-scope matrix</div>
                          <table>
                            <thead>
                              <tr><th>Action scope</th><th>Route family</th><th>Governing object</th><th>Recovery</th></tr>
                            </thead>
                            <tbody id="action-scope-body"></tbody>
                          </table>
                        </section>
                        <section class="panel">
                          <div class="eyebrow">Recovery and freeze matrix</div>
                          <table>
                            <thead>
                              <tr><th>Result class</th><th>Recovery envelope</th><th>Next action</th></tr>
                            </thead>
                            <tbody id="recovery-body"></tbody>
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
                    schema: "../../data/analysis/route_intent_binding_schema.json",
                    decisions: "../../data/analysis/scoped_mutation_gate_decision_table.csv",
                    actionScope: "../../data/analysis/action_scope_to_governing_object_matrix.csv",
                    settlement: "../../data/analysis/command_settlement_result_matrix.csv",
                    recovery: "../../data/analysis/mutation_recovery_and_freeze_matrix.csv",
                  };

                  const state = {
                    audience: "all",
                    routeFamily: "all",
                    actionScope: "all",
                    bindingState: "all",
                    selectedRouteIntentId: "",
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

                  function visibleRows() {
                    return state.payload.decisions.filter((row) => {
                      if (state.audience !== "all" && row.audienceSurface !== state.audience) return false;
                      if (state.routeFamily !== "all" && row.routeFamily !== state.routeFamily) return false;
                      if (state.actionScope !== "all" && row.actionScope !== state.actionScope) return false;
                      if (state.bindingState !== "all" && row.bindingState !== state.bindingState) return false;
                      return true;
                    });
                  }

                  function selectedRow() {
                    const rows = visibleRows();
                    if (!rows.length) return null;
                    return rows.find((row) => row.routeIntentId === state.selectedRouteIntentId) || rows[0];
                  }

                  function setSelected(rowId) {
                    state.selectedRouteIntentId = rowId;
                    renderAll();
                  }

                  function populateFilters() {
                    const decisions = state.payload.decisions;
                    const optionMarkup = (value, label) => `<option value="${value}">${label}</option>`;
                    const audiences = ["all", ...new Set(decisions.map((row) => row.audienceSurface))];
                    const routes = ["all", ...new Set(decisions.map((row) => row.routeFamily))];
                    const scopes = ["all", ...new Set(decisions.map((row) => row.actionScope))];
                    const bindingStates = ["all", ...new Set(decisions.map((row) => row.bindingState))];

                    const fields = [
                      ["filter-audience", audiences, state.audience, "All audiences"],
                      ["filter-route-family", routes, state.routeFamily, "All route families"],
                      ["filter-action-scope", scopes, state.actionScope, "All action scopes"],
                      ["filter-binding-state", bindingStates, state.bindingState, "All binding states"],
                    ];

                    for (const [id, values, current, allLabel] of fields) {
                      const element = document.getElementById(id);
                      element.innerHTML = values
                        .map((value) => optionMarkup(value, value === "all" ? allLabel : value))
                        .join("");
                      element.value = current;
                    }
                  }

                  function renderMetrics() {
                    const rows = visibleRows();
                    const routeFamilyCount = new Set(rows.map((row) => row.routeFamily)).size;
                    const actionScopeCount = new Set(rows.map((row) => row.actionScope)).size;
                    const recoverableCount = state.payload.settlement.filter(
                      (row) => row.sameShellRecoveryAllowed === "yes",
                    ).length;
                    const blockedCount = state.payload.settlement.filter((row) =>
                      row.coarseResultClass === "blocked",
                    ).length;
                    const metrics = [
                      ["Route families", routeFamilyCount],
                      ["Action scopes", actionScopeCount],
                      ["Recoverable results", recoverableCount],
                      ["Blocked results", blockedCount],
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

                  function renderDecisionList() {
                    const rows = visibleRows();
                    const selected = selectedRow();
                    const list = document.getElementById("decision-list");
                    list.innerHTML = rows
                      .map(
                        (row) => `
                          <article
                            class="decision-card"
                            tabindex="0"
                            data-testid="decision-card-${toTestId(row.routeIntentId)}"
                            data-selected="${selected && selected.routeIntentId === row.routeIntentId}"
                          >
                            <strong>${row.actionScope}</strong>
                            <div>${row.routeFamily}</div>
                            <div class="chip-row" style="margin-top:8px;">
                              <span class="chip route">${row.bindingState}</span>
                              <span class="chip">${row.governingObjectType}</span>
                              <span class="chip settlement">${row.currentPublishedBrowserPosture}</span>
                            </div>
                            <div class="mono" style="margin-top:8px;">${row.routeIntentTupleHash}</div>
                          </article>
                        `,
                      )
                      .join("");
                    list.querySelectorAll(".decision-card").forEach((card, index) => {
                      card.onclick = () => setSelected(rows[index].routeIntentId);
                      card.onkeydown = (event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          setSelected(rows[index].routeIntentId);
                        }
                        if (event.key === "ArrowDown") {
                          event.preventDefault();
                          const next = rows[(index + 1) % rows.length];
                          setSelected(next.routeIntentId);
                          requestAnimationFrame(() => {
                            document
                              .querySelector(`[data-testid="decision-card-${toTestId(next.routeIntentId)}"]`)
                              ?.focus();
                          });
                        }
                        if (event.key === "ArrowUp") {
                          event.preventDefault();
                          const previous = rows[(index - 1 + rows.length) % rows.length];
                          setSelected(previous.routeIntentId);
                          requestAnimationFrame(() => {
                            document
                              .querySelector(`[data-testid="decision-card-${toTestId(previous.routeIntentId)}"]`)
                              ?.focus();
                          });
                        }
                      };
                    });
                  }

                  function renderBraid() {
                    const row = selectedRow();
                    if (!row) return;
                    document.getElementById("braid-diagram").innerHTML = `
                      <svg viewBox="0 0 640 220" role="img" aria-label="Authority braid diagram">
                        <line class="edge" x1="110" y1="110" x2="250" y2="110" />
                        <line class="edge" x1="270" y1="60" x2="390" y2="110" />
                        <line class="edge" x1="270" y1="160" x2="390" y2="110" />
                        <line class="edge" x1="410" y1="110" x2="540" y2="110" />
                        <rect class="node route" x="30" y="70" rx="18" ry="18" width="160" height="80"></rect>
                        <rect class="node scope" x="200" y="20" rx="18" ry="18" width="140" height="70"></rect>
                        <rect class="node runtime" x="200" y="130" rx="18" ry="18" width="140" height="70"></rect>
                        <rect class="node settlement ${row.bindingState !== "live" ? "blocked" : "settlement"}" x="380" y="70" rx="18" ry="18" width="160" height="80"></rect>
                        <rect class="node ${row.bindingState === "live" ? "route" : "blocked"}" x="530" y="70" rx="18" ry="18" width="90" height="80"></rect>
                        <text class="svg-label" x="50" y="98">Route intent</text>
                        <text class="svg-sub" x="50" y="118">${row.routeFamily}</text>
                        <text class="svg-label" x="220" y="50">Acting scope</text>
                        <text class="svg-sub" x="220" y="69">${row.requiredActingScopeTuple}</text>
                        <text class="svg-label" x="220" y="160">Runtime binding</text>
                        <text class="svg-sub" x="220" y="179">${row.audienceSurfaceRuntimeBindingRef}</text>
                        <text class="svg-label" x="400" y="98">Settlement law</text>
                        <text class="svg-sub" x="400" y="118">${row.sameShellRecoveryEnvelopeRef}</text>
                        <text class="svg-label" x="545" y="98">Outcome</text>
                        <text class="svg-sub" x="545" y="118">${row.bindingState}</text>
                      </svg>
                    `;

                    document.getElementById("braid-list").innerHTML = `
                      <div class="eyebrow">Tuple parity</div>
                      <div class="tuple-list">
                        <span class="chip route">${row.routeIntentId}</span>
                        <span class="chip">${row.routeFamily}</span>
                        <span class="chip">${row.actionScope}</span>
                        <span class="chip settlement">${row.publishedRuntimeBindingState}</span>
                      </div>
                      <div style="margin-top:10px;"><strong>Required context boundaries</strong></div>
                      <div class="mono">${splitList(row.requiredContextBoundaryRefs).join("<br />")}</div>
                      <div style="margin-top:10px;"><strong>Trust refs</strong></div>
                      <div class="mono">${splitList(row.requiredAssuranceSliceTrustRefs).join("<br />")}</div>
                    `;
                  }

                  function renderSettlementBody() {
                    const selected = selectedRow();
                    if (!selected) return;
                    const allowed = new Set(splitList(selected.allowedCommandSettlementResults));
                    document.getElementById("settlement-body").innerHTML = state.payload.settlement
                      .map(
                        (row) => `
                          <tr
                            class="interactive-row"
                            data-testid="settlement-row-${toTestId(row.result)}"
                            data-linked="${allowed.has(row.result)}"
                          >
                            <td>${row.result}</td>
                            <td>${row.authoritativeOutcomeState}</td>
                            <td>${row.sameShellCalmReturnEligible}</td>
                          </tr>
                        `,
                      )
                      .join("");
                  }

                  function renderActionScopeBody() {
                    const selected = selectedRow();
                    const focusScope = selected ? selected.actionScope : "";
                    document.getElementById("action-scope-body").innerHTML = state.payload.actionScope
                      .map(
                        (row) => `
                          <tr
                            class="interactive-row"
                            data-testid="action-scope-row-${toTestId(row.actionScope)}"
                            data-linked="${row.actionScope === focusScope}"
                          >
                            <td class="mono">${row.actionScope}</td>
                            <td>${row.routeFamily}</td>
                            <td>${row.governingObjectType}</td>
                            <td class="mono">${row.primaryRecoveryEnvelopeRef}</td>
                          </tr>
                        `,
                      )
                      .join("");
                  }

                  function renderRecoveryBody() {
                    const selected = selectedRow();
                    if (!selected) return;
                    const focusEnvelope = selected.sameShellRecoveryEnvelopeRef;
                    document.getElementById("recovery-body").innerHTML = state.payload.recovery
                      .map(
                        (row) => `
                          <tr
                            class="interactive-row"
                            data-testid="recovery-row-${toTestId(row.resultClass)}"
                            data-linked="${row.sameShellRecoveryEnvelopeRef === focusEnvelope}"
                          >
                            <td>${row.resultClass}</td>
                            <td class="mono">${row.sameShellRecoveryEnvelopeRef}</td>
                            <td>${row.nextActionLabel}</td>
                          </tr>
                        `,
                      )
                      .join("");
                  }

                  function renderInspector() {
                    const row = selectedRow();
                    if (!row) {
                      document.getElementById("inspector").innerHTML = "<h2>No route intent selected</h2>";
                      return;
                    }
                    const schemaHashFields = state.payload.schema.required
                      .filter((field) => !["sourceRefs", "rationale"].includes(field))
                      .slice(0, 10)
                      .join(", ");
                    document.getElementById("inspector").innerHTML = `
                      <section class="inspector-section">
                        <div class="eyebrow">Selected route intent</div>
                        <h2>${row.actionScope}</h2>
                        <div>${row.rationale}</div>
                        <div class="chip-row">
                          <span class="chip route">${row.bindingState}</span>
                          <span class="chip">${row.governingObjectType}</span>
                          <span class="chip settlement">${row.currentPublishedBrowserPosture}</span>
                        </div>
                      </section>
                      <section class="inspector-section">
                        <div class="eyebrow">Governing tuple</div>
                        <div><strong>Object</strong><div class="mono">${row.governingObjectRef}</div></div>
                        <div><strong>Version</strong><div class="mono">${row.governingObjectVersionRef}</div></div>
                        <div><strong>Parent anchor</strong><div class="mono">${row.parentAnchorRef}</div></div>
                        <div><strong>Tuple hash</strong><div class="mono">${row.routeIntentTupleHash}</div></div>
                      </section>
                      <section class="inspector-section">
                        <div class="eyebrow">Acting scope and runtime</div>
                        <div><strong>Acting scope requirement</strong><div class="mono">${row.actingScopeTupleRequirementRef}</div></div>
                        <div><strong>Required acting tuple</strong><div class="mono">${row.requiredActingScopeTuple}</div></div>
                        <div><strong>Runtime binding</strong><div class="mono">${row.audienceSurfaceRuntimeBindingRef}</div></div>
                        <div><strong>Release freeze</strong><div class="mono">${row.releaseApprovalFreezeRef}</div></div>
                      </section>
                      <section class="inspector-section">
                        <div class="eyebrow">Settlement and recovery</div>
                        <div><strong>Allowed results</strong><div class="mono">${splitList(row.allowedCommandSettlementResults).join("<br />")}</div></div>
                        <div><strong>Same-shell recovery</strong><div class="mono">${row.sameShellRecoveryEnvelopeRef}</div></div>
                        <div><strong>Forbidden authority sources</strong><div>${row.authorityReconstructionForbiddenFrom}</div></div>
                      </section>
                      <section class="inspector-section">
                        <div class="eyebrow">Schema parity</div>
                        <div>Required tuple fields start with: <span class="mono">${schemaHashFields}</span></div>
                      </section>
                    `;
                  }

                  function renderDefects() {
                    const rows = [
                      {
                        id: "legacy-bindings",
                        title: "Legacy partial bindings degrade to recovery_only",
                        value: state.payload.decisions.filter((row) => row.bindingState === "recovery_only").length,
                        detail: "Partial or legacy tuples are still visible, but mutation is suppressed until reissue.",
                      },
                      {
                        id: "ambiguous-target",
                        title: "Ambiguous target always fails closed",
                        value: state.payload.decisions.filter(
                          (row) => row.ambiguousTargetDisposition === "same_shell_disambiguation_or_reissue",
                        ).length,
                        detail: "No row allows heuristic fallback to a second governing object.",
                      },
                      {
                        id: "same-shell-recovery",
                        title: "Every recoverable outcome has same-shell recovery",
                        value: state.payload.recovery.length,
                        detail: "Recoverable denials, freezes, and stale tuples all map to declared envelopes.",
                      },
                    ];
                    document.getElementById("defect-strip").innerHTML = rows
                      .map(
                        (row) => `
                          <article class="defect-card" data-testid="defect-card-${row.id}">
                            <div class="eyebrow">${row.value} governed rows</div>
                            <strong>${row.title}</strong>
                            <div>${row.detail}</div>
                          </article>
                        `,
                      )
                      .join("");
                  }

                  function renderAll() {
                    if (!state.payload) return;
                    const rows = visibleRows();
                    if (rows.length && !rows.some((row) => row.routeIntentId === state.selectedRouteIntentId)) {
                      state.selectedRouteIntentId = rows[0].routeIntentId;
                    }
                    renderMetrics();
                    renderDecisionList();
                    renderBraid();
                    renderSettlementBody();
                    renderActionScopeBody();
                    renderRecoveryBody();
                    renderInspector();
                    renderDefects();
                  }

                  Promise.all([
                    fetch(DATA_PATHS.schema).then((response) => response.json()),
                    fetch(DATA_PATHS.decisions).then((response) => response.text()).then(parseCsv),
                    fetch(DATA_PATHS.actionScope).then((response) => response.text()).then(parseCsv),
                    fetch(DATA_PATHS.settlement).then((response) => response.text()).then(parseCsv),
                    fetch(DATA_PATHS.recovery).then((response) => response.text()).then(parseCsv),
                  ]).then(([schema, decisions, actionScope, settlement, recovery]) => {
                    state.payload = { schema, decisions, actionScope, settlement, recovery };
                    state.selectedRouteIntentId = decisions[0]?.routeIntentId || "";
                    document.body.dataset.reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
                      ? "true"
                      : "false";
                    populateFilters();
                    document.getElementById("filter-audience").onchange = (event) => {
                      state.audience = event.target.value;
                      renderAll();
                    };
                    document.getElementById("filter-route-family").onchange = (event) => {
                      state.routeFamily = event.target.value;
                      renderAll();
                    };
                    document.getElementById("filter-action-scope").onchange = (event) => {
                      state.actionScope = event.target.value;
                      renderAll();
                    };
                    document.getElementById("filter-binding-state").onchange = (event) => {
                      state.bindingState = event.target.value;
                      renderAll();
                    };
                    renderAll();
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
            const HTML_PATH = path.join(ROOT, "docs", "architecture", "56_scoped_mutation_gate_lab.html");
            const DECISION_PATH = path.join(ROOT, "data", "analysis", "scoped_mutation_gate_decision_table.csv");
            const SETTLEMENT_PATH = path.join(ROOT, "data", "analysis", "command_settlement_result_matrix.csv");

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
                  pathname = "/docs/architecture/56_scoped_mutation_gate_lab.html";
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
                    url: `http://127.0.0.1:${address.port}/docs/architecture/56_scoped_mutation_gate_lab.html`,
                  });
                });
              });
            }

            export async function run() {
              assertCondition(fs.existsSync(HTML_PATH), "Scoped mutation gate lab HTML is missing.");
              const decisionRows = parseCsv(fs.readFileSync(DECISION_PATH, "utf8"));
              const settlementRows = parseCsv(fs.readFileSync(SETTLEMENT_PATH, "utf8"));
              assertCondition(decisionRows.length === 16, `Expected 16 decision rows, found ${decisionRows.length}.`);
              assertCondition(settlementRows.length === 10, `Expected 10 settlement rows, found ${settlementRows.length}.`);

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

                await page.locator("[data-testid='filter-audience']").waitFor();
                await page.locator("[data-testid='authority-braid']").waitFor();
                await page.locator("[data-testid='settlement-ladder']").waitFor();
                await page.locator("[data-testid='inspector']").waitFor();

                const initialCards = await page.locator("[data-testid^='decision-card-']").count();
                assertCondition(initialCards === decisionRows.length, `Initial decision-card parity drifted: ${initialCards}`);

                await page.locator("[data-testid='filter-binding-state']").selectOption("recovery_only");
                const recoveryOnlyCards = await page.locator("[data-testid^='decision-card-']").count();
                assertCondition(recoveryOnlyCards === 2, `Recovery-only filter expected 2 cards, found ${recoveryOnlyCards}.`);

                await page.locator("[data-testid='filter-binding-state']").selectOption("all");
                await page.locator("[data-testid='filter-action-scope']").selectOption("claim");
                const claimCards = await page.locator("[data-testid^='decision-card-']").count();
                assertCondition(claimCards === 2, `Claim filter expected 2 cards, found ${claimCards}.`);

                await page.locator("[data-testid='filter-action-scope']").selectOption("all");
                await page.locator("[data-testid='filter-route-family']").selectOption("rf_patient_appointments");
                const appointmentCards = await page.locator("[data-testid^='decision-card-']").count();
                assertCondition(appointmentCards === 3, `Appointment route filter expected 3 cards, found ${appointmentCards}.`);

                const firstCard = page.locator("[data-testid='decision-card-rib-056-patient-manage-booking-v1']");
                await firstCard.focus();
                await page.keyboard.press("ArrowDown");
                const secondSelected = await page
                  .locator("[data-testid='decision-card-rib-056-patient-waitlist-accept-v1']")
                  .getAttribute("data-selected");
                assertCondition(secondSelected === "true", "ArrowDown did not advance decision-card selection.");

                await page.locator("[data-testid='filter-route-family']").selectOption("all");
                const supportCard = page.locator("[data-testid='decision-card-rib-056-support-repair-action-v1']");
                await supportCard.scrollIntoViewIfNeeded();
                await supportCard.click({ force: true });
                const inspectorText = await page.locator("[data-testid='inspector']").innerText();
                assertCondition(
                  inspectorText.includes("ASTR_056_SUPPORT_WORKSPACE_V1") &&
                    inspectorText.includes("AST_054_SUPPORT_WORKSPACE_V1") &&
                    inspectorText.includes("supportMutationAttempt://current"),
                  "Inspector lost support repair tuple detail.",
                );

                const linkedSettlement = await page
                  .locator("[data-testid='settlement-row-review-required']")
                  .getAttribute("data-linked");
                assertCondition(linkedSettlement === "true", "Support repair row failed to link settlement ladder.");

                const linkedRecovery = await page
                  .locator("[data-testid='recovery-row-contact-repair-required']")
                  .getAttribute("data-linked");
                assertCondition(linkedRecovery !== null, "Recovery matrix failed to render contact repair row.");

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
                  const reducedMotion = await reducedPage.locator("body").getAttribute("data-reduced-motion");
                  assertCondition(reducedMotion === "true", "Reduced-motion posture did not activate.");
                } finally {
                  await reducedContext.close();
                }

                const landmarks = await page.locator("header, main, aside, section").count();
                assertCondition(landmarks >= 6, `Expected multiple landmarks, found ${landmarks}.`);
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

            export const scopedMutationGateLabManifest = {
              decisionRows: 16,
              settlementRows: 10,
              coverage: [
                "binding-state filtering",
                "action-scope filtering",
                "same-shell recovery parity",
                "inspector rendering",
                "keyboard navigation",
                "responsive behavior",
                "reduced motion",
              ],
            };
            """
        ).strip()
        + "\n"
    )


def upsert_marked_block(text: str, start_marker: str, end_marker: str, block: str) -> str:
    block = block.strip()
    if start_marker in text and end_marker in text:
        prefix, remainder = text.split(start_marker, 1)
        _, suffix = remainder.split(end_marker, 1)
        return prefix.rstrip() + "\n\n" + block + "\n" + suffix.lstrip("\n")
    return text.rstrip() + "\n\n" + block + "\n"


def build_package_source_block(
    decision_rows: list[dict[str, Any]],
    settlement_rows: list[dict[str, Any]],
    recovery_rows: list[dict[str, Any]],
) -> str:
    return dedent(
        f"""
        {PACKAGE_EXPORTS_START}
        export const scopedMutationGateCatalog = {{
          taskId: "{TASK_ID}",
          visualMode: "{VISUAL_MODE}",
          routeIntentRowCount: {len(decision_rows)},
          actionScopeCount: {len({row["actionScope"] for row in decision_rows})},
          routeFamilyCount: {len({row["routeFamily"] for row in decision_rows})},
          settlementResultCount: {len(settlement_rows)},
          recoveryModeCount: {len(recovery_rows)},
          bindingStates: {json.dumps(sorted({row["bindingState"] for row in decision_rows}))},
          schemaArtifactPaths: [
            "packages/api-contracts/schemas/route-intent-binding.schema.json",
            "packages/api-contracts/schemas/command-settlement-record.schema.json",
          ],
        }} as const;

        export const scopedMutationGateSchemas = [
          {{
            schemaId: "RouteIntentBinding",
            artifactPath: "packages/api-contracts/schemas/route-intent-binding.schema.json",
            generatedByTask: "{TASK_ID}",
          }},
          {{
            schemaId: "CommandSettlementRecord",
            artifactPath: "packages/api-contracts/schemas/command-settlement-record.schema.json",
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
              bootstrapSharedPackage,
              frontendContractManifestCatalog,
              frontendContractManifestSchemas,
              ownedContractFamilies,
              ownedObjectFamilies,
              packageContract,
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
                expect(frontendContractManifestCatalog.browserVisibleRouteFamilyCount).toBe(19);
                expect(frontendContractManifestSchemas).toHaveLength(1);

                const schemaPath = path.join(ROOT, frontendContractManifestSchemas[0].artifactPath);
                expect(fs.existsSync(schemaPath)).toBe(true);
              });

              it("publishes the seq_056 scoped mutation schema surface", () => {
                expect(scopedMutationGateCatalog.taskId).toBe("seq_056");
                expect(scopedMutationGateCatalog.routeIntentRowCount).toBe(16);
                expect(scopedMutationGateCatalog.settlementResultCount).toBe(10);
                expect(scopedMutationGateSchemas).toHaveLength(2);

                for (const schema of scopedMutationGateSchemas) {
                  const schemaPath = path.join(ROOT, schema.artifactPath);
                  expect(fs.existsSync(schemaPath)).toBe(true);
                }
              });
            });
            """
        ).strip()
        + "\n"
    )


def update_api_contract_package(
    decision_rows: list[dict[str, Any]],
    settlement_rows: list[dict[str, Any]],
    recovery_rows: list[dict[str, Any]],
) -> None:
    source = PACKAGE_SOURCE_PATH.read_text()
    source = upsert_marked_block(
        source,
        PACKAGE_EXPORTS_START,
        PACKAGE_EXPORTS_END,
        build_package_source_block(decision_rows, settlement_rows, recovery_rows),
    )
    write_text(PACKAGE_SOURCE_PATH, source.rstrip() + "\n")
    write_text(PACKAGE_TEST_PATH, build_package_public_api_test())

    package = read_json(PACKAGE_PACKAGE_JSON_PATH)
    exports = package.setdefault("exports", {})
    exports["./schemas/frontend-contract-manifest.schema.json"] = "./schemas/frontend-contract-manifest.schema.json"
    exports["./schemas/route-intent-binding.schema.json"] = "./schemas/route-intent-binding.schema.json"
    exports["./schemas/command-settlement-record.schema.json"] = "./schemas/command-settlement-record.schema.json"
    write_json(PACKAGE_PACKAGE_JSON_PATH, package)


def update_root_package() -> None:
    package = read_json(ROOT_PACKAGE_PATH)
    package.setdefault("scripts", {}).update(ROOT_SCRIPT_UPDATES)
    write_json(ROOT_PACKAGE_PATH, package)


def update_playwright_package() -> None:
    package = read_json(PLAYWRIGHT_PACKAGE_PATH)
    package["description"] = (
        "Foundation, runtime topology, gateway, event, FHIR, frontend manifest, release parity, "
        "design contract, audit ledger, scope/isolation, lifecycle coordinator, and scoped mutation "
        "gate browser checks."
    )
    package["scripts"] = PLAYWRIGHT_SCRIPT_UPDATES
    write_json(PLAYWRIGHT_PACKAGE_PATH, package)


def patch_engineering_builder() -> None:
    text = ENGINEERING_BUILDER_PATH.read_text()
    text = text.replace(
        "python3 ./tools/analysis/build_lifecycle_coordinator_rules.py && "
        "python3 ./tools/analysis/build_engineering_standards.py && pnpm format",
        "python3 ./tools/analysis/build_lifecycle_coordinator_rules.py && "
        "python3 ./tools/analysis/build_scoped_mutation_gate_rules.py && "
        "python3 ./tools/analysis/build_engineering_standards.py && pnpm format",
    )
    text = text.replace(
        "pnpm validate:tenant-scope && pnpm validate:lifecycle && pnpm validate:scaffold",
        "pnpm validate:tenant-scope && pnpm validate:lifecycle && pnpm validate:mutation-gate && pnpm validate:scaffold",
    )
    text = text.replace(
        '"validate:lifecycle": "python3 ./tools/analysis/validate_lifecycle_coordinator_rules.py",\n'
        '    "validate:standards": "python3 ./tools/analysis/validate_engineering_standards.py",',
        '"validate:lifecycle": "python3 ./tools/analysis/validate_lifecycle_coordinator_rules.py",\n'
        '    "validate:mutation-gate": "python3 ./tools/analysis/validate_scoped_mutation_gate.py",\n'
        '    "validate:standards": "python3 ./tools/analysis/validate_engineering_standards.py",',
    )
    ENGINEERING_BUILDER_PATH.write_text(text)


def main() -> None:
    context = load_context()
    decision_rows = build_decision_rows(context)
    action_scope_rows = build_action_scope_matrix(decision_rows)
    route_intent_schema = build_route_intent_schema(decision_rows)
    command_settlement_schema = build_command_settlement_schema()

    write_json(ROUTE_INTENT_SCHEMA_PATH, route_intent_schema)
    write_json(PACKAGE_ROUTE_INTENT_SCHEMA_PATH, route_intent_schema)
    write_json(PACKAGE_SETTLEMENT_SCHEMA_PATH, command_settlement_schema)
    write_csv(DECISION_TABLE_PATH, DECISION_TABLE_COLUMNS, decision_rows)
    write_csv(ACTION_SCOPE_MATRIX_PATH, list(action_scope_rows[0].keys()), action_scope_rows)
    write_csv(SETTLEMENT_MATRIX_PATH, list(SETTLEMENT_RESULT_ROWS[0].keys()), SETTLEMENT_RESULT_ROWS)
    write_csv(RECOVERY_MATRIX_PATH, list(RECOVERY_ROWS[0].keys()), RECOVERY_ROWS)

    write_text(STRATEGY_DOC_PATH, build_strategy_doc(decision_rows, action_scope_rows))
    write_text(ROUTE_INTENT_DOC_PATH, build_route_intent_doc(route_intent_schema, decision_rows))
    write_text(SETTLEMENT_DOC_PATH, build_settlement_doc(SETTLEMENT_RESULT_ROWS, RECOVERY_ROWS))
    write_text(ACTION_SCOPE_DOC_PATH, build_action_scope_doc(action_scope_rows))
    write_text(ROUTE_AUTHORITY_DOC_PATH, build_route_authority_doc(decision_rows))
    write_text(LAB_PATH, build_lab_html())
    write_text(SPEC_PATH, build_spec())

    update_api_contract_package(decision_rows, SETTLEMENT_RESULT_ROWS, RECOVERY_ROWS)
    update_root_package()
    update_playwright_package()
    patch_engineering_builder()

    print(
        "seq_056 scoped mutation gate artifacts generated: "
        f"{len(decision_rows)} decision rows, "
        f"{len(action_scope_rows)} action-scope rows, "
        f"{len(SETTLEMENT_RESULT_ROWS)} settlement rows, "
        f"{len(RECOVERY_ROWS)} recovery rows."
    )


if __name__ == "__main__":
    main()
