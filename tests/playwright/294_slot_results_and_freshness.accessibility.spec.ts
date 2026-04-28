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

export const patientBookingSlotResultsAccessibilityCoverage = [
  "renderable aria snapshot",
  "stale aria snapshot",
  "no-supply aria snapshot",
  "landmark coverage for the shared booking shell",
  "reducedMotion accessibility parity",
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
      `${baseUrl}/bookings/booking_case_294_renderable/select?origin=appointments&returnRoute=/appointments`,
    );
    await writeAccessibilitySnapshot(page, "294-slot-results-renderable-accessibility.json");
    writeAriaFile("294-slot-results-renderable-aria.yml", await captureAria(stage, page));
    assertCondition((await page.locator("header").count()) >= 1, "header landmark missing");
    assertCondition((await page.locator("nav").count()) >= 1, "nav landmark missing");
    assertCondition((await page.locator("main").count()) === 1, "expected one main landmark");

    await page.emulateMedia({ reducedMotion: "reduce" });
    await openBookingRoute(
      page,
      `${baseUrl}/bookings/booking_case_294_stale/select?origin=appointments&returnRoute=/appointments`,
    );
    await writeAccessibilitySnapshot(page, "294-slot-results-stale-accessibility.json");
    writeAriaFile("294-slot-results-stale-aria.yml", await captureAria(stage, page));
    assertCondition(
      (await routeRoot.getAttribute("data-motion-profile")) === "reduced",
      "reducedMotion marker drifted",
    );
    assertCondition(
      (await stage.getAttribute("data-view-state")) === "stale_refresh_required",
      "stale aria capture drifted",
    );

    await openBookingRoute(
      page,
      `${baseUrl}/bookings/booking_case_294_no_supply/select?origin=appointments&returnRoute=/appointments`,
    );
    await writeAccessibilitySnapshot(page, "294-slot-results-no-supply-accessibility.json");
    writeAriaFile("294-slot-results-no-supply-aria.yml", await captureAria(stage, page));
    assertCondition(
      (await stage.getAttribute("data-view-state")) === "no_supply_confirmed",
      "no-supply aria capture drifted",
    );
    assertCondition(
      await page.getByTestId("booking-support-fallback-stub").isVisible(),
      "no-supply posture should keep support visible",
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
