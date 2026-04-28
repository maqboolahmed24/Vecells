import {
  assertNoHorizontalOverflow,
  importPlaywright,
  openWorkspacePharmacyRoute,
  outputPath,
  startPharmacyConsole,
  stopPharmacyConsole,
  waitForWorkspacePharmacyState,
  workspacePharmacyUrl,
} from "./356_pharmacy_shell.helpers.ts";

export async function run(): Promise<void> {
  const playwright = await importPlaywright();
  if (!playwright) {
    return;
  }

  const { child: pharmacyChild, baseUrl } = await startPharmacyConsole();
  const browser = await playwright.chromium.launch({ headless: true });

  try {
    const desktop = await browser.newContext({
      viewport: { width: 1440, height: 1024 },
      locale: "en-GB",
      timezoneId: "Europe/London",
    });
    const page = await desktop.newPage();

    for (const [pathname, fileName, selectedCaseId, routeKey] of [
      ["/workspace/pharmacy", "363-pharmacy-queue-root.png", null, "lane"],
      ["/workspace/pharmacy/PHC-2232", "363-pharmacy-workbench-choice.png", "PHC-2232", "case"],
      ["/workspace/pharmacy/PHC-2124/inventory", "363-pharmacy-inventory-comparison.png", "PHC-2124", "inventory"],
      ["/workspace/pharmacy/PHC-2244/handoff", "363-pharmacy-handoff-outage.png", "PHC-2244", "handoff"],
    ] as const) {
      await openWorkspacePharmacyRoute(page, workspacePharmacyUrl(baseUrl, pathname));
      await waitForWorkspacePharmacyState(page, {
        currentPath: pathname,
        routeKey,
        ...(selectedCaseId ? { selectedCaseId } : {}),
      });
      await page.screenshot({
        path: outputPath(fileName),
        fullPage: true,
      });
    }
    await desktop.close();

    const mobile = await browser.newContext({
      viewport: { width: 390, height: 844 },
      locale: "en-GB",
      timezoneId: "Europe/London",
      reducedMotion: "reduce",
    });
    const mobilePage = await mobile.newPage();
    await openWorkspacePharmacyRoute(
      mobilePage,
      workspacePharmacyUrl(baseUrl, "/workspace/pharmacy/PHC-2244"),
    );
    await waitForWorkspacePharmacyState(mobilePage, {
      currentPath: "/workspace/pharmacy/PHC-2244",
      routeKey: "case",
      selectedCaseId: "PHC-2244",
      layoutMode: "mission_stack",
    });
    await assertNoHorizontalOverflow(mobilePage, "363 workbench visual mobile");
    await mobilePage.screenshot({
      path: outputPath("363-pharmacy-workbench-mobile.png"),
      fullPage: true,
    });
    await mobile.close();
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
