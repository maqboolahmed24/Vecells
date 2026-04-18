# 287 Commit Fencing Idempotency And Recovery

## Fencing

The commit path fails closed unless the current request lease, ownership epoch, route tuple, selection proof, reservation version, and fence token all still match. The commit layer does not trust browser-local state or previously rendered offers.

Fence validation is cumulative:

- `requestLifecycleLeaseRef`
- `requestOwnershipEpochRef`
- route publication tuple
- `selectionProofHash`
- `reservationVersionRef`
- reservation `fenceToken`
- staff `ReviewActionLease` when present

Stale writer and safety preemption both abort commit before calm booking truth is written.

## Idempotency

The same idempotency key and `dispatchEffectKeyRef` gate duplicate supplier effects. Worker restarts, button retries, and replayed outbox deliveries resolve to the current transaction chain rather than issuing a second booking attempt.

Receipt handling is also idempotent. Duplicate callbacks are collapsed through the canonical receipt-checkpoint authority. Divergent callbacks are surfaced as reconciliation, not hidden as a later overwrite.

## Authoritative proof policy

No booked reassurance on provider 202 or pending ack. Transport acceptance and supplier async acknowledgement can widen explanation only; they do not create `AppointmentRecord`, writable manage posture, or reminder readiness.

Authoritative appointment truth is allowed only when the current binding policy accepts the proof class:

- `durable_provider_reference`
- `same_commit_read_after_write`
- `reconciled_confirmation`

If the proof is missing, contradictory, or disallowed by the current policy, the transaction remains pending or moves into reconciliation.

## Recovery posture

Failure and recovery stay append-only:

- preflight failure creates a failed transaction and exception record
- authoritative failure releases reservation truth and keeps recovery visible
- local compensation after supplier-side success creates explicit reconciliation state
- release or supersede marks the failed or ambiguous transaction as superseded without rewriting the earlier chain

Patient-safe projection remains derived from `BookingConfirmationTruthProjection`. That surface can show provisional receipt or recovery posture, but it cannot claim a booked appointment until authoritative truth exists.

## Logging and PHI

Receipt collapse, exception creation, and fence mismatch handling must remain observable without copying raw supplier payloads or patient identifiers into generic logs. Correlation is carried by action refs, settlement refs, payload artifact refs, and edge correlation ids instead.
