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
    "packages/fhir-mapping",
    "packages/domains/identity_access public exports",
    "packages/domains/intake_safety public exports",
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
    "CBC_049_DOMAIN_PACKAGES_TO_FHIR_MAPPING",
    "CBC_041_DOMAIN_PACKAGES_TO_DOMAIN_IDENTITY_ACCESS_PUBLIC_EXPORTS",
    "CBC_041_DOMAIN_PACKAGES_TO_DOMAIN_INTAKE_SAFETY_PUBLIC_EXPORTS",
  ],
  objectFamilyCount: 74,
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
    canonicalName: "PharmacyBounceBackEvidenceEnvelope",
    objectKind: "record",
    boundedContext: "pharmacy",
    authoritativeOwner: "Pharmacy loop domain",
    sourceRef:
      "phase-6-the-pharmacy-loop.md#6G. Bounce-back, urgent return, and reopen mechanics / Backend work / typed bounce-back evidence normalization",
  },
  {
    canonicalName: "PharmacyBounceBackSupervisorReview",
    objectKind: "record",
    boundedContext: "pharmacy",
    authoritativeOwner: "Pharmacy loop domain",
    sourceRef:
      "phase-6-the-pharmacy-loop.md#6G. Bounce-back, urgent return, and reopen mechanics / Backend work / supervisor escalation when repeated returns or non-material loops are detected",
  },
  {
    canonicalName: "PharmacyBounceBackTruthProjection",
    objectKind: "projection",
    boundedContext: "pharmacy",
    authoritativeOwner: "Pharmacy loop domain",
    sourceRef:
      "phase-6-the-pharmacy-loop.md#6G. Bounce-back, urgent return, and reopen mechanics / Backend work / patient-safe and staff-safe reopen truth",
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
    canonicalName: "PharmacyPracticeVisibilityProjection",
    objectKind: "projection",
    boundedContext: "pharmacy",
    authoritativeOwner: "Pharmacy loop domain",
    sourceRef:
      "phase-6-the-pharmacy-loop.md#6H. Practice visibility, operations queue, and pharmacy exception handling / Backend work / practice visibility model",
  },
  {
    canonicalName: "PharmacyActiveCasesProjection",
    objectKind: "projection",
    boundedContext: "pharmacy",
    authoritativeOwner: "Pharmacy loop domain",
    sourceRef:
      "phase-6-the-pharmacy-loop.md#6H. Practice visibility, operations queue, and pharmacy exception handling / Backend work / pharmacy_active_cases_projection",
  },
  {
    canonicalName: "PharmacyWaitingForChoiceProjection",
    objectKind: "projection",
    boundedContext: "pharmacy",
    authoritativeOwner: "Pharmacy loop domain",
    sourceRef:
      "phase-6-the-pharmacy-loop.md#6H. Practice visibility, operations queue, and pharmacy exception handling / Backend work / pharmacy_waiting_for_choice_projection",
  },
  {
    canonicalName: "PharmacyDispatchedWaitingOutcomeProjection",
    objectKind: "projection",
    boundedContext: "pharmacy",
    authoritativeOwner: "Pharmacy loop domain",
    sourceRef:
      "phase-6-the-pharmacy-loop.md#6H. Practice visibility, operations queue, and pharmacy exception handling / Backend work / pharmacy_dispatched_waiting_outcome_projection",
  },
  {
    canonicalName: "PharmacyBounceBackProjection",
    objectKind: "projection",
    boundedContext: "pharmacy",
    authoritativeOwner: "Pharmacy loop domain",
    sourceRef:
      "phase-6-the-pharmacy-loop.md#6H. Practice visibility, operations queue, and pharmacy exception handling / Backend work / pharmacy_bounce_back_projection",
  },
  {
    canonicalName: "PharmacyDispatchExceptionProjection",
    objectKind: "projection",
    boundedContext: "pharmacy",
    authoritativeOwner: "Pharmacy loop domain",
    sourceRef:
      "phase-6-the-pharmacy-loop.md#6H. Practice visibility, operations queue, and pharmacy exception handling / Backend work / pharmacy_dispatch_exception_projection",
  },
  {
    canonicalName: "PharmacyProviderHealthProjection",
    objectKind: "projection",
    boundedContext: "pharmacy",
    authoritativeOwner: "Pharmacy loop domain",
    sourceRef:
      "phase-6-the-pharmacy-loop.md#6H. Practice visibility, operations queue, and pharmacy exception handling / Backend work / pharmacy_provider_health_projection",
  },
  {
    canonicalName: "PharmacyOperationsAuditEvent",
    objectKind: "record",
    boundedContext: "pharmacy",
    authoritativeOwner: "Pharmacy loop domain",
    sourceRef:
      "phase-6-the-pharmacy-loop.md#6H. Practice visibility, operations queue, and pharmacy exception handling / Backend work / queue and provider-health audit evidence",
  },
  {
    canonicalName: "PharmacyPatientStatusProjection",
    objectKind: "projection",
    boundedContext: "pharmacy",
    authoritativeOwner: "Pharmacy loop domain",
    sourceRef:
      "phase-6-the-pharmacy-loop.md#6E. Patient instructions, referral status, and pharmacy-facing UX logic / Backend work / PharmacyPatientStatusProjection",
  },
  {
    canonicalName: "PharmacyPatientProviderSummary",
    objectKind: "projection",
    boundedContext: "pharmacy",
    authoritativeOwner: "Pharmacy loop domain",
    sourceRef:
      "phase-6-the-pharmacy-loop.md#6E. Patient instructions, referral status, and pharmacy-facing UX logic / Backend work / PharmacyPatientProviderSummary",
  },
  {
    canonicalName: "PharmacyPatientReferralReferenceSummary",
    objectKind: "projection",
    boundedContext: "pharmacy",
    authoritativeOwner: "Pharmacy loop domain",
    sourceRef:
      "phase-6-the-pharmacy-loop.md#6E. Patient instructions, referral status, and pharmacy-facing UX logic / Backend work / PharmacyPatientReferralReferenceSummary",
  },
  {
    canonicalName: "PharmacyPatientReachabilityRepairProjection",
    objectKind: "projection",
    boundedContext: "pharmacy",
    authoritativeOwner: "Pharmacy loop domain",
    sourceRef:
      "phase-6-the-pharmacy-loop.md#6E. Patient instructions, referral status, and pharmacy-facing UX logic / Backend work / PharmacyPatientReachabilityRepairProjection",
  },
  {
    canonicalName: "PharmacyPatientContinuityProjection",
    objectKind: "projection",
    boundedContext: "pharmacy",
    authoritativeOwner: "Pharmacy loop domain",
    sourceRef:
      "phase-6-the-pharmacy-loop.md#6E. Patient instructions, referral status, and pharmacy-facing UX logic / Backend work / PharmacyPatientContinuityProjection",
  },
  {
    canonicalName: "PharmacyPatientInstructionPanel",
    objectKind: "projection",
    boundedContext: "pharmacy",
    authoritativeOwner: "Pharmacy loop domain",
    sourceRef:
      "phase-6-the-pharmacy-loop.md#6E. Patient instructions, referral status, and pharmacy-facing UX logic / Backend work / PharmacyPatientInstructionPanel",
  },
  {
    canonicalName: "PharmacyPatientStatusAuditEvent",
    objectKind: "record",
    boundedContext: "pharmacy",
    authoritativeOwner: "Pharmacy loop domain",
    sourceRef:
      "phase-6-the-pharmacy-loop.md#6E. Patient instructions, referral status, and pharmacy-facing UX logic / Backend work / PharmacyPatientStatusAuditEvent",
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
    canonicalName: "PharmacyReturnNotificationTrigger",
    objectKind: "record",
    boundedContext: "pharmacy",
    authoritativeOwner: "Pharmacy loop domain",
    sourceRef:
      "phase-6-the-pharmacy-loop.md#6G. Bounce-back, urgent return, and reopen mechanics / Backend work / notify patient of next step",
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
  {
    canonicalName: "UrgentReturnDirectRouteProfile",
    objectKind: "descriptor",
    boundedContext: "pharmacy",
    authoritativeOwner: "Pharmacy loop domain",
    sourceRef:
      "phase-6-the-pharmacy-loop.md#6G. Bounce-back, urgent return, and reopen mechanics / Backend work / urgent-return channel and monitored-email routing metadata",
  },
  {
    canonicalName: "InventoryComparisonFence",
    objectKind: "gate",
    boundedContext: "pharmacy",
    authoritativeOwner: "Pharmacy console backend",
    sourceRef:
      "pharmacy-console-frontend-architecture.md#16.-Front-end-projection-set / Backend work / InventoryComparisonFence",
  },
  {
    canonicalName: "SupplyComputation",
    objectKind: "other",
    boundedContext: "pharmacy",
    authoritativeOwner: "Pharmacy console backend",
    sourceRef:
      "pharmacy-console-frontend-architecture.md#5.-Medication-line-item-cards / Backend work / SupplyComputation",
  },
  {
    canonicalName: "PharmacyConsoleSummaryProjection",
    objectKind: "projection",
    boundedContext: "pharmacy",
    authoritativeOwner: "Pharmacy console backend",
    sourceRef:
      "pharmacy-console-frontend-architecture.md#16.-Front-end-projection-set / Backend work / PharmacyConsoleSummaryProjection",
  },
  {
    canonicalName: "PharmacyConsoleWorklistProjection",
    objectKind: "projection",
    boundedContext: "pharmacy",
    authoritativeOwner: "Pharmacy console backend",
    sourceRef:
      "pharmacy-console-frontend-architecture.md#16.-Front-end-projection-set / Backend work / PharmacyConsoleWorklistProjection",
  },
  {
    canonicalName: "PharmacyCaseWorkbenchProjection",
    objectKind: "projection",
    boundedContext: "pharmacy",
    authoritativeOwner: "Pharmacy console backend",
    sourceRef:
      "pharmacy-console-frontend-architecture.md#16.-Front-end-projection-set / Backend work / PharmacyCaseWorkbenchProjection",
  },
  {
    canonicalName: "PharmacyMissionProjection",
    objectKind: "projection",
    boundedContext: "pharmacy",
    authoritativeOwner: "Pharmacy console backend",
    sourceRef:
      "pharmacy-console-frontend-architecture.md#16.-Front-end-projection-set / Backend work / PharmacyMissionProjection",
  },
  {
    canonicalName: "MedicationValidationProjection",
    objectKind: "projection",
    boundedContext: "pharmacy",
    authoritativeOwner: "Pharmacy console backend",
    sourceRef:
      "pharmacy-console-frontend-architecture.md#16.-Front-end-projection-set / Backend work / MedicationValidationProjection",
  },
  {
    canonicalName: "InventoryTruthProjection",
    objectKind: "projection",
    boundedContext: "pharmacy",
    authoritativeOwner: "Pharmacy console backend",
    sourceRef:
      "pharmacy-console-frontend-architecture.md#16.-Front-end-projection-set / Backend work / InventoryTruthProjection",
  },
  {
    canonicalName: "InventoryComparisonProjection",
    objectKind: "projection",
    boundedContext: "pharmacy",
    authoritativeOwner: "Pharmacy console backend",
    sourceRef:
      "pharmacy-console-frontend-architecture.md#16.-Front-end-projection-set / Backend work / InventoryComparisonProjection",
  },
  {
    canonicalName: "PharmacyHandoffProjection",
    objectKind: "projection",
    boundedContext: "pharmacy",
    authoritativeOwner: "Pharmacy console backend",
    sourceRef:
      "pharmacy-console-frontend-architecture.md#16.-Front-end-projection-set / Backend work / PharmacyHandoffProjection",
  },
  {
    canonicalName: "PharmacyHandoffWatchProjection",
    objectKind: "projection",
    boundedContext: "pharmacy",
    authoritativeOwner: "Pharmacy console backend",
    sourceRef:
      "pharmacy-console-frontend-architecture.md#16.-Front-end-projection-set / Backend work / PharmacyHandoffWatchProjection",
  },
  {
    canonicalName: "PharmacyActionSettlementProjection",
    objectKind: "projection",
    boundedContext: "pharmacy",
    authoritativeOwner: "Pharmacy console backend",
    sourceRef:
      "pharmacy-console-frontend-architecture.md#16.-Front-end-projection-set / Backend work / PharmacyActionSettlementProjection",
  },
  {
    canonicalName: "PharmacyConsentCheckpointProjection",
    objectKind: "projection",
    boundedContext: "pharmacy",
    authoritativeOwner: "Pharmacy console backend",
    sourceRef:
      "pharmacy-console-frontend-architecture.md#16.-Front-end-projection-set / Backend work / PharmacyConsentCheckpointProjection",
  },
  {
    canonicalName: "PharmacyConsoleContinuityEvidenceProjection",
    objectKind: "projection",
    boundedContext: "pharmacy",
    authoritativeOwner: "Pharmacy console backend",
    sourceRef:
      "pharmacy-console-frontend-architecture.md#16.-Front-end-projection-set / Backend work / PharmacyConsoleContinuityEvidenceProjection",
  },
  {
    canonicalName: "PharmacyAssuranceProjection",
    objectKind: "projection",
    boundedContext: "pharmacy",
    authoritativeOwner: "Pharmacy console backend",
    sourceRef:
      "pharmacy-console-frontend-architecture.md#16.-Front-end-projection-set / Backend work / PharmacyAssuranceProjection",
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
  {
    canonicalName: "PharmacyBounceBackNormalizer",
    objectKind: "other",
    boundedContext: "pharmacy",
    authoritativeOwner: "Pharmacy loop domain",
    sourceRef:
      "phase-6-the-pharmacy-loop.md#6G. Bounce-back, urgent return, and reopen mechanics / Backend work / PharmacyBounceBackNormalizer",
  },
  {
    canonicalName: "PharmacyBounceBackRecordService",
    objectKind: "other",
    boundedContext: "pharmacy",
    authoritativeOwner: "Pharmacy loop domain",
    sourceRef:
      "phase-6-the-pharmacy-loop.md#6G. Bounce-back, urgent return, and reopen mechanics / Backend work / PharmacyBounceBackRecord service",
  },
  {
    canonicalName: "PharmacyReopenPriorityCalculator",
    objectKind: "other",
    boundedContext: "pharmacy",
    authoritativeOwner: "Pharmacy loop domain",
    sourceRef:
      "phase-6-the-pharmacy-loop.md#6G. Bounce-back, urgent return, and reopen mechanics / Backend work / PharmacyReopenPriorityCalculator",
  },
  {
    canonicalName: "PharmacyUrgentReturnChannelResolver",
    objectKind: "other",
    boundedContext: "pharmacy",
    authoritativeOwner: "Pharmacy loop domain",
    sourceRef:
      "phase-6-the-pharmacy-loop.md#6G. Bounce-back, urgent return, and reopen mechanics / Backend work / PharmacyUrgentReturnChannelResolver",
  },
  {
    canonicalName: "PharmacyReopenLeaseService",
    objectKind: "other",
    boundedContext: "pharmacy",
    authoritativeOwner: "Pharmacy loop domain",
    sourceRef:
      "phase-6-the-pharmacy-loop.md#6G. Bounce-back, urgent return, and reopen mechanics / Backend work / PharmacyReopenLeaseService",
  },
  {
    canonicalName: "PharmacyReturnReachabilityBridge",
    objectKind: "other",
    boundedContext: "pharmacy",
    authoritativeOwner: "Pharmacy loop domain",
    sourceRef:
      "phase-6-the-pharmacy-loop.md#6G. Bounce-back, urgent return, and reopen mechanics / Backend work / PharmacyReturnReachabilityBridge",
  },
  {
    canonicalName: "PharmacyBounceBackTruthProjectionBuilder",
    objectKind: "other",
    boundedContext: "pharmacy",
    authoritativeOwner: "Pharmacy loop domain",
    sourceRef:
      "phase-6-the-pharmacy-loop.md#6G. Bounce-back, urgent return, and reopen mechanics / Backend work / PharmacyBounceBackTruthProjectionBuilder",
  },
  {
    canonicalName: "PharmacyLoopSupervisorEscalationService",
    objectKind: "other",
    boundedContext: "pharmacy",
    authoritativeOwner: "Pharmacy loop domain",
    sourceRef:
      "phase-6-the-pharmacy-loop.md#6G. Bounce-back, urgent return, and reopen mechanics / Backend work / PharmacyLoopSupervisorEscalationService",
  },
  {
    canonicalName: "PharmacyOperationsProjectionBuilder",
    objectKind: "other",
    boundedContext: "pharmacy",
    authoritativeOwner: "Pharmacy loop domain",
    sourceRef:
      "phase-6-the-pharmacy-loop.md#6H. Practice visibility, operations queue, and pharmacy exception handling / Backend work / PharmacyOperationsProjectionBuilder",
  },
  {
    canonicalName: "PharmacyPracticeVisibilityProjectionBuilder",
    objectKind: "other",
    boundedContext: "pharmacy",
    authoritativeOwner: "Pharmacy loop domain",
    sourceRef:
      "phase-6-the-pharmacy-loop.md#6H. Practice visibility, operations queue, and pharmacy exception handling / Backend work / PharmacyPracticeVisibilityProjectionBuilder",
  },
  {
    canonicalName: "PharmacyExceptionClassifier",
    objectKind: "other",
    boundedContext: "pharmacy",
    authoritativeOwner: "Pharmacy loop domain",
    sourceRef:
      "phase-6-the-pharmacy-loop.md#6H. Practice visibility, operations queue, and pharmacy exception handling / Backend work / PharmacyExceptionClassifier",
  },
  {
    canonicalName: "PharmacyProviderHealthProjectionBuilder",
    objectKind: "other",
    boundedContext: "pharmacy",
    authoritativeOwner: "Pharmacy loop domain",
    sourceRef:
      "phase-6-the-pharmacy-loop.md#6H. Practice visibility, operations queue, and pharmacy exception handling / Backend work / PharmacyProviderHealthProjectionBuilder",
  },
  {
    canonicalName: "PharmacyWorklistDeltaService",
    objectKind: "other",
    boundedContext: "pharmacy",
    authoritativeOwner: "Pharmacy loop domain",
    sourceRef:
      "phase-6-the-pharmacy-loop.md#6H. Practice visibility, operations queue, and pharmacy exception handling / Backend work / PharmacyWorklistDeltaService",
  },
  {
    canonicalName: "PharmacyOperationsQueryService",
    objectKind: "other",
    boundedContext: "pharmacy",
    authoritativeOwner: "Pharmacy loop domain",
    sourceRef:
      "phase-6-the-pharmacy-loop.md#6H. Practice visibility, operations queue, and pharmacy exception handling / Backend work / PharmacyOperationsQueryService",
  },
  {
    canonicalName: "PharmacyConsoleSummaryProjectionBuilder",
    objectKind: "other",
    boundedContext: "pharmacy",
    authoritativeOwner: "Pharmacy console backend",
    sourceRef:
      "prompt/355.md / Mandatory APIs and module boundaries / PharmacyConsoleSummaryProjectionBuilder",
  },
  {
    canonicalName: "PharmacyConsoleWorklistProjectionBuilder",
    objectKind: "other",
    boundedContext: "pharmacy",
    authoritativeOwner: "Pharmacy console backend",
    sourceRef:
      "prompt/355.md / Mandatory APIs and module boundaries / PharmacyConsoleWorklistProjectionBuilder",
  },
  {
    canonicalName: "PharmacyCaseWorkbenchProjectionBuilder",
    objectKind: "other",
    boundedContext: "pharmacy",
    authoritativeOwner: "Pharmacy console backend",
    sourceRef:
      "prompt/355.md / Mandatory APIs and module boundaries / PharmacyCaseWorkbenchProjectionBuilder",
  },
  {
    canonicalName: "MedicationValidationProjectionBuilder",
    objectKind: "other",
    boundedContext: "pharmacy",
    authoritativeOwner: "Pharmacy console backend",
    sourceRef:
      "prompt/355.md / Mandatory APIs and module boundaries / MedicationValidationProjectionBuilder",
  },
  {
    canonicalName: "InventoryTruthProjectionBuilder",
    objectKind: "other",
    boundedContext: "pharmacy",
    authoritativeOwner: "Pharmacy console backend",
    sourceRef:
      "prompt/355.md / Mandatory APIs and module boundaries / InventoryTruthProjectionBuilder",
  },
  {
    canonicalName: "InventoryComparisonProjectionBuilder",
    objectKind: "other",
    boundedContext: "pharmacy",
    authoritativeOwner: "Pharmacy console backend",
    sourceRef:
      "prompt/355.md / Mandatory APIs and module boundaries / InventoryComparisonProjectionBuilder",
  },
  {
    canonicalName: "InventoryComparisonFenceService",
    objectKind: "other",
    boundedContext: "pharmacy",
    authoritativeOwner: "Pharmacy console backend",
    sourceRef:
      "prompt/355.md / Mandatory APIs and module boundaries / InventoryComparisonFenceService",
  },
  {
    canonicalName: "SupplyComputationService",
    objectKind: "other",
    boundedContext: "pharmacy",
    authoritativeOwner: "Pharmacy console backend",
    sourceRef:
      "prompt/355.md / Mandatory APIs and module boundaries / SupplyComputationService",
  },
  {
    canonicalName: "PharmacyHandoffProjectionBuilder",
    objectKind: "other",
    boundedContext: "pharmacy",
    authoritativeOwner: "Pharmacy console backend",
    sourceRef:
      "prompt/355.md / Mandatory APIs and module boundaries / PharmacyHandoffProjectionBuilder",
  },
  {
    canonicalName: "PharmacyActionSettlementProjectionBuilder",
    objectKind: "other",
    boundedContext: "pharmacy",
    authoritativeOwner: "Pharmacy console backend",
    sourceRef:
      "prompt/355.md / Mandatory APIs and module boundaries / PharmacyActionSettlementProjectionBuilder",
  },
  {
    canonicalName: "PharmacyConsoleContinuityEvidenceProjectionBuilder",
    objectKind: "other",
    boundedContext: "pharmacy",
    authoritativeOwner: "Pharmacy console backend",
    sourceRef:
      "prompt/355.md / Mandatory APIs and module boundaries / PharmacyConsoleContinuityEvidenceProjectionBuilder",
  },
  {
    canonicalName: "PharmacyAssuranceProjectionBuilder",
    objectKind: "other",
    boundedContext: "pharmacy",
    authoritativeOwner: "Pharmacy console backend",
    sourceRef:
      "prompt/355.md / Mandatory APIs and module boundaries / PharmacyAssuranceProjectionBuilder",
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
  {
    canonicalName: "PharmacyPracticeVisibilityProjection",
    objectKind: "projection",
    boundedContext: "pharmacy",
    authoritativeOwner: "Pharmacy loop domain",
    sourceRef:
      "phase-6-the-pharmacy-loop.md#6H. Practice visibility, operations queue, and pharmacy exception handling / Backend work / practice visibility model",
  },
  {
    canonicalName: "PharmacyBounceBackTruthProjection",
    objectKind: "projection",
    boundedContext: "pharmacy",
    authoritativeOwner: "Pharmacy loop domain",
    sourceRef:
      "phase-6-the-pharmacy-loop.md#6G. Bounce-back, urgent return, and reopen mechanics / Backend work / patient-safe and staff-safe reopen truth",
  },
  {
    canonicalName: "PharmacyPatientStatusProjection",
    objectKind: "projection",
    boundedContext: "pharmacy",
    authoritativeOwner: "Pharmacy loop domain",
    sourceRef:
      "phase-6-the-pharmacy-loop.md#6E. Patient instructions, referral status, and pharmacy-facing UX logic / Backend work / PharmacyPatientStatusProjection",
  },
  {
    canonicalName: "PharmacyPatientProviderSummary",
    objectKind: "projection",
    boundedContext: "pharmacy",
    authoritativeOwner: "Pharmacy loop domain",
    sourceRef:
      "phase-6-the-pharmacy-loop.md#6E. Patient instructions, referral status, and pharmacy-facing UX logic / Backend work / PharmacyPatientProviderSummary",
  },
  {
    canonicalName: "PharmacyPatientReferralReferenceSummary",
    objectKind: "projection",
    boundedContext: "pharmacy",
    authoritativeOwner: "Pharmacy loop domain",
    sourceRef:
      "phase-6-the-pharmacy-loop.md#6E. Patient instructions, referral status, and pharmacy-facing UX logic / Backend work / PharmacyPatientReferralReferenceSummary",
  },
  {
    canonicalName: "PharmacyPatientReachabilityRepairProjection",
    objectKind: "projection",
    boundedContext: "pharmacy",
    authoritativeOwner: "Pharmacy loop domain",
    sourceRef:
      "phase-6-the-pharmacy-loop.md#6E. Patient instructions, referral status, and pharmacy-facing UX logic / Backend work / PharmacyPatientReachabilityRepairProjection",
  },
  {
    canonicalName: "PharmacyPatientContinuityProjection",
    objectKind: "projection",
    boundedContext: "pharmacy",
    authoritativeOwner: "Pharmacy loop domain",
    sourceRef:
      "phase-6-the-pharmacy-loop.md#6E. Patient instructions, referral status, and pharmacy-facing UX logic / Backend work / PharmacyPatientContinuityProjection",
  },
  {
    canonicalName: "PharmacyPatientInstructionPanel",
    objectKind: "projection",
    boundedContext: "pharmacy",
    authoritativeOwner: "Pharmacy loop domain",
    sourceRef:
      "phase-6-the-pharmacy-loop.md#6E. Patient instructions, referral status, and pharmacy-facing UX logic / Backend work / PharmacyPatientInstructionPanel",
  },
  {
    canonicalName: "PharmacyActiveCasesProjection",
    objectKind: "projection",
    boundedContext: "pharmacy",
    authoritativeOwner: "Pharmacy loop domain",
    sourceRef:
      "phase-6-the-pharmacy-loop.md#6H. Practice visibility, operations queue, and pharmacy exception handling / Backend work / pharmacy_active_cases_projection",
  },
  {
    canonicalName: "PharmacyWaitingForChoiceProjection",
    objectKind: "projection",
    boundedContext: "pharmacy",
    authoritativeOwner: "Pharmacy loop domain",
    sourceRef:
      "phase-6-the-pharmacy-loop.md#6H. Practice visibility, operations queue, and pharmacy exception handling / Backend work / pharmacy_waiting_for_choice_projection",
  },
  {
    canonicalName: "PharmacyDispatchedWaitingOutcomeProjection",
    objectKind: "projection",
    boundedContext: "pharmacy",
    authoritativeOwner: "Pharmacy loop domain",
    sourceRef:
      "phase-6-the-pharmacy-loop.md#6H. Practice visibility, operations queue, and pharmacy exception handling / Backend work / pharmacy_dispatched_waiting_outcome_projection",
  },
  {
    canonicalName: "PharmacyBounceBackProjection",
    objectKind: "projection",
    boundedContext: "pharmacy",
    authoritativeOwner: "Pharmacy loop domain",
    sourceRef:
      "phase-6-the-pharmacy-loop.md#6H. Practice visibility, operations queue, and pharmacy exception handling / Backend work / pharmacy_bounce_back_projection",
  },
  {
    canonicalName: "PharmacyDispatchExceptionProjection",
    objectKind: "projection",
    boundedContext: "pharmacy",
    authoritativeOwner: "Pharmacy loop domain",
    sourceRef:
      "phase-6-the-pharmacy-loop.md#6H. Practice visibility, operations queue, and pharmacy exception handling / Backend work / pharmacy_dispatch_exception_projection",
  },
  {
    canonicalName: "PharmacyProviderHealthProjection",
    objectKind: "projection",
    boundedContext: "pharmacy",
    authoritativeOwner: "Pharmacy loop domain",
    sourceRef:
      "phase-6-the-pharmacy-loop.md#6H. Practice visibility, operations queue, and pharmacy exception handling / Backend work / pharmacy_provider_health_projection",
  },
  {
    canonicalName: "PharmacyConsoleSummaryProjection",
    objectKind: "projection",
    boundedContext: "pharmacy",
    authoritativeOwner: "Pharmacy console backend",
    sourceRef:
      "pharmacy-console-frontend-architecture.md#16.-Front-end-projection-set / Backend work / PharmacyConsoleSummaryProjection",
  },
  {
    canonicalName: "PharmacyConsoleWorklistProjection",
    objectKind: "projection",
    boundedContext: "pharmacy",
    authoritativeOwner: "Pharmacy console backend",
    sourceRef:
      "pharmacy-console-frontend-architecture.md#16.-Front-end-projection-set / Backend work / PharmacyConsoleWorklistProjection",
  },
  {
    canonicalName: "PharmacyCaseWorkbenchProjection",
    objectKind: "projection",
    boundedContext: "pharmacy",
    authoritativeOwner: "Pharmacy console backend",
    sourceRef:
      "pharmacy-console-frontend-architecture.md#16.-Front-end-projection-set / Backend work / PharmacyCaseWorkbenchProjection",
  },
  {
    canonicalName: "PharmacyMissionProjection",
    objectKind: "projection",
    boundedContext: "pharmacy",
    authoritativeOwner: "Pharmacy console backend",
    sourceRef:
      "pharmacy-console-frontend-architecture.md#16.-Front-end-projection-set / Backend work / PharmacyMissionProjection",
  },
  {
    canonicalName: "MedicationValidationProjection",
    objectKind: "projection",
    boundedContext: "pharmacy",
    authoritativeOwner: "Pharmacy console backend",
    sourceRef:
      "pharmacy-console-frontend-architecture.md#16.-Front-end-projection-set / Backend work / MedicationValidationProjection",
  },
  {
    canonicalName: "InventoryTruthProjection",
    objectKind: "projection",
    boundedContext: "pharmacy",
    authoritativeOwner: "Pharmacy console backend",
    sourceRef:
      "pharmacy-console-frontend-architecture.md#16.-Front-end-projection-set / Backend work / InventoryTruthProjection",
  },
  {
    canonicalName: "InventoryComparisonProjection",
    objectKind: "projection",
    boundedContext: "pharmacy",
    authoritativeOwner: "Pharmacy console backend",
    sourceRef:
      "pharmacy-console-frontend-architecture.md#16.-Front-end-projection-set / Backend work / InventoryComparisonProjection",
  },
  {
    canonicalName: "PharmacyHandoffProjection",
    objectKind: "projection",
    boundedContext: "pharmacy",
    authoritativeOwner: "Pharmacy console backend",
    sourceRef:
      "pharmacy-console-frontend-architecture.md#16.-Front-end-projection-set / Backend work / PharmacyHandoffProjection",
  },
  {
    canonicalName: "PharmacyHandoffWatchProjection",
    objectKind: "projection",
    boundedContext: "pharmacy",
    authoritativeOwner: "Pharmacy console backend",
    sourceRef:
      "pharmacy-console-frontend-architecture.md#16.-Front-end-projection-set / Backend work / PharmacyHandoffWatchProjection",
  },
  {
    canonicalName: "PharmacyActionSettlementProjection",
    objectKind: "projection",
    boundedContext: "pharmacy",
    authoritativeOwner: "Pharmacy console backend",
    sourceRef:
      "pharmacy-console-frontend-architecture.md#16.-Front-end-projection-set / Backend work / PharmacyActionSettlementProjection",
  },
  {
    canonicalName: "PharmacyConsentCheckpointProjection",
    objectKind: "projection",
    boundedContext: "pharmacy",
    authoritativeOwner: "Pharmacy console backend",
    sourceRef:
      "pharmacy-console-frontend-architecture.md#16.-Front-end-projection-set / Backend work / PharmacyConsentCheckpointProjection",
  },
  {
    canonicalName: "PharmacyConsoleContinuityEvidenceProjection",
    objectKind: "projection",
    boundedContext: "pharmacy",
    authoritativeOwner: "Pharmacy console backend",
    sourceRef:
      "pharmacy-console-frontend-architecture.md#16.-Front-end-projection-set / Backend work / PharmacyConsoleContinuityEvidenceProjection",
  },
  {
    canonicalName: "PharmacyAssuranceProjection",
    objectKind: "projection",
    boundedContext: "pharmacy",
    authoritativeOwner: "Pharmacy console backend",
    sourceRef:
      "pharmacy-console-frontend-architecture.md#16.-Front-end-projection-set / Backend work / PharmacyAssuranceProjection",
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

export {
  PHARMACY_RECOVERY_CONTROL_VISUAL_MODE,
  pharmacyBounceBackRecoveryPreviewCases,
  resolvePharmacyBounceBackRecoveryPreview,
} from "./phase6-pharmacy-bounce-back-preview";
export {
  PHARMACY_PRODUCT_MERGE_VISUAL_MODE,
  pharmacyProductMergePreviewCases,
  resolvePharmacyProductMergePreviewForCase,
  resolvePharmacyProductMergePreviewForMessageCluster,
  resolvePharmacyProductMergePreviewForOpsAnomaly,
  resolvePharmacyProductMergePreviewForRequest,
} from "./phase6-pharmacy-product-merge-preview";
export {
  createPhase6PharmacyBounceBackService,
  createPhase6PharmacyBounceBackStore,
} from "./phase6-pharmacy-bounce-back-engine";
export {
  createPhase6PharmacyCaseKernelService,
  createPhase6PharmacyCaseKernelStore,
} from "./phase6-pharmacy-case-kernel";
export {
  createPhase6PharmacyEligibilityEngineService,
  createPhase6PharmacyEligibilityStore,
  phase6PharmacyPathwayCodes,
  pharmacyRuleThresholdIds,
} from "./phase6-pharmacy-eligibility-engine";
export {
  PHARMACY_ELIGIBILITY_CLARITY_VISUAL_MODE,
  pharmacyEligibilityPreviewCases,
  resolvePharmacyEligibilityPreview,
} from "./phase6-pharmacy-eligibility-preview";
export {
  PHARMACY_ASSURANCE_WORKBENCH_VISUAL_MODE,
  pharmacyOutcomeAssurancePreviewCases,
  resolvePharmacyOutcomeAssurancePreview,
} from "./phase6-pharmacy-outcome-assurance-preview";
export {
  PHARMACY_CHOOSER_PREMIUM_VISUAL_MODE,
  pharmacyChoicePreviewCases,
  resolvePharmacyChoicePreview,
} from "./phase6-pharmacy-choice-preview";
export {
  createPhase6PharmacyDirectoryChoiceEngineService,
  createPhase6PharmacyDirectoryChoiceStore,
  createStaticPharmacyDiscoveryAdapter,
  defaultDirectoryChoiceRankingPolicy,
} from "./phase6-pharmacy-directory-choice-engine";
export {
  createPhase6PharmacyReferralPackageService,
  createPhase6PharmacyReferralPackageStore,
} from "./phase6-pharmacy-referral-package-engine";
export {
  createDeterministicPharmacyDispatchAdapter,
  createPhase6PharmacyDispatchService,
  createPhase6PharmacyDispatchStore,
} from "./phase6-pharmacy-dispatch-engine";
export {
  createPhase6PharmacyPatientStatusService,
  createPhase6PharmacyPatientStatusStore,
} from "./phase6-pharmacy-patient-status-engine";
export {
  defaultPharmacyOperationsPolicy,
  createPhase6PharmacyOperationsService,
  createPhase6PharmacyOperationsStore,
} from "./phase6-pharmacy-operations-engine";
export {
  createInventoryComparisonProjectionBuilder,
  createInventoryTruthProjectionBuilder,
  createMedicationValidationProjectionBuilder,
  createPhase6PharmacyConsoleBackendService,
  createPhase6PharmacyConsoleStore,
  createPharmacyActionSettlementProjectionBuilder,
  createPharmacyAssuranceProjectionBuilder,
  createPharmacyCaseWorkbenchProjectionBuilder,
  createPharmacyConsoleContinuityEvidenceProjectionBuilder,
  createPharmacyConsoleSummaryProjectionBuilder,
  createPharmacyConsoleWorklistProjectionBuilder,
  createPharmacyHandoffProjectionBuilder,
  createSupplyComputationService,
} from "./phase6-pharmacy-console-engine";
export {
  createPhase6PharmacyOutcomeReconciliationService,
  createPhase6PharmacyOutcomeStore,
  createPharmacyOutcomeSourceRegistry,
  createPharmacyOutcomeReplayClassifier,
  createPharmacyOutcomeEnvelopeWriter,
  createPharmacyOutcomeMatcher,
  createPharmacyOutcomeSafetyBridge,
  createPharmacyOutcomeSettlementService,
  createPharmacyOutcomeTruthProjectionBuilder,
  defaultPharmacyOutcomeMatchingPolicy,
} from "./phase6-pharmacy-outcome-reconciliation-engine";
export type {
  OpenOriginalRequestActionSnapshot,
  PharmacyBounceBackQueueItemSnapshot,
  PharmacyBounceBackQueueSnapshot,
  PharmacyBounceBackRecordBinding,
  PharmacyBounceBackRecoveryPreviewSnapshot,
  PharmacyBounceBackTruthBinding,
  PharmacyLoopRiskEscalationCardSnapshot,
  PharmacyLoopSupervisorBinding,
  PharmacyRecoveryDecisionDockActionSnapshot,
  PharmacyRecoveryDecisionDockSnapshot,
  PharmacyRecoverySurfaceState,
  PharmacyRecoveryTone,
  PharmacyRecoveryVisibilityBinding,
  PharmacyReopenedCaseBannerSnapshot,
  PharmacyReopenDiffRowSnapshot,
  PharmacyReopenDiffStripSnapshot,
  PharmacyReturnMessagePreviewSnapshot,
  PharmacyReturnNotificationBinding,
  PharmacyUrgentReturnModeSnapshot,
  PharmacyUrgentRouteBinding,
} from "./phase6-pharmacy-bounce-back-preview";
export type {
  PharmacyLoopMergeEntryMode,
  PharmacyLoopMergeMessageState,
  PharmacyLoopMergeMessageVisibility,
  PharmacyLoopMergeNotificationSnapshot,
  PharmacyLoopMergeOpsSnapshot,
  PharmacyLoopMergeSeverity,
  PharmacyLoopMergeSnapshot,
  PharmacyLoopMergeState,
} from "./phase6-pharmacy-product-merge-preview";
export type {
  IngestPharmacyBounceBackInput,
  Phase6PharmacyBounceBackRepositories,
  Phase6PharmacyBounceBackService,
  Phase6PharmacyBounceBackServiceDependencies,
  Phase6PharmacyBounceBackStore,
  PharmacyBounceBackCommandResult,
  PharmacyBounceBackNormalizer,
  PharmacyBounceBackEvidenceEnvelopeSnapshot,
  PharmacyBounceBackEvidenceSourceKind,
  PharmacyBounceBackEvidenceTrustClass,
  PharmacyBounceBackRecordService,
  PharmacyBounceBackLoopSupervisorPosture,
  PharmacyBounceBackSupervisorResolution,
  PharmacyBounceBackSupervisorReviewSnapshot,
  PharmacyBounceBackTruthProjectionSnapshot,
  PharmacyBounceBackTruthProjectionBuilder,
  PharmacyPracticeGpActionRequiredState,
  PharmacyPracticeLatestPatientInstructionState,
  PharmacyPracticeMinimumNecessaryAudienceView,
  PharmacyPracticeReachabilityRepairState,
  PharmacyPracticeTriageReentryState,
  PharmacyPracticeUrgentReturnState,
  PharmacyPracticeVisibilityProjectionSnapshot,
  PharmacyReturnNotificationChannelHint,
  PharmacyReturnNotificationState,
  PharmacyReturnNotificationTriggerSnapshot,
  PharmacyReturnReachabilityBridge,
  PharmacyReopenLeaseService,
  PharmacyReopenPriorityCalculator,
  PreviewPharmacyBounceBackInput,
  PreviewPharmacyBounceBackResult,
  ReopenPharmacyCaseFromBounceBackInput,
  ResolvePharmacyBounceBackSupervisorReviewInput,
  PharmacyUrgentReturnChannelResolver,
  PharmacyLoopSupervisorEscalationService,
  UrgentReturnDirectRouteProfileSnapshot,
  UrgentReturnRouteClass,
} from "./phase6-pharmacy-bounce-back-engine";
export type {
  AggregateRef,
  CapturePharmacyOutcomeInput,
  ChoosePharmacyProviderInput,
  ClosePharmacyCaseInput,
  CreatePharmacyCaseInput,
  DispatchPharmacyReferralInput,
  EvaluatePharmacyCaseInput,
  PharmacyAuthorityVerificationResult,
  PharmacyCaseBundle,
  PharmacyCaseEventJournalEntrySnapshot,
  PharmacyCaseMutationResult,
  PharmacyCaseSnapshot,
  PharmacyCaseStatus,
  PharmacyCaseTransitionJournalEntrySnapshot,
  PharmacyConsentCheckpointState,
  PharmacyDispatchProofState,
  PharmacyOutcomeDisposition,
  PharmacyPathwayCode,
  PharmacyScopedMutationGateState,
  PharmacyServiceType,
  PharmacyStaleOwnershipRecoveryRecordSnapshot,
  Phase6PharmacyCaseKernelRepositories,
  Phase6PharmacyCaseKernelService,
  Phase6PharmacyCaseKernelStore,
  ReopenPharmacyCaseInput,
  ReservePharmacyCaseMutationAuthorityInput,
  VerifyPharmacyCaseMutationAuthorityInput,
} from "./phase6-pharmacy-case-kernel";
export type {
  DispatchAdapterBindingSnapshot,
  DispatchEvidenceLane,
  DispatchEvidenceObservationSnapshot,
  DispatchProofEnvelopeSnapshot,
  DispatchProofState,
  DispatchRiskState,
  DispatchStateConfidenceBand,
  DispatchTransportAcceptanceState,
  ExpireStaleDispatchAttemptsInput,
  IngestDispatchEvidenceInput,
  ManualDispatchAssistanceRecordSnapshot,
  ManualDispatchAttestationState,
  MarkDispatchContradictionInput,
  Phase6PharmacyDispatchRepositories,
  Phase6PharmacyDispatchService,
  Phase6PharmacyDispatchStore,
  PharmacyContinuityEvidenceProjectionSnapshot,
  PharmacyDispatchAdapter,
  PharmacyDispatchAttemptSnapshot,
  PharmacyDispatchAttemptStatus,
  PharmacyDispatchAuditEventSnapshot,
  PharmacyDispatchBundle,
  PharmacyDispatchCommandResult,
  PharmacyDispatchPayloadSnapshot,
  PharmacyDispatchPlanBundle,
  PharmacyDispatchPlanSnapshot,
  PharmacyDispatchPlanState,
  PharmacyDispatchRouteBindingInput,
  PharmacyDispatchSettlementResult,
  PharmacyDispatchSettlementSnapshot,
  PharmacyDispatchTruthProjectionSnapshot,
  PlanPharmacyDispatchInput,
  RecordManualDispatchAssistanceInput,
  ReferralArtifactManifestSnapshot,
  ResendPharmacyDispatchInput,
  SubmitPharmacyDispatchInput,
  TransportAssuranceProfileSnapshot,
} from "./phase6-pharmacy-dispatch-engine";
export type {
  PatientExperienceContinuityEvidenceProjectionSnapshot,
  PatientExperienceContinuityValidationState,
  PatientShellConsistencyProjectionSnapshot,
  PatientShellConsistencyState,
  Phase6PharmacyOutcomeTruthProjectionReader,
  Phase6PharmacyPatientStatusRepositories,
  Phase6PharmacyPatientStatusService,
  Phase6PharmacyPatientStatusServiceDependencies,
  Phase6PharmacyPatientStatusStore,
  PharmacyOutcomeTruthProjectionSnapshot,
  PharmacyPatientContinuityFreshnessState,
  PharmacyPatientContinuityProjectionSnapshot,
  PharmacyPatientInstructionPanelSnapshot,
  PharmacyPatientProviderSummaryDetailVisibilityState,
  PharmacyPatientProviderSummarySnapshot,
  PharmacyPatientReachabilityRepairProjectionSnapshot,
  PharmacyPatientReferralReferenceDisplayMode,
  PharmacyPatientReferralReferenceSummarySnapshot,
  PharmacyPatientRepairProjectionState,
  PharmacyPatientStatusAuditEventSnapshot,
  PharmacyPatientStatusBundle,
  PharmacyPatientStatusProjectionSnapshot,
  PharmacyPatientStatusStaleOrBlockedPosture,
  PharmacyReachabilityDominantBrokenDependency,
  PharmacyReachabilityPlanSnapshot,
  ProjectPharmacyPatientStatusInput,
} from "./phase6-pharmacy-patient-status-engine";
export type {
  Phase6PharmacyOperationsRepositories,
  Phase6PharmacyOperationsService,
  Phase6PharmacyOperationsServiceDependencies,
  Phase6PharmacyOperationsStore,
  PharmacyActiveCasesProjectionSnapshot,
  PharmacyDispatchExceptionProjectionSnapshot,
  PharmacyDispatchedWaitingOutcomeProjectionSnapshot,
  PharmacyExceptionClassifier,
  PharmacyExceptionEvidenceBundle,
  PharmacyOperationsAuditEventSnapshot,
  PharmacyOperationsContinuityState,
  PharmacyOperationsFreshnessState,
  PharmacyOperationsProjectionBuilder,
  PharmacyOperationsQueryService,
  PharmacyOperationsReviewDebtState,
  PharmacyOperationsSeverity,
  PharmacyOperationsWorklistFamily,
  PharmacyOperationsWorklistQueryInput,
  PharmacyPracticeDispatchState,
  PharmacyPracticeVisibilityModelSnapshot,
  PharmacyPracticeVisibilityProjectionBuilder,
  PharmacyProviderDispatchHealthState,
  PharmacyProviderDiscoveryAvailabilityState,
  PharmacyProviderHealthDetail,
  PharmacyProviderHealthProjectionBuilder,
  PharmacyProviderHealthProjectionSnapshot,
  PharmacyProviderHealthQueryInput,
  PharmacyProviderTransportHealthSummary,
  PharmacyOperationsQueueAgeingSummary,
  PharmacySeenProjectionVersion,
  PharmacyWaitingForChoiceProjectionSnapshot,
  PharmacyWorklistDeltaEntry,
  PharmacyWorklistDeltaResult,
  PharmacyWorklistDeltaService,
  PharmacyWorklistSummary,
  PharmacyBounceBackProjectionSnapshot,
  PharmacyOperationsExceptionClass,
} from "./phase6-pharmacy-operations-engine";
export type {
  InventoryComparisonCandidateProjection,
  InventoryComparisonFenceService,
  InventoryComparisonFenceSnapshot,
  InventoryComparisonProjectionBuilder,
  InventoryComparisonProjectionSnapshot,
  InventoryEquivalenceClass,
  InventoryExpiryBand,
  InventoryFreshnessConfidenceState,
  InventoryFreshnessState,
  InventoryReservationState,
  InventorySubstitutionPolicyState,
  InventorySupportRecordSnapshot,
  InventoryTruthProjectionBuilder,
  InventoryTruthProjectionSnapshot,
  InventoryTruthRecordProjection,
  InventoryTrustState,
  LineCheckpointEvaluationSnapshot,
  MedicationCheckpointDerivedState,
  MedicationLineState,
  MedicationValidationCardProjection,
  MedicationValidationProjectionBuilder,
  MedicationValidationProjectionSnapshot,
  PharmacyActionCanonicalSettlementType,
  PharmacyActionSettlementAgreementState,
  PharmacyActionSettlementProjectionBuilder,
  PharmacyActionSettlementProjectionSnapshot,
  PharmacyAssuranceProjectionBuilder,
  PharmacyAssuranceProjectionSnapshot,
  PharmacyAssuranceState,
  PharmacyCaseWorkbenchProjectionBuilder,
  PharmacyCaseWorkbenchProjectionSnapshot,
  PharmacyConsoleAuditEventSnapshot,
  PharmacyConsoleContinuityEvidenceProjectionBuilder,
  PharmacyConsoleContinuityEvidenceProjectionSnapshot,
  PharmacyConsoleContinuityValidationState,
  PharmacyConsoleSummaryProjectionBuilder,
  PharmacyConsoleSummaryProjectionSnapshot,
  PharmacyConsoleSupportRegion,
  PharmacyConsoleWorklistProjectionBuilder,
  PharmacyConsoleWorklistProjectionSnapshot,
  PharmacyConsentCheckpointProjection,
  PharmacyHandoffProjectionBuilder,
  PharmacyHandoffProjectionSnapshot,
  PharmacyHandoffReadinessState,
  PharmacyHandoffWatchProjectionSnapshot,
  PharmacyHandoffWatchState,
  PharmacyMedicationLineStateSnapshot,
  PharmacyMissionProjectionSnapshot,
  Phase6PharmacyConsoleBackendService,
  Phase6PharmacyConsoleBackendServiceDependencies,
  Phase6PharmacyConsoleRepositories,
  Phase6PharmacyConsoleStore,
  SupplyComputationService,
  SupplyComputationSnapshot,
  SupplyComputationState,
} from "./phase6-pharmacy-console-engine";
export type {
  IngestPharmacyOutcomeEvidenceInput,
  MatchPharmacyOutcomeEvidenceResult,
  NormalizedPharmacyOutcomeEvidenceSnapshot,
  OutcomeEvidenceEnvelopeSnapshot,
  ParsePharmacyOutcomeEvidenceInput,
  ParsedPharmacyOutcomeEvidence,
  Phase6PharmacyOutcomeReconciliationService,
  Phase6PharmacyOutcomeRepositories,
  Phase6PharmacyOutcomeStore,
  Phase6PharmacyOutcomeTruthProjectionRepositories,
  PharmacyOutcomeAuditEventSnapshot,
  PharmacyOutcomeBlockingClosureState,
  PharmacyOutcomeCloseEligibilityState,
  PharmacyOutcomeCommandResult,
  PharmacyOutcomeDecisionClass,
  PharmacyOutcomeDedupeState,
  PharmacyOutcomeEnvelopeWriter,
  PharmacyOutcomeGatePatientVisibilityState,
  PharmacyOutcomeGateState,
  PharmacyOutcomeIngestAttemptSnapshot,
  PharmacyOutcomeIngestSettlementState,
  PharmacyOutcomeManualReviewState,
  PharmacyOutcomeMatchConfidenceBand,
  PharmacyOutcomeMatchPreview,
  PharmacyOutcomeMatchScorecardSnapshot,
  PharmacyOutcomeMatchState,
  PharmacyOutcomeMatcher,
  PharmacyOutcomeMatchingPolicySnapshot,
  PharmacyOutcomeReplayClassifier,
  PharmacyOutcomeReplayDecision,
  PharmacyOutcomeReviewCloseBlockPosture,
  PharmacyOutcomeReviewDebtItem,
  PharmacyOutcomeReviewResolutionResult,
  PharmacyOutcomeSafetyBridge,
  PharmacyOutcomeSettlementResult,
  PharmacyOutcomeSettlementService,
  PharmacyOutcomeSettlementSnapshot,
  PharmacyOutcomeSourceProvenanceSnapshot,
  PharmacyOutcomeSourceRegistry,
  PharmacyOutcomeSourceType,
  PharmacyOutcomeTrustClass,
  PharmacyOutcomeTruthProjectionBuilder,
  PharmacyOutcomeReconciliationGateSnapshot,
  PreviewPharmacyOutcomeEvidenceResult,
  ResolvePharmacyOutcomeReconciliationGateInput,
} from "./phase6-pharmacy-outcome-reconciliation-engine";
export type {
  CompiledPharmacyRulePackSnapshot,
  EligibilityExplanationBundleSnapshot,
  EvaluateCurrentPharmacyCaseInput,
  EvaluateCurrentPharmacyCaseResult,
  NamedPharmacyPathwayCode,
  PathwayDefinitionSnapshot,
  PathwayEligibilityEvaluationSnapshot,
  PathwayEvaluationCandidateSnapshot,
  PathwayTimingGuardrailSnapshot,
  PharmacyEligibilityEvidenceSnapshot,
  PharmacyEligibilityEvaluationResult,
  PharmacyEligibilityFinalDisposition,
  PharmacyGlobalRuleDefinition,
  PharmacyGoldenCaseRegressionEntry,
  PharmacyGoldenCaseRegressionResult,
  PharmacyGoldenCaseSnapshot,
  PharmacyMinorIllnessFeatureDefinition,
  PharmacyMinorIllnessPolicySnapshot,
  PharmacyPatientMacroState,
  PharmacyPathwayGateResult,
  PharmacyRecommendedLane,
  PharmacyRulePackComparisonResult,
  PharmacyRulePackDraftInput,
  PharmacyRulePackOverlapStrategy,
  PharmacyRulePackSnapshot,
  PharmacyRulePackState,
  PharmacyRuleThresholdId,
  PharmacyRulePackThresholdValues,
  PharmacyRulePackValidationResult,
  PharmacySexAtBirth,
  PharmacySymptomEvidenceSnapshot,
  Phase6PharmacyEligibilityEngineService,
  Phase6PharmacyEligibilityRepositories,
  Phase6PharmacyEligibilityStore,
  RequiredSymptomWeightRefSnapshot,
  ThresholdSnapshotEntry,
} from "./phase6-pharmacy-eligibility-engine";
export type {
  OutcomeAssuranceHeaderSnapshot,
  OutcomeConfidenceBreakdownSnapshot,
  OutcomeConfidenceMeterSnapshot,
  OutcomeDecisionDockActionSnapshot,
  OutcomeDecisionDockSnapshot,
  OutcomeEvidenceDrawerGroupSnapshot,
  OutcomeEvidenceDrawerRowSnapshot,
  OutcomeEvidenceDrawerSnapshot,
  OutcomeEvidenceSourceCardSnapshot,
  OutcomeGateTimelineSnapshot,
  OutcomeGateTimelineStepSnapshot,
  OutcomeManualReviewBannerSnapshot,
  OutcomeMatchSummarySnapshot,
  PharmacyOutcomeAssurancePreviewSnapshot,
  PharmacyOutcomeAssuranceSurfaceState,
  PharmacyOutcomeAssuranceTone,
} from "./phase6-pharmacy-outcome-assurance-preview";
export type {
  PharmacyEligibilityEvidenceSummaryRow,
  PharmacyEligibilityGateState,
  PharmacyEligibilityGateViewModel,
  PharmacyEligibilityNextStepPanel,
  PharmacyEligibilityPolicyPackMeta,
  PharmacyEligibilityPreviewSnapshot,
  PharmacyEligibilityPublicationState,
  PharmacyEligibilitySupersessionNotice,
} from "./phase6-pharmacy-eligibility-preview";
export type {
  PharmacyChoiceChipTone,
  PharmacyChoiceDriftRecoverySnapshot,
  PharmacyChoiceFilterBucketKey,
  PharmacyChoiceFilterBucketSnapshot,
  PharmacyChoiceGroupKey,
  PharmacyChoiceMapPoint,
  PharmacyChoicePreviewSnapshot,
  PharmacyChoiceProviderCardSnapshot,
  PharmacyChoiceReasonChip,
  PharmacyChoiceWarningAcknowledgementSnapshot,
  PharmacyChosenProviderReviewSnapshot,
} from "./phase6-pharmacy-choice-preview";
export type {
  DirectoryChoiceRankingPolicy,
  PharmacyChoiceAudience,
  PharmacyChoiceDisclosurePolicy,
  PharmacyChoiceExplanation,
  PharmacyChoiceOverrideAcknowledgement,
  PharmacyChoiceProjectionState,
  PharmacyChoiceProof,
  PharmacyChoiceRefreshMode,
  PharmacyChoiceSession,
  PharmacyChoiceSessionState,
  PharmacyChoiceTruthProjection,
  PharmacyConsentCaptureChannel,
  PharmacyConsentCaptureResult,
  PharmacyConsentCheckpoint,
  PharmacyConsentContinuityState,
  PharmacyConsentRecord,
  PharmacyConsentRecordState,
  PharmacyConsentRevocationReasonClass,
  PharmacyConsentRevocationRecord,
  PharmacyConsentRevocationResult,
  PharmacyConsentRevocationState,
  PharmacyDirectoryChoiceBundle,
  PharmacyDirectoryFailureClassification,
  PharmacyDirectoryFreshnessPosture,
  PharmacyDirectoryRankingInputs,
  PharmacyDirectorySnapshot,
  PharmacyDirectorySourceSnapshot,
  PharmacyDirectorySourceStatus,
  PharmacyDirectorySourceTrustClass,
  PharmacyDiscoveryAdapter,
  PharmacyDiscoveryAdapterMode,
  PharmacyDiscoveryAdapterProviderCandidate,
  PharmacyDiscoveryAdapterQuery,
  PharmacyDiscoveryAdapterResponse,
  PharmacyLocationInput,
  PharmacyNormalizationProvenance,
  PharmacyOpeningState,
  PharmacyProvider,
  PharmacyProviderCapabilitySnapshot,
  PharmacyProviderCapabilityState,
  PharmacySelectionResult,
  PharmacyTransportMode,
  PharmacyWarnedChoiceAcknowledgementResult,
  Phase6PharmacyDirectoryChoiceEngineService,
  Phase6PharmacyDirectoryChoiceRepositories,
  Phase6PharmacyDirectoryChoiceStore,
} from "./phase6-pharmacy-directory-choice-engine";
export type {
  PharmacyComposeReferralPackageDraftInput,
  PharmacyCorrelationAcknowledgementState,
  PharmacyCorrelationAuthoritativeDispatchProofState,
  PharmacyCorrelationRecordSnapshot,
  PharmacyFreezeReferralPackageInput,
  PharmacyInvalidateReferralPackageInput,
  PharmacyPackageArtifactContentState,
  PharmacyPackageArtifactSnapshot,
  PharmacyPackageArtifactClass,
  PharmacyPackageContentDecisionState,
  PharmacyPackageContentGovernanceDecisionSnapshot,
  PharmacyPackageTupleValidationResult,
  PharmacyReferralPackageBundle,
  PharmacyReferralPackageContentInput,
  PharmacyReferralPackageFreezeRecordSnapshot,
  PharmacyReferralPackageFreezeResult,
  PharmacyReferralPackageInvalidationRecordSnapshot,
  PharmacyReferralPackageRepresentationReplayResult,
  PharmacyReferralPackageSnapshot,
  PharmacyReferralPackageState,
  PharmacyReferralPackageSupersessionRecordSnapshot,
  PharmacyReferralRouteIntentTupleInput,
  PharmacyReferralStructuredContentInput,
  PharmacyReferralSupportingArtifactInput,
  PharmacySupersedeReferralPackageInput,
  PharmacyValidateReferralPackageInput,
  Phase6PharmacyReferralPackageRepositories,
  Phase6PharmacyReferralPackageService,
  Phase6PharmacyReferralPackageStore,
} from "./phase6-pharmacy-referral-package-engine";
