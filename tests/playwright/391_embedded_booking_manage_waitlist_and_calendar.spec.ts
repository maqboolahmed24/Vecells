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
  const context = await browser.newContext({ viewport: { width: 430, height: 900 }, locale: "en-GB" });
  await context.tracing.start({ screenshots: true, snapshots: true });
  const page = await context.newPage();

  try {
    await openEmbeddedBooking(page, embeddedBookingUrl(server.baseUrl, { view: "waitlist", query: "fixture=waitlist-offer" }));
    await page.getByTestId("EmbeddedWaitlistOfferCard").waitFor();
    assertCondition(
      (await page.getByTestId("EmbeddedWaitlistOfferCard").getAttribute("data-waitlist-state")) === "offer_available",
      "waitlist offer fixture should be offer_available",
    );
    await clickPrimary(page);
    await page.getByTestId("EmbeddedBookingConfirmationFrame").waitFor();

    await openEmbeddedBooking(page, embeddedBookingUrl(server.baseUrl, { view: "manage", query: "fixture=manage" }));
    await page.getByTestId("EmbeddedManageAppointmentWorkspace").waitFor();
    assertCondition(
      (await page.getByTestId("EmbeddedManageAppointmentWorkspace").getAttribute("data-manage-exposure")) === "writable",
      "manage fixture should remain writable inside the shell",
    );
    await clickPrimary(page);
    await page.getByTestId("EmbeddedCalendarActionCard").waitFor();
    assertCondition(
      (await page.getByTestId("EmbeddedCalendarActionCard").getAttribute("data-calendar-capability")) === "available",
      "confirmed appointment should expose bridge-gated calendar action",
    );
    await clickPrimary(page);
    assertCondition(
      await page.getByText("Calendar handoff queued through the bridge wrapper.").isVisible(),
      "calendar action did not route through governed bridge surface",
    );

    await openEmbeddedBooking(
      page,
      embeddedBookingUrl(server.baseUrl, { view: "alternatives", query: "fixture=alternatives-drifted" }),
    );
    await page.getByTestId("EmbeddedAlternativeOfferStack").waitFor();
    assertCondition(
      (await page.getByTestId("EmbeddedAlternativeOfferStack").getAttribute("data-actionability")) !==
        "live_open_choice",
      "drifted alternatives must not keep live open-choice controls",
    );
    await page.getByTestId("EmbeddedBookingRecoveryBanner").waitFor();
    await assertNoHorizontalOverflow(page, "manage waitlist calendar");
    await context.tracing.stop({ path: outputPath("391-manage-waitlist-calendar-trace.zip") });
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

