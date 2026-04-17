export interface ShellTelemetrySnapshot {
  shellSlug: string;
  routeCount: number;
  gatewayCount: number;
  continuityPosture: string;
  publicationPosture: string;
}

export function createShellSignal(
  shellSlug: string,
  routeFamilyIds: readonly string[],
  gatewaySurfaceIds: readonly string[],
): ShellTelemetrySnapshot {
  return {
    shellSlug,
    routeCount: routeFamilyIds.length,
    gatewayCount: gatewaySurfaceIds.length,
    continuityPosture: routeFamilyIds.length > 5 ? "derived-watch" : "baseline-clear",
    publicationPosture: gatewaySurfaceIds.length > 6 ? "watch" : "controlled",
  };
}

export * from "./correlation-spine";
export * from "./telemetry";
export * from "./ui-causality";

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
  artifactId: "package_observability",
  packageName: "@vecells/observability",
  packageRole: "shared",
  ownerContextCode: "analytics_assurance",
  ownerContextLabel: "Analytics Assurance",
  purpose:
    "Published telemetry and trust-slice vocabulary for shells, services, and release controls; never a shadow write model.",
  versioningPosture:
    "Workspace-private published contract boundary. Public exports are explicit and versionable.",
  allowedDependencies: ["packages/domain-kernel", "packages/release-controls"],
  forbiddenDependencies: ["apps/* truth writes", "packages/domains/* private internals"],
  dependencyContractRefs: [
    "CBC_041_DOMAIN_PACKAGES_TO_POLICY_AND_OBSERVABILITY",
    "CBC_041_RELEASE_CONTROL_TO_OBSERVABILITY",
  ],
  objectFamilyCount: 31,
  contractFamilyCount: 2,
  sourceContexts: [
    "assistive",
    "audited_flow_gap",
    "foundation_runtime_experience",
    "frontend_runtime",
    "unknown",
  ],
} as const satisfies PackageContract;

export const ownedObjectFamilies = [
  {
    canonicalName: "AssistiveCapabilityTrustProjection",
    objectKind: "projection",
    boundedContext: "assistive",
    authoritativeOwner: "Assistive control plane",
    sourceRef:
      "phase-8-the-assistive-layer.md#8G. Monitoring, drift, fairness, and live safety controls / Backend work / AssistiveCapabilityTrustProjection",
  },
  {
    canonicalName: "AssistiveCapabilityWatchTuple",
    objectKind: "tuple",
    boundedContext: "assistive",
    authoritativeOwner: "Assistive control plane",
    sourceRef:
      "phase-8-the-assistive-layer.md#8G. Monitoring, drift, fairness, and live safety controls / Backend work / AssistiveCapabilityWatchTuple",
  },
  {
    canonicalName: "AssistiveConfidenceDigest",
    objectKind: "digest",
    boundedContext: "assistive",
    authoritativeOwner: "Assistive control plane",
    sourceRef:
      "phase-8-the-assistive-layer.md#8A. Assistive capability contract, intended-use boundaries, and policy envelope / Backend work / AssistiveConfidenceDigest",
  },
  {
    canonicalName: "AssistiveContinuityEvidenceProjection",
    objectKind: "projection",
    boundedContext: "assistive",
    authoritativeOwner: "Assistive control plane",
    sourceRef:
      "phase-8-the-assistive-layer.md#8F. Human-in-the-loop workspace integration, override capture, and feedback loop / Backend work / AssistiveContinuityEvidenceProjection",
  },
  {
    canonicalName: "AssistiveIncidentLink",
    objectKind: "other",
    boundedContext: "assistive",
    authoritativeOwner: "Assistive control plane",
    sourceRef:
      "phase-8-the-assistive-layer.md#8G. Monitoring, drift, fairness, and live safety controls / Backend work / AssistiveIncidentLink",
  },
  {
    canonicalName: "AssistiveProvenanceEnvelope",
    objectKind: "record",
    boundedContext: "assistive",
    authoritativeOwner: "Assistive control plane",
    sourceRef:
      "phase-8-the-assistive-layer.md#8A. Assistive capability contract, intended-use boundaries, and policy envelope / Backend work / AssistiveProvenanceEnvelope",
  },
  {
    canonicalName: "AuditEvidenceReference",
    objectKind: "other",
    boundedContext: "unknown",
    authoritativeOwner: "Programme architecture registry",
    sourceRef:
      "phase-7-inside-the-nhs-app.md#7G. Accessibility, design-system convergence, and channel-grade UX refinement / Backend work / AuditEvidenceReference",
  },
  {
    canonicalName: "CasePulse",
    objectKind: "other",
    boundedContext: "foundation_runtime_experience",
    authoritativeOwner: "Frontend continuity runtime",
    sourceRef:
      "phase-0-the-foundation-protocol.md#Canonical real-time interaction, motion, and live-projection experience algorithm / 1. Required experience topology and primitives / CasePulse",
  },
  {
    canonicalName: "ChannelContextEvidence",
    objectKind: "other",
    boundedContext: "unknown",
    authoritativeOwner: "Programme architecture registry",
    sourceRef:
      "phase-7-inside-the-nhs-app.md#7B. Embedded channel bootstrap, context resolver, and shell split / Backend work / ChannelContextEvidence",
  },
  {
    canonicalName: "ChannelTelemetryPlan",
    objectKind: "other",
    boundedContext: "unknown",
    authoritativeOwner: "Programme architecture registry",
    sourceRef:
      "phase-7-inside-the-nhs-app.md#7H. Sandpit, AOS, SCAL, and operational delivery pipeline / Backend work / ChannelTelemetryPlan",
  },
  {
    canonicalName: "ContinuityOrchestrator",
    objectKind: "other",
    boundedContext: "foundation_runtime_experience",
    authoritativeOwner: "Frontend continuity runtime",
    sourceRef:
      "phase-0-the-foundation-protocol.md#Canonical real-time interaction, motion, and live-projection experience algorithm / 2. Required frontend services / ContinuityOrchestrator",
  },
  {
    canonicalName: "DraftContinuityEvidenceProjection",
    objectKind: "projection",
    boundedContext: "unknown",
    authoritativeOwner: "Programme architecture registry",
    sourceRef:
      "phase-1-the-red-flag-gate.md#1B. Draft lifecycle and autosave engine / DraftContinuityEvidenceProjection",
  },
  {
    canonicalName: "EvidenceLineageResolver",
    objectKind: "other",
    boundedContext: "foundation_runtime_experience",
    authoritativeOwner: "Frontend continuity runtime",
    sourceRef:
      "phase-0-the-foundation-protocol.md#Canonical real-time interaction, motion, and live-projection experience algorithm / 2. Required frontend services / EvidenceLineageResolver",
  },
  {
    canonicalName: "EvidencePrism",
    objectKind: "other",
    boundedContext: "foundation_runtime_experience",
    authoritativeOwner: "Frontend continuity runtime",
    sourceRef:
      "phase-0-the-foundation-protocol.md#Canonical real-time interaction, motion, and live-projection experience algorithm / 1. Required experience topology and primitives / EvidencePrism",
  },
  {
    canonicalName: "EvidenceSnapshot",
    objectKind: "record",
    boundedContext: "unknown",
    authoritativeOwner: "Programme architecture registry",
    sourceRef: "vecells-complete-end-to-end-flow.md#Audited flow baseline / EvidenceSnapshot",
  },
  {
    canonicalName: "FreshnessSupervisor",
    objectKind: "other",
    boundedContext: "foundation_runtime_experience",
    authoritativeOwner: "Frontend continuity runtime",
    sourceRef:
      "phase-0-the-foundation-protocol.md#Canonical real-time interaction, motion, and live-projection experience algorithm / 2. Required frontend services / FreshnessSupervisor",
  },
  {
    canonicalName: "IdentityEvidenceEnvelope",
    objectKind: "record",
    boundedContext: "unknown",
    authoritativeOwner: "Programme architecture registry",
    sourceRef:
      "phase-2-identity-and-echoes.md#2A. Trust contract and capability gates / IdentityEvidenceEnvelope",
  },
  {
    canonicalName: "IntegrationEvidencePack",
    objectKind: "bundle",
    boundedContext: "unknown",
    authoritativeOwner: "Programme architecture registry",
    sourceRef:
      "phase-7-inside-the-nhs-app.md#7A. Journey inventory, integration manifest, and onboarding pack / Backend work / IntegrationEvidencePack",
  },
  {
    canonicalName: "LineageRecoveryDisposition",
    objectKind: "record",
    boundedContext: "frontend_runtime",
    authoritativeOwner: "Frontend continuity runtime",
    sourceRef:
      "platform-frontend-blueprint.md#Deep-link and recovery rules / LineageRecoveryDisposition",
  },
  {
    canonicalName: "LineageScopeDescriptor",
    objectKind: "descriptor",
    boundedContext: "frontend_runtime",
    authoritativeOwner: "Frontend continuity runtime",
    sourceRef:
      "platform-frontend-blueprint.md#Canonical real-time interaction, motion, and live-projection experience algorithm / 0.2 Continuity key and shell law / LineageScopeDescriptor",
  },
  {
    canonicalName: "LinkResolutionAudit",
    objectKind: "other",
    boundedContext: "unknown",
    authoritativeOwner: "Programme architecture registry",
    sourceRef:
      "phase-7-inside-the-nhs-app.md#7D. Deep links, site links, and return-to-journey continuity / Backend work / LinkResolutionAudit",
  },
  {
    canonicalName: "LiveProjectionBridge",
    objectKind: "other",
    boundedContext: "foundation_runtime_experience",
    authoritativeOwner: "Frontend continuity runtime",
    sourceRef:
      "phase-0-the-foundation-protocol.md#Canonical real-time interaction, motion, and live-projection experience algorithm / 2. Required frontend services / LiveProjectionBridge",
  },
  {
    canonicalName: "NHSAppContinuityEvidenceBundle",
    objectKind: "bundle",
    boundedContext: "unknown",
    authoritativeOwner: "Programme architecture registry",
    sourceRef:
      "phase-7-inside-the-nhs-app.md#7A. Journey inventory, integration manifest, and onboarding pack / Backend work / NHSAppContinuityEvidenceBundle",
  },
  {
    canonicalName: "OpsContinuityEvidenceSlice",
    objectKind: "projection",
    boundedContext: "audited_flow_gap",
    authoritativeOwner: "Cross-phase gap register",
    sourceRef:
      "operations-console-frontend-blueprint.md#4. Canonical overview composition / 4.8 Continuity evidence and assurance drill-down / OpsContinuityEvidenceSlice",
  },
  {
    canonicalName: "PatientPortalContinuityEvidenceBundle",
    objectKind: "bundle",
    boundedContext: "frontend_runtime",
    authoritativeOwner: "Frontend continuity runtime",
    sourceRef:
      "patient-portal-experience-architecture-blueprint.md#Overarching conceptual design strategy / Primary navigation model / PatientPortalContinuityEvidenceBundle",
  },
  {
    canonicalName: "PatientRequestLineageProjection",
    objectKind: "projection",
    boundedContext: "frontend_runtime",
    authoritativeOwner: "Frontend continuity runtime",
    sourceRef:
      "patient-portal-experience-architecture-blueprint.md#Overarching conceptual design strategy / Requests surface contract / PatientRequestLineageProjection",
  },
  {
    canonicalName: "PatientTrustCueContract",
    objectKind: "contract",
    boundedContext: "frontend_runtime",
    authoritativeOwner: "Frontend continuity runtime",
    sourceRef:
      "patient-portal-experience-architecture-blueprint.md#Overarching conceptual design strategy / Portal entry and shell topology / PatientTrustCueContract",
  },
  {
    canonicalName: "ProjectionFreshnessEnvelope",
    objectKind: "record",
    boundedContext: "foundation_runtime_experience",
    authoritativeOwner: "Frontend continuity runtime",
    sourceRef:
      "phase-0-the-foundation-protocol.md#Canonical real-time interaction, motion, and live-projection experience algorithm / 1. Required experience topology and primitives / ProjectionFreshnessEnvelope",
  },
  {
    canonicalName: "RouteContinuityEvidenceContract",
    objectKind: "contract",
    boundedContext: "frontend_runtime",
    authoritativeOwner: "Frontend continuity runtime",
    sourceRef:
      "platform-frontend-blueprint.md#Typed patient transaction route contract / RouteContinuityEvidenceContract",
  },
  {
    canonicalName: "TelemetryBindingProfile",
    objectKind: "descriptor",
    boundedContext: "frontend_runtime",
    authoritativeOwner: "Frontend continuity runtime",
    sourceRef: "canonical-ui-contract-kernel.md#Canonical contracts / TelemetryBindingProfile",
  },
  {
    canonicalName: "UITelemetryDisclosureFence",
    objectKind: "gate",
    boundedContext: "frontend_runtime",
    authoritativeOwner: "Frontend continuity runtime",
    sourceRef:
      "platform-runtime-and-release-blueprint.md#Runtime publication and controlled migrations / UITelemetryDisclosureFence",
  },
] as const satisfies readonly OwnedObjectFamily[];

export const ownedContractFamilies = [
  {
    contractFamilyId: "CF_044_TELEMETRY_AND_TRUST_VOCABULARY",
    label: "Telemetry and trust vocabulary",
    description:
      "Published trust-slice, telemetry, and provenance language for shells, services, and release controls.",
    versioningPosture: "Shared observability vocabulary; additive signal growth only.",
    consumerContractIds: [
      "CBC_041_API_GATEWAY_TO_SHARED_CONTRACTS",
      "CBC_041_ADAPTER_SIMULATORS_TO_CONTRACT_AND_FIXTURE_PACKAGES",
      "CBC_041_DOMAIN_PACKAGES_TO_POLICY_AND_OBSERVABILITY",
      "CBC_041_RELEASE_CONTROL_TO_OBSERVABILITY",
      "CBC_041_ASSISTIVE_LAB_TO_CONTRACTS_AND_RELEASE_CONTROLS",
    ],
    consumerOwnerCodes: [
      "analytics_assurance",
      "assistive_lab",
      "audit_compliance",
      "booking",
      "communications",
      "governance_admin",
      "hub_coordination",
      "identity_access",
      "intake_safety",
      "operations",
      "pharmacy",
      "platform_integration",
      "platform_runtime",
      "release_control",
      "support",
      "triage_workspace",
    ],
    consumerSelectors: [
      "packages/domains/*",
      "packages/release-controls",
      "services/adapter-simulators",
      "services/api-gateway",
      "tools/assistive-control-lab",
    ],
    sourceRefs: ["prompt/015.md", "prompt/044.md"],
    ownedObjectFamilyCount: 8,
  },
  {
    contractFamilyId: "CF_044_CONTINUITY_AND_LINEAGE_SIGNALS",
    label: "Continuity and lineage signals",
    description:
      "Cross-surface continuity, freshness, lineage, and evidence signals published without owning domain settlement.",
    versioningPosture: "Shared continuity contract family with explicit signal semantics.",
    consumerContractIds: [
      "CBC_041_API_GATEWAY_TO_SHARED_CONTRACTS",
      "CBC_041_ADAPTER_SIMULATORS_TO_CONTRACT_AND_FIXTURE_PACKAGES",
      "CBC_041_DOMAIN_PACKAGES_TO_POLICY_AND_OBSERVABILITY",
      "CBC_041_RELEASE_CONTROL_TO_OBSERVABILITY",
      "CBC_041_ASSISTIVE_LAB_TO_CONTRACTS_AND_RELEASE_CONTROLS",
    ],
    consumerOwnerCodes: [
      "analytics_assurance",
      "assistive_lab",
      "audit_compliance",
      "booking",
      "communications",
      "governance_admin",
      "hub_coordination",
      "identity_access",
      "intake_safety",
      "operations",
      "pharmacy",
      "platform_integration",
      "platform_runtime",
      "release_control",
      "support",
      "triage_workspace",
    ],
    consumerSelectors: [
      "packages/domains/*",
      "packages/release-controls",
      "services/adapter-simulators",
      "services/api-gateway",
      "tools/assistive-control-lab",
    ],
    sourceRefs: [
      "blueprint/platform-frontend-blueprint.md#live-update, cache-policy, and route-inventory families",
      "prompt/044.md",
    ],
    ownedObjectFamilyCount: 31,
  },
] as const satisfies readonly OwnedContractFamily[];

export const eventFamilies = [] as const satisfies readonly OwnedObjectFamily[];

export const policyFamilies = [
  {
    canonicalName: "LineageScopeDescriptor",
    objectKind: "descriptor",
    boundedContext: "frontend_runtime",
    authoritativeOwner: "Frontend continuity runtime",
    sourceRef:
      "platform-frontend-blueprint.md#Canonical real-time interaction, motion, and live-projection experience algorithm / 0.2 Continuity key and shell law / LineageScopeDescriptor",
  },
  {
    canonicalName: "UITelemetryDisclosureFence",
    objectKind: "gate",
    boundedContext: "frontend_runtime",
    authoritativeOwner: "Frontend continuity runtime",
    sourceRef:
      "platform-runtime-and-release-blueprint.md#Runtime publication and controlled migrations / UITelemetryDisclosureFence",
  },
] as const satisfies readonly OwnedObjectFamily[];

export const projectionFamilies = [
  {
    canonicalName: "AssistiveCapabilityTrustProjection",
    objectKind: "projection",
    boundedContext: "assistive",
    authoritativeOwner: "Assistive control plane",
    sourceRef:
      "phase-8-the-assistive-layer.md#8G. Monitoring, drift, fairness, and live safety controls / Backend work / AssistiveCapabilityTrustProjection",
  },
  {
    canonicalName: "AssistiveContinuityEvidenceProjection",
    objectKind: "projection",
    boundedContext: "assistive",
    authoritativeOwner: "Assistive control plane",
    sourceRef:
      "phase-8-the-assistive-layer.md#8F. Human-in-the-loop workspace integration, override capture, and feedback loop / Backend work / AssistiveContinuityEvidenceProjection",
  },
  {
    canonicalName: "DraftContinuityEvidenceProjection",
    objectKind: "projection",
    boundedContext: "unknown",
    authoritativeOwner: "Programme architecture registry",
    sourceRef:
      "phase-1-the-red-flag-gate.md#1B. Draft lifecycle and autosave engine / DraftContinuityEvidenceProjection",
  },
  {
    canonicalName: "LiveProjectionBridge",
    objectKind: "other",
    boundedContext: "foundation_runtime_experience",
    authoritativeOwner: "Frontend continuity runtime",
    sourceRef:
      "phase-0-the-foundation-protocol.md#Canonical real-time interaction, motion, and live-projection experience algorithm / 2. Required frontend services / LiveProjectionBridge",
  },
  {
    canonicalName: "OpsContinuityEvidenceSlice",
    objectKind: "projection",
    boundedContext: "audited_flow_gap",
    authoritativeOwner: "Cross-phase gap register",
    sourceRef:
      "operations-console-frontend-blueprint.md#4. Canonical overview composition / 4.8 Continuity evidence and assurance drill-down / OpsContinuityEvidenceSlice",
  },
  {
    canonicalName: "PatientRequestLineageProjection",
    objectKind: "projection",
    boundedContext: "frontend_runtime",
    authoritativeOwner: "Frontend continuity runtime",
    sourceRef:
      "patient-portal-experience-architecture-blueprint.md#Overarching conceptual design strategy / Requests surface contract / PatientRequestLineageProjection",
  },
  {
    canonicalName: "ProjectionFreshnessEnvelope",
    objectKind: "record",
    boundedContext: "foundation_runtime_experience",
    authoritativeOwner: "Frontend continuity runtime",
    sourceRef:
      "phase-0-the-foundation-protocol.md#Canonical real-time interaction, motion, and live-projection experience algorithm / 1. Required experience topology and primitives / ProjectionFreshnessEnvelope",
  },
] as const satisfies readonly OwnedObjectFamily[];

export * from "./correlation-spine";
export * from "./telemetry";
export * from "./ui-causality";

export const observabilitySignalFamilies = ownedObjectFamilies;

export function makeTrustSliceKey(slice: string, signal: string): string {
  return `${slice}:${signal}`;
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
