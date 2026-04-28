import { describe, expect, it } from "vitest";
import { build484ScenarioRecords } from "../../tools/release/promote_484_guardrailed_canaries";

describe("484 canary pause and rollback handling", () => {
  it("requires a pause when a canary breaches after settlement but before dwell completion", () => {
    const paused = build484ScenarioRecords("guardrail_breach_after_settlement", []);

    expect(paused.decision.decisionState).toBe("pause_required");
    expect(paused.action.commandState).toBe("accepted");
    expect(paused.settlement.result).toBe("blocked_guardrail");
    expect(paused.settlement.observedWaveState).toBe("paused");
    expect(paused.settlement.observationState).toBe("halted");
    expect(paused.pauseRecord?.state).toBe("recommended");
    expect(paused.pauseRecord?.reasonCode).toBe(
      "blocker:484:guardrail-breach-after-settlement-before-dwell",
    );
  });

  it("does not mark rollback complete when channel embedding recovery is missing", () => {
    const rollback = build484ScenarioRecords("rollback_channel_gap", []);

    expect(rollback.decision.decisionState).toBe("rollback_required");
    expect(rollback.settlement.result).toBe("evidence_required");
    expect(rollback.settlement.observedWaveState).toBe("rolled_back");
    expect(rollback.settlement.observationState).toBe("rollback_required");
    expect(rollback.rollbackRecord?.routeRollbackReadinessState).toBe("ready");
    expect(rollback.rollbackRecord?.channelRollbackReadinessState).toBe("blocked");
    expect(rollback.rollbackRecord?.state).toBe("blocked");
  });

  it("blocks conflicting canary scopes for the same tenant", () => {
    const conflict = build484ScenarioRecords("conflicting_scope", []);

    expect(conflict.selector.selectorState).toBe("conflict");
    expect(conflict.tenantEligibility.eligibilityState).toBe("blocked");
    expect(conflict.blastRadiusProof.blastRadiusState).toBe("blocked");
    expect(conflict.decision.decisionState).toBe("blocked");
    expect(conflict.settlement.result).toBe("denied_scope");
  });

  it("supersedes a stale action when the observation policy changes after approval", () => {
    const stale = build484ScenarioRecords("policy_changed_after_approval", []);

    expect(stale.decision.decisionState).toBe("stale");
    expect(stale.action.commandState).toBe("stale");
    expect(stale.settlement.result).toBe("stale_wave");
    expect(stale.settlement.observationState).toBe("superseded");
    expect(stale.remainingPolicy.policyState).toBe("superseded");
    expect(stale.remainingPolicy.supersedesPolicyRef).toBe(stale.remainingPolicy.sourcePolicyRef);
  });
});
