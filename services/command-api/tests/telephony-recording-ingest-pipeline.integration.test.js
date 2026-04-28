import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  createInMemoryProviderRecordingAdapter,
  createInMemoryTelephonyRecordingIngestRepository,
  createStaticRecordingScanner,
  createTelephonyRecordingIngestApplication,
  recordingAudioFormatPolicy,
  recordingFetchTimeoutRetryLaw,
  recordingIngestGapResolutions,
  recordingIngestMigrationPlanRefs,
  recordingIngestPersistenceTables,
} from "../src/telephony-recording-ingest-pipeline.ts";

const observedAt = "2026-04-15T14:00:00.000Z";
const callSessionRef = "call_session_190_demo";
const providerRecordingRef = "provider_recording_190_demo";
const canonicalEventRef = "canonical_event_recording_available_190";

function digest(value) {
  return createHash("sha256").update(value).digest("hex");
}

function audioFixture(overrides = {}) {
  const body = overrides.body ?? "RIFF demo 60 second governed recording audio";
  return {
    providerRecordingRef: overrides.providerRecordingRef ?? providerRecordingRef,
    providerCallRef: overrides.providerCallRef ?? "provider_call_190_demo",
    mediaType: overrides.mediaType ?? "audio/wav",
    body,
    durationSeconds: overrides.durationSeconds ?? 45,
    checksumSha256: Object.prototype.hasOwnProperty.call(overrides, "checksumSha256")
      ? overrides.checksumSha256
      : digest(body),
    providerAuthenticated: overrides.providerAuthenticated ?? true,
  };
}

function createApp(options = {}) {
  const repository = createInMemoryTelephonyRecordingIngestRepository();
  const providerAdapter = createInMemoryProviderRecordingAdapter({
    assets: options.assets ?? [audioFixture()],
    scriptedAvailability: options.scriptedAvailability,
  });
  const scannerAdapter = createStaticRecordingScanner({
    verdictByProviderRecordingRef: options.verdictByProviderRecordingRef,
  });
  const app = createTelephonyRecordingIngestApplication({
    repository,
    providerAdapter,
    scannerAdapter,
  });
  return { app, repository };
}

async function schedule(app, overrides = {}) {
  return app.service.scheduleRecordingFetchJob({
    callSessionRef: overrides.callSessionRef ?? callSessionRef,
    providerRecordingRef: overrides.providerRecordingRef ?? providerRecordingRef,
    canonicalEventRef: overrides.canonicalEventRef ?? canonicalEventRef,
    idempotencyKey: overrides.idempotencyKey ?? "idem_recording_fetch_190",
    observedAt: overrides.observedAt ?? observedAt,
  });
}

async function drain(app, job, runIndex = 1) {
  return app.service.drainRecordingFetchJobs({
    recordingFetchJobRef: job.recordingFetchJobRef,
    workerRunRef: `recording_fetch_worker_run_${runIndex}`,
    runAt: new Date(Date.parse(observedAt) + runIndex * 1000).toISOString(),
  });
}

function expectNoProviderLeak(value) {
  const text = JSON.stringify(value);
  expect(text).not.toContain("https://");
  expect(text).not.toContain("http://");
  expect(text).not.toContain("signedUrl");
  expect(text).not.toContain("providerUrl");
  expect(text).not.toContain("RIFF demo");
}

describe("TelephonyRecordingIngestPipeline", () => {
  it("schedules duplicate provider recording events exactly once and creates one governed DocumentReference", async () => {
    const { app, repository } = createApp();
    const first = await schedule(app, { idempotencyKey: "idem_recording_fetch_a_190" });
    const duplicate = await schedule(app, { idempotencyKey: "idem_recording_fetch_b_190" });

    expect(first.recordingFetchJobRef).toBe(duplicate.recordingFetchJobRef);
    expect(app.persistenceTables).toEqual(recordingIngestPersistenceTables);
    expect(app.migrationPlanRefs).toEqual(recordingIngestMigrationPlanRefs);
    expect(app.gapResolutions).toEqual(recordingIngestGapResolutions);
    expect(app.formatPolicy).toEqual(recordingAudioFormatPolicy);
    expect(app.retryLaw).toEqual(recordingFetchTimeoutRetryLaw);

    const result = await drain(app, first);
    const settlement = result.settlements[0];
    const snapshots = repository.snapshots();

    expect(settlement?.settlementOutcome).toBe("governed_audio_ready");
    expect(settlement?.callSessionEventType).toBe("recording_available");
    expect(snapshots.jobs).toHaveLength(1);
    expect(snapshots.governedObjects).toHaveLength(1);
    expect(snapshots.documentReferenceLinks).toHaveLength(1);
    expect(snapshots.documentReferenceLinks[0]?.artifactUrl).toMatch(
      /^artifact:\/\/recording-audio\//,
    );
    expectNoProviderLeak(snapshots);
  });

  it("retries delayed provider availability before settling governed audio", async () => {
    const { app, repository } = createApp({
      scriptedAvailability: {
        [providerRecordingRef]: ["delayed", "available"],
      },
    });
    const job = await schedule(app);

    const delayed = await drain(app, job, 1);
    expect(delayed.settlements[0]?.settlementOutcome).toBe("retry_scheduled");
    expect(repository.snapshots().jobs[0]?.retryCount).toBe(1);
    expect(repository.snapshots().quarantineObjects).toHaveLength(0);

    const retriedJob = repository.snapshots().jobs[0];
    const settled = await drain(app, retriedJob, 2);
    expect(settled.settlements[0]?.settlementOutcome).toBe("governed_audio_ready");
    expect(repository.snapshots().documentReferenceLinks).toHaveLength(1);
  });

  it("blocks missing provider assets into manual recording_missing review without storage or DocumentReference", async () => {
    const { app, repository } = createApp({ assets: [] });
    const job = await schedule(app);

    const result = await drain(app, job);
    const snapshots = repository.snapshots();

    expect(result.settlements[0]?.settlementOutcome).toBe("recording_missing");
    expect(snapshots.jobs[0]?.terminalOutcome).toBe("recording_missing");
    expect(snapshots.manualReviewDispositions[0]?.triggerClass).toBe("recording_missing");
    expect(snapshots.governedObjects).toHaveLength(0);
    expect(snapshots.documentReferenceLinks).toHaveLength(0);
  });

  it("rejects corrupt assets that fail transport checksum integrity", async () => {
    const { app, repository } = createApp({
      assets: [audioFixture({ checksumSha256: "bad_checksum_190" })],
    });
    const job = await schedule(app);

    const result = await drain(app, job);
    const snapshots = repository.snapshots();

    expect(result.settlements[0]?.settlementOutcome).toBe("manual_audio_review_required");
    expect(snapshots.quarantineAssessments[0]?.transportIntegrityState).toBe("failed");
    expect(snapshots.quarantineAssessments[0]?.manualReviewDispositionRef).toBe(
      snapshots.manualReviewDispositions[0]?.manualReviewDispositionRef,
    );
    expect(snapshots.jobs[0]?.terminalOutcome).toBe("corrupt_or_integrity_failed");
    expect(snapshots.governedObjects).toHaveLength(0);
    expect(snapshots.documentReferenceLinks).toHaveLength(0);
  });

  it("rejects unsupported audio formats before governed storage promotion", async () => {
    const { app, repository } = createApp({
      assets: [audioFixture({ mediaType: "application/octet-stream" })],
    });
    const job = await schedule(app);

    const result = await drain(app, job);
    const snapshots = repository.snapshots();

    expect(result.settlements[0]?.settlementOutcome).toBe("manual_audio_review_required");
    expect(snapshots.quarantineAssessments[0]?.quarantineOutcome).toBe(
      "blocked_unsupported_format",
    );
    expect(snapshots.jobs[0]?.terminalOutcome).toBe("unsupported_format");
    expect(snapshots.governedObjects).toHaveLength(0);
  });

  it("keeps malware or unreadable scan outcomes quarantined with no orphan governed object", async () => {
    const { app, repository } = createApp({
      verdictByProviderRecordingRef: {
        [providerRecordingRef]: "malware",
      },
    });
    const job = await schedule(app);

    const result = await drain(app, job);
    const snapshots = repository.snapshots();

    expect(result.settlements[0]?.settlementOutcome).toBe("manual_audio_review_required");
    expect(snapshots.quarantineObjects).toHaveLength(1);
    expect(snapshots.quarantineAssessments[0]?.malwareScanState).toBe("malware");
    expect(snapshots.governedObjects).toHaveLength(0);
    expect(snapshots.documentReferenceLinks).toHaveLength(0);
  });

  it("returns the same terminal settlement and DocumentReference on replay after success", async () => {
    const { app, repository } = createApp();
    const job = await schedule(app);

    const first = await drain(app, job, 1);
    const replay = await drain(app, job, 2);
    const snapshots = repository.snapshots();

    expect(first.settlements[0]?.audioIngestSettlementRef).toBe(
      replay.settlements[0]?.audioIngestSettlementRef,
    );
    expect(first.settlements[0]?.documentReferenceRef).toBe(
      replay.settlements[0]?.documentReferenceRef,
    );
    expect(snapshots.governedObjects).toHaveLength(1);
    expect(snapshots.documentReferenceLinks).toHaveLength(1);
  });

  it("repairs partial governed-object progress by linking the missing DocumentReference", async () => {
    const { app, repository } = createApp({ assets: [] });
    const job = await schedule(app);
    const partialObject = {
      objectStorageRef: "tel_recording_governed_object_190_partial",
      canonicalObjectRef: "governed-audio://partial-repair-190",
      recordingFetchJobRef: job.recordingFetchJobRef,
      callSessionRef: job.callSessionRef,
      providerRecordingRef: job.providerRecordingRef,
      quarantineObjectRef: "tel_recording_quarantine_object_190_partial",
      storageClass: "governed_audio",
      retentionClass: "clinical_audio_evidence",
      encryptionKeyLineageRef: "kms_audio_lineage_190_partial",
      contentDigest: digest("partial governed audio"),
      byteSize: 22,
      durationSeconds: 30,
      mediaType: "audio/wav",
      disclosureClass: "clinical_evidence_audio",
      duplicateAssetDetectionRef: "duplicate_asset_detection_190_partial",
      ingestedAt: observedAt,
    };
    await repository.saveGovernedObject(partialObject);

    const repaired = await app.service.repairNoOrphanRecordingIngest({
      recordingFetchJobRef: job.recordingFetchJobRef,
      repairedAt: "2026-04-15T14:05:00.000Z",
    });
    const snapshots = repository.snapshots();

    expect(repaired?.settlementOutcome).toBe("governed_audio_ready");
    expect(repaired?.reasonCodes).toContain("REC_190_NO_ORPHAN_REPLAY_REPAIRED_DOCUMENT_REFERENCE");
    expect(snapshots.documentReferenceLinks).toHaveLength(1);
    expect(snapshots.jobs[0]?.terminalOutcome).toBe("succeeded");
  });
});
