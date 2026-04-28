import {
  createDraftAutosaveStore,
  createDraftSessionAutosaveService,
  type DraftAutosaveDependencies,
} from "@vecells/domain-identity-access";
import {
  createDeterministicBackboneIdGenerator,
  type BackboneIdGenerator,
} from "@vecells/domain-kernel";

export const draftAutosavePersistenceTables = [
  "submission_envelopes",
  "access_grant_scope_envelopes",
  "access_grants",
  "access_grant_supersession_records",
  "draft_session_leases",
  "draft_mutation_records",
  "draft_save_settlements",
  "draft_merge_plans",
  "draft_recovery_records",
  "draft_continuity_evidence_projections",
] as const;

export const draftAutosaveMigrationPlanRefs = [
  "services/command-api/migrations/062_submission_and_lineage_backbone.sql",
  "services/command-api/migrations/068_identity_binding_and_access_grants.sql",
  "services/command-api/migrations/082_draft_session_lease_and_autosave.sql",
] as const;

export interface DraftAutosaveApplication {
  readonly repositories: DraftAutosaveDependencies;
  readonly drafts: ReturnType<typeof createDraftSessionAutosaveService>;
  readonly migrationPlanRef: (typeof draftAutosaveMigrationPlanRefs)[number];
  readonly migrationPlanRefs: typeof draftAutosaveMigrationPlanRefs;
}

export function createDraftAutosaveApplication(options?: {
  repositories?: DraftAutosaveDependencies;
  idGenerator?: BackboneIdGenerator;
}): DraftAutosaveApplication {
  const repositories = options?.repositories ?? createDraftAutosaveStore();
  const idGenerator =
    options?.idGenerator ?? createDeterministicBackboneIdGenerator("command_api_draft_autosave");

  return {
    repositories,
    drafts: createDraftSessionAutosaveService(repositories, idGenerator),
    migrationPlanRef: draftAutosaveMigrationPlanRefs[2],
    migrationPlanRefs: draftAutosaveMigrationPlanRefs,
  };
}
