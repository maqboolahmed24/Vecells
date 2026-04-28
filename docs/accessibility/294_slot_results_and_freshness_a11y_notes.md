# 294 Slot Results And Freshness Accessibility Notes

## Summary

The slot-results host keeps the shared patient shell semantics from `293` and adds a dense but keyboard-safe results region.

## Keyboard and disclosure

- Each `SlotSummaryRow` uses a real button with `aria-expanded` and `aria-controls`.
- Only one row expands at a time, which keeps sequential focus order short and predictable.
- The refine drawer opens from a button in the normal tab order and closes with `Escape`.

## Focus and continuity

- Day jump controls move the reading position to the active day group without inventing a new tab order.
- The active day anchor is restored from session storage on reload or stale-refresh recovery when the shell continuity key still matches.
- Sticky toolbars and drawers use `scroll-margin-top` and preserved DOM order so the focused region is not obscured by author-created chrome.

## Reflow and target size

- The results stage reflows to one column on narrow widths.
- Day jump chips become horizontally scrollable pills instead of forcing two-dimensional scrolling.
- Row disclosures collapse to one column below tablet widths.
- Primary interactive targets remain at least 44px tall.

## Help consistency

- `Need help booking?` remains in the same results-stage neighborhood for partial, no-supply, and fallback states.
- The support route never disappears during stale or degraded outcomes.

## Plain-language rules

- Buttons use short sentence-case action text.
- Empty and degraded states explain what happened and the next safe action.
- The UI avoids suggesting live availability when the snapshot is stale or partial.

## Automated proof

- Playwright captures screenshots for desktop, tablet, and reduced-motion mobile states.
- Playwright writes accessibility snapshots and aria snapshots for renderable, stale, and no-supply scenarios.
- The accessibility suite also checks landmark presence and reduced-motion markers.

## Standards and references

- WCAG 2.2 focus order informed the disclosure and drawer DOM order.
- WCAG reflow informed the mobile day-group layout and overflow checks.
- WCAG consistent help informed the persistent support stub.
- WAI-ARIA disclosure guidance informed the expandable row implementation.
- Playwright aria snapshot and accessibility guidance informed the test strategy.
