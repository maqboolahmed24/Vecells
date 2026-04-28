import {
  assertCondition,
  importPlaywright,
  makeBridgeFixture,
  makeGrant,
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
    });
    await context.tracing.start({ screenshots: true, snapshots: true });
    const page = await context.newPage();
    const { bridge, fakeApi } = makeBridgeFixture({ platform: "ios" });
    let callbackCount = 0;

    const install = bridge.setBackAction(() => {
      callbackCount += 1;
    });
    assertCondition(install.ok, "back action lease should install in verified embedded context");
    fakeApi.triggerBackAction();
    assertCondition(callbackCount === 1, "fake NHS App back callback should execute once");

    const staleLeases = bridge.clearForFenceDrift({ sessionEpochRef: "SessionEpoch:drifted" });
    assertCondition(staleLeases[0]?.leaseState === "stale", "session drift should stale the lease");
    fakeApi.triggerBackAction();
    assertCondition(callbackCount === 1, "stale lease must clear raw callback");

    bridge.setBackAction(() => {
      callbackCount += 1;
    });
    const cleared = bridge.clearForRouteExit("soft_navigation");
    assertCondition(cleared[0]?.leaseState === "cleared", "route exit should clear active leases");

    const overlayGrant = makeGrant(bridge, {
      destinationClass: "browser_overlay",
      scrubbedUrlRef: "https://www.nhs.uk/conditions/",
      allowedHostRef: "www.nhs.uk",
      allowedPathPattern: "/conditions/*",
    });
    assertCondition(
      bridge.openOverlay("https://www.nhs.uk/conditions/", overlayGrant).ok,
      "allowlisted scrubbed overlay should open",
    );
    assertCondition(
      bridge.openOverlay("https://www.nhs.uk/conditions/?token=raw", {
        ...overlayGrant,
        scrubbedUrlRef: "https://www.nhs.uk/conditions/?token=raw",
      }).blockedReason === "destination_not_scrubbed",
      "unscrubbed overlay URL should fail closed",
    );

    await renderDiagnostics(page, bridge);
    assertCondition(
      (await page
        .locator("[data-testid='bridge-diagnostics-root']")
        .getAttribute("data-bridge-state")) === "active",
      "bridge diagnostics should stay active after safe navigation checks",
    );
    await page.screenshot({
      path: outputPath("381-bridge-back-action-and-navigation.png"),
      fullPage: true,
      animations: "disabled",
    });
    await context.tracing.stop({
      path: outputPath("381-bridge-back-action-and-navigation-trace.zip"),
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
  console.log("381_nhs_app_back_action_and_navigation.spec.ts: syntax ok");
}
