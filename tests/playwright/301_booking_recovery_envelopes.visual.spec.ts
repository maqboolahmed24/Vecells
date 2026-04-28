import {
  assertCondition,
  bookingRecoveryUrl,
  closeServer,
  importPlaywright,
  openBookingRoute,
  outputPath,
  startPatientWeb,
  startRecoveryAtlasServer,
  stopPatientWeb,
} from "./301_booking_recovery_envelopes.helpers.ts";

export const bookingRecoveryEnvelopeVisualCoverage = [
  "atlas renders the booking recovery shell composition and causal strip",
  "workspace recovery desktop screenshot",
  "confirmation identity-hold screenshot",
  "secure-link waitlist contact-repair screenshot",
];

export async function run(): Promise<void> {
  const playwright = await importPlaywright();
  if (!playwright) {
    return;
  }

  const atlasServer = await startRecoveryAtlasServer();
  const { child, baseUrl } = await startPatientWeb();
  const browser = await playwright.chromium.launch({ headless: true });

  try {
    const atlasPage = await browser.newPage({ viewport: { width: 1440, height: 1800 } });
    await atlasPage.goto(atlasServer.atlasUrl, { waitUntil: "load" });
    await atlasPage.locator("[data-testid='booking-recovery-atlas']").waitFor();
    assertCondition(
      await atlasPage.locator("[data-testid='atlas-causal-strip']").isVisible(),
      "atlas causal strip should remain visible",
    );
    await atlasPage.screenshot({
      path: outputPath("301-booking-recovery-atlas.png"),
      fullPage: true,
      animations: "disabled",
      caret: "hide",
    });

    const page = await browser.newPage({ viewport: { width: 1440, height: 1080 } });

    await openBookingRoute(page, bookingRecoveryUrl(baseUrl, "workspaceRecovery"));
    await page.getByTestId("BookingRecoveryShell").waitFor();
    await page.screenshot({
      path: outputPath("301-booking-recovery-workspace.png"),
      fullPage: true,
      animations: "disabled",
      caret: "hide",
    });

    await openBookingRoute(page, bookingRecoveryUrl(baseUrl, "confirmationIdentityHold"));
    await page.getByTestId("BookingIdentityHoldPanel").waitFor();
    await page.screenshot({
      path: outputPath("301-booking-recovery-identity-hold.png"),
      fullPage: true,
      animations: "disabled",
      caret: "hide",
    });

    await openBookingRoute(page, bookingRecoveryUrl(baseUrl, "waitlistContactRepairSecure"));
    await page.getByTestId("BookingSecureLinkRecoveryFrame").waitFor();
    await page.screenshot({
      path: outputPath("301-booking-recovery-secure-contact-repair.png"),
      fullPage: true,
      animations: "disabled",
      caret: "hide",
    });
  } finally {
    await browser.close();
    await stopPatientWeb(child);
    await closeServer(atlasServer.server);
  }
}

if (process.argv.includes("--run")) {
  run().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
