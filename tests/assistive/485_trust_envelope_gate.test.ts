import { describe, expect, it } from "vitest";
import {
  build485Records,
  build485ScenarioRecords,
  hashValue,
  required485EdgeCases,
} from "../../tools/assistive/enable_485_visible_modes";

describe("485 assistive trust envelope gate", () => {
  it("enables visible insert only when current trust envelope and rollout verdict are exact", () => {
    const approved = build485ScenarioRecords("visible_insert_approved", []);

    expect(approved.trustProjection.trustState).toBe("trusted");
    expect(approved.rolloutVerdict.rolloutRung).toBe("visible_insert");
    expect(approved.trustEnvelope.actionabilityState).toBe("enabled");
    expect(approved.eligibilityVerdict.eligibleMode).toBe("visible_insert");
    expect(approved.eligibilityVerdict.visibleInsertAllowed).toBe(true);
    expect(approved.eligibilityVerdict.insertControlsVisible).toBe(true);
    expect(approved.settlement.result).toBe("applied");
  });

  it("does not widen from a healthy trust projection when the route verdict is shadow-only", () => {
    const shadow = build485ScenarioRecords("route_verdict_shadow_only", []);

    expect(shadow.trustProjection.trustState).toBe("trusted");
    expect(shadow.rolloutVerdict.rolloutRung).toBe("shadow_only");
    expect(shadow.eligibilityVerdict.eligibleMode).toBe("shadow");
    expect(shadow.eligibilityVerdict.visibleSummaryAllowed).toBe(false);
    expect(shadow.eligibilityVerdict.visibleInsertAllowed).toBe(false);
    expect(shadow.settlement.result).toBe("held_shadow");
  });

  it("suppresses insert, regenerate, export, and completion-adjacent controls on envelope downgrade", () => {
    const downgraded = build485ScenarioRecords("envelope_downgrade_mid_session", []);

    expect(downgraded.trustEnvelope.trustState).toBe("degraded");
    expect(downgraded.trustEnvelope.surfacePostureState).toBe("observe_only");
    expect(downgraded.trustEnvelope.actionabilityState).toBe("regenerate_only");
    expect(downgraded.eligibilityVerdict.visibleInsertAllowed).toBe(false);
    expect(downgraded.eligibilityVerdict.insertControlsVisible).toBe(false);
    expect(downgraded.eligibilityVerdict.exportControlsVisible).toBe(false);
    expect(downgraded.eligibilityVerdict.provenanceVisible).toBe(true);
  });

  it("uses current kill-switch state rather than historical kill-switch command presence", () => {
    const clear = build485ScenarioRecords("historical_kill_switch_clear", []);

    expect(clear.trustProjection.assistiveKillSwitchStateRef).toContain("_clear");
    expect(clear.trustProjection.thresholdState).toBe("green");
    expect(clear.eligibilityVerdict.eligibleMode).toBe("visible_insert");
    expect(clear.eligibilityVerdict.visibleInsertAllowed).toBe(true);
    expect(clear.eligibilityVerdict.blockerRefs).toEqual([]);
  });

  it("keeps visible commit as a ceiling until concrete human approval is present", () => {
    const commit = build485ScenarioRecords("commit_missing_human_approval", []);

    expect(commit.rolloutVerdict.rolloutRung).toBe("visible_commit");
    expect(commit.eligibilityVerdict.visibleCommitCeilingAllowed).toBe(true);
    expect(commit.eligibilityVerdict.concreteCommitAllowed).toBe(false);
    expect(commit.humanAcknowledgement.approvalGateState).toBe("missing");
    expect(commit.settlement.result).toBe("blocked_approval");
  });

  it("covers every required 485 edge case and hashes eligibility deterministically", () => {
    const records = build485Records([]);
    const edgeCaseIds = new Set(
      (records.edgeCaseFixtures.fixtures as any[]).map((fixture) => fixture.edgeCaseId),
    );
    for (const edgeCase of required485EdgeCases) {
      expect(edgeCaseIds.has(edgeCase)).toBe(true);
    }

    const { recordHash, ...withoutHash } = records.activeScenario.eligibilityVerdict;
    expect(recordHash).toBe(hashValue(withoutHash));
  });
});
