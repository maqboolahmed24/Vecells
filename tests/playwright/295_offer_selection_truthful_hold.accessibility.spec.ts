import fs from "node:fs";

import {
  assertCondition,
  importPlaywright,
  openBookingRoute,
  outputPath,
  startPatientWeb,
  stopPatientWeb,
  writeAccessibilitySnapshot,
} from "./293_patient_booking_workspace.helpers.ts";

export const patientBookingOfferSelectionAccessibilityCoverage = [
  "nonexclusive aria snapshot",
  "compare aria snapshot",
  "stale aria snapshot",
  "unavailable aria snapshot",
  "reduced motion parity and landmark coverage",
];

async function captureAria(locator: any, page: any): Promise<string | Record<string, unknown>> {
  if (typeof locator.ariaSnapshot === "function") {
    return await locator.ariaSnapshot();
  }
  const handle = await locator.elementHandle();
  assertCondition(handle, "accessible root missing");
  const snapshot = await page.accessibility?.snapshot({ root: handle, interestingOnly: false });
  assertCondition(snapshot, "accessibility snapshot missing");
  return snapshot;
}

function writeAriaFile(fileName: string, snapshot: string | Record<string, unknown>): void {
  const content = typeof snapshot === "string" ? snapshot : JSON.stringify(snapshot, null, 2);
  fs.writeFileSync(outputPath(fileName), content, "utf-8");
}

export async function run(): Promise<void> {
  const playwright = await importPlaywright();
  if (!playwright) {
    return;
  }

  const { child, baseUrl } = await startPatientWeb();
  const browser = await playwright.chromium.launch({ headless: true });

  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 960 } });
    const routeRoot = page.getByTestId("Patient_Booking_Workspace_Route");
    const stage = page.getByTestId("booking-slot-results-stage");

    await openBookingRoute(
      page,
      `${baseUrl}/bookings/booking_case_295_nonexclusive/select?origin=appointments&returnRoute=/appointments`,
    );
    await writeAccessibilitySnapshot(page, "295-offer-selection-nonexclusive-accessibility.json");
    writeAriaFile("295-offer-selection-nonexclusive-aria.yml", await captureAria(stage, page));
    assertCondition((await page.locator("header").count()) >= 1, "header landmark missing");
    assertCondition((await page.locator("nav").count()) >= 1, "nav landmark missing");
    assertCondition((await page.locator("main").count()) === 1, "expected one main landmark");

    await page.locator("[data-compare-trigger='open-compare']").click();
    await page.getByTestId("slot-compare-drawer").waitFor();
    writeAriaFile(
      "295-offer-selection-compare-aria.yml",
      await captureAria(page.getByTestId("slot-compare-drawer"), page),
    );

    await page.emulateMedia({ reducedMotion: "reduce" });
    await openBookingRoute(
      page,
      `${baseUrl}/bookings/booking_case_295_stale/select?origin=appointments&returnRoute=/appointments`,
    );
    await writeAccessibilitySnapshot(page, "295-offer-selection-stale-accessibility.json");
    writeAriaFile("295-offer-selection-stale-aria.yml", await captureAria(stage, page));
    assertCondition(
      (await routeRoot.getAttribute("data-motion-profile")) === "reduced",
      "reduced motion marker drifted",
    );

    await openBookingRoute(
      page,
      `${baseUrl}/bookings/booking_case_295_unavailable/select?origin=appointments&returnRoute=/appointments`,
    );
    await writeAccessibilitySnapshot(page, "295-offer-selection-unavailable-accessibility.json");
    writeAriaFile("295-offer-selection-unavailable-aria.yml", await captureAria(stage, page));
    assertCondition(
      await page.getByTestId("selection-recovery-panel").isVisible(),
      "unavailable route should expose recovery help",
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
