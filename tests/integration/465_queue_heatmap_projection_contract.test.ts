import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  LOAD_SOAK_SCENARIOS,
  buildQueueHeatmapProjection,
  runPhase9LoadSoakSuite,
} from "../performance/465_phase9_load_soak_scenarios";

describe("task 465 queue heatmap projection contract", () => {
  it("aggregates by pathway, site, cohort, age, breach risk, and route family", () => {
    const projection = buildQueueHeatmapProjection();
    expect(projection.groupingDimensions).toEqual([
      "pathway",
      "site",
      "cohort",
      "ageBand",
      "breachRiskBand",
      "routeFamily",
    ]);
    expect(projection.cells.length).toBeGreaterThanOrEqual(10);
    expect(projection.cells.every((cell) => cell.dimensionKey.split("|").length === 6)).toBe(true);
    expect(projection.cells.some((cell) => cell.pathway === "pharmacy_loop")).toBe(true);
    expect(projection.cells.some((cell) => cell.pathway === "assistive_layer")).toBe(true);
  });

  it("keeps visual heatmap values and table fallback values in exact parity", () => {
    const projection = buildQueueHeatmapProjection();
    expect(projection.allCellsHaveTableParity).toBe(true);
    for (const cell of projection.cells) {
      expect(cell.visualValue).toBe(cell.tableValue);
      expect(cell.parityExact).toBe(true);
      expect(cell.accessibleSummary).toContain(String(cell.queueDepth));
      expect(cell.accessibleSummary).toContain(cell.breachRiskBand);
    }
    expect(projection.tableFallbackRows.map((row) => row.cellRef)).toEqual(
      projection.cells.map((cell) => cell.cellRef),
    );
  });

  it("keeps deterministic ordering and replay hash stable", () => {
    const first = buildQueueHeatmapProjection();
    const second = buildQueueHeatmapProjection([...LOAD_SOAK_SCENARIOS].reverse());
    expect(first.cells.map((cell) => cell.dimensionKey)).toEqual(
      second.cells.map((cell) => cell.dimensionKey),
    );
    expect(first.deterministicReplayHash).toBe(second.deterministicReplayHash);
    expect(first.cells[0]?.breachRiskBand).toBe("critical");
    expect(first.cells[0]?.sortRank).toBe(1);
  });

  it("records no Sev-1 or Sev-2 load-path defects and closes required gaps", () => {
    const evidence = runPhase9LoadSoakSuite();
    expect(evidence.noSev1OrSev2Defects).toBe(true);
    expect(evidence.throughputOnlyGapClosed).toBe(true);
    expect(evidence.dashboardCalmnessGapClosed).toBe(true);
    expect(evidence.alertFlappingGapClosed).toBe(true);
    expect(evidence.fixtureRealismGapClosed).toBe(true);
    expect(evidence.evidenceGapClosed).toBe(true);
  });

  it("keeps generated expected heatmap outcomes available", () => {
    const root = process.cwd();
    const expectedPath = path.join(
      root,
      "tests/performance/465_queue_heatmap_expected_outcomes.json",
    );
    expect(fs.existsSync(expectedPath)).toBe(true);
    const expected = JSON.parse(fs.readFileSync(expectedPath, "utf8"));
    expect(expected.allCellsHaveTableParity).toBe(true);
    expect(
      expected.cells.every(
        (cell: { sortRank: number }, index: number) => cell.sortRank === index + 1,
      ),
    ).toBe(true);
  });
});
