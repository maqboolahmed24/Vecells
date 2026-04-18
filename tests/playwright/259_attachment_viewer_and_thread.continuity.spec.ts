import {
  assertCondition,
  importPlaywright,
  openWorkspaceRoute,
  outputPath,
  startClinicalWorkspace,
  stopClinicalWorkspace,
} from "./255_workspace_shell_helpers";

export const attachmentViewerAndThreadContinuityCoverage = [
  "attachment viewer survives task child-route transitions",
  "thread anchor survives task child-route transitions",
  "workspace shell continuity key remains stable across task child-route history",
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

    const root = page.locator("[data-testid='WorkspaceShellRouteFamily']");
    const continuityKey = await root.getAttribute("data-workspace-shell-continuity-key");
    const anchorRef = await root.getAttribute("data-selected-anchor-ref");
    assertCondition(Boolean(continuityKey), "workspace continuity key missing");
    assertCondition(Boolean(anchorRef), "selected anchor ref missing");

    await page.locator("[data-testid='reference-stack'] summary").click();
    await page
      .locator("[data-artifact-id='artifact-task-311-inhaler-photo']")
      .getByRole("button", { name: "Open governed viewer" })
      .click();
    await page.locator("[data-testid='ArtifactViewerStage']").waitFor();
    await page
      .locator("[data-row-id='thread-event-task-311-reminder']")
      .getByRole("button", { name: "Focus anchor" })
      .click();
    await page.locator("[data-testid='ThreadAnchorStub']").waitFor();

    await page.getByRole("button", { name: "Decision child route" }).click();
    await page.waitForURL(`${baseUrl}/workspace/task/task-311/decision`);
    await page.locator("[data-testid='WorkspaceDecisionChildRoute']").waitFor();
    assertCondition(
      (await root.getAttribute("data-workspace-shell-continuity-key")) == continuityKey,
      "decision child route replaced shell continuity",
    );
    assertCondition(
      (await root.getAttribute("data-selected-anchor-ref")) == anchorRef,
      "decision child route replaced the selected anchor",
    );
    assertCondition(
      (await page.locator("[data-testid='ArtifactViewerStage']").getAttribute("data-artifact-id")) ===
        "artifact-task-311-inhaler-photo",
      "artifact viewer selection did not survive the decision child route",
    );
    assertCondition((await page.locator("[data-testid='ThreadAnchorStub']").count()) === 1, "thread anchor did not survive the decision child route");

    await page.goBack({ waitUntil: "networkidle" });
    await page.locator("[data-testid='WorkspaceTaskRoute']").waitFor();
    assertCondition(
      (await root.getAttribute("data-workspace-shell-continuity-key")) == continuityKey,
      "history back replaced shell continuity",
    );
    assertCondition((await page.locator("[data-testid='ArtifactViewerStage']").count()) === 1, "artifact viewer state did not survive history back");
    assertCondition((await page.locator("[data-testid='ThreadAnchorStub']").count()) === 1, "thread anchor state did not survive history back");

    await page.screenshot({ path: outputPath("259-attachment-thread-continuity.png"), fullPage: true });
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
