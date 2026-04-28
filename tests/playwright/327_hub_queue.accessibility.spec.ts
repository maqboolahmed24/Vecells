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
} from "./327_hub_queue.helpers";

export const hubQueueAccessibilityCoverage = [
  "keyboard traversal across queue, candidate stack, and decision dock",
  "aria snapshots for normal, critical, and callback-visible states",
  "reduced-motion parity",
];

export async function run(): Promise<void> {
  const playwright = await importPlaywright();
  if (!playwright) {
    return;
  }

  const { child, baseUrl } = await startHubDesk();
  const browser = await playwright.chromium.launch({ headless: true });

  try {
    const context = await browser.newContext({ viewport: { width: 1400, height: 1080 } });
    await context.tracing.start({ screenshots: true, snapshots: true });
    const page = await context.newPage();

    await openHubRoute(page, `${baseUrl}/hub/queue`, "hub-start-of-day");
    const navCount = await page.locator("nav").count();
    const mainCount = await page.locator("main").count();
    const asideCount = await page.locator("aside").count();
    assertCondition(navCount >= 1, "queue workbench lost the navigation landmark");
    assertCondition(mainCount === 1, "queue workbench should keep exactly one main landmark");
    assertCondition(asideCount >= 1, "queue workbench should keep complementary landmarks");

    const selectedQueueRow = page.locator(
      "[data-hub-queue-row='hub-case-104'] .hub-queue-row__main",
    );
    await selectedQueueRow.focus();
    const firstFocused = await page.evaluate(() =>
      (document.activeElement as HTMLElement | null)
        ?.closest("[data-hub-queue-row]")
        ?.getAttribute("data-hub-queue-row"),
    );
    assertCondition(
      firstFocused === "hub-case-104",
      `first keyboard focus should land on the selected queue row, got ${String(firstFocused)}`,
    );
    let secondFocused: string | null = null;
    for (let index = 0; index < 10; index += 1) {
      await page.keyboard.press("Tab");
      secondFocused = await page.evaluate(() =>
        (document.activeElement as HTMLElement | null)
          ?.closest("[data-option-card][data-reservation-truth]")
          ?.getAttribute("data-option-card"),
      );
      if (secondFocused) {
        break;
      }
    }
    assertCondition(
      secondFocused === "opt-104-riverside",
      `second keyboard focus should land on the selected option card, got ${String(secondFocused)}`,
    );
    let thirdFocused = false;
    for (let index = 0; index < 10; index += 1) {
      await page.keyboard.press("Tab");
      thirdFocused = await page.evaluate(
        () =>
          (document.activeElement as HTMLElement | null)?.closest(
            "[data-testid='HubDecisionDockHost']",
          ) != null,
      );
      if (thirdFocused) {
        break;
      }
    }
    assertCondition(thirdFocused === true, "third keyboard focus should land in the decision dock");

    const normalAria = await captureAria(page.locator("[data-testid='hub-start-of-day']"), page);

    await page.locator("[data-testid='hub-saved-view-supplier_drift']").click();
    await waitForHubRootState(page, {
      currentPath: "/hub/queue",
      savedViewId: "supplier_drift",
      shellStatus: "shell_recovery_only",
      selectedCaseId: "hub-case-041",
    });
    const driftAria = await captureAria(page.locator("[data-testid='hub-start-of-day']"), page);

    await page.locator("[data-testid='hub-saved-view-callback_recovery']").click();
    await waitForHubRootState(page, {
      currentPath: "/hub/queue",
      savedViewId: "callback_recovery",
      shellStatus: "shell_recovery_only",
      selectedCaseId: "hub-case-052",
    });
    const callbackAria = await captureAria(page.locator("[data-testid='hub-start-of-day']"), page);
    writeJsonArtifact("327-hub-queue-aria-snapshots.json", {
      normal: normalAria,
      drift: driftAria,
      callback: callbackAria,
    });

    await context.tracing.stop({ path: outputPath("327-hub-queue-accessibility-trace.zip") });

    const reducedContext = await browser.newContext({
      viewport: { width: 1280, height: 960 },
      reducedMotion: "reduce",
    });
    const reduced = await reducedContext.newPage();
    await openHubRoute(reduced, `${baseUrl}/hub/queue`, "hub-start-of-day");
    const reducedRoot = reduced.locator("[data-testid='hub-shell-root']");
    assertCondition(
      (await reducedRoot.getAttribute("data-reduced-motion")) === "reduce",
      "reduced-motion marker drifted on the shell root",
    );
    const transitionDuration = await reduced
      .locator("[data-option-card='opt-104-riverside'] .hub-option-card__select")
      .evaluate((node) => window.getComputedStyle(node).transitionDuration);
    assertCondition(
      transitionDuration.includes("0.01ms") ||
        transitionDuration.includes("1e-05s") ||
        transitionDuration.includes("0s"),
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
