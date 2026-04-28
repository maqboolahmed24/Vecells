import {
  assertCondition,
  assertNoHorizontalOverflow,
  importPlaywright,
  openWorkspaceRoute,
  startClinicalWorkspace,
  stopClinicalWorkspace,
  writeAccessibilitySnapshot,
} from "./255_workspace_shell_helpers";

export const approvalEscalationAccessibilityCoverage = [
  "approval route keeps named sections and keyboard-usable controls",
  "escalation route remains readable in reduced motion",
  "narrow accessibility snapshot preserves one-shell reading order",
];

export async function run(): Promise<void> {
  const playwright = await importPlaywright();
  if (!playwright) {
    return;
  }

  const { child, baseUrl } = await startClinicalWorkspace();
  const browser = await playwright.chromium.launch({ headless: true });

  try {
    const page = await browser.newPage({ viewport: { width: 1180, height: 960 } });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await openWorkspaceRoute(page, `${baseUrl}/workspace/approvals?state=live`, "WorkspaceApprovalsRoute");

    assertCondition((await page.locator("[data-testid='ApprovalInboxRoute']").count()) === 1, "approval route missing");
    assertCondition((await page.locator("[data-testid='ApprovalReviewStage']").count()) === 1, "approval review stage missing");
    assertCondition((await page.locator("[data-testid='ApprovalAuthoritySummary']").count()) === 1, "approval authority summary missing");
    assertCondition((await page.getByLabel("Approval sorting").count()) === 1, "approval sorting select missing");

    await page.getByRole("button", { name: "Pending" }).focus();
    await page.keyboard.press("Enter");
    await assertNoHorizontalOverflow(page, "260 approval accessibility desktop");

    const narrow = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await narrow.emulateMedia({ reducedMotion: "reduce" });
    await openWorkspaceRoute(narrow, `${baseUrl}/workspace/escalations?state=live`, "WorkspaceEscalationsRoute");
    assertCondition((await narrow.locator("[data-testid='UrgentContactTimeline']").count()) === 1, "urgent timeline missing");
    assertCondition((await narrow.locator("[data-testid='EscalationOutcomeRecorder']").count()) === 1, "outcome recorder missing");
    await assertNoHorizontalOverflow(narrow, "260 approval escalation accessibility narrow");
    await writeAccessibilitySnapshot(narrow, "260-approval-escalation-accessibility-snapshot.json");
    await narrow.close();
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
