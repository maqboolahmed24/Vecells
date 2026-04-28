import {
  assertCondition,
  assertNoHorizontalOverflow,
  importPlaywright,
  openWorkspaceRoute,
  startClinicalWorkspace,
  stopClinicalWorkspace,
  trackExternalRequests,
} from "./255_workspace_shell_helpers";

export const changedReviewResumeCoverage = [
  "changed route renders delta-first lane with authoritative DOM markers",
  "changed-region marker jumps stay in the same shell and update the selected anchor",
  "consequential changed work can redirect into urgent handoff review instead of routine resume",
  "contextual changed work stays diff-first without recommit gating",
];

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

    await openWorkspaceRoute(page, `${baseUrl}/workspace/changed?state=live`, "WorkspaceChangedRoute");
    const root = page.locator("[data-testid='WorkspaceShellRouteFamily']");
    assertCondition(
      (await root.getAttribute("data-design-mode")) === "Delta_Reentry_Compass",
      "changed route should switch to the Delta_Reentry_Compass mode",
    );
    assertCondition(
      (await root.getAttribute("data-shell-type")) === "staff",
      "workspace shell type drifted",
    );
    assertCondition(
      (await root.getAttribute("data-route-family")) === "rf_staff_workspace_child",
      "changed route family drifted",
    );

    const changedRoute = page.locator("[data-testid='ChangedWorkRoute']");
    await changedRoute.waitFor();
    assertCondition(
      (await changedRoute.getAttribute("data-delta-class")) === "decisive",
      "changed route should default to the decisive returned-evidence task",
    );
    assertCondition(
      (await changedRoute.getAttribute("data-recommit-required")) === "true",
      "decisive default task should require recommit",
    );

    await page.locator("[data-testid='InlineChangedRegionMarkers'] .staff-shell__changed-marker").nth(0).click();
    const selectedAnchor = await page.locator("[data-testid='DeltaFirstResumeShell']").getAttribute("data-selected-anchor-ref");
    assertCondition(
      selectedAnchor?.includes("changed-region-task-311-pharmacy::field-1") ?? false,
      "changed-region marker jump did not update the selected anchor in place",
    );

    await page.getByRole("button", { name: "Urgent impact" }).click();
    await page.locator("[data-testid='ChangedWorkRow'][data-task-id='task-412'] .staff-shell__changed-row-main").click();
    await page.waitForFunction(() =>
      document.querySelector("[data-testid='ChangedWorkRoute']")?.getAttribute("data-delta-class") === "consequential",
    );
    assertCondition(
      (await page.locator("[data-testid='ChangedWorkRoute']").getAttribute("data-delta-class")) === "consequential",
      "selecting the reachability-drift row should update the changed route in place",
    );
    await page.locator("[data-testid='ChangedWorkRow'][data-task-id='task-412']").getByRole("button", { name: "Open task shell" }).click();
    await page.waitForURL(`${baseUrl}/workspace/task/task-412`);
    await page.locator("[data-testid='WorkspaceTaskRoute']").waitFor();
    assertCondition(
      (await page.locator("[data-testid='ActiveTaskShell']").getAttribute("data-opening-mode")) === "handoff_review",
      "consequential urgent drift should redirect to handoff review instead of routine resume",
    );

    await openWorkspaceRoute(page, `${baseUrl}/workspace/changed?state=live`, "WorkspaceChangedRoute");
    await page.getByRole("button", { name: "Contextual or clerical" }).click();
    await page.locator("[data-testid='ChangedWorkRow'][data-task-id='task-118'] .staff-shell__changed-row-main").click();
    await page.waitForFunction(() =>
      document.querySelector("[data-testid='ChangedWorkRoute']")?.getAttribute("data-delta-class") === "contextual",
    );
    assertCondition(
      (await page.locator("[data-testid='ChangedWorkRoute']").getAttribute("data-recommit-required")) === "false",
      "contextual reopen should not publish recommit-required gating",
    );
    assertCondition(
      (await page.locator("[data-testid='ChangedWorkRoute']").getAttribute("data-resume-state")) === "diff_first",
      "contextual reopen should stay diff-first",
    );

    await assertNoHorizontalOverflow(page, "261 changed review desktop");
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
