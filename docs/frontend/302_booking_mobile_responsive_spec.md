# 302 Booking Mobile Responsive Spec

Visual mode: `Mobile_Transactional_Booking`

## Goal

Finish the patient booking route family as one responsive product from `compact` through `wide`, including NHS App embedded-web hosting, without creating a second mobile journey.

## Route family

- `/bookings/:bookingCaseId`
- `/bookings/:bookingCaseId/select`
- `/bookings/:bookingCaseId/confirm`
- `/bookings/:bookingCaseId/manage`
- `/bookings/:bookingCaseId/waitlist`

## Authoritative primitives

- `BookingMissionStackFrame`
- `BookingResponsiveStage`
- `BookingStickyActionTray`
- `ResponsivePreferenceDrawer`
- `ManageCompactSummarySheet`
- `ResponsiveWaitlistCard`
- `EmbeddedBookingChromeAdapter`
- `BookingResponsiveCoverageProfile`

## Responsive law

- `mission_stack` is the only compact and narrow fold.
- Folded state preserves route meaning, selected anchor, and dominant action.
- Summary and support rails become sheets or drawers instead of disappearing.
- Sticky action chrome only appears when there is one dominant action worth pinning.
- Embedded mode suppresses host chrome, not capability truth.
- Browser-only artifact actions stay summary-first in constrained or embedded contexts.

## Breakpoint coverage

- `compact`: single-column mission stack, one sticky tray, stacked metadata.
- `narrow`: same mission stack with wider cards and drawer toggles.
- `medium`: stacked layout without mission stack, drawers still lawful for secondary rails.
- `expanded`: rail + stage, reduced chrome noise.
- `wide`: full three-region booking shell where applicable.

## Required DOM markers

- `data-breakpoint-class`
- `data-mission-stack-state`
- `data-safe-area-class`
- `data-sticky-action-posture`
- `data-embedded-mode`
- `data-responsive-task-id`
- `data-responsive-visual-mode`

## Route-level posture

- Workspace keeps pulse header and return continuity stable while summary rails fold into drawers.
- Offer selection keeps `SelectedSlotPin` pinned and compare/refine in sheets.
- Confirmation keeps selected slot provenance visible and suppresses embedded artifact actions.
- Manage keeps booked summary pinned and exposes deeper summary through `ManageCompactSummarySheet`.
- Waitlist keeps the active offer or provenance card pinned and uses `ResponsiveWaitlistCard` plus the shared sticky tray.

## Playwright proof

- Compact and wide route markers are asserted from the live shell.
- Mobile overflow, mission-stack drawers, and sticky trays are exercised on real pages.
- Reduced-motion and axe coverage prove status-message and focus-safe behavior.
- Embedded NHS App host mode is verified with `host=nhs_app&safeArea=bottom`.
