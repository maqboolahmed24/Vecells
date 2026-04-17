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
  artifactId: "package_domains_support",
  packageName: "@vecells/domain-support",
  packageRole: "domain",
  ownerContextCode: "support",
  ownerContextLabel: "Support",
  purpose: "Canonical package home for the Support bounded context.",
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
  objectFamilyCount: 88,
  contractFamilyCount: 0,
  sourceContexts: ["self_care_admin_resolution", "staff_support_operations"],
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
    canonicalName: "AdminResolutionActionRecord",
    objectKind: "record",
    boundedContext: "self_care_admin_resolution",
    authoritativeOwner: "Self-care and admin-resolution domain",
    sourceRef:
      "self-care-content-and-admin-resolution-blueprint.md#Admin-resolution domain / Core object / AdminResolutionActionRecord",
  },
  {
    canonicalName: "AdminResolutionCase",
    objectKind: "case",
    boundedContext: "self_care_admin_resolution",
    authoritativeOwner: "Self-care and admin-resolution domain",
    sourceRef:
      "phase-0-the-foundation-protocol.md#Canonical lifecycle, identity, safety, reservation, access, and reconciliation algorithm / 1. Required platform objects / AdminResolutionCase",
  },
  {
    canonicalName: "AdminResolutionCompletionArtifact",
    objectKind: "artifact",
    boundedContext: "self_care_admin_resolution",
    authoritativeOwner: "Self-care and admin-resolution domain",
    sourceRef:
      "self-care-content-and-admin-resolution-blueprint.md#Admin-resolution domain / Core object / AdminResolutionCompletionArtifact",
  },
  {
    canonicalName: "AdminResolutionDigest",
    objectKind: "digest",
    boundedContext: "staff_support_operations",
    authoritativeOwner: "Staff, support, and operations control",
    sourceRef:
      "staff-workspace-interface-architecture.md#Workspace projections and client state / AdminResolutionDigest",
  },
  {
    canonicalName: "AdminResolutionSubtypeProfile",
    objectKind: "descriptor",
    boundedContext: "self_care_admin_resolution",
    authoritativeOwner: "Self-care and admin-resolution domain",
    sourceRef:
      "self-care-content-and-admin-resolution-blueprint.md#Admin-resolution domain / Core object / AdminResolutionSubtypeProfile",
  },
  {
    canonicalName: "AdviceAdminReleaseWatch",
    objectKind: "other",
    boundedContext: "self_care_admin_resolution",
    authoritativeOwner: "Self-care and admin-resolution domain",
    sourceRef:
      "self-care-content-and-admin-resolution-blueprint.md#Self-care content governance / Suggested objects / AdviceAdminReleaseWatch",
  },
  {
    canonicalName: "AdviceBundleVersion",
    objectKind: "other",
    boundedContext: "self_care_admin_resolution",
    authoritativeOwner: "Self-care and admin-resolution domain",
    sourceRef:
      "self-care-content-and-admin-resolution-blueprint.md#Self-care content governance / Suggested objects / AdviceBundleVersion",
  },
  {
    canonicalName: "AdviceEligibilityGrant",
    objectKind: "grant",
    boundedContext: "self_care_admin_resolution",
    authoritativeOwner: "Self-care and admin-resolution domain",
    sourceRef:
      "self-care-content-and-admin-resolution-blueprint.md#Self-care content governance / Suggested objects / AdviceEligibilityGrant",
  },
  {
    canonicalName: "AdviceFollowUpWatchWindow",
    objectKind: "other",
    boundedContext: "self_care_admin_resolution",
    authoritativeOwner: "Self-care and admin-resolution domain",
    sourceRef:
      "self-care-content-and-admin-resolution-blueprint.md#Self-care content governance / Suggested objects / AdviceFollowUpWatchWindow",
  },
  {
    canonicalName: "AdviceSettlementDigest",
    objectKind: "digest",
    boundedContext: "staff_support_operations",
    authoritativeOwner: "Staff, support, and operations control",
    sourceRef:
      "staff-workspace-interface-architecture.md#Workspace projections and client state / AdviceSettlementDigest",
  },
  {
    canonicalName: "AdviceVariantSet",
    objectKind: "other",
    boundedContext: "self_care_admin_resolution",
    authoritativeOwner: "Self-care and admin-resolution domain",
    sourceRef:
      "self-care-content-and-admin-resolution-blueprint.md#Self-care content governance / Suggested objects / AdviceVariantSet",
  },
  {
    canonicalName: "ApprovalReviewFrame",
    objectKind: "other",
    boundedContext: "staff_support_operations",
    authoritativeOwner: "Staff, support, and operations control",
    sourceRef:
      "staff-workspace-interface-architecture.md#Workspace projections and client state / ApprovalReviewFrame",
  },
  {
    canonicalName: "AssistiveCompanionPresentationProfile",
    objectKind: "descriptor",
    boundedContext: "staff_support_operations",
    authoritativeOwner: "Staff, support, and operations control",
    sourceRef:
      "staff-workspace-interface-architecture.md#Design language: Quiet Clinical Mission Control / Assistive companion presentation profile / AssistiveCompanionPresentationProfile",
  },
  {
    canonicalName: "AssistiveSummaryStub",
    objectKind: "other",
    boundedContext: "staff_support_operations",
    authoritativeOwner: "Staff, support, and operations control",
    sourceRef:
      "staff-workspace-interface-architecture.md#Workspace projections and client state / AssistiveSummaryStub",
  },
  {
    canonicalName: "AssistiveWorkspaceStageBinding",
    objectKind: "descriptor",
    boundedContext: "staff_support_operations",
    authoritativeOwner: "Staff, support, and operations control",
    sourceRef:
      "staff-workspace-interface-architecture.md#Workspace projections and client state / AssistiveWorkspaceStageBinding",
  },
  {
    canonicalName: "IdentityCorrectionRequest",
    objectKind: "other",
    boundedContext: "staff_support_operations",
    authoritativeOwner: "Staff, support, and operations control",
    sourceRef:
      "staff-operations-and-support-blueprint.md#Support desk model / IdentityCorrectionRequest",
  },
  {
    canonicalName: "MedicationValidationCardProjection",
    objectKind: "projection",
    boundedContext: "staff_support_operations",
    authoritativeOwner: "Staff, support, and operations control",
    sourceRef:
      "pharmacy-console-frontend-architecture.md#Prescription validation architecture / 5. Medication line-item cards / MedicationValidationCardProjection",
  },
  {
    canonicalName: "MoreInfoStatusDigest",
    objectKind: "digest",
    boundedContext: "staff_support_operations",
    authoritativeOwner: "Staff, support, and operations control",
    sourceRef:
      "staff-workspace-interface-architecture.md#Workspace projections and client state / MoreInfoStatusDigest",
  },
  {
    canonicalName: "OperatorHandoffFrame",
    objectKind: "other",
    boundedContext: "staff_support_operations",
    authoritativeOwner: "Staff, support, and operations control",
    sourceRef:
      "staff-workspace-interface-architecture.md#Workspace projections and client state / OperatorHandoffFrame",
  },
  {
    canonicalName: "PharmacyActionSettlement",
    objectKind: "settlement",
    boundedContext: "staff_support_operations",
    authoritativeOwner: "Staff, support, and operations control",
    sourceRef:
      "pharmacy-console-frontend-architecture.md#Canonical shell model / PharmacyActionSettlement",
  },
  {
    canonicalName: "PharmacyCaseArtifactFrame",
    objectKind: "other",
    boundedContext: "staff_support_operations",
    authoritativeOwner: "Staff, support, and operations control",
    sourceRef:
      "pharmacy-console-frontend-architecture.md#Canonical shell model / PharmacyCaseArtifactFrame",
  },
  {
    canonicalName: "PharmacyCommandFenceSession",
    objectKind: "other",
    boundedContext: "staff_support_operations",
    authoritativeOwner: "Staff, support, and operations control",
    sourceRef:
      "pharmacy-console-frontend-architecture.md#Error prevention and safety protocol UX / 9. Command fences and override paths / PharmacyCommandFenceSession",
  },
  {
    canonicalName: "PharmacyConsoleContinuityEvidenceProjection",
    objectKind: "projection",
    boundedContext: "staff_support_operations",
    authoritativeOwner: "Staff, support, and operations control",
    sourceRef:
      "pharmacy-console-frontend-architecture.md#Canonical shell model / PharmacyConsoleContinuityEvidenceProjection",
  },
  {
    canonicalName: "PharmacyConsoleShell",
    objectKind: "other",
    boundedContext: "staff_support_operations",
    authoritativeOwner: "Staff, support, and operations control",
    sourceRef:
      "pharmacy-console-frontend-architecture.md#Canonical shell model / PharmacyConsoleShell",
  },
  {
    canonicalName: "PharmacyFenceImpactDigest",
    objectKind: "digest",
    boundedContext: "staff_support_operations",
    authoritativeOwner: "Staff, support, and operations control",
    sourceRef:
      "pharmacy-console-frontend-architecture.md#Error prevention and safety protocol UX / 9. Command fences and override paths / PharmacyFenceImpactDigest",
  },
  {
    canonicalName: "PharmacyFenceSettlementWindow",
    objectKind: "other",
    boundedContext: "staff_support_operations",
    authoritativeOwner: "Staff, support, and operations control",
    sourceRef:
      "pharmacy-console-frontend-architecture.md#Error prevention and safety protocol UX / 9. Command fences and override paths / PharmacyFenceSettlementWindow",
  },
  {
    canonicalName: "PharmacyHandoffWatchWindow",
    objectKind: "other",
    boundedContext: "staff_support_operations",
    authoritativeOwner: "Staff, support, and operations control",
    sourceRef:
      "pharmacy-console-frontend-architecture.md#Canonical shell model / PharmacyHandoffWatchWindow",
  },
  {
    canonicalName: "PharmacyMissionToken",
    objectKind: "token",
    boundedContext: "staff_support_operations",
    authoritativeOwner: "Staff, support, and operations control",
    sourceRef:
      "pharmacy-console-frontend-architecture.md#Canonical shell model / PharmacyMissionToken",
  },
  {
    canonicalName: "PharmacyOverrideAuthorityProof",
    objectKind: "other",
    boundedContext: "staff_support_operations",
    authoritativeOwner: "Staff, support, and operations control",
    sourceRef:
      "pharmacy-console-frontend-architecture.md#Error prevention and safety protocol UX / 9. Command fences and override paths / PharmacyOverrideAuthorityProof",
  },
  {
    canonicalName: "PharmacySettlementVisibilityDigest",
    objectKind: "digest",
    boundedContext: "staff_support_operations",
    authoritativeOwner: "Staff, support, and operations control",
    sourceRef:
      "pharmacy-console-frontend-architecture.md#Error prevention and safety protocol UX / 9A. Settlement visibility and reconcile posture / PharmacySettlementVisibilityDigest",
  },
  {
    canonicalName: "PharmacySurfacePosture",
    objectKind: "other",
    boundedContext: "staff_support_operations",
    authoritativeOwner: "Staff, support, and operations control",
    sourceRef:
      "pharmacy-console-frontend-architecture.md#Canonical shell model / PharmacySurfacePosture",
  },
  {
    canonicalName: "QueueAnchorLease",
    objectKind: "lease",
    boundedContext: "staff_support_operations",
    authoritativeOwner: "Staff, support, and operations control",
    sourceRef: "pharmacy-console-frontend-architecture.md#Canonical shell model / QueueAnchorLease",
  },
  {
    canonicalName: "QueuePreviewDigest",
    objectKind: "digest",
    boundedContext: "staff_support_operations",
    authoritativeOwner: "Staff, support, and operations control",
    sourceRef:
      "staff-workspace-interface-architecture.md#Workspace projections and client state / QueuePreviewDigest",
  },
  {
    canonicalName: "QueueRowPresentationContract",
    objectKind: "contract",
    boundedContext: "staff_support_operations",
    authoritativeOwner: "Staff, support, and operations control",
    sourceRef:
      "staff-workspace-interface-architecture.md#Workspace projections and client state / QueueRowPresentationContract",
  },
  {
    canonicalName: "QueueScanSession",
    objectKind: "other",
    boundedContext: "staff_support_operations",
    authoritativeOwner: "Staff, support, and operations control",
    sourceRef:
      "staff-workspace-interface-architecture.md#Workspace projections and client state / QueueScanSession",
  },
  {
    canonicalName: "QueueWorkbenchProjection",
    objectKind: "projection",
    boundedContext: "staff_support_operations",
    authoritativeOwner: "Staff, support, and operations control",
    sourceRef:
      "staff-workspace-interface-architecture.md#Workspace projections and client state / QueueWorkbenchProjection",
  },
  {
    canonicalName: "RapidEntryDraft",
    objectKind: "other",
    boundedContext: "staff_support_operations",
    authoritativeOwner: "Staff, support, and operations control",
    sourceRef:
      "staff-workspace-interface-architecture.md#Workspace projections and client state / RapidEntryDraft",
  },
  {
    canonicalName: "ReleaseGuardrailDigest",
    objectKind: "digest",
    boundedContext: "staff_support_operations",
    authoritativeOwner: "Staff, support, and operations control",
    sourceRef:
      "operations-console-frontend-blueprint.md#4. Canonical overview composition / 4.4 ServiceHealthGrid / ReleaseGuardrailDigest",
  },
  {
    canonicalName: "SecureLinkReissueRecord",
    objectKind: "record",
    boundedContext: "staff_support_operations",
    authoritativeOwner: "Staff, support, and operations control",
    sourceRef:
      "staff-operations-and-support-blueprint.md#Support desk model / SecureLinkReissueRecord",
  },
  {
    canonicalName: "SelfCareBoundaryDigest",
    objectKind: "digest",
    boundedContext: "staff_support_operations",
    authoritativeOwner: "Staff, support, and operations control",
    sourceRef:
      "staff-workspace-interface-architecture.md#Workspace projections and client state / SelfCareBoundaryDigest",
  },
  {
    canonicalName: "StaffAudienceCoverageProjection",
    objectKind: "projection",
    boundedContext: "staff_support_operations",
    authoritativeOwner: "Staff, support, and operations control",
    sourceRef:
      "staff-operations-and-support-blueprint.md#Staff audience coverage contract / StaffAudienceCoverageProjection",
  },
  {
    canonicalName: "SupplyComputation",
    objectKind: "other",
    boundedContext: "staff_support_operations",
    authoritativeOwner: "Staff, support, and operations control",
    sourceRef:
      "pharmacy-console-frontend-architecture.md#Prescription validation architecture / 5. Medication line-item cards / SupplyComputation",
  },
  {
    canonicalName: "SupportActionLease",
    objectKind: "lease",
    boundedContext: "staff_support_operations",
    authoritativeOwner: "Staff, support, and operations control",
    sourceRef: "staff-operations-and-support-blueprint.md#Support desk model / SupportActionLease",
  },
  {
    canonicalName: "SupportActionRecord",
    objectKind: "record",
    boundedContext: "staff_support_operations",
    authoritativeOwner: "Staff, support, and operations control",
    sourceRef: "staff-operations-and-support-blueprint.md#Support desk model / SupportActionRecord",
  },
  {
    canonicalName: "SupportActionSettlement",
    objectKind: "settlement",
    boundedContext: "staff_support_operations",
    authoritativeOwner: "Staff, support, and operations control",
    sourceRef:
      "staff-operations-and-support-blueprint.md#Support desk model / SupportActionSettlement",
  },
  {
    canonicalName: "SupportActionWorkbenchProjection",
    objectKind: "projection",
    boundedContext: "staff_support_operations",
    authoritativeOwner: "Staff, support, and operations control",
    sourceRef:
      "staff-operations-and-support-blueprint.md#Support desk model / SupportActionWorkbenchProjection",
  },
  {
    canonicalName: "SupportContextDisclosureRecord",
    objectKind: "record",
    boundedContext: "staff_support_operations",
    authoritativeOwner: "Staff, support, and operations control",
    sourceRef:
      "staff-operations-and-support-blueprint.md#Contextual knowledge and playbook contract / SupportContextDisclosureRecord",
  },
  {
    canonicalName: "SupportContinuityEvidenceProjection",
    objectKind: "projection",
    boundedContext: "staff_support_operations",
    authoritativeOwner: "Staff, support, and operations control",
    sourceRef:
      "staff-operations-and-support-blueprint.md#Support desk model / SupportContinuityEvidenceProjection",
  },
  {
    canonicalName: "SupportKnowledgeAssistLease",
    objectKind: "lease",
    boundedContext: "staff_support_operations",
    authoritativeOwner: "Staff, support, and operations control",
    sourceRef:
      "staff-operations-and-support-blueprint.md#Contextual knowledge and playbook contract / SupportKnowledgeAssistLease",
  },
  {
    canonicalName: "SupportKnowledgeBinding",
    objectKind: "descriptor",
    boundedContext: "staff_support_operations",
    authoritativeOwner: "Staff, support, and operations control",
    sourceRef:
      "staff-operations-and-support-blueprint.md#Contextual knowledge and playbook contract / SupportKnowledgeBinding",
  },
  {
    canonicalName: "SupportKnowledgeGapRecord",
    objectKind: "record",
    boundedContext: "staff_support_operations",
    authoritativeOwner: "Staff, support, and operations control",
    sourceRef:
      "staff-operations-and-support-blueprint.md#Contextual knowledge and playbook contract / SupportKnowledgeGapRecord",
  },
  {
    canonicalName: "SupportKnowledgeStackProjection",
    objectKind: "projection",
    boundedContext: "staff_support_operations",
    authoritativeOwner: "Staff, support, and operations control",
    sourceRef:
      "staff-operations-and-support-blueprint.md#Contextual knowledge and playbook contract / SupportKnowledgeStackProjection",
  },
  {
    canonicalName: "SupportMutationAttempt",
    objectKind: "record",
    boundedContext: "staff_support_operations",
    authoritativeOwner: "Staff, support, and operations control",
    sourceRef:
      "staff-operations-and-support-blueprint.md#Support desk model / SupportMutationAttempt",
  },
  {
    canonicalName: "SupportObserveSession",
    objectKind: "other",
    boundedContext: "staff_support_operations",
    authoritativeOwner: "Staff, support, and operations control",
    sourceRef:
      "staff-operations-and-support-blueprint.md#Support desk model / SupportObserveSession",
  },
  {
    canonicalName: "SupportOmnichannelTimelineProjection",
    objectKind: "projection",
    boundedContext: "staff_support_operations",
    authoritativeOwner: "Staff, support, and operations control",
    sourceRef:
      "staff-operations-and-support-blueprint.md#Support desk model / SupportOmnichannelTimelineProjection",
  },
  {
    canonicalName: "SupportOwnershipTransferRecord",
    objectKind: "record",
    boundedContext: "staff_support_operations",
    authoritativeOwner: "Staff, support, and operations control",
    sourceRef:
      "staff-operations-and-support-blueprint.md#Support desk model / SupportOwnershipTransferRecord",
  },
  {
    canonicalName: "SupportPresentationArtifact",
    objectKind: "artifact",
    boundedContext: "staff_support_operations",
    authoritativeOwner: "Staff, support, and operations control",
    sourceRef:
      "staff-operations-and-support-blueprint.md#Support desk model / SupportPresentationArtifact",
  },
  {
    canonicalName: "SupportReachabilityPostureProjection",
    objectKind: "projection",
    boundedContext: "staff_support_operations",
    authoritativeOwner: "Staff, support, and operations control",
    sourceRef:
      "staff-operations-and-support-blueprint.md#Support desk model / SupportReachabilityPostureProjection",
  },
  {
    canonicalName: "SupportReadOnlyFallbackProjection",
    objectKind: "projection",
    boundedContext: "staff_support_operations",
    authoritativeOwner: "Staff, support, and operations control",
    sourceRef:
      "staff-operations-and-support-blueprint.md#Support desk model / SupportReadOnlyFallbackProjection",
  },
  {
    canonicalName: "SupportReplayCheckpoint",
    objectKind: "checkpoint",
    boundedContext: "staff_support_operations",
    authoritativeOwner: "Staff, support, and operations control",
    sourceRef:
      "staff-operations-and-support-blueprint.md#Support desk model / SupportReplayCheckpoint",
  },
  {
    canonicalName: "SupportReplayDeltaReview",
    objectKind: "other",
    boundedContext: "staff_support_operations",
    authoritativeOwner: "Staff, support, and operations control",
    sourceRef:
      "staff-operations-and-support-blueprint.md#Support desk model / SupportReplayDeltaReview",
  },
  {
    canonicalName: "SupportReplayDraftHold",
    objectKind: "other",
    boundedContext: "staff_support_operations",
    authoritativeOwner: "Staff, support, and operations control",
    sourceRef:
      "staff-operations-and-support-blueprint.md#Support desk model / SupportReplayDraftHold",
  },
  {
    canonicalName: "SupportReplayEscalationIntent",
    objectKind: "other",
    boundedContext: "staff_support_operations",
    authoritativeOwner: "Staff, support, and operations control",
    sourceRef:
      "staff-operations-and-support-blueprint.md#Support desk model / SupportReplayEscalationIntent",
  },
  {
    canonicalName: "SupportReplayEvidenceBoundary",
    objectKind: "other",
    boundedContext: "staff_support_operations",
    authoritativeOwner: "Staff, support, and operations control",
    sourceRef:
      "staff-operations-and-support-blueprint.md#Support desk model / SupportReplayEvidenceBoundary",
  },
  {
    canonicalName: "SupportReplayReleaseDecision",
    objectKind: "record",
    boundedContext: "staff_support_operations",
    authoritativeOwner: "Staff, support, and operations control",
    sourceRef:
      "staff-operations-and-support-blueprint.md#Support desk model / SupportReplayReleaseDecision",
  },
  {
    canonicalName: "SupportResolutionSnapshot",
    objectKind: "record",
    boundedContext: "staff_support_operations",
    authoritativeOwner: "Staff, support, and operations control",
    sourceRef:
      "staff-operations-and-support-blueprint.md#Support desk model / SupportResolutionSnapshot",
  },
  {
    canonicalName: "SupportRouteIntentToken",
    objectKind: "token",
    boundedContext: "staff_support_operations",
    authoritativeOwner: "Staff, support, and operations control",
    sourceRef:
      "staff-operations-and-support-blueprint.md#Support desk model / SupportRouteIntentToken",
  },
  {
    canonicalName: "SupportSubject360Projection",
    objectKind: "projection",
    boundedContext: "staff_support_operations",
    authoritativeOwner: "Staff, support, and operations control",
    sourceRef:
      "staff-operations-and-support-blueprint.md#Contextual knowledge and playbook contract / SupportSubject360Projection",
  },
  {
    canonicalName: "SupportSubjectContextBinding",
    objectKind: "descriptor",
    boundedContext: "staff_support_operations",
    authoritativeOwner: "Staff, support, and operations control",
    sourceRef:
      "staff-operations-and-support-blueprint.md#Contextual knowledge and playbook contract / SupportSubjectContextBinding",
  },
  {
    canonicalName: "SupportSurfacePosture",
    objectKind: "other",
    boundedContext: "staff_support_operations",
    authoritativeOwner: "Staff, support, and operations control",
    sourceRef:
      "staff-operations-and-support-blueprint.md#Support desk model / SupportSurfacePosture",
  },
  {
    canonicalName: "SupportSurfaceRuntimeBinding",
    objectKind: "descriptor",
    boundedContext: "staff_support_operations",
    authoritativeOwner: "Staff, support, and operations control",
    sourceRef:
      "staff-operations-and-support-blueprint.md#Support desk model / SupportSurfaceRuntimeBinding",
  },
  {
    canonicalName: "SupportTicket",
    objectKind: "other",
    boundedContext: "staff_support_operations",
    authoritativeOwner: "Staff, support, and operations control",
    sourceRef: "staff-operations-and-support-blueprint.md#Support desk model / SupportTicket",
  },
  {
    canonicalName: "SupportTicketWorkspaceProjection",
    objectKind: "projection",
    boundedContext: "staff_support_operations",
    authoritativeOwner: "Staff, support, and operations control",
    sourceRef:
      "staff-operations-and-support-blueprint.md#Support desk model / SupportTicketWorkspaceProjection",
  },
  {
    canonicalName: "SupportTransferAcceptanceSettlement",
    objectKind: "settlement",
    boundedContext: "staff_support_operations",
    authoritativeOwner: "Staff, support, and operations control",
    sourceRef:
      "staff-operations-and-support-blueprint.md#Support desk model / SupportTransferAcceptanceSettlement",
  },
  {
    canonicalName: "TaskCanvasFrame",
    objectKind: "other",
    boundedContext: "staff_support_operations",
    authoritativeOwner: "Staff, support, and operations control",
    sourceRef:
      "staff-workspace-interface-architecture.md#Workspace projections and client state / TaskCanvasFrame",
  },
  {
    canonicalName: "TaskWorkspaceProjection",
    objectKind: "projection",
    boundedContext: "staff_support_operations",
    authoritativeOwner: "Staff, support, and operations control",
    sourceRef:
      "staff-workspace-interface-architecture.md#Workspace projections and client state / TaskWorkspaceProjection",
  },
  {
    canonicalName: "VarianceComparisonBasis",
    objectKind: "other",
    boundedContext: "staff_support_operations",
    authoritativeOwner: "Staff, support, and operations control",
    sourceRef:
      "operations-console-frontend-blueprint.md#4. Canonical overview composition / 4.5 CohortImpactMatrix / VarianceComparisonBasis",
  },
  {
    canonicalName: "WorkspaceArtifactFrame",
    objectKind: "other",
    boundedContext: "staff_support_operations",
    authoritativeOwner: "Staff, support, and operations control",
    sourceRef:
      "staff-workspace-interface-architecture.md#Workspace posture and artifact continuity / WorkspaceArtifactFrame",
  },
  {
    canonicalName: "WorkspaceContinuityEvidenceProjection",
    objectKind: "projection",
    boundedContext: "staff_support_operations",
    authoritativeOwner: "Staff, support, and operations control",
    sourceRef:
      "staff-workspace-interface-architecture.md#Workspace projections and client state / WorkspaceContinuityEvidenceProjection",
  },
  {
    canonicalName: "WorkspaceDominantActionHierarchy",
    objectKind: "other",
    boundedContext: "staff_support_operations",
    authoritativeOwner: "Staff, support, and operations control",
    sourceRef:
      "staff-workspace-interface-architecture.md#Route family / WorkspaceDominantActionHierarchy",
  },
  {
    canonicalName: "WorkspaceHomeProjection",
    objectKind: "projection",
    boundedContext: "staff_support_operations",
    authoritativeOwner: "Staff, support, and operations control",
    sourceRef:
      "staff-workspace-interface-architecture.md#Workspace projections and client state / WorkspaceHomeProjection",
  },
  {
    canonicalName: "WorkspaceNavigationLedger",
    objectKind: "other",
    boundedContext: "staff_support_operations",
    authoritativeOwner: "Staff, support, and operations control",
    sourceRef: "staff-workspace-interface-architecture.md#Route family / WorkspaceNavigationLedger",
  },
  {
    canonicalName: "WorkspaceProminenceDecision",
    objectKind: "record",
    boundedContext: "staff_support_operations",
    authoritativeOwner: "Staff, support, and operations control",
    sourceRef:
      "staff-workspace-interface-architecture.md#Workspace projections and client state / WorkspaceProminenceDecision",
  },
  {
    canonicalName: "WorkspaceRouteAdjacency",
    objectKind: "other",
    boundedContext: "staff_support_operations",
    authoritativeOwner: "Staff, support, and operations control",
    sourceRef: "staff-workspace-interface-architecture.md#Route family / WorkspaceRouteAdjacency",
  },
  {
    canonicalName: "WorkspaceSelectedAnchorPolicy",
    objectKind: "policy",
    boundedContext: "staff_support_operations",
    authoritativeOwner: "Staff, support, and operations control",
    sourceRef:
      "staff-workspace-interface-architecture.md#Route family / WorkspaceSelectedAnchorPolicy",
  },
  {
    canonicalName: "WorkspaceStatusPresentationContract",
    objectKind: "contract",
    boundedContext: "staff_support_operations",
    authoritativeOwner: "Staff, support, and operations control",
    sourceRef:
      "staff-workspace-interface-architecture.md#Route family / WorkspaceStatusPresentationContract",
  },
  {
    canonicalName: "WorkspaceSurfacePosture",
    objectKind: "other",
    boundedContext: "staff_support_operations",
    authoritativeOwner: "Staff, support, and operations control",
    sourceRef:
      "staff-workspace-interface-architecture.md#Workspace posture and artifact continuity / WorkspaceSurfacePosture",
  },
  {
    canonicalName: "WorkspaceSurfaceState",
    objectKind: "descriptor",
    boundedContext: "staff_support_operations",
    authoritativeOwner: "Staff, support, and operations control",
    sourceRef:
      "staff-workspace-interface-architecture.md#Workspace projections and client state / WorkspaceSurfaceState",
  },
] as const satisfies readonly OwnedObjectFamily[];

export const aggregateFamilies = [
  {
    canonicalName: "AdminResolutionCase",
    objectKind: "case",
    boundedContext: "self_care_admin_resolution",
    authoritativeOwner: "Self-care and admin-resolution domain",
    sourceRef:
      "phase-0-the-foundation-protocol.md#Canonical lifecycle, identity, safety, reservation, access, and reconciliation algorithm / 1. Required platform objects / AdminResolutionCase",
  },
  {
    canonicalName: "PharmacyCaseArtifactFrame",
    objectKind: "other",
    boundedContext: "staff_support_operations",
    authoritativeOwner: "Staff, support, and operations control",
    sourceRef:
      "pharmacy-console-frontend-architecture.md#Canonical shell model / PharmacyCaseArtifactFrame",
  },
  {
    canonicalName: "PharmacyCommandFenceSession",
    objectKind: "other",
    boundedContext: "staff_support_operations",
    authoritativeOwner: "Staff, support, and operations control",
    sourceRef:
      "pharmacy-console-frontend-architecture.md#Error prevention and safety protocol UX / 9. Command fences and override paths / PharmacyCommandFenceSession",
  },
  {
    canonicalName: "QueueScanSession",
    objectKind: "other",
    boundedContext: "staff_support_operations",
    authoritativeOwner: "Staff, support, and operations control",
    sourceRef:
      "staff-workspace-interface-architecture.md#Workspace projections and client state / QueueScanSession",
  },
  {
    canonicalName: "SupportObserveSession",
    objectKind: "other",
    boundedContext: "staff_support_operations",
    authoritativeOwner: "Staff, support, and operations control",
    sourceRef:
      "staff-operations-and-support-blueprint.md#Support desk model / SupportObserveSession",
  },
] as const satisfies readonly OwnedObjectFamily[];

export const domainServiceFamilies = [
  {
    canonicalName: "ReviewBundleAssembler",
    objectKind: "other",
    boundedContext: "staff_support_operations",
    authoritativeOwner: "Staff, support, and operations control",
    sourceRef:
      "phase-3-the-human-checkpoint.md#3C. Review bundle assembler, deterministic summaries, and suggestion seam / Backend work / ReviewBundleAssembler",
  },
  {
    canonicalName: "DeterministicReviewSummaryService",
    objectKind: "other",
    boundedContext: "staff_support_operations",
    authoritativeOwner: "Staff, support, and operations control",
    sourceRef:
      "phase-3-the-human-checkpoint.md#3C. Review bundle assembler, deterministic summaries, and suggestion seam / Backend work / deterministic summary generator",
  },
  {
    canonicalName: "EvidenceDeltaPacketBuilder",
    objectKind: "other",
    boundedContext: "staff_support_operations",
    authoritativeOwner: "Staff, support, and operations control",
    sourceRef:
      "staff-workspace-interface-architecture.md#Workspace projections and client state / EvidenceDeltaPacket",
  },
  {
    canonicalName: "SuggestionEnvelopeBuilder",
    objectKind: "other",
    boundedContext: "staff_support_operations",
    authoritativeOwner: "Staff, support, and operations control",
    sourceRef:
      "phase-3-the-human-checkpoint.md#3C. Review bundle assembler, deterministic summaries, and suggestion seam / Backend work / SuggestionEnvelope",
  },
  {
    canonicalName: "SupportCommunicationFailureLinkageService",
    objectKind: "other",
    boundedContext: "staff_support_operations",
    authoritativeOwner: "Staff, support, and operations control",
    sourceRef:
      "staff-operations-and-support-blueprint.md#Support desk model / SupportActionRecord",
  },
  {
    canonicalName: "SupportResolutionSnapshotBuilder",
    objectKind: "other",
    boundedContext: "staff_support_operations",
    authoritativeOwner: "Staff, support, and operations control",
    sourceRef:
      "staff-operations-and-support-blueprint.md#Support desk model / SupportResolutionSnapshot",
  },
] as const satisfies readonly OwnedObjectFamily[];

export const eventFamilies = [] as const satisfies readonly OwnedObjectFamily[];

export const policyFamilies = [
  {
    canonicalName: "AdviceEligibilityGrant",
    objectKind: "grant",
    boundedContext: "self_care_admin_resolution",
    authoritativeOwner: "Self-care and admin-resolution domain",
    sourceRef:
      "self-care-content-and-admin-resolution-blueprint.md#Self-care content governance / Suggested objects / AdviceEligibilityGrant",
  },
  {
    canonicalName: "PharmacyCommandFenceSession",
    objectKind: "other",
    boundedContext: "staff_support_operations",
    authoritativeOwner: "Staff, support, and operations control",
    sourceRef:
      "pharmacy-console-frontend-architecture.md#Error prevention and safety protocol UX / 9. Command fences and override paths / PharmacyCommandFenceSession",
  },
  {
    canonicalName: "PharmacyFenceImpactDigest",
    objectKind: "digest",
    boundedContext: "staff_support_operations",
    authoritativeOwner: "Staff, support, and operations control",
    sourceRef:
      "pharmacy-console-frontend-architecture.md#Error prevention and safety protocol UX / 9. Command fences and override paths / PharmacyFenceImpactDigest",
  },
  {
    canonicalName: "PharmacyFenceSettlementWindow",
    objectKind: "other",
    boundedContext: "staff_support_operations",
    authoritativeOwner: "Staff, support, and operations control",
    sourceRef:
      "pharmacy-console-frontend-architecture.md#Error prevention and safety protocol UX / 9. Command fences and override paths / PharmacyFenceSettlementWindow",
  },
  {
    canonicalName: "ReleaseGuardrailDigest",
    objectKind: "digest",
    boundedContext: "staff_support_operations",
    authoritativeOwner: "Staff, support, and operations control",
    sourceRef:
      "operations-console-frontend-blueprint.md#4. Canonical overview composition / 4.4 ServiceHealthGrid / ReleaseGuardrailDigest",
  },
  {
    canonicalName: "WorkspaceSelectedAnchorPolicy",
    objectKind: "policy",
    boundedContext: "staff_support_operations",
    authoritativeOwner: "Staff, support, and operations control",
    sourceRef:
      "staff-workspace-interface-architecture.md#Route family / WorkspaceSelectedAnchorPolicy",
  },
] as const satisfies readonly OwnedObjectFamily[];

export const projectionFamilies = [
  {
    canonicalName: "MedicationValidationCardProjection",
    objectKind: "projection",
    boundedContext: "staff_support_operations",
    authoritativeOwner: "Staff, support, and operations control",
    sourceRef:
      "pharmacy-console-frontend-architecture.md#Prescription validation architecture / 5. Medication line-item cards / MedicationValidationCardProjection",
  },
  {
    canonicalName: "PharmacyConsoleContinuityEvidenceProjection",
    objectKind: "projection",
    boundedContext: "staff_support_operations",
    authoritativeOwner: "Staff, support, and operations control",
    sourceRef:
      "pharmacy-console-frontend-architecture.md#Canonical shell model / PharmacyConsoleContinuityEvidenceProjection",
  },
  {
    canonicalName: "QueueWorkbenchProjection",
    objectKind: "projection",
    boundedContext: "staff_support_operations",
    authoritativeOwner: "Staff, support, and operations control",
    sourceRef:
      "staff-workspace-interface-architecture.md#Workspace projections and client state / QueueWorkbenchProjection",
  },
  {
    canonicalName: "StaffAudienceCoverageProjection",
    objectKind: "projection",
    boundedContext: "staff_support_operations",
    authoritativeOwner: "Staff, support, and operations control",
    sourceRef:
      "staff-operations-and-support-blueprint.md#Staff audience coverage contract / StaffAudienceCoverageProjection",
  },
  {
    canonicalName: "SupportActionWorkbenchProjection",
    objectKind: "projection",
    boundedContext: "staff_support_operations",
    authoritativeOwner: "Staff, support, and operations control",
    sourceRef:
      "staff-operations-and-support-blueprint.md#Support desk model / SupportActionWorkbenchProjection",
  },
  {
    canonicalName: "SupportContinuityEvidenceProjection",
    objectKind: "projection",
    boundedContext: "staff_support_operations",
    authoritativeOwner: "Staff, support, and operations control",
    sourceRef:
      "staff-operations-and-support-blueprint.md#Support desk model / SupportContinuityEvidenceProjection",
  },
  {
    canonicalName: "SupportKnowledgeStackProjection",
    objectKind: "projection",
    boundedContext: "staff_support_operations",
    authoritativeOwner: "Staff, support, and operations control",
    sourceRef:
      "staff-operations-and-support-blueprint.md#Contextual knowledge and playbook contract / SupportKnowledgeStackProjection",
  },
  {
    canonicalName: "SupportOmnichannelTimelineProjection",
    objectKind: "projection",
    boundedContext: "staff_support_operations",
    authoritativeOwner: "Staff, support, and operations control",
    sourceRef:
      "staff-operations-and-support-blueprint.md#Support desk model / SupportOmnichannelTimelineProjection",
  },
  {
    canonicalName: "SupportReachabilityPostureProjection",
    objectKind: "projection",
    boundedContext: "staff_support_operations",
    authoritativeOwner: "Staff, support, and operations control",
    sourceRef:
      "staff-operations-and-support-blueprint.md#Support desk model / SupportReachabilityPostureProjection",
  },
  {
    canonicalName: "SupportReadOnlyFallbackProjection",
    objectKind: "projection",
    boundedContext: "staff_support_operations",
    authoritativeOwner: "Staff, support, and operations control",
    sourceRef:
      "staff-operations-and-support-blueprint.md#Support desk model / SupportReadOnlyFallbackProjection",
  },
  {
    canonicalName: "SupportSubject360Projection",
    objectKind: "projection",
    boundedContext: "staff_support_operations",
    authoritativeOwner: "Staff, support, and operations control",
    sourceRef:
      "staff-operations-and-support-blueprint.md#Contextual knowledge and playbook contract / SupportSubject360Projection",
  },
  {
    canonicalName: "SupportTicketWorkspaceProjection",
    objectKind: "projection",
    boundedContext: "staff_support_operations",
    authoritativeOwner: "Staff, support, and operations control",
    sourceRef:
      "staff-operations-and-support-blueprint.md#Support desk model / SupportTicketWorkspaceProjection",
  },
  {
    canonicalName: "TaskWorkspaceProjection",
    objectKind: "projection",
    boundedContext: "staff_support_operations",
    authoritativeOwner: "Staff, support, and operations control",
    sourceRef:
      "staff-workspace-interface-architecture.md#Workspace projections and client state / TaskWorkspaceProjection",
  },
  {
    canonicalName: "WorkspaceContinuityEvidenceProjection",
    objectKind: "projection",
    boundedContext: "staff_support_operations",
    authoritativeOwner: "Staff, support, and operations control",
    sourceRef:
      "staff-workspace-interface-architecture.md#Workspace projections and client state / WorkspaceContinuityEvidenceProjection",
  },
  {
    canonicalName: "WorkspaceHomeProjection",
    objectKind: "projection",
    boundedContext: "staff_support_operations",
    authoritativeOwner: "Staff, support, and operations control",
    sourceRef:
      "staff-workspace-interface-architecture.md#Workspace projections and client state / WorkspaceHomeProjection",
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

export * from "./phase3-communication-failure-linkage";
