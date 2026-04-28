# 72 Settlement Dimension Mapping Rules

## Mapping law

- `localAckState` is UI-local and never implies authoritative settlement.
- `processingAcceptanceState` may widen pending guidance, but it cannot authorize calm success.
- `externalObservationState` may widen truth, but it cannot quiet the shell by itself.
- `authoritativeOutcomeState` is the only dimension that can authorize settled calm posture.

## Recovery law

- `stale_recoverable`, `blocked_policy`, `denied_scope`, and other recovery-required outcomes must publish one same-shell recovery ref.
- Recoverable envelopes preserve the last safe anchor and the allowed summary tier.
- Detached success or error pages are forbidden substitutes for same-shell recovery.

## Supersession law

- Later evidence may append a new settlement revision for the same action chain.
- A later revision must point to `supersedesSettlementRef` and may not create a competing head.
- Tuple drift requires a new action chain; later success may not be folded into the stale one.

## Simulator contract

The seeded simulator must keep the canonical seven scenarios available:

1. local acknowledgement followed by settled success
2. accepted-for-processing followed by pending external confirmation
3. projection-visible but not yet authoritative success
4. review-required outcome
5. stale-recoverable tuple drift
6. blocked-policy and denied-scope recovery
7. later evidence superseding a prior pending revision
