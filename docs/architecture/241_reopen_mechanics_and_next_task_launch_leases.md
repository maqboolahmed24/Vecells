# 241 Reopen Mechanics And Next-Task Launch Leases

## Scope

`241` turns reopen and post-completion follow-on launch into governed Phase 3 backend state instead of queue-side heuristics.

The implementation adds:

- canonical `TriageReopenRecord`
- explicit reopen-from-resolved, reopen-from-handoff, and reopen-from-invalidation flows
- stale-owner recovery joins for reopen-sensitive work
- canonical `NextTaskLaunchLease`
- durable `TaskLaunchContext` restoration and invalidation

`241` does not declare calm completion. `242` still owns `TaskCompletionSettlementEnvelope` and `WorkspaceContinuityEvidenceProjection`.

## Canonical reopen tuple

Every authoritative reopen is represented by one `TriageReopenRecord` carrying:

- `taskId`
- `sourceDomain`
- `reasonCode`
- `evidenceRefs`
- `supersededDecisionEpochRef`
- `decisionSupersessionRecordRef`
- `priorityOverride`
- `reopenedByMode`
- `reopenedAt`

Replay of the same bounce-back or invalidation tuple reuses the existing record. Reopen reasons are not hidden in free-form notes.

## Reopen algorithm

The reopen path now follows the required sequence:

1. create or reuse `DecisionSupersessionRecord`
2. invalidate any current approval checkpoint for the superseded `DecisionEpoch`
3. reconcile prior direct-resolution artifacts to `recovery_only` when the old epoch drove callback, message, booking, pharmacy, self-care, or admin launch
4. reacquire the triage-side lifecycle lease for reopen
5. persist `TriageReopenRecord`
6. restore `TaskLaunchContext` with the preserved return anchor and a queue-recalc blocker
7. reopen the task under a fresh fence tuple
8. keep `Request.workflowState = triage_active`
9. apply priority or urgency-carry elevation
10. transition `reopened -> queued`

The reopen path is a domain transition. It is not a direct queue insertion shortcut.

The restored launch context explicitly carries `TASK_241_QUEUE_RECALC_REQUIRED` until queue routing truth is refreshed.

## Detached lease repair on reopen

Direct-resolution close paths can leave an active control-plane triage lease after the task surface has already cleared its visible lease refs. `241` repairs that posture before reacquiring reopen authority:

- detect the detached active lease through the triage lease authority
- release it with `closeBlockReason = reopen_reacquire`
- acquire a fresh triage lifecycle lease for the reopen mutation

That prevents reopened work from inheriting a hidden pre-reopen fence tuple and makes stale claim attempts fail with explicit stale-context errors.

## Lineage preservation

Reopened work keeps durable linkage to the invalidated path through:

- `DecisionSupersessionRecord`
- `TriageReopenRecord`
- direct-resolution artifact `decisionSupersessionRecordRef`
- preserved `TaskLaunchContext.returnAnchorRef`
- restored queue key and rank snapshot references

Resolved callback bounce-back therefore remains linked to the prior `CallbackCaseSeed`. Booking and pharmacy bounce-back stay linked to the invalidated `BookingIntent` or `PharmacyIntent`.

## Next-task launch authority

`NextTaskLaunchLease` is now the only backend authority for launching the recommended next task from the just-finished task context.

The lease binds:

- `sourceTaskRef`
- `launchContextRef`
- `nextTaskCandidateRef`
- `sourceSettlementEnvelopeRef`
- `continuityEvidenceRef`
- `sourceQueueKey`
- `sourceRankSnapshotRef`
- `returnAnchorRef`
- `launchEligibilityState`
- `blockingReasonRefs`
- `issuedAt`
- `expiresAt`
- `leaseState`

`TaskLaunchContext.nextTaskLaunchState` is derived from the lease:

- `ready` only under a live ready lease
- `gated` for `continuity_blocked` posture
- `blocked` for stale, blocked, invalidated, or expired launch state

## Drift invalidation rules

`validateNextTaskLaunchLease` invalidates or degrades a live lease when any authoritative tuple drifts:

- source queue-rank snapshot
- prerequisite settlement
- continuity evidence
- return anchor or selected anchor tuple
- stale-owner recovery
- ownership
- publication
- trust
- lease expiry

No auto-advance is allowed. Launch always requires an explicit operator action under a live lease.

There is no auto-advance from a successful completion-looking local state.

## Published routes

`241` publishes these command surfaces:

- `GET /v1/workspace/tasks/{taskId}/reopen-launch`
- `POST /v1/workspace/tasks/{taskId}:reopen-from-resolved`
- `POST /v1/workspace/tasks/{taskId}:reopen-from-handoff`
- `POST /internal/v1/workspace/tasks/{taskId}:reopen-from-invalidation`
- `POST /internal/v1/workspace/tasks/{taskId}:issue-next-task-launch-lease`
- `POST /internal/v1/workspace/tasks/{taskId}/next-task-launch/{nextTaskLaunchLeaseId}:validate`
- `POST /internal/v1/workspace/tasks/{taskId}/next-task-launch/{nextTaskLaunchLeaseId}:invalidate`

These surfaces are the only supported reopen and next-task launch authority for later workspace consumers.
