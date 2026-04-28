# Phase 8 Transcript And Artifact Pipeline Spec

Task: `par_407_phase8_track_backend_build_audio_transcript_and_artifact_normalization_pipeline`

## Runtime Boundary

The transcript pipeline is implemented in `packages/domains/assistive_transcript`. It owns audio capture session refs, transcript job orchestration, immutable derivation packages, transcript artifacts, redaction spans, concept spans, retention envelopes, and transcript presentation artifacts.

The runtime stores refs and hashes. Routine service commands must not carry raw transcript text or expose raw blob URLs. Downstream drafting receives `TranscriptArtifact` refs only after permission, derivation, redaction, and retention posture are settled.

## Owned Services

- `AudioCaptureSessionService` validates source type, capture mode, permission state, retention policy, artifact refs, quarantine state, and ambient-capture gates.
- `TranscriptJobOrchestrator` schedules and starts transcript jobs only after quarantine has been cleared and permission allows processing.
- `TranscriptNormalizationPipeline` creates immutable `EvidenceDerivationPackage` rows, speaker segments, transcript artifacts, and explicit quarantine outcomes for low-quality audio or failed diarisation.
- `TranscriptArtifactService` records frozen-evidence references and emits downstream readiness events only after redaction and derivation are settled.
- `TranscriptRedactionService` creates typed redaction spans and rejects raw transcript text in routine commands.
- `ClinicalConceptSpanExtractor` creates typed concept spans attached to source speaker segments.
- `RetentionEnvelopeService` materializes retention basis, delete schedule, review cadence, legal-hold and freeze blockers, and deletion decisions.
- `TranscriptPresentationArtifactService` creates summary-first presentation artifacts and blocks raw blob URLs, detached direct downloads, or ungranted external handoff.

All mutating APIs require `TranscriptActorContext` and emit `TranscriptAuditRecord` rows.

## Supported Input Order

The first release uses the conservative source order from Phase 8C:

1. telephony recordings already captured by earlier phases
2. uploaded audio artifacts
3. clinician dictation clips
4. live ambient capture only when manual-start, tenant policy, explicit local governance, and explicit permission are all present

`automatic_ambient` is blocked for the first release.

## Permission And Quarantine

`AudioCaptureSession` records `sourceType`, `captureMode`, `permissionState`, `permissionEvidenceRef`, `retentionPolicyRef`, and `artifactRef`. Permission states `objected`, `withdrawn`, `blocked`, and `policy_pending` fail closed.

Every session starts in `artifactQuarantineState = quarantined`. A transcript job cannot be scheduled until `releaseQuarantine` attaches a clean scan ref, a source capture bundle ref, and an active retention envelope.

## Transcript Derivation

`TranscriptNormalizationPipeline` requires:

- active transcript job
- raw transcript ref, not raw text
- speaker segments with source text refs
- model version ref and transcript policy ref from the job
- diarisation mode, language mode, audio quality state, and normalization version ref

The pipeline creates one immutable `EvidenceDerivationPackage` and one `TranscriptArtifact`. Reruns, corrections, diarisation changes, or policy changes create a new derivation package and supersede the previous artifact without changing the old package. Frozen evidence snapshot refs remain attached to the old artifact for replay and provenance.

Low-quality audio, unsupported audio, or failed diarisation creates a quarantined transcript artifact rather than a successful artifact with hidden uncertainty.

## Redaction And Concepts

`ClinicalConceptSpan` and `RedactionSpan` records remain typed and source-segment attributable. Routine APIs accept refs and offsets only; raw transcript text is rejected to avoid accidental PHI leakage through logs or telemetry.

Redaction must be `settled` or `not_required` before a transcript artifact can become ready for drafting.

## Retention

`RetentionEnvelope` is required before quarantine release and before transcript processing. The retention service evaluates deletion schedules and blocks deletion when a legal hold, retention freeze, or policy conflict is active.

Derived transcript artifacts are treated as dependent artifacts with source lineage, not as standalone long-lived records. Any future retention compaction must check the envelope rather than inferring by storage path.

## Presentation Artifacts

`TranscriptPresentationArtifact` is the only governed preview/export/handoff record for transcripts. The default state is `summary_only`. External handoff requires an `outboundNavigationGrantPolicyRef`; raw blob URLs and direct download URLs are blocked.

Permission drift, redaction failure, or quarantined transcript state downgrades presentation to `recovery_only` unless a hard blocker requires `blocked`.

## Downstream Events

`TranscriptArtifactService.markReadyForDrafting` emits:

- `assistive.transcript.ready`
- `assistive.context.snapshot.created`

Events are emitted only when the transcript artifact is normalized, the derivation package is immutable, permission still allows use, and redaction is settled. Event payloads store hashes rather than raw transcript or PHI-bearing text.
