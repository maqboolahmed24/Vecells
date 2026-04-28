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
      workspacePharmacyUrl(pharmacyBaseUrl, "/workspace/pharmacy/PHC-2057"),
    );
    await waitForWorkspacePharmacyState(workspacePage, {
      currentPath: "/workspace/pharmacy/PHC-2057",
      routeKey: "case",
      selectedCaseId: "PHC-2057",
    });
    assertCondition(
      (await workspacePage
        .locator("[data-testid='pharmacy-shell-root']")
        .getAttribute("data-visual-mode")) === "Pharmacy_Mission_Frame",
      "workspace visual mode should be Pharmacy_Mission_Frame",
    );
    await workspacePage.screenshot({
      path: outputPath("356-workspace-pharmacy-visual.png"),
      fullPage: true,
    });
    await workspaceContext.close();

    const patientContext = await browser.newContext({
      viewport: { width: 1280, height: 960 },
      locale: "en-GB",
      timezoneId: "Europe/London",
    });
    const patientPage = await patientContext.newPage();
    await openPatientPharmacyRoute(
      patientPage,
      patientPharmacyUrl(patientBaseUrl, "PHC-2048", "choose"),
    );
    await waitForPatientPharmacyState(patientPage, {
      currentPath: "/pharmacy/PHC-2048/choose",
      routeKey: "choose",
      selectedCaseId: "PHC-2048",
    });
    assertCondition(
      (await patientPage
        .locator("[data-testid='pharmacy-patient-shell-root']")
        .getAttribute("data-visual-mode")) === "Pharmacy_Mission_Frame",
      "patient visual mode should be Pharmacy_Mission_Frame",
    );
    await patientPage.screenshot({
      path: outputPath("356-patient-pharmacy-visual.png"),
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
