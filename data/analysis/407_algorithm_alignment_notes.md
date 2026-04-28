# 407 Algorithm Alignment Notes

Task 407 implements the governed input pipeline for assistive documentation from Phase 8C.

## Local Source Alignment

- Phase 8C starts with telephony recordings, uploaded audio, clinician dictation clips, then optional live ambient capture behind tenant policy and explicit approval. `AudioCaptureSessionService` supports those source types and blocks `automatic_ambient`.
- Phase 8C requires strict permission and capture-mode validation. `AudioCaptureSession` records `sourceType`, `captureMode`, `permissionState`, `permissionEvidenceRef`, `retentionPolicyRef`, and `artifactRef`. Blocked, objected, withdrawn, and policy-pending states fail closed.
- Phase 8C says quarantine first, normalize second. New sessions start as `quarantined`; `TranscriptJobOrchestrator` refuses to schedule jobs until quarantine is cleared with a source capture bundle and retention envelope.
- Phase 8C requires immutable derivation chains. `TranscriptNormalizationPipeline` creates `EvidenceDerivationPackage` records with immutable hashes; reruns append a new package and supersede the previous artifact without overwriting frozen refs.
- Phase 8C requires diarisation uncertainty, concept extraction, and redaction span marking. `SpeakerSegment`, `ClinicalConceptSpan`, and `RedactionSpan` records are typed and source-segment attributable.
- Phase 8C requires retention envelopes and deletion scheduling. `RetentionEnvelopeService` stores retention basis, delete date, review schedule, legal hold, retention freeze, policy conflict, and deletion decisions.
- Phase 8C requires presentation artifacts instead of raw handoff. `TranscriptPresentationArtifactService` defaults to `summary_only`, blocks raw blob URLs and direct downloads, and requires an outbound navigation grant for external handoff.
- Task 406 provides evaluation-plane refs and shadow/evidence contracts. 407 outputs immutable transcript artifacts and `assistive.transcript.ready` / `assistive.context.snapshot.created` events for task 408, without reconstructing evaluation data.

## Conservative Interface Choices

- Raw transcript text is rejected by redaction, concept extraction, and normalization commands. The runtime accepts refs and segment offsets only.
- Live ambient capture requires manual-start mode, explicit permission, tenant policy, local governance approval, and an affirmative approval flag.
- Low-quality audio and failed diarisation produce quarantined transcript artifacts rather than successful artifacts with hidden uncertainty.
- Drafting readiness is not emitted until the transcript is normalized, redaction is settled, permission still allows use, and the derivation package is immutable.

## Acceptance Evidence

- `tests/unit/407_permission_retention_and_redaction_logic.spec.ts` covers permission gating, ambient capture blocking, quarantine, retention, and raw text rejection.
- `tests/integration/407_transcript_job_and_derivation_immutability.spec.ts` covers immutable derivation packages, correction reruns, frozen evidence preservation, and low-quality quarantine.
- `tests/integration/407_transcript_presentation_artifact_and_recovery.spec.ts` covers readiness events, summary-first presentation, raw blob blocking, outbound grant requirements, and permission-drift recovery.
