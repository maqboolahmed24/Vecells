import { describe, expect, it } from "vitest";
import {
  createAssistiveTranscriptPlane,
  type CreateAudioCaptureSessionCommand,
  type TranscriptActorContext,
  type TranscriptActorRole,
} from "../../packages/domains/assistive_transcript/src/index.ts";

const fixedClock = { now: () => "2026-04-27T13:00:00.000Z" };

function actor(actorRole: TranscriptActorRole): TranscriptActorContext {
  return {
    actorRef: `actor:${actorRole}`,
    actorRole,
    purposeOfUse: "phase8_transcript_derivation_test",
    routeIntentBindingRef: "route-intent:transcript-pipeline",
    auditCorrelationId: `audit:${actorRole}`,
  };
}

function captureCommand(overrides: Partial<CreateAudioCaptureSessionCommand> = {}): CreateAudioCaptureSessionCommand {
  return {
    sourceType: "uploaded_audio_artifact",
    captureMode: "uploaded_artifact",
    permissionState: "informed",
    permissionEvidenceRef: "permission:upload:informed",
    retentionPolicyRef: "retention-policy:audio-transcript:v1",
    artifactRef: "audio-artifact:upload:001",
    ...overrides,
  };
}

describe("407 transcript job and derivation immutability", () => {
  it("appends a new derivation package for corrections instead of overwriting frozen artifacts", () => {
    const plane = createAssistiveTranscriptPlane({ clock: fixedClock });
    const capture = createClearedCapture(plane);
    const jobA = plane.transcriptJobs.scheduleTranscriptJob(
      {
        audioCaptureSessionRef: capture.audioCaptureSessionId,
        diarisationMode: "multi_speaker",
        languageMode: "english_uk",
        modelVersionRef: "transcript-model:v1",
        transcriptModelPolicyRef: "transcript-policy:v1",
      },
      actor("transcript_pipeline_worker"),
    );
    const artifactA = completeJob(plane, jobA.transcriptJobId, "raw-transcript:001");
    const frozen = plane.transcriptArtifacts.markReferencedByFrozenEvidence(
      artifactA.transcriptArtifactId,
      "evidence-snapshot:frozen:001",
      actor("clinical_safety_lead"),
    );

    const jobB = plane.transcriptJobs.scheduleTranscriptJob(
      {
        audioCaptureSessionRef: capture.audioCaptureSessionId,
        diarisationMode: "multi_speaker",
        languageMode: "english_uk",
        modelVersionRef: "transcript-model:v1",
        transcriptModelPolicyRef: "transcript-policy:v1",
        supersedesTranscriptArtifactRef: artifactA.transcriptArtifactId,
      },
      actor("transcript_pipeline_worker"),
    );
    const artifactB = completeJob(plane, jobB.transcriptJobId, "raw-transcript:corrected:001");

    const original = plane.store.transcriptArtifacts.get(artifactA.transcriptArtifactId);
    const derivationA = plane.store.derivationPackages.get(frozen.derivationPackageRef);
    const derivationB = plane.store.derivationPackages.get(artifactB.derivationPackageRef);

    expect(original?.artifactState).toBe("superseded");
    expect(original?.referencedByFrozenEvidenceSnapshotRefs).toContain("evidence-snapshot:frozen:001");
    expect(derivationA?.immutabilityState).toBe("immutable");
    expect(derivationB?.supersedesDerivationPackageRef).toBe(derivationA?.derivationPackageId);
    expect(artifactB.transcriptArtifactId).not.toBe(artifactA.transcriptArtifactId);
  });

  it("quarantines low-quality or failed diarisation outputs instead of silently succeeding", () => {
    const plane = createAssistiveTranscriptPlane({ clock: fixedClock });
    const capture = createClearedCapture(plane);
    const job = plane.transcriptJobs.scheduleTranscriptJob(
      {
        audioCaptureSessionRef: capture.audioCaptureSessionId,
        diarisationMode: "multi_speaker",
        languageMode: "english_second_language",
        modelVersionRef: "transcript-model:v1",
        transcriptModelPolicyRef: "transcript-policy:v1",
      },
      actor("transcript_pipeline_worker"),
    );
    const artifact = plane.normalization.completeTranscriptJob(
      {
        transcriptJobId: job.transcriptJobId,
        rawTranscriptRef: "raw-transcript:low-quality:001",
        speakerSegments: [
          {
            speakerLabel: "unknown",
            startMs: 0,
            endMs: 1000,
            textRef: "segment-text:low-quality:001",
            confidence: 0.32,
          },
        ],
        confidenceSummary: "low quality audio, speaker allocation failed",
        audioQualityState: "low_quality",
        diarisationUncertaintyState: "failed",
        normalizationVersionRef: "normalization:v1",
      },
      actor("transcript_pipeline_worker"),
    );

    expect(artifact.artifactState).toBe("quarantined");
    expect(plane.store.transcriptJobs.get(job.transcriptJobId)?.status).toBe("quarantined");
  });
});

function createClearedCapture(plane: ReturnType<typeof createAssistiveTranscriptPlane>) {
  const capture = plane.audioCaptureSessions.createSession(captureCommand(), actor("audio_capture_worker"));
  const retention = plane.retention.createRetentionEnvelope(
    {
      artifactType: "audio_capture",
      artifactRef: capture.artifactRef,
      retentionBasis: "individual_care_review_and_audit",
      deleteAfter: "2026-05-27T13:00:00.000Z",
      reviewSchedule: "P14D",
    },
    actor("retention_policy_engine"),
  );
  plane.audioCaptureSessions.attachRetentionEnvelope(capture.audioCaptureSessionId, retention.retentionEnvelopeId, actor("retention_policy_engine"));
  return plane.audioCaptureSessions.releaseQuarantine(
    {
      audioCaptureSessionId: capture.audioCaptureSessionId,
      sourceCaptureBundleRef: "evidence-capture-bundle:upload:001",
      malwareScanRef: "malware-scan:clean:upload:001",
    },
    actor("transcript_pipeline_worker"),
  );
}

function completeJob(plane: ReturnType<typeof createAssistiveTranscriptPlane>, transcriptJobId: string, rawTranscriptRef: string) {
  return plane.normalization.completeTranscriptJob(
    {
      transcriptJobId,
      rawTranscriptRef,
      speakerSegments: [
        {
          speakerLabel: "clinician",
          startMs: 0,
          endMs: 1400,
          textRef: `${rawTranscriptRef}:segment:001`,
          confidence: 0.93,
        },
      ],
      confidenceSummary: "clear audio, speaker allocation complete",
      audioQualityState: "clear",
      diarisationUncertaintyState: "complete",
      normalizationVersionRef: "normalization:v1",
    },
    actor("transcript_pipeline_worker"),
  );
}
