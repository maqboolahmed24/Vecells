# 148 Submission Promotion Transaction Design

`par_148` makes the Phase 1 submit boundary exact and durable.

## Canonical flow

1. Read the current `DraftContinuityEvidenceProjectionDocument`.
2. Resolve current route-intent and runtime/publication tuple inputs.
3. Evaluate submit readiness and compute raw plus semantic replay hashes.
4. Run replay classification before ordinary writable success is allowed.
5. For `new_lineage` or `collision_review`, freeze one immutable `SubmissionSnapshotFreeze`.
6. Persist `EvidenceCaptureBundle` and `EvidenceSnapshot`.
7. Materialize one `SubmitNormalizationSeed` as the bounded internal bridge for `par_149`.
8. On `new_lineage`, move the canonical `SubmissionEnvelope` through the durable `submitted` barrier, create `Request`, `RequestLineage`, and one immutable `SubmissionPromotionRecord`, then supersede active draft grants and leases in the same transaction.
9. Return one authoritative `IntakeSubmitSettlement` bound to `CommandActionRecord`, `CommandSettlementRecord`, and `TransitionEnvelope`.

## Exactness guarantees

- `withPromotionBoundary(...)` serializes competing submit attempts for the same lineage.
- Replay classification reuses the original authoritative settlement for `exact_replay` and `semantic_replay`.
- `collision_review` never silently dedupes or silently forks. It freezes immutable evidence and opens explicit review.
- No ordinary success path skips `Request.workflowState = submitted`.
- No request creation proceeds without one persisted `SubmissionPromotionRecord`.

## Bounded seam for downstream normalization

The immutable freeze happens before normalization. `par_148` persists `SubmitNormalizationSeed` and a canonical-normalization derivation package so the evidence backbone can mint `EvidenceSnapshot` now while `par_149` later owns richer canonical request normalization without weakening this submit boundary.

## Draft mutability supersession

Promotion supersedes:

- active draft-scoped access grants
- active `DraftSessionLease`s

This is part of the same transaction that commits request creation and settlement truth, so a promoted lineage cannot remain implicitly mutable.
