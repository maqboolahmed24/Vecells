import { describe, expect, it } from "vitest";
import {
  PHASE9_GRAPH_VERDICT_ENGINE_VERSION,
  Phase9AssuranceIngestService,
  Phase9GraphVerdictEngine,
  Phase9GraphVerdictEngineError,
  createDefaultPhase9AssuranceProducerRegistration,
  createPhase9AssuranceProducerEnvelope,
  defaultPhase9GraphVerdictPolicy,
  evaluatePhase9GraphVerdict,
  hashAssurancePayload,
  traverseAssuranceGraph,
  type AssuranceEvidenceGraphEdge,
  type AssuranceEvidenceGraphSnapshot,
  type AssuranceSliceTrustRecord,
  type Phase9GraphVerdictPolicy,
} from "../../packages/domains/analytics_assurance/src/index.ts";

function graph() {
  const ingest = new Phase9AssuranceIngestService([createDefaultPhase9AssuranceProducerRegistration()]);
  ingest.ingestEvent(createPhase9AssuranceProducerEnvelope());
  return ingest.materializeGraphSnapshot({
    tenantScopeRef: "tenant:demo-gp",
    generatedAt: "2026-04-27T09:05:00.000Z",
    controlObjectiveRefs: ["control:dtac:clinical-safety:evidence"],
  });
}

function baseInput(snapshot: AssuranceEvidenceGraphSnapshot, edges: readonly AssuranceEvidenceGraphEdge[]) {
  return {
    snapshot,
    edges,
    context: "assurance_pack" as const,
    scopeRef: snapshot.tenantScopeRef,
    generatedAt: "2026-04-27T09:10:00.000Z",
    graphWatermark: snapshot.graphHash,
    requiredLedgerWatermark: snapshot.graphHash,
    requiredNodeRefs: [
      ...snapshot.ledgerEntryRefs,
      ...snapshot.evidenceArtifactRefs,
      ...snapshot.controlObjectiveRefs,
    ],
    requiredEdges: [
      {
        requirementRef: "ledger-produces-artifact",
        fromRef: snapshot.ledgerEntryRefs[0]!,
        toRef: snapshot.evidenceArtifactRefs[0]!,
        edgeType: "ledger_produces_artifact",
      },
    ],
  };
}

function lowTrustRecord(snapshot: AssuranceEvidenceGraphSnapshot): AssuranceSliceTrustRecord {
  return {
    assuranceSliceTrustRecordId: "astr_436_low",
    sliceRef: "slice:dashboard",
    scopeRef: snapshot.tenantScopeRef,
    audienceTier: "operations",
    trustState: "degraded",
    completenessState: "partial",
    trustScore: 0.5,
    trustLowerBound: 0.4,
    freshnessScore: 0.5,
    coverageScore: 0.5,
    lineageScore: 0.5,
    replayScore: 0.5,
    consistencyScore: 0.5,
    hardBlockState: false,
    blockingProducerRefs: [],
    blockingNamespaceRefs: [],
    evaluationModelRef: "phase9.assurance.slice-trust.lower-bound.v1",
    evaluationInputHash: hashAssurancePayload({ low: true }, "test.436.trust"),
    lastEvaluatedAt: "2026-04-27T09:10:00.000Z",
  };
}

describe("436 Phase 9 graph verdict engine", () => {
  it("complete graph returns complete", () => {
    const { snapshot, edges } = graph();
    const verdict = evaluatePhase9GraphVerdict(baseInput(snapshot, edges));

    expect(verdict.state).toBe("complete");
    expect(verdict.contractVerdict.verdictState).toBe("complete");
    expect(verdict.reasonCodes).toEqual([]);
  });

  it("orphan artifact edge returns blocked", () => {
    const { snapshot, edges } = graph();
    const orphan: AssuranceEvidenceGraphEdge = {
      assuranceEvidenceGraphEdgeId: "aege_436_orphan",
      graphSnapshotRef: snapshot.assuranceEvidenceGraphSnapshotId,
      fromRef: snapshot.evidenceArtifactRefs[0]!,
      toRef: "missing:control",
      edgeType: "artifact_satisfies_control",
      scopeState: "in_scope",
      supersessionState: "live",
      edgeHash: hashAssurancePayload({ orphan: true }, "test.436.edge"),
      createdAt: "2026-04-27T09:10:00.000Z",
    };

    const verdict = evaluatePhase9GraphVerdict({ ...baseInput(snapshot, [...edges, orphan]), edges: [...edges, orphan] });
    expect(verdict.state).toBe("blocked");
    expect(verdict.reasonCodes).toContain("ORPHAN_EDGE");
    expect(verdict.missingEdgeRefs).toContain("aege_436_orphan");
  });

  it("missing required control edge returns blocked", () => {
    const { snapshot, edges } = graph();
    const verdict = evaluatePhase9GraphVerdict({
      ...baseInput(snapshot, edges),
      requiredEdges: [
        {
          requirementRef: "missing required control edge",
          fromRef: snapshot.evidenceArtifactRefs[0]!,
          toRef: "control:absent",
          edgeType: "artifact_satisfies_control",
        },
      ],
    });

    expect(verdict.state).toBe("blocked");
    expect(verdict.reasonCodes).toContain("MISSING_REQUIRED_EDGE");
  });

  it("stale evidence returns stale or blocked according to context", () => {
    const { snapshot, edges } = graph();
    const staleEvidence = [
      {
        evidenceRef: snapshot.evidenceArtifactRefs[0]!,
        capturedAt: "2026-04-20T09:00:00.000Z",
        freshnessBudgetMs: 60 * 60 * 1000,
        freshnessState: "stale" as const,
      },
    ];

    expect(
      evaluatePhase9GraphVerdict({
        ...baseInput(snapshot, edges),
        context: "operational_dashboard",
        evidenceFreshness: staleEvidence,
      }).state,
    ).toBe("stale");
    expect(
      evaluatePhase9GraphVerdict({
        ...baseInput(snapshot, edges),
        context: "support_replay",
        evidenceFreshness: staleEvidence,
      }).state,
    ).toBe("blocked");
  });

  it("tenant-crossing edge returns blocked", () => {
    const { snapshot, edges } = graph();
    const crossTenant = { ...edges[0]!, scopeState: "out_of_scope_conflict" as const };
    const verdict = evaluatePhase9GraphVerdict({ ...baseInput(snapshot, [crossTenant]), edges: [crossTenant] });

    expect(verdict.state).toBe("blocked");
    expect(verdict.reasonCodes).toContain("TENANT_BOUNDARY_VIOLATION");
  });

  it("visibility gap blocks audit/replay/export", () => {
    const { snapshot, edges } = graph();
    const verdict = evaluatePhase9GraphVerdict({
      ...baseInput(snapshot, edges),
      context: "support_replay",
      visibilityGrants: [
        {
          artifactRef: snapshot.evidenceArtifactRefs[0]!,
          visibilityScope: "tenant_internal",
          allowedContexts: ["generic_read"],
        },
      ],
    });

    expect(verdict.state).toBe("blocked");
    expect(verdict.reasonCodes).toContain("VISIBILITY_GAP");
  });

  it("low trust lower-bound blocks dashboard normal rendering", () => {
    const { snapshot, edges } = graph();
    const verdict = evaluatePhase9GraphVerdict({
      ...baseInput(snapshot, edges),
      context: "operational_dashboard",
      trustRecords: [lowTrustRecord(snapshot)],
    });

    expect(verdict.state).toBe("blocked");
    expect(verdict.reasonCodes).toContain("LOW_TRUST");
    expect(verdict.trustBlockingRefs).toEqual(["astr_436_low"]);
  });

  it("superseded evidence cannot satisfy current control", () => {
    const { snapshot, edges } = graph();
    const superseded = { ...edges[0]!, supersessionState: "superseded" as const };
    const verdict = evaluatePhase9GraphVerdict({ ...baseInput(snapshot, [superseded]), edges: [superseded] });

    expect(verdict.state).toBe("blocked");
    expect(verdict.reasonCodes).toContain("SUPERSEDED_EVIDENCE");
  });

  it("cycle traversal is safe and deterministic", () => {
    const edgeA: AssuranceEvidenceGraphEdge = {
      assuranceEvidenceGraphEdgeId: "a",
      graphSnapshotRef: "snapshot",
      fromRef: "node:a",
      toRef: "node:b",
      edgeType: "ledger_produces_artifact",
      scopeState: "in_scope",
      supersessionState: "live",
      edgeHash: "a".repeat(64),
      createdAt: "2026-04-27T09:10:00.000Z",
    };
    const edgeB: AssuranceEvidenceGraphEdge = { ...edgeA, assuranceEvidenceGraphEdgeId: "b", fromRef: "node:b", toRef: "node:a", edgeHash: "b".repeat(64) };

    const first = traverseAssuranceGraph([edgeA, edgeB], ["node:a"], 10);
    const second = traverseAssuranceGraph([edgeB, edgeA], ["node:a"], 10);
    expect(first).toEqual(second);
    expect(first.cycleRefs).toEqual(["node:a"]);
  });

  it("same inputs produce identical verdict hash", () => {
    const { snapshot, edges } = graph();
    const first = evaluatePhase9GraphVerdict(baseInput(snapshot, edges));
    const second = evaluatePhase9GraphVerdict(baseInput(snapshot, [...edges].reverse()));

    expect(second.verdictHash).toBe(first.verdictHash);
  });

  it("different context profiles produce expected strictness", () => {
    const { snapshot, edges } = graph();
    const staleEvidence = [
      {
        evidenceRef: snapshot.evidenceArtifactRefs[0]!,
        capturedAt: "2026-04-20T09:00:00.000Z",
        freshnessBudgetMs: 60 * 60 * 1000,
        freshnessState: "stale" as const,
      },
    ];

    const generic = evaluatePhase9GraphVerdict({
      ...baseInput(snapshot, edges),
      context: "generic_read",
      evidenceFreshness: staleEvidence,
    });
    const pack = evaluatePhase9GraphVerdict({
      ...baseInput(snapshot, edges),
      context: "assurance_pack",
      evidenceFreshness: staleEvidence,
    });

    expect(generic.state).toBe("stale");
    expect(pack.state).toBe("blocked");
  });

  it("cache invalidates on policy/evaluator version change", () => {
    const { snapshot, edges } = graph();
    const engine = new Phase9GraphVerdictEngine();
    const first = engine.evaluate(baseInput(snapshot, edges));
    const changedPolicy: Phase9GraphVerdictPolicy = {
      ...defaultPhase9GraphVerdictPolicy,
      policyHash: hashAssurancePayload({ changed: true }, "test.436.policy"),
      evaluatorVersion: `${PHASE9_GRAPH_VERDICT_ENGINE_VERSION}.next`,
    };
    const second = engine.evaluate({ ...baseInput(snapshot, edges), policy: changedPolicy });

    expect(second.verdictId).not.toBe(first.verdictId);
    expect(second.policyHash).not.toBe(first.policyHash);
  });

  it("downstream consumer cannot bypass verdict requirement", () => {
    const engine = new Phase9GraphVerdictEngine();
    expect(() => engine.assertConsumerHasCompleteVerdict("support_replay", undefined)).toThrow(
      Phase9GraphVerdictEngineError,
    );
  });
});
