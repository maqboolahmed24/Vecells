import {
  assertCondition,
  importPlaywright,
  openPatientPharmacyRoute,
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
    const context = await browser.newContext({
      viewport: { width: 1366, height: 960 },
      locale: "en-GB",
      timezoneId: "Europe/London",
    });
    const page = await context.newPage();

    await openPatientPharmacyRoute(page, patientPharmacyUrl(baseUrl, "PHC-2184", "instructions"));
    await waitForPatientPharmacyState(page, {
      currentPath: "/pharmacy/PHC-2184/instructions",
      routeKey: "instructions",
      selectedCaseId: "PHC-2184",
    });

    const root = page.locator("[data-testid='pharmacy-patient-shell-root']");
    assertCondition(
      (await root.getAttribute("data-patient-status-surface-state")) === "referral_confirmed",
      "PHC-2184 instructions should expose the referral_confirmed surface state.",
    );
    assertCondition(
      (await root.getAttribute("data-patient-status-macro-state")) === "action_in_progress",
      "PHC-2184 instructions should expose action_in_progress macro state.",
    );
    assertCondition(
      await page.getByTestId("ChosenPharmacyConfirmationPage").isVisible(),
      "Referral-confirmed instructions must show the confirmation page.",
    );
    assertCondition(
      await page.getByTestId("PharmacyNextStepPage").isVisible(),
      "Referral-confirmed instructions must show the next-step page.",
    );
    assertCondition(
      await page.getByTestId("PharmacyContactCard").isVisible(),
      "Referral-confirmed instructions must keep the contact card visible.",
    );
    assertCondition(
      await page.getByTestId("PharmacyReferralReferenceCard").isVisible(),
      "Referral-confirmed instructions must keep the reference card visible.",
    );
    assertCondition(
      !/book an appointment/i.test(
        (await page.getByTestId("PatientPharmacyMainRegion").textContent()) ?? "",
      ),
      "Patient pharmacy instructions must not collapse into appointment-booking language.",
    );

    await openPatientPharmacyRoute(page, patientPharmacyUrl(baseUrl, "PHC-2184", "status"));
    await waitForPatientPharmacyState(page, {
      currentPath: "/pharmacy/PHC-2184/status",
      routeKey: "status",
      selectedCaseId: "PHC-2184",
    });
    assertCondition(
      await page.getByTestId("PharmacyStatusTracker").isVisible(),
      "Referral-confirmed status route must render the status tracker.",
    );
    assertCondition(
      (await page.getByTestId("pharmacy-status-step-pharmacy_review").getAttribute("aria-expanded")) ===
        "true",
      "The current tracker step should be expanded by default.",
    );

    await openPatientPharmacyRoute(page, patientPharmacyUrl(baseUrl, "PHC-2196", "status"));
    await waitForPatientPharmacyState(page, {
      currentPath: "/pharmacy/PHC-2196/status",
      routeKey: "status",
      selectedCaseId: "PHC-2196",
    });
    assertCondition(
      (await root.getAttribute("data-patient-status-outcome-state")) === "settled_resolved",
      "Completed status must expose a settled outcome truth state.",
    );
    assertCondition(
      (await root.getAttribute("data-patient-calm-allowed")) === "true",
      "Completed status must allow calm copy.",
    );
    assertCondition(
      await page.getByTestId("PharmacyOutcomePage").isVisible(),
      "Completed status must show the patient outcome page.",
    );
    assertCondition(
      ((await page.getByTestId("PharmacyOutcomePage").textContent()) ?? "").includes(
        "do not need to do anything else right now",
      ),
      "Completed status must keep the calm completed copy visible.",
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
