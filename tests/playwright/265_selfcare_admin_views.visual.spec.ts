import {
  assertCondition,
  assertNoHorizontalOverflow,
  importPlaywright,
  openWorkspaceRoute,
  outputPath,
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
    const desktop = await browser.newPage({ viewport: { width: 1480, height: 1080 } });
    await openWorkspaceRoute(desktop, `${baseUrl}/workspace/consequences?state=live`, "WorkspaceConsequencesRoute");
    await desktop.locator("[data-testid='SelfCareAdminViewsRoute']").waitFor();
    await selectConsequenceRow(desktop, "task-311");
    await desktop.screenshot({ path: outputPath("265-selfcare-admin-desktop-selfcare.png"), fullPage: true });

    await selectConsequenceRow(desktop, "task-507");
    await desktop.screenshot({ path: outputPath("265-selfcare-admin-desktop-admin-waiting.png"), fullPage: true });

    await selectConsequenceRow(desktop, "task-118");
    await desktop.screenshot({ path: outputPath("265-selfcare-admin-desktop-reopened.png"), fullPage: true });

    const stale = await browser.newPage({ viewport: { width: 1480, height: 1080 } });
    await stale.emulateMedia({ reducedMotion: "reduce" });
    await openWorkspaceRoute(stale, `${baseUrl}/workspace/consequences?state=stale`, "WorkspaceConsequencesRoute");
    await stale.locator("[data-testid='SelfCareAdminViewsRoute']").waitFor();
    await selectConsequenceRow(stale, "task-311");
    assertCondition(
      (await stale.locator("[data-testid='SelfCareIssueStage']").getAttribute("data-stage-state")) ===
        "stale_recoverable",
      "stale route should keep self-care issue stage visible in stale-recoverable posture",
    );
    await assertNoHorizontalOverflow(stale, "265 self-care admin stale");
    await stale.screenshot({ path: outputPath("265-selfcare-admin-stale.png"), fullPage: true });

    const mobile = await browser.newPage({ viewport: { width: 430, height: 980 } });
    await mobile.emulateMedia({ reducedMotion: "reduce" });
    await openWorkspaceRoute(mobile, `${baseUrl}/workspace/consequences?state=blocked`, "WorkspaceConsequencesRoute");
    await mobile.locator("[data-testid='SelfCareAdminViewsRoute']").waitFor();
    await selectConsequenceRow(mobile, "task-507");
    assertCondition(
      (await mobile.locator("[data-testid='BoundaryDriftRecovery']").getAttribute("data-recovery-state")) === "blocked",
      "blocked route should keep same-shell recovery visible",
    );
    await assertNoHorizontalOverflow(mobile, "265 self-care admin mobile");
    await mobile.screenshot({ path: outputPath("265-selfcare-admin-mobile-blocked.png"), fullPage: true });
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
