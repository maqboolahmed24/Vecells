import { describe, expect, it } from "vitest";
import { buildPhase9RestoreFailoverChaosSliceQuarantineSuite } from "../../tools/test/run_phase9_restore_failover_chaos_slice_quarantine";

describe("468 chaos run contract", () => {
  it("covers schedule, start, halt, complete, guardrail, and blast-radius cases", () => {
    const { fixture, evidence } = buildPhase9RestoreFailoverChaosSliceQuarantineSuite();
    expect(fixture.chaosLifecycleCases.map((row) => row.state)).toEqual([
      "scheduled",
      "running",
      "halted",
      "completed",
      "guardrail_blocked",
    ]);
    expect(fixture.chaosLifecycleCases.find((row) => row.state === "scheduled")?.guardrailState)
      .toBe("approved");
    expect(fixture.chaosLifecycleCases.find((row) => row.state === "running")?.settlementResult)
      .toBe("applied");
    expect(fixture.chaosLifecycleCases.find((row) => row.state === "halted")?.guardrailState).toBe(
      "constrained",
    );
    expect(fixture.chaosLifecycleCases.find((row) => row.state === "completed")?.blastRadiusRef)
      .toBe("blast-radius:single-route-family");
    expect(
      fixture.chaosLifecycleCases.find((row) => row.state === "guardrail_blocked")
        ?.settlementResult,
    ).toBe("blocked_guardrail");
    expect(evidence.coverage.chaosGuardrailsAndBlastRadius).toBe(true);
  });

  it("does not allow unbounded chaos evidence to satisfy recovery authority", () => {
    const { fixture } = buildPhase9RestoreFailoverChaosSliceQuarantineSuite();
    const blocked = fixture.chaosLifecycleCases.find((row) => row.state === "guardrail_blocked");
    expect(blocked?.blastRadiusRef).toBe("blast-radius:unbounded-production");
    expect(blocked?.settlementResult).toBe("blocked_guardrail");
    expect(fixture.uiStateCoverage.find((row) => row.state === "guardrail-constrained")?.covered)
      .toBe(true);
  });
});
