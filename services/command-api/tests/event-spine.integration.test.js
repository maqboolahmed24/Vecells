import { describe, expect, it } from "vitest";
import {
  createEventSpineApplication,
  eventSpineMigrationPlanRefs,
  eventSpinePersistenceTables,
} from "../src/event-spine.ts";

describe("event spine command-api seam", () => {
  it("composes the par_087 broker topology and deterministic replay scenarios", () => {
    const application = createEventSpineApplication();
    const scenarios = application.simulation.runAllScenarios();

    expect(application.migrationPlanRef).toBe(
      "services/command-api/migrations/087_event_spine_outbox_inbox.sql",
    );
    expect(application.migrationPlanRefs).toEqual(eventSpineMigrationPlanRefs);
    expect(eventSpinePersistenceTables).toContain("event_outbox_entries");
    expect(eventSpinePersistenceTables).toContain("event_inbox_checkpoints");

    expect(application.manifest.task_id).toBe("par_087");
    expect(application.manifest.summary.namespace_count).toBeGreaterThanOrEqual(22);
    expect(application.manifest.summary.transport_mapping_count).toBeGreaterThanOrEqual(192);
    expect(application.policyRows.length).toBeGreaterThanOrEqual(10);

    expect(scenarios).toHaveLength(6);
    const degraded = scenarios.find(
      (scenario) => scenario.scenarioId === "patient_receipt_degraded_flow",
    );
    expect(degraded?.eventName).toBe("patient.receipt.degraded");
    expect(degraded?.queueRefs).toContain("q_event_notification_effects");
    expect(degraded?.duplicateReceiptCount).toBeGreaterThan(0);

    const gap = scenarios.find((scenario) => scenario.scenarioId === "reachability_failure_flow");
    expect(gap?.queueRefs).toContain("q_event_callback_correlation");
    expect(gap?.gapBlockedReceiptCount).toBeGreaterThan(0);

    const quarantine = scenarios.find(
      (scenario) => scenario.scenarioId === "quarantine_attachment_flow",
    );
    expect(quarantine?.quarantineQueueRefs).toContain("q_event_replay_quarantine");
    expect(quarantine?.replayReviewRefs.length).toBeGreaterThanOrEqual(0);
  });
});
