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
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    locale: "en-GB",
    userAgent:
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 nhsapp-ios/2.0.0",
  });
  const page = await context.newPage();

  try {
    await context.tracing.start({ screenshots: true, snapshots: true });
    await openEmbeddedRecovery(
      page,
      embeddedRecoveryUrl(server.baseUrl, { view: "expired-link", query: "fixture=expired-link" }),
    );
    await page.getByTestId("EmbeddedExpiredLinkView").waitFor();
    assertCondition(
      (await page.getByTestId("EmbeddedRecoveryArtifactFrame").getAttribute("data-actionability")) ===
        "recovery_required",
      "expired link should require recovery",
    );
    await clickPrimary(page);
    await page.getByTestId("EmbeddedReturnSafeRecoveryFrame").waitFor();
    assertCondition(
      (await page.getByTestId("EmbeddedRecoveryArtifactFrame").getAttribute("data-route-key")) ===
        "return_safe",
      "primary action should open return-safe recovery",
    );
    await context.tracing.stop({ path: outputPath("393-embedded-recovery-return-safe-trace.zip") });

    await openEmbeddedRecovery(
      page,
      embeddedRecoveryUrl(server.baseUrl, { view: "invalid-context", query: "fixture=invalid-context" }),
    );
    await page.getByTestId("EmbeddedInvalidContextView").waitFor();
    assertCondition(
      (await page.getByTestId("EmbeddedLinkRecoveryBanner").getAttribute("data-summary-safety")) ===
        "placeholder_only",
      "invalid context should only show placeholder-safe context",
    );

    await openEmbeddedRecovery(
      page,
      embeddedRecoveryUrl(server.baseUrl, { view: "route-freeze", query: "fixture=route-freeze" }),
    );
    await page.getByTestId("EmbeddedRouteFreezeNotice").waitFor();
    assertCondition(
      (await page.getByTestId("EmbeddedRecoveryArtifactFrame").getAttribute("data-route-freeze-state")) ===
        "frozen",
      "route freeze state missing",
    );

    await openEmbeddedRecovery(
      page,
      embeddedRecoveryUrl(server.baseUrl, { view: "degraded-mode", query: "fixture=degraded-mode" }),
    );
    await page.getByTestId("EmbeddedDegradedModePanel").waitFor();
    assertCondition(
      (await page.getByTestId("EmbeddedRecoveryArtifactFrame").getAttribute("data-degraded-mode-state")) ===
        "summary_only",
      "degraded mode should be summary only",
    );
    await assertNoHorizontalOverflow(page, "embedded recovery link and freeze");
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
