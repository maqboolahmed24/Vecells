import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  PHASE9_OPERATIONAL_PROJECTION_ENGINE_VERSION,
  createPhase9OperationalProjectionEngineFixture,
  validateDashboardMetricTileContract,
  validateOperationalProjectionEventAdapters,
  type Phase9OperationalProjectionEngineFixture,
} from "../../packages/domains/analytics_assurance/src/index.ts";

const root = path.resolve(__dirname, "..", "..");

function readText(relativePath: string): string {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function readJson<T>(relativePath: string): T {
  return JSON.parse(readText(relativePath)) as T;
}

describe("437 Phase 9 operational projection engine artifacts", () => {
  it("publishes operational projection engine contract and deterministic fixtures", () => {
    const contract = readJson<{
      schemaVersion: string;
      producedObjects: string[];
      projectionInputs: { eventFamily: string; sourceProjection: string }[];
    }>("data/contracts/437_phase9_operational_projection_engine_contract.json");
    const fixture = readJson<Phase9OperationalProjectionEngineFixture>(
      "data/fixtures/437_phase9_operational_projection_engine_fixtures.json",
    );
    const recomputed = createPhase9OperationalProjectionEngineFixture();

    expect(contract.schemaVersion).toBe(PHASE9_OPERATIONAL_PROJECTION_ENGINE_VERSION);
    expect(contract.producedObjects).toEqual(
      expect.arrayContaining([
        "QueueHealthSnapshot",
        "ProjectionHealthSnapshot",
        "LiveBoardDeltaWindow",
      ]),
    );
    expect(contract.projectionInputs).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          eventFamily: "triage_queue",
          sourceProjection: "TriageQueueProjection",
        }),
        expect.objectContaining({
          eventFamily: "communications_delivery_receipt",
          sourceProjection: "PatientCommunicationVisibilityProjection",
        }),
      ]),
    );
    expect(fixture.baselineResult.snapshotHash).toBe(recomputed.baselineResult.snapshotHash);
    expect(fixture.replayHash).toBe(recomputed.replayHash);
  });

  it("records typed adapters for every required projection input", () => {
    const fixture = readJson<Phase9OperationalProjectionEngineFixture>(
      "data/fixtures/437_phase9_operational_projection_engine_fixtures.json",
    );
    const adapterMatrix = readText(
      "data/analysis/437_operational_projection_event_adapter_matrix.csv",
    );

    expect(validateOperationalProjectionEventAdapters(fixture.eventAdapters)).toEqual([]);
    expect(fixture.eventAdapters).toHaveLength(12);
    expect(adapterMatrix).toContain("request_intake,RequestIntakeStatusProjection");
    expect(adapterMatrix).toContain("support_replay_investigation,SupportReplayRestoreSettlement");
    expect(adapterMatrix).toContain("sourceTrustDependency");
  });

  it("materializes queue health, breach risk, dependency, anomaly, equity, continuity, and dashboard DTOs", () => {
    const fixture = readJson<Phase9OperationalProjectionEngineFixture>(
      "data/fixtures/437_phase9_operational_projection_engine_fixtures.json",
    );
    const result = fixture.baselineResult;

    expect(result.queueHealthSnapshots.length).toBeGreaterThan(0);
    expect(
      result.queueHealthSnapshots.every(
        (snapshot) => snapshot.sourceWindowHash && snapshot.trustState,
      ),
    ).toBe(true);
    expect(result.breachRiskRecords.length).toBeGreaterThan(0);
    expect(result.dependencyHealthRecords.map((record) => record.dependencyCode)).toEqual(
      expect.arrayContaining([
        "messaging_notification_transport",
        "nhs_external_integration",
        "pharmacy_inbox_outbox",
        "model_vendor_audit",
        "event_ingestion_projection_rebuild",
        "database_cache_worker",
      ]),
    );
    expect(result.metricAnomalySnapshots.length).toBeGreaterThan(0);
    expect(result.equitySliceMetrics.length).toBeGreaterThan(0);
    expect(result.continuityControlHealthProjections).toHaveLength(11);
    expect(result.opsOverviewContextFrame.boardTupleHash).toMatch(/^[a-f0-9]{64}$/);
    expect(result.opsOverviewSliceEnvelopes).toHaveLength(6);
    expect(result.liveBoardDeltaWindow.contextFrameRef).toBe(
      result.opsOverviewContextFrame.contextFrameId,
    );
    for (const tile of result.dashboardTiles) {
      expect(validateDashboardMetricTileContract(tile).valid).toBe(true);
      expect(tile.graphVerdictRef).toBe(fixture.baselineGraphVerdict.verdictId);
      expect(tile.projectionHealthRef).toBe(
        result.projectionHealthSnapshot.projectionHealthSnapshotId,
      );
    }
  });

  it("stores operator-readable summary and alignment notes", () => {
    const summary = readText("data/analysis/437_phase9_operational_projection_engine_summary.md");
    const notes = readText("data/analysis/437_algorithm_alignment_notes.md");

    expect(summary).toContain("Adapter count");
    expect(summary).toContain("Breach risk records");
    expect(notes).toContain("does not calculate queue health from UI state");
    expect(notes).toContain("Dashboard DTOs carry freshness, trust, completeness");
  });

  it("records that no operational event source gap artifact is needed", () => {
    const gapPath = path.join(
      root,
      "data/contracts/PHASE8_9_BATCH_428_442_INTERFACE_GAP_437_OPERATIONAL_EVENT_SOURCE.json",
    );

    expect(fs.existsSync(gapPath)).toBe(false);
  });
});
