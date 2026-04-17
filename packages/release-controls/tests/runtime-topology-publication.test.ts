import { describe, expect, it } from "vitest";
import {
  createRuntimeTopologyPublicationSimulationHarness,
  createRuntimeTopologyPublicationVerdictDigest,
  evaluateRuntimeTopologyPublicationGraph,
  getRuntimeTopologyPublicationCurrentSnapshot,
  getRuntimeTopologyPublicationScenario,
  selectRuntimeTopologyPublicationScenario,
} from "../src/runtime-topology-publication.ts";

function cloneGraph(scenarioId: string) {
  return JSON.parse(
    JSON.stringify(getRuntimeTopologyPublicationScenario(scenarioId).graph),
  ) as ReturnType<typeof getRuntimeTopologyPublicationScenario>["graph"];
}

describe("runtime topology publication authority", () => {
  it("builds a publishable local simulation harness", () => {
    const harness = createRuntimeTopologyPublicationSimulationHarness();

    expect(harness.scenario.scenarioId).toBe("LOCAL_AUTHORITATIVE_ALIGNMENT");
    expect(harness.verdict.publishable).toBe(true);
    expect(harness.verdict.publicationEligibilityState).toBe("publishable");
    expect(harness.verdict.driftFindingCount).toBe(0);
  });

  it("selects a clean ci-preview tuple when requested by environment", () => {
    const scenario = selectRuntimeTopologyPublicationScenario({
      environmentRing: "ci-preview",
      publishable: true,
    });

    expect(scenario.scenarioId).toBe("CI_PREVIEW_AUTHORITATIVE_ALIGNMENT");
    expect(scenario.expected.publishable).toBe(true);
  });

  it("keeps the current repo snapshot blocked on stale audience bindings and design drift", () => {
    const snapshot = getRuntimeTopologyPublicationCurrentSnapshot();

    expect(snapshot.verdict.publishable).toBe(false);
    expect(snapshot.verdict.blockedReasonRefs).toContain(
      "STALE_AUDIENCE_SURFACE_RUNTIME_BINDING",
    );
    expect(snapshot.verdict.blockedReasonRefs).toContain("DESIGN_BUNDLE_WRONG_TOPOLOGY_TUPLE");
  });

  it.each([
    ["LOCAL_MISSING_MANIFEST_BINDING", "MISSING_MANIFEST_BINDING"],
    ["CI_PREVIEW_GATEWAY_UNDECLARED_WORKLOAD", "GATEWAY_TO_UNDECLARED_WORKLOAD"],
    ["INTEGRATION_UNDECLARED_TRUST_BOUNDARY", "UNDECLARED_TRUST_BOUNDARY_CROSSING"],
    ["PREPROD_TENANT_ISOLATION_MISMATCH", "TENANT_ISOLATION_MISMATCH"],
    ["PREPROD_STALE_AUDIENCE_RUNTIME_BINDING", "STALE_AUDIENCE_SURFACE_RUNTIME_BINDING"],
    ["PRODUCTION_DESIGN_BUNDLE_WRONG_TOPOLOGY", "DESIGN_BUNDLE_WRONG_TOPOLOGY_TUPLE"],
    ["PRODUCTION_WITHDRAWN_ROUTE_PUBLICATION", "ROUTE_PUBLICATION_WITHDRAWN"],
  ])("fails closed for %s", (scenarioId, reasonRef) => {
    const scenario = getRuntimeTopologyPublicationScenario(scenarioId);
    const verdict = evaluateRuntimeTopologyPublicationGraph(scenario.graph);

    expect(verdict.publishable).toBe(false);
    expect(verdict.blockedReasonRefs).toContain(reasonRef);
  });

  it("fails closed when a gateway requires an assurance slice that is absent from topology", () => {
    const graph = cloneGraph("LOCAL_AUTHORITATIVE_ALIGNMENT");
    const missingSlice = graph.gatewaySurfaces[0].requiredAssuranceSliceRefs[0];
    graph.assuranceSliceRefs = graph.assuranceSliceRefs.filter((ref) => ref !== missingSlice);

    const verdict = evaluateRuntimeTopologyPublicationGraph(graph);

    expect(verdict.publishable).toBe(false);
    expect(verdict.blockedReasonRefs).toContain("MISSING_MANIFEST_BINDING");
    expect(verdict.driftFindings.some((finding) => finding.memberRef === graph.gatewaySurfaces[0].gatewaySurfaceId)).toBe(
      true,
    );
  });

  it("fails closed when a trust boundary no longer permits the downstream service identity", () => {
    const graph = cloneGraph("LOCAL_AUTHORITATIVE_ALIGNMENT");
    graph.trustZoneBoundaries = graph.trustZoneBoundaries.map((row) =>
      row.boundaryId === "tzb_published_gateway_to_application_core"
        ? { ...row, allowedIdentityRefs: ["sid_published_gateway"] }
        : row,
    );

    const verdict = evaluateRuntimeTopologyPublicationGraph(graph);

    expect(verdict.publishable).toBe(false);
    expect(verdict.blockedReasonRefs).toContain("UNDECLARED_TRUST_BOUNDARY_CROSSING");
  });

  it("publishes a deterministic verdict digest", () => {
    const scenario = getRuntimeTopologyPublicationScenario("PREPROD_STALE_AUDIENCE_RUNTIME_BINDING");
    const verdict = evaluateRuntimeTopologyPublicationGraph(scenario.graph);

    expect(createRuntimeTopologyPublicationVerdictDigest(verdict)).toBe(
      createRuntimeTopologyPublicationVerdictDigest(verdict),
    );
  });
});
