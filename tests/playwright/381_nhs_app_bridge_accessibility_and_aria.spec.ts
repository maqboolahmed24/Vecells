import {
  assertCondition,
  importPlaywright,
  makeBridgeFixture,
  outputPath,
  renderDiagnostics,
} from "./381_nhs_app_bridge.helpers.ts";

export async function run(): Promise<void> {
  const playwright = await importPlaywright();
  if (!playwright) {
    return;
  }
  const browser = await playwright.chromium.launch({ headless: true });

  try {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      locale: "en-GB",
      timezoneId: "Europe/London",
      reducedMotion: "reduce",
    });
    await context.tracing.start({ screenshots: true, snapshots: true });
    const page = await context.newPage();
    const degraded = makeBridgeFixture({
      platform: "android",
      eligibilityState: "recovery_required",
    });
    await renderDiagnostics(page, degraded.bridge);

    const root = page.locator("[data-testid='bridge-diagnostics-root']");
    assertCondition(
      (await root.getAttribute("data-bridge-state")) === "recovery",
      "recovery eligibility should render recovery diagnostics",
    );
    assertCondition(
      (await page.getByRole("status").innerText()).includes("Bridge state: recovery"),
      "bridge state should be announced through a status region",
    );
    const ariaSnapshot =
      typeof page.locator("main").ariaSnapshot === "function"
        ? await page.locator("main").ariaSnapshot()
        : await page.locator("main").innerText();
    assertCondition(
      String(ariaSnapshot).includes("NHS App bridge diagnostics"),
      "ARIA snapshot should include the diagnostics heading",
    );
    assertCondition(
      String(ariaSnapshot).includes("Hidden capabilities"),
      "ARIA snapshot should include hidden capability section",
    );

    const width = await page.evaluate(() => document.documentElement.scrollWidth);
    assertCondition(width <= 390, "diagnostics surface should not overflow mobile viewport");
    await page.screenshot({
      path: outputPath("381-bridge-accessibility-and-aria.png"),
      fullPage: true,
      animations: "disabled",
    });
    await context.tracing.stop({
      path: outputPath("381-bridge-accessibility-and-aria-trace.zip"),
    });
  } finally {
    await browser.close();
  }
}

if (process.argv.includes("--run")) {
  run().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
} else {
  console.log("381_nhs_app_bridge_accessibility_and_aria.spec.ts: syntax ok");
}
