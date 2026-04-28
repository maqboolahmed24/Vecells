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
  artifactId: "package_domains_identity_access",
  packageName: "@vecells/domain-identity-access",
  packageRole: "domain",
  ownerContextCode: "identity_access",
  ownerContextLabel: "Identity Access",
  purpose: "Canonical package home for the Identity Access bounded context.",
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
  objectFamilyCount: 136,
  contractFamilyCount: 0,
  sourceContexts: ["foundation_identity_access"],
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
    canonicalName: "AccessGrantRedemptionRecord",
    objectKind: "record",
    boundedContext: "foundation_identity_access",
    authoritativeOwner: "Identity and access control",
    sourceRef:
      "phase-0-the-foundation-protocol.md#Canonical lifecycle, identity, safety, reservation, access, and reconciliation algorithm / 1. Required platform objects / AccessGrantRedemptionRecord",
  },
  {
    canonicalName: "AccessGrantService",
    objectKind: "other",
    boundedContext: "foundation_identity_access",
    authoritativeOwner: "Identity and access control",
    sourceRef:
      "phase-0-the-foundation-protocol.md#Canonical lifecycle, identity, safety, reservation, access, and reconciliation algorithm / 2. Required platform services / AccessGrantService",
  },
  {
    canonicalName: "AccessGrantSupersessionRecord",
    objectKind: "record",
    boundedContext: "foundation_identity_access",
    authoritativeOwner: "Identity and access control",
    sourceRef:
      "phase-0-the-foundation-protocol.md#Canonical lifecycle, identity, safety, reservation, access, and reconciliation algorithm / 1. Required platform objects / AccessGrantSupersessionRecord",
  },
  {
    canonicalName: "AdapterDispatchAttempt",
    objectKind: "record",
    boundedContext: "foundation_identity_access",
    authoritativeOwner: "Identity and access control",
    sourceRef:
      "phase-0-the-foundation-protocol.md#Canonical lifecycle, identity, safety, reservation, access, and reconciliation algorithm / 1. Required platform objects / AdapterDispatchAttempt",
  },
  {
    canonicalName: "AdapterReceiptCheckpoint",
    objectKind: "checkpoint",
    boundedContext: "foundation_identity_access",
    authoritativeOwner: "Identity and access control",
    sourceRef:
      "phase-0-the-foundation-protocol.md#Canonical lifecycle, identity, safety, reservation, access, and reconciliation algorithm / 1. Required platform objects / AdapterReceiptCheckpoint",
  },
  {
    canonicalName: "AdminResolutionExperienceProjection",
    objectKind: "projection",
    boundedContext: "foundation_identity_access",
    authoritativeOwner: "Identity and access control",
    sourceRef:
      "phase-0-the-foundation-protocol.md#Canonical lifecycle, identity, safety, reservation, access, and reconciliation algorithm / 1. Required platform objects / AdminResolutionExperienceProjection",
  },
  {
    canonicalName: "AdminResolutionSettlement",
    objectKind: "settlement",
    boundedContext: "foundation_identity_access",
    authoritativeOwner: "Identity and access control",
    sourceRef:
      "phase-0-the-foundation-protocol.md#Canonical lifecycle, identity, safety, reservation, access, and reconciliation algorithm / 1. Required platform objects / AdminResolutionSettlement",
  },
  {
    canonicalName: "AdviceAdminDependencySet",
    objectKind: "other",
    boundedContext: "foundation_identity_access",
    authoritativeOwner: "Identity and access control",
    sourceRef:
      "phase-0-the-foundation-protocol.md#Canonical lifecycle, identity, safety, reservation, access, and reconciliation algorithm / 1. Required platform objects / AdviceAdminDependencySet",
  },
  {
    canonicalName: "AdviceRenderSettlement",
    objectKind: "settlement",
    boundedContext: "foundation_identity_access",
    authoritativeOwner: "Identity and access control",
    sourceRef:
      "phase-0-the-foundation-protocol.md#Canonical lifecycle, identity, safety, reservation, access, and reconciliation algorithm / 1. Required platform objects / AdviceRenderSettlement",
  },
  {
    canonicalName: "ArtifactModeTruthProjection",
    objectKind: "projection",
    boundedContext: "foundation_identity_access",
    authoritativeOwner: "Identity and access control",
    sourceRef:
      "phase-0-the-foundation-protocol.md#Canonical lifecycle, identity, safety, reservation, access, and reconciliation algorithm / 1. Required platform objects / ArtifactModeTruthProjection",
  },
  {
    canonicalName: "AssistiveCapabilityTrustEnvelope",
    objectKind: "record",
    boundedContext: "foundation_identity_access",
    authoritativeOwner: "Identity and access control",
    sourceRef:
      "phase-0-the-foundation-protocol.md#Canonical lifecycle, identity, safety, reservation, access, and reconciliation algorithm / 1. Required platform objects / AssistiveCapabilityTrustEnvelope",
  },
  {
    canonicalName: "AssistiveFeedbackChain",
    objectKind: "other",
    boundedContext: "foundation_identity_access",
    authoritativeOwner: "Identity and access control",
    sourceRef:
      "phase-0-the-foundation-protocol.md#Canonical lifecycle, identity, safety, reservation, access, and reconciliation algorithm / 1. Required platform objects / AssistiveFeedbackChain",
  },
  {
    canonicalName: "AssuranceSupervisor",
    objectKind: "other",
    boundedContext: "foundation_identity_access",
    authoritativeOwner: "Identity and access control",
    sourceRef:
      "phase-0-the-foundation-protocol.md#Canonical lifecycle, identity, safety, reservation, access, and reconciliation algorithm / 2. Required platform services / AssuranceSupervisor",
  },
  {
    canonicalName: "BackupSetManifest",
    objectKind: "manifest",
    boundedContext: "foundation_identity_access",
    authoritativeOwner: "Identity and access control",
    sourceRef:
      "phase-0-the-foundation-protocol.md#Canonical lifecycle, identity, safety, reservation, access, and reconciliation algorithm / 1. Required platform objects / BackupSetManifest",
  },
  {
    canonicalName: "BookingConfirmationTruthProjection",
    objectKind: "projection",
    boundedContext: "foundation_identity_access",
    authoritativeOwner: "Identity and access control",
    sourceRef:
      "phase-0-the-foundation-protocol.md#Canonical lifecycle, identity, safety, reservation, access, and reconciliation algorithm / 1. Required platform objects / BookingConfirmationTruthProjection",
  },
  {
    canonicalName: "BookingProviderAdapterBinding",
    objectKind: "descriptor",
    boundedContext: "foundation_identity_access",
    authoritativeOwner: "Identity and access control",
    sourceRef:
      "phase-0-the-foundation-protocol.md#Canonical lifecycle, identity, safety, reservation, access, and reconciliation algorithm / 1. Required platform objects / BookingProviderAdapterBinding",
  },
  {
    canonicalName: "CapabilityDecision",
    objectKind: "descriptor",
    boundedContext: "foundation_identity_access",
    authoritativeOwner: "Identity and access control",
    sourceRef:
      "phase-0-the-foundation-protocol.md#Canonical lifecycle, identity, safety, reservation, access, and reconciliation algorithm / 1. Required platform objects / CapabilityDecision",
  },
  {
    canonicalName: "CapacityIdentity",
    objectKind: "other",
    boundedContext: "foundation_identity_access",
    authoritativeOwner: "Identity and access control",
    sourceRef:
      "phase-0-the-foundation-protocol.md#Canonical lifecycle, identity, safety, reservation, access, and reconciliation algorithm / 1. Required platform objects / CapacityIdentity",
  },
  {
    canonicalName: "CapacityReservation",
    objectKind: "other",
    boundedContext: "foundation_identity_access",
    authoritativeOwner: "Identity and access control",
    sourceRef:
      "phase-0-the-foundation-protocol.md#Canonical lifecycle, identity, safety, reservation, access, and reconciliation algorithm / 1. Required platform objects / CapacityReservation",
  },
  {
    canonicalName: "ChannelReleaseFreezeRecord",
    objectKind: "record",
    boundedContext: "foundation_identity_access",
    authoritativeOwner: "Identity and access control",
    sourceRef:
      "phase-0-the-foundation-protocol.md#Canonical lifecycle, identity, safety, reservation, access, and reconciliation algorithm / 1. Required platform objects / ChannelReleaseFreezeRecord",
  },
  {
    canonicalName: "ChaosRun",
    objectKind: "other",
    boundedContext: "foundation_identity_access",
    authoritativeOwner: "Identity and access control",
    sourceRef:
      "phase-0-the-foundation-protocol.md#Canonical lifecycle, identity, safety, reservation, access, and reconciliation algorithm / 1. Required platform objects / ChaosRun",
  },
  {
    canonicalName: "CommandActionRecord",
    objectKind: "record",
    boundedContext: "foundation_identity_access",
    authoritativeOwner: "Identity and access control",
    sourceRef:
      "phase-0-the-foundation-protocol.md#Canonical lifecycle, identity, safety, reservation, access, and reconciliation algorithm / 1. Required platform objects / CommandActionRecord",
  },
  {
    canonicalName: "CommandSettlementRecord",
    objectKind: "record",
    boundedContext: "foundation_identity_access",
    authoritativeOwner: "Identity and access control",
    sourceRef:
      "phase-0-the-foundation-protocol.md#Canonical lifecycle, identity, safety, reservation, access, and reconciliation algorithm / 1. Required platform objects / CommandSettlementRecord",
  },
  {
    canonicalName: "CompiledPolicyBundle",
    objectKind: "bundle",
    boundedContext: "foundation_identity_access",
    authoritativeOwner: "Identity and access control",
    sourceRef:
      "phase-0-the-foundation-protocol.md#Canonical lifecycle, identity, safety, reservation, access, and reconciliation algorithm / 1. Required platform objects / CompiledPolicyBundle",
  },
  {
    canonicalName: "ContactRouteRepairJourney",
    objectKind: "other",
    boundedContext: "foundation_identity_access",
    authoritativeOwner: "Identity and access control",
    sourceRef:
      "phase-0-the-foundation-protocol.md#Canonical lifecycle, identity, safety, reservation, access, and reconciliation algorithm / 1. Required platform objects / ContactRouteRepairJourney",
  },
  {
    canonicalName: "ContactRouteSnapshot",
    objectKind: "record",
    boundedContext: "foundation_identity_access",
    authoritativeOwner: "Identity and access control",
    sourceRef:
      "phase-0-the-foundation-protocol.md#Canonical lifecycle, identity, safety, reservation, access, and reconciliation algorithm / 1. Required platform objects / ContactRouteSnapshot",
  },
  {
    canonicalName: "ContactRouteVerificationCheckpoint",
    objectKind: "checkpoint",
    boundedContext: "foundation_identity_access",
    authoritativeOwner: "Identity and access control",
    sourceRef:
      "phase-0-the-foundation-protocol.md#Canonical lifecycle, identity, safety, reservation, access, and reconciliation algorithm / 1. Required platform objects / ContactRouteVerificationCheckpoint",
  },
  {
    canonicalName: "ConversationCommandSettlement",
    objectKind: "settlement",
    boundedContext: "foundation_identity_access",
    authoritativeOwner: "Identity and access control",
    sourceRef:
      "phase-0-the-foundation-protocol.md#Canonical lifecycle, identity, safety, reservation, access, and reconciliation algorithm / 1. Required platform objects / ConversationCommandSettlement",
  },
  {
    canonicalName: "DesignContractLintVerdict",
    objectKind: "witness",
    boundedContext: "foundation_identity_access",
    authoritativeOwner: "Identity and access control",
    sourceRef:
      "phase-0-the-foundation-protocol.md#Canonical lifecycle, identity, safety, reservation, access, and reconciliation algorithm / 1. Required platform objects / DesignContractLintVerdict",
  },
  {
    canonicalName: "DesignContractPublicationBundle",
    objectKind: "bundle",
    boundedContext: "foundation_identity_access",
    authoritativeOwner: "Identity and access control",
    sourceRef:
      "phase-0-the-foundation-protocol.md#Canonical lifecycle, identity, safety, reservation, access, and reconciliation algorithm / 1. Required platform objects / DesignContractPublicationBundle",
  },
  {
    canonicalName: "DuplicateCluster",
    objectKind: "aggregate",
    boundedContext: "foundation_identity_access",
    authoritativeOwner: "Identity and access control",
    sourceRef:
      "phase-0-the-foundation-protocol.md#Canonical lifecycle, identity, safety, reservation, access, and reconciliation algorithm / 1. Required platform objects / DuplicateCluster",
  },
  {
    canonicalName: "DuplicatePairEvidence",
    objectKind: "other",
    boundedContext: "foundation_identity_access",
    authoritativeOwner: "Identity and access control",
    sourceRef:
      "phase-0-the-foundation-protocol.md#Canonical lifecycle, identity, safety, reservation, access, and reconciliation algorithm / 1. Required platform objects / DuplicatePairEvidence",
  },
  {
    canonicalName: "DuplicateResolutionDecision",
    objectKind: "record",
    boundedContext: "foundation_identity_access",
    authoritativeOwner: "Identity and access control",
    sourceRef:
      "phase-0-the-foundation-protocol.md#Canonical lifecycle, identity, safety, reservation, access, and reconciliation algorithm / 1. Required platform objects / DuplicateResolutionDecision",
  },
  {
    canonicalName: "Episode",
    objectKind: "aggregate",
    boundedContext: "foundation_identity_access",
    authoritativeOwner: "Identity and access control",
    sourceRef:
      "phase-0-the-foundation-protocol.md#Canonical lifecycle, identity, safety, reservation, access, and reconciliation algorithm / 1. Required platform objects / Episode",
  },
  {
    canonicalName: "EssentialFunctionHealthEnvelope",
    objectKind: "record",
    boundedContext: "foundation_identity_access",
    authoritativeOwner: "Identity and access control",
    sourceRef:
      "phase-0-the-foundation-protocol.md#Canonical lifecycle, identity, safety, reservation, access, and reconciliation algorithm / 1. Required platform objects / EssentialFunctionHealthEnvelope",
  },
  {
    canonicalName: "EssentialFunctionMap",
    objectKind: "other",
    boundedContext: "foundation_identity_access",
    authoritativeOwner: "Identity and access control",
    sourceRef:
      "phase-0-the-foundation-protocol.md#Canonical lifecycle, identity, safety, reservation, access, and reconciliation algorithm / 1. Required platform objects / EssentialFunctionMap",
  },
  {
    canonicalName: "EvidenceAssimilationCoordinator",
    objectKind: "other",
    boundedContext: "foundation_identity_access",
    authoritativeOwner: "Identity and access control",
    sourceRef:
      "phase-0-the-foundation-protocol.md#Canonical lifecycle, identity, safety, reservation, access, and reconciliation algorithm / 2. Required platform services / EvidenceAssimilationCoordinator",
  },
  {
    canonicalName: "EvidenceAssimilationRecord",
    objectKind: "record",
    boundedContext: "foundation_identity_access",
    authoritativeOwner: "Identity and access control",
    sourceRef:
      "phase-0-the-foundation-protocol.md#Canonical lifecycle, identity, safety, reservation, access, and reconciliation algorithm / 1. Required platform objects / EvidenceAssimilationRecord",
  },
  {
    canonicalName: "EvidenceClassificationDecision",
    objectKind: "record",
    boundedContext: "foundation_identity_access",
    authoritativeOwner: "Identity and access control",
    sourceRef:
      "phase-0-the-foundation-protocol.md#Canonical lifecycle, identity, safety, reservation, access, and reconciliation algorithm / 1. Required platform objects / EvidenceClassificationDecision",
  },
  {
    canonicalName: "ExceptionOrchestrator",
    objectKind: "other",
    boundedContext: "foundation_identity_access",
    authoritativeOwner: "Identity and access control",
    sourceRef:
      "phase-0-the-foundation-protocol.md#Canonical lifecycle, identity, safety, reservation, access, and reconciliation algorithm / 2. Required platform services / ExceptionOrchestrator",
  },
  {
    canonicalName: "ExternalConfirmationGate",
    objectKind: "gate",
    boundedContext: "foundation_identity_access",
    authoritativeOwner: "Identity and access control",
    sourceRef:
      "phase-0-the-foundation-protocol.md#Canonical lifecycle, identity, safety, reservation, access, and reconciliation algorithm / 1. Required platform objects / ExternalConfirmationGate",
  },
  {
    canonicalName: "FailoverRun",
    objectKind: "other",
    boundedContext: "foundation_identity_access",
    authoritativeOwner: "Identity and access control",
    sourceRef:
      "phase-0-the-foundation-protocol.md#Canonical lifecycle, identity, safety, reservation, access, and reconciliation algorithm / 1. Required platform objects / FailoverRun",
  },
  {
    canonicalName: "FallbackReviewCase",
    objectKind: "case",
    boundedContext: "foundation_identity_access",
    authoritativeOwner: "Identity and access control",
    sourceRef:
      "phase-0-the-foundation-protocol.md#Canonical lifecycle, identity, safety, reservation, access, and reconciliation algorithm / 1. Required platform objects / FallbackReviewCase",
  },
  {
    canonicalName: "GovernanceReviewPackage",
    objectKind: "bundle",
    boundedContext: "foundation_identity_access",
    authoritativeOwner: "Identity and access control",
    sourceRef:
      "phase-0-the-foundation-protocol.md#Canonical lifecycle, identity, safety, reservation, access, and reconciliation algorithm / 1. Required platform objects / GovernanceReviewPackage",
  },
  {
    canonicalName: "IdentityBinding",
    objectKind: "aggregate",
    boundedContext: "foundation_identity_access",
    authoritativeOwner: "Identity and access control",
    sourceRef:
      "phase-0-the-foundation-protocol.md#Canonical lifecycle, identity, safety, reservation, access, and reconciliation algorithm / 1. Required platform objects / IdentityBinding",
  },
  {
    canonicalName: "IdentityRepairBranchDisposition",
    objectKind: "record",
    boundedContext: "foundation_identity_access",
    authoritativeOwner: "Identity and access control",
    sourceRef:
      "phase-0-the-foundation-protocol.md#Canonical lifecycle, identity, safety, reservation, access, and reconciliation algorithm / 1. Required platform objects / IdentityRepairBranchDisposition",
  },
  {
    canonicalName: "IdentityRepairCase",
    objectKind: "case",
    boundedContext: "foundation_identity_access",
    authoritativeOwner: "Identity and access control",
    sourceRef:
      "phase-0-the-foundation-protocol.md#Canonical lifecycle, identity, safety, reservation, access, and reconciliation algorithm / 1. Required platform objects / IdentityRepairCase",
  },
  {
    canonicalName: "IdentityRepairFreezeRecord",
    objectKind: "record",
    boundedContext: "foundation_identity_access",
    authoritativeOwner: "Identity and access control",
    sourceRef:
      "phase-0-the-foundation-protocol.md#Canonical lifecycle, identity, safety, reservation, access, and reconciliation algorithm / 1. Required platform objects / IdentityRepairFreezeRecord",
  },
  {
    canonicalName: "IdentityRepairOrchestrator",
    objectKind: "other",
    boundedContext: "foundation_identity_access",
    authoritativeOwner: "Identity and access control",
    sourceRef:
      "phase-0-the-foundation-protocol.md#Canonical lifecycle, identity, safety, reservation, access, and reconciliation algorithm / 2. Required platform services / IdentityRepairOrchestrator",
  },
  {
    canonicalName: "IdentityRepairReleaseSettlement",
    objectKind: "settlement",
    boundedContext: "foundation_identity_access",
    authoritativeOwner: "Identity and access control",
    sourceRef:
      "phase-0-the-foundation-protocol.md#Canonical lifecycle, identity, safety, reservation, access, and reconciliation algorithm / 1. Required platform objects / IdentityRepairReleaseSettlement",
  },
  {
    canonicalName: "IntakeConvergenceContract",
    objectKind: "contract",
    boundedContext: "foundation_identity_access",
    authoritativeOwner: "Identity and access control",
    sourceRef:
      "phase-0-the-foundation-protocol.md#Canonical lifecycle, identity, safety, reservation, access, and reconciliation algorithm / 1. Required platform objects / IntakeConvergenceContract",
  },
  {
    canonicalName: "LeaseTakeoverRecord",
    objectKind: "record",
    boundedContext: "foundation_identity_access",
    authoritativeOwner: "Identity and access control",
    sourceRef:
      "phase-0-the-foundation-protocol.md#Canonical lifecycle, identity, safety, reservation, access, and reconciliation algorithm / 1. Required platform objects / StaleOwnershipRecoveryRecord and LeaseTakeoverRecord",
  },
  {
    canonicalName: "LifecycleCoordinator",
    objectKind: "other",
    boundedContext: "foundation_identity_access",
    authoritativeOwner: "LifecycleCoordinator",
    sourceRef:
      "phase-0-the-foundation-protocol.md#Canonical lifecycle, identity, safety, reservation, access, and reconciliation algorithm / LifecycleCoordinator",
  },
  {
    canonicalName: "LineageFence",
    objectKind: "gate",
    boundedContext: "foundation_identity_access",
    authoritativeOwner: "Identity and access control",
    sourceRef:
      "phase-0-the-foundation-protocol.md#Canonical lifecycle, identity, safety, reservation, access, and reconciliation algorithm / 1. Required platform objects / LineageFence",
  },
  {
    canonicalName: "MaterialDeltaAssessment",
    objectKind: "record",
    boundedContext: "foundation_identity_access",
    authoritativeOwner: "Identity and access control",
    sourceRef:
      "phase-0-the-foundation-protocol.md#Canonical lifecycle, identity, safety, reservation, access, and reconciliation algorithm / 1. Required platform objects / MaterialDeltaAssessment",
  },
  {
    canonicalName: "MinimumNecessaryContract",
    objectKind: "contract",
    boundedContext: "foundation_identity_access",
    authoritativeOwner: "Identity and access control",
    sourceRef:
      "phase-0-the-foundation-protocol.md#Canonical lifecycle, identity, safety, reservation, access, and reconciliation algorithm / 1. Required platform objects / MinimumNecessaryContract",
  },
  {
    canonicalName: "NextTaskPrefetchWindow",
    objectKind: "other",
    boundedContext: "foundation_identity_access",
    authoritativeOwner: "Identity and access control",
    sourceRef:
      "phase-0-the-foundation-protocol.md#Canonical lifecycle, identity, safety, reservation, access, and reconciliation algorithm / 1. Required platform objects / NextTaskPrefetchWindow",
  },
  {
    canonicalName: "OperationalReadinessSnapshot",
    objectKind: "record",
    boundedContext: "foundation_identity_access",
    authoritativeOwner: "Identity and access control",
    sourceRef:
      "phase-0-the-foundation-protocol.md#Canonical lifecycle, identity, safety, reservation, access, and reconciliation algorithm / 1. Required platform objects / OperationalReadinessSnapshot",
  },
  {
    canonicalName: "PatientActionRecoveryEnvelope",
    objectKind: "record",
    boundedContext: "foundation_identity_access",
    authoritativeOwner: "Identity and access control",
    sourceRef:
      "phase-0-the-foundation-protocol.md#Canonical lifecycle, identity, safety, reservation, access, and reconciliation algorithm / 1. Required platform objects / PatientActionRecoveryEnvelope",
  },
  {
    canonicalName: "PatientConversationPreviewDigest",
    objectKind: "digest",
    boundedContext: "foundation_identity_access",
    authoritativeOwner: "Identity and access control",
    sourceRef:
      "phase-0-the-foundation-protocol.md#Canonical lifecycle, identity, safety, reservation, access, and reconciliation algorithm / 1. Required platform objects / PatientConversationPreviewDigest",
  },
  {
    canonicalName: "PatientDegradedModeProjection",
    objectKind: "projection",
    boundedContext: "foundation_identity_access",
    authoritativeOwner: "Identity and access control",
    sourceRef:
      "phase-0-the-foundation-protocol.md#Canonical lifecycle, identity, safety, reservation, access, and reconciliation algorithm / 1. Required platform objects / PatientDegradedModeProjection",
  },
  {
    canonicalName: "PatientEmbeddedSessionProjection",
    objectKind: "projection",
    boundedContext: "foundation_identity_access",
    authoritativeOwner: "Identity and access control",
    sourceRef:
      "phase-0-the-foundation-protocol.md#Canonical lifecycle, identity, safety, reservation, access, and reconciliation algorithm / 1. Required platform objects / PatientEmbeddedSessionProjection",
  },
  {
    canonicalName: "PatientLink",
    objectKind: "other",
    boundedContext: "foundation_identity_access",
    authoritativeOwner: "Identity and access control",
    sourceRef:
      "phase-0-the-foundation-protocol.md#Canonical lifecycle, identity, safety, reservation, access, and reconciliation algorithm / 1. Required platform objects / PatientLink",
  },
  {
    canonicalName: "PatientNavReturnContract",
    objectKind: "contract",
    boundedContext: "foundation_identity_access",
    authoritativeOwner: "Identity and access control",
    sourceRef:
      "phase-0-the-foundation-protocol.md#Canonical lifecycle, identity, safety, reservation, access, and reconciliation algorithm / 1. Required platform objects / PatientNavReturnContract",
  },
  {
    canonicalName: "PatientNavUrgencyDigest",
    objectKind: "digest",
    boundedContext: "foundation_identity_access",
    authoritativeOwner: "Identity and access control",
    sourceRef:
      "phase-0-the-foundation-protocol.md#Canonical lifecycle, identity, safety, reservation, access, and reconciliation algorithm / 1. Required platform objects / PatientNavUrgencyDigest",
  },
  {
    canonicalName: "PatientQuietHomeDecision",
    objectKind: "record",
    boundedContext: "foundation_identity_access",
    authoritativeOwner: "Identity and access control",
    sourceRef:
      "phase-0-the-foundation-protocol.md#Canonical lifecycle, identity, safety, reservation, access, and reconciliation algorithm / 1. Required platform objects / PatientQuietHomeDecision",
  },
  {
    canonicalName: "PatientReceiptConsistencyEnvelope",
    objectKind: "record",
    boundedContext: "foundation_identity_access",
    authoritativeOwner: "Identity and access control",
    sourceRef:
      "phase-0-the-foundation-protocol.md#Canonical lifecycle, identity, safety, reservation, access, and reconciliation algorithm / 1. Required platform objects / PatientReceiptConsistencyEnvelope",
  },
  {
    canonicalName: "PatientReceiptEnvelope",
    objectKind: "record",
    boundedContext: "foundation_identity_access",
    authoritativeOwner: "Identity and access control",
    sourceRef:
      "phase-0-the-foundation-protocol.md#Canonical lifecycle, identity, safety, reservation, access, and reconciliation algorithm / 1. Required platform objects / PatientReceiptEnvelope",
  },
  {
    canonicalName: "PatientShellConsistencyProjection",
    objectKind: "projection",
    boundedContext: "foundation_identity_access",
    authoritativeOwner: "Identity and access control",
    sourceRef:
      "phase-0-the-foundation-protocol.md#Canonical lifecycle, identity, safety, reservation, access, and reconciliation algorithm / 1. Required platform objects / PatientShellConsistencyProjection",
  },
  {
    canonicalName: "PatientSpotlightDecisionProjection",
    objectKind: "projection",
    boundedContext: "foundation_identity_access",
    authoritativeOwner: "Identity and access control",
    sourceRef:
      "phase-0-the-foundation-protocol.md#Canonical lifecycle, identity, safety, reservation, access, and reconciliation algorithm / 1. Required platform objects / PatientSpotlightDecisionProjection",
  },
  {
    canonicalName: "PatientSpotlightDecisionUseWindow",
    objectKind: "other",
    boundedContext: "foundation_identity_access",
    authoritativeOwner: "Identity and access control",
    sourceRef:
      "phase-0-the-foundation-protocol.md#Canonical lifecycle, identity, safety, reservation, access, and reconciliation algorithm / 1. Required platform objects / PatientSpotlightDecisionUseWindow",
  },
  {
    canonicalName: "PharmacyCorrelationRecord",
    objectKind: "record",
    boundedContext: "foundation_identity_access",
    authoritativeOwner: "Identity and access control",
    sourceRef:
      "phase-0-the-foundation-protocol.md#Canonical lifecycle, identity, safety, reservation, access, and reconciliation algorithm / 1. Required platform objects / PharmacyCorrelationRecord",
  },
  {
    canonicalName: "PreviewVisibilityContract",
    objectKind: "contract",
    boundedContext: "foundation_identity_access",
    authoritativeOwner: "Identity and access control",
    sourceRef:
      "phase-0-the-foundation-protocol.md#Canonical lifecycle, identity, safety, reservation, access, and reconciliation algorithm / 1. Required platform objects / PreviewVisibilityContract",
  },
  {
    canonicalName: "ProjectionActionSet",
    objectKind: "other",
    boundedContext: "foundation_identity_access",
    authoritativeOwner: "Identity and access control",
    sourceRef:
      "phase-0-the-foundation-protocol.md#Canonical lifecycle, identity, safety, reservation, access, and reconciliation algorithm / 1. Required platform objects / ProjectionActionSet",
  },
  {
    canonicalName: "ProtectedCompositionState",
    objectKind: "descriptor",
    boundedContext: "foundation_identity_access",
    authoritativeOwner: "Identity and access control",
    sourceRef:
      "phase-0-the-foundation-protocol.md#Canonical lifecycle, identity, safety, reservation, access, and reconciliation algorithm / 1. Required platform objects / ProtectedCompositionState",
  },
  {
    canonicalName: "ProviderCapabilityMatrix",
    objectKind: "descriptor",
    boundedContext: "foundation_identity_access",
    authoritativeOwner: "Identity and access control",
    sourceRef:
      "phase-0-the-foundation-protocol.md#Canonical lifecycle, identity, safety, reservation, access, and reconciliation algorithm / 1. Required platform objects / ProviderCapabilityMatrix",
  },
  {
    canonicalName: "QueueRankingCoordinator",
    objectKind: "other",
    boundedContext: "foundation_identity_access",
    authoritativeOwner: "Identity and access control",
    sourceRef:
      "phase-0-the-foundation-protocol.md#Canonical lifecycle, identity, safety, reservation, access, and reconciliation algorithm / 2. Required platform services / QueueRankingCoordinator",
  },
  {
    canonicalName: "ReachabilityAssessmentRecord",
    objectKind: "record",
    boundedContext: "foundation_identity_access",
    authoritativeOwner: "Identity and access control",
    sourceRef:
      "phase-0-the-foundation-protocol.md#Canonical lifecycle, identity, safety, reservation, access, and reconciliation algorithm / 1. Required platform objects / ReachabilityAssessmentRecord",
  },
  {
    canonicalName: "ReachabilityDependency",
    objectKind: "blocker",
    boundedContext: "foundation_identity_access",
    authoritativeOwner: "Identity and access control",
    sourceRef:
      "phase-0-the-foundation-protocol.md#Canonical lifecycle, identity, safety, reservation, access, and reconciliation algorithm / 1. Required platform objects / ReachabilityDependency",
  },
  {
    canonicalName: "ReachabilityGovernor",
    objectKind: "other",
    boundedContext: "foundation_identity_access",
    authoritativeOwner: "Identity and access control",
    sourceRef:
      "phase-0-the-foundation-protocol.md#Canonical lifecycle, identity, safety, reservation, access, and reconciliation algorithm / 2. Required platform services / ReachabilityGovernor",
  },
  {
    canonicalName: "ReachabilityObservation",
    objectKind: "other",
    boundedContext: "foundation_identity_access",
    authoritativeOwner: "Identity and access control",
    sourceRef:
      "phase-0-the-foundation-protocol.md#Canonical lifecycle, identity, safety, reservation, access, and reconciliation algorithm / 1. Required platform objects / ReachabilityObservation",
  },
  {
    canonicalName: "RecordActionContextToken",
    objectKind: "token",
    boundedContext: "foundation_identity_access",
    authoritativeOwner: "Identity and access control",
    sourceRef:
      "phase-0-the-foundation-protocol.md#Canonical lifecycle, identity, safety, reservation, access, and reconciliation algorithm / 1. Required platform objects / RecordActionContextToken",
  },
  {
    canonicalName: "RecordArtifactParityWitness",
    objectKind: "witness",
    boundedContext: "foundation_identity_access",
    authoritativeOwner: "Identity and access control",
    sourceRef:
      "phase-0-the-foundation-protocol.md#Canonical lifecycle, identity, safety, reservation, access, and reconciliation algorithm / 1. Required platform objects / RecordArtifactParityWitness",
  },
  {
    canonicalName: "RecordOriginContinuationEnvelope",
    objectKind: "record",
    boundedContext: "foundation_identity_access",
    authoritativeOwner: "Identity and access control",
    sourceRef:
      "phase-0-the-foundation-protocol.md#Canonical lifecycle, identity, safety, reservation, access, and reconciliation algorithm / 1. Required platform objects / RecordOriginContinuationEnvelope",
  },
  {
    canonicalName: "RecoveryContinuationToken",
    objectKind: "token",
    boundedContext: "foundation_identity_access",
    authoritativeOwner: "Identity and access control",
    sourceRef:
      "phase-0-the-foundation-protocol.md#Canonical lifecycle, identity, safety, reservation, access, and reconciliation algorithm / 1. Required platform objects / RecoveryContinuationToken",
  },
  {
    canonicalName: "RecoveryControlPosture",
    objectKind: "other",
    boundedContext: "foundation_identity_access",
    authoritativeOwner: "Identity and access control",
    sourceRef:
      "phase-0-the-foundation-protocol.md#Canonical lifecycle, identity, safety, reservation, access, and reconciliation algorithm / 1. Required platform objects / RecoveryControlPosture",
  },
  {
    canonicalName: "RecoveryEvidenceArtifact",
    objectKind: "artifact",
    boundedContext: "foundation_identity_access",
    authoritativeOwner: "Identity and access control",
    sourceRef:
      "phase-0-the-foundation-protocol.md#Canonical lifecycle, identity, safety, reservation, access, and reconciliation algorithm / 1. Required platform objects / RecoveryEvidenceArtifact",
  },
  {
    canonicalName: "RecoveryTier",
    objectKind: "other",
    boundedContext: "foundation_identity_access",
    authoritativeOwner: "Identity and access control",
    sourceRef:
      "phase-0-the-foundation-protocol.md#Canonical lifecycle, identity, safety, reservation, access, and reconciliation algorithm / 1. Required platform objects / RecoveryTier",
  },
  {
    canonicalName: "ReleaseApprovalFreeze",
    objectKind: "gate",
    boundedContext: "foundation_identity_access",
    authoritativeOwner: "Identity and access control",
    sourceRef:
      "phase-0-the-foundation-protocol.md#Canonical lifecycle, identity, safety, reservation, access, and reconciliation algorithm / 1. Required platform objects / ReleaseApprovalFreeze",
  },
  {
    canonicalName: "ReleaseRecoveryDisposition",
    objectKind: "record",
    boundedContext: "foundation_identity_access",
    authoritativeOwner: "Identity and access control",
    sourceRef:
      "phase-0-the-foundation-protocol.md#Canonical lifecycle, identity, safety, reservation, access, and reconciliation algorithm / 1. Required platform objects / ReleaseRecoveryDisposition",
  },
  {
    canonicalName: "ReleaseTrustFreezeVerdict",
    objectKind: "witness",
    boundedContext: "foundation_identity_access",
    authoritativeOwner: "Identity and access control",
    sourceRef:
      "phase-0-the-foundation-protocol.md#Canonical lifecycle, identity, safety, reservation, access, and reconciliation algorithm / 1. Required platform objects / ReleaseTrustFreezeVerdict",
  },
  {
    canonicalName: "ReleaseWatchEvidenceCockpit",
    objectKind: "other",
    boundedContext: "foundation_identity_access",
    authoritativeOwner: "Identity and access control",
    sourceRef:
      "phase-0-the-foundation-protocol.md#Canonical lifecycle, identity, safety, reservation, access, and reconciliation algorithm / 1. Required platform objects / ReleaseWatchEvidenceCockpit",
  },
  {
    canonicalName: "ReplayCollisionReview",
    objectKind: "other",
    boundedContext: "foundation_identity_access",
    authoritativeOwner: "Identity and access control",
    sourceRef:
      "phase-0-the-foundation-protocol.md#Canonical lifecycle, identity, safety, reservation, access, and reconciliation algorithm / 1. Required platform objects / ReplayCollisionReview",
  },
  {
    canonicalName: "RequestClosureRecord",
    objectKind: "record",
    boundedContext: "foundation_identity_access",
    authoritativeOwner: "Identity and access control",
    sourceRef:
      "phase-0-the-foundation-protocol.md#Canonical lifecycle, identity, safety, reservation, access, and reconciliation algorithm / 1. Required platform objects / RequestClosureRecord",
  },
  {
    canonicalName: "RequestLifecycleLease",
    objectKind: "lease",
    boundedContext: "foundation_identity_access",
    authoritativeOwner: "Identity and access control",
    sourceRef:
      "phase-0-the-foundation-protocol.md#Canonical lifecycle, identity, safety, reservation, access, and reconciliation algorithm / 1. Required platform objects / RequestLifecycleLease",
  },
  {
    canonicalName: "ReservationTruthProjection",
    objectKind: "projection",
    boundedContext: "foundation_identity_access",
    authoritativeOwner: "Identity and access control",
    sourceRef:
      "phase-0-the-foundation-protocol.md#Canonical lifecycle, identity, safety, reservation, access, and reconciliation algorithm / 1. Required platform objects / ReservationTruthProjection",
  },
  {
    canonicalName: "ResilienceActionRecord",
    objectKind: "record",
    boundedContext: "foundation_identity_access",
    authoritativeOwner: "Identity and access control",
    sourceRef:
      "phase-0-the-foundation-protocol.md#Canonical lifecycle, identity, safety, reservation, access, and reconciliation algorithm / 1. Required platform objects / ResilienceActionRecord",
  },
  {
    canonicalName: "ResilienceActionSettlement",
    objectKind: "settlement",
    boundedContext: "foundation_identity_access",
    authoritativeOwner: "Identity and access control",
    sourceRef:
      "phase-0-the-foundation-protocol.md#Canonical lifecycle, identity, safety, reservation, access, and reconciliation algorithm / 1. Required platform objects / ResilienceActionSettlement",
  },
  {
    canonicalName: "ResilienceOrchestrator",
    objectKind: "other",
    boundedContext: "foundation_identity_access",
    authoritativeOwner: "Identity and access control",
    sourceRef:
      "phase-0-the-foundation-protocol.md#Canonical lifecycle, identity, safety, reservation, access, and reconciliation algorithm / 2. Required platform services / ResilienceOrchestrator",
  },
  {
    canonicalName: "ResilienceSurfaceRuntimeBinding",
    objectKind: "descriptor",
    boundedContext: "foundation_identity_access",
    authoritativeOwner: "Identity and access control",
    sourceRef:
      "phase-0-the-foundation-protocol.md#Canonical lifecycle, identity, safety, reservation, access, and reconciliation algorithm / 1. Required platform objects / ResilienceSurfaceRuntimeBinding",
  },
  {
    canonicalName: "RestoreRun",
    objectKind: "other",
    boundedContext: "foundation_identity_access",
    authoritativeOwner: "Identity and access control",
    sourceRef:
      "phase-0-the-foundation-protocol.md#Canonical lifecycle, identity, safety, reservation, access, and reconciliation algorithm / 1. Required platform objects / RestoreRun",
  },
  {
    canonicalName: "ReviewActionLease",
    objectKind: "lease",
    boundedContext: "foundation_identity_access",
    authoritativeOwner: "Identity and access control",
    sourceRef:
      "phase-0-the-foundation-protocol.md#Canonical lifecycle, identity, safety, reservation, access, and reconciliation algorithm / 1. Required platform objects / ReviewActionLease",
  },
  {
    canonicalName: "RouteFreezeDisposition",
    objectKind: "record",
    boundedContext: "foundation_identity_access",
    authoritativeOwner: "Identity and access control",
    sourceRef:
      "phase-0-the-foundation-protocol.md#Canonical lifecycle, identity, safety, reservation, access, and reconciliation algorithm / 1. Required platform objects / RouteFreezeDisposition",
  },
  {
    canonicalName: "RouteIntentBinding",
    objectKind: "descriptor",
    boundedContext: "foundation_identity_access",
    authoritativeOwner: "Identity and access control",
    sourceRef:
      "phase-0-the-foundation-protocol.md#Canonical lifecycle, identity, safety, reservation, access, and reconciliation algorithm / 1. Required platform objects / RouteIntentBinding",
  },
  {
    canonicalName: "RunbookBindingRecord",
    objectKind: "record",
    boundedContext: "foundation_identity_access",
    authoritativeOwner: "Identity and access control",
    sourceRef:
      "phase-0-the-foundation-protocol.md#Canonical lifecycle, identity, safety, reservation, access, and reconciliation algorithm / 1. Required platform objects / RunbookBindingRecord",
  },
  {
    canonicalName: "RuntimeContractPublisher",
    objectKind: "other",
    boundedContext: "foundation_identity_access",
    authoritativeOwner: "Identity and access control",
    sourceRef:
      "phase-0-the-foundation-protocol.md#Canonical lifecycle, identity, safety, reservation, access, and reconciliation algorithm / 2. Required platform services / RuntimeContractPublisher",
  },
  {
    canonicalName: "RuntimePublicationBundle",
    objectKind: "bundle",
    boundedContext: "foundation_identity_access",
    authoritativeOwner: "Identity and access control",
    sourceRef:
      "phase-0-the-foundation-protocol.md#Canonical lifecycle, identity, safety, reservation, access, and reconciliation algorithm / 1. Required platform objects / RuntimePublicationBundle",
  },
  {
    canonicalName: "SafetyDecisionRecord",
    objectKind: "record",
    boundedContext: "foundation_identity_access",
    authoritativeOwner: "Identity and access control",
    sourceRef:
      "phase-0-the-foundation-protocol.md#Canonical lifecycle, identity, safety, reservation, access, and reconciliation algorithm / 1. Required platform objects / SafetyDecisionRecord",
  },
  {
    canonicalName: "SafetyOrchestrator",
    objectKind: "other",
    boundedContext: "foundation_identity_access",
    authoritativeOwner: "Identity and access control",
    sourceRef:
      "phase-0-the-foundation-protocol.md#Canonical lifecycle, identity, safety, reservation, access, and reconciliation algorithm / 2. Required platform services / SafetyOrchestrator",
  },
  {
    canonicalName: "SafetyPreemptionRecord",
    objectKind: "record",
    boundedContext: "foundation_identity_access",
    authoritativeOwner: "Identity and access control",
    sourceRef:
      "phase-0-the-foundation-protocol.md#Canonical lifecycle, identity, safety, reservation, access, and reconciliation algorithm / 1. Required platform objects / SafetyPreemptionRecord",
  },
  {
    canonicalName: "SectionVisibilityContract",
    objectKind: "contract",
    boundedContext: "foundation_identity_access",
    authoritativeOwner: "Identity and access control",
    sourceRef:
      "phase-0-the-foundation-protocol.md#Canonical lifecycle, identity, safety, reservation, access, and reconciliation algorithm / 1. Required platform objects / SectionVisibilityContract",
  },
  {
    canonicalName: "SelfCareBoundaryDecision",
    objectKind: "record",
    boundedContext: "foundation_identity_access",
    authoritativeOwner: "Identity and access control",
    sourceRef:
      "phase-0-the-foundation-protocol.md#Canonical lifecycle, identity, safety, reservation, access, and reconciliation algorithm / 1. Required platform objects / SelfCareBoundaryDecision",
  },
  {
    canonicalName: "SelfCareExperienceProjection",
    objectKind: "projection",
    boundedContext: "foundation_identity_access",
    authoritativeOwner: "Identity and access control",
    sourceRef:
      "phase-0-the-foundation-protocol.md#Canonical lifecycle, identity, safety, reservation, access, and reconciliation algorithm / 1. Required platform objects / SelfCareExperienceProjection",
  },
  {
    canonicalName: "Session",
    objectKind: "other",
    boundedContext: "foundation_identity_access",
    authoritativeOwner: "Identity and access control",
    sourceRef:
      "phase-0-the-foundation-protocol.md#Canonical lifecycle, identity, safety, reservation, access, and reconciliation algorithm / 1. Required platform objects / Session",
  },
  {
    canonicalName: "SessionEstablishmentDecision",
    objectKind: "record",
    boundedContext: "foundation_identity_access",
    authoritativeOwner: "Identity and access control",
    sourceRef:
      "phase-0-the-foundation-protocol.md#Canonical lifecycle, identity, safety, reservation, access, and reconciliation algorithm / 1. Required platform objects / SessionEstablishmentDecision",
  },
  {
    canonicalName: "SessionGovernor",
    objectKind: "other",
    boundedContext: "foundation_identity_access",
    authoritativeOwner: "Identity and access control",
    sourceRef:
      "phase-0-the-foundation-protocol.md#Canonical lifecycle, identity, safety, reservation, access, and reconciliation algorithm / 2. Required platform services / SessionGovernor",
  },
  {
    canonicalName: "SessionTerminationSettlement",
    objectKind: "settlement",
    boundedContext: "foundation_identity_access",
    authoritativeOwner: "Identity and access control",
    sourceRef:
      "phase-0-the-foundation-protocol.md#Canonical lifecycle, identity, safety, reservation, access, and reconciliation algorithm / 1. Required platform objects / SessionTerminationSettlement",
  },
  {
    canonicalName: "StaffWorkspaceConsistencyProjection",
    objectKind: "projection",
    boundedContext: "foundation_identity_access",
    authoritativeOwner: "Identity and access control",
    sourceRef:
      "phase-0-the-foundation-protocol.md#Canonical lifecycle, identity, safety, reservation, access, and reconciliation algorithm / 1. Required platform objects / StaffWorkspaceConsistencyProjection",
  },
  {
    canonicalName: "StaleOwnershipRecoveryRecord",
    objectKind: "record",
    boundedContext: "foundation_identity_access",
    authoritativeOwner: "Identity and access control",
    sourceRef:
      "phase-0-the-foundation-protocol.md#Canonical lifecycle, identity, safety, reservation, access, and reconciliation algorithm / 1. Required platform objects / StaleOwnershipRecoveryRecord and LeaseTakeoverRecord",
  },
  {
    canonicalName: "StandardsDependencyWatchlist",
    objectKind: "other",
    boundedContext: "foundation_identity_access",
    authoritativeOwner: "Identity and access control",
    sourceRef:
      "phase-0-the-foundation-protocol.md#Canonical lifecycle, identity, safety, reservation, access, and reconciliation algorithm / 1. Required platform objects / StandardsDependencyWatchlist",
  },
  {
    canonicalName: "SubmissionPromotionRecord",
    objectKind: "record",
    boundedContext: "foundation_identity_access",
    authoritativeOwner: "Identity and access control",
    sourceRef:
      "phase-0-the-foundation-protocol.md#Canonical lifecycle, identity, safety, reservation, access, and reconciliation algorithm / 1. Required platform objects / SubmissionPromotionRecord",
  },
  {
    canonicalName: "SupportLineageArtifactBinding",
    objectKind: "descriptor",
    boundedContext: "foundation_identity_access",
    authoritativeOwner: "Identity and access control",
    sourceRef:
      "phase-0-the-foundation-protocol.md#Canonical lifecycle, identity, safety, reservation, access, and reconciliation algorithm / 1. Required platform objects / SupportLineageArtifactBinding",
  },
  {
    canonicalName: "SupportLineageBinding",
    objectKind: "descriptor",
    boundedContext: "foundation_identity_access",
    authoritativeOwner: "Identity and access control",
    sourceRef:
      "phase-0-the-foundation-protocol.md#Canonical lifecycle, identity, safety, reservation, access, and reconciliation algorithm / 1. Required platform objects / SupportLineageBinding",
  },
  {
    canonicalName: "SupportReplayRestoreSettlement",
    objectKind: "settlement",
    boundedContext: "foundation_identity_access",
    authoritativeOwner: "Identity and access control",
    sourceRef:
      "phase-0-the-foundation-protocol.md#Canonical lifecycle, identity, safety, reservation, access, and reconciliation algorithm / 1. Required platform objects / SupportReplayRestoreSettlement",
  },
  {
    canonicalName: "TaskCompletionSettlementEnvelope",
    objectKind: "record",
    boundedContext: "foundation_identity_access",
    authoritativeOwner: "Identity and access control",
    sourceRef:
      "phase-0-the-foundation-protocol.md#Canonical lifecycle, identity, safety, reservation, access, and reconciliation algorithm / 1. Required platform objects / TaskCompletionSettlementEnvelope",
  },
  {
    canonicalName: "TelephonyContinuationEligibility",
    objectKind: "other",
    boundedContext: "foundation_identity_access",
    authoritativeOwner: "Identity and access control",
    sourceRef:
      "phase-0-the-foundation-protocol.md#Canonical lifecycle, identity, safety, reservation, access, and reconciliation algorithm / 1. Required platform objects / TelephonyContinuationEligibility",
  },
  {
    canonicalName: "TelephonyEvidenceReadinessAssessment",
    objectKind: "record",
    boundedContext: "foundation_identity_access",
    authoritativeOwner: "Identity and access control",
    sourceRef:
      "phase-0-the-foundation-protocol.md#Canonical lifecycle, identity, safety, reservation, access, and reconciliation algorithm / 1. Required platform objects / TelephonyEvidenceReadinessAssessment",
  },
  {
    canonicalName: "TelephonyManualReviewDisposition",
    objectKind: "record",
    boundedContext: "foundation_identity_access",
    authoritativeOwner: "Identity and access control",
    sourceRef:
      "phase-0-the-foundation-protocol.md#Canonical lifecycle, identity, safety, reservation, access, and reconciliation algorithm / 1. Required platform objects / TelephonyManualReviewDisposition",
  },
  {
    canonicalName: "TelephonyTranscriptReadinessRecord",
    objectKind: "record",
    boundedContext: "foundation_identity_access",
    authoritativeOwner: "Identity and access control",
    sourceRef:
      "phase-0-the-foundation-protocol.md#Canonical lifecycle, identity, safety, reservation, access, and reconciliation algorithm / 1. Required platform objects / TelephonyTranscriptReadinessRecord",
  },
  {
    canonicalName: "TelephonyUrgentLiveAssessment",
    objectKind: "record",
    boundedContext: "foundation_identity_access",
    authoritativeOwner: "Identity and access control",
    sourceRef:
      "phase-0-the-foundation-protocol.md#Canonical lifecycle, identity, safety, reservation, access, and reconciliation algorithm / 1. Required platform objects / TelephonyUrgentLiveAssessment",
  },
  {
    canonicalName: "UrgentDiversionSettlement",
    objectKind: "settlement",
    boundedContext: "foundation_identity_access",
    authoritativeOwner: "Identity and access control",
    sourceRef:
      "phase-0-the-foundation-protocol.md#Canonical lifecycle, identity, safety, reservation, access, and reconciliation algorithm / 1. Required platform objects / UrgentDiversionSettlement",
  },
  {
    canonicalName: "VisibilityPolicyCompiler",
    objectKind: "other",
    boundedContext: "foundation_identity_access",
    authoritativeOwner: "Identity and access control",
    sourceRef:
      "phase-0-the-foundation-protocol.md#Canonical lifecycle, identity, safety, reservation, access, and reconciliation algorithm / 2. Required platform services / VisibilityPolicyCompiler",
  },
  {
    canonicalName: "VisibilityProjectionPolicy",
    objectKind: "policy",
    boundedContext: "foundation_identity_access",
    authoritativeOwner: "Identity and access control",
    sourceRef:
      "phase-0-the-foundation-protocol.md#Canonical lifecycle, identity, safety, reservation, access, and reconciliation algorithm / 1. Required platform objects / VisibilityProjectionPolicy",
  },
  {
    canonicalName: "WorkspaceFocusProtectionLease",
    objectKind: "lease",
    boundedContext: "foundation_identity_access",
    authoritativeOwner: "Identity and access control",
    sourceRef:
      "phase-0-the-foundation-protocol.md#Canonical lifecycle, identity, safety, reservation, access, and reconciliation algorithm / 1. Required platform objects / WorkspaceFocusProtectionLease",
  },
  {
    canonicalName: "WorkspaceSliceTrustProjection",
    objectKind: "projection",
    boundedContext: "foundation_identity_access",
    authoritativeOwner: "Identity and access control",
    sourceRef:
      "phase-0-the-foundation-protocol.md#Canonical lifecycle, identity, safety, reservation, access, and reconciliation algorithm / 1. Required platform objects / WorkspaceSliceTrustProjection",
  },
  {
    canonicalName: "WorkspaceTrustEnvelope",
    objectKind: "record",
    boundedContext: "foundation_identity_access",
    authoritativeOwner: "Identity and access control",
    sourceRef:
      "phase-0-the-foundation-protocol.md#Canonical lifecycle, identity, safety, reservation, access, and reconciliation algorithm / 1. Required platform objects / WorkspaceTrustEnvelope",
  },
] as const satisfies readonly OwnedObjectFamily[];

export const aggregateFamilies = [
  {
    canonicalName: "AccessGrantSupersessionRecord",
    objectKind: "record",
    boundedContext: "foundation_identity_access",
    authoritativeOwner: "Identity and access control",
    sourceRef:
      "phase-0-the-foundation-protocol.md#Canonical lifecycle, identity, safety, reservation, access, and reconciliation algorithm / 1. Required platform objects / AccessGrantSupersessionRecord",
  },
  {
    canonicalName: "DuplicateCluster",
    objectKind: "aggregate",
    boundedContext: "foundation_identity_access",
    authoritativeOwner: "Identity and access control",
    sourceRef:
      "phase-0-the-foundation-protocol.md#Canonical lifecycle, identity, safety, reservation, access, and reconciliation algorithm / 1. Required platform objects / DuplicateCluster",
  },
  {
    canonicalName: "Episode",
    objectKind: "aggregate",
    boundedContext: "foundation_identity_access",
    authoritativeOwner: "Identity and access control",
    sourceRef:
      "phase-0-the-foundation-protocol.md#Canonical lifecycle, identity, safety, reservation, access, and reconciliation algorithm / 1. Required platform objects / Episode",
  },
  {
    canonicalName: "FallbackReviewCase",
    objectKind: "case",
    boundedContext: "foundation_identity_access",
    authoritativeOwner: "Identity and access control",
    sourceRef:
      "phase-0-the-foundation-protocol.md#Canonical lifecycle, identity, safety, reservation, access, and reconciliation algorithm / 1. Required platform objects / FallbackReviewCase",
  },
  {
    canonicalName: "IdentityBinding",
    objectKind: "aggregate",
    boundedContext: "foundation_identity_access",
    authoritativeOwner: "Identity and access control",
    sourceRef:
      "phase-0-the-foundation-protocol.md#Canonical lifecycle, identity, safety, reservation, access, and reconciliation algorithm / 1. Required platform objects / IdentityBinding",
  },
  {
    canonicalName: "IdentityRepairCase",
    objectKind: "case",
    boundedContext: "foundation_identity_access",
    authoritativeOwner: "Identity and access control",
    sourceRef:
      "phase-0-the-foundation-protocol.md#Canonical lifecycle, identity, safety, reservation, access, and reconciliation algorithm / 1. Required platform objects / IdentityRepairCase",
  },
  {
    canonicalName: "PatientEmbeddedSessionProjection",
    objectKind: "projection",
    boundedContext: "foundation_identity_access",
    authoritativeOwner: "Identity and access control",
    sourceRef:
      "phase-0-the-foundation-protocol.md#Canonical lifecycle, identity, safety, reservation, access, and reconciliation algorithm / 1. Required platform objects / PatientEmbeddedSessionProjection",
  },
  {
    canonicalName: "Session",
    objectKind: "other",
    boundedContext: "foundation_identity_access",
    authoritativeOwner: "Identity and access control",
    sourceRef:
      "phase-0-the-foundation-protocol.md#Canonical lifecycle, identity, safety, reservation, access, and reconciliation algorithm / 1. Required platform objects / Session",
  },
  {
    canonicalName: "SessionEstablishmentDecision",
    objectKind: "record",
    boundedContext: "foundation_identity_access",
    authoritativeOwner: "Identity and access control",
    sourceRef:
      "phase-0-the-foundation-protocol.md#Canonical lifecycle, identity, safety, reservation, access, and reconciliation algorithm / 1. Required platform objects / SessionEstablishmentDecision",
  },
  {
    canonicalName: "SessionGovernor",
    objectKind: "other",
    boundedContext: "foundation_identity_access",
    authoritativeOwner: "Identity and access control",
    sourceRef:
      "phase-0-the-foundation-protocol.md#Canonical lifecycle, identity, safety, reservation, access, and reconciliation algorithm / 2. Required platform services / SessionGovernor",
  },
  {
    canonicalName: "SessionTerminationSettlement",
    objectKind: "settlement",
    boundedContext: "foundation_identity_access",
    authoritativeOwner: "Identity and access control",
    sourceRef:
      "phase-0-the-foundation-protocol.md#Canonical lifecycle, identity, safety, reservation, access, and reconciliation algorithm / 1. Required platform objects / SessionTerminationSettlement",
  },
] as const satisfies readonly OwnedObjectFamily[];

export const domainServiceFamilies = [
  {
    canonicalName: "AccessGrantService",
    objectKind: "other",
    boundedContext: "foundation_identity_access",
    authoritativeOwner: "Identity and access control",
    sourceRef:
      "phase-0-the-foundation-protocol.md#Canonical lifecycle, identity, safety, reservation, access, and reconciliation algorithm / 2. Required platform services / AccessGrantService",
  },
  {
    canonicalName: "AssuranceSupervisor",
    objectKind: "other",
    boundedContext: "foundation_identity_access",
    authoritativeOwner: "Identity and access control",
    sourceRef:
      "phase-0-the-foundation-protocol.md#Canonical lifecycle, identity, safety, reservation, access, and reconciliation algorithm / 2. Required platform services / AssuranceSupervisor",
  },
  {
    canonicalName: "EvidenceAssimilationCoordinator",
    objectKind: "other",
    boundedContext: "foundation_identity_access",
    authoritativeOwner: "Identity and access control",
    sourceRef:
      "phase-0-the-foundation-protocol.md#Canonical lifecycle, identity, safety, reservation, access, and reconciliation algorithm / 2. Required platform services / EvidenceAssimilationCoordinator",
  },
  {
    canonicalName: "ExceptionOrchestrator",
    objectKind: "other",
    boundedContext: "foundation_identity_access",
    authoritativeOwner: "Identity and access control",
    sourceRef:
      "phase-0-the-foundation-protocol.md#Canonical lifecycle, identity, safety, reservation, access, and reconciliation algorithm / 2. Required platform services / ExceptionOrchestrator",
  },
  {
    canonicalName: "IdentityRepairOrchestrator",
    objectKind: "other",
    boundedContext: "foundation_identity_access",
    authoritativeOwner: "Identity and access control",
    sourceRef:
      "phase-0-the-foundation-protocol.md#Canonical lifecycle, identity, safety, reservation, access, and reconciliation algorithm / 2. Required platform services / IdentityRepairOrchestrator",
  },
  {
    canonicalName: "LifecycleCoordinator",
    objectKind: "other",
    boundedContext: "foundation_identity_access",
    authoritativeOwner: "LifecycleCoordinator",
    sourceRef:
      "phase-0-the-foundation-protocol.md#Canonical lifecycle, identity, safety, reservation, access, and reconciliation algorithm / LifecycleCoordinator",
  },
  {
    canonicalName: "QueueRankingCoordinator",
    objectKind: "other",
    boundedContext: "foundation_identity_access",
    authoritativeOwner: "Identity and access control",
    sourceRef:
      "phase-0-the-foundation-protocol.md#Canonical lifecycle, identity, safety, reservation, access, and reconciliation algorithm / 2. Required platform services / QueueRankingCoordinator",
  },
  {
    canonicalName: "ReachabilityGovernor",
    objectKind: "other",
    boundedContext: "foundation_identity_access",
    authoritativeOwner: "Identity and access control",
    sourceRef:
      "phase-0-the-foundation-protocol.md#Canonical lifecycle, identity, safety, reservation, access, and reconciliation algorithm / 2. Required platform services / ReachabilityGovernor",
  },
  {
    canonicalName: "ResilienceOrchestrator",
    objectKind: "other",
    boundedContext: "foundation_identity_access",
    authoritativeOwner: "Identity and access control",
    sourceRef:
      "phase-0-the-foundation-protocol.md#Canonical lifecycle, identity, safety, reservation, access, and reconciliation algorithm / 2. Required platform services / ResilienceOrchestrator",
  },
  {
    canonicalName: "SafetyOrchestrator",
    objectKind: "other",
    boundedContext: "foundation_identity_access",
    authoritativeOwner: "Identity and access control",
    sourceRef:
      "phase-0-the-foundation-protocol.md#Canonical lifecycle, identity, safety, reservation, access, and reconciliation algorithm / 2. Required platform services / SafetyOrchestrator",
  },
  {
    canonicalName: "SessionGovernor",
    objectKind: "other",
    boundedContext: "foundation_identity_access",
    authoritativeOwner: "Identity and access control",
    sourceRef:
      "phase-0-the-foundation-protocol.md#Canonical lifecycle, identity, safety, reservation, access, and reconciliation algorithm / 2. Required platform services / SessionGovernor",
  },
  {
    canonicalName: "VisibilityPolicyCompiler",
    objectKind: "other",
    boundedContext: "foundation_identity_access",
    authoritativeOwner: "Identity and access control",
    sourceRef:
      "phase-0-the-foundation-protocol.md#Canonical lifecycle, identity, safety, reservation, access, and reconciliation algorithm / 2. Required platform services / VisibilityPolicyCompiler",
  },
] as const satisfies readonly OwnedObjectFamily[];

export const eventFamilies = [] as const satisfies readonly OwnedObjectFamily[];

export const policyFamilies = [
  {
    canonicalName: "ChannelReleaseFreezeRecord",
    objectKind: "record",
    boundedContext: "foundation_identity_access",
    authoritativeOwner: "Identity and access control",
    sourceRef:
      "phase-0-the-foundation-protocol.md#Canonical lifecycle, identity, safety, reservation, access, and reconciliation algorithm / 1. Required platform objects / ChannelReleaseFreezeRecord",
  },
  {
    canonicalName: "CompiledPolicyBundle",
    objectKind: "bundle",
    boundedContext: "foundation_identity_access",
    authoritativeOwner: "Identity and access control",
    sourceRef:
      "phase-0-the-foundation-protocol.md#Canonical lifecycle, identity, safety, reservation, access, and reconciliation algorithm / 1. Required platform objects / CompiledPolicyBundle",
  },
  {
    canonicalName: "ExternalConfirmationGate",
    objectKind: "gate",
    boundedContext: "foundation_identity_access",
    authoritativeOwner: "Identity and access control",
    sourceRef:
      "phase-0-the-foundation-protocol.md#Canonical lifecycle, identity, safety, reservation, access, and reconciliation algorithm / 1. Required platform objects / ExternalConfirmationGate",
  },
  {
    canonicalName: "IdentityRepairFreezeRecord",
    objectKind: "record",
    boundedContext: "foundation_identity_access",
    authoritativeOwner: "Identity and access control",
    sourceRef:
      "phase-0-the-foundation-protocol.md#Canonical lifecycle, identity, safety, reservation, access, and reconciliation algorithm / 1. Required platform objects / IdentityRepairFreezeRecord",
  },
  {
    canonicalName: "LineageFence",
    objectKind: "gate",
    boundedContext: "foundation_identity_access",
    authoritativeOwner: "Identity and access control",
    sourceRef:
      "phase-0-the-foundation-protocol.md#Canonical lifecycle, identity, safety, reservation, access, and reconciliation algorithm / 1. Required platform objects / LineageFence",
  },
  {
    canonicalName: "ReachabilityGovernor",
    objectKind: "other",
    boundedContext: "foundation_identity_access",
    authoritativeOwner: "Identity and access control",
    sourceRef:
      "phase-0-the-foundation-protocol.md#Canonical lifecycle, identity, safety, reservation, access, and reconciliation algorithm / 2. Required platform services / ReachabilityGovernor",
  },
  {
    canonicalName: "ReleaseApprovalFreeze",
    objectKind: "gate",
    boundedContext: "foundation_identity_access",
    authoritativeOwner: "Identity and access control",
    sourceRef:
      "phase-0-the-foundation-protocol.md#Canonical lifecycle, identity, safety, reservation, access, and reconciliation algorithm / 1. Required platform objects / ReleaseApprovalFreeze",
  },
  {
    canonicalName: "ReleaseTrustFreezeVerdict",
    objectKind: "witness",
    boundedContext: "foundation_identity_access",
    authoritativeOwner: "Identity and access control",
    sourceRef:
      "phase-0-the-foundation-protocol.md#Canonical lifecycle, identity, safety, reservation, access, and reconciliation algorithm / 1. Required platform objects / ReleaseTrustFreezeVerdict",
  },
  {
    canonicalName: "RouteFreezeDisposition",
    objectKind: "record",
    boundedContext: "foundation_identity_access",
    authoritativeOwner: "Identity and access control",
    sourceRef:
      "phase-0-the-foundation-protocol.md#Canonical lifecycle, identity, safety, reservation, access, and reconciliation algorithm / 1. Required platform objects / RouteFreezeDisposition",
  },
  {
    canonicalName: "SessionGovernor",
    objectKind: "other",
    boundedContext: "foundation_identity_access",
    authoritativeOwner: "Identity and access control",
    sourceRef:
      "phase-0-the-foundation-protocol.md#Canonical lifecycle, identity, safety, reservation, access, and reconciliation algorithm / 2. Required platform services / SessionGovernor",
  },
  {
    canonicalName: "TelephonyContinuationEligibility",
    objectKind: "other",
    boundedContext: "foundation_identity_access",
    authoritativeOwner: "Identity and access control",
    sourceRef:
      "phase-0-the-foundation-protocol.md#Canonical lifecycle, identity, safety, reservation, access, and reconciliation algorithm / 1. Required platform objects / TelephonyContinuationEligibility",
  },
  {
    canonicalName: "VisibilityPolicyCompiler",
    objectKind: "other",
    boundedContext: "foundation_identity_access",
    authoritativeOwner: "Identity and access control",
    sourceRef:
      "phase-0-the-foundation-protocol.md#Canonical lifecycle, identity, safety, reservation, access, and reconciliation algorithm / 2. Required platform services / VisibilityPolicyCompiler",
  },
  {
    canonicalName: "VisibilityProjectionPolicy",
    objectKind: "policy",
    boundedContext: "foundation_identity_access",
    authoritativeOwner: "Identity and access control",
    sourceRef:
      "phase-0-the-foundation-protocol.md#Canonical lifecycle, identity, safety, reservation, access, and reconciliation algorithm / 1. Required platform objects / VisibilityProjectionPolicy",
  },
] as const satisfies readonly OwnedObjectFamily[];

export const projectionFamilies = [
  {
    canonicalName: "AdminResolutionExperienceProjection",
    objectKind: "projection",
    boundedContext: "foundation_identity_access",
    authoritativeOwner: "Identity and access control",
    sourceRef:
      "phase-0-the-foundation-protocol.md#Canonical lifecycle, identity, safety, reservation, access, and reconciliation algorithm / 1. Required platform objects / AdminResolutionExperienceProjection",
  },
  {
    canonicalName: "ArtifactModeTruthProjection",
    objectKind: "projection",
    boundedContext: "foundation_identity_access",
    authoritativeOwner: "Identity and access control",
    sourceRef:
      "phase-0-the-foundation-protocol.md#Canonical lifecycle, identity, safety, reservation, access, and reconciliation algorithm / 1. Required platform objects / ArtifactModeTruthProjection",
  },
  {
    canonicalName: "BookingConfirmationTruthProjection",
    objectKind: "projection",
    boundedContext: "foundation_identity_access",
    authoritativeOwner: "Identity and access control",
    sourceRef:
      "phase-0-the-foundation-protocol.md#Canonical lifecycle, identity, safety, reservation, access, and reconciliation algorithm / 1. Required platform objects / BookingConfirmationTruthProjection",
  },
  {
    canonicalName: "PatientDegradedModeProjection",
    objectKind: "projection",
    boundedContext: "foundation_identity_access",
    authoritativeOwner: "Identity and access control",
    sourceRef:
      "phase-0-the-foundation-protocol.md#Canonical lifecycle, identity, safety, reservation, access, and reconciliation algorithm / 1. Required platform objects / PatientDegradedModeProjection",
  },
  {
    canonicalName: "PatientEmbeddedSessionProjection",
    objectKind: "projection",
    boundedContext: "foundation_identity_access",
    authoritativeOwner: "Identity and access control",
    sourceRef:
      "phase-0-the-foundation-protocol.md#Canonical lifecycle, identity, safety, reservation, access, and reconciliation algorithm / 1. Required platform objects / PatientEmbeddedSessionProjection",
  },
  {
    canonicalName: "PatientShellConsistencyProjection",
    objectKind: "projection",
    boundedContext: "foundation_identity_access",
    authoritativeOwner: "Identity and access control",
    sourceRef:
      "phase-0-the-foundation-protocol.md#Canonical lifecycle, identity, safety, reservation, access, and reconciliation algorithm / 1. Required platform objects / PatientShellConsistencyProjection",
  },
  {
    canonicalName: "PatientSpotlightDecisionProjection",
    objectKind: "projection",
    boundedContext: "foundation_identity_access",
    authoritativeOwner: "Identity and access control",
    sourceRef:
      "phase-0-the-foundation-protocol.md#Canonical lifecycle, identity, safety, reservation, access, and reconciliation algorithm / 1. Required platform objects / PatientSpotlightDecisionProjection",
  },
  {
    canonicalName: "ProjectionActionSet",
    objectKind: "other",
    boundedContext: "foundation_identity_access",
    authoritativeOwner: "Identity and access control",
    sourceRef:
      "phase-0-the-foundation-protocol.md#Canonical lifecycle, identity, safety, reservation, access, and reconciliation algorithm / 1. Required platform objects / ProjectionActionSet",
  },
  {
    canonicalName: "ReservationTruthProjection",
    objectKind: "projection",
    boundedContext: "foundation_identity_access",
    authoritativeOwner: "Identity and access control",
    sourceRef:
      "phase-0-the-foundation-protocol.md#Canonical lifecycle, identity, safety, reservation, access, and reconciliation algorithm / 1. Required platform objects / ReservationTruthProjection",
  },
  {
    canonicalName: "SelfCareExperienceProjection",
    objectKind: "projection",
    boundedContext: "foundation_identity_access",
    authoritativeOwner: "Identity and access control",
    sourceRef:
      "phase-0-the-foundation-protocol.md#Canonical lifecycle, identity, safety, reservation, access, and reconciliation algorithm / 1. Required platform objects / SelfCareExperienceProjection",
  },
  {
    canonicalName: "StaffWorkspaceConsistencyProjection",
    objectKind: "projection",
    boundedContext: "foundation_identity_access",
    authoritativeOwner: "Identity and access control",
    sourceRef:
      "phase-0-the-foundation-protocol.md#Canonical lifecycle, identity, safety, reservation, access, and reconciliation algorithm / 1. Required platform objects / StaffWorkspaceConsistencyProjection",
  },
  {
    canonicalName: "VisibilityProjectionPolicy",
    objectKind: "policy",
    boundedContext: "foundation_identity_access",
    authoritativeOwner: "Identity and access control",
    sourceRef:
      "phase-0-the-foundation-protocol.md#Canonical lifecycle, identity, safety, reservation, access, and reconciliation algorithm / 1. Required platform objects / VisibilityProjectionPolicy",
  },
  {
    canonicalName: "WorkspaceSliceTrustProjection",
    objectKind: "projection",
    boundedContext: "foundation_identity_access",
    authoritativeOwner: "Identity and access control",
    sourceRef:
      "phase-0-the-foundation-protocol.md#Canonical lifecycle, identity, safety, reservation, access, and reconciliation algorithm / 1. Required platform objects / WorkspaceSliceTrustProjection",
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

export * from "./identity-access-backbone";
export * from "./command-settlement-backbone";
export * from "./release-trust-freeze-backbone";
export * from "./lease-fence-command-backbone";
export * from "./lifecycle-coordinator-backbone";
export * from "./request-closure-backbone";
export * from "./identity-repair-backbone";
export * from "./duplicate-review-backbone";
export * from "./reservation-confirmation-backbone";
export * from "./reservation-queue-control-backbone";
export * from "./reachability-backbone";
export * from "./replay-collision-backbone";
export * from "./submission-lineage-backbone";
export * from "./draft-session-autosave-backbone";
export * from "./workspace-consistency-projection-backbone";
