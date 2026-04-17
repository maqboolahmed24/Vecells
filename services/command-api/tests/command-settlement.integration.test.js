import { describe, expect, it } from "vitest";
import {
  commandSettlementMigrationPlanRefs,
  commandSettlementPersistenceTables,
  createCommandSettlementApplication,
} from "../src/command-settlement.ts";

describe("command settlement application seam", () => {
  it("composes settlement authority, transition envelopes, and the seeded simulator", async () => {
    const application = createCommandSettlementApplication();
    const scenarios = await application.simulation.runAllScenarios();

    expect(application.migrationPlanRef).toBe(
      "services/command-api/migrations/072_command_settlement_and_transition_envelope_library.sql",
    );
    expect(application.migrationPlanRefs).toEqual(commandSettlementMigrationPlanRefs);
    expect(commandSettlementPersistenceTables).toContain("command_settlement_records");
    expect(scenarios).toHaveLength(7);

    const localAckSettled = scenarios.find(
      (scenario) => scenario.scenarioId === "local_ack_then_settled_success",
    );
    expect(localAckSettled?.settlementIds).toHaveLength(2);
    expect(localAckSettled?.envelopes.at(-1)?.authoritativeOutcomeState).toBe("settled");

    const projectionVisible = scenarios.find(
      (scenario) => scenario.scenarioId === "projection_visible_not_authoritative_success",
    );
    expect(projectionVisible?.envelopes[0]?.externalObservationState).toBe("projection_visible");
    expect(projectionVisible?.envelopes[0]?.authoritativeOutcomeState).toBe("pending");

    const recoveryScenario = scenarios.find(
      (scenario) => scenario.scenarioId === "blocked_policy_and_denied_scope_recovery",
    );
    expect(recoveryScenario?.envelopes).toHaveLength(2);
    for (const envelope of recoveryScenario?.envelopes ?? []) {
      expect(envelope.authoritativeOutcomeState).toBe("recovery_required");
      expect(envelope.recoveryActionRef).toMatch(/recover/);
    }

    const supersededByEvidence = scenarios.find(
      (scenario) => scenario.scenarioId === "settlement_superseded_by_later_evidence",
    );
    expect(supersededByEvidence?.settlementIds).toHaveLength(2);
    expect(supersededByEvidence?.envelopes.at(-1)?.authoritativeOutcomeState).toBe("settled");
  });
});
