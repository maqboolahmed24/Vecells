# 151 Outcome Artifact And Navigation Contracts

The Phase 1 submit result surface is governed through object refs, not raw URLs or ad hoc route jumps.

The canonical grammar ref remains `OGC_151_PHASE1_OUTCOME_GRAMMAR_V1`.

## Artifact contract

Every authoritative outcome publishes one `IntakeOutcomePresentationArtifact` bound to:

- `ArtifactPresentationContract`
- `audienceSurfaceRuntimeBindingRef = ASRB_050_PATIENT_PUBLIC_ENTRY_V1`
- `surfacePublicationRef = ASPR_050_PATIENT_PUBLIC_ENTRY_V1`
- `runtimePublicationBundleRef = rpb::local::authoritative`
- `releasePublicationParityRef = rpp::local::authoritative`

The artifact keeps the stable copy grammar tuple:

- `copyDeckId`
- `copyVariantRef`
- `focusTarget`
- `primaryActionId`
- `secondaryActionId`
- `placeholderContractRef`
- `artifactState`

## Navigation grant law

Only `artifactState = external_handoff_ready` may mint `OutcomeNavigationGrant`.

- destination truth is scrubbed and governed
- continuity stays bound to `continuityKey`, `selectedAnchorRef`, and `returnTargetRef`
- the grant never bypasses route freeze or publication law
- later live telephony or embedded paths may add richer destinations, but they must preserve the same `OutboundNavigationGrant` semantics

## Receipt envelope law

`PatientReceiptConsistencyEnvelope` is the only receipt/ETA substrate this task publishes.

- routine receipt uses `promiseState = on_track`
- stale, failed-safe, and denied-scope recovery use `promiseState = recovery_required`
- later status work may refine this envelope, but it may not silently issue a calmer promise than the original authoritative tuple

## Replay law

For a replayed submit, the platform must return the same:

- `Phase1OutcomeTuple`
- `IntakeOutcomePresentationArtifact`
- `PatientReceiptConsistencyEnvelope` when present
- `OutcomeNavigationGrant` when present
- `UrgentDiversionSettlement` when present
