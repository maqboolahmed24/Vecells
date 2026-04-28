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
      viewport: { width: 1366, height: 960 },
      locale: "en-GB",
      timezoneId: "Europe/London",
    });
    const desktopPage = await desktopContext.newPage();

    await openPatientPharmacyRoute(
      desktopPage,
      patientPharmacyUrl(baseUrl, "PHC-2184", "instructions"),
    );
    await waitForPatientPharmacyState(desktopPage, {
      currentPath: "/pharmacy/PHC-2184/instructions",
      routeKey: "instructions",
      selectedCaseId: "PHC-2184",
    });
    await desktopPage.screenshot({
      path: outputPath("360-pharmacy-referral-confirmed-instructions.png"),
      fullPage: true,
    });

    await openPatientPharmacyRoute(
      desktopPage,
      patientPharmacyUrl(baseUrl, "PHC-2196", "status"),
    );
    await waitForPatientPharmacyState(desktopPage, {
      currentPath: "/pharmacy/PHC-2196/status",
      routeKey: "status",
      selectedCaseId: "PHC-2196",
    });
    await desktopPage.screenshot({
      path: outputPath("360-pharmacy-completed-status.png"),
      fullPage: true,
    });

    await openPatientPharmacyRoute(
      desktopPage,
      patientPharmacyUrl(baseUrl, "PHC-2090", "status"),
    );
    await waitForPatientPharmacyState(desktopPage, {
      currentPath: "/pharmacy/PHC-2090/status",
      routeKey: "status",
      selectedCaseId: "PHC-2090",
    });
    await desktopPage.screenshot({
      path: outputPath("360-pharmacy-review-next-step-status.png"),
      fullPage: true,
    });
    await desktopContext.close();

    const mobileContext = await browser.newContext({
      viewport: { width: 390, height: 844 },
      locale: "en-GB",
      timezoneId: "Europe/London",
      reducedMotion: "reduce",
    });
    const mobilePage = await mobileContext.newPage();
    await openPatientPharmacyRoute(
      mobilePage,
      patientPharmacyUrl(baseUrl, "PHC-2188", "instructions"),
    );
    await waitForPatientPharmacyState(mobilePage, {
      currentPath: "/pharmacy/PHC-2188/instructions",
      routeKey: "instructions",
      selectedCaseId: "PHC-2188",
      recoveryPosture: "read_only",
    });
    await assertNoHorizontalOverflow(mobilePage, "360 visual mobile repair");
    await mobilePage.screenshot({
      path: outputPath("360-pharmacy-contact-repair-mobile.png"),
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
