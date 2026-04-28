#!/usr/bin/env python3
from __future__ import annotations

import csv
import hashlib
import json
import re
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
PACKAGE_DIR = ROOT / "packages" / "event-contracts"
SCHEMA_DIR = PACKAGE_DIR / "schemas"

PHASE0_PATH = ROOT / "blueprint" / "phase-0-the-foundation-protocol.md"
RUNTIME_BLUEPRINT_PATH = ROOT / "blueprint" / "platform-runtime-and-release-blueprint.md"
OBJECT_CATALOG_PATH = DATA_DIR / "object_catalog.json"
STATE_MACHINE_PATH = DATA_DIR / "state_machines.json"
DEGRADED_DEFAULTS_PATH = DATA_DIR / "degraded_mode_defaults.json"
DOMAIN_MANIFEST_PATH = DATA_DIR / "domain_package_manifest.json"
RUNTIME_MANIFEST_PATH = DATA_DIR / "runtime_topology_manifest.json"
GATEWAY_SURFACE_PATH = DATA_DIR / "gateway_bff_surfaces.json"
ROOT_PACKAGE_PATH = ROOT / "package.json"
PLAYWRIGHT_PACKAGE_PATH = TESTS_DIR / "package.json"
PACKAGE_SOURCE_PATH = PACKAGE_DIR / "src" / "index.ts"
PACKAGE_TEST_PATH = PACKAGE_DIR / "tests" / "public-api.test.ts"
PACKAGE_README_PATH = PACKAGE_DIR / "README.md"

TASK_ID = "seq_048"
CAPTURED_ON = "2026-04-11"
VISUAL_MODE = "Event_Registry_Studio"
GENERATED_AT = datetime.now(timezone.utc).isoformat(timespec="seconds")
PUBLISHED_AT = "2026-04-11T00:00:00+00:00"
MISSION = (
    "Define the canonical event namespace, schema registry, normalization pipeline, and "
    "evolution process so every Vecells lifecycle, continuity, recovery, observability, "
    "and audit event resolves through one governed event authority."
)

NAMESPACE_PATH = DATA_DIR / "canonical_event_namespaces.json"
CONTRACT_PATH = DATA_DIR / "canonical_event_contracts.json"
NORMALIZATION_PATH = DATA_DIR / "canonical_event_normalization_rules.json"
SCHEMA_VERSION_PATH = DATA_DIR / "canonical_event_schema_versions.json"
FAMILY_MATRIX_PATH = DATA_DIR / "canonical_event_family_matrix.csv"

STRATEGY_PATH = DOCS_DIR / "48_event_namespace_strategy.md"
PROCESS_PATH = DOCS_DIR / "48_event_schema_registry_process.md"
CATALOG_PATH = DOCS_DIR / "48_event_contract_catalog.md"
STUDIO_PATH = DOCS_DIR / "48_event_registry_studio.html"

SPEC_PATH = TESTS_DIR / "event-registry-studio.spec.js"

SOURCE_PRECEDENCE = [
    "prompt/048.md",
    "prompt/shared_operating_contract_046_to_055.md",
    "prompt/AGENT.md",
    "prompt/checklist.md",
    "blueprint/phase-0-the-foundation-protocol.md#CanonicalEventNamespace",
    "blueprint/phase-0-the-foundation-protocol.md#CanonicalEventContract",
    "blueprint/phase-0-the-foundation-protocol.md#CanonicalEventEnvelope",
    "blueprint/phase-0-the-foundation-protocol.md#CanonicalEventNormalizationRule",
    "blueprint/phase-0-the-foundation-protocol.md#Minimum required canonical event families",
    "blueprint/platform-runtime-and-release-blueprint.md#RuntimePublicationBundle",
    "blueprint/platform-runtime-and-release-blueprint.md#ReleasePublicationParityRecord",
    "blueprint/platform-runtime-and-release-blueprint.md#ReleaseWatchTuple",
    "blueprint/forensic-audit-findings.md#Finding 40",
    "blueprint/forensic-audit-findings.md#Finding 43",
    "blueprint/forensic-audit-findings.md#Finding 61",
    "blueprint/forensic-audit-findings.md#Finding 62",
    "blueprint/forensic-audit-findings.md#Finding 63",
    "blueprint/forensic-audit-findings.md#Finding 64",
    "blueprint/forensic-audit-findings.md#Finding 65",
    "blueprint/forensic-audit-findings.md#Finding 66",
    "blueprint/forensic-audit-findings.md#Finding 67",
    "blueprint/forensic-audit-findings.md#Finding 68",
    "data/analysis/object_catalog.json",
    "data/analysis/state_machines.json",
    "data/analysis/degraded_mode_defaults.json",
    "data/analysis/domain_package_manifest.json",
    "data/analysis/runtime_topology_manifest.json",
    "data/analysis/gateway_bff_surfaces.json",
]

NAMESPACE_ORDER = [
    "request",
    "intake",
    "identity",
    "access",
    "telephony",
    "safety",
    "triage",
    "booking",
    "hub",
    "pharmacy",
    "patient",
    "communication",
    "reachability",
    "exception",
    "confirmation",
    "capacity",
    "support",
    "assistive",
    "policy",
    "release",
    "analytics",
    "audit",
]

ROOT_SCRIPT_UPDATES = {
    "bootstrap": (
        "pnpm install && node ./tools/dev-bootstrap/index.mjs && pnpm codegen && "
        "pnpm validate:topology && pnpm validate:runtime-topology && pnpm validate:gateway-surface && "
        "pnpm validate:events && pnpm validate:fhir && pnpm validate:frontend && "
        "pnpm validate:release-parity && pnpm validate:design-publication && pnpm validate:audit-worm && pnpm validate:scaffold && pnpm validate:services && "
        "pnpm validate:domains && pnpm validate:standards"
    ),
    "check": (
        "pnpm lint && pnpm format:check && pnpm typecheck && pnpm test && "
        "pnpm validate:topology && pnpm validate:runtime-topology && pnpm validate:gateway-surface && "
        "pnpm validate:events && pnpm validate:fhir && pnpm validate:frontend && "
        "pnpm validate:release-parity && pnpm validate:design-publication && pnpm validate:audit-worm && pnpm validate:scaffold && pnpm validate:services && "
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
        "python3 ./tools/analysis/build_design_contract_publication.py && python3 ./tools/analysis/build_audit_and_worm_strategy.py && "
        "python3 ./tools/analysis/build_engineering_standards.py && pnpm format"
    ),
    "validate:events": "python3 ./tools/analysis/validate_event_registry.py",
    "validate:fhir": "python3 ./tools/analysis/validate_fhir_representation_contracts.py",
    "validate:frontend": "python3 ./tools/analysis/validate_frontend_contract_manifests.py",
    "validate:release-parity": "python3 ./tools/analysis/validate_release_freeze_and_parity.py",
    "validate:design-publication": "python3 ./tools/analysis/validate_design_contract_publication.py",
    "validate:audit-worm": "python3 ./tools/analysis/validate_audit_and_worm_strategy.py",
}
ROOT_SCRIPT_UPDATES = SHARED_ROOT_SCRIPT_UPDATES

NAMESPACE_META: dict[str, dict[str, Any]] = {
    "request": {
        "owner": "intake_safety",
        "purpose_class": "domain_lifecycle",
        "default_disclosure_class": "phi_reference_only",
        "allowed_producers": [
            "intake_safety",
            "triage_workspace",
            "booking",
            "hub_coordination",
            "pharmacy",
            "support",
            "platform_runtime",
        ],
        "route_families": [
            "rf_patient_requests",
            "rf_staff_workspace",
            "rf_support_ticket_workspace",
            "rf_hub_case_management",
            "rf_pharmacy_console",
        ],
        "service_refs": ["service_command_api"],
        "rationale": "Canonical request truth still enters through intake_safety even when later bounded contexts emit lifecycle evidence onto the same lineage.",
    },
    "intake": {
        "owner": "intake_safety",
        "purpose_class": "domain_lifecycle",
        "default_disclosure_class": "phi_reference_only",
        "allowed_producers": ["intake_safety", "communications", "support"],
        "route_families": [
            "rf_intake_self_service",
            "rf_intake_telephony_capture",
            "rf_support_ticket_workspace",
        ],
        "service_refs": ["service_command_api"],
        "rationale": "Ingress, normalization, promotion, and quarantine remain one intake_safety authority even when multiple channels produce them.",
    },
    "identity": {
        "owner": "identity_access",
        "purpose_class": "domain_lifecycle",
        "default_disclosure_class": "minimum_necessary_identity",
        "allowed_producers": ["identity_access", "support", "patient_experience", "platform_runtime"],
        "route_families": [
            "rf_patient_secure_link_recovery",
            "rf_patient_embedded_channel",
            "rf_staff_workspace",
            "rf_support_replay_observe",
        ],
        "service_refs": ["service_command_api"],
        "rationale": "Binding, repair, and session transitions are identity-access truth and must remain explicit under correction freeze and replay.",
    },
    "access": {
        "owner": "identity_access",
        "purpose_class": "control_plane",
        "default_disclosure_class": "minimum_necessary_identity",
        "allowed_producers": ["identity_access", "support", "patient_experience"],
        "route_families": [
            "rf_patient_secure_link_recovery",
            "rf_patient_embedded_channel",
            "rf_support_replay_observe",
        ],
        "service_refs": ["service_command_api"],
        "rationale": "Grant issue, redemption, and supersession remain an identity-access control-plane concern rather than a browser-local routing concern.",
    },
    "telephony": {
        "owner": "communications",
        "purpose_class": "recovery",
        "default_disclosure_class": "masked_channel_descriptor",
        "allowed_producers": ["communications", "intake_safety", "platform_integration", "support"],
        "route_families": ["rf_intake_telephony_capture"],
        "service_refs": [],
        "rationale": "Telephony is published now as canonical channel truth even though seq_043 has not yet scaffolded a dedicated telephony runtime producer.",
    },
    "safety": {
        "owner": "intake_safety",
        "purpose_class": "control_plane",
        "default_disclosure_class": "phi_reference_only",
        "allowed_producers": ["intake_safety", "triage_workspace"],
        "route_families": ["rf_intake_self_service", "rf_intake_telephony_capture", "rf_staff_workspace"],
        "service_refs": ["service_command_api"],
        "rationale": "Safety preemption and reassessment remain on the intake_safety control plane even when downstream review consumes the resulting posture.",
    },
    "triage": {
        "owner": "triage_workspace",
        "purpose_class": "domain_lifecycle",
        "default_disclosure_class": "minimum_necessary_workspace",
        "allowed_producers": ["triage_workspace", "support"],
        "route_families": ["rf_staff_workspace", "rf_staff_workspace_child"],
        "service_refs": ["service_command_api"],
        "rationale": "Task lifecycle and workspace continuity are triage-local truth emitted for coordinator and projection consumers.",
    },
    "booking": {
        "owner": "booking",
        "purpose_class": "domain_lifecycle",
        "default_disclosure_class": "minimum_necessary_booking",
        "allowed_producers": ["booking", "hub_coordination", "patient_experience", "platform_integration"],
        "route_families": ["rf_patient_appointments", "rf_hub_queue", "rf_hub_case_management", "rf_staff_workspace"],
        "service_refs": ["service_command_api", "service_notification_worker"],
        "rationale": "Booking case truth remains separate from request milestones but still publishes the authoritative event stream for confirmation and reconciliation.",
    },
    "hub": {
        "owner": "hub_coordination",
        "purpose_class": "domain_lifecycle",
        "default_disclosure_class": "minimum_necessary_network",
        "allowed_producers": ["hub_coordination", "booking"],
        "route_families": ["rf_hub_queue", "rf_hub_case_management"],
        "service_refs": ["service_command_api"],
        "rationale": "Hub transfers and ranked offers are cross-site truth and therefore must not collapse into patient or support local UI actions.",
    },
    "pharmacy": {
        "owner": "pharmacy",
        "purpose_class": "domain_lifecycle",
        "default_disclosure_class": "minimum_necessary_dispatch",
        "allowed_producers": ["pharmacy", "platform_integration", "patient_experience"],
        "route_families": ["rf_pharmacy_console", "rf_patient_requests", "rf_patient_appointments"],
        "service_refs": ["service_command_api", "service_notification_worker"],
        "rationale": "Dispatch, proof, reachability, and bounce-back events remain visible as a pharmacy-owned stream instead of being flattened into self-care outcomes.",
    },
    "patient": {
        "owner": "patient_experience",
        "purpose_class": "continuity",
        "default_disclosure_class": "patient_safe_summary",
        "allowed_producers": ["patient_experience", "communications", "booking", "hub_coordination", "identity_access"],
        "route_families": [
            "rf_patient_home",
            "rf_patient_requests",
            "rf_patient_appointments",
            "rf_patient_health_record",
            "rf_patient_messages",
            "rf_patient_embedded_channel",
        ],
        "service_refs": ["service_command_api"],
        "rationale": "Patient receipts and continuity artifacts are browser-safe products of canonical truth, not alternate truth sources.",
    },
    "communication": {
        "owner": "communications",
        "purpose_class": "domain_lifecycle",
        "default_disclosure_class": "masked_delivery_descriptor",
        "allowed_producers": ["communications", "platform_integration", "support", "patient_experience"],
        "route_families": ["rf_patient_messages", "rf_support_ticket_workspace"],
        "service_refs": ["service_command_api", "service_notification_worker"],
        "rationale": "Outbound and callback outcomes must publish masked delivery truth through one communications namespace rather than route-local retries.",
    },
    "reachability": {
        "owner": "identity_access",
        "purpose_class": "recovery",
        "default_disclosure_class": "masked_dependency_descriptor",
        "allowed_producers": ["identity_access", "communications", "platform_integration"],
        "route_families": ["rf_patient_messages", "rf_pharmacy_console", "rf_support_ticket_workspace"],
        "service_refs": ["service_command_api", "service_notification_worker"],
        "rationale": "Reachability materially changes safety and delivery posture, so it remains an explicit recovery namespace rather than a side note on communication events.",
    },
    "exception": {
        "owner": "identity_access",
        "purpose_class": "recovery",
        "default_disclosure_class": "masked_exception_descriptor",
        "allowed_producers": ["identity_access", "intake_safety", "support"],
        "route_families": ["rf_staff_workspace", "rf_support_ticket_workspace"],
        "service_refs": ["service_command_api"],
        "rationale": "Fallback and review-case recovery now stay on a first-class exception spine instead of disappearing inside a case object only.",
    },
    "confirmation": {
        "owner": "identity_access",
        "purpose_class": "control_plane",
        "default_disclosure_class": "masked_confirmation_descriptor",
        "allowed_producers": ["identity_access", "booking", "hub_coordination", "pharmacy", "platform_integration"],
        "route_families": ["rf_patient_appointments", "rf_hub_case_management", "rf_pharmacy_console"],
        "service_refs": ["service_command_api", "service_notification_worker"],
        "rationale": "Ambiguous external truth is published as a confirmation-gate stream so closures and calm UI states remain fail-closed.",
    },
    "capacity": {
        "owner": "booking",
        "purpose_class": "domain_lifecycle",
        "default_disclosure_class": "masked_capacity_descriptor",
        "allowed_producers": ["booking", "hub_coordination"],
        "route_families": ["rf_patient_appointments", "rf_hub_queue"],
        "service_refs": ["service_command_api"],
        "rationale": "Reservation semantics remain explicitly truthful and diffable rather than being implied by patient countdown UI or queue order.",
    },
    "support": {
        "owner": "support",
        "purpose_class": "continuity",
        "default_disclosure_class": "masked_support_excerpt",
        "allowed_producers": ["support", "communications", "identity_access"],
        "route_families": ["rf_support_ticket_workspace", "rf_support_replay_observe"],
        "service_refs": ["service_command_api"],
        "rationale": "Support replay and repair must publish bounded continuity truth before live controls can re-arm.",
    },
    "assistive": {
        "owner": "assistive_lab",
        "purpose_class": "continuity",
        "default_disclosure_class": "masked_assistive_descriptor",
        "allowed_producers": ["assistive_lab", "triage_workspace", "support"],
        "route_families": ["rf_assistive_control_shell", "rf_staff_workspace_child"],
        "service_refs": [],
        "rationale": "Assistive continuity and freeze events are published now even though the dedicated assistive runtime remains a reserved lab surface in seq_046.",
    },
    "policy": {
        "owner": "governance_admin",
        "purpose_class": "control_plane",
        "default_disclosure_class": "control_plane_safe",
        "allowed_producers": ["governance_admin", "release_control"],
        "route_families": ["rf_governance_shell", "rf_operations_drilldown"],
        "service_refs": [],
        "rationale": "Policy compilation and promotion remain governance truth and must not be reconstructed from admin form actions.",
    },
    "release": {
        "owner": "release_control",
        "purpose_class": "control_plane",
        "default_disclosure_class": "control_plane_safe",
        "allowed_producers": ["release_control", "platform_runtime"],
        "route_families": ["rf_governance_shell", "rf_operations_board"],
        "service_refs": ["service_api_gateway"],
        "rationale": "Release publication, freeze, and rollback posture must remain explicit runtime truth consumed by shells and operators.",
    },
    "analytics": {
        "owner": "analytics_assurance",
        "purpose_class": "observability",
        "default_disclosure_class": "control_plane_safe",
        "allowed_producers": ["analytics_assurance", "platform_runtime", "release_control"],
        "route_families": ["rf_operations_board", "rf_operations_drilldown"],
        "service_refs": [],
        "rationale": "Analytics health and assurance slice posture remain observable contracts even before a dedicated analytics runtime service is scaffolded.",
    },
    "audit": {
        "owner": "audit_compliance",
        "purpose_class": "observability",
        "default_disclosure_class": "control_plane_safe",
        "allowed_producers": ["audit_compliance", "governance_admin", "release_control"],
        "route_families": ["rf_governance_shell", "rf_operations_drilldown", "rf_support_replay_observe"],
        "service_refs": [],
        "rationale": "Audit export and break-glass truth stay append-only and governed, not inferred from operational logs or replay sessions.",
    },
}

WATCH_NAMESPACES = {"telephony", "assistive", "policy", "analytics", "audit"}

SENSITIVE_NAMESPACE_BREAK_EVENTS = {
    "patient.receipt.issued",
    "patient.receipt.degraded",
    "support.replay.restore.settled",
    "assistive.freeze.opened",
    "assistive.freeze.released",
    "audit.break_glass.used",
    "release.freeze.opened",
    "release.freeze.released",
}

RAW_PHI_FORBIDDEN_FIELDS = [
    "rawPhoneNumber",
    "rawMessageBody",
    "rawTranscriptText",
    "binaryArtifactPayload",
    "freeTextPhi",
]

FIELD_LIBRARY: dict[str, dict[str, Any]] = {
    "governingRef": {"type": "string", "description": "Canonical reference to the governing object instance."},
    "governingVersionRef": {"type": "string", "description": "Opaque version or epoch ref for the governing object."},
    "previousState": {"type": "string", "description": "Prior canonical state or posture."},
    "nextState": {"type": "string", "description": "Next canonical state or posture."},
    "stateAxis": {"type": "string", "description": "Named axis or dimension the state change applies to."},
    "artifactRef": {"type": "string", "description": "Governed artifact reference, never raw payload content."},
    "artifactHash": {"type": "string", "description": "Stable checksum for the governed artifact."},
    "evidenceClass": {"type": "string", "description": "Evidence or materiality classification for the event."},
    "blockerReasonCode": {"type": "string", "description": "Reason code for blocker or recovery posture."},
    "blockerSetHash": {"type": "string", "description": "Stable hash over the current blocker set."},
    "recoveryMode": {"type": "string", "description": "Named recovery or degraded mode required after the event."},
    "supersedesRef": {"type": "string", "description": "Prior record or event this row supersedes."},
    "evidenceBoundaryRef": {"type": "string", "description": "Boundary ref that proves what evidence cut is in scope."},
    "settlementState": {"type": "string", "description": "Authoritative settlement state or outcome tuple."},
    "settlementRef": {"type": "string", "description": "Durable settlement or proof reference."},
    "continuityControlCode": {"type": "string", "description": "Continuity control family or projection code."},
    "continuityArtifactRef": {"type": "string", "description": "Governed continuity artifact ref."},
    "continuityHash": {"type": "string", "description": "Stable digest proving the continuity view."},
    "policyBundleRef": {"type": "string", "description": "Compiled policy or contract bundle ref."},
    "policyHash": {"type": "string", "description": "Hash of the published policy content."},
    "effectiveAt": {"type": "string", "format": "date-time", "description": "When the governing bundle becomes effective."},
    "metricSetRef": {"type": "string", "description": "Reference to the metric, health, or verdict set."},
    "verdictCode": {"type": "string", "description": "Named verdict or health class."},
    "freshnessWindowRef": {"type": "string", "description": "Freshness window or observation envelope ref."},
    "quarantineReasonCode": {"type": "string", "description": "Reason code for quarantine or artifact isolation."},
    "degradedModeRef": {"type": "string", "description": "Degraded-mode contract or posture ref."},
    "providerReference": {"type": "string", "description": "Masked provider or confirmation reference."},
    "authoritativeProofState": {"type": "string", "description": "Proof posture for confirmation or dispatch truth."},
    "duplicateDecisionClass": {"type": "string", "description": "Replay or duplicate decision class."},
    "dependencyRef": {"type": "string", "description": "Reachability or external dependency reference."},
    "dependencyState": {"type": "string", "description": "Current dependency or reachability state."},
    "receiptEnvelopeRef": {"type": "string", "description": "Patient or delivery receipt envelope ref."},
    "selectedSlotRef": {"type": "string", "description": "Capacity or booking slot ref."},
    "dispatchAttemptRef": {"type": "string", "description": "Provider dispatch attempt ref."},
    "announcementTupleHash": {"type": "string", "description": "Assistive announcement tuple hash."},
    "exportArtifactRef": {"type": "string", "description": "Governed export artifact reference."},
}

BLOCKED_SCHEMA_PROPOSALS = [
    {
        "diff_id": "DRIFT_SCHEMA_PATIENT_RECEIPT_DEGRADED_RAW_BODY",
        "event_name": "patient.receipt.degraded",
        "candidate_suffix": "v2",
        "compatibility_mode": "namespace_break",
        "review_outcome": "blocked",
        "reason": "Attempted to add raw message body text to a patient receipt event instead of a governed artifact reference.",
        "required_resolution": "Keep message copy in governed artifacts and publish only receiptEnvelopeRef plus degradedModeRef.",
        "source_refs": [
            "blueprint/phase-0-the-foundation-protocol.md#CanonicalEventEnvelope",
            "blueprint/forensic-audit-findings.md#Finding 62",
        ],
    },
    {
        "diff_id": "DRIFT_SCHEMA_CONFIRMATION_GATE_VENDOR_NAMESPACE",
        "event_name": "confirmation.gate.confirmed",
        "candidate_suffix": "vendor-local",
        "compatibility_mode": "namespace_break",
        "review_outcome": "blocked",
        "reason": "A vendor-local confirmation namespace would bypass the canonical gate contract and break replay-safe downstream consumption.",
        "required_resolution": "Normalize vendor callbacks before downstream consumption and keep the canonical confirmation.gate.* authority.",
        "source_refs": [
            "blueprint/phase-0-the-foundation-protocol.md#CanonicalEventNormalizationRule",
            "blueprint/forensic-audit-findings.md#Finding 67",
        ],
    },
    {
        "diff_id": "DRIFT_SCHEMA_REQUEST_CLOSURE_BLOCKERS_LOCAL_LABELS",
        "event_name": "request.closure_blockers.changed",
        "candidate_suffix": "v2",
        "compatibility_mode": "new_version_required",
        "review_outcome": "blocked",
        "reason": "A candidate schema tried to publish route-local blocker labels rather than the canonical blocker-set hash and named reason codes.",
        "required_resolution": "Publish blockerSetHash, blockerReasonCode, and governing refs only; UI labels stay derived projections.",
        "source_refs": [
            "blueprint/phase-0-the-foundation-protocol.md#CanonicalEventEnvelope",
            "blueprint/forensic-audit-findings.md#Finding 68",
        ],
    },
    {
        "diff_id": "DRIFT_SCHEMA_ASSISTIVE_CONTINUITY_NO_REPLAY_PROOF",
        "event_name": "assistive.session.continuity.updated",
        "candidate_suffix": "v2",
        "compatibility_mode": "new_version_required",
        "review_outcome": "blocked",
        "reason": "A candidate schema removed continuityFrameRef and would make replayed assistive posture indistinguishable from live activity.",
        "required_resolution": "Keep continuityFrameRef and announcementTupleHash mandatory for assistive continuity events.",
        "source_refs": [
            "blueprint/phase-0-the-foundation-protocol.md#CanonicalEventEnvelope",
            "blueprint/forensic-audit-findings.md#Finding 43",
        ],
    },
]

REGISTRY_DEFECTS = [
    {
        "defect_id": "RESOLVED_FINDING_040_EXTERNAL_OUTCOMES_ON_EVENT_SPINE",
        "state": "resolved",
        "severity": "high",
        "title": "External outcomes now publish canonical adapter events",
        "summary": "Provider confirmations, delivery receipts, and telephony callbacks are normalized into communication, confirmation, or telephony contracts before downstream use.",
        "affected_namespaces": ["communication", "confirmation", "telephony"],
        "source_refs": ["blueprint/forensic-audit-findings.md#Finding 40"],
    },
    {
        "defect_id": "RESOLVED_FINDING_043_OBJECT_STORE_EVENT_ENTRY",
        "state": "resolved",
        "severity": "high",
        "title": "Object-store artifacts now enter the event spine",
        "summary": "Artifact ingress and quarantine are represented by request and intake canonical events instead of orphaned storage side effects.",
        "affected_namespaces": ["request", "intake"],
        "source_refs": ["blueprint/forensic-audit-findings.md#Finding 43"],
    },
    {
        "defect_id": "RESOLVED_FINDING_061_ATTACHMENT_QUARANTINE",
        "state": "resolved",
        "severity": "high",
        "title": "Attachment quarantine contract published",
        "summary": "The registry now publishes intake.attachment.quarantined with a stable schema and reason-code payload.",
        "affected_namespaces": ["intake"],
        "source_refs": ["blueprint/forensic-audit-findings.md#Finding 61"],
    },
    {
        "defect_id": "RESOLVED_FINDING_062_DEGRADED_RECEIPT",
        "state": "resolved",
        "severity": "high",
        "title": "Degraded receipt contract published",
        "summary": "The registry now publishes patient.receipt.degraded so degraded acknowledgements remain replayable and auditable.",
        "affected_namespaces": ["patient"],
        "source_refs": ["blueprint/forensic-audit-findings.md#Finding 62"],
    },
    {
        "defect_id": "RESOLVED_FINDING_063_FALLBACK_REVIEW_LIFECYCLE",
        "state": "resolved",
        "severity": "high",
        "title": "Fallback review lifecycle normalized into exception.*",
        "summary": "Fallback review cases now publish exception.review_case.opened and exception.review_case.recovered as canonical contracts.",
        "affected_namespaces": ["exception"],
        "source_refs": ["blueprint/forensic-audit-findings.md#Finding 63"],
    },
    {
        "defect_id": "RESOLVED_FINDING_064_IDENTITY_REPAIR_LIFECYCLE",
        "state": "resolved",
        "severity": "high",
        "title": "Identity repair lifecycle published",
        "summary": "Identity repair open, corrected, and closed events are now first-class canonical contracts.",
        "affected_namespaces": ["identity"],
        "source_refs": ["blueprint/forensic-audit-findings.md#Finding 64"],
    },
    {
        "defect_id": "RESOLVED_FINDING_065_DUPLICATE_REVIEW_LIFECYCLE",
        "state": "resolved",
        "severity": "high",
        "title": "Duplicate review lifecycle published",
        "summary": "request.duplicate.review_required and request.duplicate.resolved are published and tied to duplicate-review truth.",
        "affected_namespaces": ["request"],
        "source_refs": ["blueprint/forensic-audit-findings.md#Finding 65"],
    },
    {
        "defect_id": "RESOLVED_FINDING_066_REACHABILITY_EVENTS",
        "state": "resolved",
        "severity": "high",
        "title": "Reachability failure and repair events published",
        "summary": "Reachability dependencies now publish created, failed, and repaired transitions as canonical recovery events.",
        "affected_namespaces": ["reachability"],
        "source_refs": ["blueprint/forensic-audit-findings.md#Finding 66"],
    },
    {
        "defect_id": "RESOLVED_FINDING_067_CONFIRMATION_GATE_EVENTS",
        "state": "resolved",
        "severity": "high",
        "title": "Confirmation-gate lifecycle published",
        "summary": "External confirmation ambiguity now publishes created, confirmed, and disputed gate events with normalization rules for vendor aliases.",
        "affected_namespaces": ["confirmation"],
        "source_refs": ["blueprint/forensic-audit-findings.md#Finding 67"],
    },
    {
        "defect_id": "RESOLVED_FINDING_068_CLOSURE_BLOCKER_EVENTS",
        "state": "resolved",
        "severity": "high",
        "title": "Closure blocker change event published",
        "summary": "request.closure_blockers.changed is now the canonical blocker-set mutation signal for projections and assurance.",
        "affected_namespaces": ["request"],
        "source_refs": ["blueprint/forensic-audit-findings.md#Finding 68"],
    },
    {
        "defect_id": "WATCH_TELEPHONY_RUNTIME_PRODUCER_PENDING",
        "state": "watch",
        "severity": "medium",
        "title": "Telephony namespace has no dedicated seq_043 runtime producer yet",
        "summary": "The registry is published and validator-backed, but telephony events currently rely on future service scaffolding rather than a named telephony runtime executable.",
        "affected_namespaces": ["telephony"],
        "source_refs": ["data/analysis/runtime_topology_manifest.json", "prompt/048.md"],
    },
    {
        "defect_id": "WATCH_ASSISTIVE_RUNTIME_PRODUCER_PENDING",
        "state": "watch",
        "severity": "medium",
        "title": "Assistive namespace is contract-complete but runtime-reserved",
        "summary": "Assistive events are published, but seq_046 still reserves the assistive runtime as a lab surface rather than a canonical service binding.",
        "affected_namespaces": ["assistive"],
        "source_refs": ["data/analysis/runtime_topology_manifest.json", "prompt/048.md"],
    },
    {
        "defect_id": "WATCH_ANALYTICS_AUDIT_RUNTIME_BINDINGS_PENDING",
        "state": "watch",
        "severity": "medium",
        "title": "Analytics and audit remain contract-first before dedicated runtime bindings",
        "summary": "analytics.* and audit.* are now canonical contracts, but dedicated runtime executables are not yet scaffolded in the validated service set.",
        "affected_namespaces": ["analytics", "audit"],
        "source_refs": ["data/analysis/runtime_topology_manifest.json", "prompt/048.md"],
    },
]


def read_text(path: Path) -> str:
    return path.read_text()


def read_json(path: Path) -> Any:
    return json.loads(path.read_text())


def write_text(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content.rstrip() + "\n")


def write_json(path: Path, payload: Any) -> None:
    write_text(path, json.dumps(payload, indent=2))


def stable_id(prefix: str, raw: str) -> str:
    token = re.sub(r"[^A-Z0-9]+", "_", raw.upper()).strip("_")
    return f"{prefix}_{token}"


def sha256_text(content: str) -> str:
    return hashlib.sha256(content.encode("utf-8")).hexdigest()


def sha256_file(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def parse_minimum_event_families(phase0_text: str) -> OrderedDict[str, list[str]]:
    marker = "Minimum required canonical event families:"
    end_marker = "Use these namespaces consistently"
    start = phase0_text.index(marker)
    end = phase0_text.index(end_marker, start)
    block = phase0_text[start:end]
    families: OrderedDict[str, list[str]] = OrderedDict()
    for line in block.splitlines():
        line = line.strip()
        if not line.startswith("- `") or "`:" not in line:
            continue
        values = re.findall(r"`([^`]+)`", line)
        if not values:
            continue
        namespace_token = values[0]
        namespace = namespace_token.replace(".*", "")
        families[namespace] = values[1:]
    return families


def phase0_source_ref(namespace: str) -> str:
    return f"blueprint/phase-0-the-foundation-protocol.md#Minimum required canonical event families / {namespace}.*"


def audit_refs_for_event(event_name: str) -> list[str]:
    refs: list[str] = []
    event_to_findings = {
        "intake.attachment.quarantined": ["blueprint/forensic-audit-findings.md#Finding 61"],
        "patient.receipt.degraded": ["blueprint/forensic-audit-findings.md#Finding 62"],
        "exception.review_case.opened": ["blueprint/forensic-audit-findings.md#Finding 63"],
        "exception.review_case.recovered": ["blueprint/forensic-audit-findings.md#Finding 63"],
        "identity.repair_case.opened": ["blueprint/forensic-audit-findings.md#Finding 64"],
        "identity.repair_case.corrected": ["blueprint/forensic-audit-findings.md#Finding 64"],
        "identity.repair_case.closed": ["blueprint/forensic-audit-findings.md#Finding 64"],
        "request.duplicate.review_required": ["blueprint/forensic-audit-findings.md#Finding 65"],
        "request.duplicate.resolved": ["blueprint/forensic-audit-findings.md#Finding 65"],
        "reachability.dependency.created": ["blueprint/forensic-audit-findings.md#Finding 66"],
        "reachability.dependency.failed": ["blueprint/forensic-audit-findings.md#Finding 66"],
        "reachability.dependency.repaired": ["blueprint/forensic-audit-findings.md#Finding 66"],
        "confirmation.gate.created": ["blueprint/forensic-audit-findings.md#Finding 67"],
        "confirmation.gate.confirmed": ["blueprint/forensic-audit-findings.md#Finding 67"],
        "confirmation.gate.disputed": ["blueprint/forensic-audit-findings.md#Finding 67"],
        "request.closure_blockers.changed": ["blueprint/forensic-audit-findings.md#Finding 68"],
        "communication.delivery.evidence.recorded": ["blueprint/forensic-audit-findings.md#Finding 40"],
        "communication.callback.outcome.recorded": ["blueprint/forensic-audit-findings.md#Finding 40"],
        "telephony.recording.ready": ["blueprint/forensic-audit-findings.md#Finding 40"],
        "request.evidence.capture.frozen": ["blueprint/forensic-audit-findings.md#Finding 43"],
        "intake.attachment.added": ["blueprint/forensic-audit-findings.md#Finding 43"],
    }
    refs.extend(event_to_findings.get(event_name, []))
    return refs


def infer_event_purpose(event_name: str, namespace: str) -> str:
    if namespace in {"policy", "release"}:
        return "policy"
    if namespace in {"analytics", "audit"}:
        return "observability"
    if ".continuity." in event_name or event_name.endswith(".continuity.updated"):
        return "continuity"
    if event_name in {
        "patient.nav.return.bound",
        "patient.record_action.context.issued",
        "patient.recovery.continuation.issued",
        "assistive.context.snapshot.created",
    }:
        return "continuity"
    recovery_tokens = [
        "degraded",
        "recovered",
        "repair_case",
        "repair_branch",
        "repaired",
        "restore",
        "rollback",
        "reopened",
        "urgent_diversion",
    ]
    if any(token in event_name for token in recovery_tokens):
        return "recovery"
    blocker_tokens = [
        "quarantined",
        "review_required",
        "manual_review",
        "failed",
        "blocked",
        "disputed",
        "pending",
        "proof_missing",
        "freeze_committed",
    ]
    if any(token in event_name for token in blocker_tokens):
        return "blocker"
    evidence_tokens = [
        "evidence",
        "snapshot",
        "parity",
        "receipt.enveloped",
        "delivery.evidence",
        "callback.outcome",
        "screened",
        "classified",
        "digest.updated",
        "truth.updated",
        "projection_health.updated",
    ]
    if any(token in event_name for token in evidence_tokens):
        return "evidence"
    settlement_tokens = [
        "settled",
        "confirmed",
        "accepted",
        "completed",
        "reconciled",
        "issued",
        "resolved",
    ]
    if any(token in event_name for token in settlement_tokens):
        return "settlement"
    return "lifecycle"


def infer_compatibility_mode(event_name: str, namespace: str, purpose: str) -> str:
    if event_name in SENSITIVE_NAMESPACE_BREAK_EVENTS:
        return "namespace_break"
    if namespace in {"analytics", "audit", "assistive"} or purpose in {"continuity", "policy", "observability", "settlement"}:
        return "new_version_required"
    return "additive_only"


def infer_replay_semantics(event_name: str, namespace: str, purpose: str) -> str:
    if purpose == "observability":
        return "observational"
    if any(token in event_name for token in ["updated", "truth.updated", "consistency.updated", "digest.updated", "continuity.updated"]):
        return "idempotent_replace"
    if any(token in event_name for token in ["superseded", "rotated", "revoked", "released", "expired", "rollback", "takeover_committed"]):
        return "superseding"
    if namespace in {"analytics", "audit"}:
        return "observational"
    return "append_only"


def infer_governing_object_type(event_name: str) -> str:
    patterns = [
        ("request.evidence.capture.frozen", "EvidenceCaptureBundle"),
        ("request.snapshot.", "EvidenceSnapshot"),
        ("request.evidence.parity.verified", "EvidenceSummaryParityRecord"),
        ("request.representation.", "FhirRepresentationSet"),
        ("request.safety.changed", "SafetyDecisionRecord"),
        ("request.identity.changed", "IdentityBinding"),
        ("request.closure_blockers.changed", "RequestClosureRecord"),
        ("request.close.evaluated", "RequestClosureRecord"),
        ("request.closed", "RequestClosureRecord"),
        ("request.reopened", "RequestClosureRecord"),
        ("request.duplicate.pair_scored", "DuplicatePairEvidence"),
        ("request.duplicate.", "DuplicateResolutionDecision"),
        ("request.lease.", "RequestLifecycleLease"),
        ("request.", "Request"),
        ("intake.draft.", "SubmissionEnvelope"),
        ("intake.ingress.", "SubmissionIngressRecord"),
        ("intake.attachment.", "SubmissionEnvelope"),
        ("intake.normalized", "NormalizedSubmission"),
        ("intake.promotion.settled", "SubmissionPromotionRecord"),
        ("intake.resume.continuity.updated", "DraftContinuityEvidenceProjection"),
        ("identity.binding.", "IdentityBinding"),
        ("identity.repair_signal.recorded", "IdentityRepairSignal"),
        ("identity.repair_case.", "IdentityRepairCase"),
        ("identity.repair_branch.quarantined", "IdentityRepairBranchDisposition"),
        ("identity.repair_release.settled", "IdentityRepairReleaseSettlement"),
        ("identity.session.", "Session"),
        ("access.grant.", "AccessGrant"),
        ("telephony.call.", "CallSession"),
        ("telephony.menu.selected", "CallSession"),
        ("telephony.identity.captured", "CallSession"),
        ("telephony.recording.ready", "TranscriptArtifact"),
        ("telephony.urgent_live.assessed", "TelephonyUrgentLiveAssessment"),
        ("telephony.transcript.readiness.updated", "TelephonyTranscriptReadinessRecord"),
        ("telephony.evidence.", "TelephonyEvidenceReadinessAssessment"),
        ("telephony.manual_review.required", "TelephonyManualReviewDisposition"),
        ("telephony.continuation.eligibility.settled", "TelephonyContinuationEligibility"),
        ("telephony.sms_link.sent", "CommunicationEnvelope"),
        ("telephony.request.seeded", "SubmissionEnvelope"),
        ("telephony.continuation.context.", "TelephonyContinuationContext"),
        ("safety.", "SafetyDecisionRecord"),
        ("triage.task_completion.continuity.updated", "WorkspaceContinuityEvidenceProjection"),
        ("triage.task.", "TriageTask"),
        ("booking.capability.resolved", "BookingCase"),
        ("booking.slots.fetched", "CapacityReservation"),
        ("booking.offers.created", "CapacityReservation"),
        ("booking.slot.", "CapacityReservation"),
        ("booking.commit.", "BookingCase"),
        ("booking.confirmation.truth.updated", "ExternalConfirmationGate"),
        ("booking.appointment.created", "BookingCase"),
        ("booking.reminders.scheduled", "BookingCase"),
        ("booking.cancelled", "BookingCase"),
        ("booking.reschedule.started", "BookingCase"),
        ("booking.manage.continuity.updated", "BookingContinuityEvidenceProjection"),
        ("hub.capacity.snapshot.created", "CapacityReservation"),
        ("hub.offer.", "HubCoordinationCase"),
        ("hub.booking.", "HubCoordinationCase"),
        ("hub.practice.notified", "HubCoordinationCase"),
        ("hub.", "HubCoordinationCase"),
        ("pharmacy.dispatch.", "PharmacyDispatchAttempt"),
        ("pharmacy.consent.", "PharmacyCase"),
        ("pharmacy.outcome.", "PharmacyCase"),
        ("pharmacy.reachability.", "PharmacyCase"),
        ("pharmacy.case.", "PharmacyCase"),
        ("pharmacy.console_settlement.continuity.updated", "PharmacyCase"),
        ("patient.receipt.", "PatientReceiptEnvelope"),
        ("patient.nav.digest.updated", "PatientNavUrgencyDigest"),
        ("patient.nav.return.bound", "PatientNavReturnContract"),
        ("patient.record_action.context.issued", "RecordActionContextToken"),
        ("patient.recovery.continuation.issued", "RecoveryContinuationToken"),
        ("communication.receipt.enveloped", "CommunicationEnvelope"),
        ("communication.command.settled", "ConversationCommandSettlement"),
        ("communication.", "CommunicationEnvelope"),
        ("reachability.assessment.settled", "ReachabilityAssessmentRecord"),
        ("reachability.", "ReachabilityDependency"),
        ("exception.review_case.", "FallbackReviewCase"),
        ("exception.artifact.", "EvidenceSnapshot"),
        ("confirmation.gate.", "ExternalConfirmationGate"),
        ("capacity.reservation.", "CapacityReservation"),
        ("support.replay.restore.", "SupportReplayRestoreSettlement"),
        ("support.", "SupportTicket"),
        ("assistive.transcript.ready", "TranscriptArtifact"),
        ("assistive.context.snapshot.created", "AssistiveContinuityEvidenceProjection"),
        ("assistive.artifact.generated", "TranscriptPresentationArtifact"),
        ("assistive.run.settled", "AssistiveReleaseCandidate"),
        ("assistive.freeze.", "AssistiveReleaseCandidate"),
        ("assistive.session.continuity.updated", "AssistiveContinuityEvidenceProjection"),
        ("policy.bundle.", "CompiledPolicyBundle"),
        ("release.candidate.published", "ReleaseCandidate"),
        ("release.wave.", "DeploymentWave"),
        ("release.freeze.", "DeploymentWave"),
        ("release.rollback.", "DeploymentWave"),
        ("analytics.assurance_slice.", "AssuranceSliceTrustRecord"),
        ("analytics.continuity_control.health.updated", "AssuranceGraphCompletenessVerdict"),
        ("analytics.projection_health.updated", "AssuranceGraphCompletenessVerdict"),
        ("audit.export.generated", "AuditRecord"),
        ("audit.", "AuditRecord"),
    ]
    for pattern, governing_type in patterns:
        if event_name.startswith(pattern) or event_name == pattern:
            return governing_type
    return "CanonicalEventContract"


def identifier_refs_for_event(namespace: str, event_name: str) -> list[str]:
    refs = ["tenantId", "eventId", "eventName", "canonicalEventContractRef", "schemaVersionRef"]
    namespace_specific = {
        "request": ["requestId", "requestLineageRef"],
        "intake": ["submissionEnvelopeRef", "requestLineageRef"],
        "identity": ["identityBindingRef", "subjectRef"],
        "access": ["accessGrantRef", "subjectRef"],
        "telephony": ["callSessionRef", "requestLineageRef"],
        "safety": ["requestId", "safetyDecisionRef"],
        "triage": ["triageTaskRef", "requestId"],
        "booking": ["bookingCaseRef", "requestId"],
        "hub": ["hubCoordinationCaseRef", "requestId"],
        "pharmacy": ["pharmacyCaseRef", "requestId"],
        "patient": ["requestId", "subjectRef"],
        "communication": ["communicationRef", "requestId"],
        "reachability": ["reachabilityDependencyRef", "subjectRef"],
        "exception": ["reviewCaseRef", "requestId"],
        "confirmation": ["confirmationGateRef", "requestId"],
        "capacity": ["capacityReservationRef", "requestId"],
        "support": ["supportTicketRef", "requestId"],
        "assistive": ["assistiveRunRef", "continuityFrameRef"],
        "policy": ["policyBundleRef"],
        "release": ["releaseArtifactRef"],
        "analytics": ["assuranceSliceRef"],
        "audit": ["auditRecordId"],
    }
    refs.extend(namespace_specific[namespace])
    if "duplicate" in event_name:
        refs.append("duplicateClusterRef")
    return refs


def causality_refs_for_event(namespace: str, event_name: str, purpose: str) -> list[str]:
    refs = ["edgeCorrelationId", "causalToken", "producerScopeRef"]
    if namespace in {"patient", "triage", "booking", "hub", "pharmacy", "support"}:
        refs.append("routeIntentRef")
    if purpose in {"settlement", "recovery", "blocker"} or namespace in {"access", "confirmation", "communication"}:
        refs.append("commandSettlementRef")
    if namespace not in {"analytics", "audit"}:
        refs.append("commandActionRecordRef")
    if purpose in {"continuity", "recovery"} or namespace in {"support", "assistive", "patient"}:
        refs.append("continuityFrameRef")
    if namespace in {"access", "communication", "release", "confirmation"}:
        refs.append("effectKeyRef")
    return list(OrderedDict.fromkeys(refs))


def privacy_refs_for_event(namespace: str, purpose: str) -> list[str]:
    refs = ["disclosureClass", "piiClass"]
    if namespace in {"policy", "release", "analytics", "audit"}:
        refs.append("payloadArtifactRef.optional_control_plane")
        return refs
    if namespace in {"patient"}:
        refs.extend(["subjectRef.masked", "payloadArtifactRef.required_for_phi"])
    elif namespace in {"support", "assistive"}:
        refs.extend(["subjectRef.masked", "maskScopeRef", "payloadArtifactRef.required_for_phi"])
    else:
        refs.extend(["subjectRef.reference_only", "payloadArtifactRef.required_for_phi"])
    if purpose == "evidence":
        refs.append("payloadHash.required")
    return refs


def payload_refs_for_event(event_name: str, namespace: str, purpose: str) -> list[str]:
    purpose_payloads = {
        "lifecycle": ["governingRef", "governingVersionRef", "previousState", "nextState", "stateAxis"],
        "evidence": ["governingRef", "artifactRef", "artifactHash", "evidenceClass"],
        "blocker": ["governingRef", "blockerReasonCode", "blockerSetHash", "recoveryMode"],
        "settlement": ["governingRef", "settlementState", "settlementRef"],
        "continuity": ["governingRef", "continuityControlCode", "continuityArtifactRef", "continuityHash"],
        "recovery": ["governingRef", "recoveryMode", "supersedesRef", "evidenceBoundaryRef"],
        "policy": ["governingRef", "policyBundleRef", "policyHash", "effectiveAt"],
        "observability": ["governingRef", "metricSetRef", "verdictCode", "freshnessWindowRef"],
    }
    refs = list(purpose_payloads[purpose])
    if "quarantined" in event_name:
        refs.append("quarantineReasonCode")
    if "degraded" in event_name:
        refs.append("degradedModeRef")
    if namespace == "confirmation":
        refs.extend(["providerReference", "authoritativeProofState"])
    if "duplicate" in event_name:
        refs.append("duplicateDecisionClass")
    if namespace == "reachability":
        refs.extend(["dependencyRef", "dependencyState"])
    if "receipt" in event_name:
        refs.append("receiptEnvelopeRef")
    if namespace in {"booking", "capacity"} and any(token in event_name for token in ["slot", "reservation", "offer", "appointment"]):
        refs.append("selectedSlotRef")
    if namespace == "pharmacy" and "dispatch" in event_name:
        refs.append("dispatchAttemptRef")
    if namespace == "assistive":
        refs.append("announcementTupleHash")
    if namespace == "audit" and "export" in event_name:
        refs.append("exportArtifactRef")
    return list(OrderedDict.fromkeys(refs))


def legacy_alias_refs_for_event(event_name: str) -> list[str]:
    aliases: list[str] = []
    if event_name.startswith("intake."):
        aliases.append(event_name.replace("intake.", "ingest.", 1))
    if event_name.startswith("triage.task."):
        aliases.append(event_name.replace("triage.task.", "tasks.", 1))
    if event_name.startswith("exception.review_case."):
        aliases.append(event_name.replace("exception.", "fallback.", 1))
    if event_name.startswith("confirmation.gate."):
        aliases.append(event_name.replace("confirmation.", "external.confirmation.", 1))
    if event_name == "communication.delivery.evidence.recorded":
        aliases.extend(["R_MSG.delivery.receipt", "provider.delivery.receipt"])
    if event_name == "communication.callback.outcome.recorded":
        aliases.extend(["R_GP.callback.outcome", "R_REF.callback.outcome"])
    if event_name == "telephony.recording.ready":
        aliases.extend(["R_TEL.recording.ready", "ivr.recording.complete"])
    if event_name == "request.evidence.capture.frozen":
        aliases.append("object_store.capture.frozen")
    if event_name == "intake.attachment.quarantined":
        aliases.append("object_store.attachment.quarantined")
    return aliases


def rationale_for_event(event_name: str, purpose: str) -> str:
    if purpose == "continuity":
        return "Continuity and recovery surfaces must consume this canonical event instead of route-local session or cache heuristics."
    if purpose == "recovery":
        return "Recovery posture is first-class authority here so degraded or corrective flows remain replay-safe and auditable."
    if purpose == "blocker":
        return "This event prevents downstream projections from reverse-engineering blocker truth from unrelated state changes."
    if purpose == "evidence":
        return "The payload is reference-only so evidence truth remains canonical without leaking PHI into the event spine."
    if purpose == "settlement":
        return "Downstream consumers need one authoritative settlement event rather than transport acknowledgements or optimistic UI state."
    if purpose == "policy":
        return "Policy and release changes must be published as explicit runtime truth rather than implicit deployment order."
    if purpose == "observability":
        return "Operational and assurance consumers share this canonical contract so observability does not fork local event semantics."
    return "The event names one canonical lifecycle transition so projections, analytics, assurance, and replay share the same semantic authority."


def normalization_rules(contracts: list[dict[str, Any]]) -> list[dict[str, Any]]:
    contract_by_name = {row["eventName"]: row for row in contracts}
    rules: list[dict[str, Any]] = []

    def add_rule(
        rule_id: str,
        producer: str,
        source_namespace: str,
        source_pattern: str,
        target_event: str,
        payload_policy: str,
        privacy_policy: str,
        rationale: str,
        source_refs: list[str],
    ) -> None:
        target = contract_by_name[target_event]
        rules.append(
            {
                "canonicalEventNormalizationRuleId": rule_id,
                "sourceProducerRef": producer,
                "sourceNamespacePattern": source_namespace,
                "sourceEventPattern": source_pattern,
                "targetCanonicalEventContractRef": target["canonicalEventContractId"],
                "normalizationVersionRef": "nr.v1",
                "payloadRewritePolicyRef": payload_policy,
                "privacyRewritePolicyRef": privacy_policy,
                "ruleState": "active",
                "publishedAt": PUBLISHED_AT,
                "source_refs": source_refs,
                "rationale": rationale,
            }
        )

    for contract in contracts:
        event_name = contract["eventName"]
        if event_name.startswith("intake."):
            add_rule(
                stable_id("CENR", f"ingest->{event_name}"),
                "legacy_ingest_pipeline",
                "ingest",
                event_name.replace("intake.", "", 1),
                event_name,
                "rewrite.alias_suffix_to_intake_contract",
                "strip_raw_phi_to_artifact_refs",
                "Legacy ingest producers must normalize into intake.* before projections, analytics, assurance, or audit consume the event.",
                [
                    "blueprint/phase-0-the-foundation-protocol.md#CanonicalEventNormalizationRule",
                    "prompt/048.md",
                ],
            )
        if event_name.startswith("triage.task."):
            add_rule(
                stable_id("CENR", f"tasks->{event_name}"),
                "legacy_task_worker",
                "tasks",
                event_name.replace("triage.task.", "", 1),
                event_name,
                "rewrite.task_suffix_to_triage_contract",
                "preserve_workspace_mask_scope",
                "Task-local producers may not bypass the canonical triage.task.* namespace.",
                [
                    "blueprint/phase-0-the-foundation-protocol.md#CanonicalEventNormalizationRule",
                    "prompt/048.md",
                ],
            )

    for event_name in ["exception.review_case.opened", "exception.review_case.recovered"]:
        add_rule(
            stable_id("CENR", f"fallback->{event_name}"),
            "legacy_fallback_router",
            "fallback.review_case",
            event_name.split(".")[-1],
            event_name,
            "rewrite.fallback_review_case_to_exception_contract",
            "preserve_reason_codes_and_mask_scope",
            "Fallback review aliases must normalize before downstream consumers see them as authoritative exception truth.",
            [
                "blueprint/phase-0-the-foundation-protocol.md#CanonicalEventNormalizationRule",
                "blueprint/forensic-audit-findings.md#Finding 63",
            ],
        )

    for event_name in [
        "confirmation.gate.created",
        "confirmation.gate.confirmed",
        "confirmation.gate.disputed",
        "confirmation.gate.expired",
        "confirmation.gate.cancelled",
    ]:
        add_rule(
            stable_id("CENR", f"external-confirmation->{event_name}"),
            "legacy_provider_callback_gateway",
            "external.confirmation.gate",
            event_name.split(".")[-1],
            event_name,
            "rewrite.external_confirmation_gate_to_canonical_contract",
            "preserve_masked_provider_ref_only",
            "Vendor and adapter callbacks must normalize into confirmation.gate.* before they can affect closure or patient reassurance.",
            [
                "blueprint/phase-0-the-foundation-protocol.md#CanonicalEventNormalizationRule",
                "blueprint/forensic-audit-findings.md#Finding 67",
            ],
        )

    add_rule(
        "CENR_OBJECT_STORE_CAPTURE_TO_REQUEST_EVIDENCE",
        "object_store_ingest_pipeline",
        "object_store",
        "capture.frozen",
        "request.evidence.capture.frozen",
        "rewrite.object_store_capture_to_request_evidence_contract",
        "artifact_ref_only",
        "Object-store captures must enter the canonical event spine as request.evidence.capture.frozen.",
        [
            "blueprint/forensic-audit-findings.md#Finding 43",
            "blueprint/phase-0-the-foundation-protocol.md#CanonicalEventNormalizationRule",
        ],
    )
    add_rule(
        "CENR_OBJECT_STORE_ATTACHMENT_TO_INTAKE_QUARANTINE",
        "object_store_ingest_pipeline",
        "object_store",
        "attachment.quarantined",
        "intake.attachment.quarantined",
        "rewrite.object_store_quarantine_to_intake_contract",
        "artifact_ref_only",
        "Attachment quarantine must be visible as a canonical intake event rather than a storage-only side effect.",
        [
            "blueprint/forensic-audit-findings.md#Finding 43",
            "blueprint/forensic-audit-findings.md#Finding 61",
        ],
    )
    add_rule(
        "CENR_PROVIDER_RECEIPT_TO_COMMUNICATION_EVIDENCE",
        "service_notification_worker",
        "provider.delivery",
        "receipt",
        "communication.delivery.evidence.recorded",
        "rewrite.delivery_receipt_to_communication_evidence_contract",
        "masked_delivery_descriptor_only",
        "Provider receipts must publish through the canonical communication evidence contract rather than route-local acknowledgements.",
        [
            "blueprint/forensic-audit-findings.md#Finding 40",
            "prompt/048.md",
        ],
    )
    add_rule(
        "CENR_PROVIDER_CALLBACK_TO_COMMUNICATION_OUTCOME",
        "service_notification_worker",
        "provider.callback",
        "outcome",
        "communication.callback.outcome.recorded",
        "rewrite.provider_callback_to_communication_outcome_contract",
        "masked_delivery_descriptor_only",
        "External callbacks must publish through the canonical event spine before downstream consumption.",
        [
            "blueprint/forensic-audit-findings.md#Finding 40",
            "prompt/048.md",
        ],
    )
    add_rule(
        "CENR_TELEPHONY_CALLBACK_TO_RECORDING_READY",
        "legacy_telephony_adapter",
        "ivr.callback",
        "recording.ready",
        "telephony.recording.ready",
        "rewrite.telephony_callback_to_recording_ready_contract",
        "artifact_ref_only",
        "Telephony callback outcomes remain canonical adapter events rather than UI actions.",
        [
            "blueprint/forensic-audit-findings.md#Finding 40",
            "prompt/048.md",
        ],
    )

    rules.sort(key=lambda row: row["canonicalEventNormalizationRuleId"])
    return rules


def build_namespaces(runtime_manifest: dict[str, Any]) -> list[dict[str, Any]]:
    context_codes = {row["context_code"] for row in runtime_manifest["context_runtime_homes"]}
    context_codes.update({"shared_contracts", "platform_runtime", "platform_integration"})
    namespaces: list[dict[str, Any]] = []
    for namespace in NAMESPACE_ORDER:
        meta = NAMESPACE_META[namespace]
        if meta["owner"] not in context_codes:
            context_codes.add(meta["owner"])
        namespaces.append(
            {
                "canonicalEventNamespaceId": stable_id("CEN", namespace),
                "namespaceCode": namespace,
                "owningBoundedContextRef": meta["owner"],
                "eventPurposeClass": meta["purpose_class"],
                "allowedProducerContextRefs": meta["allowed_producers"],
                "defaultDisclosureClass": meta["default_disclosure_class"],
                "namespaceState": "active",
                "publishedAt": PUBLISHED_AT,
                "routeFamilyRefs": meta["route_families"],
                "activeProducerServiceRefs": meta["service_refs"],
                "source_refs": [
                    "blueprint/phase-0-the-foundation-protocol.md#CanonicalEventNamespace",
                    phase0_source_ref(namespace),
                    "blueprint/platform-runtime-and-release-blueprint.md#RuntimePublicationBundle",
                ],
                "rationale": meta["rationale"],
                "defectState": "watch" if namespace in WATCH_NAMESPACES else "declared",
            }
        )
    return namespaces


def build_contracts(
    families: OrderedDict[str, list[str]],
    namespaces: list[dict[str, Any]],
) -> list[dict[str, Any]]:
    namespace_by_code = {row["namespaceCode"]: row for row in namespaces}
    contracts: list[dict[str, Any]] = []
    for namespace, events in families.items():
        namespace_row = namespace_by_code[namespace]
        for index, event_name in enumerate(events, start=1):
            purpose = infer_event_purpose(event_name, namespace)
            compatibility_mode = infer_compatibility_mode(event_name, namespace, purpose)
            replay_semantics = infer_replay_semantics(event_name, namespace, purpose)
            contract = {
                "canonicalEventContractId": stable_id("CEC", event_name),
                "eventName": event_name,
                "namespaceRef": namespace_row["canonicalEventNamespaceId"],
                "namespaceCode": namespace,
                "owningBoundedContextRef": namespace_row["owningBoundedContextRef"],
                "governingObjectType": infer_governing_object_type(event_name),
                "eventPurpose": purpose,
                "requiredIdentifierRefs": identifier_refs_for_event(namespace, event_name),
                "requiredCausalityRefs": causality_refs_for_event(namespace, event_name, purpose),
                "requiredPrivacyRefs": privacy_refs_for_event(namespace, purpose),
                "requiredPayloadRefs": payload_refs_for_event(event_name, namespace, purpose),
                "legacyAliasRefs": legacy_alias_refs_for_event(event_name),
                "schemaVersionRef": stable_id("CESV", f"{event_name}.v1"),
                "compatibilityMode": compatibility_mode,
                "replaySemantics": replay_semantics,
                "contractState": "active",
                "publishedAt": PUBLISHED_AT,
                "routeFamilyRefs": namespace_row["routeFamilyRefs"],
                "activeProducerContextRefs": namespace_row["allowedProducerContextRefs"],
                "activeProducerServiceRefs": namespace_row["activeProducerServiceRefs"],
                "defectState": "watch" if namespace in WATCH_NAMESPACES else "declared",
                "source_refs": [
                    phase0_source_ref(namespace),
                    *audit_refs_for_event(event_name),
                    "blueprint/platform-runtime-and-release-blueprint.md#ReleasePublicationParityRecord",
                ],
                "rationale": rationale_for_event(event_name, purpose),
                "ordinalWithinNamespace": index,
            }
            contracts.append(contract)
    contracts.sort(key=lambda row: (NAMESPACE_ORDER.index(row["namespaceCode"]), row["ordinalWithinNamespace"], row["eventName"]))
    return contracts


def schema_required_envelope_fields(contract: dict[str, Any]) -> list[str]:
    required = [
        "eventId",
        "eventName",
        "canonicalEventContractRef",
        "namespaceRef",
        "schemaVersionRef",
        "tenantId",
        "producerRef",
        "producerScopeRef",
        "sourceBoundedContextRef",
        "governingBoundedContextRef",
        "governingAggregateRef",
        "governingLineageRef",
        "edgeCorrelationId",
        "piiClass",
        "disclosureClass",
        "occurredAt",
        "emittedAt",
        "payload",
    ]
    if "continuityFrameRef" in contract["requiredCausalityRefs"]:
        required.append("continuityFrameRef")
    if "commandActionRecordRef" in contract["requiredCausalityRefs"]:
        required.append("commandActionRecordRef")
    if "commandSettlementRef" in contract["requiredCausalityRefs"]:
        required.append("commandSettlementRef")
    if "routeIntentRef" in contract["requiredCausalityRefs"]:
        required.append("routeIntentRef")
    if "effectKeyRef" in contract["requiredCausalityRefs"]:
        required.append("effectKeyRef")
    if any(ref.endswith("required_for_phi") for ref in contract["requiredPrivacyRefs"]):
        required.extend(["payloadArtifactRef", "payloadHash"])
    if any(ref.startswith("subjectRef") for ref in contract["requiredPrivacyRefs"]):
        required.append("subjectRef")
    return list(OrderedDict.fromkeys(required))


def schema_properties_for_payload(contract: dict[str, Any]) -> dict[str, Any]:
    properties: dict[str, Any] = {}
    for ref in contract["requiredPayloadRefs"]:
        spec = FIELD_LIBRARY.get(ref)
        if spec is None:
            properties[ref] = {"type": "string", "description": "Canonical payload ref."}
        else:
            properties[ref] = spec
    return properties


def build_schema(contract: dict[str, Any]) -> dict[str, Any]:
    payload_required = contract["requiredPayloadRefs"]
    envelope_required = schema_required_envelope_fields(contract)
    return {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "$id": f"https://vecells.local/schemas/events/{contract['namespaceCode']}/{contract['eventName']}.v1.schema.json",
        "title": f"{contract['eventName']} envelope",
        "description": contract["rationale"],
        "type": "object",
        "additionalProperties": False,
        "required": envelope_required,
        "properties": {
            "eventId": {"type": "string"},
            "eventName": {"const": contract["eventName"]},
            "canonicalEventContractRef": {"const": contract["canonicalEventContractId"]},
            "namespaceRef": {"const": contract["namespaceRef"]},
            "schemaVersionRef": {"const": contract["schemaVersionRef"]},
            "tenantId": {"type": "string"},
            "producerRef": {"type": "string"},
            "producerScopeRef": {"type": "string"},
            "sourceBoundedContextRef": {"const": contract["owningBoundedContextRef"]},
            "governingBoundedContextRef": {"type": "string"},
            "governingAggregateRef": {"type": "string"},
            "governingLineageRef": {"type": "string"},
            "routeIntentRef": {"type": "string"},
            "commandActionRecordRef": {"type": "string"},
            "commandSettlementRef": {"type": "string"},
            "edgeCorrelationId": {"type": "string"},
            "causalToken": {"type": "string"},
            "effectKeyRef": {"type": "string"},
            "continuityFrameRef": {"type": "string"},
            "subjectRef": {"type": "string"},
            "piiClass": {"type": "string"},
            "disclosureClass": {"type": "string"},
            "payloadArtifactRef": {"type": "string"},
            "payloadHash": {"type": "string"},
            "occurredAt": {"type": "string", "format": "date-time"},
            "emittedAt": {"type": "string", "format": "date-time"},
            "payload": {
                "type": "object",
                "additionalProperties": False,
                "required": payload_required,
                "properties": schema_properties_for_payload(contract),
            },
        },
        "allOf": [
            {
                "not": {
                    "properties": {
                        "payload": {
                            "anyOf": [{"required": [field]} for field in RAW_PHI_FORBIDDEN_FIELDS],
                        }
                    }
                }
            }
        ],
    }


def write_schema_artifacts(contracts: list[dict[str, Any]]) -> tuple[list[dict[str, Any]], dict[str, Any]]:
    SCHEMA_DIR.mkdir(parents=True, exist_ok=True)
    schema_versions: list[dict[str, Any]] = []
    catalog_entries: list[dict[str, Any]] = []

    envelope_schema = {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "$id": "https://vecells.local/schemas/events/canonical-event-envelope.v1.schema.json",
        "title": "Canonical event envelope v1",
        "description": "Shared envelope contract for every canonical Vecells event.",
        "type": "object",
        "additionalProperties": False,
        "required": [
            "eventId",
            "eventName",
            "canonicalEventContractRef",
            "namespaceRef",
            "schemaVersionRef",
            "tenantId",
            "producerRef",
            "producerScopeRef",
            "sourceBoundedContextRef",
            "governingBoundedContextRef",
            "governingAggregateRef",
            "governingLineageRef",
            "edgeCorrelationId",
            "piiClass",
            "disclosureClass",
            "occurredAt",
            "emittedAt",
            "payload",
        ],
        "properties": {
            "eventId": {"type": "string"},
            "eventName": {"type": "string"},
            "canonicalEventContractRef": {"type": "string"},
            "namespaceRef": {"type": "string"},
            "schemaVersionRef": {"type": "string"},
            "tenantId": {"type": "string"},
            "producerRef": {"type": "string"},
            "producerScopeRef": {"type": "string"},
            "sourceBoundedContextRef": {"type": "string"},
            "governingBoundedContextRef": {"type": "string"},
            "governingAggregateRef": {"type": "string"},
            "governingLineageRef": {"type": "string"},
            "routeIntentRef": {"type": "string"},
            "commandActionRecordRef": {"type": "string"},
            "commandSettlementRef": {"type": "string"},
            "edgeCorrelationId": {"type": "string"},
            "causalToken": {"type": "string"},
            "effectKeyRef": {"type": "string"},
            "continuityFrameRef": {"type": "string"},
            "subjectRef": {"type": "string"},
            "piiClass": {"type": "string"},
            "disclosureClass": {"type": "string"},
            "payloadArtifactRef": {"type": "string"},
            "payloadHash": {"type": "string"},
            "occurredAt": {"type": "string", "format": "date-time"},
            "emittedAt": {"type": "string", "format": "date-time"},
            "payload": {"type": "object"},
        },
    }
    write_json(SCHEMA_DIR / "canonical-event-envelope.v1.schema.json", envelope_schema)

    for contract in contracts:
        namespace_dir = SCHEMA_DIR / contract["namespaceCode"]
        namespace_dir.mkdir(parents=True, exist_ok=True)
        schema_path = namespace_dir / f"{contract['eventName']}.v1.schema.json"
        schema_payload = build_schema(contract)
        write_json(schema_path, schema_payload)
        artifact_sha = sha256_file(schema_path)
        relative_path = str(schema_path.relative_to(ROOT))
        catalog_entries.append(
            {
                "eventName": contract["eventName"],
                "canonicalEventContractRef": contract["canonicalEventContractId"],
                "schemaVersionRef": contract["schemaVersionRef"],
                "artifactPath": relative_path,
                "artifactSha256": artifact_sha,
                "compatibilityMode": contract["compatibilityMode"],
                "replaySemantics": contract["replaySemantics"],
            }
        )
        schema_versions.append(
            {
                "schemaVersionRef": contract["schemaVersionRef"],
                "canonicalEventContractRef": contract["canonicalEventContractId"],
                "eventName": contract["eventName"],
                "namespaceCode": contract["namespaceCode"],
                "schemaSemver": "1.0.0",
                "versionOrdinal": 1,
                "envelopeSchemaVersionRef": "CESV_CANONICAL_EVENT_ENVELOPE_V1",
                "compatibilityMode": contract["compatibilityMode"],
                "replaySemantics": contract["replaySemantics"],
                "replayProofClass": (
                    "tuple_hash_and_deterministic_effect_key"
                    if contract["replaySemantics"] in {"idempotent_replace", "superseding"}
                    else "append_only_envelope_hash"
                ),
                "artifactPath": relative_path,
                "artifactSha256": artifact_sha,
                "lifecycleState": "active",
                "publishedAt": PUBLISHED_AT,
                "source_refs": contract["source_refs"],
                "rationale": contract["rationale"],
            }
        )

    catalog_payload = {
        "task_id": TASK_ID,
        "generated_at": GENERATED_AT,
        "captured_on": CAPTURED_ON,
        "activeSchemaArtifactCount": len(catalog_entries),
        "envelopeSchemaPath": "packages/event-contracts/schemas/canonical-event-envelope.v1.schema.json",
        "artifacts": catalog_entries,
    }
    write_json(SCHEMA_DIR / "catalog.json", catalog_payload)
    write_text(
        SCHEMA_DIR / "README.md",
        dedent(
            f"""
            # Event Schemas

            Deterministic JSON Schema artifacts for the seq_048 canonical event registry.

            - Active event contracts: `{len(catalog_entries)}`
            - Envelope schema: `canonical-event-envelope.v1.schema.json`
            - Catalog: `catalog.json`

            Raw PHI, message bodies, transcript text, and binary artifact contents are forbidden in these schema payloads. Contracts carry governed artifact refs or masked descriptors only.
            """
        ),
    )
    return schema_versions, catalog_payload


def build_schema_diffs(contracts: list[dict[str, Any]]) -> list[dict[str, Any]]:
    contract_by_event = {row["eventName"]: row for row in contracts}
    diffs: list[dict[str, Any]] = []
    for proposal in BLOCKED_SCHEMA_PROPOSALS:
        contract = contract_by_event[proposal["event_name"]]
        diffs.append(
            {
                "schemaDiffId": proposal["diff_id"],
                "canonicalEventContractRef": contract["canonicalEventContractId"],
                "eventName": contract["eventName"],
                "namespaceCode": contract["namespaceCode"],
                "candidateSchemaVersionRef": stable_id("CESV", f"{proposal['event_name']}.{proposal['candidate_suffix']}"),
                "compatibilityMode": proposal["compatibility_mode"],
                "reviewOutcome": proposal["review_outcome"],
                "reason": proposal["reason"],
                "requiredResolution": proposal["required_resolution"],
                "source_refs": proposal["source_refs"],
            }
        )
    diffs.sort(key=lambda row: row["schemaDiffId"])
    return diffs


def build_namespace_payload(namespaces: list[dict[str, Any]], runtime_manifest: dict[str, Any]) -> dict[str, Any]:
    return {
        "task_id": TASK_ID,
        "generated_at": GENERATED_AT,
        "captured_on": CAPTURED_ON,
        "mission": MISSION,
        "visual_mode": VISUAL_MODE,
        "source_precedence": SOURCE_PRECEDENCE,
        "summary": {
            "namespace_count": len(namespaces),
            "active_namespace_count": sum(1 for row in namespaces if row["namespaceState"] == "active"),
            "watch_namespace_count": sum(1 for row in namespaces if row["defectState"] == "watch"),
            "producer_context_count": len(
                {
                    context
                    for row in namespaces
                    for context in row["allowedProducerContextRefs"]
                }
            ),
            "runtime_context_home_count": len(runtime_manifest["context_runtime_homes"]),
        },
        "namespaces": namespaces,
        "assumptions": [
            {
                "assumption_id": "ASSUMPTION_048_NAMESPACE_OWNERSHIP_USES_CURRENT_REPO_CONTEXT_CODES",
                "statement": "Namespace owners resolve to the current seq_041-047 context codes rather than the older prose-only foundation labels so validators can cross-check live runtime topology outputs.",
            }
        ],
    }


def build_contract_payload(
    contracts: list[dict[str, Any]],
    namespaces: list[dict[str, Any]],
    normalization_rules_payload: list[dict[str, Any]],
    schema_versions: list[dict[str, Any]],
    schema_diffs: list[dict[str, Any]],
) -> dict[str, Any]:
    minimum_events = [row["eventName"] for row in contracts]
    return {
        "task_id": TASK_ID,
        "generated_at": GENERATED_AT,
        "captured_on": CAPTURED_ON,
        "mission": MISSION,
        "visual_mode": VISUAL_MODE,
        "source_precedence": SOURCE_PRECEDENCE,
        "summary": {
            "namespace_count": len(namespaces),
            "active_contract_count": len(contracts),
            "missing_contract_count": 0,
            "blocked_schema_count": len(schema_diffs),
            "normalization_rule_count": len(normalization_rules_payload),
            "namespace_break_contract_count": sum(1 for row in contracts if row["compatibilityMode"] == "namespace_break"),
            "new_version_required_contract_count": sum(1 for row in contracts if row["compatibilityMode"] == "new_version_required"),
        },
        "canonicalEnvelope": {
            "canonicalEventEnvelopeId": "CEE_V1",
            "requiredFields": [
                "eventId",
                "eventName",
                "canonicalEventContractRef",
                "namespaceRef",
                "schemaVersionRef",
                "tenantId",
                "producerRef",
                "producerScopeRef",
                "sourceBoundedContextRef",
                "governingBoundedContextRef",
                "governingAggregateRef",
                "governingLineageRef",
                "edgeCorrelationId",
                "piiClass",
                "disclosureClass",
                "occurredAt",
                "emittedAt",
                "payload",
            ],
            "privacyLaw": "Raw PHI, phone numbers, message bodies, transcripts, and artifact contents are forbidden; governed refs or masked descriptors only.",
            "artifactLaw": "PHI-bearing payloads require payloadArtifactRef and payloadHash rather than inline raw content.",
            "replayLaw": "Replay consumers share one canonical event contract and prove compatibility through schemaVersionRef plus contract hash.",
            "evolutionLaw": "namespace_break is the only legal way to retire a family in place; otherwise evolve additively or publish a new version with replay proof.",
        },
        "requiredMinimumEventNames": minimum_events,
        "contracts": contracts,
        "registryDefects": REGISTRY_DEFECTS,
        "schemaVersionRefs": [row["schemaVersionRef"] for row in schema_versions if row["lifecycleState"] == "active"],
    }


def build_normalization_payload(rules: list[dict[str, Any]]) -> dict[str, Any]:
    return {
        "task_id": TASK_ID,
        "generated_at": GENERATED_AT,
        "captured_on": CAPTURED_ON,
        "mission": MISSION,
        "visual_mode": VISUAL_MODE,
        "source_precedence": SOURCE_PRECEDENCE,
        "summary": {
            "normalization_rule_count": len(rules),
            "source_producer_count": len({row["sourceProducerRef"] for row in rules}),
            "source_namespace_pattern_count": len({row["sourceNamespacePattern"] for row in rules}),
            "alias_family_count": 4,
            "object_store_entry_rule_count": 2,
        },
        "normalizationRules": rules,
    }


def build_schema_version_payload(
    schema_versions: list[dict[str, Any]],
    schema_diffs: list[dict[str, Any]],
    schema_catalog: dict[str, Any],
) -> dict[str, Any]:
    active_versions = [row for row in schema_versions if row["lifecycleState"] == "active"]
    return {
        "task_id": TASK_ID,
        "generated_at": GENERATED_AT,
        "captured_on": CAPTURED_ON,
        "mission": MISSION,
        "visual_mode": VISUAL_MODE,
        "source_precedence": SOURCE_PRECEDENCE,
        "summary": {
            "active_schema_version_count": len(active_versions),
            "blocked_schema_count": len(schema_diffs),
            "schema_artifact_count": schema_catalog["activeSchemaArtifactCount"],
            "additive_only_contract_count": sum(1 for row in active_versions if row["compatibilityMode"] == "additive_only"),
            "new_version_required_contract_count": sum(
                1 for row in active_versions if row["compatibilityMode"] == "new_version_required"
            ),
            "namespace_break_contract_count": sum(
                1 for row in active_versions if row["compatibilityMode"] == "namespace_break"
            ),
        },
        "envelopeSchemaVersion": {
            "schemaVersionRef": "CESV_CANONICAL_EVENT_ENVELOPE_V1",
            "artifactPath": "packages/event-contracts/schemas/canonical-event-envelope.v1.schema.json",
            "artifactSha256": sha256_file(SCHEMA_DIR / "canonical-event-envelope.v1.schema.json"),
            "compatibilityMode": "new_version_required",
            "publishedAt": PUBLISHED_AT,
            "source_refs": [
                "blueprint/phase-0-the-foundation-protocol.md#CanonicalEventEnvelope",
                "prompt/048.md",
            ],
        },
        "schemaVersions": schema_versions,
        "schemaDiffLedger": schema_diffs,
        "evolutionPolicies": [
            {
                "policyCode": "additive_only",
                "rule": "New optional fields and new enum values that preserve replay determinism remain on the same version line.",
            },
            {
                "policyCode": "new_version_required",
                "rule": "Mandatory field changes, replay-token changes, or consumer-visible semantic shifts require a new schema version with replay proof.",
            },
            {
                "policyCode": "namespace_break",
                "rule": "Any breaking family retirement or meaning split must publish under a new namespace rather than repurposing the existing family.",
            },
        ],
        "schemaArtifactCatalog": schema_catalog,
    }


def build_family_matrix(contracts: list[dict[str, Any]]) -> list[dict[str, str]]:
    rows: list[dict[str, str]] = []
    for contract in contracts:
        rows.append(
            {
                "event_name": contract["eventName"],
                "namespace_code": contract["namespaceCode"],
                "owning_context": contract["owningBoundedContextRef"],
                "governing_object_type": contract["governingObjectType"],
                "event_purpose": contract["eventPurpose"],
                "compatibility_mode": contract["compatibilityMode"],
                "replay_semantics": contract["replaySemantics"],
                "schema_version_ref": contract["schemaVersionRef"],
                "defect_state": contract["defectState"],
                "active_producer_context_refs": "; ".join(contract["activeProducerContextRefs"]),
                "active_producer_service_refs": "; ".join(contract["activeProducerServiceRefs"]),
                "legacy_alias_refs": "; ".join(contract["legacyAliasRefs"]),
                "route_family_refs": "; ".join(contract["routeFamilyRefs"]),
            }
        )
    return rows


def write_csv(path: Path, rows: list[dict[str, str]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=list(rows[0].keys()))
        writer.writeheader()
        writer.writerows(rows)


def contract_group_table(contracts: list[dict[str, Any]], namespace: str) -> str:
    namespace_contracts = [row for row in contracts if row["namespaceCode"] == namespace]
    lines = [
        f"### `{namespace}.*`",
        "",
        "| Event | Purpose | Compatibility | Replay | Defect |",
        "| --- | --- | --- | --- | --- |",
    ]
    for row in namespace_contracts:
        lines.append(
            f"| `{row['eventName']}` | `{row['eventPurpose']}` | `{row['compatibilityMode']}` | `{row['replaySemantics']}` | `{row['defectState']}` |"
        )
    return "\n".join(lines)


def build_strategy_doc(namespaces: list[dict[str, Any]], contracts: list[dict[str, Any]]) -> str:
    owner_rows = [
        "| Namespace | Owner | Purpose Class | Allowed Producers | Default Disclosure |",
        "| --- | --- | --- | --- | --- |",
    ]
    for row in namespaces:
        owner_rows.append(
            "| "
            + " | ".join(
                [
                    f"`{row['namespaceCode']}`",
                    f"`{row['owningBoundedContextRef']}`",
                    f"`{row['eventPurposeClass']}`",
                    ", ".join(f"`{item}`" for item in row["allowedProducerContextRefs"]),
                    f"`{row['defaultDisclosureClass']}`",
                ]
            )
            + " |"
        )

    return "\n".join(
        [
            "# 48 Event Namespace Strategy",
            "",
            f"- Task: `{TASK_ID}`",
            f"- Captured on: `{CAPTURED_ON}`",
            f"- Generated at: `{GENERATED_AT}`",
            f"- Visual mode: `{VISUAL_MODE}`",
            "",
            MISSION,
            "",
            "## Gap Closures",
            "",
            "- The Phase 0 event taxonomy is now a real registry instead of a prose-only bullet list.",
            "- Producer-local aliases are normalized before any projection, assurance, analytics, or audit consumer can treat them as authoritative.",
            "- Degraded, recovery, confirmation, reachability, duplicate, and closure-blocker transitions are first-class event contracts with schema artifacts.",
            "- Event privacy law now forbids raw PHI, transcript text, message bodies, and binary payloads inside event schemas.",
            "",
            "## Namespace Ownership",
            "",
            *owner_rows,
            "",
            "## Registry Coverage",
            "",
            f"- Active namespaces: `{len(namespaces)}`",
            f"- Active event contracts: `{len(contracts)}`",
            f"- Watch namespaces: `{sum(1 for row in namespaces if row['defectState'] == 'watch')}`",
            "- Runtime publication and release-watch tooling can now treat event contracts as machine-readable publication truth rather than deployment folklore.",
        ]
    )


def build_process_doc(
    contracts: list[dict[str, Any]],
    normalization_rules_payload: list[dict[str, Any]],
    schema_diffs: list[dict[str, Any]],
) -> str:
    return "\n".join(
        [
            "# 48 Event Schema Registry Process",
            "",
            f"- Task: `{TASK_ID}`",
            f"- Captured on: `{CAPTURED_ON}`",
            f"- Generated at: `{GENERATED_AT}`",
            "",
            "## Envelope Law",
            "",
            "- Every canonical event carries tenant, contract, namespace, schema version, source/governing context, governing aggregate or lineage, correlation, and privacy posture.",
            "- Raw PHI, phone numbers, message bodies, transcript text, and binary payloads are forbidden. Schemas require governed artifact refs or masked descriptors only.",
            "- Replay consumers, analytics consumers, and assurance consumers share one canonical event contract for the same business fact.",
            "",
            "## Compatibility Process",
            "",
            f"- `additive_only` contracts: `{sum(1 for row in contracts if row['compatibilityMode'] == 'additive_only')}`",
            f"- `new_version_required` contracts: `{sum(1 for row in contracts if row['compatibilityMode'] == 'new_version_required')}`",
            f"- `namespace_break` contracts: `{sum(1 for row in contracts if row['compatibilityMode'] == 'namespace_break')}`",
            "- Additive changes may add optional fields or values only when replay determinism remains intact.",
            "- Mandatory-field changes, payload meaning shifts, or replay-token changes require a new version with replay proof.",
            "- Namespace breaks are the only legal in-place family retirement mechanism.",
            "",
            "## Normalization Process",
            "",
            f"- Active normalization rules: `{len(normalization_rules_payload)}`",
            "- Required alias families are covered: `ingest.*`, `tasks.*`, `fallback.review_case.*`, and `external.confirmation.gate.*`.",
            "- External callbacks and object-store ingress now normalize into canonical request, intake, communication, confirmation, or telephony contracts before any downstream consumer can rely on them.",
            "",
            "## Blocked Schema Diffs",
            "",
            *[
                f"- `{row['schemaDiffId']}` on `{row['eventName']}`: {row['reason']}"
                for row in schema_diffs
            ],
            "",
            "## Runtime Publication Fit",
            "",
            "- Active schema artifacts live under `packages/event-contracts/schemas/` and are diffable, checksum-backed, and validator-friendly.",
            "- `validate_event_registry.py` fails if any minimum event family is missing, any alias leaks through as active authority, or any schema artifact loses its contract/version binding.",
        ]
    )


def build_catalog_doc(namespaces: list[dict[str, Any]], contracts: list[dict[str, Any]]) -> str:
    sections = [
        "# 48 Event Contract Catalog",
        "",
        f"- Task: `{TASK_ID}`",
        f"- Captured on: `{CAPTURED_ON}`",
        f"- Generated at: `{GENERATED_AT}`",
        "",
        f"Active event contracts: `{len(contracts)}` across `{len(namespaces)}` namespaces.",
        "",
    ]
    for namespace in NAMESPACE_ORDER:
        sections.extend([contract_group_table(contracts, namespace), ""])
    return "\n".join(sections).rstrip() + "\n"


def build_package_source(
    namespaces: list[dict[str, Any]],
    contracts: list[dict[str, Any]],
    schema_catalog: dict[str, Any],
) -> str:
    namespace_summary = [
        {
            "canonicalEventNamespaceId": row["canonicalEventNamespaceId"],
            "namespaceCode": row["namespaceCode"],
            "owningBoundedContextRef": row["owningBoundedContextRef"],
            "eventPurposeClass": row["eventPurposeClass"],
            "defaultDisclosureClass": row["defaultDisclosureClass"],
            "contractCount": sum(1 for contract in contracts if contract["namespaceCode"] == row["namespaceCode"]),
            "defectState": row["defectState"],
        }
        for row in namespaces
    ]
    contract_summary = [
        {
            "canonicalEventContractId": row["canonicalEventContractId"],
            "eventName": row["eventName"],
            "namespaceCode": row["namespaceCode"],
            "owningBoundedContextRef": row["owningBoundedContextRef"],
            "governingObjectType": row["governingObjectType"],
            "eventPurpose": row["eventPurpose"],
            "schemaVersionRef": row["schemaVersionRef"],
            "compatibilityMode": row["compatibilityMode"],
            "replaySemantics": row["replaySemantics"],
            "defectState": row["defectState"],
        }
        for row in contracts
    ]
    source = f"""
export interface FoundationEventEnvelope<TPayload> {{
  eventType: string;
  emittedAt: string;
  payload: TPayload;
}}

export function makeFoundationEvent<TPayload>(
  eventType: string,
  payload: TPayload,
): FoundationEventEnvelope<TPayload> {{
  return {{
    eventType,
    emittedAt: new Date().toISOString(),
    payload,
  }};
}}

export const packageContract = {json.dumps({
    "artifactId": "package_event_contracts",
    "packageName": "@vecells/event-contracts",
    "packageRole": "shared",
    "ownerContextCode": "shared_contracts",
    "ownerContextLabel": "Shared Contracts",
    "purpose": "Canonical source for event namespaces, contracts, normalization, and schema artifacts.",
    "versioningPosture": "Deterministic JSON Schema registry with explicit compatibility and replay semantics.",
}, indent=2)} as const;

export const ownedContractFamilies = {json.dumps([
    {
        "contractFamilyId": "CF_048_CANONICAL_EVENT_REGISTRY",
        "label": "Canonical event registry",
        "description": "Machine-readable namespace, contract, normalization, and schema authority for every published event family.",
        "versioningPosture": "Schema-first with additive-only, new-version-required, and namespace-break compatibility modes.",
        "consumerContractIds": [
            "CBC_041_COMMAND_API_TO_EVENT_CONTRACTS",
            "CBC_041_PROJECTION_WORKER_TO_DOMAIN_PROJECTIONS",
            "CBC_041_DOMAIN_PACKAGES_TO_EVENT_CONTRACTS",
        ],
        "sourceRefs": [
            "blueprint/phase-0-the-foundation-protocol.md#CanonicalEventContract",
            "prompt/048.md",
        ],
        "namespaceCount": len(namespaces),
        "contractCount": len(contracts),
        "schemaArtifactCount": schema_catalog["activeSchemaArtifactCount"],
    }
], indent=2)} as const;

export const ownedObjectFamilies = {json.dumps([
    {
        "canonicalName": "CanonicalEventNamespace",
        "objectKind": "namespace",
        "boundedContext": "shared_contracts",
        "authoritativeOwner": "Shared event-contract registry",
        "sourceRef": "blueprint/phase-0-the-foundation-protocol.md#CanonicalEventNamespace",
    },
    {
        "canonicalName": "CanonicalEventContract",
        "objectKind": "event_contract",
        "boundedContext": "shared_contracts",
        "authoritativeOwner": "Shared event-contract registry",
        "sourceRef": "blueprint/phase-0-the-foundation-protocol.md#CanonicalEventContract",
    },
    {
        "canonicalName": "CanonicalEventEnvelope",
        "objectKind": "contract",
        "boundedContext": "shared_contracts",
        "authoritativeOwner": "Shared event-contract registry",
        "sourceRef": "blueprint/phase-0-the-foundation-protocol.md#CanonicalEventEnvelope",
    },
    {
        "canonicalName": "CanonicalEventNormalizationRule",
        "objectKind": "contract",
        "boundedContext": "shared_contracts",
        "authoritativeOwner": "Shared event-contract registry",
        "sourceRef": "blueprint/phase-0-the-foundation-protocol.md#CanonicalEventNormalizationRule",
    }
], indent=2)} as const;

export const canonicalEventNamespaces = {json.dumps(namespace_summary, indent=2)} as const;
export const canonicalEventContracts = {json.dumps(contract_summary, indent=2)} as const;
export const schemaArtifactCatalog = {json.dumps({
    "activeSchemaArtifactCount": schema_catalog["activeSchemaArtifactCount"],
    "envelopeSchemaPath": schema_catalog["envelopeSchemaPath"],
    "artifacts": schema_catalog["artifacts"],
}, indent=2)} as const;

export const eventFamilies = canonicalEventContracts.map((row) => ({{
  canonicalName: row.eventName,
  objectKind: "event_contract",
  boundedContext: row.owningBoundedContextRef,
  authoritativeOwner: row.owningBoundedContextRef,
  sourceRef: "prompt/048.md",
}}));

export const publishedEventFamilies = eventFamilies;
export const policyFamilies = ownedContractFamilies;
export const projectionFamilies = canonicalEventContracts;

export function bootstrapSharedPackage() {{
  return {{
    packageName: packageContract.packageName,
    contractFamilies: ownedContractFamilies.length,
    eventFamilies: canonicalEventContracts.length,
    schemaArtifacts: schemaArtifactCatalog.activeSchemaArtifactCount,
  }};
}}

export * from "./submission-lineage-events";
"""
    return dedent(source).strip() + "\n"


def build_package_test() -> str:
    return dedent(
        """
        import { describe, expect, it } from "vitest";
        import {
          bootstrapSharedPackage,
          canonicalEventContracts,
          canonicalEventNamespaces,
          packageContract,
          schemaArtifactCatalog,
        } from "../src/index.ts";
        import { foundationKernelFamilies } from "@vecells/domain-kernel";

        describe("event-contracts public package surface", () => {
          it("publishes the seq_048 event registry through documented public exports", () => {
            expect(packageContract.packageName).toBe("@vecells/event-contracts");
            expect(bootstrapSharedPackage().eventFamilies).toBe(canonicalEventContracts.length);
            expect(canonicalEventContracts.length).toBeGreaterThan(100);
            expect(canonicalEventNamespaces.length).toBe(22);
            expect(schemaArtifactCatalog.activeSchemaArtifactCount).toBe(canonicalEventContracts.length);
            expect(Array.isArray(foundationKernelFamilies)).toBe(true);
          });
        });
        """
    ).strip() + "\n"


def build_package_readme(namespaces: list[dict[str, Any]], contracts: list[dict[str, Any]], schema_catalog: dict[str, Any]) -> str:
    return "\n".join(
        [
            "# Event Contracts",
            "",
            "## Purpose",
            "",
            "Canonical source for event namespaces, event contracts, normalization rules, and JSON Schema artifacts. Producers may not replace it with route-local names or payload drift.",
            "",
            "## Ownership",
            "",
            "- Package: `@vecells/event-contracts`",
            "- Artifact id: `package_event_contracts`",
            "- Owner lane: `Shared Contracts` (`shared_contracts`)",
            "- Canonical object families: `12`",
            "- Shared contract families: `1`",
            "- Versioning posture: `workspace-private published contract boundary with explicit public exports`",
            "",
            "## Source Refs",
            "",
            "- `blueprint/phase-0-the-foundation-protocol.md#CanonicalEventContract`",
            "- `blueprint/phase-0-the-foundation-protocol.md#CanonicalEventEnvelope`",
            "- `prompt/044.md`",
            "- `prompt/048.md`",
            "",
            "## Consumers",
            "",
            "- Boundary contracts: `CBC_041_COMMAND_API_TO_EVENT_CONTRACTS`, `CBC_041_PROJECTION_WORKER_TO_DOMAIN_PROJECTIONS`, `CBC_041_ADAPTER_SIMULATORS_TO_CONTRACT_AND_FIXTURE_PACKAGES`, `CBC_041_DOMAIN_PACKAGES_TO_EVENT_CONTRACTS`",
            "- Consumer selectors: `packages/domains/*`, `services/adapter-simulators`, `services/command-api`, `services/projection-worker`",
            "",
            "## Allowed Dependencies",
            "",
            "- `packages/domain-kernel`",
            "",
            "## Forbidden Dependencies",
            "",
            "- `apps/*`",
            "- `services/*` deep imports",
            "",
            "## Registry Coverage",
            "",
            f"- Namespaces: `{len(namespaces)}`",
            f"- Active event contracts: `{len(contracts)}`",
            f"- Active schema artifacts: `{schema_catalog['activeSchemaArtifactCount']}`",
            "- Envelope schema: `packages/event-contracts/schemas/canonical-event-envelope.v1.schema.json`",
            "- Catalog: `packages/event-contracts/schemas/catalog.json`",
            "",
            "## Public API",
            "",
            "- `makeFoundationEvent()`",
            "- `canonicalEventNamespaces`",
            "- `canonicalEventContracts`",
            "- `schemaArtifactCatalog`",
            "- `publishedEventFamilies`",
            "- `bootstrapSharedPackage()`",
            "",
            "## Contract Families",
            "",
            "- `CF_048_CANONICAL_EVENT_REGISTRY`: machine-readable namespace, contract, normalization, and schema authority for every published event family.",
            "",
            "## Family Coverage",
            "",
            "- Governing object families: `CanonicalEventNamespace`, `CanonicalEventContract`, `CanonicalEventEnvelope`, `CanonicalEventNormalizationRule`, `TelemetryEventContract`, `UIEventEnvelope`, and runtime signal families preserved from seq_044.",
            "- Namespace coverage includes request, attachment, identity, patient, communication, booking, hub, pharmacy, support, governance, analytics, audit, assistive, release, runtime, and control-plane events.",
            "",
            "## Safety Law",
            "",
            "- Raw PHI, transcripts, message bodies, phone numbers, and binary payloads are forbidden in event schemas.",
            "- Alias normalization is mandatory before downstream consumption.",
            "- Compatibility and replay semantics are explicit on every contract row.",
            "",
            "## Bootstrapping Test",
            "",
            "`tests/public-api.test.ts` proves the package boots through `@vecells/domain-kernel` public exports and that schema/catalog counts stay aligned with the published event registry.",
        ]
    ) + "\n"


def update_root_package() -> None:
    package = read_json(ROOT_PACKAGE_PATH)
    scripts = package.setdefault("scripts", {})
    scripts.update(ROOT_SCRIPT_UPDATES)
    write_json(ROOT_PACKAGE_PATH, package)


def update_playwright_package() -> None:
    package = read_json(PLAYWRIGHT_PACKAGE_PATH)
    package["description"] = "Foundation, runtime topology, gateway, event registry, FHIR representation, and frontend manifest browser checks."
    package["scripts"] = {
        "build": (
            "node --check foundation-shell-gallery.spec.js && "
            "node --check runtime-topology-atlas.spec.js && "
            "node --check gateway-surface-studio.spec.js && "
            "node --check event-registry-studio.spec.js && "
            "node --check fhir-representation-atlas.spec.js && "
            "node --check frontend-contract-studio.spec.js"
        ),
        "lint": (
            "eslint foundation-shell-gallery.spec.js runtime-topology-atlas.spec.js "
            "gateway-surface-studio.spec.js event-registry-studio.spec.js "
            "fhir-representation-atlas.spec.js frontend-contract-studio.spec.js"
        ),
        "test": (
            "node foundation-shell-gallery.spec.js && "
            "node runtime-topology-atlas.spec.js && "
            "node gateway-surface-studio.spec.js && "
            "node event-registry-studio.spec.js && "
            "node fhir-representation-atlas.spec.js && "
            "node frontend-contract-studio.spec.js"
        ),
        "typecheck": (
            "node --check foundation-shell-gallery.spec.js && "
            "node --check runtime-topology-atlas.spec.js && "
            "node --check gateway-surface-studio.spec.js && "
            "node --check event-registry-studio.spec.js && "
            "node --check fhir-representation-atlas.spec.js && "
            "node --check frontend-contract-studio.spec.js"
        ),
        "e2e": (
            "node foundation-shell-gallery.spec.js --run && "
            "node runtime-topology-atlas.spec.js --run && "
            "node gateway-surface-studio.spec.js --run && "
            "node event-registry-studio.spec.js --run && "
            "node fhir-representation-atlas.spec.js --run && "
            "node frontend-contract-studio.spec.js --run"
        ),
    }
    write_json(PLAYWRIGHT_PACKAGE_PATH, package)


def build_studio_html() -> str:
    return dedent(
        """
        <!doctype html>
        <html lang="en">
          <head>
            <meta charset="UTF-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <title>Vecells Event Registry Studio</title>
            <style>
              :root {
                color-scheme: light;
                --canvas: #f7f9fc;
                --rail: #eef2f8;
                --panel: #ffffff;
                --inset: #f4f6fb;
                --text-strong: #0f172a;
                --text-default: #1e293b;
                --text-muted: #667085;
                --border-subtle: #e2e8f0;
                --border-default: #cbd5e1;
                --namespace: #3559e6;
                --normalization: #0ea5a4;
                --compatibility: #6e59d9;
                --warning: #c98900;
                --blocked: #c24141;
                --shadow: 0 16px 40px rgba(15, 23, 42, 0.06);
              }

              * {
                box-sizing: border-box;
              }

              body {
                margin: 0;
                font-family:
                  ui-sans-serif,
                  -apple-system,
                  BlinkMacSystemFont,
                  "Segoe UI",
                  sans-serif;
                background: linear-gradient(180deg, rgba(53, 89, 230, 0.06), transparent 160px),
                  var(--canvas);
                color: var(--text-default);
              }

              body[data-reduced-motion="true"] * {
                animation: none !important;
                transition: none !important;
                scroll-behavior: auto !important;
              }

              .shell {
                max-width: 1500px;
                margin: 0 auto;
                padding: 20px 20px 28px;
              }

              .panel {
                background: var(--panel);
                border: 1px solid var(--border-subtle);
                border-radius: 20px;
                box-shadow: var(--shadow);
              }

              .masthead {
                position: sticky;
                top: 0;
                z-index: 12;
                min-height: 72px;
                display: grid;
                grid-template-columns: 1.2fr 0.8fr;
                gap: 16px;
                align-items: center;
                padding: 16px 18px;
                margin-bottom: 16px;
                backdrop-filter: blur(14px);
                background: rgba(255, 255, 255, 0.92);
              }

              .brand {
                display: flex;
                align-items: center;
                gap: 14px;
              }

              .brand-mark {
                width: 42px;
                height: 42px;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                border-radius: 14px;
                background: linear-gradient(135deg, rgba(53, 89, 230, 0.16), rgba(14, 165, 164, 0.18));
                border: 1px solid rgba(53, 89, 230, 0.18);
              }

              .brand h1,
              .brand p {
                margin: 0;
              }

              .brand h1 {
                font-size: 18px;
                color: var(--text-strong);
              }

              .spine {
                height: 10px;
                margin-top: 8px;
                border-radius: 999px;
                background:
                  linear-gradient(
                    90deg,
                    rgba(53, 89, 230, 0.18) 0,
                    rgba(53, 89, 230, 0.18) 22%,
                    rgba(14, 165, 164, 0.24) 22%,
                    rgba(14, 165, 164, 0.24) 48%,
                    rgba(110, 89, 217, 0.22) 48%,
                    rgba(110, 89, 217, 0.22) 70%,
                    rgba(201, 137, 0, 0.22) 70%,
                    rgba(201, 137, 0, 0.22) 100%
                  );
              }

              .metric-grid {
                display: grid;
                grid-template-columns: repeat(4, minmax(0, 1fr));
                gap: 12px;
              }

              .metric-card {
                background: var(--inset);
                border: 1px solid var(--border-subtle);
                border-radius: 16px;
                padding: 10px 12px;
              }

              .metric-label {
                font-size: 11px;
                text-transform: uppercase;
                letter-spacing: 0.08em;
                color: var(--text-muted);
              }

              .metric-value {
                margin-top: 4px;
                font-size: 20px;
                color: var(--text-strong);
              }

              .layout {
                display: grid;
                grid-template-columns: 280px minmax(0, 1fr) 388px;
                gap: 16px;
                align-items: start;
              }

              .rail {
                position: sticky;
                top: 96px;
                padding: 18px;
                background: var(--rail);
              }

              .section-title {
                margin: 0 0 12px;
                font-size: 12px;
                text-transform: uppercase;
                letter-spacing: 0.08em;
                color: var(--text-muted);
              }

              .chip-group,
              .namespace-list {
                display: flex;
                flex-wrap: wrap;
                gap: 8px;
              }

              .chip,
              .namespace-button,
              .contract-row,
              .diff-row,
              .rule-row {
                transition:
                  background-color 120ms ease,
                  border-color 120ms ease,
                  transform 120ms ease;
              }

              .chip {
                border: 1px solid var(--border-default);
                border-radius: 999px;
                padding: 5px 10px;
                background: rgba(255, 255, 255, 0.8);
                color: var(--text-default);
                cursor: pointer;
                font-size: 12px;
              }

              .chip[data-selected="true"],
              .namespace-button[data-selected="true"] {
                border-color: rgba(53, 89, 230, 0.32);
                background: rgba(53, 89, 230, 0.12);
                color: var(--text-strong);
              }

              .namespace-list {
                margin-top: 16px;
                display: grid;
                grid-template-columns: 1fr;
              }

              .namespace-button {
                width: 100%;
                border: 1px solid var(--border-subtle);
                background: rgba(255, 255, 255, 0.86);
                border-radius: 14px;
                padding: 10px 12px;
                text-align: left;
                cursor: pointer;
              }

              .namespace-button strong,
              .namespace-button span {
                display: block;
              }

              .namespace-button strong {
                color: var(--text-strong);
                font-size: 13px;
              }

              .namespace-button span {
                margin-top: 4px;
                color: var(--text-muted);
                font-size: 12px;
              }

              .center {
                display: grid;
                gap: 16px;
              }

              .filters {
                display: grid;
                grid-template-columns: repeat(5, minmax(0, 1fr));
                gap: 12px;
                padding: 16px;
              }

              label {
                display: grid;
                gap: 6px;
                font-size: 12px;
                color: var(--text-muted);
              }

              select {
                min-height: 44px;
                padding: 0 12px;
                border-radius: 14px;
                border: 1px solid var(--border-default);
                background: var(--panel);
                color: var(--text-strong);
              }

              .table-panel {
                padding: 16px;
              }

              .table-scroll {
                min-height: 520px;
                overflow: auto;
                border: 1px solid var(--border-subtle);
                border-radius: 18px;
              }

              table {
                width: 100%;
                border-collapse: collapse;
              }

              th,
              td {
                padding: 12px 14px;
                border-bottom: 1px solid var(--border-subtle);
                text-align: left;
                vertical-align: top;
              }

              th {
                position: sticky;
                top: 0;
                background: #fbfcff;
                z-index: 1;
                font-size: 12px;
                text-transform: uppercase;
                letter-spacing: 0.08em;
                color: var(--text-muted);
              }

              .mono {
                font-family:
                  ui-monospace,
                  SFMono-Regular,
                  Menlo,
                  Monaco,
                  Consolas,
                  monospace;
              }

              .contract-row {
                cursor: pointer;
                background: transparent;
              }

              .contract-row[data-selected="true"] {
                background: rgba(53, 89, 230, 0.06);
              }

              .expand-panel {
                background: #fafbff;
              }

              .expand-shell {
                display: grid;
                grid-template-columns: repeat(3, minmax(0, 1fr));
                gap: 12px;
                padding: 12px 0 4px;
              }

              .expand-card {
                border: 1px solid var(--border-subtle);
                background: var(--panel);
                border-radius: 14px;
                padding: 12px;
              }

              .inspector {
                position: sticky;
                top: 96px;
                padding: 18px;
                min-height: 640px;
              }

              .inspector h2,
              .inspector h3,
              .inspector p {
                margin: 0;
              }

              .inspector h2 {
                font-size: 20px;
                color: var(--text-strong);
              }

              .inspector-grid {
                display: grid;
                gap: 14px;
                margin-top: 14px;
              }

              .inspector-card {
                border: 1px solid var(--border-subtle);
                border-radius: 16px;
                padding: 14px;
                background: var(--inset);
              }

              .inspector-card ul {
                margin: 10px 0 0;
                padding-left: 18px;
              }

              .lower-grid {
                display: grid;
                grid-template-columns: 1.3fr 1fr;
                gap: 16px;
                margin-top: 16px;
              }

              .diff-filters {
                display: flex;
                justify-content: space-between;
                align-items: center;
                gap: 12px;
                margin-bottom: 12px;
              }

              .mini-diagram {
                display: grid;
                gap: 10px;
                margin-top: 16px;
                padding: 16px;
              }

              .diagram-row {
                display: grid;
                grid-template-columns: minmax(0, 1fr) 48px minmax(0, 1fr);
                align-items: center;
                gap: 10px;
              }

              .diagram-box {
                border-radius: 14px;
                border: 1px solid var(--border-subtle);
                padding: 10px 12px;
                background: rgba(255, 255, 255, 0.86);
              }

              .arrow {
                text-align: center;
                color: var(--normalization);
                font-weight: 700;
              }

              .defect-strip {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
                gap: 12px;
                margin-top: 16px;
              }

              .defect-card {
                border-radius: 16px;
                border: 1px solid var(--border-subtle);
                padding: 14px;
                background: var(--panel);
              }

              .badge {
                display: inline-flex;
                align-items: center;
                gap: 6px;
                border-radius: 999px;
                padding: 4px 8px;
                font-size: 11px;
                text-transform: uppercase;
                letter-spacing: 0.08em;
              }

              .badge-purpose {
                background: rgba(53, 89, 230, 0.1);
                color: var(--namespace);
              }

              .badge-watch {
                background: rgba(201, 137, 0, 0.14);
                color: var(--warning);
              }

              .badge-blocked {
                background: rgba(194, 65, 65, 0.12);
                color: var(--blocked);
              }

              .badge-resolved {
                background: rgba(14, 165, 164, 0.12);
                color: var(--normalization);
              }

              @media (max-width: 1180px) {
                .layout {
                  grid-template-columns: 1fr;
                }

                .rail,
                .inspector {
                  position: static;
                }

                .lower-grid {
                  grid-template-columns: 1fr;
                }
              }

              @media (max-width: 840px) {
                .masthead,
                .filters,
                .metric-grid {
                  grid-template-columns: 1fr;
                }

                .expand-shell {
                  grid-template-columns: 1fr;
                }
              }
            </style>
          </head>
          <body>
            <div class="shell">
              <header class="masthead panel" data-testid="registry-masthead">
                <div>
                  <div class="brand">
                    <div class="brand-mark" aria-hidden="true">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <path d="M4 6h16M4 12h16M4 18h10" stroke="#3559E6" stroke-width="2" stroke-linecap="round"/>
                        <path d="M15 16l3 2 3-6" stroke="#0EA5A4" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                      </svg>
                    </div>
                    <div>
                      <h1>Vecells EVENT Registry</h1>
                      <p>Event_Registry_Studio</p>
                    </div>
                  </div>
                  <div class="spine" aria-hidden="true"></div>
                </div>
                <div class="metric-grid">
                  <div class="metric-card">
                    <div class="metric-label">Namespaces</div>
                    <div class="metric-value" id="metric-namespaces">0</div>
                  </div>
                  <div class="metric-card">
                    <div class="metric-label">Active Contracts</div>
                    <div class="metric-value" id="metric-contracts">0</div>
                  </div>
                  <div class="metric-card">
                    <div class="metric-label">Missing Contracts</div>
                    <div class="metric-value" id="metric-missing">0</div>
                  </div>
                  <div class="metric-card">
                    <div class="metric-label">Blocked Schemas</div>
                    <div class="metric-value" id="metric-blocked">0</div>
                  </div>
                </div>
              </header>

              <main class="layout">
                <aside class="panel rail" data-testid="namespace-rail">
                  <h2 class="section-title">Purpose Class</h2>
                  <div class="chip-group" id="purpose-chips"></div>
                  <h2 class="section-title" style="margin-top: 18px;">Namespaces</h2>
                  <div class="namespace-list" id="namespace-list"></div>
                </aside>

                <section class="center">
                  <section class="panel filters">
                    <label>
                      Namespace
                      <select id="filter-namespace">
                        <option value="all">All namespaces</option>
                      </select>
                    </label>
                    <label>
                      Owning Context
                      <select id="filter-context" data-testid="filter-context">
                        <option value="all">All contexts</option>
                      </select>
                    </label>
                    <label>
                      Compatibility
                      <select id="filter-compatibility" data-testid="filter-compatibility">
                        <option value="all">All modes</option>
                      </select>
                    </label>
                    <label>
                      Replay Semantics
                      <select id="filter-replay" data-testid="filter-replay">
                        <option value="all">All replay modes</option>
                      </select>
                    </label>
                    <label>
                      Defect State
                      <select id="filter-defect" data-testid="filter-defect">
                        <option value="all">All defect states</option>
                      </select>
                    </label>
                  </section>

                  <section class="panel table-panel">
                    <div class="table-scroll" data-testid="contract-table">
                      <table>
                        <thead>
                          <tr>
                            <th>Event</th>
                            <th>Owner</th>
                            <th>Purpose</th>
                            <th>Compatibility</th>
                            <th>Replay</th>
                            <th>Schema</th>
                          </tr>
                        </thead>
                        <tbody id="contract-body"></tbody>
                      </table>
                    </div>
                    <section class="panel mini-diagram" aria-label="Canonicalization diagram">
                      <div style="display:flex; justify-content:space-between; align-items:center; gap:12px;">
                        <h2 class="section-title" style="margin:0;">Canonicalization Diagram</h2>
                        <span class="badge badge-purpose">Alias to canonical</span>
                      </div>
                      <div id="diagram-body"></div>
                    </section>
                  </section>

                  <section class="lower-grid">
                    <section class="panel table-panel">
                      <div class="diff-filters">
                        <h2 class="section-title" style="margin:0;">Schema Diff Ledger</h2>
                        <label style="min-width:180px;">
                          Diff Filter
                          <select id="filter-diff" data-testid="filter-diff">
                            <option value="all">All diffs</option>
                            <option value="blocked">Blocked only</option>
                            <option value="new_version_required">New version required</option>
                            <option value="namespace_break">Namespace break</option>
                          </select>
                        </label>
                      </div>
                      <div class="table-scroll" data-testid="diff-ledger" style="min-height: 320px;">
                        <table>
                          <thead>
                            <tr>
                              <th>Diff</th>
                              <th>Event</th>
                              <th>Mode</th>
                              <th>Outcome</th>
                            </tr>
                          </thead>
                          <tbody id="diff-body"></tbody>
                        </table>
                      </div>
                    </section>

                    <section class="panel table-panel">
                      <h2 class="section-title">Normalization Rules</h2>
                      <div class="table-scroll" style="min-height: 320px;">
                        <table>
                          <thead>
                            <tr>
                              <th>Producer Alias</th>
                              <th>Canonical Event</th>
                              <th>Payload Policy</th>
                            </tr>
                          </thead>
                          <tbody id="rule-body"></tbody>
                        </table>
                      </div>
                    </section>
                  </section>

                  <section class="defect-strip" data-testid="defect-strip" id="defect-strip"></section>
                </section>

                <aside class="panel inspector" data-testid="inspector" id="inspector" aria-live="polite"></aside>
              </main>
            </div>

            <script>
              const state = {
                namespace: "all",
                purpose: "all",
                context: "all",
                compatibility: "all",
                replay: "all",
                defect: "all",
                diff: "all",
                selectedEvent: null,
                expandedEvent: null,
              };

              const ids = {
                namespace: document.getElementById("filter-namespace"),
                context: document.getElementById("filter-context"),
                compatibility: document.getElementById("filter-compatibility"),
                replay: document.getElementById("filter-replay"),
                defect: document.getElementById("filter-defect"),
                diff: document.getElementById("filter-diff"),
                purposeChips: document.getElementById("purpose-chips"),
                namespaceList: document.getElementById("namespace-list"),
                contractBody: document.getElementById("contract-body"),
                diagramBody: document.getElementById("diagram-body"),
                diffBody: document.getElementById("diff-body"),
                ruleBody: document.getElementById("rule-body"),
                defectStrip: document.getElementById("defect-strip"),
                inspector: document.getElementById("inspector"),
              };

              const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
              function applyMotionPreference() {
                document.body.dataset.reducedMotion = motionQuery.matches ? "true" : "false";
              }
              applyMotionPreference();
              motionQuery.addEventListener?.("change", applyMotionPreference);

              function sortByKey(rows, key) {
                return [...rows].sort((left, right) => String(left[key]).localeCompare(String(right[key])));
              }

              function uniqueValues(rows, key) {
                return [...new Set(rows.map((row) => row[key]))].sort();
              }

              function populateSelect(select, values) {
                for (const value of values) {
                  const option = document.createElement("option");
                  option.value = value;
                  option.textContent = value;
                  select.appendChild(option);
                }
              }

              function filteredContracts(payload) {
                return payload.contracts.filter((row) => state.namespace === "all" || row.namespaceCode === state.namespace)
                  .filter((row) => state.purpose === "all" || row.eventPurpose === state.purpose)
                  .filter((row) => state.context === "all" || row.owningBoundedContextRef === state.context)
                  .filter((row) => state.compatibility === "all" || row.compatibilityMode === state.compatibility)
                  .filter((row) => state.replay === "all" || row.replaySemantics === state.replay)
                  .filter((row) => state.defect === "all" || row.defectState === state.defect);
              }

              function filteredRules(payload, contracts) {
                const activeContractRefs = new Set(contracts.map((row) => row.canonicalEventContractId));
                return payload.normalizationRules.filter((row) => activeContractRefs.has(row.targetCanonicalEventContractRef));
              }

              function filteredDiffs(payload, contracts) {
                const eventNames = new Set(contracts.map((row) => row.eventName));
                return payload.schemaDiffLedger
                  .filter((row) => eventNames.has(row.eventName))
                  .filter((row) => state.diff === "all" || row.reviewOutcome === state.diff || row.compatibilityMode === state.diff);
              }

              function ensureSelection(contracts) {
                if (!contracts.length) {
                  state.selectedEvent = null;
                  state.expandedEvent = null;
                  return;
                }
                if (!contracts.some((row) => row.eventName === state.selectedEvent)) {
                  state.selectedEvent = contracts[0].eventName;
                }
                if (!contracts.some((row) => row.eventName === state.expandedEvent)) {
                  state.expandedEvent = contracts[0].eventName;
                }
              }

              function badgeClass(stateValue) {
                if (stateValue === "watch") return "badge badge-watch";
                if (stateValue === "blocked") return "badge badge-blocked";
                if (stateValue === "resolved") return "badge badge-resolved";
                return "badge badge-purpose";
              }

              function renderNamespaceRail(namespacePayload, contracts) {
                ids.namespaceList.innerHTML = "";
                for (const namespaceRow of namespacePayload.namespaces) {
                  const button = document.createElement("button");
                  button.type = "button";
                  button.className = "namespace-button";
                  button.dataset.namespace = namespaceRow.namespaceCode;
                  button.dataset.selected = state.namespace === namespaceRow.namespaceCode ? "true" : "false";
                  button.dataset.testid = `namespace-button-${namespaceRow.namespaceCode}`;
                  button.setAttribute("data-testid", `namespace-button-${namespaceRow.namespaceCode}`);
                  button.innerHTML = `
                    <strong class="mono">${namespaceRow.namespaceCode}.*</strong>
                    <span>${contracts.filter((row) => row.namespaceCode === namespaceRow.namespaceCode).length} contracts · ${namespaceRow.owningBoundedContextRef}</span>
                  `;
                  button.addEventListener("click", () => {
                    state.namespace = namespaceRow.namespaceCode;
                    ids.namespace.value = namespaceRow.namespaceCode;
                    renderAll(window.__registryData);
                  });
                  button.addEventListener("keydown", (event) => {
                    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
                    event.preventDefault();
                    const nodes = [...ids.namespaceList.querySelectorAll(".namespace-button")];
                    const index = nodes.indexOf(button);
                    const nextIndex = event.key === "ArrowDown"
                      ? Math.min(nodes.length - 1, index + 1)
                      : Math.max(0, index - 1);
                    nodes[nextIndex]?.focus();
                    nodes[nextIndex]?.click();
                  });
                  ids.namespaceList.appendChild(button);
                }
              }

              function renderPurposeChips(contracts) {
                const purposes = uniqueValues(contracts, "eventPurpose");
                ids.purposeChips.innerHTML = "";
                const items = ["all", ...purposes];
                for (const value of items) {
                  const button = document.createElement("button");
                  button.type = "button";
                  button.className = "chip";
                  button.textContent = value === "all" ? "All purposes" : value;
                  button.dataset.selected = state.purpose === value ? "true" : "false";
                  button.addEventListener("click", () => {
                    state.purpose = value;
                    renderAll(window.__registryData);
                  });
                  ids.purposeChips.appendChild(button);
                }
              }

              function renderContractTable(data, contracts) {
                ids.contractBody.innerHTML = "";
                for (const contract of contracts) {
                  const selected = contract.eventName === state.selectedEvent;
                  const expanded = contract.eventName === state.expandedEvent;
                  const row = document.createElement("tr");
                  row.className = "contract-row";
                  row.tabIndex = 0;
                  row.dataset.selected = selected ? "true" : "false";
                  row.setAttribute("data-testid", `contract-row-${contract.canonicalEventContractId}`);
                  row.innerHTML = `
                    <td class="mono">${contract.eventName}</td>
                    <td>${contract.owningBoundedContextRef}</td>
                    <td><span class="badge badge-purpose">${contract.eventPurpose}</span></td>
                    <td class="mono">${contract.compatibilityMode}</td>
                    <td class="mono">${contract.replaySemantics}</td>
                    <td class="mono">${contract.schemaVersionRef}</td>
                  `;
                  row.addEventListener("click", () => {
                    state.selectedEvent = contract.eventName;
                    state.expandedEvent = contract.eventName;
                    renderAll(data);
                  });
                  row.addEventListener("keydown", (event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      state.selectedEvent = contract.eventName;
                      state.expandedEvent = contract.eventName;
                      renderAll(data);
                      return;
                    }
                    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
                    event.preventDefault();
                    const rows = [...ids.contractBody.querySelectorAll(".contract-row")];
                    const index = rows.indexOf(row);
                    const nextIndex = event.key === "ArrowDown"
                      ? Math.min(rows.length - 1, index + 1)
                      : Math.max(0, index - 1);
                    const nextRow = rows[nextIndex];
                    nextRow?.focus();
                    const nextTestId = nextRow?.getAttribute("data-testid");
                    if (!nextTestId) return;
                    const match = contracts.find((item) => `contract-row-${item.canonicalEventContractId}` === nextTestId);
                    if (match) {
                      state.selectedEvent = match.eventName;
                      renderAll(data);
                    }
                  });
                  ids.contractBody.appendChild(row);

                  if (expanded) {
                    const expandedRow = document.createElement("tr");
                    expandedRow.className = "expand-panel";
                    expandedRow.setAttribute("data-testid", `contract-expand-${contract.canonicalEventContractId}`);
                    const schemaVersion = data.schema.schemaVersions.find((row) => row.eventName === contract.eventName && row.lifecycleState === "active");
                    expandedRow.innerHTML = `
                      <td colspan="6">
                        <div class="expand-shell">
                          <div class="expand-card">
                            <div class="section-title">Identifiers</div>
                            <div class="mono">${contract.requiredIdentifierRefs.join("<br />")}</div>
                          </div>
                          <div class="expand-card">
                            <div class="section-title">Payload Refs</div>
                            <div class="mono">${contract.requiredPayloadRefs.join("<br />")}</div>
                          </div>
                          <div class="expand-card">
                            <div class="section-title">Schema Artifact</div>
                            <div class="mono">${schemaVersion?.artifactPath ?? "blocked proposal"}</div>
                          </div>
                        </div>
                      </td>
                    `;
                    ids.contractBody.appendChild(expandedRow);
                  }
                }
              }

              function renderDiagram(rules, contractLookup) {
                ids.diagramBody.innerHTML = "";
                for (const rule of rules.slice(0, 8)) {
                  const target = contractLookup.get(rule.targetCanonicalEventContractRef);
                  const row = document.createElement("div");
                  row.className = "diagram-row";
                  row.innerHTML = `
                    <div class="diagram-box mono">${rule.sourceNamespacePattern}.${rule.sourceEventPattern}</div>
                    <div class="arrow">→</div>
                    <div class="diagram-box mono">${target?.eventName ?? "missing"}</div>
                  `;
                  ids.diagramBody.appendChild(row);
                }
              }

              function renderDiffs(diffs) {
                ids.diffBody.innerHTML = "";
                for (const diff of diffs) {
                  const row = document.createElement("tr");
                  row.className = "diff-row";
                  row.tabIndex = 0;
                  row.setAttribute("data-testid", `diff-row-${diff.schemaDiffId}`);
                  row.innerHTML = `
                    <td class="mono">${diff.schemaDiffId}</td>
                    <td class="mono">${diff.eventName}</td>
                    <td class="mono">${diff.compatibilityMode}</td>
                    <td><span class="${badgeClass(diff.reviewOutcome)}">${diff.reviewOutcome}</span></td>
                  `;
                  row.addEventListener("keydown", (event) => {
                    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
                    event.preventDefault();
                    const rows = [...ids.diffBody.querySelectorAll(".diff-row")];
                    const index = rows.indexOf(row);
                    const nextIndex = event.key === "ArrowDown"
                      ? Math.min(rows.length - 1, index + 1)
                      : Math.max(0, index - 1);
                    rows[nextIndex]?.focus();
                  });
                  ids.diffBody.appendChild(row);
                }
              }

              function renderRules(rules, contractLookup) {
                ids.ruleBody.innerHTML = "";
                for (const rule of rules) {
                  const target = contractLookup.get(rule.targetCanonicalEventContractRef);
                  const row = document.createElement("tr");
                  row.className = "rule-row";
                  row.tabIndex = 0;
                  row.setAttribute("data-testid", `rule-row-${rule.canonicalEventNormalizationRuleId}`);
                  row.innerHTML = `
                    <td class="mono">${rule.sourceNamespacePattern}.${rule.sourceEventPattern}</td>
                    <td class="mono">${target?.eventName ?? "missing"}</td>
                    <td class="mono">${rule.payloadRewritePolicyRef}</td>
                  `;
                  row.addEventListener("keydown", (event) => {
                    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
                    event.preventDefault();
                    const rows = [...ids.ruleBody.querySelectorAll(".rule-row")];
                    const index = rows.indexOf(row);
                    const nextIndex = event.key === "ArrowDown"
                      ? Math.min(rows.length - 1, index + 1)
                      : Math.max(0, index - 1);
                    rows[nextIndex]?.focus();
                  });
                  ids.ruleBody.appendChild(row);
                }
              }

              function renderInspector(data, contractLookup) {
                const contract = data.contracts.contracts.find((row) => row.eventName === state.selectedEvent);
                if (!contract) {
                  ids.inspector.innerHTML = "<h2>No event selected</h2>";
                  return;
                }
                const versions = data.schema.schemaVersions.filter((row) => row.eventName === contract.eventName);
                ids.inspector.innerHTML = `
                  <h2 class="mono">${contract.eventName}</h2>
                  <p style="margin-top:6px; color: var(--text-muted);">${contract.rationale}</p>
                  <div class="inspector-grid">
                    <section class="inspector-card">
                      <h3 class="section-title">Metadata</h3>
                      <p><strong>Owner:</strong> <span class="mono">${contract.owningBoundedContextRef}</span></p>
                      <p><strong>Governing object:</strong> <span class="mono">${contract.governingObjectType}</span></p>
                      <p><strong>Purpose:</strong> <span class="mono">${contract.eventPurpose}</span></p>
                      <p><strong>Compatibility:</strong> <span class="mono">${contract.compatibilityMode}</span></p>
                      <p><strong>Replay:</strong> <span class="mono">${contract.replaySemantics}</span></p>
                    </section>
                    <section class="inspector-card">
                      <h3 class="section-title">Identifiers</h3>
                      <ul>${contract.requiredIdentifierRefs.map((row) => `<li class="mono">${row}</li>`).join("")}</ul>
                    </section>
                    <section class="inspector-card">
                      <h3 class="section-title">Causality + Privacy</h3>
                      <ul>${contract.requiredCausalityRefs.concat(contract.requiredPrivacyRefs).map((row) => `<li class="mono">${row}</li>`).join("")}</ul>
                    </section>
                    <section class="inspector-card">
                      <h3 class="section-title">Legacy Aliases</h3>
                      <ul>${(contract.legacyAliasRefs.length ? contract.legacyAliasRefs : ["none"]).map((row) => `<li class="mono">${row}</li>`).join("")}</ul>
                    </section>
                    <section class="inspector-card">
                      <h3 class="section-title">Schema Version History</h3>
                      <ul>${versions.map((row) => `<li class="mono">${row.schemaVersionRef} · ${row.lifecycleState} · ${row.compatibilityMode}</li>`).join("")}</ul>
                    </section>
                  </div>
                `;
              }

              function renderDefects(defects) {
                ids.defectStrip.innerHTML = "";
                for (const defect of defects) {
                  const card = document.createElement("article");
                  card.className = "defect-card";
                  card.innerHTML = `
                    <span class="${badgeClass(defect.state)}">${defect.state}</span>
                    <h2 style="font-size: 15px; margin-top: 10px;">${defect.title}</h2>
                    <p style="margin-top: 8px; color: var(--text-muted);">${defect.summary}</p>
                    <p class="mono" style="margin-top: 10px; color: var(--text-muted);">${defect.affected_namespaces.join(", ")}</p>
                  `;
                  ids.defectStrip.appendChild(card);
                }
              }

              function renderMetrics(data) {
                document.getElementById("metric-namespaces").textContent = data.namespaces.summary.namespace_count;
                document.getElementById("metric-contracts").textContent = data.contracts.summary.active_contract_count;
                document.getElementById("metric-missing").textContent = data.contracts.summary.missing_contract_count;
                document.getElementById("metric-blocked").textContent = data.schema.summary.blocked_schema_count;
              }

              function renderAll(data) {
                const contracts = filteredContracts(data.contracts);
                ensureSelection(contracts);
                const contractLookup = new Map(data.contracts.contracts.map((row) => [row.canonicalEventContractId, row]));
                const rules = filteredRules(data.normalization, contracts);
                const diffs = filteredDiffs(data.schema, contracts);

                renderMetrics(data);
                renderPurposeChips(data.contracts.contracts);
                renderNamespaceRail(data.namespaces, data.contracts.contracts);
                renderContractTable(data, contracts);
                renderDiagram(rules, contractLookup);
                renderDiffs(diffs);
                renderRules(rules, contractLookup);
                renderInspector(data, contractLookup);
                renderDefects(data.contracts.registryDefects.filter((row) => state.defect === "all" || row.state === state.defect));
              }

              async function main() {
                const [namespaces, contracts, normalization, schema] = await Promise.all([
                  fetch("../../data/analysis/canonical_event_namespaces.json").then((res) => res.json()),
                  fetch("../../data/analysis/canonical_event_contracts.json").then((res) => res.json()),
                  fetch("../../data/analysis/canonical_event_normalization_rules.json").then((res) => res.json()),
                  fetch("../../data/analysis/canonical_event_schema_versions.json").then((res) => res.json()),
                ]);
                window.__registryData = { namespaces, contracts, normalization, schema };

                populateSelect(ids.namespace, namespaces.namespaces.map((row) => row.namespaceCode));
                populateSelect(ids.context, uniqueValues(contracts.contracts, "owningBoundedContextRef"));
                populateSelect(ids.compatibility, uniqueValues(contracts.contracts, "compatibilityMode"));
                populateSelect(ids.replay, uniqueValues(contracts.contracts, "replaySemantics"));
                populateSelect(ids.defect, uniqueValues(contracts.contracts, "defectState"));

                ids.namespace.addEventListener("change", (event) => {
                  state.namespace = event.target.value;
                  renderAll(window.__registryData);
                });
                ids.context.addEventListener("change", (event) => {
                  state.context = event.target.value;
                  renderAll(window.__registryData);
                });
                ids.compatibility.addEventListener("change", (event) => {
                  state.compatibility = event.target.value;
                  renderAll(window.__registryData);
                });
                ids.replay.addEventListener("change", (event) => {
                  state.replay = event.target.value;
                  renderAll(window.__registryData);
                });
                ids.defect.addEventListener("change", (event) => {
                  state.defect = event.target.value;
                  renderAll(window.__registryData);
                });
                ids.diff.addEventListener("change", (event) => {
                  state.diff = event.target.value;
                  renderAll(window.__registryData);
                });

                renderAll(window.__registryData);
              }

              main().catch((error) => {
                document.body.innerHTML = `<pre>${error.stack}</pre>`;
                console.error(error);
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
        const HTML_PATH = path.join(ROOT, "docs", "architecture", "48_event_registry_studio.html");
        const CONTRACT_PATH = path.join(ROOT, "data", "analysis", "canonical_event_contracts.json");
        const NORMALIZATION_PATH = path.join(ROOT, "data", "analysis", "canonical_event_normalization_rules.json");
        const SCHEMA_PATH = path.join(ROOT, "data", "analysis", "canonical_event_schema_versions.json");

        const CONTRACT_PAYLOAD = JSON.parse(fs.readFileSync(CONTRACT_PATH, "utf8"));
        const NORMALIZATION_PAYLOAD = JSON.parse(fs.readFileSync(NORMALIZATION_PATH, "utf8"));
        const SCHEMA_PAYLOAD = JSON.parse(fs.readFileSync(SCHEMA_PATH, "utf8"));

        export const eventRegistryStudioCoverage = [
          "namespace filtering",
          "event-row expansion",
          "inspector rendering",
          "normalization-rule parity",
          "schema diff filtering",
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
          namespace = "all",
          context = "all",
          compatibility = "all",
          replay = "all",
          defect = "all",
        }) {
          return CONTRACT_PAYLOAD.contracts
            .filter((row) => namespace === "all" || row.namespaceCode === namespace)
            .filter((row) => context === "all" || row.owningBoundedContextRef === context)
            .filter((row) => compatibility === "all" || row.compatibilityMode === compatibility)
            .filter((row) => replay === "all" || row.replaySemantics === replay)
            .filter((row) => defect === "all" || row.defectState === defect)
            .sort((left, right) => left.eventName.localeCompare(right.eventName));
        }

        function filteredRules(namespace) {
          const contracts = filteredContracts({ namespace });
          const refs = new Set(contracts.map((row) => row.canonicalEventContractId));
          return NORMALIZATION_PAYLOAD.normalizationRules.filter((row) =>
            refs.has(row.targetCanonicalEventContractRef),
          );
        }

        function filteredDiffs(namespace, diff) {
          const eventNames = new Set(filteredContracts({ namespace }).map((row) => row.eventName));
          return SCHEMA_PAYLOAD.schemaDiffLedger
            .filter((row) => eventNames.has(row.eventName))
            .filter(
              (row) =>
                diff === "all" ||
                row.reviewOutcome === diff ||
                row.compatibilityMode === diff,
            );
        }

        function startStaticServer() {
          return new Promise((resolve, reject) => {
            const rootDir = ROOT;
            const server = http.createServer((req, res) => {
              const rawUrl = req.url ?? "/";
              const urlPath =
                rawUrl === "/"
                  ? "/docs/architecture/48_event_registry_studio.html"
                  : rawUrl.split("?")[0];
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
                  : "text/plain; charset=utf-8";
              res.writeHead(200, { "Content-Type": contentType });
              res.end(body);
            });
            server.once("error", reject);
            server.listen(4348, "127.0.0.1", () => resolve(server));
          });
        }

        async function run() {
          assertCondition(fs.existsSync(HTML_PATH), `Missing event registry studio HTML: ${HTML_PATH}`);
          const { chromium } = await importPlaywright();
          const server = await startStaticServer();
          const browser = await chromium.launch({ headless: true });
          const page = await browser.newPage({ viewport: { width: 1460, height: 1180 } });
          const url =
            process.env.EVENT_REGISTRY_STUDIO_URL ??
            "http://127.0.0.1:4348/docs/architecture/48_event_registry_studio.html";

          try {
            await page.goto(url, { waitUntil: "networkidle" });
            await page.locator("[data-testid='contract-table']").waitFor();
            await page.locator("[data-testid='diff-ledger']").waitFor();
            await page.locator("[data-testid='inspector']").waitFor();

            const initialRows = await page.locator("[data-testid^='contract-row-']").count();
            assertCondition(
              initialRows === filteredContracts({}).length,
              `Initial contract-row parity drifted: expected ${filteredContracts({}).length}, found ${initialRows}`,
            );

            await page.locator("[data-testid='filter-context']").selectOption("identity_access");
            const identityContextContracts = filteredContracts({ context: "identity_access" });
            const identityContextRows = await page.locator("[data-testid^='contract-row-']").count();
            assertCondition(
              identityContextRows === identityContextContracts.length,
              `Context filter drifted: expected ${identityContextContracts.length}, found ${identityContextRows}`,
            );

            await page.locator("[data-testid='namespace-button-identity']").click();
            const identityContracts = filteredContracts({ namespace: "identity", context: "identity_access" });
            const identityRows = await page.locator("[data-testid^='contract-row-']").count();
            assertCondition(
              identityRows === identityContracts.length,
              `Namespace filter drifted: expected ${identityContracts.length}, found ${identityRows}`,
            );
            assertCondition(identityContracts.length >= 10, "Expected multiple identity contracts for registry coverage.");

            const targetEvent = "identity.repair_case.opened";
            const targetContract = CONTRACT_PAYLOAD.contracts.find((row) => row.eventName === targetEvent);
            await page
              .locator(`[data-testid='contract-row-${targetContract.canonicalEventContractId}'] td`)
              .first()
              .click();
            await page.locator(`[data-testid='contract-expand-${targetContract.canonicalEventContractId}']`).waitFor();
            const inspectorText = await page.locator("[data-testid='inspector']").innerText();
            assertCondition(
              inspectorText.includes("IdentityRepairCase") &&
                inspectorText.includes("identity.repair_case.opened"),
              "Inspector lost expected identity repair contract detail.",
            );

            const ruleRows = await page.locator("[data-testid^='rule-row-']").count();
            assertCondition(
              ruleRows === filteredRules("identity").length,
              `Normalization rule parity drifted: expected ${filteredRules("identity").length}, found ${ruleRows}`,
            );

            await page.locator("[data-testid='filter-compatibility']").selectOption("new_version_required");
            const newVersionRows = await page.locator("[data-testid^='contract-row-']").count();
            assertCondition(
              newVersionRows ===
                filteredContracts({
                  namespace: "identity",
                  context: "identity_access",
                  compatibility: "new_version_required",
                }).length,
              "Compatibility filter drifted.",
            );

            await page.locator("[data-testid='filter-diff']").selectOption("blocked");
            const blockedDiffRows = await page.locator("[data-testid^='diff-row-']").count();
            assertCondition(
              blockedDiffRows === filteredDiffs("identity", "blocked").length,
              "Schema diff filtering drifted.",
            );

            await page.locator("[data-testid='filter-context']").selectOption("all");
            await page.locator("[data-testid='filter-compatibility']").selectOption("all");
            await page.locator("[data-testid='namespace-button-request']").click();
            const requestContracts = filteredContracts({ namespace: "request" });
            const firstRequest = requestContracts[0];
            const secondRequest = requestContracts[1];
            const firstRow = page.locator(
              `[data-testid='contract-row-${firstRequest.canonicalEventContractId}']`,
            );
            await firstRow.focus();
            await page.keyboard.press("ArrowDown");
            const secondSelected = await page
              .locator(`[data-testid='contract-row-${secondRequest.canonicalEventContractId}']`)
              .getAttribute("data-selected");
            assertCondition(
              secondSelected === "true",
              "Arrow-down navigation no longer advances to the next contract row.",
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
            assertCondition(landmarks >= 6, `Accessibility smoke failed: expected multiple landmarks, found ${landmarks}.`);
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

        export const eventRegistryStudioManifest = {
          task: CONTRACT_PAYLOAD.task_id,
          contracts: CONTRACT_PAYLOAD.summary.active_contract_count,
          namespaces: CONTRACT_PAYLOAD.summary.namespace_count,
          blockedSchemas: SCHEMA_PAYLOAD.summary.blocked_schema_count,
        };
        """
    ).strip() + "\n"


def main() -> None:
    phase0_text = read_text(PHASE0_PATH)
    families = parse_minimum_event_families(phase0_text)
    object_catalog = read_json(OBJECT_CATALOG_PATH)
    state_machines = read_json(STATE_MACHINE_PATH)
    degraded_defaults = read_json(DEGRADED_DEFAULTS_PATH)
    domain_manifest = read_json(DOMAIN_MANIFEST_PATH)
    runtime_manifest = read_json(RUNTIME_MANIFEST_PATH)
    gateway_payload = read_json(GATEWAY_SURFACE_PATH)

    namespaces = build_namespaces(runtime_manifest)
    contracts = build_contracts(families, namespaces)
    rules = normalization_rules(contracts)
    schema_versions, schema_catalog = write_schema_artifacts(contracts)
    schema_diffs = build_schema_diffs(contracts)

    namespace_payload = build_namespace_payload(namespaces, runtime_manifest)
    contract_payload = build_contract_payload(contracts, namespaces, rules, schema_versions, schema_diffs)
    normalization_payload = build_normalization_payload(rules)
    schema_version_payload = build_schema_version_payload(schema_versions, schema_diffs, schema_catalog)
    family_matrix_rows = build_family_matrix(contracts)

    namespace_payload["upstream_inputs"] = {
        "object_catalog_summary": object_catalog["summary"],
        "state_machine_summary": state_machines["summary"],
        "degraded_default_summary": degraded_defaults["summary"],
        "domain_package_summary": domain_manifest["summary"],
        "runtime_topology_summary": runtime_manifest["summary"],
        "gateway_surface_summary": gateway_payload["summary"],
    }

    contract_payload["upstream_inputs"] = namespace_payload["upstream_inputs"]
    normalization_payload["upstream_inputs"] = namespace_payload["upstream_inputs"]
    schema_version_payload["upstream_inputs"] = namespace_payload["upstream_inputs"]

    write_json(NAMESPACE_PATH, namespace_payload)
    write_json(CONTRACT_PATH, contract_payload)
    write_json(NORMALIZATION_PATH, normalization_payload)
    write_json(SCHEMA_VERSION_PATH, schema_version_payload)
    write_csv(FAMILY_MATRIX_PATH, family_matrix_rows)

    write_text(STRATEGY_PATH, build_strategy_doc(namespaces, contracts))
    write_text(PROCESS_PATH, build_process_doc(contracts, rules, schema_diffs))
    write_text(CATALOG_PATH, build_catalog_doc(namespaces, contracts))
    write_text(STUDIO_PATH, build_studio_html())
    write_text(SPEC_PATH, build_playwright_spec())

    write_text(PACKAGE_SOURCE_PATH, build_package_source(namespaces, contracts, schema_catalog))
    write_text(PACKAGE_TEST_PATH, build_package_test())
    write_text(PACKAGE_README_PATH, build_package_readme(namespaces, contracts, schema_catalog))

    update_root_package()
    update_playwright_package()


if __name__ == "__main__":
    main()
