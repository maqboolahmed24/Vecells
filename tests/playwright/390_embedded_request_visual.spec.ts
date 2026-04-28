import {
  assertCondition,
  assertNoHorizontalOverflow,
  embeddedRequestUrl,
  importPlaywright,
  openEmbeddedRequest,
  outputPath,
  startPatientWeb,
  stopPatientWeb,
} from "./390_embedded_request.helpers.ts";

export async function run(): Promise<void> {
  const playwright = await importPlaywright();
  if (!playwright) return;

  const server = await startPatientWeb();
  const browser = await playwright.chromium.launch({ headless: true });

  try {
    const desktopContext = await browser.newContext({ viewport: { width: 1024, height: 900 }, locale: "en-GB" });
    await desktopContext.tracing.start({ screenshots: true, snapshots: true });
    const page = await desktopContext.newPage();

    await openEmbeddedRequest(page, embeddedRequestUrl(server.baseUrl, { view: "status", query: "fixture=status" }));
    await page.screenshot({
      path: outputPath("390-embedded-request-status-calm.png"),
      fullPage: true,
      animations: "disabled",
    });
    let box = await page.getByTestId("EmbeddedRequestHeaderSummary").boundingBox();
    assertCondition(Boolean(box && box.width <= 736), "status summary exceeded 46rem target");

    await openEmbeddedRequest(page, embeddedRequestUrl(server.baseUrl, { view: "more-info", query: "fixture=more-info" }));
    await page.screenshot({
      path: outputPath("390-embedded-request-status-more-info.png"),
      fullPage: true,
      animations: "disabled",
    });

    await openEmbeddedRequest(page, embeddedRequestUrl(server.baseUrl, { view: "callback", query: "fixture=callback" }));
    await page.screenshot({
      path: outputPath("390-embedded-request-status-callback.png"),
      fullPage: true,
      animations: "disabled",
    });

    await openEmbeddedRequest(page, embeddedRequestUrl(server.baseUrl, { view: "recovery", query: "fixture=recovery" }));
    await page.screenshot({
      path: outputPath("390-embedded-request-status-recovery.png"),
      fullPage: true,
      animations: "disabled",
    });
    await assertNoHorizontalOverflow(page, "desktop embedded request visuals");
    await desktopContext.tracing.stop({ path: outputPath("390-embedded-request-visual-trace.zip") });
    await desktopContext.close();

    const narrowContext = await browser.newContext({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
      reducedMotion: "reduce",
      locale: "en-GB",
      userAgent:
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 nhsapp-ios/2.0.0",
    });
    const narrowPage = await narrowContext.newPage();
    await openEmbeddedRequest(narrowPage, embeddedRequestUrl(server.baseUrl, { view: "messages", query: "fixture=messages" }));
    await narrowPage.screenshot({
      path: outputPath("390-embedded-request-status-reduced-motion.png"),
      fullPage: true,
      animations: "disabled",
    });
    box = await narrowPage.getByTestId("EmbeddedRequestActionReserve").boundingBox();
    assertCondition(Boolean(box && box.y + box.height <= 844), "narrow action reserve below viewport");
    await assertNoHorizontalOverflow(narrowPage, "narrow embedded request visuals");
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
