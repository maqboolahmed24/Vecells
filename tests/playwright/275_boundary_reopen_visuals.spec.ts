import {
  assertCondition,
  assertNoHorizontalOverflow,
  importPlaywright,
  openBoundaryReopenScenario,
  openWorkspaceRoute,
  outputPath,
  selectConsequenceRow,
  startBoundaryReopenLabServer,
  startClinicalWorkspace,
  stopBoundaryReopenLabServer,
  stopClinicalWorkspace,
  takeBoundaryReopenTrace,
  writeBoundaryAriaSnapshots,
} from "./275_phase3_boundary.helpers";

export async function run(): Promise<void> {
  const playwright = await importPlaywright();
  if (!playwright) {
    return;
  }

  const lab = await startBoundaryReopenLabServer();
  const workspace = await startClinicalWorkspace();
  const browser = await playwright.chromium.launch({ headless: true });

  try {
    const desktopContext = await browser.newContext({
      viewport: { width: 1500, height: 1080 },
    });
    await desktopContext.tracing.start({ screenshots: true, snapshots: true });

    const labPage = await desktopContext.newPage();
    for (const [scenarioId, fileName] of [
      ["self_care_live", "275-lab-self-care-live.png"],
      ["admin_waiting_dependency", "275-lab-admin-waiting.png"],
      ["admin_completed_artifact", "275-lab-admin-completed.png"],
      ["stale_epoch_freeze", "275-lab-stale-epoch.png"],
      ["release_watch_quarantined", "275-lab-release-watch-quarantined.png"],
      ["reopened_boundary", "275-lab-reopened-boundary.png"],
    ] as const) {
      await openBoundaryReopenScenario(labPage, lab.atlasUrl, scenarioId);
      const labRoot = labPage.locator("[data-testid='BoundaryReopenAssuranceLab']");
      assertCondition(
        (await labRoot.getAttribute("data-selected-scenario-id")) === scenarioId,
        `boundary lab should select ${scenarioId}`,
      );
      await assertNoHorizontalOverflow(labPage, `275 lab ${scenarioId}`);
      await labPage.screenshot({ path: outputPath(fileName), fullPage: true });
    }

    const workspacePage = await desktopContext.newPage();
    await openWorkspaceRoute(
      workspacePage,
      `${workspace.baseUrl}/workspace/consequences?state=live`,
      "WorkspaceConsequencesRoute",
    );
    await selectConsequenceRow(workspacePage, "task-311");
    await workspacePage.screenshot({ path: outputPath("275-route-self-care-live.png"), fullPage: true });

    await selectConsequenceRow(workspacePage, "task-507");
    await workspacePage.screenshot({ path: outputPath("275-route-admin-waiting.png"), fullPage: true });

    await selectConsequenceRow(workspacePage, "task-208");
    await workspacePage.screenshot({ path: outputPath("275-route-admin-completed.png"), fullPage: true });

    await selectConsequenceRow(workspacePage, "task-118");
    await workspacePage.screenshot({ path: outputPath("275-route-reopened-boundary.png"), fullPage: true });

    const stalePage = await desktopContext.newPage();
    await stalePage.emulateMedia({ reducedMotion: "reduce" });
    await openWorkspaceRoute(
      stalePage,
      `${workspace.baseUrl}/workspace/consequences?state=stale`,
      "WorkspaceConsequencesRoute",
    );
    await selectConsequenceRow(stalePage, "task-311");
    assertCondition(
      (await stalePage.locator("[data-testid='SelfCareIssueStage']").getAttribute("data-stage-state")) ===
        "stale_recoverable",
      "stale self-care route should stay stale-recoverable",
    );
    await stalePage.screenshot({ path: outputPath("275-route-stale-recoverable.png"), fullPage: true });

    const mobileContext = await browser.newContext({
      viewport: { width: 412, height: 915 },
      reducedMotion: "reduce",
    });
    await mobileContext.tracing.start({ screenshots: true, snapshots: true });
    const mobilePage = await mobileContext.newPage();
    await openWorkspaceRoute(
      mobilePage,
      `${workspace.baseUrl}/workspace/consequences?state=blocked`,
      "WorkspaceConsequencesRoute",
    );
    await selectConsequenceRow(mobilePage, "task-507");
    await assertNoHorizontalOverflow(mobilePage, "275 route mobile blocked");
    await mobilePage.screenshot({ path: outputPath("275-route-blocked-mobile.png"), fullPage: true });

    const snapshots = {
      lab: {
        route: await labPage.locator("[data-testid='BoundaryReopenAssuranceLab']").evaluate((node: Element) => ({
          visualMode: node.getAttribute("data-visual-mode"),
          scenarioId: node.getAttribute("data-selected-scenario-id"),
        })),
        boundaryBoard: await labPage
          .locator("[data-testid='BoundaryDecisionBoard']")
          .evaluate((node: Element) => ({
            boundaryMode: node.getAttribute("data-boundary-mode"),
            adviceSettlement: node.getAttribute("data-advice-settlement"),
            adminSettlement: node.getAttribute("data-admin-settlement"),
          })),
        blockerMatrix: await labPage
          .locator("[data-testid='DependencyAndBlockerMatrix']")
          .evaluate((node: Element) => ({
            dependencyState: node.getAttribute("data-dependency-state"),
            recoveryRoute: node.getAttribute("data-recovery-route"),
          })),
        reopenLedger: await labPage
          .locator("[data-testid='ReopenTriggerLedger']")
          .evaluate((node: Element) => ({
            reopenState: node.getAttribute("data-reopen-state"),
          })),
      },
      workspace: {
        detail: await workspacePage
          .locator("[data-testid='SelfCareAdminDetailSurface']")
          .evaluate((node: Element) => ({
            boundaryMode: node.getAttribute("data-boundary-mode"),
            boundaryTuple: node.getAttribute("data-boundary-tuple"),
            adviceSettlement: node.getAttribute("data-advice-settlement"),
            adminSettlement: node.getAttribute("data-admin-settlement"),
          })),
        dependency: await workspacePage
          .locator("[data-testid='AdminDependencyPanel']")
          .evaluate((node: Element) => ({
            dependencyState: node.getAttribute("data-admin-dependency-state"),
          })),
        recovery: await workspacePage
          .locator("[data-testid='BoundaryDriftRecovery']")
          .evaluate((node: Element) => ({
            recoveryState: node.getAttribute("data-recovery-state"),
          })),
      },
    };

    await writeBoundaryAriaSnapshots(snapshots, "275-boundary-reopen-aria-snapshots.json");
    await takeBoundaryReopenTrace(desktopContext, "275-boundary-reopen-visual-trace.zip");
    await takeBoundaryReopenTrace(mobileContext, "275-boundary-reopen-mobile-trace.zip");
  } finally {
    await browser.close();
    await stopBoundaryReopenLabServer(lab.server);
    await stopClinicalWorkspace(workspace.child);
  }
}

if (process.argv.includes("--run")) {
  run().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
