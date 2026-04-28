import {
  assertNoHorizontalOverflow,
  importPlaywright,
  openWorkspaceRoute,
  outputPath,
  startClinicalWorkspace,
  stopClinicalWorkspace,
} from "./255_workspace_shell_helpers";

export const queueWorkboardVisualCoverage = [
  "desktop queue workboard baseline",
  "pinned preview desktop state",
  "mobile mission-stack queue state",
];

export async function run(): Promise<void> {
  const playwright = await importPlaywright();
  if (!playwright) {
    return;
  }

  const { child, baseUrl } = await startClinicalWorkspace();
  const browser = await playwright.chromium.launch({ headless: true });

  try {
    const page = await browser.newPage({ viewport: { width: 1480, height: 1080 } });
    await openWorkspaceRoute(page, `${baseUrl}/workspace/queue/recommended`, "WorkspaceQueueRoute");
    await page.screenshot({ path: outputPath("256-queue-workboard-desktop.png"), fullPage: true });

    const task412RowButton = page.locator("[data-task-id='task-412']").first();
    await task412RowButton.scrollIntoViewIfNeeded();
    await task412RowButton.click();
    await page.waitForTimeout(80);
    await page.screenshot({ path: outputPath("256-queue-workboard-pinned-preview.png"), fullPage: true });
    await assertNoHorizontalOverflow(page, "256 queue visual desktop");

    const mobilePage = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await openWorkspaceRoute(mobilePage, `${baseUrl}/workspace/queue/recommended`, "WorkspaceQueueRoute");
    await mobilePage.screenshot({ path: outputPath("256-queue-workboard-mobile.png"), fullPage: true });
    await assertNoHorizontalOverflow(mobilePage, "256 queue visual mobile");
    await mobilePage.close();
  } finally {
    await browser.close();
    await stopClinicalWorkspace(child);
  }
}

if (process.argv.includes("--run")) {
  run().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
