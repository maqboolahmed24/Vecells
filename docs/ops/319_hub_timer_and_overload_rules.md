# 319 Hub Timer And Overload Rules

## Timers

The queue engine publishes one auditable timer row per active timer:

- `candidate_refresh`: keyed to the active `NetworkCandidateSnapshot.expiresAt`
- `patient_choice_expiry`: keyed to the later-owned `AlternativeOfferSession.expiresAt` seam
- `required_window_breach`: keyed to `NetworkBookingRequest.clinicalTimeframe.dueAt`
- `too_urgent_for_network`: keyed to `latestSafeOfferAt` when present, otherwise the clinical due time
- `practice_notification_overdue`: keyed to `HubCoordinationCase.practiceAckDueAt`

Timer states:

- `armed`
- `overdue`
- `settled`
- `suppressed`
- `blocked_by_upstream_gap`

`blocked_by_upstream_gap` is intentional. It is the fail-closed posture when 320-owned expiry truth is not yet bound into the queue.

## Overload

Critical load is estimated as:

- total expected critical service minutes divided by available hub service minutes in the configured observation window

If the critical ratio meets or exceeds the overload guard threshold:

- `HubQueueRankSnapshot.overloadState = overload_critical`
- fairness suppression is persisted in `HubFairnessCycleStateSnapshot`
- `HubPostureProjection.postureState = overload_critical`

## Fail-closed convergence posture

If risk-order convergence is not proven inside the configured cap:

- `HubQueueRankSnapshot.convergenceState = failed_closed`
- `HubPostureProjection.postureState = mutation_frozen`
- `HubConsoleConsistencyProjection.freezeControls = true`

The engine still publishes a deterministic fallback order so the console can remain inspectable without pretending the queue is calmly writable.
