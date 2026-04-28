import {
  assertCondition,
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
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      locale: "en-GB",
      timezoneId: "Europe/London",
    });
    const page = await context.newPage();
    const root = page.locator("[data-testid='pharmacy-shell-root']");

    await openWorkspacePharmacyRoute(
      page,
      workspacePharmacyUrl(baseUrl, "/workspace/pharmacy/PHC-2244/handoff"),
    );
    await waitForWorkspacePharmacyState(page, {
      currentPath: "/workspace/pharmacy/PHC-2244/handoff",
      layoutMode: "mission_stack",
      breakpointClass: "compact",
      routeKey: "handoff",
      selectedCaseId: "PHC-2244",
      recoveryPosture: "read_only",
    });

    assertCondition(
      await page.getByTestId("PharmacyRecoveryStrip").isVisible(),
      "Read-only handoff posture must compress into the recovery strip.",
    );
    assertCondition(
      await page.getByTestId("PharmacyContinuityFrozenOverlay").isVisible(),
      "Frozen routes must render an in-place continuity overlay.",
    );
    assertCondition(
      (await root.getAttribute("data-continuity-overlay-state")) === "visible",
      "Shell root must expose visible continuity overlay state.",
    );

    await page.getByTestId("pharmacy-continuity-overlay-action").click();
    await waitForWorkspacePharmacyState(page, {
      currentPath: "/workspace/pharmacy/PHC-2244/assurance",
      layoutMode: "mission_stack",
      breakpointClass: "compact",
      routeKey: "assurance",
      selectedCaseId: "PHC-2244",
      recoveryPosture: "read_only",
    });
    assertCondition(
      (await root.getAttribute("data-support-region-resume-state")) === "expanded",
      "Opening recovery from a frozen route must keep the promoted support region expanded.",
    );

    await openWorkspacePharmacyRoute(
      page,
      workspacePharmacyUrl(baseUrl, "/workspace/pharmacy/PHC-2103"),
    );
    await waitForWorkspacePharmacyState(page, {
      currentPath: "/workspace/pharmacy/PHC-2103",
      layoutMode: "mission_stack",
      breakpointClass: "compact",
      routeKey: "case",
      selectedCaseId: "PHC-2103",
      recoveryPosture: "recovery_only",
    });
    assertCondition(
      await page.getByTestId("PharmacyWatchWindowReentryBanner").isVisible(),
      "Urgent return posture must surface the watch-window reentry banner inside the same shell.",
    );
    assertCondition(
      (await root.getAttribute("data-watch-window-reentry-state")) === "visible",
      "Shell root must expose visible watch-window reentry state.",
    );

    await page
      .getByTestId("pharmacy-watch-window-reentry-action")
      .evaluate((button: HTMLButtonElement) =>
        button.scrollIntoView({ block: "center", behavior: "auto" }),
      );
    await page.getByTestId("pharmacy-watch-window-reentry-action").click();
    await waitForWorkspacePharmacyState(page, {
      currentPath: "/workspace/pharmacy/PHC-2103/assurance",
      layoutMode: "mission_stack",
      breakpointClass: "compact",
      routeKey: "assurance",
      selectedCaseId: "PHC-2103",
      recoveryPosture: "recovery_only",
    });
    assertCondition(
      await page.getByTestId("PharmacyRecoveryDecisionDock").isVisible(),
      "Urgent return recovery route must keep the recovery decision dock dominant.",
    );

    await context.close();
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
