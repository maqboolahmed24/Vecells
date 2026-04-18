import {
  assertCondition,
  assertNoHorizontalOverflow,
  importPlaywright,
  openWorkspaceRoute,
  outputPath,
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
    const desktop = await browser.newPage({ viewport: { width: 1480, height: 1080 } });
    await openWorkspaceRoute(desktop, `${baseUrl}/workspace/callbacks?state=live`, "WorkspaceCallbacksRoute");
    await selectCallbackRow(desktop, "task-311");
    await desktop.screenshot({ path: outputPath("263-callback-workbench-desktop.png"), fullPage: true });

    await selectCallbackRow(desktop, "task-412");
    await desktop.screenshot({ path: outputPath("263-callback-workbench-repair.png"), fullPage: true });

    await selectCallbackRow(desktop, "task-208");
    await desktop.screenshot({ path: outputPath("263-callback-workbench-pending.png"), fullPage: true });

    const stale = await browser.newPage({ viewport: { width: 1480, height: 1080 } });
    await stale.emulateMedia({ reducedMotion: "reduce" });
    await openWorkspaceRoute(stale, `${baseUrl}/workspace/callbacks?state=stale`, "WorkspaceCallbacksRoute");
    await selectCallbackRow(stale, "task-311");
    assertCondition(
      (await stale.locator("[data-testid='CallbackOutcomeCapture']").getAttribute("data-stage-state")) ===
        "stale_recoverable",
      "stale callback route should freeze the outcome stage into stale-recoverable posture",
    );
    await assertNoHorizontalOverflow(stale, "263 callback workbench stale");
    await stale.screenshot({ path: outputPath("263-callback-workbench-stale.png"), fullPage: true });

    const mobile = await browser.newPage({ viewport: { width: 430, height: 980 } });
    await mobile.emulateMedia({ reducedMotion: "reduce" });
    await openWorkspaceRoute(mobile, `${baseUrl}/workspace/callbacks?state=blocked`, "WorkspaceCallbacksRoute");
    assertCondition(
      (await mobile.locator("[data-testid='CallbackOutcomeCapture']").getAttribute("data-stage-state")) === "blocked",
      "blocked callback route should keep the stage visible but frozen",
    );
    await assertNoHorizontalOverflow(mobile, "263 callback workbench mobile");
    await mobile.screenshot({ path: outputPath("263-callback-workbench-mobile.png"), fullPage: true });
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
