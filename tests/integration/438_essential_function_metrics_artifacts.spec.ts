import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  PHASE9_ESSENTIAL_FUNCTION_METRICS_VERSION,
  PHASE9_OPERATIONAL_NORMALIZATION_VERSION,
  createPhase9EssentialFunctionMetricsFixture,
  validateEssentialFunctionMetricAdapters,
  type Phase9EssentialFunctionMetricsFixture,
} from "../../packages/domains/analytics_assurance/src/index.ts";

const root = path.resolve(__dirname, "..", "..");

function readText(relativePath: string): string {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function readJson<T>(relativePath: string): T {
  return JSON.parse(readText(relativePath)) as T;
}

describe("438 Phase 9 essential function metrics artifacts", () => {
  it("publishes essential function metric contract and deterministic fixtures", () => {
    const contract = readJson<{
      schemaVersion: string;
      projectionEngineVersion: string;
      producedObjects: string[];
      metricInputs: { eventFamily: string; sourceObject: string }[];
    }>("data/contracts/438_phase9_essential_function_metrics_contract.json");
    const fixture = readJson<Phase9EssentialFunctionMetricsFixture>(
      "data/fixtures/438_phase9_essential_function_metrics_fixtures.json",
    );
    const recomputed = createPhase9EssentialFunctionMetricsFixture();

    expect(contract.schemaVersion).toBe(PHASE9_ESSENTIAL_FUNCTION_METRICS_VERSION);
    expect(contract.projectionEngineVersion).toBe("437.phase9.operational-projection-engine.v1");
    expect(contract.producedObjects).toEqual(
      expect.arrayContaining([
        "WaitlistConversionMetricSnapshot",
        "PharmacyBounceBackMetricSnapshot",
        "NotificationDeliveryMetricSnapshot",
        "Phase9OperationalProjectionResult",
      ]),
    );
    expect(contract.metricInputs).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ eventFamily: "waitlist_lifecycle", sourceObject: "WaitlistOffer" }),
        expect.objectContaining({ eventFamily: "pharmacy_lifecycle", sourceObject: "PharmacyBounceBackRecord" }),
        expect.objectContaining({ eventFamily: "notification_lifecycle", sourceObject: "CommunicationEnvelope" }),
      ]),
    );
    expect(fixture.baselineResult.resultHash).toBe(recomputed.baselineResult.resultHash);
    expect(fixture.replayHash).toBe(recomputed.replayHash);
  });

  it("records typed lifecycle adapters for waitlist pharmacy notification and assurance trust", () => {
    const fixture = readJson<Phase9EssentialFunctionMetricsFixture>(
      "data/fixtures/438_phase9_essential_function_metrics_fixtures.json",
    );
    const adapterMatrix = readText("data/analysis/438_metric_lifecycle_event_adapter_matrix.csv");

    expect(validateEssentialFunctionMetricAdapters(fixture.adapters)).toEqual([]);
    expect(fixture.adapters).toHaveLength(4);
    expect(adapterMatrix).toContain("waitlist_lifecycle,WaitlistOffer");
    expect(adapterMatrix).toContain("pharmacy_lifecycle,PharmacyBounceBackRecord");
    expect(adapterMatrix).toContain("notification_lifecycle,CommunicationEnvelope");
    expect(adapterMatrix).toContain("sourceTrustDependency");
  });

  it("materializes snapshots with required lineage and projection health references", () => {
    const fixture = readJson<Phase9EssentialFunctionMetricsFixture>(
      "data/fixtures/438_phase9_essential_function_metrics_fixtures.json",
    );
    const result = fixture.baselineResult;
    const projectionHealthRef =
      result.projectionResult.projectionHealthSnapshot.projectionHealthSnapshotId;

    for (const snapshot of [
      result.waitlistConversion,
      result.pharmacyBounceBack,
      result.notificationDelivery,
    ]) {
      expect(snapshot.sourceEventRefs.length).toBeGreaterThan(0);
      expect(snapshot.sourceWindowHash).toMatch(/^[a-f0-9]{64}$/);
      expect(snapshot.metricDefinitionRef).toMatch(/^omd_438_/);
      expect(snapshot.normalizationVersionRef).toBe(PHASE9_OPERATIONAL_NORMALIZATION_VERSION);
      expect(snapshot.projectionHealthRef).toBe(projectionHealthRef);
      expect(snapshot.graphVerdictRef).toBe(fixture.baselineGraphVerdict.verdictId);
    }
  });

  it("connects alert hooks dashboard DTOs and 437 projection output", () => {
    const fixture = readJson<Phase9EssentialFunctionMetricsFixture>(
      "data/fixtures/438_phase9_essential_function_metrics_fixtures.json",
    );
    const result = fixture.baselineResult;

    expect(result.alertHooks.map((hook) => hook.alertCode)).toEqual(
      expect.arrayContaining([
        "waitlist_conversion_drop",
        "waitlist_offer_expiry_rise",
        "pharmacy_urgent_return_backlog",
        "pharmacy_bounce_back_reason_spike",
        "notification_delivery_failure_spike",
        "notification_receipt_reply_latency_degradation",
        "notification_channel_transport_failure",
        "slice_access_inequity_persistence",
      ]),
    );
    expect(result.dashboardDtos).toHaveLength(3);
    expect(result.dashboardDtos.every((dto) => dto.allowedInvestigationScope.includes("scope:"))).toBe(true);
    expect(result.projectionResult.metricAnomalySnapshots.length).toBeGreaterThan(0);
    expect(result.projectionResult.projectionHealthSnapshot.trustState).toBe("trusted");
  });

  it("stores operator-readable summary alignment notes and no gap artifact", () => {
    const summary = readText("data/analysis/438_phase9_essential_function_metrics_summary.md");
    const notes = readText("data/analysis/438_algorithm_alignment_notes.md");
    const gapPath = path.join(
      root,
      "data/contracts/PHASE8_9_BATCH_428_442_INTERFACE_GAP_438_METRIC_LIFECYCLE_EVENT.json",
    );

    expect(summary).toContain("Adapter count");
    expect(summary).toContain("Metric observations are fed back");
    expect(notes).toContain("No new lifecycle interface gap artifact is required");
    expect(notes).toContain("Notification metrics separate communication envelope creation");
    expect(fs.existsSync(gapPath)).toBe(false);
  });
});
