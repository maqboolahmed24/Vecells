# 391 Embedded Booking Spec

Visual mode: `NHSApp_Embedded_Booking`

This route family adapts the existing Phase 4 and Phase 5 booking surfaces for NHS App embedded use. It does not create a second booking product. It composes existing offer selection, slot results, confirmation truth, waitlist, manage, and network alternative projections into one narrow, summary-first route family.

## Routes

- `/nhs-app/bookings/:bookingCaseId/offers`
- `/nhs-app/bookings/:bookingCaseId/alternatives`
- `/nhs-app/bookings/:bookingCaseId/waitlist`
- `/nhs-app/bookings/:bookingCaseId/manage`
- `/nhs-app/bookings/:bookingCaseId/confirmation`
- `/nhs-app/bookings/:bookingCaseId/calendar`
- `/nhs-app/bookings/:bookingCaseId/recovery`

## Canonical Bindings

- Offers: `OfferSelectionProjection` plus `BookingSlotResultsProjection`
- Reservation truth: `OfferSelectionReservationTruthProjection`
- Alternative offers: `PatientNetworkAlternativeChoiceProjection`
- Waitlist: `PatientWaitlistViewProjection`
- Confirmation: `BookingConfirmationProjection`
- Manage and reminders: `PatientAppointmentManageProjection`
- Calendar: `EmbeddedBookingCalendarBridgeWrapper` with `nhsapp.storage.addEventToCalendar`

## Interaction Rules

Hold, expiry, and urgency copy is shown only when reservation truth authorizes it. A truthful nonexclusive selected slot can be reviewed, but it never shows hold countdown language. A stale or drifted selected offer remains visible as provenance and moves the route into recovery.

Calendar handoff is not called from leaf cards. It is represented by `EmbeddedCalendarActionCard`, checked through `EmbeddedBookingCalendarBridgeWrapper`, and becomes available only after confirmation truth is `confirmed`.

Manage, reminder, and calendar surfaces keep the selected appointment anchor visible and stay in the same shell. Read-only states preserve context instead of redirecting to a detached failure page.

