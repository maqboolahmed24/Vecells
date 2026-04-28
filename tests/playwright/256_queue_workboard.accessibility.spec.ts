import {
  assertCondition,
  assertNoHorizontalOverflow,
  importPlaywright,
  openWorkspaceRoute,
  startClinicalWorkspace,
  stopClinicalWorkspace,
  writeAccessibilitySnapshot,
} from "./255_workspace_shell_helpers";

export const queueWorkboardAccessibilityCoverage = [
  "labelled queue search",
  "single listbox with selectable row options",
  "keyboard pin and open flow",
  "reduced-motion narrow layout stays readable",
];

export async function run(): Promise<void> {
  const playwright = await importPlaywright();
  if (!playwright) {
    return;
  }

  const { child, baseUrl } = await startClinicalWorkspace();
  const browser = await playwright.chromium.launch({ headless: true });

  try {
    const page = await browser.newPage({ viewport: { width: 1024, height: 900 } });
    await page.emulateMedia({ reducedMotion: "reduce" });

    await openWorkspaceRoute(page, `${baseUrl}/workspace/queue/recommended`, "WorkspaceQueueRoute");
    await page.locator("[aria-label='Search the current queue']").waitFor();
    assertCondition((await page.locator("[role='listbox']").count()) === 1, "expected one queue listbox");
    assertCondition((await page.locator("[role='option']").count()) >= 4, "expected queue options to be present");

    const listbox = page.locator("[role='listbox']");
    await listbox.focus();
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press(" ");
    assertCondition(
      (await page.locator("[data-testid='queue-preview-pocket']").getAttribute("data-preview-mode")) === "pinned_summary",
      "keyboard pin did not hold the preview",
    );
    await page.keyboard.press("Enter");
    await page.waitForURL(/\/workspace\/task\/task-/);
    await page.locator("[data-testid='WorkspaceTaskRoute']").waitFor();
    await assertNoHorizontalOverflow(page, "256 queue accessibility desktop");

    const narrowPage = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await narrowPage.emulateMedia({ reducedMotion: "reduce" });
    await openWorkspaceRoute(narrowPage, `${baseUrl}/workspace/queue/recommended`, "WorkspaceQueueRoute");
    await assertNoHorizontalOverflow(narrowPage, "256 queue accessibility narrow");
    await writeAccessibilitySnapshot(narrowPage, "256-queue-workboard-accessibility-snapshot.json");
    await narrowPage.close();
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
