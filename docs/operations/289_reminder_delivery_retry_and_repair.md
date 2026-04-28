# 289 Reminder Delivery Retry And Repair

## Operating posture

- Reminder queueing starts from `sweepDueReminderSchedules`, never from process-local timer truth alone.
- Transport acceptance is not delivery truth.
- `recordReminderTransportOutcome` updates retry posture and transport acknowledgement.
- `recordReminderDeliveryEvidence` settles delivered, failed, expired, or disputed outcomes and refreshes reachability posture.

## Retry rules

- Only transient transport timeouts stay in queued posture with a bounded `nextAttemptAt`.
- Accepted transport moves the schedule entry to `sent` and the plan to `awaiting_delivery_truth`.
- Rejected transport or exhausted retries move the plan into blocked recovery posture.
- Queue idempotency keys and delivery evidence keys remain replay-safe so worker restarts do not duplicate reminder sends or duplicate evidence ingestion.

## Repair triggers

- Verification stale or missing on the active route snapshot.
- Reachability assessment blocked or disputed.
- Provider bounce, expired delivery, or contradictory manual dispute.
- Appointment cancellation, supersession, reschedule drift, or confirmation truth regression.

## Repair actions

- Open or refresh `ContactRouteRepairJourney`.
- Keep `BookingConfirmationTruthProjection.reminderExposureState = blocked` while the plan is in blocked or disputed posture.
- Preserve the last lawful reminder evidence chain; do not rewrite or delete prior schedule entries.
- Require reminder changes to settle through the same `ReminderPlan` instead of queueing a detached manual resend.

## Webhook and callback handling

- Validate provider webhook authenticity before turning any callback into reminder delivery evidence.
- Cache webhook replay material and keep delivery evidence ingestion idempotent by `deliveryEvidenceKey`.
- Treat provider callbacks as asynchronous evidence that may arrive out of order.
- Keep PHI out of scheduler logs, queue metrics, and raw webhook traces.

## Daily checks

- Review reminder plans in `delivery_blocked` or `disputed` posture.
- Review route-repair journeys opened from reminder failures.
- Check for queued entries whose `nextAttemptAt` is in the past and whose envelope still lacks terminal delivery evidence.
- Confirm that reminder plans tied to cancelled or superseded appointments have moved to suppressed posture and no longer show live reminder exposure.
