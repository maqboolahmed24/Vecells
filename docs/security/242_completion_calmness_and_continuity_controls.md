# 242 Completion Calmness And Continuity Controls

## Security posture

`242` closes five backend control gaps:

1. `task complete means calm UI`
2. `next task can launch from warmed cache`
3. `queue snapshot drift is invisible`
4. `selected anchor can silently change`
5. `manual handoff is hidden in notes`

## Control rules

- `TaskCompletionSettlementEnvelope` is authoritative. A toast, queue refresh, outbox enqueue, or `localAckState = shown` never authorizes calm completion.
- `WorkspaceContinuityEvidenceProjection` must validate the same route family, selected-anchor tuple, publication tuple, and queue snapshot before the shell can claim trusted readiness.
- `NextTaskLaunchLease` is necessary but not sufficient. The lease must align with the current envelope, the stable `experienceContinuityEvidenceRef`, and the current queue-snapshot tuple.
- `WorkspaceTrustEnvelope.completionCalmState` is the only emitted calmness verdict. The browser is not allowed to promote local success independently.
- `OperatorHandoffFrame` keeps downstream baton state explicit until manual-handoff or downstream acceptance actually settles.

## Blocking reason families

242 emits first-class blocker state instead of a generic disabled button:

- `TASK_242_AUTHORITATIVE_SETTLEMENT_PENDING`
- `TASK_242_MANUAL_HANDOFF_REQUIRED`
- `TASK_242_NEXT_TASK_LEASE_REQUIRED`
- `TASK_242_NEXT_TASK_GATED`
- `TASK_242_RECOVERY_REQUIRED`
- `TASK_242_STALE_COMPLETION_CONTEXT`
- `TASK_242_DECISION_SUPERSEDED`
- `TASK_242_STALE_OWNER_RECOVERY`

It also preserves upstream drift facts from the workspace and lease stacks, including:

- `WORKSPACE_232_QUEUE_SNAPSHOT_DRIFT`
- `WORKSPACE_232_SELECTED_ANCHOR_REMAPPABLE`
- `WORKSPACE_232_SELECTED_ANCHOR_LOST`
- `WORKSPACE_232_SURFACE_PUBLICATION_DRIFT`
- `WORKSPACE_232_RUNTIME_PUBLICATION_DRIFT`
- `TASK_241_QUEUE_SNAPSHOT_DRIFT`
- `TASK_241_CONTINUITY_DRIFT`

## Fail-closed outcomes

These states must fail closed:

- missing or stale request lifecycle truth
- selected-anchor drift without a repair target
- stale owner recovery
- reopened or superseded consequence chains
- publication tuple drift
- queue snapshot drift between completion and launch

The fail-closed effect is explicit:

- `validationState = degraded | stale | blocked`
- `nextTaskLaunchState = blocked | gated`
- `completionCalmState = pending_settlement | blocked`

## Carried limitations

- The repo still uses a stable task-scoped `experienceContinuityEvidenceRef` placeholder instead of a Phase 9 ledger-backed `ExperienceContinuityControlEvidence` writer.
- `NextTaskPrefetchWindow` is still pass-through only. 242 validates `latestPrefetchWindowRef` and queue continuity, but it does not ship the warm-path worker itself.
