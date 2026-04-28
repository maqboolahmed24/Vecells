# 320 Alternative Offer Optimisation And Secure Choice Backend

`par_320` makes Phase 5 alternative offers executable instead of leaving them as a UI-side interpretation of the queue or candidate ranking layers.

## Authoritative runtime

The canonical implementation is [phase5-alternative-offer-engine.ts](/Users/test/Code/V/packages/domains/hub_coordination/src/phase5-alternative-offer-engine.ts).
It binds three previously separate truths into one backend flow:

1. `318` candidate truth:
   `NetworkCandidateSnapshot`, `CrossSiteDecisionPlan`, `CapacityRankProof`, and `CapacityRankExplanation`
2. `315` case truth:
   `HubCoordinationCase` transitions and active-offer pointers
3. Phase 0 access truth:
   canonical `AccessGrantService` issuance and redemption fences

The engine is the only lawful owner of:

- `AlternativeOfferOptimisationPlan`
- `AlternativeOfferSession`
- `AlternativeOfferEntry`
- `AlternativeOfferFallbackCard`
- `AlternativeOfferRegenerationSettlement`
- secure offer-link bindings
- structured read-back capture
- offer-side updates on `HubOfferToConfirmationTruthProjection`

## Solver rules

The patient-visible set is solved as an open-choice set, not a raw top-`K` truncation.

The current solver preserves:

- stable rank order from `CapacityRankProof`
- only `patientOfferableFrontierRefs` from `CrossSiteDecisionPlan`
- `windowClass >= 1`
- one live offer per `capacityUnitRef`
- diversity across `(siteId, localDayBucket, modality)` buckets before any fill pass
- callback as a separate fallback card, never as a ranked row

Every excluded candidate is persisted with a typed exclusion reason, so the visible set is explainable and replayable.

## Session and link model

Opening a session performs one governed backend transaction:

1. solve and persist `AlternativeOfferOptimisationPlan`
2. persist the session, entries, fallback card, and replay fixture
3. issue a `network_alternative_choice` access grant through the canonical identity-access service
4. persist `OfferSecureLinkBindingSnapshot`
5. create or refresh `HubOfferToConfirmationTruthProjection`
6. move the case to `alternatives_offered` or refresh pointers if the shell already owns an active offer state

Delivery then moves the case to `patient_choice_pending` and updates the truth projection to `offerState = patient_choice_pending`.

## Mutation guards

Every patient-side live mutation is fenced by:

- subject
- session epoch
- subject-binding version
- manifest version
- release approval freeze
- channel release state
- offer fence epoch
- visible offer-set hash
- current truth tuple hash
- continuity evidence

If any fence drifts, the engine fails closed and preserves provenance rather than applying a stale accept, decline, or callback request.

## Terminal choice paths

Accept:

- revalidates the chosen candidate against current snapshot truth and reservation truth
- updates the selected entry and session
- refreshes case pointers
- moves the case back to `coordinator_selecting`
- revokes the patient link so the stale route cannot mutate again

Decline:

- marks the ranked set declined
- degrades to callback-only if callback is legal
- otherwise moves the session to read-only provenance

Callback request:

- selects the separate fallback card
- preserves the ranked set as provenance
- moves the case to `callback_transfer_pending`
- leaves callback linkage completion to `323`

## Regeneration

Expiry and drift are handled by `AlternativeOfferRegenerationSettlement`.

The engine now preserves the stale session first, then publishes the replacement session. That ordering matters because it prevents a stale session from reasserting itself as the current truth during same-shell recovery.

Current supported trigger classes:

- `expiry`
- `candidate_snapshot_superseded`
- `subject_binding_drift`
- `publication_drift`
- `embedded_drift`
- `continuity_drift`
- `callback_linkage_change`

## Deferred seam

`320` intentionally stops at pending callback linkage. The later-owned linkage surface is frozen in:

- [PHASE5_BATCH_316_323_INTERFACE_GAP_OFFERS_CALLBACK_LINKAGE.json](/Users/test/Code/V/data/contracts/PHASE5_BATCH_316_323_INTERFACE_GAP_OFFERS_CALLBACK_LINKAGE.json)

That keeps `320` authoritative for patient choice while leaving the actual callback domain handoff to `323`.
