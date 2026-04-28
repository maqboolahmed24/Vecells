# 321 Commit Fence, Idempotency, And Confirmation Rules

## Security and integrity posture

`321` closes four specific Phase 5 risks:

1. duplicate dispatch can no longer silently mint a second supplier booking
2. weak manual or imported evidence cannot mint booked truth
3. split-brain outcomes remain explicit instead of being retried blindly
4. supplier drift becomes an immediate frozen posture, not a later discovery

## Required attempt fence

Every commit attempt binds and validates:

- `selectedCandidateRef`
- `capacityUnitRef`
- `reservationRef`
- `reservationFenceToken`
- `providerAdapterBindingRef`
- `providerAdapterBindingHash`
- `truthTupleHash`
- `policyTupleHash`
- `lineageFenceEpoch`
- `idempotencyKey`

If any of those drift before side effects, the engine fails closed.

## Idempotency law

`beginCommitAttempt` replays by `idempotencyKey` instead of creating a second attempt.

`submitNativeApiCommit` now returns the existing terminal result before evaluating stale post-success fences, which keeps duplicate worker retries in the replay path rather than the side-effect path.

## Confirmation law

No transport acknowledgement, provider echo, manual note, or imported message is enough on its own.

Booked truth is legal only when:

- the canonical `ExternalConfirmationGate` reaches `confirmed`
- hard-match requirements pass
- contradictory evidence is absent
- competing-attempt margin remains above threshold
- current tuple and provider binding still match the selected candidate

## Manual and imported evidence law

Manual evidence:

- must be structured
- is bound to the live truth tuple
- remains provisional until enough independent evidence families are present

Imported evidence:

- must correlate with the live case and selected candidate
- must match the active provider source version
- must not reuse a booking reference already bound to another case
- disputes ambiguity instead of upgrading truth

## Split-brain and drift law

When supplier success cannot be distinguished safely from local durable failure:

- write a `HubCommitReconciliationRecord`
- block closure
- keep practice and patient posture in recovery mode

After authoritative confirmation:

- create `HubSupplierMirrorState`
- freeze manage posture when supplier cancellation or reschedule is observed
- emit a typed `HubSupplierDriftHook`

`322` and `323` must consume those hooks rather than synthesizing a parallel drift model.
