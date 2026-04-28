import {
  assertCondition,
  assertNoHorizontalOverflow,
  embeddedRecoveryUrl,
  importPlaywright,
  openEmbeddedRecovery,
  startPatientWeb,
  stopPatientWeb,
  writeAriaSnapshot,
} from "./393_embedded_recovery.helpers.ts";

export async function run(): Promise<void> {
  const playwright = await importPlaywright();
  if (!playwright) return;

  const server = await startPatientWeb();
  const browser = await playwright.chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    reducedMotion: "reduce",
    locale: "en-GB",
  });
  const page = await context.newPage();

  try {
    await openEmbeddedRecovery(
      page,
      embeddedRecoveryUrl(server.baseUrl, { view: "expired-link", query: "fixture=expired-link" }),
    );
    const recoverySnapshot = await writeAriaSnapshot(
      page.getByTestId("EmbeddedExpiredLinkView"),
      "393-embedded-recovery-expired.aria.yml",
    );
    assertCondition(recoverySnapshot.includes("This link has expired"), "expired ARIA snapshot missing heading");
    assertCondition(recoverySnapshot.includes("Support code"), "expired ARIA snapshot missing support code");

    const actionSnapshot = await writeAriaSnapshot(
      page.getByTestId("EmbeddedRecoveryActionCluster"),
      "393-embedded-recovery-action-cluster.aria.yml",
    );
    assertCondition(actionSnapshot.includes("Open safe summary"), "action ARIA snapshot missing primary action");

    await openEmbeddedRecovery(
      page,
      embeddedRecoveryUrl(server.baseUrl, { view: "artifact-summary", query: "fixture=artifact-summary" }),
    );
    const artifactSnapshot = await writeAriaSnapshot(
      page.getByTestId("EmbeddedArtifactSummarySurface"),
      "393-embedded-recovery-artifact-summary.aria.yml",
    );
    assertCondition(artifactSnapshot.includes("Artifact summary"), "artifact ARIA snapshot missing region label");
    assertCondition(artifactSnapshot.includes("Appointment letter"), "artifact ARIA snapshot missing title");

    await openEmbeddedRecovery(
      page,
      embeddedRecoveryUrl(server.baseUrl, { view: "download-progress", query: "fixture=download-progress" }),
    );
    const progressSnapshot = await writeAriaSnapshot(
      page.getByTestId("EmbeddedDownloadProgressCard"),
      "393-embedded-recovery-progress.aria.yml",
    );
    assertCondition(progressSnapshot.includes("progressbar"), "progress ARIA snapshot missing progressbar");

    const landmarkCount = await page
      .locator("main, header[role='banner'], nav[aria-label], aside[aria-label], section[aria-labelledby]")
      .count();
    assertCondition(landmarkCount >= 5, `expected labelled recovery landmarks, found ${landmarkCount}`);
    assertCondition((await page.locator("main").count()) === 1, "recovery route should expose one main landmark");
    const actionRect = await page.getByTestId("EmbeddedRecoveryActionCluster").evaluate((node: HTMLElement) => {
      const rect = node.getBoundingClientRect();
      return { bottom: rect.bottom, top: rect.top };
    });
    assertCondition(actionRect.bottom <= 844 && actionRect.top >= 0, "sticky recovery actions below viewport");
    await assertNoHorizontalOverflow(page, "embedded recovery accessibility");
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
