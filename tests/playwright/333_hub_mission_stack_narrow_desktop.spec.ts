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
      viewport: { width: 920, height: 980 },
      locale: "en-GB",
      timezoneId: "Europe/London",
    });
    await context.tracing.start({ screenshots: true, snapshots: true });
    const page = await context.newPage();

    await openHubRoute(page, `${baseUrl}/hub/case/hub-case-104`, "HubMissionStackLayout");
    await waitForHubRootState(page, {
      currentPath: "/hub/case/hub-case-104",
      viewMode: "case",
      layoutMode: "mission_stack",
      selectedCaseId: "hub-case-104",
    });

    const root = page.locator("[data-testid='hub-shell-root']");
    assertCondition(
      (await root.getAttribute("data-support-fallback-mode")) === "drawer",
      "mission_stack narrow desktop lost drawer fallback mode",
    );
    assertCondition(
      (await root.getAttribute("data-sticky-action-region")) === "bottom_bar",
      "mission_stack narrow desktop lost sticky bottom action region",
    );
    assertCondition(
      (await root.getAttribute("data-mission-stack-visual-mode")) === "Hub_Mission_Stack_Premium",
      "mission_stack visual mode marker drifted",
    );

    const selectedBefore = await root.getAttribute("data-selected-option-card");
    assertCondition(selectedBefore != null, "selected option marker missing before fold test");

    const alternateOption = page.locator("[data-option-card='opt-104-north-shore']");
    await alternateOption.scrollIntoViewIfNeeded();
    await alternateOption.click();
    const selectedAfter = await root.getAttribute("data-selected-option-card");
    assertCondition(
      selectedAfter != null && selectedAfter !== selectedBefore,
      "option anchor did not change under mission stack interaction",
    );

    await page
      .locator("[data-testid='HubSupportTriggerRow'] [data-support-region='support']")
      .scrollIntoViewIfNeeded();
    await page
      .locator("[data-testid='HubSupportTriggerRow'] [data-support-region='support']")
      .click();
    await page.locator("[data-testid='HubSupportDrawer'][data-support-region='support']").waitFor();
    assertCondition(
      (await root.getAttribute("data-support-drawer-open")) === "true",
      "support drawer open marker drifted",
    );

    await page.setViewportSize({ width: 1440, height: 1024 });
    await waitForHubRootState(page, {
      currentPath: "/hub/case/hub-case-104",
      viewMode: "case",
      layoutMode: "three_panel",
      selectedCaseId: "hub-case-104",
    });
    assertCondition(
      (await root.getAttribute("data-selected-option-card")) === selectedAfter,
      "selected option drifted when unfolding to wide desktop",
    );

    await page.setViewportSize({ width: 920, height: 980 });
    await waitForHubRootState(page, {
      currentPath: "/hub/case/hub-case-104",
      viewMode: "case",
      layoutMode: "mission_stack",
      selectedCaseId: "hub-case-104",
    });
    assertCondition(
      (await root.getAttribute("data-selected-option-card")) === selectedAfter,
      "selected option drifted when refolding to mission stack",
    );

    await assertNoHorizontalOverflow(page, "333 mission stack narrow desktop");
    await context.tracing.stop({ path: outputPath("333-hub-mission-stack-narrow-desktop-trace.zip") });
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
