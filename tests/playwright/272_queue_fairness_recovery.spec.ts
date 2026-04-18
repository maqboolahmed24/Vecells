import {
  assertCondition,
  importPlaywright,
  openQueueFairnessScenario,
  outputPath,
  startQueueFairnessLabServer,
  stopQueueFairnessLabServer,
  takeQueueLabTrace,
} from "./272_queue_suite_helpers";

function selectedRowTask(page: any) {
  return page.locator("[data-testid='RankReplayList'] [role='option'][aria-selected='true']");
}

export async function run(): Promise<void> {
  const playwright = await importPlaywright();
  if (!playwright) {
    return;
  }

  const { server, atlasUrl } = await startQueueFairnessLabServer();
  const browser = await playwright.chromium.launch({ headless: true });

  try {
    const context = await browser.newContext({
      viewport: { width: 1480, height: 1040 },
      reducedMotion: "no-preference",
    });
    await context.tracing.start({ screenshots: true, snapshots: true });
    const page = await context.newPage();

    await openQueueFairnessScenario(page, atlasUrl, "queue_calm_replay");
    assertCondition(
      (await page.locator("[data-testid='ReplaySummaryCard']").getAttribute("data-overload-state")) === "nominal",
      "queue calm replay should stay nominal",
    );
    assertCondition(
      (await page.locator("[data-testid='ReplaySummaryCard']").textContent())?.includes(
        "queue-row-order::a7c693fab31003ee88552ef1b04771eb",
      ) === true,
      "queue calm replay hash drifted",
    );

    await page.locator("[data-testid='RankReplayList']").focus();
    await page.keyboard.press("ArrowDown");
    await page.waitForFunction(
      () =>
        document
          .querySelector("[data-testid='RankReplayList'] [role='option'][aria-selected='true']")
          ?.getAttribute("data-task-ref") === "task_queue_duplicate",
    );
    assertCondition(
      (await selectedRowTask(page).getAttribute("data-task-ref")) === "task_queue_duplicate",
      "keyboard traversal should select the second queue row",
    );

    await page.keyboard.press("Tab");
    await page.keyboard.press("Enter");
    await openQueueFairnessScenario(page, atlasUrl, "queue_overload_guard");
    assertCondition(
      (await page.locator("[data-testid='ReplaySummaryCard']").getAttribute("data-overload-state")) ===
        "overload_critical",
      "overload guard scenario should present the overload posture",
    );
    assertCondition(
      (await page.locator("[data-testid='FairnessCreditBoard']").textContent())?.includes(
        "Fairness promises suppressed",
      ) === true,
      "overload guard must admit suppressed fairness promises",
    );

    await page.locator("[data-scenario-id='duplicate_review_authority']").click();
    await page.waitForFunction(
      () =>
        document.querySelector("[data-testid='QueueFairnessRecoveryLab']")?.getAttribute("data-selected-scenario-id") ===
        "duplicate_review_authority",
    );
    assertCondition(
      (await page.locator("[data-testid='DuplicateEvidenceCompare']").textContent())?.includes(
        "DuplicateReviewSnapshot",
      ) === true,
      "duplicate review scenario must render the authoritative duplicate review projection",
    );

    await page.locator("[data-scenario-id='stale_owner_recovery']").click();
    await page.waitForFunction(
      () =>
        document.querySelector("[data-testid='QueueFairnessRecoveryLab']")?.getAttribute("data-selected-scenario-id") ===
        "stale_owner_recovery",
    );
    assertCondition(
      (await page.locator("[data-testid='OwnershipEpochLadder']").textContent())?.includes(
        "Return anchor preserved",
      ) === true,
      "stale-owner recovery must preserve the return anchor summary",
    );
    assertCondition(
      (await page.locator("[data-testid='OwnershipEpochLadder']").getAttribute("data-next-task-state")) ===
        "blocked_stale_owner",
      "stale-owner recovery must keep next-task launch blocked",
    );

    await takeQueueLabTrace(context, "272-queue-fairness-trace.zip");
  } finally {
    await browser.close();
    await stopQueueFairnessLabServer(server);
  }
}

if (process.argv.includes("--run")) {
  run().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
