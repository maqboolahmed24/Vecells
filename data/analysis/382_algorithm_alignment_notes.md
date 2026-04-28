# Algorithm Alignment Notes For Track 382

## Local Blueprint Alignment

The implementation maps Phase 7 section 7F into executable backend contracts:

- `BinaryArtifactDelivery` carries delivery posture, payload metadata, byte grant ref, summary fallback, selected anchor, return contract, and delivery tuple hash.
- `ArtifactByteGrant` is short-lived, single-use, and bound to bridge, embedded eligibility, route, continuity, session, subject binding, manifest, selected anchor, and return truth.
- `EmbeddedErrorContract` converts unsafe file actions into same-shell patient guidance.
- `ChannelDegradedMode` narrows the existing patient degraded-mode posture without creating an NHS App-only route fork.

## Laws Preserved

- summary-first artifact presentation is mandatory.
- Byte delivery requires current bridge capability, embedded eligibility, continuity, route, MIME, payload, and subject truth.
- Oversized or unsupported artifacts degrade before probing browser behavior.
- Route freeze, subject mismatch, manifest drift, and stale continuity fail closed.
- Telemetry is privacy-safe and machine-readable.

## Upstream Consumption

The service consumes:

- `BridgeCapabilityMatrix` and `PatientEmbeddedNavEligibility` from `par_381`
- manifest version and release freeze refs from `par_377`
- route and continuity laws from Phase 0 and Phase 7

No alternate artifact, download, print, or detached recovery model is introduced.
