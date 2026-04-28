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

  const { child, baseUrl } = await startPharmacyConsole();
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
      workspacePharmacyUrl(baseUrl, "/workspace/pharmacy/PHC-2124/assurance"),
    );
    await waitForWorkspacePharmacyState(page, {
      currentPath: "/workspace/pharmacy/PHC-2124/assurance",
      routeKey: "assurance",
      selectedCaseId: "PHC-2124",
      recoveryPosture: "read_only",
    });
    const root = page.locator("[data-testid='pharmacy-shell-root']");
    assertCondition(
      (await root.getAttribute("data-assurance-surface-state")) === "ambiguous_review",
      "Weak-match outcome must expose ambiguous review state.",
    );
    assertCondition(
      (await root.getAttribute("data-assurance-outcome-truth-state")) === "review_required",
      "Weak-match outcome must keep review-required truth.",
    );
    assertCondition(
      (await root.getAttribute("data-assurance-manual-review-state")) === "required",
      "Weak-match outcome must require manual review.",
    );
    assertCondition(
      (await root.getAttribute("data-assurance-gate-state")) === "open",
      "Weak-match outcome must keep the reconciliation gate open.",
    );
    assertCondition(
      await page.getByTestId("PharmacyOutcomeAssurancePanel").isVisible(),
      "Assurance panel must remain browser-visible for weak-match review.",
    );

    await openWorkspacePharmacyRoute(
      page,
      workspacePharmacyUrl(baseUrl, "/workspace/pharmacy/PHC-2168/assurance"),
    );
    await waitForWorkspacePharmacyState(page, {
      currentPath: "/workspace/pharmacy/PHC-2168/assurance",
      routeKey: "assurance",
      selectedCaseId: "PHC-2168",
      recoveryPosture: "read_only",
    });
    assertCondition(
      (await root.getAttribute("data-assurance-surface-state")) === "unmatched_review",
      "Unmatched outcome must expose unmatched review state.",
    );
    assertCondition(
      (await root.getAttribute("data-assurance-outcome-truth-state")) === "unmatched",
      "Unmatched outcome must remain unmatched until review resolves.",
    );
    assertCondition(
      (await root.getAttribute("data-workbench-watch-state")) === "blocked",
      "Unmatched outcome must block the workbench watch window.",
    );
    assertCondition(
      !/do not need to do anything else right now/i.test((await root.textContent()) ?? ""),
      "Unmatched outcome must not use calm completion wording.",
    );

    await context.close();
  } finally {
    await browser.close();
    await stopPharmacyConsole(child);
  }
}

if (process.argv.includes("--run")) {
  run().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
