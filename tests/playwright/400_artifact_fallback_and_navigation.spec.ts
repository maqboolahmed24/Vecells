import {
  assertCondition,
  assertNoHorizontalOverflow,
  clickPrimary,
  embeddedRecoveryUrl,
  importPlaywright,
  openEmbeddedRecovery,
  outputPath,
  startPatientWeb,
  stopPatientWeb,
} from "./393_embedded_recovery.helpers.ts";
import { makeBridgeFixture, makeGrant } from "./381_nhs_app_bridge.helpers.ts";

export async function run(): Promise<void> {
  const playwright = await importPlaywright();
  if (!playwright) return;

  const server = await startPatientWeb();
  const browser = await playwright.chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    locale: "en-GB",
    timezoneId: "Europe/London",
    userAgent:
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 nhsapp-ios/2.0.0",
  });
  await context.tracing.start({ screenshots: true, snapshots: true });
  const page = await context.newPage();

  try {
    await openEmbeddedRecovery(
      page,
      embeddedRecoveryUrl(server.baseUrl, {
        journeyRef: "ART-400",
        view: "artifact-summary",
        query: "fixture=artifact-summary",
      }),
    );
    await page.getByTestId("EmbeddedArtifactSummarySurface").waitFor();
    assertCondition(
      (await page
        .getByTestId("EmbeddedRecoveryArtifactFrame")
        .getAttribute("data-artifact-mode")) === "structured_summary",
      "artifact did not render summary first",
    );
    await clickPrimary(page);
    await page.getByTestId("EmbeddedArtifactPreviewFrame").waitFor();
    assertCondition(
      (await page.getByTestId("EmbeddedRecoveryArtifactFrame").getAttribute("data-route-key")) ===
        "artifact_preview",
      "artifact preview did not open in shell",
    );
    await clickPrimary(page);
    await page.getByTestId("EmbeddedDownloadProgressCard").waitFor();
    assertCondition(
      (await page
        .getByTestId("EmbeddedDownloadProgressCard")
        .getAttribute("data-transfer-state")) === "in_progress",
      "byte transfer posture did not show in progress",
    );

    await openEmbeddedRecovery(
      page,
      embeddedRecoveryUrl(server.baseUrl, {
        journeyRef: "ART-400",
        view: "artifact-fallback",
        query: "fixture=artifact-fallback",
      }),
    );
    await page.getByTestId("EmbeddedArtifactFallbackPanel").waitFor();
    assertCondition(
      (await page
        .getByTestId("EmbeddedArtifactFallbackPanel")
        .getAttribute("data-fallback-state")) === "secure_send_later",
      "artifact fallback should be secure send later",
    );
    await clickPrimary(page);
    await page.getByTestId("EmbeddedReturnSafeRecoveryFrame").waitFor();

    await openEmbeddedRecovery(
      page,
      embeddedRecoveryUrl(server.baseUrl, {
        journeyRef: "FRZ-400",
        view: "route-freeze",
        query: "fixture=route-freeze",
      }),
    );
    await page.getByTestId("EmbeddedRouteFreezeNotice").waitFor();
    assertCondition(
      (await page
        .getByTestId("EmbeddedRecoveryArtifactFrame")
        .getAttribute("data-route-freeze-state")) === "frozen",
      "route freeze did not stay in same-shell notice",
    );

    await openEmbeddedRecovery(
      page,
      embeddedRecoveryUrl(server.baseUrl, {
        journeyRef: "UNS-400",
        view: "unsupported-action",
        query: "fixture=unsupported-action",
      }),
    );
    await page.getByTestId("EmbeddedUnsupportedActionView").waitFor();
    assertCondition(
      (await page
        .getByTestId("EmbeddedRecoveryArtifactFrame")
        .getAttribute("data-actionability")) !== "blocked",
      "unsupported action left a dead end",
    );

    const { bridge } = makeBridgeFixture({ platform: "ios" });
    const grant = makeGrant(bridge, {
      destinationClass: "external_browser",
      scrubbedUrlRef: "https://www.nhs.uk/conditions/",
      allowedHostRef: "www.nhs.uk",
      allowedPathPattern: "/conditions/*",
    });
    assertCondition(
      bridge.openExternal("https://www.nhs.uk/conditions/", grant).ok,
      "scrubbed allowlisted external URL should open",
    );
    assertCondition(
      bridge.openExternal("https://www.nhs.uk/conditions/?token=raw", {
        ...grant,
        scrubbedUrlRef: "https://www.nhs.uk/conditions/?token=raw",
      }).blockedReason === "destination_not_scrubbed",
      "PHI-bearing outbound URL was not blocked",
    );
    assertCondition(
      bridge.openExternal("https://www.nhs.uk/conditions/", {
        ...grant,
        manifestVersionRef: "nhsapp-manifest-drifted",
      }).blockedReason === "outbound_navigation_manifest_mismatch",
      "mismatched outbound grant did not fail closed",
    );

    await assertNoHorizontalOverflow(page, "400 artifact fallback navigation");
    await context.tracing.stop({ path: outputPath("400-artifact-fallback-navigation-trace.zip") });
  } finally {
    await context.close();
    await browser.close();
    await stopPatientWeb(server.child);
  }
}

if (process.argv.includes("--run")) {
  run().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
