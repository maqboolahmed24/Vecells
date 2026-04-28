import {
  WORKSPACE_BOOKINGS_ROUTE_SELECTOR,
  assertCondition,
  captureAriaTree,
  importPlaywright,
  openStaffBookingRoute,
  startClinicalWorkspace,
  stopClinicalWorkspace,
  writeAccessibilitySnapshot,
  writeWorkspaceAriaSnapshots,
} from "./299_staff_booking_handoff_panel.helpers.ts";

export const staffBookingHandoffPanelAccessibilityCoverage = [
  "root route aria snapshot capture",
  "keyboard tab order through queue and slot controls",
  "status-message and disclosure semantics",
  "pending confirmation accessibility snapshot",
];

// captureAriaTree uses Playwright ariaSnapshot() when it is available.

export async function run(): Promise<void> {
  const playwright = await importPlaywright();
  if (!playwright) {
    return;
  }

  const { child, baseUrl } = await startClinicalWorkspace();
  const browser = await playwright.chromium.launch({ headless: true });

  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 960 } });

    await openStaffBookingRoute(page, baseUrl, "/workspace/bookings");
    await page.locator("[data-testid='BookingExceptionQueuePanel']").getByRole("button").first().focus();
    let focusedAfterQueue = "";
    for (let step = 0; step < 8; step += 1) {
      await page.keyboard.press("Tab");
      focusedAfterQueue = await page.evaluate(() =>
        document.activeElement?.getAttribute("data-testid") ?? document.activeElement?.id ?? "",
      );
      if (
        focusedAfterQueue.startsWith("booking-select-slot-") ||
        focusedAfterQueue.startsWith("booking-compare-slot-")
      ) {
        break;
      }
    }
    assertCondition(
      focusedAfterQueue.startsWith("booking-select-slot-") || focusedAfterQueue.startsWith("booking-compare-slot-"),
      "tab order should eventually move from the queue rail into slot controls",
    );

    await page.locator("[data-testid='booking-select-slot-slot_299_compare_1040']").focus();
    await page.keyboard.press("Tab");
    const focusedAfterSelect = await page.evaluate(() =>
      document.activeElement?.getAttribute("data-testid") ?? document.activeElement?.textContent ?? "",
    );
    assertCondition(
      String(focusedAfterSelect).includes("booking-compare-slot-slot_299_compare_1040") ||
        String(focusedAfterSelect).includes("Hide slot detail") ||
        String(focusedAfterSelect).includes("Show slot detail"),
      "slot controls should keep a logical keyboard order inside the list",
    );

    const liveRegionCount = await page.locator("[role='status']").count();
    assertCondition(liveRegionCount >= 2, "booking route should expose live status regions");
    const disclosureButton = page
      .locator("[data-testid='BookingAssistableSlotCard'] button[aria-controls][aria-expanded='false']")
      .first();
    const disclosurePanelId = await disclosureButton.getAttribute("aria-controls");
    assertCondition(Boolean(disclosurePanelId), "slot disclosure should expose an aria-controls target");
    assertCondition((await disclosureButton.getAttribute("aria-expanded")) === "false", "slot disclosure should start collapsed");
    await disclosureButton.click();
    const expandedDisclosureButton = page.locator(`button[aria-controls='${disclosurePanelId}']`);
    assertCondition(
      (await expandedDisclosureButton.getAttribute("aria-expanded")) === "true",
      "slot disclosure should expose expanded state",
    );

    const routeAriaSnapshot = await captureAriaTree(page, WORKSPACE_BOOKINGS_ROUTE_SELECTOR);
    await openStaffBookingRoute(page, baseUrl, "/workspace/bookings/booking_case_299_pending_confirmation");
    const pendingAriaSnapshot = await captureAriaTree(page, WORKSPACE_BOOKINGS_ROUTE_SELECTOR);

    await writeWorkspaceAriaSnapshots(
      {
        compare_live: routeAriaSnapshot,
        pending_confirmation: pendingAriaSnapshot,
      },
      "299-staff-booking-handoff-aria.json",
    );
    await writeAccessibilitySnapshot(page, "299-staff-booking-handoff-a11y-snapshot.json");
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
