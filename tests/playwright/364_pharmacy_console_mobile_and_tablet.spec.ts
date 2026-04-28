import {
  assertCondition,
  assertNoHorizontalOverflow,
  importPlaywright,
  openWorkspacePharmacyRoute,
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

    const tabletRoot = tabletPage.locator("[data-testid='pharmacy-shell-root']");
    assertCondition(
      (await tabletRoot.getAttribute("data-sticky-dock-mode")) === "bottom_sticky",
      "Tablet mission stack must move the decision dock into the bottom sticky region.",
    );
    assertCondition(
      (await tabletRoot.getAttribute("data-support-region-resume-state")) === "collapsed",
      "Case routes should start with a collapsed support-region resume card in mission_stack.",
    );

    await tabletPage
      .getByTestId("pharmacy-support-region-toggle")
      .evaluate((button: HTMLButtonElement) =>
        button.scrollIntoView({ block: "center", behavior: "auto" }),
      );
    await tabletPage.getByTestId("pharmacy-support-region-toggle").click();
    await tabletPage.waitForFunction(
      () =>
        document
          .querySelector("[data-testid='pharmacy-shell-root']")
          ?.getAttribute("data-support-region-resume-state") === "expanded",
    );
    assertCondition(
      (await tabletRoot.getAttribute("data-support-region-resume-state")) === "expanded",
      "Tablet mission stack must reopen the support region in-place.",
    );

    await tabletPage.getByTestId("pharmacy-mission-stack-queue-toggle").click();
    await tabletPage.locator("[data-testid='PharmacyQueuePeekDrawer'][data-open='true']").waitFor();
    await tabletPage.getByTestId("pharmacy-queue-peek-close").click();
    await tabletPage.waitForFunction(
      () =>
        document.activeElement?.getAttribute("data-testid") ===
        "pharmacy-mission-stack-queue-toggle",
    );
    assertCondition(
      (await tabletPage.evaluate(() => document.activeElement?.getAttribute("data-testid"))) ===
        "pharmacy-mission-stack-queue-toggle",
      "Closing the queue peek drawer must return focus to the queue trigger.",
    );
    await tabletContext.close();

    const mobileContext = await browser.newContext({
      viewport: { width: 320, height: 800 },
      locale: "en-GB",
      timezoneId: "Europe/London",
    });
    const mobilePage = await mobileContext.newPage();

    await openWorkspacePharmacyRoute(
      mobilePage,
      workspacePharmacyUrl(baseUrl, "/workspace/pharmacy/PHC-2048/inventory"),
    );
    await waitForWorkspacePharmacyState(mobilePage, {
      currentPath: "/workspace/pharmacy/PHC-2048/inventory",
      layoutMode: "mission_stack",
      breakpointClass: "compact",
      routeKey: "inventory",
      selectedCaseId: "PHC-2048",
      recoveryPosture: "live",
    });

    await assertNoHorizontalOverflow(mobilePage, "364 pharmacy mission stack mobile");
    const mobileRoot = mobilePage.locator("[data-testid='pharmacy-shell-root']");
    assertCondition(
      (await mobileRoot.getAttribute("data-fold-state")) === "folded",
      "Mobile root must expose folded mission-stack state.",
    );
    assertCondition(
      await mobilePage.getByTestId("PharmacyMissionStackDock").isVisible(),
      "Mobile mission stack must keep the bottom dock visible.",
    );
    assertCondition(
      await mobilePage.getByTestId("PharmacySupportRegionResumeCard").isVisible(),
      "Mobile mission stack must preserve the promoted support region resume card.",
    );
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
