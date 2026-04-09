# 27 PDS Digital Onboarding Field Map

    The public PDS pages describe the mechanics and required evidence for digital onboarding, but not a full public DOS schema. This field map therefore turns the official mechanics into a deterministic Vecells dossier rather than pretending to be a literal portal scrape.

    ## Summary

    - fields: 25
    - official-guidance-derived fields: 11
    - Vecells dossier fields: 14

    ## Section A — `Mock_now_execution`

    The studio exposes these fields locally so the team can rehearse the dossier and see which live gates are still unmet.

    | Field | Section | Origin | Expected Value | Gate |
| --- | --- | --- | --- | --- |
| fld_org_name | organisation | derived_dossier | Vecells placeholder legal entity | PDS_LIVE_GATE_USE_CASE_TRACEABLE |
| fld_org_ods_code | organisation | derived_dossier | ORG-PLACEHOLDER | PDS_LIVE_GATE_USE_CASE_TRACEABLE |
| fld_product_name | product | derived_dossier | Vecells PDS Optional Enrichment Adapter | PDS_LIVE_GATE_USE_CASE_TRACEABLE |
| fld_product_summary | product | derived_dossier | Optional supporting demographic enrichment behind default-off route flags. | PDS_LIVE_GATE_USE_CASE_TRACEABLE |
| fld_purpose_and_use_case | use_case | official_guidance_requirement | One or more bounded route-family use cases from pds_access_mode_matrix.csv | PDS_LIVE_GATE_USE_CASE_TRACEABLE |
| fld_legal_basis_summary | use_case | official_guidance_requirement | Direct care or patient self-service legal basis per access row | LIVE_GATE_PDS_LEGAL_BASIS_APPROVED |
| fld_route_family_refs | use_case | derived_dossier | rf_patient_secure_link_recovery; rf_patient_home; rf_staff_workspace; rf_support_ticket_workspace; rf_governance_shell; rf_patient_requests | PDS_LIVE_GATE_USE_CASE_TRACEABLE |
| fld_access_modes_used | access_model | official_guidance_requirement | application_restricted; healthcare_worker; healthcare_worker_with_update; patient_access | PDS_LIVE_GATE_ACCESS_MODE_SELECTED |
| fld_secure_network_expectation | access_model | official_guidance_requirement | HSCN or equivalent planned where smartcard or worker access is used | PDS_LIVE_GATE_SECURE_NETWORK_PATH_PLANNED |
| fld_access_method_choice | access_model | official_guidance_requirement | PDS FHIR only; no SMSP fallback hidden inside this task | PDS_LIVE_GATE_ACCESS_MODE_SELECTED |
| fld_why_local_matching_not_enough | identity | derived_dossier | Exact per-row rationale from pds_access_mode_matrix.csv | PDS_LIVE_GATE_USE_CASE_TRACEABLE |
| fld_identity_binding_separation | identity | derived_dossier | PDS lookup never writes Request.patientRef directly; IdentityBindingAuthority only. | PDS_LIVE_GATE_WRONG_PATIENT_PLAN_CURRENT |
| fld_wrong_patient_controls | identity | official_guidance_requirement | freeze, review, audit, masking, rollback, no direct bind | PDS_LIVE_GATE_WRONG_PATIENT_PLAN_CURRENT |
| fld_hazard_log_ref | safety | official_guidance_requirement | ART_PDS_HAZARD_LOG | PDS_LIVE_GATE_HAZARD_LOG_CURRENT |
| fld_risk_log_refs | safety | official_guidance_requirement | Access-mode-specific artifact refs from pds_hazard_risk_artifact_matrix.csv | PDS_LIVE_GATE_RISK_LOGS_CURRENT |
| fld_mitigation_test_plan | safety | official_guidance_requirement | Browser and API rehearsal suite against each mitigation class | PDS_LIVE_GATE_RISK_LOGS_CURRENT |
| fld_feature_flag_default_off | rollout | derived_dossier | All PDS route flags stay off or internal_only until live gates clear | PDS_LIVE_GATE_ROUTE_FLAG_DEFAULT_OFF |
| fld_rollout_cohort | rollout | derived_dossier | tenant + route + environment cohort definition | PDS_LIVE_GATE_ROUTE_FLAG_DEFAULT_OFF |
| fld_kill_switch_plan | rollout | derived_dossier | pds.global.kill_switch plus per-route default-off rollback | PDS_LIVE_GATE_ROLLBACK_REHEARSED |
| fld_named_approver | approvals | derived_dossier | ROLE_INTEROPERABILITY_LEAD | PDS_LIVE_GATE_NAMED_APPROVER_PRESENT |
| fld_environment_target | approvals | derived_dossier | sandbox or integration equivalent | PDS_LIVE_GATE_ENVIRONMENT_TARGET_PRESENT |
| fld_secret_capture_plan | approvals | derived_dossier | ACC_PDS_SANDPIT_PRINCIPAL; KEY_PDS_SANDPIT_CERT via dual control | LIVE_GATE_PDS_LEGAL_BASIS_APPROVED |
| fld_dspt_and_security_posture | assurance | official_guidance_requirement | current DSPT posture plus vault-backed secret plan | PDS_LIVE_GATE_RISK_LOGS_CURRENT |
| fld_cloud_storage_posture | assurance | derived_dossier | No real demographic fixtures in repo; masked logs only; audited storage classes only. | PDS_LIVE_GATE_RISK_LOGS_CURRENT |
| fld_partner_onboarding_contact | assurance | official_guidance_requirement | ROLE_INTEROPERABILITY_LEAD | PDS_LIVE_GATE_USE_CASE_TRACEABLE |

    ## Section B — `Actual_provider_strategy_later`

    Use the same field map for the later onboarding dossier, but fail closed unless:

    - the exact route-bound use case is approved
    - the legal basis is explicit
    - the environment target is named
    - the hazard and risk log references are current
    - `ALLOW_REAL_PROVIDER_MUTATION=true` is set
