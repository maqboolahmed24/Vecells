import {
  assertCondition,
  assertFocusableVisible,
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

export const bookingMobileResponsiveEmbeddedCoverage = [
  "confirmation embedded host suppresses browser chrome without changing route meaning",
  "manage embedded host keeps artifact actions narrowed to summary-only posture",
  "waitlist embedded host preserves the sticky action tray above the bottom safe area",
];

export async function run(): Promise<void> {
  const playwright = await importPlaywright();
  if (!playwright) {
    return;
  }

  const { child, baseUrl } = await startPatientWeb();
  const browser = await playwright.chromium.launch({ headless: true });

  try {
    const context = await browser.newContext({
      ...playwright.devices["iPhone 13"],
      locale: "en-GB",
      timezoneId: "Europe/London",
      reducedMotion: "reduce",
    });
    await context.tracing.start({ screenshots: true, snapshots: true });
    const page = await context.newPage();
    const externalRequests = new Set<string>();
    trackExternalRequests(page, baseUrl, externalRequests);

    await openBookingRoute(page, bookingResponsiveUrl(baseUrl, "embeddedConfirmation"));
    const confirmationMarkers = await readRootResponsiveMarkers(page);
    assertCondition(
      confirmationMarkers.embeddedMode === "nhs_app",
      "embedded confirmation route should report nhs_app mode",
    );
    assertCondition(
      confirmationMarkers.safeAreaClass === "bottom",
      "embedded confirmation route should preserve bottom safe area coverage",
    );
    assertCondition(
      (await page.getByTestId("patient-booking-top-band").count()) === 0,
      "embedded confirmation route should suppress the browser top band",
    );
    await page.getByTestId("embedded-booking-host-ribbon").waitFor();
    const confirmationStage = page.getByTestId("booking-confirmation-responsive-stage");
    await confirmationStage.locator("[data-testid='booking-mission-stack-rail-toggle']").click();
    const confirmationDrawer = page.getByTestId("booking-mission-stack-rail-drawer");
    await confirmationDrawer.waitFor();
    const artifactStub = confirmationDrawer.getByTestId("artifact-summary-stub");
    assertCondition(
      (await artifactStub.getAttribute("data-embedded-mode")) === "nhs_app",
      "embedded confirmation artifact summary should preserve nhs_app mode",
    );
    assertCondition(
      (await artifactStub.getByRole("button").count()) === 0,
      "embedded confirmation artifact summary should keep artifact actions summary-only",
    );
    await assertNoHorizontalOverflow(page, "302 embedded confirmation");

    await openBookingRoute(page, bookingResponsiveUrl(baseUrl, "embeddedManage"));
    const manageMarkers = await readRootResponsiveMarkers(page);
    assertCondition(
      manageMarkers.embeddedMode === "nhs_app",
      "embedded manage route should report nhs_app mode",
    );
    await page.getByTestId("manage-sticky-action-tray").waitFor();
    await assertFocusableVisible(page, page.getByTestId("manage-sticky-primary"));
    const disabledArtifactActions = await page
      .locator("[data-testid^='manage-artifact-action-'][disabled]")
      .count();
    assertCondition(
      disabledArtifactActions >= 1,
      "embedded manage route should keep artifact actions narrowed and disabled",
    );
    await assertNoHorizontalOverflow(page, "302 embedded manage");

    await openBookingRoute(page, bookingResponsiveUrl(baseUrl, "embeddedWaitlist"));
    const waitlistMarkers = await readRootResponsiveMarkers(page);
    assertCondition(
      waitlistMarkers.embeddedMode === "nhs_app",
      "embedded waitlist route should report nhs_app mode",
    );
    await page.getByTestId("waitlist-sticky-action").waitFor();
    await assertFocusableVisible(
      page,
      page.getByTestId("waitlist-sticky-action").getByRole("button").first(),
    );
    await assertNoHorizontalOverflow(page, "302 embedded waitlist");

    assertCondition(
      externalRequests.size === 0,
      `302 embedded routes should not fetch external resources: ${Array.from(externalRequests).join(", ")}`,
    );

    await page.screenshot({
      path: outputPath("302-booking-mobile-embedded-host.png"),
      fullPage: true,
      animations: "disabled",
      caret: "hide",
    });
    await context.tracing.stop({
      path: outputPath("302-booking-mobile-embedded-trace.zip"),
    });
    await context.close();
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
