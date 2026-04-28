import {
  assertCondition,
  importPlaywright,
  openPatientPharmacyRoute,
  openWorkspacePharmacyRoute,
  patientPharmacyUrl,
  startPatientWeb,
  startPharmacyConsole,
  stopPatientWeb,
  stopPharmacyConsole,
  tabUntil,
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
    const patientContext = await browser.newContext({
      viewport: { width: 1366, height: 960 },
      locale: "en-GB",
      timezoneId: "Europe/London",
    });
    const patientPage = await patientContext.newPage();

    await openPatientPharmacyRoute(
      patientPage,
      patientPharmacyUrl(patientBaseUrl, "PHC-2148", "choose"),
    );
    await waitForPatientPharmacyState(patientPage, {
      currentPath: "/pharmacy/PHC-2148/choose",
      routeKey: "choose",
      selectedCaseId: "PHC-2148",
      recoveryPosture: "live",
    });

    assertCondition(
      (await patientPage.getByTestId("PatientPharmacyAnnouncementHub").count()) === 1,
      "Patient shell must expose the shared announcement hub.",
    );
    assertCondition(
      await patientPage.getByTestId("PatientPharmacyFocusRouteMap").isVisible(),
      "Patient shell must expose the focus route map.",
    );
    assertCondition(
      (await patientPage.getByTestId("patient-pharmacy-route-choose").getAttribute("aria-pressed")) ===
        "true",
      "Active patient route button must expose pressed state.",
    );

    await tabUntil(patientPage, (testId) => testId === "patient-pharmacy-route-choose");
    await tabUntil(patientPage, (testId) => testId === "pharmacy-choice-map-toggle");
    await patientPage.keyboard.press("Space");
    assertCondition(
      (await patientPage.getByTestId("PharmacyChoicePage").getAttribute("data-map-visible")) ===
        "true",
      "Patient keyboard flow must toggle the chooser map.",
    );
    await tabUntil(
      patientPage,
      (testId) => testId === "pharmacy-provider-select-provider_A10002",
    );
    await patientPage.keyboard.press("Enter");
    await tabUntil(patientPage, (testId) => testId === "pharmacy-choice-warning-checkbox");
    await patientPage.keyboard.press("Space");
    await patientPage.getByTestId("pharmacy-choice-acknowledge-warning").focus();
    await patientPage.keyboard.press("Enter");
    assertCondition(
      (await patientPage.getByTestId("pharmacy-patient-shell-root").getAttribute("data-choice-warning-acknowledged")) ===
        "true",
      "Patient keyboard flow must record warned-choice acknowledgement.",
    );
    await patientContext.close();

    const pharmacyContext = await browser.newContext({
      viewport: { width: 1366, height: 960 },
      locale: "en-GB",
      timezoneId: "Europe/London",
    });
    const pharmacyPage = await pharmacyContext.newPage();

    await openWorkspacePharmacyRoute(
      pharmacyPage,
      workspacePharmacyUrl(pharmacyBaseUrl, "/workspace/pharmacy/PHC-2057/handoff"),
    );
    await waitForWorkspacePharmacyState(pharmacyPage, {
      currentPath: "/workspace/pharmacy/PHC-2057/handoff",
      routeKey: "handoff",
      selectedCaseId: "PHC-2057",
    });

    assertCondition(
      (await pharmacyPage.getByTestId("PharmacyShellAnnouncementHub").count()) === 1,
      "Pharmacy shell must expose the shared announcement hub.",
    );
    assertCondition(
      await pharmacyPage.getByTestId("PharmacyShellFocusRouteMap").isVisible(),
      "Pharmacy shell must expose the focus route map.",
    );
    assertCondition(
      (await pharmacyPage.getByTestId("pharmacy-route-button-handoff").getAttribute("aria-pressed")) ===
        "true",
      "Active pharmacy route button must expose pressed state.",
    );

    await tabUntil(pharmacyPage, (testId) => testId === "pharmacy-route-button-case");
    await tabUntil(pharmacyPage, (testId) => testId === "open-referral-confirmation-drawer", 40);
    assertCondition(
      (await pharmacyPage.getByTestId("open-referral-confirmation-drawer").getAttribute("aria-haspopup")) ===
        "dialog",
      "Dispatch drawer trigger must advertise dialog semantics.",
    );
    await pharmacyContext.close();
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
