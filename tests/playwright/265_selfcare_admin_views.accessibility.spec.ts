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

async function selectConsequenceRow(page: any, taskId: string) {
  await page
    .locator(`[data-testid='ConsequenceWorkbenchRow'][data-task-id='${taskId}'] .staff-shell__consequence-row-main`)
    .click();
  await page.waitForFunction(
    (selectedTaskId) =>
      document
        .querySelector(`[data-testid='ConsequenceWorkbenchRow'][data-task-id='${selectedTaskId}']`)
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
    await openWorkspaceRoute(page, `${baseUrl}/workspace/consequences?state=live`, "WorkspaceConsequencesRoute");
    await page.locator("[data-testid='SelfCareAdminViewsRoute']").waitFor();

    assertCondition(
      (await page.locator("[aria-label='Consequence worklist']").count()) === 1,
      "consequence worklist should keep its aria-label",
    );

    await tabUntil(
      page,
      async () =>
        await page.evaluate(() => {
          const active = document.activeElement as HTMLElement | null;
          return active?.closest("[data-testid='ConsequenceWorkbenchRow']") != null;
        }),
      40,
      "the consequence worklist",
    );

    await tabUntil(
      page,
      async () =>
        await page.evaluate(() => {
          const active = document.activeElement as HTMLElement | null;
          return active?.getAttribute("aria-label") === "Self-care confirmation draft";
        }),
      40,
      "the self-care confirmation draft field",
    );

    assertCondition(
      (await page.getByText("Informational advice only. This path may not imply bounded admin completion.").count()) >= 1,
      "self-care boundary cue should remain visible for orientation",
    );

    await selectConsequenceRow(page, "task-507");
    await tabUntil(
      page,
      async () =>
        await page.evaluate(() => {
          const active = document.activeElement as HTMLElement | null;
          return active?.closest("[data-testid='AdminResolutionStage']") != null;
        }),
      40,
      "the admin resolution stage",
    );

    const headings = await page.locator("main h1, main h2, main h3").allTextContents();
    for (const required of [
      "Self-care and bounded admin consequence",
      "Dependency and reopen fence",
      "What the patient will see",
    ]) {
      assertCondition(headings.some((heading) => heading.includes(required)), `missing heading: ${required}`);
    }

    await selectConsequenceRow(page, "task-118");
    assertCondition(
      await page.getByText("Preserve context, freeze stale consequence").isVisible(),
      "boundary drift recovery heading should stay visible for reduced-motion recovery",
    );

    await writeAccessibilitySnapshot(page, "265-selfcare-admin-accessibility-snapshot.json");
    await page.screenshot({ path: outputPath("265-selfcare-admin-accessibility.png"), fullPage: true });
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
