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
      workspacePharmacyUrl(pharmacyBaseUrl, "/workspace/pharmacy/PHC-2090/validate"),
    );
    await waitForWorkspacePharmacyState(workspacePage, {
      currentPath: "/workspace/pharmacy/PHC-2090/validate",
      routeKey: "validate",
      selectedCaseId: "PHC-2090",
    });

    const patientContext = await browser.newContext({
      viewport: { width: 1280, height: 960 },
      locale: "en-GB",
      timezoneId: "Europe/London",
    });
    const patientPage = await patientContext.newPage();
    await openPatientPharmacyRoute(
      patientPage,
      patientPharmacyUrl(patientBaseUrl, "PHC-2090", "choose"),
    );
    await waitForPatientPharmacyState(patientPage, {
      currentPath: "/pharmacy/PHC-2090/choose",
      routeKey: "choose",
      selectedCaseId: "PHC-2090",
      recoveryPosture: "live",
    });

    const workspaceRoot = workspacePage.locator("[data-testid='pharmacy-shell-root']");
    const patientRoot = patientPage.locator("[data-testid='pharmacy-patient-shell-root']");
    const workspaceTuple = await workspaceRoot.getAttribute("data-decision-tuple-hash");
    const patientTuple = await patientRoot.getAttribute("data-decision-tuple-hash");

    assertCondition(
      workspaceTuple === patientTuple && Boolean(workspaceTuple),
      "workspace and patient surfaces should share the same decision tuple hash",
    );
    assertCondition(
      (await workspaceRoot.getAttribute("data-eligibility-final-disposition")) ===
        (await patientRoot.getAttribute("data-eligibility-final-disposition")),
      "workspace and patient surfaces should share the same final disposition",
    );

    await patientPage.getByTestId("PatientUnsuitableReturnState").waitFor();
    const patientText = (
      await patientPage.locator("[data-testid='PatientUnsuitableReturnState']").textContent()
    )?.replace(/\s+/g, " ") ?? "";
    for (const forbidden of ["tau_", "global.high_risk_exclusion", "matchedRuleIds", "thresholdSnapshot"]) {
      assertCondition(
        !patientText.includes(forbidden),
        `patient unsuitable-return copy leaked internal jargon: ${forbidden}`,
      );
    }

    await patientPage.getByRole("button", { name: /review the next safe step/i }).click();
    await waitForPatientPharmacyState(patientPage, {
      currentPath: "/pharmacy/PHC-2090/instructions",
      routeKey: "instructions",
      selectedCaseId: "PHC-2090",
      recoveryPosture: "live",
    });
    assertCondition(
      (await patientRoot.getAttribute("data-decision-tuple-hash")) === workspaceTuple,
      "patient route change should preserve the same decision tuple hash",
    );

    await workspaceContext.close();
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
