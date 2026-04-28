import {
  assertCondition,
  importPlaywright,
  openBookingRoute,
  startPatientWeb,
  stopPatientWeb,
} from "./293_patient_booking_workspace.helpers.ts";

export const patientBookingSlotResultsNavigationCoverage = [
  "active day anchor persists across reload",
  "expanded row persists across reload",
  "stale refresh keeps the preserved day anchor",
  "browser back restores the select host and day anchor",
];

export async function run(): Promise<void> {
  const playwright = await importPlaywright();
  if (!playwright) {
    return;
  }

  const { child, baseUrl } = await startPatientWeb();
  const browser = await playwright.chromium.launch({ headless: true });

  try {
    const page = await browser.newPage({ viewport: { width: 1360, height: 960 } });
    const routeRoot = page.getByTestId("Patient_Booking_Workspace_Route");
    const stage = page.getByTestId("booking-slot-results-stage");

    await openBookingRoute(
      page,
      `${baseUrl}/bookings/booking_case_294_renderable/select?origin=appointments&returnRoute=/appointments`,
    );
    await page.locator("[data-testid='booking-slot-day-jump'] [data-day-key='2026-04-22']").click();
    await page.waitForFunction(() => {
      const stage = document.querySelector("[data-testid='booking-slot-results-stage']");
      return stage?.getAttribute("data-day-anchor") === "2026-04-22";
    });
    await page.locator("[data-slot-id='slot_summary_294_222_1120'] .patient-booking__slot-summary").click();
    await page.waitForFunction(() => {
      const row = document.querySelector("[data-slot-id='slot_summary_294_222_1120']");
      return row?.getAttribute("data-expanded") === "true";
    });

    await page.reload({ waitUntil: "load" });
    await stage.waitFor();
    assertCondition(
      (await stage.getAttribute("data-day-anchor")) === "2026-04-22",
      "reload should preserve the active day anchor",
    );
    assertCondition(
      (await page.locator("[data-slot-id='slot_summary_294_222_1120']").getAttribute("data-expanded")) === "true",
      "reload should preserve the expanded disclosure",
    );

    await page
      .locator("[data-slot-id='slot_summary_294_222_1120']")
      .getByTestId("booking-slot-continue")
      .click();
    await page.waitForURL(/\/bookings\/booking_case_294_renderable\/confirm\?/);
    await page.goBack({ waitUntil: "load" });
    await stage.waitFor();
    assertCondition((await routeRoot.getAttribute("data-route-key")) === "select", "browser back should restore select host");
    assertCondition(
      (await stage.getAttribute("data-day-anchor")) === "2026-04-22",
      "browser back should preserve the results day anchor",
    );

    await openBookingRoute(
      page,
      `${baseUrl}/bookings/booking_case_294_stale/select?origin=appointments&returnRoute=/appointments`,
    );
    assertCondition(
      (await stage.getAttribute("data-day-anchor")) === "2026-04-22",
      "stale route should begin on the preserved anchor day",
    );
    await page.getByTestId("booking-refresh-snapshot").click();
    await page.waitForFunction(() => {
      const stage = document.querySelector("[data-testid='booking-slot-results-stage']");
      return stage?.getAttribute("data-view-state") === "renderable";
    });
    assertCondition(
      (await stage.getAttribute("data-day-anchor")) === "2026-04-22",
      "refresh should preserve the active day anchor",
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
