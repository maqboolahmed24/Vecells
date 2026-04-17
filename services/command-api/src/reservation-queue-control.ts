import {
  createReservationQueueControlStore,
  createReservationQueueServices,
  createReservationQueueSimulationHarness,
  reservationQueueCanonicalEventEntries,
  reservationQueueParallelInterfaceGaps,
  type ReservationQueueControlDependencies,
} from "@vecells/domain-identity-access";
import { queueDefaultPlan } from "@vecells/api-contracts";
import {
  createDeterministicBackboneIdGenerator,
  type BackboneIdGenerator,
} from "@vecells/domain-kernel";

export const reservationQueueControlPersistenceTables = [
  "reservation_fence_records",
  "queue_snapshot_commit_records",
  "queue_pressure_escalation_records",
  "next_task_advisory_snapshots",
] as const;

export const reservationQueueControlMigrationPlanRefs = [
  "services/command-api/migrations/073_queue_rank_models.sql",
  "services/command-api/migrations/074_capacity_reservation_and_external_confirmation_gate_models.sql",
  "services/command-api/migrations/081_reservation_authority_and_queue_ranking_coordinator.sql",
] as const;

export const reservationQueueControlQueuePlanRef = queueDefaultPlan.queueRankPlanId;
export const reservationQueueControlQueueFamilyRef = queueDefaultPlan.queueFamilyRef;

export interface ReservationQueueControlApplication {
  readonly repositories: ReservationQueueControlDependencies;
  readonly reservationAuthority: ReturnType<
    typeof createReservationQueueServices
  >["reservationAuthority"];
  readonly queueRankingCoordinator: ReturnType<
    typeof createReservationQueueServices
  >["queueRankingCoordinator"];
  readonly simulation: ReturnType<typeof createReservationQueueSimulationHarness>;
  readonly migrationPlanRef: (typeof reservationQueueControlMigrationPlanRefs)[number];
  readonly migrationPlanRefs: typeof reservationQueueControlMigrationPlanRefs;
  readonly persistenceTables: typeof reservationQueueControlPersistenceTables;
  readonly queuePlanRef: typeof reservationQueueControlQueuePlanRef;
  readonly queueFamilyRef: typeof reservationQueueControlQueueFamilyRef;
  readonly canonicalEventEntries: typeof reservationQueueCanonicalEventEntries;
  readonly parallelInterfaceGaps: typeof reservationQueueParallelInterfaceGaps;
}

export function createReservationQueueControlApplication(options?: {
  repositories?: ReservationQueueControlDependencies;
  idGenerator?: BackboneIdGenerator;
}): ReservationQueueControlApplication {
  const repositories = options?.repositories ?? createReservationQueueControlStore();
  const idGenerator =
    options?.idGenerator ??
    createDeterministicBackboneIdGenerator("command_api_reservation_queue_control");
  const services = createReservationQueueServices({
    repositories,
    idGenerator,
  });

  return {
    repositories,
    reservationAuthority: services.reservationAuthority,
    queueRankingCoordinator: services.queueRankingCoordinator,
    simulation: createReservationQueueSimulationHarness({
      repositories,
      idGenerator: createDeterministicBackboneIdGenerator(
        "command_api_reservation_queue_control_simulation",
      ),
    }),
    migrationPlanRef: reservationQueueControlMigrationPlanRefs.at(-1)!,
    migrationPlanRefs: reservationQueueControlMigrationPlanRefs,
    persistenceTables: reservationQueueControlPersistenceTables,
    queuePlanRef: reservationQueueControlQueuePlanRef,
    queueFamilyRef: reservationQueueControlQueueFamilyRef,
    canonicalEventEntries: reservationQueueCanonicalEventEntries,
    parallelInterfaceGaps: reservationQueueParallelInterfaceGaps,
  };
}
