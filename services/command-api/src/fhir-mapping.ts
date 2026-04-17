import {
  createFhirRepresentationCompiler,
  createFhirRepresentationStore,
  fhirExchangeBundlePolicies,
  fhirIdentifierPolicies,
  fhirRepresentationContracts,
  fhirStatusMappingPolicies,
  type FhirCompilerDependencies,
  type FhirExchangeBundlePolicy,
  type FhirIdentifierPolicy,
  type FhirRepresentationContractSnapshot,
  type FhirRepresentationCompiler,
  type FhirStatusMappingPolicy,
} from "@vecells/fhir-mapping";

export const fhirRepresentationPersistenceTables = [
  "fhir_representation_contracts",
  "fhir_representation_sets",
  "fhir_resource_records",
  "fhir_exchange_bundles",
] as const;

export interface FhirRepresentationCompilerApplication {
  readonly repositories: FhirCompilerDependencies;
  readonly compiler: FhirRepresentationCompiler;
  readonly migrationPlanRef: "services/command-api/migrations/064_fhir_mapping_compiler.sql";
}

export function createFhirRepresentationCompilerApplication(options?: {
  repositories?: FhirCompilerDependencies;
  contracts?: readonly FhirRepresentationContractSnapshot[];
  bundlePolicies?: readonly FhirExchangeBundlePolicy[];
  identifierPolicies?: readonly FhirIdentifierPolicy[];
  statusPolicies?: readonly FhirStatusMappingPolicy[];
}): FhirRepresentationCompilerApplication {
  const repositories =
    options?.repositories ??
    createFhirRepresentationStore({
      contracts: options?.contracts ?? fhirRepresentationContracts,
      bundlePolicies: options?.bundlePolicies ?? fhirExchangeBundlePolicies,
      identifierPolicies: options?.identifierPolicies ?? fhirIdentifierPolicies,
      statusPolicies: options?.statusPolicies ?? fhirStatusMappingPolicies,
    });

  return {
    repositories,
    compiler: createFhirRepresentationCompiler(repositories),
    migrationPlanRef: "services/command-api/migrations/064_fhir_mapping_compiler.sql",
  };
}
