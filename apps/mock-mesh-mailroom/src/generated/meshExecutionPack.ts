export const meshExecutionPack = {
  "task_id": "seq_028",
  "generated_at": "2026-04-09T19:22:07Z",
  "visual_mode": "Signal_Post_Room",
  "mission": "Create the MESH execution pack with two explicit parts: a high-fidelity local MESH twin, mailroom console, and workflow registry now, and a gated real mailbox plus workflow onboarding strategy later.",
  "phase0_verdict": "withheld",
  "source_precedence": [
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
    "https://digital.nhs.uk/developer/api-catalogue/message-exchange-for-social-care-and-health-api"
  ],
  "assumptions": [
    {
      "assumption_id": "ASSUMPTION_VECELLS_WORKFLOW_IDS_ARE_CANDIDATE_REQUESTS_NOT_APPROVED_IDS",
      "summary": "The public MESH pages publish the rules and current workbook location, but this task does not pull the private or rapidly changing workflow spreadsheet into repo. The IDs below are therefore internal Vecells candidate requests unless later mapped to an existing approved workflow.",
      "consequence": "The registry is operationally useful now without falsely claiming mailbox-ready production IDs."
    },
    {
      "assumption_id": "ASSUMPTION_LOCAL_MESH_TWIN_MODELS_TRANSPORT_AND_PROOF_NOT_SPINE_BEHAVIOUR",
      "summary": "The local twin reproduces message-rail states, timing, replay, expiry, quarantine, and workflow validation, but it does not claim to emulate internal Spine infrastructure or hidden service-team controls.",
      "consequence": "The mock stays high fidelity for product behaviour while remaining honest about external service boundaries."
    },
    {
      "assumption_id": "ASSUMPTION_PATH_TO_LIVE_AND_LOCAL_SANDBOX_STAY_SEPARATE_DECISIONS",
      "summary": "Official guidance says API testing can begin in Path to Live integration without a mailbox and also points to local MESH-sandbox options. Vecells therefore records local sandbox, Path to Live-like rehearsal, and real mailbox application as distinct stages.",
      "consequence": "The mock and live-later strategy do not collapse 'test transport' into 'request mailbox now'."
    }
  ],
  "official_guidance": [
    {
      "source_id": "official_mesh_service_overview",
      "title": "Message Exchange for Social Care and Health (MESH)",
      "url": "https://digital.nhs.uk/services/message-exchange-for-social-care-and-health-mesh",
      "captured_on": "2026-04-09",
      "summary": "The service overview describes MESH as the nationally recognised mechanism for sharing data directly between health and care organisations, including system-to-system transfer via client or API and ad hoc transfer via the UI.",
      "grounding": [
        "MESH is positioned as a secure and reliable transport rail across organisations.",
        "The sender uploads to an outbox, MESH holds the message until retrieval, and the recipient acknowledges successful download.",
        "A non-delivery report is sent if the recipient does not retrieve the message within 5 days.",
        "Workflow IDs are routing controls and help recipients understand message type.",
        "CC and redirect rules are configured by the MESH service team, not by end users."
      ]
    },
    {
      "source_id": "official_mesh_ui_and_test_env",
      "title": "MESH User Interface (UI)",
      "url": "https://digital.nhs.uk/services/message-exchange-for-social-care-and-health-mesh/mesh-user-interface-ui",
      "captured_on": "2026-04-09",
      "summary": "The UI page explains test-environment usage, notes that Path to Live deployment is a common safe-space environment, and lists the baseline application details needed for a mailbox and UI account.",
      "grounding": [
        "Test environment use is recommended for learning and some programmes require test-first use.",
        "Path to Live deployment is named as a common test environment.",
        "Mailbox application needs ODS code, workflow groups and IDs, selected environment, and mailbox-manager contact details.",
        "A separate UI-account application is required after a mailbox ID exists."
      ]
    },
    {
      "source_id": "official_mesh_mailbox_apply_form",
      "title": "Apply for a MESH mailbox",
      "url": "https://digital.nhs.uk/services/message-exchange-for-social-care-and-health-mesh/messaging-exchange-for-social-care-and-health-apply-for-a-mailbox",
      "captured_on": "2026-04-09",
      "summary": "The mailbox form publishes the exact environment, organisation, mailbox-management, version-choice, workflow-detail, file-size, and API Path-to-Live certificate fields.",
      "grounding": [
        "Applicants choose Live, Path to live - integration, or Path to live - deployment.",
        "Organisation type, owner ODS code, nominated representative, and optional third-party manager details are required.",
        "Mailbox type selection distinguishes client, UI over HSCN, UI over internet, and API.",
        "Live MESH API mailboxes require API onboarding before application.",
        "Workflow-group details, data type, business flow, clone-mailbox option, and approximate file size are part of the form.",
        "For API testing in Path to Live, a CSR subject in the `local_id.ods_code.api.mesh-client.nhs.uk` format is required.",
        "Local testing can happen in Path to Live integration without applying for a mailbox and can also use the MESH-sandbox locally."
      ]
    },
    {
      "source_id": "official_mesh_workflow_guidance",
      "title": "Workflow groups and workflow IDs",
      "url": "https://digital.nhs.uk/services/message-exchange-for-social-care-and-health-mesh/workflow-groups-and-workflow-ids",
      "captured_on": "2026-04-09",
      "summary": "The workflow guidance explains initiator and responder semantics, distinguishes business acknowledgements from mailbox download acknowledgement, and points users to the current spreadsheet of workflow groups and IDs.",
      "grounding": [
        "One-way processes usually require only an initiator workflow ID.",
        "Two-way processes can require initiator and responder workflow IDs.",
        "Business acknowledgements are explicitly different from mailbox download acknowledgement.",
        "Workflow IDs and groups should be checked against the current published spreadsheet before applying."
      ]
    },
    {
      "source_id": "official_mesh_workflow_request_form",
      "title": "New workflow request or workflow amendment for an existing mailbox",
      "url": "https://digital.nhs.uk/services/message-exchange-for-social-care-and-health-mesh/workflow-groups-and-workflow-ids/new-workflow-request-or-workflow-amendment-for-an-existing-mailbox",
      "captured_on": "2026-04-09",
      "summary": "The workflow-request form requires mailbox-admin status for amendments, prior liaison with the MESH or Spine DevOps team for new groups or IDs, and a concise MESH-side business-flow description for each requested group and ID.",
      "grounding": [
        "Mailbox amendments may only be requested by the mailbox administrator.",
        "New workflow requests require prior discussion with the MESH team or Spine DevOps.",
        "New workflow group details must describe only the transfer flow and participating organisations.",
        "Each requested workflow ID must declare initiator or responder posture and a short transfer description.",
        "Requests lacking all required details can be rejected."
      ]
    },
    {
      "source_id": "official_mesh_roadmap",
      "title": "MESH roadmap",
      "url": "https://digital.nhs.uk/services/message-exchange-for-social-care-and-health-mesh/roadmap",
      "captured_on": "2026-04-09",
      "summary": "The roadmap records that MESH sandbox was created in 2023, API onboarding moved to digital onboarding in 2022, and improving testing and onboarding remains part of the service strategy.",
      "grounding": [
        "MESH sandbox exists as a separate testing aid.",
        "The MESH API onboarding journey moved to digital onboarding.",
        "Easier testing of API connections and onboarding simplification remain explicit roadmap themes."
      ]
    },
    {
      "source_id": "official_mesh_api_catalogue",
      "title": "Message Exchange for Social Care and Health (MESH) API",
      "url": "https://digital.nhs.uk/developer/api-catalogue/message-exchange-for-social-care-and-health-api",
      "captured_on": "2026-04-09",
      "summary": "The API catalogue confirms that MESH API is the system-to-system surface for secure message and large-file transfer and publishes the current OAS-backed specification.",
      "grounding": [
        "MESH API is an official developer-facing surface, not a private implementation detail.",
        "The OAS file is the current technical reference for software integration."
      ]
    }
  ],
  "integration_family": {
    "integration_id": "int_cross_org_secure_messaging",
    "integration_family": "cross_org_messaging",
    "integration_name": "Cross-organisation secure messaging and MESH seam",
    "source_dependency_ids": [
      "dep_cross_org_secure_messaging_mesh"
    ],
    "source_dependency_names": [
      "Cross-organisation secure messaging rail including MESH"
    ],
    "baseline_role": "baseline_mock_required",
    "authoritative_truth_class": "proof_bearing_transport_chain",
    "patient_safety_impact": "medium",
    "control_plane_impact": "high",
    "lineage_or_closure_dependency": "direct",
    "channel_dependency_classes": [
      "hub_console",
      "pharmacy_console",
      "practice_visibility"
    ],
    "bounded_context_refs": [
      "hub_coordination",
      "pharmacy",
      "support_operations"
    ],
    "current_mock_feasibility": "medium",
    "live_onboarding_latency_band": "contract_heavy",
    "sponsor_or_assurance_gate": "required",
    "recommended_lane": "hybrid_mock_then_live",
    "why_mock_now": "Hub, practice, and pharmacy message flows need replay-safe transport proof, ambiguity, and escalation behavior now even though live mailbox or certificate onboarding will lag.",
    "why_actual_later": "Real mailboxes, certificates, minimum-necessary payload review, and cross-org approvals are later work that should start early but must not stall simulator-backed implementation.",
    "minimum_mock_fidelity": "Simulate ordered outbox dispatch, queue acceptance, mailbox receipt, duplicate or reordered callbacks, disputed delivery, proof upgrades, and escalation routes. Transport acceptance alone may never settle hub or pharmacy truth, and the mock must preserve explicit proof versus ambiguity states for every effect chain.",
    "minimum_live_readiness_conditions": [
      "seq_028 completes mailbox or route access requests",
      "seq_023 publishes certificate and endpoint secret ownership",
      "seq_039 and seq_040 freeze manual checkpoints and fallback routes for disputed or weak transport proof"
    ],
    "later_task_refs": [
      "seq_022",
      "seq_023",
      "seq_028",
      "seq_038",
      "seq_039",
      "seq_040"
    ],
    "risk_refs": [
      "HZ_TELEPHONY_EVIDENCE_INADEQUACY",
      "HZ_DUPLICATE_SUPPRESSION_OR_MERGE",
      "RISK_BOOKING_002",
      "HZ_WRONG_PATIENT_BINDING",
      "RISK_RECOVERY_001",
      "RISK_BOOKING_001",
      "RISK_EXT_MESH_DELAY",
      "RISK_OWNERSHIP_003"
    ],
    "notes": "Proof-bearing transport family. Weak mailbox or weak transport semantics must stay visibly distinct from business settlement.",
    "source_refs": [
      "blueprint/phase-5-the-network-horizon.md#5F. Native hub booking commit, practice continuity, and cross-org messaging",
      "blueprint/phase-6-the-pharmacy-loop.md#6D. Referral pack composer, dispatch adapters, and transport contract",
      "data/analysis/dependency_truth_and_fallback_matrix.csv#dep_cross_org_secure_messaging_mesh",
      "blueprint-init.md#1. Product definition",
      "phase-5-the-network-horizon.md#Hub commit algorithm",
      "phase-6-the-pharmacy-loop.md#6D. Referral pack composer, dispatch adapters, and transport contract"
    ],
    "watch_lifecycle_states": [
      "onboarding"
    ],
    "watch_dependency_ids": [
      "dep_cross_org_secure_messaging_mesh"
    ],
    "phase0_blocker_refs": [
      "BLOCKER_P0_EXT_GATE_BLOCKED",
      "BLOCKER_P0_TELEPHONY_AND_MESH_READINESS"
    ],
    "touchpoint_ids": [
      "ext_practice_ack_delivery_rail",
      "ext_pharmacy_dispatch_transport"
    ],
    "truth_proof_digest": [
      "Current delivery evidence or other allowed proof class accepted by the live transport assurance profile for the exact outbound effect chain."
    ],
    "ambiguity_modes": [
      "Delivery evidence still pending or disputed",
      "Transport-only evidence without current-generation acknowledgement",
      "Duplicate or stale message correlation against superseded tuples"
    ],
    "fallback_modes": [
      "Retry through the same idempotent effect chain",
      "Monitored mailbox or telephone escalation where policy allows",
      "Keep patient or practice posture in explicit pending or recovery state"
    ],
    "mock_placeholder_only": [
      "real mailbox IDs",
      "real certificates"
    ],
    "failure_injection_expectations": [
      "duplicate receipt",
      "reordered callback",
      "accepted for transport but not delivered",
      "mailbox offline"
    ],
    "cannot_be_authoritative": [
      "queue dequeue",
      "transport accepted",
      "mailbox queued"
    ],
    "patient_safety_consequence": 3,
    "canonical_truth_effect": 4,
    "patient_visible_continuity": 4,
    "operator_truth_supportability": 4,
    "mockability_quality": 3,
    "live_acquisition_latency": 5,
    "approval_burden": 5,
    "security_privacy_burden": 5,
    "coupling_risk_if_delayed": 4,
    "readiness_value_unlocked": 4,
    "proof_rigor_demand": 5,
    "mock_now_execution_score": 218,
    "actual_provider_strategy_later_score": 231,
    "quadrant_live_acquisition_friction": 92,
    "quadrant_mvp_control_plane_necessity": 79,
    "summary_dependency_names": "Cross-organisation secure messaging rail including MESH",
    "mock_now_execution_rank": 7,
    "mock_now_execution_ordering_key": "07:int_cross_org_secure_messaging",
    "actual_provider_strategy_later_rank": 6,
    "actual_provider_strategy_later_ordering_key": "06:int_cross_org_secure_messaging",
    "rank_delta_live_minus_mock": -1
  },
  "mailboxes": [
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
      "business_scope": "Hub outbound continuity, inbound acknowledgement, and recovery follow-up."
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
      "business_scope": "Practice-side receipt and business acknowledgement of hub notices."
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
      "business_scope": "Referral dispatch plus inbound pharmacy acknowledgement and outcomes."
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
      "business_scope": "Pharmacy-side referral receipt and outcome return."
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
      "business_scope": "Replay review, attachment quarantine, and operator recovery traffic."
    }
  ],
  "workflow_rows": [
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
      "bounded_route_refs": "rf_hub_queue; rf_hub_case_management; rf_staff_workspace"
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
      "bounded_route_refs": "rf_hub_case_management; rf_staff_workspace; rf_support_replay_observe"
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
      "bounded_route_refs": "rf_pharmacy_console; rf_support_ticket_workspace"
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
      "bounded_route_refs": "rf_pharmacy_console; rf_support_replay_observe"
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
      "bounded_route_refs": "rf_pharmacy_console; rf_staff_workspace; rf_patient_requests"
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
      "bounded_route_refs": "rf_pharmacy_console; rf_support_ticket_workspace; rf_patient_requests"
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
      "bounded_route_refs": "rf_support_ticket_workspace; rf_support_replay_observe"
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
      "bounded_route_refs": "rf_support_replay_observe; rf_support_ticket_workspace"
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
      "bounded_route_refs": "rf_hub_case_management; rf_support_ticket_workspace; rf_patient_requests"
    }
  ],
  "route_rows": [
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
      "notes": "Acceptance is transport evidence only."
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
      "notes": "Explicitly separates mailbox receipt from business receipt."
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
      "notes": "Operational view only; no patient-facing closure allowed."
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
      "notes": "Primary proof-bearing transport lane for Phase 6."
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
      "notes": "Business ACK is not mailbox ACK."
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
      "notes": "Patient surface is observer-only for MESH truth."
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
      "notes": "Explicit urgent lane, not a generic outcome."
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
      "notes": "Required mandatory gap closure for attachment and quarantine events."
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
      "notes": "Mandatory gap closure for duplicate and replay resistance."
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
      "notes": "Observability row only; patient channel is not a sender of MESH traffic."
    }
  ],
  "field_map": {
    "fields": [
      {
        "field_id": "fld_mailbox_environment",
        "field_group": "mailbox_application",
        "origin_class": "official_mailbox_form",
        "label": "Mailbox required",
        "required_mode": "actual_provider_strategy_later",
        "value_shape": "enum",
        "value_examples": "live | path_to_live_integration | path_to_live_deployment",
        "purpose": "Select the environment requested on the mailbox form.",
        "notes": "Official mailbox form field."
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
        "notes": "Official mailbox form field."
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
        "notes": "Official mailbox form field and mandatory internal registry key."
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
        "notes": "Official mailbox form field."
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
        "notes": "Official mailbox form field."
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
        "notes": "Official mailbox form field."
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
        "notes": "Official mailbox form field."
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
        "notes": "Official mailbox form field."
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
        "notes": "Official mailbox form field."
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
        "notes": "Official mailbox form field."
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
        "notes": "Official mailbox form field."
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
        "notes": "Official mailbox form field."
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
        "notes": "Official mailbox form field."
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
        "notes": "Official mailbox form field."
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
        "notes": "Official mailbox form field."
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
        "notes": "Official mailbox form field."
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
        "notes": "Official mailbox form field."
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
        "notes": "Official mailbox form field."
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
        "notes": "Official mailbox form field."
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
        "notes": "Official mailbox form field."
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
        "notes": "Official mailbox form field."
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
        "notes": "Official mailbox form field."
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
        "notes": "Official workflow request field."
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
        "notes": "Official workflow request field."
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
        "notes": "Official workflow request field."
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
        "notes": "Official workflow request field."
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
        "notes": "Official workflow request field."
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
        "notes": "Official workflow request field."
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
        "notes": "Official workflow request field."
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
        "notes": "Official workflow request field."
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
        "notes": "Derived governance field."
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
        "notes": "Derived governance field."
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
        "notes": "Derived governance field."
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
        "notes": "Derived governance field."
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
        "notes": "Derived governance field."
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
        "notes": "Derived governance field."
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
        "notes": "Derived governance field."
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
        "notes": "Derived governance field."
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
        "notes": "Derived governance field."
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
        "notes": "Derived governance field."
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
        "notes": "Derived governance field."
      }
    ],
    "sections": [
      {
        "section_id": "mailbox_application",
        "label": "Apply for a MESH mailbox",
        "field_ids": [
          "fld_mailbox_environment",
          "fld_organisation_type",
          "fld_owner_ods",
          "fld_org_contact_name",
          "fld_org_contact_phone",
          "fld_org_contact_email",
          "fld_third_party_manage_flag",
          "fld_third_party_name",
          "fld_third_party_ods",
          "fld_third_party_contact_name",
          "fld_third_party_contact_phone",
          "fld_third_party_contact_email",
          "fld_nems_use",
          "fld_mesh_mailbox_type",
          "fld_workflow_group_required",
          "fld_data_usage_summary",
          "fld_existing_mailbox_clone",
          "fld_approx_file_size",
          "fld_api_csr_subject",
          "fld_path_to_live_client_keystore",
          "fld_path_to_live_ui_smartcard",
          "fld_pid_statement_acceptance"
        ]
      },
      {
        "section_id": "workflow_request",
        "label": "New workflow request or workflow amendment",
        "field_ids": [
          "fld_requester_name",
          "fld_requester_email",
          "fld_requester_phone",
          "fld_workflow_request_type",
          "fld_existing_mailbox_ids_for_amendment",
          "fld_mesh_team_contact",
          "fld_new_workflow_group_details",
          "fld_new_workflow_id_details"
        ]
      },
      {
        "section_id": "internal_gate",
        "label": "Vecells live gate dossier",
        "field_ids": [
          "fld_route_trace_refs",
          "fld_bounded_context_owner",
          "fld_path_to_live_without_mailbox_decision",
          "fld_named_approver",
          "fld_environment_target_confirmed",
          "fld_allow_real_mutation",
          "fld_allow_spend",
          "fld_minimum_necessary_review",
          "fld_target_proof_class",
          "fld_live_api_onboarding_complete",
          "fld_live_gate_bundle_ref"
        ]
      }
    ],
    "summary": {
      "field_count": 41,
      "field_group_count": 3,
      "official_mailbox_field_count": 22,
      "official_workflow_request_field_count": 8,
      "derived_field_count": 11
    }
  },
  "live_gate_pack": {
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
      "ALLOW_SPEND"
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
        "final_submit": "[data-testid='actual-submit-button']"
      }
    },
    "official_label_checks": {
      "mailbox_form": [
        "Path to live - integration",
        "MESH API",
        "3rd party organisation name",
        "API only: for testing in a Path to Live environment, create a CSR and paste here"
      ],
      "workflow_form": [
        "New workflow request",
        "MESH mailbox ID(s)",
        "Name of MESH team or SPINE DevOps contact this request has been discussed with",
        "Initiator or Responder"
      ]
    },
    "live_gates": [
      {
        "gate_id": "MESH_LIVE_GATE_PHASE0_EXTERNAL_READY",
        "title": "Current-baseline external readiness gate cleared",
        "status": "blocked",
        "reason": "Phase 0 entry remains withheld and GATE_EXTERNAL_TO_FOUNDATION is still blocked.",
        "evidence_refs": [
          "phase0_gate_verdict.json"
        ],
        "env_refs": []
      },
      {
        "gate_id": "MESH_LIVE_GATE_WORKFLOW_SET_TRACEABLE",
        "title": "Workflow set is source traceable to bounded-context needs",
        "status": "pass",
        "reason": "Every candidate workflow row is bound to route families, bounded contexts, and business-flow summaries.",
        "evidence_refs": [
          "mesh_workflow_registry.csv",
          "mesh_message_route_matrix.csv"
        ],
        "env_refs": []
      },
      {
        "gate_id": "MESH_LIVE_GATE_OWNER_ODS_KNOWN",
        "title": "Mailbox owner ODS posture is known",
        "status": "review_required",
        "reason": "Placeholder ODS rows exist in the pack, but partner-specific owner ODS still needs confirmation before real submission.",
        "evidence_refs": [
          "mesh_mailbox_field_map.json"
        ],
        "env_refs": [
          "MESH_MAILBOX_OWNER_ODS"
        ]
      },
      {
        "gate_id": "MESH_LIVE_GATE_MANAGER_MODE_DECIDED",
        "title": "Third-party mailbox manager posture is decided",
        "status": "review_required",
        "reason": "The form shape and register exist, but the real owner-managed versus third-party-managed posture is still placeholder-only.",
        "evidence_refs": [
          "mesh_mailbox_field_map.json",
          "28_mesh_live_gate_and_approval_strategy.md"
        ],
        "env_refs": [
          "MESH_MANAGING_PARTY_MODE"
        ]
      },
      {
        "gate_id": "MESH_LIVE_GATE_PATH_TO_LIVE_NEED_STATED",
        "title": "Path to Live versus local sandbox posture is explicit",
        "status": "pass",
        "reason": "The pack separates local sandbox, Path to Live-like rehearsal, and live mailbox need by workflow row and gate policy.",
        "evidence_refs": [
          "mesh_workflow_registry.csv",
          "28_mesh_mock_mailroom_spec.md"
        ],
        "env_refs": []
      },
      {
        "gate_id": "MESH_LIVE_GATE_API_ONBOARDING_COMPLETE",
        "title": "Live API onboarding is complete for any live API mailbox request",
        "status": "blocked",
        "reason": "Official guidance requires API onboarding before a live MESH API mailbox, and that onboarding is not yet complete.",
        "evidence_refs": [
          "28_mesh_mailbox_application_field_map.md"
        ],
        "env_refs": [
          "MESH_API_ONBOARDING_COMPLETE"
        ]
      },
      {
        "gate_id": "MESH_LIVE_GATE_MESH_TEAM_LIAISON_READY",
        "title": "Workflow request liaison with MESH or Spine DevOps is recorded",
        "status": "review_required",
        "reason": "The workflow-request dossier is prepared, but the named MESH-team contact is still empty.",
        "evidence_refs": [
          "28_mesh_workflow_group_and_id_registry.md"
        ],
        "env_refs": [
          "MESH_WORKFLOW_TEAM_CONTACT"
        ]
      },
      {
        "gate_id": "MESH_LIVE_GATE_NAMED_APPROVER_PRESENT",
        "title": "Named approver and environment target are present",
        "status": "blocked",
        "reason": "Real submission remains fail-closed until a named approver and target environment are explicitly provided.",
        "evidence_refs": [
          "mesh_live_gate_checklist.json"
        ],
        "env_refs": [
          "MESH_NAMED_APPROVER",
          "MESH_ENVIRONMENT_TARGET"
        ]
      },
      {
        "gate_id": "MESH_LIVE_GATE_MUTATION_AND_SPEND_ACK",
        "title": "Real mutation and spend acknowledgements are enabled",
        "status": "blocked",
        "reason": "Any real mailbox or workflow submission remains blocked until both mutation and spend guards are explicitly enabled when applicable.",
        "evidence_refs": [
          "mesh_live_gate_checklist.json"
        ],
        "env_refs": [
          "ALLOW_REAL_PROVIDER_MUTATION",
          "ALLOW_SPEND"
        ]
      },
      {
        "gate_id": "MESH_LIVE_GATE_MINIMUM_NECESSARY_REVIEW",
        "title": "Minimum-necessary payload and proof review is current",
        "status": "review_required",
        "reason": "The route matrix encodes the proof law, but a live payload minimisation review is not yet attached.",
        "evidence_refs": [
          "mesh_message_route_matrix.csv",
          "28_mesh_message_route_and_proof_matrix.md"
        ],
        "env_refs": [
          "MESH_MINIMUM_NECESSARY_REVIEW_REF"
        ]
      },
      {
        "gate_id": "MESH_LIVE_GATE_FINAL_POSTURE",
        "title": "Current submission posture",
        "status": "blocked",
        "reason": "The pack is ready for mock-now execution and dry-run preparation only; live mailbox and workflow submission stays blocked.",
        "evidence_refs": [
          "phase0_gate_verdict.json",
          "mesh_live_gate_checklist.json"
        ],
        "env_refs": []
      }
    ],
    "summary": {
      "live_gate_count": 11,
      "blocked_count": 5,
      "review_required_count": 4,
      "pass_count": 2,
      "current_submission_posture": "blocked"
    }
  },
  "timeline_template": [
    "compose",
    "submit",
    "accepted",
    "picked_up",
    "proof_pending",
    "settled_or_recovered"
  ],
  "mock_service": {
    "service_name": "mock-mesh",
    "base_url_default": "http://127.0.0.1:4178",
    "scenarios": [
      {
        "scenario_id": "happy_path",
        "label": "Happy path",
        "message_outcome": "settled_or_recovered",
        "timeline_tail": "settled_or_recovered",
        "description": "Transport accepted, recipient picks up, and current business proof lands on the same generation.",
        "operator_warning": "Still preserve transport and proof as separate events."
      },
      {
        "scenario_id": "delayed_ack",
        "label": "Delayed acknowledgement",
        "message_outcome": "proof_pending",
        "timeline_tail": "proof_pending",
        "description": "Transport accepts and recipient picks up, but business acknowledgement or downstream proof is still pending.",
        "operator_warning": "Do not imply calmness or closure."
      },
      {
        "scenario_id": "duplicate_delivery",
        "label": "Duplicate delivery",
        "message_outcome": "recovery_required",
        "timeline_tail": "settled_or_recovered",
        "description": "A duplicate or repeated receipt arrives for the same canonicalDispatchKey and must be attached to replay evidence rather than flattened.",
        "operator_warning": "Requires replay review and duplicate suppression."
      },
      {
        "scenario_id": "expired_pickup",
        "label": "Expired pickup window",
        "message_outcome": "expired",
        "timeline_tail": "settled_or_recovered",
        "description": "The recipient does not retrieve the message inside the allowed window and a non-delivery report is raised.",
        "operator_warning": "Expiry is distinct from failure or quarantine."
      },
      {
        "scenario_id": "quarantine_attachment",
        "label": "Attachment quarantine",
        "message_outcome": "quarantined",
        "timeline_tail": "settled_or_recovered",
        "description": "The message or related attachment is quarantined and requires explicit support handling.",
        "operator_warning": "Quarantine must remain first class."
      },
      {
        "scenario_id": "replay_guard",
        "label": "Replay guard",
        "message_outcome": "replay_blocked",
        "timeline_tail": "settled_or_recovered",
        "description": "A replay or resend attempt collides with a previous message generation and is fenced behind replay review.",
        "operator_warning": "Replay block is not a generic transport error."
      }
    ],
    "seeded_messages": [
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
        "summary": "Hub continuity notice accepted by transport, but practice business acknowledgement is still pending."
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
        "summary": "Practice ACK arrived twice and is fenced behind replay evidence review."
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
        "summary": "Referral package dispatched with accepted business proof on the current tuple."
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
        "summary": "Pharmacy outcome was not picked up in time and generated an explicit expiry posture."
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
        "summary": "Attachment manifest quarantined and routed to support review."
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
        "summary": "Replay-safe resend blocked until duplicate evidence review resolves the generation collision."
      }
    ],
    "mock_now_support_notes": [
      "Local sandbox mode exercises full transport proof states without claiming real onboarding.",
      "Path-to-live-like mode increases expiry pressure and mailbox-manager controls but still uses placeholders only.",
      "No real mailbox IDs, real credentials, or real workflow approvals are stored in repo state."
    ]
  },
  "selected_touchpoints": [
    {
      "touchpoint_id": "ext_practice_ack_delivery_rail",
      "lineage_area": "Hub practice visibility and acknowledgement debt",
      "dependency_name": "Practice acknowledgement delivery rail",
      "interaction_purpose": "Send and evidence continuity messages or acknowledgement requests back to the origin practice for hub bookings.",
      "required_proof": "Current-generation PracticeAcknowledgementRecord with matching ackGeneration and truthTupleHash.",
      "ambiguity_mode": "Transport acceptance alone cannot clear practice acknowledgement debt; failed, disputed, expired, or stale-generation acks remain open.",
      "degraded_fallback": "Recovery_required visibility posture, overdue acknowledgement timers, or operational escalation without calm close.",
      "scope_posture": "baseline",
      "source_refs": "phase-5-the-network-horizon.md#PracticeAcknowledgementRecord; phase-5-the-network-horizon.md#Hub commit algorithm"
    },
    {
      "touchpoint_id": "ext_pharmacy_dispatch_transport",
      "lineage_area": "Pharmacy referral dispatch and proof chain",
      "dependency_name": "Pharmacy referral transport adapter",
      "interaction_purpose": "Dispatch frozen referral packages through approved transport and observe transport or provider proof.",
      "required_proof": "PharmacyDispatchAttempt.authoritativeProofRef under the active TransportAssuranceProfile and ExternalConfirmationGate.",
      "ambiguity_mode": "Transport accepted or provider accepted is not enough unless the current assurance profile says that proof class is sufficient.",
      "degraded_fallback": "Same-shell proof-pending posture, redispatch only under fresh tuple, or controlled reconciliation review.",
      "scope_posture": "baseline",
      "source_refs": "phase-6-the-pharmacy-loop.md#Pharmacy contract, case model, and state machine; phase-0-the-foundation-protocol.md#Pharmacy dispatch and confirmation gate algorithm"
    },
    {
      "touchpoint_id": "ext_pharmacy_outcome_ingest",
      "lineage_area": "Pharmacy consultation outcome return",
      "dependency_name": "Structured pharmacy outcome ingest or agreed local return channel",
      "interaction_purpose": "Ingest consultation summary, bounce-back, urgent return, or no-contact outcomes back into governed GP workflow.",
      "required_proof": "PharmacyOutcomeRecord or PharmacyBounceBackRecord correlated to the current PharmacyCase and outcome matching tuple.",
      "ambiguity_mode": "Weakly matched or unmatched outcomes stay in outcome_reconciliation_pending and cannot auto-close the request.",
      "degraded_fallback": "Controlled reconciliation review, urgent bounce-back, no-contact return handling, or reachability repair.",
      "scope_posture": "baseline",
      "source_refs": "phase-6-the-pharmacy-loop.md#Pharmacy contract, case model, and state machine; forensic-audit-findings.md#Finding 79 - weak-source matching did not clearly stop at a case-local review state"
    }
  ],
  "selected_risks": [
    {
      "risk_id": "HZ_DUPLICATE_SUPPRESSION_OR_MERGE",
      "risk_title": "Duplicate suppression or merge hazard",
      "risk_class": "clinical_safety",
      "source_type": "assurance_workstream",
      "source_refs": [
        "phase-2-the-identity-and-echoes.md#2G. Convergence into one request model and one workflow"
      ],
      "finding_refs": [],
      "problem_statement": "Cross-channel duplicate handling or same-request attach could inappropriately merge clinically distinct evidence or hide replay collisions.",
      "failure_mode": "lost or misattributed evidence; wrong clinical route; audit ambiguity",
      "leading_indicators": [
        "duplicate-resolution tests",
        "cross-channel candidate competition tests"
      ],
      "trigger_conditions": [
        "CHG_IDENTITY_BINDING_OR_SESSION",
        "CHG_TELEPHONY_CAPTURE_OR_CONTINUATION"
      ],
      "affected_phase_refs": [
        "external_readiness",
        "phase_0"
      ],
      "affected_requirement_ids": [],
      "affected_task_refs": [
        "seq_028",
        "par_123"
      ],
      "affected_gate_refs": [],
      "affected_dependency_refs": [
        "dep_cross_org_secure_messaging_mesh",
        "dep_im1_pairing_programme"
      ],
      "affected_persona_refs": [],
      "affected_channel_refs": [],
      "current_control_refs": [
        "HazardLog delta packet",
        "Interop conformance matrix",
        "Policy-watch compatibility review",
        "duplicate-resolution tests",
        "cross-channel candidate competition tests",
        "WS_CLINICAL_MANUFACTURER",
        "WS_INTEROPERABILITY_EVIDENCE"
      ],
      "control_strength": "partial",
      "mitigation_actions": [
        "HazardLog delta packet",
        "Interop conformance matrix",
        "Policy-watch compatibility review",
        "duplicate-resolution tests",
        "cross-channel candidate competition tests",
        "WS_CLINICAL_MANUFACTURER",
        "WS_INTEROPERABILITY_EVIDENCE"
      ],
      "contingency_actions": [
        "Hold the linked gate and keep the experience in explicit safety-review or recovery posture.",
        "Escalate through the named safety and privacy signoff chain before widening writable actions."
      ],
      "owner_role": "ROLE_MANUFACTURER_CSO",
      "status": "mitigating",
      "linked_milestone_refs": [
        "MS_EXT_MESH_ACCESS",
        "MS_P0_0G_IM1_SCAL_ASSURANCE"
      ],
      "notes": "Mandatory seed hazard carried forward as a live risk row and gate input.",
      "likelihood": "high",
      "impact_patient_safety": "extreme",
      "impact_service": "high",
      "impact_privacy": "high",
      "impact_delivery": "high",
      "impact_release": "high",
      "detectability": "hard",
      "critical_path_relevance": "on_path",
      "gate_impact": "blocking",
      "dependency_lifecycle_states": [
        "onboarding"
      ],
      "risk_score": 43,
      "target_due_ref": "seq_028"
    },
    {
      "risk_id": "RISK_BOOKING_002",
      "risk_title": "ExternalConfirmationGate governs ambiguous booking and dispatch truth",
      "risk_class": "integration",
      "source_type": "derived_gap_closure",
      "source_refs": [
        "phase-0-the-foundation-protocol.md",
        "phase-cards.md",
        "phase-4-the-booking-engine.md",
        "phase-6-the-pharmacy-loop.md",
        "blueprint-init.md#Bootstrap priorities",
        "phase-cards.md#Programme Summary-Layer Alignment",
        "vecells-complete-end-to-end-flow.md#Vecells Complete End-to-End System Flow (Audited Baseline)",
        "phase-0-the-foundation-protocol.md#9.6 Closure evaluation algorithm",
        "forensic-audit-findings.md#Finding 31 - No ambiguous confirmation or reconciliation state for bookings",
        "platform-frontend-blueprint.md#5.6 Booking, waitlist, hub, and pharmacy continuity algorithm",
        "phase-4-the-booking-engine.md#Backend work",
        "phase-5-the-network-horizon.md#Backend work",
        "phase-6-the-pharmacy-loop.md#Phase 6 objective"
      ],
      "finding_refs": [
        "FINDING_031",
        "FINDING_072",
        "FINDING_074"
      ],
      "problem_statement": "Use `ExternalConfirmationGate` and case-local truth projections for ambiguous external booking or dispatch states; never imply final booked or referred calmness before the gate clears.",
      "failure_mode": "RISK_BOOKING_002 summary cards can still over-promise external truth if they skip the gate vocabulary.",
      "leading_indicators": [
        "Reject summary language that implies authoritative external success before confirmation-gate resolution.",
        "Missing evidence class: BookingConfirmationTruthProjection",
        "Runtime tuple drift across RuntimePublicationBundle"
      ],
      "trigger_conditions": [
        "Summary or architecture text compresses the canonical control into generic prose.",
        "A gate or release tuple remains green while the stronger canonical primitive is absent from evidence.",
        "A current-baseline flow relies on publication or shell posture that the canonical winner says must fail closed."
      ],
      "affected_phase_refs": [
        "phase_0",
        "phase_4",
        "phase_5",
        "phase_6",
        "cross_phase_controls"
      ],
      "affected_requirement_ids": [
        "GAP-FINDING-031",
        "GAP-FINDING-072",
        "GAP-FINDING-074",
        "REQ-INV-016",
        "REQ-OBJ-externalconfirmationgate"
      ],
      "affected_task_refs": [
        "seq_278",
        "seq_279",
        "seq_280",
        "seq_281",
        "par_282",
        "par_283",
        "par_284",
        "par_285",
        "par_286",
        "par_287",
        "par_288",
        "par_289",
        "par_290",
        "par_291",
        "par_292",
        "par_293",
        "par_294",
        "par_295",
        "par_296",
        "par_297",
        "par_298",
        "par_299",
        "par_300",
        "par_301",
        "par_302",
        "par_303",
        "seq_304",
        "seq_305",
        "seq_306",
        "seq_307",
        "seq_308",
        "seq_309",
        "seq_310",
        "seq_311",
        "seq_312",
        "seq_313",
        "seq_314",
        "par_315",
        "par_316",
        "par_317",
        "par_318",
        "par_319",
        "par_320",
        "par_321",
        "par_322",
        "par_323",
        "par_324",
        "par_325",
        "par_326",
        "par_327",
        "par_328",
        "par_329",
        "par_330",
        "par_331",
        "par_332",
        "par_333",
        "par_334",
        "seq_335",
        "seq_336",
        "seq_337",
        "seq_338",
        "seq_339",
        "seq_340",
        "seq_341"
      ],
      "affected_gate_refs": [
        "GATE_P4_PARALLEL_MERGE",
        "GATE_P4_EXIT",
        "GATE_P5_PARALLEL_MERGE",
        "GATE_P5_EXIT"
      ],
      "affected_dependency_refs": [
        "dep_local_booking_supplier_adapters",
        "dep_gp_system_supplier_paths",
        "dep_network_capacity_partner_feeds",
        "dep_cross_org_secure_messaging_mesh"
      ],
      "affected_persona_refs": [],
      "affected_channel_refs": [],
      "current_control_refs": [
        "BookingConfirmationTruthProjection",
        "PharmacyDispatchSettlement",
        "RuntimePublicationBundle",
        "AudienceSurfaceRuntimeBinding",
        "MS_P4_DEFINITION_AND_ENTRY",
        "MS_P4_PARALLEL_BOOKING_IMPLEMENTATION",
        "MS_P4_MERGE_CONFIG_AND_PROOF",
        "MS_P4_EXIT_GATE",
        "MS_P5_DEFINITION_AND_ENTRY",
        "MS_P5_PARALLEL_NETWORK_IMPLEMENTATION"
      ],
      "mitigation_actions": [
        "Use `ExternalConfirmationGate` and case-local truth projections for ambiguous external booking or dispatch states; never imply final booked or referred calmness before the gate clears.",
        "Reject summary language that implies authoritative external success before confirmation-gate resolution.",
        "Keep linked gates blocked until ExternalConfirmationGate governs ambiguous booking and dispatch truth is represented in current evidence."
      ],
      "contingency_actions": [
        "Freeze writable or calm posture and fall back to the last authoritative summary or read-only state.",
        "Escalate to architecture or release review instead of inventing route-local exceptions."
      ],
      "linked_milestone_refs": [
        "MS_P4_DEFINITION_AND_ENTRY",
        "MS_P4_PARALLEL_BOOKING_IMPLEMENTATION",
        "MS_P4_MERGE_CONFIG_AND_PROOF",
        "MS_P4_EXIT_GATE",
        "MS_P5_DEFINITION_AND_ENTRY",
        "MS_P5_PARALLEL_NETWORK_IMPLEMENTATION",
        "MS_P5_MERGE_CONFIG_AND_PROOF",
        "MS_P5_EXIT_GATE"
      ],
      "notes": "terminology_drift risk carried forward from seq_002 summary reconciliation.",
      "likelihood": "high",
      "impact_patient_safety": "medium",
      "impact_service": "high",
      "impact_privacy": "medium",
      "impact_delivery": "high",
      "impact_release": "high",
      "detectability": "hard",
      "owner_role": "ROLE_INTEROPERABILITY_LEAD",
      "control_strength": "partial",
      "status": "watching",
      "critical_path_relevance": "on_path",
      "gate_impact": "watch",
      "dependency_lifecycle_states": [
        "onboarding"
      ],
      "risk_score": 39,
      "target_due_ref": "GATE_P4_PARALLEL_MERGE"
    },
    {
      "risk_id": "HZ_WRONG_PATIENT_BINDING",
      "risk_title": "Wrong-patient binding or correction failure",
      "risk_class": "privacy",
      "source_type": "assurance_workstream",
      "source_refs": [
        "phase-2-the-identity-and-echoes.md#2H. Hardening, safety evidence, and the formal Phase 2 exit gate",
        "phase-9-the-assurance-ledger.md#IdentityRepairEvidenceBundle"
      ],
      "finding_refs": [],
      "problem_statement": "Identity binding, secure-link redemption, or correction flow could expose or act on the wrong patient if freezes, evidence, and release ordering fail.",
      "failure_mode": "privacy breach; clinical action on wrong patient; wrong-patient reassurance",
      "leading_indicators": [
        "SafetyCase delta packet",
        "Session and binding regression suites"
      ],
      "trigger_conditions": [
        "CHG_IDENTITY_BINDING_OR_SESSION",
        "CHG_PARTNER_CONFIGURATION_OR_REDIRECTS"
      ],
      "affected_phase_refs": [
        "external_readiness",
        "phase_0",
        "phase_2"
      ],
      "affected_requirement_ids": [],
      "affected_task_refs": [
        "seq_021",
        "seq_022",
        "seq_023",
        "seq_024",
        "seq_025",
        "seq_026",
        "par_122",
        "par_124",
        "par_125",
        "par_126",
        "seq_132",
        "seq_133",
        "seq_134",
        "seq_135",
        "seq_136",
        "seq_137",
        "seq_138",
        "seq_202",
        "seq_203"
      ],
      "affected_gate_refs": [
        "GATE_EXTERNAL_TO_FOUNDATION",
        "GATE_P0_LONG_LEAD_ASSURANCE_MERGE",
        "GATE_P0_EXIT"
      ],
      "affected_dependency_refs": [
        "dep_nhs_login_rail",
        "dep_im1_pairing_programme",
        "dep_nhs_assurance_and_standards_sources",
        "dep_sms_notification_provider",
        "dep_email_notification_provider",
        "dep_cross_org_secure_messaging_mesh"
      ],
      "affected_persona_refs": [],
      "affected_channel_refs": [],
      "current_control_refs": [
        "HazardLog delta packet",
        "Identity repair evidence bundle",
        "DPIA delta packet",
        "SafetyCase delta packet",
        "Session and binding regression suites",
        "WS_CLINICAL_MANUFACTURER",
        "WS_DATA_PROTECTION_PRIVACY",
        "WS_CLINICAL_DEPLOYMENT_USE"
      ],
      "control_strength": "partial",
      "mitigation_actions": [
        "HazardLog delta packet",
        "Identity repair evidence bundle",
        "DPIA delta packet",
        "SafetyCase delta packet",
        "Session and binding regression suites",
        "WS_CLINICAL_MANUFACTURER",
        "WS_DATA_PROTECTION_PRIVACY",
        "WS_CLINICAL_DEPLOYMENT_USE"
      ],
      "contingency_actions": [
        "Hold the linked gate and keep the experience in explicit safety-review or recovery posture.",
        "Escalate through the named safety and privacy signoff chain before widening writable actions."
      ],
      "owner_role": "ROLE_MANUFACTURER_CSO",
      "status": "mitigating",
      "linked_milestone_refs": [
        "MS_EXT_STRATEGY_AND_ACCOUNT_PLAN",
        "MS_EXT_NHS_LOGIN_ONBOARDING",
        "MS_EXT_IM1_SCAL_READINESS",
        "MS_P0_0G_DSPT_READINESS",
        "MS_P0_0G_NHS_LOGIN_ONBOARDING_EVIDENCE",
        "MS_P0_0G_CLINICAL_AND_PRIVACY_REVIEW_CADENCE",
        "MS_P0_0G_EXIT_PROOF_AND_FOUNDATION_SIGNOFF",
        "MS_P2_EXTERNAL_CONFIG"
      ],
      "notes": "Mandatory seed hazard carried forward as a live risk row and gate input.",
      "likelihood": "medium",
      "impact_patient_safety": "medium",
      "impact_service": "medium",
      "impact_privacy": "extreme",
      "impact_delivery": "high",
      "impact_release": "high",
      "detectability": "hard",
      "critical_path_relevance": "on_path",
      "gate_impact": "blocking",
      "dependency_lifecycle_states": [
        "onboarding",
        "current",
        "replaceable_by_simulator"
      ],
      "risk_score": 38,
      "target_due_ref": "GATE_EXTERNAL_TO_FOUNDATION"
    },
    {
      "risk_id": "RISK_RECOVERY_001",
      "risk_title": "bounce-back, reopen, and fallback stay inside the same lineage with explicit recovery truth",
      "risk_class": "resilience",
      "source_type": "derived_gap_closure",
      "source_refs": [
        "vecells-complete-end-to-end-flow.md",
        "blueprint-init.md",
        "phase-6-the-pharmacy-loop.md",
        "blueprint-init.md#3. The canonical request model",
        "phase-cards.md#Card 7: Phase 6 - The Pharmacy Loop",
        "vecells-complete-end-to-end-flow.md#Vecells Complete End-to-End System Flow (Audited Baseline)",
        "phase-0-the-foundation-protocol.md#3. Non-negotiable invariants",
        "forensic-audit-findings.md#Finding 77 - Phase 6 let pharmacy-domain logic write canonical request state directly on resolve and reopen paths",
        "platform-frontend-blueprint.md#1.1A AttentionBudget",
        "patient-account-and-communications-blueprint.md#Request detail contract",
        "staff-operations-and-support-blueprint.md#Staff landing requirements",
        "phase-3-the-human-checkpoint.md#Backend work",
        "phase-4-the-booking-engine.md#Backend work",
        "phase-5-the-network-horizon.md#Backend work",
        "phase-6-the-pharmacy-loop.md#Phase 6 objective",
        "phase-9-the-assurance-ledger.md#Backend work"
      ],
      "finding_refs": [
        "FINDING_077",
        "FINDING_019",
        "FINDING_039",
        "FINDING_075",
        "FINDING_082"
      ],
      "problem_statement": "When accepted progress degrades, reopen or bounce back inside the same lineage using explicit fallback, exception, or recovery cases rather than detached secondary workflows.",
      "failure_mode": "RISK_RECOVERY_001 reopen semantics may fork if summary docs revert to generic return wording.",
      "leading_indicators": [
        "Missing evidence class: ExperienceContinuityControlEvidence",
        "Runtime tuple drift across ReleaseRecoveryDisposition"
      ],
      "trigger_conditions": [
        "Summary or architecture text compresses the canonical control into generic prose.",
        "A gate or release tuple remains green while the stronger canonical primitive is absent from evidence.",
        "A current-baseline flow relies on publication or shell posture that the canonical winner says must fail closed."
      ],
      "affected_phase_refs": [
        "phase_0",
        "phase_3",
        "phase_4",
        "phase_5",
        "phase_6",
        "cross_phase_controls"
      ],
      "affected_requirement_ids": [
        "GAP-FINDING-019",
        "GAP-FINDING-039",
        "GAP-FINDING-075",
        "GAP-FINDING-077",
        "GAP-FINDING-082",
        "REQ-CTRL-phase-6-the-pharmacy-loop-md-001-pharmacy-loop-control-priorities",
        "REQ-CTRL-phase-6-the-pharmacy-loop-md-001-what-phase-6-must-prove-before-phase-7-starts",
        "REQ-CTRL-phase-6-the-pharmacy-loop-md-006-what-phase-6-must-prove-before-phase-7-starts",
        "REQ-CTRL-self-care-content-and-admin-resolution-blueprint-md-004-cross-layer-control-priorities",
        "REQ-EDGE-FALLBACK-AFTER-ACCEPTED-PROGRESS",
        "REQ-INV-026",
        "REQ-INV-027",
        "REQ-INV-045",
        "REQ-INV-046",
        "REQ-INV-050",
        "REQ-INV-053",
        "REQ-INV-060",
        "REQ-OBJ-fallbackreviewcase",
        "REQ-TEST-phase-3-the-human-checkpoint-md-012",
        "REQ-TEST-phase-3-the-human-checkpoint-md-014",
        "REQ-TEST-phase-3-the-human-checkpoint-md-058",
        "REQ-TEST-phase-3-the-human-checkpoint-md-065",
        "REQ-TEST-phase-3-the-human-checkpoint-md-069",
        "REQ-TEST-phase-3-the-human-checkpoint-md-100",
        "REQ-TEST-phase-3-the-human-checkpoint-md-101",
        "REQ-TEST-phase-3-the-human-checkpoint-md-102",
        "REQ-TEST-phase-3-the-human-checkpoint-md-112",
        "REQ-TEST-phase-5-the-network-horizon-md-090",
        "REQ-TEST-phase-5-the-network-horizon-md-122",
        "REQ-TEST-phase-6-the-pharmacy-loop-md-005",
        "REQ-TEST-phase-6-the-pharmacy-loop-md-006",
        "REQ-TEST-phase-6-the-pharmacy-loop-md-086",
        "REQ-TEST-phase-6-the-pharmacy-loop-md-088",
        "REQ-TEST-phase-6-the-pharmacy-loop-md-091",
        "REQ-TEST-phase-6-the-pharmacy-loop-md-093",
        "REQ-TEST-phase-6-the-pharmacy-loop-md-094",
        "REQ-TEST-phase-6-the-pharmacy-loop-md-102",
        "REQ-TEST-phase-6-the-pharmacy-loop-md-108",
        "REQ-TEST-phase-6-the-pharmacy-loop-md-111",
        "REQ-TEST-phase-7-inside-the-nhs-app-md-026",
        "REQ-TEST-phase-7-inside-the-nhs-app-md-035",
        "REQ-TEST-phase-7-inside-the-nhs-app-md-036",
        "REQ-TEST-phase-7-inside-the-nhs-app-md-050",
        "REQ-TEST-phase-9-the-assurance-ledger-md-125"
      ],
      "affected_task_refs": [
        "seq_278",
        "seq_279",
        "seq_280",
        "seq_281",
        "par_282",
        "par_283",
        "par_284",
        "par_285",
        "par_286",
        "par_287",
        "par_288",
        "par_289",
        "par_290",
        "par_291",
        "par_292",
        "par_293",
        "par_294",
        "par_295",
        "par_296",
        "par_297",
        "par_298",
        "par_299",
        "par_300",
        "par_301",
        "par_302",
        "par_303",
        "seq_304",
        "seq_305",
        "seq_306",
        "seq_307",
        "seq_308",
        "seq_309",
        "seq_310",
        "seq_311",
        "seq_312",
        "seq_313",
        "seq_314",
        "par_315",
        "par_316",
        "par_317",
        "par_318",
        "par_319",
        "par_320",
        "par_321",
        "par_322",
        "par_323",
        "par_324",
        "par_325",
        "par_326",
        "par_327",
        "par_328",
        "par_329",
        "par_330",
        "par_331",
        "par_332",
        "par_333",
        "par_334",
        "seq_335",
        "seq_336",
        "seq_337",
        "seq_338",
        "seq_339",
        "seq_340",
        "seq_341",
        "seq_342",
        "seq_343",
        "seq_344",
        "seq_345",
        "par_346",
        "par_347",
        "par_348",
        "par_349",
        "par_350",
        "par_351",
        "par_352",
        "par_353",
        "par_354",
        "par_355",
        "par_356",
        "par_357",
        "par_358",
        "par_359",
        "par_360",
        "par_361",
        "par_362",
        "par_363",
        "par_364",
        "par_365",
        "seq_366",
        "seq_367",
        "seq_368",
        "seq_369",
        "seq_370",
        "seq_371",
        "seq_372"
      ],
      "affected_gate_refs": [
        "GATE_P4_PARALLEL_MERGE",
        "GATE_P4_EXIT",
        "GATE_P5_PARALLEL_MERGE",
        "GATE_P5_EXIT",
        "GATE_P6_PARALLEL_MERGE",
        "GATE_P6_EXIT"
      ],
      "affected_dependency_refs": [
        "dep_local_booking_supplier_adapters",
        "dep_gp_system_supplier_paths",
        "dep_network_capacity_partner_feeds",
        "dep_cross_org_secure_messaging_mesh",
        "dep_pharmacy_directory_dohs",
        "dep_pharmacy_referral_transport",
        "dep_pharmacy_outcome_observation"
      ],
      "affected_persona_refs": [],
      "affected_channel_refs": [],
      "current_control_refs": [
        "ExperienceContinuityControlEvidence",
        "ControlStatusSnapshot",
        "ReleaseRecoveryDisposition",
        "AudienceSurfaceRuntimeBinding",
        "MS_P4_DEFINITION_AND_ENTRY",
        "MS_P4_PARALLEL_BOOKING_IMPLEMENTATION",
        "MS_P4_MERGE_CONFIG_AND_PROOF",
        "MS_P4_EXIT_GATE",
        "MS_P5_DEFINITION_AND_ENTRY",
        "MS_P5_PARALLEL_NETWORK_IMPLEMENTATION"
      ],
      "mitigation_actions": [
        "When accepted progress degrades, reopen or bounce back inside the same lineage using explicit fallback, exception, or recovery cases rather than detached secondary workflows.",
        "Keep linked gates blocked until bounce-back, reopen, and fallback stay inside the same lineage with explicit recovery truth is represented in current evidence."
      ],
      "contingency_actions": [
        "Freeze writable or calm posture and fall back to the last authoritative summary or read-only state.",
        "Escalate to architecture or release review instead of inventing route-local exceptions."
      ],
      "linked_milestone_refs": [
        "MS_P4_DEFINITION_AND_ENTRY",
        "MS_P4_PARALLEL_BOOKING_IMPLEMENTATION",
        "MS_P4_MERGE_CONFIG_AND_PROOF",
        "MS_P4_EXIT_GATE",
        "MS_P5_DEFINITION_AND_ENTRY",
        "MS_P5_PARALLEL_NETWORK_IMPLEMENTATION",
        "MS_P5_MERGE_CONFIG_AND_PROOF",
        "MS_P5_EXIT_GATE",
        "MS_P6_DEFINITION_AND_ENTRY",
        "MS_P6_PARALLEL_PHARMACY_IMPLEMENTATION",
        "MS_P6_MERGE_CONFIG_AND_PROOF",
        "MS_P6_EXIT_GATE"
      ],
      "notes": "terminology_drift risk carried forward from seq_002 summary reconciliation.",
      "likelihood": "medium",
      "impact_patient_safety": "high",
      "impact_service": "extreme",
      "impact_privacy": "medium",
      "impact_delivery": "high",
      "impact_release": "extreme",
      "detectability": "hard",
      "owner_role": "ROLE_SRE_LEAD",
      "control_strength": "partial",
      "status": "watching",
      "critical_path_relevance": "on_path",
      "gate_impact": "watch",
      "dependency_lifecycle_states": [
        "onboarding"
      ],
      "risk_score": 38,
      "target_due_ref": "GATE_P4_PARALLEL_MERGE"
    },
    {
      "risk_title": "MESH and secure-message readiness lag blocks cross-organisation messaging truth",
      "risk_class": "external_dependency",
      "risk_id": "RISK_EXT_MESH_DELAY",
      "source_type": "dependency_inventory",
      "source_refs": [
        "data/analysis/external_dependencies.json#dep_cross_org_secure_messaging_mesh",
        "data/analysis/regulatory_workstreams.json#WS_INTEROPERABILITY_EVIDENCE"
      ],
      "finding_refs": [],
      "problem_statement": "Cross-organisation messaging readiness is a named dependency for hub and support flows, not a later implementation detail.",
      "failure_mode": "Hub coordination and cross-organisation communication are designed against a transport path that has not yet been onboarded or simulated credibly.",
      "leading_indicators": [
        "MESH mailbox or secure-message onboarding remains blocked",
        "cross-org fallback rules stay undocumented",
        "hub or support messaging paths rely on generic email fallback only"
      ],
      "trigger_conditions": [
        "seq_028 or seq_039 slips while later hub milestones remain on the critical path",
        "cross-org acknowledgement is inferred from non-authoritative transport signals"
      ],
      "affected_dependency_refs": [
        "dep_cross_org_secure_messaging_mesh"
      ],
      "affected_gate_refs": [
        "GATE_EXTERNAL_TO_FOUNDATION",
        "GATE_P5_PARALLEL_MERGE"
      ],
      "affected_task_refs": [
        "seq_021",
        "seq_028",
        "seq_039",
        "seq_040"
      ],
      "affected_phase_refs": [
        "external_readiness",
        "phase_5",
        "cross_phase_controls"
      ],
      "affected_persona_refs": [
        "hub_coordinator",
        "support_desk_agent",
        "operations_control_room_operator"
      ],
      "affected_channel_refs": [
        "browser_web",
        "outbound_notification_delivery"
      ],
      "likelihood": "high",
      "impact_patient_safety": "medium",
      "impact_service": "high",
      "impact_privacy": "medium",
      "impact_delivery": "high",
      "impact_release": "high",
      "detectability": "moderate",
      "current_control_refs": [
        "dep_cross_org_secure_messaging_mesh",
        "WS_INTEROPERABILITY_EVIDENCE"
      ],
      "control_strength": "weak",
      "mitigation_actions": [
        "Keep MESH onboarding and fallback semantics explicit in the dependency watchlist and seq_040 assumption freeze.",
        "Bind cross-org messaging evidence into Phase 5 merge and release review."
      ],
      "contingency_actions": [
        "Fallback to bounded manual messaging or callback paths with clear operator debt.",
        "Keep patient or hub calmness pending until authoritative communication proof exists."
      ],
      "target_due_ref": "GATE_P5_PARALLEL_MERGE",
      "owner_role": "ROLE_INTEROPERABILITY_LEAD",
      "status": "watching",
      "notes": "",
      "linked_milestone_refs": [
        "MS_EXT_MESH_ACCESS",
        "MS_P5_DEFINITION_AND_ENTRY",
        "MS_P5_PARALLEL_NETWORK_IMPLEMENTATION",
        "MS_P5_MERGE_CONFIG_AND_PROOF",
        "MS_P5_EXIT_GATE"
      ],
      "affected_requirement_ids": [
        "REQ-INV-030",
        "REQ-INV-045",
        "REQ-CTRL-phase-1-the-red-flag-gate-md-002-control-priorities",
        "REQ-TEST-phase-3-the-human-checkpoint-md-005",
        "REQ-TEST-phase-3-the-human-checkpoint-md-069",
        "REQ-CTRL-phase-4-the-booking-engine-md-005-booking-surface-control-priorities",
        "REQ-TEST-phase-4-the-booking-engine-md-032",
        "REQ-TEST-phase-4-the-booking-engine-md-071",
        "REQ-TEST-phase-4-the-booking-engine-md-082",
        "REQ-TEST-phase-5-the-network-horizon-md-061",
        "REQ-TEST-phase-5-the-network-horizon-md-064",
        "REQ-TEST-phase-5-the-network-horizon-md-078",
        "REQ-TEST-phase-5-the-network-horizon-md-083",
        "REQ-TEST-phase-5-the-network-horizon-md-110"
      ],
      "critical_path_relevance": "on_path",
      "gate_impact": "watch",
      "dependency_lifecycle_states": [
        "onboarding"
      ],
      "risk_score": 37
    },
    {
      "risk_id": "RISK_OWNERSHIP_003",
      "risk_title": "child domains emit milestones and evidence; they do not write canonical Request state directly",
      "risk_class": "architecture",
      "source_type": "derived_gap_closure",
      "source_refs": [
        "forensic-audit-findings.md",
        "phase-3-the-human-checkpoint.md",
        "phase-4-the-booking-engine.md",
        "phase-5-the-network-horizon.md",
        "phase-6-the-pharmacy-loop.md",
        "blueprint-init.md#3. The canonical request model",
        "phase-cards.md#Card 1: Phase 0 - The Foundation Protocol",
        "vecells-complete-end-to-end-flow.md#Vecells Complete End-to-End System Flow (Audited Baseline)",
        "phase-0-the-foundation-protocol.md#0B. Canonical domain kernel and state machine",
        "forensic-audit-findings.md#Finding 74 - Phase 4 let booking-domain logic write canonical request state directly on success",
        "phase-3-the-human-checkpoint.md#Backend work",
        "phase-4-the-booking-engine.md#Backend work",
        "phase-5-the-network-horizon.md#Backend work",
        "phase-6-the-pharmacy-loop.md#Phase 6 objective"
      ],
      "finding_refs": [
        "FINDING_074",
        "FINDING_075",
        "FINDING_076",
        "FINDING_077"
      ],
      "problem_statement": "Normalize triage, booking, hub, and pharmacy outputs to case-local milestones, gates, and leases that `LifecycleCoordinator` consumes to derive canonical request state.",
      "failure_mode": "RISK_OWNERSHIP_003 downstream bounded contexts can drift back into direct canonical state writes under delivery pressure.",
      "leading_indicators": [
        "Reject summary text or contracts that let a child domain claim final canonical request milestone ownership.",
        "Missing evidence class: DecisionEpoch",
        "Runtime tuple drift across RuntimePublicationBundle"
      ],
      "trigger_conditions": [
        "Summary or architecture text compresses the canonical control into generic prose.",
        "A gate or release tuple remains green while the stronger canonical primitive is absent from evidence.",
        "A current-baseline flow relies on publication or shell posture that the canonical winner says must fail closed."
      ],
      "affected_phase_refs": [
        "phase_3",
        "phase_4",
        "phase_5",
        "phase_6",
        "cross_phase_controls"
      ],
      "affected_requirement_ids": [
        "GAP-FINDING-074",
        "GAP-FINDING-075",
        "GAP-FINDING-076",
        "GAP-FINDING-077"
      ],
      "affected_task_refs": [
        "seq_226",
        "seq_227",
        "seq_228",
        "seq_229",
        "seq_230",
        "par_231",
        "par_232",
        "par_233",
        "par_234",
        "par_235",
        "par_236",
        "par_237",
        "par_238",
        "par_239",
        "par_240",
        "par_241",
        "par_242",
        "par_243",
        "par_244",
        "par_245",
        "par_246",
        "par_247",
        "par_248",
        "par_249",
        "par_250",
        "par_251",
        "par_252",
        "par_253",
        "par_254",
        "par_255",
        "par_256",
        "par_257",
        "par_258",
        "par_259",
        "par_260",
        "par_261",
        "par_262",
        "par_263",
        "par_264",
        "par_265",
        "par_266",
        "par_267",
        "par_268",
        "par_269",
        "seq_270",
        "seq_271",
        "seq_272",
        "seq_273",
        "seq_274",
        "seq_275",
        "seq_276",
        "seq_277",
        "seq_278",
        "seq_279",
        "seq_280",
        "seq_281",
        "par_282",
        "par_283",
        "par_284",
        "par_285",
        "par_286",
        "par_287",
        "par_288",
        "par_289",
        "par_290",
        "par_291",
        "par_292",
        "par_293",
        "par_294",
        "par_295",
        "par_296",
        "par_297",
        "par_298",
        "par_299",
        "par_300",
        "par_301",
        "par_302",
        "par_303",
        "seq_304",
        "seq_305",
        "seq_306",
        "seq_307",
        "seq_308",
        "seq_309",
        "seq_310",
        "seq_311",
        "seq_312",
        "seq_313",
        "seq_314",
        "par_315",
        "par_316",
        "par_317",
        "par_318",
        "par_319",
        "par_320",
        "par_321",
        "par_322",
        "par_323",
        "par_324",
        "par_325",
        "par_326",
        "par_327",
        "par_328",
        "par_329",
        "par_330",
        "par_331",
        "par_332",
        "par_333",
        "par_334",
        "seq_335",
        "seq_336",
        "seq_337",
        "seq_338",
        "seq_339",
        "seq_340",
        "seq_341",
        "seq_342",
        "seq_343",
        "seq_344",
        "seq_345",
        "par_346",
        "par_347",
        "par_348",
        "par_349",
        "par_350",
        "par_351",
        "par_352",
        "par_353",
        "par_354",
        "par_355",
        "par_356",
        "par_357",
        "par_358",
        "par_359",
        "par_360",
        "par_361",
        "par_362",
        "par_363",
        "par_364",
        "par_365",
        "seq_366",
        "seq_367",
        "seq_368",
        "seq_369",
        "seq_370",
        "seq_371",
        "seq_372"
      ],
      "affected_gate_refs": [
        "GATE_P3_PARALLEL_MERGE",
        "GATE_P3_EXIT",
        "GATE_P4_PARALLEL_MERGE",
        "GATE_P4_EXIT",
        "GATE_P5_PARALLEL_MERGE",
        "GATE_P5_EXIT",
        "GATE_P6_PARALLEL_MERGE",
        "GATE_P6_EXIT"
      ],
      "affected_dependency_refs": [
        "dep_local_booking_supplier_adapters",
        "dep_gp_system_supplier_paths",
        "dep_network_capacity_partner_feeds",
        "dep_cross_org_secure_messaging_mesh",
        "dep_pharmacy_directory_dohs",
        "dep_pharmacy_referral_transport",
        "dep_pharmacy_outcome_observation"
      ],
      "affected_persona_refs": [],
      "affected_channel_refs": [],
      "current_control_refs": [
        "DecisionEpoch",
        "ControlStatusSnapshot",
        "RuntimePublicationBundle",
        "MS_P3_DEFINITION_AND_ENTRY",
        "MS_P3_PARALLEL_TRIAGE_AND_CALLBACK",
        "MS_P3_MERGE_AND_PROOF",
        "MS_P3_EXIT_GATE",
        "MS_P4_DEFINITION_AND_ENTRY",
        "MS_P4_PARALLEL_BOOKING_IMPLEMENTATION",
        "MS_P4_MERGE_CONFIG_AND_PROOF"
      ],
      "mitigation_actions": [
        "Normalize triage, booking, hub, and pharmacy outputs to case-local milestones, gates, and leases that `LifecycleCoordinator` consumes to derive canonical request state.",
        "Reject summary text or contracts that let a child domain claim final canonical request milestone ownership.",
        "Keep linked gates blocked until child domains emit milestones and evidence; they do not write canonical Request state directly is represented in current evidence."
      ],
      "contingency_actions": [
        "Freeze writable or calm posture and fall back to the last authoritative summary or read-only state.",
        "Escalate to architecture or release review instead of inventing route-local exceptions."
      ],
      "linked_milestone_refs": [
        "MS_P3_DEFINITION_AND_ENTRY",
        "MS_P3_PARALLEL_TRIAGE_AND_CALLBACK",
        "MS_P3_MERGE_AND_PROOF",
        "MS_P3_EXIT_GATE",
        "MS_P4_DEFINITION_AND_ENTRY",
        "MS_P4_PARALLEL_BOOKING_IMPLEMENTATION",
        "MS_P4_MERGE_CONFIG_AND_PROOF",
        "MS_P4_EXIT_GATE",
        "MS_P5_DEFINITION_AND_ENTRY",
        "MS_P5_PARALLEL_NETWORK_IMPLEMENTATION",
        "MS_P5_MERGE_CONFIG_AND_PROOF",
        "MS_P5_EXIT_GATE",
        "MS_P6_DEFINITION_AND_ENTRY",
        "MS_P6_PARALLEL_PHARMACY_IMPLEMENTATION",
        "MS_P6_MERGE_CONFIG_AND_PROOF",
        "MS_P6_EXIT_GATE"
      ],
      "notes": "canonical_conflict risk carried forward from seq_002 summary reconciliation.",
      "likelihood": "medium",
      "impact_patient_safety": "medium",
      "impact_service": "high",
      "impact_privacy": "medium",
      "impact_delivery": "high",
      "impact_release": "high",
      "detectability": "moderate",
      "owner_role": "ROLE_PROGRAMME_ARCHITECT",
      "control_strength": "partial",
      "status": "watching",
      "critical_path_relevance": "on_path",
      "gate_impact": "watch",
      "dependency_lifecycle_states": [
        "onboarding"
      ],
      "risk_score": 33,
      "target_due_ref": "GATE_P3_PARALLEL_MERGE"
    }
  ],
  "selected_secret_inventory": [
    {
      "account_or_secret_id": "KEY_MESH_SHARED_DEV_TRANSPORT_CERT",
      "dependency_family": "messaging_transport",
      "dependency_title": "Cross-organisation messaging transport",
      "environment": "shared_dev",
      "record_class": "private_key",
      "current_lane": "mock_now",
      "owner_role": "ROLE_INTEROPERABILITY_LEAD",
      "backup_owner_role": "ROLE_SECURITY_LEAD",
      "creator_role": "ROLE_PARTNER_ONBOARDING_LEAD",
      "approver_role": "ROLE_OPERATIONS_LEAD",
      "storage_backend": "nonprod_hsm_keyring",
      "distribution_method": "deterministic_seed_bootstrap",
      "rotation_policy": "daily_shared_reset_or_on_contract_change",
      "revocation_policy": "destroy_seed_material_reset_environment_append_mock_audit",
      "audit_sink": "MockCredentialSeedAudit",
      "exposure_constraints": "No markdown literals, no console echo, no trace/video capture, screenshots only after explicit redaction, runtime reference handles only.",
      "allowed_usage_surfaces": [
        "mesh_simulator",
        "svc_secure_message_adapter",
        "ops_vendor_control_plane"
      ],
      "manual_checkpoint_required": "no",
      "live_gate_refs": [
        "GATE_EXTERNAL_TO_FOUNDATION",
        "LIVE_GATE_CROSS_ORG_TRANSPORT_APPROVED"
      ],
      "mock_equivalent_ref": "",
      "origin_source": "deterministic_seed_generator",
      "landing_zone": "seed_bootstrap_outside_repo",
      "runtime_injection_path": "nonprod_workload_identity_fetch",
      "dual_control_required": "no",
      "redaction_profile": "full_secret_mask_and_capture_block",
      "source_refs": [
        "data/analysis/external_dependencies.json#dep_cross_org_secure_messaging_mesh",
        "data/analysis/external_dependencies.json#dep_origin_practice_ack_rail",
        "data/analysis/external_dependencies.json#dep_pharmacy_urgent_return_professional_routes"
      ],
      "risk_refs": [
        "HZ_TELEPHONY_EVIDENCE_INADEQUACY",
        "HZ_DUPLICATE_SUPPRESSION_OR_MERGE",
        "RISK_BOOKING_002",
        "HZ_WRONG_PATIENT_BINDING",
        "RISK_RECOVERY_001",
        "RISK_BOOKING_001",
        "RISK_EXT_MESH_DELAY",
        "RISK_OWNERSHIP_003"
      ],
      "notes": "Mock certificate material for authenticated transport tests."
    },
    {
      "account_or_secret_id": "ACC_MESH_SHARED_DEV_MAILBOX",
      "dependency_family": "messaging_transport",
      "dependency_title": "Cross-organisation messaging transport",
      "environment": "shared_dev",
      "record_class": "mailbox_credential",
      "current_lane": "mock_now",
      "owner_role": "ROLE_INTEROPERABILITY_LEAD",
      "backup_owner_role": "ROLE_SECURITY_LEAD",
      "creator_role": "ROLE_PARTNER_ONBOARDING_LEAD",
      "approver_role": "ROLE_OPERATIONS_LEAD",
      "storage_backend": "shared_nonprod_vault",
      "distribution_method": "deterministic_seed_bootstrap",
      "rotation_policy": "daily_shared_reset_or_on_contract_change",
      "revocation_policy": "destroy_seed_material_reset_environment_append_mock_audit",
      "audit_sink": "MockCredentialSeedAudit",
      "exposure_constraints": "No markdown literals, no console echo, no trace/video capture, screenshots only after explicit redaction, runtime reference handles only.",
      "allowed_usage_surfaces": [
        "mesh_simulator",
        "svc_secure_message_adapter",
        "ops_vendor_control_plane"
      ],
      "manual_checkpoint_required": "no",
      "live_gate_refs": [
        "GATE_EXTERNAL_TO_FOUNDATION",
        "LIVE_GATE_CROSS_ORG_TRANSPORT_APPROVED"
      ],
      "mock_equivalent_ref": "",
      "origin_source": "deterministic_seed_generator",
      "landing_zone": "seed_bootstrap_outside_repo",
      "runtime_injection_path": "nonprod_workload_identity_fetch",
      "dual_control_required": "no",
      "redaction_profile": "full_secret_mask_and_capture_block",
      "source_refs": [
        "data/analysis/external_dependencies.json#dep_cross_org_secure_messaging_mesh",
        "data/analysis/external_dependencies.json#dep_origin_practice_ack_rail",
        "data/analysis/external_dependencies.json#dep_pharmacy_urgent_return_professional_routes"
      ],
      "risk_refs": [
        "HZ_TELEPHONY_EVIDENCE_INADEQUACY",
        "HZ_DUPLICATE_SUPPRESSION_OR_MERGE",
        "RISK_BOOKING_002",
        "HZ_WRONG_PATIENT_BINDING",
        "RISK_RECOVERY_001",
        "RISK_BOOKING_001",
        "RISK_EXT_MESH_DELAY",
        "RISK_OWNERSHIP_003"
      ],
      "notes": "Shared-dev MESH-like mailbox credential for cross-org message replay rehearsal."
    },
    {
      "account_or_secret_id": "ACC_PRACTICE_ACK_INTEGRATION_MAILBOX",
      "dependency_family": "messaging_transport",
      "dependency_title": "Cross-organisation messaging transport",
      "environment": "integration",
      "record_class": "mailbox_credential",
      "current_lane": "actual_later",
      "owner_role": "ROLE_INTEROPERABILITY_LEAD",
      "backup_owner_role": "ROLE_SECURITY_LEAD",
      "creator_role": "ROLE_PARTNER_ONBOARDING_LEAD",
      "approver_role": "ROLE_OPERATIONS_LEAD",
      "storage_backend": "shared_nonprod_vault",
      "distribution_method": "dual_control_capture_then_vault_ingest",
      "rotation_policy": "every_90_days_or_provider_maximum",
      "revocation_policy": "disable_at_provider_rotate_dependent_handles_republish_runtime_append_audit",
      "audit_sink": "ExternalAccessLifecycleLedger",
      "exposure_constraints": "No markdown literals, no console echo, no trace/video capture, screenshots only after explicit redaction, runtime reference handles only.",
      "allowed_usage_surfaces": [
        "svc_secure_message_adapter",
        "browser_automation_dry_run",
        "ops_vendor_control_plane"
      ],
      "manual_checkpoint_required": "yes",
      "live_gate_refs": [
        "GATE_EXTERNAL_TO_FOUNDATION",
        "LIVE_GATE_CROSS_ORG_TRANSPORT_APPROVED"
      ],
      "mock_equivalent_ref": "ACC_MESH_SHARED_DEV_MAILBOX",
      "origin_source": "partner_portal_download_or_secure_operator_capture",
      "landing_zone": "partner_capture_quarantine",
      "runtime_injection_path": "nonprod_workload_identity_fetch",
      "dual_control_required": "yes",
      "redaction_profile": "full_secret_mask_and_capture_block",
      "source_refs": [
        "data/analysis/external_dependencies.json#dep_cross_org_secure_messaging_mesh",
        "data/analysis/external_dependencies.json#dep_origin_practice_ack_rail",
        "data/analysis/external_dependencies.json#dep_pharmacy_urgent_return_professional_routes",
        "docs/external/21_integration_priority_and_execution_matrix.md#Scorecards And Secret Posture"
      ],
      "risk_refs": [
        "HZ_TELEPHONY_EVIDENCE_INADEQUACY",
        "HZ_DUPLICATE_SUPPRESSION_OR_MERGE",
        "RISK_BOOKING_002",
        "HZ_WRONG_PATIENT_BINDING",
        "RISK_RECOVERY_001",
        "RISK_BOOKING_001",
        "RISK_EXT_MESH_DELAY",
        "RISK_OWNERSHIP_003"
      ],
      "notes": "Practice acknowledgement mailbox credential for origin-practice updates."
    },
    {
      "account_or_secret_id": "ACC_MESH_PREPROD_MAILBOX",
      "dependency_family": "messaging_transport",
      "dependency_title": "Cross-organisation messaging transport",
      "environment": "preprod",
      "record_class": "mailbox_credential",
      "current_lane": "actual_later",
      "owner_role": "ROLE_INTEROPERABILITY_LEAD",
      "backup_owner_role": "ROLE_SECURITY_LEAD",
      "creator_role": "ROLE_PARTNER_ONBOARDING_LEAD",
      "approver_role": "ROLE_OPERATIONS_LEAD",
      "storage_backend": "preprod_vault",
      "distribution_method": "dual_control_capture_then_vault_ingest",
      "rotation_policy": "every_90_days_or_before_release_candidate_widen",
      "revocation_policy": "disable_at_provider_rotate_dependent_handles_republish_runtime_append_audit",
      "audit_sink": "ExternalAccessLifecycleLedger",
      "exposure_constraints": "No markdown literals, no console echo, no trace/video capture, screenshots only after explicit redaction, runtime reference handles only.",
      "allowed_usage_surfaces": [
        "svc_secure_message_adapter",
        "browser_automation_dry_run",
        "ops_vendor_control_plane"
      ],
      "manual_checkpoint_required": "yes",
      "live_gate_refs": [
        "GATE_EXTERNAL_TO_FOUNDATION",
        "LIVE_GATE_CROSS_ORG_TRANSPORT_APPROVED"
      ],
      "mock_equivalent_ref": "ACC_MESH_SHARED_DEV_MAILBOX",
      "origin_source": "partner_portal_download_or_secure_operator_capture",
      "landing_zone": "partner_capture_quarantine",
      "runtime_injection_path": "preprod_workload_identity_fetch",
      "dual_control_required": "yes",
      "redaction_profile": "full_secret_mask_and_capture_block",
      "source_refs": [
        "data/analysis/external_dependencies.json#dep_cross_org_secure_messaging_mesh",
        "data/analysis/external_dependencies.json#dep_origin_practice_ack_rail",
        "data/analysis/external_dependencies.json#dep_pharmacy_urgent_return_professional_routes",
        "docs/external/21_integration_priority_and_execution_matrix.md#Scorecards And Secret Posture"
      ],
      "risk_refs": [
        "HZ_TELEPHONY_EVIDENCE_INADEQUACY",
        "HZ_DUPLICATE_SUPPRESSION_OR_MERGE",
        "RISK_BOOKING_002",
        "HZ_WRONG_PATIENT_BINDING",
        "RISK_RECOVERY_001",
        "RISK_BOOKING_001",
        "RISK_EXT_MESH_DELAY",
        "RISK_OWNERSHIP_003"
      ],
      "notes": "Preprod MESH mailbox for cross-org dispatch rehearsal."
    },
    {
      "account_or_secret_id": "KEY_MESH_PRODUCTION_TRANSPORT_CERT",
      "dependency_family": "messaging_transport",
      "dependency_title": "Cross-organisation messaging transport",
      "environment": "production",
      "record_class": "private_key",
      "current_lane": "actual_later",
      "owner_role": "ROLE_INTEROPERABILITY_LEAD",
      "backup_owner_role": "ROLE_SECURITY_LEAD",
      "creator_role": "ROLE_PARTNER_ONBOARDING_LEAD",
      "approver_role": "ROLE_OPERATIONS_LEAD",
      "storage_backend": "production_hsm_keyring",
      "distribution_method": "dual_control_capture_then_vault_ingest",
      "rotation_policy": "dual_control_every_60_days_or_on_redirect_or_certificate_change",
      "revocation_policy": "disable_at_provider_rotate_dependent_handles_republish_runtime_append_audit",
      "audit_sink": "ExternalAccessLifecycleLedger",
      "exposure_constraints": "No markdown literals, no console echo, no trace/video capture, screenshots only after explicit redaction, runtime reference handles only.",
      "allowed_usage_surfaces": [
        "svc_secure_message_adapter",
        "browser_automation_dry_run",
        "ops_vendor_control_plane"
      ],
      "manual_checkpoint_required": "yes",
      "live_gate_refs": [
        "GATE_EXTERNAL_TO_FOUNDATION",
        "LIVE_GATE_CROSS_ORG_TRANSPORT_APPROVED"
      ],
      "mock_equivalent_ref": "KEY_MESH_SHARED_DEV_TRANSPORT_CERT",
      "origin_source": "partner_portal_download_or_secure_operator_capture",
      "landing_zone": "partner_capture_quarantine",
      "runtime_injection_path": "production_workload_identity_fetch",
      "dual_control_required": "yes",
      "redaction_profile": "full_secret_mask_and_capture_block",
      "source_refs": [
        "data/analysis/external_dependencies.json#dep_cross_org_secure_messaging_mesh",
        "data/analysis/external_dependencies.json#dep_origin_practice_ack_rail",
        "data/analysis/external_dependencies.json#dep_pharmacy_urgent_return_professional_routes",
        "docs/external/21_integration_priority_and_execution_matrix.md#Scorecards And Secret Posture"
      ],
      "risk_refs": [
        "HZ_TELEPHONY_EVIDENCE_INADEQUACY",
        "HZ_DUPLICATE_SUPPRESSION_OR_MERGE",
        "RISK_BOOKING_002",
        "HZ_WRONG_PATIENT_BINDING",
        "RISK_RECOVERY_001",
        "RISK_BOOKING_001",
        "RISK_EXT_MESH_DELAY",
        "RISK_OWNERSHIP_003"
      ],
      "notes": "Production transport certificate lives only in the production HSM keyring."
    }
  ],
  "summary": {
    "mailbox_count": 5,
    "workflow_group_count": 4,
    "workflow_row_count": 9,
    "route_row_count": 10,
    "field_count": 41,
    "live_gate_count": 11,
    "blocked_live_gate_count": 5,
    "review_live_gate_count": 4,
    "pass_live_gate_count": 2,
    "scenario_count": 6,
    "seeded_message_count": 6,
    "selected_risk_count": 6,
    "selected_secret_count": 5,
    "selected_touchpoint_count": 3
  }
} as const;
