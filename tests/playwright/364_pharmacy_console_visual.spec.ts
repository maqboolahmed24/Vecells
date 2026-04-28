import {
  assertCondition,
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

  const { child, baseUrl } = await startPharmacyConsole();
  const browser = await playwright.chromium.launch({ headless: true });

  try {
    const tabletContext = await browser.newContext({
      viewport: { width: 834, height: 1112 },
      locale: "en-GB",
      timezoneId: "Europe/London",
    });
    const tabletPage = await tabletContext.newPage();
    await openWorkspacePharmacyRoute(
      tabletPage,
      workspacePharmacyUrl(baseUrl, "/workspace/pharmacy/PHC-2048"),
    );
    await waitForWorkspacePharmacyState(tabletPage, {
      currentPath: "/workspace/pharmacy/PHC-2048",
      layoutMode: "mission_stack",
      breakpointClass: "narrow",
      routeKey: "case",
      selectedCaseId: "PHC-2048",
      recoveryPosture: "live",
    });
    assertCondition(
      (await tabletPage
        .getByTestId("PharmacyMissionStackController")
        .getAttribute("data-visual-mode")) === "Pharmacy_Mission_Stack_Recovery",
      "Mission stack controller must expose the 364 visual mode.",
    );
    await tabletPage.screenshot({
      path: outputPath("364-pharmacy-console-mission-stack-tablet.png"),
      fullPage: true,
    });
    await tabletContext.close();

    const mobileContext = await browser.newContext({
      viewport: { width: 390, height: 844 },
      locale: "en-GB",
      timezoneId: "Europe/London",
    });
    const mobilePage = await mobileContext.newPage();
    await openWorkspacePharmacyRoute(
      mobilePage,
      workspacePharmacyUrl(baseUrl, "/workspace/pharmacy/PHC-2103/assurance"),
    );
    await waitForWorkspacePharmacyState(mobilePage, {
      currentPath: "/workspace/pharmacy/PHC-2103/assurance",
      layoutMode: "mission_stack",
      breakpointClass: "compact",
      routeKey: "assurance",
      selectedCaseId: "PHC-2103",
      recoveryPosture: "recovery_only",
    });
    assertCondition(
      (await mobilePage
        .locator("[data-testid='PharmacyMissionStackDock']")
        .getAttribute("data-visual-mode")) === "Pharmacy_Mission_Stack_Recovery",
      "Mission stack dock must expose the 364 visual mode.",
    );
    await mobilePage.screenshot({
      path: outputPath("364-pharmacy-console-recovery-mobile.png"),
      fullPage: true,
    });
    await mobileContext.close();
  } finally {
    await browser.close();
    await stopPharmacyConsole(child);
  }
}

if (process.argv.includes("--run")) {
  run().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
