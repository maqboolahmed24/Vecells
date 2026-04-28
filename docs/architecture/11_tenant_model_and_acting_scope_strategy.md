# 11 Tenant Model And Acting Scope Strategy

The chosen tenant baseline is hybrid: edge, shell-delivery, assurance, and governance publication remain shared platform services, while command, projection, integration, and storage paths carry explicit tenant scope and blast radius.

## Tenant Isolation Patterns

| Pattern | Scope mode | Isolation mode | Blast radius | Surface refs | Acting scope profiles |
| --- | --- | --- | --- | --- | --- |
| TIM_PUBLIC_PRE_IDENTITY | public_pre_identity | shared_public_pre_tenant | pending_subject_lineage_only | surf_patient_intake_web, surf_patient_intake_phone | ACT_PATIENT_PUBLIC_INTAKE |
| TIM_GRANT_SCOPED_RECOVERY | grant_scoped_subject | tenant_scoped_lineage_grant | single_subject_single_lineage | surf_patient_secure_link_recovery | ACT_PATIENT_GRANT_RECOVERY |
| TIM_PATIENT_SELF_SERVICE | tenant_subject_self_service | tenant_scoped_subject | single_tenant_single_subject | surf_patient_home, surf_patient_requests, surf_patient_appointments, surf_patient_health_record, surf_patient_messages | ACT_PATIENT_AUTHENTICATED |
| TIM_PATIENT_EMBEDDED | tenant_subject_embedded | tenant_scoped_subject_embedded | single_tenant_single_subject_embedded_channel | surf_patient_embedded_shell | ACT_PATIENT_EMBEDDED |
| TIM_TENANT_STAFF_SINGLE_ORG | tenant_org_scoped_staff | tenant_org_partition | single_tenant_single_org_operational_slice | surf_clinician_workspace, surf_clinician_workspace_child, surf_practice_ops_workspace | ACT_STAFF_SINGLE_ORG |
| TIM_HUB_CROSS_ORG | cross_org_hub_scope | explicit_cross_org_subject_scope | declared_cross_org_subset_only | surf_hub_queue, surf_hub_case_management | ACT_HUB_CROSS_ORG |
| TIM_PHARMACY_SERVICING | servicing_site_scope | servicing_site_partition | single_servicing_site_or_declared_return_lane | surf_pharmacy_console | ACT_PHARMACY_SERVICING |
| TIM_SUPPORT_DELEGATE | support_tenant_delegate | explicit_support_delegate_scope | single_ticket_declared_tenant_scope | surf_support_ticket_workspace, surf_support_assisted_capture | ACT_SUPPORT_ASSISTED_CAPTURE |
| TIM_SUPPORT_INVESTIGATION | support_investigation_scope | explicit_support_investigation_scope | selected_anchor_and_envelope_only | surf_support_replay_observe | ACT_SUPPORT_REPLAY_RESTORE |
| TIM_OPERATIONS_MULTI_TENANT | multi_tenant_operational_watch | platform_observation_aggregate | declared_wave_or_incident_scope_only | surf_operations_board, surf_operations_drilldown | ACT_OPERATIONS_WATCH, ACT_RESILIENCE_CONTROL |
| TIM_GOVERNANCE_PLATFORM | platform_governance_scope | platform_control_plane_with_explicit_blast_radius | explicit_tenant_or_multi_tenant_blast_radius | surf_governance_shell | ACT_GOVERNANCE_PLATFORM |
| TIM_ASSISTIVE_ADJUNCT | inherited_from_owner_shell | inherited_scope_no_standalone_tenant_widening | owner_shell_scope_only | surf_assistive_sidecar | ACT_ASSISTIVE_ADJUNCT |

## Acting Scope Profiles

| Profile | Display name | Tuple required | Tenant scope | Purpose | On drift posture |
| --- | --- | --- | --- | --- | --- |
| ACT_PATIENT_PUBLIC_INTAKE | Patient public intake | no | public_pre_identity | public_status | placeholder_only or safe receipt |
| ACT_PATIENT_GRANT_RECOVERY | Patient grant-scoped recovery | no | grant_scoped_subject | secure_link_recovery | recovery_only or blocked |
| ACT_PATIENT_AUTHENTICATED | Authenticated patient self-service | no | tenant_subject_self_service | authenticated_self_service | read_only or recovery_only |
| ACT_PATIENT_EMBEDDED | Embedded patient channel | no | tenant_subject_embedded | authenticated_self_service | handoff_only or read_only |
| ACT_STAFF_SINGLE_ORG | Staff single-organisation operations | yes | tenant_org_scoped_staff | operational_care_delivery | stale_recoverable or denied_scope |
| ACT_HUB_CROSS_ORG | Hub cross-organisation coordination | yes | cross_org_hub_scope | operational_care_delivery | summary_only or denied_scope |
| ACT_PHARMACY_SERVICING | Pharmacy servicing and dispatch | yes | servicing_site_scope | operational_care_delivery | read_only or blocked |
| ACT_SUPPORT_ASSISTED_CAPTURE | Support-assisted capture | yes | support_tenant_delegate | support_assisted_capture | capture_recovery_only or denied_scope |
| ACT_SUPPORT_REPLAY_RESTORE | Support replay and restore | yes | support_investigation_scope | support_recovery | masked_read_only or blocked |
| ACT_OPERATIONS_WATCH | Operations watch and incident observation | yes | multi_tenant_operational_watch | operational_control | diagnostic_copy_only or blocked |
| ACT_RESILIENCE_CONTROL | Resilience restore and failover control | yes | multi_tenant_operational_watch | operational_control | controls_frozen_same_shell |
| ACT_GOVERNANCE_PLATFORM | Governance and platform release control | yes | platform_governance_scope | governance_review | read_only, handoff_only, or blocked |
| ACT_ASSISTIVE_ADJUNCT | Assistive adjunct inherited scope | inherits | inherited_from_owner_shell | adjunct_assistance | freeze assistive controls in place |

## Baseline Law

- Cross-tenant access is legal only through explicit acting context, immutable audit, and purpose-of-use-aware visibility control.
- Governance and operations routes must declare affected tenant and organisation counts instead of implying blast radius from route names or cohorts.
- `ActingScopeTuple` drift freezes writable posture in place; a shell may preserve context, but it may not keep live controls armed.
