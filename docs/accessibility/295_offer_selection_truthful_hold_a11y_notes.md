# 295 Accessibility notes

## Keyboard model

- Slot rows use disclosure buttons with `aria-expanded` and `aria-controls`.
- Row actions remain ordinary buttons, not links.
- Compare mode opens an explicit dialog surface and returns focus to the compare trigger when closed.
- The selected-slot pin remains in DOM order ahead of the sticky confirm tray on narrow screens so the summary is read before the action.

## Read-only versus disabled

- Preserved unavailable selections stay readable and keyboard reachable as provenance.
- Only action buttons are disabled when truth or freshness blocks progress.
- Read-only state is never used to hide support or refresh actions that remain meaningful.

## WCAG 2.2 checks

- Focus treatment is intentionally high contrast and visible on the pin, compare drawer, and sticky tray.
- Interactive targets stay above touch-friendly minimums on day anchors, compare buttons, and confirm actions.
- Sticky surfaces add bottom padding so content is not obscured on mobile or high zoom.

## Screen-reader expectations

- `data-selected-slot`, `data-reservation-truth`, and `data-countdown-mode` mirror visible posture for deterministic tests.
- The live region announces selection, compare, refine, and refresh changes.
- Help remains in a consistent location through stale, unavailable, no-supply, and fallback states.
