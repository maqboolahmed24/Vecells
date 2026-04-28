import {
  assertCondition,
  importPlaywright,
  openBookingRoute,
  startPatientWeb,
  stopPatientWeb,
} from "./293_patient_booking_workspace.helpers.ts";

export const patientBookingOfferSelectionCompareCoverage = [
  "compare open and close keeps selected anchor stable",
  "compare close returns focus to the trigger",
  "compare cards preserve ranked order",
  "selecting from compare updates the selected slot after close",
];

export async function run(): Promise<void> {
  const playwright = await importPlaywright();
  if (!playwright) {
    return;
  }

  const { child, baseUrl } = await startPatientWeb();
  const browser = await playwright.chromium.launch({ headless: true });

  try {
    const page = await browser.newPage({ viewport: { width: 1400, height: 980 } });
    const stage = page.getByTestId("booking-slot-results-stage");

    await openBookingRoute(
      page,
      `${baseUrl}/bookings/booking_case_295_nonexclusive/select?origin=appointments&returnRoute=/appointments`,
    );

    const compareTrigger = page.locator("[data-compare-trigger='open-compare']");
    await compareTrigger.click();
    const drawer = page.getByTestId("slot-compare-drawer");
    await drawer.waitFor();
    assertCondition(
      (await stage.getAttribute("data-selected-slot")) === "slot_summary_294_222_1120",
      "compare should not overwrite the selected-slot anchor",
    );

    const compareCards = await drawer
      .locator(".patient-booking__compare-card-head strong")
      .allTextContents();
    assertCondition(
      compareCards[0]?.includes("09:10") &&
        compareCards[1]?.includes("11:20") &&
        compareCards[2]?.includes("14:10"),
      `compare order drifted: ${compareCards.join(" | ")}`,
    );

    await drawer.getByRole("button", { name: "Close compare" }).click();
    await page.waitForFunction(() => {
      const stage = document.querySelector("[data-testid='booking-slot-results-stage']");
      return stage?.getAttribute("data-compare-open") === "false";
    });
    const activeElementInfo = await page.evaluate(() => {
      const active = document.activeElement as HTMLElement | null;
      return {
        tag: active?.tagName ?? null,
        trigger: active?.getAttribute("data-compare-trigger") ?? null,
      };
    });
    assertCondition(
      activeElementInfo.trigger === "open-compare",
      `compare close should return focus to the compare trigger: ${JSON.stringify(activeElementInfo)}`,
    );

    await compareTrigger.click();
    await drawer.waitFor();
    await drawer.getByRole("button", { name: "Make this the selected slot" }).first().click();
    await page.waitForFunction(() => {
      const stage = document.querySelector("[data-testid='booking-slot-results-stage']");
      return (
        stage?.getAttribute("data-compare-open") === "false" &&
        stage?.getAttribute("data-selected-slot") === "slot_summary_294_211_0910"
      );
    });
    assertCondition(
      (await stage.getAttribute("data-selected-slot")) === "slot_summary_294_211_0910",
      "selecting from compare should update the selected slot",
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
