import {
  assertCondition,
  assertNoHorizontalOverflow,
  importPlaywright,
  openWorkspaceRoute,
  startClinicalWorkspace,
  stopClinicalWorkspace,
  trackExternalRequests,
} from "./255_workspace_shell_helpers";

export const callbackWorkbenchCoverage = [
  "callback row selection updates the detail plane without leaving the callback route",
  "initiate attempt fences the UI to one live attempt record and disables duplicate triggers",
  "route repair dominates when callback promise drift makes the route unsafe",
  "answered, no-answer, and voicemail flows stay locked until the required evidence set is complete",
];

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
    const page = await browser.newPage({ viewport: { width: 1480, height: 1080 } });
    const externalRequests = new Set<string>();
    trackExternalRequests(page, baseUrl, externalRequests);

    await openWorkspaceRoute(page, `${baseUrl}/workspace/callbacks?state=live`, "WorkspaceCallbacksRoute");
    const callbackRoute = page.locator("[data-testid='CallbackWorklistRoute']");
    await callbackRoute.waitFor();
    assertCondition(
      (await callbackRoute.getAttribute("data-design-mode")) === "Callback_Operations_Deck",
      "callback route should publish the callback operations deck mode",
    );

    const filterGroup = page.locator(".staff-shell__callback-filter-group");
    await filterGroup.getByRole("button", { name: "Ready to attempt", exact: true }).click();
    assertCondition(
      (await page.locator("[data-testid='CallbackWorklistRow']").count()) === 1,
      "ready-to-attempt filter should narrow the worklist to the live-ready callback",
    );
    await filterGroup.getByRole("button", { name: "All", exact: true }).click();
    await page.locator(".staff-shell__search-field input").fill("Maya");
    assertCondition(
      (await page.locator("[data-testid='CallbackWorklistRow']").count()) === 1,
      "search should filter the callback worklist by patient or summary text",
    );
    await page.locator(".staff-shell__search-field input").fill("");

    await selectCallbackRow(page, "task-311");
    assertCondition(
      new URL(page.url()).pathname === "/workspace/callbacks",
      "callback row selection should stay inside the same shell route",
    );
    assertCondition(
      (await page.locator("[data-testid='CallbackDetailSurface']").getAttribute("data-callback-state")) === "scheduled",
      "task-311 should expose the scheduled callback state",
    );

    const initiateAttempt = page.getByRole("button", { name: "Initiate governed attempt" });
    await initiateAttempt.click();
    assertCondition(
      (await callbackRoute.getAttribute("data-attempt-state")) === "outcome_pending",
      "live attempt creation should lift the route into outcome-pending posture",
    );
    assertCondition(
      (await page.locator("[data-testid='CallbackDetailSurface']").getAttribute("data-dedupe-state")) ===
        "current_attempt_active",
      "detail surface should publish the active dedupe posture once an attempt starts",
    );
    assertCondition(await initiateAttempt.isDisabled(), "duplicate attempt trigger should disable once live");
    assertCondition(
      (await page.locator("[data-testid='CallbackAttemptTimeline'] li").count()) === 1,
      "task-311 should show exactly one live attempt entry after initiation",
    );

    const answeredRecord = page.getByRole("button", { name: "Record answered outcome" });
    assertCondition(await answeredRecord.isDisabled(), "answered outcome should start locked");
    for (const label of [
      "Route evidence confirmed",
      "Provider disposition recorded",
      "Patient acknowledgement captured",
      "Safety classification confirmed",
    ]) {
      await page.getByLabel(label).check();
    }
    assertCondition(!(await answeredRecord.isDisabled()), "answered outcome should unlock once all evidence is present");

    await selectCallbackRow(page, "task-412");
    assertCondition(
      (await page.locator("[data-testid='CallbackDetailSurface']").getAttribute("data-route-health")) === "repair_required",
      "task-412 should promote route repair as the dominant callback posture",
    );
    assertCondition(
      ((await page.locator("[data-testid='CallbackExpectationCard']").textContent()) || "").includes(
        "rechecking the safest contact route",
      ),
      "repair-dominant callback should revoke stale promise wording in the expectation card",
    );
    assertCondition(
      (await page.locator("[data-testid='CallbackOutcomeCapture']").getAttribute("data-stage-state")) ===
        "repair_required",
      "repair-dominant callback should freeze the outcome stage into repair-required posture",
    );
    assertCondition(
      await page.getByRole("button", { name: "Record answered outcome" }).isDisabled(),
      "repair-dominant callback must not allow a terminal record action",
    );

    await selectCallbackRow(page, "task-118");
    const outcomeCapture = page.locator("[data-testid='CallbackOutcomeCapture']");
    await outcomeCapture.getByRole("button", { name: "No answer" }).click();
    const noAnswerRecord = page.getByRole("button", { name: "Record no answer outcome" });
    assertCondition(await noAnswerRecord.isDisabled(), "no-answer flow should start locked");
    await page.getByLabel("Route evidence confirmed").check();
    assertCondition(await noAnswerRecord.isDisabled(), "no-answer should still wait for provider disposition");
    await page.getByLabel("Provider disposition recorded").check();
    assertCondition(!(await noAnswerRecord.isDisabled()), "no-answer should unlock after both required evidence checks");

    await selectCallbackRow(page, "task-208");
    await outcomeCapture.getByRole("button", { name: "Voicemail left" }).click();
    const voicemailRecord = page.getByRole("button", { name: "Record voicemail left outcome" });
    assertCondition(await voicemailRecord.isDisabled(), "voicemail should start locked");
    for (const label of [
      "Route evidence confirmed",
      "Provider disposition recorded",
      "Voicemail policy checked",
    ]) {
      await page.getByLabel(label).check();
    }
    assertCondition(!(await voicemailRecord.isDisabled()), "voicemail should unlock only after the full evidence bundle");

    await assertNoHorizontalOverflow(page, "263 callback workbench desktop");
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
