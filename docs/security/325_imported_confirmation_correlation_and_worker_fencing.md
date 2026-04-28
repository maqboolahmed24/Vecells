# 325 Imported Confirmation Correlation And Worker Fencing

## Security Posture

The 325 worker layer is fail-closed on identity, binding, tuple, and lease drift.

## Imported Confirmation

Imported supplier confirmation is evidence only until all of the following still match the live case:

- governing hub case
- selected candidate or lawful downstream equivalent
- provider binding hash
- active truth tuple
- current confirmation gate rules

If `providerAdapterBindingHash` drifts, the payload is retained as auditable evidence only. It does not create booked truth.

If supplier booking reference collides with another case, the worker records a dispute and opens `HubCoordinationException(exceptionClass = imported_confirmation_disputed)`.

## Lease Fencing

`HubReconciliationWorkLease` and `HubExceptionWorkItem` both carry explicit worker-run ownership.

Rules:

- only one active lease per unit of work
- a second worker may not overwrite a live lease
- expired leases are recorded and raise `stale_owner_or_stale_lease`
- replayed claim calls return the existing lease for the same worker run

## Supplier Mirror

Supplier observations are deduped by payload ID and appointment scope.

Monotone law:

- stale payloads do not overwrite newer checkpoints
- weaker `booked` observations do not thaw a frozen mirror
- drift expands recovery; it does not silently restore calmness

## Backfill

Backfill uses durable lineage only:

- current truth projection
- latest durable appointment for the case
- live attempt when one still exists
- continuity state
- reminder or visibility state
- current fallback state

Ambiguous lineage produces dispute or recovery and `backfill_ambiguity_supervision`. It may not mint a calmer booked or acknowledged posture by inference.
