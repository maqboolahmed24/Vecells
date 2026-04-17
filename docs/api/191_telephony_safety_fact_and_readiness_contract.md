# 191 Telephony Safety Fact And Readiness Contract

## Routes

`POST /internal/telephony/call-sessions/{callSessionRef}/transcript-jobs`

Creates or replays a `TranscriptJobContract`. The request carries governed `recordingArtifactRef`, `audioIngestSettlementRef`, `recordingDocumentReferenceRef`, structured capture refs, urgent-live posture refs, and idempotency key.

`POST /internal/telephony/transcript-worker/drain`

Runs transcription and fact extraction for queued or running jobs. The response returns `TranscriptDerivationPackageContract`, `TelephonySafetyFacts`, `TelephonyTranscriptReadinessRecord`, and `TelephonyEvidenceReadinessAssessment` refs.

`GET /internal/telephony/call-sessions/{callSessionRef}/evidence-readiness`

Returns the latest `TelephonyEvidenceReadinessProjectionContract`. This projection is the only source a controller or later continuation worker may use for promotion gating.

`GET /internal/telephony/manual-audio-review`

Returns `ManualAudioReviewQueueEntryContract` records for transcript degradation, contradictions, urgent-live-only routine blockers, recording-missing handoff, or other manual audio review triggers.

## Contract Rules

Transcript jobs are derivation machinery. `TranscriptJobContract.jobState = succeeded` does not authorize promotion.

`TelephonyTranscriptReadinessRecord` is immutable and may be superseded only by a new record.

`TelephonySafetyFacts` contains normalized signal refs, contradiction flags, and snippet refs. Raw transcript text is not repeated in broad projections.

`TelephonyEvidenceReadinessAssessment` carries `promotionReadiness`, reason codes, governing input refs, and supersession refs. Only `usabilityState = safety_usable` with `promotionReadiness = ready_to_promote` may feed canonical intake convergence.
