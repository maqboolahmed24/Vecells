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

async function openProtectedMoreInfo(page: any, baseUrl: string) {
  await openWorkspaceRoute(page, `${baseUrl}/workspace/queue/recommended?state=live`, "WorkspaceQueueRoute");
  await page.locator("article:has([data-task-id='task-311']) .staff-shell__queue-open-button").click();
  await page.waitForURL(`${baseUrl}/workspace/task/task-311`);
  await page.getByRole("button", { name: "More-info child route" }).click();
  await page.waitForURL(`${baseUrl}/workspace/task/task-311/more-info`);
  await page.waitForFunction(() =>
    document.querySelector("[data-testid='ActiveTaskShell']")?.getAttribute("data-protected-composition") ===
    "composing",
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
    await openProtectedMoreInfo(page, baseUrl);

    await tabUntil(
      page,
      async () =>
        await page.evaluate(() => {
          const active = document.activeElement as HTMLElement | null;
          return active?.closest("[data-testid='WorkspaceProtectionStrip']") != null;
        }),
      80,
      "the workspace protection strip",
    );

    await tabUntil(
      page,
      async () =>
        await page.evaluate(() => {
          const active = document.activeElement as HTMLElement | null;
          return active?.closest("[data-testid='BufferedQueueChangeTray']") != null;
        }),
      40,
      "the buffered queue tray",
    );

    assertCondition(
      await page.locator("[data-testid='DepartureReturnStub']").isVisible(),
      "departure return stub should stay visible for non-pointer orientation",
    );

    const headings = await page.locator("main h1, main h2, main h3").allTextContents();
    assertCondition(
      headings.some((heading) => heading.includes("Completion calmness")),
      "262 heading hierarchy drifted",
    );

    await writeAccessibilitySnapshot(page, "262-focus-protection-accessibility-snapshot.json");
    await page.screenshot({ path: outputPath("262-focus-protection-accessibility.png"), fullPage: true });
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
