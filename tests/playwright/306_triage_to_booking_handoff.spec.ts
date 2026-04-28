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
} from "./299_staff_booking_handoff_panel.helpers.ts";

export const triageToBookingHandoffCoverage = [
  "secure-link handoff booking case keeps the 306 booking-case id across the staff route and queue row",
  "pending confirmation remains visibly non-booked in the staff panel",
  "reopened booking handoff fails closed into stale-owner recovery",
];

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

    const route = page.locator(WORKSPACE_BOOKINGS_ROUTE_SELECTOR);

    await openStaffBookingRoute(page, baseUrl, "/workspace/bookings/booking_case_306_handoff_live");
    assertCondition(
      (await route.getAttribute("data-booking-case")) === "booking_case_306_handoff_live",
      "staff handoff route should preserve the 306 booking case id",
    );
    assertCondition(
      (await route.getAttribute("data-confirmation-truth")) === "pre_commit_review",
      "handoff-live route should still be pre-commit review",
    );
    assertCondition(
      (await route.getAttribute("data-task-settlement")) === "gated",
      "handoff-live route should remain gated",
    );
    assertCondition(
      (await route.getAttribute("data-review-lease-state")) === "live",
      "handoff-live route should keep a live review lease",
    );
    const handoffQueueRow = page.locator(
      "[data-testid='BookingExceptionQueueRow'][data-booking-case='booking_case_306_handoff_live']",
    );
    await handoffQueueRow.waitFor();
    assertCondition(
      (await handoffQueueRow.getAttribute("data-selected")) === "true",
      "handoff-live queue row should stay selected for the 306 booking case",
    );

    await openStaffBookingRoute(
      page,
      baseUrl,
      "/workspace/bookings/booking_case_306_confirmation_pending",
    );
    assertCondition(
      (await route.getAttribute("data-confirmation-truth")) === "confirmation_pending",
      "pending route should keep confirmation_pending truth",
    );
    assertCondition(
      (await route.getAttribute("data-task-settlement")) === "pending_settlement",
      "pending route should keep pending settlement",
    );
    await page
      .locator("[data-testid='TaskSettlementAndReacquireStrip']")
      .getByText("accepted for processing", { exact: false })
      .waitFor();
    assertCondition(
      ((await route.textContent()) ?? "").toLowerCase().includes("confirmed booking") === false,
      "pending route must not imply confirmed booking calmness",
    );

    await openStaffBookingRoute(page, baseUrl, "/workspace/bookings/booking_case_306_reopened");
    assertCondition(
      (await route.getAttribute("data-booking-case")) === "booking_case_306_reopened",
      "reopened route should preserve the 306 booking case id",
    );
    assertCondition(
      (await route.getAttribute("data-review-lease-state")) === "stale_owner",
      "reopened route should fail closed into stale-owner posture",
    );
    assertCondition(
      (await route.getAttribute("data-task-settlement")) === "reacquire_required",
      "reopened route should require reacquire before settlement",
    );
    await page
      .locator("[data-testid='AssistedBookingRecoveryPanel']")
      .getByText("Stale-owner recovery", { exact: false })
      .waitFor();

    await assertNoHorizontalOverflow(page, "306 triage to booking handoff desktop");
    assertCondition(
      externalRequests.size === 0,
      `306 staff handoff route should not fetch external resources: ${Array.from(externalRequests).join(", ")}`,
    );

    await context.tracing.stop({
      path: outputPath("306-triage-to-booking-handoff-trace.zip"),
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
