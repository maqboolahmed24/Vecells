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
  writeJsonArtifact,
} from "./338_scope_capacity.helpers.ts";

export const capacityDegradedQuarantinedCoverage338 = [
  "degraded filter rows remain the authoritative subset where degraded or quarantined supply matters",
  "supplier-drift review keeps the quarantined candidate diagnostic-only instead of leaking live direct-commit affordances",
  "capacity trust state remains visible on the candidate stack and callback fallback stays separate from ordinary ranked offers",
];

function queueOrderForScenario(scenario: ReturnType<typeof buildExpectedHubScenario>): string[] {
  return scenario.snapshot.queueWorkbench.visibleRows.map((row) => row.caseId);
}

export async function run(): Promise<void> {
  const playwright = await importPlaywright();
  if (!playwright) {
    return;
  }

  const { child, baseUrl } = await startHubDesk();
  const browser = await playwright.chromium.launch({ headless: true });
  const degradedScenario = buildExpectedHubScenario("/hub/queue", 1560, {
    selectedQueueFilterId: "degraded",
  });
  const supplierDriftScenario = buildExpectedHubScenario("/hub/queue", 1560, {
    selectedSavedViewId: "supplier_drift",
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
      await page.getByTestId("hub-filter-degraded").click();
      await assertRootMatchesExpectedScenario(page, degradedScenario);
      const degradedOrder = await readQueueOrder(page);
      assertCondition(
        degradedOrder.join("|") === queueOrderForScenario(degradedScenario).join("|"),
        `degraded filter queue order drifted from the authoritative projection: ${degradedOrder.join("|")}`,
      );
      const degradedCards = degradedScenario.snapshot.optionCardGroups.flatMap((group) => group.cards);
      for (const card of degradedCards) {
        const locator = page.locator(
          `article[data-option-card='${card.optionCardId}'][data-offerability-state]`,
        );
        await locator.waitFor();
        assertCondition(
          (await locator.getAttribute("data-offerability-state")) === card.offerabilityState,
          `degraded filter card ${card.optionCardId} drifted from its authoritative offerability state`,
        );
      }
      assertCondition(
        (await page.locator("[data-option-card][data-offerability-state='direct_commit']").count()) ===
          degradedCards.filter((card) => card.offerabilityState === "direct_commit").length,
        "degraded filter should still expose only the authoritative direct-commit candidate",
      );
      assertCondition(
        (await page.locator("[data-option-card]").evaluateAll((nodes) =>
          nodes.filter((node) => (node.textContent ?? "").includes("Degraded trust")).length,
        )) === degradedCards.filter((card) => card.sourceTrustState === "degraded").length,
        "degraded filter card trust labels diverged from the authoritative projection",
      );

      await page.getByTestId("hub-workbench-saved-view-supplier_drift").click();
      await assertRootMatchesExpectedScenario(page, supplierDriftScenario);
      const supplierOrder = await readQueueOrder(page);
      assertCondition(
        supplierOrder.join("|") === queueOrderForScenario(supplierDriftScenario).join("|"),
        `supplier-drift queue order drifted from the authoritative projection: ${supplierOrder.join("|")}`,
      );

      const quarantinedCard = page.locator(
        "article[data-option-card='opt-041-current'][data-offerability-state]",
      );
      await quarantinedCard.waitFor();
      assertCondition(
        (await quarantinedCard.getAttribute("data-offerability-state")) === "diagnostic_only",
        "quarantined supplier-drift card must remain diagnostic-only",
      );
      assertCondition(
        (await quarantinedCard.getAttribute("data-reservation-truth")) ===
          supplierDriftScenario.snapshot.selectedOptionCard.reservationTruthState,
        "quarantined supplier-drift card lost its authoritative reservation-truth marker",
      );
      assertCondition(
        (await page.locator("[data-option-card][data-offerability-state='direct_commit']").count()) ===
          0,
        "supplier-drift review must not expose a live direct-commit candidate",
      );
      assertCondition(
        (await page.getByTestId("hub-callback-fallback").count()) ===
          (supplierDriftScenario.snapshot.callbackFallbackCard ? 1 : 0),
        "supplier-drift callback fallback presence diverged from the authoritative snapshot",
      );

      writeJsonArtifact("338-capacity-degraded-and-quarantined.json", {
        degradedFilterOrder: degradedOrder,
        authoritativeDegradedFilterOrder: queueOrderForScenario(degradedScenario),
        supplierDriftOrder: supplierOrder,
        authoritativeSupplierDriftOrder: queueOrderForScenario(supplierDriftScenario),
        supplierDriftSelectedOption: supplierDriftScenario.snapshot.selectedOptionCard.optionCardId,
        supplierDriftOptionCards: supplierDriftScenario.snapshot.optionCardGroups.flatMap((group) =>
          group.cards.map((card) => ({
            optionCardId: card.optionCardId,
            sourceTrustState: card.sourceTrustState,
            offerabilityState: card.offerabilityState,
          })),
        ),
      });

      await page.screenshot({
        path: outputPath("338-capacity-degraded-and-quarantined.png"),
        fullPage: true,
      });

      assertCondition(
        externalRequests.size === 0,
        `unexpected external requests: ${Array.from(externalRequests).join(", ")}`,
      );

      await stopTrace(context, "338-capacity-degraded-and-quarantined-trace.zip");
    } catch (error) {
      await stopTraceOnError(context, "338-capacity-degraded-and-quarantined-trace.zip", error);
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
