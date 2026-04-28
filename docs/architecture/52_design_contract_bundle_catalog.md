# 52 Design Contract Bundle Catalog

## Bundle Rows

| Audience surface | Shell | Route families | Token export | Lint verdict | Structural snapshots |
| --- | --- | --- | --- | --- | --- |
| Patient public entry | patient | rf_intake_self_service, rf_intake_telephony_capture | DTEA_052_PATIENT_SIGNAL_ATLAS_V1 | pass | 3 |
| Authenticated patient portal | patient | rf_patient_home, rf_patient_requests, rf_patient_appointments, rf_patient_health_record, rf_patient_messages | DTEA_052_PATIENT_SIGNAL_ATLAS_V1 | pass | 3 |
| Grant-scoped patient transaction and recovery | patient | rf_patient_secure_link_recovery, rf_patient_embedded_channel | DTEA_052_PATIENT_SIGNAL_ATLAS_V1 | pass | 3 |
| Clinical workspace | staff | rf_staff_workspace, rf_staff_workspace_child | DTEA_052_CLINICAL_WORKSPACE_V1 | pass | 3 |
| Support routes | support | rf_support_ticket_workspace, rf_support_replay_observe | DTEA_052_SUPPORT_WORKSPACE_V1 | pass | 3 |
| Hub desk routes | hub | rf_hub_queue, rf_hub_case_management | DTEA_052_HUB_COORDINATION_V1 | pass | 3 |
| Pharmacy console routes | pharmacy | rf_pharmacy_console | DTEA_052_PHARMACY_CONSOLE_V1 | pass | 3 |
| Operations console routes | operations | rf_operations_board, rf_operations_drilldown | DTEA_052_OPERATIONS_CONSOLE_V1 | pass | 3 |
| Governance and admin routes | governance | rf_governance_shell | DTEA_052_GOVERNANCE_CONSOLE_V1 | pass | 3 |

## Token Export Artifacts

| Artifact | Shell | Profile resolutions | Digest |
| --- | --- | --- | --- |
| DTEA_052_PATIENT_SIGNAL_ATLAS_V1 | patient | 10 | `d81068a8ab30ce89` |
| DTEA_052_CLINICAL_WORKSPACE_V1 | staff | 3 | `6d20891c5a95db4e` |
| DTEA_052_SUPPORT_WORKSPACE_V1 | support | 3 | `36d4774a568e3b29` |
| DTEA_052_HUB_COORDINATION_V1 | hub | 3 | `66a6b012dd2296f3` |
| DTEA_052_PHARMACY_CONSOLE_V1 | pharmacy | 2 | `05bbd54a6dad740c` |
| DTEA_052_OPERATIONS_CONSOLE_V1 | operations | 3 | `002378a19bf601ef` |
| DTEA_052_GOVERNANCE_CONSOLE_V1 | governance | 2 | `9982a7db18226498` |

## Fail-Closed Lint Rules

| Rule | Governs | Blocking effect |
| --- | --- | --- |
| DCLR_052_TOKEN_LATTICE | Token lattice exactness | Any route-local hex, px, or alias bypass blocks publication. |
| DCLR_052_PROFILE_MODE | Profile and mode resolution | Missing or partial mode coverage blocks publication. |
| DCLR_052_SURFACE_SEMANTICS | Surface semantics and kernel propagation | Unbound state classes or aria drift block publication. |
| DCLR_052_ACCESSIBILITY | Accessibility semantic coverage | Degraded or stale semantic coverage blocks publication. |
| DCLR_052_AUTOMATION_TELEMETRY | Automation and telemetry parity | Marker aliases or telemetry name drift block publication. |
| DCLR_052_ARTIFACT_POSTURE | Artifact-mode presentation parity | Detached artifact mode or return-anchor drift blocks publication. |
| DCLR_052_SURFACE_ROLE | Surface role and breakpoint coverage | Role drift or missing breakpoint evidence blocks publication. |
| DCLR_052_STRUCTURAL_EVIDENCE | Structural evidence freshness | Missing or stale structural evidence blocks publication. |
