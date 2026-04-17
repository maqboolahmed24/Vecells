export const foundationFixtureCatalog = {
  "patient-web": {
    routeCount: 9,
    gatewayCount: 9,
    ownerContext: "patient_experience",
  },
  "clinical-workspace": {
    routeCount: 2,
    gatewayCount: 4,
    ownerContext: "triage_workspace",
  },
  "hub-desk": {
    routeCount: 2,
    gatewayCount: 2,
    ownerContext: "hub_coordination",
  },
  "pharmacy-console": {
    routeCount: 1,
    gatewayCount: 1,
    ownerContext: "pharmacy",
  },
  "support-workspace": {
    routeCount: 2,
    gatewayCount: 3,
    ownerContext: "support",
  },
  "ops-console": {
    routeCount: 2,
    gatewayCount: 2,
    ownerContext: "operations",
  },
  "governance-console": {
    routeCount: 1,
    gatewayCount: 1,
    ownerContext: "governance_admin",
  },
} as const;

export interface OwnedObjectFamily {
  canonicalName: string;
  objectKind: string;
  boundedContext: string;
  authoritativeOwner: string;
  sourceRef: string;
}

export interface OwnedContractFamily {
  contractFamilyId: string;
  label: string;
  description: string;
  versioningPosture: string;
  consumerContractIds: readonly string[];
  consumerOwnerCodes: readonly string[];
  consumerSelectors: readonly string[];
  sourceRefs: readonly string[];
  ownedObjectFamilyCount: number;
}

export interface PackageContract {
  artifactId: string;
  packageName: string;
  packageRole: string;
  ownerContextCode: string;
  ownerContextLabel: string;
  purpose: string;
  versioningPosture: string;
  allowedDependencies: readonly string[];
  forbiddenDependencies: readonly string[];
  dependencyContractRefs: readonly string[];
  objectFamilyCount: number;
  contractFamilyCount: number;
  sourceContexts: readonly string[];
}

export const packageContract = {
  artifactId: "package_test_fixtures",
  packageName: "@vecells/test-fixtures",
  packageRole: "shared",
  ownerContextCode: "test_fixtures",
  ownerContextLabel: "Test Fixtures",
  purpose:
    "Shared non-authoritative fixture builders; cannot become a dumping ground for runtime behavior.",
  versioningPosture:
    "Workspace-private published contract boundary. Public exports are explicit and versionable.",
  allowedDependencies: [
    "packages/domain-kernel",
    "packages/event-contracts",
    "packages/api-contracts",
    "packages/domains/* (public test seams only)",
  ],
  forbiddenDependencies: ["apps/* runtime truth", "services/* private internals"],
  dependencyContractRefs: ["CBC_041_ADAPTER_SIMULATORS_TO_CONTRACT_AND_FIXTURE_PACKAGES"],
  objectFamilyCount: 0,
  contractFamilyCount: 1,
  sourceContexts: [],
} as const satisfies PackageContract;

export const ownedObjectFamilies = [] as const satisfies readonly OwnedObjectFamily[];

export const ownedContractFamilies = [
  {
    contractFamilyId: "CF_044_CONTRACT_SAFE_FIXTURE_BUILDERS",
    label: "Contract-safe fixture builders",
    description:
      "Shared non-authoritative fixture builders used by simulators, tests, and dry-run harnesses.",
    versioningPosture:
      "Fixture-only family. Must stay non-authoritative and traceable to public contracts.",
    consumerContractIds: ["CBC_041_ADAPTER_SIMULATORS_TO_CONTRACT_AND_FIXTURE_PACKAGES"],
    consumerOwnerCodes: ["platform_integration"],
    consumerSelectors: ["services/adapter-simulators"],
    sourceRefs: ["prompt/038.md", "prompt/044.md"],
    ownedObjectFamilyCount: 0,
  },
] as const satisfies readonly OwnedContractFamily[];

export const eventFamilies = [] as const satisfies readonly OwnedObjectFamily[];

export const policyFamilies = [] as const satisfies readonly OwnedObjectFamily[];

export const projectionFamilies = [] as const satisfies readonly OwnedObjectFamily[];

export const fixtureBuilderFamilies = ownedContractFamilies;

export const fixtureScopeCatalog = [
  "patient-web",
  "clinical-workspace",
  "hub-desk",
  "pharmacy-console",
  "support-workspace",
  "ops-console",
  "governance-console",
] as const;

export function makeFixtureHandle(scope: string, name: string): string {
  return `${scope}::${name}`;
}

export function bootstrapSharedPackage() {
  return {
    packageName: packageContract.packageName,
    objectFamilies: ownedObjectFamilies.length,
    contractFamilies: ownedContractFamilies.length,
    eventFamilies: eventFamilies.length,
    policyFamilies: policyFamilies.length,
    projectionFamilies: projectionFamilies.length,
  };
}
