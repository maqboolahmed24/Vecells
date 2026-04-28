import {
  assertCondition,
  importPlaywright,
  openQueueFairnessScenario,
  outputPath,
  startQueueFairnessLabServer,
  stopQueueFairnessLabServer,
  takeQueueLabTrace,
  writeAccessibilitySnapshot,
} from "./272_queue_suite_helpers";
import { assertNoHorizontalOverflow } from "./255_workspace_shell_helpers";

export async function run(): Promise<void> {
  const playwright = await importPlaywright();
  if (!playwright) {
    return;
  }

  const { server, atlasUrl } = await startQueueFairnessLabServer();
  const browser = await playwright.chromium.launch({ headless: true });

  try {
    const desktopContext = await browser.newContext({
      viewport: { width: 1500, height: 1080 },
    });
    await desktopContext.tracing.start({ screenshots: true, snapshots: true });
    const desktop = await desktopContext.newPage();

    await openQueueFairnessScenario(desktop, atlasUrl, "queue_calm_replay");
    await assertNoHorizontalOverflow(desktop, "272 calm queue lab");
    await desktop.screenshot({ path: outputPath("272-queue-calm.png"), fullPage: true });

    await openQueueFairnessScenario(desktop, atlasUrl, "queue_overload_guard");
    await assertNoHorizontalOverflow(desktop, "272 overload queue lab");
    await desktop.screenshot({ path: outputPath("272-queue-overload.png"), fullPage: true });

    await openQueueFairnessScenario(desktop, atlasUrl, "duplicate_review_authority");
    assertCondition(
      (await desktop.locator("[data-testid='DuplicateEvidenceCompare']").getAttribute("data-duplicate-mode")) ===
        "authority_review",
      "duplicate review scenario should render the authority review mode",
    );
    await desktop.screenshot({ path: outputPath("272-queue-duplicate-review.png"), fullPage: true });

    await openQueueFairnessScenario(desktop, atlasUrl, "stale_owner_recovery");
    await desktop.screenshot({ path: outputPath("272-queue-stale-recovery.png"), fullPage: true });
    await writeAccessibilitySnapshot(desktop, "272-queue-a11y-snapshot.json");

    const mobileContext = await browser.newContext({
      viewport: { width: 412, height: 915 },
      reducedMotion: "reduce",
    });
    await mobileContext.tracing.start({ screenshots: true, snapshots: true });
    const mobile = await mobileContext.newPage();

    await openQueueFairnessScenario(mobile, atlasUrl, "stale_owner_recovery");
    assertCondition(
      (await mobile.locator("[data-testid='QueueFairnessRecoveryLab']").getAttribute("data-selected-scenario-id")) ===
        "stale_owner_recovery",
      "mobile reduced-motion scenario did not load",
    );
    await assertNoHorizontalOverflow(mobile, "272 mobile reduced queue lab");
    await mobile.screenshot({ path: outputPath("272-queue-mobile-reduced.png"), fullPage: true });

    await takeQueueLabTrace(desktopContext, "272-queue-visual-trace.zip");
    await takeQueueLabTrace(mobileContext, "272-queue-accessibility-trace.zip");
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
