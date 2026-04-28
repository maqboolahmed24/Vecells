# Phase 1 Capacity Limits And Backpressure Rules

Sequence: `seq_168`

These limits are the operating rules for Phase 1 intake burst and resilience testing. The backpressure rules are machine-readable through `data/performance/168_load_profiles.yaml`, `data/performance/168_browser_budget_targets.json`, and `tools/performance/validate_phase1_performance_suite.py`.

## Capacity Budgets

| Profile                    | Peak pressure |     p95 |     p99 | Recovery | Hard fail threshold                                                   |
| -------------------------- | ------------: | ------: | ------: | -------: | --------------------------------------------------------------------- |
| Autosave burst             |        96 rps |  650 ms | 1200 ms |     30 s | false saved state or duplicate save side effect                       |
| Submit burst/replay storm  |        64 rps |  900 ms | 1600 ms |     20 s | duplicate request, promotion, triage, notification, or receipt bridge |
| Upload scan backlog        |        36 rps | 1250 ms | 2600 ms |     45 s | unbounded scan backlog or hidden pending scan state                   |
| Projection lag             |        24 rps |  800 ms | 1800 ms |     35 s | generic detached error or lost promoted request truth                 |
| Notification delay         |        30 rps | 1000 ms | 2200 ms |     60 s | premature notification reassurance                                    |
| Dependency restart         |        28 rps | 1400 ms | 3000 ms |     75 s | writable mutation during bounded degraded truth                       |
| Route-freeze drift         |        20 rps |  700 ms | 1500 ms |     40 s | mutation allowed under route/freeze mismatch                          |
| Browser-visible resilience |         9 rps |  500 ms |  900 ms |     20 s | diagram-only truth or inaccessible recovery state                     |

## Backpressure Rules

| Pressure source                  | Accept                                                           | Degrade                                                          | Fail closed                                                              |
| -------------------------------- | ---------------------------------------------------------------- | ---------------------------------------------------------------- | ------------------------------------------------------------------------ |
| Autosave queue                   | Accept idempotent saves while lease and resume token are current | Show pending/recovery strip when settlement truth is not current | Block calm `Saved` when authoritative settlement is missing              |
| Submit transaction               | Accept one authoritative lineage per draft                       | Return replay receipt for exact replay                           | Block changed-semantics replay into collision review                     |
| Attachment scan                  | Accept bounded evidence refs                                     | Show awaiting scan and backlog age                               | Block submit when policy requires terminal scan truth                    |
| Projection worker                | Accept stale read model as non-authoritative                     | Show stale projection and recovery check                         | Never detach the user from the request shell when promotion truth exists |
| Notification provider            | Accept request receipt independently from delivery               | Show delivery pending/retrying                                   | Never say delivery happened until provider truth is terminal             |
| Queue/cache/storage dependency   | Accept read-only continuity where safe                           | Fence mutation and show bounded degraded ladder                  | Prevent side-effect dispatch until durable settlement is known           |
| Runtime publication/freeze drift | Accept read-only route proof                                     | Show freeze mismatch and recovery path                           | Block mutation until binding and freeze refs match                       |

## Browser Budgets

| Budget                  |  Target |
| ----------------------- | ------: |
| First visible lab       | 1000 ms |
| Profile switch update   |  120 ms |
| Fault inspector update  |  120 ms |
| Cumulative layout shift |    0.02 |
| Mobile width            |  390 px |
| Tablet width            |  820 px |
| Desktop width           | 1440 px |
| Masthead height         |   72 px |
| Left rail width         |  292 px |
| Right inspector width   |  404 px |
| Canvas max width        | 1600 px |
| Minimum tap target      |   44 px |

Reduced motion must not hide meaning. The throughput wave may stop animating, but the table rows for throughput, side effects, degradation, and budget state must remain visible.

## Release Gate

The suite can pass only when all three evidence classes agree:

| Evidence                  | Required proof                                                                                                                   |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Machine-readable fixtures | Profiles, faults, browser budgets, and result invariants parse and match expected counts                                         |
| Service runner            | Real submit/replay flows preserve exact-once side effects under distinct bursts and replay storms                                |
| Browser lab               | Playwright verifies degraded/recovery posture, sticky footer, focus, reduced motion, responsive layout, and diagram/table parity |
