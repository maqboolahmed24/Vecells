import {
  assertCondition,
  assertNoHorizontalOverflow,
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
} from "./365_pharmacy_accessibility.helpers.ts";

async function transitionDuration(page: any, selector: string): Promise<string> {
  return await page.locator(selector).evaluate((node: HTMLElement) => {
    return getComputedStyle(node).transitionDuration;
  });
}

function reducedDurationSatisfied(value: string): boolean {
  const firstDuration = value.split(",")[0]?.trim() ?? value.trim();
  if (firstDuration === "0s" || firstDuration === "0.01ms" || firstDuration === "1e-05s") {
    return true;
  }
  const numeric = Number.parseFloat(firstDuration.replace(/ms|s/g, ""));
  if (Number.isNaN(numeric)) {
    return false;
  }
  return firstDuration.endsWith("ms") ? numeric <= 0.01 : numeric <= 0.00002;
}

export async function run(): Promise<void> {
  const playwright = await importPlaywright();
  if (!playwright) {
    return;
  }

  const { child: patientChild, baseUrl: patientBaseUrl } = await startPatientWeb();
  const { child: pharmacyChild, baseUrl: pharmacyBaseUrl } = await startPharmacyConsole();
  const browser = await playwright.chromium.launch({ headless: true });

  try {
    const patientContext = await browser.newContext({
      viewport: { width: 390, height: 844 },
      locale: "en-GB",
      timezoneId: "Europe/London",
      reducedMotion: "reduce",
    });
    const patientPage = await patientContext.newPage();
    await openPatientPharmacyRoute(
      patientPage,
      patientPharmacyUrl(patientBaseUrl, "PHC-2148", "choose"),
    );
    await waitForPatientPharmacyState(patientPage, {
      currentPath: "/pharmacy/PHC-2148/choose",
      routeKey: "choose",
      selectedCaseId: "PHC-2148",
    });
    await assertNoHorizontalOverflow(patientPage, "365 patient mobile reduced");
    assertCondition(
      (await patientPage.getByTestId("patient-pharmacy-reduced-motion-bridge").getAttribute("data-reduced-motion")) ===
        "true",
      "Patient reduced-motion bridge must activate under prefers-reduced-motion.",
    );
    const patientDuration = await transitionDuration(
      patientPage,
      "[data-testid='patient-pharmacy-route-choose']",
    );
    assertCondition(
      reducedDurationSatisfied(patientDuration),
      `Patient reduced-motion transition drifted: ${patientDuration}`,
    );
    await patientPage.setViewportSize({ width: 320, height: 900 });
    await assertNoHorizontalOverflow(patientPage, "365 patient 320px reflow");
    await patientContext.close();

    const pharmacyContext = await browser.newContext({
      viewport: { width: 390, height: 844 },
      locale: "en-GB",
      timezoneId: "Europe/London",
      reducedMotion: "reduce",
    });
    const pharmacyPage = await pharmacyContext.newPage();
    await openWorkspacePharmacyRoute(
      pharmacyPage,
      workspacePharmacyUrl(pharmacyBaseUrl, "/workspace/pharmacy/PHC-2215/assurance"),
    );
    await waitForWorkspacePharmacyState(pharmacyPage, {
      currentPath: "/workspace/pharmacy/PHC-2215/assurance",
      routeKey: "assurance",
      selectedCaseId: "PHC-2215",
      recoveryPosture: "recovery_only",
    });
    await assertNoHorizontalOverflow(pharmacyPage, "365 pharmacy mobile reduced");
    assertCondition(
      (await pharmacyPage.getByTestId("pharmacy-shell-reduced-motion-bridge").getAttribute("data-reduced-motion")) ===
        "true",
      "Pharmacy reduced-motion bridge must activate under prefers-reduced-motion.",
    );
    const pharmacyDuration = await transitionDuration(
      pharmacyPage,
      "[data-testid='pharmacy-route-button-assurance']",
    );
    assertCondition(
      reducedDurationSatisfied(pharmacyDuration),
      `Pharmacy reduced-motion transition drifted: ${pharmacyDuration}`,
    );
    await pharmacyPage.setViewportSize({ width: 320, height: 900 });
    await assertNoHorizontalOverflow(pharmacyPage, "365 pharmacy 320px reflow");
    await pharmacyContext.close();
  } finally {
    await browser.close();
    await stopPatientWeb(patientChild);
    await stopPharmacyConsole(pharmacyChild);
  }
}

if (process.argv.includes("--run")) {
  run().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
