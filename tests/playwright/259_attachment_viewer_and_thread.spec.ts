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

export const attachmentViewerAndThreadCoverage = [
  "attachment digest opens governed viewer in place",
  "audio artifact hydrates through chunked loading without leaving the shell",
  "older chronology focus publishes a resettable thread anchor",
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
    await page.locator("[data-testid='reference-stack'] summary").click();
    await page.locator("[data-testid='AttachmentDigestGrid']").waitFor();
    await page.locator("[data-testid='PatientResponseThreadPanel']").waitFor();

    const threadPanel = page.locator("[data-testid='PatientResponseThreadPanel']");
    assertCondition(
      (await threadPanel.getAttribute("data-preview-mode")) === "authenticated_summary",
      "task-311 thread should stay in authenticated summary mode",
    );

    const imageCard = page.locator("[data-artifact-id='artifact-task-311-inhaler-photo']");
    await imageCard.getByRole("button", { name: "Open governed viewer" }).click();
    const viewer = page.locator("[data-testid='ArtifactViewerStage']");
    await viewer.waitFor();
    assertCondition(
      (await viewer.getAttribute("data-viewer-state")) === "ready",
      "image viewer should hydrate immediately",
    );

    const audioCard = page.locator("[data-artifact-id='artifact-task-311-voice-note']");
    await audioCard.getByRole("button", { name: "Open governed viewer" }).click();
    await page.locator("[data-testid='ArtifactViewerStage'][data-viewer-state='chunking']").waitFor();
    await page.locator("[data-testid='ArtifactViewerStage'][data-viewer-state='ready']").waitFor();

    const documentCard = page.locator("[data-artifact-id='artifact-task-311-pharmacy-transcript']");
    await documentCard.getByRole("button", { name: "Open governed placeholder" }).click();
    assertCondition(
      (await viewer.getAttribute("data-viewer-state")) === "placeholder_only",
      "heavy transcript should fall back to placeholder-only mode",
    );

    const replyRow = page.locator("[data-row-id='thread-event-task-311-reply']");
    await replyRow.getByRole("button", { name: "Focus anchor" }).click();
    const anchorStub = page.locator("[data-testid='ThreadAnchorStub']");
    await anchorStub.waitFor();
    assertCondition(
      ((await anchorStub.textContent()) || "").toLowerCase().includes("patient reply accepted for late review"),
      "thread anchor stub should describe the selected older event",
    );

    await page.getByRole("button", { name: "Return to latest chronology" }).click();
    assertCondition((await page.locator("[data-testid='ThreadAnchorStub']").count()) === 0, "thread anchor stub did not reset");

    await assertNoHorizontalOverflow(page, "259 attachment viewer desktop");
    assertCondition(externalRequests.size === 0, `unexpected external requests: ${Array.from(externalRequests).join(", ")}`);
    await page.screenshot({ path: outputPath("259-attachment-viewer-and-thread-desktop.png"), fullPage: true });
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
