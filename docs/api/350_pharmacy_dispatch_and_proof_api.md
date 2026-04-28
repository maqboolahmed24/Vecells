# 350 Pharmacy Dispatch And Proof API

The Phase 6 dispatch service is exported from `packages/domains/pharmacy/src/index.ts`.

## Store factories

- `createPhase6PharmacyDispatchStore()`
- `createPhase6PharmacyDispatchService(...)`
- `createDeterministicPharmacyDispatchAdapter(...)`

## Commands

### `planDispatch(input)`

Compiles:

- `TransportAssuranceProfile`
- `DispatchAdapterBinding`
- `ReferralArtifactManifest`
- `PharmacyDispatchPayload`
- `PharmacyDispatchPlan`

Required inputs:

- `pharmacyCaseId`
- `routeIntentBindingRef`
- `canonicalObjectDescriptorRef`
- `governingObjectVersionRef`
- `recordedAt`
- optional `packageId`
- optional `transportMode`

### `submitDispatch(input)`

Compiles the current plan, binds or reuses the current live attempt family, sends through the chosen adapter, records the initial receipt checkpoint, and refreshes proof, settlement, continuity, and truth.

Additional required inputs:

- `actorRef`
- `commandActionRecordRef`
- `commandSettlementRecordRef`
- `leaseRef`
- `expectedOwnershipEpoch`
- `expectedLineageFenceRef`
- `scopedMutationGateRef`
- `reasonCode`
- optional `sourceCommandId`
- optional `transportCorrelationId`

### `resendDispatch(input)`

Uses the same contract as `submitDispatch`, plus optional `dispatchAttemptId`, but preserves the same governed attempt family when the tuple is unchanged.

### `ingestReceiptEvidence(input)`

Adds evidence into one of four lanes:

- `transport_acceptance`
- `provider_acceptance`
- `delivery`
- `authoritative`

Important fields:

- `dispatchAttemptId`
- `lane`
- `sourceClass`
- `recordedAt`
- `rawEvidence`
- `semanticEvidence`
- optional `transportMessageId`
- optional `orderingKey`
- optional `proofRef`
- optional `sourceCorrelationRef`
- optional `polarity`
- optional `logLikelihoodWeight`
- optional `satisfiesHardMatchRefs`
- optional `failsHardMatchRefs`
- optional `contradictory`

### `markDispatchContradiction(input)`

Convenience wrapper for negative authoritative evidence.

### `recordManualDispatchAssistance(input)`

Persists `ManualDispatchAssistanceRecord` and, when attested, emits the manual evidence needed for the manual-assisted profile to satisfy current proof.

### `expireStaleAttempts({ now })`

Sweeps current pending attempts whose proof deadline has elapsed and rebuilds their settlement and truth as fail-closed recovery posture.

### `getCurrentDispatchTruth(pharmacyCaseId)`

Returns the current `PharmacyDispatchBundle` or `null`.

## Primary snapshots

- `TransportAssuranceProfileSnapshot`
- `DispatchAdapterBindingSnapshot`
- `ReferralArtifactManifestSnapshot`
- `PharmacyDispatchPlanSnapshot`
- `PharmacyDispatchAttemptSnapshot`
- `DispatchEvidenceObservationSnapshot`
- `DispatchProofEnvelopeSnapshot`
- `ManualDispatchAssistanceRecordSnapshot`
- `PharmacyContinuityEvidenceProjectionSnapshot`
- `PharmacyDispatchSettlementSnapshot`
- `PharmacyDispatchTruthProjectionSnapshot`

## Truth contract

- calm referral truth requires authoritative proof for the current attempt
- `transportAcceptanceState` and `providerAcceptanceState` are informative but not sufficient
- settlement result is one of:
  - `live_referral_confirmed`
  - `pending_ack`
  - `stale_choice_or_consent`
  - `denied_scope`
  - `reconciliation_required`
