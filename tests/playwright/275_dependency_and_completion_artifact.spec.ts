import {
  assertCondition,
  importPlaywright,
  openWorkspaceRoute,
  selectConsequenceRow,
  startClinicalWorkspace,
  stopClinicalWorkspace,
  tabUntil,
  takeBoundaryReopenTrace,
} from "./275_phase3_boundary.helpers";

export async function run(): Promise<void> {
  const playwright = await importPlaywright();
  if (!playwright) {
    return;
  }

  const workspace = await startClinicalWorkspace();
  const browser = await playwright.chromium.launch({ headless: true });

  try {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 980 },
      reducedMotion: "reduce",
    });
    await context.tracing.start({ screenshots: true, snapshots: true });
    const page = await context.newPage();

    await openWorkspaceRoute(
      page,
      `${workspace.baseUrl}/workspace/consequences?state=live`,
      "WorkspaceConsequencesRoute",
    );

    await tabUntil(
      page,
      async () =>
        await page.evaluate(() => {
          const active = document.activeElement as HTMLElement | null;
          return active?.closest("[data-testid='ConsequenceWorkbenchRow'][data-task-id='task-311']") != null;
        }),
      40,
      "the self-care consequence row",
    );
    await tabUntil(
      page,
      async () =>
        await page.evaluate(() => {
          const active = document.activeElement as HTMLElement | null;
          return active?.getAttribute("aria-label") === "Self-care confirmation draft";
        }),
      40,
      "the self-care confirmation draft",
    );
    await page.keyboard.type("Return sooner if cough becomes productive or overnight wheeze returns.");
    assertCondition(
      (await page.locator("[aria-label='Self-care confirmation draft']").inputValue()).includes(
        "overnight wheeze returns",
      ),
      "live self-care draft should remain editable",
    );

    await selectConsequenceRow(page, "task-507");
    assertCondition(
      (await page.locator("[data-testid='AdminDependencyPanel']").getAttribute("data-admin-dependency-state")) ===
        "blocked_pending_external_confirmation",
      "admin waiting case should expose the external confirmation blocker",
    );
    assertCondition(
      (await page.locator("[data-testid='AdminResolutionStage'] .staff-shell__inline-action").isDisabled()) === true,
      "waiting admin case should not allow completion while the blocker is active",
    );
    assertCondition(
      (await page.getByText("External confirmation is missing").count()) === 1,
      "dominant blocker should remain visible in the dependency panel",
    );

    await selectConsequenceRow(page, "task-208");
    assertCondition(
      (await page.locator("[data-testid='AdminResolutionStage']").getAttribute("data-admin-settlement")) ===
        "completed",
      "completed admin case should publish completed settlement",
    );
    assertCondition(
      (await page.getByText("admin_resolution_completion_artifact::task-208::document-issued").count()) === 1,
      "completed admin case should retain the typed completion artifact ref",
    );
    assertCondition(
      (await page.getByText("Patient preview aligns to boundary_tuple::task-208::admin-complete-v2").count()) === 1,
      "completed admin case should keep the patient expectation tuple visible",
    );

    await selectConsequenceRow(page, "task-118");
    const root = page.locator("[data-testid='WorkspaceShellRouteFamily']");
    await page.waitForFunction(
      () =>
        document
          .querySelector("[data-testid='WorkspaceShellRouteFamily']")
          ?.getAttribute("data-selected-anchor-ref") === "consequence-row-task-118",
    );
    const anchorBeforeReload = await root.getAttribute("data-selected-anchor-ref");
    await page.reload({ waitUntil: "networkidle" });
    await page.locator("[data-testid='WorkspaceConsequencesRoute']").waitFor();
    assertCondition(
      (await page.locator("[data-testid='ConsequenceWorkbenchRow'][data-task-id='task-118']").getAttribute(
        "data-selected",
      )) === "true",
      "reload should preserve the reopened consequence selection",
    );
    assertCondition(
      (await root.getAttribute("data-selected-anchor-ref")) === anchorBeforeReload,
      "reload should preserve the reopened consequence anchor",
    );
    assertCondition(
      (await page.locator("[data-testid='BoundaryDriftRecovery']").getAttribute("data-recovery-state")) ===
        "reopen_required",
      "reopened consequence should stay in same-shell recovery after reload",
    );

    await page.getByRole("button", { name: "Open task shell" }).click();
    await page.waitForURL(`${workspace.baseUrl}/workspace/task/task-118`);
    await page.goBack({ waitUntil: "networkidle" });
    await page.locator("[data-testid='WorkspaceConsequencesRoute']").waitFor();
    assertCondition(
      (await page.locator("[data-testid='SelfCareAdminDetailSurface']").getAttribute("data-boundary-mode")) ===
        "clinician_review_required",
      "back navigation should preserve the reopened boundary mode",
    );

    const stalePage = await context.newPage();
    await openWorkspaceRoute(
      stalePage,
      `${workspace.baseUrl}/workspace/consequences?state=stale`,
      "WorkspaceConsequencesRoute",
    );
    await selectConsequenceRow(stalePage, "task-311");
    assertCondition(
      (await stalePage.locator("[data-testid='SelfCareIssueStage']").getAttribute("data-stage-state")) ===
        "stale_recoverable",
      "stale self-care route should freeze into stale-recoverable posture",
    );
    assertCondition(
      (await stalePage.locator("[aria-label='Self-care confirmation draft']").evaluate(
        (node: HTMLTextAreaElement) => node.readOnly,
      )) === true,
      "stale self-care route should preserve but freeze the prior draft",
    );

    await takeBoundaryReopenTrace(context, "275-boundary-reopen-dependency-trace.zip");
  } finally {
    await browser.close();
    await stopClinicalWorkspace(workspace.child);
  }
}

if (process.argv.includes("--run")) {
  run().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
