import {
  assertCondition,
  assertNoHorizontalOverflow,
  importPlaywright,
  openWorkspaceRoute,
  outputPath,
  startClinicalWorkspace,
  stopClinicalWorkspace,
} from "./255_workspace_shell_helpers";

async function openProtectedMoreInfo(page: any, baseUrl: string) {
  await openWorkspaceRoute(page, `${baseUrl}/workspace/queue/recommended?state=live`, "WorkspaceQueueRoute");
  await page.locator("article:has([data-task-id='task-311']) .staff-shell__queue-open-button").click();
  await page.waitForURL(`${baseUrl}/workspace/task/task-311`);
  await page.getByRole("button", { name: "More-info child route" }).click();
  await page.waitForURL(`${baseUrl}/workspace/task/task-311/more-info`);
  await page.waitForFunction(() =>
    document.querySelector("[data-testid='ActiveTaskShell']")?.getAttribute("data-protected-composition") ===
    "composing",
  );
}

export async function run(): Promise<void> {
  const playwright = await importPlaywright();
  if (!playwright) {
    return;
  }

  const { child, baseUrl } = await startClinicalWorkspace();
  const browser = await playwright.chromium.launch({ headless: true });

  try {
    const desktop = await browser.newPage({ viewport: { width: 1480, height: 1080 } });
    await openProtectedMoreInfo(desktop, baseUrl);
    await assertNoHorizontalOverflow(desktop, "262 protected desktop");
    await desktop.screenshot({ path: outputPath("262-focus-protection-desktop.png"), fullPage: true });

    const mobile = await browser.newPage({ viewport: { width: 430, height: 980 } });
    await mobile.emulateMedia({ reducedMotion: "reduce" });
    await openWorkspaceRoute(mobile, `${baseUrl}/workspace/task/task-311/decision?state=stale`, "WorkspaceDecisionChildRoute");
    assertCondition(
      (await mobile.locator("[data-testid='ActiveTaskShell']").getAttribute("data-focus-protection")) === "invalidated",
      "stale decision route should expose invalidated focus protection",
    );
    await assertNoHorizontalOverflow(mobile, "262 protected mobile");
    await mobile.screenshot({ path: outputPath("262-focus-protection-mobile.png"), fullPage: true });
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
