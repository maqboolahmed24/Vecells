import {
  createSubmissionBackboneCommandService,
  createSubmissionBackboneStore,
  type SubmissionBackboneDependencies,
} from "@vecells/domain-identity-access";
import {
  createDeterministicBackboneIdGenerator,
  type BackboneIdGenerator,
} from "@vecells/domain-kernel";

export const submissionBackbonePersistenceTables = [
  "submission_envelopes",
  "submission_promotion_records",
  "episodes",
  "requests",
  "request_lineages",
  "lineage_case_links",
] as const;

export const submissionBackboneMigrationPlanRefs = [
  "services/command-api/migrations/062_submission_and_lineage_backbone.sql",
  "services/command-api/migrations/066_submission_promotion_exactly_once.sql",
] as const;

export interface SubmissionBackboneApplication {
  readonly repositories: SubmissionBackboneDependencies;
  readonly commands: ReturnType<typeof createSubmissionBackboneCommandService>;
  readonly migrationPlanRef: (typeof submissionBackboneMigrationPlanRefs)[number];
  readonly migrationPlanRefs: typeof submissionBackboneMigrationPlanRefs;
}

export function createSubmissionBackboneApplication(options?: {
  repositories?: SubmissionBackboneDependencies;
  idGenerator?: BackboneIdGenerator;
}): SubmissionBackboneApplication {
  const repositories = options?.repositories ?? createSubmissionBackboneStore();
  const idGenerator =
    options?.idGenerator ??
    createDeterministicBackboneIdGenerator("command_api_submission_backbone");

  return {
    repositories,
    commands: createSubmissionBackboneCommandService(repositories, idGenerator),
    migrationPlanRef: submissionBackboneMigrationPlanRefs[1],
    migrationPlanRefs: submissionBackboneMigrationPlanRefs,
  };
}
