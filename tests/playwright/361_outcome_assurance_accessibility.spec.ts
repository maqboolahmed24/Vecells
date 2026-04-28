import {
  assertCondition,
  assertNoHorizontalOverflow,
  importPlaywright,
  openWorkspacePharmacyRoute,
  startPharmacyConsole,
  stopPharmacyConsole,
  waitForWorkspacePharmacyState,
  workspacePharmacyUrl,
  writeAccessibilitySnapshot,
} from "./356_pharmacy_shell.helpers.ts";

async function tabToTestId(page: any, testId: string, maxTabs = 30): Promise<void> {
  for (let index = 0; index < maxTabs; index += 1) {
    await page.keyboard.press("Tab");
    const activeTestId = await page.evaluate(() =>
      document.activeElement?.getAttribute("data-testid") ?? "",
    );
    if (activeTestId === testId) {
      return;
    }
  }
  throw new Error(`Unable to reach ${testId} with keyboard navigation.`);
}

export async function run(): Promise<void> {
  const playwright = await importPlaywright();
  if (!playwright) {
    return;
  }

  const { child: pharmacyChild, baseUrl } = await startPharmacyConsole();
  const browser = await playwright.chromium.launch({ headless: true });

  try {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      locale: "en-GB",
      timezoneId: "Europe/London",
      reducedMotion: "reduce",
    });
    const page = await context.newPage();

    await openWorkspacePharmacyRoute(
      page,
      workspacePharmacyUrl(baseUrl, "/workspace/pharmacy/PHC-2168/assurance"),
    );
    await waitForWorkspacePharmacyState(page, {
      currentPath: "/workspace/pharmacy/PHC-2168/assurance",
      routeKey: "assurance",
      selectedCaseId: "PHC-2168",
    });

    await assertNoHorizontalOverflow(page, "361 assurance mobile reduced");
    assertCondition(
      (await page.locator("header[role='banner']").count()) === 1,
      "Assurance route should expose exactly one banner landmark.",
    );
    assertCondition(
      (await page.locator("main[role='main']").count()) === 1,
      "Assurance route should expose exactly one main landmark.",
    );

    await tabToTestId(page, "outcome-evidence-drawer-toggle");
    const drawerToggle = page.getByTestId("outcome-evidence-drawer-toggle");
    assertCondition(
      (await drawerToggle.getAttribute("aria-expanded")) === "true",
      "Unmatched evidence drawer should begin open and expose aria-expanded.",
    );
    assertCondition(
      Boolean(await drawerToggle.getAttribute("aria-controls")),
      "Evidence drawer toggle must expose aria-controls.",
    );
    await drawerToggle.press("Space");
    assertCondition(
      (await drawerToggle.getAttribute("aria-expanded")) === "false",
      "Evidence drawer toggle must be keyboard operable.",
    );

    assertCondition(
      (await page.locator("[data-testid='OutcomeManualReviewBanner'][role='alert']").count()) === 1,
      "Unmatched assurance must announce the review blocker as an alert.",
    );
    assertCondition(
      (await page.locator(".pharmacy-outcome-assurance__header[role='status']").count()) === 1,
      "Assurance header must expose one polite status region.",
    );
    await writeAccessibilitySnapshot(page, "361-outcome-assurance-a11y.json");

    await context.close();
  } finally {
    await browser.close();
    await stopPharmacyConsole(pharmacyChild);
  }
}

if (process.argv.includes("--run")) {
  run().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
