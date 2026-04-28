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
    await openWorkspaceRoute(page, `${baseUrl}/workspace/changed?state=live`, "WorkspaceChangedRoute");

    await tabUntil(
      page,
      async () =>
        await page.evaluate(() => {
          const active = document.activeElement as HTMLElement | null;
          return active?.className.includes("staff-shell__changed-row-main") ?? false;
        }),
      24,
      "the changed lane row",
    );

    await tabUntil(
      page,
      async () =>
        await page.evaluate(() => {
          const active = document.activeElement as HTMLElement | null;
          return active?.className.includes("staff-shell__changed-marker") ?? false;
        }),
      16,
      "the changed-region markers",
    );

    await tabUntil(
      page,
      async () =>
        await page.evaluate(() => {
          const active = document.activeElement as HTMLElement | null;
          return (active?.textContent || "").includes("superseded context");
        }),
      12,
      "the superseded-context toggle",
    );

    await tabUntil(
      page,
      async () =>
        await page.evaluate(() => {
          const active = document.activeElement as HTMLElement | null;
          return active?.className.includes("staff-shell__inline-action") ?? false;
        }),
      12,
      "the dominant gate action",
    );

    const headings = await page.locator("main h1, main h2, main h3").allTextContents();
    assertCondition(
      headings.some((heading) => heading.includes("Changed since seen")),
      "changed review heading hierarchy drifted",
    );

    await writeAccessibilitySnapshot(page, "261-changed-review-accessibility-snapshot.json");
    await page.screenshot({ path: outputPath("261-changed-review-accessibility.png"), fullPage: true });
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
