import {
  createRequestClosureAuthorityService,
  createRequestClosureSimulationHarness,
  createRequestClosureStore,
  requestClosureCanonicalEventEntries,
  requestClosureParallelInterfaceGaps,
  type RequestClosureDependencies,
} from "@vecells/domain-identity-access";
import {
  createDeterministicBackboneIdGenerator,
  type BackboneIdGenerator,
} from "@vecells/domain-kernel";

export const requestClosurePersistenceTables = [
  "request_closure_records",
  "fallback_review_cases",
] as const;

export const requestClosureMigrationPlanRefs = [
  "services/command-api/migrations/076_request_closure_record_and_exception_case_models.sql",
] as const;

export interface RequestClosureApplication {
  repositories: RequestClosureDependencies;
  authority: ReturnType<typeof createRequestClosureAuthorityService>;
  simulation: ReturnType<typeof createRequestClosureSimulationHarness>;
  persistenceTables: readonly string[];
  migrationPlanRef: string;
  migrationPlanRefs: readonly string[];
  canonicalEventEntries: typeof requestClosureCanonicalEventEntries;
  parallelInterfaceGaps: readonly string[];
}

export function createRequestClosureApplication(options?: {
  repositories?: RequestClosureDependencies;
  idGenerator?: BackboneIdGenerator;
}): RequestClosureApplication {
  const repositories = options?.repositories ?? createRequestClosureStore();
  const idGenerator =
    options?.idGenerator ?? createDeterministicBackboneIdGenerator("command_api_request_closure");
  const authority = createRequestClosureAuthorityService(repositories, idGenerator);
  const simulation = createRequestClosureSimulationHarness({
    repositories,
    authority,
    idGenerator,
  });

  return {
    repositories,
    authority,
    simulation,
    persistenceTables: requestClosurePersistenceTables,
    migrationPlanRef: requestClosureMigrationPlanRefs[0],
    migrationPlanRefs: requestClosureMigrationPlanRefs,
    canonicalEventEntries: requestClosureCanonicalEventEntries,
    parallelInterfaceGaps: requestClosureParallelInterfaceGaps,
  };
}
