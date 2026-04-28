import fs from "node:fs";

import {
  assertCondition,
  assertNoHorizontalOverflow,
  importPlaywright,
  openPatientPharmacyRoute,
  openWorkspacePharmacyRoute,
  outputPath,
  patientPharmacyUrl,
  startPatientWeb,
  startPharmacyConsole,
  stopPatientWeb,
  stopPharmacyConsole,
  waitForPatientPharmacyState,
  waitForWorkspacePharmacyState,
  workspacePharmacyUrl,
} from "./356_pharmacy_shell.helpers.ts";

export {
  assertCondition,
  assertNoHorizontalOverflow,
  importPlaywright,
  openPatientPharmacyRoute,
  openWorkspacePharmacyRoute,
  outputPath,
  patientPharmacyUrl,
  startPatientWeb,
  startPharmacyConsole,
  stopPatientWeb,
  stopPharmacyConsole,
  waitForPatientPharmacyState,
  waitForWorkspacePharmacyState,
  workspacePharmacyUrl,
};

export async function tabUntil(
  page: any,
  matcher: (activeTestId: string | null) => boolean,
  maxTabs = 28,
): Promise<string | null> {
  for (let index = 0; index < maxTabs; index += 1) {
    await page.keyboard.press("Tab");
    const activeTestId = await page.evaluate(
      () => document.activeElement?.getAttribute("data-testid") ?? null,
    );
    if (matcher(activeTestId)) {
      return activeTestId;
    }
  }
  throw new Error("Failed to reach the expected focus target by keyboard tabbing.");
}

export async function activeElementSummary(page: any) {
  return await page.evaluate(() => {
    const active = document.activeElement as HTMLElement | null;
    return {
      tagName: active?.tagName.toLowerCase() ?? null,
      testId: active?.getAttribute("data-testid") ?? null,
      text: active?.textContent?.trim() ?? null,
      ariaLabel: active?.getAttribute("aria-label") ?? null,
    };
  });
}

export async function writeAriaSnapshot(page: any, locator: any, fileName: string): Promise<void> {
  const maybeAriaSnapshot = (locator as { ariaSnapshot?: () => Promise<unknown> }).ariaSnapshot;
  if (typeof maybeAriaSnapshot === "function") {
    const snapshot = await maybeAriaSnapshot.call(locator);
    fs.writeFileSync(outputPath(fileName), String(snapshot), "utf8");
    return;
  }

  const handle = await locator.elementHandle();
  assertCondition(handle, "aria snapshot root missing");
  const snapshot = await page.accessibility.snapshot({ root: handle });
  fs.writeFileSync(outputPath(fileName), JSON.stringify(snapshot, null, 2), "utf8");
}
