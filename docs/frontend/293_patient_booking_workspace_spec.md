# 293 Patient Booking Workspace Spec

## Purpose

`PatientBookingWorkspaceShell` is the signed-in patient host for the whole Phase 4 booking journey. It is intentionally not a detached start page, not a marketing landing page, and not a wizard. The shell keeps the patient oriented while capability, continuity, publication, and confirmation truth change underneath later child surfaces.

## Route family

- `/bookings/:bookingCaseId`
- `/bookings/:bookingCaseId/select`
- `/bookings/:bookingCaseId/confirm`

All three routes reuse one shell. Results, truthful selection, confirmation, manage, and waitlist detail mount into the shared `BookingContentStage` instead of creating new page families.

## Regions

1. `BookingCasePulseHeader`
2. `NeedWindowRibbon`
3. `BookingCapabilityPosturePanel`
4. `BookingContentStage`
5. `BookingNeedSummary`
6. `BookingPreferenceSummaryCard`
7. `BookingQuietReturnStub`

The primary action sits in the capability panel before the summary rail in DOM order, even though the summary rail may appear visually to the left on desktop.

## Posture law

The shell does not guess its CTA from route labels or cached appointment labels.

- `self_service_live` promotes `search_slots`
- `assisted_only` promotes `request_staff_assist`
- `linkage_required` promotes `repair_gp_linkage`
- `local_component_required` promotes `launch_local_component`
- `degraded_manual` promotes `fallback_contact_practice_support`
- `recovery_required` promotes `refresh_booking_continuity`
- `blocked` promotes `fallback_continue_read_only`

## Return and continuity

- `BookingReturnContractBinder` persists the current `PatientNavReturnContract`, selected anchor, and continuity key in session storage.
- Refresh restores the same child host only when the stored continuity key still matches the active booking case.
- Browser-history travel preserves the same shell continuity key while moving between `/bookings/:bookingCaseId`, `/select`, and `/confirm`.
- When publication or continuity drifts, the last safe selected slot or booking summary remains visible only as provenance.

## Visual direction

`Appointment_Scheduling_Workspace` aims for calm confidence and one dominant next action.

- Canvas `#F4F7FB`
- Panels `#FFFFFF` and `#F8FAFC`
- Primary action `#2457FF`
- Help accent `#6D28D9`
- Safe accent `#0F766E`
- Warn accent `#B7791F`
- Blocked accent `#B42318`

Layout targets:

- desktop: `288px` summary rail, `minmax(760px, 1fr)` content stage, optional `280px` return rail
- tablet: content first, summary band second, return rail last
- mobile: single-column flow with sticky action tray

## Content rules

- `BookingNeedSummary` stays between four and six concise rows in the default posture.
- `BookingPreferenceSummaryCard` exposes only the key preference facts by default, with deeper detail behind one disclosure.
- The shell keeps `Need help booking?` visible even when self-service is live; it becomes visually stronger when the current posture is assisted-only, degraded, blocked, or uncertain.

## Accessibility and testing

- One `header`, one `main`, and complementary rails follow WAI landmark guidance.
- Reduced motion removes non-essential movement while preserving meaning through chip tone, border emphasis, and focus placement.
- Playwright is the primary proof harness across route-family, visual, accessibility, and navigation specs.
- Aria snapshots cover live, blocked, and recovery-required shell states.

## Official reference set used

- [Linear redesign notes](https://linear.app/blog/how-we-redesigned-the-linear-ui)
- [Linear calmer interface refresh](https://linear.app/now/behind-the-latest-design-refresh)
- [Vercel nested layouts](https://vercel.com/academy/nextjs-foundations/nested-layouts)
- [NHS action link](https://service-manual.nhs.uk/design-system/components/action-link)
- [NHS summary list](https://service-manual.nhs.uk/design-system/components/summary-list)
- [NHS start page](https://service-manual.nhs.uk/design-system/patterns/start-page)
- [WAI landmark regions](https://www.w3.org/WAI/ARIA/apg/practices/landmark-regions/)
- [WCAG 2.2 focus order](https://www.w3.org/WAI/WCAG22/Understanding/focus-order.html)
- [Playwright aria snapshots](https://playwright.dev/docs/aria-snapshots)
- [Playwright accessibility testing](https://playwright.dev/docs/accessibility-testing)
