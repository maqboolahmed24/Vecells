import {
  createAssimilationSafetyStore,
  createSynchronousSafetyServices,
  type SynchronousSafetyCalibratorResolver,
  type SynchronousSafetyDependencies,
  type SynchronousSafetyRulePackLoader,
} from "@vecells/domain-intake-safety";
import {
  createDeterministicBackboneIdGenerator,
  type BackboneIdGenerator,
} from "@vecells/domain-kernel";
import type { EvidenceBackboneDependencies } from "@vecells/domain-intake-safety";

export const synchronousSafetyPersistenceTables = [
  "evidence_classification_decisions",
  "safety_preemption_records",
  "safety_decision_records",
] as const;

export const synchronousSafetyMigrationPlanRefs = [
  "services/command-api/migrations/079_evidence_assimilation_and_safety_orchestrator.sql",
] as const;

export interface SynchronousSafetyApplication {
  repositories: SynchronousSafetyDependencies;
  services: ReturnType<typeof createSynchronousSafetyServices>;
  persistenceTables: readonly string[];
  migrationPlanRef: string;
  migrationPlanRefs: readonly string[];
}

export function createSynchronousSafetyApplication(options?: {
  repositories?: SynchronousSafetyDependencies;
  evidenceBackbone?: EvidenceBackboneDependencies;
  idGenerator?: BackboneIdGenerator;
  rulePackLoader?: SynchronousSafetyRulePackLoader;
  calibratorResolver?: SynchronousSafetyCalibratorResolver;
}): SynchronousSafetyApplication {
  const repositories =
    options?.repositories ?? createAssimilationSafetyStore(options?.evidenceBackbone);
  const idGenerator =
    options?.idGenerator ??
    createDeterministicBackboneIdGenerator("command_api_synchronous_safety");
  const services = createSynchronousSafetyServices(repositories, {
    idGenerator,
    rulePackLoader: options?.rulePackLoader,
    calibratorResolver: options?.calibratorResolver,
  });

  return {
    repositories,
    services,
    persistenceTables: synchronousSafetyPersistenceTables,
    migrationPlanRef: synchronousSafetyMigrationPlanRefs[0],
    migrationPlanRefs: synchronousSafetyMigrationPlanRefs,
  };
}
