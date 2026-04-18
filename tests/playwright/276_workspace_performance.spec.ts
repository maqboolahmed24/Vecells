import {
  assertCondition,
  closeCommandPalette,
  collectNavigationMetrics,
  countRenderedQueueRows,
  importPlaywright,
  measureAsyncActionMs,
  openCommandPalette,
  openHardeningWorkspaceRoute,
  readQueueRowCount,
  startClinicalWorkspace,
  startTracedContext,
  stopClinicalWorkspace,
  stopTrace,
  waitForFocusOn,
  writeRepoJson,
} from "./276_workspace_hardening.helpers";

const PERFORMANCE_BUDGETS = {
  queueLargeInitialReadyMs: 1500,
  queueRenderedWindowCap: 20,
  commandPaletteOpenMs: 120,
  commandPaletteLayoutShiftPx: 1,
  taskTransitionMs: 1200,
  attachmentStageOpenMs: 1200,
};

export async function run(): Promise<void> {
  const playwright = await importPlaywright();
  if (!playwright) {
    return;
  }

  const { child, baseUrl } = await startClinicalWorkspace();
  const browser = await playwright.chromium.launch({ headless: true });

  try {
    const context = await startTracedContext(browser);
    const page = await context.newPage();
    const readDocumentTop = async (selector: string): Promise<number> =>
      await page.locator(selector).evaluate((node) => {
        const element = node as HTMLElement;
        return Math.round(element.getBoundingClientRect().top + window.scrollY);
      });

    const queueLargeInitialReadyMs = await measureAsyncActionMs(async () => {
      await openHardeningWorkspaceRoute(
        page,
        baseUrl,
        "/workspace/queue/recommended?state=live",
        "WorkspaceQueueRoute",
        ["hardening_safe", "large_queue"],
      );
    });

    const navigationMetrics = await collectNavigationMetrics(page);
    const queueDeclaredRowCount = await readQueueRowCount(page);
    const queueRenderedWindowCount = await countRenderedQueueRows(page);

    assertCondition(queueDeclaredRowCount > 50, "performance suite should exercise a queue larger than 50 rows");
    assertCondition(
      queueRenderedWindowCount <= PERFORMANCE_BUDGETS.queueRenderedWindowCap,
      "windowed queue rendering should stay inside the rendered row cap",
    );

    const paletteTriggerSelector = "[data-testid='WorkspaceCommandPaletteTrigger']";
    const headerBandSelector = "[data-testid='WorkspaceHeaderBand']";
    const headerBandYBefore = await readDocumentTop(headerBandSelector);
    await page.locator(paletteTriggerSelector).focus();
    const commandPaletteOpenMs = await measureAsyncActionMs(async () => {
      await openCommandPalette(page);
    });
    const headerBandYAfter = await readDocumentTop(headerBandSelector);
    const commandPaletteLayoutShiftPx = Math.abs(headerBandYAfter - headerBandYBefore);
    await closeCommandPalette(page);
    await waitForFocusOn(page, paletteTriggerSelector);

    const firstQueueRow = page.locator("[data-testid='queue-workboard'] [role='option']").first();
    const taskTransitionMs = await measureAsyncActionMs(async () => {
      const openButton = firstQueueRow.locator(".staff-shell__queue-open-button");
      await openButton.scrollIntoViewIfNeeded();
      await openButton.evaluate((node: HTMLButtonElement) => node.click());
      await page.waitForURL(/\/workspace\/task\//);
      await page.locator("[data-testid='WorkspaceTaskRoute']").waitFor();
    });

    const attachmentStageOpenMs = await measureAsyncActionMs(async () => {
      const attachmentOpenButton = page
        .locator("[data-testid='AttachmentDigestGrid'] [data-testid='AttachmentDigestCard'] .staff-shell__inline-action")
        .first();
      await attachmentOpenButton.scrollIntoViewIfNeeded();
      await attachmentOpenButton.evaluate((node: HTMLButtonElement) => node.click());
      await page.locator("[data-testid='ArtifactViewerStage']").waitFor();
    });

    writeRepoJson("data/test/276_web_vitals_and_interaction_metrics.json", {
      taskId: "seq_276",
      measuredAt: "2026-04-18",
      browserProject: "chromium",
      scenarioRef: "workspace_large_queue_and_task_hardening_safe",
      budgets: PERFORMANCE_BUDGETS,
      metrics: {
        queueLargeInitialReadyMs,
        queueDeclaredRowCount,
        queueRenderedWindowCount,
        commandPaletteOpenMs,
        commandPaletteLayoutShiftPx,
        taskTransitionMs,
        attachmentStageOpenMs,
      },
      supportEvidence: {
        domContentLoadedMs: navigationMetrics.domContentLoadedMs,
        loadEventEndMs: navigationMetrics.loadEventEndMs,
        largestContentfulPaintMs: navigationMetrics.lcpMs,
        cumulativeLayoutShift: navigationMetrics.cls,
      },
      verdicts: {
        queueLargeInitialReadyMs:
          queueLargeInitialReadyMs <= PERFORMANCE_BUDGETS.queueLargeInitialReadyMs ? "passed" : "failed",
        queueRenderedWindowCount:
          queueRenderedWindowCount <= PERFORMANCE_BUDGETS.queueRenderedWindowCap ? "passed" : "failed",
        commandPaletteOpenMs:
          commandPaletteOpenMs <= PERFORMANCE_BUDGETS.commandPaletteOpenMs ? "passed" : "failed",
        commandPaletteLayoutShiftPx:
          commandPaletteLayoutShiftPx <= PERFORMANCE_BUDGETS.commandPaletteLayoutShiftPx ? "passed" : "failed",
        taskTransitionMs: taskTransitionMs <= PERFORMANCE_BUDGETS.taskTransitionMs ? "passed" : "failed",
        attachmentStageOpenMs:
          attachmentStageOpenMs <= PERFORMANCE_BUDGETS.attachmentStageOpenMs ? "passed" : "failed",
      },
    });

    assertCondition(
      queueLargeInitialReadyMs <= PERFORMANCE_BUDGETS.queueLargeInitialReadyMs,
      `large queue load exceeded budget: ${queueLargeInitialReadyMs}ms`,
    );
    assertCondition(
      commandPaletteOpenMs <= PERFORMANCE_BUDGETS.commandPaletteOpenMs,
      `command palette open exceeded budget: ${commandPaletteOpenMs}ms`,
    );
    assertCondition(
      commandPaletteLayoutShiftPx <= PERFORMANCE_BUDGETS.commandPaletteLayoutShiftPx,
      `command palette caused layout shift: ${commandPaletteLayoutShiftPx}px`,
    );
    assertCondition(
      taskTransitionMs <= PERFORMANCE_BUDGETS.taskTransitionMs,
      `task transition exceeded budget: ${taskTransitionMs}ms`,
    );
    assertCondition(
      attachmentStageOpenMs <= PERFORMANCE_BUDGETS.attachmentStageOpenMs,
      `attachment stage open exceeded budget: ${attachmentStageOpenMs}ms`,
    );

    await stopTrace(context, "276-workspace-performance.trace.zip");
    await context.close();
  } finally {
    await browser.close();
    await stopClinicalWorkspace(child);
  }
}

if (process.argv.includes("--run")) {
  run().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
