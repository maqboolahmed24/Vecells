import fs from "node:fs";
import { createRequire } from "node:module";

import {
  assertCondition,
  bookingRecoveryUrl,
  importPlaywright,
  openBookingRoute,
  outputPath,
  startPatientWeb,
  stopPatientWeb,
  writeAccessibilitySnapshot,
} from "./301_booking_recovery_envelopes.helpers.ts";

const require = createRequire(import.meta.url);
const AXE_SOURCE = fs.readFileSync(require.resolve("axe-core/axe.min.js"), "utf8");

export const bookingRecoveryEnvelopeAccessibilityCoverage = [
  "workspace recovery aria snapshot and axe scan",
  "confirmation identity-hold aria snapshot and axe scan",
  "secure-link waitlist contact-repair aria snapshot and reduced-motion axe scan",
];

async function captureAria(locator: any, page: any): Promise<string | Record<string, unknown>> {
  if (typeof locator.ariaSnapshot === "function") {
    return await locator.ariaSnapshot();
  }
  const handle = await locator.elementHandle();
  assertCondition(handle, "booking recovery shell missing");
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
    const recoveryShell = page.getByTestId("BookingRecoveryShell");

    await openBookingRoute(page, bookingRecoveryUrl(baseUrl, "workspaceRecovery"));
    await writeAccessibilitySnapshot(page, "301-booking-recovery-workspace-accessibility.json");
    writeAriaFile("301-booking-recovery-workspace-aria.yml", await captureAria(recoveryShell, page));
    await runAxe(page, "301 workspace recovery");
    assertCondition((await page.locator("main").count()) === 1, "expected one main landmark on workspace recovery");
    assertCondition(
      (await recoveryShell.getAttribute("data-recovery-reason")) === "stale_session",
      "workspace accessibility recovery reason drifted",
    );

    await openBookingRoute(page, bookingRecoveryUrl(baseUrl, "confirmationIdentityHold"));
    await writeAccessibilitySnapshot(page, "301-booking-recovery-identity-hold-accessibility.json");
    writeAriaFile("301-booking-recovery-identity-hold-aria.yml", await captureAria(recoveryShell, page));
    await runAxe(page, "301 confirmation identity hold");
    assertCondition(
      (await recoveryShell.getAttribute("data-summary-tier")) === "identity_hold_summary",
      "identity-hold summary tier drifted",
    );
    assertCondition(
      await page.getByTestId("BookingIdentityHoldPanel").isVisible(),
      "identity-hold route should expose the hold panel",
    );

    await page.emulateMedia({ reducedMotion: "reduce" });
    await openBookingRoute(page, bookingRecoveryUrl(baseUrl, "waitlistContactRepairSecure"));
    await writeAccessibilitySnapshot(page, "301-booking-recovery-secure-contact-repair-accessibility.json");
    writeAriaFile(
      "301-booking-recovery-secure-contact-repair-aria.yml",
      await captureAria(recoveryShell, page),
    );
    await runAxe(page, "301 secure-link contact repair");
    assertCondition(
      (await routeRoot.getAttribute("data-motion-profile")) === "reduced",
      "reduced motion marker drifted on secure-link booking recovery",
    );
    assertCondition(
      (await recoveryShell.getAttribute("data-channel-mode")) === "secure_link",
      "secure-link recovery should preserve secure-link channel mode",
    );
    assertCondition(
      await page.getByTestId("BookingSecureLinkRecoveryFrame").isVisible(),
      "secure-link recovery frame should remain visible",
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
