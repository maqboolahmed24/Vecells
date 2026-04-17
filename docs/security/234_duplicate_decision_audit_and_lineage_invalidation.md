# 234 Duplicate Decision Audit And Lineage Invalidation

Task: `par_234`

This note records the security and audit posture for the Phase 3 duplicate-review authority.

## Append-only audit

`DuplicatePairEvidence` remains immutable.

`DuplicateResolutionDecision` remains append-only:

- previous decisions are superseded, not rewritten
- reversals preserve the original duplicate assumptions as provenance
- task-facing `DuplicateReviewSnapshot` is a projection, not the mutable source of truth

That keeps lineage-visible history intact for review, incident response, and later consequence recovery.

## same_request_attach requires strict proof

same_request_attach requires an explicit continuity witness.

The command path rejects attach when:

- `continuityWitnessClass = none`
- `continuityWitnessRef` is missing
- competing pair evidence remains near-equal
- hard blockers remain present

That prevents attach-on-score and keeps same-request continuation distinct from same-episode or related-episode linkage.

## Replay remains separate

Replay recognition still belongs to `IdempotencyRecord`.

Duplicate review settlement still belongs to `DuplicateResolutionDecision`.

The `DuplicateReviewSnapshot.authorityBoundary` now makes that split explicit in the read model so queue, workspace, and later endpoint work cannot silently collapse replay and duplicate truth into one shortcut.

## Downstream invalidation is explicit

When duplicate truth changes, the runtime emits explicit invalidation records for stale consequence rails.

The current invalidation burden can include:

- stale approvals
- stale endpoint previews
- stale booking seeds
- stale pharmacy seeds
- stale patient offers or links
- stale analytics joins
- stale workspace assumptions
- stale reopen and handoff assumptions

This is append-only and keyed to the causing `DuplicateResolutionDecision`, with a stable `decisionSupersessionRecordRef` seam so later endpoint, approval, and handoff tracks can consume it without object-name drift.

## Redaction and bounded disclosure

The task-facing read model does not expose raw feature vectors or unbounded narrative detail.

`DuplicateReviewSnapshot` exposes:

- request refs
- episode refs
- evidence refs
- witness summary refs
- stability and invalidation posture

It does not treat raw pairwise model internals as operator-facing authority.
