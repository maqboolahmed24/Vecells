import fs from "node:fs";
import path from "node:path";

import {
  prepareOperatorSubmissionBundle,
  resetTransportSandboxRuntime,
  transitionSandboxRequestState,
} from "../../scripts/pharmacy/367_update_record_transport_sandbox_lib.ts";
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
  await resetTransportSandboxRuntime(DEFAULT_RUNTIME_DIR);
  await prepareOperatorSubmissionBundle({
    outputDir: DEFAULT_RUNTIME_DIR,
    requestIds: [
      "update_record_367_integration_pairing",
      "transport_367_mesh_training_mailbox",
      "transport_367_nhsmail_deployment_safetynet",
    ],
  });
  await transitionSandboxRequestState({
    requestId: "transport_367_mesh_training_mailbox",
    action: "submit_request",
    outputDir: DEFAULT_RUNTIME_DIR,
  });

  const playwright = await importPlaywright();
  const { server, baseUrl } = await startTransportSandboxPortalHarness(
    DEFAULT_RUNTIME_DIR,
    { preserveExistingState: true },
  );
  const browser = await playwright.chromium.launch({ headless: true });

  try {
    const context = await browser.newContext({
      viewport: { width: 1400, height: 1000 },
      locale: "en-GB",
      timezoneId: "Europe/London",
    });
    const page = await context.newPage();
    const externalRequests = new Set<string>();
    trackExternalRequests(page, baseUrl, externalRequests);

    await loginToTransportSandboxPortal(page, baseUrl);
    await page.getByTestId("nav-status").click();
    await page.getByTestId("verification-env-training_candidate").waitFor();

    assertCondition(
      (await page
        .getByTestId("verification-request-transport_367_mesh_training_mailbox")
        .innerText())
        .toLowerCase()
        .includes("request_state:submitted"),
      "Training MESH mailbox should remain submitted in the status evidence.",
    );
    assertCondition(
      (await page
        .getByTestId("verification-request-transport_367_nhsmail_deployment_safetynet")
        .innerText())
        .toLowerCase()
        .includes("purpose:urgent_return_safety_net"),
      "Urgent-return mailbox must stay explicit on the verification page.",
    );
    assertCondition(
      (await page
        .getByTestId("verification-request-update_record_367_deployment_observation")
        .innerText())
        .toLowerCase()
        .includes("consultation_summary_only"),
      "Blocked deployment Update Record row must remain consultation-summary only.",
    );

    const summaryPath = path.join(
      DEFAULT_RUNTIME_DIR,
      "367_sandbox_readiness_summary.json",
    );
    assertCondition(fs.existsSync(summaryPath), "Readiness summary JSON should be written.");
    const summary = JSON.parse(fs.readFileSync(summaryPath, "utf8")) as {
      transportChecks: Array<{ requestId: string; requestState: string }>;
      byEnvironment: Array<{ environmentId: string; submittedOrAwaitingCount: number }>;
    };
    assertCondition(
      summary.transportChecks.some(
        (entry) =>
          entry.requestId === "transport_367_mesh_training_mailbox" &&
          entry.requestState === "submitted",
      ),
      "Readiness summary should capture the submitted training MESH request.",
    );
    assertCondition(
      summary.byEnvironment.some(
        (entry) =>
          entry.environmentId === "deployment_candidate" &&
          entry.submittedOrAwaitingCount >= 1,
      ),
      "Deployment candidate should keep at least one submitted or awaiting row.",
    );

    const evidencePolicy = safeEvidencePolicy();
    await assertSecretSafePage(page, "367-status-page");
    assertCondition(
      externalRequests.size === 0,
      `367 status harness should stay local: ${Array.from(externalRequests).join(", ")}`,
    );
    if (evidencePolicy.recordTraceAfterSecretBoundary) {
      await context.tracing.start({ screenshots: true, snapshots: true });
    }
    await page.screenshot({
      path: outputPath("367-transport-sandbox-status.png"),
      fullPage: true,
      animations: "disabled",
      caret: "hide",
    });
    if (evidencePolicy.recordTraceAfterSecretBoundary) {
      await context.tracing.stop({
        path: outputPath("367-transport-sandbox-status-trace.zip"),
      });
    }
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
