import {
  assertCondition,
  importPlaywright,
  openHubRoute,
  outputPath,
  readQueueOrder,
  startHubDesk,
  stopHubDesk,
  trackExternalRequests,
  waitForHubRootState,
} from "./327_hub_queue.helpers";

export const hubQueueWorkbenchCoverage = [
  "authoritative queue order renders without local sort affordances",
  "selected row and selected option stay pinned while queue change batches buffer",
  "applied queue delta reorders rows only through the declared batch mechanism",
];

export async function run(): Promise<void> {
  const playwright = await importPlaywright();
  if (!playwright) {
    return;
  }

  const { child, baseUrl } = await startHubDesk();
  const browser = await playwright.chromium.launch({ headless: true });

  try {
    const context = await browser.newContext({ viewport: { width: 1560, height: 1180 } });
    await context.tracing.start({ screenshots: true, snapshots: true });
    const page = await context.newPage();
    const externalRequests = new Set<string>();
    trackExternalRequests(page, baseUrl, externalRequests);

    await openHubRoute(page, `${baseUrl}/hub/queue`, "hub-start-of-day");
    await waitForHubRootState(page, {
      currentPath: "/hub/queue",
      viewMode: "queue",
      selectedCaseId: "hub-case-104",
      savedViewId: "resume_today",
    });

    const initialOrder = await readQueueOrder(page);
    assertCondition(
      initialOrder.join("|") === "hub-case-104|hub-case-087|hub-case-066",
      `unexpected initial authoritative order: ${initialOrder.join("|")}`,
    );
    const sortButtons = await page.getByRole("button", { name: /sort/i }).count();
    assertCondition(sortButtons === 0, "queue workbench should not expose local sort affordances");

    await page.locator("[data-option-card='opt-104-north-shore'] .hub-option-card__select").click();
    await page.waitForFunction(
      () =>
        document
          .querySelector("[data-testid='HubDecisionDockHost']")
          ?.getAttribute("data-selected-option") === "opt-104-north-shore",
    );
    const selectedOptionBefore = await page
      .locator("[data-testid='HubDecisionDockHost']")
      .getAttribute("data-selected-option");
    assertCondition(
      selectedOptionBefore === "opt-104-north-shore",
      `selected option drifted before delta buffering: ${selectedOptionBefore}`,
    );

    await page.locator("[data-testid='hub-buffer-queue-delta']").click();
    const bufferedOrder = await readQueueOrder(page);
    assertCondition(
      bufferedOrder.join("|") === initialOrder.join("|"),
      "queue order changed before the buffered batch was applied",
    );
    const batchNotice = page.locator("[data-queue-change-state='buffered']");
    await batchNotice.waitFor();
    const root = page.locator("[data-testid='hub-shell-root']");
    assertCondition(
      (await root.getAttribute("data-selected-case-id")) === "hub-case-104",
      "buffered queue delta stole the selected case",
    );
    const selectedOptionBuffered = await page
      .locator("[data-testid='HubDecisionDockHost']")
      .getAttribute("data-selected-option");
    assertCondition(
      selectedOptionBuffered === "opt-104-north-shore",
      "buffered queue delta stole the selected option",
    );

    await page.locator("[data-testid='hub-apply-queue-delta']").click();
    await page.waitForFunction(
      () =>
        (window as { __hubDeskState?: { queueChangeState?: string } }).__hubDeskState
          ?.queueChangeState === "applied",
    );
    const appliedOrder = await readQueueOrder(page);
    assertCondition(
      appliedOrder.join("|") === "hub-case-087|hub-case-104|hub-case-066",
      `unexpected applied authoritative order: ${appliedOrder.join("|")}`,
    );
    assertCondition(
      (await root.getAttribute("data-selected-case-id")) === "hub-case-104",
      "applied queue delta stole the selected case",
    );
    const selectedOptionApplied = await page
      .locator("[data-testid='HubDecisionDockHost']")
      .getAttribute("data-selected-option");
    assertCondition(
      selectedOptionApplied === "opt-104-north-shore",
      "applied queue delta stole the selected option",
    );
    assertCondition(
      externalRequests.size === 0,
      `unexpected external requests: ${Array.from(externalRequests).join(", ")}`,
    );

    await page.screenshot({ path: outputPath("327-hub-queue-workbench.png"), fullPage: true });
    await context.tracing.stop({ path: outputPath("327-hub-queue-workbench-trace.zip") });
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
