# 241 Reopen And Next-Task Launch Runbook

## What this runbook covers

This runbook is for the backend command paths behind governed reopen and next-task launch leases.

## Reopen commands

Use these surfaces:

- `:reopen-from-resolved`
- `:reopen-from-handoff`
- `:reopen-from-invalidation`

Expected behavior:

1. materialize or reuse the `DecisionSupersessionRecord`
2. invalidate any open approval checkpoint for that epoch
3. reconcile stale direct-resolution artifacts to `recovery_only`
4. reacquire triage lifecycle authority
5. record `TriageReopenRecord`
6. restore `TaskLaunchContext`
7. move `reopened -> queued`

The launch context must leave `TASK_241_QUEUE_RECALC_REQUIRED` in place until queue routing truth is refreshed.

## Launch-lease commands

Use:

- `:issue-next-task-launch-lease`
- `:validate-next-task-launch-lease`
- `:invalidate-next-task-launch-lease`

Issue only from the current `TaskLaunchContext.nextTaskCandidateRefs`.

Validate whenever any of these can drift:

- queue snapshot
- settlement prerequisite
- continuity evidence
- selected anchor or return anchor
- publication
- trust
- ownership or stale-owner recovery

Do not infer calm completion from successful lease issuance alone.

## Expected operating outcomes

- `ready`: operator may launch the next task
- `gated`: continuity posture blocks launch until the tuple is refreshed
- `blocked`: the lease is stale, expired, invalidated, or otherwise not launchable

## Failure handling

### Reopen blocked by stale owner

Symptom:

- reopen command fails closed with stale-owner recovery posture

Action:

1. resolve or take over the stale-owner recovery path
2. rerun the reopen command

### Detached hidden lease on resolved or handoff reopen

Symptom:

- the prior close path left an active control-plane lease without visible task lease refs

Action:

`241` now releases the detached lease and reacquires fresh reopen authority automatically. Treat it as repaired on the reopen path, but record it for later close-path cleanup work.

### Launch lease drift

Symptom:

- validation returns `stale`, `blocked`, or `continuity_blocked`

Action:

1. refresh queue or continuity truth
2. restore `TaskLaunchContext` if the anchor moved
3. issue a new `NextTaskLaunchLease`

## Downstream ownership

This runbook stops at reopen and launch authority.

- `242` consumes launch leases for calm completion and continuity proof
- later workspace consumers must launch against `NextTaskLaunchLease`, not local queue-next heuristics
