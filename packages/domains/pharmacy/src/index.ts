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
  artifactId: "package_domains_pharmacy",
  packageName: "@vecells/domain-pharmacy",
  packageRole: "domain",
  ownerContextCode: "pharmacy",
  ownerContextLabel: "Pharmacy",
  purpose: "Canonical package home for the Pharmacy bounded context.",
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
  objectFamilyCount: 39,
  contractFamilyCount: 0,
  sourceContexts: ["pharmacy"],
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
    canonicalName: "DispatchAdapterBinding",
    objectKind: "descriptor",
    boundedContext: "pharmacy",
    authoritativeOwner: "Pharmacy loop domain",
    sourceRef:
      "phase-6-the-pharmacy-loop.md#6D. Referral pack composer, dispatch adapters, and transport contract / Backend work / DispatchAdapterBinding",
  },
  {
    canonicalName: "DispatchProofEnvelope",
    objectKind: "record",
    boundedContext: "pharmacy",
    authoritativeOwner: "Pharmacy loop domain",
    sourceRef:
      "phase-6-the-pharmacy-loop.md#6D. Referral pack composer, dispatch adapters, and transport contract / Backend work / DispatchProofEnvelope",
  },
  {
    canonicalName: "EligibilityExplanationBundle",
    objectKind: "bundle",
    boundedContext: "pharmacy",
    authoritativeOwner: "Pharmacy loop domain",
    sourceRef:
      "phase-6-the-pharmacy-loop.md#6B. Eligibility engine, pathway rules, and versioned policy packs / Backend work / EligibilityExplanationBundle",
  },
  {
    canonicalName: "ManualDispatchAssistanceRecord",
    objectKind: "record",
    boundedContext: "pharmacy",
    authoritativeOwner: "Pharmacy loop domain",
    sourceRef:
      "phase-6-the-pharmacy-loop.md#6D. Referral pack composer, dispatch adapters, and transport contract / Backend work / ManualDispatchAssistanceRecord",
  },
  {
    canonicalName: "OutcomeEvidenceEnvelope",
    objectKind: "record",
    boundedContext: "pharmacy",
    authoritativeOwner: "Pharmacy loop domain",
    sourceRef:
      "phase-6-the-pharmacy-loop.md#6F. Outcome ingest, Update Record observation, and reconciliation / Backend work / OutcomeEvidenceEnvelope",
  },
  {
    canonicalName: "PathwayDefinition",
    objectKind: "other",
    boundedContext: "pharmacy",
    authoritativeOwner: "Pharmacy loop domain",
    sourceRef:
      "phase-6-the-pharmacy-loop.md#6B. Eligibility engine, pathway rules, and versioned policy packs / Backend work / PathwayDefinition",
  },
  {
    canonicalName: "PathwayEligibilityEvaluation",
    objectKind: "record",
    boundedContext: "pharmacy",
    authoritativeOwner: "Pharmacy loop domain",
    sourceRef:
      "phase-6-the-pharmacy-loop.md#6A. Pharmacy contract, case model, and state machine / Backend work / PathwayEligibilityEvaluation",
  },
  {
    canonicalName: "PathwayTimingGuardrail",
    objectKind: "other",
    boundedContext: "pharmacy",
    authoritativeOwner: "Pharmacy loop domain",
    sourceRef:
      "phase-6-the-pharmacy-loop.md#6B. Eligibility engine, pathway rules, and versioned policy packs / Backend work / PathwayTimingGuardrail",
  },
  {
    canonicalName: "PharmacyBounceBackRecord",
    objectKind: "record",
    boundedContext: "pharmacy",
    authoritativeOwner: "Pharmacy loop domain",
    sourceRef:
      "phase-6-the-pharmacy-loop.md#6A. Pharmacy contract, case model, and state machine / Backend work / PharmacyBounceBackRecord",
  },
  {
    canonicalName: "PharmacyCase",
    objectKind: "case",
    boundedContext: "pharmacy",
    authoritativeOwner: "Pharmacy loop domain",
    sourceRef:
      "phase-6-the-pharmacy-loop.md#6A. Pharmacy contract, case model, and state machine / Backend work / PharmacyCase",
  },
  {
    canonicalName: "PharmacyChoiceDisclosurePolicy",
    objectKind: "policy",
    boundedContext: "pharmacy",
    authoritativeOwner: "Pharmacy loop domain",
    sourceRef:
      "phase-6-the-pharmacy-loop.md#6A. Pharmacy contract, case model, and state machine / Backend work / PharmacyChoiceDisclosurePolicy",
  },
  {
    canonicalName: "PharmacyChoiceExplanation",
    objectKind: "other",
    boundedContext: "pharmacy",
    authoritativeOwner: "Pharmacy loop domain",
    sourceRef:
      "phase-6-the-pharmacy-loop.md#6A. Pharmacy contract, case model, and state machine / Backend work / PharmacyChoiceExplanation",
  },
  {
    canonicalName: "PharmacyChoiceOverrideAcknowledgement",
    objectKind: "other",
    boundedContext: "pharmacy",
    authoritativeOwner: "Pharmacy loop domain",
    sourceRef:
      "phase-6-the-pharmacy-loop.md#6A. Pharmacy contract, case model, and state machine / Backend work / PharmacyChoiceOverrideAcknowledgement",
  },
  {
    canonicalName: "PharmacyChoiceProof",
    objectKind: "other",
    boundedContext: "pharmacy",
    authoritativeOwner: "Pharmacy loop domain",
    sourceRef:
      "phase-6-the-pharmacy-loop.md#6A. Pharmacy contract, case model, and state machine / Backend work / PharmacyChoiceProof",
  },
  {
    canonicalName: "PharmacyChoiceSession",
    objectKind: "other",
    boundedContext: "pharmacy",
    authoritativeOwner: "Pharmacy loop domain",
    sourceRef:
      "phase-6-the-pharmacy-loop.md#6A. Pharmacy contract, case model, and state machine / Backend work / PharmacyChoiceSession",
  },
  {
    canonicalName: "PharmacyChoiceTruthProjection",
    objectKind: "projection",
    boundedContext: "pharmacy",
    authoritativeOwner: "Pharmacy loop domain",
    sourceRef:
      "phase-6-the-pharmacy-loop.md#6C. Pharmacy discovery, provider choice, and directory abstraction / Backend work / PharmacyChoiceTruthProjection",
  },
  {
    canonicalName: "PharmacyConsentCheckpoint",
    objectKind: "checkpoint",
    boundedContext: "pharmacy",
    authoritativeOwner: "Pharmacy loop domain",
    sourceRef:
      "phase-6-the-pharmacy-loop.md#6A. Pharmacy contract, case model, and state machine / Backend work / PharmacyConsentCheckpoint",
  },
  {
    canonicalName: "PharmacyConsentRecord",
    objectKind: "record",
    boundedContext: "pharmacy",
    authoritativeOwner: "Pharmacy loop domain",
    sourceRef:
      "phase-6-the-pharmacy-loop.md#6A. Pharmacy contract, case model, and state machine / Backend work / PharmacyConsentRecord",
  },
  {
    canonicalName: "PharmacyConsentRevocationRecord",
    objectKind: "record",
    boundedContext: "pharmacy",
    authoritativeOwner: "Pharmacy loop domain",
    sourceRef:
      "phase-6-the-pharmacy-loop.md#6A. Pharmacy contract, case model, and state machine / Backend work / PharmacyConsentRevocationRecord",
  },
  {
    canonicalName: "PharmacyContinuityEvidenceProjection",
    objectKind: "projection",
    boundedContext: "pharmacy",
    authoritativeOwner: "Pharmacy loop domain",
    sourceRef:
      "phase-6-the-pharmacy-loop.md#6D. Referral pack composer, dispatch adapters, and transport contract / Backend work / PharmacyContinuityEvidenceProjection",
  },
  {
    canonicalName: "PharmacyDirectorySnapshot",
    objectKind: "record",
    boundedContext: "pharmacy",
    authoritativeOwner: "Pharmacy loop domain",
    sourceRef:
      "phase-6-the-pharmacy-loop.md#6A. Pharmacy contract, case model, and state machine / Backend work / PharmacyDirectorySnapshot",
  },
  {
    canonicalName: "PharmacyDirectorySourceSnapshot",
    objectKind: "record",
    boundedContext: "pharmacy",
    authoritativeOwner: "Pharmacy loop domain",
    sourceRef:
      "phase-6-the-pharmacy-loop.md#6A. Pharmacy contract, case model, and state machine / Backend work / PharmacyDirectorySourceSnapshot",
  },
  {
    canonicalName: "PharmacyDispatchAttempt",
    objectKind: "record",
    boundedContext: "pharmacy",
    authoritativeOwner: "Pharmacy loop domain",
    sourceRef:
      "phase-6-the-pharmacy-loop.md#6A. Pharmacy contract, case model, and state machine / Backend work / PharmacyDispatchAttempt",
  },
  {
    canonicalName: "PharmacyDispatchPlan",
    objectKind: "other",
    boundedContext: "pharmacy",
    authoritativeOwner: "Pharmacy loop domain",
    sourceRef:
      "phase-6-the-pharmacy-loop.md#6A. Pharmacy contract, case model, and state machine / Backend work / PharmacyDispatchPlan",
  },
  {
    canonicalName: "PharmacyDispatchSettlement",
    objectKind: "settlement",
    boundedContext: "pharmacy",
    authoritativeOwner: "Pharmacy loop domain",
    sourceRef:
      "phase-6-the-pharmacy-loop.md#6D. Referral pack composer, dispatch adapters, and transport contract / Backend work / PharmacyDispatchSettlement",
  },
  {
    canonicalName: "PharmacyDispatchTruthProjection",
    objectKind: "projection",
    boundedContext: "pharmacy",
    authoritativeOwner: "Pharmacy loop domain",
    sourceRef:
      "phase-6-the-pharmacy-loop.md#6D. Referral pack composer, dispatch adapters, and transport contract / Backend work / PharmacyDispatchTruthProjection",
  },
  {
    canonicalName: "PharmacyOutcomeIngestAttempt",
    objectKind: "record",
    boundedContext: "pharmacy",
    authoritativeOwner: "Pharmacy loop domain",
    sourceRef:
      "phase-6-the-pharmacy-loop.md#6F. Outcome ingest, Update Record observation, and reconciliation / Backend work / PharmacyOutcomeIngestAttempt",
  },
  {
    canonicalName: "PharmacyOutcomeReconciliationGate",
    objectKind: "gate",
    boundedContext: "pharmacy",
    authoritativeOwner: "Pharmacy loop domain",
    sourceRef:
      "phase-6-the-pharmacy-loop.md#6F. Outcome ingest, Update Record observation, and reconciliation / Backend work / PharmacyOutcomeReconciliationGate",
  },
  {
    canonicalName: "PharmacyOutcomeRecord",
    objectKind: "record",
    boundedContext: "pharmacy",
    authoritativeOwner: "Pharmacy loop domain",
    sourceRef:
      "phase-6-the-pharmacy-loop.md#6A. Pharmacy contract, case model, and state machine / Backend work / PharmacyOutcomeRecord",
  },
  {
    canonicalName: "PharmacyOutcomeSettlement",
    objectKind: "settlement",
    boundedContext: "pharmacy",
    authoritativeOwner: "Pharmacy loop domain",
    sourceRef:
      "phase-6-the-pharmacy-loop.md#6F. Outcome ingest, Update Record observation, and reconciliation / Backend work / PharmacyOutcomeSettlement",
  },
  {
    canonicalName: "PharmacyOutcomeTruthProjection",
    objectKind: "projection",
    boundedContext: "pharmacy",
    authoritativeOwner: "Pharmacy loop domain",
    sourceRef:
      "phase-6-the-pharmacy-loop.md#6F. Outcome ingest, Update Record observation, and reconciliation / Backend work / PharmacyOutcomeTruthProjection",
  },
  {
    canonicalName: "PharmacyProvider",
    objectKind: "other",
    boundedContext: "pharmacy",
    authoritativeOwner: "Pharmacy loop domain",
    sourceRef:
      "phase-6-the-pharmacy-loop.md#6A. Pharmacy contract, case model, and state machine / Backend work / PharmacyProvider",
  },
  {
    canonicalName: "PharmacyProviderCapabilitySnapshot",
    objectKind: "record",
    boundedContext: "pharmacy",
    authoritativeOwner: "Pharmacy loop domain",
    sourceRef:
      "phase-6-the-pharmacy-loop.md#6A. Pharmacy contract, case model, and state machine / Backend work / PharmacyProviderCapabilitySnapshot",
  },
  {
    canonicalName: "PharmacyReachabilityPlan",
    objectKind: "other",
    boundedContext: "pharmacy",
    authoritativeOwner: "Pharmacy loop domain",
    sourceRef:
      "phase-6-the-pharmacy-loop.md#6A. Pharmacy contract, case model, and state machine / Backend work / PharmacyReachabilityPlan",
  },
  {
    canonicalName: "PharmacyReferralPackage",
    objectKind: "bundle",
    boundedContext: "pharmacy",
    authoritativeOwner: "Pharmacy loop domain",
    sourceRef:
      "phase-6-the-pharmacy-loop.md#6A. Pharmacy contract, case model, and state machine / Backend work / PharmacyReferralPackage",
  },
  {
    canonicalName: "PharmacyRulePack",
    objectKind: "bundle",
    boundedContext: "pharmacy",
    authoritativeOwner: "Pharmacy loop domain",
    sourceRef:
      "phase-6-the-pharmacy-loop.md#6B. Eligibility engine, pathway rules, and versioned policy packs / Backend work / PharmacyRulePack",
  },
  {
    canonicalName: "ReferralArtifactManifest",
    objectKind: "manifest",
    boundedContext: "pharmacy",
    authoritativeOwner: "Pharmacy loop domain",
    sourceRef:
      "phase-6-the-pharmacy-loop.md#6D. Referral pack composer, dispatch adapters, and transport contract / Backend work / ReferralArtifactManifest",
  },
  {
    canonicalName: "ServiceTypeDecision",
    objectKind: "record",
    boundedContext: "pharmacy",
    authoritativeOwner: "Pharmacy loop domain",
    sourceRef:
      "phase-6-the-pharmacy-loop.md#6A. Pharmacy contract, case model, and state machine / Backend work / ServiceTypeDecision",
  },
  {
    canonicalName: "TransportAssuranceProfile",
    objectKind: "descriptor",
    boundedContext: "pharmacy",
    authoritativeOwner: "Pharmacy loop domain",
    sourceRef:
      "phase-6-the-pharmacy-loop.md#6D. Referral pack composer, dispatch adapters, and transport contract / Backend work / TransportAssuranceProfile",
  },
] as const satisfies readonly OwnedObjectFamily[];

export const aggregateFamilies = [
  {
    canonicalName: "PharmacyCase",
    objectKind: "case",
    boundedContext: "pharmacy",
    authoritativeOwner: "Pharmacy loop domain",
    sourceRef:
      "phase-6-the-pharmacy-loop.md#6A. Pharmacy contract, case model, and state machine / Backend work / PharmacyCase",
  },
  {
    canonicalName: "PharmacyChoiceSession",
    objectKind: "other",
    boundedContext: "pharmacy",
    authoritativeOwner: "Pharmacy loop domain",
    sourceRef:
      "phase-6-the-pharmacy-loop.md#6A. Pharmacy contract, case model, and state machine / Backend work / PharmacyChoiceSession",
  },
] as const satisfies readonly OwnedObjectFamily[];

export const domainServiceFamilies = [
  {
    canonicalName: "ServiceTypeDecision",
    objectKind: "record",
    boundedContext: "pharmacy",
    authoritativeOwner: "Pharmacy loop domain",
    sourceRef:
      "phase-6-the-pharmacy-loop.md#6A. Pharmacy contract, case model, and state machine / Backend work / ServiceTypeDecision",
  },
] as const satisfies readonly OwnedObjectFamily[];

export const eventFamilies = [] as const satisfies readonly OwnedObjectFamily[];

export const policyFamilies = [
  {
    canonicalName: "EligibilityExplanationBundle",
    objectKind: "bundle",
    boundedContext: "pharmacy",
    authoritativeOwner: "Pharmacy loop domain",
    sourceRef:
      "phase-6-the-pharmacy-loop.md#6B. Eligibility engine, pathway rules, and versioned policy packs / Backend work / EligibilityExplanationBundle",
  },
  {
    canonicalName: "PathwayEligibilityEvaluation",
    objectKind: "record",
    boundedContext: "pharmacy",
    authoritativeOwner: "Pharmacy loop domain",
    sourceRef:
      "phase-6-the-pharmacy-loop.md#6A. Pharmacy contract, case model, and state machine / Backend work / PathwayEligibilityEvaluation",
  },
  {
    canonicalName: "PathwayTimingGuardrail",
    objectKind: "other",
    boundedContext: "pharmacy",
    authoritativeOwner: "Pharmacy loop domain",
    sourceRef:
      "phase-6-the-pharmacy-loop.md#6B. Eligibility engine, pathway rules, and versioned policy packs / Backend work / PathwayTimingGuardrail",
  },
  {
    canonicalName: "PharmacyChoiceDisclosurePolicy",
    objectKind: "policy",
    boundedContext: "pharmacy",
    authoritativeOwner: "Pharmacy loop domain",
    sourceRef:
      "phase-6-the-pharmacy-loop.md#6A. Pharmacy contract, case model, and state machine / Backend work / PharmacyChoiceDisclosurePolicy",
  },
  {
    canonicalName: "PharmacyOutcomeReconciliationGate",
    objectKind: "gate",
    boundedContext: "pharmacy",
    authoritativeOwner: "Pharmacy loop domain",
    sourceRef:
      "phase-6-the-pharmacy-loop.md#6F. Outcome ingest, Update Record observation, and reconciliation / Backend work / PharmacyOutcomeReconciliationGate",
  },
] as const satisfies readonly OwnedObjectFamily[];

export const projectionFamilies = [
  {
    canonicalName: "PharmacyChoiceTruthProjection",
    objectKind: "projection",
    boundedContext: "pharmacy",
    authoritativeOwner: "Pharmacy loop domain",
    sourceRef:
      "phase-6-the-pharmacy-loop.md#6C. Pharmacy discovery, provider choice, and directory abstraction / Backend work / PharmacyChoiceTruthProjection",
  },
  {
    canonicalName: "PharmacyContinuityEvidenceProjection",
    objectKind: "projection",
    boundedContext: "pharmacy",
    authoritativeOwner: "Pharmacy loop domain",
    sourceRef:
      "phase-6-the-pharmacy-loop.md#6D. Referral pack composer, dispatch adapters, and transport contract / Backend work / PharmacyContinuityEvidenceProjection",
  },
  {
    canonicalName: "PharmacyDispatchTruthProjection",
    objectKind: "projection",
    boundedContext: "pharmacy",
    authoritativeOwner: "Pharmacy loop domain",
    sourceRef:
      "phase-6-the-pharmacy-loop.md#6D. Referral pack composer, dispatch adapters, and transport contract / Backend work / PharmacyDispatchTruthProjection",
  },
  {
    canonicalName: "PharmacyOutcomeTruthProjection",
    objectKind: "projection",
    boundedContext: "pharmacy",
    authoritativeOwner: "Pharmacy loop domain",
    sourceRef:
      "phase-6-the-pharmacy-loop.md#6F. Outcome ingest, Update Record observation, and reconciliation / Backend work / PharmacyOutcomeTruthProjection",
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
