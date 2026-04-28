import {
  assertCondition,
  importPlaywright,
  openPatientPharmacyRoute,
  patientPharmacyUrl,
  startPatientWeb,
  stopPatientWeb,
  waitForPatientPharmacyState,
} from "./356_pharmacy_shell.helpers.ts";

async function waitForRootAttribute(page: any, name: string, expected: string): Promise<void> {
  await page.waitForFunction(
    ({ name: attributeName, expected: expectedValue }) =>
      document
        .querySelector("[data-testid='pharmacy-patient-shell-root']")
        ?.getAttribute(attributeName) === expectedValue,
    { name, expected },
  );
}

export async function run(): Promise<void> {
  const playwright = await importPlaywright();
  if (!playwright) {
    return;
  }

  const { child: patientChild, baseUrl } = await startPatientWeb();
  const browser = await playwright.chromium.launch({ headless: true });

  try {
    const desktopContext = await browser.newContext({
      viewport: { width: 1366, height: 960 },
      locale: "en-GB",
      timezoneId: "Europe/London",
    });
    const desktopPage = await desktopContext.newPage();
    await openPatientPharmacyRoute(desktopPage, patientPharmacyUrl(baseUrl, "PHC-2048", "choose"));
    await waitForPatientPharmacyState(desktopPage, {
      currentPath: "/pharmacy/PHC-2048/choose",
      routeKey: "choose",
      selectedCaseId: "PHC-2048",
    });

    const root = desktopPage.locator("[data-testid='pharmacy-patient-shell-root']");
    assertCondition(
      (await root.getAttribute("data-eligibility-final-disposition")) === "eligible_choice_pending",
      "PHC-2048 must expose an eligible-choice disposition.",
    );
    assertCondition(
      (await root.getAttribute("data-choice-projection-state")) === "choosing",
      "PHC-2048 should begin in choosing state.",
    );
    assertCondition(
      await desktopPage.getByTestId("PharmacyChoicePage").isVisible(),
      "Choice page must render for the eligible case.",
    );
    assertCondition(
      (await desktopPage
        .getByTestId("pharmacy-provider-card-provider_A10001")
        .getAttribute("data-group-key")) === "recommended",
      "Recommended provider must stay visible in the recommended group.",
    );
    assertCondition(
      (await desktopPage
        .getByTestId("pharmacy-provider-card-provider_A10002")
        .getAttribute("data-warning-state")) === "warned_choice_ack_required",
      "Warned provider must expose the acknowledgement requirement.",
    );
    assertCondition(
      await desktopPage.getByTestId("pharmacy-provider-card-provider_A10003").isVisible(),
      "The full valid browser-visible set must include the third valid provider.",
    );

    await desktopPage.getByTestId("pharmacy-provider-select-provider_A10002").click();
    await waitForRootAttribute(desktopPage, "data-choice-selected-provider-id", "provider_A10002");
    assertCondition(
      await desktopPage.getByTestId("PharmacyWarningAcknowledgementPanel").isVisible(),
      "Selecting the warned provider must reveal the warning acknowledgement panel.",
    );
    await desktopPage.getByTestId("pharmacy-choice-warning-checkbox").click();
    await desktopPage.getByTestId("pharmacy-choice-acknowledge-warning").click();
    await waitForRootAttribute(desktopPage, "data-choice-warning-acknowledged", "true");

    await openPatientPharmacyRoute(desktopPage, patientPharmacyUrl(baseUrl, "PHC-2057", "status"));
    await waitForPatientPharmacyState(desktopPage, {
      currentPath: "/pharmacy/PHC-2057/status",
      routeKey: "status",
      selectedCaseId: "PHC-2057",
    });
    assertCondition(
      (await root.getAttribute("data-dispatch-authoritative-proof-state")) === "pending",
      "Pending dispatch must not expose satisfied proof.",
    );
    assertCondition(
      (await root.getAttribute("data-patient-calm-allowed")) === "false",
      "Pending dispatch must block calm completion copy.",
    );

    const mobileContext = await browser.newContext({
      viewport: { width: 390, height: 844 },
      locale: "en-GB",
      timezoneId: "Europe/London",
    });
    const mobilePage = await mobileContext.newPage();
    await openPatientPharmacyRoute(mobilePage, patientPharmacyUrl(baseUrl, "PHC-2156", "choose"));
    await waitForPatientPharmacyState(mobilePage, {
      currentPath: "/pharmacy/PHC-2156/choose",
      routeKey: "choose",
      selectedCaseId: "PHC-2156",
      layoutMode: "mission_stack",
      breakpointClass: "compact",
    });
    const mobileRoot = mobilePage.locator("[data-testid='pharmacy-patient-shell-root']");
    assertCondition(
      (await mobileRoot.getAttribute("data-choice-drift-state")) === "visible_choice_set_changed",
      "Mobile chooser must expose stale visible-choice proof recovery.",
    );
    assertCondition(
      await mobilePage.getByTestId("PharmacyChoiceDriftRecoveryStrip").isVisible(),
      "Mobile stale proof must render recovery in the same shell.",
    );

    await Promise.all([desktopContext.close(), mobileContext.close()]);
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
