import {
  assertCondition,
  importPlaywright,
  openWorkspaceRoute,
  startClinicalWorkspace,
  stopClinicalWorkspace,
} from "./255_workspace_shell_helpers";

async function selectCallbackRow(page: any, taskId: string) {
  await page
    .locator(`[data-testid='CallbackWorklistRow'][data-task-id='${taskId}'] .staff-shell__callback-row-main`)
    .click();
  await page.waitForFunction(
    (selectedTaskId) =>
      document
        .querySelector(`[data-testid='CallbackWorklistRow'][data-task-id='${selectedTaskId}']`)
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
    await openWorkspaceRoute(page, `${baseUrl}/workspace/callbacks?state=live`, "WorkspaceCallbacksRoute");

    await selectCallbackRow(page, "task-412");
    await page
      .locator("[data-testid='CallbackAttemptTimeline'] .staff-shell__callback-timeline-button")
      .nth(1)
      .click();
    const root = page.locator("[data-testid='WorkspaceShellRouteFamily']");
    await page.waitForFunction(
      () =>
        document
          .querySelector("[data-testid='WorkspaceShellRouteFamily']")
          ?.getAttribute("data-selected-anchor-ref")
          ?.startsWith("callback-attempt-") === true,
    );
    const anchorBeforeReload = await root.getAttribute("data-selected-anchor-ref");

    await page.locator("[data-testid='CallbackRouteRepairPrompt']").first().getByRole("button", { name: "Open route repair" }).click();
    await page.waitForFunction(
      () => document.querySelector("[data-testid='CallbackDetailSurface']")?.getAttribute("data-stage") === "repair",
    );
    assertCondition(
      (await page.locator("[data-testid='CallbackDetailSurface']").getAttribute("data-stage")) === "repair",
      "repair action should promote the callback detail stage into repair",
    );

    await page.reload({ waitUntil: "networkidle" });
    await page.locator("[data-testid='CallbackWorklistRoute']").waitFor();
    assertCondition(
      (await page.locator("[data-testid='CallbackWorklistRow'][data-task-id='task-412']").getAttribute("data-selected")) ===
        "true",
      "reload should preserve the selected callback case",
    );
    assertCondition(
      (await root.getAttribute("data-selected-anchor-ref")) === anchorBeforeReload,
      "reload should preserve the selected callback attempt anchor",
    );
    assertCondition(
      (await page.locator("[data-testid='CallbackDetailSurface']").getAttribute("data-stage")) === "repair",
      "reload should preserve the repair stage posture",
    );

    await page.locator("[data-testid='CallbackDetailSurface']").getByRole("button", { name: "Open task shell" }).click();
    await page.waitForURL(`${baseUrl}/workspace/task/task-412`);
    await page.goBack({ waitUntil: "networkidle" });
    await page.locator("[data-testid='CallbackWorklistRoute']").waitFor();
    assertCondition(
      (await page.locator("[data-testid='CallbackWorklistRow'][data-task-id='task-412']").getAttribute("data-selected")) ===
        "true",
      "back navigation should restore the selected callback case",
    );
    assertCondition(
      (await root.getAttribute("data-selected-anchor-ref")) === anchorBeforeReload,
      "back navigation should restore the callback attempt anchor",
    );
    assertCondition(
      (await page.locator("[data-testid='CallbackDetailSurface']").getAttribute("data-stage")) === "repair",
      "back navigation should restore the repair stage posture",
    );

    await page.goForward({ waitUntil: "networkidle" });
    await page.locator("[data-testid='WorkspaceTaskRoute']").waitFor();
    assertCondition(
      new URL(page.url()).pathname === "/workspace/task/task-412" &&
        ((await page.locator("[data-testid='ActiveTaskShell']").getAttribute("data-opening-mode")) ?? "") !== "",
      "forward navigation should return to the same task shell rather than a detached callback surface",
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
