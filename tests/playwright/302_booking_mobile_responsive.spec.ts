import {
  assertCondition,
  assertNoHorizontalOverflow,
  bookingResponsiveUrl,
  importPlaywright,
  openBookingRoute,
  outputPath,
  readRootResponsiveMarkers,
  startPatientWeb,
  stopPatientWeb,
  trackExternalRequests,
} from "./302_booking_mobile_responsive.helpers.ts";

export const bookingMobileResponsiveCoverage = [
  "workspace shell flips between wide and mission-stack markers without changing route meaning",
  "offer selection keeps the selected slot pinned and exposes the shared sticky tray on compact mobile",
  "confirmation keeps the pinned selected slot and a same-shell rail drawer on compact mobile",
  "manage keeps the booked summary pinned and reopens deeper summary in ManageCompactSummarySheet",
  "waitlist keeps the active offer pinned with the shared sticky tray and no horizontal overflow",
];

export const bookingMobileResponsiveFixtureProof = {
  workspace: "booking_case_293_live",
  selection: "booking_case_295_nonexclusive",
  confirmation: "booking_case_296_review",
  manage: "booking_case_297_ready",
  waitlist: "booking_case_298_offer_nonexclusive",
  embeddedMode: "host=nhs_app",
  embeddedSafeArea: "safeArea=bottom",
} as const;

export async function run(): Promise<void> {
  const playwright = await importPlaywright();
  if (!playwright) {
    return;
  }

  const { child, baseUrl } = await startPatientWeb();
  const browser = await playwright.chromium.launch({ headless: true });

  try {
    const desktopContext = await browser.newContext({ viewport: { width: 1440, height: 1080 } });
    const desktopPage = await desktopContext.newPage();
    const desktopExternalRequests = new Set<string>();
    trackExternalRequests(desktopPage, baseUrl, desktopExternalRequests);

    await openBookingRoute(desktopPage, bookingResponsiveUrl(baseUrl, "workspace"));
    const desktopMarkers = await readRootResponsiveMarkers(desktopPage);
    assertCondition(desktopMarkers.breakpointClass === "wide", "desktop route should expose wide breakpoint");
    assertCondition(
      desktopMarkers.missionStackState === "unfolded",
      "desktop route should keep the shell unfolded",
    );
    assertCondition(desktopMarkers.embeddedMode === "browser", "desktop route should stay in browser mode");
    assertCondition(
      desktopMarkers.responsiveTaskId?.includes("par_302"),
      "responsive task marker drifted on desktop route",
    );
    await assertNoHorizontalOverflow(desktopPage, "302 workspace desktop");

    const mobileContext = await browser.newContext({
      ...playwright.devices["iPhone 13"],
      locale: "en-GB",
      timezoneId: "Europe/London",
    });
    await mobileContext.tracing.start({ screenshots: true, snapshots: true });
    const mobilePage = await mobileContext.newPage();
    const mobileExternalRequests = new Set<string>();
    trackExternalRequests(mobilePage, baseUrl, mobileExternalRequests);

    await openBookingRoute(mobilePage, bookingResponsiveUrl(baseUrl, "workspace"));
    const mobileMarkers = await readRootResponsiveMarkers(mobilePage);
    assertCondition(
      mobileMarkers.breakpointClass === "compact" || mobileMarkers.breakpointClass === "narrow",
      "mobile route should expose compact or narrow breakpoint",
    );
    assertCondition(
      mobileMarkers.missionStackState === "folded",
      "mobile route should use the folded mission stack",
    );
    await mobilePage.getByTestId("booking-mission-stack-frame").waitFor();
    await mobilePage.getByTestId("booking-action-tray").waitFor();
    await mobilePage
      .getByTestId("patient-booking-responsive-stage")
      .locator("[data-testid='booking-mission-stack-rail-toggle']")
      .click();
    await mobilePage.getByTestId("booking-mission-stack-rail-drawer").waitFor();
    await assertNoHorizontalOverflow(mobilePage, "302 workspace mobile");

    await openBookingRoute(mobilePage, bookingResponsiveUrl(baseUrl, "selection"));
    const selectionStage = mobilePage.getByTestId("offer-selection-responsive-stage");
    await selectionStage.waitFor();
    assertCondition(
      (await mobilePage.getByTestId("sticky-confirm-tray").count()) === 1,
      "selection stage should expose the shared sticky confirm tray on compact mobile",
    );
    assertCondition(
      await selectionStage.locator("[data-testid='selected-slot-pin']").first().isVisible(),
      "selection stage should keep the selected slot pin visible",
    );
    await assertNoHorizontalOverflow(mobilePage, "302 selection mobile");

    await openBookingRoute(mobilePage, bookingResponsiveUrl(baseUrl, "confirmation"));
    const confirmationStage = mobilePage.getByTestId("booking-confirmation-responsive-stage");
    await confirmationStage.waitFor();
    await confirmationStage.locator("[data-testid='booking-mission-stack-rail-toggle']").click();
    await confirmationStage
      .locator("[data-testid='booking-mission-stack-rail-drawer'][data-drawer-open='true']")
      .waitFor();
    assertCondition(
      (await mobilePage.getByTestId("booking-confirmation-sticky-tray").count()) === 1,
      "confirmation route should expose the shared sticky tray on compact mobile",
    );

    await openBookingRoute(mobilePage, bookingResponsiveUrl(baseUrl, "manage"));
    await mobilePage.getByTestId("patient-appointment-manage-responsive-stage").waitFor();
    await mobilePage.getByTestId("manage-open-summary-sheet").click();
    await mobilePage.getByTestId("manage-compact-summary-sheet-body").waitFor();
    assertCondition(
      (await mobilePage.getByTestId("manage-sticky-action-tray").count()) === 1,
      "manage route should expose one sticky dominant action on compact mobile",
    );
    await assertNoHorizontalOverflow(mobilePage, "302 manage mobile");

    await openBookingRoute(mobilePage, bookingResponsiveUrl(baseUrl, "waitlist"));
    const waitlistStage = mobilePage.getByTestId("patient-waitlist-responsive-stage");
    await waitlistStage.waitFor();
    assertCondition(
      await waitlistStage.locator("[data-testid='active-waitlist-offer-card']").first().isVisible(),
      "waitlist route should keep the active offer card visible",
    );
    assertCondition(
      (await mobilePage.getByTestId("waitlist-sticky-action").count()) === 1,
      "waitlist route should expose the shared sticky action tray on compact mobile",
    );
    await assertNoHorizontalOverflow(mobilePage, "302 waitlist mobile");

    assertCondition(
      desktopExternalRequests.size === 0 && mobileExternalRequests.size === 0,
      `responsive booking routes should not fetch external resources: ${[
        ...desktopExternalRequests,
        ...mobileExternalRequests,
      ].join(", ")}`,
    );

    await mobilePage.screenshot({
      path: outputPath("302-booking-mobile-responsive-mobile.png"),
      fullPage: true,
      animations: "disabled",
      caret: "hide",
    });
    await mobileContext.tracing.stop({
      path: outputPath("302-booking-mobile-responsive-trace.zip"),
    });

    await mobileContext.close();
    await desktopContext.close();
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
