# 55 Closure Blocker Ledger

            ## Summary

            The blocker taxonomy is orthogonal to workflow milestones. Every row below materializes into one explicit `RequestClosureRecord` field, and every blocker class is forbidden from becoming a `Request.workflowState` value.

            | Blocker | Label | Persisted Field | Event Contracts |
| --- | --- | --- | --- |
| BCL_055_LEASE_CONFLICT | Lifecycle lease conflict | blockingLeaseRefs[] | CEC_REQUEST_LEASE_ACQUIRED, CEC_REQUEST_LEASE_RELEASED… |
| BCL_055_SAFETY_PREEMPTION | Safety preemption | blockingPreemptionRefs[] | CEC_SAFETY_PREEMPTED, CEC_SAFETY_DECISION_SETTLED… |
| BCL_055_APPROVAL_CHECKPOINT | Approval or acknowledgement checkpoint | blockingApprovalRefs[] | CEC_TRIAGE_TASK_SETTLED, CEC_HUB_PRACTICE_NOTIFIED… |
| BCL_055_OUTCOME_RECONCILIATION | Outcome reconciliation gate | blockingReconciliationRefs[] | CEC_BOOKING_COMMIT_RECONCILIATION_PENDING, CEC_BOOKING_COMMIT_AMBIGUOUS… |
| BCL_055_CONFIRMATION_GATE | External confirmation gate | blockingConfirmationRefs[] | CEC_CONFIRMATION_GATE_CREATED, CEC_CONFIRMATION_GATE_CONFIRMED… |
| BCL_055_LINEAGE_CASE_LINK | Active lineage branch | blockingLineageCaseLinkRefs[] | CEC_REQUEST_UPDATED, CEC_REQUEST_CLOSURE_BLOCKERS_CHANGED |
| BCL_055_DUPLICATE_REVIEW | Duplicate review required | blockingDuplicateClusterRefs[] | CEC_REQUEST_DUPLICATE_REVIEW_REQUIRED, CEC_REQUEST_DUPLICATE_RESOLVED… |
| BCL_055_FALLBACK_REVIEW | Fallback review case open | blockingFallbackCaseRefs[] | CEC_EXCEPTION_REVIEW_CASE_OPENED, CEC_EXCEPTION_REVIEW_CASE_RECOVERED… |
| BCL_055_IDENTITY_REPAIR | Identity repair active | blockingIdentityRepairRefs[] | CEC_IDENTITY_REPAIR_CASE_OPENED, CEC_IDENTITY_REPAIR_CASE_CORRECTED… |
| BCL_055_LIVE_PHI_GRANT | Live PHI-bearing grant | blockingGrantRefs[] | CEC_ACCESS_GRANT_ISSUED, CEC_ACCESS_GRANT_REDEEMED… |
| BCL_055_REACHABILITY_DEPENDENCY | Reachability repair open | blockingReachabilityRefs[] | CEC_REACHABILITY_DEPENDENCY_CREATED, CEC_REACHABILITY_DEPENDENCY_FAILED… |
| BCL_055_DEGRADED_PROMISE | Degraded promise still current | blockingDegradedPromiseRefs[] | CEC_CONFIRMATION_GATE_CREATED, CEC_COMMUNICATION_RECEIPT_ENVELOPED… |

            ## Verdict Scenarios

            | Scenario | Label | Decision | Closed By Mode |
| --- | --- | --- | --- |
| VSC_055_ROUTINE_CLOSE_V1 | Routine close | close | routine_terminal_outcome |
| VSC_055_ACTIVE_LEASE_DEFER_V1 | Defer for active lease | defer | not_closed |
| VSC_055_CONFIRMATION_DISPUTE_DEFER_V1 | Defer for confirmation dispute | defer | not_closed |
| VSC_055_IDENTITY_REPAIR_DEFER_V1 | Defer for identity repair | defer | not_closed |
| VSC_055_REACHABILITY_AND_GRANT_DEFER_V1 | Defer for reachability and grant debt | defer | not_closed |
| VSC_055_URGENT_BOUNCE_BACK_REOPEN_V1 | Governed reopen for urgent bounce-back | defer | not_closed |

            ## Persisted Close Record Rules

            - `requiredLineageEpoch` is mandatory for both close and defer.
            - `currentClosureBlockerRefs[]` and `currentConfirmationGateRefs[]` must be empty before a close verdict is legal.
            - `deferReasonCodes[]` cannot stand in for blocker refs; it supplements them.
            - `closedByMode = not_closed` is mandatory whenever `decision = defer`.
