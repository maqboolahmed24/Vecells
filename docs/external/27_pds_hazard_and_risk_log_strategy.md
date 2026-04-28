# 27 PDS Hazard And Risk Log Strategy

    The official onboarding support page requires a completed hazard log plus one risk log for each access mode used. This pack turns those obligations into executable readiness artifacts now.

    ## Summary

    - hazard and risk artifacts: 13
    - key upstream risks: `RISK_STATE_004`, `HZ_WRONG_PATIENT_BINDING`

    ## Section A — `Mock_now_execution`

    Mock execution treats hazard and risk work as active engineering inputs:

    - every simulated access mode maps to a hazard and risk artifact row
    - contradictory, stale, throttled, and degraded sandbox responses exercise the same mitigation classes later evidence testing must prove
    - the studio shows artifact freshness and route binding so safety work cannot drift into generic prose

    | Artifact | Type | Access Modes | Gate | Notes |
| --- | --- | --- | --- | --- |
| ART_PDS_HAZARD_LOG | hazard_log | application_restricted;healthcare_worker;healthcare_worker_with_update;patient_access | PDS_LIVE_GATE_HAZARD_LOG_CURRENT | Use the official PDS hazard log template or an equivalent that covers the same hazards. |
| ART_PDS_RISKLOG_APPLICATION_RESTRICTED | connecting_systems_risk_log | application_restricted | PDS_LIVE_GATE_RISK_LOGS_CURRENT | Required because the official onboarding support page publishes a dedicated template for application-restricted mode. |
| ART_PDS_RISKLOG_HEALTHCARE_WORKER | connecting_systems_risk_log | healthcare_worker | PDS_LIVE_GATE_RISK_LOGS_CURRENT | Normalised to the read-only worker class even where the roster says 'healthcare worker mode without update'. |
| ART_PDS_RISKLOG_HEALTHCARE_WORKER_UPDATE | connecting_systems_risk_log | healthcare_worker_with_update | PDS_LIVE_GATE_RISK_LOGS_CURRENT; PDS_LIVE_GATE_ALLOW_REAL_PROVIDER_MUTATION | Update-capable risk log is required before any write-like rehearsal can move beyond simulated mode. |
| ART_PDS_RISKLOG_PATIENT_ACCESS | connecting_systems_risk_log | patient_access | PDS_LIVE_GATE_RISK_LOGS_CURRENT; PDS_LIVE_GATE_ALLOW_REAL_PROVIDER_MUTATION | Patient access is explicitly current in the official roster and integration guidance, but remains future-only in Vecells. |
| ART_PDS_LEGAL_BASIS_DOSSIER | legal_basis_dossier | all_selected_modes | LIVE_GATE_PDS_LEGAL_BASIS_APPROVED | Structured route-family legal basis fields prevent vague narrative approval. |
| ART_PDS_WRONG_PATIENT_MITIGATION_PLAN | wrong_patient_mitigation | all_selected_modes | PDS_LIVE_GATE_WRONG_PATIENT_PLAN_CURRENT | Must prove no lookup can shortcut IdentityBindingAuthority or identity repair. |
| ART_PDS_ROUTE_FLAG_APPROVAL | feature_flag_approval | all_selected_modes | PDS_LIVE_GATE_ROUTE_FLAG_DEFAULT_OFF | Each route-family flag stays default-off or internal-only until this approval exists. |
| ART_PDS_SECURE_NETWORK_PLAN | network_connectivity_plan | healthcare_worker;healthcare_worker_with_update | PDS_LIVE_GATE_SECURE_NETWORK_PATH_PLANNED | Worker modes require an explicit secure-network and strong-auth posture plan. |
| ART_PDS_EVIDENCE_TEST_PLAN | mitigation_evidence_test_plan | all_selected_modes | PDS_LIVE_GATE_RISK_LOGS_CURRENT | The official onboarding support page says the test team arranges evidence testing of the mitigations. |
| ART_PDS_ROLLBACK_REHEARSAL | rollback_rehearsal | all_selected_modes | PDS_LIVE_GATE_ROLLBACK_REHEARSED | Kill switch plus degraded fallback must be rehearsed before any real onboarding is attempted. |
| ART_PDS_SECRET_CAPTURE_PLAN | secret_capture_plan | application_restricted;healthcare_worker;healthcare_worker_with_update;patient_access | LIVE_GATE_PDS_LEGAL_BASIS_APPROVED | Principal and certificate capture remain blocked placeholders until legal basis and feature-flag approval clear. |
| ART_PDS_DATA_HANDLING_NOTE | data_handling_rule | all_selected_modes | PDS_LIVE_GATE_RISK_LOGS_CURRENT | No real NHS numbers or demographic fixtures in repo; logs and screenshots must remain masked. |

    ## Section B — `Actual_provider_strategy_later`

    Before any real onboarding step:

    - refresh the hazard log with the chosen route-family scope
    - upload the risk log for each access mode actually used
    - prepare evidence testing for the listed mitigations
    - keep wrong-patient mitigation and rollback rehearsal current, because PDS enrichment never removes repair obligations
