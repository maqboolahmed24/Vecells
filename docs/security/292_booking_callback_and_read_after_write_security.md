# 292 Booking Callback And Read After Write Security

Where supplier signing is supported, callbacks must arrive with `signatureVerification = verified`.

Where source-network policy exists, callbacks must arrive with `networkVerification = verified`.

`AdapterReceiptCheckpoint` remains the only dedupe authority for callback and webhook receipts, and the worker reuses the same receipt chain for replay-safe read-after-write observations.

The receipt assimilator fails closed when any of the following is true:

- signature verification failed
- network policy verification failed
- payload schema validation failed

On fail-closed ingress, the implementation:

1. does not mutate booking truth
2. records one append-only reconciliation attempt with `outcome = security_rejected`
3. marks the reconciliation record for manual attention
4. opens or refreshes one `ambiguous_commit` queue entry

The worker keeps externally consequential state replay-safe by combining:

- `AdapterReceiptCheckpoint` for callback and poll observation dedupe
- deterministic synthetic transport message ids for authoritative reads
- stable attempt keys in `BookingReconciliationAttempt`
- monotone final-state guards in `BookingReconciliationRecord`

Logs, queue evidence refs, and emitted events carry hashes, refs, and reason codes only; they do not need raw PHI payloads.

The authoritative-read adapter bridge is least-privilege and read-only. It supplies retrieval evidence into the reconciliation worker, but settlement still happens inside the booking commit chain and its existing reservation and confirmation controls.
