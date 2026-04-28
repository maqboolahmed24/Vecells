import { describe, expect, it } from "vitest";
import {
  createInMemoryTelephonyReadinessRepository,
  createInMemoryTranscriptProvider,
  createTelephonyReadinessApplication,
  telephonyEvidenceReadinessReasonCatalog,
  telephonyReadinessGapResolutions,
  telephonyReadinessMigrationPlanRefs,
  telephonyReadinessPersistenceTables,
  transcriptCoverageSufficiencyPolicy,
} from "../src/telephony-readiness-pipeline.ts";

const callSessionRef = "call_session_191_demo";
const recordingArtifactRef = "DocumentReference_recording_191_demo";
const audioIngestSettlementRef = "tel_recording_ingest_settlement_190_demo";
const recordingDocumentReferenceRef = "DocumentReference_recording_191_demo";
const observedAt = "2026-04-15T15:00:00.000Z";

function structuredCapture(overrides = {}) {
  return {
    structuredCaptureRef: overrides.structuredCaptureRef ?? "structured_capture_191_symptoms",
    factFamily: overrides.factFamily ?? "request_type",
    normalizedValue: overrides.normalizedValue ?? "symptoms",
    source: overrides.source ?? "keypad",
    confidenceBand: overrides.confidenceBand ?? "high",
  };
}

function createApp(resultsByRecordingArtifactRef = {}) {
  const repository = createInMemoryTelephonyReadinessRepository();
  const transcriptProvider = createInMemoryTranscriptProvider({
    resultsByRecordingArtifactRef,
  });
  const app = createTelephonyReadinessApplication({
    repository,
    transcriptProvider,
  });
  return { app, repository };
}

async function enqueue(app, overrides = {}) {
  return app.service.enqueueTranscriptJob({
    callSessionRef: overrides.callSessionRef ?? callSessionRef,
    recordingArtifactRef: overrides.recordingArtifactRef ?? recordingArtifactRef,
    audioIngestSettlementRef: overrides.audioIngestSettlementRef ?? audioIngestSettlementRef,
    recordingDocumentReferenceRef:
      overrides.recordingDocumentReferenceRef ?? recordingDocumentReferenceRef,
    idempotencyKey: overrides.idempotencyKey ?? "idem_transcript_191",
    structuredCaptures: Object.prototype.hasOwnProperty.call(overrides, "structuredCaptures")
      ? overrides.structuredCaptures
      : [structuredCapture()],
    structuredCaptureRequirement: overrides.structuredCaptureRequirement ?? "not_required",
    urgentLiveAssessmentRef: overrides.urgentLiveAssessmentRef ?? null,
    urgentLiveOutcome: overrides.urgentLiveOutcome ?? "none",
    identityEvidenceRefs: overrides.identityEvidenceRefs ?? ["identity_evidence_191"],
    contactRouteEvidenceRefs: overrides.contactRouteEvidenceRefs ?? ["contact_route_191"],
    submissionEnvelopeRef: overrides.submissionEnvelopeRef ?? "submission_envelope_191",
    observedAt: overrides.observedAt ?? observedAt,
  });
}

async function drain(app, job, runIndex = 1) {
  return app.service.drainTranscriptJobs({
    transcriptJobRef: job.transcriptJobRef,
    workerRunRef: `transcript_worker_run_${runIndex}`,
    runAt: new Date(Date.parse(observedAt) + runIndex * 1000).toISOString(),
  });
}

function expectNoRawTranscriptLeak(value) {
  const text = JSON.stringify(value);
  expect(text).not.toContain("cough and fever for two days");
  expect(text).not.toContain("rawTranscript");
  expect(text).not.toContain("transcriptText");
}

describe("TelephonyReadinessPipeline", () => {
  it("records queued, running, and ready transcript readiness separately from evidence readiness", async () => {
    const { app, repository } = createApp();
    const queued = await enqueue(app);

    expect(app.persistenceTables).toEqual(telephonyReadinessPersistenceTables);
    expect(app.migrationPlanRefs).toEqual(telephonyReadinessMigrationPlanRefs);
    expect(app.gapResolutions).toEqual(telephonyReadinessGapResolutions);
    expect(app.coveragePolicy).toEqual(transcriptCoverageSufficiencyPolicy);
    expect(app.reasonCatalog).toEqual(telephonyEvidenceReadinessReasonCatalog);
    expect(queued.transcriptReadinessRecord.transcriptState).toBe("queued");
    expect(queued.evidenceReadinessAssessment.usabilityState).toBe("awaiting_transcript");
    expect(queued.evidenceReadinessAssessment.promotionReadiness).toBe("blocked");

    const running = await app.service.markTranscriptJobRunning({
      transcriptJobRef: queued.transcriptJob.transcriptJobRef,
      runAt: "2026-04-15T15:00:01.000Z",
    });
    expect(running.transcriptReadinessRecord.transcriptState).toBe("running");
    expect(running.evidenceReadinessAssessment.usabilityState).toBe("awaiting_transcript");

    const ready = await drain(app, running.transcriptJob, 2);
    const latest = ready.evidenceReadinessAssessments[0];
    const snapshots = repository.snapshots();
    expect(ready.transcriptReadinessRecords[0]?.transcriptState).toBe("ready");
    expect(latest?.usabilityState).toBe("safety_usable");
    expect(latest?.promotionReadiness).toBe("ready_to_promote");
    expect(latest?.reasonCodes).toContain("TEL_READY_191_SAFETY_USABLE_READY_TO_PROMOTE");
    expect(snapshots.transcriptReadinessRecords.map((record) => record.transcriptState)).toEqual([
      "queued",
      "running",
      "ready",
    ]);
    expectNoRawTranscriptLeak(snapshots);
  });

  it("extracts safety facts from transcript signals and keypad structured capture", async () => {
    const { app, repository } = createApp();
    const queued = await enqueue(app, {
      structuredCaptures: [
        structuredCapture({ normalizedValue: "symptoms" }),
        structuredCapture({
          structuredCaptureRef: "structured_capture_191_duration",
          factFamily: "duration",
          normalizedValue: "two_days",
        }),
      ],
    });

    await drain(app, queued.transcriptJob);
    const facts = repository.snapshots().safetyFacts[0];

    expect(facts?.factCompleteness).toBe("complete");
    expect(facts?.transcriptFactSignals.map((signal) => signal.normalizedCode)).toContain(
      "symptom_cough",
    );
    expect(facts?.transcriptFactSignals.map((signal) => signal.normalizedCode)).toContain(
      "symptom_fever",
    );
    expect(facts?.keypadFactSignals.map((signal) => signal.normalizedCode)).toContain(
      "request_type_symptoms",
    );
    expect(facts?.clinicallyRelevantSnippetRefs.length).toBeGreaterThan(0);
  });

  it("fails closed into manual review when transcript coverage is degraded", async () => {
    const { app, repository } = createApp({
      [recordingArtifactRef]: {
        transcriptState: "degraded",
        transcriptText: "cough",
        qualityBand: "low",
        segmentCompletenessPosture: "partial",
        extractionCompletenessPosture: "partial",
        reasonCodes: ["TEL_READY_191_PROVIDER_PARTIAL_SEGMENTS"],
      },
    });
    const queued = await enqueue(app);

    const result = await drain(app, queued.transcriptJob);
    const assessment = result.evidenceReadinessAssessments[0];
    const snapshots = repository.snapshots();

    expect(result.transcriptReadinessRecords[0]?.transcriptState).toBe("degraded");
    expect(assessment?.usabilityState).toBe("manual_review_only");
    expect(assessment?.promotionReadiness).toBe("blocked");
    expect(snapshots.manualAudioReviewQueueEntries[0]?.triggerClass).toBe("transcript_degraded");
    expect(snapshots.manualAudioReviewQueueEntries[0]?.reviewMode).toBe("staff_transcription");
  });

  it("detects contradictions between transcript facts and keypad capture", async () => {
    const { app, repository } = createApp();
    const queued = await enqueue(app, {
      structuredCaptures: [structuredCapture({ normalizedValue: "medication" })],
    });

    const result = await drain(app, queued.transcriptJob);
    const readiness = result.transcriptReadinessRecords[0];
    const assessment = result.evidenceReadinessAssessments[0];
    const snapshots = repository.snapshots();

    expect(readiness?.contradictionPosture).toBe("unresolved");
    expect(assessment?.usabilityState).toBe("manual_review_only");
    expect(assessment?.reasonCodes).toContain("TEL_READY_191_STRUCTURED_CAPTURE_CONFLICT");
    expect(snapshots.manualAudioReviewQueueEntries[0]?.triggerClass).toBe("contradictory_capture");
  });

  it("uses awaiting_structured_capture when policy requires keypad capture before promotion", async () => {
    const { app } = createApp();
    const queued = await enqueue(app, {
      structuredCaptures: [],
      structuredCaptureRequirement: "required",
    });

    const result = await drain(app, queued.transcriptJob);
    const assessment = result.evidenceReadinessAssessments[0];

    expect(assessment?.usabilityState).toBe("awaiting_structured_capture");
    expect(assessment?.promotionReadiness).toBe("blocked");
  });

  it("keeps urgent-live calls urgent_live_only instead of routine-promotable", async () => {
    const { app, repository } = createApp();
    const queued = await enqueue(app, {
      urgentLiveAssessmentRef: "urgent_live_assessment_191",
      urgentLiveOutcome: "urgent_live_required",
    });

    const result = await drain(app, queued.transcriptJob);
    const assessment = result.evidenceReadinessAssessments[0];

    expect(assessment?.usabilityState).toBe("urgent_live_only");
    expect(assessment?.promotionReadiness).toBe("blocked");
    expect(repository.snapshots().manualAudioReviewQueueEntries[0]?.triggerClass).toBe(
      "urgent_live_without_routine_evidence",
    );
  });

  it("treats failed terminal transcript output as unusable_terminal when policy requires closure", async () => {
    const { app, repository } = createApp({
      [recordingArtifactRef]: {
        transcriptState: "failed",
        transcriptText: "",
        qualityBand: "unknown",
        segmentCompletenessPosture: "missing",
        extractionCompletenessPosture: "failed",
        terminalUnusable: true,
        reasonCodes: ["TEL_READY_191_PROVIDER_AUDIO_UNREADABLE"],
      },
    });
    const queued = await enqueue(app);

    const result = await drain(app, queued.transcriptJob);

    expect(result.transcriptReadinessRecords[0]?.transcriptState).toBe("failed");
    expect(result.evidenceReadinessAssessments[0]?.usabilityState).toBe("unusable_terminal");
    expect(repository.snapshots().manualAudioReviewQueueEntries).toHaveLength(0);
  });

  it("appends rerun derivation packages and superseding readiness assessments without mutation", async () => {
    const firstRecordingRef = "DocumentReference_recording_191_degraded";
    const rerunRecordingRef = "DocumentReference_recording_191_rerun";
    const { app, repository } = createApp({
      [firstRecordingRef]: {
        transcriptState: "degraded",
        transcriptText: "cough",
        qualityBand: "low",
        segmentCompletenessPosture: "partial",
        extractionCompletenessPosture: "partial",
      },
      [rerunRecordingRef]: {
        transcriptState: "ready",
        transcriptText: "I have a cough and fever for two days and need clinical advice",
        qualityBand: "high",
        segmentCompletenessPosture: "complete",
        extractionCompletenessPosture: "complete",
      },
    });
    const first = await enqueue(app, {
      recordingArtifactRef: firstRecordingRef,
      recordingDocumentReferenceRef: firstRecordingRef,
      idempotencyKey: "idem_transcript_191_first",
    });
    await drain(app, first.transcriptJob, 1);
    const firstLatest = await app.service.getCurrentEvidenceReadiness({ callSessionRef });

    const rerun = await app.service.enqueueTranscriptRerun({
      callSessionRef,
      recordingArtifactRef: rerunRecordingRef,
      audioIngestSettlementRef,
      recordingDocumentReferenceRef: rerunRecordingRef,
      idempotencyKey: "idem_transcript_191_rerun",
      structuredCaptures: [structuredCapture()],
      supersedesTranscriptJobRef: first.transcriptJob.transcriptJobRef,
      rerunReasonCode: "TEL_READY_191_MANUAL_CORRECTION_RERUN",
      observedAt: "2026-04-15T15:05:00.000Z",
    });
    const rerunResult = await drain(app, rerun.transcriptJob, 2);
    const snapshots = repository.snapshots();

    expect(firstLatest?.usabilityState).toBe("manual_review_only");
    expect(rerunResult.evidenceReadinessAssessments[0]?.usabilityState).toBe("safety_usable");
    expect(
      snapshots.evidenceReadinessAssessments.some(
        (assessment) =>
          assessment.supersedesEvidenceReadinessAssessmentRef ===
          firstLatest?.telephonyEvidenceReadinessAssessmentRef,
      ),
    ).toBe(true);
    expect(
      rerunResult.evidenceReadinessAssessments[0]?.supersedesEvidenceReadinessAssessmentRef,
    ).not.toBeNull();
    expect(snapshots.derivationPackages).toHaveLength(2);
    expect(snapshots.transcriptJobs).toHaveLength(2);
    expect(snapshots.evidenceReadinessAssessments.length).toBeGreaterThanOrEqual(4);
  });

  it("can explicitly assess awaiting_recording before audio ingest settles", async () => {
    const { app } = createApp();

    const assessment = await app.service.assessEvidenceWithoutRecording({
      callSessionRef,
      reasonCode: "TEL_READY_191_RECORDING_NOT_AVAILABLE",
      observedAt,
    });

    expect(assessment.usabilityState).toBe("awaiting_recording");
    expect(assessment.promotionReadiness).toBe("blocked");
  });
});
