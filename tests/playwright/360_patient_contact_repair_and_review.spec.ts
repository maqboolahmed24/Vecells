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

    await openPatientPharmacyRoute(page, patientPharmacyUrl(baseUrl, "PHC-2188", "instructions"));
    await waitForPatientPharmacyState(page, {
      currentPath: "/pharmacy/PHC-2188/instructions",
      routeKey: "instructions",
      selectedCaseId: "PHC-2188",
      recoveryPosture: "read_only",
    });
    assertCondition(
      (await root.getAttribute("data-patient-status-surface-state")) === "contact_repair",
      "PHC-2188 should expose the contact_repair surface state.",
    );
    assertCondition(
      (await root.getAttribute("data-patient-status-repair-state")) === "awaiting_verification",
      "PHC-2188 should expose the awaiting_verification repair state.",
    );
    assertCondition(
      await page.getByTestId("PharmacyContactRouteRepairState").isVisible(),
      "Contact repair instructions must render the repair state.",
    );
    assertCondition(
      (await page.locator("[data-testid='PharmacyContactRouteRepairState'][role='alert']").count()) ===
        1,
      "Contact repair instructions must announce themselves as an alert.",
    );
    assertCondition(
      await page.getByTestId("ChosenPharmacyAnchorCard").isVisible(),
      "Contact repair instructions must preserve the chosen pharmacy anchor.",
    );

    await openPatientPharmacyRoute(page, patientPharmacyUrl(baseUrl, "PHC-2090", "status"));
    await waitForPatientPharmacyState(page, {
      currentPath: "/pharmacy/PHC-2090/status",
      routeKey: "status",
      selectedCaseId: "PHC-2090",
    });
    assertCondition(
      (await root.getAttribute("data-patient-status-surface-state")) === "review_next_steps",
      "PHC-2090 should expose the review_next_steps surface state.",
    );
    assertCondition(
      (await page.locator("[data-testid='PharmacyReviewNextStepPage'][role='status']").count()) ===
        1,
      "Review-next-step state should use polite status semantics.",
    );
    assertCondition(
      await page.getByTestId("PharmacyReferralReferenceCard").isVisible(),
      "Review-next-step state should still keep the referral reference card visible.",
    );

    await openPatientPharmacyRoute(page, patientPharmacyUrl(baseUrl, "PHC-2103", "status"));
    await waitForPatientPharmacyState(page, {
      currentPath: "/pharmacy/PHC-2103/status",
      routeKey: "status",
      selectedCaseId: "PHC-2103",
      recoveryPosture: "recovery_only",
    });
    assertCondition(
      (await root.getAttribute("data-patient-status-surface-state")) === "urgent_action",
      "PHC-2103 should expose the urgent_action surface state.",
    );
    assertCondition(
      (await page.locator("[data-testid='PharmacyReviewNextStepPage'][role='alert']").count()) ===
        1,
      "Urgent status must use alert semantics.",
    );
    assertCondition(
      (await root.getAttribute("data-patient-calm-allowed")) === "false",
      "Urgent status must keep calmness blocked.",
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
