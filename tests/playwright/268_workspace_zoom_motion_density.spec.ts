import {
  assertCondition,
  assertNoHorizontalOverflow,
  importPlaywright,
  openWorkspaceRoute,
  startClinicalWorkspace,
  stopClinicalWorkspace,
} from "./255_workspace_shell_helpers";

async function boundingHeight(locator: any): Promise<number> {
  const box = await locator.boundingBox();
  return box?.height ?? 0;
}

export async function run(): Promise<void> {
  const playwright = await importPlaywright();
  if (!playwright) {
    return;
  }

  const { child, baseUrl } = await startClinicalWorkspace();
  const browser = await playwright.chromium.launch({ headless: true });

  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await page.emulateMedia({ reducedMotion: "reduce" });

    await openWorkspaceRoute(page, `${baseUrl}/workspace/task/task-311/decision?state=stale`, "WorkspaceDecisionChildRoute");
    const root = page.locator("[data-testid='WorkspaceShellRouteFamily']");
    assertCondition(
      (await root.getAttribute("data-motion-profile")) === "reduced",
      "reduced motion should publish a reduced motion profile",
    );
    assertCondition(
      (await root.getAttribute("data-layout-mode")) === "mission_stack",
      "narrow view should fold the workspace into mission_stack",
    );
    assertCondition(
      (await page.locator("[data-testid='NextTaskPostureCard']").getAttribute("data-auto-advance")) === "forbidden",
      "no auto-advance must remain explicit in reflow posture",
    );
    await assertNoHorizontalOverflow(page, "268 task stale mobile");

    await page.setViewportSize({ width: 720, height: 900 });
    await openWorkspaceRoute(page, `${baseUrl}/workspace/queue/recommended?state=live`, "WorkspaceQueueRoute");
    assertCondition(
      (await boundingHeight(page.locator(".staff-shell__queue-open-button").first())) >= 44,
      "queue open buttons should preserve minimum target height",
    );
    await assertNoHorizontalOverflow(page, "268 queue 200 percent equivalent");

    await page.setViewportSize({ width: 1180, height: 920 });
    await openWorkspaceRoute(page, `${baseUrl}/workspace/consequences?state=live`, "WorkspaceConsequencesRoute");
    assertCondition(
      (await boundingHeight(page.locator(".staff-shell__inline-action").first())) >= 44,
      "consequence actions should preserve minimum target height",
    );
    await assertNoHorizontalOverflow(page, "268 consequences medium density");
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
