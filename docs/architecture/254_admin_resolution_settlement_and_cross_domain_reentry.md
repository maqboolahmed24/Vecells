# 254 Admin Resolution Settlement And Cross-domain Re-entry

## Intent

`254` turns bounded admin progress into one authoritative settlement chain.

The backend now publishes:

- `AdminResolutionActionRecord`
- `AdminResolutionSettlement`
- `AdminResolutionExperienceProjection`
- `AdminResolutionCrossDomainReentry`

That closes the old gap where local admin receipts, queue badges, or worker optimism could look complete before the governing tuple actually allowed completion.

## Settlement law

`AdminResolutionSettlement.result` now uses the exact vocabulary frozen by the prompt and blueprint:

- `queued`
- `patient_notified`
- `waiting_dependency`
- `completed`
- `reopened_for_review`
- `blocked_pending_safety`
- `stale_recoverable`

The transition guard table is explicit and deterministic.
Every mutation checks the current predecessor and only allows the next result when the guard table says the transition is legal.

## Tuple binding

Every settlement echoes the current governing tuple:

- `boundaryDecisionRef`
- `boundaryTupleHash`
- `clinicalMeaningState`
- `operationalFollowUpScope`
- `decisionEpochRef`
- `decisionSupersessionRecordRef`
- `dependencySetRef`
- release and publication refs
- lineage fence and trust posture

completed is legal only when the tuple still says:

- `clinicalMeaningState = bounded_admin_only`
- `operationalFollowUpScope = bounded_admin_resolution`
- admin mutation authority is still bounded
- the dependency posture still allows the current consequence
- a matching `AdminResolutionCompletionArtifact` exists
- a matching patient expectation template binding exists
- the action is still on the current unsuperseded `DecisionEpoch`

If the caller is acting on an old tuple, old epoch, old dependency set, old completion artifact, or old lineage fence, the mutation settles `stale_recoverable` instead of silently retargeting the latest case.

## Exact-once mutation path

The kernel now uses:

- deterministic idempotency digests
- per case and digest in-flight serialization
- immutable action records
- immutable settlement rows
- replay collapse for same-tuple repeated mutation attempts

That is the backend answer to the prompt requirement that exact-once mutation law must survive replay and concurrency instead of being implied by UI discipline.

## Cross-domain re-entry

Cross-domain re-entry is no longer a route redirect.

When bounded admin work becomes illegal because of:

- boundary reopen
- safety or clinical re-entry
- identity repair
- contact route repair
- consent repair
- external confirmation
- stale tuple drift

the system preserves the prior settlement chain and writes one `AdminResolutionCrossDomainReentry`.

The resolver chooses among:

- `clinician_review`
- `triage_review`
- `identity_repair`
- `contact_route_repair`
- `consent_repair`
- `external_confirmation`
- `bounded_admin_resume`

with explicit resolver modes:

- `reopen_launch`
- `repair_route_only`
- `same_shell_recovery`

## Projection reconciliation

`AdminResolutionExperienceProjection` now derives from settlement truth instead of route-local acknowledgement:

- patient and staff visibility tiers come from the authoritative settlement tuple
- completion calmness stays blocked until the canonical settlement and `TaskCompletionSettlementEnvelope` say it is safe
- `waiting_dependency` stays live and recovery-aware instead of pretending the work is done
- re-entry freezes bounded admin mutation authority and points the shells at the governed next action

Projection reconciliation is intentionally mutable even though settlement rows are immutable.
The current projection can reconcile forward across new trust posture or re-entry state without mutating the prior settlement chronology.

## Command surface

`254` publishes the command-api surface required by the prompt:

- `recordAdminResolutionSettlement`
- `settleAdminNotification`
- `settleAdminWaitingState`
- `settleAdminCompletion`
- `reopenAdminResolutionForReview`
- `resolveAdminCrossDomainReentry`

and one query surface:

- `GET /v1/workspace/tasks/{taskId}/admin-resolution-settlement`

## Temporary seams

Two seams stay explicit:

1. outbound admin notification and downstream patient-facing delivery are still simulator-backed adapters
2. downstream workspace and patient shells consume this contract later instead of being fully materialized in `254`

Those seams are recorded separately and do not weaken settlement authority, stale tuple handling, or governed re-entry.
