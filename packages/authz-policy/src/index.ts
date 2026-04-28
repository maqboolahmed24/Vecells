export const foundationPolicyScopes = {
  patient_view: ["patient-web"],
  triage_review: ["clinical-workspace"],
  ops_watch: ["ops-console"],
  governance_release: ["governance-console"],
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
  artifactId: "package_authz_policy",
  packageName: "@vecells/authz-policy",
  packageRole: "shared",
  ownerContextCode: "identity_access",
  ownerContextLabel: "Identity Access",
  purpose:
    "Published scope, acting-context, and authorization fences; no app may mint local policy truth.",
  versioningPosture:
    "Workspace-private published contract boundary. Public exports are explicit and versionable.",
  allowedDependencies: [
    "packages/domain-kernel",
    "packages/event-contracts",
    "packages/release-controls",
  ],
  forbiddenDependencies: ["apps/* policy mutations", "services/* private domain models"],
  dependencyContractRefs: [
    "CBC_041_API_GATEWAY_TO_IDENTITY_POLICY",
    "CBC_041_DOMAIN_PACKAGES_TO_POLICY_AND_OBSERVABILITY",
  ],
  objectFamilyCount: 22,
  contractFamilyCount: 1,
  sourceContexts: ["assistive", "foundation_identity_access", "unknown"],
} as const satisfies PackageContract;

export const ownedObjectFamilies = [
  {
    canonicalName: "AccessGrant",
    objectKind: "grant",
    boundedContext: "foundation_identity_access",
    authoritativeOwner: "Identity and access control",
    sourceRef:
      "phase-0-the-foundation-protocol.md#Canonical lifecycle, identity, safety, reservation, access, and reconciliation algorithm / 1. Required platform objects / AccessGrant",
  },
  {
    canonicalName: "AccessGrantScopeEnvelope",
    objectKind: "record",
    boundedContext: "foundation_identity_access",
    authoritativeOwner: "Identity and access control",
    sourceRef:
      "phase-0-the-foundation-protocol.md#Canonical lifecycle, identity, safety, reservation, access, and reconciliation algorithm / 1. Required platform objects / AccessGrantScopeEnvelope",
  },
  {
    canonicalName: "ActingContextGovernor",
    objectKind: "other",
    boundedContext: "foundation_identity_access",
    authoritativeOwner: "Identity and access control",
    sourceRef:
      "phase-0-the-foundation-protocol.md#Canonical lifecycle, identity, safety, reservation, access, and reconciliation algorithm / 2. Required platform services / ActingContextGovernor",
  },
  {
    canonicalName: "ActingScopeTuple",
    objectKind: "tuple",
    boundedContext: "unknown",
    authoritativeOwner: "Programme architecture registry",
    sourceRef: "vecells-complete-end-to-end-flow.md#Audited flow baseline / ActingScopeTuple",
  },
  {
    canonicalName: "ArtifactByteGrant",
    objectKind: "grant",
    boundedContext: "unknown",
    authoritativeOwner: "Programme architecture registry",
    sourceRef:
      "phase-7-inside-the-nhs-app.md#7F. Webview limitations, file handling, and resilient error UX / Backend work / ArtifactByteGrant",
  },
  {
    canonicalName: "AssistiveInvocationGrant",
    objectKind: "grant",
    boundedContext: "assistive",
    authoritativeOwner: "Assistive control plane",
    sourceRef:
      "phase-8-the-assistive-layer.md#8A. Assistive capability contract, intended-use boundaries, and policy envelope / Backend work / AssistiveInvocationGrant",
  },
  {
    canonicalName: "AudienceSurfacePublicationRef",
    objectKind: "other",
    boundedContext: "foundation_identity_access",
    authoritativeOwner: "Identity and access control",
    sourceRef:
      "phase-0-the-foundation-protocol.md#Canonical lifecycle, identity, safety, reservation, access, and reconciliation algorithm / 1. Required platform objects / AudienceSurfacePublicationRef",
  },
  {
    canonicalName: "AudienceSurfaceRouteContract",
    objectKind: "contract",
    boundedContext: "foundation_identity_access",
    authoritativeOwner: "Identity and access control",
    sourceRef:
      "phase-0-the-foundation-protocol.md#Canonical lifecycle, identity, safety, reservation, access, and reconciliation algorithm / 1. Required platform objects / AudienceSurfaceRouteContract",
  },
  {
    canonicalName: "AudienceVisibilityCoverage",
    objectKind: "other",
    boundedContext: "foundation_identity_access",
    authoritativeOwner: "Identity and access control",
    sourceRef:
      "phase-0-the-foundation-protocol.md#Canonical lifecycle, identity, safety, reservation, access, and reconciliation algorithm / 1. Required platform objects / AudienceVisibilityCoverage",
  },
  {
    canonicalName: "AuthBridge",
    objectKind: "other",
    boundedContext: "foundation_identity_access",
    authoritativeOwner: "Identity and access control",
    sourceRef:
      "phase-0-the-foundation-protocol.md#Canonical lifecycle, identity, safety, reservation, access, and reconciliation algorithm / 2. Required platform services / AuthBridge",
  },
  {
    canonicalName: "AuthBridgeTransaction",
    objectKind: "other",
    boundedContext: "unknown",
    authoritativeOwner: "Programme architecture registry",
    sourceRef:
      "phase-7-inside-the-nhs-app.md#7C. NHS App SSO bridge and local session continuity / Backend work / AuthBridgeTransaction",
  },
  {
    canonicalName: "AuthScopeBundle",
    objectKind: "bundle",
    boundedContext: "foundation_identity_access",
    authoritativeOwner: "Identity and access control",
    sourceRef:
      "phase-0-the-foundation-protocol.md#Canonical lifecycle, identity, safety, reservation, access, and reconciliation algorithm / 1. Required platform objects / AuthScopeBundle",
  },
  {
    canonicalName: "AuthTransaction",
    objectKind: "other",
    boundedContext: "foundation_identity_access",
    authoritativeOwner: "Identity and access control",
    sourceRef:
      "phase-0-the-foundation-protocol.md#Canonical lifecycle, identity, safety, reservation, access, and reconciliation algorithm / 1. Required platform objects / AuthTransaction",
  },
  {
    canonicalName: "Consent",
    objectKind: "other",
    boundedContext: "unknown",
    authoritativeOwner: "Programme architecture registry",
    sourceRef: "vecells-complete-end-to-end-flow.md#Audited flow baseline / Consent",
  },
  {
    canonicalName: "EmbeddedEntryToken",
    objectKind: "token",
    boundedContext: "unknown",
    authoritativeOwner: "Programme architecture registry",
    sourceRef:
      "phase-7-inside-the-nhs-app.md#7B. Embedded channel bootstrap, context resolver, and shell split / Backend work / EmbeddedEntryToken",
  },
  {
    canonicalName: "GovernanceScopeToken",
    objectKind: "token",
    boundedContext: "unknown",
    authoritativeOwner: "Programme architecture registry",
    sourceRef: "vecells-complete-end-to-end-flow.md#Audited flow baseline / GovernanceScopeToken",
  },
  {
    canonicalName: "IdentityBindingAuthority",
    objectKind: "other",
    boundedContext: "foundation_identity_access",
    authoritativeOwner: "Identity and access control",
    sourceRef:
      "phase-0-the-foundation-protocol.md#Canonical lifecycle, identity, safety, reservation, access, and reconciliation algorithm / 2. Required platform services / IdentityBindingAuthority",
  },
  {
    canonicalName: "PostAuthReturnIntent",
    objectKind: "other",
    boundedContext: "foundation_identity_access",
    authoritativeOwner: "Identity and access control",
    sourceRef:
      "phase-0-the-foundation-protocol.md#Canonical lifecycle, identity, safety, reservation, access, and reconciliation algorithm / 1. Required platform objects / PostAuthReturnIntent",
  },
  {
    canonicalName: "ReservationAuthority",
    objectKind: "other",
    boundedContext: "foundation_identity_access",
    authoritativeOwner: "Identity and access control",
    sourceRef:
      "phase-0-the-foundation-protocol.md#Canonical lifecycle, identity, safety, reservation, access, and reconciliation algorithm / 2. Required platform services / ReservationAuthority",
  },
  {
    canonicalName: "SSOEntryGrant",
    objectKind: "grant",
    boundedContext: "unknown",
    authoritativeOwner: "Programme architecture registry",
    sourceRef:
      "phase-7-inside-the-nhs-app.md#7C. NHS App SSO bridge and local session continuity / Backend work / SSOEntryGrant",
  },
  {
    canonicalName: "ScopedMutationGate",
    objectKind: "gate",
    boundedContext: "foundation_identity_access",
    authoritativeOwner: "Identity and access control",
    sourceRef:
      "phase-0-the-foundation-protocol.md#Canonical lifecycle, identity, safety, reservation, access, and reconciliation algorithm / 2. Required platform services / ScopedMutationGate",
  },
  {
    canonicalName: "SupportLineageScopeMember",
    objectKind: "other",
    boundedContext: "foundation_identity_access",
    authoritativeOwner: "Identity and access control",
    sourceRef:
      "phase-0-the-foundation-protocol.md#Canonical lifecycle, identity, safety, reservation, access, and reconciliation algorithm / 1. Required platform objects / SupportLineageScopeMember",
  },
] as const satisfies readonly OwnedObjectFamily[];

export const ownedContractFamilies = [
  {
    contractFamilyId: "CF_044_SCOPE_AND_AUTHZ_FENCES",
    label: "Acting scope and authorization fences",
    description:
      "Published scope tuples, acting-context fences, and authorization descriptors consumed outside identity write models.",
    versioningPosture:
      "Policy contract family. Scope semantics are stable and widening is explicit.",
    consumerContractIds: [
      "CBC_041_API_GATEWAY_TO_IDENTITY_POLICY",
      "CBC_041_COMMAND_API_TO_DOMAIN_PUBLIC_ENTRYPOINTS",
      "CBC_041_DOMAIN_PACKAGES_TO_POLICY_AND_OBSERVABILITY",
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
    consumerSelectors: ["packages/domains/*", "services/api-gateway", "services/command-api"],
    sourceRefs: ["blueprint/phase-0-the-foundation-protocol.md#ActingScopeTuple", "prompt/044.md"],
    ownedObjectFamilyCount: 22,
  },
] as const satisfies readonly OwnedContractFamily[];

export const eventFamilies = [] as const satisfies readonly OwnedObjectFamily[];

export const policyFamilies = [
  {
    canonicalName: "AccessGrantScopeEnvelope",
    objectKind: "record",
    boundedContext: "foundation_identity_access",
    authoritativeOwner: "Identity and access control",
    sourceRef:
      "phase-0-the-foundation-protocol.md#Canonical lifecycle, identity, safety, reservation, access, and reconciliation algorithm / 1. Required platform objects / AccessGrantScopeEnvelope",
  },
  {
    canonicalName: "ActingContextGovernor",
    objectKind: "other",
    boundedContext: "foundation_identity_access",
    authoritativeOwner: "Identity and access control",
    sourceRef:
      "phase-0-the-foundation-protocol.md#Canonical lifecycle, identity, safety, reservation, access, and reconciliation algorithm / 2. Required platform services / ActingContextGovernor",
  },
  {
    canonicalName: "ActingScopeTuple",
    objectKind: "tuple",
    boundedContext: "unknown",
    authoritativeOwner: "Programme architecture registry",
    sourceRef: "vecells-complete-end-to-end-flow.md#Audited flow baseline / ActingScopeTuple",
  },
  {
    canonicalName: "AuthScopeBundle",
    objectKind: "bundle",
    boundedContext: "foundation_identity_access",
    authoritativeOwner: "Identity and access control",
    sourceRef:
      "phase-0-the-foundation-protocol.md#Canonical lifecycle, identity, safety, reservation, access, and reconciliation algorithm / 1. Required platform objects / AuthScopeBundle",
  },
  {
    canonicalName: "GovernanceScopeToken",
    objectKind: "token",
    boundedContext: "unknown",
    authoritativeOwner: "Programme architecture registry",
    sourceRef: "vecells-complete-end-to-end-flow.md#Audited flow baseline / GovernanceScopeToken",
  },
  {
    canonicalName: "ScopedMutationGate",
    objectKind: "gate",
    boundedContext: "foundation_identity_access",
    authoritativeOwner: "Identity and access control",
    sourceRef:
      "phase-0-the-foundation-protocol.md#Canonical lifecycle, identity, safety, reservation, access, and reconciliation algorithm / 2. Required platform services / ScopedMutationGate",
  },
  {
    canonicalName: "SupportLineageScopeMember",
    objectKind: "other",
    boundedContext: "foundation_identity_access",
    authoritativeOwner: "Identity and access control",
    sourceRef:
      "phase-0-the-foundation-protocol.md#Canonical lifecycle, identity, safety, reservation, access, and reconciliation algorithm / 1. Required platform objects / SupportLineageScopeMember",
  },
] as const satisfies readonly OwnedObjectFamily[];

export const projectionFamilies = [] as const satisfies readonly OwnedObjectFamily[];

export const foundationPolicyScopeCatalog = ownedObjectFamilies;

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
