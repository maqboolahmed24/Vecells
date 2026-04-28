export * from "./phase5-hub-case-kernel";
export * from "./phase5-acting-context-visibility-kernel";
export * from "./phase5-enhanced-access-policy-engine";
export * from "./phase5-network-capacity-pipeline";
export * from "./phase5-hub-queue-engine";
export * from "./phase5-alternative-offer-engine";
export * from "./phase5-hub-commit-engine";
export * from "./phase5-practice-continuity-engine";
export * from "./phase5-hub-fallback-engine";
export * from "./phase5-reminders-manage-visibility-engine";
export * from "./phase5-hub-background-integrity-engine";

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
  artifactId: "package_domains_hub_coordination",
  packageName: "@vecells/domain-hub-coordination",
  packageRole: "domain",
  ownerContextCode: "hub_coordination",
  ownerContextLabel: "Hub Coordination",
  purpose: "Canonical package home for the Hub Coordination bounded context.",
  versioningPosture:
    "Workspace-private domain boundary. Public exports are explicit and additive-first.",
  allowedDependencies: [
    "packages/domain-kernel",
    "packages/event-contracts",
    "packages/authz-policy",
    "packages/observability",
    "packages/domains/identity_access public exports",
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
    "PHASE5_320_HUB_OFFERS_TO_IDENTITY_ACCESS_PUBLIC_EXPORTS_ONLY",
  ],
  objectFamilyCount: 58,
  contractFamilyCount: 0,
  sourceContexts: ["hub_coordination"],
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
    canonicalName: "ActingContext",
    objectKind: "other",
    boundedContext: "hub_coordination",
    authoritativeOwner: "Hub coordination domain",
    sourceRef:
      "phase-5-the-network-horizon.md#5B. Staff identity, organisation boundaries, and acting context / Backend work / ActingContext",
  },
  {
    canonicalName: "AlternativeOfferEntry",
    objectKind: "other",
    boundedContext: "hub_coordination",
    authoritativeOwner: "Hub coordination domain",
    sourceRef:
      "phase-5-the-network-horizon.md#5A. Network coordination contract, case model, and state machine / Backend work / AlternativeOfferEntry",
  },
  {
    canonicalName: "AlternativeOfferFallbackCard",
    objectKind: "other",
    boundedContext: "hub_coordination",
    authoritativeOwner: "Hub coordination domain",
    sourceRef:
      "phase-5-the-network-horizon.md#5A. Network coordination contract, case model, and state machine / Backend work / AlternativeOfferFallbackCard",
  },
  {
    canonicalName: "AlternativeOfferOptimisationPlan",
    objectKind: "other",
    boundedContext: "hub_coordination",
    authoritativeOwner: "Hub coordination domain",
    sourceRef:
      "phase-5-the-network-horizon.md#5A. Network coordination contract, case model, and state machine / Backend work / AlternativeOfferOptimisationPlan",
  },
  {
    canonicalName: "AlternativeOfferRegenerationSettlement",
    objectKind: "settlement",
    boundedContext: "hub_coordination",
    authoritativeOwner: "Hub coordination domain",
    sourceRef:
      "phase-5-the-network-horizon.md#5A. Network coordination contract, case model, and state machine / Backend work / AlternativeOfferRegenerationSettlement",
  },
  {
    canonicalName: "AlternativeOfferSession",
    objectKind: "other",
    boundedContext: "hub_coordination",
    authoritativeOwner: "Hub coordination domain",
    sourceRef:
      "phase-5-the-network-horizon.md#5A. Network coordination contract, case model, and state machine / Backend work / AlternativeOfferSession",
  },
  {
    canonicalName: "CallbackFallbackRecord",
    objectKind: "record",
    boundedContext: "hub_coordination",
    authoritativeOwner: "Hub coordination domain",
    sourceRef:
      "phase-5-the-network-horizon.md#5G. No-slot handling, urgent bounce-back, callback fallback, and reopen mechanics / Backend work / CallbackFallbackRecord",
  },
  {
    canonicalName: "CancellationMakeUpLedger",
    objectKind: "other",
    boundedContext: "hub_coordination",
    authoritativeOwner: "Hub coordination domain",
    sourceRef:
      "phase-5-the-network-horizon.md#5C. Enhanced Access policy engine and network capacity ingestion / Backend work / CancellationMakeUpLedger",
  },
  {
    canonicalName: "CoordinationOwnership",
    objectKind: "other",
    boundedContext: "hub_coordination",
    authoritativeOwner: "Hub coordination domain",
    sourceRef:
      "phase-5-the-network-horizon.md#5B. Staff identity, organisation boundaries, and acting context / Backend work / CoordinationOwnership",
  },
  {
    canonicalName: "CrossOrganisationVisibilityEnvelope",
    objectKind: "record",
    boundedContext: "hub_coordination",
    authoritativeOwner: "Hub coordination domain",
    sourceRef:
      "phase-5-the-network-horizon.md#5B. Staff identity, organisation boundaries, and acting context / Backend work / CrossOrganisationVisibilityEnvelope",
  },
  {
    canonicalName: "CrossSiteDecisionPlan",
    objectKind: "other",
    boundedContext: "hub_coordination",
    authoritativeOwner: "Hub coordination domain",
    sourceRef:
      "phase-5-the-network-horizon.md#5A. Network coordination contract, case model, and state machine / Backend work / CrossSiteDecisionPlan",
  },
  {
    canonicalName: "EnhancedAccessMinutesLedger",
    objectKind: "other",
    boundedContext: "hub_coordination",
    authoritativeOwner: "Hub coordination domain",
    sourceRef:
      "phase-5-the-network-horizon.md#5C. Enhanced Access policy engine and network capacity ingestion / Backend work / EnhancedAccessMinutesLedger",
  },
  {
    canonicalName: "EnhancedAccessPolicy",
    objectKind: "policy",
    boundedContext: "hub_coordination",
    authoritativeOwner: "Hub coordination domain",
    sourceRef:
      "phase-5-the-network-horizon.md#5A. Network coordination contract, case model, and state machine / Backend work / EnhancedAccessPolicy",
  },
  {
    canonicalName: "HubActionRecord",
    objectKind: "record",
    boundedContext: "hub_coordination",
    authoritativeOwner: "Hub coordination domain",
    sourceRef:
      "phase-5-the-network-horizon.md#5F. Native hub booking commit, practice continuity, and cross-org messaging / Backend work / HubActionRecord",
  },
  {
    canonicalName: "HubAppointmentRecord",
    objectKind: "record",
    boundedContext: "hub_coordination",
    authoritativeOwner: "Hub coordination domain",
    sourceRef:
      "phase-5-the-network-horizon.md#5A. Network coordination contract, case model, and state machine / Backend work / HubAppointmentRecord",
  },
  {
    canonicalName: "HubBookingEvidenceBundle",
    objectKind: "bundle",
    boundedContext: "hub_coordination",
    authoritativeOwner: "Hub coordination domain",
    sourceRef:
      "phase-5-the-network-horizon.md#5A. Network coordination contract, case model, and state machine / Backend work / HubBookingEvidenceBundle",
  },
  {
    canonicalName: "HubCapacityIngestionPolicy",
    objectKind: "policy",
    boundedContext: "hub_coordination",
    authoritativeOwner: "Hub coordination domain",
    sourceRef:
      "phase-5-the-network-horizon.md#5A. Network coordination contract, case model, and state machine / Backend work / HubCapacityIngestionPolicy",
  },
  {
    canonicalName: "HubCaseConsoleProjection",
    objectKind: "projection",
    boundedContext: "hub_coordination",
    authoritativeOwner: "Hub coordination domain",
    sourceRef:
      "phase-5-the-network-horizon.md#5D. Coordination queue, candidate ranking, and SLA engine / Backend work / HubCaseConsoleProjection",
  },
  {
    canonicalName: "HubCommitAttempt",
    objectKind: "record",
    boundedContext: "hub_coordination",
    authoritativeOwner: "Hub coordination domain",
    sourceRef:
      "phase-5-the-network-horizon.md#5F. Native hub booking commit, practice continuity, and cross-org messaging / Backend work / HubCommitAttempt",
  },
  {
    canonicalName: "HubCommitSettlement",
    objectKind: "settlement",
    boundedContext: "hub_coordination",
    authoritativeOwner: "Hub coordination domain",
    sourceRef:
      "phase-5-the-network-horizon.md#5F. Native hub booking commit, practice continuity, and cross-org messaging / Backend work / HubCommitSettlement",
  },
  {
    canonicalName: "HubConsoleConsistencyProjection",
    objectKind: "projection",
    boundedContext: "hub_coordination",
    authoritativeOwner: "Hub coordination domain",
    sourceRef:
      "phase-5-the-network-horizon.md#5D. Coordination queue, candidate ranking, and SLA engine / Backend work / HubConsoleConsistencyProjection",
  },
  {
    canonicalName: "HubContinuityEvidenceProjection",
    objectKind: "projection",
    boundedContext: "hub_coordination",
    authoritativeOwner: "Hub coordination domain",
    sourceRef:
      "phase-5-the-network-horizon.md#5F. Native hub booking commit, practice continuity, and cross-org messaging / Backend work / HubContinuityEvidenceProjection",
  },
  {
    canonicalName: "HubCoordinationCase",
    objectKind: "case",
    boundedContext: "hub_coordination",
    authoritativeOwner: "Hub coordination domain",
    sourceRef:
      "phase-5-the-network-horizon.md#5A. Network coordination contract, case model, and state machine / Backend work / HubCoordinationCase",
  },
  {
    canonicalName: "HubCoordinationException",
    objectKind: "other",
    boundedContext: "hub_coordination",
    authoritativeOwner: "Hub coordination domain",
    sourceRef:
      "phase-5-the-network-horizon.md#5G. No-slot handling, urgent bounce-back, callback fallback, and reopen mechanics / Backend work / HubCoordinationException",
  },
  {
    canonicalName: "HubExceptionAuditRow",
    objectKind: "record",
    boundedContext: "hub_coordination",
    authoritativeOwner: "Hub coordination domain",
    sourceRef:
      "phase-5-the-network-horizon.md#5F. Native hub booking commit, practice continuity, and cross-org messaging / Backend work / typed hub exception processing",
  },
  {
    canonicalName: "HubExceptionWorkItem",
    objectKind: "record",
    boundedContext: "hub_coordination",
    authoritativeOwner: "Hub coordination domain",
    sourceRef:
      "phase-5-the-network-horizon.md#5F. Native hub booking commit, practice continuity, and cross-org messaging / Backend work / typed hub exception processing",
  },
  {
    canonicalName: "HubEscalationBannerProjection",
    objectKind: "projection",
    boundedContext: "hub_coordination",
    authoritativeOwner: "Hub coordination domain",
    sourceRef:
      "phase-5-the-network-horizon.md#5D. Coordination queue, candidate ranking, and SLA engine / Backend work / HubEscalationBannerProjection",
  },
  {
    canonicalName: "HubFallbackRecord",
    objectKind: "record",
    boundedContext: "hub_coordination",
    authoritativeOwner: "Hub coordination domain",
    sourceRef:
      "phase-5-the-network-horizon.md#5A. Network coordination contract, case model, and state machine / Backend work / HubFallbackRecord",
  },
  {
    canonicalName: "HubManageSettlement",
    objectKind: "settlement",
    boundedContext: "hub_coordination",
    authoritativeOwner: "Hub coordination domain",
    sourceRef:
      "phase-5-the-network-horizon.md#5H. Patient communications, network reminders, manage flows, and practice visibility / Backend work / HubManageSettlement",
  },
  {
    canonicalName: "HubProjectionBackfillCursor",
    objectKind: "record",
    boundedContext: "hub_coordination",
    authoritativeOwner: "Hub coordination domain",
    sourceRef:
      "phase-5-the-network-horizon.md#5F. Native hub booking commit, practice continuity, and cross-org messaging / Backend work / projection backfill",
  },
  {
    canonicalName: "HubCommitReconciliationRecord",
    objectKind: "record",
    boundedContext: "hub_coordination",
    authoritativeOwner: "Hub coordination domain",
    sourceRef:
      "phase-5-the-network-horizon.md#5F. Native hub booking commit, practice continuity, and cross-org messaging / Backend work / reconciliation worker",
  },
  {
    canonicalName: "HubImportedConfirmationCorrelation",
    objectKind: "record",
    boundedContext: "hub_coordination",
    authoritativeOwner: "Hub coordination domain",
    sourceRef:
      "phase-5-the-network-horizon.md#5F. Native hub booking commit, practice continuity, and cross-org messaging / Backend work / imported confirmation correlation",
  },
  {
    canonicalName: "HubOfferToConfirmationTruthProjection",
    objectKind: "projection",
    boundedContext: "hub_coordination",
    authoritativeOwner: "Hub coordination domain",
    sourceRef:
      "phase-5-the-network-horizon.md#5A. Network coordination contract, case model, and state machine / Backend work / HubOfferToConfirmationTruthProjection",
  },
  {
    canonicalName: "HubOptionCardProjection",
    objectKind: "projection",
    boundedContext: "hub_coordination",
    authoritativeOwner: "Hub coordination domain",
    sourceRef:
      "phase-5-the-network-horizon.md#5D. Coordination queue, candidate ranking, and SLA engine / Backend work / HubOptionCardProjection",
  },
  {
    canonicalName: "HubOwnershipTransition",
    objectKind: "other",
    boundedContext: "hub_coordination",
    authoritativeOwner: "Hub coordination domain",
    sourceRef:
      "phase-5-the-network-horizon.md#5A. Network coordination contract, case model, and state machine / Backend work / HubOwnershipTransition",
  },
  {
    canonicalName: "HubPostureProjection",
    objectKind: "projection",
    boundedContext: "hub_coordination",
    authoritativeOwner: "Hub coordination domain",
    sourceRef:
      "phase-5-the-network-horizon.md#5D. Coordination queue, candidate ranking, and SLA engine / Backend work / HubPostureProjection",
  },
  {
    canonicalName: "HubPracticeVisibilityPolicy",
    objectKind: "policy",
    boundedContext: "hub_coordination",
    authoritativeOwner: "Hub coordination domain",
    sourceRef:
      "phase-5-the-network-horizon.md#5A. Network coordination contract, case model, and state machine / Backend work / HubPracticeVisibilityPolicy",
  },
  {
    canonicalName: "HubQueueWorkbenchProjection",
    objectKind: "projection",
    boundedContext: "hub_coordination",
    authoritativeOwner: "Hub coordination domain",
    sourceRef:
      "phase-5-the-network-horizon.md#5D. Coordination queue, candidate ranking, and SLA engine / Backend work / HubQueueWorkbenchProjection",
  },
  {
    canonicalName: "HubReturnToPracticeRecord",
    objectKind: "record",
    boundedContext: "hub_coordination",
    authoritativeOwner: "Hub coordination domain",
    sourceRef:
      "phase-5-the-network-horizon.md#5G. No-slot handling, urgent bounce-back, callback fallback, and reopen mechanics / Backend work / HubReturnToPracticeRecord",
  },
  {
    canonicalName: "HubRoutingPolicyPack",
    objectKind: "policy",
    boundedContext: "hub_coordination",
    authoritativeOwner: "Hub coordination domain",
    sourceRef:
      "phase-5-the-network-horizon.md#5A. Network coordination contract, case model, and state machine / Backend work / HubRoutingPolicyPack",
  },
  {
    canonicalName: "HubServiceObligationPolicy",
    objectKind: "policy",
    boundedContext: "hub_coordination",
    authoritativeOwner: "Hub coordination domain",
    sourceRef:
      "phase-5-the-network-horizon.md#5A. Network coordination contract, case model, and state machine / Backend work / HubServiceObligationPolicy",
  },
  {
    canonicalName: "HubSupplierMirrorState",
    objectKind: "descriptor",
    boundedContext: "hub_coordination",
    authoritativeOwner: "Hub coordination domain",
    sourceRef:
      "phase-5-the-network-horizon.md#5F. Native hub booking commit, practice continuity, and cross-org messaging / Backend work / HubSupplierMirrorState",
  },
  {
    canonicalName: "HubSupplierDriftHook",
    objectKind: "record",
    boundedContext: "hub_coordination",
    authoritativeOwner: "Hub coordination domain",
    sourceRef:
      "phase-5-the-network-horizon.md#5F. Native hub booking commit, practice continuity, and cross-org messaging / Backend work / HubSupplierMirrorState",
  },
  {
    canonicalName: "HubSupplierMirrorCheckpoint",
    objectKind: "record",
    boundedContext: "hub_coordination",
    authoritativeOwner: "Hub coordination domain",
    sourceRef:
      "phase-5-the-network-horizon.md#5F. Native hub booking commit, practice continuity, and cross-org messaging / Backend work / HubSupplierMirrorState",
  },
  {
    canonicalName: "HubSupplierObservation",
    objectKind: "record",
    boundedContext: "hub_coordination",
    authoritativeOwner: "Hub coordination domain",
    sourceRef:
      "phase-5-the-network-horizon.md#5F. Native hub booking commit, practice continuity, and cross-org messaging / Backend work / HubSupplierMirrorState",
  },
  {
    canonicalName: "HubReconciliationWorkLease",
    objectKind: "record",
    boundedContext: "hub_coordination",
    authoritativeOwner: "Hub coordination domain",
    sourceRef:
      "phase-5-the-network-horizon.md#5F. Native hub booking commit, practice continuity, and cross-org messaging / Backend work / reconciliation worker",
  },
  {
    canonicalName: "HubVarianceWindowPolicy",
    objectKind: "policy",
    boundedContext: "hub_coordination",
    authoritativeOwner: "Hub coordination domain",
    sourceRef:
      "phase-5-the-network-horizon.md#5A. Network coordination contract, case model, and state machine / Backend work / HubVarianceWindowPolicy",
  },
  {
    canonicalName: "NetworkBookingRequest",
    objectKind: "other",
    boundedContext: "hub_coordination",
    authoritativeOwner: "Hub coordination domain",
    sourceRef:
      "phase-5-the-network-horizon.md#5A. Network coordination contract, case model, and state machine / Backend work / NetworkBookingRequest",
  },
  {
    canonicalName: "NetworkCandidateSnapshot",
    objectKind: "record",
    boundedContext: "hub_coordination",
    authoritativeOwner: "Hub coordination domain",
    sourceRef:
      "phase-5-the-network-horizon.md#5A. Network coordination contract, case model, and state machine / Backend work / NetworkCandidateSnapshot",
  },
  {
    canonicalName: "NetworkCoordinationPolicyEvaluation",
    objectKind: "record",
    boundedContext: "hub_coordination",
    authoritativeOwner: "Hub coordination domain",
    sourceRef:
      "phase-5-the-network-horizon.md#5A. Network coordination contract, case model, and state machine / Backend work / NetworkCoordinationPolicyEvaluation",
  },
  {
    canonicalName: "NetworkManageCapabilities",
    objectKind: "other",
    boundedContext: "hub_coordination",
    authoritativeOwner: "Hub coordination domain",
    sourceRef:
      "phase-5-the-network-horizon.md#5H. Patient communications, network reminders, manage flows, and practice visibility / Backend work / NetworkManageCapabilities",
  },
  {
    canonicalName: "NetworkReminderPlan",
    objectKind: "other",
    boundedContext: "hub_coordination",
    authoritativeOwner: "Hub coordination domain",
    sourceRef:
      "phase-5-the-network-horizon.md#5H. Patient communications, network reminders, manage flows, and practice visibility / Backend work / NetworkReminderPlan",
  },
  {
    canonicalName: "NetworkSlotCandidate",
    objectKind: "other",
    boundedContext: "hub_coordination",
    authoritativeOwner: "Hub coordination domain",
    sourceRef:
      "phase-5-the-network-horizon.md#5A. Network coordination contract, case model, and state machine / Backend work / NetworkSlotCandidate",
  },
  {
    canonicalName: "PracticeAcknowledgementRecord",
    objectKind: "record",
    boundedContext: "hub_coordination",
    authoritativeOwner: "Hub coordination domain",
    sourceRef:
      "phase-5-the-network-horizon.md#5A. Network coordination contract, case model, and state machine / Backend work / PracticeAcknowledgementRecord",
  },
  {
    canonicalName: "PracticeContinuityMessage",
    objectKind: "other",
    boundedContext: "hub_coordination",
    authoritativeOwner: "Hub coordination domain",
    sourceRef:
      "phase-5-the-network-horizon.md#5F. Native hub booking commit, practice continuity, and cross-org messaging / Backend work / PracticeContinuityMessage",
  },
  {
    canonicalName: "PracticeVisibilityDeltaRecord",
    objectKind: "record",
    boundedContext: "hub_coordination",
    authoritativeOwner: "Hub coordination domain",
    sourceRef:
      "phase-5-the-network-horizon.md#5H. Patient communications, network reminders, manage flows, and practice visibility / Backend work / PracticeVisibilityDeltaRecord",
  },
  {
    canonicalName: "PracticeVisibilityProjection",
    objectKind: "projection",
    boundedContext: "hub_coordination",
    authoritativeOwner: "Hub coordination domain",
    sourceRef:
      "phase-5-the-network-horizon.md#5H. Patient communications, network reminders, manage flows, and practice visibility / Backend work / PracticeVisibilityProjection",
  },
  {
    canonicalName: "StaffIdentityContext",
    objectKind: "other",
    boundedContext: "hub_coordination",
    authoritativeOwner: "Hub coordination domain",
    sourceRef:
      "phase-5-the-network-horizon.md#5B. Staff identity, organisation boundaries, and acting context / Backend work / StaffIdentityContext",
  },
] as const satisfies readonly OwnedObjectFamily[];

export const aggregateFamilies = [
  {
    canonicalName: "AlternativeOfferSession",
    objectKind: "other",
    boundedContext: "hub_coordination",
    authoritativeOwner: "Hub coordination domain",
    sourceRef:
      "phase-5-the-network-horizon.md#5A. Network coordination contract, case model, and state machine / Backend work / AlternativeOfferSession",
  },
  {
    canonicalName: "HubCaseConsoleProjection",
    objectKind: "projection",
    boundedContext: "hub_coordination",
    authoritativeOwner: "Hub coordination domain",
    sourceRef:
      "phase-5-the-network-horizon.md#5D. Coordination queue, candidate ranking, and SLA engine / Backend work / HubCaseConsoleProjection",
  },
  {
    canonicalName: "HubCoordinationCase",
    objectKind: "case",
    boundedContext: "hub_coordination",
    authoritativeOwner: "Hub coordination domain",
    sourceRef:
      "phase-5-the-network-horizon.md#5A. Network coordination contract, case model, and state machine / Backend work / HubCoordinationCase",
  },
] as const satisfies readonly OwnedObjectFamily[];

export const domainServiceFamilies = [
  {
    canonicalName: "AlternativeOfferOptimisationEngine",
    objectKind: "other",
    boundedContext: "hub_coordination",
    authoritativeOwner: "Hub coordination domain",
    sourceRef:
      "phase-5-the-network-horizon.md#5E. Alternative offers, patient choice, and network-facing UX / Backend work / alternative-offer optimisation engine",
  },
  {
    canonicalName: "HubCommitOrchestrationEngine",
    objectKind: "other",
    boundedContext: "hub_coordination",
    authoritativeOwner: "Hub coordination domain",
    sourceRef:
      "phase-5-the-network-horizon.md#5F. Native hub booking commit, practice continuity, and cross-org messaging / Backend work / HubBookingCommit flow",
  },
  {
    canonicalName: "HubFallbackDecisionEngine",
    objectKind: "other",
    boundedContext: "hub_coordination",
    authoritativeOwner: "Hub coordination domain",
    sourceRef:
      "phase-5-the-network-horizon.md#5G. No-slot handling, urgent bounce-back, callback fallback, and reopen mechanics / Backend work / fallback decision engine",
  },
  {
    canonicalName: "HubQueueRankingEngine",
    objectKind: "other",
    boundedContext: "hub_coordination",
    authoritativeOwner: "Hub coordination domain",
    sourceRef:
      "phase-5-the-network-horizon.md#5D. Coordination queue, candidate ranking, and SLA engine / Backend work / queue risk-ranking engine",
  },
  {
    canonicalName: "HubServiceObligationPolicy",
    objectKind: "policy",
    boundedContext: "hub_coordination",
    authoritativeOwner: "Hub coordination domain",
    sourceRef:
      "phase-5-the-network-horizon.md#5A. Network coordination contract, case model, and state machine / Backend work / HubServiceObligationPolicy",
  },
  {
    canonicalName: "ActingContextEnvelope",
    objectKind: "other",
    boundedContext: "hub_coordination",
    authoritativeOwner: "Hub coordination domain",
    sourceRef:
      "phase-5-the-network-horizon.md#5B. Staff identity, organisation boundaries, and acting context / Backend work / ActingContext",
  },
  {
    canonicalName: "VisibilityTierEnforcement",
    objectKind: "other",
    boundedContext: "hub_coordination",
    authoritativeOwner: "Hub coordination domain",
    sourceRef:
      "phase-5-the-network-horizon.md#5B. Staff identity, organisation boundaries, and acting context / Backend work / CrossOrganisationVisibilityEnvelope",
  },
  {
    canonicalName: "MinimumNecessaryProjectionGuard",
    objectKind: "other",
    boundedContext: "hub_coordination",
    authoritativeOwner: "Hub coordination domain",
    sourceRef:
      "phase-0-the-foundation-protocol.md#MinimumNecessaryContract",
  },
  {
    canonicalName: "NetworkReminderManageVisibilityEngine",
    objectKind: "other",
    boundedContext: "hub_coordination",
    authoritativeOwner: "Hub coordination domain",
    sourceRef:
      "phase-5-the-network-horizon.md#5H. Patient communications, network reminders, manage flows, and practice visibility / Backend work / reminder, manage, and practice-visibility engine",
  },
  {
    canonicalName: "HubBackgroundIntegrityEngine",
    objectKind: "other",
    boundedContext: "hub_coordination",
    authoritativeOwner: "Hub coordination domain",
    sourceRef:
      "phase-5-the-network-horizon.md#5F. Native hub booking commit, practice continuity, and cross-org messaging / Backend work / reconciliation, supplier mirror, and exception workers",
  },
] as const satisfies readonly OwnedObjectFamily[];

export const eventFamilies = [] as const satisfies readonly OwnedObjectFamily[];

export const policyFamilies = [
  {
    canonicalName: "EnhancedAccessPolicy",
    objectKind: "policy",
    boundedContext: "hub_coordination",
    authoritativeOwner: "Hub coordination domain",
    sourceRef:
      "phase-5-the-network-horizon.md#5A. Network coordination contract, case model, and state machine / Backend work / EnhancedAccessPolicy",
  },
  {
    canonicalName: "HubCapacityIngestionPolicy",
    objectKind: "policy",
    boundedContext: "hub_coordination",
    authoritativeOwner: "Hub coordination domain",
    sourceRef:
      "phase-5-the-network-horizon.md#5A. Network coordination contract, case model, and state machine / Backend work / HubCapacityIngestionPolicy",
  },
  {
    canonicalName: "HubPracticeVisibilityPolicy",
    objectKind: "policy",
    boundedContext: "hub_coordination",
    authoritativeOwner: "Hub coordination domain",
    sourceRef:
      "phase-5-the-network-horizon.md#5A. Network coordination contract, case model, and state machine / Backend work / HubPracticeVisibilityPolicy",
  },
  {
    canonicalName: "HubRoutingPolicyPack",
    objectKind: "policy",
    boundedContext: "hub_coordination",
    authoritativeOwner: "Hub coordination domain",
    sourceRef:
      "phase-5-the-network-horizon.md#5A. Network coordination contract, case model, and state machine / Backend work / HubRoutingPolicyPack",
  },
  {
    canonicalName: "HubServiceObligationPolicy",
    objectKind: "policy",
    boundedContext: "hub_coordination",
    authoritativeOwner: "Hub coordination domain",
    sourceRef:
      "phase-5-the-network-horizon.md#5A. Network coordination contract, case model, and state machine / Backend work / HubServiceObligationPolicy",
  },
  {
    canonicalName: "HubVarianceWindowPolicy",
    objectKind: "policy",
    boundedContext: "hub_coordination",
    authoritativeOwner: "Hub coordination domain",
    sourceRef:
      "phase-5-the-network-horizon.md#5A. Network coordination contract, case model, and state machine / Backend work / HubVarianceWindowPolicy",
  },
  {
    canonicalName: "NetworkCoordinationPolicyEvaluation",
    objectKind: "record",
    boundedContext: "hub_coordination",
    authoritativeOwner: "Hub coordination domain",
    sourceRef:
      "phase-5-the-network-horizon.md#5A. Network coordination contract, case model, and state machine / Backend work / NetworkCoordinationPolicyEvaluation",
  },
] as const satisfies readonly OwnedObjectFamily[];

export const projectionFamilies = [
  {
    canonicalName: "HubCaseConsoleProjection",
    objectKind: "projection",
    boundedContext: "hub_coordination",
    authoritativeOwner: "Hub coordination domain",
    sourceRef:
      "phase-5-the-network-horizon.md#5D. Coordination queue, candidate ranking, and SLA engine / Backend work / HubCaseConsoleProjection",
  },
  {
    canonicalName: "HubConsoleConsistencyProjection",
    objectKind: "projection",
    boundedContext: "hub_coordination",
    authoritativeOwner: "Hub coordination domain",
    sourceRef:
      "phase-5-the-network-horizon.md#5D. Coordination queue, candidate ranking, and SLA engine / Backend work / HubConsoleConsistencyProjection",
  },
  {
    canonicalName: "HubContinuityEvidenceProjection",
    objectKind: "projection",
    boundedContext: "hub_coordination",
    authoritativeOwner: "Hub coordination domain",
    sourceRef:
      "phase-5-the-network-horizon.md#5F. Native hub booking commit, practice continuity, and cross-org messaging / Backend work / HubContinuityEvidenceProjection",
  },
  {
    canonicalName: "HubEscalationBannerProjection",
    objectKind: "projection",
    boundedContext: "hub_coordination",
    authoritativeOwner: "Hub coordination domain",
    sourceRef:
      "phase-5-the-network-horizon.md#5D. Coordination queue, candidate ranking, and SLA engine / Backend work / HubEscalationBannerProjection",
  },
  {
    canonicalName: "HubOfferToConfirmationTruthProjection",
    objectKind: "projection",
    boundedContext: "hub_coordination",
    authoritativeOwner: "Hub coordination domain",
    sourceRef:
      "phase-5-the-network-horizon.md#5A. Network coordination contract, case model, and state machine / Backend work / HubOfferToConfirmationTruthProjection",
  },
  {
    canonicalName: "HubOptionCardProjection",
    objectKind: "projection",
    boundedContext: "hub_coordination",
    authoritativeOwner: "Hub coordination domain",
    sourceRef:
      "phase-5-the-network-horizon.md#5D. Coordination queue, candidate ranking, and SLA engine / Backend work / HubOptionCardProjection",
  },
  {
    canonicalName: "HubPostureProjection",
    objectKind: "projection",
    boundedContext: "hub_coordination",
    authoritativeOwner: "Hub coordination domain",
    sourceRef:
      "phase-5-the-network-horizon.md#5D. Coordination queue, candidate ranking, and SLA engine / Backend work / HubPostureProjection",
  },
  {
    canonicalName: "HubQueueWorkbenchProjection",
    objectKind: "projection",
    boundedContext: "hub_coordination",
    authoritativeOwner: "Hub coordination domain",
    sourceRef:
      "phase-5-the-network-horizon.md#5D. Coordination queue, candidate ranking, and SLA engine / Backend work / HubQueueWorkbenchProjection",
  },
  {
    canonicalName: "PracticeVisibilityProjection",
    objectKind: "projection",
    boundedContext: "hub_coordination",
    authoritativeOwner: "Hub coordination domain",
    sourceRef:
      "phase-5-the-network-horizon.md#5H. Patient communications, network reminders, manage flows, and practice visibility / Backend work / PracticeVisibilityProjection",
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
