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

async function tabToTestId(page: any, testId: string, maxTabs = 60): Promise<void> {
  for (let index = 0; index < maxTabs; index += 1) {
    await page.keyboard.press("Tab");
    const activeTestId = await page.evaluate(
      () => document.activeElement?.getAttribute("data-testid") ?? "",
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

    await openWorkspacePharmacyRoute(page, workspacePharmacyUrl(baseUrl));
    await waitForWorkspacePharmacyState(page, {
      currentPath: "/workspace/pharmacy",
      routeKey: "lane",
      layoutMode: "mission_stack",
    });

    await assertNoHorizontalOverflow(page, "363 workbench mobile reduced");
    assertCondition(
      (await page.locator("header[role='banner']").count()) === 1,
      "Workbench shell should expose exactly one banner landmark.",
    );
    assertCondition(
      (await page.locator("main[role='main']").count()) === 1,
      "Workbench shell should expose exactly one main landmark.",
    );
    assertCondition(
      (
        await page
          .getByTestId("PharmacyOperationsQueueTable")
          .locator("table caption")
          .textContent()
      )?.includes("queue remains dense") ?? false,
      "Queue table must keep a caption for dense scanning.",
    );

    await tabToTestId(page, "pharmacy-case-PHC-2232");
    await page.keyboard.press("Enter");
    await waitForWorkspacePharmacyState(page, {
      currentPath: "/workspace/pharmacy/PHC-2232",
      routeKey: "case",
      selectedCaseId: "PHC-2232",
      layoutMode: "mission_stack",
    });

    assertCondition(
      (await page.locator("[data-testid='PharmacyWatchWindowBanner'][role='status']").count()) === 1,
      "Watch-only case route must expose a polite watch-window status banner.",
    );

    await tabToTestId(page, "pharmacy-route-button-inventory");
    await page.keyboard.press("Space");
    await waitForWorkspacePharmacyState(page, {
      currentPath: "/workspace/pharmacy/PHC-2232/inventory",
      routeKey: "inventory",
      selectedCaseId: "PHC-2232",
      layoutMode: "mission_stack",
    });

    assertCondition(
      await page.getByTestId("InventoryComparisonWorkspace").isVisible(),
      "Keyboard travel must reach the inventory comparison support region.",
    );
    await tabToTestId(page, "pharmacy-primary-route-button");
    assertCondition(
      (await page.evaluate(() => document.activeElement?.getAttribute("data-testid"))) ===
        "pharmacy-primary-route-button",
      "Keyboard travel must reach the primary decision dock action.",
    );

    await writeAccessibilitySnapshot(page, "363-pharmacy-workbench-a11y.json");
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
