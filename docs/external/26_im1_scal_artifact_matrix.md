# 26 IM1 SCAL Artifact Matrix

        Every stage-one, unsupported-test, supported-test, assurance, and RFC action now maps back to a named artifact instead of narrative hand-waving.

        ## Section A — `Mock_now_execution`

        The rehearsal studio tracks artifact readiness, freshness, ownership, and blocker posture locally.

        ### Artifact matrix

        | Artifact | Name | Group | Mock status | Freshness | Required for stages |
| --- | --- | --- | --- | --- | --- |
| ART_PRODUCT_PROFILE_DOSSIER | Product profile dossier | initiation | ready | fresh | product_profile_defined<br>official_prerequisites_form_submitted |
| ART_PROVIDER_CAPABILITY_MATRIX_DIGEST | ProviderCapabilityMatrix digest | initiation | ready | fresh | stage_one_scal_stub_ready<br>provider_supplier_targeting_ready<br>compatibility_claim_ready |
| ART_ROUTE_FAMILY_COMPATIBILITY_MATRIX | Route-family compatibility matrix | initiation | ready | fresh | provider_supplier_targeting_ready<br>compatibility_claim_ready |
| ART_STAGE_ONE_SCAL_STUB | Stage-one SCAL stub | initiation | ready | attention | stage_one_scal_stub_ready<br>official_stage_one_scal_issued |
| ART_CLINICAL_SAFETY_DECLARATION | Clinical safety prerequisites declaration | initiation | ready | fresh | prerequisites_drafted<br>official_prerequisites_form_submitted |
| ART_HAZARD_LOG | Hazard log and safety-case digest | assurance | ready | attention | prerequisites_drafted<br>assurance_pack_in_progress<br>official_assurance_completed<br>official_rfc_submitted_for_significant_change |
| ART_DPIA_AND_PRIVACY_NOTICE | DPIA and privacy-notice digest | assurance | ready | attention | prerequisites_drafted<br>assurance_pack_in_progress<br>official_assurance_completed |
| ART_DSPT_ISMS_PEN_TEST_PLAN | DSPT / ISMS / pen-test plan | assurance | ready | attention | prerequisites_drafted<br>assurance_pack_in_progress<br>official_assurance_completed |
| ART_MODEL_INTERFACE_LICENCE_PLACEHOLDERS | Model Interface Licence placeholder register | initiation | ready | fresh | model_interface_licence_placeholder_ready<br>official_model_interface_licence_executed |
| ART_PROVIDER_MOCK_API_REHEARSAL_LOG | Provider mock-API rehearsal log | unsupported_test | ready | fresh | provider_mock_api_rehearsal_ready<br>official_provider_mock_api_accessed |
| ART_PAIRING_INTEGRATION_PACK_REGISTER | Pairing and Integration Pack register | unsupported_test | ready | attention | provider_mock_api_rehearsal_ready<br>official_supported_test_environment_requested |
| ART_SUPPORTED_TEST_REQUEST_CHECKLIST | Supported Test Environment request checklist | supported_test | blocked | blocked | supported_test_readiness_blocked<br>official_supported_test_environment_requested<br>official_supported_test_environment_granted |
| ART_ASSURANCE_EVIDENCE_INDEX | Assurance evidence index | assurance | in_progress | attention | assurance_pack_in_progress<br>official_assurance_completed |
| ART_RFC_TRIGGER_REGISTER | RFC trigger register | rfc_watch | ready | fresh | rfc_watch_registered<br>official_rfc_submitted_for_significant_change |
| ART_PROVIDER_ROSTER_REFRESH_EVIDENCE | Provider roster refresh evidence | initiation | ready | attention | provider_supplier_targeting_ready<br>ready_for_real_im1_submission |

        ## Section B — `Actual_provider_strategy_later`

        Later real IM1 work uses the same artifact set, but the status posture changes from rehearsal to explicit gate control.

        ### Actual-later posture

        | Artifact | Name | Actual status | Owner | Why it matters |
| --- | --- | --- | --- | --- |
| ART_PRODUCT_PROFILE_DOSSIER | Product profile dossier | placeholder_only | ROLE_PROGRAMME_ARCHITECT | Names the bounded Vecells IM1 use case and explicitly excludes Phase 2 identity shortcuts. |
| ART_PROVIDER_CAPABILITY_MATRIX_DIGEST | ProviderCapabilityMatrix digest | ready_for_refresh | ROLE_BOOKING_DOMAIN_LEAD | Every IM1 submission claim must bind back to the capability matrix rather than prose promises. |
| ART_ROUTE_FAMILY_COMPATIBILITY_MATRIX | Route-family compatibility matrix | ready_for_refresh | ROLE_INTEROPERABILITY_LEAD | Shows which route families remain IM1-independent and which booking surfaces need supplier-specific pairing evidence. |
| ART_STAGE_ONE_SCAL_STUB | Stage-one SCAL stub | blocked_until_live_gate | ROLE_INTEROPERABILITY_LEAD | Built from the bounded product dossier plus supplier/product/service-specific tabs. |
| ART_CLINICAL_SAFETY_DECLARATION | Clinical safety prerequisites declaration | ready_for_refresh | ROLE_MANUFACTURER_CSO | Captures the public prerequisite confirmations that must already be true at initial SCAL submission time. |
| ART_HAZARD_LOG | Hazard log and safety-case digest | ready_for_refresh | ROLE_MANUFACTURER_CSO | AI or major functional expansion reopens this pack and must not piggyback on stale approval. |
| ART_DPIA_AND_PRIVACY_NOTICE | DPIA and privacy-notice digest | ready_for_refresh | ROLE_DPO | Must stay current with the exact IM1 use case and supplier data-flow posture. |
| ART_DSPT_ISMS_PEN_TEST_PLAN | DSPT / ISMS / pen-test plan | ready_for_refresh | ROLE_SECURITY_LEAD | A governance artifact, not a hidden side-note to the pairing form. |
| ART_MODEL_INTERFACE_LICENCE_PLACEHOLDERS | Model Interface Licence placeholder register | placeholder_only | ROLE_INTEROPERABILITY_LEAD | Tracks licence readiness without storing real legal names or signatory details in the repo. |
| ART_PROVIDER_MOCK_API_REHEARSAL_LOG | Provider mock-API rehearsal log | blocked_until_live_gate | ROLE_BOOKING_DOMAIN_LEAD | Must preserve unsupported-test truth without claiming live admissibility or canonical booking success. |
| ART_PAIRING_INTEGRATION_PACK_REGISTER | Pairing and Integration Pack register | blocked_until_supplier_access | ROLE_INTEROPERABILITY_LEAD | Captures the supplier-specific documentation bundle required for unsupported test work. |
| ART_SUPPORTED_TEST_REQUEST_CHECKLIST | Supported Test Environment request checklist | blocked_until_live_gate | ROLE_INTEROPERABILITY_LEAD | Cannot progress until the full SCAL, named sponsor, and provider-specific evidence are current. |
| ART_ASSURANCE_EVIDENCE_INDEX | Assurance evidence index | blocked_until_live_gate | ROLE_GOVERNANCE_LEAD | Carries the evidence sequence for test proof, witness tests, and assurance acceptance. |
| ART_RFC_TRIGGER_REGISTER | RFC trigger register | ready | ROLE_PROGRAMME_ARCHITECT | Explicitly fences AI and other major feature changes so stale IM1 posture cannot be silently reused. |
| ART_PROVIDER_ROSTER_REFRESH_EVIDENCE | Provider roster refresh evidence | runtime_fetch_required | ROLE_INTEROPERABILITY_LEAD | The actual-later workflow must fetch the current public roster at runtime instead of hard-coding stale supplier assumptions. |
