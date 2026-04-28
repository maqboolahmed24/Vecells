import {
  assertCondition,
  assertNoHorizontalOverflow,
  bookingResponsiveUrl,
  closeServer,
  importPlaywright,
  openBookingRoute,
  outputPath,
  startPatientWeb,
  startResponsiveAtlasServer,
  stopPatientWeb,
  trackExternalRequests,
} from "./302_booking_mobile_responsive.helpers.ts";

export const bookingMobileResponsiveVisualCoverage = [
  "atlas renders the responsive booking breakpoint composition",
  "workspace desktop screenshot preserves the wide shell",
  "selection mobile screenshot preserves the pinned slot and sticky tray",
  "embedded confirmation screenshot preserves the same route under nhs_app chrome suppression",
  "manage tablet screenshot preserves the booked summary and summary sheet affordance",
];

export async function run(): Promise<void> {
  const playwright = await importPlaywright();
  if (!playwright) {
    return;
  }

  const atlasServer = await startResponsiveAtlasServer();
  const { child, baseUrl } = await startPatientWeb();
  const browser = await playwright.chromium.launch({ headless: true });

  try {
    const externalRequests = new Set<string>();

    const atlasPage = await browser.newPage({ viewport: { width: 1440, height: 1800 } });
    trackExternalRequests(atlasPage, atlasServer.atlasUrl, externalRequests);
    await atlasPage.goto(atlasServer.atlasUrl, { waitUntil: "load" });
    await atlasPage.locator("[data-testid='booking-mobile-responsive-atlas']").waitFor();
    assertCondition(
      await atlasPage.locator("[data-testid='atlas-breakpoint-strip']").isVisible(),
      "atlas breakpoint strip should remain visible",
    );
    await atlasPage.screenshot({
      path: outputPath("302-booking-mobile-responsive-atlas.png"),
      fullPage: true,
      animations: "disabled",
      caret: "hide",
    });

    const desktopPage = await browser.newPage({ viewport: { width: 1440, height: 1080 } });
    trackExternalRequests(desktopPage, baseUrl, externalRequests);
    await openBookingRoute(desktopPage, bookingResponsiveUrl(baseUrl, "workspace"));
    await desktopPage.screenshot({
      path: outputPath("302-booking-mobile-workspace-desktop.png"),
      fullPage: true,
      animations: "disabled",
      caret: "hide",
    });

    const mobilePage = await browser.newPage({
      viewport: { width: 430, height: 932 },
      reducedMotion: "reduce",
    });
    trackExternalRequests(mobilePage, baseUrl, externalRequests);
    await openBookingRoute(mobilePage, bookingResponsiveUrl(baseUrl, "selection"));
    await mobilePage.getByTestId("offer-selection-responsive-stage").waitFor();
    await assertNoHorizontalOverflow(mobilePage, "302 responsive selection mobile");
    await mobilePage.screenshot({
      path: outputPath("302-booking-mobile-selection-mobile.png"),
      fullPage: true,
      animations: "disabled",
      caret: "hide",
    });

    const embeddedPage = await browser.newPage({
      viewport: { width: 430, height: 932 },
      reducedMotion: "reduce",
    });
    trackExternalRequests(embeddedPage, baseUrl, externalRequests);
    await openBookingRoute(embeddedPage, bookingResponsiveUrl(baseUrl, "embeddedConfirmation"));
    await embeddedPage.getByTestId("embedded-booking-host-ribbon").waitFor();
    await assertNoHorizontalOverflow(embeddedPage, "302 embedded confirmation mobile");
    await embeddedPage.screenshot({
      path: outputPath("302-booking-mobile-embedded-confirmation.png"),
      fullPage: true,
      animations: "disabled",
      caret: "hide",
    });

    const tabletPage = await browser.newPage({ viewport: { width: 1024, height: 1180 } });
    trackExternalRequests(tabletPage, baseUrl, externalRequests);
    await openBookingRoute(tabletPage, bookingResponsiveUrl(baseUrl, "manage"));
    await tabletPage.getByTestId("patient-appointment-manage-responsive-stage").waitFor();
    await tabletPage.screenshot({
      path: outputPath("302-booking-mobile-manage-tablet.png"),
      fullPage: true,
      animations: "disabled",
      caret: "hide",
    });

    assertCondition(
      externalRequests.size === 0,
      `302 responsive visuals should not fetch external resources: ${Array.from(externalRequests).join(", ")}`,
    );
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
