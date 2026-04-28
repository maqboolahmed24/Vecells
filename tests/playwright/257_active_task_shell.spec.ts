import {
  assertCondition,
  assertNoHorizontalOverflow,
  importPlaywright,
  openWorkspaceRoute,
  outputPath,
  startClinicalWorkspace,
  stopClinicalWorkspace,
  trackExternalRequests,
} from "./255_workspace_shell_helpers";

export const activeTaskShellCoverage = [
  "desktop active-task shell anatomy",
  "sticky decision dock remains stable while scrolling",
  "same-shell more-info child route preserves continuity",
  "only one promoted support region can appear at once",
];

export async function run(): Promise<void> {
  const playwright = await importPlaywright();
  if (!playwright) {
    return;
  }

  const { child, baseUrl } = await startClinicalWorkspace();
  const browser = await playwright.chromium.launch({ headless: true });

  try {
    const page = await browser.newPage({ viewport: { width: 1480, height: 1080 } });
    const externalRequests = new Set<string>();
    trackExternalRequests(page, baseUrl, externalRequests);

    await openWorkspaceRoute(page, `${baseUrl}/workspace/task/task-311`, "WorkspaceTaskRoute");
    await page.locator("[data-testid='ActiveTaskShell']").waitFor();
    await page.locator("[data-testid='case-pulse-band']").waitFor();
    await page.locator("[data-testid='task-status-strip']").waitFor();
    await page.locator("[data-testid='task-canvas-frame']").waitFor();
    await page.locator("[data-testid='decision-dock']").waitFor();

    const shell = page.locator("[data-testid='ActiveTaskShell']");
    assertCondition(
      (await shell.getAttribute("data-opening-mode")) === "resumed_review",
      "task-311 should resolve resumed review opening mode",
    );
    assertCondition(
      (await page.locator("[data-testid='delta-stack']").getAttribute("data-expanded-by-default")) === "true",
      "delta stack should be expanded for resumed review",
    );
    assertCondition(
      (await page.locator("[data-testid='promoted-support-region']").count()) <= 1,
      "task shell promoted more than one support region",
    );

    const dock = page.locator("[data-testid='decision-dock']");
    const before = await dock.boundingBox();
    await page.evaluate(() => window.scrollTo({ top: document.body.scrollHeight, behavior: "instant" }));
    await page.waitForTimeout(120);
    const after = await dock.boundingBox();
    assertCondition(Boolean(before) && Boolean(after), "decision dock bounding boxes missing");
    assertCondition((after?.y ?? 9999) < (before?.y ?? 0), "decision dock did not move into sticky posture");
    assertCondition((after?.y ?? 9999) < 120, "decision dock did not stay near the top edge while scrolling");

    const root = page.locator("[data-testid='WorkspaceShellRouteFamily']");
    const shellKey = await root.getAttribute("data-workspace-shell-continuity-key");
    assertCondition(Boolean(shellKey), "shell continuity key missing on task shell");

    await page.getByRole("button", { name: "More-info child route" }).click();
    await page.waitForURL(`${baseUrl}/workspace/task/task-311/more-info`);
    await page.locator("[data-testid='WorkspaceMoreInfoChildRoute']").waitFor();
    assertCondition(
      (await page.locator("[data-testid='ActiveTaskShell']").getAttribute("data-support-region")) === "more_info_stage",
      "more-info child route did not promote the expected support region",
    );
    assertCondition(
      (await root.getAttribute("data-workspace-shell-continuity-key")) === shellKey,
      "more-info child route replaced shell continuity",
    );

    await assertNoHorizontalOverflow(page, "257 active task shell desktop");
    assertCondition(externalRequests.size === 0, `unexpected external requests: ${Array.from(externalRequests).join(", ")}`);
    await page.screenshot({ path: outputPath("257-active-task-shell-desktop.png"), fullPage: true });
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
