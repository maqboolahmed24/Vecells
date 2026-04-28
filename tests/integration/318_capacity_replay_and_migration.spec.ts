import fs from "node:fs";

import { describe, expect, it } from "vitest";

import {
  buildSnapshotCommand,
  setupNetworkCapacityHarness,
} from "./318_network_capacity.helpers.ts";

const MIGRATION_PATH =
  "/Users/test/Code/V/services/command-api/migrations/146_phase5_network_capacity_snapshot_pipeline.sql";

describe("318 capacity replay and migration", () => {
  it("rebuilds the same ranked surface from the stored replay fixture", async () => {
    const harness = await setupNetworkCapacityHarness("318_replay");
    const initial = await harness.service.buildCandidateSnapshotForCase({
      ...buildSnapshotCommand("318_replay"),
      hubCoordinationCaseId: harness.claimed.hubCase.hubCoordinationCaseId,
    });

    const replay = await harness.service.replayCandidateSnapshot({
      snapshotId: initial.snapshotId,
    });

    expect(replay.matchesStoredSnapshot).toBe(true);
    expect(replay.decisionPlan?.orderedCandidateRefs).toEqual(
      initial.decisionPlan?.orderedCandidateRefs,
    );
    expect(replay.rankProof?.rankedCandidates).toEqual(initial.rankProof?.rankedCandidates);
  });

  it("declares the 318 persistence tables in the command-api migration", () => {
    const sql = fs.readFileSync(MIGRATION_PATH, "utf8");

    for (const tableName of [
      "phase5_network_capacity_adapter_runs",
      "phase5_capacity_source_trust_admissions",
      "phase5_network_slot_candidates",
      "phase5_network_candidate_snapshots",
      "phase5_capacity_rank_proofs",
      "phase5_capacity_rank_explanations",
      "phase5_cross_site_decision_plans",
      "phase5_enhanced_access_minutes_ledgers",
      "phase5_cancellation_make_up_ledgers",
      "phase5_capacity_supply_exceptions",
      "phase5_network_capacity_replay_fixtures",
    ]) {
      expect(sql).toContain(tableName);
    }
  });
});
