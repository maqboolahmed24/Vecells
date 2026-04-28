import fs from "node:fs";

import {
  assertCondition,
  importPlaywright,
  openBookingRoute,
  outputPath,
  startPatientWeb,
  stopPatientWeb,
  writeAccessibilitySnapshot,
} from "./293_patient_booking_workspace.helpers.ts";

export const patientBookingConfirmationAccessibilityCoverage = [
  "review aria snapshot",
  "pending aria snapshot",
  "recovery aria snapshot",
  "confirmed aria snapshot",
  "reduced motion and landmark coverage",
];

async function captureAria(locator: any, page: any): Promise<string | Record<string, unknown>> {
  if (typeof locator.ariaSnapshot === "function") {
    return await locator.ariaSnapshot();
  }
  const handle = await locator.elementHandle();
  assertCondition(handle, "accessible root missing");
  const snapshot = await page.accessibility?.snapshot({ root: handle, interestingOnly: false });
  assertCondition(snapshot, "accessibility snapshot missing");
  return snapshot;
}

function writeAriaFile(fileName: string, snapshot: string | Record<string, unknown>): void {
  const content = typeof snapshot === "string" ? snapshot : JSON.stringify(snapshot, null, 2);
  fs.writeFileSync(outputPath(fileName), content, "utf-8");
}

export async function run(): Promise<void> {
  const playwright = await importPlaywright();
  if (!playwright) {
    return;
  }

  const { child, baseUrl } = await startPatientWeb();
  const browser = await playwright.chromium.launch({ headless: true });

  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 960 } });
    const routeRoot = page.getByTestId("Patient_Booking_Workspace_Route");
    const stage = page.getByTestId("booking-confirmation-stage");

    await openBookingRoute(
      page,
      `${baseUrl}/bookings/booking_case_296_review/confirm?origin=appointments&returnRoute=/appointments`,
    );
    await writeAccessibilitySnapshot(page, "296-confirmation-review-accessibility.json");
    writeAriaFile("296-confirmation-review-aria.yml", await captureAria(stage, page));
    assertCondition((await page.locator("main").count()) === 1, "expected one main landmark");
    assertCondition((await page.locator("nav").count()) >= 1, "nav landmark missing");
    assertCondition((await stage.getAttribute("data-confirmation-truth")) === "pre_commit_review", "review truth marker drifted");

    await openBookingRoute(
      page,
      `${baseUrl}/bookings/booking_case_296_pending/confirm?origin=appointments&returnRoute=/appointments`,
    );
    await writeAccessibilitySnapshot(page, "296-confirmation-pending-accessibility.json");
    writeAriaFile("296-confirmation-pending-aria.yml", await captureAria(stage, page));
    assertCondition(
      await page.getByTestId("confirmation-pending-state").isVisible(),
      "pending state should stay accessible in the same shell",
    );

    await openBookingRoute(
      page,
      `${baseUrl}/bookings/booking_case_296_reconciliation/confirm?origin=appointments&returnRoute=/appointments`,
    );
    await writeAccessibilitySnapshot(page, "296-confirmation-recovery-accessibility.json");
    writeAriaFile("296-confirmation-recovery-aria.yml", await captureAria(stage, page));
    assertCondition(
      (await stage.getAttribute("data-route-freeze-state")) === "live",
      "reconciliation route should not pretend to be a publication freeze",
    );

    await openBookingRoute(
      page,
      `${baseUrl}/bookings/booking_case_296_confirmed/confirm?origin=appointments&returnRoute=/appointments`,
    );
    await writeAccessibilitySnapshot(page, "296-confirmation-confirmed-accessibility.json");
    writeAriaFile("296-confirmation-confirmed-aria.yml", await captureAria(stage, page));
    assertCondition(
      (await stage.getAttribute("data-artifact-exposure")) === "handoff_ready",
      "confirmed route should expose handoff-ready artifact state",
    );

    await page.emulateMedia({ reducedMotion: "reduce" });
    await openBookingRoute(
      page,
      `${baseUrl}/bookings/booking_case_296_route_drift/confirm?origin=appointments&returnRoute=/appointments`,
    );
    assertCondition(
      (await routeRoot.getAttribute("data-motion-profile")) === "reduced",
      "reduced motion marker drifted",
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
