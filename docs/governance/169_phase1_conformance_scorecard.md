# Phase 1 Conformance Scorecard

Source of truth: `data/analysis/169_phase1_conformance_rows.json`

All required Phase 1 capability families are approved for the simulator-first web intake baseline.

| Family                                              | Status     | Primary proof                                                                                                                            |
| --------------------------------------------------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Public intake contract and question flow            | `approved` | `data/contracts/139_intake_draft_view.schema.json`, `tests/playwright/156_request_type_selection_and_progressive_question_flow.spec.js`  |
| Autosave lease and resume substrate                 | `approved` | `data/analysis/144_draft_autosave_state_matrix.csv`, `data/performance/168_suite_results.json`                                           |
| Attachment quarantine and evidence classification   | `approved` | `data/contracts/141_attachment_acceptance_policy.json`, `data/test/165_suite_results.json`                                               |
| Immutable promotion and normalization               | `approved` | `data/contracts/148_intake_submit_settlement_contract.json`, `services/command-api/tests/166_replay_collision_suite.integration.test.js` |
| Synchronous safety and urgent diversion             | `approved` | `data/contracts/142_red_flag_decision_tables.yaml`, `tests/playwright/160_same_shell_urgent_diversion_surface.spec.js`                   |
| Triage receipt ETA and minimal tracking             | `approved` | `data/analysis/152_status_mapping_matrix.csv`, `tests/playwright/162_minimal_track_my_request_page.spec.js`                              |
| Confirmation and notification truth                 | `approved` | `data/contracts/153_confirmation_dispatch_contract.json`, `data/performance/168_suite_results.json`                                      |
| Stale token and post-promotion recovery             | `approved` | `data/contracts/154_resume_blocking_and_recovery_contract.json`, `data/test/166_expected_idempotency_and_side_effect_counts.json`        |
| Browser continuity accessibility and reduced motion | `approved` | `data/test/167_regression_results.json`, `tests/playwright/167_phase1_channel_and_accessibility.spec.js`                                 |
| Replay duplicate and collision proof                | `approved` | `data/test/166_submit_replay_cases.csv`, `tools/test/validate_replay_and_collision_suite.py`                                             |
| Performance and resilience proof                    | `approved` | `data/performance/168_suite_results.json`, `tests/playwright/168_burst_resilience_lab.spec.js`                                           |

## Evidence Model

Each scorecard row records source references, implementation evidence, automated proof artifacts, verification suite references, invariant references, status, and blocking rationale. The validator fails if any approved row lacks implementation evidence, automated proof, or a matching manifest row.

## Status Semantics

`approved` means the capability family is complete for the simulator-first Phase 1 web intake baseline. It does not imply Phase 2 identity authority, telephony continuation, live provider proof, or production signoff.
