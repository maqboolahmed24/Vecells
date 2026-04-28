# 344 Phase 6 Return, Status, And Visibility API

The first executable API surface for 344 is blocker-first, minimum-necessary, and explicit about urgent return dominance.

## Return and reopen commands

| Operation | Route | Primary preconditions | Primary exits |
| --- | --- | --- | --- |
| recordPharmacyBounceBack | POST /v1/pharmacy/cases/{pharmacyCaseId}:record-bounce-back | Current lease and fence are valid.<br>Return evidence has been normalized and typed. | bounce-back record, case status update, reachability-plan refresh |
| refreshPharmacyReachabilityPlan | POST /v1/pharmacy/cases/{pharmacyCaseId}:refresh-reachability-plan | Current dependencies and route snapshot are resolvable. | reachability plan, repair posture, blocker refresh |
| settleBounceBackSupervisorReview | POST /v1/pharmacy/bounce-backs/{bounceBackRecordId}:settle-supervisor-review | Loop-risk or urgent review is open. | supervisor review settlement, auto-redispatch or auto-close gate update |

## Patient status and practice visibility queries

| Operation | Route | Primary preconditions | Primary exits |
| --- | --- | --- | --- |
| getPharmacyPatientStatus | GET /v1/pharmacy/cases/{pharmacyCaseId}/patient-status | Minimum-necessary patient audience is in scope. | patient status projection |
| refreshPharmacyPatientStatus | POST /v1/pharmacy/cases/{pharmacyCaseId}:refresh-patient-status | Authoritative truth projections and blockers are current. | patient status projection refresh |
| getPharmacyPracticeVisibility | GET /v1/pharmacy/cases/{pharmacyCaseId}/practice-visibility | Practice audience view is in scope. | practice visibility projection |
| refreshPharmacyPracticeVisibility | POST /v1/pharmacy/cases/{pharmacyCaseId}:refresh-practice-visibility | Minimum-necessary audience, blockers, and truth refs are current. | practice visibility projection refresh |

## Operations exception and projection surfaces

| Operation | Route | Primary preconditions | Primary exits |
| --- | --- | --- | --- |
| listPharmacyOperationsProjection | GET /v1/pharmacy/operations/projections/{projectionName} | Projection name is one of the frozen canonical names. | projection slice with deterministic queue semantics |
| raisePharmacyOperationsException | POST /v1/pharmacy/operations/exceptions:raise | Exception class is one of the frozen top-level classes. | operations exception work item |
| resolvePharmacyOperationsException | POST /v1/pharmacy/operations/exceptions/{exceptionId}:resolve | Exception exists and the required blocker or review state has actually settled. | exception resolution, projection refresh |

## Failure-class law

- urgent_return_direct_route_missing
- urgent_return_illegal_update_record_channel
- patient_status_macro_state_unknown
- completed_copy_while_blocked
- minimum_necessary_visibility_violation
- operations_exception_class_unknown
- reachability_repair_state_missing
- loop_risk_review_required
- identity_repair_freeze_active

## Idempotency and blocker rules

- Bounce-back record creation is idempotent on pharmacy case, normalized evidence hash, bounce-back type, and current lineage epoch.
- Patient status projection refresh is idempotent on the authoritative truth tuple and current blocker set.
- Practice visibility refresh is idempotent on the same truth tuple plus minimum-necessary audience view.
- Urgent return and reachability repair are blocker facts. They remain orthogonal to closure and may not be collapsed into fake calm states.
