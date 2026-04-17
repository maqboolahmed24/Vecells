
# 71 Stale Owner and Lineage Epoch Rules

## Recovery law

Stale-owner recovery is mandatory. When stale ownership tokens, expired heartbeats, or stale lineage epochs are presented, the system opens or updates a `StaleOwnershipRecoveryRecord` before the write path returns control to the caller.

`LineageFence` must advance monotonically for every ownership change and every cross-domain invariant change.

Supervisor takeover never overwrites the prior lease blindly. It breaks or supersedes the prior lease, resolves the stale-owner record, and mints a new ownership epoch and fencing token.

## Fail-closed rules

- stale ownership tokens are rejected after takeover or expiry
- stale lineage epochs are rejected before close, reopen, or cross-domain commit may proceed
- cross-context command writes must name required context-boundary refs
- immutable action records are the only supported reconstruction source for later settlement and audit joins

## Simulator contract

The deterministic harness must cover competing reviewers, restarted workers with stale fencing tokens, supervisor takeover while stale-owner recovery is open, stale close/reopen epochs, and repeated UI actions that either reuse or supersede the same command tuple.
