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
  artifactId: "package_domains_triage_workspace",
  packageName: "@vecells/domain-triage-workspace",
  packageRole: "domain",
  ownerContextCode: "triage_workspace",
  ownerContextLabel: "Triage Workspace",
  purpose: "Canonical package home for the Triage Workspace bounded context.",
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
  objectFamilyCount: 61,
  contractFamilyCount: 0,
  sourceContexts: ["triage_human_checkpoint", "phase1_triage_handoff"],
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
    canonicalName: "AdminResolutionStarter",
    objectKind: "starter",
    boundedContext: "triage_human_checkpoint",
    authoritativeOwner: "Triage domain",
    sourceRef:
      "phase-3-the-human-checkpoint.md#3G. Direct resolution, downstream handoff seeds, and reopen mechanics / Backend work / admin resolution starter",
  },
  {
    canonicalName: "ApprovalRequirementAssessment",
    objectKind: "record",
    boundedContext: "triage_human_checkpoint",
    authoritativeOwner: "Triage domain",
    sourceRef:
      "phase-3-the-human-checkpoint.md#3E. Endpoint decision engine and resolution model / Backend work / ApprovalCheckpoint",
  },
  {
    canonicalName: "ApprovalCheckpoint",
    objectKind: "checkpoint",
    boundedContext: "triage_human_checkpoint",
    authoritativeOwner: "Triage domain",
    sourceRef:
      "phase-3-the-human-checkpoint.md#3F. Human approval checkpoint and urgent escalation path / Backend work / ApprovalCheckpoint",
  },
  {
    canonicalName: "BookingIntent",
    objectKind: "descriptor",
    boundedContext: "triage_human_checkpoint",
    authoritativeOwner: "Triage domain",
    sourceRef:
      "phase-3-the-human-checkpoint.md#3G. Direct resolution, downstream handoff seeds, and reopen mechanics / Backend work / BookingIntent",
  },
  {
    canonicalName: "CallbackCaseSeed",
    objectKind: "seed",
    boundedContext: "triage_human_checkpoint",
    authoritativeOwner: "Triage domain",
    sourceRef:
      "callback-and-clinician-messaging-loop.md#Backend work / CallbackCaseSeed",
  },
  {
    canonicalName: "CallbackCase",
    objectKind: "aggregate",
    boundedContext: "triage_human_checkpoint",
    authoritativeOwner: "Triage domain",
    sourceRef: "callback-and-clinician-messaging-loop.md#Callback domain / CallbackCase",
  },
  {
    canonicalName: "CallbackIntentLease",
    objectKind: "lease",
    boundedContext: "triage_human_checkpoint",
    authoritativeOwner: "Triage domain",
    sourceRef:
      "callback-and-clinician-messaging-loop.md#Callback domain / CallbackIntentLease",
  },
  {
    canonicalName: "CallbackAttemptRecord",
    objectKind: "record",
    boundedContext: "triage_human_checkpoint",
    authoritativeOwner: "Triage domain",
    sourceRef:
      "callback-and-clinician-messaging-loop.md#Callback domain / CallbackAttemptRecord",
  },
  {
    canonicalName: "CallbackExpectationEnvelope",
    objectKind: "envelope",
    boundedContext: "triage_human_checkpoint",
    authoritativeOwner: "Triage domain",
    sourceRef:
      "callback-and-clinician-messaging-loop.md#Callback domain / CallbackExpectationEnvelope",
  },
  {
    canonicalName: "CallbackOutcomeEvidenceBundle",
    objectKind: "bundle",
    boundedContext: "triage_human_checkpoint",
    authoritativeOwner: "Triage domain",
    sourceRef:
      "callback-and-clinician-messaging-loop.md#Callback domain / CallbackOutcomeEvidenceBundle",
  },
  {
    canonicalName: "CallbackResolutionGate",
    objectKind: "gate",
    boundedContext: "triage_human_checkpoint",
    authoritativeOwner: "Triage domain",
    sourceRef:
      "callback-and-clinician-messaging-loop.md#Callback domain / CallbackResolutionGate",
  },
  {
    canonicalName: "ClinicianMessageSeed",
    objectKind: "seed",
    boundedContext: "triage_human_checkpoint",
    authoritativeOwner: "Triage domain",
    sourceRef:
      "callback-and-clinician-messaging-loop.md#Backend work / ClinicianMessageSeed",
  },
  {
    canonicalName: "ClinicianMessageThread",
    objectKind: "aggregate",
    boundedContext: "triage_human_checkpoint",
    authoritativeOwner: "Triage domain",
    sourceRef:
      "callback-and-clinician-messaging-loop.md#Clinician message domain / ClinicianMessageThread",
  },
  {
    canonicalName: "MessageDispatchEnvelope",
    objectKind: "envelope",
    boundedContext: "triage_human_checkpoint",
    authoritativeOwner: "Triage domain",
    sourceRef:
      "callback-and-clinician-messaging-loop.md#Clinician message domain / MessageDispatchEnvelope",
  },
  {
    canonicalName: "MessageDeliveryEvidenceBundle",
    objectKind: "bundle",
    boundedContext: "triage_human_checkpoint",
    authoritativeOwner: "Triage domain",
    sourceRef:
      "callback-and-clinician-messaging-loop.md#Clinician message domain / MessageDeliveryEvidenceBundle",
  },
  {
    canonicalName: "ThreadExpectationEnvelope",
    objectKind: "envelope",
    boundedContext: "triage_human_checkpoint",
    authoritativeOwner: "Triage domain",
    sourceRef:
      "callback-and-clinician-messaging-loop.md#Clinician message domain / ThreadExpectationEnvelope",
  },
  {
    canonicalName: "ThreadResolutionGate",
    objectKind: "gate",
    boundedContext: "triage_human_checkpoint",
    authoritativeOwner: "Triage domain",
    sourceRef:
      "callback-and-clinician-messaging-loop.md#Clinician message domain / ThreadResolutionGate",
  },
  {
    canonicalName: "MessagePatientReply",
    objectKind: "record",
    boundedContext: "triage_human_checkpoint",
    authoritativeOwner: "Triage domain",
    sourceRef:
      "callback-and-clinician-messaging-loop.md#Clinician message domain / patient replies route to ClinicianMessageThread first",
  },
  {
    canonicalName: "DecisionEpoch",
    objectKind: "other",
    boundedContext: "triage_human_checkpoint",
    authoritativeOwner: "Triage domain",
    sourceRef:
      "phase-3-the-human-checkpoint.md#3E. Endpoint decision engine and resolution model / Backend work / DecisionEpoch",
  },
  {
    canonicalName: "DirectResolutionOutboxEntry",
    objectKind: "outbox",
    boundedContext: "triage_human_checkpoint",
    authoritativeOwner: "Triage domain",
    sourceRef:
      "phase-3-the-human-checkpoint.md#3G. Direct resolution, downstream handoff seeds, and reopen mechanics / Backend work / outbox-safe publication",
  },
  {
    canonicalName: "DirectResolutionSettlement",
    objectKind: "settlement",
    boundedContext: "triage_human_checkpoint",
    authoritativeOwner: "Triage domain",
    sourceRef:
      "phase-3-the-human-checkpoint.md#3G. Direct resolution, downstream handoff seeds, and reopen mechanics / Backend work / direct resolution settlement",
  },
  {
    canonicalName: "DuplicateReviewSnapshot",
    objectKind: "record",
    boundedContext: "triage_human_checkpoint",
    authoritativeOwner: "Triage domain",
    sourceRef:
      "phase-3-the-human-checkpoint.md#3A. Triage contract and workspace state model / Backend work / DuplicateReviewSnapshot",
  },
  {
    canonicalName: "EndpointBoundaryTuple",
    objectKind: "descriptor",
    boundedContext: "triage_human_checkpoint",
    authoritativeOwner: "Triage domain",
    sourceRef:
      "self-care-content-and-admin-resolution-blueprint.md#Backend work / boundary tuple",
  },
  {
    canonicalName: "EndpointDecision",
    objectKind: "aggregate",
    boundedContext: "triage_human_checkpoint",
    authoritativeOwner: "Triage domain",
    sourceRef:
      "phase-3-the-human-checkpoint.md#3E. Endpoint decision engine and resolution model / Backend work / EndpointDecision",
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
    objectKind: "record",
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
    canonicalName: "InformationRequestWindow",
    objectKind: "other",
    boundedContext: "triage_human_checkpoint",
    authoritativeOwner: "Triage domain",
    sourceRef:
      "phase-3-the-human-checkpoint.md#More-info and patient response flow / InformationRequestWindow",
  },
  {
    canonicalName: "MoreInfoCycle",
    objectKind: "case",
    boundedContext: "triage_human_checkpoint",
    authoritativeOwner: "Triage domain",
    sourceRef:
      "phase-3-the-human-checkpoint.md#3A. Triage contract and workspace state model / Backend work / MoreInfoCycle",
  },
  {
    canonicalName: "MoreInfoReminderSchedule",
    objectKind: "other",
    boundedContext: "triage_human_checkpoint",
    authoritativeOwner: "Triage domain",
    sourceRef:
      "phase-3-the-human-checkpoint.md#3A. Triage contract and workspace state model / Backend work / MoreInfoReminderSchedule",
  },
  {
    canonicalName: "MoreInfoReplyWindowCheckpoint",
    objectKind: "checkpoint",
    boundedContext: "triage_human_checkpoint",
    authoritativeOwner: "Triage domain",
    sourceRef:
      "phase-3-the-human-checkpoint.md#3A. Triage contract and workspace state model / Backend work / MoreInfoReplyWindowCheckpoint",
  },
  {
    canonicalName: "MoreInfoResponseDisposition",
    objectKind: "record",
    boundedContext: "triage_human_checkpoint",
    authoritativeOwner: "Triage domain",
    sourceRef:
      "phase-3-the-human-checkpoint.md#3A. Triage contract and workspace state model / Backend work / MoreInfoResponseDisposition",
  },
  {
    canonicalName: "DutyEscalationRecord",
    objectKind: "record",
    boundedContext: "triage_human_checkpoint",
    authoritativeOwner: "Triage domain",
    sourceRef:
      "phase-3-the-human-checkpoint.md#3F. Human approval checkpoint and urgent escalation path / Backend work / DutyEscalationRecord",
  },
  {
    canonicalName: "PatientStatusProjectionUpdate",
    objectKind: "projection",
    boundedContext: "triage_human_checkpoint",
    authoritativeOwner: "Triage domain",
    sourceRef:
      "phase-3-the-human-checkpoint.md#3G. Direct resolution, downstream handoff seeds, and reopen mechanics / Backend work / patient-status projection update",
  },
  {
    canonicalName: "PharmacyIntent",
    objectKind: "descriptor",
    boundedContext: "triage_human_checkpoint",
    authoritativeOwner: "Triage domain",
    sourceRef:
      "phase-3-the-human-checkpoint.md#3G. Direct resolution, downstream handoff seeds, and reopen mechanics / Backend work / PharmacyIntent",
  },
  {
    canonicalName: "SelfCareConsequenceStarter",
    objectKind: "starter",
    boundedContext: "triage_human_checkpoint",
    authoritativeOwner: "Triage domain",
    sourceRef:
      "self-care-content-and-admin-resolution-blueprint.md#Backend work / self-care consequence starter",
  },
  {
    canonicalName: "SelfCareBoundaryDecision",
    objectKind: "record",
    boundedContext: "triage_human_checkpoint",
    authoritativeOwner: "Triage domain",
    sourceRef:
      "self-care-content-and-admin-resolution-blueprint.md#Self-care content governance / Suggested objects / SelfCareBoundaryDecision",
  },
  {
    canonicalName: "AdviceEligibilityGrant",
    objectKind: "grant",
    boundedContext: "triage_human_checkpoint",
    authoritativeOwner: "Triage domain",
    sourceRef:
      "self-care-content-and-admin-resolution-blueprint.md#Self-care content governance / Suggested objects / AdviceEligibilityGrant",
  },
  {
    canonicalName: "AdviceBundleVersion",
    objectKind: "bundle",
    boundedContext: "triage_human_checkpoint",
    authoritativeOwner: "Triage domain",
    sourceRef:
      "self-care-content-and-admin-resolution-blueprint.md#Self-care content governance / Suggested objects / AdviceBundleVersion",
  },
  {
    canonicalName: "AdviceVariantSet",
    objectKind: "descriptor",
    boundedContext: "triage_human_checkpoint",
    authoritativeOwner: "Triage domain",
    sourceRef:
      "self-care-content-and-admin-resolution-blueprint.md#Self-care content governance / Suggested objects / AdviceVariantSet",
  },
  {
    canonicalName: "ClinicalContentApprovalRecord",
    objectKind: "record",
    boundedContext: "triage_human_checkpoint",
    authoritativeOwner: "Triage domain",
    sourceRef:
      "self-care-content-and-admin-resolution-blueprint.md#Self-care content governance / Suggested objects / ClinicalContentApprovalRecord",
  },
  {
    canonicalName: "ContentReviewSchedule",
    objectKind: "schedule",
    boundedContext: "triage_human_checkpoint",
    authoritativeOwner: "Triage domain",
    sourceRef:
      "self-care-content-and-admin-resolution-blueprint.md#Self-care content governance / Suggested objects / ContentReviewSchedule",
  },
  {
    canonicalName: "AdviceRenderSettlement",
    objectKind: "settlement",
    boundedContext: "triage_human_checkpoint",
    authoritativeOwner: "Triage domain",
    sourceRef:
      "self-care-content-and-admin-resolution-blueprint.md#Self-care content governance / Suggested objects / AdviceRenderSettlement",
  },
  {
    canonicalName: "SelfCareBoundarySupersessionRecord",
    objectKind: "record",
    boundedContext: "triage_human_checkpoint",
    authoritativeOwner: "Triage domain",
    sourceRef: "prompt/249.md#Deliverables to create",
  },
  {
    canonicalName: "AdviceEligibilityGrantTransitionRecord",
    objectKind: "record",
    boundedContext: "triage_human_checkpoint",
    authoritativeOwner: "Triage domain",
    sourceRef: "prompt/249.md#Deliverables to create",
  },
  {
    canonicalName: "ResponseAssimilationRecord",
    objectKind: "record",
    boundedContext: "triage_human_checkpoint",
    authoritativeOwner: "Triage domain",
    sourceRef:
      "phase-3-the-human-checkpoint.md#More-info and patient response flow / ResponseAssimilationRecord",
  },
  {
    canonicalName: "ReviewBaselineSnapshot",
    objectKind: "record",
    boundedContext: "triage_human_checkpoint",
    authoritativeOwner: "Triage domain",
    sourceRef:
      "phase-3-the-human-checkpoint.md#3A. Review-task contract and workspace state / ReviewBaselineSnapshot",
  },
  {
    canonicalName: "ReviewBundle",
    objectKind: "bundle",
    boundedContext: "triage_human_checkpoint",
    authoritativeOwner: "Triage domain",
    sourceRef:
      "phase-3-the-human-checkpoint.md#3A. Triage contract and workspace state model / Backend work / ReviewBundle",
  },
  {
    canonicalName: "ReviewSession",
    objectKind: "other",
    boundedContext: "triage_human_checkpoint",
    authoritativeOwner: "Triage domain",
    sourceRef:
      "phase-3-the-human-checkpoint.md#3A. Triage contract and workspace state model / Backend work / ReviewSession",
  },
  {
    canonicalName: "ReviewSessionLease",
    objectKind: "lease",
    boundedContext: "triage_human_checkpoint",
    authoritativeOwner: "Triage domain",
    sourceRef:
      "phase-3-the-human-checkpoint.md#3A. Review-task contract and workspace state / ReviewSessionLease",
  },
  {
    canonicalName: "TaskCommandSettlement",
    objectKind: "settlement",
    boundedContext: "triage_human_checkpoint",
    authoritativeOwner: "Triage domain",
    sourceRef:
      "phase-3-the-human-checkpoint.md#3A. Triage contract and workspace state model / Backend work / TaskCommandSettlement",
  },
  {
    canonicalName: "TaskLaunchContext",
    objectKind: "other",
    boundedContext: "triage_human_checkpoint",
    authoritativeOwner: "Triage domain",
    sourceRef:
      "phase-3-the-human-checkpoint.md#3A. Triage contract and workspace state model / Backend work / TaskLaunchContext",
  },
  {
    canonicalName: "NextTaskLaunchLease",
    objectKind: "lease",
    boundedContext: "triage_human_checkpoint",
    authoritativeOwner: "Triage domain",
    sourceRef:
      "staff-workspace-interface-architecture.md#NextTaskLaunchLease",
  },
  {
    canonicalName: "TriageOutcomePresentationArtifact",
    objectKind: "artifact",
    boundedContext: "triage_human_checkpoint",
    authoritativeOwner: "Triage domain",
    sourceRef:
      "phase-3-the-human-checkpoint.md#3A. Triage contract and workspace state model / Backend work / TriageOutcomePresentationArtifact",
  },
  {
    canonicalName: "TriageReopenRecord",
    objectKind: "record",
    boundedContext: "triage_human_checkpoint",
    authoritativeOwner: "Triage domain",
    sourceRef:
      "phase-3-the-human-checkpoint.md#3G. Direct resolution, downstream handoff seeds, and reopen mechanics / Backend work / TriageReopenRecord",
  },
  {
    canonicalName: "TriageTask",
    objectKind: "other",
    boundedContext: "triage_human_checkpoint",
    authoritativeOwner: "Triage domain",
    sourceRef:
      "phase-3-the-human-checkpoint.md#3A. Review-task contract and workspace state / TriageTask",
  },
  {
    canonicalName: "UrgentContactAttempt",
    objectKind: "record",
    boundedContext: "triage_human_checkpoint",
    authoritativeOwner: "Triage domain",
    sourceRef:
      "phase-3-the-human-checkpoint.md#3F. Human approval checkpoint and urgent escalation path / Backend work / UrgentContactAttempt",
  },
  {
    canonicalName: "UrgentEscalationOutcome",
    objectKind: "record",
    boundedContext: "triage_human_checkpoint",
    authoritativeOwner: "Triage domain",
    sourceRef:
      "phase-3-the-human-checkpoint.md#3F. Human approval checkpoint and urgent escalation path / Backend work / UrgentEscalationOutcome",
  },
  {
    canonicalName: "TriageEtaForecast",
    objectKind: "projection",
    boundedContext: "phase1_triage_handoff",
    authoritativeOwner: "Phase 1 triage handoff and ETA engine",
    sourceRef: "prompt/152.md",
  },
  {
    canonicalName: "Phase1PatientStatusProjection",
    objectKind: "projection",
    boundedContext: "phase1_triage_handoff",
    authoritativeOwner: "Phase 1 triage handoff and ETA engine",
    sourceRef: "prompt/152.md",
  },
] as const satisfies readonly OwnedObjectFamily[];

export const aggregateFamilies = [
  {
    canonicalName: "MoreInfoCycle",
    objectKind: "case",
    boundedContext: "triage_human_checkpoint",
    authoritativeOwner: "Triage domain",
    sourceRef:
      "phase-3-the-human-checkpoint.md#3A. Triage contract and workspace state model / Backend work / MoreInfoCycle",
  },
  {
    canonicalName: "ReviewSession",
    objectKind: "other",
    boundedContext: "triage_human_checkpoint",
    authoritativeOwner: "Triage domain",
    sourceRef:
      "phase-3-the-human-checkpoint.md#3A. Triage contract and workspace state model / Backend work / ReviewSession",
  },
  {
    canonicalName: "ReviewSessionLease",
    objectKind: "lease",
    boundedContext: "triage_human_checkpoint",
    authoritativeOwner: "Triage domain",
    sourceRef:
      "phase-3-the-human-checkpoint.md#3A. Review-task contract and workspace state / ReviewSessionLease",
  },
] as const satisfies readonly OwnedObjectFamily[];

export const domainServiceFamilies = [
  {
    canonicalName: "Phase1TriageHandoffService",
    objectKind: "other",
    boundedContext: "phase1_triage_handoff",
    authoritativeOwner: "Phase 1 triage handoff and ETA engine",
    sourceRef: "prompt/152.md",
  },
  {
    canonicalName: "Phase1EtaEngine",
    objectKind: "other",
    boundedContext: "phase1_triage_handoff",
    authoritativeOwner: "Phase 1 triage handoff and ETA engine",
    sourceRef: "prompt/152.md",
  },
  {
    canonicalName: "Phase3MoreInfoKernelService",
    objectKind: "other",
    boundedContext: "triage_human_checkpoint",
    authoritativeOwner: "Triage domain",
    sourceRef:
      "phase-3-the-human-checkpoint.md#3D. More-info loop, patient response threading, and re-safety / Backend work / MoreInfoCycle",
  },
  {
    canonicalName: "Phase3MoreInfoResponseResafetyService",
    objectKind: "other",
    boundedContext: "triage_human_checkpoint",
    authoritativeOwner: "Triage domain",
    sourceRef:
      "phase-3-the-human-checkpoint.md#3D. More-info loop, patient response threading, and re-safety / Backend work / ResponseAssimilationRecord",
  },
  {
    canonicalName: "Phase3DirectResolutionKernelService",
    objectKind: "other",
    boundedContext: "triage_human_checkpoint",
    authoritativeOwner: "Triage domain",
    sourceRef:
      "phase-3-the-human-checkpoint.md#3G. Direct resolution, downstream handoff seeds, and reopen mechanics / Backend work / direct consequence orchestrator",
  },
  {
    canonicalName: "Phase3CallbackKernelService",
    objectKind: "other",
    boundedContext: "triage_human_checkpoint",
    authoritativeOwner: "Triage domain",
    sourceRef: "prompt/243.md#Mission",
  },
  {
    canonicalName: "Phase3ClinicianMessageKernelService",
    objectKind: "other",
    boundedContext: "triage_human_checkpoint",
    authoritativeOwner: "Triage domain",
    sourceRef: "prompt/244.md#Mission",
  },
  {
    canonicalName: "Phase3EndpointDecisionKernelService",
    objectKind: "other",
    boundedContext: "triage_human_checkpoint",
    authoritativeOwner: "Triage domain",
    sourceRef:
      "phase-3-the-human-checkpoint.md#3E. Endpoint decision engine and resolution model / Backend work / EndpointDecision",
  },
  {
    canonicalName: "Phase3ApprovalEscalationKernelService",
    objectKind: "other",
    boundedContext: "triage_human_checkpoint",
    authoritativeOwner: "Triage domain",
    sourceRef:
      "phase-3-the-human-checkpoint.md#3F. Human approval checkpoint and urgent escalation path / Backend work / ApprovalCheckpoint",
  },
  {
    canonicalName: "Phase3ReopenLaunchKernelService",
    objectKind: "other",
    boundedContext: "triage_human_checkpoint",
    authoritativeOwner: "Triage domain",
    sourceRef:
      "phase-3-the-human-checkpoint.md#3G. Direct resolution, downstream handoff seeds, and reopen mechanics / Backend work / TriageReopenRecord",
  },
  {
    canonicalName: "Phase3TaskCompletionContinuityKernelService",
    objectKind: "other",
    boundedContext: "triage_human_checkpoint",
    authoritativeOwner: "Triage domain",
    sourceRef:
      "prompt/242.md#Mission",
  },
  {
    canonicalName: "Phase3SelfCareBoundaryKernelService",
    objectKind: "other",
    boundedContext: "triage_human_checkpoint",
    authoritativeOwner: "Triage domain",
    sourceRef: "prompt/249.md#Mission",
  },
  {
    canonicalName: "Phase3AdviceRenderKernelService",
    objectKind: "other",
    boundedContext: "triage_human_checkpoint",
    authoritativeOwner: "Triage domain",
    sourceRef: "prompt/250.md#Mission",
  },
] as const satisfies readonly OwnedObjectFamily[];

export const eventFamilies = [] as const satisfies readonly OwnedObjectFamily[];

export const policyFamilies = [] as const satisfies readonly OwnedObjectFamily[];

export const projectionFamilies = [] as const satisfies readonly OwnedObjectFamily[];

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

export * from "./phase1-triage-task";
export * from "./phase3-approval-escalation-kernel";
export * from "./phase3-advice-render-kernel";
export * from "./phase3-callback-kernel";
export * from "./phase3-clinician-message-kernel";
export * from "./phase3-direct-resolution-kernel";
export * from "./phase3-endpoint-decision-kernel";
export * from "./phase3-more-info-kernel";
export * from "./phase3-more-info-response-resafety";
export * from "./phase3-reopen-launch-kernel";
export * from "./phase3-self-care-boundary-kernel";
export * from "./phase3-task-completion-continuity-kernel";
export * from "./phase3-triage-kernel";
