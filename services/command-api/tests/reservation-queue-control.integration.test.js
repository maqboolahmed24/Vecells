import { describe, expect, it } from "vitest";
import {
  createReservationQueueControlApplication,
  reservationQueueControlQueueFamilyRef,
  reservationQueueControlQueuePlanRef,
  reservationQueueControlMigrationPlanRefs,
  reservationQueueControlPersistenceTables,
} from "../src/reservation-queue-control.ts";

describe("reservation queue control command-api seam", () => {
  it("composes canonical reservation authority and queue ranking coordination", async () => {
    const application = createReservationQueueControlApplication();
    const scenarios = await application.simulation.runAllScenarios();

    expect(application.migrationPlanRef).toBe(
      "services/command-api/migrations/081_reservation_authority_and_queue_ranking_coordinator.sql",
    );
    expect(application.migrationPlanRefs).toEqual(reservationQueueControlMigrationPlanRefs);
    expect(application.persistenceTables).toEqual(reservationQueueControlPersistenceTables);
    expect(application.queuePlanRef).toBe(reservationQueueControlQueuePlanRef);
    expect(application.queueFamilyRef).toBe(reservationQueueControlQueueFamilyRef);
    expect(application.parallelInterfaceGaps).toHaveLength(3);
    expect(application.canonicalEventEntries).toHaveLength(7);
    expect(scenarios).toHaveLength(9);

    const byScenario = Object.fromEntries(
      scenarios.map((scenario) => [scenario.scenarioId, scenario]),
    );
    expect(
      byScenario.soft_selected_supply_no_exclusive_hold.projection.toSnapshot().truthState,
    ).toBe("truthful_nonexclusive");
    expect(byScenario.overlapping_local_and_hub_claims_same_key.fence.toSnapshot().state).toBe(
      "conflict_blocked",
    );
    expect(byScenario.overload_queue_pressure_escalated.escalation).toBeTruthy();
    expect(
      byScenario.assignment_suggestions_preserve_base_queue.advisory.toSnapshot().advisoryState,
    ).toBe("ready");
    expect(
      byScenario.next_task_advice_blocked_on_stale_owner.advisory.toSnapshot().advisoryState,
    ).toBe("blocked_stale_owner");
  });
});
