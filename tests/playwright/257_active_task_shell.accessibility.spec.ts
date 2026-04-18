import {
  assertCondition,
  assertNoHorizontalOverflow,
  importPlaywright,
  openWorkspaceRoute,
  startClinicalWorkspace,
  stopClinicalWorkspace,
  writeAccessibilitySnapshot,
} from "./255_workspace_shell_helpers";

export const activeTaskShellAccessibilityCoverage = [
  "task shell region headings stay present",
  "keyboard route entry through the dock",
  "reduced-motion mission-stack layout stays readable",
];

export async function run(): Promise<void> {
  const playwright = await importPlaywright();
  if (!playwright) {
    return;
  }

  const { child, baseUrl } = await startClinicalWorkspace();
  const browser = await playwright.chromium.launch({ headless: true });

  try {
    const page = await browser.newPage({ viewport: { width: 1180, height: 960 } });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await openWorkspaceRoute(page, `${baseUrl}/workspace/task/task-311`, "WorkspaceTaskRoute");

    assertCondition((await page.locator("[data-testid='case-pulse-band']").count()) === 1, "case pulse band missing");
    assertCondition((await page.locator("[data-testid='task-status-strip']").count()) === 1, "task status strip missing");
    assertCondition((await page.getByRole("button", { name: "Decision child route" }).count()) === 1, "decision child route button missing");

    await page.getByRole("button", { name: "Decision child route" }).focus();
    await page.keyboard.press("Enter");
    await page.waitForURL(`${baseUrl}/workspace/task/task-311/decision`);
    await page.locator("[data-testid='WorkspaceDecisionChildRoute']").waitFor();
    await assertNoHorizontalOverflow(page, "257 active task shell accessibility desktop");

    const narrow = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await narrow.emulateMedia({ reducedMotion: "reduce" });
    await openWorkspaceRoute(narrow, `${baseUrl}/workspace/task/task-311`, "WorkspaceTaskRoute");
    await assertNoHorizontalOverflow(narrow, "257 active task shell accessibility narrow");
    await writeAccessibilitySnapshot(narrow, "257-active-task-shell-accessibility-snapshot.json");
    await narrow.close();
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
