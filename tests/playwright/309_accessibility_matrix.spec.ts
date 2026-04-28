import {
  WORKSPACE_BOOKINGS_ROUTE_SELECTOR,
  assertCondition,
  assertFocusedVisible,
  assertNoExternalRequests,
  assertNoHorizontalOverflow,
  assertTargetSize,
  bookingResponsiveUrl,
  captureAria,
  importPlaywright,
  openBookingRoute,
  openStaffBookingRoute,
  outputPath,
  patientPathUrl,
  readPatientWorkspaceMarkers,
  runAxe,
  startLocalBookingApps,
  stopLocalBookingApps,
  trackExternalRequests,
  writeAccessibilitySnapshot,
  writeAriaFile,
} from "./309_phase4_local_booking.helpers.ts";

export const accessibilityMatrixCoverage = [
  "patient workspace, confirmation, and manage routes expose landmarks, live regions, and axe-clean status semantics",
  "narrow reflow, reduced motion, and embedded waitlist routes stay mobile-safe without horizontal overflow or hidden focus",
  "staff-assisted routes preserve minimum target size, visible focus, and scoped axe-clean accessibility posture",
];

async function readScrollMarginBottom(locator: any): Promise<number> {
  return await locator.evaluate((node: HTMLElement) => {
    return Number.parseFloat(window.getComputedStyle(node).scrollMarginBottom || "0");
  });
}

export async function run(): Promise<void> {
  const playwright = await importPlaywright();
  if (!playwright) {
    return;
  }

  const apps = await startLocalBookingApps();
  const browser = await playwright.chromium.launch({ headless: true });

  try {
    const patientContext = await browser.newContext({ viewport: { width: 1440, height: 1080 } });
    const narrowContext = await browser.newContext({ viewport: { width: 320, height: 1024 } });
    const embeddedContext = await browser.newContext({
      viewport: { width: 430, height: 932 },
      reducedMotion: "reduce",
    });
    const staffContext = await browser.newContext({ viewport: { width: 1440, height: 1080 } });
    await patientContext.tracing.start({ screenshots: true, snapshots: true });
    await staffContext.tracing.start({ screenshots: true, snapshots: true });

    const patientPage = await patientContext.newPage();
    const narrowPage = await narrowContext.newPage();
    const embeddedPage = await embeddedContext.newPage();
    const staffPage = await staffContext.newPage();
    const patientExternalRequests = new Set<string>();
    const narrowExternalRequests = new Set<string>();
    const embeddedExternalRequests = new Set<string>();
    const staffExternalRequests = new Set<string>();
    trackExternalRequests(patientPage, apps.patientBaseUrl, patientExternalRequests);
    trackExternalRequests(narrowPage, apps.patientBaseUrl, narrowExternalRequests);
    trackExternalRequests(embeddedPage, apps.patientBaseUrl, embeddedExternalRequests);
    trackExternalRequests(staffPage, apps.staffBaseUrl, staffExternalRequests);

    await openBookingRoute(
      patientPage,
      patientPathUrl(apps.patientBaseUrl, "appointmentsWorkspace"),
    );
    const workspaceRoot = patientPage.getByTestId("Patient_Booking_Workspace_Route");
    await workspaceRoot.waitFor();
    assertCondition(
      (await patientPage.locator("main").count()) === 1,
      "patient workspace should expose one main landmark",
    );
    assertCondition(
      (await patientPage.locator("[role='status'][aria-live='polite']").count()) >= 1,
      "patient workspace should expose a polite live region",
    );
    await writeAccessibilitySnapshot(patientPage, "309-a11y-workspace-accessibility.json");
    writeAriaFile(
      "309-a11y-workspace-aria.yml",
      await captureAria(workspaceRoot, patientPage),
    );
    await runAxe(
      patientPage,
      "309 patient workspace accessibility",
      "[data-testid='Patient_Booking_Workspace_Route']",
    );

    await openBookingRoute(
      patientPage,
      patientPathUrl(apps.patientBaseUrl, "confirmationPending"),
    );
    const confirmationStage = patientPage.getByTestId("booking-confirmation-stage");
    await confirmationStage.waitFor();
    assertCondition(
      await patientPage.getByTestId("confirmation-pending-state").isVisible(),
      "pending confirmation state should remain visible",
    );
    await writeAccessibilitySnapshot(
      patientPage,
      "309-a11y-confirmation-pending-accessibility.json",
    );
    writeAriaFile(
      "309-a11y-confirmation-pending-aria.yml",
      await captureAria(confirmationStage, patientPage),
    );
    await runAxe(
      patientPage,
      "309 patient confirmation accessibility",
      "[data-testid='booking-confirmation-stage']",
    );

    await openBookingRoute(
      patientPage,
      patientPathUrl(apps.patientBaseUrl, "manageReady"),
    );
    const manageRoot = patientPage.getByTestId("patient-appointment-manage-view");
    await manageRoot.waitFor();
    const cancelButton = patientPage.getByTestId("manage-open-cancel");
    const rescheduleButton = patientPage.getByTestId("manage-action-open_reschedule");
    await assertTargetSize(cancelButton, "patient manage cancel button");
    await assertTargetSize(rescheduleButton, "patient manage reschedule button");
    await assertFocusedVisible(cancelButton, patientPage, "patient manage cancel button");
    await cancelButton.click();
    await patientPage.getByTestId("cancel-appointment-flow").waitFor();
    await patientPage.getByTestId("cancel-appointment-close").click();
    await patientPage.waitForFunction(() => {
      return document.querySelector("[data-testid='cancel-appointment-flow']") === null;
    });
    const activeManageTestId = await patientPage.evaluate(() => {
      return (document.activeElement as HTMLElement | null)?.getAttribute("data-testid");
    });
    assertCondition(
      activeManageTestId === "manage-open-cancel",
      `manage dialog close should restore focus to manage-open-cancel, saw ${activeManageTestId}`,
    );

    await openBookingRoute(narrowPage, bookingResponsiveUrl(apps.patientBaseUrl, "selection"));
    const selectionStage = narrowPage.getByTestId("offer-selection-responsive-stage");
    await selectionStage.waitFor();
    const railToggle = selectionStage.getByTestId("booking-mission-stack-rail-toggle");
    assertCondition(
      (await readScrollMarginBottom(railToggle)) >= 100,
      "narrow selection route should reserve sticky-tray-safe scroll margin",
    );
    await assertFocusedVisible(
      railToggle,
      narrowPage,
      "narrow selection mission-stack toggle",
      132,
    );
    await assertNoHorizontalOverflow(narrowPage, "309 narrow selection reflow");

    await openBookingRoute(embeddedPage, bookingResponsiveUrl(apps.patientBaseUrl, "embeddedWaitlist"));
    const embeddedMarkers = await readPatientWorkspaceMarkers(embeddedPage);
    const waitlistStage = embeddedPage.getByTestId("patient-waitlist-responsive-stage");
    await waitlistStage.waitFor();
    assertCondition(
      embeddedMarkers.embeddedMode === "nhs_app",
      "embedded waitlist should preserve nhs_app mode",
    );
    assertCondition(
      embeddedMarkers.motionProfile === "reduced",
      "embedded waitlist reduced-motion marker drifted",
    );
    assertCondition(
      (await embeddedPage.getByTestId("waitlist-live-region").count()) === 1,
      "embedded waitlist should expose one waitlist live region",
    );
    await writeAccessibilitySnapshot(
      embeddedPage,
      "309-a11y-embedded-waitlist-accessibility.json",
    );
    writeAriaFile(
      "309-a11y-embedded-waitlist-aria.yml",
      await captureAria(waitlistStage, embeddedPage),
    );
    await runAxe(
      embeddedPage,
      "309 embedded waitlist accessibility",
      "[data-testid='patient-waitlist-responsive-stage']",
    );

    await openStaffBookingRoute(staffPage, apps.staffBaseUrl, "/workspace/bookings");
    const staffRoot = staffPage.locator(WORKSPACE_BOOKINGS_ROUTE_SELECTOR);
    await staffRoot.waitFor();
    const queueButton = staffPage
      .locator(
        "[data-testid='BookingExceptionQueueRow'][data-booking-case='booking_case_299_stale_recovery']",
      )
      .getByRole("button");
    const compareButton = staffPage.getByTestId("booking-compare-slot-slot_299_compare_1530");
    await assertTargetSize(queueButton, "staff exception queue row");
    await assertTargetSize(compareButton, "staff compare button");
    await assertFocusedVisible(queueButton, staffPage, "staff exception queue row");
    await writeAccessibilitySnapshot(staffPage, "309-a11y-staff-booking-accessibility.json");
    writeAriaFile(
      "309-a11y-staff-booking-aria.yml",
      await captureAria(staffRoot, staffPage),
    );
    await runAxe(
      staffPage,
      "309 staff booking accessibility",
      WORKSPACE_BOOKINGS_ROUTE_SELECTOR,
    );

    assertNoExternalRequests(
      "309 accessibility matrix",
      patientExternalRequests,
      narrowExternalRequests,
      embeddedExternalRequests,
      staffExternalRequests,
    );

    await patientContext.tracing.stop({
      path: outputPath("309-accessibility-patient-trace.zip"),
    });
    await staffContext.tracing.stop({
      path: outputPath("309-accessibility-staff-trace.zip"),
    });
    await patientContext.close();
    await narrowContext.close();
    await embeddedContext.close();
    await staffContext.close();
  } finally {
    await browser.close();
    await stopLocalBookingApps(apps);
  }
}

if (process.argv.includes("--run")) {
  run().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
