import { describe, expect, it } from "vitest";
import {
  createAssistiveTranscriptPlane,
  type CreateAudioCaptureSessionCommand,
  type TranscriptActorContext,
  type TranscriptActorRole,
} from "../../packages/domains/assistive_transcript/src/index.ts";

const fixedClock = { now: () => "2026-04-27T12:00:00.000Z" };

function actor(actorRole: TranscriptActorRole): TranscriptActorContext {
  return {
    actorRef: `actor:${actorRole}`,
    actorRole,
    purposeOfUse: "phase8_transcript_unit_test",
    routeIntentBindingRef: "route-intent:transcript-pipeline",
    auditCorrelationId: `audit:${actorRole}`,
  };
}

function baseCapture(overrides: Partial<CreateAudioCaptureSessionCommand> = {}): CreateAudioCaptureSessionCommand {
  return {
    sourceType: "telephony_recording",
    captureMode: "existing_recording",
    permissionState: "not_required_prior_capture",
    permissionEvidenceRef: "permission:telephony:already-captured",
    retentionPolicyRef: "retention-policy:audio-transcript:v1",
    artifactRef: "audio-artifact:telephony:001",
    ...overrides,
  };
}

describe("407 permission, retention, and redaction logic", () => {
  it("blocks unsupported permission and ungated ambient capture modes", () => {
    const plane = createAssistiveTranscriptPlane({ clock: fixedClock });

    expect(() =>
      plane.audioCaptureSessions.createSession(
        baseCapture({
          permissionState: "objected",
          permissionEvidenceRef: "permission:patient-objection",
        }),
        actor("audio_capture_worker"),
      ),
    ).toThrow(/permission/i);

    expect(() =>
      plane.audioCaptureSessions.createSession(
        baseCapture({
          sourceType: "live_ambient_capture",
          captureMode: "automatic_ambient",
          permissionState: "informed",
          permissionEvidenceRef: "permission:ambient:informed",
          artifactRef: "audio-artifact:ambient:001",
        }),
        actor("audio_capture_worker"),
      ),
    ).toThrow(/policy validation/i);
  });

  it("requires quarantine and retention before transcription can start", () => {
    const plane = createAssistiveTranscriptPlane({ clock: fixedClock });
    const capture = plane.audioCaptureSessions.createSession(baseCapture(), actor("audio_capture_worker"));

    expect(capture.artifactQuarantineState).toBe("quarantined");
    expect(() =>
      plane.transcriptJobs.scheduleTranscriptJob(
        {
          audioCaptureSessionRef: capture.audioCaptureSessionId,
          diarisationMode: "multi_speaker",
          languageMode: "english_uk",
          modelVersionRef: "transcript-model:v1",
          transcriptModelPolicyRef: "transcript-policy:v1",
        },
        actor("transcript_pipeline_worker"),
      ),
    ).toThrow(/quarantine-cleared/i);

    const retention = plane.retention.createRetentionEnvelope(
      {
        artifactType: "audio_capture",
        artifactRef: capture.artifactRef,
        retentionBasis: "individual_care_review_and_audit",
        deleteAfter: "2026-05-27T12:00:00.000Z",
        reviewSchedule: "P14D",
      },
      actor("retention_policy_engine"),
    );
    plane.audioCaptureSessions.attachRetentionEnvelope(
      capture.audioCaptureSessionId,
      retention.retentionEnvelopeId,
      actor("retention_policy_engine"),
    );
    const released = plane.audioCaptureSessions.releaseQuarantine(
      {
        audioCaptureSessionId: capture.audioCaptureSessionId,
        sourceCaptureBundleRef: "evidence-capture-bundle:audio:001",
        malwareScanRef: "malware-scan:clean:001",
      },
      actor("transcript_pipeline_worker"),
    );

    expect(released.artifactQuarantineState).toBe("cleared");
  });

  it("enforces retention holds and rejects raw transcript text in redaction commands", () => {
    const plane = createAssistiveTranscriptPlane({ clock: fixedClock });
    const held = plane.retention.createRetentionEnvelope(
      {
        artifactType: "raw_transcript",
        artifactRef: "raw-transcript:001",
        retentionBasis: "clinical_safety_investigation",
        deleteAfter: "2026-04-01T12:00:00.000Z",
        reviewSchedule: "P7D",
        legalHoldRef: "legal-hold:incident:001",
      },
      actor("retention_policy_engine"),
    );

    expect(
      plane.retention.enforceDeletionSchedule(
        {
          retentionEnvelopeId: held.retentionEnvelopeId,
          evaluatedAt: "2026-06-01T12:00:00.000Z",
        },
        actor("retention_policy_engine"),
      ).decisionState,
    ).toBe("blocked_legal_hold");

    const artifact = createNormalizedArtifact(plane);
    expect(() =>
      plane.redactions.applyRedactions(
        {
          transcriptArtifactId: artifact.transcriptArtifactId,
          redactionPolicyRef: "redaction-policy:phi:v1",
          redactionTransformHash: "sha256:redaction-transform",
          spans: [],
          rawTranscriptText: "raw patient text must not be passed here",
        },
        actor("transcript_pipeline_worker"),
      ),
    ).toThrow(/raw transcript text/i);
  });
});

function createNormalizedArtifact(plane: ReturnType<typeof createAssistiveTranscriptPlane>) {
  const capture = plane.audioCaptureSessions.createSession(baseCapture(), actor("audio_capture_worker"));
  const retention = plane.retention.createRetentionEnvelope(
    {
      artifactType: "audio_capture",
      artifactRef: capture.artifactRef,
      retentionBasis: "individual_care_review_and_audit",
      deleteAfter: "2026-05-27T12:00:00.000Z",
      reviewSchedule: "P14D",
    },
    actor("retention_policy_engine"),
  );
  plane.audioCaptureSessions.attachRetentionEnvelope(capture.audioCaptureSessionId, retention.retentionEnvelopeId, actor("retention_policy_engine"));
  plane.audioCaptureSessions.releaseQuarantine(
    {
      audioCaptureSessionId: capture.audioCaptureSessionId,
      sourceCaptureBundleRef: "evidence-capture-bundle:audio:001",
      malwareScanRef: "malware-scan:clean:001",
    },
    actor("transcript_pipeline_worker"),
  );
  const job = plane.transcriptJobs.scheduleTranscriptJob(
    {
      audioCaptureSessionRef: capture.audioCaptureSessionId,
      diarisationMode: "multi_speaker",
      languageMode: "english_uk",
      modelVersionRef: "transcript-model:v1",
      transcriptModelPolicyRef: "transcript-policy:v1",
    },
    actor("transcript_pipeline_worker"),
  );
  return plane.normalization.completeTranscriptJob(
    {
      transcriptJobId: job.transcriptJobId,
      rawTranscriptRef: "raw-transcript:001",
      speakerSegments: [
        {
          speakerLabel: "clinician",
          startMs: 0,
          endMs: 1500,
          textRef: "segment-text:001",
          confidence: 0.94,
        },
      ],
      confidenceSummary: "high confidence, one speaker segment",
      audioQualityState: "clear",
      diarisationUncertaintyState: "complete",
      normalizationVersionRef: "normalization:v1",
    },
    actor("transcript_pipeline_worker"),
  );
}
