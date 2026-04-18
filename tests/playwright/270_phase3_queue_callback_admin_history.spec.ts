import {
  assertCondition,
  importPlaywright,
  openWorkspaceRoute,
  startClinicalWorkspace,
  stopClinicalWorkspace,
} from "./255_workspace_shell_helpers";

async function selectQueueRow(page: any, taskId: string) {
  await page.locator(`[data-task-id='${taskId}'].staff-shell__queue-row-main`).click();
  await page.waitForFunction(
    (selectedTaskId) =>
      document
        .querySelector(`#queue-option-${selectedTaskId}`)
        ?.getAttribute("data-selection-state") === "selected",
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
    const root = page.locator("[data-testid='WorkspaceShellRouteFamily']");
    const preview = page.locator("[data-testid='queue-preview-pocket']");

    await openWorkspaceRoute(page, `${baseUrl}/workspace/queue/callback-follow-up?state=live`, "WorkspaceQueueRoute");
    await selectQueueRow(page, "task-412");
    assertCondition(
      (await root.getAttribute("data-selected-anchor-ref")) === "queue-row-task-412",
      "callback queue row selection should set the queue anchor",
    );

    await preview.getByRole("button", { name: "Open callback repair" }).click();
    await page.waitForURL((url: URL) => url.pathname === "/workspace/callbacks");
    await page.locator("[data-testid='WorkspaceCallbacksRoute']").waitFor();
    assertCondition(
      (await root.getAttribute("data-selected-anchor-ref")) === "callback-repair-task-412",
      "callback launch should preserve the routed repair anchor",
    );
    assertCondition(
      (await page.locator("[data-testid='CallbackDetailSurface']").getAttribute("data-stage")) === "repair",
      "callback launch should preserve the repair stage",
    );

    const callbackAnchorBeforeReload = await root.getAttribute("data-selected-anchor-ref");
    await page.reload({ waitUntil: "networkidle" });
    await page.locator("[data-testid='WorkspaceCallbacksRoute']").waitFor();
    assertCondition(
      (await page.locator("[data-testid='CallbackWorklistRow'][data-task-id='task-412']").getAttribute("data-selected")) ===
        "true",
      "callback reload should preserve the selected callback case",
    );
    assertCondition(
      (await root.getAttribute("data-selected-anchor-ref")) === callbackAnchorBeforeReload,
      "callback reload should preserve the repair anchor",
    );
    assertCondition(
      (await page.locator("[data-testid='CallbackDetailSurface']").getAttribute("data-stage")) === "repair",
      "callback reload should preserve the repair stage",
    );

    await page.goBack({ waitUntil: "networkidle" });
    await page.locator("[data-testid='WorkspaceQueueRoute']").waitFor();
    assertCondition(
      new URL(page.url()).pathname === "/workspace/queue/callback-follow-up",
      "back navigation should return to the callback-follow-up queue",
    );
    assertCondition(
      (await root.getAttribute("data-selected-anchor-ref")) === "queue-row-task-412",
      "back navigation should restore the queue anchor for task-412",
    );
    assertCondition(
      (await page.locator("#queue-option-task-412").getAttribute("data-selection-state")) === "selected",
      "back navigation should restore the selected queue row for task-412",
    );

    await page.goForward({ waitUntil: "networkidle" });
    await page.locator("[data-testid='WorkspaceCallbacksRoute']").waitFor();
    assertCondition(
      (await root.getAttribute("data-selected-anchor-ref")) === callbackAnchorBeforeReload,
      "forward navigation should restore the callback repair anchor",
    );
    assertCondition(
      (await page.locator("[data-testid='CallbackDetailSurface']").getAttribute("data-stage")) === "repair",
      "forward navigation should restore the callback repair stage",
    );

    await openWorkspaceRoute(page, `${baseUrl}/workspace/queue/pharmacy-watch?state=live`, "WorkspaceQueueRoute");
    await selectQueueRow(page, "task-507");
    assertCondition(
      (await root.getAttribute("data-selected-anchor-ref")) === "queue-row-task-507",
      "admin queue row selection should set the queue anchor",
    );

    await preview.getByRole("button", { name: "Open bounded admin stage" }).click();
    await page.waitForURL((url: URL) => url.pathname === "/workspace/consequences");
    await page.locator("[data-testid='WorkspaceConsequencesRoute']").waitFor();
    assertCondition(
      (await root.getAttribute("data-selected-anchor-ref")) === "consequence-detail-task-507",
      "admin launch should preserve the routed consequence anchor",
    );
    assertCondition(
      (await page.locator("[data-testid='SelfCareAdminDetailSurface']").getAttribute("data-boundary-mode")) ===
        "admin_resolution",
      "admin launch should preserve admin boundary mode",
    );

    const adminAnchorBeforeReload = await root.getAttribute("data-selected-anchor-ref");
    await page.reload({ waitUntil: "networkidle" });
    await page.locator("[data-testid='WorkspaceConsequencesRoute']").waitFor();
    assertCondition(
      (await page.locator("[data-testid='ConsequenceWorkbenchRow'][data-task-id='task-507']").getAttribute("data-selected")) ===
        "true",
      "admin reload should preserve the selected consequence row",
    );
    assertCondition(
      (await root.getAttribute("data-selected-anchor-ref")) === adminAnchorBeforeReload,
      "admin reload should preserve the consequence anchor",
    );
    assertCondition(
      (await page.locator("[data-testid='SelfCareAdminDetailSurface']").getAttribute("data-admin-settlement")) ===
        "waiting_dependency",
      "admin reload should preserve the waiting dependency settlement",
    );

    await page.goBack({ waitUntil: "networkidle" });
    await page.locator("[data-testid='WorkspaceQueueRoute']").waitFor();
    assertCondition(
      new URL(page.url()).pathname === "/workspace/queue/pharmacy-watch",
      "back navigation should return to the pharmacy-watch queue",
    );
    assertCondition(
      (await root.getAttribute("data-selected-anchor-ref")) === "queue-row-task-507",
      "back navigation should restore the queue anchor for task-507",
    );
    assertCondition(
      (await page.locator("#queue-option-task-507").getAttribute("data-selection-state")) === "selected",
      "back navigation should restore the selected queue row for task-507",
    );

    await page.goForward({ waitUntil: "networkidle" });
    await page.locator("[data-testid='WorkspaceConsequencesRoute']").waitFor();
    assertCondition(
      (await root.getAttribute("data-selected-anchor-ref")) === adminAnchorBeforeReload,
      "forward navigation should restore the consequence anchor",
    );
    assertCondition(
      (await page.locator("[data-testid='SelfCareAdminDetailSurface']").getAttribute("data-boundary-mode")) ===
        "admin_resolution",
      "forward navigation should restore the admin consequence detail",
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
