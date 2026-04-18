# 262 Focus Protection And Next Task Spec

## Task

- taskId: `par_262_phase3_track_Playwright_or_other_appropriate_tooling_frontend_build_workspace_focus_protection_buffered_queue_change_and_next_task_posture`
- visual mode: `Protected_Flow_Continuity`

## Core outcome

This slice makes workspace stability explicit. The shell now shows:

- when active work is protected by `WorkspaceFocusProtectionLease`
- which `ProtectedCompositionState` is being held in place
- which `QueueChangeBatch` items are buffered instead of silently applied
- whether completion calmness is authoritative or still provisional
- whether `NextTaskPrefetchWindow` is only warmed or whether `NextTaskLaunchLease` is actually valid
- why auto-advance stays forbidden even when a next task is visible

## Production components

- `WorkspaceProtectionStrip`
- `BufferedQueueChangeTray`
- `ProtectedCompositionRecovery`
- `CompletionContinuityStage`
- `NextTaskPostureCard`
- `DepartureReturnStub`

## Authoritative contracts consumed

- `WorkspaceFocusProtectionLease`
- `ProtectedCompositionState`
- `QueueChangeBatch`
- `TaskCompletionSettlementEnvelope`
- `WorkspaceContinuityEvidenceProjection`
- `NextTaskPrefetchWindow`
- `NextTaskLaunchLease`
- `TaskWorkspaceProjection`
- `TaskLaunchContext`

## Route coverage

- `/workspace`
- `/workspace/queue/:queueKey`
- `/workspace/task/:taskId`
- `/workspace/task/:taskId/more-info`
- `/workspace/task/:taskId/decision`

## Interaction laws

1. Same-shell continuity remains authoritative. Protected work, buffered queue churn, completion continuity, and next-task posture stay in the current shell.
2. No auto-advance is allowed. `data-auto-advance="forbidden"` is permanent, and suggested or prefetched work never replaces the current task.
3. Buffered queue changes remain summary-first and explicit. They may not apply under protected composition.
4. Stale or recovery-only drift preserves draft, anchor, and quiet-return context instead of wiping the current mental model.
5. Next-task CTA only becomes live when the current launch lease is valid against the committed queue snapshot and completion calmness is authoritative.

## Visual posture

`Protected_Flow_Continuity` uses:

- a slim protection strip under the task header
- a bounded buffered-change tray instead of toasts
- compact continuity cards in the dock
- premium, non-noisy emphasis for protected, provisional, ready, and blocked states

## DOM contract

- `data-focus-protection`
- `data-protected-composition`
- `data-buffered-queue-batch`
- `data-next-task-state`
- `data-auto-advance`

## Responsive posture

- desktop: strip above the task plane, tray in the dock or workboard column
- tablet: tray and next-task card stack full-width inside the dock
- mobile: strip collapses to one column, tray groups restack, and the next-task card follows completion continuity

## Proof expectations

- Playwright drives queue-to-task-to-child-route continuity
- protection and tray states survive reload and history navigation
- blocked or stale postures preserve draft and return context
- no route mutates into the next task without an explicit operator action
