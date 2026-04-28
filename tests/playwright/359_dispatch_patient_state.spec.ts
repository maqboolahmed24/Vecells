import {
  assertCondition,
  importPlaywright,
  openPatientPharmacyRoute,
  patientPharmacyUrl,
  startPatientWeb,
  stopPatientWeb,
  waitForPatientPharmacyState,
} from "./356_pharmacy_shell.helpers.ts";

function containsTransportJargon(value: string): boolean {
  return /(MESH|bars_fhir|supplier_interop|manual_assisted_dispatch)/i.test(value);
}

export async function run(): Promise<void> {
  const playwright = await importPlaywright();
  if (!playwright) {
    return;
  }

  const { child: patientChild, baseUrl } = await startPatientWeb();
  const browser = await playwright.chromium.launch({ headless: true });

  try {
    const context = await browser.newContext({
      viewport: { width: 1366, height: 960 },
      locale: "en-GB",
      timezoneId: "Europe/London",
    });
    const page = await context.newPage();

    await openPatientPharmacyRoute(page, patientPharmacyUrl(baseUrl, "PHC-2057", "status"));
    await waitForPatientPharmacyState(page, {
      currentPath: "/pharmacy/PHC-2057/status",
      routeKey: "status",
      selectedCaseId: "PHC-2057",
    });

    const pendingRoot = page.locator("[data-testid='pharmacy-patient-shell-root']");
    assertCondition(
      (await pendingRoot.getAttribute("data-dispatch-surface-state")) === "dispatch_pending",
      "PHC-2057 should expose pending dispatch posture.",
    );
    assertCondition(
      (await pendingRoot.getAttribute("data-patient-calm-allowed")) === "false",
      "PHC-2057 must not allow calm referral posture.",
    );
    assertCondition(
      await page.getByTestId("ChosenPharmacyAnchorCard").isVisible(),
      "Pending dispatch state must preserve the chosen-pharmacy anchor.",
    );
    assertCondition(
      await page.getByTestId("PatientDispatchPendingState").isVisible(),
      "Pending dispatch state must render the patient-safe pending block.",
    );
    assertCondition(
      !containsTransportJargon(
        (await page.getByTestId("PatientPharmacyDispatchSurface").textContent()) ?? "",
      ),
      "Patient dispatch copy must not leak transport jargon.",
    );

    await openPatientPharmacyRoute(page, patientPharmacyUrl(baseUrl, "PHC-2148", "instructions"));
    await waitForPatientPharmacyState(page, {
      currentPath: "/pharmacy/PHC-2148/instructions",
      routeKey: "instructions",
      selectedCaseId: "PHC-2148",
    });
    assertCondition(
      (await pendingRoot.getAttribute("data-consent-checkpoint-state")) === "missing",
      "PHC-2148 should expose the missing consent-checkpoint posture.",
    );
    assertCondition(
      await page.getByTestId("PatientConsentCheckpointNotice").isVisible(),
      "Consent-blocked posture must render the patient checkpoint notice.",
    );
    assertCondition(
      await page.getByTestId("ChosenPharmacyAnchorCard").isVisible(),
      "Consent-blocked posture must keep the chosen-pharmacy anchor visible.",
    );

    await openPatientPharmacyRoute(page, patientPharmacyUrl(baseUrl, "PHC-2156", "status"));
    await waitForPatientPharmacyState(page, {
      currentPath: "/pharmacy/PHC-2156/status",
      routeKey: "status",
      selectedCaseId: "PHC-2156",
      recoveryPosture: "read_only",
    });
    assertCondition(
      (await pendingRoot.getAttribute("data-dispatch-surface-state")) === "continuity_drift",
      "PHC-2156 should expose continuity drift on the shell root.",
    );
    assertCondition(
      await page.getByTestId("DispatchContinuityWarningStrip").isVisible(),
      "Drift posture must render the continuity warning strip.",
    );
    assertCondition(
      ((await page.getByTestId("ChosenPharmacyAnchorCard").textContent()) ?? "").includes(
        "Previous selection preserved as provenance",
      ),
      "Drift posture must preserve the prior pharmacy as read-only provenance.",
    );

    await openPatientPharmacyRoute(page, patientPharmacyUrl(baseUrl, "PHC-2048", "status"));
    await waitForPatientPharmacyState(page, {
      currentPath: "/pharmacy/PHC-2048/status",
      routeKey: "status",
      selectedCaseId: "PHC-2048",
    });
    assertCondition(
      (await pendingRoot.getAttribute("data-patient-calm-allowed")) === "true",
      "PHC-2048 should allow calmness only after the confirmed tuple is current.",
    );
    assertCondition(
      ((await page.getByTestId("DispatchProofStatusStrip").textContent()) ?? "").includes(
        "Referral proof is current for the active handoff",
      ),
      "Confirmed dispatch state should render the calm confirmation strip.",
    );

    await context.close();
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
