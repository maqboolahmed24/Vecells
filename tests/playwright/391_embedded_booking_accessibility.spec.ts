import {
  assertCondition,
  assertNoHorizontalOverflow,
  embeddedBookingUrl,
  importPlaywright,
  openEmbeddedBooking,
  startPatientWeb,
  stopPatientWeb,
  writeAriaSnapshot,
} from "./391_embedded_booking.helpers.ts";

export async function run(): Promise<void> {
  const playwright = await importPlaywright();
  if (!playwright) return;

  const server = await startPatientWeb();
  const browser = await playwright.chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    reducedMotion: "reduce",
    locale: "en-GB",
  });
  const page = await context.newPage();

  try {
    await openEmbeddedBooking(page, embeddedBookingUrl(server.baseUrl, { view: "offers", query: "fixture=live" }));
    const offerSnapshot = await writeAriaSnapshot(
      page.getByTestId("EmbeddedBookingOfferRail"),
      "391-embedded-booking-offer-rail.aria.yml",
    );
    assertCondition(offerSnapshot.includes("Available appointments"), "offer rail ARIA snapshot missing heading");
    assertCondition(offerSnapshot.includes("Review selected time"), "offer rail ARIA snapshot missing selected offer action");

    const actionSnapshot = await writeAriaSnapshot(
      page.getByTestId("EmbeddedBookingActionReserve"),
      "391-embedded-booking-action-reserve.aria.yml",
    );
    assertCondition(actionSnapshot.includes("Review this appointment"), "action reserve ARIA snapshot missing primary action");

    await openEmbeddedBooking(page, embeddedBookingUrl(server.baseUrl, { view: "manage", query: "fixture=manage" }));
    const manageSnapshot = await writeAriaSnapshot(
      page.getByTestId("EmbeddedManageAppointmentWorkspace"),
      "391-embedded-booking-manage.aria.yml",
    );
    assertCondition(manageSnapshot.includes("Manage appointment"), "manage ARIA snapshot missing heading");
    assertCondition(manageSnapshot.includes("Add to calendar"), "manage ARIA snapshot missing calendar action");

    const landmarkCount = await page
      .locator("main, header[role='banner'], nav[aria-label], aside[aria-label], section[aria-labelledby]")
      .count();
    assertCondition(landmarkCount >= 6, `expected labelled embedded booking landmarks, found ${landmarkCount}`);
    assertCondition((await page.locator("main").count()) === 1, "embedded booking route should expose one main landmark");
    const actionRect = await page.getByTestId("EmbeddedBookingActionReserve").evaluate((node: HTMLElement) => {
      const rect = node.getBoundingClientRect();
      return { bottom: rect.bottom, top: rect.top };
    });
    assertCondition(actionRect.bottom <= 844 && actionRect.top >= 0, "sticky action reserve below viewport");
    await assertNoHorizontalOverflow(page, "embedded booking accessibility");
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
