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
  const context = await browser.newContext({ viewport: { width: 1280, height: 980 } });
  const page = await context.newPage();

  try {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(
      `${server.baseUrl}/ops/support/cases/SUP-398-001/channel?tab=patient&event=evt-398-navigation`,
      { waitUntil: "networkidle" },
    );
    await page.getByTestId("NHSAppChannelControlWorkbench").waitFor();
    await page.getByRole("heading", { name: "NHS App support and governance workbench" }).waitFor();
    await page.getByRole("tab", { name: "Patient" }).waitFor();
    await page.getByRole("button", { name: /SUP-398-002/i }).waitFor();

    await page.keyboard.press("Tab");
    const activeTag = await page.evaluate(() => document.activeElement?.tagName ?? "");
    assertCondition(activeTag.length > 0, "keyboard tab did not move focus.");

    await page.setViewportSize({ width: 1024, height: 980 });
    await assertNoHorizontalOverflow(page);
    await page.setViewportSize({ width: 390, height: 900 });
    await assertNoHorizontalOverflow(page);
    await page.setViewportSize({ width: 1280, height: 980 });
    await assertNoHorizontalOverflow(page);

    const screenshotPath = outputPath("398_channel_merge_accessibility_and_visual.png");
    await page.screenshot({ path: screenshotPath, fullPage: true });
    assertCondition(fs.existsSync(screenshotPath), "398 visual screenshot was not written.");
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
