#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
from datetime import datetime, timezone
from pathlib import Path
from textwrap import dedent
from typing import Any


ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = ROOT / "data" / "analysis"
DOCS_DIR = ROOT / "docs" / "architecture"
API_CONTRACTS_DIR = ROOT / "packages" / "api-contracts"
RELEASE_CONTROLS_DIR = ROOT / "packages" / "release-controls"

PROFILE_PACK_PATH = DATA_DIR / "dependency_degradation_profiles.json"
DEGRADED_DEFAULTS_PATH = DATA_DIR / "degraded_mode_defaults.json"
GATEWAY_MANIFEST_PATH = DATA_DIR / "gateway_surface_manifest.json"
FRONTEND_MANIFESTS_PATH = DATA_DIR / "frontend_contract_manifests.json"
FAILURE_MODE_MATRIX_PATH = DATA_DIR / "dependency_failure_mode_matrix.csv"
AUDIENCE_FALLBACK_MATRIX_PATH = DATA_DIR / "audience_fallback_matrix.csv"
SCHEMA_PATH = API_CONTRACTS_DIR / "schemas" / "dependency-degradation-profile.schema.json"
CATALOG_TS_PATH = RELEASE_CONTROLS_DIR / "src" / "dependency-degradation.catalog.ts"

TASK_ID = "par_098"
LEGACY_TASK_ID = "seq_057"
VISUAL_MODE = "Dependency_Degradation_Atlas"
GENERATED_AT = datetime.now(timezone.utc).replace(microsecond=0).isoformat()
CAPTURED_ON = GENERATED_AT[:10]

SOURCE_PRECEDENCE = [
    "prompt/098.md",
    "prompt/shared_operating_contract_096_to_105.md",
    "prompt/AGENT.md",
    "prompt/checklist.md",
    "blueprint/platform-runtime-and-release-blueprint.md#DependencyDegradationProfile",
    "blueprint/platform-runtime-and-release-blueprint.md#AdapterContractProfile",
    "blueprint/platform-runtime-and-release-blueprint.md#RuntimeTopologyManifest",
    "blueprint/platform-runtime-and-release-blueprint.md#GatewayBffSurface",
    "blueprint/platform-runtime-and-release-blueprint.md#ReleaseRecoveryDisposition",
    "blueprint/platform-runtime-and-release-blueprint.md#Verification ladder and operational readiness",
    "blueprint/phase-0-the-foundation-protocol.md#Route-intent law",
    "blueprint/phase-0-the-foundation-protocol.md#Command-settlement law",
    "blueprint/phase-0-the-foundation-protocol.md#Closure-blocker law",
    "blueprint/platform-frontend-blueprint.md#Calm degraded state contracts",
    "blueprint/patient-account-and-communications-blueprint.md#Patient-safe continuity and recovery",
    "blueprint/staff-workspace-interface-architecture.md#Workspace trust envelopes",
    "blueprint/operations-console-frontend-blueprint.md#Diagnostic read-only posture",
    "blueprint/pharmacy-console-frontend-architecture.md#Degraded dispatch and bounce-back posture",
    "blueprint/forensic-audit-findings.md#Finding 88",
    "blueprint/forensic-audit-findings.md#Finding 89",
    "blueprint/forensic-audit-findings.md#Finding 91",
    "blueprint/forensic-audit-findings.md#Finding 96",
    "blueprint/forensic-audit-findings.md#Finding 112",
    "blueprint/forensic-audit-findings.md#Finding 120",
    "data/analysis/degraded_mode_defaults.json",
    "data/analysis/gateway_surface_manifest.json",
    "data/analysis/frontend_contract_manifests.json",
]

FOLLOW_ON_DEPENDENCIES = [
    {
        "dependencyId": "FOLLOW_ON_DEPENDENCY_CONTENT_PATIENT_SAFE_PLACEHOLDER_V1",
        "title": "Patient-safe degraded copy can become richer later",
        "bounded_seam": (
            "par_098 publishes deterministic placeholder and recovery posture now. Later shell work "
            "may refine surface wording without changing fallback mode, escalation ceiling, or "
            "mutation law."
        ),
    },
    {
        "dependencyId": "FOLLOW_ON_DEPENDENCY_CONTENT_WORKSPACE_FALLBACK_COPY_V1",
        "title": "Workspace explanation copy can refine later",
        "bounded_seam": (
            "Staff, hub, support, and pharmacy copy remains intentionally terse here while the "
            "runtime fallback and recovery bindings are fixed."
        ),
    },
    {
        "dependencyId": "FOLLOW_ON_DEPENDENCY_CONTENT_OPERATIONS_DIAGNOSTIC_COPY_V1",
        "title": "Operations and governance diagnostics can gain richer incident copy later",
        "bounded_seam": (
            "The bounded degradation law and assurance implications are authoritative here; later "
            "surfaces may enrich operator copy only."
        ),
    },
]

GAP_RESOLUTIONS = [
    {
        "gapId": "GAP_RESOLUTION_ESCALATION_CEILING_RUNTIME_BOUNDARY_V1",
        "summary": (
            "Where the corpus does not publish a richer escalation ceiling, par_098 chooses the "
            "narrowest backend family ceiling already declared by seq_057 and projects calm browser "
            "fallback on top of it rather than widening backend authority."
        ),
    },
    {
        "gapId": "GAP_RESOLUTION_ESCALATION_CEILING_AUDIENCE_OVERLAY_V1",
        "summary": (
            "Audience-safe placeholders and read-only posture remain allowed presentation overlays "
            "even when the backend escalation ceiling excludes gateway or browser runtime families."
        ),
    },
]

FAILURE_MODE_CLASS_BY_DEPENDENCY = {
    "dep_nhs_login_rail": "callback_ambiguity",
    "dep_pds_fhir_enrichment": "trust_revocation",
    "dep_telephony_ivr_recording_provider": "callback_ambiguity",
    "dep_transcription_processing_provider": "transport_loss",
    "dep_sms_notification_provider": "callback_ambiguity",
    "dep_email_notification_provider": "callback_ambiguity",
    "dep_malware_scanning_provider": "transport_loss",
    "dep_im1_pairing_programme": "trust_revocation",
    "dep_gp_system_supplier_paths": "semantic_contract_mismatch",
    "dep_local_booking_supplier_adapters": "accepted_pending_stall",
    "dep_network_capacity_partner_feeds": "transport_loss",
    "dep_cross_org_secure_messaging_mesh": "callback_ambiguity",
    "dep_origin_practice_ack_rail": "accepted_pending_stall",
    "dep_pharmacy_directory_dohs": "semantic_contract_mismatch",
    "dep_pharmacy_referral_transport": "transport_loss",
    "dep_pharmacy_outcome_observation": "accepted_pending_stall",
    "dep_pharmacy_urgent_return_professional_routes": "trust_revocation",
    "dep_nhs_app_embedded_channel_ecosystem": "semantic_contract_mismatch",
    "dep_assistive_model_vendor_family": "trust_revocation",
    "dep_nhs_assurance_and_standards_sources": "trust_revocation",
}

ROUTE_BINDINGS = {
    "dep_nhs_login_rail": [
        "rf_intake_self_service",
        "rf_patient_secure_link_recovery",
        "rf_patient_home",
        "rf_patient_requests",
        "rf_patient_appointments",
        "rf_patient_messages",
        "rf_patient_embedded_channel",
    ],
    "dep_pds_fhir_enrichment": [
        "rf_intake_self_service",
        "rf_patient_home",
        "rf_patient_requests",
        "rf_patient_health_record",
        "rf_staff_workspace",
    ],
    "dep_telephony_ivr_recording_provider": [
        "rf_intake_telephony_capture",
        "rf_support_ticket_workspace",
        "rf_operations_board",
    ],
    "dep_transcription_processing_provider": [
        "rf_support_replay_observe",
        "rf_staff_workspace_child",
        "rf_support_ticket_workspace",
    ],
    "dep_sms_notification_provider": [
        "rf_patient_secure_link_recovery",
        "rf_patient_messages",
        "rf_support_ticket_workspace",
    ],
    "dep_email_notification_provider": [
        "rf_patient_secure_link_recovery",
        "rf_patient_messages",
        "rf_support_ticket_workspace",
    ],
    "dep_malware_scanning_provider": [
        "rf_patient_health_record",
        "rf_support_ticket_workspace",
        "rf_governance_shell",
    ],
    "dep_im1_pairing_programme": [
        "rf_patient_appointments",
        "rf_staff_workspace",
        "rf_operations_board",
    ],
    "dep_gp_system_supplier_paths": [
        "rf_patient_appointments",
        "rf_staff_workspace",
        "rf_hub_queue",
    ],
    "dep_local_booking_supplier_adapters": [
        "rf_patient_appointments",
        "rf_staff_workspace",
        "rf_hub_queue",
    ],
    "dep_network_capacity_partner_feeds": [
        "rf_patient_appointments",
        "rf_staff_workspace",
        "rf_operations_board",
    ],
    "dep_cross_org_secure_messaging_mesh": [
        "rf_patient_messages",
        "rf_support_replay_observe",
        "rf_hub_case_management",
    ],
    "dep_origin_practice_ack_rail": [
        "rf_hub_case_management",
        "rf_staff_workspace_child",
        "rf_operations_drilldown",
    ],
    "dep_pharmacy_directory_dohs": [
        "rf_pharmacy_console",
        "rf_patient_appointments",
        "rf_hub_case_management",
    ],
    "dep_pharmacy_referral_transport": [
        "rf_pharmacy_console",
        "rf_patient_appointments",
        "rf_staff_workspace",
    ],
    "dep_pharmacy_outcome_observation": [
        "rf_pharmacy_console",
        "rf_staff_workspace_child",
        "rf_operations_drilldown",
    ],
    "dep_pharmacy_urgent_return_professional_routes": [
        "rf_pharmacy_console",
        "rf_hub_case_management",
        "rf_support_ticket_workspace",
    ],
    "dep_nhs_app_embedded_channel_ecosystem": [
        "rf_patient_embedded_channel",
        "rf_patient_secure_link_recovery",
    ],
    "dep_assistive_model_vendor_family": [
        "rf_staff_workspace",
        "rf_operations_board",
        "rf_governance_shell",
    ],
    "dep_nhs_assurance_and_standards_sources": [
        "rf_governance_shell",
        "rf_operations_board",
        "rf_operations_drilldown",
    ],
}

ENGINE_BINDINGS = {
    "gateway_read_only": {
        "gatewayReadMode": "read_only",
        "browserReadPosture": "read_only",
        "browserMutationMode": "refuse",
        "projectionPublicationMode": "carry_forward",
        "integrationDispatchMode": "hold_current",
    },
    "command_halt": {
        "gatewayReadMode": "placeholder",
        "browserReadPosture": "recovery_only",
        "browserMutationMode": "refuse",
        "projectionPublicationMode": "carry_forward",
        "integrationDispatchMode": "halt_dispatch",
    },
    "projection_stale": {
        "gatewayReadMode": "summary_only",
        "browserReadPosture": "read_only",
        "browserMutationMode": "recovery_only",
        "projectionPublicationMode": "projection_stale",
        "integrationDispatchMode": "hold_current",
    },
    "integration_queue_only": {
        "gatewayReadMode": "summary_only",
        "browserReadPosture": "read_only",
        "browserMutationMode": "recovery_only",
        "projectionPublicationMode": "carry_forward",
        "integrationDispatchMode": "queue_only",
    },
    "local_placeholder": {
        "gatewayReadMode": "placeholder",
        "browserReadPosture": "read_only",
        "browserMutationMode": "recovery_only",
        "projectionPublicationMode": "carry_forward",
        "integrationDispatchMode": "halt_dispatch",
    },
}

AUDIENCE_TEMPLATES = {
    "gateway_read_only": {
        "patient": ("patient_safe_placeholder", "read_only", "keep_context_show_safe_next_step"),
        "staff": ("gateway_read_only", "read_only", "hold_write_and_show_current_anchor"),
        "support": ("support_recovery_only", "recovery_only", "guided_assisted_recovery"),
        "operations": ("diagnostic_read_only", "read_only", "inspect_blast_radius_and_wait"),
        "governance": ("diagnostic_read_only", "read_only", "inspect_release_watch"),
        "hub": ("summary_only", "read_only", "handoff_or_retry_from_anchor"),
        "pharmacy": ("summary_only", "read_only", "hold_dispatch_from_same_shell"),
    },
    "command_halt": {
        "patient": ("patient_safe_placeholder", "recovery_only", "same_shell_recovery_only"),
        "staff": ("command_halt", "recovery_only", "complete_repair_or_handoff"),
        "support": ("support_recovery_only", "recovery_only", "guided_assisted_recovery"),
        "operations": ("diagnostic_read_only", "read_only", "inspect_blast_radius_and_wait"),
        "governance": ("diagnostic_read_only", "read_only", "approve_recovery_when_ready"),
        "hub": ("queue_placeholder", "recovery_only", "handoff_or_wait_for_dependency"),
        "pharmacy": ("queue_placeholder", "recovery_only", "hold_dispatch_from_same_shell"),
    },
    "projection_stale": {
        "patient": ("patient_safe_placeholder", "read_only", "show_stale_summary_only"),
        "staff": ("projection_stale", "read_only", "continue_anchor_without_false_freshness"),
        "support": ("support_recovery_only", "read_only", "review_masked_stale_context"),
        "operations": ("diagnostic_read_only", "read_only", "inspect_projection_freshness"),
        "governance": ("diagnostic_read_only", "read_only", "review_projection_parity"),
        "hub": ("summary_only", "read_only", "view_stale_summary_only"),
        "pharmacy": ("summary_only", "read_only", "view_stale_summary_only"),
    },
    "integration_queue_only": {
        "patient": ("patient_safe_placeholder", "read_only", "show_pending_delivery_without_success_claim"),
        "staff": ("queue_only", "recovery_only", "preserve_anchor_and_queue_state"),
        "support": ("support_recovery_only", "recovery_only", "guided_resend_or_contact_repair"),
        "operations": ("diagnostic_read_only", "read_only", "inspect_queue_and_callback_state"),
        "governance": ("diagnostic_read_only", "read_only", "inspect_policy_and_retry_class"),
        "hub": ("queue_placeholder", "read_only", "wait_for_settlement_or_handoff"),
        "pharmacy": ("queue_placeholder", "read_only", "wait_for_settlement_or_handoff"),
    },
    "local_placeholder": {
        "patient": ("patient_safe_placeholder", "read_only", "show_placeholder_until_assurance_recovers"),
        "staff": ("local_placeholder", "read_only", "observe_only_until_assurance_recovers"),
        "support": ("support_recovery_only", "read_only", "observe_only_until_assurance_recovers"),
        "operations": ("diagnostic_read_only", "read_only", "inspect_assurance_and_watch_state"),
        "governance": ("diagnostic_read_only", "read_only", "inspect_assurance_and_release_freeze"),
        "hub": ("summary_only", "read_only", "hold_summary_only"),
        "pharmacy": ("summary_only", "read_only", "hold_summary_only"),
    },
}

OPS_COPY = {
    "gateway_read_only": "Keep diagnostics visible, freeze controls, and show the bounded audience and workload radius.",
    "command_halt": "Keep diagnostics visible, freeze dependent controls, and require tuple-bound recovery before resume.",
    "projection_stale": "Show stale publication and freshness debt explicitly without widening incident scope.",
    "integration_queue_only": "Show queue-only posture, callback ambiguity, and resend debt without implying delivery success.",
    "local_placeholder": "Show watch-only assurance posture and prevent operators from clearing the degraded state by transport health alone.",
}

GOVERNANCE_COPY = {
    "gateway_read_only": "Inspect the bounded read-only posture and release-trust overlay before reopening mutation.",
    "command_halt": "Inspect the halted command slice and confirm recovery gates before authorizing resume.",
    "projection_stale": "Inspect the stale read slice and ensure publication parity recovers before clearing the posture.",
    "integration_queue_only": "Inspect callback ambiguity, queueing posture, and resend rules before clearing the incident.",
    "local_placeholder": "Inspect assurance and standards inputs before restoring live authority to dependent surfaces.",
}

SIMULATION_SCENARIOS = [
    {
        "scenarioId": "LOCAL_IDENTITY_GATEWAY_READ_ONLY",
        "environmentRing": "local",
        "dependencyCode": "dep_nhs_login_rail",
        "routeFamilyRef": "rf_patient_home",
        "observedFailureModeClass": "callback_ambiguity",
        "healthState": "degraded",
        "requestedWorkloadFamilyRefs": [
            "wf_command_orchestration",
            "wf_projection_read_models",
        ],
        "expectedDecisionState": "degraded",
        "expectedGatewayReadMode": "read_only",
        "expectedBrowserMutationMode": "refuse",
        "expectedProjectionPublicationMode": "carry_forward",
        "expectedIntegrationDispatchMode": "hold_current",
    },
    {
        "scenarioId": "LOCAL_BOOKING_COMMAND_HALT",
        "environmentRing": "local",
        "dependencyCode": "dep_local_booking_supplier_adapters",
        "routeFamilyRef": "rf_patient_appointments",
        "observedFailureModeClass": "accepted_pending_stall",
        "healthState": "degraded",
        "requestedWorkloadFamilyRefs": [
            "wf_command_orchestration",
            "wf_projection_read_models",
        ],
        "expectedDecisionState": "degraded",
        "expectedGatewayReadMode": "placeholder",
        "expectedBrowserMutationMode": "refuse",
        "expectedProjectionPublicationMode": "carry_forward",
        "expectedIntegrationDispatchMode": "halt_dispatch",
    },
    {
        "scenarioId": "INTEGRATION_TRANSCRIPT_PROJECTION_STALE",
        "environmentRing": "integration",
        "dependencyCode": "dep_transcription_processing_provider",
        "routeFamilyRef": "rf_support_replay_observe",
        "observedFailureModeClass": "transport_loss",
        "healthState": "degraded",
        "requestedWorkloadFamilyRefs": ["wf_projection_read_models"],
        "expectedDecisionState": "degraded",
        "expectedGatewayReadMode": "summary_only",
        "expectedBrowserMutationMode": "recovery_only",
        "expectedProjectionPublicationMode": "projection_stale",
        "expectedIntegrationDispatchMode": "hold_current",
    },
    {
        "scenarioId": "PREPROD_SMS_QUEUE_ONLY",
        "environmentRing": "preprod",
        "dependencyCode": "dep_sms_notification_provider",
        "routeFamilyRef": "rf_patient_messages",
        "observedFailureModeClass": "callback_ambiguity",
        "healthState": "degraded",
        "requestedWorkloadFamilyRefs": ["wf_integration_dispatch"],
        "expectedDecisionState": "degraded",
        "expectedGatewayReadMode": "summary_only",
        "expectedBrowserMutationMode": "recovery_only",
        "expectedProjectionPublicationMode": "carry_forward",
        "expectedIntegrationDispatchMode": "queue_only",
    },
    {
        "scenarioId": "PREPROD_ASSURANCE_PLACEHOLDER",
        "environmentRing": "preprod",
        "dependencyCode": "dep_nhs_assurance_and_standards_sources",
        "routeFamilyRef": "rf_governance_shell",
        "observedFailureModeClass": "trust_revocation",
        "healthState": "degraded",
        "requestedWorkloadFamilyRefs": ["wf_assurance_security_control"],
        "expectedDecisionState": "degraded",
        "expectedGatewayReadMode": "placeholder",
        "expectedBrowserMutationMode": "recovery_only",
        "expectedProjectionPublicationMode": "carry_forward",
        "expectedIntegrationDispatchMode": "halt_dispatch",
    },
    {
        "scenarioId": "LOCAL_RECOVERY_HELD_UNTIL_TRUST_AND_PUBLICATION_CLEAR",
        "environmentRing": "local",
        "dependencyCode": "dep_nhs_login_rail",
        "routeFamilyRef": "rf_patient_secure_link_recovery",
        "observedFailureModeClass": "callback_ambiguity",
        "healthState": "recovering",
        "requestedWorkloadFamilyRefs": [
            "wf_command_orchestration",
            "wf_projection_read_models",
        ],
        "runtimePublicationState": "stale",
        "parityState": "stale",
        "routeExposureState": "frozen",
        "trustFreezeLive": False,
        "assuranceHardBlock": True,
        "expectedDecisionState": "recovery_held",
        "expectedGatewayReadMode": "read_only",
        "expectedBrowserMutationMode": "refuse",
        "expectedProjectionPublicationMode": "carry_forward",
        "expectedIntegrationDispatchMode": "hold_current",
    },
]


def read_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def write_text(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content.rstrip() + "\n", encoding="utf-8")


def write_json(path: Path, payload: Any) -> None:
    write_text(path, json.dumps(payload, indent=2))


def write_csv(path: Path, rows: list[dict[str, Any]], fieldnames: list[str]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)


def unique_sorted(values: list[str]) -> list[str]:
    return sorted(dict.fromkeys(values))


def build_schema() -> dict[str, Any]:
    return {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "title": "DependencyDegradationProfile",
        "description": (
            "Authoritative dependency degradation profile row enriched by par_098 while retaining "
            "seq_057 compatibility."
        ),
        "type": "object",
        "required": [
            "profileId",
            "dependencyCode",
            "dependencyName",
            "failureMode",
            "failureModeClass",
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
            "routeFamilyRefs",
            "gatewaySurfaceRefs",
            "audienceFallbacks",
            "recoveryRequirements",
            "engineBinding",
            "sourceRefs",
        ],
        "properties": {
            "profileId": {"type": "string"},
            "dependencyCode": {"type": "string"},
            "dependencyName": {"type": "string"},
            "dependencyFamily": {"type": "string"},
            "dependencyClass": {"type": "string"},
            "failureMode": {"type": "string"},
            "failureModeClass": {
                "type": "string",
                "enum": [
                    "transport_loss",
                    "semantic_contract_mismatch",
                    "callback_ambiguity",
                    "accepted_pending_stall",
                    "trust_revocation",
                ],
            },
            "patientFallbackState": {"type": "string"},
            "staffFallbackState": {"type": "string"},
            "supportFallbackState": {"type": "string"},
            "operationsFallbackState": {"type": "string"},
            "governanceFallbackState": {"type": "string"},
            "pharmacyFallbackState": {"type": "string"},
            "hubFallbackState": {"type": "string"},
            "impactedWorkloadFamilyRefs": {"type": "array", "items": {"type": "string"}, "minItems": 1},
            "maximumEscalationFamilyRefs": {"type": "array", "items": {"type": "string"}, "minItems": 1},
            "assuranceTrustEffect": {"type": "string"},
            "topologyFallbackMode": {
                "type": "string",
                "enum": [
                    "gateway_read_only",
                    "command_halt",
                    "projection_stale",
                    "integration_queue_only",
                    "local_placeholder",
                ],
            },
            "queueingMode": {"type": "string"},
            "manualReviewMode": {"type": "string"},
            "freezeMode": {"type": "string"},
            "retryPolicyRef": {"type": "string"},
            "alertThresholdRef": {"type": "string"},
            "recoveryTriggerRef": {"type": "string"},
            "routeFamilyRefs": {"type": "array", "items": {"type": "string"}, "minItems": 1},
            "gatewaySurfaceRefs": {"type": "array", "items": {"type": "string"}, "minItems": 1},
            "audienceFallbacks": {
                "type": "array",
                "minItems": 1,
                "items": {
                    "type": "object",
                    "required": [
                        "audienceType",
                        "fallbackMode",
                        "postureState",
                        "nextSafeAction",
                        "sampleRouteFamilyRef",
                    ],
                    "properties": {
                        "audienceType": {"type": "string"},
                        "fallbackMode": {"type": "string"},
                        "postureState": {"type": "string"},
                        "displaySummary": {"type": "string"},
                        "nextSafeAction": {"type": "string"},
                        "sampleRouteFamilyRef": {"type": "string"},
                        "contentGapRef": {"type": ["string", "null"]},
                    },
                    "additionalProperties": False,
                },
            },
            "recoveryRequirements": {
                "type": "object",
                "required": [
                    "requiredRuntimePublicationState",
                    "requiredParityState",
                    "allowedRouteExposureStates",
                    "requireTrustFreezeLive",
                    "requireAssuranceHardBlockClear",
                ],
                "properties": {
                    "requiredRuntimePublicationState": {"type": "string"},
                    "requiredParityState": {"type": "string"},
                    "allowedRouteExposureStates": {"type": "array", "items": {"type": "string"}},
                    "requireTrustFreezeLive": {"type": "boolean"},
                    "requireAssuranceHardBlockClear": {"type": "boolean"},
                },
                "additionalProperties": False,
            },
            "engineBinding": {
                "type": "object",
                "required": [
                    "gatewayReadMode",
                    "browserReadPosture",
                    "browserMutationMode",
                    "projectionPublicationMode",
                    "integrationDispatchMode",
                ],
                "properties": {
                    "gatewayReadMode": {"type": "string"},
                    "browserReadPosture": {"type": "string"},
                    "browserMutationMode": {"type": "string"},
                    "projectionPublicationMode": {"type": "string"},
                    "integrationDispatchMode": {"type": "string"},
                },
                "additionalProperties": False,
            },
            "sourceRefs": {"type": "array", "items": {"type": "string"}, "minItems": 1},
        },
        "additionalProperties": True,
        "task_id": LEGACY_TASK_ID,
        "runtime_execution_task_id": TASK_ID,
    }


def build_audience_fallbacks(
    profile: dict[str, Any],
    defaults_row: dict[str, Any],
    route_family_refs: list[str],
) -> list[dict[str, Any]]:
    template = AUDIENCE_TEMPLATES[profile["topologyFallbackMode"]]
    fallback_rows: list[dict[str, Any]] = []
    fallback_rows.append(
        {
            "audienceType": "patient",
            "fallbackMode": template["patient"][0],
            "postureState": template["patient"][1],
            "displaySummary": defaults_row["patient_visible_posture_default"],
            "nextSafeAction": template["patient"][2],
            "sampleRouteFamilyRef": next(
                (ref for ref in route_family_refs if ref.startswith("rf_patient_")),
                route_family_refs[0],
            ),
            "contentGapRef": "FOLLOW_ON_DEPENDENCY_CONTENT_PATIENT_SAFE_PLACEHOLDER_V1",
        }
    )
    fallback_rows.append(
        {
            "audienceType": "staff",
            "fallbackMode": template["staff"][0],
            "postureState": template["staff"][1],
            "displaySummary": defaults_row["staff_visible_posture_default"],
            "nextSafeAction": template["staff"][2],
            "sampleRouteFamilyRef": next(
                (
                    ref
                    for ref in route_family_refs
                    if ref.startswith("rf_staff_") or ref.startswith("rf_support_")
                ),
                route_family_refs[0],
            ),
            "contentGapRef": "FOLLOW_ON_DEPENDENCY_CONTENT_WORKSPACE_FALLBACK_COPY_V1",
        }
    )
    fallback_rows.append(
        {
            "audienceType": "support",
            "fallbackMode": template["support"][0],
            "postureState": template["support"][1],
            "displaySummary": defaults_row["support_visible_posture_default"],
            "nextSafeAction": template["support"][2],
            "sampleRouteFamilyRef": next(
                (ref for ref in route_family_refs if ref.startswith("rf_support_")),
                route_family_refs[0],
            ),
            "contentGapRef": "FOLLOW_ON_DEPENDENCY_CONTENT_WORKSPACE_FALLBACK_COPY_V1",
        }
    )
    fallback_rows.append(
        {
            "audienceType": "operations",
            "fallbackMode": template["operations"][0],
            "postureState": template["operations"][1],
            "displaySummary": OPS_COPY[profile["topologyFallbackMode"]],
            "nextSafeAction": template["operations"][2],
            "sampleRouteFamilyRef": next(
                (ref for ref in route_family_refs if ref.startswith("rf_operations_")),
                route_family_refs[0],
            ),
            "contentGapRef": "FOLLOW_ON_DEPENDENCY_CONTENT_OPERATIONS_DIAGNOSTIC_COPY_V1",
        }
    )

    optional_rows = {
        "governance": GOVERNANCE_COPY[profile["topologyFallbackMode"]],
        "hub": profile["manualFallbackDefault"],
        "pharmacy": profile["manualFallbackDefault"],
    }
    for audience, summary in optional_rows.items():
        sample_prefix = {
            "governance": "rf_governance_",
            "hub": "rf_hub_",
            "pharmacy": "rf_pharmacy_",
        }[audience]
        route_ref = next((ref for ref in route_family_refs if ref.startswith(sample_prefix)), None)
        if route_ref is None:
            continue
        template_row = template[audience]
        fallback_rows.append(
            {
                "audienceType": audience,
                "fallbackMode": template_row[0],
                "postureState": template_row[1],
                "displaySummary": summary,
                "nextSafeAction": template_row[2],
                "sampleRouteFamilyRef": route_ref,
                "contentGapRef": (
                    "FOLLOW_ON_DEPENDENCY_CONTENT_OPERATIONS_DIAGNOSTIC_COPY_V1"
                    if audience == "governance"
                    else "FOLLOW_ON_DEPENDENCY_CONTENT_WORKSPACE_FALLBACK_COPY_V1"
                ),
            }
        )
    return fallback_rows


def main() -> None:
    existing_pack = read_json(PROFILE_PACK_PATH)
    degraded_defaults = read_json(DEGRADED_DEFAULTS_PATH)
    gateway_manifest = read_json(GATEWAY_MANIFEST_PATH)
    frontend_manifests = read_json(FRONTEND_MANIFESTS_PATH)
    defaults_by_dependency = {
        row["dependency_id"]: row for row in degraded_defaults["dependencies"]
    }
    route_to_gateway_rows: dict[str, list[dict[str, Any]]] = {}
    for row in gateway_manifest["gateway_surfaces"]:
        for route_family_ref in row["routeFamilyRefs"]:
            route_to_gateway_rows.setdefault(route_family_ref, []).append(row)

    profiles: list[dict[str, Any]] = []
    failure_mode_rows: list[dict[str, Any]] = []
    audience_fallback_rows: list[dict[str, Any]] = []
    topology_mode_counter: dict[str, int] = {
        mode: 0 for mode in ENGINE_BINDINGS
    }
    bounded_family_refs = set[str]()

    for existing_profile in existing_pack["profiles"]:
        dependency_code = existing_profile["dependencyCode"]
        defaults_row = defaults_by_dependency[dependency_code]
        route_family_refs = ROUTE_BINDINGS[dependency_code]
        gateway_surface_refs = unique_sorted(
            [
                gateway_row["surfaceId"]
                for route_family_ref in route_family_refs
                for gateway_row in route_to_gateway_rows.get(route_family_ref, [])
            ]
        )
        audience_fallbacks = build_audience_fallbacks(
            existing_profile,
            defaults_row,
            route_family_refs,
        )
        engine_binding = ENGINE_BINDINGS[existing_profile["topologyFallbackMode"]]
        profile = {
            **existing_profile,
            "dependencyFamily": defaults_row["dependency_family"],
            "dependencyClass": defaults_row["dependency_class"],
            "failureModeClass": FAILURE_MODE_CLASS_BY_DEPENDENCY[dependency_code],
            "supportFallbackState": defaults_row["support_visible_posture_default"],
            "operationsFallbackState": OPS_COPY[existing_profile["topologyFallbackMode"]],
            "governanceFallbackState": GOVERNANCE_COPY[existing_profile["topologyFallbackMode"]],
            "pharmacyFallbackState": existing_profile["manualFallbackDefault"],
            "hubFallbackState": existing_profile["manualFallbackDefault"],
            "routeFamilyRefs": route_family_refs,
            "gatewaySurfaceRefs": gateway_surface_refs,
            "audienceFallbacks": audience_fallbacks,
            "recoveryRequirements": {
                "requiredRuntimePublicationState": "published",
                "requiredParityState": "exact",
                "allowedRouteExposureStates": ["publishable", "constrained"],
                "requireTrustFreezeLive": True,
                "requireAssuranceHardBlockClear": True,
            },
            "engineBinding": engine_binding,
            "runtimeExecutionTaskId": TASK_ID,
            "closureBlockerImplications": defaults_row["closure_blocker_implications"],
            "simulatorCounterparts": defaults_row["simulator_counterparts"],
            "authoritativeSuccessProof": defaults_row["authoritative_success_proof"],
            "authoritativeProofObjects": defaults_row["authoritative_proof_objects"],
            "degradedModeDefault": defaults_row["degraded_mode_default"],
            "contentGapRefs": unique_sorted(
                [
                    row["contentGapRef"]
                    for row in audience_fallbacks
                    if row["contentGapRef"] is not None
                ]
            ),
            "followOnDependencyRefs": [
                "FOLLOW_ON_DEPENDENCY_CONTENT_PATIENT_SAFE_PLACEHOLDER_V1",
                "FOLLOW_ON_DEPENDENCY_CONTENT_WORKSPACE_FALLBACK_COPY_V1",
                "FOLLOW_ON_DEPENDENCY_CONTENT_OPERATIONS_DIAGNOSTIC_COPY_V1",
            ],
            "sourceRefs": unique_sorted(
                existing_profile["sourceRefs"]
                + defaults_row["source_references"]
                + ["docs/architecture/57_dependency_degradation_profile_strategy.md"]
            ),
        }
        profiles.append(profile)
        topology_mode_counter[profile["topologyFallbackMode"]] += 1
        bounded_family_refs.update(profile["maximumEscalationFamilyRefs"])

        failure_mode_rows.append(
            {
                "dependencyCode": dependency_code,
                "dependencyName": profile["dependencyName"],
                "failureMode": profile["failureMode"],
                "failureModeClass": profile["failureModeClass"],
                "topologyFallbackMode": profile["topologyFallbackMode"],
                "gatewayReadMode": engine_binding["gatewayReadMode"],
                "browserMutationMode": engine_binding["browserMutationMode"],
                "projectionPublicationMode": engine_binding["projectionPublicationMode"],
                "integrationDispatchMode": engine_binding["integrationDispatchMode"],
                "assuranceTrustEffect": profile["assuranceTrustEffect"],
                "impactedWorkloadFamilyRefs": ";".join(profile["impactedWorkloadFamilyRefs"]),
                "maximumEscalationFamilyRefs": ";".join(profile["maximumEscalationFamilyRefs"]),
                "alertThresholdRef": profile["alertThresholdRef"],
                "recoveryTriggerRef": profile["recoveryTriggerRef"],
            }
        )
        for fallback in audience_fallbacks:
            audience_fallback_rows.append(
                {
                    "dependencyCode": dependency_code,
                    "audienceType": fallback["audienceType"],
                    "fallbackMode": fallback["fallbackMode"],
                    "postureState": fallback["postureState"],
                    "sampleRouteFamilyRef": fallback["sampleRouteFamilyRef"],
                    "nextSafeAction": fallback["nextSafeAction"],
                    "contentGapRef": fallback["contentGapRef"] or "",
                    "topologyFallbackMode": profile["topologyFallbackMode"],
                    "assuranceTrustEffect": profile["assuranceTrustEffect"],
                }
            )

    pack = {
        **existing_pack,
        "task_id": LEGACY_TASK_ID,
        "runtime_execution_task_id": TASK_ID,
        "generated_at": GENERATED_AT,
        "captured_on": CAPTURED_ON,
        "visual_mode": VISUAL_MODE,
        "mission": (
            "Compile one authoritative dependency degradation pack so gateway, command, "
            "projection, integration, and browser recovery posture consume the same bounded "
            "fallback law."
        ),
        "source_precedence": SOURCE_PRECEDENCE,
        "follow_on_dependencies": FOLLOW_ON_DEPENDENCIES,
        "gap_resolutions": GAP_RESOLUTIONS,
        "summary": {
            **existing_pack["summary"],
            "runtime_execution_profile_count": len(profiles),
            "failure_mode_matrix_row_count": len(failure_mode_rows),
            "audience_fallback_row_count": len(audience_fallback_rows),
            "topology_fallback_mode_count": len(topology_mode_counter),
            "gateway_read_only_count": topology_mode_counter["gateway_read_only"],
            "command_halt_count": topology_mode_counter["command_halt"],
            "projection_stale_count": topology_mode_counter["projection_stale"],
            "integration_queue_only_count": topology_mode_counter["integration_queue_only"],
            "local_placeholder_count": topology_mode_counter["local_placeholder"],
            "bounded_family_count": len(bounded_family_refs),
            "simulation_scenario_count": len(SIMULATION_SCENARIOS),
        },
        "profiles": profiles,
        "simulationScenarios": SIMULATION_SCENARIOS,
        "frontendManifestRefs": unique_sorted(
            [
                manifest["frontendContractManifestId"]
                for manifest in frontend_manifests["frontendContractManifests"]
            ]
        ),
    }

    catalog_payload = {
        "taskId": TASK_ID,
        "generatedAt": GENERATED_AT,
        "visualMode": VISUAL_MODE,
        "sourcePrecedence": SOURCE_PRECEDENCE,
        "followOnDependencies": FOLLOW_ON_DEPENDENCIES,
        "gapResolutions": GAP_RESOLUTIONS,
        "summary": {
            "profileCount": len(profiles),
            "failureModeMatrixRowCount": len(failure_mode_rows),
            "audienceFallbackRowCount": len(audience_fallback_rows),
            "simulationScenarioCount": len(SIMULATION_SCENARIOS),
        },
        "profiles": profiles,
        "failureModeRows": failure_mode_rows,
        "audienceFallbackRows": audience_fallback_rows,
        "simulationScenarios": SIMULATION_SCENARIOS,
    }

    catalog_source = dedent(
        f"""
        export const dependencyDegradationCatalog = {json.dumps(catalog_payload, indent=2)} as const;

        export type DependencyDegradationCatalog = typeof dependencyDegradationCatalog;
        export type DependencyDegradationProfileRow =
          DependencyDegradationCatalog["profiles"][number];
        export type DependencyDegradationFailureModeRow =
          DependencyDegradationCatalog["failureModeRows"][number];
        export type DependencyDegradationAudienceFallbackRow =
          DependencyDegradationCatalog["audienceFallbackRows"][number];
        export type DependencyDegradationSimulationScenario =
          DependencyDegradationCatalog["simulationScenarios"][number];
        """
    )

    write_json(PROFILE_PACK_PATH, pack)
    write_json(SCHEMA_PATH, build_schema())
    write_csv(
        FAILURE_MODE_MATRIX_PATH,
        failure_mode_rows,
        [
            "dependencyCode",
            "dependencyName",
            "failureMode",
            "failureModeClass",
            "topologyFallbackMode",
            "gatewayReadMode",
            "browserMutationMode",
            "projectionPublicationMode",
            "integrationDispatchMode",
            "assuranceTrustEffect",
            "impactedWorkloadFamilyRefs",
            "maximumEscalationFamilyRefs",
            "alertThresholdRef",
            "recoveryTriggerRef",
        ],
    )
    write_csv(
        AUDIENCE_FALLBACK_MATRIX_PATH,
        audience_fallback_rows,
        [
            "dependencyCode",
            "audienceType",
            "fallbackMode",
            "postureState",
            "sampleRouteFamilyRef",
            "nextSafeAction",
            "contentGapRef",
            "topologyFallbackMode",
            "assuranceTrustEffect",
        ],
    )
    write_text(CATALOG_TS_PATH, catalog_source)


if __name__ == "__main__":
    main()
