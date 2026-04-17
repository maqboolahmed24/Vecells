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
  artifactId: "package_domains_governance_admin",
  packageName: "@vecells/domain-governance-admin",
  packageRole: "domain",
  ownerContextCode: "governance_admin",
  ownerContextLabel: "Governance Admin",
  purpose: "Canonical package home for the Governance Admin bounded context.",
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
  objectFamilyCount: 34,
  contractFamilyCount: 0,
  sourceContexts: ["assurance_and_governance", "platform_configuration"],
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
    canonicalName: "AccessAdministrationWorkspace",
    objectKind: "other",
    boundedContext: "platform_configuration",
    authoritativeOwner: "Platform administration and configuration",
    sourceRef:
      "platform-admin-and-config-blueprint.md#Access administration contract / AccessAdministrationWorkspace",
  },
  {
    canonicalName: "AccessFreezeDisposition",
    objectKind: "record",
    boundedContext: "platform_configuration",
    authoritativeOwner: "Platform administration and configuration",
    sourceRef:
      "platform-admin-and-config-blueprint.md#Access administration contract / AccessFreezeDisposition",
  },
  {
    canonicalName: "AccessImpactDigest",
    objectKind: "digest",
    boundedContext: "platform_configuration",
    authoritativeOwner: "Platform administration and configuration",
    sourceRef:
      "platform-admin-and-config-blueprint.md#Access administration contract / AccessImpactDigest",
  },
  {
    canonicalName: "AdminActionRecord",
    objectKind: "record",
    boundedContext: "platform_configuration",
    authoritativeOwner: "Platform administration and configuration",
    sourceRef: "platform-admin-and-config-blueprint.md#Config center contract / AdminActionRecord",
  },
  {
    canonicalName: "AdminActionSettlement",
    objectKind: "settlement",
    boundedContext: "platform_configuration",
    authoritativeOwner: "Platform administration and configuration",
    sourceRef:
      "platform-admin-and-config-blueprint.md#Config center contract / AdminActionSettlement",
  },
  {
    canonicalName: "BoundedContextImpactDigest",
    objectKind: "digest",
    boundedContext: "platform_configuration",
    authoritativeOwner: "Platform administration and configuration",
    sourceRef:
      "platform-admin-and-config-blueprint.md#Config center contract / BoundedContextImpactDigest",
  },
  {
    canonicalName: "CAPAAction",
    objectKind: "other",
    boundedContext: "assurance_and_governance",
    authoritativeOwner: "Assurance and governance spine",
    sourceRef:
      "phase-9-the-assurance-ledger.md#9D. Assurance pack factory and standards evidence pipeline / Backend work / CAPAAction",
  },
  {
    canonicalName: "ChaosExperiment",
    objectKind: "other",
    boundedContext: "assurance_and_governance",
    authoritativeOwner: "Assurance and governance spine",
    sourceRef:
      "phase-9-the-assurance-ledger.md#9F. Resilience architecture, restore orchestration, and chaos programme / Backend work / ChaosExperiment",
  },
  {
    canonicalName: "CommunicationsFreezeDisposition",
    objectKind: "record",
    boundedContext: "platform_configuration",
    authoritativeOwner: "Platform administration and configuration",
    sourceRef:
      "platform-admin-and-config-blueprint.md#Communication governance contract / CommunicationsFreezeDisposition",
  },
  {
    canonicalName: "CommunicationsGovernanceWorkspace",
    objectKind: "other",
    boundedContext: "platform_configuration",
    authoritativeOwner: "Platform administration and configuration",
    sourceRef:
      "platform-admin-and-config-blueprint.md#Communication governance contract / CommunicationsGovernanceWorkspace",
  },
  {
    canonicalName: "CommunicationsSimulationEnvelope",
    objectKind: "record",
    boundedContext: "platform_configuration",
    authoritativeOwner: "Platform administration and configuration",
    sourceRef:
      "platform-admin-and-config-blueprint.md#Communication governance contract / CommunicationsSimulationEnvelope",
  },
  {
    canonicalName: "ConfigBlastRadiusDigest",
    objectKind: "digest",
    boundedContext: "platform_configuration",
    authoritativeOwner: "Platform administration and configuration",
    sourceRef:
      "platform-admin-and-config-blueprint.md#Config center contract / ConfigBlastRadiusDigest",
  },
  {
    canonicalName: "ConfigCompilationRecord",
    objectKind: "record",
    boundedContext: "platform_configuration",
    authoritativeOwner: "Platform administration and configuration",
    sourceRef:
      "platform-admin-and-config-blueprint.md#Config center contract / ConfigCompilationRecord",
  },
  {
    canonicalName: "ConfigDriftFence",
    objectKind: "gate",
    boundedContext: "platform_configuration",
    authoritativeOwner: "Platform administration and configuration",
    sourceRef: "platform-admin-and-config-blueprint.md#Config center contract / ConfigDriftFence",
  },
  {
    canonicalName: "ConfigSimulationEnvelope",
    objectKind: "record",
    boundedContext: "platform_configuration",
    authoritativeOwner: "Platform administration and configuration",
    sourceRef:
      "platform-admin-and-config-blueprint.md#Config center contract / ConfigSimulationEnvelope",
  },
  {
    canonicalName: "ConfigVersion",
    objectKind: "other",
    boundedContext: "assurance_and_governance",
    authoritativeOwner: "Assurance and governance spine",
    sourceRef:
      "phase-9-the-assurance-ledger.md#9H. Tenant governance, config immutability, and dependency hygiene / Backend work / ConfigVersion",
  },
  {
    canonicalName: "ConfigWorkspaceContext",
    objectKind: "other",
    boundedContext: "platform_configuration",
    authoritativeOwner: "Platform administration and configuration",
    sourceRef:
      "platform-admin-and-config-blueprint.md#Config center contract / ConfigWorkspaceContext",
  },
  {
    canonicalName: "ContainmentAction",
    objectKind: "other",
    boundedContext: "assurance_and_governance",
    authoritativeOwner: "Assurance and governance spine",
    sourceRef:
      "phase-9-the-assurance-ledger.md#9G. Security operations, incident workflow, and just-culture reporting / Backend work / ContainmentAction",
  },
  {
    canonicalName: "ContinuityControlImpactDigest",
    objectKind: "digest",
    boundedContext: "platform_configuration",
    authoritativeOwner: "Platform administration and configuration",
    sourceRef:
      "platform-admin-and-config-blueprint.md#Config center contract / ContinuityControlImpactDigest",
  },
  {
    canonicalName: "DependencyLifecycleRecord",
    objectKind: "record",
    boundedContext: "platform_configuration",
    authoritativeOwner: "Platform administration and configuration",
    sourceRef:
      "platform-admin-and-config-blueprint.md#Dependency and standards hygiene / DependencyLifecycleRecord",
  },
  {
    canonicalName: "EffectiveConfigResolution",
    objectKind: "other",
    boundedContext: "platform_configuration",
    authoritativeOwner: "Platform administration and configuration",
    sourceRef:
      "platform-admin-and-config-blueprint.md#Config center contract / EffectiveConfigResolution",
  },
  {
    canonicalName: "GovernanceEvidenceArtifact",
    objectKind: "artifact",
    boundedContext: "platform_configuration",
    authoritativeOwner: "Platform administration and configuration",
    sourceRef:
      "governance-admin-console-frontend-blueprint.md#Governance-specific interaction primitives / Governance surface posture and evidence artifacts / GovernanceEvidenceArtifact",
  },
  {
    canonicalName: "GovernanceEvidencePackArtifact",
    objectKind: "artifact",
    boundedContext: "platform_configuration",
    authoritativeOwner: "Platform administration and configuration",
    sourceRef:
      "governance-admin-console-frontend-blueprint.md#Screen contracts / Compliance and evidence: `/ops/governance/compliance` / GovernanceEvidencePackArtifact",
  },
  {
    canonicalName: "GovernanceEvidencePackTransfer",
    objectKind: "other",
    boundedContext: "platform_configuration",
    authoritativeOwner: "Platform administration and configuration",
    sourceRef:
      "governance-admin-console-frontend-blueprint.md#Screen contracts / Compliance and evidence: `/ops/governance/compliance` / GovernanceEvidencePackTransfer",
  },
  {
    canonicalName: "GovernanceSurfacePosture",
    objectKind: "other",
    boundedContext: "platform_configuration",
    authoritativeOwner: "Platform administration and configuration",
    sourceRef:
      "governance-admin-console-frontend-blueprint.md#Governance-specific interaction primitives / Governance surface posture and evidence artifacts / GovernanceSurfacePosture",
  },
  {
    canonicalName: "LegacyReferenceFinding",
    objectKind: "other",
    boundedContext: "platform_configuration",
    authoritativeOwner: "Platform administration and configuration",
    sourceRef:
      "platform-admin-and-config-blueprint.md#Dependency and standards hygiene / LegacyReferenceFinding",
  },
  {
    canonicalName: "MigrationCutoverCheckpoint",
    objectKind: "checkpoint",
    boundedContext: "platform_configuration",
    authoritativeOwner: "Platform administration and configuration",
    sourceRef:
      "platform-admin-and-config-blueprint.md#Release governance contract / MigrationCutoverCheckpoint",
  },
  {
    canonicalName: "PolicyCompatibilityAlert",
    objectKind: "other",
    boundedContext: "platform_configuration",
    authoritativeOwner: "Platform administration and configuration",
    sourceRef:
      "platform-admin-and-config-blueprint.md#Dependency and standards hygiene / PolicyCompatibilityAlert",
  },
  {
    canonicalName: "ProjectionBackfillExecutionLedger",
    objectKind: "other",
    boundedContext: "platform_configuration",
    authoritativeOwner: "Platform administration and configuration",
    sourceRef:
      "platform-admin-and-config-blueprint.md#Release governance contract / ProjectionBackfillExecutionLedger",
  },
  {
    canonicalName: "ReadPathCompatibilityDigest",
    objectKind: "digest",
    boundedContext: "platform_configuration",
    authoritativeOwner: "Platform administration and configuration",
    sourceRef:
      "platform-admin-and-config-blueprint.md#Release governance contract / ReadPathCompatibilityDigest",
  },
  {
    canonicalName: "StandardsBaselineMap",
    objectKind: "other",
    boundedContext: "platform_configuration",
    authoritativeOwner: "Platform administration and configuration",
    sourceRef:
      "platform-admin-and-config-blueprint.md#Dependency and standards hygiene / StandardsBaselineMap",
  },
  {
    canonicalName: "StandardsExceptionRecord",
    objectKind: "record",
    boundedContext: "platform_configuration",
    authoritativeOwner: "Platform administration and configuration",
    sourceRef:
      "platform-admin-and-config-blueprint.md#Dependency and standards hygiene / StandardsExceptionRecord",
  },
  {
    canonicalName: "TemplatePolicyImpactDigest",
    objectKind: "digest",
    boundedContext: "platform_configuration",
    authoritativeOwner: "Platform administration and configuration",
    sourceRef:
      "platform-admin-and-config-blueprint.md#Communication governance contract / TemplatePolicyImpactDigest",
  },
  {
    canonicalName: "VisibilityCoverageImpactDigest",
    objectKind: "digest",
    boundedContext: "platform_configuration",
    authoritativeOwner: "Platform administration and configuration",
    sourceRef:
      "platform-admin-and-config-blueprint.md#Config center contract / VisibilityCoverageImpactDigest",
  },
] as const satisfies readonly OwnedObjectFamily[];

export const aggregateFamilies = [] as const satisfies readonly OwnedObjectFamily[];

export const domainServiceFamilies = [] as const satisfies readonly OwnedObjectFamily[];

export const eventFamilies = [] as const satisfies readonly OwnedObjectFamily[];

export const policyFamilies = [
  {
    canonicalName: "AccessFreezeDisposition",
    objectKind: "record",
    boundedContext: "platform_configuration",
    authoritativeOwner: "Platform administration and configuration",
    sourceRef:
      "platform-admin-and-config-blueprint.md#Access administration contract / AccessFreezeDisposition",
  },
  {
    canonicalName: "CommunicationsFreezeDisposition",
    objectKind: "record",
    boundedContext: "platform_configuration",
    authoritativeOwner: "Platform administration and configuration",
    sourceRef:
      "platform-admin-and-config-blueprint.md#Communication governance contract / CommunicationsFreezeDisposition",
  },
  {
    canonicalName: "ConfigDriftFence",
    objectKind: "gate",
    boundedContext: "platform_configuration",
    authoritativeOwner: "Platform administration and configuration",
    sourceRef: "platform-admin-and-config-blueprint.md#Config center contract / ConfigDriftFence",
  },
  {
    canonicalName: "PolicyCompatibilityAlert",
    objectKind: "other",
    boundedContext: "platform_configuration",
    authoritativeOwner: "Platform administration and configuration",
    sourceRef:
      "platform-admin-and-config-blueprint.md#Dependency and standards hygiene / PolicyCompatibilityAlert",
  },
  {
    canonicalName: "ReadPathCompatibilityDigest",
    objectKind: "digest",
    boundedContext: "platform_configuration",
    authoritativeOwner: "Platform administration and configuration",
    sourceRef:
      "platform-admin-and-config-blueprint.md#Release governance contract / ReadPathCompatibilityDigest",
  },
  {
    canonicalName: "TemplatePolicyImpactDigest",
    objectKind: "digest",
    boundedContext: "platform_configuration",
    authoritativeOwner: "Platform administration and configuration",
    sourceRef:
      "platform-admin-and-config-blueprint.md#Communication governance contract / TemplatePolicyImpactDigest",
  },
] as const satisfies readonly OwnedObjectFamily[];

export const projectionFamilies = [
  {
    canonicalName: "ProjectionBackfillExecutionLedger",
    objectKind: "other",
    boundedContext: "platform_configuration",
    authoritativeOwner: "Platform administration and configuration",
    sourceRef:
      "platform-admin-and-config-blueprint.md#Release governance contract / ProjectionBackfillExecutionLedger",
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
