import fs from "node:fs";

import {
  assertCondition,
  assertNoHorizontalOverflow,
  importPlaywright,
  outputPath,
  startOpsConsole,
  stopOpsConsole,
} from "./386_nhs_app_readiness.helpers";

async function assertScreenshotEvidence(fileName: string): Promise<void> {
  const stats = fs.statSync(outputPath(fileName));
  assertCondition(stats.size > 2_000, `${fileName} screenshot evidence is unexpectedly small`);
}

export async function run(): Promise<void> {
  const playwright = await importPlaywright();
  if (!playwright) return;

  const server = await startOpsConsole();
  const browser = await playwright.chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 980 },
    locale: "en-GB",
    timezoneId: "Europe/London",
  });
  await context.tracing.start({ screenshots: true, snapshots: true });
  const page = await context.newPage();

  try {
    await page.goto(
      `${server.baseUrl}/ops/release/nhs-app/routes/jp_pharmacy_status?env=limited_release&preview=ios_safe_area&tab=evidence`,
      { waitUntil: "networkidle" },
    );
    const root = page.getByTestId("NHSAppReadinessCockpit");
    await root.waitFor();
    assertCondition(
      (await root.getAttribute("data-current-environment-tuple"))?.startsWith("limited_release:"),
      "401 release cockpit did not bind limited-release environment tuple",
    );
    assertCondition(
      Boolean(await root.getAttribute("data-current-readiness-verdict")),
      "401 release cockpit missing readiness verdict",
    );

    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");
    const focusedText = await page.evaluate(
      () => document.activeElement?.textContent?.trim() ?? "",
    );
    assertCondition(focusedText.length > 0, "401 release cockpit keyboard traversal failed");

    await page.getByTestId("InspectorTab-compatibility").click();
    assertCondition(
      await page.getByTestId("InspectorCompatibilityPanel").isVisible(),
      "401 compatibility panel not visible",
    );
    await page.getByTestId("OpenEvidenceDrawerButton").click();
    assertCondition(
      (await page
        .getByTestId("NHSAppEvidenceDrawer")
        .getAttribute("data-current-evidence-drawer-state")) === "open",
      "401 evidence drawer did not open",
    );
    await page.getByTestId("CloseEvidenceDrawerButton").click();
    assertCondition(
      (await page
        .getByTestId("NHSAppEvidenceDrawer")
        .getAttribute("data-current-evidence-drawer-state")) === "closed",
      "401 evidence drawer did not close",
    );

    await page.screenshot({
      path: outputPath("401-release-control-surface-desktop.png"),
      fullPage: true,
      animations: "disabled",
      caret: "hide",
    });
    await assertNoHorizontalOverflow(page);

    await page.setViewportSize({ width: 390, height: 900 });
    await page.screenshot({
      path: outputPath("401-release-control-surface-mobile.png"),
      fullPage: true,
      animations: "disabled",
      caret: "hide",
    });
    const mobileBox = await root.boundingBox();
    assertCondition(
      Boolean(mobileBox && mobileBox.width >= 300 && mobileBox.height >= 500),
      "401 release cockpit not visible at mobile width",
    );
    await assertNoHorizontalOverflow(page);
    await assertScreenshotEvidence("401-release-control-surface-desktop.png");
    await assertScreenshotEvidence("401-release-control-surface-mobile.png");
  } finally {
    await context.tracing.stop({
      path: outputPath("401-release-control-surfaces-visual-trace.zip"),
    });
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
