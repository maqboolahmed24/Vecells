import {
  WORKSPACE_BOOKINGS_ROUTE_SELECTOR,
  assertCondition,
  importPlaywright,
  openStaffBookingRoute,
  startClinicalWorkspace,
  startTracedContext,
  stopClinicalWorkspace,
  stopTrace,
} from "./299_staff_booking_handoff_panel.helpers.ts";
import {
  assertReadonlyMutationLock,
  assertWritableMutationControl,
} from "./276_workspace_hardening.helpers.ts";

export const staffBookingHandoffPanelMultiuserCoverage = [
  "writer can still mutate slot selection",
  "reader receives frozen booking controls",
  "stale recovery remains visible in read-only posture",
  "trace capture for writer and reader contexts",
];

export async function run(): Promise<void> {
  const playwright = await importPlaywright();
  if (!playwright) {
    return;
  }

  const { child, baseUrl } = await startClinicalWorkspace();
  const browser = await playwright.chromium.launch({ headless: true });

  try {
    const writerContext = await startTracedContext(browser);
    const readerContext = await startTracedContext(browser);
    const writerPage = await writerContext.newPage();
    const readerPage = await readerContext.newPage();

    await openStaffBookingRoute(writerPage, baseUrl, "/workspace/bookings/booking_case_299_compare_live?state=live");
    await openStaffBookingRoute(readerPage, baseUrl, "/workspace/bookings/booking_case_299_compare_live?state=read_only");

    await assertWritableMutationControl(
      writerPage,
      "[data-testid='StaffAssistableSlotList'] [data-testid='booking-select-slot-slot_299_compare_1040']",
    );
    await assertReadonlyMutationLock(
      readerPage,
      "[data-testid='StaffAssistableSlotList'] [data-testid='booking-select-slot-slot_299_compare_1040']",
      "[data-testid='AssistedBookingRecoveryPanel']",
    );

    const readerRecoveryMutationState = await readerPage
      .locator("[data-testid='AssistedBookingRecoveryPanel']")
      .getAttribute("data-mutation-state");
    assertCondition(readerRecoveryMutationState === "frozen", "reader recovery panel should expose frozen mutation state");

    await openStaffBookingRoute(readerPage, baseUrl, "/workspace/bookings/booking_case_299_stale_recovery?state=read_only");
    const staleRoute = readerPage.locator(WORKSPACE_BOOKINGS_ROUTE_SELECTOR);
    assertCondition(
      (await staleRoute.getAttribute("data-exception-class")) === "stale_owner_or_publication_drift",
      "stale recovery route should preserve stale-owner exception markers",
    );
    await readerPage
      .locator("[data-testid='AssistedBookingRecoveryPanel']")
      .getByText("Stale-owner recovery", { exact: false })
      .waitFor();

    await stopTrace(writerContext, "299-staff-booking-handoff-writer.trace.zip");
    await stopTrace(readerContext, "299-staff-booking-handoff-reader.trace.zip");
    await writerContext.close();
    await readerContext.close();
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
