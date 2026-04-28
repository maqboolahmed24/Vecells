import path from "node:path";

import {
  bootstrapDirectoryAndDispatchCredentials,
  verifyDirectoryAndDispatchReadiness,
} from "../../scripts/pharmacy/366_directory_dispatch_credentials_lib.ts";
import {
  assertCondition,
  importPlaywright,
  loginToDirectoryDispatchPortal,
  outputPath,
  startDirectoryDispatchPortalHarness,
  stopDirectoryDispatchPortalHarness,
  trackExternalRequests,
} from "./366_portal.helpers.ts";
import { assertSecretSafePage, safeEvidencePolicy } from "./366_redaction_helpers.ts";

export async function run(): Promise<void> {
  const playwright = await importPlaywright();
  const outputDir = path.join(
    process.cwd(),
    "output",
    "playwright",
    "366-credential-portal-state",
  );
  await bootstrapDirectoryAndDispatchCredentials({
    outputDir,
    mode: "apply",
    sourceIds: [
      "source_366_dohs_dev_riverside",
      "source_366_registry_dev_market_square",
    ],
    bindingIds: [
      "binding_366_bars_dev_riverside",
      "binding_366_nhsmail_dev_market_square",
    ],
  });
  const initialSummary = await verifyDirectoryAndDispatchReadiness(outputDir);
  assertCondition(
    initialSummary.byEnvironment.some(
      (entry) =>
        entry.environmentId === "development_local_twin" &&
        entry.readinessState === "verified",
    ),
    "Development local twin should verify before browser proof begins.",
  );

  const { server, baseUrl } = await startDirectoryDispatchPortalHarness(outputDir, {
    preserveExistingState: true,
  });
  const browser = await playwright.chromium.launch({ headless: true });

  try {
    const trainingContext = await browser.newContext({
      viewport: { width: 1440, height: 1080 },
      locale: "en-GB",
      timezoneId: "Europe/London",
    });
    const trainingPage = await trainingContext.newPage();
    const externalRequests = new Set<string>();
    trackExternalRequests(trainingPage, baseUrl, externalRequests);

    await loginToDirectoryDispatchPortal(trainingPage, baseUrl);
    await trainingPage.getByTestId("nav-verification").click();
    await trainingPage.getByTestId("verification-env-development_local_twin").waitFor();

    assertCondition(
      (await trainingPage
        .getByTestId("verification-env-development_local_twin")
        .innerText())
        .toLowerCase()
        .includes("verified"),
      "Development environment should remain verified in browser summary.",
    );
    assertCondition(
      (await trainingPage
        .getByTestId("verification-env-training_candidate")
        .innerText())
        .toLowerCase()
        .includes("manual_bridge_required"),
      "Training environment should remain explicit manual bridge.",
    );
    assertCondition(
      (await trainingPage
        .getByTestId("verification-source-source_366_eps_training_hilltop_legacy")
        .innerText())
        .includes("legacy_compatibility_only"),
      "Legacy training source should stay explicit compatibility only.",
    );
    assertCondition(
      (await trainingPage
        .getByTestId("verification-dispatch-binding_366_supplier_integration_hilltop")
        .innerText())
        .includes("manual_bridge_required"),
      "Supplier interop integration binding should remain manual bridge.",
    );
    assertCondition(
      (await trainingPage.content()).includes("secret://") === false,
      "Verification page must not render raw secret locators.",
    );
    await assertSecretSafePage(trainingPage, "verification-page");
    assertCondition(
      externalRequests.size === 0,
      `Verification harness should stay local: ${Array.from(externalRequests).join(", ")}`,
    );
    const evidencePolicy = safeEvidencePolicy();
    if (evidencePolicy.recordTraceAfterSecretBoundary) {
      await trainingContext.tracing.start({ screenshots: true, snapshots: true });
    }
    await trainingPage.screenshot({
      path: outputPath("366-directory-dispatch-readiness.png"),
      fullPage: true,
      animations: "disabled",
      caret: "hide",
    });
    if (evidencePolicy.recordTraceAfterSecretBoundary) {
      await trainingContext.tracing.stop({
        path: outputPath("366-directory-dispatch-readiness-trace.zip"),
      });
    }
    await trainingContext.close();

    const deploymentContext = await browser.newContext({
      viewport: { width: 1200, height: 860 },
      locale: "en-GB",
      timezoneId: "Europe/London",
    });
    const deploymentPage = await deploymentContext.newPage();
    await loginToDirectoryDispatchPortal(deploymentPage, baseUrl);
    await deploymentPage.getByTestId("nav-verification").click();
    await deploymentPage.getByTestId("verification-env-deployment_candidate").waitFor();
    assertCondition(
      (await deploymentPage
        .getByTestId("verification-env-deployment_candidate")
        .innerText())
        .toLowerCase()
        .includes("preflight_only"),
      "Deployment candidate should remain preflight only.",
    );
    await assertSecretSafePage(deploymentPage, "deployment-verification-page");
    await deploymentContext.close();
  } finally {
    await browser.close();
    await stopDirectoryDispatchPortalHarness(server);
  }
}

if (process.argv.includes("--run")) {
  run().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
