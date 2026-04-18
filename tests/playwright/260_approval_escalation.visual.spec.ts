import {
  assertNoHorizontalOverflow,
  importPlaywright,
  openWorkspaceRoute,
  outputPath,
  startClinicalWorkspace,
  stopClinicalWorkspace,
} from "./255_workspace_shell_helpers";

export const approvalEscalationVisualCoverage = [
  "desktop approval route",
  "desktop stale approval freeze posture",
  "desktop escalation route",
  "mobile escalation stack",
];

export async function run(): Promise<void> {
  const playwright = await importPlaywright();
  if (!playwright) {
    return;
  }

  const { child, baseUrl } = await startClinicalWorkspace();
  const browser = await playwright.chromium.launch({ headless: true });

  try {
    const desktop = await browser.newPage({ viewport: { width: 1480, height: 1080 } });
    await openWorkspaceRoute(desktop, `${baseUrl}/workspace/approvals?state=live`, "WorkspaceApprovalsRoute");
    await desktop.screenshot({ path: outputPath("260-approval-route.png"), fullPage: true });

    await openWorkspaceRoute(desktop, `${baseUrl}/workspace/approvals?state=stale`, "WorkspaceApprovalsRoute");
    await desktop.screenshot({ path: outputPath("260-approval-route-stale.png"), fullPage: true });

    await openWorkspaceRoute(desktop, `${baseUrl}/workspace/escalations?state=live`, "WorkspaceEscalationsRoute");
    await desktop.screenshot({ path: outputPath("260-escalation-route.png"), fullPage: true });
    await assertNoHorizontalOverflow(desktop, "260 approval escalation desktop visual");

    const mobile = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await openWorkspaceRoute(mobile, `${baseUrl}/workspace/escalations?state=live`, "WorkspaceEscalationsRoute");
    await mobile.screenshot({ path: outputPath("260-escalation-route-mobile.png"), fullPage: true });
    await assertNoHorizontalOverflow(mobile, "260 approval escalation mobile visual");
    await mobile.close();
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
