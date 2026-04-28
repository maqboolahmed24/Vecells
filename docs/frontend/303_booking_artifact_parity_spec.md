# 303 Booking Artifact Parity Spec

## Intent

`Booking_Artifact_Frame` keeps appointment artifacts summary-first. The patient reads the same in-shell appointment summary, attendance guidance, reminder posture, and parity evidence before any print, calendar, directions, or browser handoff posture becomes relevant.

## Route contract

- Route: `/bookings/:bookingCaseId/artifacts`
- Search parameters:
  - `artifactSource=confirm|manage`
  - `artifactMode=receipt|calendar|print|directions|browser_handoff`
- Stable markers:
  - `data-artifact-mode`
  - `data-parity-posture`
  - `data-grant-state`
  - `data-print-posture`
  - `data-handoff-readiness`
  - `data-artifact-source`
  - `data-artifact-exposure`

## Surface regions

1. `PatientBookingArtifactFrame`
2. `AppointmentReceiptSummary`
3. `AttendanceInstructionPanel`
4. `BookingArtifactActionTray`
5. `CalendarExportSummarySheet`
6. `PrintableAppointmentView`
7. `DirectionsHandoffPanel`
8. `BookingArtifactParityView`

## Gating rules

- `BookingConfirmationTruthProjection` remains the authority for whether artifact exposure is `hidden`, `summary_only`, or `handoff_ready`.
- `AppointmentPresentationArtifact` is represented here as one route-level summary frame, not as a detached file launcher.
- `ArtifactPresentationContract` governs whether calendar, print, or handoff panels are `ready`, `summary_only`, or `blocked`.
- `OutboundNavigationGrant` is represented as evidence rows and grant posture; the route does not fake a richer external launch than the current channel can lawfully support.
- Embedded or constrained delivery narrows `granted` print and handoff posture back to `summary_only`.

## Responsive behavior

- Desktop centers a document-like artifact frame with parity evidence in a compact rail.
- Tablet keeps the summary and attendance sections first, then places the mode sheet directly below the action tray.
- Compact mobile uses the shared mission-stack drawers and a return-safe sticky tray.
- Print media hides surrounding shell chrome and preserves the same summary meaning.

## Content and accessibility posture

- Receipt, attendance, and reminder content use summary-list semantics and plain transactional language.
- Status changes remain in polite live regions without stealing focus.
- Secondary artifact modes never replace the summary; they layer beneath it.
- Return-safe controls always remain visible in the same route family.
