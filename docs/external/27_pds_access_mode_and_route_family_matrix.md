# 27 PDS Access Mode And Route Family Matrix

    This matrix closes the ad-hoc access-mode selection gap by binding every PDS use case to an exact route family, access mode, fallback, and gate set.

    ## Summary

    - access rows: 9
    - live-gate rows: 13

    ## Section A — `Mock_now_execution`

    | Use Case | Route | Mode | Default | Fallback |
| --- | --- | --- | --- | --- |
| PDS_UC_SECURE_LINK_TRACE | rf_patient_secure_link_recovery | application_restricted | internal_only | Retain local partial_match or review posture and continue with governed support recovery. |
| PDS_UC_PATIENT_HOME_CONTACT_REFRESH | rf_patient_home | patient_access | off | Keep patient preferences local and route any update desire to a non-PDS placeholder or manual support advice. |
| PDS_UC_PATIENT_HOME_NOMINATED_PHARMACY | rf_patient_home | patient_access | off | Continue using local route choice only and clearly label PDS-backed nominated-pharmacy data as unavailable. |
| PDS_UC_STAFF_DIRECT_CARE_TRACE | rf_staff_workspace | healthcare_worker | internal_only | Use local trace plus manual confirmation workflow and keep the request on hold or review where needed. |
| PDS_UC_SUPPORT_IDENTITY_REVIEW | rf_support_ticket_workspace | healthcare_worker | internal_only | Continue support recovery using local evidence bundles and explicit 'PDS unavailable' operator copy. |
| PDS_UC_SUPPORT_CONTACT_CORRECTION | rf_support_ticket_workspace | healthcare_worker_with_update | off | Keep the correction local, capture a support note, and hand off to the external correction process instead of mutating upstream data. |
| PDS_UC_GOVERNANCE_TRACE | rf_governance_shell | healthcare_worker | internal_only | Continue with local audit evidence and record the external corroboration gap explicitly. |
| PDS_UC_GOVERNANCE_UPDATE | rf_governance_shell | healthcare_worker_with_update | off | Record the correction need locally and route it through the partner correction backlog rather than mutating live data. |
| PDS_UC_REQUESTS_PHARMACY_COMPARE | rf_patient_requests | application_restricted | off | Keep route-local pharmacy truth only and label PDS corroboration as unavailable. |

    Access-mode normalisation:

    | Canonical mode | Official labels observed |
| --- | --- |
| application_restricted | Application Restricted, Application-restricted |
| healthcare_worker | Healthcare worker, Healthcare Worker, Healthcare worker mode without update |
| healthcare_worker_with_update | Healthcare worker with update, Health Worker Access with Update |
| patient_access | Patient access, Patient Access Mode |
| other_if_officially_supported | none |

    ## Section B — `Actual_provider_strategy_later`

    The official sources are slightly awkward in wording: the onboarding-support page and operations page still publish four risk-log classes, while the integrated-products roster also uses the label `healthcare worker mode without update`. This pack normalises the read-only worker wording to `healthcare_worker`, keeps `healthcare_worker_with_update` as a distinct mutation-capable class, and preserves the source-dated alias map above so no one invents a hidden fifth baseline mode.
