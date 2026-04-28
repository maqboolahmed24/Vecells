import {
  assertCondition,
  assertNoHorizontalOverflow,
  importPlaywright,
  openWorkspaceRoute,
  startClinicalWorkspace,
  stopClinicalWorkspace,
  trackExternalRequests,
} from "./255_workspace_shell_helpers";

export const selfCareAdminCoverage = [
  "self-care selection stays same-shell and tuple-bound",
  "admin waiting keeps dependency blockers dominant",
  "completed bounded admin stays in-shell with its completion artifact",
  "reopened boundary freezes consequence mutation while preserving visible context",
];

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
    const page = await browser.newPage({ viewport: { width: 1480, height: 1080 } });
    const externalRequests = new Set<string>();
    trackExternalRequests(page, baseUrl, externalRequests);

    await openWorkspaceRoute(page, `${baseUrl}/workspace/consequences?state=live`, "WorkspaceConsequencesRoute");
    const route = page.locator("[data-testid='SelfCareAdminViewsRoute']");
    await route.waitFor();
    assertCondition(
      (await route.getAttribute("data-design-mode")) === "Bounded_Consequence_Studio",
      "consequence route should publish the bounded consequence studio mode",
    );

    await selectConsequenceRow(page, "task-311");
    const detail = page.locator("[data-testid='SelfCareAdminDetailSurface']");
    assertCondition(new URL(page.url()).pathname === "/workspace/consequences", "row selection should stay in the same shell route");
    assertCondition(
      (await detail.getAttribute("data-boundary-mode")) === "self_care",
      "task-311 should stay in self-care boundary mode",
    );
    assertCondition(
      (await detail.getAttribute("data-advice-settlement")) === "renderable",
      "task-311 should remain renderable self-care advice",
    );
    await page.locator("[aria-label='Self-care confirmation draft']").fill(
      "Escalate earlier if overnight symptoms return or inhaler demand increases.",
    );
    assertCondition(
      ((await page.locator("[aria-label='Self-care confirmation draft']").inputValue()).includes("overnight symptoms")),
      "self-care draft should be editable while the tuple is live",
    );

    await selectConsequenceRow(page, "task-507");
    assertCondition(
      (await detail.getAttribute("data-boundary-mode")) === "admin_resolution",
      "task-507 should resolve to bounded admin mode",
    );
    assertCondition(
      (await detail.getAttribute("data-admin-dependency-state")) === "blocked_pending_external_confirmation",
      "task-507 should expose the dominant admin dependency blocker",
    );
    assertCondition(
      (await page.locator("[data-testid='AdminResolutionStage']").getAttribute("data-admin-settlement")) ===
        "waiting_dependency",
      "task-507 should stay in waiting dependency posture",
    );
    assertCondition(
      (await page.getByText("External confirmation is missing").count()) === 1,
      "dominant blocker should stay visible in the admin dependency panel",
    );
    assertCondition(
      (await page.locator("[data-testid='AdminResolutionStage'] .staff-shell__inline-action").isDisabled()) === true,
      "admin completion control should stay frozen while the blocker is active",
    );

    await selectConsequenceRow(page, "task-208");
    assertCondition(
      (await detail.getAttribute("data-admin-settlement")) === "completed",
      "task-208 should expose completed admin settlement",
    );
    assertCondition(
      (await page.getByText("Document issued").count()) >= 1,
      "completed admin route should keep its completion artifact visible in-shell",
    );
    assertCondition(
      (await page.getByText("The patient sees a completion update tied to the issued document.").count()) === 1,
      "patient expectation preview should stay tuple-aligned for completed admin work",
    );

    await selectConsequenceRow(page, "task-118");
    assertCondition(
      (await detail.getAttribute("data-boundary-mode")) === "clinician_review_required",
      "task-118 should reopen into clinician review required posture",
    );
    assertCondition(
      (await page.locator("[data-testid='BoundaryDriftRecovery']").getAttribute("data-recovery-state")) ===
        "reopen_required",
      "reopened boundary should promote same-shell recovery guidance",
    );
    assertCondition(
      (await page.locator("[data-testid='AdminResolutionStage'] .staff-shell__inline-action").isDisabled()) === true,
      "reopened admin posture should freeze fresh consequence mutation",
    );
    assertCondition(
      (await page.getByText("The patient view falls back to recovery-safe wording.").count()) === 1,
      "patient preview should freeze with recovery-safe wording under reopened boundary drift",
    );

    await assertNoHorizontalOverflow(page, "265 self-care admin consequence desktop");
    assertCondition(externalRequests.size === 0, `unexpected external requests: ${Array.from(externalRequests).join(", ")}`);
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
