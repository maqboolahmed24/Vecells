import {
  assertCondition,
  importPlaywright,
  openWorkspaceRoute,
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
    const page = await browser.newPage({ viewport: { width: 1440, height: 960 } });
    await openWorkspaceRoute(page, `${baseUrl}/workspace/changed?state=live`, "WorkspaceChangedRoute");

    await page.getByRole("button", { name: "Contextual or clerical" }).click();
    await page.locator("[data-testid='ChangedWorkRow'][data-task-id='task-118'] .staff-shell__changed-row-main").click();
    await page.locator("[data-testid='InlineChangedRegionMarkers'] .staff-shell__changed-marker").nth(0).click();
    const anchorBeforeReload = await page.locator("[data-testid='DeltaFirstResumeShell']").getAttribute("data-selected-anchor-ref");

    await page.reload({ waitUntil: "networkidle" });
    await page.locator("[data-testid='ChangedWorkRoute']").waitFor();
    assertCondition(
      (await page.locator("[data-testid='ChangedWorkRow'][data-task-id='task-118']").getAttribute("data-selected")) === "true",
      "reload should preserve the selected changed row",
    );
    assertCondition(
      (await page.locator("[data-testid='DeltaFirstResumeShell']").getAttribute("data-selected-anchor-ref")) === anchorBeforeReload,
      "reload should preserve the selected changed anchor",
    );

    await page.locator("[data-testid='ChangedWorkRow'][data-task-id='task-118']").getByRole("button", { name: "Open task shell" }).click();
    await page.waitForURL(`${baseUrl}/workspace/task/task-118`);
    await page.goBack({ waitUntil: "networkidle" });
    await page.locator("[data-testid='ChangedWorkRoute']").waitFor();
    assertCondition(
      (await page.locator("[data-testid='ChangedWorkRow'][data-task-id='task-118']").getAttribute("data-selected")) === "true",
      "back navigation should restore the changed row selection",
    );
    assertCondition(
      (await page.locator("[data-testid='DeltaFirstResumeShell']").getAttribute("data-selected-anchor-ref")) === anchorBeforeReload,
      "back navigation should restore the changed anchor",
    );

    await page.goForward({ waitUntil: "networkidle" });
    await page.locator("[data-testid='WorkspaceTaskRoute']").waitFor();
    assertCondition(
      (await page.locator("[data-testid='ActiveTaskShell']").getAttribute("data-opening-mode")) === "resumed_review",
      "forward navigation should return to the resumed-review task shell",
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
