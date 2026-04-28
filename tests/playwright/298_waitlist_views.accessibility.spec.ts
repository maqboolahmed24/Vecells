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

export const patientWaitlistViewsAccessibilityCoverage = [
  "actionable offer aria snapshot and axe scan",
  "expired provenance aria snapshot",
  "fallback due aria snapshot",
  "contact repair aria snapshot",
  "secure-link reduced-motion accessibility coverage",
];

async function captureAria(locator: any, page: any): Promise<string | Record<string, unknown>> {
  if (typeof locator.ariaSnapshot === "function") {
    return await locator.ariaSnapshot();
  }
  const handle = await locator.elementHandle();
  assertCondition(handle, "accessible waitlist root missing");
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
    const waitlistStage = page.getByTestId("patient-waitlist-stage");

    await openBookingRoute(
      page,
      `${baseUrl}/bookings/booking_case_298_offer_nonexclusive/waitlist?origin=appointments&returnRoute=/appointments`,
    );
    await writeAccessibilitySnapshot(page, "298-waitlist-offer-accessibility.json");
    writeAriaFile("298-waitlist-offer-aria.yml", await captureAria(waitlistStage, page));
    await runAxe(page, "298 waitlist offer");
    assertCondition((await page.locator("main").count()) === 1, "expected one main landmark");
    assertCondition(
      (await waitlistStage.getAttribute("data-reservation-truth")) === "truthful_nonexclusive",
      "offer accessibility route should expose truthful nonexclusive posture",
    );
    assertCondition(
      (await page.locator("[data-testid='waitlist-live-region']").count()) === 1,
      "waitlist live region should stay mounted",
    );

    await openBookingRoute(
      page,
      `${baseUrl}/bookings/booking_case_298_offer_expired/waitlist?origin=appointments&returnRoute=/appointments`,
    );
    await writeAccessibilitySnapshot(page, "298-waitlist-expired-accessibility.json");
    writeAriaFile("298-waitlist-expired-aria.yml", await captureAria(waitlistStage, page));
    await runAxe(page, "298 waitlist expired");
    assertCondition(
      await page.getByTestId("expiry-or-supersession-provenance-card").isVisible(),
      "expired waitlist route should keep provenance visible for accessibility",
    );

    await openBookingRoute(
      page,
      `${baseUrl}/bookings/booking_case_298_fallback_due/waitlist?origin=appointments&returnRoute=/appointments`,
    );
    await writeAccessibilitySnapshot(page, "298-waitlist-fallback-accessibility.json");
    writeAriaFile("298-waitlist-fallback-aria.yml", await captureAria(waitlistStage, page));
    await runAxe(page, "298 waitlist fallback");
    assertCondition(
      (await waitlistStage.getAttribute("data-window-risk-state")) === "fallback_due",
      "fallback accessibility route marker drifted",
    );

    await openBookingRoute(
      page,
      `${baseUrl}/bookings/booking_case_298_contact_repair/waitlist?origin=appointments&returnRoute=/appointments`,
    );
    await writeAccessibilitySnapshot(page, "298-waitlist-contact-repair-accessibility.json");
    writeAriaFile("298-waitlist-contact-repair-aria.yml", await captureAria(waitlistStage, page));
    await runAxe(page, "298 waitlist contact repair");
    assertCondition(
      await page.getByTestId("waitlist-contact-repair-morph").isVisible(),
      "contact repair accessibility route should expose the repair morph",
    );

    await page.emulateMedia({ reducedMotion: "reduce" });
    await openBookingRoute(
      page,
      `${baseUrl}/bookings/booking_case_298_secure_link_offer/waitlist?origin=secure_link&returnRoute=/recovery/secure-link`,
    );
    await writeAccessibilitySnapshot(page, "298-waitlist-secure-link-reduced-accessibility.json");
    writeAriaFile("298-waitlist-secure-link-reduced-aria.yml", await captureAria(waitlistStage, page));
    await runAxe(page, "298 waitlist secure link reduced");
    assertCondition(
      (await routeRoot.getAttribute("data-motion-profile")) === "reduced",
      "reduced motion marker drifted on the secure-link waitlist route",
    );
    assertCondition(
      (await waitlistStage.getAttribute("data-entry-mode")) === "secure_link",
      "secure-link accessibility route should preserve secure-link entry markers",
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
