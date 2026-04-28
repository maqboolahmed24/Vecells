import assert from "node:assert/strict";
import path from "node:path";
import {
  OPS_APP_URL,
  OUTPUT_DIR,
  assertNoSensitiveSnapshot,
  assertNoSensitiveText,
  expectAttribute,
  load468Evidence,
  waitForResilienceSurfaces,
  withResilienceBrowser,
  writeAccessibilitySnapshot,
} from "./468_resilience.helpers";

export async function run(): Promise<void> {
  const evidence = load468Evidence();
  assert.equal(evidence.coverage.recoveryPackAdmissibilityAndGraphWriteback, true);
  assert.equal(evidence.coverage.recoveryArtifactPresentationAndOutboundGrant, true);
  for (const artifact of evidence.artifactPresentationCases) {
    assert.equal(artifact.summaryFirst, true);
    assert.equal(artifact.graphBound, true);
    assert.equal(artifact.rawObjectStoreUrlExposed, false);
  }

  await withResilienceBrowser("468-resilience-artifact-presentation", async (page) => {
    await page.goto(`${OPS_APP_URL}/ops/resilience?state=normal`, { waitUntil: "networkidle" });
    await waitForResilienceSurfaces(page);
    const artifactStage = page.locator("[data-surface='recovery-artifact-stage']");
    await expectAttribute(artifactStage, "data-artifact-state", "external_handoff_ready");
    const artifactText = await artifactStage.innerText();
    assert(artifactText.includes("APC_453_"), "ArtifactPresentationContract ref missing.");
    assert(artifactText.includes("ATS_453_"), "artifact transfer settlement ref missing.");
    assert(artifactText.includes("AFD_453_"), "artifact fallback disposition ref missing.");
    assert(artifactText.includes("ONG_453_"), "outbound navigation grant ref missing.");
    assert(artifactText.includes("graphhash-453-"), "graph hash missing from artifact stage.");
    await assertNoSensitiveText(artifactStage, "normal recovery artifact");
    await page.screenshot({
      path: path.join(OUTPUT_DIR, "468-artifact-exact.png"),
      fullPage: true,
    });

    await page.goto(`${OPS_APP_URL}/ops/resilience?state=stale`, { waitUntil: "networkidle" });
    await waitForResilienceSurfaces(page);
    await expectAttribute(artifactStage, "data-artifact-state", "governed_preview");
    assert(
      (await artifactStage.innerText()).includes("transfer is held"),
      "Stale artifact should explain held transfer.",
    );
    await page.screenshot({
      path: path.join(OUTPUT_DIR, "468-artifact-stale.png"),
      fullPage: true,
    });

    await page.goto(`${OPS_APP_URL}/ops/resilience?state=blocked`, { waitUntil: "networkidle" });
    await waitForResilienceSurfaces(page);
    await expectAttribute(artifactStage, "data-artifact-state", "summary_only");
    await page.locator("[data-surface='recovery-artifact-stage']").focus();
    await page.keyboard.press("Tab");
    assert(
      (await page.evaluate(() => document.activeElement?.tagName ?? "")).length > 0,
      "Keyboard focus disappeared while reviewing recovery artifact stage.",
    );
    await page.screenshot({
      path: path.join(OUTPUT_DIR, "468-artifact-blocked.png"),
      fullPage: true,
    });

    const aria = await writeAccessibilitySnapshot(page, "468-resilience-artifact.aria.yml");
    assert(aria.includes("Recovery evidence artifact"), "ARIA snapshot lost artifact stage.");
    assert(aria.includes("RecoveryControlPosture"), "ARIA snapshot lost recovery posture.");
    assertNoSensitiveSnapshot(aria, "recovery artifact");
    await assertNoSensitiveText(page.locator("body"), "artifact presentation");
  });
}

if (process.argv.includes("--run")) {
  run().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
