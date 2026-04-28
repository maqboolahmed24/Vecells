# 242 Task Completion Settlement And Workspace Continuity

## Scope

`242` turns task-end posture into one governed backend path:

- `TaskCompletionSettlementEnvelope`
- `OperatorHandoffFrame`
- `WorkspaceContinuityEvidenceProjection`
- continuity-backed `nextTaskLaunchState`
- calm-completion gating through `WorkspaceTrustEnvelope`

The implementation lives in:

- `packages/domains/triage_workspace/src/phase3-task-completion-continuity-kernel.ts`
- `services/command-api/src/phase3-task-completion-continuity.ts`

## Core model

`TaskCompletionSettlementEnvelope` is the durable task-end settlement layer. Each envelope carries:

- `taskId`
- `actionType`
- `selectedAnchorRef`
- `sourceQueueRankSnapshotRef`
- `workspaceTrustEnvelopeRef`
- `localAckState`
- `authoritativeSettlementState = pending | settled | recovery_required | manual_handoff_required | stale_recoverable`
- `nextOwnerRef`
- `closureSummaryRef`
- `blockingReasonRefs[]`
- `nextTaskLaunchState = blocked | gated | ready | launched`
- `nextTaskLaunchLeaseRef`
- `experienceContinuityEvidenceRef`
- `releaseConditionRef`
- `settledAt`

The kernel keeps a monotone `settlementRevision` and reuses the current envelope for exact replay. When readiness, trust, or recovery posture changes, the same envelope identity can advance by version while keeping the continuity contract stable for 241 lease validation.

## Handoff visibility

`OperatorHandoffFrame` is durable, not a note. It carries:

- `handoffType`
- `nextOwnerRef`
- `readinessSummaryRef`
- `pendingDependencyRefs[]`
- `confirmedArtifactRef`
- `settlementState`

Booking and pharmacy baton cases now surface explicit `OperatorHandoffFrame` rows with `pending_acceptance` or `acknowledged` state instead of collapsing that dependency into generic completion text.

## Continuity and readiness

`WorkspaceContinuityEvidenceProjection` is recomputed from authoritative upstream refs only:

- route family and route continuity contract
- selected anchor and selected-anchor tuple hash
- surface publication and runtime publication bundle
- queue snapshot
- latest completion envelope ref
- latest next-task launch lease ref
- stable `experienceContinuityEvidenceRef`

The projector publishes:

- `validationState = trusted | degraded | stale | blocked`
- `nextTaskLaunchState = trusted_ready | trusted_blocked | degraded | stale | blocked`
- exact `blockingRefs[]`

`TaskCompletionSettlementEnvelope.sourceQueueRankSnapshotRef`, `WorkspaceContinuityEvidenceProjection.sourceQueueRankSnapshotRef`, and `NextTaskLaunchLease.sourceRankSnapshotRef` are reconciled together. Queue drift becomes explicit degraded or blocked posture; it does not disappear behind refreshed queue chrome.

## Calm completion law

Quiet completion stays blocked or pending until all of these agree:

1. the governing direct consequence or handoff settlement is authoritative
2. `TaskCompletionSettlementEnvelope.authoritativeSettlementState` is no longer `pending`
3. `WorkspaceContinuityEvidenceProjection` still validates the same selected anchor, queue snapshot, and publication tuple
4. `NextTaskLaunchLease` is current for the same settlement and stable continuity evidence

This is why `TASK_242_NEXT_TASK_GATED` and `TASK_242_NEXT_TASK_LEASE_REQUIRED` remain durable blocker facts even after direct resolution has already settled.

## Invalidation path

`workspace_task_invalidate_stale_continuity` moves the current task-end posture to `stale_recoverable` or `recovery_required` when one of these happens:

- reopen
- decision supersession
- ownership drift
- trust drift
- publication drift
- queue-snapshot drift
- selected-anchor drift

The result is explicit degraded truth. Reopened or superseded work cannot remain quietly complete.
