import {
  assertCondition,
  importPlaywright,
  openBookingRoute,
  outputPath,
  startPatientWeb,
  stopPatientWeb,
  trackExternalRequests,
} from "./293_patient_booking_workspace.helpers.ts";

export const patientBookingSlotResultsCoverage = [
  "renderable frozen snapshot browsing",
  "partial-coverage posture keeps support visible",
  "stale-refresh freezes selection then refreshes in place",
  "true no-supply posture is distinct from fallback",
  "supported fallback posture stays in the booking shell",
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
      `${baseUrl}/bookings/booking_case_294_renderable/select?origin=appointments&returnRoute=/appointments`,
    );
    const stage = page.getByTestId("booking-slot-results-stage");
    assertCondition((await stage.getAttribute("data-view-state")) === "renderable", "renderable state drifted");
    assertCondition((await stage.getAttribute("data-snapshot-result-count")) === "8", "renderable snapshot count drifted");

    await page.locator("[data-testid='booking-slot-day-jump'] [data-day-key='2026-04-22']").click();
    await page.waitForFunction(() => {
      const stage = document.querySelector("[data-testid='booking-slot-results-stage']");
      return stage?.getAttribute("data-day-anchor") === "2026-04-22";
    });
    assertCondition((await stage.getAttribute("data-day-anchor")) === "2026-04-22", "day anchor drifted after jump");

    await page.locator("[data-slot-id='slot_summary_294_222_1120'] .patient-booking__slot-summary").click();
    const expandedRow = page.locator("[data-slot-id='slot_summary_294_222_1120']");
    await page.waitForFunction(() => {
      const row = document.querySelector("[data-slot-id='slot_summary_294_222_1120']");
      return row?.getAttribute("data-expanded") === "true";
    });
    assertCondition((await expandedRow.getAttribute("data-expanded")) === "true", "row disclosure did not expand");
    await expandedRow.getByTestId("booking-slot-continue").click();
    await page.waitForURL(/\/bookings\/booking_case_294_renderable\/confirm\?/);

    await openBookingRoute(
      page,
      `${baseUrl}/bookings/booking_case_294_partial/select?origin=appointments&returnRoute=/appointments`,
    );
    assertCondition((await stage.getAttribute("data-view-state")) === "partial_coverage", "partial state drifted");
    assertCondition((await stage.getAttribute("data-snapshot-result-count")) === "4", "partial snapshot count drifted");
    assertCondition(
      await page.getByTestId("booking-support-fallback-stub").isVisible(),
      "partial coverage should keep support visible",
    );

    await openBookingRoute(
      page,
      `${baseUrl}/bookings/booking_case_294_stale/select?origin=appointments&returnRoute=/appointments`,
    );
    assertCondition(
      (await stage.getAttribute("data-view-state")) === "stale_refresh_required",
      "stale state drifted",
    );
    const staleContinue = page.locator("[data-slot-id='slot_summary_294_222_1120']").getByTestId("booking-slot-continue");
    await page.locator("[data-slot-id='slot_summary_294_222_1120'] .patient-booking__slot-summary").click();
    await page.waitForFunction(() => {
      const row = document.querySelector("[data-slot-id='slot_summary_294_222_1120']");
      return row?.getAttribute("data-expanded") === "true";
    });
    assertCondition(await staleContinue.isDisabled(), "stale snapshot must freeze selection affordances");
    await page.getByTestId("booking-refresh-snapshot").click();
    await page.waitForFunction(() => {
      const stage = document.querySelector("[data-testid='booking-slot-results-stage']");
      return stage?.getAttribute("data-view-state") === "renderable";
    });
    assertCondition(
      (await stage.getAttribute("data-day-anchor")) === "2026-04-22",
      "refresh should preserve the active day anchor",
    );

    await openBookingRoute(
      page,
      `${baseUrl}/bookings/booking_case_294_no_supply/select?origin=appointments&returnRoute=/appointments`,
    );
    assertCondition((await stage.getAttribute("data-view-state")) === "no_supply_confirmed", "no-supply state drifted");
    assertCondition((await stage.getAttribute("data-snapshot-result-count")) === "0", "no-supply snapshot count drifted");
    assertCondition(await page.getByTestId("booking-slot-empty-state").isVisible(), "no-supply empty state missing");

    await openBookingRoute(
      page,
      `${baseUrl}/bookings/booking_case_294_fallback/select?origin=appointments&returnRoute=/appointments`,
    );
    const root = page.getByTestId("Patient_Booking_Workspace_Route");
    assertCondition((await stage.getAttribute("data-view-state")) === "support_fallback", "fallback state drifted");
    assertCondition(
      (await root.getAttribute("data-capability-posture")) === "degraded_manual",
      "fallback should degrade the shared shell posture",
    );
    assertCondition(
      ((await page.getByTestId("booking-slot-support-action").textContent()) || "").includes("supported fallback"),
      "fallback support action drifted",
    );

    assertCondition(
      externalRequests.size == 0,
      `slot results should not fetch external resources: ${Array.from(externalRequests).join(", ")}`,
    );

    await context.tracing.stop({ path: outputPath("294-slot-results-and-freshness-trace.zip") });
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
