import {
  assertCondition,
  importPlaywright,
  openHardeningWorkspaceRoute,
  openWorkspaceHardeningScenario,
  outputPath,
  startClinicalWorkspace,
  startTracedContext,
  startWorkspaceHardeningLabServer,
  stopClinicalWorkspace,
  stopTrace,
  stopWorkspaceHardeningLabServer,
} from "./276_workspace_hardening.helpers";

export async function run(): Promise<void> {
  const playwright = await importPlaywright();
  if (!playwright) {
    return;
  }

  const { child, baseUrl } = await startClinicalWorkspace();
  const browser = await playwright.chromium.launch({ headless: true });
  const { server, atlasUrl } = await startWorkspaceHardeningLabServer();

  try {
    const liveContext = await startTracedContext(browser, {
      viewport: { width: 1440, height: 960 },
    });
    const livePage = await liveContext.newPage();

    await openHardeningWorkspaceRoute(
      livePage,
      baseUrl,
      "/workspace/queue/recommended?state=live",
      "WorkspaceQueueRoute",
      ["hardening_safe", "large_queue"],
    );
    await livePage.screenshot({
      path: outputPath("276-workspace-queue-calm-large.png"),
      fullPage: true,
      animations: "disabled",
    });

    await openHardeningWorkspaceRoute(
      livePage,
      baseUrl,
      "/workspace/task/task-311?state=stale",
      "WorkspaceTaskRoute",
    );
    await livePage.screenshot({
      path: outputPath("276-workspace-task-stale-recoverable.png"),
      fullPage: true,
      animations: "disabled",
    });

    await openHardeningWorkspaceRoute(
      livePage,
      baseUrl,
      "/workspace/task/task-311/more-info?state=read_only",
      "WorkspaceMoreInfoChildRoute",
    );
    await livePage.screenshot({
      path: outputPath("276-workspace-read-only-fallback.png"),
      fullPage: true,
      animations: "disabled",
    });

    await openWorkspaceHardeningScenario(livePage, atlasUrl, "large_queue_windowed");
    assertCondition(
      (await livePage.locator("[data-testid='WorkspaceHardeningAssuranceLab']").getAttribute("data-visual-mode")) ===
        "Workspace_Hardening_Assurance_Lab",
      "assurance lab should expose the required visual mode",
    );
    await livePage.screenshot({
      path: outputPath("276-workspace-hardening-lab.png"),
      fullPage: true,
      animations: "disabled",
    });
    await stopTrace(liveContext, "276-workspace-visual.trace.zip");
    await liveContext.close();

    const reducedContext = await startTracedContext(browser, {
      viewport: { width: 390, height: 844 },
      reducedMotion: "reduce",
    });
    const reducedPage = await reducedContext.newPage();
    await openHardeningWorkspaceRoute(
      reducedPage,
      baseUrl,
      "/workspace/task/task-311/decision?state=live",
      "WorkspaceDecisionChildRoute",
    );
    await reducedPage.screenshot({
      path: outputPath("276-workspace-reduced-motion-task-mobile.png"),
      fullPage: true,
      animations: "disabled",
    });
    await stopTrace(reducedContext, "276-workspace-visual-reduced.trace.zip");
    await reducedContext.close();
  } finally {
    await stopWorkspaceHardeningLabServer(server);
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
