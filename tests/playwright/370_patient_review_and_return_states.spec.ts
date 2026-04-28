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
    const root = page.locator("[data-testid='pharmacy-patient-shell-root']");

    await openPatientPharmacyRoute(page, patientPharmacyUrl(baseUrl, "PHC-2103", "status"));
    await waitForPatientPharmacyState(page, {
      currentPath: "/pharmacy/PHC-2103/status",
      routeKey: "status",
      selectedCaseId: "PHC-2103",
      recoveryPosture: "recovery_only",
    });
    assertCondition(
      (await root.getAttribute("data-patient-status-surface-state")) === "urgent_action",
      "Urgent return must expose the urgent_action patient surface.",
    );
    assertCondition(
      (await root.getAttribute("data-patient-status-macro-state")) === "urgent_action",
      "Urgent return must keep the urgent_action macro state.",
    );
    assertCondition(
      (await root.getAttribute("data-patient-calm-allowed")) === "false",
      "Urgent return must block calm patient copy.",
    );
    assertCondition(
      (await page.locator("[data-testid='PharmacyReviewNextStepPage'][role='alert']").count()) ===
        1,
      "Urgent patient state must be announced as an alert.",
    );
    assertCondition(
      !/do not need to do anything else right now/i.test(
        (await page.getByTestId("PatientPharmacyMainRegion").textContent()) ?? "",
      ),
      "Urgent return must not render completed calm copy.",
    );

    await openPatientPharmacyRoute(page, patientPharmacyUrl(baseUrl, "PHC-2188", "instructions"));
    await waitForPatientPharmacyState(page, {
      currentPath: "/pharmacy/PHC-2188/instructions",
      routeKey: "instructions",
      selectedCaseId: "PHC-2188",
      recoveryPosture: "read_only",
    });
    assertCondition(
      (await root.getAttribute("data-patient-status-surface-state")) === "contact_repair",
      "Unavailable direct contact route must expose contact_repair.",
    );
    assertCondition(
      (await root.getAttribute("data-patient-status-repair-state")) === "awaiting_verification",
      "Contact repair must remain awaiting verification.",
    );
    assertCondition(
      await page.getByTestId("ChosenPharmacyAnchorCard").isVisible(),
      "Contact repair must preserve the chosen pharmacy anchor.",
    );

    await openPatientPharmacyRoute(page, patientPharmacyUrl(baseUrl, "PHC-2090", "status"));
    await waitForPatientPharmacyState(page, {
      currentPath: "/pharmacy/PHC-2090/status",
      routeKey: "status",
      selectedCaseId: "PHC-2090",
    });
    assertCondition(
      (await root.getAttribute("data-patient-status-surface-state")) === "review_next_steps",
      "Review case must expose review_next_steps rather than completion.",
    );
    assertCondition(
      await page.getByTestId("PharmacyReferralReferenceCard").isVisible(),
      "Review state must keep the referral reference visible.",
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
