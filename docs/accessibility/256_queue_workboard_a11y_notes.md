# 256 Queue Workboard Accessibility Notes

## Keyboard

- the queue list is one focusable `role="listbox"` region
- each row is one `role="option"` with explicit `aria-selected`
- the workboard supports hover-free scanning:
  - `ArrowUp` / `ArrowDown` move the selected row
  - `Space` pins preview
  - `Enter` opens the selected task

## Labels and names

- the queue search input uses `aria-label="Search the current queue"`
- explicit open controls use patient-specific labels
- anchor stubs expose one visible action that matches the next lane or recovery step

## Focus

- queue links, filter chips, row buttons, search, preview actions, and open buttons all use visible custom focus treatment
- the selected row is scrolled into view from the authoritative anchor when the route restores

## Hover parity

Hover is only a convenience.
Preview is also reachable through focus, selection, and keyboard pinning.

## Reduced motion

- reduced motion keeps the same information order
- no interaction depends on motion for meaning
- the pinned/peek distinction is still exposed through text and control state

## Responsive behavior

- mobile and narrow layouts stack the nav, workboard, task plane, and dock without horizontal overflow
- the queue still uses one product grammar rather than a separate mobile queue implementation

## Content discipline

- rows stay summary-only
- tertiary detail moves to preview
- no color-only state cue is relied on without text or chip support
