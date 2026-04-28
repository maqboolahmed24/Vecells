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

export const approvalEscalationCoverage = [
  "approval inbox renders current checkpoint, authority summary, and open-task path",
  "stale approval freezes commit posture and exposes replacement authority",
  "escalation lane selection updates the promoted urgent stage in place",
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

    await openWorkspaceRoute(page, `${baseUrl}/workspace/approvals?state=live`, "WorkspaceApprovalsRoute");
    const root = page.locator("[data-testid='WorkspaceShellRouteFamily']");
    assertCondition(
      (await root.getAttribute("data-design-mode")) === "Quiet_Escalation_Control_Room",
      "approval route should switch the shell into the control-room design mode",
    );
    const approvalRoute = page.locator("[data-testid='ApprovalInboxRoute']");
    await approvalRoute.waitFor();
    assertCondition(
      (await page.locator("[data-testid='ApprovalReviewStage']").getAttribute("data-approval-state")) === "pending",
      "approval review stage should begin in pending posture",
    );
    assertCondition(
      (await page.locator("[data-testid='ApprovalAuthoritySummary']").getAttribute("data-approval-role")) ===
        "Clinical access reviewer",
      "approval authority role drifted",
    );
    await page
      .locator("[data-testid='ApprovalInboxRow'][data-task-id='task-208']")
      .getByRole("button", { name: "Open task shell" })
      .click();
    await page.waitForURL(`${baseUrl}/workspace/task/task-208`);
    await page.locator("[data-testid='WorkspaceTaskRoute']").waitFor();

    await openWorkspaceRoute(page, `${baseUrl}/workspace/approvals?state=stale`, "WorkspaceApprovalsRoute");
    await page.locator("[data-testid='ApprovalReviewStage']").waitFor();
    assertCondition(
      (await page.locator("[data-testid='ApprovalReviewStage']").getAttribute("data-approval-state")) === "superseded",
      "stale approval should expose superseded posture",
    );
    assertCondition(
      ((await page.locator("[data-testid='ApprovalAuthoritySummary']").textContent()) || "").includes(
        "approval_checkpoint::task-208::replacement",
      ),
      "replacement authority should stay visible under stale approval posture",
    );
    assertCondition(
      await page.getByRole("button", { name: "Review the replacement approval authority" }).isDisabled(),
      "stale approval action should stay frozen",
    );

    await openWorkspaceRoute(page, `${baseUrl}/workspace/escalations?state=live`, "WorkspaceEscalationsRoute");
    const escalationRoute = page.locator("[data-testid='EscalationWorkspaceRoute']");
    await escalationRoute.waitFor();
    assertCondition(
      (await escalationRoute.getAttribute("data-urgent-stage")) === "active",
      "escalation route should promote the urgent stage",
    );
    assertCondition(
      (await page.locator("[data-testid='UrgentContactTimeline'] li").count()) >= 3,
      "urgent contact timeline should expose the visible attempt ladder",
    );
    await page.locator("[data-testid='EscalationInboxRow'][data-task-id='task-507'] .staff-shell__escalation-row-main").click();
    await page.waitForFunction(() =>
      document.querySelector("[data-testid='EscalationCommandSurface']")?.getAttribute("data-escalation-state") ===
      "handoff_pending",
    );
    assertCondition(
      (await page.locator("[data-testid='EscalationCommandSurface']").getAttribute("data-escalation-state")) ===
        "handoff_pending",
      "selecting the blocked escalation row should update the promoted stage in place",
    );
    await page.getByRole("button", { name: "Downstream handoff" }).click();
    assertCondition(
      (await page.locator("[data-testid='EscalationOutcomeRecorder']").getAttribute("data-selected-outcome")) ===
        "downstream_handoff",
      "escalation outcome recorder did not track the selected governed outcome",
    );

    await assertNoHorizontalOverflow(page, "260 approval escalation desktop");
    assertCondition(externalRequests.size === 0, `unexpected external requests: ${Array.from(externalRequests).join(", ")}`);
    await page.screenshot({ path: outputPath("260-approval-escalation-desktop.png"), fullPage: true });
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
