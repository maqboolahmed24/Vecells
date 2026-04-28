import {
  assertCondition,
  assertNoHorizontalOverflow,
  importPlaywright,
  openWorkspaceRoute,
  outputPath,
  startClinicalWorkspace,
  stopClinicalWorkspace,
} from "./255_workspace_shell_helpers";

export async function run(): Promise<void> {
  const playwright = await importPlaywright();
  if (!playwright) {
    return;
  }

  const { child, baseUrl } = await startClinicalWorkspace();
  const browser = await playwright.chromium.launch({ headless: true });

  try {
    const desktop = await browser.newPage({ viewport: { width: 1480, height: 1080 } });
    await openWorkspaceRoute(desktop, `${baseUrl}/workspace/changed?state=live`, "WorkspaceChangedRoute");
    await assertNoHorizontalOverflow(desktop, "261 changed review desktop visual");
    await desktop.screenshot({ path: outputPath("261-changed-review-resume-desktop.png"), fullPage: true });

    const mobile = await browser.newPage({ viewport: { width: 430, height: 980 } });
    await mobile.emulateMedia({ reducedMotion: "reduce" });
    await openWorkspaceRoute(mobile, `${baseUrl}/workspace/changed?state=blocked`, "WorkspaceChangedRoute");
    assertCondition(
      (await mobile.locator("[data-testid='ChangedWorkRoute']").getAttribute("data-resume-state")) === "recovery_only",
      "blocked changed route should preserve recovery-only resume state",
    );
    await assertNoHorizontalOverflow(mobile, "261 changed review mobile visual");
    await mobile.screenshot({ path: outputPath("261-changed-review-resume-mobile.png"), fullPage: true });
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
