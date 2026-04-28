# Phase 7 Artifact Delivery And Degraded Mode

Track: `par_382`

## Purpose

`Phase7EmbeddedArtifactDeliveryAndDegradedModeService` is the backend authority for NHS App webview-safe document handling. It produces `BinaryArtifactDelivery`, `ArtifactByteGrant`, `EmbeddedErrorContract`, and `ChannelDegradedMode` records so embedded routes stay summary-first and never rely on ordinary browser download, browser print, raw blob links, or detached failure pages.

## Runtime Model

- `BinaryArtifactDelivery` describes one requested artifact action, its delivery posture, byte grant ref, payload metadata, summary fallback, selected anchor, return contract, and delivery tuple hash.
- `ArtifactByteGrant` is a single-use, short-lived byte-delivery grant bound to artifact, bridge matrix, embedded eligibility, selected anchor, return contract, session epoch, subject binding, continuity evidence, and manifest version.
- `EmbeddedErrorContract` turns blocked artifact actions into same-shell recovery copy with explicit machine-readable reasons.
- `ChannelDegradedMode` keeps the summary visible and selects `summary_only`, `secure_send_later`, `recovery_required`, or `blocked` behavior without inventing an NHS App-only route state.

## Delivery Law

Bytes are prepared only when all fences pass:

- artifact source is available
- subject binding matches the artifact owner
- route family and journey path match the artifact truth
- manifest version is current
- continuity evidence is current
- route freeze is not active
- MIME type is allowed for the route
- payload size is within both route policy and `BridgeCapabilityMatrix.maxByteDownloadSize`
- `PatientEmbeddedNavEligibility` is `live`
- `BridgeCapabilityMatrix` is `verified` and supports `downloadBytes`

Every failure still returns a patient-safe summary fallback and auditable reason such as `capability_missing`, `payload_too_large`, `continuity_stale`, `route_frozen`, `subject_mismatch`, or `source_unavailable`.

## Downstream Use

Frontend tasks must render the summary fallback and degraded-mode state from this service. They may pass redeemed bytes to the shared NHS App bridge wrapper, but they may not create raw download links, browser print buttons, or route-local error pages for embedded artifact actions.
