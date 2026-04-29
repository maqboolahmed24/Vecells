import {
  assertCondition,
  assertNoHorizontalOverflow,
  bookingRecoveryUrl,
  importPlaywright,
  openBookingRoute,
  outputPath,
  readRecoveryMarkers,
  startPatientWeb,
  stopPatientWeb,
  trackExternalRequests,
} from "./301_booking_recovery_envelopes.helpers.ts";

export const bookingRecoveryEnvelopeCoverage = [
  "workspace recovery keeps one authoritative recovery shell instead of a local stale banner",
  "selection stale recovery refreshes back into the ranked slot surface from the recovery shell",
  "confirmation disputed recovery routes the patient back to selection instead of implying a booked state",
  "manage reminder blockage reopens a booking-aware contact repair morph without the old local recovery panel",
  "waitlist expiry recovers through the same booking shell and returns to waiting without external requests",
];

export async function run(): Promise<void> {
  const playwright = await importPlaywright();
  if (!playwright) {
    return;
  }

  const { child, baseUrl } = await startPatientWeb();
  const browser = await playwright.chromium.launch({ headless: true });

  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1080 } });
    await context.tracing.start({ screenshots: true, snapshots: true });
    const page = await context.newPage();
    const externalRequests = new Set<string>();
    trackExternalRequests(page, baseUrl, externalRequests);

    const routeRoot = page.getByTestId("Patient_Booking_Workspace_Route");
    const recoveryShell = page.getByTestId("BookingRecoveryShell");

    await openBookingRoute(page, bookingRecoveryUrl(baseUrl, "workspaceRecovery"));
    const workspaceMarkers = await readRecoveryMarkers(page);
    assertCondition((await routeRoot.getAttribute("data-route-key")) === "workspace", "workspace route marker drifted");
    assertCondition(workspaceMarkers.reason === "stale_session", "workspace recovery reason drifted");
    assertCondition(
      workspaceMarkers.nextSafeAction === "refresh_surface",
      "workspace next safe action should remain refresh-surface recovery",
    );
    assertCondition(
      await page.getByTestId("BookingRecoverySummaryCard").isVisible(),
      "workspace recovery should show the preserved summary card",
    );
    await page.getByTestId("booking-recovery-return-action").click();
    await page.waitForURL(`${baseUrl}/appointments`);
    await page.getByTestId("PatientAppointmentFamilyWorkspace").waitFor();

    await openBookingRoute(page, bookingRecoveryUrl(baseUrl, "selectionStale"));
    const selectionMarkers = await readRecoveryMarkers(page);
    assertCondition(selectionMarkers.reason === "stale_session", "selection stale reason drifted");
    assertCondition(
      (await page.getByTestId("selection-recovery-panel").count()) === 0,
      "selection route-local recovery panel should be replaced by the authoritative recovery shell",
    );
    await page.getByTestId("booking-recovery-action-refresh_selection").click();
    await page.waitForFunction(() => {
      return (
        !document.querySelector("[data-testid='BookingRecoveryShell']") &&
        document.querySelector("[data-testid='sticky-confirm-continue']") !== null
      );
    });
    assertCondition(
      (await page.getByTestId("booking-slot-results-stage").getAttribute("data-view-state")) === "renderable",
      "selection refresh should restore the renderable slot surface",
    );

    await openBookingRoute(page, bookingRecoveryUrl(baseUrl, "confirmationDisputed"));
    const confirmationMarkers = await readRecoveryMarkers(page);
    assertCondition(
      confirmationMarkers.reason === "confirmation_disputed",
      "confirmation disputed reason drifted",
    );
    assertCondition(
      (await page.getByTestId("booked-summary-child-state").count()) === 0,
      "disputed confirmation should not render the calm booked child state",
    );
    await page.getByTestId("booking-recovery-action-return_to_selection").click();
    await page.waitForURL(/\/bookings\/booking_case_296_reconciliation\/select/);
    await page.getByTestId("booking-slot-results-stage").waitFor();

    await openBookingRoute(page, bookingRecoveryUrl(baseUrl, "manageReminderBlocked"));
    const manageMarkers = await readRecoveryMarkers(page);
    assertCondition(
      manageMarkers.reason === "contact_route_repair_required",
      "manage reminder-blocked reason drifted",
    );
    assertCondition(
      (await page.getByTestId("manage-pending-or-recovery-panel").count()) === 0,
      "manage route-local recovery panel should be replaced by the authoritative recovery shell",
    );
    await page.getByTestId("booking-recovery-action-open_contact_repair").click();
    await page.waitForFunction(() => {
      const active = document.activeElement;
      return active?.getAttribute("data-testid") === "BookingContactRepairMorph";
    });

    await openBookingRoute(page, bookingRecoveryUrl(baseUrl, "waitlistExpired"));
    const waitlistMarkers = await readRecoveryMarkers(page);
    assertCondition(waitlistMarkers.reason === "expired_action", "waitlist expiry reason drifted");
    assertCondition(
      (await page.getByTestId("waitlist-expiry-outcome").count()) === 0,
      "waitlist expiry should reopen through the authoritative recovery shell",
    );
    await page.getByTestId("booking-recovery-action-keep_waitlist_active").click();
    await page.waitForFunction(() => {
      const route = document.querySelector("[data-testid='patient-waitlist-stage']");
      return (
        route?.getAttribute("data-waitlist-state") === "manage_status" &&
        !document.querySelector("[data-testid='BookingRecoveryShell']")
      );
    });

    await assertNoHorizontalOverflow(page, "301 booking recovery desktop");
    assertCondition(
      externalRequests.size === 0,
      `booking recovery routes should not fetch external resources: ${Array.from(externalRequests).join(", ")}`,
    );

    await page.screenshot({
      path: outputPath("301-booking-recovery-envelopes.png"),
      fullPage: true,
      animations: "disabled",
      caret: "hide",
    });
    await context.tracing.stop({
      path: outputPath("301-booking-recovery-envelopes-trace.zip"),
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
