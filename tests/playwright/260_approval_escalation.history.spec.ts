import {
  assertCondition,
  importPlaywright,
  openWorkspaceRoute,
  startClinicalWorkspace,
  stopClinicalWorkspace,
} from "./255_workspace_shell_helpers";

export const approvalEscalationHistoryCoverage = [
  "reload preserves escalation anchor and shell continuity",
  "task-open and back restore the selected escalation row",
  "approval route stays in the same shell under history travel",
];

export async function run(): Promise<void> {
  const playwright = await importPlaywright();
  if (!playwright) {
    return;
  }

  const { child, baseUrl } = await startClinicalWorkspace();
  const browser = await playwright.chromium.launch({ headless: true });

  try {
    const page = await browser.newPage({ viewport: { width: 1360, height: 960 } });

    await openWorkspaceRoute(page, `${baseUrl}/workspace/escalations?state=live`, "WorkspaceEscalationsRoute");
    const root = page.locator("[data-testid='WorkspaceShellRouteFamily']");
    const shellKey = await root.getAttribute("data-workspace-shell-continuity-key");

    await page.locator("[data-testid='EscalationInboxRow'][data-task-id='task-507'] .staff-shell__escalation-row-main").click();
    await page.waitForFunction(() =>
      document.querySelector("[data-testid='WorkspaceShellRouteFamily']")?.getAttribute("data-selected-anchor-ref") ===
      "escalation-preview-task-507",
    );
    const selectedAnchor = await root.getAttribute("data-selected-anchor-ref");

    await page.reload({ waitUntil: "networkidle" });
    await page.locator("[data-testid='WorkspaceEscalationsRoute']").waitFor();
    assertCondition(
      (await root.getAttribute("data-workspace-shell-continuity-key")) === shellKey,
      "reload replaced the shell continuity key on escalations",
    );
    assertCondition(
      (await root.getAttribute("data-selected-anchor-ref")) === selectedAnchor,
      "reload lost the selected escalation anchor",
    );
    assertCondition(
      (await page.locator("[data-testid='EscalationInboxRow'][data-task-id='task-507']").getAttribute("data-selected")) ===
        "true",
      "reload lost the selected escalation row",
    );

    await page
      .locator("[data-testid='EscalationInboxRow'][data-task-id='task-507']")
      .getByRole("button", { name: "Open task shell" })
      .click();
    await page.waitForURL(`${baseUrl}/workspace/task/task-507`);
    await page.locator("[data-testid='WorkspaceTaskRoute']").waitFor();

    await page.goBack({ waitUntil: "networkidle" });
    await page.locator("[data-testid='WorkspaceEscalationsRoute']").waitFor();
    assertCondition(
      (await root.getAttribute("data-workspace-shell-continuity-key")) === shellKey,
      "back navigation replaced the escalation shell continuity key",
    );
    assertCondition(
      (await page.locator("[data-testid='EscalationInboxRow'][data-task-id='task-507']").getAttribute("data-selected")) ===
        "true",
      "back navigation did not restore the selected escalation row",
    );

    await page.getByRole("button", { name: "Approvals", exact: true }).first().click();
    await page.waitForURL(`${baseUrl}/workspace/approvals`);
    await page.locator("[data-testid='WorkspaceApprovalsRoute']").waitFor();
    await page.goBack({ waitUntil: "networkidle" });
    await page.locator("[data-testid='WorkspaceEscalationsRoute']").waitFor();
    assertCondition(
      (await root.getAttribute("data-selected-anchor-ref")) === "escalation-preview-task-507",
      "peer-route history travel lost the escalation anchor",
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
