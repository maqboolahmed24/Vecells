import {
  assertCondition,
  assertNoHorizontalOverflow,
  importPlaywright,
  openPatientPharmacyRoute,
  openWorkspacePharmacyRoute,
  outputPath,
  patientPharmacyUrl,
  startPatientWeb,
  startPharmacyConsole,
  stopPatientWeb,
  stopPharmacyConsole,
  waitForPatientPharmacyState,
  waitForWorkspacePharmacyState,
  workspacePharmacyUrl,
} from "./356_pharmacy_shell.helpers.ts";

export async function run(): Promise<void> {
  const playwright = await importPlaywright();
  if (!playwright) {
    return;
  }

  const [{ child: pharmacyChild, baseUrl: pharmacyBaseUrl }, { child: patientChild, baseUrl: patientBaseUrl }] =
    await Promise.all([startPharmacyConsole(), startPatientWeb()]);
  const browser = await playwright.chromium.launch({ headless: true });

  try {
    const workspaceContext = await browser.newContext({
      viewport: { width: 390, height: 844 },
      locale: "en-GB",
      timezoneId: "Europe/London",
    });
    const workspacePage = await workspaceContext.newPage();
    await openWorkspacePharmacyRoute(
      workspacePage,
      workspacePharmacyUrl(pharmacyBaseUrl, "/workspace/pharmacy/PHC-2103/assurance"),
    );
    await waitForWorkspacePharmacyState(workspacePage, {
      currentPath: "/workspace/pharmacy/PHC-2103/assurance",
      layoutMode: "mission_stack",
      breakpointClass: "compact",
      routeKey: "assurance",
      recoveryPosture: "recovery_only",
      selectedCaseId: "PHC-2103",
    });
    await assertNoHorizontalOverflow(workspacePage, "356 workspace mission stack");
    assertCondition(
      await workspacePage.getByTestId("PharmacyDecisionDockHost").isVisible(),
      "workspace decision dock should remain visible in mission_stack",
    );
    await workspacePage.screenshot({
      path: outputPath("356-workspace-pharmacy-responsive.png"),
      fullPage: true,
    });
    await workspaceContext.close();

    const patientContext = await browser.newContext({
      viewport: { width: 390, height: 844 },
      locale: "en-GB",
      timezoneId: "Europe/London",
    });
    const patientPage = await patientContext.newPage();
    await openPatientPharmacyRoute(
      patientPage,
      patientPharmacyUrl(patientBaseUrl, "PHC-2103", "status"),
    );
    await waitForPatientPharmacyState(patientPage, {
      currentPath: "/pharmacy/PHC-2103/status",
      layoutMode: "mission_stack",
      breakpointClass: "compact",
      routeKey: "status",
      recoveryPosture: "recovery_only",
      selectedCaseId: "PHC-2103",
    });
    await assertNoHorizontalOverflow(patientPage, "356 patient pharmacy mission stack");
    await patientPage.getByTestId("patient-pharmacy-route-choose").click();
    await waitForPatientPharmacyState(patientPage, {
      currentPath: "/pharmacy/PHC-2103/choose",
      layoutMode: "mission_stack",
      breakpointClass: "compact",
      routeKey: "choose",
      recoveryPosture: "recovery_only",
      selectedCaseId: "PHC-2103",
    });
    assertCondition(
      (await patientPage
        .locator("[data-testid='pharmacy-patient-shell-root']")
        .getAttribute("data-chosen-provider-ref")) === "Riverside Pharmacy",
      "patient responsive fold should preserve the chosen provider anchor",
    );
    await patientPage.screenshot({
      path: outputPath("356-patient-pharmacy-responsive.png"),
      fullPage: true,
    });
    await patientContext.close();
  } finally {
    await browser.close();
    await Promise.all([stopPharmacyConsole(pharmacyChild), stopPatientWeb(patientChild)]);
  }
}

if (process.argv.includes("--run")) {
  run().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
