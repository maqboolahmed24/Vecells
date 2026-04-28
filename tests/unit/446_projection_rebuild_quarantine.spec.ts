import { describe, expect, it } from "vitest";
import { createPhase9ProjectionRebuildQuarantineFixture } from "../../packages/domains/analytics_assurance/src/index.ts";

describe("446 Phase 9 projection rebuild quarantine", () => {
  it("deterministic rebuild from raw events", () => {
    const fixture = createPhase9ProjectionRebuildQuarantineFixture();

    expect(fixture.deterministicRebuildRun.runState).toBe("matched");
    expect(fixture.deterministicRebuildRun.observedInputRefs).toEqual(
      fixture.deterministicRebuildRun.expectedInputRefs,
    );
    expect(fixture.deterministicRebuildRun.rebuildHash).toMatch(/^[a-f0-9]{64}$/);
  });

  it("rebuild hash equality and inequality", () => {
    const fixture = createPhase9ProjectionRebuildQuarantineFixture();

    expect(fixture.matchingComparison.equal).toBe(true);
    expect(fixture.deterministicRebuildRun.snapshotHash).toBe(
      fixture.deterministicRebuildRun.rebuildHash,
    );
    expect(fixture.divergentComparison.equal).toBe(false);
    expect(fixture.divergentRebuildRun.snapshotHash).not.toBe(
      fixture.divergentRebuildRun.rebuildHash,
    );
  });

  it("command-following exact replay requirement", () => {
    const fixture = createPhase9ProjectionRebuildQuarantineFixture();

    expect(fixture.commandFollowingRun.replayRequirement).toBe("exact");
    expect(fixture.commandFollowingRun.replayMatchScore).toBe(0);
    expect(fixture.commandFollowingRun.runState).toBe("blocked");
    expect(fixture.commandFollowingRun.blockerRefs).toContain("rebuild-hash-mismatch");
  });

  it("out-of-order event quarantine", () => {
    const fixture = createPhase9ProjectionRebuildQuarantineFixture();

    expect(fixture.outOfOrderDecision.decision).toBe("quarantined");
    expect(fixture.outOfOrderDecision.quarantineRecord?.quarantineReason).toBe(
      "out_of_order_sequence",
    );
    expect(fixture.outOfOrderDecision.checkpoint.quarantineState).toBe("quarantined");
  });

  it("conflicting duplicate quarantine and exact duplicate idempotency", () => {
    const fixture = createPhase9ProjectionRebuildQuarantineFixture();

    expect(fixture.exactDuplicateDecision.decision).toBe("idempotent_duplicate");
    expect(fixture.conflictingDuplicateDecision.decision).toBe("quarantined");
    expect(fixture.conflictingDuplicateDecision.quarantineRecord?.quarantineReason).toBe(
      "conflicting_duplicate",
    );
  });

  it("incompatible schema quarantine", () => {
    const fixture = createPhase9ProjectionRebuildQuarantineFixture();

    expect(fixture.incompatibleSchemaDecision.decision).toBe("quarantined");
    expect(fixture.incompatibleSchemaDecision.quarantineRecord?.quarantineReason).toBe(
      "incompatible_schema",
    );
  });

  it("unknown mandatory namespace quarantine", () => {
    const fixture = createPhase9ProjectionRebuildQuarantineFixture();

    expect(fixture.unknownNamespaceDecision.decision).toBe("quarantined");
    expect(fixture.unknownNamespaceDecision.quarantineRecord?.quarantineReason).toBe(
      "unknown_mandatory_namespace",
    );
  });

  it("slice-bounded quarantine that preserves unaffected slices", () => {
    const fixture = createPhase9ProjectionRebuildQuarantineFixture();

    expect(fixture.hardBlockedSliceEvaluation.trustState).toBe("quarantined");
    expect(fixture.hardBlockedSliceEvaluation.blockingNamespaceRefs).toEqual([
      "resilience.recovery.evidence",
    ]);
    expect(fixture.unaffectedSliceEvaluation.trustState).toBe("trusted");
    expect(fixture.unaffectedSliceEvaluation.blockingNamespaceRefs).toEqual([]);
  });

  it("trust hysteresis thresholds", () => {
    const fixture = createPhase9ProjectionRebuildQuarantineFixture();

    expect(fixture.trustedSliceFirstEvaluation.trustLowerBound).toBeGreaterThanOrEqual(0.88);
    expect(fixture.trustedSliceFirstEvaluation.trustState).toBe("degraded");
    expect(fixture.trustedSliceSecondEvaluation.trustState).toBe("trusted");
    expect(fixture.degradedSliceEvaluation.trustLowerBound).toBeLessThan(0.88);
    expect(fixture.degradedSliceEvaluation.trustState).toBe("degraded");
  });

  it("hard block immediate quarantine", () => {
    const fixture = createPhase9ProjectionRebuildQuarantineFixture();

    expect(fixture.hardBlockedSliceEvaluation.hardBlockState).toBe(true);
    expect(fixture.hardBlockedSliceEvaluation.trustState).toBe("quarantined");
    expect(fixture.hardBlockedSliceEvaluation.completenessState).toBe("blocked");
  });

  it("control status cannot be satisfied on quarantined required evidence", () => {
    const fixture = createPhase9ProjectionRebuildQuarantineFixture();

    expect(fixture.quarantinedControlStatus.state).toBe("blocked");
    expect(fixture.quarantinedControlStatus.coverageState).toBe("blocked");
    expect(fixture.quarantinedControlStatus.gapReasonRefs.length).toBeGreaterThan(0);
  });

  it("operations slice actionability downgrade", () => {
    const fixture = createPhase9ProjectionRebuildQuarantineFixture();

    expect(fixture.downgradedOpsSliceEnvelope.trustState).toBe("quarantined");
    expect(fixture.downgradedOpsSliceEnvelope.actionEligibilityState).toBe("blocked");
    expect(fixture.downgradedOpsSliceEnvelope.renderMode).toBe("blocked");
  });

  it("degraded-slice pack attestation gate", () => {
    const fixture = createPhase9ProjectionRebuildQuarantineFixture();

    expect(fixture.degradedSliceAttestationGate.gateState).toBe("attestation_required");
    expect(fixture.degradedSliceAttestationGate.blockerRefs).toContain(
      "missing-degraded-slice-attestation",
    );
  });

  it("quarantine release with replay equality", () => {
    const fixture = createPhase9ProjectionRebuildQuarantineFixture();

    expect(fixture.releasedQuarantineRecord.quarantineState).toBe("released");
    expect(fixture.releasedQuarantineRecord.supersedesQuarantineRecordRef).toMatch(/^pnqr_446_/);
    expect(fixture.releaseTrustRecord.trustState).toBe("trusted");
  });

  it("tenant isolation and authorization", () => {
    const fixture = createPhase9ProjectionRebuildQuarantineFixture();

    expect(fixture.tenantDeniedErrorCode).toBe("PROJECTION_QUARANTINE_TENANT_DENIED");
    expect(fixture.authorizationDeniedErrorCode).toBe("PROJECTION_QUARANTINE_ROLE_DENIED");
  });

  it("audit/assurance-ledger writeback for quarantine and release", () => {
    const fixture = createPhase9ProjectionRebuildQuarantineFixture();

    expect(fixture.quarantineLedgerWriteback.assuranceLedgerEntry.entryType).toBe(
      "trust_evaluation",
    );
    expect(fixture.releaseLedgerWriteback.assuranceLedgerEntry.previousHash).toBe(
      fixture.quarantineLedgerWriteback.assuranceLedgerEntry.hash,
    );
    expect(fixture.releaseLedgerWriteback.assuranceLedgerEntry.hash).toMatch(/^[a-f0-9]{64}$/);
  });
});
