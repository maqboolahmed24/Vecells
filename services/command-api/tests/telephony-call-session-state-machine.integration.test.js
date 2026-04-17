import { describe, expect, it } from "vitest";
import {
  createCallSessionCanonicalEvent,
  createCallSessionStateMachineApplication,
  rebuildCallSessionFromEvents,
  callSessionStateMachineGapResolutions,
  callSessionStateMachineMigrationPlanRefs,
  callSessionStateMachinePersistenceTables,
} from "../src/telephony-call-session-state-machine.ts";
import {
  createTelephonyEdgeIngestionApplication,
  signSimulatorWebhookPayload,
} from "../src/telephony-edge-ingestion.ts";

const callSessionRef = "call_session_188_demo";
const baseTime = "2026-04-15T12:00:00.000Z";

function event(eventType, overrides = {}) {
  const sequence = overrides.sequence ?? 1;
  return createCallSessionCanonicalEvent({
    eventType,
    callSessionRef: overrides.callSessionRef ?? callSessionRef,
    providerCorrelationRef: "provider_call_ref_188_demo",
    sequence,
    occurredAt: overrides.occurredAt ?? new Date(Date.parse(baseTime) + sequence * 1000).toISOString(),
    recordedAt: overrides.recordedAt,
    payload: overrides.payload,
    reasonCodes: overrides.reasonCodes,
    idempotencyKey: overrides.idempotencyKey,
    sourceCanonicalEventRef: overrides.sourceCanonicalEventRef,
    sourceCanonicalEventType: overrides.sourceCanonicalEventType,
  });
}

function signedWebhook(body, secret = "call-session-edge-secret") {
  const timestamp = body.occurredAt ?? baseTime;
  const rawBody = JSON.stringify(body);
  return {
    providerRef: "telephony_provider_simulator",
    requestUrl: "/internal/telephony/webhooks/telephony_provider_simulator",
    receivedAt: timestamp,
    sourceIpRef: "cidr://provider-ingest",
    rawBody,
    headers: {
      "x-vecells-simulator-timestamp": timestamp,
      "x-vecells-simulator-signature": signSimulatorWebhookPayload({
        rawBody,
        secret,
        timestamp,
      }),
    },
  };
}

function expectSupportSafe(value) {
  const text = JSON.stringify(value);
  expect(text).not.toContain("+440000000188");
  expect(text).not.toContain("raw-call-audio");
  expect(text).not.toContain("callerNumber");
}

describe("CallSession state machine and menu capture", () => {
  it("applies legal early transitions and blocks promotion shortcuts before readiness", async () => {
    const app = createCallSessionStateMachineApplication();

    await app.service.appendCallSessionEvent(event("call_initiated", { sequence: 1 }));
    await app.service.appendCallSessionEvent(
      event("menu_captured", {
        sequence: 2,
        payload: {
          menuPath: "medications",
          rawTransportSourceFamily: "dtmf",
          normalizedMenuCode: "MENU_MEDS",
          confidence: 1,
          parsePosture: "exact",
          maskedCallerContextRef: "masked_caller_ref_188",
          maskedCallerFragment: "ending 0188",
        },
      }),
    );
    await app.service.appendCallSessionEvent(event("identity_step_started", { sequence: 3 }));
    await app.service.appendCallSessionEvent(event("identity_partial", { sequence: 4 }));
    await app.service.appendCallSessionEvent(event("recording_promised", { sequence: 5 }));
    const available = await app.service.appendCallSessionEvent(
      event("recording_available", {
        sequence: 6,
        payload: { recordingArtifactRef: "object_recording_188_safe_ref" },
      }),
    );
    const shortcut = await app.service.appendCallSessionEvent(
      event("request_seeded", {
        sequence: 7,
        payload: { requestSeedRef: "request_seed_188_without_readiness" },
      }),
    );
    const snapshots = app.repository.snapshots();

    expect(app.migrationPlanRefs).toEqual(callSessionStateMachineMigrationPlanRefs);
    expect(app.persistenceTables).toEqual(callSessionStateMachinePersistenceTables);
    expect(app.gapResolutions).toEqual(callSessionStateMachineGapResolutions);
    expect(available.session.callState).toBe("recording_available");
    expect(shortcut.session.callState).toBe("recording_available");
    expect(shortcut.session.activeBlockerReason).toBe("readiness_required_before_promotion");
    expect(shortcut.reasonCodes).toContain("TEL_SESSION_188_PROMOTION_SHORTCUT_BLOCKED");
    expect(snapshots.menuCaptures).toHaveLength(1);
    expect(snapshots.menuCaptures[0]).toMatchObject({
      selectedTopLevelPath: "medications",
      rawTransportSourceFamily: "dtmf",
      correctionOfCaptureRef: null,
    });
    expect(app.repository.snapshots().projections[0].disclosureBoundary).toBe(
      "support_safe_masked_projection",
    );
    expectSupportSafe(app.repository.snapshots());
  });

  it("collapses duplicate event replay without overwriting menu history", async () => {
    const app = createCallSessionStateMachineApplication();
    const start = event("call_initiated", { sequence: 1, idempotencyKey: "idem-start-188" });
    const menu = event("menu_captured", {
      sequence: 2,
      idempotencyKey: "idem-menu-188",
      payload: { menuPath: "admin", normalizedMenuCode: "MENU_ADMIN" },
    });

    await app.service.appendCallSessionEvent(start);
    const first = await app.service.appendCallSessionEvent(menu);
    const replay = await app.service.appendCallSessionEvent(menu);
    const snapshots = app.repository.snapshots();

    expect(first.session.callState).toBe("menu_selected");
    expect(replay.eventApplied).toBe(false);
    expect(replay.reasonCodes).toEqual(["TEL_SESSION_188_DUPLICATE_EVENT_REPLAY_COLLAPSED"]);
    expect(replay.session.stateRevision).toBe(first.session.stateRevision);
    expect(snapshots.menuCaptures).toHaveLength(1);
  });

  it("orders out-of-order events deterministically and treats provider completion as not platform closed", async () => {
    const events = [
      event("recording_promised", { sequence: 4 }),
      event("call_completed", { sequence: 2 }),
      event("menu_captured", {
        sequence: 3,
        payload: { menuPath: "results", normalizedMenuCode: "MENU_RESULTS" },
      }),
      event("call_initiated", { sequence: 1 }),
    ];

    const rebuilt = rebuildCallSessionFromEvents(events);

    expect(rebuilt.session.callState).toBe("recording_expected");
    expect(rebuilt.session.currentMenuPath).toBe("results");
    expect(rebuilt.session.reasonCodes).toContain(
      "TEL_SESSION_188_PROVIDER_COMPLETION_NOT_PLATFORM_CLOSED",
    );
    expect(rebuilt.reasonCodes).toContain("TEL_SESSION_188_REBUILD_DETERMINISTIC");
  });

  it("settles abandonment and provider-error branches explicitly", async () => {
    const abandonedApp = createCallSessionStateMachineApplication();
    await abandonedApp.service.appendCallSessionEvent(event("call_initiated", { sequence: 1 }));
    const abandoned = await abandonedApp.service.appendCallSessionEvent(
      event("call_abandoned", { sequence: 2 }),
    );

    const errorApp = createCallSessionStateMachineApplication();
    await errorApp.service.appendCallSessionEvent(event("call_initiated", { sequence: 1 }));
    const providerError = await errorApp.service.appendCallSessionEvent(
      event("provider_error", {
        sequence: 2,
        payload: { providerErrorRef: "provider_error_ref_188_safe" },
      }),
    );

    expect(abandoned.session.callState).toBe("abandoned");
    expect(abandoned.reasonCodes).toContain("TEL_SESSION_188_ABANDONMENT_SETTLED");
    expect(providerError.session.callState).toBe("provider_error");
    expect(providerError.reasonCodes).toContain("TEL_SESSION_188_PROVIDER_ERROR_RECORDED");
  });

  it("opens urgent-live bootstrap from early signals while preserving later evidence refs", async () => {
    const app = createCallSessionStateMachineApplication();
    await app.service.appendCallSessionEvent(event("call_initiated", { sequence: 1 }));
    const urgent = await app.service.appendCallSessionEvent(
      event("menu_captured", {
        sequence: 2,
        payload: {
          menuPath: "symptoms",
          normalizedMenuCode: "MENU_SYMPTOMS",
          urgentSignalRefs: ["urgent_signal_ref_188"],
          urgentSignalSourceClasses: ["ivr_selection"],
        },
      }),
    );
    const lateRecording = await app.service.appendCallSessionEvent(
      event("recording_available", {
        sequence: 4,
        payload: { recordingArtifactRef: "object_recording_188_urgent_ref" },
      }),
    );
    const snapshots = app.repository.snapshots();

    expect(urgent.session.callState).toBe("urgent_live_only");
    expect(urgent.safetyPreemption.priority).toBe("urgent_live");
    expect(snapshots.urgentLiveAssessments.at(-1).assessmentOutcome).toBe("urgent_live_required");
    expect(snapshots.safetyPreemptions).toHaveLength(1);
    expect(lateRecording.session.callState).toBe("urgent_live_only");
    expect(lateRecording.session.recordingRefs).toContain("object_recording_188_urgent_ref");
  });

  it("rebuilds to the same settled support projection from canonical event history", async () => {
    const app = createCallSessionStateMachineApplication();
    const history = [
      event("call_initiated", { sequence: 1 }),
      event("menu_captured", {
        sequence: 2,
        payload: { menuPath: "symptoms", normalizedMenuCode: "MENU_SYMPTOMS" },
      }),
      event("identity_step_started", { sequence: 3 }),
      event("identity_resolved", { sequence: 4 }),
      event("recording_promised", { sequence: 5 }),
    ];
    for (const item of history) await app.service.appendCallSessionEvent(item);
    const before = await app.service.getSupportProjection(callSessionRef);

    const rebuilt = await app.service.rebuildCallSession(callSessionRef);
    const after = await app.service.getSupportProjection(callSessionRef);

    expect(rebuilt.session.callState).toBe("recording_expected");
    expect(after.currentCallState).toBe(before.currentCallState);
    expect(after.currentMenuPath).toBe(before.currentMenuPath);
    expect(after.activeBlockerOrHoldReason).toBe(before.activeBlockerOrHoldReason);
  });

  it("consumes normalized telephony events from the edge without exposing provider payloads", async () => {
    const secret = "call-session-edge-secret";
    const edge = await createTelephonyEdgeIngestionApplication({ simulatorSecret: secret });
    const session = createCallSessionStateMachineApplication();

    await edge.telephonyEdgeService.receiveProviderWebhook(
      signedWebhook(
        {
          eventId: "evt_call_started_188",
          providerCallId: "provider-call-188",
          eventType: "call.started",
          occurredAt: "2026-04-15T12:00:01.000Z",
          sequence: 1,
          callerNumber: "+440000000188",
        },
        secret,
      ),
    );
    await edge.telephonyEdgeService.receiveProviderWebhook(
      signedWebhook(
        {
          eventId: "evt_menu_188",
          providerCallId: "provider-call-188",
          eventType: "menu.selected",
          occurredAt: "2026-04-15T12:00:02.000Z",
          sequence: 2,
          callerNumber: "+440000000188",
          menuSelection: "meds",
        },
        secret,
      ),
    );

    for (const normalized of edge.repository.snapshots().normalizedEvents) {
      await session.service.appendNormalizedTelephonyEvent(normalized);
    }
    const snapshots = session.repository.snapshots();

    expect(snapshots.sessions[0].callState).toBe("menu_selected");
    expect(snapshots.sessions[0].currentMenuPath).toBe("medications");
    expectSupportSafe(snapshots);
  });
});
