import fs from "node:fs";
import { createRequire } from "node:module";

import {
  assertCondition,
  importPlaywright,
  openBookingRoute,
  outputPath,
  startPatientWeb,
  stopPatientWeb,
  writeAccessibilitySnapshot,
} from "./293_patient_booking_workspace.helpers.ts";

const require = createRequire(import.meta.url);
const AXE_SOURCE = fs.readFileSync(require.resolve("axe-core/axe.min.js"), "utf8");

export const patientAppointmentManageAccessibilityCoverage = [
  "ready manage aria snapshot",
  "cancel dialog focus and axe scan",
  "reminder repair accessibility snapshot",
  "stale route accessibility snapshot",
  "reduced motion reschedule accessibility snapshot",
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

async function injectAxe(page: any): Promise<void> {
  if ((await page.evaluate(() => typeof window.axe === "object").catch(() => false)) === false) {
    await page.addScriptTag({ content: AXE_SOURCE });
  }
}

async function runAxe(page: any, label: string): Promise<void> {
  await injectAxe(page);
  const result = await page.evaluate(async () => {
    return await window.axe.run(document, {
      runOnly: {
        type: "tag",
        values: ["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"],
      },
    });
  });
  assertCondition(
    result.violations.length === 0,
    `${label} axe.run violations: ${result.violations
      .map((violation: any) => `${violation.id}:${violation.nodes.length}`)
      .join(", ")}`,
  );
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
    const manageRoot = page.getByTestId("patient-appointment-manage-view");

    await openBookingRoute(
      page,
      `${baseUrl}/bookings/booking_case_297_ready/manage?origin=appointments&returnRoute=/appointments`,
    );
    await writeAccessibilitySnapshot(page, "297-manage-ready-accessibility.json");
    writeAriaFile("297-manage-ready-aria.yml", await captureAria(manageRoot, page));
    await runAxe(page, "297 manage ready");
    assertCondition((await page.locator("main").count()) == 1, "expected one main landmark");

    await page.getByTestId("manage-open-cancel").click();
    const dialog = page.getByTestId("cancel-appointment-flow");
    await dialog.waitFor();
    writeAriaFile("297-manage-cancel-dialog-aria.yml", await captureAria(dialog, page));
    assertCondition(
      (await page.locator("#cancel-reason").evaluate((node) => node === document.activeElement)) === true,
      "cancel dialog should move focus inside the dialog",
    );
    await page.getByTestId("cancel-appointment-close").click();
    assertCondition(
      (await manageRoot.getAttribute("data-manage-pending-state")) === "idle",
      "closing the cancel dialog should return to idle manage state",
    );

    await openBookingRoute(
      page,
      `${baseUrl}/bookings/booking_case_297_reminder_blocked/manage?origin=appointments&returnRoute=/appointments`,
    );
    await writeAccessibilitySnapshot(page, "297-manage-reminder-blocked-accessibility.json");
    writeAriaFile("297-manage-reminder-blocked-aria.yml", await captureAria(manageRoot, page));
    await runAxe(page, "297 manage reminder blocked");

    await openBookingRoute(
      page,
      `${baseUrl}/bookings/booking_case_297_stale/manage?origin=appointments&returnRoute=/appointments`,
    );
    await writeAccessibilitySnapshot(page, "297-manage-stale-accessibility.json");
    writeAriaFile("297-manage-stale-aria.yml", await captureAria(manageRoot, page));
    assertCondition(
      (await manageRoot.getAttribute("data-continuity-state")) === "stale",
      "stale route should expose stale continuity marker",
    );

    await page.emulateMedia({ reducedMotion: "reduce" });
    await openBookingRoute(
      page,
      `${baseUrl}/bookings/booking_case_297_ready/manage?origin=appointments&returnRoute=/appointments`,
    );
    await page.getByTestId("manage-action-open_reschedule").click();
    await writeAccessibilitySnapshot(page, "297-manage-reschedule-reduced-accessibility.json");
    writeAriaFile("297-manage-reschedule-reduced-aria.yml", await captureAria(manageRoot, page));
    assertCondition(
      (await routeRoot.getAttribute("data-motion-profile")) === "reduced",
      "reduced motion marker drifted on the manage route",
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
