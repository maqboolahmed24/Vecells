# 292 Booking Reconciliation And Confirmation Worker

`BookingReconciliationRecord` is one durable control-plane object for a single `BookingTransaction`.

`BookingReconciliationAttempt` preserves append-only evidence, attempt keys, and receipt checkpoints for every callback, poll, retry, or manual resolution.

`ExternalConfirmationGateEvaluator` rebuilds `ExternalConfirmationGate` from accumulated reconciliation evidence instead of collapsing proof into a boolean.

`AuthoritativeReadSettlementService` distinguishes transport acceptance, callback acknowledgement, authoritative read confirmation, explicit failure, expiry, and contradiction.

`BookingReceiptAssimilator` fails closed on signature, network, or schema failure before any booking mutation.

The worker owns the gap between locally accepted booking work and patient-safe authoritative confirmation. It does not replace the `287` commit chain. It drives the existing commit pipeline with replay-safe observations, then synchronises:

- `BookingTransaction.processingAcceptanceState`
- `BookingTransaction.externalObservationState`
- `BookingTransaction.authoritativeOutcomeState`
- `ReservationTruthProjection`
- `BookingConfirmationTruthProjection`
- `BookingCase.status`
- the manual-attention queue entry in `BookingExceptionQueue`

The implementation keeps authoritative settlement monotone:

- `booked`, `failed`, `expired`, and `superseded` do not reopen to weaker states
- appointment creation still happens exactly once in the canonical commit chain
- provider-reference callbacks can enrich pending evidence without unlocking booked reassurance

The key runtime paths are:

1. `assimilateBookingReceipt`
2. `forceReconcileAttempt`
3. `processDueReconciliations`
4. `resolveManualDispute`

`assimilateBookingReceipt` is the callback and webhook ingress. It always goes through `AdapterReceiptCheckpoint` via the existing booking commit application. Duplicate and stale receipts can advance the same authoritative chain, but they cannot mint a second appointment record.

`forceReconcileAttempt` and `processDueReconciliations` are the governed read-after-write worker paths. They use the typed `BookingAuthoritativeReadAdapter` seam, build machine-readable evidence, refresh the gate, and only mark confirmation as final when the proof class is lawful for the frozen provider policy.

`resolveManualDispute` is the explicit operator path. It requires an audit reason, preserves append-only attempt history, refreshes the gate with manual-review evidence, and resolves the `ambiguous_commit` queue entry only after canonical settlement succeeds.
