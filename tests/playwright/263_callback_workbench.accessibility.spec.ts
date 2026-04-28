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

async function selectCallbackRow(page: any, taskId: string) {
  await page
    .locator(`[data-testid='CallbackWorklistRow'][data-task-id='${taskId}'] .staff-shell__callback-row-main`)
    .click();
  await page.waitForFunction(
    (selectedTaskId) =>
      document
        .querySelector(`[data-testid='CallbackWorklistRow'][data-task-id='${selectedTaskId}']`)
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
    await openWorkspaceRoute(page, `${baseUrl}/workspace/callbacks?state=live`, "WorkspaceCallbacksRoute");
    await selectCallbackRow(page, "task-208");

    assertCondition(
      (await page.locator(".staff-shell__callback-filter-group").getAttribute("aria-label")) === "Callback filters",
      "callback filter group should keep its aria-label",
    );

    await tabUntil(
      page,
      async () =>
        await page.evaluate(() => {
          const active = document.activeElement as HTMLElement | null;
          return active?.closest("[data-testid='CallbackWorklistRoute']") != null;
        }),
      40,
      "the callback route filter rail",
    );

    await tabUntil(
      page,
      async () =>
        await page.evaluate(() => {
          const active = document.activeElement as HTMLElement | null;
          return active?.closest("[data-testid='CallbackAttemptTimeline']") != null;
        }),
      40,
      "the callback attempt timeline",
    );

    await tabUntil(
      page,
      async () =>
        await page.evaluate(() => {
          const active = document.activeElement as HTMLElement | null;
          return active?.closest("[data-testid='CallbackOutcomeCapture']") != null;
        }),
      40,
      "the callback outcome capture stage",
    );

    const headings = await page.locator("main h1, main h2, main h3").allTextContents();
    for (const required of [
      "Callback workbench",
      "Current patient promise",
      "Attempt ladder",
      "Outcome evidence and legal next step",
    ]) {
      assertCondition(headings.some((heading) => heading.includes(required)), `missing heading: ${required}`);
    }

    assertCondition(
      await page.getByText("Voicemail is not calm completion").isVisible(),
      "voicemail caution text should remain visible for keyboard and reduced-motion orientation",
    );

    await writeAccessibilitySnapshot(page, "263-callback-workbench-accessibility-snapshot.json");
    await page.screenshot({ path: outputPath("263-callback-workbench-accessibility.png"), fullPage: true });
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
