import {
  assertCondition,
  assertNoHorizontalOverflow,
  importPlaywright,
  openWorkspaceRoute,
  outputPath,
  startClinicalWorkspace,
  stopClinicalWorkspace,
  trackExternalRequests,
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
    const page = await browser.newPage({ viewport: { width: 1480, height: 1040 } });
    const externalRequests = new Set<string>();
    trackExternalRequests(page, baseUrl, externalRequests);
    const preview = page.locator("[data-testid='queue-preview-pocket']");

    await openWorkspaceRoute(page, `${baseUrl}/workspace/queue/recommended?state=live`, "WorkspaceQueueRoute");
    await selectQueueRow(page, "task-311");
    await assertNoHorizontalOverflow(page, "270 self-care ready queue");
    await page.screenshot({ path: outputPath("270-queue-selfcare-ready.png"), fullPage: true });

    await openWorkspaceRoute(page, `${baseUrl}/workspace/queue/callback-follow-up?state=live`, "WorkspaceQueueRoute");
    await selectQueueRow(page, "task-412");
    await assertNoHorizontalOverflow(page, "270 callback repair queue");
    await page.screenshot({ path: outputPath("270-queue-callback-repair.png"), fullPage: true });

    await preview.getByRole("button", { name: "Open callback repair" }).click();
    await page.waitForURL((url: URL) => url.pathname === "/workspace/callbacks");
    await page.locator("[data-testid='WorkspaceCallbacksRoute']").waitFor();
    await page.screenshot({ path: outputPath("270-callback-repair-stage.png"), fullPage: true });

    await openWorkspaceRoute(page, `${baseUrl}/workspace/callbacks?state=stale`, "WorkspaceCallbacksRoute");
    await selectCallbackRow(page, "task-412");
    await page.screenshot({ path: outputPath("270-callback-stale-recoverable.png"), fullPage: true });

    await openWorkspaceRoute(page, `${baseUrl}/workspace/consequences?state=live`, "WorkspaceConsequencesRoute");
    await selectConsequenceRow(page, "task-507");
    await assertNoHorizontalOverflow(page, "270 admin waiting route");
    await page.screenshot({ path: outputPath("270-admin-waiting.png"), fullPage: true });

    await selectConsequenceRow(page, "task-208");
    await page.screenshot({ path: outputPath("270-admin-completed.png"), fullPage: true });

    await selectConsequenceRow(page, "task-118");
    await page.screenshot({ path: outputPath("270-admin-reopened.png"), fullPage: true });

    await openWorkspaceRoute(page, `${baseUrl}/workspace/consequences?state=blocked`, "WorkspaceConsequencesRoute");
    await selectConsequenceRow(page, "task-507");
    await page.screenshot({ path: outputPath("270-admin-blocked.png"), fullPage: true });

    assertCondition(
      externalRequests.size === 0,
      `unexpected external requests: ${Array.from(externalRequests).join(", ")}`,
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
