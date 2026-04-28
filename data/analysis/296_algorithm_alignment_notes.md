# 296 Algorithm alignment notes

## State mapping

- `BookingConfirmReviewStage`
  - pre-commit review posture before authoritative booking truth exists
  - `patientVisibilityState=selected_slot_pending`
  - `manageExposureState=hidden`
  - `artifactExposureState=hidden`
- `BookingInProgressState`
  - `confirmationTruthState=booking_in_progress`
  - `patientVisibilityState=provisional_receipt`
  - `artifactExposureState=summary_only`
  - duplicate tap risk closed by same-attempt resume
- `ConfirmationPendingState`
  - `confirmationTruthState=confirmation_pending`
  - provisional receipt only
  - provider reference may appear without booked reassurance
- `ReconciliationRecoveryState`
  - `confirmationTruthState=reconciliation_required` or a frozen confirmed route
  - `patientVisibilityState=recovery_required`
  - route freeze and identity repair keep the selected slot visible while suppressing live controls
- `BookedSummaryChildState`
  - `confirmationTruthState=confirmed`
  - `patientVisibilityState=booked_summary`
  - `manageExposureState=writable`
  - `artifactExposureState=handoff_ready`
  - `reminderExposureState=scheduled`

## Truth chain rules honored

- `ReservationTruthProjection` still governs the selected-slot banner inside `SelectedSlotProvenanceCard`.
- `BookingConfirmationTruthProjection` alone governs booked summary, manage, reminder, export, print, directions, and browser handoff posture.
- Route drift, publication drift, and identity repair degrade in place instead of routing to generic failure.

## Gaps closed

- The indefinite-spinner gap is closed with explicit in-progress and pending child states.
- The premature-booked-summary gap is closed by hiding all booked reassurance before `confirmed`.
- The detached-success-page gap is closed by morphing the child surface inside the same booking shell.
- The wrong-patient loophole is closed by the identity-repair freeze scenario.
- The stale-route confirm gap is closed by same-shell route-freeze recovery.
