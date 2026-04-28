# 190 Recording Fetch And Audio Reference Contract

## Routes

`POST /internal/telephony/call-sessions/{callSessionRef}/recordings/fetch-jobs`

Creates or replays a `RecordingFetchJobContract`. Required body fields are `providerRecordingRef`, `canonicalEventRef`, and an idempotency key. The response returns the durable job ref, phase, retry count, timeout posture, and any settled refs.

`POST /internal/telephony/recording-fetch-worker/drain`

Runs the recording-fetch worker for due jobs or a specified `recordingFetchJobRef`. The response is an `AudioIngestSettlementContract` list with `settlementOutcome`, `quarantineAssessmentRef`, `objectStorageRef`, `documentReferenceRef`, `noOrphanGuarantee`, and the call-session event posture.

`GET /internal/telephony/call-sessions/{callSessionRef}/recordings`

Returns the current `RecordingDocumentReferenceProjectionContract` for a provider recording. The projection includes `documentReferenceRef`, `documentReferenceLogicalId`, `representationSetRef`, `objectStorageRef`, checksum, media metadata, and an `artifact://` URL only.

## Contract Guarantees

`RecordingFetchJobContract` is idempotent by idempotency key and by `(callSessionRef, providerRecordingRef)`.

`RecordingAssetQuarantineAssessmentContract` is the authority for whether audio can leave quarantine. Clean assessment requires provider authenticity, checksum integrity when supplied, allowed media type, size and duration limits, and a clean scanner verdict.

`AudioIngestSettlementContract` is replay-safe. Terminal replays return the same settlement and `DocumentReference` ref.

`RecordingDocumentReferenceLinkContract` is exact-once. It is unique by `(callSessionRef, providerRecordingRef)` and by `objectStorageRef`, so governed audio cannot be orphaned from clinical representation.

## Non-Goals

These APIs do not produce transcripts, evidence readiness, continuation eligibility, or request promotion. They only establish that governed audio exists and can be referenced by downstream evidence workers.
