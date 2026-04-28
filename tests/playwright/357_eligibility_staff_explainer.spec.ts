import {
  assertCondition,
  importPlaywright,
  openWorkspacePharmacyRoute,
  startPharmacyConsole,
  stopPharmacyConsole,
  waitForWorkspacePharmacyState,
  workspacePharmacyUrl,
} from "./356_pharmacy_shell.helpers.ts";

export async function run(): Promise<void> {
  const playwright = await importPlaywright();
  if (!playwright) {
    return;
  }

  const { child: pharmacyChild, baseUrl } = await startPharmacyConsole();
  const browser = await playwright.chromium.launch({ headless: true });

  try {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 1080 },
      locale: "en-GB",
      timezoneId: "Europe/London",
    });
    const page = await context.newPage();

    await openWorkspacePharmacyRoute(
      page,
      workspacePharmacyUrl(baseUrl, "/workspace/pharmacy/PHC-2090"),
    );
    await waitForWorkspacePharmacyState(page, {
      currentPath: "/workspace/pharmacy/PHC-2090",
      routeKey: "case",
      selectedCaseId: "PHC-2090",
      recoveryPosture: "read_only",
    });

    const root = page.locator("[data-testid='pharmacy-shell-root']");
    const explainer = page.getByTestId("PharmacyEligibilityRuleExplainer");
    await explainer.waitFor();

    assertCondition(
      (await root.getAttribute("data-eligibility-final-disposition")) === "ineligible_returned",
      "workspace explainer should expose ineligible_returned for PHC-2090",
    );
    assertCondition(
      (await explainer.getAttribute("data-decision-tuple-hash")) ===
        (await root.getAttribute("data-decision-tuple-hash")),
      "workspace explainer should share the root decision tuple hash",
    );

    const safetyGate = page.getByRole("button", { name: /Global safety gate/i });
    await safetyGate.click();
    assertCondition(
      (await safetyGate.getAttribute("aria-expanded")) === "true",
      "global safety gate should expand on click",
    );
    await page.getByText(/high-risk exclusion blocked pharmacy routing/i).waitFor();

    const evidenceDrawer = page.getByTestId("EligibilityEvidenceDrawer");
    await evidenceDrawer.waitFor();
    const evidenceButton = evidenceDrawer.locator("button").first();
    await evidenceButton.click();
    assertCondition(
      (await evidenceButton.getAttribute("aria-expanded")) === "true",
      "evidence drawer should expand on click",
    );
    await page.getByText(/stable selector for patient and staff parity checks/i).waitFor();

    await page.getByTestId("pharmacy-case-PHC-2124").click();
    await waitForWorkspacePharmacyState(page, {
      currentPath: "/workspace/pharmacy/PHC-2124",
      routeKey: "case",
      selectedCaseId: "PHC-2124",
      recoveryPosture: "read_only",
    });
    await page.getByTestId("EligibilitySupersessionNotice").waitFor();
    assertCondition(
      (await root.getAttribute("data-eligibility-publication-state")) === "superseded",
      "superseded bundle should publish its posture on the root",
    );

    await context.close();
  } finally {
    await browser.close();
    await stopPharmacyConsole(pharmacyChild);
  }
}

if (process.argv.includes("--run")) {
  run().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
