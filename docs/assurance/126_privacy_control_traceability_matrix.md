        # 126 Privacy Control Traceability Matrix

        Task: `par_126`  
        Reviewed at: `2026-04-14`

        ## Mock_now_execution

        - Trace every threat to real control-plane contracts already published by the repo: `VisibilityProjectionPolicy`, `ScopedMutationGate`, `UITelemetryDisclosureFence`, scope tuples, runtime bindings, classification ceilings, trust boundaries, replay rules, and break-glass envelopes.
        - Keep UI calmness, route collapse, and local cache behavior out of the control column because they are not authorization boundaries.

        ## Actual_production_strategy_later

        - Add controller or processor, contract, transfer, and named-approver evidence through the `futureOnboardingOrContractual` column without renaming the control families.

        ## Matrix

        | Threat | Controls | Operational review | Actual upgrades |
| --- | --- | --- | --- |
| PRIV-126-001 | CTRL_126_MINIMUM_NECESSARY_CLASSIFICATION_V1, CTRL_126_UI_TELEMETRY_DISCLOSURE_FENCE_V1 | none | browser_debug_tooling_review_pack, controller_processor_assignment_matrix, production_telemetry_retention_evidence, retention_and_transfer_schedule |
| PRIV-126-002 | CTRL_126_SCOPED_MUTATION_AND_ACTING_SCOPE_V1, CTRL_126_CANONICAL_EVENT_MASKING_V1, CTRL_126_ROUTE_RUNTIME_PUBLICATION_PARITY_V1 | none | docs/assurance/125_clinical_signoff_matrix.md, named_break_glass_approver_roster, production_log_retention_and_redaction_pack, release_approval_freeze_with_privacy_attestation |
| PRIV-126-003 | CTRL_126_VISIBILITY_PROJECTION_POLICY_V1, CTRL_126_ROUTE_RUNTIME_PUBLICATION_PARITY_V1 | none | docs/assurance/125_clinical_signoff_matrix.md, live_controller_processor_roster, release_approval_freeze_with_privacy_attestation |
| PRIV-126-004 | CTRL_126_SCOPED_MUTATION_AND_ACTING_SCOPE_V1, CTRL_126_VISIBILITY_PROJECTION_POLICY_V1, CTRL_126_MINIMUM_NECESSARY_CLASSIFICATION_V1 | none | controller_processor_assignment_matrix, docs/assurance/125_clinical_signoff_matrix.md, live_controller_processor_roster, named_break_glass_approver_roster, retention_and_transfer_schedule |
| PRIV-126-005 | CTRL_126_CANONICAL_EVENT_MASKING_V1, CTRL_126_ROUTE_RUNTIME_PUBLICATION_PARITY_V1, CTRL_126_UI_TELEMETRY_DISCLOSURE_FENCE_V1 | none | browser_debug_tooling_review_pack, production_log_retention_and_redaction_pack, production_telemetry_retention_evidence, release_approval_freeze_with_privacy_attestation |
| PRIV-126-006 | CTRL_126_CONTACT_ROUTE_SNAPSHOT_REPAIR_V1, CTRL_126_MINIMUM_NECESSARY_CLASSIFICATION_V1, CTRL_126_CANONICAL_EVENT_MASKING_V1 | none | controller_processor_assignment_matrix, live_notification_processor_roster, production_log_retention_and_redaction_pack, retention_and_transfer_schedule, telephony_transcription_supplier_register |
| PRIV-126-007 | CTRL_126_GATEWAY_ADAPTER_BOUNDARY_V1, CTRL_126_VISIBILITY_PROJECTION_POLICY_V1 | none | docs/assurance/125_clinical_signoff_matrix.md, live_controller_processor_roster, live_processor_and_subprocessor_register, provider_contract_and_transfer_evidence |
| PRIV-126-008 |  | CTRL_126_BREAK_GLASS_SCOPE_ENVELOPE_V1, CTRL_126_FROZEN_BUNDLE_AND_EXPORT_GOVERNANCE_V1 | deployer_break_glass_policy_pack, deployer_legal_hold_policy, named_break_glass_approver_roster, named_investigation_reviewer_roster |
| PRIV-126-009 | CTRL_126_ROUTE_RUNTIME_PUBLICATION_PARITY_V1, CTRL_126_EMBEDDED_CHANNEL_PRIVACY_POSTURE_V1, CTRL_126_UI_TELEMETRY_DISCLOSURE_FENCE_V1 | none | browser_debug_tooling_review_pack, embedded_channel_manifest_attestation, host_bridge_processor_assignment, production_telemetry_retention_evidence, release_approval_freeze_with_privacy_attestation |
| PRIV-126-010 | CTRL_126_VISIBILITY_PROJECTION_POLICY_V1, CTRL_126_UI_TELEMETRY_DISCLOSURE_FENCE_V1 | CTRL_126_ASSISTIVE_PROVENANCE_AND_RERUN_V1 | assistive_capability_trust_envelope_register, browser_debug_tooling_review_pack, docs/assurance/125_clinical_signoff_matrix.md, formal_dpia_rerun_record, live_controller_processor_roster, model_supplier_and_subprocessor_register, production_telemetry_retention_evidence |

        ## Explicit anti-patterns

        - UI collapse is not an authorization boundary.
        - Local cache is not a disclosure control.
        - Decorative shell behavior is not a privacy safeguard.
