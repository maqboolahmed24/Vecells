# 26 IM1 Pairing Rehearsal Strategy

        `Interface_Proof_Atelier` is the seq_026 internal control-tower pack for rehearsing IM1 pairing without pretending Vecells is already approved.

        Summary:
        - total stage rows: 21
        - rehearsal stages: 9
        - blocked live gates: 7
        - provider suppliers currently targeted: 2

        ## Section A — `Mock_now_execution`

        The rehearsal lane exists now because Vecells needs a governed provider-capability seam before live IM1 approval exists. The studio therefore:
        - proves IM1 stays out of the Phase 2 identity critical path
        - binds every compatibility claim to provider-capability and route-family evidence
        - keeps unsupported-test semantics honest without implying live approval
        - tracks future RFC triggers for AI or other significant scope expansion

        ### Rehearsal stages

        | Stage | Name | Group | Entry conditions | Required artifacts | Why it exists |
| --- | --- | --- | --- | --- | --- |
| product_profile_defined | Product profile defined | initiation | Bound the IM1 use case to booking-capability work only.<br>Record that NHS login and patient continuity remain admissible without IM1. | ART_PRODUCT_PROFILE_DOSSIER | This is where the pack closes the critical-path contradiction: IM1 is prepared early but remains non-authoritative for Phase 2 identity. |
| prerequisites_drafted | Prerequisites drafted | initiation | The exact public prerequisites-form fields are mapped.<br>Clinical safety and IG prerequisites are linked to current Vecells artifacts. | ART_CLINICAL_SAFETY_DECLARATION<br>ART_HAZARD_LOG<br>ART_DPIA_AND_PRIVACY_NOTICE<br>ART_DSPT_ISMS_PEN_TEST_PLAN | The rehearsal twin must show exact public prerequisites truth, not a simplified narrative checklist. |
| stage_one_scal_stub_ready | Stage-one SCAL stub ready | initiation | A supplier/product/service dossier exists for stage-one SCAL preparation.<br>Capability, route-family, and architecture digests are current. | ART_STAGE_ONE_SCAL_STUB<br>ART_PROVIDER_CAPABILITY_MATRIX_DIGEST<br>ART_ROUTE_FAMILY_COMPATIBILITY_MATRIX<br>ART_PRODUCT_PROFILE_DOSSIER | The public IM1 page names stage-one SCAL but not every field, so the stub stays explicit about what is derived. |
| provider_supplier_targeting_ready | Provider supplier targeting ready | initiation | The current public provider roster has a fetch-at-runtime source.<br>Each targeted route family has supplier-specific compatibility notes. | ART_PROVIDER_CAPABILITY_MATRIX_DIGEST<br>ART_ROUTE_FAMILY_COMPATIBILITY_MATRIX<br>ART_PROVIDER_ROSTER_REFRESH_EVIDENCE | This stage exists specifically to stop provider paperwork drifting away from actual supplier capability evidence. |
| compatibility_claim_ready | Compatibility claim ready | initiation | Compatibility claims are tied to ProviderCapabilityMatrix and BookingProviderAdapterBinding evidence.<br>The booking truth guardrail statement is current. | ART_PROVIDER_CAPABILITY_MATRIX_DIGEST<br>ART_ROUTE_FAMILY_COMPATIBILITY_MATRIX<br>ART_STAGE_ONE_SCAL_STUB | Compatibility readiness is not the same as live approval or technical acceptance. |
| model_interface_licence_placeholder_ready | Model Interface Licence placeholder ready | initiation | Provider-specific licence slots exist for each targeted supplier.<br>Named signatory placeholders are tracked by role instead of repo fixture. | ART_MODEL_INTERFACE_LICENCE_PLACEHOLDERS | Licence readiness exists early, but licence execution remains a later human-governed checkpoint. |
| provider_mock_api_rehearsal_ready | Provider mock API rehearsal ready | unsupported_test | The unsupported-test simulator preserves supplier truth, ambiguity, and fallback semantics.<br>PIP placeholder registry and provider mock-API rehearsal log are current. | ART_PROVIDER_MOCK_API_REHEARSAL_LOG<br>ART_PAIRING_INTEGRATION_PACK_REGISTER | Access to a provider mock API is never treated as live or authoritative booking truth. |
| assurance_pack_in_progress | Assurance pack in progress | assurance | The assurance evidence index exists.<br>Safety, privacy, architecture, and runtime artifacts are linked into the IM1 pack. | ART_ASSURANCE_EVIDENCE_INDEX<br>ART_HAZARD_LOG<br>ART_DPIA_AND_PRIVACY_NOTICE<br>ART_DSPT_ISMS_PEN_TEST_PLAN | Assurance is represented as an explicit workstream, not a hidden endnote after technical pairing. |
| rfc_watch_registered | RFC watch registered | rfc_watch | AI, major function, supplier, route-family, and medical-device change classes are named.<br>Each class maps to an updated SCAL and documentation expectation. | ART_RFC_TRIGGER_REGISTER | This closes the gap where assistive or AI expansion might otherwise ride through stale IM1 paperwork. |

        ## Section B — `Actual_provider_strategy_later`

        The real-provider path remains fail-closed. IM1 prerequisites, SCAL, supplier mock access, STE requests, assurance, and RFC actions may only progress once the gate pack is green and explicit mutation approval exists.

        ### Official and blocked stages

        | Stage | Name | Class | Browser automation | Gate refs | Later action |
| --- | --- | --- | --- | --- | --- |
| supported_test_readiness_blocked | Supported-test readiness blocked | blocked_until_mvp | partial | LIVE_GATE_PROVIDER_CAPABILITY_MODEL_FROZEN<br>LIVE_GATE_SAFETY_PRIVACY_ARCHITECTURE_CURRENT<br>LIVE_GATE_NAMED_SPONSOR_AND_COMMERCIAL_OWNER<br>LIVE_GATE_NAMED_APPROVER_PRESENT<br>LIVE_GATE_ENVIRONMENT_TARGET_PRESENT | Request Supported Test Environment access only after the live-gate pack turns green. |
| ready_for_real_im1_submission | Ready for real IM1 submission | blocked_until_mvp | partial | LIVE_GATE_EXTERNAL_FOUNDATION_WITHHELD<br>LIVE_GATE_CREDIBLE_MVP_AND_BOUNDED_USE_CASE<br>LIVE_GATE_PROVIDER_CAPABILITY_MODEL_FROZEN<br>LIVE_GATE_SAFETY_PRIVACY_ARCHITECTURE_CURRENT<br>LIVE_GATE_NAMED_SPONSOR_AND_COMMERCIAL_OWNER<br>LIVE_GATE_IM1_NOT_PHASE2_IDENTITY_SHORTCUT<br>LIVE_GATE_NAMED_APPROVER_PRESENT<br>LIVE_GATE_ENVIRONMENT_TARGET_PRESENT<br>LIVE_GATE_PROVIDER_ROSTER_REFRESH_REQUIRED<br>LIVE_GATE_MUTATION_FLAG_ENABLED | Open the later dry-run harness only after the gates pass and an approver confirms mutation. |
| official_prerequisites_form_submitted | Official prerequisites form submitted | official_process | partial | LIVE_GATE_MUTATION_FLAG_ENABLED | Use the gated dry-run harness and stop before final submission unless mutation is explicitly authorised. |
| official_stage_one_scal_issued | Official stage-one SCAL issued | official_process | no |  | Track issuance date and evidence hash once the IM1 team issues stage-one SCAL. |
| official_product_viability_confirmed | Official product viability confirmed | official_process | no |  | Record the official decision and any required scope changes. |
| official_model_interface_licence_executed | Official Model Interface Licence executed | provider_supplier_specific | no | LIVE_GATE_NAMED_SPONSOR_AND_COMMERCIAL_OWNER | Track execution state per supplier after legal completion outside the repo. |
| official_provider_mock_api_accessed | Official provider mock API accessed | provider_supplier_specific | partial |  | Track provider-specific access details in a vault-backed, non-repo register. |
| official_supported_test_environment_requested | Official Supported Test Environment requested | official_process | partial | LIVE_GATE_PROVIDER_CAPABILITY_MODEL_FROZEN<br>LIVE_GATE_SAFETY_PRIVACY_ARCHITECTURE_CURRENT | Submit the STE request only once the pack turns green. |
| official_supported_test_environment_granted | Official Supported Test Environment granted | provider_supplier_specific | no |  | Capture the granted environment details outside the repo and update the evidence index. |
| official_assurance_completed | Official assurance completed | official_process | no |  | Update the assurance evidence pack and acceptance state after external review. |
| official_live_rollout_authorised | Official live rollout authorised | official_process | no |  | Track rollout by supplier and organisation after official approvals land. |
| official_rfc_submitted_for_significant_change | Official RFC submitted for significant change | official_process | partial | LIVE_GATE_MUTATION_FLAG_ENABLED | Submit the RFC via the customer service portal only after the updated pack is current and mutation is authorised. |

        ### Live gate posture

        | Gate | Title | Status | Current posture |
| --- | --- | --- | --- |
| LIVE_GATE_EXTERNAL_FOUNDATION_WITHHELD | External-readiness chain remains withheld | blocked | Seq_020 still reports the downstream external-readiness gate as withheld. |
| LIVE_GATE_CREDIBLE_MVP_AND_BOUNDED_USE_CASE | Credible MVP/demo and bounded IM1 use case | blocked | The rehearsal dossier is ready, but the pack still treats the real provider path as later and gated. |
| LIVE_GATE_PROVIDER_CAPABILITY_MODEL_FROZEN | Provider capability model frozen enough for submission | review_required | The capability model is defined, but supplier-path evidence and seq_036 freeze work are not complete yet. |
| LIVE_GATE_SAFETY_PRIVACY_ARCHITECTURE_CURRENT | Safety, privacy, DPIA, architecture, and data-flow artifacts current | review_required | Current artifacts exist, but the IM1-specific evidence bundle still needs later approval freshness. |
| LIVE_GATE_NAMED_SPONSOR_AND_COMMERCIAL_OWNER | Named sponsor and commercial owner posture known | blocked | The pack carries placeholders only for sponsor and commercial owner. |
| LIVE_GATE_IM1_NOT_PHASE2_IDENTITY_SHORTCUT | IM1 not being used to bypass Phase 2 identity law | pass | The pack explicitly fences IM1 away from patient ownership, grant redemption, and baseline continuity. |
| LIVE_GATE_NAMED_APPROVER_PRESENT | Named approver present | blocked | The dry-run profile still uses an approver placeholder. |
| LIVE_GATE_ENVIRONMENT_TARGET_PRESENT | Environment target present | blocked | The pack defaults to placeholder environment labels and requires explicit later confirmation. |
| LIVE_GATE_PROVIDER_ROSTER_REFRESH_REQUIRED | Current provider-supplier roster fetched at runtime | blocked | The actual-provider dry-run must fetch the current official roster before any real preparation occurs. |
| LIVE_GATE_MUTATION_FLAG_ENABLED | ALLOW_REAL_PROVIDER_MUTATION=true explicitly set | blocked | Real provider mutation remains disabled by default. |
