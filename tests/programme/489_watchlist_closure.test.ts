import { describe, expect, it } from "vitest";
import {
  build489ScenarioRecords,
  hashValue,
  required489EdgeCases,
  write489ProgrammeClosureArtifacts,
} from "../../tools/programme/close_489_master_watchlist";

describe("489 master dependency watchlist closure", () => {
  it("closes the active programme only with explicit unresolved transfers", () => {
    write489ProgrammeClosureArtifacts();
    const records = build489ScenarioRecords("complete_with_transfers", []);

    expect(records.closure.closureState).toBe("complete_with_transfers");
    expect(records.finalState.finalState).toBe("complete_with_transfers");
    expect(records.finalState.completionLanguageGuard).toBe("ongoing_ownership_explicit");
    expect(records.finalState.activeWaveObservationState).toBe("satisfied");
    expect(records.closure.blockerRefs).toEqual([]);
    expect(records.transfers.length).toBeGreaterThanOrEqual(5);
    expect(records.transfers.every((transfer) => transfer.owner && transfer.nextReviewDate)).toBe(true);
    expect(records.evidenceSeal.archiveWormSealDigest).toBe(records.finalState.archiveWormSealDigest);
    expect(records.settlement.authoritativeOutcomeState).toBe("settled");
  });

  it("blocks every required stale, unauthorized, conflicting and active-wave edge case", () => {
    for (const scenarioId of required489EdgeCases) {
      const records = build489ScenarioRecords(scenarioId, []);

      expect(records.closure.closureState, scenarioId).toBe("blocked");
      expect(records.finalState.finalState, scenarioId).toBe("blocked");
      expect(records.closure.blockerRefs.length, scenarioId).toBeGreaterThan(0);
      expect(records.settlement.authoritativeOutcomeState, scenarioId).toBe("recovery_required");
    }
  });

  it("keeps closure hashes deterministic across repeated fixture runs", () => {
    const first = build489ScenarioRecords("complete_with_transfers", []);
    const second = build489ScenarioRecords("complete_with_transfers", []);
    const { recordHash: _recordHash, ...withoutHash } = first.closure;

    expect(first.closure.recordHash).toBe(second.closure.recordHash);
    expect(first.evidenceSeal.sealHash).toBe(second.evidenceSeal.sealHash);
    expect(hashValue(withoutHash)).toBe(first.closure.recordHash);
  });
});
