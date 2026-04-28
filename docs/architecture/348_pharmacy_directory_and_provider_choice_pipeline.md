# 348 Phase 6 Pharmacy Directory And Provider Choice Pipeline

## Scope

`par_348_phase6_track_backend_build_pharmacy_directory_abstraction_and_provider_choice_pipeline`
establishes the single backend law for pharmacy discovery, provider normalization, ranking,
warned-choice acknowledgement, and consent binding.

The runtime lives in
`/Users/test/Code/V/packages/domains/pharmacy/src/phase6-pharmacy-directory-choice-engine.ts`.

## Runtime shape

The engine owns:

- `PharmacyDiscoveryAdapter` and the typed adapter registry
- `PharmacyDirectorySourceSnapshot`
- `PharmacyDirectorySnapshot`
- `PharmacyProviderCapabilitySnapshot`
- `PharmacyProvider`
- `PharmacyChoiceProof`
- `PharmacyChoiceExplanation`
- `PharmacyChoiceDisclosurePolicy`
- `PharmacyChoiceOverrideAcknowledgement`
- `PharmacyChoiceSession`
- `PharmacyChoiceTruthProjection`
- `PharmacyConsentRecord`
- `PharmacyConsentCheckpoint`
- `PharmacyConsentRevocationRecord`

The service boundary is:

- `discoverProvidersForCase`
- `getChoiceTruth`
- `selectProvider`
- `acknowledgeWarnedChoice`
- `capturePharmacyConsent`
- `revokeOrSupersedeConsent`
- `refreshChoiceIfStale`

## Adapter and normalization law

The adapter family is first class and frozen to:

- `dohs_service_search`
- `eps_dos_legacy`
- `local_registry_override`
- `manual_directory_snapshot`

Each source execution persists:

- adapter mode and version
- request tuple hash
- raw response hash
- normalized source timestamp
- trust class
- freshness posture
- failure classification

Normalization groups records by canonical ODS code, ranks competing source rows by trust class and
staleness, and preserves conflict provenance instead of silently discarding disagreement.

## Ranking law

For each visible provider the engine computes:

- `serviceFitClass`
- `h_path`
- `t_ready`
- `delay_p`
- `timingBand`
- `h_timing`
- `h_travel`
- `h_access`
- `h_fresh`
- `recommendationScore`

Sorting is deterministic:

1. `timingBand` descending
2. `serviceFitClass` descending
3. `recommendationScore` descending
4. `displayName` ascending

`recommendedProviderRefs` are derived from the visible frontier only. No hidden top-`K` law exists.

## Consent and drift law

Selection binds to:

- `directorySnapshotRef`
- `choiceProofRef`
- `choiceDisclosurePolicyRef`
- `selectedProviderRef`
- `selectedProviderExplanationRef`
- `selectedProviderCapabilitySnapshotRef`
- `visibleChoiceSetHash`
- `selectionBindingHash`

Warned choice is explicit. If the selected explanation requires an override, downstream consent is
blocked until a `PharmacyChoiceOverrideAcknowledgement` is recorded.

`PharmacyConsentCheckpoint` is the only dispatch-readiness authority. Selection alone is never
treated as consent.

On material drift the engine:

- supersedes the granted consent record
- records a typed revocation row
- marks the checkpoint stale/superseded
- preserves the prior selected provider as provenance
- moves the choice session and projection into `recovery_required`

## Minor-illness guardrail gap

The current 347 evaluation family does not emit a dedicated
`timingGuardrailRef` for `minor_illness_fallback`. 348 closes the runtime gap by binding the most
conservative currently-compiled guardrail and publishing the temporary seam record in
`/Users/test/Code/V/data/contracts/PHASE6_BATCH_348_355_INTERFACE_GAP_MINOR_ILLNESS_GUARDRAIL.json`.
