# 133 Domain Transition And Event Schema Compatibility

        This pack publishes one exact transition and schema-compatibility harness for the canonical request model, closure/blocker law, alias normalization, replay joins, and FHIR representation replay determinism.

        ## Summary

        - Suite verdict: `pass_with_bounded_gaps`
        - Transition rows: `219`
        - Schema rows: `28`
        - Alias normalization cases: `25`
        - FHIR replay cases: `4`

        ## Published Outputs

        | Path |
| --- |
| docs/tests/133_domain_transition_and_event_schema_compatibility.md |
| docs/tests/133_transition_matrix.md |
| docs/tests/133_schema_compatibility_matrix.md |
| docs/tests/133_transition_lab.html |
| data/test/domain_transition_matrix.csv |
| data/test/event_schema_compatibility_matrix.csv |
| data/test/event_alias_normalization_cases.json |
| data/test/fhir_representation_replay_cases.json |
| data/test/transition_suite_results.json |

        ## Transition Coverage

        | Canonical | Allowed | Forbidden | Gap | Authority |
| --- | --- | --- | --- | --- |
| SubmissionEnvelope.state | 5 | 25 | 0 | SubmissionEnvelopeAggregate |
| Request.workflowState | 7 | 35 | 0 | LifecycleCoordinator |
| Request.safetyState | 7 | 13 | 0 | SafetyOrchestrator |
| Request.identityState | 3 | 9 | 0 | IdentityBindingAuthority |
| DuplicateCluster.reviewStatus | 6 | 36 | 0 | DuplicateReviewCoordinator |
| FallbackReviewCase.patientVisibleState | 4 | 16 | 0 | FallbackReviewCoordinator |
| RequestClosureRecord.decision | 1 | 1 | 0 | LifecycleCoordinator |
| IdentityBinding.bindingState | 6 | 36 | 0 | IdentityBindingAuthority |

        ## Event Compatibility Coverage

        | Event | Family | Consumers | Alias Rules | Projection State |
| --- | --- | --- | --- | --- |
| request.workflow.changed | request | 0 | 0 | no_declared_projection_dispatch |
| request.safety.changed | request | 0 | 0 | no_declared_projection_dispatch |
| request.identity.changed | request | 0 | 0 | no_declared_projection_dispatch |
| request.closure_blockers.changed | request | 0 | 0 | no_declared_projection_dispatch |
| request.duplicate.review_required | request | 0 | 0 | no_declared_projection_dispatch |
| request.duplicate.attach_applied | request | 0 | 0 | no_declared_projection_dispatch |
| request.duplicate.retry_collapsed | request | 0 | 0 | no_declared_projection_dispatch |
| request.duplicate.resolved | request | 0 | 0 | no_declared_projection_dispatch |
| request.duplicate.separated | request | 0 | 0 | no_declared_projection_dispatch |
| exception.review_case.opened | exception | 1 | 1 | dispatch_rows_present |
| exception.review_case.recovered | exception | 0 | 1 | no_declared_projection_dispatch |
| identity.repair_case.opened | identity | 0 | 0 | no_declared_projection_dispatch |
| identity.repair_case.freeze_committed | identity | 2 | 0 | dispatch_rows_present |
| identity.repair_branch.quarantined | identity | 0 | 0 | no_declared_projection_dispatch |
| identity.repair_case.corrected | identity | 0 | 0 | no_declared_projection_dispatch |
| identity.repair_release.settled | identity | 2 | 0 | dispatch_rows_present |
| identity.repair_case.closed | identity | 0 | 0 | no_declared_projection_dispatch |
| confirmation.gate.created | confirmation | 0 | 1 | no_declared_projection_dispatch |
| confirmation.gate.confirmed | confirmation | 0 | 1 | no_declared_projection_dispatch |
| confirmation.gate.disputed | confirmation | 0 | 1 | no_declared_projection_dispatch |
| confirmation.gate.expired | confirmation | 0 | 1 | no_declared_projection_dispatch |
| confirmation.gate.cancelled | confirmation | 0 | 1 | no_declared_projection_dispatch |
| intake.promotion.settled | intake | 0 | 1 | no_declared_projection_dispatch |

        ## Bounded Gaps

        | Area | Gap Code | Subject |
| --- | --- | --- |
| transition | GAP_TRANSITION_OR_SCHEMA_REQUEST_CLOSURE_BLOCKER_SET | Request.closureBlockerSet materialized_non_empty -> materialized_empty |
| transition | GAP_TRANSITION_OR_SCHEMA_REPLAY_COLLISION_REVIEW_EXACT_REPLAY | ReplayCollisionReview.lifecycle ingress_received -> exact_replay_returned |
| transition | GAP_TRANSITION_OR_SCHEMA_REPLAY_COLLISION_REVIEW_SEMANTIC_REPLAY | ReplayCollisionReview.lifecycle ingress_received -> semantic_replay_returned |
| transition | GAP_TRANSITION_OR_SCHEMA_REPLAY_COLLISION_REVIEW_OPEN | ReplayCollisionReview.lifecycle ingress_received -> collision_review_open |
| transition | GAP_TRANSITION_OR_SCHEMA_REPLAY_COLLISION_REVIEW_CLOSE | ReplayCollisionReview.lifecycle collision_review_open -> settled_after_review |
| transition | GAP_TRANSITION_OR_SCHEMA_IDENTITY_REPAIR_OPEN_TO_FREEZE | IdentityRepairCase.state opened -> freeze_committed |
| transition | GAP_TRANSITION_OR_SCHEMA_IDENTITY_REPAIR_FREEZE_TO_QUARANTINED | IdentityRepairCase.state freeze_committed -> downstream_quarantined |
| transition | GAP_TRANSITION_OR_SCHEMA_IDENTITY_REPAIR_FREEZE_TO_CORRECTED | IdentityRepairCase.state freeze_committed -> corrected |
| transition | GAP_TRANSITION_OR_SCHEMA_IDENTITY_REPAIR_CORRECTED_TO_CLOSED | IdentityRepairCase.state corrected -> closed |
| schema | GAP_TRANSITION_OR_SCHEMA_INTAKE_PROMOTION_STARTED_UNPUBLISHED | intake.promotion.started |
| schema | GAP_TRANSITION_OR_SCHEMA_INTAKE_PROMOTION_COMMITTED_UNPUBLISHED | intake.promotion.committed |
| schema | GAP_TRANSITION_OR_SCHEMA_INTAKE_PROMOTION_REPLAY_RETURNED_UNPUBLISHED | intake.promotion.replay_returned |
| schema | GAP_TRANSITION_OR_SCHEMA_REQUEST_LINEAGE_BRANCH_EVENT_UNPUBLISHED | request.lineage.branched |
| schema | GAP_TRANSITION_OR_SCHEMA_REQUEST_LINEAGE_CASE_LINK_EVENT_UNPUBLISHED | request.lineage.case_link.changed |

        ## Source Precedence

        - `prompt/133.md`
- `prompt/shared_operating_contract_126_to_135.md`
- `prompt/AGENT.md`
- `prompt/checklist.md`
- `blueprint/phase-0-the-foundation-protocol.md#0B Mandatory Phase 0 tests`
- `blueprint/phase-cards.md#card-1-phase-0-the-foundation-protocol`
- `blueprint/phase-1-the-red-flag-gate.md#Replay duplicate and safety-preemption law`
- `blueprint/forensic-audit-findings.md#Finding 48`
- `blueprint/forensic-audit-findings.md#Finding 49`
- `blueprint/forensic-audit-findings.md#Finding 50`
- `blueprint/forensic-audit-findings.md#Finding 51`
- `blueprint/forensic-audit-findings.md#Finding 52`
- `blueprint/forensic-audit-findings.md#Finding 53`
- `blueprint/forensic-audit-findings.md#Finding 54`
- `blueprint/forensic-audit-findings.md#Finding 55`
- `blueprint/forensic-audit-findings.md#Finding 56`
- `blueprint/forensic-audit-findings.md#Finding 65`
- `blueprint/forensic-audit-findings.md#Finding 83`
- `blueprint/forensic-audit-findings.md#Finding 91`
- `data/analysis/state_transition_table.csv`
- `data/analysis/illegal_transitions.json`
- `data/analysis/request_lineage_transitions.json`
- `data/analysis/canonical_event_contracts.json`
- `data/analysis/canonical_event_schema_versions.json`
- `data/analysis/canonical_event_normalization_rules.json`
- `data/analysis/canonical_event_to_transport_mapping.json`
- `data/analysis/event_applier_dispatch_matrix.csv`
- `data/analysis/fhir_representation_contracts.json`
- `data/analysis/replay_classification_matrix.csv`
- `data/analysis/replay_collision_casebook.json`
- `data/analysis/closure_blocker_casebook.json`
- `data/analysis/identity_repair_casebook.json`
- `data/analysis/lifecycle_coordinator_casebook.json`
