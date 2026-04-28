import {
  assertCondition,
  importPlaywright,
  openPatientPharmacyRoute,
  outputPath,
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
      viewport: { width: 1280, height: 960 },
      locale: "en-GB",
      timezoneId: "Europe/London",
    });
    await context.tracing.start({ screenshots: true, snapshots: true });
    const page = await context.newPage();

    await openPatientPharmacyRoute(page, patientPharmacyUrl(baseUrl, "PHC-2148", "choose"));
    await waitForPatientPharmacyState(page, {
      currentPath: "/pharmacy/PHC-2148/choose",
      routeKey: "choose",
      selectedCaseId: "PHC-2148",
      recoveryPosture: "live",
    });

    const root = page.locator("[data-testid='pharmacy-patient-shell-root']");
    assertCondition(
      (await root.getAttribute("data-choice-selected-provider-id")) === "provider_A10002",
      "Warned choice scenario should start with the warned provider selected.",
    );
    assertCondition(
      await page.getByTestId("PharmacyWarningAcknowledgementPanel").isVisible(),
      "Warned choice scenario should render the acknowledgement panel.",
    );

    await page.getByTestId("patient-pharmacy-primary-action").click();
    assertCondition(
      (await page.evaluate(() => document.activeElement?.getAttribute("data-testid"))) ===
        "PharmacyWarningAcknowledgementPanel",
      "Primary action should focus the warning panel until acknowledgement is complete.",
    );

    const acknowledgeButton = page.getByTestId("pharmacy-choice-acknowledge-warning");
    assertCondition(
      await acknowledgeButton.isDisabled(),
      "Acknowledge action should stay disabled until the checkbox is checked.",
    );

    await page.getByTestId("pharmacy-choice-warning-checkbox").check();
    await acknowledgeButton.click();
    assertCondition(
      (await root.getAttribute("data-choice-warning-acknowledged")) === "true",
      "Shell state should record that the warning was acknowledged.",
    );

    await page.getByTestId("pharmacy-choice-change-provider").click();
    assertCondition(
      (await root.getAttribute("data-choice-selected-provider-id")) === null,
      "Change pharmacy should clear the current selection before a new one is chosen.",
    );

    await page.getByTestId("pharmacy-provider-select-provider_A10001").click();
    assertCondition(
      (await root.getAttribute("data-choice-selected-provider-id")) === "provider_A10001",
      "Selecting a different pharmacy should update the shell selection key.",
    );
    assertCondition(
      (await page.getByTestId("PharmacyWarningAcknowledgementPanel").count()) === 0,
      "Switching to an unwarned pharmacy should remove the warning panel.",
    );

    await page.getByTestId("patient-pharmacy-primary-action").click();
    await waitForPatientPharmacyState(page, {
      currentPath: "/pharmacy/PHC-2148/instructions",
      routeKey: "instructions",
      selectedCaseId: "PHC-2148",
    });

    await context.tracing.stop({
      path: outputPath("358-pharmacy-chooser-warning-and-change-trace.zip"),
    });
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
