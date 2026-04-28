import {
  assertCondition,
  assertNoHorizontalOverflow,
  embeddedPharmacyUrl,
  importPlaywright,
  openEmbeddedPharmacy,
  outputPath,
  startPatientWeb,
  stopPatientWeb,
} from "./392_embedded_pharmacy.helpers.ts";

export async function run(): Promise<void> {
  const playwright = await importPlaywright();
  if (!playwright) return;

  const server = await startPatientWeb();
  const browser = await playwright.chromium.launch({ headless: true });

  try {
    const desktopContext = await browser.newContext({ viewport: { width: 1024, height: 900 }, locale: "en-GB" });
    await desktopContext.tracing.start({ screenshots: true, snapshots: true });
    const page = await desktopContext.newPage();

    await openEmbeddedPharmacy(page, embeddedPharmacyUrl(server.baseUrl, { view: "choice", query: "fixture=choice" }));
    await page.screenshot({
      path: outputPath("392-embedded-pharmacy-choice.png"),
      fullPage: true,
      animations: "disabled",
    });
    const summaryBox = await page.getByTestId("EmbeddedChosenPharmacyCard").boundingBox();
    assertCondition(Boolean(summaryBox && summaryBox.width <= 720), "pharmacy summary exceeded 45rem target");

    await openEmbeddedPharmacy(
      page,
      embeddedPharmacyUrl(server.baseUrl, { pharmacyCaseId: "PHC-2156", view: "choice", query: "fixture=proof-refresh" }),
    );
    await page.screenshot({
      path: outputPath("392-embedded-pharmacy-proof-refresh.png"),
      fullPage: true,
      animations: "disabled",
    });

    await openEmbeddedPharmacy(
      page,
      embeddedPharmacyUrl(server.baseUrl, { pharmacyCaseId: "PHC-2196", view: "outcome", query: "fixture=completed" }),
    );
    await page.screenshot({
      path: outputPath("392-embedded-pharmacy-outcome.png"),
      fullPage: true,
      animations: "disabled",
    });
    await assertNoHorizontalOverflow(page, "desktop embedded pharmacy visuals");
    await desktopContext.tracing.stop({ path: outputPath("392-embedded-pharmacy-visual-trace.zip") });
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
    await openEmbeddedPharmacy(
      narrowPage,
      embeddedPharmacyUrl(server.baseUrl, { pharmacyCaseId: "PHC-2103", view: "recovery", query: "fixture=urgent-return" }),
    );
    await narrowPage.screenshot({
      path: outputPath("392-embedded-pharmacy-urgent-reduced-motion.png"),
      fullPage: true,
      animations: "disabled",
    });
    const actionRect = await narrowPage.getByTestId("EmbeddedPharmacyActionReserve").evaluate((node: HTMLElement) => {
      const rect = node.getBoundingClientRect();
      return { bottom: rect.bottom, top: rect.top };
    });
    assertCondition(actionRect.bottom <= 844 && actionRect.top >= 0, "narrow action reserve below viewport");
    await assertNoHorizontalOverflow(narrowPage, "narrow embedded pharmacy visuals");
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
