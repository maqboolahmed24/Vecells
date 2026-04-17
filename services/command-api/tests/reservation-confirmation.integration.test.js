import { describe, expect, it } from "vitest";
import {
  createReservationConfirmationApplication,
  reservationConfirmationMigrationPlanRefs,
  reservationConfirmationPersistenceTables,
} from "../src/reservation-confirmation.ts";

describe("reservation confirmation command-api seam", () => {
  it("composes the authoritative reservation truth and confirmation gate substrate", async () => {
    const application = createReservationConfirmationApplication();
    const results = await application.simulation.runAllScenarios();

    expect(application.migrationPlanRef).toBe(
      "services/command-api/migrations/074_capacity_reservation_and_external_confirmation_gate_models.sql",
    );
    expect(application.migrationPlanRefs).toEqual(reservationConfirmationMigrationPlanRefs);
    expect(application.parallelInterfaceGaps).toHaveLength(2);
    expect(application.parallelInterfaceGaps[0]?.gapId).toBe(
      "PARALLEL_INTERFACE_GAP_074_RESERVATION_AUTHORITY_PORT",
    );
    expect(application.parallelInterfaceGaps[1]?.gapId).toBe(
      "PARALLEL_INTERFACE_GAP_074_BOOKING_CONFIRMATION_TRUTH_PORT",
    );
    expect(reservationConfirmationPersistenceTables).toEqual([
      "capacity_reservations",
      "reservation_truth_projections",
      "external_confirmation_gates",
    ]);
    expect(results).toHaveLength(8);

    const byScenario = Object.fromEntries(results.map((result) => [result.scenarioId, result]));

    expect(byScenario.soft_selection_without_hold.reservation.toSnapshot().commitMode).toBe(
      "truthful_nonexclusive",
    );
    expect(byScenario.soft_selection_without_hold.projection.toSnapshot().truthState).toBe(
      "truthful_nonexclusive",
    );
    expect(byScenario.exclusive_hold_with_real_expiry.projection.toSnapshot().countdownMode).toBe(
      "hold_expiry",
    );
    expect(byScenario.pending_external_confirmation.gate?.toSnapshot().state).toBe("pending");
    expect(byScenario.contradictory_competing_confirmation.gate?.toSnapshot().state).toBe(
      "disputed",
    );
    expect(byScenario.weak_manual_two_family_confirmation.gate?.toSnapshot().state).toBe(
      "confirmed",
    );
    expect(byScenario.expired_hold_without_confirmation.projection.toSnapshot().truthState).toBe(
      "expired",
    );
  });
});
