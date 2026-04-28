# 47 Gateway Surface Map

        The canonical gateway map keeps audience, route family, tenant isolation, downstream workload set, and mutation scope explicit. This closes the generic-BFF drift that seq_011 still allowed.

        ## Surface Table

        | Surface | Audience surface | Route family | Tenant isolation | Session policy | Downstream workloads | Mutating contexts |
        | --- | --- | --- | --- | --- | --- | --- |
        | `gws_patient_intake_web` | `surf_patient_intake_web` | `rf_intake_self_service` | `shared_public_pre_tenant` | `SP_PATIENT_PUBLIC_EPHEMERAL` | `wf_projection_read_models; wf_command_orchestration` | `intake_safety` |
| `gws_patient_intake_phone` | `surf_patient_intake_phone` | `rf_intake_telephony_capture` | `shared_public_pre_tenant` | `SP_TELEPHONY_CAPTURE_PROXY` | `wf_projection_read_models; wf_command_orchestration` | `intake_safety; communications` |
| `gws_patient_secure_link_recovery` | `surf_patient_secure_link_recovery` | `rf_patient_secure_link_recovery` | `tenant_scoped_lineage_grant` | `SP_GRANT_SCOPED_RECOVERY` | `wf_projection_read_models; wf_command_orchestration` | `identity_access` |
| `gws_patient_appointments` | `surf_patient_appointments` | `rf_patient_appointments` | `tenant_scoped_subject` | `SP_PATIENT_AUTHENTICATED_SHELL` | `wf_projection_read_models; wf_command_orchestration` | `booking; hub_coordination` |
| `gws_patient_embedded_shell` | `surf_patient_embedded_shell` | `rf_patient_embedded_channel` | `tenant_scoped_subject_embedded` | `SP_PATIENT_EMBEDDED_HOST_BOUND` | `wf_projection_read_models; wf_command_orchestration` | `identity_access` |
| `gws_patient_messages` | `surf_patient_messages` | `rf_patient_messages` | `tenant_scoped_subject` | `SP_PATIENT_AUTHENTICATED_SHELL` | `wf_projection_read_models; wf_command_orchestration` | `communications` |
| `gws_patient_health_record` | `surf_patient_health_record` | `rf_patient_health_record` | `tenant_scoped_subject` | `SP_PATIENT_AUTHENTICATED_SHELL` | `wf_projection_read_models` | `read_only` |
| `gws_patient_home` | `surf_patient_home` | `rf_patient_home` | `tenant_scoped_subject` | `SP_PATIENT_AUTHENTICATED_SHELL` | `wf_projection_read_models` | `read_only` |
| `gws_patient_requests` | `surf_patient_requests` | `rf_patient_requests` | `tenant_scoped_subject` | `SP_PATIENT_AUTHENTICATED_SHELL` | `wf_projection_read_models; wf_command_orchestration` | `intake_safety; communications; booking; hub_coordination; pharmacy` |
| `gws_assistive_sidecar` | `surf_assistive_sidecar` | `rf_staff_workspace_child; rf_assistive_control_shell` | `inherited_scope_no_standalone_tenant_widening` | `SP_ASSISTIVE_ADJUNCT_INHERITED` | `wf_projection_read_models; wf_command_orchestration` | `triage_workspace` |
| `gws_clinician_workspace_child` | `surf_clinician_workspace_child` | `rf_staff_workspace_child` | `tenant_org_partition` | `SP_STAFF_SSO_SINGLE_ORG_CHILD` | `wf_projection_read_models; wf_command_orchestration` | `triage_workspace; communications` |
| `gws_clinician_workspace` | `surf_clinician_workspace` | `rf_staff_workspace` | `tenant_org_partition` | `SP_STAFF_SSO_SINGLE_ORG` | `wf_projection_read_models; wf_command_orchestration` | `triage_workspace; booking; communications` |
| `gws_practice_ops_workspace` | `surf_practice_ops_workspace` | `rf_staff_workspace` | `tenant_org_partition` | `SP_STAFF_SSO_SINGLE_ORG` | `wf_projection_read_models; wf_command_orchestration` | `triage_workspace; communications` |
| `gws_support_replay_observe` | `surf_support_replay_observe` | `rf_support_replay_observe` | `explicit_support_investigation_scope` | `SP_SUPPORT_REPLAY_ENVELOPE` | `wf_projection_read_models; wf_assurance_security_control` | `support` |
| `gws_support_ticket_workspace` | `surf_support_ticket_workspace` | `rf_support_ticket_workspace` | `explicit_support_delegate_scope` | `SP_SUPPORT_TENANT_DELEGATE` | `wf_projection_read_models; wf_command_orchestration` | `support; identity_access; communications` |
| `gws_support_assisted_capture` | `surf_support_assisted_capture` | `rf_support_ticket_workspace` | `explicit_support_delegate_scope` | `SP_SUPPORT_ASSISTED_CAPTURE` | `wf_projection_read_models; wf_command_orchestration; wf_assurance_security_control` | `support; intake_safety; identity_access; communications` |
| `gws_hub_case_management` | `surf_hub_case_management` | `rf_hub_case_management` | `explicit_cross_org_subject_scope` | `SP_STAFF_CROSS_ORG_HUB` | `wf_projection_read_models; wf_command_orchestration` | `hub_coordination; booking; communications` |
| `gws_hub_queue` | `surf_hub_queue` | `rf_hub_queue` | `explicit_cross_org_subject_scope` | `SP_STAFF_CROSS_ORG_HUB` | `wf_projection_read_models` | `hub_coordination` |
| `gws_pharmacy_console` | `surf_pharmacy_console` | `rf_pharmacy_console` | `servicing_site_partition` | `SP_PHARMACY_SERVICING_SCOPE` | `wf_projection_read_models; wf_command_orchestration` | `pharmacy` |
| `gws_operations_board` | `surf_operations_board` | `rf_operations_board` | `platform_observation_aggregate` | `SP_OPERATIONS_WATCH_TUPLE` | `wf_projection_read_models; wf_assurance_security_control` | `read_only` |
| `gws_operations_drilldown` | `surf_operations_drilldown` | `rf_operations_drilldown` | `platform_observation_aggregate` | `SP_RESILIENCE_CONTROL_SCOPE` | `wf_projection_read_models; wf_command_orchestration; wf_assurance_security_control` | `operations; release_control` |
| `gws_governance_shell` | `surf_governance_shell` | `rf_governance_shell` | `platform_control_plane_with_explicit_blast_radius` | `SP_GOVERNANCE_SCOPE_TUPLE` | `wf_projection_read_models; wf_command_orchestration; wf_assurance_security_control` | `governance_admin; release_control; identity_access; communications` |
