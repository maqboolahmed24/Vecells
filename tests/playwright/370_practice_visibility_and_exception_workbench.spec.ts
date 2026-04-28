import {
  assertCondition,
  importPlaywright,
  openWorkspacePharmacyRoute,
  startPharmacyConsole,
  stopPharmacyConsole,
  waitForWorkspacePharmacyState,
  workspacePharmacyUrl,
} from "./356_pharmacy_shell.helpers.ts";

export async function run(): Promise<void> {
  const playwright = await importPlaywright();
  if (!playwright) {
    return;
  }

  const { child: pharmacyChild, baseUrl } = await startPharmacyConsole();
  const browser = await playwright.chromium.launch({ headless: true });

  try {
    const context = await browser.newContext({
      viewport: { width: 1366, height: 960 },
      locale: "en-GB",
      timezoneId: "Europe/London",
    });
    const page = await context.newPage();

    await openWorkspacePharmacyRoute(page, workspacePharmacyUrl(baseUrl));
    await waitForWorkspacePharmacyState(page, {
      currentPath: "/workspace/pharmacy",
      routeKey: "lane",
    });
    const root = page.locator("[data-testid='pharmacy-shell-root']");
    assertCondition(
      await page.getByTestId("PharmacyOperationsQueueTable").isVisible(),
      "Practice visibility queue table must render.",
    );
    const queueIndicators = await page
      .locator("table .pharmacy-ops-table__indicator")
      .allTextContents();
    for (const expected of [
      "Waiting For Patient Choice",
      "Waiting For Outcome",
      "Bounce Back",
      "Provider Outage",
      "Handoff Blocked",
    ]) {
      assertCondition(queueIndicators.includes(expected), `Queue table must expose ${expected}.`);
    }

    await page.getByTestId("pharmacy-case-PHC-2244").click();
    await waitForWorkspacePharmacyState(page, {
      currentPath: "/workspace/pharmacy/PHC-2244",
      routeKey: "case",
      selectedCaseId: "PHC-2244",
    });
    assertCondition(
      (await root.getAttribute("data-workbench-provider-health")) === "outage",
      "Provider outage case must expose outage health state.",
    );
    assertCondition(
      /outage|block/i.test((await root.getAttribute("data-workbench-handoff-state")) ?? ""),
      "Provider outage case must block handoff release.",
    );
    assertCondition(
      await page.getByTestId("PharmacyWorkbenchDecisionDock").isVisible(),
      "Outage case must keep the decision dock visible.",
    );

    await page.getByTestId("pharmacy-route-button-handoff").click();
    await waitForWorkspacePharmacyState(page, {
      currentPath: "/workspace/pharmacy/PHC-2244/handoff",
      routeKey: "handoff",
      selectedCaseId: "PHC-2244",
    });
    assertCondition(
      ((await page.getByTestId("HandoffReadinessBoard").textContent()) ?? "").includes(
        "provider_connectivity_outage",
      ),
      "Handoff readiness board must keep provider outage blocker explicit.",
    );

    await openWorkspacePharmacyRoute(
      page,
      workspacePharmacyUrl(baseUrl, "/workspace/pharmacy/PHC-2168/assurance"),
    );
    await waitForWorkspacePharmacyState(page, {
      currentPath: "/workspace/pharmacy/PHC-2168/assurance",
      routeKey: "assurance",
      selectedCaseId: "PHC-2168",
    });
    assertCondition(
      (await root.getAttribute("data-assurance-outcome-truth-state")) === "unmatched",
      "Unmatched outcome must remain visible in assurance.",
    );
    assertCondition(
      (await root.getAttribute("data-assurance-gate-state")) === "open",
      "Unmatched outcome must keep the reconciliation gate open.",
    );
    assertCondition(
      await page.getByTestId("PharmacyOutcomeAssurancePanel").isVisible(),
      "Unmatched outcome must render the assurance panel.",
    );

    await context.close();
  } finally {
    await browser.close();
    await stopPharmacyConsole(pharmacyChild);
  }
}

if (process.argv.includes("--run")) {
  run().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
