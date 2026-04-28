import {
  assertCondition,
  importPlaywright,
  openBookingRoute,
  outputPath,
  startPatientWeb,
  stopPatientWeb,
  trackExternalRequests,
} from "./293_patient_booking_workspace.helpers.ts";

export const patientBookingOfferSelectionCoverage = [
  "truthful nonexclusive selection keeps selected pin stable",
  "exclusive hold exposes lawful countdown posture",
  "compare mode opens without destroying the selected-slot anchor",
  "stale refresh preserves the selected slot and day anchor",
  "unavailable selected slot preserves recovery context in place",
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
      `${baseUrl}/bookings/booking_case_295_nonexclusive/select?origin=appointments&returnRoute=/appointments`,
    );
    const stage = page.getByTestId("booking-slot-results-stage");
    assertCondition(
      (await stage.getAttribute("data-selected-slot")) === "slot_summary_294_222_1120",
      "nonexclusive route selected slot drifted",
    );
    assertCondition(
      (await stage.getAttribute("data-reservation-truth")) === "truthful_nonexclusive",
      "nonexclusive truth marker drifted",
    );

    await page.locator("[data-slot-id='slot_summary_294_211_0910'] .patient-booking__slot-summary").click();
    await page.locator("[data-slot-id='slot_summary_294_211_0910']").getByTestId("booking-slot-select").click();
    await page.waitForFunction(() => {
      const stage = document.querySelector("[data-testid='booking-slot-results-stage']");
      return stage?.getAttribute("data-selected-slot") === "slot_summary_294_211_0910";
    });
    assertCondition(
      (await stage.getAttribute("data-selected-slot")) === "slot_summary_294_211_0910",
      "slot selection did not update the selected anchor",
    );

    await page.locator("[data-compare-trigger='open-compare']").click();
    await page.getByTestId("slot-compare-drawer").waitFor();
    assertCondition(
      (await stage.getAttribute("data-compare-open")) === "true",
      "compare mode should open from the stage action bar",
    );
    await page.getByRole("button", { name: "Close compare" }).click();
    await page.waitForFunction(() => {
      const stage = document.querySelector("[data-testid='booking-slot-results-stage']");
      return stage?.getAttribute("data-compare-open") === "false";
    });

    await openBookingRoute(
      page,
      `${baseUrl}/bookings/booking_case_295_exclusive_hold/select?origin=appointments&returnRoute=/appointments`,
    );
    assertCondition(
      (await stage.getAttribute("data-reservation-truth")) === "exclusive_held",
      "exclusive hold truth marker drifted",
    );
    assertCondition(
      (await stage.getAttribute("data-countdown-mode")) === "hold_expiry",
      "exclusive hold should expose a lawful countdown marker",
    );

    await openBookingRoute(
      page,
      `${baseUrl}/bookings/booking_case_295_stale/select?origin=appointments&returnRoute=/appointments`,
    );
    const staleContinue = page
      .locator("[data-slot-id='slot_summary_294_222_1120']")
      .getByTestId("booking-slot-continue");
    await page.locator("[data-slot-id='slot_summary_294_222_1120'] .patient-booking__slot-summary").click();
    assertCondition(await staleContinue.isDisabled(), "stale selection should freeze the continue action");
    await page.getByTestId("booking-refresh-snapshot").click();
    await page.waitForFunction(() => {
      const stage = document.querySelector("[data-testid='booking-slot-results-stage']");
      return (
        stage?.getAttribute("data-view-state") === "renderable" &&
        stage?.getAttribute("data-selected-slot") === "slot_summary_294_222_1120"
      );
    });
    assertCondition(
      (await stage.getAttribute("data-day-anchor")) === "2026-04-22",
      "stale refresh should preserve the selected day anchor",
    );

    await openBookingRoute(
      page,
      `${baseUrl}/bookings/booking_case_295_unavailable/select?origin=appointments&returnRoute=/appointments`,
    );
    assertCondition(
      (await stage.getAttribute("data-reservation-truth")) === "expired",
      "unavailable route should expose expired reservation truth",
    );
    assertCondition(
      await page.getByTestId("selection-recovery-panel").isVisible(),
      "unavailable selection should keep the recovery panel visible",
    );

    assertCondition(
      externalRequests.size === 0,
      `offer selection should not fetch external resources: ${Array.from(externalRequests).join(", ")}`,
    );

    await context.tracing.stop({ path: outputPath("295-offer-selection-truthful-hold-trace.zip") });
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
