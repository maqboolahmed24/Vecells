# 300 Record Origin Booking Entry Spec

`par_300_phase4_track_Playwright_or_other_appropriate_tooling_frontend_build_record_origin_continuation_and_booking_entry_surfaces`

## Outcome

The patient shell now exposes one continuity-safe booking entry family:

- `/bookings/entry/:entryFixtureId`

This route family sits between origin surfaces and the existing booking workspace. It preserves `PatientNavReturnContract`, any active `PatientRequestReturnBundle`, any active `RecordOriginContinuationEnvelope`, and the current `RecoveryContinuationToken` before the booking workspace becomes writable.

## Visual Mode

`Record_Origin_Booking_Entry`

The surface is a premium transactional entry layer:

- a provenance-first ribbon above the fold
- a dense but calm summary card showing what will be preserved
- one dominant next-safe action
- a same-shell safe return stub that never drops to a generic landing

## Required UI Primitives

- `RecordOriginBookingEntrySurface`
- `BookingEntryContextRibbon`
- `RecordFollowUpBookingCard`
- `BookingEntryReturnBinder`
- `BookingSourceBadge`
- `BookingLaunchSummaryCard`
- `BookingEntryNextActionPanel`
- `BookingQuietReturnStub`
- `PatientBookingEntryProjectionAdapter`

## Shell Law

- Booking entry is not a detached start page.
- The first settled frame explains where the patient came from, what triggered booking, whether the route is safe to use, and the next safe action.
- `PatientNavReturnContract` remains authoritative for calm return.
- `PatientRequestReturnBundle` remains visible where request detail launched booking.
- `RecordOriginContinuationEnvelope` and `RecoveryContinuationToken` remain visible where a result, letter, or document launched booking.
- record-origin entry may orient and explain while continuity is stale, but it may not render live booking controls.
- same-shell continuity wins over browser-history guesswork.

## Primary Scenarios

1. `booking_entry_300_home_ready`
   Home launches booking with the current home panel anchor and return contract preserved.
2. `booking_entry_300_requests_ready`
   Request detail launches booking with the request return bundle and selected anchor preserved.
3. `booking_entry_300_appointments_ready`
   Appointment detail launches rebooking into slot selection with itinerary context intact.
4. `booking_entry_300_appointments_read_only`
   Appointment-origin entry stays readable but suppresses stale writable posture.
5. `booking_entry_300_record_origin_ready`
   Record-origin follow-up launches booking with the source result, selected anchor, and record continuation preserved.
6. `booking_entry_300_record_origin_recovery`
   Record-origin continuity drift keeps the source record visible and downgrades to bounded recovery in place.

## DOM Markers

- `data-shell="patient-booking-entry"`
- `data-origin-type`
- `data-origin-object`
- `data-record-continuation-state`
- `data-return-posture`
- `data-entry-writable`

## Entry Rules

- booking entry never becomes writable until the adapter can align the governing return tuple and the selected origin anchor
- record-origin entry must keep the source title, source state, and selected anchor readable even when continuity drifts
- safe return resolves from the current return contract, not from generic `/home` or `/requests`
- refresh and browser-history restore reopen the same booking-entry summary, not a fresh booking start state

## Keyboard Order

The keyboard sequence follows the provenance-first layout:

1. `BookingEntryContextRibbon`
2. `BookingSourceBadge`
3. `RecordFollowUpBookingCard` when present
4. `BookingLaunchSummaryCard`
5. `BookingEntryNextActionPanel`
6. `BookingQuietReturnStub`

Focus lands on the context ribbon after route change, then proceeds in reading order across the same-shell layout.

## Proof

Playwright is the primary proof tool for this surface.

The 300 suite covers:

- launch from `Home`
- launch from `Requests`
- launch from `Appointments`
- record-origin follow-up launch
- stale record continuity forcing bounded recovery
- refresh and history restore with preserved provenance
- keyboard traversal and aria snapshots
