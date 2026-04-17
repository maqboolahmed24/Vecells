# 127 Foundation Manifest Integration

        `seq_127` fuses the current route-family inventory, audience-surface inventory, gateway boundary map, frontend contract manifests, design publication bundles, runtime publication bundle, release parity rows, and persistent shell contracts into one fail-closed authority catalog.

        ## Current state

        - Total fused tuples: `23`
        - Inventoried surfaces covered: `22` / `22`
        - Inventoried route families covered: `20` / `20`
        - Exact tuples: `0`
        - Partial tuples: `20`
        - Blocked tuples: `3`
        - Drifted tuples: `0`

        ## Why the catalog is surface-granular

        Audience-surface publications in `seq_050`, `seq_052`, and `par_094` are grouped at `audsurf_*` level, but the inventory is stricter. `surf_practice_ops_workspace`, `surf_support_assisted_capture`, and `surf_assistive_sidecar` each require their own row so the fusion layer does not hide fan-out behind a route-family aggregate.

        ## Blocked rows

        | Route family | Inventory surface | Shell | Governing bounded context | Verdict |
| --- | --- | --- | --- | --- |
| `rf_assistive_control_shell` | `gap` | `missing` | `assistive` | `blocked` |
| `rf_patient_embedded_channel` | `surf_patient_embedded_shell` | `patient-web` | `patient_experience` | `blocked` |
| `rf_patient_secure_link_recovery` | `surf_patient_secure_link_recovery` | `patient-web` | `identity_access` | `blocked` |

        ## Sample fused rows

        | Route family | Inventory surface | Shell | Governing bounded context | Verdict |
| --- | --- | --- | --- | --- |
| `rf_assistive_control_shell` | `gap` | `missing` | `assistive` | `blocked` |
| `rf_governance_shell` | `surf_governance_shell` | `governance-console` | `governance_admin` | `partial` |
| `rf_hub_case_management` | `surf_hub_case_management` | `hub-desk` | `hub_coordination` | `partial` |
| `rf_hub_queue` | `surf_hub_queue` | `hub-desk` | `hub_coordination` | `partial` |
| `rf_operations_board` | `surf_operations_board` | `ops-console` | `operations` | `partial` |
| `rf_operations_drilldown` | `surf_operations_drilldown` | `ops-console` | `operations` | `partial` |
| `rf_intake_self_service` | `surf_patient_intake_web` | `patient-web` | `intake_safety` | `partial` |
| `rf_intake_telephony_capture` | `surf_patient_intake_phone` | `patient-web` | `intake_safety` | `partial` |
| `rf_patient_appointments` | `surf_patient_appointments` | `patient-web` | `patient_experience` | `partial` |
| `rf_patient_embedded_channel` | `surf_patient_embedded_shell` | `patient-web` | `patient_experience` | `blocked` |
