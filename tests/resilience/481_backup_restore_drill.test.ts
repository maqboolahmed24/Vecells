import { describe, expect, it } from "vitest";
import {
  build481GoLiveSmokeScenarios,
  build481Records,
  hashValue,
  required481EdgeCases,
} from "../../tools/testing/run_481_dr_go_live_smoke";

describe("481 backup and restore drill contracts", () => {
  it("covers every required DR/go-live edge case", () => {
    const scenarios = build481GoLiveSmokeScenarios();
    const edgeCases = new Set(scenarios.flatMap((scenario) => scenario.requiredEdgeCaseRefs));

    for (const edgeCase of required481EdgeCases) {
      expect(edgeCases.has(edgeCase)).toBe(true);
    }
  });

  it("keeps the approved Wave 1 DR smoke run green while retaining blocked drills as evidence", () => {
    const records = build481Records([]);

    expect(records.finalRun.smokeVerdict).toBe("go_live_smoke_green");
    expect(records.finalRun.blockerRefs).toEqual([]);
    expect(records.backupRestoreEvidence.some((evidence) => evidence.state === "blocked")).toBe(
      true,
    );
  });

  it("blocks when backup exists but restore report channel is missing", () => {
    const records = build481Records([]);
    const missingChannel = records.restoreReportChannels.find(
      (evidence) => evidence.scenarioRef === "gls_481_restore_channel_missing",
    );

    expect(missingChannel?.configured).toBe(false);
    expect(missingChannel?.state).toBe("blocked");
    expect(missingChannel?.blockerRefs).toContain("blocker:481:restore-report-channel-missing");
  });

  it("hashes typed evidence deterministically", () => {
    const records = build481Records([]);
    const { recordHash, ...withoutHash } = records.finalRun;

    expect(recordHash).toBe(hashValue(withoutHash));
  });
});
