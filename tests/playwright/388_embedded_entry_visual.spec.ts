import {
  assertCondition,
  assertNoHorizontalOverflow,
  entryUrl,
  importPlaywright,
  openEntryRoute,
  outputPath,
  startPatientWeb,
  stopPatientWeb,
} from "./388_embedded_entry.helpers.ts";

export async function run(): Promise<void> {
  const playwright = await importPlaywright();
  if (!playwright) return;

  const server = await startPatientWeb();
  const browser = await playwright.chromium.launch({ headless: true });

  try {
    const desktopContext = await browser.newContext({ viewport: { width: 1024, height: 900 } });
    await desktopContext.tracing.start({ screenshots: true, snapshots: true });
    const desktopPage = await desktopContext.newPage();
    await openEntryRoute(desktopPage, entryUrl(server.baseUrl, { entry: "landing", route: "request_status" }));
    await desktopPage.screenshot({
      path: outputPath("388-embedded-entry-landing.png"),
      fullPage: true,
      animations: "disabled",
    });
    let cardBox = await desktopPage.getByTestId("EmbeddedEntryStatusCard").boundingBox();
    assertCondition(Boolean(cardBox && cardBox.width <= 540 && cardBox.height > 170), "landing card sizing drifted");
    await assertNoHorizontalOverflow(desktopPage, "desktop landing entry");

    await openEntryRoute(desktopPage, entryUrl(server.baseUrl, { entry: "confirming", route: "request_status" }));
    await desktopPage.screenshot({
      path: outputPath("388-embedded-entry-confirming.png"),
      fullPage: true,
      animations: "disabled",
    });
    await assertNoHorizontalOverflow(desktopPage, "desktop confirming entry");

    await openEntryRoute(desktopPage, entryUrl(server.baseUrl, { entry: "wrong_context", route: "appointment_manage" }));
    await desktopPage.screenshot({
      path: outputPath("388-embedded-entry-recovery.png"),
      fullPage: true,
      animations: "disabled",
    });
    await desktopContext.tracing.stop({ path: outputPath("388-embedded-entry-visual-trace.zip") });
    await desktopContext.close();

    const narrowContext = await browser.newContext({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
      locale: "en-GB",
      userAgent:
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 nhsapp-ios/2.0.0",
    });
    const narrowPage = await narrowContext.newPage();
    await openEntryRoute(narrowPage, entryUrl(server.baseUrl, { entry: "landing", route: "request_status" }));
    await narrowPage.screenshot({
      path: outputPath("388-embedded-entry-narrow.png"),
      fullPage: true,
      animations: "disabled",
    });
    cardBox = await narrowPage.getByTestId("EmbeddedEntryStatusCard").boundingBox();
    const actionBox = await narrowPage.getByTestId("EmbeddedEntryActionCluster").boundingBox();
    assertCondition(Boolean(cardBox && cardBox.width >= 330 && cardBox.width <= 390), "narrow card not framed");
    assertCondition(Boolean(actionBox && actionBox.y + actionBox.height <= 844), "action cluster below viewport");
    await assertNoHorizontalOverflow(narrowPage, "narrow entry");
    await narrowContext.close();

    const reducedMotionContext = await browser.newContext({
      viewport: { width: 430, height: 900 },
      reducedMotion: "reduce",
    });
    const reducedMotionPage = await reducedMotionContext.newPage();
    await openEntryRoute(
      reducedMotionPage,
      entryUrl(server.baseUrl, { entry: "safe_reentry", route: "record_letter_summary" }),
    );
    await reducedMotionPage.screenshot({
      path: outputPath("388-embedded-entry-reduced-motion.png"),
      fullPage: true,
      animations: "disabled",
    });
    assertCondition(
      (await reducedMotionPage.getByTestId("EmbeddedEntryCorridorRoot").getAttribute("data-posture")) ===
        "safe_reentry",
      "reduced-motion safe re-entry posture missing",
    );
    await assertNoHorizontalOverflow(reducedMotionPage, "reduced-motion entry");
    await reducedMotionContext.close();
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
