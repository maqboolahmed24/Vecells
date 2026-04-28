import {
  createReservationConfirmationAuthorityService,
  createReservationConfirmationSimulationHarness,
  createReservationConfirmationStore,
  reservationConfirmationParallelInterfaceGaps,
  type ReservationConfirmationDependencies,
} from "@vecells/domain-identity-access";
import {
  createDeterministicBackboneIdGenerator,
  type BackboneIdGenerator,
} from "@vecells/domain-kernel";

export const reservationConfirmationPersistenceTables = [
  "capacity_reservations",
  "reservation_truth_projections",
  "external_confirmation_gates",
] as const;

export const reservationConfirmationMigrationPlanRefs = [
  "services/command-api/migrations/074_capacity_reservation_and_external_confirmation_gate_models.sql",
] as const;

export interface ReservationConfirmationApplication {
  readonly repositories: ReservationConfirmationDependencies;
  readonly authority: ReturnType<typeof createReservationConfirmationAuthorityService>;
  readonly simulation: ReturnType<typeof createReservationConfirmationSimulationHarness>;
  readonly migrationPlanRef: (typeof reservationConfirmationMigrationPlanRefs)[number];
  readonly migrationPlanRefs: typeof reservationConfirmationMigrationPlanRefs;
  readonly parallelInterfaceGaps: typeof reservationConfirmationParallelInterfaceGaps;
}

export function createReservationConfirmationApplication(options?: {
  repositories?: ReservationConfirmationDependencies;
  idGenerator?: BackboneIdGenerator;
}): ReservationConfirmationApplication {
  const repositories = options?.repositories ?? createReservationConfirmationStore();
  const idGenerator =
    options?.idGenerator ??
    createDeterministicBackboneIdGenerator("command_api_reservation_confirmation");
  const authority = createReservationConfirmationAuthorityService(repositories, idGenerator);

  return {
    repositories,
    authority,
    simulation: createReservationConfirmationSimulationHarness({
      repositories,
      idGenerator: createDeterministicBackboneIdGenerator(
        "command_api_reservation_confirmation_simulation",
      ),
    }),
    migrationPlanRef: reservationConfirmationMigrationPlanRefs[0],
    migrationPlanRefs: reservationConfirmationMigrationPlanRefs,
    parallelInterfaceGaps: reservationConfirmationParallelInterfaceGaps,
  };
}
