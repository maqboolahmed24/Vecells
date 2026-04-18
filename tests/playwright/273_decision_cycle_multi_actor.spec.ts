import {
  assertCondition,
  assertPatientNoHorizontalOverflow,
  assertWorkspaceNoHorizontalOverflow,
  importPlaywright,
  openPatientConversationRoute,
  openStaffMoreInfoRoute,
  openWorkspaceRoute,
  readAttributes,
  startPatientWorkspacePair,
  stopPatientWorkspacePair,
  takeDecisionCycleTrace,
} from "./273_phase3_decision_cycle.helpers";

export const decisionCycleMultiActorCoverage = [
  "patient and reviewer more-info surfaces publish the same bundle, cycle, checkpoint, and lineage refs",
  "expired patient reply posture stays in the same shell instead of redirecting away",
  "reviewer more-info to decision navigation preserves the same workspace continuity key",
  "approver route keeps approval truth visible alongside the same task shell family",
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
    const staffPage = await context.newPage();
    const approverPage = await context.newPage();

    await openPatientConversationRoute(
      patientPage,
      pair.patientBaseUrl,
      "request_211_a",
      "conversation_more_info",
      "state=live",
    );
    await openStaffMoreInfoRoute(staffPage, pair.workspaceBaseUrl, "task-311", "live");

    const patientRoute = patientPage.locator("[data-testid='PatientConversationRoute']");
    const staffStage = staffPage.locator("[data-testid='MoreInfoInlineSideStage']");
    const patientParity = await readAttributes(patientRoute, [
      "data-phase3-bundle-ref",
      "data-reply-window-checkpoint",
      "data-more-info-cycle-ref",
      "data-request-lineage-ref",
      "data-due-state",
      "data-repair-posture",
    ]);
    const staffParity = await readAttributes(staffStage, [
      "data-phase3-bundle-ref",
      "data-reply-window-checkpoint",
      "data-more-info-cycle-ref",
      "data-request-lineage-ref",
      "data-due-state",
      "data-repair-posture",
    ]);

    expectEqual(patientParity["data-phase3-bundle-ref"], staffParity["data-phase3-bundle-ref"], "phase3 bundle parity drifted");
    expectEqual(patientParity["data-reply-window-checkpoint"], staffParity["data-reply-window-checkpoint"], "reply window checkpoint parity drifted");
    expectEqual(patientParity["data-more-info-cycle-ref"], staffParity["data-more-info-cycle-ref"], "more-info cycle parity drifted");
    expectEqual(patientParity["data-request-lineage-ref"], staffParity["data-request-lineage-ref"], "request lineage parity drifted");
    expectEqual(patientParity["data-due-state"], staffParity["data-due-state"], "due state parity drifted");
    expectEqual(patientParity["data-repair-posture"], staffParity["data-repair-posture"], "repair posture parity drifted");

    const shell = staffPage.locator("[data-testid='WorkspaceShellRouteFamily']");
    const continuityKey = await shell.getAttribute("data-workspace-shell-continuity-key");
    assertCondition(continuityKey, "workspace shell continuity key missing on staff more-info route");

    await staffPage.getByRole("button", { name: "Decision child route" }).click();
    await staffPage.waitForURL(`${pair.workspaceBaseUrl}/workspace/task/task-311/decision`);
    await staffPage.locator("[data-testid='EndpointReasoningStage']").waitFor();
    await staffPage.goBack({ waitUntil: "networkidle" });
    await staffPage.locator("[data-testid='MoreInfoInlineSideStage']").waitFor();
    assertCondition(
      (await shell.getAttribute("data-workspace-shell-continuity-key")) === continuityKey,
      "staff more-info to decision history replaced the workspace continuity key",
    );

    await openPatientConversationRoute(
      patientPage,
      pair.patientBaseUrl,
      "request_211_a",
      "conversation_more_info",
      "state=expired",
    );
    await patientRoute.waitFor();
    assertCondition(
      (await patientRoute.getAttribute("data-patient-conversation-state")) === "expired_reply_window",
      "expired patient route did not publish the expired_reply_window state",
    );
    assertCondition(
      (await patientRoute.getAttribute("data-route-family")) === "patient_conversation",
      "expired patient route should stay in the same conversation family",
    );
    assertCondition(
      (await patientRoute.getAttribute("data-due-state")) === "expired",
      "expired patient route lost the due-state expiry marker",
    );

    await openWorkspaceRoute(
      approverPage,
      `${pair.workspaceBaseUrl}/workspace/approvals?state=live`,
      "WorkspaceApprovalsRoute",
    );
    await approverPage.locator("[data-testid='ApprovalReviewStage']").waitFor();
    assertCondition(
      (await approverPage.locator("[data-testid='ApprovalReviewStage']").getAttribute("data-decision-epoch")) !==
        null,
      "approver route must keep the decision epoch visible",
    );
    assertCondition(
      ((await approverPage.locator("[data-testid='ApprovalAuthoritySummary']").textContent()) || "").includes(
        "approval_checkpoint::task-208::current",
      ),
      "approver route lost the live approval checkpoint reference",
    );

    await openWorkspaceRoute(
      staffPage,
      `${pair.workspaceBaseUrl}/workspace/task/task-311/decision?state=stale`,
      "WorkspaceDecisionChildRoute",
    );
    await staffPage.locator("[data-testid='ProtectedCompositionFreezeFrame']").waitFor();
    assertCondition(
      (await staffPage.locator("[data-testid='ProtectedCompositionFreezeFrame']").getAttribute("data-freeze-state")) ===
        "stale_recoverable",
      "stale reviewer route must keep the freeze frame visible in stale_recoverable posture",
    );

    await assertPatientNoHorizontalOverflow(patientPage, "273 patient more-info parity");
    await assertWorkspaceNoHorizontalOverflow(staffPage, "273 staff more-info parity");
    await assertWorkspaceNoHorizontalOverflow(approverPage, "273 approver parity");

    await takeDecisionCycleTrace(context, "273-decision-cycle-multi-actor-trace.zip");
  } finally {
    await browser.close();
    await stopPatientWorkspacePair(pair);
  }
}

function expectEqual(actual: string | null, expected: string | null, message: string): void {
  assertCondition(actual === expected, `${message}: ${actual} !== ${expected}`);
}

if (process.argv.includes("--run")) {
  run().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
