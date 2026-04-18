import {
  assertCondition,
  assertPatientNoHorizontalOverflow,
  assertWorkspaceNoHorizontalOverflow,
  importPlaywright,
  openPatientConversationRoute,
  openStaffTaskRoute,
  openWorkspaceRoute,
  outputPath,
  startPatientWorkspacePair,
  stopPatientWorkspacePair,
  takeDecisionCycleTrace,
} from "./273_phase3_decision_cycle.helpers";

export const decisionCycleEndpointApprovalCoverage = [
  "keyboard-driven patient reply stays same-shell from answer to check to receipt",
  "keyboard-driven reviewer route transition enters the decision stage without replacing the shell",
  "keyboard-driven approver and escalation flows preserve governed stage changes",
  "stale approval remains frozen with replacement authority visible",
];

export async function run(): Promise<void> {
  const playwright = await importPlaywright();
  if (!playwright) {
    return;
  }

  const pair = await startPatientWorkspacePair();
  const browser = await playwright.chromium.launch({ headless: true });

  try {
    const context = await browser.newContext({
      viewport: { width: 1480, height: 1040 },
    });
    await context.tracing.start({ screenshots: true, snapshots: true });

    const patientPage = await context.newPage();
    const workspacePage = await context.newPage();

    await openPatientConversationRoute(
      patientPage,
      pair.patientBaseUrl,
      "request_211_a",
      "conversation_more_info",
      "state=live",
    );
    await patientPage.locator("[data-testid='PatientMoreInfoReplySurface']").waitFor();
    await patientPage.locator("#prompt_216_photo_timing").focus();
    await patientPage.keyboard.type("Tuesday midday in natural light");
    await patientPage.locator("input[name='prompt_216_symptom_change'][value='It looks worse']").focus();
    await patientPage.keyboard.press("Space");
    await patientPage.getByRole("button", { name: "Continue", exact: true }).focus();
    await patientPage.keyboard.press("Enter");
    await patientPage.locator("[data-testid='PatientMoreInfoCheckPanel']").waitFor();
    await patientPage.getByRole("button", { name: "Send reply", exact: true }).focus();
    await patientPage.keyboard.press("Enter");
    await patientPage.locator("[data-testid='PatientMoreInfoReceiptPanel']").waitFor();
    assertCondition(
      (await patientPage.locator("[data-testid='PatientConversationRoute']").getAttribute("data-route-anchor")) ===
        "more_info_receipt_panel",
      "keyboard-only patient reply flow did not promote the receipt anchor",
    );

    await openStaffTaskRoute(workspacePage, pair.workspaceBaseUrl, "task-311", "live");
    const shell = workspacePage.locator("[data-testid='WorkspaceShellRouteFamily']");
    const continuityKey = await shell.getAttribute("data-workspace-shell-continuity-key");
    await workspacePage.getByRole("button", { name: "Decision child route" }).focus();
    await workspacePage.keyboard.press("Enter");
    await workspacePage.waitForURL(`${pair.workspaceBaseUrl}/workspace/task/task-311/decision`);
    await workspacePage.locator("[data-testid='EndpointReasoningStage']").waitFor();
    assertCondition(
      (await shell.getAttribute("data-workspace-shell-continuity-key")) === continuityKey,
      "reviewer keyboard transition replaced the workspace continuity key",
    );
    assertCondition(
      (await workspacePage.locator("[data-testid='ConsequencePreviewSurface']").getAttribute("data-preview-state")) !==
        null,
      "decision stage lost the consequence preview state",
    );

    await openWorkspaceRoute(
      workspacePage,
      `${pair.workspaceBaseUrl}/workspace/approvals?state=live`,
      "WorkspaceApprovalsRoute",
    );
    await workspacePage
      .locator("[data-testid='ApprovalInboxRow'][data-task-id='task-208'] .staff-shell__approval-row-main")
      .focus();
    await workspacePage.keyboard.press("Enter");
    await workspacePage.waitForFunction(
      () =>
        document
          .querySelector("[data-testid='ApprovalInboxRow'][data-task-id='task-208']")
          ?.getAttribute("data-selected") === "true",
    );
    await workspacePage.getByRole("button", { name: "Open full task shell" }).focus();
    await workspacePage.keyboard.press("Enter");
    await workspacePage.waitForURL(`${pair.workspaceBaseUrl}/workspace/task/task-208`);
    await workspacePage.locator("[data-testid='WorkspaceTaskRoute']").waitFor();

    await openWorkspaceRoute(
      workspacePage,
      `${pair.workspaceBaseUrl}/workspace/approvals?state=stale`,
      "WorkspaceApprovalsRoute",
    );
    // SELF_APPROVAL_BLOCKED and APPROVER_ROLE_REQUIRED are enforced by the service suite.
    // This browser spec proves the matching frozen approval posture stays visible in the same shell.
    await workspacePage.locator("[data-testid='ApprovalReviewStage']").waitFor();
    assertCondition(
      (await workspacePage.locator("[data-testid='ApprovalReviewStage']").getAttribute("data-approval-state")) ===
        "superseded",
      "stale approval route did not publish superseded posture",
    );
    assertCondition(
      await workspacePage
        .getByRole("button", { name: "Review the replacement approval authority" })
        .isDisabled(),
      "stale approval action should stay disabled",
    );

    await openWorkspaceRoute(
      workspacePage,
      `${pair.workspaceBaseUrl}/workspace/escalations?state=live`,
      "WorkspaceEscalationsRoute",
    );
    await workspacePage
      .locator("[data-testid='EscalationInboxRow'][data-task-id='task-507'] .staff-shell__escalation-row-main")
      .focus();
    await workspacePage.keyboard.press("Enter");
    await workspacePage.waitForFunction(
      () =>
        document.querySelector("[data-testid='EscalationCommandSurface']")?.getAttribute("data-escalation-state") ===
        "handoff_pending",
    );
    await workspacePage.getByRole("button", { name: "Downstream handoff" }).focus();
    await workspacePage.keyboard.press("Enter");
    assertCondition(
      (await workspacePage.locator("[data-testid='EscalationOutcomeRecorder']").getAttribute("data-selected-outcome")) ===
        "downstream_handoff",
      "keyboard-only escalation outcome selection drifted",
    );

    await assertPatientNoHorizontalOverflow(patientPage, "273 patient keyboard flow");
    await assertWorkspaceNoHorizontalOverflow(workspacePage, "273 reviewer and approver keyboard flow");
    await workspacePage.screenshot({
      path: outputPath("273-endpoint-and-approval-desktop.png"),
      fullPage: true,
    });

    await takeDecisionCycleTrace(context, "273-endpoint-and-approval-trace.zip");
  } finally {
    await browser.close();
    await stopPatientWorkspacePair(pair);
  }
}

if (process.argv.includes("--run")) {
  run().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
