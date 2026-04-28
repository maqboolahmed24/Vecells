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

export const hubExceptionsCoverage = [
  "exceptions workspace renders typed rows and sticky detail drawer",
  "selected exception and case anchor survive refresh",
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
      viewport: { width: 1500, height: 1120 },
      locale: "en-GB",
      timezoneId: "Europe/London",
    });
    await context.tracing.start({ screenshots: true, snapshots: true });
    const page = await context.newPage();
    trackExternalRequests(page, baseUrl, externalRequests);

    await openHubRoute(page, `${baseUrl}/hub/exceptions`, "HubExceptionQueueView");
    await waitForHubRootState(page, {
      currentPath: "/hub/exceptions",
      viewMode: "exceptions",
      selectedCaseId: "hub-case-052",
    });
    const root = page.locator("[data-testid='hub-shell-root']");
    assertCondition(
      (await root.getAttribute("data-selected-exception-id")) === "exc-callback-052",
      "default selected exception should bind to callback recovery",
    );

    const rows = page.locator("[data-hub-exception-row]");
    assertCondition((await rows.count()) >= 4, "typed exception queue rows missing");
    await page.getByTestId("hub-exception-row-exc-loop-031").click();
    await page.waitForFunction(() => {
      const rootNode = document.querySelector("[data-testid='hub-shell-root']");
      return (
        rootNode?.getAttribute("data-selected-case-id") === "hub-case-031" &&
        rootNode?.getAttribute("data-selected-exception-id") === "exc-loop-031"
      );
    });
    await page.getByTestId("HubExceptionDetailDrawer").waitFor();
    assertCondition(
      (await page.locator("[data-hub-exception-row='exc-loop-031']").getAttribute("data-active")) ===
        "true",
      "selected exception row did not activate",
    );

    await page.reload({ waitUntil: "networkidle" });
    await waitForHubRootState(page, {
      currentPath: "/hub/exceptions",
      viewMode: "exceptions",
      selectedCaseId: "hub-case-031",
    });
    assertCondition(
      (await root.getAttribute("data-selected-exception-id")) === "exc-loop-031",
      "selected exception continuity was lost on refresh",
    );

    assertCondition(
      externalRequests.size === 0,
      `unexpected external requests: ${Array.from(externalRequests).join(", ")}`,
    );

    await page.screenshot({ path: outputPath("331-hub-exceptions-workspace.png"), fullPage: true });
    await context.tracing.stop({ path: outputPath("331-hub-exceptions-workspace-trace.zip") });
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
