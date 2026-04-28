import {
  assertCondition,
  importPlaywright,
  startHubDesk,
  stopHubDesk,
  openHubRoute,
  outputPath,
  trackExternalRequests,
  waitForHubRootState,
} from "./326_hub_shell.helpers";

export const hubShellNavigationCoverage = [
  "queue to case same-shell transition",
  "alternatives child route history continuity",
  "audit host return without shell replacement",
  "exceptions route remains inside hub shell family",
  "recovery posture survives refresh and browser navigation",
];

export async function run(): Promise<void> {
  const playwright = await importPlaywright();
  if (!playwright) {
    return;
  }

  const { child, baseUrl } = await startHubDesk();
  const browser = await playwright.chromium.launch({ headless: true });

  try {
    const context = await browser.newContext({ viewport: { width: 1480, height: 1180 } });
    await context.tracing.start({ screenshots: true, snapshots: true });
    const page = await context.newPage();
    const externalRequests = new Set<string>();
    trackExternalRequests(page, baseUrl, externalRequests);

    await openHubRoute(page, `${baseUrl}/hub/queue`, "hub-start-of-day");

    await page.getByRole("button", { name: "Resume same-day coordination" }).click();
    await waitForHubRootState(page, {
      currentPath: "/hub/case/hub-case-104",
      viewMode: "case",
      routeFamily: "rf_hub_case_management",
      selectedCaseId: "hub-case-104",
    });

    await page.locator("[data-testid='hub-open-alternatives']").click();
    await waitForHubRootState(page, {
      currentPath: "/hub/alternatives/offer-session-104",
      viewMode: "alternatives",
      routeFamily: "rf_hub_case_management",
      selectedCaseId: "hub-case-104",
    });

    await page.goBack({ waitUntil: "networkidle" });
    await waitForHubRootState(page, {
      currentPath: "/hub/case/hub-case-104",
      viewMode: "case",
      selectedCaseId: "hub-case-104",
    });

    await page.goForward({ waitUntil: "networkidle" });
    await waitForHubRootState(page, {
      currentPath: "/hub/alternatives/offer-session-104",
      viewMode: "alternatives",
    });

    await page.locator("[data-testid='hub-return-button']").click();
    await waitForHubRootState(page, {
      currentPath: "/hub/case/hub-case-104",
      viewMode: "case",
    });

    await page.getByRole("button", { name: "Open audit host" }).click();
    await waitForHubRootState(page, {
      currentPath: "/hub/audit/hub-case-104",
      viewMode: "audit",
      shellStatus: "shell_read_only",
    });

    await page.goBack({ waitUntil: "networkidle" });
    await waitForHubRootState(page, {
      currentPath: "/hub/case/hub-case-104",
      viewMode: "case",
      shellStatus: "shell_live",
    });

    await page.locator("[data-testid='hub-saved-view-supplier_drift']").click();
    await waitForHubRootState(page, {
      currentPath: "/hub/queue",
      viewMode: "queue",
      shellStatus: "shell_recovery_only",
      savedViewId: "supplier_drift",
      selectedCaseId: "hub-case-041",
    });

    await page.getByRole("button", { name: "Exceptions" }).click();
    await waitForHubRootState(page, {
      currentPath: "/hub/exceptions",
      viewMode: "exceptions",
      shellStatus: "shell_recovery_only",
      routeFamily: "rf_hub_queue",
      selectedCaseId: "hub-case-041",
    });

    const root = page.locator("[data-testid='hub-shell-root']");
    assertCondition(
      (await root.getAttribute("data-selected-anchor")) === "hub-case-041",
      "exceptions route lost the queue anchor",
    );

    await page.reload({ waitUntil: "networkidle" });
    await waitForHubRootState(page, {
      currentPath: "/hub/exceptions",
      viewMode: "exceptions",
      shellStatus: "shell_recovery_only",
      savedViewId: "supplier_drift",
      selectedCaseId: "hub-case-041",
    });

    assertCondition(
      externalRequests.size === 0,
      `unexpected external requests: ${Array.from(externalRequests).join(", ")}`,
    );
    await page.screenshot({ path: outputPath("326-hub-shell-navigation.png"), fullPage: true });
    await context.tracing.stop({ path: outputPath("326-hub-shell-navigation-trace.zip") });
  } finally {
    await browser.close();
    await stopHubDesk(child);
  }
}

if (process.argv.includes("--run")) {
  run().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
