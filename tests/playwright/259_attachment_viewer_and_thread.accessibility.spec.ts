import {
  assertCondition,
  assertNoHorizontalOverflow,
  importPlaywright,
  openWorkspaceRoute,
  startClinicalWorkspace,
  stopClinicalWorkspace,
  writeAccessibilitySnapshot,
} from "./255_workspace_shell_helpers";

export const attachmentViewerAndThreadAccessibilityCoverage = [
  "reference stack expands from keyboard without trapping focus",
  "thread anchor action is keyboard reachable",
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
    const page = await browser.newPage({ viewport: { width: 1180, height: 960 } });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await openWorkspaceRoute(page, `${baseUrl}/workspace/task/task-311`, "WorkspaceTaskRoute");

    const summary = page.locator("[data-testid='reference-stack'] summary");
    await summary.focus();
    await page.keyboard.press("Space");
    await page.locator("[data-testid='AttachmentDigestGrid']").waitFor();
    await page.locator("[data-testid='PatientResponseThreadPanel']").waitFor();

    const focusButton = page
      .locator("[data-row-id='thread-event-task-311-reminder']")
      .getByRole("button", { name: "Focus anchor" });
    await focusButton.focus();
    await page.keyboard.press("Enter");
    await page.locator("[data-testid='ThreadAnchorStub']").waitFor();

    const openViewerButton = page
      .locator("[data-artifact-id='artifact-task-311-inhaler-photo']")
      .getByRole("button", { name: "Open governed viewer" });
    await openViewerButton.focus();
    await page.keyboard.press("Enter");
    await page.locator("[data-testid='ArtifactViewerStage']").waitFor();
    const closeButton = page.getByRole("button", { name: "Return to attachment digest" });
    await closeButton.focus();
    await page.keyboard.press("Enter");
    assertCondition((await page.locator("[data-testid='ArtifactViewerStage']").count()) === 0, "viewer close control failed from keyboard");

    const narrow = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await narrow.emulateMedia({ reducedMotion: "reduce" });
    await openWorkspaceRoute(narrow, `${baseUrl}/workspace/task/task-311`, "WorkspaceTaskRoute");
    await narrow.locator("[data-testid='reference-stack']").evaluate((node) => {
      const details = node as HTMLDetailsElement;
      details.open = true;
      details.dispatchEvent(new Event("toggle", { bubbles: true }));
    });
    await assertNoHorizontalOverflow(narrow, "259 artifact thread accessibility narrow");
    await writeAccessibilitySnapshot(narrow, "259-attachment-thread-accessibility-snapshot.json");
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
