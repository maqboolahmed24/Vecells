import fs from "node:fs";
import { createRequire } from "node:module";

import {
  BOOKING_ENTRY_FIXTURE_IDS,
  activeElementSummary,
  assertCondition,
  assertNoHorizontalOverflow,
  bookingEntryUrl,
  importPlaywright,
  openBookingEntryRoute,
  outputPath,
  startPatientWeb,
  stopPatientWeb,
  writeAccessibilitySnapshot,
} from "./300_record_origin_booking_entry.helpers.ts";

const require = createRequire(import.meta.url);
const AXE_SOURCE = fs.readFileSync(require.resolve("axe-core/axe.min.js"), "utf8");

export const recordOriginBookingEntryAccessibilityCoverage = [
  "home-origin aria snapshot and landmark proof",
  "request-origin focus lands on the context ribbon after route change",
  "appointments read-only accessibility snapshot preserves calm posture markers",
  "record-origin recovery axe scan keeps blocked posture readable",
  "mobile reduced-motion route keeps sticky tray visible without overflow",
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
    const routeRoot = page.getByTestId("Patient_Record_Origin_Booking_Entry_Route");
    const ribbon = page.getByTestId("BookingEntryContextRibbon");

    await openBookingEntryRoute(
      page,
      bookingEntryUrl(baseUrl, BOOKING_ENTRY_FIXTURE_IDS.homeReady),
    );
    await writeAccessibilitySnapshot(page, "300-booking-entry-home-accessibility.json");
    writeAriaFile("300-booking-entry-home-aria.yml", await captureAria(routeRoot, page));
    await runAxe(page, "300 home booking entry");
    assertCondition((await page.locator("main").count()) === 1, "expected one main landmark on entry route");

    await openBookingEntryRoute(
      page,
      bookingEntryUrl(baseUrl, BOOKING_ENTRY_FIXTURE_IDS.requestsReady),
    );
    writeAriaFile("300-booking-entry-requests-aria.yml", await captureAria(routeRoot, page));
    const activeAfterRouteChange = await activeElementSummary(page);
    assertCondition(
      activeAfterRouteChange.testId === "BookingEntryContextRibbon",
      `entry route should focus the context ribbon after navigation: ${JSON.stringify(activeAfterRouteChange)}`,
    );

    await openBookingEntryRoute(
      page,
      bookingEntryUrl(baseUrl, BOOKING_ENTRY_FIXTURE_IDS.appointmentsReadOnly),
    );
    await writeAccessibilitySnapshot(page, "300-booking-entry-appointments-read-only-accessibility.json");
    writeAriaFile(
      "300-booking-entry-appointments-read-only-aria.yml",
      await captureAria(routeRoot, page),
    );
    assertCondition(
      (await routeRoot.getAttribute("data-entry-writable")) === "read_only",
      "read-only accessibility route should keep read-only marker",
    );

    await openBookingEntryRoute(
      page,
      bookingEntryUrl(baseUrl, BOOKING_ENTRY_FIXTURE_IDS.recordOriginRecovery),
    );
    await writeAccessibilitySnapshot(page, "300-booking-entry-record-recovery-accessibility.json");
    writeAriaFile("300-booking-entry-record-recovery-aria.yml", await captureAria(routeRoot, page));
    await runAxe(page, "300 record-origin recovery booking entry");
    assertCondition(
      (await routeRoot.getAttribute("data-record-continuation-state")) === "awaiting_step_up",
      "recovery accessibility route should keep blocked continuation marker",
    );

    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.setViewportSize({ width: 430, height: 980 });
    await openBookingEntryRoute(
      page,
      bookingEntryUrl(baseUrl, BOOKING_ENTRY_FIXTURE_IDS.recordOriginReady),
    );
    await assertNoHorizontalOverflow(page, "300 booking entry mobile reduced motion");
    assertCondition(
      await page.getByTestId("booking-entry-sticky-tray").isVisible(),
      "mobile booking entry should keep the sticky tray visible",
    );
    assertCondition(
      (await ribbon.getAttribute("tabindex")) === "-1",
      "context ribbon should remain programmatically focusable",
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
