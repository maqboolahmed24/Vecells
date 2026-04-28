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
      viewport: { width: 1440, height: 1024 },
      locale: "en-GB",
      timezoneId: "Europe/London",
    });
    const page = await context.newPage();
    const root = page.locator("[data-testid='pharmacy-shell-root']");

    await openWorkspacePharmacyRoute(
      page,
      workspacePharmacyUrl(baseUrl, "/workspace/pharmacy/PHC-2103/assurance"),
    );
    await waitForWorkspacePharmacyState(page, {
      currentPath: "/workspace/pharmacy/PHC-2103/assurance",
      routeKey: "assurance",
      selectedCaseId: "PHC-2103",
      recoveryPosture: "recovery_only",
    });
    assertCondition(
      (await root.getAttribute("data-recovery-surface-state")) === "urgent_return",
      "PHC-2103 must expose urgent_return recovery.",
    );
    assertCondition(
      (await root.getAttribute("data-recovery-urgent-mode")) === "dedicated_professional_number",
      "Urgent return must expose the dedicated professional route class.",
    );
    assertCondition(
      (await page.locator("[data-testid='PharmacyReopenedCaseBanner'][role='alert']").count()) ===
        1,
      "Urgent staff return must use alert semantics.",
    );
    assertCondition(
      ((await page.getByTestId("PharmacyUrgentReturnMode").textContent()) ?? "").includes(
        "Integrated care desk",
      ),
      "Urgent return must keep the direct professional route visible.",
    );

    await openWorkspacePharmacyRoute(
      page,
      workspacePharmacyUrl(baseUrl, "/workspace/pharmacy/PHC-2204/assurance"),
    );
    await waitForWorkspacePharmacyState(page, {
      currentPath: "/workspace/pharmacy/PHC-2204/assurance",
      routeKey: "assurance",
      selectedCaseId: "PHC-2204",
      recoveryPosture: "recovery_only",
    });
    assertCondition(
      (await root.getAttribute("data-recovery-surface-state")) === "routine_reopen",
      "PHC-2204 must expose routine_reopen recovery.",
    );
    assertCondition(
      await page.getByTestId("PharmacyReopenDiffStrip").isVisible(),
      "Routine reopen must keep the diff-first strip visible.",
    );
    assertCondition(
      await page.getByTestId("OpenOriginalRequestAction").isVisible(),
      "Routine reopen must keep the original request action visible.",
    );
    await page.getByTestId("pharmacy-open-original-request").click();
    await waitForWorkspacePharmacyState(page, {
      currentPath: "/workspace/pharmacy/PHC-2204",
      routeKey: "case",
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
      recoveryPosture: "recovery_only",
    });
    assertCondition(
      (await root.getAttribute("data-recovery-surface-state")) === "loop_risk_escalated",
      "PHC-2215 must expose loop-risk escalated recovery.",
    );
    assertCondition(
      (await root.getAttribute("data-recovery-loop-risk-band")) === "critical",
      "Repeated bounce-back must expose critical loop risk.",
    );
    assertCondition(
      await page.getByTestId("PharmacyLoopRiskEscalationCard").isVisible(),
      "Loop-risk route must render the supervisor escalation card.",
    );
    assertCondition(
      await page.getByTestId("PharmacyRecoveryDecisionDock").isVisible(),
      "Loop-risk route must centralize actions in the recovery decision dock.",
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
