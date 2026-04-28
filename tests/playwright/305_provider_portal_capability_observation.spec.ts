import {
  assertCondition,
  importPlaywright,
  loginToProviderCapabilityEvidencePortal,
  outputPath,
  startProviderCapabilityEvidenceHarness,
  stopProviderCapabilityEvidenceHarness,
  trackExternalRequests,
} from "./305_provider_capability_evidence.helpers.ts";

export const providerPortalCapabilityObservationCoverage = [
  "local-gateway detail view exposes supported and unsupported capability claims truthfully",
  "prerequisite posture remains visible beside the capability rows",
  "credential governance renders only masked fingerprints and owner metadata",
  "manual-bridge provider detail keeps the gap artifact explicit",
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

    await page.getByTestId("observation-link-sandbox_304_vecells_local_gateway_local_twin").click();
    await page.waitForURL(/sandbox_304_vecells_local_gateway_local_twin/);

    const searchClaim = page.getByTestId(
      "claim-sandbox_304_vecells_local_gateway_local_twin-search_slots_support",
    );
    const rescheduleClaim = page.getByTestId(
      "claim-sandbox_304_vecells_local_gateway_local_twin-reschedule_appointment_support",
    );
    const localComponentClaim = page.getByTestId(
      "claim-sandbox_304_vecells_local_gateway_local_twin-local_component_requirement",
    );
    const fingerprint = page.getByTestId(
      "credential-fingerprint-credential_sandbox_304_vecells_local_gateway_local_twin_portalUser",
    );

    assertCondition(
      (await searchClaim.getAttribute("data-claim-outcome")) === "supported" &&
        (await searchClaim.getAttribute("data-claim-value")) === "true",
      "local-gateway local twin should support slot search",
    );
    assertCondition(
      (await rescheduleClaim.getAttribute("data-claim-outcome")) === "unsupported" &&
        (await rescheduleClaim.getAttribute("data-claim-value")) === "false",
      "local-gateway local twin should keep reschedule unsupported",
    );
    assertCondition(
      (await localComponentClaim.getAttribute("data-claim-outcome")) === "required" &&
        (await localComponentClaim.getAttribute("data-claim-value")) === "true",
      "local-gateway local twin should require the local component",
    );
    assertCondition(
      (await fingerprint.innerText()).includes("sha256:"),
      "credential view must expose only masked fingerprints",
    );
    assertCondition(
      (await page.content()).includes("secret://") === false,
      "observation detail must not render secret refs",
    );

    await page.goto(
      `${baseUrl}/portal/observations?sandboxId=sandbox_304_optum_im1_supported_test`,
      { waitUntil: "networkidle" },
    );
    const optumBanner = page.getByTestId(
      "observation-banner-sandbox_304_optum_im1_supported_test",
    );
    const optumGap = page.getByTestId("gap-artifact-sandbox_304_optum_im1_supported_test");

    assertCondition(
      (await optumBanner.getAttribute("data-evidence-status")) === "review_required",
      "Optum IM1 detail should stay review-required",
    );
    assertCondition(
      (await optumGap.innerText()).includes(
        "PHASE4_INTERFACE_GAP_PROVIDER_CAPABILITY_EVIDENCE_OPTUM_IM1",
      ),
      "Optum IM1 detail should surface the provider-specific gap artifact",
    );
    assertCondition(
      externalRequests.size === 0,
      `provider evidence harness should stay local: ${Array.from(externalRequests).join(", ")}`,
    );

    await page.screenshot({
      path: outputPath("305-provider-portal-capability-observation.png"),
      fullPage: true,
      animations: "disabled",
      caret: "hide",
    });
    await context.tracing.stop({
      path: outputPath("305-provider-portal-capability-observation-trace.zip"),
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
