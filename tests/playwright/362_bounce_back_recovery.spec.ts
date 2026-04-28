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
      workspacePharmacyUrl(baseUrl, "/workspace/pharmacy/PHC-2204/assurance"),
    );
    await waitForWorkspacePharmacyState(page, {
      currentPath: "/workspace/pharmacy/PHC-2204/assurance",
      routeKey: "assurance",
      selectedCaseId: "PHC-2204",
    });

    const root = page.locator("[data-testid='pharmacy-shell-root']");
    assertCondition(
      (await root.getAttribute("data-recovery-visual-mode")) === "Pharmacy_Recovery_Control",
      "Recovery route must expose the recovery visual mode on the shell root.",
    );
    assertCondition(
      (await root.getAttribute("data-recovery-surface-state")) === "routine_reopen",
      "PHC-2204 should expose the routine reopen recovery surface state.",
    );
    assertCondition(
      (await root.getAttribute("data-promoted-support-region")) === "bounce_back_recovery",
      "Recovery route must promote the bounce_back_recovery support region.",
    );
    assertCondition(
      await page.getByTestId("PharmacyRecoveryControlPanel").isVisible(),
      "Recovery route must render the recovery control panel inside the shell.",
    );
    assertCondition(
      await page.getByTestId("OpenOriginalRequestAction").isVisible(),
      "Routine reopen route must show the original-request return action.",
    );

    await page.getByTestId("pharmacy-open-original-request").click();
    await waitForWorkspacePharmacyState(page, {
      currentPath: "/workspace/pharmacy/PHC-2204",
      routeKey: "case",
      selectedCaseId: "PHC-2204",
    });
    assertCondition(
      await page.getByTestId("pharmacy-shell-root").isVisible(),
      "Original request return must stay inside the same pharmacy shell.",
    );

    await page.getByTestId("pharmacy-route-button-assurance").click();
    await waitForWorkspacePharmacyState(page, {
      currentPath: "/workspace/pharmacy/PHC-2204/assurance",
      routeKey: "assurance",
      selectedCaseId: "PHC-2204",
    });

    await openWorkspacePharmacyRoute(
      page,
      workspacePharmacyUrl(baseUrl, "/workspace/pharmacy/PHC-2215/assurance"),
    );
    await waitForWorkspacePharmacyState(page, {
      currentPath: "/workspace/pharmacy/PHC-2215/assurance",
      routeKey: "assurance",
      selectedCaseId: "PHC-2215",
    });
    assertCondition(
      (await root.getAttribute("data-recovery-loop-risk-band")) === "critical",
      "Loop-risk escalation route must surface the critical loop-risk band.",
    );
    assertCondition(
      await page.getByTestId("PharmacyLoopRiskEscalationCard").isVisible(),
      "Escalated recovery route must show the loop-risk escalation card.",
    );
    assertCondition(
      await page.getByTestId("PharmacyRecoveryDecisionDock").isVisible(),
      "Escalated recovery route must centralize actions in the recovery decision dock.",
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
