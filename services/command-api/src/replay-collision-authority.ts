import {
  createReplayCollisionAuthorityService,
  createReplayCollisionStore,
  type ReplayCollisionDependencies,
} from "@vecells/domain-identity-access";
import {
  createDeterministicBackboneIdGenerator,
  type BackboneIdGenerator,
} from "@vecells/domain-kernel";

export const replayCollisionPersistenceTables = [
  "idempotency_records",
  "replay_collision_reviews",
  "adapter_dispatch_attempts",
  "adapter_receipt_checkpoints",
] as const;

export const replayCollisionMigrationPlanRefs = [
  "services/command-api/migrations/067_idempotency_and_replay_collision.sql",
] as const;

export interface ReplayCollisionApplication {
  readonly repositories: ReplayCollisionDependencies;
  readonly authority: ReturnType<typeof createReplayCollisionAuthorityService>;
  readonly migrationPlanRef: (typeof replayCollisionMigrationPlanRefs)[number];
  readonly migrationPlanRefs: typeof replayCollisionMigrationPlanRefs;
}

export function createReplayCollisionApplication(options?: {
  repositories?: ReplayCollisionDependencies;
  idGenerator?: BackboneIdGenerator;
}): ReplayCollisionApplication {
  const repositories = options?.repositories ?? createReplayCollisionStore();
  const idGenerator =
    options?.idGenerator ?? createDeterministicBackboneIdGenerator("command_api_replay_collision");

  return {
    repositories,
    authority: createReplayCollisionAuthorityService(repositories, idGenerator),
    migrationPlanRef: replayCollisionMigrationPlanRefs[0],
    migrationPlanRefs: replayCollisionMigrationPlanRefs,
  };
}
