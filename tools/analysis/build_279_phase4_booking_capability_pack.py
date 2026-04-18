#!/usr/bin/env python3
from __future__ import annotations

import csv
import hashlib
import html
import json
from datetime import date
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
TODAY = date.today().isoformat()
TASK_ID = "seq_279"
VISUAL_MODE = "Booking_Capability_Atlas"
CONTRACT_VERSION = "279.phase4.booking-capability-freeze.v1"


def repo_path(relative: str) -> str:
    return str(ROOT / relative)


def write_text(relative: str, content: str) -> None:
    path = ROOT / relative
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content.rstrip() + "\n", encoding="utf-8")


def write_json(relative: str, payload: object) -> None:
    write_text(relative, json.dumps(payload, indent=2))


def write_csv(relative: str, rows: list[dict[str, object]], fieldnames: list[str]) -> None:
    path = ROOT / relative
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        for row in rows:
            writer.writerow(row)


def md_table(headers: list[str], rows: list[list[str]]) -> str:
    header = "| " + " | ".join(headers) + " |"
    rule = "| " + " | ".join(["---"] * len(headers)) + " |"
    body = ["| " + " | ".join(cell.replace("|", "\\|") for cell in row) + " |" for row in rows]
    return "\n".join([header, rule, *body])


def stable_json(value: object) -> str:
    return json.dumps(value, sort_keys=True, separators=(",", ":"))


def digest(prefix: str, payload: object) -> str:
    return f"{prefix}_{hashlib.sha256(stable_json(payload).encode('utf-8')).hexdigest()[:16]}"


def lower_hex(payload: object) -> str:
    return hashlib.sha256(stable_json(payload).encode("utf-8")).hexdigest()


def enum_string(values: list[str], description: str) -> dict[str, object]:
    return {"type": "string", "enum": values, "description": description}


def ref_string(description: str, nullable: bool = False) -> dict[str, object]:
    return {
        "type": ["string", "null"] if nullable else "string",
        "minLength": 0 if nullable else 1,
        "description": description,
    }


INTEGRATION_MODES = [
    "im1_patient_api",
    "im1_transaction_api",
    "gp_connect_existing",
    "local_gateway_component",
    "manual_assist_only",
]

CAPABILITY_STATES = [
    "live_self_service",
    "live_staff_assist",
    "assisted_only",
    "linkage_required",
    "local_component_required",
    "degraded_manual",
    "recovery_only",
    "blocked",
]

PROJECTION_SURFACE_STATES = [
    "self_service_live",
    "staff_assist_live",
    "assisted_only",
    "linkage_required",
    "local_component_required",
    "degraded_manual",
    "recovery_required",
    "blocked",
]

ACTION_SCOPES = [
    "search_slots",
    "book_slot",
    "cancel_appointment",
    "reschedule_appointment",
    "view_appointment",
    "hold_slot",
    "launch_local_component",
    "repair_gp_linkage",
    "request_staff_assist",
    "manage_appointment",
    "view_booking_summary",
]

SELECTION_AUDIENCES = ["patient", "staff"]

BLOCKED_REASON_CODES = {
    "reason_gp_linkage_required": {
        "label": "GP linkage required",
        "class": "prerequisite",
        "summary": "Patient self-service cannot proceed until the current GP-practice linkage checkpoint is satisfied.",
    },
    "reason_local_component_required": {
        "label": "Local consumer component required",
        "class": "deployment",
        "summary": "The current integration mode requires a local consumer or gateway component before live booking mutation is lawful.",
    },
    "reason_self_service_not_supported": {
        "label": "Self-service not supported",
        "class": "audience",
        "summary": "The supplier mode supports staff-assist only for the current action scope.",
    },
    "reason_staff_assist_only": {
        "label": "Staff-assist only",
        "class": "audience",
        "summary": "The surface must suppress patient actionability and route through the bounded assisted path.",
    },
    "reason_supplier_degraded_manual": {
        "label": "Supplier degraded to manual mode",
        "class": "degradation",
        "summary": "The supplier or dependent component is degraded and booking-core must prefer the declared manual fallback over direct retries.",
    },
    "reason_publication_frozen": {
        "label": "Route publication frozen",
        "class": "publication",
        "summary": "The live route tuple no longer matches a writable published surface and must degrade in place.",
    },
    "reason_assurance_read_only": {
        "label": "Assurance slice read-only",
        "class": "trust",
        "summary": "Assurance or release trust has dropped below writable posture for the current capability tuple.",
    },
    "reason_governing_object_stale": {
        "label": "Governing object drifted",
        "class": "governing_object",
        "summary": "The governing booking or appointment object version no longer matches the tuple under evaluation.",
    },
    "reason_action_scope_not_supported": {
        "label": "Action scope unsupported",
        "class": "scope",
        "summary": "The requested action scope is not supported by the current matrix row and binding.",
    },
    "reason_confirmation_gate_pending": {
        "label": "Confirmation gate pending",
        "class": "confirmation",
        "summary": "A weak supplier acknowledgement has been observed, but authoritative booking truth remains gate-bound.",
    },
    "reason_policy_blocked": {
        "label": "Policy blocked",
        "class": "policy",
        "summary": "A compiled policy or governance rule blocks this action even though the supplier mode exists.",
    },
}

FALLBACK_ACTIONS = {
    "fallback_repair_gp_linkage": {
        "label": "Repair GP linkage",
        "channel": "same_shell_repair",
        "summary": "Stay on the same anchor and open the linkage-repair recovery path.",
    },
    "fallback_launch_local_component": {
        "label": "Launch local component",
        "channel": "same_shell_component_launch",
        "summary": "Preserve the anchor and route through the declared local consumer or gateway path.",
    },
    "fallback_request_staff_assist": {
        "label": "Request staff assist",
        "channel": "staff_assist",
        "summary": "Promote the bounded assisted-booking path without inventing new supply meaning.",
    },
    "fallback_contact_practice_support": {
        "label": "Contact practice support",
        "channel": "support_route",
        "summary": "Use the support-owned recovery path when self-service cannot proceed safely.",
    },
    "fallback_continue_read_only": {
        "label": "Continue read-only",
        "channel": "same_shell_read_only",
        "summary": "Keep the selected slot or appointment anchor visible but suppress writable controls.",
    },
    "fallback_wait_for_confirmation": {
        "label": "Wait for confirmation",
        "channel": "same_shell_pending",
        "summary": "Preserve current summary posture while authoritative confirmation truth is still pending.",
    },
    "fallback_manual_hub_booking": {
        "label": "Manual hub booking",
        "channel": "hub_handoff",
        "summary": "Route into the manual or hub-managed booking path declared by the degradation profile.",
    },
}


ADAPTER_PROFILES = [
    {
        "adapterContractProfileId": "ACP_279_IM1_PATIENT_SELF_SERVICE",
        "versionRef": "279.adapter-profile.im1-patient.v1",
        "label": "IM1 patient self-service adapter",
        "integrationModes": ["im1_patient_api"],
        "carrierProtocol": "https_json",
        "mayOwnOperationFamilies": [
            "search_normalization",
            "temporal_normalization",
            "revalidation",
            "commit_dispatch",
            "authoritative_read",
            "manage_translation",
        ],
        "forbiddenCoreSemantics": [
            "capacity_ranking",
            "fallback_choice",
            "patient_copy",
            "shell_control_exposure",
        ],
        "confirmationModel": "read_after_write_required",
        "localComponentMode": "none",
        "supplierPackPosture": "pairing_guidance_plus_supplier_pip",
        "sourceRefs": [
            "blueprint/phase-4-the-booking-engine.md#4B. Provider capability matrix and adapter seam",
            "blueprint/platform-runtime-and-release-blueprint.md#AdapterContractProfile",
        ],
    },
    {
        "adapterContractProfileId": "ACP_279_IM1_TRANSACTION_LOCAL_COMPONENT",
        "versionRef": "279.adapter-profile.im1-transaction-local-component.v1",
        "label": "IM1 transaction local-component adapter",
        "integrationModes": ["im1_transaction_api"],
        "carrierProtocol": "https_json",
        "mayOwnOperationFamilies": [
            "search_normalization",
            "temporal_normalization",
            "component_bridge",
        ],
        "forbiddenCoreSemantics": [
            "capacity_ranking",
            "fallback_choice",
            "patient_copy",
            "manage_actionability",
        ],
        "confirmationModel": "contract_only_component_gate",
        "localComponentMode": "required",
        "supplierPackPosture": "pairing_guidance_plus_supplier_pip",
        "sourceRefs": [
            "blueprint/phase-4-the-booking-engine.md#4B. Provider capability matrix and adapter seam",
            "blueprint/platform-runtime-and-release-blueprint.md#AdapterContractProfile",
        ],
    },
    {
        "adapterContractProfileId": "ACP_279_GP_CONNECT_APPOINTMENT_MANAGEMENT",
        "versionRef": "279.adapter-profile.gp-connect-appointment-management.v1",
        "label": "GP Connect appointment management adapter",
        "integrationModes": ["gp_connect_existing"],
        "carrierProtocol": "fhir_stu3_spine_proxy",
        "mayOwnOperationFamilies": [
            "search_normalization",
            "temporal_normalization",
            "revalidation",
            "commit_dispatch",
            "authoritative_read",
            "manage_translation",
        ],
        "forbiddenCoreSemantics": [
            "capacity_ranking",
            "fallback_choice",
            "patient_copy",
            "manual_override_meaning",
        ],
        "confirmationModel": "durable_provider_reference",
        "localComponentMode": "none",
        "supplierPackPosture": "existing-service-guidance-plus-onboarding-pack",
        "sourceRefs": [
            "blueprint/phase-4-the-booking-engine.md#4B. Provider capability matrix and adapter seam",
            "blueprint/platform-runtime-and-release-blueprint.md#AdapterContractProfile",
        ],
    },
    {
        "adapterContractProfileId": "ACP_279_LOCAL_GATEWAY_COMPONENT",
        "versionRef": "279.adapter-profile.local-gateway-component.v1",
        "label": "Local gateway component adapter",
        "integrationModes": ["local_gateway_component"],
        "carrierProtocol": "local_component_bridge",
        "mayOwnOperationFamilies": [
            "search_normalization",
            "temporal_normalization",
            "component_bridge",
            "authoritative_read",
        ],
        "forbiddenCoreSemantics": [
            "capacity_ranking",
            "fallback_choice",
            "patient_copy",
            "publication_control",
        ],
        "confirmationModel": "external_gate_required",
        "localComponentMode": "required",
        "supplierPackPosture": "local-gateway-bounded-pack",
        "sourceRefs": [
            "blueprint/phase-4-the-booking-engine.md#4B. Provider capability matrix and adapter seam",
            "blueprint/platform-runtime-and-release-blueprint.md#AdapterContractProfile",
        ],
    },
    {
        "adapterContractProfileId": "ACP_279_MANUAL_ASSIST_ROUTER",
        "versionRef": "279.adapter-profile.manual-assist-router.v1",
        "label": "Manual assist router",
        "integrationModes": ["manual_assist_only"],
        "carrierProtocol": "manual_ticket_or_staff_queue",
        "mayOwnOperationFamilies": [
            "ticket_translation",
            "summary_normalization",
        ],
        "forbiddenCoreSemantics": [
            "capacity_ranking",
            "patient_copy",
            "self_service_actionability",
            "authoritative_booking_truth",
        ],
        "confirmationModel": "manual_confirmation_gate",
        "localComponentMode": "none",
        "supplierPackPosture": "typed-gap-only",
        "sourceRefs": [
            "blueprint/phase-4-the-booking-engine.md#4B. Provider capability matrix and adapter seam",
            "blueprint/platform-runtime-and-release-blueprint.md#AdapterContractProfile",
        ],
    },
]


DEGRADATION_PROFILES = [
    {
        "dependencyDegradationProfileId": "DDP_279_PATIENT_LINKAGE_AND_SUPPORT",
        "versionRef": "279.degradation-profile.patient-linkage-and-support.v1",
        "label": "Patient linkage and support recovery",
        "dominantCapabilityState": "linkage_required",
        "fallbackActionRefs": [
            "fallback_repair_gp_linkage",
            "fallback_contact_practice_support",
        ],
        "blockedActionReasonCodes": [
            "reason_gp_linkage_required",
            "reason_action_scope_not_supported",
        ],
        "sameShellPosture": "preserve_anchor_then_repair",
    },
    {
        "dependencyDegradationProfileId": "DDP_279_LOCAL_COMPONENT_RECOVERY",
        "versionRef": "279.degradation-profile.local-component-recovery.v1",
        "label": "Local component recovery",
        "dominantCapabilityState": "local_component_required",
        "fallbackActionRefs": [
            "fallback_launch_local_component",
            "fallback_request_staff_assist",
        ],
        "blockedActionReasonCodes": [
            "reason_local_component_required",
            "reason_action_scope_not_supported",
        ],
        "sameShellPosture": "preserve_anchor_then_component_launch",
    },
    {
        "dependencyDegradationProfileId": "DDP_279_ASSISTED_ONLY_HANDOFF",
        "versionRef": "279.degradation-profile.assisted-only-handoff.v1",
        "label": "Assisted-only handoff",
        "dominantCapabilityState": "assisted_only",
        "fallbackActionRefs": [
            "fallback_request_staff_assist",
            "fallback_continue_read_only",
        ],
        "blockedActionReasonCodes": [
            "reason_staff_assist_only",
            "reason_self_service_not_supported",
        ],
        "sameShellPosture": "promote_assisted_path",
    },
    {
        "dependencyDegradationProfileId": "DDP_279_DEGRADED_MANUAL_RECOVERY",
        "versionRef": "279.degradation-profile.degraded-manual-recovery.v1",
        "label": "Degraded manual recovery",
        "dominantCapabilityState": "degraded_manual",
        "fallbackActionRefs": [
            "fallback_manual_hub_booking",
            "fallback_continue_read_only",
        ],
        "blockedActionReasonCodes": [
            "reason_supplier_degraded_manual",
            "reason_confirmation_gate_pending",
        ],
        "sameShellPosture": "freeze_writable_then_handoff",
    },
    {
        "dependencyDegradationProfileId": "DDP_279_PUBLICATION_AND_TRUST_FREEZE",
        "versionRef": "279.degradation-profile.publication-and-trust-freeze.v1",
        "label": "Publication and trust freeze",
        "dominantCapabilityState": "recovery_only",
        "fallbackActionRefs": [
            "fallback_continue_read_only",
            "fallback_contact_practice_support",
        ],
        "blockedActionReasonCodes": [
            "reason_publication_frozen",
            "reason_assurance_read_only",
            "reason_governing_object_stale",
        ],
        "sameShellPosture": "bounded_recovery_only",
    },
]


CONFIRMATION_POLICIES = [
    {
        "authoritativeReadAndConfirmationPolicyId": "POLICY_279_IM1_PATIENT_READ_AFTER_WRITE",
        "versionRef": "279.confirmation-policy.im1-patient-read-after-write.v1",
        "label": "IM1 patient read-after-write confirmation policy",
        "authoritativeReadMode": "read_after_write",
        "confirmationGateMode": "same_commit_or_immediate_followup_read",
        "supportsAsyncCommitConfirmation": False,
        "supportsDisputeRecovery": True,
        "acceptedProcessingStates": ["accepted_for_processing"],
        "durableProofClasses": ["same_commit_read_after_write", "durable_provider_reference"],
        "pendingTruthStates": ["booking_in_progress"],
        "disputedTruthStates": ["reconciliation_required"],
        "gateRequiredStates": ["accepted_for_processing_without_durable_proof"],
        "manageExposureBeforeProof": "hidden",
        "patientVisibilityBeforeProof": "provisional_receipt",
        "sourceRefs": [
            "blueprint/phase-4-the-booking-engine.md#4B. Provider capability matrix and adapter seam",
            "blueprint/phase-4-the-booking-engine.md#4E. Commit path, revalidation, booking record, and compensation",
        ],
    },
    {
        "authoritativeReadAndConfirmationPolicyId": "POLICY_279_GP_CONNECT_PROVIDER_REFERENCE",
        "versionRef": "279.confirmation-policy.gp-connect-provider-reference.v1",
        "label": "GP Connect durable provider-reference policy",
        "authoritativeReadMode": "durable_provider_reference",
        "confirmationGateMode": "provider_reference_or_read_after_write",
        "supportsAsyncCommitConfirmation": True,
        "supportsDisputeRecovery": True,
        "acceptedProcessingStates": ["accepted_for_processing", "provider_pending"],
        "durableProofClasses": ["durable_provider_reference", "same_commit_read_after_write"],
        "pendingTruthStates": ["booking_in_progress", "confirmation_pending"],
        "disputedTruthStates": ["reconciliation_required"],
        "gateRequiredStates": ["provider_reference_missing"],
        "manageExposureBeforeProof": "summary_only",
        "patientVisibilityBeforeProof": "provisional_receipt",
        "sourceRefs": [
            "blueprint/phase-4-the-booking-engine.md#4B. Provider capability matrix and adapter seam",
            "blueprint/phase-4-the-booking-engine.md#4E. Commit path, revalidation, booking record, and compensation",
        ],
    },
    {
        "authoritativeReadAndConfirmationPolicyId": "POLICY_279_LOCAL_GATEWAY_EXTERNAL_GATE",
        "versionRef": "279.confirmation-policy.local-gateway-external-gate.v1",
        "label": "Local gateway external confirmation gate policy",
        "authoritativeReadMode": "gate_required",
        "confirmationGateMode": "external_confirmation_gate",
        "supportsAsyncCommitConfirmation": True,
        "supportsDisputeRecovery": True,
        "acceptedProcessingStates": ["accepted_for_processing", "gateway_accepted"],
        "durableProofClasses": ["external_confirmation_gate_released", "durable_provider_reference"],
        "pendingTruthStates": ["booking_in_progress", "confirmation_pending"],
        "disputedTruthStates": ["reconciliation_required"],
        "gateRequiredStates": ["external_gate_pending"],
        "manageExposureBeforeProof": "hidden",
        "patientVisibilityBeforeProof": "summary_only",
        "sourceRefs": [
            "blueprint/phase-4-the-booking-engine.md#4B. Provider capability matrix and adapter seam",
            "blueprint/phase-4-the-booking-engine.md#4E. Commit path, revalidation, booking record, and compensation",
        ],
    },
    {
        "authoritativeReadAndConfirmationPolicyId": "POLICY_279_MANUAL_CONFIRMATION_GATE",
        "versionRef": "279.confirmation-policy.manual-confirmation-gate.v1",
        "label": "Manual confirmation gate policy",
        "authoritativeReadMode": "gate_required",
        "confirmationGateMode": "manual_confirmation_or_support_evidence",
        "supportsAsyncCommitConfirmation": True,
        "supportsDisputeRecovery": False,
        "acceptedProcessingStates": ["handoff_logged"],
        "durableProofClasses": ["manual_confirmation_evidence"],
        "pendingTruthStates": ["manual_follow_up_pending"],
        "disputedTruthStates": [],
        "gateRequiredStates": ["manual_confirmation_pending"],
        "manageExposureBeforeProof": "hidden",
        "patientVisibilityBeforeProof": "summary_only",
        "sourceRefs": [
            "blueprint/phase-4-the-booking-engine.md#4B. Provider capability matrix and adapter seam",
            "blueprint/phase-4-the-booking-engine.md#4E. Commit path, revalidation, booking record, and compensation",
        ],
    },
]


MATRIX_ROWS = [
    {
        "providerCapabilityMatrixRef": "PCM_279_OPTUM_IM1_PATIENT_V1",
        "matrixVersionRef": "279.matrix.optum-im1-patient.v1",
        "rowOwnerRef": "booking_domain_release_board",
        "tenantId": "tenant_vecells_beta",
        "practiceRef": "ods_A83002",
        "organisationRef": "org_vecells_beta",
        "supplierRef": "optum_emis_web",
        "supplierLabel": "Optum EMIS Web",
        "integrationMode": "im1_patient_api",
        "deploymentType": "internet_patient_shell",
        "assuranceStateRef": "assurance_pairing_live",
        "supportedActionScopes": [
            "search_slots",
            "book_slot",
            "cancel_appointment",
            "reschedule_appointment",
            "view_appointment",
            "view_booking_summary",
        ],
        "capabilities": {
            "can_search_slots": True,
            "can_book": True,
            "can_cancel": True,
            "can_reschedule": True,
            "can_view_appointment": True,
            "can_hold_slot": False,
            "requires_gp_linkage_details": True,
            "supports_patient_self_service": True,
            "supports_staff_assisted_booking": False,
            "supports_async_commit_confirmation": False,
            "requires_local_consumer_component": False,
        },
        "manageCapabilityState": "full",
        "reservationMode": "truthful_nonexclusive",
        "authoritativeReadMode": "read_after_write",
        "primaryDependencyDegradationProfileRef": "DDP_279_PATIENT_LINKAGE_AND_SUPPORT",
        "authoritativeReadAndConfirmationPolicyRef": "POLICY_279_IM1_PATIENT_READ_AFTER_WRITE",
        "searchNormalizationContractRef": "contract://booking/search-normalization/im1-patient/v1",
        "revalidationContractRef": "contract://booking/revalidation/im1-patient/v1",
        "manageSupportContractRef": "contract://booking/manage-support/im1-patient/v1",
        "contractState": "active",
        "publishedAt": TODAY,
    },
    {
        "providerCapabilityMatrixRef": "PCM_279_TPP_IM1_PATIENT_V1",
        "matrixVersionRef": "279.matrix.tpp-im1-patient.v1",
        "rowOwnerRef": "booking_domain_release_board",
        "tenantId": "tenant_vecells_beta",
        "practiceRef": "ods_A83002",
        "organisationRef": "org_vecells_beta",
        "supplierRef": "tpp_systmone",
        "supplierLabel": "TPP SystmOne",
        "integrationMode": "im1_patient_api",
        "deploymentType": "internet_patient_shell",
        "assuranceStateRef": "assurance_pairing_live",
        "supportedActionScopes": [
            "search_slots",
            "book_slot",
            "cancel_appointment",
            "reschedule_appointment",
            "view_appointment",
            "view_booking_summary",
        ],
        "capabilities": {
            "can_search_slots": True,
            "can_book": True,
            "can_cancel": True,
            "can_reschedule": True,
            "can_view_appointment": True,
            "can_hold_slot": False,
            "requires_gp_linkage_details": True,
            "supports_patient_self_service": True,
            "supports_staff_assisted_booking": False,
            "supports_async_commit_confirmation": False,
            "requires_local_consumer_component": False,
        },
        "manageCapabilityState": "full",
        "reservationMode": "truthful_nonexclusive",
        "authoritativeReadMode": "read_after_write",
        "primaryDependencyDegradationProfileRef": "DDP_279_PATIENT_LINKAGE_AND_SUPPORT",
        "authoritativeReadAndConfirmationPolicyRef": "POLICY_279_IM1_PATIENT_READ_AFTER_WRITE",
        "searchNormalizationContractRef": "contract://booking/search-normalization/im1-patient/v1",
        "revalidationContractRef": "contract://booking/revalidation/im1-patient/v1",
        "manageSupportContractRef": "contract://booking/manage-support/im1-patient/v1",
        "contractState": "active",
        "publishedAt": TODAY,
    },
    {
        "providerCapabilityMatrixRef": "PCM_279_TPP_IM1_TRANSACTION_V1",
        "matrixVersionRef": "279.matrix.tpp-im1-transaction.v1",
        "rowOwnerRef": "booking_domain_release_board",
        "tenantId": "tenant_vecells_beta",
        "practiceRef": "ods_A83002",
        "organisationRef": "org_vecells_beta",
        "supplierRef": "tpp_systmone",
        "supplierLabel": "TPP SystmOne",
        "integrationMode": "im1_transaction_api",
        "deploymentType": "practice_local_component",
        "assuranceStateRef": "assurance_supported_test",
        "supportedActionScopes": [
            "search_slots",
            "view_appointment",
            "launch_local_component",
            "request_staff_assist",
        ],
        "capabilities": {
            "can_search_slots": True,
            "can_book": False,
            "can_cancel": False,
            "can_reschedule": False,
            "can_view_appointment": True,
            "can_hold_slot": False,
            "requires_gp_linkage_details": False,
            "supports_patient_self_service": False,
            "supports_staff_assisted_booking": True,
            "supports_async_commit_confirmation": False,
            "requires_local_consumer_component": True,
        },
        "manageCapabilityState": "summary_only",
        "reservationMode": "degraded_manual_pending",
        "authoritativeReadMode": "gate_required",
        "primaryDependencyDegradationProfileRef": "DDP_279_LOCAL_COMPONENT_RECOVERY",
        "authoritativeReadAndConfirmationPolicyRef": "POLICY_279_LOCAL_GATEWAY_EXTERNAL_GATE",
        "searchNormalizationContractRef": "contract://booking/search-normalization/im1-transaction/v1",
        "revalidationContractRef": "contract://booking/revalidation/im1-transaction/v1",
        "manageSupportContractRef": "contract://booking/manage-support/im1-transaction/v1",
        "contractState": "active",
        "publishedAt": TODAY,
    },
    {
        "providerCapabilityMatrixRef": "PCM_279_GP_CONNECT_EXISTING_V1",
        "matrixVersionRef": "279.matrix.gp-connect-existing.v1",
        "rowOwnerRef": "booking_domain_release_board",
        "tenantId": "tenant_vecells_beta",
        "practiceRef": "ods_A83002",
        "organisationRef": "org_vecells_beta",
        "supplierRef": "gp_connect_existing",
        "supplierLabel": "GP Connect appointment management",
        "integrationMode": "gp_connect_existing",
        "deploymentType": "hscn_direct_care_consumer",
        "assuranceStateRef": "assurance_live_existing_service",
        "supportedActionScopes": [
            "search_slots",
            "book_slot",
            "cancel_appointment",
            "reschedule_appointment",
            "view_appointment",
            "manage_appointment",
            "view_booking_summary",
            "request_staff_assist",
        ],
        "capabilities": {
            "can_search_slots": True,
            "can_book": True,
            "can_cancel": True,
            "can_reschedule": True,
            "can_view_appointment": True,
            "can_hold_slot": False,
            "requires_gp_linkage_details": False,
            "supports_patient_self_service": False,
            "supports_staff_assisted_booking": True,
            "supports_async_commit_confirmation": True,
            "requires_local_consumer_component": False,
        },
        "manageCapabilityState": "full",
        "reservationMode": "truthful_nonexclusive",
        "authoritativeReadMode": "durable_provider_reference",
        "primaryDependencyDegradationProfileRef": "DDP_279_ASSISTED_ONLY_HANDOFF",
        "authoritativeReadAndConfirmationPolicyRef": "POLICY_279_GP_CONNECT_PROVIDER_REFERENCE",
        "searchNormalizationContractRef": "contract://booking/search-normalization/gp-connect/v1",
        "revalidationContractRef": "contract://booking/revalidation/gp-connect/v1",
        "manageSupportContractRef": "contract://booking/manage-support/gp-connect/v1",
        "contractState": "active",
        "publishedAt": TODAY,
    },
    {
        "providerCapabilityMatrixRef": "PCM_279_LOCAL_GATEWAY_COMPONENT_V1",
        "matrixVersionRef": "279.matrix.local-gateway-component.v1",
        "rowOwnerRef": "booking_domain_release_board",
        "tenantId": "tenant_vecells_beta",
        "practiceRef": "ods_A83002",
        "organisationRef": "org_vecells_beta",
        "supplierRef": "vecells_local_gateway",
        "supplierLabel": "Vecells local gateway",
        "integrationMode": "local_gateway_component",
        "deploymentType": "practice_local_gateway",
        "assuranceStateRef": "assurance_local_component_ready",
        "supportedActionScopes": [
            "search_slots",
            "book_slot",
            "cancel_appointment",
            "view_appointment",
            "launch_local_component",
            "request_staff_assist",
        ],
        "capabilities": {
            "can_search_slots": True,
            "can_book": True,
            "can_cancel": True,
            "can_reschedule": False,
            "can_view_appointment": True,
            "can_hold_slot": False,
            "requires_gp_linkage_details": False,
            "supports_patient_self_service": False,
            "supports_staff_assisted_booking": True,
            "supports_async_commit_confirmation": True,
            "requires_local_consumer_component": True,
        },
        "manageCapabilityState": "partial",
        "reservationMode": "truthful_nonexclusive",
        "authoritativeReadMode": "gate_required",
        "primaryDependencyDegradationProfileRef": "DDP_279_LOCAL_COMPONENT_RECOVERY",
        "authoritativeReadAndConfirmationPolicyRef": "POLICY_279_LOCAL_GATEWAY_EXTERNAL_GATE",
        "searchNormalizationContractRef": "contract://booking/search-normalization/local-gateway/v1",
        "revalidationContractRef": "contract://booking/revalidation/local-gateway/v1",
        "manageSupportContractRef": "contract://booking/manage-support/local-gateway/v1",
        "contractState": "active",
        "publishedAt": TODAY,
    },
    {
        "providerCapabilityMatrixRef": "PCM_279_MANUAL_ASSIST_ONLY_V1",
        "matrixVersionRef": "279.matrix.manual-assist-only.v1",
        "rowOwnerRef": "booking_domain_release_board",
        "tenantId": "tenant_vecells_beta",
        "practiceRef": "ods_A83002",
        "organisationRef": "org_vecells_beta",
        "supplierRef": "manual_assist_network",
        "supplierLabel": "Manual assist network",
        "integrationMode": "manual_assist_only",
        "deploymentType": "ops_manual_assist",
        "assuranceStateRef": "assurance_manual_assist_only",
        "supportedActionScopes": [
            "view_appointment",
            "view_booking_summary",
            "request_staff_assist",
        ],
        "capabilities": {
            "can_search_slots": False,
            "can_book": False,
            "can_cancel": False,
            "can_reschedule": False,
            "can_view_appointment": True,
            "can_hold_slot": False,
            "requires_gp_linkage_details": False,
            "supports_patient_self_service": False,
            "supports_staff_assisted_booking": True,
            "supports_async_commit_confirmation": True,
            "requires_local_consumer_component": False,
        },
        "manageCapabilityState": "summary_only",
        "reservationMode": "degraded_manual_pending",
        "authoritativeReadMode": "gate_required",
        "primaryDependencyDegradationProfileRef": "DDP_279_DEGRADED_MANUAL_RECOVERY",
        "authoritativeReadAndConfirmationPolicyRef": "POLICY_279_MANUAL_CONFIRMATION_GATE",
        "searchNormalizationContractRef": "contract://booking/search-normalization/manual-assist/v1",
        "revalidationContractRef": "contract://booking/revalidation/manual-assist/v1",
        "manageSupportContractRef": "contract://booking/manage-support/manual-assist/v1",
        "contractState": "active",
        "publishedAt": TODAY,
    },
]


def matrix_row_hash(row: dict[str, object]) -> str:
    payload = {
        key: row[key]
        for key in [
            "providerCapabilityMatrixRef",
            "matrixVersionRef",
            "tenantId",
            "practiceRef",
            "organisationRef",
            "supplierRef",
            "integrationMode",
            "deploymentType",
            "assuranceStateRef",
            "supportedActionScopes",
            "capabilities",
            "manageCapabilityState",
            "reservationMode",
            "authoritativeReadMode",
            "primaryDependencyDegradationProfileRef",
            "authoritativeReadAndConfirmationPolicyRef",
            "searchNormalizationContractRef",
            "revalidationContractRef",
            "manageSupportContractRef",
            "contractState",
        ]
    }
    return lower_hex(payload)


for row in MATRIX_ROWS:
    row["rowHash"] = matrix_row_hash(row)


def compile_binding(row: dict[str, object]) -> dict[str, object]:
    action_scope_set = list(row["supportedActionScopes"])
    patient_self_service = bool(row["capabilities"]["supports_patient_self_service"])
    staff_assist = bool(row["capabilities"]["supports_staff_assisted_booking"])
    selection_audiences: list[str] = []
    if patient_self_service:
        selection_audiences.append("patient")
    if staff_assist or row["integrationMode"] in {"gp_connect_existing", "local_gateway_component", "manual_assist_only"}:
        selection_audiences.append("staff")
    if row["integrationMode"] in {"gp_connect_existing", "local_gateway_component", "manual_assist_only"} and "patient" not in selection_audiences:
        selection_audiences.append("patient")

    profile_lookup = {
        "im1_patient_api": "ACP_279_IM1_PATIENT_SELF_SERVICE",
        "im1_transaction_api": "ACP_279_IM1_TRANSACTION_LOCAL_COMPONENT",
        "gp_connect_existing": "ACP_279_GP_CONNECT_APPOINTMENT_MANAGEMENT",
        "local_gateway_component": "ACP_279_LOCAL_GATEWAY_COMPONENT",
        "manual_assist_only": "ACP_279_MANUAL_ASSIST_ROUTER",
    }

    binding = {
        "bookingProviderAdapterBindingId": f"BIND_279_{row['providerCapabilityMatrixRef'].replace('PCM_279_', '')}",
        "providerCapabilityMatrixRef": row["providerCapabilityMatrixRef"],
        "matrixVersionRef": row["matrixVersionRef"],
        "supplierRef": row["supplierRef"],
        "integrationMode": row["integrationMode"],
        "deploymentType": row["deploymentType"],
        "actionScopeSet": action_scope_set,
        "selectionAudienceSet": selection_audiences,
        "adapterContractProfileRef": profile_lookup[row["integrationMode"]],
        "dependencyDegradationProfileRef": row["primaryDependencyDegradationProfileRef"],
        "searchNormalizationContractRef": row["searchNormalizationContractRef"],
        "temporalNormalizationContractRef": f"contract://booking/temporal-normalization/{row['integrationMode']}/v1",
        "revalidationContractRef": row["revalidationContractRef"],
        "reservationSemantics": row["reservationMode"],
        "commitContractRef": f"contract://booking/commit/{row['integrationMode']}/v1",
        "authoritativeReadContractRef": f"contract://booking/authoritative-read/{row['authoritativeReadMode']}/v1",
        "manageSupportContractRef": row["manageSupportContractRef"],
        "authoritativeReadAndConfirmationPolicyRef": row["authoritativeReadAndConfirmationPolicyRef"],
        "bindingState": "live",
        "bindingCompilationOwnerRule": "exact active matrix row + exact integration mode + exact deployment type + explicit actionScopeSet + explicit selectionAudienceSet",
        "publishedAt": TODAY,
    }
    binding["bindingHash"] = lower_hex(binding)
    return binding


BINDINGS = [compile_binding(row) for row in MATRIX_ROWS]
MATRIX_BY_REF = {row["providerCapabilityMatrixRef"]: row for row in MATRIX_ROWS}
BINDING_BY_MATRIX_REF = {binding["providerCapabilityMatrixRef"]: binding for binding in BINDINGS}


SCENARIOS = [
    {
        "scenarioId": "SCN_279_OPTUM_PATIENT_BOOK_LIVE",
        "label": "Optum patient self-service live booking",
        "parityGroupId": "PG_279_OPTUM_PATIENT_BOOKING",
        "providerCapabilityMatrixRef": "PCM_279_OPTUM_IM1_PATIENT_V1",
        "selectionAudience": "patient",
        "requestedActionScope": "book_slot",
        "gpLinkageStatus": "linked",
        "localConsumerStatus": "not_required",
        "supplierDegradationStatus": "nominal",
        "publicationState": "published",
        "assuranceTrustState": "writable",
        "governingObjectDescriptorRef": "BookingCase",
        "governingObjectRef": "booking_case_507",
        "governingObjectVersionRef": "booking_case_507_v3",
        "parentAnchorRef": "patient_booking_anchor_507",
        "routeIntentBindingRef": "rib_279_patient_booking_workspace",
        "surfaceRouteContractRef": "asrc_279_patient_booking_workspace",
        "surfacePublicationRef": "surfpub_279_patient_booking_workspace_live",
        "runtimePublicationBundleRef": "rpb_279_patient_booking_workspace_live",
        "capabilityState": "live_self_service",
        "projectionSurfaceState": "self_service_live",
        "dominantCapabilityCueCode": "cue_live_booking",
        "allowedActionScopes": ["search_slots", "book_slot", "view_appointment", "cancel_appointment", "reschedule_appointment"],
        "exposedActionScopes": ["search_slots", "book_slot", "view_appointment"],
        "fallbackActionRefs": [],
        "blockedActionReasonCodes": [],
        "liveControlExposure": "live",
    },
    {
        "scenarioId": "SCN_279_TPP_PATIENT_VIEW_LIVE",
        "label": "TPP patient appointment summary live",
        "parityGroupId": "PG_279_TPP_PATIENT_VIEW",
        "providerCapabilityMatrixRef": "PCM_279_TPP_IM1_PATIENT_V1",
        "selectionAudience": "patient",
        "requestedActionScope": "view_appointment",
        "gpLinkageStatus": "linked",
        "localConsumerStatus": "not_required",
        "supplierDegradationStatus": "nominal",
        "publicationState": "published",
        "assuranceTrustState": "writable",
        "governingObjectDescriptorRef": "AppointmentRecord",
        "governingObjectRef": "appointment_279_214",
        "governingObjectVersionRef": "appointment_279_214_v2",
        "parentAnchorRef": "patient_appointment_anchor_214",
        "routeIntentBindingRef": "rib_279_patient_appointment_summary",
        "surfaceRouteContractRef": "asrc_279_patient_appointment_summary",
        "surfacePublicationRef": "surfpub_279_patient_appointment_summary_live",
        "runtimePublicationBundleRef": "rpb_279_patient_appointment_summary_live",
        "capabilityState": "live_self_service",
        "projectionSurfaceState": "self_service_live",
        "dominantCapabilityCueCode": "cue_live_view",
        "allowedActionScopes": ["view_appointment", "cancel_appointment", "reschedule_appointment"],
        "exposedActionScopes": ["view_appointment"],
        "fallbackActionRefs": [],
        "blockedActionReasonCodes": [],
        "liveControlExposure": "live",
    },
    {
        "scenarioId": "SCN_279_OPTUM_LINKAGE_REQUIRED",
        "label": "Optum patient linkage required",
        "parityGroupId": "PG_279_OPTUM_PATIENT_BOOKING",
        "providerCapabilityMatrixRef": "PCM_279_OPTUM_IM1_PATIENT_V1",
        "selectionAudience": "patient",
        "requestedActionScope": "book_slot",
        "gpLinkageStatus": "missing",
        "localConsumerStatus": "not_required",
        "supplierDegradationStatus": "nominal",
        "publicationState": "published",
        "assuranceTrustState": "writable",
        "governingObjectDescriptorRef": "BookingCase",
        "governingObjectRef": "booking_case_507",
        "governingObjectVersionRef": "booking_case_507_v3",
        "parentAnchorRef": "patient_booking_anchor_507",
        "routeIntentBindingRef": "rib_279_patient_booking_workspace",
        "surfaceRouteContractRef": "asrc_279_patient_booking_workspace",
        "surfacePublicationRef": "surfpub_279_patient_booking_workspace_live",
        "runtimePublicationBundleRef": "rpb_279_patient_booking_workspace_live",
        "capabilityState": "linkage_required",
        "projectionSurfaceState": "linkage_required",
        "dominantCapabilityCueCode": "cue_linkage_required",
        "allowedActionScopes": ["view_booking_summary"],
        "exposedActionScopes": ["repair_gp_linkage"],
        "fallbackActionRefs": ["fallback_repair_gp_linkage", "fallback_contact_practice_support"],
        "blockedActionReasonCodes": ["reason_gp_linkage_required"],
        "liveControlExposure": "fallback",
    },
    {
        "scenarioId": "SCN_279_TPP_TRANSACTION_LOCAL_COMPONENT",
        "label": "TPP IM1 transaction local component required",
        "parityGroupId": "PG_279_TPP_TRANSACTION_COMPONENT",
        "providerCapabilityMatrixRef": "PCM_279_TPP_IM1_TRANSACTION_V1",
        "selectionAudience": "staff",
        "requestedActionScope": "search_slots",
        "gpLinkageStatus": "not_required",
        "localConsumerStatus": "missing",
        "supplierDegradationStatus": "nominal",
        "publicationState": "published",
        "assuranceTrustState": "writable",
        "governingObjectDescriptorRef": "BookingCase",
        "governingObjectRef": "booking_case_612",
        "governingObjectVersionRef": "booking_case_612_v1",
        "parentAnchorRef": "staff_booking_anchor_612",
        "routeIntentBindingRef": "rib_279_staff_booking_workspace",
        "surfaceRouteContractRef": "asrc_279_staff_booking_workspace",
        "surfacePublicationRef": "surfpub_279_staff_booking_workspace_live",
        "runtimePublicationBundleRef": "rpb_279_staff_booking_workspace_live",
        "capabilityState": "local_component_required",
        "projectionSurfaceState": "local_component_required",
        "dominantCapabilityCueCode": "cue_local_component_required",
        "allowedActionScopes": ["launch_local_component", "request_staff_assist", "view_appointment"],
        "exposedActionScopes": ["launch_local_component"],
        "fallbackActionRefs": ["fallback_launch_local_component", "fallback_request_staff_assist"],
        "blockedActionReasonCodes": ["reason_local_component_required"],
        "liveControlExposure": "fallback",
    },
    {
        "scenarioId": "SCN_279_GP_CONNECT_PATIENT_ASSISTED_ONLY",
        "label": "GP Connect patient manage assisted only",
        "parityGroupId": "PG_279_GP_CONNECT_MANAGE",
        "providerCapabilityMatrixRef": "PCM_279_GP_CONNECT_EXISTING_V1",
        "selectionAudience": "patient",
        "requestedActionScope": "reschedule_appointment",
        "gpLinkageStatus": "not_required",
        "localConsumerStatus": "not_required",
        "supplierDegradationStatus": "nominal",
        "publicationState": "published",
        "assuranceTrustState": "writable",
        "governingObjectDescriptorRef": "AppointmentRecord",
        "governingObjectRef": "appointment_279_600",
        "governingObjectVersionRef": "appointment_279_600_v5",
        "parentAnchorRef": "patient_manage_anchor_600",
        "routeIntentBindingRef": "rib_279_patient_manage_appointment",
        "surfaceRouteContractRef": "asrc_279_patient_manage_appointment",
        "surfacePublicationRef": "surfpub_279_patient_manage_appointment_live",
        "runtimePublicationBundleRef": "rpb_279_patient_manage_appointment_live",
        "capabilityState": "assisted_only",
        "projectionSurfaceState": "assisted_only",
        "dominantCapabilityCueCode": "cue_assisted_only",
        "allowedActionScopes": ["view_appointment", "request_staff_assist"],
        "exposedActionScopes": ["request_staff_assist"],
        "fallbackActionRefs": ["fallback_request_staff_assist", "fallback_continue_read_only"],
        "blockedActionReasonCodes": ["reason_staff_assist_only", "reason_self_service_not_supported"],
        "liveControlExposure": "fallback",
    },
    {
        "scenarioId": "SCN_279_GP_CONNECT_STAFF_LIVE",
        "label": "GP Connect staff manage live",
        "parityGroupId": "PG_279_GP_CONNECT_MANAGE",
        "providerCapabilityMatrixRef": "PCM_279_GP_CONNECT_EXISTING_V1",
        "selectionAudience": "staff",
        "requestedActionScope": "reschedule_appointment",
        "gpLinkageStatus": "not_required",
        "localConsumerStatus": "not_required",
        "supplierDegradationStatus": "nominal",
        "publicationState": "published",
        "assuranceTrustState": "writable",
        "governingObjectDescriptorRef": "AppointmentRecord",
        "governingObjectRef": "appointment_279_600",
        "governingObjectVersionRef": "appointment_279_600_v5",
        "parentAnchorRef": "staff_manage_anchor_600",
        "routeIntentBindingRef": "rib_279_staff_manage_appointment",
        "surfaceRouteContractRef": "asrc_279_staff_manage_appointment",
        "surfacePublicationRef": "surfpub_279_staff_manage_appointment_live",
        "runtimePublicationBundleRef": "rpb_279_staff_manage_appointment_live",
        "capabilityState": "live_staff_assist",
        "projectionSurfaceState": "staff_assist_live",
        "dominantCapabilityCueCode": "cue_staff_assist_live",
        "allowedActionScopes": ["search_slots", "book_slot", "cancel_appointment", "reschedule_appointment", "view_appointment", "manage_appointment"],
        "exposedActionScopes": ["reschedule_appointment", "cancel_appointment", "view_appointment"],
        "fallbackActionRefs": [],
        "blockedActionReasonCodes": [],
        "liveControlExposure": "live",
    },
    {
        "scenarioId": "SCN_279_LOCAL_GATEWAY_DEGRADED_MANUAL",
        "label": "Local gateway degraded to manual",
        "parityGroupId": "PG_279_LOCAL_GATEWAY",
        "providerCapabilityMatrixRef": "PCM_279_LOCAL_GATEWAY_COMPONENT_V1",
        "selectionAudience": "staff",
        "requestedActionScope": "book_slot",
        "gpLinkageStatus": "not_required",
        "localConsumerStatus": "ready",
        "supplierDegradationStatus": "degraded_manual",
        "publicationState": "published",
        "assuranceTrustState": "writable",
        "governingObjectDescriptorRef": "BookingCase",
        "governingObjectRef": "booking_case_728",
        "governingObjectVersionRef": "booking_case_728_v2",
        "parentAnchorRef": "staff_booking_anchor_728",
        "routeIntentBindingRef": "rib_279_staff_booking_workspace",
        "surfaceRouteContractRef": "asrc_279_staff_booking_workspace",
        "surfacePublicationRef": "surfpub_279_staff_booking_workspace_live",
        "runtimePublicationBundleRef": "rpb_279_staff_booking_workspace_live",
        "capabilityState": "degraded_manual",
        "projectionSurfaceState": "degraded_manual",
        "dominantCapabilityCueCode": "cue_degraded_manual",
        "allowedActionScopes": ["request_staff_assist", "view_booking_summary"],
        "exposedActionScopes": ["request_staff_assist"],
        "fallbackActionRefs": ["fallback_manual_hub_booking", "fallback_continue_read_only"],
        "blockedActionReasonCodes": ["reason_supplier_degraded_manual", "reason_confirmation_gate_pending"],
        "liveControlExposure": "fallback",
    },
    {
        "scenarioId": "SCN_279_GP_CONNECT_RECOVERY_ONLY",
        "label": "GP Connect route frozen recovery only",
        "parityGroupId": "PG_279_GP_CONNECT_RECOVERY",
        "providerCapabilityMatrixRef": "PCM_279_GP_CONNECT_EXISTING_V1",
        "selectionAudience": "staff",
        "requestedActionScope": "search_slots",
        "gpLinkageStatus": "not_required",
        "localConsumerStatus": "not_required",
        "supplierDegradationStatus": "nominal",
        "publicationState": "frozen",
        "assuranceTrustState": "read_only",
        "governingObjectDescriptorRef": "BookingCase",
        "governingObjectRef": "booking_case_803",
        "governingObjectVersionRef": "booking_case_803_v4",
        "parentAnchorRef": "staff_booking_anchor_803",
        "routeIntentBindingRef": "rib_279_staff_booking_workspace",
        "surfaceRouteContractRef": "asrc_279_staff_booking_workspace",
        "surfacePublicationRef": "surfpub_279_staff_booking_workspace_frozen",
        "runtimePublicationBundleRef": "rpb_279_staff_booking_workspace_frozen",
        "capabilityState": "recovery_only",
        "projectionSurfaceState": "recovery_required",
        "dominantCapabilityCueCode": "cue_recovery_only",
        "allowedActionScopes": ["view_booking_summary"],
        "exposedActionScopes": [],
        "fallbackActionRefs": ["fallback_continue_read_only", "fallback_contact_practice_support"],
        "blockedActionReasonCodes": ["reason_publication_frozen", "reason_assurance_read_only"],
        "liveControlExposure": "read_only",
    },
    {
        "scenarioId": "SCN_279_MANUAL_ASSIST_BLOCKED",
        "label": "Manual assist only patient blocked",
        "parityGroupId": "PG_279_MANUAL_ASSIST_BLOCKED",
        "providerCapabilityMatrixRef": "PCM_279_MANUAL_ASSIST_ONLY_V1",
        "selectionAudience": "patient",
        "requestedActionScope": "cancel_appointment",
        "gpLinkageStatus": "not_required",
        "localConsumerStatus": "not_required",
        "supplierDegradationStatus": "nominal",
        "publicationState": "published",
        "assuranceTrustState": "blocked",
        "governingObjectDescriptorRef": "AppointmentRecord",
        "governingObjectRef": "appointment_279_905",
        "governingObjectVersionRef": "appointment_279_905_v1",
        "parentAnchorRef": "patient_manage_anchor_905",
        "routeIntentBindingRef": "rib_279_patient_manage_appointment",
        "surfaceRouteContractRef": "asrc_279_patient_manage_appointment",
        "surfacePublicationRef": "surfpub_279_patient_manage_appointment_live",
        "runtimePublicationBundleRef": "rpb_279_patient_manage_appointment_live",
        "capabilityState": "blocked",
        "projectionSurfaceState": "blocked",
        "dominantCapabilityCueCode": "cue_blocked",
        "allowedActionScopes": ["view_appointment", "view_booking_summary"],
        "exposedActionScopes": [],
        "fallbackActionRefs": ["fallback_contact_practice_support"],
        "blockedActionReasonCodes": ["reason_policy_blocked", "reason_action_scope_not_supported"],
        "liveControlExposure": "hidden",
    },
]


def scenario_hash_input(scenario: dict[str, object], row: dict[str, object], binding: dict[str, object]) -> dict[str, object]:
    return {
        "tenantId": row["tenantId"],
        "practiceRef": row["practiceRef"],
        "organisationRef": row["organisationRef"],
        "supplierRef": row["supplierRef"],
        "integrationMode": row["integrationMode"],
        "deploymentType": row["deploymentType"],
        "selectionAudience": scenario["selectionAudience"],
        "requestedActionScope": scenario["requestedActionScope"],
        "providerCapabilityMatrixRef": row["providerCapabilityMatrixRef"],
        "matrixVersionRef": row["matrixVersionRef"],
        "providerAdapterBindingRef": binding["bookingProviderAdapterBindingId"],
        "providerAdapterBindingHash": binding["bindingHash"],
        "adapterContractProfileRef": binding["adapterContractProfileRef"],
        "gpLinkageCheckpoint": scenario["gpLinkageStatus"],
        "localConsumerCheckpoint": scenario["localConsumerStatus"],
        "assuranceTrustState": scenario["assuranceTrustState"],
        "surfacePublicationRef": scenario["surfacePublicationRef"],
        "runtimePublicationBundleRef": scenario["runtimePublicationBundleRef"],
        "routeIntentBindingRef": scenario["routeIntentBindingRef"],
        "governingObjectDescriptorRef": scenario["governingObjectDescriptorRef"],
        "governingObjectVersionRef": scenario["governingObjectVersionRef"],
        "parentAnchorRef": scenario["parentAnchorRef"],
    }


RESOLUTIONS: list[dict[str, object]] = []
PROJECTIONS: list[dict[str, object]] = []
for scenario in SCENARIOS:
    row = MATRIX_BY_REF[scenario["providerCapabilityMatrixRef"]]
    binding = BINDING_BY_MATRIX_REF[row["providerCapabilityMatrixRef"]]
    tuple_input = scenario_hash_input(scenario, row, binding)
    capability_tuple_hash = lower_hex(tuple_input)
    resolution_id = f"RES_279_{scenario['scenarioId'].replace('SCN_279_', '')}"
    projection_id = f"PROJ_279_{scenario['scenarioId'].replace('SCN_279_', '')}"
    resolution = {
        "bookingCapabilityResolutionId": resolution_id,
        "schemaVersion": CONTRACT_VERSION,
        "bookingCaseId": scenario["governingObjectRef"] if scenario["governingObjectDescriptorRef"] == "BookingCase" else None,
        "appointmentId": scenario["governingObjectRef"] if scenario["governingObjectDescriptorRef"] == "AppointmentRecord" else None,
        "tenantId": row["tenantId"],
        "practiceRef": row["practiceRef"],
        "organisationRef": row["organisationRef"],
        "supplierRef": row["supplierRef"],
        "integrationMode": row["integrationMode"],
        "deploymentType": row["deploymentType"],
        "selectionAudience": scenario["selectionAudience"],
        "requestedActionScope": scenario["requestedActionScope"],
        "providerCapabilityMatrixRef": row["providerCapabilityMatrixRef"],
        "capabilityMatrixVersionRef": row["matrixVersionRef"],
        "providerAdapterBindingRef": binding["bookingProviderAdapterBindingId"],
        "providerAdapterBindingHash": binding["bindingHash"],
        "adapterContractProfileRef": binding["adapterContractProfileRef"],
        "dependencyDegradationProfileRef": binding["dependencyDegradationProfileRef"],
        "authoritativeReadAndConfirmationPolicyRef": binding["authoritativeReadAndConfirmationPolicyRef"],
        "gpLinkageCheckpointRef": None if scenario["gpLinkageStatus"] == "not_required" else f"chk_{scenario['gpLinkageStatus']}",
        "localConsumerCheckpointRef": None if scenario["localConsumerStatus"] == "not_required" else f"chk_{scenario['localConsumerStatus']}",
        "prerequisiteState": {
            "gpLinkageStatus": scenario["gpLinkageStatus"],
            "localConsumerStatus": scenario["localConsumerStatus"],
            "supplierDegradationStatus": scenario["supplierDegradationStatus"],
            "publicationState": scenario["publicationState"],
            "assuranceTrustState": scenario["assuranceTrustState"],
        },
        "routeTuple": {
            "routeIntentBindingRef": scenario["routeIntentBindingRef"],
            "surfaceRouteContractRef": scenario["surfaceRouteContractRef"],
            "surfacePublicationRef": scenario["surfacePublicationRef"],
            "runtimePublicationBundleRef": scenario["runtimePublicationBundleRef"],
            "routeTupleHash": lower_hex(
                {
                    "routeIntentBindingRef": scenario["routeIntentBindingRef"],
                    "surfaceRouteContractRef": scenario["surfaceRouteContractRef"],
                    "surfacePublicationRef": scenario["surfacePublicationRef"],
                    "runtimePublicationBundleRef": scenario["runtimePublicationBundleRef"],
                }
            ),
        },
        "governingObjectDescriptorRef": scenario["governingObjectDescriptorRef"],
        "governingObjectRef": scenario["governingObjectRef"],
        "governingObjectVersionRef": scenario["governingObjectVersionRef"],
        "parentAnchorRef": scenario["parentAnchorRef"],
        "capabilityTupleHash": capability_tuple_hash,
        "capabilityState": scenario["capabilityState"],
        "allowedActionScopes": scenario["allowedActionScopes"],
        "blockedActionReasonCodes": scenario["blockedActionReasonCodes"],
        "fallbackActionRefs": scenario["fallbackActionRefs"],
        "evidenceRefs": [
            row["providerCapabilityMatrixRef"],
            binding["bookingProviderAdapterBindingId"],
            binding["authoritativeReadAndConfirmationPolicyRef"],
        ],
        "evaluatedAt": f"{TODAY}T09:00:00Z",
        "expiresAt": f"{TODAY}T10:00:00Z",
        "x-capabilityTupleHashInputOrder": list(tuple_input.keys()),
    }
    projection = {
        "bookingCapabilityProjectionId": projection_id,
        "schemaVersion": CONTRACT_VERSION,
        "bookingCaseId": resolution["bookingCaseId"],
        "appointmentId": resolution["appointmentId"],
        "bookingCapabilityResolutionRef": resolution_id,
        "selectionAudience": scenario["selectionAudience"],
        "requestedActionScope": scenario["requestedActionScope"],
        "providerAdapterBindingRef": binding["bookingProviderAdapterBindingId"],
        "capabilityTupleHash": capability_tuple_hash,
        "surfaceState": scenario["projectionSurfaceState"],
        "dominantCapabilityCueCode": scenario["dominantCapabilityCueCode"],
        "controlState": "writable"
        if scenario["liveControlExposure"] == "live"
        else "read_only"
        if scenario["liveControlExposure"] == "read_only"
        else "blocked",
        "selfServiceActionRefs": [
            action for action in scenario["exposedActionScopes"] if scenario["selectionAudience"] == "patient"
        ],
        "assistedActionRefs": [
            action for action in scenario["exposedActionScopes"] if scenario["selectionAudience"] == "staff"
        ],
        "manageActionRefs": [
            action
            for action in scenario["exposedActionScopes"]
            if action in {"cancel_appointment", "reschedule_appointment", "manage_appointment", "view_appointment"}
        ],
        "fallbackActionRefs": scenario["fallbackActionRefs"],
        "blockedActionReasonCodes": scenario["blockedActionReasonCodes"],
        "exposedActionScopes": scenario["exposedActionScopes"],
        "parityGroupId": scenario["parityGroupId"],
        "underlyingCapabilityState": scenario["capabilityState"],
        "renderedAt": f"{TODAY}T09:00:05Z",
    }
    RESOLUTIONS.append(resolution)
    PROJECTIONS.append(projection)


RESOLUTION_BY_ID = {resolution["bookingCapabilityResolutionId"]: resolution for resolution in RESOLUTIONS}
PROJECTION_BY_ID = {projection["bookingCapabilityProjectionId"]: projection for projection in PROJECTIONS}


GAP_LOG = {
    "taskId": TASK_ID,
    "visualMode": VISUAL_MODE,
    "contractVersion": CONTRACT_VERSION,
    "gaps": [
        {
            "gapId": "PHASE4_GAP_279_001",
            "missingSurface": "Supplier-specific PIP operation detail and proof quirks",
            "expectedOwnerTrack": "phase4_provider_onboarding",
            "temporaryFallback": "Matrix rows and adapter profiles freeze safe ceiling values and typed contract refs without encoding optimistic supplier-pack assumptions.",
            "riskIfUnresolved": "Implementations could over-claim supplier self-service or confirmation behavior from labels alone.",
            "followUpAction": "Bind each supplier onboarding pack to the published matrix row ids, adapter profile ids, and confirmation policy ids instead of introducing side registries.",
            "typedSeams": [
                "ProviderCapabilityMatrix.matrixVersionRef",
                "AdapterContractProfile.adapterContractProfileId",
                "BookingProviderAdapterBinding.authoritativeReadAndConfirmationPolicyRef",
            ],
        },
        {
            "gapId": "PHASE4_GAP_279_002",
            "missingSurface": "Live runtime capability compiler and query surface",
            "expectedOwnerTrack": "phase4_runtime_booking_implementation",
            "temporaryFallback": "279 publishes deterministic binding compilation rules, hashes, and sample tuples but does not add the runtime compiler itself.",
            "riskIfUnresolved": "Browser or worker code could drift back toward route-local capability inference.",
            "followUpAction": "Runtime capability evaluation must persist `BookingCapabilityResolution` and `BookingCapabilityProjection` exactly as frozen here.",
            "typedSeams": [
                "BookingCapabilityResolution.capabilityTupleHash",
                "BookingCapabilityProjection.bookingCapabilityResolutionRef",
                "booking.capability.resolved",
            ],
        },
        {
            "gapId": "PHASE4_GAP_279_003",
            "missingSurface": "Deep commit, reservation, waitlist, and manage semantics",
            "expectedOwnerTrack": "seq_280",
            "temporaryFallback": "279 freezes only the capability, binding, and confirmation-gate seams that later booking-flow contracts must consume.",
            "riskIfUnresolved": "Later commit or manage work could fork confirmation truth away from the declared capability policies.",
            "followUpAction": "280 must bind slot, reservation, confirmation, and manage contracts to the exact policy and binding refs published here.",
            "typedSeams": [
                "BookingProviderAdapterBinding.commitContractRef",
                "BookingProviderAdapterBinding.authoritativeReadContractRef",
                "AuthoritativeReadAndConfirmationPolicyRegistry",
            ],
        },
    ],
}


EXTERNAL_REFERENCE_NOTES = """# 279 External Reference Notes

Reviewed on {today}. These sources were support material only. When they differed in emphasis or left room for interpretation, the local blueprint remained authoritative.

## Borrowed support

1. NHS England Digital IM1 Pairing integration guidance
   - URL: <https://digital.nhs.uk/services/digital-services-for-integrated-care/im1-pairing-integration>
   - Borrowed: current pairing posture, supplier onboarding shape, and the fact that technical detail arrives through supplier PIP and acceptance stages instead of generic public capability claims.
   - Applied to: fail-closed matrix rows, typed onboarding gaps, and the decision not to hard-code optimistic supplier behavior.

2. NHS England Digital IM1 interface mechanisms guidance
   - URL: <https://digital.nhs.uk/services/digital-services-for-integrated-care/im1-pairing-integration/interface-mechanisms-guidance>
   - Borrowed: the split between Patient API and Transaction API, including linkage requirements and the possibility of local consumer components or GP Connect dependencies.
   - Applied to: mandatory integration-mode enum values, local-component-required recovery, and linkage-required posture.

3. NHS England Digital GP Connect developer guidance
   - URL: <https://digital.nhs.uk/developer/api-catalogue/gp-connect-1-2-7>
   - Borrowed: the service should be treated as an explicit integration mode with bounded appointment-management semantics, not a generic vendor synonym.
   - Applied to: separate `gp_connect_existing` mode, staff-first manage posture, and durable-provider-reference confirmation policy.

4. NHS standards guidance for DCB0129 and DCB0160
   - URLs:
     - <https://standards.nhs.uk/published-standards/dcb0129-clinical-risk-management-its-application-in-the-manufacture-of-health-it-systems>
     - <https://standards.nhs.uk/published-standards/dcb0160-clinical-risk-management-its-application-in-the-deployment-and-use-of-health-it-systems>
   - Borrowed: configurable capability exposure is a clinical-safety concern and must fail closed on stale or degraded configuration.
   - Applied to: trust/publication gating, blocked-action reason classes, and recovery-only projection rules.

5. HL7 FHIR R4 Appointment and Slot
   - URLs:
     - <https://hl7.org/fhir/R4/appointment.html>
     - <https://hl7.org/fhir/R4/slot.html>
   - Borrowed: slot and appointment resources do not collapse tentative processing into durable booked truth by themselves.
   - Applied to: authoritative-read and confirmation-gate policies, especially the rule that accepted-for-processing is not equivalent to booked.

## Borrowed visual support

1. Playwright docs
   - URL: <https://playwright.dev/docs/test-assertions>
   - Borrowed: selector-driven proof and accessibility-first validation posture for the atlas.

2. Linear changelog
   - URL: <https://linear.app/changelog>
   - Borrowed: low-noise operational board treatment and compact detail inspectors.

3. Vercel Academy nested layouts and Vercel dashboard navigation
   - URLs:
     - <https://vercel.com/academy/nextjs-foundations/nested-layouts>
     - <https://vercel.com/changelog/new-dashboard-navigation-available>
   - Borrowed: stable rail-and-canvas route framing and disciplined lateral navigation.

4. IBM Carbon data-table usage
   - URL: <https://carbondesignsystem.com/components/data-table/usage/>
   - Borrowed: dense but scan-safe table structure for lower parity ledgers.

5. NHS Service Manual typography and content guidance
   - URLs:
     - <https://service-manual.nhs.uk/design-system/styles/typography>
     - <https://service-manual.nhs.uk/content>
   - Borrowed: plain language, restrained emphasis, and accessible text hierarchy.

## Rejected or constrained interpretations

1. Rejected: supplier label implies self-service capability.
   - Why: both the Phase 4 blueprint and current NHS pairing guidance leave supplier-specific capability detail to bounded onboarding packs and prerequisites.

2. Rejected: Transaction API support implies direct patient booking.
   - Why: the public interface-mechanisms guidance is explicit that Transaction API posture can depend on GP Connect or local consumer components.

3. Rejected: accepted-for-processing equals booked.
   - Why: HL7 Appointment semantics and the booking blueprint both require stronger authoritative proof.

4. Rejected: atlas visuals can add semantics not present in the contracts.
   - Why: the atlas is generated from the same tuples, bindings, and policy registries as the validator. Any extra meaning would become drift by design.
""".format(today=TODAY)


VISUAL_REFERENCE_NOTES = {
    "taskId": TASK_ID,
    "visualMode": VISUAL_MODE,
    "reviewedAt": TODAY,
    "sources": [
        {
            "name": "Playwright Test Assertions",
            "url": "https://playwright.dev/docs/test-assertions",
            "appliedTo": [
                "deterministic atlas selectors",
                "landmark and keyboard proof",
                "machine-readable parity checks",
            ],
            "borrowed": "Low-noise proof structure that treats the atlas as a real UI surface, not a static screenshot target.",
        },
        {
            "name": "Linear changelog",
            "url": "https://linear.app/changelog",
            "appliedTo": [
                "quiet operational board treatment",
                "inspector density",
                "subtle rail emphasis",
            ],
            "borrowed": "Muted chrome and high-signal data surfaces.",
        },
        {
            "name": "Vercel Academy nested layouts",
            "url": "https://vercel.com/academy/nextjs-foundations/nested-layouts",
            "appliedTo": ["left rail and inspector framing", "stable center canvas"],
            "borrowed": "Persistent shell discipline across related route slices.",
        },
        {
            "name": "Vercel dashboard navigation",
            "url": "https://vercel.com/changelog/new-dashboard-navigation-available",
            "appliedTo": ["supplier and audience rail hierarchy"],
            "borrowed": "Compact navigation that still keeps subordinate work visible.",
        },
        {
            "name": "IBM Carbon data-table usage",
            "url": "https://carbondesignsystem.com/components/data-table/usage/",
            "appliedTo": ["parity tables", "reason ledgers"],
            "borrowed": "Dense but readable data tables with restrained borders and strong headers.",
        },
        {
            "name": "NHS Service Manual typography",
            "url": "https://service-manual.nhs.uk/design-system/styles/typography",
            "appliedTo": ["type scale", "line length", "contrast discipline"],
            "borrowed": "Calm type hierarchy for clinical and patient-safe wording.",
        },
        {
            "name": "NHS Service Manual content guidance",
            "url": "https://service-manual.nhs.uk/content",
            "appliedTo": ["inspector copy", "fallback reason wording"],
            "borrowed": "Straight language with no inflated supplier or platform claims.",
        },
    ],
}


OWNER_MAP_ROWS = [
    {
        "authorityLayer": "inventory",
        "objectFamily": "ProviderCapabilityMatrix",
        "artifactPath": "data/contracts/279_provider_capability_matrix.schema.json",
        "authoritativeOwner": "Booking domain",
        "sourceOfTruth": "Static published supplier and deployment inventory row",
        "mayDecide": "Supported action scopes, capability booleans, reservation mode ceilings, authoritative-read mode ceilings",
        "mayNotDecide": "Audience-safe copy, live route actionability, ranking, fallback choice",
        "versionField": "matrixVersionRef",
        "hashField": "rowHash",
        "consumingLayer": "binding",
    },
    {
        "authorityLayer": "binding",
        "objectFamily": "BookingProviderAdapterBinding",
        "artifactPath": "data/contracts/279_booking_provider_adapter_binding.schema.json",
        "authoritativeOwner": "Booking domain",
        "sourceOfTruth": "Compiled contract from one matrix row plus one adapter profile, one degradation profile, and one confirmation policy",
        "mayDecide": "Operation contract refs, reservation semantics, authoritative read contract, translation path",
        "mayNotDecide": "Ranking, waitlist fallback choice, patient copy, UI wording",
        "versionField": "matrixVersionRef + publishedAt",
        "hashField": "bindingHash",
        "consumingLayer": "resolution",
    },
    {
        "authorityLayer": "resolution",
        "objectFamily": "BookingCapabilityResolution",
        "artifactPath": "data/contracts/279_booking_capability_resolution.schema.json",
        "authoritativeOwner": "Booking domain",
        "sourceOfTruth": "Live tuple verdict for one audience, action scope, and governing object version",
        "mayDecide": "Capability state, blocked reasons, fallback actions, allowed action scopes",
        "mayNotDecide": "Audience-safe phrasing or control layout",
        "versionField": "evaluatedAt",
        "hashField": "capabilityTupleHash",
        "consumingLayer": "projection",
    },
    {
        "authorityLayer": "projection",
        "objectFamily": "BookingCapabilityProjection",
        "artifactPath": "data/contracts/279_booking_capability_projection.schema.json",
        "authoritativeOwner": "Booking domain",
        "sourceOfTruth": "Audience-safe widening of one current resolution",
        "mayDecide": "Which already-allowed actions are exposed for patient vs staff shells and how recovery is framed",
        "mayNotDecide": "Underlying capability state or adapter choice",
        "versionField": "renderedAt",
        "hashField": "capabilityTupleHash",
        "consumingLayer": "patient and staff shells",
    },
]


TUPLE_MATRIX_ROWS: list[dict[str, object]] = []
for scenario, resolution, projection in zip(SCENARIOS, RESOLUTIONS, PROJECTIONS):
    row = MATRIX_BY_REF[scenario["providerCapabilityMatrixRef"]]
    binding = BINDING_BY_MATRIX_REF[row["providerCapabilityMatrixRef"]]
    TUPLE_MATRIX_ROWS.append(
        {
            "scenarioId": scenario["scenarioId"],
            "label": scenario["label"],
            "parityGroupId": scenario["parityGroupId"],
            "supplierRef": row["supplierRef"],
            "supplierLabel": row["supplierLabel"],
            "integrationMode": row["integrationMode"],
            "deploymentType": row["deploymentType"],
            "selectionAudience": scenario["selectionAudience"],
            "requestedActionScope": scenario["requestedActionScope"],
            "providerCapabilityMatrixRef": row["providerCapabilityMatrixRef"],
            "matrixVersionRef": row["matrixVersionRef"],
            "providerAdapterBindingRef": binding["bookingProviderAdapterBindingId"],
            "bindingHash": binding["bindingHash"],
            "adapterContractProfileRef": binding["adapterContractProfileRef"],
            "dependencyDegradationProfileRef": binding["dependencyDegradationProfileRef"],
            "authoritativeReadAndConfirmationPolicyRef": binding["authoritativeReadAndConfirmationPolicyRef"],
            "gpLinkageStatus": scenario["gpLinkageStatus"],
            "localConsumerStatus": scenario["localConsumerStatus"],
            "supplierDegradationStatus": scenario["supplierDegradationStatus"],
            "publicationState": scenario["publicationState"],
            "assuranceTrustState": scenario["assuranceTrustState"],
            "governingObjectDescriptorRef": scenario["governingObjectDescriptorRef"],
            "governingObjectRef": scenario["governingObjectRef"],
            "governingObjectVersionRef": scenario["governingObjectVersionRef"],
            "parentAnchorRef": scenario["parentAnchorRef"],
            "capabilityState": resolution["capabilityState"],
            "projectionSurfaceState": projection["surfaceState"],
            "liveControlExposure": scenario["liveControlExposure"],
            "allowedActionScopes": "; ".join(resolution["allowedActionScopes"]),
            "exposedActionScopes": "; ".join(projection["exposedActionScopes"]),
            "fallbackActionRefs": "; ".join(resolution["fallbackActionRefs"]),
            "blockedActionReasonCodes": "; ".join(resolution["blockedActionReasonCodes"]),
            "capabilityTupleHash": resolution["capabilityTupleHash"],
        }
    )


def build_provider_matrix_schema() -> dict[str, object]:
    return {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "$id": "https://vecells.local/contracts/279_provider_capability_matrix.schema.json",
        "title": "279 ProviderCapabilityMatrix inventory",
        "description": "Static booking-capability inventory. Matrix rows are published static capability ceilings and contract refs, not live route or UI authority.",
        "type": "object",
        "additionalProperties": False,
        "required": [
            "providerCapabilityMatrixId",
            "schemaVersion",
            "inventoryVersionRef",
            "ownerContext",
            "publishedAt",
            "rows",
        ],
        "properties": {
            "providerCapabilityMatrixId": ref_string("Stable matrix bundle id."),
            "schemaVersion": {"const": CONTRACT_VERSION},
            "inventoryVersionRef": ref_string("Static inventory version ref."),
            "ownerContext": {"const": "booking"},
            "publishedAt": {"type": "string", "format": "date"},
            "rows": {
                "type": "array",
                "minItems": len(MATRIX_ROWS),
                "items": {
                    "type": "object",
                    "additionalProperties": False,
                    "required": [
                        "providerCapabilityMatrixRef",
                        "matrixVersionRef",
                        "rowOwnerRef",
                        "tenantId",
                        "practiceRef",
                        "organisationRef",
                        "supplierRef",
                        "integrationMode",
                        "deploymentType",
                        "assuranceStateRef",
                        "supportedActionScopes",
                        "capabilities",
                        "manageCapabilityState",
                        "reservationMode",
                        "authoritativeReadMode",
                        "primaryDependencyDegradationProfileRef",
                        "authoritativeReadAndConfirmationPolicyRef",
                        "searchNormalizationContractRef",
                        "revalidationContractRef",
                        "manageSupportContractRef",
                        "contractState",
                        "publishedAt",
                        "rowHash",
                    ],
                    "properties": {
                        "providerCapabilityMatrixRef": ref_string("Static row id consumed by capability resolution."),
                        "matrixVersionRef": ref_string("Version ref that must supersede instead of mutating in place."),
                        "rowOwnerRef": ref_string("Explicit row ownership for controlled updates."),
                        "tenantId": ref_string("Tenant scope."),
                        "practiceRef": ref_string("Practice scope."),
                        "organisationRef": ref_string("Organisation scope."),
                        "supplierRef": ref_string("Supplier or provider family ref."),
                        "supplierLabel": ref_string("Display label for atlas and audits."),
                        "integrationMode": enum_string(INTEGRATION_MODES, "Frozen booking integration mode."),
                        "deploymentType": ref_string("Deployment or runtime shape."),
                        "assuranceStateRef": ref_string("Assurance or onboarding posture."),
                        "supportedActionScopes": {
                            "type": "array",
                            "minItems": 1,
                            "items": enum_string(ACTION_SCOPES, "Supported action scope"),
                        },
                        "capabilities": {
                            "type": "object",
                            "additionalProperties": False,
                            "required": [
                                "can_search_slots",
                                "can_book",
                                "can_cancel",
                                "can_reschedule",
                                "can_view_appointment",
                                "can_hold_slot",
                                "requires_gp_linkage_details",
                                "supports_patient_self_service",
                                "supports_staff_assisted_booking",
                                "supports_async_commit_confirmation",
                                "requires_local_consumer_component",
                            ],
                            "properties": {
                                name: {"type": "boolean", "description": f"Frozen capability field `{name}`."}
                                for name in [
                                    "can_search_slots",
                                    "can_book",
                                    "can_cancel",
                                    "can_reschedule",
                                    "can_view_appointment",
                                    "can_hold_slot",
                                    "requires_gp_linkage_details",
                                    "supports_patient_self_service",
                                    "supports_staff_assisted_booking",
                                    "supports_async_commit_confirmation",
                                    "requires_local_consumer_component",
                                ]
                            },
                        },
                        "manageCapabilityState": enum_string(
                            ["full", "partial", "summary_only", "none"],
                            "Static manage ceiling for this row.",
                        ),
                        "reservationMode": enum_string(
                            ["exclusive_hold", "truthful_nonexclusive", "degraded_manual_pending"],
                            "Reservation semantics ceiling for the row.",
                        ),
                        "authoritativeReadMode": enum_string(
                            ["durable_provider_reference", "read_after_write", "gate_required"],
                            "Authoritative confirmation proof ceiling for the row.",
                        ),
                        "primaryDependencyDegradationProfileRef": ref_string(
                            "Default degradation profile to compile into the binding."
                        ),
                        "authoritativeReadAndConfirmationPolicyRef": ref_string(
                            "Authoritative-read and confirmation-gate policy seam ref."
                        ),
                        "searchNormalizationContractRef": ref_string("Search normalization contract ref."),
                        "revalidationContractRef": ref_string("Revalidation contract ref."),
                        "manageSupportContractRef": ref_string("Manage-support contract ref."),
                        "contractState": enum_string(
                            ["draft", "active", "superseded", "withdrawn"],
                            "Published row state.",
                        ),
                        "publishedAt": {"type": "string", "format": "date"},
                        "rowHash": {
                            "type": "string",
                            "pattern": "^[a-f0-9]{64}$",
                            "description": "Lower-hex SHA-256 over the canonical row payload.",
                        },
                    },
                },
            },
        },
    }


def build_binding_schema() -> dict[str, object]:
    return {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "$id": "https://vecells.local/contracts/279_booking_provider_adapter_binding.schema.json",
        "title": "279 BookingProviderAdapterBinding",
        "description": "Canonical booking-provider binding compiled from one matrix row plus one adapter profile, one degradation profile, and one confirmation policy.",
        "type": "object",
        "additionalProperties": False,
        "required": [
            "bookingProviderAdapterBindingId",
            "providerCapabilityMatrixRef",
            "matrixVersionRef",
            "supplierRef",
            "integrationMode",
            "deploymentType",
            "actionScopeSet",
            "selectionAudienceSet",
            "adapterContractProfileRef",
            "dependencyDegradationProfileRef",
            "searchNormalizationContractRef",
            "temporalNormalizationContractRef",
            "revalidationContractRef",
            "reservationSemantics",
            "commitContractRef",
            "authoritativeReadContractRef",
            "manageSupportContractRef",
            "authoritativeReadAndConfirmationPolicyRef",
            "bindingHash",
            "bindingState",
            "bindingCompilationOwnerRule",
            "publishedAt",
        ],
        "properties": {
            "bookingProviderAdapterBindingId": ref_string("Stable compiled binding id."),
            "providerCapabilityMatrixRef": ref_string("Static matrix row id."),
            "matrixVersionRef": ref_string("Matrix version consumed by this binding."),
            "supplierRef": ref_string("Supplier ref."),
            "integrationMode": enum_string(INTEGRATION_MODES, "Integration mode."),
            "deploymentType": ref_string("Deployment type."),
            "actionScopeSet": {
                "type": "array",
                "minItems": 1,
                "items": enum_string(ACTION_SCOPES, "Compiled action scope."),
            },
            "selectionAudienceSet": {
                "type": "array",
                "minItems": 1,
                "items": enum_string(SELECTION_AUDIENCES, "Audience allowed to consume this binding."),
            },
            "adapterContractProfileRef": ref_string("Chosen AdapterContractProfile."),
            "dependencyDegradationProfileRef": ref_string("Chosen DependencyDegradationProfile."),
            "searchNormalizationContractRef": ref_string("Search-normalization contract ref."),
            "temporalNormalizationContractRef": ref_string("Temporal-normalization contract ref."),
            "revalidationContractRef": ref_string("Revalidation contract ref."),
            "reservationSemantics": enum_string(
                ["exclusive_hold", "truthful_nonexclusive", "degraded_manual_pending"],
                "Reservation semantics bound into the adapter seam.",
            ),
            "commitContractRef": ref_string("Commit contract ref."),
            "authoritativeReadContractRef": ref_string("Authoritative-read contract ref."),
            "manageSupportContractRef": ref_string("Manage-support contract ref."),
            "authoritativeReadAndConfirmationPolicyRef": ref_string(
                "Confirmation policy seam required for durable booking truth."
            ),
            "bindingHash": {
                "type": "string",
                "pattern": "^[a-f0-9]{64}$",
                "description": "Lower-hex SHA-256 over the canonical compiled binding payload.",
            },
            "bindingState": enum_string(
                ["live", "recovery_only", "blocked", "superseded"],
                "Binding posture. Only one live binding may exist for one exact tuple key.",
            ),
            "bindingCompilationOwnerRule": ref_string("Deterministic owner rule for compiler tie-breaks."),
            "publishedAt": {"type": "string", "format": "date"},
        },
    }


def build_resolution_schema() -> dict[str, object]:
    return {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "$id": "https://vecells.local/contracts/279_booking_capability_resolution.schema.json",
        "title": "279 BookingCapabilityResolution",
        "description": "Live capability tuple verdict for one audience, action scope, and governing booking or appointment context.",
        "type": "object",
        "additionalProperties": False,
        "required": [
            "bookingCapabilityResolutionId",
            "schemaVersion",
            "bookingCaseId",
            "appointmentId",
            "tenantId",
            "practiceRef",
            "organisationRef",
            "supplierRef",
            "integrationMode",
            "deploymentType",
            "selectionAudience",
            "requestedActionScope",
            "providerCapabilityMatrixRef",
            "capabilityMatrixVersionRef",
            "providerAdapterBindingRef",
            "providerAdapterBindingHash",
            "adapterContractProfileRef",
            "dependencyDegradationProfileRef",
            "authoritativeReadAndConfirmationPolicyRef",
            "gpLinkageCheckpointRef",
            "localConsumerCheckpointRef",
            "prerequisiteState",
            "routeTuple",
            "governingObjectDescriptorRef",
            "governingObjectRef",
            "governingObjectVersionRef",
            "parentAnchorRef",
            "capabilityTupleHash",
            "capabilityState",
            "allowedActionScopes",
            "blockedActionReasonCodes",
            "fallbackActionRefs",
            "evidenceRefs",
            "evaluatedAt",
            "expiresAt",
        ],
        "properties": {
            "bookingCapabilityResolutionId": ref_string("Stable capability-resolution id."),
            "schemaVersion": {"const": CONTRACT_VERSION},
            "bookingCaseId": ref_string("BookingCase ref if the governing object is a case.", nullable=True),
            "appointmentId": ref_string("Appointment ref if the governing object is an appointment.", nullable=True),
            "tenantId": ref_string("Tenant scope."),
            "practiceRef": ref_string("Practice scope."),
            "organisationRef": ref_string("Organisation scope."),
            "supplierRef": ref_string("Supplier scope."),
            "integrationMode": enum_string(INTEGRATION_MODES, "Resolved integration mode."),
            "deploymentType": ref_string("Resolved deployment type."),
            "selectionAudience": enum_string(SELECTION_AUDIENCES, "Audience requesting actionability."),
            "requestedActionScope": enum_string(ACTION_SCOPES, "Requested action scope."),
            "providerCapabilityMatrixRef": ref_string("Matrix row ref."),
            "capabilityMatrixVersionRef": ref_string("Matrix version ref."),
            "providerAdapterBindingRef": ref_string("Chosen binding ref."),
            "providerAdapterBindingHash": {
                "type": "string",
                "pattern": "^[a-f0-9]{64}$",
                "description": "Current compiled binding hash.",
            },
            "adapterContractProfileRef": ref_string("Chosen AdapterContractProfile."),
            "dependencyDegradationProfileRef": ref_string("Chosen DependencyDegradationProfile."),
            "authoritativeReadAndConfirmationPolicyRef": ref_string(
                "Chosen authoritative-read and confirmation policy."
            ),
            "gpLinkageCheckpointRef": ref_string("Optional GP linkage checkpoint ref.", nullable=True),
            "localConsumerCheckpointRef": ref_string("Optional local consumer checkpoint ref.", nullable=True),
            "prerequisiteState": {
                "type": "object",
                "additionalProperties": False,
                "required": [
                    "gpLinkageStatus",
                    "localConsumerStatus",
                    "supplierDegradationStatus",
                    "publicationState",
                    "assuranceTrustState",
                ],
                "properties": {
                    "gpLinkageStatus": enum_string(
                        ["linked", "missing", "not_required"],
                        "Resolved GP-linkage prerequisite status.",
                    ),
                    "localConsumerStatus": enum_string(
                        ["ready", "missing", "not_required"],
                        "Resolved local-component prerequisite status.",
                    ),
                    "supplierDegradationStatus": enum_string(
                        ["nominal", "degraded_manual"],
                        "Supplier degradation posture.",
                    ),
                    "publicationState": enum_string(
                        ["published", "frozen", "withdrawn"],
                        "Published route or release posture.",
                    ),
                    "assuranceTrustState": enum_string(
                        ["writable", "read_only", "blocked"],
                        "Assurance or trust posture.",
                    ),
                },
            },
            "routeTuple": {
                "type": "object",
                "additionalProperties": False,
                "required": [
                    "routeIntentBindingRef",
                    "surfaceRouteContractRef",
                    "surfacePublicationRef",
                    "runtimePublicationBundleRef",
                    "routeTupleHash",
                ],
                "properties": {
                    "routeIntentBindingRef": ref_string("Route-intent binding ref."),
                    "surfaceRouteContractRef": ref_string("AudienceSurfaceRouteContract ref."),
                    "surfacePublicationRef": ref_string("SurfacePublication ref."),
                    "runtimePublicationBundleRef": ref_string("RuntimePublicationBundle ref."),
                    "routeTupleHash": {
                        "type": "string",
                        "pattern": "^[a-f0-9]{64}$",
                        "description": "Lower-hex SHA-256 of the canonical route tuple.",
                    },
                },
            },
            "governingObjectDescriptorRef": ref_string("Canonical governing object descriptor."),
            "governingObjectRef": ref_string("Current governing object ref."),
            "governingObjectVersionRef": ref_string("Current governing object version ref."),
            "parentAnchorRef": ref_string("Selected anchor or parent shell anchor ref."),
            "capabilityTupleHash": {
                "type": "string",
                "pattern": "^[a-f0-9]{64}$",
                "description": "Lower-hex SHA-256 over the ordered capability tuple fields.",
            },
            "capabilityState": enum_string(CAPABILITY_STATES, "Resolved capability state."),
            "allowedActionScopes": {
                "type": "array",
                "items": enum_string(ACTION_SCOPES, "Allowed action scope"),
            },
            "blockedActionReasonCodes": {
                "type": "array",
                "items": enum_string(list(BLOCKED_REASON_CODES.keys()), "Blocked-action reason code"),
            },
            "fallbackActionRefs": {
                "type": "array",
                "items": enum_string(list(FALLBACK_ACTIONS.keys()), "Fallback action ref"),
            },
            "evidenceRefs": {"type": "array", "items": {"type": "string"}},
            "evaluatedAt": {"type": "string", "format": "date-time"},
            "expiresAt": {"type": "string", "format": "date-time"},
            "x-capabilityTupleHashInputOrder": {
                "type": "array",
                "items": {"type": "string"},
                "description": "Canonical field order that must be hashed using normalized JSON and SHA-256 lower hex.",
            },
        },
    }


def build_projection_schema() -> dict[str, object]:
    return {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "$id": "https://vecells.local/contracts/279_booking_capability_projection.schema.json",
        "title": "279 BookingCapabilityProjection",
        "description": "Audience-safe widening of one current BookingCapabilityResolution. Patient and staff surfaces consume this projection instead of re-running capability logic locally.",
        "type": "object",
        "additionalProperties": False,
        "required": [
            "bookingCapabilityProjectionId",
            "schemaVersion",
            "bookingCaseId",
            "appointmentId",
            "bookingCapabilityResolutionRef",
            "selectionAudience",
            "requestedActionScope",
            "providerAdapterBindingRef",
            "capabilityTupleHash",
            "surfaceState",
            "dominantCapabilityCueCode",
            "controlState",
            "selfServiceActionRefs",
            "assistedActionRefs",
            "manageActionRefs",
            "fallbackActionRefs",
            "blockedActionReasonCodes",
            "exposedActionScopes",
            "parityGroupId",
            "underlyingCapabilityState",
            "renderedAt",
        ],
        "properties": {
            "bookingCapabilityProjectionId": ref_string("Stable projection id."),
            "schemaVersion": {"const": CONTRACT_VERSION},
            "bookingCaseId": ref_string("BookingCase ref if applicable.", nullable=True),
            "appointmentId": ref_string("Appointment ref if applicable.", nullable=True),
            "bookingCapabilityResolutionRef": ref_string("Resolution ref that owns this projection."),
            "selectionAudience": enum_string(SELECTION_AUDIENCES, "Audience consuming the projection."),
            "requestedActionScope": enum_string(ACTION_SCOPES, "Requested action scope."),
            "providerAdapterBindingRef": ref_string("Binding ref copied from the owning resolution."),
            "capabilityTupleHash": {
                "type": "string",
                "pattern": "^[a-f0-9]{64}$",
                "description": "Capability tuple hash copied from the owning resolution.",
            },
            "surfaceState": enum_string(PROJECTION_SURFACE_STATES, "Audience-safe surface posture."),
            "dominantCapabilityCueCode": ref_string("Dominant cue code for shell rendering."),
            "controlState": enum_string(
                ["writable", "read_only", "blocked"],
                "Live control posture for the shell.",
            ),
            "selfServiceActionRefs": {
                "type": "array",
                "items": enum_string(ACTION_SCOPES, "Patient-exposed action ref"),
            },
            "assistedActionRefs": {
                "type": "array",
                "items": enum_string(ACTION_SCOPES, "Staff-assisted action ref"),
            },
            "manageActionRefs": {
                "type": "array",
                "items": enum_string(ACTION_SCOPES, "Manage action ref"),
            },
            "fallbackActionRefs": {
                "type": "array",
                "items": enum_string(list(FALLBACK_ACTIONS.keys()), "Fallback action ref"),
            },
            "blockedActionReasonCodes": {
                "type": "array",
                "items": enum_string(list(BLOCKED_REASON_CODES.keys()), "Blocked reason code"),
            },
            "exposedActionScopes": {
                "type": "array",
                "items": enum_string(ACTION_SCOPES, "Actually exposed action scope"),
            },
            "parityGroupId": ref_string("Group used to prove patient/staff parity from the same underlying tuple family."),
            "underlyingCapabilityState": enum_string(CAPABILITY_STATES, "Underlying resolution capability state."),
            "renderedAt": {"type": "string", "format": "date-time"},
        },
    }


def build_inventory_bundle() -> dict[str, object]:
    return {
        "providerCapabilityMatrixId": "PCM_BUNDLE_279_PHASE4",
        "schemaVersion": CONTRACT_VERSION,
        "inventoryVersionRef": "279.provider-capability-inventory.v1",
        "ownerContext": "booking",
        "publishedAt": TODAY,
        "rows": MATRIX_ROWS,
    }


def build_registry_payload(registry_id: str, version_ref: str, label: str, items_key: str, items: list[dict[str, object]]) -> dict[str, object]:
    return {
        "taskId": TASK_ID,
        "contractVersion": CONTRACT_VERSION,
        "registryId": registry_id,
        "versionRef": version_ref,
        "label": label,
        "publishedAt": TODAY,
        items_key: items,
    }


def build_docs() -> tuple[str, str, str]:
    matrix_rows = [
        [
            row["supplierLabel"],
            row["integrationMode"],
            row["deploymentType"],
            ", ".join(scope for scope in row["supportedActionScopes"][:4]) + (" ..." if len(row["supportedActionScopes"]) > 4 else ""),
            row["primaryDependencyDegradationProfileRef"],
            row["authoritativeReadAndConfirmationPolicyRef"],
        ]
        for row in MATRIX_ROWS
    ]
    binding_rows = [
        [
            binding["bookingProviderAdapterBindingId"],
            binding["providerCapabilityMatrixRef"],
            binding["adapterContractProfileRef"],
            binding["dependencyDegradationProfileRef"],
            binding["authoritativeReadAndConfirmationPolicyRef"],
            binding["bindingState"],
        ]
        for binding in BINDINGS
    ]
    state_rows = [
        [
            state,
            next(
                (
                    profile["dependencyDegradationProfileId"]
                    for profile in DEGRADATION_PROFILES
                    if profile["dominantCapabilityState"] == state
                ),
                "n/a",
            ),
            {
                "live_self_service": "patient self-service live",
                "live_staff_assist": "staff-assisted live",
                "assisted_only": "patient anchor preserved, assisted path promoted",
                "linkage_required": "same-shell linkage repair",
                "local_component_required": "same-shell component launch",
                "degraded_manual": "manual or hub fallback",
                "recovery_only": "read-only recovery in place",
                "blocked": "summary only and explicit blocked reasons",
            }[state],
        ]
        for state in CAPABILITY_STATES
    ]

    architecture_doc = f"""# 279 Phase 4 provider capability matrix and adapter seam

This pack freezes the distinction between inventory, binding, resolution, and projection for Booking Phase 4.

- `ProviderCapabilityMatrix` is the static published capability inventory.
- `BookingProviderAdapterBinding` is the only legal compiled adapter seam for one current matrix row.
- `BookingCapabilityResolution` is the live tuple verdict for one audience, one action scope, and one governing object version.
- `BookingCapabilityProjection` is the audience-safe widening of one current resolution.

Those four authorities are intentionally separate. Later work may not collapse them into supplier labels, route-local booleans, or appointment-status shortcuts.

## Static inventory

{md_table(
    ["Supplier", "Mode", "Deployment", "Sample scopes", "Primary degradation", "Confirmation policy"],
    matrix_rows,
)}

The matrix is static. It publishes the booking ceiling for one supplier, integration mode, deployment type, practice context, and assurance posture. It is not itself the UI or mutation authority.

## Deterministic binding compilation

The binding compiler is frozen to this order:

1. resolve one exact active matrix row by `tenantId`, `practiceRef`, `supplierRef`, `integrationMode`, and `deploymentType`
2. verify that the requested `actionScope` belongs to that row
3. compile exactly one binding using the row's `primaryDependencyDegradationProfileRef`, the integration-mode-specific `AdapterContractProfile`, and the row's `authoritativeReadAndConfirmationPolicyRef`
4. hash the canonical compiled binding payload to `bindingHash`
5. reject the tuple if more than one live binding could exist for the same exact key without a more specific owner rule

{md_table(
    ["Binding", "Matrix row", "Adapter profile", "Degradation profile", "Confirmation policy", "State"],
    binding_rows,
)}

`BookingProviderAdapterBinding` remains translation-only. It may own search syntax, temporal normalization, revalidation, commit dispatch, authoritative read-after-write proof, and manage support. It may not own ranking, fallback choice, or patient-visible meaning.

## Capability tuple and drift rules

The canonical tuple binds:

- tenant, practice, organisation, supplier
- integration mode and deployment type
- audience plus requested `actionScope`
- `providerCapabilityMatrixRef` and version
- `providerAdapterBindingRef`, `providerAdapterBindingHash`, and `adapterContractProfileRef`
- GP-linkage and local-consumer checkpoints
- trust, publication, and route tuple
- governing object, governing-object version, and parent anchor

`capabilityTupleHash` is lower-hex SHA-256 over canonical JSON using the ordered field list published in the resolution schema. Any change in supplier state, matrix version, trust posture, publication posture, route tuple, or governing-object version supersedes stale capability.

## Capability states

{md_table(["Capability state", "Primary recovery profile", "Required shell behaviour"], state_rows)}

## Confirmation and authoritative-read law

The confirmation registry freezes one policy seam per binding:

- `durable_provider_reference` means the supplier has produced durable authoritative proof
- `read_after_write` means booking truth must be proven through immediate authoritative follow-up, not optimistic acknowledgement
- `gate_required` means weak processing acceptance is never enough by itself; the branch remains pending or gate-bound

Accepted-for-processing is not booked truth. This pack closes that gap explicitly.

## Support references

Current NHS, HL7, and frontend-reference review notes are recorded in:

- [279 external reference notes]({repo_path("data/analysis/279_external_reference_notes.md")})
- [279 visual reference notes]({repo_path("data/analysis/279_visual_reference_notes.json")})

The local blueprint remained authoritative wherever support sources were broader than the repo's control law.

## Typed gaps

Typed later-owned gaps are published in [279 capability gap log]({repo_path("data/analysis/279_capability_gap_log.json")}).
"""

    api_doc = f"""# 279 Phase 4 booking capability resolution contract

This contract defines how patient and staff booking surfaces must consume one current capability verdict.

## Contract split

1. `ProviderCapabilityMatrix`: static inventory only
2. `BookingProviderAdapterBinding`: one compiled adapter seam
3. `BookingCapabilityResolution`: live tuple verdict
4. `BookingCapabilityProjection`: audience-safe actionability

Patient and staff shells must render actionability only from `BookingCapabilityProjection`. Supplier names, remembered slot state, appointment status, or copied feature flags may not keep controls armed.

## Mandatory tuple fields

- `tenantId`
- `practiceRef`
- `organisationRef`
- `supplierRef`
- `integrationMode`
- `deploymentType`
- `selectionAudience`
- `requestedActionScope`
- `providerCapabilityMatrixRef`
- `capabilityMatrixVersionRef`
- `providerAdapterBindingRef`
- `providerAdapterBindingHash`
- `adapterContractProfileRef`
- `gpLinkageCheckpointRef`
- `localConsumerCheckpointRef`
- `routeTuple.*`
- `governingObjectDescriptorRef`
- `governingObjectRef`
- `governingObjectVersionRef`
- `parentAnchorRef`
- `capabilityTupleHash`

## Projection rules

- patient and staff projections are allowed to differ only by audience-safe action exposure
- they may not disagree on matrix row, binding, policy seam, or tuple hash
- patient controls may be live only when the underlying resolution is `live_self_service`
- staff controls may widen to `live_staff_assist`, but that does not upgrade patient posture
- `assisted_only`, `linkage_required`, and `local_component_required` must preserve the selected anchor and promote the declared fallback instead of a generic failure view
- `recovery_only` resolves to projection `surfaceState = recovery_required`

## Blocked and fallback classes

Blocked-action reason codes and fallback actions are machine-readable in the resolution and projection schemas. Unsupported or drifted paths therefore degrade intentionally rather than disappearing accidentally.

## One current authoritative seam

The resolution must point at:

- one `providerCapabilityMatrixRef`
- one `providerAdapterBindingRef`
- one `adapterContractProfileRef`
- one `dependencyDegradationProfileRef`
- one `authoritativeReadAndConfirmationPolicyRef`

If any of those refs drift, the capability tuple is stale.

## Confirmation gate requirements

Async or dispute-capable paths must always name a confirmation policy. Missing policy seams are invalid by contract.
"""

    security_doc = f"""# 279 Phase 4 capability tuple trust and confirmation gate rules

This pack freezes the fail-closed behaviour for booking capability.

## Trust and publication prerequisites

Dynamic resolution must evaluate at minimum:

- GP-linkage status
- required local-consumer state
- supplier degradation
- runtime publication posture
- assurance-slice trust posture
- route-intent tuple freshness
- governing-object version freshness

If those prerequisites drift, capability cannot survive on cache or route memory. The tuple must supersede.

## Confirmation gate rules

- accepted-for-processing is never equivalent to booked
- weak supplier acknowledgement must remain pending, disputed, or gate-bound until the declared confirmation policy allows durable truth
- a binding without an authoritative-read or confirmation policy is invalid when the path supports async confirmation or dispute recovery

## Least-privilege configuration

- matrix rows are static published inventory
- bindings compile exact operation contracts but may not own business meaning
- resolution owns live capability meaning
- projection owns audience-safe exposure only

This keeps adapter code from reintroducing ranking ownership, patient copy ownership, or silent self-service widening.

## Required recovery modes

- `linkage_required`: preserve anchor, route to linkage repair
- `local_component_required`: preserve anchor, route to component launch
- `degraded_manual`: freeze writable control and promote manual fallback
- `recovery_only`: preserve last safe summary and apply bounded read-only recovery
- `blocked`: hide unsupported mutation and explain the blocked reason class

## Source alignment

These rules are grounded in the local blueprint and supported by the NHS IM1, GP Connect, DCB0129, DCB0160, and HL7 sources recorded in the 279 analysis notes.
"""
    return architecture_doc, api_doc, security_doc


def atlas_html() -> str:
    parity_groups: dict[str, list[dict[str, object]]] = {}
    for projection in PROJECTIONS:
        parity_groups.setdefault(projection["parityGroupId"], []).append(projection)

    atlas_payload = {
        "taskId": TASK_ID,
        "visualMode": VISUAL_MODE,
        "contractVersion": CONTRACT_VERSION,
        "integrationModes": INTEGRATION_MODES,
        "audiences": SELECTION_AUDIENCES,
        "actionScopes": ACTION_SCOPES,
        "blockedReasonCatalog": BLOCKED_REASON_CODES,
        "fallbackActionCatalog": FALLBACK_ACTIONS,
        "matrixRows": MATRIX_ROWS,
        "bindings": BINDINGS,
        "policies": CONFIRMATION_POLICIES,
        "resolutions": RESOLUTIONS,
        "projections": PROJECTIONS,
        "scenarios": SCENARIOS,
        "parityGroups": parity_groups,
        "ownerMap": OWNER_MAP_ROWS,
        "tupleMatrix": TUPLE_MATRIX_ROWS,
    }
    escaped_payload = html.escape(json.dumps(atlas_payload, separators=(",", ":")))

    return """<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>279 Booking Capability Atlas</title>
    <style>
      :root {
        color-scheme: light;
        --canvas: #f7f8fa;
        --shell: #eef2f6;
        --panel: #ffffff;
        --inset: #e8eef3;
        --text-strong: #0f1720;
        --text: #24313d;
        --text-muted: #5e6b78;
        --accent-capability: #3158e0;
        --accent-assist: #0f766e;
        --accent-degraded: #b7791f;
        --accent-blocked: #b42318;
        --line: #d7e0e8;
        --radius: 8px;
        --shadow: 0 18px 40px rgba(15, 23, 32, 0.08);
        --transition: 160ms ease;
        font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }

      @media (prefers-reduced-motion: reduce) {
        :root {
          --transition: 0ms linear;
        }
      }

      * {
        box-sizing: border-box;
      }

      body {
        margin: 0;
        background: var(--canvas);
        color: var(--text);
      }

      .page {
        min-height: 100vh;
        padding: 20px;
      }

      .atlas {
        max-width: 1680px;
        margin: 0 auto;
        background: var(--shell);
        border: 1px solid var(--line);
        border-radius: 10px;
        box-shadow: var(--shadow);
        overflow: hidden;
      }

      .skip-link {
        position: absolute;
        left: 12px;
        top: -44px;
        background: var(--text-strong);
        color: white;
        padding: 10px 12px;
        border-radius: 6px;
        z-index: 10;
      }

      .skip-link:focus {
        top: 12px;
      }

      .masthead {
        min-height: 72px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
        padding: 18px 24px;
        background: linear-gradient(180deg, rgba(255, 255, 255, 0.9), rgba(255, 255, 255, 0.82));
        border-bottom: 1px solid var(--line);
      }

      .brand {
        display: flex;
        align-items: center;
        gap: 14px;
        min-width: 0;
      }

      .brand-mark {
        width: 30px;
        height: 30px;
        flex: 0 0 auto;
      }

      .brand-copy h1 {
        margin: 0;
        font-size: 20px;
        line-height: 1.2;
        color: var(--text-strong);
      }

      .brand-copy p {
        margin: 4px 0 0;
        font-size: 13px;
        color: var(--text-muted);
      }

      .masthead-meta {
        display: flex;
        flex-wrap: wrap;
        justify-content: flex-end;
        gap: 8px;
      }

      .pill {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 7px 10px;
        border-radius: 999px;
        background: var(--inset);
        color: var(--text);
        font-size: 12px;
        border: 1px solid transparent;
      }

      .layout {
        display: grid;
        grid-template-columns: 300px minmax(0, 1fr) 420px;
        min-height: 860px;
      }

      .rail,
      .inspector,
      .canvas {
        min-width: 0;
      }

      .rail,
      .inspector {
        background: rgba(255, 255, 255, 0.82);
      }

      .rail {
        border-right: 1px solid var(--line);
        padding: 20px;
      }

      .canvas {
        padding: 20px;
      }

      .inspector {
        border-left: 1px solid var(--line);
        padding: 20px;
      }

      .section-title {
        margin: 0 0 12px;
        font-size: 12px;
        font-weight: 700;
        letter-spacing: 0.04em;
        text-transform: uppercase;
        color: var(--text-muted);
      }

      .button-grid {
        display: grid;
        gap: 8px;
      }

      .rail-button {
        width: 100%;
        text-align: left;
        padding: 12px 13px;
        border-radius: 8px;
        border: 1px solid var(--line);
        background: var(--panel);
        color: var(--text);
        font: inherit;
        cursor: pointer;
        transition: background var(--transition), border-color var(--transition), color var(--transition), box-shadow var(--transition);
      }

      .rail-button:hover,
      .rail-button:focus-visible {
        border-color: var(--accent-capability);
        box-shadow: 0 0 0 3px rgba(49, 88, 224, 0.12);
        outline: none;
      }

      .rail-button[data-active="true"] {
        border-color: var(--accent-capability);
        background: rgba(49, 88, 224, 0.08);
        color: var(--text-strong);
      }

      .rail-button strong,
      .rail-button span {
        display: block;
      }

      .rail-button span {
        margin-top: 2px;
        font-size: 12px;
        color: var(--text-muted);
      }

      .panel-grid {
        display: grid;
        gap: 16px;
      }

      .card {
        background: var(--panel);
        border: 1px solid var(--line);
        border-radius: var(--radius);
        padding: 16px;
        min-width: 0;
      }

      .card h2,
      .card h3 {
        margin: 0 0 8px;
        font-size: 16px;
        color: var(--text-strong);
      }

      .card p,
      .card li {
        color: var(--text);
        font-size: 13px;
        line-height: 1.5;
      }

      .muted {
        color: var(--text-muted);
      }

      .canvas-grid {
        display: grid;
        gap: 16px;
      }

      .diagram-grid {
        display: grid;
        gap: 12px;
        grid-template-columns: minmax(0, 1fr) minmax(280px, 380px);
        align-items: start;
      }

      .tuple-braid {
        display: grid;
        gap: 8px;
      }

      .tuple-node {
        display: grid;
        gap: 3px;
        padding: 10px 12px;
        border: 1px solid var(--line);
        border-radius: 8px;
        background: linear-gradient(180deg, rgba(255,255,255,0.98), rgba(232,238,243,0.88));
      }

      .tuple-node code {
        font-size: 12px;
        color: var(--text-muted);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .ladder {
        display: grid;
        gap: 10px;
      }

      .ladder-step {
        display: grid;
        gap: 6px;
        padding: 12px;
        border-left: 4px solid var(--accent-capability);
        background: rgba(232, 238, 243, 0.75);
        border-radius: 6px;
      }

      .ladder-step[data-tone="assist"] {
        border-left-color: var(--accent-assist);
      }

      .ladder-step[data-tone="degraded"] {
        border-left-color: var(--accent-degraded);
      }

      .ladder-step[data-tone="blocked"] {
        border-left-color: var(--accent-blocked);
      }

      .projection-strip,
      .confirmation-strip {
        display: grid;
        gap: 10px;
      }

      .projection-map {
        display: grid;
        gap: 10px;
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }

      .projection-card,
      .confirmation-step {
        padding: 12px;
        border: 1px solid var(--line);
        border-radius: 8px;
        background: var(--panel);
      }

      .confirmation-step.active {
        border-color: var(--accent-capability);
        background: rgba(49, 88, 224, 0.08);
      }

      table {
        width: 100%;
        border-collapse: collapse;
        font-size: 12px;
      }

      th,
      td {
        padding: 8px 10px;
        border-bottom: 1px solid var(--line);
        text-align: left;
        vertical-align: top;
        word-break: break-word;
      }

      th {
        color: var(--text-muted);
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        font-size: 11px;
      }

      tbody tr:last-child td {
        border-bottom: none;
      }

      .status-chip {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 6px 9px;
        border-radius: 999px;
        font-size: 12px;
        font-weight: 600;
        background: rgba(49, 88, 224, 0.08);
        color: var(--accent-capability);
      }

      .status-chip[data-tone="assist"] {
        background: rgba(15, 118, 110, 0.1);
        color: var(--accent-assist);
      }

      .status-chip[data-tone="degraded"] {
        background: rgba(183, 121, 31, 0.14);
        color: var(--accent-degraded);
      }

      .status-chip[data-tone="blocked"] {
        background: rgba(180, 35, 24, 0.1);
        color: var(--accent-blocked);
      }

      .lower-grid {
        display: grid;
        gap: 16px;
        grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
      }

      .hash-box {
        padding: 10px 12px;
        border-radius: 8px;
        background: var(--inset);
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace;
        font-size: 11px;
        line-height: 1.4;
        color: var(--text-strong);
        overflow-wrap: anywhere;
      }

      .inspector dl {
        display: grid;
        gap: 10px;
        margin: 0;
      }

      .inspector dt {
        font-size: 11px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        color: var(--text-muted);
      }

      .inspector dd {
        margin: 4px 0 0;
        font-size: 13px;
        color: var(--text);
        overflow-wrap: anywhere;
      }

      @media (max-width: 1280px) {
        .layout {
          grid-template-columns: 280px minmax(0, 1fr);
        }

        .inspector {
          grid-column: 1 / -1;
          border-left: none;
          border-top: 1px solid var(--line);
        }
      }

      @media (max-width: 960px) {
        .page {
          padding: 12px;
        }

        .layout {
          grid-template-columns: 1fr;
        }

        .rail,
        .canvas,
        .inspector {
          border: none;
          padding: 14px;
        }

        .diagram-grid,
        .projection-map,
        .lower-grid {
          grid-template-columns: 1fr;
        }

        .masthead {
          align-items: flex-start;
          flex-direction: column;
        }
      }
    </style>
  </head>
  <body>
    <a class="skip-link" href="#atlas-main">Skip to capability atlas</a>
    <div class="page">
      <main
        id="atlas-main"
        class="atlas"
        data-testid="BookingCapabilityAtlas"
        data-visual-mode="Booking_Capability_Atlas"
        data-active-scenario=""
        data-active-capability-state=""
        data-active-surface-state=""
        data-reduced-motion="false"
      >
        <header class="masthead" data-testid="CapabilityAtlasMasthead">
          <div class="brand">
            <svg class="brand-mark" viewBox="0 0 48 48" fill="none" aria-hidden="true">
              <rect x="4" y="4" width="40" height="40" rx="12" fill="#E8EEF3" />
              <path d="M13 17h10l6 6h6" stroke="#3158E0" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
              <path d="M13 31h10l6-6h6" stroke="#0F766E" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
              <circle cx="13" cy="17" r="3" fill="#3158E0" />
              <circle cx="13" cy="31" r="3" fill="#0F766E" />
              <circle cx="35" cy="23.5" r="3" fill="#B7791F" />
            </svg>
            <div class="brand-copy">
              <h1>Vecells Booking Capability Atlas</h1>
              <p>Booking_Capability_Atlas. Quiet, exact capability control across matrix, binding, projection, and confirmation gate truth.</p>
            </div>
          </div>
          <div class="masthead-meta" aria-label="Atlas metadata">
            <span class="pill">task 279</span>
            <span class="pill">contract """ + CONTRACT_VERSION + """</span>
            <span class="pill">one capability tuple hash</span>
            <span class="pill">no supplier-name heuristics</span>
          </div>
        </header>
        <div class="layout">
          <aside class="rail" aria-label="Supplier and audience rail">
            <section data-testid="SupplierRail">
              <h2 class="section-title">Suppliers</h2>
              <div class="button-grid" id="supplier-buttons"></div>
            </section>
            <section data-testid="ModeRail" style="margin-top: 18px;">
              <h2 class="section-title">Modes</h2>
              <div class="button-grid" id="mode-buttons"></div>
            </section>
            <section data-testid="AudienceRail" style="margin-top: 18px;">
              <h2 class="section-title">Audience</h2>
              <div class="button-grid" id="audience-buttons"></div>
            </section>
            <section data-testid="ActionScopeRail" style="margin-top: 18px;">
              <h2 class="section-title">Action Scope</h2>
              <div class="button-grid" id="action-buttons"></div>
            </section>
          </aside>
          <section class="canvas" aria-label="Capability matrix canvas">
            <div class="canvas-grid">
              <article class="card" data-testid="CapabilityMatrixCanvas">
                <h2>Capability matrix row</h2>
                <p class="muted">Static inventory decides the ceiling. It does not decide live UI by itself.</p>
                <div class="diagram-grid">
                  <div id="matrix-summary"></div>
                  <div>
                    <table data-testid="CapabilityMatrixTable">
                      <thead>
                        <tr><th>Field</th><th>Value</th></tr>
                      </thead>
                      <tbody id="matrix-table-body"></tbody>
                    </table>
                  </div>
                </div>
              </article>

              <article class="card" data-testid="BindingLadderRegion">
                <h2>Matrix to binding ladder</h2>
                <p class="muted">One row compiles to one current binding, one degradation profile, and one confirmation policy.</p>
                <div class="diagram-grid">
                  <div class="ladder" id="binding-ladder"></div>
                  <div>
                    <table data-testid="BindingLadderTable">
                      <thead>
                        <tr><th>Layer</th><th>Ref</th></tr>
                      </thead>
                      <tbody id="binding-table-body"></tbody>
                    </table>
                  </div>
                </div>
              </article>

              <article class="card" data-testid="TupleBraidRegion">
                <h2>Capability tuple braid</h2>
                <p class="muted">Hashable fields that must stay aligned or capability becomes stale.</p>
                <div class="diagram-grid">
                  <div class="tuple-braid" id="tuple-braid"></div>
                  <div>
                    <table data-testid="TupleBraidTable">
                      <thead>
                        <tr><th>Tuple field</th><th>Current value</th></tr>
                      </thead>
                      <tbody id="tuple-table-body"></tbody>
                    </table>
                  </div>
                </div>
              </article>

              <article class="card" data-testid="AudienceProjectionMapRegion">
                <h2>Audience projection map</h2>
                <p class="muted">Patient and staff surfaces consume one capability family in different lawful forms.</p>
                <div class="diagram-grid">
                  <div class="projection-map" id="projection-map"></div>
                  <div>
                    <table data-testid="AudienceProjectionTable">
                      <thead>
                        <tr><th>Audience</th><th>Surface state</th><th>Exposed actions</th></tr>
                      </thead>
                      <tbody id="projection-table-body"></tbody>
                    </table>
                  </div>
                </div>
              </article>

              <article class="card" data-testid="ConfirmationGateStripRegion">
                <h2>Confirmation-gate strip</h2>
                <p class="muted">Accepted-for-processing is not booked. The current policy decides pending, disputed, and durable truth.</p>
                <div class="diagram-grid">
                  <div class="confirmation-strip" id="confirmation-strip"></div>
                  <div>
                    <table data-testid="ConfirmationGateTable">
                      <thead>
                        <tr><th>Truth class</th><th>Contract meaning</th></tr>
                      </thead>
                      <tbody id="confirmation-table-body"></tbody>
                    </table>
                  </div>
                </div>
              </article>

              <div class="lower-grid">
                <article class="card">
                  <h2>Authority owner ledger</h2>
                  <table data-testid="OwnerLedgerTable">
                    <thead>
                      <tr><th>Layer</th><th>Object</th><th>May decide</th><th>May not decide</th></tr>
                    </thead>
                    <tbody id="owner-ledger-body"></tbody>
                  </table>
                </article>
                <article class="card">
                  <h2>Reason ledger</h2>
                  <table data-testid="ReasonLedgerTable">
                    <thead>
                      <tr><th>Code</th><th>Class</th><th>Summary</th></tr>
                    </thead>
                    <tbody id="reason-ledger-body"></tbody>
                  </table>
                </article>
              </div>
            </div>
          </section>
          <aside class="inspector" data-testid="CapabilityInspector" aria-label="Capability inspector">
            <h2 class="section-title">Inspector</h2>
            <div class="panel-grid">
              <article class="card">
                <h3 id="inspector-title">Scenario</h3>
                <span class="status-chip" id="capability-state-chip">state</span>
                <span class="status-chip" id="projection-state-chip" data-tone="assist" style="margin-left: 8px;">surface</span>
                <p id="inspector-summary" class="muted"></p>
              </article>
              <article class="card">
                <h3>Tuple hashes</h3>
                <div class="hash-box" id="binding-hash-box"></div>
                <div class="hash-box" id="tuple-hash-box" style="margin-top: 10px;"></div>
              </article>
              <article class="card">
                <h3>Current tuple</h3>
                <dl id="inspector-dl"></dl>
              </article>
              <article class="card">
                <h3>Fallback and blocked reasons</h3>
                <ul id="fallback-list"></ul>
                <ul id="blocked-list"></ul>
              </article>
            </div>
          </aside>
        </div>
      </main>
    </div>
    <script id="atlas-data" type="application/json">__ATLAS_DATA__</script>
    <script>
      const script = document.querySelector("#atlas-data");
      const decoder = document.createElement("textarea");
      decoder.innerHTML = script.textContent;
      const atlasData = JSON.parse(decoder.value);

      const root = document.querySelector("[data-testid='BookingCapabilityAtlas']");
      root.dataset.reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "true" : "false";

      const state = {
        supplierRef: atlasData.matrixRows[0].supplierRef,
        integrationMode: atlasData.matrixRows[0].integrationMode,
        selectionAudience: "patient",
        requestedActionScope: atlasData.scenarios[0].requestedActionScope
      };

      const reasonCatalog = atlasData.blockedReasonCatalog;
      const fallbackCatalog = atlasData.fallbackActionCatalog;

      function toneForCapability(capabilityState) {
        if (capabilityState === "blocked") return "blocked";
        if (capabilityState === "degraded_manual" || capabilityState === "recovery_only" || capabilityState === "local_component_required") return "degraded";
        if (capabilityState === "live_staff_assist" || capabilityState === "assisted_only") return "assist";
        return "default";
      }

      function parityRowsFor(parityGroupId) {
        return atlasData.scenarios.filter((scenario) => scenario.parityGroupId === parityGroupId);
      }

      function findScenario() {
        const exact = atlasData.scenarios.find((scenario) =>
          scenario.selectionAudience === state.selectionAudience &&
          scenario.requestedActionScope === state.requestedActionScope &&
          atlasData.matrixRows.find((row) =>
            row.providerCapabilityMatrixRef === scenario.providerCapabilityMatrixRef &&
            row.supplierRef === state.supplierRef &&
            row.integrationMode === state.integrationMode
          )
        );
        if (exact) return exact;
        const bySupplierAudience = atlasData.scenarios.find((scenario) =>
          scenario.selectionAudience === state.selectionAudience &&
          atlasData.matrixRows.find((row) =>
            row.providerCapabilityMatrixRef === scenario.providerCapabilityMatrixRef &&
            row.supplierRef === state.supplierRef &&
            row.integrationMode === state.integrationMode
          )
        );
        if (bySupplierAudience) return bySupplierAudience;
        return atlasData.scenarios[0];
      }

      function buttonHtml(id, label, detail, active, group) {
        return `
          <button
            id="${id}"
            class="rail-button"
            data-active="${active ? "true" : "false"}"
            data-group="${group}"
            type="button"
          >
            <strong>${label}</strong>
            <span>${detail}</span>
          </button>
        `;
      }

      function renderButtons() {
        const supplierWrap = document.querySelector("#supplier-buttons");
        const modeWrap = document.querySelector("#mode-buttons");
        const audienceWrap = document.querySelector("#audience-buttons");
        const actionWrap = document.querySelector("#action-buttons");

        const suppliers = atlasData.matrixRows
          .map((row) => ({ supplierRef: row.supplierRef, supplierLabel: row.supplierLabel }))
          .filter((item, index, rows) => rows.findIndex((row) => row.supplierRef === item.supplierRef) === index);

        supplierWrap.innerHTML = suppliers
          .map((supplier) =>
            buttonHtml(
              `SupplierButton-${supplier.supplierRef}`,
              supplier.supplierLabel,
              supplier.supplierRef,
              supplier.supplierRef === state.supplierRef,
              "supplier"
            )
          )
          .join("");

        modeWrap.innerHTML = atlasData.integrationModes
          .map((mode) =>
            buttonHtml(
              `ModeButton-${mode}`,
              mode,
              "Frozen integration mode",
              mode === state.integrationMode,
              "mode"
            )
          )
          .join("");

        audienceWrap.innerHTML = atlasData.audiences
          .map((audience) =>
            buttonHtml(
              `AudienceButton-${audience}`,
              audience,
              "Projection audience",
              audience === state.selectionAudience,
              "audience"
            )
          )
          .join("");

        actionWrap.innerHTML = atlasData.actionScopes
          .map((scope) =>
            buttonHtml(
              `ActionButton-${scope}`,
              scope,
              "Requested scope",
              scope === state.requestedActionScope,
              "action"
            )
          )
          .join("");

        supplierWrap.querySelectorAll("button").forEach((button) => {
          button.addEventListener("click", () => {
            state.supplierRef = button.id.replace("SupplierButton-", "");
            render();
          });
        });
        modeWrap.querySelectorAll("button").forEach((button) => {
          button.addEventListener("click", () => {
            state.integrationMode = button.id.replace("ModeButton-", "");
            render();
          });
        });
        audienceWrap.querySelectorAll("button").forEach((button) => {
          button.addEventListener("click", () => {
            state.selectionAudience = button.id.replace("AudienceButton-", "");
            render();
          });
        });
        actionWrap.querySelectorAll("button").forEach((button) => {
          button.addEventListener("click", () => {
            state.requestedActionScope = button.id.replace("ActionButton-", "");
            render();
          });
        });
      }

      function renderMatrixCard(row, scenario) {
        const matrixSummary = document.querySelector("#matrix-summary");
        matrixSummary.innerHTML = `
          <div class="panel-grid">
            <div class="status-chip" data-tone="${toneForCapability(scenario.capabilityState)}">${scenario.capabilityState}</div>
            <div class="card" style="padding: 12px;">
              <h3>${row.supplierLabel}</h3>
              <p class="muted">${row.integrationMode} on ${row.deploymentType}</p>
              <p>Primary degradation profile: <strong>${row.primaryDependencyDegradationProfileRef}</strong></p>
              <p>Confirmation policy: <strong>${row.authoritativeReadAndConfirmationPolicyRef}</strong></p>
            </div>
          </div>
        `;

        const matrixTableBody = document.querySelector("#matrix-table-body");
        const rows = [
          ["matrix ref", row.providerCapabilityMatrixRef],
          ["version", row.matrixVersionRef],
          ["practice", row.practiceRef],
          ["assurance", row.assuranceStateRef],
          ["supports_patient_self_service", String(row.capabilities.supports_patient_self_service)],
          ["supports_staff_assisted_booking", String(row.capabilities.supports_staff_assisted_booking)],
          ["requires_gp_linkage_details", String(row.capabilities.requires_gp_linkage_details)],
          ["requires_local_consumer_component", String(row.capabilities.requires_local_consumer_component)],
          ["supports_async_commit_confirmation", String(row.capabilities.supports_async_commit_confirmation)],
        ];
        matrixTableBody.innerHTML = rows.map(([field, value]) => `<tr><td>${field}</td><td>${value}</td></tr>`).join("");
      }

      function renderBinding(binding) {
        const ladder = document.querySelector("#binding-ladder");
        ladder.innerHTML = `
          <div class="ladder-step">
            <strong>Matrix row</strong>
            <span>${binding.providerCapabilityMatrixRef}</span>
          </div>
          <div class="ladder-step" data-tone="assist">
            <strong>Adapter profile</strong>
            <span>${binding.adapterContractProfileRef}</span>
          </div>
          <div class="ladder-step" data-tone="degraded">
            <strong>Degradation profile</strong>
            <span>${binding.dependencyDegradationProfileRef}</span>
          </div>
          <div class="ladder-step" data-tone="blocked">
            <strong>Confirmation policy</strong>
            <span>${binding.authoritativeReadAndConfirmationPolicyRef}</span>
          </div>
          <div class="ladder-step">
            <strong>Compiled binding</strong>
            <span>${binding.bookingProviderAdapterBindingId}</span>
          </div>
        `;

        const tableBody = document.querySelector("#binding-table-body");
        const rows = [
          ["binding", binding.bookingProviderAdapterBindingId],
          ["audiences", binding.selectionAudienceSet.join(", ")],
          ["scopes", binding.actionScopeSet.join(", ")],
          ["reservation", binding.reservationSemantics],
          ["commit", binding.commitContractRef],
          ["authoritative read", binding.authoritativeReadContractRef],
          ["owner rule", binding.bindingCompilationOwnerRule],
        ];
        tableBody.innerHTML = rows.map(([label, value]) => `<tr><td>${label}</td><td>${value}</td></tr>`).join("");
      }

      function renderTuple(resolution) {
        const tupleFields = resolution["x-capabilityTupleHashInputOrder"].map((field) => {
          const tupleInput = {
            tenantId: resolution.tenantId,
            practiceRef: resolution.practiceRef,
            organisationRef: resolution.organisationRef,
            supplierRef: resolution.supplierRef,
            integrationMode: resolution.integrationMode,
            deploymentType: resolution.deploymentType,
            selectionAudience: resolution.selectionAudience,
            requestedActionScope: resolution.requestedActionScope,
            providerCapabilityMatrixRef: resolution.providerCapabilityMatrixRef,
            matrixVersionRef: resolution.capabilityMatrixVersionRef,
            providerAdapterBindingRef: resolution.providerAdapterBindingRef,
            providerAdapterBindingHash: resolution.providerAdapterBindingHash,
            adapterContractProfileRef: resolution.adapterContractProfileRef,
            gpLinkageCheckpoint: resolution.prerequisiteState.gpLinkageStatus,
            localConsumerCheckpoint: resolution.prerequisiteState.localConsumerStatus,
            assuranceTrustState: resolution.prerequisiteState.assuranceTrustState,
            surfacePublicationRef: resolution.routeTuple.surfacePublicationRef,
            runtimePublicationBundleRef: resolution.routeTuple.runtimePublicationBundleRef,
            routeIntentBindingRef: resolution.routeTuple.routeIntentBindingRef,
            governingObjectDescriptorRef: resolution.governingObjectDescriptorRef,
            governingObjectVersionRef: resolution.governingObjectVersionRef,
            parentAnchorRef: resolution.parentAnchorRef
          };
          return [field, tupleInput[field]];
        });

        document.querySelector("#tuple-braid").innerHTML = tupleFields
          .map(([field, value]) => `
            <div class="tuple-node">
              <strong>${field}</strong>
              <code>${String(value)}</code>
            </div>
          `)
          .join("");

        document.querySelector("#tuple-table-body").innerHTML = tupleFields
          .map(([field, value]) => `<tr><td>${field}</td><td>${String(value)}</td></tr>`)
          .join("");
      }

      function renderProjectionMap(parityGroupId) {
        const scenarios = parityRowsFor(parityGroupId);
        document.querySelector("#projection-map").innerHTML = scenarios
          .map((scenario) => {
            const projection = atlasData.projections.find((item) => item.parityGroupId === parityGroupId && item.selectionAudience === scenario.selectionAudience && item.requestedActionScope === scenario.requestedActionScope);
            return `
              <div class="projection-card">
                <strong>${scenario.selectionAudience}</strong>
                <p class="muted">${projection.surfaceState}</p>
                <p>${projection.exposedActionScopes.length ? projection.exposedActionScopes.join(", ") : "no live controls"}</p>
              </div>
            `;
          })
          .join("");

        document.querySelector("#projection-table-body").innerHTML = scenarios
          .map((scenario) => {
            const projection = atlasData.projections.find((item) => item.parityGroupId === parityGroupId && item.selectionAudience === scenario.selectionAudience && item.requestedActionScope === scenario.requestedActionScope);
            return `<tr><td>${scenario.selectionAudience}</td><td>${projection.surfaceState}</td><td>${projection.exposedActionScopes.join(", ") || "none"}</td></tr>`;
          })
          .join("");
      }

      function renderConfirmationPolicy(policy, scenario) {
        const steps = [
          ["pending", policy.pendingTruthStates.join(", ") || "none"],
          ["disputed", policy.disputedTruthStates.join(", ") || "none"],
          ["gate bound", policy.gateRequiredStates.join(", ") || "none"],
          ["durable", policy.durableProofClasses.join(", ") || "none"],
        ];
        const activeStep = scenario.capabilityState === "degraded_manual" ? "gate bound" : scenario.capabilityState === "blocked" ? "pending" : "durable";
        document.querySelector("#confirmation-strip").innerHTML = steps
          .map(([label, text]) => `
            <div class="confirmation-step ${label === activeStep ? "active" : ""}">
              <strong>${label}</strong>
              <p class="muted">${text}</p>
            </div>
          `)
          .join("");
        document.querySelector("#confirmation-table-body").innerHTML = steps
          .map(([label, text]) => `<tr><td>${label}</td><td>${text}</td></tr>`)
          .join("");
      }

      function renderOwnerLedger() {
        document.querySelector("#owner-ledger-body").innerHTML = atlasData.ownerMap
          .map((row) => `<tr><td>${row.authorityLayer}</td><td>${row.objectFamily}</td><td>${row.mayDecide}</td><td>${row.mayNotDecide}</td></tr>`)
          .join("");
      }

      function renderReasonLedger() {
        document.querySelector("#reason-ledger-body").innerHTML = Object.entries(reasonCatalog)
          .map(([code, value]) => `<tr><td>${code}</td><td>${value.class}</td><td>${value.summary}</td></tr>`)
          .join("");
      }

      function renderInspector(scenario, resolution, projection, binding) {
        root.dataset.activeScenario = scenario.scenarioId;
        root.dataset.activeCapabilityState = resolution.capabilityState;
        root.dataset.activeSurfaceState = projection.surfaceState;

        document.querySelector("#inspector-title").textContent = scenario.label;
        document.querySelector("#inspector-summary").textContent = `${scenario.selectionAudience} audience on ${resolution.integrationMode} for ${scenario.requestedActionScope}.`;

        const capabilityChip = document.querySelector("#capability-state-chip");
        capabilityChip.textContent = resolution.capabilityState;
        capabilityChip.dataset.tone = toneForCapability(resolution.capabilityState);

        const projectionChip = document.querySelector("#projection-state-chip");
        projectionChip.textContent = projection.surfaceState;
        projectionChip.dataset.tone = toneForCapability(resolution.capabilityState);

        document.querySelector("#binding-hash-box").textContent = `bindingHash ${binding.bindingHash}`;
        document.querySelector("#tuple-hash-box").textContent = `capabilityTupleHash ${resolution.capabilityTupleHash}`;

        const fields = [
          ["matrix", resolution.providerCapabilityMatrixRef],
          ["binding", resolution.providerAdapterBindingRef],
          ["policy", resolution.authoritativeReadAndConfirmationPolicyRef],
          ["publication", resolution.routeTuple.surfacePublicationRef],
          ["trust", resolution.prerequisiteState.assuranceTrustState],
          ["governing version", resolution.governingObjectVersionRef],
          ["parent anchor", resolution.parentAnchorRef],
        ];
        document.querySelector("#inspector-dl").innerHTML = fields
          .map(([label, value]) => `<div><dt>${label}</dt><dd>${value}</dd></div>`)
          .join("");

        document.querySelector("#fallback-list").innerHTML = scenario.fallbackActionRefs.length
          ? scenario.fallbackActionRefs
              .map((actionRef) => `<li>${fallbackCatalog[actionRef].label}: ${fallbackCatalog[actionRef].summary}</li>`)
              .join("")
          : "<li class='muted'>No fallback action required for the current scenario.</li>";

        document.querySelector("#blocked-list").innerHTML = scenario.blockedActionReasonCodes.length
          ? scenario.blockedActionReasonCodes
              .map((reasonCode) => `<li>${reasonCode}: ${reasonCatalog[reasonCode].summary}</li>`)
              .join("")
          : "<li class='muted'>No blocked-action reason for the current scenario.</li>";
      }

      function render() {
        renderButtons();
        const scenario = findScenario();
        const row = atlasData.matrixRows.find((item) => item.providerCapabilityMatrixRef === scenario.providerCapabilityMatrixRef);
        const binding = atlasData.bindings.find((item) => item.providerCapabilityMatrixRef === scenario.providerCapabilityMatrixRef);
        const resolution = atlasData.resolutions.find((item) => item.bookingCapabilityResolutionId === `RES_279_${scenario.scenarioId.replace("SCN_279_", "")}`);
        const projection = atlasData.projections.find((item) => item.bookingCapabilityProjectionId === `PROJ_279_${scenario.scenarioId.replace("SCN_279_", "")}`);
        const policy = atlasData.policies.find((item) => item.authoritativeReadAndConfirmationPolicyId === binding.authoritativeReadAndConfirmationPolicyRef);

        renderMatrixCard(row, scenario);
        renderBinding(binding);
        renderTuple(resolution);
        renderProjectionMap(scenario.parityGroupId);
        renderConfirmationPolicy(policy, scenario);
        renderOwnerLedger();
        renderReasonLedger();
        renderInspector(scenario, resolution, projection, binding);
      }

      render();
    </script>
  </body>
</html>
""".replace("__ATLAS_DATA__", escaped_payload)


def write_outputs() -> None:
    architecture_doc, api_doc, security_doc = build_docs()

    write_text("docs/architecture/279_phase4_provider_capability_matrix_and_adapter_seam.md", architecture_doc)
    write_text("docs/api/279_phase4_booking_capability_resolution_contract.md", api_doc)
    write_text("docs/security/279_phase4_capability_tuple_trust_and_confirmation_gate_rules.md", security_doc)
    write_text("docs/frontend/279_phase4_booking_capability_atlas.html", atlas_html())

    write_json("data/contracts/279_provider_capability_matrix.schema.json", build_provider_matrix_schema())
    write_json(
        "data/contracts/279_adapter_contract_profile_registry.json",
        build_registry_payload(
            "adapter_contract_profile_registry_279",
            "279.adapter-profile-registry.v1",
            "Phase 4 adapter contract profile registry",
            "profiles",
            ADAPTER_PROFILES,
        ),
    )
    write_json(
        "data/contracts/279_dependency_degradation_profile_registry.json",
        build_registry_payload(
            "dependency_degradation_profile_registry_279",
            "279.degradation-profile-registry.v1",
            "Phase 4 dependency degradation profile registry",
            "profiles",
            DEGRADATION_PROFILES,
        ),
    )
    write_json(
        "data/contracts/279_authoritative_read_and_confirmation_gate_policy_registry.json",
        build_registry_payload(
            "authoritative_read_and_confirmation_gate_policy_registry_279",
            "279.confirmation-policy-registry.v1",
            "Phase 4 authoritative read and confirmation-gate policy registry",
            "policies",
            CONFIRMATION_POLICIES,
        ),
    )
    write_json("data/contracts/279_booking_provider_adapter_binding.schema.json", build_binding_schema())
    write_json("data/contracts/279_booking_capability_resolution.schema.json", build_resolution_schema())
    write_json("data/contracts/279_booking_capability_projection.schema.json", build_projection_schema())

    write_text("data/analysis/279_external_reference_notes.md", EXTERNAL_REFERENCE_NOTES)
    write_json("data/analysis/279_visual_reference_notes.json", VISUAL_REFERENCE_NOTES)
    write_csv(
        "data/analysis/279_capability_tuple_matrix.csv",
        TUPLE_MATRIX_ROWS,
        [
            "scenarioId",
            "label",
            "parityGroupId",
            "supplierRef",
            "supplierLabel",
            "integrationMode",
            "deploymentType",
            "selectionAudience",
            "requestedActionScope",
            "providerCapabilityMatrixRef",
            "matrixVersionRef",
            "providerAdapterBindingRef",
            "bindingHash",
            "adapterContractProfileRef",
            "dependencyDegradationProfileRef",
            "authoritativeReadAndConfirmationPolicyRef",
            "gpLinkageStatus",
            "localConsumerStatus",
            "supplierDegradationStatus",
            "publicationState",
            "assuranceTrustState",
            "governingObjectDescriptorRef",
            "governingObjectRef",
            "governingObjectVersionRef",
            "parentAnchorRef",
            "capabilityState",
            "projectionSurfaceState",
            "liveControlExposure",
            "allowedActionScopes",
            "exposedActionScopes",
            "fallbackActionRefs",
            "blockedActionReasonCodes",
            "capabilityTupleHash",
        ],
    )
    write_csv(
        "data/analysis/279_matrix_binding_and_projection_owner_map.csv",
        OWNER_MAP_ROWS,
        [
            "authorityLayer",
            "objectFamily",
            "artifactPath",
            "authoritativeOwner",
            "sourceOfTruth",
            "mayDecide",
            "mayNotDecide",
            "versionField",
            "hashField",
            "consumingLayer",
        ],
    )
    write_json("data/analysis/279_capability_gap_log.json", GAP_LOG)


def main() -> None:
    write_outputs()


if __name__ == "__main__":
    main()
