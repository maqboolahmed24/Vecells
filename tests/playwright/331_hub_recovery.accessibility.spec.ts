import {
  assertCondition,
  captureAria,
  importPlaywright,
  openHubRoute,
  outputPath,
  startHubDesk,
  stopHubDesk,
  writeJsonArtifact,
} from "./327_hub_queue.helpers";

export const hubRecoveryAccessibilityCoverage = [
  "recovery case canvas remains keyboard and landmark safe",
  "exceptions workspace rows and drawer produce stable aria snapshots",
  "reduced-motion parity keeps the same shell markers",
];

export async function run(): Promise<void> {
  const playwright = await importPlaywright();
  if (!playwright) {
    return;
  }

  const { child, baseUrl } = await startHubDesk();
  const browser = await playwright.chromium.launch({ headless: true });

  try {
    const context = await browser.newContext({
      viewport: { width: 1366, height: 960 },
      locale: "en-GB",
      timezoneId: "Europe/London",
    });
    const page = await context.newPage();

    await openHubRoute(page, `${baseUrl}/hub/case/hub-case-052`, "hub-case-route");
    const recoveryCanvas = page.getByTestId("HubRecoveryCaseCanvas");
    await recoveryCanvas.waitFor();
    const navCount = await page.locator("nav").count();
    const mainCount = await page.locator("main").count();
    const bannerCount = await page.locator("[role='banner']").count();
    assertCondition(navCount >= 1, "recovery shell lost navigation landmark");
    assertCondition(mainCount === 1, "recovery shell should keep one main landmark");
    assertCondition(bannerCount === 1, "recovery shell should keep one banner landmark");

    const callbackButton = page.getByRole("button", { name: "Publish callback expectation" }).first();
    await callbackButton.focus();
    const callbackVisible = await callbackButton.evaluate((node: HTMLElement) => {
      const rect = node.getBoundingClientRect();
      return rect.top >= 0 && rect.bottom <= window.innerHeight;
    });
    assertCondition(callbackVisible, "focused recovery action is obscured");

    const recoveryAria = await captureAria(recoveryCanvas, page);
    writeJsonArtifact("331-hub-recovery-canvas.aria.json", recoveryAria);

    await openHubRoute(page, `${baseUrl}/hub/exceptions`, "HubExceptionQueueView");
    const workspace = page.getByTestId("HubExceptionQueueView");
    await workspace.waitFor();
    await page.getByTestId("hub-exception-row-exc-loop-031").focus();
    const workspaceAria = await captureAria(workspace, page);
    const drawerAria = await captureAria(page.getByTestId("HubExceptionDetailDrawer"), page);
    writeJsonArtifact("331-hub-exceptions-aria.json", {
      workspace: workspaceAria,
      drawer: drawerAria,
    });

    const reducedContext = await browser.newContext({
      viewport: { width: 1280, height: 960 },
      reducedMotion: "reduce",
    });
    const reduced = await reducedContext.newPage();
    await openHubRoute(reduced, `${baseUrl}/hub/case/hub-case-041`, "hub-case-route");
    const reducedRoot = reduced.locator("[data-testid='hub-shell-root']");
    assertCondition(
      (await reducedRoot.getAttribute("data-reduced-motion")) === "reduce",
      "reduced-motion marker drifted on recovery shell",
    );
    await reduced.screenshot({ path: outputPath("331-hub-recovery-reduced-motion.png"), fullPage: true });
    await reducedContext.close();
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
