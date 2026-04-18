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

export const rapidEntryAndReasoningCoverage = [
  "quick capture tray autosaves locally without implying send",
  "more-info child route resumes the active cycle in the same shell",
  "endpoint shortcuts and reasoning stage stay inside the active dock",
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
    await page.locator("[data-testid='QuickCaptureTray']").waitFor();
    await page.getByRole("button", { name: "Pharmacy clarification" }).click();
    assertCondition(
      (await page.locator("[data-testid='decision-dock']").getAttribute("data-dominant-action")) ===
        "Issue more-info follow-up",
      "endpoint shortcut did not retarget the dominant decision preview",
    );

    await page.getByRole("option", { name: "Pharmacy callback" }).click();
    await page.getByLabel("Rapid entry note").fill("Cycle must stay attached to the current inhaler clarification.");
    await page.waitForTimeout(320);
    assertCondition(
      (await page.locator("[data-testid='QuickCaptureTray']").getAttribute("data-autosave-state")) === "saved",
      "quick capture tray did not acknowledge local autosave",
    );
    assertCondition(
      (await page.locator("[data-testid='task-status-strip']").getAttribute("data-local-ack-state")) === "saved",
      "status strip did not receive the local autosave acknowledgement",
    );

    const root = page.locator("[data-testid='WorkspaceShellRouteFamily']");
    const shellKey = await root.getAttribute("data-workspace-shell-continuity-key");

    await page.getByRole("button", { name: "More-info child route" }).click();
    await page.waitForURL(`${baseUrl}/workspace/task/task-311/more-info`);
    await page.locator("[data-testid='MoreInfoInlineSideStage']").waitFor();
    assertCondition(
      (await page.locator("[data-testid='MoreInfoInlineSideStage']").getAttribute("data-cycle-mode")) === "resume_existing",
      "more-info side stage did not resume the active cycle",
    );
    assertCondition(
      ((await page.locator("[data-testid='QuestionSetPicker'] [role='option'][aria-selected='true']").textContent()) || "").includes(
        "Pharmacy callback",
      ),
      "question-set selection did not survive the same-shell child-route transition",
    );
    assertCondition(
      (await root.getAttribute("data-workspace-shell-continuity-key")) === shellKey,
      "more-info child route replaced shell continuity",
    );

    await page.getByRole("button", { name: "Decision child route" }).click();
    await page.waitForURL(`${baseUrl}/workspace/task/task-311/decision`);
    await page.locator("[data-testid='EndpointReasoningStage']").waitFor();
    await page.locator("[data-testid='ConsequencePreviewSurface']").waitFor();

    await assertNoHorizontalOverflow(page, "258 reasoning dock desktop");
    assertCondition(externalRequests.size === 0, `unexpected external requests: ${Array.from(externalRequests).join(", ")}`);
    await page.screenshot({ path: outputPath("258-rapid-entry-and-reasoning-desktop.png"), fullPage: true });
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
