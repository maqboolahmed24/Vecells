import {
  assertCondition,
  assertNoHorizontalOverflow,
  chooseOption,
  clickPrimary,
  importPlaywright,
  openStartRequest,
  outputPath,
  startPatientWeb,
  startRequestUrl,
  stopPatientWeb,
  waitForSaveState,
} from "./389_embedded_start_request.helpers.ts";

export async function run(): Promise<void> {
  const playwright = await importPlaywright();
  if (!playwright) return;

  const server = await startPatientWeb();
  const browser = await playwright.chromium.launch({ headless: true });

  try {
    const desktopContext = await browser.newContext({ viewport: { width: 1024, height: 900 }, locale: "en-GB" });
    await desktopContext.tracing.start({ screenshots: true, snapshots: true });
    const page = await desktopContext.newPage();

    await openStartRequest(page, startRequestUrl(server.baseUrl, { draft: "dft_389_visual_empty", fixture: "empty" }));
    await page.screenshot({
      path: outputPath("389-embedded-start-request-empty.png"),
      fullPage: true,
      animations: "disabled",
    });
    let frameBox = await page.getByTestId("EmbeddedIntakeQuestionCard").boundingBox();
    assertCondition(Boolean(frameBox && frameBox.width <= 736), "empty question card exceeded 46rem target");

    await openStartRequest(
      page,
      startRequestUrl(server.baseUrl, {
        draft: "dft_389_visual_partial",
        step: "details",
        fixture: "validation",
      }),
    );
    await chooseOption(page, "Fit note");
    await waitForSaveState(page, "saved_authoritative");
    await page.screenshot({
      path: outputPath("389-embedded-start-request-partial.png"),
      fullPage: true,
      animations: "disabled",
    });

    await clickPrimary(page);
    await page.getByTestId("EmbeddedIntakeQuestionCard").waitFor();
    await clickPrimary(page);
    await page.getByTestId("EmbeddedValidationSummaryBar").waitFor();
    await page.screenshot({
      path: outputPath("389-embedded-start-request-error.png"),
      fullPage: true,
      animations: "disabled",
    });

    await openStartRequest(
      page,
      startRequestUrl(server.baseUrl, {
        draft: "dft_389_visual_review",
        step: "review",
        fixture: "review",
      }),
    );
    await page.screenshot({
      path: outputPath("389-embedded-start-request-review.png"),
      fullPage: true,
      animations: "disabled",
    });
    frameBox = await page.getByTestId("EmbeddedReviewWorkspace").boundingBox();
    assertCondition(Boolean(frameBox && frameBox.width <= 736), "review workspace exceeded 46rem target");

    await openStartRequest(
      page,
      startRequestUrl(server.baseUrl, {
        draft: "dft_389_visual_receipt",
        step: "receipt",
        fixture: "receipt",
      }),
    );
    await page.screenshot({
      path: outputPath("389-embedded-start-request-receipt.png"),
      fullPage: true,
      animations: "disabled",
    });
    await assertNoHorizontalOverflow(page, "desktop embedded start request visuals");
    await desktopContext.tracing.stop({ path: outputPath("389-embedded-start-request-visual-trace.zip") });
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
    await openStartRequest(
      narrowPage,
      startRequestUrl(server.baseUrl, {
        draft: "dft_389_visual_narrow",
        step: "receipt",
        fixture: "receipt",
      }),
    );
    await narrowPage.screenshot({
      path: outputPath("389-embedded-start-request-reduced-motion.png"),
      fullPage: true,
      animations: "disabled",
    });
    const actionBox = await narrowPage.getByTestId("EmbeddedSubmitActionBar").boundingBox();
    assertCondition(Boolean(actionBox && actionBox.y + actionBox.height <= 844), "narrow action reserve below viewport");
    await assertNoHorizontalOverflow(narrowPage, "narrow embedded start request visual");
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
