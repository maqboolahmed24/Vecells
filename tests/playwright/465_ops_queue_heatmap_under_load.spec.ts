import assert from "node:assert/strict";
import path from "node:path";
import {
  OPS_APP_URL,
  OUTPUT_DIR,
  assertNoSensitiveText,
  expectAttribute,
  loadExpectedHeatmap,
  withLoadSoakOpsBrowser,
  writeAccessibilitySnapshot,
} from "./465_load_soak.helpers";

async function rowOrder(page: any): Promise<readonly string[]> {
  return await page
    .locator("[data-surface='bottleneck-radar-row']")
    .evaluateAll((nodes: Element[]) => nodes.map((node) => node.getAttribute("data-entity-ref")));
}

export async function run(): Promise<void> {
  const heatmap = loadExpectedHeatmap();
  await withLoadSoakOpsBrowser(async (page) => {
    await page.goto(`${OPS_APP_URL}/ops/queues?state=normal`, { waitUntil: "networkidle" });
    const root = page.locator("[data-testid='ops-shell-root']");
    await root.waitFor();
    await expectAttribute(root, "data-current-path", "/ops/queues");
    await expectAttribute(root, "data-action-eligibility-state", "executable");

    await page.locator("[data-testid='north-star-band']").waitFor();
    await page.locator("[data-surface='bottleneck-radar']").waitFor();
    await page.locator("[data-testid='ops-capacity-allocator']").waitFor();
    await page.locator("[data-testid='ops-cohort-impact-matrix']").waitFor();
    assert.equal(await page.locator("[data-surface='bottleneck-radar-row']").count(), 5);
    assert.equal(
      await page.locator("[data-testid='ops-cohort-impact-matrix'] tbody tr").count(),
      4,
    );
    assert.equal(
      await page.locator("[data-testid='ops-cohort-impact-matrix'] .ops-cohort-grid__cell").count(),
      await page.locator("[data-testid='ops-cohort-impact-matrix'] tbody tr").count(),
      "Cohort heatmap visual/table parity drifted under load fixtures.",
    );
    assert.equal(
      heatmap.allCellsHaveTableParity,
      true,
      "Expected heatmap fixture lost visual/table parity.",
    );
    assert(
      heatmap.cells.some(
        (cell: { pathway: string; breachRiskBand: string }) =>
          cell.pathway === "booking" && cell.breachRiskBand === "critical",
      ),
      "Load heatmap fixture lost critical booking pressure coverage.",
    );

    const beforeOrder = await rowOrder(page);
    const priorityRow = page.locator(
      "[data-surface='bottleneck-radar-row'][data-entity-ref='ops-route-07']",
    );
    await priorityRow.focus();
    await page.keyboard.press("Enter");
    await expectAttribute(root, "data-selected-anomaly-id", "ops-route-07");
    assert.deepEqual(
      await rowOrder(page),
      beforeOrder,
      "Keyboard selection reordered queue ranks.",
    );
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");
    assert(
      (await page.evaluate(() => document.activeElement?.tagName ?? "")).length > 0,
      "Keyboard navigation lost focus under load.",
    );

    await page.locator("[data-testid='ops-delta-buffered']").click();
    await expectAttribute(root, "data-delta-gate", "buffered");
    assert.deepEqual(
      await rowOrder(page),
      beforeOrder,
      "Buffered updates changed deterministic rank order.",
    );
    await page.screenshot({
      path: path.join(OUTPUT_DIR, "465-queue-heatmap-normal-under-load.png"),
      fullPage: true,
    });

    await page.goto(`${OPS_APP_URL}/ops/queues?state=stale`, { waitUntil: "networkidle" });
    await root.waitFor();
    await expectAttribute(root, "data-allocation-route-state", "stale");
    await expectAttribute(root, "data-action-eligibility-state", "stale_reacquire");
    await page.screenshot({
      path: path.join(OUTPUT_DIR, "465-queue-heatmap-stale-under-load.png"),
      fullPage: true,
    });

    await page.goto(`${OPS_APP_URL}/ops/queues?state=quarantined`, { waitUntil: "networkidle" });
    await root.waitFor();
    await expectAttribute(root, "data-allocation-route-state", "quarantined");
    await expectAttribute(root, "data-action-eligibility-state", "read_only_recovery");
    await page.screenshot({
      path: path.join(OUTPUT_DIR, "465-queue-heatmap-projection-quarantined.png"),
      fullPage: true,
    });

    await page.setViewportSize({ width: 390, height: 920 });
    await page.goto(`${OPS_APP_URL}/ops/queues?state=degraded`, { waitUntil: "networkidle" });
    await expectAttribute(root, "data-layout-mode", "mission_stack");
    await expectAttribute(root, "data-allocation-route-state", "degraded");
    await expectAttribute(root, "data-action-eligibility-state", "handoff_required");
    await page.screenshot({
      path: path.join(OUTPUT_DIR, "465-queue-heatmap-degraded-mission-stack.png"),
      fullPage: true,
    });

    const aria = await writeAccessibilitySnapshot(page, "465-queue-heatmap-aria.json");
    assert(aria.includes("CohortImpactMatrix"), "ARIA snapshot lost CohortImpactMatrix.");
    assert(aria.includes("BottleneckRadar"), "ARIA snapshot lost BottleneckRadar.");
    await assertNoSensitiveText(page.locator("body"), "ops queue heatmap under load");
  });
}

if (process.argv.includes("--run")) {
  run().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
