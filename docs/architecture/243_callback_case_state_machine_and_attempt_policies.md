# 243 Callback Case State Machine And Attempt Policies

This task publishes the executable Phase 3 callback domain as six durable objects:

- `CallbackCase`
- `CallbackIntentLease`
- `CallbackAttemptRecord`
- `CallbackExpectationEnvelope`
- `CallbackOutcomeEvidenceBundle`
- `CallbackResolutionGate`

The canonical path is explicit:

`created -> queued -> scheduled -> ready_for_attempt -> attempt_in_progress -> awaiting_outcome_evidence -> answered | no_answer | voicemail_left | contact_route_repair_pending -> awaiting_retry | escalation_review -> completed | cancelled | expired -> closed`

Governed reopen remains explicit as `closed -> reopened -> queued`.

## Authority split

`CallbackIntentLease` is the only scheduling authority. Claim, schedule, reschedule, cancel, and ready-for-attempt arming must all present the live `ownershipEpoch`, `fencingToken`, and current request-lineage fence tuple. Material drift in callback urgency, preferred window, service window, or contact route rotates the lease instead of mutating the old shell in place.

`CallbackAttemptRecord` is the callback-domain view over the canonical effect ledger. Each attempt is keyed by attempt fence plus dial target, and duplicate initiation reuses the same linked `IdempotencyRecord`, `CommandActionRecord`, and `AdapterDispatchAttempt`.

`CallbackExpectationEnvelope` is the only patient-visible promise source. `CALLBACK_243_EXPECTATION_SCHEDULED`, `CALLBACK_243_ATTEMPT_IN_PROGRESS`, and `CALLBACK_243_CONTACT_ROUTE_REPAIR_REQUIRED` are emitted through monotone envelope revisions rather than inferred from queue fields or provider statuses.

`CallbackOutcomeEvidenceBundle` binds `answered`, `no_answer`, `voicemail_left`, `route_invalid`, and `provider_failure` to durable evidence. `CallbackResolutionGate` is the only authority for `retry`, `escalate`, `complete`, `cancel`, or `expire`.

## Attempt-window policy

Attempt-window resolution is explicit and policy-driven. The resolver uses:

- callback urgency
- preferred window
- service window
- route authority state
- current recorded time

It derives the envelope’s `expectedWindowRef`, `windowLowerAt`, `windowUpperAt`, `windowRiskState`, `fallbackGuidanceRef`, and confidence band. Missed-window and repair transitions produce a fresh envelope revision instead of silently stretching the promise.

## Receipt chain

Provider evidence enters only through `AdapterReceiptCheckpoint`. `recordProviderReceipt` verifies the callback webhook signature, records the adapter receipt, and updates the live attempt as:

- `provider_acked`
- `outcome_pending`
- `reconcile_required`

Exact replay and semantic replay reuse the existing receipt checkpoint. Divergent same-fence evidence is delegated to canonical replay collision handling rather than settling a second authoritative callback outcome.

## Closure law

Callback completion remains separate from request closure. A callback case closes only after `CallbackResolutionGate.decision = complete | cancel | expire` and the lease is released. Request closure still belongs to `LifecycleCoordinator`.
