# 242 Completion And Next-Task Readiness Runbook

## Primary routes

- `GET /v1/workspace/tasks/{taskId}/completion-continuity`
- `POST /v1/workspace/tasks/{taskId}:settle-completion`
- `POST /internal/v1/workspace/tasks/{taskId}:record-manual-handoff`
- `POST /internal/v1/workspace/tasks/{taskId}:compute-continuity-evidence`
- `POST /internal/v1/workspace/tasks/{taskId}:evaluate-next-task-readiness`
- `POST /internal/v1/workspace/tasks/{taskId}:invalidate-stale-continuity`

## Expected operator sequence

### Direct resolution

1. 238 selects and submits the live `DecisionEpoch`.
2. 240 commits the direct consequence or handoff seed.
3. 242 settles `TaskCompletionSettlementEnvelope`.
4. 242 computes `WorkspaceContinuityEvidenceProjection`.
5. 241 issues or validates `NextTaskLaunchLease`.
6. 242 re-evaluates next-task readiness.

Calm completion is not eligible until steps 3 to 6 agree.

### Manual baton or downstream owner

1. Call `:record-manual-handoff`.
2. Confirm `OperatorHandoffFrame.settlementState`.
3. Expect `TaskCompletionSettlementEnvelope.authoritativeSettlementState = manual_handoff_required`.
4. Keep the task same-shell and blocked until downstream acknowledgement or governed recovery.

### Drift or reopen

Use `:invalidate-stale-continuity` when:

- reopen happens
- decision supersession lands
- ownership drift or stale owner recovery is opened
- publication tuple drifts
- queue snapshot drifts
- selected-anchor tuple drifts

Expected result:

- `authoritativeSettlementState = stale_recoverable | recovery_required`
- `validationState = stale | blocked`
- `completionCalmState = blocked`

## Inspection checklist

When investigating a stuck next-task CTA, inspect these refs in order:

1. `TaskCompletionSettlementEnvelope.nextTaskLaunchState`
2. `TaskCompletionSettlementEnvelope.blockingReasonRefs[]`
3. `WorkspaceContinuityEvidenceProjection.validationState`
4. `WorkspaceContinuityEvidenceProjection.blockingRefs[]`
5. `NextTaskLaunchLease.sourceSettlementEnvelopeRef`
6. `NextTaskLaunchLease.continuityEvidenceRef`
7. `NextTaskLaunchLease.sourceRankSnapshotRef`
8. `WorkspaceTrustEnvelope.completionCalmState`

## Common blocker interpretations

- `TASK_242_NEXT_TASK_LEASE_REQUIRED`:
  settlement is authoritative, but there is no current lease for next-task launch.
- `WORKSPACE_232_QUEUE_SNAPSHOT_DRIFT`:
  envelope and current continuity disagree on queue-snapshot truth.
- `WORKSPACE_232_SELECTED_ANCHOR_LOST`:
  the selected anchor tuple no longer matches and no repair target is present.
- `TASK_242_MANUAL_HANDOFF_REQUIRED`:
  downstream owner baton is still open; do not present calm completion.

## Current operational limitations

- `experienceContinuityEvidenceRef` is stable and deterministic, but it is not yet backed by a Phase 9 ledger writer.
- `NextTaskPrefetchWindow` is not yet a live worker-owned object in this slice; `latestPrefetchWindowRef` remains compatibility-only.
