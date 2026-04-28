import {
  assertCondition,
  assertNoHorizontalOverflow,
  importPlaywright,
  openPatientRoute,
  startPatientWeb,
  stopPatientWeb,
  trackExternalRequests,
} from "./266_patient_conversation_surface.helpers";

export const patientConversationCoverage = [
  "request-detail launch enters the patient conversation family",
  "message-cluster launch keeps cluster return context",
  "more-info reply stays same-shell from question to check to receipt",
  "pending message reply does not imply final delivery",
  "contact repair becomes dominant when route truth is degraded",
];

async function openFromRequestDetail(page: any, baseUrl: string) {
  await page.goto(`${baseUrl}/requests/request_211_a`, { waitUntil: "networkidle" });
  await page.locator("[data-testid='request-detail-open-conversation']").click();
  await page.locator("[data-testid='PatientConversationRoute']").waitFor();
}

export async function run(): Promise<void> {
  const playwright = await importPlaywright();
  if (!playwright) {
    return;
  }

  const { child, baseUrl } = await startPatientWeb();
  const browser = await playwright.chromium.launch({ headless: true });

  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 980 } });
    const externalRequests = new Set<string>();
    trackExternalRequests(page, baseUrl, externalRequests);

    await openFromRequestDetail(page, baseUrl);
    const route = page.locator("[data-testid='PatientConversationRoute']");
    assertCondition(
      (await route.getAttribute("data-route-family")) === "patient_conversation",
      "conversation route should publish the route family marker",
    );
    assertCondition(
      (await route.getAttribute("data-patient-conversation-state")) === "reply_needed",
      "request-detail launch should start in reply-needed state",
    );
    assertCondition(
      (await route.getAttribute("data-dominant-patient-action")) === "open_more_info_reply",
      "request-detail launch should expose reply as the dominant action",
    );

    await page
      .locator("[data-testid='PatientConversationSectionTabs']")
      .getByRole("button", { name: "Callback" })
      .click();
    await page.locator("[data-testid='PatientCallbackStatusCard']").waitFor();
    assertCondition(
      new URL(page.url()).pathname === "/requests/request_211_a/conversation/callback",
      "callback tab should stay in the conversation route family",
    );

    await openPatientRoute(page, `${baseUrl}/requests/request_211_a/conversation/more-info?state=live`);
    await page.locator("#prompt_216_photo_timing").fill("Tuesday midday in natural light");
    await page.locator("input[name='prompt_216_symptom_change'][value='It looks worse']").check();
    await page
      .locator("[data-testid='PatientMoreInfoReplySurface']")
      .getByRole("button", { name: "Continue", exact: true })
      .click();
    await page.locator("[data-testid='PatientMoreInfoCheckPanel']").waitFor();
    await page
      .locator("[data-testid='PatientMoreInfoCheckPanel']")
      .getByRole("button", { name: "Send reply", exact: true })
      .click();
    await page.locator("[data-testid='PatientMoreInfoReceiptPanel']").waitFor();
    assertCondition(
      new URL(page.url()).pathname === "/requests/request_211_a/conversation/more-info",
      "sending more-info should stay in the same route",
    );
    assertCondition(
      (await route.getAttribute("data-route-anchor")) === "more_info_receipt_panel",
      "same-shell send should promote the receipt anchor",
    );

    await openPatientRoute(page, `${baseUrl}/requests/request_211_a/conversation/messages?origin=messages`);
    await page.locator("#message_reply_field").fill("The rash is still present and the area is warmer today.");
    await page.getByRole("button", { name: "Send reply" }).click();
    await page.locator("[data-testid='PatientMessageEvent-subthread_266_local_pending']").waitFor();
    const messageText = await page.locator("[data-testid='PatientMessageThread']").innerText();
    assertCondition(
      messageText.includes("waiting for review") && !messageText.includes("fully delivered"),
      "message reply should stay pending and avoid final-delivery language",
    );

    await openPatientRoute(page, `${baseUrl}/requests/request_211_a/conversation/callback?state=repair`);
    assertCondition(
      (await route.getAttribute("data-dominant-patient-action")) === "repair_contact_route",
      "repair state should promote contact repair as the dominant action",
    );
    assertCondition(
      (await route.getAttribute("data-contact-repair-state")) === "ready",
      "repair state should expose contact repair posture",
    );
    assertCondition(
      (await page.getByText("We need to check your contact details first").count()) === 1,
      "callback route should explain why the blocked action cannot continue",
    );

    await page.goto(`${baseUrl}/messages/cluster_214_derm`, { waitUntil: "networkidle" });
    await page.locator("[data-testid='message-open-request-conversation']").click();
    await page.locator("[data-testid='PatientConversationRoute']").waitFor();
    assertCondition(
      (await page.locator("[data-testid='PatientConversationReturnButton']").innerText()) ===
        "Return to message cluster",
      "message-cluster launch should keep the cluster return bridge",
    );

    await assertNoHorizontalOverflow(page, "266 patient conversation route");
    assertCondition(
      externalRequests.size === 0,
      `unexpected external requests: ${Array.from(externalRequests).join(", ")}`,
    );
  } finally {
    await browser.close();
    await stopPatientWeb(child);
  }
}

if (process.argv.includes("--run")) {
  run().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
