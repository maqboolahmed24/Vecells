import { describe, expect, it } from "vitest";
import {
  build484Records,
  build484ScenarioRecords,
  hashValue,
  required484EdgeCases,
} from "../../tools/release/promote_484_guardrailed_canaries";

describe("484 guardrailed canary widening gate", () => {
  it("settles only the first guarded canary when Wave 1 stability is exact", () => {
    const completed = build484ScenarioRecords("completed", []);

    expect(completed.decision.previousStabilityState).toBe("stable");
    expect(completed.decision.decisionState).toBe("completed");
    expect(completed.decision.actionPermitted).toBe(true);
    expect(completed.decision.blockerRefs).toEqual([]);
    expect(completed.settlement.result).toBe("applied");
    expect(completed.settlement.observedWaveState).toBe("completed");
    expect(completed.remainingPolicy.policyState).toBe("armed");
  });

  it("approves a ready canary but keeps completion pending on observation settlement", () => {
    const ready = build484ScenarioRecords("ready", []);

    expect(ready.decision.decisionState).toBe("approved");
    expect(ready.decision.actionPermitted).toBe(true);
    expect(ready.action.commandState).toBe("accepted");
    expect(ready.settlement.result).toBe("accepted_pending_observation");
    expect(ready.settlement.observationState).toBe("open");
  });

  it("blocks when previous Wave 1 stability is not exactly stable", () => {
    const blocked = build484ScenarioRecords("previous_stability_not_exact", []);

    expect(blocked.decision.previousStabilityState).toBe("insufficient_evidence");
    expect(blocked.decision.decisionState).toBe("blocked");
    expect(blocked.decision.actionPermitted).toBe(false);
    expect(blocked.action.commandState).toBe("blocked");
    expect(blocked.decision.blockerRefs).toContain("blocker:484:previous-wave-stability-not-exact");
  });

  it("does not treat exact technical probes as enough when support capacity is constrained", () => {
    const support = build484ScenarioRecords("support_capacity_constrained", []);

    expect(support.selector.selectorState).toBe("exact");
    expect(support.tenantEligibility.supportCapacityState).toBe("constrained");
    expect(support.guardrails.find((entry) => entry.ruleKind === "support_capacity")?.state).toBe(
      "breached",
    );
    expect(support.decision.decisionState).toBe("blocked");
    expect(support.settlement.result).toBe("denied_scope");
  });

  it("keeps tenant web eligibility separate from blocked channel scope", () => {
    const channel = build484ScenarioRecords("channel_scope_blocked", []);

    expect(channel.selector.selectorKind).toBe("channel");
    expect(channel.tenantEligibility.coreWebEligibilityState).toBe("exact");
    expect(channel.channelEligibility.channelEligibilityState).toBe("blocked");
    expect(channel.channelEligibility.monthlyDataState).toBe("missing");
    expect(channel.decision.decisionState).toBe("blocked");
  });

  it("does not silently widen when the canary selector expands after approval", () => {
    const expanded = build484ScenarioRecords("selector_expanded", []);

    expect(expanded.selector.selectorState).toBe("expanded");
    expect(expanded.selector.baselineSelectorHash).not.toBe(expanded.selector.proposedSelectorHash);
    expect(expanded.blastRadiusProof.blastRadiusState).toBe("blocked");
    expect(expanded.decision.actionPermitted).toBe(false);
    expect(expanded.decision.blockerRefs).toContain(
      "blocker:484:canary-selector-expanded-by-dynamic-membership",
    );
  });

  it("covers every required 484 edge fixture and hashes records deterministically", () => {
    const records = build484Records([]);
    const edgeCaseIds = new Set(
      (records.edgeCaseFixtures.fixtures as any[]).map((fixture) => fixture.edgeCaseId),
    );
    for (const edgeCase of required484EdgeCases) {
      expect(edgeCaseIds.has(edgeCase)).toBe(true);
    }

    const { recordHash, ...withoutHash } = records.activeScenario.decision;
    expect(recordHash).toBe(hashValue(withoutHash));
  });
});
