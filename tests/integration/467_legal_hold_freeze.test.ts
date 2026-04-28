import { describe, expect, it } from "vitest";
import { buildPhase9RetentionLegalHoldWormReplaySuite } from "../../tools/test/run_phase9_retention_legal_hold_worm_replay";

describe("467 legal hold and retention freeze hardening", () => {
  it("blocks disposition when active legal hold and freeze refs are in scope", () => {
    const { fixture, evidence } = buildPhase9RetentionLegalHoldWormReplaySuite();
    const activeHold = fixture.legalHoldFreezeCases.activeHold;

    expect(evidence.coverage.legalHoldAndFreeze).toBe(true);
    expect(activeHold.result).toBe("blocked");
    expect(activeHold.activeLegalHoldRefs).toContain(activeHold.legalHoldRecordRef);
    expect(activeHold.activeFreezeRefs).toContain(activeHold.freezeRef);
    expect(activeHold.blockerRefs).toEqual(
      expect.arrayContaining([
        `freeze:active:${activeHold.freezeRef}`,
        `legal-hold:active:${activeHold.legalHoldRecordRef}`,
      ]),
    );
    expect(activeHold.scopeHash).toMatch(/^[a-f0-9]{64}$/);
  });

  it("requires a superseding assessment after legal hold release", () => {
    const { fixture } = buildPhase9RetentionLegalHoldWormReplaySuite();
    const released = fixture.legalHoldFreezeCases.releasedHoldSupersession;

    expect(released.releasedHoldRef).toContain("_released");
    expect(released.supersedesHoldRef).toMatch(/^lhr_442_/);
    expect(released.oldAssessmentJobState).toBe("blocked");
    expect(released.supersedingAssessmentJobState).toBe("queued");
    expect(released.blockerRefs.some((ref) => ref.includes("hold-state"))).toBe(true);
  });

  it("keeps denied purpose and mismatched tenant scope closed", () => {
    const { fixture, evidence } = buildPhase9RetentionLegalHoldWormReplaySuite();

    expect(evidence.coverage.permissionDeniedAndScopeMismatch).toBe(true);
    expect(fixture.scopeGuardCases.permissionDeniedProjection).toBe("blocked");
    expect(fixture.scopeGuardCases.tenantDeniedErrorCode).toBe("DISPOSITION_TENANT_SCOPE_DENIED");
    expect(fixture.scopeGuardCases.purposeDeniedErrorCode).toBe(
      "DISPOSITION_PURPOSE_OF_USE_DENIED",
    );
  });
});
