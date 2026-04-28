# Task 459 Compliance Ledger Accessibility Notes

The ledger keeps native table semantics for the control rows: caption, column headers, and row headers are present. Rows are also keyboard-selectable with Enter and Space so the selected control can drive the mini-map and drawer without pointer input.

The gap queue uses real buttons for filters and queue selection, plus a native select for sorting. The drawer is a persistent complementary panel instead of a modal, so focus is not trapped and reduced-motion users are not forced through animated state changes.

Visible focus styling is applied to ledger rows, framework chips, handoff buttons, and queue items. The blocked/stale graph card uses `aria-live="polite"` so graph verdict changes are announced without stealing focus.

Raw artifact URLs are not placed in visible text, attributes, or handoff labels. Screen-reader snapshots are generated during the Playwright suite for exact, stale, blocked, permission-denied, mobile mission-stack, and reduced-motion paths.
