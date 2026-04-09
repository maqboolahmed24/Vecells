# 14 Gateway BFF Pattern And Surface Split

        Vecells should keep one logical API-gateway executable but many published gateway surfaces. The split happens at the contract layer, not by improvising route-local handlers in the browser stack.

        ## BFF Pattern Scorecard

        | Pattern | Session | Tenant | Trust | Downstream | Total | Decision |
| --- | --- | --- | --- | --- | --- | --- |
| One generic BFF for all audiences | 1 | 1 | 1 | 1 | 6 | rejected |
| One BFF per audience family | 3 | 3 | 2 | 3 | 14 | rejected |
| Split published gateway surfaces by route-family contract when tenant, trust, or workload changes | 5 | 5 | 5 | 5 | 25 | chosen |

        ## Chosen Law

        - Chosen pattern id: `BFF_ROUTE_FAMILY_SPLIT`
        - `GatewayBffSurface` remains the only browser-facing compute authority.
        - Split a gateway surface whenever tenant isolation, trust-zone boundary, session policy, recovery posture, or downstream workload set changes.
        - Route families may share infrastructure, but they may not share an undocumented surface tuple.
        - Patient, workspace, hub, pharmacy, support, operations, governance, and assistive surfaces all consume the same frontend kernel shape while retaining distinct published boundary rows.

        ## Gateway Surface Matrix

        | Gateway | Route family | Shell | App | Tenant isolation | Downstream families |
| --- | --- | --- | --- | --- | --- |
| gws_patient_intake_web | rf_intake_self_service | patient | app_patient_web | shared_public_pre_tenant | projection; command |
| gws_patient_intake_phone | rf_intake_telephony_capture | patient | app_patient_web | shared_public_pre_tenant | projection; command |
| gws_patient_secure_link_recovery | rf_patient_secure_link_recovery | patient | app_patient_web | tenant_scoped_lineage_grant | projection; command |
| gws_patient_home | rf_patient_home | patient | app_patient_web | tenant_scoped_subject | projection |
| gws_patient_requests | rf_patient_requests | patient | app_patient_web | tenant_scoped_subject | projection; command |
| gws_patient_appointments | rf_patient_appointments | patient | app_patient_web | tenant_scoped_subject | projection; command |
| gws_patient_health_record | rf_patient_health_record | patient | app_patient_web | tenant_scoped_subject | projection |
| gws_patient_messages | rf_patient_messages | patient | app_patient_web | tenant_scoped_subject | projection; command |
| gws_patient_embedded_shell | rf_patient_embedded_channel | patient | app_patient_web | tenant_scoped_subject_embedded | projection; command |
| gws_clinician_workspace | rf_staff_workspace | staff | app_clinical_workspace | tenant_org_partition | projection; command |
| gws_clinician_workspace_child | rf_staff_workspace_child | staff | app_clinical_workspace | tenant_org_partition | projection; command |
| gws_practice_ops_workspace | rf_staff_workspace | staff | app_clinical_workspace | tenant_org_partition | projection; command |
| gws_hub_queue | rf_hub_queue | hub | app_hub_desk | explicit_cross_org_subject_scope | projection |
| gws_hub_case_management | rf_hub_case_management | hub | app_hub_desk | explicit_cross_org_subject_scope | projection; command |
| gws_pharmacy_console | rf_pharmacy_console | pharmacy | app_pharmacy_console | servicing_site_partition | projection; command |
| gws_support_ticket_workspace | rf_support_ticket_workspace | support | app_support_console | explicit_support_delegate_scope | projection; command |
| gws_support_replay_observe | rf_support_replay_observe | support | app_support_console | explicit_support_investigation_scope | projection; assurance_security |
| gws_support_assisted_capture | rf_support_ticket_workspace | support | app_support_console | explicit_support_delegate_scope | projection; command; assurance_security |
| gws_operations_board | rf_operations_board | operations | app_ops_console | platform_observation_aggregate | projection; assurance_security |
| gws_operations_drilldown | rf_operations_drilldown | operations | app_ops_console | platform_observation_aggregate | projection; command; assurance_security |
| gws_governance_shell | rf_governance_shell | governance | app_governance_admin | platform_control_plane_with_explicit_blast_radius | projection; command; assurance_security |
| gws_assistive_sidecar | rf_staff_workspace_child | staff | app_clinical_workspace | inherited_scope_no_standalone_tenant_widening | projection; command |

        ## Browser Boundary Guardrails

        - No browser-origin call reaches adapters, stores, or data-plane services directly.
        - `support_replay_observe` stays separate because it is masked, observe-only, and assurance-bound.
        - `patient_secure_link_recovery` stays separate because grant-scoped recovery and recovery-only postures cannot share the authenticated patient surface tuple.
        - `operations_drilldown` and `governance_shell` stay separate because resilience control and release blast-radius fences are different runtime obligations.
