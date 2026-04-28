import {
  assertCondition,
  importPlaywright,
  openWorkspaceRoute,
  startClinicalWorkspace,
  stopClinicalWorkspace,
} from "./255_workspace_shell_helpers";

export async function run(): Promise<void> {
  const playwright = await importPlaywright();
  if (!playwright) {
    return;
  }

  const { child, baseUrl } = await startClinicalWorkspace();
  const browser = await playwright.chromium.launch({ headless: true });

  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 960 } });
    await openWorkspaceRoute(page, `${baseUrl}/workspace/queue/recommended?state=live`, "WorkspaceQueueRoute");
    const queueWorkboard = page.locator("[data-testid='queue-workboard']");
    await queueWorkboard.focus();
    await page.waitForFunction(
      () => document.querySelector("[data-testid='queue-workboard']")?.getAttribute("aria-activedescendant") === "queue-option-task-311",
    );
    await queueWorkboard.press("Enter");
    await page.waitForURL(`${baseUrl}/workspace/task/task-311`);
    await page.getByRole("button", { name: "More-info child route" }).click();
    await page.waitForURL(`${baseUrl}/workspace/task/task-311/more-info`);
    await page.waitForFunction(() =>
      document.querySelector("[data-testid='ActiveTaskShell']")?.getAttribute("data-protected-composition") ===
      "composing",
    );
    await page
      .locator("[data-testid='decision-dock'] [data-testid='BufferedQueueChangeTray']")
      .getByRole("button", { name: "Keep this batch buffered" })
      .click();

    const tray = page.locator("[data-testid='decision-dock'] [data-testid='BufferedQueueChangeTray']");
    const anchorBeforeReload = await page
      .locator("[data-testid='WorkspaceShellRouteFamily']")
      .getAttribute("data-selected-anchor-ref");
    assertCondition(
      (await tray.getAttribute("data-tray-state")) === "deferred",
      "defer action should set the tray state to deferred",
    );

    await page.reload({ waitUntil: "networkidle" });
    await page.locator("[data-testid='ActiveTaskShell']").waitFor();
    assertCondition(
      (await tray.getAttribute("data-tray-state")) === "deferred",
      "reload should preserve the buffered tray state",
    );
    assertCondition(
      (await page.locator("[data-testid='WorkspaceShellRouteFamily']").getAttribute("data-selected-anchor-ref")) ===
        anchorBeforeReload,
      "reload should preserve the selected anchor",
    );

    await page.getByRole("button", { name: "Decision child route" }).click();
    await page.waitForURL(`${baseUrl}/workspace/task/task-311/decision`);
    await page.waitForFunction(() =>
      document.querySelector("[data-testid='ActiveTaskShell']")?.getAttribute("data-protected-composition") ===
      "confirming",
    );
    assertCondition(
      (await page.locator("[data-testid='ActiveTaskShell']").getAttribute("data-protected-composition")) === "confirming",
      "decision child route should publish confirming protected composition",
    );

    await page.goBack({ waitUntil: "networkidle" });
    await page.locator("[data-testid='ActiveTaskShell']").waitFor();
    assertCondition(
      (await tray.getAttribute("data-tray-state")) === "deferred",
      "back navigation should preserve the buffered tray state",
    );
    assertCondition(
      (await page.locator("[data-testid='ActiveTaskShell']").getAttribute("data-protected-composition")) === "composing",
      "back navigation should restore the more-info protected state",
    );

    await page.goForward({ waitUntil: "networkidle" });
    await page.locator("[data-testid='ActiveTaskShell']").waitFor();
    await page.waitForFunction(() =>
      document.querySelector("[data-testid='ActiveTaskShell']")?.getAttribute("data-protected-composition") ===
      "confirming",
    );
    assertCondition(
      (await page.locator("[data-testid='ActiveTaskShell']").getAttribute("data-protected-composition")) === "confirming",
      "forward navigation should restore the decision protected state",
    );
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
