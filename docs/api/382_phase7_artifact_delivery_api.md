# Phase 7 Artifact Delivery API

Track: `par_382`

## Internal Routes

`POST /internal/v1/nhs-app/artifacts:prepare-delivery`

Returns `BinaryArtifactDelivery`, optional `ArtifactByteGrant`, optional `EmbeddedErrorContract`, optional `ChannelDegradedMode`, and privacy-safe telemetry refs for one embedded artifact request.

`POST /internal/v1/nhs-app/artifact-byte-grants:redeem`

Redeems one single-use `ArtifactByteGrant` into an NHS App bridge-compatible byte payload. Redemption fails closed on expired, replayed, or tuple-mismatched grants.

`POST /internal/v1/nhs-app/artifacts:resolve-degraded-mode`

Builds the same-shell `ChannelDegradedMode` and `EmbeddedErrorContract` for an unsafe artifact action.

## Required Inputs

- `artifactId`
- `journeyPathId`
- `routeFamilyRef`
- `subjectRef`
- `selectedAnchorRef`
- `returnContractRef`
- `sessionEpochRef`
- `subjectBindingVersionRef`
- `continuityEvidenceRef`
- `BridgeCapabilityMatrix`
- `PatientEmbeddedNavEligibility`

## Response Postures

- `live`: byte grant issued and ready for bridge `downloadBytes`.
- `summary_only`: summary remains visible; bytes are suppressed.
- `deferred`: summary remains visible; safer send-later path is selected.
- `recovery_required`: route or continuity truth must refresh before bytes.
- `blocked`: subject or route-freeze law forbids the action.

## Telemetry

Telemetry records hash artifact and subject identifiers, include route family, manifest version, bridge matrix ref, posture, and reason codes, and never persist raw bytes, raw filenames, or PHI-bearing query material.
