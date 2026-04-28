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
  waitForPatientPharmacyState,
  waitForWorkspacePharmacyState,
  workspacePharmacyUrl,
  writeAriaSnapshot,
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
    });
    await writeAriaSnapshot(
      patientPage,
      patientPage.locator("[data-testid='pharmacy-patient-shell-root']"),
      "365-patient-pharmacy-shell.aria.txt",
    );

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
    await pharmacyPage.getByTestId("open-referral-confirmation-drawer").click();
    await pharmacyPage.getByTestId("PharmacyReferralConfirmationDrawer").waitFor();
    await writeAriaSnapshot(
      pharmacyPage,
      pharmacyPage.locator("[data-testid='pharmacy-shell-root']"),
      "365-pharmacy-shell.aria.txt",
    );
    await writeAriaSnapshot(
      pharmacyPage,
      pharmacyPage.locator("[data-testid='PharmacyReferralConfirmationDrawer']"),
      "365-pharmacy-dispatch-drawer.aria.txt",
    );

    const patientShellText = await patientPage
      .locator("[data-testid='pharmacy-patient-shell-root']")
      .textContent();
    const pharmacyShellText = await pharmacyPage
      .locator("[data-testid='pharmacy-shell-root']")
      .textContent();
    assertCondition(
      Boolean(patientShellText?.includes("One shell for choice, instructions, and status")),
      "Patient shell aria snapshot capture must run on the expected route family.",
    );
    assertCondition(
      Boolean(pharmacyShellText?.includes("Quiet pharmacy shell with one dominant action")),
      "Pharmacy shell aria snapshot capture must run on the expected route family.",
    );

    await patientContext.close();
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
