# 252 Dependency Repair And Reopen Runbook

## Read the current dependency posture

Use:

- `GET /v1/workspace/tasks/{taskId}/advice-admin-dependency`

Read:

- `dependencyState`
- `reopenState`
- `dominantReasonCodeRef`
- `dominantRecoveryRouteRef`
- full `reasonCodeRefs`

## Re-evaluate on fresh tuple truth

Use:

- `POST /v1/workspace/tasks/{taskId}:evaluate-advice-admin-dependency-set`
- `POST /v1/workspace/tasks/{taskId}:refresh-advice-admin-dependency-set`
- `POST /v1/workspace/tasks/{taskId}:recalculate-advice-admin-reopen-state`

Provide the latest presented tuple when the caller already holds one:

- `presentedBoundaryTupleHash`
- `presentedDecisionEpochRef`
- `presentedDependencySetRef`

## When `stale_recoverable` returns

Do not keep mutating on the caller’s stale tuple.

1. fetch the current dependency bundle
2. refresh the caller’s boundary and decision tuple
3. show the dominant blocker and dominant recovery route from the fresh bundle
4. retry only on the fresh tuple

## Operational interpretation

- `repair_required`: same-shell repair path remains legal
- `disputed`: dispute review is dominant; do not assume the last send or callback attempt was authoritative
- `blocked_pending_identity`: bounded consequence freezes behind identity repair
- `blocked_pending_consent`: consequence freezes behind consent recovery
- `blocked_pending_external_confirmation`: bounded admin work is waiting on an external dependency
- `reopen_required` or `blocked_pending_review`: advice and bounded admin consequence are no longer safe to continue

## Accepted seams

- identity blocking may arrive through the injected identity port or through bounded-admin waiting posture until the shared identity-access query is published
- the dependency engine currently consumes canonical communication, render, admin, and request truth directly; it does not depend on analytics or UI projection caches
