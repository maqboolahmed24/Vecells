import {
  assertCondition,
  assertNoHorizontalOverflow,
  ensurePhiSafeWorkspace,
  importPlaywright,
  openHardeningWorkspaceRoute,
  outputPath,
  startClinicalWorkspace,
  startTracedContext,
  stopClinicalWorkspace,
  stopTrace,
  wait,
} from "./276_workspace_hardening.helpers";

export async function run(): Promise<void> {
  const playwright = await importPlaywright();
  if (!playwright) {
    return;
  }

  const { child, baseUrl } = await startClinicalWorkspace();
  const browser = await playwright.chromium.launch({ headless: true });

  try {
    const standardContext = await startTracedContext(browser, {
      viewport: { width: 1440, height: 960 },
    });
    const standardPage = await standardContext.newPage();

    await openHardeningWorkspaceRoute(
      standardPage,
      baseUrl,
      "/workspace/queue/recommended?state=live",
      "WorkspaceQueueRoute",
      ["hardening_safe", "large_queue"],
    );
    await ensurePhiSafeWorkspace(standardPage);
    await assertNoHorizontalOverflow(standardPage, "large queue desktop");

    await standardPage.setViewportSize({ width: 360, height: 960 });
    await wait(120);
    const root = standardPage.locator("[data-testid='WorkspaceShellRouteFamily']");
    assertCondition(
      (await root.getAttribute("data-layout-mode")) === "mission_stack",
      "compact queue route should collapse to mission_stack",
    );
    await assertNoHorizontalOverflow(standardPage, "large queue mission_stack");

    await openHardeningWorkspaceRoute(
      standardPage,
      baseUrl,
      "/workspace/task/task-311/decision?state=live",
      "WorkspaceDecisionChildRoute",
    );
    await ensurePhiSafeWorkspace(standardPage);
    await standardPage.setViewportSize({ width: 640, height: 960 });
    await standardPage.addStyleTag({ content: "html { font-size: 200%; }" });
    await wait(80);
    await assertNoHorizontalOverflow(standardPage, "task shell at 320px-equivalent large text");
    assertCondition(
      (await standardPage.locator("[data-testid='decision-dock']").isVisible()) === true,
      "decision dock should remain visible at large text",
    );

    await openHardeningWorkspaceRoute(
      standardPage,
      baseUrl,
      "/workspace/approvals?state=live",
      "WorkspaceApprovalsRoute",
    );
    await assertNoHorizontalOverflow(standardPage, "approval route at compact width");

    await stopTrace(standardContext, "276-workspace-zoom-motion.trace.zip");
    await standardContext.close();

    const reducedContext = await startTracedContext(browser, {
      viewport: { width: 390, height: 844 },
      reducedMotion: "reduce",
    });
    const reducedPage = await reducedContext.newPage();
    await openHardeningWorkspaceRoute(
      reducedPage,
      baseUrl,
      "/workspace/messages?state=live",
      "WorkspaceMessagesRoute",
    );
    await ensurePhiSafeWorkspace(reducedPage);
    const reducedRoot = reducedPage.locator("[data-testid='WorkspaceShellRouteFamily']");
    assertCondition(
      (await reducedRoot.getAttribute("data-motion-profile")) === "reduced",
      "reduced-motion context should degrade the shell to the reduced motion profile",
    );
    await assertNoHorizontalOverflow(reducedPage, "reduced-motion messages route");
    await reducedPage.screenshot({
      path: outputPath("276-reduced-motion-messages-mobile.png"),
      fullPage: true,
      animations: "disabled",
    });
    await stopTrace(reducedContext, "276-workspace-reduced-motion.trace.zip");
    await reducedContext.close();
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
