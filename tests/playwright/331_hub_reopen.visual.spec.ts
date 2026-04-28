import {
  assertCondition,
  assertNoHorizontalOverflow,
  importPlaywright,
  openHubRoute,
  outputPath,
  startHubDesk,
  stopHubDesk,
} from "./327_hub_queue.helpers";

export const hubRecoveryVisualCoverage = [
  "desktop reopen diff baseline",
  "tablet exceptions workspace baseline",
  "narrow urgent recovery baseline",
];

export async function run(): Promise<void> {
  const playwright = await importPlaywright();
  if (!playwright) {
    return;
  }

  const { child, baseUrl } = await startHubDesk();
  const browser = await playwright.chromium.launch({ headless: true });

  try {
    const page = await browser.newPage({ viewport: { width: 1600, height: 1220 } });
    await openHubRoute(page, `${baseUrl}/hub/case/hub-case-041`, "hub-case-route");
    await page.getByTestId("HubRecoveryDiffStrip").waitFor();
    assertCondition(
      (await page.getByTestId("HubRecoveryDiffStrip").getAttribute("data-reopen-diff")) ===
        "reopen-diff-041",
      "reopen diff marker drifted",
    );
    await assertNoHorizontalOverflow(page, "331 desktop reopen diff");
    await page.screenshot({ path: outputPath("331-hub-reopen-desktop.png"), fullPage: true });

    await page.setViewportSize({ width: 1180, height: 1024 });
    await openHubRoute(page, `${baseUrl}/hub/exceptions`, "HubExceptionQueueView");
    await assertNoHorizontalOverflow(page, "331 tablet exception workspace");
    await page.screenshot({ path: outputPath("331-hub-exceptions-tablet.png"), fullPage: true });

    await page.setViewportSize({ width: 412, height: 915 });
    await openHubRoute(page, `${baseUrl}/hub/case/hub-case-031`, "hub-case-route");
    await page.getByTestId("HubUrgentBounceBackBanner").waitFor();
    await assertNoHorizontalOverflow(page, "331 narrow urgent recovery");
    await page.screenshot({ path: outputPath("331-hub-urgent-mobile.png"), fullPage: true });
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
