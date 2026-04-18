# 287 Booking Commit And Confirmation Truth

`287` owns the transactional core between selected offer and authoritative appointment truth. The runtime no longer treats booking as one API call or as a direct transition from selection into calm success.

## Core model

- `BookingTransaction` is the durable attempt record for one explicit commit command.
- `BookingConfirmationTruthProjection` is the patient- and staff-facing truth surface for pending, reconciled, confirmed, failed, expired, and superseded booking posture.
- `AppointmentRecord` exists only after a lawful authoritative proof class is accepted on the current transaction chain.
- `BookingException` is the append-only ambiguity and divergence record; it is not a shadow booking narrative.

## Commit algorithm

1. Resolve the current `BookingCase`, selected offer, slot snapshot, capability tuple, provider binding, and reservation truth.
2. Run preflight revalidation against the frozen selection proof, live binding hash, policy bundle, route writability, lease, ownership epoch, and late safety truth.
3. Acquire or refresh reservation truth through the canonical reservation authority from `286`.
4. Re-check the same tuple under the active fence before dispatch proceeds.
5. Dispatch with the same idempotency key and effect key so replay returns the live chain instead of creating a second external attempt.
6. Classify the supplier result into authoritative success, confirmation pending, reconciliation required, or failure.
7. Create `AppointmentRecord` only on lawful proof classes.
8. Refresh one `BookingConfirmationTruthProjection`.
9. Keep compensation, ambiguity, and supersession append-only.

## Truth separation

`BookingTransaction` separates local acknowledgement, processing acceptance, external observation, and authoritative outcome. That prevents a provider 202, transport acceptance, or callback arrival from being mistaken for a confirmed booking.

`AppointmentRecord` is created only on lawful proof classes. A durable provider reference, same-commit read-after-write proof, or later reconciled confirmation is required on the same transaction chain. Anything weaker remains pending or disputed.

## Pending and ambiguous outcomes

When supplier truth is asynchronous or contradictory, `ExternalConfirmationGate` remains the governing bridge and the transaction stays in `confirmation_pending` or `reconciliation_required`. Manage exposure, reminder readiness, and booked reassurance stay blocked until confirmed truth is written.

Duplicate and out-of-order callbacks collapse through the receipt-checkpoint chain. Divergent callbacks create one reconciliation or exception path, not a second appointment or a second booked narrative.

## Failure and compensation

Preflight failure is persisted before dispatch and returns governed failure reasons. Authoritative failure releases reservation truth through `286` and refreshes confirmation truth to failure or recovery posture. Local compensation after supplier-side success remains explicit through `BookingException` and a reconciliation-required transaction state; it is never hidden inside last-write-wins mutation.

## Case progression

The wrapper only advances `BookingCase` through the frozen 282 state machine:

- `selecting -> revalidating -> commit_pending`
- `commit_pending -> booked` on direct authoritative success
- `commit_pending -> confirmation_pending` on lawful async acceptance
- `commit_pending -> supplier_reconciliation_pending` on ambiguity or conflict
- `commit_pending -> booking_failed` on explicit failure
- later authoritative success after a pending or reconciliation posture advances the case into `managed`

Published events from this slice are:

- `booking.commit.started`
- `booking.commit.confirmation_pending`
- `booking.commit.reconciliation_pending`
- `booking.commit.confirmed`
- `booking.commit.ambiguous`
- `booking.confirmation.truth.updated`
- `booking.appointment.created`
