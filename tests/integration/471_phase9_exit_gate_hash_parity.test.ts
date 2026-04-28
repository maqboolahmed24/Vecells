import { describe, expect, it } from "vitest";
import {
  Phase9ExitGateService,
  createPhase9ExitGateExactEvaluationInput,
  createPhase9ExitGateFixture,
} from "../../packages/domains/analytics_assurance/src/index";

describe("471 Phase 9 exit gate hash parity", () => {
  it("recomputes identical bundle, settlement, and decision hashes for identical proof", () => {
    const first = createPhase9ExitGateFixture();
    const second = createPhase9ExitGateFixture();
    expect(first.exactDecision.completionEvidenceBundle.completionEvidenceBundleHash).toBe(
      second.exactDecision.completionEvidenceBundle.completionEvidenceBundleHash,
    );
    expect(first.exactDecision.settlement.settlementHash).toBe(
      second.exactDecision.settlement.settlementHash,
    );
    expect(first.exactDecision.decisionHash).toBe(second.exactDecision.decisionHash);
    expect(first.replayHash).toBe(second.replayHash);
  });

  it("changes the bundle hash and blocks approval when a mandatory proof hash goes stale", () => {
    const service = new Phase9ExitGateService();
    const exactInput = createPhase9ExitGateExactEvaluationInput();
    const exactDecision = service.attemptExitGateApproval(exactInput);
    const staleDecision = service.attemptExitGateApproval({
      ...exactInput,
      command: {
        ...exactInput.command,
        idempotencyKey: "idem:471:phase9-exit-gate:hash-drift",
      },
      proofFamilies: exactInput.proofFamilies.map((proofFamily) =>
        proofFamily.proofFamilyId === "assurance_ledger_integrity"
          ? {
              ...proofFamily,
              evidenceFreshnessState: "stale",
              currentProofHashes: ["proof:432:stale"],
            }
          : proofFamily,
      ),
    });
    expect(staleDecision.decisionState).toBe("blocked");
    expect(staleDecision.blockers).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          proofFamilyId: "assurance_ledger_integrity",
          blockerState: "stale",
        }),
      ]),
    );
    expect(staleDecision.completionEvidenceBundle.completionEvidenceBundleHash).not.toBe(
      exactDecision.completionEvidenceBundle.completionEvidenceBundleHash,
    );
  });
});
