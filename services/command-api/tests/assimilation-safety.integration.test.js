import { describe, expect, it } from "vitest";
import {
  assimilationSafetyMigrationPlanRefs,
  assimilationSafetyPersistenceTables,
  createAssimilationSafetyApplication,
} from "../src/assimilation-safety.ts";

describe("assimilation safety command-api seam", () => {
  it("publishes the canonical assimilation and safety simulation surface", async () => {
    const application = createAssimilationSafetyApplication();
    const results = await application.simulation.runAllScenarios();
    const byScenario = Object.fromEntries(results.map((result) => [result.scenarioId, result]));

    expect(application.migrationPlanRef).toBe(
      "services/command-api/migrations/079_evidence_assimilation_and_safety_orchestrator.sql",
    );
    expect(application.migrationPlanRefs).toEqual(assimilationSafetyMigrationPlanRefs);
    expect(application.persistenceTables).toEqual(assimilationSafetyPersistenceTables);
    expect(application.parallelInterfaceGaps).toHaveLength(3);
    expect(application.canonicalEventEntries).toHaveLength(7);
    expect(results).toHaveLength(8);

    expect(byScenario.post_submit_reply_no_material_change.attachmentDisposition).toBe(
      "derivative_only",
    );
    expect(byScenario.reply_clinically_material_forces_resafety.decisionOutcome).toBe(
      "residual_review",
    );
    expect(byScenario.contradictory_low_assurance_cannot_clear_prior_urgent.decisionOutcome).toBe(
      "urgent_required",
    );
    expect(byScenario.callback_outcome_triggers_urgent_diversion.urgentDiversionState).toBe(
      "issued",
    );
    expect(byScenario.support_capture_changes_contact_safety_meaning.dominantEvidenceClass).toBe(
      "contact_safety_relevant",
    );
    expect(byScenario.weak_pharmacy_outcome_forces_manual_review.decisionOutcome).toBe(
      "fallback_manual_review",
    );
    expect(byScenario.exact_replay_returns_existing_assimilation.replayDisposition).toBe(
      "exact_replay",
    );
    expect(byScenario.overlapping_inflight_assimilation_coalesces.replayDisposition).toBe(
      "coalesced_inflight",
    );
  });
});
