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
  trackExternalRequests,
  waitForHubRootState,
} from "./326_hub_shell.helpers";

export const hubShellVisualCoverage = [
  "desktop queue shell screenshot",
  "tablet case shell screenshot",
  "mobile exceptions screenshot",
  "reduced-motion observe-only screenshot",
  "hub shell atlas screenshot",
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
    const desktopContext = await browser.newContext({ viewport: { width: 1600, height: 1240 } });
    const desktop = await desktopContext.newPage();
    const externalRequests = new Set<string>();
    trackExternalRequests(desktop, baseUrl, externalRequests);

    await openHubRoute(desktop, `${baseUrl}/hub/queue`, "hub-start-of-day");
    await desktop.screenshot({ path: outputPath("326-hub-shell-desktop-queue.png"), fullPage: true });
    await assertNoHorizontalOverflow(desktop, "326 hub shell desktop queue");

    await desktop.getByRole("button", { name: "Resume same-day coordination" }).click();
    await waitForHubRootState(desktop, {
      currentPath: "/hub/case/hub-case-104",
      viewMode: "case",
    });

    await desktop.setViewportSize({ width: 1180, height: 1024 });
    await desktop.screenshot({ path: outputPath("326-hub-shell-tablet-case.png"), fullPage: true });
    await assertNoHorizontalOverflow(desktop, "326 hub shell tablet case");

    await desktop.setViewportSize({ width: 412, height: 915 });
    await desktop.locator("[data-testid='hub-saved-view-supplier_drift']").click();
    await waitForHubRootState(desktop, {
      currentPath: "/hub/queue",
      viewMode: "queue",
      shellStatus: "shell_recovery_only",
      layoutMode: "mission_stack",
    });
    await desktop.getByRole("button", { name: "Exceptions" }).click();
    await waitForHubRootState(desktop, {
      currentPath: "/hub/exceptions",
      viewMode: "exceptions",
      layoutMode: "mission_stack",
    });
    await desktop.screenshot({ path: outputPath("326-hub-shell-mobile-exceptions.png"), fullPage: true });
    await assertNoHorizontalOverflow(desktop, "326 hub shell mobile exceptions");

    const reducedContext = await browser.newContext({
      viewport: { width: 1360, height: 1040 },
      reducedMotion: "reduce",
    });
    const reduced = await reducedContext.newPage();
    await openHubRoute(reduced, `${baseUrl}/hub/queue`, "hub-start-of-day");
    await reduced.locator("[data-testid='hub-saved-view-observe_only']").click();
    await waitForHubRootState(reduced, {
      currentPath: "/hub/queue",
      shellStatus: "shell_read_only",
      savedViewId: "observe_only",
      selectedCaseId: "hub-case-041",
    });
    await reduced.screenshot({
      path: outputPath("326-hub-shell-reduced-observe-only.png"),
      fullPage: true,
    });

    const atlasPage = await browser.newPage({ viewport: { width: 1520, height: 1160 } });
    const atlasExternalRequests = new Set<string>();
    trackExternalRequests(atlasPage, new URL(atlas.atlasUrl).origin, atlasExternalRequests);
    await openHubAtlas(atlasPage, atlas.atlasUrl);
    const atlasRoot = atlasPage.locator("[data-testid='HubDeskShellAtlas']");
    assertCondition(
      (await atlasRoot.getAttribute("data-visual-mode")) === "Hub_Desk_Mission_Control",
      "atlas visual mode drifted",
    );
    await atlasPage.getByRole("button", { name: "Callback recovery" }).click();
    await atlasPage.getByRole("button", { name: "Exceptions" }).click();
    await atlasPage.screenshot({ path: outputPath("326-hub-shell-atlas.png"), fullPage: true });

    assertCondition(
      externalRequests.size === 0,
      `unexpected app external requests: ${Array.from(externalRequests).join(", ")}`,
    );
    assertCondition(
      atlasExternalRequests.size === 0,
      `unexpected atlas external requests: ${Array.from(atlasExternalRequests).join(", ")}`,
    );

    await reducedContext.close();
    await desktopContext.close();
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
