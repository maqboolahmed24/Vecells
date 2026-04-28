import {
  activeElementSummary,
  assertCondition,
  assertNoHorizontalOverflow,
  importPlaywright,
  openWorkspacePharmacyRoute,
  startPharmacyConsole,
  stopPharmacyConsole,
  waitForWorkspacePharmacyState,
  workspacePharmacyUrl,
} from "./365_pharmacy_accessibility.helpers.ts";

export async function run(): Promise<void> {
  const playwright = await importPlaywright();
  if (!playwright) {
    return;
  }

  const { child, baseUrl } = await startPharmacyConsole();
  const browser = await playwright.chromium.launch({ headless: true });

  try {
    const desktopContext = await browser.newContext({
      viewport: { width: 1366, height: 960 },
      locale: "en-GB",
      timezoneId: "Europe/London",
    });
    const desktopPage = await desktopContext.newPage();
    const root = desktopPage.locator("[data-testid='pharmacy-shell-root']");

    await openWorkspacePharmacyRoute(desktopPage, workspacePharmacyUrl(baseUrl));
    await waitForWorkspacePharmacyState(desktopPage, {
      currentPath: "/workspace/pharmacy",
      routeKey: "lane",
    });
    assertCondition(
      await desktopPage.getByTestId("PharmacyOperationsQueueTable").isVisible(),
      "Queue root must render the operations queue table.",
    );
    assertCondition(
      (await root.getAttribute("data-sticky-dock-mode")) === "aside",
      "Desktop console must keep the decision dock in aside mode.",
    );

    await desktopPage.getByTestId("pharmacy-case-PHC-2244").click();
    await waitForWorkspacePharmacyState(desktopPage, {
      currentPath: "/workspace/pharmacy/PHC-2244",
      routeKey: "case",
      selectedCaseId: "PHC-2244",
    });
    assertCondition(
      await desktopPage.getByTestId("PharmacyCaseWorkbench").isVisible(),
      "Queue row selection must morph into a same-shell case workbench.",
    );
    assertCondition(
      (await root.getAttribute("data-workbench-provider-health")) === "outage",
      "Provider outage case must expose outage health state.",
    );
    assertCondition(
      /outage|block/i.test((await root.getAttribute("data-workbench-handoff-state")) ?? ""),
      "Provider outage case must keep handoff blocked.",
    );
    assertCondition(
      await desktopPage.getByTestId("PharmacyWorkbenchDecisionDock").isVisible(),
      "Desktop case route must keep the workbench decision dock visible.",
    );

    await desktopPage.getByTestId("pharmacy-route-button-inventory").click();
    await waitForWorkspacePharmacyState(desktopPage, {
      currentPath: "/workspace/pharmacy/PHC-2244/inventory",
      routeKey: "inventory",
      selectedCaseId: "PHC-2244",
    });
    assertCondition(
      await desktopPage.getByTestId("InventoryComparisonWorkspace").isVisible(),
      "Inventory child route must render the comparison workspace.",
    );
    assertCondition(
      (await root.getAttribute("data-promoted-support-region")) === "inventory_comparison",
      "Inventory child route must promote the inventory comparison support region.",
    );

    await openWorkspacePharmacyRoute(
      desktopPage,
      workspacePharmacyUrl(baseUrl, "/workspace/pharmacy/PHC-2057/handoff"),
    );
    await waitForWorkspacePharmacyState(desktopPage, {
      currentPath: "/workspace/pharmacy/PHC-2057/handoff",
      routeKey: "handoff",
      selectedCaseId: "PHC-2057",
      recoveryPosture: "read_only",
    });
    assertCondition(
      await desktopPage.getByTestId("HandoffReadinessBoard").isVisible(),
      "Stale pending handoff must keep the readiness board visible.",
    );
    assertCondition(
      /pending/i.test((await root.getAttribute("data-workbench-handoff-state")) ?? ""),
      "PHC-2057 must remain release pending in handoff.",
    );

    await openWorkspacePharmacyRoute(
      desktopPage,
      workspacePharmacyUrl(baseUrl, "/workspace/pharmacy/PHC-2168/assurance"),
    );
    await waitForWorkspacePharmacyState(desktopPage, {
      currentPath: "/workspace/pharmacy/PHC-2168/assurance",
      routeKey: "assurance",
      selectedCaseId: "PHC-2168",
      recoveryPosture: "read_only",
    });
    assertCondition(
      (await root.getAttribute("data-assurance-outcome-truth-state")) === "unmatched",
      "Unmatched outcome must remain visible in assurance.",
    );
    assertCondition(
      (await root.getAttribute("data-assurance-gate-state")) === "open",
      "Unmatched outcome must keep the reconciliation gate open.",
    );
    assertCondition(
      await desktopPage.getByTestId("PharmacyOutcomeAssurancePanel").isVisible(),
      "Unmatched outcome must render the assurance panel.",
    );

    await openWorkspacePharmacyRoute(
      desktopPage,
      workspacePharmacyUrl(baseUrl, "/workspace/pharmacy/PHC-2215/assurance"),
    );
    await waitForWorkspacePharmacyState(desktopPage, {
      currentPath: "/workspace/pharmacy/PHC-2215/assurance",
      routeKey: "assurance",
      selectedCaseId: "PHC-2215",
      recoveryPosture: "recovery_only",
    });
    assertCondition(
      (await root.getAttribute("data-recovery-loop-risk-band")) === "critical",
      "Loop-risk case must expose critical recovery risk.",
    );
    assertCondition(
      await desktopPage.getByTestId("PharmacyRecoveryDecisionDock").isVisible(),
      "Loop-risk recovery must keep the recovery decision dock visible.",
    );
    await desktopContext.close();

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
      (await tabletRoot.getAttribute("data-fold-state")) === "folded",
      "Tablet console must fold into the mission stack.",
    );
    assertCondition(
      (await tabletRoot.getAttribute("data-sticky-dock-mode")) === "bottom_sticky",
      "Tablet console must move the decision dock into the bottom sticky region.",
    );
    assertCondition(
      await tabletPage.getByTestId("PharmacyMissionStackDock").isVisible(),
      "Tablet mission stack must keep the dock visible.",
    );

    await tabletPage.getByTestId("pharmacy-support-region-toggle").click();
    await tabletPage.waitForFunction(
      () =>
        document
          .querySelector("[data-testid='pharmacy-shell-root']")
          ?.getAttribute("data-support-region-resume-state") === "expanded",
    );
    assertCondition(
      (await tabletRoot.getAttribute("data-selected-case-id")) === "PHC-2048",
      "Support expansion must preserve the selected case anchor.",
    );

    await openWorkspacePharmacyRoute(
      tabletPage,
      workspacePharmacyUrl(baseUrl, "/workspace/pharmacy/PHC-2244/handoff"),
    );
    await waitForWorkspacePharmacyState(tabletPage, {
      currentPath: "/workspace/pharmacy/PHC-2244/handoff",
      layoutMode: "mission_stack",
      breakpointClass: "narrow",
      routeKey: "handoff",
      selectedCaseId: "PHC-2244",
      recoveryPosture: "read_only",
    });

    await tabletPage.getByTestId("pharmacy-mission-stack-queue-toggle").click();
    await tabletPage.getByTestId("PharmacyQueuePeekDrawer").waitFor();
    await tabletPage.keyboard.press("Escape");
    await tabletPage.waitForFunction(
      () => !document.querySelector("[data-testid='PharmacyQueuePeekDrawer']"),
    );
    const activeAfterQueueClose = await activeElementSummary(tabletPage);
    assertCondition(
      activeAfterQueueClose.testId === "pharmacy-mission-stack-queue-toggle",
      "Queue peek must restore focus to its trigger after Escape.",
    );
    await tabletContext.close();

    const phoneContext = await browser.newContext({
      viewport: { width: 320, height: 800 },
      locale: "en-GB",
      timezoneId: "Europe/London",
    });
    const phonePage = await phoneContext.newPage();
    await openWorkspacePharmacyRoute(
      phonePage,
      workspacePharmacyUrl(baseUrl, "/workspace/pharmacy/PHC-2048/inventory"),
    );
    await waitForWorkspacePharmacyState(phonePage, {
      currentPath: "/workspace/pharmacy/PHC-2048/inventory",
      layoutMode: "mission_stack",
      breakpointClass: "compact",
      routeKey: "inventory",
      selectedCaseId: "PHC-2048",
      recoveryPosture: "live",
    });
    await assertNoHorizontalOverflow(phonePage, "371 console phone mission stack");
    assertCondition(
      await phonePage.getByTestId("PharmacyMissionStackDock").isVisible(),
      "Phone mission stack must keep the bottom dock visible.",
    );
    assertCondition(
      await phonePage.getByTestId("PharmacySupportRegionResumeCard").isVisible(),
      "Phone mission stack must keep the promoted support region reachable.",
    );

    await openWorkspacePharmacyRoute(
      phonePage,
      workspacePharmacyUrl(baseUrl, "/workspace/pharmacy/PHC-2244/handoff"),
    );
    await waitForWorkspacePharmacyState(phonePage, {
      currentPath: "/workspace/pharmacy/PHC-2244/handoff",
      layoutMode: "mission_stack",
      breakpointClass: "compact",
      routeKey: "handoff",
      selectedCaseId: "PHC-2244",
      recoveryPosture: "read_only",
    });
    assertCondition(
      await phonePage.getByTestId("PharmacyRecoveryStrip").isVisible(),
      "Blocked phone handoff must keep the recovery strip visible.",
    );
    assertCondition(
      await phonePage.getByTestId("PharmacyContinuityFrozenOverlay").isVisible(),
      "Blocked phone handoff must render the frozen continuity overlay.",
    );
    await phoneContext.close();
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
