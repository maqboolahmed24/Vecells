import { describe, expect, it } from "vitest";
import {
  Phase9ExitGateService,
  createPhase9ExitGateExactEvaluationInput,
  createPhase9ExitGateFixture,
} from "../../packages/domains/analytics_assurance/src/index";

describe("471 Phase 9 exit gate blockers", () => {
  it("blocks approval with machine-readable owner, evidence, and next action when proof is stale", () => {
    const fixture = createPhase9ExitGateFixture();
    const decision = fixture.blockedDecision;
    expect(decision.decisionState).toBe("blocked");
    expect(decision.approvalPermitted).toBe(false);
    expect(decision.blockers.length).toBeGreaterThan(0);
    expect(decision.releaseToBAURecordGuard).toMatchObject({
      guardState: "blocked",
      releaseToBAURecordMayBeMinted: false,
    });

    for (const blocker of decision.blockers) {
      expect(blocker.blockerId).toMatch(/^p9xgb_471_/);
      expect(blocker.owner.length).toBeGreaterThan(0);
      expect(blocker.evidenceRefs.length).toBeGreaterThan(0);
      expect(blocker.sourceRefs.length).toBeGreaterThan(0);
      expect(blocker.nextSafeAction.length).toBeGreaterThan(0);
      expect(blocker.blockerHash).toMatch(/^[a-f0-9]{64}$/);
    }
  });

  it("treats missing mandatory proof as a hard blocker", () => {
    const fixture = createPhase9ExitGateFixture();
    const decision = fixture.missingProofDecision;
    expect(decision.decisionState).toBe("blocked");
    expect(decision.checklistRows).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          proofFamilyId: "restore_failover_chaos",
          rowState: "missing",
          mandatory: true,
        }),
      ]),
    );
    expect(decision.blockers).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          proofFamilyId: "restore_failover_chaos",
          blockerState: "missing",
        }),
      ]),
    );
  });

  it("does not let a deferred live-channel scope hide current runtime dependencies", () => {
    const service = new Phase9ExitGateService();
    const input = createPhase9ExitGateExactEvaluationInput();
    const decision = service.attemptExitGateApproval(input);
    const deferredRow = decision.checklistRows.find(
      (row) => row.proofFamilyId === "phase7_deferred_channel_scope",
    );
    expect(deferredRow).toMatchObject({
      mandatory: false,
      permittedDeferredScope: true,
      rowState: "deferred_scope",
    });
    expect(deferredRow?.deferredScopeNote).toContain("Phase 7 live NHS App traffic remains deferred");
    expect(decision.decisionState).toBe("approved");
  });
});
