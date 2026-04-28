# 123 SCAL Response Strategy

Reviewed against the current official IM1 and SCAL pages on `2026-04-14`.

This document turns the current Vecells evidence posture into a SCAL-oriented question bank while preserving the separation between `Mock_now_execution` and `Actual_production_strategy_later`.

## Mock_now_execution

- The mock lane uses deterministic source-traceable evidence to answer likely SCAL questions now.
- Where the answer cannot be honest yet, the question stays `gap_open`, `provider_pack_pending`, or `dependency_refresh_required`.
- Simulator evidence is allowed only as rehearsal proof, never as supplier acceptance evidence.

## Actual_production_strategy_later

- The actual lane requires current prerequisite confirmation, supplier-specific compatibility review, and a refreshed evidence pack before the SCAL becomes submittable.
- Supplier-specific functionality is never presented as generic IM1 truth.
- AI or material product change must reopen the SCAL via RFC and refreshed supporting documentation.

## Domain coverage

| Question ID | Domain | Mock gap state | Actual gap state |
| --- | --- | --- | --- |
| SCAL_SCOPE_01 | architecture_and_product_scope | covered_with_mock_evidence | ready_for_conversion_after_scope_freeze |
| SCAL_SCOPE_02 | architecture_and_product_scope | covered_with_mock_evidence | provider_pack_pending |
| SCAL_TECH_01 | technical_conformance | covered_with_mock_evidence | ready_for_refresh_before_submission |
| SCAL_TECH_02 | technical_conformance | covered_with_mock_evidence | provider_pack_pending |
| SCAL_SAFETY_01 | clinical_safety | covered_with_mock_evidence | ready_for_refresh_before_submission |
| SCAL_SAFETY_02 | clinical_safety | covered_with_mock_evidence | watch_rfc_trigger |
| SCAL_IG_01 | information_governance_and_security | covered_with_mock_evidence | dependency_refresh_required |
| SCAL_IG_02 | information_governance_and_security | gap_open | gap_open |
| SCAL_TEST_01 | test_evidence_and_simulator_evidence | covered_with_mock_evidence | awaiting_provider_mock_api_access |
| SCAL_TEST_02 | test_evidence_and_simulator_evidence | covered_with_mock_evidence | blocked_until_completed_scal_and_environment_access |
| SCAL_CHANGE_01 | release_and_change_control_evidence | covered_with_mock_evidence | ready_for_conversion_after_named-owners |
| SCAL_PROVIDER_01 | provider_compatibility_and_licence_gating | covered_with_mock_evidence | provider_pack_pending |
| SCAL_PROVIDER_02 | provider_compatibility_and_licence_gating | covered_with_mock_evidence | provider_pack_pending |
| SCAL_ASSURANCE_01 | supported_test_and_assurance_entry_criteria | covered_with_mock_evidence | conversion_blockers_named |

## Technical conformance

- Supplier-specific adapter behaviour stays behind canonical booking and confirmation truth contracts.
- Pairing Integration Pack details remain provider-specific and are not guessed from the mock lane.

## Clinical safety

- The DCB0129 seed pack is current enough to scaffold the response now.
- Any real submission still requires a current product-scope review and assurance refresh before submission.

## Information governance and security

- The current DSPT pack is usable for planning now.
- A stale dependency from par_122 is still recorded and blocks real submission refresh.

## Supported test and assurance entry

- Completed SCAL, provider access, and explicit environment targets are all mandatory before supported test.
- Supported test, assurance, and live remain serial rather than collapsed.
