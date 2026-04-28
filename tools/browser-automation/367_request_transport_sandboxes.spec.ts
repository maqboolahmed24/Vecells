import fs from "node:fs";
import path from "node:path";

import {
  assertCondition,
  DEFAULT_RUNTIME_DIR,
  importPlaywright,
  loginToTransportSandboxPortal,
  outputPath,
  startTransportSandboxPortalHarness,
  stopTransportSandboxPortalHarness,
  trackExternalRequests,
} from "./367_portal.helpers.ts";
import {
  assertSecretSafePage,
  safeEvidencePolicy,
} from "./367_redaction_helpers.ts";

export async function run(): Promise<void> {
  const playwright = await importPlaywright();
  const { server, baseUrl } = await startTransportSandboxPortalHarness(
    DEFAULT_RUNTIME_DIR,
  );
  const browser = await playwright.chromium.launch({ headless: true });

  try {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 1080 },
      locale: "en-GB",
      timezoneId: "Europe/London",
    });
    const page = await context.newPage();
    const externalRequests = new Set<string>();
    trackExternalRequests(page, baseUrl, externalRequests);

    await loginToTransportSandboxPortal(page, baseUrl);
    await page
      .getByTestId("request-row-update_record_367_integration_pairing")
      .waitFor();

    assertCondition(
      (await page
        .getByTestId("request-row-update_record_367_integration_pairing")
        .getAttribute("data-request-state")) === "drafted",
      "Update Record integration pairing should begin drafted.",
    );
    assertCondition(
      (await page
        .getByTestId("request-row-transport_367_mesh_training_mailbox")
        .getAttribute("data-request-state")) === "drafted",
      "Training MESH mailbox should begin drafted for submit rehearsal.",
    );

    await page
      .getByTestId("prepare-bundle-update_record_367_integration_pairing")
      .click();
    await page.getByTestId("requests-banner").waitFor();
    assertCondition(
      (await page.getByTestId("requests-banner").innerText()).includes(
        "367_operator_submission_bundle_",
      ),
      "Preparing an operator bundle should disclose the masked bundle file.",
    );

    await page
      .getByTestId("submit-request-update_record_367_integration_pairing")
      .click();
    await page.getByTestId("requests-banner").waitFor();
    assertCondition(
      (await page.getByTestId("requests-banner").getAttribute("data-action")) ===
        "manual_stop_required",
      "Update Record submission must stop at the manual checkpoint.",
    );
    assertCondition(
      (await page
        .getByTestId("request-row-update_record_367_integration_pairing")
        .getAttribute("data-request-state")) === "drafted",
      "Manual stop must not mutate the Update Record request into submitted.",
    );

    await page
      .getByTestId("prepare-draft-transport_367_bars_deployment_preflight")
      .click();
    await page.getByTestId("requests-banner").waitFor();
    assertCondition(
      (await page
        .getByTestId("request-row-transport_367_bars_deployment_preflight")
        .getAttribute("data-request-state")) === "drafted",
      "Deployment BARS preflight should move into drafted posture.",
    );

    await page
      .getByTestId("submit-request-transport_367_mesh_training_mailbox")
      .click();
    await page.getByTestId("requests-banner").waitFor();
    assertCondition(
      (await page.getByTestId("requests-banner").getAttribute("data-action")) ===
        "submitted",
      "Training MESH mailbox should submit within the local rehearsal path.",
    );
    assertCondition(
      (await page
        .getByTestId("request-row-transport_367_mesh_training_mailbox")
        .getAttribute("data-request-state")) === "submitted",
      "Training MESH mailbox should persist the submitted state.",
    );

    assertCondition(
      await page
        .getByTestId("submit-request-transport_367_manual_assisted_local")
        .isDisabled(),
      "Manual assisted local row should remain no-action-required.",
    );

    const evidencePolicy = safeEvidencePolicy();
    await assertSecretSafePage(page, "367-request-page");
    assertCondition(
      externalRequests.size === 0,
      `367 request harness should stay local: ${Array.from(externalRequests).join(", ")}`,
    );
    if (evidencePolicy.recordTraceAfterSecretBoundary) {
      await context.tracing.start({ screenshots: true, snapshots: true });
    }
    await page.screenshot({
      path: outputPath("367-request-transport-sandboxes.png"),
      fullPage: true,
      animations: "disabled",
      caret: "hide",
    });
    if (evidencePolicy.recordTraceAfterSecretBoundary) {
      await context.tracing.stop({
        path: outputPath("367-request-transport-sandboxes-trace.zip"),
      });
    }

    const runtimeStatePath = path.join(
      DEFAULT_RUNTIME_DIR,
      "367_sandbox_request_runtime_state.json",
    );
    assertCondition(
      fs.existsSync(runtimeStatePath),
      "Runtime state should exist after request flow proof.",
    );
    await context.close();
  } finally {
    await browser.close();
    await stopTransportSandboxPortalHarness(server);
  }
}

if (process.argv.includes("--run")) {
  run().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
