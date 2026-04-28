import {
  assertCondition,
  bookingArtifactUrl,
  closeServer,
  importPlaywright,
  openBookingRoute,
  outputPath,
  startArtifactAtlasServer,
  startPatientWeb,
  stopPatientWeb,
  trackExternalRequests,
} from "./303_booking_artifact_parity.helpers.ts";

export const bookingArtifactParityVisualCoverage = [
  "atlas documents the premium receipt framing and parity rail",
  "confirmed receipt renders as a centered document-like artifact frame",
  "manage directions mode keeps the appointment summary primary while handoff guidance stays secondary",
  "embedded artifact mode degrades print and browser handoff into summary-safe posture",
];

export async function run(): Promise<void> {
  const playwright = await importPlaywright();
  if (!playwright) {
    return;
  }

  const { child, baseUrl } = await startPatientWeb();
  const atlas = await startArtifactAtlasServer();
  const browser = await playwright.chromium.launch({ headless: true });

  try {
    const desktopContext = await browser.newContext({ viewport: { width: 1440, height: 1080 } });
    const desktopPage = await desktopContext.newPage();
    const externalRequests = new Set<string>();

    await desktopPage.goto(atlas.atlasUrl, { waitUntil: "load" });
    await desktopPage.getByTestId("booking-artifact-parity-atlas").waitFor();
    await desktopPage.screenshot({
      path: outputPath("303-booking-artifact-parity-atlas.png"),
      fullPage: true,
      animations: "disabled",
      caret: "hide",
    });

    trackExternalRequests(desktopPage, baseUrl, externalRequests);
    await openBookingRoute(desktopPage, bookingArtifactUrl(baseUrl, "confirmedReceipt"));
    await desktopPage.screenshot({
      path: outputPath("303-booking-artifact-confirmed-receipt-desktop.png"),
      fullPage: true,
      animations: "disabled",
      caret: "hide",
    });

    const tabletContext = await browser.newContext({ viewport: { width: 1024, height: 900 } });
    const tabletPage = await tabletContext.newPage();
    trackExternalRequests(tabletPage, baseUrl, externalRequests);
    await openBookingRoute(tabletPage, bookingArtifactUrl(baseUrl, "manageDirections"));
    await tabletPage.screenshot({
      path: outputPath("303-booking-artifact-manage-directions-tablet.png"),
      fullPage: true,
      animations: "disabled",
      caret: "hide",
    });

    const mobileContext = await browser.newContext({
      ...playwright.devices["iPhone 13"],
      locale: "en-GB",
      timezoneId: "Europe/London",
    });
    const mobilePage = await mobileContext.newPage();
    trackExternalRequests(mobilePage, baseUrl, externalRequests);
    await openBookingRoute(mobilePage, bookingArtifactUrl(baseUrl, "embeddedBrowserHandoff"));
    await mobilePage.screenshot({
      path: outputPath("303-booking-artifact-embedded-mobile.png"),
      fullPage: true,
      animations: "disabled",
      caret: "hide",
    });

    assertCondition(
      externalRequests.size === 0,
      `artifact visual routes should not fetch external resources: ${Array.from(externalRequests).join(", ")}`,
    );

    await mobileContext.close();
    await tabletContext.close();
    await desktopContext.close();
  } finally {
    await browser.close();
    await closeServer(atlas.server);
    await stopPatientWeb(child);
  }
}

if (process.argv.includes("--run")) {
  run().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
