import {
  assertCondition,
  assertRootMatchesExpectedScenario,
  buildExpectedHubScenario,
  importPlaywright,
  openHubRoute,
  outputPath,
  readQueueOrder,
  startHubDesk,
  startTrace,
  stopHubDesk,
  stopTrace,
  stopTraceOnError,
  trackExternalRequests,
  waitForRootAttributes,
  writeJsonArtifact,
} from "./338_scope_capacity.helpers.ts";

export const queueRankingSlaCoverage338 = [
  "desktop queue rows render in the same order as the authoritative queue projection rather than a browser-local sort",
  "buffered and applied queue deltas preserve the selected case and DecisionDock anchor",
  "browser-visible urgency, trust, and timer cues stay grounded in the current authoritative row projection",
];

function rowOrderFromScenario(scenario: ReturnType<typeof buildExpectedHubScenario>): string[] {
  return scenario.snapshot.queueWorkbench.visibleRows.map((row) => row.caseId);
}

export async function run(): Promise<void> {
  const playwright = await importPlaywright();
  if (!playwright) {
    return;
  }

  const { child, baseUrl } = await startHubDesk();
  const browser = await playwright.chromium.launch({ headless: true });
  const defaultScenario = buildExpectedHubScenario("/hub/queue", 1560);
  const appliedScenario = buildExpectedHubScenario("/hub/queue", 1560, {
    queueChangeState: "applied",
    selectedOptionCardId: "opt-104-north-shore",
  });

  try {
    const context = await browser.newContext({
      viewport: { width: 1560, height: 1180 },
      locale: "en-GB",
      timezoneId: "Europe/London",
    });
    await startTrace(context);

    try {
      const page = await context.newPage();
      const externalRequests = new Set<string>();
      trackExternalRequests(page, baseUrl, externalRequests);

      await openHubRoute(page, `${baseUrl}/hub/queue`, "hub-start-of-day");
      await assertRootMatchesExpectedScenario(page, defaultScenario);

      const initialOrder = await readQueueOrder(page);
      assertCondition(
        initialOrder.join("|") === rowOrderFromScenario(defaultScenario).join("|"),
        `desktop queue order drifted from the authoritative projection: ${initialOrder.join("|")}`,
      );
      assertCondition(
        (await page.getByRole("button", { name: /sort/i }).count()) === 0,
        "hub queue workbench should not expose browser-local sort affordances",
      );

      const urgentRow = page.locator("[data-hub-queue-row='hub-case-087']");
      const urgentSnapshot = defaultScenario.snapshot.queueWorkbench.visibleRows.find(
        (row) => row.caseId === "hub-case-087",
      );
      assertCondition(Boolean(urgentSnapshot), "authoritative urgent row is missing");
      const urgentText = (await urgentRow.textContent()) ?? "";
      assertCondition(
        urgentText.includes(urgentSnapshot!.queueSummary),
        "desktop urgent row lost the authoritative queue summary",
      );
      assertCondition(
        urgentText.includes(urgentSnapshot!.timerLabel),
        "desktop urgent row lost the authoritative timer label",
      );
      assertCondition(
        urgentText.includes(urgentSnapshot!.trustSummary),
        "desktop urgent row lost the authoritative trust summary",
      );

      await page.locator("[data-option-card='opt-104-north-shore'] .hub-option-card__select").click();
      await waitForRootAttributes(page, { "data-selected-option-card": "opt-104-north-shore" });
      assertCondition(
        (await page.getByTestId("HubDecisionDockHost").getAttribute("data-selected-option")) ===
          "opt-104-north-shore",
        "DecisionDock did not bind to the newly selected option before queue change buffering",
      );

      await page.getByTestId("hub-buffer-queue-delta").click();
      await page.locator("[data-queue-change-state='buffered']").waitFor();
      assertCondition(
        (await readQueueOrder(page)).join("|") === initialOrder.join("|"),
        "buffered queue delta changed row order before the authoritative apply step",
      );
      assertCondition(
        (await page.getByTestId("HubDecisionDockHost").getAttribute("data-selected-option")) ===
          "opt-104-north-shore",
        "buffered queue delta stole the selected DecisionDock option",
      );

      await page.getByTestId("hub-apply-queue-delta").click();
      await page.waitForFunction(
        () =>
          (window as { __hubDeskState?: { queueChangeState?: string } }).__hubDeskState
            ?.queueChangeState === "applied",
      );
      await waitForRootAttributes(page, {
        "data-selected-option-card": "opt-104-north-shore",
      });
      await assertRootMatchesExpectedScenario(page, appliedScenario);
      const appliedOrder = await readQueueOrder(page);
      assertCondition(
        appliedOrder.join("|") === rowOrderFromScenario(appliedScenario).join("|"),
        `applied queue order drifted from the authoritative projection: ${appliedOrder.join("|")}`,
      );
      assertCondition(
        (await page.getByTestId("HubDecisionDockHost").getAttribute("data-selected-option")) ===
          appliedScenario.snapshot.selectedOptionCard.optionCardId,
        "DecisionDock selected option diverged from the authoritative applied snapshot",
      );

      writeJsonArtifact("338-hub-queue-ranking-and-sla.json", {
        initialOrder,
        authoritativeInitialOrder: rowOrderFromScenario(defaultScenario),
        appliedOrder,
        authoritativeAppliedOrder: rowOrderFromScenario(appliedScenario),
        urgentCaseSummary: urgentSnapshot,
        appliedDecisionDockOption: appliedScenario.snapshot.selectedOptionCard.optionCardId,
      });

      await page.screenshot({
        path: outputPath("338-hub-queue-ranking-and-sla.png"),
        fullPage: true,
      });

      assertCondition(
        externalRequests.size === 0,
        `unexpected external requests: ${Array.from(externalRequests).join(", ")}`,
      );

      await stopTrace(context, "338-hub-queue-ranking-and-sla-trace.zip");
    } catch (error) {
      await stopTraceOnError(context, "338-hub-queue-ranking-and-sla-trace.zip", error);
    } finally {
      await context.close();
    }
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
