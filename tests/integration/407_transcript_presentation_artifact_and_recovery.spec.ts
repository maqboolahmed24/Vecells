import { describe, expect, it } from "vitest";
import {
  createAssistiveTranscriptPlane,
  type TranscriptActorContext,
  type TranscriptActorRole,
} from "../../packages/domains/assistive_transcript/src/index.ts";

const fixedClock = { now: () => "2026-04-27T14:00:00.000Z" };

function actor(actorRole: TranscriptActorRole): TranscriptActorContext {
  return {
    actorRef: `actor:${actorRole}`,
    actorRole,
    purposeOfUse: "phase8_transcript_presentation_test",
    routeIntentBindingRef: "route-intent:transcript-presentation",
    auditCorrelationId: `audit:${actorRole}`,
  };
}

describe("407 transcript presentation artifact and recovery", () => {
  it("emits downstream readiness only after derivation and redaction are settled", () => {
    const plane = createAssistiveTranscriptPlane({ clock: fixedClock });
    const artifact = createNormalizedArtifact(plane);

    expect(() =>
      plane.transcriptArtifacts.markReadyForDrafting(
        {
          transcriptArtifactId: artifact.transcriptArtifactId,
          frozenContextSnapshotRef: "documentation-context:001",
        },
        actor("documentation_composer"),
      ),
    ).toThrow(/redaction/i);

    plane.redactions.applyRedactions(
      {
        transcriptArtifactId: artifact.transcriptArtifactId,
        redactionPolicyRef: "redaction-policy:phi:v1",
        redactionTransformHash: "sha256:redaction-transform",
        spans: [
          {
            sourceSegmentRef: artifact.speakerSegmentRefs[0] ?? "missing",
            redactionClass: "patient_identifier",
            startOffset: 0,
            endOffset: 8,
            replacementRef: "replacement:patient",
          },
        ],
      },
      actor("transcript_pipeline_worker"),
    );
    const ready = plane.transcriptArtifacts.markReadyForDrafting(
      {
        transcriptArtifactId: artifact.transcriptArtifactId,
        frozenContextSnapshotRef: "documentation-context:001",
      },
      actor("documentation_composer"),
    );

    expect(ready.artifactState).toBe("ready_for_drafting");
    expect(plane.store.events.map((event) => event.eventName)).toEqual([
      "assistive.transcript.ready",
      "assistive.context.snapshot.created",
    ]);
  });

  it("creates summary-first presentation artifacts and blocks raw blob or ungranted handoff", () => {
    const plane = createAssistiveTranscriptPlane({ clock: fixedClock });
    const artifact = createReadyArtifact(plane);

    const summary = plane.presentationArtifacts.generatePresentationArtifact(
      {
        transcriptArtifactRef: artifact.transcriptArtifactId,
        artifactPresentationContractRef: "artifact-presentation:transcript:v1",
        surfaceRouteContractRef: "route-contract:clinical-workspace:v1",
        surfacePublicationRef: "surface-publication:clinical-workspace:v1",
        runtimePublicationBundleRef: "runtime-publication:phase8:v1",
        visibilityTier: "staff_internal_summary",
        summarySafetyTier: "phi_redacted_summary",
        placeholderContractRef: "placeholder:transcript:v1",
      },
      actor("artifact_presentation_worker"),
    );
    const blocked = plane.presentationArtifacts.generatePresentationArtifact(
      {
        transcriptArtifactRef: artifact.transcriptArtifactId,
        artifactPresentationContractRef: "artifact-presentation:transcript:v1",
        surfaceRouteContractRef: "route-contract:clinical-workspace:v1",
        surfacePublicationRef: "surface-publication:clinical-workspace:v1",
        runtimePublicationBundleRef: "runtime-publication:phase8:v1",
        visibilityTier: "staff_internal_summary",
        summarySafetyTier: "unsafe_raw",
        placeholderContractRef: "placeholder:transcript:v1",
        requestedArtifactState: "external_handoff_ready",
        rawBlobUrl: "blob:https://example.invalid/raw",
      },
      actor("artifact_presentation_worker"),
    );

    expect(summary.artifactState).toBe("summary_only");
    expect(blocked.artifactState).toBe("blocked");
    expect(blocked.blockingReasonCodes).toEqual(
      expect.arrayContaining(["raw_blob_url_forbidden", "outbound_navigation_grant_required"]),
    );
  });

  it("downgrades presentation to recovery-only on permission drift", () => {
    const plane = createAssistiveTranscriptPlane({ clock: fixedClock });
    const artifact = createReadyArtifact(plane);

    const recovery = plane.presentationArtifacts.generatePresentationArtifact(
      {
        transcriptArtifactRef: artifact.transcriptArtifactId,
        artifactPresentationContractRef: "artifact-presentation:transcript:v1",
        surfaceRouteContractRef: "route-contract:clinical-workspace:v1",
        surfacePublicationRef: "surface-publication:clinical-workspace:v1",
        runtimePublicationBundleRef: "runtime-publication:phase8:v1",
        visibilityTier: "staff_internal_summary",
        summarySafetyTier: "phi_redacted_summary",
        placeholderContractRef: "placeholder:transcript:v1",
        permissionStateOverride: "withdrawn",
      },
      actor("artifact_presentation_worker"),
    );

    expect(recovery.artifactState).toBe("recovery_only");
    expect(recovery.blockingReasonCodes).toContain("permission_state_blocks_presentation");
  });
});

function createReadyArtifact(plane: ReturnType<typeof createAssistiveTranscriptPlane>) {
  const artifact = createNormalizedArtifact(plane);
  plane.redactions.applyRedactions(
    {
      transcriptArtifactId: artifact.transcriptArtifactId,
      redactionPolicyRef: "redaction-policy:phi:v1",
      redactionTransformHash: "sha256:redaction-transform",
      spans: [],
    },
    actor("transcript_pipeline_worker"),
  );
  return plane.transcriptArtifacts.markReadyForDrafting(
    {
      transcriptArtifactId: artifact.transcriptArtifactId,
      frozenContextSnapshotRef: "documentation-context:ready",
    },
    actor("documentation_composer"),
  );
}

function createNormalizedArtifact(plane: ReturnType<typeof createAssistiveTranscriptPlane>) {
  const capture = plane.audioCaptureSessions.createSession(
    {
      sourceType: "clinician_dictation_clip",
      captureMode: "manual_dictation",
      permissionState: "explicit_granted",
      permissionEvidenceRef: "permission:dictation:explicit",
      retentionPolicyRef: "retention-policy:audio-transcript:v1",
      artifactRef: "audio-artifact:dictation:001",
    },
    actor("audio_capture_worker"),
  );
  const retention = plane.retention.createRetentionEnvelope(
    {
      artifactType: "audio_capture",
      artifactRef: capture.artifactRef,
      retentionBasis: "individual_care_review_and_audit",
      deleteAfter: "2026-05-27T14:00:00.000Z",
      reviewSchedule: "P14D",
    },
    actor("retention_policy_engine"),
  );
  plane.audioCaptureSessions.attachRetentionEnvelope(capture.audioCaptureSessionId, retention.retentionEnvelopeId, actor("retention_policy_engine"));
  plane.audioCaptureSessions.releaseQuarantine(
    {
      audioCaptureSessionId: capture.audioCaptureSessionId,
      sourceCaptureBundleRef: "evidence-capture-bundle:dictation:001",
      malwareScanRef: "malware-scan:clean:dictation:001",
    },
    actor("transcript_pipeline_worker"),
  );
  const job = plane.transcriptJobs.scheduleTranscriptJob(
    {
      audioCaptureSessionRef: capture.audioCaptureSessionId,
      diarisationMode: "single_speaker",
      languageMode: "english_uk",
      modelVersionRef: "transcript-model:v1",
      transcriptModelPolicyRef: "transcript-policy:v1",
    },
    actor("transcript_pipeline_worker"),
  );
  return plane.normalization.completeTranscriptJob(
    {
      transcriptJobId: job.transcriptJobId,
      rawTranscriptRef: "raw-transcript:dictation:001",
      speakerSegments: [
        {
          speakerLabel: "clinician",
          startMs: 0,
          endMs: 1000,
          textRef: "segment-text:dictation:001",
          confidence: 0.96,
        },
      ],
      confidenceSummary: "clear dictation",
      audioQualityState: "clear",
      diarisationUncertaintyState: "complete",
      normalizationVersionRef: "normalization:v1",
    },
    actor("transcript_pipeline_worker"),
  );
}
