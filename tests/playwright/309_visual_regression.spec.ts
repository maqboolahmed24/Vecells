import fs from "node:fs";

import {
  WORKSPACE_BOOKINGS_ROUTE_SELECTOR,
  assertCondition,
  assertNoExternalRequests,
  bookingResponsiveUrl,
  captureStableScreenshot,
  importPlaywright,
  openBookingRoute,
  openStaffBookingRoute,
  outputPath,
  patientPathUrl,
  startBoardServer,
  startLocalBookingApps,
  stopLocalBookingApps,
  trackExternalRequests,
} from "./309_phase4_local_booking.helpers.ts";

export const visualRegressionCoverage = [
  "deterministic screenshots remain stable across repeated captures for the highest-risk patient route-family surfaces",
  "staff-assisted booking screenshots stay stable for compare-live and recovery-required states",
  "the release evidence board renders as a premium, keyboard-first surface without external asset drift",
];

export async function run(): Promise<void> {
  const playwright = await importPlaywright();
  if (!playwright) {
    return;
  }

  const apps = await startLocalBookingApps();
  const board = await startBoardServer("/docs/testing/309_phase4_e2e_evidence_board.html");
  const browser = await playwright.chromium.launch({ headless: true });

  try {
    const patientDesktop = await browser.newPage({ viewport: { width: 1440, height: 1080 } });
    const patientTablet = await browser.newPage({ viewport: { width: 1024, height: 1180 } });
    const patientMobile = await browser.newPage({ viewport: { width: 430, height: 932 } });
    const staffDesktop = await browser.newPage({ viewport: { width: 1440, height: 1080 } });
    const boardPage = await browser.newPage({ viewport: { width: 1680, height: 1320 } });

    const patientDesktopExternalRequests = new Set<string>();
    const patientTabletExternalRequests = new Set<string>();
    const patientMobileExternalRequests = new Set<string>();
    const staffExternalRequests = new Set<string>();
    const boardExternalRequests = new Set<string>();
    trackExternalRequests(patientDesktop, apps.patientBaseUrl, patientDesktopExternalRequests);
    trackExternalRequests(patientTablet, apps.patientBaseUrl, patientTabletExternalRequests);
    trackExternalRequests(patientMobile, apps.patientBaseUrl, patientMobileExternalRequests);
    trackExternalRequests(staffDesktop, apps.staffBaseUrl, staffExternalRequests);
    trackExternalRequests(boardPage, new URL(board.atlasUrl).origin, boardExternalRequests);

    const manifest: Array<Record<string, unknown>> = [];

    await openBookingRoute(
      patientDesktop,
      patientPathUrl(apps.patientBaseUrl, "appointmentsWorkspace"),
    );
    manifest.push({
      scenarioId: "workspace_desktop",
      ...(await captureStableScreenshot(
        patientDesktop,
        patientDesktop.getByTestId("Patient_Booking_Workspace_Route"),
        "309-visual-workspace-desktop.png",
        "workspace desktop",
      )),
    });

    await openBookingRoute(patientMobile, bookingResponsiveUrl(apps.patientBaseUrl, "selection"));
    manifest.push({
      scenarioId: "selection_mobile",
      ...(await captureStableScreenshot(
        patientMobile,
        patientMobile.getByTestId("offer-selection-responsive-stage"),
        "309-visual-selection-mobile.png",
        "selection mobile",
      )),
    });

    await openBookingRoute(
      patientDesktop,
      patientPathUrl(apps.patientBaseUrl, "confirmationConfirmed"),
    );
    manifest.push({
      scenarioId: "confirmation_confirmed",
      ...(await captureStableScreenshot(
        patientDesktop,
        patientDesktop.getByTestId("booking-confirmation-stage"),
        "309-visual-confirmation-confirmed.png",
        "confirmation confirmed",
      )),
    });

    await openBookingRoute(patientTablet, patientPathUrl(apps.patientBaseUrl, "manageReady"));
    manifest.push({
      scenarioId: "manage_tablet",
      ...(await captureStableScreenshot(
        patientTablet,
        patientTablet.getByTestId("patient-appointment-manage-view"),
        "309-visual-manage-tablet.png",
        "manage tablet",
      )),
    });

    await openBookingRoute(patientMobile, bookingResponsiveUrl(apps.patientBaseUrl, "waitlist"));
    manifest.push({
      scenarioId: "waitlist_mobile",
      ...(await captureStableScreenshot(
        patientMobile,
        patientMobile.getByTestId("patient-waitlist-responsive-stage"),
        "309-visual-waitlist-mobile.png",
        "waitlist mobile",
      )),
    });

    await openStaffBookingRoute(staffDesktop, apps.staffBaseUrl, "/workspace/bookings");
    manifest.push({
      scenarioId: "staff_compare_live",
      ...(await captureStableScreenshot(
        staffDesktop,
        staffDesktop.locator(WORKSPACE_BOOKINGS_ROUTE_SELECTOR),
        "309-visual-staff-compare-live.png",
        "staff compare live",
      )),
    });

    await openStaffBookingRoute(
      staffDesktop,
      apps.staffBaseUrl,
      "/workspace/bookings/booking_case_299_stale_recovery",
    );
    manifest.push({
      scenarioId: "staff_stale_recovery",
      ...(await captureStableScreenshot(
        staffDesktop,
        staffDesktop.locator(WORKSPACE_BOOKINGS_ROUTE_SELECTOR),
        "309-visual-staff-stale-recovery.png",
        "staff stale recovery",
      )),
    });

    await boardPage.goto(board.atlasUrl, { waitUntil: "networkidle" });
    await boardPage.locator("[data-testid='Phase4BookingE2EBoard']").waitFor();
    manifest.push({
      scenarioId: "evidence_board",
      ...(await captureStableScreenshot(
        boardPage,
        boardPage.locator("[data-testid='Phase4BookingE2EBoard']"),
        "309-visual-evidence-board.png",
        "evidence board",
      )),
    });

    for (const entry of manifest) {
      assertCondition(
        typeof entry.hash === "string" && String(entry.hash).length === 64,
        "visual hash missing",
      );
    }

    fs.writeFileSync(
      outputPath("309-visual-regression-manifest.json"),
      `${JSON.stringify(manifest, null, 2)}\n`,
      "utf-8",
    );

    assertNoExternalRequests(
      "309 visual regression",
      patientDesktopExternalRequests,
      patientTabletExternalRequests,
      patientMobileExternalRequests,
      staffExternalRequests,
      boardExternalRequests,
    );
  } finally {
    await browser.close();
    await new Promise<void>((resolve, reject) =>
      board.server.close((error) => (error ? reject(error) : resolve())),
    );
    await stopLocalBookingApps(apps);
  }
}

if (process.argv.includes("--run")) {
  run().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
