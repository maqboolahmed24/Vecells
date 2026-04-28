import {
  CONTROL_DECK_URL_PATH,
  closeServer,
  importPlaywright,
  startSimulatorService,
  startStaticServer,
  stopSimulatorService,
} from "./simulator-backplane-test-helpers.js";

export const simulatorEndToEndFlowCoverage = [
  "oidc-like redirect and callback replay",
  "im1 weak-confirmation commit",
  "mesh duplicate receipt",
  "telephony webhook retry recovery",
  "notification repair and reachability observation",
  "control-deck parity after API flows",
];

async function requestJson(url, init) {
  const response = await fetch(url, init);
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.error || payload.message || `Request failed for ${url}`);
  }
  return payload;
}

async function run() {
  const { chromium } = await importPlaywright();
  const service = await startSimulatorService(7105);
  const staticServer = await startStaticServer(4384);
  const browser = await chromium.launch({ headless: true });
  const baseUrl = service.baseUrl;

  try {
    const authBegin = await requestJson(`${baseUrl}/api/nhs-login/begin`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        scenarioId: "happy_path",
        routeBindingId: "rb_patient_intake_upgrade",
        clientId: "mc_patient_portal",
        userId: "usr_basic_p0",
        returnIntent: "patient.intake.upgrade",
      }),
    });
    const authSessionRef = authBegin.payload.authSessionRef;

    await requestJson(`${baseUrl}/api/nhs-login/callback`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ authSessionRef }),
    });
    const firstToken = await requestJson(`${baseUrl}/api/nhs-login/token`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ authSessionRef, idempotencyKey: "flow-auth" }),
    });
    const replayToken = await requestJson(`${baseUrl}/api/nhs-login/token`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ authSessionRef, idempotencyKey: "flow-auth" }),
    });
    if (firstToken.exactReplay || !replayToken.exactReplay) {
      throw new Error("OIDC token replay semantics drifted.");
    }

    const im1Search = await requestJson(`${baseUrl}/api/im1/search`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        providerSupplierId: "ps_optum_emisweb",
        patientRef: "PATIENT:FLOW:1",
      }),
    });
    const slotRef = im1Search.payload.slots[0].slotRef;
    const hold = await requestJson(`${baseUrl}/api/im1/hold`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ slotRef, patientRef: "PATIENT:FLOW:1" }),
    });
    const commit = await requestJson(`${baseUrl}/api/im1/commit`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        holdRef: hold.payload.hold.holdRef,
        patientRef: "PATIENT:FLOW:1",
        scenarioId: "ambiguous_confirmation",
      }),
    });
    if (commit.receiptCheckpoint.receiptStatus !== "pending") {
      throw new Error("IM1 weak-confirmation posture drifted.");
    }

    const meshMessage = await requestJson(`${baseUrl}/api/mesh/dispatch`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        workflowId: "VEC_HUB_BOOKING_NOTICE",
        fromMailboxKey: "MBX_VEC_HUB",
        toMailboxKey: "MBX_VEC_SUPPORT",
        scenarioId: "duplicate_delivery",
        summary: "end-to-end duplicate delivery",
      }),
    });
    const meshAck = await requestJson(`${baseUrl}/api/mesh/ack`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ messageRef: meshMessage.payload.message.messageRef }),
    });
    if (meshAck.payload.message.receiptState !== "duplicate_delivery") {
      throw new Error("Mesh duplicate-delivery posture drifted.");
    }

    const call = await requestJson(`${baseUrl}/api/telephony/start`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        scenarioId: "webhook_signature_retry",
        numberId: "NUM_TEL_FRONTDOOR_GENERAL",
        callerRef: "caller:flow",
      }),
    });
    const callRef = call.payload.call.callRef;
    const telephonyWebhook = await requestJson(`${baseUrl}/api/telephony/webhook`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ callRef }),
    });
    if (telephonyWebhook.receiptCheckpoint.receiptStatus !== "blocked") {
      throw new Error("Telephony webhook recovery fence drifted.");
    }
    await requestJson(`${baseUrl}/api/telephony/retry-webhook`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ callRef }),
    });

    const notification = await requestJson(`${baseUrl}/api/notifications/send`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        scenarioId: "sms_wrong_recipient_disputed",
        templateId: "TPL_SMS_SEEDED_CONTINUATION_V1",
        recipientRef: "synthetic:recipient:flow",
      }),
    });
    const messageRef = notification.payload.message.messageRef;
    await requestJson(`${baseUrl}/api/notifications/repair`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ messageRef }),
    });
    await requestJson(`${baseUrl}/api/notifications/settle`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ messageRef }),
    });

    const state = await requestJson(`${baseUrl}/api/state`);
    if (state.reachabilityObservations.length < 1) {
      throw new Error("Expected at least one reachability observation after repair flow.");
    }

    const page = await browser.newPage({ viewport: { width: 1440, height: 1120 } });
    try {
      const url = `http://127.0.0.1:4384${CONTROL_DECK_URL_PATH}?apiBaseUrl=${encodeURIComponent(baseUrl)}`;
      await page.goto(url, { waitUntil: "networkidle" });
      const timeline = page.locator("[data-testid='event-timeline']");
      await timeline.waitFor();
      await page.locator("[data-testid='family-filter']").selectOption("notifications");
      await timeline.getByText("Reachability observation recorded").first().waitFor();
      await page.locator("[data-testid='family-filter']").selectOption("mesh");
      await timeline.getByText("Transport receipt recorded").first().waitFor();
      await page.locator("[data-testid='family-filter']").selectOption("telephony");
      await timeline.getByText("Webhook recovered").first().waitFor();
    } finally {
      await page.close();
    }
  } finally {
    await browser.close();
    await closeServer(staticServer);
    await stopSimulatorService(service.child);
  }
}

if (process.argv.includes("--run")) {
  run().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
