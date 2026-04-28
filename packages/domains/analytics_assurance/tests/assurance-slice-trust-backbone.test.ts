import { describe, expect, it } from "vitest";
import {
  createAssuranceSliceTrustAuthorityService,
  createAssuranceSliceTrustStore,
  defaultAssuranceTrustEvaluationModelRef,
  evaluateAssuranceSliceTrust,
  validateAssuranceSliceTrustThresholds,
} from "../src/index.ts";

function baseCommand(seed: string) {
  const makeChecks = (prefix: string, count: number, failedIds: readonly number[] = []) =>
    Array.from({ length: count }, (_, index) => ({
      ruleId: `${prefix}_${seed}_${index + 1}`,
      weight: 1,
      satisfied: !failedIds.includes(index + 1),
      mandatory: index === 0,
    }));

  return {
    sliceNamespace: `slice_${seed}`,
    producerScopeRef: `producer_${seed}`,
    reasonCode: `reason_${seed}`,
    evaluationModelRef: defaultAssuranceTrustEvaluationModelRef,
    evidenceRef: `evidence_${seed}`,
    effectiveAt: "2026-04-12T21:00:00Z",
    reviewDueAt: "2026-04-12T22:00:00Z",
    updatedAt: "2026-04-12T21:05:00Z",
    lagMs: 1_000,
    lagBudgetMs: 10_000,
    tauMs: 30_000,
    coverageChecks: makeChecks("coverage", 24),
    lineageChecks: makeChecks("lineage", 24),
    replayChecks: makeChecks("replay", 24),
    consistencyChecks: makeChecks("consistency", 24),
    schemaCompatible: true,
    evaluationInputsAvailable: true,
    hashVerificationPassed: true,
    lineageVerificationPassed: true,
    redactionParityPassed: true,
    replayDeterminismPassed: true,
  } as const;
}

describe("assurance slice trust backbone", () => {
  it("publishes trusted slices only when completeness is complete and lower bound is above the floor", () => {
    const result = evaluateAssuranceSliceTrust(baseCommand("trusted"));

    expect(result.snapshot.trustState).toBe("trusted");
    expect(result.snapshot.completenessState).toBe("complete");
    expect(result.snapshot.trustLowerBound).toBeGreaterThanOrEqual(0.85);
    validateAssuranceSliceTrustThresholds([
      {
        ...result.snapshot,
        sliceTrustId: "slice_trusted",
      },
    ]);
  });

  it("downgrades to degraded when coverage is partial but the slice remains diagnostically usable", () => {
    const result = evaluateAssuranceSliceTrust({
      ...baseCommand("degraded"),
      coverageChecks: [
        ...Array.from({ length: 23 }, (_, index) => ({
          ruleId: `coverage_degraded_${index + 1}`,
          weight: 1,
          satisfied: true,
          mandatory: index === 0,
        })),
        {
          ruleId: "coverage_degraded_24",
          weight: 1,
          satisfied: false,
          mandatory: false,
        },
      ],
    });

    expect(result.snapshot.trustState).toBe("degraded");
    expect(result.snapshot.completenessState).toBe("partial");
    expect(result.snapshot.hardBlockState).toBe(false);
  });

  it("quarantines slices when mandatory evidence or replay determinism fails", () => {
    const result = evaluateAssuranceSliceTrust({
      ...baseCommand("quarantined"),
      coverageChecks: [
        { ruleId: "coverage_a", weight: 2, satisfied: false, mandatory: true },
        { ruleId: "coverage_b", weight: 1, satisfied: true },
      ],
      replayDeterminismPassed: false,
    });

    expect(result.snapshot.trustState).toBe("quarantined");
    expect(result.snapshot.completenessState).toBe("blocked");
    expect(result.snapshot.hardBlockState).toBe(true);
    expect(result.blockers).toContain("BLOCKER_MANDATORY_COVERAGE_MISSING");
    expect(result.blockers).toContain("BLOCKER_REPLAY_DIVERGENCE");
  });

  it("marks the slice unknown when evaluation inputs are unavailable under policy", async () => {
    const repositories = createAssuranceSliceTrustStore();
    const authority = createAssuranceSliceTrustAuthorityService(repositories);
    const result = await authority.evaluateAndSave({
      ...baseCommand("unknown"),
      evaluationInputsAvailable: false,
    });

    expect(result.snapshot.trustState).toBe("unknown");
    expect(result.snapshot.completenessState).toBe("blocked");
    const persisted = await repositories.getCurrentAssuranceSliceTrustRecord(
      result.snapshot.sliceNamespace,
      result.snapshot.producerScopeRef,
    );
    expect(persisted?.sliceTrustId).toBe(result.snapshot.sliceTrustId);
  });
});
