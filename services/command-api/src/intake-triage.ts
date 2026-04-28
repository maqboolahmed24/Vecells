import {
  createPhase1EtaEngine,
  createPhase1TriageHandoffService,
  createPhase1TriageStore,
} from "../../../packages/domains/triage_workspace/src/index";
import {
  createDeterministicBackboneIdGenerator,
  type BackboneIdGenerator,
} from "../../../packages/domain-kernel/src/index";
import type {
  Phase1EtaEngine,
  Phase1EtaPolicyFixture,
  Phase1TriageHandoffService,
  Phase1TriageRepositories,
} from "../../../packages/domains/triage_workspace/src/index";

export const intakeTriagePersistenceTables = [
  "phase1_triage_tasks",
  "phase1_triage_eta_forecasts",
  "phase1_patient_status_projections",
] as const;

export const intakeTriageMigrationPlanRefs = [
  "services/command-api/migrations/088_phase1_triage_task_eta_and_status.sql",
] as const;

export interface IntakeTriageApplication {
  repositories: Phase1TriageRepositories;
  triageService: Phase1TriageHandoffService;
  etaEngine: Phase1EtaEngine;
  persistenceTables: readonly string[];
  migrationPlanRef: string;
  migrationPlanRefs: readonly string[];
}

export function createIntakeTriageApplication(options?: {
  repositories?: Phase1TriageRepositories;
  fixture?: Phase1EtaPolicyFixture;
  idGenerator?: BackboneIdGenerator;
}): IntakeTriageApplication {
  const repositories = options?.repositories ?? createPhase1TriageStore();
  const fixture = options?.fixture;
  const idGenerator =
    options?.idGenerator ??
    createDeterministicBackboneIdGenerator("command_api_phase1_triage");

  return {
    repositories,
    triageService: createPhase1TriageHandoffService(repositories, {
      idGenerator,
      fixture,
    }),
    etaEngine: createPhase1EtaEngine(fixture),
    persistenceTables: intakeTriagePersistenceTables,
    migrationPlanRef: intakeTriageMigrationPlanRefs[0],
    migrationPlanRefs: intakeTriageMigrationPlanRefs,
  };
}
