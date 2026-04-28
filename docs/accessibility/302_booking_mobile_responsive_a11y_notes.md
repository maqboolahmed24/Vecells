# 302 Booking Mobile Responsive Accessibility Notes

## Standards applied

- WCAG 2.2 Reflow
- WCAG 2.2 Focus Visible
- WCAG 2.2 Focus Not Obscured (Minimum)
- WCAG 2.5.8 Target Size (Minimum)
- WCAG 4.1.3 Status Messages
- WAI-ARIA APG modal dialog guidance for drawers and sheets

## Decisions

- Compact and narrow widths use one `mission_stack` fold only.
- Sticky trays reserve bottom space and focus-driven scroll adjustment prevents obscured controls.
- Live route announcements use `role="status"` and `aria-atomic="true"`.
- Drawers move focus to a heading on open and close with `Escape`.
- Embedded mode suppresses browser-only artifact actions without hiding summary truth.

## Test posture

- Compact mobile viewport with touch emulation.
- Wide desktop viewport.
- Reduced-motion emulation.
- Embedded NHS App host query with safe-area bottom inset.
- Axe plus structural assertions plus overflow checks.
