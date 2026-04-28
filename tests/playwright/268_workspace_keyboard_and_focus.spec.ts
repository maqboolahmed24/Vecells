import {
  assertCondition,
  importPlaywright,
  openWorkspaceRoute,
  startClinicalWorkspace,
  stopClinicalWorkspace,
} from "./255_workspace_shell_helpers";

async function activeRegionId(page: any): Promise<string> {
  return await page.evaluate(() =>
    document.activeElement instanceof HTMLElement ? document.activeElement.id : "",
  );
}

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
    const listbox = page.locator("[data-testid='QueueWorkboardFrame'] [role='listbox']");
    const queuedTaskIds = await page
      .locator("[data-testid='QueueWorkboardFrame'] .staff-shell__queue-row-main")
      .evaluateAll((nodes) => nodes.map((node) => node.getAttribute("data-task-id") ?? ""));
    const secondTaskId = queuedTaskIds[1];
    assertCondition(Boolean(secondTaskId), "queue route should expose at least two rows for keyboard scan");
    await listbox.focus();
    await page.keyboard.press("ArrowDown");
    await page.waitForFunction(
      (expectedTaskId) =>
        document
          .querySelector("[data-testid='WorkspaceShellRouteFamily']")
          ?.getAttribute("data-selected-anchor-ref") === `queue-row-${expectedTaskId}`,
      secondTaskId,
    );
    await page.keyboard.press("Enter");
    await page.waitForURL(`${baseUrl}/workspace/task/${secondTaskId}`);
    await page.waitForFunction(() => document.activeElement?.id === "workspace-task-canvas");

    assertCondition((await activeRegionId(page)) === "workspace-task-canvas", "task route should land on task canvas");
    await page.keyboard.press("Alt+Shift+ArrowLeft");
    assertCondition((await activeRegionId(page)) === "workspace-workboard", "pane cycle should reach workboard");
    await page.keyboard.press("Alt+Shift+ArrowRight");
    assertCondition((await activeRegionId(page)) === "workspace-task-canvas", "pane cycle should return to task canvas");
    await page.keyboard.press("Alt+Shift+ArrowRight");
    assertCondition((await activeRegionId(page)) === "workspace-decision-dock", "pane cycle should reach decision dock");

    await openWorkspaceRoute(page, `${baseUrl}/workspace/task/task-208/decision?state=live`, "WorkspaceDecisionChildRoute");
    await page.waitForFunction(() => document.activeElement?.id === "workspace-decision-dock");
    await page.keyboard.press("Alt+Shift+4");
    assertCondition((await activeRegionId(page)) === "workspace-context-region", "direct pane jump should reach context");
    await page.keyboard.press("Alt+Shift+1");
    assertCondition((await activeRegionId(page)) === "workspace-workboard", "direct pane jump should return to workboard");

    await openWorkspaceRoute(page, `${baseUrl}/workspace/callbacks?state=live`, "WorkspaceCallbacksRoute");
    await page.waitForFunction(() => document.activeElement?.id === "workspace-peer-route");
    assertCondition(
      (await page.locator("[data-testid='WorkspaceShellRouteFamily']").getAttribute("data-keyboard-region-order")) ===
        "workspace-peer-route",
      "peer workbench routes should publish a single peer-route focus entry",
    );
    await page.keyboard.press("Alt+Shift+ArrowLeft");
    await page.waitForFunction(() => document.activeElement?.id === "workspace-peer-route");
    assertCondition((await activeRegionId(page)) === "workspace-peer-route", "peer routes should stay on the peer-route focus target");
    await page.keyboard.press("Alt+Shift+ArrowRight");
    await page.waitForFunction(() => document.activeElement?.id === "workspace-peer-route");
    assertCondition((await activeRegionId(page)) === "workspace-peer-route", "peer routes should cycle forward to peer route");
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
