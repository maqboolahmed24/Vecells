import { describe, expect, it } from "vitest";
import {
  Phase9ResilienceActionSettlementService,
  createPhase9ResilienceActionSettlementFixture,
} from "../../packages/domains/analytics_assurance/src/index.ts";

describe("445 Phase 9 resilience action settlement", () => {
  it("clean-environment restore execution state machine", () => {
    const fixture = createPhase9ResilienceActionSettlementFixture();

    expect(fixture.restorePreparedSettlement.result).toBe("accepted_pending_evidence");
    expect(fixture.restoreStartedRun.targetEnvironmentRef).toContain("clean-env");
    expect(fixture.restoreStartedRun.resultState).toBe("data_restored");
    expect(fixture.restoreValidatedRun.dependencyValidationState).toBe("complete");
    expect(fixture.restoreValidatedRun.journeyValidationState).toBe("complete");
    expect(fixture.restoreValidatedRun.resultState).toBe("succeeded");
  });

  it("dependency-order validation blocking restore success", () => {
    const fixture = createPhase9ResilienceActionSettlementFixture();

    expect(fixture.dependencyBlockedRestoreRun.dependencyValidationState).toBe("blocked");
    expect(fixture.dependencyBlockedRestoreRun.resultState).toBe("failed");
    expect(fixture.dependencyBlockedRestoreRun.resilienceActionSettlementRef).toMatch(/^ras_445_/);
  });

  it("required journey proof blocking restore success", () => {
    const fixture = createPhase9ResilienceActionSettlementFixture();

    expect(fixture.missingJourneyProofRestoreRun.journeyValidationState).toBe("pending");
    expect(fixture.missingJourneyProofRestoreRun.resultState).toBe("journey_validation_pending");
    expect(fixture.missingJourneyProofRestoreRun.journeyProofArtifactRefs.length).toBeLessThan(
      fixture.restoreValidatedRun.journeyProofArtifactRefs.length,
    );
  });

  it("failover scenario scope and tuple enforcement", () => {
    const fixture = createPhase9ResilienceActionSettlementFixture();

    expect(fixture.approvedFailoverScenario.scenarioState).toBe("approved");
    expect(fixture.approvedFailoverScenario.scopeTupleHash).toBe(fixture.readinessInputs.tupleHash);
    expect(fixture.staleFailoverSettlement.result).toBe("stale_scope");
  });

  it("failover activation and stand-down settlement", () => {
    const fixture = createPhase9ResilienceActionSettlementFixture();

    expect(fixture.failoverActivatedRun.resultState).toBe("active");
    expect(fixture.failoverStoodDownRun.resultState).toBe("stood_down");
    expect(fixture.failoverStoodDownRun.resilienceActionSettlementRef).toMatch(/^ras_445_/);
  });

  it("chaos blast-radius and guardrail enforcement", () => {
    const fixture = createPhase9ResilienceActionSettlementFixture();

    expect(fixture.approvedChaosExperiment.experimentState).toBe("approved");
    expect(fixture.blockedChaosExperiment.experimentState).toBe("draft");
    expect(fixture.chaosScheduledRun.guardrailState).toBe("approved");
    expect(fixture.chaosGuardrailBlockedSettlement.result).toBe("blocked_guardrail");
  });

  it("stale readiness/posture/publication/trust/freeze blocking every action type", () => {
    const fixture = createPhase9ResilienceActionSettlementFixture();
    const results = fixture.blockedEveryActionTypeSettlements.map(
      (settlement) => settlement.result,
    );

    expect(fixture.blockedEveryActionTypeSettlements).toHaveLength(10);
    expect(results).toEqual(expect.arrayContaining(["blocked_publication", "blocked_trust"]));
    expect(results).toEqual(expect.arrayContaining(["frozen", "blocked_readiness"]));
    expect(results.every((result) => result !== "applied")).toBe(true);
  });

  it("settlement result drives visible/actionable state", () => {
    const fixture = createPhase9ResilienceActionSettlementFixture();

    expect(fixture.latestSettlementState.latestSettlementResult).toBe("blocked_guardrail");
    expect(fixture.latestSettlementState.visibleActionableState).toBe("blocked");
    expect(fixture.latestSettlementState.blockerRefs).toContain(
      "blocked:guardrail-or-blast-radius",
    );
  });

  it("evidence artifact hash determinism", () => {
    const fixture = createPhase9ResilienceActionSettlementFixture();

    expect(fixture.deterministicArtifactHash).toMatch(/^[a-f0-9]{64}$/);
    expect(fixture.deterministicArtifactHash).toBe(fixture.deterministicArtifactReplayHash);
  });

  it("recovery evidence graph writeback", () => {
    const fixture = createPhase9ResilienceActionSettlementFixture();

    expect(fixture.recoveryEvidenceGraphWriteback.assuranceLedgerEntry.entryType).toBe(
      "evidence_materialization",
    );
    expect(fixture.recoveryEvidenceGraphWriteback.assuranceLedgerEntry.replayDecisionClass).toBe(
      "exact_replay",
    );
    expect(fixture.recoveryEvidenceGraphWriteback.graphEdgeRefs.length).toBeGreaterThanOrEqual(3);
  });

  it("old restore/failover/chaos runs no longer satisfying current posture after tuple drift", () => {
    const fixture = createPhase9ResilienceActionSettlementFixture();

    expect(fixture.oldRestoreRunAfterTupleDrift.resilienceTupleHash).not.toBe(
      fixture.readinessInputs.readinessHash,
    );
    expect(fixture.oldFailoverRunAfterTupleDrift.resultState).toBe("superseded");
    expect(fixture.oldChaosRunAfterTupleDrift.resultState).toBe("superseded");
    expect(fixture.tupleDriftSettlement.result).toBe("stale_scope");
  });

  it("duplicate command/idempotency safety", () => {
    const fixture = createPhase9ResilienceActionSettlementFixture();

    expect(fixture.duplicateIdempotencySettlement.resilienceActionSettlementId).toBe(
      fixture.duplicateIdempotencyReplaySettlement.resilienceActionSettlementId,
    );
    expect(fixture.duplicateIdempotencySettlement.settlementHash).toBe(
      fixture.duplicateIdempotencyReplaySettlement.settlementHash,
    );
  });

  it("authorization and tenant isolation", () => {
    const fixture = createPhase9ResilienceActionSettlementFixture();

    expect(fixture.authorizationDeniedErrorCode).toBe("RESILIENCE_ACTION_ROLE_DENIED");
    expect(fixture.tenantDeniedErrorCode).toBe("RESILIENCE_ACTION_SCOPE_TENANT_DENIED");
  });

  it("raw object-store link prevention for recovery artifacts", () => {
    const fixture = createPhase9ResilienceActionSettlementFixture();

    expect(fixture.rawObjectStoreLinkDeniedErrorCode).toBe(
      "RECOVERY_EVIDENCE_RAW_OBJECT_LINK_DENIED",
    );
    expect(new Phase9ResilienceActionSettlementService().getRecoveryEvidenceArtifacts({})).toEqual(
      [],
    );
  });
});
