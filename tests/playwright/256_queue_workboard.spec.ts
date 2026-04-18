import {
  assertCondition,
  assertNoHorizontalOverflow,
  importPlaywright,
  openWorkspaceRoute,
  outputPath,
  startClinicalWorkspace,
  stopClinicalWorkspace,
} from "./255_workspace_shell_helpers";

export const queueWorkboardCoverage = [
  "summary-first hover preview",
  "single-click pins preview without opening the task",
  "explicit open stays same-shell",
  "task-open view preserves the queue navigator",
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
    await page.locator("[data-testid='queue-toolbar']").waitFor();
    await page.locator("[data-testid='QueueWorkboardFrame']").waitFor();

    const task412RowButton = page.locator("[data-task-id='task-412']").first();
    await task412RowButton.scrollIntoViewIfNeeded();
    await task412RowButton.hover();
    await page.waitForTimeout(140);
    await page.locator("[data-testid='queue-preview-pocket']").waitFor();
    assertCondition(
      (await page.locator("[data-testid='queue-preview-pocket'] strong").first().innerText()) === "Elena Morris",
      "hover preview did not switch to the hovered row",
    );
    assertCondition(
      (await page.locator("[data-testid='queue-preview-pocket']").getAttribute("data-preview-mode")) === "hover_summary",
      "hover preview did not stay in summary mode",
    );

    await task412RowButton.click();
    await page.waitForTimeout(40);
    assertCondition(page.url().endsWith("/workspace/queue/recommended"), "single click should not open the task");
    assertCondition(
      (await page.locator("[data-testid='queue-preview-pocket']").getAttribute("data-preview-mode")) === "pinned_summary",
      "row selection did not pin the preview",
    );

    const root = page.locator("[data-testid='WorkspaceShellRouteFamily']");
    assertCondition(
      (await root.getAttribute("data-selected-anchor-ref")) === "queue-row-task-412",
      "selected anchor did not move to the pinned row",
    );

    await page
      .locator("[data-task-id='task-412']")
      .locator("xpath=ancestor::article[contains(@class,'staff-shell__queue-row')][1]")
      .locator(".staff-shell__queue-open-button")
      .click();
    await page.waitForURL(`${baseUrl}/workspace/task/task-412`);
    await page.locator("[data-testid='WorkspaceTaskRoute']").waitFor();
    await page.locator("[data-testid='queue-workboard']").waitFor();
    await page.locator("[data-testid='queue-preview-pocket']").waitFor();
    assertCondition(
      (await page.locator("[data-testid='queue-preview-pocket']").getAttribute("data-preview-mode")) === "task_open",
      "task-open route did not keep the queue pocket in task-open posture",
    );

    await assertNoHorizontalOverflow(page, "256 queue workboard default");
    await page.screenshot({ path: outputPath("256-queue-workboard-default.png"), fullPage: true });
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
