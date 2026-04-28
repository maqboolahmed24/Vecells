# 234 Duplicate Review Authority And Resolution Decisions

Task: `par_234`

This task publishes the Phase 3 duplicate-review authority on top of the canonical Phase 0 duplicate kernel. The implementation does not create a triage-local duplicate system. It reuses immutable `DuplicatePairEvidence`, canonical `DuplicateCluster`, and append-only `DuplicateResolutionDecision`, then adds the missing task-facing read model and invalidation layer required by Phase 3.

## Source alignment

- `blueprint/phase-0-the-foundation-protocol.md#1.7 DuplicateCluster`
- `blueprint/phase-0-the-foundation-protocol.md#1.7A DuplicatePairEvidence`
- `blueprint/phase-0-the-foundation-protocol.md#1.7B DuplicateResolutionDecision`
- `blueprint/phase-0-the-foundation-protocol.md#8.6 Review-required cluster handling`
- `blueprint/phase-3-the-human-checkpoint.md#3A. Triage contract and workspace state model`
- `blueprint/phase-3-the-human-checkpoint.md#3B. Deterministic queue engine, assignment, and fairness controls`
- `blueprint/phase-3-the-human-checkpoint.md#Command envelope rules`

## Canonical authority split

The runtime now keeps the three duplicate authorities separate in code and in APIs:

| Concern | Authority |
| --- | --- |
| exact or semantic replay | `IdempotencyRecord` |
| divergent same-fence replay | `ReplayCollisionReview` |
| explicit review work | `DuplicateCluster` |
| attach, link, retry-collapse, or separation settlement | `DuplicateResolutionDecision` |
| task-facing read model | `DuplicateReviewSnapshot` |

That closes the repository gap where replay, attach, and duplicate review could still look interchangeable.

## What landed

The backend now publishes:

- immutable `DuplicatePairEvidence`
- append-only `DuplicateResolutionDecision` with supersession
- task-scoped `DuplicateReviewSnapshot`
- append-only `DuplicateConsequenceInvalidationRecord`
- command-api query and resolve seams:
  - `GET /v1/workspace/tasks/{taskId}/duplicate-review`
  - `POST /internal/v1/workspace/tasks/{taskId}/duplicate-review/resolve`

`DuplicateReviewSnapshot` carries:

- the current `DuplicateCluster`
- current decision class and decision state
- candidate request refs and pair evidence refs
- the winning pair evidence and competing pair evidence refs
- continuity witness summary and witness requirement state
- queue relevance and workspace relevance
- explicit current invalidation burden

## same_request_attach remains strict

`same_request_attach` is still fail-closed.

The command path requires:

- the latest `DuplicateReviewSnapshot`
- one chosen `DuplicatePairEvidence`
- an explicit continuity witness when attach is requested
- canonical non-transitive validation against competing candidates

Pair score alone is never enough.

## Supersession and downstream invalidation

When duplicate truth changes, the new authority now emits explicit invalidation records instead of leaving downstream domains to infer staleness from prose or timing.

The current invalidation target set is:

- `endpoint_decision`
- `approval_checkpoint`
- `endpoint_outcome_preview`
- `booking_intent`
- `pharmacy_intent`
- `patient_offer_link`
- `analytics_join`
- `workspace_assumption`
- `reopen_assumption`
- `handoff_seed`

Each invalidation is keyed by the causing `DuplicateResolutionDecision`, points back to the superseded decision when present, and carries a stable `decisionSupersessionRecordRef` seam for later consequence tracks.

## Task and workspace effect

The command-api task seam now keeps duplicate review explicit:

- triage tasks retain `duplicateClusterRef`
- the current task snapshot stores `duplicateReviewSnapshotRef`
- the current task snapshot stores `duplicateResolutionDecisionRef`
- query refreshes the task-facing read model from canonical duplicate truth rather than queue adjacency

Queue and workspace consumers can now render duplicate review from `DuplicateReviewSnapshot` instead of inventing local merge assumptions.
