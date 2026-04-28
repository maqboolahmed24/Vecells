import {
  assertCondition,
  assertNoHorizontalOverflow,
  importPlaywright,
  openHubRoute,
  outputPath,
  startHubDesk,
  stopHubDesk,
  waitForHubRootState,
} from "./327_hub_queue.helpers";

export async function run(): Promise<void> {
  const playwright = await importPlaywright();
  if (!playwright) {
    return;
  }

  const { child, baseUrl } = await startHubDesk();
  const browser = await playwright.chromium.launch({ headless: true });

  try {
    const context = await browser.newContext({
      viewport: { width: 820, height: 1180 },
      locale: "en-GB",
      timezoneId: "Europe/London",
    });
    await context.tracing.start({ screenshots: true, snapshots: true });
    const page = await context.newPage();

    await openHubRoute(
      page,
      `${baseUrl}/hub/alternatives/offer-session-104`,
      "HubMissionStackLayout",
    );
    await waitForHubRootState(page, {
      currentPath: "/hub/alternatives/offer-session-104",
      viewMode: "alternatives",
      layoutMode: "mission_stack",
      selectedCaseId: "hub-case-104",
      routeFamily: "rf_hub_case_management",
    });
    const root = page.locator("[data-testid='hub-shell-root']");
    const selectedOption = await root.getAttribute("data-selected-option-card");

    await page
      .locator("[data-testid='HubSupportTriggerRow'] [data-support-region='support']")
      .scrollIntoViewIfNeeded();
    await page
      .locator("[data-testid='HubSupportTriggerRow'] [data-support-region='support']")
      .click();
    await page.locator("[data-testid='HubSupportDrawer'][data-support-region='support']").waitFor();

    await page.setViewportSize({ width: 915, height: 820 });
    await waitForHubRootState(page, {
      currentPath: "/hub/alternatives/offer-session-104",
      viewMode: "alternatives",
      layoutMode: "mission_stack",
      selectedCaseId: "hub-case-104",
      routeFamily: "rf_hub_case_management",
    });
    assertCondition(
      (await root.getAttribute("data-selected-option-card")) === selectedOption,
      "tablet rotation drifted the selected option anchor",
    );

    await openHubRoute(page, `${baseUrl}/hub/audit/hub-case-066`, "HubMissionStackLayout");
    await waitForHubRootState(page, {
      currentPath: "/hub/audit/hub-case-066",
      viewMode: "audit",
      layoutMode: "mission_stack",
      selectedCaseId: "hub-case-066",
      routeFamily: "rf_hub_case_management",
    });
    await page.getByTestId("HubMissionSupportStub").waitFor();
    await page.getByTestId("HubDecisionDockBar").waitFor();

    await page
      .locator("[data-testid='HubSupportTriggerRow'] [data-support-region='support']")
      .scrollIntoViewIfNeeded();
    await page
      .locator("[data-testid='HubSupportTriggerRow'] [data-support-region='support']")
      .click();
    await page.locator("[data-testid='HubSupportDrawer'][data-support-region='support']").waitFor();
    await page.locator("[data-testid='HubRightRailHost']").waitFor();

    await assertNoHorizontalOverflow(page, "333 mission stack tablet");
    await context.tracing.stop({ path: outputPath("333-hub-mission-stack-tablet-trace.zip") });
  } finally {
    await browser.close();
    await stopHubDesk(child);
  }
}

if (process.argv.includes("--run")) {
  run().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
