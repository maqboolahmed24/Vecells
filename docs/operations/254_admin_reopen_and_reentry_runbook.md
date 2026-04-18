# 254 Admin Reopen And Re-entry Runbook

## Scope

Use this runbook when Phase 3 bounded admin work must settle, reopen, or hand control back to a governed review or repair path.

## Supported results

The authoritative settlement results are:

- `queued`
- `patient_notified`
- `waiting_dependency`
- `completed`
- `reopened_for_review`
- `blocked_pending_safety`
- `stale_recoverable`

## Normal completion flow

1. Query the current bounded admin context with `GET /v1/workspace/tasks/{taskId}/admin-resolution-settlement`.
2. Confirm the tuple is still `bounded_admin_only` and `bounded_admin_resolution`.
3. Confirm the current `AdminResolutionCompletionArtifact` and patient expectation template binding exist.
4. Call `settleAdminCompletion`.
5. Use the returned `AdminResolutionExperienceProjection` and `TaskCompletionSettlementEnvelope` as the only calmness signal.

## Waiting or notification flow

Use:

- `settleAdminNotification` when the patient-visible administrative consequence has been sent but the work is not done
- `settleAdminWaitingState` when a live dependency is blocking completion

Do not upgrade either result to `completed` without the legal completion tuple.

## Reopen flow

Use `reopenAdminResolutionForReview` when:

- new evidence reopens the boundary
- safety or clinician re-entry now dominates
- bounded admin completion is no longer legal

Expected outcome:

- settlement becomes `reopened_for_review`
- continuity is invalidated
- one `AdminResolutionCrossDomainReentry` is written
- the dominant next action points to governed review

## Repair-route flow

Use `resolveAdminCrossDomainReentry` when the settlement chain is already present and the live blocker shape requires:

- `identity_repair`
- `contact_route_repair`
- `consent_repair`
- `external_confirmation`
- same-shell recovery

That call must preserve the originating settlement ref and the exact causal reason codes.

## Stale tuple recovery

If a caller presents an old tuple, the system will settle `stale_recoverable`.

Operator guidance:

1. do not retry the old payload blindly
2. refresh the current settlement bundle
3. inspect the drift reason codes
4. relaunch through the current tuple only if the live boundary still allows bounded admin consequence

## Current non-live seams

`254` is production-shaped, but two adapters remain non-live:

- outbound admin notification delivery is still simulator-backed
- downstream shell materialization is still a consumer of the contract rather than part of this task
