# 272 Phase 3 Queue Fairness, Duplicate, and Stale-Owner Suite

Task `seq_272` publishes the definitive Phase 3 queue-governance assurance pack for deterministic ranking, fairness honesty, duplicate authority, and stale-owner continuity.

This suite is repository-runnable. It is not a paper audit. It executes the real queue-ranking, duplicate-review, triage-kernel, reservation-queue-control, and browser-visible assurance lab paths that already exist in the repository.

The assurance surface visual mode is `Queue_Fairness_Recovery_Lab`.

## Local source trace

The suite is grounded in:

1. `blueprint/phase-3-the-human-checkpoint.md`
2. `blueprint/staff-workspace-interface-architecture.md`
3. `blueprint/phase-0-the-foundation-protocol.md`
4. validated outputs from `232`, `233`, `234`, `241`, `242`, `255`, `256`, `261`, `262`, `268`, `269`

## What the suite proves

- queue ordering is deterministic, explainable, and replayable against one fact cut
- changed fact cuts create new snapshots without rewriting prior hashes
- `preemptionPending = 1` work is excluded from the routine queue
- overload is admitted honestly with `overload_critical` instead of falsely promising fairness
- reviewer-fit suggestions stay downstream of canonical queue order
- duplicate review stays bound to `DuplicateReviewSnapshot`, `DuplicatePairEvidence`, and append-only supersession
- claim races serialize through the live lease fence
- stale-owner recovery and supervisor takeover preserve launch context and continuity
- next-task launch blocks on stale-owner recovery rather than silently outrunning it
- keyboard navigation, reduced motion, ARIA coverage, and screenshot proof remain aligned with the machine-readable evidence pack

## Executed proof spine

Service and algorithm proof:

```bash
pnpm --dir /Users/test/Code/V/packages/api-contracts exec vitest run tests/queue-ranking.test.ts
pnpm --dir /Users/test/Code/V/services/command-api exec vitest run tests/272_phase3_queue_governance_assurance.integration.test.js tests/duplicate-review.integration.test.js tests/triage-task-state-machine.integration.test.js
```

Browser proof:

```bash
pnpm exec tsx /Users/test/Code/V/tests/playwright/272_queue_fairness_recovery.spec.ts --run
pnpm exec tsx /Users/test/Code/V/tests/playwright/272_queue_concurrency_multi_user.spec.ts --run
pnpm exec tsx /Users/test/Code/V/tests/playwright/272_queue_visual_and_accessibility.spec.ts --run
```

Validator:

```bash
python3 /Users/test/Code/V/tools/test/validate_272_queue_fairness_duplicate_stale_owner_suite.py
```

## Artifacts

- suite case matrix: [272_phase3_queue_case_matrix.md](/Users/test/Code/V/docs/tests/272_phase3_queue_case_matrix.md)
- assurance lab: [272_queue_fairness_recovery_lab.html](/Users/test/Code/V/docs/frontend/272_queue_fairness_recovery_lab.html)
- queue replay rows: [272_queue_replay_cases.csv](/Users/test/Code/V/data/test/272_queue_replay_cases.csv)
- duplicate authority rows: [272_duplicate_and_resolution_cases.csv](/Users/test/Code/V/data/test/272_duplicate_and_resolution_cases.csv)
- stale-owner rows: [272_stale_owner_and_takeover_cases.csv](/Users/test/Code/V/data/test/272_stale_owner_and_takeover_cases.csv)
- expected hashes and outcomes: [272_expected_rank_snapshots_and_hashes.json](/Users/test/Code/V/data/test/272_expected_rank_snapshots_and_hashes.json)
- suite results: [272_suite_results.json](/Users/test/Code/V/data/test/272_suite_results.json)
- defect log: [272_defect_log_and_remediation.json](/Users/test/Code/V/data/test/272_defect_log_and_remediation.json)

## Repository-owned remediation captured by 272

No new repository-owned algorithm defect remained after the `272` suites were wired and rerun.

That is recorded explicitly in [272_defect_log_and_remediation.json](/Users/test/Code/V/data/test/272_defect_log_and_remediation.json). The suite still fails if later repository drift breaks deterministic replay, overload honesty, duplicate authority, or stale-owner continuity.
