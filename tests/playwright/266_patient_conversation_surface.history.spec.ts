import {
  assertCondition,
  importPlaywright,
  startPatientWeb,
  stopPatientWeb,
} from "./266_patient_conversation_surface.helpers";

async function openFromMessages(page: any, baseUrl: string) {
  await page.goto(`${baseUrl}/messages/cluster_214_derm`, { waitUntil: "networkidle" });
  await page.locator("[data-testid='message-open-request-conversation']").click();
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
    const page = await browser.newPage({ viewport: { width: 1440, height: 960 } });

    await openFromMessages(page, baseUrl);
    const route = page.locator("[data-testid='PatientConversationRoute']");
    await page.locator("[data-testid='PatientMessageEvent-subthread_214_receipt'] .patient-conversation__timeline-button").click();
    await page.waitForFunction(
      () =>
        document
          .querySelector("[data-testid='PatientConversationRoute']")
          ?.getAttribute("data-route-anchor") === "subthread_214_receipt",
    );
    const anchorBeforeReload = await route.getAttribute("data-route-anchor");
    const bundleBeforeReload = await route.getAttribute("data-request-return-bundle");

    await page.reload({ waitUntil: "networkidle" });
    await page.locator("[data-testid='PatientConversationRoute']").waitFor();
    assertCondition(
      (await route.getAttribute("data-route-anchor")) === anchorBeforeReload,
      "reload should preserve the selected conversation anchor",
    );
    assertCondition(
      (await route.getAttribute("data-request-return-bundle")) === bundleBeforeReload,
      "reload should preserve the request return bundle",
    );
    assertCondition(
      (await page.locator("[data-testid='PatientConversationReturnButton']").innerText()) ===
        "Return to message cluster",
      "reload should preserve the message-cluster return bridge",
    );

    await page.locator("[data-testid='PatientConversationReturnButton']").click();
    await page.locator("[data-testid='conversation-braid']").waitFor();
    assertCondition(
      new URL(page.url()).pathname === "/messages/cluster_214_derm",
      "explicit return should go back to the owning message cluster",
    );

    await page.goBack({ waitUntil: "networkidle" });
    await page.locator("[data-testid='PatientConversationRoute']").waitFor();
    assertCondition(
      new URL(page.url()).pathname === "/requests/request_211_a/conversation/messages",
      "browser back should restore the conversation route",
    );
    assertCondition(
      (await route.getAttribute("data-route-anchor")) === anchorBeforeReload,
      "browser back should restore the selected anchor",
    );

    await page.goForward({ waitUntil: "networkidle" });
    await page.locator("[data-testid='conversation-braid']").waitFor();
    assertCondition(
      new URL(page.url()).pathname === "/messages/cluster_214_derm",
      "browser forward should return to the originating message cluster",
    );

    await page.goto(`${baseUrl}/requests/request_211_a`, { waitUntil: "networkidle" });
    await page.locator("[data-testid='request-detail-open-conversation']").click();
    await page.locator("[data-testid='PatientConversationRoute']").waitFor();
    await page.locator("[data-testid='PatientConversationReturnButton']").click();
    await page.locator("[data-testid='patient-request-detail-route']").waitFor();
    assertCondition(
      new URL(page.url()).pathname === "/requests/request_211_a",
      "request launch should return to the request detail route",
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
