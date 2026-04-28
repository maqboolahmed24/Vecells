import {
  assertCondition,
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
      viewport: { width: 1440, height: 1080 },
      locale: "en-GB",
      timezoneId: "Europe/London",
    });
    const workspacePage = await workspaceContext.newPage();
    await openWorkspacePharmacyRoute(
      workspacePage,
      workspacePharmacyUrl(pharmacyBaseUrl, "/workspace/pharmacy/PHC-2090/validate"),
    );
    await waitForWorkspacePharmacyState(workspacePage, {
      currentPath: "/workspace/pharmacy/PHC-2090/validate",
      routeKey: "validate",
      selectedCaseId: "PHC-2090",
    });
    assertCondition(
      (await workspacePage.getByTestId("PharmacyEligibilityRuleExplainer").getAttribute("data-visual-mode")) ===
        "Pharmacy_Eligibility_Clarity",
      "staff explainer visual mode should be Pharmacy_Eligibility_Clarity",
    );
    await workspacePage.screenshot({
      path: outputPath("357-workspace-eligibility-returned.png"),
      fullPage: true,
    });

    await openWorkspacePharmacyRoute(
      workspacePage,
      workspacePharmacyUrl(pharmacyBaseUrl, "/workspace/pharmacy/PHC-2124"),
    );
    await waitForWorkspacePharmacyState(workspacePage, {
      currentPath: "/workspace/pharmacy/PHC-2124",
      routeKey: "case",
      selectedCaseId: "PHC-2124",
    });
    await workspacePage.screenshot({
      path: outputPath("357-workspace-eligibility-superseded.png"),
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
      patientPharmacyUrl(patientBaseUrl, "PHC-2090", "choose"),
    );
    await waitForPatientPharmacyState(patientPage, {
      currentPath: "/pharmacy/PHC-2090/choose",
      routeKey: "choose",
      selectedCaseId: "PHC-2090",
    });
    assertCondition(
      (await patientPage.getByTestId("PatientUnsuitableReturnState").getAttribute("data-visual-mode")) ===
        "Pharmacy_Eligibility_Clarity",
      "patient unsuitable-return visual mode should be Pharmacy_Eligibility_Clarity",
    );
    await patientPage.screenshot({
      path: outputPath("357-patient-unsuitable-return-mobile.png"),
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
