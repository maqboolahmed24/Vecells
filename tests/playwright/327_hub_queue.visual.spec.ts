import {
  assertCondition,
  assertNoHorizontalOverflow,
  importPlaywright,
  openHubAtlas,
  openHubRoute,
  outputPath,
  startHubAtlasServer,
  startHubDesk,
  stopHubAtlasServer,
  stopHubDesk,
  waitForHubRootState,
} from "./327_hub_queue.helpers";

export const hubQueueVisualCoverage = [
  "desktop queue workbench screenshot",
  "tablet case workbench screenshot",
  "mobile mission-stack screenshot",
  "queue workbench atlas screenshot",
];

export async function run(): Promise<void> {
  const playwright = await importPlaywright();
  if (!playwright) {
    return;
  }

  const { child, baseUrl } = await startHubDesk();
  const atlas = await startHubAtlasServer();
  const browser = await playwright.chromium.launch({ headless: true });

  try {
    const page = await browser.newPage({ viewport: { width: 1600, height: 1240 } });
    await openHubRoute(page, `${baseUrl}/hub/queue`, "hub-start-of-day");
    await page.screenshot({ path: outputPath("327-hub-queue-desktop.png"), fullPage: true });
    await assertNoHorizontalOverflow(page, "327 desktop queue workbench");

    await page.locator("[data-testid='hub-resume-dominant-action']").click();
    await waitForHubRootState(page, {
      currentPath: "/hub/case/hub-case-104",
      viewMode: "case",
    });

    await page.setViewportSize({ width: 1180, height: 1024 });
    await page.screenshot({ path: outputPath("327-hub-queue-tablet-case.png"), fullPage: true });
    await assertNoHorizontalOverflow(page, "327 tablet case workbench");

    await page.setViewportSize({ width: 412, height: 915 });
    await page.locator("[data-testid='hub-saved-view-callback_recovery']").click();
    await waitForHubRootState(page, {
      currentPath: "/hub/queue",
      savedViewId: "callback_recovery",
      layoutMode: "mission_stack",
      shellStatus: "shell_recovery_only",
    });
    await page.screenshot({ path: outputPath("327-hub-queue-mobile.png"), fullPage: true });
    await assertNoHorizontalOverflow(page, "327 mobile workbench");

    const atlasPage = await browser.newPage({ viewport: { width: 1540, height: 1180 } });
    await openHubAtlas(atlasPage, atlas.atlasUrl);
    const atlasRoot = atlasPage.locator("[data-testid='HubQueueWorkbenchAtlas']");
    assertCondition(
      (await atlasRoot.getAttribute("data-visual-mode")) === "Hub_Queue_Risk_Workbench",
      "queue atlas visual mode drifted",
    );
    await atlasPage.screenshot({ path: outputPath("327-hub-queue-atlas.png"), fullPage: true });
  } finally {
    await browser.close();
    await stopHubAtlasServer(atlas.server);
    await stopHubDesk(child);
  }
}

if (process.argv.includes("--run")) {
  run().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
