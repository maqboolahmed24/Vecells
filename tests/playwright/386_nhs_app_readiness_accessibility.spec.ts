import fs from "node:fs";

import {
  assertCondition,
  assertNoHorizontalOverflow,
  importPlaywright,
  outputPath,
  startOpsConsole,
  stopOpsConsole,
} from "./386_nhs_app_readiness.helpers";

export async function run(): Promise<void> {
  const playwright = await importPlaywright();
  if (!playwright) {
    return;
  }

  const server = await startOpsConsole();
  const browser = await playwright.chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1040, height: 900 } });
  const page = await context.newPage();

  try {
    await page.goto(
      `${server.baseUrl}/ops/release/nhs-app/routes/jp_pharmacy_status?env=sandpit&preview=ios_safe_area`,
      { waitUntil: "networkidle" },
    );
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");
    const focusedText = await page.evaluate(() => document.activeElement?.textContent ?? "");
    assertCondition(focusedText.length > 0, "keyboard traversal did not reach an interactive element");

    await page.getByTestId("RouteRow-jp_pharmacy_status").focus();
    await page.keyboard.press("Enter");
    await page.getByTestId("InspectorTab-compatibility").click();
    assertCondition(
      await page.getByTestId("InspectorCompatibilityPanel").isVisible(),
      "compatibility tab panel not visible",
    );

    await page.getByTestId("OpenEvidenceDrawerButton").click();
    assertCondition(
      (await page.getByTestId("NHSAppEvidenceDrawer").getAttribute("data-current-evidence-drawer-state")) === "open",
      "evidence drawer state hook not open",
    );

    const rootLocator = page.getByTestId("NHSAppReadinessCockpit");
    const ariaSnapshot =
      typeof rootLocator.ariaSnapshot === "function"
        ? await rootLocator.ariaSnapshot()
        : await page.accessibility.snapshot({ root: await rootLocator.elementHandle() });
    fs.writeFileSync(
      outputPath("386-nhs-app-readiness-aria-snapshot.json"),
      JSON.stringify(ariaSnapshot, null, 2),
    );

    const landmarkCount = await page.locator("main, aside[aria-label], section[aria-label]").count();
    assertCondition(landmarkCount >= 6, `expected labelled regions, found ${landmarkCount}`);
    await assertNoHorizontalOverflow(page);
  } finally {
    await context.close();
    await browser.close();
    await stopOpsConsole(server.process);
  }
}

if (process.argv.includes("--run")) {
  run().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
