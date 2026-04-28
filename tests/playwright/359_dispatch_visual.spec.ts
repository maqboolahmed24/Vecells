import {
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
      viewport: { width: 1440, height: 1024 },
      locale: "en-GB",
      timezoneId: "Europe/London",
    });
    const workspacePage = await workspaceContext.newPage();
    await openWorkspacePharmacyRoute(
      workspacePage,
      workspacePharmacyUrl(pharmacyBaseUrl, "/workspace/pharmacy/PHC-2057/handoff"),
    );
    await waitForWorkspacePharmacyState(workspacePage, {
      currentPath: "/workspace/pharmacy/PHC-2057/handoff",
      routeKey: "handoff",
      selectedCaseId: "PHC-2057",
    });
    await workspacePage.getByTestId("open-referral-confirmation-drawer").click();
    await workspacePage.screenshot({
      path: outputPath("359-staff-referral-confirmation-drawer.png"),
      fullPage: true,
    });
    await workspaceContext.close();

    const patientDesktop = await browser.newContext({
      viewport: { width: 1366, height: 960 },
      locale: "en-GB",
      timezoneId: "Europe/London",
    });
    const patientDesktopPage = await patientDesktop.newPage();
    await openPatientPharmacyRoute(
      patientDesktopPage,
      patientPharmacyUrl(patientBaseUrl, "PHC-2057", "status"),
    );
    await waitForPatientPharmacyState(patientDesktopPage, {
      currentPath: "/pharmacy/PHC-2057/status",
      routeKey: "status",
      selectedCaseId: "PHC-2057",
    });
    await patientDesktopPage.screenshot({
      path: outputPath("359-patient-dispatch-pending.png"),
      fullPage: true,
    });

    await openPatientPharmacyRoute(
      patientDesktopPage,
      patientPharmacyUrl(patientBaseUrl, "PHC-2090", "instructions"),
    );
    await waitForPatientPharmacyState(patientDesktopPage, {
      currentPath: "/pharmacy/PHC-2090/instructions",
      routeKey: "instructions",
      selectedCaseId: "PHC-2090",
    });
    await patientDesktopPage.screenshot({
      path: outputPath("359-patient-consent-blocked.png"),
      fullPage: true,
    });
    await patientDesktop.close();

    const patientMobile = await browser.newContext({
      viewport: { width: 390, height: 844 },
      locale: "en-GB",
      timezoneId: "Europe/London",
      reducedMotion: "reduce",
    });
    const patientMobilePage = await patientMobile.newPage();
    await openPatientPharmacyRoute(
      patientMobilePage,
      patientPharmacyUrl(patientBaseUrl, "PHC-2156", "status"),
    );
    await waitForPatientPharmacyState(patientMobilePage, {
      currentPath: "/pharmacy/PHC-2156/status",
      routeKey: "status",
      selectedCaseId: "PHC-2156",
      recoveryPosture: "read_only",
    });
    await assertNoHorizontalOverflow(patientMobilePage, "359 dispatch visual mobile");
    await patientMobilePage.screenshot({
      path: outputPath("359-patient-continuity-drift-mobile.png"),
      fullPage: true,
    });
    await patientMobile.close();
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
