import {
  assertNoHorizontalOverflow,
  importPlaywright,
  openWorkspaceRoute,
  outputPath,
  startClinicalWorkspace,
  stopClinicalWorkspace,
} from "./255_workspace_shell_helpers";

export const rapidEntryAndReasoningVisualCoverage = [
  "desktop rapid-entry dock",
  "desktop more-info side stage",
  "mobile decision reasoning shell",
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
    await desktop.screenshot({ path: outputPath("258-reasoning-dock-task.png"), fullPage: true });

    await openWorkspaceRoute(desktop, `${baseUrl}/workspace/task/task-311/more-info`, "WorkspaceMoreInfoChildRoute");
    await desktop.screenshot({ path: outputPath("258-reasoning-dock-more-info.png"), fullPage: true });
    await assertNoHorizontalOverflow(desktop, "258 reasoning dock desktop visual");

    const mobile = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await openWorkspaceRoute(mobile, `${baseUrl}/workspace/task/task-311/decision`, "WorkspaceDecisionChildRoute");
    await mobile.screenshot({ path: outputPath("258-reasoning-dock-mobile-decision.png"), fullPage: true });
    await assertNoHorizontalOverflow(mobile, "258 reasoning dock mobile visual");
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
