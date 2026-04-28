import {
  assertCondition,
  importPlaywright,
  openBookingRoute,
  outputPath,
  startPatientWeb,
  stopPatientWeb,
  trackExternalRequests,
} from "./293_patient_booking_workspace.helpers.ts";

export const bookingCoreBrowserTruthCoverage = [
  "browser-visible capability live versus blocked posture",
  "slot snapshot partial-coverage semantics stay in the same shell",
  "truthful nonexclusive wording diverges from exclusive hold wording",
  "confirmation pending, confirmed, and recovery postures remain explicit",
  "trace capture and zero external-resource fetches for booking core proofs",
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

    await openBookingRoute(
      page,
      `${baseUrl}/bookings/booking_case_293_live?origin=appointments&returnRoute=/appointments`,
    );
    const route = page.getByTestId("Patient_Booking_Workspace_Route");
    assertCondition(
      (await route.getAttribute("data-capability-posture")) === "self_service_live",
      "live booking workspace posture drifted",
    );
    assertCondition(
      (await route.getAttribute("data-dominant-action")) === "search_slots",
      "live booking workspace dominant action drifted",
    );

    await openBookingRoute(
      page,
      `${baseUrl}/bookings/booking_case_293_blocked?origin=appointments&returnRoute=/appointments`,
    );
    assertCondition(
      (await route.getAttribute("data-capability-posture")) === "blocked",
      "blocked booking workspace posture drifted",
    );
    assertCondition(
      (await route.getAttribute("data-shell-state")) === "read_only",
      "blocked booking workspace shell state drifted",
    );

    await openBookingRoute(
      page,
      `${baseUrl}/bookings/booking_case_294_partial/select?origin=appointments&returnRoute=/appointments`,
    );
    const slotStage = page.getByTestId("booking-slot-results-stage");
    assertCondition(
      (await slotStage.getAttribute("data-view-state")) === "partial_coverage",
      "partial coverage route should stay explicit in stage metadata",
    );
    assertCondition(
      await page.getByTestId("snapshot-coverage-ribbon").isVisible(),
      "partial coverage ribbon should remain visible",
    );

    await openBookingRoute(
      page,
      `${baseUrl}/bookings/booking_case_295_nonexclusive/select?origin=appointments&returnRoute=/appointments`,
    );
    const truthBanner = page.getByTestId("reservation-truth-banner");
    assertCondition(
      (await slotStage.getAttribute("data-reservation-truth")) === "truthful_nonexclusive",
      "truthful nonexclusive marker drifted",
    );
    assertCondition(
      ((await truthBanner.textContent()) ?? "").includes("Not held"),
      "truthful nonexclusive wording drifted",
    );

    await openBookingRoute(
      page,
      `${baseUrl}/bookings/booking_case_295_exclusive_hold/select?origin=appointments&returnRoute=/appointments`,
    );
    assertCondition(
      (await slotStage.getAttribute("data-reservation-truth")) === "exclusive_held",
      "exclusive hold marker drifted",
    );
    assertCondition(
      ((await truthBanner.textContent()) ?? "").includes("really held"),
      "exclusive hold wording drifted",
    );

    await openBookingRoute(
      page,
      `${baseUrl}/bookings/booking_case_296_pending/confirm?origin=appointments&returnRoute=/appointments`,
    );
    const confirmationStage = page.getByTestId("booking-confirmation-stage");
    assertCondition(
      (await confirmationStage.getAttribute("data-confirmation-truth")) ===
        "confirmation_pending",
      "pending confirmation posture drifted",
    );
    assertCondition(
      await page.getByTestId("confirmation-pending-state").isVisible(),
      "pending confirmation child state should remain visible",
    );

    await openBookingRoute(
      page,
      `${baseUrl}/bookings/booking_case_296_confirmed/confirm?origin=appointments&returnRoute=/appointments`,
    );
    assertCondition(
      (await confirmationStage.getAttribute("data-confirmation-truth")) === "confirmed",
      "confirmed posture drifted",
    );
    assertCondition(
      await page.getByTestId("booked-summary-child-state").isVisible(),
      "confirmed summary state should remain visible",
    );

    await openBookingRoute(
      page,
      `${baseUrl}/bookings/booking_case_296_reconciliation/confirm?origin=appointments&returnRoute=/appointments`,
    );
    await page.getByTestId("BookingRecoveryShell").waitFor();
    assertCondition(
      (await confirmationStage.getAttribute("data-confirmation-truth")) ===
        "reconciliation_required",
      "reconciliation posture drifted",
    );
    assertCondition(
      await page.getByTestId("BookingRecoveryShell").isVisible(),
      "reconciliation recovery state should remain visible in shell",
    );

    assertCondition(
      externalRequests.size === 0,
      `booking core browser proof fetched unexpected external resources: ${Array.from(externalRequests).join(", ")}`,
    );

    await context.tracing.stop({
      path: outputPath("307-booking-core-browser-truth-trace.zip"),
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
