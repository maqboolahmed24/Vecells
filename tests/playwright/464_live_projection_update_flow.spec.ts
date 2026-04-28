import assert from "node:assert/strict";
import path from "node:path";
import {
  OPS_APP_URL,
  OUTPUT_DIR,
  assertNoRawLivePayload,
  expectAttribute,
  withLiveProjectionBrowser,
} from "./464_live_projection.helpers";

export async function runLiveProjectionUpdateFlowSuite() {
  await withLiveProjectionBrowser(async (page) => {
    await page.goto(`${OPS_APP_URL}/ops/overview?liveState=normal`, { waitUntil: "networkidle" });
    const root = page.locator("[data-testid='ops-shell-root']");
    const strip = page.locator("[data-testid='phase9-live-projection-gateway-strip']");
    await root.waitFor();
    await strip.waitFor();
    await expectAttribute(root, "data-phase9-live-gateway-state", "normal");
    await expectAttribute(strip, "data-selected-surface-code", "operations_overview");
    await expectAttribute(strip, "data-live-channel-state", "current");
    await expectAttribute(strip, "data-raw-event-browser-join-allowed", "false");
    await expectAttribute(strip, "data-raw-domain-event-payload-allowed", "false");

    await page
      .locator("[data-testid='phase9-live-fixture-select']")
      .selectOption("live-fixture-464-assurance-center-graph-drift");
    await page.locator("[data-testid='phase9-live-apply-fixture-action']").click();
    await expectAttribute(strip, "data-live-gateway-state", "graph_drift");
    await expectAttribute(strip, "data-selected-surface-code", "assurance_center");
    await expectAttribute(strip, "data-graph-verdict-state", "stale");
    assert(
      (await page.locator("[data-testid='phase9-live-gateway-status']").innerText())
        .toLowerCase()
        .includes("graph completeness"),
      "gateway status should explain why the live patch changed state",
    );
    await expectAttribute(
      page.locator("[data-testid='phase9-live-surface-row-assurance_center']"),
      "data-selected-anchor-preserved",
      "true",
    );
    await assertNoRawLivePayload(strip, "ops live projection strip");

    await page.goto(`${OPS_APP_URL}/ops/assurance?liveState=graph-drift`, {
      waitUntil: "networkidle",
    });
    await expectAttribute(root, "data-current-path", "/ops/assurance");
    await expectAttribute(root, "data-phase9-live-graph-verdict-state", "stale");
    await expectAttribute(strip, "data-live-channel-state", "stale");
    await expectAttribute(strip, "data-action-settlement-state", "stale_reacquire");
    await page.screenshot({
      path: path.join(OUTPUT_DIR, "live-projection-assurance-graph-drift.png"),
      fullPage: true,
    });
  });
}

if (
  process.argv.includes("--run") &&
  process.argv[1]?.endsWith("464_live_projection_update_flow.spec.ts")
) {
  await runLiveProjectionUpdateFlowSuite();
}
