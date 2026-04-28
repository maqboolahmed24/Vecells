import {
  assertCondition,
  importPlaywright,
  openWorkspaceRoute,
  startClinicalWorkspace,
  stopClinicalWorkspace,
} from "./255_workspace_shell_helpers";

export const activeTaskShellDeltaResumeCoverage = [
  "resumed review opens delta-first with superseded context visible",
  "approval review promotes one approval region",
  "read-only posture keeps the shell and fences the dock in place",
];

export async function run(): Promise<void> {
  const playwright = await importPlaywright();
  if (!playwright) {
    return;
  }

  const { child, baseUrl } = await startClinicalWorkspace();
  const browser = await playwright.chromium.launch({ headless: true });

  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1080 } });

    await openWorkspaceRoute(page, `${baseUrl}/workspace/task/task-311`, "WorkspaceTaskRoute");
    assertCondition(
      (await page.locator("[data-testid='delta-stack']").getAttribute("data-expanded-by-default")) === "true",
      "resumed review should keep delta stack expanded",
    );
    assertCondition(
      ((await page.locator("[data-testid='superseded-context']").textContent()) || "").includes("Superseded:"),
      "superseded context lost its visible markers",
    );

    await openWorkspaceRoute(page, `${baseUrl}/workspace/task/task-208`, "WorkspaceTaskRoute");
    assertCondition(
      (await page.locator("[data-testid='ActiveTaskShell']").getAttribute("data-opening-mode")) === "approval_review",
      "task-208 should resolve approval review mode",
    );
    assertCondition(
      (await page.locator("[data-testid='promoted-support-region']").getAttribute("data-region-kind")) === "approval_review",
      "approval task did not promote the approval region",
    );
    assertCondition(
      (await page.locator("[data-testid='promoted-support-region']").count()) === 1,
      "approval task promoted multiple support regions",
    );

    await openWorkspaceRoute(page, `${baseUrl}/workspace/task/task-311?state=read-only`, "WorkspaceTaskRoute");
    await page.locator("[data-testid='ActiveTaskShell']").waitFor();
    assertCondition(
      ["blocked", "invalidated"].includes(
        (await page.locator("[data-testid='decision-dock']").getAttribute("data-dock-state")) || "",
      ),
      "read-only posture should fence the dock",
    );
    assertCondition(
      (await page.locator("[data-testid='ActiveTaskShell']").getAttribute("data-shell-posture")) === "read_only",
      "read-only route should preserve shell posture in place",
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
