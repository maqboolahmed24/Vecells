import {
  assertNoHorizontalOverflow,
  importPlaywright,
  openWorkspaceRoute,
  outputPath,
  startClinicalWorkspace,
  stopClinicalWorkspace,
} from "./255_workspace_shell_helpers";

export const activeTaskShellVisualCoverage = [
  "desktop resumed-review shell",
  "desktop approval-review shell",
  "mobile mission-stack shell",
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
    await openWorkspaceRoute(desktop, `${baseUrl}/workspace/task/task-311`, "WorkspaceTaskRoute");
    await desktop.screenshot({ path: outputPath("257-active-task-shell-task-311.png"), fullPage: true });

    await openWorkspaceRoute(desktop, `${baseUrl}/workspace/task/task-208`, "WorkspaceTaskRoute");
    await desktop.screenshot({ path: outputPath("257-active-task-shell-task-208-approval.png"), fullPage: true });
    await assertNoHorizontalOverflow(desktop, "257 active task shell desktop visual");

    const mobile = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await openWorkspaceRoute(mobile, `${baseUrl}/workspace/task/task-311`, "WorkspaceTaskRoute");
    await mobile.screenshot({ path: outputPath("257-active-task-shell-mobile.png"), fullPage: true });
    await assertNoHorizontalOverflow(mobile, "257 active task shell mobile visual");
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
