# 191 Transcript Readiness And Evidence Assessment Design

`TelephonyReadinessPipeline` turns governed recording evidence into clinically usable telephony evidence through append-only derivation, transcript-readiness, safety-fact, manual-review, and evidence-readiness records.

## Pipeline

1. `TranscriptJobContract` is enqueued only from governed recording refs and `DocumentReference` refs created by recording ingest.
2. The worker appends an `EvidenceDerivationPackage` for the transcript and structured fact extraction run. It stores artifact refs, digests, span refs, and output hashes, never raw transcript blobs.
3. `TelephonySafetyFacts` combines transcript-derived signals, keypad or IVR structured capture, operator supplements, contradiction flags, coverage gaps, and snippet refs.
4. `TelephonyTranscriptReadinessRecord` records transcript state, coverage, quality, contradiction posture, segment completeness, extraction completeness, and supersession lineage.
5. `TelephonyEvidenceReadinessAssessment` is the only promotion-gating authority for `awaiting_recording`, `awaiting_transcript`, `awaiting_structured_capture`, `urgent_live_only`, `manual_review_only`, `safety_usable`, and `unusable_terminal`.

## Readiness Authority

worker completion is not readiness. A transcript can be technically complete but still unusable if coverage is insufficient, quality is low, contradictions are unresolved, structured capture is missing, or urgent-live handling blocks routine promotion.

`safety_usable` requires:

- transcript state `ready`
- coverage class `clinically_sufficient`
- quality band `medium` or `high`
- complete segments
- complete extraction
- no unresolved contradictions
- no urgent-live-only posture

All other safety-material uncertainty fails closed to `manual_review_only`, `awaiting_*`, `urgent_live_only`, or `unusable_terminal`.

## Reruns And Corrections

Transcript reruns, manual transcription, and structured-capture corrections append a new job, derivation package, transcript-readiness record, and evidence-readiness assessment. Current projections choose the latest assessment by append order while old degraded or failed records remain auditable.
