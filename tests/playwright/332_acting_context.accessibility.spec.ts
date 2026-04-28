import {
  assertCondition,
  captureAria,
  importPlaywright,
  openHubRoute,
  outputPath,
  startHubDesk,
  stopHubDesk,
  writeJsonArtifact,
} from "./327_hub_queue.helpers";

export const hubActingContextAccessibilityCoverage = [
  "masthead control-plane entry point remains keyboard reachable and visible",
  "drawer and break-glass modal expose stable semantics without replacing the shell",
  "denied posture and reduced-motion mode preserve the same accessible shell contract",
];

async function waitForRootAttributes(
  page: any,
  expected: Record<string, string>,
): Promise<void> {
  await page.waitForFunction((attrs) => {
    const root = document.querySelector("[data-testid='hub-shell-root']");
    if (!root) {
      return false;
    }
    return Object.entries(attrs).every(
      ([key, value]) => (root as HTMLElement).getAttribute(key) === value,
    );
  }, expected);
}

async function isFullyVisible(locator: any): Promise<boolean> {
  return locator.evaluate((node: HTMLElement) => {
    const rect = node.getBoundingClientRect();
    return rect.top >= 0 && rect.bottom <= window.innerHeight;
  });
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
      viewport: { width: 1366, height: 1024 },
      locale: "en-GB",
      timezoneId: "Europe/London",
    });
    await context.tracing.start({ screenshots: true, snapshots: true });
    const page = await context.newPage();

    await openHubRoute(page, `${baseUrl}/hub/case/hub-case-104`, "hub-case-route");
    const navCount = await page.locator("nav").count();
    const mainCount = await page.locator("main").count();
    const asideCount = await page.locator("aside").count();
    const bannerCount = await page.locator("[role='banner']").count();
    assertCondition(navCount >= 1, "acting-context shell lost navigation landmarks");
    assertCondition(mainCount === 1, "acting-context shell should keep one main landmark");
    assertCondition(asideCount >= 1, "acting-context shell should keep complementary landmarks");
    assertCondition(bannerCount === 1, "acting-context shell should keep one banner landmark");

    const chip = page.getByTestId("HubActingContextChip");
    await chip.focus();
    assertCondition(await isFullyVisible(chip), "focused acting-context chip is obscured");
    await chip.press("Enter");
    await page.getByTestId("OrganisationSwitchDrawer").waitFor();

    const drawer = page.getByTestId("OrganisationSwitchDrawer");
    const riversideRow = page.locator("[data-organisation-option='riverside_medical']");
    await riversideRow.focus();
    assertCondition(await isFullyVisible(riversideRow), "focused organisation switch row is obscured");
    const drawerAria = await captureAria(drawer, page);

    await page.getByRole("button", { name: "Open break-glass reasons" }).click();
    const modal = page.getByTestId("BreakGlassReasonModal");
    await modal.waitFor();
    assertCondition((await page.locator("[role='dialog']").count()) === 1, "modal semantics drifted");
    const modalAria = await captureAria(modal, page);
    await modal.getByRole("button", { name: "Close" }).click();

    await page.locator("[data-organisation-option='south_vale_network']").click();
    await waitForRootAttributes(page, {
      "data-acting-organisation": "south_vale_network",
      "data-access-posture": "denied",
      "data-break-glass-state": "inactive",
      "data-shell-status": "shell_recovery_only",
    });
    await drawer.getByRole("button", { name: "Close" }).click();
    await waitForRootAttributes(page, { "data-scope-drawer-open": "false" });
    const denied = page.getByTestId("HubAccessDeniedState");
    await denied.waitFor();
    const recoveryButton = denied.getByRole("button", { name: "Choose another acting scope" });
    await recoveryButton.scrollIntoViewIfNeeded();
    await recoveryButton.focus();
    assertCondition(await isFullyVisible(recoveryButton), "focused denied-state recovery action is obscured");
    const deniedAria = await captureAria(denied, page);
    writeJsonArtifact("332-acting-context-aria-snapshots.json", {
      drawer: drawerAria,
      modal: modalAria,
      denied: deniedAria,
    });

    await context.tracing.stop({ path: outputPath("332-acting-context-accessibility-trace.zip") });

    const reducedContext = await browser.newContext({
      viewport: { width: 1280, height: 960 },
      reducedMotion: "reduce",
      locale: "en-GB",
      timezoneId: "Europe/London",
    });
    const reduced = await reducedContext.newPage();
    await openHubRoute(reduced, `${baseUrl}/hub/case/hub-case-104`, "hub-case-route");
    await waitForRootAttributes(reduced, {
      "data-reduced-motion": "reduce",
      "data-access-posture": "writable",
    });
    const reducedTransitionDuration = await reduced
      .locator(".hub-acting-context-chip .hub-chip")
      .first()
      .evaluate((node) => window.getComputedStyle(node).transitionDuration);
    assertCondition(
      reducedTransitionDuration.includes("0.01ms") ||
        reducedTransitionDuration.includes("1e-05s") ||
        reducedTransitionDuration.includes("0s"),
      `reduced-motion transition did not collapse: ${reducedTransitionDuration}`,
    );
    await reduced.screenshot({
      path: outputPath("332-acting-context-accessibility-reduced-motion.png"),
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
