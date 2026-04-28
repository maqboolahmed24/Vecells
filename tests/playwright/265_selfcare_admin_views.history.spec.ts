import {
  assertCondition,
  importPlaywright,
  openWorkspaceRoute,
  startClinicalWorkspace,
  stopClinicalWorkspace,
} from "./255_workspace_shell_helpers";

async function selectConsequenceRow(page: any, taskId: string) {
  await page
    .locator(`[data-testid='ConsequenceWorkbenchRow'][data-task-id='${taskId}'] .staff-shell__consequence-row-main`)
    .click();
  await page.waitForFunction(
    (selectedTaskId) =>
      document
        .querySelector(`[data-testid='ConsequenceWorkbenchRow'][data-task-id='${selectedTaskId}']`)
        ?.getAttribute("data-selected") === "true",
    taskId,
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
    await openWorkspaceRoute(page, `${baseUrl}/workspace/consequences?state=live`, "WorkspaceConsequencesRoute");
    await page.locator("[data-testid='SelfCareAdminViewsRoute']").waitFor();

    await selectConsequenceRow(page, "task-507");
    const root = page.locator("[data-testid='WorkspaceShellRouteFamily']");
    await page.waitForFunction(
      () =>
        document
          .querySelector("[data-testid='WorkspaceShellRouteFamily']")
          ?.getAttribute("data-selected-anchor-ref") === "consequence-row-task-507",
    );
    const anchorBeforeReload = await root.getAttribute("data-selected-anchor-ref");

    await page.reload({ waitUntil: "networkidle" });
    await page.locator("[data-testid='WorkspaceConsequencesRoute']").waitFor();
    assertCondition(
      (await page.locator("[data-testid='ConsequenceWorkbenchRow'][data-task-id='task-507']").getAttribute("data-selected")) ===
        "true",
      "reload should preserve the selected consequence row",
    );
    assertCondition(
      (await root.getAttribute("data-selected-anchor-ref")) === anchorBeforeReload,
      "reload should preserve the selected consequence anchor",
    );

    await page.getByRole("button", { name: "Open task shell" }).click();
    await page.waitForURL(`${baseUrl}/workspace/task/task-507`);
    await page.goBack({ waitUntil: "networkidle" });
    await page.locator("[data-testid='WorkspaceConsequencesRoute']").waitFor();
    assertCondition(
      (await page.locator("[data-testid='ConsequenceWorkbenchRow'][data-task-id='task-507']").getAttribute("data-selected")) ===
        "true",
      "back navigation should restore the selected consequence row",
    );
    assertCondition(
      (await root.getAttribute("data-selected-anchor-ref")) === anchorBeforeReload,
      "back navigation should restore the selected consequence anchor",
    );
    assertCondition(
      (await page.locator("[data-testid='SelfCareAdminDetailSurface']").getAttribute("data-boundary-mode")) ===
        "admin_resolution",
      "back navigation should restore the same consequence mode",
    );

    await page.goForward({ waitUntil: "networkidle" });
    await page.locator("[data-testid='WorkspaceTaskRoute']").waitFor();
    assertCondition(
      new URL(page.url()).pathname === "/workspace/task/task-507" &&
        ((await page.locator("[data-testid='ActiveTaskShell']").getAttribute("data-opening-mode")) ?? "") !== "",
      "forward navigation should return to the task shell rather than a detached consequence page",
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
