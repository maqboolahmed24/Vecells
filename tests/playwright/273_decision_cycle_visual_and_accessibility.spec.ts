import fs from "node:fs";

import {
  assertCondition,
  assertPatientNoHorizontalOverflow,
  assertWorkspaceNoHorizontalOverflow,
  importPlaywright,
  openDecisionCycleScenario,
  openPatientConversationRoute,
  openStaffTaskRoute,
  openWorkspaceRoute,
  outputPath,
  readAttributes,
  startDecisionCycleLabServer,
  startPatientWorkspacePair,
  stopDecisionCycleLabServer,
  stopPatientWorkspacePair,
  takeDecisionCycleTrace,
} from "./273_phase3_decision_cycle.helpers";

export async function run(): Promise<void> {
  const playwright = await importPlaywright();
  if (!playwright) {
    return;
  }

  const lab = await startDecisionCycleLabServer();
  const pair = await startPatientWorkspacePair();
  const browser = await playwright.chromium.launch({ headless: true });

  try {
    const desktopContext = await browser.newContext({
      viewport: { width: 1500, height: 1080 },
    });
    await desktopContext.tracing.start({ screenshots: true, snapshots: true });
    const desktop = await desktopContext.newPage();

    for (const [scenarioId, fileName] of [
      ["active_checkpoint", "273-active-checkpoint.png"],
      ["late_review", "273-late-review.png"],
      ["expired_window", "273-expired-window.png"],
      ["superseded_cycle", "273-superseded-cycle.png"],
      ["blocked_repair", "273-blocked-repair.png"],
      ["approval_required", "273-approval-required.png"],
      ["urgent_escalation", "273-urgent-escalation.png"],
    ] as const) {
      await openDecisionCycleScenario(desktop, lab.atlasUrl, scenarioId);
      const labRoot = desktop.locator("[data-testid='DecisionCycleAssuranceLab']");
      assertCondition(
        (await labRoot.getAttribute("data-selected-scenario-id")) === scenarioId,
        `decision cycle lab failed to select ${scenarioId}`,
      );
      await desktop.screenshot({ path: outputPath(fileName), fullPage: true });
    }

    const mobileContext = await browser.newContext({
      viewport: { width: 412, height: 915 },
      reducedMotion: "reduce",
    });
    await mobileContext.tracing.start({ screenshots: true, snapshots: true });
    const mobile = await mobileContext.newPage();
    await openDecisionCycleScenario(mobile, lab.atlasUrl, "urgent_escalation");
    await mobile.screenshot({
      path: outputPath("273-decision-cycle-mobile-reduced.png"),
      fullPage: true,
    });

    const patientContext = await browser.newContext({
      viewport: { width: 1440, height: 980 },
    });
    const patientPage = await patientContext.newPage();
    const workspacePage = await patientContext.newPage();
    const approvalPage = await patientContext.newPage();

    await openPatientConversationRoute(
      patientPage,
      pair.patientBaseUrl,
      "request_211_a",
      "conversation_more_info",
      "state=live",
    );
    await openStaffTaskRoute(workspacePage, pair.workspaceBaseUrl, "task-311", "live");
    await workspacePage.getByRole("button", { name: "Decision child route" }).click();
    await workspacePage.waitForURL(`${pair.workspaceBaseUrl}/workspace/task/task-311/decision`);
    await workspacePage.locator("[data-testid='EndpointReasoningStage']").waitFor();
    await openWorkspaceRoute(
      approvalPage,
      `${pair.workspaceBaseUrl}/workspace/approvals?state=live`,
      "WorkspaceApprovalsRoute",
    );

    const ariaSnapshots = {
      patientReplyState: {
        route: await readAttributes(patientPage.locator("[data-testid='PatientConversationRoute']"), [
          "data-patient-conversation-state",
          "data-reply-window-checkpoint",
          "data-more-info-cycle-ref",
          "data-dominant-patient-action",
        ]),
        surface: await readAttributes(patientPage.locator("[data-testid='PatientMoreInfoReplySurface']"), [
          "data-anchor-ref",
        ]),
      },
      endpointAuthorityRail: {
        stage: await readAttributes(workspacePage.locator("[data-testid='EndpointReasoningStage']"), [
          "data-stage-state",
        ]),
        preview: await readAttributes(workspacePage.locator("[data-testid='ConsequencePreviewSurface']"), [
          "data-preview-state",
        ]),
      },
      approvalStage: {
        review: await readAttributes(approvalPage.locator("[data-testid='ApprovalReviewStage']"), [
          "data-approval-state",
          "data-decision-epoch",
        ]),
        summary: await readAttributes(approvalPage.locator("[data-testid='ApprovalAuthoritySummary']"), [
          "data-approval-role",
          "data-approval-state",
        ]),
      },
    };

    fs.writeFileSync(
      outputPath("273-decision-cycle-aria-snapshots.json"),
      JSON.stringify(ariaSnapshots, null, 2),
    );

    await assertPatientNoHorizontalOverflow(patientPage, "273 patient reply accessibility");
    await assertWorkspaceNoHorizontalOverflow(workspacePage, "273 endpoint authority accessibility");
    await assertWorkspaceNoHorizontalOverflow(approvalPage, "273 approval accessibility");

    await takeDecisionCycleTrace(desktopContext, "273-decision-cycle-visual-trace.zip");
    await takeDecisionCycleTrace(mobileContext, "273-decision-cycle-mobile-trace.zip");
  } finally {
    await browser.close();
    await stopDecisionCycleLabServer(lab.server);
    await stopPatientWorkspacePair(pair);
  }
}

if (process.argv.includes("--run")) {
  run().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
