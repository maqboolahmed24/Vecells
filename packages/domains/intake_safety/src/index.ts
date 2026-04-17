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
  artifactId: "package_domains_intake_safety",
  packageName: "@vecells/domain-intake-safety",
  packageRole: "domain",
  ownerContextCode: "intake_safety",
  ownerContextLabel: "Intake Safety",
  purpose: "Canonical package home for the Intake Safety bounded context.",
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
  objectFamilyCount: 10,
  contractFamilyCount: 0,
  sourceContexts: ["triage_human_checkpoint"],
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
    canonicalName: "ApprovalCheckpoint",
    objectKind: "checkpoint",
    boundedContext: "triage_human_checkpoint",
    authoritativeOwner: "Triage domain",
    sourceRef:
      "phase-3-the-human-checkpoint.md#3A. Triage contract and workspace state model / Backend work / ApprovalCheckpoint",
  },
  {
    canonicalName: "ApprovalEvidenceBundle",
    objectKind: "bundle",
    boundedContext: "triage_human_checkpoint",
    authoritativeOwner: "Triage domain",
    sourceRef:
      "phase-3-the-human-checkpoint.md#Approval and endpoint decision flow / ApprovalEvidenceBundle",
  },
  {
    canonicalName: "DecisionEpoch",
    objectKind: "checkpoint",
    boundedContext: "triage_human_checkpoint",
    authoritativeOwner: "Triage domain",
    sourceRef:
      "phase-3-the-human-checkpoint.md#3A. Triage contract and workspace state model / Backend work / DecisionEpoch",
  },
  {
    canonicalName: "DecisionSupersessionRecord",
    objectKind: "record",
    boundedContext: "triage_human_checkpoint",
    authoritativeOwner: "Triage domain",
    sourceRef:
      "phase-3-the-human-checkpoint.md#3A. Triage contract and workspace state model / Backend work / DecisionSupersessionRecord",
  },
  {
    canonicalName: "EndpointDecision",
    objectKind: "record",
    boundedContext: "triage_human_checkpoint",
    authoritativeOwner: "Triage domain",
    sourceRef:
      "phase-3-the-human-checkpoint.md#3A. Triage contract and workspace state model / Backend work / EndpointDecision",
  },
  {
    canonicalName: "EndpointDecisionActionRecord",
    objectKind: "record",
    boundedContext: "triage_human_checkpoint",
    authoritativeOwner: "Triage domain",
    sourceRef:
      "phase-3-the-human-checkpoint.md#3E. Endpoint decision engine and resolution model / Backend work / EndpointDecisionActionRecord",
  },
  {
    canonicalName: "EndpointDecisionBinding",
    objectKind: "descriptor",
    boundedContext: "triage_human_checkpoint",
    authoritativeOwner: "Triage domain",
    sourceRef:
      "phase-3-the-human-checkpoint.md#3E. Endpoint decision engine and resolution model / Backend work / EndpointDecisionBinding",
  },
  {
    canonicalName: "EndpointDecisionSettlement",
    objectKind: "settlement",
    boundedContext: "triage_human_checkpoint",
    authoritativeOwner: "Triage domain",
    sourceRef:
      "phase-3-the-human-checkpoint.md#3E. Endpoint decision engine and resolution model / Backend work / EndpointDecisionSettlement",
  },
  {
    canonicalName: "EndpointOutcomePreviewArtifact",
    objectKind: "artifact",
    boundedContext: "triage_human_checkpoint",
    authoritativeOwner: "Triage domain",
    sourceRef:
      "phase-3-the-human-checkpoint.md#3E. Endpoint decision engine and resolution model / Backend work / EndpointOutcomePreviewArtifact",
  },
  {
    canonicalName: "WorkspaceSafetyInterruptProjection",
    objectKind: "projection",
    boundedContext: "triage_human_checkpoint",
    authoritativeOwner: "Triage domain",
    sourceRef:
      "phase-3-the-human-checkpoint.md#3A. Triage contract and workspace state model / Backend work / WorkspaceSafetyInterruptProjection",
  },
] as const satisfies readonly OwnedObjectFamily[];

export const aggregateFamilies = [
  {
    canonicalName: "DecisionSupersessionRecord",
    objectKind: "record",
    boundedContext: "triage_human_checkpoint",
    authoritativeOwner: "Triage domain",
    sourceRef:
      "phase-3-the-human-checkpoint.md#3A. Triage contract and workspace state model / Backend work / DecisionSupersessionRecord",
  },
] as const satisfies readonly OwnedObjectFamily[];

export const domainServiceFamilies = [] as const satisfies readonly OwnedObjectFamily[];

export const eventFamilies = [] as const satisfies readonly OwnedObjectFamily[];

export const policyFamilies = [] as const satisfies readonly OwnedObjectFamily[];

export const projectionFamilies = [
  {
    canonicalName: "WorkspaceSafetyInterruptProjection",
    objectKind: "projection",
    boundedContext: "triage_human_checkpoint",
    authoritativeOwner: "Triage domain",
    sourceRef:
      "phase-3-the-human-checkpoint.md#3A. Triage contract and workspace state model / Backend work / WorkspaceSafetyInterruptProjection",
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

export * from "./assimilation-safety-backbone";
export * from "./evidence-backbone";
export * from "./synchronous-safety-engine";
export * from "./urgent-diversion-settlement";
