# Phase 7 Artifact Transport Controls

Track: `par_382`

## Byte Grant Boundary

`ArtifactByteGrant` is the only embedded byte-delivery authority. It is bound to the current artifact, route family, bridge capability matrix, embedded eligibility, selected anchor, return contract, manifest version, session epoch, subject binding, and continuity evidence.

## Payload Boundary

Route policy and bridge policy both constrain payload size. The effective ceiling is the lower of route `maxBytes` and `BridgeCapabilityMatrix.maxByteDownloadSize`. MIME type must be route-allowed before a grant is issued.

## Continuity Boundary

Grant issue and redemption fail closed on continuity drift, manifest mismatch, stale grant state, replay, subject mismatch, source unavailability, or route freeze. The fallback is a same-shell summary or governed recovery state, not a detached document page.

## Privacy Boundary

Telemetry hashes artifact and subject identifiers and records reason codes only. Raw bytes, raw filenames, raw tokens, NHS numbers, and PHI-bearing URLs are not stored in artifact telemetry.

## Failure Reasons

The service emits stable reason codes including:

- `capability_missing`
- `payload_too_large`
- `mime_type_blocked`
- `continuity_stale`
- `route_frozen`
- `subject_mismatch`
- `source_unavailable`
- `grant_expired`
- `grant_redeemed`
- `grant_tuple_mismatch`
