import fs from "node:fs";

import {
  assertCondition,
  assertNoHorizontalOverflow,
  importPlaywright,
  openBookingRoute,
  outputPath,
  startPatientWeb,
  stopPatientWeb,
  trackExternalRequests,
  writeAccessibilitySnapshot,
} from "./293_patient_booking_workspace.helpers.ts";

export const patientManageTruthCoverage = [
  "live manage posture keeps cancel, reschedule, and detail-update inside the same shell",
  "confirmation-pending posture stays summary-only and never reopens writable manage controls",
  "stale-route recovery keeps summary-only posture explicit without reopening writable controls",
  "manage controls keep accessible focus visibility and minimum target size on desktop",
];

async function captureAria(locator: any, page: any): Promise<string | Record<string, unknown>> {
  if (typeof locator.ariaSnapshot === "function") {
    return await locator.ariaSnapshot();
  }
  const handle = await locator.elementHandle();
  assertCondition(handle, "accessible manage root missing");
  const snapshot = await page.accessibility?.snapshot({ root: handle, interestingOnly: false });
  assertCondition(snapshot, "manage accessibility snapshot missing");
  return snapshot;
}

function writeAriaFile(fileName: string, snapshot: string | Record<string, unknown>): void {
  const content = typeof snapshot === "string" ? snapshot : JSON.stringify(snapshot, null, 2);
  fs.writeFileSync(outputPath(fileName), content, "utf-8");
}

async function assertTargetSize(locator: any, label: string): Promise<void> {
  const box = await locator.boundingBox();
  assertCondition(box, `${label} target box missing`);
  assertCondition(
    box.width >= 24 && box.height >= 24,
    `${label} target smaller than 24x24 CSS pixels`,
  );
}

async function assertFocusedVisible(locator: any, page: any, label: string): Promise<void> {
  await locator.scrollIntoViewIfNeeded();
  await locator.focus();
  const box = await locator.boundingBox();
  const viewport = page.viewportSize();
  assertCondition(box, `${label} focus box missing`);
  assertCondition(viewport, `${label} viewport missing`);
  assertCondition(
    box.x + box.width > 0 &&
      box.y + box.height > 0 &&
      box.x < viewport.width &&
      box.y < viewport.height,
    `${label} focus became obscured or off-screen`,
  );
}

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

    const manageRoot = page.getByTestId("patient-appointment-manage-view");

    await openBookingRoute(
      page,
      `${baseUrl}/bookings/booking_case_297_ready/manage?origin=appointments&returnRoute=/appointments`,
    );
    await manageRoot.waitFor();
    assertCondition(
      (await manageRoot.getAttribute("data-manage-exposure")) === "writable",
      "ready manage route must stay writable",
    );
    assertCondition(
      (await manageRoot.getAttribute("data-confirmation-truth")) === "confirmed",
      "ready manage route must stay bound to confirmed truth",
    );
    assertCondition(
      (await manageRoot.getAttribute("data-manage-capability")) ===
        "appointment_cancel|appointment_reschedule|appointment_detail_update|reminder_change",
      "ready manage capability tuple drifted",
    );
    assertCondition(
      (await page.locator("main").count()) === 1,
      "manage route should expose one main landmark",
    );
    assertCondition(
      (await page.locator("[role='status']").count()) >= 1,
      "manage route should expose at least one live status region",
    );
    const cancelButton = page.getByTestId("manage-open-cancel");
    const rescheduleButton = page.getByTestId("manage-action-open_reschedule");
    await assertTargetSize(cancelButton, "manage cancel button");
    await assertTargetSize(rescheduleButton, "manage reschedule button");
    await assertFocusedVisible(cancelButton, page, "manage cancel button");
    await writeAccessibilitySnapshot(page, "308-manage-ready-accessibility.json");
    writeAriaFile("308-manage-ready-aria.yml", await captureAria(manageRoot, page));

    await page.getByTestId("manage-action-open_detail_update").click();
    await page.getByTestId("appointment-detail-update-form").waitFor();
    await page.getByTestId("manage-detail-cancel").click();
    await page.getByTestId("appointment-summary-card").waitFor();

    await rescheduleButton.click();
    await page.getByTestId("reschedule-entry-stage").waitFor();
    await page.getByTestId("manage-reschedule-back").click();
    await page.getByTestId("appointment-summary-card").waitFor();

    await cancelButton.click();
    const cancelDialog = page.getByTestId("cancel-appointment-flow");
    await cancelDialog.waitFor();
    await page.getByTestId("cancel-appointment-close").click();
    await page.waitForFunction(() => {
      return document.querySelector("[data-testid='cancel-appointment-flow']") === null;
    });

    await openBookingRoute(
      page,
      `${baseUrl}/bookings/booking_case_296_pending/manage?origin=appointments&returnRoute=/appointments`,
    );
    assertCondition(
      (await manageRoot.getAttribute("data-confirmation-truth")) === "confirmation_pending",
      "confirmation-pending manage route marker drifted",
    );
    assertCondition(
      (await manageRoot.getAttribute("data-manage-exposure")) === "summary_only",
      "confirmation-pending manage route must stay summary-only",
    );
    assertCondition(
      (await manageRoot.getAttribute("data-manage-capability")) === "summary_only",
      "confirmation-pending manage route must not expose writable capability",
    );
    const pendingCancel = page.getByTestId("manage-open-cancel");
    const pendingCancelCount = await pendingCancel.count();
    assertCondition(
      pendingCancelCount === 0 || (await pendingCancel.isDisabled()),
      "confirmation-pending manage route must not expose an active cancel entry",
    );
    assertCondition(
      (await page.getByTestId("manage-reminder-primary-action").count()) === 0,
      "confirmation-pending manage route must not expose reminder mutation",
    );

    await openBookingRoute(
      page,
      `${baseUrl}/bookings/booking_case_297_stale/manage?origin=appointments&returnRoute=/appointments`,
    );
    assertCondition(
      (await manageRoot.getAttribute("data-continuity-state")) === "stale",
      "stale manage route must expose stale continuity",
    );
    assertCondition(
      (await manageRoot.getAttribute("data-manage-exposure")) === "summary_only",
      "stale manage route must stay summary-only",
    );
    const staleCancel = page.getByTestId("manage-open-cancel");
    const staleCancelCount = await staleCancel.count();
    assertCondition(
      staleCancelCount === 0 || (await staleCancel.isDisabled()),
      "stale manage route must not expose an active cancel entry",
    );
    await writeAccessibilitySnapshot(page, "308-manage-stale-accessibility.json");
    writeAriaFile("308-manage-stale-aria.yml", await captureAria(manageRoot, page));
    await assertNoHorizontalOverflow(page, "308 patient manage truth desktop");

    assertCondition(
      externalRequests.size === 0,
      `patient manage truth should not fetch external resources: ${Array.from(externalRequests).join(", ")}`,
    );

    await context.tracing.stop({
      path: outputPath("308-patient-manage-truth-trace.zip"),
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
