# 56 Route Authority And Runtime Tuple Matrix

            | Route intent | Audience surface | Route family | Action scope | Binding state | Runtime binding ref | Published binding state | Current browser posture | Release freeze ref |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| RIB_056_PATIENT_CLAIM_CURRENT_V1 | audsurf_patient_transaction_recovery | rf_patient_secure_link_recovery | claim | live | ASRB_050_RF_PATIENT_SECURE_LINK_RECOVERY_V1 | recovery_only | recovery_only | RAF_PROD_V1 |
| RIB_056_PATIENT_CLAIM_LEGACY_PARTIAL_V1 | audsurf_patient_transaction_recovery | rf_patient_secure_link_recovery | claim | recovery_only | ASRB_050_RF_PATIENT_SECURE_LINK_RECOVERY_V1 | recovery_only | recovery_only | RAF_PROD_V1 |
| RIB_056_PATIENT_MORE_INFO_REPLY_V1 | audsurf_patient_transaction_recovery | rf_patient_secure_link_recovery | respond_more_info | live | ASRB_050_RF_PATIENT_SECURE_LINK_RECOVERY_V1 | recovery_only | recovery_only | RAF_PROD_V1 |
| RIB_056_PATIENT_MESSAGE_REPLY_V1 | audsurf_patient_authenticated_portal | rf_patient_messages | reply_message | live | ASRB_050_RF_PATIENT_MESSAGES_V1 | read_only | read_only | RAF_PROD_V1 |
| RIB_056_PATIENT_MESSAGE_REPLY_SUPERSEDED_V1 | audsurf_patient_authenticated_portal | rf_patient_messages | reply_message | superseded | ASRB_050_RF_PATIENT_MESSAGES_V1 | read_only | read_only | RAF_PROD_V1 |
| RIB_056_PATIENT_CALLBACK_RESPONSE_V1 | audsurf_patient_authenticated_portal | rf_patient_messages | respond_callback | live | ASRB_050_RF_PATIENT_MESSAGES_V1 | read_only | read_only | RAF_PROD_V1 |
| RIB_056_PATIENT_MANAGE_BOOKING_V1 | audsurf_patient_authenticated_portal | rf_patient_appointments | manage_booking | live | ASRB_050_RF_PATIENT_APPOINTMENTS_V1 | read_only | read_only | RAF_PROD_V1 |
| RIB_056_PATIENT_WAITLIST_ACCEPT_V1 | audsurf_patient_authenticated_portal | rf_patient_appointments | accept_waitlist_offer | live | ASRB_050_RF_PATIENT_APPOINTMENTS_V1 | read_only | read_only | RAF_PROD_V1 |
| RIB_056_PATIENT_NETWORK_ALTERNATIVE_STALE_V1 | audsurf_patient_authenticated_portal | rf_patient_appointments | accept_network_alternative | stale | ASRB_050_RF_PATIENT_APPOINTMENTS_V1 | read_only | read_only | RAF_PROD_V1 |
| RIB_056_PATIENT_PHARMACY_CHOICE_V1 | audsurf_patient_authenticated_portal | rf_patient_requests | pharmacy_choice | live | ASRB_050_RF_PATIENT_REQUESTS_V1 | read_only | read_only | RAF_PROD_V1 |
| RIB_056_PATIENT_PHARMACY_CONSENT_RECOVERY_V1 | audsurf_patient_authenticated_portal | rf_patient_requests | pharmacy_consent | recovery_only | ASRB_050_RF_PATIENT_REQUESTS_V1 | read_only | read_only | RAF_PROD_V1 |
| RIB_056_SUPPORT_REPAIR_ACTION_V1 | audsurf_support_workspace | rf_support_ticket_workspace | support_repair_action | live | ASRB_050_RF_SUPPORT_TICKET_WORKSPACE_V1 | recovery_only | recovery_only | RAF_PROD_V1 |
| RIB_056_OPS_RESILIENCE_ACTION_V1 | audsurf_operations_console | rf_operations_drilldown | ops_resilience_action | live | ASRB_050_RF_OPERATIONS_DRILLDOWN_V1 | recovery_only | recovery_only | RAF_PROD_V1 |
| RIB_056_HUB_MANAGE_BOOKING_V1 | audsurf_hub_desk | rf_hub_case_management | hub_manage_booking | live | ASRB_050_RF_HUB_CASE_MANAGEMENT_V1 | read_only | read_only | RAF_PROD_V1 |
| RIB_056_STAFF_CLAIM_TASK_V1 | audsurf_clinical_workspace | rf_staff_workspace_child | staff_claim_task | live | ASRB_050_RF_STAFF_WORKSPACE_CHILD_V1 | read_only | read_only | RAF_PROD_V1 |
| RIB_056_PHARMACY_CONSOLE_SETTLEMENT_V1 | audsurf_pharmacy_console | rf_pharmacy_console | pharmacy_console_settlement | live | ASRB_050_RF_PHARMACY_CONSOLE_V1 | read_only | read_only | RAF_PROD_V1 |

            ## Read Of The Matrix

            - `bindingState` describes the canonical route-intent tuple, while `published binding state` and `current browser posture` come from the published seq_050 and seq_051 runtime contract pack.
            - This makes it explicit that the current Phase 0 browser posture is still mostly `read_only | recovery_only`, even though the mutation law for future live posture is now fully published and validator-backed.
            - Any route lacking the exact tuple members, exact runtime binding, exact parity, or current freeze posture must stay same-shell but lose calm writable posture.
