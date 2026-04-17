import {
  assimilationSafetyCanonicalEventEntries,
  assimilationSafetyParallelInterfaceGaps,
  createAssimilationSafetyServices,
  createAssimilationSafetySimulationHarness,
  createAssimilationSafetyStore,
  type AssimilationSafetyDependencies,
  type SafetyRulePackLoader,
} from "@vecells/domain-intake-safety";
import {
  createDeterministicBackboneIdGenerator,
  type BackboneIdGenerator,
} from "@vecells/domain-kernel";

export const assimilationSafetyPersistenceTables = [
  "evidence_assimilation_records",
  "material_delta_assessments",
  "evidence_classification_decisions",
  "safety_preemption_records",
  "safety_decision_records",
  "urgent_diversion_settlements",
] as const;

export const assimilationSafetyMigrationPlanRefs = [
  "services/command-api/migrations/079_evidence_assimilation_and_safety_orchestrator.sql",
] as const;

export interface AssimilationSafetyApplication {
  repositories: AssimilationSafetyDependencies;
  services: ReturnType<typeof createAssimilationSafetyServices>;
  simulation: ReturnType<typeof createAssimilationSafetySimulationHarness>;
  persistenceTables: readonly string[];
  migrationPlanRef: string;
  migrationPlanRefs: readonly string[];
  canonicalEventEntries: typeof assimilationSafetyCanonicalEventEntries;
  parallelInterfaceGaps: typeof assimilationSafetyParallelInterfaceGaps;
}

export function createAssimilationSafetyApplication(options?: {
  repositories?: AssimilationSafetyDependencies;
  idGenerator?: BackboneIdGenerator;
  rulePackLoader?: SafetyRulePackLoader;
}): AssimilationSafetyApplication {
  const repositories = options?.repositories ?? createAssimilationSafetyStore();
  const idGenerator =
    options?.idGenerator ??
    createDeterministicBackboneIdGenerator("command_api_assimilation_safety");
  const services = createAssimilationSafetyServices(
    repositories,
    idGenerator,
    options?.rulePackLoader,
  );
  const simulation = createAssimilationSafetySimulationHarness({
    repositories,
    services,
    idGenerator,
    rulePackLoader: options?.rulePackLoader,
  });

  return {
    repositories,
    services,
    simulation,
    persistenceTables: assimilationSafetyPersistenceTables,
    migrationPlanRef: assimilationSafetyMigrationPlanRefs[0],
    migrationPlanRefs: assimilationSafetyMigrationPlanRefs,
    canonicalEventEntries: assimilationSafetyCanonicalEventEntries,
    parallelInterfaceGaps: assimilationSafetyParallelInterfaceGaps,
  };
}
