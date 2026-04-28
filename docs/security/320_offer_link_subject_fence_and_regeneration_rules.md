# 320 Offer Link Subject Fence And Regeneration Rules

## Security posture

`320` closes three specific gaps:

1. stale offer links can no longer rely on browser state
2. wrong-patient selection is blocked by backend fences, not page copy
3. callback cannot disguise itself as a ranked slot choice

## Canonical secure-link authority

Patient offer links are issued only through the canonical identity-access grant system.

Use case:

- `network_alternative_choice`

Grant properties inherited from Phase 0:

- single-purpose `alternative_offer` scope
- request-lineage bounded
- hard-subject binding
- short expiry
- explicit replay and supersession handling

## Required live mutation fence

Before live accept, decline, or callback mutation, the engine compares the presented tuple with the current session and truth:

- `subjectRef`
- `sessionEpochRef`
- `subjectBindingVersionRef`
- `manifestVersionRef`
- `releaseApprovalFreezeRef`
- `channelReleaseFreezeState`
- `offerFenceEpoch`
- `visibleOfferSetHash`
- `truthTupleHash`
- `experienceContinuityEvidenceRef`

Optional publication refs are also checked when provided:

- `surfacePublicationRef`
- `runtimePublicationBundleRef`

## Failure posture

When any part of the fence drifts:

- the mutation is blocked
- the current session is preserved as provenance
- `AlternativeOfferRegenerationSettlement` records the trigger class
- the truth projection moves to `read_only_provenance` or `fallback_only`

The engine does not silently swap the live set in place.

## Accept-specific law

An accept operation additionally requires:

- the selected entry still belongs to the active session
- the live candidate still exists in the active snapshot
- the candidate still has trusted patient-offerable posture
- `windowClass >= 1`
- reservation truth is still live when a reservation binding is supplied

Any failure keeps provenance and prevents selection from moving into commit flow.

## Callback law

Callback remains a separate fallback card with its own selection state and linkage posture.

The ranked set may become provenance, but callback never occupies a `rankOrdinal`.

Current 320 behavior stops at:

- `HubCoordinationCase.status = callback_transfer_pending`
- `HubOfferToConfirmationTruthProjection.fallbackLinkState = callback_pending_link`

Actual callback-domain linkage remains a later-owned seam in `323`.

## Regeneration classes

The engine currently supports:

- `expiry`
- `candidate_snapshot_superseded`
- `subject_binding_drift`
- `publication_drift`
- `embedded_drift`
- `continuity_drift`
- `callback_linkage_change`

Each regeneration event must leave an auditable settlement and a stale session that is visibly non-live.
