import {
  createAccessGrantService,
  createIdentityRepairOrchestratorService,
  createIdentityRepairSimulationHarness,
  createIdentityRepairStore,
  createReachabilityGovernorService,
  createReachabilitySimulationHarness,
  createIdentityBindingAuthorityService,
  type IdentityRepairDependencies,
} from "@vecells/domain-identity-access";
import {
  createDeterministicBackboneIdGenerator,
  type BackboneIdGenerator,
} from "@vecells/domain-kernel";

export const identityAccessPersistenceTables = [
  "identity_bindings",
  "patient_links",
  "access_grant_scope_envelopes",
  "access_grants",
  "access_grant_redemption_records",
  "access_grant_supersession_records",
  "contact_route_snapshots",
  "reachability_observations",
  "reachability_assessment_records",
  "reachability_dependencies",
  "contact_route_repair_journeys",
  "contact_route_verification_checkpoints",
  "identity_repair_signals",
  "identity_repair_cases",
  "identity_repair_freeze_records",
  "identity_repair_branch_dispositions",
  "identity_repair_release_settlements",
  "lineage_fences",
] as const;

export const identityAccessMigrationPlanRefs = [
  "services/command-api/migrations/062_submission_and_lineage_backbone.sql",
  "services/command-api/migrations/068_identity_binding_and_access_grants.sql",
  "services/command-api/migrations/069_contact_route_and_reachability.sql",
  "services/command-api/migrations/071_request_lifecycle_lease_and_command_action_records.sql",
  "services/command-api/migrations/080_identity_repair_and_reachability_governor.sql",
] as const;

export interface IdentityAccessApplication {
  readonly repositories: IdentityRepairDependencies;
  readonly identityBindingAuthority: ReturnType<typeof createIdentityBindingAuthorityService>;
  readonly accessGrantService: ReturnType<typeof createAccessGrantService>;
  readonly reachabilityGovernor: ReturnType<typeof createReachabilityGovernorService>;
  readonly reachabilitySimulation: ReturnType<typeof createReachabilitySimulationHarness>;
  readonly identityRepairOrchestrator: ReturnType<typeof createIdentityRepairOrchestratorService>;
  readonly identityRepairSimulation: ReturnType<typeof createIdentityRepairSimulationHarness>;
  readonly migrationPlanRef: (typeof identityAccessMigrationPlanRefs)[number];
  readonly migrationPlanRefs: typeof identityAccessMigrationPlanRefs;
}

export function createIdentityAccessApplication(options?: {
  repositories?: IdentityRepairDependencies;
  idGenerator?: BackboneIdGenerator;
}): IdentityAccessApplication {
  const repositories = options?.repositories ?? createIdentityRepairStore();
  const idGenerator =
    options?.idGenerator ?? createDeterministicBackboneIdGenerator("command_api_identity_access");
  const reachabilityGovernor = createReachabilityGovernorService(repositories, idGenerator);
  const identityRepairOrchestrator = createIdentityRepairOrchestratorService(
    repositories,
    idGenerator,
  );

  return {
    repositories,
    identityBindingAuthority: createIdentityBindingAuthorityService(repositories, idGenerator),
    accessGrantService: createAccessGrantService(repositories, idGenerator),
    reachabilityGovernor,
    reachabilitySimulation: createReachabilitySimulationHarness(reachabilityGovernor),
    identityRepairOrchestrator,
    identityRepairSimulation: createIdentityRepairSimulationHarness(
      repositories,
      identityRepairOrchestrator,
    ),
    migrationPlanRef: identityAccessMigrationPlanRefs[4],
    migrationPlanRefs: identityAccessMigrationPlanRefs,
  };
}
