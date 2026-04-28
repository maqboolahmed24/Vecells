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

export async function run(): Promise<void> {
  const playwright = await importPlaywright();
  if (!playwright) return;

  const server = await startPatientWeb();
  const browser = await playwright.chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 430, height: 860 }, locale: "en-GB" });
  const page = await context.newPage();

  try {
    await openEmbeddedRecovery(
      page,
      embeddedRecoveryUrl(server.baseUrl, { view: "artifact-summary", query: "fixture=artifact-summary" }),
    );
    await page.getByTestId("EmbeddedArtifactSummarySurface").waitFor();
    assertCondition(
      (await page.getByTestId("EmbeddedRecoveryArtifactFrame").getAttribute("data-artifact-mode")) ===
        "structured_summary",
      "artifact summary should be structured summary",
    );
    await clickPrimary(page);
    await page.getByTestId("EmbeddedArtifactPreviewFrame").waitFor();
    assertCondition(
      (await page.getByTestId("EmbeddedRecoveryArtifactFrame").getAttribute("data-route-key")) ===
        "artifact_preview",
      "artifact summary primary action should open preview",
    );
    await clickPrimary(page);
    await page.getByTestId("EmbeddedDownloadProgressCard").waitFor();
    assertCondition(
      (await page.getByTestId("EmbeddedDownloadProgressCard").getAttribute("data-transfer-state")) ===
        "in_progress",
      "download progress should show in-progress transfer",
    );

    await context.tracing.start({ screenshots: true, snapshots: true });
    await openEmbeddedRecovery(
      page,
      embeddedRecoveryUrl(server.baseUrl, { view: "artifact-fallback", query: "fixture=artifact-fallback" }),
    );
    await page.getByTestId("EmbeddedArtifactFallbackPanel").waitFor();
    assertCondition(
      (await page.getByTestId("EmbeddedArtifactFallbackPanel").getAttribute("data-fallback-state")) ===
        "secure_send_later",
      "artifact fallback should offer secure send later",
    );
    await clickPrimary(page);
    await page.getByTestId("EmbeddedReturnSafeRecoveryFrame").waitFor();
    await context.tracing.stop({ path: outputPath("393-embedded-recovery-artifact-fallback-trace.zip") });
    await assertNoHorizontalOverflow(page, "embedded recovery artifact and fallback");
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
