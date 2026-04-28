# Surface Authority Verdict Matrix

        This matrix is the current Phase 0 audience-surface truth layer that gateways, shells, governance, and tests can all consume without recomputing tuple logic ad hoc.

        ## State Counts

        | State | Count |
| --- | --- |
| blocked | 3 |
| partial | 13 |
| recovery only | 7 |

        ## Blocked Rows

        | Surface | Route family | Reasons | Declared recovery or freeze |
| --- | --- | --- | --- |
| Standalone assistive control shell | rf_assistive_control_shell | MFV_127_ASSISTIVE_STANDALONE_UNPUBLISHED, MFV_127_DESIGN_BUNDLE_MISSING, MFV_127_FRONTEND_MANIFEST_MISSING, MFV_127_PROJECTION_VERSION_SET_MISSING, MFV_127_RUNTIME_BINDING_MISSING, MFV_127_SHELL_CONTRACT_MISSING, MFV_127_SURFACE_ROUTE_CONTRACT_MISSING | RFD_130_ASSISTIVE_STANDALONE_PUBLICATION_BLOCK, RRD_130_ASSISTIVE_STANDALONE_RETURN_TO_OWNING_SHELL |
| Embedded patient shell reuse | rf_patient_embedded_channel | MFV_127_ACCESSIBILITY_BLOCKED, MFV_127_BROWSER_POSTURE_RECOVERY_ONLY, MFV_127_DESIGN_LINT_PENDING | RFD_050_PATIENT_TRANSACTION_RECOVERY_V1, RRD_EMBEDDED_HANDOFF_ONLY, RRD_EMBEDDED_READ_ONLY, RRD_IDENTITY_HOLD_PLACEHOLDER, RRD_SECURE_LINK_RECOVERY_ONLY |
| Secure-link recovery and claim resume | rf_patient_secure_link_recovery | MFV_127_ACCESSIBILITY_BLOCKED, MFV_127_BROWSER_POSTURE_RECOVERY_ONLY, MFV_127_DESIGN_LINT_PENDING | RFD_050_PATIENT_TRANSACTION_RECOVERY_V1, RRD_EMBEDDED_HANDOFF_ONLY, RRD_EMBEDDED_READ_ONLY, RRD_IDENTITY_HOLD_PLACEHOLDER, RRD_SECURE_LINK_RECOVERY_ONLY |

        ## Recovery-Only Rows

        | Surface | Route family | Writable truth | Declared recovery or freeze |
| --- | --- | --- | --- |
| Operations board | rf_operations_board | recovery_only | RFD_050_OPERATIONS_CONSOLE_V1, RRD_OPERATIONS_BOARD_FROZEN, RRD_OPERATIONS_DIAGNOSTIC_ONLY, RRD_RESILIENCE_CONTROL_FROZEN |
| Operations investigation and intervention drill-down | rf_operations_drilldown | recovery_only | RFD_050_OPERATIONS_CONSOLE_V1, RRD_OPERATIONS_BOARD_FROZEN, RRD_OPERATIONS_DIAGNOSTIC_ONLY, RRD_RESILIENCE_CONTROL_FROZEN |
| Patient intake entry | rf_intake_self_service | recovery_only | RFD_050_PATIENT_PUBLIC_ENTRY_V1, RRD_PATIENT_INTAKE_RECOVERY, RRD_PATIENT_PUBLIC_PLACEHOLDER, RRD_TELEPHONY_CAPTURE_RECOVERY |
| Telephony / IVR intake capture | rf_intake_telephony_capture | recovery_only | RFD_050_PATIENT_PUBLIC_ENTRY_V1, RRD_PATIENT_INTAKE_RECOVERY, RRD_PATIENT_PUBLIC_PLACEHOLDER, RRD_TELEPHONY_CAPTURE_RECOVERY |
| Support replay and observe | rf_support_replay_observe | recovery_only | RFD_050_SUPPORT_WORKSPACE_V1, RRD_SUPPORT_CAPTURE_READ_ONLY, RRD_SUPPORT_CAPTURE_RECOVERY, RRD_SUPPORT_REPLAY_MASKED, RRD_SUPPORT_REPLAY_RESTORE_FROZEN, RRD_SUPPORT_WORKSPACE_READ_ONLY |
| Support-assisted capture and recovery | rf_support_ticket_workspace | recovery_only | RFD_050_SUPPORT_WORKSPACE_V1, RRD_SUPPORT_CAPTURE_READ_ONLY, RRD_SUPPORT_CAPTURE_RECOVERY, RRD_SUPPORT_REPLAY_MASKED, RRD_SUPPORT_REPLAY_RESTORE_FROZEN, RRD_SUPPORT_WORKSPACE_READ_ONLY |
| Support ticket workspace | rf_support_ticket_workspace | recovery_only | RFD_050_SUPPORT_WORKSPACE_V1, RRD_SUPPORT_CAPTURE_READ_ONLY, RRD_SUPPORT_CAPTURE_RECOVERY, RRD_SUPPORT_REPLAY_MASKED, RRD_SUPPORT_REPLAY_RESTORE_FROZEN, RRD_SUPPORT_WORKSPACE_READ_ONLY |
