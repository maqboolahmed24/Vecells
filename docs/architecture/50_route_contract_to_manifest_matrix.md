# 50 Route Contract To Manifest Matrix

## Route Coverage

| Audience Surface | Route Family | Query Contract | Mutation Contract | Live Channel | Cache Policy | Posture |
| --- | --- | --- | --- | --- | --- | --- |
| audsurf_patient_public_entry | rf_intake_self_service | PQC_050_RF_INTAKE_SELF_SERVICE_V1 | MCC_050_RF_INTAKE_SELF_SERVICE_V1 | none | CP_PUBLIC_NO_PERSISTED_PHI | recovery_only |
| audsurf_patient_public_entry | rf_intake_telephony_capture | PQC_050_RF_INTAKE_TELEPHONY_CAPTURE_V1 | MCC_050_RF_INTAKE_TELEPHONY_CAPTURE_V1 | none | CP_CONSTRAINED_CAPTURE_NO_BROWSER_CACHE | recovery_only |
| audsurf_patient_authenticated_portal | rf_patient_home | PQC_050_RF_PATIENT_HOME_V1 | MCC_050_RF_PATIENT_HOME_V1 | LCC_050_RF_PATIENT_HOME_V1 | CP_PATIENT_SUMMARY_PRIVATE_SHORT | read_only |
| audsurf_patient_authenticated_portal | rf_patient_requests | PQC_050_RF_PATIENT_REQUESTS_V1 | MCC_050_RF_PATIENT_REQUESTS_V1 | LCC_050_RF_PATIENT_REQUESTS_V1 | CP_PATIENT_ROUTE_INTENT_PRIVATE | read_only |
| audsurf_patient_authenticated_portal | rf_patient_appointments | PQC_050_RF_PATIENT_APPOINTMENTS_V1 | MCC_050_RF_PATIENT_APPOINTMENTS_V1 | LCC_050_RF_PATIENT_APPOINTMENTS_V1 | CP_PATIENT_BOOKING_PRIVATE_EPHEMERAL | read_only |
| audsurf_patient_authenticated_portal | rf_patient_health_record | PQC_050_RF_PATIENT_HEALTH_RECORD_V1 | MCC_050_RF_PATIENT_HEALTH_RECORD_V1 | none | CP_PATIENT_ARTIFACT_SUMMARY_NO_STORE | read_only |
| audsurf_patient_authenticated_portal | rf_patient_messages | PQC_050_RF_PATIENT_MESSAGES_V1 | MCC_050_RF_PATIENT_MESSAGES_V1 | LCC_050_RF_PATIENT_MESSAGES_V1 | CP_PATIENT_THREAD_PRIVATE_EPHEMERAL | read_only |
| audsurf_patient_transaction_recovery | rf_patient_secure_link_recovery | PQC_050_RF_PATIENT_SECURE_LINK_RECOVERY_V1 | MCC_050_RF_PATIENT_SECURE_LINK_RECOVERY_V1 | none | CP_GRANT_SCOPED_EPHEMERAL | recovery_only |
| audsurf_patient_transaction_recovery | rf_patient_embedded_channel | PQC_050_RF_PATIENT_EMBEDDED_CHANNEL_V1 | MCC_050_RF_PATIENT_EMBEDDED_CHANNEL_V1 | LCC_050_RF_PATIENT_EMBEDDED_CHANNEL_V1 | CP_EMBEDDED_HOST_SCOPED_EPHEMERAL | recovery_only |
| audsurf_clinical_workspace | rf_staff_workspace | PQC_050_RF_STAFF_WORKSPACE_V1 | MCC_050_RF_STAFF_WORKSPACE_V1 | LCC_050_RF_STAFF_WORKSPACE_V1 | CP_WORKSPACE_SINGLE_ORG_PRIVATE | read_only |
| audsurf_clinical_workspace | rf_staff_workspace_child | PQC_050_RF_STAFF_WORKSPACE_CHILD_V1 | MCC_050_RF_STAFF_WORKSPACE_CHILD_V1 | LCC_050_RF_STAFF_WORKSPACE_CHILD_V1 | CP_WORKSPACE_CHILD_PRIVATE_EPHEMERAL | read_only |
| audsurf_support_workspace | rf_support_ticket_workspace | PQC_050_RF_SUPPORT_TICKET_WORKSPACE_V1 | MCC_050_RF_SUPPORT_TICKET_WORKSPACE_V1 | LCC_050_RF_SUPPORT_TICKET_WORKSPACE_V1 | CP_SUPPORT_MASKED_PRIVATE | recovery_only |
| audsurf_support_workspace | rf_support_replay_observe | PQC_050_RF_SUPPORT_REPLAY_OBSERVE_V1 | MCC_050_RF_SUPPORT_REPLAY_OBSERVE_V1 | LCC_050_RF_SUPPORT_REPLAY_OBSERVE_V1 | CP_SUPPORT_REPLAY_FROZEN_NO_STORE | recovery_only |
| audsurf_hub_desk | rf_hub_queue | PQC_050_RF_HUB_QUEUE_V1 | MCC_050_RF_HUB_QUEUE_V1 | LCC_050_RF_HUB_QUEUE_V1 | CP_HUB_QUEUE_PRIVATE_SUMMARY | read_only |
| audsurf_hub_desk | rf_hub_case_management | PQC_050_RF_HUB_CASE_MANAGEMENT_V1 | MCC_050_RF_HUB_CASE_MANAGEMENT_V1 | LCC_050_RF_HUB_CASE_MANAGEMENT_V1 | CP_HUB_CASE_PRIVATE_EPHEMERAL | read_only |
| audsurf_pharmacy_console | rf_pharmacy_console | PQC_050_RF_PHARMACY_CONSOLE_V1 | MCC_050_RF_PHARMACY_CONSOLE_V1 | LCC_050_RF_PHARMACY_CONSOLE_V1 | CP_PHARMACY_CASE_PRIVATE | read_only |
| audsurf_operations_console | rf_operations_board | PQC_050_RF_OPERATIONS_BOARD_V1 | MCC_050_RF_OPERATIONS_BOARD_V1 | LCC_050_RF_OPERATIONS_BOARD_V1 | CP_OPERATIONS_WATCH_NO_SHARED_CACHE | recovery_only |
| audsurf_operations_console | rf_operations_drilldown | PQC_050_RF_OPERATIONS_DRILLDOWN_V1 | MCC_050_RF_OPERATIONS_DRILLDOWN_V1 | LCC_050_RF_OPERATIONS_DRILLDOWN_V1 | CP_OPERATIONS_CONTROL_EPHEMERAL | recovery_only |
| audsurf_governance_admin | rf_governance_shell | PQC_050_RF_GOVERNANCE_SHELL_V1 | MCC_050_RF_GOVERNANCE_SHELL_V1 | LCC_050_RF_GOVERNANCE_SHELL_V1 | CP_GOVERNANCE_CONTROL_EPHEMERAL | read_only |
