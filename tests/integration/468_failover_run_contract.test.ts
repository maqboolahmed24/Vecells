import { describe, expect, it } from "vitest";
import { buildPhase9RestoreFailoverChaosSliceQuarantineSuite } from "../../tools/test/run_phase9_restore_failover_chaos_slice_quarantine";

describe("468 failover run contract", () => {
  it("settles failover activation, validation, and stand-down against the current tuple", () => {
    const { fixture, evidence } = buildPhase9RestoreFailoverChaosSliceQuarantineSuite();
    expect(fixture.failoverRunCases.approvedScenario).toMatch(/^fos_445_/);
    expect(fixture.failoverRunCases.activatedRun.resultState).toBe("active");
    expect(fixture.failoverRunCases.activatedRun.validationState).toBe("pending");
    expect(fixture.failoverRunCases.validatedRun.validationState).toBe("complete");
    expect(fixture.failoverRunCases.stoodDownRun.resultState).toBe("stood_down");
    expect(fixture.failoverRunCases.stoodDownRun.validationState).toBe("complete");
    expect(fixture.failoverRunCases.stoodDownRun.settlementRef).toMatch(/^ras_445_/);
    expect(evidence.coverage.failoverActivationValidationStandDownSettlement).toBe(true);
  });

  it("invalidates stale failover and old game-day evidence through settlement, not local logs", () => {
    const { fixture, evidence } = buildPhase9RestoreFailoverChaosSliceQuarantineSuite();
    expect(fixture.failoverRunCases.staleScopeSettlement.result).toBe("stale_scope");
    expect(fixture.oldGameDayInvalidation.failover.resultState).toBe("superseded");
    expect(fixture.oldGameDayInvalidation.tupleDriftSettlement.result).toBe("stale_scope");
    expect(fixture.oldGameDayInvalidation.tupleDriftSettlement.authoritativeRunRefs).toEqual(
      expect.arrayContaining([
        fixture.oldGameDayInvalidation.restore.restoreRunId,
        fixture.oldGameDayInvalidation.failover.failoverRunId,
        fixture.oldGameDayInvalidation.chaos.chaosRunId,
      ]),
    );
    expect(evidence.gapClosures.logCompletionGap).toBe(true);
    expect(evidence.gapClosures.oldGameDayGap).toBe(true);
  });
});
