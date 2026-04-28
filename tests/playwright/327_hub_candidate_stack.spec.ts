import {
  assertCondition,
  importPlaywright,
  openHubRoute,
  outputPath,
  startHubDesk,
  stopHubDesk,
  waitForHubRootState,
} from "./327_hub_queue.helpers";

export const hubCandidateStackCoverage = [
  "best-fit strip stays in parity with the selected option card",
  "callback fallback remains separate from ranked slot cards",
  "reservation truth and trust cues stay explicit on candidate cards",
];

export async function run(): Promise<void> {
  const playwright = await importPlaywright();
  if (!playwright) {
    return;
  }

  const { child, baseUrl } = await startHubDesk();
  const browser = await playwright.chromium.launch({ headless: true });

  try {
    const context = await browser.newContext({ viewport: { width: 1480, height: 1140 } });
    const page = await context.newPage();

    await openHubRoute(page, `${baseUrl}/hub/queue`, "hub-start-of-day");
    await page.locator("[data-option-card='opt-104-north-shore'] .hub-option-card__select").click();
    await page.waitForFunction(
      () =>
        document
          .querySelector("[data-testid='HubDecisionDockHost']")
          ?.getAttribute("data-selected-option") === "opt-104-north-shore",
    );

    const dock = page.locator("[data-testid='HubDecisionDockHost']");
    assertCondition(
      (await dock.getAttribute("data-selected-option")) === "opt-104-north-shore",
      "decision dock did not track the selected option",
    );
    const bestFit = page.locator(".hub-best-fit-strip");
    assertCondition(
      (await bestFit.getAttribute("data-option-card")) === "opt-104-north-shore",
      "best-fit strip drifted away from the selected option",
    );
    const selectedCard = page.locator(
      "[data-option-card='opt-104-north-shore'][data-reservation-truth]",
    );
    assertCondition(
      (await selectedCard.getAttribute("data-reservation-truth")) === "truthful_nonexclusive",
      "selected option did not publish truthful non-exclusive reservation state",
    );
    assertCondition(
      (await selectedCard.textContent())?.toLowerCase().includes("no hold") ?? false,
      "selected option did not keep truthful non-exclusive copy visible",
    );

    await page.locator("[data-testid='hub-saved-view-callback_recovery']").click();
    await waitForHubRootState(page, {
      currentPath: "/hub/queue",
      savedViewId: "callback_recovery",
      selectedCaseId: "hub-case-052",
      shellStatus: "shell_recovery_only",
    });
    const callbackCard = page.locator("[data-callback-fallback='true']");
    await callbackCard.waitFor();
    assertCondition(
      (await callbackCard.getAttribute("data-option-card")) == null,
      "callback fallback inherited ranked slot markers",
    );
    const diagnosticCards = await page.locator("[data-option-card]").count();
    assertCondition(
      diagnosticCards >= 2,
      "expected ranked diagnostic cards before the callback fallback",
    );
    assertCondition(
      (await callbackCard.textContent())?.includes("Governed callback fallback") ?? false,
      "callback fallback label drifted",
    );
    assertCondition(
      (await page
        .locator("[data-option-card='opt-052-variance'][data-reservation-truth]")
        .getAttribute("data-reservation-truth")) === "unavailable",
      "unsafe fallback candidate did not expose unavailable reservation truth",
    );

    await page.screenshot({ path: outputPath("327-hub-candidate-stack.png"), fullPage: true });
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
