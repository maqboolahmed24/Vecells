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

    const root = page.locator("[data-testid='pharmacy-shell-root']");
    assertCondition(
      (await root.getAttribute("data-recovery-surface-state")) === "urgent_return",
      "Urgent return route must surface the urgent recovery state.",
    );
    assertCondition(
      (await root.getAttribute("data-recovery-urgent-mode")) === "dedicated_professional_number",
      "Urgent return route must expose the dedicated professional route mode.",
    );
    assertCondition(
      await page.getByTestId("PharmacyUrgentReturnMode").isVisible(),
      "Urgent return route must render the urgent return mode card.",
    );
    assertCondition(
      (await page.locator("[data-testid='PharmacyReopenedCaseBanner'][role='alert']").count()) === 1,
      "Urgent return banner must announce the urgent recovery posture as an alert.",
    );
    assertCondition(
      ((await page.getByTestId("PharmacyUrgentReturnMode").textContent()) ?? "").includes(
        "Integrated care desk",
      ),
      "Urgent return mode card must keep the direct professional route visible.",
    );

    await page.getByTestId("pharmacy-recovery-decisiondock-primary").click();
    await waitForWorkspacePharmacyState(page, {
      currentPath: "/workspace/pharmacy/PHC-2103/validate",
      routeKey: "validate",
      selectedCaseId: "PHC-2103",
      recoveryPosture: "recovery_only",
    });
    assertCondition(
      await page.getByTestId("pharmacy-shell-root").isVisible(),
      "Urgent recovery primary action must keep the user inside the same shell.",
    );

    await page.getByTestId("pharmacy-route-button-assurance").click();
    await waitForWorkspacePharmacyState(page, {
      currentPath: "/workspace/pharmacy/PHC-2103/assurance",
      routeKey: "assurance",
      selectedCaseId: "PHC-2103",
      recoveryPosture: "recovery_only",
    });
    await page.getByTestId("pharmacy-recovery-decisiondock-open-handoff").click();
    await waitForWorkspacePharmacyState(page, {
      currentPath: "/workspace/pharmacy/PHC-2103/handoff",
      routeKey: "handoff",
      selectedCaseId: "PHC-2103",
      recoveryPosture: "recovery_only",
    });

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
