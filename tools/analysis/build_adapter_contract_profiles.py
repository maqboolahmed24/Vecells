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

DEGRADED_DEFAULTS_PATH = DATA_DIR / "degraded_mode_defaults.json"
SIMULATOR_MANIFEST_PATH = DATA_DIR / "adapter_simulator_contract_manifest.json"
RUNTIME_WORKLOADS_PATH = DATA_DIR / "runtime_workload_families.json"
TRUST_BOUNDARIES_PATH = DATA_DIR / "trust_zone_boundaries.json"
FHIR_CONTRACTS_PATH = DATA_DIR / "fhir_representation_contracts.json"
FHIR_EXCHANGE_PATH = DATA_DIR / "fhir_exchange_bundle_policies.json"
ROUTE_SCOPE_PATH = DATA_DIR / "route_to_scope_requirements.csv"
GATEWAY_MATRIX_PATH = DATA_DIR / "gateway_route_family_matrix.csv"
FRONTEND_MANIFEST_PATH = DATA_DIR / "frontend_contract_manifests.json"
RETRY_MATRIX_PATH = DATA_DIR / "browser_automation_retry_matrix.json"

PROFILE_JSON_PATH = DATA_DIR / "adapter_contract_profile_template.json"
DEGRADATION_JSON_PATH = DATA_DIR / "dependency_degradation_profiles.json"
EFFECT_MATRIX_PATH = DATA_DIR / "adapter_effect_family_matrix.csv"
SIMULATOR_MATRIX_PATH = DATA_DIR / "simulator_vs_live_adapter_matrix.csv"

STRATEGY_DOC_PATH = DOCS_DIR / "57_adapter_contract_profile_template.md"
DEGRADATION_DOC_PATH = DOCS_DIR / "57_dependency_degradation_profile_strategy.md"
MOCK_DOC_PATH = DOCS_DIR / "57_mock_now_vs_actual_provider_strategy.md"
MATRIX_DOC_PATH = DOCS_DIR / "57_provider_binding_and_effect_family_matrix.md"
STUDIO_PATH = DOCS_DIR / "57_adapter_contract_studio.html"

PACKAGE_PROFILE_SCHEMA_PATH = PACKAGE_SCHEMA_DIR / "adapter-contract-profile.schema.json"
PACKAGE_DEGRADATION_SCHEMA_PATH = PACKAGE_SCHEMA_DIR / "dependency-degradation-profile.schema.json"

VALIDATOR_PATH = ROOT / "tools" / "analysis" / "validate_adapter_contract_profiles.py"
SPEC_PATH = TESTS_DIR / "adapter-contract-studio.spec.js"
ROOT_PACKAGE_PATH = ROOT / "package.json"
PLAYWRIGHT_PACKAGE_PATH = TESTS_DIR / "package.json"
ENGINEERING_BUILDER_PATH = ROOT / "tools" / "analysis" / "build_engineering_standards.py"

PACKAGE_EXPORTS_START = "// seq_057_adapter_contract_profile_exports:start"
PACKAGE_EXPORTS_END = "// seq_057_adapter_contract_profile_exports:end"

TASK_ID = "seq_057"
VISUAL_MODE = "Adapter_Contract_Studio"
TIMESTAMP = datetime.now(timezone.utc).replace(microsecond=0).isoformat()
CAPTURED_ON = TIMESTAMP[:10]
MISSION = (
    "Define the canonical external-boundary contract pack so every provider-shaped dependency "
    "executes through one published AdapterContractProfile, one bounded DependencyDegradationProfile, "
    "one simulator-first execution plan, and one later live-cutover checklist rather than transport-local "
    "assumptions, vendor switches, or worker-specific replay rules."
)

SOURCE_PRECEDENCE = [
    "prompt/057.md",
    "prompt/shared_operating_contract_056_to_065.md",
    "prompt/AGENT.md",
    "prompt/checklist.md",
    "blueprint/platform-runtime-and-release-blueprint.md#DependencyDegradationProfile",
    "blueprint/platform-runtime-and-release-blueprint.md#AdapterContractProfile",
    "blueprint/platform-runtime-and-release-blueprint.md#Runtime topology contract",
    "blueprint/phase-0-the-foundation-protocol.md#1.13B BookingProviderAdapterBinding",
    "blueprint/phase-0-the-foundation-protocol.md#1.23B AdapterDispatchAttempt",
    "blueprint/phase-0-the-foundation-protocol.md#1.23C AdapterReceiptCheckpoint",
    "blueprint/phase-0-the-foundation-protocol.md#2.9 ExceptionOrchestrator",
    "blueprint/phase-0-the-foundation-protocol.md#6.6A Adapter outbox, inbox, and callback replay rule",
    "blueprint/phase-cards.md#Cross-Phase Conformance Scorecard",
    "blueprint/phase-cards.md#0B. Foundation kernel, control plane, and hard invariants",
    "blueprint/phase-4-the-booking-engine.md#4B. Provider capability matrix and adapter seam",
    "blueprint/phase-5-the-network-horizon.md#Backend work",
    "blueprint/phase-6-the-pharmacy-loop.md#6C. Pharmacy discovery, provider choice, and directory abstraction",
    "blueprint/phase-6-the-pharmacy-loop.md#6D. Referral pack composer, dispatch adapters, and transport contract",
    "blueprint/callback-and-clinician-messaging-loop.md#Telephony callback and message replay law",
    "blueprint/forensic-audit-findings.md#Finding 74",
    "blueprint/forensic-audit-findings.md#Finding 97",
    "data/analysis/degraded_mode_defaults.json",
    "data/analysis/runtime_topology_manifest.json",
    "data/analysis/trust_zone_boundaries.json",
    "data/analysis/fhir_representation_contracts.json",
    "data/analysis/fhir_exchange_bundle_policies.json",
    "data/analysis/adapter_simulator_contract_manifest.json",
    "data/analysis/frontend_contract_manifests.json",
    "data/analysis/route_intent_binding_schema.json",
]

ROOT_SCRIPT_UPDATES = {
    "bootstrap": (
        "pnpm install && node ./tools/dev-bootstrap/index.mjs && pnpm codegen && "
        "pnpm validate:topology && pnpm validate:runtime-topology && pnpm validate:gateway-surface && "
        "pnpm validate:events && pnpm validate:fhir && pnpm validate:frontend && "
        "pnpm validate:release-parity && pnpm validate:design-publication && pnpm validate:audit-worm && "
        "pnpm validate:tenant-scope && pnpm validate:lifecycle && pnpm validate:mutation-gate && "
        "pnpm validate:adapter-contracts && pnpm validate:scaffold && pnpm validate:services && "
        "pnpm validate:domains && pnpm validate:standards"
    ),
    "check": (
        "pnpm lint && pnpm format:check && pnpm typecheck && pnpm test && "
        "pnpm validate:topology && pnpm validate:runtime-topology && pnpm validate:gateway-surface && "
        "pnpm validate:events && pnpm validate:fhir && pnpm validate:frontend && "
        "pnpm validate:release-parity && pnpm validate:design-publication && pnpm validate:audit-worm && "
        "pnpm validate:tenant-scope && pnpm validate:lifecycle && pnpm validate:mutation-gate && "
        "pnpm validate:adapter-contracts && pnpm validate:scaffold && pnpm validate:services && "
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
        "python3 ./tools/analysis/build_engineering_standards.py && pnpm format"
    ),
    "validate:adapter-contracts": "python3 ./tools/analysis/validate_adapter_contract_profiles.py",
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
        "node --check adapter-contract-studio.spec.js"
    ),
    "lint": (
        "eslint foundation-shell-gallery.spec.js runtime-topology-atlas.spec.js "
        "gateway-surface-studio.spec.js event-registry-studio.spec.js "
        "fhir-representation-atlas.spec.js frontend-contract-studio.spec.js "
        "release-parity-cockpit.spec.js design-contract-studio.spec.js "
        "audit-ledger-explorer.spec.js scope-isolation-atlas.spec.js "
        "lifecycle-coordinator-lab.spec.js scoped-mutation-gate-lab.spec.js "
        "adapter-contract-studio.spec.js"
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
        "node adapter-contract-studio.spec.js"
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
        "node --check adapter-contract-studio.spec.js"
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
        "node adapter-contract-studio.spec.js --run"
    ),
}

ROUTE_GROUPS = {
    "identity_access": ["rf_patient_secure_link_recovery"],
    "communications": ["rf_patient_messages", "rf_support_replay_observe"],
    "evidence_processing": ["rf_patient_health_record", "rf_operations_drilldown"],
    "gp_booking": ["rf_patient_appointments", "rf_hub_case_management"],
    "messaging_transport": ["rf_patient_messages", "rf_hub_case_management"],
    "pharmacy": ["rf_pharmacy_console", "rf_patient_appointments"],
    "embedded_channels": ["rf_patient_embedded_channel", "rf_patient_secure_link_recovery"],
    "assurance_watch": ["rf_operations_board", "rf_governance_shell"],
}

FAMILY_DEFAULTS: dict[str, dict[str, Any]] = {
    "identity_access": {
        "bindingFamily": "IdentityBoundaryAdapterBinding",
        "requiredTrustZoneBoundaryRef": "tzb_application_core_to_integration_perimeter",
        "integrationWorkloadFamilyRef": "wf_integration_dispatch",
        "supportedActionScopes": ["claim", "support_repair_action"],
        "manualReviewFallbackRef": "MRF_057_SUPPORT_ASSISTED_IDENTITY_RECOVERY_V1",
        "outboxCheckpointPolicyRef": "OCP_057_IDENTITY_BRIDGE_OUTBOX_V1",
        "receiptOrderingPolicyRef": "ROP_057_IDENTITY_CALLBACK_ORDER_V1",
        "callbackCorrelationPolicyRef": "CCP_057_IDENTITY_STATE_NONCE_V1",
        "duplicateDispositionRef": "DUPDISP_057_IDENTITY_CALLBACK_REPLAY_V1",
        "collisionDispositionRef": "COLDISP_057_IDENTITY_SUBJECT_MISMATCH_REVIEW_V1",
        "transportAcceptanceTruth": "supporting_only",
        "proofLadder": [
            "dispatch: redirect or lookup request issued",
            "receipt: callback or response correlated to the same fence",
            "observation: session or enrichment decision recorded on the same subject lineage",
            "settlement: writable authority or bounded recovery settled",
        ],
        "mockAuthModel": "Opaque session twin with deterministic state/nonce and subject binding versions.",
        "callbackPattern": "Replay-safe browser callback plus same-fence session establishment.",
        "faultInjectionCases": [
            "callback_replay",
            "subject_mismatch",
            "consent_declined",
        ],
        "seededFixtures": ["identity_subject_catalog", "grant_scope_envelopes", "route_intent_fixtures"],
        "observabilityHooks": ["auth.callback.accepted", "auth.callback.replayed", "identity.binding.blocked"],
        "securityPosture": "Vault-backed redirect secrets later; simulator secrets remain local and synthetic now.",
        "rollbackMode": "Withdraw live callback tuple and return immediately to simulator-backed recovery mode.",
        "severity": "critical",
        "assuranceTrustEffect": "slice_degraded",
        "topologyFallbackMode": "gateway_read_only",
        "queueingMode": "hold_authority_until_proven",
        "manualReviewMode": "support_identity_repair",
        "freezeMode": "same_shell_recovery_only",
        "impactedWorkloadFamilyRefs": ["wf_command_orchestration", "wf_projection_read_models", "wf_integration_dispatch"],
        "maximumEscalationFamilyRefs": ["wf_command_orchestration", "wf_projection_read_models", "wf_assurance_security_control"],
    },
    "communications": {
        "bindingFamily": "MessageDispatchEnvelope",
        "requiredTrustZoneBoundaryRef": "tzb_application_core_to_integration_perimeter",
        "integrationWorkloadFamilyRef": "wf_integration_dispatch",
        "supportedActionScopes": ["reply_message", "respond_callback", "support_repair_action"],
        "manualReviewFallbackRef": "MRF_057_COMMUNICATIONS_REPAIR_REVIEW_V1",
        "outboxCheckpointPolicyRef": "OCP_057_MESSAGE_OUTBOX_V1",
        "receiptOrderingPolicyRef": "ROP_057_MESSAGE_RECEIPT_ORDER_V1",
        "callbackCorrelationPolicyRef": "CCP_057_MESSAGE_PROVIDER_EVENT_CORRELATION_V1",
        "duplicateDispositionRef": "DUPDISP_057_MESSAGE_RECEIPT_REPLAY_V1",
        "collisionDispositionRef": "COLDISP_057_MESSAGE_PROVIDER_EVENT_COLLISION_V1",
        "transportAcceptanceTruth": "supporting_only",
        "proofLadder": [
            "dispatch: message or call request checkpointed to the outbox",
            "receipt: provider callback accepted through AdapterReceiptCheckpoint",
            "observation: delivery or recording observation joins the same fence",
            "settlement: message truth or callback state settles with explicit proof",
        ],
        "mockAuthModel": "Simulator-issued endpoint and webhook credentials with replay-safe event IDs.",
        "callbackPattern": "Webhook or callback ingestion always replays onto the same provider correlation fence.",
        "faultInjectionCases": [
            "duplicate_delivery",
            "webhook_replay",
            "unknown_recipient",
            "delivery_timeout",
        ],
        "seededFixtures": ["message_dispatch_rows", "delivery_event_sequences", "callback_contact_routes"],
        "observabilityHooks": ["adapter.dispatch.accepted", "adapter.receipt.replayed", "delivery.disputed"],
        "securityPosture": "Secrets later come from provider vault material; simulator webhooks stay deterministic and synthetic.",
        "rollbackMode": "Disable live webhook entry and continue from simulator-backed resend and repair drills.",
        "severity": "critical",
        "assuranceTrustEffect": "slice_degraded",
        "topologyFallbackMode": "integration_queue_only",
        "queueingMode": "queue_until_receipt_or_manual_review",
        "manualReviewMode": "communications_repair_window",
        "freezeMode": "same_shell_repair_only",
        "impactedWorkloadFamilyRefs": ["wf_integration_dispatch", "wf_projection_read_models"],
        "maximumEscalationFamilyRefs": ["wf_command_orchestration", "wf_projection_read_models", "wf_assurance_security_control"],
    },
    "evidence_processing": {
        "bindingFamily": "EvidenceProcessingAdapterBinding",
        "requiredTrustZoneBoundaryRef": "tzb_application_core_to_integration_perimeter",
        "integrationWorkloadFamilyRef": "wf_integration_dispatch",
        "supportedActionScopes": ["ops_resilience_action", "support_repair_action"],
        "manualReviewFallbackRef": "MRF_057_EVIDENCE_MANUAL_REVIEW_V1",
        "outboxCheckpointPolicyRef": "OCP_057_EVIDENCE_PROCESSING_OUTBOX_V1",
        "receiptOrderingPolicyRef": "ROP_057_EVIDENCE_PROCESSING_RESULT_ORDER_V1",
        "callbackCorrelationPolicyRef": "CCP_057_EVIDENCE_ARTIFACT_CORRELATION_V1",
        "duplicateDispositionRef": "DUPDISP_057_EVIDENCE_DUPLICATE_RESULT_V1",
        "collisionDispositionRef": "COLDISP_057_EVIDENCE_CONFLICTING_RESULT_REVIEW_V1",
        "transportAcceptanceTruth": "supporting_only",
        "proofLadder": [
            "dispatch: artifact or transcript request checkpointed",
            "receipt: provider result receipt matches the same artifact fence",
            "observation: derivative package or scan verdict recorded",
            "settlement: evidence readiness or quarantine posture settles",
        ],
        "mockAuthModel": "Fixture-backed processing queues with seeded artifact and transcript catalogs.",
        "callbackPattern": "Polling or callback ingest joins the same artifact or evidence fence.",
        "faultInjectionCases": ["extractor_timeout", "conflicting_outputs", "malware_detection"],
        "seededFixtures": ["evidence_snapshot_rows", "artifact_hash_catalog", "processing_fault_profiles"],
        "observabilityHooks": ["artifact.scan.accepted", "artifact.scan.quarantined", "transcript.derivation.failed"],
        "securityPosture": "Live provider credentials later require artifact-scope IAM and quarantine-safe storage; mock uses local fixture-only material.",
        "rollbackMode": "Stop live processing adapters and preserve simulator-based quarantine and transcript drills.",
        "severity": "high",
        "assuranceTrustEffect": "slice_degraded",
        "topologyFallbackMode": "projection_stale",
        "queueingMode": "queue_and_hold_projection_release",
        "manualReviewMode": "evidence_processing_review",
        "freezeMode": "read_only_until_review",
        "impactedWorkloadFamilyRefs": ["wf_integration_dispatch", "wf_projection_read_models"],
        "maximumEscalationFamilyRefs": ["wf_projection_read_models", "wf_assurance_security_control"],
    },
    "gp_booking": {
        "bindingFamily": "BookingProviderAdapterBinding",
        "requiredTrustZoneBoundaryRef": "tzb_application_core_to_integration_perimeter",
        "integrationWorkloadFamilyRef": "wf_integration_dispatch",
        "supportedActionScopes": [
            "manage_booking",
            "accept_waitlist_offer",
            "accept_network_alternative",
        ],
        "manualReviewFallbackRef": "MRF_057_BOOKING_ASSISTED_FALLBACK_V1",
        "outboxCheckpointPolicyRef": "OCP_057_BOOKING_PROVIDER_OUTBOX_V1",
        "receiptOrderingPolicyRef": "ROP_057_BOOKING_PROVIDER_RECEIPT_ORDER_V1",
        "callbackCorrelationPolicyRef": "CCP_057_BOOKING_PROVIDER_CORRELATION_V1",
        "duplicateDispositionRef": "DUPDISP_057_BOOKING_PROVIDER_REPLAY_V1",
        "collisionDispositionRef": "COLDISP_057_BOOKING_PROVIDER_COLLISION_REVIEW_V1",
        "transportAcceptanceTruth": "supporting_only",
        "proofLadder": [
            "dispatch: booking or capability command checkpointed with effectKey",
            "receipt: provider callback or authoritative read correlated to the same booking fence",
            "observation: capability or confirmation truth updated without widening calm success early",
            "settlement: booking truth or bounded assisted fallback settles",
        ],
        "mockAuthModel": "Provider twin uses deterministic supplier, practice, and roster tuples only.",
        "callbackPattern": "Search, hold, commit, and manage callbacks replay onto one BookingProviderAdapterBinding hash.",
        "faultInjectionCases": [
            "hold_expiry",
            "capability_gap",
            "confirmation_pending",
            "projection_mismatch",
        ],
        "seededFixtures": ["supplier_roster_rows", "booking_slot_windows", "capacity_feed_snapshots"],
        "observabilityHooks": ["booking.adapter.accepted", "booking.provider.receipt", "booking.provider.collision_review"],
        "securityPosture": "Live supplier credentials later remain estate-scoped and mutation-gated; simulator keeps supplier tuples synthetic.",
        "rollbackMode": "Withdraw live provider binding and revert all booking routes to simulator or assisted fallback mode.",
        "severity": "high",
        "assuranceTrustEffect": "slice_degraded",
        "topologyFallbackMode": "command_halt",
        "queueingMode": "queue_until_authoritative_read_or_manual_fallback",
        "manualReviewMode": "booking_assisted_review",
        "freezeMode": "same_shell_assisted_or_recovery_only",
        "impactedWorkloadFamilyRefs": ["wf_command_orchestration", "wf_integration_dispatch", "wf_projection_read_models"],
        "maximumEscalationFamilyRefs": ["wf_command_orchestration", "wf_projection_read_models", "wf_assurance_security_control"],
    },
    "messaging_transport": {
        "bindingFamily": "PartnerMessageBinding",
        "requiredTrustZoneBoundaryRef": "tzb_application_core_to_integration_perimeter",
        "integrationWorkloadFamilyRef": "wf_integration_dispatch",
        "supportedActionScopes": ["reply_message", "respond_more_info", "support_repair_action"],
        "manualReviewFallbackRef": "MRF_057_MESH_ESCALATION_REVIEW_V1",
        "outboxCheckpointPolicyRef": "OCP_057_SECURE_MESSAGE_OUTBOX_V1",
        "receiptOrderingPolicyRef": "ROP_057_SECURE_MESSAGE_RECEIPT_ORDER_V1",
        "callbackCorrelationPolicyRef": "CCP_057_SECURE_MESSAGE_CORRELATION_V1",
        "duplicateDispositionRef": "DUPDISP_057_SECURE_MESSAGE_REPLAY_V1",
        "collisionDispositionRef": "COLDISP_057_SECURE_MESSAGE_COLLISION_REVIEW_V1",
        "transportAcceptanceTruth": "supporting_only",
        "proofLadder": [
            "dispatch: secure message bundle checkpointed",
            "receipt: transport receipt or callback accepted on the same fence",
            "observation: delivery or acknowledgement evidence recorded without widening business truth early",
            "settlement: routed message or escalation posture settles",
        ],
        "mockAuthModel": "Mailbox simulator uses deterministic ODS, mailbox, and route manager tuples.",
        "callbackPattern": "Receipts and polling both replay to one mailbox or acknowledgement fence.",
        "faultInjectionCases": ["ack_missing", "partial_acceptance", "duplicate_delivery"],
        "seededFixtures": ["mailbox_paths", "partner_ack_sequences", "message_bundle_hashes"],
        "observabilityHooks": ["mesh.dispatch.accepted", "mesh.receipt.replayed", "mesh.delivery.escalated"],
        "securityPosture": "Later live mailbox ownership and manager mode stay explicit; simulator uses local mailbox twins only.",
        "rollbackMode": "Return immediately to simulator-backed secure messaging and manual escalation.",
        "severity": "critical",
        "assuranceTrustEffect": "slice_degraded",
        "topologyFallbackMode": "integration_queue_only",
        "queueingMode": "queue_until_ack_or_escalation",
        "manualReviewMode": "secure_message_escalation_review",
        "freezeMode": "summary_only_until_ack_or_review",
        "impactedWorkloadFamilyRefs": ["wf_integration_dispatch", "wf_projection_read_models"],
        "maximumEscalationFamilyRefs": ["wf_command_orchestration", "wf_projection_read_models", "wf_assurance_security_control"],
    },
    "pharmacy": {
        "bindingFamily": "PharmacyDispatchAdapterBinding",
        "requiredTrustZoneBoundaryRef": "tzb_application_core_to_integration_perimeter",
        "integrationWorkloadFamilyRef": "wf_integration_dispatch",
        "supportedActionScopes": ["pharmacy_choice", "pharmacy_consent", "support_repair_action"],
        "manualReviewFallbackRef": "MRF_057_PHARMACY_MANUAL_FALLBACK_V1",
        "outboxCheckpointPolicyRef": "OCP_057_PHARMACY_DISPATCH_OUTBOX_V1",
        "receiptOrderingPolicyRef": "ROP_057_PHARMACY_PROVIDER_RECEIPT_ORDER_V1",
        "callbackCorrelationPolicyRef": "CCP_057_PHARMACY_PROVIDER_CORRELATION_V1",
        "duplicateDispositionRef": "DUPDISP_057_PHARMACY_PROVIDER_REPLAY_V1",
        "collisionDispositionRef": "COLDISP_057_PHARMACY_PROVIDER_COLLISION_REVIEW_V1",
        "transportAcceptanceTruth": "supporting_only",
        "proofLadder": [
            "dispatch: pharmacy choice or referral package checkpointed",
            "receipt: directory, transport, or outcome callback accepted on the same fence",
            "observation: acknowledgement, outcome, or urgent-return evidence recorded",
            "settlement: pharmacy truth or bounded manual fallback settles",
        ],
        "mockAuthModel": "Directory, transport, and outcome twins use seeded provider and consent tuples.",
        "callbackPattern": "Dispatch receipts, directory refresh, and outcome callbacks collapse onto one pharmacy case fence.",
        "faultInjectionCases": [
            "directory_tuple_drift",
            "transport_timeout",
            "outcome_disputed",
            "urgent_return_required",
        ],
        "seededFixtures": ["pharmacy_directory_rows", "dispatch_envelopes", "pharmacy_outcome_events"],
        "observabilityHooks": ["pharmacy.dispatch.accepted", "pharmacy.outcome.disputed", "pharmacy.urgent_return.required"],
        "securityPosture": "Live access later needs named approver, environment, and urgent-return evidence; simulator stays local and deterministic.",
        "rollbackMode": "Disable live route immediately and continue from simulator or manual pharmacy handoff.",
        "severity": "critical",
        "assuranceTrustEffect": "slice_degraded",
        "topologyFallbackMode": "command_halt",
        "queueingMode": "queue_until_dispatch_or_manual_handoff",
        "manualReviewMode": "pharmacy_dispatch_or_choice_review",
        "freezeMode": "read_only_or_manual_handoff",
        "impactedWorkloadFamilyRefs": ["wf_command_orchestration", "wf_integration_dispatch", "wf_projection_read_models"],
        "maximumEscalationFamilyRefs": ["wf_command_orchestration", "wf_projection_read_models", "wf_assurance_security_control"],
    },
    "embedded_channels": {
        "bindingFamily": "EmbeddedChannelAdapterBinding",
        "requiredTrustZoneBoundaryRef": "tzb_application_core_to_integration_perimeter",
        "integrationWorkloadFamilyRef": "wf_integration_dispatch",
        "supportedActionScopes": ["claim", "support_repair_action"],
        "manualReviewFallbackRef": "MRF_057_EMBEDDED_CHANNEL_RECOVERY_V1",
        "outboxCheckpointPolicyRef": "OCP_057_EMBEDDED_CHANNEL_OUTBOX_V1",
        "receiptOrderingPolicyRef": "ROP_057_EMBEDDED_CHANNEL_CALLBACK_ORDER_V1",
        "callbackCorrelationPolicyRef": "CCP_057_EMBEDDED_CHANNEL_BRIDGE_CORRELATION_V1",
        "duplicateDispositionRef": "DUPDISP_057_EMBEDDED_CHANNEL_REPLAY_V1",
        "collisionDispositionRef": "COLDISP_057_EMBEDDED_CHANNEL_COLLISION_V1",
        "transportAcceptanceTruth": "supporting_only",
        "proofLadder": [
            "dispatch: embedded bridge message prepared against the current site-link tuple",
            "receipt: bridge callback or return observed on the same embedded fence",
            "observation: embedded continuity state updated without widening write authority automatically",
            "settlement: channel-safe continuity or bounded recovery settles",
        ],
        "mockAuthModel": "Embedded bridge twin uses placeholder site-link and signed continuity fixtures.",
        "callbackPattern": "Return callbacks, embedded claims, and site-link evidence replay onto the same bridge fence.",
        "faultInjectionCases": ["site_link_mismatch", "callback_drift", "channel_reentry_conflict"],
        "seededFixtures": ["embedded_site_links", "embedded_claim_paths", "bridge_recovery_routes"],
        "observabilityHooks": ["embedded.bridge.accepted", "embedded.bridge.recovery_only", "embedded.bridge.drifted"],
        "securityPosture": "Live site-link and bridge metadata remain environment-scoped and mutation-gated; simulator uses local placeholders only.",
        "rollbackMode": "Withdraw live embedded metadata and return immediately to the simulator bridge twin.",
        "severity": "high",
        "assuranceTrustEffect": "slice_degraded",
        "topologyFallbackMode": "gateway_read_only",
        "queueingMode": "hold_bridge_until_return_tuple_valid",
        "manualReviewMode": "embedded_channel_repair_review",
        "freezeMode": "same_shell_recovery_only",
        "impactedWorkloadFamilyRefs": ["wf_command_orchestration", "wf_projection_read_models", "wf_integration_dispatch"],
        "maximumEscalationFamilyRefs": ["wf_projection_read_models", "wf_assurance_security_control"],
    },
    "assurance_watch": {
        "bindingFamily": "AssuranceWatchAdapterBinding",
        "requiredTrustZoneBoundaryRef": "tzb_integration_perimeter_to_assurance_security",
        "integrationWorkloadFamilyRef": "wf_integration_dispatch",
        "supportedActionScopes": ["ops_resilience_action"],
        "manualReviewFallbackRef": "MRF_057_ASSURANCE_WATCH_ESCALATION_V1",
        "outboxCheckpointPolicyRef": "OCP_057_ASSURANCE_WATCH_LEDGER_V1",
        "receiptOrderingPolicyRef": "ROP_057_ASSURANCE_SOURCE_ORDER_V1",
        "callbackCorrelationPolicyRef": "CCP_057_ASSURANCE_SOURCE_CORRELATION_V1",
        "duplicateDispositionRef": "DUPDISP_057_ASSURANCE_SOURCE_REPLAY_V1",
        "collisionDispositionRef": "COLDISP_057_ASSURANCE_SOURCE_COLLISION_V1",
        "transportAcceptanceTruth": "supporting_only",
        "proofLadder": [
            "dispatch: watch poll or vendor invocation planned with explicit guardrails",
            "receipt: vendor or standards source response checkpointed",
            "observation: assurance slice verdict or quarantine recommendation recorded",
            "settlement: watch or quarantine posture settles without widening platform truth ad hoc",
        ],
        "mockAuthModel": "Watch-only shadow twins expose deterministic source digests and vendor verdict stubs.",
        "callbackPattern": "Polling or import receipts replay onto one watch tuple and one source digest.",
        "faultInjectionCases": ["source_drift", "quarantine_required", "digest_collision"],
        "seededFixtures": ["assurance_source_snapshots", "assistive_vendor_verdicts", "watch_tuple_rows"],
        "observabilityHooks": ["assurance.watch.drifted", "assistive.vendor.quarantined", "standards.watch.blocked"],
        "securityPosture": "Live vendor and standards calls later remain read-mostly and digest-bound; current watch twins stay synthetic.",
        "rollbackMode": "Disable live watch ingestion and preserve the local watch-cache twins.",
        "severity": "medium",
        "assuranceTrustEffect": "slice_quarantined",
        "topologyFallbackMode": "local_placeholder",
        "queueingMode": "watch_only_no_effect_dispatch",
        "manualReviewMode": "assurance_watch_review",
        "freezeMode": "diagnostic_only",
        "impactedWorkloadFamilyRefs": ["wf_assurance_security_control", "wf_integration_dispatch"],
        "maximumEscalationFamilyRefs": ["wf_assurance_security_control"],
    },
}

PROFILE_OVERRIDES: dict[str, dict[str, Any]] = {
    "dep_nhs_login_rail": {
        "adapterCode": "adp_nhs_login_auth_bridge",
        "effectFamilyId": "fxf_nhs_login_auth_handoff",
        "effectFamilyLabel": "NHS login auth handoff and callback authority",
        "retryPolicyRef": "capture_evidence_then_stop",
        "failureMode": "callback_replay_or_authority_pending",
        "routeFamilyRefs": ["rf_patient_secure_link_recovery"],
        "simulatorContractRef": "sim_nhs_login_auth_session_twin",
        "allowedFhirRepresentationContractRefs": [],
        "allowedFhirExchangeBundleTypes": [],
        "authoritativeProofRulesRef": "APR_057_NHS_LOGIN_SESSION_BINDING_V1",
        "title": "NHS login auth bridge",
    },
    "dep_pds_fhir_enrichment": {
        "adapterCode": "adp_optional_pds_enrichment",
        "effectFamilyId": "fxf_optional_pds_enrichment_lookup",
        "effectFamilyLabel": "Optional PDS enrichment lookup",
        "retryPolicyRef": "human_review_before_continue",
        "failureMode": "legal_basis_off_or_match_ambiguous",
        "routeFamilyRefs": ["rf_patient_secure_link_recovery", "rf_operations_drilldown"],
        "simulatorContractRef": "sim_optional_pds_enrichment_twin",
        "allowedFhirRepresentationContractRefs": [],
        "allowedFhirExchangeBundleTypes": [],
        "authoritativeProofRulesRef": "APR_057_PDS_MATCH_CONFIDENCE_V1",
        "title": "Optional PDS enrichment seam",
        "severity": "watch",
        "liveCutoverState": "permanent_simulator",
    },
    "dep_telephony_ivr_recording_provider": {
        "adapterCode": "adp_telephony_ivr_recording",
        "effectFamilyId": "fxf_telephony_ivr_callback_boundary",
        "effectFamilyLabel": "Telephony IVR, callback, and recording evidence",
        "bindingFamily": "CallbackAttemptRecord",
        "retryPolicyRef": "resume_from_checkpoint_only",
        "failureMode": "webhook_replay_or_recording_missing",
        "routeFamilyRefs": ["rf_intake_telephony_capture", "rf_support_replay_observe"],
        "simulatorContractRef": "sim_telephony_ivr_twin",
        "allowedFhirRepresentationContractRefs": ["FRC_049_CALLBACK_CASE_PARTNER_CALLBACK_CORRELATION_V1"],
        "allowedFhirExchangeBundleTypes": ["collection", "message"],
        "authoritativeProofRulesRef": "APR_057_TELEPHONY_RECORDING_READINESS_V1",
        "title": "Telephony and IVR provider",
    },
    "dep_transcription_processing_provider": {
        "adapterCode": "adp_transcription_processing",
        "effectFamilyId": "fxf_transcription_processing_derivation",
        "effectFamilyLabel": "Transcript and derived-fact processing",
        "retryPolicyRef": "human_review_before_continue",
        "failureMode": "extractor_timeout_or_conflicting_outputs",
        "routeFamilyRefs": ["rf_patient_health_record", "rf_operations_drilldown"],
        "simulatorContractRef": "sim_transcription_processing_twin",
        "allowedFhirRepresentationContractRefs": ["FRC_049_EVIDENCE_SNAPSHOT_CLINICAL_PERSISTENCE_V1"],
        "allowedFhirExchangeBundleTypes": ["document"],
        "authoritativeProofRulesRef": "APR_057_TRANSCRIPTION_DERIVATION_PACKAGE_V1",
        "title": "Transcription processing provider",
    },
    "dep_sms_notification_provider": {
        "adapterCode": "adp_sms_notification_delivery",
        "effectFamilyId": "fxf_sms_notification_delivery",
        "effectFamilyLabel": "SMS delivery and repair evidence",
        "retryPolicyRef": "never_auto_repeat",
        "failureMode": "delivery_disputed_or_recipient_unknown",
        "routeFamilyRefs": ["rf_patient_messages", "rf_support_replay_observe"],
        "simulatorContractRef": "sim_sms_delivery_twin",
        "allowedFhirRepresentationContractRefs": ["FRC_049_MESSAGE_DISPATCH_EXTERNAL_INTERCHANGE_V1"],
        "allowedFhirExchangeBundleTypes": ["message"],
        "authoritativeProofRulesRef": "APR_057_NOTIFICATION_DELIVERY_EVIDENCE_V1",
        "title": "SMS notification provider",
    },
    "dep_email_notification_provider": {
        "adapterCode": "adp_email_notification_delivery",
        "effectFamilyId": "fxf_email_notification_delivery",
        "effectFamilyLabel": "Email delivery and repair evidence",
        "retryPolicyRef": "never_auto_repeat",
        "failureMode": "delivery_disputed_or_recipient_unknown",
        "routeFamilyRefs": ["rf_patient_messages", "rf_support_replay_observe"],
        "simulatorContractRef": "sim_email_notification_twin",
        "allowedFhirRepresentationContractRefs": ["FRC_049_MESSAGE_DISPATCH_EXTERNAL_INTERCHANGE_V1"],
        "allowedFhirExchangeBundleTypes": ["message"],
        "authoritativeProofRulesRef": "APR_057_NOTIFICATION_DELIVERY_EVIDENCE_V1",
        "title": "Email notification provider",
    },
    "dep_malware_scanning_provider": {
        "adapterCode": "adp_malware_artifact_scanning",
        "effectFamilyId": "fxf_malware_artifact_scan",
        "effectFamilyLabel": "Malware and artifact scanning",
        "retryPolicyRef": "human_review_before_continue",
        "failureMode": "scan_timeout_or_quarantine_required",
        "routeFamilyRefs": ["rf_patient_health_record", "rf_operations_drilldown"],
        "simulatorContractRef": "sim_malware_artifact_scan_twin",
        "allowedFhirRepresentationContractRefs": ["FRC_049_EVIDENCE_SNAPSHOT_CLINICAL_PERSISTENCE_V1"],
        "allowedFhirExchangeBundleTypes": ["document"],
        "authoritativeProofRulesRef": "APR_057_MALWARE_VERDICT_CHAIN_V1",
        "title": "Malware scanning provider",
    },
    "dep_im1_pairing_programme": {
        "adapterCode": "adp_im1_pairing_programme_gate",
        "effectFamilyId": "fxf_im1_pairing_programme_gate",
        "effectFamilyLabel": "IM1 pairing and programme gate",
        "retryPolicyRef": "human_review_before_continue",
        "failureMode": "pairing_or_programme_gate_blocked",
        "routeFamilyRefs": ["rf_patient_appointments", "rf_hub_case_management"],
        "simulatorContractRef": "sim_im1_principal_system_emis_twin",
        "allowedFhirRepresentationContractRefs": ["FRC_049_BOOKING_CASE_EXTERNAL_INTERCHANGE_V1"],
        "allowedFhirExchangeBundleTypes": ["message"],
        "authoritativeProofRulesRef": "APR_057_IM1_PAIRING_GATE_V1",
        "title": "IM1 pairing programme boundary",
    },
    "dep_gp_system_supplier_paths": {
        "adapterCode": "adp_gp_supplier_path_resolution",
        "effectFamilyId": "fxf_gp_supplier_path_resolution",
        "effectFamilyLabel": "GP supplier path resolution",
        "retryPolicyRef": "human_review_before_continue",
        "failureMode": "supplier_roster_or_capability_drift",
        "routeFamilyRefs": ["rf_patient_appointments", "rf_hub_case_management"],
        "simulatorContractRef": "sim_im1_principal_system_tpp_twin",
        "allowedFhirRepresentationContractRefs": ["FRC_049_BOOKING_CASE_EXTERNAL_INTERCHANGE_V1"],
        "allowedFhirExchangeBundleTypes": ["message"],
        "authoritativeProofRulesRef": "APR_057_GP_SUPPLIER_CAPABILITY_MATRIX_V1",
        "title": "GP supplier path boundary",
    },
    "dep_local_booking_supplier_adapters": {
        "adapterCode": "adp_local_booking_supplier",
        "effectFamilyId": "fxf_local_booking_commit_and_manage",
        "effectFamilyLabel": "Local booking supplier search, commit, and manage",
        "retryPolicyRef": "resume_from_checkpoint_only",
        "failureMode": "provider_commit_pending_or_hold_expired",
        "routeFamilyRefs": ["rf_patient_appointments", "rf_hub_case_management"],
        "simulatorContractRef": "sim_booking_provider_confirmation_twin",
        "allowedFhirRepresentationContractRefs": [
            "FRC_049_BOOKING_CASE_EXTERNAL_INTERCHANGE_V1",
            "FRC_049_BOOKING_CASE_PARTNER_CALLBACK_CORRELATION_V1",
        ],
        "allowedFhirExchangeBundleTypes": ["message", "collection"],
        "authoritativeProofRulesRef": "APR_057_BOOKING_CONFIRMATION_TRUTH_V1",
        "title": "Local booking supplier adapters",
    },
    "dep_network_capacity_partner_feeds": {
        "adapterCode": "adp_network_capacity_feed",
        "effectFamilyId": "fxf_network_capacity_feed_import",
        "effectFamilyLabel": "Network and hub partner capacity feeds",
        "retryPolicyRef": "safe_read_retry",
        "failureMode": "feed_stale_or_partial_capacity_snapshot",
        "routeFamilyRefs": ["rf_hub_queue", "rf_hub_case_management"],
        "simulatorContractRef": "sim_booking_capacity_feed_twin",
        "allowedFhirRepresentationContractRefs": ["FRC_049_HUB_CASE_EXTERNAL_INTERCHANGE_V1"],
        "allowedFhirExchangeBundleTypes": ["message"],
        "authoritativeProofRulesRef": "APR_057_CAPACITY_SNAPSHOT_FRESHNESS_V1",
        "title": "Network capacity partner feeds",
    },
    "dep_cross_org_secure_messaging_mesh": {
        "adapterCode": "adp_mesh_secure_message",
        "effectFamilyId": "fxf_mesh_secure_message_dispatch",
        "effectFamilyLabel": "Cross-organisation secure message dispatch",
        "retryPolicyRef": "resume_from_checkpoint_only",
        "failureMode": "ack_missing_or_duplicate_delivery",
        "routeFamilyRefs": ["rf_patient_messages", "rf_hub_case_management"],
        "simulatorContractRef": "sim_mesh_message_path_twin",
        "allowedFhirRepresentationContractRefs": [
            "FRC_049_MESSAGE_DISPATCH_EXTERNAL_INTERCHANGE_V1",
            "FRC_049_HUB_CASE_EXTERNAL_INTERCHANGE_V1",
        ],
        "allowedFhirExchangeBundleTypes": ["message", "collection"],
        "authoritativeProofRulesRef": "APR_057_MESH_DELIVERY_EVIDENCE_V1",
        "title": "MESH secure messaging rail",
    },
    "dep_origin_practice_ack_rail": {
        "adapterCode": "adp_origin_practice_ack",
        "effectFamilyId": "fxf_origin_practice_acknowledgement",
        "effectFamilyLabel": "Origin-practice acknowledgement boundary",
        "retryPolicyRef": "human_review_before_continue",
        "failureMode": "acknowledgement_missing_or_scope_drift",
        "routeFamilyRefs": ["rf_patient_appointments", "rf_hub_case_management"],
        "simulatorContractRef": "sim_booking_provider_confirmation_twin",
        "allowedFhirRepresentationContractRefs": [
            "FRC_049_BOOKING_CASE_PARTNER_CALLBACK_CORRELATION_V1",
            "FRC_049_HUB_CASE_PARTNER_CALLBACK_CORRELATION_V1",
        ],
        "allowedFhirExchangeBundleTypes": ["collection", "message"],
        "authoritativeProofRulesRef": "APR_057_ORIGIN_ACK_CALLBACK_PARITY_V1",
        "title": "Origin-practice acknowledgement rail",
    },
    "dep_pharmacy_directory_dohs": {
        "adapterCode": "adp_pharmacy_directory_lookup",
        "effectFamilyId": "fxf_pharmacy_directory_lookup",
        "effectFamilyLabel": "Pharmacy directory and choice lookup",
        "bindingFamily": "PharmacyChoiceAdapterBinding",
        "retryPolicyRef": "safe_read_retry",
        "failureMode": "directory_tuple_drift_or_no_safe_provider",
        "routeFamilyRefs": ["rf_pharmacy_console", "rf_patient_appointments"],
        "simulatorContractRef": "sim_pharmacy_directory_choice_twin",
        "allowedFhirRepresentationContractRefs": ["FRC_049_PHARMACY_CASE_EXTERNAL_INTERCHANGE_V1"],
        "allowedFhirExchangeBundleTypes": ["document"],
        "authoritativeProofRulesRef": "APR_057_PHARMACY_CHOICE_PROOF_V1",
        "title": "Pharmacy directory boundary",
    },
    "dep_pharmacy_referral_transport": {
        "adapterCode": "adp_pharmacy_referral_transport",
        "effectFamilyId": "fxf_pharmacy_dispatch_transport",
        "effectFamilyLabel": "Pharmacy dispatch transport",
        "retryPolicyRef": "resume_from_checkpoint_only",
        "failureMode": "transport_timeout_or_acceptance_without_settlement",
        "routeFamilyRefs": ["rf_pharmacy_console", "rf_patient_appointments"],
        "simulatorContractRef": "sim_pharmacy_dispatch_transport_twin",
        "allowedFhirRepresentationContractRefs": [
            "FRC_049_PHARMACY_CASE_EXTERNAL_INTERCHANGE_V1",
            "FRC_049_PHARMACY_DISPATCH_PARTNER_CALLBACK_CORRELATION_V1",
        ],
        "allowedFhirExchangeBundleTypes": ["message", "document", "collection"],
        "authoritativeProofRulesRef": "APR_057_PHARMACY_DISPATCH_PROOF_V1",
        "title": "Pharmacy referral transport",
    },
    "dep_pharmacy_outcome_observation": {
        "adapterCode": "adp_pharmacy_outcome_observation",
        "effectFamilyId": "fxf_pharmacy_outcome_observation",
        "effectFamilyLabel": "Pharmacy outcome observation",
        "retryPolicyRef": "resume_from_checkpoint_only",
        "failureMode": "outcome_delayed_or_disputed",
        "routeFamilyRefs": ["rf_pharmacy_console", "rf_patient_appointments"],
        "simulatorContractRef": "sim_pharmacy_visibility_update_record_twin",
        "allowedFhirRepresentationContractRefs": ["FRC_049_PHARMACY_DISPATCH_PARTNER_CALLBACK_CORRELATION_V1"],
        "allowedFhirExchangeBundleTypes": ["collection", "message"],
        "authoritativeProofRulesRef": "APR_057_PHARMACY_OUTCOME_OBSERVATION_V1",
        "title": "Pharmacy outcome observation",
    },
    "dep_pharmacy_urgent_return_professional_routes": {
        "adapterCode": "adp_pharmacy_urgent_return_contact",
        "effectFamilyId": "fxf_pharmacy_urgent_return_contact",
        "effectFamilyLabel": "Pharmacy urgent-return professional contact",
        "retryPolicyRef": "human_review_before_continue",
        "failureMode": "urgent_return_required_or_contact_route_disputed",
        "routeFamilyRefs": ["rf_pharmacy_console", "rf_support_ticket_workspace"],
        "simulatorContractRef": "sim_pharmacy_dispatch_transport_twin",
        "allowedFhirRepresentationContractRefs": ["FRC_049_PHARMACY_CASE_EXTERNAL_INTERCHANGE_V1"],
        "allowedFhirExchangeBundleTypes": ["message", "document"],
        "authoritativeProofRulesRef": "APR_057_PHARMACY_URGENT_RETURN_REHEARSAL_V1",
        "title": "Pharmacy urgent-return routes",
    },
    "dep_nhs_app_embedded_channel_ecosystem": {
        "adapterCode": "adp_nhs_app_embedded_bridge",
        "effectFamilyId": "fxf_nhs_app_embedded_channel_bridge",
        "effectFamilyLabel": "NHS App embedded bridge boundary",
        "retryPolicyRef": "capture_evidence_then_stop",
        "failureMode": "site_link_drift_or_embedded_callback_mismatch",
        "routeFamilyRefs": ["rf_patient_embedded_channel", "rf_patient_secure_link_recovery"],
        "simulatorContractRef": "sim_nhs_app_embedded_bridge_twin",
        "allowedFhirRepresentationContractRefs": [],
        "allowedFhirExchangeBundleTypes": [],
        "authoritativeProofRulesRef": "APR_057_EMBEDDED_CHANNEL_CONTINUITY_V1",
        "title": "NHS App embedded ecosystem",
    },
    "dep_assistive_model_vendor_family": {
        "adapterCode": "adp_assistive_model_vendor_watch",
        "effectFamilyId": "fxf_assistive_vendor_watch",
        "effectFamilyLabel": "Assistive model vendor watch and quarantine",
        "retryPolicyRef": "never_auto_repeat",
        "failureMode": "vendor_drift_or_assurance_quarantine",
        "routeFamilyRefs": ["rf_operations_board", "rf_governance_shell"],
        "simulatorContractRef": "sim_assistive_vendor_watch_shadow_twin",
        "allowedFhirRepresentationContractRefs": [],
        "allowedFhirExchangeBundleTypes": [],
        "authoritativeProofRulesRef": "APR_057_ASSISTIVE_VENDOR_QUARANTINE_V1",
        "title": "Assistive vendor watch boundary",
        "liveCutoverState": "watch_only",
    },
    "dep_nhs_assurance_and_standards_sources": {
        "adapterCode": "adp_standards_source_watch",
        "effectFamilyId": "fxf_assurance_standards_watch",
        "effectFamilyLabel": "NHS standards and assurance source watch",
        "retryPolicyRef": "safe_read_retry",
        "failureMode": "standards_digest_stale_or_source_drift",
        "routeFamilyRefs": ["rf_operations_board", "rf_governance_shell"],
        "simulatorContractRef": "sim_assurance_source_watch_cache_twin",
        "allowedFhirRepresentationContractRefs": [],
        "allowedFhirExchangeBundleTypes": [],
        "authoritativeProofRulesRef": "APR_057_STANDARDS_WATCH_DIGEST_V1",
        "title": "NHS standards and assurance source watch",
        "liveCutoverState": "watch_only",
    },
}


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
        for row in rows:
            writer.writerow(row)


def split_refs(value: str) -> list[str]:
    if not value:
        return []
    return [item.strip() for item in value.split(";") if item.strip()]


def slug(value: str) -> str:
    return (
        value.lower()
        .replace("/", "-")
        .replace(" ", "-")
        .replace("_", "-")
        .replace(".", "-")
        .replace(":", "-")
    )


def short_hash(payload: Any) -> str:
    return hashlib.sha256(
        json.dumps(payload, sort_keys=True, separators=(",", ":")).encode("utf-8")
    ).hexdigest()[:16]


def require_prerequisites() -> None:
    for path in [
        DEGRADED_DEFAULTS_PATH,
        SIMULATOR_MANIFEST_PATH,
        RUNTIME_WORKLOADS_PATH,
        TRUST_BOUNDARIES_PATH,
        FHIR_CONTRACTS_PATH,
        FHIR_EXCHANGE_PATH,
        ROUTE_SCOPE_PATH,
        GATEWAY_MATRIX_PATH,
        FRONTEND_MANIFEST_PATH,
        RETRY_MATRIX_PATH,
    ]:
        if not path.exists():
            raise SystemExit(f"PREREQUISITE_GAP_057 missing {path}")


def load_context() -> dict[str, Any]:
    require_prerequisites()
    degraded = read_json(DEGRADED_DEFAULTS_PATH)
    simulators = read_json(SIMULATOR_MANIFEST_PATH)
    runtime = read_json(RUNTIME_WORKLOADS_PATH)
    trust = read_json(TRUST_BOUNDARIES_PATH)
    fhir = read_json(FHIR_CONTRACTS_PATH)
    exchange = read_json(FHIR_EXCHANGE_PATH)
    route_scope_rows = read_csv(ROUTE_SCOPE_PATH)
    gateway_rows = read_csv(GATEWAY_MATRIX_PATH)
    frontend = read_json(FRONTEND_MANIFEST_PATH)
    retry = read_json(RETRY_MATRIX_PATH)

    dependencies = degraded["dependencies"]
    dependency_lookup = {row["dependency_id"]: row for row in dependencies}
    simulator_lookup = {}
    for row in simulators["simulators"]:
        for dependency_id in row["dependency_ids"]:
            simulator_lookup.setdefault(dependency_id, []).append(row)

    route_scope_lookup = {row["route_family_id"]: row for row in route_scope_rows}
    gateway_lookup = {row["route_family_id"]: row for row in gateway_rows}
    mutation_contract_lookup = {
        row["routeFamilyRef"]: row for row in frontend["mutationCommandContracts"]
    }
    frontend_manifest_lookup = {}
    for row in frontend["frontendContractManifests"]:
        for route_family in row["routeFamilyRefs"]:
            frontend_manifest_lookup[route_family] = row

    fhir_contract_lookup = {row["fhirRepresentationContractId"]: row for row in fhir["contracts"]}
    legal_bundle_types = sorted(
        {bundle_type for row in exchange["policies"] for bundle_type in row["legalBundleTypes"]}
    )
    runtime_family_refs = {
        row["runtime_workload_family_ref"] for row in runtime["runtime_workload_families"]
    }
    trust_boundary_ids = {row["trustZoneBoundaryId"] for row in trust["trust_zone_boundaries"]}
    retry_class_ids = {row["class_id"] for row in retry["retry_classes"]}

    return {
        "dependencies": dependencies,
        "dependency_lookup": dependency_lookup,
        "simulator_lookup": simulator_lookup,
        "runtime_family_refs": runtime_family_refs,
        "trust_boundary_ids": trust_boundary_ids,
        "fhir_contract_lookup": fhir_contract_lookup,
        "legal_bundle_types": legal_bundle_types,
        "route_scope_lookup": route_scope_lookup,
        "gateway_lookup": gateway_lookup,
        "mutation_contract_lookup": mutation_contract_lookup,
        "frontend_manifest_lookup": frontend_manifest_lookup,
        "retry_class_ids": retry_class_ids,
        "retry_classes": retry["retry_classes"],
    }


def simulator_for_dependency(context: dict[str, Any], dependency_id: str) -> dict[str, Any] | None:
    rows = context["simulator_lookup"].get(dependency_id, [])
    return rows[0] if rows else None


def route_contract_refs(
    context: dict[str, Any],
    route_family_refs: list[str],
) -> tuple[list[str], list[str], list[str]]:
    runtime_refs: list[str] = []
    trust_refs: list[str] = []
    context_refs: list[str] = []
    for route_family in route_family_refs:
        route_scope_row = context["route_scope_lookup"].get(route_family)
        gateway_row = context["gateway_lookup"].get(route_family)
        if route_scope_row:
            runtime_refs.extend(split_refs(route_scope_row["required_runtime_binding_refs"]))
            trust_refs.extend(split_refs(route_scope_row.get("required_trust_refs", "")))
        if gateway_row:
            context_refs.extend(split_refs(gateway_row["required_context_boundary_refs"]))
    return sorted(set(runtime_refs)), sorted(set(trust_refs)), sorted(set(context_refs))


def default_live_cutover_state(dependency_id: str) -> str:
    return PROFILE_OVERRIDES[dependency_id].get("liveCutoverState", "pending")


def default_current_posture(live_cutover_state: str) -> str:
    if live_cutover_state == "watch_only":
        return "watch_shadow"
    if live_cutover_state == "permanent_simulator":
        return "permanent_simulator"
    return "simulator_backed"


def simulator_backed(dependency_id: str) -> bool:
    return not dependency_id.startswith("dep_nhs_assurance_and_standards_sources") and not dependency_id.startswith(
        "dep_assistive_model_vendor_family"
    )


def build_profile_row(context: dict[str, Any], dependency: dict[str, Any]) -> dict[str, Any]:
    dependency_id = dependency["dependency_id"]
    family = dependency["dependency_family"]
    defaults = dict(FAMILY_DEFAULTS[family])
    overrides = PROFILE_OVERRIDES[dependency_id]
    defaults.update(overrides)

    simulator_row = simulator_for_dependency(context, dependency_id)
    simulator_contract_ref = defaults["simulatorContractRef"]
    live_cutover_state = default_live_cutover_state(dependency_id)
    route_family_refs = defaults["routeFamilyRefs"]
    required_runtime_binding_refs, required_trust_refs, required_context_refs = route_contract_refs(
        context,
        route_family_refs,
    )
    source_refs = list(
        OrderedDict.fromkeys(
            [
                *dependency["source_references"],
                *([simulator_row["source_refs"][0]] if simulator_row and simulator_row.get("source_refs") else []),
                f"data/analysis/route_to_scope_requirements.csv#{route_family_refs[0]}",
                "blueprint/platform-runtime-and-release-blueprint.md#AdapterContractProfile",
                "blueprint/phase-0-the-foundation-protocol.md#1.23B AdapterDispatchAttempt",
                "blueprint/phase-0-the-foundation-protocol.md#1.23C AdapterReceiptCheckpoint",
            ]
        )
    )

    proof_ladder = [
        {
            "stage": stage.split(":")[0],
            "summary": stage.split(": ", 1)[1],
        }
        for stage in defaults["proofLadder"]
    ]
    provider_binding_ref = f"BIND_057_{dependency_id.upper()}_V1"
    degradation_profile_ref = f"DDP_057_{dependency_id.upper()}_PRIMARY_V1"
    effect_family = {
        "effectFamilyId": defaults["effectFamilyId"],
        "label": defaults["effectFamilyLabel"],
        "bindingFamily": defaults["bindingFamily"],
        "bindingRef": provider_binding_ref,
        "authoritativeProofRulesRef": defaults["authoritativeProofRulesRef"],
    }
    allowed_fhir = defaults["allowedFhirRepresentationContractRefs"]
    allowed_bundle_types = defaults["allowedFhirExchangeBundleTypes"]

    return {
        "adapterContractProfileId": f"ACP_057_{dependency_id.upper()}_V1",
        "adapterCode": defaults["adapterCode"],
        "title": defaults["title"],
        "dependencyCode": dependency_id,
        "dependencyName": dependency["dependency_name"],
        "dependencyFamily": family,
        "effectFamilies": [effect_family],
        "supportedActionScopes": defaults["supportedActionScopes"],
        "routeFamilyRefs": route_family_refs,
        "capabilityMatrixRef": f"CAPMAT_057_{dependency_id.upper()}_V1",
        "outboxCheckpointPolicyRef": defaults["outboxCheckpointPolicyRef"],
        "receiptOrderingPolicyRef": defaults["receiptOrderingPolicyRef"],
        "callbackCorrelationPolicyRef": defaults["callbackCorrelationPolicyRef"],
        "idempotencyWindowRef": f"IDEMP_057_{dependency_id.upper()}_V1",
        "duplicateDispositionRef": defaults["duplicateDispositionRef"],
        "collisionDispositionRef": defaults["collisionDispositionRef"],
        "retryPolicyRef": defaults["retryPolicyRef"],
        "dependencyDegradationProfileRef": degradation_profile_ref,
        "integrationWorkloadFamilyRef": defaults["integrationWorkloadFamilyRef"],
        "requiredTrustZoneBoundaryRef": defaults["requiredTrustZoneBoundaryRef"],
        "allowedFhirRepresentationContractRefs": allowed_fhir,
        "allowedFhirExchangeBundleTypes": allowed_bundle_types,
        "authoritativeProofRulesRef": defaults["authoritativeProofRulesRef"],
        "authoritativeProofSummary": dependency["authoritative_success_proof"],
        "manualReviewFallbackRef": defaults["manualReviewFallbackRef"],
        "simulatorContractRef": simulator_contract_ref,
        "liveCutoverChecklistRef": f"LCC_057_{dependency_id.upper()}_V1",
        "updatedAt": TIMESTAMP,
        "bindingFamily": defaults["bindingFamily"],
        "bindingRef": provider_binding_ref,
        "liveCutoverState": live_cutover_state,
        "currentExecutionPosture": default_current_posture(live_cutover_state),
        "transportAcceptanceTruth": defaults["transportAcceptanceTruth"],
        "requiredRuntimeBindingRefs": required_runtime_binding_refs,
        "requiredAssuranceSliceTrustRefs": required_trust_refs,
        "requiredContextBoundaryRefs": required_context_refs,
        "requiredMutationCommandContractRefs": [
            context["mutation_contract_lookup"][route_family]["mutationCommandContractId"]
            for route_family in route_family_refs
            if route_family in context["mutation_contract_lookup"]
        ],
        "requiredFrontendManifestRefs": [
            context["frontend_manifest_lookup"][route_family]["frontendContractManifestId"]
            for route_family in route_family_refs
            if route_family in context["frontend_manifest_lookup"]
        ],
        "mockNowExecution": {
            "mode": "Mock_now_execution",
            "executionWorkloadFamilyRef": "wf_integration_simulation_lab",
            "simulatorAuthModel": defaults["mockAuthModel"],
            "requestResponseSchema": (
                "Use the published route intent, action record, effectKey, and allowed FHIR refs only; "
                "no simulator-local payload widening is permitted."
            ),
            "callbackWebhookPatterns": defaults["callbackPattern"],
            "faultInjectionCases": defaults["faultInjectionCases"],
            "orderingAndReplayBehavior": defaults["receiptOrderingPolicyRef"],
            "seededFixtures": defaults["seededFixtures"],
            "observabilityHooks": defaults["observabilityHooks"],
            "simulatorSourceRef": simulator_contract_ref,
        },
        "actualProviderStrategyLater": {
            "mode": "Actual_provider_strategy_later",
            "executionWorkloadFamilyRef": defaults["integrationWorkloadFamilyRef"],
            "onboardingPrerequisites": (
                simulator_row["required_live_evidence"]
                if simulator_row and simulator_row.get("required_live_evidence")
                else [
                    "Named approver and environment",
                    "Secret posture and callback parity review",
                    "Bounded rollback to simulator-safe mode",
                ]
            ),
            "securitySecretPosture": defaults["securityPosture"],
            "operationalEvidenceRequired": (
                simulator_row["migration_tests"]
                if simulator_row and simulator_row.get("migration_tests")
                else [
                    "Replay parity proof",
                    "Authoritative proof versus transport evidence proof",
                    "Rollback rehearsal",
                ]
            ),
            "contractDifferencesMustRemainBounded": list(
                OrderedDict.fromkeys(
                    (
                        simulator_row["unchanged_contract_elements"]
                        if simulator_row and simulator_row.get("unchanged_contract_elements")
                        else []
                    )
                    + [
                        "Replay and callback ordering stay identical",
                        "Authoritative proof ladder stays identical",
                        "Degradation posture remains bounded",
                    ]
                )
            ),
            "rollbackToSimulatorSafeMode": defaults["rollbackMode"],
            "liveGateSource": simulator_row["live_gate_source"] if simulator_row else "synthetic_watch_shadow",
            "blockedLiveGateIds": simulator_row["blocked_live_gate_ids"] if simulator_row else [],
            "reviewLiveGateIds": simulator_row["review_live_gate_ids"] if simulator_row else [],
        },
        "proofLadder": proof_ladder,
        "sourceRefs": source_refs,
        "rationale": (
            f"{dependency['dependency_name']} stays governed through one adapter profile so transport, callback, "
            "and degradation semantics remain shared across simulator-first and later live-provider execution."
        ),
    }


def build_degradation_row(profile: dict[str, Any], dependency: dict[str, Any]) -> dict[str, Any]:
    return {
        "profileId": profile["dependencyDegradationProfileRef"],
        "dependencyCode": dependency["dependency_id"],
        "dependencyName": dependency["dependency_name"],
        "failureMode": PROFILE_OVERRIDES[dependency["dependency_id"]]["failureMode"],
        "patientFallbackState": dependency["patient_visible_posture_default"],
        "staffFallbackState": dependency["staff_visible_posture_default"],
        "impactedWorkloadFamilyRefs": FAMILY_DEFAULTS[dependency["dependency_family"]]["impactedWorkloadFamilyRefs"],
        "maximumEscalationFamilyRefs": FAMILY_DEFAULTS[dependency["dependency_family"]][
            "maximumEscalationFamilyRefs"
        ],
        "assuranceTrustEffect": profile["actualProviderStrategyLater"]["blockedLiveGateIds"]
        and FAMILY_DEFAULTS[dependency["dependency_family"]]["assuranceTrustEffect"]
        or FAMILY_DEFAULTS[dependency["dependency_family"]]["assuranceTrustEffect"],
        "topologyFallbackMode": FAMILY_DEFAULTS[dependency["dependency_family"]]["topologyFallbackMode"],
        "queueingMode": FAMILY_DEFAULTS[dependency["dependency_family"]]["queueingMode"],
        "manualReviewMode": FAMILY_DEFAULTS[dependency["dependency_family"]]["manualReviewMode"],
        "freezeMode": FAMILY_DEFAULTS[dependency["dependency_family"]]["freezeMode"],
        "retryPolicyRef": profile["retryPolicyRef"],
        "alertThresholdRef": f"ALERT_057_{dependency['dependency_id'].upper()}_V1",
        "recoveryTriggerRef": f"RECOVERY_057_{dependency['dependency_id'].upper()}_V1",
        "severity": profile.get("severity", FAMILY_DEFAULTS[dependency["dependency_family"]]["severity"]),
        "manualFallbackDefault": dependency["manual_fallback_default"],
        "closureBlockerImplications": dependency["closure_blocker_implications"],
        "sourceRefs": list(
            OrderedDict.fromkeys(
                dependency["source_references"]
                + [
                    "blueprint/platform-runtime-and-release-blueprint.md#DependencyDegradationProfile",
                    "data/analysis/degraded_mode_defaults.json",
                ]
            )
        ),
        "rationale": (
            f"{dependency['dependency_name']} is bounded to {FAMILY_DEFAULTS[dependency['dependency_family']]['maximumEscalationFamilyRefs']} "
            "so provider degradation cannot silently widen across the platform."
        ),
    }


def build_effect_matrix_rows(profiles: list[dict[str, Any]]) -> list[dict[str, Any]]:
    rows = []
    for profile in profiles:
        effect = profile["effectFamilies"][0]
        rows.append(
            {
                "effectFamilyId": effect["effectFamilyId"],
                "effectFamilyLabel": effect["label"],
                "adapterContractProfileId": profile["adapterContractProfileId"],
                "adapterCode": profile["adapterCode"],
                "dependencyCode": profile["dependencyCode"],
                "bindingFamily": effect["bindingFamily"],
                "bindingRef": effect["bindingRef"],
                "supportedActionScopes": "; ".join(profile["supportedActionScopes"]),
                "integrationWorkloadFamilyRef": profile["integrationWorkloadFamilyRef"],
                "requiredTrustZoneBoundaryRef": profile["requiredTrustZoneBoundaryRef"],
                "authoritativeProofRulesRef": effect["authoritativeProofRulesRef"],
                "simulatorContractRef": profile["simulatorContractRef"],
                "liveCutoverChecklistRef": profile["liveCutoverChecklistRef"],
                "sourceRefs": "; ".join(profile["sourceRefs"]),
            }
        )
    return rows


def build_simulator_matrix_rows(
    context: dict[str, Any],
    profiles: list[dict[str, Any]],
    degradation_rows: list[dict[str, Any]],
) -> list[dict[str, Any]]:
    degradation_lookup = {row["dependencyCode"]: row for row in degradation_rows}
    rows = []
    for profile in profiles:
        simulator_row = simulator_for_dependency(context, profile["dependencyCode"])
        blocked = profile["actualProviderStrategyLater"]["blockedLiveGateIds"]
        review = profile["actualProviderStrategyLater"]["reviewLiveGateIds"]
        rows.append(
            {
                "adapterContractProfileId": profile["adapterContractProfileId"],
                "adapterCode": profile["adapterCode"],
                "dependencyCode": profile["dependencyCode"],
                "currentExecutionPosture": profile["currentExecutionPosture"],
                "liveCutoverState": profile["liveCutoverState"],
                "simulatorContractRef": profile["simulatorContractRef"],
                "mockExecutionWorkloadFamilyRef": profile["mockNowExecution"]["executionWorkloadFamilyRef"],
                "actualProviderWorkloadFamilyRef": profile["actualProviderStrategyLater"]["executionWorkloadFamilyRef"],
                "mockNowSummary": profile["mockNowExecution"]["callbackWebhookPatterns"],
                "actualProviderSummary": "; ".join(profile["actualProviderStrategyLater"]["onboardingPrerequisites"][:2]),
                "blockedLiveGateCount": len(blocked),
                "reviewLiveGateCount": len(review),
                "degradationSeverity": degradation_lookup[profile["dependencyCode"]]["severity"],
                "sourceRefs": "; ".join(
                    [
                        *profile["sourceRefs"][:3],
                        *(simulator_row["source_refs"][:1] if simulator_row else []),
                    ]
                ),
            }
        )
    return rows


def build_profile_pack(
    profiles: list[dict[str, Any]],
    effect_rows: list[dict[str, Any]],
    simulator_rows: list[dict[str, Any]],
    assumptions: list[dict[str, str]],
) -> dict[str, Any]:
    return {
        "task_id": TASK_ID,
        "generated_at": TIMESTAMP,
        "captured_on": CAPTURED_ON,
        "visual_mode": VISUAL_MODE,
        "mission": MISSION,
        "source_precedence": SOURCE_PRECEDENCE,
        "summary": {
            "adapter_profile_count": len(profiles),
            "effect_family_count": len(effect_rows),
            "simulator_backed_count": sum(
                1 for row in simulator_rows if row["currentExecutionPosture"] in {"simulator_backed", "permanent_simulator"}
            ),
            "live_cutover_pending_count": sum(1 for row in simulator_rows if row["liveCutoverState"] == "pending"),
            "watch_only_count": sum(1 for row in simulator_rows if row["liveCutoverState"] == "watch_only"),
        },
        "template": {
            "required_fields": [
                "adapterContractProfileId",
                "adapterCode",
                "dependencyCode",
                "effectFamilies[]",
                "supportedActionScopes[]",
                "capabilityMatrixRef",
                "outboxCheckpointPolicyRef",
                "receiptOrderingPolicyRef",
                "callbackCorrelationPolicyRef",
                "idempotencyWindowRef",
                "duplicateDispositionRef",
                "collisionDispositionRef",
                "retryPolicyRef",
                "dependencyDegradationProfileRef",
                "integrationWorkloadFamilyRef",
                "requiredTrustZoneBoundaryRef",
                "allowedFhirRepresentationContractRefs[]",
                "allowedFhirExchangeBundleTypes[]",
                "authoritativeProofRulesRef",
                "manualReviewFallbackRef",
                "simulatorContractRef",
                "liveCutoverChecklistRef",
                "updatedAt",
            ],
            "invariants": [
                "Transport acceptance is supporting evidence only.",
                "Replay, callback ordering, and collision rules live in the profile rather than worker code.",
                "Simulator-first execution reuses the same proof and degradation semantics as later live cutover.",
                "Gateway, shell, command, and projection workloads may not become side-door integration runtimes.",
            ],
        },
        "assumptions": assumptions,
        "adapterContractProfiles": profiles,
    }


def build_degradation_pack(
    degradation_rows: list[dict[str, Any]],
    assumptions: list[dict[str, str]],
) -> dict[str, Any]:
    return {
        "task_id": TASK_ID,
        "generated_at": TIMESTAMP,
        "captured_on": CAPTURED_ON,
        "visual_mode": VISUAL_MODE,
        "mission": MISSION,
        "source_precedence": SOURCE_PRECEDENCE,
        "summary": {
            "dependency_degradation_profile_count": len(degradation_rows),
            "critical_count": sum(1 for row in degradation_rows if row["severity"] == "critical"),
            "high_count": sum(1 for row in degradation_rows if row["severity"] == "high"),
            "watch_count": sum(1 for row in degradation_rows if row["severity"] == "watch"),
        },
        "template": {
            "required_fields": [
                "profileId",
                "dependencyCode",
                "failureMode",
                "patientFallbackState",
                "staffFallbackState",
                "impactedWorkloadFamilyRefs[]",
                "maximumEscalationFamilyRefs[]",
                "assuranceTrustEffect",
                "topologyFallbackMode",
                "queueingMode",
                "manualReviewMode",
                "freezeMode",
                "retryPolicyRef",
                "alertThresholdRef",
                "recoveryTriggerRef",
            ],
            "blast_radius_rule": "maximumEscalationFamilyRefs[] must stay bounded and machine-checkable.",
        },
        "assumptions": assumptions,
        "profiles": degradation_rows,
    }


def build_profile_schema() -> dict[str, Any]:
    return {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "title": "AdapterContractProfile",
        "type": "object",
        "required": [
            "adapterContractProfileId",
            "adapterCode",
            "dependencyCode",
            "effectFamilies",
            "supportedActionScopes",
            "capabilityMatrixRef",
            "outboxCheckpointPolicyRef",
            "receiptOrderingPolicyRef",
            "callbackCorrelationPolicyRef",
            "idempotencyWindowRef",
            "duplicateDispositionRef",
            "collisionDispositionRef",
            "retryPolicyRef",
            "dependencyDegradationProfileRef",
            "integrationWorkloadFamilyRef",
            "requiredTrustZoneBoundaryRef",
            "allowedFhirRepresentationContractRefs",
            "allowedFhirExchangeBundleTypes",
            "authoritativeProofRulesRef",
            "manualReviewFallbackRef",
            "simulatorContractRef",
            "liveCutoverChecklistRef",
            "updatedAt",
        ],
        "properties": {
            "adapterContractProfileId": {"type": "string"},
            "adapterCode": {"type": "string"},
            "dependencyCode": {"type": "string"},
            "effectFamilies": {
                "type": "array",
                "items": {
                    "type": "object",
                    "required": [
                        "effectFamilyId",
                        "label",
                        "bindingFamily",
                        "bindingRef",
                        "authoritativeProofRulesRef",
                    ],
                    "properties": {
                        "effectFamilyId": {"type": "string"},
                        "label": {"type": "string"},
                        "bindingFamily": {"type": "string"},
                        "bindingRef": {"type": "string"},
                        "authoritativeProofRulesRef": {"type": "string"},
                    },
                    "additionalProperties": True,
                },
                "minItems": 1,
            },
            "supportedActionScopes": {"type": "array", "items": {"type": "string"}},
            "allowedFhirRepresentationContractRefs": {
                "type": "array",
                "items": {"type": "string"},
            },
            "allowedFhirExchangeBundleTypes": {
                "type": "array",
                "items": {"type": "string"},
            },
            "updatedAt": {"type": "string"},
        },
        "additionalProperties": True,
        "task_id": TASK_ID,
    }


def build_degradation_schema() -> dict[str, Any]:
    return {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "title": "DependencyDegradationProfile",
        "type": "object",
        "required": [
            "profileId",
            "dependencyCode",
            "failureMode",
            "patientFallbackState",
            "staffFallbackState",
            "impactedWorkloadFamilyRefs",
            "maximumEscalationFamilyRefs",
            "assuranceTrustEffect",
            "topologyFallbackMode",
            "queueingMode",
            "manualReviewMode",
            "freezeMode",
            "retryPolicyRef",
            "alertThresholdRef",
            "recoveryTriggerRef",
        ],
        "properties": {
            "profileId": {"type": "string"},
            "dependencyCode": {"type": "string"},
            "failureMode": {"type": "string"},
            "patientFallbackState": {"type": "string"},
            "staffFallbackState": {"type": "string"},
            "impactedWorkloadFamilyRefs": {"type": "array", "items": {"type": "string"}},
            "maximumEscalationFamilyRefs": {"type": "array", "items": {"type": "string"}},
            "assuranceTrustEffect": {"type": "string"},
            "topologyFallbackMode": {"type": "string"},
            "queueingMode": {"type": "string"},
            "manualReviewMode": {"type": "string"},
            "freezeMode": {"type": "string"},
            "retryPolicyRef": {"type": "string"},
            "alertThresholdRef": {"type": "string"},
            "recoveryTriggerRef": {"type": "string"},
        },
        "additionalProperties": True,
        "task_id": TASK_ID,
    }


def markdown_table(columns: list[str], rows: list[dict[str, Any]]) -> str:
    header = "| " + " | ".join(columns) + " |"
    divider = "| " + " | ".join(["---"] * len(columns)) + " |"
    body = [
        "| " + " | ".join(str(row.get(column, "")).replace("\n", " ") for column in columns) + " |"
        for row in rows
    ]
    return "\n".join([header, divider, *body])


def build_strategy_doc(
    profiles: list[dict[str, Any]],
    degradation_rows: list[dict[str, Any]],
    effect_rows: list[dict[str, Any]],
    assumptions: list[dict[str, str]],
) -> str:
    summary_rows = [
        {
            "Metric": "Adapter profiles",
            "Value": len(profiles),
        },
        {
            "Metric": "Dependency degradation profiles",
            "Value": len(degradation_rows),
        },
        {
            "Metric": "Effect families",
            "Value": len(effect_rows),
        },
        {
            "Metric": "Live cutover pending",
            "Value": sum(1 for row in profiles if row["liveCutoverState"] == "pending"),
        },
    ]
    return dedent(
        f"""
        # 57 Adapter Contract Profile Template

        Seq_057 freezes one canonical contract surface for every current external dependency boundary. The generated JSON, CSV, schemas, and studio move replay law, callback ordering, proof-of-success rules, and blast-radius degradation out of worker-local code and into published profiles.

        ## Summary

        {markdown_table(["Metric", "Value"], summary_rows)}

        ## Core Law

        - Every external dependency boundary resolves one `AdapterContractProfile` and one `DependencyDegradationProfile`.
        - `AdapterDispatchAttempt` and `AdapterReceiptCheckpoint` reuse the same profile-owned replay and callback rules across simulator-first and later live-provider execution.
        - Transport acceptance, webhook arrival, queue dequeue, or inbox receipt remain supporting evidence only. Calm success and writable truth still depend on the declared authoritative proof rule.
        - Booking, pharmacy, callback, message, embedded, and watch boundaries bind through explicit adapter or provider-binding refs rather than vendor-name switches or feature flags.
        - Phase 0 defaults to simulator-backed execution. The later live-cutover path is explicit, gate-bound, and rollback-safe.

        ## Required Field Surface

        - `adapterContractProfileId`
        - `adapterCode`
        - `dependencyCode`
        - `effectFamilies[]`
        - `supportedActionScopes[]`
        - `capabilityMatrixRef`
        - `outboxCheckpointPolicyRef`
        - `receiptOrderingPolicyRef`
        - `callbackCorrelationPolicyRef`
        - `idempotencyWindowRef`
        - `duplicateDispositionRef`
        - `collisionDispositionRef`
        - `retryPolicyRef`
        - `dependencyDegradationProfileRef`
        - `integrationWorkloadFamilyRef`
        - `requiredTrustZoneBoundaryRef`
        - `allowedFhirRepresentationContractRefs[]`
        - `allowedFhirExchangeBundleTypes[]`
        - `authoritativeProofRulesRef`
        - `manualReviewFallbackRef`
        - `simulatorContractRef`
        - `liveCutoverChecklistRef`
        - `updatedAt`

        ## Mandatory Gap Closures

        - Replay, ordering, duplicate, and collision rules now live in published adapter profiles instead of worker or webhook code.
        - Transport acceptance is separated from authoritative outcome through explicit proof rules and proof ladders.
        - Failure blast radius is bounded through published degradation profiles rather than implicit retries.
        - Supplier variation stays inside published adapter bindings, effect-family rows, and cutover checklists.
        - Mock-now and actual-later sections describe the same domain effect so simulator parity remains auditable.

        ## Assumptions

        {markdown_table(["assumption_id", "summary"], assumptions)}
        """
    ).strip()


def build_degradation_doc(degradation_rows: list[dict[str, Any]]) -> str:
    table_rows = [
        {
            "dependencyCode": row["dependencyCode"],
            "failureMode": row["failureMode"],
            "severity": row["severity"],
            "topologyFallbackMode": row["topologyFallbackMode"],
            "maximumEscalationFamilyRefs": ", ".join(row["maximumEscalationFamilyRefs"]),
        }
        for row in degradation_rows
    ]
    return dedent(
        f"""
        # 57 Dependency Degradation Profile Strategy

        The degradation pack makes failure blast radius, fallback posture, and assurance impact explicit per dependency boundary. Each row names the maximum workload-family escalation it may trigger and the exact topology fallback mode the platform must use instead of inferring outage scope locally.

        ## Rules

        - `maximumEscalationFamilyRefs[]` stays bounded and machine-checkable.
        - `topologyFallbackMode` controls how the boundary fails without widening browser, gateway, or command truth ad hoc.
        - `manualReviewMode` and `freezeMode` keep recovery in the same shell and under the same governing tuple.
        - Retry posture reuses the seq_039 retry classes instead of inventing provider-local loops.

        ## Active Profiles

        {markdown_table(
            [
                "dependencyCode",
                "failureMode",
                "severity",
                "topologyFallbackMode",
                "maximumEscalationFamilyRefs",
            ],
            table_rows,
        )}
        """
    ).strip()


def build_mock_doc(profiles: list[dict[str, Any]]) -> str:
    parts = [
        "# 57 Mock Now vs Actual Provider Strategy",
        "",
        "Every provider-shaped boundary below carries explicit `Mock_now_execution` and `Actual_provider_strategy_later` sections. The required live cutover must preserve the same replay, callback-ordering, authoritative-proof, and degradation semantics already used in the simulator-backed path.",
        "",
    ]
    for profile in profiles:
        mock_now = profile["mockNowExecution"]
        live = profile["actualProviderStrategyLater"]
        parts.extend(
            [
                f"## {profile['title']}",
                "",
                "### Mock_now_execution",
                "",
                f"- Execution workload: `{mock_now['executionWorkloadFamilyRef']}`",
                f"- Auth model: {mock_now['simulatorAuthModel']}",
                f"- Request/response law: {mock_now['requestResponseSchema']}",
                f"- Callback and ordering: {mock_now['callbackWebhookPatterns']}",
                f"- Fault injection: {', '.join(mock_now['faultInjectionCases'])}",
                f"- Seeded fixtures: {', '.join(mock_now['seededFixtures'])}",
                f"- Observability hooks: {', '.join(mock_now['observabilityHooks'])}",
                "",
                "### Actual_provider_strategy_later",
                "",
                f"- Execution workload: `{live['executionWorkloadFamilyRef']}`",
                f"- Onboarding prerequisites: {', '.join(live['onboardingPrerequisites'])}",
                f"- Security posture: {live['securitySecretPosture']}",
                f"- Operational evidence: {', '.join(live['operationalEvidenceRequired'])}",
                f"- Bound differences: {', '.join(live['contractDifferencesMustRemainBounded'])}",
                f"- Rollback: {live['rollbackToSimulatorSafeMode']}",
                "",
            ]
        )
    return "\n".join(parts).strip()


def build_matrix_doc(effect_rows: list[dict[str, Any]]) -> str:
    table_rows = [
        {
            "effectFamilyId": row["effectFamilyId"],
            "bindingFamily": row["bindingFamily"],
            "adapterCode": row["adapterCode"],
            "dependencyCode": row["dependencyCode"],
            "supportedActionScopes": row["supportedActionScopes"],
        }
        for row in effect_rows
    ]
    return dedent(
        f"""
        # 57 Provider Binding And Effect Family Matrix

        The effect-family matrix shows how the shared profile template is consumed by the major binding families:

        - `BookingProviderAdapterBinding` for IM1, GP supplier, booking, capacity, and practice acknowledgement lanes
        - `PharmacyChoiceAdapterBinding` and `PharmacyDispatchAdapterBinding` for directory, transport, outcome, and urgent-return lanes
        - `MessageDispatchEnvelope`, `CallbackAttemptRecord`, and `PartnerMessageBinding` for notification, telephony, and secure messaging lanes
        - `IdentityBoundaryAdapterBinding`, `EmbeddedChannelAdapterBinding`, `EvidenceProcessingAdapterBinding`, and `AssuranceWatchAdapterBinding` for the remaining boundaries

        {markdown_table(
            ["effectFamilyId", "bindingFamily", "adapterCode", "dependencyCode", "supportedActionScopes"],
            table_rows,
        )}
        """
    ).strip()


def build_studio_payload(
    profiles: list[dict[str, Any]],
    degradation_rows: list[dict[str, Any]],
    effect_rows: list[dict[str, Any]],
    simulator_rows: list[dict[str, Any]],
) -> dict[str, Any]:
    return {
        "taskId": TASK_ID,
        "visualMode": VISUAL_MODE,
        "generatedAt": TIMESTAMP,
        "summary": {
            "adapterProfileCount": len(profiles),
            "degradationProfileCount": len(degradation_rows),
            "simulatorBackedCount": sum(
                1 for row in simulator_rows if row["currentExecutionPosture"] in {"simulator_backed", "permanent_simulator"}
            ),
            "liveCutoverPendingCount": sum(1 for row in profiles if row["liveCutoverState"] == "pending"),
        },
        "filters": {
            "dependencyCodes": [row["dependencyCode"] for row in profiles],
            "effectFamilyIds": [row["effectFamilies"][0]["effectFamilyId"] for row in profiles],
            "workloadFamilyRefs": sorted(
                {
                    row["mockNowExecution"]["executionWorkloadFamilyRef"]
                    for row in profiles
                }
                | {row["actualProviderStrategyLater"]["executionWorkloadFamilyRef"] for row in profiles}
            ),
            "severityLevels": sorted({row["severity"] for row in degradation_rows}),
            "postureStates": sorted({row["liveCutoverState"] for row in profiles}),
        },
        "profiles": profiles,
        "degradationProfiles": degradation_rows,
        "effectMatrixRows": effect_rows,
        "simulatorMatrixRows": simulator_rows,
    }


def build_lab_html(payload: dict[str, Any]) -> str:
    data_json = json.dumps(payload, indent=2)
    return dedent(
        f"""
        <!doctype html>
        <html lang="en">
          <head>
            <meta charset="utf-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1" />
            <title>Vecells Adapter Contract Studio</title>
            <style>
              :root {{
                color-scheme: light;
                --canvas: #f7f8fc;
                --rail: #eef2f8;
                --panel: #ffffff;
                --inset: #f4f6fb;
                --text-strong: #0f172a;
                --text-default: #1e293b;
                --text-muted: #667085;
                --border-subtle: #e2e8f0;
                --border-default: #cbd5e1;
                --primary: #3559e6;
                --integration: #0ea5a4;
                --simulator: #7c3aed;
                --live: #0f9d58;
                --warning: #c98900;
                --blocked: #c24141;
                --shadow: 0 22px 44px rgba(15, 23, 42, 0.08);
                --radius: 20px;
              }}
              * {{ box-sizing: border-box; }}
              body {{
                margin: 0;
                font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
                background: radial-gradient(circle at top left, rgba(53, 89, 230, 0.08), transparent 34%), var(--canvas);
                color: var(--text-default);
              }}
              body[data-reduced-motion="true"] * {{
                animation-duration: 0.01ms !important;
                animation-iteration-count: 1 !important;
                transition-duration: 0.01ms !important;
                scroll-behavior: auto !important;
              }}
              .app {{
                max-width: 1500px;
                margin: 0 auto;
                padding: 0 20px 32px;
              }}
              .masthead {{
                position: sticky;
                top: 0;
                z-index: 10;
                min-height: 72px;
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 20px;
                padding: 16px 0;
                backdrop-filter: blur(18px);
                background: linear-gradient(180deg, rgba(247, 248, 252, 0.96), rgba(247, 248, 252, 0.82));
                border-bottom: 1px solid rgba(203, 213, 225, 0.72);
              }}
              .brand {{
                display: flex;
                align-items: center;
                gap: 12px;
              }}
              .monogram {{
                width: 42px;
                height: 42px;
                border-radius: 14px;
                background: linear-gradient(145deg, rgba(53, 89, 230, 0.14), rgba(14, 165, 164, 0.12));
                border: 1px solid rgba(53, 89, 230, 0.16);
                display: grid;
                place-items: center;
              }}
              .brand h1 {{
                margin: 0;
                font-size: 1rem;
                color: var(--text-strong);
              }}
              .brand p {{
                margin: 2px 0 0;
                color: var(--text-muted);
                font-size: 0.84rem;
              }}
              .metrics {{
                display: grid;
                grid-template-columns: repeat(4, minmax(110px, 1fr));
                gap: 12px;
              }}
              .metric {{
                background: rgba(255, 255, 255, 0.82);
                border: 1px solid rgba(203, 213, 225, 0.78);
                border-radius: 16px;
                padding: 10px 12px;
              }}
              .metric span {{
                display: block;
                font-size: 0.74rem;
                color: var(--text-muted);
              }}
              .metric strong {{
                display: block;
                margin-top: 4px;
                font-size: 1.05rem;
                color: var(--text-strong);
              }}
              .layout {{
                display: grid;
                grid-template-columns: 300px minmax(0, 1fr) 396px;
                gap: 20px;
                align-items: start;
                margin-top: 18px;
              }}
              aside, main, .inspector {{
                min-width: 0;
              }}
              .rail, .panel {{
                background: var(--panel);
                border: 1px solid var(--border-default);
                border-radius: var(--radius);
                box-shadow: var(--shadow);
              }}
              .rail {{
                padding: 18px;
                position: sticky;
                top: 92px;
              }}
              .panel {{
                padding: 18px;
              }}
              .panel-grid {{
                display: grid;
                grid-template-columns: repeat(2, minmax(0, 1fr));
                gap: 18px;
              }}
              .diagram-block, .proof-block, .table-block, .defects {{
                background: var(--panel);
                border: 1px solid var(--border-default);
                border-radius: var(--radius);
                box-shadow: var(--shadow);
                padding: 18px;
              }}
              .canvas-stack {{
                display: grid;
                gap: 18px;
                min-height: 620px;
              }}
              .cards {{
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
                gap: 16px;
              }}
              .card {{
                min-height: 170px;
                border: 1px solid var(--border-default);
                border-radius: 18px;
                background: linear-gradient(180deg, rgba(244, 246, 251, 0.92), rgba(255, 255, 255, 0.96));
                padding: 16px;
                cursor: pointer;
                transition: transform 180ms ease, border-color 180ms ease, box-shadow 180ms ease;
              }}
              .card:hover, .card:focus-visible {{
                transform: translateY(-2px);
                border-color: rgba(53, 89, 230, 0.5);
              }}
              .card[data-selected="true"] {{
                border-color: var(--primary);
                box-shadow: 0 0 0 2px rgba(53, 89, 230, 0.16), var(--shadow);
              }}
              .eyebrow, .chip {{
                display: inline-flex;
                align-items: center;
                gap: 6px;
                font-size: 0.72rem;
                border-radius: 999px;
                padding: 5px 9px;
              }}
              .eyebrow {{
                background: rgba(53, 89, 230, 0.08);
                color: var(--primary);
              }}
              .chip {{
                background: var(--inset);
                color: var(--text-muted);
              }}
              .chip.severity-critical {{ color: var(--blocked); }}
              .chip.severity-high {{ color: var(--warning); }}
              .chip.severity-watch {{ color: var(--integration); }}
              h2, h3 {{
                margin: 0 0 12px;
                color: var(--text-strong);
              }}
              p {{
                margin: 0;
                line-height: 1.5;
              }}
              .filter-group {{
                display: grid;
                gap: 12px;
                margin-top: 16px;
              }}
              label {{
                display: grid;
                gap: 6px;
                font-size: 0.78rem;
                color: var(--text-muted);
              }}
              select, button.filter-toggle {{
                min-height: 44px;
                border-radius: 14px;
                border: 1px solid var(--border-default);
                background: var(--inset);
                color: var(--text-default);
                padding: 0 12px;
                font: inherit;
              }}
              .toggle-row {{
                display: grid;
                grid-template-columns: repeat(2, minmax(0, 1fr));
                gap: 10px;
              }}
              button.filter-toggle {{
                cursor: pointer;
              }}
              button.filter-toggle[data-active="true"] {{
                background: rgba(124, 58, 237, 0.1);
                border-color: rgba(124, 58, 237, 0.3);
                color: var(--simulator);
              }}
              .comparison-toggle {{
                display: grid;
                grid-template-columns: repeat(2, minmax(0, 1fr));
                gap: 10px;
              }}
              .compare-button[data-active="true"] {{
                background: rgba(14, 165, 164, 0.08);
                border-color: rgba(14, 165, 164, 0.28);
                color: var(--integration);
              }}
              .diagram {{
                display: grid;
                gap: 14px;
              }}
              .diagram-line {{
                display: grid;
                grid-template-columns: repeat(4, minmax(0, 1fr));
                gap: 10px;
              }}
              .diagram-node {{
                background: var(--inset);
                border: 1px solid var(--border-default);
                border-radius: 16px;
                padding: 14px;
              }}
              .diagram-node strong, .inspector strong {{
                color: var(--text-strong);
              }}
              .parity-list {{
                margin: 0;
                padding-left: 18px;
                color: var(--text-muted);
              }}
              .proof-list {{
                display: grid;
                gap: 10px;
              }}
              .proof-step {{
                display: flex;
                align-items: center;
                gap: 12px;
                background: var(--inset);
                border: 1px solid var(--border-default);
                border-radius: 16px;
                padding: 12px;
              }}
              .proof-step strong {{
                font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
                font-size: 0.78rem;
                color: var(--primary);
                min-width: 84px;
              }}
              table {{
                width: 100%;
                border-collapse: collapse;
                font-size: 0.88rem;
              }}
              th, td {{
                text-align: left;
                padding: 10px 8px;
                border-bottom: 1px solid var(--border-subtle);
                vertical-align: top;
              }}
              tr[data-linked="true"] {{
                background: rgba(53, 89, 230, 0.06);
              }}
              tr[data-selectable="true"] {{
                cursor: pointer;
              }}
              code {{
                font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
                font-size: 0.82rem;
              }}
              .inspector {{
                position: sticky;
                top: 92px;
              }}
              .inspector .panel {{
                display: grid;
                gap: 18px;
              }}
              .info-grid {{
                display: grid;
                gap: 10px;
              }}
              .info-row {{
                background: var(--inset);
                border: 1px solid var(--border-subtle);
                border-radius: 14px;
                padding: 12px;
              }}
              .comparison-table {{
                width: 100%;
                border-spacing: 0;
              }}
              .comparison-table td {{
                border-bottom: 1px solid var(--border-subtle);
                padding: 10px 8px;
              }}
              .defect-list {{
                display: grid;
                gap: 10px;
              }}
              .defect {{
                border-left: 4px solid var(--blocked);
                background: rgba(194, 65, 65, 0.06);
                border-radius: 14px;
                padding: 12px 14px;
              }}
              .sr-only {{
                position: absolute;
                width: 1px;
                height: 1px;
                padding: 0;
                margin: -1px;
                overflow: hidden;
                clip: rect(0, 0, 0, 0);
                white-space: nowrap;
                border: 0;
              }}
              @media (max-width: 1180px) {{
                .layout {{
                  grid-template-columns: 1fr;
                }}
                .rail, .inspector {{
                  position: static;
                }}
                .metrics {{
                  grid-template-columns: repeat(2, minmax(120px, 1fr));
                }}
              }}
              @media (max-width: 760px) {{
                .app {{
                  padding: 0 12px 24px;
                }}
                .masthead {{
                  flex-direction: column;
                  align-items: stretch;
                }}
                .metrics, .panel-grid, .diagram-line {{
                  grid-template-columns: 1fr;
                }}
                .cards {{
                  grid-template-columns: 1fr;
                }}
              }}
            </style>
          </head>
          <body>
            <div class="app">
              <header class="masthead">
                <div class="brand">
                  <div class="monogram" aria-hidden="true">
                    <svg viewBox="0 0 48 48" width="28" height="28" role="img" aria-label="AC monogram">
                      <path d="M10 34 21 12h6l11 22h-6l-2.2-4.8H18.2L16 34Zm10.5-9.7h6.9L24 16.9Z" fill="#3559E6"></path>
                    </svg>
                  </div>
                  <div>
                    <h1>Vecells Adapter Contract Studio</h1>
                    <p>Adapter_Contract_Studio</p>
                  </div>
                </div>
                <div class="metrics" aria-label="Studio metrics">
                  <div class="metric"><span>Adapter profiles</span><strong data-testid="metric-adapter-count"></strong></div>
                  <div class="metric"><span>Degradation profiles</span><strong data-testid="metric-degradation-count"></strong></div>
                  <div class="metric"><span>Simulator-backed</span><strong data-testid="metric-simulator-count"></strong></div>
                  <div class="metric"><span>Live-cutover pending</span><strong data-testid="metric-live-pending-count"></strong></div>
                </div>
              </header>
              <div class="layout">
                <aside class="rail" aria-label="Filters">
                  <h2>Boundary filters</h2>
                  <p>Filter by dependency, effect family, workload family, degradation severity, and live posture.</p>
                  <div class="filter-group">
                    <label>Dependency
                      <select id="dependency-filter" data-testid="dependency-filter"></select>
                    </label>
                    <label>Effect family
                      <select id="effect-filter" data-testid="effect-filter"></select>
                    </label>
                    <label>Workload family
                      <select id="workload-filter" data-testid="workload-filter"></select>
                    </label>
                    <label>Degradation severity
                      <select id="severity-filter" data-testid="severity-filter"></select>
                    </label>
                    <label>Simulator/live posture
                      <select id="posture-filter" data-testid="posture-filter"></select>
                    </label>
                  </div>
                  <div class="filter-group">
                    <h3>Simulator vs live</h3>
                    <div class="comparison-toggle" data-testid="simulator-live-toggle">
                      <button type="button" class="filter-toggle compare-button" id="compare-mock-now" data-compare-mode="mock-now">Mock now</button>
                      <button type="button" class="filter-toggle compare-button" id="compare-actual-later" data-compare-mode="actual-later">Actual later</button>
                    </div>
                  </div>
                </aside>
                <main class="canvas-stack">
                  <section class="panel-grid">
                    <section class="diagram-block" data-testid="topology-diagram">
                      <h2>Topology impact diagram</h2>
                      <div class="diagram" id="topology-diagram-content"></div>
                    </section>
                    <section class="proof-block" data-testid="proof-ladder">
                      <h2>Authoritative proof ladder</h2>
                      <div class="proof-list" id="proof-ladder-content"></div>
                    </section>
                  </section>
                  <section class="panel">
                    <h2>Adapter profiles</h2>
                    <p id="filter-summary" style="margin-bottom: 14px; color: var(--text-muted);"></p>
                    <div class="cards" id="profile-cards" aria-live="polite"></div>
                  </section>
                  <section class="table-block">
                    <h2>Effect-family matrix</h2>
                    <table data-testid="effect-matrix">
                      <thead>
                        <tr>
                          <th>Effect family</th>
                          <th>Binding</th>
                          <th>Adapter</th>
                          <th>Workload</th>
                        </tr>
                      </thead>
                      <tbody id="effect-matrix-body"></tbody>
                    </table>
                  </section>
                  <section class="table-block">
                    <h2>Degradation matrix</h2>
                    <table data-testid="degradation-matrix">
                      <thead>
                        <tr>
                          <th>Dependency</th>
                          <th>Failure mode</th>
                          <th>Severity</th>
                          <th>Fallback</th>
                        </tr>
                      </thead>
                      <tbody id="degradation-matrix-body"></tbody>
                    </table>
                  </section>
                  <section class="defects" data-testid="defect-strip">
                    <h2>Defect strip</h2>
                    <div class="defect-list" id="defect-strip-body"></div>
                  </section>
                </main>
                <aside class="inspector">
                  <div class="panel" data-testid="inspector">
                    <section>
                      <h2>Selected adapter</h2>
                      <div class="info-grid" id="inspector-profile"></div>
                    </section>
                    <section>
                      <h2>Selected degradation profile</h2>
                      <div class="info-grid" id="inspector-degradation"></div>
                    </section>
                    <section>
                      <h2>Mock now vs actual later</h2>
                      <table class="comparison-table" id="comparison-table"></table>
                    </section>
                  </div>
                </aside>
              </div>
            </div>
            <script id="studio-data" type="application/json">{data_json}</script>
            <script>
              const data = JSON.parse(document.getElementById("studio-data").textContent);
              const state = {{
                dependency: "all",
                effect: "all",
                workload: "all",
                severity: "all",
                posture: "all",
                compareMode: "mock-now",
                selectedProfileId: data.profiles[0]?.adapterContractProfileId ?? null,
              }};

              const elements = {{
                dependency: document.getElementById("dependency-filter"),
                effect: document.getElementById("effect-filter"),
                workload: document.getElementById("workload-filter"),
                severity: document.getElementById("severity-filter"),
                posture: document.getElementById("posture-filter"),
                cards: document.getElementById("profile-cards"),
                topology: document.getElementById("topology-diagram-content"),
                proof: document.getElementById("proof-ladder-content"),
                effectMatrix: document.getElementById("effect-matrix-body"),
                degradationMatrix: document.getElementById("degradation-matrix-body"),
                inspectorProfile: document.getElementById("inspector-profile"),
                inspectorDegradation: document.getElementById("inspector-degradation"),
                comparison: document.getElementById("comparison-table"),
                defects: document.getElementById("defect-strip-body"),
                filterSummary: document.getElementById("filter-summary"),
                metricAdapterCount: document.querySelector("[data-testid='metric-adapter-count']"),
                metricDegradationCount: document.querySelector("[data-testid='metric-degradation-count']"),
                metricSimulatorCount: document.querySelector("[data-testid='metric-simulator-count']"),
                metricLivePendingCount: document.querySelector("[data-testid='metric-live-pending-count']"),
                compareButtons: Array.from(document.querySelectorAll(".compare-button")),
              }};

              const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
              document.body.dataset.reducedMotion = reducedMotion.matches ? "true" : "false";

              function options(select, values, formatter) {{
                const list = ["all", ...values];
                select.innerHTML = list
                  .map((value) => {{
                    const label = value === "all" ? "All" : formatter(value);
                    return `<option value="${{value}}">${{label}}</option>`;
                  }})
                  .join("");
              }}

              function titleCase(value) {{
                return value.replace(/_/g, " ").replace(/\\b\\w/g, (m) => m.toUpperCase());
              }}

              options(elements.dependency, data.filters.dependencyCodes, (value) => value);
              options(elements.effect, data.filters.effectFamilyIds, (value) => value);
              options(elements.workload, data.filters.workloadFamilyRefs, (value) => value);
              options(elements.severity, data.filters.severityLevels, (value) => titleCase(value));
              options(elements.posture, data.filters.postureStates, (value) => titleCase(value));

              function selectedProfile(visibleProfiles) {{
                const found = visibleProfiles.find((row) => row.adapterContractProfileId === state.selectedProfileId);
                return found ?? visibleProfiles[0] ?? null;
              }}

              function profileMatches(profile, degradation) {{
                const effectId = profile.effectFamilies[0].effectFamilyId;
                const workloadRefs = [
                  profile.mockNowExecution.executionWorkloadFamilyRef,
                  profile.actualProviderStrategyLater.executionWorkloadFamilyRef,
                ];
                if (state.dependency !== "all" && profile.dependencyCode !== state.dependency) return false;
                if (state.effect !== "all" && effectId !== state.effect) return false;
                if (state.workload !== "all" && !workloadRefs.includes(state.workload)) return false;
                if (state.severity !== "all" && degradation.severity !== state.severity) return false;
                if (state.posture !== "all" && profile.liveCutoverState !== state.posture) return false;
                return true;
              }}

              function infoRow(label, value) {{
                return `<div class="info-row"><span class="eyebrow">${{label}}</span><div style="margin-top:8px;"><strong>${{value}}</strong></div></div>`;
              }}

              function render() {{
                elements.metricAdapterCount.textContent = String(data.summary.adapterProfileCount);
                elements.metricDegradationCount.textContent = String(data.summary.degradationProfileCount);
                elements.metricSimulatorCount.textContent = String(data.summary.simulatorBackedCount);
                elements.metricLivePendingCount.textContent = String(data.summary.liveCutoverPendingCount);
                elements.compareButtons.forEach((button) => {{
                  button.dataset.active = String(button.dataset.compareMode === state.compareMode);
                }});

                const degradationByDependency = new Map(
                  data.degradationProfiles.map((row) => [row.dependencyCode, row]),
                );
                const visibleProfiles = data.profiles.filter((profile) =>
                  profileMatches(profile, degradationByDependency.get(profile.dependencyCode)),
                );
                const currentProfile = selectedProfile(visibleProfiles);
                state.selectedProfileId = currentProfile?.adapterContractProfileId ?? null;
                const currentDegradation = currentProfile
                  ? degradationByDependency.get(currentProfile.dependencyCode)
                  : null;

                elements.filterSummary.textContent = `${{visibleProfiles.length}} profile${{visibleProfiles.length === 1 ? "" : "s"}} visible under the current filter set.`;

                elements.cards.innerHTML = visibleProfiles
                  .map((profile) => {{
                    const degradation = degradationByDependency.get(profile.dependencyCode);
                    const effect = profile.effectFamilies[0];
                    const selected = profile.adapterContractProfileId === state.selectedProfileId;
                    const cardId = `profile-card-${{effect.effectFamilyId}}`;
                    return `
                      <article
                        class="card"
                        id="${{cardId}}"
                        tabindex="0"
                        role="button"
                        aria-pressed="${{selected}}"
                        data-testid="${{cardId}}"
                        data-profile-id="${{profile.adapterContractProfileId}}"
                        data-selected="${{selected}}"
                      >
                        <div style="display:flex;justify-content:space-between;gap:8px;align-items:start;">
                          <span class="eyebrow">${{profile.adapterCode}}</span>
                          <span class="chip severity-${{degradation.severity}}">${{degradation.severity}}</span>
                        </div>
                        <h3 style="margin-top:12px;">${{profile.title}}</h3>
                        <p style="margin-top:10px;color:var(--text-muted);">${{effect.label}}</p>
                        <div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:14px;">
                          <span class="chip">${{titleCase(profile.liveCutoverState)}}</span>
                          <span class="chip">${{profile.mockNowExecution.executionWorkloadFamilyRef}}</span>
                        </div>
                      </article>
                    `;
                  }})
                  .join("");

                elements.cards.querySelectorAll("[data-profile-id]").forEach((card) => {{
                  card.addEventListener("click", () => {{
                    state.selectedProfileId = card.dataset.profileId;
                    render();
                  }});
                  card.addEventListener("keydown", (event) => {{
                    const visible = Array.from(elements.cards.querySelectorAll("[data-profile-id]"));
                    const index = visible.indexOf(card);
                    if (event.key === "ArrowDown" || event.key === "ArrowRight") {{
                      event.preventDefault();
                      const next = visible[Math.min(index + 1, visible.length - 1)];
                      if (next) {{
                        state.selectedProfileId = next.dataset.profileId;
                        render();
                        next.focus();
                      }}
                    }}
                    if (event.key === "ArrowUp" || event.key === "ArrowLeft") {{
                      event.preventDefault();
                      const prev = visible[Math.max(index - 1, 0)];
                      if (prev) {{
                        state.selectedProfileId = prev.dataset.profileId;
                        render();
                        prev.focus();
                      }}
                    }}
                  }});
                }});

                if (!currentProfile || !currentDegradation) {{
                  elements.topology.innerHTML = "<p>No profile matches the current filters.</p>";
                  elements.proof.innerHTML = "";
                  elements.effectMatrix.innerHTML = "";
                  elements.degradationMatrix.innerHTML = "";
                  elements.inspectorProfile.innerHTML = "";
                  elements.inspectorDegradation.innerHTML = "";
                  elements.comparison.innerHTML = "";
                  elements.defects.innerHTML = "";
                  return;
                }}

                elements.topology.innerHTML = `
                  <div class="diagram-line">
                    <div class="diagram-node"><strong>Route family</strong><div>${{currentProfile.routeFamilyRefs.join(", ")}}</div></div>
                    <div class="diagram-node"><strong>Integration workload</strong><div><code>${{currentProfile.integrationWorkloadFamilyRef}}</code></div></div>
                    <div class="diagram-node"><strong>Trust boundary</strong><div><code>${{currentProfile.requiredTrustZoneBoundaryRef}}</code></div></div>
                    <div class="diagram-node"><strong>Authoritative proof</strong><div><code>${{currentProfile.authoritativeProofRulesRef}}</code></div></div>
                  </div>
                  <ol class="parity-list">
                    <li>Domain command checkpoints through <code>${{currentProfile.outboxCheckpointPolicyRef}}</code>.</li>
                    <li>Callbacks and receipts collapse through <code>${{currentProfile.receiptOrderingPolicyRef}}</code>.</li>
                    <li>Transport success remains <strong>${{currentProfile.transportAcceptanceTruth.replace(/_/g, " ")}}</strong>.</li>
                    <li>Same-shell fallback stays bound to <code>${{currentProfile.dependencyDegradationProfileRef}}</code>.</li>
                  </ol>
                `;

                elements.proof.innerHTML = currentProfile.proofLadder
                  .map(
                    (step) => `
                      <div class="proof-step">
                        <strong>${{step.stage}}</strong>
                        <span>${{step.summary}}</span>
                      </div>
                    `,
                  )
                  .join("");

                const visibleProfileIds = new Set(visibleProfiles.map((profile) => profile.adapterContractProfileId));
                elements.effectMatrix.innerHTML = data.effectMatrixRows
                  .filter((row) => visibleProfileIds.has(row.adapterContractProfileId))
                  .map((row) => {{
                    const linked = row.adapterContractProfileId === state.selectedProfileId;
                    return `
                      <tr
                        data-testid="effect-row-${{row.effectFamilyId}}"
                        data-selectable="true"
                        data-linked="${{linked}}"
                        data-profile-id="${{row.adapterContractProfileId}}"
                      >
                        <td><code>${{row.effectFamilyId}}</code></td>
                        <td>${{row.bindingFamily}}</td>
                        <td>${{row.adapterCode}}</td>
                        <td><code>${{row.integrationWorkloadFamilyRef}}</code></td>
                      </tr>
                    `;
                  }})
                  .join("");

                elements.effectMatrix.querySelectorAll("[data-profile-id]").forEach((row) => {{
                  row.addEventListener("click", () => {{
                    state.selectedProfileId = row.dataset.profileId;
                    render();
                  }});
                }});

                elements.degradationMatrix.innerHTML = data.degradationProfiles
                  .filter((row) => visibleProfileIds.has(data.profiles.find((profile) => profile.dependencyCode === row.dependencyCode)?.adapterContractProfileId))
                  .map((row) => {{
                    const profile = data.profiles.find((entry) => entry.dependencyCode === row.dependencyCode);
                    const linked = profile?.adapterContractProfileId === state.selectedProfileId;
                    return `
                      <tr
                        data-testid="degradation-row-${{row.dependencyCode}}"
                        data-selectable="true"
                        data-linked="${{linked}}"
                        data-profile-id="${{profile?.adapterContractProfileId ?? ""}}"
                      >
                        <td><code>${{row.dependencyCode}}</code></td>
                        <td>${{row.failureMode}}</td>
                        <td>${{titleCase(row.severity)}}</td>
                        <td>${{row.topologyFallbackMode}}</td>
                      </tr>
                    `;
                  }})
                  .join("");

                elements.degradationMatrix.querySelectorAll("[data-profile-id]").forEach((row) => {{
                  row.addEventListener("click", () => {{
                    state.selectedProfileId = row.dataset.profileId;
                    render();
                  }});
                }});

                elements.inspectorProfile.innerHTML = [
                  infoRow("Adapter code", `<code>${{currentProfile.adapterCode}}</code>`),
                  infoRow("Dependency", `<code>${{currentProfile.dependencyCode}}</code>`),
                  infoRow("Binding ref", `<code>${{currentProfile.bindingRef}}</code>`),
                  infoRow("Runtime bindings", currentProfile.requiredRuntimeBindingRefs.join(", ") || "None"),
                  infoRow("Supported action scopes", currentProfile.supportedActionScopes.join(", ")),
                  infoRow("FHIR allowance", currentProfile.allowedFhirRepresentationContractRefs.join(", ") || "No FHIR rows"),
                ].join("");

                elements.inspectorDegradation.innerHTML = [
                  infoRow("Failure mode", currentDegradation.failureMode),
                  infoRow("Topological fallback", currentDegradation.topologyFallbackMode),
                  infoRow("Queueing mode", currentDegradation.queueingMode),
                  infoRow("Manual review mode", currentDegradation.manualReviewMode),
                  infoRow("Freeze mode", currentDegradation.freezeMode),
                  infoRow("Maximum escalation", currentDegradation.maximumEscalationFamilyRefs.join(", ")),
                ].join("");

                const compareSource =
                  state.compareMode === "actual-later"
                    ? currentProfile.actualProviderStrategyLater
                    : currentProfile.mockNowExecution;
                elements.comparison.dataset.compareMode = state.compareMode;
                elements.comparison.innerHTML = `
                  <tr><td><strong>Focus</strong></td><td>${{state.compareMode === "actual-later" ? "Actual provider strategy later" : "Mock now execution"}}</td></tr>
                  <tr><td>Execution workload</td><td><code>${{compareSource.executionWorkloadFamilyRef}}</code></td></tr>
                  <tr><td>Auth / prerequisites</td><td>${{
                    state.compareMode === "actual-later"
                      ? currentProfile.actualProviderStrategyLater.onboardingPrerequisites.join(", ")
                      : currentProfile.mockNowExecution.simulatorAuthModel
                  }}</td></tr>
                  <tr><td>Replay and callback law</td><td>${{
                    state.compareMode === "actual-later"
                      ? currentProfile.actualProviderStrategyLater.contractDifferencesMustRemainBounded.join(", ")
                      : currentProfile.mockNowExecution.callbackWebhookPatterns
                  }}</td></tr>
                  <tr><td>Rollback / observability</td><td>${{
                    state.compareMode === "actual-later"
                      ? currentProfile.actualProviderStrategyLater.rollbackToSimulatorSafeMode
                      : currentProfile.mockNowExecution.observabilityHooks.join(", ")
                  }}</td></tr>
                `;

                const defects = [
                  ...currentProfile.actualProviderStrategyLater.blockedLiveGateIds.map((id) => ({{
                    level: "blocked",
                    text: id,
                  }})),
                  ...currentProfile.actualProviderStrategyLater.reviewLiveGateIds.map((id) => ({{
                    level: "review",
                    text: id,
                  }})),
                ];
                elements.defects.innerHTML = defects
                  .map(
                    (defect) => `
                      <div class="defect" data-testid="defect-${{slug(defect.text)}}">
                        <strong>${{titleCase(defect.level)}}</strong>
                        <div style="margin-top:6px;"><code>${{defect.text}}</code></div>
                      </div>
                    `,
                  )
                  .join("");
              }}

              [elements.dependency, elements.effect, elements.workload, elements.severity, elements.posture].forEach(
                (select) => {{
                  select.addEventListener("change", () => {{
                    state[select.id.replace("-filter", "")] = select.value;
                    render();
                  }});
                }},
              );

              elements.compareButtons.forEach((button) => {{
                button.addEventListener("click", () => {{
                  state.compareMode = button.dataset.compareMode;
                  render();
                }});
              }});

              render();
            </script>
          </body>
        </html>
        """
    ).strip()


def upsert_marked_block(text: str, start_marker: str, end_marker: str, block: str) -> str:
    block = block.strip()
    if start_marker in text and end_marker in text:
        prefix, remainder = text.split(start_marker, 1)
        _, suffix = remainder.split(end_marker, 1)
        return prefix.rstrip() + "\n\n" + block + "\n" + suffix.lstrip("\n")
    return text.rstrip() + "\n\n" + block + "\n"


def build_package_source_block(
    profiles: list[dict[str, Any]],
    degradation_rows: list[dict[str, Any]],
) -> str:
    return dedent(
        f"""
        {PACKAGE_EXPORTS_START}
        export const adapterContractProfileCatalog = {{
          taskId: "{TASK_ID}",
          visualMode: "{VISUAL_MODE}",
          adapterProfileCount: {len(profiles)},
          degradationProfileCount: {len(degradation_rows)},
          effectFamilyCount: {len(profiles)},
          schemaArtifactPaths: [
            "packages/api-contracts/schemas/adapter-contract-profile.schema.json",
            "packages/api-contracts/schemas/dependency-degradation-profile.schema.json",
          ],
        }} as const;

        export const adapterContractProfileSchemas = [
          {{
            schemaId: "AdapterContractProfile",
            artifactPath: "packages/api-contracts/schemas/adapter-contract-profile.schema.json",
            generatedByTask: "{TASK_ID}",
          }},
          {{
            schemaId: "DependencyDegradationProfile",
            artifactPath: "packages/api-contracts/schemas/dependency-degradation-profile.schema.json",
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
              adapterContractProfileCatalog,
              adapterContractProfileSchemas,
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
                expect(frontendContractManifestSchemas).toHaveLength(1);

                const schemaPath = path.join(ROOT, frontendContractManifestSchemas[0].artifactPath);
                expect(fs.existsSync(schemaPath)).toBe(true);
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
            });
            """
        ).strip()
        + "\n"
    )


def update_api_contract_package(profiles: list[dict[str, Any]], degradation_rows: list[dict[str, Any]]) -> None:
    source = PACKAGE_SOURCE_PATH.read_text()
    source = upsert_marked_block(
        source,
        PACKAGE_EXPORTS_START,
        PACKAGE_EXPORTS_END,
        build_package_source_block(profiles, degradation_rows),
    )
    write_text(PACKAGE_SOURCE_PATH, source.rstrip() + "\n")
    write_text(PACKAGE_TEST_PATH, build_package_public_api_test())
    package = read_json(PACKAGE_PACKAGE_JSON_PATH)
    exports = package.setdefault("exports", {})
    exports["./schemas/adapter-contract-profile.schema.json"] = "./schemas/adapter-contract-profile.schema.json"
    exports["./schemas/dependency-degradation-profile.schema.json"] = "./schemas/dependency-degradation-profile.schema.json"
    write_json(PACKAGE_PACKAGE_JSON_PATH, package)


def update_root_package() -> None:
    package = read_json(ROOT_PACKAGE_PATH)
    package.setdefault("scripts", {}).update(ROOT_SCRIPT_UPDATES)
    write_json(ROOT_PACKAGE_PATH, package)


def update_playwright_package() -> None:
    package = read_json(PLAYWRIGHT_PACKAGE_PATH)
    package["description"] = (
        "Foundation, runtime topology, gateway, event, FHIR, frontend manifest, release parity, "
        "design contract, audit ledger, scope/isolation, lifecycle coordinator, scoped mutation "
        "gate, and adapter contract browser checks."
    )
    package["scripts"] = PLAYWRIGHT_SCRIPT_UPDATES
    write_json(PLAYWRIGHT_PACKAGE_PATH, package)


def patch_engineering_builder() -> None:
    text = ENGINEERING_BUILDER_PATH.read_text()
    text = text.replace(
        "pnpm validate:tenant-scope && pnpm validate:lifecycle && pnpm validate:mutation-gate && pnpm validate:scaffold",
        "pnpm validate:tenant-scope && pnpm validate:lifecycle && pnpm validate:mutation-gate && pnpm validate:adapter-contracts && pnpm validate:scaffold",
    )
    text = text.replace(
        "python3 ./tools/analysis/build_scoped_mutation_gate_rules.py && python3 ./tools/analysis/build_engineering_standards.py && pnpm format",
        "python3 ./tools/analysis/build_scoped_mutation_gate_rules.py && "
        "python3 ./tools/analysis/build_adapter_contract_profiles.py && "
        "python3 ./tools/analysis/build_engineering_standards.py && pnpm format",
    )
    text = text.replace(
        '"validate:mutation-gate": "python3 ./tools/analysis/validate_scoped_mutation_gate.py",\n'
        '    "validate:standards": "python3 ./tools/analysis/validate_engineering_standards.py",',
        '"validate:mutation-gate": "python3 ./tools/analysis/validate_scoped_mutation_gate.py",\n'
        '    "validate:adapter-contracts": "python3 ./tools/analysis/validate_adapter_contract_profiles.py",\n'
        '    "validate:standards": "python3 ./tools/analysis/validate_engineering_standards.py",',
    )
    ENGINEERING_BUILDER_PATH.write_text(text)


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

            PROFILE_PATH = DATA_DIR / "adapter_contract_profile_template.json"
            DEGRADATION_PATH = DATA_DIR / "dependency_degradation_profiles.json"
            EFFECT_MATRIX_PATH = DATA_DIR / "adapter_effect_family_matrix.csv"
            SIMULATOR_MATRIX_PATH = DATA_DIR / "simulator_vs_live_adapter_matrix.csv"
            PROFILE_SCHEMA_PATH = PACKAGE_SCHEMA_DIR / "adapter-contract-profile.schema.json"
            DEGRADATION_SCHEMA_PATH = PACKAGE_SCHEMA_DIR / "dependency-degradation-profile.schema.json"
            DEGRADED_DEFAULTS_PATH = DATA_DIR / "degraded_mode_defaults.json"
            RUNTIME_WORKLOADS_PATH = DATA_DIR / "runtime_workload_families.json"
            TRUST_BOUNDARIES_PATH = DATA_DIR / "trust_zone_boundaries.json"
            FHIR_CONTRACTS_PATH = DATA_DIR / "fhir_representation_contracts.json"
            RETRY_MATRIX_PATH = DATA_DIR / "browser_automation_retry_matrix.json"


            def read_json(path: Path):
                return json.loads(path.read_text())


            def read_csv(path: Path):
                with path.open() as handle:
                    return list(csv.DictReader(handle))


            def require(condition: bool, message: str) -> None:
                if not condition:
                    raise SystemExit(message)


            def main() -> None:
                profile_pack = read_json(PROFILE_PATH)
                degradation_pack = read_json(DEGRADATION_PATH)
                effect_rows = read_csv(EFFECT_MATRIX_PATH)
                simulator_rows = read_csv(SIMULATOR_MATRIX_PATH)
                profile_schema = read_json(PROFILE_SCHEMA_PATH)
                degradation_schema = read_json(DEGRADATION_SCHEMA_PATH)
                degraded_defaults = read_json(DEGRADED_DEFAULTS_PATH)
                runtime = read_json(RUNTIME_WORKLOADS_PATH)
                trust = read_json(TRUST_BOUNDARIES_PATH)
                fhir = read_json(FHIR_CONTRACTS_PATH)
                retry = read_json(RETRY_MATRIX_PATH)

                profiles = profile_pack["adapterContractProfiles"]
                degradation_rows = degradation_pack["profiles"]
                dependency_ids = {row["dependency_id"] for row in degraded_defaults["dependencies"]}
                runtime_family_refs = {row["runtime_workload_family_ref"] for row in runtime["runtime_workload_families"]}
                trust_boundary_ids = {row["trustZoneBoundaryId"] for row in trust["trust_zone_boundaries"]}
                fhir_contract_ids = {row["fhirRepresentationContractId"] for row in fhir["contracts"]}
                retry_class_ids = {row["class_id"] for row in retry["retry_classes"]}

                require(profile_pack["task_id"] == "seq_057", "Adapter profile task id drifted.")
                require(degradation_pack["task_id"] == "seq_057", "Degradation profile task id drifted.")
                require(profile_schema["task_id"] == "seq_057", "Profile schema task id drifted.")
                require(degradation_schema["task_id"] == "seq_057", "Degradation schema task id drifted.")
                require(len(profiles) == len(dependency_ids) == 20, "Seq_057 must publish one adapter profile per dependency.")
                require(len(degradation_rows) == len(dependency_ids) == 20, "Seq_057 must publish one degradation profile per dependency.")
                require(len(effect_rows) == 20, "Effect-family matrix row count drifted.")
                require(len(simulator_rows) == 20, "Simulator/live matrix row count drifted.")

                adapter_ids = set()
                dependency_to_profile = {}
                effect_to_owner = {}
                degradation_by_dependency = {row["dependencyCode"]: row for row in degradation_rows}
                required_profile_fields = set(profile_schema["required"])
                required_degradation_fields = set(degradation_schema["required"])

                for field in [
                    "adapterContractProfileId",
                    "adapterCode",
                    "dependencyCode",
                    "effectFamilies",
                    "supportedActionScopes",
                    "retryPolicyRef",
                    "simulatorContractRef",
                ]:
                    require(field in required_profile_fields, f"Profile schema lost required field {field}.")

                for field in [
                    "profileId",
                    "dependencyCode",
                    "failureMode",
                    "maximumEscalationFamilyRefs",
                    "topologyFallbackMode",
                ]:
                    require(field in required_degradation_fields, f"Degradation schema lost required field {field}.")

                for profile in profiles:
                    dependency_code = profile["dependencyCode"]
                    require(dependency_code in dependency_ids, f"Unknown dependency code {dependency_code}.")
                    require(profile["adapterContractProfileId"] not in adapter_ids, "Adapter profile ids must stay unique.")
                    adapter_ids.add(profile["adapterContractProfileId"])
                    require(dependency_code not in dependency_to_profile, f"Dependency {dependency_code} lost one-to-one profile ownership.")
                    dependency_to_profile[dependency_code] = profile
                    require(profile["integrationWorkloadFamilyRef"] in runtime_family_refs, f"{dependency_code} references unknown workload family.")
                    require(profile["requiredTrustZoneBoundaryRef"] in trust_boundary_ids, f"{dependency_code} references unknown trust boundary.")
                    require(profile["retryPolicyRef"] in retry_class_ids, f"{dependency_code} references unknown retry policy.")
                    require(profile["transportAcceptanceTruth"] == "supporting_only", f"{dependency_code} widened transport acceptance into business truth.")
                    require(profile["effectFamilies"], f"{dependency_code} lost effect family ownership.")
                    require(profile["sourceRefs"], f"{dependency_code} lost source refs.")
                    require(
                        len(profile["proofLadder"]) == 4 and profile["proofLadder"][-1]["stage"] == "settlement",
                        f"{dependency_code} proof ladder drifted.",
                    )
                    for effect in profile["effectFamilies"]:
                        owner = effect_to_owner.setdefault(effect["effectFamilyId"], profile["adapterContractProfileId"])
                        require(
                            owner == profile["adapterContractProfileId"],
                            f"Effect family {effect['effectFamilyId']} lost single-owner authority.",
                        )
                    for contract_id in profile["allowedFhirRepresentationContractRefs"]:
                        require(contract_id in fhir_contract_ids, f"{dependency_code} references unknown FHIR contract {contract_id}.")

                for row in degradation_rows:
                    dependency_code = row["dependencyCode"]
                    require(dependency_code in dependency_ids, f"Unknown degradation dependency {dependency_code}.")
                    require(row["retryPolicyRef"] in retry_class_ids, f"{dependency_code} degradation lost retry class parity.")
                    require(row["sourceRefs"], f"{dependency_code} degradation lost source refs.")
                    require(row["impactedWorkloadFamilyRefs"], f"{dependency_code} must name impacted workloads.")
                    require(row["maximumEscalationFamilyRefs"], f"{dependency_code} must bound escalation.")
                    require(
                        len(row["maximumEscalationFamilyRefs"]) <= 3,
                        f"{dependency_code} escalation widened beyond the bounded policy ceiling.",
                    )
                    require(
                        set(row["maximumEscalationFamilyRefs"]).issubset(runtime_family_refs),
                        f"{dependency_code} escalation references unknown workload families.",
                    )

                for profile in profiles:
                    degradation = degradation_by_dependency[profile["dependencyCode"]]
                    require(
                        profile["dependencyDegradationProfileRef"] == degradation["profileId"],
                        f"{profile['dependencyCode']} profile drifted from degradation ref.",
                    )
                    require(
                        profile["mockNowExecution"]["orderingAndReplayBehavior"] == profile["receiptOrderingPolicyRef"],
                        f"{profile['dependencyCode']} simulator replay semantics drifted from profile law.",
                    )
                    require(
                        "Replay" in " ".join(profile["actualProviderStrategyLater"]["contractDifferencesMustRemainBounded"])
                        or "replay" in " ".join(profile["actualProviderStrategyLater"]["contractDifferencesMustRemainBounded"]).lower(),
                        f"{profile['dependencyCode']} actual-later plan lost replay parity.",
                    )
                    require(
                        profile["actualProviderStrategyLater"]["rollbackToSimulatorSafeMode"],
                        f"{profile['dependencyCode']} lost rollback-to-simulator guidance.",
                    )

                explicit_boundaries = {
                    "adp_nhs_login_auth_bridge",
                    "adp_local_booking_supplier",
                    "adp_mesh_secure_message",
                    "adp_telephony_ivr_recording",
                    "adp_sms_notification_delivery",
                    "adp_email_notification_delivery",
                    "adp_pharmacy_referral_transport",
                    "adp_pharmacy_directory_lookup",
                }
                published_codes = {row["adapterCode"] for row in profiles}
                require(explicit_boundaries.issubset(published_codes), "Seq_057 lost one or more mandatory explicit adapter rows.")

                for row in effect_rows:
                    require(row["adapterContractProfileId"] in adapter_ids, f"Effect row {row['effectFamilyId']} references unknown profile.")
                    require(row["requiredTrustZoneBoundaryRef"] in trust_boundary_ids, f"Effect row {row['effectFamilyId']} references unknown trust boundary.")

                for row in simulator_rows:
                    require(row["adapterContractProfileId"] in adapter_ids, f"Simulator row for {row['adapterCode']} references unknown profile.")
                    require(row["mockExecutionWorkloadFamilyRef"] in runtime_family_refs, f"Simulator row {row['adapterCode']} has unknown mock workload family.")
                    require(row["actualProviderWorkloadFamilyRef"] in runtime_family_refs, f"Simulator row {row['adapterCode']} has unknown live workload family.")
                    require(
                        row["blockedLiveGateCount"].isdigit() and row["reviewLiveGateCount"].isdigit(),
                        f"Simulator row {row['adapterCode']} lost gate counts.",
                    )

                print("seq_057 adapter contract profiles validation passed")


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
            import http from "node:http";
            import path from "node:path";
            import { readFile } from "node:fs/promises";
            import { fileURLToPath } from "node:url";
            import { chromium } from "playwright";

            const __filename = fileURLToPath(import.meta.url);
            const __dirname = path.dirname(__filename);
            const ROOT = path.resolve(__dirname, "..", "..");

            function assertCondition(condition, message) {
              if (!condition) {
                throw new Error(message);
              }
            }

            async function createServer() {
              return await new Promise((resolve, reject) => {
                const server = http.createServer(async (request, response) => {
                  try {
                    const pathname = request.url === "/" ? "/docs/architecture/57_adapter_contract_studio.html" : request.url;
                    const filePath = path.join(ROOT, pathname);
                    const payload = await readFile(filePath);
                    const contentType = pathname.endsWith(".html") ? "text/html; charset=utf-8" : "text/plain; charset=utf-8";
                    response.writeHead(200, { "content-type": contentType });
                    response.end(payload);
                  } catch (error) {
                    response.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
                    response.end(String(error));
                  }
                });
                server.listen(0, "127.0.0.1", () => resolve(server));
                server.once("error", reject);
              });
            }

            async function run() {
              const server = await createServer();
              const address = server.address();
              const url = `http://127.0.0.1:${address.port}/docs/architecture/57_adapter_contract_studio.html`;
              const browser = await chromium.launch({ headless: true });
              try {
                const page = await browser.newPage({ viewport: { width: 1440, height: 960 } });
                await page.goto(url, { waitUntil: "networkidle" });

                const adapterCount = await page.locator("[data-testid='metric-adapter-count']").textContent();
                assertCondition(adapterCount === "20", "Expected 20 adapter profiles in the masthead.");

                await page.selectOption("[data-testid='dependency-filter']", "dep_pharmacy_referral_transport");
                const pharmacyCards = await page.locator("[data-testid^='profile-card-']").count();
                assertCondition(pharmacyCards === 1, `Expected one pharmacy transport card, found ${pharmacyCards}.`);

                await page.selectOption("[data-testid='dependency-filter']", "all");
                await page.selectOption("[data-testid='posture-filter']", "watch_only");
                const watchCards = await page.locator("[data-testid^='profile-card-']").count();
                assertCondition(watchCards === 2, `Expected two watch-only cards, found ${watchCards}.`);

                await page.selectOption("[data-testid='posture-filter']", "all");
                await page.locator("#compare-actual-later").click();
                const compareMode = await page.locator("#comparison-table").getAttribute("data-compare-mode");
                assertCondition(compareMode === "actual-later", "Simulator/live toggle failed to switch to actual-later mode.");

                await page.locator("[data-testid='effect-row-fxf_mesh_secure_message_dispatch']").click();
                const inspectorText = await page.locator("[data-testid='inspector']").innerText();
                assertCondition(
                  inspectorText.includes("adp_mesh_secure_message") &&
                    inspectorText.includes("dep_cross_org_secure_messaging_mesh"),
                  "Inspector failed to synchronize with the effect-family matrix selection.",
                );
                const linkedEffect = await page
                  .locator("[data-testid='effect-row-fxf_mesh_secure_message_dispatch']")
                  .getAttribute("data-linked");
                assertCondition(linkedEffect === "true", "Selected effect-family row did not stay linked.");

                const firstCard = page.locator("[data-testid^='profile-card-']").first();
                const firstProfileId = await firstCard.getAttribute("data-profile-id");
                await firstCard.focus();
                await firstCard.press("ArrowDown");
                const selectedCard = page.locator("[data-testid^='profile-card-'][data-selected='true']").first();
                const secondProfileId = await selectedCard.getAttribute("data-profile-id");
                assertCondition(
                  firstProfileId !== secondProfileId,
                  "ArrowDown did not move selection to the next profile card.",
                );

                await page.setViewportSize({ width: 390, height: 844 });
                const inspectorVisible = await page.locator("[data-testid='inspector']").isVisible();
                assertCondition(inspectorVisible, "Inspector disappeared on mobile width.");

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
                assertCondition(landmarks >= 7, `Expected multiple landmarks, found ${landmarks}.`);
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

            export const adapterContractStudioManifest = {
              adapterProfiles: 20,
              degradationProfiles: 20,
              coverage: [
                "dependency filtering",
                "simulator/live comparison toggle",
                "matrix and inspector synchronization",
                "keyboard navigation",
                "responsive layout",
                "reduced motion",
              ],
            };
            """
        ).strip()
        + "\n"
    )


def assumptions() -> list[dict[str, str]]:
    return [
        {
            "assumption_id": "ASSUMPTION_057_ASSISTIVE_WATCH_SHADOW",
            "summary": "The assistive vendor lane is treated as a watch-shadow adapter boundary until a later phase freezes live invocation policy.",
        },
        {
            "assumption_id": "ASSUMPTION_057_STANDARDS_SOURCE_CACHE_TWIN",
            "summary": "Standards and assurance sources use a synthetic watch-cache twin now so release-critical drift logic is testable without external fetches.",
        },
        {
            "assumption_id": "ASSUMPTION_057_PDS_REMAINS_OPTIONAL",
            "summary": "Optional PDS enrichment remains feature-flagged and may legally stay on a permanent simulator-backed path for some tenants.",
        },
    ]


def main() -> None:
    context = load_context()
    assumption_rows = assumptions()
    profiles = [build_profile_row(context, dependency) for dependency in context["dependencies"]]
    degradation_rows = [
        build_degradation_row(profile, context["dependency_lookup"][profile["dependencyCode"]])
        for profile in profiles
    ]
    effect_rows = build_effect_matrix_rows(profiles)
    simulator_rows = build_simulator_matrix_rows(context, profiles, degradation_rows)
    profile_pack = build_profile_pack(profiles, effect_rows, simulator_rows, assumption_rows)
    degradation_pack = build_degradation_pack(degradation_rows, assumption_rows)
    profile_schema = build_profile_schema()
    degradation_schema = build_degradation_schema()
    studio_payload = build_studio_payload(profiles, degradation_rows, effect_rows, simulator_rows)

    write_json(PROFILE_JSON_PATH, profile_pack)
    write_json(DEGRADATION_JSON_PATH, degradation_pack)
    write_csv(EFFECT_MATRIX_PATH, list(effect_rows[0].keys()), effect_rows)
    write_csv(SIMULATOR_MATRIX_PATH, list(simulator_rows[0].keys()), simulator_rows)
    write_json(PACKAGE_PROFILE_SCHEMA_PATH, profile_schema)
    write_json(PACKAGE_DEGRADATION_SCHEMA_PATH, degradation_schema)
    write_text(STRATEGY_DOC_PATH, build_strategy_doc(profiles, degradation_rows, effect_rows, assumption_rows))
    write_text(DEGRADATION_DOC_PATH, build_degradation_doc(degradation_rows))
    write_text(MOCK_DOC_PATH, build_mock_doc(profiles))
    write_text(MATRIX_DOC_PATH, build_matrix_doc(effect_rows))
    write_text(STUDIO_PATH, build_lab_html(studio_payload))
    write_text(VALIDATOR_PATH, build_validator())
    VALIDATOR_PATH.chmod(0o755)
    write_text(SPEC_PATH, build_spec())

    update_api_contract_package(profiles, degradation_rows)
    update_root_package()
    update_playwright_package()
    patch_engineering_builder()

    print(
        "seq_057 adapter contract artifacts generated: "
        f"{len(profiles)} adapter profiles, "
        f"{len(degradation_rows)} degradation profiles, "
        f"{len(effect_rows)} effect rows, "
        f"{len(simulator_rows)} simulator/live rows."
    )


if __name__ == "__main__":
    main()
