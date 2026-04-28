import {
  assertCondition,
  importPlaywright,
  openPatientPharmacyRoute,
  patientPharmacyUrl,
  startPatientWeb,
  stopPatientWeb,
  waitForPatientPharmacyState,
} from "./365_pharmacy_accessibility.helpers.ts";

function assertNoAppointmentTruth(text: string): void {
  assertCondition(
    !/book an appointment|appointment booking|appointment time/i.test(text),
    "Patient pharmacy copy must not imply appointment booking truth.",
  );
}

export async function run(): Promise<void> {
  const playwright = await importPlaywright();
  if (!playwright) {
    return;
  }

  const { child, baseUrl } = await startPatientWeb();
  const browser = await playwright.chromium.launch({ headless: true });

  try {
    const context = await browser.newContext({
      viewport: { width: 1366, height: 960 },
      locale: "en-GB",
      timezoneId: "Europe/London",
    });
    const page = await context.newPage();
    const root = page.locator("[data-testid='pharmacy-patient-shell-root']");

    await openPatientPharmacyRoute(page, patientPharmacyUrl(baseUrl, "PHC-2148", "choose"));
    await waitForPatientPharmacyState(page, {
      currentPath: "/pharmacy/PHC-2148/choose",
      routeKey: "choose",
      selectedCaseId: "PHC-2148",
      recoveryPosture: "live",
    });
    assertCondition(
      await page.getByTestId("PharmacyChoicePage").isVisible(),
      "Chooser route must render the pharmacy choice page.",
    );
    assertCondition(
      await page.getByTestId("PharmacyChosenProviderReview").isVisible(),
      "Chooser route must render the chosen-provider review summary.",
    );
    assertCondition(
      (await page.getByTestId("patient-pharmacy-route-choose").getAttribute("aria-pressed")) ===
        "true",
      "Chooser route button must expose active pressed state.",
    );

    await openPatientPharmacyRoute(page, patientPharmacyUrl(baseUrl, "PHC-2184", "instructions"));
    await waitForPatientPharmacyState(page, {
      currentPath: "/pharmacy/PHC-2184/instructions",
      routeKey: "instructions",
      selectedCaseId: "PHC-2184",
    });
    assertCondition(
      (await root.getAttribute("data-patient-status-surface-state")) === "referral_confirmed",
      "Referral-confirmed route must expose referral_confirmed surface state.",
    );
    assertCondition(
      await page.getByTestId("ChosenPharmacyConfirmationPage").isVisible(),
      "Referral-confirmed instructions must show the confirmation page.",
    );
    assertCondition(
      await page.getByTestId("PharmacyNextStepPage").isVisible(),
      "Referral-confirmed instructions must show next-step instructions.",
    );
    assertCondition(
      await page.getByTestId("PharmacyContactCard").isVisible(),
      "Referral-confirmed instructions must keep pharmacy contact visible.",
    );
    assertCondition(
      await page.getByTestId("PharmacyReferralReferenceCard").isVisible(),
      "Referral-confirmed instructions must keep referral reference visible.",
    );
    assertNoAppointmentTruth(
      (await page.getByTestId("PatientPharmacyMainRegion").textContent()) ?? "",
    );

    await openPatientPharmacyRoute(page, patientPharmacyUrl(baseUrl, "PHC-2057", "status"));
    await waitForPatientPharmacyState(page, {
      currentPath: "/pharmacy/PHC-2057/status",
      routeKey: "status",
      selectedCaseId: "PHC-2057",
      recoveryPosture: "read_only",
    });
    assertCondition(
      (await root.getAttribute("data-patient-status-surface-state")) === "dispatch_pending",
      "Pending status must expose dispatch_pending.",
    );
    assertCondition(
      (await root.getAttribute("data-patient-status-reference-mode")) === "pending",
      "Pending status must not imply an available referral reference.",
    );
    assertCondition(
      await page.getByTestId("PharmacyStatusTracker").isVisible(),
      "Pending status must render the status tracker.",
    );
    assertCondition(
      await page.getByTestId("PharmacyNextStepPage").isVisible(),
      "Pending status must render instruction-led next steps.",
    );

    await openPatientPharmacyRoute(page, patientPharmacyUrl(baseUrl, "PHC-2196", "status"));
    await waitForPatientPharmacyState(page, {
      currentPath: "/pharmacy/PHC-2196/status",
      routeKey: "status",
      selectedCaseId: "PHC-2196",
    });
    assertCondition(
      (await root.getAttribute("data-patient-status-surface-state")) === "completed",
      "Completed status must expose completed surface state.",
    );
    assertCondition(
      (await root.getAttribute("data-patient-status-outcome-state")) === "settled_resolved",
      "Completed status must expose settled_resolved outcome truth.",
    );
    assertCondition(
      (await root.getAttribute("data-patient-calm-allowed")) === "true",
      "Completed status must be the calm completion branch.",
    );
    assertCondition(
      await page.getByTestId("PharmacyOutcomePage").isVisible(),
      "Completed status must show the patient outcome page.",
    );

    await openPatientPharmacyRoute(page, patientPharmacyUrl(baseUrl, "PHC-2090", "status"));
    await waitForPatientPharmacyState(page, {
      currentPath: "/pharmacy/PHC-2090/status",
      routeKey: "status",
      selectedCaseId: "PHC-2090",
    });
    assertCondition(
      (await root.getAttribute("data-patient-status-surface-state")) === "review_next_steps",
      "Review case must expose review_next_steps.",
    );
    assertCondition(
      (await page.locator("[data-testid='PharmacyReviewNextStepPage'][role='status']").count()) ===
        1,
      "Review next-step branch must use role=status rather than forcing focus.",
    );
    assertCondition(
      (await root.getAttribute("data-patient-calm-allowed")) === "false",
      "Review next-step branch must not allow calm completion copy.",
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
      "Unavailable contact route must expose contact_repair.",
    );
    assertCondition(
      (await root.getAttribute("data-patient-status-repair-state")) === "awaiting_verification",
      "Contact repair must remain awaiting verification.",
    );
    assertCondition(
      (await page
        .locator("[data-testid='PharmacyContactRouteRepairState'][role='alert']")
        .count()) === 1,
      "Contact repair must be announced as an alert.",
    );
    assertCondition(
      await page.getByTestId("ChosenPharmacyAnchorCard").isVisible(),
      "Contact repair must preserve the chosen pharmacy anchor.",
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
      "Urgent return must expose urgent_action.",
    );
    assertCondition(
      (await root.getAttribute("data-patient-calm-allowed")) === "false",
      "Urgent return must block calm patient copy.",
    );
    assertCondition(
      (await page.locator("[data-testid='PharmacyReviewNextStepPage'][role='alert']").count()) ===
        1,
      "Urgent action branch must be announced as an alert.",
    );
    const urgentText = (await page.getByTestId("PatientPharmacyMainRegion").textContent()) ?? "";
    assertCondition(
      /urgent|worse|worsen|safety|review/i.test(urgentText),
      "Urgent branch must keep patient-safe worsening or urgent review wording visible.",
    );
    assertNoAppointmentTruth(urgentText);

    await context.close();
  } finally {
    await browser.close();
    await stopPatientWeb(child);
  }
}

if (process.argv.includes("--run")) {
  run().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
