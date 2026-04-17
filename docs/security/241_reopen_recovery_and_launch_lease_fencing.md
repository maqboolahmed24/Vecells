# 241 Reopen Recovery And Launch-Lease Fencing

## Security posture

`241` closes two failure modes that were unsafe to leave as queue-local behavior:

1. reopened work silently inheriting stale lifecycle authority
2. next-task launch proceeding from stale queue or continuity truth

## Reopen fencing rules

Reopen must always be fenced against the current triage control plane.

- `TriageReopenRecord` is idempotent on the reopen tuple and prevents duplicate reopen storms.
- `DecisionSupersessionRecord` is mandatory whenever the prior `DecisionEpoch` is no longer actionable.
- reopen invalidates approval checkpoints for the superseded epoch instead of leaving them apparently reusable.
- detached active leases are released before reopen reacquire so stale tabs cannot continue mutating with the old fence tuple.

If a stale owner, expired owner, or already-open `StaleOwnershipRecoveryRecord` is present, reopen-sensitive mutation degrades to explicit recovery posture instead of silent continuation.

## Stale-owner recovery joins

The reopen path blocks on open stale-owner recovery when:

- `staleOwnerRecoveryRef` is already attached to the task
- the authority tuple no longer matches the task tuple
- protected composition is still recovering

The operator keeps:

- last safe summary
- selected anchor
- return anchor
- recovery route

but live mutation does not continue until reacquire or takeover settles.

## Launch-lease controls

`NextTaskLaunchLease` is a narrow authority object.

- It is not a quiet-completion verdict.
- It is not a queue-next hint.
- It is not browser history.
- It is not reusable once drifted, invalidated, expired, or consumed.

Only a live lease can authorize next-task launch. `continuity_blocked` posture maps to a visible gated state, never silent continuation.

## Mandatory invalidation triggers

A live launch lease is invalidated or degraded on:

- `TASK_241_QUEUE_SNAPSHOT_DRIFT`
- `TASK_241_SETTLEMENT_DRIFT`
- `TASK_241_CONTINUITY_DRIFT`
- `TASK_241_RETURN_ANCHOR_DRIFT`
- `TASK_241_OWNERSHIP_DRIFT`
- `TASK_241_PUBLICATION_DRIFT`
- `TASK_241_TRUST_DRIFT`
- `TASK_241_NEXT_TASK_LEASE_EXPIRED`

`TASK_241_STALE_OWNER_RECOVERY:*` blocks launch while ownership repair is open.

## No auto-advance

`241` explicitly forbids next-task auto-advance.

Even after successful direct resolution or handoff:

- the source task may issue a `NextTaskLaunchLease`
- the launch context may show `ready`, `gated`, or `blocked`
- the system still requires explicit operator launch under a live lease

This keeps calm completion, continuity evidence, and launch readiness separate until `242`.

## Accepted current gaps

Two accepted boundaries remain:

1. queue recompute and calm completion consumption still belong to `242`
2. detached close-time lease cleanup is repaired at reopen today, but close-time eager release is not yet centralized
