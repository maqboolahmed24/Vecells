import {
  assertCondition,
  importPlaywright,
  loginToProviderPortal,
  outputPath,
  startProviderPortalHarness,
  stopProviderPortalHarness,
  trackExternalRequests,
} from "./304_provider_sandbox.helpers.ts";

export const providerCallbackRegistrationCoverage = [
  "browser-driven verification shows replay-safe decision classes for automated callback rows",
  "authoritative-read rows stay explicit without claiming webhook support",
  "manual-bridge rows are reported as manual bridge rather than generic failures",
  "unsupported rows remain visibly non-callback-driven",
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
    await page.getByTestId("sandbox-bootstrap-sandbox_304_vecells_local_gateway_local_twin").click();
    await page.waitForURL(/\/portal\/sandboxes$/);
    await page.getByTestId("sandbox-bootstrap-sandbox_304_vecells_local_gateway_sandbox_twin").click();
    await page.waitForURL(/\/portal\/sandboxes$/);

    await page.getByTestId("portal-nav-callbacks").click();
    await page.waitForURL(/\/portal\/callbacks$/);
    await page.getByTestId("callback-verify-all").click();
    await page.waitForURL(/\/portal\/callbacks$/);

    const localTwin = page.getByTestId("callback-row-callback_304_vecells_local_gateway_local_twin");
    const sandboxTwin = page.getByTestId("callback-row-callback_304_vecells_local_gateway_sandbox_twin");
    const tppTransaction = page.getByTestId(
      "callback-row-callback_304_tpp_im1_transaction_supported_test",
    );
    const optumReadAfterWrite = page.getByTestId(
      "callback-row-callback_304_optum_im1_supported_test",
    );
    const gpConnect = page.getByTestId("callback-row-callback_304_gp_connect_integration_candidate");

    assertCondition(
      (await localTwin.getAttribute("data-verification-state")) === "verified",
      "local gateway callback should verify after registration",
    );
    assertCondition(
      (await page
        .getByTestId("callback-decisions-callback_304_vecells_local_gateway_local_twin")
        .innerText())
        .includes("accepted_new"),
      "local gateway callback should show accepted_new decision",
    );
    assertCondition(
      (await page
        .getByTestId("callback-decisions-callback_304_vecells_local_gateway_local_twin")
        .innerText())
        .includes("semantic_replay"),
      "local gateway callback should show semantic_replay decision",
    );
    assertCondition(
      (await page
        .getByTestId("callback-decisions-callback_304_vecells_local_gateway_local_twin")
        .innerText())
        .includes("stale_ignored"),
      "local gateway callback should show stale_ignored decision",
    );
    assertCondition(
      (await sandboxTwin.getAttribute("data-verification-state")) === "verified",
      "sandbox gateway callback should verify after registration",
    );
    assertCondition(
      (await tppTransaction.getAttribute("data-verification-state")) === "manual_bridge_required",
      "manual bridge supplier callback rows must not collapse into generic verification failures",
    );
    assertCondition(
      (await optumReadAfterWrite.getAttribute("data-verification-state")) === "verified",
      "read-after-write rows should verify as manifest-backed posture",
    );
    assertCondition(
      (await gpConnect.getAttribute("data-verification-state")) === "not_applicable",
      "GP Connect row should remain visibly non-callback-driven",
    );
    assertCondition(
      externalRequests.size === 0,
      `callback portal should stay local: ${Array.from(externalRequests).join(", ")}`,
    );

    await page.screenshot({
      path: outputPath("304-provider-callback-registration.png"),
      fullPage: true,
      animations: "disabled",
      caret: "hide",
    });
    await context.tracing.stop({
      path: outputPath("304-provider-callback-registration-trace.zip"),
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
