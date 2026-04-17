export const packageMetadata = {
  artifactId: "package_domain_kernel",
  packageName: "@vecells/domain-kernel",
  ownerContext: "shared_domain_kernel",
  note: "Canonical shared primitives only.",
} as const;

export interface FoundationRef {
  family: string;
  key: string;
}

export function makeFoundationRef(family: string, key: string): FoundationRef {
  return { family, key };
}

export * from "./cache-live-transport";
export * from "./event-spine";
export * from "./phase3-triage-fencing";
export * from "./patient-support-phase2-integration";
export * from "./review-bundle-contracts";
export * from "./request-intake-backbone";
export * from "./workspace-projection-tuples";

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
  artifactId: "package_domain_kernel",
  packageName: "@vecells/domain-kernel",
  packageRole: "shared",
  ownerContextCode: "shared_domain_kernel",
  ownerContextLabel: "Shared Domain Kernel",
  purpose:
    "Only legal shared-kernel home for canonical identifiers, invariants, and cross-context primitives.",
  versioningPosture:
    "Workspace-private published contract boundary. Public exports are explicit and versionable.",
  allowedDependencies: [],
  forbiddenDependencies: ["apps/*", "services/*", "packages/domains/*"],
  dependencyContractRefs: ["CBC_041_DOMAIN_PACKAGES_TO_DOMAIN_KERNEL"],
  objectFamilyCount: 39,
  contractFamilyCount: 1,
  sourceContexts: ["foundation_control_plane", "unknown"],
} as const satisfies PackageContract;

export const ownedObjectFamilies = [
  {
    canonicalName: "BinaryArtifactDelivery",
    objectKind: "artifact",
    boundedContext: "unknown",
    authoritativeOwner: "Programme architecture registry",
    sourceRef:
      "phase-7-inside-the-nhs-app.md#7F. Webview limitations, file handling, and resilient error UX / Backend work / BinaryArtifactDelivery",
  },
  {
    canonicalName: "BridgeActionLease",
    objectKind: "lease",
    boundedContext: "unknown",
    authoritativeOwner: "Programme architecture registry",
    sourceRef:
      "phase-7-inside-the-nhs-app.md#7E. NHS App bridge API, navigation model, and embedded behaviours / Backend work / BridgeActionLease",
  },
  {
    canonicalName: "BridgeCapabilityMatrix",
    objectKind: "other",
    boundedContext: "unknown",
    authoritativeOwner: "Programme architecture registry",
    sourceRef:
      "phase-7-inside-the-nhs-app.md#7E. NHS App bridge API, navigation model, and embedded behaviours / Backend work / BridgeCapabilityMatrix",
  },
  {
    canonicalName: "CLOSE",
    objectKind: "other",
    boundedContext: "unknown",
    authoritativeOwner: "Programme architecture registry",
    sourceRef: "vecells-complete-end-to-end-flow.md#Audited flow baseline / CLOSE",
  },
  {
    canonicalName: "CallSession",
    objectKind: "other",
    boundedContext: "unknown",
    authoritativeOwner: "Programme architecture registry",
    sourceRef:
      "phase-2-identity-and-echoes.md#2A. Trust contract and capability gates / CallSession",
  },
  {
    canonicalName: "EmbeddedShell",
    objectKind: "other",
    boundedContext: "unknown",
    authoritativeOwner: "Programme architecture registry",
    sourceRef:
      "phase-7-inside-the-nhs-app.md#7B. Embedded channel bootstrap, context resolver, and shell split / Frontend work / EmbeddedShell",
  },
  {
    canonicalName: "EmbeddedShellConsistencyProjection",
    objectKind: "projection",
    boundedContext: "unknown",
    authoritativeOwner: "Programme architecture registry",
    sourceRef:
      "phase-7-inside-the-nhs-app.md#7B. Embedded channel bootstrap, context resolver, and shell split / Backend work / EmbeddedShellConsistencyProjection",
  },
  {
    canonicalName: "Home",
    objectKind: "other",
    boundedContext: "unknown",
    authoritativeOwner: "Programme architecture registry",
    sourceRef: "vecells-complete-end-to-end-flow.md#Audited flow baseline / Home",
  },
  {
    canonicalName: "HubContinuationLease",
    objectKind: "lease",
    boundedContext: "unknown",
    authoritativeOwner: "Programme architecture registry",
    sourceRef: "forensic-audit-findings.md#Finding 75 patch response / HubContinuationLease",
  },
  {
    canonicalName: "IdentityAssertionBinding",
    objectKind: "descriptor",
    boundedContext: "unknown",
    authoritativeOwner: "Programme architecture registry",
    sourceRef:
      "phase-7-inside-the-nhs-app.md#7C. NHS App SSO bridge and local session continuity / Backend work / IdentityAssertionBinding",
  },
  {
    canonicalName: "IdentityContext",
    objectKind: "other",
    boundedContext: "unknown",
    authoritativeOwner: "Programme architecture registry",
    sourceRef:
      "phase-2-identity-and-echoes.md#2A. Trust contract and capability gates / IdentityContext",
  },
  {
    canonicalName: "IntakeOutcomePresentationArtifact",
    objectKind: "artifact",
    boundedContext: "unknown",
    authoritativeOwner: "Programme architecture registry",
    sourceRef:
      "phase-1-the-red-flag-gate.md#1A. Journey contract and intake schema lock / IntakeOutcomePresentationArtifact",
  },
  {
    canonicalName: "IntakeSubmitSettlement",
    objectKind: "settlement",
    boundedContext: "unknown",
    authoritativeOwner: "Programme architecture registry",
    sourceRef:
      "phase-1-the-red-flag-gate.md#1A. Journey contract and intake schema lock / IntakeSubmitSettlement",
  },
  {
    canonicalName: "IntegrationDemoDataset",
    objectKind: "other",
    boundedContext: "unknown",
    authoritativeOwner: "Programme architecture registry",
    sourceRef:
      "phase-7-inside-the-nhs-app.md#7H. Sandpit, AOS, SCAL, and operational delivery pipeline / Backend work / IntegrationDemoDataset",
  },
  {
    canonicalName: "JourneyChangeNotice",
    objectKind: "other",
    boundedContext: "unknown",
    authoritativeOwner: "Programme architecture registry",
    sourceRef:
      "phase-7-inside-the-nhs-app.md#7I. Limited release, post-live governance, and formal exit gate / Backend work / JourneyChangeNotice",
  },
  {
    canonicalName: "JourneyPathDefinition",
    objectKind: "other",
    boundedContext: "unknown",
    authoritativeOwner: "Programme architecture registry",
    sourceRef:
      "phase-7-inside-the-nhs-app.md#7A. Journey inventory, integration manifest, and onboarding pack / Backend work / JourneyPathDefinition",
  },
  {
    canonicalName: "JumpOffMapping",
    objectKind: "other",
    boundedContext: "unknown",
    authoritativeOwner: "Programme architecture registry",
    sourceRef:
      "phase-7-inside-the-nhs-app.md#7A. Journey inventory, integration manifest, and onboarding pack / Backend work / JumpOffMapping",
  },
  {
    canonicalName: "LineageCaseLink",
    objectKind: "aggregate",
    boundedContext: "foundation_control_plane",
    authoritativeOwner: "Foundation control plane",
    sourceRef:
      "phase-0-the-foundation-protocol.md#Canonical lifecycle, identity, safety, reservation, access, and reconciliation algorithm / 1. Required platform objects / LineageCaseLink",
  },
  {
    canonicalName: "ManifestPromotionBundle",
    objectKind: "bundle",
    boundedContext: "unknown",
    authoritativeOwner: "Programme architecture registry",
    sourceRef:
      "phase-7-inside-the-nhs-app.md#7A. Journey inventory, integration manifest, and onboarding pack / Backend work / ManifestPromotionBundle",
  },
  {
    canonicalName: "NHSAppBridge",
    objectKind: "other",
    boundedContext: "unknown",
    authoritativeOwner: "Programme architecture registry",
    sourceRef:
      "phase-7-inside-the-nhs-app.md#7E. NHS App bridge API, navigation model, and embedded behaviours / Backend work / NHSAppBridge",
  },
  {
    canonicalName: "NHSAppEnvironmentProfile",
    objectKind: "descriptor",
    boundedContext: "unknown",
    authoritativeOwner: "Programme architecture registry",
    sourceRef:
      "phase-7-inside-the-nhs-app.md#7H. Sandpit, AOS, SCAL, and operational delivery pipeline / Backend work / NHSAppEnvironmentProfile",
  },
  {
    canonicalName: "NHSAppIntegrationManifest",
    objectKind: "manifest",
    boundedContext: "unknown",
    authoritativeOwner: "Programme architecture registry",
    sourceRef:
      "phase-7-inside-the-nhs-app.md#7A. Journey inventory, integration manifest, and onboarding pack / Backend work / NHSAppIntegrationManifest",
  },
  {
    canonicalName: "NHSAppPerformancePack",
    objectKind: "bundle",
    boundedContext: "unknown",
    authoritativeOwner: "Programme architecture registry",
    sourceRef:
      "phase-7-inside-the-nhs-app.md#7I. Limited release, post-live governance, and formal exit gate / Backend work / NHSAppPerformancePack",
  },
  {
    canonicalName: "PatientEmbeddedNavEligibility",
    objectKind: "other",
    boundedContext: "unknown",
    authoritativeOwner: "Programme architecture registry",
    sourceRef:
      "phase-7-inside-the-nhs-app.md#7B. Embedded channel bootstrap, context resolver, and shell split / Backend work / PatientEmbeddedNavEligibility",
  },
  {
    canonicalName: "PharmacyContinuationLease",
    objectKind: "lease",
    boundedContext: "unknown",
    authoritativeOwner: "Programme architecture registry",
    sourceRef: "forensic-audit-findings.md#Finding 76 patch response / PharmacyContinuationLease",
  },
  {
    canonicalName: "Request",
    objectKind: "aggregate",
    boundedContext: "foundation_control_plane",
    authoritativeOwner: "Foundation control plane",
    sourceRef:
      "phase-0-the-foundation-protocol.md#Canonical lifecycle, identity, safety, reservation, access, and reconciliation algorithm / 1. Required platform objects / Request",
  },
  {
    canonicalName: "RequestLineage",
    objectKind: "aggregate",
    boundedContext: "foundation_control_plane",
    authoritativeOwner: "Foundation control plane",
    sourceRef:
      "phase-0-the-foundation-protocol.md#Canonical lifecycle, identity, safety, reservation, access, and reconciliation algorithm / 1. Required platform objects / RequestLineage",
  },
  {
    canonicalName: "ReturnIntent",
    objectKind: "other",
    boundedContext: "unknown",
    authoritativeOwner: "Programme architecture registry",
    sourceRef:
      "phase-7-inside-the-nhs-app.md#7C. NHS App SSO bridge and local session continuity / Backend work / ReturnIntent",
  },
  {
    canonicalName: "SCALBundle",
    objectKind: "bundle",
    boundedContext: "unknown",
    authoritativeOwner: "Programme architecture registry",
    sourceRef:
      "phase-7-inside-the-nhs-app.md#7H. Sandpit, AOS, SCAL, and operational delivery pipeline / Backend work / SCALBundle",
  },
  {
    canonicalName: "SSOReturnDisposition",
    objectKind: "record",
    boundedContext: "unknown",
    authoritativeOwner: "Programme architecture registry",
    sourceRef:
      "phase-7-inside-the-nhs-app.md#7C. NHS App SSO bridge and local session continuity / Backend work / SSOReturnDisposition",
  },
  {
    canonicalName: "ServiceRequest",
    objectKind: "other",
    boundedContext: "unknown",
    authoritativeOwner: "Programme architecture registry",
    sourceRef: "vecells-complete-end-to-end-flow.md#Audited flow baseline / ServiceRequest",
  },
  {
    canonicalName: "SessionMergeDecision",
    objectKind: "record",
    boundedContext: "unknown",
    authoritativeOwner: "Programme architecture registry",
    sourceRef:
      "phase-7-inside-the-nhs-app.md#7C. NHS App SSO bridge and local session continuity / Backend work / SessionMergeDecision",
  },
  {
    canonicalName: "SessionMergePolicy",
    objectKind: "policy",
    boundedContext: "unknown",
    authoritativeOwner: "Programme architecture registry",
    sourceRef:
      "phase-7-inside-the-nhs-app.md#7C. NHS App SSO bridge and local session continuity / Backend work / SessionMergePolicy",
  },
  {
    canonicalName: "ShellPolicy",
    objectKind: "policy",
    boundedContext: "unknown",
    authoritativeOwner: "Programme architecture registry",
    sourceRef:
      "phase-7-inside-the-nhs-app.md#7B. Embedded channel bootstrap, context resolver, and shell split / Backend work / ShellPolicy",
  },
  {
    canonicalName: "SiteLinkManifest",
    objectKind: "manifest",
    boundedContext: "unknown",
    authoritativeOwner: "Programme architecture registry",
    sourceRef:
      "phase-7-inside-the-nhs-app.md#7D. Deep links, site links, and return-to-journey continuity / Backend work / SiteLinkManifest",
  },
  {
    canonicalName: "StandaloneShell",
    objectKind: "other",
    boundedContext: "unknown",
    authoritativeOwner: "Programme architecture registry",
    sourceRef:
      "phase-7-inside-the-nhs-app.md#7B. Embedded channel bootstrap, context resolver, and shell split / Frontend work / StandaloneShell",
  },
  {
    canonicalName: "SubmissionEnvelope",
    objectKind: "aggregate",
    boundedContext: "foundation_control_plane",
    authoritativeOwner: "Foundation control plane",
    sourceRef:
      "phase-0-the-foundation-protocol.md#Canonical lifecycle, identity, safety, reservation, access, and reconciliation algorithm / 1. Required platform objects / SubmissionEnvelope",
  },
  {
    canonicalName: "Task",
    objectKind: "other",
    boundedContext: "unknown",
    authoritativeOwner: "Programme architecture registry",
    sourceRef: "vecells-complete-end-to-end-flow.md#Audited flow baseline / Task",
  },
  {
    canonicalName: "TelephonyContinuationContext",
    objectKind: "other",
    boundedContext: "unknown",
    authoritativeOwner: "Programme architecture registry",
    sourceRef:
      "phase-2-identity-and-echoes.md#2A. Trust contract and capability gates / TelephonyContinuationContext",
  },
] as const satisfies readonly OwnedObjectFamily[];

export const ownedContractFamilies = [
  {
    contractFamilyId: "CF_044_FOUNDATION_PRIMITIVES",
    label: "Foundation primitives and lineage aggregates",
    description:
      "Canonical shared kernel for identifiers, request lineage, and cross-context primitives.",
    versioningPosture:
      "Shared-kernel public API. Additive changes only until downstream packages adopt explicit versions.",
    consumerContractIds: [
      "CBC_041_COMMAND_API_TO_DOMAIN_PUBLIC_ENTRYPOINTS",
      "CBC_041_PROJECTION_WORKER_TO_DOMAIN_PROJECTIONS",
      "CBC_041_DOMAIN_PACKAGES_TO_DOMAIN_KERNEL",
    ],
    consumerOwnerCodes: [
      "analytics_assurance",
      "audit_compliance",
      "booking",
      "communications",
      "governance_admin",
      "hub_coordination",
      "identity_access",
      "intake_safety",
      "operations",
      "pharmacy",
      "platform_runtime",
      "release_control",
      "support",
      "triage_workspace",
    ],
    consumerSelectors: ["packages/domains/*", "services/command-api", "services/projection-worker"],
    sourceRefs: [
      "blueprint/phase-0-the-foundation-protocol.md#BoundedContextDescriptor",
      "prompt/044.md",
    ],
    ownedObjectFamilyCount: 39,
  },
] as const satisfies readonly OwnedContractFamily[];

export const eventFamilies = [] as const satisfies readonly OwnedObjectFamily[];

export const policyFamilies = [
  {
    canonicalName: "PatientEmbeddedNavEligibility",
    objectKind: "other",
    boundedContext: "unknown",
    authoritativeOwner: "Programme architecture registry",
    sourceRef:
      "phase-7-inside-the-nhs-app.md#7B. Embedded channel bootstrap, context resolver, and shell split / Backend work / PatientEmbeddedNavEligibility",
  },
  {
    canonicalName: "SessionMergePolicy",
    objectKind: "policy",
    boundedContext: "unknown",
    authoritativeOwner: "Programme architecture registry",
    sourceRef:
      "phase-7-inside-the-nhs-app.md#7C. NHS App SSO bridge and local session continuity / Backend work / SessionMergePolicy",
  },
  {
    canonicalName: "ShellPolicy",
    objectKind: "policy",
    boundedContext: "unknown",
    authoritativeOwner: "Programme architecture registry",
    sourceRef:
      "phase-7-inside-the-nhs-app.md#7B. Embedded channel bootstrap, context resolver, and shell split / Backend work / ShellPolicy",
  },
] as const satisfies readonly OwnedObjectFamily[];

export const projectionFamilies = [
  {
    canonicalName: "EmbeddedShellConsistencyProjection",
    objectKind: "projection",
    boundedContext: "unknown",
    authoritativeOwner: "Programme architecture registry",
    sourceRef:
      "phase-7-inside-the-nhs-app.md#7B. Embedded channel bootstrap, context resolver, and shell split / Backend work / EmbeddedShellConsistencyProjection",
  },
] as const satisfies readonly OwnedObjectFamily[];

export const foundationKernelFamilies = ownedObjectFamilies;

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
