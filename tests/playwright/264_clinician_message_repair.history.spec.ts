import {
  assertCondition,
  importPlaywright,
  openWorkspaceRoute,
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
    const page = await browser.newPage({ viewport: { width: 1440, height: 960 } });
    await openWorkspaceRoute(page, `${baseUrl}/workspace/messages?state=live`, "WorkspaceMessagesRoute");

    await selectMessageRow(page, "task-412");
    await page
      .locator("[data-testid='ClinicianMessageChronologyEvent'] .staff-shell__message-event-main")
      .nth(1)
      .click();
    const root = page.locator("[data-testid='WorkspaceShellRouteFamily']");
    await page.waitForFunction(
      () =>
        document
          .querySelector("[data-testid='WorkspaceShellRouteFamily']")
          ?.getAttribute("data-selected-anchor-ref")
          ?.startsWith("message-event-") === true,
    );
    const anchorBeforeReload = await root.getAttribute("data-selected-anchor-ref");

    await page.locator("[data-testid='MessageThreadMasthead']").getByRole("button", { name: "Repair workbench" }).click();
    await page.waitForFunction(
      () =>
        document.querySelector("[data-testid='ClinicianMessageDetailSurface']")?.getAttribute("data-dispute-stage") ===
        "repair",
    );
    assertCondition(
      (await page.locator("[data-testid='ClinicianMessageDetailSurface']").getAttribute("data-dispute-stage")) ===
        "repair",
      "repair stage should promote in-shell rather than leaving the message route",
    );

    await page.reload({ waitUntil: "networkidle" });
    await page.locator("[data-testid='ClinicianMessageThreadSurface']").waitFor();
    assertCondition(
      (await page.locator("[data-testid='ClinicianMessageWorklistRow'][data-task-id='task-412']").getAttribute("data-selected")) ===
        "true",
      "reload should preserve the selected message row",
    );
    assertCondition(
      (await root.getAttribute("data-selected-anchor-ref")) === anchorBeforeReload,
      "reload should preserve the selected chronology anchor",
    );
    assertCondition(
      (await page.locator("[data-testid='ClinicianMessageDetailSurface']").getAttribute("data-dispute-stage")) ===
        "repair",
      "reload should preserve the repair stage posture",
    );

    await page
      .locator("[data-testid='ClinicianMessageWorklistRow'][data-task-id='task-412'] .staff-shell__utility-button")
      .click();
    await page.waitForURL(`${baseUrl}/workspace/task/task-412`);
    await page.goBack({ waitUntil: "networkidle" });
    await page.locator("[data-testid='ClinicianMessageThreadSurface']").waitFor();
    assertCondition(
      (await page.locator("[data-testid='ClinicianMessageWorklistRow'][data-task-id='task-412']").getAttribute("data-selected")) ===
        "true",
      "back navigation should restore the selected message row",
    );
    assertCondition(
      (await root.getAttribute("data-selected-anchor-ref")) === anchorBeforeReload,
      "back navigation should restore the selected chronology anchor",
    );
    assertCondition(
      (await page.locator("[data-testid='ClinicianMessageDetailSurface']").getAttribute("data-dispute-stage")) ===
        "repair",
      "back navigation should restore the repair stage posture",
    );

    await page.goForward({ waitUntil: "networkidle" });
    await page.locator("[data-testid='WorkspaceTaskRoute']").waitFor();
    assertCondition(
      new URL(page.url()).pathname === "/workspace/task/task-412" &&
        ((await page.locator("[data-testid='ActiveTaskShell']").getAttribute("data-opening-mode")) ?? "") !== "",
      "forward navigation should return to the same task shell rather than a detached message page",
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
