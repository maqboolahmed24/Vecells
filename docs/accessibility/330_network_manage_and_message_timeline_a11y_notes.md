# 330 Accessibility Notes

## Core decisions

- The unified timeline uses semantic list structure so chronology is navigable without visual inference.
- Each timeline row is a real button with `aria-expanded` so disclosure state is explicit.
- The route keeps a polite status region for same-shell settlement, refresh, and repair announcements.
- Folded mobile uses the existing mission-stack drawer pattern rather than inventing a new custom overlay.
- Sticky action posture is tested against horizontal overflow and focus visibility to avoid obscuring focused controls.

## Focus and disclosure

- Selected timeline context remains visible in the summary strip so users can understand which reminder, fallback, or settlement row is active.
- Repair and settlement actions remain inside the route and do not open detached flows by default.
- The rail drawer remains accessible on folded layouts through the existing dialog semantics from `ResponsivePreferenceDrawer`.

## Color and semantics

- Reminder, callback, warning, and blocked states always keep textual labels; color is secondary.
- Read-only posture explains why actions are demoted instead of silently removing controls.
- Callback fallback remains labelled as callback fallback so it is not confused with reminder success or failure.

## Verification focus

- mobile reflow without horizontal clipping
- `aria-expanded` on timeline row disclosure buttons
- visible focus above sticky tray reserve
- polite status updates for route transitions
