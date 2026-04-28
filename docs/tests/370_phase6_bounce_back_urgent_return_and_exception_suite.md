# 370 Phase 6 Bounce-Back, Urgent Return, And Exception Suite

Task: `seq_370_phase6_Playwright_or_other_appropriate_tooling_testing_run_bounce_back_urgent_return_practice_visibility_and_exception_suites`

This proof pack is the second release-grade Phase 6 battery. It exercises the repository's existing bounce-back, urgent-return, practice-visibility, provider-health, and exception projections instead of replacing them with simplified fixtures.

## Grounding

- Local truth remains `blueprint/phase-6-the-pharmacy-loop.md`, especially `6G`, `6H`, and `6I`.
- Phase 0 governs no-silence completion, recovery posture, and `LifecycleCoordinator` closure authority.
- Upstream validated task outputs consumed here: `353`, `354`, `360`, `362`, `363`, `367`, `368`, and `369`.
- External references are support-only and recorded in `data/analysis/370_external_reference_notes.md`.

## Scenario Families

| Family                             | Proof Surface                                                                                                       | Representative Cases                                                                                                                        |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Bounce-back and reopen             | `tests/integration/370_phase6_exception_suite.spec.ts`, `tests/playwright/370_staff_bounce_back_and_reopen.spec.ts` | routine reopen, urgent duty-task reopen, diff-first anchors, repeated-loop escalation, supervisor gate                                      |
| Urgent-return channels             | backend sandbox readiness checks, patient and staff browser roots                                                   | direct professional route, monitored safety-net route, Update Record forbidden for urgent actions, reachability repair                      |
| Practice visibility and exceptions | operations query service and pharmacy console workbench                                                             | active, waiting choice, waiting outcome, bounce-back, discovery unavailable, zero provider, dispatch failed, stale proof, no outcome window |
| Provider health and outage         | operations provider-health projections and `PHC-2244` workbench                                                     | provider-health deltas, dispatch impact, outage-held handoff, patient-safe/staff-safe fallback                                              |

## Proof Commands

Run these commands from `/Users/test/Code/V`:

```bash
pnpm exec vitest run tests/integration/370_phase6_exception_suite.spec.ts
pnpm exec tsx tests/playwright/370_patient_review_and_return_states.spec.ts --run
pnpm exec tsx tests/playwright/370_staff_bounce_back_and_reopen.spec.ts --run
pnpm exec tsx tests/playwright/370_practice_visibility_and_exception_workbench.spec.ts --run
pnpm validate:370-phase6-exception-suite
```

## Release Interpretation

This suite may only pass when failure states stay explicit. Urgent return is not generic review copy, unmatched or missing outcomes do not become completion, and exception queues remain browser-visible or backend-queryable. Live mailbox approval, live GP Connect assurance, and live supplier onboarding are bounded external controls and are not claimed by this local proof.
