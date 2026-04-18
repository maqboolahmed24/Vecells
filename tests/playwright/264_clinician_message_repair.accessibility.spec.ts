import {
  assertCondition,
  importPlaywright,
  openWorkspaceRoute,
  outputPath,
  startClinicalWorkspace,
  stopClinicalWorkspace,
  writeAccessibilitySnapshot,
} from "./255_workspace_shell_helpers";

async function tabUntil(page: any, matcher: () => Promise<boolean>, maxTabs: number, description: string) {
  for (let step = 0; step < maxTabs; step += 1) {
    await page.keyboard.press("Tab");
    if (await matcher()) {
      return;
    }
  }
  throw new Error(`keyboard flow should reach ${description}`);
}

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
    const page = await browser.newPage({ viewport: { width: 1280, height: 960 } });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await openWorkspaceRoute(page, `${baseUrl}/workspace/messages?state=live`, "WorkspaceMessagesRoute");
    await selectMessageRow(page, "task-118");

    assertCondition(
      (await page.locator(".staff-shell__message-filter-group").getAttribute("aria-label")) ===
        "Clinician message filters",
      "message filter group should keep its aria-label",
    );

    await tabUntil(
      page,
      async () =>
        await page.evaluate(() => {
          const active = document.activeElement as HTMLElement | null;
          return active?.closest("[data-testid='ClinicianMessageThreadSurface']") != null;
        }),
      40,
      "the clinician message route surface",
    );

    await tabUntil(
      page,
      async () =>
        await page.evaluate(() => {
          const active = document.activeElement as HTMLElement | null;
          return active?.closest("[data-testid='ClinicianMessageChronologyEvent']") != null;
        }),
      40,
      "the chronology evidence plane",
    );

    await page.locator("[data-testid='MessageThreadMasthead']").getByRole("button", { name: "Repair workbench" }).click();
    await tabUntil(
      page,
      async () =>
        await page.evaluate(() => {
          const active = document.activeElement as HTMLElement | null;
          return active?.closest("[data-testid='MessageRepairWorkbench']") != null;
        }),
      40,
      "the message repair workbench",
    );

    const headings = await page.locator("main h1, main h2, main h3").allTextContents();
    for (const required of [
      "Clinician messaging thread",
      "Current delivery truth",
      "What this thread is attached to",
      "Recover attachment set before reissue",
    ]) {
      assertCondition(headings.some((heading) => heading.includes(required)), `missing heading: ${required}`);
    }

    assertCondition(
      await page.getByText("Transport and evidence stay separate").isVisible(),
      "truth-ladder guidance should remain visible for keyboard and reduced-motion orientation",
    );

    await writeAccessibilitySnapshot(page, "264-clinician-message-repair-accessibility-snapshot.json");
    await page.screenshot({ path: outputPath("264-clinician-message-repair-accessibility.png"), fullPage: true });
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
