import path from "node:path";

import {
  assertCondition,
  DEFAULT_RUNTIME_DIR,
  importPlaywright,
  loginToDirectoryDispatchPortal,
  outputPath,
  startDirectoryDispatchPortalHarness,
  stopDirectoryDispatchPortalHarness,
  trackExternalRequests,
} from "./366_portal.helpers.ts";
import {
  assertSecretSafePage,
  safeEvidencePolicy,
} from "./366_redaction_helpers.ts";

export async function run(): Promise<void> {
  const playwright = await importPlaywright();
  const outputDir = path.join(
    process.cwd(),
    "output",
    "playwright",
    "366-credential-portal-state-configure",
  );
  const { server, baseUrl } = await startDirectoryDispatchPortalHarness(
    outputDir,
  );
  const browser = await playwright.chromium.launch({ headless: true });

  try {
    const devContext = await browser.newContext({
      viewport: { width: 1440, height: 1080 },
      locale: "en-GB",
      timezoneId: "Europe/London",
    });
    const devPage = await devContext.newPage();
    const externalRequests = new Set<string>();
    trackExternalRequests(devPage, baseUrl, externalRequests);

    await loginToDirectoryDispatchPortal(devPage, baseUrl);
    await devPage.getByTestId("directory-row-source_366_dohs_dev_riverside").waitFor();

    assertCondition(
      (await devPage
        .getByTestId("directory-row-source_366_dohs_dev_riverside")
        .getAttribute("data-configured-state")) === "manifest_ready",
      "Development DoHS row should begin in manifest_ready posture.",
    );
    assertCondition(
      (await devPage
        .getByTestId("dispatch-row-binding_366_bars_dev_riverside")
        .count()) === 0,
      "Dispatch rows should not render on the directory page.",
    );

    await assertSecretSafePage(devPage, "configure-directory-before-apply");

    await devPage
      .getByTestId("configure-directory-source_366_dohs_dev_riverside")
      .click();
    await devPage
      .getByTestId("directory-row-source_366_dohs_dev_riverside")
      .waitFor();
    assertCondition(
      (await devPage
        .getByTestId("directory-row-source_366_dohs_dev_riverside")
        .getAttribute("data-configured-state")) === "current",
      "Development DoHS row should converge to current after apply.",
    );

    await devPage.getByTestId("nav-dispatch").click();
    await devPage.getByTestId("dispatch-row-binding_366_bars_dev_riverside").waitFor();
    assertCondition(
      (await devPage
        .getByTestId("dispatch-row-binding_366_bars_dev_riverside")
        .getAttribute("data-configured-state")) === "manifest_ready",
      "Development BARS binding should begin in manifest_ready posture.",
    );
    await devPage
      .getByTestId("configure-dispatch-binding_366_bars_dev_riverside")
      .click();
    await devPage
      .getByTestId("dispatch-row-binding_366_bars_dev_riverside")
      .waitFor();
    assertCondition(
      (await devPage
        .getByTestId("dispatch-row-binding_366_bars_dev_riverside")
        .getAttribute("data-configured-state")) === "current",
      "Development BARS binding should converge to current after apply.",
    );

    const evidencePolicy = safeEvidencePolicy();
    if (evidencePolicy.recordTraceAfterSecretBoundary) {
      await devContext.tracing.start({ screenshots: true, snapshots: true });
    }
    await devPage.getByTestId("nav-verification").click();
    await devPage.getByTestId("verification-env-development_local_twin").waitFor();
    await assertSecretSafePage(devPage, "configure-verification-after-apply");
    assertCondition(
      (await devPage.content()).includes("secret://") === false,
      "Configured portal should not render raw secret locators.",
    );
    assertCondition(
      externalRequests.size === 0,
      `Configure harness should stay local: ${Array.from(externalRequests).join(", ")}`,
    );
    await devPage.screenshot({
      path: outputPath("366-directory-dispatch-setup.png"),
      fullPage: true,
      animations: "disabled",
      caret: "hide",
    });
    if (evidencePolicy.recordTraceAfterSecretBoundary) {
      await devContext.tracing.stop({
        path: outputPath("366-directory-dispatch-setup-trace.zip"),
      });
    }
    await devContext.close();

    const trainingContext = await browser.newContext({
      viewport: { width: 1280, height: 960 },
      locale: "en-GB",
      timezoneId: "Europe/London",
    });
    const trainingPage = await trainingContext.newPage();
    await loginToDirectoryDispatchPortal(trainingPage, baseUrl);
    await trainingPage.getByTestId("directory-row-source_366_eps_training_hilltop_legacy").waitFor();
    assertCondition(
      (await trainingPage
        .getByTestId("directory-row-source_366_eps_training_hilltop_legacy")
        .getAttribute("data-configured-state")) === "manual_bridge_required" ||
        (await trainingPage
          .getByTestId("directory-row-source_366_eps_training_hilltop_legacy")
          .getAttribute("data-configured-state")) === "preflight_only",
      "Legacy training row should stay manual bridge or preflight only.",
    );
    await trainingPage.getByTestId("nav-dispatch").click();
    await trainingPage.getByTestId("dispatch-row-binding_366_mesh_training_hilltop").waitFor();
    assertCondition(
      await trainingPage
        .getByTestId("configure-dispatch-binding_366_mesh_training_hilltop")
        .isDisabled(),
      "Training MESH binding must remain operator-gated.",
    );
    await assertSecretSafePage(trainingPage, "training-manual-bridge-view");
    await trainingContext.close();
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
