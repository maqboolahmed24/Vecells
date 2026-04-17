# 76 Closure Blocker Taxonomy And Rules

## Blocker Taxonomy

| Blocker class | Persisted field | Canonical defer outcome |
| --- | --- | --- |
| `lease_conflict` | `blockingLeaseRefs[]` | `LEASE_ACTIVE_OR_BROKEN` |
| `safety_preemption` | `blockingPreemptionRefs[]` | `SAFETY_PREEMPTION_OPEN` |
| `approval_checkpoint` | `blockingApprovalRefs[]` | `APPROVAL_OR_CONFIRMATION_PENDING` |
| `outcome_reconciliation` | `blockingReconciliationRefs[]` | `PHARMACY_RECONCILIATION_OPEN` |
| `confirmation_gate` | `blockingConfirmationRefs[]` | `APPROVAL_OR_CONFIRMATION_PENDING` |
| `lineage_case_link_active` | `blockingLineageCaseLinkRefs[]` | `LINEAGE_BRANCH_STILL_ACTIVE` |
| `duplicate_review` | `blockingDuplicateClusterRefs[]` | `REPAIR_OR_REVIEW_OPEN` |
| `fallback_review` | `blockingFallbackCaseRefs[]` | `REPAIR_OR_REVIEW_OPEN` |
| `identity_repair` | `blockingIdentityRepairRefs[]` | `REPAIR_OR_REVIEW_OPEN` |
| `live_phi_grant` | `blockingGrantRefs[]` | `LIVE_PHI_GRANT_PRESENT` |
| `reachability_dependency` | `blockingReachabilityRefs[]` | `REACHABILITY_REPAIR_OPEN` |
| `degraded_promise` | `blockingDegradedPromiseRefs[]` | `CONSENT_OR_DEGRADED_PROMISE_OPEN` |

## Request Closure Rules

- `Request.workflowState = closed` is illegal without `RequestClosureRecord(decision = close)`.
- Blockers remain orthogonal to workflow milestones; they never become convenience workflow states.
- `requiredLineageEpoch` is mandatory and must be evaluated under the current lineage fence.
- Current materialized blocker sets are authoritative for legal closure, not prose summaries.

## Fallback Review Rules

- `FallbackReviewCase` keeps the same lineage and public continuity surface.
- `patientVisibleState = submitted_degraded` is allowed only while accepted progress is retained through bounded degraded handling.
- Wrong-patient repair uses `IdentityRepairCase`, never `FallbackReviewCase`.
- Closing a fallback case requires one of:
  - recovery
  - governed supersession
  - governed manual settlement

## Replay And Concurrency Rules

- Closure records are append-only and immutable after persistence.
- Fallback cases preserve versioned history with optimistic-concurrency enforcement.
- Stale materialized blocker refs still force `decision = defer`.
- Close requests cannot outrun blocker truth, confirmation truth, or command-following consumption.

## Parallel Interface Gaps

- `PARALLEL_INTERFACE_GAP_REQUEST_CLOSE_DEFERRED_EVENT`
- `PARALLEL_INTERFACE_GAP_EXCEPTION_REVIEW_CASE_ADVANCED_EVENT`
- `PARALLEL_INTERFACE_GAP_EXCEPTION_REVIEW_CASE_CLOSED_EVENT`
