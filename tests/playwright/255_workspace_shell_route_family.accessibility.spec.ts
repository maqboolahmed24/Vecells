import {
  assertCondition,
  importPlaywright,
  openWorkspaceRoute,
  writeAccessibilitySnapshot,
  startClinicalWorkspace,
  stopClinicalWorkspace,
} from "./255_workspace_shell_helpers";

export const workspaceShellAccessibilityCoverage = [
  "landmark and role snapshot for home",
  "queue listbox and option semantics",
  "reduced-motion parity on decision child route",
  "visible route-family DOM markers under reduced motion",
];

export async function run(): Promise<void> {
  const playwright = await importPlaywright();
  if (!playwright) {
    return;
  }

  const { child, baseUrl } = await startClinicalWorkspace();
  const browser = await playwright.chromium.launch({ headless: true });

  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 960 } });
    await openWorkspaceRoute(page, `${baseUrl}/workspace`, "WorkspaceHomeRoute");
    await writeAccessibilitySnapshot(page, "255-workspace-home-aria.json");

    const navCount = await page.locator("nav").count();
    const mainCount = await page.locator("main").count();
    const listboxCount = await page.locator("[role='listbox']").count();
    assertCondition(navCount >= 1, "nav landmark missing");
    assertCondition(mainCount === 1, "expected exactly one main landmark");
    assertCondition(listboxCount === 1, "queue workboard lost listbox semantics");

    await openWorkspaceRoute(page, `${baseUrl}/workspace/queue/recommended`, "WorkspaceQueueRoute");
    const optionCount = await page.locator("[role='option']").count();
    assertCondition(optionCount >= 3, "queue options unexpectedly thin");

    await page.emulateMedia({ reducedMotion: "reduce" });
    await openWorkspaceRoute(page, `${baseUrl}/workspace/task/task-311/decision`, "WorkspaceDecisionChildRoute");
    await writeAccessibilitySnapshot(page, "255-workspace-decision-reduced-aria.json");
    const root = page.locator("[data-testid='WorkspaceShellRouteFamily']");
    assertCondition((await root.getAttribute("data-motion-profile")) === "reduced", "reduced motion marker drifted");
    assertCondition(
      (await root.getAttribute("data-route-family")) === "rf_staff_workspace_child",
      "child route family marker drifted under reduced motion",
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
