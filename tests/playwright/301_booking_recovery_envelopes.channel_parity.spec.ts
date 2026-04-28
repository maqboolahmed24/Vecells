import {
  assertCondition,
  bookingRecoveryUrl,
  importPlaywright,
  openBookingRoute,
  readRecoveryMarkers,
  startPatientWeb,
  stopPatientWeb,
} from "./301_booking_recovery_envelopes.helpers.ts";

export const bookingRecoveryEnvelopeChannelParityCoverage = [
  "authenticated and secure-link waitlist contact-repair routes expose the same recovery reason and next safe action",
  "secure-link recovery adds the secure-link frame without changing the underlying recovery tuple language",
  "secure-link contact repair returns to the secure-link waitlist continuation after the repair action",
];

export async function run(): Promise<void> {
  const playwright = await importPlaywright();
  if (!playwright) {
    return;
  }

  const { child, baseUrl } = await startPatientWeb();
  const browser = await playwright.chromium.launch({ headless: true });

  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1080 } });

    await openBookingRoute(page, bookingRecoveryUrl(baseUrl, "waitlistContactRepair"));
    const authenticatedMarkers = await readRecoveryMarkers(page);
    const authenticatedReasonHeading =
      (await page.getByTestId("BookingRecoveryReasonPanel").locator("h3").textContent()) ?? "";
    const authenticatedPrimaryLabel =
      (await page.getByTestId("booking-recovery-action-open_contact_repair").textContent()) ?? "";

    await openBookingRoute(page, bookingRecoveryUrl(baseUrl, "waitlistContactRepairSecure"));
    const secureMarkers = await readRecoveryMarkers(page);
    const secureReasonHeading =
      (await page.getByTestId("BookingRecoveryReasonPanel").locator("h3").textContent()) ?? "";
    const securePrimaryLabel =
      (await page.getByTestId("booking-recovery-action-open_contact_repair").textContent()) ?? "";

    assertCondition(
      authenticatedMarkers.reason === secureMarkers.reason,
      "secure-link recovery reason drifted away from the authenticated route",
    );
    assertCondition(
      authenticatedMarkers.nextSafeAction === secureMarkers.nextSafeAction,
      "secure-link next safe action drifted away from the authenticated route",
    );
    assertCondition(
      authenticatedMarkers.summaryTier === secureMarkers.summaryTier,
      "secure-link summary tier drifted away from the authenticated route",
    );
    assertCondition(
      authenticatedReasonHeading === secureReasonHeading,
      "secure-link recovery heading should stay aligned with the authenticated route",
    );
    assertCondition(
      authenticatedPrimaryLabel === securePrimaryLabel,
      "secure-link dominant recovery action label should stay aligned with the authenticated route",
    );
    assertCondition(
      secureMarkers.channelMode === "secure_link",
      "secure-link route should expose secure_link channel mode",
    );
    assertCondition(
      await page.getByTestId("BookingSecureLinkRecoveryFrame").isVisible(),
      "secure-link recovery should render the secure-link frame",
    );
    assertCondition(
      (await page.getByTestId("booking-return-contract-binder").getAttribute("data-return-route-ref")) ===
        "/recovery/secure-link",
      "secure-link return contract drifted",
    );

    await page.getByTestId("booking-recovery-action-open_contact_repair").click();
    await page.waitForFunction(() => {
      const route = document.querySelector("[data-testid='patient-waitlist-stage']");
      return (
        route?.getAttribute("data-entry-mode") === "secure_link" &&
        route?.getAttribute("data-waitlist-state") === "offer_actionable" &&
        !document.querySelector("[data-testid='BookingRecoveryShell']")
      );
    });
    assertCondition(
      await page.getByTestId("waitlist-secure-link-banner").isVisible(),
      "secure-link repair return should reopen the secure-link waitlist continuation",
    );
  } finally {
    await browser.close();
    await stopPatientWeb(child);
  }
}

if (process.argv.includes("--run")) {
  run().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
