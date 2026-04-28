import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { writePhase9ExitGateArtifacts } from "../../tools/assurance/run_471_phase9_exit_gate";
import { PHASE9_EXIT_GATE_VERSION } from "../../packages/domains/analytics_assurance/src/index";

const root = path.resolve(__dirname, "..", "..");

function loadEvidence() {
  const evidencePath = path.join(root, "data/evidence/471_phase9_exit_gate_decision.json");
  if (!fs.existsSync(evidencePath)) {
    writePhase9ExitGateArtifacts();
  }
  return JSON.parse(fs.readFileSync(evidencePath, "utf8"));
}

describe("471 Phase 9 exit gate exact decision", () => {
  it("approves only when every mandatory proof row is exact", () => {
    const evidence = loadEvidence();
    const decision = evidence.decision;
    expect(decision.schemaVersion).toBe(PHASE9_EXIT_GATE_VERSION);
    expect(decision.decisionState).toBe("approved");
    expect(decision.approvalPermitted).toBe(true);
    expect(decision.blockers).toEqual([]);
    expect(decision.crossPhaseConformanceScorecardState).toBe("exact");
    expect(decision.noSev1OrSev2Defects).toBe(true);
    expect(decision.checklistRows.length).toBeGreaterThanOrEqual(16);

    for (const row of decision.checklistRows) {
      if (row.mandatory) {
        expect(row.rowState, row.proofFamilyId).toBe("exact");
      }
    }
  });

  it("writes a metadata-only WORM audit entry and authoritative settlement", () => {
    const evidence = loadEvidence();
    const decision = evidence.decision;
    expect(decision.auditRecord).toMatchObject({
      wormAppendState: "appended",
      payloadClass: "metadata_only",
    });
    expect(decision.auditRecord.auditHash).toMatch(/^[a-f0-9]{64}$/);
    expect(decision.settlement.settledDecisionState).toBe("approved");
    expect(decision.settlement.completionEvidenceBundleHash).toBe(
      decision.completionEvidenceBundle.completionEvidenceBundleHash,
    );
    expect(decision.settlement.settlementHash).toMatch(/^[a-f0-9]{64}$/);
  });

  it("permits ReleaseToBAURecord creation only after exact scorecard and approved gate", () => {
    const evidence = loadEvidence();
    const decision = evidence.decision;
    expect(decision.releaseToBAURecordGuard).toMatchObject({
      guardState: "permitted",
      releaseToBAURecordMayBeMinted: true,
    });
    expect(decision.bauReadinessPackState).toBe("signed_off");
    expect(decision.onCallMatrixState).toBe("validated");
    expect(decision.runbookBundleState).toBe("current");
  });
});
