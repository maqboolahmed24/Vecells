import assert from "node:assert/strict";
import path from "node:path";
import {
  GOVERNANCE_APP_URL,
  OPS_APP_URL,
  OUTPUT_DIR,
  assertNoRawLivePayload,
  expectAttribute,
  withLiveProjectionBrowser,
  writeAccessibilitySnapshot,
} from "./464_live_projection.helpers";

export async function runCrossSurfaceReturnAfterLiveDriftSuite() {
  await withLiveProjectionBrowser(async (page) => {
    await page.goto(`${GOVERNANCE_APP_URL}/ops/governance/records?liveState=return-token-drift`, {
      waitUntil: "networkidle",
    });
    const governanceRoot = page.locator("[data-testid='governance-shell-root']");
    const governanceStrip = page.locator("[data-testid='phase9-live-projection-gateway-strip']");
    await governanceRoot.waitFor();
    await governanceStrip.waitFor();
    await expectAttribute(governanceRoot, "data-current-path", "/ops/governance/records");
    await expectAttribute(governanceRoot, "data-phase9-live-return-token-state", "partial_restore");
    await expectAttribute(governanceStrip, "data-selected-surface-code", "records_governance");
    await expectAttribute(governanceStrip, "data-live-channel-state", "recovery_only");
    await expectAttribute(governanceStrip, "data-action-settlement-state", "read_only_recovery");
    assert(
      (await page.locator("[data-testid='phase9-live-return-token-panel']").innerText()).includes(
        "read-only",
      ),
      "return-token drift should render read-only recovery copy",
    );
    const snapshot = await writeAccessibilitySnapshot(
      page,
      "live-projection-governance-return.json",
    );
    assert(snapshot.includes("Live projection gateway"));
    await assertNoRawLivePayload(governanceStrip, "governance live projection strip");

    await page.goto(`${OPS_APP_URL}/ops/conformance?liveState=graph-drift`, {
      waitUntil: "networkidle",
    });
    const opsRoot = page.locator("[data-testid='ops-shell-root']");
    const opsStrip = page.locator("[data-testid='phase9-live-projection-gateway-strip']");
    await opsRoot.waitFor();
    await opsStrip.waitFor();
    await expectAttribute(opsRoot, "data-current-path", "/ops/conformance");
    await expectAttribute(opsStrip, "data-selected-surface-code", "conformance_scorecard");
    await expectAttribute(opsStrip, "data-graph-verdict-state", "stale");
    await expectAttribute(opsStrip, "data-action-settlement-state", "stale_reacquire");
    await expectAttribute(opsStrip, "data-raw-event-browser-join-allowed", "false");
    await assertNoRawLivePayload(opsStrip, "conformance live projection strip");
    await page.screenshot({
      path: path.join(OUTPUT_DIR, "live-projection-cross-surface-drift.png"),
      fullPage: true,
    });
  });
}

if (
  process.argv.includes("--run") &&
  process.argv[1]?.endsWith("464_cross_surface_return_after_live_drift.spec.ts")
) {
  await runCrossSurfaceReturnAfterLiveDriftSuite();
}
