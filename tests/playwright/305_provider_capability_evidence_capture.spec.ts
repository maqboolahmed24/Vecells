import {
  assertCondition,
  importPlaywright,
  loginToProviderCapabilityEvidencePortal,
  outputPath,
  startProviderCapabilityEvidenceHarness,
  stopProviderCapabilityEvidenceHarness,
  trackExternalRequests,
} from "./305_provider_capability_evidence.helpers.ts";

export const providerCapabilityEvidenceCaptureCoverage = [
  "masked operator login reaches the provider capability evidence console",
  "browser capture refreshes the repo-owned local-gateway twins into current evidence",
  "manual-bridge supplier rows stay review_required instead of faking current posture",
  "browser proof stays free of raw secret references",
];

export async function run(): Promise<void> {
  const playwright = await importPlaywright();
  const { server, baseUrl } = await startProviderCapabilityEvidenceHarness();
  const browser = await playwright.chromium.launch({ headless: true });

  try {
    const context = await browser.newContext({ viewport: { width: 1480, height: 1120 } });
    await context.tracing.start({ screenshots: true, snapshots: true });
    const page = await context.newPage();
    const externalRequests = new Set<string>();
    trackExternalRequests(page, baseUrl, externalRequests);

    await loginToProviderCapabilityEvidencePortal(page, baseUrl);
    await page.getByTestId("capture-provider-capability-evidence").click();
    await page.waitForURL(/\/portal\/evidence$/);

    const localTwin = page.getByTestId("evidence-row-sandbox_304_vecells_local_gateway_local_twin");
    const sandboxTwin = page.getByTestId("evidence-row-sandbox_304_vecells_local_gateway_sandbox_twin");
    const optum = page.getByTestId("evidence-row-sandbox_304_optum_im1_supported_test");
    const manualAssist = page.getByTestId("evidence-row-sandbox_304_manual_assist_ops_twin");

    assertCondition(
      (await localTwin.getAttribute("data-evidence-status")) === "current",
      "local-gateway local twin should converge to current evidence",
    );
    assertCondition(
      (await sandboxTwin.getAttribute("data-evidence-status")) === "current",
      "local-gateway sandbox twin should converge to current evidence",
    );
    assertCondition(
      (await localTwin.getAttribute("data-callback-state")) === "verified",
      "local-gateway local twin should expose verified callback posture",
    );
    assertCondition(
      (await optum.getAttribute("data-evidence-status")) === "review_required",
      "Optum IM1 should remain review-required",
    );
    assertCondition(
      (await manualAssist.getAttribute("data-evidence-status")) === "manual_attested",
      "manual assist row should remain manual-attested",
    );
    assertCondition(
      (await page.content()).includes("secret://") === false,
      "evidence console must not render raw secret references",
    );
    assertCondition(
      (await page.content()).includes("vault://") === false,
      "evidence console must not render raw vault references",
    );
    assertCondition(
      (await page.content()).includes("env://") === false,
      "evidence console must not render raw env references",
    );
    assertCondition(
      externalRequests.size === 0,
      `provider evidence harness should stay local: ${Array.from(externalRequests).join(", ")}`,
    );

    await page.screenshot({
      path: outputPath("305-provider-capability-evidence-capture.png"),
      fullPage: true,
      animations: "disabled",
      caret: "hide",
    });
    await context.tracing.stop({
      path: outputPath("305-provider-capability-evidence-capture-trace.zip"),
    });
    await context.close();
  } finally {
    await browser.close();
    await stopProviderCapabilityEvidenceHarness(server);
  }
}

if (process.argv.includes("--run")) {
  run().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
