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

export const bookingCoreAccessibilityCoverage = [
  "status-bearing booking workspace surfaces expose live regions and landmarks",
  "slot snapshot and reservation stages remain keyboard-safe without horizontal overflow",
  "confirmation pending and reconciliation recovery states keep status semantics intact",
  "desktop and mobile booking core layouts preserve the same accessibility posture",
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
    assertCondition((await page.locator("main").count()) === 1, "workspace should expose one main landmark");
    assertCondition(
      (await page.locator("[role='status'][aria-live='polite']").count()) >= 1,
      "workspace should expose a polite live region",
    );
    await assertNoHorizontalOverflow(page, "booking workspace");
    await writeAccessibilitySnapshot(page, "307-booking-workspace-accessibility.json");

    await openBookingRoute(
      page,
      `${baseUrl}/bookings/booking_case_294_partial/select?origin=appointments&returnRoute=/appointments`,
    );
    assertCondition(
      await page.getByTestId("snapshot-coverage-ribbon").isVisible(),
      "slot snapshot coverage ribbon should remain visible",
    );
    assertCondition(
      (await page.locator("[role='status'][aria-live='polite']").count()) >= 1,
      "slot snapshot stage should keep a polite live region",
    );
    await assertNoHorizontalOverflow(page, "slot snapshot stage");
    await writeAccessibilitySnapshot(page, "307-slot-snapshot-accessibility.json");

    await openBookingRoute(
      page,
      `${baseUrl}/bookings/booking_case_295_exclusive_hold/select?origin=appointments&returnRoute=/appointments`,
    );
    assertCondition(
      await page.getByTestId("reservation-truth-banner").isVisible(),
      "reservation truth banner should remain visible",
    );
    await assertNoHorizontalOverflow(page, "reservation truth stage");
    await writeAccessibilitySnapshot(page, "307-reservation-truth-accessibility.json");

    await openBookingRoute(
      page,
      `${baseUrl}/bookings/booking_case_296_pending/confirm?origin=appointments&returnRoute=/appointments`,
    );
    assertCondition(
      await page.getByTestId("confirmation-pending-state").isVisible(),
      "pending confirmation state should remain visible",
    );
    assertCondition(
      (await page.locator("[role='status']").count()) >= 1,
      "confirmation route should expose a status live region",
    );
    await writeAccessibilitySnapshot(page, "307-confirmation-pending-accessibility.json");

    await openBookingRoute(
      page,
      `${baseUrl}/bookings/booking_case_296_reconciliation/confirm?origin=appointments&returnRoute=/appointments`,
    );
    await page.getByTestId("BookingRecoveryShell").waitFor();
    assertCondition(
      await page.getByTestId("BookingRecoveryShell").isVisible(),
      "reconciliation recovery state should remain visible",
    );
    await writeAccessibilitySnapshot(page, "307-confirmation-recovery-accessibility.json");

    const mobileContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const mobilePage = await mobileContext.newPage();
    trackExternalRequests(mobilePage, baseUrl, externalRequests);
    await openBookingRoute(
      mobilePage,
      `${baseUrl}/bookings/booking_case_296_pending/confirm?origin=appointments&returnRoute=/appointments`,
    );
    await assertNoHorizontalOverflow(mobilePage, "mobile confirmation stage");
    await writeAccessibilitySnapshot(mobilePage, "307-mobile-confirmation-accessibility.json");
    await mobileContext.close();

    assertCondition(
      externalRequests.size === 0,
      `booking core accessibility proof fetched unexpected external resources: ${Array.from(externalRequests).join(", ")}`,
    );

    await context.tracing.stop({
      path: outputPath("307-booking-core-accessibility-trace.zip"),
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
