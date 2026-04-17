export interface OwnedObjectFamily {
  canonicalName: string;
  objectKind: string;
  boundedContext: string;
  authoritativeOwner: string;
  sourceRef: string;
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
  artifactId: "package_domains_release_control",
  packageName: "@vecells/domain-release-control",
  packageRole: "domain",
  ownerContextCode: "release_control",
  ownerContextLabel: "Release Control",
  purpose: "Canonical package home for the Release Control bounded context.",
  versioningPosture:
    "Workspace-private domain boundary. Public exports are explicit and additive-first.",
  allowedDependencies: [
    "packages/domain-kernel",
    "packages/event-contracts",
    "packages/authz-policy",
    "packages/observability",
  ],
  forbiddenDependencies: [
    "packages/domains/* sibling internals",
    "apps/*",
    "services/*",
    "packages/design-system",
  ],
  dependencyContractRefs: [
    "CBC_041_DOMAIN_PACKAGES_TO_DOMAIN_KERNEL",
    "CBC_041_DOMAIN_PACKAGES_TO_EVENT_CONTRACTS",
    "CBC_041_DOMAIN_PACKAGES_TO_POLICY_AND_OBSERVABILITY",
  ],
  objectFamilyCount: 29,
  contractFamilyCount: 0,
  sourceContexts: ["runtime_release"],
} as const satisfies PackageContract;

export const domainModule = {
  artifactId: packageContract.artifactId,
  packageName: packageContract.packageName,
  ownerContext: packageContract.ownerContextCode,
  posture: "baseline_required",
  note: packageContract.purpose,
} as const;

export const ownedObjectFamilies = [
  {
    canonicalName: "AssuranceSliceProbe",
    objectKind: "other",
    boundedContext: "runtime_release",
    authoritativeOwner: "Runtime publication control plane",
    sourceRef:
      "platform-runtime-and-release-blueprint.md#Verification ladder contract / AssuranceSliceProbe",
  },
  {
    canonicalName: "BuildProvenanceRecord",
    objectKind: "record",
    boundedContext: "runtime_release",
    authoritativeOwner: "Runtime publication control plane",
    sourceRef:
      "platform-runtime-and-release-blueprint.md#Runtime publication completeness / BuildProvenanceRecord",
  },
  {
    canonicalName: "EmergencyReleaseException",
    objectKind: "other",
    boundedContext: "runtime_release",
    authoritativeOwner: "Runtime publication control plane",
    sourceRef:
      "platform-runtime-and-release-blueprint.md#Environment ring and promotion contract / EmergencyReleaseException",
  },
  {
    canonicalName: "GovernedControlHandoffBinding",
    objectKind: "descriptor",
    boundedContext: "runtime_release",
    authoritativeOwner: "Runtime publication control plane",
    sourceRef:
      "platform-runtime-and-release-blueprint.md#CI/CD and supply-chain pipeline contract / GovernedControlHandoffBinding",
  },
  {
    canonicalName: "MigrationActionObservationWindow",
    objectKind: "other",
    boundedContext: "runtime_release",
    authoritativeOwner: "Runtime publication control plane",
    sourceRef:
      "platform-runtime-and-release-blueprint.md#Data persistence and migration contract / MigrationActionObservationWindow",
  },
  {
    canonicalName: "MigrationActionRecord",
    objectKind: "record",
    boundedContext: "runtime_release",
    authoritativeOwner: "Runtime publication control plane",
    sourceRef:
      "platform-runtime-and-release-blueprint.md#Data persistence and migration contract / MigrationActionRecord",
  },
  {
    canonicalName: "MigrationActionSettlement",
    objectKind: "settlement",
    boundedContext: "runtime_release",
    authoritativeOwner: "Runtime publication control plane",
    sourceRef:
      "platform-runtime-and-release-blueprint.md#Data persistence and migration contract / MigrationActionSettlement",
  },
  {
    canonicalName: "MigrationExecutionBinding",
    objectKind: "descriptor",
    boundedContext: "runtime_release",
    authoritativeOwner: "Runtime publication control plane",
    sourceRef:
      "platform-runtime-and-release-blueprint.md#Data persistence and migration contract / MigrationExecutionBinding",
  },
  {
    canonicalName: "MigrationExecutionReceipt",
    objectKind: "other",
    boundedContext: "runtime_release",
    authoritativeOwner: "Runtime publication control plane",
    sourceRef:
      "platform-runtime-and-release-blueprint.md#Data persistence and migration contract / MigrationExecutionReceipt",
  },
  {
    canonicalName: "MigrationImpactPreview",
    objectKind: "other",
    boundedContext: "runtime_release",
    authoritativeOwner: "Runtime publication control plane",
    sourceRef:
      "platform-runtime-and-release-blueprint.md#Data persistence and migration contract / MigrationImpactPreview",
  },
  {
    canonicalName: "MigrationPresentationArtifact",
    objectKind: "artifact",
    boundedContext: "runtime_release",
    authoritativeOwner: "Runtime publication control plane",
    sourceRef:
      "platform-runtime-and-release-blueprint.md#Data persistence and migration contract / MigrationPresentationArtifact",
  },
  {
    canonicalName: "MigrationVerificationRecord",
    objectKind: "record",
    boundedContext: "runtime_release",
    authoritativeOwner: "Runtime publication control plane",
    sourceRef:
      "platform-runtime-and-release-blueprint.md#Verification ladder contract / MigrationVerificationRecord",
  },
  {
    canonicalName: "PipelineEmergencyException",
    objectKind: "other",
    boundedContext: "runtime_release",
    authoritativeOwner: "Runtime publication control plane",
    sourceRef:
      "platform-runtime-and-release-blueprint.md#CI/CD and supply-chain pipeline contract / PipelineEmergencyException",
  },
  {
    canonicalName: "PipelineExecutionRecord",
    objectKind: "record",
    boundedContext: "runtime_release",
    authoritativeOwner: "Runtime publication control plane",
    sourceRef:
      "platform-runtime-and-release-blueprint.md#CI/CD and supply-chain pipeline contract / PipelineExecutionRecord",
  },
  {
    canonicalName: "PipelineStageSettlement",
    objectKind: "settlement",
    boundedContext: "runtime_release",
    authoritativeOwner: "Runtime publication control plane",
    sourceRef:
      "platform-runtime-and-release-blueprint.md#CI/CD and supply-chain pipeline contract / PipelineStageSettlement",
  },
  {
    canonicalName: "PromotionIntentEnvelope",
    objectKind: "record",
    boundedContext: "runtime_release",
    authoritativeOwner: "Runtime publication control plane",
    sourceRef:
      "platform-runtime-and-release-blueprint.md#Environment ring and promotion contract / PromotionIntentEnvelope",
  },
  {
    canonicalName: "ReadinessArtifact",
    objectKind: "artifact",
    boundedContext: "runtime_release",
    authoritativeOwner: "Runtime publication control plane",
    sourceRef:
      "platform-runtime-and-release-blueprint.md#CI/CD and supply-chain pipeline contract / ReadinessArtifact",
  },
  {
    canonicalName: "ReleaseContractVerificationMatrix",
    objectKind: "other",
    boundedContext: "runtime_release",
    authoritativeOwner: "Runtime publication control plane",
    sourceRef:
      "platform-runtime-and-release-blueprint.md#Verification ladder contract / ReleaseContractVerificationMatrix",
  },
  {
    canonicalName: "RuntimeTopologyManifest",
    objectKind: "manifest",
    boundedContext: "runtime_release",
    authoritativeOwner: "Runtime publication control plane",
    sourceRef:
      "platform-runtime-and-release-blueprint.md#Runtime publication completeness / RuntimeTopologyManifest",
  },
  {
    canonicalName: "SurfaceStateKernelBinding",
    objectKind: "descriptor",
    boundedContext: "runtime_release",
    authoritativeOwner: "Runtime publication control plane",
    sourceRef:
      "platform-runtime-and-release-blueprint.md#Runtime publication completeness / SurfaceStateKernelBinding",
  },
  {
    canonicalName: "UIProjectionVisibilityReceipt",
    objectKind: "other",
    boundedContext: "runtime_release",
    authoritativeOwner: "Runtime publication control plane",
    sourceRef:
      "platform-runtime-and-release-blueprint.md#Runtime publication and controlled migrations / UIProjectionVisibilityReceipt",
  },
  {
    canonicalName: "VerificationScenario",
    objectKind: "other",
    boundedContext: "runtime_release",
    authoritativeOwner: "Runtime publication control plane",
    sourceRef:
      "platform-runtime-and-release-blueprint.md#Verification ladder contract / VerificationScenario",
  },
  {
    canonicalName: "WaveActionExecutionReceipt",
    objectKind: "other",
    boundedContext: "runtime_release",
    authoritativeOwner: "Runtime publication control plane",
    sourceRef:
      "platform-runtime-and-release-blueprint.md#Runtime topology contract / `WaveActionRecord` / WaveActionExecutionReceipt",
  },
  {
    canonicalName: "WaveActionImpactPreview",
    objectKind: "other",
    boundedContext: "runtime_release",
    authoritativeOwner: "Runtime publication control plane",
    sourceRef:
      "platform-runtime-and-release-blueprint.md#Runtime topology contract / `WaveActionRecord` / WaveActionImpactPreview",
  },
  {
    canonicalName: "WaveActionLineage",
    objectKind: "other",
    boundedContext: "runtime_release",
    authoritativeOwner: "Runtime publication control plane",
    sourceRef:
      "platform-runtime-and-release-blueprint.md#Runtime topology contract / `WaveActionRecord` / WaveActionLineage",
  },
  {
    canonicalName: "WaveActionObservationWindow",
    objectKind: "other",
    boundedContext: "runtime_release",
    authoritativeOwner: "Runtime publication control plane",
    sourceRef:
      "platform-runtime-and-release-blueprint.md#Runtime topology contract / `WaveActionRecord` / WaveActionObservationWindow",
  },
  {
    canonicalName: "WaveControlFence",
    objectKind: "gate",
    boundedContext: "runtime_release",
    authoritativeOwner: "Runtime publication control plane",
    sourceRef:
      "platform-runtime-and-release-blueprint.md#Environment ring and promotion contract / WaveControlFence",
  },
  {
    canonicalName: "WaveEligibilitySnapshot",
    objectKind: "record",
    boundedContext: "runtime_release",
    authoritativeOwner: "Runtime publication control plane",
    sourceRef:
      "platform-runtime-and-release-blueprint.md#Environment ring and promotion contract / WaveEligibilitySnapshot",
  },
  {
    canonicalName: "WaveVerificationRecord",
    objectKind: "record",
    boundedContext: "runtime_release",
    authoritativeOwner: "Runtime publication control plane",
    sourceRef:
      "platform-runtime-and-release-blueprint.md#Verification ladder contract / WaveVerificationRecord",
  },
] as const satisfies readonly OwnedObjectFamily[];

export const aggregateFamilies = [] as const satisfies readonly OwnedObjectFamily[];

export const domainServiceFamilies = [] as const satisfies readonly OwnedObjectFamily[];

export const eventFamilies = [] as const satisfies readonly OwnedObjectFamily[];

export const policyFamilies = [
  {
    canonicalName: "WaveControlFence",
    objectKind: "gate",
    boundedContext: "runtime_release",
    authoritativeOwner: "Runtime publication control plane",
    sourceRef:
      "platform-runtime-and-release-blueprint.md#Environment ring and promotion contract / WaveControlFence",
  },
  {
    canonicalName: "WaveEligibilitySnapshot",
    objectKind: "record",
    boundedContext: "runtime_release",
    authoritativeOwner: "Runtime publication control plane",
    sourceRef:
      "platform-runtime-and-release-blueprint.md#Environment ring and promotion contract / WaveEligibilitySnapshot",
  },
] as const satisfies readonly OwnedObjectFamily[];

export const projectionFamilies = [
  {
    canonicalName: "UIProjectionVisibilityReceipt",
    objectKind: "other",
    boundedContext: "runtime_release",
    authoritativeOwner: "Runtime publication control plane",
    sourceRef:
      "platform-runtime-and-release-blueprint.md#Runtime publication and controlled migrations / UIProjectionVisibilityReceipt",
  },
] as const satisfies readonly OwnedObjectFamily[];

export function bootstrapDomainModule() {
  return {
    packageName: packageContract.packageName,
    objectFamilies: ownedObjectFamilies.length,
    aggregateFamilies: aggregateFamilies.length,
    domainServiceFamilies: domainServiceFamilies.length,
    eventFamilies: eventFamilies.length,
    policyFamilies: policyFamilies.length,
    projectionFamilies: projectionFamilies.length,
  };
}
