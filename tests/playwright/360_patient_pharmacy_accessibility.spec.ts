import {
  assertCondition,
  assertNoHorizontalOverflow,
  importPlaywright,
  openPatientPharmacyRoute,
  patientPharmacyUrl,
  startPatientWeb,
  stopPatientWeb,
  waitForPatientPharmacyState,
  writeAccessibilitySnapshot,
} from "./356_pharmacy_shell.helpers.ts";

export async function run(): Promise<void> {
  const playwright = await importPlaywright();
  if (!playwright) {
    return;
  }

  const { child: patientChild, baseUrl } = await startPatientWeb();
  const browser = await playwright.chromium.launch({ headless: true });

  try {
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
    await assertNoHorizontalOverflow(mobilePage, "360 patient pharmacy mobile reduced");
    assertCondition(
      (await mobilePage.locator("header[role='banner']").count()) === 1,
      "Patient pharmacy shell should expose exactly one banner landmark.",
    );
    assertCondition(
      (await mobilePage.locator("main[role='main']").count()) === 1,
      "Patient pharmacy shell should expose exactly one main landmark.",
    );
    assertCondition(
      (await mobilePage.locator("nav[aria-label='Patient pharmacy routes']").count()) === 1,
      "Patient pharmacy shell should expose one named navigation landmark.",
    );
    assertCondition(
      (await mobilePage.locator("[data-testid='PharmacyContactRouteRepairState'][role='alert']").count()) ===
        1,
      "Contact repair state must use alert semantics.",
    );
    await writeAccessibilitySnapshot(mobilePage, "360-patient-pharmacy-repair-a11y.json");
    await mobileContext.close();

    const desktopContext = await browser.newContext({
      viewport: { width: 1366, height: 960 },
      locale: "en-GB",
      timezoneId: "Europe/London",
    });
    const desktopPage = await desktopContext.newPage();
    await openPatientPharmacyRoute(
      desktopPage,
      patientPharmacyUrl(baseUrl, "PHC-2196", "status"),
    );
    await waitForPatientPharmacyState(desktopPage, {
      currentPath: "/pharmacy/PHC-2196/status",
      routeKey: "status",
      selectedCaseId: "PHC-2196",
    });
    const firstStep = desktopPage.getByTestId("pharmacy-status-step-chosen_pharmacy");
    const currentStep = desktopPage.getByTestId("pharmacy-status-step-outcome");
    assertCondition(
      (await currentStep.getAttribute("aria-expanded")) === "true",
      "The current tracker step should be expanded by default.",
    );
    await firstStep.click();
    assertCondition(
      (await firstStep.getAttribute("aria-expanded")) === "true",
      "Tracker rows must behave as button disclosures.",
    );
    await writeAccessibilitySnapshot(desktopPage, "360-patient-pharmacy-completed-a11y.json");
    await desktopContext.close();
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
