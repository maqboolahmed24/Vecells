import { describe, expect, it } from "vitest";
import {
  REQUIRED_PHASE9_ASSURANCE_CONTRACTS,
  assertGraphCompletenessRequiredForConsumer,
  assertGraphSnapshotImmutable,
  assertNoParallelEvidenceListWhenGraphAvailable,
  buildAssuranceEvidenceGraphEdge,
  canonicalizeAssuranceValue,
  createPhase9AssuranceContractFixture,
  deriveAssuranceSliceTrustState,
  evaluateAssuranceGraphCompletenessVerdict,
  hashAssurancePayload,
  normalizeOrQuarantineAssuranceContractVersion,
  orderedSetHash,
  validateContractDefinitionCoverage,
  validateContractObject,
  validateLedgerPreviousHashContinuity,
  validateTenantIsolation,
  type AssuranceEvidenceGraphSnapshot,
  type AssuranceGraphCompletenessVerdict,
  type AssuranceLedgerEntry,
} from "../../packages/domains/analytics_assurance/src/phase9-assurance-ledger-contracts.ts";

function mutable<T>(value: T): Record<string, unknown> {
  return JSON.parse(JSON.stringify(value)) as Record<string, unknown>;
}

describe("432 Phase 9 assurance contract invariants", () => {
  it("validates every frozen contract definition and valid object example", () => {
    const coverage = validateContractDefinitionCoverage();
    const fixture = createPhase9AssuranceContractFixture();

    expect(coverage).toEqual({ valid: true, errors: [] });
    expect(fixture.contractNames).toEqual(REQUIRED_PHASE9_ASSURANCE_CONTRACTS);
    for (const contractName of REQUIRED_PHASE9_ASSURANCE_CONTRACTS) {
      expect(validateContractObject(contractName, fixture.examples[contractName])).toEqual({
        valid: true,
        errors: [],
      });
    }
  });

  it("fails closed on a missing required field", () => {
    const fixture = createPhase9AssuranceContractFixture();
    const invalid = mutable(fixture.examples.AssuranceLedgerEntry);
    delete invalid.producerRef;

    expect(validateContractObject("AssuranceLedgerEntry", invalid).errors).toContain(
      "MISSING_REQUIRED_FIELD:AssuranceLedgerEntry.producerRef",
    );
  });

  it("fails closed on an invalid enum value", () => {
    const fixture = createPhase9AssuranceContractFixture();
    const invalid = mutable(fixture.examples.AssuranceSliceTrustRecord);
    invalid.trustState = "green-but-not-registered";

    expect(validateContractObject("AssuranceSliceTrustRecord", invalid).errors).toContain(
      "INVALID_ENUM:AssuranceSliceTrustRecord.trustState:green-but-not-registered",
    );
  });

  it("rejects cross-tenant references", () => {
    const result = validateTenantIsolation("tenant:a", [
      { fieldName: "evidenceArtifactId", ref: "ea:1", tenantId: "tenant:a" },
      { fieldName: "controlObjectiveId", ref: "co:1", tenantId: "tenant:b" },
    ]);

    expect(result.valid).toBe(false);
    expect(result.errors).toEqual(["CROSS_TENANT_REFERENCE:controlObjectiveId:co:1"]);
  });

  it("blocks graph completeness when an edge references missing evidence", () => {
    const fixture = createPhase9AssuranceContractFixture();
    const badEdge = buildAssuranceEvidenceGraphEdge({
      assuranceEvidenceGraphEdgeId: "aege_missing_evidence",
      graphSnapshotRef: fixture.graphSnapshot.assuranceEvidenceGraphSnapshotId,
      fromRef: fixture.ledgerEntries[0]!.assuranceLedgerEntryId,
      toRef: "missing:evidence-artifact",
      edgeType: "ledger_produces_artifact",
      scopeState: "in_scope",
      supersessionState: "live",
      createdAt: fixture.generatedAt,
    });

    const verdict = evaluateAssuranceGraphCompletenessVerdict({
      assuranceGraphCompletenessVerdictId: "agcv_missing_evidence",
      snapshot: fixture.graphSnapshot,
      edges: [...fixture.graphEdges, badEdge],
      scopeRef: fixture.graphSnapshot.tenantScopeRef,
      requiredNodeRefs: [
        fixture.ledgerEntries[0]!.assuranceLedgerEntryId,
        "missing:evidence-artifact",
      ],
      evaluatedAt: fixture.generatedAt,
    });

    expect(verdict.verdictState).toBe("blocked");
    expect(verdict.missingNodeRefs).toContain("missing:evidence-artifact");
    expect(verdict.missingEdgeRefs).toContain("aege_missing_evidence");
  });

  it("rejects snapshot mutation after seal", () => {
    const fixture = createPhase9AssuranceContractFixture();
    const mutated: AssuranceEvidenceGraphSnapshot = {
      ...fixture.graphSnapshot,
      ledgerEntryRefs: [...fixture.graphSnapshot.ledgerEntryRefs, "ale_mutated_after_seal"],
    };

    expect(() => assertGraphSnapshotImmutable(fixture.graphSnapshot, mutated)).toThrow(
      /GRAPH_SNAPSHOT_IMMUTABLE_ONCE_SEALED/,
    );
  });

  it("proves hash determinism, timestamp normalization, and explicit array ordering", () => {
    const left = {
      b: ["first", "second"],
      a: "2026-04-27T10:00:00+01:00",
    };
    const right = {
      a: "2026-04-27T09:00:00.000Z",
      b: ["first", "second"],
    };

    expect(canonicalizeAssuranceValue(left)).toBe(canonicalizeAssuranceValue(right));
    expect(hashAssurancePayload(left)).toBe(hashAssurancePayload(right));
    expect(hashAssurancePayload(["a", "b"], "hash determinism array")).not.toBe(
      hashAssurancePayload(["b", "a"], "hash determinism array"),
    );
    expect(orderedSetHash(["a", "b"], "hash determinism set")).toBe(
      orderedSetHash(["b", "a"], "hash determinism set"),
    );
  });

  it("enforces previous-hash continuity", () => {
    const fixture = createPhase9AssuranceContractFixture();
    const valid = validateLedgerPreviousHashContinuity(fixture.ledgerEntries);
    const broken: AssuranceLedgerEntry[] = [
      fixture.ledgerEntries[0]!,
      { ...fixture.ledgerEntries[1]!, previousHash: "f".repeat(64) },
    ];

    expect(valid).toEqual({ valid: true, errors: [] });
    expect(validateLedgerPreviousHashContinuity(broken).errors).toContain(
      `LEDGER_PREVIOUS_HASH_BREAK:${fixture.ledgerEntries[1]!.assuranceLedgerEntryId}`,
    );
  });

  it("normalizes supported legacy schema versions and quarantines unsupported schema versions", () => {
    expect(normalizeOrQuarantineAssuranceContractVersion("phase9.assurance-ledger-contracts.v0.9")).toMatchObject({
      state: "normalized",
      migrationApplied:
        "phase9.assurance-ledger-contracts.v0.9->432.phase9.assurance-ledger-contracts.v1",
    });
    expect(normalizeOrQuarantineAssuranceContractVersion("phase9.assurance-ledger-contracts.v0.1")).toMatchObject({
      state: "quarantined",
      quarantineReason: "UNSUPPORTED_SCHEMA_VERSION",
    });
  });

  it("blocks consumers attempting to bypass graph verdicts or maintain parallel local evidence lists", () => {
    const fixture = createPhase9AssuranceContractFixture();
    const staleVerdict: AssuranceGraphCompletenessVerdict = {
      ...fixture.graphCompletenessVerdict,
      verdictState: "stale",
    };

    expect(() => assertGraphCompletenessRequiredForConsumer("pack_export", fixture.graphSnapshot, undefined)).toThrow(
      /GRAPH_VERDICT_REQUIRED/,
    );
    expect(() =>
      assertGraphCompletenessRequiredForConsumer("authoritative_dashboard", fixture.graphSnapshot, staleVerdict),
    ).toThrow(/GRAPH_VERDICT_NOT_COMPLETE/);
    expect(() =>
      assertNoParallelEvidenceListWhenGraphAvailable(fixture.graphSnapshot, ["local:evidence:list"]),
    ).toThrow(/PARALLEL_LOCAL_EVIDENCE_LIST_FORBIDDEN/);
  });

  it("uses lower-bound slice trust to govern visible dashboard and operations shell posture", () => {
    const firstPass = deriveAssuranceSliceTrustState({
      previousTrustState: "unknown",
      consecutiveTrustedEvaluations: 0,
      evaluationModelRef: "phase9.assurance.slice-trust.lower-bound.v1",
      previousEvaluationModelRef: "phase9.assurance.slice-trust.lower-bound.v1",
      trustLowerBound: 0.89,
      hardBlockState: false,
      graphVerdictState: "complete",
    });
    const secondPass = deriveAssuranceSliceTrustState({
      previousTrustState: firstPass.trustState,
      consecutiveTrustedEvaluations: firstPass.consecutiveTrustedEvaluations,
      evaluationModelRef: "phase9.assurance.slice-trust.lower-bound.v1",
      previousEvaluationModelRef: "phase9.assurance.slice-trust.lower-bound.v1",
      trustLowerBound: 0.9,
      hardBlockState: false,
      graphVerdictState: "complete",
    });
    const belowLeaveThreshold = deriveAssuranceSliceTrustState({
      previousTrustState: "trusted",
      consecutiveTrustedEvaluations: 2,
      evaluationModelRef: "phase9.assurance.slice-trust.lower-bound.v1",
      previousEvaluationModelRef: "phase9.assurance.slice-trust.lower-bound.v1",
      trustLowerBound: 0.81,
      hardBlockState: false,
      graphVerdictState: "complete",
    });
    const hardBlocked = deriveAssuranceSliceTrustState({
      previousTrustState: "trusted",
      consecutiveTrustedEvaluations: 2,
      evaluationModelRef: "phase9.assurance.slice-trust.lower-bound.v1",
      previousEvaluationModelRef: "phase9.assurance.slice-trust.lower-bound.v1",
      trustLowerBound: 0.96,
      hardBlockState: true,
      graphVerdictState: "complete",
    });

    expect(firstPass.visibleDashboardPosture).toBe("diagnostic_only");
    expect(secondPass.trustState).toBe("trusted");
    expect(secondPass.operationsShellPosture).toBe("live");
    expect(belowLeaveThreshold.trustState).toBe("degraded");
    expect(hardBlocked.trustState).toBe("quarantined");
    expect(hardBlocked.operationsShellPosture).toBe("blocked");
  });

  it("keeps evidence artifact and control status contract axes distinct", () => {
    const fixture = createPhase9AssuranceContractFixture();
    const artifact = mutable(fixture.examples.EvidenceArtifact);
    const controlStatus = mutable(fixture.examples.ControlStatusSnapshot);

    for (const field of [
      "sourceCaptureBundleRef",
      "sourceDerivationPackageRefs",
      "sourceSummaryParityRef",
      "redactionTransformHash",
      "retentionClassRef",
      "visibilityScope",
    ]) {
      expect(artifact[field]).toBeDefined();
    }
    for (const field of [
      "freshnessState",
      "coverageState",
      "coverageLowerBound",
      "lineageScore",
      "reproducibilityScore",
      "assuranceGraphCompletenessVerdictRef",
    ]) {
      expect(controlStatus[field]).toBeDefined();
    }
  });
});
