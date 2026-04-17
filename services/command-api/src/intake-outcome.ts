import {
  createUrgentDiversionSettlementService,
  type UrgentDiversionSettlementService,
  type AssimilationSafetyDependencies,
  createAssimilationSafetyStore,
} from "@vecells/domain-intake-safety";
import {
  createPhase1OutcomeGrammarService,
  createPhase1OutcomeGrammarStore,
  type Phase1OutcomeGrammarRepositories,
  type Phase1OutcomeGrammarService,
} from "../../../packages/domains/intake_request/src/index";
import {
  createDeterministicBackboneIdGenerator,
  type BackboneIdGenerator,
} from "@vecells/domain-kernel";

export const intakeOutcomePersistenceTables = [
  "urgent_diversion_settlements",
  "patient_receipt_consistency_envelopes",
  "intake_outcome_presentation_artifacts",
  "phase1_outcome_tuples",
  "outbound_navigation_grants",
] as const;

export const intakeOutcomeMigrationPlanRefs = [
  "services/command-api/migrations/079_evidence_assimilation_and_safety_orchestrator.sql",
  "services/command-api/migrations/086_phase1_outcome_grammar_and_urgent_diversion.sql",
] as const;

export interface IntakeOutcomeApplication {
  urgentDiversionRepositories: AssimilationSafetyDependencies;
  outcomeRepositories: Phase1OutcomeGrammarRepositories;
  urgentDiversionService: UrgentDiversionSettlementService;
  outcomeGrammarService: Phase1OutcomeGrammarService;
  persistenceTables: readonly string[];
  migrationPlanRef: string;
  migrationPlanRefs: readonly string[];
}

export function createIntakeOutcomeApplication(options?: {
  urgentDiversionRepositories?: AssimilationSafetyDependencies;
  outcomeRepositories?: Phase1OutcomeGrammarRepositories;
  idGenerator?: BackboneIdGenerator;
}): IntakeOutcomeApplication {
  const urgentDiversionRepositories =
    options?.urgentDiversionRepositories ?? createAssimilationSafetyStore();
  const outcomeRepositories =
    options?.outcomeRepositories ?? createPhase1OutcomeGrammarStore();
  const idGenerator =
    options?.idGenerator ??
    createDeterministicBackboneIdGenerator("command_api_phase1_outcomes");

  return {
    urgentDiversionRepositories,
    outcomeRepositories,
    urgentDiversionService: createUrgentDiversionSettlementService(
      urgentDiversionRepositories,
      { idGenerator },
    ),
    outcomeGrammarService: createPhase1OutcomeGrammarService(outcomeRepositories),
    persistenceTables: intakeOutcomePersistenceTables,
    migrationPlanRef: intakeOutcomeMigrationPlanRefs[1],
    migrationPlanRefs: intakeOutcomeMigrationPlanRefs,
  };
}
