# 11 Gateway Surface And Runtime Topology Baseline

Every one of the 22 audience surfaces now resolves to exactly one published gateway surface and one browser-reachable workload family (`shell_delivery`).

## Gateway Surface Matrix

| Gateway | Audience surface | Route family | Tenant isolation | Downstream families | Session policy | Recovery dispositions |
| --- | --- | --- | --- | --- | --- | --- |
| gws_patient_intake_web | surf_patient_intake_web | rf_intake_self_service | shared_public_pre_tenant | projection, command | SP_PATIENT_PUBLIC_EPHEMERAL | RRD_PATIENT_PUBLIC_PLACEHOLDER, RRD_PATIENT_INTAKE_RECOVERY |
| gws_patient_intake_phone | surf_patient_intake_phone | rf_intake_telephony_capture | shared_public_pre_tenant | projection, command | SP_TELEPHONY_CAPTURE_PROXY | RRD_PATIENT_PUBLIC_PLACEHOLDER, RRD_TELEPHONY_CAPTURE_RECOVERY |
| gws_patient_secure_link_recovery | surf_patient_secure_link_recovery | rf_patient_secure_link_recovery | tenant_scoped_lineage_grant | projection, command | SP_GRANT_SCOPED_RECOVERY | RRD_SECURE_LINK_RECOVERY_ONLY, RRD_IDENTITY_HOLD_PLACEHOLDER |
| gws_patient_home | surf_patient_home | rf_patient_home | tenant_scoped_subject | projection | SP_PATIENT_AUTHENTICATED_SHELL | RRD_PATIENT_HOME_READ_ONLY, RRD_PATIENT_HOME_PLACEHOLDER |
| gws_patient_requests | surf_patient_requests | rf_patient_requests | tenant_scoped_subject | projection, command | SP_PATIENT_AUTHENTICATED_SHELL | RRD_PATIENT_REQUEST_RECOVERY_ONLY, RRD_PATIENT_REQUEST_READ_ONLY |
| gws_patient_appointments | surf_patient_appointments | rf_patient_appointments | tenant_scoped_subject | projection, command | SP_PATIENT_AUTHENTICATED_SHELL | RRD_PATIENT_APPOINTMENT_READ_ONLY, RRD_BOOKING_CONFIRMATION_PLACEHOLDER |
| gws_patient_health_record | surf_patient_health_record | rf_patient_health_record | tenant_scoped_subject | projection | SP_PATIENT_AUTHENTICATED_SHELL | RRD_PATIENT_RECORD_SUMMARY_ONLY, RRD_ARTIFACT_HANDOFF_REQUIRED |
| gws_patient_messages | surf_patient_messages | rf_patient_messages | tenant_scoped_subject | projection, command | SP_PATIENT_AUTHENTICATED_SHELL | RRD_PATIENT_MESSAGES_READ_ONLY, RRD_CONVERSATION_RECOVERY_ONLY |
| gws_patient_embedded_shell | surf_patient_embedded_shell | rf_patient_embedded_channel | tenant_scoped_subject_embedded | projection, command | SP_PATIENT_EMBEDDED_HOST_BOUND | RRD_EMBEDDED_HANDOFF_ONLY, RRD_EMBEDDED_READ_ONLY |
| gws_clinician_workspace | surf_clinician_workspace | rf_staff_workspace | tenant_org_partition | projection, command | SP_STAFF_SSO_SINGLE_ORG | RRD_WORKSPACE_READ_ONLY, RRD_WORKSPACE_QUEUE_PLACEHOLDER |
| gws_clinician_workspace_child | surf_clinician_workspace_child | rf_staff_workspace_child | tenant_org_partition | projection, command | SP_STAFF_SSO_SINGLE_ORG_CHILD | RRD_WORKSPACE_CHILD_READ_ONLY, RRD_WORKSPACE_CHILD_RECOVERY_ONLY |
| gws_practice_ops_workspace | surf_practice_ops_workspace | rf_staff_workspace | tenant_org_partition | projection, command | SP_STAFF_SSO_SINGLE_ORG | RRD_WORKSPACE_READ_ONLY, RRD_WORKSPACE_QUEUE_PLACEHOLDER |
| gws_hub_queue | surf_hub_queue | rf_hub_queue | explicit_cross_org_subject_scope | projection | SP_STAFF_CROSS_ORG_HUB | RRD_HUB_QUEUE_READ_ONLY, RRD_HUB_QUEUE_SUMMARY_ONLY |
| gws_hub_case_management | surf_hub_case_management | rf_hub_case_management | explicit_cross_org_subject_scope | projection, command | SP_STAFF_CROSS_ORG_HUB | RRD_HUB_CASE_READ_ONLY, RRD_HUB_CASE_RECOVERY_ONLY |
| gws_pharmacy_console | surf_pharmacy_console | rf_pharmacy_console | servicing_site_partition | projection, command | SP_PHARMACY_SERVICING_SCOPE | RRD_PHARMACY_READ_ONLY, RRD_PHARMACY_DISPATCH_RECOVERY |
| gws_support_ticket_workspace | surf_support_ticket_workspace | rf_support_ticket_workspace | explicit_support_delegate_scope | projection, command | SP_SUPPORT_TENANT_DELEGATE | RRD_SUPPORT_WORKSPACE_READ_ONLY, RRD_SUPPORT_CAPTURE_RECOVERY |
| gws_support_replay_observe | surf_support_replay_observe | rf_support_replay_observe | explicit_support_investigation_scope | projection, assurance_security | SP_SUPPORT_REPLAY_ENVELOPE | RRD_SUPPORT_REPLAY_MASKED, RRD_SUPPORT_REPLAY_RESTORE_FROZEN |
| gws_support_assisted_capture | surf_support_assisted_capture | rf_support_ticket_workspace | explicit_support_delegate_scope | projection, command, assurance_security | SP_SUPPORT_ASSISTED_CAPTURE | RRD_SUPPORT_CAPTURE_RECOVERY, RRD_SUPPORT_CAPTURE_READ_ONLY |
| gws_operations_board | surf_operations_board | rf_operations_board | platform_observation_aggregate | projection, assurance_security | SP_OPERATIONS_WATCH_TUPLE | RRD_OPERATIONS_DIAGNOSTIC_ONLY, RRD_OPERATIONS_BOARD_FROZEN |
| gws_operations_drilldown | surf_operations_drilldown | rf_operations_drilldown | platform_observation_aggregate | projection, command, assurance_security | SP_RESILIENCE_CONTROL_SCOPE | RRD_RESILIENCE_CONTROL_FROZEN, RRD_OPERATIONS_DIAGNOSTIC_ONLY |
| gws_governance_shell | surf_governance_shell | rf_governance_shell | platform_control_plane_with_explicit_blast_radius | projection, command, assurance_security | SP_GOVERNANCE_SCOPE_TUPLE | RRD_GOVERNANCE_READ_ONLY, RRD_GOVERNANCE_HANDOFF_ONLY |
| gws_assistive_sidecar | surf_assistive_sidecar | rf_staff_workspace_child | inherited_scope_no_standalone_tenant_widening | projection, command | SP_ASSISTIVE_ADJUNCT_INHERITED | RRD_ASSISTIVE_READ_ONLY, RRD_ASSISTIVE_SIDECAR_FROZEN |

## Browser Boundary Law

- Browsers terminate at `public_edge` and the published gateway surface only.
- Gateway surfaces are split whenever session policy, recovery posture, tenant isolation, or downstream workload set changes.
- No gateway surface in this baseline reaches `integration` or `data` directly.
