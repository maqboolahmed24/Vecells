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

export const hubShellStartOfDayCoverage = [
  "one dominant start-of-day resume path",
  "bounded interruption digest instead of widget stacks",
  "saved-view change on the same queue route",
  "queue anchor persistence across refresh",
  "history-state and local-storage continuity markers",
];

export async function run(): Promise<void> {
  const playwright = await importPlaywright();
  if (!playwright) {
    return;
  }

  const { child, baseUrl } = await startHubDesk();
  const browser = await playwright.chromium.launch({ headless: true });

  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1120 } });
    await context.tracing.start({ screenshots: true, snapshots: true });
    const page = await context.newPage();
    const externalRequests = new Set<string>();
    trackExternalRequests(page, baseUrl, externalRequests);

    await openHubRoute(page, `${baseUrl}/hub/queue`, "hub-start-of-day");

    const root = page.locator("[data-testid='hub-shell-root']");
    assertCondition((await root.getAttribute("data-shell")) === "hub", "hub shell marker drifted");
    assertCondition(
      (await root.getAttribute("data-visual-mode")) === "Hub_Desk_Mission_Control",
      "visual mode drifted",
    );
    assertCondition(
      (await root.getAttribute("data-hub-route-family")) === "rf_hub_queue",
      "queue route family drifted",
    );

    const dominantCount = await page.locator("[data-dominant-region='true']").count();
    assertCondition(dominantCount === 1, "start-of-day should expose exactly one dominant region");
    const digestCount = await page.locator("[data-testid='HubInterruptionDigestPanel'] article").count();
    assertCondition(
      digestCount >= 2 && digestCount <= 4,
      `interruption digest should stay bounded, found ${digestCount}`,
    );

    await page.locator("[data-testid='hub-saved-view-ack_watch']").click();
    await waitForHubRootState(page, {
      currentPath: "/hub/queue",
      savedViewId: "ack_watch",
      selectedCaseId: "hub-case-066",
      shellStatus: "shell_live",
      routeFamily: "rf_hub_queue",
    });

    await page.getByRole("button", { name: /Case 087 \/ urgent COPD review/i }).click();
    await waitForHubRootState(page, {
      currentPath: "/hub/queue",
      savedViewId: "ack_watch",
      selectedCaseId: "hub-case-087",
    });

    const binder = page.locator("[data-testid='HubShellContinuityBinder']");
    assertCondition(
      (await binder.getAttribute("data-selected-anchor")) === "hub-case-087",
      "continuity binder lost the selected queue anchor",
    );
    assertCondition(
      (await binder.getAttribute("data-saved-view")) === "ack_watch",
      "continuity binder lost the saved view",
    );

    await page.reload({ waitUntil: "networkidle" });
    await waitForHubRootState(page, {
      currentPath: "/hub/queue",
      savedViewId: "ack_watch",
      selectedCaseId: "hub-case-087",
      shellStatus: "shell_live",
    });

    const deskState = await page.evaluate(() => (window as any).__hubDeskState);
    assertCondition(deskState?.selectedSavedViewId === "ack_watch", "window continuity export drifted");
    assertCondition(deskState?.selectedCaseId === "hub-case-087", "window continuity case drifted");

    assertCondition(
      externalRequests.size === 0,
      `unexpected external requests: ${Array.from(externalRequests).join(", ")}`,
    );
    await page.screenshot({ path: outputPath("326-hub-shell-start-of-day.png"), fullPage: true });
    await context.tracing.stop({ path: outputPath("326-hub-shell-start-of-day-trace.zip") });
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
