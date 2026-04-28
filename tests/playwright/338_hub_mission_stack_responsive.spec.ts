import {
  assertCondition,
  assertNoHorizontalOverflow,
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

export const missionStackResponsiveCoverage338 = [
  "mission_stack keeps the same active case and DecisionDock meaning on mobile and tablet",
  "saved-view continuity and support-drawer travel do not break the selected queue or option anchors after reload",
  "320px high-zoom proxy and reduced-motion mode preserve authority without horizontal overflow",
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
  const mobileScenario = buildExpectedHubScenario("/hub/queue", 390, {
    selectedSavedViewId: "callback_recovery",
  });
  const tabletScenario = buildExpectedHubScenario("/hub/queue", 834, {
    selectedSavedViewId: "callback_recovery",
  });

  try {
    const mobileContext = await browser.newContext({
      viewport: { width: 390, height: 844 },
      locale: "en-GB",
      timezoneId: "Europe/London",
    });
    await startTrace(mobileContext);

    try {
      const mobilePage = await mobileContext.newPage();
      const externalRequests = new Set<string>();
      trackExternalRequests(mobilePage, baseUrl, externalRequests);

      await openHubRoute(mobilePage, `${baseUrl}/hub/queue`, "HubMissionStackLayout");
      await mobilePage.getByTestId("hub-mission-stack-saved-view-callback_recovery").click();
      await assertRootMatchesExpectedScenario(mobilePage, mobileScenario);
      assertCondition(
        (await readQueueOrder(mobilePage)).join("|") === queueOrderForScenario(mobileScenario).join("|"),
        "mobile mission_stack queue order diverged from the authoritative snapshot",
      );
      assertCondition(
        (await mobilePage.getByTestId("HubDecisionDockBar").getAttribute("data-selected-option")) ===
          mobileScenario.snapshot.selectedOptionCard.optionCardId,
        "mobile mission_stack DecisionDock anchor diverged from the authoritative snapshot",
      );

      await mobilePage
        .locator("[data-testid='HubSupportTriggerRow'] [data-support-region='visibility']")
        .click();
      await mobilePage
        .locator("[data-testid='HubSupportDrawer'][data-support-region='visibility']")
        .waitFor();
      await mobilePage.reload({ waitUntil: "networkidle" });
      await assertRootMatchesExpectedScenario(mobilePage, mobileScenario);
      assertCondition(
        (await mobilePage.getByTestId("HubMissionStackContinuityBinder").getAttribute(
          "data-selected-option-card",
        )) === mobileScenario.snapshot.selectedOptionCard.optionCardId,
        "mobile mission_stack continuity binder lost the selected option anchor after reload",
      );

      await mobilePage.screenshot({
        path: outputPath("338-hub-mission-stack-mobile.png"),
        fullPage: true,
      });

      assertCondition(
        externalRequests.size === 0,
        `unexpected mobile external requests: ${Array.from(externalRequests).join(", ")}`,
      );
      await stopTrace(mobileContext, "338-hub-mission-stack-mobile-trace.zip");
    } catch (error) {
      await stopTraceOnError(mobileContext, "338-hub-mission-stack-mobile-trace.zip", error);
    } finally {
      await mobileContext.close();
    }

    const tabletContext = await browser.newContext({
      viewport: { width: 834, height: 1112 },
      locale: "en-GB",
      timezoneId: "Europe/London",
    });
    await startTrace(tabletContext);

    try {
      const tabletPage = await tabletContext.newPage();
      await openHubRoute(tabletPage, `${baseUrl}/hub/queue`, "HubMissionStackLayout");
      await tabletPage.getByTestId("hub-mission-stack-saved-view-callback_recovery").click();
      await assertRootMatchesExpectedScenario(tabletPage, tabletScenario);
      assertCondition(
        (await tabletPage.getByTestId("HubDecisionDockBar").getAttribute("data-selected-option")) ===
          tabletScenario.snapshot.selectedOptionCard.optionCardId,
        "tablet mission_stack DecisionDock anchor diverged from the authoritative snapshot",
      );
      await tabletPage.screenshot({
        path: outputPath("338-hub-mission-stack-tablet.png"),
        fullPage: true,
      });
      await stopTrace(tabletContext, "338-hub-mission-stack-tablet-trace.zip");
    } catch (error) {
      await stopTraceOnError(tabletContext, "338-hub-mission-stack-tablet-trace.zip", error);
    } finally {
      await tabletContext.close();
    }

    const reducedContext = await browser.newContext({
      viewport: { width: 320, height: 800 },
      reducedMotion: "reduce",
      locale: "en-GB",
      timezoneId: "Europe/London",
    });
    await startTrace(reducedContext);

    try {
      const reducedPage = await reducedContext.newPage();
      await openHubRoute(reducedPage, `${baseUrl}/hub/queue`, "HubMissionStackLayout");
      await reducedPage.getByTestId("hub-mission-stack-saved-view-callback_recovery").click();
      await waitForRootAttributes(reducedPage, {
        "data-layout-mode": "mission_stack",
        "data-breakpoint-class": "compact",
        "data-reduced-motion": "reduce",
      });
      await assertNoHorizontalOverflow(reducedPage, "338 mission_stack 320px reduced-motion");
      const transitionDuration = await reducedPage
        .getByTestId("hub-mission-stack-dominant-action")
        .evaluate((node) => window.getComputedStyle(node).transitionDuration);
      assertCondition(
        transitionDuration.includes("0.01ms") ||
          transitionDuration.includes("1e-05s") ||
          transitionDuration.includes("0s"),
        `mission_stack reduced-motion transition did not collapse: ${transitionDuration}`,
      );
      await reducedPage.screenshot({
        path: outputPath("338-hub-mission-stack-320-reduced.png"),
        fullPage: true,
      });
      writeJsonArtifact("338-hub-mission-stack-responsive.json", {
        mobileSelectedOption: mobileScenario.snapshot.selectedOptionCard.optionCardId,
        mobileQueueOrder: queueOrderForScenario(mobileScenario),
        tabletSelectedOption: tabletScenario.snapshot.selectedOptionCard.optionCardId,
        compactBreakpointClass: "compact",
        reducedMotion: "reduce",
      });
      await stopTrace(reducedContext, "338-hub-mission-stack-320-trace.zip");
    } catch (error) {
      await stopTraceOnError(reducedContext, "338-hub-mission-stack-320-trace.zip", error);
    } finally {
      await reducedContext.close();
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
