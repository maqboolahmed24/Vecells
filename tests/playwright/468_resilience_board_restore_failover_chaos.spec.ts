import assert from "node:assert/strict";
import path from "node:path";
import {
  OPS_APP_URL,
  OUTPUT_DIR,
  assertNoSensitiveText,
  expectAttribute,
  load468Evidence,
  waitForResilienceSurfaces,
  withResilienceBrowser,
} from "./468_resilience.helpers";

const screenshotCases = [
  ["normal", "exact", "live_control", "live", "published", "current", "applied"],
  ["stale", "stale", "diagnostic_only", "diagnostic_only", "stale", "stale", "stale_scope"],
  ["blocked", "blocked", "blocked", "blocked", "rehearsal_required", "missing", "blocked_readiness"],
  ["freeze", "recovery-only", "governed_recovery", "recovery_only", "published", "current", "frozen"],
  [
    "degraded",
    "guardrail-constrained",
    "diagnostic_only",
    "diagnostic_only",
    "published",
    "current",
    "blocked_trust",
  ],
  [
    "quarantined",
    "quarantined",
    "blocked",
    "blocked",
    "withdrawn",
    "missing",
    "blocked_guardrail",
  ],
] as const;

export async function run(): Promise<void> {
  const evidence = load468Evidence();
  assert.equal(evidence.coverage.cleanEnvironmentRestoreIncludesDependencyAndJourneyValidation, true);
  assert.equal(evidence.coverage.failoverActivationValidationStandDownSettlement, true);
  assert.equal(evidence.coverage.chaosGuardrailsAndBlastRadius, true);

  await withResilienceBrowser("468-resilience-board-restore-failover-chaos", async (page) => {
    for (const [
      scenarioState,
      screenshotName,
      controlState,
      bindingState,
      runbookState,
      backupState,
      settlementResult,
    ] of screenshotCases) {
      await page.goto(`${OPS_APP_URL}/ops/resilience?state=${scenarioState}`, {
        waitUntil: "networkidle",
      });
      await waitForResilienceSurfaces(page);
      const root = page.locator("[data-testid='ops-shell-root']");
      const board = page.locator("[data-surface='resilience-board']");
      await expectAttribute(root, "data-current-path", "/ops/resilience");
      await expectAttribute(root, "data-resilience-control-state", controlState);
      await expectAttribute(root, "data-resilience-binding-state", bindingState);
      await expectAttribute(root, "data-resilience-settlement-result", settlementResult);
      await expectAttribute(board, "data-resilience-state", controlState);
      await expectAttribute(board, "data-binding-state", bindingState);
      await expectAttribute(board, "data-runbook-state", runbookState);
      await expectAttribute(board, "data-backup-state", backupState);
      await expectAttribute(board, "data-settlement-result", settlementResult);
      assert.equal(await page.locator("[data-surface='essential-function-map'] button").count(), 10);
      assert.equal(await page.locator("[data-surface='dependency-restore-bands'] tbody tr").count(), 10);
      assert.equal(await page.locator("[data-surface='recovery-action-rail'] button").count(), 10);
      if (controlState === "blocked" || controlState === "diagnostic_only") {
        assert.equal(
          await page.locator("[data-surface='recovery-action-rail'] button:not(:disabled)").count(),
          0,
        );
      }
      await assertNoSensitiveText(page.locator("body"), `resilience board ${scenarioState}`);
      await page.screenshot({
        path: path.join(OUTPUT_DIR, `468-${screenshotName}.png`),
        fullPage: true,
      });
    }

    await page.goto(`${OPS_APP_URL}/ops/resilience?state=normal`, { waitUntil: "networkidle" });
    await waitForResilienceSurfaces(page);
    const board = page.locator("[data-surface='resilience-board']");
    await page.locator("[data-testid='resilience-node-pharmacy_referral_loop']").focus();
    await page.keyboard.press("Enter");
    await expectAttribute(board, "data-selected-function", "pharmacy_referral_loop");
    await page.locator("[data-testid='resilience-action-restore_start']").focus();
    await page.keyboard.press("Space");
    await expectAttribute(
      page.locator("[data-testid='resilience-action-restore_start']"),
      "data-action-allowed",
      "true",
    );
    await expectAttribute(
      page.locator("[data-testid='resilience-action-failover_activate']"),
      "data-action-allowed",
      "true",
    );
    await expectAttribute(
      page.locator("[data-testid='resilience-action-chaos_start']"),
      "data-action-allowed",
      "true",
    );
  });
}

if (process.argv.includes("--run")) {
  run().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
