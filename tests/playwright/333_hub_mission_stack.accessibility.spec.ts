import {
  assertCondition,
  assertNoHorizontalOverflow,
  captureAria,
  importPlaywright,
  openHubRoute,
  outputPath,
  startHubDesk,
  stopHubDesk,
  writeJsonArtifact,
} from "./327_hub_queue.helpers";

async function isFullyVisible(locator: any): Promise<boolean> {
  return locator.evaluate((node: HTMLElement) => {
    const rect = node.getBoundingClientRect();
    return rect.top >= 0 && rect.bottom <= window.innerHeight;
  });
}

async function tabUntil(page: any, predicate: () => Promise<boolean>, limit = 24): Promise<boolean> {
  for (let index = 0; index < limit; index += 1) {
    await page.keyboard.press("Tab");
    if (await predicate()) {
      return true;
    }
  }
  return false;
}

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

    await openHubRoute(page, `${baseUrl}/hub/case/hub-case-052`, "HubMissionStackLayout");
    const navCount = await page.locator("nav").count();
    const mainCount = await page.locator("main").count();
    const bannerCount = await page.locator("[role='banner']").count();
    assertCondition(navCount >= 1, "mission stack lost the navigation landmark");
    assertCondition(mainCount === 1, "mission stack should keep one main landmark");
    assertCondition(bannerCount === 1, "mission stack should keep one banner landmark");

    const selectedRow = page.locator("[data-hub-queue-row='hub-case-052'] .hub-narrow-queue-row__main");
    await selectedRow.scrollIntoViewIfNeeded();
    await selectedRow.focus();
    assertCondition(await isFullyVisible(selectedRow), "selected queue row is obscured");

    const optionReached = await tabUntil(page, async () =>
      (await page.evaluate(
        () =>
          (document.activeElement as HTMLElement | null)?.closest("[data-option-card]") != null,
      )) === true,
    );
    assertCondition(optionReached, "keyboard traversal did not reach the compact option stack");

    const supportReached = await tabUntil(page, async () =>
      (await page.evaluate(
        () =>
          (document.activeElement as HTMLElement | null)?.closest(
            "[data-testid='HubSupportTriggerRow']",
          ) != null,
      )) === true,
    );
    assertCondition(supportReached, "keyboard traversal did not reach the support trigger row");

    const dockReached = await tabUntil(page, async () =>
      (await page.evaluate(
        () =>
          (document.activeElement as HTMLElement | null)?.closest(
            "[data-testid='HubDecisionDockBar']",
          ) != null,
      )) === true,
    );
    assertCondition(dockReached, "keyboard traversal did not reach the sticky decision dock");

    await page
      .locator("[data-testid='HubSupportTriggerRow'] [data-support-region='interruptions']")
      .scrollIntoViewIfNeeded();
    await page
      .locator("[data-testid='HubSupportTriggerRow'] [data-support-region='interruptions']")
      .click();
    const drawer = page.locator("[data-testid='HubSupportDrawer'][data-support-region='interruptions']");
    await drawer.waitFor();
    const closeButton = drawer.getByRole("button", { name: "Close" });
    await closeButton.focus();
    assertCondition(await isFullyVisible(closeButton), "support drawer close control is obscured");

    const layoutAria = await captureAria(page.getByTestId("HubMissionStackLayout"), page);
    const drawerAria = await captureAria(drawer, page);
    writeJsonArtifact("333-hub-mission-stack-aria.json", {
      layout: layoutAria,
      drawer: drawerAria,
    });

    await assertNoHorizontalOverflow(page, "333 mission stack accessibility");
    await context.tracing.stop({ path: outputPath("333-hub-mission-stack-accessibility-trace.zip") });

    const reducedContext = await browser.newContext({
      viewport: { width: 390, height: 844 },
      reducedMotion: "reduce",
      locale: "en-GB",
      timezoneId: "Europe/London",
    });
    const reduced = await reducedContext.newPage();
    await openHubRoute(reduced, `${baseUrl}/hub/case/hub-case-052`, "HubMissionStackLayout");
    const reducedRoot = reduced.locator("[data-testid='hub-shell-root']");
    assertCondition(
      (await reducedRoot.getAttribute("data-reduced-motion")) === "reduce",
      "reduced-motion marker drifted in mission stack",
    );
    const transitionDuration = await reduced
      .locator(".hub-support-trigger-row__button")
      .first()
      .evaluate((node) => window.getComputedStyle(node).transitionDuration);
    assertCondition(
      transitionDuration.includes("0.01ms") ||
        transitionDuration.includes("1e-05s") ||
        transitionDuration.includes("0s"),
      `mission stack reduced-motion transition did not collapse: ${transitionDuration}`,
    );
    await reduced.screenshot({
      path: outputPath("333-hub-mission-stack-reduced-motion.png"),
      fullPage: true,
    });
    await reducedContext.close();
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
