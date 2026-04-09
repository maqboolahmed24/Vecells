# 26 IM1 Pairing Prerequisites Field Map

        This pack separates the exact public prerequisites-form fields from the derived stage-one SCAL and live-gate dossier fields that Vecells still needs internally.

        Summary:
        - exact public fields: 16
        - total mapped fields: 25

        ## Section A — `Mock_now_execution`

        The studio carries every exact public field now so the team can draft and validate the IM1 prerequisites pack without touching a real portal.

        ### Exact public prerequisites-form fields

        | Field | Label | Section | Mock value | Required for |
| --- | --- | --- | --- | --- |
| fld_contact_name | Name | Exact public prerequisites form | Vecells interoperability lead | product_profile_defined<br>official_prerequisites_form_submitted |
| fld_contact_email | Email | Exact public prerequisites form | interoperability@vecells.example | product_profile_defined<br>official_prerequisites_form_submitted |
| fld_organisation_name | Organisation name | Exact public prerequisites form | Vecells Ltd | product_profile_defined<br>official_prerequisites_form_submitted |
| fld_product_name | Product name | Exact public prerequisites form | Vecells | product_profile_defined<br>official_prerequisites_form_submitted |
| fld_cso_confirmed | Qualified Clinical Safety Officer in place | Clinical safety prerequisites | yes | prerequisites_drafted<br>official_prerequisites_form_submitted |
| fld_use_case_description_confirmed | Detailed use case description covering the whole product | Clinical safety prerequisites | yes | product_profile_defined<br>prerequisites_drafted<br>official_prerequisites_form_submitted |
| fld_clinical_safety_process_confirmed | Written clinical safety process and uplift commitment | Clinical safety prerequisites | yes | prerequisites_drafted<br>official_prerequisites_form_submitted |
| fld_hazard_log_commitment_confirmed | Hazard log capability and uplift commitment | Clinical safety prerequisites | yes | prerequisites_drafted<br>official_prerequisites_form_submitted |
| fld_samd_scrutiny_confirmed | SaMD additional scrutiny understood where applicable | Clinical safety prerequisites | yes | prerequisites_drafted<br>official_prerequisites_form_submitted<br>official_rfc_submitted_for_significant_change |
| fld_dspt_commitment_confirmed | DSPT annual assessment commitment | Information governance prerequisites | yes | prerequisites_drafted<br>official_prerequisites_form_submitted |
| fld_dpia_commitment_confirmed | DPIA and transparency notice commitment | Information governance prerequisites | yes | prerequisites_drafted<br>official_prerequisites_form_submitted<br>assurance_pack_in_progress |
| fld_isms_commitment_confirmed | ISMS / ISO 27001 commitment | Information governance prerequisites | yes | prerequisites_drafted<br>official_prerequisites_form_submitted |
| fld_pen_test_commitment_confirmed | CHECK / CREST penetration-test commitment | Information governance prerequisites | yes | prerequisites_drafted<br>official_prerequisites_form_submitted<br>assurance_pack_in_progress |
| fld_uk_processing_confirmed | UK location for patient-data processing | Information governance prerequisites | yes | prerequisites_drafted<br>official_prerequisites_form_submitted |
| fld_supplier_emis_selected | Integrate with EMIS (EMIS Web) | Provider suppliers | yes | provider_supplier_targeting_ready<br>official_prerequisites_form_submitted |
| fld_supplier_tpp_selected | Integrate with TPP (SystmOne) | Provider suppliers | yes | provider_supplier_targeting_ready<br>official_prerequisites_form_submitted |

        ## Section B — `Actual_provider_strategy_later`

        The public IM1 pages do not list every stage-one SCAL column, so the later strategy adds a derived dossier layer that remains explicit about its provenance.

        ### Derived stage-one SCAL and live-gate fields

        | Field | Label | Origin | Actual-provider placeholder | Required for |
| --- | --- | --- | --- | --- |
| fld_bounded_im1_use_case | Bounded IM1 use case narrative | derived_scal_input | Bounded IM1 scope statement that excludes Phase 2 identity shortcuts and names the exact patient and staff booking surfaces. | stage_one_scal_stub_ready<br>official_stage_one_scal_issued |
| fld_capability_matrix_digest | ProviderCapabilityMatrix digest | derived_scal_input | Published provider capability matrix hash or immutable reference for the submitted scope. | stage_one_scal_stub_ready<br>provider_supplier_targeting_ready<br>compatibility_claim_ready |
| fld_route_family_matrix_digest | Route-family compatibility digest | derived_scal_input | Immutable reference for the submitted route-family-to-supplier compatibility matrix. | provider_supplier_targeting_ready<br>compatibility_claim_ready |
| fld_booking_truth_guardrails | Booking truth and ambiguity guardrails | derived_scal_input | Submission-ready statement showing how supplier truth, ambiguity, and fallback remain separate from canonical booking state. | compatibility_claim_ready<br>provider_mock_api_rehearsal_ready |
| fld_architecture_artifact_set | Current architecture and data-flow artifact set | derived_scal_input | Exact architecture, data-flow, and runtime artifact references attached to the IM1 submission pack. | stage_one_scal_stub_ready<br>assurance_pack_in_progress<br>ready_for_real_im1_submission |
| fld_named_sponsor_placeholder | Named sponsor / commercial owner posture | derived_live_gate | Named sponsor, commercial owner, and contact chain approved for real submission. | ready_for_real_im1_submission<br>official_prerequisites_form_submitted |
| fld_named_approver_placeholder | Named approver | derived_live_gate | Named approver required for any real submission or portal mutation. | ready_for_real_im1_submission<br>official_prerequisites_form_submitted |
| fld_environment_target_placeholder | Environment target | derived_live_gate | Named target such as initiation, unsupported test, supported test, or assurance evidence refresh. | ready_for_real_im1_submission<br>official_supported_test_environment_requested |
| fld_rfc_change_class_digest | RFC change-class digest | derived_live_gate | Current change-class summary tied to the latest assured IM1 scope and RFC pack. | rfc_watch_registered<br>official_rfc_submitted_for_significant_change |

        ### Assumptions

        | Assumption | Summary | Consequence |
| --- | --- | --- |
| ASSUMPTION_IM1_STAGE_ONE_SCAL_FIELDS | The public IM1 pages do not enumerate every stage-one SCAL column, so the derived SCAL input fields below model the minimum product, capability, evidence, and safety inputs Vecells must already have ready before submission. | The pack distinguishes exact public prerequisites-form fields from derived stage-one SCAL dossier fields. |
| ASSUMPTION_IM1_LICENCE_SIGNATORIES_PLACEHOLDER_ONLY | Provider-supplier legal names, consumer legal names, and named signatories are not yet approved for repo storage. The licence register therefore carries role-owned placeholder slots only. | The rehearsal studio tracks licence readiness without storing secrets or real legal details. |
| ASSUMPTION_IM1_REAL_SUBMISSION_REMAINS_BLOCKED | Phase 0 remains withheld and the current-baseline external-readiness chain is not yet cleared. Real IM1 submission therefore stays fail-closed in this pack. | Actual-provider mode shows blocker truth and dry-run preparation only. |
