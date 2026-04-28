import path from "node:path";
import {
  OPS_APP_URL,
  OUTPUT_DIR,
  assertNoRawLivePayload,
  expectAttribute,
  withLiveProjectionBrowser,
} from "./464_live_projection.helpers";

export async function runLiveDeltaGateAndStaleStateSuite() {
  await withLiveProjectionBrowser(
    async (page) => {
      await page.goto(`${OPS_APP_URL}/ops/overview?liveState=delta-gate-open`, {
        waitUntil: "networkidle",
      });
      const root = page.locator("[data-testid='ops-shell-root']");
      const strip = page.locator("[data-testid='phase9-live-projection-gateway-strip']");
      await root.waitFor();
      await strip.waitFor();
      await expectAttribute(root, "data-layout-mode", "mission_stack");
      await expectAttribute(strip, "data-live-gateway-state", "delta_gate_open");
      await expectAttribute(strip, "data-delta-gate-state", "queued");
      await expectAttribute(
        page.locator("[data-testid='phase9-live-surface-row-operations_overview']"),
        "data-patch-state",
        "buffered",
      );
      await expectAttribute(
        page.locator("[data-testid='phase9-live-surface-row-operations_overview']"),
        "data-selected-anchor-preserved",
        "true",
      );

      await page.goto(`${OPS_APP_URL}/ops/incidents?liveState=quarantined-incident-producer`, {
        waitUntil: "networkidle",
      });
      await expectAttribute(root, "data-current-path", "/ops/incidents");
      await expectAttribute(strip, "data-live-channel-state", "quarantined");
      await expectAttribute(
        page.locator("[data-testid='phase9-live-surface-row-incident_desk']"),
        "data-projection-state",
        "quarantined",
      );
      await expectAttribute(
        page.locator("[data-testid='phase9-live-surface-row-records_governance']"),
        "data-projection-state",
        "current",
      );
      await expectAttribute(
        page.locator("[data-testid='phase9-live-surface-row-conformance_scorecard']"),
        "data-projection-state",
        "current",
      );
      await assertNoRawLivePayload(strip, "quarantined live projection strip");
      await page.screenshot({
        path: path.join(OUTPUT_DIR, "live-projection-quarantine-mission-stack.png"),
        fullPage: true,
      });
    },
    { viewport: { width: 760, height: 1080 }, reducedMotion: true },
  );
}

if (
  process.argv.includes("--run") &&
  process.argv[1]?.endsWith("464_live_delta_gate_and_stale_state.spec.ts")
) {
  await runLiveDeltaGateAndStaleStateSuite();
}
