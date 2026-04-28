import {
  assertNoHorizontalOverflow,
  importPlaywright,
  openWorkspaceRoute,
  outputPath,
  startClinicalWorkspace,
  stopClinicalWorkspace,
} from "./255_workspace_shell_helpers";

export const attachmentViewerAndThreadVisualCoverage = [
  "desktop task shell with viewer and patient thread open",
  "desktop repair-bound thread visibility state",
  "mobile artifact and chronology lane",
];

async function ensureReferenceStackOpen(page: any): Promise<void> {
  const referenceStack = page.locator("[data-testid='reference-stack']");
  const isOpen = await referenceStack.evaluate((node) => (node as HTMLDetailsElement).open);
  if (!isOpen) {
    await referenceStack.evaluate((node) => {
      const details = node as HTMLDetailsElement;
      details.open = true;
      details.dispatchEvent(new Event("toggle", { bubbles: true }));
    });
  }
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
    await openWorkspaceRoute(desktop, `${baseUrl}/workspace/task/task-311`, "WorkspaceTaskRoute");
    await ensureReferenceStackOpen(desktop);
    await desktop.locator("[data-artifact-id='artifact-task-311-inhaler-photo']").getByRole("button", { name: "Open governed viewer" }).click();
    await desktop.locator("[data-testid='ArtifactViewerStage']").waitFor();
    await desktop.locator("[data-row-id='thread-event-task-311-reply']").getByRole("button", { name: "Focus anchor" }).click();
    await desktop.locator("[data-testid='ThreadAnchorStub']").waitFor();
    await desktop.screenshot({ path: outputPath("259-attachment-thread-task-311.png"), fullPage: true });
    await assertNoHorizontalOverflow(desktop, "259 artifact thread desktop visual");

    await openWorkspaceRoute(desktop, `${baseUrl}/workspace/task/task-412`, "WorkspaceTaskRoute");
    await ensureReferenceStackOpen(desktop);
    await desktop.locator("[data-testid='PatientResponseThreadPanel']").waitFor();
    await desktop.screenshot({ path: outputPath("259-attachment-thread-task-412-step-up.png"), fullPage: true });

    const mobile = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await openWorkspaceRoute(mobile, `${baseUrl}/workspace/task/task-311`, "WorkspaceTaskRoute");
    await ensureReferenceStackOpen(mobile);
    await mobile
      .locator("[data-artifact-id='artifact-task-311-voice-note']")
      .getByRole("button", { name: "Open governed viewer" })
      .dispatchEvent("click");
    await mobile.locator("[data-testid='ArtifactViewerStage']").waitFor();
    await mobile.screenshot({ path: outputPath("259-attachment-thread-mobile.png"), fullPage: true });
    await assertNoHorizontalOverflow(mobile, "259 artifact thread mobile visual");
    await mobile.close();
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
