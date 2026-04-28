# 123 IM1 Prerequisite Readiness Pack

`par_123` establishes the IM1 prerequisite and SCAL readiness scaffold for Vecells. It keeps `Mock_now_execution` and `Actual_production_strategy_later` visibly separate so engineering can build now without collapsing rehearsal evidence into live onboarding claims later.

## Standards Version

- baseline id: `IM1_SCAL_BASELINE_REVIEWED_2026_04_14`
- reviewed at: `2026-04-14`
- official source count: `5`

- IM1 Pairing integration: <https://digital.nhs.uk/services/digital-services-for-integrated-care/im1-pairing-integration>
- IM1 prerequisites form: <https://digital.nhs.uk/services/digital-services-for-integrated-care/im1-pairing-integration/im1-prerequisites-form>
- Supplier Conformance Assessment List (SCAL): <https://digital.nhs.uk/developer/assurance/scal-process-for-apis-and-services>
- SCAL user guide: <https://digital.nhs.uk/developer/assurance/scal-process-for-apis-and-services/user-guide>
- Interface mechanisms guidance: <https://digital.nhs.uk/services/digital-services-for-integrated-care/im1-pairing-integration/interface-mechanisms-guidance>

## Mock-now versus actual-pairing law

- `Mock_now_execution`: deterministic local IM1 rehearsal pack, supplier capability dossier, question bank, gap register, and simulator-backed evidence placeholders
- `Actual_production_strategy_later`: versioned conversion workflow for the real prerequisites form, stage-one SCAL, licence, provider access, supported test, assurance, live, and RFC refresh
- Current official stage flow was reviewed on `2026-04-14` and remains encoded in [im1_artifact_index.json](../../data/assurance/im1_artifact_index.json)

## Upstream prerequisite posture

- Existing IM1 pairing rehearsal pack: [im1_pairing_pack.json](../../data/analysis/im1_pairing_pack.json)
- Existing IM1 prerequisite field map: [im1_prerequisites_field_map.json](../../data/analysis/im1_prerequisites_field_map.json)
- Existing provider roster and live gate pack: [im1_provider_supplier_register.json](../../data/analysis/im1_provider_supplier_register.json), [im1_live_gate_checklist.json](../../data/analysis/im1_live_gate_checklist.json)
- Clinical safety seed pack: [dcb0129_hazard_register.json](../../data/assurance/dcb0129_hazard_register.json)
- DSPT pack: [dspt_gap_register.json](../../data/assurance/dspt_gap_register.json)

## Mock_now_execution

- prerequisite question rows: `25`
- supplier capability rows: `10`
- SCAL questions: `14`
- known provider suppliers: `Optum (EMISWeb), TPP (SystmOne)`

## Actual_production_strategy_later

- actual conversion artifacts: `6`
- named blockers recorded: `8`
- conversion workflow steps: `8`

## Current blockers

- GAP_IM1_NAMED_SUBMITTER_AND_SPONSOR_NOT_FIXED: Named IM1 submitter, sponsor, approver, and legal signatory chain is not fixed (gap_open)
- GAP_IM1_PROVIDER_PACK_EMIS_PENDING: Optum (EMISWeb) provider-specific PIP and compatibility evidence is still pending (provider_pack_pending)
- GAP_IM1_PROVIDER_PACK_TPP_PENDING: TPP (SystmOne) provider-specific PIP and compatibility evidence is still pending (provider_pack_pending)
- GAP_IM1_DSPT_REFRESH_REQUIRED_AFTER_PAR_121: DSPT pack still carries a stale par_121 prerequisite blocker (gap_open)
- GAP_IM1_STAGE_ONE_SCAL_TEMPLATE_AND_COMPATIBILITY_ISSUANCE_PENDING: Stage-one SCAL and supplier compatibility review remain externally gated (awaiting_external_stage_transition)
- GAP_IM1_MODEL_INTERFACE_LICENCE_SIGNATORIES_PENDING: Model Interface Licence execution cannot proceed because named legal signatories are still pending (gap_open)
- GAP_IM1_SUPPORTED_TEST_ENTRY_CRITERIA_PENDING: Supported-test and assurance entry criteria are not yet fully met (gap_open)
- GAP_IM1_AI_OR_MATERIAL_CHANGE_RFC_WATCH_REQUIRED: AI or other material functional change must reopen the IM1 pack via RFC and refreshed SCAL (watch_open)

## Deliverables

- [123_im1_mock_now_execution.md](./123_im1_mock_now_execution.md)
- [123_im1_actual_pairing_strategy_later.md](./123_im1_actual_pairing_strategy_later.md)
- [123_scal_response_strategy.md](./123_scal_response_strategy.md)
- [123_supplier_capability_and_pairing_assumptions.md](./123_supplier_capability_and_pairing_assumptions.md)
- [im1_prerequisite_question_matrix.csv](../../data/assurance/im1_prerequisite_question_matrix.csv)
- [im1_scal_question_bank.json](../../data/assurance/im1_scal_question_bank.json)
- [im1_artifact_index.json](../../data/assurance/im1_artifact_index.json)
- [im1_supplier_capability_matrix.csv](../../data/assurance/im1_supplier_capability_matrix.csv)
- [im1_gap_register.json](../../data/assurance/im1_gap_register.json)

## Notes

- This pack intentionally records the stale DSPT dependency instead of silently rewriting `par_122`.
- IM1 remains live, supplier-specific, and gate-heavy as of `2026-04-14`.
- Mock provider evidence is for architecture validation only and stays visibly non-submittable.
