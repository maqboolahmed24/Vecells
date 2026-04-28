import {
  assertCondition,
  importPlaywright,
  openPatientPharmacyRoute,
  openWorkspacePharmacyRoute,
  startPatientWeb,
  startPharmacyConsole,
  stopPatientWeb,
  stopPharmacyConsole,
  waitForPatientPharmacyState,
  waitForWorkspacePharmacyState,
  workspacePharmacyUrl,
  patientPharmacyUrl,
  writeAccessibilitySnapshot,
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
      viewport: { width: 1280, height: 960 },
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
      routeKey: "assurance",
      recoveryPosture: "recovery_only",
    });
    assertCondition(
      (await workspacePage.locator("header[role='banner']").count()) === 1,
      "workspace shell should expose exactly one banner landmark",
    );
    assertCondition(
      (await workspacePage.locator("main[role='main']").count()) === 1,
      "workspace shell should expose exactly one main landmark",
    );
    await writeAccessibilitySnapshot(workspacePage, "356-workspace-pharmacy-a11y.json");
    await workspaceContext.close();

    const patientContext = await browser.newContext({
      viewport: { width: 1280, height: 960 },
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
      routeKey: "status",
      recoveryPosture: "recovery_only",
    });
    assertCondition(
      (await patientPage.locator("header[role='banner']").count()) === 1,
      "patient shell should expose exactly one banner landmark",
    );
    assertCondition(
      (await patientPage.locator("main[role='main']").count()) === 1,
      "patient shell should expose exactly one main landmark",
    );
    assertCondition(
      await patientPage.getByTestId("PharmacyRouteRecoveryFrame").isVisible(),
      "patient recovery route should expose the recovery frame",
    );
    await writeAccessibilitySnapshot(patientPage, "356-patient-pharmacy-a11y.json");
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
