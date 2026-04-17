# 50 Frontend Contract Manifest Catalog

## Catalog

| Manifest | Audience Surface | Routes | Queries | Commands | Channels | Cache | Coverage | Posture |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| FCM_050_PATIENT_PUBLIC_ENTRY_V1 | Patient public entry | rf_intake_self_service, rf_intake_telephony_capture | 2 | 2 | 0 | CP_CONSTRAINED_CAPTURE_NO_BROWSER_CACHE, CP_PUBLIC_NO_PERSISTED_PHI | degraded | recovery_only |
| FCM_050_PATIENT_AUTHENTICATED_PORTAL_V1 | Authenticated patient portal | rf_patient_home, rf_patient_requests, rf_patient_appointments, rf_patient_health_record, rf_patient_messages | 5 | 5 | 4 | CP_PATIENT_ARTIFACT_SUMMARY_NO_STORE, CP_PATIENT_BOOKING_PRIVATE_EPHEMERAL, CP_PATIENT_ROUTE_INTENT_PRIVATE, CP_PATIENT_SUMMARY_PRIVATE_SHORT, CP_PATIENT_THREAD_PRIVATE_EPHEMERAL | degraded | read_only |
| FCM_050_PATIENT_TRANSACTION_RECOVERY_V1 | Grant-scoped patient transaction and recovery | rf_patient_secure_link_recovery, rf_patient_embedded_channel | 2 | 2 | 1 | CP_EMBEDDED_HOST_SCOPED_EPHEMERAL, CP_GRANT_SCOPED_EPHEMERAL | blocked | recovery_only |
| FCM_050_CLINICAL_WORKSPACE_V1 | Clinical workspace | rf_staff_workspace, rf_staff_workspace_child | 2 | 2 | 2 | CP_ASSISTIVE_ADJUNCT_NO_PERSIST, CP_WORKSPACE_CHILD_PRIVATE_EPHEMERAL, CP_WORKSPACE_SINGLE_ORG_PRIVATE | degraded | read_only |
| FCM_050_SUPPORT_WORKSPACE_V1 | Support routes | rf_support_ticket_workspace, rf_support_replay_observe | 2 | 2 | 2 | CP_SUPPORT_CAPTURE_PRIVATE_EPHEMERAL, CP_SUPPORT_MASKED_PRIVATE, CP_SUPPORT_REPLAY_FROZEN_NO_STORE | degraded | recovery_only |
| FCM_050_HUB_DESK_V1 | Hub desk routes | rf_hub_queue, rf_hub_case_management | 2 | 2 | 2 | CP_HUB_CASE_PRIVATE_EPHEMERAL, CP_HUB_QUEUE_PRIVATE_SUMMARY | degraded | read_only |
| FCM_050_PHARMACY_CONSOLE_V1 | Pharmacy console routes | rf_pharmacy_console | 1 | 1 | 1 | CP_PHARMACY_CASE_PRIVATE | degraded | read_only |
| FCM_050_OPERATIONS_CONSOLE_V1 | Operations console routes | rf_operations_board, rf_operations_drilldown | 2 | 2 | 2 | CP_OPERATIONS_CONTROL_EPHEMERAL, CP_OPERATIONS_WATCH_NO_SHARED_CACHE | degraded | recovery_only |
| FCM_050_GOVERNANCE_ADMIN_V1 | Governance and admin routes | rf_governance_shell | 1 | 1 | 1 | CP_GOVERNANCE_CONTROL_EPHEMERAL | degraded | read_only |
