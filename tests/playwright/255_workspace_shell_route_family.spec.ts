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

export const workspaceShellRouteFamilyCoverage = [
  "home route shell markers",
  "nav rail keyboard route switch",
  "queue-to-task same-shell transition",
  "task-to-child-route same-shell continuity",
  "peer-route task launch from approvals",
  "desktop overflow and external-request assertions",
];

export async function run(): Promise<void> {
  const playwright = await importPlaywright();
  if (!playwright) {
    return;
  }

  const { child, baseUrl } = await startClinicalWorkspace();
  const browser = await playwright.chromium.launch({ headless: true });

  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1080 } });
    const externalRequests = new Set<string>();
    trackExternalRequests(page, baseUrl, externalRequests);

    await openWorkspaceRoute(page, `${baseUrl}/workspace`, "WorkspaceHomeRoute");
    const root = page.locator("[data-testid='WorkspaceShellRouteFamily']");
    assertCondition((await root.getAttribute("data-shell-type")) === "staff", "root shell type drifted");
    assertCondition(
      (await root.getAttribute("data-design-mode")) === "Quiet_Clinical_Mission_Control",
      "design mode drifted",
    );
    assertCondition(
      (await root.getAttribute("data-route-family")) === "rf_staff_workspace",
      "home route family drifted",
    );

    await openWorkspaceRoute(page, `${baseUrl}/workspace`, "WorkspaceHomeRoute");
    const approvalsNav = page.getByRole("button", { name: "Approvals" }).first();
    await approvalsNav.focus();
    await page.keyboard.press("Enter");
    await page.waitForURL(`${baseUrl}/workspace/approvals`);
    await page.locator("[data-testid='WorkspaceApprovalsRoute']").waitFor();

    await openWorkspaceRoute(page, `${baseUrl}/workspace/queue/recommended`, "WorkspaceQueueRoute");
    const queueTarget = page.locator(".staff-shell__queue-row-main").first();
    const queueTargetTaskId = await queueTarget.getAttribute("data-task-id");
    assertCondition(Boolean(queueTargetTaskId), "queue target task id missing");
    await page.locator(".staff-shell__queue-open-button").first().click();
    await page.waitForURL(`${baseUrl}/workspace/task/${queueTargetTaskId}`);
    await page.locator("[data-testid='task-canvas-frame']").waitFor();
    const openedTaskId = queueTargetTaskId!;
    const shellKey = await root.getAttribute("data-workspace-shell-continuity-key");
    const selectedAnchor = await root.getAttribute("data-selected-anchor-ref");
    assertCondition(Boolean(shellKey), "workspace continuity key missing on task route");
    assertCondition(Boolean(selectedAnchor), "selected anchor marker missing on task route");

    await page.getByRole("button", { name: "More-info child route" }).click();
    await page.waitForURL(`${baseUrl}/workspace/task/${openedTaskId}/more-info`);
    await page.locator("[data-testid='WorkspaceMoreInfoChildRoute']").waitFor();
    assertCondition(
      (await root.getAttribute("data-workspace-shell-continuity-key")) === shellKey,
      "more-info child route replaced the shell continuity key",
    );
    assertCondition(
      (await root.getAttribute("data-anchor-posture")) === "child_route_protected_anchor",
      "more-info child anchor posture drifted",
    );

    await page.getByRole("button", { name: "Decision child route" }).click();
    await page.waitForURL(`${baseUrl}/workspace/task/${openedTaskId}/decision`);
    await page.locator("[data-testid='WorkspaceDecisionChildRoute']").waitFor();
    assertCondition(
      (await root.getAttribute("data-workspace-shell-continuity-key")) === shellKey,
      "decision child route replaced the shell continuity key",
    );

    await page.getByRole("button", { name: "Approvals", exact: true }).first().click();
    await page.waitForURL(`${baseUrl}/workspace/approvals`);
    await page.locator("[data-testid='WorkspaceApprovalsRoute']").waitFor();
    await page.locator("[data-testid='ApprovalInboxRow'][data-task-id='task-208']").waitFor();
    await page
      .locator("[data-testid='ApprovalInboxRow'][data-task-id='task-208']")
      .getByRole("button", { name: "Open task shell" })
      .click();
    await page.waitForURL(`${baseUrl}/workspace/task/task-208`);
    await page.locator("[data-testid='task-canvas-frame']").waitFor();

    await assertNoHorizontalOverflow(page, "255 workspace shell desktop");
    assertCondition(externalRequests.size === 0, `unexpected external requests: ${Array.from(externalRequests).join(", ")}`);

    await page.screenshot({ path: outputPath("255-workspace-shell-route-family.png"), fullPage: true });
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
