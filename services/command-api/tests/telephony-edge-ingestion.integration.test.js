import { describe, expect, it } from "vitest";
import {
  createTelephonyEdgeIngestionApplication,
  signSimulatorWebhookPayload,
  telephonyEdgeGapClosures,
  telephonyEdgeMigrationPlanRefs,
  telephonyEdgePersistenceTables,
} from "../src/telephony-edge-ingestion.ts";

const secret = "test-telephony-secret";
const timestamp = "2026-04-15T12:00:00.000Z";

function rawPayload(overrides = {}) {
  return JSON.stringify({
    eventId: "evt_call_started_187",
    providerCallId: "provider-call-187",
    eventType: "call.started",
    occurredAt: timestamp,
    sequence: 1,
    callerNumber: "+440000000187",
    ...overrides,
  });
}

function signedWebhook(overrides = {}) {
  const body = rawPayload(overrides);
  return {
    providerRef: "telephony_provider_simulator",
    requestUrl: "/internal/telephony/webhooks/telephony_provider_simulator",
    receivedAt: timestamp,
    sourceIpRef: "cidr://provider-ingest",
    rawBody: body,
    headers: {
      "x-vecells-simulator-timestamp": timestamp,
      "x-vecells-simulator-signature": signSimulatorWebhookPayload({
        rawBody: body,
        secret,
        timestamp,
      }),
    },
  };
}

function expectNoDownstreamLeak(value) {
  const text = JSON.stringify(value);
  for (const forbidden of [
    "+440000000187",
    "https://recordings.example.test/raw-call-audio.wav",
    "provider-call-187",
  ]) {
    expect(text).not.toContain(forbidden);
  }
}

describe("TelephonyEdgeService and TelephonyWebhookWorker", () => {
  it("validates simulator webhook signatures and quarantines raw receipts before canonical normalization", async () => {
    const app = await createTelephonyEdgeIngestionApplication({ simulatorSecret: secret });

    const accepted = await app.telephonyEdgeService.receiveProviderWebhook(signedWebhook());
    const snapshots = app.repository.snapshots();

    expect(app.migrationPlanRefs).toEqual(telephonyEdgeMigrationPlanRefs);
    expect(app.persistenceTables).toEqual(telephonyEdgePersistenceTables);
    expect(app.gapClosures).toEqual(telephonyEdgeGapClosures);
    expect(accepted.acknowledgement).toMatchObject({
      statusCode: 204,
      queuedForWorker: true,
      responseMode: "empty_fast_ack",
    });
    expect(accepted.validation.validationState).toBe("validated");
    expect(accepted.normalizedEvent.canonicalEventType).toBe("call_started");
    expect(accepted.normalizedEvent.providerPayloadRef).toContain("tel_payload_quarantine_187");
    expect(accepted.normalizedEvent.normalizedPayload.maskedCallerRef).toContain(
      "masked_caller_187",
    );
    expect(snapshots.rawReceipts).toHaveLength(1);
    expect(snapshots.rawReceipts[0].rawPayload).toContain("+440000000187");
    expect(snapshots.normalizedEvents).toHaveLength(1);
    expectNoDownstreamLeak({
      normalizedEvents: snapshots.normalizedEvents,
      outboxEntries: snapshots.outboxEntries,
    });
  });

  it("rejects unsigned or tampered callbacks without enqueuing business processing", async () => {
    const app = await createTelephonyEdgeIngestionApplication({ simulatorSecret: secret });
    const request = signedWebhook();

    const rejected = await app.telephonyEdgeService.receiveProviderWebhook({
      ...request,
      headers: {
        ...request.headers,
        "x-vecells-simulator-signature": "v1=bad-signature",
      },
    });

    expect(rejected.acknowledgement.statusCode).toBe(401);
    expect(rejected.validation.validationState).toBe("signature_failed");
    expect(rejected.normalizedEvent).toBeNull();
    expect(app.repository.snapshots().rawReceipts).toHaveLength(1);
    expect(app.repository.snapshots().normalizedEvents).toHaveLength(0);
    expect(app.repository.snapshots().outboxEntries).toHaveLength(0);
  });

  it("collapses duplicate callbacks by idempotency key without double-advancing the worker", async () => {
    const app = await createTelephonyEdgeIngestionApplication({ simulatorSecret: secret });

    const first = await app.telephonyEdgeService.receiveProviderWebhook(signedWebhook());
    const replay = await app.telephonyEdgeService.receiveProviderWebhook(signedWebhook());
    const workerResults = await app.telephonyWebhookWorker.processPending();
    const snapshots = app.repository.snapshots();

    expect(first.replayDisposition).toBe("accepted");
    expect(replay.replayDisposition).toBe("duplicate_replayed");
    expect(replay.acknowledgement.statusCode).toBe(204);
    expect(snapshots.rawReceipts).toHaveLength(2);
    expect(snapshots.normalizedEvents).toHaveLength(1);
    expect(snapshots.outboxEntries).toHaveLength(1);
    expect(workerResults).toHaveLength(1);
    expect(snapshots.callSessions).toHaveLength(1);
    expect(snapshots.callSessions[0].stateRevision).toBe(1);
    expect(snapshots.idempotencyRecords[0].duplicateCount).toBe(1);
  });

  it("buffers out-of-order callbacks and replays them after call-start bootstrap", async () => {
    const app = await createTelephonyEdgeIngestionApplication({ simulatorSecret: secret });

    const recording = await app.telephonyEdgeService.receiveProviderWebhook(
      signedWebhook({
        eventId: "evt_recording_available_187",
        eventType: "recording.available",
        occurredAt: "2026-04-15T12:00:03.000Z",
        sequence: 3,
        recordingId: "recording-187",
        recordingUrl: "https://recordings.example.test/raw-call-audio.wav",
      }),
    );
    const buffered = await app.telephonyWebhookWorker.processPending();
    const started = await app.telephonyEdgeService.receiveProviderWebhook(signedWebhook());
    const replayed = await app.telephonyWebhookWorker.processPending();
    const snapshots = app.repository.snapshots();

    expect(recording.normalizedEvent.canonicalEventType).toBe("recording_available");
    expect(buffered[0].dispatchState).toBe("buffered");
    expect(started.normalizedEvent.canonicalEventType).toBe("call_started");
    expect(replayed[0].replayedBufferedEventRefs).toContain(
      recording.normalizedEvent.canonicalEventId,
    );
    expect(snapshots.disorderBufferEntries[0].bufferState).toBe("replayed");
    expect(snapshots.callSessions[0].callState).toBe("recording_available");
    expect(snapshots.callSessions[0].recordingRefs[0]).toContain("recording_artifact_187");
    expectNoDownstreamLeak({
      normalizedEvents: snapshots.normalizedEvents,
      callSessions: snapshots.callSessions,
    });
  });

  it("maps menu, completion, and provider-error classes into provider-neutral call-session updates", async () => {
    const app = await createTelephonyEdgeIngestionApplication({ simulatorSecret: secret });
    await app.telephonyEdgeService.receiveProviderWebhook(signedWebhook());
    await app.telephonyEdgeService.receiveProviderWebhook(
      signedWebhook({
        eventId: "evt_menu_selected_187",
        eventType: "menu.selected",
        occurredAt: "2026-04-15T12:00:01.000Z",
        sequence: 2,
        menuSelection: "meds",
      }),
    );
    await app.telephonyWebhookWorker.processPending();
    expect(app.repository.snapshots().callSessions[0]).toMatchObject({
      callState: "menu_selected",
      menuSelection: "medications",
    });

    await app.telephonyEdgeService.receiveProviderWebhook(
      signedWebhook({
        eventId: "evt_provider_error_187",
        eventType: "provider.error",
        occurredAt: "2026-04-15T12:00:02.000Z",
        sequence: 3,
        errorCode: "simulator_transport_failure",
      }),
    );
    await app.telephonyWebhookWorker.processPending();
    expect(app.repository.snapshots().callSessions[0].callState).toBe("provider_error");

    await app.telephonyEdgeService.receiveProviderWebhook(
      signedWebhook({
        eventId: "evt_completed_187",
        eventType: "call.completed",
        occurredAt: "2026-04-15T12:00:03.000Z",
        sequence: 4,
        status: "completed",
      }),
    );
    await app.telephonyWebhookWorker.processPending();

    const finalSession = app.repository.snapshots().callSessions[0];
    expect(finalSession.callState).toBe("abandoned");
    expect(finalSession.reasonCodes).toContain("TEL_EDGE_187_CALL_SESSION_TERMINAL_PRESERVED");
    expectNoDownstreamLeak({
      normalizedEvents: app.repository.snapshots().normalizedEvents,
      callSessions: app.repository.snapshots().callSessions,
    });
  });
});
