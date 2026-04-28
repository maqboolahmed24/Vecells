import {
  assertCondition,
  assertNoHorizontalOverflow,
  clickPrimary,
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
  const context = await browser.newContext({
    viewport: { width: 430, height: 900 },
    locale: "en-GB",
    timezoneId: "Europe/London",
    userAgent:
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 nhsapp-ios/2.0.0",
  });
  await context.tracing.start({ screenshots: true, snapshots: true });
  const page = await context.newPage();

  try {
    await openEmbeddedBooking(page, embeddedBookingUrl(server.baseUrl, { view: "offers", query: "fixture=live" }));
    await page.getByTestId("EmbeddedBookingOfferRail").waitFor();
    assertCondition(
      (await page.getByTestId("EmbeddedBookingActionReserve").getAttribute("data-actionability")) === "live",
      "offer selection should expose live review actionability",
    );
    assertCondition(
      (await page.getByTestId("EmbeddedReservationTruthBadge").first().getAttribute("data-countdown-mode")) !==
        "hold_expiry",
      "nonexclusive fixture must not imply a hold countdown",
    );
    await clickPrimary(page);
    await page.getByTestId("EmbeddedBookingConfirmationFrame").waitFor();
    assertCondition(
      (await page.getByTestId("EmbeddedBookingFrame").getAttribute("data-route-key")) === "confirmation",
      "primary offer action did not stay in booking confirmation route",
    );
    await clickPrimary(page);
    await page.getByTestId("EmbeddedBookingFrame").waitFor();
    assertCondition(
      (await page.getByTestId("EmbeddedBookingHeaderSummary").textContent())?.includes("confirmed"),
      "confirmation primary action did not settle confirmed truth",
    );
    await assertNoHorizontalOverflow(page, "selection to confirmation");
    await context.tracing.stop({ path: outputPath("391-selection-to-confirmation-trace.zip") });
  } finally {
    await context.close();
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
