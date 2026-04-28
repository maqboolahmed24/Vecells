import {
  assertCondition,
  importPlaywright,
  openHubRoute,
  outputPath,
  startHubDesk,
  stopHubDesk,
  trackExternalRequests,
  waitForHubRootState,
} from "./327_hub_queue.helpers";

export const hubRecoveryCoverage = [
  "callback-transfer-pending keeps prior option context visible",
  "urgent return-to-practice renders receipt and supervisor escalation in the same shell",
];

export async function run(): Promise<void> {
  const playwright = await importPlaywright();
  if (!playwright) {
    return;
  }

  const { child, baseUrl } = await startHubDesk();
  const browser = await playwright.chromium.launch({ headless: true });
  const externalRequests = new Set<string>();

  try {
    const context = await browser.newContext({
      viewport: { width: 1520, height: 1160 },
      locale: "en-GB",
      timezoneId: "Europe/London",
    });
    await context.tracing.start({ screenshots: true, snapshots: true });
    const page = await context.newPage();
    trackExternalRequests(page, baseUrl, externalRequests);

    await openHubRoute(page, `${baseUrl}/hub/case/hub-case-052`, "hub-case-route");
    await waitForHubRootState(page, {
      currentPath: "/hub/case/hub-case-052",
      viewMode: "case",
      selectedCaseId: "hub-case-052",
    });
    await page.getByTestId("HubNoSlotResolutionPanel").waitFor();
    await page.getByTestId("HubCallbackTransferPendingState").waitFor();
    await page.getByTestId("HubReopenProvenanceStub").waitFor();
    assertCondition(
      (await page.getByTestId("HubNoSlotResolutionPanel").getAttribute("data-fallback-type")) ===
        "callback_request",
      "callback no-slot panel lost fallback type",
    );
    assertCondition(
      (await page.getByTestId("HubCallbackTransferPendingState").getAttribute(
        "data-callback-transfer",
      )) === "pending",
      "callback transfer state drifted",
    );
    assertCondition(
      (await page.locator(".hub-option-stack [data-option-card='opt-052-variance']").count()) === 1,
      "callback recovery lost preserved option context",
    );

    await openHubRoute(page, `${baseUrl}/hub/case/hub-case-031`, "hub-case-route");
    await waitForHubRootState(page, {
      currentPath: "/hub/case/hub-case-031",
      viewMode: "case",
      selectedCaseId: "hub-case-031",
    });
    await page.getByTestId("HubUrgentBounceBackBanner").waitFor();
    await page.getByTestId("HubReturnToPracticeReceipt").waitFor();
    await page.getByTestId("HubSupervisorEscalationPanel").waitFor();
    assertCondition(
      (await page.getByTestId("HubReturnToPracticeReceipt").getAttribute(
        "data-return-to-practice",
      )) === "urgent_return_to_practice",
      "urgent return receipt lost fallback marker",
    );
    assertCondition(
      (await page.getByTestId("HubSupervisorEscalationPanel").getAttribute(
        "data-supervisor-escalation",
      )) === "true",
      "supervisor escalation marker missing",
    );
    assertCondition(
      (await page.locator(".hub-option-stack [data-option-card='opt-031-prior-window']").count()) ===
        1,
      "urgent recovery lost preserved prior option context",
    );

    assertCondition(
      externalRequests.size === 0,
      `unexpected external requests: ${Array.from(externalRequests).join(", ")}`,
    );

    await page.screenshot({ path: outputPath("331-hub-no-slot-recovery.png"), fullPage: true });
    await context.tracing.stop({ path: outputPath("331-hub-no-slot-recovery-trace.zip") });
  } finally {
    await browser.close();
    await stopHubDesk(child);
  }
}

if (process.argv.includes("--run")) {
  run().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
