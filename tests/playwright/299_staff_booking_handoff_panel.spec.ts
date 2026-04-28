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
} from "./299_staff_booking_handoff_panel.helpers.ts";

export const staffBookingHandoffPanelCoverage = [
  "default compare-live route markers",
  "queue row navigation across booking cases",
  "compare-anchor mutation inside the same shell",
  "pending-confirmation truth remains non-booked",
  "desktop overflow and external-request assertions",
];

// The booking route under test is the inner WorkspaceBookingsRoute surface inside the shared shell wrapper.

export async function run(): Promise<void> {
  const playwright = await importPlaywright();
  if (!playwright) {
    return;
  }

  const { child, baseUrl } = await startClinicalWorkspace();
  const browser = await playwright.chromium.launch({ headless: true });

  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1080 } });
    const externalRequests = new Set<string>();
    trackExternalRequests(page, baseUrl, externalRequests);

    await openStaffBookingRoute(page, baseUrl, "/workspace/bookings");
    const route = page.locator(WORKSPACE_BOOKINGS_ROUTE_SELECTOR);
    await route.waitFor();
    assertCondition((await route.getAttribute("data-shell")) === "staff-booking", "booking shell marker drifted");
    assertCondition(
      (await route.getAttribute("data-booking-case")) === "booking_case_299_compare_live",
      "default booking case drifted",
    );
    assertCondition(
      (await route.getAttribute("data-focus-protected")) === "true",
      "compare route should start focus protected",
    );

    await page.locator("[data-testid='booking-compare-slot-slot_299_compare_1530']").click();
    await page
      .locator("[data-testid='AssistedSlotCompareStage']")
      .getByText("Community clinic south", { exact: false })
      .waitFor();

    await page
      .locator("[data-testid='BookingExceptionQueueRow'][data-booking-case='booking_case_299_linkage_required']")
      .getByRole("button")
      .click();
    await page.waitForURL(`${baseUrl}/workspace/bookings/booking_case_299_linkage_required`);
    await waitForStaffBookingCase(page, "booking_case_299_linkage_required");
    assertCondition(
      (await route.getAttribute("data-exception-class")) === "linkage_required_blocker",
      "linkage-required booking case should surface its blocker",
    );
    await page
      .locator("[data-testid='AssistedBookingCaseSummary']")
      .getByText("Self-service stopped at the linkage boundary")
      .waitFor();

    await openStaffBookingRoute(page, baseUrl, "/workspace/bookings/booking_case_299_pending_confirmation");
    assertCondition(
      (await route.getAttribute("data-confirmation-truth")) === "confirmation_pending",
      "pending confirmation route should keep pending truth marker",
    );
    assertCondition(
      (await route.getAttribute("data-task-settlement")) === "pending_settlement",
      "pending confirmation route should keep pending settlement marker",
    );
    await page
      .locator("[data-testid='TaskSettlementAndReacquireStrip']")
      .getByText("accepted for processing", { exact: false })
      .waitFor();
    assertCondition(
      ((await route.textContent()) ?? "").toLowerCase().includes("confirmed booking") === false,
      "pending confirmation route must not imply a confirmed booking",
    );

    await assertNoHorizontalOverflow(page, "299 staff booking control panel desktop");
    assertCondition(
      externalRequests.size === 0,
      `staff booking route should not fetch external resources: ${Array.from(externalRequests).join(", ")}`,
    );

    await page.screenshot({
      path: outputPath("299-staff-booking-handoff-panel.png"),
      fullPage: true,
      animations: "disabled",
      caret: "hide",
    });
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
