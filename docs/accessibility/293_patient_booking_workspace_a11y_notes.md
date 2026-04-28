# 293 Patient Booking Workspace Accessibility Notes

## Landmarks and structure

- The workspace exposes one `header`, one `main`, and complementary rails through `aside`, following WAI landmark-region guidance.
- The dominant action appears before the summary rail in DOM order so keyboard users can reach it without tabbing through the entire need summary first.
- Child hosts stay inside the same `main` landmark when moving between `/bookings/:bookingCaseId`, `/select`, and `/confirm`.

## Focus and restoration

- Refresh restores the stored selected anchor only when the continuity key still matches the active booking case.
- Browser-history navigation preserves the same shell continuity key while moving between child hosts.
- Read-only and recovery-required states focus the preserved provenance or capability panel instead of sending focus to a detached error page.

## Reduced motion

- Motion is limited to short emphasis transitions and disabled under `prefers-reduced-motion`.
- Meaning remains visible through outline, chip tone, and panel copy when motion is reduced.

## ARIA and keyboard proof

- Playwright coverage writes landmark snapshots plus scoped aria snapshots for normal, blocked, and recovery-required states.
- Keyboard proof exercises the dominant action, the child-host transition, and same-shell restoration.

## Official reference set used

- [WAI APG Landmark Regions](https://www.w3.org/WAI/ARIA/apg/practices/landmark-regions/)
- [WCAG 2.2 Focus Order](https://www.w3.org/WAI/WCAG22/Understanding/focus-order.html)
- [WCAG 2.2 Animation From Interactions](https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html)
- [Playwright aria snapshots](https://playwright.dev/docs/aria-snapshots)
- [Playwright accessibility testing](https://playwright.dev/docs/accessibility-testing)
