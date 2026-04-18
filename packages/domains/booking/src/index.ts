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
  artifactId: "package_domains_booking",
  packageName: "@vecells/domain-booking",
  packageRole: "domain",
  ownerContextCode: "booking",
  ownerContextLabel: "Booking",
  purpose: "Canonical package home for the Booking bounded context.",
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
  objectFamilyCount: 33,
  contractFamilyCount: 0,
  sourceContexts: ["booking"],
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
    canonicalName: "AdapterContractProfile",
    objectKind: "descriptor",
    boundedContext: "booking",
    authoritativeOwner: "Booking domain",
    sourceRef:
      "phase-4-the-booking-engine.md#4B. Provider capability and adapter compilation / AdapterContractProfile",
  },
  {
    canonicalName: "AppointmentManageCommand",
    objectKind: "other",
    boundedContext: "booking",
    authoritativeOwner: "Booking domain",
    sourceRef:
      "phase-4-the-booking-engine.md#4F. Appointment management: cancel, reschedule, reminders, and detail updates / Backend work / AppointmentManageCommand",
  },
  {
    canonicalName: "AppointmentPresentationArtifact",
    objectKind: "artifact",
    boundedContext: "booking",
    authoritativeOwner: "Booking domain",
    sourceRef:
      "phase-4-the-booking-engine.md#4A. Booking contract, case model, and state machine / Backend work / AppointmentPresentationArtifact",
  },
  {
    canonicalName: "AppointmentRecord",
    objectKind: "record",
    boundedContext: "booking",
    authoritativeOwner: "Booking domain",
    sourceRef:
      "phase-4-the-booking-engine.md#4A. Booking contract, case model, and state machine / Backend work / AppointmentRecord",
  },
  {
    canonicalName: "AssistedBookingSession",
    objectKind: "other",
    boundedContext: "booking",
    authoritativeOwner: "Booking domain",
    sourceRef:
      "phase-4-the-booking-engine.md#4H. Staff booking handoff panel, assisted booking, and exception queue / Backend work / AssistedBookingSession",
  },
  {
    canonicalName: "BookingCapabilityProjection",
    objectKind: "projection",
    boundedContext: "booking",
    authoritativeOwner: "Booking domain",
    sourceRef:
      "phase-4-the-booking-engine.md#4A. Booking contract, case model, and state machine / Backend work / BookingCapabilityProjection",
  },
  {
    canonicalName: "BookingCapabilityResolution",
    objectKind: "other",
    boundedContext: "booking",
    authoritativeOwner: "Booking domain",
    sourceRef:
      "phase-4-the-booking-engine.md#4A. Booking contract, case model, and state machine / Backend work / BookingCapabilityResolution",
  },
  {
    canonicalName: "BookingCase",
    objectKind: "case",
    boundedContext: "booking",
    authoritativeOwner: "Booking domain",
    sourceRef:
      "phase-4-the-booking-engine.md#4A. Booking contract, case model, and state machine / Backend work / BookingCase",
  },
  {
    canonicalName: "BookingContinuityEvidenceProjection",
    objectKind: "projection",
    boundedContext: "booking",
    authoritativeOwner: "Booking domain",
    sourceRef:
      "phase-4-the-booking-engine.md#4F. Appointment management: cancel, reschedule, reminders, and detail updates / Backend work / BookingContinuityEvidenceProjection",
  },
  {
    canonicalName: "BookingException",
    objectKind: "other",
    boundedContext: "booking",
    authoritativeOwner: "Booking domain",
    sourceRef:
      "phase-4-the-booking-engine.md#4A. Booking contract, case model, and state machine / Backend work / BookingException",
  },
  {
    canonicalName: "BookingExceptionQueue",
    objectKind: "other",
    boundedContext: "booking",
    authoritativeOwner: "Booking domain",
    sourceRef:
      "phase-4-the-booking-engine.md#4H. Staff booking handoff panel, assisted booking, and exception queue / Backend work / BookingExceptionQueue",
  },
  {
    canonicalName: "BookingManageSettlement",
    objectKind: "settlement",
    boundedContext: "booking",
    authoritativeOwner: "Booking domain",
    sourceRef:
      "phase-4-the-booking-engine.md#4F. Appointment management: cancel, reschedule, reminders, and detail updates / Backend work / BookingManageSettlement",
  },
  {
    canonicalName: "BookingTransaction",
    objectKind: "other",
    boundedContext: "booking",
    authoritativeOwner: "Booking domain",
    sourceRef:
      "phase-4-the-booking-engine.md#4A. Booking contract, case model, and state machine / Backend work / BookingTransaction",
  },
  {
    canonicalName: "CanonicalSlotIdentity",
    objectKind: "other",
    boundedContext: "booking",
    authoritativeOwner: "Booking domain",
    sourceRef:
      "phase-4-the-booking-engine.md#4C. Slot search, normalisation, and availability snapshots / Backend work / CanonicalSlotIdentity",
  },
  {
    canonicalName: "DependencyDegradationProfile",
    objectKind: "descriptor",
    boundedContext: "booking",
    authoritativeOwner: "Booking domain",
    sourceRef:
      "phase-4-the-booking-engine.md#4B. Provider capability and adapter compilation / DependencyDegradationProfile",
  },
  {
    canonicalName: "NormalizedSlot",
    objectKind: "other",
    boundedContext: "booking",
    authoritativeOwner: "Booking domain",
    sourceRef:
      "phase-4-the-booking-engine.md#4A. Booking contract, case model, and state machine / Backend work / NormalizedSlot",
  },
  {
    canonicalName: "OfferSession",
    objectKind: "other",
    boundedContext: "booking",
    authoritativeOwner: "Booking domain",
    sourceRef:
      "phase-4-the-booking-engine.md#4A. Booking contract, case model, and state machine / Backend work / OfferSession",
  },
  {
    canonicalName: "CapacityRankProof",
    objectKind: "projection",
    boundedContext: "booking",
    authoritativeOwner: "Booking domain",
    sourceRef:
      "phase-0-the-foundation-protocol.md#10.2 Capacity ranking proof",
  },
  {
    canonicalName: "CapacityRankExplanation",
    objectKind: "projection",
    boundedContext: "booking",
    authoritativeOwner: "Booking domain",
    sourceRef:
      "phase-0-the-foundation-protocol.md#10.2 Capacity ranking proof",
  },
  {
    canonicalName: "PatientAppointmentArtifactProjection",
    objectKind: "projection",
    boundedContext: "booking",
    authoritativeOwner: "Booking domain",
    sourceRef:
      "phase-4-the-booking-engine.md#4A. Booking contract, case model, and state machine / Frontend work / PatientAppointmentArtifactProjection",
  },
  {
    canonicalName: "PatientAppointmentListProjection",
    objectKind: "projection",
    boundedContext: "booking",
    authoritativeOwner: "Booking domain",
    sourceRef:
      "phase-4-the-booking-engine.md#4A. Booking contract, case model, and state machine / Frontend work / PatientAppointmentListProjection",
  },
  {
    canonicalName: "PatientAppointmentManageProjection",
    objectKind: "projection",
    boundedContext: "booking",
    authoritativeOwner: "Booking domain",
    sourceRef:
      "phase-4-the-booking-engine.md#4A. Booking contract, case model, and state machine / Frontend work / PatientAppointmentManageProjection",
  },
  {
    canonicalName: "PatientAppointmentWorkspaceProjection",
    objectKind: "projection",
    boundedContext: "booking",
    authoritativeOwner: "Booking domain",
    sourceRef:
      "phase-4-the-booking-engine.md#4A. Booking contract, case model, and state machine / Frontend work / PatientAppointmentWorkspaceProjection",
  },
  {
    canonicalName: "ProviderSearchSlice",
    objectKind: "other",
    boundedContext: "booking",
    authoritativeOwner: "Booking domain",
    sourceRef:
      "phase-4-the-booking-engine.md#4C. Slot search, normalisation, and availability snapshots / Backend work / ProviderSearchSlice",
  },
  {
    canonicalName: "SearchPolicy",
    objectKind: "policy",
    boundedContext: "booking",
    authoritativeOwner: "Booking domain",
    sourceRef:
      "phase-4-the-booking-engine.md#4A. Booking contract, case model, and state machine / Backend work / SearchPolicy",
  },
  {
    canonicalName: "SlotSearchSession",
    objectKind: "other",
    boundedContext: "booking",
    authoritativeOwner: "Booking domain",
    sourceRef:
      "phase-4-the-booking-engine.md#4C. Slot search, normalisation, and availability snapshots / Backend work / SlotSearchSession",
  },
  {
    canonicalName: "SlotSetSnapshot",
    objectKind: "record",
    boundedContext: "booking",
    authoritativeOwner: "Booking domain",
    sourceRef:
      "phase-4-the-booking-engine.md#4A. Booking contract, case model, and state machine / Backend work / SlotSetSnapshot",
  },
  {
    canonicalName: "SlotSnapshotRecoveryState",
    objectKind: "descriptor",
    boundedContext: "booking",
    authoritativeOwner: "Booking domain",
    sourceRef:
      "phase-4-the-booking-engine.md#4C. Slot search, normalisation, and availability snapshots / Backend work / SlotSnapshotRecoveryState",
  },
  {
    canonicalName: "SnapshotCandidateIndex",
    objectKind: "other",
    boundedContext: "booking",
    authoritativeOwner: "Booking domain",
    sourceRef:
      "phase-4-the-booking-engine.md#4A. Booking contract, case model, and state machine / Backend work / SnapshotCandidateIndex",
  },
  {
    canonicalName: "TemporalNormalizationEnvelope",
    objectKind: "record",
    boundedContext: "booking",
    authoritativeOwner: "Booking domain",
    sourceRef:
      "phase-4-the-booking-engine.md#4C. Slot search, normalisation, and availability snapshots / Backend work / TemporalNormalizationEnvelope",
  },
  {
    canonicalName: "WaitlistContinuationTruthProjection",
    objectKind: "projection",
    boundedContext: "booking",
    authoritativeOwner: "Booking domain",
    sourceRef:
      "phase-4-the-booking-engine.md#4A. Booking contract, case model, and state machine / Backend work / WaitlistContinuationTruthProjection",
  },
  {
    canonicalName: "WaitlistDeadlineEvaluation",
    objectKind: "record",
    boundedContext: "booking",
    authoritativeOwner: "Booking domain",
    sourceRef:
      "phase-4-the-booking-engine.md#4A. Booking contract, case model, and state machine / Backend work / WaitlistDeadlineEvaluation",
  },
  {
    canonicalName: "WaitlistEntry",
    objectKind: "other",
    boundedContext: "booking",
    authoritativeOwner: "Booking domain",
    sourceRef:
      "phase-4-the-booking-engine.md#4A. Booking contract, case model, and state machine / Backend work / WaitlistEntry",
  },
  {
    canonicalName: "WaitlistFallbackObligation",
    objectKind: "other",
    boundedContext: "booking",
    authoritativeOwner: "Booking domain",
    sourceRef:
      "phase-4-the-booking-engine.md#4A. Booking contract, case model, and state machine / Backend work / WaitlistFallbackObligation",
  },
  {
    canonicalName: "WaitlistOffer",
    objectKind: "other",
    boundedContext: "booking",
    authoritativeOwner: "Booking domain",
    sourceRef:
      "phase-4-the-booking-engine.md#4A. Booking contract, case model, and state machine / Backend work / WaitlistOffer",
  },
] as const satisfies readonly OwnedObjectFamily[];

export const aggregateFamilies = [
  {
    canonicalName: "AssistedBookingSession",
    objectKind: "other",
    boundedContext: "booking",
    authoritativeOwner: "Booking domain",
    sourceRef:
      "phase-4-the-booking-engine.md#4H. Staff booking handoff panel, assisted booking, and exception queue / Backend work / AssistedBookingSession",
  },
  {
    canonicalName: "BookingCase",
    objectKind: "case",
    boundedContext: "booking",
    authoritativeOwner: "Booking domain",
    sourceRef:
      "phase-4-the-booking-engine.md#4A. Booking contract, case model, and state machine / Backend work / BookingCase",
  },
  {
    canonicalName: "BookingTransaction",
    objectKind: "other",
    boundedContext: "booking",
    authoritativeOwner: "Booking domain",
    sourceRef:
      "phase-4-the-booking-engine.md#4A. Booking contract, case model, and state machine / Backend work / BookingTransaction",
  },
  {
    canonicalName: "OfferSession",
    objectKind: "other",
    boundedContext: "booking",
    authoritativeOwner: "Booking domain",
    sourceRef:
      "phase-4-the-booking-engine.md#4A. Booking contract, case model, and state machine / Backend work / OfferSession",
  },
  {
    canonicalName: "SlotSearchSession",
    objectKind: "other",
    boundedContext: "booking",
    authoritativeOwner: "Booking domain",
    sourceRef:
      "phase-4-the-booking-engine.md#4C. Slot search, normalisation, and availability snapshots / Backend work / SlotSearchSession",
  },
] as const satisfies readonly OwnedObjectFamily[];

export const domainServiceFamilies = [] as const satisfies readonly OwnedObjectFamily[];

export const eventFamilies = [] as const satisfies readonly OwnedObjectFamily[];

export const policyFamilies = [
  {
    canonicalName: "SearchPolicy",
    objectKind: "policy",
    boundedContext: "booking",
    authoritativeOwner: "Booking domain",
    sourceRef:
      "phase-4-the-booking-engine.md#4A. Booking contract, case model, and state machine / Backend work / SearchPolicy",
  },
  {
    canonicalName: "CapacityRankDisclosurePolicy",
    objectKind: "policy",
    boundedContext: "booking",
    authoritativeOwner: "Booking domain",
    sourceRef:
      "phase-0-the-foundation-protocol.md#10.2 Capacity ranking proof",
  },
  {
    canonicalName: "RankPlan",
    objectKind: "policy",
    boundedContext: "booking",
    authoritativeOwner: "Booking domain",
    sourceRef:
      "phase-4-the-booking-engine.md#4D. Slot scoring, offer orchestration, and selection experience / Backend work / RankPlan",
  },
] as const satisfies readonly OwnedObjectFamily[];

export const projectionFamilies = [
  {
    canonicalName: "BookingCapabilityProjection",
    objectKind: "projection",
    boundedContext: "booking",
    authoritativeOwner: "Booking domain",
    sourceRef:
      "phase-4-the-booking-engine.md#4A. Booking contract, case model, and state machine / Backend work / BookingCapabilityProjection",
  },
  {
    canonicalName: "BookingContinuityEvidenceProjection",
    objectKind: "projection",
    boundedContext: "booking",
    authoritativeOwner: "Booking domain",
    sourceRef:
      "phase-4-the-booking-engine.md#4F. Appointment management: cancel, reschedule, reminders, and detail updates / Backend work / BookingContinuityEvidenceProjection",
  },
  {
    canonicalName: "PatientAppointmentArtifactProjection",
    objectKind: "projection",
    boundedContext: "booking",
    authoritativeOwner: "Booking domain",
    sourceRef:
      "phase-4-the-booking-engine.md#4A. Booking contract, case model, and state machine / Frontend work / PatientAppointmentArtifactProjection",
  },
  {
    canonicalName: "PatientAppointmentListProjection",
    objectKind: "projection",
    boundedContext: "booking",
    authoritativeOwner: "Booking domain",
    sourceRef:
      "phase-4-the-booking-engine.md#4A. Booking contract, case model, and state machine / Frontend work / PatientAppointmentListProjection",
  },
  {
    canonicalName: "PatientAppointmentManageProjection",
    objectKind: "projection",
    boundedContext: "booking",
    authoritativeOwner: "Booking domain",
    sourceRef:
      "phase-4-the-booking-engine.md#4A. Booking contract, case model, and state machine / Frontend work / PatientAppointmentManageProjection",
  },
  {
    canonicalName: "PatientAppointmentWorkspaceProjection",
    objectKind: "projection",
    boundedContext: "booking",
    authoritativeOwner: "Booking domain",
    sourceRef:
      "phase-4-the-booking-engine.md#4A. Booking contract, case model, and state machine / Frontend work / PatientAppointmentWorkspaceProjection",
  },
  {
    canonicalName: "WaitlistContinuationTruthProjection",
    objectKind: "projection",
    boundedContext: "booking",
    authoritativeOwner: "Booking domain",
    sourceRef:
      "phase-4-the-booking-engine.md#4A. Booking contract, case model, and state machine / Backend work / WaitlistContinuationTruthProjection",
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

export * from "./phase4-booking-case-kernel";
export * from "./phase4-booking-capability-engine";
export * from "./phase4-slot-search-snapshot-pipeline";
export * from "./phase4-capacity-rank-offer-engine";
export * from "./phase4-booking-commit-engine";
