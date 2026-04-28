#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
import textwrap
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = ROOT / "data" / "analysis"
DOCS_DIR = ROOT / "docs" / "external"
SERVICE_DIR = ROOT / "services" / "mock-mesh"
APP_DIR = ROOT / "apps" / "mock-mesh-mailroom"
APP_SRC_DIR = APP_DIR / "src"
APP_PUBLIC_DIR = APP_DIR / "public"

PACK_JSON_PATH = DATA_DIR / "mesh_execution_pack.json"
FIELD_MAP_PATH = DATA_DIR / "mesh_mailbox_field_map.json"
WORKFLOW_CSV_PATH = DATA_DIR / "mesh_workflow_registry.csv"
ROUTE_CSV_PATH = DATA_DIR / "mesh_message_route_matrix.csv"
LIVE_GATE_PATH = DATA_DIR / "mesh_live_gate_checklist.json"

MOCK_SPEC_DOC_PATH = DOCS_DIR / "28_mesh_mock_mailroom_spec.md"
FIELD_MAP_DOC_PATH = DOCS_DIR / "28_mesh_mailbox_application_field_map.md"
WORKFLOW_DOC_PATH = DOCS_DIR / "28_mesh_workflow_group_and_id_registry.md"
ROUTE_DOC_PATH = DOCS_DIR / "28_mesh_message_route_and_proof_matrix.md"
LIVE_GATE_DOC_PATH = DOCS_DIR / "28_mesh_live_gate_and_approval_strategy.md"

APP_PACK_TS_PATH = APP_SRC_DIR / "generated" / "meshExecutionPack.ts"
APP_PACK_JSON_PATH = APP_PUBLIC_DIR / "mesh-execution-pack.json"

TASK_ID = "seq_028"
VISUAL_MODE = "Signal_Post_Room"
MISSION = (
    "Create the MESH execution pack with two explicit parts: a high-fidelity local MESH twin, "
    "mailroom console, and workflow registry now, and a gated real mailbox plus workflow "
    "onboarding strategy later."
)

REQUIRED_INPUTS = {
    "phase0_gate_verdict": DATA_DIR / "phase0_gate_verdict.json",
    "coverage_summary": DATA_DIR / "coverage_summary.json",
    "integration_priority_matrix": DATA_DIR / "integration_priority_matrix.json",
    "external_dependencies": DATA_DIR / "external_dependencies.json",
    "secret_ownership_map": DATA_DIR / "secret_ownership_map.json",
    "route_family_inventory": DATA_DIR / "route_family_inventory.csv",
    "external_touchpoint_matrix": DATA_DIR / "external_touchpoint_matrix.csv",
    "master_risk_register": DATA_DIR / "master_risk_register.json",
}

SOURCE_PRECEDENCE = [
    "prompt/028.md",
    "prompt/shared_operating_contract_026_to_035.md",
    "prompt/AGENT.md",
    "prompt/checklist.md",
    "blueprint/blueprint-init.md",
    "blueprint/phase-0-the-foundation-protocol.md",
    "blueprint/phase-5-the-network-horizon.md",
    "blueprint/phase-6-the-pharmacy-loop.md",
    "blueprint/platform-runtime-and-release-blueprint.md",
    "blueprint/forensic-audit-findings.md",
    "docs/external/21_integration_priority_and_execution_matrix.md",
    "docs/external/23_actual_partner_account_governance.md",
    "docs/external/23_secret_ownership_and_rotation_model.md",
    "docs/risk/18_master_risk_register.md",
    "https://digital.nhs.uk/services/message-exchange-for-social-care-and-health-mesh",
    "https://digital.nhs.uk/services/message-exchange-for-social-care-and-health-mesh/mesh-user-interface-ui",
    "https://digital.nhs.uk/services/message-exchange-for-social-care-and-health-mesh/messaging-exchange-for-social-care-and-health-apply-for-a-mailbox",
    "https://digital.nhs.uk/services/message-exchange-for-social-care-and-health-mesh/workflow-groups-and-workflow-ids",
    "https://digital.nhs.uk/services/message-exchange-for-social-care-and-health-mesh/workflow-groups-and-workflow-ids/new-workflow-request-or-workflow-amendment-for-an-existing-mailbox",
    "https://digital.nhs.uk/services/message-exchange-for-social-care-and-health-mesh/roadmap",
    "https://digital.nhs.uk/developer/api-catalogue/message-exchange-for-social-care-and-health-api",
]

OFFICIAL_GUIDANCE = [
    {
        "source_id": "official_mesh_service_overview",
        "title": "Message Exchange for Social Care and Health (MESH)",
        "url": "https://digital.nhs.uk/services/message-exchange-for-social-care-and-health-mesh",
        "captured_on": "2026-04-09",
        "summary": (
            "The service overview describes MESH as the nationally recognised mechanism for "
            "sharing data directly between health and care organisations, including system-to-system "
            "transfer via client or API and ad hoc transfer via the UI."
        ),
        "grounding": [
            "MESH is positioned as a secure and reliable transport rail across organisations.",
            "The sender uploads to an outbox, MESH holds the message until retrieval, and the recipient acknowledges successful download.",
            "A non-delivery report is sent if the recipient does not retrieve the message within 5 days.",
            "Workflow IDs are routing controls and help recipients understand message type.",
            "CC and redirect rules are configured by the MESH service team, not by end users.",
        ],
    },
    {
        "source_id": "official_mesh_ui_and_test_env",
        "title": "MESH User Interface (UI)",
        "url": "https://digital.nhs.uk/services/message-exchange-for-social-care-and-health-mesh/mesh-user-interface-ui",
        "captured_on": "2026-04-09",
        "summary": (
            "The UI page explains test-environment usage, notes that Path to Live deployment is a "
            "common safe-space environment, and lists the baseline application details needed for a "
            "mailbox and UI account."
        ),
        "grounding": [
            "Test environment use is recommended for learning and some programmes require test-first use.",
            "Path to Live deployment is named as a common test environment.",
            "Mailbox application needs ODS code, workflow groups and IDs, selected environment, and mailbox-manager contact details.",
            "A separate UI-account application is required after a mailbox ID exists.",
        ],
    },
    {
        "source_id": "official_mesh_mailbox_apply_form",
        "title": "Apply for a MESH mailbox",
        "url": "https://digital.nhs.uk/services/message-exchange-for-social-care-and-health-mesh/messaging-exchange-for-social-care-and-health-apply-for-a-mailbox",
        "captured_on": "2026-04-09",
        "summary": (
            "The mailbox form publishes the exact environment, organisation, mailbox-management, "
            "version-choice, workflow-detail, file-size, and API Path-to-Live certificate fields."
        ),
        "grounding": [
            "Applicants choose Live, Path to live - integration, or Path to live - deployment.",
            "Organisation type, owner ODS code, nominated representative, and optional third-party manager details are required.",
            "Mailbox type selection distinguishes client, UI over HSCN, UI over internet, and API.",
            "Live MESH API mailboxes require API onboarding before application.",
            "Workflow-group details, data type, business flow, clone-mailbox option, and approximate file size are part of the form.",
            "For API testing in Path to Live, a CSR subject in the `local_id.ods_code.api.mesh-client.nhs.uk` format is required.",
            "Local testing can happen in Path to Live integration without applying for a mailbox and can also use the MESH-sandbox locally.",
        ],
    },
    {
        "source_id": "official_mesh_workflow_guidance",
        "title": "Workflow groups and workflow IDs",
        "url": "https://digital.nhs.uk/services/message-exchange-for-social-care-and-health-mesh/workflow-groups-and-workflow-ids",
        "captured_on": "2026-04-09",
        "summary": (
            "The workflow guidance explains initiator and responder semantics, distinguishes "
            "business acknowledgements from mailbox download acknowledgement, and points users to "
            "the current spreadsheet of workflow groups and IDs."
        ),
        "grounding": [
            "One-way processes usually require only an initiator workflow ID.",
            "Two-way processes can require initiator and responder workflow IDs.",
            "Business acknowledgements are explicitly different from mailbox download acknowledgement.",
            "Workflow IDs and groups should be checked against the current published spreadsheet before applying.",
        ],
    },
    {
        "source_id": "official_mesh_workflow_request_form",
        "title": "New workflow request or workflow amendment for an existing mailbox",
        "url": "https://digital.nhs.uk/services/message-exchange-for-social-care-and-health-mesh/workflow-groups-and-workflow-ids/new-workflow-request-or-workflow-amendment-for-an-existing-mailbox",
        "captured_on": "2026-04-09",
        "summary": (
            "The workflow-request form requires mailbox-admin status for amendments, prior liaison "
            "with the MESH or Spine DevOps team for new groups or IDs, and a concise MESH-side "
            "business-flow description for each requested group and ID."
        ),
        "grounding": [
            "Mailbox amendments may only be requested by the mailbox administrator.",
            "New workflow requests require prior discussion with the MESH team or Spine DevOps.",
            "New workflow group details must describe only the transfer flow and participating organisations.",
            "Each requested workflow ID must declare initiator or responder posture and a short transfer description.",
            "Requests lacking all required details can be rejected.",
        ],
    },
    {
        "source_id": "official_mesh_roadmap",
        "title": "MESH roadmap",
        "url": "https://digital.nhs.uk/services/message-exchange-for-social-care-and-health-mesh/roadmap",
        "captured_on": "2026-04-09",
        "summary": (
            "The roadmap records that MESH sandbox was created in 2023, API onboarding moved to "
            "digital onboarding in 2022, and improving testing and onboarding remains part of the "
            "service strategy."
        ),
        "grounding": [
            "MESH sandbox exists as a separate testing aid.",
            "The MESH API onboarding journey moved to digital onboarding.",
            "Easier testing of API connections and onboarding simplification remain explicit roadmap themes.",
        ],
    },
    {
        "source_id": "official_mesh_api_catalogue",
        "title": "Message Exchange for Social Care and Health (MESH) API",
        "url": "https://digital.nhs.uk/developer/api-catalogue/message-exchange-for-social-care-and-health-api",
        "captured_on": "2026-04-09",
        "summary": (
            "The API catalogue confirms that MESH API is the system-to-system surface for secure "
            "message and large-file transfer and publishes the current OAS-backed specification."
        ),
        "grounding": [
            "MESH API is an official developer-facing surface, not a private implementation detail.",
            "The OAS file is the current technical reference for software integration.",
        ],
    },
]

ASSUMPTIONS = [
    {
        "assumption_id": "ASSUMPTION_VECELLS_WORKFLOW_IDS_ARE_CANDIDATE_REQUESTS_NOT_APPROVED_IDS",
        "summary": (
            "The public MESH pages publish the rules and current workbook location, but this task "
            "does not pull the private or rapidly changing workflow spreadsheet into repo. The IDs "
            "below are therefore internal Vecells candidate requests unless later mapped to an "
            "existing approved workflow."
        ),
        "consequence": "The registry is operationally useful now without falsely claiming mailbox-ready production IDs.",
    },
    {
        "assumption_id": "ASSUMPTION_LOCAL_MESH_TWIN_MODELS_TRANSPORT_AND_PROOF_NOT_SPINE_BEHAVIOUR",
        "summary": (
            "The local twin reproduces message-rail states, timing, replay, expiry, quarantine, and "
            "workflow validation, but it does not claim to emulate internal Spine infrastructure or "
            "hidden service-team controls."
        ),
        "consequence": "The mock stays high fidelity for product behaviour while remaining honest about external service boundaries.",
    },
    {
        "assumption_id": "ASSUMPTION_PATH_TO_LIVE_AND_LOCAL_SANDBOX_STAY_SEPARATE_DECISIONS",
        "summary": (
            "Official guidance says API testing can begin in Path to Live integration without a "
            "mailbox and also points to local MESH-sandbox options. Vecells therefore records local "
            "sandbox, Path to Live-like rehearsal, and real mailbox application as distinct stages."
        ),
        "consequence": "The mock and live-later strategy do not collapse 'test transport' into 'request mailbox now'.",
    },
]

WORKFLOW_ROWS = [
    {
        "workflow_group": "WG_HUB_PRACTICE_VISIBILITY",
        "workflow_id": "VEC_HUB_BOOKING_NOTICE",
        "message_family": "practice_visibility_notice",
        "bounded_context_ref": "hub_coordination",
        "business_flow_summary": "Vecells hub sends booking or continuity notices to the origin practice after a hub-side commit attempt.",
        "proof_required_after_send": "Current-generation PracticeAcknowledgementRecord or a governed recovery path with explicit acknowledgement debt.",
        "acceptance_vs_authoritative_truth_note": "Transport acceptance or mailbox queueing does not clear practice acknowledgement debt or canonical booking truth.",
        "mailbox_direction": "outbound",
        "path_to_live_need": "recommended_before_real_partner_rehearsal",
        "live_mailbox_need": "required_for_live_cross_org_dispatch",
        "mock_now_support_level": "high_fidelity",
        "fallback_if_missing": "Manual practice callback or monitored recovery case without patient-facing calmness.",
        "notes": "Candidate initiator ID only; must be mapped to an existing approved workflow or requested as new.",
        "workflow_role": "initiator",
        "approval_posture": "candidate_new_or_needs_mapping",
        "bounded_route_refs": "rf_hub_queue; rf_hub_case_management; rf_staff_workspace",
    },
    {
        "workflow_group": "WG_HUB_PRACTICE_VISIBILITY",
        "workflow_id": "VEC_HUB_BOOKING_ACK",
        "message_family": "practice_business_ack",
        "bounded_context_ref": "hub_coordination",
        "business_flow_summary": "Origin practice returns a business acknowledgement or inability response for a hub continuity notice.",
        "proof_required_after_send": "Current-generation PracticeAcknowledgementRecord linked to the active ackGeneration and truthTupleHash.",
        "acceptance_vs_authoritative_truth_note": "Mailbox download acknowledgement is not the same as the practice confirming it processed or accepted the business message.",
        "mailbox_direction": "inbound",
        "path_to_live_need": "recommended_before_real_partner_rehearsal",
        "live_mailbox_need": "required_for_live_cross_org_receive",
        "mock_now_support_level": "high_fidelity",
        "fallback_if_missing": "Leave acknowledgement debt open, surface overdue timers, and route to operator escalation.",
        "notes": "Candidate responder ID only; preserves business ACK separate from mailbox receipt.",
        "workflow_role": "responder",
        "approval_posture": "candidate_new_or_needs_mapping",
        "bounded_route_refs": "rf_hub_case_management; rf_staff_workspace; rf_support_replay_observe",
    },
    {
        "workflow_group": "WG_PHARMACY_REFERRAL",
        "workflow_id": "VEC_PF_REFERRAL_INIT",
        "message_family": "pharmacy_referral_dispatch",
        "bounded_context_ref": "pharmacy",
        "business_flow_summary": "Vecells dispatches a frozen referral package to a pharmacy or agreed receiving mailbox.",
        "proof_required_after_send": "PharmacyDispatchAttempt under the active TransportAssuranceProfile and any required ExternalConfirmationGate.",
        "acceptance_vs_authoritative_truth_note": "Transport acceptance never settles referral completion, dispense outcome, or patient reassurance.",
        "mailbox_direction": "outbound",
        "path_to_live_need": "recommended_before_real_partner_rehearsal",
        "live_mailbox_need": "required_for_live_cross_org_dispatch",
        "mock_now_support_level": "high_fidelity",
        "fallback_if_missing": "Keep case in proof_pending or recovery posture and use governed manual referral path if policy allows.",
        "notes": "Candidate initiator ID only; ties directly to PharmacyDispatchSettlement and not to canonical request closure.",
        "workflow_role": "initiator",
        "approval_posture": "candidate_new_or_needs_mapping",
        "bounded_route_refs": "rf_pharmacy_console; rf_support_ticket_workspace",
    },
    {
        "workflow_group": "WG_PHARMACY_REFERRAL",
        "workflow_id": "VEC_PF_REFERRAL_ACK",
        "message_family": "pharmacy_business_ack",
        "bounded_context_ref": "pharmacy",
        "business_flow_summary": "Receiving pharmacy acknowledges referral receipt or reports refusal-to-process at the business level.",
        "proof_required_after_send": "Business acknowledgement tied to the current dispatch generation and mailbox pair.",
        "acceptance_vs_authoritative_truth_note": "Business ACK remains weaker than consultation outcome, bounce-back, or authoritative pharmacy update evidence.",
        "mailbox_direction": "inbound",
        "path_to_live_need": "recommended_before_real_partner_rehearsal",
        "live_mailbox_need": "required_for_live_cross_org_receive",
        "mock_now_support_level": "high_fidelity",
        "fallback_if_missing": "Stay in proof_pending with explicit delivery ambiguity and operator follow-up.",
        "notes": "Candidate responder ID only; separate from mailbox pickup acknowledgement.",
        "workflow_role": "responder",
        "approval_posture": "candidate_new_or_needs_mapping",
        "bounded_route_refs": "rf_pharmacy_console; rf_support_replay_observe",
    },
    {
        "workflow_group": "WG_PHARMACY_REFERRAL",
        "workflow_id": "VEC_PF_OUTCOME_RESP",
        "message_family": "pharmacy_outcome_return",
        "bounded_context_ref": "pharmacy",
        "business_flow_summary": "Pharmacy sends consultation outcome, no-contact, or other outcome payload back to Vecells.",
        "proof_required_after_send": "Correlated PharmacyOutcomeRecord or PharmacyOutcomeReconciliationGate evidence against the current PharmacyCase.",
        "acceptance_vs_authoritative_truth_note": "Outcome payload arrival is still subject to matching and reconciliation before it can influence canonical closure.",
        "mailbox_direction": "inbound",
        "path_to_live_need": "recommended_before_real_partner_rehearsal",
        "live_mailbox_need": "required_for_live_cross_org_receive",
        "mock_now_support_level": "high_fidelity",
        "fallback_if_missing": "Controlled reconciliation review, practice visibility debt, or urgent fallback without auto-close.",
        "notes": "Candidate responder ID only; weak-source or stale outcomes remain blocked on reconciliation.",
        "workflow_role": "responder",
        "approval_posture": "candidate_new_or_needs_mapping",
        "bounded_route_refs": "rf_pharmacy_console; rf_staff_workspace; rf_patient_requests",
    },
    {
        "workflow_group": "WG_PHARMACY_REFERRAL",
        "workflow_id": "VEC_PF_URGENT_RETURN_RESP",
        "message_family": "pharmacy_urgent_return",
        "bounded_context_ref": "pharmacy",
        "business_flow_summary": "Pharmacy returns an urgent escalation, bounce-back, or cannot-complete posture that requires immediate handling.",
        "proof_required_after_send": "Urgent return evidence bundle or bounce-back record on the active PharmacyCase.",
        "acceptance_vs_authoritative_truth_note": "Transport receipt is not a settled urgent outcome; the urgent return must be assimilated and acted on explicitly.",
        "mailbox_direction": "inbound",
        "path_to_live_need": "recommended_before_real_partner_rehearsal",
        "live_mailbox_need": "required_for_live_cross_org_receive",
        "mock_now_support_level": "high_fidelity",
        "fallback_if_missing": "Escalate via governed telephone route and keep request in active recovery or urgent posture.",
        "notes": "Candidate responder ID only; closes the generic-reconciliation gap for urgent return handling.",
        "workflow_role": "responder",
        "approval_posture": "candidate_new_or_needs_mapping",
        "bounded_route_refs": "rf_pharmacy_console; rf_support_ticket_workspace; rf_patient_requests",
    },
    {
        "workflow_group": "WG_SUPPORT_QUARANTINE_REPLAY",
        "workflow_id": "VEC_ATTACHMENT_QUARANTINE",
        "message_family": "attachment_quarantine_notice",
        "bounded_context_ref": "support_operations",
        "business_flow_summary": "A transport or downstream service emits a quarantine notice or attachment-handoff defect against an existing message.",
        "proof_required_after_send": "Attachment quarantine manifest, reason code, and recovery action linked to the current dispatch tuple.",
        "acceptance_vs_authoritative_truth_note": "Receipt of a quarantine notice does not resolve the underlying content issue or allow silent retry.",
        "mailbox_direction": "duplex",
        "path_to_live_need": "local_mock_sufficient_until_partner_demands_real_rail",
        "live_mailbox_need": "conditional_on_real_attachment_transport",
        "mock_now_support_level": "high_fidelity",
        "fallback_if_missing": "Open a support replay or fallback-review case and preserve the message artifact lineage.",
        "notes": "Candidate duplex ID only; explicitly forbids flattening quarantine into generic failure.",
        "workflow_role": "duplex",
        "approval_posture": "candidate_new_or_needs_mapping",
        "bounded_route_refs": "rf_support_ticket_workspace; rf_support_replay_observe",
    },
    {
        "workflow_group": "WG_SUPPORT_QUARANTINE_REPLAY",
        "workflow_id": "VEC_REPLAY_EVIDENCE_REQUEST",
        "message_family": "replay_or_resubmission_request",
        "bounded_context_ref": "support_operations",
        "business_flow_summary": "Operators request replay-safe re-delivery evidence or a controlled re-submission against a prior message generation.",
        "proof_required_after_send": "Replay collision review or resubmission evidence bound to the original canonicalDispatchKey.",
        "acceptance_vs_authoritative_truth_note": "A replay request must preserve generation semantics and cannot silently overwrite or merge the prior effect chain.",
        "mailbox_direction": "duplex",
        "path_to_live_need": "local_mock_sufficient_until_partner_demands_real_rail",
        "live_mailbox_need": "conditional_on_real_attachment_transport",
        "mock_now_support_level": "high_fidelity",
        "fallback_if_missing": "Manual evidence pull and operator review with duplicate suppression intact.",
        "notes": "Candidate duplex ID only; first-class replay governance object, not a generic resend button.",
        "workflow_role": "duplex",
        "approval_posture": "candidate_new_or_needs_mapping",
        "bounded_route_refs": "rf_support_replay_observe; rf_support_ticket_workspace",
    },
    {
        "workflow_group": "WG_HUB_MANUAL_RECOVERY",
        "workflow_id": "VEC_HUB_RECOVERY_ACTION",
        "message_family": "manual_recovery_follow_up",
        "bounded_context_ref": "hub_coordination",
        "business_flow_summary": "Hub sends a governed recovery or reopen follow-up after failed, stale, or disputed acknowledgement states.",
        "proof_required_after_send": "Recovery case evidence plus current-generation follow-up proof on the same lineage.",
        "acceptance_vs_authoritative_truth_note": "Recovery dispatch is evidence of action, not evidence that the external organisation has recovered or accepted responsibility.",
        "mailbox_direction": "outbound",
        "path_to_live_need": "recommended_before_real_partner_rehearsal",
        "live_mailbox_need": "required_for_live_cross_org_dispatch",
        "mock_now_support_level": "high_fidelity",
        "fallback_if_missing": "Phone escalation or manual handoff while the original debt stays explicit.",
        "notes": "Candidate initiator ID only; prevents route-local shortcuts around same-lineage recovery.",
        "workflow_role": "initiator",
        "approval_posture": "candidate_new_or_needs_mapping",
        "bounded_route_refs": "rf_hub_case_management; rf_support_ticket_workspace; rf_patient_requests",
    },
]

MAILBOX_ROWS = [
    {
        "mailbox_key": "MBX_VEC_HUB",
        "mailbox_id": "mock-vec-hub-coord",
        "display_name": "Vecells hub coordination",
        "owner_organisation": "Vecells interoperability delivery",
        "owner_ods": "VEC01",
        "organisation_type": "system_supplier",
        "manager_mode": "self_managed",
        "third_party_manager_ods": "",
        "environment_band": "local_sandbox",
        "mailbox_type": "api",
        "workflow_keys": "VEC_HUB_BOOKING_NOTICE; VEC_HUB_BOOKING_ACK; VEC_HUB_RECOVERY_ACTION",
        "business_scope": "Hub outbound continuity, inbound acknowledgement, and recovery follow-up.",
    },
    {
        "mailbox_key": "MBX_PRACTICE_PROXY",
        "mailbox_id": "mock-practice-ack-proxy",
        "display_name": "Origin practice acknowledgement proxy",
        "owner_organisation": "Partner GP practice placeholder",
        "owner_ods": "PRA01",
        "organisation_type": "gp_practice",
        "manager_mode": "third_party_managed",
        "third_party_manager_ods": "VEC01",
        "environment_band": "path_to_live_like",
        "mailbox_type": "api",
        "workflow_keys": "VEC_HUB_BOOKING_NOTICE; VEC_HUB_BOOKING_ACK",
        "business_scope": "Practice-side receipt and business acknowledgement of hub notices.",
    },
    {
        "mailbox_key": "MBX_VEC_PHARMACY",
        "mailbox_id": "mock-vec-pharmacy-dispatch",
        "display_name": "Vecells pharmacy dispatch",
        "owner_organisation": "Vecells interoperability delivery",
        "owner_ods": "VEC01",
        "organisation_type": "system_supplier",
        "manager_mode": "self_managed",
        "third_party_manager_ods": "",
        "environment_band": "local_sandbox",
        "mailbox_type": "api",
        "workflow_keys": "VEC_PF_REFERRAL_INIT; VEC_PF_REFERRAL_ACK; VEC_PF_OUTCOME_RESP; VEC_PF_URGENT_RETURN_RESP",
        "business_scope": "Referral dispatch plus inbound pharmacy acknowledgement and outcomes.",
    },
    {
        "mailbox_key": "MBX_PHARMACY_PROXY",
        "mailbox_id": "mock-pharmacy-return-proxy",
        "display_name": "Receiving pharmacy proxy",
        "owner_organisation": "Partner pharmacy placeholder",
        "owner_ods": "PHA01",
        "organisation_type": "other",
        "manager_mode": "third_party_managed",
        "third_party_manager_ods": "VEC01",
        "environment_band": "path_to_live_like",
        "mailbox_type": "api",
        "workflow_keys": "VEC_PF_REFERRAL_INIT; VEC_PF_REFERRAL_ACK; VEC_PF_OUTCOME_RESP; VEC_PF_URGENT_RETURN_RESP",
        "business_scope": "Pharmacy-side referral receipt and outcome return.",
    },
    {
        "mailbox_key": "MBX_VEC_SUPPORT",
        "mailbox_id": "mock-vec-support-replay",
        "display_name": "Vecells support replay desk",
        "owner_organisation": "Vecells support operations",
        "owner_ods": "VEC01",
        "organisation_type": "system_supplier",
        "manager_mode": "self_managed",
        "third_party_manager_ods": "",
        "environment_band": "local_sandbox",
        "mailbox_type": "api",
        "workflow_keys": "VEC_ATTACHMENT_QUARANTINE; VEC_REPLAY_EVIDENCE_REQUEST",
        "business_scope": "Replay review, attachment quarantine, and operator recovery traffic.",
    },
]

MESSAGE_ROUTE_ROWS = [
    {
        "route_row_id": "ROUTE_HUB_QUEUE_NOTICE",
        "route_family_ref": "rf_hub_queue",
        "route_family_name": "Hub queue",
        "surface_owner": "hub",
        "bounded_context_ref": "hub_coordination",
        "message_family": "practice_visibility_notice",
        "workflow_group": "WG_HUB_PRACTICE_VISIBILITY",
        "preferred_workflow_id": "VEC_HUB_BOOKING_NOTICE",
        "mailbox_keys": "MBX_VEC_HUB -> MBX_PRACTICE_PROXY",
        "transport_acceptance_signal": "message_accepted or queued_for_pickup",
        "authoritative_downstream_proof": "PracticeAcknowledgementRecord or governed recovery evidence.",
        "canonical_truth_guardrail": "Do not imply hub success or calm practice continuity until business acknowledgement debt is cleared.",
        "degraded_fallback": "Recovery case, phone escalation, or explicit pending practice visibility debt.",
        "notes": "Acceptance is transport evidence only.",
    },
    {
        "route_row_id": "ROUTE_HUB_CASE_ACK",
        "route_family_ref": "rf_hub_case_management",
        "route_family_name": "Hub case management",
        "surface_owner": "hub",
        "bounded_context_ref": "hub_coordination",
        "message_family": "practice_business_ack",
        "workflow_group": "WG_HUB_PRACTICE_VISIBILITY",
        "preferred_workflow_id": "VEC_HUB_BOOKING_ACK",
        "mailbox_keys": "MBX_PRACTICE_PROXY -> MBX_VEC_HUB",
        "transport_acceptance_signal": "picked_up",
        "authoritative_downstream_proof": "Current-generation practice ACK or inability response on the correct ackGeneration.",
        "canonical_truth_guardrail": "Mailbox pickup alone does not equal business ACK.",
        "degraded_fallback": "Keep acknowledgement debt open and operator-visible.",
        "notes": "Explicitly separates mailbox receipt from business receipt.",
    },
    {
        "route_row_id": "ROUTE_STAFF_WORKSPACE_PRACTICE",
        "route_family_ref": "rf_staff_workspace",
        "route_family_name": "Staff workspace",
        "surface_owner": "staff",
        "bounded_context_ref": "hub_coordination",
        "message_family": "practice_visibility_notice",
        "workflow_group": "WG_HUB_PRACTICE_VISIBILITY",
        "preferred_workflow_id": "VEC_HUB_BOOKING_NOTICE",
        "mailbox_keys": "MBX_VEC_HUB -> MBX_PRACTICE_PROXY",
        "transport_acceptance_signal": "delayed_ack",
        "authoritative_downstream_proof": "PracticeAcknowledgementRecord plus freshness on the current tuple.",
        "canonical_truth_guardrail": "Staff surfaces may show pending, disputed, or recovered states but must not flatten them into complete.",
        "degraded_fallback": "Show same-lineage recovery and callback plans.",
        "notes": "Operational view only; no patient-facing closure allowed.",
    },
    {
        "route_row_id": "ROUTE_PHARMACY_REFERRAL_DISPATCH",
        "route_family_ref": "rf_pharmacy_console",
        "route_family_name": "Pharmacy console",
        "surface_owner": "pharmacy",
        "bounded_context_ref": "pharmacy",
        "message_family": "pharmacy_referral_dispatch",
        "workflow_group": "WG_PHARMACY_REFERRAL",
        "preferred_workflow_id": "VEC_PF_REFERRAL_INIT",
        "mailbox_keys": "MBX_VEC_PHARMACY -> MBX_PHARMACY_PROXY",
        "transport_acceptance_signal": "message_accepted",
        "authoritative_downstream_proof": "PharmacyDispatchAttempt.authoritativeProofRef accepted by the active TransportAssuranceProfile.",
        "canonical_truth_guardrail": "Transport acceptance cannot settle pharmacy referral success, patient instructions, or closure.",
        "degraded_fallback": "Proof-pending, redispatch under fresh tuple, or manual alternative.",
        "notes": "Primary proof-bearing transport lane for Phase 6.",
    },
    {
        "route_row_id": "ROUTE_PHARMACY_REFERRAL_ACK",
        "route_family_ref": "rf_pharmacy_console",
        "route_family_name": "Pharmacy console",
        "surface_owner": "pharmacy",
        "bounded_context_ref": "pharmacy",
        "message_family": "pharmacy_business_ack",
        "workflow_group": "WG_PHARMACY_REFERRAL",
        "preferred_workflow_id": "VEC_PF_REFERRAL_ACK",
        "mailbox_keys": "MBX_PHARMACY_PROXY -> MBX_VEC_PHARMACY",
        "transport_acceptance_signal": "picked_up",
        "authoritative_downstream_proof": "Business ACK on the matching referral generation.",
        "canonical_truth_guardrail": "Business ACK is still weaker than consultation outcome or urgent return.",
        "degraded_fallback": "Operator review or proof_pending posture.",
        "notes": "Business ACK is not mailbox ACK.",
    },
    {
        "route_row_id": "ROUTE_PHARMACY_OUTCOME",
        "route_family_ref": "rf_patient_requests",
        "route_family_name": "Patient requests",
        "surface_owner": "patient",
        "bounded_context_ref": "pharmacy",
        "message_family": "pharmacy_outcome_return",
        "workflow_group": "WG_PHARMACY_REFERRAL",
        "preferred_workflow_id": "VEC_PF_OUTCOME_RESP",
        "mailbox_keys": "MBX_PHARMACY_PROXY -> MBX_VEC_PHARMACY",
        "transport_acceptance_signal": "message_accepted",
        "authoritative_downstream_proof": "Matched PharmacyOutcomeRecord or explicit PharmacyOutcomeReconciliationGate resolution.",
        "canonical_truth_guardrail": "Patient view must stay proof_pending, disputed, or recovery until the outcome is matched and assimilated.",
        "degraded_fallback": "Support review, pharmacy callback, or origin-practice follow-up.",
        "notes": "Patient surface is observer-only for MESH truth.",
    },
    {
        "route_row_id": "ROUTE_PHARMACY_URGENT_RETURN",
        "route_family_ref": "rf_staff_workspace",
        "route_family_name": "Staff workspace",
        "surface_owner": "staff",
        "bounded_context_ref": "pharmacy",
        "message_family": "pharmacy_urgent_return",
        "workflow_group": "WG_PHARMACY_REFERRAL",
        "preferred_workflow_id": "VEC_PF_URGENT_RETURN_RESP",
        "mailbox_keys": "MBX_PHARMACY_PROXY -> MBX_VEC_PHARMACY",
        "transport_acceptance_signal": "picked_up",
        "authoritative_downstream_proof": "Urgent return record or bounce-back evidence on the current PharmacyCase.",
        "canonical_truth_guardrail": "Urgent return cannot be downgraded to generic reconciliation or silent retry.",
        "degraded_fallback": "Immediate operator escalation and same-lineage recovery.",
        "notes": "Explicit urgent lane, not a generic outcome.",
    },
    {
        "route_row_id": "ROUTE_SUPPORT_QUARANTINE",
        "route_family_ref": "rf_support_ticket_workspace",
        "route_family_name": "Support ticket workspace",
        "surface_owner": "support",
        "bounded_context_ref": "support_operations",
        "message_family": "attachment_quarantine_notice",
        "workflow_group": "WG_SUPPORT_QUARANTINE_REPLAY",
        "preferred_workflow_id": "VEC_ATTACHMENT_QUARANTINE",
        "mailbox_keys": "MBX_VEC_PHARMACY -> MBX_VEC_SUPPORT",
        "transport_acceptance_signal": "quarantined",
        "authoritative_downstream_proof": "Attachment quarantine manifest plus recovery action state.",
        "canonical_truth_guardrail": "Quarantine is its own state and may not be flattened into failed or expired.",
        "degraded_fallback": "FallbackReviewCase and controlled re-submit decision.",
        "notes": "Required mandatory gap closure for attachment and quarantine events.",
    },
    {
        "route_row_id": "ROUTE_SUPPORT_REPLAY",
        "route_family_ref": "rf_support_replay_observe",
        "route_family_name": "Support replay observe",
        "surface_owner": "support",
        "bounded_context_ref": "support_operations",
        "message_family": "replay_or_resubmission_request",
        "workflow_group": "WG_SUPPORT_QUARANTINE_REPLAY",
        "preferred_workflow_id": "VEC_REPLAY_EVIDENCE_REQUEST",
        "mailbox_keys": "MBX_VEC_SUPPORT <-> MBX_VEC_HUB",
        "transport_acceptance_signal": "replay_blocked or duplicate_delivery",
        "authoritative_downstream_proof": "Replay collision evidence bound to canonicalDispatchKey and current generation.",
        "canonical_truth_guardrail": "Replay-safe resend must preserve lineage and may not overwrite earlier transport facts.",
        "degraded_fallback": "Open manual replay review and keep duplicate evidence explicit.",
        "notes": "Mandatory gap closure for duplicate and replay resistance.",
    },
    {
        "route_row_id": "ROUTE_PATIENT_MESSAGES_OBSERVE",
        "route_family_ref": "rf_patient_messages",
        "route_family_name": "Patient messages",
        "surface_owner": "patient",
        "bounded_context_ref": "hub_coordination",
        "message_family": "manual_recovery_follow_up",
        "workflow_group": "WG_HUB_MANUAL_RECOVERY",
        "preferred_workflow_id": "VEC_HUB_RECOVERY_ACTION",
        "mailbox_keys": "MBX_VEC_HUB -> MBX_PRACTICE_PROXY",
        "transport_acceptance_signal": "proof_pending",
        "authoritative_downstream_proof": "Recovery case resolution plus current acknowledgement or manual-completion evidence.",
        "canonical_truth_guardrail": "Patient communications may acknowledge that recovery is in progress but must not imply the external organisation has complied.",
        "degraded_fallback": "Same-shell recovery copy and support contact route.",
        "notes": "Observability row only; patient channel is not a sender of MESH traffic.",
    },
]

FIELD_ROWS = [
    {
        "field_id": "fld_mailbox_environment",
        "field_group": "mailbox_application",
        "origin_class": "official_mailbox_form",
        "label": "Mailbox required",
        "required_mode": "actual_provider_strategy_later",
        "value_shape": "enum",
        "value_examples": "live | path_to_live_integration | path_to_live_deployment",
        "purpose": "Select the environment requested on the mailbox form.",
        "notes": "Official mailbox form field.",
    },
    {
        "field_id": "fld_organisation_type",
        "field_group": "mailbox_application",
        "origin_class": "official_mailbox_form",
        "label": "Organisation type",
        "required_mode": "actual_provider_strategy_later",
        "value_shape": "enum",
        "value_examples": "health_authority | nhs_trust | gp_practice | system_supplier | other",
        "purpose": "Record the owner organisation type for mailbox creation.",
        "notes": "Official mailbox form field.",
    },
    {
        "field_id": "fld_owner_ods",
        "field_group": "mailbox_application",
        "origin_class": "official_mailbox_form",
        "label": "Organisation Data Service code of the organisation that owns the mailbox",
        "required_mode": "mock_now_and_actual_later",
        "value_shape": "string",
        "value_examples": "VEC01",
        "purpose": "Capture mailbox ownership ODS identity.",
        "notes": "Official mailbox form field and mandatory internal registry key.",
    },
    {
        "field_id": "fld_org_contact_name",
        "field_group": "mailbox_application",
        "origin_class": "official_mailbox_form",
        "label": "Organisation contact name",
        "required_mode": "actual_provider_strategy_later",
        "value_shape": "string",
        "value_examples": "Named representative",
        "purpose": "Name the nominated representative for the mailbox.",
        "notes": "Official mailbox form field.",
    },
    {
        "field_id": "fld_org_contact_phone",
        "field_group": "mailbox_application",
        "origin_class": "official_mailbox_form",
        "label": "Contact telephone number",
        "required_mode": "actual_provider_strategy_later",
        "value_shape": "string",
        "value_examples": "+44 20 7946 0000",
        "purpose": "Provide mailbox administrative contact telephone details.",
        "notes": "Official mailbox form field.",
    },
    {
        "field_id": "fld_org_contact_email",
        "field_group": "mailbox_application",
        "origin_class": "official_mailbox_form",
        "label": "Contact email address",
        "required_mode": "actual_provider_strategy_later",
        "value_shape": "string",
        "value_examples": "interop.owner@example.invalid",
        "purpose": "Provide mailbox administrative contact email.",
        "notes": "Official mailbox form field.",
    },
    {
        "field_id": "fld_third_party_manage_flag",
        "field_group": "mailbox_application",
        "origin_class": "official_mailbox_form",
        "label": "Is mailbox managed by a 3rd party",
        "required_mode": "actual_provider_strategy_later",
        "value_shape": "boolean",
        "value_examples": "true | false",
        "purpose": "Declare whether a third party manages the mailbox on behalf of the owner.",
        "notes": "Official mailbox form field.",
    },
    {
        "field_id": "fld_third_party_name",
        "field_group": "mailbox_application",
        "origin_class": "official_mailbox_form",
        "label": "3rd party organisation name",
        "required_mode": "conditional_actual_provider_strategy_later",
        "value_shape": "string",
        "value_examples": "Vecells interoperability delivery",
        "purpose": "Name the managing third party when mailbox management is delegated.",
        "notes": "Official mailbox form field.",
    },
    {
        "field_id": "fld_third_party_ods",
        "field_group": "mailbox_application",
        "origin_class": "official_mailbox_form",
        "label": "3rd party Organisation Data Service code",
        "required_mode": "conditional_actual_provider_strategy_later",
        "value_shape": "string",
        "value_examples": "VEC01",
        "purpose": "Capture the managing third party ODS code when relevant.",
        "notes": "Official mailbox form field.",
    },
    {
        "field_id": "fld_third_party_contact_name",
        "field_group": "mailbox_application",
        "origin_class": "official_mailbox_form",
        "label": "3rd party organisation nominated contact",
        "required_mode": "conditional_actual_provider_strategy_later",
        "value_shape": "string",
        "value_examples": "Partner mailbox manager",
        "purpose": "Name the managing third-party contact.",
        "notes": "Official mailbox form field.",
    },
    {
        "field_id": "fld_third_party_contact_phone",
        "field_group": "mailbox_application",
        "origin_class": "official_mailbox_form",
        "label": "3rd party organisation contact telephone number",
        "required_mode": "conditional_actual_provider_strategy_later",
        "value_shape": "string",
        "value_examples": "+44 20 7946 0100",
        "purpose": "Provide third-party manager telephone details.",
        "notes": "Official mailbox form field.",
    },
    {
        "field_id": "fld_third_party_contact_email",
        "field_group": "mailbox_application",
        "origin_class": "official_mailbox_form",
        "label": "3rd party organisation contact email",
        "required_mode": "conditional_actual_provider_strategy_later",
        "value_shape": "string",
        "value_examples": "mesh.manager@example.invalid",
        "purpose": "Provide third-party manager email details.",
        "notes": "Official mailbox form field.",
    },
    {
        "field_id": "fld_nems_use",
        "field_group": "mailbox_application",
        "origin_class": "official_mailbox_form",
        "label": "Is this mailbox for NEMS use",
        "required_mode": "actual_provider_strategy_later",
        "value_shape": "boolean",
        "value_examples": "false",
        "purpose": "Declare whether the mailbox is intended for NEMS messages.",
        "notes": "Official mailbox form field.",
    },
    {
        "field_id": "fld_mesh_mailbox_type",
        "field_group": "mailbox_application",
        "origin_class": "official_mailbox_form",
        "label": "Type of MESH mailbox you'll be using",
        "required_mode": "actual_provider_strategy_later",
        "value_shape": "enum",
        "value_examples": "mesh_client | mesh_ui_hscn | mesh_ui_internet | mesh_api",
        "purpose": "Choose the MESH product shape for the mailbox.",
        "notes": "Official mailbox form field.",
    },
    {
        "field_id": "fld_workflow_group_required",
        "field_group": "mailbox_application",
        "origin_class": "official_mailbox_form",
        "label": "Workflow group required associating to your mailbox",
        "required_mode": "actual_provider_strategy_later",
        "value_shape": "string_list",
        "value_examples": "WG_HUB_PRACTICE_VISIBILITY",
        "purpose": "List the workflow group or groups needed for the mailbox application.",
        "notes": "Official mailbox form field.",
    },
    {
        "field_id": "fld_data_usage_summary",
        "field_group": "mailbox_application",
        "origin_class": "official_mailbox_form",
        "label": "What type of data will you be sending or receiving via MESH",
        "required_mode": "actual_provider_strategy_later",
        "value_shape": "text",
        "value_examples": "Practice continuity notices and pharmacy referral messages",
        "purpose": "Describe the transfer content at a MESH level.",
        "notes": "Official mailbox form field.",
    },
    {
        "field_id": "fld_existing_mailbox_clone",
        "field_group": "mailbox_application",
        "origin_class": "official_mailbox_form",
        "label": "A current mailbox ID that sends and receives similar data",
        "required_mode": "conditional_actual_provider_strategy_later",
        "value_shape": "string",
        "value_examples": "MAILBOX123",
        "purpose": "Reference an existing mailbox when cloning a similar setup.",
        "notes": "Official mailbox form field.",
    },
    {
        "field_id": "fld_approx_file_size",
        "field_group": "mailbox_application",
        "origin_class": "official_mailbox_form",
        "label": "Approximate file sizes",
        "required_mode": "actual_provider_strategy_later",
        "value_shape": "enum",
        "value_examples": "less_than_50mb | between_50_and_100mb | between_100mb_and_20gb",
        "purpose": "Declare expected transfer size.",
        "notes": "Official mailbox form field.",
    },
    {
        "field_id": "fld_api_csr_subject",
        "field_group": "mailbox_application",
        "origin_class": "official_mailbox_form",
        "label": "API only CSR subject common name",
        "required_mode": "conditional_actual_provider_strategy_later",
        "value_shape": "string",
        "value_examples": "SERVER001.VEC01.api.mesh-client.nhs.uk",
        "purpose": "Provide CSR subject when requesting Path to Live API testing.",
        "notes": "Official mailbox form field.",
    },
    {
        "field_id": "fld_path_to_live_client_keystore",
        "field_group": "mailbox_application",
        "origin_class": "official_mailbox_form",
        "label": "Client Path to Live keystore and password need",
        "required_mode": "conditional_actual_provider_strategy_later",
        "value_shape": "text",
        "value_examples": "integration keystore required",
        "purpose": "Track client-specific Path to Live access prerequisites.",
        "notes": "Official mailbox form field.",
    },
    {
        "field_id": "fld_path_to_live_ui_smartcard",
        "field_group": "mailbox_application",
        "origin_class": "official_mailbox_form",
        "label": "UI Path to Live smartcard need",
        "required_mode": "conditional_actual_provider_strategy_later",
        "value_shape": "text",
        "value_examples": "HSCN smartcard required",
        "purpose": "Track UI-specific Path to Live access prerequisites.",
        "notes": "Official mailbox form field.",
    },
    {
        "field_id": "fld_pid_statement_acceptance",
        "field_group": "mailbox_application",
        "origin_class": "official_mailbox_form",
        "label": "Statement on patient identifiable data acceptance",
        "required_mode": "actual_provider_strategy_later",
        "value_shape": "boolean",
        "value_examples": "true",
        "purpose": "Record the required acceptance of the patient identifiable data statement.",
        "notes": "Official mailbox form field.",
    },
    {
        "field_id": "fld_requester_name",
        "field_group": "workflow_request",
        "origin_class": "official_workflow_request_form",
        "label": "Your name",
        "required_mode": "conditional_actual_provider_strategy_later",
        "value_shape": "string",
        "value_examples": "Workflow requester",
        "purpose": "Identify the person raising the workflow request or amendment.",
        "notes": "Official workflow request field.",
    },
    {
        "field_id": "fld_requester_email",
        "field_group": "workflow_request",
        "origin_class": "official_workflow_request_form",
        "label": "Email address",
        "required_mode": "conditional_actual_provider_strategy_later",
        "value_shape": "string",
        "value_examples": "workflow.requester@example.invalid",
        "purpose": "Provide requester email for workflow request processing.",
        "notes": "Official workflow request field.",
    },
    {
        "field_id": "fld_requester_phone",
        "field_group": "workflow_request",
        "origin_class": "official_workflow_request_form",
        "label": "Your telephone number",
        "required_mode": "conditional_actual_provider_strategy_later",
        "value_shape": "string",
        "value_examples": "+44 20 7946 0200",
        "purpose": "Provide requester phone for workflow request processing.",
        "notes": "Official workflow request field.",
    },
    {
        "field_id": "fld_workflow_request_type",
        "field_group": "workflow_request",
        "origin_class": "official_workflow_request_form",
        "label": "Amendment to existing mailbox or new workflow request",
        "required_mode": "conditional_actual_provider_strategy_later",
        "value_shape": "enum",
        "value_examples": "amendment | new_workflow_request",
        "purpose": "Declare whether the workflow request is new or an amendment.",
        "notes": "Official workflow request field.",
    },
    {
        "field_id": "fld_existing_mailbox_ids_for_amendment",
        "field_group": "workflow_request",
        "origin_class": "official_workflow_request_form",
        "label": "MESH mailbox IDs",
        "required_mode": "conditional_actual_provider_strategy_later",
        "value_shape": "string_list",
        "value_examples": "MAILBOX123",
        "purpose": "List existing mailbox IDs when the request is an amendment.",
        "notes": "Official workflow request field.",
    },
    {
        "field_id": "fld_mesh_team_contact",
        "field_group": "workflow_request",
        "origin_class": "official_workflow_request_form",
        "label": "Name of MESH team or SPINE DevOps contact",
        "required_mode": "conditional_actual_provider_strategy_later",
        "value_shape": "string",
        "value_examples": "Named MESH team contact",
        "purpose": "Record the prior liaison contact for new workflow requests.",
        "notes": "Official workflow request field.",
    },
    {
        "field_id": "fld_new_workflow_group_details",
        "field_group": "workflow_request",
        "origin_class": "official_workflow_request_form",
        "label": "New workflow group details",
        "required_mode": "conditional_actual_provider_strategy_later",
        "value_shape": "text",
        "value_examples": "Brief MESH transfer description and organisation pair",
        "purpose": "Describe the message or file transfer business flow for the requested group.",
        "notes": "Official workflow request field.",
    },
    {
        "field_id": "fld_new_workflow_id_details",
        "field_group": "workflow_request",
        "origin_class": "official_workflow_request_form",
        "label": "New workflow ID details",
        "required_mode": "conditional_actual_provider_strategy_later",
        "value_shape": "text",
        "value_examples": "Suggested workflow ID, initiator or responder posture, and brief transfer description",
        "purpose": "Describe each requested workflow ID and posture.",
        "notes": "Official workflow request field.",
    },
    {
        "field_id": "fld_route_trace_refs",
        "field_group": "internal_gate",
        "origin_class": "derived_internal_dossier",
        "label": "Traceable route family references",
        "required_mode": "mock_now_and_actual_later",
        "value_shape": "string_list",
        "value_examples": "rf_hub_queue; rf_pharmacy_console",
        "purpose": "Bind the mailbox and workflow request to concrete Vecells route families.",
        "notes": "Derived governance field.",
    },
    {
        "field_id": "fld_bounded_context_owner",
        "field_group": "internal_gate",
        "origin_class": "derived_internal_dossier",
        "label": "Bounded context owner",
        "required_mode": "mock_now_and_actual_later",
        "value_shape": "string",
        "value_examples": "hub_coordination",
        "purpose": "Name the owning bounded context for the workflow set.",
        "notes": "Derived governance field.",
    },
    {
        "field_id": "fld_path_to_live_without_mailbox_decision",
        "field_group": "internal_gate",
        "origin_class": "derived_internal_dossier",
        "label": "Path to Live without mailbox decision",
        "required_mode": "mock_now_and_actual_later",
        "value_shape": "enum",
        "value_examples": "local_sandbox_only | path_to_live_without_mailbox | mailbox_required_before_partner_test",
        "purpose": "Record whether rehearsal can progress without a mailbox request.",
        "notes": "Derived governance field.",
    },
    {
        "field_id": "fld_named_approver",
        "field_group": "internal_gate",
        "origin_class": "derived_internal_dossier",
        "label": "Named approver",
        "required_mode": "actual_provider_strategy_later",
        "value_shape": "string",
        "value_examples": "ROLE_OPERATIONS_LEAD",
        "purpose": "Name the explicit approver for any real mailbox or workflow request.",
        "notes": "Derived governance field.",
    },
    {
        "field_id": "fld_environment_target_confirmed",
        "field_group": "internal_gate",
        "origin_class": "derived_internal_dossier",
        "label": "Environment target confirmed",
        "required_mode": "actual_provider_strategy_later",
        "value_shape": "string",
        "value_examples": "path_to_live_integration",
        "purpose": "Confirm the exact target environment for the real request.",
        "notes": "Derived governance field.",
    },
    {
        "field_id": "fld_allow_real_mutation",
        "field_group": "internal_gate",
        "origin_class": "derived_internal_dossier",
        "label": "ALLOW_REAL_PROVIDER_MUTATION",
        "required_mode": "actual_provider_strategy_later",
        "value_shape": "boolean",
        "value_examples": "false",
        "purpose": "Hard gate any real mailbox or workflow request submission.",
        "notes": "Derived governance field.",
    },
    {
        "field_id": "fld_allow_spend",
        "field_group": "internal_gate",
        "origin_class": "derived_internal_dossier",
        "label": "ALLOW_SPEND",
        "required_mode": "actual_provider_strategy_later",
        "value_shape": "boolean",
        "value_examples": "false",
        "purpose": "Hard gate any path that could trigger managed-service or commercial cost.",
        "notes": "Derived governance field.",
    },
    {
        "field_id": "fld_minimum_necessary_review",
        "field_group": "internal_gate",
        "origin_class": "derived_internal_dossier",
        "label": "Minimum necessary payload review",
        "required_mode": "actual_provider_strategy_later",
        "value_shape": "text",
        "value_examples": "Current payload minimisation review attached",
        "purpose": "Show that mailbox usage is tied to minimum-necessary content review.",
        "notes": "Derived governance field.",
    },
    {
        "field_id": "fld_target_proof_class",
        "field_group": "internal_gate",
        "origin_class": "derived_internal_dossier",
        "label": "Target proof class after send",
        "required_mode": "mock_now_and_actual_later",
        "value_shape": "string",
        "value_examples": "PracticeAcknowledgementRecord",
        "purpose": "Force explicit proof-vs-acceptance reasoning per workflow row.",
        "notes": "Derived governance field.",
    },
    {
        "field_id": "fld_live_api_onboarding_complete",
        "field_group": "internal_gate",
        "origin_class": "derived_internal_dossier",
        "label": "Live API onboarding complete",
        "required_mode": "actual_provider_strategy_later",
        "value_shape": "boolean",
        "value_examples": "false",
        "purpose": "Record the prerequisite called out by the mailbox form for live API mailbox requests.",
        "notes": "Derived governance field.",
    },
    {
        "field_id": "fld_live_gate_bundle_ref",
        "field_group": "internal_gate",
        "origin_class": "derived_internal_dossier",
        "label": "Live gate bundle reference",
        "required_mode": "actual_provider_strategy_later",
        "value_shape": "string",
        "value_examples": "mesh_live_gate_checklist.json",
        "purpose": "Bind the dossier to the gate checklist and blocked status.",
        "notes": "Derived governance field.",
    },
]

LIVE_GATES = [
    {
        "gate_id": "MESH_LIVE_GATE_PHASE0_EXTERNAL_READY",
        "title": "Current-baseline external readiness gate cleared",
        "status": "blocked",
        "reason": "Phase 0 entry remains withheld and GATE_EXTERNAL_TO_FOUNDATION is still blocked.",
        "evidence_refs": ["phase0_gate_verdict.json"],
        "env_refs": [],
    },
    {
        "gate_id": "MESH_LIVE_GATE_WORKFLOW_SET_TRACEABLE",
        "title": "Workflow set is source traceable to bounded-context needs",
        "status": "pass",
        "reason": "Every candidate workflow row is bound to route families, bounded contexts, and business-flow summaries.",
        "evidence_refs": ["mesh_workflow_registry.csv", "mesh_message_route_matrix.csv"],
        "env_refs": [],
    },
    {
        "gate_id": "MESH_LIVE_GATE_OWNER_ODS_KNOWN",
        "title": "Mailbox owner ODS posture is known",
        "status": "review_required",
        "reason": "Placeholder ODS rows exist in the pack, but partner-specific owner ODS still needs confirmation before real submission.",
        "evidence_refs": ["mesh_mailbox_field_map.json"],
        "env_refs": ["MESH_MAILBOX_OWNER_ODS"],
    },
    {
        "gate_id": "MESH_LIVE_GATE_MANAGER_MODE_DECIDED",
        "title": "Third-party mailbox manager posture is decided",
        "status": "review_required",
        "reason": "The form shape and register exist, but the real owner-managed versus third-party-managed posture is still placeholder-only.",
        "evidence_refs": ["mesh_mailbox_field_map.json", "28_mesh_live_gate_and_approval_strategy.md"],
        "env_refs": ["MESH_MANAGING_PARTY_MODE"],
    },
    {
        "gate_id": "MESH_LIVE_GATE_PATH_TO_LIVE_NEED_STATED",
        "title": "Path to Live versus local sandbox posture is explicit",
        "status": "pass",
        "reason": "The pack separates local sandbox, Path to Live-like rehearsal, and live mailbox need by workflow row and gate policy.",
        "evidence_refs": ["mesh_workflow_registry.csv", "28_mesh_mock_mailroom_spec.md"],
        "env_refs": [],
    },
    {
        "gate_id": "MESH_LIVE_GATE_API_ONBOARDING_COMPLETE",
        "title": "Live API onboarding is complete for any live API mailbox request",
        "status": "blocked",
        "reason": "Official guidance requires API onboarding before a live MESH API mailbox, and that onboarding is not yet complete.",
        "evidence_refs": ["28_mesh_mailbox_application_field_map.md"],
        "env_refs": ["MESH_API_ONBOARDING_COMPLETE"],
    },
    {
        "gate_id": "MESH_LIVE_GATE_MESH_TEAM_LIAISON_READY",
        "title": "Workflow request liaison with MESH or Spine DevOps is recorded",
        "status": "review_required",
        "reason": "The workflow-request dossier is prepared, but the named MESH-team contact is still empty.",
        "evidence_refs": ["28_mesh_workflow_group_and_id_registry.md"],
        "env_refs": ["MESH_WORKFLOW_TEAM_CONTACT"],
    },
    {
        "gate_id": "MESH_LIVE_GATE_NAMED_APPROVER_PRESENT",
        "title": "Named approver and environment target are present",
        "status": "blocked",
        "reason": "Real submission remains fail-closed until a named approver and target environment are explicitly provided.",
        "evidence_refs": ["mesh_live_gate_checklist.json"],
        "env_refs": ["MESH_NAMED_APPROVER", "MESH_ENVIRONMENT_TARGET"],
    },
    {
        "gate_id": "MESH_LIVE_GATE_MUTATION_AND_SPEND_ACK",
        "title": "Real mutation and spend acknowledgements are enabled",
        "status": "blocked",
        "reason": "Any real mailbox or workflow submission remains blocked until both mutation and spend guards are explicitly enabled when applicable.",
        "evidence_refs": ["mesh_live_gate_checklist.json"],
        "env_refs": ["ALLOW_REAL_PROVIDER_MUTATION", "ALLOW_SPEND"],
    },
    {
        "gate_id": "MESH_LIVE_GATE_MINIMUM_NECESSARY_REVIEW",
        "title": "Minimum-necessary payload and proof review is current",
        "status": "review_required",
        "reason": "The route matrix encodes the proof law, but a live payload minimisation review is not yet attached.",
        "evidence_refs": ["mesh_message_route_matrix.csv", "28_mesh_message_route_and_proof_matrix.md"],
        "env_refs": ["MESH_MINIMUM_NECESSARY_REVIEW_REF"],
    },
    {
        "gate_id": "MESH_LIVE_GATE_FINAL_POSTURE",
        "title": "Current submission posture",
        "status": "blocked",
        "reason": "The pack is ready for mock-now execution and dry-run preparation only; live mailbox and workflow submission stays blocked.",
        "evidence_refs": ["phase0_gate_verdict.json", "mesh_live_gate_checklist.json"],
        "env_refs": [],
    },
]

MOCK_SCENARIOS = [
    {
        "scenario_id": "happy_path",
        "label": "Happy path",
        "message_outcome": "settled_or_recovered",
        "timeline_tail": "settled_or_recovered",
        "description": "Transport accepted, recipient picks up, and current business proof lands on the same generation.",
        "operator_warning": "Still preserve transport and proof as separate events.",
    },
    {
        "scenario_id": "delayed_ack",
        "label": "Delayed acknowledgement",
        "message_outcome": "proof_pending",
        "timeline_tail": "proof_pending",
        "description": "Transport accepts and recipient picks up, but business acknowledgement or downstream proof is still pending.",
        "operator_warning": "Do not imply calmness or closure.",
    },
    {
        "scenario_id": "duplicate_delivery",
        "label": "Duplicate delivery",
        "message_outcome": "recovery_required",
        "timeline_tail": "settled_or_recovered",
        "description": "A duplicate or repeated receipt arrives for the same canonicalDispatchKey and must be attached to replay evidence rather than flattened.",
        "operator_warning": "Requires replay review and duplicate suppression.",
    },
    {
        "scenario_id": "expired_pickup",
        "label": "Expired pickup window",
        "message_outcome": "expired",
        "timeline_tail": "settled_or_recovered",
        "description": "The recipient does not retrieve the message inside the allowed window and a non-delivery report is raised.",
        "operator_warning": "Expiry is distinct from failure or quarantine.",
    },
    {
        "scenario_id": "quarantine_attachment",
        "label": "Attachment quarantine",
        "message_outcome": "quarantined",
        "timeline_tail": "settled_or_recovered",
        "description": "The message or related attachment is quarantined and requires explicit support handling.",
        "operator_warning": "Quarantine must remain first class.",
    },
    {
        "scenario_id": "replay_guard",
        "label": "Replay guard",
        "message_outcome": "replay_blocked",
        "timeline_tail": "settled_or_recovered",
        "description": "A replay or resend attempt collides with a previous message generation and is fenced behind replay review.",
        "operator_warning": "Replay block is not a generic transport error.",
    },
]

SEEDED_MESSAGES = [
    {
        "message_id": "MSG-HUB-0001",
        "message_ref": "hub-notice-001",
        "workflow_id": "VEC_HUB_BOOKING_NOTICE",
        "from_mailbox_key": "MBX_VEC_HUB",
        "to_mailbox_key": "MBX_PRACTICE_PROXY",
        "scenario_id": "delayed_ack",
        "status": "proof_pending",
        "authoritative_truth_state": "acknowledgement_debt_open",
        "proof_state": "business_ack_pending",
        "attachment_state": "none",
        "created_at": "2026-04-09T09:20:00Z",
        "summary": "Hub continuity notice accepted by transport, but practice business acknowledgement is still pending.",
    },
    {
        "message_id": "MSG-HUB-0002",
        "message_ref": "hub-ack-duplicate-002",
        "workflow_id": "VEC_HUB_BOOKING_ACK",
        "from_mailbox_key": "MBX_PRACTICE_PROXY",
        "to_mailbox_key": "MBX_VEC_HUB",
        "scenario_id": "duplicate_delivery",
        "status": "recovery_required",
        "authoritative_truth_state": "duplicate_under_review",
        "proof_state": "duplicate_receipt_seen",
        "attachment_state": "none",
        "created_at": "2026-04-09T09:48:00Z",
        "summary": "Practice ACK arrived twice and is fenced behind replay evidence review.",
    },
    {
        "message_id": "MSG-PHARM-0003",
        "message_ref": "referral-003",
        "workflow_id": "VEC_PF_REFERRAL_INIT",
        "from_mailbox_key": "MBX_VEC_PHARMACY",
        "to_mailbox_key": "MBX_PHARMACY_PROXY",
        "scenario_id": "happy_path",
        "status": "settled_or_recovered",
        "authoritative_truth_state": "dispatch_proof_current",
        "proof_state": "authoritative_dispatch_proof_seen",
        "attachment_state": "clean",
        "created_at": "2026-04-09T10:12:00Z",
        "summary": "Referral package dispatched with accepted business proof on the current tuple.",
    },
    {
        "message_id": "MSG-PHARM-0004",
        "message_ref": "outcome-004",
        "workflow_id": "VEC_PF_OUTCOME_RESP",
        "from_mailbox_key": "MBX_PHARMACY_PROXY",
        "to_mailbox_key": "MBX_VEC_PHARMACY",
        "scenario_id": "expired_pickup",
        "status": "expired",
        "authoritative_truth_state": "outcome_missing",
        "proof_state": "non_delivery_reported",
        "attachment_state": "none",
        "created_at": "2026-04-09T11:03:00Z",
        "summary": "Pharmacy outcome was not picked up in time and generated an explicit expiry posture.",
    },
    {
        "message_id": "MSG-SUP-0005",
        "message_ref": "quarantine-005",
        "workflow_id": "VEC_ATTACHMENT_QUARANTINE",
        "from_mailbox_key": "MBX_VEC_PHARMACY",
        "to_mailbox_key": "MBX_VEC_SUPPORT",
        "scenario_id": "quarantine_attachment",
        "status": "quarantined",
        "authoritative_truth_state": "artifact_blocked",
        "proof_state": "quarantine_manifest_current",
        "attachment_state": "quarantined",
        "created_at": "2026-04-09T11:44:00Z",
        "summary": "Attachment manifest quarantined and routed to support review.",
    },
    {
        "message_id": "MSG-SUP-0006",
        "message_ref": "replay-006",
        "workflow_id": "VEC_REPLAY_EVIDENCE_REQUEST",
        "from_mailbox_key": "MBX_VEC_SUPPORT",
        "to_mailbox_key": "MBX_VEC_HUB",
        "scenario_id": "replay_guard",
        "status": "replay_blocked",
        "authoritative_truth_state": "replay_review_open",
        "proof_state": "collision_detected",
        "attachment_state": "none",
        "created_at": "2026-04-09T12:10:00Z",
        "summary": "Replay-safe resend blocked until duplicate evidence review resolves the generation collision.",
    },
]

TIMELINE_TEMPLATE = [
    "compose",
    "submit",
    "accepted",
    "picked_up",
    "proof_pending",
    "settled_or_recovered",
]


def assert_true(condition: bool, message: str) -> None:
    if not condition:
        raise SystemExit(message)


def load_json(path: Path) -> Any:
    return json.loads(path.read_text())


def load_csv(path: Path) -> list[dict[str, str]]:
    with path.open() as handle:
        return list(csv.DictReader(handle))


def write_text(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content.strip() + "\n")


def write_json(path: Path, payload: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2) + "\n")


def write_csv(path: Path, rows: list[dict[str, Any]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    assert_true(bool(rows), f"Cannot write empty CSV to {path}")
    with path.open("w", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=list(rows[0].keys()))
        writer.writeheader()
        for row in rows:
            writer.writerow(row)


def write_ts_export(path: Path, export_name: str, payload: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(
        f"export const {export_name} = {json.dumps(payload, indent=2)} as const;\n",
    )


def markdown_table(rows: list[dict[str, Any]], columns: list[str]) -> str:
    header = "| " + " | ".join(columns) + " |"
    divider = "| " + " | ".join(["---"] * len(columns)) + " |"
    body = []
    for row in rows:
        body.append("| " + " | ".join(str(row.get(column, "")).replace("\n", "<br>") for column in columns) + " |")
    return "\n".join([header, divider, *body])


def ensure_inputs() -> dict[str, Any]:
    missing = [name for name, path in REQUIRED_INPUTS.items() if not path.exists()]
    assert_true(not missing, "Missing seq_028 prerequisites: " + ", ".join(sorted(missing)))

    inputs: dict[str, Any] = {}
    for name, path in REQUIRED_INPUTS.items():
        if path.suffix == ".csv":
            inputs[name] = load_csv(path)
        else:
            inputs[name] = load_json(path)

    assert_true(
        inputs["coverage_summary"]["summary"]["requirements_with_gaps_count"] == 0,
        "Traceability gaps reopened upstream.",
    )
    assert_true(
        inputs["phase0_gate_verdict"]["summary"]["phase0_entry_verdict"] == "withheld",
        "seq_028 expects Phase 0 to remain withheld.",
    )

    integration_families = inputs["integration_priority_matrix"].get("integration_families", [])
    assert_true(
        any(row["integration_id"] == "int_cross_org_secure_messaging" for row in integration_families),
        "Cross-org secure messaging family missing from integration priority matrix.",
    )
    return inputs


def route_name_map(route_rows: list[dict[str, str]]) -> dict[str, str]:
    return {row["route_family_id"]: row["route_family"] for row in route_rows}


def select_rows(rows: list[dict[str, Any]], key: str, values: set[str]) -> list[dict[str, Any]]:
    return [row for row in rows if row[key] in values]


def build_live_gate_pack() -> dict[str, Any]:
    blocked_count = sum(1 for gate in LIVE_GATES if gate["status"] == "blocked")
    review_count = sum(1 for gate in LIVE_GATES if gate["status"] == "review_required")
    pass_count = sum(1 for gate in LIVE_GATES if gate["status"] == "pass")
    return {
        "current_submission_posture": "blocked",
        "required_env": [
            "MESH_NAMED_APPROVER",
            "MESH_ENVIRONMENT_TARGET",
            "MESH_MAILBOX_OWNER_ODS",
            "MESH_MANAGING_PARTY_MODE",
            "MESH_WORKFLOW_TEAM_CONTACT",
            "MESH_API_ONBOARDING_COMPLETE",
            "MESH_MINIMUM_NECESSARY_REVIEW_REF",
            "ALLOW_REAL_PROVIDER_MUTATION",
            "ALLOW_SPEND",
        ],
        "selector_map": {
            "base_profile": {
                "mode_toggle_actual": "[data-testid='mode-toggle-actual']",
                "page_tab_application_pack": "[data-testid='page-tab-Mailbox_Application_Pack']",
                "page_tab_registry": "[data-testid='page-tab-Workflow_Registry']",
                "mailbox_button": "[data-testid='mailbox-button-MBX_VEC_HUB']",
                "workflow_row": "[data-testid='workflow-row-VEC_HUB_BOOKING_NOTICE']",
                "field_approver": "[data-testid='actual-field-named-approver']",
                "field_environment": "[data-testid='actual-field-environment-target']",
                "field_owner_ods": "[data-testid='actual-field-owner-ods']",
                "field_manager_mode": "[data-testid='actual-field-manager-mode']",
                "field_workflow_contact": "[data-testid='actual-field-workflow-contact']",
                "field_allow_mutation": "[data-testid='actual-field-allow-mutation']",
                "field_allow_spend": "[data-testid='actual-field-allow-spend']",
                "final_submit": "[data-testid='actual-submit-button']",
            }
        },
        "official_label_checks": {
            "mailbox_form": [
                "Path to live - integration",
                "MESH API",
                "3rd party organisation name",
                "API only: for testing in a Path to Live environment, create a CSR and paste here",
            ],
            "workflow_form": [
                "New workflow request",
                "MESH mailbox ID(s)",
                "Name of MESH team or SPINE DevOps contact this request has been discussed with",
                "Initiator or Responder",
            ],
        },
        "live_gates": LIVE_GATES,
        "summary": {
            "live_gate_count": len(LIVE_GATES),
            "blocked_count": blocked_count,
            "review_required_count": review_count,
            "pass_count": pass_count,
            "current_submission_posture": "blocked",
        },
    }


def build_pack(inputs: dict[str, Any]) -> dict[str, Any]:
    route_names = route_name_map(inputs["route_family_inventory"])
    for row in MESSAGE_ROUTE_ROWS:
        assert_true(
            row["route_family_ref"] in route_names,
            f"Route family missing from inventory: {row['route_family_ref']}",
        )

    risk_ids = {
        "HZ_DUPLICATE_SUPPRESSION_OR_MERGE",
        "RISK_EXT_MESH_DELAY",
        "RISK_BOOKING_002",
        "RISK_RECOVERY_001",
        "RISK_OWNERSHIP_003",
        "HZ_WRONG_PATIENT_BINDING",
    }
    secret_ids = {
        "KEY_MESH_SHARED_DEV_TRANSPORT_CERT",
        "ACC_MESH_SHARED_DEV_MAILBOX",
        "ACC_PRACTICE_ACK_INTEGRATION_MAILBOX",
        "ACC_MESH_PREPROD_MAILBOX",
        "KEY_MESH_PRODUCTION_TRANSPORT_CERT",
    }
    touchpoint_ids = {
        "ext_practice_ack_delivery_rail",
        "ext_pharmacy_dispatch_transport",
        "ext_pharmacy_outcome_ingest",
    }
    integration_family = next(
        row
        for row in inputs["integration_priority_matrix"]["integration_families"]
        if row["integration_id"] == "int_cross_org_secure_messaging"
    )
    live_gate_pack = build_live_gate_pack()
    selected_risks = select_rows(inputs["master_risk_register"]["risks"], "risk_id", risk_ids)
    selected_touchpoints = select_rows(inputs["external_touchpoint_matrix"], "touchpoint_id", touchpoint_ids)
    selected_secrets = select_rows(inputs["secret_ownership_map"]["account_inventory"], "account_or_secret_id", secret_ids)

    workflow_group_count = len({row["workflow_group"] for row in WORKFLOW_ROWS})
    field_group_count = len({row["field_group"] for row in FIELD_ROWS})
    official_mailbox_field_count = sum(1 for row in FIELD_ROWS if row["origin_class"] == "official_mailbox_form")
    official_workflow_field_count = sum(
        1 for row in FIELD_ROWS if row["origin_class"] == "official_workflow_request_form"
    )
    derived_field_count = sum(1 for row in FIELD_ROWS if row["origin_class"] == "derived_internal_dossier")

    return {
        "task_id": TASK_ID,
        "generated_at": datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z"),
        "visual_mode": VISUAL_MODE,
        "mission": MISSION,
        "phase0_verdict": inputs["phase0_gate_verdict"]["summary"]["phase0_entry_verdict"],
        "source_precedence": SOURCE_PRECEDENCE,
        "assumptions": ASSUMPTIONS,
        "official_guidance": OFFICIAL_GUIDANCE,
        "integration_family": integration_family,
        "mailboxes": MAILBOX_ROWS,
        "workflow_rows": WORKFLOW_ROWS,
        "route_rows": MESSAGE_ROUTE_ROWS,
        "field_map": {
            "fields": FIELD_ROWS,
            "sections": [
                {
                    "section_id": "mailbox_application",
                    "label": "Apply for a MESH mailbox",
                    "field_ids": [row["field_id"] for row in FIELD_ROWS if row["field_group"] == "mailbox_application"],
                },
                {
                    "section_id": "workflow_request",
                    "label": "New workflow request or workflow amendment",
                    "field_ids": [row["field_id"] for row in FIELD_ROWS if row["field_group"] == "workflow_request"],
                },
                {
                    "section_id": "internal_gate",
                    "label": "Vecells live gate dossier",
                    "field_ids": [row["field_id"] for row in FIELD_ROWS if row["field_group"] == "internal_gate"],
                },
            ],
            "summary": {
                "field_count": len(FIELD_ROWS),
                "field_group_count": field_group_count,
                "official_mailbox_field_count": official_mailbox_field_count,
                "official_workflow_request_field_count": official_workflow_field_count,
                "derived_field_count": derived_field_count,
            },
        },
        "live_gate_pack": live_gate_pack,
        "timeline_template": TIMELINE_TEMPLATE,
        "mock_service": {
            "service_name": "mock-mesh",
            "base_url_default": "http://127.0.0.1:4178",
            "scenarios": MOCK_SCENARIOS,
            "seeded_messages": SEEDED_MESSAGES,
            "mock_now_support_notes": [
                "Local sandbox mode exercises full transport proof states without claiming real onboarding.",
                "Path-to-live-like mode increases expiry pressure and mailbox-manager controls but still uses placeholders only.",
                "No real mailbox IDs, real credentials, or real workflow approvals are stored in repo state.",
            ],
        },
        "selected_touchpoints": selected_touchpoints,
        "selected_risks": selected_risks,
        "selected_secret_inventory": selected_secrets,
        "summary": {
            "mailbox_count": len(MAILBOX_ROWS),
            "workflow_group_count": workflow_group_count,
            "workflow_row_count": len(WORKFLOW_ROWS),
            "route_row_count": len(MESSAGE_ROUTE_ROWS),
            "field_count": len(FIELD_ROWS),
            "live_gate_count": len(LIVE_GATES),
            "blocked_live_gate_count": live_gate_pack["summary"]["blocked_count"],
            "review_live_gate_count": live_gate_pack["summary"]["review_required_count"],
            "pass_live_gate_count": live_gate_pack["summary"]["pass_count"],
            "scenario_count": len(MOCK_SCENARIOS),
            "seeded_message_count": len(SEEDED_MESSAGES),
            "selected_risk_count": len(selected_risks),
            "selected_secret_count": len(selected_secrets),
            "selected_touchpoint_count": len(selected_touchpoints),
        },
    }


def render_mock_spec(pack: dict[str, Any]) -> str:
    mailbox_rows = [
        {
            "mailbox_id": row["mailbox_id"],
            "display_name": row["display_name"],
            "manager_mode": row["manager_mode"],
            "environment_band": row["environment_band"],
            "workflow_keys": row["workflow_keys"],
        }
        for row in pack["mailboxes"]
    ]
    scenario_rows = [
        {
            "scenario_id": row["scenario_id"],
            "label": row["label"],
            "message_outcome": row["message_outcome"],
            "operator_warning": row["operator_warning"],
        }
        for row in pack["mock_service"]["scenarios"]
    ]
    return textwrap.dedent(
        f"""
        # 28 Mesh Mock Mailroom Spec

        `Task:` `{pack["task_id"]}`  
        `Visual mode:` `{pack["visual_mode"]}`

        Create a premium internal MESH mailroom that keeps transport acceptance, business acknowledgement, downstream proof, and canonical settlement visibly separate.

        Section A — `Mock_now_execution`

        The local `mock-mesh` twin is the executable transport seam for current work. It must model mailbox identity, workflow restrictions, delayed acknowledgement, duplicate delivery, replay fencing, expiry, pickup, and attachment quarantine without claiming that MESH transport success equals business truth.

        ## Mailbox inventory

        {markdown_table(mailbox_rows, ["mailbox_id", "display_name", "manager_mode", "environment_band", "workflow_keys"])}

        ## Behaviour contract

        - Mailbox registration, ownership ODS, and third-party manager posture are first-class facts.
        - Workflow IDs are validated before dispatch. Unknown IDs, wrong-direction IDs, or mailbox-ID mismatches are rejected explicitly.
        - Timeline law stays fixed as `compose -> submit -> accepted -> picked_up -> proof_pending -> settled_or_recovered`, but individual scenarios can branch into `expired`, `quarantined`, `replay_blocked`, or `recovery_required`.
        - Attachment quarantine, duplicate delivery, and replay guard remain separate states.
        - Local sandbox mode and path-to-live-like mode are distinct simulator postures.
        - Patient-facing calmness and canonical closure stay blocked until the downstream proof class required by the route matrix is current.

        ## Scenario coverage

        {markdown_table(scenario_rows, ["scenario_id", "label", "message_outcome", "operator_warning"])}

        ## Premium mailroom console contract

        - The left rail is mailbox-first and shows owner ODS, manager posture, and workflow health.
        - The centre workbench is timeline-first and exposes message composition, submission, pickup, and proof debt.
        - The right inspector is proof-first and explains why transport evidence is weaker than authoritative downstream truth.
        - The lower strip preserves the restrained transport-line diagram and makes replay, expiry, and quarantine visibly distinct.

        Section B — `Actual_provider_strategy_later`

        The same registry drives the live-later dossier. The official mailbox form, workflow-request form, and internal live gate are separate checkpoints. Vecells may rehearse locally now and in Path-to-Live-like mode later, but the pack intentionally blocks any real mailbox or workflow request until the current live gate clears.
        """
    )


def render_field_map_doc(pack: dict[str, Any]) -> str:
    sections = pack["field_map"]["sections"]
    output = [
        "# 28 Mesh Mailbox Application Field Map",
        "",
        "Section A — `Mock_now_execution`",
        "",
        "The mock-now pack carries placeholder-safe fields for ownership, route traceability, and proof class selection so the team can rehearse application and workflow-request preparation without real provider mutation.",
        "",
        "Section B — `Actual_provider_strategy_later`",
        "",
        "The live-later dossier binds the public mailbox and workflow-request forms to Vecells governance fields.",
        "",
    ]
    for section in sections:
        output.append(f"## {section['label']}")
        output.append("")
        rows = [row for row in pack["field_map"]["fields"] if row["field_id"] in section["field_ids"]]
        output.append(
            markdown_table(
                rows,
                ["field_id", "label", "origin_class", "required_mode", "value_examples", "purpose"],
            )
        )
        output.append("")
    return "\n".join(output)


def render_workflow_doc(pack: dict[str, Any]) -> str:
    rows = [
        {
            "workflow_group": row["workflow_group"],
            "workflow_id": row["workflow_id"],
            "workflow_role": row["workflow_role"],
            "message_family": row["message_family"],
            "mailbox_direction": row["mailbox_direction"],
            "approval_posture": row["approval_posture"],
        }
        for row in pack["workflow_rows"]
    ]
    return textwrap.dedent(
        f"""
        # 28 Mesh Workflow Group And ID Registry

        Section A — `Mock_now_execution`

        The registry below is the control-plane source for the mock twin and mailroom console. Every row exists because a bounded-context flow needs it. No row implies that the workflow ID is already approved by MESH.

        {markdown_table(rows, ["workflow_group", "workflow_id", "workflow_role", "message_family", "mailbox_direction", "approval_posture"])}

        ## Registry law

        - Every workflow row carries a business-flow statement, proof target, fallback, and directionality rule.
        - Candidate IDs must be mapped to an existing approved workflow or requested through the official workflow-request process.
        - Business acknowledgements remain distinct from mailbox download acknowledgement.

        Section B — `Actual_provider_strategy_later`

        Before any real workflow request, Vecells must confirm whether each candidate row maps to an existing workflow workbook entry or requires a new-group or new-ID request with prior MESH-team liaison. The official workflow request requires a concise MESH-side transfer description and explicit initiator or responder posture for each requested ID.
        """
    )


def render_route_doc(pack: dict[str, Any]) -> str:
    rows = [
        {
            "route_family_ref": row["route_family_ref"],
            "message_family": row["message_family"],
            "preferred_workflow_id": row["preferred_workflow_id"],
            "transport_acceptance_signal": row["transport_acceptance_signal"],
            "authoritative_downstream_proof": row["authoritative_downstream_proof"],
        }
        for row in pack["route_rows"]
    ]
    return textwrap.dedent(
        f"""
        # 28 Mesh Message Route And Proof Matrix

        Section A — `Mock_now_execution`

        The route matrix enforces the mandatory gap closure: message accepted is not workflow complete.

        {markdown_table(rows, ["route_family_ref", "message_family", "preferred_workflow_id", "transport_acceptance_signal", "authoritative_downstream_proof"])}

        ## Guardrails

        - Transport acceptance, mailbox pickup, business acknowledgement, and authoritative downstream proof are separate facts.
        - Canonical request truth changes only after the bounded-context proof class required by the route is current.
        - Duplicate, expired, quarantined, and replay-blocked states must remain visible and operator-actionable.

        Section B — `Actual_provider_strategy_later`

        The same matrix drives the live-later minimum-necessary review and business-flow statement for each mailbox and workflow request. Any live route must explicitly name its authoritative downstream proof class before the request can be submitted.
        """
    )


def render_live_gate_doc(pack: dict[str, Any]) -> str:
    gate_rows = [
        {
            "gate_id": row["gate_id"],
            "status": row["status"],
            "title": row["title"],
            "reason": row["reason"],
        }
        for row in pack["live_gate_pack"]["live_gates"]
    ]
    required_env = ", ".join(f"`{item}`" for item in pack["live_gate_pack"]["required_env"])
    return textwrap.dedent(
        f"""
        # 28 Mesh Live Gate And Approval Strategy

        Section A — `Mock_now_execution`

        Mock-now execution is fully enabled. The local twin, mailroom console, and dry-run harness work without real mailbox ownership, real credentials, or real workflow approval.

        Section B — `Actual_provider_strategy_later`

        Current posture: **blocked**.

        {markdown_table(gate_rows, ["gate_id", "status", "title", "reason"])}

        ## Required environment gates

        {required_env}

        ## Submission law

        - Do not submit a real mailbox request unless the workflow set is source-traceable.
        - Do not request a live API mailbox until API onboarding is complete.
        - Do not request new workflow IDs unless the MESH-team liaison and business-flow statement are present.
        - Do not mutate a real provider unless `ALLOW_REAL_PROVIDER_MUTATION=true`.
        - Do not proceed down any commercial or managed-service path unless `ALLOW_SPEND=true`.
        """
    )


def build_field_map_json(pack: dict[str, Any]) -> dict[str, Any]:
    return {
        "task_id": pack["task_id"],
        "visual_mode": pack["visual_mode"],
        "summary": pack["field_map"]["summary"],
        "sections": pack["field_map"]["sections"],
        "fields": pack["field_map"]["fields"],
        "official_guidance": [
            row["source_id"]
            for row in pack["official_guidance"]
            if row["source_id"]
            in {
                "official_mesh_ui_and_test_env",
                "official_mesh_mailbox_apply_form",
                "official_mesh_workflow_request_form",
            }
        ],
    }


def main() -> None:
    inputs = ensure_inputs()
    pack = build_pack(inputs)

    write_json(PACK_JSON_PATH, pack)
    write_json(FIELD_MAP_PATH, build_field_map_json(pack))
    write_csv(WORKFLOW_CSV_PATH, WORKFLOW_ROWS)
    write_csv(ROUTE_CSV_PATH, MESSAGE_ROUTE_ROWS)
    write_json(LIVE_GATE_PATH, pack["live_gate_pack"])

    write_text(MOCK_SPEC_DOC_PATH, render_mock_spec(pack))
    write_text(FIELD_MAP_DOC_PATH, render_field_map_doc(pack))
    write_text(WORKFLOW_DOC_PATH, render_workflow_doc(pack))
    write_text(ROUTE_DOC_PATH, render_route_doc(pack))
    write_text(LIVE_GATE_DOC_PATH, render_live_gate_doc(pack))

    write_json(APP_PACK_JSON_PATH, pack)
    write_ts_export(APP_PACK_TS_PATH, "meshExecutionPack", pack)

    summary = {
        "task_id": pack["task_id"],
        "generated_at": pack["generated_at"],
        "workflow_row_count": pack["summary"]["workflow_row_count"],
        "route_row_count": pack["summary"]["route_row_count"],
        "field_count": pack["summary"]["field_count"],
        "live_gate_count": pack["summary"]["live_gate_count"],
        "scenario_count": pack["summary"]["scenario_count"],
    }
    print(json.dumps(summary, indent=2))


if __name__ == "__main__":
    main()
