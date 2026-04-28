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
      viewport: { width: 1366, height: 960 },
      locale: "en-GB",
      timezoneId: "Europe/London",
    });
    const page = await context.newPage();

    await openWorkspacePharmacyRoute(
      page,
      workspacePharmacyUrl(baseUrl, "/workspace/pharmacy/PHC-2146/assurance"),
    );
    await waitForWorkspacePharmacyState(page, {
      currentPath: "/workspace/pharmacy/PHC-2146/assurance",
      routeKey: "assurance",
      selectedCaseId: "PHC-2146",
    });

    const root = page.locator("[data-testid='pharmacy-shell-root']");
    assertCondition(
      (await root.getAttribute("data-assurance-surface-state")) === "matched_review",
      "PHC-2146 should expose the matched_review assurance state.",
    );
    assertCondition(
      (await root.getAttribute("data-assurance-manual-review-state")) === "in_review",
      "PHC-2146 should expose in-review manual-review posture.",
    );
    assertCondition(
      ((await page.getByTestId("OutcomeManualReviewBanner").textContent()) ?? "").includes(
        "Manual review is in progress",
      ),
      "Matched review posture must keep the manual-review banner visible.",
    );

    await openWorkspacePharmacyRoute(
      page,
      workspacePharmacyUrl(baseUrl, "/workspace/pharmacy/PHC-2168/assurance"),
    );
    await waitForWorkspacePharmacyState(page, {
      currentPath: "/workspace/pharmacy/PHC-2168/assurance",
      routeKey: "assurance",
      selectedCaseId: "PHC-2168",
    });

    assertCondition(
      (await root.getAttribute("data-assurance-surface-state")) === "unmatched_review",
      "PHC-2168 should expose the unmatched assurance state.",
    );
    assertCondition(
      (await root.getAttribute("data-assurance-close-eligibility-state")) === "not_closable",
      "PHC-2168 must remain explicitly not closable.",
    );
    assertCondition(
      (await page.getByTestId("OutcomeEvidenceDrawer").getAttribute("data-open")) === "true",
      "Unmatched assurance should open the evidence drawer by default.",
    );
    assertCondition(
      ((await page.getByTestId("OutcomeMatchSummary").textContent()) ?? "").includes(
        "No candidate case currently satisfies the hard floor",
      ),
      "Unmatched assurance must keep the lack of a trustworthy match explicit.",
    );
    assertCondition(
      (await page.getByTestId("OutcomeDecisionDock").getAttribute("data-tone")) === "blocked",
      "Unmatched assurance must keep the decision dock in blocked posture.",
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
