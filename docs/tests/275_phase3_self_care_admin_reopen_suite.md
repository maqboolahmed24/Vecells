# 275 Phase 3 Self-Care, Admin, And Reopen Suite

`seq_275` is the definitive consequence-family assurance pack for the Phase 3 self-care, bounded admin-resolution, dependency, completion-artifact, and reopen chain.

The lab visual mode is `Boundary_Reopen_Assurance_Lab`.

The suite proves the following repository contracts with real runnable evidence:

- self-care and bounded admin-resolution remain separated by the canonical boundary decision rather than by local copy
- advice render and patient expectation wording stay bound to the current approval, bundle, release-watch, and trust tuple
- bounded admin waiting and completion remain typed, artifact-bound, and blocker-aware
- reopen triggers freeze stale admin or advice posture immediately and preserve provenance rather than calming the case
- patient, staff, and support summaries remain tuple-aligned when a consequence is stable, blocked, completed, stale-recoverable, or reopened

## Suite Shape

The assurance pack is split across one service suite, three Playwright suites, one validator, and one static lab:

- service: `/Users/test/Code/V/services/command-api/tests/275_phase3_boundary_reopen_assurance.integration.test.js`
- multi-actor Playwright: `/Users/test/Code/V/tests/playwright/275_boundary_and_admin_multi_actor.spec.ts`
- visuals and accessibility Playwright: `/Users/test/Code/V/tests/playwright/275_boundary_reopen_visuals.spec.ts`
- dependency, completion-artifact, and reopen Playwright: `/Users/test/Code/V/tests/playwright/275_dependency_and_completion_artifact.spec.ts`
- validator: `/Users/test/Code/V/tools/test/validate_275_phase3_boundary_reopen_suite.py`
- lab: `/Users/test/Code/V/docs/frontend/275_boundary_reopen_assurance_lab.html`

## Coverage

The suite covers:

1. boundary classification:
   - self-care informational advice
   - bounded admin-resolution
   - clinician-review-required reopen
   - stale `DecisionEpoch` invalidation
   - soft copy not changing the underlying boundary meaning
2. advice render, waiting, and completion artifacts:
   - renderable advice with valid content approval binding
   - stale or invalidated advice settlement freezing fresh issue
   - release-watch or trust drift suppressing fresh patient consequence
   - typed waiting posture and typed completion artifact law
3. dependency, release-watch, and reopen:
   - external, identity, and repair blockers governing the lane
   - completion blocked without a valid artifact and aligned patient expectation summary
   - new symptom, material evidence, or invalidated advice requiring reopen
   - reopened consequence preserving prior artifact provenance without leaving calm-success live
4. patient, staff, and support parity:
   - self-care summary alignment
   - admin waiting and completion alignment
   - reopened consequence remaining provenance-first and recovery-bound

## Machine-Readable Evidence

Case and expectation artifacts live in:

- `/Users/test/Code/V/data/test/275_boundary_classification_cases.csv`
- `/Users/test/Code/V/data/test/275_admin_waiting_and_completion_cases.csv`
- `/Users/test/Code/V/data/test/275_dependency_and_reopen_cases.csv`
- `/Users/test/Code/V/data/test/275_patient_staff_parity_cases.csv`
- `/Users/test/Code/V/data/test/275_expected_boundary_and_settlement_outputs.json`
- `/Users/test/Code/V/data/test/275_suite_results.json`
- `/Users/test/Code/V/data/test/275_defect_log_and_remediation.json`

`275_suite_results.json` records `passed_without_repository_fix`. no repository-owned consequence defect remained after rerun.

## Run

Primary validator entry:

- `pnpm --dir /Users/test/Code/V validate:275-phase3-boundary-reopen-suite`

Supporting executions:

- `pnpm --dir /Users/test/Code/V/services/command-api exec vitest run tests/275_phase3_boundary_reopen_assurance.integration.test.js`
- `pnpm exec tsx /Users/test/Code/V/tests/playwright/275_boundary_and_admin_multi_actor.spec.ts --run`
- `pnpm exec tsx /Users/test/Code/V/tests/playwright/275_boundary_reopen_visuals.spec.ts --run`
- `pnpm exec tsx /Users/test/Code/V/tests/playwright/275_dependency_and_completion_artifact.spec.ts --run`

## Result

The suite is repeatable, evidence-rich, and fail-closed. It rejects advice optimism without current approval, admin completion without a valid artifact, reopen as a cosmetic badge, and patient or support summaries that would relabel a reopened consequence as calm or complete.
