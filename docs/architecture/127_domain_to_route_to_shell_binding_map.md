# 127 Domain To Route To Shell Binding Map

        The fusion map preserves three distinct truths:

        1. Inventory surfaces and route families
        2. Published audience-surface tuples
        3. Shell residency and continuity ownership

        The shell and publication handles intentionally do not collapse into one namespace. Patient intake and secure-link rows prove the pattern: they still reside in `patient-web`, while their published audience surfaces remain `audsurf_patient_public_entry` and `audsurf_patient_transaction_recovery`.

        ## Route-to-shell sample

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
