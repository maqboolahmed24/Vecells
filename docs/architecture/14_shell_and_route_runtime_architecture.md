# 14 Shell And Route Runtime Architecture

        Shell continuity is the primary architecture rule. The same continuity key reuses the same shell, preserves the current anchor, and patches route state in place.

        ## Representative Shell Demos

        | Demo shell | Profile | Default layout | Routes | Gateway surfaces | Dominant posture |
| --- | --- | --- | --- | --- | --- |
| Patient shell | profile.patient_portal | focus_frame | rf_patient_home; rf_patient_requests; rf_patient_messages | gws_patient_home; gws_patient_requests; gws_patient_messages | summary_only |
| Workspace shell | profile.staff_workspace | two_plane | rf_staff_workspace; rf_staff_workspace_child | gws_clinician_workspace; gws_clinician_workspace_child; gws_practice_ops_workspace | writable |
| Operations shell | profile.operations_console | two_plane | rf_operations_board; rf_operations_drilldown | gws_operations_board; gws_operations_drilldown | diagnostic_only |
| Governance shell | profile.governance_admin | two_plane | rf_governance_shell | gws_governance_shell | governed_writable |

        ## Runtime Model

        - Patient routes default to `focus_frame` on wide viewports and fold to `mission_stack` on narrow ones.
        - Workspace, operations, and governance routes default to `two_plane` and fold to `mission_stack` without losing the dominant action or `SelectedAnchor`.
        - Every live route root publishes `data-shell-type`, `data-channel-profile`, `data-route-family`, `data-layout-topology`, `data-breakpoint-class`, `data-density-profile`, `data-writable-state`, and `data-anchor-state`.
        - The shell reducer owns continuity, `SelectedAnchor` preservation, attention budgeting, and degraded posture. Route modules are not allowed to redefine those semantics locally.
        - Browser reads remain projection-first; browser writes remain command-first; live channels remain advisory until the projection or settlement chain upgrades visible truth.

        ## Same-Shell Law

        - `patient_requests` to `patient_messages` stays in one shell and one current request anchor.
        - `workspace_task` to `workspace_decision` stays in one queue-plus-task shell and keeps the pinned task.
        - `operations_overview` to `operations_health` keeps the same dominant anomaly, the same board shell, and the same intervention workbench.
        - `governance_release` to `governance_config` keeps the same change envelope, scope ribbon, and release tuple.
