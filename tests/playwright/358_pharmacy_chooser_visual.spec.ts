import {
  assertNoHorizontalOverflow,
  importPlaywright,
  openPatientPharmacyRoute,
  outputPath,
  patientPharmacyUrl,
  startPatientWeb,
  stopPatientWeb,
  waitForPatientPharmacyState,
} from "./356_pharmacy_shell.helpers.ts";

export async function run(): Promise<void> {
  const playwright = await importPlaywright();
  if (!playwright) {
    return;
  }

  const { child: patientChild, baseUrl } = await startPatientWeb();
  const browser = await playwright.chromium.launch({ headless: true });

  try {
    const desktopContext = await browser.newContext({
      viewport: { width: 1440, height: 1100 },
      locale: "en-GB",
      timezoneId: "Europe/London",
    });
    const desktop = await desktopContext.newPage();

    await openPatientPharmacyRoute(desktop, patientPharmacyUrl(baseUrl, "PHC-2048", "choose"));
    await waitForPatientPharmacyState(desktop, {
      currentPath: "/pharmacy/PHC-2048/choose",
      routeKey: "choose",
      selectedCaseId: "PHC-2048",
    });
    await desktop.screenshot({
      path: outputPath("358-pharmacy-chooser-list-only.png"),
      fullPage: true,
    });

    await desktop.getByTestId("pharmacy-choice-map-toggle").click();
    await desktop.screenshot({
      path: outputPath("358-pharmacy-chooser-list-map.png"),
      fullPage: true,
    });

    await openPatientPharmacyRoute(desktop, patientPharmacyUrl(baseUrl, "PHC-2156", "choose"));
    await waitForPatientPharmacyState(desktop, {
      currentPath: "/pharmacy/PHC-2156/choose",
      routeKey: "choose",
      selectedCaseId: "PHC-2156",
      recoveryPosture: "read_only",
    });
    await desktop.screenshot({
      path: outputPath("358-pharmacy-chooser-drift-recovery.png"),
      fullPage: true,
    });
    await desktopContext.close();

    const mobileContext = await browser.newContext({
      viewport: { width: 390, height: 844 },
      locale: "en-GB",
      timezoneId: "Europe/London",
      reducedMotion: "reduce",
    });
    const mobile = await mobileContext.newPage();
    await openPatientPharmacyRoute(mobile, patientPharmacyUrl(baseUrl, "PHC-2148", "choose"));
    await waitForPatientPharmacyState(mobile, {
      currentPath: "/pharmacy/PHC-2148/choose",
      routeKey: "choose",
      selectedCaseId: "PHC-2148",
    });
    await assertNoHorizontalOverflow(mobile, "358 pharmacy chooser visual mobile");
    await mobile.screenshot({
      path: outputPath("358-pharmacy-chooser-mobile-warning.png"),
      fullPage: true,
    });
    await mobileContext.close();
  } finally {
    await browser.close();
    await stopPatientWeb(patientChild);
  }
}

if (process.argv.includes("--run")) {
  run().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
