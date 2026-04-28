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
      workspacePharmacyUrl(baseUrl, "/workspace/pharmacy/PHC-2057/handoff"),
    );
    await waitForWorkspacePharmacyState(page, {
      currentPath: "/workspace/pharmacy/PHC-2057/handoff",
      routeKey: "handoff",
      selectedCaseId: "PHC-2057",
      recoveryPosture: "read_only",
    });

    const root = page.locator("[data-testid='pharmacy-shell-root']");
    assertCondition(
      (await root.getAttribute("data-workbench-watch-state")) === "watch",
      "Proof-pending staff handoff must expose watch state.",
    );
    assertCondition(
      (await root.getAttribute("data-workbench-settlement-state")) === "Settlement pending",
      "Proof-pending staff handoff must keep settlement pending.",
    );
    assertCondition(
      (await root.getAttribute("data-workbench-handoff-state")) === "Release pending",
      "Proof-pending staff handoff must not present release as complete.",
    );
    assertCondition(
      await page.getByTestId("PharmacySupportRegionHost").isVisible(),
      "Staff handoff must keep the support region visible for proof review.",
    );

    await openWorkspacePharmacyRoute(
      page,
      workspacePharmacyUrl(baseUrl, "/workspace/pharmacy/PHC-2072/handoff"),
    );
    await waitForWorkspacePharmacyState(page, {
      currentPath: "/workspace/pharmacy/PHC-2072/handoff",
      routeKey: "handoff",
      selectedCaseId: "PHC-2072",
      recoveryPosture: "read_only",
    });
    assertCondition(
      (await root.getAttribute("data-workbench-watch-state")) === "blocked",
      "Contradictory proof must block the watch window.",
    );
    assertCondition(
      (await root.getAttribute("data-workbench-provider-health")) === "degraded",
      "Contradictory proof row must preserve provider health degradation.",
    );
    assertCondition(
      (await root.getAttribute("data-workbench-handoff-state")) === "Proof contradiction",
      "Contradictory proof must remain explicit on the staff handoff surface.",
    );
    assertCondition(
      !/released|completed/i.test((await root.textContent()) ?? ""),
      "Contradictory proof must not render as released or completed.",
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
