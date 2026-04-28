import {
  assertCondition,
  importPlaywright,
  openBookingRoute,
  startPatientWeb,
  stopPatientWeb,
} from "./293_patient_booking_workspace.helpers.ts";

export const patientBookingConfirmationRefreshCoverage = [
  "browser history returns from confirm to selection and forward again",
  "refresh restores an active confirm attempt without resetting review state",
  "route freeze keeps the selected slot visible while live controls are suppressed",
  "identity repair suppresses manage and artifact exposure in place",
];

export async function run(): Promise<void> {
  const playwright = await importPlaywright();
  if (!playwright) {
    return;
  }

  const { child, baseUrl } = await startPatientWeb();
  const browser = await playwright.chromium.launch({ headless: true });

  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1024 } });
    const confirmationStage = page.getByTestId("booking-confirmation-stage");
    const slotStage = page.getByTestId("booking-slot-results-stage");

    await openBookingRoute(
      page,
      `${baseUrl}/bookings/booking_case_295_exclusive_hold/select?origin=appointments&returnRoute=/appointments`,
    );
    await page.getByTestId("sticky-confirm-continue").click();
    await confirmationStage.waitFor();
    assertCondition(
      (await confirmationStage.getAttribute("data-selected-slot")) === "slot_summary_294_211_0910",
      "held slot should remain the selected anchor when entering confirmation",
    );

    await page.goBack();
    await slotStage.waitFor();
    assertCondition(
      (await slotStage.getAttribute("data-selected-slot")) === "slot_summary_294_211_0910",
      "browser back should return to selection without losing the selected slot",
    );

    await page.goForward();
    await confirmationStage.waitFor();
    assertCondition(
      (await confirmationStage.getAttribute("data-confirmation-truth")) === "pre_commit_review",
      "browser forward should restore the held review state",
    );

    await page.getByTestId("booking-confirmation-primary-action").click();
    await page.reload({ waitUntil: "load" });
    await confirmationStage.waitFor();
    await page.waitForFunction(() => {
      const stage = document.querySelector("[data-testid='booking-confirmation-stage']");
      return stage?.getAttribute("data-confirmation-truth") !== "pre_commit_review";
    });
    assertCondition(
      (await confirmationStage.getAttribute("data-selected-slot")) === "slot_summary_294_211_0910",
      "refresh should preserve the held selected-slot provenance during confirm",
    );

    await openBookingRoute(
      page,
      `${baseUrl}/bookings/booking_case_296_route_drift/confirm?origin=appointments&returnRoute=/appointments`,
    );
    assertCondition(
      (await confirmationStage.getAttribute("data-route-freeze-state")) === "publication_stale",
      "route drift should expose publication-stale freeze posture",
    );
    assertCondition(
      await page.getByTestId("reconciliation-recovery-state").isVisible(),
      "route drift should reuse the same-shell recovery panel",
    );
    assertCondition(
      (await confirmationStage.getAttribute("data-manage-exposure")) === "hidden",
      "route drift must suppress manage exposure",
    );

    await openBookingRoute(
      page,
      `${baseUrl}/bookings/booking_case_296_identity_repair/confirm?origin=appointments&returnRoute=/appointments`,
    );
    assertCondition(
      (await confirmationStage.getAttribute("data-confirmation-truth")) === "confirmed",
      "identity repair scenario should preserve confirmed booking truth",
    );
    assertCondition(
      (await confirmationStage.getAttribute("data-patient-visibility")) === "recovery_required",
      "identity repair should degrade patient visibility in place",
    );
    assertCondition(
      (await confirmationStage.getAttribute("data-manage-exposure")) === "hidden",
      "identity repair must suppress manage exposure",
    );
    assertCondition(
      (await confirmationStage.getAttribute("data-artifact-exposure")) === "hidden",
      "identity repair must suppress artifact exposure",
    );
    assertCondition(
      (await page.getByRole("button", { name: "Manage appointment" }).count()) === 0,
      "identity repair should not expose manage controls",
    );
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
