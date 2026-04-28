# 72 Command Settlement And Transition Envelope Design

`par_072` adds the authoritative mutation-settlement substrate and the same-shell transition-envelope library that later patient, staff, support, ops, and governance shells will consume.

## Core law

`CommandSettlementRecord` is the authoritative mutation outcome substrate.
`TransitionEnvelope` is the required same-shell bridge for meaningful asynchronous action.
The four dimensions remain distinct: local acknowledgement, processing acceptance, external observation, and authoritative outcome.

## Frozen surface

- Settlement revisions: `10`
- Transition envelopes: `10`
- Scenarios: `7`
- Recovery-required revisions: `3`

## Implementation notes

- Immutable settlement revisions supersede through `supersedesSettlementRef`.
- Calm success requires authoritative proof, `quietEligibleAt`, and audit linkage.
- Recoverable outcomes preserve `sameShellRecoveryRef`, `lastSafeAnchorRef`, and `allowedSummaryTier`.
- Projection visibility or accepted-for-processing may inform the shell, but they may not quiet it.
