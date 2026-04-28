# 479 Dress Rehearsal Incident And Rollback Notes

Generated: 2026-04-28T00:00:00.000Z

## Operating rule

The rehearsal is a no-mutation production-like exercise. A route can pass only when browser evidence, source bindings, and the no-sensitive-data guard all pass. No UI or report may claim completion before authoritative settlement.

## Drill sequence

1. Seed the deterministic fixture manifest with `pnpm exec tsx ./tools/testing/run_479_dress_rehearsal.ts --seed`.
2. Run the four 479 Playwright specs in isolated contexts.
3. Generate the report and trace manifest with `pnpm exec tsx ./tools/testing/run_479_dress_rehearsal.ts --report`.
4. Validate with `pnpm run validate:479-dress-rehearsal`.

## Incident and rollback posture

- Patient red-flag route: keep the urgent diversion receipt and do not reopen routine submission.
- Booking route: keep selected-slot provenance visible, return to selection or support, and do not show a booked state without confirmation truth.
- Staff queue: preserve selected item focus, show buffered queue changes, and avoid auto-advance while a decision is in flight.
- Pharmacy outage: invoke manual review and verified communication fallback; do not present provider acceptance.
- Assistive downgrade: suppress insert controls, retain provenance-only review, and keep observe-only posture.
- NHS App: keep channel deferred and route-frozen until task 486 approves manifest versions.
- Network reconnect: reuse the idempotency key and confirm duplicate settlement count remains zero.
