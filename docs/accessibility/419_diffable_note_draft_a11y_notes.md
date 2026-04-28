# 419 Diffable Note Draft Accessibility Notes

Visual mode: `Assistive_Draft_Diff_Deck`

## Semantics

The draft deck is a labelled section inside the 418 complementary rail. The section list uses `role="list"` and each draft card uses `role="listitem"` with a heading-backed accessible name. Compare controls are visible buttons in a named group with `aria-pressed`; the insert bar uses a plain button label and `aria-describedby` pointing to the visible blocked reason when insert is disabled.

## Keyboard

Tab reaches the rail collapse control, then the active draft card, compare buttons, secondary actions, and insert control in DOM order. ArrowUp and ArrowDown move between draft section cards. Home and End move to the first and last cards. Escape continues to collapse the host rail via the 418 keyboard controller.

## Blocked State

Blocked reasons are not color-only. Each blocked section includes a visible `Insert blocked before click` note with reason labels and details for stale slot, stale session, selected-anchor drift, decision epoch drift, publication drift, and trust posture drift. Disabled insert buttons keep the exact target slot visible.

## Motion

The implementation uses 120ms section state transitions, 140ms compare transitions, and 100ms insert-bar state transitions. `prefers-reduced-motion: reduce` removes those transitions while preserving static focus rings, copy, and blocked-state styling.

## Test Coverage

Playwright tests assert:

- deck and representative card ARIA snapshots
- headings and button names
- blocked reason visibility before click
- focus order and card keyboard navigation
- desktop enabled, desktop blocked, and narrow stacked visual screenshots
