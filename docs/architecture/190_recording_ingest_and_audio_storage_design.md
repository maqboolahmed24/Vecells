# 190 Recording Ingest And Audio Storage Design

`TelephonyRecordingIngestPipeline` owns the Phase 2 path from a provider `recording_available` event to governed audio evidence. It is intentionally separate from caller identity verification, transcript readiness, evidence readiness, continuation eligibility, and request promotion.

## Flow

1. `RecordingFetchJob` is scheduled from the canonical provider-neutral call-session event. The job records `callSessionRef`, `providerRecordingRef`, `canonicalEventRef`, retry state, current phase, quarantine assessment ref, governed object ref, `DocumentReference` ref, and terminal outcome.
2. The recording-fetch worker calls `ProviderRecordingAdapter.fetchRecording`. Provider URLs and raw provider asset bodies remain inside the adapter boundary and are not written to job records, projections, logs, or settlements.
3. Fetched bytes are written to a quarantine object and assessed by `RecordingAssetQuarantineAssessment`. The assessment records authenticity, checksum integrity, media type policy, size/duration policy, and malware or unreadable scan outcome.
4. Clean audio is promoted to `GovernedAudioObject` storage under `clinical_audio_evidence` retention, encrypted with audio key lineage, and deduplicated by `providerRecordingRef + contentDigest`.
5. `RecordingDocumentReferenceLink` creates or reuses an exact-once FHIR `DocumentReference` pointer. The only exposed URL is `artifact://recording-audio/{objectStorageRef}`.
6. `AudioIngestSettlement` emits the call-session event posture: `recording_available`, `manual_followup_requested`, or `recording_fetch_retry_scheduled`.

## State And Replay Rules

The worker is replay-safe at each phase. Duplicate provider callbacks return the existing `RecordingFetchJob`. Duplicate asset fetches reuse the governed object and the `DocumentReference`. If a governed object exists without a `DocumentReference`, `repairNoOrphanRecordingIngest` links it before returning `governed_audio_ready`.

The explicit no orphan rule is that governed audio must either have a `DocumentReference` link or be repaired before the worker returns a terminal success.

Blocked outcomes never create a governed object or `DocumentReference`. Missing, expired, corrupt, unsupported, over-limit, malware, unreadable, or provider-ref-mismatched assets settle to `recording_missing` or `manual_audio_review_required` with an open `TelephonyRecordingManualReviewDisposition`.

## Boundaries

The design reuses the existing object-storage plus `DocumentReference` evidence model used by intake attachments, but recording ingest has its own telephony-specific job and settlement tables. Recording availability does not imply transcript readiness or evidence readiness; prompt 191 consumes the `DocumentReference` later.
