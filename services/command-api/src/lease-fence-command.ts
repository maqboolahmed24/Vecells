import {
  createLeaseFenceCommandAuthorityService,
  createLeaseFenceCommandSimulationHarness,
  createLeaseFenceCommandStore,
} from "@vecells/domain-identity-access";
import {
  createDeterministicBackboneIdGenerator,
  type BackboneIdGenerator,
} from "@vecells/domain-kernel";

export const leaseFenceCommandPersistenceTables = [
  "episodes",
  "requests",
  "request_lifecycle_leases",
  "stale_ownership_recovery_records",
  "lease_takeover_records",
  "lineage_fences",
  "command_action_records",
  "lease_authority_states",
] as const;

export const leaseFenceCommandMigrationPlanRefs = [
  "services/command-api/migrations/062_submission_and_lineage_backbone.sql",
  "services/command-api/migrations/071_request_lifecycle_lease_and_command_action_records.sql",
] as const;

export interface LeaseFenceCommandApplication {
  readonly repositories: ReturnType<typeof createLeaseFenceCommandStore>;
  readonly authority: ReturnType<typeof createLeaseFenceCommandAuthorityService>;
  readonly simulation: ReturnType<typeof createLeaseFenceCommandSimulationHarness>;
  readonly migrationPlanRef: (typeof leaseFenceCommandMigrationPlanRefs)[number];
  readonly migrationPlanRefs: typeof leaseFenceCommandMigrationPlanRefs;
}

export function createLeaseFenceCommandApplication(options?: {
  repositories?: ReturnType<typeof createLeaseFenceCommandStore>;
  idGenerator?: BackboneIdGenerator;
}): LeaseFenceCommandApplication {
  const repositories = options?.repositories ?? createLeaseFenceCommandStore();
  const idGenerator =
    options?.idGenerator ??
    createDeterministicBackboneIdGenerator("command_api_lease_fence_command");
  const authority = createLeaseFenceCommandAuthorityService(repositories, idGenerator);

  return {
    repositories,
    authority,
    simulation: createLeaseFenceCommandSimulationHarness(authority),
    migrationPlanRef: leaseFenceCommandMigrationPlanRefs[1],
    migrationPlanRefs: leaseFenceCommandMigrationPlanRefs,
  };
}
