import fs from "node:fs";

import {
  WORKSPACE_BOOKINGS_ROUTE_SELECTOR,
  assertCondition,
  assertNoHorizontalOverflow,
  importPlaywright,
  openStaffBookingRoute,
  outputPath,
  startClinicalWorkspace,
  stopClinicalWorkspace,
  trackExternalRequests,
  waitForStaffBookingCase,
  writeAccessibilitySnapshot,
} from "./299_staff_booking_handoff_panel.helpers.ts";

export const staffAssistedBookingAndRecoveryCoverage = [
  "compare-live handoff route keeps one governed booking lineage and protected compare anchors",
  "stale-owner and publication drift freeze slot mutation while preserving provenance in place",
  "pending confirmation stays explicitly non-booked on the staff surface",
  "high-risk workspace controls preserve focus visibility, target size, and zero external requests",
];

async function captureAria(locator: any, page: any): Promise<string | Record<string, unknown>> {
  if (typeof locator.ariaSnapshot === "function") {
    return await locator.ariaSnapshot();
  }
  const handle = await locator.elementHandle();
  assertCondition(handle, "accessible staff booking root missing");
  const snapshot = await page.accessibility?.snapshot({ root: handle, interestingOnly: false });
  assertCondition(snapshot, "staff booking accessibility snapshot missing");
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

  const { child, baseUrl } = await startClinicalWorkspace();
  const browser = await playwright.chromium.launch({ headless: true });

  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1080 } });
    await context.tracing.start({ screenshots: true, snapshots: true });
    const page = await context.newPage();
    const externalRequests = new Set<string>();
    trackExternalRequests(page, baseUrl, externalRequests);

    await openStaffBookingRoute(page, baseUrl, "/workspace/bookings");
    const route = page.locator(WORKSPACE_BOOKINGS_ROUTE_SELECTOR);
    await route.waitFor();
    assertCondition(
      (await route.getAttribute("data-booking-case")) === "booking_case_299_compare_live",
      "default assisted-booking case drifted",
    );
    assertCondition(
      (await route.getAttribute("data-review-lease-state")) === "live",
      "compare-live review lease state drifted",
    );
    assertCondition(
      (await route.getAttribute("data-focus-protected")) === "true",
      "compare-live route should keep focus protection active",
    );
    assertCondition(
      (await route.getAttribute("data-confirmation-truth")) === "pre_commit_review",
      "compare-live route should remain pre-commit review",
    );
    const queueButton = page
      .locator(
        "[data-testid='BookingExceptionQueueRow'][data-booking-case='booking_case_299_stale_recovery']",
      )
      .getByRole("button");
    const compareButton = page.getByTestId("booking-compare-slot-slot_299_compare_1530");
    await assertTargetSize(queueButton, "staff exception queue row");
    await assertTargetSize(compareButton, "staff compare button");
    await assertFocusedVisible(queueButton, page, "staff exception queue row");
    await compareButton.click();
    await page
      .locator("[data-testid='AssistedSlotCompareStage']")
      .getByText("Community clinic south", { exact: false })
      .waitFor();

    await queueButton.click();
    await page.waitForURL(`${baseUrl}/workspace/bookings/booking_case_299_stale_recovery`);
    await waitForStaffBookingCase(page, "booking_case_299_stale_recovery");
    assertCondition(
      (await route.getAttribute("data-exception-class")) === "stale_owner_or_publication_drift",
      "stale recovery exception class drifted",
    );
    assertCondition(
      (await route.getAttribute("data-review-lease-state")) === "stale_owner",
      "stale recovery review lease state drifted",
    );
    assertCondition(
      (await route.getAttribute("data-focus-protected")) === "stale",
      "stale recovery must preserve focus protection as stale provenance",
    );
    assertCondition(
      (await route.getAttribute("data-task-settlement")) === "reacquire_required",
      "stale recovery settlement posture drifted",
    );
    assertCondition(
      await page.getByTestId("AssistedBookingRecoveryPanel").isVisible(),
      "stale recovery should keep the recovery panel visible",
    );
    assertCondition(
      await page.getByTestId("booking-select-slot-slot_299_stale_0840").isDisabled(),
      "stale recovery must freeze slot selection under invalidated focus lease",
    );
    await writeAccessibilitySnapshot(page, "308-staff-stale-recovery-accessibility.json");
    writeAriaFile("308-staff-stale-recovery-aria.yml", await captureAria(route, page));

    await openStaffBookingRoute(
      page,
      baseUrl,
      "/workspace/bookings/booking_case_299_pending_confirmation",
    );
    assertCondition(
      (await route.getAttribute("data-confirmation-truth")) === "confirmation_pending",
      "pending-confirmation staff marker drifted",
    );
    assertCondition(
      (await route.getAttribute("data-task-settlement")) === "pending_settlement",
      "pending-confirmation staff settlement marker drifted",
    );
    assertCondition(
      ((await route.textContent()) ?? "").toLowerCase().includes("confirmed booking") === false,
      "pending-confirmation staff surface must not imply a confirmed booking",
    );
    assertCondition(
      (await page.locator("[role='status']").count()) >= 2,
      "staff booking surface should expose live status regions",
    );
    await assertNoHorizontalOverflow(page, "308 staff assisted booking desktop");

    assertCondition(
      externalRequests.size === 0,
      `staff assisted-booking proof should not fetch external resources: ${Array.from(externalRequests).join(", ")}`,
    );

    await page.screenshot({
      path: outputPath("308-staff-assisted-booking-and-recovery.png"),
      fullPage: true,
      animations: "disabled",
      caret: "hide",
    });
    await context.tracing.stop({
      path: outputPath("308-staff-assisted-booking-and-recovery-trace.zip"),
    });
    await context.close();
  } finally {
    await browser.close();
    await stopClinicalWorkspace(child);
  }
}

if (process.argv.includes("--run")) {
  run().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
