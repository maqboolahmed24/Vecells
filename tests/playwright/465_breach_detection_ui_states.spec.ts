import assert from "node:assert/strict";
import path from "node:path";
import {
  OPS_APP_URL,
  OUTPUT_DIR,
  assertNoSensitiveText,
  expectAttribute,
  loadExpectedEvidence,
  withLoadSoakOpsBrowser,
  writeAccessibilitySnapshot,
} from "./465_load_soak.helpers";

const screenshotStates = [
  ["normal", "normal", "executable", "465-breach-normal.png"],
  ["settlement-pending", "settlement_pending", "observe_only", "465-breach-elevated.png"],
  ["blocked", "blocked", "blocked", "465-breach-critical.png"],
  ["stale", "stale", "stale_reacquire", "465-breach-stale.png"],
  ["degraded", "degraded", "handoff_required", "465-breach-degraded.png"],
  ["quarantined", "quarantined", "read_only_recovery", "465-breach-projection-quarantined.png"],
] as const;

export async function run(): Promise<void> {
  const evidence = loadExpectedEvidence();
  assert.equal(evidence.alertFlappingGapClosed, true, "Expected breach evidence lost hysteresis.");
  assert(
    evidence.scenarioOutcomes.some(
      (outcome: { breachRisk: { maxLevel: string } }) => outcome.breachRisk.maxLevel === "critical",
    ),
    "Expected breach evidence lost critical coverage.",
  );

  await withLoadSoakOpsBrowser(
    async (page) => {
      const root = page.locator("[data-testid='ops-shell-root']");
      for (const [queryState, expectedState, expectedPosture, screenshotName] of screenshotStates) {
        await page.goto(`${OPS_APP_URL}/ops/queues?state=${queryState}`, {
          waitUntil: "networkidle",
        });
        await root.waitFor();
        await expectAttribute(root, "data-current-path", "/ops/queues");
        await expectAttribute(root, "data-allocation-route-state", expectedState);
        await expectAttribute(root, "data-action-eligibility-state", expectedPosture);
        await page.locator("[data-testid='action-eligibility-state']").waitFor();
        if (["stale", "quarantined", "degraded", "blocked"].includes(expectedState)) {
          assert.notEqual(
            await root.getAttribute("data-action-eligibility-state"),
            "executable",
            `${expectedState} incorrectly showed live executable posture.`,
          );
        }
        await page.screenshot({
          path: path.join(OUTPUT_DIR, screenshotName),
          fullPage: true,
        });
      }

      await page.goto(`${OPS_APP_URL}/ops/queues?state=normal`, { waitUntil: "networkidle" });
      await root.waitFor();
      await page.locator("[data-testid='ops-delta-stale']").click();
      await expectAttribute(root, "data-action-eligibility-state", "stale_reacquire");
      await expectAttribute(root, "data-workbench-state", "frozen");

      const aria = await writeAccessibilitySnapshot(page, "465-breach-ui-aria.json");
      assert(
        aria.includes("Action eligibility"),
        "ARIA snapshot lost action eligibility announcement.",
      );
      assert(aria.includes("InterventionWorkbench"), "ARIA snapshot lost workbench.");
      await assertNoSensitiveText(page.locator("body"), "breach detection UI states");
    },
    { viewport: { width: 1280, height: 980 }, reducedMotion: true },
  );
}

if (process.argv.includes("--run")) {
  run().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
