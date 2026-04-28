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
      viewport: { width: 1440, height: 1100 },
      locale: "en-GB",
      timezoneId: "Europe/London",
    });
    await context.tracing.start({ screenshots: true, snapshots: true });
    const page = await context.newPage();

    await openPatientPharmacyRoute(page, patientPharmacyUrl(baseUrl, "PHC-2048", "choose"));
    await waitForPatientPharmacyState(page, {
      currentPath: "/pharmacy/PHC-2048/choose",
      routeKey: "choose",
      selectedCaseId: "PHC-2048",
      recoveryPosture: "live",
    });

    const root = page.locator("[data-testid='pharmacy-patient-shell-root']");
    assertCondition(
      (await root.getAttribute("data-choice-projection-state")) === "choosing",
      "PHC-2048 should start in the choosing projection state.",
    );

    const providerCards = page.locator("[data-testid^='pharmacy-provider-card-']");
    assertCondition((await providerCards.count()) === 3, "Expected 3 visible provider cards.");
    assertCondition(
      ((await page.locator("[data-testid='pharmacy-provider-card-provider_A10001'] h4").textContent()) ?? "").includes(
        "Riverside Pharmacy",
      ),
      "The first recommended provider should be Riverside Pharmacy.",
    );

    await page.getByTestId("pharmacy-choice-map-toggle").click();
    assertCondition(
      await page.getByTestId("PharmacyChoiceMap").isVisible(),
      "Map view should render after toggling it on.",
    );

    const firstMapRow = await page
      .locator(".patient-pharmacy-chooser__map-row")
      .first()
      .textContent();
    assertCondition(
      (firstMapRow ?? "").includes("Riverside Pharmacy"),
      "Map rows must preserve the same provider order as the list.",
    );

    await page.getByTestId("pharmacy-provider-select-provider_A10002").click();
    assertCondition(
      (await root.getAttribute("data-choice-selected-provider-id")) === "provider_A10002",
      "Selecting a list card must update the shell selection key.",
    );
    assertCondition(
      (await page.locator("[data-testid='PharmacyChoiceMap'] .patient-pharmacy-chooser__map-marker[data-provider-id='provider_A10002']").getAttribute("data-selected")) ===
        "true",
      "Map selection must stay synchronized with the list selection.",
    );

    await page.locator(".patient-pharmacy-chooser__map-row[data-provider-id='provider_A10001']").click();
    assertCondition(
      (await root.getAttribute("data-choice-selected-provider-id")) === "provider_A10001",
      "Selecting from the map must update the same shell selection key.",
    );

    await page.getByTestId("pharmacy-choice-filter-open_later").click();
    assertCondition(
      (await providerCards.count()) === 1,
      "Open-later filter should reduce the visible list to the open-later bucket.",
    );
    assertCondition(
      ((await page.locator("[data-testid='pharmacy-provider-card-provider_A10003'] h4").textContent()) ?? "").includes(
        "Hilltop Pharmacy",
      ),
      "Open-later bucket should keep the warned later option visible.",
    );
    assertCondition(
      (await page.locator(".patient-pharmacy-chooser__map-row").count()) === 1,
      "Map rail must reflect the same filtered proof as the list.",
    );

    await context.tracing.stop({
      path: outputPath("358-pharmacy-chooser-list-map-trace.zip"),
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
