import { describe, expect, it } from "vitest";
import {
  build487ScenarioRecords,
  hashValue,
  required487EdgeCases,
  write487BAUHandoverArtifacts,
} from "../../tools/bau/complete_487_bau_handover";

describe("487 BAU handover pack", () => {
  it("settles the active handover with constraints but no launch blockers", () => {
    write487BAUHandoverArtifacts();
    const records = build487ScenarioRecords("accepted_with_constraints", []);

    expect(records.pack.verdict).toBe("accepted_with_constraints");
    expect(records.pack.signoffState).toBe("signed_off_with_constraints");
    expect(records.pack.releaseToBAURecordRef).toMatch(/^release_to_bau_record_487_/);
    expect(records.pack.blockerRefs).toEqual([]);
    expect(records.pack.constraintRefs.length).toBeGreaterThan(0);
    expect(records.command.roleAuthorizationRef).toContain("service-owner");
    expect(records.command.idempotencyKey).toContain("487");
    expect(records.command.purposeBindingRef).toBe("purpose:programme-to-bau-transfer");
    expect(records.settlement.result).toBe(records.pack.verdict);
    expect(records.settlement.wormAuditRef).toContain("worm-ledger:487");
  });

  it("blocks every required fail-closed edge case", () => {
    for (const scenarioId of required487EdgeCases) {
      const records = build487ScenarioRecords(scenarioId, []);
      expect(records.pack.verdict, scenarioId).toBe("blocked");
      expect(records.pack.releaseToBAURecordRef, scenarioId).toBeNull();
      expect(records.pack.blockerRefs.length, scenarioId).toBeGreaterThan(0);
      expect(records.settlement.recoveryActionRef, scenarioId).toBe(
        "recovery:487:keep-programme-launch-mode",
      );
    }
  });

  it("keeps deterministic hashes stable and bound to source refs", () => {
    const first = build487ScenarioRecords("accepted_with_constraints", []);
    const second = build487ScenarioRecords("accepted_with_constraints", []);
    const { recordHash: _hash, ...withoutHash } = first.pack;

    expect(first.pack.recordHash).toBe(second.pack.recordHash);
    expect(hashValue(withoutHash)).toBe(first.pack.recordHash);
    expect(first.pack.sourceRefs).toContain("prompt/487.md");
    expect(first.pack.evidenceRefs).toContain("data/channel/486_nhs_app_channel_enablement_settlement.json");
  });
});
