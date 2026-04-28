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

    await openWorkspacePharmacyRoute(
      page,
      workspacePharmacyUrl(baseUrl, "/workspace/pharmacy/PHC-2124/assurance"),
    );
    await waitForWorkspacePharmacyState(page, {
      currentPath: "/workspace/pharmacy/PHC-2124/assurance",
      routeKey: "assurance",
      selectedCaseId: "PHC-2124",
    });

    const root = page.locator("[data-testid='pharmacy-shell-root']");
    assertCondition(
      (await root.getAttribute("data-assurance-visual-mode")) === "Pharmacy_Assurance_Workbench",
      "Assurance route must expose the assurance visual mode on the shell root.",
    );
    assertCondition(
      (await root.getAttribute("data-assurance-surface-state")) === "ambiguous_review",
      "PHC-2124 should expose the ambiguous assurance state.",
    );
    assertCondition(
      (await root.getAttribute("data-assurance-confidence-band")) === "low",
      "PHC-2124 should expose a low confidence band.",
    );
    assertCondition(
      (await root.getAttribute("data-promoted-support-region")) === "outcome_assurance",
      "Assurance route must promote the outcome_assurance support region.",
    );
    assertCondition(
      await page.getByTestId("PharmacyOutcomeAssurancePanel").isVisible(),
      "Assurance route must render the assurance panel inside the shell.",
    );
    assertCondition(
      await page.getByTestId("OutcomeDecisionDock").isVisible(),
      "Assurance route must centralize actions in the outcome decision dock.",
    );
    assertCondition(
      ((await page.getByTestId("OutcomeMatchSummary").textContent()) ?? "").includes("PHC-2124"),
      "The match summary must keep the active case anchor visible.",
    );

    await page.getByTestId("outcome-decisiondock-primary").click();
    await waitForWorkspacePharmacyState(page, {
      currentPath: "/workspace/pharmacy/PHC-2124/resolve",
      routeKey: "resolve",
      selectedCaseId: "PHC-2124",
    });
    assertCondition(
      await page.getByTestId("pharmacy-shell-root").isVisible(),
      "DecisionDock actions must keep the user inside the same pharmacy shell.",
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
