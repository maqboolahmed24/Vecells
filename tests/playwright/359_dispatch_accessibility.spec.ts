import {
  assertCondition,
  assertNoHorizontalOverflow,
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
      workspacePharmacyUrl(pharmacyBaseUrl, "/workspace/pharmacy/PHC-2057/handoff"),
    );
    await waitForWorkspacePharmacyState(workspacePage, {
      currentPath: "/workspace/pharmacy/PHC-2057/handoff",
      routeKey: "handoff",
      selectedCaseId: "PHC-2057",
    });
    await workspacePage.getByTestId("open-referral-confirmation-drawer").click();
    assertCondition(
      (await workspacePage.locator("header[role='banner']").count()) === 1,
      "Workspace dispatch shell should expose exactly one banner landmark.",
    );
    assertCondition(
      (await workspacePage.locator("main[role='main']").count()) === 1,
      "Workspace dispatch shell should expose exactly one main landmark.",
    );
    assertCondition(
      (await workspacePage.locator("[role='dialog'][data-testid='PharmacyReferralConfirmationDrawer']").count()) ===
        1,
      "Workspace handoff route should expose one modal dialog when the drawer is open.",
    );
    await writeAccessibilitySnapshot(workspacePage, "359-workspace-dispatch-a11y.json");
    await workspaceContext.close();

    const patientContext = await browser.newContext({
      viewport: { width: 390, height: 844 },
      locale: "en-GB",
      timezoneId: "Europe/London",
      reducedMotion: "reduce",
    });
    const patientPage = await patientContext.newPage();
    await openPatientPharmacyRoute(
      patientPage,
      patientPharmacyUrl(patientBaseUrl, "PHC-2148", "instructions"),
    );
    await waitForPatientPharmacyState(patientPage, {
      currentPath: "/pharmacy/PHC-2148/instructions",
      routeKey: "instructions",
      selectedCaseId: "PHC-2148",
    });
    await assertNoHorizontalOverflow(patientPage, "359 patient dispatch mobile reduced");
    assertCondition(
      (await patientPage.locator("header[role='banner']").count()) === 1,
      "Patient dispatch shell should expose exactly one banner landmark.",
    );
    assertCondition(
      (await patientPage.locator("main[role='main']").count()) === 1,
      "Patient dispatch shell should expose exactly one main landmark.",
    );
    assertCondition(
      (await patientPage.locator("[data-testid='PatientConsentCheckpointNotice'][role='alert']").count()) ===
        1,
      "Consent-blocked patient state should announce itself as an alert.",
    );
    assertCondition(
      await patientPage.getByTestId("ChosenPharmacyAnchorCard").isVisible(),
      "Patient accessibility proof must keep the chosen-pharmacy anchor visible.",
    );
    await writeAccessibilitySnapshot(patientPage, "359-patient-dispatch-a11y.json");
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
