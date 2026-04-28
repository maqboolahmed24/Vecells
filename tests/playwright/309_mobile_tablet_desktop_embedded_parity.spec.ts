import {
  assertCondition,
  assertNoExternalRequests,
  assertNoHorizontalOverflow,
  bookingResponsiveUrl,
  importPlaywright,
  openBookingRoute,
  outputPath,
  readRootResponsiveMarkers,
  startPatientWeb,
  stopPatientWeb,
  trackExternalRequests,
} from "./309_phase4_local_booking.helpers.ts";

export const mobileTabletDesktopEmbeddedParityCoverage = [
  "desktop, tablet, and mobile routes preserve the same booking route family while adapting breakpoint posture",
  "compact mobile selection, manage, and waitlist routes keep sticky actions and pinned summary affordances without horizontal overflow",
  "embedded confirmation, manage, and waitlist routes preserve nhs_app host markers and summary-safe action posture above the safe area",
];

export async function run(): Promise<void> {
  const playwright = await importPlaywright();
  if (!playwright) {
    return;
  }

  const { child, baseUrl } = await startPatientWeb();
  const browser = await playwright.chromium.launch({ headless: true });

  try {
    const desktopPage = await browser.newPage({ viewport: { width: 1440, height: 1080 } });
    const tabletPage = await browser.newPage({ viewport: { width: 1024, height: 1180 } });
    const mobileContext = await browser.newContext({
      ...playwright.devices["iPhone 13"],
      locale: "en-GB",
      timezoneId: "Europe/London",
    });
    const mobilePage = await mobileContext.newPage();
    const embeddedContext = await browser.newContext({
      ...playwright.devices["iPhone 13"],
      locale: "en-GB",
      timezoneId: "Europe/London",
      reducedMotion: "reduce",
    });
    await embeddedContext.tracing.start({ screenshots: true, snapshots: true });
    const embeddedPage = await embeddedContext.newPage();

    const desktopExternalRequests = new Set<string>();
    const tabletExternalRequests = new Set<string>();
    const mobileExternalRequests = new Set<string>();
    const embeddedExternalRequests = new Set<string>();
    trackExternalRequests(desktopPage, baseUrl, desktopExternalRequests);
    trackExternalRequests(tabletPage, baseUrl, tabletExternalRequests);
    trackExternalRequests(mobilePage, baseUrl, mobileExternalRequests);
    trackExternalRequests(embeddedPage, baseUrl, embeddedExternalRequests);

    await openBookingRoute(desktopPage, bookingResponsiveUrl(baseUrl, "workspace"));
    const desktopMarkers = await readRootResponsiveMarkers(desktopPage);
    assertCondition(desktopMarkers.routeKey === "workspace", "desktop route key drifted");
    assertCondition(
      desktopMarkers.breakpointClass === "wide",
      "desktop route should expose the wide breakpoint",
    );
    assertCondition(
      desktopMarkers.missionStackState === "unfolded",
      "desktop route should keep the mission stack unfolded",
    );
    assertCondition(
      desktopMarkers.embeddedMode === "browser",
      "desktop route should stay in browser mode",
    );
    await assertNoHorizontalOverflow(desktopPage, "309 desktop booking workspace");
    await desktopPage.screenshot({
      path: outputPath("309-booking-workspace-desktop.png"),
      fullPage: true,
      animations: "disabled",
      caret: "hide",
    });

    await openBookingRoute(tabletPage, bookingResponsiveUrl(baseUrl, "manage"));
    const tabletMarkers = await readRootResponsiveMarkers(tabletPage);
    assertCondition(tabletMarkers.routeKey === "manage", "tablet manage route key drifted");
    assertCondition(
      tabletMarkers.embeddedMode === "browser",
      "tablet manage route should remain in browser mode",
    );
    await tabletPage.getByTestId("patient-appointment-manage-responsive-stage").waitFor();
    await tabletPage.getByTestId("appointment-summary-card").waitFor();
    await assertNoHorizontalOverflow(tabletPage, "309 tablet manage route");
    await tabletPage.screenshot({
      path: outputPath("309-booking-manage-tablet.png"),
      fullPage: true,
      animations: "disabled",
      caret: "hide",
    });

    await openBookingRoute(mobilePage, bookingResponsiveUrl(baseUrl, "selection"));
    const mobileMarkers = await readRootResponsiveMarkers(mobilePage);
    assertCondition(mobileMarkers.routeKey === "select", "mobile selection route key drifted");
    assertCondition(
      mobileMarkers.breakpointClass === "compact" || mobileMarkers.breakpointClass === "narrow",
      "mobile selection route should expose a compact breakpoint",
    );
    assertCondition(
      mobileMarkers.missionStackState === "folded",
      "mobile selection route should use the folded mission stack",
    );
    const selectionStage = mobilePage.getByTestId("offer-selection-responsive-stage");
    await selectionStage.waitFor();
    await selectionStage.locator("[data-testid='selected-slot-pin']").first().waitFor();
    assertCondition(
      (await mobilePage.getByTestId("sticky-confirm-tray").count()) === 1,
      "mobile selection route should expose the sticky confirm tray",
    );
    await assertNoHorizontalOverflow(mobilePage, "309 mobile selection route");

    await openBookingRoute(mobilePage, bookingResponsiveUrl(baseUrl, "waitlist"));
    const waitlistStage = mobilePage.getByTestId("patient-waitlist-responsive-stage");
    await waitlistStage.waitFor();
    assertCondition(
      (await mobilePage.getByTestId("waitlist-sticky-action").count()) === 1,
      "mobile waitlist route should expose the sticky waitlist action",
    );
    await assertNoHorizontalOverflow(mobilePage, "309 mobile waitlist route");
    await mobilePage.screenshot({
      path: outputPath("309-booking-selection-and-waitlist-mobile.png"),
      fullPage: true,
      animations: "disabled",
      caret: "hide",
    });

    await openBookingRoute(embeddedPage, bookingResponsiveUrl(baseUrl, "embeddedConfirmation"));
    let embeddedMarkers = await readRootResponsiveMarkers(embeddedPage);
    assertCondition(
      embeddedMarkers.embeddedMode === "nhs_app",
      "embedded confirmation should report nhs_app mode",
    );
    assertCondition(
      embeddedMarkers.safeAreaClass === "bottom",
      "embedded confirmation should preserve bottom safe area coverage",
    );
    assertCondition(
      (await embeddedPage.getByTestId("patient-booking-top-band").count()) === 0,
      "embedded confirmation should suppress the browser top band",
    );
    const confirmationStage = embeddedPage.getByTestId("booking-confirmation-responsive-stage");
    await confirmationStage.waitFor();
    await confirmationStage.locator("[data-testid='booking-mission-stack-rail-toggle']").click();
    const confirmationDrawer = embeddedPage.getByTestId("booking-mission-stack-rail-drawer");
    await confirmationDrawer.waitFor();
    assertCondition(
      (await confirmationDrawer
        .getByTestId("artifact-summary-stub")
        .getByRole("button")
        .count()) === 0,
      "embedded confirmation should keep artifact actions summary-only",
    );

    await openBookingRoute(embeddedPage, bookingResponsiveUrl(baseUrl, "embeddedManage"));
    embeddedMarkers = await readRootResponsiveMarkers(embeddedPage);
    assertCondition(
      embeddedMarkers.embeddedMode === "nhs_app",
      "embedded manage should report nhs_app mode",
    );
    await embeddedPage.getByTestId("manage-sticky-action-tray").waitFor();
    assertCondition(
      (await embeddedPage.locator("[data-testid^='manage-artifact-action-'][disabled]").count()) >=
        1,
      "embedded manage should keep artifact actions narrowed and disabled",
    );

    await openBookingRoute(embeddedPage, bookingResponsiveUrl(baseUrl, "embeddedWaitlist"));
    embeddedMarkers = await readRootResponsiveMarkers(embeddedPage);
    assertCondition(embeddedMarkers.routeKey === "waitlist", "embedded waitlist route key drifted");
    await embeddedPage.getByTestId("waitlist-sticky-action").waitFor();
    await assertNoHorizontalOverflow(embeddedPage, "309 embedded booking routes");
    await embeddedPage.screenshot({
      path: outputPath("309-booking-embedded-host-mobile.png"),
      fullPage: true,
      animations: "disabled",
      caret: "hide",
    });

    assertNoExternalRequests(
      "309 responsive and embedded parity",
      desktopExternalRequests,
      tabletExternalRequests,
      mobileExternalRequests,
      embeddedExternalRequests,
    );

    await embeddedContext.tracing.stop({
      path: outputPath("309-booking-responsive-and-embedded-trace.zip"),
    });
    await embeddedContext.close();
    await mobileContext.close();
    await desktopPage.close();
    await tabletPage.close();
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
