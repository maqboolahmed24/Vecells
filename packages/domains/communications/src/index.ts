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
  artifactId: "package_domains_communications",
  packageName: "@vecells/domain-communications",
  packageRole: "domain",
  ownerContextCode: "communications",
  ownerContextLabel: "Communications",
  purpose: "Canonical package home for the Communications bounded context.",
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
  objectFamilyCount: 26,
  contractFamilyCount: 0,
  sourceContexts: ["callback_messaging", "phase1_confirmation_dispatch"],
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
    canonicalName: "CallbackAttemptRecord",
    objectKind: "record",
    boundedContext: "callback_messaging",
    authoritativeOwner: "Callback and messaging domain",
    sourceRef:
      "callback-and-clinician-messaging-loop.md#Callback domain / Core object / CallbackAttemptRecord",
  },
  {
    canonicalName: "CallbackCase",
    objectKind: "case",
    boundedContext: "callback_messaging",
    authoritativeOwner: "Callback and messaging domain",
    sourceRef:
      "callback-and-clinician-messaging-loop.md#Callback lifecycle objects and invariants / CallbackCase",
  },
  {
    canonicalName: "CallbackExpectationEnvelope",
    objectKind: "record",
    boundedContext: "callback_messaging",
    authoritativeOwner: "Callback and messaging domain",
    sourceRef:
      "callback-and-clinician-messaging-loop.md#Callback domain / Core object / CallbackExpectationEnvelope",
  },
  {
    canonicalName: "CallbackIntentLease",
    objectKind: "lease",
    boundedContext: "callback_messaging",
    authoritativeOwner: "Callback and messaging domain",
    sourceRef:
      "callback-and-clinician-messaging-loop.md#Callback domain / Core object / CallbackIntentLease",
  },
  {
    canonicalName: "CallbackOutcomeEvidenceBundle",
    objectKind: "bundle",
    boundedContext: "callback_messaging",
    authoritativeOwner: "Callback and messaging domain",
    sourceRef:
      "callback-and-clinician-messaging-loop.md#Callback domain / Core object / CallbackOutcomeEvidenceBundle",
  },
  {
    canonicalName: "CallbackResolutionGate",
    objectKind: "gate",
    boundedContext: "callback_messaging",
    authoritativeOwner: "Callback and messaging domain",
    sourceRef:
      "callback-and-clinician-messaging-loop.md#Callback domain / Core object / CallbackResolutionGate",
  },
  {
    canonicalName: "ClinicianMessageThread",
    objectKind: "thread",
    boundedContext: "callback_messaging",
    authoritativeOwner: "Callback and messaging domain",
    sourceRef:
      "callback-and-clinician-messaging-loop.md#Clinician messaging lifecycle objects and invariants / ClinicianMessageThread",
  },
  {
    canonicalName: "ConversationCommandSettlement",
    objectKind: "record",
    boundedContext: "callback_messaging",
    authoritativeOwner: "Callback and messaging domain",
    sourceRef:
      "callback-and-clinician-messaging-loop.md#Shared staff-facing rules / ConversationCommandSettlement",
  },
  {
    canonicalName: "MessageDeliveryEvidenceBundle",
    objectKind: "bundle",
    boundedContext: "callback_messaging",
    authoritativeOwner: "Callback and messaging domain",
    sourceRef:
      "callback-and-clinician-messaging-loop.md#Clinician message domain / MessageDeliveryEvidenceBundle",
  },
  {
    canonicalName: "MessageDispatchEnvelope",
    objectKind: "record",
    boundedContext: "callback_messaging",
    authoritativeOwner: "Callback and messaging domain",
    sourceRef:
      "callback-and-clinician-messaging-loop.md#Clinician message domain / MessageDispatchEnvelope",
  },
  {
    canonicalName: "Phase1ConfirmationCommunicationEnvelope",
    objectKind: "record",
    boundedContext: "phase1_confirmation_dispatch",
    authoritativeOwner: "Phase 1 confirmation notification pipeline",
    sourceRef:
      "phase-1-the-red-flag-gate.md##1F. Triage handoff, receipt, ETA, and minimal status tracking",
  },
  {
    canonicalName: "Phase1ConfirmationTransportSettlement",
    objectKind: "record",
    boundedContext: "phase1_confirmation_dispatch",
    authoritativeOwner: "Phase 1 confirmation notification pipeline",
    sourceRef:
      "phase-1-the-red-flag-gate.md##1G. Safety instrumentation, observability, and evidence pack",
  },
  {
    canonicalName: "Phase1ConfirmationDeliveryEvidence",
    objectKind: "record",
    boundedContext: "phase1_confirmation_dispatch",
    authoritativeOwner: "Phase 1 confirmation notification pipeline",
    sourceRef:
      "forensic-audit-findings.md#Finding 25 - Delivery receipts, bounce handling, and controlled resend were missing",
  },
  {
    canonicalName: "Phase1ConfirmationReceiptBridge",
    objectKind: "projection",
    boundedContext: "phase1_confirmation_dispatch",
    authoritativeOwner: "Phase 1 confirmation notification pipeline",
    sourceRef: "phase-0-the-foundation-protocol.md#1.23A ReplayCollisionReview",
  },
  {
    canonicalName: "Phase1NotificationMetricsSnapshot",
    objectKind: "projection",
    boundedContext: "phase1_confirmation_dispatch",
    authoritativeOwner: "Phase 1 confirmation notification pipeline",
    sourceRef:
      "phase-1-the-red-flag-gate.md##1G. Safety instrumentation, observability, and evidence pack",
  },
  {
    canonicalName: "PatientComposerLease",
    objectKind: "lease",
    boundedContext: "callback_messaging",
    authoritativeOwner: "Callback and messaging domain",
    sourceRef:
      "callback-and-clinician-messaging-loop.md#Patient conversation surface contract / PatientComposerLease",
  },
  {
    canonicalName: "PatientConversationPreviewDigest",
    objectKind: "projection",
    boundedContext: "callback_messaging",
    authoritativeOwner: "Callback and messaging domain",
    sourceRef:
      "callback-and-clinician-messaging-loop.md#Patient conversation surface contract / PatientConversationPreviewDigest",
  },
  {
    canonicalName: "PatientConversationCluster",
    objectKind: "other",
    boundedContext: "callback_messaging",
    authoritativeOwner: "Callback and messaging domain",
    sourceRef:
      "callback-and-clinician-messaging-loop.md#Patient conversation surface contract / PatientConversationCluster",
  },
  {
    canonicalName: "CommunicationEnvelope",
    objectKind: "projection",
    boundedContext: "callback_messaging",
    authoritativeOwner: "Callback and messaging domain",
    sourceRef: "phase-0-the-foundation-protocol.md#CommunicationEnvelope",
  },
  {
    canonicalName: "ConversationSubthreadProjection",
    objectKind: "projection",
    boundedContext: "callback_messaging",
    authoritativeOwner: "Callback and messaging domain",
    sourceRef: "phase-0-the-foundation-protocol.md#ConversationSubthreadProjection",
  },
  {
    canonicalName: "ConversationThreadProjection",
    objectKind: "projection",
    boundedContext: "callback_messaging",
    authoritativeOwner: "Callback and messaging domain",
    sourceRef: "phase-0-the-foundation-protocol.md#ConversationThreadProjection",
  },
  {
    canonicalName: "PatientCommunicationVisibilityProjection",
    objectKind: "projection",
    boundedContext: "callback_messaging",
    authoritativeOwner: "Callback and messaging domain",
    sourceRef:
      "patient-account-and-communications-blueprint.md#PatientCommunicationVisibilityProjection",
  },
  {
    canonicalName: "PatientReceiptEnvelope",
    objectKind: "projection",
    boundedContext: "callback_messaging",
    authoritativeOwner: "Callback and messaging domain",
    sourceRef:
      "callback-and-clinician-messaging-loop.md#Patient conversation surface contract / PatientReceiptEnvelope",
  },
  {
    canonicalName: "PatientUrgentDiversionState",
    objectKind: "descriptor",
    boundedContext: "callback_messaging",
    authoritativeOwner: "Callback and messaging domain",
    sourceRef:
      "callback-and-clinician-messaging-loop.md#Patient conversation surface contract / PatientUrgentDiversionState",
  },
  {
    canonicalName: "ThreadExpectationEnvelope",
    objectKind: "record",
    boundedContext: "callback_messaging",
    authoritativeOwner: "Callback and messaging domain",
    sourceRef:
      "callback-and-clinician-messaging-loop.md#Clinician message domain / ThreadExpectationEnvelope",
  },
  {
    canonicalName: "ThreadResolutionGate",
    objectKind: "gate",
    boundedContext: "callback_messaging",
    authoritativeOwner: "Callback and messaging domain",
    sourceRef:
      "callback-and-clinician-messaging-loop.md#Clinician message domain / ThreadResolutionGate",
  },
] as const satisfies readonly OwnedObjectFamily[];

export const aggregateFamilies = [
  {
    canonicalName: "CallbackCase",
    objectKind: "case",
    boundedContext: "callback_messaging",
    authoritativeOwner: "Callback and messaging domain",
    sourceRef:
      "callback-and-clinician-messaging-loop.md#Callback lifecycle objects and invariants / CallbackCase",
  },
  {
    canonicalName: "Phase1ConfirmationCommunicationEnvelope",
    objectKind: "record",
    boundedContext: "phase1_confirmation_dispatch",
    authoritativeOwner: "Phase 1 confirmation notification pipeline",
    sourceRef:
      "phase-1-the-red-flag-gate.md##1F. Triage handoff, receipt, ETA, and minimal status tracking",
  },
] as const satisfies readonly OwnedObjectFamily[];

export const domainServiceFamilies = [
  {
    canonicalName: "Phase1ConfirmationDispatchService",
    objectKind: "other",
    boundedContext: "phase1_confirmation_dispatch",
    authoritativeOwner: "Phase 1 confirmation notification pipeline",
    sourceRef:
      "phase-1-the-red-flag-gate.md##1G. Safety instrumentation, observability, and evidence pack",
  },
] as const satisfies readonly OwnedObjectFamily[];

export const eventFamilies = [
  {
    canonicalName: "Phase1ConfirmationTransportSettlement",
    objectKind: "record",
    boundedContext: "phase1_confirmation_dispatch",
    authoritativeOwner: "Phase 1 confirmation notification pipeline",
    sourceRef: "phase-0-the-foundation-protocol.md#communication.*",
  },
  {
    canonicalName: "Phase1ConfirmationDeliveryEvidence",
    objectKind: "record",
    boundedContext: "phase1_confirmation_dispatch",
    authoritativeOwner: "Phase 1 confirmation notification pipeline",
    sourceRef: "phase-0-the-foundation-protocol.md#communication.*",
  },
] as const satisfies readonly OwnedObjectFamily[];

export const policyFamilies = [
  {
    canonicalName: "CallbackResolutionGate",
    objectKind: "gate",
    boundedContext: "callback_messaging",
    authoritativeOwner: "Callback and messaging domain",
    sourceRef:
      "callback-and-clinician-messaging-loop.md#Callback domain / Core object / CallbackResolutionGate",
  },
  {
    canonicalName: "ThreadResolutionGate",
    objectKind: "gate",
    boundedContext: "callback_messaging",
    authoritativeOwner: "Callback and messaging domain",
    sourceRef:
      "callback-and-clinician-messaging-loop.md#Clinician message domain / ThreadResolutionGate",
  },
] as const satisfies readonly OwnedObjectFamily[];

export const projectionFamilies = [
  {
    canonicalName: "Phase1ConfirmationReceiptBridge",
    objectKind: "projection",
    boundedContext: "phase1_confirmation_dispatch",
    authoritativeOwner: "Phase 1 confirmation notification pipeline",
    sourceRef: "phase-0-the-foundation-protocol.md#1.23A ReplayCollisionReview",
  },
  {
    canonicalName: "Phase1NotificationMetricsSnapshot",
    objectKind: "projection",
    boundedContext: "phase1_confirmation_dispatch",
    authoritativeOwner: "Phase 1 confirmation notification pipeline",
    sourceRef:
      "phase-1-the-red-flag-gate.md##1G. Safety instrumentation, observability, and evidence pack",
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

export * from "./phase1-confirmation-dispatch";
export * from "./phase3-conversation-control-kernel";
export * from "./phase3-patient-conversation-tuple";
