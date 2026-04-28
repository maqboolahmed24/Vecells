import {
  assertCondition,
  importPlaywright,
  loginToProviderPortal,
  outputPath,
  startProviderPortalHarness,
  stopProviderPortalHarness,
  trackExternalRequests,
} from "./304_provider_sandbox.helpers.ts";

export const providerSandboxPortalSetupCoverage = [
  "masked operator login reaches the provider sandbox control plane",
  "repo-owned twins converge their callback target through the browser portal",
  "manual-bridge supplier rows stay explicit instead of faking automation",
  "sandbox cards expose binding hashes and masked secret fingerprints only",
];

export async function run(): Promise<void> {
  const playwright = await importPlaywright();
  const { server, baseUrl } = await startProviderPortalHarness();
  const browser = await playwright.chromium.launch({ headless: true });

  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1080 } });
    await context.tracing.start({ screenshots: true, snapshots: true });
    const page = await context.newPage();
    const externalRequests = new Set<string>();
    trackExternalRequests(page, baseUrl, externalRequests);

    await loginToProviderPortal(page, baseUrl);
    const localTwin = page.getByTestId("sandbox-row-sandbox_304_vecells_local_gateway_local_twin");
    const sandboxTwin = page.getByTestId("sandbox-row-sandbox_304_vecells_local_gateway_sandbox_twin");
    const optumManualBridge = page.getByTestId(
      "manual-bridge-sandbox_304_optum_im1_supported_test",
    );

    assertCondition(
      (await localTwin.getAttribute("data-configured-state")) === "unconfigured",
      "local twin should start unconfigured before portal bootstrap",
    );
    await page.getByTestId("sandbox-bootstrap-sandbox_304_vecells_local_gateway_local_twin").click();
    await page.waitForURL(/\/portal\/sandboxes$/);
    assertCondition(
      (await localTwin.getAttribute("data-configured-state")) === "current",
      "local twin should converge to current after portal bootstrap",
    );

    await page.getByTestId("sandbox-bootstrap-sandbox_304_vecells_local_gateway_sandbox_twin").click();
    await page.waitForURL(/\/portal\/sandboxes$/);
    assertCondition(
      (await sandboxTwin.getAttribute("data-configured-state")) === "current",
      "sandbox twin should converge to current after portal bootstrap",
    );

    assertCondition(await optumManualBridge.isVisible(), "Optum IM1 row should expose manual bridge posture");
    assertCondition(
      (await page
        .getByTestId("sandbox-secret-fingerprint-sandbox_304_vecells_local_gateway_local_twin")
        .innerText())
        .includes("sha256:"),
      "sandbox row should expose only masked secret fingerprints",
    );
    assertCondition(
      (await page.content()).includes("secret://") === false,
      "portal page must not render raw secret references",
    );
    assertCondition(
      (await page.content()).includes("BEGIN CERTIFICATE") === false,
      "portal page must not render certificate bodies",
    );
    assertCondition(
      externalRequests.size === 0,
      `provider portal should stay local: ${Array.from(externalRequests).join(", ")}`,
    );

    await page.screenshot({
      path: outputPath("304-provider-sandbox-portal-setup.png"),
      fullPage: true,
      animations: "disabled",
      caret: "hide",
    });
    await context.tracing.stop({
      path: outputPath("304-provider-sandbox-portal-setup-trace.zip"),
    });
    await context.close();
  } finally {
    await browser.close();
    await stopProviderPortalHarness(server);
  }
}

if (process.argv.includes("--run")) {
  run().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
