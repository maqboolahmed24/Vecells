# 26 IM1 Provider Supplier And Licence Register

        The provider-supplier lane is now explicit and machine-readable. The pack also forces a runtime refresh of the current public roster so later execution does not silently trust stale supplier assumptions.

        ## Section A — `Mock_now_execution`

        ### Provider and route-family compatibility matrix

        | Row | Provider supplier | Route family | IM1 role | Mock position | Truth guardrail |
| --- | --- | --- | --- | --- | --- |
| cmp_intake_optum | ps_optum_emisweb | rf_intake_self_service | not_required | rehearse IM1 disclaimer only | Intake capture and submit remain canonical without IM1. |
| cmp_intake_tpp | ps_tpp_systmone | rf_intake_self_service | not_required | rehearse IM1 disclaimer only | Intake capture and submit remain canonical without IM1. |
| cmp_recovery_optum | ps_optum_emisweb | rf_patient_secure_link_recovery | not_required | show explicit recovery independence | IM1 is never a shortcut to patient ownership or grant redemption. |
| cmp_recovery_tpp | ps_tpp_systmone | rf_patient_secure_link_recovery | not_required | show explicit recovery independence | IM1 is never a shortcut to patient ownership or grant redemption. |
| cmp_home_optum | ps_optum_emisweb | rf_patient_home | not_required | show read-only independence | Authenticated home remains NHS-login-governed and publication-governed. |
| cmp_home_tpp | ps_tpp_systmone | rf_patient_home | not_required | show read-only independence | Authenticated home remains NHS-login-governed and publication-governed. |
| cmp_requests_optum | ps_optum_emisweb | rf_patient_requests | not_required | show request-tracker independence | Request lineage truth remains canonical without IM1. |
| cmp_requests_tpp | ps_tpp_systmone | rf_patient_requests | not_required | show request-tracker independence | Request lineage truth remains canonical without IM1. |
| cmp_appointments_optum | ps_optum_emisweb | rf_patient_appointments | blocked_without_pairing | simulate unsupported, pending, and ambiguous booking states locally | No search result, queue acceptance, or provider 202 response implies booked truth. |
| cmp_appointments_tpp | ps_tpp_systmone | rf_patient_appointments | blocked_without_pairing | simulate unsupported, pending, and ambiguous booking states locally | No search result, queue acceptance, or provider 202 response implies booked truth. |
| cmp_workspace_optum | ps_optum_emisweb | rf_staff_workspace | supplier_specific_review | show blocked supplier reach with manual fallback and review states | Staff tools may review supplier posture but may not write canonical request state directly from supplier acceptance. |
| cmp_workspace_tpp | ps_tpp_systmone | rf_staff_workspace | supplier_specific_review | show blocked supplier reach with manual fallback and review states | Staff tools may review supplier posture but may not write canonical request state directly from supplier acceptance. |

        ## Section B — `Actual_provider_strategy_later`

        ### Licence placeholder register

        | Row | Provider supplier | State | Consumer signatory role | Provider signatory role | Approver | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| lic_optum_placeholder | ps_optum_emisweb | placeholder_only | ROLE_COMMERCIAL_OWNER | provider_supplier_signatory | ROLE_GOVERNANCE_LEAD | No real legal names or signatories stored in repo fixtures. |
| lic_tpp_placeholder | ps_tpp_systmone | placeholder_only | ROLE_COMMERCIAL_OWNER | provider_supplier_signatory | ROLE_GOVERNANCE_LEAD | No real legal names or signatories stored in repo fixtures. |

        ### Roster refresh rule

        - source: `https://digital.nhs.uk/services/digital-services-for-integrated-care/im1-pairing-integration`
        - known capture on: `2026-04-09`
        - rule: The actual-provider dry-run harness must fetch the current IM1 Pairing page at runtime and confirm the provider supplier roster before preparing any real submission payload.
