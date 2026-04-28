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
} from "./365_pharmacy_accessibility.helpers.ts";

export async function run(): Promise<void> {
  const playwright = await importPlaywright();
  if (!playwright) {
    return;
  }

  const { child: patientChild, baseUrl: patientBaseUrl } = await startPatientWeb();
  const { child: pharmacyChild, baseUrl: pharmacyBaseUrl } = await startPharmacyConsole();
  const browser = await playwright.chromium.launch({ headless: true });

  try {
    const desktopContext = await browser.newContext({
      viewport: { width: 1366, height: 960 },
      locale: "en-GB",
      timezoneId: "Europe/London",
    });
    const patientPage = await desktopContext.newPage();
    await openPatientPharmacyRoute(
      patientPage,
      patientPharmacyUrl(patientBaseUrl, "PHC-2148", "choose"),
    );
    await waitForPatientPharmacyState(patientPage, {
      currentPath: "/pharmacy/PHC-2148/choose",
      routeKey: "choose",
      selectedCaseId: "PHC-2148",
    });
    await patientPage.screenshot({
      path: outputPath("365-patient-pharmacy-chooser-accessibility.png"),
      fullPage: true,
    });

    const pharmacyPage = await desktopContext.newPage();
    await openWorkspacePharmacyRoute(
      pharmacyPage,
      workspacePharmacyUrl(pharmacyBaseUrl, "/workspace/pharmacy/PHC-2244/handoff"),
    );
    await waitForWorkspacePharmacyState(pharmacyPage, {
      currentPath: "/workspace/pharmacy/PHC-2244/handoff",
      routeKey: "handoff",
      selectedCaseId: "PHC-2244",
    });
    await pharmacyPage.screenshot({
      path: outputPath("365-pharmacy-console-handoff-accessibility.png"),
      fullPage: true,
    });
    await desktopContext.close();

    const mobileContext = await browser.newContext({
      viewport: { width: 390, height: 844 },
      locale: "en-GB",
      timezoneId: "Europe/London",
      reducedMotion: "reduce",
    });
    const mobilePatient = await mobileContext.newPage();
    await openPatientPharmacyRoute(
      mobilePatient,
      patientPharmacyUrl(patientBaseUrl, "PHC-2188", "status"),
    );
    await waitForPatientPharmacyState(mobilePatient, {
      currentPath: "/pharmacy/PHC-2188/status",
      routeKey: "status",
      selectedCaseId: "PHC-2188",
      recoveryPosture: "read_only",
    });
    await assertNoHorizontalOverflow(mobilePatient, "365 patient visual mobile");
    await mobilePatient.screenshot({
      path: outputPath("365-patient-pharmacy-status-mobile.png"),
      fullPage: true,
    });

    const mobilePharmacy = await mobileContext.newPage();
    await openWorkspacePharmacyRoute(
      mobilePharmacy,
      workspacePharmacyUrl(pharmacyBaseUrl, "/workspace/pharmacy/PHC-2215/assurance"),
    );
    await waitForWorkspacePharmacyState(mobilePharmacy, {
      currentPath: "/workspace/pharmacy/PHC-2215/assurance",
      routeKey: "assurance",
      selectedCaseId: "PHC-2215",
      recoveryPosture: "recovery_only",
    });
    await assertNoHorizontalOverflow(mobilePharmacy, "365 pharmacy visual mobile");
    await mobilePharmacy.screenshot({
      path: outputPath("365-pharmacy-console-assurance-mobile.png"),
      fullPage: true,
    });
    await mobileContext.close();
  } finally {
    await browser.close();
    await stopPatientWeb(patientChild);
    await stopPharmacyConsole(pharmacyChild);
  }
}

if (process.argv.includes("--run")) {
  run().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
