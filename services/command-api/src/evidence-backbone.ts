import {
  createDeterministicEvidenceIdGenerator,
  createEvidenceBackboneServices,
  createEvidenceBackboneStore,
  type EvidenceBackboneDependencies,
  type EvidenceBackboneIdGenerator,
} from "@vecells/domain-intake-safety";

export const evidenceBackbonePersistenceTables = [
  "evidence_source_artifacts",
  "evidence_derived_artifacts",
  "evidence_redacted_artifacts",
  "evidence_capture_bundles",
  "evidence_derivation_packages",
  "evidence_redaction_transforms",
  "evidence_summary_parity_records",
  "evidence_snapshots",
] as const;

export interface EvidenceBackboneApplication {
  readonly repositories: EvidenceBackboneDependencies;
  readonly services: ReturnType<typeof createEvidenceBackboneServices>;
  readonly migrationPlanRef: "services/command-api/migrations/063_evidence_backbone.sql";
}

export function createEvidenceBackboneApplication(options?: {
  repositories?: EvidenceBackboneDependencies;
  idGenerator?: EvidenceBackboneIdGenerator;
}): EvidenceBackboneApplication {
  const repositories = options?.repositories ?? createEvidenceBackboneStore();
  const idGenerator =
    options?.idGenerator ?? createDeterministicEvidenceIdGenerator("command_api_evidence_backbone");

  return {
    repositories,
    services: createEvidenceBackboneServices(repositories, idGenerator),
    migrationPlanRef: "services/command-api/migrations/063_evidence_backbone.sql",
  };
}
