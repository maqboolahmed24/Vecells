import {
  assertCondition,
  assertNoHorizontalOverflow,
  importPlaywright,
  openWorkspaceRoute,
  outputPath,
  startClinicalWorkspace,
  stopClinicalWorkspace,
} from "./255_workspace_shell_helpers";

async function selectMessageRow(page: any, taskId: string) {
  await page
    .locator(`[data-testid='ClinicianMessageWorklistRow'][data-task-id='${taskId}'] .staff-shell__message-row-main`)
    .click();
  await page.waitForFunction(
    (selectedTaskId) =>
      document
        .querySelector(`[data-testid='ClinicianMessageWorklistRow'][data-task-id='${selectedTaskId}']`)
        ?.getAttribute("data-selected") === "true",
    taskId,
  );
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
    await openWorkspaceRoute(desktop, `${baseUrl}/workspace/messages?state=live`, "WorkspaceMessagesRoute");
    await selectMessageRow(desktop, "task-311");
    await desktop.screenshot({ path: outputPath("264-clinician-message-repair-desktop.png"), fullPage: true });

    await selectMessageRow(desktop, "task-412");
    await desktop.locator("[data-testid='MessageThreadMasthead']").getByRole("button", { name: "Delivery dispute review" }).click();
    await desktop.waitForFunction(
      () => document.querySelector("[data-testid='ClinicianMessageDetailSurface']")?.getAttribute("data-dispute-stage") === "dispute",
    );
    await desktop.screenshot({ path: outputPath("264-clinician-message-repair-dispute.png"), fullPage: true });

    await selectMessageRow(desktop, "task-118");
    await desktop.locator("[data-testid='MessageThreadMasthead']").getByRole("button", { name: "Repair workbench" }).click();
    await desktop.waitForFunction(
      () => document.querySelector("[data-testid='ClinicianMessageDetailSurface']")?.getAttribute("data-dispute-stage") === "repair",
    );
    await desktop.screenshot({ path: outputPath("264-clinician-message-repair-attachment.png"), fullPage: true });

    const stale = await browser.newPage({ viewport: { width: 1480, height: 1080 } });
    await stale.emulateMedia({ reducedMotion: "reduce" });
    await openWorkspaceRoute(stale, `${baseUrl}/workspace/messages?state=stale`, "WorkspaceMessagesRoute");
    await selectMessageRow(stale, "task-208");
    assertCondition(
      (await stale.locator("[data-testid='ClinicianMessageDetailSurface']").getAttribute("data-mutation-state")) ===
        "stale_recoverable",
      "stale route should preserve the message surface in stale-recoverable posture",
    );
    await assertNoHorizontalOverflow(stale, "264 clinician message repair stale");
    await stale.screenshot({ path: outputPath("264-clinician-message-repair-stale.png"), fullPage: true });

    const mobile = await browser.newPage({ viewport: { width: 430, height: 980 } });
    await mobile.emulateMedia({ reducedMotion: "reduce" });
    await openWorkspaceRoute(mobile, `${baseUrl}/workspace/messages?state=blocked`, "WorkspaceMessagesRoute");
    await selectMessageRow(mobile, "task-412");
    await mobile.locator("[data-testid='MessageThreadMasthead']").getByRole("button", { name: "Repair workbench" }).click();
    await mobile.waitForFunction(
      () => document.querySelector("[data-testid='ClinicianMessageDetailSurface']")?.getAttribute("data-dispute-stage") === "repair",
    );
    assertCondition(
      (await mobile.locator("[data-testid='MessageRepairWorkbench']").getAttribute("data-stage-state")) === "blocked",
      "blocked route should keep the repair workbench visible but frozen",
    );
    await assertNoHorizontalOverflow(mobile, "264 clinician message repair mobile");
    await mobile.screenshot({ path: outputPath("264-clinician-message-repair-mobile.png"), fullPage: true });
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
