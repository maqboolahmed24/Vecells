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
    const root = page.locator("[data-testid='WorkspaceShellRouteFamily']");
    const preview = page.locator("[data-testid='queue-preview-pocket']");

    await openWorkspaceRoute(page, `${baseUrl}/workspace/queue/recommended?state=live`, "WorkspaceQueueRoute");
    await selectQueueRow(page, "task-311");
    assertCondition(
      (await preview.textContent())?.includes("Open self-care stage") === true,
      "task-311 queue preview should expose the self-care launch",
    );
    assertCondition(
      (await preview.textContent())?.includes("No patient expectation digest") !== true,
      "task-311 queue preview should still expose a merged patient expectation digest",
    );
    await preview.getByRole("button", { name: "Open self-care stage" }).click();
    await page.waitForURL((url: URL) => url.pathname === "/workspace/consequences");
    await page.locator("[data-testid='WorkspaceConsequencesRoute']").waitFor();
    assertCondition(
      (await page.locator("[data-testid='ConsequenceWorkbenchRow'][data-task-id='task-311']").getAttribute("data-selected")) ===
        "true",
      "self-care launch should preserve the selected task inside the consequence route",
    );
    const selfCareDetail = page.locator("[data-testid='SelfCareAdminDetailSurface']");
    assertCondition(
      (await selfCareDetail.getAttribute("data-boundary-mode")) === "self_care",
      "task-311 should land in self-care boundary mode",
    );
    assertCondition(
      (await selfCareDetail.getAttribute("data-advice-settlement")) === "renderable",
      "task-311 should keep renderable self-care settlement",
    );
    assertCondition(
      (await root.getAttribute("data-selected-anchor-ref")) === "consequence-detail-task-311",
      "self-care launch should preserve the routed consequence anchor",
    );

    await openWorkspaceRoute(page, `${baseUrl}/workspace/queue/callback-follow-up?state=live`, "WorkspaceQueueRoute");
    await selectQueueRow(page, "task-412");
    assertCondition(
      (await preview.textContent())?.includes("Open callback repair") === true,
      "task-412 queue preview should expose callback repair as the dominant launch",
    );
    assertCondition(
      (await root.getAttribute("data-selected-anchor-ref")) === "queue-row-task-412",
      "queue selection should preserve the callback-follow-up anchor before launch",
    );
    await preview.getByRole("button", { name: "Open callback repair" }).click();
    await page.waitForURL((url: URL) => url.pathname === "/workspace/callbacks");
    await page.locator("[data-testid='WorkspaceCallbacksRoute']").waitFor();
    await selectCallbackRow(page, "task-412");
    const callbackDetail = page.locator("[data-testid='CallbackDetailSurface']");
    assertCondition(
      (await callbackDetail.getAttribute("data-stage")) === "repair",
      "callback repair launch should enter the repair stage in-place",
    );
    assertCondition(
      (await callbackDetail.getAttribute("data-route-health")) === "repair_required",
      "callback repair launch should preserve the repair-required route state",
    );
    assertCondition(
      (await root.getAttribute("data-selected-anchor-ref")) === "callback-repair-task-412",
      "callback repair launch should preserve the routed repair anchor",
    );
    assertCondition(
      (await page.locator("[data-testid='CallbackRouteRepairPrompt']").count()) >= 1,
      "callback repair launch should keep the route repair prompt visible",
    );

    await openWorkspaceRoute(page, `${baseUrl}/workspace/queue/pharmacy-watch?state=live`, "WorkspaceQueueRoute");
    await selectQueueRow(page, "task-507");
    assertCondition(
      (await preview.textContent())?.includes("Open bounded admin stage") === true,
      "task-507 queue preview should expose bounded admin as the dominant launch",
    );
    assertCondition(
      (await preview.textContent())?.includes(
        "patient_expectation_template::admin-waiting::medication-v2",
      ) === true,
      "task-507 queue preview should keep the admin patient expectation digest visible",
    );
    await preview.getByRole("button", { name: "Open bounded admin stage" }).click();
    await page.waitForURL((url: URL) => url.pathname === "/workspace/consequences");
    await page.locator("[data-testid='WorkspaceConsequencesRoute']").waitFor();
    await selectConsequenceRow(page, "task-507");
    const adminDetail = page.locator("[data-testid='SelfCareAdminDetailSurface']");
    assertCondition(
      (await adminDetail.getAttribute("data-boundary-mode")) === "admin_resolution",
      "task-507 should land in bounded admin mode",
    );
    assertCondition(
      (await adminDetail.getAttribute("data-admin-dependency-state")) === "blocked_pending_external_confirmation",
      "task-507 should preserve the dominant admin dependency state",
    );
    assertCondition(
      (await adminDetail.getAttribute("data-admin-settlement")) === "waiting_dependency",
      "task-507 should preserve waiting dependency settlement",
    );
    assertCondition(
      (await root.getAttribute("data-selected-anchor-ref")) === "consequence-detail-task-507",
      "bounded admin launch should preserve the routed consequence anchor",
    );

    await page.getByRole("button", { name: "Open task shell" }).click();
    await page.waitForURL((url: URL) => url.pathname === "/workspace/task/task-507");
    await page.locator("[data-testid='WorkspaceTaskRoute']").waitFor();
    assertCondition(
      (await page.locator("[data-testid='CompletionContinuityStage']").getAttribute("data-stage-state")) ===
        "pending_settlement",
      "task-507 completion continuity should stay provisional while admin waiting is active",
    );
    assertCondition(
      (await page.locator("[data-testid='NextTaskPostureCard']").getAttribute("data-next-task-state")) !== "ready",
      "task-507 next-task posture must stay non-authoritative until the admin settlement chain calms",
    );
    assertCondition(
      (await page.locator("[data-testid='NextTaskPostureCard']").getAttribute("data-auto-advance")) === "forbidden",
      "task-507 next-task posture must keep auto-advance forbidden while the admin chain is unsettled",
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
