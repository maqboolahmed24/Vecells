# 270 Phase 3 Queue Callback Admin Runbook

## Purpose

Use the 270 merge bundle when queue, callback, self-care, bounded-admin, and next-task surfaces disagree.

## Operator Checks

1. Open the queue route that owns the task.
2. Confirm the preview pocket dominant summary and badges.
3. Use the dominant same-shell launch:
   - callback repair
   - self-care or bounded-admin consequence
   - task shell
4. Re-check `CompletionContinuityStage` and `NextTaskPostureCard` before launching away from the task.

## Expected Behaviors

- callback route repair must suppress a calm next-task launch
- bounded admin waiting dependency must stay visible as the dominant blocker
- buffered queue churn must block next-task launch even when a candidate is warmed
- stale or recovery-only posture must preserve the current anchor and draft instead of silently retargeting

## Recovery

- If queue preview and peer route disagree, treat the peer route as the source to inspect and re-run the 270 validator.
- If completion calmness looks authoritative while callback repair or admin waiting is still active, treat that as a 270 regression.
- If queue preview opens the correct peer route but the wrong child stage, check the route launch anchor and stage seed in `staff-shell-seed.tsx`.
