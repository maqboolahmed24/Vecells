import fs from "node:fs";
import { createRequire } from "node:module";

import {
  assertCondition,
  bookingArtifactUrl,
  importPlaywright,
  openBookingRoute,
  outputPath,
  startPatientWeb,
  stopPatientWeb,
  writeAccessibilitySnapshot,
} from "./303_booking_artifact_parity.helpers.ts";

const require = createRequire(import.meta.url);
const AXE_SOURCE = fs.readFileSync(require.resolve("axe-core/axe.min.js"), "utf8");

export const bookingArtifactParityAccessibilityCoverage = [
  "confirmed receipt route keeps one main landmark and an aria snapshot for the artifact frame",
  "summary-only print route remains readable and axe-clean",
  "embedded browser-handoff route keeps a summary-safe accessibility tree without hidden dead controls",
];

async function captureAria(locator: any, page: any): Promise<string | Record<string, unknown>> {
  if (typeof locator.ariaSnapshot === "function") {
    return await locator.ariaSnapshot();
  }
  const handle = await locator.elementHandle();
  assertCondition(handle, "artifact frame missing");
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
    const page = await browser.newPage({ viewport: { width: 1366, height: 1024 } });
    const artifactRoot = page.getByTestId("patient-booking-artifact-frame");

    await openBookingRoute(page, bookingArtifactUrl(baseUrl, "confirmedReceipt"));
    assertCondition((await page.locator("main").count()) === 1, "confirmed artifact route should expose one main landmark");
    await writeAccessibilitySnapshot(page, "303-booking-artifact-confirmed-accessibility.json");
    writeAriaFile(
      "303-booking-artifact-confirmed-aria.yml",
      await captureAria(artifactRoot, page),
    );
    await runAxe(page, "303 confirmed receipt");

    await openBookingRoute(page, bookingArtifactUrl(baseUrl, "pendingPrint"));
    assertCondition(
      (await artifactRoot.getAttribute("data-grant-state")) === "summary_only",
      "pending artifact accessibility route should stay summary-only",
    );
    await writeAccessibilitySnapshot(page, "303-booking-artifact-pending-accessibility.json");
    writeAriaFile(
      "303-booking-artifact-pending-aria.yml",
      await captureAria(artifactRoot, page),
    );
    await runAxe(page, "303 pending print");

    const embeddedContext = await browser.newContext({
      viewport: { width: 430, height: 932 },
      reducedMotion: "reduce",
    });
    const embeddedPage = await embeddedContext.newPage();
    await openBookingRoute(embeddedPage, bookingArtifactUrl(baseUrl, "embeddedBrowserHandoff"));
    const embeddedRoot = embeddedPage.getByTestId("patient-booking-artifact-frame");
    assertCondition(
      (await embeddedRoot.getAttribute("data-handoff-readiness")) === "summary_only",
      "embedded browser handoff should degrade to summary-only readiness",
    );
    assertCondition(
      await embeddedPage.getByTestId("artifact-embedded-note").isVisible(),
      "embedded artifact note should remain visible",
    );
    await writeAccessibilitySnapshot(
      embeddedPage,
      "303-booking-artifact-embedded-accessibility.json",
    );
    writeAriaFile(
      "303-booking-artifact-embedded-aria.yml",
      await captureAria(embeddedRoot, embeddedPage),
    );
    await runAxe(embeddedPage, "303 embedded browser handoff");

    await embeddedContext.close();
    await page.close();
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
