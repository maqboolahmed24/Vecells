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
    const embeddedContext = await browser.newContext({
      viewport: { width: 390, height: 844 },
      locale: "en-GB",
      timezoneId: "Europe/London",
      userAgent:
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 nhsapp-ios/2.0.0",
    });
    await embeddedContext.tracing.start({ screenshots: true, snapshots: true });
    const embeddedPage = await embeddedContext.newPage();
    const embedded = makeBridgeFixture({ platform: "ios" });
    await renderDiagnostics(embeddedPage, embedded.bridge);
    assertCondition(
      (await embeddedPage
        .locator("[data-testid='bridge-diagnostics-root']")
        .getAttribute("data-bridge-state")) === "active",
      "embedded context should render active bridge diagnostics",
    );
    assertCondition(
      await embeddedPage.locator("[data-bridge-visible='setBackAction']").isVisible(),
      "setBackAction should be visible after verified negotiation",
    );
    assertCondition(
      await embeddedPage.locator("[data-bridge-visible='addToCalendar']").isVisible(),
      "calendar support should be visible on appointment route",
    );
    await embeddedPage.screenshot({
      path: outputPath("381-bridge-runtime-active.png"),
      fullPage: true,
      animations: "disabled",
    });
    await embeddedContext.tracing.stop({ path: outputPath("381-bridge-runtime-active-trace.zip") });
    await embeddedContext.close();

    const standaloneContext = await browser.newContext({
      viewport: { width: 1024, height: 768 },
      locale: "en-GB",
      timezoneId: "Europe/London",
    });
    const standalonePage = await standaloneContext.newPage();
    const standalone = makeBridgeFixture({ platform: "none" });
    await renderDiagnostics(standalonePage, standalone.bridge);
    assertCondition(
      (await standalonePage
        .locator("[data-testid='bridge-diagnostics-root']")
        .getAttribute("data-bridge-state")) === "unavailable",
      "standalone browser should not infer NHS App capability",
    );
    await standaloneContext.close();

    const degradedContext = await browser.newContext({
      viewport: { width: 390, height: 844 },
      locale: "en-GB",
      timezoneId: "Europe/London",
    });
    const degradedPage = await degradedContext.newPage();
    const degraded = makeBridgeFixture({
      platform: "android",
      missingMethods: ["openOverlay", "addToCalendar"],
    });
    await renderDiagnostics(degradedPage, degraded.bridge);
    assertCondition(
      await degradedPage.locator("[data-bridge-hidden='openOverlay']").isVisible(),
      "missing overlay capability should be browser-visible as hidden",
    );
    assertCondition(
      await degradedPage.locator("[data-bridge-hidden='addToCalendar']").isVisible(),
      "missing calendar capability should be browser-visible as hidden",
    );
    await degradedContext.close();
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
  console.log("381_nhs_app_bridge_runtime.spec.ts: syntax ok");
}
