import { describe, expect, it } from "vitest";

import {
  buildCollisionBindings,
  buildSnapshotCommand,
  setupNetworkCapacityHarness,
} from "../../../../tests/integration/318_network_capacity.helpers.ts";

describe("phase5 network capacity pipeline", () => {
  it("deduplicates overlapping capacity units and keeps the stronger source admission", async () => {
    const harness = await setupNetworkCapacityHarness("318_unit_collision");
    const result = await harness.service.buildCandidateSnapshotForCase({
      ...buildSnapshotCommand("318_unit_collision"),
      hubCoordinationCaseId: harness.claimed.hubCase.hubCoordinationCaseId,
      adapterBindings: buildCollisionBindings("318_unit_collision"),
      deliveredMinutes: 30,
      cancelledMinutes: 0,
      replacementMinutes: 0,
    });

    expect(result.candidates).toHaveLength(1);
    expect(result.candidates[0]?.sourceTrustState).toBe("trusted");
    expect(result.supplyExceptions.map((value) => value.exceptionCode)).toContain(
      "CAPACITY_DEDUPE_COLLISION",
    );
    expect(result.decisionPlan?.directCommitFrontierRefs).toEqual([
      result.candidates[0]!.candidateId,
    ]);
  });

  it("replays a stored snapshot fixture without semantic drift", async () => {
    const harness = await setupNetworkCapacityHarness("318_unit_replay");
    const initial = await harness.service.buildCandidateSnapshotForCase({
      ...buildSnapshotCommand("318_unit_replay"),
      hubCoordinationCaseId: harness.claimed.hubCase.hubCoordinationCaseId,
    });

    expect(initial.snapshot).not.toBeNull();
    const replay = await harness.service.replayCandidateSnapshot({
      snapshotId: initial.snapshotId,
    });

    expect(replay.matchesStoredSnapshot).toBe(true);
    expect(replay.mismatchFields).toEqual([]);
    expect(replay.rankProof?.proofChecksum).toBe(initial.rankProof?.proofChecksum);
    expect(replay.snapshot?.policyTupleHash).toBe(initial.snapshot?.policyTupleHash);
  });
});
