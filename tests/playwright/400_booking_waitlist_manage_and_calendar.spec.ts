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
import { makeBridgeFixture } from "./381_nhs_app_bridge.helpers.ts";

export async function run(): Promise<void> {
  const playwright = await importPlaywright();
  if (!playwright) return;

  const server = await startPatientWeb();
  const browser = await playwright.chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 430, height: 900 },
    hasTouch: true,
    locale: "en-GB",
    timezoneId: "Europe/London",
    userAgent:
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 nhsapp-ios/2.0.0",
  });
  await context.tracing.start({ screenshots: true, snapshots: true });
  const page = await context.newPage();

  try {
    await openEmbeddedBooking(
      page,
      embeddedBookingUrl(server.baseUrl, { view: "offers", query: "fixture=live" }),
    );
    await page.getByTestId("EmbeddedBookingOfferRail").waitFor();
    assertCondition(
      (await page
        .getByTestId("EmbeddedBookingActionReserve")
        .getAttribute("data-actionability")) === "live",
      "offer selection should be live",
    );
    await clickPrimary(page);
    await page.getByTestId("EmbeddedBookingConfirmationFrame").waitFor();

    await openEmbeddedBooking(
      page,
      embeddedBookingUrl(server.baseUrl, {
        view: "alternatives",
        query: "fixture=alternatives-drifted",
      }),
    );
    await page.getByTestId("EmbeddedAlternativeOfferStack").waitFor();
    assertCondition(
      (await page
        .getByTestId("EmbeddedAlternativeOfferStack")
        .getAttribute("data-actionability")) !== "live_open_choice",
      "drifted alternative offers should not stay live open choice",
    );
    await page.getByTestId("EmbeddedBookingRecoveryBanner").waitFor();

    await openEmbeddedBooking(
      page,
      embeddedBookingUrl(server.baseUrl, { view: "waitlist", query: "fixture=waitlist-offer" }),
    );
    await page.getByTestId("EmbeddedWaitlistOfferCard").waitFor();
    assertCondition(
      (await page.getByTestId("EmbeddedWaitlistOfferCard").getAttribute("data-waitlist-state")) ===
        "offer_available",
      "waitlist offer should be available",
    );
    await clickPrimary(page);
    await page.getByTestId("EmbeddedBookingConfirmationFrame").waitFor();

    await openEmbeddedBooking(
      page,
      embeddedBookingUrl(server.baseUrl, { view: "manage", query: "fixture=manage" }),
    );
    await page.getByTestId("EmbeddedManageAppointmentWorkspace").waitFor();
    assertCondition(
      (await page
        .getByTestId("EmbeddedManageAppointmentWorkspace")
        .getAttribute("data-manage-exposure")) === "writable",
      "manage appointment should stay writable",
    );
    await clickPrimary(page);
    await page.getByTestId("EmbeddedCalendarActionCard").waitFor();
    assertCondition(
      (await page
        .getByTestId("EmbeddedCalendarActionCard")
        .getAttribute("data-calendar-capability")) === "available",
      "calendar handoff should be available when bridge supports it",
    );
    await clickPrimary(page);
    assertCondition(
      await page.getByText("Calendar handoff queued through the bridge wrapper.").isVisible(),
      "calendar handoff did not queue through bridge wrapper",
    );

    const supported = makeBridgeFixture({ platform: "ios" });
    let callbackCount = 0;
    assertCondition(
      supported.bridge.setBackAction(() => {
        callbackCount += 1;
      }).ok,
      "native back lease did not install",
    );
    supported.fakeApi.triggerBackAction();
    assertCondition(callbackCount === 1, "native back callback did not execute");
    const stale = supported.bridge.clearForFenceDrift({
      manifestVersionRef: "nhsapp-manifest-drifted",
    });
    assertCondition(
      stale[0]?.leaseState === "stale",
      "manifest drift should stale native back lease",
    );
    supported.fakeApi.triggerBackAction();
    assertCondition(callbackCount === 1, "stale native back callback still fired");

    const unsupportedCalendar = makeBridgeFixture({
      platform: "android",
      missingMethods: ["addToCalendar"],
    }).bridge.addToCalendar({
      subject: "Appointment",
      body: "Appointment details",
      location: "Clinic",
      startTimeEpochInSeconds: 1_775_000_000,
    });
    assertCondition(
      unsupportedCalendar.blockedReason === "bridge_action_not_visible" ||
        unsupportedCalendar.blockedReason === "runtime_method_missing",
      "missing calendar bridge capability should fail closed",
    );

    await openEmbeddedBooking(
      page,
      embeddedBookingUrl(server.baseUrl, { view: "recovery", query: "fixture=recovery" }),
    );
    await page.getByTestId("EmbeddedBookingRecoveryBanner").waitFor();
    assertCondition(
      Boolean(await page.getByTestId("EmbeddedBookingFrame").getAttribute("data-selected-anchor")),
      "booking re-entry lost selected anchor",
    );
    await assertNoHorizontalOverflow(page, "400 booking waitlist manage calendar");
    await context.tracing.stop({
      path: outputPath("400-booking-waitlist-manage-calendar-trace.zip"),
    });
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
