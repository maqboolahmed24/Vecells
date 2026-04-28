# 276 Phase 3 Workspace Hardening Suite

`seq_276` closes the Phase 3 workspace hardening pass with real browser proof against the repository shell, not a paper audit.

## Scope

- semantic coverage and assistive announcements for queue, task, recovery, and peer routes
- keyboard and focus recovery for skip links, same-shell dialog dismissal, and read-only degradation
- 200% large-text, compact reflow, mission-stack, and reduced-motion proof
- large-queue performance budgets, task transitions, attachment loading, and zero-layout-shift command-palette proof
- one writer versus many readers across more-info, approvals, escalations, changed review, and support-linked message repair
- PHI-safe browser evidence across queue, task, callback, message, and consequence shells

## Browser suites

1. `/Users/test/Code/V/tests/playwright/276_workspace_semantics_and_focus.spec.ts`
2. `/Users/test/Code/V/tests/playwright/276_workspace_zoom_motion_and_reflow.spec.ts`
3. `/Users/test/Code/V/tests/playwright/276_workspace_multi_user_read_only.spec.ts`
4. `/Users/test/Code/V/tests/playwright/276_workspace_performance.spec.ts`
5. `/Users/test/Code/V/tests/playwright/276_workspace_visual_regression.spec.ts`

## Machine-readable evidence

- `/Users/test/Code/V/data/test/276_semantic_and_keyboard_cases.csv`
- `/Users/test/Code/V/data/test/276_zoom_motion_reflow_cases.csv`
- `/Users/test/Code/V/data/test/276_multi_user_read_only_cases.csv`
- `/Users/test/Code/V/data/test/276_performance_budget_manifest.json`
- `/Users/test/Code/V/data/test/276_web_vitals_and_interaction_metrics.json`
- `/Users/test/Code/V/data/test/276_suite_results.json`
- `/Users/test/Code/V/data/test/276_defect_log_and_remediation.json`

## Repository fixes closed by the suite

1. `WHS276_DEF_001`: the queue advertised windowing but still rendered the full >50 row list.
2. `WHS276_DEF_002`: the workspace lacked the required command palette and initially dropped focus on dialog dismissal.
3. `WHS276_DEF_003`: same-shell history writes stripped `state` and `fixture`, collapsing hardening and recovery routes mid-session.
4. `WHS276_DEF_004`: runtime scenario parsing rejected underscore route tokens such as `read_only` and `recovery_only`.
5. `WHS276_DEF_005`: hardening-safe anonymization stopped at queue/task seeds and still leaked patient names in callback and message workbenches.
6. `WHS276_DEF_006`: escalation read-only posture left the urgent mutation action enabled instead of freezing it.
7. `WHS276_DEF_007`: the workspace observability catalog lacked the root `stale_recovery` event row and crashed stale task routes.

## Acceptance posture

The suite fails when any of the following drift:

- a calm live route publishes incomplete semantic coverage
- a large queue renders as a full list instead of a bounded window
- a read-only actor regains a writable control by refresh or route change
- reduced motion changes meaning or strips the same-shell state summary
- command-palette open or close shifts the underlying shell
- performance budgets are exceeded without an explicit defect entry
- PHI leaks into browser-visible evidence
