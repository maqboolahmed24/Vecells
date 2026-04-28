import {
  assertCondition,
  assertNoHorizontalOverflow,
  importPlaywright,
  openPatientPharmacyRoute,
  patientPharmacyUrl,
  startPatientWeb,
  stopPatientWeb,
  waitForPatientPharmacyState,
  writeAccessibilitySnapshot,
} from "./356_pharmacy_shell.helpers.ts";

async function tabUntil(
  page: any,
  matcher: (activeTestId: string | null) => boolean,
  maxTabs = 24,
): Promise<void> {
  for (let index = 0; index < maxTabs; index += 1) {
    await page.keyboard.press("Tab");
    const activeTestId = await page.evaluate(
      () => document.activeElement?.getAttribute("data-testid") ?? null,
    );
    if (matcher(activeTestId)) {
      return;
    }
  }
  throw new Error("Failed to reach the expected control by keyboard tabbing.");
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
      viewport: { width: 390, height: 844 },
      locale: "en-GB",
      timezoneId: "Europe/London",
      reducedMotion: "reduce",
    });
    const page = await context.newPage();

    await openPatientPharmacyRoute(page, patientPharmacyUrl(baseUrl, "PHC-2148", "choose"));
    await waitForPatientPharmacyState(page, {
      currentPath: "/pharmacy/PHC-2148/choose",
      routeKey: "choose",
      selectedCaseId: "PHC-2148",
      recoveryPosture: "live",
    });

    await assertNoHorizontalOverflow(page, "358 pharmacy chooser mobile reduced");

    await tabUntil(page, (testId) => testId === "pharmacy-choice-map-toggle");
    await page.keyboard.press("Space");
    assertCondition(
      (await page.locator("[data-testid='PharmacyChoicePage']").getAttribute("data-map-visible")) ===
        "true",
      "Keyboard toggle should enable the map view.",
    );

    await tabUntil(page, (testId) => testId === "pharmacy-provider-select-provider_A10001");
    await page.keyboard.press("Enter");
    assertCondition(
      (await page.locator("[data-testid='pharmacy-patient-shell-root']").getAttribute("data-choice-selected-provider-id")) ===
        "provider_A10001",
      "Keyboard activation should update the selected provider.",
    );

    await tabUntil(page, (testId) => testId === "pharmacy-choice-change-provider");
    await page.keyboard.press("Enter");
    await tabUntil(page, (testId) => testId === "pharmacy-provider-select-provider_A10002");
    await page.keyboard.press("Enter");
    await tabUntil(page, (testId) => testId === "pharmacy-choice-warning-checkbox");
    await page.keyboard.press("Space");
    await tabUntil(page, (testId) => testId === "pharmacy-choice-acknowledge-warning");
    await page.keyboard.press("Enter");

    assertCondition(
      (await page.locator("[data-testid='pharmacy-patient-shell-root']").getAttribute("data-choice-warning-acknowledged")) ===
        "true",
      "Keyboard acknowledgement should update the warning state.",
    );

    await writeAccessibilitySnapshot(page, "358-pharmacy-chooser-accessibility.json");
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
