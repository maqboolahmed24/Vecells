# Phase 1 Submission Burst And Resilience Suite

Sequence: `seq_168`

This suite closes the Phase 1 performance gap where submit burst testing only measures throughput and misses exact-once side effects, browser-visible degraded truth, and bounded backpressure rules. The evidence set is intentionally machine-readable so budgets are not left as prose:

- `data/performance/168_load_profiles.yaml` defines the load profiles and budgets.
- `data/performance/168_resilience_fault_matrix.csv` defines the injected fault families and expected browser posture.
- `data/performance/168_browser_budget_targets.json` defines browser, layout, and reduced-motion budgets.
- `data/performance/168_suite_results.json` defines the expected invariant model for validators and runners.
- `tools/performance/run_phase1_burst_resilience_suite.mjs` drives real Phase 1 submit and replay flows through `createIntakeSubmitApplication`.
- `tests/playwright/168_burst_resilience_lab.spec.js` proves the browser-visible lab across mobile, tablet, desktop, and reduced motion.

## Case Families

| Family                                 | Required pressure                                     | Backend truth                                                                                                     | Browser truth                                                                        |
| -------------------------------------- | ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| Autosave bursts                        | 24 clients, 12 save attempts each, peak 96 rps        | Save settlements are idempotent by client command and lease                                                       | Pending or recovery, never false `Saved` while backend truth is uncertain            |
| Submit bursts and replay storms        | 32 distinct submits plus 12 identical replay attempts | One authoritative request, promotion, triage task, communication envelope, and receipt bridge per submitted draft | Receipt or replay receipt only; no duplicate confirmation copy                       |
| Upload bursts and scan backlog         | 18 clients, 4 attachment operations each              | Evidence refs stay bounded and scan jobs do not duplicate                                                         | Awaiting scan state remains visible; submit is blocked only where policy requires it |
| Projection lag and read-model delay    | Promoted request before read model catches up         | Promoted request ref remains authoritative                                                                        | Stale read-model banner with recovery check, not a generic detached error            |
| Notification backlog/provider delay    | Provider latency and retry queue                      | Single communication envelope; delivery state stays pending/retrying                                              | Request received is separated from notification delivery reassurance                 |
| Bounded dependency failures/restarts   | Queue/cache restart during mutation pressure          | Settlement-before-dispatch preserves exact-once side effects                                                      | Read-only continuity remains available; mutating controls are fenced                 |
| Runtime publication/route-freeze drift | Route manifest and release freeze mismatch            | Route intent binding mismatch blocks mutation                                                                     | Freeze mismatch banner and disabled submit posture                                   |
| Browser-visible resilience             | Mobile, tablet, desktop, reduced-motion checks        | Diagram/table parity backs all visible metrics                                                                    | Sticky footer, visible focus, no horizontal overflow, reduced-motion equivalence     |

## Exact-Once Side-Effect Contract

The runner treats duplicate side effects as a hard failure, not a percentile result. The exact-once boundary is:

| Effect                      | Duplicate threshold | Authority                                         |
| --------------------------- | ------------------: | ------------------------------------------------- |
| Request shell               |                   0 | `IntakeSubmitSettlement` and promoted request ref |
| Submission promotion record |                   0 | durable promotion record per draft                |
| Safety decision             |                   0 | request ref scoped decision record                |
| Triage task                 |                   0 | request ref scoped triage task                    |
| Communication envelope      |                   0 | communication envelope idempotency key            |
| Receipt bridge              |                   0 | request ref to receipt bridge                     |

Replay storms must return the existing authoritative settlement and receipt truth. A replay may produce a replay response, but it must not produce a second request, promotion, triage task, notification, or receipt bridge.

## Browser Degradation Rules

Browser state must remain tied to backend truth:

| Condition                      | Invalid UI                         | Required UI                                                   |
| ------------------------------ | ---------------------------------- | ------------------------------------------------------------- |
| Autosave persistence uncertain | Calm writable `Saved`              | Pending or recovery copy with mutating state fenced as needed |
| Projection lag                 | Generic detached error             | Stale projection banner with promoted request truth           |
| Notification provider delayed  | `Notification sent`                | Request received, notification pending or retrying            |
| Queue/cache restart            | Writable submit or upload controls | Read-only continuity and blocked mutation controls            |
| Route-freeze drift             | Live route submit posture          | Freeze mismatch banner and fail-closed mutation               |

## Validation Gates

`tools/performance/validate_phase1_performance_suite.py` fails the suite when any of these gaps return:

- Duplicate authoritative side effects are allowed.
- The browser can appear calm and writable under degraded backend truth.
- Performance budgets exist only in prose.
- Visual meaning exists without parity tables.
- Unresolved defects exist without a rationale.
- Notification delay is presented as confirmed delivery.
- Projection lag falls back to a generic detached error.

The validator is wired into `pnpm validate:phase1-performance-suite`, `pnpm bootstrap`, and `pnpm check`.
