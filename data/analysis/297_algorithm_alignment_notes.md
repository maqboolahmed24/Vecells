# 297 algorithm alignment notes

## Authoritative constraints

- Every post-submit manage action still traverses `ScopedMutationGate` before any supplier-facing mutation or appointment-write consequence is implied in the UI.
- `appointment_cancel`
  - Requires `BookingConfirmationTruthProjection.confirmationTruthState=confirmed`
  - Requires `manageExposureState=writable`
  - Requires current `BookingContinuityEvidenceProjection.validationState=trusted`
  - Result must stay same-shell as `supplier_pending` until authoritative cancellation settles
- `appointment_reschedule`
  - Requires the same manage truth and continuity gates as cancel
  - Must freeze ordinary cancel while replacement selection is open
  - Must reuse the current booking selection surface
  - Must keep the original appointment summary visible until replacement confirmation is authoritative
- `appointment_detail_update`
  - Requires current manage truth and continuity gates
  - Must remain limited to capability-safe administrative detail
  - Must not accept clinically meaningful change text as a direct appointment mutation
- `reminder_change`
  - Requires current manage truth plus lawful reminder exposure
  - Must degrade to repair-in-place when the current contact route is stale, blocked, disputed, or unverified
  - Must not claim scheduled reminder success while `reminderExposureState=pending_schedule`

## Summary-first law

- The appointment summary remains the anchor for every child state.
- Reminder, directions, and print actions are summary-first and exposure-gated.
- Pending, stale, and blocked states stay readable without losing the booked context.

## Recovery mapping

- `confirmation_pending`
  - Summary visible
  - Ordinary manage actions summary-only
  - Reminder exposure blocked
- `stale continuity`
  - Summary visible
  - Ordinary manage actions frozen
  - Recovery action is route refresh or support
- `contact-route repair`
  - Summary visible
  - Reminder actions blocked in place
  - Other safe manage actions may stay live when continuity is still current

## UI consequences

- The cancel action uses a short destructive dialog rather than a separate route.
- `RescheduleEntryStage` mounts `OfferSelectionStage`.
- Pending and recovery panels state what is happening now, what remains blocked, and the next safe action.
