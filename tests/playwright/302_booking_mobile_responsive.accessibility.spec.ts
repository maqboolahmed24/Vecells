import fs from "node:fs";
import { createRequire } from "node:module";

import {
  assertCondition,
  bookingResponsiveUrl,
  importPlaywright,
  openBookingRoute,
  outputPath,
  readRootResponsiveMarkers,
  startPatientWeb,
  stopPatientWeb,
  writeAccessibilitySnapshot,
} from "./302_booking_mobile_responsive.helpers.ts";

const require = createRequire(import.meta.url);
const AXE_SOURCE = fs.readFileSync(require.resolve("axe-core/axe.min.js"), "utf8");

export const bookingMobileResponsiveAccessibilityCoverage = [
  "workspace compact route aria snapshot and focus-safe sticky tray reserve",
  "selection compact route axe scan and pinned-slot accessibility snapshot",
  "embedded waitlist reduced-motion aria snapshot and axe scan",
];

async function captureAria(locator: any, page: any): Promise<string | Record<string, unknown>> {
  if (typeof locator.ariaSnapshot === "function") {
    return await locator.ariaSnapshot();
  }
  const handle = await locator.elementHandle();
  assertCondition(handle, "responsive route root missing");
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

async function readScrollMarginBottom(locator: any): Promise<number> {
  return await locator.evaluate((node: HTMLElement) => {
    return Number.parseFloat(window.getComputedStyle(node).scrollMarginBottom || "0");
  });
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
    const compactContext = await browser.newContext({
      ...playwright.devices["iPhone 13"],
      locale: "en-GB",
      timezoneId: "Europe/London",
    });
    const compactPage = await compactContext.newPage();
    const routeRoot = compactPage.getByTestId("Patient_Booking_Workspace_Route");

    await openBookingRoute(compactPage, bookingResponsiveUrl(baseUrl, "workspace"));
    const workspaceMarkers = await readRootResponsiveMarkers(compactPage);
    assertCondition(
      workspaceMarkers.missionStackState === "folded",
      "workspace accessibility run should stay in the folded mission stack",
    );
    assertCondition(
      (await compactPage.locator("main").count()) === 1,
      "workspace compact route should expose one main landmark",
    );
    const workspacePrimaryControl = compactPage.getByTestId("booking-primary-action");
    await workspacePrimaryControl.waitFor();
    assertCondition(
      (await readScrollMarginBottom(workspacePrimaryControl)) >= 100,
      "workspace compact route should reserve sticky-tray-safe scroll margin for primary controls",
    );
    await writeAccessibilitySnapshot(compactPage, "302-booking-mobile-workspace-accessibility.json");
    writeAriaFile("302-booking-mobile-workspace-aria.yml", await captureAria(routeRoot, compactPage));
    await runAxe(compactPage, "302 workspace compact");

    await openBookingRoute(compactPage, bookingResponsiveUrl(baseUrl, "selection"));
    const selectionStage = compactPage.getByTestId("offer-selection-responsive-stage");
    await selectionStage.waitFor();
    await selectionStage.locator("[data-testid='selected-slot-pin']").first().waitFor();
    const selectionPrimaryControl = selectionStage.locator(
      "[data-testid='booking-mission-stack-rail-toggle']",
    );
    await selectionPrimaryControl.waitFor();
    assertCondition(
      (await readScrollMarginBottom(selectionPrimaryControl)) >= 100,
      "selection compact route should reserve sticky-tray-safe scroll margin for mission-stack controls",
    );
    await writeAccessibilitySnapshot(compactPage, "302-booking-mobile-selection-accessibility.json");
    writeAriaFile(
      "302-booking-mobile-selection-aria.yml",
      await captureAria(compactPage.getByTestId("offer-selection-responsive-stage"), compactPage),
    );
    assertCondition(
      (await compactPage.locator("[role='status']").count()) >= 2,
      "selection compact route should expose live status regions",
    );
    await runAxe(compactPage, "302 selection compact");

    const reducedMotionContext = await browser.newContext({
      viewport: { width: 430, height: 932 },
      reducedMotion: "reduce",
    });
    const reducedMotionPage = await reducedMotionContext.newPage();
    await openBookingRoute(reducedMotionPage, bookingResponsiveUrl(baseUrl, "embeddedWaitlist"));
    await reducedMotionPage.getByTestId("embedded-booking-host-ribbon").waitFor();
    const embeddedMarkers = await readRootResponsiveMarkers(reducedMotionPage);
    assertCondition(
      embeddedMarkers.embeddedMode === "nhs_app",
      "embedded accessibility run should preserve nhs_app mode",
    );
    assertCondition(
      (await reducedMotionPage.getByTestId("waitlist-live-region").count()) === 1,
      "embedded waitlist route should expose a waitlist live region",
    );
    await writeAccessibilitySnapshot(
      reducedMotionPage,
      "302-booking-mobile-embedded-waitlist-accessibility.json",
    );
    writeAriaFile(
      "302-booking-mobile-embedded-waitlist-aria.yml",
      await captureAria(reducedMotionPage.getByTestId("patient-waitlist-responsive-stage"), reducedMotionPage),
    );
    await runAxe(reducedMotionPage, "302 embedded waitlist reducedMotion");

    await reducedMotionContext.close();
    await compactContext.close();
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
