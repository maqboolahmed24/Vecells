import {
  assertCondition,
  importPlaywright,
  openWorkspaceRoute,
  startClinicalWorkspace,
  stopClinicalWorkspace,
} from "./255_workspace_shell_helpers";

export const workspaceShellHistoryCoverage = [
  "queue to task to decision browser history",
  "reload preserves decision child route",
  "shell continuity key survives child-route history travel",
  "restore storage key remains populated after reload",
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

    await openWorkspaceRoute(page, `${baseUrl}/workspace/queue/returned-evidence`, "WorkspaceQueueRoute");
    await page.locator("[role='option'][aria-selected='true'] .staff-shell__queue-open-button").click();
    await page.waitForURL(`${baseUrl}/workspace/task/task-311`);
    await page.locator("[data-testid='WorkspaceTaskRoute']").waitFor();
    const root = page.locator("[data-testid='WorkspaceShellRouteFamily']");
    const shellKey = await root.getAttribute("data-workspace-shell-continuity-key");

    await page.getByRole("button", { name: "Decision child route" }).click();
    await page.waitForURL(`${baseUrl}/workspace/task/task-311/decision`);
    await page.locator("[data-testid='WorkspaceDecisionChildRoute']").waitFor();
    const selectedAnchorBeforeReload = await root.getAttribute("data-selected-anchor-ref");

    await page.reload({ waitUntil: "networkidle" });
    await page.locator("[data-testid='WorkspaceDecisionChildRoute']").waitFor();
    assertCondition(
      (await root.getAttribute("data-workspace-shell-continuity-key")) === shellKey,
      "reload replaced the workspace shell continuity key",
    );
    assertCondition(
      (await root.getAttribute("data-selected-anchor-ref")) === selectedAnchorBeforeReload,
      "reload did not preserve the selected anchor marker",
    );
    assertCondition(Boolean(await root.getAttribute("data-restore-storage-key")), "restore storage key missing after reload");

    await page.goBack({ waitUntil: "networkidle" });
    await page.locator("[data-testid='WorkspaceTaskRoute']").waitFor();
    assertCondition(
      (await root.getAttribute("data-workspace-shell-continuity-key")) === shellKey,
      "task back navigation replaced the shell key",
    );

    await page.goBack({ waitUntil: "networkidle" });
    await page.locator("[data-testid='WorkspaceQueueRoute']").waitFor();
    assertCondition(
      (await root.getAttribute("data-workspace-shell-continuity-key")) === shellKey,
      "queue back navigation replaced the shell key",
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
