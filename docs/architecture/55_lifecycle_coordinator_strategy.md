# 55 Lifecycle Coordinator Strategy

            ## Summary

            - Coordinator inputs: 16
            - Blocker categories: 12
            - Milestone signals: 18
            - Reopen trigger classes: 12
            - Verdict scenarios: 6

            `LifecycleCoordinator` is the sole cross-domain authority for canonical request closure and governed reopen. Child domains emit milestone, blocker, and settlement evidence only. Closure is legal only after the current lineage epoch, the materialized blocker sets, the command-following projections, and the terminal outcome all agree.

            ## Responsibilities

            | Responsibility | Rule |
| --- | --- |
| Sole closure authority | Only LifecycleCoordinator persists RequestClosureRecord and may set Request.workflowState = closed. |
| Deterministic partition | Closure and reopen run as an episodeId-partitioned deterministic state machine with current lineage epoch validation. |
| Blocker materialization | The coordinator alone materializes currentConfirmationGateRefs[] and currentClosureBlockerRefs[] from child-domain evidence. |
| One-way signal ingestion | Triage, booking, hub, pharmacy, communications, and support emit signals only; none may write canonical request closure directly. |
| Governed reopen | Reopen reacquires the governing lease under a fresh lineage epoch and persists defer before request.reopened. |

            ## Coordinator Inputs

            | Input | Object | Closure Field | Failure Effect |
| --- | --- | --- | --- |
| LCI_055_APPROVAL_AND_ACKNOWLEDGEMENT_GATES | ApprovalCheckpoint | blockingApprovalRefs[] | defer |
| LCI_055_COMMAND_FOLLOWING_PROJECTIONS | Command-following projection | derived check | defer |
| LCI_055_DEGRADED_PROMISES_AND_CONSENT | CurrentPromise or consent-pending dependency | blockingDegradedPromiseRefs[] | defer |
| LCI_055_DUPLICATE_CLUSTERS | DuplicateCluster | blockingDuplicateClusterRefs[] | defer |
| LCI_055_EPISODE_SIBLING_CLOSURE_POLICY | Episode closure policy | derived check | defer |
| LCI_055_EXTERNAL_CONFIRMATION_GATES | ExternalConfirmationGate | blockingConfirmationRefs[] | defer |
| LCI_055_FALLBACK_REVIEW_CASES | FallbackReviewCase | blockingFallbackCaseRefs[] | defer |
| LCI_055_IDENTITY_REPAIR_CASES | IdentityRepairCase | blockingIdentityRepairRefs[] | defer |
| LCI_055_LINEAGE_CASE_LINKS | LineageCaseLink | blockingLineageCaseLinkRefs[] | defer |
| LCI_055_PHI_BEARING_ACCESS_GRANTS | AccessGrant | blockingGrantRefs[] | defer |
| LCI_055_REACHABILITY_DEPENDENCIES | ReachabilityDependency | blockingReachabilityRefs[] | defer |
| LCI_055_RECONCILIATION_GATES | BookingCase or PharmacyOutcomeReconciliationGate | blockingReconciliationRefs[] | defer |
| LCI_055_REQUEST_LIFECYCLE_LEASES | RequestLifecycleLease | blockingLeaseRefs[] | defer |
| LCI_055_REQUIRED_ACKS_AND_CONSENT_DEPENDENCIES | PracticeAcknowledgementRecord or consent checkpoint | blockingApprovalRefs[];blockingDegradedPromiseRefs[] | defer |
| LCI_055_SAFETY_PREEMPTION_RECORDS | SafetyPreemptionRecord | blockingPreemptionRefs[] | defer |
| LCI_055_TERMINAL_OUTCOME_EVIDENCE | Outcome truth projection | derived check | defer |

            ## Closure Evaluation Order

            | Check | Order | Title | Defer Code |
| --- | --- | --- | --- |
| CHECK_055_01_LEASES_CLEAR | 1 | Leases clear | LEASE_ACTIVE_OR_BROKEN |
| CHECK_055_02_PREEMPTION_CLEAR | 2 | Safety preemption clear | SAFETY_PREEMPTION_OPEN |
| CHECK_055_03_APPROVALS_CLEAR | 3 | Approvals and confirmations clear | APPROVAL_OR_CONFIRMATION_PENDING |
| CHECK_055_04_OUTCOME_TRUTH_CLEAR | 4 | Outcome truth settled | OUTCOME_TRUTH_DISPUTED |
| CHECK_055_05_PHARMACY_RECONCILIATION_CLEAR | 5 | Pharmacy reconciliation clear | PHARMACY_RECONCILIATION_OPEN |
| CHECK_055_06_CASE_REPAIR_CLEAR | 6 | Repair and review clear | REPAIR_OR_REVIEW_OPEN |
| CHECK_055_07_REACHABILITY_CLEAR | 7 | Reachability clear | REACHABILITY_REPAIR_OPEN |
| CHECK_055_08_GRANTS_CLEAR | 8 | PHI grants clear | LIVE_PHI_GRANT_PRESENT |
| CHECK_055_09_MATERIALIZED_SETS_EMPTY | 9 | Materialized sets empty | MATERIALIZED_BLOCKERS_PRESENT |
| CHECK_055_10_LINEAGE_LINKS_SETTLED | 10 | Lineage links settled | LINEAGE_BRANCH_STILL_ACTIVE |
| CHECK_055_11_COMMAND_FOLLOWING_CONSUMED | 11 | Command-following projections consumed | COMMAND_FOLLOWING_PROJECTION_PENDING |
| CHECK_055_12_TERMINAL_OUTCOME_PRESENT | 12 | Terminal outcome present | TERMINAL_OUTCOME_MISSING |
| CHECK_055_13_EPISODE_POLICY_CLEAR | 13 | Episode policy clear | EPISODE_POLICY_UNSATISFIED |
| CHECK_055_14_REQUIRED_ACKS_HANDLED | 14 | Required acknowledgements handled | ACKNOWLEDGEMENT_REQUIRED |
| CHECK_055_15_CONSENT_AND_DEGRADED_CONFIRMATION_CLEAR | 15 | Consent and degraded confirmation clear | CONSENT_OR_DEGRADED_PROMISE_OPEN |

            ## One-Way Signal Law

            All milestone rows below are child-domain inputs to the coordinator. None may write `Request.workflowState = closed`; all close or defer outcomes are emitted through `request.close.evaluated`, `request.closed`, or `request.reopened`.

            | Signal | Domain | Candidate Milestone | Eligibility |
| --- | --- | --- | --- |
| MSIG_055_BOOKING_AMBIGUOUS | booking | handoff_active | defer_on_blocker |
| MSIG_055_BOOKING_CONFIRMATION_PENDING | booking | handoff_active | defer_on_blocker |
| MSIG_055_BOOKING_CONFIRMED | booking | outcome_recorded | close_candidate |
| MSIG_055_COMMUNICATION_CALLBACK_OUTCOME_RECORDED | communication | handoff_active | progress_only |
| MSIG_055_COMMUNICATION_COMMAND_SETTLED | communication | outcome_recorded | close_candidate |
| MSIG_055_HUB_CONFIRMATION_PENDING | hub_coordination | handoff_active | defer_on_blocker |
| MSIG_055_HUB_EXTERNALLY_CONFIRMED | hub_coordination | outcome_recorded | close_candidate |
| MSIG_055_HUB_PRACTICE_NOTIFIED | hub_coordination | handoff_active | defer_on_blocker |
| MSIG_055_PHARMACY_CASE_BOUNCE_BACK | pharmacy | triage_active | reopen_candidate |
| MSIG_055_PHARMACY_CASE_RESOLVED | pharmacy | outcome_recorded | close_candidate |
| MSIG_055_PHARMACY_DISPATCH_CONFIRMED | pharmacy | handoff_active | progress_only |
| MSIG_055_PHARMACY_OUTCOME_RECEIVED | pharmacy | handoff_active | progress_only |
| MSIG_055_SUPPORT_ACTION_SETTLED | support | handoff_active | progress_only |
| MSIG_055_SUPPORT_REPLAY_RESTORE_REQUIRED | support | handoff_active | defer_on_blocker |
| MSIG_055_SUPPORT_REPLAY_RESTORE_SETTLED | support | handoff_active | progress_only |
| MSIG_055_TRIAGE_CONTINUITY_UPDATED | triage | handoff_active | progress_only |
| MSIG_055_TRIAGE_SELFCARE_OR_ADMIN_OUTCOME_RECORDED | triage | outcome_recorded | close_candidate |
| MSIG_055_TRIAGE_TASK_SETTLED | triage | triage_active | progress_only |

            ## Gap Closures

            - Appointment or booking success no longer closes requests directly.
            - Closure is now a persisted coordinator decision, not a passive terminal.
            - Duplicate, fallback, identity-repair, PHI-grant, and reachability blockers are first-class persisted refs.
            - Confirmation-gate and closure-blocker changes consume the canonical event families from seq_048.
            - Child domains can no longer hide blocker meaning inside convenience workflow-state values.
