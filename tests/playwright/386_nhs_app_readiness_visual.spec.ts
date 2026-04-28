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
  const context = await browser.newContext({ viewport: { width: 1440, height: 980 } });
  await context.tracing.start({ screenshots: true, snapshots: true });
  const page = await context.newPage();

  try {
    const url = `${server.baseUrl}/ops/release/nhs-app/routes/jp_pharmacy_status?env=sandpit&preview=ios_safe_area&tab=evidence`;
    await page.goto(url, { waitUntil: "networkidle" });
    await page.screenshot({ path: outputPath("386-nhs-app-readiness-desktop.png"), fullPage: true });
    await assertNoHorizontalOverflow(page);

    await page.setViewportSize({ width: 1180, height: 900 });
    await page.screenshot({ path: outputPath("386-nhs-app-readiness-docked.png"), fullPage: true });
    await assertNoHorizontalOverflow(page);

    await page.setViewportSize({ width: 390, height: 900 });
    await page.screenshot({ path: outputPath("386-nhs-app-readiness-mobile.png"), fullPage: true });
    const rootBox = await page.getByTestId("NHSAppReadinessCockpit").boundingBox();
    assertCondition(Boolean(rootBox && rootBox.width > 300 && rootBox.height > 500), "root not visible at mobile size");
    await assertNoHorizontalOverflow(page);
  } finally {
    await context.tracing.stop({ path: outputPath("386-nhs-app-readiness-trace.zip") });
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
