# 356 Pharmacy Shell Accessibility Notes

## Landmarks

- workspace shell exposes one `banner`, one `main`, and one queue-spine `aside`
- patient shell exposes one `banner`, one `main`, and one anchor rail `aside`
- route nav stays a plain button-led `nav` rather than a fake tablist because the routes are normal shell children, not a composite widget

## Focus And Keyboard

- all route toggles remain keyboard reachable in document order
- `DecisionDock` stays visible and focusable in both wide and `mission_stack` layouts
- no child-route transition hides the focused dominant action under sticky chrome
- the recovery frame appears ahead of the main content when the shell is non-calm

## Reflow

- both shells collapse to one column below `960px`
- the validator and responsive Playwright proof use a `320px` reflow proxy and fail on horizontal overflow
- queue, checkpoint, support, and anchor regions stack rather than requiring two-dimensional scrolling

## Touch Targets

- route buttons and dominant actions keep a `44px` minimum touch target
- checkpoint rows remain at least `44px` tall

## Reduced Motion

- transitions collapse to near-zero duration under `prefers-reduced-motion: reduce`
- shell continuity proof never depends on motion

## Recovery Posture

- `read_only`, `recovery_only`, and `blocked` states are visible in text and state markers, not only color
- recovery framing appears as a dedicated strip, not a toast

## Playwright Proof Focus

- continuity assertions read user-visible route and anchor markers
- accessibility proof captures semantic structure rather than relying only on screenshots
