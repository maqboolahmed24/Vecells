# 393 Algorithm Alignment Notes

## Local Sources

- `blueprint/phase-7-inside-the-nhs-app.md`: 7D, 7E, and 7F require deep-link continuity, NHS App bridge behavior, webview limitations, file handling, and resilient error UX.
- `blueprint/phase-0-the-foundation-protocol.md`: `RouteFreezeDisposition` and `ArtifactPresentationContract` define route-freeze and artifact summary-first law.
- `blueprint/platform-frontend-blueprint.md`: route content must remain shell-aware and contract-backed.
- `blueprint/patient-portal-experience-architecture-blueprint.md`: artifact-frame law keeps summary first and return safe.
- `blueprint/patient-account-and-communications-blueprint.md`: patient-visible messaging must stay concise and channel-aware.
- Validated outputs from 380, 381, 382, 383, 385, and 387 through 392 provide the embedded services, bridge contracts, and route-family UI precedents.

## Mapping

`EmbeddedRecoveryTruth` maps patient-visible recovery state to:

- `ExternalEntryResolution`
- `SiteLinkManifest`
- `ChannelContextResolution`
- `PatientEmbeddedSessionProjection`
- `PatientEmbeddedNavEligibility`
- `RouteFreezeDisposition`

`EmbeddedArtifactTruth` maps artifact UI state to:

- `ArtifactPresentationContract`
- `ArtifactModeTruthProjection`
- `BridgeCapabilityMatrix`
- `PatientDegradedModeProjection`

## Gap Closure

- Generic browser errors are replaced by explicit same-shell recovery cards.
- Traditional download assumptions are replaced by summary, preview, progress, and fallback states.
- Route freeze and degraded mode are visible in-shell, with last-safe summary preserved.
- Deep-link recovery keeps the selected anchor and return contract visible.
- Recovery copy remains compact and dominated by one primary next step.

## Interface Gap

No additional gap artifact was required. The frontend can reconstruct the patient-visible surface family from the existing Phase 7 services and contracts without weakening access, artifact, freeze, or continuity law.
