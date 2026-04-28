import {
  assertCondition,
  importPlaywright,
  openBookingRoute,
  outputPath,
  startPatientWeb,
  stopPatientWeb,
  trackExternalRequests,
} from "./293_patient_booking_workspace.helpers.ts";

export const patientAppointmentManageCoverage = [
  "calm appointment detail render",
  "cancel confirmation stays same-shell and settles through pending",
  "blocked reminder posture shows in-place repair",
  "stale manage route freezes ordinary actions without losing the summary",
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
      `${baseUrl}/bookings/booking_case_297_ready/manage?origin=appointments&returnRoute=/appointments`,
    );
    const manageRoot = page.getByTestId("patient-appointment-manage-view");
    await manageRoot.waitFor();
    assertCondition(
      (await manageRoot.getAttribute("data-manage-capability")) ===
        "appointment_cancel|appointment_reschedule|appointment_detail_update|reminder_change",
      "ready manage route capability marker drifted",
    );
    assertCondition(
      await page.getByTestId("appointment-summary-card").isVisible(),
      "appointment summary card should render in the ready manage route",
    );
    assertCondition(
      await page.getByTestId("attendance-instruction-panel").isVisible(),
      "attendance guidance should stay visible in the ready manage route",
    );
    await page.getByTestId("manage-reminder-primary-action").click();
    await page.waitForFunction(() => {
      const root = document.querySelector("[data-testid='patient-appointment-manage-view']");
      return root?.getAttribute("data-manage-pending-state") === "reminder_pending";
    });
    assertCondition(
      (await manageRoot.getAttribute("data-reminder-exposure")) === "pending_schedule",
      "reminder change should widen to pending schedule before it can claim success",
    );
    await page.getByTestId("manage-reminder-primary-action").click();
    await page.waitForFunction(() => {
      const root = document.querySelector("[data-testid='patient-appointment-manage-view']");
      return root?.getAttribute("data-manage-pending-state") === "idle";
    });

    await page.getByTestId("manage-open-cancel").click();
    const cancelDialog = page.getByTestId("cancel-appointment-flow");
    await cancelDialog.waitFor();
    await page.locator("#cancel-reason").fill("I can no longer attend this morning.");
    await page.getByTestId("cancel-appointment-confirm").click();
    await page.waitForFunction(() => {
      const root = document.querySelector("[data-testid='patient-appointment-manage-view']");
      return root?.getAttribute("data-manage-pending-state") === "cancel_pending";
    });
    assertCondition(
      (await manageRoot.getAttribute("data-reminder-exposure")) === "blocked",
      "cancellation pending should suppress reminder exposure",
    );
    await page.getByTestId("manage-state-action-refresh_manage_status").click();
    await page.waitForFunction(() => {
      const root = document.querySelector("[data-testid='patient-appointment-manage-view']");
      return root?.getAttribute("data-manage-pending-state") === "settled";
    });
    assertCondition(
      await page.getByText("Cancellation is now authoritative.").isVisible(),
      "authoritative cancellation state should render after refresh",
    );

    await openBookingRoute(
      page,
      `${baseUrl}/bookings/booking_case_297_reminder_blocked/manage?origin=appointments&returnRoute=/appointments`,
    );
    assertCondition(
      (await manageRoot.getAttribute("data-reminder-exposure")) === "blocked",
      "reminder blocked scenario should expose blocked reminder marker",
    );
    assertCondition(
      await page.getByTestId("manage-contact-repair-panel").isVisible(),
      "blocked reminder scenario should keep the repair panel in place",
    );

    await openBookingRoute(
      page,
      `${baseUrl}/bookings/booking_case_297_stale/manage?origin=appointments&returnRoute=/appointments`,
    );
    assertCondition(
      (await manageRoot.getAttribute("data-continuity-state")) === "stale",
      "stale manage scenario should expose stale continuity",
    );
    assertCondition(
      await page.getByTestId("appointment-summary-card").isVisible(),
      "stale manage scenario should keep the appointment summary visible",
    );
    assertCondition(
      await page.getByTestId("manage-open-cancel").isDisabled(),
      "stale manage route must freeze destructive action entry",
    );

    assertCondition(
      externalRequests.size == 0,
      `manage route should not fetch external resources: ${Array.from(externalRequests).join(", ")}`,
    );

    await context.tracing.stop({
      path: outputPath("297-appointment-manage-views-trace.zip"),
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
