import {
  assertCondition,
  assertNoHorizontalOverflow,
  embeddedBookingUrl,
  importPlaywright,
  openEmbeddedBooking,
  outputPath,
  startPatientWeb,
  stopPatientWeb,
} from "./391_embedded_booking.helpers.ts";

export async function run(): Promise<void> {
  const playwright = await importPlaywright();
  if (!playwright) return;

  const server = await startPatientWeb();
  const browser = await playwright.chromium.launch({ headless: true });

  try {
    const desktopContext = await browser.newContext({ viewport: { width: 1024, height: 900 }, locale: "en-GB" });
    await desktopContext.tracing.start({ screenshots: true, snapshots: true });
    const page = await desktopContext.newPage();

    await openEmbeddedBooking(page, embeddedBookingUrl(server.baseUrl, { view: "offers", query: "fixture=exclusive-hold" }));
    await page.screenshot({
      path: outputPath("391-embedded-booking-offers-held.png"),
      fullPage: true,
      animations: "disabled",
    });
    let box = await page.getByTestId("EmbeddedBookingHeaderSummary").boundingBox();
    assertCondition(Boolean(box && box.width <= 768), "booking summary exceeded 48rem target");
    assertCondition(
      (await page.getByTestId("EmbeddedReservationTruthBadge").first().getAttribute("data-countdown-mode")) ===
        "hold_expiry",
      "exclusive hold visual should expose real hold expiry mode",
    );

    await openEmbeddedBooking(page, embeddedBookingUrl(server.baseUrl, { view: "waitlist", query: "fixture=waitlist-offer" }));
    await page.screenshot({
      path: outputPath("391-embedded-booking-waitlist-offer.png"),
      fullPage: true,
      animations: "disabled",
    });

    await openEmbeddedBooking(page, embeddedBookingUrl(server.baseUrl, { view: "confirmation", query: "fixture=confirmed" }));
    await page.screenshot({
      path: outputPath("391-embedded-booking-confirmed.png"),
      fullPage: true,
      animations: "disabled",
    });

    await openEmbeddedBooking(
      page,
      embeddedBookingUrl(server.baseUrl, { view: "alternatives", query: "fixture=alternatives-drifted" }),
    );
    await page.screenshot({
      path: outputPath("391-embedded-booking-read-only-provenance.png"),
      fullPage: true,
      animations: "disabled",
    });
    await assertNoHorizontalOverflow(page, "desktop embedded booking visuals");
    await desktopContext.tracing.stop({ path: outputPath("391-embedded-booking-visual-trace.zip") });
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
    await openEmbeddedBooking(narrowPage, embeddedBookingUrl(server.baseUrl, { view: "calendar", query: "fixture=calendar" }));
    await narrowPage.screenshot({
      path: outputPath("391-embedded-booking-calendar-reduced-motion.png"),
      fullPage: true,
      animations: "disabled",
    });
    const actionRect = await narrowPage.getByTestId("EmbeddedBookingActionReserve").evaluate((node: HTMLElement) => {
      const rect = node.getBoundingClientRect();
      return { bottom: rect.bottom, top: rect.top };
    });
    assertCondition(actionRect.bottom <= 844 && actionRect.top >= 0, "narrow action reserve below viewport");
    await assertNoHorizontalOverflow(narrowPage, "narrow embedded booking visuals");
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
