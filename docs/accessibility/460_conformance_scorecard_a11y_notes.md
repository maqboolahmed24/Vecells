# Task 460 Conformance Scorecard Accessibility Notes

The `/ops/conformance` route uses table-first semantics for the proof ledger and matrix. Each table has a caption, row headers use `scope="row"`, and column headers use `scope="col"`.

Keyboard coverage:

- Phase rows are focusable and selectable with Enter or Space.
- Filter controls are native selects with visible labels.
- The source trace drawer toggle exposes `aria-expanded`.
- The BAU signoff action uses `disabled`, `aria-disabled`, and `aria-describedby` for the exact blocked reason.

Screen reader coverage:

- Main regions use stable `aria-label` values.
- The BAU blocker queue and source trace drawer expose live selected-row and action-state data attributes for Playwright verification.
- Permission-denied state remains metadata-only while preserving the route shell and disabled reason text.

Reduced motion:

- The scorecard route inherits the ops shell `data-reduced-motion="respect"` contract.
- No motion is required for conformance comprehension; hover/focus styling is nonessential.

Reference alignment:

- The route follows table and warning/error-summary patterns from GOV.UK Design System guidance.
- The route follows NHS service content accessibility guidance for plain, task-focused content.
- Playwright coverage records ARIA snapshots and visual screenshots for exact, stale, blocked, deferred, no-blocker, and permission-denied states.
