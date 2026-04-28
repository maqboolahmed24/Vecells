# 320 Alternative Offer And Patient Choice API

The executable API is exposed from [phase5-alternative-offer-engine.ts](/Users/test/Code/V/packages/domains/hub_coordination/src/phase5-alternative-offer-engine.ts).

## Primary service

`createPhase5AlternativeOfferEngineService(...)`

Dependencies:

- `Phase5AlternativeOfferEngineRepositories`
- `Phase5HubCaseKernelService`
- `Phase5NetworkCapacityPipelineRepositories`
- `IdentityAccessDependencies`

## Authoritative commands

### `createOfferOptimisationPlan`

Input:

- `hubCoordinationCaseId`
- `recordedAt`
- optional `maxOfferCount`

Output:

- current `HubCaseBundle`
- `NetworkCandidateSnapshot`
- `CrossSiteDecisionPlan`
- `CapacityRankProof`
- persisted `AlternativeOfferOptimisationPlan`

### `openAlternativeOfferSession`

Required inputs:

- current case id and command metadata
- subject and subject-binding version
- session epoch
- route/publication/runtime bundle refs
- release freeze refs
- continuity evidence
- visibility envelope version

Output:

- persisted `AlternativeOfferSession`
- ranked `AlternativeOfferEntry[]`
- optional `AlternativeOfferFallbackCard`
- `OfferSecureLinkBindingSnapshot`
- `HubOfferToConfirmationTruthProjection`
- case transition to `alternatives_offered` or pointer refresh
- materialized secure token for patient delivery

### `deliverAlternativeOfferSession`

Moves the case to `patient_choice_pending` and updates the truth projection to live patient-choice posture.

### `redeemAlternativeOfferLink`

Checks:

- canonical access-grant scope
- current offer fence tuple
- current truth tuple

Returns:

- redemption result
- current actionability posture
- reason codes when the route must fail closed

### `acceptAlternativeOfferEntry`

Checks:

- current mutation fence
- entry still belongs to the active session
- candidate still exists in the live snapshot
- candidate still has trusted patient-offerable posture
- reservation binding is not released or expired when supplied

Effects:

- marks one entry selected
- preserves the remainder as provenance
- updates `selectedCandidateRef`
- refreshes truth projection
- transitions the case to `coordinator_selecting`

### `declineAlternativeOffers`

Marks ranked entries declined and either:

- degrades to callback-only, or
- preserves read-only provenance

### `requestCallbackFromAlternativeOffer`

Selects the separate callback fallback card and moves the case to `callback_transfer_pending`.

This endpoint does not complete callback linkage; that later-owned handoff is deferred to `323`.

### `captureStructuredReadBack`

Persists a structured read-back artifact and then dispatches to one of:

- accept
- decline
- callback request

### `regenerateAlternativeOfferSession`

Creates `AlternativeOfferRegenerationSettlement`, preserves the stale session, and publishes a replacement session in-shell.

### `queryCurrentTruthProjection`

Returns the current `HubOfferToConfirmationTruthProjection` for a case.

### `replayAlternativeOfferSession`

Re-runs the solver from the stored replay fixture and checks:

- visible candidate refs
- represented bucket keys
- offer-set hash

## Stable snapshots

The runtime persists these 320-owned snapshots:

- `AlternativeOfferOptimisationPlanSnapshot`
- `AlternativeOfferSessionSnapshot`
- `AlternativeOfferEntrySnapshot`
- `AlternativeOfferFallbackCardSnapshot`
- `AlternativeOfferRegenerationSettlementSnapshot`
- `OfferSecureLinkBindingSnapshot`
- `AlternativeOfferSelectionEventSnapshot`
- `AlternativeOfferReadBackCaptureSnapshot`
- `AlternativeOfferReplayFixtureSnapshot`

## Case-state contract

The engine relies on the existing `315` state machine rather than creating a parallel one.

Current transitions exercised by 320:

- `candidates_ready -> alternatives_offered`
- `coordinator_selecting -> alternatives_offered`
- `alternatives_offered -> patient_choice_pending`
- `patient_choice_pending -> coordinator_selecting`
- `patient_choice_pending -> callback_transfer_pending`
