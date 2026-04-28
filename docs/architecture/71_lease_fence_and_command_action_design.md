
# 71 Lease Fence and Command Action Design

`par_071` freezes the foundational control-plane primitives that later mutation services must call rather than re-implement locally.

## Core law

`RequestLifecycleLease` is a compare-and-set authority, not a soft ownership flag.

`StaleOwnershipRecoveryRecord` is the mandatory operator-visible record when stale ownership, heartbeat expiry, or lineage drift rejects a mutation.

`CommandActionRecord` is the immutable mutation tuple. Later reconstruction must come from the stored action record, not route params or cached shell state.

## Frozen baseline

- `7` leases across triage, booking, hub, governance, and pharmacy control surfaces
- `4` stale-owner recoveries with `2` still open for same-shell recovery
- `2` committed takeovers with new ownership epochs and fencing tokens
- `11` lineage fences guarding ownership change, close, reopen, and cross-domain commit
- `2` immutable action tuples showing exact reuse and explicit supersession

## Aggregate inventory

- `RequestLifecycleLease`: owns the active actor, epoch, fencing token, TTL, break posture, and supersession chain.
- `StaleOwnershipRecoveryRecord`: binds stale-owner cause, blocked action scopes, same-shell recovery route, and resolution state.
- `LeaseTakeoverRecord`: proves approver, prior lease, replacement lease, and committed takeover timestamp.
- `LineageFence`: advances the episode-scoped epoch monotonically before cross-domain invariant changes.
- `CommandActionRecord`: captures exact route-intent tuple, policy bundle, causality frame, idempotency link, and effect-set hash.

## Parallel gap posture

The later coordinators may consume these records, but they may not change lease, epoch, or action-record law. This track intentionally publishes the control-plane substrate first so sibling tracks integrate to frozen interfaces instead of inventing local concurrency rules.
