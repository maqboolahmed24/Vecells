# 123 IM1 Actual Pairing Strategy Later

Reviewed against the current official IM1 and SCAL pages on `2026-04-14`. This document is the `Actual_production_strategy_later` lane for `par_123`.

Related `Mock_now_execution`: see [123_im1_mock_now_execution.md](./123_im1_mock_now_execution.md).

## Mock_now_execution

The mock lane exists to keep engineering unblocked. None of its outputs are treated as submittable evidence until the steps below are satisfied.

## Actual_production_strategy_later

### Live route and non-submittable law

- IM1 is still treated as a live route and must not be written off as deprecated.
- The mock-now dossier is explicitly non-submittable.
- Provider mock API, unsupported test, supported test, assurance, and live remain separate gates.
- AI or other material scope change reopens this path through RFC and refreshed SCAL or safety or privacy evidence.

### Official stage flow reviewed on `2026-04-14`

| Stage ID | Stage | Current interpretation |
| --- | --- | --- |
| im1_clinical_and_ig_prerequisites | IM1 Clinical and Information Governance prerequisites | Complete the current public prerequisites form first. |
| stage_one_scal_and_compatibility_review | Stage-one SCAL and compatibility review | Proceed only after prerequisites are confirmed and compatibility is assessed. |
| model_interface_licence | Model Interface Licence | Execute the Model Interface Licence before expecting provider test access. |
| provider_mock_api_access | Provider mock API access | Supplier-specific mock or PIP access remains a separate gate. |
| unsupported_test_execution | Unsupported test | Unsupported test evidence stays distinct from supported test and assurance. |
| supported_test_environment | Supported test and Supported Test Environment | Submit the fully completed SCAL before asking for supported test access. |
| assurance_and_recommended_to_connect | Assurance and Recommended to Connect | SCAL review, agreed test evidence, and assurance acceptance remain separate from live. |
| live_rollout_and_plan_to_connect | Live rollout and Plan to Connect | Live rollout remains provider-supplier and organisation specific. |
| rfc_for_material_change | RFC for AI or other material functional change | AI or significant functional change requires RFC plus updated SCAL and associated documentation. |

### Conversion steps

- STEP_01_FREEZE_SCOPE_AND_NAMED_OWNERS: Freeze product scope and named owners — blockers: GAP_IM1_NAMED_SUBMITTER_AND_SPONSOR_NOT_FIXED
- STEP_02_REFRESH_CLINICAL_SAFETY_AND_IG_EVIDENCE: Refresh DCB0129, DSPT, DPIA, and security evidence — blockers: GAP_IM1_DSPT_REFRESH_REQUIRED_AFTER_PAR_121
- STEP_03_SUBMIT_THE_CURRENT_PUBLIC_PREREQUISITES_FORM: Submit the current public prerequisites form — blockers: GAP_IM1_NAMED_SUBMITTER_AND_SPONSOR_NOT_FIXED
- STEP_04_COMPLETE_STAGE_ONE_SCAL_AND_PROVIDER_COMPATIBILITY_REVIEW: Complete stage-one SCAL and supplier compatibility review — blockers: GAP_IM1_STAGE_ONE_SCAL_TEMPLATE_AND_COMPATIBILITY_ISSUANCE_PENDING, GAP_IM1_PROVIDER_PACK_EMIS_PENDING, GAP_IM1_PROVIDER_PACK_TPP_PENDING
- STEP_05_EXECUTE_MODEL_INTERFACE_LICENCE: Execute the Model Interface Licence — blockers: GAP_IM1_MODEL_INTERFACE_LICENCE_SIGNATORIES_PENDING
- STEP_06_PROVIDER_MOCK_API_AND_UNSUPPORTED_TEST: Use provider mock API and unsupported test evidence — blockers: GAP_IM1_PROVIDER_PACK_EMIS_PENDING, GAP_IM1_PROVIDER_PACK_TPP_PENDING
- STEP_07_SUPPORTED_TEST_ASSURANCE_AND_LIVE_GATES: Request supported test, complete assurance, and gate live rollout — blockers: GAP_IM1_SUPPORTED_TEST_ENTRY_CRITERIA_PENDING
- STEP_08_LIVE_ROLLOUT_RFC_AND_ASSURANCE_REFRESH: Manage live rollout by supplier and reopen via RFC when scope changes — blockers: GAP_IM1_AI_OR_MATERIAL_CHANGE_RFC_WATCH_REQUIRED

### Step details

#### Step 01 freeze product scope and named owners

Real submission starts only when the named submitter, sponsor, approver, and legal entity chain exists.

#### Step 02 refresh clinical safety and IG evidence

Real IM1 submission cannot claim current clinical and IG readiness while the DSPT pack still carries the stale `PREREQUISITE_GAP_121_DCB0129_SEED_PACK_PENDING` dependency. That issue is recorded here as `GAP_IM1_DSPT_REFRESH_REQUIRED_AFTER_PAR_121`.

#### Step 03 submit the current public prerequisites form

Use the current public prerequisite form only after the named owner chain and refreshed evidence posture are current.

#### Step 04 complete stage-one SCAL and provider compatibility review

Stage-one SCAL remains a later external trigger. Supplier-specific compatibility review and PIP access must stay separate for Optum and TPP.

#### Step 05 execute the Model Interface Licence

Model Interface Licence execution stays blocked until named signatories are fixed and the legal review path is approved.

#### Step 06 provider mock API and unsupported test

Provider mock API access and unsupported test remain supplier-specific and distinct from supported test.

#### Step 07 supported test, assurance, and live gates

Supported test and assurance begin only after the completed SCAL and provider-issued environment access are current.

#### Step 08 live rollout, RFC, and assurance refresh

Live rollout is provider-supplier and organisation specific. Any later AI or other material functional change requires RFC plus refreshed SCAL and associated documentation.
