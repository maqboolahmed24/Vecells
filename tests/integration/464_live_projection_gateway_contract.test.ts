import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  LivePhase9ProjectionGateway,
  PHASE9_LIVE_PROJECTION_SCHEMA_VERSION,
  applyPhase9LiveProjectionFixture,
  createLivePhase9ProjectionGatewayProjection,
  createPhase9LiveProjectionGatewayFixture,
  requiredPhase9LiveSurfaceCodes,
} from "../../packages/domains/operations/src/index";

describe("task 464 live projection gateway contract", () => {
  it("covers every required Phase 9 surface with browser-safe read projection channels", () => {
    const projection = createLivePhase9ProjectionGatewayProjection();
    expect(projection.schemaVersion).toBe(PHASE9_LIVE_PROJECTION_SCHEMA_VERSION);
    expect(projection.surfaces.map((surface) => surface.surfaceCode)).toEqual(
      requiredPhase9LiveSurfaceCodes,
    );
    expect(projection.channelContracts).toHaveLength(10);
    expect(
      new Set(projection.channelContracts.map((contract) => contract.subscriptionKey)).size,
    ).toBe(10);
    expect(projection.rawEventBrowserJoinAllowed).toBe(false);
    expect(projection.rawDomainEventPayloadAllowed).toBe(false);

    for (const contract of projection.channelContracts) {
      expect(contract.requiresRuntimeBinding).toBe(true);
      expect(contract.telemetryDisclosureFenceRef).toBe("UITelemetryDisclosureFence");
      expect(contract.rawEventBrowserJoinAllowed).toBe(false);
      expect(contract.rawDomainEventPayloadAllowed).toBe(false);
      expect(contract.reconnectPolicy.maxBufferedBatchCount).toBe(4);
      expect(contract.cleanupRef).toMatch(/^subscription-cleanup:phase9:/);
    }
  });

  it("fails closed for projection version mismatch and missing runtime binding", () => {
    const versionMismatch = createLivePhase9ProjectionGatewayProjection({
      scenarioState: "projection_version_mismatch",
      selectedSurfaceCode: "assurance_center",
    });
    expect(versionMismatch.selectedSurface.projectionState).toBe("blocked");
    expect(versionMismatch.selectedSurface.channelContract.failureMode).toBe(
      "block_on_missing_projection_version",
    );
    expect(() =>
      new LivePhase9ProjectionGateway({
        scenarioState: "projection_version_mismatch",
        selectedSurfaceCode: "assurance_center",
      }).subscribe("assurance_center"),
    ).toThrow(/failed closed/);

    const missingBinding = createLivePhase9ProjectionGatewayProjection({
      scenarioState: "missing_runtime_binding",
      selectedSurfaceCode: "tenant_governance",
    });
    expect(missingBinding.selectedSurface.runtimeBindingState).toBe("missing");
    expect(missingBinding.selectedSurface.actionSettlementState).toBe("blocked");
    expect(() =>
      new LivePhase9ProjectionGateway({
        scenarioState: "missing_runtime_binding",
        selectedSurfaceCode: "tenant_governance",
      }).subscribe("tenant_governance"),
    ).toThrow(/failed closed/);
  });

  it("keeps quarantined producers slice-bounded instead of blacking out every surface", () => {
    const projection = createLivePhase9ProjectionGatewayProjection({
      scenarioState: "quarantined_incident_producer",
      selectedSurfaceCode: "incident_desk",
    });
    expect(projection.quarantinedCount).toBe(3);
    expect(
      projection.surfaces
        .filter((surface) => surface.projectionState === "quarantined")
        .map((surface) => surface.surfaceCode),
    ).toEqual(["operations_overview", "assurance_center", "incident_desk"]);
    expect(
      projection.surfaces.find((surface) => surface.surfaceCode === "records_governance")
        ?.projectionState,
    ).toBe("current");
    expect(
      projection.surfaces.find((surface) => surface.surfaceCode === "conformance_scorecard")
        ?.projectionState,
    ).toBe("current");
  });

  it("propagates graph drift, settlement replacement, delta gates, and return-token recovery", () => {
    const graph = createLivePhase9ProjectionGatewayProjection({
      scenarioState: "graph_drift",
      selectedSurfaceCode: "conformance_scorecard",
    });
    expect(graph.selectedSurface.graphVerdictState).toBe("stale");
    expect(graph.selectedSurface.actionSettlementState).toBe("stale_reacquire");
    expect(graph.conformanceScorecardUpdate.bauSignoffState).toBe("pending");

    const settlement = createLivePhase9ProjectionGatewayProjection({
      scenarioState: "action_settlement_failed",
      selectedSurfaceCode: "resilience_board",
    });
    expect(settlement.selectedSurface.actionSettlementState).toBe("failed");
    expect(settlement.resiliencePostureUpdate.recoveryControlPosture).toBe("blocked");

    const deltaGate = createLivePhase9ProjectionGatewayProjection({
      scenarioState: "delta_gate_open",
      selectedSurfaceCode: "operations_overview",
    });
    expect(deltaGate.selectedSurface.deltaGateState).toBe("queued");
    expect(deltaGate.selectedSurface.focusProtectionState).toBe("active");
    expect(deltaGate.selectedSurface.selectedAnchorPreserved).toBe(true);

    const returnDrift = createLivePhase9ProjectionGatewayProjection({
      scenarioState: "return_token_drift",
      selectedSurfaceCode: "records_governance",
    });
    expect(returnDrift.selectedSurface.returnTokenState).toBe("partial_restore");
    expect(returnDrift.selectedSurface.actionSettlementState).toBe("read_only_recovery");
  });

  it("applies deterministic producer fixtures without exposing raw event payloads", () => {
    const projection = createLivePhase9ProjectionGatewayProjection();
    const fixture = projection.testEventProducerFixtures.find(
      (candidate) => candidate.patchKind === "producer_quarantine",
    );
    expect(fixture).toBeTruthy();
    expect(fixture?.rawDomainEventRef).toBeNull();
    expect(fixture?.payloadClass).toBe("safe_read_projection");
    const nextProjection = applyPhase9LiveProjectionFixture(projection, fixture!.fixtureId);
    expect(nextProjection.scenarioState).toBe("quarantined_incident_producer");
    expect(nextProjection.selectedSurfaceCode).toBe("incident_desk");
    expect(JSON.stringify(nextProjection)).not.toMatch(/clinicalNarrative|rawPayload|patientNhs/);
  });

  it("keeps generated schema, gap, fixture, contract, and evidence artifacts available", () => {
    const root = process.cwd();
    for (const relativePath of [
      "data/contracts/464_phase9_live_projection_channel.schema.json",
      "data/contracts/PHASE9_BATCH_458_472_INTERFACE_GAP_464_LIVE_EVENT_STREAM_CONTRACTS.json",
      "data/contracts/464_phase9_live_projection_gateway_contract.json",
      "data/fixtures/464_live_projection_gateway_fixtures.json",
      "data/analysis/464_live_projection_gateway_verification_evidence.json",
    ]) {
      expect(fs.existsSync(path.join(root, relativePath))).toBe(true);
    }

    const fixture = createPhase9LiveProjectionGatewayFixture();
    expect(Object.keys(fixture.scenarioProjections)).toContain("return_token_drift");
    expect(Object.keys(fixture.scenarioProjections)).toContain("telemetry_fence_violation");
  });
});
