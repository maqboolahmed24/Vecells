# 62 Submission And Lineage State Rules

- Task: `par_062`
- Captured on: `2026-04-12`
- Generated at: `2026-04-12T00:00:00+00:00`

## State Axes

| Subject | Values | Rule Note |
| --- | --- | --- |
| `SubmissionEnvelope.state` | `draft`, `evidence_pending`, `ready_to_promote`, `promoted`, `abandoned`, `expired` | Only SubmissionEnvelope carries pre-submit capture and promotion readiness. |
| `Request.workflowState` | `submitted`, `intake_normalized`, `triage_ready`, `triage_active`, `handoff_active`, `outcome_recorded`, `closed` | Workflow remains orthogonal to safetyState and identityState. |
| `Request.safetyState` | `not_screened`, `screen_clear`, `residual_risk_flagged`, `urgent_diversion_required`, `urgent_diverted` | Safety posture cannot be flattened into workflow milestones. |
| `Request.identityState` | `anonymous`, `partial_match`, `matched`, `claimed` | patientRef is permitted only once matched or claimed binding settles. |
| `RequestLineage.branchClass` | `primary_submission`, `same_request_continuation`, `same_episode_branch`, `related_episode_branch` | Branch decisions are explicit and only required for non-continuation branching. |
| `RequestLineage.lineageState` | `active`, `closure_pending`, `closed`, `superseded` | Lineage tracks continuity status, not request workflow truth. |
| `LineageCaseLink.ownershipState` | `proposed`, `acknowledged`, `active`, `returned`, `closed`, `superseded`, `compensated` | Child links expose ownership and blocker facts without taking over request workflow. |
| `Episode.state` | `open`, `resolved`, `archived` | Episode anchors request membership and identity-bound patient linkage. |

## Promotion Law

- `SubmissionEnvelope` may only cross into `promoted` from `ready_to_promote`.
- Promotion replay is legal only when the existing promoted request and promotion record refs match exactly.
- `Request` begins at `submitted`; it never acts as a draft or partial-capture container.

## Lineage And Branching Law

- Primary lineages must carry `continuityWitnessClass=envelope_promotion` and no `branchDecisionRef`.
- Same-request continuation reuses the current lineage and records continuity witness updates.
- Same-episode and related-episode branches require explicit `branchDecisionRef`; related-episode branching must target a distinct episode.

## Child-Case Ownership Law

- `LineageCaseLink` can carry milestones, blockers, confirmation gates, returns, supersessions, and compensations.
- `LineageCaseLink` may only refresh request and lineage summaries; it cannot write canonical request workflow or closure truth directly.

## Identity Law

- `Request.patientRef` and `Episode.patientRef` may remain null indefinitely until explicit identity binding settles.
- When `patientRef` exists, the governing binding ref must also exist and the request identity state must be `matched` or `claimed`.

## Invariant Matrix

| Invariant Id | Scope | Rule | Enforcement |
| --- | --- | --- | --- |
| `INV_062_ENVELOPE_DRAFT_BOUNDARY` | SubmissionEnvelope | Draft capture, partial ingress, evidence snapshots, and normalized submission refs remain on SubmissionEnvelope until governed promotion settles. | `packages/domain-kernel/src/request-intake-backbone.ts::SubmissionEnvelopeAggregate` |
| `INV_062_REQUEST_NOT_DRAFT_STORE` | Request | Request never enters a draft state and begins at submitted with orthogonal workflow, safety, and identity axes. | `packages/domain-kernel/src/request-intake-backbone.ts::RequestAggregate.normalize` |
| `INV_062_PROMOTION_EXACTLY_ONCE` | SubmissionEnvelope -> Request + SubmissionPromotionRecord | Promotion from one envelope resolves to exactly one SubmissionPromotionRecord and exactly one Request, and replays return the same records. | `packages/domains/identity_access/src/submission-lineage-backbone.ts::SubmissionLineageCommandService.promoteEnvelope` |
| `INV_062_PRIMARY_LINEAGE_REQUIRES_PROMOTION_WITNESS` | RequestLineage | Primary RequestLineage roots require envelope-promotion witness and cannot carry branch decisions. | `packages/domain-kernel/src/request-intake-backbone.ts::RequestLineageAggregate.normalize` |
| `INV_062_CONTINUATION_REUSES_EXISTING_LINEAGE` | RequestLineage | Same-request continuation reuses the current lineage and records continuity witness updates instead of creating a new branch. | `packages/domain-kernel/src/request-intake-backbone.ts::RequestLineageAggregate.recordContinuation` |
| `INV_062_BRANCH_REQUIRES_DECISION` | RequestLineage | Same-episode and related-episode branches require explicit branchDecisionRef, and related-episode branches must target a distinct episode. | `packages/domain-kernel/src/request-intake-backbone.ts::RequestLineageAggregate.branch; packages/domains/identity_access/src/submission-lineage-backbone.ts::SubmissionLineageCommandService.branchRequestLineage` |
| `INV_062_REQUEST_PATIENT_REF_NULLABLE_UNTIL_BINDING` | Request | Request.patientRef may remain null and can derive only from currentIdentityBindingRef with matched or claimed identity state. | `packages/domain-kernel/src/request-intake-backbone.ts::RequestAggregate.normalize` |
| `INV_062_EPISODE_PATIENT_REF_NULLABLE_UNTIL_BINDING` | Episode | Episode.patientRef remains nullable until currentIdentityBindingRef exists and is explicitly bound. | `packages/domains/identity_access/src/submission-lineage-backbone.ts::EpisodeAggregate.normalize` |
| `INV_062_CHILD_LINK_CANNOT_WRITE_REQUEST_WORKFLOW` | LineageCaseLink -> Request | LineageCaseLink transitions may refresh request and lineage summaries, blockers, and confirmation refs but may not mutate canonical Request.workflowState directly. | `packages/domains/identity_access/src/submission-lineage-backbone.ts::SubmissionLineageCommandService.transitionLineageCaseLink` |
| `INV_062_LINEAGE_SUMMARY_TRACKS_ACTIVE_LINKS_ONLY` | Request + RequestLineage | Latest LineageCaseLink refs must either stay active or match the previously observed link while active-link summaries are monotonically refreshed. | `packages/domain-kernel/src/request-intake-backbone.ts::RequestAggregate.refreshLineageSummary; packages/domain-kernel/src/request-intake-backbone.ts::RequestLineageAggregate.updateSummary` |

## Parallel Interface Gaps

- `PARALLEL_INTERFACE_GAP_062_REQUEST_LINEAGE_BRANCHED_EVENT` keeps `request.lineage.branched` available to par_062 without depending on unpublished sibling-track internals.
- `PARALLEL_INTERFACE_GAP_062_REQUEST_LINEAGE_CASE_LINK_CHANGED_EVENT` keeps `request.lineage.case_link.changed` available to par_062 without depending on unpublished sibling-track internals.
