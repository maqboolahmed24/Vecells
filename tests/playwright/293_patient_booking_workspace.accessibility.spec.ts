import fs from "node:fs";

import {
  ROOT,
  assertCondition,
  importPlaywright,
  openBookingRoute,
  outputPath,
  startPatientWeb,
  stopPatientWeb,
  writeAccessibilitySnapshot,
} from "./293_patient_booking_workspace.helpers.ts";

export const patientBookingWorkspaceAccessibilityCoverage = [
  "landmark coverage for the booking shell",
  "aria snapshot for normal state",
  "aria snapshot for blocked state",
  "aria snapshot for recovery-required state",
  "reduced-motion parity markers",
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
  const content =
    typeof snapshot === "string" ? snapshot : JSON.stringify(snapshot, null, 2);
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

    await openBookingRoute(
      page,
      `${baseUrl}/bookings/booking_case_293_live?origin=appointments&returnRoute=/appointments`,
    );
    await writeAccessibilitySnapshot(page, "293-booking-workspace-live-accessibility.json");
    const root = page.locator("[data-testid='Patient_Booking_Workspace_Route']");
    writeAriaFile("293-booking-workspace-live-aria.yml", await captureAria(root, page));
    assertCondition((await page.locator("header").count()) >= 1, "header landmark missing");
    assertCondition((await page.locator("nav").count()) >= 1, "nav landmark missing");
    assertCondition((await page.locator("main").count()) === 1, "expected one main landmark");
    assertCondition((await page.locator("aside").count()) >= 1, "expected complementary rail");

    await openBookingRoute(
      page,
      `${baseUrl}/bookings/booking_case_293_blocked?origin=appointments&returnRoute=/appointments`,
    );
    await writeAccessibilitySnapshot(page, "293-booking-workspace-blocked-accessibility.json");
    writeAriaFile("293-booking-workspace-blocked-aria.yml", await captureAria(root, page));
    assertCondition(
      (await root.getAttribute("data-capability-posture")) === "blocked",
      "blocked posture marker drifted under accessibility pass",
    );

    await page.emulateMedia({ reducedMotion: "reduce" });
    await openBookingRoute(
      page,
      `${baseUrl}/bookings/booking_case_293_recovery?origin=recovery&returnRoute=/home`,
    );
    await writeAccessibilitySnapshot(page, "293-booking-workspace-recovery-accessibility.json");
    writeAriaFile("293-booking-workspace-recovery-aria.yml", await captureAria(root, page));
    assertCondition(
      (await root.getAttribute("data-motion-profile")) === "reduced",
      "reduced-motion marker drifted",
    );
    assertCondition(
      (await root.getAttribute("data-continuity-state")) === "recovery_required",
      "recovery continuity marker drifted",
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
