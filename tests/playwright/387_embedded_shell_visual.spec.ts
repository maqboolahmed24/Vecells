import {
  assertCondition,
  assertNoHorizontalOverflow,
  embeddedShellUrl,
  importPlaywright,
  openShellRoute,
  outputPath,
  standaloneShellUrl,
  startPatientWeb,
  stopPatientWeb,
} from "./387_embedded_shell.helpers.ts";

export async function run(): Promise<void> {
  const playwright = await importPlaywright();
  if (!playwright) return;

  const server = await startPatientWeb();
  const browser = await playwright.chromium.launch({ headless: true });

  try {
    const context = await browser.newContext({ viewport: { width: 1180, height: 900 } });
    await context.tracing.start({ screenshots: true, snapshots: true });
    const page = await context.newPage();

    await openShellRoute(page, standaloneShellUrl(server.baseUrl));
    await page.screenshot({
      path: outputPath("387-embedded-shell-standalone.png"),
      fullPage: true,
      animations: "disabled",
    });
    let rootBox = await page.getByTestId("EmbeddedPatientShellRoot").boundingBox();
    assertCondition(Boolean(rootBox && rootBox.width > 900 && rootBox.height > 500), "standalone shell not visible");
    await assertNoHorizontalOverflow(page, "visual standalone");

    await openShellRoute(page, embeddedShellUrl(server.baseUrl));
    await page.screenshot({
      path: outputPath("387-embedded-shell-embedded.png"),
      fullPage: true,
      animations: "disabled",
    });
    rootBox = await page.getByTestId("EmbeddedSafeAreaContainer").boundingBox();
    assertCondition(Boolean(rootBox && rootBox.width > 320 && rootBox.width < 760), "embedded safe area not framed");
    await assertNoHorizontalOverflow(page, "visual embedded");
    await context.tracing.stop({ path: outputPath("387-embedded-shell-visual-trace.zip") });
    await context.close();

    const narrowContext = await browser.newContext({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
      locale: "en-GB",
      userAgent:
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 nhsapp-ios/2.0.0",
    });
    const narrowPage = await narrowContext.newPage();
    await openShellRoute(narrowPage, embeddedShellUrl(server.baseUrl));
    await narrowPage.screenshot({
      path: outputPath("387-embedded-shell-narrow-embedded.png"),
      fullPage: true,
      animations: "disabled",
    });
    rootBox = await narrowPage.getByTestId("EmbeddedPatientShellRoot").boundingBox();
    assertCondition(Boolean(rootBox && rootBox.width >= 360 && rootBox.height > 700), "narrow embedded shell not visible");
    await assertNoHorizontalOverflow(narrowPage, "visual narrow embedded");
    await narrowContext.close();

    const reducedMotionContext = await browser.newContext({
      viewport: { width: 430, height: 900 },
      reducedMotion: "reduce",
    });
    const reducedMotionPage = await reducedMotionContext.newPage();
    await openShellRoute(reducedMotionPage, embeddedShellUrl(server.baseUrl));
    await reducedMotionPage.screenshot({
      path: outputPath("387-embedded-shell-reduced-motion.png"),
      fullPage: true,
      animations: "disabled",
    });
    assertCondition(
      (await reducedMotionPage.getByTestId("EmbeddedPatientShellRoot").getAttribute("data-shell-mode")) ===
        "embedded",
      "reduced-motion embedded shell missing",
    );
    await assertNoHorizontalOverflow(reducedMotionPage, "visual reduced motion");
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
