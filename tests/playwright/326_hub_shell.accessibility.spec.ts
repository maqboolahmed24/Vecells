import {
  assertCondition,
  captureAria,
  importPlaywright,
  openHubRoute,
  outputPath,
  startHubDesk,
  stopHubDesk,
  waitForHubRootState,
  writeJsonArtifact,
} from "./326_hub_shell.helpers";

export const hubShellAccessibilityCoverage = [
  "banner nav main and complementary landmarks",
  "focus remains visible beneath sticky shell chrome",
  "read-only observe-only posture remains explicit",
  "recovery-only posture remains explicit",
  "reduced-motion parity and aria snapshots",
];

export async function run(): Promise<void> {
  const playwright = await importPlaywright();
  if (!playwright) {
    return;
  }

  const { child, baseUrl } = await startHubDesk();
  const browser = await playwright.chromium.launch({ headless: true });

  try {
    const context = await browser.newContext({ viewport: { width: 1360, height: 1040 } });
    await context.tracing.start({ screenshots: true, snapshots: true });
    const page = await context.newPage();

    await openHubRoute(page, `${baseUrl}/hub/queue`, "hub-start-of-day");
    const navCount = await page.locator("nav").count();
    const mainCount = await page.locator("main").count();
    const asideCount = await page.locator("aside").count();
    const bannerCount = await page.locator("[role='banner']").count();
    assertCondition(navCount >= 1, "nav landmark missing");
    assertCondition(mainCount === 1, "expected exactly one main landmark");
    assertCondition(asideCount >= 1, "expected at least one complementary digest region");
    assertCondition(bannerCount === 1, "expected exactly one banner landmark");

    const resumeButton = page.getByRole("button", { name: "Resume same-day coordination" });
    await resumeButton.focus();
    const focusRect = await resumeButton.evaluate((node) => {
      const rect = node.getBoundingClientRect();
      return {
        top: rect.top,
        bottom: rect.bottom,
        viewportHeight: window.innerHeight,
      };
    });
    assertCondition(focusRect.top >= 0, "focused dominant action is obscured at the top");
    assertCondition(
      focusRect.bottom <= focusRect.viewportHeight,
      "focused dominant action is obscured at the bottom",
    );

    await page.locator("[data-testid='hub-saved-view-observe_only']").click();
    await waitForHubRootState(page, {
      currentPath: "/hub/queue",
      shellStatus: "shell_read_only",
      savedViewId: "observe_only",
    });
    await page.locator("[data-testid='hub-open-case-hub-case-041']").click();
    await waitForHubRootState(page, {
      currentPath: "/hub/case/hub-case-041",
      viewMode: "case",
      shellStatus: "shell_read_only",
      selectedCaseId: "hub-case-041",
    });
    const root = page.locator("[data-testid='hub-shell-root']");
    assertCondition(
      (await root.getAttribute("data-route-mutation")) === "disabled",
      "observe-only case route should disable mutation posture",
    );

    await page.locator("[data-testid='hub-saved-view-callback_recovery']").click();
    await waitForHubRootState(page, {
      currentPath: "/hub/queue",
      shellStatus: "shell_recovery_only",
      savedViewId: "callback_recovery",
      selectedCaseId: "hub-case-052",
    });

    const queueAria = await captureAria(page.locator("[data-testid='hub-start-of-day']"), page);
    const digestAria = await captureAria(
      page.locator("[data-testid='HubInterruptionDigestPanel']"),
      page,
    );
    const rootAria = await captureAria(root, page);
    writeJsonArtifact("326-hub-shell-aria-snapshots.json", {
      root: rootAria,
      queue: queueAria,
      digest: digestAria,
    });
    await context.tracing.stop({ path: outputPath("326-hub-shell-accessibility-trace.zip") });

    const reducedContext = await browser.newContext({
      viewport: { width: 1280, height: 960 },
      reducedMotion: "reduce",
    });
    const reduced = await reducedContext.newPage();
    await openHubRoute(reduced, `${baseUrl}/hub/queue`, "hub-start-of-day");
    const reducedRoot = reduced.locator("[data-testid='hub-shell-root']");
    assertCondition(
      (await reducedRoot.getAttribute("data-reduced-motion")) === "reduce",
      "reduced-motion root marker drifted",
    );
    const transitionDuration = await reduced
      .getByRole("button", { name: "Resume today" })
      .evaluate((node) => window.getComputedStyle(node).transitionDuration);
    assertCondition(
      transitionDuration.includes("0.01ms") || transitionDuration.includes("1e-05s"),
      `reduced-motion transition did not collapse: ${transitionDuration}`,
    );
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
