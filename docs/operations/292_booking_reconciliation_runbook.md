# 292 Booking Reconciliation Runbook

## Purpose

Use the reconciliation worker when a booking is still `confirmation_pending` or `reconciliation_required` after the initial commit path.

## Operational commands

Use `GET /v1/bookings/cases/{bookingCaseId}/reconciliation/current` to inspect the current booking transaction, reconciliation record, gate posture, and manual queue state.

Use `POST /internal/v1/bookings/transactions/{bookingTransactionId}:assimilate-receipt` for supplier callbacks and webhooks.

Use `POST /internal/v1/bookings/transactions/{bookingTransactionId}:force-reconcile` for one governed retry.

Use the same route for one operator-driven authoritative read when policy allows.

Use `POST /internal/v1/bookings/reconciliation:process-due` to sweep due records.

Use `POST /internal/v1/bookings/transactions/{bookingTransactionId}:resolve-manual-dispute` only after an operator has reviewed supplier evidence.

## Normal posture

- `poll_due` means the worker should run another read-after-write attempt.
- `awaiting_callback` means the case is still waiting for supplier-side confirmation evidence.
- `disputed` means contradictory evidence exists but bounded automation may still continue.
- `manual_attention` means automation is exhausted or unsafe and the `ambiguous_commit` queue entry should be worked.

## Manual resolution checklist

1. Inspect the reconciliation status bundle and note the latest reason codes and evidence refs.
2. Check the latest gate state and confidence to confirm whether the dispute is unresolved or already expired.
3. Review the supplier evidence outside the patient shell.
4. Resolve the transaction as `confirmed`, `failed`, or `expired` with an explicit audit reason.
5. Confirm the queue entry cleared and the final booking truth is visible from the reconciliation status query.

## Failure patterns to watch

- repeated `authoritative_read_not_yet_visible`
- `accepted_but_authoritative_read_missing`
- `callback_signature_verification_failed`
- `provider_reference_slot_conflict`
- `authoritative_confirmation_timeout`

The worker is intentionally bounded. If it cannot settle safely, it must expose manual attention instead of retrying forever.
