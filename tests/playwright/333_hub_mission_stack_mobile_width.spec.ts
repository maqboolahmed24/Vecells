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
      viewport: { width: 390, height: 844 },
      locale: "en-GB",
      timezoneId: "Europe/London",
    });
    await context.tracing.start({ screenshots: true, snapshots: true });
    const page = await context.newPage();

    await openHubRoute(page, `${baseUrl}/hub/queue`, "HubMissionStackLayout");
    await waitForHubRootState(page, {
      currentPath: "/hub/queue",
      viewMode: "queue",
      layoutMode: "mission_stack",
      selectedCaseId: "hub-case-104",
      routeFamily: "rf_hub_queue",
    });

    await page.getByTestId("hub-mission-stack-saved-view-callback_recovery").click();
    await waitForHubRootState(page, {
      currentPath: "/hub/queue",
      viewMode: "queue",
      layoutMode: "mission_stack",
      savedViewId: "callback_recovery",
      selectedCaseId: "hub-case-052",
      routeFamily: "rf_hub_queue",
    });
    const root = page.locator("[data-testid='hub-shell-root']");
    const selectedOption = await root.getAttribute("data-selected-option-card");

    await page
      .locator("[data-testid='HubSupportTriggerRow'] [data-support-region='visibility']")
      .scrollIntoViewIfNeeded();
    await page
      .locator("[data-testid='HubSupportTriggerRow'] [data-support-region='visibility']")
      .click();
    await page
      .locator("[data-testid='HubSupportDrawer'][data-support-region='visibility']")
      .waitFor();

    await page.reload({ waitUntil: "networkidle" });
    await waitForHubRootState(page, {
      currentPath: "/hub/queue",
      viewMode: "queue",
      layoutMode: "mission_stack",
      savedViewId: "callback_recovery",
      selectedCaseId: "hub-case-052",
      routeFamily: "rf_hub_queue",
    });
    assertCondition(
      (await root.getAttribute("data-selected-option-card")) === selectedOption,
      "mobile reload drifted the selected option anchor",
    );

    await openHubRoute(page, `${baseUrl}/hub/exceptions`, "HubMissionStackLayout");
    await waitForHubRootState(page, {
      currentPath: "/hub/exceptions",
      viewMode: "exceptions",
      layoutMode: "mission_stack",
      routeFamily: "rf_hub_queue",
    });
    await page.getByTestId("hub-exception-row-exc-loop-031").click();
    await page
      .locator("[data-testid='HubSupportDrawer'][data-support-region='exceptions']")
      .waitFor();
    assertCondition(
      (await root.getAttribute("data-selected-exception-id")) === "exc-loop-031",
      "selected exception marker drifted on mobile",
    );

    await page.reload({ waitUntil: "networkidle" });
    await waitForHubRootState(page, {
      currentPath: "/hub/exceptions",
      viewMode: "exceptions",
      layoutMode: "mission_stack",
      routeFamily: "rf_hub_queue",
    });
    assertCondition(
      (await root.getAttribute("data-selected-exception-id")) === "exc-loop-031",
      "mobile reload lost the selected exception anchor",
    );

    await page.setViewportSize({ width: 320, height: 800 });
    await waitForHubRootState(page, {
      currentPath: "/hub/exceptions",
      viewMode: "exceptions",
      layoutMode: "mission_stack",
      routeFamily: "rf_hub_queue",
    });
    assertCondition(
      (await root.getAttribute("data-breakpoint-class")) === "compact",
      "320px reflow proxy did not report compact breakpoint",
    );
    await assertNoHorizontalOverflow(page, "333 mission stack mobile width");
    await context.tracing.stop({ path: outputPath("333-hub-mission-stack-mobile-trace.zip") });
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
