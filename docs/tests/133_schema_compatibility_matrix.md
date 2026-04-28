# 133 Schema Compatibility Matrix

        Generated from the canonical event contract registry, schema-version catalog, normalization rules, transport mapping, and explicit gap seams.

        | Row | Event | Family | Compatibility | Consumers | Alias | Gap |
| --- | --- | --- | --- | --- | --- | --- |
| published_contract | confirmation.gate.cancelled | confirmation | additive_only | 0 | covered_by_rule |  |
| published_contract | confirmation.gate.confirmed | confirmation | new_version_required | 0 | covered_by_rule |  |
| published_contract | confirmation.gate.created | confirmation | additive_only | 0 | covered_by_rule |  |
| published_contract | confirmation.gate.disputed | confirmation | additive_only | 0 | covered_by_rule |  |
| published_contract | confirmation.gate.expired | confirmation | additive_only | 0 | covered_by_rule |  |
| published_contract | exception.review_case.opened | exception | additive_only | 1 | covered_by_rule |  |
| published_contract | exception.review_case.recovered | exception | additive_only | 0 | covered_by_rule |  |
| published_contract | identity.repair_branch.quarantined | identity | additive_only | 0 | not_required |  |
| published_contract | identity.repair_case.closed | identity | additive_only | 0 | not_required |  |
| published_contract | identity.repair_case.corrected | identity | additive_only | 0 | not_required |  |
| published_contract | identity.repair_case.freeze_committed | identity | additive_only | 2 | not_required |  |
| published_contract | identity.repair_case.opened | identity | additive_only | 0 | not_required |  |
| published_contract | identity.repair_release.settled | identity | new_version_required | 2 | not_required |  |
| published_contract | intake.promotion.settled | intake | new_version_required | 0 | covered_by_rule |  |
| published_contract | request.closure_blockers.changed | request | additive_only | 0 | not_required |  |
| published_contract | request.duplicate.attach_applied | request | additive_only | 0 | not_required |  |
| published_contract | request.duplicate.resolved | request | new_version_required | 0 | not_required |  |
| published_contract | request.duplicate.retry_collapsed | request | additive_only | 0 | not_required |  |
| published_contract | request.duplicate.review_required | request | additive_only | 0 | not_required |  |
| published_contract | request.duplicate.separated | request | additive_only | 0 | not_required |  |
| published_contract | request.identity.changed | request | additive_only | 0 | not_required |  |
| published_contract | request.safety.changed | request | additive_only | 0 | not_required |  |
| published_contract | request.workflow.changed | request | additive_only | 0 | not_required |  |
| gap_transition_or_schema | intake.promotion.committed | intake | source_implied_unpublished | 0 | gap | GAP_TRANSITION_OR_SCHEMA_INTAKE_PROMOTION_COMMITTED_UNPUBLISHED |
| gap_transition_or_schema | intake.promotion.replay_returned | intake | source_implied_unpublished | 0 | gap | GAP_TRANSITION_OR_SCHEMA_INTAKE_PROMOTION_REPLAY_RETURNED_UNPUBLISHED |
| gap_transition_or_schema | intake.promotion.started | intake | source_implied_unpublished | 0 | gap | GAP_TRANSITION_OR_SCHEMA_INTAKE_PROMOTION_STARTED_UNPUBLISHED |
| gap_transition_or_schema | request.lineage.branched | request | source_implied_unpublished | 0 | gap | GAP_TRANSITION_OR_SCHEMA_REQUEST_LINEAGE_BRANCH_EVENT_UNPUBLISHED |
| gap_transition_or_schema | request.lineage.case_link.changed | request | source_implied_unpublished | 0 | gap | GAP_TRANSITION_OR_SCHEMA_REQUEST_LINEAGE_CASE_LINK_EVENT_UNPUBLISHED |
