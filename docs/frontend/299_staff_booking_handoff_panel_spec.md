# 299 Staff Booking Handoff Panel Spec

`par_299_phase4_track_Playwright_or_other_appropriate_tooling_frontend_build_staff_booking_handoff_panel_and_assisted_booking_views`

## Outcome

The clinical workspace now exposes one same-shell assisted-booking route family:

- `/workspace/bookings`
- `/workspace/bookings/:bookingCaseId`

This surface keeps booking exception queue state, booking-case context, assistable-slot comparison, stale-owner recovery, and task-settlement posture inside the existing staff shell. It does not create a detached admin desk or a second booking model.

## Visual Mode

`Assisted_Booking_Control_Panel`

The surface is intentionally dense but calm:

- a narrow exception rail for machine-readable queue facts
- a wide case-and-compare plane for staff booking work
- a bounded recovery and settlement stage that stays visible

## Required UI Primitives

- `StaffBookingHandoffPanel`
- `BookingExceptionQueuePanel`
- `AssistedBookingCaseSummary`
- `StaffAssistableSlotList`
- `AssistedSlotCompareStage`
- `AssistedBookingRecoveryPanel`
- `TaskSettlementAndReacquireStrip`

## Shell Law

- Booking work stays under the existing staff workspace route family.
- Slot browsing and compare use the same reservation and confirmation truth language as the patient shell.
- Staff-assistable-only supply is tagged explicitly and never implied to be patient-self-service supply.
- Focus-protected compare work keeps the selected slot and compare anchor visible while buffered queue churn waits behind explicit review.
- Pending confirmation stays visibly non-booked until confirmation truth is `confirmed`.
- Stale-owner or publication drift stays in the same shell with explicit reacquire posture.
- Task completion and next-task launch remain governed by settlement posture instead of local optimism.

## Primary Scenarios

1. `booking_case_299_linkage_required`
   Linkage and local-component blockers remain explicit while staff continue lawfully on the same supplier tuple.
2. `booking_case_299_compare_live`
   A held assistable slot and one compare anchor stay pinned while queue updates buffer.
3. `booking_case_299_pending_confirmation`
   Accepted-for-processing posture remains pending and non-booked.
4. `booking_case_299_stale_recovery`
   Ownership or publication drift freezes mutation and requires explicit reacquire.
5. `booking_case_299_confirmed`
   Confirmation is authoritative, but reminder delivery repair remains open.

## DOM Markers

- `data-shell="staff-booking"`
- `data-booking-case`
- `data-exception-class`
- `data-review-lease-state`
- `data-focus-protected`
- `data-confirmation-truth`
- `data-task-settlement`

## Keyboard Order

Within the peer route region, the intended order is:

1. booking exception queue
2. assisted booking case summary
3. assistable slot controls
4. compare stage
5. recovery actions
6. settlement and next-task posture

Disclosure buttons in the slot list expose inline detail with `aria-expanded`. Status changes are announced through `role="status"` regions instead of moving focus.

