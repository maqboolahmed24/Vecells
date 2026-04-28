import { describe, expect, it } from "vitest";
import { buildPhase9RestoreFailoverChaosSliceQuarantineSuite } from "../../tools/test/run_phase9_restore_failover_chaos_slice_quarantine";

describe("468 assurance slice quarantine contract", () => {
  it("detects projection rebuild mismatch and freezes only the affected slice", () => {
    const { fixture, evidence } = buildPhase9RestoreFailoverChaosSliceQuarantineSuite();
    expect(fixture.projectionQuarantine.divergentRebuildRun.runState).toBe("diverged");
    expect(fixture.projectionQuarantine.divergentComparison.equal).toBe(false);
    expect(fixture.projectionQuarantine.hardBlockedSliceEvaluation.trustState).toBe("quarantined");
    expect(fixture.projectionQuarantine.quarantineImpactExplanation.sliceRef).toBe(
      fixture.projectionQuarantine.hardBlockedSliceEvaluation.sliceRef,
    );
    expect(fixture.projectionQuarantine.quarantineImpactExplanation.impactedSurfaces).toEqual(
      expect.arrayContaining(["operations", "assurance_pack", "retention", "resilience"]),
    );
    expect(fixture.projectionQuarantine.unaffectedSliceEvaluation.trustState).toBe("trusted");
    expect(evidence.coverage.projectionRebuildMismatchAndSliceBoundedQuarantine).toBe(true);
    expect(evidence.gapClosures.globalQuarantineGap).toBe(true);
  });

  it("keeps degraded attestation and release writeback explicit", () => {
    const { fixture } = buildPhase9RestoreFailoverChaosSliceQuarantineSuite();
    expect(fixture.projectionQuarantine.degradedSliceAttestationGate.gateState).toBe(
      "attestation_required",
    );
    expect(fixture.projectionQuarantine.quarantineLedgerWriteback.eventType).toBe("quarantine");
    expect(fixture.projectionQuarantine.releaseLedgerWriteback.eventType).toBe("release");
    expect(
      fixture.projectionQuarantine.releaseLedgerWriteback.assuranceLedgerEntry.previousHash,
    ).toBe(fixture.projectionQuarantine.quarantineLedgerWriteback.assuranceLedgerEntry.hash);
  });
});
