import {
  assertCondition,
  assertNoHorizontalOverflow,
  embeddedRecoveryUrl,
  importPlaywright,
  openEmbeddedRecovery,
  outputPath,
  startPatientWeb,
  stopPatientWeb,
} from "./393_embedded_recovery.helpers.ts";

export async function run(): Promise<void> {
  const playwright = await importPlaywright();
  if (!playwright) return;

  const server = await startPatientWeb();
  const browser = await playwright.chromium.launch({ headless: true });

  try {
    const desktopContext = await browser.newContext({ viewport: { width: 1024, height: 900 }, locale: "en-GB" });
    const page = await desktopContext.newPage();

    await openEmbeddedRecovery(
      page,
      embeddedRecoveryUrl(server.baseUrl, { view: "artifact-summary", query: "fixture=artifact-summary" }),
    );
    await page.screenshot({
      path: outputPath("393-embedded-recovery-artifact-summary.png"),
      fullPage: true,
      animations: "disabled",
    });
    const summaryBox = await page.getByTestId("EmbeddedArtifactSummarySurface").boundingBox();
    assertCondition(Boolean(summaryBox && summaryBox.width <= 640), "artifact summary exceeded 40rem target");

    await openEmbeddedRecovery(
      page,
      embeddedRecoveryUrl(server.baseUrl, { view: "download-progress", query: "fixture=download-progress" }),
    );
    await page.screenshot({
      path: outputPath("393-embedded-recovery-download-progress.png"),
      fullPage: true,
      animations: "disabled",
    });

    await openEmbeddedRecovery(
      page,
      embeddedRecoveryUrl(server.baseUrl, { view: "route-freeze", query: "fixture=route-freeze" }),
    );
    await page.screenshot({
      path: outputPath("393-embedded-recovery-route-freeze.png"),
      fullPage: true,
      animations: "disabled",
    });
    await assertNoHorizontalOverflow(page, "desktop embedded recovery visuals");
    await desktopContext.close();

    const narrowContext = await browser.newContext({
      viewport: { width: 390, height: 844 },
      hasTouch: true,
      reducedMotion: "reduce",
      locale: "en-GB",
      userAgent:
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 nhsapp-ios/2.0.0",
    });
    const narrowPage = await narrowContext.newPage();
    await openEmbeddedRecovery(
      narrowPage,
      embeddedRecoveryUrl(narrowContext ? server.baseUrl : server.baseUrl, {
        view: "unsupported-action",
        query: "fixture=unsupported-action",
      }),
    );
    await narrowPage.screenshot({
      path: outputPath("393-embedded-recovery-unsupported-narrow.png"),
      fullPage: true,
      animations: "disabled",
    });
    const actionRect = await narrowPage.getByTestId("EmbeddedRecoveryActionCluster").evaluate((node: HTMLElement) => {
      const rect = node.getBoundingClientRect();
      return { bottom: rect.bottom, top: rect.top };
    });
    assertCondition(actionRect.bottom <= 844 && actionRect.top >= 0, "narrow action cluster below viewport");
    await assertNoHorizontalOverflow(narrowPage, "narrow embedded recovery visuals");
    await narrowContext.close();
  } finally {
    await browser.close();
    await stopPatientWeb(server.child);
  }
}

if (process.argv.includes("--run")) {
  run().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
