import { afterAll, beforeAll, describe, expect, it } from "vitest";
import http from "node:http";
import {
  createSimulatorBackplaneRuntime,
  createSimulatorBackplaneServer,
  createSimulatorSdk,
} from "../src/index";

async function listen(server: http.Server): Promise<number> {
  return new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (!address || typeof address === "string") {
        reject(new Error("Server address unavailable."));
        return;
      }
      resolve(address.port);
    });
  });
}

describe("adapter simulator backplanes", () => {
  it("returns the same token settlement for exact auth replay", () => {
    const runtime = createSimulatorBackplaneRuntime();

    const begin = runtime.beginAuthFlow({
      scenarioId: "happy_path",
      routeBindingId: "rb_patient_intake_upgrade",
      clientId: "mc_patient_portal",
      userId: "usr_basic_p0",
      returnIntent: "patient.intake.upgrade",
    });
    runtime.deliverAuthCallback(begin.payload.authSessionRef);

    const first = runtime.redeemAuthCode({
      authSessionRef: begin.payload.authSessionRef,
      idempotencyKey: "exact-replay-key",
    });
    const second = runtime.redeemAuthCode({
      authSessionRef: begin.payload.authSessionRef,
      idempotencyKey: "exact-replay-key",
    });

    expect(first.exactReplay).toBe(false);
    expect(second.exactReplay).toBe(true);
    expect(second.payload).toEqual(first.payload);
    expect(runtime.getDeckSnapshot().summary.replayInjections).toBe(1);
  });

  it("preserves weak confirmation on IM1 commit and opens explicit ambiguity", () => {
    const runtime = createSimulatorBackplaneRuntime();
    const search = runtime.searchIm1Slots({
      providerSupplierId: "ps_optum_emisweb",
      patientRef: "PATIENT:BOOKING:1",
    });
    const slot = search.payload.slots[0];
    expect(slot).toBeDefined();
    if (!slot) {
      return;
    }
    const hold = runtime.holdIm1Slot({
      slotRef: slot.slotRef,
      patientRef: "PATIENT:BOOKING:1",
    });
    const commit = runtime.commitIm1Booking({
      holdRef: hold.payload.hold.holdRef,
      patientRef: "PATIENT:BOOKING:1",
      scenarioId: "ambiguous_confirmation",
    });
    const replay = runtime.commitIm1Booking({
      holdRef: hold.payload.hold.holdRef,
      patientRef: "PATIENT:BOOKING:1",
      scenarioId: "ambiguous_confirmation",
    });

    expect(commit.receiptCheckpoint.receiptStatus).toBe("pending");
    expect(commit.payload.appointment.externalConfirmationGateState).toBe("open");
    expect(commit.payload.appointment.confirmationTruthState).toBe("pending_external_confirmation");
    expect(commit.exactReplay).toBe(false);
    expect(replay.exactReplay).toBe(true);
    expect(replay.payload).toEqual(commit.payload);
    expect(runtime.getDeckSnapshot().summary.replayInjections).toBe(1);
  });

  it("records duplicate mesh delivery and webhook recovery without flattening semantics", () => {
    const runtime = createSimulatorBackplaneRuntime();

    const mesh = runtime.dispatchMeshMessage({
      workflowId: "VEC_HUB_BOOKING_NOTICE",
      fromMailboxKey: "MBX_VEC_HUB",
      toMailboxKey: "MBX_VEC_SUPPORT",
      scenarioId: "duplicate_delivery",
      summary: "Duplicate delivery rehearsal",
    });
    const ack = runtime.acknowledgeMeshMessage(mesh.payload.message.messageRef);

    const call = runtime.startTelephonyCall({
      scenarioId: "webhook_signature_retry",
      numberId: "NUM_TEL_FRONTDOOR_GENERAL",
      callerRef: "caller:duplicate-test",
    });
    const firstWebhook = runtime.emitTelephonyWebhook(call.payload.call.callRef);
    const retried = runtime.retryTelephonyWebhook(call.payload.call.callRef);

    expect(ack.payload.message.receiptState).toBe("duplicate_delivery");
    expect(ack.receiptCheckpoint.authoritativeTruthState).toBe("duplicate_under_review");
    expect(firstWebhook.receiptCheckpoint.receiptStatus).toBe("blocked");
    expect(retried.payload.call.webhookState).toBe("recovered");
  });

  it("emits reachability observations from notification repair flows", () => {
    const runtime = createSimulatorBackplaneRuntime();

    const send = runtime.sendNotification({
      scenarioId: "sms_wrong_recipient_disputed",
      templateId: "TPL_SMS_SEEDED_CONTINUATION_V1",
      recipientRef: "synthetic:recipient:reachability",
    });
    const repair = runtime.repairNotification(send.payload.message.messageRef);

    expect(repair.payload.message.repairState).toBe("repaired");
    expect(repair.payload.observation.observationType).toBe("disputed_delivery");
    expect(runtime.getStateSnapshot().reachabilityObservations).toHaveLength(1);
  });
});

describe("simulator sdk clients", () => {
  let server: http.Server;
  let baseUrl: string;

  beforeAll(async () => {
    server = createSimulatorBackplaneServer();
    const port = await listen(server);
    baseUrl = `http://127.0.0.1:${port}`;
  });

  afterAll(async () => {
    await new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
  });

  it("drives the control plane and family APIs over HTTP", async () => {
    const sdk = createSimulatorSdk(baseUrl);

    const deck = await sdk.control.getDeck();
    expect(deck.families).toHaveLength(5);

    await sdk.control.setFailureMode("mesh", "delay");
    const reseeded = await sdk.control.reseed("seed_mesh_duplicate_receipt");
    expect(reseeded.meshMessages.length).toBeGreaterThanOrEqual(3);

    const sent = await sdk.notifications.send({
      scenarioId: "sms_wrong_recipient_disputed",
      templateId: "TPL_SMS_SEEDED_CONTINUATION_V1",
      recipientRef: "synthetic:recipient:http",
    });
    const messageRef = sent.payload.message.messageRef as string;
    const repaired = await sdk.notifications.repair(messageRef);
    expect(repaired.payload.observation.observationRef).toMatch(/^REACH_/);
  });
});
